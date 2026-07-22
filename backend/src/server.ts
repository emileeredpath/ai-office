import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import employeesRouter from './routes/employees.js';
import tasksRouter from './routes/tasks.js';
import conversationsRouter from './routes/conversations.js';
import companiesRouter from './routes/companies.js';
import knowledgeRouter from './routes/knowledge.js';
import specialistAIRouter from './routes/specialistAI.js';
import integrationsRouter from './routes/integrations.js';
import outcomesRouter from './routes/outcomes.js';
import adminRouter from './routes/admin.js';
import taskWorkspaceRouter from './routes/taskWorkspace.js';
import advancedFeaturesRouter from './routes/advancedFeatures.js';
import phase7IntegrationsRouter from './routes/phase7Integrations.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/companies', companiesRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/specialist-ai', specialistAIRouter);
app.use('/api/integrations', integrationsRouter);
app.use('/api/outcomes', outcomesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/task-workspace', taskWorkspaceRouter);
app.use('/api/advanced', advancedFeaturesRouter);
app.use('/api/integrations', phase7IntegrationsRouter);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API docs: http://localhost:${PORT}/health`);
});
