/**
 * Composed experiences: a page whose entire content lives in its URL.
 *
 * An AI that has read this site can write a URL such as
 *
 *   https://aanebed.vercel.app/e?title=Your+tour&by=Claude&for=a+curious+reader
 *     &b=h:What+PURL+is&b=p:A+URL+that+names+a+resource+and+its+operations.
 *     &b=flow:Address>Program>State>Transition>Result
 *     &b=x:/map/eca/30/16/state/256/trace/24
 *
 * and give it to the person it is talking to. Opening it renders the page.
 * Nothing is stored: the URL is the experience. Content is untrusted and is
 * rendered as plain text; links must be https; sizes are bounded.
 */

import { hashJson, type Json } from "./canonical";
import { ORIGIN, TRUSTED_ORIGINS } from "../config/origin";

export const GRAMMAR_VERSION = "experience/1";

export const LIMITS = { urlChars: 8000, blocks: 40, blockChars: 1500, titleChars: 140, listItems: 24, tableRows: 16, tableCols: 6 } as const;

export type Block =
  | { type: "h"; text: string }
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "facts"; items: { k: string; v: string }[] }
  | { type: "table"; rows: string[][] }
  | { type: "flow"; items: string[] }
  | { type: "code"; text: string }
  | { type: "x"; address: string }
  | { type: "research"; id: string }
  | { type: "link"; href: string; label: string; host: string }
  | { type: "prompt"; text: string }
  | { type: "claim"; status: ClaimStatus; text: string }
  | { type: "pearl"; href: string; label: string }
  | { type: "choice"; prompt: string; options: { label: string; href: string }[] }
  | { type: "c"; kind: ContinuityKind; key?: string; text: string };

/** Evidence statuses a research Pearl may assert for a claim (the site's taxonomy, as the composer's assertion). */
export type ClaimStatus = "observed" | "implemented" | "tested" | "reproduced" | "proposed" | "hypothesis" | "open";
const CLAIM_STATUSES: ClaimStatus[] = ["observed", "implemented", "tested", "reproduced", "proposed", "hypothesis", "open"];

/** Continuity entries: what a session writes down so that other sessions can continue the relationship. */
export type ContinuityKind = "ai" | "human" | "nick" | "nuance" | "lex" | "mem" | "thread" | "close" | "said" | "decision" | "action";

export const CONTINUITY_TYPES: { kind: ContinuityKind; syntax: string; means: string; example: string }[] = [
  { kind: "ai", syntax: "ai:Name", means: "what the AI is called in this relationship", example: "ai:Sunny" },
  { kind: "human", syntax: "human:Name", means: "what to call the person", example: "human:Sam" },
  { kind: "nick", syntax: "nick:Name=who or what it means", means: "a nickname and what it refers to", example: "nick:Captain Commit=what Sunny calls Sam when Sam pushes at 2 a.m." },
  { kind: "nuance", syntax: "nuance:text", means: "tone, habits, running jokes, misspellings that mean something", example: "nuance:Sam writes 'teh' on purpose when excited; never correct it." },
  { kind: "lex", syntax: "lex:term=meaning", means: "a word or phrase coined in this conversation", example: "lex:the drawer=the list of ideas we parked for later" },
  { kind: "mem", syntax: "mem:text", means: "something that happened or was shared", example: "mem:We named the cat project 'Purrl' on the first night." },
  { kind: "thread", syntax: "thread:text", means: "an open thread or next step", example: "thread:Finish the onboarding copy for the Purrl landing page" },
  { kind: "close", syntax: "close:text of the thread", means: "closes an open thread", example: "close:Finish the onboarding copy for the Purrl landing page" },
  { kind: "said", syntax: "said:text", means: "a summary of what this session talked about", example: "said:Sam asked for three taglines; we chose 'Addresses that remember'." },
  { kind: "decision", syntax: "decision:text", means: "something decided together", example: "decision:Ship on Friday, not Thursday." },
  { kind: "action", syntax: "action:text", means: "a concrete next action for whoever continues", example: "action:Send Sam the three taglines before noon" },
];

export interface Experience {
  grammar: typeof GRAMMAR_VERSION;
  title: string;
  by: string | null;
  for: string | null;
  /** a label the composing session chose for itself */
  session: string | null;
  /** optional explicit Pearl type (type=); absent in older links, where it is inferred */
  type?: PearlTypeName;
  /** optional parent Pearl id (from=): set by fork and remix. Lineage as asserted; never proof of authorship */
  from?: string;
  blocks: Block[];
}

export const PEARL_TYPES = ["experience", "continuity", "prompt", "workflow", "research", "computation", "collection", "project", "notes"] as const;
export type PearlTypeName = (typeof PEARL_TYPES)[number];

