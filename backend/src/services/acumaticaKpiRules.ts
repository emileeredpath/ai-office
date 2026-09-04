// Central Acumatica commercial-KPI rules (Discovery & Foundation phase).
//
// This is the ONE place that decides what an imported opportunity's real
// Status means for reporting. Nothing else in the backend or frontend
// should hardcode a status string or re-derive open/won/lost logic —
// read through classifyCommercialStatus() and the KPI predicates below
// instead, so a future rule change (e.g. once "New" is confirmed) only
// happens here.
//
// CONFIRMED against a real 1,000-row sample of the actual Acumatica
// Opportunities export (2026-09-04): the real Status column contains
// exactly four values — Won (535), Open (255), Lost (142), New (68).
// Status remains the PRIMARY and ONLY source of Won/Lost/Open/New state.
// Stage is never used to infer or override Won/Lost/Open — the real
// export contains rows where Status and Stage don't perfectly align, so
// trusting Stage instead would silently produce a different, unverified
// answer. Stage is stored verbatim for reference and is not otherwise
// interpreted anywhere in this codebase.
export type CommercialStatus = 'open' | 'won' | 'lost' | 'new' | 'unclassified';

// Exact, case-insensitive match only — never a partial/fuzzy match, and
// never inferred from Stage. A Status value not in this list (including
// blank) is 'unclassified', not silently folded into one of the four
// known buckets.
const STATUS_MAP: Record<string, CommercialStatus> = {
  open: 'open',
  won: 'won',
  lost: 'lost',
  new: 'new',
};

export function classifyCommercialStatus(rawStatus: string | null): CommercialStatus {
  if (!rawStatus) return 'unclassified';
  return STATUS_MAP[rawStatus.trim().toLowerCase()] ?? 'unclassified';
}

// ---- KPI definitions -------------------------------------------------
//
// Opportunities  = every genuinely imported Opportunity ID within the
//                  reporting period, regardless of Status.
// Won Deals      = count of commercialStatus === 'won'.
// Won Revenue    = sum of `total` across those Won opportunities.
// Lost           = count of commercialStatus === 'lost'.
//
// Open Pipeline is DELIBERATELY NOT FINALISED. Confirmed real data shows
// Status also contains "New" (68 of the first 1,000 rows) — a genuinely
// distinct value from "Open", and it is not yet confirmed with the sales/
// Acumatica team whether a "New" opportunity should count as open pipeline
// or is a separate pre-pipeline stage. Until that's confirmed:
//   - Open Pipeline is computed from Status === 'Open' ONLY (the narrower,
//     safer reading — never assume "New" counts as pipeline).
//   - The real "New" count/value is always reported ALONGSIDE it, so no
//     figure this feeds can be read as "we checked and New doesn't count"
//     — it visibly says "here's what we excluded, pending confirmation."
//   - Every consumer of this figure (reporting routes, the Leads & CRM
//     screen) must surface it as provisional, never as a settled number.
//
// To finalise, once confirmed: change OPEN_PIPELINE_STATUSES below (e.g.
// to ['open', 'new']) and flip PIPELINE_DEFINITION_CONFIRMED to true —
// nothing else needs to change.
export const OPEN_PIPELINE_STATUSES: CommercialStatus[] = ['open'];
export const PIPELINE_DEFINITION_CONFIRMED = false;

export function isWonStatus(status: CommercialStatus): boolean {
  return status === 'won';
}

export function isLostStatus(status: CommercialStatus): boolean {
  return status === 'lost';
}

export function isOpenPipelineStatus(status: CommercialStatus): boolean {
  return OPEN_PIPELINE_STATUSES.includes(status);
}

// Weighted pipeline (Probability of Conversion x Total) is deliberately
// NOT computed anywhere yet — the Discovery brief treats Probability data
// quality as a later exercise. Do not add a weighted-pipeline figure
// without first auditing real Probability values the same way Status was
// audited here.

// ---- "Where Did You Hear About Us?" — CONFIRMED rule (2026-09-04) ----
//
// This is a manually completed sales field — a person in the sales team
// typing a category (e.g. "Google", "Referral", "Website", "Email") into
// Acumatica while logging the opportunity. It is NOT a marketing-system
// value, is not guaranteed to be consistently completed, and must never be
// treated as authoritative campaign attribution:
//   - It must never override, supplement, or be merged with deterministic
//     marketing attribution (Campaign Monitor's campaignId, Google Ads'
//     campaign.id match, GA4's sessionCampaignName match — see
//     src/utils/campaignAttribution.ts on the frontend). Those remain the
//     only sources campaign attribution is ever built from.
//   - The raw Acumatica value is stored and reported completely unmodified
//     — acumaticaRepository.ts's heard_about_us column already does this
//     (see acumaticaImport.ts's FIELD_ALIASES/cell() — a genuinely blank
//     cell is stored as null, never invented).
//   - Whenever this field is displayed anywhere, it must be labelled
//     "Sales-reported source" (or equivalent wording making clear it's a
//     free-text sales entry) — never a bare "Source" that could be read as
//     equivalent to a real marketing-attributed source/channel.
//   - A blank/missing value must display as "Unspecified" — use
//     formatSalesReportedSource() below wherever this field is rendered,
//     rather than showing an empty cell, a dash, or "null".
export function formatSalesReportedSource(rawHeardAboutUs: string | null): string {
  return rawHeardAboutUs ?? 'Unspecified';
}

