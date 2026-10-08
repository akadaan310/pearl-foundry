/**
 * Shared Pearl storage: the adapter boundary, not an active service.
 *
 * A shared store would let a short link (/p/{id}) resolve on any device. It
 * is content-addressed: a Pearl is stored under its own id, its digest is
 * recomputed before every write and after every read, and a stored Pearl is
 * never overwritten. Nothing here is user-private: a shared store holds only
 * Pearls the person chose to publish.
 *
 *   rest-kv   KV_REST_API_URL + KV_REST_API_TOKEN (the Upstash / Vercel KV
 *             REST protocol: GET {url}/get/{key}, POST {url}/set/{key}?nx=true).
 *
 * On this deployment neither variable is set, so getPearlStore() returns null
 * and no route uses it. See docs/architecture/FUTURE_PERSISTENCE.md for the
 * owner action that would activate it. It is never faked.
 */
import { pearlDigest, idFromDigest, isPearlId, type Pearl } from "./model";
import { revalidate } from "./workspace";

export interface PearlStore {
  readonly kind: "rest-kv";
  put(pearl: Pearl): Promise<{ id: string; digest: string; created: boolean }>;
  get(id: string): Promise<{ pearl: Pearl; digest: string } | null>;
}

type Fetch = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string; cache?: "no-store" }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

const MAX_BYTES = 64 * 1024;
const key = (id: string) => `pearl:v1:${id}`;

export function restKvStore(url: string, token: string, f: Fetch = fetch as unknown as Fetch): PearlStore {
  const base = url.replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${token}` };
  return {
    kind: "rest-kv",
    async put(pearl) {
      const v = revalidate(pearl);
      if ("error" in v) throw new Error(`refused: ${v.error}`);
      const body = JSON.stringify({ digest: v.digest, pearl: v.pearl });
      if (new TextEncoder().encode(body).length > MAX_BYTES) throw new Error("refused: larger than 64 KiB");
      const res = await f(`${base}/set/${encodeURIComponent(key(v.id))}?nx=true`, { method: "POST", headers, body, cache: "no-store" });
      if (!res.ok) throw new Error(`store error ${res.status}`);
      const r = (await res.json()) as { result?: unknown };
      if (r.result === "OK") return { id: v.id, digest: v.digest, created: true };
      // Already present: content-addressed, so it must be the same content. Check, never overwrite.
      const existing = await this.get(v.id);
      if (!existing || existing.digest !== v.digest) throw new Error("conflict: a different Pearl is stored under this id");
      return { id: v.id, digest: v.digest, created: false };
    },
    async get(id) {
      if (!isPearlId(id)) return null;
      const res = await f(`${base}/get/${encodeURIComponent(key(id))}`, { headers, cache: "no-store" });
      if (!res.ok) throw new Error(`store error ${res.status}`);
      const r = (await res.json()) as { result?: unknown };
      if (typeof r.result !== "string") return null;
      let doc: { digest?: unknown; pearl?: unknown };
      try { doc = JSON.parse(r.result); } catch { return null; }
      const v = revalidate(doc.pearl);
      // A stored record that does not hash to its key is treated as absent, never served.
      if ("error" in v || v.id !== id || v.digest !== doc.digest || idFromDigest(pearlDigest(v.pearl)) !== id) return null;
      return { pearl: v.pearl, digest: v.digest };
    },
  };
}

export function getPearlStore(env: Record<string, string | undefined> = process.env): PearlStore | null {
  const url = env.KV_REST_API_URL, token = env.KV_REST_API_TOKEN;
  return url && token ? restKvStore(url, token) : null;
}
