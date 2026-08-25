// Microsoft Graph delegated OAuth (Microsoft To Do integration) — the
// first genuine authorization-code/browser-redirect OAuth flow in this
// app. Distinct from every other integration here: GA4 uses a
// service-account JWT (no user consent), Google Ads uses a permanently
// static refresh token generated once out-of-band. This flow requires a
// real interactive consent redirect (Emilee signs in with her personal
// Microsoft account) and the resulting refresh token genuinely rotates,
// so it's persisted in SQLite (msGraphTokenRepository), not read from an
// env var.
//
// Scopes requested: offline_access (required to receive a refresh token
// at all) + Tasks.ReadWrite + User.Read — exactly the two delegated
// permissions configured on the Entra app registration, nothing broader.
//
// IMPORTANT — untested against the real account from this sandbox: no
// MS_GRAPH_* vars exist here, and this sandbox has no route to
// login.microsoftonline.com or graph.microsoft.com. The request/response
// shapes below follow Microsoft's documented v2.0 endpoint, but must be
// confirmed live before this is trusted — see the connect flow.
import { getMsGraphToken, saveMsGraphToken } from '../db/msGraphTokenRepository.js';

const AUTHORITY_BASE = 'https://login.microsoftonline.com';
const GRAPH_SCOPES = 'offline_access Tasks.ReadWrite User.Read';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function tokenUrl(): string {
  return `${AUTHORITY_BASE}/${requireEnv('MS_GRAPH_TENANT_ID')}/oauth2/v2.0/token`;
}

export function isMsGraphConfigured(): boolean {
  return !!(process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET && process.env.MS_GRAPH_TENANT_ID && process.env.MS_GRAPH_REDIRECT_URI);
}

// Builds the URL to send the browser to for interactive consent. `state`
// is a caller-supplied random value verified against a short-lived cookie
// on callback — CSRF protection for the redirect round-trip.
export function getAuthorizationUrl(state: string): string {
  const clientId = requireEnv('MS_GRAPH_CLIENT_ID');
  const tenantId = requireEnv('MS_GRAPH_TENANT_ID');
  const redirectUri = requireEnv('MS_GRAPH_REDIRECT_URI');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: GRAPH_SCOPES,
    state,
  });
  return `${AUTHORITY_BASE}/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

interface GraphTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  scope: string;
  token_type: string;
}

export interface ExchangedTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
}

async function postTokenRequest(body: URLSearchParams): Promise<GraphTokenResponse> {
  const res = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Microsoft's error responses are JSON (error, error_description) —
    // surfaced verbatim (truncated) so a real misconfiguration (wrong
    // redirect URI, expired code, invalid client secret) is never
    // mistaken for something else. Never logs the request body — that
    // contains the client secret and the auth code/refresh token.
    throw new Error(`Microsoft Graph token request failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return (await res.json()) as GraphTokenResponse;
}

// Exchanges the one-time authorization code (from the callback's ?code=)
// for a real access/refresh token pair. Must be called with the exact
// same redirect_uri used in the authorize request, per OAuth spec.
export async function exchangeCodeForTokens(code: string): Promise<ExchangedTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv('MS_GRAPH_CLIENT_ID'),
    client_secret: requireEnv('MS_GRAPH_CLIENT_SECRET'),
    grant_type: 'authorization_code',
    code,
    redirect_uri: requireEnv('MS_GRAPH_REDIRECT_URI'),
    scope: GRAPH_SCOPES,
  });
  const json = await postTokenRequest(body);
  if (!json.refresh_token) {
    // Should not happen given offline_access is requested, but a token
    // response with no refresh token would silently break every future
    // refresh — fail loudly instead.
    throw new Error('Microsoft Graph token response did not include a refresh_token (offline_access may not have been granted)');
  }
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scope: json.scope,
  };
}

async function refreshTokens(refreshToken: string): Promise<ExchangedTokens> {
  const body = new URLSearchParams({
    client_id: requireEnv('MS_GRAPH_CLIENT_ID'),
    client_secret: requireEnv('MS_GRAPH_CLIENT_SECRET'),
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: GRAPH_SCOPES,
  });
  const json = await postTokenRequest(body);
  return {
    accessToken: json.access_token,
    // Microsoft may or may not rotate the refresh token on each use —
    // if it doesn't send a new one, keep using the one that still works.
    refreshToken: json.refresh_token ?? refreshToken,
    expiresAt: new Date(Date.now() + json.expires_in * 1000).toISOString(),
    scope: json.scope,
  };
}

// Fetches the connected account's real display name/UPN via Graph's own
// /me endpoint (covered by the User.Read scope already granted) — used
// only to show "Connected as ..." honestly, never to invent an identity.
export async function fetchConnectedAccountEmail(accessToken: string): Promise<string | null> {
  const res = await fetch('https://graph.microsoft.com/v1.0/me?$select=userPrincipalName,mail', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { userPrincipalName?: string; mail?: string };
  return json.mail || json.userPrincipalName || null;
}

// Single shared source of a real, currently-valid access token — refreshes
// automatically (and persists the refreshed pair) whenever the stored
// token is within 2 minutes of expiry. Throws a clear, specific error if
// nothing has ever been connected, or if the refresh itself fails (e.g.
// the user revoked consent) — never silently returns a stale/invalid
// token.
export async function getValidAccessToken(): Promise<string> {
  const stored = getMsGraphToken();
  if (!stored) {
    throw new Error('Microsoft To Do is not connected — no token on file. Visit /api/auth/microsoft/connect to connect.');
  }

  const expiresAt = new Date(stored.expiresAt).getTime();
  if (expiresAt - Date.now() > 2 * 60 * 1000) {
    return stored.accessToken;
  }

  const refreshed = await refreshTokens(stored.refreshToken);
  saveMsGraphToken({
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    expiresAt: refreshed.expiresAt,
    scope: refreshed.scope,
  });
  return refreshed.accessToken;
}
