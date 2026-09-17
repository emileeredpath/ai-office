import type { EntitySelection } from '@/contexts/EntityContext';
import type { WebsiteImprovement, WebsiteSite } from '@/services/websiteImprovementsApi';

// The header entity controls both the reports and the improvement backlog.
// A stale local website filter must never carry another entity's records over.
export function getImprovementScope(
  sites: WebsiteSite[],
  rows: WebsiteImprovement[],
  entity: EntitySelection,
  selectedSite: string,
) {
  const scopedSites = entity === 'all' ? sites : sites.filter((site) => site.brand === entity);
  const siteIds = new Set(scopedSites.map((site) => site.id));
  const effectiveSelectedSite = siteIds.has(selectedSite) ? selectedSite : 'all';
  const scopedRows = rows.filter((row) => siteIds.has(row.site_id) &&
    (effectiveSelectedSite === 'all' || row.site_id === effectiveSelectedSite));
  return { sites: scopedSites, rows: scopedRows, selectedSite: effectiveSelectedSite };
}
