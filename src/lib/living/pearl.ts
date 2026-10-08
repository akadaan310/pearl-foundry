/**
 * A Pearl as a living object: its state, its legal moves, its relations, and
 * how each thing it says is known. Pure. Also: fork (a new Pearl whose from=
 * names the parent; the original never changes).
 */
import { resolve } from "../address";
import { NODES } from "../../content/research";
import { TYPE_INFO, pearlDigest, idFromDigest, type Pearl } from "../pearl/model";
import type { Block } from "../experience";
import type { Json } from "../canonical";
import { afford, LIVING_FORMAT, type Affordance, type EvidenceRow, type LivingRecord, type Related } from "./record";

type C = Extract<Block, { type: "c" }>;
const count = (p: Pearl, t: Block["type"]) => p.blocks.filter((b) => b.type === t).length;
const plural = (n: number, one: string, many = one + "s") => `${n} ${n === 1 ? one : many}`;
const CONT_NAME: Record<string, [string, string]> = { mem: ["memory", "memories"], said: ["summary", "summaries"], decision: ["decision", "decisions"], thread: ["open thread", "open threads"], close: ["closed thread", "closed threads"], action: ["next action", "next actions"], nick: ["nickname", "nicknames"], lex: ["coined word", "coined words"], nuance: ["nuance", "nuances"] };

/** Continuity state: which threads are still open after the closes are applied. */
export function continuityState(p: Pearl) {
  const cs = p.blocks.filter((b): b is C => b.type === "c");
  const closed = new Set(cs.filter((c) => c.kind === "close").map((c) => c.text.toLowerCase()));
  const threads = cs.filter((c) => c.kind === "thread");
  return {
    ai: cs.find((c) => c.kind === "ai")?.text ?? null,
    human: cs.find((c) => c.kind === "human")?.text ?? null,
    open: threads.filter((t) => !closed.has(t.text.toLowerCase())).map((t) => t.text),
    closed: threads.filter((t) => closed.has(t.text.toLowerCase())).map((t) => t.text),
    actions: cs.filter((c) => c.kind === "action").map((c) => c.text),
    entries: cs.length,
  };
}

export function relatedOf(p: Pearl): Related[] {
  const out: Related[] = [];
  if (p.from) out.push({ kind: "parent", label: `parent ${p.from}`, href: `/p/${p.from}`, detail: "named by from= (lineage as asserted). The parent's content is not carried in this link; it opens if this browser has it." });
  for (const b of p.blocks) {
    if (b.type === "pearl") out.push({ kind: "pearl", label: b.label, href: b.href });
    if (b.type === "x") out.push({ kind: "address", label: b.address, href: b.address });
    if (b.type === "research") out.push({ kind: "research", label: NODES.find((n) => n.id === b.id)?.name ?? b.id, href: `/research/${b.id}` });
    if (b.type === "choice") for (const o of b.options) out.push({ kind: "choice", label: o.label, href: o.href, detail: b.prompt });
    if (b.type === "link") out.push({ kind: "link", label: b.label, href: b.href, detail: `leaves this site · ${b.host}` });
  }
  return out;
}

export function explainPearl(p: Pearl, id: string): string[] {
  const out: string[] = [];
  const info = TYPE_INFO[p.type];
  out.push(`This is ${/^[aeiou]/i.test(info.label) ? "an" : "a"} ${info.label.toLowerCase()} Pearl called “${p.title}”, composed by ${p.by ?? "an unnamed composer"}${p.session ? ` in a session it calls “${p.session}”` : ""}. Those names are what the Pearl says about itself (asserted).`);
  if (!p.blocks.length) out.push("It has a title and no parts yet. It is valid, but there is nothing to experience. REMIX it to add parts: text, a computation, choices, links to other Pearls.");
  const kinds = Object.entries(CONT_NAME).map(([k, [one, many]]) => [p.blocks.filter((b) => b.type === "c" && b.kind === k).length, one, many] as const).filter(([n]) => n > 0);
  if (kinds.length) {
    const cs = continuityState(p);
    out.push(`It carries what one AI session wrote down for the next: ${kinds.map(([n, one, many]) => plural(n, one, many)).join(", ")}${cs.ai ? `. The AI is called ${cs.ai}` : ""}${cs.human ? `, the person ${cs.human}` : ""}. It is a record that another session can read, not a model's memory.`);
    if (cs.open.length) out.push(`${plural(cs.open.length, "thread is", "threads are")} still open: “${cs.open[0]}”${cs.open.length > 1 ? " and more" : ""}. CONTINUE hands it to another AI to pick up from there.`);
  }
  const xs = p.blocks.filter((b): b is Extract<Block, { type: "x" }> => b.type === "x");
  if (xs.length) {
    const ok = xs.filter((x) => { try { resolve(x.address); return true; } catch { return false; } }).length;
    out.push(`It contains ${plural(xs.length, "computational address", "computational addresses")}. This site resolves ${ok === xs.length ? "each one" : `${ok} of them`} with its fixed registry. Open one to step it, perturb it or trace it: every step is a new address.`);
  }
  const claims = p.blocks.filter((b): b is Extract<Block, { type: "claim" }> => b.type === "claim");
  if (claims.length) out.push(`It makes ${plural(claims.length, "claim")}, each with a status its composer asserted (${[...new Set(claims.map((c) => c.status))].join(", ")}). This site shows the statuses; it does not check them.`);
  if (count(p, "choice")) out.push(`It offers ${plural(count(p, "choice"), "choice")}: each option leads to another addressed object.`);
  if (count(p, "pearl")) out.push(`It links to ${plural(count(p, "pearl"), "other Pearl")}. Each is a separate object with its own id.`);
  if (count(p, "prompt")) out.push(`It holds ${plural(count(p, "prompt"), "prompt")} you can copy into any AI. The site never runs them.`);
  if (p.from) out.push(`It says it was derived from ${p.from}. That is lineage as asserted, not proof of authorship.`);
  out.push(`Its content id is ${id}: this exact content has this identity. Change one character and the id changes.`);
  return out;
}

