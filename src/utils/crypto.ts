/**
 * Lightweight pure-JS salted hash helper for Phase 1 local demo accounts.
 * Ensures plaintext passwords are never stored in AsyncStorage.
 */

export function generateSalt(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Deterministic 64-bit FNV-1a + DJB2 multi-round digest for local Phase 1 demo password verification.
 * Note: Phase 2 backend will use bcrypt/argon2 on Node.js + PostgreSQL.
 */
export function hashLocalPassword(password: string, salt: string): string {
  const input = `${salt}:${password}:mindshift-local-v1`;
  let h1 = 0x811c9dc5;
  let h2 = 5381;
  for (let round = 0; round < 64; round++) {
    for (let i = 0; i < input.length; i++) {
      const code = input.charCodeAt(i) ^ (round * 13);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);
      h2 = (Math.imul(h2, 33) ^ code) >>> 0;
    }
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}

export function verifyLocalPassword(password: string, salt: string, expectedHash: string): boolean {
  return hashLocalPassword(password, salt) === expectedHash;
}
