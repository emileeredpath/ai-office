import type { DatabaseSync } from 'node:sqlite';

interface Migration {
  version: string;
  up: (db: DatabaseSync) => void;
}

const migrations: Migration[] = [
  {
    version: '20260921_001_marketing_plan_foundation',
    up: (db) => {
      db.exec(`
        CREATE TABLE marketing_plans (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          period_year INTEGER NOT NULL,
          business_direction TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          next_review_date TEXT,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          archived_at TEXT
        );

        CREATE TABLE marketing_plan_objectives (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL REFERENCES marketing_plans(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          priority TEXT NOT NULL DEFAULT 'tbc',
          period_year INTEGER NOT NULL,
          quarter INTEGER,
          why_it_matters TEXT NOT NULL DEFAULT '',
          customer_market_context TEXT NOT NULL DEFAULT '',
          commercial_relevance TEXT NOT NULL DEFAULT '',
          marketing_rationale TEXT NOT NULL DEFAULT '',
          next_review_date TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          archived_at TEXT
        );

        CREATE TABLE marketing_plan_objective_entities (
          objective_id TEXT NOT NULL REFERENCES marketing_plan_objectives(id) ON DELETE CASCADE,
          brand TEXT NOT NULL,
          PRIMARY KEY (objective_id, brand)
        );

        CREATE TABLE marketing_plan_priorities (
          id TEXT PRIMARY KEY,
          objective_id TEXT NOT NULL REFERENCES marketing_plan_objectives(id),
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          sort_order INTEGER NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          archived_at TEXT
        );

        CREATE TABLE marketing_plan_milestones (
          id TEXT PRIMARY KEY,
          objective_id TEXT NOT NULL REFERENCES marketing_plan_objectives(id),
          priority_id TEXT REFERENCES marketing_plan_priorities(id),
          level TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          status TEXT NOT NULL DEFAULT 'draft',
          period_year INTEGER,
          quarter INTEGER,
          month INTEGER,
          start_date TEXT,
          due_date TEXT,
          attention_type TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          archived_at TEXT
        );

        CREATE TABLE marketing_plan_campaign_links (
          id TEXT PRIMARY KEY,
          objective_id TEXT NOT NULL REFERENCES marketing_plan_objectives(id),
          priority_id TEXT REFERENCES marketing_plan_priorities(id),
          campaign_id TEXT NOT NULL,
          sort_order INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );

        CREATE UNIQUE INDEX idx_marketing_plan_campaign_link_unique
          ON marketing_plan_campaign_links(objective_id, COALESCE(priority_id, ''), campaign_id);

        CREATE TABLE marketing_plan_kpis (
          id TEXT PRIMARY KEY,
          objective_id TEXT NOT NULL REFERENCES marketing_plan_objectives(id),
          kpi_key TEXT NOT NULL,
          target_value REAL,
          target_unit TEXT,
          target_direction TEXT NOT NULL DEFAULT 'reach',
          target_status TEXT NOT NULL DEFAULT 'tbc',
          period_scope TEXT NOT NULL DEFAULT 'objective',
          sort_order INTEGER NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(objective_id, kpi_key)
        );

        CREATE TABLE marketing_plan_reviews (
          id TEXT PRIMARY KEY,
          plan_id TEXT NOT NULL REFERENCES marketing_plans(id),
          objective_id TEXT REFERENCES marketing_plan_objectives(id),
          review_type TEXT NOT NULL,
          period_year INTEGER NOT NULL,
          quarter INTEGER,
          month INTEGER,
          status TEXT NOT NULL DEFAULT 'draft',
          review_date TEXT NOT NULL,
          what_happened TEXT NOT NULL DEFAULT '',
          what_changed TEXT NOT NULL DEFAULT '',
          why_it_matters TEXT NOT NULL DEFAULT '',
          worked TEXT NOT NULL DEFAULT '',
          did_not_work TEXT NOT NULL DEFAULT '',
          learned TEXT NOT NULL DEFAULT '',
          changes_next TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0,
          archived_at TEXT
        );

        CREATE TABLE marketing_plan_review_evidence (
          id TEXT PRIMARY KEY,
          review_id TEXT NOT NULL REFERENCES marketing_plan_reviews(id) ON DELETE CASCADE,
          objective_kpi_id TEXT REFERENCES marketing_plan_kpis(id),
          kpi_key TEXT NOT NULL,
          target_value REAL,
          target_unit TEXT,
          actual_value REAL,
          actual_display TEXT,
          data_status TEXT NOT NULL,
          trend_display TEXT,
          source_label TEXT NOT NULL,
          measurement_start TEXT,
          measurement_end TEXT,
          measurement_period TEXT,
          captured_at TEXT NOT NULL
        );

        CREATE TABLE marketing_plan_history (
          id TEXT PRIMARY KEY,
          resource_type TEXT NOT NULL,
          resource_id TEXT NOT NULL,
          action TEXT NOT NULL,
          field_name TEXT,
          previous_value TEXT,
          new_value TEXT,
          reason TEXT,
          source TEXT NOT NULL DEFAULT 'dashboard',
          changed_at TEXT NOT NULL
        );

        CREATE INDEX idx_marketing_plan_objectives_plan ON marketing_plan_objectives(plan_id, sort_order);
        CREATE INDEX idx_marketing_plan_objective_entities_brand ON marketing_plan_objective_entities(brand);
        CREATE INDEX idx_marketing_plan_priorities_objective ON marketing_plan_priorities(objective_id, sort_order);
        CREATE INDEX idx_marketing_plan_milestones_objective ON marketing_plan_milestones(objective_id, level, sort_order);
        CREATE INDEX idx_marketing_plan_campaign_links_objective ON marketing_plan_campaign_links(objective_id, sort_order);
        CREATE INDEX idx_marketing_plan_campaign_links_campaign ON marketing_plan_campaign_links(campaign_id);
        CREATE INDEX idx_marketing_plan_kpis_objective ON marketing_plan_kpis(objective_id, sort_order);
        CREATE INDEX idx_marketing_plan_reviews_plan ON marketing_plan_reviews(plan_id, review_date);
        CREATE INDEX idx_marketing_plan_reviews_objective ON marketing_plan_reviews(objective_id, review_date);
        CREATE INDEX idx_marketing_plan_history_resource ON marketing_plan_history(resource_type, resource_id, changed_at);
        CREATE INDEX idx_marketing_plan_history_changed ON marketing_plan_history(changed_at);
      `);
    },
  },
];

export function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db.prepare('SELECT 1 FROM schema_migrations WHERE version = ?');
  const record = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');

  for (const migration of migrations) {
    if (applied.get(migration.version)) continue;

    db.exec('BEGIN IMMEDIATE');
    try {
      migration.up(db);
      record.run(migration.version, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
