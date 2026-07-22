import { Router, Request, Response } from 'express';
import { acumaticaService } from '../services/acumaticaService.js';
import { ga4Service } from '../services/ga4Service.js';
import { campaignMonitorService } from '../services/campaignMonitorService.js';

const router = Router();

// ============================================================================
// ACUMATICA (ERP/Financial) Routes
// ============================================================================

// Get invoice details
router.get('/acumatica/invoices/:invoiceId', async (req: Request, res: Response) => {
  try {
    const { invoiceId } = req.params;
    const invoice = await acumaticaService.getInvoice(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Get vendor details
router.get('/acumatica/vendors/:vendorId', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const vendor = await acumaticaService.getVendor(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// Get vendor approval status
router.get('/acumatica/vendors/:vendorId/approval-status', async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    const status = await acumaticaService.getVendorApprovalStatus(vendorId);
    res.json(status);
  } catch (error) {
    console.error('Error fetching approval status:', error);
    res.status(500).json({ error: 'Failed to fetch approval status' });
  }
});

// Get invoice metrics for company
router.get('/acumatica/metrics', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const metrics = await acumaticaService.getInvoiceMetrics(companyId as string);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ============================================================================
// GA4 (Analytics) Routes
// ============================================================================

// Get campaign metrics
router.get('/ga4/campaigns/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const metrics = await ga4Service.getCampaignMetrics(campaignId);

    if (!metrics) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    res.status(500).json({ error: 'Failed to fetch campaign metrics' });
  }
});

// Get campaigns by period
router.get('/ga4/campaigns', async (req: Request, res: Response) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({ error: 'companyId, startDate, and endDate required' });
    }

    const campaigns = await ga4Service.getCampaignsByPeriod(
      companyId as string,
      startDate as string,
      endDate as string
    );

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get traffic sources
router.get('/ga4/traffic-sources', async (req: Request, res: Response) => {
  try {
    const { companyId, days } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const sources = await ga4Service.getTrafficSources(companyId as string, parseInt(days as string) || 30);
    res.json(sources);
  } catch (error) {
    console.error('Error fetching traffic sources:', error);
    res.status(500).json({ error: 'Failed to fetch traffic sources' });
  }
});

// Get trend analysis
router.get('/ga4/trends', async (req: Request, res: Response) => {
  try {
    const { companyId, metric, days } = req.query;

    if (!companyId || !metric) {
      return res.status(400).json({ error: 'companyId and metric required' });
    }

    const trends = await ga4Service.getTrendAnalysis(
      companyId as string,
      metric as string,
      parseInt(days as string) || 30
    );

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

// Predict ROI for campaign
router.get('/ga4/campaigns/:campaignId/roi-prediction', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const prediction = await ga4Service.predictROI(campaignId);
    res.json(prediction);
  } catch (error) {
    console.error('Error predicting ROI:', error);
    res.status(500).json({ error: 'Failed to predict ROI' });
  }
});

// Get anomalies
router.get('/ga4/anomalies', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const anomalies = await ga4Service.getAnomalies(companyId as string);
    res.json(anomalies);
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

// ============================================================================
// Campaign Monitor (Email Marketing) Routes
// ============================================================================

// Get email campaign metrics
router.get('/campaign-monitor/campaigns/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const metrics = await campaignMonitorService.getCampaignMetrics(campaignId);

    if (!metrics) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching email campaign:', error);
    res.status(500).json({ error: 'Failed to fetch email campaign' });
  }
});

// Get email campaigns by period
router.get('/campaign-monitor/campaigns', async (req: Request, res: Response) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId || !startDate || !endDate) {
      return res.status(400).json({ error: 'companyId, startDate, and endDate required' });
    }

    const campaigns = await campaignMonitorService.getCampaignsByPeriod(
      companyId as string,
      startDate as string,
      endDate as string
    );

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching email campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch email campaigns' });
  }
});

// Get list metrics
router.get('/campaign-monitor/lists/:listId', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const metrics = await campaignMonitorService.getListMetrics(listId);

    if (!metrics) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching list metrics:', error);
    res.status(500).json({ error: 'Failed to fetch list metrics' });
  }
});

// Get segment performance
router.get('/campaign-monitor/segments/:listId', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const segments = await campaignMonitorService.getSegmentPerformance(listId);
    res.json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Failed to fetch segments' });
  }
});

// Get deliverability health
router.get('/campaign-monitor/health', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const health = await campaignMonitorService.getDeliverabilityHealth(companyId as string);
    res.json(health);
  } catch (error) {
    console.error('Error fetching health:', error);
    res.status(500).json({ error: 'Failed to fetch health' });
  }
});

// Get optimal send time
router.get('/campaign-monitor/send-time/:listId', async (req: Request, res: Response) => {
  try {
    const { listId } = req.params;
    const sendTime = await campaignMonitorService.getOptimalSendTime(listId);
    res.json(sendTime);
  } catch (error) {
    console.error('Error getting send time:', error);
    res.status(500).json({ error: 'Failed to get send time' });
  }
});

// Get subject line recommendations
router.post('/campaign-monitor/subject-lines', async (req: Request, res: Response) => {
  try {
    const { campaignTopic } = req.body;

    if (!campaignTopic) {
      return res.status(400).json({ error: 'campaignTopic required' });
    }

    const recommendations = await campaignMonitorService.recommendSubjectLines(campaignTopic);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Get unsubscribe reasons
router.get('/campaign-monitor/unsubscribe-reasons/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const reasons = await campaignMonitorService.getUnsubscribeReasons(campaignId);
    res.json(reasons);
  } catch (error) {
    console.error('Error fetching unsubscribe reasons:', error);
    res.status(500).json({ error: 'Failed to fetch unsubscribe reasons' });
  }
});

export default router;
