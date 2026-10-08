import { parseExperience, type Parsed } from "./experience";
import { NODES } from "@/content/research";

export const RESEARCH_IDS = new Set(NODES.map((n) => n.id));
type SP = Record<string, string | string[] | undefined>;

/**
 * Rebuild the query string from searchParams.
 *
 * Note: Next.js normalises the query before any application code runs (it
 * groups repeated keys and re-encodes values), so the raw string is not
 * available here. Repeated b= keep their relative order; numbered b1… keep
 * theirs by index. A bare "&" inside text cannot be recovered server-side;
 * the paste resolver (src/lib/pearl/resolve.ts), which sees the raw text, can.
 */
export function queryOf(sp: SP): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, x);
  return q.toString();
}

export async function parseRequest(sp: SP): Promise<{ parsed: Parsed; query: string }> {
  const query = queryOf(sp);
  return { parsed: parseExperience(sp, RESEARCH_IDS, query.length + 30), query };
}
