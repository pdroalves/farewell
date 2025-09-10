// /packages/site/lib/aes.ts
// Minimal AES-GCM utilities built on the Web Crypto (SubtleCrypto) API.
// Design choices:
// - AES-128 (16-byte key) so it fits into your euint128 `_skShare`
// - Pack payload as 0x-hex: IV(12 bytes) || ciphertext(with GCM tag)
// - Utilities to convert between Uint8Array, hex, and BigInt (for FHE path)

export type AesPacked = `0x${string}`;

/** Convert bytes → 0x-hex (lowercase) */
function bytesToHex(b: Uint8Array): `0x${string}` {
  let s = "";
  for (const x of b) s += x.toString(16).padStart(2, "0");
  return ("0x" + s) as `0x${string}`;
}

/** Convert 0x-hex → bytes */
function hexToBytes(hex: `0x${string}`): Uint8Array {
  const h = hex.slice(2);
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

/** Concatenate two byte arrays */
function concat(a: Uint8Array, b: Uint8Array) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/**
 * Generate a new random AES-128 key for AES-GCM.
 * - Exportable: true (we re-serialize it to store under FHE as euint128)
 * - Usages: ["encrypt", "decrypt"]
 */
export async function aes128Gen(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 128 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Import a raw 16-byte AES key as a Web Crypto CryptoKey.
 * Throws if the input is not exactly 16 bytes.
 */
export async function aesImportRaw16(raw: Uint8Array): Promise<CryptoKey> {
  if (raw.length !== 16) throw new Error("Key must be 16 bytes");

  // Ensure we hand SubtleCrypto a real ArrayBuffer (BufferSource)
  const keyData: ArrayBuffer =
    raw.byteOffset === 0 && raw.byteLength === raw.buffer.byteLength
      ? (raw.buffer as ArrayBuffer)
      : raw.slice().buffer; // makes a new ArrayBuffer if view is offset

  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}


/**
 * Export an AES-GCM CryptoKey to raw 16-byte material.
 * Throws if the exported length is not 16 bytes (sanity check).
 */
export async function aesExportRaw16(key: CryptoKey): Promise<Uint8Array> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  if (raw.length !== 16) throw new Error("Exported key not 16 bytes");
  return raw;
}

/**
 * Encrypt a UTF-8 string with AES-GCM and pack as a single 0x-hex blob:
 *   payload = IV(12 bytes) || ciphertext_with_tag
 *
 * Notes:
 * - GCM requires a 12-byte IV (recommended size).
 * - The authentication tag is already appended to the ciphertext by the API.
 * - The returned hex is ideal for storing directly in `bytes payload` on-chain.
 */
export async function encryptUtf8AesGcmPacked(s: string, key: CryptoKey): Promise<AesPacked> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV (GCM best practice)
  const pt = new TextEncoder().encode(s);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, pt));
  return bytesToHex(concat(iv, ct));
}

/**
 * Decrypt a packed 0x-hex payload produced by `encryptUtf8AesGcmPacked`:
 *   input: 0x(IV(12B) || ciphertext_with_tag)
 * returns: UTF-8 plaintext string
 *
 * Validates:
 * - Length >= 12 (must at least hold the IV)
 */
export async function decryptUtf8AesGcmPacked(packed: AesPacked, key: CryptoKey): Promise<string> {
  const data = hexToBytes(packed);
  if (data.length < 12) throw new Error("cipher too short");
  const iv = data.slice(0, 12);
  const ct = data.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(new Uint8Array(pt));
}

/**
 * Convert a 16-byte key to a 128-bit BigInt (big-endian).
 * Use this before encrypting the key into your euint128 `_skShare`.
 */
export function key16ToBigint(k: Uint8Array): bigint {
  let v = BigInt(0);

  for (const b of k) v = (v << BigInt(8)) | BigInt(b);
  return v;
}

/**
 * Convert a 128-bit BigInt (0..2^128-1) back into a 16-byte AES key (big-endian).
 * Use this after userDecrypt on `euint128` to restore the raw key bytes.
 */
export function bigintToKey16(v: bigint): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 15; i >= 0; i--) {
    out[i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
  return out;
}
