/**
 * The continuity brain: ACSP's continuity resource, redesigned for one job.
 * Many AI sessions, at any provider, continue one relationship with one
 * person through a single short URL.
 *
 *   brain      /c/{code}          the persistent record (ACSP: resource)
 *   event      v1, v2, …          append-only, one per write (ACSP: event)
 *   entry      ai, human, nick, nuance, lex, mem, thread, close, said, decision
 *                                 (ACSP: TOK; each carries its source session)
 *   state      fold(events)       who we are to each other, now (ACSP: state)
 *   chain      hash_v = sha256(hash_{v-1} | v | content_hash_v)
 *                                 replayable by anyone (PURL: independent replay)
 *
 * Invariants carried over from ACSP and PURL:
 *   continuity does not imply identity: each session writes as itself;
 *   writes are append-only; supersession does not require deletion;
 *   identity is asserted (no session proves who it is), and the record says so.
 *
 * One deliberate deviation: writes arrive as GET (/c/{code}/w?…), because
 * AI browsing tools can generally only GET. Writes are idempotent by
 * content hash, so a repeated or prefetched GET cannot write twice.
 */

import { canonical, sha256, type Json } from "../canonical";
import type { Block, ContinuityKind, Experience } from "../experience";

export const PROTOCOL = "ACSP-CB/0.1 (continuity brain)";
export const GENESIS_PREV = "sha256:genesis";
export const MAX_EVENTS = 100_000;

export interface Entry { kind: ContinuityKind; key?: string; text: string }

/** What one session writes in one event. This is what gets hashed. */
export interface EventBody {
  session: string;
  by: string | null;
  entries: Entry[];
  /** display blocks and a title: the composed experience (usually only at genesis) */
  title?: string;
  display?: Block[];
}

export interface StoredEvent {
  v: number;
  at: string;
  kind: "genesis" | "append";
  body: EventBody;
  content_hash: string;
  prev: string;
  hash: string;
}

export interface Brain {
  code: string;
  created_at: string;
  head_version: number;
  head_hash: string;
  forgotten: boolean;
}

