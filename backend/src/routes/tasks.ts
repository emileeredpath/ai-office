import { Router } from 'express';
import { getAllTasks } from '../db/taskRepository.js';

const router = Router();

// Plain read endpoint for the AI Office frontend itself (not Claude) to load
// tasks. All writes go exclusively through /api/actions so every mutation is
// validated, audited, and subject to the same confirmation rules regardless
// of whether it came from the dashboard or from Claude.
router.get('/', (_req, res) => {
  res.json({ success: true, result: getAllTasks() });
});

export default router;
