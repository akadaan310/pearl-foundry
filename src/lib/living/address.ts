/**
 * A computational address as a living object. Pure: the record is a function
 * of the address alone. Every address-producing affordance carries the next
 * address, which is itself a valid computational address (tested).
 */
import { resolve, LIMITS, type Resolution } from "../address";
import type { Json } from "../canonical";
import { afford, LIVING_FORMAT, type Affordance, type Edge, type EvidenceRow, type LivingRecord } from "./record";

const bits = (x: number, n: number) => x.toString(2).padStart(n, "0");

/** The shortest address with the same value as a state: /map/eca/{rule}/{n}/state/{x}. */
export function normalForm(r: Resolution): string | null {
  const v = r.value as Record<string, Json>;
  const d = (v.dynamics ?? v.construction) as { rule: number; n: number } | undefined;
  if (r.kind !== "state" || !d || typeof v.x !== "number") return null;
  return `/map/eca/${d.rule}/${d.n}/state/${v.x}`;
}

/** Append operations, or start again from the normal form when the resolver's limits would be passed. */
export function extend(r: Resolution, ...segs: string[]): { address: string; restarted: boolean } {
  const tail = segs.join("/");
  const direct = `${r.address}/${tail}`;
  const ops = r.derivation.length + (segs[0] === "flip" || segs[0] === "trace" ? 1 : segs.length);
  if (ops <= LIMITS.maxOperations && direct.length <= LIMITS.maxPathLength) return { address: direct, restarted: false };
  return { address: `${normalForm(r)}/${tail}`, restarted: true };
}

function ruleName(rule: number) { return `Rule ${rule}`; }

