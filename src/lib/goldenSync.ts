/**
 * A browser-side model of Golden Surface's declared sync rules
 * (akadaan310/golden-surface, docs/SYNC.md, relay/twin.py at b113718).
 *
 *   1. Twin → phone ops carry a monotonic twin_rev and are sent in rev order.
 *   2. The phone applies op r only if r == ack + 1. r <= ack is a duplicate
 *      and is ignored; a gap (r > ack + 1) is answered with nack {ack} and the
 *      relay resends every pending op.
 *   3. Ack means processed: applied or rejected (a rejection is reported).
 *   4. Phone → twin: every phone change bumps phone_rev and posts full state;
 *      the twin adopts it, drops acked ops and re-applies those still pending.
 *   converged ⇔ link up ∧ no pending ops ∧ hash(structural(T)) == hash(structural(P))
 *
 * This is a model of the rules, not the relay. Timing (the 10 s and 30 s
 * thresholds) is replaced by explicit steps.
 */

import { hashJson, type Json } from "./canonical";

export type Party = "abed" | "r" | "n";
export interface Tab { id: string; owner: Party; url: string }
export interface Structural { tabs: Tab[]; active: string | null }

export type Op =
  | { cmd: "newtab"; tab: string; owner: Party; url: string }
  | { cmd: "open"; tab: string; url: string }
  | { cmd: "closetab"; tab: string };

export interface Msg { rev: number; op: Op }

export interface World {
  T: Structural & { twinRev: number; pending: Msg[] };
  P: Structural & { ack: number; phoneRev: number };
  link: "up" | "down";
  channel: Msg[];          // ops sent to the phone, not yet delivered
  dropNext: boolean;       // the relay's `desync` test hook: drop one op on the floor
  lastRejected: string | null;
  log: { kind: string; detail: string }[];
  seq: number;
}

export type DivergenceClass = "link-down" | "op-in-flight" | "op-lost" | "op-rejected" | "state-mismatch";

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
export const structural = (s: Structural): Structural => ({ tabs: s.tabs.map(({ id, owner, url }) => ({ id, owner, url })), active: s.active });
export const hashOf = (s: Structural) => hashJson(structural(s) as unknown as Json);

export function initial(): World {
  const tabs: Tab[] = [{ id: "t1", owner: "abed", url: "https://example.org/" }];
  return {
    T: { tabs: clone(tabs), active: "t1", twinRev: 0, pending: [] },
    P: { tabs: clone(tabs), active: "t1", ack: 0, phoneRev: 0 },
    link: "up",
    channel: [],
    dropNext: false,
    lastRejected: null,
    log: [{ kind: "welcome", detail: "phone and twin start from the same state" }],
    seq: 1,
  };
}

