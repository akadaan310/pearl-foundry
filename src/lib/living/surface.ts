/**
 * A shared surface in Golden Surface's vocabulary, simulated in the browser.
 * participant → surface → operation → authority → state → convergence.
 *
 * Structural operations (newtab, open, closetab, and tap, which opens) go
 * through the existing model of Golden Surface's declared sync rules
 * (src/lib/goldenSync.ts, unchanged): the pilot acts on the phone (P); the
 * operator (ر) and counsel (ن) issue commands at the twin (T), delivered over
 * the relay. Authority, as this simulation enforces it:
 *   - every tab has an owner; a participant may open, tap, type in or close only
 *     the tabs it owns; the pilot may act on any tab, on the phone;
 *   - read and shot observe and are allowed to everyone in the room, logged with the actor;
 *   - nobody types credentials here. In Golden Surface only the pilot types them, on
 *     the phone; this simulation has no credential fields and refuses anything that looks like one.
 * Nothing leaves the browser; pages are this site's computational addresses, computed locally.
 */
import { initial, issue, deliver, resend, setLink, phoneChange, classify, converged, hashOf, type World, type Party, type Op } from "../goldenSync";
import { livingAddress, extend } from "./address";
import { resolve } from "../address";
import { ORIGIN } from "../../config/origin";

export type SurfaceVerb = "newtab" | "open" | "read" | "shot" | "tap" | "type" | "closetab";
export const SURFACE_VERBS: SurfaceVerb[] = ["newtab", "open", "read", "shot", "tap", "type", "closetab"];
export const PARTIES: { id: Party; name: string; role: string }[] = [
  { id: "abed", name: "Abed", role: "pilot · human · on the phone" },
  { id: "r", name: "ر Muse", role: "operator · AI · at the twin (SIMULATED)" },
  { id: "n", name: "ن Hu", role: "counsel · through the relay (SIMULATED)" },
];

export interface Entry { actor: Party; verb: SurfaceVerb; tab: string | null; allowed: boolean; output: string }
export interface Surface { world: World; notes: Record<string, { by: Party; text: string }[]>; log: Entry[]; tabs: number; dropNext: boolean }
export interface LegalMove { verb: SurfaceVerb; tab: string | null; label: string }

const START = `${ORIGIN}/live/map/eca/90/8/state/5`;
export function initialSurface(): Surface {
  const w = initial();
  w.T.tabs[0].url = START; w.P.tabs[0].url = START;
  return { world: w, notes: {}, log: [], tabs: 1, dropNext: false };
}

const addressOf = (url: string) => { try { const p = new URL(url).pathname.replace(/^\/live/, ""); resolve(p); return p; } catch { return null; } };
const CREDENTIAL = /pass(word|code|phrase)?|secret|token|api[ _-]?key|otp|2fa|pin\b|ssn|credit ?card|\b\d{12,19}\b/i;

/** The tabs as the actor's own copy sees them: the pilot sees the phone, the others the twin. */
const view = (s: Surface, actor: Party) => (actor === "abed" ? s.world.P : s.world.T);

export function mayOperate(s: Surface, actor: Party, tab: string): boolean {
  const t = view(s, actor).tabs.find((x) => x.id === tab);
  return !!t && (actor === "abed" || t.owner === actor);
}

/** Legal moves only. An operation outside the actor's authority is not offered. */
export function legalMoves(s: Surface, actor: Party): LegalMove[] {
  const out: LegalMove[] = [{ verb: "newtab", tab: null, label: "newtab: open a tab you own" }];
  for (const t of view(s, actor).tabs) {
    const own = mayOperate(s, actor, t.id);
    out.push({ verb: "read", tab: t.id, label: `read ${t.id}` }, { verb: "shot", tab: t.id, label: `shot ${t.id}` });
    if (own) {
      if (addressOf(t.url)) out.push({ verb: "tap", tab: t.id, label: `tap NEXT in ${t.id}` });
      out.push({ verb: "open", tab: t.id, label: `open another address in ${t.id}` }, { verb: "type", tab: t.id, label: `type a note in ${t.id}` }, { verb: "closetab", tab: t.id, label: `closetab ${t.id}` });
    }
  }
  return out;
}

