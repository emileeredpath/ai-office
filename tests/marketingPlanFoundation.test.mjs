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
const { insertCampaign, getCampaignById } = await import('../backend/dist/db/campaignRepository.js');

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

test('objective priorities and milestones use the same edit boundary and retain unknown dates', async () => {
  const priorityInput = JSON.stringify({ objectiveId, title: 'Clarify market priorities', status: 'draft', sortOrder: 0 });
  assert.equal((await fetch(`${base}/priorities`, { method: 'POST', headers: viewer, body: priorityInput })).status, 403);
  const priorityResponse = await fetch(`${base}/priorities`, { method: 'POST', headers: editor, body: priorityInput });
  assert.equal(priorityResponse.status, 201);
  const priority = (await priorityResponse.json()).result;
  const secondPriority = (await (await fetch(`${base}/priorities`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, title: 'Second priority', status: 'draft', sortOrder: 1 }),
  })).json()).result;
  const reorderResponse = await fetch(`${base}/priorities/reorder`, {
    method: 'POST', headers: editor, body: JSON.stringify({ objectiveId, ids: [secondPriority.id, priority.id] }),
  });
  assert.equal(reorderResponse.status, 200);
  assert.deepEqual((await reorderResponse.json()).result.map((item) => item.id), [secondPriority.id, priority.id]);

  const invalidLink = await fetch(`${base}/milestones`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, priorityId: 'not-a-priority', level: 'monthly-milestone', title: 'Invalid link' }),
  });
  assert.equal(invalidLink.status, 400);

  const milestoneResponse = await fetch(`${base}/milestones`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, priorityId: priority.id, level: 'monthly-milestone', title: 'Define the first milestone', periodYear: 2027 }),
  });
  assert.equal(milestoneResponse.status, 201);
  const milestone = (await milestoneResponse.json()).result;
  assert.equal(milestone.dueDate, null);
  assert.equal(milestone.attentionType, null);

  const priorities = (await (await fetch(`${base}/objectives/${objectiveId}/priorities`, { headers: viewer })).json()).result;
  const milestones = (await (await fetch(`${base}/objectives/${objectiveId}/milestones`, { headers: viewer })).json()).result;
  assert.equal(priorities.length, 2);
  assert.deepEqual(priorities.map((item) => item.id), [secondPriority.id, priority.id]);
  assert.equal(milestones.length, 1);
  assert.equal(milestones[0].priorityId, priority.id);
  const history = (await (await fetch(`${base}/objectives/${objectiveId}/history`, { headers: viewer })).json()).result;
  assert.ok(history.some((entry) => entry.resourceType === 'priority' && entry.action === 'create'));
  assert.ok(history.some((entry) => entry.resourceType === 'milestone' && entry.action === 'create'));
  assert.ok(history.some((entry) => entry.resourceType === 'objective' && entry.action === 'reorder-priorities'));
});

test('campaign relationships link existing records without changing or deleting campaigns', async () => {
  const campaign = insertCampaign({
    name: 'Existing campaign', brand: 'mtech', entities: ['mtech'], status: 'active',
    startDate: '2027-01-01', endDate: '2027-03-31',
  });
  const body = JSON.stringify({ objectiveId, campaignId: campaign.id });
  assert.equal((await fetch(`${base}/campaign-links`, { method: 'POST', headers: viewer, body })).status, 403);

  const response = await fetch(`${base}/campaign-links`, { method: 'POST', headers: editor, body });
  assert.equal(response.status, 201);
  const link = (await response.json()).result;
  assert.equal(link.campaignId, campaign.id);
  assert.equal(link.campaign.name, 'Existing campaign');
  assert.equal((await fetch(`${base}/campaign-links`, { method: 'POST', headers: editor, body })).status, 409);

  const links = (await (await fetch(`${base}/objectives/${objectiveId}/campaign-links`, { headers: viewer })).json()).result;
  assert.equal(links.length, 1);
  const strategy = (await (await fetch(`${base}/plans/${planId}/strategy`, { headers: viewer })).json()).result;
  assert.equal(strategy.length, 1);
  assert.equal(strategy[0].objective.id, objectiveId);
  assert.equal(strategy[0].campaignLinks[0].campaignId, campaign.id);
  assert.equal(strategy[0].priorities.length, 2);
  assert.equal(strategy[0].milestones.length, 1);
  assert.equal((await fetch(`${base}/campaign-links/${link.id}`, { method: 'DELETE', headers: viewer })).status, 403);
  assert.equal((await fetch(`${base}/campaign-links/${link.id}`, { method: 'DELETE', headers: editor })).status, 200);
  assert.equal((await (await fetch(`${base}/objectives/${objectiveId}/campaign-links`, { headers: viewer })).json()).result.length, 0);
  assert.equal(getCampaignById(campaign.id).name, 'Existing campaign');
});

