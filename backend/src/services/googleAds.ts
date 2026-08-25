// Google Ads integration — real campaign performance for the two accounts
// currently connected (Brentwood, Radio Links). Capcom and Irish Radio
// have no Google Ads account configured and are deliberately absent from
// CUSTOMER_ID_ENV below — never guessed, never defaulted to any other
// account's aggregate.
//
// Auth: standard OAuth2 refresh-token exchange (grant_type=refresh_token)
// plus a developer token — confirmed live against both real accounts (see
// conversation history — not re-derived here). Both Brentwood and Radio
// Links are queried DIRECTLY (their own customer ID, no login-customer-id
// header) — confirmed live that sending login-customer-id on these
// requests causes them to fail, since these are not sub-accounts of a
// manager Brentwood/Radio Links must be accessed through. Do not add the
// login-customer-id header back to runCampaignQuery without re-confirming
// against a real account first. GOOGLE_ADS_LOGIN_CUSTOMER_ID is still
// read from env and documented in .env.example for a future phase (e.g.
// a genuine manager-account-only entity), but is not sent by anything in
// this file today.
//
// API version: the URL path below is pinned to GOOGLE_ADS_API_VERSION —
// confirmed live as v25 (v19, this integration's original guess, was
// already retired and returned a 404). Google deprecates versions on a
// roughly quarterly cadence; if a live call ever returns an error naming
// a deprecated/unsupported version again, update this one constant —
// nothing else references the version number.
import type { Brand } from '../types.js';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_ADS_API_VERSION = 'v25';
const API_BASE = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;

// Which env var holds each brand's Google Ads customer ID. Only entities
// with a confirmed, currently-connected account are listed — Capcom and
// Irish Radio are deliberately absent, not set to an empty/placeholder
// value, so they can never accidentally start returning data without an
// explicit env var being added first.
const CUSTOMER_ID_ENV: Partial<Record<Brand, string>> = {
  brentwood: 'GOOGLE_ADS_CUSTOMER_ID_BRENTWOOD',
  'radio-links': 'GOOGLE_ADS_CUSTOMER_ID_RADIO_LINKS',
};

// Which brands have a confirmed Google Ads account right now — static, not
// derived from a given response, so a brand with a genuinely zero-spend
// period is distinguishable from a brand with no account at all (same
// pattern as MAPPED_BRANDS in infinity.ts / configuredBrands in ga4.ts).
export const GOOGLE_ADS_CONFIGURABLE_BRANDS: Brand[] = Object.keys(CUSTOMER_ID_ENV) as Brand[];

