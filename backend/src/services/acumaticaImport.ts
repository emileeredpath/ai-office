// Acumatica Manual Commercial Import (Discovery & Foundation phase).
//
// This is a MANUAL, file-based import of a real Acumatica Opportunities
// export — never a live API connection. Acumatica remains the CRM source
// of truth; this only lets AI Office reflect a snapshot of it for
// reporting/attribution. Every imported row is tagged source =
// 'acumatica_manual' and carries its own importedAt timestamp so nothing
// downstream can mistake this for live data — see
// db/acumaticaRepository.ts.
//
// PERSONAL DATA: this importer must never persist a customer/contact
// personal-data column, even if the uploaded export contains one. Matching
// is on the column header only (case/whitespace-insensitive, exact match
// against the list below) — a column whose header matches is dropped
// before any row is read, and reported back to the caller as ignored, so
// the user can see exactly what was (and wasn't) imported. `Owner` is
// deliberately NOT on this list — it identifies an internal MTech
// employee, not a customer, and the brief explicitly allows retaining
// owner/employee information for management reporting.
import type { Brand } from '../types.js';
import { upsertOpportunity, recordImportLog, type UpsertOpportunityInput } from '../db/acumaticaRepository.js';
import { classifyCommercialStatus } from './acumaticaKpiRules.js';

const REJECTED_PERSONAL_DATA_HEADERS = new Set(
  [
    'contact name', 'contact', 'name', 'customer name', 'business account name',
    'first name', 'last name', 'full name',
    'email', 'e-mail', 'email address', 'e-mail address',
    'telephone', 'phone', 'phone number', 'telephone number', 'mobile', 'mobile number', 'mobile phone',
    'address', 'postal address', 'street address', 'address line 1', 'address line 2',
    'city', 'postcode', 'post code', 'zip', 'zip code', 'county', 'state',
  ].map((h) => h.toLowerCase())
);

// Canonical commercial field -> accepted header aliases (case/whitespace
// insensitive). Only fields genuinely listed in the Discovery brief as
// present in an Acumatica Opportunities export. A header not matching any
// alias here (and not a rejected personal-data header) is simply ignored —
// never guessed into the nearest-looking field.
const FIELD_ALIASES: Record<string, string[]> = {
  opportunityId: ['opportunity id', 'opportunityid', 'opportunity number', 'opportunity nbr', 'id'],
  createdOn: ['created on', 'created date', 'createdon', 'date created'],
  status: ['status'],
  stage: ['stage', 'opportunity stage'],
  total: ['total', 'opportunity value', 'amount', 'opportunity total', 'value'],
  estimatedCloseDate: ['estimated close date', 'est. close date', 'close date', 'expected close date'],
  opportunityClass: ['opportunity class', 'class', 'class id'],
  owner: ['owner', 'opportunity owner', 'sales rep', 'sales person', 'salesperson'],
  sourceLead: ['source lead', 'lead source', 'source campaign'],
  heardAboutUs: ['where did you hear about us?', 'where did you hear about us', 'how did you hear about us?', 'how did you hear about us'],
  productFocus: ['product focus', 'product'],
  probability: ['probability of conversion', 'probability', 'conversion probability', 'probability of conversion %'],
  industrySector: ['industry sector', 'industry'],
  proposalSent: ['proposal sent', 'proposal sent?', 'proposal sent date'],
  hireType: ['hire type'],
  // 'quanity of units required' (missing the second 't') is CONFIRMED
  // (2026-09-04) as Acumatica's own exported spelling in the real
  // export — recognised here exactly as exported, not "corrected"; the
  // canonical field name (quantityUnits) and its already-correct aliases
  // are untouched.
  quantityUnits: ['quantity of units required', 'quantity of units', 'unit quantity', 'quantity', 'quanity of units required'],
  brand: ['entity', 'brand', 'branch', 'business unit', 'company'],
};

// Real, known MTech Group entity names/synonyms an Acumatica export might
// use in a Branch/Business Unit/Company column — deterministic exact/
// contains match only, never a fuzzy guess. A value that doesn't match any
// of these leaves brand null (genuinely unattributed), never defaulted to
// "mtech".
//
// CONFIRMED (2026-09-04): brand is derived ONLY from a genuine Entity/
// Branch/Business Unit/Company column — never from the Opportunity ID
// itself. The real export's Opportunity IDs carry prefixes like "RL-" and
// "MC-", but their business meaning hasn't been confirmed (they may or may
// not map cleanly to Radio Links/Capcom), so they are deliberately never
// parsed or matched here. If no genuine entity column value is present (or
// it matches nothing above), brand stays null/unclassified — never guessed
// from the ID.
const BRAND_MATCH: Array<{ brand: Brand; patterns: string[] }> = [
  { brand: 'brentwood', patterns: ['brentwood'] },
  { brand: 'radio-links', patterns: ['radio links', 'radio-links'] },
  { brand: 'capcom', patterns: ['capcom'] },
  { brand: 'ircl', patterns: ['ircl', 'irish radio'] },
  { brand: 'idaro', patterns: ['idaro'] },
  { brand: 'mtech', patterns: ['mtech', 'mtech group'] },
];

