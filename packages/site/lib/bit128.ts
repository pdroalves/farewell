// /packages/site/lib/bit128.ts
// 128-bit (16B) helpers for hex/bigint/random.

export function hex16ToBigint(hex: string): bigint {
  const h = hex.trim().toLowerCase();
  const s = h.startsWith("0x") ? h.slice(2) : h;
  if (s.length === 0) return BigInt(0);
  if (!/^[0-9a-f]+$/.test(s)) throw new Error("Invalid hex");
  if (s.length > 32) throw new Error("Too many hex digits for 128-bit");
  const v = BigInt("0x" + s);
  const mask = BigInt("0xffffffffffffffffffffffffffffffff");
  return v & mask;
}

export function bigintToHex16(v: bigint): `0x${string}` {
  const mask = BigInt("0xffffffffffffffffffffffffffffffff");
  const x = v & mask;
  let s = x.toString(16);
  if (s.length < 32) s = "0".repeat(32 - s.length) + s;
  return ("0x" + s) as `0x${string}`;
}

export function randomHex16(): `0x${string}` {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return ("0x" + s) as `0x${string}`;
}
