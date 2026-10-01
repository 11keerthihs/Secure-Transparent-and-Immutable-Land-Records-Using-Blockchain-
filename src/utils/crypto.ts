/**
 * Cryptographic utility using Browser Web Crypto API
 * Implements SHA-256 hashing for documents and government IDs
 */

/**
 * Calculates the cryptographic SHA-256 digest of a File or Blob
 */
export async function calculateFileHash(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

/**
 * Calculates SHA-256 hash of a string
 */
export async function calculateTextHash(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return '0x' + hashHex;
}

/**
 * Normalizes Government ID (strips spaces, dashes, converts to uppercase)
 */
export function normalizeGovId(rawId: string): string {
  if (!rawId) return '';
  return rawId.replace(/[\s\-_]/g, '').toUpperCase();
}

/**
 * Creates SHA-256 hash and extracts last 4 digits for safe storage without exposing sensitive ID numbers
 */
export async function hashGovId(rawId: string): Promise<{ hash: string; last4: string }> {
  const normalized = normalizeGovId(rawId);
  if (!normalized) {
    throw new Error('Government ID cannot be empty');
  }
  const hash = await calculateTextHash(normalized);
  const last4 = normalized.slice(-4) || 'XXXX';
  return { hash, last4 };
}

/**
 * Generates a mock or reproducible transaction hash for blockchain verification
 */
export function generateTxHash(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return '0x' + Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}
