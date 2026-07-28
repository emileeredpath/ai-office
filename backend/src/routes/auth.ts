import { Router, type Request, type Response } from 'express';
import { rateLimit } from '../middleware/rateLimit.js';
import {
  createSession,
  destroySession,
  getSessionIdFromRequest,
  getSessionRole,
  setSessionCookie,
  clearSessionCookie,
} from '../middleware/session.js';

const router = Router();

// A single shared team password protects the whole app. EDIT_PASSWORD is
// Emilee's password; VIEW_PASSWORD is John's read-only password. If only
// EDIT_PASSWORD is set, it doubles as the view password too — the simplest
// version described in the brief still works with one password configured.
router.post('/login', rateLimit, (req: Request, res: Response) => {
  const editPassword = process.env.EDIT_PASSWORD;
  const viewPassword = process.env.VIEW_PASSWORD || editPassword;

  if (!editPassword) {
    res.status(500).json({ success: false, message: 'Server is not configured with a password yet.' });
    return;
  }

  const { password } = req.body ?? {};
  if (typeof password !== 'string' || !password) {
    res.status(400).json({ success: false, message: 'Password is required.' });
    return;
  }

  let role: 'edit' | 'view' | null = null;
  if (password === editPassword) role = 'edit';
  else if (password === viewPassword) role = 'view';

  if (!role) {
    res.status(401).json({ success: false, message: 'Incorrect password.' });
    return;
  }

  const sessionId = createSession(role);
  setSessionCookie(res, sessionId);
  res.json({ success: true, role });
});

router.post('/logout', (req: Request, res: Response) => {
  destroySession(getSessionIdFromRequest(req));
  clearSessionCookie(res);
  res.json({ success: true });
});

router.get('/me', (req: Request, res: Response) => {
  const role = getSessionRole(req);
  res.json({ success: true, authenticated: !!role, role });
});

export default router;
