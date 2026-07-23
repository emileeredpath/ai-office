import { Router, type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createAiOfficeMcpServer } from '../mcp/server.js';

const router = Router();

// Stateless: a fresh McpServer + transport per request. Simpler and safer
// for low, personal-scale traffic than maintaining session state across
// requests, at the cost of not supporting server-initiated push between
// calls (not needed for these tools — they're all request/response).
// No API key required: all mutations are guarded by confirmation gates (update_task, complete_task),
// duplicate detection (create_task), or read-only (search_workspace, get_context).
router.post('/', async (req: Request, res: Response) => {
  try {
    const server = createAiOfficeMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP request failed:', err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

router.get('/', (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed — this server is stateless (no SSE stream).' },
    id: null,
  });
});

router.delete('/', (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed — this server has no sessions to terminate.' },
    id: null,
  });
});

export default router;
