import { useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEntity, ENTITY_OPTIONS } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { PeriodSelector } from '@/components/common/PeriodSelector';
import { KpiCard } from '@/components/common/KpiCard';
import { DataFreshnessBar, type FreshnessEntry } from '@/components/common/DataFreshnessBar';
import { AttributionHealth } from '@/components/leads/AttributionHealth';
import { UnmatchedActivity } from '@/components/leads/UnmatchedActivity';
import { LeadCrmTable } from '@/components/leads/LeadCrmTable';
import { filterCampaignsByPeriod, sumLeads, sumEnquiries, MARKETING_LEADS_CAVEAT } from '@/utils/campaignMetrics';
import { resolveEmailDateRange } from '@/utils/emailPerformance';
import { resolveCallDateRange } from '@/utils/callPerformance';
import {
  getUnmappedEmailSends,
  getUnclassifiedCalls,
  getCampaignsWithNoActivity,
  GA4_ENQUIRY_ATTRIBUTION_GAP,
  SPEND_WITHOUT_CAMPAIGN_GAP,
} from '@/utils/attributionHealth';
import { getUnmatchedGoogleAdsCampaigns } from '@/utils/campaignAttribution';
import { resolveGoogleAdsDateRange } from '@/utils/googleAdsPerformance';

interface LeadsCrmScreenProps {
  onNavigate?: (screen: string) => void;
}

