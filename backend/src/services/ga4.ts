// Google Analytics 4 integration — a simplified per-brand website traffic
// view for V2 (Overview, Performance, Reports). Each brand entity
// (Brentwood, Radio Links, Capcom, IRCL) has its own GA4 property; this
// fetches live "sessions" and "activeUsers" totals for a caller-supplied
// date range per property, on request — no local storage, no scheduled
// sync. GA4 numbers are cheap and fast to query live, unlike Campaign
// Monitor's per-send data, so there's no need to persist a copy of them
// (see wave_1_performance_metrics for the one GA4 path that IS persisted —
// the separate, campaign-scoped Wave 1 integration below, untouched here).
//
// IMPORTANT — untested against a real account from this environment: no
// GA4_SERVICE_ACCOUNT_JSON or GA4_PROPERTY_ID_* vars exist here, and this
// sandbox can't reach Google's APIs anyway. The JWT signing and Analytics
// Data API request shapes follow Google's documented service-account flow,
// but verify against a real property once configured.
import { createSign } from 'crypto';
import type { Brand } from '../types.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';

// Which env var holds each brand's GA4 property ID. Only entities that
// actually have their own site/property are listed.
const PROPERTY_ID_ENV: Partial<Record<Brand, string>> = {
  mtech: 'GA4_PROPERTY_ID_MTECH',
  brentwood: 'GA4_PROPERTY_ID_BRENTWOOD',
  'radio-links': 'GA4_PROPERTY_ID_RADIO_LINKS',
  capcom: 'GA4_PROPERTY_ID_CAPCOM',
  ircl: 'GA4_PROPERTY_ID_IRCL',
  idaro: 'GA4_PROPERTY_ID_IDARO',
};

export interface BrandTraffic {
  brand: Brand;
  // "Website Users" everywhere in V2 means GA4 activeUsers specifically —
  // never sessions. sessions is kept as a separate, honestly-labelled
  // figure for later use, not folded into or confused with activeUsers.
  activeUsers: number;
  sessions: number;
}

export interface Ga4Result {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandTraffic[];
  // Every brand with a property ID configured, regardless of whether that
  // brand's query succeeded this call — lets a caller distinguish "this
  // brand has no GA4 property" (absent from configuredBrands) from "this
  // brand's property is configured but this particular fetch failed"
  // (present in configuredBrands, absent from brands, with an error).
  configuredBrands: Brand[];
  errors: string[];
}

// GA4's own earliest supported date for the Analytics Data API — used as
// the honest "all time" floor when a caller doesn't supply a date range,
// rather than an unbounded or fabricated period. This isn't a guess at
// when any given property started collecting data — GA4 simply returns
// real (possibly zero) figures for any date before a property existed —
// it's the API's own documented lower bound, so it can never overstate
// what's genuinely available.
export const GA4_EARLIEST_SUPPORTED_DATE = '2015-08-14';

