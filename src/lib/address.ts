/**
 * Computational addresses: a second, independent implementation of the ECA
 * subset of substrateIO's resolver (substrate/purl.py at 7ace119).
 *
 *   /map/eca/{rule}/{n}                       the map f = ECA rule on a ring of n cells
 *   …/state/{x}                               a state under f
 *   …/next                                    f(x): one transition
 *   …/flip/{bit}                              x XOR 2^bit: a SIMULATED intervention on a model
 *   …/trace/{steps}                           the states x, f(x), …, f^steps(x)
 *   …/orbit                                   iterate until a state repeats: tail + cycle
 *
 * Resolution is pure: an address always denotes the same value. Path segments
 * are matched against a fixed registry, never evaluated. Limits are narrower
 * than substrateIO's, because this resolver runs on a public server.
 */

import { hashJson, type Json } from "./canonical";

export const PROTOCOL = "substrate-purl/0 (provisional) · Pearls resolver 1";

export const LIMITS = { maxBits: 16, maxTraceSteps: 256, maxOperations: 12, maxPathLength: 200 } as const;

export class AddressError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, Json> = {}) {
    super(message);
  }
}

type Kind = "root" | "map" | "state" | "trace";

interface Obj {
  kind: Kind;
  address: string;
  value: { [k: string]: Json };
  rule?: number;
  n?: number;
  x?: number;
}

interface Op {
  id: string;
  segment: string[];
  appliesTo: Kind;
  yields: Kind;
  params: { name: string; min: number; description: string }[];
  description: string;
  epistemic: string;
}

export const REGISTRY: Op[] = [
  { id: "substrate.map.eca", segment: ["map", "eca"], appliesTo: "root", yields: "map", params: [{ name: "rule", min: 0, description: "Wolfram rule 0..255" }, { name: "n", min: 1, description: `ring size 1..${LIMITS.maxBits}` }], description: "Elementary cellular automaton on a ring of n cells.", epistemic: "computational" },
  { id: "substrate.map.state", segment: ["state"], appliesTo: "map", yields: "state", params: [{ name: "x", min: 0, description: "state < 2^n" }], description: "A state of the map's space, under the map's dynamics.", epistemic: "computational" },
  { id: "substrate.state.next", segment: ["next"], appliesTo: "state", yields: "state", params: [], description: "The successor f(x): one transition of the map.", epistemic: "computational" },
  { id: "substrate.state.flip", segment: ["flip"], appliesTo: "state", yields: "state", params: [{ name: "bit", min: 0, description: "bit index < n" }], description: "State perturbation x XOR 2^bit. A SIMULATED intervention on a model, not a physical event.", epistemic: "simulated intervention on a computational model" },
  { id: "substrate.state.trace", segment: ["trace"], appliesTo: "state", yields: "trace", params: [{ name: "steps", min: 1, description: `1..${LIMITS.maxTraceSteps}` }], description: "The trace of `steps` transitions from this state (logical time only).", epistemic: "computational" },
  { id: "substrate.state.orbit", segment: ["orbit"], appliesTo: "state", yields: "trace", params: [], description: "Iterate until a state repeats: transient (tail) + cycle.", epistemic: "computational" },
];

/** One ECA step. Bit i is cell i; the left neighbour is the higher index (substrate/core.py eca_step). */
export function ecaStep(rule: number, n: number, x: number): number {
  let y = 0;
  for (let i = 0; i < n; i++) {
    const l = (x >> ((i + 1) % n)) & 1;
    const c = (x >> i) & 1;
    const r = (x >> ((i - 1 + n) % n)) & 1;
    if ((rule >> ((l << 2) | (c << 1) | r)) & 1) y |= 1 << i;
  }
  return y >>> 0;
}

const popcount = (x: number) => { let c = 0; while (x) { c += x & 1; x >>>= 1; } return c; };
const bits = (x: number, n: number) => x.toString(2).padStart(n, "0");
const dynamics = (o: Obj): Json => ({ family: "eca", rule: o.rule!, n: o.n! });

function stateObj(parent: Obj, address: string, x: number, extra: { [k: string]: Json } = {}): Obj {
  const n = parent.n!;
  return { kind: "state", address, rule: parent.rule, n, x, value: { x, bits_msb_first: bits(x, n), popcount: popcount(x), n_bits: n, dynamics: dynamics(parent), ...extra } };
}

