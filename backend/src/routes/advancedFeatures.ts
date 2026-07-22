import { Router, Request, Response } from 'express';
import { advancedFeaturesService } from '../services/advancedFeaturesService.js';

const router = Router();

// Task Templates

router.post('/company/:companyId/templates', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const template = await advancedFeaturesService.createTemplate(companyId, req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.get('/company/:companyId/templates', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const templates = await advancedFeaturesService.getTemplates(companyId);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

router.get('/templates/:templateId', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const template = await advancedFeaturesService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Task Collaborations

router.post('/task/:taskId/collaborators', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { specialistId, role } = req.body;

    if (!specialistId) {
      return res.status(400).json({ error: 'specialistId required' });
    }

    const collaboration = await advancedFeaturesService.addCollaborator(taskId, specialistId, role);
    res.status(201).json(collaboration);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    res.status(500).json({ error: 'Failed to add collaborator' });
  }
});

router.get('/task/:taskId/collaborators', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const collaborators = await advancedFeaturesService.getCollaborators(taskId);
    res.json(collaborators);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

// Specialist Performance

router.get('/specialist/:specialistId/performance', async (req: Request, res: Response) => {
  try {
    const { specialistId } = req.params;
    const { periodStart, periodEnd } = req.query;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd required' });
    }

    const performance = await advancedFeaturesService.getSpecialistPerformance(
      specialistId,
      periodStart as string,
      periodEnd as string
    );
    res.json(performance || { message: 'No performance data available' });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

router.post('/specialist/:specialistId/performance', async (req: Request, res: Response) => {
  try {
    const { specialistId } = req.params;
    const { periodStart, periodEnd, ...metrics } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd required' });
    }

    const performance = await advancedFeaturesService.updateSpecialistPerformance(
      specialistId,
      periodStart,
      periodEnd,
      metrics
    );
    res.status(201).json(performance);
  } catch (error) {
    console.error('Error updating performance:', error);
    res.status(500).json({ error: 'Failed to update performance' });
  }
});

router.get('/company/:companyId/team-performance', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { periodStart, periodEnd } = req.query;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'periodStart and periodEnd required' });
    }

    const performance = await advancedFeaturesService.getTeamPerformance(
      companyId,
      periodStart as string,
      periodEnd as string
    );
    res.json(performance);
  } catch (error) {
    console.error('Error fetching team performance:', error);
    res.status(500).json({ error: 'Failed to fetch team performance' });
  }
});

// Task Dependencies

router.post('/task/:taskId/dependencies', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { prerequisiteTaskId, dependencyType } = req.body;

    if (!prerequisiteTaskId) {
      return res.status(400).json({ error: 'prerequisiteTaskId required' });
    }

    const dependency = await advancedFeaturesService.addDependency(
      taskId,
      prerequisiteTaskId,
      dependencyType
    );
    res.status(201).json(dependency);
  } catch (error) {
    console.error('Error adding dependency:', error);
    res.status(500).json({ error: 'Failed to add dependency' });
  }
});

router.get('/task/:taskId/dependencies', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const dependencies = await advancedFeaturesService.getDependencies(taskId);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Task Analytics

router.post('/task/:taskId/analytics', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const analytics = await advancedFeaturesService.recordTaskAnalytics(taskId, req.body);
    res.status(201).json(analytics);
  } catch (error) {
    console.error('Error recording analytics:', error);
    res.status(500).json({ error: 'Failed to record analytics' });
  }
});

router.get('/task/:taskId/analytics', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const metrics = await advancedFeaturesService.getTaskMetrics(taskId);
    res.json(metrics || { message: 'No analytics available' });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/company/:companyId/analytics', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const analytics = await advancedFeaturesService.getCompanyAnalytics(companyId);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching company analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Scheduled Tasks

router.post('/company/:companyId/scheduled-tasks', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { templateId, cronExpression, createdById } = req.body;

    if (!templateId || !cronExpression) {
      return res.status(400).json({ error: 'templateId and cronExpression required' });
    }

    const scheduled = await advancedFeaturesService.createScheduledTask(
      companyId,
      templateId,
      cronExpression,
      createdById
    );
    res.status(201).json(scheduled);
  } catch (error) {
    console.error('Error creating scheduled task:', error);
    res.status(500).json({ error: 'Failed to create scheduled task' });
  }
});

router.get('/company/:companyId/scheduled-tasks', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const scheduled = await advancedFeaturesService.getScheduledTasks(companyId);
    res.json(scheduled);
  } catch (error) {
    console.error('Error fetching scheduled tasks:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled tasks' });
  }
});

// Escalation Rules

router.post('/company/:companyId/escalation-rules', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const rule = await advancedFeaturesService.createEscalationRule(companyId, req.body);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating escalation rule:', error);
    res.status(500).json({ error: 'Failed to create escalation rule' });
  }
});

router.get('/company/:companyId/escalation-rules', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const rules = await advancedFeaturesService.getEscalationRules(companyId);
    res.json(rules);
  } catch (error) {
    console.error('Error fetching escalation rules:', error);
    res.status(500).json({ error: 'Failed to fetch escalation rules' });
  }
});

export default router;
