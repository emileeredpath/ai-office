import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'marketing-plan-foundation-'));
process.env.DATABASE_PATH = join(dir, 'test.db');

const express = (await import('../backend/node_modules/express/index.js')).default;
const { default: router } = await import('../backend/dist/routes/marketingPlan.js');
const { requireSession, createSession } = await import('../backend/dist/middleware/session.js');
const { default: db } = await import('../backend/dist/db/connection.js');
const { runMigrations } = await import('../backend/dist/db/migrations.js');

const app = express();
app.use(express.json());
app.use('/api/marketing-plan', requireSession, router);
const server = app.listen(0);
const address = server.address();
const base = `http://127.0.0.1:${address.port}/api/marketing-plan`;
const editor = { Cookie: `ai_office_session=${createSession('edit')}`, 'Content-Type': 'application/json' };
const viewer = { Cookie: `ai_office_session=${createSession('view')}`, 'Content-Type': 'application/json' };

test('numbered migration creates the approved empty Marketing Plan schema once', () => {
  runMigrations(db);
  const migration = db.prepare("SELECT version FROM schema_migrations WHERE version = '20260921_001_marketing_plan_foundation'").get();
  assert.equal(migration.version, '20260921_001_marketing_plan_foundation');
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM schema_migrations WHERE version = '20260921_001_marketing_plan_foundation'").get().count, 1);
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'marketing_plan%'").all().map((row) => row.name).sort();
  assert.deepEqual(tables, [
    'marketing_plan_campaign_links', 'marketing_plan_history', 'marketing_plan_kpis', 'marketing_plan_milestones',
    'marketing_plan_objective_entities', 'marketing_plan_objectives', 'marketing_plan_priorities',
    'marketing_plan_review_evidence', 'marketing_plan_reviews', 'marketing_plans',
  ]);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM marketing_plans').get().count, 0);
});

test('reads require a session and view-only sessions cannot write', async () => {
  assert.equal((await fetch(`${base}/plans`)).status, 401);
  assert.equal((await fetch(`${base}/plans`, { headers: viewer })).status, 200);
  const response = await fetch(`${base}/plans`, {
    method: 'POST', headers: viewer, body: JSON.stringify({ title: '2027 plan', periodYear: 2027 }),
  });
  assert.equal(response.status, 403);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM marketing_plans').get().count, 0);
});

test('invalid and unknown values are rejected rather than filled or guessed', async () => {
  const invalid = await fetch(`${base}/plans`, {
    method: 'POST', headers: editor, body: JSON.stringify({ title: '', periodYear: 2027, status: 'on-track' }),
  });
  assert.equal(invalid.status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM marketing_plans').get().count, 0);
});

let planId;
let objectiveId;

test('an editor can create an empty-evidence plan and multi-entity objective', async () => {
  const planResponse = await fetch(`${base}/plans`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ title: 'MTech marketing plan', periodYear: 2027, status: 'draft' }),
  });
  assert.equal(planResponse.status, 201);
  const plan = (await planResponse.json()).result;
  planId = plan.id;
  assert.equal(plan.businessDirection, '');
  assert.equal(plan.nextReviewDate, null);

  const objectiveResponse = await fetch(`${base}/objectives`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({
      planId, title: 'Increase relevant demand', periodYear: 2027, priority: 'tbc',
      entities: ['mtech', 'brentwood', 'radio-links'],
    }),
  });
  assert.equal(objectiveResponse.status, 201);
  const objective = (await objectiveResponse.json()).result;
  objectiveId = objective.id;
  assert.deepEqual(objective.entities, ['brentwood', 'mtech', 'radio-links']);
  assert.equal(objective.quarter, null);
  assert.equal(objective.commercialRelevance, '');
});

test('edits, entity replacement and archival remain auditable and reversible', async () => {
  const editResponse = await fetch(`${base}/objectives/${objectiveId}`, {
    method: 'PATCH', headers: editor,
    body: JSON.stringify({ entities: ['capcom'], status: 'proposed', reason: 'Scope agreed for review' }),
  });
  assert.equal(editResponse.status, 200);
  const edited = (await editResponse.json()).result;
  assert.deepEqual(edited.entities, ['capcom']);
  assert.equal(edited.status, 'proposed');

  assert.equal((await fetch(`${base}/objectives/${objectiveId}/archive`, { method: 'POST', headers: viewer, body: '{}' })).status, 403);
  const archivedResponse = await fetch(`${base}/objectives/${objectiveId}/archive`, {
    method: 'POST', headers: editor, body: JSON.stringify({ reason: 'Superseded in planning review' }),
  });
  assert.equal(archivedResponse.status, 200);
  assert.equal((await archivedResponse.json()).result.archived, true);

  const history = (await (await fetch(`${base}/history/objective/${objectiveId}`, { headers: viewer })).json()).result;
  assert.deepEqual(history.map((entry) => entry.action), ['archive', 'edit', 'create']);
  assert.equal(history[0].reason, 'Superseded in planning review');
  assert.equal(history[1].reason, 'Scope agreed for review');

  const restoreResponse = await fetch(`${base}/objectives/${objectiveId}/restore`, { method: 'POST', headers: editor, body: '{}' });
  assert.equal(restoreResponse.status, 200);
  assert.equal((await restoreResponse.json()).result.archived, false);
  assert.equal((await (await fetch(`${base}/plans/${planId}/objectives`, { headers: viewer })).json()).result.length, 1);
});

test.after(() => {
  server.close();
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