function deriveBrand(raw: string | null): Brand | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  for (const { brand, patterns } of BRAND_MATCH) {
    if (patterns.some((p) => v.includes(p))) return brand;
  }
  return null;
}

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Minimal RFC4180-style CSV parser — handles quoted fields (including
// embedded commas, newlines, and escaped "" quotes). No external
// dependency; Acumatica's own CSV export (and Excel's "Save as CSV") both
// produce standard RFC4180 output.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  // Normalise line endings up front so \r\n and \r alone behave the same as \n.
  const s = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

// Used for Total and Quantity of Units — a blank or genuinely unparseable
// value stays null (never defaulted to 0 or invented), which is what
// distinguishes it from a real "£0" (parses to the finite number 0, a
// genuine reported zero). CONFIRMED (2026-09-04): a null total never
// blocks the row from counting as a real Opportunity — Opportunities
// counts every valid imported Opportunity ID regardless of Total — and
// revenue/pipeline sums only ever add real numeric totals (see
// acumaticaReporting.ts).
function parseNumber(raw: string | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[£$,\s]/g, '').trim();
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Probability of Conversion — CONFIRMED (2026-09-04): the raw string is
// ALWAYS preserved verbatim (probabilityRaw) so a malformed/unusual value
// remains a visible data-quality issue, never silently discarded or
// "repaired". The numeric parse here is deliberately narrow — it accepts a
// plain number or a number with a single trailing "%" (the two genuinely
// unambiguous real-world formats for a percentage) and nothing else; any
// other format (blank, text, multiple values, stray characters) leaves
// probability null while probabilityRaw still shows exactly what was
// there. Never used for weighted pipeline anywhere in this codebase.
function parseProbability(raw: string | undefined): { value: number | null; raw: string | null } {
  const trimmed = raw?.trim() ?? '';
  if (trimmed === '') return { value: null, raw: null };
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*%?$/);
  const value = match ? Number(match[1]) : null;
  return { value: value !== null && Number.isFinite(value) ? value : null, raw: trimmed };
}

