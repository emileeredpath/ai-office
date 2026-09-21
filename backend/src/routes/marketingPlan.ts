import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireEdit } from '../middleware/session.js';
import {
  createMarketingObjectiveSchema,
  createMarketingPlanSchema,
  updateMarketingObjectiveSchema,
  updateMarketingPlanSchema,
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
  const resourceType = z.enum(['plan', 'objective']).safeParse(req.params.resourceType);
  if (!resourceType.success) {
    res.status(400).json({ success: false, message: 'Invalid Marketing Plan resource type.' });
    return;
  }
  res.json({ success: true, result: listMarketingPlanHistory(resourceType.data, req.params.resourceId) });
});

export default router;
