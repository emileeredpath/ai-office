import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Ga4WebsiteJourneyResponse } from '@/services/ga4Api';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

type PageKind = 'entryPages' | 'topPages' | 'enquiryPages';
type JourneyRow = { brand: Brand; pagePath: string; count: number };

export interface WebsiteJourneyList {
  status: 'available' | 'not-connected';
  rows: JourneyRow[];
  subtitle: string;
}

export function getWebsiteJourneyPages(
  data: Ga4WebsiteJourneyResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  kind: PageKind,
  limit = 10
): WebsiteJourneyList {
  const unavailable = (subtitle: string): WebsiteJourneyList => ({ status: 'not-connected', rows: [], subtitle });
  if (!data?.configured) return unavailable('GA4 page reporting is not connected');

  const scope = isGroupView ? GROUP_AGGREGATE_BRANDS : [selectedEntity as Brand];
  const eligible = kind === 'enquiryPages' ? data.enquiryConfiguredBrands : data.configuredBrands;
  const configured = scope.filter((brand) => eligible.includes(brand));
  const successful = data.brands.filter((entry) => scope.includes(entry.brand) && entry[kind] !== null);
  if (successful.length === 0) {
    if (configured.length === 0) {
      return unavailable(kind === 'enquiryPages' ? 'No verified GA4 enquiry definition for this entity' : 'No GA4 property connected for this entity');
    }
    return unavailable('GA4 page report unavailable — please try again');
  }

  const key = kind === 'entryPages' ? 'sessions' : kind === 'topPages' ? 'pageViews' : 'enquiries';
  const rows: JourneyRow[] = successful.flatMap((entry) => {
    const pages = entry[kind];
    if (!pages) return [];
    return pages.map((page) => ({ brand: entry.brand, pagePath: page.pagePath, count: page[key] }));
  }).sort((a, b) => b.count - a.count).slice(0, limit);

  const coverage = isGroupView
    ? `Across ${successful.length} of ${scope.length} MTech websites${successful.length < scope.length ? ' with available reports' : ''}`
    : 'For this website';
  return { status: 'available', rows, subtitle: coverage };
}
