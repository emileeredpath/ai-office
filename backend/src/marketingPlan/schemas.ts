import { z } from 'zod';
import { MARKETING_PLAN_KPI_REGISTRY } from './kpiRegistry.js';

export const MARKETING_PLAN_STATUSES = ['draft', 'proposed', 'approved', 'complete', 'needs-confirmation'] as const;
export const MARKETING_OBJECTIVE_STATUSES = [...MARKETING_PLAN_STATUSES, 'tbc'] as const;
export const MARKETING_OBJECTIVE_PRIORITIES = ['high', 'medium', 'low', 'tbc'] as const;
export const MARKETING_PLAN_BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro', 'brentwood-marine'] as const;
export const MARKETING_MILESTONE_LEVELS = ['quarterly-outcome', 'monthly-milestone', 'current-focus'] as const;
export const MARKETING_MILESTONE_STATUSES = ['draft', 'proposed', 'approved', 'in-progress', 'complete', 'tbc', 'needs-confirmation'] as const;
export const MARKETING_ATTENTION_TYPES = ['decision-required', 'review-required', 'approval-required', 'missing-information'] as const;
export const MARKETING_KPI_KEYS = MARKETING_PLAN_KPI_REGISTRY.map((item) => item.key) as [string, ...string[]];

const optionalDate = z.string().date().nullable().optional();
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const createMarketingPlanSchema = z.object({
  title: z.string().trim().min(1).max(200),
  periodYear: z.number().int().min(2000).max(2200),
  businessDirection: optionalText(10000),
  status: z.enum(MARKETING_PLAN_STATUSES).optional(),
  nextReviewDate: optionalDate,
  notes: optionalText(10000),
});

export const updateMarketingPlanSchema = createMarketingPlanSchema.partial().extend({
  reason: z.string().trim().max(1000).optional(),
});

export const createMarketingObjectiveSchema = z.object({
  planId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  description: optionalText(10000),
  status: z.enum(MARKETING_OBJECTIVE_STATUSES).optional(),
  priority: z.enum(MARKETING_OBJECTIVE_PRIORITIES).optional(),
  periodYear: z.number().int().min(2000).max(2200),
  quarter: z.number().int().min(1).max(4).nullable().optional(),
  whyItMatters: optionalText(10000),
  customerMarketContext: optionalText(10000),
  commercialRelevance: optionalText(10000),
  marketingRationale: optionalText(10000),
  nextReviewDate: optionalDate,
  sortOrder: z.number().int().min(0).optional(),
  notes: optionalText(10000),
  entities: z.array(z.enum(MARKETING_PLAN_BRANDS)).max(MARKETING_PLAN_BRANDS.length).optional(),
});

export const updateMarketingObjectiveSchema = createMarketingObjectiveSchema.omit({ planId: true }).partial().extend({
  reason: z.string().trim().max(1000).optional(),
});

export const createMarketingPrioritySchema = z.object({
  objectiveId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  description: optionalText(5000),
  status: z.enum(MARKETING_OBJECTIVE_STATUSES).optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: optionalText(5000),
});

export const updateMarketingPrioritySchema = createMarketingPrioritySchema.omit({ objectiveId: true }).partial().extend({
  reason: z.string().trim().max(1000).optional(),
});

export const reorderMarketingPrioritiesSchema = z.object({
  objectiveId: z.string().trim().min(1),
  ids: z.array(z.string().trim().min(1)).min(1),
  reason: z.string().trim().max(1000).optional(),
}).refine((value) => new Set(value.ids).size === value.ids.length, { message: 'Priority IDs must be unique.' });

export const createMarketingMilestoneSchema = z.object({
  objectiveId: z.string().trim().min(1),
  priorityId: z.string().trim().min(1).nullable().optional(),
  level: z.enum(MARKETING_MILESTONE_LEVELS),
  title: z.string().trim().min(1).max(200),
  description: optionalText(5000),
  status: z.enum(MARKETING_MILESTONE_STATUSES).optional(),
  periodYear: z.number().int().min(2000).max(2200).nullable().optional(),
  quarter: z.number().int().min(1).max(4).nullable().optional(),
  month: z.number().int().min(1).max(12).nullable().optional(),
  startDate: optionalDate,
  dueDate: optionalDate,
  attentionType: z.enum(MARKETING_ATTENTION_TYPES).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: optionalText(5000),
});

export const updateMarketingMilestoneSchema = createMarketingMilestoneSchema.omit({ objectiveId: true }).partial().extend({
  reason: z.string().trim().max(1000).optional(),
});

export const createMarketingCampaignLinkSchema = z.object({
  objectiveId: z.string().trim().min(1),
  priorityId: z.string().trim().min(1).nullable().optional(),
  campaignId: z.string().trim().min(1),
  sortOrder: z.number().int().min(0).optional(),
});

export const createMarketingKpiSchema = z.object({
  objectiveId: z.string().trim().min(1),
  kpiKey: z.enum(MARKETING_KPI_KEYS),
  targetValue: z.number().finite().min(0).nullable().optional(),
  targetDirection: z.enum(['increase', 'decrease', 'maintain', 'reach']).optional(),
  targetStatus: z.enum(['tbc', 'proposed', 'approved']).optional(),
  periodScope: z.enum(['objective', 'quarter', 'month', 'all-time']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: optionalText(5000),
}).superRefine((value, context) => {
  if (value.targetStatus && value.targetStatus !== 'tbc' && value.targetValue == null) {
    context.addIssue({ code: 'custom', path: ['targetValue'], message: 'A proposed or approved target needs a value.' });
  }
});

export const updateMarketingKpiSchema = z.object({
  targetValue: z.number().finite().min(0).nullable().optional(),
  targetDirection: z.enum(['increase', 'decrease', 'maintain', 'reach']).optional(),
  targetStatus: z.enum(['tbc', 'proposed', 'approved']).optional(),
  periodScope: z.enum(['objective', 'quarter', 'month', 'all-time']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  notes: optionalText(5000),
  reason: z.string().trim().max(1000).optional(),
});

export type CreateMarketingPlanInput = z.infer<typeof createMarketingPlanSchema>;
export type UpdateMarketingPlanInput = z.infer<typeof updateMarketingPlanSchema>;
export type CreateMarketingObjectiveInput = z.infer<typeof createMarketingObjectiveSchema>;
export type UpdateMarketingObjectiveInput = z.infer<typeof updateMarketingObjectiveSchema>;
export type CreateMarketingPriorityInput = z.infer<typeof createMarketingPrioritySchema>;
export type UpdateMarketingPriorityInput = z.infer<typeof updateMarketingPrioritySchema>;
export type CreateMarketingMilestoneInput = z.infer<typeof createMarketingMilestoneSchema>;
export type UpdateMarketingMilestoneInput = z.infer<typeof updateMarketingMilestoneSchema>;
export type CreateMarketingCampaignLinkInput = z.infer<typeof createMarketingCampaignLinkSchema>;
export type CreateMarketingKpiInput = z.infer<typeof createMarketingKpiSchema>;
export type UpdateMarketingKpiInput = z.infer<typeof updateMarketingKpiSchema>;
