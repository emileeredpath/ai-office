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

Only sources with a genuine, bounded `[start, end]` window and no severe silent-gap risk can honestly support a previous-period comparison today: **Website Users (GA4), GA4 Enquiries, plain Enquiries, Marketing Leads, Marketing Spend, Google Ads spend/clicks/conversions**. See `KPI_DEFINITIONS.md` for exactly which KPIs these back, and `src/utils/periodComparison.ts` for the shared comparison utility built from this audit.

Explicitly excluded from comparison, with reasons:
- **Funding** — not period-scoped at all (see above).
- **Qualified Leads / Opportunities / Pipeline / Won Revenue / Won Deals** — no underlying data exists yet (Acumatica not connected); there is nothing to compare.
- **ROI** — technically computable, but built entirely from one uncaveated manual figure (`valueGenerated`) with no real commercial data behind it; comparing two unverifiable numbers period-over-period would look precise while being no more reliable than the single-period figure already is.
- **Infinity calls, for a period/entity combination near or above 1000 raw calls** — the pagination cap above means a comparison could silently compare a truncated period against a complete one. Not disabled outright (current volumes are well under 1000), but flagged for anyone extending this to a busier account.
