import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

const router = Router();

// Get all employees for a company
router.get('/', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const result = await query(
      `SELECT id, name, role, type, is_ai, emoji, status, accent_color, authority_level, created_at
       FROM ai_employees
       WHERE company_id = $1
       ORDER BY created_at ASC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Get single employee with their tasks
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, name, role, type, is_ai, emoji, status, accent_color, authority_level, created_at, updated_at
       FROM ai_employees
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee = result.rows[0];

    // Get employee's tasks
    const tasksResult = await query(
      `SELECT id, title, description, priority, status, assigned_by, created_at, updated_at, completed_at
       FROM tasks
       WHERE employee_id = $1
       ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      ...employee,
      tasks: tasksResult.rows,
    });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Update employee status
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status required' });
    }

    const result = await query(
      `UPDATE ai_employees
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Get employee's AI contract
router.get('/:id/contract', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT scope, can_decide_independently, requires_notification, requires_approval, cannot_do, performance_standards
       FROM ai_contracts
       WHERE ai_employee_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No contract found for this employee' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
});

export default router;
