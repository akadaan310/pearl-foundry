/**
 * Clock and loom addresses: friendly front doors onto registered computations.
 *   /clock/{rule}/{n}/{seed}   →  /map/eca/{rule}/{n}/state/{seed}/orbit
 *   /loom/{rule}/{n}/{seed}    →  /map/eca/{rule}/{n}/state/{seed}/trace/{n*3}
 * Nothing new is computed here: these resolve through the same /x registry.
 */
import { resolve, AddressError } from "../address";

export const RULES = [30, 45, 73, 90, 105, 110, 150, 184];
export interface Auto { kind: "clock" | "loom"; rule: number; n: number; seed: number; path: string; x: string; states: number[]; tail?: number; cycle?: number; hash: string }

export function automaton(kind: "clock" | "loom", segs: string[]): Auto {
  const d = kind === "clock" ? [30, 12, 1] : [110, 16, 1];
  const [rule, n, seed] = [0, 1, 2].map((i) => (segs[i] === undefined ? d[i] : /^\d{1,6}$/.test(segs[i]) ? Number(segs[i]) : NaN));
  if ([rule, n, seed].some((v) => !Number.isFinite(v)) || segs.length > 3) throw new AddressError(400, "malformed", `a ${kind} address is /${kind}/{rule}/{cells}/{seed}`);
  const x = kind === "clock" ? `/map/eca/${rule}/${n}/state/${seed}/orbit` : `/map/eca/${rule}/${n}/state/${seed}/trace/${Math.min(256, n * 3)}`;
  const r = resolve(x); // range checks (rule ≤ 255, n ≤ 16, seed < 2^n) come from the registry
  const v = r.value as { states: number[]; tail_length?: number; cycle_length?: number };
  return { kind, rule, n, seed, path: `/${kind}/${rule}/${n}/${seed}`, x, states: v.states, tail: v.tail_length, cycle: v.cycle_length, hash: r.identity.value_sha256 };
}
