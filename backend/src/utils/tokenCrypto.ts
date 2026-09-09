import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// AES-256-GCM at-rest encryption for persisted OAuth tokens (Security
// Hardening Phase 1, Priority 7) — a standard, established Node primitive,
// not a home-grown scheme. Keyed by MS_GRAPH_TOKEN_ENCRYPTION_KEY, read
// fresh from the environment and never logged.
//
// The env var is treated as a passphrase (any length/format), not a raw
// key, and run through scrypt with a fixed, non-secret salt to derive a
// proper 32-byte AES-256 key — avoids requiring a specific pre-encoded key
// format while still producing a cryptographically appropriate key. The
// salt does not need to be secret (that property is what makes it a salt,
// not a second secret); its only job is domain-separation, which a fixed
// application-specific string already provides.
const KEY_DERIVATION_SALT = 'ai-office-ms-graph-token-v1';
const IV_LENGTH = 12; // recommended IV length for AES-GCM
const AUTH_TAG_LENGTH = 16;

function deriveKey(passphrase: string): Buffer {
  return scryptSync(passphrase, KEY_DERIVATION_SALT, 32);
}

// Throws if the key is missing — callers should let this propagate so a
// token is never written unencrypted (fail closed, not silently fall back
// to plaintext).
export function encryptToken(plaintext: string): string {
  const passphrase = process.env.MS_GRAPH_TOKEN_ENCRYPTION_KEY;
  if (!passphrase) {
    throw new Error('MS_GRAPH_TOKEN_ENCRYPTION_KEY is not configured — refusing to store a Microsoft Graph token unencrypted.');
  }
  const key = deriveKey(passphrase);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64-encoded, so the
  // repository can keep treating this as a single opaque TEXT column.
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

// Returns null (never throws) on any decryption failure — a missing key, a
// legacy plaintext value from before this change, or corrupted data all
// resolve to "no usable token," which the caller treats as not connected,
// prompting a reconnect rather than crashing or exposing a stale value.
export function decryptToken(stored: string): string | null {
  try {
    const passphrase = process.env.MS_GRAPH_TOKEN_ENCRYPTION_KEY;
    if (!passphrase) return null;
    const raw = Buffer.from(stored, 'base64');
    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH) return null;
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const key = deriveKey(passphrase);
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    return null;
  }
}
