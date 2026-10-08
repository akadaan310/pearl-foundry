/**
 * The Pearl resolver: anything a person pastes → a typed, validated result.
 *
 * It never fetches anything, never follows redirects, never executes content.
 * It recognises Pearls on trusted origins, parses them with the one experience/1
 * parser, recomputes their id, and says exactly where the content came from.
 */

import { TRUSTED_ORIGINS, ORIGIN } from "../../config/origin";
import { parseExperience, parseQueryString, LIMITS, type Experience } from "../experience";
import { pearlDigest, idFromDigest, toPearl, TYPE_INFO, type Pearl } from "./model";
import { pearlUrl } from "./serialize";
import { decodePortable, encodePortable, splitPortable } from "./portable";

export type ResolutionStatus =
  | "valid"        // content available from the URL itself
  | "local"        // content available only from this browser's library
  | "unavailable"  // an id with no content we can reach
  | "unsupported"  // recognised, but not something this deployment can open
  | "external"     // a URL on another site: shown, never fetched
  | "malformed"    // not a usable URL or Pearl text
  | "invalid"      // a Pearl that fails validation
  | "empty";

export type Source = "url" | "portable" | "local" | "text" | "export";

export interface Resolution {
  status: ResolutionStatus;
  source: Source | null;
  input: string;
  pearl?: Pearl;
  id?: string;
  digest?: string;
  links?: { e: string; portable: string; compact: string };
  capabilities: string[];
  warnings: string[];
  errors: string[];
  notes: string[];
  url?: string;
}

const MAX_INPUT = 20_000;
const TRUSTED_HOSTS = new Set(TRUSTED_ORIGINS.map((o) => new URL(o).host));

export interface LocalLookup { (id: string): { pearl: Pearl; digest: string } | undefined }

/** Every URL-looking token in pasted text, with trailing punctuation removed. */
export function findUrls(text: string): string[] {
  return (text.match(/https?:\/\/[^\s<>"'`]+/g) ?? []).map((u) => {
    let v = u;
    // Trailing punctuation from prose or Markdown is not part of the link, unless it closes a "(" inside it.
    while (/[)\].,;:!?]$/.test(v)) {
      if (v.endsWith(")") && (v.match(/\(/g)?.length ?? 0) >= (v.match(/\)/g)?.length ?? 0)) break;
      v = v.slice(0, -1);
    }
    return v;
  });
}

