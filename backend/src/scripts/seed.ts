// One-time seed: populates the shared database with the real campaigns and
// tasks that used to live only in seed data baked into the frontend bundle
// (and, before that, in Emilee's browser localStorage). Safe to run more
// than once — it skips entirely if the campaigns table is already non-empty,
// so it never overwrites real data created afterwards via the dashboard or
// Claude.
import { getAllCampaigns, insertCampaign, recalculateCampaignSpend } from '../db/campaignRepository.js';
import { getAllTasks, insertTask } from '../db/taskRepository.js';
import db from '../db/connection.js';
import type { TaskRecord } from '../types.js';

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
    source: 'seed',
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

const seedCampaigns = [
  {
    id: 'campaign-0',
    name: 'Q3 Education Campaign',
    brand: 'mtech' as const,
    entities: ['mtech' as const],
    primaryIndustry: 'Education',
    secondaryIndustry: 'Marketing',
    theme: 'Q3 education initiative',
    status: 'active' as const,
    startDate: '2026-08-15',
    endDate: '2026-08-31',
    budget: 30000,
    spend: 0,
    conversions: 0,
    leads: 0,
    engagement: 0,
    colour: '#8B5CF6',
    schedule: [
      { id: 'sched-001', date: '2026-08-15', element: 'Email launch', status: 'scheduled', taskId: 'task-23' },
      { id: 'sched-002', date: '2026-08-20', element: 'Social campaign', status: 'planning', taskId: 'task-24' },
      { id: 'sched-003', date: '2026-08-25', element: 'Landing page live', status: 'planning', taskId: 'task-25' },
      { id: 'sched-004', date: '2026-08-29', element: 'PPC review & adjust', status: 'planning', taskId: 'task-26' },
    ],
  },
  {
    id: 'campaign-1',
    name: 'PPC Campaign Restructure',
    brand: 'brentwood' as const,
    entities: ['brentwood' as const],
    primaryIndustry: 'B2B Communications',
    secondaryIndustry: 'Digital Marketing',
    theme: 'Performance optimization',
    status: 'active' as const,
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    budget: 50000,
    spend: 18500,
    conversions: 42,
    leads: 156,
    engagement: 3.8,
    colour: '#3B82F6',
  },
  {
    id: 'campaign-2',
    name: 'Account Manager Email Programme',
    brand: 'brentwood' as const,
    entities: ['brentwood' as const, 'radio-links' as const, 'capcom' as const],
    primaryIndustry: 'Existing Customers',
    secondaryIndustry: 'Business Development',
    theme: 'Relationship nurturing',
    status: 'active' as const,
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    budget: 15000,
    spend: 3200,
    conversions: 18,
    leads: 64,
    engagement: 2.4,
    colour: '#0D1B2A',
  },
  {
    id: 'campaign-3',
    name: 'Brentwood Comms Website Refresh',
    brand: 'brentwood' as const,
    entities: ['brentwood' as const],
    primaryIndustry: 'B2B Communications',
    secondaryIndustry: 'Web Development',
    theme: 'Website modernization',
    status: 'active' as const,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 25000,
    spend: 12800,
    conversions: 31,
    leads: 89,
    engagement: 5.2,
    colour: '#0F6E56',
  },
  {
    id: 'campaign-4',
    name: 'Service & Repair Campaign',
    brand: 'mtech' as const,
    entities: ['brentwood' as const, 'capcom' as const, 'radio-links' as const, 'ircl' as const],
    primaryIndustry: 'Existing Customers',
    secondaryIndustry: 'Service & Repair',
    theme: 'Quarterly service and repair reminder',
    // All four linked sends went out and completed on 29 Jul — see the
    // Campaigns History brief. Completed status is what puts it in the
    // history/archive section of the Campaigns page.
    status: 'completed' as const,
    startDate: '2026-07-29',
    endDate: '2026-07-29',
    budget: null,
    // Left at 0 deliberately — recalculateCampaignSpend sums it from the
    // linked tasks' costs the first time any of them change, same as it
    // would for a campaign created via Claude.
    spend: 0,
    conversions: 0,
    leads: 0,
    engagement: 0,
    colour: '#F97031',
  },
  {
    id: 'campaign--P43-q05Nu',
    name: 'Axon Body Mini BodyCam Campaign',
    brand: 'mtech' as const,
    entities: ['brentwood' as const, 'radio-links' as const, 'capcom' as const, 'ircl' as const],
    primaryIndustry: 'Security',
    secondaryIndustry: 'Facilities Management',
    theme: 'Product launch campaign',
    status: 'planning' as const,
    startDate: '2026-08-01',
    endDate: '2026-09-30',
    budget: null,
    spend: 0,
    conversions: 0,
    leads: 0,
    engagement: 0,
    colour: '#7b6fb0',
  },
];

