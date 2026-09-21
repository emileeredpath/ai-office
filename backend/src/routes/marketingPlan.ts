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
} from '../marketingPlan/schemas.js';
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
  const resourceType = z.enum(['plan', 'objective', 'priority', 'milestone']).safeParse(req.params.resourceType);
  if (!resourceType.success) {
    res.status(400).json({ success: false, message: 'Invalid Marketing Plan resource type.' });
    return;
  }
  res.json({ success: true, result: listMarketingPlanHistory(resourceType.data, req.params.resourceId) });
});

export default router;