export function livingPearl(p: Pearl, opts: { id?: string; digest?: string; link?: string } = {}): LivingRecord {
  const digest = opts.digest ?? pearlDigest(p);
  const id = opts.id ?? idFromDigest(digest);
  const related = relatedOf(p);
  const cs = continuityState(p);
  const affordances: Affordance[] = [];
  const opens = related.filter((r) => r.kind !== "link" && r.kind !== "parent");
  if (opens.length) affordances.push(afford("open", { options: opens.map((r) => ({ label: r.kind === "address" ? `computation ${r.label}` : r.label, href: r.href, detail: r.kind })) }));
  affordances.push(afford("verify"), afford("inspect"), afford("explain"), afford("fork"), afford("remix"), afford("compare"), afford("carry"));
  if (cs.entries > 0) affordances.push(afford("continue"));
  if (count(p, "prompt")) affordances.push(afford("prompt"));
  affordances.push(afford("save"), afford("copy-id"), afford("copy-link"));

  const evidence: EvidenceRow[] = [
    { what: "Content id", knowing: "checked", detail: `${id} = the first 80 bits of sha256 of the canonical form (${digest.slice(0, 16)}…), recomputed from the link itself. This exact object has this identity.` },
    { what: "Composer and session", knowing: "asserted", detail: `by=${p.by ?? "(none)"} · session=${p.session ?? "(none)"}. Written into the link by whoever composed it. Nothing here proves who that was.` },
  ];
  if (p.for) evidence.push({ what: "Who it is for", knowing: "asserted", detail: p.for });
  if (p.from) evidence.push({ what: "Lineage", knowing: "asserted", detail: `from=${p.from}: derived from that Pearl, as the composer says. The parent's content is not carried here.` });
  for (const b of p.blocks) {
    if (b.type === "x") {
      try { const r = resolve(b.address); evidence.push({ what: `Computation ${b.address}`, knowing: "computed", detail: `resolved by this site: value_sha256 ${r.identity.value_sha256.slice(0, 16)}…`, ref: "E-006", status: "REPRODUCED" }); }
      catch { evidence.push({ what: `Computation ${b.address}`, knowing: "cannot be established", detail: "the address does not resolve within this site's registry and limits" }); }
    }
    if (b.type === "claim") evidence.push({ what: b.text.length > 80 ? b.text.slice(0, 77) + "…" : b.text, knowing: "asserted", status: b.status.toUpperCase(), detail: `the composer marks this ${b.status}. This site does not check it.` });
    if (b.type === "research") { const n = NODES.find((x) => x.id === b.id); if (n) evidence.push({ what: `Research node: ${n.name}`, knowing: "recorded", detail: "from this site's research record, where every claim carries its own evidence status", ref: `/research/${n.id}` }); }
    if (b.type === "link") evidence.push({ what: `Link to ${b.host}`, knowing: "external", detail: "not fetched or checked by this site" });
  }
  if (cs.entries) evidence.push({ what: `${cs.entries} continuity entries`, knowing: "asserted", detail: "what a session wrote down for the next one. Not memory, and not verified." });
  evidence.push({ what: "Authorship and truth", knowing: "cannot be established", detail: "A content id proves the content, not who wrote it or whether it is true. Identity ≠ authorship." });

  const state: Record<string, Json> = { type: p.type, parts: p.blocks.length, by_kind: Object.fromEntries([...new Set(p.blocks.map((b) => (b.type === "c" ? b.kind : b.type)))].map((k) => [k, p.blocks.filter((b) => (b.type === "c" ? b.kind : b.type) === k).length])) };
  if (cs.entries) state.continuity = { open_threads: cs.open, closed_threads: cs.closed, next_actions: cs.actions };
  if (p.from) state.from = p.from;

  return {
    format: LIVING_FORMAT,
    identity: { kind: "pearl", id, hash: digest, address: opts.link ?? `/p/${id}`, means: "This exact object has this identity. The id names the content, not its author." },
    type: p.type,
    title: p.title,
    state,
    affordances,
    history: p.from ? [{ from: p.from, op: "fork", to: id, label: "derived" }] : [],
    parent: p.from ?? null,
    related,
    evidence,
    explanation: explainPearl(p, id),
    limits: { blocks: 40, url_chars: 8000, block_chars: 1500 },
  };
}

/** FORK: the same composition, a new object. from= names the parent; the parent is never modified. */
export function forkPearl(p: Pearl, parentId: string, change: Partial<Pick<Pearl, "title" | "blocks">> = {}, as: { by?: string; session?: string } = {}): Pearl {
  const out: Pearl = { format: p.format, type: p.type, title: change.title ?? p.title, by: as.by ?? "a person, on Pearls", for: p.for, session: as.session ?? `fork-${parentId.slice(2, 8)}`, blocks: change.blocks ?? p.blocks.map((b) => JSON.parse(JSON.stringify(b))) };
  out.from = parentId;
  return out;
}
