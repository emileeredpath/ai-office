import { nanoid } from 'nanoid';
import db from './connection.js';
import type { Brand } from '../types.js';

export interface Wave1PerformanceMetric {
  id: string;
  campaignId: string;
  metricType: 'ga4' | 'infinity';
  metricDate: string;
  brand: Brand;
  utmContent?: string;
  clicks: number;
  pageViews: number;
  formSubmissions: number;
  conversionRate: number;
  callsTotal: number;
  callsAnswered: number;
  callsMissed: number;
  avgCallDuration?: string;
  lastSynced: string;
  createdAt: string;
  updatedAt: string;
}

export function upsertWave1Metric(
  campaignId: string,
  metricType: 'ga4' | 'infinity',
  metricDate: string,
  brand: Brand,
  data: {
    utmContent?: string;
    clicks?: number;
    pageViews?: number;
    formSubmissions?: number;
    conversionRate?: number;
    callsTotal?: number;
    callsAnswered?: number;
    callsMissed?: number;
    avgCallDuration?: string;
  }
) {
  const id = `wave1-${nanoid(10)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO wave_1_performance_metrics (
      id, campaign_id, metric_type, metric_date, brand, utm_content,
      clicks, page_views, form_submissions, conversion_rate,
      calls_total, calls_answered, calls_missed, avg_call_duration,
      last_synced, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(campaign_id, metric_type, metric_date, brand, utm_content) DO UPDATE SET
      clicks = EXCLUDED.clicks,
      page_views = EXCLUDED.page_views,
      form_submissions = EXCLUDED.form_submissions,
      conversion_rate = EXCLUDED.conversion_rate,
      calls_total = EXCLUDED.calls_total,
      calls_answered = EXCLUDED.calls_answered,
      calls_missed = EXCLUDED.calls_missed,
      avg_call_duration = EXCLUDED.avg_call_duration,
      last_synced = EXCLUDED.last_synced,
      updated_at = EXCLUDED.updated_at
  `);

  stmt.run(
    id,
    campaignId,
    metricType,
    metricDate,
    brand,
    data.utmContent || null,
    data.clicks ?? 0,
    data.pageViews ?? 0,
    data.formSubmissions ?? 0,
    data.conversionRate ?? 0,
    data.callsTotal ?? 0,
    data.callsAnswered ?? 0,
    data.callsMissed ?? 0,
    data.avgCallDuration || null,
    now,
    now,
    now
  );
}

export function getMetricsByCampaignAndDate(
  campaignId: string,
  startDate: string,
  endDate: string
): Wave1PerformanceMetric[] {
  const stmt = db.prepare(`
    SELECT
      id, campaign_id as campaignId, metric_type as metricType,
      metric_date as metricDate, brand, utm_content as utmContent,
      clicks, page_views as pageViews, form_submissions as formSubmissions,
      conversion_rate as conversionRate,
      calls_total as callsTotal, calls_answered as callsAnswered,
      calls_missed as callsMissed, avg_call_duration as avgCallDuration,
      last_synced as lastSynced, created_at as createdAt, updated_at as updatedAt
    FROM wave_1_performance_metrics
    WHERE campaign_id = ? AND metric_date BETWEEN ? AND ?
    ORDER BY metric_date DESC
  `);

  return stmt.all(campaignId, startDate, endDate) as Wave1PerformanceMetric[];
}

export function getMetricsByBrand(
  brand: Brand,
  startDate: string,
  endDate: string
): Wave1PerformanceMetric[] {
  const stmt = db.prepare(`
    SELECT
      id, campaign_id as campaignId, metric_type as metricType,
      metric_date as metricDate, brand, utm_content as utmContent,
      clicks, page_views as pageViews, form_submissions as formSubmissions,
      conversion_rate as conversionRate,
      calls_total as callsTotal, calls_answered as callsAnswered,
      calls_missed as callsMissed, avg_call_duration as avgCallDuration,
      last_synced as lastSynced, created_at as createdAt, updated_at as updatedAt
    FROM wave_1_performance_metrics
    WHERE brand = ? AND metric_date BETWEEN ? AND ?
    ORDER BY metric_date DESC
  `);

  return stmt.all(brand, startDate, endDate) as Wave1PerformanceMetric[];
}

export function getLatestMetricsByBrand(brand: Brand): Wave1PerformanceMetric[] {
  const stmt = db.prepare(`
    SELECT
      id, campaign_id as campaignId, metric_type as metricType,
      metric_date as metricDate, brand, utm_content as utmContent,
      clicks, page_views as pageViews, form_submissions as formSubmissions,
      conversion_rate as conversionRate,
      calls_total as callsTotal, calls_answered as callsAnswered,
      calls_missed as callsMissed, avg_call_duration as avgCallDuration,
      last_synced as lastSynced, created_at as createdAt, updated_at as updatedAt
    FROM wave_1_performance_metrics
    WHERE brand = ? AND metric_type IN ('ga4', 'infinity')
    ORDER BY metric_date DESC
    LIMIT 100
  `);

  return stmt.all(brand) as Wave1PerformanceMetric[];
}
