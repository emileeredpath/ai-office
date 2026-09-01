import type { Brand } from '@/types/index';
import type { EntitySelection } from '@/contexts/EntityContext';
import type { Period } from '@/contexts/PeriodContext';
import { periodStartDate } from '@/contexts/PeriodContext';
import type {
  SearchConsoleResponse,
  BrandSearchConsolePerformance,
  SearchConsoleQueryRow,
  SearchConsolePageRow,
  SearchConsoleQueryPageRow,
} from '@/services/searchConsoleApi';
import { GROUP_AGGREGATE_BRANDS } from '@/utils/groupEntities';

// Google Search Console (Phase 1) — real organic search performance for
// the entities with a verified Search Console property (Brentwood, Radio
// Links, Capcom, IDARO). Capcom and Irish Radio have no Search Console
// property or are otherwise deliberately absent and stay honestly "Not
// connected" — never a fabricated 0, never silently dropped from a group
// total without saying so. This is website traffic data only — it never
// implies a Search Console click caused a GA4 Enquiry; combine the two
// only via the explicitly-separate KPI cards on the Website page.

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Search Console genuinely only retains around 16 months of history
// (unlike GA4's much longer retention), so unlike GA4_EARLIEST_SUPPORTED_DATE
// this sentinel isn't a claim about when data starts — "All time" here
// just means "everything Search Console returns for this property," and
// the API itself returns real (possibly zero) rows for any date outside
// its retention window, never a fabricated figure.
const ALL_TIME_SENTINEL = '2000-01-01';

export function resolveSearchConsoleDateRange(period: Period, now: Date = new Date()): { startDate: string; endDate: string } {
  const start = periodStartDate(period, now);
  return {
    startDate: start ? toIsoDate(start) : ALL_TIME_SENTINEL,
    endDate: toIsoDate(now),
  };
}

interface RelevantSearchConsoleBrands {
  status: 'available' | 'not-connected';
  brands: BrandSearchConsolePerformance[];
  subtitle: string;
}

// Shared entity/period-scoped brand selection every function below reads
// from, so headline KPIs, top queries, top pages, and the query+page
// table can never disagree about which properties are "in scope."
function getRelevantSearchConsoleBrands(
  data: SearchConsoleResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): RelevantSearchConsoleBrands {
  if (!data || !data.configured) {
    return { status: 'not-connected', brands: [], subtitle: 'Awaiting Search Console integration' };
  }

  if (!isGroupView) {
    const entry = data.brands.find((b) => b.brand === selectedEntity);
    if (entry) {
      return { status: 'available', brands: [entry], subtitle: 'Real Search Console data for this entity' };
    }
    const hasProperty = data.configuredBrands.includes(selectedEntity as Brand);
    return {
      status: 'not-connected',
      brands: [],
      subtitle: hasProperty ? 'Search Console fetch failed for this entity' : 'No Search Console property connected for this entity',
    };
  }

  // MTech Group aggregates only the brands the group total already
  // includes elsewhere (GA4/Google Ads) — IDARO is deliberately excluded
  // from every V2 group-level total (see groupEntities.ts), including
  // this one, even though it has its own real Search Console property.
  const relevant = data.brands.filter((b) => GROUP_AGGREGATE_BRANDS.includes(b.brand));
  if (relevant.length === 0) {
    return { status: 'not-connected', brands: [], subtitle: 'No entities have a connected Search Console property yet' };
  }
  const configuredCount = relevant.length;
  const totalCount = GROUP_AGGREGATE_BRANDS.length;
  const subtitle =
    configuredCount < totalCount
      ? `Combined Search Console clicks across ${configuredCount} of ${totalCount} entities`
      : `Combined Search Console clicks across ${totalCount} entities`;
  return { status: 'available', brands: relevant, subtitle };
}

export interface SearchConsoleSummary {
  status: 'available' | 'not-connected';
  clicks?: number;
  impressions?: number;
  ctr?: number | null;
  position?: number | null;
  subtitle: string;
}

// Single shared source of truth for "what does Search Console performance
// mean for the current entity selection" — used identically by the
// Website page's headline KPIs. When combining more than one property's
// totals, CTR and average position are recomputed here from raw
// clicks/impressions/position rather than naively averaged, since Google
// only weights those correctly within a single property's own totals row.
export function getSearchConsoleSummary(
  data: SearchConsoleResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection
): SearchConsoleSummary {
  const relevant = getRelevantSearchConsoleBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') {
    return { status: 'not-connected', subtitle: relevant.subtitle };
  }

  const clicks = relevant.brands.reduce((sum, b) => sum + b.totals.clicks, 0);
  const impressions = relevant.brands.reduce((sum, b) => sum + b.totals.impressions, 0);
  // Impression-weighted average position across properties — a property
  // with more impressions has a proportionally larger say in the
  // combined average, never a flat mean of each property's own average.
  const positionWeightedSum = relevant.brands.reduce(
    (sum, b) => sum + (b.totals.position ?? 0) * b.totals.impressions,
    0
  );

  return {
    status: 'available',
    clicks,
    impressions,
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    position: impressions > 0 ? Math.round((positionWeightedSum / impressions) * 100) / 100 : null,
    subtitle: relevant.subtitle,
  };
}

