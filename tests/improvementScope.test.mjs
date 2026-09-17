import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['src/utils/improvementScope.ts'], bundle: true, platform: 'node', format: 'esm', write: false });
const { getImprovementScope } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);

const sites = [
  { id: 'brentwood-site', brand: 'brentwood' },
  { id: 'capcom-site', brand: 'capcom' },
  { id: 'group-site', brand: 'mtech' },
];
const rows = [
  { id: 'BW-1', site_id: 'brentwood-site' },
  { id: 'CC-1', site_id: 'capcom-site' },
  { id: 'MT-1', site_id: 'group-site' },
];

test('entity selection restricts sites and improvements together', () => {
  const capcom = getImprovementScope(sites, rows, 'capcom', 'all');
  assert.deepEqual(capcom.sites.map((site) => site.id), ['capcom-site']);
  assert.deepEqual(capcom.rows.map((row) => row.id), ['CC-1']);
});

test('a website filter from another entity cannot carry its rows across', () => {
  const capcom = getImprovementScope(sites, rows, 'capcom', 'brentwood-site');
  assert.equal(capcom.selectedSite, 'all');
  assert.deepEqual(capcom.rows.map((row) => row.id), ['CC-1']);
});

test('group retains all mapped sites and unmapped entities stay empty', () => {
  assert.equal(getImprovementScope(sites, rows, 'all', 'all').rows.length, 3);
  const idaro = getImprovementScope(sites, rows, 'idaro', 'all');
  assert.deepEqual(idaro.sites, []);
  assert.deepEqual(idaro.rows, []);
});
