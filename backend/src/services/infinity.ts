// Infinity call tracking integration.
//
// Corrected against the real account, verified live during the Infinity
// diagnostic (see conversation history — not re-derived here):
//   - Host:  https://api.infinitycloud.com  (NOT api.infinitytracking.com)
//   - Auth:  Authorization: ApiKey <key>    (NOT Bearer)
//   - Calls: GET /reports/v2.1/igrps/{igrpId}/triggers/calls
//            (NOT /api/v1/calls, and it takes no "campaign" filter — Infinity
//            has no concept of AI Office's internal campaign IDs)
//   - The response body is newline-delimited JSON (one call object per
//     line), not a single JSON document with a `calls[]` wrapper.
//   - Answered/missed: `callStage === 'bridge'` means the call connected to
//     a person — confirmed against real responses. `callState` (e.g.
//     NORMAL_CLEARING_A/B) is a hangup-reason code, not an answered signal,
//     and is not used for this. Connected-call duration is the
//     `bridgeDuration` field (seconds) — averaged across answered calls
//     only, never across all calls. `callDuration` (ring + connected) is
//     kept on the record but not used for this metric.
//   - Duration fields (`callDuration`, `bridgeDuration`, `ringTime`) are
//     confirmed real as numeric strings (e.g. "145"), not JSON numbers —
//     diagnosed after live MTech Group Average Call Duration showed 0s
//     despite 72 answered calls. A strict `typeof === 'number'` guard was
//     silently discarding every real value to null (then `?? 0` averaged
//     to zero). See parseDurationField/toCallRecord — both numbers and
//     numeric strings are accepted; genuinely invalid/blank values stay
//     null and are never coerced to 0.
//   - Pagination: confirmed real (limit/offset both honoured; a 30-day,
//     125-row window was not truncated at limit=1000). fetchAllCallRows
//     below now loops on offset until a page returns fewer than
//     CALLS_PAGE_SIZE rows, so a query legitimately returning >1000 calls
//     is no longer silently truncated. Defended against two ways this
//     could still go wrong without a live account to test against: (1) a
//     hard page-count cap (CALLS_MAX_PAGES) in case a real query is ever
//     larger than that, and (2) a same-page-twice guard in case offset is
//     ever NOT honoured for some request shape — either case is reported
//     as a genuine error/truncation flag, never silently returned as if
//     the totals were complete.
//   - Marketing attribution (Phase 2): `chType` is the confirmed real
//     source-classification field — 'ppc'/'seo'/'direct'/'ref' are the
//     only confirmed values (mapped in src/utils/callPerformance.ts on the
//     frontend); anything else, including blank, is genuinely
//     Unclassified, never guessed as Direct. `ppcAssisted` is confirmed
//     real but serialized as 1/0, not a JSON boolean — see toCallRecord.
//     `campaign`/`adGroup`/`keywordRef` were confirmed blank in real
//     records during this audit and are deliberately not surfaced.
//
// Entity attribution: the account's one IGRP (id set via INFINITY_IGRP_ID)
// contains calls for multiple MTech entities, distinguished by each call's
// `dgrpName` field. Only dgrpName values explicitly confirmed against the
// real account are mapped below — any other dgrpName (Capcom's real value
// is not yet known, nor is IDARO's) is left unmapped (brand: null) rather
// than guessed. Unmapped calls are real data, just not attributable to a
// specific entity yet — never silently dropped, never silently attributed.
import type { Brand } from '../types.js';

const INFINITY_API_BASE = 'https://api.infinitycloud.com';

// Confirmed live against the real account — see the diagnostic history.
// Not hardcoded: set as an env var so a Railway-side account change never
// requires a code change/redeploy.
const IGRP_ID_ENV = 'INFINITY_IGRP_ID';

// Confirmed real dgrpName -> brand mappings only. Do not add an entry here
// without verifying it against the real account first.
const DGRP_NAME_TO_BRAND: Record<string, Brand> = {
  'IRCL': 'ircl',
  'Radio Links': 'radio-links',
  'Brentwood Radios - 40398': 'brentwood',
};

function mapDgrpNameToBrand(dgrpName: string | undefined | null): Brand | null {
  if (!dgrpName) return null;
  return DGRP_NAME_TO_BRAND[dgrpName] ?? null;
}

