# AI Office — Reporting Period: Source-by-Source Reality

This document records, per data source, whether the global reporting-period selector (`src/contexts/PeriodContext.tsx` — This month / This quarter / This year / All time) is genuinely respected, and any real lag, staleness, or coverage gap that would make a strict "this exact period" claim dishonest. It exists so nobody — human or AI — assumes uniform period behaviour across integrations without checking. See `DATA_INTEGRITY.md` for the governing principle this document serves.

## Summary

| Source | Respects the period selector? | Caveat |
|---|---|---|
| GA4 (traffic, social, enquiries) | Yes — arbitrary date range, queried live | None significant |
| Google Ads | Yes — arbitrary date range, queried live | Single fixed 10k-row page, no pagination loop (not a realistic limit at MTech's scale today) |
| Infinity (general calls) | Yes — the canonical `infinity-calls` query uses the selected date range | Paginates 1,000 rows per page, up to 20 pages. Repeated-page and safety-cap warnings identify potentially incomplete responses. Performance and Call Tracking use this path. The retained Wave 1 campaign table follows a separate legacy path. |
| Campaign Monitor (email) | Read queries filter the selected range against synced records | The decoupled sync lookback can leave gaps. `getCampaignMonitorCoverage()` reports provable continuous coverage from recorded sync windows; Email surfaces that coverage. Successful sync alone is not proof of complete historical coverage. |
| Search Console | Yes — arbitrary date range, queried live | **Explicit, documented 2–3 day indexing lag** — the only source with this surfaced directly in its screen's UI copy (`src/screens/WebsiteScreen.tsx`). A period comparison run early in a month can show an artificially low "current" figure from lag alone, not a real decline. |
| Stored campaign leads/enquiries and legacy spend | Campaign selection uses start OR end on/after period start, with no upper bound | These are campaign totals, not dated individual events. The comparison utility uses bounded historical campaign selection; it does not establish when individual leads/enquiries occurred. |
| Funding | **No — never period-filtered, anywhere, by explicit design.** `FundingRecord.period` is a free-text label ("Q3 2026"), not a real date the app can honestly match against the selector. | Already disclosed in the Reports CSV export ("Real, entity-filtered — not period-scoped") and in code comments. Excluded from previous-period comparisons entirely, on the same grounds. |
| Native AI Office tasks | No general period filter on any screen (only entity/status/ownership/campaign filters). The one exception is Campaign Monitor email-send tasks, filtered by `sentDate` — see the Campaign Monitor row above. | — |

## Implication for previous-period comparisons

Existing previous-period comparisons are available for: **Website Users (GA4), GA4 Enquiries, plain Enquiries, Marketing Leads, Google Ads spend/clicks/conversions**. Manual Enquiries and Marketing Leads compare campaign cohorts, not dated individual events. See `KPI_DEFINITIONS.md` for which KPIs these back, and `src/utils/periodComparison.ts` for the shared comparison utility built from this audit.

Explicitly excluded from comparison, with reasons:
- **Known Campaign Spend** — Performance retains lifetime fixed costs for the selected campaign set plus available mapped media for the selected API period. Its totals are unchanged, but this mixed scope is not spend incurred during that period and must not be compared as such.
- **Funding** — not period-scoped at all (see above).
- **Qualified Leads** — no underlying data exists yet.
- **Opportunities / Open Pipeline / Won Deals / Won Revenue** — no trustworthy Won Date is persisted. Overview uses the latest full manual import. Performance and Leads & CRM use opportunity Created On for selected-period cohorts and current imported Status. The displayed wording now states this distinction; none is a revenue-won-during-period comparison.
- **ROI** — the Campaigns table still uses manual `valueGenerated` and legacy `campaign.spend`. It is not verified commercial return and has not been migrated to canonical spend.
- **Infinity calls** — Performance does not introduce a previous-period comparison. Any future comparison must account for response errors, mapping coverage and pagination warnings; a successful empty mapped response is distinct from unavailable data.

## Phase 1 campaign cost date audit

`campaign_costs.cost_date` is NOT NULL, with no database default. The REST API requires a non-empty string but does not establish a genuine transaction date. `restoreEducationStructuredCost()` sets the restored £1,791 cost date to `REAL_EDUCATION_CORE.endDate`; this is a campaign boundary, not independently verified cost-date evidence. Legacy `campaign.spend` has no cost date. No dates have been migrated or manufactured in this clean-up.

The isolated local seed database inspected for this change has zero structured rows and four campaigns with positive legacy spend. This does not establish hosted preview or production coverage; neither live database was inspected. Reliable period attribution cannot be established, so the numerical calculation is deliberately unchanged.

Campaign Detail and the Campaigns table continue using lifetime fixed costs plus mapped media returned by the existing all-time query. Overview's active campaign rows use the same scope. Performance retains its existing selected campaign set, lifetime fixed costs and reporting-period mapped media, explicitly labelled as mixed scope. Per-entity campaign spend can overlap for multi-entity campaigns; entity rows must not be added together to reconstruct the group total.

## Phase 1 Acumatica Won Revenue semantics

The persisted/imported date fields are `created_on` / `createdOn` and `estimated_close_date` / `estimatedCloseDate`, plus import/audit timestamps. No canonical Won Date or Closed Date is stored. The importer accepts the header `close date` as an alias for **estimated** close date; that alias is not evidence of an actual won date. No live export coverage was claimed or inferred.

Performance and Leads & CRM retain the existing definition: when start and end dates are supplied, sum `Total` for opportunities whose `Created On` is in the inclusive selected range and whose current imported `Status` is Won. This is not revenue that became Won during that period. With All time selected, there is no Created On filter. Overview continues to use the latest full import without period filtering.

All numerical calculations, Status classification, Open + New pipeline, Stage handling, entity availability and Sales-reported Source remain unchanged.

## Phase 1 retained legacy paths and write contract

The shared campaign table on Performance and Reports retains the Wave 1 snapshot. The legacy Infinity aggregate is assigned to the hardcoded Wave 1 campaign; this path is not evidence of deterministic per-campaign attribution. Phase 1 moved general Performance call reporting to canonical Infinity without expanding or rewriting that retained table path.

The MCP `ai_office_update_campaign` tool and its action-service validator reject legacy `actualSpend` and unknown fields before applying updates. Generic MCP writes cannot edit campaign spend or expose `campaign_costs`. Structured cost entry remains in the existing Campaign Costs UI. Existing task-cost recalculation can still update legacy campaign spend indirectly; this was deliberately outside the direct MCP campaign-field change.

No schema, production data, attribution mapping or Railway configuration changed in Phase 1. These statements describe this local implementation, not a deployment or live-data audit.
