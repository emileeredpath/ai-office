import { randomBytes } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export type SessionRole = 'edit' | 'view';

const SESSION_COOKIE = 'ai_office_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SessionEntry {
  role: SessionRole;
  expiresAt: number;
}

// In-memory session store. Fine for a single-process, single-team
// deployment — sessions reset on redeploy, which just means signing in
// again, not data loss (all real data lives in the database).
const sessions = new Map<string, SessionEntry>();

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

export function createSession(role: SessionRole): string {
  const id = randomBytes(32).toString('hex');
  sessions.set(id, { role, expiresAt: Date.now() + SESSION_TTL_MS });
  return id;
}

export function destroySession(id: string | undefined) {
  if (id) sessions.delete(id);
}

function getSession(id: string | undefined): SessionEntry | undefined {
  if (!id) return undefined;
  const entry = sessions.get(id);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    sessions.delete(id);
    return undefined;
  }
  return entry;
}

export function setSessionCookie(res: Response, sessionId: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${sessionId}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

export function clearSessionCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`);
}

export function getSessionIdFromRequest(req: Request): string | undefined {
  return parseCookies(req.headers.cookie)[SESSION_COOKIE];
}

export function getSessionRole(req: Request): SessionRole | null {
  const entry = getSession(getSessionIdFromRequest(req));
  return entry?.role ?? null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      sessionRole?: SessionRole;
    }
  }
}

// Applied to every /api/* route that serves real data — no session, no data.
export function requireSession(req: Request, res: Response, next: NextFunction) {
  const role = getSessionRole(req);
  if (!role) {
    res.status(401).json({ success: false, message: 'Sign in required.' });
    return;
  }
  req.sessionRole = role;
  next();
}

// Layer on top of requireSession for routes that mutate data — John's
// view-only session gets a clear 403 instead of being able to write.
export function requireEdit(req: Request, res: Response, next: NextFunction) {
  if (req.sessionRole !== 'edit') {
    res.status(403).json({ success: false, message: 'View-only access — this action requires edit access.' });
    return;
  }
  next();
}
