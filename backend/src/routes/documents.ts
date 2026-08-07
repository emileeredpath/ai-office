import { Router, type Request, type Response } from 'express';
import { listDocuments, getDocumentWithContent } from '../db/documentRepository.js';

const router = Router();

// Creation goes through the generic ai_office_create_record MCP tool
// (entity: "document") — see the Generic MCP Access brief. These routes are
// read-only: list a record's attachments, and stream one back for download.
router.get('/', (req: Request, res: Response) => {
  const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
  const recordId = typeof req.query.recordId === 'string' ? req.query.recordId : undefined;
  res.json({ success: true, result: listDocuments({ entityType, recordId }) });
});

router.get('/:id/download', (req: Request, res: Response) => {
  const doc = getDocumentWithContent(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  if (doc.url) {
    res.redirect(doc.url);
    return;
  }

  if (!doc.contentBase64) {
    res.status(404).json({ success: false, message: 'This document has no stored content or URL.' });
    return;
  }

  const buffer = Buffer.from(doc.contentBase64, 'base64');
  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename.replace(/"/g, '')}"`);
  res.send(buffer);
});

export default router;
