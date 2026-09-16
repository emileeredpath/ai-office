import type { Brand } from '@/types/index';
import type { Ga4WebsiteJourneyResponse } from '@/services/ga4Api';

type Entry = { brand: Brand; pagePath: string; sessions: number; engagedSessions: number; bounceRate: number };
type PageCount = { brand: Brand; pagePath: string; count: number };

export interface WebsiteImprovementSignals {
  status: 'available' | 'not-connected';
  reportedSites: number;
  selectedSites: number;
  viewedReportedSites: number;
  enquiryReportedSites: number;
  entries: Entry[];
  viewed: PageCount[];
  enquiryActions: PageCount[];
  engagementWatch: Entry[];
}

// These are three independent GA4 page reports. They must not be summed into
// a funnel or interpreted as sequential visitors. Missing brand reports are
// excluded with explicit coverage, while genuine zero rows stay real zeros.
export function getWebsiteImprovementSignals(
  data: Ga4WebsiteJourneyResponse | null,
  brands: Brand[],
): WebsiteImprovementSignals {
  const selected = [...new Set(brands)];
  const empty = {
    status: 'not-connected' as const, reportedSites: 0, selectedSites: selected.length,
    viewedReportedSites: 0, enquiryReportedSites: 0,
    entries: [], viewed: [], enquiryActions: [], engagementWatch: [],
  };
  if (!data?.configured) return empty;

  const reports = data.brands.filter((row) => selected.includes(row.brand));
  const availableEntries = reports.filter((row) => row.entryPages !== null);
  const availableViewed = reports.filter((row) => row.topPages !== null);
  const availableEnquiry = reports.filter((row) => row.enquiryPages !== null);
  if (availableEntries.length === 0 && availableViewed.length === 0 && availableEnquiry.length === 0) return empty;

  const entries = availableEntries.flatMap((row) => (row.entryPages ?? []).map((page) => ({ brand: row.brand, ...page })))
    .sort((a, b) => b.sessions - a.sessions);
  const viewed = reports.flatMap((row) => (row.topPages ?? []).map((page) => ({
    brand: row.brand, pagePath: page.pagePath, count: page.pageViews,
  }))).sort((a, b) => b.count - a.count);
  const enquiryActions = reports.flatMap((row) => (row.enquiryPages ?? []).map((page) => ({
    brand: row.brand, pagePath: page.pagePath, count: page.enquiries,
  }))).sort((a, b) => b.count - a.count);

  // Restrict the watch list to the ten busiest entry pages first, so an
  // obscure page with one session never outranks a page with useful volume.
  // The rate is GA4 bounce rate: a review signal, not a measured exit path.
  const engagementWatch = entries.slice(0, 10).filter((row) => row.sessions > 0 && row.bounceRate > 0)
    .sort((a, b) => b.bounceRate - a.bounceRate || b.sessions - a.sessions)
    .slice(0, 3);

  return {
    status: 'available', reportedSites: availableEntries.length, selectedSites: selected.length,
    viewedReportedSites: availableViewed.length, enquiryReportedSites: availableEnquiry.length,
    entries: entries.slice(0, 5), viewed: viewed.slice(0, 5), enquiryActions: enquiryActions.slice(0, 5),
    engagementWatch,
  };
}
