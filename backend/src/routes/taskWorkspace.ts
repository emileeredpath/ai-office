import { Router, Request, Response } from 'express';
import { taskWorkspaceService } from '../services/taskWorkspaceService.js';
import { specialistService } from '../services/specialistService.js';
import { query } from '../db/connection.js';

const router = Router();

// Get task workspace (all sections)
router.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const workspace = await taskWorkspaceService.getTaskWorkspace(taskId);
    res.json(workspace);
  } catch (error) {
    console.error('Error fetching task workspace:', error);
    res.status(500).json({ error: 'Failed to fetch task workspace' });
  }
});

// Delegate task to specialist
router.post('/:taskId/delegate', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { employeeId, delegatedById } = req.body;

    if (!employeeId || !delegatedById) {
      return res.status(400).json({ error: 'employeeId and delegatedById required' });
    }

    const result = await taskWorkspaceService.delegateTask(taskId, employeeId, delegatedById);
    res.json(result);
  } catch (error) {
    console.error('Error delegating task:', error);
    res.status(500).json({ error: 'Failed to delegate task' });
  }
});

// Get task conversation
router.get('/:taskId/conversation', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT tc.*, ae.name as delegated_to_name, ae.emoji
       FROM task_conversations tc
       LEFT JOIN ai_employees ae ON tc.delegated_to_id = ae.id
       WHERE tc.task_id = $1`,
      [taskId]
    );

    res.json(result.rows[0] || null);
  } catch (error) {
    console.error('Error fetching task conversation:', error);
    res.status(500).json({ error: 'Failed to fetch task conversation' });
  }
});

// Get task messages
router.get('/:taskId/messages', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT tm.*, ae.name, ae.emoji
       FROM task_messages tm
       JOIN task_conversations tc ON tm.task_conversation_id = tc.id
       LEFT JOIN ai_employees ae ON tm.sender_id = ae.id
       WHERE tc.task_id = $1
       ORDER BY tm.created_at ASC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching task messages:', error);
    res.status(500).json({ error: 'Failed to fetch task messages' });
  }
});

// Add message to task conversation
router.post('/:taskId/messages', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { senderId, content, role } = req.body;

    if (!senderId || !content || !role) {
      return res.status(400).json({ error: 'senderId, content, and role required' });
    }

    // Get task conversation
    const convResult = await query(
      `SELECT id FROM task_conversations WHERE task_id = $1`,
      [taskId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task conversation not found' });
    }

    const message = await taskWorkspaceService.addTaskMessage(
      convResult.rows[0].id,
      senderId,
      content,
      role as 'user' | 'assistant'
    );

    // Get message with sender details
    const detailResult = await query(
      `SELECT tm.*, ae.name, ae.emoji
       FROM task_messages tm
       LEFT JOIN ai_employees ae ON tm.sender_id = ae.id
       WHERE tm.id = $1`,
      [message.id]
    );

    res.status(201).json(detailResult.rows[0]);
  } catch (error) {
    console.error('Error adding task message:', error);
    res.status(500).json({ error: 'Failed to add message' });
  }
});

// Create draft from message
router.post('/:taskId/drafts', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { title, content, createdById, messageId } = req.body;

    if (!title || !content || !createdById) {
      return res.status(400).json({ error: 'title, content, and createdById required' });
    }

    const draft = await taskWorkspaceService.createDraft(
      taskId,
      messageId || null,
      title,
      content,
      createdById
    );

    res.status(201).json(draft);
  } catch (error) {
    console.error('Error creating draft:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Get task drafts
router.get('/:taskId/drafts', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT td.*, ae.name as created_by_name
       FROM task_drafts td
       LEFT JOIN ai_employees ae ON td.created_by_id = ae.id
       WHERE td.task_id = $1
       ORDER BY td.version DESC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Approve draft as output
router.post('/:taskId/outputs/approve', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { draftId, approvedById, outputType } = req.body;

    if (!draftId || !approvedById) {
      return res.status(400).json({ error: 'draftId and approvedById required' });
    }

    const output = await taskWorkspaceService.approveDraft(
      taskId,
      draftId,
      approvedById,
      outputType || 'document'
    );

    res.status(201).json(output);
  } catch (error) {
    console.error('Error approving draft:', error);
    res.status(500).json({ error: 'Failed to approve draft' });
  }
});

// Get task outputs
router.get('/:taskId/outputs', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT to_out.*,
              creator.name as created_by_name,
              approver.name as approved_by_name
       FROM task_outputs to_out
       LEFT JOIN ai_employees creator ON to_out.created_by_id = creator.id
       LEFT JOIN ai_employees approver ON to_out.approved_by_id = approver.id
       WHERE to_out.task_id = $1
       ORDER BY to_out.created_at DESC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching outputs:', error);
    res.status(500).json({ error: 'Failed to fetch outputs' });
  }
});

// Upload file to task
router.post('/:taskId/files', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { fileName, fileType, filePath, fileSize, uploadedById } = req.body;

    if (!fileName || !filePath || !uploadedById) {
      return res.status(400).json({ error: 'fileName, filePath, and uploadedById required' });
    }

    const file = await taskWorkspaceService.uploadFile(
      taskId,
      fileName,
      fileType || 'document',
      filePath,
      fileSize || 0,
      uploadedById
    );

    res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Get task files
router.get('/:taskId/files', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT tf.*, ae.name as uploaded_by_name
       FROM task_files tf
       LEFT JOIN ai_employees ae ON tf.uploaded_by_id = ae.id
       WHERE tf.task_id = $1
       ORDER BY tf.created_at DESC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Update task status
router.put('/:taskId/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { status, updatedById } = req.body;

    if (!status || !updatedById) {
      return res.status(400).json({ error: 'status and updatedById required' });
    }

    const result = await taskWorkspaceService.updateTaskStatus(taskId, status, updatedById);
    res.json(result);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Get task history
router.get('/:taskId/history', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const result = await query(
      `SELECT th.*, ae.name as actor_name
       FROM task_history th
       LEFT JOIN ai_employees ae ON th.actor_id = ae.id
       WHERE th.task_id = $1
       ORDER BY th.created_at DESC`,
      [taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching task history:', error);
    res.status(500).json({ error: 'Failed to fetch task history' });
  }
});

// Save employee preference
router.post('/employees/:employeeId/preferences', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { key, value, confidenceScore } = req.body;

    if (!key || !value) {
      return res.status(400).json({ error: 'key and value required' });
    }

    const pref = await taskWorkspaceService.saveEmployeePreference(
      employeeId,
      key,
      value,
      confidenceScore || 0.8
    );

    res.json(pref);
  } catch (error) {
    console.error('Error saving employee preference:', error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

// Get employee preferences
router.get('/employees/:employeeId/preferences', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const prefs = await taskWorkspaceService.getEmployeePreferences(employeeId);
    res.json(prefs);
  } catch (error) {
    console.error('Error fetching employee preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Get specialist response (Claude integration)
router.post('/:taskId/specialist-response', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { senderId, content } = req.body;

    if (!senderId || !content) {
      return res.status(400).json({ error: 'senderId and content required' });
    }

    // Get task details
    const taskResult = await query(
      `SELECT * FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Get conversation history
    const convResult = await query(
      `SELECT * FROM task_conversations WHERE task_id = $1`,
      [taskId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task conversation not found' });
    }

    const conversation = convResult.rows[0];
    const specialistId = conversation.delegated_to_id;

    if (!specialistId) {
      return res.status(400).json({ error: 'Task not delegated to specialist' });
    }

    // Get message history
    const historyResult = await query(
      `SELECT role, content FROM task_messages
       WHERE task_conversation_id = $1
       ORDER BY created_at ASC`,
      [conversation.id]
    );

    const conversationHistory = historyResult.rows;

    // Generate specialist response with company knowledge
    const specialistResponse = await specialistService.generateResponse(
      specialistId,
      content,
      conversationHistory,
      task.title,
      task.description || '',
      task.company_id
    );

    // Save user message
    await taskWorkspaceService.addTaskMessage(conversation.id, senderId, content, 'user');

    // Save specialist response
    const responseMessage = await taskWorkspaceService.addTaskMessage(
      conversation.id,
      specialistId,
      specialistResponse,
      'assistant'
    );

    // Get specialist details for response
    const specialistResult = await query(
      `SELECT * FROM ai_employees WHERE id = $1`,
      [specialistId]
    );

    const specialist = specialistResult.rows[0];

    res.status(201).json({
      ...responseMessage,
      sender_name: specialist.name,
      sender_emoji: specialist.emoji,
    });
  } catch (error) {
    console.error('Error generating specialist response:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Company Guidelines Management (Phase 5)

// Get company guidelines
router.get('/company/:companyId/guidelines', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const result = await query(
      `SELECT * FROM company_guidelines WHERE company_id = $1 ORDER BY category, title`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching company guidelines:', error);
    res.status(500).json({ error: 'Failed to fetch guidelines' });
  }
});

// Create company guideline
router.post('/company/:companyId/guidelines', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { category, title, description, examples, createdById } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({ error: 'category, title, and description required' });
    }

    const result = await query(
      `INSERT INTO company_guidelines (company_id, category, title, description, examples, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [companyId, category, title, description, examples || [], createdById]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating company guideline:', error);
    res.status(500).json({ error: 'Failed to create guideline' });
  }
});

// Get company knowledge
router.get('/company/:companyId/knowledge', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const result = await query(
      `SELECT * FROM knowledge WHERE company_id = $1 ORDER BY domain, title`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching company knowledge:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// Create knowledge entry
router.post('/company/:companyId/knowledge', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { title, content, domain, type, tags, ownerId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'title and content required' });
    }

    const result = await query(
      `INSERT INTO knowledge (company_id, title, content, domain, type, tags, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [companyId, title, content, domain, type, tags || [], ownerId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    res.status(500).json({ error: 'Failed to create knowledge' });
  }
});

// Link output to knowledge (for learning)
router.post('/task/:taskId/output/:outputId/link-knowledge/:knowledgeId', async (req: Request, res: Response) => {
  try {
    const { outputId, knowledgeId } = req.params;
    const { relevanceScore } = req.body;

    const result = await query(
      `INSERT INTO knowledge_linkages (knowledge_id, output_id, relevance_score)
       VALUES ($1, $2, $3)
       ON CONFLICT (knowledge_id, output_id) DO UPDATE
       SET relevance_score = $3
       RETURNING *`,
      [knowledgeId, outputId, relevanceScore || 0.5]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error linking output to knowledge:', error);
    res.status(500).json({ error: 'Failed to link output' });
  }
});

// Get specialist context history
router.get('/specialist/:specialistId/context-history/:taskId', async (req: Request, res: Response) => {
  try {
    const { specialistId, taskId } = req.params;

    const result = await query(
      `SELECT * FROM specialist_context_history
       WHERE specialist_id = $1 AND task_id = $2
       ORDER BY created_at DESC`,
      [specialistId, taskId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching context history:', error);
    res.status(500).json({ error: 'Failed to fetch context history' });
  }
});

export default router;
