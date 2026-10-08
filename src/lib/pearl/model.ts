/**
 * Pearls: programmable URLs for AI.
 *
 * A Pearl is a validated document carried by a URL. Its canonical form is
 * the parsed experience/1 document plus an explicit type; its id is derived
 * from the SHA-256 of that canonical form.
 *
 *   canonical  = canonical JSON (sorted keys, compact, ASCII-escaped) of
 *                { format: "pearl/1", type, title, by, for, session, blocks }
 *   digest     = sha256(canonical), 64 hex characters
 *   id         = "p_" + the first 80 bits of the digest in lower-case Crockford base32 (16 characters)
 *
 * The id is content addressing. It does not identify an author, grant access,
 * or prove that anything a Pearl says is true.
 */

import { canonical, sha256, type Json } from "../canonical";
import type { Block, Experience, PearlTypeName } from "../experience";

export const PEARL_FORMAT = "pearl/1" as const;

export interface Pearl {
  format: typeof PEARL_FORMAT;
  type: PearlTypeName;
  title: string;
  by: string | null;
  for: string | null;
  session: string | null;
  /** parent Pearl id, only on forks and remixes. Absent (not null) otherwise, so v1 ids never change. */
  from?: string;
  blocks: Block[];
}

export type Support = "implemented" | "descriptive";

/** What this site can actually do with each type. Descriptive types are rendered, never executed. */
export const TYPE_INFO: Record<PearlTypeName, { label: string; does: string; support: Support }> = {
  experience: { label: "Experience", does: "Rendered as a page.", support: "implemented" },
  continuity: { label: "Continuity", does: "Rendered as context, vocabulary, decisions, open threads, next actions and provenance. Another AI can read it and compose an updated Pearl.", support: "implemented" },
  prompt: { label: "Prompt", does: "Rendered with copy buttons. The site never runs the prompt.", support: "descriptive" },
  workflow: { label: "Workflow", does: "Rendered as declarative steps and prompts. The site does not execute workflows.", support: "descriptive" },
  research: { label: "Research", does: "Rendered with each claim's asserted status. The site does not verify the claims.", support: "implemented" },
  computation: { label: "Computation", does: "Each computational address is resolved by this site's bounded /x registry and its value hash shown.", support: "implemented" },
  collection: { label: "Collection", does: "Rendered as a list of Pearls on this site. Each reference is checked when opened; references are never expanded recursively.", support: "implemented" },
  project: { label: "Project", does: "Rendered as a project: goal, decisions, open threads, next actions, resources and the Pearls it references.", support: "implemented" },
  notes: { label: "Notes", does: "Rendered as notes and lists: recipes, study notes, ideas.", support: "implemented" },
};

export function inferType(doc: Experience): PearlTypeName {
  if (doc.type) return doc.type;
  const n = (t: Block["type"]) => doc.blocks.filter((b) => b.type === t).length;
  if (n("c") > 0) return "continuity";
  if (n("claim") > 0) return "research";
  if (n("pearl") > 0 && n("pearl") >= doc.blocks.length / 2) return "collection";
  if (n("x") > 0 && n("x") >= doc.blocks.filter((b) => b.type !== "h" && b.type !== "p" && b.type !== "note").length) return "computation";
  if (n("prompt") > 0 && n("steps") > 0) return "workflow";
  if (n("prompt") > 0) return "prompt";
  return "experience";
}

export function toPearl(doc: Experience): Pearl {
  const p: Pearl = { format: PEARL_FORMAT, type: inferType(doc), title: doc.title, by: doc.by, for: doc.for, session: doc.session, blocks: doc.blocks };
  if (doc.from) p.from = doc.from;
  return p;
}

export const canonicalPearl = (p: Pearl) => canonical(p as unknown as Json);
export const pearlDigest = (p: Pearl) => sha256(canonicalPearl(p));

const B32 = "0123456789abcdefghjkmnpqrstvwxyz";
/** First `bits` bits of a hex digest, as lower-case Crockford base32. */
export function base32(hex: string, bits = 80): string {
  let bitstr = "";
  for (const ch of hex) bitstr += parseInt(ch, 16).toString(2).padStart(4, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits; i += 5) out += B32[parseInt(bitstr.slice(i, i + 5), 2)];
  return out;
}

export const ID_PATTERN = /^p_[0-9abcdefghjkmnpqrstvwxyz]{16}$/;
export const idFromDigest = (hex: string) => "p_" + base32(hex);
export const pearlId = (p: Pearl) => idFromDigest(pearlDigest(p));
export const isPearlId = (s: string) => ID_PATTERN.test(s);

/** A short id is a display prefix: two ids collide only if the full digests' first 80 bits match. Always compare full digests. */
export function sameContent(a: { digest: string }, b: { digest: string }) {
  return a.digest === b.digest;
}
