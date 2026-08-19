import { Router, type Request, type Response } from 'express';
import db from '../db/connection.js';

const router = Router();

interface AuditLogRow {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  previous_value: string | null;
  new_value: string | null;
  source: string;
  confirmed: number;
  automatic: number;
  created_at: string;
}

// Read-only feed for the Home screen's "Recent activity" — the same
// audit_log table the generic MCP "audit_log" entity queries, just reachable
// from the dashboard's own session instead of Claude's MCP connection.
router.get('/', (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').all(limit) as unknown as AuditLogRow[];
  const result = rows.map((r) => ({
    id: r.id,
    action: r.action,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    previousValue: r.previous_value ? JSON.parse(r.previous_value) : null,
    newValue: r.new_value ? JSON.parse(r.new_value) : null,
    source: r.source,
    confirmed: !!r.confirmed,
    automatic: !!r.automatic,
    createdAt: r.created_at,
  }));
  res.json({ success: true, result });
});

export default router;