export interface Parsed {
  doc: Experience;
  id: string;
  warnings: string[];
  errors: string[];
}

/** The block types, documented once and used by the parser, /compose, the manifests and the tests. */
export const BLOCK_TYPES: { type: Block["type"]; syntax: string; renders: string; example: string }[] = [
  { type: "h", syntax: "h:Heading text", renders: "a section heading", example: "h:Why this matters to you" },
  { type: "p", syntax: "p:Paragraph text", renders: "a paragraph", example: "p:PURL treats a URL as the address of a resource and the operations on it." },
  { type: "note", syntax: "note:Text", renders: "a highlighted aside", example: "note:This part is a hypothesis, not a result." },
  { type: "quote", syntax: "quote:Text|Attribution", renders: "a pull quote", example: "quote:Continuity does not imply identity.|ACSP invariant" },
  { type: "list", syntax: "list:item|item|item", renders: "a bulleted list", example: "list:ACSP|PURL|substrateIO" },
  { type: "steps", syntax: "steps:first|second|third", renders: "a numbered sequence", example: "steps:Open the URL|Read the manifest|Run one address" },
  { type: "facts", syntax: "facts:Key=Value|Key=Value", renders: "a definition list", example: "facts:Protocol=ACSP/0.1|Harness=402 checks" },
  { type: "table", syntax: "table:H1;H2|a;b|c;d", renders: "a table (rows split by |, cells by ;; first row is the header)", example: "table:Project;Status|PURL;tested|SEURL;proposed" },
  { type: "flow", syntax: "flow:A>B>C", renders: "a transition chain", example: "flow:Question>Manifest>Experiment>Evidence" },
  { type: "code", syntax: "code:text", renders: "monospace text", example: `code:curl ${ORIGIN}/research.json` },
  { type: "x", syntax: "x:/map/eca/{rule}/{n}/state/{x}/…", renders: "a live computation, resolved by this site and verified by hash", example: "x:/map/eca/30/16/state/256/trace/24" },
  { type: "research", syntax: "research:{node id}", renders: "a card for one research node, from this site's records", example: "research:continuity" },
  { type: "link", syntax: "link:https://…|Label", renders: "an outbound link (https only; the host is always shown)", example: "link:https://github.com/akadaan310/purl|PURL on GitHub" },
  { type: "prompt", syntax: "prompt:text", renders: "a reusable prompt with a copy button (prompt and workflow Pearls)", example: "prompt:Summarise the open threads, then propose one next action." },
  { type: "claim", syntax: "claim:status|text", renders: "a research claim with an asserted status: observed, implemented, tested, reproduced, proposed, hypothesis or open", example: "claim:hypothesis|Numbered blocks survive URL-normalising fetchers." },
  { type: "pearl", syntax: "pearl:URL of another Pearl on this site|Label", renders: "a link to another Pearl (collections)", example: "pearl:/e?title=Night+one&b1=p:Hello|Night one" },
  { type: "choice", syntax: "choice:Question|Label>target|Label>target", renders: "a set of transitions: each option leads to another Pearl or computational address on this site (up to 6; /p/ and /x/ targets are safest inside a link)", example: "choice:Where next?|Take one step>/x/map/eca/90/8/state/5/next|Perturb it>/x/map/eca/90/8/state/5/flip/2" },
];

const ALIASES: Record<string, Block["type"]> = {
  h: "h", h1: "h", h2: "h", heading: "h", title: "h",
  p: "p", text: "p", para: "p", paragraph: "p",
  note: "note", aside: "note", callout: "note",
  quote: "quote", q: "quote",
  list: "list", ul: "list", bullets: "list",
  steps: "steps", ol: "steps", sequence: "steps",
  facts: "facts", kv: "facts", dl: "facts",
  table: "table",
  flow: "flow", chain: "flow",
  code: "code", pre: "code",
  x: "x", compute: "x", address: "x",
  research: "research", node: "research",
  link: "link", a: "link", url: "link",
  prompt: "prompt", ask: "prompt",
  claim: "claim", finding: "claim",
  pearl: "pearl", item: "pearl",
  choice: "choice", choose: "choice", options: "choice",
};

const C_ALIASES: Record<string, ContinuityKind> = {
  ai: "ai", me: "ai", self: "ai", human: "human", user: "human", you: "human",
  nick: "nick", nickname: "nick", nuance: "nuance", quirk: "nuance", style: "nuance",
  lex: "lex", term: "lex", word: "lex", mem: "mem", memory: "mem",
  thread: "thread", todo: "thread", next: "thread", close: "close", done: "close",
  said: "said", turn: "said", summary: "said", decision: "decision", decided: "decision", action: "action",
};