export function livingAddress(path: string): LivingRecord {
  const r = resolve(path); // throws AddressError for a malformed or out-of-range address
  const v = r.value as Record<string, Json>;
  const affordances: Affordance[] = [];
  const history: Edge[] = [];
  const explanation: string[] = [];

  // History is the derivation itself: each prefix is an address.
  for (let i = 1; i < r.derivation.length; i++) {
    const a = r.derivation[i - 1], b = r.derivation[i];
    const op = b.operation.replace("substrate.", "");
    const label = b.kind === "state" ? `x = ${(resolve(b.address).value as { x: number }).x}` : b.kind;
    history.push({ from: a.address, op, to: b.address, label });
  }
  const parent = r.derivation.length > 1 ? r.derivation[r.derivation.length - 2].address : null;

  let state: Record<string, Json> = {};
  let rule = 0, n = 0;
  if (r.kind === "map") {
    rule = v.construction ? (v.construction as { rule: number }).rule : 0;
    n = v.n_bits as number;
    state = { rule, n, states: v.states as number };
    explanation.push(`You are looking at ${ruleName(rule)}, an elementary cellular automaton on a ring of ${n} cells. It is a map: a program with ${v.states} possible states and no state chosen yet.`);
    explanation.push("Choose a state to give it something to run on. Each choice is another address.");
    affordances.push(afford("open", { options: [1, 2 ** Math.floor(n / 2), 2 ** n - 1 - 2].filter((x, i, a) => x >= 0 && x < 2 ** n && a.indexOf(x) === i).map((x) => ({ label: `state ${x} · ${bits(x, n)}`, href: `${r.address}/state/${x}` })) }));
  } else if (r.kind === "state") {
    const d = v.dynamics as { rule: number; n: number };
    rule = d.rule; n = d.n;
    const x = v.x as number;
    const next = (resolve(`${normalForm(r)}/next`).value as { x: number }).x;
    state = { rule, n, x, bits: bits(x, n), popcount: v.popcount as number };
    if (v.transition) state.transition = v.transition as Json;
    if (v.intervention) state.perturbed_from = v.perturbed_from as number;
    const how = v.intervention ? ` It was reached by a simulated perturbation: bit ${(v.intervention as { params: { bit: number } }).params.bit} of state ${v.perturbed_from} was flipped.` : v.transition ? ` It was reached by one transition from state ${(v.transition as { src: number }).src}.` : "";
    explanation.push(`You are looking at ${ruleName(rule)} on a ${n}-cell ring. The current state is ${x} (${bits(x, n)}): ${v.popcount} of ${n} cells are on.${how}`);
    explanation.push(`Pressing NEXT applies the registered transition substrate.state.next and produces state ${next}. The address gains /next, and the new address is itself a link anyone can open.`);
    const nx = extend(r, "next");
    affordances.push(afford("next", { href: nx.address, note: nx.restarted ? `This address already holds ${LIMITS.maxOperations} operations, so the step starts from the normal form.` : undefined }));
    affordances.push(afford("perturb", { options: Array.from({ length: n }, (_, b) => ({ label: `bit ${b}`, href: extend(r, "flip", String(b)).address, detail: `${bits(x, n)} → ${bits((x ^ (1 << b)) >>> 0, n)}` })) }));
    affordances.push(afford("trace", { href: extend(r, "trace", "16").address, options: [8, 16, 32, 64].map((s) => ({ label: `${s} steps`, href: extend(r, "trace", String(s)).address })) }));
    affordances.push(afford("orbit", { href: extend(r, "orbit").address }));
    const nf = normalForm(r)!;
    if (nf !== r.address) affordances.push(afford("normalize", { href: nf }));
  } else {
    // trace or orbit
    const d = resolve(r.derivation.find((x) => x.kind === "map")!.address).value as { construction: { rule: number; n: number } };
    rule = d.construction.rule; n = d.construction.n;
    const states = v.states as number[];
    state = { rule, n, x0: v.x0 as number, length: states.length };
    if ("cycle_length" in v) { state.tail_length = v.tail_length as number; state.cycle_length = v.cycle_length as number; state.cycle_entry = v.cycle_entry as number; }
    else state.distinct_states = v.distinct_states as number;
    explanation.push("cycle_length" in v
      ? `This is the orbit of state ${v.x0} under ${ruleName(rule)} on ${n} cells: ${v.tail_length} step(s) before it falls into a cycle of length ${v.cycle_length}, entered at state ${v.cycle_entry}.`
      : `This is a trace: ${v.steps} transitions of ${ruleName(rule)} from state ${v.x0}, with ${v.distinct_states} distinct states. Time runs downward.`);
    const last = states[states.length - 1];
    affordances.push(afford("open", { options: [{ label: `the last state (${last})`, href: `/map/eca/${rule}/${n}/state/${last}` }, ...("cycle_entry" in v ? [{ label: `the cycle entry (${v.cycle_entry})`, href: `/map/eca/${rule}/${n}/state/${v.cycle_entry}` }] : [])] }));
  }
  if (parent) affordances.push(afford("back", { href: parent }));
  affordances.push(afford("verify"), afford("inspect"), afford("explain"), afford("fork"), afford("carry"), afford("copy-link"), afford("copy-id"));

  const evidence: EvidenceRow[] = [
    { what: "The result", knowing: "computed", detail: `Resolved now by this site's fixed registry (${r.derivation.map((d) => d.operation).join(" → ")}). Pure: the same address always denotes the same value.` },
    { what: "Its identity", knowing: "checked", detail: `value_sha256 ${r.identity.value_sha256}. Recompute it in your browser and compare it with the server's.` },
    { what: "Agreement with substrateIO", knowing: "recorded", status: "REPRODUCED", ref: "E-006", detail: "Two independent implementations (this TypeScript resolver and substrateIO's Python reference) agree hash-for-hash on the recorded vectors." },
  ];
  if (r.epistemic_status.some((s) => s.includes("simulated"))) evidence.push({ what: "The perturbation", knowing: "computed", detail: "A SIMULATED intervention on a computational model. Nothing physical happened, and it is not a single-event upset." });
  evidence.push({ what: "Meaning beyond the model", knowing: "cannot be established", detail: "The computation shows what this rule does to this state. It says nothing about any physical system." });

  return {
    format: LIVING_FORMAT,
    identity: { kind: "address", id: r.address, hash: r.identity.value_sha256, address: r.address, means: "This address always denotes this exact value; its hash names the value." },
    type: r.kind,
    title: r.kind === "map" ? `${ruleName(rule)} · ${n} cells` : r.kind === "state" ? `${ruleName(rule)} · state ${state.x}` : `${ruleName(rule)} · ${"cycle_length" in v ? "orbit" : "trace"} from ${v.x0}`,
    state,
    affordances,
    history,
    parent,
    related: [{ kind: "address", label: "the map", href: `/map/eca/${rule}/${n}` }, { kind: "research", label: "PURL", href: "/research/purl" }, { kind: "research", label: "Substrate", href: "/research/substrate" }],
    evidence,
    explanation,
    limits: { ...LIMITS },
  };
}
