import { Router, type Request, type Response } from 'express';
import { getBrandTraffic } from '../services/ga4.js';

const router = Router();

router.get('/ga4', async (_req: Request, res: Response) => {
  const result = await getBrandTraffic();
  res.json(result);
});

export default router;
