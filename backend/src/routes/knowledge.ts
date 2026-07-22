import { Router, Request, Response } from 'express';
import { knowledgeService } from '../services/knowledgeService.js';

const router = Router();

// Get Constitution
router.get('/constitution', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const constitution = await knowledgeService.getConstitution(companyId);
    res.json({ constitution });
  } catch (error) {
    console.error('Error fetching constitution:', error);
    res.status(500).json({ error: 'Failed to fetch constitution' });
  }
});

// Search knowledge
router.get('/search', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const q = req.query.q as string;

    if (!companyId || !q) {
      return res.status(400).json({ error: 'companyId and q required' });
    }

    const results = await knowledgeService.searchKnowledge(companyId, q);
    res.json(results);
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({ error: 'Failed to search knowledge' });
  }
});

// Get by domain
router.get('/by-domain/:domain', async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string;
    const { domain } = req.params;

    if (!companyId) {
      return res.status(400).json({ error: 'companyId required' });
    }

    const results = await knowledgeService.getKnowledgeByDomain(companyId, domain);
    res.json(results);
  } catch (error) {
    console.error('Error fetching knowledge by domain:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

// Add knowledge
router.post('/', async (req: Request, res: Response) => {
  try {
    const { companyId, title, content, domain, type, ownerId } = req.body;

    if (!companyId || !title || !content || !domain || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await knowledgeService.addKnowledge(
      companyId,
      title,
      content,
      domain,
      type,
      ownerId
    );
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({ error: 'Failed to add knowledge' });
  }
});

export default router;
