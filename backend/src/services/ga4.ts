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
// IMPORTANT — the Website Traffic/Social Traffic paths below are untested
// against a real account from this environment: no GA4_SERVICE_ACCOUNT_JSON
// or GA4_PROPERTY_ID_* vars exist here, and this sandbox can't reach
// Google's APIs anyway. The JWT signing and Analytics Data API request
// shapes follow Google's documented service-account flow. GA4 Enquiries
// (see getEnquiries below) IS confirmed against the real account — every
// event name it queries was verified live via the Key Events screen and a
// 28-day diagnostic query run by the user against production, not derived
// or assumed in this sandbox.
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

// ---------------------------------------------------------------------
// GA4 Enquiries (Phase 1) — real, verified key events only.
//
// Every event name below was confirmed live, per property, against the
// real GA4 account (see conversation history — not re-derived here): the
// Key Events screen for each property, then a 28-day live diagnostic
// query confirming actual counts and — critically for Brentwood — that
// `generate_lead` is a rollup event that fires alongside the specific
// ones, never an independent action. Proof: on every sampled date,
// generate_lead's count equalled the exact sum of generate_lead_form +
// generate_lead_phone + generate_lead_email + generate_lead_livechat
// (e.g. 2026-08-05: 7 = 6 phone + 1 form). `generate_lead` is therefore
// kept ONLY as a rollupTotal cross-check field and is never summed
// alongside the specific four — doing so would double-count every real
// enquiry.
//
// No brand not listed here (mtech, idaro) has a confirmed enquiry
// definition — they are excluded entirely from this query, regardless
// of whether their GA4 property is configured, rather than guessing
// which of their key events (if any) represent a genuine enquiry.
// Do not add a brand/event here without a live diagnostic confirming it.
interface BrandEnquiryDefinition {
  form?: string[];
  phone?: string[];
  email?: string[];
  livechat?: string[];
  // Rollup/cross-check event only — never included in any summed total.
  rollup?: string;
}

const ENQUIRY_EVENTS_BY_BRAND: Partial<Record<Brand, BrandEnquiryDefinition>> = {
  brentwood: {
    form: ['generate_lead_form'],
    phone: ['generate_lead_phone'],
    email: ['generate_lead_email'],
    livechat: ['generate_lead_livechat'],
    rollup: 'generate_lead',
  },
  ircl: {
    // IRCL's real event names — confirmed distinct from Brentwood's.
    // No live-chat key event exists for IRCL. generate_lead_idaro,
    // generate_lead_table_tap, and ads_conversion_Form_1 are confirmed
    // real IRCL key events but were never verified as genuine enquiry
    // signals (idaro's event returned zero rows and IDARO has no
    // property of its own) — deliberately excluded.
    form: ['generate_lead_contact'],
    phone: ['generate_lead_phone'],
    email: ['generate_lead_email'],
  },
  'radio-links': {
    // Confirmed real event names for Radio Links — no email or
    // live-chat key event exists for this property.
    // enquiry__google_ads is a real, confirmed-excluded event: it had
    // no activity in the live diagnostic and must stay separate unless
    // a future check confirms it doesn't duplicate these two.
    form: ['Contact us page form'],
    phone: ['Telephone link click'],
  },
  capcom: {
    // Confirmed real event names for Capcom. No live-chat key event.
    form: ['ua_form_submit'],
    phone: ['click_call'],
    email: ['click_email'],
  },
};

export type EnquiryType = 'form' | 'phone' | 'email' | 'livechat';

export interface EnquiryTypeSourceRow {
  type: EnquiryType;
  channelGroup: string;
  source: string;
  count: number;
}

export interface BrandEnquiries {
  brand: Brand;
  // Sum of form + phone + email + livechat (whichever are tracked for
  // this brand) — never includes rollupTotal.
  total: number;
  form: number | null;
  phone: number | null;
  email: number | null;
  livechat: number | null;
  // generate_lead-style cross-check only, null if this brand has no
  // confirmed rollup event. Never added into `total`.
  rollupTotal: number | null;
  // One row per (type, channelGroup, source) with a nonzero real count —
  // the shared basis every frontend channel/source breakdown aggregates
  // from, so they can never disagree with each other or with `total`.
  rows: EnquiryTypeSourceRow[];
}

export interface Ga4EnquiriesResult {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandEnquiries[];
  // Brands with BOTH a confirmed enquiry definition AND a configured GA4
  // property — deliberately a stricter set than Ga4Result/Ga4SocialResult's
  // configuredBrands, since a brand with a configured property but no
  // verified enquiry definition must never appear here at all (that would
  // imply a guessed definition).
  configuredBrands: Brand[];
  errors: string[];
}

interface EnquiryReportRow {
  eventName: string;
  channelGroup: string;
  source: string;
  count: number;
}

