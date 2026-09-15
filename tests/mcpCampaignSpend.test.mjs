import assert from 'node:assert/strict';
import { test } from 'node:test';

// All writes below are regression fixtures in memory, never production MCP.
process.env.DATABASE_PATH = ':memory:';
const { createAiOfficeMcpServer } = await import('../backend/dist/mcp/server.js');
const { Client } = await import('../backend/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js');
const { InMemoryTransport } = await import('../backend/node_modules/@modelcontextprotocol/sdk/dist/esm/inMemory.js');
const { executeAction } = await import('../backend/dist/services/actionService.js');
const { insertCampaign, getCampaignById } = await import('../backend/dist/db/campaignRepository.js');
const { getCampaignCosts } = await import('../backend/dist/db/campaignCostsRepository.js');

test('MCP campaign spend boundary and confirmation behaviour', async t => {
  const campaign = insertCampaign({ id: 'mcp-spend-test', name: 'Regression fixture', brand: 'brentwood', startDate: '2026-09-01', endDate: '2026-09-30', spend: 123 });
  const server = createAiOfficeMcpServer();
  const client = new Client({ name: 'regression-test', version: '1' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  t.after(async () => { await client.close(); await server.close(); });
  const call = args => client.callTool({ name: 'ai_office_update_campaign', arguments: { campaign_id: campaign.id, ...args } });

  await t.test('tool schema excludes actualSpend and rejects stale payload before any write', async () => {
    const tools = await client.listTools();
    const schema = tools.tools.find(tool => tool.name === 'ai_office_update_campaign').inputSchema;
    assert(!Object.hasOwn(schema.properties, 'actualSpend'));
    assert.equal(schema.additionalProperties, false);
    for (const field of ['actualSpend', 'spend']) {
      const result = await call({ [field]: 999, name: 'Must not apply', confirmed: true });
      assert.equal(result.isError, true);
      assert.equal(getCampaignById(campaign.id).spend, 123);
      assert.equal(getCampaignById(campaign.id).name, campaign.name);
    }
  });

  await t.test('action service independently rejects legacy spend, including zero', () => {
    for (const value of [0, 999]) {
      const result = executeAction({ action: 'update_campaign', payload: { campaign_id: campaign.id, actualSpend: value, name: 'Must not apply' }, source: { type: 'claude' }, confirmed: true });
      assert.equal(result.success, false);
      assert.equal(getCampaignById(campaign.id).spend, 123);
      assert.equal(getCampaignById(campaign.id).name, campaign.name);
    }
  });

  await t.test('valid updates still require confirmation and preserve legacy spend', async () => {
    const preview = JSON.parse((await call({ name: 'Approved fixture name' })).content[0].text);
    assert.equal(preview.requires_confirmation, true);
    assert.equal(getCampaignById(campaign.id).name, campaign.name);
    const approved = JSON.parse((await call({ name: 'Approved fixture name', confirmed: true })).content[0].text);
    assert.equal(approved.success, true);
    assert.equal(getCampaignById(campaign.id).name, 'Approved fixture name');
    assert.equal(getCampaignById(campaign.id).spend, 123);
    assert.equal(getCampaignCosts(campaign.id).length, 0);
  });

  await t.test('generic access cannot write spend or access Campaign Costs and sensitive tables', async () => {
    await client.callTool({ name: 'ai_office_update_record', arguments: { entity: 'campaign', id: campaign.id, fields: { spend: 999, actualSpend: 999 }, confirmed: true } });
    assert.equal(getCampaignById(campaign.id).spend, 123);
    for (const entity of ['campaign_costs', 'acumatica_opportunities', 'audit_log']) {
      const result = await client.callTool({ name: 'ai_office_list_records', arguments: { entity } });
      assert.equal(result.isError, true);
    }
  });
});
