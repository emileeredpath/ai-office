# AI Office — Reporting Period: Source-by-Source Reality

This document records, per data source, whether the global reporting-period selector (`src/contexts/PeriodContext.tsx` — This month / This quarter / This year / All time) is genuinely respected, and any real lag, staleness, or coverage gap that would make a strict "this exact period" claim dishonest. It exists so nobody — human or AI — assumes uniform period behaviour across integrations without checking. See `DATA_INTEGRITY.md` for the governing principle this document serves.

## Summary

| Source | Respects the period selector? | Caveat |
|---|---|---|
| GA4 (traffic, social, enquiries) | Yes — arbitrary date range, queried live | None significant |
| Google Ads | Yes — arbitrary date range, queried live | Single fixed 10k-row page, no pagination loop (not a realistic limit at MTech's scale today) |
| Infinity (calls) | Yes — arbitrary date range, queried live | **Hardcoded `limit: 1000`, no pagination loop.** A period/entity combination genuinely returning ≥1000 calls would be silently truncated with no indication more rows exist. Fine at current volumes; must be fixed before trusting large-period or MTech-Group-aggregate comparisons at higher volume. |
| Campaign Monitor (email) | The *read* query is honest (filters exactly `[startDate, endDate]` against already-synced data) | **The underlying data is populated by a decoupled weekly sync with only a 7-day lookback by default.** Any missed/disabled sync week creates a permanent, invisible gap for anything before that week — "This quarter"/"All time" can look complete while actually missing a real week of sends, with no UI signal beyond generic sync-success/failure status. |
| Search Console | Yes — arbitrary date range, queried live | **Explicit, documented 2–3 day indexing lag** — the only source with this surfaced directly in its screen's UI copy (`src/screens/WebsiteScreen.tsx`). A period comparison run early in a month can show an artificially low "current" figure from lag alone, not a real decline. |
| Stored campaign data (leads/spend/enquiries) | Yes, but with different semantics: a campaign is included if it starts OR ends on/after the period start — there is **no upper bound**, unlike every API-backed source's `[start, today]` window | A campaign scheduled to start after the period's end can still appear "in" that period under this rule. Relevant to previous-period comparisons — see `src/utils/periodComparison.ts`'s own bounded re-implementation, built specifically because `filterCampaignsByPeriod` cannot be reused unmodified for a bounded historical slice. |
| Funding | **No — never period-filtered, anywhere, by explicit design.** `FundingRecord.period` is a free-text label ("Q3 2026"), not a real date the app can honestly match against the selector. | Already disclosed in the Reports CSV export ("Real, entity-filtered — not period-scoped") and in code comments. Excluded from previous-period comparisons entirely, on the same grounds. |
| Native AI Office tasks | No general period filter on any screen (only entity/status/ownership/campaign filters). The one exception is Campaign Monitor email-send tasks, filtered by `sentDate` — see the Campaign Monitor row above. | — |

## Implication for previous-period comparisons

Only sources with a genuine, bounded `[start, end]` window and no severe silent-gap risk can honestly support a previous-period comparison today: **Website Users (GA4), GA4 Enquiries, plain Enquiries, Marketing Leads, Google Ads spend/clicks/conversions**. See `KPI_DEFINITIONS.md` for exactly which KPIs these back, and `src/utils/periodComparison.ts` for the shared comparison utility built from this audit.

Explicitly excluded from comparison, with reasons:
- **Known Campaign Spend** — Performance retains lifetime fixed costs for the selected campaign set plus available mapped media for the selected API period. Its totals are unchanged, but this mixed scope is not spend incurred during that period and must not be compared as such.
- **Funding** — not period-scoped at all (see above).
- **Qualified Leads** — no underlying data exists yet.
- **Opportunities / Open Pipeline / Won Deals / Won Revenue** — CONFIRMED (Dashboard Completion Phase 2, Overview redesign): the Acumatica manual export has `Created On` and `Estimated Close Date` but no trustworthy Won Date. Filtering by `Created On` (the only date `getAcumaticaSummary` can filter by) would silently misrepresent "revenue already marked Won among opportunities created in this period" as "revenue won during this period" — a different, dishonest claim. These figures are therefore never period-scoped or period-compared on Overview: they always reflect the latest full manual import, labelled "Latest Acumatica export" with its import date shown. Leads & CRM makes a different, narrower choice (filtering by `Created On` for its own KPI cards) — that is a pre-existing, separately-reviewed decision on that screen, not touched here.
- **ROI** — technically computable, but built entirely from one uncaveated manual figure (`valueGenerated`) with no real commercial data behind it; comparing two unverifiable numbers period-over-period would look precise while being no more reliable than the single-period figure already is.
- **Infinity calls, for a period/entity combination near or above 1000 raw calls** — the pagination cap above means a comparison could silently compare a truncated period against a complete one. Not disabled outright (current volumes are well under 1000), but flagged for anyone extending this to a busier account.

## Phase 1 campaign cost date audit

`campaign_costs.cost_date` is NOT NULL, with no database default. The REST API requires a non-empty string but does not establish a genuine transaction date. `restoreEducationStructuredCost()` sets the restored £1,791 cost date to `REAL_EDUCATION_CORE.endDate`; this is a campaign boundary, not independently verified cost-date evidence. Legacy `campaign.spend` has no cost date. No dates have been migrated or manufactured in this clean-up.

The isolated local seed database inspected for this change has zero structured rows and four campaigns with positive legacy spend. This does not establish hosted preview or production coverage; neither live database was inspected. Reliable period attribution cannot be established, so the numerical calculation is deliberately unchanged.

Campaign Detail and the Campaigns table continue using lifetime fixed costs plus mapped media returned by the existing all-time query. Overview's active campaign rows use the same scope. Performance retains its existing selected campaign set, lifetime fixed costs and reporting-period mapped media, explicitly labelled as mixed scope. Per-entity campaign spend can overlap for multi-entity campaigns; entity rows must not be added together to reconstruct the group total.

## Phase 1 Acumatica Won Revenue semantics

The persisted/imported date fields are `created_on` / `createdOn` and `estimated_close_date` / `estimatedCloseDate`, plus import/audit timestamps. No canonical Won Date or Closed Date is stored. The importer accepts the header `close date` as an alias for **estimated** close date; that alias is not evidence of an actual won date. No live export coverage was claimed or inferred.

Performance and Leads & CRM retain the existing definition: when start and end dates are supplied, sum `Total` for opportunities whose `Created On` is in the inclusive selected range and whose current imported `Status` is Won. This is not revenue that became Won during that period. With All time selected, there is no Created On filter. Overview continues to use the latest full import without period filtering.

All numerical calculations, Status classification, Open + New pipeline, Stage handling, entity availability and Sales-reported Source remain unchanged.