function apply(op: Op, cur: Obj, address: string, args: number[]): Obj {
  switch (op.id) {
    case "substrate.map.eca": {
      const [rule, n] = args;
      if (rule > 255) throw new AddressError(422, "out_of_range", "rule must be 0..255", { param: "rule" });
      if (n < 1 || n > LIMITS.maxBits) throw new AddressError(422, "out_of_range", `n must be in 1..${LIMITS.maxBits} on this resolver`, { param: "n" });
      return { kind: "map", address, rule, n, value: { name: `eca${rule}`, n_bits: n, states: 2 ** n, construction: { family: "eca", rule, n } } };
    }
    case "substrate.map.state": {
      const [x] = args;
      if (x >= 2 ** cur.n!) throw new AddressError(422, "out_of_range", `x must be < 2^${cur.n}`, { param: "x" });
      return stateObj(cur, address, x);
    }
    case "substrate.state.next": {
      const y = ecaStep(cur.rule!, cur.n!, cur.x!);
      return stateObj(cur, address, y, { transition: { src: cur.x!, dst: y, delta_xor: (cur.x! ^ y) >>> 0 } });
    }
    case "substrate.state.flip": {
      const [bit] = args;
      if (bit >= cur.n!) throw new AddressError(422, "out_of_range", `bit must be < ${cur.n}`, { param: "bit" });
      const y = (cur.x! ^ (1 << bit)) >>> 0;
      return stateObj(cur, address, y, {
        intervention: { kind: "state_bit_flip", time: null, params: { bit }, note: "SIMULATED intervention on a computational model; not a physical event." },
        perturbed_from: cur.x!,
      });
    }
    case "substrate.state.trace": {
      const [steps] = args;
      if (steps > LIMITS.maxTraceSteps) throw new AddressError(422, "out_of_range", `steps must be <= ${LIMITS.maxTraceSteps} on this resolver`, { param: "steps" });
      const states = [cur.x!];
      for (let i = 0; i < steps; i++) states.push(ecaStep(cur.rule!, cur.n!, states[states.length - 1]));
      return { kind: "trace", address, rule: cur.rule, n: cur.n, value: { x0: cur.x!, steps, states, distinct_states: new Set(states).size } };
    }
    case "substrate.state.orbit": {
      const seen = new Map<number, number>();
      const xs: number[] = [];
      let x = cur.x!;
      while (!seen.has(x)) { seen.set(x, xs.length); xs.push(x); x = ecaStep(cur.rule!, cur.n!, x); }
      const mu = seen.get(x)!;
      return { kind: "trace", address, rule: cur.rule, n: cur.n, value: { x0: cur.x!, states: xs, tail_length: mu, cycle_length: xs.length - mu, cycle_entry: x } };
    }
  }
  throw new AddressError(500, "unregistered", op.id);
}

export function tokens(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export interface Resolution {
  protocol: string;
  kind: string;
  address: string;
  value: { [k: string]: Json };
  identity: { address: string; value_sha256: string };
  derivation: { address: string; operation: string; kind: string }[];
  effects: "pure";
  epistemic_status: string[];
  next: { rel: string; href: string }[];
  operations: { id: string; template: string; description: string }[];
  verify: { reference: string; command: string };
}

export function resolve(path: string): Resolution {
  if (path.length > LIMITS.maxPathLength) throw new AddressError(414, "too_long", `address longer than ${LIMITS.maxPathLength} characters`);
  const toks = tokens(path);
  if (!toks.length) throw new AddressError(400, "empty", "Empty address. Start at /map/eca/{rule}/{n}.");
  let cur: Obj = { kind: "root", address: "", value: {} };
  const derivation: Resolution["derivation"] = [];
  const epistemic = new Set<string>();
  let i = 0;
  while (i < toks.length) {
    const op = REGISTRY.find((o) => o.appliesTo === cur.kind && o.segment.every((s, k) => toks[i + k] === s));
    if (!op) {
      throw new AddressError(404, "unknown_operation", `No operation '${toks[i]}' applies to a ${cur.kind}.`, {
        at: cur.address || "/",
        applicable: REGISTRY.filter((o) => o.appliesTo === cur.kind).map((o) => template(cur.address, o)),
      });
    }
    if (derivation.length >= LIMITS.maxOperations) throw new AddressError(422, "too_many_operations", `at most ${LIMITS.maxOperations} operations per address on this resolver`);
    const j = i + op.segment.length;
    if (toks.length < j + op.params.length) throw new AddressError(400, "missing_params", `${op.id} needs ${op.params.map((p) => p.name).join(", ")}`, { operation: op.id });
    const args = op.params.map((p, k) => {
      const t = toks[j + k];
      if (!/^\d{1,9}$/.test(t)) throw new AddressError(400, "malformed", `${p.name} must be a non-negative integer, got '${t.slice(0, 20)}'`, { param: p.name });
      const v = Number(t);
      if (v < p.min) throw new AddressError(422, "out_of_range", `${p.name} must be >= ${p.min}`, { param: p.name });
      return v;
    });
    const address = "/" + toks.slice(0, j + op.params.length).join("/");
    cur = apply(op, cur, address, args);
    derivation.push({ address, operation: op.id, kind: cur.kind });
    epistemic.add(op.epistemic);
    i = j + op.params.length;
  }
  return {
    protocol: PROTOCOL,
    kind: cur.kind,
    address: cur.address,
    value: cur.value,
    identity: { address: cur.address, value_sha256: hashJson(cur.value) },
    derivation,
    effects: "pure",
    epistemic_status: [...epistemic],
    next: links(cur),
    operations: REGISTRY.filter((o) => o.appliesTo === cur.kind).map((o) => ({ id: o.id, template: template(cur.address, o), description: o.description })),
    verify: {
      reference: "https://github.com/akadaan310/substrateIO/blob/7ace119a544fc736f0d4ec1d72cded9dad0a83e3/substrate/purl.py",
      command: `python3 -m tools.purl_server & curl -s localhost:8765${cur.address} | jq .identity.value_sha256`,
    },
  };
}

function template(base: string, o: Op): string {
  return [base, ...o.segment, ...o.params.map((p) => `{${p.name}}`)].join("/");
}

function links(o: Obj): { rel: string; href: string }[] {
  const x = (p: string) => "/x" + p;
  if (o.kind === "map") return [0, 1, 2 ** (o.n! - 1)].map((s) => ({ rel: "state", href: x(`${o.address}/state/${s}`) }));
  if (o.kind === "state") {
    return [
      { rel: "next", href: x(`${o.address}/next`) },
      { rel: "flip", href: x(`${o.address}/flip/0`) },
      { rel: "trace", href: x(`${o.address}/trace/8`) },
      { rel: "orbit", href: x(`${o.address}/orbit`) },
      { rel: "map", href: x(`/map/eca/${o.rule}/${o.n}`) },
    ];
  }
  if (o.kind === "trace") return [{ rel: "map", href: x(`/map/eca/${o.rule}/${o.n}`) }];
  return [];
}
