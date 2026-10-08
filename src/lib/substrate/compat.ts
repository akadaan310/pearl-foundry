/**
 * Can the substrate store this Pearl as it is? A mirror of the substrate's
 * pearlcore/validate.py block model (strict mode) at e79edac. The canonical
 * hashing agrees byte-for-byte; the block schemas differ, so some site Pearls
 * are rejected there. We never convert a Pearl to fit: that would change its id.
 */
import type { Pearl } from "../pearl/model";

const TEXT = new Set(["h", "p", "note", "quote", "x", "research", "link", "prompt", "claim", "pearl", "ai", "human", "nick", "lex", "nuance", "mem", "said", "decision", "thread", "close", "action"]);
const LISTS = new Set(["list", "steps"]);
const KNOWN = new Set([...TEXT, ...LISTS, "facts", "table", "code"]);

export interface Compat { storable: boolean; problems: { block: number; type: string; why: string }[] }

export function substrateCompat(p: Pearl): Compat {
  const problems: Compat["problems"] = [];
  p.blocks.forEach((b0, i) => {
    const b = b0 as unknown as Record<string, unknown>;
    const t = String(b.type);
    if (!KNOWN.has(t)) { problems.push({ block: i, type: t === "c" ? `c:${String(b.kind)}` : t, why: t === "c" ? "the substrate models continuity kinds as their own block types, not wrapped in c" : "the substrate does not know this block type yet" }); return; }
    if (TEXT.has(t) && typeof b.text !== "string") problems.push({ block: i, type: t, why: "the substrate expects a text field here" });
    if (LISTS.has(t) && !Array.isArray(b.items)) problems.push({ block: i, type: t, why: "the substrate expects items" });
  });
  if (p.from) problems.push({ block: -1, type: "from", why: "the substrate does not model from= yet; it records lineage as fork edges instead" });
  return { storable: problems.length === 0, problems };
}
