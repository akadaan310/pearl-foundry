/**
 * Continuity without an account: a trail of what happened in this browser.
 * Stored in localStorage only ("pearls.trail.v1"). It is not an account and
 * does not sync; the UI says so. Pure functions + a tiny store.
 */
export type TrailKind = "opened" | "made" | "forked" | "kept" | "returned" | "moved" | "gave";
export interface TrailEntry { at: string; kind: TrailKind; url: string; title: string; parent?: string | null; who?: string | null }

export const TRAIL_KEY = "pearls.trail.v1";
const MAX = 200;

export function addEntry(list: TrailEntry[], e: Omit<TrailEntry, "at">, now = new Date().toISOString()): TrailEntry[] {
  const last = list[list.length - 1];
  if (last && last.url === e.url && last.kind === e.kind) return list; // a reload is not a new event
  return [...list, { ...e, at: now }].slice(-MAX);
}

export interface GardenNode { url: string; title: string; kinds: TrailKind[]; who: string[]; first: string }
export interface GardenEdge { from: string; to: string; kind: TrailKind }

/** Objects and how they connect: one node per URL, edges from parent to child. */
export function garden(list: TrailEntry[]): { nodes: GardenNode[]; edges: GardenEdge[] } {
  const nodes = new Map<string, GardenNode>();
  const edges: GardenEdge[] = [];
  for (const e of list) {
    const n = nodes.get(e.url) ?? { url: e.url, title: e.title, kinds: [], who: [], first: e.at };
    if (!n.kinds.includes(e.kind)) n.kinds.push(e.kind);
    if (e.who && !n.who.includes(e.who)) n.who.push(e.who);
    nodes.set(e.url, n);
    if (e.parent && e.parent !== e.url && !edges.some((x) => x.from === e.parent && x.to === e.url)) edges.push({ from: e.parent, to: e.url, kind: e.kind });
  }
  return { nodes: [...nodes.values()], edges };
}

export function readTrail(s: Pick<Storage, "getItem"> | null): TrailEntry[] {
  try { const v = JSON.parse(s?.getItem(TRAIL_KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x) => x && typeof x.url === "string" && typeof x.kind === "string").slice(-MAX) : []; } catch { return []; }
}

/** Browser helper: record an event. Never throws; private mode just means no trail. */
export function record(e: Omit<TrailEntry, "at">) {
  try {
    const next = addEntry(readTrail(localStorage), e);
    localStorage.setItem(TRAIL_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("pearls:trail"));
  } catch { /* no storage: no trail */ }
}