function base64url(input: Buffer | string): string {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

let cachedToken: { token: string; expiresAt: number } | null = null;

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
    throw new Error(`Google token exchange failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function runReport(
  propertyId: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<{ sessions: number; users: number }> {
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: { metricValues: { value: string }[] }[] };
  const row = json.rows?.[0];
  return {
    sessions: row ? Number(row.metricValues[0]?.value ?? 0) : 0,
    users: row ? Number(row.metricValues[1]?.value ?? 0) : 0,
  };
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Social Traffic (Phase 1) — website sessions/users GA4 attributes to
// social, using GA4's own standard channel classification. This is a
// second, separate query per property from runReport() above — it never
// touches or reinterprets the existing Website Users/Sessions figures,
// so that path is provably unaffected by this addition.
//
// sessionDefaultChannelGroup is GA4's own rules-based classification —
// "Organic Social" and "Paid Social" are real, standard values it
// assigns, not something this app invents or guesses. Its accuracy for
// a given site still depends on that site's own UTM/referrer tagging
// being correct (e.g. a paid social ad needs utm_medium=cpc/paid or GA4
// won't classify it as Paid Social) — a real caveat, not a reason to
// avoid using GA4's own classification.
//
// sessionSource is used for the "by network" breakdown. GA4 does not
// provide a canonical "LinkedIn"/"Facebook"/"Instagram" dimension — only
// the raw referring domain (e.g. "l.facebook.com", "linkedin.com",
// "l.instagram.com"). Those raw values are surfaced as-is, never
// relabelled or bucketed into a platform name GA4 itself doesn't
// provide — the same "never invent a classification" rule already
// applied to Infinity's chType handling.
const SOCIAL_CHANNEL_GROUPS = new Set(['Organic Social', 'Paid Social']);

export interface SocialNetworkRow {
  source: string;
  sessions: number;
  users: number;
}

export interface SocialLandingPageRow {
  landingPage: string;
  sessions: number;
}

export interface BrandSocialTraffic {
  brand: Brand;
  sessions: number;
  users: number;
  organicSessions: number;
  organicUsers: number;
  paidSessions: number;
  paidUsers: number;
  byNetwork: SocialNetworkRow[];
  topLandingPages: SocialLandingPageRow[];
}

export interface Ga4SocialResult {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandSocialTraffic[];
  configuredBrands: Brand[];
  errors: string[];
}

interface SocialReportRow {
  channelGroup: string;
  source: string;
  landingPage: string;
  sessions: number;
  users: number;
}

async function runSocialReport(propertyId: string, token: string, startDate: string, endDate: string): Promise<SocialReportRow[]> {
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionDefaultChannelGroup' },
        { name: 'sessionSource' },
        { name: 'landingPage' },
      ],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      limit: 100000,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 social runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    rows?: Array<{ dimensionValues: { value: string }[]; metricValues: { value: string }[] }>;
  };
  const rows = json.rows || [];
  return rows.map((row) => ({
    channelGroup: row.dimensionValues[0]?.value ?? '',
    source: row.dimensionValues[1]?.value ?? '',
    landingPage: row.dimensionValues[2]?.value ?? '',
    sessions: Number(row.metricValues[0]?.value ?? 0),
    users: Number(row.metricValues[1]?.value ?? 0),
  }));
}

function summarizeSocialRows(rows: SocialReportRow[]): Omit<BrandSocialTraffic, 'brand'> {
  const socialRows = rows.filter((r) => SOCIAL_CHANNEL_GROUPS.has(r.channelGroup));

  let sessions = 0;
  let users = 0;
  let organicSessions = 0;
  let organicUsers = 0;
  let paidSessions = 0;
  let paidUsers = 0;
  const networkTotals = new Map<string, { sessions: number; users: number }>();
  const landingPageTotals = new Map<string, number>();

  for (const row of socialRows) {
    sessions += row.sessions;
    users += row.users;
    if (row.channelGroup === 'Organic Social') {
      organicSessions += row.sessions;
      organicUsers += row.users;
    } else {
      paidSessions += row.sessions;
      paidUsers += row.users;
    }

    const net = networkTotals.get(row.source) ?? { sessions: 0, users: 0 };
    net.sessions += row.sessions;
    net.users += row.users;
    networkTotals.set(row.source, net);

    if (row.landingPage) {
      landingPageTotals.set(row.landingPage, (landingPageTotals.get(row.landingPage) ?? 0) + row.sessions);
    }
  }

  const byNetwork: SocialNetworkRow[] = Array.from(networkTotals.entries())
    .map(([source, v]) => ({ source, sessions: v.sessions, users: v.users }))
    .sort((a, b) => b.sessions - a.sessions);

  const topLandingPages: SocialLandingPageRow[] = Array.from(landingPageTotals.entries())
    .map(([landingPage, s]) => ({ landingPage, sessions: s }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  return { sessions, users, organicSessions, organicUsers, paidSessions, paidUsers, byNetwork, topLandingPages };
}

// Same per-property loop and honesty rules as getBrandTraffic() — only
// entities with a configured GA4 property are queried; a brand with a
// genuinely zero social sessions this period is distinguishable from a
// brand with no GA4 property at all via configuredBrands, exactly as
// getBrandTraffic() already does for Website Users/Sessions.
export async function getSocialTraffic(startDate?: string, endDate?: string): Promise<Ga4SocialResult> {
  const errors: string[] = [];
  const configuredBrands = (Object.keys(PROPERTY_ID_ENV) as Brand[]).filter(
    (brand) => !!process.env[PROPERTY_ID_ENV[brand] as string]
  );
  const range = startDate && endDate ? { startDate, endDate } : defaultMonthToDateRange();

  if (!process.env.GA4_SERVICE_ACCOUNT_JSON || configuredBrands.length === 0) {
    return {
      configured: false,
      startDate: range.startDate,
      endDate: range.endDate,
      brands: [],
      configuredBrands: [],
      errors: ['GA4 is not configured — set GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* variable.'],
    };
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ga4] failed to get access token:', msg);
    return { configured: true, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands, errors: [msg] };
  }

  const brands: BrandSocialTraffic[] = [];
  for (const brand of configuredBrands) {
    const propertyId = process.env[PROPERTY_ID_ENV[brand] as string] as string;
    try {
      const rows = await runSocialReport(propertyId, token, range.startDate, range.endDate);
      brands.push({ brand, ...summarizeSocialRows(rows) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ga4] failed to fetch social traffic for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, startDate: range.startDate, endDate: range.endDate, brands, configuredBrands, errors };
}

export interface Wave1PerformanceMetrics {
  clicks: number;
  pageViews: number;
  formSubmissions: number;
  conversionRate: number;
  byBrand: Record<
    string,
    {
      clicks: number;
      pageViews: number;
      formSubmissions: number;
      conversionRate: number;
    }
  >;
}

export interface Wave1Result {
  configured: boolean;
  metrics: Wave1PerformanceMetrics | null;
  errors: string[];
  lastSynced: string;
}

async function runWave1Report(
  propertyId: string,
  token: string,
  startDate: string,
  endDate: string
): Promise<{
  clicks: number;
  pageViews: number;
  formSubmissions: number;
  conversionRate: number;
  byBrand: Record<string, { clicks: number; pageViews: number; formSubmissions: number; conversionRate: number }>;
}> {
  // Query GA4 for Wave 1 campaign data, broken down by utm_content (brand-specific landing page)
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'customEvent:utm_content' },
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'pageViews' },
        { name: 'eventCount' },
        { name: 'conversions' },
      ],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'customEvent:utm_campaign',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'q3_education_wave1_repair',
                },
              },
            },
          ],
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `GA4 Wave 1 runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`
    );
  }

  const json = (await res.json()) as {
    rows?: Array<{
      dimensions: string[];
      metricValues: Array<{ value: string }>;
    }>;
  };

  const rows = json.rows || [];
  const byBrand: Record<string, { clicks: number; pageViews: number; formSubmissions: number; conversionRate: number }> = {};

  let totalClicks = 0;
  let totalPageViews = 0;
  let totalFormSubmissions = 0;
  let totalConversions = 0;

  rows.forEach((row) => {
    const utmContent = row.dimensions[0] || 'unknown';
    const sessions = Number(row.metricValues[0]?.value ?? 0);
    const pageViews = Number(row.metricValues[1]?.value ?? 0);
    const formSubmissions = Number(row.metricValues[2]?.value ?? 0);
    const conversions = Number(row.metricValues[3]?.value ?? 0);

    // Extract brand from utm_content (e.g., "brentwood_repair_page" → "brentwood")
    const brand = extractBrandFromUtmContent(utmContent);

    if (!byBrand[brand]) {
      byBrand[brand] = { clicks: 0, pageViews: 0, formSubmissions: 0, conversionRate: 0 };
    }

    byBrand[brand].clicks += sessions;
    byBrand[brand].pageViews += pageViews;
    byBrand[brand].formSubmissions += formSubmissions;

    totalClicks += sessions;
    totalPageViews += pageViews;
    totalFormSubmissions += formSubmissions;
    totalConversions += conversions;
  });

  // Calculate conversion rates
  const overallConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  Object.keys(byBrand).forEach((brand) => {
    byBrand[brand].conversionRate =
      byBrand[brand].clicks > 0 ? (byBrand[brand].formSubmissions / byBrand[brand].clicks) * 100 : 0;
  });

  return {
    clicks: totalClicks,
    pageViews: totalPageViews,
    formSubmissions: totalFormSubmissions,
    conversionRate: overallConversionRate,
    byBrand,
  };
}

function extractBrandFromUtmContent(utmContent: string): string {
  // Extract brand from utm_content like "brentwood_repair_page" → "brentwood"
  const match = utmContent.match(/^([^_]+)/);
  return match ? match[1] : 'unknown';
}

export async function getWave1Performance(): Promise<Wave1Result> {
  const errors: string[] = [];
  const configuredBrands = (Object.keys(PROPERTY_ID_ENV) as Brand[]).filter(
    (brand) => !!process.env[PROPERTY_ID_ENV[brand] as string]
  );

  if (!process.env.GA4_SERVICE_ACCOUNT_JSON || configuredBrands.length === 0) {
    return {
      configured: false,
      metrics: null,
      errors: ['GA4 is not configured — set GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* variable.'],
      lastSynced: new Date().toISOString(),
    };
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ga4] failed to get access token:', msg);
    return { configured: true, metrics: null, errors: [msg], lastSynced: new Date().toISOString() };
  }

  // Wave 1: Aug 12 - Aug 31, 2026
  const startDate = '2026-08-12';
  const endDate = '2026-08-31';

  // Use the first configured property (MTech) as the primary source for Wave 1 data
  const primaryBrand = configuredBrands[0];
  const propertyId = process.env[PROPERTY_ID_ENV[primaryBrand] as string] as string;

  try {
    const wave1Data = await runWave1Report(propertyId, token, startDate, endDate);
    return {
      configured: true,
      metrics: wave1Data,
      errors: [],
      lastSynced: new Date().toISOString(),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ga4] failed to fetch Wave 1 performance:', msg);
    return {
      configured: true,
      metrics: null,
      errors: [msg],
      lastSynced: new Date().toISOString(),
    };
  }
}

function defaultMonthToDateRange(): { startDate: string; endDate: string } {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: isoDate(monthStart), endDate: isoDate(today) };
}

// startDate/endDate are the resolved calendar-period boundaries the caller
// wants (e.g. from the frontend's global Period selector) — this function
// never approximates a period with a rolling day count. If omitted (e.g.
// the zero-arg MCP tool call), defaults to month-to-date, a reasonable
// single range to preserve for a caller that doesn't have a period concept.
export async function getBrandTraffic(startDate?: string, endDate?: string): Promise<Ga4Result> {
  const errors: string[] = [];
  const configuredBrands = (Object.keys(PROPERTY_ID_ENV) as Brand[]).filter(
    (brand) => !!process.env[PROPERTY_ID_ENV[brand] as string]
  );
  const range = startDate && endDate ? { startDate, endDate } : defaultMonthToDateRange();

  if (!process.env.GA4_SERVICE_ACCOUNT_JSON || configuredBrands.length === 0) {
    return {
      configured: false,
      startDate: range.startDate,
      endDate: range.endDate,
      brands: [],
      configuredBrands: [],
      errors: ['GA4 is not configured — set GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* variable.'],
    };
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ga4] failed to get access token:', msg);
    return { configured: true, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands, errors: [msg] };
  }

  const brands: BrandTraffic[] = [];
  for (const brand of configuredBrands) {
    const propertyId = process.env[PROPERTY_ID_ENV[brand] as string] as string;
    try {
      const result = await runReport(propertyId, token, range.startDate, range.endDate);
      brands.push({ brand, activeUsers: result.users, sessions: result.sessions });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ga4] failed to fetch traffic for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, startDate: range.startDate, endDate: range.endDate, brands, configuredBrands, errors };
}
