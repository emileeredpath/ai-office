// Shared Wave 1 sync logic — persists fresh GA4/Infinity reads to
// wave_1_performance_metrics. Used by both the on-demand analytics routes
// (user opens a Wave 1 tab) and the scheduled cron jobs below, so the two
// paths can never drift out of sync with each other.
import { getWave1Performance, type Wave1Result } from './ga4.js';
import { getWave1CallMetrics, type InfinityResult } from './infinity.js';
import { upsertWave1Metric } from '../db/wave1PerformanceRepository.js';
import type { Brand } from '../types.js';

const WAVE1_CAMPAIGN_ID = 'q3_education_wave1_repair';

export async function syncWave1Ga4(campaignId: string = WAVE1_CAMPAIGN_ID): Promise<Wave1Result> {
  const result = await getWave1Performance();

  if (result.configured && result.metrics?.byBrand) {
    const metricDate = new Date().toISOString().split('T')[0];
    Object.entries(result.metrics.byBrand).forEach(([brand, metrics]) => {
      upsertWave1Metric(campaignId, 'ga4', metricDate, brand as Brand, {
        clicks: metrics.clicks,
        pageViews: metrics.pageViews,
        formSubmissions: metrics.formSubmissions,
        conversionRate: metrics.conversionRate,
      });
    });
  }

  return result;
}

export async function syncWave1Infinity(campaignId: string = WAVE1_CAMPAIGN_ID): Promise<InfinityResult> {
  const result = await getWave1CallMetrics();

  if (result.configured && result.metrics) {
    const metricDate = new Date().toISOString().split('T')[0];
    upsertWave1Metric(campaignId, 'infinity', metricDate, 'mtech', {
      callsTotal: result.metrics.totalCalls,
      callsAnswered: result.metrics.answeredCalls,
      callsMissed: result.metrics.missedCalls,
      avgCallDuration: result.metrics.avgDuration,
    });
  }

  return result;
}
