// Google Search Console integration — real organic search performance
// (clicks, impressions, CTR, average position, top queries, top landing
// pages) for the entities with a verified Search Console property. Reuses
// the same GA4_SERVICE_ACCOUNT_JSON service account as ga4.ts (same
// Google Cloud project, Search Console API enabled there, the service
// account added as a Restricted user on each property) — this is a
// second, independently-cached OAuth token scoped only to
// webmasters.readonly, never reusing or widening the GA4 Data API token.
//
// Search Console has no property-ID concept like GA4 — it's keyed by a
// verified site URL, either "sc-domain:example.com" (Domain property) or
// "https://example.com/" (URL-prefix property). Only brands with a real
// SEARCH_CONSOLE_SITE_URL_* value are ever queried; mtech and ircl have no
// Search Console property configured and are never guessed or defaulted.
//
// IMPORTANT — this file's JWT signing and searchAnalytics.query request
// shapes follow Google's documented service-account flow (the same
// pattern already confirmed live for GA4 in ga4.ts), but the actual
// Search Console properties/permissions have not been exercised from
// this sandbox (no network route to Google's APIs here) — verify against
// the real deployment once SEARCH_CONSOLE_SITE_URL_* variables are live.
import { createSign } from 'crypto';
import type { Brand } from '../types.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEARCH_CONSOLE_API_BASE = 'https://www.googleapis.com/webmasters/v3';
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// Which env var holds each brand's verified Search Console site URL. Only
// entities with a real, confirmed property are listed — mtech and ircl
// are deliberately absent, not set to an empty/placeholder value, so they
// can never accidentally start returning data without an explicit env
// var being added first.
const SITE_URL_ENV: Partial<Record<Brand, string>> = {
  brentwood: 'SEARCH_CONSOLE_SITE_URL_BRENTWOOD',
  'radio-links': 'SEARCH_CONSOLE_SITE_URL_RADIO_LINKS',
  capcom: 'SEARCH_CONSOLE_SITE_URL_CAPCOM',
  idaro: 'SEARCH_CONSOLE_SITE_URL_IDARO',
};

export const SEARCH_CONSOLE_CONFIGURABLE_BRANDS: Brand[] = Object.keys(SITE_URL_ENV) as Brand[];