// Which brands have a confirmed real dgrpName mapping right now — static,
// not derived from a given response, so a brand with zero real calls in a
// period (a genuine "0 calls this period") is never confused with a brand
// that has no confirmed mapping at all (e.g. Capcom today).
export const MAPPED_BRANDS: Brand[] = Array.from(new Set(Object.values(DGRP_NAME_TO_BRAND)));

export interface InfinityCallRecord {
  rowId: string;
  triggerDatetime: string;
  brand: Brand | null;
  dgrpName: string | null;
  chName: string | null;
  chType: string | null;
  src: string | null;
  dialledPhoneNumber: string | null;
  customerPhoneNumber: string | null;
  // Seconds. Ring + connected — kept on the record, but not used as the
  // connected-conversation duration (bridgeDuration is, see below).
  callDuration: number | null;
  // Seconds. The genuine connected/talk duration once a call reaches the
  // "bridge" stage. Used for Average Call Duration, averaged across
  // answered calls only.
  bridgeDuration: number | null;
  ringTime: number | null;
  // The stage the call reached: 'bridge' means answered/connected — the
  // confirmed real signal (see isAnswered below). Not to be confused with
  // callState, which is a hangup-reason code (e.g. NORMAL_CLEARING_A/B),
  // not an answered/missed signal.
  callStage: string | null;
  // Hangup-reason code, surfaced as-is — not used for answered/missed.
  callState: string | null;
  callDirection: string | null;
  landingPageUrl: string | null;
  conversionPageUrl: string | null;
  // Kept for future marketing-attribution use, not consumed yet.
  pageTitle: string | null;
  campaign: string | null;
  adGroup: string | null;
  // Confirmed real, populated as 1/0 (not a JSON boolean) — see toCallRecord.
  ppcAssisted: boolean | null;
  // Retained for future use per the Phase 2 audit — confirmed populated,
  // not surfaced in the UI yet.
  href: string | null;
  pub: string | null;
  dom: string | null;
}

// Confirmed against real responses: a call reaching the "bridge" stage is
// a genuinely answered/connected call. Any other final stage (ring, ivr,
// queue, voicemail) is treated as missed for this metric.
function isAnswered(call: InfinityCallRecord): boolean {
  return call.callStage === 'bridge';
}

export interface InfinityCallsResult {
  configured: boolean;
  calls: InfinityCallRecord[];
  mappedBrands: Brand[];
  errors: string[];
}

// Raw shape of one NDJSON line from the calls report — only the fields we
// use are typed; the endpoint returns more than this.
interface RawCallRow {
  rowId?: string | number;
  triggerDatetime?: string;
  dgrp?: string | number;
  dgrpName?: string;
  chName?: string;
  chType?: string;
  src?: string;
  href?: string;
  dialledPhoneNumber?: string;
  customerPhoneNumber?: string;
  // Confirmed real shape: numeric strings (e.g. "145"), not JSON numbers —
  // typed for both since Infinity's own serialization isn't guaranteed
  // stable across accounts.
  callDuration?: number | string;
  bridgeDuration?: number | string;
  ringTime?: number | string;
  callStage?: string;
  callState?: string;
  callDirection?: string;
  landingPageUrl?: string;
  conversionPageUrl?: string;
  pageTitle?: string;
  campaign?: string;
  adGroup?: string;
  // Confirmed real shape: 1/0, not a JSON boolean — typed for both since
  // Infinity's own serialization isn't guaranteed stable across accounts.
  ppcAssisted?: boolean | number;
  pub?: string;
  dom?: string;
}

// The calls report returns one JSON object per line, not a JSON array or
// a `{ calls: [...] }` wrapper. Parsed defensively — one malformed line
// doesn't discard the rest of a real response.
function parseNdjson(text: string): RawCallRow[] {
  const rows: RawCallRow[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed) as RawCallRow);
    } catch {
      // Skip an unparseable line rather than failing the whole fetch.
    }
  }
  return rows;
}