const PEARL_PATH = /^\/(e|e\.json|p\/.+|x\/.+|c\/.+)$/;
const pathOf = (u: string) => { try { return new URL(u.replace(/#/g, "%23")).pathname; } catch { return ""; } };

const looksLikeLines = (t: string) => {
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.filter((l) => /^[A-Za-z0-9]{1,10}\s*:/.test(l)).length >= Math.ceil(lines.length * 0.6);
};

async function finish(base: Omit<Resolution, "links" | "id" | "digest" | "capabilities" | "warnings">, doc: Experience, warnings: string[]): Promise<Resolution> {
  const pearl = toPearl(doc);
  const digest = pearlDigest(pearl);
  const e = pearlUrl(pearl);
  const portable = (await encodePortable(pearl)).url;
  const caps = [TYPE_INFO[pearl.type].does];
  if (pearl.blocks.some((b) => b.type === "x")) caps.push("Contains computations that this site resolves and verifies.");
  if (pearl.blocks.some((b) => b.type === "c")) caps.push("Contains continuity entries asserted by the composing session.");
  return {
    ...base,
    pearl,
    digest,
    id: idFromDigest(digest),
    links: { e, portable, compact: portable.length < e.length ? portable : e },
    capabilities: caps,
    warnings,
  };
}

export async function resolvePearl(input: string, local?: LocalLookup): Promise<Resolution> {
  const text = input.trim();
  const empty = (status: ResolutionStatus, errors: string[] = [], extra: Partial<Resolution> = {}): Resolution =>
    ({ status, source: null, input: text, capabilities: [], warnings: [], errors, notes: [], ...extra });
  if (!text) return empty("empty");
  if (text.length > MAX_INPUT) return empty("invalid", [`The input is ${text.length} characters; the limit is ${MAX_INPUT}.`]);

  // 1. An exported Pearl record (JSON).
  if (text.startsWith("{")) {
    try {
      const j = JSON.parse(text);
      const rec = j?.format === "pearl/1" ? j : j?.pearl?.format === "pearl/1" ? j.pearl : null;
      if (!rec) return empty("malformed", ["This JSON is not a Pearl. Paste a Pearl link, or import a library export from the workspace."]);
      const { pearlQuery } = await import("./serialize");
      const r = parseExperience(pearlQuery(rec as Pearl), new Set(RESEARCH_IDS));
      if (r.errors.length) return empty("invalid", r.errors);
      return finish({ status: "valid", source: "export", input: text, errors: [], notes: ["Read from a pasted Pearl record."] }, r.doc, r.warnings);
    } catch {
      return empty("malformed", ["This looks like JSON but does not parse."]);
    }
  }

  // 2. A URL somewhere in the text.
  const urls = findUrls(text);
  const trusted = urls.filter((u) => { try { return TRUSTED_HOSTS.has(new URL(u).host); } catch { return false; } });
  const pearlish = [...new Set(trusted.filter((u) => PEARL_PATH.test(pathOf(u))))];
  if (pearlish.length > 1) return empty("malformed", [`The text contains ${pearlish.length} different Pearl links. Paste one at a time.`], { notes: pearlish.map((u) => u.slice(0, 120)) });

  if (pearlish.length === 1) return resolveUrl(pearlish[0], text, local);
  if (trusted.length >= 1) {
    const u = new URL(trusted[0]);
    return empty("unsupported", [`${u.pathname} is a page on this site, not a Pearl.`], { url: trusted[0], notes: ["Pearls live at /e?…, /p/… and /x/…"] });
  }
  if (urls.length >= 1) {
    let host = "";
    try { host = new URL(urls[0]).host; } catch { /* reported below */ }
    if (!host) return empty("malformed", ["That link could not be read as a URL."]);
    return empty("external", [], { url: urls[0], notes: [`This is a link to ${host}, not a Pearl on ${new URL(ORIGIN).host}. It is not fetched: this site never opens other sites on your behalf. If an AI gave you the content of a Pearl instead of a link, paste that content here.`] });
  }

  // 3. A bare Pearl path or query ("/e?…", "e?…", "?title=…").
  const m = /^(?:\/?e(?:\.json)?)?\?(.+)$/s.exec(text);
  if (m) return resolveQuery(m[1], text, "text", []);

  // 4. Grammar lines pasted as text ("h: Hello", "p: …").
  if (looksLikeLines(text)) {
    const r = parseExperience(new URLSearchParams([["s", text]]), new Set(RESEARCH_IDS), text.length);
    if (r.errors.length) return empty("invalid", r.errors);
    return finish({ status: "valid", source: "text", input: text, errors: [], notes: ["Read as Pearl lines: one block per line."] }, r.doc, r.warnings);
  }

  return empty("malformed", ["No Pearl found. Paste a link that begins " + ORIGIN + "/e? or /p/, or Pearl lines such as “h: A title” and “p: Some text”."]);
}

/** Recover what a raw "#" and a bare "&" did to a pasted /e link, then parse it. */
async function resolveUrl(raw: string, input: string, local?: LocalLookup): Promise<Resolution> {
  const notes: string[] = [];
  let urlText = raw;
  const qi = urlText.indexOf("?");
  // In pasted text a "#" inside an /e query is text, not a fragment: browsers would have cut the link there.
  if (qi > 0 && /\/e(\.json)?\?/.test(urlText) && urlText.indexOf("#", qi) > 0) {
    urlText = urlText.slice(0, qi) + urlText.slice(qi).replace(/#/g, "%23");
    notes.push("Recovered: the link contained a raw “#”. A browser would have cut everything after it; it was read as text.");
  }
  let u: URL;
  try { u = new URL(urlText); } catch { return { status: "malformed", source: null, input, capabilities: [], warnings: [], errors: ["That link could not be read as a URL."], notes }; }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "localhost")) {
    return { status: "malformed", source: null, input, capabilities: [], warnings: [], errors: [`Unsupported scheme ${u.protocol}`], notes };
  }
  const path = u.pathname;
  if (path === "/e" || path === "/e.json") {
    const raws = urlText.slice(urlText.indexOf("?") + 1);
    return resolveQuery(raws, input, "url", notes, urlText);
  }
  if (path.startsWith("/p/")) {
    const parts = splitPortable(path);
    if (!parts) return { status: "malformed", source: null, input, capabilities: [], warnings: [], errors: ["This /p/ link does not contain a valid Pearl id."], notes };
    if (!parts.token) {
      const hit = local?.(parts.id);
      if (hit) return finish({ status: "local", source: "local", input, errors: [], notes: [...notes, "Found in this browser's Pearl library only. The link alone does not carry its content, so it will not open on another device."] }, pearlToDoc(hit.pearl), []);
      return { status: "unavailable", source: null, input, id: parts.id, capabilities: [], warnings: [], errors: [`${parts.id} names content that is not in this link, and not in this browser's library. A content id cannot recover its content.`], notes };
    }
    try {
      const q = await decodePortable(parts.token);
      const r = await resolveQuery(q, input, "portable", notes, urlText);
      if (r.id && r.id !== parts.id) return { ...r, status: "invalid", errors: [`The payload hashes to ${r.id}, not ${parts.id}: the link is corrupted or was edited.`] };
      return r;
    } catch (e) {
      return { status: "invalid", source: null, input, id: parts.id, capabilities: [], warnings: [], errors: [`The portable payload could not be read: ${(e as Error).message}.`], notes };
    }
  }
  if (path.startsWith("/x/")) {
    const doc = parseExperience(new URLSearchParams([["type", "computation"], ["title", "Computation " + path.slice(2)], ["b", "x:" + path.slice(2)]]), new Set(RESEARCH_IDS));
    if (doc.errors.length || !doc.doc.blocks.length) return { status: "invalid", source: null, input, capabilities: [], warnings: doc.warnings, errors: doc.errors.length ? doc.errors : ["Not a computational address."], notes };
    return finish({ status: "valid", source: "url", input, errors: [], notes: [...notes, "A computational address, wrapped as a computation Pearl."] }, doc.doc, doc.warnings);
  }
  if (path.startsWith("/c/")) {
    return { status: "unsupported", source: null, input, url: urlText, capabilities: [], warnings: [], errors: ["This is a continuity-brain link. Brains need durable server storage, which is not enabled on this deployment."], notes: [...notes, "Ask the AI that made it to compose a continuity Pearl (/e?type=continuity…) instead: it carries its content in the link."] };
  }
  return { status: "unsupported", source: null, input, url: urlText, capabilities: [], warnings: [], errors: [`${path} is a page on this site, not a Pearl.`], notes };
}

async function resolveQuery(rawQuery: string, input: string, source: Source, notes: string[], url?: string): Promise<Resolution> {
  if (rawQuery.length > LIMITS.urlChars) {
    return { status: "invalid", source, input, url, capabilities: [], warnings: [], errors: [`The Pearl is ${rawQuery.length} characters; the limit is ${LIMITS.urlChars}.`], notes };
  }
  const q = parseQueryString(rawQuery);
  const bare = rawQuery.split("&").length - [...q.keys()].length;
  if (bare > 0) notes.push(`Recovered: ${bare} bare “&” inside text was kept as text, not read as a new parameter.`);
  const r = parseExperience(q, new Set(RESEARCH_IDS), rawQuery.length);
  if (r.errors.length) return { status: "invalid", source, input, url, capabilities: [], warnings: r.warnings, errors: r.errors, notes };
  return finish({ status: "valid", source, input, url, errors: [], notes }, r.doc, r.warnings);
}

function pearlToDoc(p: Pearl): Experience {
  return { grammar: "experience/1", title: p.title, by: p.by, for: p.for, session: p.session, type: p.type, blocks: p.blocks };
}

/** Research node ids, injected to keep this module free of content imports (set by the app at startup). */
export const RESEARCH_IDS: string[] = ["ai-ci", "continuity", "purl", "substrate", "golden-surface", "netscape", "seurl", "musa"];
