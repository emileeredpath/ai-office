import { Router, type Request, type Response } from 'express';
import { getTasksFiltered, deleteTaskRow } from '../db/taskRepository.js';
import { executeAction } from '../services/actionService.js';
import { requireEdit } from '../middleware/session.js';

const router = Router();

// Reads for the AI Office frontend itself (not Claude). Supports the same
// filters the brief calls for so the Campaigns page can ask for just its
// own tasks instead of filtering client-side.
router.get('/', (req: Request, res: Response) => {
  const { campaign_id, brand } = req.query;
  const tasks = getTasksFiltered({
    campaignId: typeof campaign_id === 'string' ? campaign_id : undefined,
    brand: typeof brand === 'string' ? brand : undefined,
  });
  res.json({ success: true, result: tasks });
});

// Writes go through the same executeAction() used by /api/actions and the
// MCP tools — same validation, duplicate detection, and audit log,
// regardless of whether the call came in as a REST verb or an action name.
router.post('/', requireEdit, (req: Request, res: Response) => {
  const result = executeAction({
    action: 'create_task',
    payload: req.body,
    source: { type: 'dashboard' },
  });
  res.status(result.success ? 201 : 400).json(result);
});

router.patch('/:id', requireEdit, (req: Request, res: Response) => {
  const result = executeAction({
    action: 'update_task',
    payload: { ...req.body, task_id: req.params.id },
    source: { type: 'dashboard' },
    confirmed: true,
  });
  res.status(result.success ? 200 : 400).json(result);
});

router.delete('/:id', requireEdit, (req: Request, res: Response) => {
  const deleted = deleteTaskRow(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Task not found.' });
    return;
  }
  res.json({ success: true, message: 'Task deleted.' });
});

export default router;
