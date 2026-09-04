// Preview-only sample data for the dashboard-v2 Railway preview service.
//
// This is intentionally separate from scripts/seed.ts (the real seed that
// already runs unconditionally on every boot) — it never modifies or reads
// anything seed.ts created, and every record it inserts uses a `preview-`
// prefixed id so it's trivially identifiable and safe to run repeatedly.
//
// Safety: this script does nothing at all unless BOTH are true:
//   1. PREVIEW_SEED_ENABLED === 'true'
//   2. DATABASE_PATH contains "/preview/" (case-sensitive, matches the
//      recommended preview volume path e.g. /data/preview/ai-office.db)
// Either condition failing is treated as "this is not a preview database" —
// the script logs why it skipped and returns immediately. The two checks
// are deliberately independent: a flag can be copy-pasted into the wrong
// service's env vars, and a path can be misconfigured, but both would have
// to be wrong together for this to run somewhere it shouldn't.
import { getCampaignById, insertCampaign, archiveCampaign } from '../db/campaignRepository.js';
import { getAllTasks, insertTask } from '../db/taskRepository.js';
import { getFundingRecordById, insertFundingRecord } from '../db/fundingRepository.js';
import db from '../db/connection.js';
import type { TaskRecord } from '../types.js';

const PREVIEW_CAMPAIGN_IDS = [
  'preview-campaign-brentwood-1',
  'preview-campaign-radio-links-1',
  'preview-campaign-capcom-1',
  'preview-campaign-ircl-1',
] as const;

const PREVIEW_FUNDING_IDS = [
  'preview-funding-brentwood-1',
  'preview-funding-radio-links-1',
  'preview-funding-capcom-1',
  'preview-funding-ircl-1',
] as const;

const PREVIEW_TASK_IDS = [
  'preview-task-overdue-1',
  'preview-task-waiting-approval-1',
  'preview-task-due-soon-1',
  'preview-task-upcoming-1',
  'preview-task-upcoming-2',
] as const;

const PREVIEW_AUDIT_IDS = [
  'preview-audit-1',
  'preview-audit-2',
  'preview-audit-3',
  'preview-audit-4',
] as const;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysFromNowDateOnly(days: number): string {
  return daysFromNow(days).split('T')[0];
}

function task(overrides: Partial<TaskRecord> & Pick<TaskRecord, 'id' | 'title' | 'brand'>): TaskRecord {
  return {
    notes: '',
    status: 'not-started',
    priority: 'medium',
    deadline: null,
    startDate: null,
    campaignId: null,
    scheduleId: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
    previousStatus: null,
    history: [],
    approvalRequired: false,
    approver: null,
    blockerReason: null,
    lastBriefGenerated: null,
    source: 'preview-seed',
    sourceConversationId: null,
    assignedTo: null,
    type: 'task',
    recipients: null,
    subject: null,
    cost: null,
    currency: null,
    externalId: null,
    opens: null,
    clicks: null,
    openRate: null,
    clickRate: null,
    bounces: null,
    unsubscribes: null,
    ...overrides,
  };
}

function insertAuditEntry(entry: {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  newValue: Record<string, unknown>;
  createdAt: string;
}) {
  const existing = db.prepare('SELECT id FROM audit_log WHERE id = ?').get(entry.id);
  if (existing) return;

  db.prepare(
    `INSERT INTO audit_log (
      id, action, resource_type, resource_id, previous_value, new_value,
      source, source_conversation_id, request_id, confirmed, automatic, created_at
    ) VALUES (@id, @action, @resourceType, @resourceId, NULL, @newValue,
      'preview-seed', NULL, NULL, 1, 0, @createdAt)`
  ).run({
    id: entry.id,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    newValue: JSON.stringify(entry.newValue),
    createdAt: entry.createdAt,
  });
}

