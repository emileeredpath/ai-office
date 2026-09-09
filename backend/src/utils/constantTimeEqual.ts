import { createHash, timingSafeEqual } from 'node:crypto';

// Hashing both sides to a fixed-length digest first avoids timingSafeEqual's
// throw on mismatched buffer lengths (itself a timing/error-shape leak),
// while still comparing the actual secret bytes in constant time. Used for
// both password checks (routes/auth.ts) and the MCP bearer credential
// (middleware/mcpAuth.ts) so there's one reviewed implementation, not two.
export function constantTimeEqual(a: string, b: string): boolean {
  const aHash = createHash('sha256').update(a).digest();
  const bHash = createHash('sha256').update(b).digest();
  return timingSafeEqual(aHash, bHash);
}
