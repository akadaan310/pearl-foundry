/**
 * The Seven Verbs: an EXPERIMENTAL interaction grammar, not a programming
 * language. The verbs and transitions are MUSA's luna-agent/protocols/
 * url-machine.md:
 *
 *   IDLE --START(url)--> BOUND(url)
 *   BOUND(url) --SWITCH(url')--> BOUND(url')
 *   BOUND --WRITE--> WRITING --COMMIT--> COMMITTED
 *   COMMITTED --BUILD--> BUILT | FAILED
 *   any --TALK--> any (harness-routed)        any --PERTURB--> any (logged)
 *
 * The seurl repository leaves the mechanics unspecified. This site's
 * interpretation, using only registered operations:
 *   - a session's ADDRESS is a computational address;
 *   - SWITCH moves it by one registered transition (…/next);
 *   - WRITE appends one typed Pearl block line to a draft: text, never code to run;
 *   - COMMIT freezes the draft and names it by content id (prepared ≠ committed);
 *   - BUILD parses it with the one Pearl parser: BUILT (a Pearl link) or FAILED (its errors);
 *   - TALK routes an envelope {from, to, op, url, payload, idstamp} through the harness;
 *   - PERTURB(url, bit) flips one bit of the address (a simulated, logged, reversible move).
 * Pure: every function returns a new state.
 */
import { resolve } from "../address";
import { parseExperience } from "../experience";
import { RESEARCH_IDS } from "../pearl/resolve";
import { toPearl, pearlId } from "../pearl/model";
import { pearlUrl } from "../pearl/serialize";
import { extend, normalForm } from "./address";

export type Phase = "IDLE" | "BOUND" | "WRITING" | "COMMITTED" | "BUILT" | "FAILED";
export type Verb = "START" | "SWITCH" | "WRITE" | "COMMIT" | "BUILD" | "TALK" | "PERTURB";
export const VERBS: Verb[] = ["START", "SWITCH", "WRITE", "COMMIT", "BUILD", "TALK", "PERTURB"];

export interface Session { id: string; name: string; url: string | null; phase: Phase; draft: string[]; committed: { id: string; lines: string[] } | null; built: { link: string; id: string } | null; errors: string[]; inbox: string[] }
export interface Envelope { from: string; to: string; op: Verb; url: string | null; payload: string; idstamp: string }
export interface Machine { sessions: Session[]; log: Envelope[]; n: number }
export interface Move { verb: Verb; arg?: string; label: string }
export interface Result { machine: Machine; before: Phase; after: Phase; result: string; next: string | null; refused?: string }

const S = (id: string, name: string): Session => ({ id, name, url: null, phase: "IDLE", draft: [], committed: null, built: null, errors: [], inbox: [] });
export const initialMachine = (): Machine => ({ sessions: [S("s1", "you"), S("s2", "another session")], log: [], n: 0 });

const clone = (m: Machine): Machine => JSON.parse(JSON.stringify(m));

/** The legal moves for a session in its current phase. Illegal moves are not listed. */
export function legal(m: Machine, sid: string): Verb[] {
  const s = m.sessions.find((x) => x.id === sid)!;
  const any: Verb[] = ["TALK", ...(s.url ? (["PERTURB"] as Verb[]) : [])];
  switch (s.phase) {
    case "IDLE": return ["START"];
    case "BOUND": return ["SWITCH", "WRITE", ...any];
    case "WRITING": return ["WRITE", ...(s.draft.length ? (["COMMIT"] as Verb[]) : []), ...any];
    case "COMMITTED": return ["BUILD", ...any];
    case "BUILT": case "FAILED": return ["SWITCH", "WRITE", ...any];
  }
}

function stateOf(url: string) { const r = resolve(url); return { x: (r.value as { x: number }).x, n: ((r.value as { dynamics: { n: number } }).dynamics).n, r }; }

export function step(m0: Machine, sid: string, verb: Verb, arg = ""): Result {
  const m = clone(m0);
  const s = m.sessions.find((x) => x.id === sid)!;
  const before = s.phase;
  if (!legal(m0, sid).includes(verb)) return { machine: m0, before, after: before, result: "", next: s.url, refused: `${verb} is not a legal move from ${before}` };
  const env = (to: string, payload: string): Envelope => ({ from: s.id, to, op: verb, url: s.url, payload, idstamp: `#${++m.n}·${s.id}` });
  let result = "";
  switch (verb) {
    case "START": {
      const url = arg || "/map/eca/90/8/state/5";
      resolve(url);
      s.url = url; s.phase = "BOUND"; result = `bound to ${url}`;
      m.log.push(env("harness", url)); break;
    }
    case "SWITCH": {
      const r = resolve(s.url!);
      s.url = extend(r, "next").address; s.phase = "BOUND"; s.errors = [];
      result = `the URL changed under the session: x = ${stateOf(s.url).x}`;
      m.log.push(env("harness", s.url)); break;
    }
    case "WRITE": {
      const line = (arg || `x:${s.url}`).slice(0, 300);
      if (s.phase === "BUILT" || s.phase === "FAILED") { s.draft = []; s.committed = null; s.built = null; }
      s.draft.push(line); s.phase = "WRITING"; result = `wrote “${line}” at ${s.url} (a typed block, not code: nothing runs)`;
      m.log.push(env("harness", line)); break;
    }
    case "COMMIT": {
      const q = new URLSearchParams({ title: `Committed at ${s.url}`, by: `session ${s.id}`, session: "seven-verbs" });
      s.draft.forEach((l, i) => q.append(`b${i + 1}`, l));
      const p = parseExperience(q, new Set(RESEARCH_IDS));
      const id = pearlId(toPearl(p.doc));
      s.committed = { id, lines: [...s.draft] }; s.phase = "COMMITTED";
      result = `prepared ≠ submitted ≠ committed: the draft is frozen as ${id}`;
      m.log.push(env("harness", id)); break;
    }
    case "BUILD": {
      const q = new URLSearchParams({ title: `Committed at ${s.url}`, by: `session ${s.id}`, session: "seven-verbs" });
      s.committed!.lines.forEach((l, i) => q.append(`b${i + 1}`, l));
      const p = parseExperience(q, new Set(RESEARCH_IDS));
      const bad = p.warnings.filter((w) => /rejected|without a known|unknown/.test(w));
      if (p.errors.length || bad.length) { s.phase = "FAILED"; s.errors = [...p.errors, ...bad]; result = `FAILED: ${s.errors[0]}`; }
      else { const pearl = toPearl(p.doc); s.built = { link: pearlUrl(pearl), id: pearlId(pearl) }; s.phase = "BUILT"; s.errors = []; result = `BUILT: a Pearl, ${s.built.id}`; }
      m.log.push(env("harness", s.phase)); break;
    }
    case "TALK": {
      const to = m.sessions.find((x) => x.id !== s.id)!;
      const payload = (arg || `I am at ${s.url ?? "no address yet"}`).slice(0, 200);
      to.inbox.push(`${s.name}: ${payload}`);
      result = `routed through the harness to ${to.name}, never directly`;
      m.log.push(env(to.id, payload)); break;
    }
    case "PERTURB": {
      const { n, r } = stateOf(s.url!);
      const bit = Math.min(n - 1, Math.max(0, Number(arg) || 0));
      s.url = extend(r, "flip", String(bit)).address;
      result = `deliberate perturbation, logged: bit ${bit} flipped (simulated). PERTURB the same bit again to restore the state; the address keeps both moves.`;
      m.log.push(env("harness", `flip/${bit}`)); break;
    }
  }
  return { machine: m, before, after: s.phase, result, next: s.url };
}

export { normalForm };
