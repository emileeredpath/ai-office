// Generic entity access layer — backs the ai_office_list_records /
// get_record / create_record / update_record / delete_record /
// restore_record / describe_schema MCP tools. Each entity here maps onto an
// existing repository; this file adds no new storage of its own except for
// the field-level validation/description that makes generic access safe.
//
// The bespoke ai_office_create_task / update_campaign / create_tracking_link
// / etc. tools are untouched and keep working exactly as before — this is
// an additional, more general path onto the same tables, not a replacement.
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
  getAllTasks,
  getTaskById,
  insertTask,
  updateTaskRow,
  archiveTask,
  restoreTask,
} from '../db/taskRepository.js';
import {
  getAllCampaigns,
  getCampaignById,
  insertCampaign,
  updateCampaignRow,
  archiveCampaign,
  restoreCampaign,
} from '../db/campaignRepository.js';
import {
  getAllFundingRecords,
  getFundingRecordById,
  insertFundingRecord,
  updateFundingRecordRow,
  archiveFundingRecord,
  restoreFundingRecord,
} from '../db/fundingRepository.js';
import {
  getAllBusinessObjectives,
  getBusinessObjectiveById,
  upsertBusinessObjective,
  archiveBusinessObjective,
  restoreBusinessObjective,
} from '../db/marketingOsRepository.js';
import {
  listQuickCaptureItems,
  getQuickCaptureItemById,
  insertQuickCaptureItem,
  updateQuickCaptureItem,
  archiveQuickCaptureItem,
  restoreQuickCaptureItem,
} from '../db/quickCaptureRepository.js';
import {
  listDocuments,
  getDocumentById,
  insertDocument,
  archiveDocument,
  restoreDocument,
} from '../db/documentRepository.js';
import { getMetricsByCampaignAndDate } from '../db/wave1PerformanceRepository.js';
import db from '../db/connection.js';
import type { TaskRecord, TrackingLink } from '../types.js';

const BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro', 'brentwood-marine'] as const;

export interface EntityFieldDescriptor {
  name: string;
  type: string;
  required: boolean;
  enumValues?: readonly string[];
  description?: string;
}

export interface EntitySchemaDescription {
  entity: string;
  displayName: string;
  writable: boolean;
  supportsArchive: boolean;
  fields: EntityFieldDescriptor[];
  notes?: string;
}

export interface EntityConfig {
  displayName: string;
  writable: boolean;
  supportsArchive: boolean;
  createSchema?: z.ZodTypeAny;
  updateSchema?: z.ZodTypeAny;
  list: (filters: Record<string, unknown>) => unknown[];
  get: (id: string) => unknown;
  create?: (fields: Record<string, unknown>) => unknown;
  update?: (id: string, fields: Record<string, unknown>) => unknown;
  archive?: (id: string) => unknown;
  restore?: (id: string) => unknown;
  schema: EntitySchemaDescription;
}

function field(
  name: string,
  type: string,
  required: boolean,
  opts: { enumValues?: readonly string[]; description?: string } = {}
): EntityFieldDescriptor {
  return { name, type, required, ...opts };
}

// ---------------------------------------------------------------------------
// task
// ---------------------------------------------------------------------------
const TASK_STATUSES = [
  'backlog', 'not-started', 'in-progress', 'waiting-approval', 'waiting-john',
  'waiting-customer', 'approved-ready', 'blocked', 'complete',
] as const;
const TASK_PRIORITIES = ['high', 'medium', 'low'] as const;
const TASK_TYPES = ['task', 'email-send'] as const;

const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  notes: z.string().max(10000).optional(),
  brand: z.enum(BRANDS).optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  deadline: z.string().optional(),
  campaignId: z.string().optional(),
  type: z.enum(TASK_TYPES).optional(),
  recipients: z.number().int().min(0).optional(),
  subject: z.string().max(300).optional(),
  cost: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
});
const taskUpdateSchema = taskCreateSchema.partial();

