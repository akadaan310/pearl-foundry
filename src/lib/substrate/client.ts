/**
 * A typed client for the Pearl Runtime Substrate. Server-side use only: it may
 * carry a bearer token, and the substrate base URL is configuration, not a
 * public value. Every method maps to a route that exists in the substrate's
 * routes.py; nothing here invents an endpoint.
 */
import type { AIReturn, CapabilitySummary, CreatedPearl, Discovery, ForkedPearl, Health, StoredPearl, SubstrateErrorBody, WhoAmI } from "./types";

export type Fetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal; cache?: "no-store" }) => Promise<{ ok: boolean; status: number; headers?: { get(k: string): string | null }; text(): Promise<string> }>;

export class SubstrateError extends Error {
  constructor(public status: number, public code: string, message: string, public retryable = false, public requestId?: string) { super(message); }
  /** What a person sees. Technical detail stays available, never in their face. */
  get human(): string {
    if (this.code === "unreachable" || this.code === "timeout") return "The Pearl substrate couldn't be reached.";
    if (this.status === 401 || this.status === 403) return "That needs permission this browser doesn't have.";
    if (this.status === 404) return "That Pearl isn't there.";
    if (this.status === 422) return "That Pearl couldn't be stored as it is.";
    if (this.status === 429) return "Too many requests. Try again in a moment.";
    return "That Pearl couldn't continue.";
  }
}

export interface ClientOptions { baseUrl: string; token?: string; fetch?: Fetch; timeoutMs?: number }

export class SubstrateClient {
  private base: string;
  constructor(private o: ClientOptions) { this.base = o.baseUrl.replace(/\/+$/, ""); }

  private async call<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown, extra: Record<string, string> = {}): Promise<T> {
    const f = this.o.fetch ?? (fetch as unknown as Fetch);
    const headers: Record<string, string> = { Accept: "application/json", ...extra };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (this.o.token) headers.Authorization = `Bearer ${this.o.token}`;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), this.o.timeoutMs ?? 4000);
    let res;
    try { res = await f(this.base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctl.signal, cache: "no-store" }); }
    catch (e) { throw new SubstrateError(0, (e as Error).name === "AbortError" ? "timeout" : "unreachable", "substrate unreachable", true); }
    finally { clearTimeout(t); }
    const text = await res.text();
    let json: unknown = undefined;
    try { json = text ? JSON.parse(text) : undefined; } catch { /* plain text */ }
    if (!res.ok) {
      const e = (json ?? {}) as Partial<SubstrateErrorBody>;
      throw new SubstrateError(res.status, e.code ?? `http_${res.status}`, e.message ?? text.slice(0, 200), !!e.retryable, e.request_id);
    }
    return (json ?? text) as T;
  }

  // public (auth=False in routes.py / app.py)
  health() { return this.call<Health>("GET", "/health"); }
  discovery() { return this.call<Discovery>("GET", "/.well-known/ai"); }
  capabilities() { return this.call<{ capabilities: CapabilitySummary[] }>("GET", "/capabilities.json").then((r) => r.capabilities); }
  openapi() { return this.call<Record<string, unknown>>("GET", "/openapi.json"); }
  aiReturn(body: { declared?: Record<string, string>; credential?: string; continuity_ref?: string }) { return this.call<AIReturn>("POST", "/api/v1/auth/ai/return", body); }

  // bearer (auth=True)
  whoami() { return this.call<WhoAmI>("GET", "/api/v1/auth/whoami"); }
  getPearl(id: string) { return this.call<StoredPearl>("GET", `/api/v1/pearls/${encodeURIComponent(id)}`); }
  createPearl(pearl: Record<string, unknown>, o: { visibility?: "private" | "shared" | "public"; idempotencyKey: string; dryRun?: boolean }) {
    return this.call<CreatedPearl>("POST", "/api/v1/pearls", { pearl, visibility: o.visibility ?? "private", dry_run: o.dryRun || undefined }, { "Idempotency-Key": o.idempotencyKey });
  }
  forkPearl(id: string, o: { title?: string; by?: string; idempotencyKey: string }) {
    return this.call<ForkedPearl>("POST", `/api/v1/pearls/${encodeURIComponent(id)}/fork`, { title: o.title, by: o.by }, { "Idempotency-Key": o.idempotencyKey });
  }
  verifyPearl(id: string) { return this.call<{ match: boolean; stored_digest: string; [k: string]: unknown }>("GET", `/api/v1/verify/pearl/${encodeURIComponent(id)}`); }

  // working memory (state.keep) — bearer only; the token is server-held, never in the browser
  statePut(key: string, value: unknown) { return this.call<{ key: string; stored: boolean }>("PUT", `/api/v1/state/${encodeURIComponent(key)}`, { value }); }
  stateGet(key: string) { return this.call<{ key: string; value: unknown; updated_at: string }>("GET", `/api/v1/state/${encodeURIComponent(key)}`); }
  stateDelete(key: string) { return this.call<{ key: string; deleted: boolean }>("DELETE", `/api/v1/state/${encodeURIComponent(key)}`); }
  stateList() { return this.call<{ keys: { key: string; updated_at: string }[] }>("GET", "/api/v1/state"); }
}