export const contentHash = (body: EventBody) => "sha256:" + sha256(canonical(body as unknown as Json));
export const chainHash = (prev: string, v: number, content: string) => "sha256:" + sha256(`${prev}|${v}|${content}`);

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford base32: no I, L, O, U
export function newCode(len = 10): string {
  const b = new Uint8Array(len);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => ALPHABET[x & 31]).join("");
}
/** Accept what people and models type: lower case, hyphens, I/L for 1, O for 0. */
export function normaliseCode(raw: string): string | null {
  const c = raw.toUpperCase().replace(/[-\s]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
  return /^[0-9A-HJKMNP-TV-Z]{10}$/.test(c) ? c : null;
}
export const newOwnerKey = () => newCode(10) + newCode(10) + newCode(6);
export const keyHash = (key: string) => "sha256:" + sha256("cb-owner|" + key);

/** Turn a parsed experience into an event body. */
export function bodyFrom(doc: Experience, sessionFallback: string, withDisplay: boolean): EventBody {
  const entries: Entry[] = [];
  const display: Block[] = [];
  for (const b of doc.blocks) {
    if (b.type === "c") entries.push(b.key !== undefined ? { kind: b.kind, key: b.key, text: b.text } : { kind: b.kind, text: b.text });
    else display.push(b);
  }
  const body: EventBody = { session: doc.session ?? sessionFallback, by: doc.by, entries };
  if (withDisplay) {
    if (doc.title && doc.title !== "Untitled experience") body.title = doc.title;
    if (display.length) body.display = display;
  }
  return body;
}

export interface SessionInfo { session: string; by: string | null; first: number; last: number; writes: number; entries: number }
export interface Attributed { text: string; key?: string; session: string; v: number }

export interface State {
  version: number;
  head: string;
  ai: Attributed | null;
  human: Attributed | null;
  names: { ai: Attributed[]; human: Attributed[] };
  nicknames: Attributed[];
  nuances: Attributed[];
  lexicon: Attributed[];
  memories: Attributed[];
  threads: { open: Attributed[]; closed: Attributed[] };
  decisions: Attributed[];
  said: Attributed[];
  sessions: SessionInfo[];
  /** consecutive writers: the transition sequence of sessions (substrateIO: transitions before interpretation) */
  transitions: { from: string; to: string; v: number }[];
  experience: { title: string | null; display: Block[]; v: number } | null;
}

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Fold events into the current state. Pure. Later entries refine earlier ones; nothing is deleted. */
export function fold(events: StoredEvent[], upTo = Infinity): State {
  const st: State = {
    version: 0, head: GENESIS_PREV, ai: null, human: null, names: { ai: [], human: [] },
    nicknames: [], nuances: [], lexicon: [], memories: [], threads: { open: [], closed: [] }, decisions: [], said: [],
    sessions: [], transitions: [], experience: null,
  };
  const sessions = new Map<string, SessionInfo>();
  const keyed = (list: Attributed[], a: Attributed) => {
    const i = list.findIndex((x) => norm(x.key ?? "") === norm(a.key ?? ""));
    if (i >= 0) list.splice(i, 1);
    list.push(a);
  };
  const unique = (list: Attributed[], a: Attributed) => { if (!list.some((x) => norm(x.text) === norm(a.text))) list.push(a); };
  let lastWriter: string | null = null;

  for (const e of events) {
    if (e.v > upTo) break;
    st.version = e.v;
    st.head = e.hash;
    const b = e.body;
    const s = sessions.get(b.session) ?? { session: b.session, by: b.by, first: e.v, last: e.v, writes: 0, entries: 0 };
    s.last = e.v; s.writes += 1; s.entries += b.entries.length; s.by = b.by ?? s.by;
    sessions.set(b.session, s);
    if (lastWriter !== null && lastWriter !== b.session) st.transitions.push({ from: lastWriter, to: b.session, v: e.v });
    lastWriter = b.session;
    if ((b.display?.length || b.title) && (!st.experience || e.kind === "genesis")) st.experience = { title: b.title ?? null, display: b.display ?? [], v: e.v };
    else if (b.display?.length) st.experience = { title: b.title ?? st.experience?.title ?? null, display: b.display, v: e.v };

    for (const en of b.entries) {
      const a: Attributed = { text: en.text, session: b.session, v: e.v, ...(en.key !== undefined ? { key: en.key } : {}) };
      switch (en.kind) {
        case "ai": st.ai = a; st.names.ai.push(a); break;
        case "human": st.human = a; st.names.human.push(a); break;
        case "nick": keyed(st.nicknames, a); break;
        case "lex": keyed(st.lexicon, a); break;
        case "nuance": unique(st.nuances, a); break;
        case "mem": unique(st.memories, a); break;
        case "decision": unique(st.decisions, a); break;
        case "said": st.said.push(a); break;
        case "thread": if (!st.threads.open.some((t) => norm(t.text) === norm(a.text))) st.threads.open.push(a); break;
        case "close": {
          const q = norm(a.text);
          const i = st.threads.open.findIndex((t) => norm(t.text) === q || norm(t.text).startsWith(q) || q.startsWith(norm(t.text)));
          if (i >= 0) st.threads.closed.push({ ...st.threads.open.splice(i, 1)[0], key: `closed by ${a.session} at v${a.v}` });
          break;
        }
      }
    }
  }
  st.sessions = [...sessions.values()];
  return st;
}

/** Recompute every content hash and chain hash. Anyone can run this on /c/{code}/json. */
export function verifyChain(events: StoredEvent[]): { valid: boolean; checked: number; problems: string[] } {
  const problems: string[] = [];
  let prev = GENESIS_PREV;
  events.forEach((e, i) => {
    if (e.v !== i + 1) problems.push(`v${e.v}: expected version ${i + 1}`);
    const ch = contentHash(e.body);
    if (ch !== e.content_hash) problems.push(`v${e.v}: content hash mismatch`);
    if (e.prev !== prev) problems.push(`v${e.v}: prev does not match the previous hash`);
    const h = chainHash(prev, e.v, e.content_hash);
    if (h !== e.hash) problems.push(`v${e.v}: chain hash mismatch`);
    prev = e.hash;
  });
  return { valid: problems.length === 0, checked: events.length, problems };
}
