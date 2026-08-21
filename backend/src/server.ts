import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import actionsRouter from './routes/actions.js';
import tasksRouter from './routes/tasks.js';
import campaignsRouter from './routes/campaigns.js';
import fundingRouter from './routes/funding.js';
import documentsRouter from './routes/documents.js';
import auditLogRouter from './routes/auditLog.js';
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
import { runPreviewSeed } from './scripts/previewSeed.js';

// Preview-only sample data (dashboard-v2 Railway preview service). No-ops
// unless both PREVIEW_SEED_ENABLED=true and DATABASE_PATH contains
// "/preview/" — see scripts/previewSeed.ts. Never runs against production.
runPreviewSeed();

// Last-resort diagnostic net. Node's own default behavior on an uncaught
// exception is to log and exit — registering a handler here overrides that,
// so it MUST call process.exit(1) itself, or the process would instead hang
// around in a corrupted state instead of exiting cleanly for Railway's
// restartPolicy to recover it. This exists purely to tag the log line so a
// real crash is easy to find/grep in Railway's logs, not to change when the
// process dies.
process.on('uncaughtException', (err) => {
  console.error('[fatal] uncaughtException — exiting for Railway to restart:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[fatal] unhandledRejection — exiting for Railway to restart:', reason);
  process.exit(1);
});

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
// never bulk file uploads. /mcp is the one exception: creating a document
// attachment (entity: "document") via ai_office_create_record can carry a
// base64-encoded file (e.g. a source PDF), so it gets a much larger limit.
// Exactly one parser runs per request — never stack two express.json()
// calls on the same request, since the second would try to read an
// already-consumed body stream.
const smallJsonParser = express.json({ limit: '100kb' });
const mcpJsonParser = express.json({ limit: '15mb' });
app.use((req: Request, res: Response, next: NextFunction) => {
  (req.path === '/mcp' ? mcpJsonParser : smallJsonParser)(req, res, next);
});

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Login, logout, and session check are unauthenticated by definition.
app.use('/api/auth', authRouter);

// Everything else under /api/ requires a signed-in session (Emilee = edit,
// John = view) — no session, no data, even if you hit the API directly.
app.use('/api/tasks', requireSession, tasksRouter);
app.use('/api/campaigns', requireSession, campaignsRouter);
app.use('/api/funding', requireSession, fundingRouter);
app.use('/api/documents', requireSession, documentsRouter);
app.use('/api/audit-log', requireSession, auditLogRouter);
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
