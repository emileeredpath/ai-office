import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'website-improvements-'));
process.env.DATABASE_PATH = join(dir, 'test.db');
const express = (await import('../backend/node_modules/express/index.js')).default;
const { default: router } = await import('../backend/dist/routes/websiteImprovements.js');
const { requireSession, createSession } = await import('../backend/dist/middleware/session.js');
const { default: db } = await import('../backend/dist/db/connection.js');

const app = express();
app.use(express.json());
app.use('/api/website-improvements', requireSession, router);
const server = app.listen(0);
const address = server.address();
const base = `http://127.0.0.1:${address.port}/api/website-improvements`;
const editor = { Cookie: `ai_office_session=${createSession('edit')}`, 'Content-Type': 'application/json' };
const viewer = { Cookie: `ai_office_session=${createSession('view')}`, 'Content-Type': 'application/json' };

test('initial audit recommendations are Suggested and missing page URLs stay absent', async () => {
  const response = await fetch(base, { headers: viewer });
  assert.equal(response.status, 200);
  const { result } = await response.json();
  assert.equal(result.length, 15);
  assert.ok(result.every((row) => row.status === 'Suggested' && row.implemented_on === null));
  assert.equal(result.find((row) => row.id === 'MG-001').page_url, 'https://mtechglobal.co.uk/');
  assert.equal(result.find((row) => row.id === 'CC-001').page_url, null);
  const ppc = await fetch(`${base}?area=ppc`, { headers: viewer });
  assert.deepEqual((await ppc.json()).result.map((row) => row.id).sort(), ['CC-004', 'RL-004']);
});

test('new websites can be added; viewer cannot edit', async () => {
  const input = JSON.stringify({ name: 'Additional site', url: 'https://additional.example/' });
  assert.equal((await fetch(`${base}/sites`, { method: 'POST', headers: viewer, body: input })).status, 403);
  const response = await fetch(`${base}/sites`, { method: 'POST', headers: editor, body: input });
  assert.equal(response.status, 201);
  const { result } = await response.json();
  assert.equal(result.brand, null);
  assert.equal((db.prepare('SELECT COUNT(*) AS count FROM website_sites').get()).count, 6);
});

test('improvement edits are audited and page links cannot leave the selected site', async () => {
  const bad = await fetch(`${base}/MG-001`, { method: 'PATCH', headers: editor, body: JSON.stringify({ pageUrl: 'https://other.example/' }) });
  assert.equal(bad.status, 400);
  const response = await fetch(`${base}/MG-001`, { method: 'PATCH', headers: editor, body: JSON.stringify({ status: 'Planned', baselineStart: '2026-08-01', baselineEnd: '2026-08-28' }) });
  assert.equal(response.status, 200);
  const { result } = await response.json();
  assert.equal(result.status, 'Planned');
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE resource_type = 'website_improvement'").get()).count, 1);
});

test('manual improvement creation starts with no invented measurement', async () => {
  const input = {
    siteId: 'capcom', channel: 'ppc', pageUrl: null, pageType: null, improvementType: 'PPC landing page', title: 'Review trial action', reason: 'Check the relevant commercial page.',
    priority: 'High', status: 'Suggested', implementedOn: null, implementedBy: null,
    baselineStart: null, baselineEnd: null, measurementStart: null, measurementEnd: null,
    confidence: null, competingActivity: null, notes: null,
  };
  const response = await fetch(base, { method: 'POST', headers: editor, body: JSON.stringify(input) });
  assert.equal(response.status, 201);
  const { result } = await response.json();
  assert.match(result.id, /^WI-/);
  assert.equal(result.status, 'Suggested');
  assert.equal(result.channel, 'ppc');
  assert.equal(result.measurement_start, null);
  const ppc = await fetch(`${base}?area=ppc`, { headers: viewer });
  assert.equal((await ppc.json()).result.length, 3);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM audit_log WHERE resource_type = 'website_improvement'").get()).count, 2);
});

test.after(() => { server.close(); db.close(); rmSync(dir, { recursive: true, force: true }); });
