import db from './connection.js';

// Singleton row — only one Microsoft account (Emilee's) ever connects.
const ROW_ID = 'default';

export interface MsGraphTokenRecord {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO datetime
  scope: string;
  accountEmail: string | null;
  connectedAt: string;
  updatedAt: string;
}

interface TokenRow {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scope: string;
  account_email: string | null;
  connected_at: string;
  updated_at: string;
}

function rowToRecord(row: TokenRow): MsGraphTokenRecord {
  return {
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scope: row.scope,
    accountEmail: row.account_email,
    connectedAt: row.connected_at,
    updatedAt: row.updated_at,
  };
}

export function getMsGraphToken(): MsGraphTokenRecord | null {
  const row = db.prepare('SELECT * FROM microsoft_graph_tokens WHERE id = ?').get(ROW_ID) as TokenRow | undefined;
  return row ? rowToRecord(row) : null;
}

// Upserts the singleton token row. accountEmail is optional — pass it on
// initial connect (fetched from Graph /me) and omit on a routine refresh
// to keep the previously-known value.
export function saveMsGraphToken(params: {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scope: string;
  accountEmail?: string | null;
}): void {
  const now = new Date().toISOString();
  const existing = getMsGraphToken();
  const accountEmail = params.accountEmail !== undefined ? params.accountEmail : (existing?.accountEmail ?? null);

  db.prepare(
    `INSERT INTO microsoft_graph_tokens (id, access_token, refresh_token, expires_at, scope, account_email, connected_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       scope = excluded.scope,
       account_email = excluded.account_email,
       updated_at = excluded.updated_at`
  ).run(ROW_ID, params.accessToken, params.refreshToken, params.expiresAt, params.scope, accountEmail, now, now);
}

export function clearMsGraphToken(): void {
  db.prepare('DELETE FROM microsoft_graph_tokens WHERE id = ?').run(ROW_ID);
}