const taskEntity: EntityConfig = {
  displayName: 'Task',
  writable: true,
  supportsArchive: true,
  createSchema: taskCreateSchema,
  updateSchema: taskUpdateSchema,
  list: (filters) => {
    let tasks = getAllTasks(filters.includeArchived === true);
    if (filters.campaignId) tasks = tasks.filter((t) => t.campaignId === filters.campaignId);
    if (filters.brand) tasks = tasks.filter((t) => t.brand === filters.brand);
    if (filters.status) tasks = tasks.filter((t) => t.status === filters.status);
    return tasks;
  },
  get: (id) => getTaskById(id),
  create: (fields) => {
    const input = fields as z.infer<typeof taskCreateSchema>;
    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: `task-${nanoid(10)}`,
      title: input.title,
      notes: input.notes ?? '',
      brand: input.brand ?? 'mtech',
      status: input.status ?? 'not-started',
      priority: input.priority ?? 'medium',
      deadline: input.deadline ?? null,
      startDate: null,
      campaignId: input.campaignId ?? null,
      scheduleId: null,
      createdAt: now,
      completedAt: null,
      previousStatus: null,
      history: [],
      approvalRequired: false,
      approver: null,
      blockerReason: null,
      lastBriefGenerated: null,
      source: 'claude',
      sourceConversationId: null,
      type: input.type ?? 'task',
      recipients: input.recipients ?? null,
      subject: input.subject ?? null,
      assignedTo: null,
      cost: input.cost ?? null,
      currency: input.currency ?? (input.cost != null ? 'GBP' : null),
      externalId: null,
      opens: null,
      clicks: null,
      openRate: null,
      clickRate: null,
      bounces: null,
      unsubscribes: null,
    };
    insertTask(task);
    return getTaskById(task.id);
  },
  update: (id, fields) => updateTaskRow(id, fields as Partial<TaskRecord>),
  archive: (id) => archiveTask(id),
  restore: (id) => restoreTask(id),
  schema: {
    entity: 'task',
    displayName: 'Task',
    writable: true,
    supportsArchive: true,
    fields: [
      field('title', 'string', true),
      field('notes', 'string', false),
      field('brand', 'enum', false, { enumValues: BRANDS, description: 'Defaults to mtech' }),
      field('status', 'enum', false, { enumValues: TASK_STATUSES, description: 'Defaults to not-started' }),
      field('priority', 'enum', false, { enumValues: TASK_PRIORITIES, description: 'Defaults to medium' }),
      field('deadline', 'ISO date string', false),
      field('campaignId', 'string', false, { description: 'id of a campaign record' }),
      field('type', 'enum', false, { enumValues: TASK_TYPES, description: '"email-send" logs a sent email rather than a general task' }),
      field('recipients', 'number', false, { description: 'Recipient count, for an email-send' }),
      field('subject', 'string', false, { description: 'Email subject line, for an email-send' }),
      field('cost', 'number', false, { description: 'Spend in £' }),
      field('currency', 'string', false, { description: 'Original invoice currency if not GBP, for audit only' }),
    ],
  },
};

// ---------------------------------------------------------------------------
// campaign
// ---------------------------------------------------------------------------
const CAMPAIGN_STATUSES = ['planning', 'active', 'on-hold', 'completed'] as const;

const campaignCreateSchema = z.object({
  name: z.string().trim().min(1).max(300),
  brand: z.enum(BRANDS),
  entities: z.array(z.enum(BRANDS)).optional(),
  primaryIndustry: z.string().max(200).optional(),
  secondaryIndustry: z.string().max(200).optional(),
  theme: z.string().max(200).optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.number().nullable().optional(),
  colour: z.string().max(20).optional(),
  reactive: z.boolean().optional(),
  notes: z.string().max(10000).optional(),
});
const campaignUpdateSchema = campaignCreateSchema.partial();

