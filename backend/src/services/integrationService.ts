import { query } from '../db/connection.js';

export class IntegrationService {
  // External System Configuration

  async saveIntegration(
    companyId: string,
    systemType: string,
    config: {
      apiKey?: string;
      apiUrl?: string;
      username?: string;
      password?: string;
      accessToken?: string;
      refreshToken?: string;
      customSettings?: any;
    }
  ) {
    const result = await query(
      `INSERT INTO integrations (company_id, system_type, config, is_active)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, system_type) DO UPDATE
       SET config = $3, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [companyId, systemType, JSON.stringify(config), true]
    );
    return result.rows[0];
  }

  async getIntegration(companyId: string, systemType: string) {
    const result = await query(
      `SELECT * FROM integrations WHERE company_id = $1 AND system_type = $2`,
      [companyId, systemType]
    );
    return result.rows[0];
  }

  async getIntegrations(companyId: string) {
    const result = await query(
      `SELECT * FROM integrations WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  // Sync History Tracking

  async recordSync(
    companyId: string,
    systemType: string,
    syncType: string,
    status: string,
    recordsProcessed: number,
    details?: any
  ) {
    const result = await query(
      `INSERT INTO sync_history (company_id, system_type, sync_type, status, records_processed, details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [companyId, systemType, syncType, status, recordsProcessed, JSON.stringify(details || {})]
    );
    return result.rows[0];
  }

  async getSyncHistory(companyId: string, systemType?: string, limit: number = 10) {
    let sql =
      `SELECT * FROM sync_history WHERE company_id = $1` +
      (systemType ? ` AND system_type = $2` : '') +
      ` ORDER BY created_at DESC LIMIT $` +
      (systemType ? '3' : '2');

    const params = systemType ? [companyId, systemType, limit] : [companyId, limit];
    const result = await query(sql, params);
    return result.rows;
  }

  // Acumatica Integration (ERP - Vendors, Invoices, Cost Centers)

  async syncVendors(companyId: string, vendors: any[]) {
    const results = [];

    for (const vendor of vendors) {
      const result = await query(
        `INSERT INTO vendors (company_id, name, email, is_approved, payment_terms)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (company_id, name) DO UPDATE
         SET email = $3, is_approved = $4, payment_terms = $5, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [companyId, vendor.name, vendor.email, vendor.isApproved || false, vendor.paymentTerms]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  async syncInvoices(companyId: string, invoices: any[]) {
    const results = [];

    for (const invoice of invoices) {
      // Find or create vendor
      const vendorResult = await query(
        `SELECT id FROM vendors WHERE company_id = $1 AND name = $2 LIMIT 1`,
        [companyId, invoice.vendorName]
      );

      const vendorId = vendorResult.rows[0]?.id;

      if (vendorId) {
        const result = await query(
          `INSERT INTO invoices
           (company_id, vendor_id, vendor_name, amount, description, cost_center, due_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (company_id, vendor_id) DO UPDATE
           SET amount = $4, status = $8, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [
            companyId,
            vendorId,
            invoice.vendorName,
            invoice.amount,
            invoice.description,
            invoice.costCenter,
            invoice.dueDate,
            invoice.status || 'open',
          ]
        );
        results.push(result.rows[0]);
      }
    }

    return results;
  }

  async getCostCenters(companyId: string) {
    const result = await query(
      `SELECT * FROM cost_centers WHERE company_id = $1 ORDER BY code`,
      [companyId]
    );
    return result.rows;
  }

  // Campaign Monitor Integration (Email Marketing)

  async syncEmailCampaigns(companyId: string, campaigns: any[]) {
    const results = [];

    for (const campaign of campaigns) {
      const result = await query(
        `INSERT INTO email_campaigns
         (company_id, name, sent_date, recipient_count, open_rate, click_rate, conversions, revenue, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (company_id, name) DO UPDATE
         SET sent_date = $3, recipient_count = $4, open_rate = $5, click_rate = $6,
             conversions = $7, revenue = $8, status = $9, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          companyId,
          campaign.name,
          campaign.sentDate,
          campaign.recipientCount || 0,
          campaign.openRate || 0,
          campaign.clickRate || 0,
          campaign.conversions || 0,
          campaign.revenue || 0,
          campaign.status || 'draft',
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  async syncEmailLists(companyId: string, lists: any[]) {
    const results = [];

    for (const list of lists) {
      const result = await query(
        `INSERT INTO email_lists
         (company_id, name, subscriber_count, engagement_rate)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, name) DO UPDATE
         SET subscriber_count = $3, engagement_rate = $4, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [companyId, list.name, list.subscriberCount || 0, list.engagementRate || 0]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  // GA4 Integration (Analytics)

  async syncDailyMetrics(companyId: string, metrics: any[]) {
    const results = [];

    for (const metric of metrics) {
      const result = await query(
        `INSERT INTO daily_metrics
         (company_id, date, sessions, users, pageviews, bounce_rate, conversions, revenue)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (company_id, date) DO UPDATE
         SET sessions = $3, users = $4, pageviews = $5, bounce_rate = $6,
             conversions = $7, revenue = $8
         RETURNING *`,
        [
          companyId,
          metric.date,
          metric.sessions || 0,
          metric.users || 0,
          metric.pageviews || 0,
          metric.bounceRate || 0,
          metric.conversions || 0,
          metric.revenue || 0,
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  async syncTrafficSources(companyId: string, trafficData: any[]) {
    const results = [];

    for (const traffic of trafficData) {
      const result = await query(
        `INSERT INTO traffic_sources
         (company_id, date, source, medium, sessions, users, bounce_rate, conversion_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (company_id, date, source, medium) DO UPDATE
         SET sessions = $5, users = $6, bounce_rate = $7, conversion_rate = $8
         RETURNING *`,
        [
          companyId,
          traffic.date,
          traffic.source || 'direct',
          traffic.medium || 'organic',
          traffic.sessions || 0,
          traffic.users || 0,
          traffic.bounceRate || 0,
          traffic.conversionRate || 0,
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  async syncCampaigns(companyId: string, campaigns: any[]) {
    const results = [];

    for (const campaign of campaigns) {
      const result = await query(
        `INSERT INTO campaigns
         (company_id, name, start_date, end_date, impressions, clicks, conversions, spend, revenue)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (company_id, name) DO UPDATE
         SET start_date = $3, end_date = $4, impressions = $5, clicks = $6,
             conversions = $7, spend = $8, revenue = $9, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          companyId,
          campaign.name,
          campaign.startDate,
          campaign.endDate,
          campaign.impressions || 0,
          campaign.clicks || 0,
          campaign.conversions || 0,
          campaign.spend || 0,
          campaign.revenue || 0,
        ]
      );
      results.push(result.rows[0]);
    }

    return results;
  }

  // Data Mapping and Context Building

  async getIntegrationContext(companyId: string) {
    // Fetch key data from all integrated systems
    const [vendors, campaigns, emailCampaigns, dailyMetrics, trafficSources, costCenters] =
      await Promise.all([
        query(
          `SELECT name, email, is_approved FROM vendors WHERE company_id = $1 AND is_active = TRUE LIMIT 10`,
          [companyId]
        ),
        query(`SELECT name, revenue, conversions FROM campaigns WHERE company_id = $1 ORDER BY created_at DESC LIMIT 5`, [
          companyId,
        ]),
        query(
          `SELECT name, open_rate, click_rate, conversions FROM email_campaigns WHERE company_id = $1 ORDER BY sent_date DESC LIMIT 5`,
          [companyId]
        ),
        query(
          `SELECT date, sessions, conversions, revenue FROM daily_metrics WHERE company_id = $1 ORDER BY date DESC LIMIT 7`,
          [companyId]
        ),
        query(
          `SELECT source, medium, sessions, conversion_rate FROM traffic_sources WHERE company_id = $1 ORDER BY created_at DESC LIMIT 10`,
          [companyId]
        ),
        query(`SELECT code, name, budget, spent FROM cost_centers WHERE company_id = $1 AND is_active = TRUE LIMIT 5`, [
          companyId,
        ]),
      ]);

    return {
      vendors: vendors.rows,
      campaigns: campaigns.rows,
      emailCampaigns: emailCampaigns.rows,
      dailyMetrics: dailyMetrics.rows,
      trafficSources: trafficSources.rows,
      costCenters: costCenters.rows,
    };
  }

  // Real-time Alerts and Notifications

  async createIntegrationAlert(
    companyId: string,
    alertType: string,
    message: string,
    sourceSystem: string,
    priority: string = 'normal'
  ) {
    const result = await query(
      `INSERT INTO integration_alerts (company_id, alert_type, message, source_system, priority, is_resolved)
       VALUES ($1, $2, $3, $4, $5, FALSE)
       RETURNING *`,
      [companyId, alertType, message, sourceSystem, priority]
    );
    return result.rows[0];
  }

  async getIntegrationAlerts(companyId: string, unresolvedOnly: boolean = true) {
    const sql =
      `SELECT * FROM integration_alerts WHERE company_id = $1` +
      (unresolvedOnly ? ` AND is_resolved = FALSE` : '') +
      ` ORDER BY created_at DESC`;

    const result = await query(sql, [companyId]);
    return result.rows;
  }

  async resolveAlert(alertId: string) {
    const result = await query(
      `UPDATE integration_alerts SET is_resolved = TRUE, resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [alertId]
    );
    return result.rows[0];
  }
}

export const integrationService = new IntegrationService();
