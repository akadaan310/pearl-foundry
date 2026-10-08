/**
 * Server-side: is the substrate configured and reachable? Reads the server-only
 * environment variable PEARL_SUBSTRATE_URL. When set, the honest answer comes
 * from a live probe; when unset, "not_configured".
 */
import { SubstrateClient, type Fetch } from "./client";
import type { SubstrateStatus } from "./types";

export function substrateUrl(env: Record<string, string | undefined> = process.env): string | null {
  const u = env.PEARL_SUBSTRATE_URL?.trim();
  if (!u) return null;
  try { const p = new URL(u); return p.protocol === "https:" || (p.protocol === "http:" && /^(localhost|127\.0\.0\.1)$/.test(p.hostname)) ? u : null; } catch { return null; }
}

export async function substrateStatus(env: Record<string, string | undefined> = process.env, f?: Fetch): Promise<SubstrateStatus> {
  const checked_at = new Date().toISOString();
  const base = substrateUrl(env);
  if (!base) return { kind: "not_configured", checked_at, reason: "PEARL_SUBSTRATE_URL is not set on this deployment. Everything still works: a Pearl lives in its URL." };
  const c = new SubstrateClient({ baseUrl: base, fetch: f, timeoutMs: 3000 });
  try {
    const health = await c.health();
    const [d, caps] = await Promise.all([c.discovery().catch(() => undefined), c.capabilities().catch(() => undefined)]);
    return { kind: "connected", checked_at, base: "configured", health, discovery: d && { name: d.name, version: d.version, phase: d.phase, primitives: d.primitives, pearl_protocol: d.pearl_protocol }, capabilities: caps };
  } catch (e) {
    return { kind: "unreachable", checked_at, base: "configured", reason: (e as Error).message };
  }
}