// The commercial-attribution page: Campaign -> Lead -> Opportunity ->
// Pipeline -> Won Revenue. Acumatica will eventually be the source of
// truth for the CRM side of that flow; today only the campaign-level
// Marketing Leads and Enquiries aggregates are real. Everything CRM-shaped
// (Qualified Leads, Opportunities, Pipeline, Won Deals, Won Revenue,
// Attribution Health, the lead table itself) is an honest "Not connected"
// — never a fabricated figure, row, or health indicator.
export function LeadsCrmScreen({ onNavigate }: LeadsCrmScreenProps) {
  const campaigns = useAppStore((s) => s.campaigns);
  const tasks = useAppStore((s) => s.tasks);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const infinityCalls = useAppStore((s) => s.infinityCalls);
  const syncInfinityCalls = useAppStore((s) => s.syncInfinityCalls);
  const googleAdsPerformance = useAppStore((s) => s.googleAdsPerformance);
  const syncGoogleAdsPerformance = useAppStore((s) => s.syncGoogleAdsPerformance);
  const { selectedEntity, isGroupView, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  const emailRange = useMemo(() => resolveEmailDateRange(period), [period]);
  useEffect(() => {
    syncEmailPerformance(emailRange.startDate, emailRange.endDate);
  }, [emailRange.startDate, emailRange.endDate, syncEmailPerformance]);

  const callRange = useMemo(() => resolveCallDateRange(period), [period]);
  useEffect(() => {
    syncInfinityCalls(callRange.startDate, callRange.endDate);
  }, [callRange.startDate, callRange.endDate, syncInfinityCalls]);

  const googleAdsRange = useMemo(() => resolveGoogleAdsDateRange(period), [period]);
  useEffect(() => {
    syncGoogleAdsPerformance(googleAdsRange.startDate, googleAdsRange.endDate);
  }, [googleAdsRange.startDate, googleAdsRange.endDate, syncGoogleAdsPerformance]);

  // Real gap, not a static placeholder — every real Google Ads campaign
  // this period whose ID isn't mapped to any AI Office campaign. See
  // getUnmatchedGoogleAdsCampaigns's doc comment.
  const googleAdsGap = useMemo(() => {
    if (!googleAdsPerformance || !googleAdsPerformance.configured) {
      return { status: 'not-connected' as const, count: null, subtitle: 'Google Ads is not connected' };
    }
    const unmatched = getUnmatchedGoogleAdsCampaigns(googleAdsPerformance, campaigns);
    return {
      status: 'available' as const,
      count: unmatched.length,
      subtitle: unmatched.length > 0 ? 'Real Google Ads campaigns with no AI Office campaign mapped' : 'Every Google Ads campaign this period is mapped',
    };
  }, [googleAdsPerformance, campaigns]);

  const entityCampaigns = useMemo(
    () => campaigns.filter((c) => matchesSelectedEntity(c.brand)),
    [campaigns, selectedEntity] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(
    () => filterCampaignsByPeriod(entityCampaigns, periodStart),
    [entityCampaigns, periodStart]
  );

  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const enquiriesTotal = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);

  // ---- Unmatched Activity — see src/utils/attributionHealth.ts ----------
  const unmappedEmailSends = useMemo(
    () => getUnmappedEmailSends(emailPerformance, matchesSelectedEntity),
    [emailPerformance, matchesSelectedEntity]
  );
  const unclassifiedCalls = useMemo(
    () => getUnclassifiedCalls(infinityCalls, isGroupView, selectedEntity),
    [infinityCalls, isGroupView, selectedEntity]
  );
  const campaignsWithNoActivity = useMemo(
    () => getCampaignsWithNoActivity(periodCampaigns, tasks.filter((t) => matchesSelectedEntity(t.brand))),
    [periodCampaigns, tasks, matchesSelectedEntity]
  );

  const entityLabel = ENTITY_OPTIONS.find((o) => o.value === selectedEntity)?.label ?? selectedEntity;

  // Campaign Monitor and Infinity are now synced on this page too (they
  // feed Unmatched Activity below), so their real connection state is
  // shown here rather than leaving Acumatica as the only entry, which
  // would understate what this page actually reads from.
  const cmConfigured = emailPerformance?.configured === true;
  const infinityConfigured = infinityCalls?.configured === true;
  const freshnessEntries: FreshnessEntry[] = [
    cmConfigured
      ? { label: 'Campaign Monitor', status: emailPerformance?.syncState === 'live' ? 'live' : 'error', detail: emailPerformance?.syncState === 'live' ? 'Connected' : 'Sync error' }
      : { label: 'Campaign Monitor', status: 'not-connected', detail: 'Not connected' },
    infinityConfigured
      ? { label: 'Infinity', status: 'live', detail: 'Connected' }
      : { label: 'Infinity', status: 'not-connected', detail: 'Not connected' },
    { label: 'Acumatica', status: 'not-connected', detail: 'Not connected' },
  ];

  return (
    <div className="v2-page">
      <div className="max-w-7xl mx-auto">
        <div className="v2-page-header">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Leads & CRM</h1>
            <p className="text-text-secondary">
              {isGroupView ? 'Commercial attribution across MTech Group' : `Showing ${entityLabel}`}
            </p>
          </div>
          <PeriodSelector />
        </div>

        <DataFreshnessBar entries={freshnessEntries} />

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <KpiCard title="Marketing Leads" value={marketingLeads} subtitle={MARKETING_LEADS_CAVEAT} accent="var(--v2-green)" />
          <KpiCard title="Qualified Leads" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Opportunities" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Open Pipeline" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Deals" status="not-connected" subtitle="Awaiting Acumatica integration" />
          <KpiCard title="Won Revenue" status="not-connected" subtitle="Awaiting Acumatica integration" />
        </div>

        {/* Attribution Health — CRM-side (Acumatica-pending, all "Not
            connected" today) */}
        <div className="mb-8">
          <h2 className="v2-section-title">Attribution Health</h2>
          <div className="card">
            <AttributionHealth />
          </div>
        </div>

        {/* Unmatched Activity — genuine, computed today from data AI
            Office already has (Campaign Monitor sends, Infinity calls,
            campaign records). Distinct from the CRM-side Attribution
            Health above: this never depends on Acumatica. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Unmatched Activity</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Real activity that isn't confidently linked to an AI Office campaign — using only the existing,
            deterministic links each integration already computes. Nothing here is a weak or inferred match; where
            a source has no linkage mechanism at all yet, that's shown as "N/A", never guessed.
          </p>
          <UnmatchedActivity
            unmappedEmailSends={unmappedEmailSends}
            unclassifiedCalls={unclassifiedCalls}
            googleAdsGap={googleAdsGap}
            ga4EnquiryGap={GA4_ENQUIRY_ATTRIBUTION_GAP}
            spendGap={SPEND_WITHOUT_CAMPAIGN_GAP}
            campaignsWithNoActivity={campaignsWithNoActivity}
          />
        </div>

        {/* Current Marketing Activity — the one genuinely real, useful
            thing this page can show today, clearly distinguished from CRM
            data. */}
        <div className="mb-8">
          <h2 className="v2-section-title">Current Marketing Activity</h2>
          <p className="text-xs text-text-secondary mb-3" style={{ marginTop: -8 }}>
            Manually logged campaign activity — not CRM data.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <KpiCard title="Enquiries" value={enquiriesTotal} subtitle="Manually logged per campaign" size="compact" />
            <KpiCard title="Marketing Leads" value={marketingLeads} subtitle="Manually logged per campaign" accent="var(--v2-green)" size="compact" />
          </div>
        </div>

        {/* Lead / CRM table */}
        <div className="mb-4">
          <h2 className="v2-section-title">Lead / CRM Records</h2>
          <div className="card" style={{ padding: 0 }}>
            <LeadCrmTable onViewPerformance={() => onNavigate?.('dashboard')} />
          </div>
        </div>
      </div>
    </div>
  );
}