function structural(s: Surface, actor: Party, op: Op): Surface {
  const out = { ...s };
  if (actor === "abed") { out.world = phoneChange(s.world, op); return out; }
  let w = s.world;
  if (s.dropNext) w = { ...w, dropNext: true };
  w = issue(w, op);
  while (w.link === "up" && w.channel.length) w = deliver(w);
  out.world = w; out.dropNext = false;
  return out;
}

export function perform(s0: Surface, actor: Party, verb: SurfaceVerb, tab: string | null, text = ""): Surface {
  let s: Surface = { ...s0, log: [...s0.log], notes: { ...s0.notes } };
  const record = (allowed: boolean, output: string) => { s.log = [...s.log.slice(-49), { actor, verb, tab, allowed, output }]; return s; };
  const t = tab ? view(s, actor).tabs.find((x) => x.id === tab) : null;
  if (tab && !t) return record(false, `no tab ${tab} on this participant's copy of the surface`);
  const owns = verb === "newtab" || verb === "read" || verb === "shot" || (tab !== null && mayOperate(s, actor, tab));
  if (!owns) return record(false, `refused: ${tab} belongs to ${t!.owner}. Crossing ownership is never silent; it is refused and logged.`);
  switch (verb) {
    case "newtab": {
      const id = `t${s.tabs + 1}`;
      s = { ...s, tabs: s.tabs + 1 };
      s = structural(s, actor, { cmd: "newtab", tab: id, owner: actor, url: START });
      return record(true, `${id} opened, owned by ${actor}`);
    }
    case "open": {
      const a = addressOf(t!.url) ?? "/map/eca/90/8/state/5";
      const target = `${ORIGIN}/live${a.startsWith("/map/eca/30/") ? "/map/eca/90/8/state/5" : "/map/eca/30/16/state/256"}`;
      s = structural(s, actor, { cmd: "open", tab: tab!, url: target });
      return record(true, `${tab} → ${target.replace(ORIGIN, "")}`);
    }
    case "tap": {
      const a = addressOf(t!.url);
      if (!a) return record(false, "nothing tappable on this page");
      const next = `${ORIGIN}/live${extend(resolve(a), "next").address}`;
      s = structural(s, actor, { cmd: "open", tab: tab!, url: next });
      return record(true, `tapped NEXT: ${tab} → ${next.replace(ORIGIN, "")}`);
    }
    case "closetab": {
      s = structural(s, actor, { cmd: "closetab", tab: tab! });
      return record(true, `${tab} closed`);
    }
    case "read": {
      const a = addressOf(t!.url);
      return record(true, a ? livingAddress(a).explanation[0] : `a page at ${t!.url} (not fetched: this surface is simulated)`);
    }
    case "shot": {
      const a = addressOf(t!.url);
      return record(true, a ? `shot of ${tab}: ${livingAddress(a).title} · value ${livingAddress(a).identity.hash.slice(0, 12)}…` : `shot of ${tab}`);
    }
    case "type": {
      const v = text.trim().slice(0, 140);
      if (!v) return record(false, "nothing to type");
      if (CREDENTIAL.test(v)) return record(false, "refused: that looks like a credential. Nobody types credentials on this surface; in Golden Surface only the pilot does, on the phone.");
      s.notes = { ...s.notes, [tab!]: [...(s.notes[tab!] ?? []), { by: actor, text: v }] };
      return record(true, `typed into a note on ${tab}. Typed values stay on this surface and are not synchronised.`);
    }
  }
}

export function status(s: Surface) {
  return { converged: converged(s.world), divergence: classify(s.world), twin: hashOf(s.world.T), phone: hashOf(s.world.P), pending: s.world.T.pending.filter((m) => m.rev > s.world.P.ack).length };
}

/** The relay's controls, as in the research model: drop the next op, take the link down or up, replay. */
export function control(s: Surface, c: "drop" | "down" | "up" | "resync"): Surface {
  let w = s.world;
  if (c === "drop") return { ...s, dropNext: true };
  if (c === "down" || c === "up") w = setLink(w, c);
  if (c === "resync") w = resend(w, "Resync (replay)");
  while (w.link === "up" && w.channel.length) w = deliver(w);
  return { ...s, world: w };
}
