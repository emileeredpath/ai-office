import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { EmailCampaignRecord, EmailPerformanceResponse } from '@/services/emailPerformanceApi';
import type { Ga4EducationAttributionResponse, Ga4BrandEducationAttribution } from '@/services/ga4Api';

// Education 2026 campaign roll-up. Membership is decided ENTIRELY by the
// backend's parsed `emailCampaignGroup` field (see
// backend/src/services/campaignMonitor.ts's parseEducationSegment doc
// comment) — never by fuzzy-matching a subject line or campaign name here.
//
// Deliberate departure from every other page's "MTech Group" scope: the
// rest of the app (see src/utils/groupEntities.ts) defines "MTech Group"
// as only Brentwood/Radio Links/Capcom/Irish Radio, excluding `mtech`
// (originally a fallback bucket for an unparseable name). The Education
// campaign genuinely, deliberately spans BOTH those four existing-customer
// brands AND real group-wide new-prospect outreach (Scotland/Northern
// Ireland/Republic of Ireland), which is honestly attributed to `mtech`
// because it isn't any one brand. Excluding those geography segments here
// would make the roll-up itself nonsensical, so this file intentionally
// does NOT filter by GROUP_AGGREGATE_BRANDS — "MTech Group" (isGroupView)
// means every real Education send, whichever brand value it carries.
export function getEducationSends(
  data: EmailPerformanceResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EmailCampaignRecord[] {
  if (!data || !data.configured) return [];
  const educationSends = data.campaigns.filter((c) => c.emailCampaignGroup === 'education_2026');
  if (isGroupView) return educationSends;
  return educationSends.filter((c) => c.brand === selectedEntity);
}

export interface EducationRollupRow {
  key: string;
  label: string;
  sends: number;
  recipients: number;
  delivered: number;
  deliveryRate: number | null;
  uniqueOpens: number;
  uniqueOpenRate: number | null;
  clicks: number;
  clickRate: number | null;
  clickToOpenRate: number | null;
  bounces: number;
  unsubscribes: number;
}

function sumOf(sends: EmailCampaignRecord[], field: keyof EmailCampaignRecord): number {
  return sends.reduce((sum, s) => sum + ((s[field] as number | null) ?? 0), 0);
}

function buildRollupRow(key: string, label: string, sends: EmailCampaignRecord[]): EducationRollupRow {
  const recipients = sumOf(sends, 'recipients');
  const delivered = sumOf(sends, 'delivered');
  const uniqueOpens = sumOf(sends, 'uniqueOpens');
  const clicks = sumOf(sends, 'clicks');
  return {
    key,
    label,
    sends: sends.length,
    recipients,
    delivered,
    deliveryRate: recipients > 0 ? Math.round((delivered / recipients) * 1000) / 10 : null,
    uniqueOpens,
    uniqueOpenRate: recipients > 0 ? Math.round((uniqueOpens / recipients) * 1000) / 10 : null,
    clicks,
    clickRate: recipients > 0 ? Math.round((clicks / recipients) * 1000) / 10 : null,
    clickToOpenRate: uniqueOpens > 0 ? Math.round((clicks / uniqueOpens) * 1000) / 10 : null,
    bounces: sumOf(sends, 'bounces'),
    unsubscribes: sumOf(sends, 'unsubscribes'),
  };
}

const BRAND_LABEL: Partial<Record<Brand, string>> = {
  brentwood: 'Brentwood',
  'radio-links': 'Radio Links',
  capcom: 'Capcom',
  ircl: 'Irish Radio',
};

// Rates are always computed from each group's own summed totals, never by
// averaging the individual sends' percentages.
export function getEducationRollupByGeography(sends: EmailCampaignRecord[]): EducationRollupRow[] {
  const geographies = ['Scotland', 'Northern Ireland', 'Republic of Ireland'];
  return geographies
    .map((geo) => buildRollupRow(geo, geo, sends.filter((s) => s.emailGeography === geo)))
    .filter((row) => row.sends > 0);
}

export function getEducationRollupByLevel(sends: EmailCampaignRecord[]): EducationRollupRow[] {
  return ['Primary', 'Secondary']
    .map((level) => buildRollupRow(level, level, sends.filter((s) => s.emailAudienceLevel === level)))
    .filter((row) => row.sends > 0);
}

export function getEducationRollupByAudienceType(sends: EmailCampaignRecord[]): EducationRollupRow[] {
  return ['New', 'Existing']
    .map((type) => buildRollupRow(type, `${type} data`, sends.filter((s) => s.emailAudienceType === type)))
    .filter((row) => row.sends > 0);
}

export function getEducationRollupByBrand(sends: EmailCampaignRecord[]): EducationRollupRow[] {
  return (Object.keys(BRAND_LABEL) as Brand[])
    .map((brand) => buildRollupRow(brand, BRAND_LABEL[brand] as string, sends.filter((s) => s.brand === brand)))
    .filter((row) => row.sends > 0);
}

// Overall Education 2026 averages (delivery/unique-open/click rates,
// computed from summed totals) — used by Send Detail's "vs. campaign
// average" comparison.
export function getEducationOverallAverage(sends: EmailCampaignRecord[]): { deliveryRate: number | null; uniqueOpenRate: number | null; clickRate: number | null } | null {
  if (sends.length === 0) return null;
  const row = buildRollupRow('all', 'All Education 2026 sends', sends);
  return { deliveryRate: row.deliveryRate, uniqueOpenRate: row.uniqueOpenRate, clickRate: row.clickRate };
}

export interface EducationSummary {
  status: 'available' | 'not-connected';
  totalSends: number;
  unmatchedCount: number;
  subtitle: string;
}

// unmatchedCount surfaces real Education-named sends that didn't match the
// naming convention exactly (see parseEducationSegment) — an honest count
// of what's being silently excluded from the roll-up, never hidden.
export function getEducationSummary(
  data: EmailPerformanceResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EducationSummary {
  if (!data || !data.configured) {
    return { status: 'not-connected', totalSends: 0, unmatchedCount: 0, subtitle: 'Awaiting Campaign Monitor integration' };
  }
  const relevant = isGroupView ? data.campaigns : data.campaigns.filter((c) => c.brand === selectedEntity);
  const matched = relevant.filter((c) => c.emailCampaignGroup === 'education_2026');
  // A near-miss: the real name carries a recognised geography or the
  // word "Education" (so it's clearly meant for this campaign) but is
  // missing Primary/Secondary, so parseEducationSegment excluded it — see
  // that function's doc comment. Surfaced honestly rather than hidden.
  const EDUCATION_HINT_RE = /education|scotland|northern ireland|republic of ireland/i;
  const unmatched = relevant.filter((c) => c.emailCampaignGroup !== 'education_2026' && EDUCATION_HINT_RE.test(c.campaignName));
  return {
    status: matched.length > 0 ? 'available' : 'not-connected',
    totalSends: matched.length,
    unmatchedCount: unmatched.length,
    subtitle:
      matched.length > 0
        ? `${matched.length} real Education 2026 send(s)`
        : 'No Education 2026 sends genuinely attributed yet',
  };
}

export interface EducationWebsiteAttribution {
  status: 'available' | 'not-connected';
  sessions: number;
  enquiries: number | null;
  byContent: { utmContent: string; sessions: number }[];
  subtitle: string;
}

// Downstream GA4 attribution for the Education campaign — real sessions
// (and, only where a verified GA4 Enquiry definition exists, real
// enquiries) from links tagged utm_source=campaign_monitor&utm_medium=
// email&utm_campaign=education_2026. Never infers a lead/opportunity/
// revenue stage — those require Acumatica, not connected. Same
// deliberate no-GROUP_AGGREGATE_BRANDS-filter reasoning as
// getEducationSends above: every configured brand's sessions count
// toward "MTech Group," including `mtech` (the umbrella site new
// prospects most likely land on).
export function getEducationWebsiteAttribution(
  data: Ga4EducationAttributionResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): EducationWebsiteAttribution {
  if (!data || !data.configured) {
    return { status: 'not-connected', sessions: 0, enquiries: null, byContent: [], subtitle: 'Awaiting GA4 integration' };
  }
  const relevant: Ga4BrandEducationAttribution[] = isGroupView
    ? data.brands
    : data.brands.filter((b) => b.brand === selectedEntity);

  if (relevant.length === 0) {
    return { status: 'not-connected', sessions: 0, enquiries: null, byContent: [], subtitle: 'No GA4 property configured for this entity' };
  }

  const sessions = relevant.reduce((sum, b) => sum + b.sessions, 0);
  const brandsWithEnquiryDef = relevant.filter((b) => b.enquiries !== null);
  const enquiries = brandsWithEnquiryDef.length > 0 ? brandsWithEnquiryDef.reduce((sum, b) => sum + (b.enquiries ?? 0), 0) : null;

  const contentMap = new Map<string, number>();
  for (const brand of relevant) {
    for (const row of brand.byContent) {
      contentMap.set(row.utmContent, (contentMap.get(row.utmContent) ?? 0) + row.sessions);
    }
  }
  const byContent = Array.from(contentMap.entries())
    .map(([utmContent, sessionsCount]) => ({ utmContent, sessions: sessionsCount }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    status: 'available',
    sessions,
    enquiries,
    byContent,
    subtitle:
      enquiries !== null
        ? `Real GA4 sessions and enquiries from Education 2026-tagged email links`
        : `Real GA4 sessions from Education 2026-tagged email links — no verified GA4 Enquiry definition for this entity yet`,
  };
}
