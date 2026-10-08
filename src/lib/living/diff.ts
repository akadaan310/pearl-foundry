/**
 * COMPARE: a structural diff of two Pearls. Pure and deterministic.
 * Blocks are compared by their canonical line (blockToLine), aligned with a
 * longest-common-subsequence; a removal and an addition of the same kind at
 * the same place is reported as a change.
 */
import { resolve } from "../address";
import { blockToLine } from "../pearl/serialize";
import { pearlDigest, idFromDigest, type Pearl } from "../pearl/model";
import { continuityState } from "./pearl";

export type BlockOp =
  | { op: "same"; line: string }
  | { op: "added"; line: string }
  | { op: "removed"; line: string }
  | { op: "changed"; from: string; to: string };

export interface PearlDiff {
  a: { id: string; title: string };
  b: { id: string; title: string };
  identical: boolean;
  relation: "identical" | "b is derived from a" | "a is derived from b" | "siblings (same parent)" | "unrelated by from=";
  meta: { field: string; a: string | null; b: string | null }[];
  blocks: BlockOp[];
  counts: { same: number; added: number; removed: number; changed: number };
  computations: { a: string; b: string; valueA: string | null; valueB: string | null; xA: number | null; xB: number | null }[];
  continuity: { closed: string[]; opened: string[]; decisions_added: string[]; actions_added: string[] };
}

const kindOf = (line: string) => line.slice(0, line.indexOf(":"));

function lcs(a: string[], b: string[]): BlockOp[] {
  const m = a.length, n = b.length;
  const t = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) t[i][j] = a[i] === b[j] ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const out: BlockOp[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { out.push({ op: "same", line: a[i] }); i++; j++; }
    else if (t[i + 1][j] >= t[i][j + 1]) out.push({ op: "removed", line: a[i++] });
    else out.push({ op: "added", line: b[j++] });
  }
  while (i < m) out.push({ op: "removed", line: a[i++] });
  while (j < n) out.push({ op: "added", line: b[j++] });
  // pair an adjacent removed/added of the same kind into one change
  const merged: BlockOp[] = [];
  for (let k = 0; k < out.length; k++) {
    const x = out[k], y = out[k + 1];
    if (x.op === "removed" && y?.op === "added" && kindOf(x.line) === kindOf(y.line)) { merged.push({ op: "changed", from: x.line, to: y.line }); k++; }
    else merged.push(x);
  }
  return merged;
}

function valueOf(address: string): { hash: string | null; x: number | null } {
  try { const r = resolve(address); const x = (r.value as { x?: number }).x; return { hash: r.identity.value_sha256, x: typeof x === "number" ? x : null }; } catch { return { hash: null, x: null }; }
}

export function diffPearls(a: Pearl, b: Pearl): PearlDiff {
  const ida = idFromDigest(pearlDigest(a)), idb = idFromDigest(pearlDigest(b));
  const meta = (["type", "title", "by", "for", "session", "from"] as const)
    .map((f) => ({ field: f, a: (a[f] as string | null | undefined) ?? null, b: (b[f] as string | null | undefined) ?? null }))
    .filter((m) => m.a !== m.b);
  const blocks = lcs(a.blocks.map(blockToLine), b.blocks.map(blockToLine));
  const counts = { same: 0, added: 0, removed: 0, changed: 0 };
  for (const o of blocks) counts[o.op]++;

  const xa = a.blocks.filter((x) => x.type === "x").map((x) => (x as { address: string }).address);
  const xb = b.blocks.filter((x) => x.type === "x").map((x) => (x as { address: string }).address);
  const computations = Array.from({ length: Math.max(xa.length, xb.length) }, (_, i) => ({ a: xa[i] ?? "", b: xb[i] ?? "" }))
    .filter((c) => c.a !== c.b)
    .map((c) => { const va = c.a ? valueOf(c.a) : { hash: null, x: null }, vb = c.b ? valueOf(c.b) : { hash: null, x: null }; return { ...c, valueA: va.hash, valueB: vb.hash, xA: va.x, xB: vb.x }; });

  const ca = continuityState(a), cb = continuityState(b);
  const linesOf = (p: Pearl, kind: string) => p.blocks.filter((x) => x.type === "c" && x.kind === kind).map((x) => (x as { text: string }).text);
  const continuity = {
    closed: ca.open.filter((t) => cb.closed.includes(t) || (!cb.open.includes(t) && linesOf(b, "close").some((c) => c.toLowerCase() === t.toLowerCase()))),
    opened: cb.open.filter((t) => !ca.open.includes(t)),
    decisions_added: linesOf(b, "decision").filter((d) => !linesOf(a, "decision").includes(d)),
    actions_added: linesOf(b, "action").filter((d) => !linesOf(a, "action").includes(d)),
  };

  const relation: PearlDiff["relation"] = ida === idb ? "identical" : b.from === ida ? "b is derived from a" : a.from === idb ? "a is derived from b" : a.from && a.from === b.from ? "siblings (same parent)" : "unrelated by from=";
  return { a: { id: ida, title: a.title }, b: { id: idb, title: b.title }, identical: ida === idb, relation, meta, blocks, counts, computations, continuity };
}