function mergeByKey<T extends { clicks: number; impressions: number; ctr: number | null; position: number | null }>(
  rows: T[],
  keyFn: (row: T) => string,
  buildFn: (key: string, clicks: number, impressions: number, ctr: number | null, position: number | null) => T
): T[] {
  const totals = new Map<string, { clicks: number; impressions: number; positionWeightedSum: number }>();
  for (const row of rows) {
    const key = keyFn(row);
    const existing = totals.get(key) ?? { clicks: 0, impressions: 0, positionWeightedSum: 0 };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.positionWeightedSum += (row.position ?? 0) * row.impressions;
    totals.set(key, existing);
  }
  return Array.from(totals.entries())
    .map(([key, t]) =>
      buildFn(
        key,
        t.clicks,
        t.impressions,
        t.impressions > 0 ? Math.round((t.clicks / t.impressions) * 10000) / 100 : null,
        t.impressions > 0 ? Math.round((t.positionWeightedSum / t.impressions) * 100) / 100 : null
      )
    )
    .sort((a, b) => b.clicks - a.clicks);
}

export interface SearchConsoleQueriesInfo {
  status: 'available' | 'not-connected';
  rows: SearchConsoleQueryRow[];
  subtitle: string;
}

export function getSearchConsoleTopQueries(
  data: SearchConsoleResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 25
): SearchConsoleQueriesInfo {
  const relevant = getRelevantSearchConsoleBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', rows: [], subtitle: relevant.subtitle };

  const allRows = relevant.brands.flatMap((b) => b.topQueries);
  const merged = mergeByKey(
    allRows,
    (r) => r.query,
    (query, clicks, impressions, ctr, position) => ({ query, clicks, impressions, ctr, position })
  ).slice(0, limit);
  return { status: 'available', rows: merged, subtitle: relevant.subtitle };
}

export interface SearchConsolePagesInfo {
  status: 'available' | 'not-connected';
  rows: SearchConsolePageRow[];
  subtitle: string;
}

export function getSearchConsoleTopPages(
  data: SearchConsoleResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 25
): SearchConsolePagesInfo {
  const relevant = getRelevantSearchConsoleBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', rows: [], subtitle: relevant.subtitle };

  const allRows = relevant.brands.flatMap((b) => b.topPages);
  const merged = mergeByKey(
    allRows,
    (r) => r.page,
    (page, clicks, impressions, ctr, position) => ({ page, clicks, impressions, ctr, position })
  ).slice(0, limit);
  return { status: 'available', rows: merged, subtitle: relevant.subtitle };
}

export interface SearchConsoleQueryPageInfo {
  status: 'available' | 'not-connected';
  rows: SearchConsoleQueryPageRow[];
  subtitle: string;
}

export function getSearchConsoleTopQueryPageCombinations(
  data: SearchConsoleResponse | null,
  isGroupView: boolean,
  selectedEntity: EntitySelection,
  limit = 20
): SearchConsoleQueryPageInfo {
  const relevant = getRelevantSearchConsoleBrands(data, isGroupView, selectedEntity);
  if (relevant.status === 'not-connected') return { status: 'not-connected', rows: [], subtitle: relevant.subtitle };

  const allRows = relevant.brands.flatMap((b) => b.topQueryPageCombinations);
  const totals = new Map<string, { query: string; page: string; clicks: number; impressions: number; positionWeightedSum: number }>();
  for (const row of allRows) {
    const key = `${row.query} ${row.page}`;
    const existing = totals.get(key) ?? { query: row.query, page: row.page, clicks: 0, impressions: 0, positionWeightedSum: 0 };
    existing.clicks += row.clicks;
    existing.impressions += row.impressions;
    existing.positionWeightedSum += (row.position ?? 0) * row.impressions;
    totals.set(key, existing);
  }
  const merged = Array.from(totals.values())
    .map((t) => ({
      query: t.query,
      page: t.page,
      clicks: t.clicks,
      impressions: t.impressions,
      ctr: t.impressions > 0 ? Math.round((t.clicks / t.impressions) * 10000) / 100 : null,
      position: t.impressions > 0 ? Math.round((t.positionWeightedSum / t.impressions) * 100) / 100 : null,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit);

  return { status: 'available', rows: merged, subtitle: relevant.subtitle };
}

export interface SearchConsoleCoverageEntry {
  brand: Brand;
  label: string;
  connected: boolean;
}

const COVERAGE_BRANDS: { brand: Brand; label: string }[] = [
  { brand: 'brentwood', label: 'Brentwood' },
  { brand: 'radio-links', label: 'Radio Links' },
  { brand: 'capcom', label: 'Capcom' },
  { brand: 'idaro', label: 'IDARO' },
  { brand: 'ircl', label: 'Irish Radio' },
];

// Explicit per-entity coverage disclosure — mtech has no Search Console
// property and is out of scope entirely (same as GA4 Enquiries/Google
// Ads), so it's not listed here at all. Irish Radio is listed and always
// shows "Not connected" until a real property is added — never silently
// omitted.
export function getSearchConsoleCoverage(data: SearchConsoleResponse | null): SearchConsoleCoverageEntry[] {
  const configured = new Set(data?.configuredBrands ?? []);
  return COVERAGE_BRANDS.map(({ brand, label }) => ({ brand, label, connected: configured.has(brand) }));
}
