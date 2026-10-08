/**
 * Portable Pearl links: /p/{id}.{payload}
 *
 * payload = base64url(deflate-raw(the Pearl's canonical query string))
 *
 * The link carries everything needed to rebuild the Pearl, so it opens on any
 * device without a database. On opening, the payload is inflated (with a size
 * cap), parsed with the same validator as /e, and its id recomputed: a payload
 * that does not hash to the id in the link is rejected as corrupted.
 *
 * Uses CompressionStream, available in browsers and in Node.js ≥ 18.
 */

import { ORIGIN } from "../../config/origin";
import { pearlQuery } from "./serialize";
import type { Pearl } from "./model";
import { pearlId } from "./model";

export const PORTABLE_LIMITS = { tokenChars: 12_000, inflatedBytes: 64 * 1024 } as const;

function toB64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("payload is not base64url");
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream, cap = Infinity): Promise<Uint8Array> {
  const reader = new Blob([data as BlobPart]).stream().pipeThrough(stream).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > cap) { await reader.cancel(); throw new Error(`payload inflates beyond ${cap} bytes`); }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

export async function encodePortable(p: Pearl, origin?: string): Promise<{ id: string; token: string; path: string; url: string }> {
  const q = new TextEncoder().encode(pearlQuery(p));
  const token = toB64url(await pipe(q, new CompressionStream("deflate-raw")));
  const id = pearlId(p);
  const path = `/p/${id}.${token}`;
  // An explicit origin (e.g. window.location.origin at mint time) always wins:
  // a minted link points at the deployment it was minted on, no env var needed.
  return { id, token, path, url: (origin || ORIGIN) + path };
}

/** Inflate a payload back into the query string it encodes. Throws on malformed or oversized input. */
export async function decodePortable(token: string): Promise<string> {
  if (token.length > PORTABLE_LIMITS.tokenChars) throw new Error(`payload is ${token.length} characters; the limit is ${PORTABLE_LIMITS.tokenChars}`);
  const bytes = fromB64url(token);
  const raw = await pipe(bytes, new DecompressionStream("deflate-raw"), PORTABLE_LIMITS.inflatedBytes);
  return new TextDecoder("utf-8", { fatal: true }).decode(raw);
}

/** Split "/p/{id}.{token}" (or just the segment) into its parts. */
export function splitPortable(segment: string): { id: string; token: string | null } | null {
  const s = decodeURIComponent(segment.replace(/^\/?p\//, ""));
  const m = /^(p_[0-9abcdefghjkmnpqrstvwxyz]{16})(?:\.([A-Za-z0-9_-]+))?$/.exec(s);
  return m ? { id: m[1], token: m[2] ?? null } : null;
}