const campaignEntity: EntityConfig = {
  displayName: 'Campaign',
  writable: true,
  supportsArchive: true,
  createSchema: campaignCreateSchema,
  updateSchema: campaignUpdateSchema,
  list: (filters) => {
    let campaigns = getAllCampaigns(filters.includeArchived === true);
    if (filters.brand) campaigns = campaigns.filter((c) => c.brand === filters.brand);
    if (filters.status) campaigns = campaigns.filter((c) => c.status === filters.status);
    return campaigns;
  },
  get: (id) => getCampaignById(id),
  create: (fields) => insertCampaign(fields as any),
  update: (id, fields) => updateCampaignRow(id, fields as any),
  archive: (id) => archiveCampaign(id),
  restore: (id) => restoreCampaign(id),
  schema: {
    entity: 'campaign',
    displayName: 'Campaign',
    writable: true,
    supportsArchive: true,
    fields: [
      field('name', 'string', true),
      field('brand', 'enum', true, { enumValues: BRANDS }),
      field('entities', 'array of enum', false, { enumValues: BRANDS, description: 'All brands this campaign spans — defaults to [brand]' }),
      field('primaryIndustry', 'string', false),
      field('secondaryIndustry', 'string', false),
      field('theme', 'string', false),
      field('status', 'enum', false, { enumValues: CAMPAIGN_STATUSES, description: 'Defaults to planning' }),
      field('startDate', 'ISO date string', true),
      field('endDate', 'ISO date string', true),
      field('budget', 'number', false),
      field('colour', 'string', false, { description: 'Hex colour, e.g. #3B82F6' }),
      field('reactive', 'boolean', false),
      field('notes', 'string', false),
    ],
    notes: 'Tracking links live on this record — use the "tracking_link" entity (filters.campaignId / fields.campaignId) rather than editing them here.',
  },
};

// ---------------------------------------------------------------------------
// tracking_link — nested on campaigns.trackingLinks, not its own table
// ---------------------------------------------------------------------------
const trackingLinkCreateSchema = z.object({
  campaignId: z.string().min(1),
  entity: z.enum(BRANDS),
  name: z.string().max(200).optional(),
  channel: z.string().trim().min(1).max(100),
  landingPage: z.string().trim().min(1).max(2000),
  utmSource: z.string().trim().min(1).max(200),
  utmMedium: z.string().trim().min(1).max(200),
  utmCampaign: z.string().trim().min(1).max(200),
  utmContent: z.string().max(200).optional(),
});
const trackingLinkUpdateSchema = trackingLinkCreateSchema.partial().extend({ campaignId: z.string().min(1) });

function findTrackingLink(id: string): { campaignId: string; link: TrackingLink } | undefined {
  for (const campaign of getAllCampaigns(true)) {
    const link = (campaign.trackingLinks ?? []).find((l) => l.id === id);
    if (link) return { campaignId: campaign.id, link };
  }
  return undefined;
}

