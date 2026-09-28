/**
 * Local/preview-only import of the proposed MTech Marketing Plan 2026/27.
 *
 * Source: MTech_Marketing_Plan_2026_27.xlsx supplied by the user. The source
 * workbook remains untouched. Month-level timings stay month-level; only the
 * two actions with exact source dates receive calendar dates.
 */
export const PLAN_TITLE = 'MTech Marketing Plan 2026/27';

const planEntities = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl'] as const;

const priorities = [
  ['Protect Core Demand', 'Protect demand for established products and services.'],
  ['Win New Customers', 'Create commercially valuable opportunities with new customers.'],
  ['Create New Demand', 'Build awareness and demand for newer offers and growth areas.'],
  ['Grow & Strengthen Existing Customers', 'Help Sales retain and grow existing customer relationships.'],
  ['Supplier Funding & Co-funded Support', 'Review available supplier support and funding each month.'],
] as const;

type PlanMilestone = {
  title: string;
  description: string;
  priority: number;
  periodYear: number;
  month: number | null;
  quarter: number | null;
  status?: 'proposed' | 'in-progress' | 'needs-confirmation';
  startDate?: string;
  dueDate?: string;
  attentionType?: 'decision-required' | 'missing-information';
  notes?: string;
};

export const planMilestones: readonly PlanMilestone[] = [
  { title: 'Body Worn Cameras — Staff Safety', description: 'Proposed activity October to December 2026, with review in January.', priority: 0, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Asset Manager — Existing Customers', description: 'Proposed activity November to December 2026, with review in January.', priority: 3, periodYear: 2026, month: 11, quarter: 4 },
  { title: 'IDARO — Your Radio Can Do More', description: 'Proposed activity October to November 2026, with review in December.', priority: 2, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Education — Back to School', description: 'Preparation May to June and proposed activity July to September 2027, with review in October.', priority: 1, periodYear: 2027, month: 5, quarter: 2 },
  { title: 'Fireworks Radio Hire', description: 'Preparation in August and proposed activity September to October 2027, with review in November.', priority: 0, periodYear: 2027, month: 8, quarter: 3 },
  { title: 'Christmas and New Year Radio Hire', description: 'Proposed activity October 2026 to January 2027, with review in January.', priority: 0, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Customer Growth & Relationship Programme', description: 'Proposed always-on programme across the 2026/27 financial year.', priority: 3, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Customer Re-engagement', description: 'Proposed preparation in December and May, activity in January and June, and reviews in February and July.', priority: 3, periodYear: 2026, month: 12, quarter: 4 },
  { title: 'MTech AI — Manufacturing', description: 'Proposed activity April to June 2027.', priority: 2, periodYear: 2027, month: 4, quarter: 2 },
  { title: 'Google Ads', description: 'Proposed always-on paid search activity.', priority: 0, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'SEO and Website CRO', description: 'Proposed always-on Brentwood website activity.', priority: 0, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Case Studies and Customer Proof', description: 'Proposed always-on customer proof programme.', priority: 3, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'Trade and Customer Events', description: 'Proposed events programme; individual event dates require confirmation.', priority: 1, periodYear: 2026, month: 10, quarter: 4 },
  { title: 'YESSS Electrical webinar', description: 'Webinar listed in the source plan for 8 October 2026.', priority: 1, periodYear: 2026, month: 10, quarter: 4, status: 'in-progress', startDate: '2026-10-08', dueDate: '2026-10-08' },
  { title: 'Motorola Platinum MDF / AGM clarification', description: 'Urgent supplier funding action awaiting clarification.', priority: 4, periodYear: 2026, month: 9, quarter: 3, status: 'needs-confirmation', startDate: '2026-09-24', dueDate: '2026-09-24', attentionType: 'missing-information' },
  { title: 'Confirm revenue and growth target', description: 'Management confirmation required.', priority: 1, periodYear: 2026, month: null, quarter: null, status: 'needs-confirmation', attentionType: 'decision-required' },
  { title: 'Confirm marketing lead and pipeline targets', description: 'Management confirmation required.', priority: 1, periodYear: 2026, month: null, quarter: null, status: 'needs-confirmation', attentionType: 'decision-required' },
  { title: 'Confirm final priority sectors', description: 'Management confirmation required.', priority: 1, periodYear: 2026, month: null, quarter: null, status: 'needs-confirmation', attentionType: 'decision-required' },
  { title: 'Confirm marketing budget', description: 'Management confirmation required.', priority: 4, periodYear: 2026, month: null, quarter: null, status: 'needs-confirmation', attentionType: 'decision-required' },
  { title: 'Confirm new and existing customer weighting', description: 'Management confirmation required.', priority: 3, periodYear: 2026, month: null, quarter: null, status: 'needs-confirmation', attentionType: 'decision-required' },
];

function isPreviewDatabase() {
  const normalisedPath = (process.env.DATABASE_PATH || '').replaceAll('\\', '/');
  return process.env.PREVIEW_SEED_ENABLED === 'true' && normalisedPath.includes('/preview/');
}

export async function runMarketingPlan2026PreviewSeed() {
  if (!isPreviewDatabase()) {
    console.log('[marketing-plan-preview-seed] Skipped — preview flag and preview database path are both required.');
    return { status: 'skipped' as const };
  }

  // Load the database only after the two safety checks have passed. This
  // prevents even database initialisation when the script is misconfigured.
  const {
    createMarketingKpi,
    createMarketingMilestone,
    createMarketingObjective,
    createMarketingPlan,
    createMarketingPriority,
    listMarketingPlans,
  } = await import('../db/marketingPlanRepository.js');

  const existing = listMarketingPlans(true).find((plan) => plan.title === PLAN_TITLE && plan.periodYear === 2026);
  if (existing) {
    console.log(`[marketing-plan-preview-seed] Skipped — ${PLAN_TITLE} already exists.`);
    return { status: 'exists' as const, planId: existing.id };
  }

  const plan = createMarketingPlan({
    title: PLAN_TITLE,
    periodYear: 2026,
    status: 'proposed',
    businessDirection: 'Generate a consistent flow of commercially valuable new leads while helping Sales strengthen, retain and grow existing customer relationships — with the long-term aim of making MTech the customer’s preferred sole communications and technology supplier.',
    notes: 'Imported into local preview from the user-supplied workbook. Financial year: October 2026 to September 2027. Proposed for management review; nothing is recorded as approved or committed.',
  });

  const objective = createMarketingObjective({
    planId: plan.id,
    title: 'Generate demand and support profitable customer growth',
    description: plan.businessDirection,
    status: 'proposed',
    priority: 'high',
    periodYear: 2026,
    whyItMatters: 'This connects marketing activity to commercially valuable demand, customer retention and customer growth.',
    commercialRelevance: 'The plan supports new customer acquisition and development of existing customer relationships. Revenue, lead and pipeline targets still require management confirmation.',
    marketingRationale: 'Organise the plan around protecting core demand, winning customers, creating demand and growing existing customers.',
    notes: 'All entities named in the source plan are included. IDARO is treated as a product theme, not as a separate business entity.',
    entities: [...planEntities],
  });

  const createdPriorities = priorities.map(([title, description], sortOrder) => createMarketingPriority({
    objectiveId: objective.id,
    title,
    description,
    status: 'proposed',
    sortOrder,
  }));

  planMilestones.forEach((item, sortOrder) => createMarketingMilestone({
    objectiveId: objective.id,
    priorityId: createdPriorities[item.priority].id,
    level: item.month === null ? 'current-focus' : 'monthly-milestone',
    title: item.title,
    description: item.description,
    status: item.status ?? 'proposed',
    periodYear: item.periodYear,
    quarter: item.quarter,
    month: item.month,
    startDate: item.startDate ?? null,
    dueDate: item.dueDate ?? null,
    attentionType: item.attentionType ?? null,
    sortOrder,
    notes: item.notes ?? (item.startDate ? 'Exact date supplied in the source workbook.' : 'Month-level timing only; no exact date has been invented.'),
  }));

  ['marketing-leads', 'opportunities', 'open-pipeline', 'won-revenue'].forEach((kpiKey, sortOrder) => createMarketingKpi({
    objectiveId: objective.id,
    kpiKey,
    targetValue: null,
    targetStatus: 'tbc',
    targetDirection: 'increase',
    periodScope: 'objective',
    sortOrder,
    notes: 'Target value requires management confirmation in the source plan.',
  }));

  console.log(`[marketing-plan-preview-seed] Created proposed plan ${plan.id} with ${planMilestones.length} milestones.`);
  return { status: 'created' as const, planId: plan.id };
}

await runMarketingPlan2026PreviewSeed();
