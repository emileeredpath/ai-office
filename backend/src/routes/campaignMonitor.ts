import { Router, type Request, type Response } from 'express';
import { syncCampaignMonitor, getTopLinksForSend } from '../services/campaignMonitor.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

// Manual trigger — lets Emilee (or Claude, via the MCP tool) run the sync
// on demand instead of waiting for the weekly schedule, e.g. to verify a
// new CAMPAIGN_MONITOR_API_KEY actually works.
router.post('/sync', requireEdit, async (req: Request, res: Response) => {
  const sinceDays = req.query.sinceDays ? parseInt(req.query.sinceDays as string, 10) : undefined;
  const result = await syncCampaignMonitor({ sinceDays });
  res.status(result.success ? 200 : 502).json(result);
});

// Top Links (Send Detail) — deliberately on demand only, called just when
// someone opens a send's detail view, never as part of the regular sync.
// See getTopLinksForSend's own doc comment: this fetches Campaign
// Monitor's individual-subscriber click log, aggregates it in memory into
// { url, totalClicks, uniqueClicks }, and returns only that aggregate —
// nothing subscriber-level is ever persisted or returned by this route.
router.get('/sends/:campaignId/top-links', async (req: Request, res: Response) => {
  try {
    const rows = await getTopLinksForSend(req.params.campaignId);
    res.json({ success: true, rows });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[campaign-monitor] failed to get top links for ${req.params.campaignId}:`, msg);
    res.status(502).json({ success: false, message: msg });
  }
});

export default router;