const trackingLinkEntity: EntityConfig = {
  displayName: 'Tracking Link',
  writable: true,
  supportsArchive: true,
  createSchema: trackingLinkCreateSchema,
  updateSchema: trackingLinkUpdateSchema,
  list: (filters) => {
    const campaigns = filters.campaignId
      ? [getCampaignById(filters.campaignId as string)].filter((c): c is NonNullable<typeof c> => !!c)
      : getAllCampaigns(true);
    const includeArchived = filters.includeArchived === true;
    const links: Array<TrackingLink & { campaignId: string }> = [];
    for (const c of campaigns) {
      for (const link of c.trackingLinks ?? []) {
        if (!includeArchived && link.status === 'archived') continue;
        links.push({ ...link, campaignId: c.id });
      }
    }
    return links;
  },
  get: (id) => {
    const found = findTrackingLink(id);
    return found ? { ...found.link, campaignId: found.campaignId } : undefined;
  },
  create: (fields) => {
    const input = fields as z.infer<typeof trackingLinkCreateSchema>;
    const campaign = getCampaignById(input.campaignId);
    if (!campaign) throw new Error(`No campaign found with id ${input.campaignId}.`);
    const newLink: TrackingLink = {
      id: `tracklink-${nanoid(10)}`,
      entity: input.entity,
      name: input.name ?? '',
      channel: input.channel,
      landingPage: input.landingPage,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmContent: input.utmContent ?? null,
    };
    updateCampaignRow(input.campaignId, { trackingLinks: [...(campaign.trackingLinks ?? []), newLink] });
    return { ...newLink, campaignId: input.campaignId };
  },
  update: (id, fields) => {
    const found = findTrackingLink(id);
    if (!found) return undefined;
    const updates = fields as Partial<z.infer<typeof trackingLinkCreateSchema>>;
    const updatedLink: TrackingLink = { ...found.link, ...updates, id };
    const campaign = getCampaignById(found.campaignId)!;
    const trackingLinks = (campaign.trackingLinks ?? []).map((l) => (l.id === id ? updatedLink : l));
    updateCampaignRow(found.campaignId, { trackingLinks });
    return { ...updatedLink, campaignId: found.campaignId };
  },
  archive: (id) => {
    const found = findTrackingLink(id);
    if (!found) return undefined;
    const campaign = getCampaignById(found.campaignId)!;
    const trackingLinks = (campaign.trackingLinks ?? []).map((l) => (l.id === id ? { ...l, status: 'archived' } : l));
    updateCampaignRow(found.campaignId, { trackingLinks });
    return { ...found.link, status: 'archived', campaignId: found.campaignId };
  },
  restore: (id) => {
    const found = findTrackingLink(id);
    if (!found) return undefined;
    const campaign = getCampaignById(found.campaignId)!;
    const trackingLinks = (campaign.trackingLinks ?? []).map((l) => (l.id === id ? { ...l, status: undefined } : l));
    updateCampaignRow(found.campaignId, { trackingLinks });
    return { ...found.link, status: undefined, campaignId: found.campaignId };
  },
  schema: {
    entity: 'tracking_link',
    displayName: 'Tracking Link',
    writable: true,
    supportsArchive: true,
    fields: [
      field('campaignId', 'string', true, { description: 'id of the campaign this link belongs to' }),
      field('entity', 'enum', true, { enumValues: BRANDS }),
      field('name', 'string', false, { description: 'Label, e.g. "Wave 1 Repair – Repair Page"' }),
      field('channel', 'string', true, { description: 'e.g. Email, PPC, Social, Website' }),
      field('landingPage', 'string', true, { description: 'Destination URL without UTM params' }),
      field('utmSource', 'string', true),
      field('utmMedium', 'string', true),
      field('utmCampaign', 'string', true),
      field('utmContent', 'string', false),
    ],
    notes: 'Not a real table — stored as a JSON array on its campaign. list requires filters.campaignId or scans every campaign.',
  },
};

// ---------------------------------------------------------------------------
// funding_record
// ---------------------------------------------------------------------------
const REBATE_TYPES = ['marketing-rebate', 'loyalty-rebate', 'loyalty-bonus', 'other'] as const;
const FUNDING_CLAIM_STATUSES = ['eligible', 'submitted', 'approved', 'paid', 'rejected'] as const;
const bonusTierFieldSchema = z.object({
  id: z.string().optional(),
  threshold: z.number(),
  bonusRate: z.number().nullable().optional(),
  bonusAmount: z.number().nullable().optional(),
  description: z.string().max(500).optional(),
});

const fundingCreateSchema = z.object({
  brand: z.enum(BRANDS),
  vendor: z.string().trim().min(1).max(200),
  schemeName: z.string().trim().min(1).max(200),
  rebateType: z.enum(REBATE_TYPES).optional(),
  rebatePercent: z.number().min(0).max(100).nullable().optional(),
  totalPurchases: z.number().min(0).optional(),
  amountEarned: z.number().min(0).optional(),
  amountClaimed: z.number().min(0).optional(),
  claimStatus: z.enum(FUNDING_CLAIM_STATUSES).optional(),
  claimDeadline: z.string().nullable().optional(),
  creditedFrequency: z.string().max(100).optional(),
  targetSpend: z.number().min(0).nullable().optional(),
  bonusTiers: z.array(bonusTierFieldSchema).optional(),
  period: z.string().max(100).optional(),
  notes: z.string().max(10000).optional(),
});
const fundingUpdateSchema = fundingCreateSchema.partial();

