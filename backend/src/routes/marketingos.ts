import express, { Request, Response } from 'express';
import * as marketingRepo from '../db/marketingRepository.js';
import * as dashboardService from '../services/dashboardService.js';

const router = express.Router();

// Create marketing objective
router.post('/objectives', (req: Request, res: Response) => {
  try {
    const { brand, title, description, targetAudience, kpis, timeframe, budget } = req.body;

    if (!brand || !title || !description || !targetAudience || !kpis || !timeframe) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    if (!Array.isArray(kpis)) {
      res.status(400).json({ success: false, message: 'KPIs must be an array' });
      return;
    }

    const objective = marketingRepo.createObjective({
      brand,
      title,
      description,
      targetAudience,
      kpis,
      timeframe,
      budget
    });

    res.json({ success: true, result: objective });
  } catch (error) {
    console.error('Error creating objective:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get objective
router.get('/objectives/:id', (req: Request, res: Response) => {
  try {
    const objective = marketingRepo.getObjective(req.params.id);
    if (!objective) {
      res.status(404).json({ success: false, message: 'Objective not found' });
      return;
    }
    res.json({ success: true, result: objective });
  } catch (error) {
    console.error('Error fetching objective:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List objectives for brand
router.get('/objectives', (req: Request, res: Response) => {
  try {
    const { brand } = req.query;
    if (!brand || typeof brand !== 'string') {
      res.status(400).json({ success: false, message: 'Brand query parameter required' });
      return;
    }

    const objectives = marketingRepo.listObjectives(brand);
    res.json({ success: true, result: objectives });
  } catch (error) {
    console.error('Error listing objectives:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update objective
router.put('/objectives/:id', (req: Request, res: Response) => {
  try {
    const updated = marketingRepo.updateObjective(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Objective not found' });
      return;
    }
    res.json({ success: true, result: updated });
  } catch (error) {
    console.error('Error updating objective:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Generate dashboard
router.post('/generate-dashboard', async (req: Request, res: Response) => {
  try {
    const { objectiveId, marketAnalysis, competitors, assumptions } = req.body;

    if (!objectiveId) {
      res.status(400).json({ success: false, message: 'objectiveId required' });
      return;
    }

    const dashboard = await dashboardService.generateDashboard({
      objectiveId,
      marketAnalysis,
      competitors,
      assumptions
    });

    res.json({ success: true, result: dashboard });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ success: false, message });
  }
});

// Get latest context for objective
router.get('/context/:objectiveId', (req: Request, res: Response) => {
  try {
    const context = marketingRepo.getLatestContext(req.params.objectiveId);
    if (!context) {
      res.status(404).json({ success: false, message: 'Context not found' });
      return;
    }
    res.json({ success: true, result: context });
  } catch (error) {
    console.error('Error fetching context:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// List strategy snapshots
router.get('/snapshots/:objectiveId', (req: Request, res: Response) => {
  try {
    const snapshots = marketingRepo.listSnapshots(req.params.objectiveId);
    res.json({ success: true, result: snapshots });
  } catch (error) {
    console.error('Error listing snapshots:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