test('KPI relationships use only canonical definitions and preserve nulls and genuine zero targets', async () => {
  const registry = (await (await fetch(`${base}/kpis/registry`, { headers: viewer })).json()).result;
  const openPipeline = registry.find((item) => item.key === 'open-pipeline');
  const wonRevenue = registry.find((item) => item.key === 'won-revenue');
  assert.match(openPipeline.definition, /Status Open plus Status New/);
  assert.match(openPipeline.definition, /Stage is never used/);
  assert.equal(openPipeline.destination, 'leads');
  assert.match(wonRevenue.definition, /no trustworthy Won Date/);

  const unknown = await fetch(`${base}/kpis`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, kpiKey: 'invented-kpi', targetValue: 10 }),
  });
  assert.equal(unknown.status, 400);

  const blankProposed = await fetch(`${base}/kpis`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, kpiKey: 'sessions', targetValue: null, targetStatus: 'proposed' }),
  });
  assert.equal(blankProposed.status, 400);

  const tbcBody = JSON.stringify({ objectiveId, kpiKey: 'sessions', targetValue: null, targetStatus: 'tbc' });
  assert.equal((await fetch(`${base}/kpis`, { method: 'POST', headers: viewer, body: tbcBody })).status, 403);
  const tbcResponse = await fetch(`${base}/kpis`, { method: 'POST', headers: editor, body: tbcBody });
  assert.equal(tbcResponse.status, 201);
  const tbcKpi = (await tbcResponse.json()).result;
  assert.equal(tbcKpi.targetValue, null);

  const zeroResponse = await fetch(`${base}/kpis`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, kpiKey: 'google-ads-spend', targetValue: 0, targetStatus: 'approved' }),
  });
  assert.equal(zeroResponse.status, 201);
  const zeroKpi = (await zeroResponse.json()).result;
  assert.equal(zeroKpi.targetValue, 0);
  assert.equal(zeroKpi.targetUnit, 'gbp');

  assert.equal((await fetch(`${base}/kpis`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, kpiKey: 'google-ads-spend', targetValue: 1 }),
  })).status, 409);
  assert.equal((await fetch(`${base}/kpis/${zeroKpi.id}`, {
    method: 'PATCH', headers: editor, body: JSON.stringify({ targetValue: null }),
  })).status, 400);
  const clearResponse = await fetch(`${base}/kpis/${zeroKpi.id}`, {
    method: 'PATCH', headers: editor, body: JSON.stringify({ targetValue: null, targetStatus: 'tbc' }),
  });
  assert.equal(clearResponse.status, 200);
  assert.equal((await clearResponse.json()).result.targetValue, null);

  const kpis = (await (await fetch(`${base}/objectives/${objectiveId}/kpis`, { headers: viewer })).json()).result;
  assert.equal(kpis.length, 2);
  const strategy = (await (await fetch(`${base}/plans/${planId}/strategy`, { headers: viewer })).json()).result;
  assert.equal(strategy[0].kpis.length, 2);
  assert.equal(strategy[0].kpis.find((item) => item.id === zeroKpi.id).targetValue, null);
  assert.equal((await fetch(`${base}/kpis/${tbcKpi.id}`, { method: 'DELETE', headers: viewer })).status, 403);
  assert.equal((await fetch(`${base}/kpis/${tbcKpi.id}`, { method: 'DELETE', headers: editor })).status, 200);
  assert.equal((await fetch(`${base}/kpis/${zeroKpi.id}`, { method: 'DELETE', headers: editor })).status, 200);

  const history = (await (await fetch(`${base}/objectives/${objectiveId}/history`, { headers: viewer })).json()).result;
  assert.ok(history.some((entry) => entry.resourceType === 'objective' && entry.action === 'unlink-campaign'));
  assert.ok(history.some((entry) => entry.resourceType === 'objective' && entry.action === 'unlink-kpi'));
});

test('strategy reviews keep conclusions user-authored and capture explicit evidence states', async () => {
  const body = JSON.stringify({ planId, objectiveId, reviewType: 'quarterly', periodYear: 2027, quarter: 2, reviewDate: '2027-06-30' });
  assert.equal((await fetch(`${base}/reviews`, { method: 'POST', headers: viewer, body })).status, 403);
  const response = await fetch(`${base}/reviews`, { method: 'POST', headers: editor, body });
  assert.equal(response.status, 201);
  const review = (await response.json()).result;
  assert.equal(review.whatHappened, '');
  assert.equal(review.learned, '');
  assert.deepEqual(review.evidence, []);

  const kpiResponse = await fetch(`${base}/kpis`, {
    method: 'POST', headers: editor,
    body: JSON.stringify({ objectiveId, kpiKey: 'website-users', targetValue: 100, targetStatus: 'approved' }),
  });
  const reviewKpi = (await kpiResponse.json()).result;
  const evidence = [{
    objectiveKpiId: reviewKpi.id, kpiKey: 'website-users', targetValue: 100, targetUnit: 'count',
    actualValue: 0, actualDisplay: '0', dataStatus: 'available', trendDisplay: null,
    sourceLabel: 'GA4', measurementStart: '2027-04-01', measurementEnd: '2027-06-30', measurementPeriod: 'Q2 2027',
  }];
  const capture = await fetch(`${base}/reviews/${review.id}/evidence`, { method: 'POST', headers: editor, body: JSON.stringify({ evidence }) });
  assert.equal(capture.status, 200);
  assert.equal((await capture.json()).result[0].actualValue, 0);

  const mismatch = await fetch(`${base}/reviews/${review.id}/evidence`, { method: 'POST', headers: editor, body: JSON.stringify({ evidence: [{ ...evidence[0], kpiKey: 'sessions' }] }) });
  assert.equal(mismatch.status, 400);
  const edited = await fetch(`${base}/reviews/${review.id}`, { method: 'PATCH', headers: editor, body: JSON.stringify({ learned: 'Keep the confirmed lesson.', status: 'complete' }) });
  assert.equal(edited.status, 200);
  assert.equal((await edited.json()).result.learned, 'Keep the confirmed lesson.');
  const listed = (await (await fetch(`${base}/plans/${planId}/reviews`, { headers: viewer })).json()).result;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].evidence[0].actualValue, 0);
  assert.equal((await fetch(`${base}/reviews/${review.id}/archive`, { method: 'POST', headers: editor, body: '{}' })).status, 200);
  assert.equal((await (await fetch(`${base}/plans/${planId}/reviews`, { headers: viewer })).json()).result.length, 0);
});

test.after(() => {
  server.close();
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
