import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function resolveKeyBuffer(): Buffer {
  const raw = env.TOKEN_ENCRYPTION_KEY;
  if (!raw || !raw.trim()) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not configured');
  }

  const trimmed = raw.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  const base64Key = Buffer.from(trimmed, 'base64');
  if (base64Key.length === KEY_LENGTH) {
    return base64Key;
  }

  throw new Error(
    'TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex characters or base64 encoding of 32 bytes)'
  );
}

export function isTokenCryptoConfigured(): boolean {
  try {
    resolveKeyBuffer();
    return true;
  } catch {
    return false;
  }
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Cannot encrypt an empty token value');
  }

  const key = resolveKeyBuffer();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join(':');
}

export function decryptToken(payload: string): string {
  if (!payload) {
    throw new Error('Cannot decrypt an empty token payload');
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token payload format');
  }

  const [ivPart, authTagPart, ciphertextPart] = parts;
  const key = resolveKeyBuffer();
  const iv = Buffer.from(ivPart, 'base64url');
  const authTag = Buffer.from(authTagPart, 'base64url');
  const ciphertext = Buffer.from(ciphertextPart, 'base64url');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