export function runPreviewSeed() {
  const enabled = process.env.PREVIEW_SEED_ENABLED === 'true';
  const dbPath = process.env.DATABASE_PATH || '';
  const looksLikePreviewPath = dbPath.includes('/preview/');

  if (!enabled) {
    console.log('[preview-seed] Skipped — PREVIEW_SEED_ENABLED is not "true".');
    return;
  }
  if (!looksLikePreviewPath) {
    console.log(
      `[preview-seed] Skipped — DATABASE_PATH ("${dbPath}") does not contain "/preview/". ` +
        'Refusing to run against what does not look like a preview database.'
    );
    return;
  }

  if (getCampaignById(PREVIEW_CAMPAIGN_IDS[0])) {
    console.log('[preview-seed] Skipped — preview sample data already present.');
    return;
  }

  // --- Campaigns: one per entity, covering active/planning/completed ---
  insertCampaign({
    id: 'preview-campaign-brentwood-1',
    name: 'Preview — Brentwood Spring Radio Refresh',
    brand: 'brentwood',
    entities: ['brentwood'],
    primaryIndustry: 'B2B Communications',
    secondaryIndustry: 'Product Launch',
    theme: 'Fictional preview campaign',
    status: 'active',
    startDate: daysFromNowDateOnly(-20),
    endDate: daysFromNowDateOnly(15),
    budget: 18000,
    spend: 9400,
    conversions: 14,
    leads: 34,
    engagement: 2.1,
    colour: '#2E9ECC',
    results: { enquiriesReceived: 12, loggedAt: daysFromNow(-2) },
  });

  insertCampaign({
    id: 'preview-campaign-radio-links-1',
    name: 'Preview — Radio Links Fleet Renewal Push',
    brand: 'radio-links',
    entities: ['radio-links'],
    primaryIndustry: 'Transport & Logistics',
    secondaryIndustry: 'Fleet Renewal',
    theme: 'Fictional preview campaign',
    status: 'planning',
    startDate: daysFromNowDateOnly(10),
    endDate: daysFromNowDateOnly(50),
    budget: 22000,
    spend: 0,
    conversions: 0,
    leads: 0,
    engagement: 0,
    colour: '#4a9d4a',
  });

  insertCampaign({
    id: 'preview-campaign-capcom-1',
    name: 'Preview — Capcom Retailer Partner Programme',
    brand: 'capcom',
    entities: ['capcom'],
    primaryIndustry: 'Retail',
    secondaryIndustry: 'Partner Programme',
    theme: 'Fictional preview campaign',
    status: 'active',
    startDate: daysFromNowDateOnly(-9),
    endDate: daysFromNowDateOnly(21),
    budget: 9500,
    spend: 6200,
    conversions: 9,
    leads: 21,
    engagement: 1.6,
    colour: '#7b6fb0',
    results: { enquiriesReceived: 8, loggedAt: daysFromNow(-1) },
  });

  insertCampaign({
    id: 'preview-campaign-ircl-1',
    name: 'Preview — Irish Radio Coverage Expansion',
    brand: 'ircl',
    entities: ['ircl'],
    primaryIndustry: 'Public Safety',
    secondaryIndustry: 'Coverage Expansion',
    theme: 'Fictional preview campaign',
    status: 'completed',
    startDate: daysFromNowDateOnly(-60),
    endDate: daysFromNowDateOnly(-5),
    budget: 14000,
    spend: 13850,
    conversions: 22,
    leads: 47,
    engagement: 3.4,
    colour: '#5b6472',
    results: { enquiriesReceived: 19, loggedAt: daysFromNow(-5) },
  });

  // These four are fictional demo data, not genuine campaigns — see
  // DATA_INTEGRITY.md's rule that test/seed data must be clearly
  // identifiable and excluded from real reporting. Archiving them
  // immediately keeps every repository's default getAll(includeArchived =
  // false) — what every normal screen uses — excluding them automatically,
  // while they're still there (and un-archivable-back-into-view via their
  // preview- prefix) for exercising Needs Your Attention on a preview
  // deployment.
  for (const id of PREVIEW_CAMPAIGN_IDS) archiveCampaign(id);

  // --- Tasks: a few upcoming items + one example of each existing
  // Needs-Your-Attention rule (overdue, waiting-approval, due-within-48h) ---
  const existingTaskIds = new Set(getAllTasks(true).map((t) => t.id));
  const previewTasks: TaskRecord[] = [
    task({
      id: 'preview-task-overdue-1',
      title: 'Preview — Approve Brentwood radio refresh landing page',
      brand: 'brentwood',
      status: 'in-progress',
      priority: 'high',
      deadline: daysFromNow(-3),
      campaignId: 'preview-campaign-brentwood-1',
    }),
    task({
      id: 'preview-task-waiting-approval-1',
      title: 'Preview — Capcom partner programme email copy',
      brand: 'capcom',
      status: 'waiting-approval',
      priority: 'medium',
      approvalRequired: true,
      approver: 'john',
      campaignId: 'preview-campaign-capcom-1',
    }),
    task({
      id: 'preview-task-due-soon-1',
      title: 'Preview — Radio Links fleet renewal brief sign-off',
      brand: 'radio-links',
      status: 'in-progress',
      priority: 'high',
      deadline: daysFromNow(1),
      campaignId: 'preview-campaign-radio-links-1',
    }),
    task({
      id: 'preview-task-upcoming-1',
      title: 'Preview — Brentwood radio refresh social teaser',
      brand: 'brentwood',
      status: 'not-started',
      priority: 'medium',
      deadline: daysFromNow(6),
      campaignId: 'preview-campaign-brentwood-1',
    }),
    task({
      id: 'preview-task-upcoming-2',
      title: 'Preview — Radio Links fleet renewal launch email',
      brand: 'radio-links',
      status: 'not-started',
      priority: 'medium',
      deadline: daysFromNow(14),
      campaignId: 'preview-campaign-radio-links-1',
    }),
  ];
  for (const t of previewTasks) {
    if (!existingTaskIds.has(t.id)) insertTask(t);
  }

  // --- Funding records: one per entity, two with a claim deadline inside
  // 30 days so the Needs Your Attention funding-expiry rule has real
  // examples to surface ---
  const fundingSeeds: Array<Parameters<typeof insertFundingRecord>[0]> = [
    {
      id: 'preview-funding-brentwood-1',
      brand: 'brentwood',
      vendor: 'Preview Vendor — Hytera',
      schemeName: 'Preview Partner Rebate',
      rebateType: 'marketing-rebate',
      rebatePercent: 5,
      totalPurchases: 84000,
      amountEarned: 4200,
      amountClaimed: 1500,
      claimStatus: 'eligible',
      claimDeadline: daysFromNowDateOnly(18),
      creditedFrequency: 'quarterly',
      period: 'Q3 2026',
      notes: 'Fictional preview record.',
    },
    {
      id: 'preview-funding-radio-links-1',
      brand: 'radio-links',
      vendor: 'Preview Vendor — Motorola',
      schemeName: 'Preview Loyalty Bonus',
      rebateType: 'loyalty-bonus',
      totalPurchases: 61000,
      amountEarned: 6100,
      amountClaimed: 6100,
      claimStatus: 'paid',
      claimDeadline: null,
      creditedFrequency: 'annual',
      period: '2026',
      notes: 'Fictional preview record — fully claimed, should not trigger an alert.',
    },
    {
      id: 'preview-funding-capcom-1',
      brand: 'capcom',
      vendor: 'Preview Vendor — Airsys',
      schemeName: 'Preview Co-fund Scheme',
      rebateType: 'marketing-rebate',
      rebatePercent: 8,
      totalPurchases: 28000,
      amountEarned: 2300,
      amountClaimed: 0,
      claimStatus: 'submitted',
      claimDeadline: daysFromNowDateOnly(9),
      creditedFrequency: 'quarterly',
      period: 'Q3 2026',
      notes: 'Fictional preview record.',
    },
    {
      id: 'preview-funding-ircl-1',
      brand: 'ircl',
      vendor: 'Preview Vendor — Telox',
      schemeName: 'Preview Loyalty Rebate',
      rebateType: 'loyalty-rebate',
      rebatePercent: 6,
      totalPurchases: 30000,
      amountEarned: 1800,
      amountClaimed: 1800,
      claimStatus: 'paid',
      claimDeadline: null,
      creditedFrequency: 'annual',
      period: '2026',
      notes: 'Fictional preview record — fully claimed, should not trigger an alert.',
    },
  ];
  for (const f of fundingSeeds) {
    if (!getFundingRecordById(f.id!)) insertFundingRecord(f);
  }

  // --- Recent activity ---
  insertAuditEntry({
    id: 'preview-audit-1',
    action: 'create',
    resourceType: 'campaign',
    resourceId: 'preview-campaign-brentwood-1',
    newValue: { name: 'Preview — Brentwood Spring Radio Refresh' },
    createdAt: daysFromNow(-2),
  });
  insertAuditEntry({
    id: 'preview-audit-2',
    action: 'create',
    resourceType: 'funding_record',
    resourceId: 'preview-funding-capcom-1',
    newValue: { schemeName: 'Preview Co-fund Scheme' },
    createdAt: daysFromNow(-1),
  });
  insertAuditEntry({
    id: 'preview-audit-3',
    action: 'update',
    resourceType: 'campaign',
    resourceId: 'preview-campaign-capcom-1',
    newValue: { name: 'Preview — Capcom Retailer Partner Programme' },
    createdAt: daysFromNow(-0.5),
  });
  insertAuditEntry({
    id: 'preview-audit-4',
    action: 'complete',
    resourceType: 'task',
    resourceId: 'preview-task-upcoming-1',
    newValue: { title: 'Preview — Irish Radio coverage report signed off' },
    createdAt: daysFromNow(-0.2),
  });

  console.log(
    `[preview-seed] Inserted ${PREVIEW_CAMPAIGN_IDS.length} campaigns, ${PREVIEW_TASK_IDS.length} tasks, ` +
      `${PREVIEW_FUNDING_IDS.length} funding records, ${PREVIEW_AUDIT_IDS.length} audit entries.`
  );
}