function cell(row: string[], index: number | undefined): string | null {
  if (index === undefined) return null;
  const v = row[index];
  if (v === undefined) return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

export interface ImportResult {
  success: boolean;
  filename: string;
  recognisedColumns: string[];
  ignoredPersonalDataColumns: string[];
  unrecognisedColumns: string[];
  processed: number;
  created: number;
  updated: number;
  rejected: number;
  errors: string[];
  importedAt: string;
}

// filename and csvText are the caller's already-decoded (from base64)
// upload — see routes/acumatica.ts. Fails safely: a row with no
// Opportunity ID is rejected (never imported with an invented ID); every
// other missing/malformed field is stored as null, never a fabricated
// default.
export function importAcumaticaCsv(filename: string, csvText: string): ImportResult {
  const importedAt = new Date().toISOString();
  const rows = parseCsv(csvText);

  if (rows.length === 0) {
    return {
      success: false, filename, recognisedColumns: [], ignoredPersonalDataColumns: [], unrecognisedColumns: [],
      processed: 0, created: 0, updated: 0, rejected: 0, errors: ['The uploaded file is empty.'], importedAt,
    };
  }

  const headerRow = rows[0];
  const dataRows = rows.slice(1);

  // Map each canonical field to the column index of its first matching
  // header — the whole point of this pass is to decide, once, exactly
  // which real column feeds which field before touching any row data.
  const fieldIndex: Partial<Record<keyof typeof FIELD_ALIASES, number>> = {};
  const recognisedColumns: string[] = [];
  const ignoredPersonalDataColumns: string[] = [];
  const unrecognisedColumns: string[] = [];

  headerRow.forEach((rawHeader, index) => {
    const header = normaliseHeader(rawHeader);
    if (!header) return;
    if (REJECTED_PERSONAL_DATA_HEADERS.has(header)) {
      ignoredPersonalDataColumns.push(rawHeader.trim());
      return;
    }
    const match = Object.entries(FIELD_ALIASES).find(([, aliases]) => aliases.includes(header));
    if (match) {
      const [field] = match;
      if (fieldIndex[field as keyof typeof FIELD_ALIASES] === undefined) {
        fieldIndex[field as keyof typeof FIELD_ALIASES] = index;
        recognisedColumns.push(rawHeader.trim());
      }
    } else {
      unrecognisedColumns.push(rawHeader.trim());
    }
  });

  if (fieldIndex.opportunityId === undefined) {
    const errors = ['No "Opportunity ID" column was recognised — nothing was imported. Check the export includes an Opportunity ID column.'];
    recordImportLog({ filename, recognisedColumns, ignoredPersonalDataColumns, processed: 0, created: 0, updated: 0, rejected: 0, errors, importedAt });
    return { success: false, filename, recognisedColumns, ignoredPersonalDataColumns, unrecognisedColumns, processed: 0, created: 0, updated: 0, rejected: 0, errors, importedAt };
  }

  let created = 0;
  let updated = 0;
  let rejected = 0;
  const errors: string[] = [];

  dataRows.forEach((row, i) => {
    const opportunityId = cell(row, fieldIndex.opportunityId);
    if (!opportunityId) {
      rejected += 1;
      if (errors.length < 50) errors.push(`Row ${i + 2}: missing Opportunity ID — skipped.`);
      return;
    }

    const status = cell(row, fieldIndex.status);
    // commercialStatus is derived from `status` ONLY — see
    // classifyCommercialStatus's own doc comment (acumaticaKpiRules.ts).
    // stage is stored verbatim immediately below and never feeds this
    // classification, even when it appears to conflict with status.
    const { value: probability, raw: probabilityRaw } = parseProbability(cell(row, fieldIndex.probability) ?? undefined);
    const input: UpsertOpportunityInput = {
      opportunityId,
      createdOn: cell(row, fieldIndex.createdOn),
      status,
      stage: cell(row, fieldIndex.stage),
      commercialStatus: classifyCommercialStatus(status),
      total: parseNumber(cell(row, fieldIndex.total) ?? undefined),
      // Estimated Close Date: raw date string only. CONFIRMED (2026-09-04)
      // — many real open/new opportunities carry a historic close date, so
      // this is not reliable enough to drive forecasting/projected-revenue
      // figures yet. Not used for that anywhere in this codebase.
      estimatedCloseDate: cell(row, fieldIndex.estimatedCloseDate),
      // Opportunity Class: raw Acumatica value only — may later be grouped
      // for reporting (e.g. Sales/Hire/Events/Service/AV/Licence Renewal),
      // but that grouping must always be computed from this raw value on
      // read, never by overwriting it.
      opportunityClass: cell(row, fieldIndex.opportunityClass),
      owner: cell(row, fieldIndex.owner),
      // Source Lead: raw Acumatica value only. Sparsely populated and
      // inconsistently used in the real export — never treated as a
      // reliable lead -> opportunity relationship, and never used to
      // populate Marketing Leads or Qualified Leads (those remain
      // campaign.leads and a permanent Acumatica-pending stub respectively
      // — see KPI_DEFINITIONS.md).
      sourceLead: cell(row, fieldIndex.sourceLead),
      // "Where Did You Hear About Us?" — see formatSalesReportedSource in
      // acumaticaKpiRules.ts for the confirmed handling rule.
      heardAboutUs: cell(row, fieldIndex.heardAboutUs),
      // Product Focus: raw Acumatica value only, suitable for commercial/
      // product reporting as-is. A blank cell is stored as null here —
      // display code must render that as "Unspecified", never infer a
      // value (see acumaticaKpiRules.ts's UNSPECIFIED constant).
      productFocus: cell(row, fieldIndex.productFocus),
      probability,
      probabilityRaw,
      // Industry Sector: raw Acumatica value only. A literal "Not
      // Applicable" is a genuine reported value here, not treated as
      // missing/blank — `cell()` only nulls a genuinely empty string.
      // Not used as a headline KPI anywhere in this codebase.
      industrySector: cell(row, fieldIndex.industrySector),
      proposalSent: cell(row, fieldIndex.proposalSent),
      hireType: cell(row, fieldIndex.hireType),
      quantityUnits: parseNumber(cell(row, fieldIndex.quantityUnits) ?? undefined),
      brand: deriveBrand(cell(row, fieldIndex.brand)),
      sourceFilename: filename,
      importedAt,
    };

    try {
      const { wasCreated } = upsertOpportunity(input);
      if (wasCreated) created += 1;
      else updated += 1;
    } catch (err) {
      rejected += 1;
      const msg = err instanceof Error ? err.message : String(err);
      if (errors.length < 50) errors.push(`Row ${i + 2} (${opportunityId}): ${msg}`);
    }
  });

  const processed = created + updated;
  recordImportLog({ filename, recognisedColumns, ignoredPersonalDataColumns, processed, created, updated, rejected, errors, importedAt });

  return {
    success: true, filename, recognisedColumns, ignoredPersonalDataColumns, unrecognisedColumns,
    processed, created, updated, rejected, errors, importedAt,
  };
}