const fundingEntity: EntityConfig = {
  displayName: 'Funding Record',
  writable: true,
  supportsArchive: true,
  createSchema: fundingCreateSchema,
  updateSchema: fundingUpdateSchema,
  list: (filters) => {
    let records = getAllFundingRecords(filters.includeArchived === true);
    if (filters.brand) records = records.filter((r) => r.brand === filters.brand);
    if (filters.claimStatus) records = records.filter((r) => r.claimStatus === filters.claimStatus);
    if (filters.vendor) records = records.filter((r) => r.vendor === filters.vendor);
    return records;
  },
  get: (id) => getFundingRecordById(id),
  create: (fields) => insertFundingRecord(fields as any),
  update: (id, fields) => updateFundingRecordRow(id, fields as any),
  archive: (id) => archiveFundingRecord(id),
  restore: (id) => restoreFundingRecord(id),
  schema: {
    entity: 'funding_record',
    displayName: 'Funding Record',
    writable: true,
    supportsArchive: true,
    fields: [
      field('brand', 'enum', true, { enumValues: BRANDS }),
      field('vendor', 'string', true, { description: 'e.g. XEVA' }),
      field('schemeName', 'string', true, { description: 'e.g. XEVA Rewards' }),
      field('rebateType', 'enum', false, { enumValues: REBATE_TYPES, description: 'Defaults to other' }),
      field('rebatePercent', 'number', false),
      field('totalPurchases', 'number', false, { description: 'Total qualifying purchases in £, defaults 0' }),
      field('amountEarned', 'number', false, { description: 'Defaults 0' }),
      field('amountClaimed', 'number', false, { description: 'Defaults 0' }),
      field('claimStatus', 'enum', false, { enumValues: FUNDING_CLAIM_STATUSES, description: 'Defaults to eligible' }),
      field('claimDeadline', 'ISO date string', false),
      field('creditedFrequency', 'string', false, { description: 'e.g. Quarterly, Auto' }),
      field('targetSpend', 'number', false),
      field('bonusTiers', 'array of {threshold, bonusRate?, bonusAmount?, description?}', false),
      field('period', 'string', false, { description: 'e.g. "Q3 2026"' }),
      field('notes', 'string', false),
    ],
    notes: 'balanceToClaim and percentOfTarget are read-only, derived from the other figures — do not set them directly.',
  },
};

// ---------------------------------------------------------------------------
// business_objective (MarketingOS — headless, no dedicated tab today)
// ---------------------------------------------------------------------------
const OBJECTIVE_STATUSES = ['on-track', 'at-risk', 'off-track'] as const;
const RISK_LEVELS = ['none', 'low', 'medium', 'high'] as const;

const objectiveMetricSchema = z.object({ name: z.string(), value: z.string().optional(), target: z.string().optional() });

const objectiveCreateSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(5000).optional(),
  successStatement: z.string().max(2000).optional(),
  metrics: z.array(objectiveMetricSchema).optional(),
  status: z.enum(OBJECTIVE_STATUSES).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  riskLevel: z.enum(RISK_LEVELS).optional(),
  riskNotes: z.string().max(2000).optional(),
});
const objectiveUpdateSchema = objectiveCreateSchema.partial();

const businessObjectiveEntity: EntityConfig = {
  displayName: 'Business Objective',
  writable: true,
  supportsArchive: true,
  createSchema: objectiveCreateSchema,
  updateSchema: objectiveUpdateSchema,
  list: (filters) => {
    let objectives = getAllBusinessObjectives(filters.includeArchived === true);
    if (filters.status) objectives = objectives.filter((o) => o.status === filters.status);
    return objectives;
  },
  get: (id) => getBusinessObjectiveById(id) ?? undefined,
  create: (fields) => upsertBusinessObjective(fields as any),
  update: (id, fields) => upsertBusinessObjective({ ...(fields as any), id }),
  archive: (id) => archiveBusinessObjective(id) ?? undefined,
  restore: (id) => restoreBusinessObjective(id) ?? undefined,
  schema: {
    entity: 'business_objective',
    displayName: 'Business Objective',
    writable: true,
    supportsArchive: true,
    fields: [
      field('title', 'string', true),
      field('description', 'string', false),
      field('successStatement', 'string', false),
      field('metrics', 'array of {name, value?, target?}', false),
      field('status', 'enum', false, { enumValues: OBJECTIVE_STATUSES, description: 'Defaults to on-track' }),
      field('progressPercentage', 'number 0-100', false),
      field('riskLevel', 'enum', false, { enumValues: RISK_LEVELS, description: 'Defaults to none' }),
      field('riskNotes', 'string', false),
    ],
    notes: 'From the retired MarketingOS screen — no dedicated tab today, but real data used by ai_office_generate_dashboard.',
  },
};

