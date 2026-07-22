import { query } from '../db/connection.js';

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  ctr: number;
  conversionRate: number;
}

interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversionRate: number;
}

export class GA4Service {
  // Note: In production, this would connect to actual Google Analytics 4 API
  // For MVP, we simulate with database queries

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics | null> {
    const result = await query(
      `SELECT
        id as campaignId, name as campaignName,
        start_date as startDate, end_date as endDate,
        impressions, clicks, conversions, spend, revenue,
        ROUND((revenue - spend) / spend * 100, 2)::float as roi,
        ROUND(clicks::float / impressions * 100, 2)::float as ctr,
        ROUND(conversions::float / clicks * 100, 2)::float as conversionRate
       FROM campaigns
       WHERE id = $1`,
      [campaignId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async getCampaignsByPeriod(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<CampaignMetrics[]> {
    const result = await query(
      `SELECT
        id as campaignId, name as campaignName,
        start_date as startDate, end_date as endDate,
        impressions, clicks, conversions, spend, revenue,
        ROUND((revenue - spend) / spend * 100, 2)::float as roi,
        ROUND(clicks::float / impressions * 100, 2)::float as ctr,
        ROUND(conversions::float / clicks * 100, 2)::float as conversionRate
       FROM campaigns
       WHERE company_id = $1
       AND start_date >= $2
       AND end_date <= $3
       ORDER BY revenue DESC`,
      [companyId, startDate, endDate]
    );

    return result.rows;
  }

  async getTrafficSources(companyId: string, days: number = 30): Promise<TrafficSource[]> {
    const result = await query(
      `SELECT
        source, medium,
        sessions, users,
        ROUND(bounce_rate, 2)::float as bounceRate,
        avg_session_duration as avgSessionDuration,
        ROUND(conversion_rate, 2)::float as conversionRate
       FROM traffic_sources
       WHERE company_id = $1
       AND date > NOW() - INTERVAL '${days} days'
       ORDER BY sessions DESC`,
      [companyId]
    );

    return result.rows;
  }

  async getTrendAnalysis(
    companyId: string,
    metric: string,
    days: number = 30
  ): Promise<Array<{ date: string; value: number }>> {
    const result = await query(
      `SELECT date, ${metric} as value
       FROM daily_metrics
       WHERE company_id = $1
       AND date > NOW() - INTERVAL '${days} days'
       ORDER BY date ASC`,
      [companyId]
    );

    return result.rows;
  }

  async predictROI(campaignId: string): Promise<{
    projectedRevenue: number;
    projectedROI: number;
    confidence: number;
    assumptions: string[];
  }> {
    const campaign = await this.getCampaignMetrics(campaignId);

    if (!campaign) {
      return {
        projectedRevenue: 0,
        projectedROI: 0,
        confidence: 0,
        assumptions: [],
      };
    }

    // Simple projection based on current trajectory
    const dailySpend = campaign.spend / ((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 3600 * 24));
    const dailyRevenue = campaign.revenue / ((new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime()) / (1000 * 3600 * 24));
    const daysRemaining = Math.max(0, (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 3600 * 24));

    const projectedRevenue = campaign.revenue + (dailyRevenue * daysRemaining);
    const projectedSpend = campaign.spend + (dailySpend * daysRemaining);
    const projectedROI = ((projectedRevenue - projectedSpend) / projectedSpend) * 100;

    return {
      projectedRevenue: Math.round(projectedRevenue),
      projectedROI: Math.round(projectedROI),
      confidence: 75, // Moderate confidence based on limited data
      assumptions: [
        'Linear spend trajectory continues',
        'Conversion rate remains constant',
        'No external market changes',
        'Budget not adjusted mid-campaign',
      ],
    };
  }

  async getPerformanceComparison(campaignId1: string, campaignId2: string): Promise<{
    campaign1: CampaignMetrics | null;
    campaign2: CampaignMetrics | null;
    winner: 'campaign1' | 'campaign2' | 'tie';
    reason: string;
  }> {
    const campaign1 = await this.getCampaignMetrics(campaignId1);
    const campaign2 = await this.getCampaignMetrics(campaignId2);

    if (!campaign1 || !campaign2) {
      return {
        campaign1,
        campaign2,
        winner: 'tie',
        reason: 'Missing campaign data',
      };
    }

    const roi1 = campaign1.roi;
    const roi2 = campaign2.roi;

    let winner: 'campaign1' | 'campaign2' | 'tie' = 'tie';
    let reason = 'Campaigns have similar ROI';

    if (roi1 > roi2 + 10) {
      winner = 'campaign1';
      reason = `${campaign1.campaignName} has ${Math.abs(roi1 - roi2).toFixed(1)}% better ROI`;
    } else if (roi2 > roi1 + 10) {
      winner = 'campaign2';
      reason = `${campaign2.campaignName} has ${Math.abs(roi1 - roi2).toFixed(1)}% better ROI`;
    }

    return {
      campaign1,
      campaign2,
      winner,
      reason,
    };
  }

  async getAnomalies(companyId: string): Promise<
    Array<{
      type: string;
      metric: string;
      currentValue: number;
      expectedValue: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>
  > {
    // Simulate anomaly detection
    const result = await query(
      `SELECT
        metric_type as type, metric_name as metric,
        current_value as currentValue, expected_value as expectedValue,
        ABS(current_value - expected_value) / expected_value * 100 as deviation,
        CASE
          WHEN ABS(current_value - expected_value) / expected_value > 0.5 THEN 'high'
          WHEN ABS(current_value - expected_value) / expected_value > 0.2 THEN 'medium'
          ELSE 'low'
        END as severity
       FROM anomalies
       WHERE company_id = $1
       AND detected_at > NOW() - INTERVAL '7 days'
       ORDER BY deviation DESC`,
      [companyId]
    );

    return result.rows;
  }
}

export const ga4Service = new GA4Service();
