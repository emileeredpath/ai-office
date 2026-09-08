import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  getCampaignCosts,
  getCampaignCostById,
  insertCampaignCost,
  updateCampaignCostRow,
  deleteCampaignCostRow,
} from '../db/campaignCostsRepository.js';
import { CAMPAIGN_COST_CATEGORIES } from '../types.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

const createCampaignCostSchema = z.object({
  campaignId: z.string().trim().min(1),
  category: z.enum(CAMPAIGN_COST_CATEGORIES),
  description: z.string().trim().min(1).max(500),
  amount: z.number().min(0),
  costDate: z.string().trim().min(1),
  supplierReference: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

const updateCampaignCostSchema = createCampaignCostSchema.omit({ campaignId: true }).partial();

// Same shared database the MCP tools read — a cost created here is a
// genuine row a marketer entered, same data-integrity standing as a
// tracking link or funding record. campaignId is an optional filter, not a
// route param, so the Campaigns list can fetch every cost across every
// campaign in one call (to compute Known Campaign Spend per row) while
// Campaign Detail fetches just its own campaign's costs.
router.get('/', (req: Request, res: Response) => {
  const campaignId = typeof req.query.campaignId === 'string' ? req.query.campaignId : undefined;
  res.json({ success: true, result: getCampaignCosts(campaignId) });
});

router.get('/:id', (req: Request, res: Response) => {
  const cost = getCampaignCostById(req.params.id);
  if (!cost) {
    res.status(404).json({ success: false, message: 'Campaign cost not found.' });
    return;
  }
  res.json({ success: true, result: cost });
});

router.post('/', requireEdit, (req: Request, res: Response) => {
  const parsed = createCampaignCostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid campaign cost data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const cost = insertCampaignCost(parsed.data);
  res.status(201).json({ success: true, result: cost });
});

router.patch('/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateCampaignCostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid campaign cost data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const updated = updateCampaignCostRow(req.params.id, parsed.data);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Campaign cost not found.' });
    return;
  }
  res.json({ success: true, result: updated });
});

router.delete('/:id', requireEdit, (req: Request, res: Response) => {
  const deleted = deleteCampaignCostRow(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Campaign cost not found.' });
    return;
  }
  res.json({ success: true, result: { id: req.params.id } });
});

export default router;
