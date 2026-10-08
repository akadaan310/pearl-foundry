"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocalWorkspaceRepository, STORAGE_KEY } from "@/lib/pearl/local-repository";
import { emptyWorkspace, type Workspace } from "@/lib/pearl/workspace";

/**
 * The browser-local workspace, shared by every component on the page and
 * kept in sync across tabs. `ready` is false until the browser has been read,
 * so server and first client render agree (an empty, loading state).
 */
export function useWorkspace() {
  const repo = useRef<LocalWorkspaceRepository | null>(null);
  const [ws, setWs] = useState<Workspace>(emptyWorkspace);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [recovered, setRecovered] = useState<string | null>(null);

  useEffect(() => {
    try {
      repo.current = new LocalWorkspaceRepository(window.localStorage);
      setWs(repo.current.load());
      setRecovered(repo.current.recovered);
    } catch {
      setAvailable(false);
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY && repo.current) setWs(repo.current.load()); };
    const onLocal = () => { if (repo.current) setWs(repo.current.load()); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("pearls:changed", onLocal);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("pearls:changed", onLocal); };
  }, []);

  /** Apply a pure change and persist it once. */
  const update = useCallback((f: (w: Workspace) => Workspace): { ok: boolean; error?: string } => {
    const r = repo.current;
    if (!r) return { ok: false, error: "This browser's storage is not available (private mode, or storage blocked)." };
    const next = f(r.load());
    try {
      r.save(next);
    } catch {
      return { ok: false, error: "This browser's storage is full or blocked. Export your library to keep a copy." };
    }
    setWs(next);
    window.dispatchEvent(new Event("pearls:changed"));
    return { ok: true };
  }, []);

  return { ws, ready, available, recovered, update };
}

export function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