const seedTasks: TaskRecord[] = [
  task({ id: 'task-1', title: "Martyn's Law — General Email", brand: 'brentwood', createdAt: '2026-07-01' }),
  task({ id: 'task-2', title: 'Account Manager Email — Matt Ellwood-Smith (Radio Links)', brand: 'radio-links', status: 'in-progress', priority: 'high', deadline: '2026-07-23', startDate: '2026-07-20', campaignId: 'campaign-2', createdAt: '2026-07-20' }),
  task({ id: 'task-3', title: 'Account Manager Email — Matt Ellwood-Smith (Capcom)', brand: 'capcom', status: 'in-progress', priority: 'high', deadline: '2026-07-23', startDate: '2026-07-20', campaignId: 'campaign-2', createdAt: '2026-07-20' }),
  task({ id: 'task-4', title: 'Account Manager Email — Alex Bacon', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-23', startDate: '2026-07-20', campaignId: 'campaign-2', createdAt: '2026-07-20', completedAt: '2026-07-22' }),
  task({ id: 'task-5', title: 'S1 Minis Email Campaign', brand: 'brentwood', createdAt: '2026-07-01' }),
  task({ id: 'task-6', title: 'Radio Systems new page', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-07', startDate: '2026-07-01', campaignId: 'campaign-3', createdAt: '2026-07-01', completedAt: '2026-07-07' }),
  task({ id: 'task-7', title: 'Two-Way Radios product cards (6 cards)', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-07', startDate: '2026-07-01', campaignId: 'campaign-3', createdAt: '2026-07-01', completedAt: '2026-07-07' }),
  task({ id: 'task-8', title: 'BC Home Page — reword + banners', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-07', startDate: '2026-07-01', campaignId: 'campaign-3', createdAt: '2026-07-01', completedAt: '2026-07-07' }),
  task({ id: 'task-9', title: 'Capcom Website Banner', brand: 'capcom', createdAt: '2026-07-01' }),
  task({ id: 'task-10', title: 'Review PPC ads — correct messaging', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-25', campaignId: 'campaign-1', createdAt: '2026-07-15', completedAt: '2026-07-25' }),
  task({ id: 'task-11', title: 'PPC Campaign Restructure — Phase 1', brand: 'brentwood', status: 'complete', priority: 'high', startDate: '2026-07-15', campaignId: 'campaign-1', createdAt: '2026-07-15', completedAt: '2026-07-24' }),
  task({ id: 'task-12', title: "Martyn's Law — General Social Post", brand: 'brentwood', createdAt: '2026-07-01' }),
  task({ id: 'task-13', title: 'HSBC Social Posts', brand: 'brentwood', createdAt: '2026-07-01' }),
  task({ id: 'task-14', title: 'Case Study Spreadsheet — keep UTD', brand: 'mtech', status: 'in-progress', priority: 'low', createdAt: '2026-07-01' }),
  task({ id: 'task-15', title: 'Rebrand Case Studies — MTech Branding', brand: 'mtech', createdAt: '2026-07-01' }),
  task({ id: 'task-16', title: 'IRCL — stickers, leaflets, MTech tape', brand: 'ircl', status: 'waiting-john', priority: 'high', deadline: '2026-07-23', startDate: '2026-07-15', createdAt: '2026-07-15', approvalRequired: true, approver: 'john' }),
  task({ id: 'task-17', title: 'VoCoVo pricing update', brand: 'brentwood', status: 'complete', priority: 'high', deadline: '2026-07-04', startDate: '2026-07-01', createdAt: '2026-07-01', completedAt: '2026-07-04' }),
  task({ id: 'task-18', title: 'Update Radio Communications page', brand: 'brentwood', priority: 'high', notes: 'Edits from Climbing Trees CRO report ready to implement', createdAt: '2026-07-27' }),
  task({ id: 'task-19', title: 'Communication Systems page — Climbing Trees CRO fixes', brand: 'brentwood', priority: 'high', createdAt: '2026-07-27' }),
  task({ id: 'task-20', title: 'Edit Education Industry page', brand: 'brentwood', priority: 'high', createdAt: '2026-07-27' }),
  task({ id: 'task-21', title: 'Service and Repair Email Campaign — All Brands (Quarterly)', brand: 'mtech', priority: 'high', createdAt: '2026-07-27' }),
  task({ id: 'task-22', title: 'Review Calendly vs Microsoft Bookings', brand: 'mtech', createdAt: '2026-07-27' }),
  task({ id: 'task-23', title: 'Q3 Education Campaign — MTech Group Email', brand: 'mtech', deadline: '2026-08-15', campaignId: 'campaign-0', scheduleId: 'sched-001', createdAt: '2026-07-27' }),
  task({ id: 'task-24', title: 'Q3 Education Campaign — Social Posts', brand: 'mtech', deadline: '2026-08-20', campaignId: 'campaign-0', scheduleId: 'sched-002', createdAt: '2026-07-27' }),
  task({ id: 'task-25', title: 'Q3 Education Campaign — Update landing page', brand: 'mtech', deadline: '2026-08-25', campaignId: 'campaign-0', scheduleId: 'sched-003', createdAt: '2026-07-27' }),
  task({ id: 'task-26', title: 'Q3 Education Campaign — Landing page PPC review', brand: 'mtech', deadline: '2026-08-29', campaignId: 'campaign-0', scheduleId: 'sched-004', createdAt: '2026-07-27' }),
  task({ id: 'task-27', title: 'Account Manager Email — Garreth Breen', brand: 'ircl', status: 'complete', startDate: '2026-07-02', createdAt: '2026-07-02', completedAt: '2026-07-05' }),
  task({ id: 'task-28', title: 'Account Manager Email — Sue Gunnell', brand: 'brentwood', status: 'complete', startDate: '2026-07-02', campaignId: 'campaign-2', createdAt: '2026-07-02', completedAt: '2026-07-06' }),
  task({ id: 'task-29', title: 'Account Manager Email — Sateen Baxter', brand: 'radio-links', status: 'complete', startDate: '2026-07-08', campaignId: 'campaign-2', createdAt: '2026-07-08', completedAt: '2026-07-11' }),
  task({ id: 'task-30', title: 'YESSS Electrical email — Lydia', brand: 'brentwood', status: 'complete', startDate: '2026-07-03', createdAt: '2026-07-03', completedAt: '2026-07-09' }),
  task({ id: 'task-31', title: 'Vistry email — Lydia', brand: 'brentwood', status: 'complete', startDate: '2026-07-10', createdAt: '2026-07-10', completedAt: '2026-07-15' }),
  task({ id: 'task-32', title: 'BC Home Page banner — live', brand: 'brentwood', status: 'complete', startDate: '2026-07-16', campaignId: 'campaign-3', createdAt: '2026-07-16', completedAt: '2026-07-19' }),
  task({ id: 'task-33', title: 'Duke of York case study', brand: 'brentwood', status: 'complete', startDate: '2026-07-05', createdAt: '2026-07-05', completedAt: '2026-07-14' }),
  task({ id: 'task-34', title: 'Hire Stickers — James Smart', brand: 'brentwood', status: 'complete', startDate: '2026-07-12', createdAt: '2026-07-12', completedAt: '2026-07-17' }),
  task({ id: 'task-35', title: 'HSBC Social Posts', brand: 'brentwood', status: 'complete', startDate: '2026-07-01', createdAt: '2026-07-01', completedAt: '2026-07-06' }),
  task({ id: 'task-36', title: 'IRCL — stickers, leaflets, MTech tape', brand: 'ircl', status: 'complete', priority: 'high', startDate: '2026-06-25', createdAt: '2026-06-25', completedAt: '2026-07-02' }),
  // Service and Repair Email Campaign — quarterly per-brand sends (Calendar Improvements brief)
  task({ id: 'task-37', title: 'Service and Repair Email — Brentwood', brand: 'brentwood', status: 'complete', deadline: '2026-07-29', startDate: '2026-07-29', campaignId: 'campaign-4', createdAt: '2026-07-29', completedAt: '2026-07-29', notes: 'SENT 29 Jul 2026 — 6,044 recipients — £72.73 (converted from $96.68 @ ~£0.7524/USD)', type: 'email-send', recipients: 6044, subject: 'Service & Repair — Brentwood', cost: 72.73, currency: 'GBP' }),
  task({ id: 'task-38', title: 'Service and Repair Email — Capcom', brand: 'capcom', status: 'complete', deadline: '2026-07-29', startDate: '2026-07-29', campaignId: 'campaign-4', createdAt: '2026-07-29', completedAt: '2026-07-29', notes: 'SENT 29 Jul 2026 — 1,554 recipients — £22.05 (converted from $29.30 @ ~£0.7524/USD)', type: 'email-send', recipients: 1554, subject: 'Service & Repair — Capcom', cost: 22.05, currency: 'GBP' }),
  task({ id: 'task-39', title: 'Service and Repair Email — Radio Links', brand: 'radio-links', status: 'complete', deadline: '2026-07-29', startDate: '2026-07-29', campaignId: 'campaign-4', createdAt: '2026-07-29', completedAt: '2026-07-29', notes: 'SENT 29 Jul 2026 — 1,464 recipients — £21.04 (converted from $27.96 @ ~£0.7524/USD)', type: 'email-send', recipients: 1464, subject: 'Service & Repair — Radio Links', cost: 21.04, currency: 'GBP' }),
  task({ id: 'task-40', title: 'Service and Repair Email — IRCL', brand: 'ircl', status: 'complete', deadline: '2026-07-29', startDate: '2026-07-29', campaignId: 'campaign-4', createdAt: '2026-07-29', completedAt: '2026-07-29', notes: 'SENT 29 Jul 2026 — 243 recipients — £7.26 (converted from $9.65 @ ~£0.7524/USD)', type: 'email-send', recipients: 243, subject: 'Service & Repair — IRCL', cost: 7.26, currency: 'GBP' }),
  // IDARO's send is deliberately not linked to campaign-4 — it's tracked as
  // a standalone item, per the brief.
  task({ id: 'task-41', title: 'Service and Repair Email — IDARO', brand: 'idaro', status: 'complete', deadline: '2026-07-29', startDate: '2026-07-29', createdAt: '2026-07-29', completedAt: '2026-07-29', notes: 'SENT 29 Jul 2026 — 51 recipients — £5.09 (converted from $6.77 @ ~£0.7524/USD)', type: 'email-send', recipients: 51, subject: 'Service & Repair — IDARO', cost: 5.09, currency: 'GBP' }),
  // Axon Body Mini BodyCam Campaign tasks
  task({ id: 'task-whbVHjbCq4', title: 'Send Axon BodyCam Google Ads brief to Climbing Trees', brand: 'mtech', status: 'complete', priority: 'high', deadline: '2026-07-31', startDate: '2026-07-25', campaignId: 'campaign--P43-q05Nu', createdAt: '2026-07-25', completedAt: '2026-07-31' }),
  task({ id: 'task-UO5sYyhOcm', title: 'Axon BodyCam - Capcom landing page optimization', brand: 'capcom', status: 'not-started', priority: 'medium', deadline: '2026-08-14', campaignId: 'campaign--P43-q05Nu', createdAt: '2026-08-04' }),
  task({ id: 'task-AVCj_ma5a7', title: 'Axon BodyCam - Radio Links landing page optimization', brand: 'radio-links', status: 'not-started', priority: 'medium', deadline: '2026-08-14', campaignId: 'campaign--P43-q05Nu', createdAt: '2026-08-04' }),
  task({ id: 'task-EU5sYyhOcm', title: 'Axon BodyCam - Brentwood landing page optimization', brand: 'brentwood', status: 'not-started', priority: 'medium', deadline: '2026-08-14', campaignId: 'campaign--P43-q05Nu', createdAt: '2026-08-04' }),
  task({ id: 'task--PsDnsOuDU', title: 'Axon BodyCam - Keyword research & landing page review (Climbing Trees)', brand: 'brentwood', status: 'not-started', priority: 'medium', deadline: '2026-08-15', campaignId: 'campaign--P43-q05Nu', createdAt: '2026-08-04' }),
];

export function runSeed() {
  if (getAllCampaigns().length > 0 || getAllTasks().length > 0) {
    console.log('Seed skipped — database already has campaigns or tasks.');
    return;
  }

  for (const campaign of seedCampaigns) insertCampaign(campaign);
  for (const t of seedTasks) insertTask(t);

  // insertTask() doesn't recompute campaign spend itself (only the
  // actionService path does, since that's what create_task/update_task go
  // through) — do it once here so a fresh database starts with correct totals.
  const campaignIdsWithCosts = new Set(seedTasks.filter((t) => t.cost != null && t.campaignId).map((t) => t.campaignId!));
  for (const campaignId of campaignIdsWithCosts) recalculateCampaignSpend(campaignId);

  console.log(`Seeded ${seedCampaigns.length} campaigns and ${seedTasks.length} tasks.`);
}

// Populate schedule items for campaigns (runs even if database already seeded)
export function ensureScheduleItems() {
  const campaigns = getAllCampaigns();

  for (const campaign of campaigns) {
    // Check if campaign already has schedule items
    if (campaign.schedule && campaign.schedule.length > 0) {
      continue;
    }

    // Add schedule items based on campaign
    let scheduleItems: any[] = [];

    if (campaign.id === 'campaign-0') {
      // Q3 Education Campaign
      scheduleItems = [
        { id: 'sched-001', date: '2026-08-05', element: 'Strategy finalized', status: 'planning' },
        { id: 'sched-002', date: '2026-08-07', element: 'PPC brief to Climbing Trees', status: 'planning' },
        { id: 'sched-003', date: '2026-08-10', element: 'Email templates due, social teasers live', status: 'planning' },
        { id: 'sched-004', date: '2026-08-12', element: '**WAVE 1 LAUNCH** — Email + PPC + social', status: 'planning' },
        { id: 'sched-005', date: '2026-08-15', element: 'All 8 landing pages LIVE + tracking', status: 'planning' },
        { id: 'sched-006', date: '2026-08-20', element: '**WAVE 2 LAUNCH** — Email + PPC shift + social', status: 'planning' },
        { id: 'sched-007', date: '2026-08-31', element: '**FINAL REVIEW** vs 50-goal', status: 'planning' },
      ];
    } else if (campaign.id === 'campaign--P43-q05Nu') {
      // Axon Body Mini BodyCam Campaign
      scheduleItems = [
        { id: 'sched-axon-001', date: '2026-07-31', element: 'Google Ads brief sent to Climbing Trees', status: 'complete' },
        { id: 'sched-axon-002', date: '2026-08-14', element: 'Landing page optimizations due', status: 'in-progress' },
        { id: 'sched-axon-003', date: '2026-08-15', element: 'Keyword research & review complete', status: 'planning' },
        { id: 'sched-axon-004', date: '2026-08-30', element: 'Campaign launch', status: 'planning' },
      ];
    }

    if (scheduleItems.length > 0) {
      // Update campaign with schedule items
      db.prepare(
        'UPDATE campaigns SET schedule = ? WHERE id = ?'
      ).run(JSON.stringify(scheduleItems), campaign.id);
      console.log(`Added ${scheduleItems.length} schedule items to campaign ${campaign.id}`);
    }
  }
}

// Runs on import — both `npm run seed` (standalone) and server.ts (on every
// boot) trigger this; it's a no-op once the database has any real data.
runSeed();
ensureScheduleItems();
