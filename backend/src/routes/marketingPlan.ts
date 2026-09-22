import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireEdit } from '../middleware/session.js';
import {
  createMarketingObjectiveSchema,
  createMarketingPlanSchema,
  updateMarketingObjectiveSchema,
  updateMarketingPlanSchema,
  createMarketingPrioritySchema,
  updateMarketingPrioritySchema,
  createMarketingMilestoneSchema,
  updateMarketingMilestoneSchema,
  reorderMarketingPrioritiesSchema,
  createMarketingCampaignLinkSchema,
  createMarketingKpiSchema,
  updateMarketingKpiSchema,
  createMarketingReviewSchema,
  updateMarketingReviewSchema,
  replaceMarketingReviewEvidenceSchema,
} from '../marketingPlan/schemas.js';
import { MARKETING_PLAN_KPI_REGISTRY } from '../marketingPlan/kpiRegistry.js';
import { getCampaignById } from '../db/campaignRepository.js';
import {
  createMarketingObjective,
  createMarketingPlan,
  getMarketingObjective,
  getMarketingPlan,
  listMarketingObjectives,
  listMarketingPlanHistory,
  listMarketingPlans,
  setMarketingObjectiveArchived,
  setMarketingPlanArchived,
  updateMarketingObjective,
  updateMarketingPlan,
  createMarketingPriority,
  getMarketingPriority,
  listMarketingPriorities,
  setMarketingPriorityArchived,
  updateMarketingPriority,
  createMarketingMilestone,
  getMarketingMilestone,
  listMarketingMilestones,
  setMarketingMilestoneArchived,
  updateMarketingMilestone,
  reorderMarketingPriorities,
  listMarketingObjectiveHistory,
  createMarketingCampaignLink,
  deleteMarketingCampaignLink,
  listMarketingCampaignLinks,
  createMarketingKpi,
  deleteMarketingKpi,
  getMarketingKpi,
  listMarketingKpis,
  updateMarketingKpi,
  createMarketingReview,
  getMarketingReview,
  listMarketingReviews,
  replaceMarketingReviewEvidence,
  setMarketingReviewArchived,
  updateMarketingReview,
} from '../db/marketingPlanRepository.js';

const router = Router();
const reasonSchema = z.object({ reason: z.string().trim().max(1000).optional() });

function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ success: false, message: 'Invalid Marketing Plan data.', error: error.issues.map((issue) => issue.message).join('; ') });
}

router.get('/plans', (req: Request, res: Response) => {
  res.json({ success: true, result: listMarketingPlans(req.query.includeArchived === 'true') });
});

router.get('/plans/:id', (req: Request, res: Response) => {
  const plan = getMarketingPlan(req.params.id);
  if (!plan) {
    res.status(404).json({ success: false, message: 'Marketing plan not found.' });
    return;
  }
  res.json({ success: true, result: plan });
});

router.post('/plans', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingPlanSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  res.status(201).json({ success: true, result: createMarketingPlan(parsed.data) });
});

router.patch('/plans/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingPlanSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const result = updateMarketingPlan(req.params.id, parsed.data);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing plan not found.' });
    return;
  }
  res.json({ success: true, result });
});

for (const [path, archived] of [['archive', true], ['restore', false]] as const) {
  router.post(`/plans/:id/${path}`, requireEdit, (req: Request, res: Response) => {
    const parsed = reasonSchema.safeParse(req.body ?? {});
    if (!parsed.success) return invalid(res, parsed.error);
    const result = setMarketingPlanArchived(req.params.id, archived, parsed.data.reason);
    if (!result) {
      res.status(404).json({ success: false, message: 'Marketing plan not found.' });
      return;
    }
    res.json({ success: true, result });
  });
}

router.get('/objectives/:objectiveId/priorities', (req: Request, res: Response) => {
  if (!getMarketingObjective(req.params.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingPriorities(req.params.objectiveId, req.query.includeArchived === 'true') });
});

router.post('/priorities', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingPrioritySchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingObjective(parsed.data.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.status(201).json({ success: true, result: createMarketingPriority(parsed.data) });
});

router.patch('/priorities/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingPrioritySchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const result = updateMarketingPriority(req.params.id, parsed.data);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing priority not found.' });
    return;
  }
  res.json({ success: true, result });
});

router.post('/priorities/reorder', requireEdit, (req: Request, res: Response) => {
  const parsed = reorderMarketingPrioritiesSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const result = reorderMarketingPriorities(parsed.data.objectiveId, parsed.data.ids, parsed.data.reason);
  if (!result) {
    res.status(400).json({ success: false, message: 'Priority order must include every active priority for this objective exactly once.' });
    return;
  }
  res.json({ success: true, result });
});

router.post('/priorities/:id/archive', requireEdit, (req: Request, res: Response) => {
  const parsed = reasonSchema.safeParse(req.body ?? {});
  if (!parsed.success) return invalid(res, parsed.error);
  const result = setMarketingPriorityArchived(req.params.id, true, parsed.data.reason);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing priority not found.' });
    return;
  }
  res.json({ success: true, result });
});

