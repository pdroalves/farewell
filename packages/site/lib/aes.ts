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

// Convert ArrayBuffer -> hex string
function bufToHex(buf: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buf), (x: number) => x.toString(16).padStart(2, "0"))
    .join("");
}

// Export CryptoKey (must be extractable!) and print as hex
export async function printKeyHex(key: CryptoKey): Promise<void> {
  const raw = await crypto.subtle.exportKey("raw", key); // ArrayBuffer
  console.log("Key (hex):", bufToHex(raw));
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

function strip0x(hex: string) {
  return hex.startsWith("0x") ? hex.slice(2) : hex;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = strip0x(hex);
  if (clean.length % 2 !== 0) throw new Error("hex string has odd length");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

// Be explicit about AES-GCM key import
export async function aesImportRaw16(raw: Uint8Array | ArrayBuffer): Promise<CryptoKey> {
  // Normalize to a 16-byte ArrayBuffer (not ArrayBufferLike)
  let ab: ArrayBuffer;
  if (raw instanceof ArrayBuffer) {
    if (raw.byteLength !== 16) throw new Error(`AES-128 key must be 16 bytes, got ${raw.byteLength}`);
    ab = raw;
  } else {
    if (raw.byteLength !== 16) throw new Error(`AES-128 key must be 16 bytes, got ${raw.byteLength}`);
    // Ensure backing store is a real ArrayBuffer
    ab = new ArrayBuffer(16);
    new Uint8Array(ab).set(raw);
  }

  return crypto.subtle.importKey(
    "raw",
    ab,                 // <- ArrayBuffer (cleanly satisfies BufferSource)
    { name: "AES-GCM" },
    false,              // set to true if you want to export/print later
    ["encrypt", "decrypt"]
  );
}

// Normalize any view/buffer to a *real* ArrayBuffer (not ArrayBufferLike/SharedArrayBuffer)
function toArrayBuffer(v: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (v instanceof ArrayBuffer) return v;
  const ab = new ArrayBuffer(v.byteLength);
  new Uint8Array(ab).set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
  return ab;
}


/**
 * packed = hex string of: IV(12 bytes) || CIPHERTEXT||TAG(16 bytes tag by default)
 * If you used AAD in encryption, pass the same bytes in `aad`.
 */
export async function decryptUtf8AesGcmPacked(
  packed: string,
  key: CryptoKey,
  aad?: Uint8Array,
  tagLengthBits = 128
): Promise<string> {
  try {
    const data = hexToBytes(packed);
    if (data.length < 12 + tagLengthBits / 8) {
      throw new Error("cipher too short (missing IV or tag)");
    }

    const ivBytes = data.slice(0, 12);
    const ctAndTagBytes = data.slice(12);

    // ★ Normalize to ArrayBuffer to satisfy AesGcmParams / BufferSource
    const ivAB = toArrayBuffer(ivBytes);
    const ctAndTagAB = toArrayBuffer(ctAndTagBytes);
    const aadAB = aad ? toArrayBuffer(aad) : undefined;

    const alg: AesGcmParams = {
      name: "AES-GCM",
      iv: ivAB,
      tagLength: tagLengthBits,
      ...(aadAB ? { additionalData: aadAB } : {}),
    };

    const pt = await crypto.subtle.decrypt(alg, key, ctAndTagAB);
    return new TextDecoder().decode(new Uint8Array(pt));
  } catch (err: unknown) {
    const e = err as DOMException & { name?: string; message?: string };
    console.error("[AES-GCM decrypt] failed:", e?.name || e, e);
    throw new Error(
      e?.name
        ? `AES-GCM decrypt failed: ${e.name} (likely key/IV/tag/AAD mismatch)`
        : "AES-GCM decrypt failed (likely key/IV/tag/AAD mismatch)"
    );
  }
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
