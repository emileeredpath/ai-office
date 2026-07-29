import { Router } from 'express';
import { z } from 'zod';
import { executeAction, getAuditLog } from '../services/actionService.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

const WRITE_ACTIONS = new Set(['create_task', 'update_task', 'complete_task']);

const actionRequestSchema = z.object({
  action: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  source: z
    .object({
      type: z.string(),
      conversation_id: z.string().optional(),
    })
    .optional(),
  request_id: z.string().max(200).optional(),
  confirmed: z.boolean().optional(),
});

router.post('/', rateLimit, (req, res) => {
  const parsed = actionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: 'Malformed request.',
      error: parsed.error.issues.map((i) => i.message).join('; '),
    });
    return;
  }

  const { action, payload, source, request_id, confirmed } = parsed.data;

  if (WRITE_ACTIONS.has(action) && req.sessionRole !== 'edit') {
    res.status(403).json({ success: false, action, message: 'View-only access — this action requires edit access.' });
    return;
  }

  try {
    const result = executeAction({
      action,
      payload,
      source: source ? { type: source.type, conversationId: source.conversation_id } : undefined,
      request_id,
      confirmed,
    });
    res.status(result.success || result.requires_confirmation ? 200 : 400).json(result);
  } catch (err) {
    // Never leak internal error details (stack traces, SQL, file paths) to the caller.
    console.error('Action execution failed:', err);
    res.status(500).json({ success: false, action, message: 'Something went wrong processing that action.' });
  }
});

router.get('/audit-log', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({ success: true, result: getAuditLog(limit) });
});

export default router;
