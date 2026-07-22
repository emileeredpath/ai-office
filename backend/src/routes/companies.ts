import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

const router = Router();

// Get or create default company
router.get('/default', async (req: Request, res: Response) => {
  try {
    // For MVP, always use the seeded company
    const result = await query('SELECT id, name FROM companies LIMIT 1');

    if (result.rows.length === 0) {
      // Shouldn't happen with seed, but fallback
      const createResult = await query(
        "INSERT INTO companies (name) VALUES ('Emilee Media') RETURNING id, name"
      );
      return res.json(createResult.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching company:', error);
    res.status(500).json({ error: 'Failed to fetch company' });
  }
});

export default router;
