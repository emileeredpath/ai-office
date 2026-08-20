// Google Analytics 4 integration — a simplified per-brand website traffic
// view for the Dashboard. Each brand entity (Brentwood, Radio Links, Capcom,
// IRCL) has its own GA4 property; this fetches live "sessions" and
// "activeUsers" totals for this week and this month per property, on
// request — no local storage, no scheduled sync. GA4 numbers are cheap and
// fast to query live, unlike Campaign Monitor's per-send data, so there's
// no need to persist a copy of them.
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
  sessionsWeek: number;
  usersWeek: number;
  sessionsMonth: number;
  usersMonth: number;
}

export interface Ga4Result {
  configured: boolean;
  brands: BrandTraffic[];
  errors: string[];
}

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

export async function getBrandTraffic(): Promise<Ga4Result> {
  const errors: string[] = [];
  const configuredBrands = (Object.keys(PROPERTY_ID_ENV) as Brand[]).filter(
    (brand) => !!process.env[PROPERTY_ID_ENV[brand] as string]
  );

  if (!process.env.GA4_SERVICE_ACCOUNT_JSON || configuredBrands.length === 0) {
    return { configured: false, brands: [], errors: ['GA4 is not configured — set GA4_SERVICE_ACCOUNT_JSON and at least one GA4_PROPERTY_ID_* variable.'] };
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[ga4] failed to get access token:', msg);
    return { configured: true, brands: [], errors: [msg] };
  }

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const brands: BrandTraffic[] = [];
  for (const brand of configuredBrands) {
    const propertyId = process.env[PROPERTY_ID_ENV[brand] as string] as string;
    try {
      const [week, month] = await Promise.all([
        runReport(propertyId, token, isoDate(weekAgo), isoDate(today)),
        runReport(propertyId, token, isoDate(monthStart), isoDate(today)),
      ]);
      brands.push({
        brand,
        sessionsWeek: week.sessions,
        usersWeek: week.users,
        sessionsMonth: month.sessions,
        usersMonth: month.users,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ga4] failed to fetch traffic for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, brands, errors };
}
