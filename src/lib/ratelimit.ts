/**
 * A per-instance token bucket. It is coarse by design: requests are keyed by
 * a truncated hash of the client address that is held in memory only, never
 * logged and never persisted. On a multi-instance host each instance limits
 * separately; the declared bound is the computation limit, not this.
 */
import { sha256 } from "./canonical";

const CAPACITY = 60;
const REFILL_PER_SEC = 1;
const buckets = new Map<string, { tokens: number; at: number }>();

export const clientIp = (req: Request) => req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");

export function take(clientIp: string | null, now = Date.now(), ns = "x", capacity = CAPACITY): { ok: boolean; remaining: number } {
  const key = ns + ":" + sha256(ns + ":" + (clientIp ?? "unknown")).slice(0, 16);
  if (buckets.size > 5000) buckets.clear();
  const b = buckets.get(key) ?? { tokens: capacity, at: now };
  b.tokens = Math.min(capacity, b.tokens + ((now - b.at) / 1000) * REFILL_PER_SEC * (capacity / CAPACITY));
  b.at = now;
  const ok = b.tokens >= 1;
  if (ok) b.tokens -= 1;
  buckets.set(key, b);
  return { ok, remaining: Math.floor(b.tokens) };
}
