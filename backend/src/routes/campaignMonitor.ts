import { Router, type Request, type Response } from 'express';
import { syncCampaignMonitor } from '../services/campaignMonitor.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

// Manual trigger — lets Emilee (or Claude, via the MCP tool) run the sync
// on demand instead of waiting for the weekly schedule, e.g. to verify a
// new CAMPAIGN_MONITOR_API_KEY actually works.
router.post('/sync', requireEdit, async (_req: Request, res: Response) => {
  const result = await syncCampaignMonitor();
  res.status(result.success ? 200 : 502).json(result);
});

export default router;
