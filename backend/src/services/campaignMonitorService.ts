import { query } from '../db/connection.js';

interface EmailCampaign {
  campaignId: string;
  campaignName: string;
  sentDate: string;
  recipientCount: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  conversions: number;
  revenue: number;
  status: 'draft' | 'scheduled' | 'sent' | 'paused';
}

interface ListMetrics {
  listId: string;
  listName: string;
  subscriberCount: number;
  unsubscribeRate: number;
  bounceRate: number;
  engagementRate: number;
}

interface SegmentPerformance {
  segmentId: string;
  segmentName: string;
  size: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  revenuePerEmail: number;
}

export class CampaignMonitorService {
  // Note: In production, this would connect to actual Campaign Monitor API
  // For MVP, we simulate with database queries

  async getCampaignMetrics(campaignId: string): Promise<EmailCampaign | null> {
    const result = await query(
      `SELECT
        id as campaignId, name as campaignName,
        sent_date as sentDate, recipient_count as recipientCount,
        ROUND(open_rate * 100, 2)::float as openRate,
        ROUND(click_rate * 100, 2)::float as clickRate,
        ROUND(unsubscribe_rate * 100, 2)::float as unsubscribeRate,
        ROUND(bounce_rate * 100, 2)::float as bounceRate,
        conversions, revenue, status
       FROM email_campaigns
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
  ): Promise<EmailCampaign[]> {
    const result = await query(
      `SELECT
        id as campaignId, name as campaignName,
        sent_date as sentDate, recipient_count as recipientCount,
        ROUND(open_rate * 100, 2)::float as openRate,
        ROUND(click_rate * 100, 2)::float as clickRate,
        ROUND(unsubscribe_rate * 100, 2)::float as unsubscribeRate,
        ROUND(bounce_rate * 100, 2)::float as bounceRate,
        conversions, revenue, status
       FROM email_campaigns
       WHERE company_id = $1
       AND sent_date >= $2
       AND sent_date <= $3
       ORDER BY sent_date DESC`,
      [companyId, startDate, endDate]
    );

    return result.rows;
  }

  async getListMetrics(listId: string): Promise<ListMetrics | null> {
    const result = await query(
      `SELECT
        id as listId, name as listName,
        subscriber_count as subscriberCount,
        ROUND(unsubscribe_rate * 100, 2)::float as unsubscribeRate,
        ROUND(bounce_rate * 100, 2)::float as bounceRate,
        ROUND(engagement_rate * 100, 2)::float as engagementRate
       FROM email_lists
       WHERE id = $1`,
      [listId]
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async getSegmentPerformance(listId: string): Promise<SegmentPerformance[]> {
    const result = await query(
      `SELECT
        id as segmentId, name as segmentName,
        size,
        ROUND(open_rate * 100, 2)::float as openRate,
        ROUND(click_rate * 100, 2)::float as clickRate,
        ROUND(conversion_rate * 100, 2)::float as conversionRate,
        ROUND(revenue_per_email, 2)::float as revenuePerEmail
       FROM email_segments
       WHERE list_id = $1
       ORDER BY revenue_per_email DESC`,
      [listId]
    );

    return result.rows;
  }

  async getDeliverabilityHealth(companyId: string): Promise<{
    avgBounceRate: number;
    avgUnsubscribeRate: number;
    avgComplaintRate: number;
    health: 'excellent' | 'good' | 'fair' | 'poor';
  }> {
    const result = await query(
      `SELECT
        AVG(bounce_rate)::float as avg_bounce,
        AVG(unsubscribe_rate)::float as avg_unsubscribe,
        AVG(complaint_rate)::float as avg_complaint
       FROM email_campaigns
       WHERE company_id = $1
       AND sent_date > NOW() - INTERVAL '90 days'`,
      [companyId]
    );

    const metrics = result.rows[0] || {};
    const avgBounce = (metrics.avg_bounce || 0) * 100;
    const avgUnsub = (metrics.avg_unsubscribe || 0) * 100;
    const avgComplaint = (metrics.avg_complaint || 0) * 100;

    let health: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (avgBounce < 2 && avgUnsub < 0.5 && avgComplaint < 0.1) {
      health = 'excellent';
    } else if (avgBounce > 5 || avgUnsub > 1 || avgComplaint > 0.2) {
      health = 'poor';
    } else if (avgBounce > 3 || avgUnsub > 0.8) {
      health = 'fair';
    }

    return {
      avgBounceRate: parseFloat(avgBounce.toFixed(2)),
      avgUnsubscribeRate: parseFloat(avgUnsub.toFixed(2)),
      avgComplaintRate: parseFloat(avgComplaint.toFixed(2)),
      health,
    };
  }

  async getOptimalSendTime(listId: string): Promise<{
    bestTime: string;
    bestDay: string;
    confidence: number;
    reasoning: string;
  }> {
    // Analyze historical performance by send time
    const result = await query(
      `SELECT
        EXTRACT(HOUR FROM sent_date) as hour,
        EXTRACT(DOW FROM sent_date) as dow,
        AVG(open_rate) as avg_open
       FROM email_campaigns
       WHERE list_id = $1
       GROUP BY hour, dow
       ORDER BY avg_open DESC
       LIMIT 1`,
      [listId]
    );

    if (result.rows.length === 0) {
      return {
        bestTime: '09:00 AM',
        bestDay: 'Tuesday',
        confidence: 0,
        reasoning: 'Insufficient data',
      };
    }

    const data = result.rows[0];
    const hours = [
      'Midnight',
      '1 AM',
      '2 AM',
      '3 AM',
      '4 AM',
      '5 AM',
      '6 AM',
      '7 AM',
      '8 AM',
      '9 AM',
      '10 AM',
      '11 AM',
      'Noon',
      '1 PM',
      '2 PM',
      '3 PM',
      '4 PM',
      '5 PM',
      '6 PM',
      '7 PM',
      '8 PM',
      '9 PM',
      '10 PM',
      '11 PM',
    ];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      bestTime: hours[data.hour],
      bestDay: days[data.dow],
      confidence: 65,
      reasoning: 'Based on historical open rates for this list',
    };
  }

  async recommendSubjectLines(campaignTopic: string): Promise<
    Array<{
      subject: string;
      expectedOpenRate: number;
      reasoning: string;
    }>
  > {
    // Simulate subject line recommendations based on historical performance
    return [
      {
        subject: `${campaignTopic} - Limited Time Offer`,
        expectedOpenRate: 28,
        reasoning: 'Urgency and specificity increase open rates',
      },
      {
        subject: `New: ${campaignTopic}`,
        expectedOpenRate: 24,
        reasoning: 'Novelty and news angle perform well',
      },
      {
        subject: `${campaignTopic} You Need to Know`,
        expectedOpenRate: 22,
        reasoning: 'Question-based subjects drive curiosity',
      },
    ];
  }

  async getUnsubscribeReasons(campaignId: string): Promise<
    Array<{
      reason: string;
      count: number;
      percentage: number;
    }>
  > {
    const result = await query(
      `SELECT reason, COUNT(*) as count
       FROM unsubscribe_events
       WHERE campaign_id = $1
       GROUP BY reason
       ORDER BY count DESC`,
      [campaignId]
    );

    if (result.rows.length === 0) {
      return [];
    }

    const total = result.rows.reduce((sum: number, row: any) => sum + row.count, 0);

    return result.rows.map((row: any) => ({
      reason: row.reason,
      count: row.count,
      percentage: Math.round((row.count / total) * 100),
    }));
  }
}

export const campaignMonitorService = new CampaignMonitorService();
