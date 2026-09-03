# AI Office — Non-Negotiable Data Integrity Rule

This rule governs the entire application: the standard 2D dashboard, MTech HQ / 3D Office (planned — see below), Reports, AI features (the Brief Generator, MCP-driven actions), campaign reporting, and every future integration. Where any other document, comment, or instruction is ambiguous, this one governs.

## The rule

**AI Office must only display genuine data.** Never create, seed, infer, or fabricate production data simply to populate the interface. This applies without exception to: tasks, campaigns, leads, enquiries, opportunities, pipeline, revenue, marketing spend, email sends, calls, website performance, PPC performance, social performance, funding records, deadlines, notifications, activity feeds, AI summaries, MTech HQ screens, and character/avatar messages.

This is not a new principle — it is already the pervasive, repeated convention throughout this codebase (see the many `// never guessed`, `// honestly "Not connected"`, `// never invents a result` comments across `src/` and `backend/src/`). This document makes it explicit and binding so it survives beyond any one contributor's session.

## Tasks and campaigns

Tasks shown in AI Office must be genuine tasks actually created by a user, an authorised AI/MCP action, or a genuine connected source (e.g. a real Campaign Monitor send synced in as a task row). Campaigns must likewise be genuine records intentionally created in AI Office or imported/synchronised from an approved source. **Never automatically manufacture a task or campaign because the interface expects content to display** — an empty list is the correct, honest state when there is genuinely nothing there.

## Integrations

Data from GA4, Google Ads, Campaign Monitor, Infinity, Search Console, and any future integration must come from the genuine connected API/data source. If an integration is unavailable, disconnected, or returns no data for the selected period/entity, show that honestly (the `{status: 'not-connected', ...}` pattern used throughout the app) — never substitute a plausible-looking number.

## Acumatica

Until Acumatica is genuinely connected, Leads & CRM and every other CRM-dependent figure across the app must not manufacture CRM information. Opportunity, pipeline, won/lost, and revenue figures remain "Not connected" wherever that is the honest state today. Once Acumatica is connected, those figures must originate from genuine Acumatica records, using an explicitly agreed attribution model — not an assumed or invented one.

## MTech HQ (planned)

Every number, task, campaign, notification, and character message displayed inside MTech HQ must use the same genuine AI Office data sources as the standard dashboard. The character may only say something like `You have 4 tasks due this week` if AI Office genuinely contains four such tasks, computed the same way the equivalent 2D KPI/list computes it. **It must never generate a plausible-looking statement merely to make the office feel active.** If there is nothing to report, it must say something truthful, e.g. `You have no tasks due today.`

MTech HQ, and any future alternative interface, must **not** maintain a separate copy of operational data — it must read from the same underlying store/API the standard dashboard uses, so a task, campaign, or KPI can never disagree between the 2D dashboard and MTech HQ. This is a core architectural requirement, not a design preference.

## AI-generated content

AI may summarise, explain, analyse, or recommend actions based on genuine data, but any such output must be clearly distinguished from a recorded fact. AI must never silently turn a suggestion into a factual record. For example, `Suggested task: Review Education campaign results` is a distinct, clearly-labelled AI suggestion — it is not the same thing as `Task: Review Education campaign results`, which asserts a real task record exists. A suggested task only becomes a real task after an explicit, authorised creation action — never automatically, and never silently.

## Development and testing

Test/seed data may only be used in isolated local/test environments, and must be clearly identifiable as test data. **Never seed fake/demo records into production or the live preview database** simply to demonstrate functionality. Temporary test records must never contaminate genuine reporting — if a feature needs a "test" concept (as Campaign Monitor's real `isTest` flag already models for Education 2026 sends), it must be visibly marked as such and excluded from production totals.

## Empty states

Prefer honest empty states over fake content, always: "Not connected" · "No data yet" · "No campaigns in this period" · "No tasks due" · "Not available from this data source" · "Awaiting Acumatica integration." **This principle takes priority over making a screen appear populated.**

## Single source of truth

Any alternative interface to the standard dashboard (MTech HQ included) must read from the same underlying AI Office records/APIs, never a separately fetched or cached copy of the same data.