function digitsOnly(id: string): string {
  return id.replace(/[^0-9]/g, '');
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

// Standard OAuth2 refresh-token grant — distinct from GA4's service-account
// JWT flow. Requires GOOGLE_ADS_CLIENT_ID/CLIENT_SECRET (a Google Cloud
// OAuth client) and a previously-issued GOOGLE_ADS_REFRESH_TOKEN for
// whichever Google account has access to the MTech Group manager account.
async function getGoogleAdsAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Ads OAuth credentials are not fully set (client ID/secret/refresh token)');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Never log/include the request body (contains the client secret and
    // refresh token) — only the response, which is Google's own error.
    throw new Error(`Google Ads token refresh failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export interface CampaignPerformanceRow {
  campaignId: string;
  campaignName: string;
  // Real GAQL enum strings as returned (e.g. ENABLED, PAUSED, REMOVED) —
  // never relabelled.
  status: string;
  // Real GAQL enum string (e.g. SEARCH, DISPLAY, PERFORMANCE_MAX, VIDEO).
  advertisingChannelType: string;
  impressions: number;
  clicks: number;
  spend: number;
  // Google Ads' own conversions metric — a count that reflects whichever
  // conversion actions are configured inside this Ads account. This is
  // NOT the same population as GA4 Enquiries (src/utils/ga4Enquiries.ts)
  // and must never be presented as if it were — see getEnquiries's own
  // doc comment for the confirmed, separately-verified GA4 event names.
  conversions: number;
  costPerConversion: number | null;
}

export interface BrandGoogleAdsPerformance {
  brand: Brand;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number | null;
  averageCpc: number | null;
  conversions: number;
  costPerConversion: number | null;
  campaigns: CampaignPerformanceRow[];
}

export interface GoogleAdsResult {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandGoogleAdsPerformance[];
  // Brands with a customer ID configured, regardless of whether that
  // brand's query succeeded this call — same configured/not-connected
  // distinction as ga4.ts's configuredBrands.
  configuredBrands: Brand[];
  errors: string[];
}

interface RawCampaignRow {
  campaign: { id: string; name: string; status: string; advertisingChannelType: string };
  metrics: { impressions?: string; clicks?: string; costMicros?: string; conversions?: string };
}

// Campaign-level performance for one customer over the given date range.
// No status filter is applied — every campaign with real metrics in this
// range is returned with its genuine current status, never hidden or
// silently excluded because it's paused/removed.
//
// Deliberately no login-customer-id header — confirmed live that Brentwood
// and Radio Links are queried directly, and sending that header fails.
async function runCampaignQuery(
  customerId: string,
  token: string,
  developerToken: string,
  startDate: string,
  endDate: string
): Promise<RawCampaignRow[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    ORDER BY metrics.cost_micros DESC
  `.trim();

  const res = await fetch(`${API_BASE}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, pageSize: 1000 }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Google's error responses are JSON describing exactly what's wrong
    // (auth, developer token access level, invalid customer ID, etc.) —
    // surfaced verbatim (truncated) rather than replaced with a generic
    // message, so a real access-level problem is never mistaken for "no
    // data" or silently retried with a guessed fix.
    throw new Error(`Google Ads API error for customer ${customerId} (${res.status}): ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as { results?: RawCampaignRow[] };
  return json.results || [];

  // No pagination loop implemented yet — pageSize:1000 covers any
  // realistic MTech-scale account's campaign count for a single date
  // range. Add one if a response is ever observed with a nextPageToken.
}

function summarizeCampaignRows(rows: RawCampaignRow[]): Omit<BrandGoogleAdsPerformance, 'brand'> {
  let impressions = 0;
  let clicks = 0;
  let costMicros = 0;
  let conversions = 0;

  const campaigns: CampaignPerformanceRow[] = rows.map((row) => {
    const imp = Number(row.metrics.impressions ?? 0);
    const clk = Number(row.metrics.clicks ?? 0);
    const cost = Number(row.metrics.costMicros ?? 0);
    const conv = Number(row.metrics.conversions ?? 0);
    impressions += imp;
    clicks += clk;
    costMicros += cost;
    conversions += conv;

    const spend = cost / 1_000_000;
    return {
      campaignId: row.campaign.id,
      campaignName: row.campaign.name,
      status: row.campaign.status,
      advertisingChannelType: row.campaign.advertisingChannelType,
      impressions: imp,
      clicks: clk,
      spend,
      conversions: conv,
      costPerConversion: conv > 0 ? Math.round((spend / conv) * 100) / 100 : null,
    };
  });

  const spend = costMicros / 1_000_000;
  return {
    spend,
    impressions,
    clicks,
    // CTR/CPC computed from our own summed raw counts, not trusted from a
    // pre-aggregated API metric — same "derive from raw counts" rule
    // applied everywhere else in this app (e.g. callPerformance.ts).
    ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : null,
    averageCpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : null,
    conversions,
    costPerConversion: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : null,
    campaigns: campaigns.sort((a, b) => b.spend - a.spend),
  };
}

// Same per-brand loop and configured/not-connected honesty rules as
// getBrandTraffic()/getEnquiries() in ga4.ts — only entities with a
// configured customer ID are queried; a brand with genuinely zero spend
// this period is distinguishable from a brand with no account at all via
// configuredBrands.
export async function getGoogleAdsPerformance(startDate?: string, endDate?: string): Promise<GoogleAdsResult> {
  const errors: string[] = [];
  const configuredBrands = GOOGLE_ADS_CONFIGURABLE_BRANDS.filter(
    (brand) => !!process.env[CUSTOMER_ID_ENV[brand] as string]
  );
  const range = startDate && endDate ? { startDate, endDate } : defaultMonthToDateRange();

  // GOOGLE_ADS_LOGIN_CUSTOMER_ID is intentionally not required here — it's
  // read/documented for a future manager-account phase but isn't sent by
  // runCampaignQuery today (see this file's header comment).
  const requiredEnvVars = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN'];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0 || configuredBrands.length === 0) {
    const reason =
      missingEnvVars.length > 0
        ? `Google Ads is not configured — missing ${missingEnvVars.join(', ')}.`
        : 'Google Ads is not configured — set at least one GOOGLE_ADS_CUSTOMER_ID_* variable.';
    return { configured: false, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands: [], errors: [reason] };
  }

  let token: string;
  try {
    token = await getGoogleAdsAccessToken();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[googleAds] failed to get access token:', msg);
    return { configured: true, startDate: range.startDate, endDate: range.endDate, brands: [], configuredBrands, errors: [msg] };
  }

  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN as string;

  const brands: BrandGoogleAdsPerformance[] = [];
  for (const brand of configuredBrands) {
    const customerId = digitsOnly(process.env[CUSTOMER_ID_ENV[brand] as string] as string);
    try {
      const rows = await runCampaignQuery(customerId, token, developerToken, range.startDate, range.endDate);
      brands.push({ brand, ...summarizeCampaignRows(rows) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[googleAds] failed to fetch performance for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, startDate: range.startDate, endDate: range.endDate, brands, configuredBrands, errors };
}
