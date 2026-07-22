import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

const router = Router();

// Get all tasks for a company
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const result = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.employee_id, t.assigned_by,
              e.name as employee_name, assigner.name as assigned_by_name,
              t.created_at, t.updated_at, t.completed_at
       FROM tasks t
       LEFT JOIN ai_employees e ON t.employee_id = e.id
       LEFT JOIN ai_employees assigner ON t.assigned_by = assigner.id
       WHERE t.company_id = $1
       ORDER BY t.created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task with notes
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const taskResult = await query(
      `SELECT t.id, t.title, t.description, t.priority, t.status, t.employee_id, t.assigned_by,
              e.name as employee_name, assigner.name as assigned_by_name,
              t.created_at, t.updated_at, t.completed_at
       FROM tasks t
       LEFT JOIN ai_employees e ON t.employee_id = e.id
       LEFT JOIN ai_employees assigner ON t.assigned_by = assigner.id
       WHERE t.id = $1`,
      [id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Get task notes
    const notesResult = await query(
      `SELECT id, content, author_id, author.name as author_name, created_at
       FROM task_notes tn
       LEFT JOIN ai_employees author ON tn.author_id = author.id
       WHERE tn.task_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      ...task,
      notes: notesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId, employeeId, title, description, priority, status, assignedBy } = req.body;

    if (!companyId || !title) {
      return res.status(400).json({ error: 'companyId and title required' });
    }

    const result = await query(
      `INSERT INTO tasks (company_id, employee_id, title, description, priority, status, assigned_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, description, priority, status, created_at`,
      [companyId, employeeId || null, title, description || null, priority || 'medium', status || 'backlog', assignedBy || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, employeeId, priority, description } = req.body;

    let updateQuery = 'UPDATE tasks SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    let paramIndex = 1;

    if (status !== undefined) {
      updateQuery += `, status = $${paramIndex++}`;
      params.push(status);
    }
    if (employeeId !== undefined) {
      updateQuery += `, employee_id = $${paramIndex++}`;
      params.push(employeeId);
    }
    if (priority !== undefined) {
      updateQuery += `, priority = $${paramIndex++}`;
      params.push(priority);
    }
    if (description !== undefined) {
      updateQuery += `, description = $${paramIndex++}`;
      params.push(description);
    }

    if (status === 'complete') {
      updateQuery += `, completed_at = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(id);

    const result = await query(updateQuery, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Add note to task
router.post('/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, authorId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content required' });
    }

    const result = await query(
      `INSERT INTO task_notes (task_id, author_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, author_id, created_at`,
      [id, authorId || null, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

export default router;
