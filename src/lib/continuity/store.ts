/**
 * Storage for continuity brains.
 *
 *   supabase   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY: calls the cb_* SQL
 *              functions (supabase/migrations/0001_continuity_brain.sql)
 *              through PostgREST with fetch. No client library.
 *   memory     development and tests only. Never chosen silently in production.
 *
 * If neither is available, getStore() returns null and the site says so,
 * rather than pretending to remember.
 */

import { chainHash, contentHash, GENESIS_PREV, keyHash, MAX_EVENTS, newCode, newOwnerKey, type Brain, type EventBody, type StoredEvent } from "./model";

export interface CreateResult { code: string; ownerKey: string; v: number; hash: string }
export interface AppendResult { v: number; hash: string; duplicate: boolean }
export interface ReadResult { brain: Brain; events: StoredEvent[] }

export interface Store {
  kind: "supabase" | "memory";
  create(body: EventBody): Promise<CreateResult>;
  append(code: string, body: EventBody): Promise<AppendResult | { error: "not_found" | "full" }>;
  read(code: string, from?: number, limit?: number): Promise<ReadResult | null>;
  forget(code: string, ownerKey: string): Promise<boolean>;
}

// ---------------------------------------------------------------- PostgREST

export type Rpc = (fn: string, args: Record<string, unknown>) => Promise<unknown>;

export function postgrestRpc(url: string, serviceKey: string): Rpc {
  const base = url.replace(/\/$/, "") + "/rest/v1/rpc/";
  return async (fn, args) => {
    const res = await fetch(base + fn, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`rpc ${fn} failed: ${res.status}`) as Error & { body?: string; status?: number };
      err.body = text; err.status = res.status;
      throw err;
    }
    return text ? JSON.parse(text) : null;
  };
}

export function sqlStore(rpc: Rpc): Store {
  return {
    kind: "supabase",
    async create(body) {
      const ch = contentHash(body);
      const ownerKey = newOwnerKey();
      for (let attempt = 0; attempt < 4; attempt++) {
        const code = newCode();
        try {
          const r = (await rpc("cb_create", { p_code: code, p_owner_key_hash: keyHash(ownerKey), p_session: body.session, p_body: body, p_content_hash: ch })) as { v: number; hash: string };
          return { code, ownerKey, v: r.v, hash: r.hash };
        } catch (e) {
          if (attempt < 3 && /duplicate key|23505/.test(String((e as { body?: string }).body ?? e))) continue;
          throw e;
        }
      }
      throw new Error("could not allocate a code");
    },
    async append(code, body) {
      return (await rpc("cb_append", { p_code: code, p_session: body.session, p_body: body, p_content_hash: contentHash(body), p_max_events: MAX_EVENTS })) as AppendResult | { error: "not_found" | "full" };
    },
    async read(code, from = 1, limit = 1000) {
      const r = (await rpc("cb_read", { p_code: code, p_from: from, p_limit: limit })) as ReadResult | null;
      if (!r) return null;
      return { brain: r.brain, events: r.events.map((e) => ({ ...e, at: new Date(e.at).toISOString() })) };
    },
    async forget(code, ownerKey) {
      return (await rpc("cb_forget", { p_code: code, p_owner_key_hash: keyHash(ownerKey) })) === true;
    },
  };
}

// ---------------------------------------------------------------- memory

interface MemBrain { brain: Brain; ownerKeyHash: string; events: StoredEvent[] }

export function memoryStore(): Store {
  const brains = new Map<string, MemBrain>();
  const push = (m: MemBrain, kind: StoredEvent["kind"], body: EventBody): StoredEvent => {
    const v = m.brain.head_version + 1;
    const ch = contentHash(body);
    const e: StoredEvent = { v, at: new Date().toISOString(), kind, body: JSON.parse(JSON.stringify(body)), content_hash: ch, prev: m.brain.head_hash, hash: chainHash(m.brain.head_hash, v, ch) };
    m.events.push(e);
    m.brain.head_version = v;
    m.brain.head_hash = e.hash;
    return e;
  };
  return {
    kind: "memory",
    async create(body) {
      let code = newCode();
      while (brains.has(code)) code = newCode();
      const ownerKey = newOwnerKey();
      const m: MemBrain = { brain: { code, created_at: new Date().toISOString(), head_version: 0, head_hash: GENESIS_PREV, forgotten: false }, ownerKeyHash: keyHash(ownerKey), events: [] };
      brains.set(code, m);
      const e = push(m, "genesis", body);
      return { code, ownerKey, v: e.v, hash: e.hash };
    },
    async append(code, body) {
      const m = brains.get(code);
      if (!m || m.brain.forgotten) return { error: "not_found" };
      const ch = contentHash(body);
      const dup = m.events.find((e) => e.content_hash === ch);
      if (dup) return { v: dup.v, hash: dup.hash, duplicate: true };
      if (m.brain.head_version >= MAX_EVENTS) return { error: "full" };
      const e = push(m, "append", body);
      return { v: e.v, hash: e.hash, duplicate: false };
    },
    async read(code, from = 1, limit = 1000) {
      const m = brains.get(code);
      if (!m || m.brain.forgotten) return null;
      return { brain: { ...m.brain }, events: m.events.filter((e) => e.v >= from && e.v < from + Math.min(limit, 5000)).map((e) => JSON.parse(JSON.stringify(e))) };
    },
    async forget(code, ownerKey) {
      const m = brains.get(code);
      if (!m || m.brain.forgotten || m.ownerKeyHash !== keyHash(ownerKey)) return false;
      m.events = [];
      m.brain.forgotten = true;
      return true;
    },
  };
}

// ---------------------------------------------------------------- selection

const g = globalThis as unknown as { __cbMemory?: Store };

export function getStore(): Store | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return sqlStore(postgrestRpc(url, key));
  if (process.env.CONTINUITY_STORE === "memory" || process.env.NODE_ENV !== "production") {
    g.__cbMemory ??= memoryStore();
    return g.__cbMemory;
  }
  return null;
}
