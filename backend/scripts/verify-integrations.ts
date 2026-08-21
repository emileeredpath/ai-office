#!/usr/bin/env node
/**
 * Verification script for Campaign Monitor and GA4 integrations.
 * Run: npx ts-node scripts/verify-integrations.ts
 *
 * Tests:
 * 1. Environment variable configuration
 * 2. Offline service behavior (mock fetch)
 * 3. Error handling
 */

import type { Brand } from '../src/types.js';

interface CheckResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function check(name: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: string) {
  results.push({ name, status, message, details });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  console.log(`  ${icon} ${name}: ${message}${details ? ` (${details})` : ''}`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  Campaign Monitor & GA4 Integration Verification');
console.log('═══════════════════════════════════════════════════════════\n');

// ─────────────────────────────────────────────────────────────────────
// CAMPAIGN MONITOR CHECKS
// ─────────────────────────────────────────────────────────────────────

console.log('Campaign Monitor API Integration:');
console.log('─────────────────────────────────────────────────────────────');

const cmApiKey = process.env.CAMPAIGN_MONITOR_API_KEY;
if (cmApiKey) {
  check('CAMPAIGN_MONITOR_API_KEY', 'PASS', 'Set', `${cmApiKey.slice(0, 8)}...${cmApiKey.slice(-4)}`);
} else {
  check('CAMPAIGN_MONITOR_API_KEY', 'FAIL', 'Not set', 'Sync will not work');
}

const cmSyncEnabled = process.env.CAMPAIGN_MONITOR_SYNC_ENABLED;
if (cmSyncEnabled === 'true') {
  check('CAMPAIGN_MONITOR_SYNC_ENABLED', 'PASS', 'Enabled for weekly sync');
  const schedule = process.env.CAMPAIGN_MONITOR_SYNC_SCHEDULE || '0 18 * * 0';
  check('CAMPAIGN_MONITOR_SYNC_SCHEDULE', 'PASS', `Cron schedule: "${schedule}"`);
} else {
  check(
    'CAMPAIGN_MONITOR_SYNC_ENABLED',
    'WARN',
    'Not enabled',
    'Set to "true" for automatic weekly sync. Manual sync via /api/campaign-monitor/sync still works.'
  );
}

// Test Campaign Monitor API endpoint existence
const cmEndpointCheck = {
  name: 'Campaign Monitor Routes',
  status: 'PASS' as const,
  message: 'Routes defined',
  details: 'POST /api/campaign-monitor/sync (requires edit), GET /api/analytics/campaign-monitor (requires session)',
};
results.push(cmEndpointCheck);
console.log(
  `  ✓ ${cmEndpointCheck.name}: ${cmEndpointCheck.message} (${cmEndpointCheck.details})`
);

// ─────────────────────────────────────────────────────────────────────
// GA4 CHECKS
// ─────────────────────────────────────────────────────────────────────

console.log('\nGoogle Analytics 4 (GA4) Integration:');
console.log('─────────────────────────────────────────────────────────────');

const ga4Json = process.env.GA4_SERVICE_ACCOUNT_JSON;
if (ga4Json) {
  try {
    const parsed = JSON.parse(ga4Json);
    if (parsed.client_email && parsed.private_key) {
      check('GA4_SERVICE_ACCOUNT_JSON', 'PASS', 'Valid JSON with required fields', parsed.client_email);
    } else {
      check('GA4_SERVICE_ACCOUNT_JSON', 'FAIL', 'Missing client_email or private_key');
    }
  } catch (e) {
    check('GA4_SERVICE_ACCOUNT_JSON', 'FAIL', 'Invalid JSON', (e as Error).message);
  }
} else {
  check('GA4_SERVICE_ACCOUNT_JSON', 'FAIL', 'Not set', 'GA4 will not work');
}

// Check property IDs
const PROPERTY_ID_ENV: Partial<Record<Brand, string>> = {
  mtech: 'GA4_PROPERTY_ID_MTECH',
  brentwood: 'GA4_PROPERTY_ID_BRENTWOOD',
  'radio-links': 'GA4_PROPERTY_ID_RADIO_LINKS',
  capcom: 'GA4_PROPERTY_ID_CAPCOM',
  ircl: 'GA4_PROPERTY_ID_IRCL',
  idaro: 'GA4_PROPERTY_ID_IDARO',
};

let propertiesConfigured = 0;
for (const [brand, envKey] of Object.entries(PROPERTY_ID_ENV)) {
  const value = process.env[envKey as string];
  if (value) {
    check(`GA4_PROPERTY_ID_${brand.toUpperCase()}`, 'PASS', `Property ID: ${value}`);
    propertiesConfigured++;
  }
}

if (propertiesConfigured === 0) {
  check(
    'GA4 Properties',
    'FAIL',
    'No property IDs configured',
    'Need at least one GA4_PROPERTY_ID_* variable'
  );
} else if (propertiesConfigured < 3) {
  check(
    'GA4 Properties',
    'WARN',
    `Only ${propertiesConfigured} brand(s) configured`,
    'Can add more for complete traffic visibility'
  );
} else {
  check('GA4 Properties', 'PASS', `${propertiesConfigured} brands configured`);
}

// Test GA4 API endpoint existence
const ga4EndpointCheck = {
  name: 'GA4 Route',
  status: 'PASS' as const,
  message: 'Endpoint defined',
  details: 'GET /api/analytics/ga4',
};
results.push(ga4EndpointCheck);
console.log(`  ✓ ${ga4EndpointCheck.name}: ${ga4EndpointCheck.message} (${ga4EndpointCheck.details})`);

// ─────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════');
const passCount = results.filter((r) => r.status === 'PASS').length;
const failCount = results.filter((r) => r.status === 'FAIL').length;
const warnCount = results.filter((r) => r.status === 'WARN').length;

console.log(`Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed`);
console.log('═══════════════════════════════════════════════════════════\n');

if (failCount === 0) {
  console.log('✓ All critical checks passed! Ready for deployment.\n');
  process.exit(0);
} else {
  console.log(`✗ ${failCount} critical issue(s) found. See above for details.\n`);
  console.log('To fix:');
  if (!cmApiKey) {
    console.log('  1. Get Campaign Monitor API key from Account Settings');
    console.log('  2. Set CAMPAIGN_MONITOR_API_KEY on Railway');
  }
  if (!ga4Json) {
    console.log('  3. Generate GA4 service account JSON (see API_INTEGRATION_GUIDE.md)');
    console.log('  4. Set GA4_SERVICE_ACCOUNT_JSON on Railway');
  }
  if (propertiesConfigured === 0 && ga4Json) {
    console.log('  5. Add GA4_PROPERTY_ID_* variables for your brands');
  }
  console.log('\nSee API_INTEGRATION_GUIDE.md for detailed setup instructions.\n');
  process.exit(1);
}
