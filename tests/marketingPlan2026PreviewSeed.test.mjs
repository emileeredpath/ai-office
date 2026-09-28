import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

const root = mkdtempSync(join(tmpdir(), 'marketing-plan-preview-seed-'));
const script = 'backend/dist/scripts/marketingPlan2026PreviewSeed.js';

after(() => rmSync(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }));

function run(databasePath, enabled = 'true') {
  return execFileSync(process.execPath, [script], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_PATH: databasePath, PREVIEW_SEED_ENABLED: enabled },
    encoding: 'utf8',
  });
}

test('refuses to initialise or write a non-preview database', () => {
  const databasePath = join(root, 'production.db');
  const output = run(databasePath);
  assert.match(output, /Skipped/);
  assert.equal(existsSync(databasePath), false);
});

test('creates the proposed plan once and preserves unknown values', () => {
  const previewDir = join(root, 'preview');
  mkdirSync(previewDir);
  const databasePath = join(previewDir, 'local.db');

  assert.match(run(databasePath), /Created proposed plan/);
  assert.match(run(databasePath), /already exists/);

  const db = new DatabaseSync(databasePath);
  try {
    const plan = db.prepare("SELECT id, status, next_review_date FROM marketing_plans WHERE title = 'MTech Marketing Plan 2026/27'").get();
    assert.equal(plan.status, 'proposed');
    assert.equal(plan.next_review_date, null);
    assert.equal(db.prepare('SELECT COUNT(*) count FROM marketing_plans').get().count, 1);

    const objective = db.prepare('SELECT id FROM marketing_plan_objectives WHERE plan_id = ?').get(plan.id);
    assert.equal(db.prepare('SELECT COUNT(*) count FROM marketing_plan_milestones WHERE objective_id = ?').get(objective.id).count, 20);
    assert.deepEqual(
      db.prepare('SELECT title, due_date FROM marketing_plan_milestones WHERE due_date IS NOT NULL ORDER BY due_date').all().map((row) => ({ ...row })),
      [
        { title: 'Motorola Platinum MDF / AGM clarification', due_date: '2026-09-24' },
        { title: 'YESSS Electrical webinar', due_date: '2026-10-08' },
      ],
    );
    assert.equal(db.prepare('SELECT COUNT(*) count FROM marketing_plan_kpis WHERE objective_id = ? AND target_value IS NULL AND target_status = ?').get(objective.id, 'tbc').count, 4);
  } finally {
    db.close();
  }
});
