// Genuine commercial KPIs derived from manually-imported Acumatica
// Opportunities (Discovery & Foundation phase) — see acumaticaImport.ts
// and db/acumaticaRepository.ts. Every figure here is built only from real
// imported rows; nothing is inferred or backfilled. All Status
// classification and KPI membership rules live centrally in
// acumaticaKpiRules.ts — this file only aggregates using those rules, it
// never re-derives or hardcodes a status string itself.
import { getAllOpportunities, getLastImportLog, type AcumaticaOpportunityRecord } from '../db/acumaticaRepository.js';
import { isWonStatus, isLostStatus, isOpenPipelineStatus, OPEN_PIPELINE_STATUSES, PIPELINE_DEFINITION_CONFIRMED, isBrandTrackedInAcumatica } from './acumaticaKpiRules.js';
import type { Brand } from '../types.js';

export interface AcumaticaSummary {
  // Whether ANY opportunity has ever been imported — distinct from
  // "zero opportunities in this filtered range," so a genuinely empty
  // period is never confused with "nothing has been imported yet."
  hasImportedData: boolean;
  lastImportedAt: string | null;

  // Opportunities = every genuine imported Opportunity ID in range,
  // regardless of Status.
  opportunities: number;

  // Won Deals / Won Revenue = Status exactly "Won" — see isWonStatus.
  wonDeals: number;
  wonRevenue: number;

  // Lost = Status exactly "Lost" — see isLostStatus.
  lostDeals: number;

  // Open Pipeline — CONFIRMED (2026-09-05, see acumaticaKpiRules.ts's
  // OPEN_PIPELINE_STATUSES doc comment): Status 'Open' + 'New' together.
  // openPipelineDefinitionConfirmed is now true; this is a settled figure,
  // not provisional.
  openPipelineValue: number;
  openPipelineCount: number;
  openPipelineDefinitionConfirmed: boolean;
  openPipelineIncludesStatuses: string[];
  // Informational breakdown of the 'New' portion of Open Pipeline above —
  // New is no longer excluded from openPipelineValue/openPipelineCount,
  // it's already included in both. These two fields just let a caller
  // show the Open/New split within the total if useful.
  newStatusCount: number;
  newStatusValue: number;

  unclassifiedCount: number;
  // Opportunities excluded from a date-scoped view because their
  // Created On value couldn't be parsed as a date — reported honestly
  // rather than silently dropped or silently included.
  undated: number;

  // CONFIRMED (2026-09-05): some brands (e.g. IRCL) are not held in
  // Acumatica at all. When notAvailableForBrand is true, every numeric
  // figure above is 0 by construction (there is no data to sum) but MUST
  // NOT be presented as a real, verified zero — callers must check this
  // flag first and show notAvailableReason instead of any KPI figure.
  notAvailableForBrand: boolean;
  notAvailableReason: string | null;
}

function parseExportDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d;
  // Common UK export format: DD/MM/YYYY
  const ukMatch = raw.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukMatch) {
    const [, dd, mm, yyyy] = ukMatch;
    const parsed = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function getAcumaticaSummary(startDate?: string, endDate?: string, brand?: Brand): AcumaticaSummary {
  const all = getAllOpportunities();
  const lastImport = getLastImportLog();

  if (brand && !isBrandTrackedInAcumatica(brand)) {
    return {
      hasImportedData: all.length > 0,
      lastImportedAt: lastImport?.importedAt ?? null,
      opportunities: 0,
      wonDeals: 0,
      wonRevenue: 0,
      lostDeals: 0,
      openPipelineValue: 0,
      openPipelineCount: 0,
      openPipelineDefinitionConfirmed: PIPELINE_DEFINITION_CONFIRMED,
      openPipelineIncludesStatuses: OPEN_PIPELINE_STATUSES,
      newStatusCount: 0,
      newStatusValue: 0,
      unclassifiedCount: 0,
      undated: 0,
      notAvailableForBrand: true,
      notAvailableReason: 'IRCL is not managed in Acumatica',
    };
  }

  let scoped: AcumaticaOpportunityRecord[] = all;
  if (brand) {
    scoped = scoped.filter((o) => o.brand === brand);
  }

  let undated = 0;
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(`${endDate}T23:59:59.999Z`);
    scoped = scoped.filter((o) => {
      const d = parseExportDate(o.createdOn);
      if (!d) {
        undated += 1;
        return false;
      }
      return d >= start && d <= end;
    });
  }

  const wonOpps = scoped.filter((o) => isWonStatus(o.commercialStatus));
  const lostOpps = scoped.filter((o) => isLostStatus(o.commercialStatus));
  const openOpps = scoped.filter((o) => isOpenPipelineStatus(o.commercialStatus));
  const newOpps = scoped.filter((o) => o.commercialStatus === 'new');
  const unclassifiedOpps = scoped.filter((o) => o.commercialStatus === 'unclassified');

  return {
    hasImportedData: all.length > 0,
    lastImportedAt: lastImport?.importedAt ?? null,
    opportunities: scoped.length,
    wonDeals: wonOpps.length,
    wonRevenue: wonOpps.reduce((sum, o) => sum + (o.total ?? 0), 0),
    lostDeals: lostOpps.length,
    openPipelineValue: openOpps.reduce((sum, o) => sum + (o.total ?? 0), 0),
    openPipelineCount: openOpps.length,
    openPipelineDefinitionConfirmed: PIPELINE_DEFINITION_CONFIRMED,
    openPipelineIncludesStatuses: OPEN_PIPELINE_STATUSES,
    newStatusCount: newOpps.length,
    newStatusValue: newOpps.reduce((sum, o) => sum + (o.total ?? 0), 0),
    unclassifiedCount: unclassifiedOpps.length,
    undated,
    notAvailableForBrand: false,
    notAvailableReason: null,
  };
}
