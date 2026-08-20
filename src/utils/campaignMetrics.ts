import { Campaign } from '@/types/index';

// Shared campaign aggregation used by Overview and Performance so the two
// pages can never disagree on what "this period, this entity" totals to.
// Pure extraction of logic that previously lived inline in HomeScreen —
// output is unchanged.
export function filterCampaignsByPeriod(campaigns: Campaign[], periodStart: Date | null): Campaign[] {
  if (!periodStart) return campaigns;
  return campaigns.filter((c) => c.startDate >= periodStart || c.endDate >= periodStart);
}

export function sumLeads(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + (c.leads || 0), 0);
}

export function sumSpend(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
}

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
