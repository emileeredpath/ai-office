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
  // Seconds. Total call duration (ring + connected).
  callDuration: number | null;
  // Seconds. Only non-zero once a call is actually bridged to a person —
  // used as the "answered" signal (see isAnswered below) since Infinity's
  // `callState` enum values aren't confirmed against the real account yet.
  bridgeDuration: number | null;
  ringTime: number | null;
  // Surfaced as-is, unclassified — once real callState values are
  // confirmed, this can replace the bridgeDuration heuristic below.
  callState: string | null;
  callDirection: string | null;
  landingPageUrl: string | null;
  conversionPageUrl: string | null;
  ppcAssisted: boolean | null;
}

function isAnswered(call: InfinityCallRecord): boolean {
  return (call.bridgeDuration ?? 0) > 0;
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
  callDuration?: number;
  bridgeDuration?: number;
  ringTime?: number;
  callState?: string;
  callDirection?: string;
  landingPageUrl?: string;
  conversionPageUrl?: string;
  ppcAssisted?: boolean;
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
    callDuration: typeof row.callDuration === 'number' ? row.callDuration : null,
    bridgeDuration: typeof row.bridgeDuration === 'number' ? row.bridgeDuration : null,
    ringTime: typeof row.ringTime === 'number' ? row.ringTime : null,
    callState: row.callState ?? null,
    callDirection: row.callDirection ?? null,
    landingPageUrl: row.landingPageUrl ?? null,
    conversionPageUrl: row.conversionPageUrl ?? null,
    ppcAssisted: typeof row.ppcAssisted === 'boolean' ? row.ppcAssisted : null,
  };
}

function defaultMonthToDateRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
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
    const params = new URLSearchParams({
      startDate: range.startDate,
      endDate: range.endDate,
      limit: '1000',
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
    const rows = parseNdjson(text);
    const calls = rows.map(toCallRecord);

    return { configured: true, calls, mappedBrands: MAPPED_BRANDS, errors: [] };
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
  const answeredCalls = calls.filter(isAnswered).length;
  const missedCalls = calls.length - answeredCalls;
  const durations = calls.map((c) => c.callDuration ?? 0);
  const avgSeconds = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const callData: CallData[] = calls.map((c) => ({
    id: c.rowId,
    date: c.triggerDatetime.split('T')[0] ?? '',
    time: c.triggerDatetime.split('T')[1]?.slice(0, 5) ?? '',
    duration: formatDuration(c.callDuration ?? 0),
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
