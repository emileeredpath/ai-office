import { Router, type Request, type Response } from 'express';
import { getBrandTraffic } from '../services/ga4.js';
import { syncWave1Ga4, syncWave1Infinity } from '../services/wave1Sync.js';
import { getMetricsByCampaignAndDate } from '../db/wave1PerformanceRepository.js';

// Wave 1 analytics routes — GA4 and Infinity integration
const router = Router();

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// General GA4 website traffic (V2 Overview/Performance/Reports — see
// getBrandTraffic's own doc comment). startDate/endDate represent the
// caller's resolved calendar period (e.g. the frontend's global Period
// selector) — this route never approximates a period with a rolling day
// count. Both are optional and must be provided together; if either is
// missing or malformed, falls back to the service's own month-to-date
// default rather than erroring, since a slightly-wrong default is safer
// than breaking the page. "All time" should be passed explicitly as an
// early fixed date (see GA4_EARLIEST_SUPPORTED_DATE in services/ga4.ts)
// rather than an unbounded range.
router.get('/ga4', async (req: Request, res: Response) => {
  const rawStart = req.query.startDate as string | undefined;
  const rawEnd = req.query.endDate as string | undefined;
  const validRange = rawStart && rawEnd && ISO_DATE_RE.test(rawStart) && ISO_DATE_RE.test(rawEnd);
  const result = await getBrandTraffic(validRange ? rawStart : undefined, validRange ? rawEnd : undefined);
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