// Accepts a genuine number or a numeric string (Infinity's real shape for
// callDuration/bridgeDuration/ringTime — confirmed via live diagnostic).
// Anything else — undefined, blank, non-numeric text, NaN — stays null.
// Never coerced to 0: a missing duration is not the same claim as a real
// zero-second call.
function parseDurationField(value: number | string | undefined): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toCallRecord(row: RawCallRow): InfinityCallRecord {
  const dgrpName = row.dgrpName ?? null;
  return {
    rowId: String(row.rowId ?? ''),
    triggerDatetime: row.triggerDatetime ?? '',
    brand: mapDgrpNameToBrand(dgrpName),
    dgrpName,
    chName: row.chName ?? null,
    chType: row.chType ?? null,
    src: row.src ?? null,
    dialledPhoneNumber: row.dialledPhoneNumber ?? null,
    customerPhoneNumber: row.customerPhoneNumber ?? null,
    callDuration: parseDurationField(row.callDuration),
    bridgeDuration: parseDurationField(row.bridgeDuration),
    ringTime: parseDurationField(row.ringTime),
    callStage: row.callStage ?? null,
    callState: row.callState ?? null,
    callDirection: row.callDirection ?? null,
    landingPageUrl: row.landingPageUrl ?? null,
    conversionPageUrl: row.conversionPageUrl ?? null,
    pageTitle: row.pageTitle ?? null,
    campaign: row.campaign ?? null,
    adGroup: row.adGroup ?? null,
    // Real data is 1/0, not a JSON boolean — a plain `typeof === 'boolean'`
    // check would silently read every real row as null. Handle both shapes.
    ppcAssisted:
      typeof row.ppcAssisted === 'number'
        ? row.ppcAssisted === 1
        : typeof row.ppcAssisted === 'boolean'
          ? row.ppcAssisted
          : null,
    href: row.href ?? null,
    pub: row.pub ?? null,
    dom: row.dom ?? null,
  };
}

function defaultMonthToDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
}

const CALLS_PAGE_SIZE = 1000;
// Safety cap on pagination, mirroring the same pattern already used for
// Campaign Monitor's Top Links pagination (campaignMonitor.ts's
// TOP_LINKS_MAX_PAGES) — 20 pages * 1000 rows = 20,000 calls, far more
// than any single MTech period/entity query should realistically return.
// If this is ever genuinely hit, it's reported as a truncation error
// rather than silently returned as a complete total.
const CALLS_MAX_PAGES = 20;

interface FetchAllResult {
  rows: RawCallRow[];
  truncationWarning: string | null;
}

// Loops on `offset` until a page returns fewer than CALLS_PAGE_SIZE rows
// (the real signal that there's no more data, confirmed against the live
// account per this file's header comment). Two defensive stops, neither
// verifiable from this sandbox (no live Infinity account reachable here)
// so both are treated as genuine unknowns, reported honestly rather than
// assumed safe:
//   1. CALLS_MAX_PAGES reached — a real period/entity query returned more
//      calls than the safety cap allows for.
//   2. A page contributes zero rowIds not already seen — offset may not
//      be honoured for this request shape (would otherwise loop forever
//      re-fetching the same page).
async function fetchAllCallRows(
  apiKey: string,
  igrpId: string,
  range: { startDate: string; endDate: string }
): Promise<FetchAllResult> {
  const rows: RawCallRow[] = [];
  const seenRowIds = new Set<string>();

  for (let page = 0; page < CALLS_MAX_PAGES; page++) {
    const offset = page * CALLS_PAGE_SIZE;
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      limit: String(CALLS_PAGE_SIZE),
      offset: String(offset),
      tz: 'Europe/London',
    });
    const response = await fetch(
      `${INFINITY_API_BASE}/reports/v2.1/igrps/${igrpId}/triggers/calls?${params.toString()}`,
      {
        method: 'GET',
        headers: { Authorization: `ApiKey ${apiKey}` },
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Infinity API call failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const text = await response.text();
    const pageRows = parseNdjson(text);
    if (pageRows.length === 0) break; // genuinely no more data

    const newRowIds = pageRows.filter((r) => !seenRowIds.has(String(r.rowId ?? ''))).length;
    if (newRowIds === 0) {
      return {
        rows,
        truncationWarning:
          `Infinity pagination stopped after ${rows.length} call(s): the next page returned no new rows, ` +
          `which usually means offset isn't being honoured for this request — results may be incomplete rather than complete.`,
      };
    }
    for (const r of pageRows) seenRowIds.add(String(r.rowId ?? ''));
    rows.push(...pageRows);

    if (pageRows.length < CALLS_PAGE_SIZE) break; // last page — fewer rows than a full page

    if (page === CALLS_MAX_PAGES - 1) {
      return {
        rows,
        truncationWarning:
          `Infinity returned at least ${rows.length} call(s) for this period and is still paging — ` +
          `stopped after the ${CALLS_MAX_PAGES}-page safety cap (${CALLS_MAX_PAGES * CALLS_PAGE_SIZE} calls); ` +
          `real totals for this period/entity may be higher than what's shown.`,
      };
    }
  }

  return { rows, truncationWarning: null };
}

