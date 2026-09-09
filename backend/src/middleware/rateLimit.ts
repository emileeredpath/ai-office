import type { NextFunction, Request, Response } from 'express';

// Minimal in-memory fixed-window rate limiter. Fine for a single-user,
// single-process deployment; not intended to survive multi-instance scaling.
interface RateLimiterOptions {
  windowMs: number;
  max: number;
  // Defaults to the existing login behaviour: prefer a caller-supplied
  // Authorization header (stable across a session even if the IP changes)
  // and fall back to the request IP.
  keyFn?: (req: Request) => string;
  message?: string;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max, message } = options;
  const keyFn = options.keyFn ?? ((req: Request) => req.header('authorization') || req.ip || 'anonymous');
  const hits = new Map<string, { count: number; windowStart: number }>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = keyFn(req);
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      hits.set(key, { count: 1, windowStart: now });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ success: false, message: message ?? 'Too many requests. Try again shortly.' });
      return;
    }

    next();
  };
}

// Existing login limiter — unchanged behaviour (60/min, keyed by auth header
// or IP), just reimplemented on the shared factory above.
export const rateLimit = createRateLimiter({ windowMs: 60_000, max: 60 });

// /mcp general throughput limiter — keyed by the raw Authorization header so
// one legitimate credential's usage never throttles another caller sharing
// the same IP, and vice versa. 120/min gives a single Claude session
// generous headroom for a burst of several tool calls in one turn without
// meaningfully changing the endpoint's abuse-resistance.
export const mcpRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 120,
  keyFn: (req) => `mcp:${req.header('authorization') || req.ip || 'anonymous'}`,
  message: 'Too many MCP requests. Try again shortly.',
});

// Separate, stricter limiter applied only to failed /mcp authentication
// attempts, keyed by IP (not by the — invalid — credential itself) so
// credential-guessing can't hide inside the general throughput allowance.
export const mcpAuthFailureLimit = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  keyFn: (req) => `mcp-auth-fail:${req.ip || 'unknown'}`,
  message: 'Too many failed MCP authentication attempts. Try again shortly.',
});