// ---------------------------------------------------------------------------
// quick_capture_item — table existed, unused elsewhere until now
// ---------------------------------------------------------------------------
const captureCreateSchema = z.object({
  type: z.string().trim().min(1).max(50),
  content: z.string().trim().min(1).max(10000),
  category: z.string().max(100).nullable().optional(),
  source: z.string().max(100).nullable().optional(),
});
const captureUpdateSchema = captureCreateSchema.partial();

const quickCaptureEntity: EntityConfig = {
  displayName: 'Quick Capture Item',
  writable: true,
  supportsArchive: true,
  createSchema: captureCreateSchema,
  updateSchema: captureUpdateSchema,
  list: (filters) => {
    let items = listQuickCaptureItems(filters.includeArchived === true);
    if (filters.type) items = items.filter((i) => i.type === filters.type);
    return items;
  },
  get: (id) => getQuickCaptureItemById(id),
  create: (fields) => insertQuickCaptureItem(fields as any),
  update: (id, fields) => updateQuickCaptureItem(id, fields as any),
  archive: (id) => archiveQuickCaptureItem(id),
  restore: (id) => restoreQuickCaptureItem(id),
  schema: {
    entity: 'quick_capture_item',
    displayName: 'Quick Capture Item',
    writable: true,
    supportsArchive: true,
    fields: [
      field('type', 'string', true, { description: 'Free-text category tag, e.g. "idea", "note"' }),
      field('content', 'string', true),
      field('category', 'string', false),
      field('source', 'string', false),
    ],
    notes: 'No dedicated tab today — table existed but was unused before generic access wired it up.',
  },
};

// ---------------------------------------------------------------------------
// document — generic attachment, entity_type/record_id point at any record
// ---------------------------------------------------------------------------
const documentCreateSchema = z
  .object({
    entityType: z.string().trim().min(1),
    recordId: z.string().trim().min(1),
    filename: z.string().trim().min(1).max(300),
    mimeType: z.string().max(200).optional(),
    url: z.string().url().max(2000).nullable().optional(),
    contentBase64: z.string().max(20_000_000).nullable().optional(),
    description: z.string().max(2000).optional(),
  })
  .refine((v) => !!v.url || !!v.contentBase64, { message: 'Provide either url or contentBase64.' });

const documentEntity: EntityConfig = {
  displayName: 'Document',
  writable: true,
  supportsArchive: true,
  createSchema: documentCreateSchema,
  list: (filters) =>
    listDocuments({
      entityType: filters.entityType as string | undefined,
      recordId: filters.recordId as string | undefined,
      includeArchived: filters.includeArchived === true,
    }),
  get: (id) => getDocumentById(id),
  create: (fields) => insertDocument(fields as any),
  archive: (id) => archiveDocument(id),
  restore: (id) => restoreDocument(id),
  schema: {
    entity: 'document',
    displayName: 'Document',
    writable: true,
    supportsArchive: true,
    fields: [
      field('entityType', 'string', true, { description: 'Which entity this attaches to, e.g. "funding_record"' }),
      field('recordId', 'string', true, { description: 'id of the record this attaches to' }),
      field('filename', 'string', true),
      field('mimeType', 'string', false, { description: 'e.g. application/pdf' }),
      field('url', 'string (URL)', false, { description: 'Provide this OR contentBase64, not both required' }),
      field('contentBase64', 'base64 string', false, { description: 'Inline file content — stored server-side; download via GET /api/documents/:id/download' }),
      field('description', 'string', false),
    ],
    notes: 'No update — create a new version and archive the old one. Listing/getting never returns contentBase64; use the REST download route for actual bytes.',
  },
};