/** Apply an op to a structural state; returns an error string if the phone must reject it. */
function applyOp(s: Structural, op: Op): string | null {
  if (op.cmd === "newtab") { s.tabs.push({ id: op.tab, owner: op.owner, url: op.url }); s.active = op.tab; return null; }
  const t = s.tabs.find((x) => x.id === op.tab);
  if (!t) return `no such tab ${op.tab}`;
  if (op.cmd === "open") { if (!/^https?:\/\//.test(op.url)) return "scheme not supported"; t.url = op.url; s.active = t.id; return null; }
  s.tabs = s.tabs.filter((x) => x.id !== op.tab);
  if (s.active === op.tab) s.active = s.tabs[0]?.id ?? null;
  return null;
}

const log = (w: World, kind: string, detail: string) => { w.log = [...w.log.slice(-39), { kind, detail }]; };

/** The operator (ر) issues a command at the twin. */
export function issue(w0: World, op: Op): World {
  const w = clone(w0);
  const rev = w.T.twinRev + 1;
  w.T.twinRev = rev;
  applyOp(w.T, op);
  const msg = { rev, op };
  w.T.pending.push(msg);
  if (w.link === "down") log(w, "queued", `op ${rev} ${op.cmd}: phone offline → 202 queued in the twin`);
  else if (w.dropNext) { w.dropNext = false; log(w, "desync", `op ${rev} ${op.cmd} dropped on the floor (test hook)`); }
  else { w.channel.push(msg); log(w, "op", `twin → phone: op ${rev} ${op.cmd}`); }
  return w;
}

/** Twin adopts the phone's state, drops acked ops, re-applies pending ones (rule 4). */
function adopt(w: World) {
  w.T.pending = w.T.pending.filter((m) => m.rev > w.P.ack);
  const base = structural(w.P);
  for (const m of w.T.pending) applyOp(base, m.op);
  w.T.tabs = base.tabs;
  w.T.active = base.active;
}

/** Deliver the next in-flight message to the phone (rules 2 and 3). */
export function deliver(w0: World): World {
  const w = clone(w0);
  if (w.link === "down" || !w.channel.length) return w;
  const m = w.channel.shift()!;
  if (m.rev <= w.P.ack) { log(w, "duplicate", `phone ignores op ${m.rev} (already acked ${w.P.ack})`); return w; }
  if (m.rev > w.P.ack + 1) {
    log(w, "nack", `gap: phone expected op ${w.P.ack + 1}, got ${m.rev} → nack {ack: ${w.P.ack}}`);
    return resend(w, "nack");
  }
  const err = applyOp(w.P, m.op);
  w.P.ack = m.rev;
  w.P.phoneRev += 1;
  if (err) { w.lastRejected = `op ${m.rev}: ${err}`; log(w, "sync.conflict", `phone rejects op ${m.rev}: ${err} (422 to the caller)`); }
  else { w.lastRejected = null; log(w, "ack", `phone applies op ${m.rev}, acks; POST /state phone_rev=${w.P.phoneRev}`); }
  adopt(w);
  return w;
}

/** Resend every pending op not yet in flight (nack, reconnect, or Resync: replay). */
export function resend(w0: World, why: string): World {
  const w = clone(w0);
  if (w.link === "down") return w;
  const inFlight = new Set(w.channel.map((m) => m.rev));
  const again = w.T.pending.filter((m) => m.rev > w.P.ack && !inFlight.has(m.rev));
  w.channel = [...w.channel, ...again].sort((a, b) => a.rev - b.rev);
  log(w, "resend", `${why}: relay resends ${again.length ? again.map((m) => m.rev).join(", ") : "nothing"}`);
  return w;
}

/** Abed changes something on the phone directly (rule 4). */
export function phoneChange(w0: World, op: Op): World {
  const w = clone(w0);
  applyOp(w.P, op);
  w.P.phoneRev += 1;
  if (w.link === "up") { adopt(w); log(w, "state", `phone change, POST /state phone_rev=${w.P.phoneRev}; twin adopts`); }
  else log(w, "state", `phone change while link down (phone_rev=${w.P.phoneRev}); twin cannot see it`);
  return w;
}

export function setLink(w0: World, link: "up" | "down"): World {
  let w = clone(w0);
  w.link = link;
  if (link === "down") { w.channel = []; log(w, "link-down", "relay ⇄ phone websocket closed; in-flight messages lost"); return w; }
  log(w, "hello", `phone reconnects with full state (phone_rev=${w.P.phoneRev}); welcome {base}`);
  adopt(w);
  w = resend(w, "reconnect");
  return w;
}

export function classify(w: World): DivergenceClass[] {
  const c: DivergenceClass[] = [];
  if (w.link === "down") c.push("link-down");
  const inFlight = new Set(w.channel.map((m) => m.rev));
  const pending = w.T.pending.filter((m) => m.rev > w.P.ack);
  if (w.link === "up" && pending.some((m) => inFlight.has(m.rev))) c.push("op-in-flight");
  if (w.link === "up" && pending.some((m) => !inFlight.has(m.rev))) c.push("op-lost");
  if (w.lastRejected) c.push("op-rejected");
  if (!pending.length && hashOf(w.T) !== hashOf(w.P)) c.push("state-mismatch");
  return c;
}

export function converged(w: World): boolean {
  return w.link === "up" && w.T.pending.filter((m) => m.rev > w.P.ack).length === 0 && hashOf(w.T) === hashOf(w.P);
}
