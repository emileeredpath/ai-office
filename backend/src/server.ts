import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import actionsRouter from './routes/actions.js';
import tasksRouter from './routes/tasks.js';
import mcpRouter from './routes/mcp.js';
import marketingosRouter from './routes/marketingos.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: false,
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

app.use('/api/actions', actionsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/marketingos', marketingosRouter);
app.use('/mcp', mcpRouter);

// Serve frontend static files in production
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for all non-API routes
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ success: false, message: 'Not found' });
    }
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
  console.log(`API Key configured: ${process.env.API_KEY ? 'yes' : 'no'}`);
});
