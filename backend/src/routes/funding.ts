import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  getAllFundingRecords,
  getFundingRecordById,
  insertFundingRecord,
  updateFundingRecordRow,
} from '../db/fundingRepository.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

const BRANDS = ['mtech', 'brentwood', 'radio-links', 'capcom', 'ircl', 'idaro'] as const;
const REBATE_TYPES = ['marketing-rebate', 'loyalty-rebate', 'loyalty-bonus', 'other'] as const;
const CLAIM_STATUSES = ['eligible', 'submitted', 'approved', 'paid', 'rejected'] as const;

const bonusTierSchema = z.object({
  id: z.string(),
  threshold: z.number(),
  bonusRate: z.number().nullable().optional(),
  bonusAmount: z.number().nullable().optional(),
  description: z.string().max(500).optional(),
});

const createFundingRecordSchema = z.object({
  brand: z.enum(BRANDS),
  vendor: z.string().trim().min(1).max(200),
  schemeName: z.string().trim().min(1).max(200),
  rebateType: z.enum(REBATE_TYPES).optional(),
  rebatePercent: z.number().min(0).max(100).nullable().optional(),
  totalPurchases: z.number().min(0).optional(),
  amountEarned: z.number().min(0).optional(),
  amountClaimed: z.number().min(0).optional(),
  claimStatus: z.enum(CLAIM_STATUSES).optional(),
  claimDeadline: z.string().nullable().optional(),
  creditedFrequency: z.string().max(100).optional(),
  targetSpend: z.number().min(0).nullable().optional(),
  bonusTiers: z.array(bonusTierSchema).optional(),
  notes: z.string().max(10000).optional(),
});

const updateFundingRecordSchema = createFundingRecordSchema.partial();

// Same shared database the MCP tools write to — a record created via the
// dashboard is immediately visible to ai_office_list_funding_records, and
// vice versa.
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, result: getAllFundingRecords() });
});

router.get('/:id', (req: Request, res: Response) => {
  const record = getFundingRecordById(req.params.id);
  if (!record) {
    res.status(404).json({ success: false, message: 'Funding record not found.' });
    return;
  }
  res.json({ success: true, result: record });
});

router.post('/', requireEdit, (req: Request, res: Response) => {
  const parsed = createFundingRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid funding record data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const record = insertFundingRecord(parsed.data);
  res.status(201).json({ success: true, result: record });
});

router.patch('/:id', requireEdit, (req: Request, res: Response) => {
  const parsed = updateFundingRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid funding record data.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const updated = updateFundingRecordRow(req.params.id, parsed.data);
  if (!updated) {
    res.status(404).json({ success: false, message: 'Funding record not found.' });
    return;
  }
  res.json({ success: true, result: updated });
});

export default router;
