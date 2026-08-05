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
    subject TEXT,
    assigned_to TEXT,
    cost REAL,
    currency TEXT,
    external_id TEXT
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL DEFAULT 'mtech',
    entities TEXT NOT NULL DEFAULT '[]',
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
    notes TEXT NOT NULL DEFAULT '',
    results TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

  CREATE TABLE IF NOT EXISTS wave_1_performance_metrics (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    metric_date TEXT NOT NULL,
    brand TEXT NOT NULL,
    utm_content TEXT,
    clicks INTEGER NOT NULL DEFAULT 0,
    page_views INTEGER NOT NULL DEFAULT 0,
    form_submissions INTEGER NOT NULL DEFAULT 0,
    conversion_rate REAL NOT NULL DEFAULT 0,
    calls_total INTEGER NOT NULL DEFAULT 0,
    calls_answered INTEGER NOT NULL DEFAULT 0,
    calls_missed INTEGER NOT NULL DEFAULT 0,
    avg_call_duration TEXT,
    last_synced TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(campaign_id, metric_type, metric_date, brand, utm_content)
  );

  CREATE INDEX IF NOT EXISTS idx_wave1_campaign_date ON wave_1_performance_metrics(campaign_id, metric_date);
  CREATE INDEX IF NOT EXISTS idx_wave1_metric_type ON wave_1_performance_metrics(metric_type);
`);

// Additive migrations for databases created before a column existed. SQLite
// has no "ADD COLUMN IF NOT EXISTS", so probe pragma_table_info and add only
// what's missing — safe to run on every boot.
function columnExists(table: string, column: string): boolean {
  const rows = db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ?`).all(table, column);
  return rows.length > 0;
}

function addColumnIfMissing(table: string, column: string, definition: string) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing('campaigns', 'entities', "TEXT NOT NULL DEFAULT '[]'");
addColumnIfMissing('campaigns', 'results', 'TEXT');
addColumnIfMissing('campaigns', 'created_at', "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
addColumnIfMissing('campaigns', 'updated_at', "TEXT NOT NULL DEFAULT '1970-01-01T00:00:00.000Z'");
// Nullable now so a later per-person to-do phase doesn't need a schema change.
addColumnIfMissing('tasks', 'assigned_to', 'TEXT');
// Calendar/send-log fields — see the Calendar Improvements brief.
addColumnIfMissing('tasks', 'type', "TEXT NOT NULL DEFAULT 'task'");
addColumnIfMissing('tasks', 'recipients', 'INTEGER');
addColumnIfMissing('tasks', 'subject', 'TEXT');
// Cost tracking — see the Calendar Improvements + Cost Tracking brief.
addColumnIfMissing('tasks', 'cost', 'REAL');
addColumnIfMissing('tasks', 'currency', 'TEXT');
// Dedup key for automated external syncs (e.g. Campaign Monitor) — see the
// Campaign Monitor API Integration brief.
addColumnIfMissing('tasks', 'external_id', 'TEXT');
db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_source_external ON tasks(source, external_id)');

// Phase 1 campaign fields — see the Phase 1 Design brief.
addColumnIfMissing('campaigns', 'industry', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('campaigns', 'recipients', 'INTEGER');
addColumnIfMissing('campaigns', 'value_generated', 'REAL');
addColumnIfMissing('campaigns', 'vendor', 'TEXT');
addColumnIfMissing('campaigns', 'scheme', 'TEXT');
addColumnIfMissing('campaigns', 'cofund_rate', 'REAL');
addColumnIfMissing('campaigns', 'claim_status', 'TEXT');
addColumnIfMissing('campaigns', 'schedule', 'TEXT');

// Email send metrics from Campaign Monitor — see the Campaign Monitor API Integration brief.
addColumnIfMissing('tasks', 'opens', 'INTEGER');
addColumnIfMissing('tasks', 'clicks', 'INTEGER');
addColumnIfMissing('tasks', 'open_rate', 'REAL');
addColumnIfMissing('tasks', 'click_rate', 'REAL');
addColumnIfMissing('tasks', 'bounces', 'INTEGER');
addColumnIfMissing('tasks', 'unsubscribes', 'INTEGER');

// Schedule linking for task-to-campaign cascade updates — see Phase 1 Implementation Brief.
addColumnIfMissing('tasks', 'schedule_id', 'TEXT');
db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_schedule_id ON tasks(schedule_id)');

export default db;
