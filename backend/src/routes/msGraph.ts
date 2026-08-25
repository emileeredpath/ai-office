import { randomBytes } from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { requireSession, requireEdit, parseCookies } from '../middleware/session.js';
import {
  isMsGraphConfigured,
  getAuthorizationUrl,
  exchangeCodeForTokens,
  fetchConnectedAccountEmail,
} from '../services/msGraphAuth.js';
import { getMsGraphToken, saveMsGraphToken, clearMsGraphToken } from '../db/msGraphTokenRepository.js';
import { listTodoLists } from '../services/msGraphTodo.js';

// Microsoft To Do (Microsoft Graph, delegated OAuth) — the connect/
// callback/status/disconnect flow. Mounted at /api/auth/microsoft so the
// callback lands at exactly the redirect URI registered in the Entra app
// registration: /api/auth/microsoft/callback.
const router = Router();

const STATE_COOKIE = 'ms_oauth_state';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — just long enough for a real login

function setStateCookie(res: Response, state: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${STATE_COOKIE}=${state}; HttpOnly; Path=/; Max-Age=${Math.floor(STATE_TTL_MS / 1000)}; SameSite=Lax${secure ? '; Secure' : ''}`
  );
}

function clearStateCookie(res: Response) {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie', `${STATE_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`);
}

// Only the edit user (Emilee) can initiate connecting her own personal
// Microsoft account.
router.get('/connect', requireSession, requireEdit, (req: Request, res: Response) => {
  if (!isMsGraphConfigured()) {
    res.status(503).json({ success: false, message: 'Microsoft Graph is not configured on this deployment.' });
    return;
  }
  const state = randomBytes(24).toString('hex');
  setStateCookie(res, state);
  res.redirect(getAuthorizationUrl(state));
});

// Microsoft redirects the browser here after consent. Verifies the state
// cookie (CSRF protection for the round-trip) before exchanging the code.
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string | undefined;
  const returnedState = req.query.state as string | undefined;
  const graphError = req.query.error as string | undefined;
  const graphErrorDescription = req.query.error_description as string | undefined;

  const cookieState = parseCookies(req.headers.cookie)[STATE_COOKIE];
  clearStateCookie(res);

  if (graphError) {
    console.error('[msGraph] consent denied or Microsoft returned an error:', graphError, graphErrorDescription);
    res.status(400).send(`Microsoft Graph authorization failed: ${graphError} — ${graphErrorDescription || ''}`);
    return;
  }
  if (!code || !returnedState || !cookieState || returnedState !== cookieState) {
    res.status(400).send('Microsoft Graph authorization failed: invalid or missing state — please try connecting again.');
    return;
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const accountEmail = await fetchConnectedAccountEmail(tokens.accessToken);
    saveMsGraphToken({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scope: tokens.scope,
      accountEmail,
    });
    // The frontend is a client-side-routed SPA with no URL-based deep
    // linking to a specific screen — redirecting to the root is the most
    // honest option available; the user picks My Tasks manually.
    res.redirect('/?msGraphConnected=1');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[msGraph] token exchange failed:', msg);
    res.status(502).send(`Microsoft Graph connection failed: ${msg}`);
  }
});

router.get('/status', requireSession, (_req: Request, res: Response) => {
  const stored = getMsGraphToken();
  res.json({
    configured: isMsGraphConfigured(),
    connected: !!stored,
    accountEmail: stored?.accountEmail ?? null,
    connectedAt: stored?.connectedAt ?? null,
  });
});

router.post('/disconnect', requireSession, requireEdit, (_req: Request, res: Response) => {
  clearMsGraphToken();
  res.json({ success: true });
});

// Real, live list retrieval — the same call used to prove the connection
// works end to end before any task UI is wired to it.
router.get('/todo-lists', requireSession, requireEdit, async (_req: Request, res: Response) => {
  try {
    const lists = await listTodoLists();
    res.json({ success: true, lists });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[msGraph] failed to list To Do lists:', msg);
    res.status(502).json({ success: false, message: msg });
  }
});

export default router;
