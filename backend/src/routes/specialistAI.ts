import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { specialistAIService } from '../services/specialistAIService.js';

const router = Router();

// Get specialist AI capabilities
router.get('/:aiEmployeeId/capabilities', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;

    // Get AI employee details
    const aiResult = await query(
      `SELECT name FROM ai_employees WHERE id = $1`,
      [aiEmployeeId]
    );

    if (aiResult.rows.length === 0) {
      return res.status(404).json({ error: 'AI employee not found' });
    }

    const aiName = aiResult.rows[0].name;
    const capabilities = await specialistAIService.getAICapabilities(aiName);

    res.json(capabilities);
  } catch (error) {
    console.error('Error fetching capabilities:', error);
    res.status(500).json({ error: 'Failed to fetch capabilities' });
  }
});

// Process a task with specialist AI
router.post('/:aiEmployeeId/process-task', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId required' });
    }

    // Get AI employee details
    const aiResult = await query(
      `SELECT name FROM ai_employees WHERE id = $1`,
      [aiEmployeeId]
    );

    if (aiResult.rows.length === 0) {
      return res.status(404).json({ error: 'AI employee not found' });
    }

    const aiName = aiResult.rows[0].name;

    // Get task details
    const taskResult = await query(
      `SELECT id, title, description, priority, status FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Process task with specialist AI
    const aiDecision = await specialistAIService.processTaskForAI(
      task.id,
      task.title,
      task.description,
      aiName,
      aiEmployeeId
    );

    // Update task status based on AI decision
    let newStatus = task.status;
    if (aiDecision.status === 'approved') {
      newStatus = 'in_progress';
    } else if (aiDecision.status === 'rejected') {
      newStatus = 'blocked';
    } else if (aiDecision.status === 'pending_review') {
      newStatus = 'pending_review';
    }

    await query(
      `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newStatus, taskId]
    );

    // Record the AI decision as a task note
    await query(
      `INSERT INTO task_notes (task_id, content, created_by)
       VALUES ($1, $2, $3)`,
      [taskId, `[${aiName}] ${aiDecision.status.toUpperCase()}: ${aiDecision.reason}`, aiEmployeeId]
    );

    res.json({
      taskId,
      aiName,
      decision: aiDecision.status,
      reason: aiDecision.reason,
      recommendation: aiDecision.recommendation,
      newStatus,
    });
  } catch (error) {
    console.error('Error processing task:', error);
    res.status(500).json({ error: 'Failed to process task' });
  }
});

// Delegate task to specialist AI (Sandy delegates)
router.post('/:aiEmployeeId/delegate-task', async (req: Request, res: Response) => {
  try {
    const { aiEmployeeId } = req.params;
    const { taskId, reason } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'taskId required' });
    }

    // Get AI employee details
    const aiResult = await query(
      `SELECT name FROM ai_employees WHERE id = $1`,
      [aiEmployeeId]
    );

    if (aiResult.rows.length === 0) {
      return res.status(404).json({ error: 'AI employee not found' });
    }

    const aiName = aiResult.rows[0].name;

    // Assign task to specialist AI
    await query(
      `UPDATE tasks SET employee_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [aiEmployeeId, taskId]
    );

    // Record delegation in task notes
    await query(
      `INSERT INTO task_notes (task_id, content, created_by)
       VALUES ($1, $2, $3)`,
      [taskId, `Delegated to ${aiName}${reason ? ': ' + reason : ''}`, aiEmployeeId]
    );

    // Immediately process the task with the specialist AI
    const taskResult = await query(
      `SELECT id, title, description FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];
      const aiDecision = await specialistAIService.processTaskForAI(
        task.id,
        task.title,
        task.description,
        aiName,
        aiEmployeeId
      );

      // Update task status based on AI decision
      let newStatus = 'assigned';
      if (aiDecision.status === 'approved') {
        newStatus = 'in_progress';
      } else if (aiDecision.status === 'rejected') {
        newStatus = 'blocked';
      } else if (aiDecision.status === 'pending_review') {
        newStatus = 'pending_review';
      }

      await query(
        `UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStatus, taskId]
      );

      // Record AI decision as a task note
      await query(
        `INSERT INTO task_notes (task_id, content, created_by)
         VALUES ($1, $2, $3)`,
        [taskId, `[${aiName}] ${aiDecision.status.toUpperCase()}: ${aiDecision.reason}`, aiEmployeeId]
      );
    }

    res.json({
      taskId,
      aiName,
      message: `Task delegated to ${aiName}`,
    });
  } catch (error) {
    console.error('Error delegating task:', error);
    res.status(500).json({ error: 'Failed to delegate task' });
  }
});

export default router;
