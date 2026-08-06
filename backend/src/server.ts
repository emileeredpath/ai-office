import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import actionsRouter from './routes/actions.js';
import tasksRouter from './routes/tasks.js';
import campaignsRouter from './routes/campaigns.js';
import campaignMonitorRouter from './routes/campaignMonitor.js';
import analyticsRouter from './routes/analytics.js';
import mcpRouter from './routes/mcp.js';
import marketingosRouter from './routes/marketingos.js';
import authRouter from './routes/auth.js';
import { requireSession } from './middleware/session.js';
import { initMarketingTables } from './db/marketingRepository.js';
import { syncCampaignMonitor } from './services/campaignMonitor.js';
import { syncWave1Ga4, syncWave1Infinity } from './services/wave1Sync.js';
import './scripts/seed.js';

const app = express();
initMarketingTables();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Payload size limit — the actions API accepts small structured requests,
// never bulk file uploads.
app.use(express.json({ limit: '100kb' }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login, logout, and session check are unauthenticated by definition.
app.use('/api/auth', authRouter);

// Seed endpoint for Phase 3 demo (unauthenticated for testing)
app.use('/api/campaign-monitor/seed-test-data', async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  // Delegate to the router's seed handler
  const { insertTask } = await import('./db/taskRepository.js');
  const { nanoid } = await import('nanoid');

  const sends = [
    { brand: 'brentwood' as const, date: '2026-08-05', recipients: 6044, cost: 72.73, subject: 'Brentwood Repair Email' },
    { brand: 'radio-links' as const, date: '2026-08-06', recipients: 3300, cost: 43.50, subject: 'Radio Links August Update' },
    { brand: 'capcom' as const, date: '2026-08-08', recipients: 1554, cost: 22.05, subject: 'Capcom Product Launch' },
    { brand: 'ircl' as const, date: '2026-08-10', recipients: 243, cost: 7.26, subject: 'IRCL Newsletter' },
    { brand: 'brentwood' as const, date: '2026-08-15', recipients: 4200, cost: 58.62, subject: 'Brentwood Service Notice' },
    { brand: 'radio-links' as const, date: '2026-08-20', recipients: 2800, cost: 39.50, subject: 'Radio Links Promotion' },
  ];

  const now = new Date().toISOString();
  let created = 0;

  try {
    for (const send of sends) {
      const sentDate = send.date + 'T14:00:00Z';
      const task = {
        id: `task-${nanoid(10)}`,
        title: send.subject,
        notes: `Test send for Phase 3 calendar demo — seeded ${now}.`,
        brand: send.brand,
        status: 'complete' as const,
        priority: 'medium' as const,
        deadline: send.date,
        startDate: send.date,
        campaignId: null,
        scheduleId: null,
        createdAt: now,
        completedAt: sentDate,
        previousStatus: null,
        history: [],
        approvalRequired: false,
        approver: null,
        blockerReason: null,
        lastBriefGenerated: null,
        source: 'test-seed',
        sourceConversationId: null,
        type: 'email-send' as const,
        recipients: send.recipients,
        subject: send.subject,
        assignedTo: null,
        cost: send.cost,
        currency: 'GBP',
        externalId: null,
        opens: null,
        clicks: null,
        openRate: null,
        clickRate: null,
        bounces: null,
        unsubscribes: null,
      };
      insertTask(task);
      created += 1;
    }
    res.json({ success: true, message: `Created ${created} test email-send tasks for August 2026.`, created });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[seed-test-data] error:', message);
    res.status(500).json({ success: false, error: message });
  }
});

// Everything else under /api/ requires a signed-in session (Emilee = edit,
// John = view) — no session, no data, even if you hit the API directly.
app.use('/api/tasks', requireSession, tasksRouter);
app.use('/api/campaigns', requireSession, campaignsRouter);
app.use('/api/campaign-monitor', requireSession, campaignMonitorRouter);
app.use('/api/analytics', requireSession, analyticsRouter);
app.use('/api/actions', requireSession, actionsRouter);
app.use('/api/marketingos', requireSession, marketingosRouter);

// Claude's MCP connection is a separate, already-scoped access path (per the
// build brief, not part of the dashboard's shared-password wall).
app.use('/mcp', mcpRouter);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../../dist');

// Frontend is served from this same Railway service at the root — the SPA
// shell itself is public (it has to be, to show the login screen); every
// byte of real data behind it still requires the session above.
app.use(express.static(distPath));

app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) {
    next();
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next(err);
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// Safe error handler — never echoes internal error details back to the caller.
app.use((err: Error & { type?: string; status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: 'Request payload is too large.' });
    return;
  }
  if (err.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Malformed JSON in request body.' });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`AI Office Actions API listening on port ${PORT}`);
});

// Campaign Monitor weekly sync — see the Campaign Monitor API Integration
// brief. Opt-in via env var so a missing/invalid API key never blocks a
// deploy; failures are logged and retried on the next scheduled run, never
// thrown from here.
if (process.env.CAMPAIGN_MONITOR_SYNC_ENABLED === 'true') {
  const schedule = process.env.CAMPAIGN_MONITOR_SYNC_SCHEDULE || '0 18 * * 0';
  if (cron.validate(schedule)) {
    cron.schedule(schedule, () => {
      console.log('[campaign-monitor] scheduled sync starting...');
      syncCampaignMonitor()
        .then((result) => console.log('[campaign-monitor] scheduled sync finished:', JSON.stringify(result)))
        .catch((err) => console.error('[campaign-monitor] scheduled sync threw:', err));
    });
    console.log(`[campaign-monitor] weekly sync scheduled: "${schedule}"`);
  } else {
    console.error(`[campaign-monitor] CAMPAIGN_MONITOR_SYNC_SCHEDULE "${schedule}" is not a valid cron expression — sync not scheduled.`);
  }
}

// Wave 1 auto-sync — GA4 every 6h, Infinity every 2h, per the Wave 1 Data
// Integration + Dashboard Campaign Summary briefs. Both services already
// no-op safely when their API keys aren't configured, so these always run;
// there's nothing to gate behind an env var.
cron.schedule('0 */6 * * *', () => {
  console.log('[wave1] scheduled GA4 sync starting...');
  syncWave1Ga4()
    .then((result) => console.log('[wave1] scheduled GA4 sync finished:', JSON.stringify({ configured: result.configured, errors: result.errors })))
    .catch((err) => console.error('[wave1] scheduled GA4 sync threw:', err));
});
console.log('[wave1] GA4 auto-sync scheduled: every 6 hours');

cron.schedule('0 */2 * * *', () => {
  console.log('[wave1] scheduled Infinity sync starting...');
  syncWave1Infinity()
    .then((result) => console.log('[wave1] scheduled Infinity sync finished:', JSON.stringify({ configured: result.configured, errors: result.errors })))
    .catch((err) => console.error('[wave1] scheduled Infinity sync threw:', err));
});
console.log('[wave1] Infinity auto-sync scheduled: every 2 hours');
