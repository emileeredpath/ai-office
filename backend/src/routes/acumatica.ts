import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireEdit } from '../middleware/session.js';
import { importAcumaticaCsv } from '../services/acumaticaImport.js';
import { getAllOpportunities, getLastImportLog } from '../db/acumaticaRepository.js';

const router = Router();

// Manual Acumatica Opportunities import — never a live API connection.
// Accepts a base64-encoded CSV file in a JSON body (same pattern as the
// document-attachment upload via /mcp — see server.ts's LARGE_BODY_PATHS).
// Only CSV is supported today: Acumatica's own generic-inquiry export can
// produce CSV directly, and parsing real XLSX (a zip of XML) isn't
// implemented here — rejected explicitly below rather than attempted and
// silently mis-parsed.
const importSchema = z.object({
  filename: z.string().min(1).max(300),
  contentBase64: z.string().min(1),
});

router.post('/import', requireEdit, (req: Request, res: Response) => {
  const parsed = importSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, message: 'Invalid import request.', error: parsed.error.issues.map((i) => i.message).join('; ') });
    return;
  }
  const { filename, contentBase64 } = parsed.data;

  if (/\.xlsx?$/i.test(filename)) {
    res.status(400).json({
      success: false,
      message: 'Excel files are not yet supported by this importer. Export the Acumatica report as CSV and upload that instead.',
    });
    return;
  }

  let csvText: string;
  try {
    csvText = Buffer.from(contentBase64, 'base64').toString('utf-8');
  } catch {
    res.status(400).json({ success: false, message: 'Could not decode the uploaded file.' });
    return;
  }

  const result = importAcumaticaCsv(filename, csvText);
  res.status(result.success ? 200 : 400).json(result);
});

// Status for the Settings -> Acumatica section: last import stats and a
// live count of stored opportunities. API status is always 'not_connected'
// here — this route never talks to a live Acumatica API.
router.get('/status', (_req: Request, res: Response) => {
  const lastImport = getLastImportLog();
  const opportunityCount = getAllOpportunities().length;
  res.json({
    apiStatus: 'not_connected',
    lastImport: lastImport ?? null,
    opportunityCount,
  });
});

export default router;
