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

/**
 * Export an AES-GCM CryptoKey to raw 16-byte material.
 * Throws if the exported length is not 16 bytes (sanity check).
 */
export async function aesExportRaw16(key: CryptoKey): Promise<Uint8Array> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  if (raw.length !== 16) throw new Error("Exported key not 16 bytes");
  return raw;
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
  await printKeyHex(key);
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
export async function aesImportRaw16(raw: Uint8Array): Promise<CryptoKey> {
  // Ensure we pass a BufferSource (ArrayBufferView is fine)
  const view = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  if (view.byteLength !== 16) {
    throw new Error(`AES-128 key must be 16 bytes, got ${view.byteLength}`);
  }
  return crypto.subtle.importKey(
    "raw",
    view,                      // BufferSource
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * packed = hex string of: IV(12 bytes) || CIPHERTEXT||TAG(16 bytes tag by default)
 * If you used AAD in encryption, pass the same bytes in `aad`.
 */
export async function decryptUtf8AesGcmPacked(
  packed: string,
  key: CryptoKey,
  aad?: Uint8Array,              // pass same AAD you used on encrypt, if any
  tagLengthBits: number = 128    // match encrypt’s tagLength if you changed it
): Promise<string> {
  try {
    console.log("AES-GCM decrypt:", packed);
  await printKeyHex(key);

    const data = hexToBytes(packed);
    // Need at least 12 (IV) + 16 (tag)
    if (data.length < 12 + tagLengthBits / 8) {
      throw new Error("cipher too short (missing IV or tag)");
    }
    const iv = data.slice(0, 12);
    const ctAndTag = data.slice(12); // WebCrypto expects tag appended here

    const alg: AesGcmParams = {
      name: "AES-GCM",
      iv,
      tagLength: tagLengthBits,
      ...(aad ? { additionalData: aad } : {})
    };

    const pt = await crypto.subtle.decrypt(alg, key, ctAndTag);
    return new TextDecoder().decode(new Uint8Array(pt));
  } catch (err: unknown) {
    // DOMException often has empty message — log name & details
    const e = err as DOMException & { name?: string; message?: string };
    console.error("[AES-GCM decrypt] failed:", e?.name || e, e);
    // Surface something human-friendly:
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
