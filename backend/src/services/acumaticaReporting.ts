// Genuine commercial KPIs derived from manually-imported Acumatica
// Opportunities (Discovery & Foundation phase) — see acumaticaImport.ts
// and db/acumaticaRepository.ts. Every figure here is built only from
// real imported rows; nothing is inferred or backfilled.
//
// KPI definitions (provisional — see classifyCommercialStatus's own doc
// comment: not yet confirmed against a real customer export):
//   Opportunities  = every real imported opportunity, regardless of status.
//   Open Pipeline  = sum of `total` across opportunities whose Status is
//                    genuinely "Open" (commercialStatus === 'open').
//   Won Deals      = count of opportunities whose Status is "Won".
//   Won Revenue    = sum of `total` across those Won opportunities.
// Opportunities with an unrecognised/blank Status are 'unclassified' —
// counted in Opportunities, but deliberately excluded from Open
// Pipeline/Won Deals/Won Revenue rather than guessed into one bucket.
//
// Marketing Leads / Qualified Leads are NOT populated from this data —
// an Acumatica Opportunity is not the same thing as a lead, and this
// export contains no separate lead-level record.
import { getAllOpportunities, getLastImportLog, type AcumaticaOpportunityRecord } from '../db/acumaticaRepository.js';
import type { Brand } from '../types.js';

export interface AcumaticaSummary {
  // Whether ANY opportunity has ever been imported — distinct from
  // "zero opportunities in this filtered range," so a genuinely empty
  // period is never confused with "nothing has been imported yet."
  hasImportedData: boolean;
  lastImportedAt: string | null;
  opportunities: number;
  openPipelineValue: number;
  openPipelineCount: number;
  wonDeals: number;
  wonRevenue: number;
  unclassifiedCount: number;
  // Opportunities excluded from a date-scoped view because their
  // Created On value couldn't be parsed as a date — reported honestly
  // rather than silently dropped or silently included.
  undated: number;
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

  const openOpps = scoped.filter((o) => o.commercialStatus === 'open');
  const wonOpps = scoped.filter((o) => o.commercialStatus === 'won');
  const unclassifiedOpps = scoped.filter((o) => o.commercialStatus === 'unclassified');

  return {
    hasImportedData: all.length > 0,
    lastImportedAt: lastImport?.importedAt ?? null,
    opportunities: scoped.length,
    openPipelineValue: openOpps.reduce((sum, o) => sum + (o.total ?? 0), 0),
    openPipelineCount: openOpps.length,
    wonDeals: wonOpps.length,
    wonRevenue: wonOpps.reduce((sum, o) => sum + (o.total ?? 0), 0),
    unclassifiedCount: unclassifiedOpps.length,
    undated,
  };
}
