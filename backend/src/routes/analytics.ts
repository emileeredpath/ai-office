import { Router, type Request, type Response } from 'express';
import { getBrandTraffic } from '../services/ga4.js';
import { syncWave1Ga4, syncWave1Infinity } from '../services/wave1Sync.js';
import { getMetricsByCampaignAndDate } from '../db/wave1PerformanceRepository.js';

// Wave 1 analytics routes — GA4 and Infinity integration
const router = Router();

router.get('/ga4', async (_req: Request, res: Response) => {
  const result = await getBrandTraffic();
  res.json(result);
});

// Wave 1 performance metrics from GA4 (clicks, page views, form submissions, conversion rates by brand)
router.get('/wave1/performance', async (req: Request, res: Response) => {
  try {
    const campaignId = (req.query.campaignId as string) || undefined;
    const ga4Result = await syncWave1Ga4(campaignId);

    res.json({
      configured: ga4Result.configured,
      ga4: ga4Result.metrics,
      errors: ga4Result.errors,
      lastSynced: ga4Result.lastSynced,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Wave 1 call tracking metrics from Infinity
router.get('/wave1/calls', async (_req: Request, res: Response) => {
  try {
    const infinityResult = await syncWave1Infinity();

    res.json({
      configured: infinityResult.configured,
      metrics: infinityResult.metrics,
      errors: infinityResult.errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Get historical Wave 1 metrics for a campaign
router.get('/wave1/history', (req: Request, res: Response) => {
  try {
    const campaignId = (req.query.campaignId as string) || 'q3_education_wave1_repair';
    const startDate = (req.query.startDate as string) || '2026-08-12';
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];

    const metrics = getMetricsByCampaignAndDate(campaignId, startDate, endDate);
    res.json({ metrics });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
