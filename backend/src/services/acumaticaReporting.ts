// Genuine commercial KPIs derived from manually-imported Acumatica
// Opportunities (Discovery & Foundation phase) — see acumaticaImport.ts
// and db/acumaticaRepository.ts. Every figure here is built only from real
// imported rows; nothing is inferred or backfilled. All Status
// classification and KPI membership rules live centrally in
// acumaticaKpiRules.ts — this file only aggregates using those rules, it
// never re-derives or hardcodes a status string itself.
import { getAllOpportunities, getLastImportLog, type AcumaticaOpportunityRecord } from '../db/acumaticaRepository.js';
import {
  isWonStatus,
  isLostStatus,
  isOpenPipelineStatus,
  OPEN_PIPELINE_STATUSES,
  PIPELINE_DEFINITION_CONFIRMED,
  isBrandTrackedInAcumatica,
  formatSalesReportedSource,
  formatUnspecified,
} from './acumaticaKpiRules.js';
import type { Brand } from '../types.js';

export interface AcumaticaSummary {
  // Per-entity Availability (2026-09-09) — when `brand` is passed, this is
  // whether ANY opportunity has ever been imported for THAT brand
  // specifically (checked against the full imported dataset, before the
  // date-range filter is applied) — never the global "something was
  // imported for some entity" flag. That distinction matters: two
  // entities can both show `opportunities: 0` for a period, but one has
  // real imported data with a genuine zero result (hasImportedData:
  // true) and the other has never had a single row imported for it
  // (hasImportedData: false) — collapsing those into one flag would
  // silently present "no coverage" as "genuine zero" for the second
  // entity. When no `brand` is passed (group view), this is still the
  // global "was anything imported at all" flag, since a group total
  // legitimately draws on every tracked entity's data together.
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

// Shared entity/period scoping — the ONE place that decides which real
// imported opportunities are "in scope" for a given brand/date-range
// selection, so getAcumaticaSummary and getAcumaticaBreakdowns (below) can
// never disagree about what they're both summarising. Mirrors
// getAcumaticaSummary's original inline logic exactly — no behaviour
// change, just factored out so a second consumer doesn't re-derive it.
interface AcumaticaScope {
  scoped: AcumaticaOpportunityRecord[];
  hasImportedData: boolean;
  undated: number;
  lastImportedAt: string | null;
  notAvailableForBrand: boolean;
  notAvailableReason: string | null;
}

function scopeOpportunities(startDate?: string, endDate?: string, brand?: Brand): AcumaticaScope {
  const all = getAllOpportunities();
  const lastImport = getLastImportLog();
  const lastImportedAt = lastImport?.importedAt ?? null;

  if (brand && !isBrandTrackedInAcumatica(brand)) {
    return {
      scoped: [],
      hasImportedData: all.length > 0,
      undated: 0,
      lastImportedAt,
      notAvailableForBrand: true,
      notAvailableReason: 'IRCL is not managed in Acumatica',
    };
  }

  let scoped: AcumaticaOpportunityRecord[] = all;
  if (brand) {
    scoped = scoped.filter((o) => o.brand === brand);
  }

  // Captured before the date-range filter below narrows `scoped` further —
  // this must reflect "has this entity EVER had an opportunity imported,"
  // not "does it have one in this particular period." A brand with real
  // imported history but nothing in the current date range still counts
  // as having data (the correct answer is a genuine 0 for this period),
  // while a brand absent from every imported row, in any period, has no
  // coverage at all.
  const hasImportedData = brand ? scoped.length > 0 : all.length > 0;

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

  return { scoped, hasImportedData, undated, lastImportedAt, notAvailableForBrand: false, notAvailableReason: null };
}

export function getAcumaticaSummary(startDate?: string, endDate?: string, brand?: Brand): AcumaticaSummary {
  const scope = scopeOpportunities(startDate, endDate, brand);

  if (scope.notAvailableForBrand) {
    return {
      hasImportedData: scope.hasImportedData,
      lastImportedAt: scope.lastImportedAt,
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
      notAvailableReason: scope.notAvailableReason,
    };
  }

  const { scoped, hasImportedData, undated, lastImportedAt } = scope;

  const wonOpps = scoped.filter((o) => isWonStatus(o.commercialStatus));
  const lostOpps = scoped.filter((o) => isLostStatus(o.commercialStatus));
  const openOpps = scoped.filter((o) => isOpenPipelineStatus(o.commercialStatus));
  const newOpps = scoped.filter((o) => o.commercialStatus === 'new');
  const unclassifiedOpps = scoped.filter((o) => o.commercialStatus === 'unclassified');

  return {
    hasImportedData,
    lastImportedAt,
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

// ---------------------------------------------------------------------
// Opportunity analysis breakdowns (Leads & CRM Data + Privacy Foundation
// phase, 2026-09-09) — Commercial Status, Stage, Opportunity Class,
// Product Focus, Sales-reported Source, and Entity, each as a real
// count + total value across the same period/entity scope as
// getAcumaticaSummary above (via the same scopeOpportunities helper, so
// the two can never disagree about which opportunities are "in scope").
// Stage is grouped here for genuine display/reporting only — it is never
// read anywhere in this file (or acumaticaKpiRules.ts) to influence
// commercialStatus; Status alone remains the sole commercial
// classification. "Sales-reported Source" groups by heardAboutUs via the
// same formatSalesReportedSource() used elsewhere, so a blank value
// groups under "Unspecified" here exactly as it would if rendered
// per-row — never a separate/looser blank-handling rule.
export interface AcumaticaBreakdownEntry {
  key: string;
  count: number;
  value: number;
}

export interface AcumaticaBreakdowns {
  hasImportedData: boolean;
  notAvailableForBrand: boolean;
  notAvailableReason: string | null;
  byCommercialStatus: AcumaticaBreakdownEntry[];
  byStage: AcumaticaBreakdownEntry[];
  byOpportunityClass: AcumaticaBreakdownEntry[];
  byProductFocus: AcumaticaBreakdownEntry[];
  bySalesReportedSource: AcumaticaBreakdownEntry[];
  byEntity: AcumaticaBreakdownEntry[];
}

function groupBy(
  scoped: AcumaticaOpportunityRecord[],
  keyFn: (o: AcumaticaOpportunityRecord) => string
): AcumaticaBreakdownEntry[] {
  const totals = new Map<string, { count: number; value: number }>();
  for (const o of scoped) {
    const key = keyFn(o);
    const existing = totals.get(key) ?? { count: 0, value: 0 };
    existing.count += 1;
    existing.value += o.total ?? 0;
    totals.set(key, existing);
  }
  return Array.from(totals.entries())
    .map(([key, t]) => ({ key, count: t.count, value: t.value }))
    .sort((a, b) => b.count - a.count);
}

export function getAcumaticaBreakdowns(startDate?: string, endDate?: string, brand?: Brand): AcumaticaBreakdowns {
  const scope = scopeOpportunities(startDate, endDate, brand);

  if (scope.notAvailableForBrand) {
    return {
      hasImportedData: scope.hasImportedData,
      notAvailableForBrand: true,
      notAvailableReason: scope.notAvailableReason,
      byCommercialStatus: [],
      byStage: [],
      byOpportunityClass: [],
      byProductFocus: [],
      bySalesReportedSource: [],
      byEntity: [],
    };
  }

  const { scoped, hasImportedData } = scope;

  return {
    hasImportedData,
    notAvailableForBrand: false,
    notAvailableReason: null,
    byCommercialStatus: groupBy(scoped, (o) => o.commercialStatus),
    byStage: groupBy(scoped, (o) => formatUnspecified(o.stage)),
    byOpportunityClass: groupBy(scoped, (o) => formatUnspecified(o.opportunityClass)),
    byProductFocus: groupBy(scoped, (o) => formatUnspecified(o.productFocus)),
    bySalesReportedSource: groupBy(scoped, (o) => formatSalesReportedSource(o.heardAboutUs)),
    byEntity: groupBy(scoped, (o) => formatUnspecified(o.brand)),
  };
}
