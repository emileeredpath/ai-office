import { Router, type Request, type Response } from 'express';
import { getBrandTraffic, getWave1Performance } from '../services/ga4.js';
import { getWave1CallMetrics } from '../services/infinity.js';
import { upsertWave1Metric, getMetricsByCampaignAndDate } from '../db/wave1PerformanceRepository.js';

// Wave 1 analytics routes — GA4 and Infinity integration
const router = Router();

router.get('/ga4', async (_req: Request, res: Response) => {
  const result = await getBrandTraffic();
  res.json(result);
});

// Wave 1 performance metrics from GA4 (clicks, page views, form submissions, conversion rates by brand)
router.get('/wave1/performance', async (req: Request, res: Response) => {
  try {
    const campaignId = (req.query.campaignId as string) || 'q3_education_wave1_repair';

    // Fetch fresh data from GA4
    const ga4Result = await getWave1Performance();

    if (!ga4Result.configured || !ga4Result.metrics) {
      return res.json({
        configured: ga4Result.configured,
        ga4: ga4Result.metrics,
        errors: ga4Result.errors,
        lastSynced: ga4Result.lastSynced,
      });
    }

    // Store metrics in database for historical tracking
    const metricDate = new Date().toISOString().split('T')[0];
    if (ga4Result.metrics.byBrand) {
      Object.entries(ga4Result.metrics.byBrand).forEach(([brand, metrics]) => {
        upsertWave1Metric(campaignId, 'ga4', metricDate, brand as any, {
          clicks: metrics.clicks,
          pageViews: metrics.pageViews,
          formSubmissions: metrics.formSubmissions,
          conversionRate: metrics.conversionRate,
        });
      });
    }

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
    const infinityResult = await getWave1CallMetrics();

    if (!infinityResult.configured || !infinityResult.metrics) {
      return res.json({
        configured: infinityResult.configured,
        metrics: infinityResult.metrics,
        errors: infinityResult.errors,
      });
    }

    // Store aggregated call metrics in database
    const metricDate = new Date().toISOString().split('T')[0];
    upsertWave1Metric('q3_education_wave1_repair', 'infinity', metricDate, 'mtech' as any, {
      callsTotal: infinityResult.metrics.totalCalls,
      callsAnswered: infinityResult.metrics.answeredCalls,
      callsMissed: infinityResult.metrics.missedCalls,
      avgCallDuration: infinityResult.metrics.avgDuration,
    });

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