async function runEnquiryReport(
  propertyId: string,
  token: string,
  startDate: string,
  endDate: string,
  eventNames: string[]
): Promise<EnquiryReportRow[]> {
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }, { name: 'sessionDefaultChannelGroup' }, { name: 'sessionSource' }],
      // eventCount, not conversions — the live 28-day diagnostic that
      // proved generate_lead's rollup relationship was itself run on
      // eventCount, so this stays consistent with the exact evidence
      // that definition was verified against.
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: eventNames } } },
      limit: 100000,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 enquiries runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    rows?: Array<{ dimensionValues: { value: string }[]; metricValues: { value: string }[] }>;
  };
  const rows = json.rows || [];
  return rows.map((row) => ({
    eventName: row.dimensionValues[0]?.value ?? '',
    channelGroup: row.dimensionValues[1]?.value ?? '',
    source: row.dimensionValues[2]?.value ?? '',
    count: Number(row.metricValues[0]?.value ?? 0),
  }));
}

function summarizeEnquiryRows(def: BrandEnquiryDefinition, rows: EnquiryReportRow[]): Omit<BrandEnquiries, 'brand'> {
  // Reverse-lookup: real event name -> its confirmed type for this brand.
  const eventToType = new Map<string, EnquiryType>();
  (['form', 'phone', 'email', 'livechat'] as EnquiryType[]).forEach((type) => {
    (def[type] ?? []).forEach((name) => eventToType.set(name, type));
  });

  const totals: Record<EnquiryType, number | null> = {
    form: def.form ? 0 : null,
    phone: def.phone ? 0 : null,
    email: def.email ? 0 : null,
    livechat: def.livechat ? 0 : null,
  };
  let rollupTotal: number | null = def.rollup ? 0 : null;
  const enquiryRows: EnquiryTypeSourceRow[] = [];

  for (const row of rows) {
    if (def.rollup && row.eventName === def.rollup) {
      rollupTotal = (rollupTotal ?? 0) + row.count;
      continue;
    }
    const type = eventToType.get(row.eventName);
    if (!type) continue; // Defensive — shouldn't happen since the query filters to exactly these names.
    totals[type] = (totals[type] ?? 0) + row.count;
    enquiryRows.push({ type, channelGroup: row.channelGroup, source: row.source, count: row.count });
  }

  const total = (['form', 'phone', 'email', 'livechat'] as EnquiryType[]).reduce(
    (sum, type) => sum + (totals[type] ?? 0),
    0
  );

  return { total, form: totals.form, phone: totals.phone, email: totals.email, livechat: totals.livechat, rollupTotal, rows: enquiryRows };
}