router.get('/objectives/:objectiveId/milestones', (req: Request, res: Response) => {
  if (!getMarketingObjective(req.params.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingMilestones(req.params.objectiveId, req.query.includeArchived === 'true') });
});

router.post('/milestones', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingMilestoneSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingObjective(parsed.data.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  if (parsed.data.priorityId) {
    const priority = getMarketingPriority(parsed.data.priorityId);
    if (!priority || priority.objectiveId !== parsed.data.objectiveId) {
      res.status(400).json({ success: false, message: 'The selected priority does not belong to this objective.' });
      return;
    }
  }
  res.status(201).json({ success: true, result: createMarketingMilestone(parsed.data) });
});

router.patch('/milestones/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingMilestoneSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const existing = getMarketingMilestone(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Marketing milestone not found.' });
    return;
  }
  if (parsed.data.priorityId) {
    const priority = getMarketingPriority(parsed.data.priorityId);
    if (!priority || priority.objectiveId !== existing.objectiveId) {
      res.status(400).json({ success: false, message: 'The selected priority does not belong to this objective.' });
      return;
    }
  }
  res.json({ success: true, result: updateMarketingMilestone(req.params.id, parsed.data) });
});

router.post('/milestones/:id/archive', requireEdit, (req: Request, res: Response) => {
  const parsed = reasonSchema.safeParse(req.body ?? {});
  if (!parsed.success) return invalid(res, parsed.error);
  const result = setMarketingMilestoneArchived(req.params.id, true, parsed.data.reason);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing milestone not found.' });
    return;
  }
  res.json({ success: true, result });
});

router.get('/objectives/:objectiveId/campaign-links', (req: Request, res: Response) => {
  if (!getMarketingObjective(req.params.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingCampaignLinks(req.params.objectiveId) });
});

router.post('/campaign-links', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingCampaignLinkSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingObjective(parsed.data.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  const campaign = getCampaignById(parsed.data.campaignId);
  if (!campaign || campaign.archived) {
    res.status(400).json({ success: false, message: 'Only an existing active campaign can be linked.' });
    return;
  }
  if (parsed.data.priorityId) {
    const priority = getMarketingPriority(parsed.data.priorityId);
    if (!priority || priority.objectiveId !== parsed.data.objectiveId || priority.archived) {
      res.status(400).json({ success: false, message: 'The selected priority does not belong to this objective.' });
      return;
    }
  }
  const duplicate = listMarketingCampaignLinks(parsed.data.objectiveId).some((link) => link.campaignId === parsed.data.campaignId && link.priorityId === (parsed.data.priorityId ?? null));
  if (duplicate) {
    res.status(409).json({ success: false, message: 'This campaign relationship already exists.' });
    return;
  }
  res.status(201).json({ success: true, result: createMarketingCampaignLink(parsed.data) });
});

router.delete('/campaign-links/:id', requireEdit, (req: Request, res: Response) => {
  const result = deleteMarketingCampaignLink(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, message: 'Campaign relationship not found.' });
    return;
  }
  res.json({ success: true, result });
});

router.get('/kpis/registry', (_req: Request, res: Response) => {
  res.json({ success: true, result: MARKETING_PLAN_KPI_REGISTRY });
});

router.get('/objectives/:objectiveId/kpis', (req: Request, res: Response) => {
  if (!getMarketingObjective(req.params.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingKpis(req.params.objectiveId) });
});

router.post('/kpis', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingKpiSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingObjective(parsed.data.objectiveId)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  if (listMarketingKpis(parsed.data.objectiveId).some((item) => item.kpiKey === parsed.data.kpiKey)) {
    res.status(409).json({ success: false, message: 'This KPI is already linked to the objective.' });
    return;
  }
  res.status(201).json({ success: true, result: createMarketingKpi(parsed.data) });
});

router.patch('/kpis/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingKpiSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const existing = getMarketingKpi(req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: 'Marketing KPI relationship not found.' });
    return;
  }
  const nextStatus = parsed.data.targetStatus ?? existing.targetStatus;
  const nextValue = parsed.data.targetValue === undefined ? existing.targetValue : parsed.data.targetValue;
  if (nextStatus !== 'tbc' && nextValue === null) {
    res.status(400).json({ success: false, message: 'A proposed or approved target needs a value.' });
    return;
  }
  const result = updateMarketingKpi(req.params.id, parsed.data);
  res.json({ success: true, result });
});

router.delete('/kpis/:id', requireEdit, (req: Request, res: Response) => {
  const result = deleteMarketingKpi(req.params.id);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing KPI relationship not found.' });
    return;
  }
  res.json({ success: true, result });
});

router.get('/plans/:planId/reviews', (req: Request, res: Response) => {
  if (!getMarketingPlan(req.params.planId)) return res.status(404).json({ success: false, message: 'Marketing plan not found.' });
  res.json({ success: true, result: listMarketingReviews(req.params.planId, req.query.includeArchived === 'true') });
});