/** Control characters out, whitespace collapsed, bounded. */
function clean(s: string, max: number = LIMITS.blockChars): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").replace(/[ \t]+/g, " ").trim().slice(0, max);
}
const split = (s: string, sep: string | RegExp, max: number) => s.split(sep).map((x) => clean(x, 400)).filter(Boolean).slice(0, max);

/** Undo the encoding mistakes language models commonly make: double encoding, leftover %20s. */
function tolerant(v: string): string {
  let s = v;
  for (let i = 0; i < 2 && /%[0-9A-Fa-f]{2}/.test(s); i++) {
    try { s = decodeURIComponent(s); } catch { break; }
  }
  return s;
}

/** A target on this site: a Pearl (/e, /p), a computational address (/x, /live) or a continuity record (/c). */
function sitePath(raw: string): string | null {
  const h = raw.trim();
  let path: string | null = null;
  if (h.startsWith("/")) path = h;
  else { try { const u = new URL(h); if (u.protocol === "https:" && TRUSTED_HOSTS.has(u.host)) path = u.pathname + u.search; } catch { /* rejected */ } }
  return path && /^\/(e|p|x|c|live)(\/|\?|$)/.test(path) ? path.slice(0, 4000) : null;
}

export function parseBlock(raw: string, warnings: string[], researchIds: Set<string>): Block | null {
  const s = tolerant(raw);
  const m = /^\s*([A-Za-z0-9]{1,10})\s*:\s?([\s\S]*)$/.exec(s);
  const ck = m ? C_ALIASES[m[1].toLowerCase()] : undefined;
  if (m && ck) {
    const body = clean(m[2]);
    if (!body) return null;
    if (ck === "nick" || ck === "lex") {
      const i = body.search(/[=:]/);
      return i > 0 ? { type: "c", kind: ck, key: clean(body.slice(0, i), 80), text: clean(body.slice(i + 1)) } : { type: "c", kind: ck, key: body.slice(0, 80), text: "" };
    }
    return { type: "c", kind: ck, text: ck === "ai" || ck === "human" ? body.slice(0, 80) : body };
  }
  const type = m ? ALIASES[m[1].toLowerCase()] : undefined;
  if (!m || !type) {
    const t = clean(s);
    if (!t) return null;
    warnings.push(`block without a known type ("${t.slice(0, 24)}…") rendered as a paragraph`);
    return { type: "p", text: t };
  }
  const body = m[2];
  switch (type) {
    case "h": case "p": case "note": case "code": {
      const text = type === "code" ? body.slice(0, LIMITS.blockChars).replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "") : clean(body);
      return text ? { type, text } : null;
    }
    case "quote": {
      const [text, cite] = body.split("|");
      return { type, text: clean(text), cite: cite ? clean(cite, 120) : undefined };
    }
    case "list": case "steps": case "flow": {
      const items = split(body, type === "flow" ? /\s*(?:>|→|->)\s*/ : "|", LIMITS.listItems);
      return items.length ? { type, items } : null;
    }
    case "facts": {
      const items = split(body, "|", LIMITS.listItems).map((pair) => {
        const i = pair.search(/[=:]/);
        return i > 0 ? { k: clean(pair.slice(0, i), 80), v: clean(pair.slice(i + 1), 400) } : { k: pair, v: "" };
      });
      return items.length ? { type, items } : null;
    }
    case "table": {
      const rows = body.split("|").slice(0, LIMITS.tableRows).map((r) => r.split(";").slice(0, LIMITS.tableCols).map((c) => clean(c, 200)));
      return rows.length && rows[0].length ? { type, rows } : null;
    }
    case "x": {
      let a = body.trim();
      a = a.replace(/^https?:\/\/[^/]+/, "").replace(/^\/x(?=\/)/, "");
      if (!a.startsWith("/")) a = "/" + a;
      if (!/^\/[a-z0-9/]{1,200}$/.test(a)) { warnings.push(`computation address rejected: ${clean(body, 60)}`); return null; }
      return { type, address: a };
    }
    case "research": {
      const id = clean(body, 40).toLowerCase();
      if (!researchIds.has(id)) { warnings.push(`unknown research node "${id}"`); return null; }
      return { type, id };
    }
    case "link": {
      const [href, ...rest] = body.split("|");
      let u: URL;
      try { u = new URL(href.trim()); } catch { warnings.push(`link rejected (not a URL): ${clean(href, 60)}`); return null; }
      if (u.protocol !== "https:" || u.username || u.password) { warnings.push(`link rejected (https only, no credentials): ${u.protocol}//${u.host}`); return null; }
      return { type, href: u.toString(), label: clean(rest.join("|"), 120) || u.host, host: u.host };
    }
    case "prompt": {
      const text = body.slice(0, LIMITS.blockChars).replace(/[\u0000-\u0008\u000b-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim();
      return text ? { type, text } : null;
    }
    case "claim": {
      const i = body.indexOf("|");
      const st = (i > 0 ? body.slice(0, i) : "").trim().toLowerCase() as ClaimStatus;
      const text = clean(i > 0 ? body.slice(i + 1) : body);
      if (!text) return null;
      if (!CLAIM_STATUSES.includes(st)) { warnings.push(`claim without a known status ("${clean(st, 20)}") recorded as open`); return { type, status: "open", text }; }
      return { type, status: st, text };
    }
    case "pearl": {
      const [href, ...rest] = body.split("|");
      const path = sitePath(href);
      if (!path) { warnings.push(`pearl link rejected (must be a Pearl on this site): ${clean(href, 60)}`); return null; }
      return { type, href: path, label: clean(rest.join("|"), 120) || "Pearl" };
    }
    case "choice": {
      // Options are "Label>target"; a "|" inside a target (an unencoded /e link) is re-joined to it.
      const parts = body.split("|");
      const prompt = clean(parts.shift() ?? "", 200);
      const raw: string[] = [];
      for (const part of parts) {
        if (/^[^>]{1,80}>\s*(\/|https:)/.test(part) || !raw.length) raw.push(part);
        else raw[raw.length - 1] += "|" + part;
      }
      const options: { label: string; href: string }[] = [];
      for (const o of raw) {
        const i = o.indexOf(">");
        const label = clean(i > 0 ? o.slice(0, i) : "", 80);
        const path = i > 0 ? sitePath(o.slice(i + 1)) : null;
        if (!label || !path) { warnings.push(`choice option rejected (needs Label>target on this site): ${clean(o, 60)}`); continue; }
        if (options.length >= 6) { warnings.push("a choice holds at most 6 options; the rest were dropped"); break; }
        options.push({ label, href: path });
      }
      if (!options.length) { warnings.push("choice without a valid option dropped"); return null; }
      return { type, prompt: prompt || "Choose", options };
    }
  }
  return null;
}

const TRUSTED_HOSTS = new Set(TRUSTED_ORIGINS.filter((o) => o.startsWith("https:")).map((o) => new URL(o).host));

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

/** Keys the grammar defines. Anything else in a raw query is treated as part of the previous value. */
export const KNOWN_KEYS = /^(title|t|by|session|for|type|from|b|block|s|b\d{1,3}|format)$/;

/**
 * Parse a raw query string the way a person or a model meant it, not only the
 * way a browser split it:
 *  - a bare "&" inside text ("Tom & Jerry") does not start a new parameter
 *    unless what follows is a known key with "=";
 *  - "#" inside pasted text is text, not a fragment (only when parsing pasted text).
 * Repeated keys and their order are preserved.
 */
export function parseQueryString(raw: string): URLSearchParams {
  const q = raw.replace(/^\?/, "");
  const out: [string, string][] = [];
  for (const seg of q.split("&")) {
    const eq = seg.indexOf("=");
    const key = eq > 0 ? decodeKey(seg.slice(0, eq)) : null;
    if (key !== null && KNOWN_KEYS.test(key)) out.push([key, seg.slice(eq + 1)]);
    else if (out.length) out[out.length - 1][1] += "%26" + seg;
    else if (seg) out.push([key ?? seg, eq > 0 ? seg.slice(eq + 1) : ""]);
  }
  const p = new URLSearchParams();
  for (const [k, v] of out) {
    let val: string;
    try { val = decodeURIComponent(v.replace(/\+/g, " ")); } catch { val = v.replace(/\+/g, " "); }
    p.append(k, val);
  }
  return p;
}
function decodeKey(k: string): string { try { return decodeURIComponent(k).trim().toLowerCase(); } catch { return k; } }

/** All block carriers, in order: numbered b1… (by index, which survives fetchers that sort or de-duplicate keys), then repeated b=, then s= lines. */
function blockCarriers(p: Params, warnings: string[]): string[] {
  const keys: string[] = p instanceof URLSearchParams ? [...new Set(p.keys())] : Object.keys(p);
  const numbered = keys
    .map((k) => /^b(\d{1,3})$/.exec(k))
    .filter((m): m is RegExpExecArray => !!m)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .flatMap((m) => all(p, m[0]));
  const repeated = [...all(p, "b"), ...all(p, "block")];
  // s=: one block per line. Real newlines, %0A, and the two-character sequence \n (as models often write it) all separate lines.
  const lines = all(p, "s").flatMap((s) => tolerant(s).split(/\r?\n|\\n/));
  const used = [numbered.length > 0, repeated.length > 0, lines.length > 0].filter(Boolean).length;
  if (used > 1) warnings.push("blocks arrived in more than one form (b1…, b=, s=); they were joined in that order");
  return [...numbered, ...repeated, ...lines];
}

function all(p: Params, key: string): string[] {
  if (p instanceof URLSearchParams) return p.getAll(key);
  const v = p[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

/** Parse a composed experience from query parameters. Never throws. */
export function parseExperience(p: Params | string, researchIds: Set<string>, rawLength = 0): Parsed {
  if (typeof p === "string") { rawLength = rawLength || p.length; p = parseQueryString(p); }
  const warnings: string[] = [];
  const errors: string[] = [];
  if (rawLength > LIMITS.urlChars) errors.push(`URL is ${rawLength} characters; the limit is ${LIMITS.urlChars}`);

  const rawBlocks = blockCarriers(p, warnings).filter((x) => x.trim() !== "");
  if (rawBlocks.length > LIMITS.blocks) warnings.push(`${rawBlocks.length} blocks; only the first ${LIMITS.blocks} are rendered`);
  const blocks = rawBlocks.slice(0, LIMITS.blocks).map((b) => parseBlock(b, warnings, researchIds)).filter((b): b is Block => b !== null);

  const title = clean(tolerant(all(p, "title")[0] ?? all(p, "t")[0] ?? ""), LIMITS.titleChars);
  const by = clean(tolerant(all(p, "by")[0] ?? ""), 60) || null;
  const forWhom = clean(tolerant(all(p, "for")[0] ?? ""), 140) || null;
  const session = clean(tolerant(all(p, "session")[0] ?? ""), 60).replace(/[^\p{L}\p{N} ._-]/gu, "") || null;
  if (!title && !blocks.length) errors.push(`empty: no title and no blocks arrived. See ${ORIGIN}/compose for the grammar.`);
  if (!by) warnings.push("no by= parameter: the composer is not named");

  const typeRaw = clean(all(p, "type")[0] ?? "", 20).toLowerCase();
  const doc: Experience = { grammar: GRAMMAR_VERSION, title: title || "Untitled experience", by, for: forWhom, session, blocks };
  if (typeRaw) {
    if (PEARL_TYPES.includes(typeRaw as PearlTypeName)) doc.type = typeRaw as PearlTypeName;
    else warnings.push(`unknown type "${typeRaw}" ignored; the type is inferred from the blocks`);
  }
  const fromRaw = clean(all(p, "from")[0] ?? "", 40).toLowerCase();
  if (fromRaw) {
    if (/^p_[0-9abcdefghjkmnpqrstvwxyz]{16}$/.test(fromRaw)) doc.from = fromRaw;
    else warnings.push(`from= is not a Pearl id ("${fromRaw.slice(0, 20)}"); lineage ignored`);
  }
  if (!blocks.length && title) warnings.push("this Pearl has a title but no blocks: it is valid, but there is nothing to experience yet. Add blocks (h, p, x, choice, pearl, prompt…) to make it alive");
  return { doc, id: hashJson(doc as unknown as Json), warnings, errors };
}

/** Build the canonical URL for a document (used by /compose and the tests). */
export function experienceUrl(origin: string, doc: { title?: string | null; by?: string | null; for?: string | null; session?: string | null; lines: string[] }, path = "/e"): string {
  const q = new URLSearchParams();
  if (doc.title) q.set("title", doc.title);
  if (doc.by) q.set("by", doc.by);
  if (doc.for) q.set("for", doc.for);
  if (doc.session) q.set("session", doc.session);
  let n = 0;
  for (const l of doc.lines) if (l.trim()) q.append(`b${++n}`, l.trim()); // numbered: survives fetchers that merge or sort repeated keys
  return `${origin}${path}?${q.toString()}`;
}

/** A short example a model can copy and adapt. */
export const EXAMPLE_URL =
  ORIGIN + "/e?title=A+tour+for+Sam&by=Claude&for=Sam%2C+a+product+designer&b=h:The+idea+in+one+line&b=p:A+URL+can+name+a+computation%2C+not+only+a+document.&b=flow:Address>Program>State>Transition>Result&b=x:/map/eca/90/8/state/5/next&b=research:purl&b=note:Proposed%2C+not+yet+shown%3A+that+AI+systems+will+use+this+on+their+own.";
