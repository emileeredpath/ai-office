import { Router, Request, Response } from 'express';
import { integrationService } from '../services/integrationService.js';

const router = Router();

// Integration Configuration

router.post('/company/:companyId/integrations/:systemType', async (req: Request, res: Response) => {
  try {
    const { companyId, systemType } = req.params;
    const config = req.body;

    const integration = await integrationService.saveIntegration(companyId, systemType, config);
    res.status(201).json(integration);
  } catch (error) {
    console.error('Error saving integration:', error);
    res.status(500).json({ error: 'Failed to save integration' });
  }
});

router.get('/company/:companyId/integrations', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const integrations = await integrationService.getIntegrations(companyId);
    res.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

router.get('/company/:companyId/integrations/:systemType', async (req: Request, res: Response) => {
  try {
    const { companyId, systemType } = req.params;
    const integration = await integrationService.getIntegration(companyId, systemType);

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json(integration);
  } catch (error) {
    console.error('Error fetching integration:', error);
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
});

// Sync History

router.get('/company/:companyId/sync-history', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { systemType, limit } = req.query;

    const history = await integrationService.getSyncHistory(
      companyId,
      systemType as string | undefined,
      parseInt(limit as string) || 10
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching sync history:', error);
    res.status(500).json({ error: 'Failed to fetch sync history' });
  }
});

// Acumatica Sync (ERP)

router.post('/company/:companyId/sync/acumatica/vendors', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { vendors } = req.body;

    const synced = await integrationService.syncVendors(companyId, vendors);

    await integrationService.recordSync(companyId, 'acumatica', 'pull', 'success', synced.length, {
      type: 'vendors_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing vendors:', error);
    res.status(500).json({ error: 'Failed to sync vendors' });
  }
});

router.post('/company/:companyId/sync/acumatica/invoices', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { invoices } = req.body;

    const synced = await integrationService.syncInvoices(companyId, invoices);

    await integrationService.recordSync(companyId, 'acumatica', 'pull', 'success', synced.length, {
      type: 'invoices_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing invoices:', error);
    res.status(500).json({ error: 'Failed to sync invoices' });
  }
});

// Campaign Monitor Sync (Email Marketing)

router.post('/company/:companyId/sync/campaign-monitor/campaigns', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { campaigns } = req.body;

    const synced = await integrationService.syncEmailCampaigns(companyId, campaigns);

    await integrationService.recordSync(companyId, 'campaign_monitor', 'pull', 'success', synced.length, {
      type: 'email_campaigns_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing email campaigns:', error);
    res.status(500).json({ error: 'Failed to sync email campaigns' });
  }
});

router.post('/company/:companyId/sync/campaign-monitor/lists', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { lists } = req.body;

    const synced = await integrationService.syncEmailLists(companyId, lists);

    await integrationService.recordSync(companyId, 'campaign_monitor', 'pull', 'success', synced.length, {
      type: 'email_lists_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing email lists:', error);
    res.status(500).json({ error: 'Failed to sync email lists' });
  }
});

// GA4 Sync (Analytics)

router.post('/company/:companyId/sync/ga4/metrics', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { metrics } = req.body;

    const synced = await integrationService.syncDailyMetrics(companyId, metrics);

    await integrationService.recordSync(companyId, 'ga4', 'pull', 'success', synced.length, {
      type: 'daily_metrics_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing GA4 metrics:', error);
    res.status(500).json({ error: 'Failed to sync GA4 metrics' });
  }
});

router.post('/company/:companyId/sync/ga4/traffic', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { trafficData } = req.body;

    const synced = await integrationService.syncTrafficSources(companyId, trafficData);

    await integrationService.recordSync(companyId, 'ga4', 'pull', 'success', synced.length, {
      type: 'traffic_sources_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing traffic sources:', error);
    res.status(500).json({ error: 'Failed to sync traffic sources' });
  }
});

router.post('/company/:companyId/sync/ga4/campaigns', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { campaigns } = req.body;

    const synced = await integrationService.syncCampaigns(companyId, campaigns);

    await integrationService.recordSync(companyId, 'ga4', 'pull', 'success', synced.length, {
      type: 'campaigns_synced',
    });

    res.json({ synced: synced.length, records: synced });
  } catch (error) {
    console.error('Error syncing campaigns:', error);
    res.status(500).json({ error: 'Failed to sync campaigns' });
  }
});

// Integration Context (for specialists)

router.get('/company/:companyId/integration-context', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const context = await integrationService.getIntegrationContext(companyId);
    res.json(context);
  } catch (error) {
    console.error('Error fetching integration context:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

// Integration Alerts

router.get('/company/:companyId/alerts', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { unresolvedOnly } = req.query;

    const alerts = await integrationService.getIntegrationAlerts(
      companyId,
      unresolvedOnly !== 'false'
    );
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.post('/alerts/:alertId/resolve', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const alert = await integrationService.resolveAlert(alertId);
    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

export default router;
