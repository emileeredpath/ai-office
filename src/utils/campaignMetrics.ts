import { Campaign } from '@/types/index';

// Shared campaign aggregation used by Overview and Performance so the two
// pages can never disagree on what "this period, this entity" totals to.
// Pure extraction of logic that previously lived inline in HomeScreen —
// output is unchanged.
export function filterCampaignsByPeriod(campaigns: Campaign[], periodStart: Date | null): Campaign[] {
  if (!periodStart) return campaigns;
  return campaigns.filter((c) => c.startDate >= periodStart || c.endDate >= periodStart);
}

// A genuinely bounded [start, end] window, unlike filterCampaignsByPeriod
// above (which is deliberately open-ended — "from X to now" — for the
// current-period views it was built for). Needed for previous-period
// comparisons (src/utils/periodComparison.ts), which need a real historic
// slice rather than "everything since some date." A campaign counts as
// falling in the range if it overlaps it at all (starts before the range
// ends AND ends on/after the range starts) — the same overlap semantics
// as filterCampaignsByPeriod, just with both bounds enforced.
export function filterCampaignsByDateRange(campaigns: Campaign[], start: Date, end: Date): Campaign[] {
  return campaigns.filter((c) => c.startDate <= end && c.endDate >= start);
}

export function sumLeads(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
}

// Single source of truth for the "this is real but manually logged, not
// CRM-verified" caveat — see KPI_DEFINITIONS.md. Screens previously
// hand-typed three slightly different wordings of this; new/updated call
// sites should use these constants rather than adding a fourth variant.
export const MARKETING_LEADS_CAVEAT = 'Manually logged, not yet CRM-linked';

export function sumSpend(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
}

export const MARKETING_SPEND_CAVEAT = 'Manually logged campaign spend';

export function sumEnquiries(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + (c.results?.enquiriesReceived || 0), 0);
}

export interface LeadConversion {
  rate: number;
}

// Enquiries -> Marketing Leads is only shown as a "Lead Conversion" figure
// when both real, manually-logged totals exist for the exact same
// filtered (entity + period) scope being displayed — never computed just
// to fill a table cell. A zero-enquiries scope (nothing logged, or
// genuinely zero) can't support a meaningful ratio either way, so both
// cases fall through to "Not available".
export function getLeadConversion(enquiries: number, leads: number): LeadConversion | null {
  if (enquiries <= 0) return null;
  return { rate: (leads / enquiries) * 100 };
}
