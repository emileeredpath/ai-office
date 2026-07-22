import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { sandyService } from '../services/sandyService.js';

const router = Router();

// Get all conversations for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { companyId, userId, aiEmployeeId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    let queryStr = `SELECT c.id, c.title, c.status, c.ai_employee_id, c.user_id,
                          ai.name as ai_name, ai.emoji as ai_emoji,
                          u.name as user_name, c.created_at, c.updated_at
                   FROM conversations c
                   LEFT JOIN ai_employees ai ON c.ai_employee_id = ai.id
                   LEFT JOIN ai_employees u ON c.user_id = u.id
                   WHERE c.company_id = $1`;

    const params = [companyId];
    let paramIndex = 2;

    if (userId) {
      queryStr += ` AND c.user_id = $${paramIndex++}`;
      params.push(userId);
    }

    if (aiEmployeeId) {
      queryStr += ` AND c.ai_employee_id = $${paramIndex++}`;
      params.push(aiEmployeeId);
    }

    queryStr += ' ORDER BY c.updated_at DESC';

    const result = await query(queryStr, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get single conversation with messages
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const convResult = await query(
      `SELECT c.id, c.title, c.status, c.ai_employee_id, c.user_id,
              ai.name as ai_name, ai.emoji as ai_emoji,
              u.name as user_name, c.created_at, c.updated_at
       FROM conversations c
       LEFT JOIN ai_employees ai ON c.ai_employee_id = ai.id
       LEFT JOIN ai_employees u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const conversation = convResult.rows[0];

    // Get messages
    const messagesResult = await query(
      `SELECT m.id, m.sender_id, m.content, m.role, m.created_at,
              s.name as sender_name, s.emoji as sender_emoji
       FROM messages m
       LEFT JOIN ai_employees s ON m.sender_id = s.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json({
      ...conversation,
      messages: messagesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Create new conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId, aiEmployeeId, userId, title } = req.body;

    if (!companyId || !aiEmployeeId) {
      return res.status(400).json({ error: 'companyId and aiEmployeeId required' });
    }

    const result = await query(
      `INSERT INTO conversations (company_id, ai_employee_id, user_id, title)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, status, created_at`,
      [companyId, aiEmployeeId, userId || null, title || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send message and get AI response
router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { senderId, content } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ error: 'senderId and content required' });
    }

    // Get conversation to verify it exists and get AI employee info
    const convResult = await query('SELECT ai_employee_id FROM conversations WHERE id = $1', [id]);

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const aiEmployeeId = convResult.rows[0].ai_employee_id;

    // Save user message
    await query(
      `INSERT INTO messages (conversation_id, sender_id, content, role)
       VALUES ($1, $2, $3, $4)`,
      [id, senderId, content, 'user']
    );

    // Get conversation history for context
    const conversationHistory = await sandyService.getConversationContext(id);

    // Get company ID from conversation
    const convResult = await query(
      'SELECT company_id FROM conversations WHERE id = $1',
      [id]
    );
    const companyId = convResult.rows[0]?.company_id;

    // Generate Sandy's response
    const aiMessage = await sandyService.generateResponse(content, conversationHistory, companyId);

    // Save AI response
    const aiResponseResult = await query(
      `INSERT INTO messages (conversation_id, sender_id, content, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, content, role, created_at`,
      [id, aiEmployeeId, aiMessage, 'assistant']
    );

    // Update conversation updated_at
    await query('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

    res.status(201).json(aiResponseResult.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get team summary (for Sandy context)
router.get('/:id/team-summary', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.query.companyId as string;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const summary = await sandyService.getTeamSummary(companyId);
    res.json({ summary });
  } catch (error) {
    console.error('Error getting team summary:', error);
    res.status(500).json({ error: 'Failed to get team summary' });
  }
});

// Get task assignment suggestions
router.post('/:id/suggest-assignment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { taskTitle, companyId } = req.body;

    if (!taskTitle || !companyId) {
      return res.status(400).json({ error: 'taskTitle and companyId required' });
    }

    const suggestions = await sandyService.suggestTaskAssignment(taskTitle, companyId);
    res.json({ suggestions });
  } catch (error) {
    console.error('Error suggesting assignment:', error);
    res.status(500).json({ error: 'Failed to suggest assignment' });
  }
});

// Get specialist AI suggestion for a task
router.post('/:id/suggest-specialist-ai', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { taskTitle, taskDescription, companyId } = req.body;

    if (!taskTitle || !companyId) {
      return res.status(400).json({ error: 'taskTitle and companyId required' });
    }

    const suggestion = await sandyService.suggestSpecialistAI(
      taskTitle,
      taskDescription || '',
      companyId
    );

    res.json({ suggestion });
  } catch (error) {
    console.error('Error suggesting specialist AI:', error);
    res.status(500).json({ error: 'Failed to suggest specialist AI' });
  }
});

export default router;
