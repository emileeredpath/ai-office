import { z } from 'zod';

export const MARKETING_PLAN_STATUSES = ['draft', 'proposed', 'approved', 'complete', 'needs-confirmation'] as const;
export const MARKETING_OBJECTIVE_STATUSES = [...MARKETING_PLAN_STATUSES, 'tbc'] as const;
export const MARKETING_OBJECTIVE_PRIORITIES = ['high', 'medium', 'low', 'tbc'] as const;
export const MARKETING_PLAN_BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro', 'brentwood-marine'] as const;

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

export type CreateMarketingPlanInput = z.infer<typeof createMarketingPlanSchema>;
export type UpdateMarketingPlanInput = z.infer<typeof updateMarketingPlanSchema>;
export type CreateMarketingObjectiveInput = z.infer<typeof createMarketingObjectiveSchema>;
export type UpdateMarketingObjectiveInput = z.infer<typeof updateMarketingObjectiveSchema>;