// ---------------------------------------------------------------------------
// wave1_metric — system-synced analytics, read-only
// ---------------------------------------------------------------------------
const wave1MetricEntity: EntityConfig = {
  displayName: 'Wave 1 Performance Metric',
  writable: false,
  supportsArchive: false,
  list: (filters) => {
    const campaignId = (filters.campaignId as string) || 'q3_education_wave1_repair';
    const startDate = (filters.startDate as string) || '2026-01-01';
    const endDate = (filters.endDate as string) || '2026-12-31';
    return getMetricsByCampaignAndDate(campaignId, startDate, endDate);
  },
  get: () => {
    throw new Error('wave1_metric has no single-record get — use list with filters.campaignId.');
  },
  schema: {
    entity: 'wave1_metric',
    displayName: 'Wave 1 Performance Metric',
    writable: false,
    supportsArchive: false,
    fields: [
      field('campaignId', 'string', false, { description: 'Filter — defaults to q3_education_wave1_repair' }),
      field('startDate', 'ISO date string', false),
      field('endDate', 'ISO date string', false),
    ],
    notes: 'Read-only — populated by the scheduled GA4/Infinity sync, not by generic writes.',
  },
};

// ---------------------------------------------------------------------------
// audit_log — the change log itself, read-only
// ---------------------------------------------------------------------------
interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  source: string;
  source_conversation_id: string | null;
  request_id: string | null;
  confirmed: number;
  automatic: number;
  created_at: string;
}

const auditLogEntity: EntityConfig = {
  displayName: 'Audit Log Entry',
  writable: false,
  supportsArchive: false,
  list: (filters) => {
    const conditions: string[] = [];
    const params: Record<string, string> = {};
    if (filters.resourceType) {
      conditions.push('resource_type = @resourceType');
      params.resourceType = filters.resourceType as string;
    }
    if (filters.resourceId) {
      conditions.push('resource_id = @resourceId');
      params.resourceId = filters.resourceId as string;
    }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = typeof filters.limit === 'number' ? Math.min(filters.limit, 200) : 50;
    const rows = db.prepare(`SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT ${limit}`).all(params) as unknown as AuditLogRow[];
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      previousValue: r.previous_value ? JSON.parse(r.previous_value) : null,
      newValue: r.new_value ? JSON.parse(r.new_value) : null,
      source: r.source,
      confirmed: !!r.confirmed,
      automatic: !!r.automatic,
      createdAt: r.created_at,
    }));
  },
  get: (id) => {
    const row = db.prepare('SELECT * FROM audit_log WHERE id = ?').get(id) as unknown as AuditLogRow | undefined;
    if (!row) return undefined;
    return {
      id: row.id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      previousValue: row.previous_value ? JSON.parse(row.previous_value) : null,
      newValue: row.new_value ? JSON.parse(row.new_value) : null,
      source: row.source,
      confirmed: !!row.confirmed,
      automatic: !!row.automatic,
      createdAt: row.created_at,
    };
  },
  schema: {
    entity: 'audit_log',
    displayName: 'Audit Log Entry',
    writable: false,
    supportsArchive: false,
    fields: [
      field('resourceType', 'string', false, { description: 'Filter, e.g. "funding_record"' }),
      field('resourceId', 'string', false, { description: 'Filter to one record\'s history' }),
      field('limit', 'number', false, { description: 'Defaults 50, max 200' }),
    ],
    notes: 'Read-only — every create/update/archive/restore through the generic tools (and the bespoke ai_office_* tools) writes a row here.',
  },
};

// ---------------------------------------------------------------------------
export const ENTITY_REGISTRY: Record<string, EntityConfig> = {
  task: taskEntity,
  campaign: campaignEntity,
  tracking_link: trackingLinkEntity,
  funding_record: fundingEntity,
  business_objective: businessObjectiveEntity,
  quick_capture_item: quickCaptureEntity,
  document: documentEntity,
  wave1_metric: wave1MetricEntity,
  audit_log: auditLogEntity,
};

export function getEntityConfig(entity: string): EntityConfig | undefined {
  return ENTITY_REGISTRY[entity];
}

export function listEntityTypes(): Array<{ entity: string; displayName: string; writable: boolean; supportsArchive: boolean }> {
  return Object.entries(ENTITY_REGISTRY).map(([entity, config]) => ({
    entity,
    displayName: config.displayName,
    writable: config.writable,
    supportsArchive: config.supportsArchive,
  }));
}
