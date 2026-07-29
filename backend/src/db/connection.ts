import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DB_PATH = process.env.DATABASE_PATH || './data/ai-office.db';

mkdirSync(dirname(DB_PATH), { recursive: true });

// Node's built-in SQLite (stable since Node 22) — deliberately used instead
// of better-sqlite3 so the backend never needs to compile a native addon at
// deploy time. That compilation step failed in Railway's build image.
export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    brand TEXT NOT NULL DEFAULT 'mtech',
    status TEXT NOT NULL DEFAULT 'not-started',
    priority TEXT NOT NULL DEFAULT 'medium',
    deadline TEXT,
    start_date TEXT,
    campaign_id TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    previous_status TEXT,
    history TEXT NOT NULL DEFAULT '[]',
    approval_required INTEGER NOT NULL DEFAULT 0,
    approver TEXT,
    blocker_reason TEXT,
    last_brief_generated TEXT,
    source TEXT,
    source_conversation_id TEXT,
    type TEXT NOT NULL DEFAULT 'task',
    recipients INTEGER,
    subject TEXT
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'mtech',
    primary_industry TEXT NOT NULL DEFAULT '',
    secondary_industry TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'planning',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    budget REAL,
    spend REAL NOT NULL DEFAULT 0,
    conversions INTEGER NOT NULL DEFAULT 0,
    leads INTEGER NOT NULL DEFAULT 0,
    engagement REAL NOT NULL DEFAULT 0,
    colour TEXT NOT NULL DEFAULT '#3B82F6',
    reactive INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    previous_value TEXT,
    new_value TEXT,
    source TEXT NOT NULL,
    source_conversation_id TEXT,
    request_id TEXT,
    confirmed INTEGER NOT NULL DEFAULT 1,
    automatic INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS idempotency_keys (
    request_id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS business_objectives (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    success_statement TEXT NOT NULL,
    metrics TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'on-track',
    progress_percentage INTEGER NOT NULL DEFAULT 0,
    risk_level TEXT NOT NULL DEFAULT 'none',
    risk_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS dashboard_context (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    user_provided_context TEXT NOT NULL,
    current_tasks TEXT NOT NULL DEFAULT '[]',
    recent_activity TEXT NOT NULL DEFAULT '[]',
    sales_feedback TEXT NOT NULL DEFAULT '[]',
    performance_observations TEXT NOT NULL DEFAULT '[]',
    decisions_awaiting TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS daily_dashboard_snapshot (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    business_objective_status TEXT NOT NULL,
    priorities TEXT NOT NULL,
    needs_attention TEXT NOT NULL DEFAULT '[]',
    opportunities TEXT NOT NULL DEFAULT '[]',
    claude_recommendation TEXT NOT NULL,
    confidence_notes TEXT,
    generated_at TEXT NOT NULL,
    sources_used TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS quick_capture_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_campaign_id ON tasks(campaign_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
  CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_dashboard_context_date ON dashboard_context(date);
  CREATE INDEX IF NOT EXISTS idx_daily_dashboard_date ON daily_dashboard_snapshot(date);
  CREATE INDEX IF NOT EXISTS idx_quick_capture_created ON quick_capture_items(created_at);
`);

// CREATE TABLE IF NOT EXISTS above only defines the shape for a brand-new
// database — a tasks table that already existed on disk (e.g. a live Railway
// volume from before these columns existed) needs them added explicitly.
const existingTaskColumns = new Set(
  (db.prepare('PRAGMA table_info(tasks)').all() as unknown as { name: string }[]).map((c) => c.name)
);
if (!existingTaskColumns.has('type')) {
  db.exec(`ALTER TABLE tasks ADD COLUMN type TEXT NOT NULL DEFAULT 'task'`);
}
if (!existingTaskColumns.has('recipients')) {
  db.exec('ALTER TABLE tasks ADD COLUMN recipients INTEGER');
}
if (!existingTaskColumns.has('subject')) {
  db.exec('ALTER TABLE tasks ADD COLUMN subject TEXT');
}

export default db;
