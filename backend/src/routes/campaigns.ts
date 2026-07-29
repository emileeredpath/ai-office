import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  getAllCampaigns,
  getCampaignById,
  insertCampaign,
  updateCampaignRow,
  deleteCampaignRow,
  getCampaignProgress,
} from '../db/campaignRepository.js';
import { getAllTasks } from '../db/taskRepository.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

const BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl'] as const;
const STATUSES = ['planning', 'active', 'on-hold', 'completed'] as const;

const resultsSchema = z
  .object({
    emailOpenRate: z.number().nullable().optional(),
    emailClickRate: z.number().nullable().optional(),
    unsubscribes: z.number().nullable().optional(),
    landingPageVisits: z.number().nullable().optional(),
    enquiriesReceived: z.number().nullable().optional(),
    costToSend: z.number().nullable().optional(),
    notes: z.string().optional(),
    loggedAt: z.string().optional(),
  })
  .nullable()
  .optional();

const createCampaignSchema = z.object({
  name: z.string().trim().min(1).max(300),
  brand: z.enum(BRANDS),
  entities: z.array(z.enum(BRANDS)).optional(),
  primaryIndustry: z.string().max(200).optional(),
  secondaryIndustry: z.string().max(200).optional(),
  theme: z.string().max(200).optional(),
  status: z.enum(STATUSES).optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.number().nullable().optional(),
  spend: z.number().optional(),
  conversions: z.number().int().optional(),
  leads: z.number().int().optional(),
  engagement: z.number().optional(),
  colour: z.string().max(20).optional(),
  reactive: z.boolean().optional(),
  notes: z.string().max(10000).optional(),
  results: resultsSchema,
});

const updateCampaignSchema = createCampaignSchema.partial();

function withProgress(record: ReturnType<typeof getAllCampaigns>[number]) {
  const progress = getCampaignProgress(record.id);
  return { ...record, taskCount: progress.total, tasksComplete: progress.complete };
}

// Reads are shared with the MCP tools' campaign_id tags on tasks — this is
// the only place campaigns are stored, so anything created here or via the
// dashboard is immediately visible to Claude through /api/tasks?campaign_id=.
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, result: getAllCampaigns().map(withProgress) });
});

router.get('/:id', (req: Request, res: Response) => {
  const campaign = getCampaignById(req.params.id);
  if (!campaign) {
    res.status(404).json({ success: false, message: 'Campaign not found.' });
    return;
  }
  const tasks = getAllTasks().filter((t) => t.campaignId === campaign.id);
  res.json({ success: true, result: { ...withProgress(campaign), tasks } });
});

router.post('/', requireEdit, (req: Request, res: Response) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid campaign data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const campaign = insertCampaign(parsed.data);
  res.status(201).json({ success: true, result: withProgress(campaign) });
});

router.patch('/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid campaign data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const updated = updateCampaignRow(req.params.id, parsed.data);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Campaign not found.' });
    return;
  }
  res.json({ success: true, result: withProgress(updated) });
});

router.delete('/:id', requireEdit, (req: Request, res: Response) => {
  const deleted = deleteCampaignRow(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Campaign not found.' });
    return;
  }
  res.json({ success: true, message: 'Campaign deleted.' });
});

export default router;
