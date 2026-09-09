import type { NextFunction, Request, Response } from 'express';
import { constantTimeEqual } from '../utils/constantTimeEqual.js';
import { mcpAuthFailureLimit } from './rateLimit.js';

// Dedicated MCP credential — deliberately separate from the dashboard's
// EDIT_PASSWORD/VIEW_PASSWORD (Security Hardening Phase 1, Priority 1) so
// rotating one never affects the other, and so MCP access isn't tied to
// either the edit or view dashboard role. Read fresh from the environment
// on every request rather than cached at startup, and never logged.
const AUTH_HEADER_RE = /^Bearer (.+)$/;

export function requireMcpAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.MCP_API_KEY;
  if (!apiKey) {
    console.error('[mcp] MCP_API_KEY is not configured — refusing all /mcp requests until it is set.');
    res.status(503).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'MCP is not configured on this server.' },
      id: null,
    });
    return;
  }

  const header = req.header('authorization') || '';
  const match = AUTH_HEADER_RE.exec(header);
  const provided = match?.[1];

  if (provided && constantTimeEqual(provided, apiKey)) {
    next();
    return;
  }

  // Failed attempt — rate-limited separately from (and more strictly than)
  // general MCP traffic so credential-guessing can't hide inside the
  // general throughput allowance.
  mcpAuthFailureLimit(req, res, () => {
    res.status(401).json({
      jsonrpc: '2.0',
      error: { code: -32001, message: 'Unauthorized — missing or invalid MCP credential.' },
      id: null,
    });
  });
}