// Fetches real Infinity call records for a genuine calendar date range.
// No campaign filter is sent — Infinity has no concept of AI Office's
// internal campaign IDs, so filtering by campaign happens (if ever) on the
// AI Office side once a defensible Infinity-side identifier exists for a
// specific campaign.
export async function fetchInfinityCalls(startDate?: string, endDate?: string): Promise<InfinityCallsResult> {
  const apiKey = process.env.INFINITY_API_KEY;
  const igrpId = process.env[IGRP_ID_ENV];

  if (!apiKey) {
    return { configured: false, calls: [], mappedBrands: MAPPED_BRANDS, errors: ['INFINITY_API_KEY is not set'] };
  }
  if (!igrpId) {
    return { configured: false, calls: [], mappedBrands: MAPPED_BRANDS, errors: [`${IGRP_ID_ENV} is not set`] };
  }

  const range = startDate && endDate ? { startDate, endDate } : defaultMonthToDateRange();

  try {
    const { rows, truncationWarning } = await fetchAllCallRows(apiKey, igrpId, range);
    const calls = rows.map(toCallRecord);
    // A real, partial result still returns everything genuinely fetched —
    // paired with an explicit warning in `errors` (surfaced today via the
    // Call Tracking screen's existing DataFreshnessBar error state) rather
    // than either hiding the gap or discarding real data just because the
    // total might be incomplete.
    return { configured: true, calls, mappedBrands: MAPPED_BRANDS, errors: truncationWarning ? [truncationWarning] : [] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[infinity] failed to fetch call records:', msg);
    return { configured: true, calls: [], mappedBrands: MAPPED_BRANDS, errors: [msg] };
  }
}

// ---------------------------------------------------------------------
// Legacy shape, preserved for existing callers (wave1Sync.ts, the /wave1/
// calls route, and the Home/Performance "Calls" channel snapshot) — a
// combined, entity-unaware total across every call fetchInfinityCalls
// returns for a default month-to-date window. Never scoped to Wave 1 or
// any other specific campaign, because Infinity has no identifier for one.
export interface CallData {
  id: string;
  date: string;
  time: string;
  duration: string;
  answered: boolean;
  callerNumber: string;
  campaign: string;
  recordingUrl?: string;
}

export interface InfinityMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: string;
  calls: CallData[];
}

export interface InfinityResult {
  configured: boolean;
  metrics: InfinityMetrics | null;
  errors: string[];
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export async function getWave1CallMetrics(): Promise<InfinityResult> {
  const result = await fetchInfinityCalls();

  if (!result.configured) {
    return { configured: false, metrics: null, errors: result.errors };
  }
  if (result.errors.length > 0) {
    return { configured: true, metrics: null, errors: result.errors };
  }

  const { calls } = result;
  const answered = calls.filter(isAnswered);
  const answeredCalls = answered.length;
  const missedCalls = calls.length - answeredCalls;
  // Average Call Duration = connected/talk time (bridgeDuration), averaged
  // across answered calls only — never across missed calls, which have no
  // connected duration to average in.
  const bridgeDurations = answered.map((c) => c.bridgeDuration ?? 0);
  const avgSeconds =
    bridgeDurations.length > 0 ? Math.round(bridgeDurations.reduce((a, b) => a + b, 0) / bridgeDurations.length) : 0;

  const callData: CallData[] = calls.map((c) => ({
    id: c.rowId,
    date: c.triggerDatetime.split('T')[0] ?? '',
    time: c.triggerDatetime.split('T')[1]?.slice(0, 5) ?? '',
    duration: formatDuration(isAnswered(c) ? c.bridgeDuration ?? 0 : c.callDuration ?? 0),
    answered: isAnswered(c),
    callerNumber: c.customerPhoneNumber ?? '',
    campaign: '',
    recordingUrl: undefined,
  }));

  return {
    configured: true,
    metrics: {
      totalCalls: calls.length,
      answeredCalls,
      missedCalls,
      avgDuration: formatDuration(avgSeconds),
      calls: callData,
    },
    errors: [],
  };
}