router.post('/reviews', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingReviewSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingPlan(parsed.data.planId)) return res.status(404).json({ success: false, message: 'Marketing plan not found.' });
  if (parsed.data.objectiveId) {
    const objective = getMarketingObjective(parsed.data.objectiveId);
    if (!objective || objective.planId !== parsed.data.planId) return res.status(400).json({ success: false, message: 'The selected objective does not belong to this plan.' });
  }
  res.status(201).json({ success: true, result: createMarketingReview(parsed.data) });
});

router.patch('/reviews/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingReviewSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const existing = getMarketingReview(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Marketing review not found.' });
  if (parsed.data.objectiveId) {
    const objective = getMarketingObjective(parsed.data.objectiveId);
    if (!objective || objective.planId !== existing.planId) return res.status(400).json({ success: false, message: 'The selected objective does not belong to this plan.' });
  }
  res.json({ success: true, result: updateMarketingReview(req.params.id, parsed.data) });
});

router.post('/reviews/:id/evidence', requireEdit, (req: Request, res: Response) => {
  const parsed = replaceMarketingReviewEvidenceSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const review = getMarketingReview(req.params.id);
  if (!review) return res.status(404).json({ success: false, message: 'Marketing review not found.' });
  for (const item of parsed.data.evidence) {
    const kpi = getMarketingKpi(item.objectiveKpiId);
    if (!kpi || kpi.kpiKey !== item.kpiKey) return res.status(400).json({ success: false, message: 'Review evidence must reference an existing matching KPI relationship.' });
    const objective = getMarketingObjective(kpi.objectiveId);
    if (!objective || objective.planId !== review.planId || (review.objectiveId && review.objectiveId !== objective.id)) return res.status(400).json({ success: false, message: 'Review evidence is outside the review scope.' });
  }
  res.json({ success: true, result: replaceMarketingReviewEvidence(req.params.id, parsed.data.evidence) });
});

router.post('/reviews/:id/archive', requireEdit, (req: Request, res: Response) => {
  const parsed = reasonSchema.safeParse(req.body ?? {});
  if (!parsed.success) return invalid(res, parsed.error);
  const result = setMarketingReviewArchived(req.params.id, true, parsed.data.reason);
  if (!result) return res.status(404).json({ success: false, message: 'Marketing review not found.' });
  res.json({ success: true, result });
});

router.get('/plans/:planId/strategy', (req: Request, res: Response) => {
  if (!getMarketingPlan(req.params.planId)) {
    res.status(404).json({ success: false, message: 'Marketing plan not found.' });
    return;
  }
  const result = listMarketingObjectives(req.params.planId).map((objective) => ({
    objective,
    priorities: listMarketingPriorities(objective.id),
    milestones: listMarketingMilestones(objective.id),
    campaignLinks: listMarketingCampaignLinks(objective.id),
    kpis: listMarketingKpis(objective.id),
  }));
  res.json({ success: true, result });
});

router.get('/plans/:planId/objectives', (req: Request, res: Response) => {
  if (!getMarketingPlan(req.params.planId)) {
    res.status(404).json({ success: false, message: 'Marketing plan not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingObjectives(req.params.planId, req.query.includeArchived === 'true') });
});

router.post('/objectives', requireEdit, (req: Request, res: Response) => {
  const parsed = createMarketingObjectiveSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  if (!getMarketingPlan(parsed.data.planId)) {
    res.status(404).json({ success: false, message: 'Marketing plan not found.' });
    return;
  }
  res.status(201).json({ success: true, result: createMarketingObjective(parsed.data) });
});

router.get('/objectives/:id', (req: Request, res: Response) => {
  const objective = getMarketingObjective(req.params.id);
  if (!objective) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: objective });
});

router.get('/objectives/:id/history', (req: Request, res: Response) => {
  if (!getMarketingObjective(req.params.id)) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result: listMarketingObjectiveHistory(req.params.id) });
});

router.patch('/objectives/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateMarketingObjectiveSchema.safeParse(req.body);
  if (!parsed.success) return invalid(res, parsed.error);
  const result = updateMarketingObjective(req.params.id, parsed.data);
  if (!result) {
    res.status(404).json({ success: false, message: 'Marketing objective not found.' });
    return;
  }
  res.json({ success: true, result });
});

for (const [path, archived] of [['archive', true], ['restore', false]] as const) {
  router.post(`/objectives/:id/${path}`, requireEdit, (req: Request, res: Response) => {
    const parsed = reasonSchema.safeParse(req.body ?? {});
    if (!parsed.success) return invalid(res, parsed.error);
    const result = setMarketingObjectiveArchived(req.params.id, archived, parsed.data.reason);
    if (!result) {
      res.status(404).json({ success: false, message: 'Marketing objective not found.' });
      return;
    }
    res.json({ success: true, result });
  });
}

router.get('/history/:resourceType/:resourceId', (req: Request, res: Response) => {
  const resourceType = z.enum(['plan', 'objective', 'priority', 'milestone', 'campaign-link', 'kpi', 'review']).safeParse(req.params.resourceType);
  if (!resourceType.success) {
    res.status(400).json({ success: false, message: 'Invalid Marketing Plan resource type.' });
    return;
  }
  res.json({ success: true, result: listMarketingPlanHistory(resourceType.data, req.params.resourceId) });
});

export default router;
