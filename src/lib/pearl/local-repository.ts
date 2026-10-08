/**
 * The browser-local WorkspaceRepository: one versioned key in localStorage.
 * Corrupt data is never discarded silently: it is moved aside under a
 * timestamped key and reported, and an empty workspace starts in its place.
 */

import { coerceWorkspace, emptyWorkspace, type Workspace, type WorkspaceRepository } from "./workspace";

export const STORAGE_KEY = "pearls.workspace.v1";

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void }

export class LocalWorkspaceRepository implements WorkspaceRepository {
  readonly kind = "browser-local" as const;
  recovered: string | null = null;
  constructor(private storage: StorageLike, private key = STORAGE_KEY) {}

  load(): Workspace {
    let raw: string | null = null;
    try { raw = this.storage.getItem(this.key); } catch { return emptyWorkspace(); }
    if (!raw) return emptyWorkspace();
    try {
      const ws = coerceWorkspace(JSON.parse(raw));
      if (ws) return ws;
    } catch { /* fall through */ }
    const aside = `${this.key}.corrupt.${Date.now()}`;
    try { this.storage.setItem(aside, raw); } catch { /* storage full: nothing more we can do */ }
    this.recovered = aside;
    return emptyWorkspace();
  }

  save(ws: Workspace): void {
    this.storage.setItem(this.key, JSON.stringify(ws));
  }
}

export class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
  keys() { return [...this.m.keys()]; }
}
