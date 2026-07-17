import { Router, Request, Response } from 'express';
import { outcomeTrackingService } from '../services/outcomeTrackingService.js';

const router = Router();

// Record task outcome
router.post('/', async (req: Request, res: Response) => {
  try {
    const { taskId, aiEmployeeId, aiName, decision, actualOutcome, confidence, timeToResolution, feedback } = req.body;

    if (!taskId || !aiEmployeeId || !decision || !actualOutcome) {
      return res.status(400).json({ error: 'taskId, aiEmployeeId, decision, and actualOutcome required' });
    }

    await outcomeTrackingService.recordOutcome({
      taskId,
      aiEmployeeId,
      aiName,
      decision,
      actualOutcome,
      confidence: confidence || 50,
      timeToResolution: timeToResolution || 0,
      feedback,
    });

    res.status(201).json({ success: true, message: 'Outcome recorded' });
  } catch (error) {
    console.error('Error recording outcome:', error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

// Get AI performance
router.get('/performance/:aiEmployeeId', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const performance = await outcomeTrackingService.getAIPerformance(aiEmployeeId);

    if (!performance) {
      return res.status(404).json({ error: 'No performance data found' });
    }

    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

// Get company-wide AI performance
router.get('/performance-summary/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const performance = await outcomeTrackingService.getCompanyAIPerformance(companyId);

    res.json(performance);
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

// Get learning patterns for an AI
router.get('/patterns/:aiEmployeeId', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const { limit } = req.query;

    const patterns = await outcomeTrackingService.getLearningPatterns(
      aiEmployeeId,
      parseInt(limit as string) || 10
    );

    res.json(patterns);
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch patterns' });
  }
});

// Get most common failures
router.get('/failures/:aiEmployeeId', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const { limit } = req.query;

    const failures = await outcomeTrackingService.getMostCommonFailures(
      aiEmployeeId,
      parseInt(limit as string) || 5
    );

    res.json(failures);
  } catch (error) {
    console.error('Error fetching failures:', error);
    res.status(500).json({ error: 'Failed to fetch failures' });
  }
});

// Get improved prompt recommendations
router.get('/improvements/:aiEmployeeId', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const improvements = await outcomeTrackingService.getImprovedPrompt(aiEmployeeId);

    res.json({ improvements });
  } catch (error) {
    console.error('Error generating improvements:', error);
    res.status(500).json({ error: 'Failed to generate improvements' });
  }
});

// Provide feedback on a decision
router.post('/:taskId/feedback', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { aiEmployeeId, feedback, score } = req.body;

    if (!aiEmployeeId || !score) {
      return res.status(400).json({ error: 'aiEmployeeId and score required' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: 'score must be between 1 and 5' });
    }

    await outcomeTrackingService.trackDecisionFeedback(taskId, aiEmployeeId, feedback || '', score);

    res.status(201).json({ success: true, message: 'Feedback recorded' });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

export default router;