// Same per-property loop and configured/not-connected honesty rules as
// getBrandTraffic()/getSocialTraffic(), with one addition: a brand is
// only queried if it also has a confirmed ENQUIRY_EVENTS_BY_BRAND entry.
// A property that answers successfully with zero matching rows still
// gets pushed to `brands` with real zero counts — a connected property
// with no qualifying events this period is a genuine 0, never
// "Not connected".
export async function getEnquiries(startDate?: string, endDate?: string): Promise<Ga4EnquiriesResult> {
  const errors: string[] = [];
  const configuredBrands = (Object.keys(ENQUIRY_EVENTS_BY_BRAND) as Brand[]).filter(
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

  const brands: BrandEnquiries[] = [];
  for (const brand of configuredBrands) {
    const propertyId = process.env[PROPERTY_ID_ENV[brand] as string] as string;
    const def = ENQUIRY_EVENTS_BY_BRAND[brand] as BrandEnquiryDefinition;
    const eventNames = [...(def.form ?? []), ...(def.phone ?? []), ...(def.email ?? []), ...(def.livechat ?? []), ...(def.rollup ? [def.rollup] : [])];
    try {
      const rows = await runEnquiryReport(propertyId, token, range.startDate, range.endDate, eventNames);
      brands.push({ brand, ...summarizeEnquiryRows(def, rows) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ga4] failed to fetch enquiries for ${brand}:`, msg);
      errors.push(`${brand}: ${msg}`);
    }
  }

  return { configured: true, startDate: range.startDate, endDate: range.endDate, brands, configuredBrands, errors };
}

// Education 2026 campaign downstream attribution (Email page) — real GA4
// sessions (and, for brands with a verified enquiry definition, real GA4
// Enquiries) filtered to Campaign Monitor's Education traffic.
//
// IMPORTANT — corrected against real evidence, not the originally assumed
// tagging scheme. This app's Education emails don't carry the custom
// utm_source=campaign_monitor/utm_campaign=education_2026 tags the brief
// first assumed; Campaign Monitor's own built-in "add Google Analytics
// tracking" feature auto-tags links instead, and GA4's live Traffic
// Acquisition report for IRCL confirmed the real value is the combined
// source/medium "Campaign Monitor Email / email" — i.e.
// sessionSource="Campaign Monitor Email", sessionMedium="email". The
// campaign name Campaign Monitor auto-fills is presumed to be the send's
// own real name (e.g. "MTech IRCL - Education Solutions - High School -
// Brought Data - Northern Ireland"), not a literal "education_2026" — so
// isolating Education-specific traffic from any other Campaign Monitor
// send uses a CONTAINS match for "education" in sessionCampaignName
// (case-insensitive), mirroring the same "Education" keyword the backend
// sync already uses to identify an Education send by name. This still
// needs confirming against the exact live sessionSource/sessionCampaignName
// strings — see the Email page follow-up for the diagnostic to run.
//
// Uses GA4's own built-in session-scoped UTM dimensions (sessionSource,
// sessionMedium, sessionCampaignName, sessionManualAdContent for
// utm_content) — no custom dimension registration required in GA4, unlike
// the older Wave 1 query's customEvent:utm_content. Every property with a
// configured GA4_PROPERTY_ID_* is queried for sessions regardless of
// whether that brand has a verified enquiry definition; enquiries are only
// computed for brands that do (same configured/not-connected honesty rule
// as getEnquiries). This never invents a "leads/opportunities/revenue"
// stage — those require Acumatica, which isn't connected.
const EDUCATION_UTM_FILTER = {
  andGroup: {
    expressions: [
      { filter: { fieldName: 'sessionSource', stringFilter: { matchType: 'EXACT', value: 'Campaign Monitor Email', caseSensitive: false } } },
      { filter: { fieldName: 'sessionMedium', stringFilter: { matchType: 'EXACT', value: 'email', caseSensitive: false } } },
      { filter: { fieldName: 'sessionCampaignName', stringFilter: { matchType: 'CONTAINS', value: 'education', caseSensitive: false } } },
    ],
  },
};

export interface EducationContentRow {
  utmContent: string;
  sessions: number;
}

export interface EducationEnquiryContentRow {
  utmContent: string;
  count: number;
}

export interface BrandEducationAttribution {
  brand: Brand;
  sessions: number;
  byContent: EducationContentRow[];
  // null when this brand has no verified GA4 Enquiry definition — never a
  // fabricated 0. See ENQUIRY_EVENTS_BY_BRAND above.
  enquiries: number | null;
  enquiriesByContent: EducationEnquiryContentRow[];
}

export interface Ga4EducationAttributionResult {
  configured: boolean;
  startDate: string;
  endDate: string;
  brands: BrandEducationAttribution[];
  // Every brand with a configured GA4 property — sessions are queried for
  // all of them, not just brands with a verified enquiry definition.
  configuredBrands: Brand[];
  errors: string[];
}

interface Ga4RawRow {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

async function runEducationSessionsReport(propertyId: string, token: string, startDate: string, endDate: string): Promise<EducationContentRow[]> {
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionManualAdContent' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: EDUCATION_UTM_FILTER,
      limit: 1000,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 Education attribution runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: Ga4RawRow[] };
  return (json.rows || []).map((row) => ({
    utmContent: row.dimensionValues[0]?.value || '(not set)',
    sessions: Number(row.metricValues[0]?.value ?? 0),
  }));
}

async function runEducationEnquiryReport(
  propertyId: string,
  token: string,
  startDate: string,
  endDate: string,
  eventNames: string[]
): Promise<{ utmContent: string; eventName: string; count: number }[]> {
  const res = await fetch(`${DATA_API_BASE}/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionManualAdContent' }, { name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            EDUCATION_UTM_FILTER,
            { filter: { fieldName: 'eventName', inListFilter: { values: eventNames } } },
          ],
        },
      },
      limit: 1000,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GA4 Education enquiry attribution runReport failed for property ${propertyId} (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { rows?: Ga4RawRow[] };
  return (json.rows || []).map((row) => ({
    utmContent: row.dimensionValues[0]?.value || '(not set)',
    eventName: row.dimensionValues[1]?.value || '',
    count: Number(row.metricValues[0]?.value ?? 0),
  }));
}

export async function getEducationCampaignAttribution(startDate?: string, endDate?: string): Promise<Ga4EducationAttributionResult> {
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

  const brands: BrandEducationAttribution[] = [];
  for (const brand of configuredBrands) {
    const propertyId = process.env[PROPERTY_ID_ENV[brand] as string] as string;
    try {
      const byContent = await runEducationSessionsReport(propertyId, token, range.startDate, range.endDate);
      const sessions = byContent.reduce((sum, r) => sum + r.sessions, 0);

      const def = ENQUIRY_EVENTS_BY_BRAND[brand];
      let enquiries: number | null = null;
      let enquiriesByContent: EducationEnquiryContentRow[] = [];
      if (def) {
        const eventNames = [...(def.form ?? []), ...(def.phone ?? []), ...(def.email ?? []), ...(def.livechat ?? [])];
        const enquiryRows = await runEducationEnquiryReport(propertyId, token, range.startDate, range.endDate, eventNames);
        const byContentMap = new Map<string, number>();
        for (const row of enquiryRows) {
          byContentMap.set(row.utmContent, (byContentMap.get(row.utmContent) ?? 0) + row.count);
        }
        enquiriesByContent = Array.from(byContentMap.entries()).map(([utmContent, count]) => ({ utmContent, count }));
        enquiries = enquiriesByContent.reduce((sum, r) => sum + r.count, 0);
      }

      brands.push({ brand, sessions, byContent, enquiries, enquiriesByContent });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ga4] failed to fetch Education campaign attribution for ${brand}:`, msg);
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