function base64url(input: Buffer | string): string {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultMonthToDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: isoDate(monthStart), endDate: isoDate(today) };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Independently cached from ga4.ts's getAccessToken — a different scope
// requires a different signed JWT/token, even though both read the same
// underlying service account credentials.
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GA4_SERVICE_ACCOUNT_JSON is not set');

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(raw);
  } catch {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON is not valid JSON');
  }
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('GA4_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: credentials.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign('RSA-SHA256').update(signingInput).sign(credentials.private_key);
  const jwt = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google token exchange failed for Search Console (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

interface RawSearchAnalyticsRow {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function runSearchAnalyticsQuery(
  siteUrl: string,
  token: string,
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit: number
): Promise<RawSearchAnalyticsRow[]> {
  const res = await fetch(`${SEARCH_CONSOLE_API_BASE}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Search Console's error responses are JSON describing exactly what's
    // wrong (unverified property, no access granted to the service
    // account, invalid site URL format) — surfaced verbatim (truncated)
    // rather than replaced with a generic message.
    throw new Error(`Search Console API error for site ${siteUrl} (${res.status}): ${body.slice(0, 500)}`);
  }
  const json = (await res.json()) as { rows?: RawSearchAnalyticsRow[] };
  return json.rows || [];
}

export interface SearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsolePageRow {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface SearchConsoleQueryPageRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export interface BrandSearchConsolePerformance {
  brand: Brand;
  totals: SearchConsoleTotals;
  topQueries: SearchConsoleQueryRow[];
  topPages: SearchConsolePageRow[];
  topQueryPageCombinations: SearchConsoleQueryPageRow[];
}

export interface SearchConsoleResult {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandSearchConsolePerformance[];
  // Brands with a site URL configured, regardless of whether that brand's
  // query succeeded this call — same configured/not-connected distinction
  // as ga4.ts's configuredBrands and googleAds.ts's configuredBrands.
  configuredBrands: Brand[];
  errors: string[];
}

const TOP_ROW_LIMIT = 25;

function toTotals(rows: RawSearchAnalyticsRow[]): SearchConsoleTotals {
  // A totals query (no dimensions) returns at most one row, already
  // correctly weighted by Google for this property/date range — never
  // recomputed here.
  const row = rows[0];
  if (!row) return { clicks: 0, impressions: 0, ctr: null, position: null };
  return {
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: Math.round(row.ctr * 10000) / 100,
    position: Math.round(row.position * 100) / 100,
  };
}

async function fetchBrandPerformance(
  brand: Brand,
  siteUrl: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<BrandSearchConsolePerformance> {
  const [totalsRows, queryRows, pageRows, queryPageRows] = await Promise.all([
    runSearchAnalyticsQuery(siteUrl, token, startDate, endDate, [], 1),
    runSearchAnalyticsQuery(siteUrl, token, startDate, endDate, ['query'], TOP_ROW_LIMIT),
    runSearchAnalyticsQuery(siteUrl, token, startDate, endDate, ['page'], TOP_ROW_LIMIT),
    runSearchAnalyticsQuery(siteUrl, token, startDate, endDate, ['query', 'page'], TOP_ROW_LIMIT),
  ]);

  return {
    brand,
    totals: toTotals(totalsRows),
    topQueries: queryRows
      .map((r) => ({
        query: r.keys?.[0] ?? '(unknown)',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 10000) / 100,
        position: Math.round(r.position * 100) / 100,
      }))
      .sort((a, b) => b.clicks - a.clicks),
    topPages: pageRows
      .map((r) => ({
        page: r.keys?.[0] ?? '(unknown)',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 10000) / 100,
        position: Math.round(r.position * 100) / 100,
      }))
      .sort((a, b) => b.clicks - a.clicks),
    topQueryPageCombinations: queryPageRows
      .map((r) => ({
        query: r.keys?.[0] ?? '(unknown)',
        page: r.keys?.[1] ?? '(unknown)',
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 10000) / 100,
        position: Math.round(r.position * 100) / 100,
      }))
      .sort((a, b) => b.clicks - a.clicks),
  };
}

// Same per-brand loop and configured/not-connected honesty rules as
// getBrandTraffic()/getEnquiries() in ga4.ts and getGoogleAdsPerformance()
// in googleAds.ts — only entities with a configured site URL are queried;
// a brand with genuinely zero organic clicks this period is
// distinguishable from a brand with no Search Console property at all via
// configuredBrands.
export async function getSearchConsolePerformance(startDate?: string, endDate?: string): Promise<SearchConsoleResult> {
  const errors: string[] = [];
  const configuredBrands = SEARCH_CONSOLE_CONFIGURABLE_BRANDS.filter((brand) => !!process.env[SITE_URL_ENV[brand] as string]);
  const range = startDate && endDate ? { startDate, endDate } : defaultMonthToDateRange();

  if (!process.env.GA4_SERVICE_ACCOUNT_JSON || configuredBrands.length === 0) {
    const reason = !process.env.GA4_SERVICE_ACCOUNT_JSON
      ? 'Search Console is not configured — missing GA4_SERVICE_ACCOUNT_JSON.'
      : 'Search Console is not configured — set at least one SEARCH_CONSOLE_SITE_URL_* variable.';
    return { configured: false, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands: [], errors: [reason] };
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[searchConsole] failed to get access token:', msg);
    return { configured: true, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands, errors: [msg] };
  }

  const brands: BrandSearchConsolePerformance[] = [];
  for (const brand of configuredBrands) {
    const siteUrl = process.env[SITE_URL_ENV[brand] as string] as string;
    try {
      const result = await fetchBrandPerformance(brand, siteUrl, token, range.startDate, range.endDate);
      brands.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[searchConsole] failed to fetch performance for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, startDate: range.startDate, endDate: range.endDate, brands, configuredBrands, errors };
}
