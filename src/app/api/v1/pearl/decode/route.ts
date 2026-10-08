import { decodePortable, splitPortable } from "@/lib/pearl/portable";
import { parseExperience, parseQueryString } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/experience-request";
import { toPearl, pearlId } from "@/lib/pearl/model";
import { pearlUrl } from "@/lib/pearl/serialize";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const u = new URL(req.url).searchParams.get("u") ?? "";
  let seg = u.trim();
  try { if (/^https?:/.test(seg)) seg = new URL(seg).pathname; } catch { /* treated as a segment */ }
  const parts = splitPortable(seg.slice(0, 13_000));
  if (!parts) return json(400, { error: "not_portable", message: "Pass ?u= a /p/{id}.{payload} link." });
  if (!parts.token) return json(422, { error: "no_payload", id: parts.id, message: "This link names a Pearl by its content id but does not carry it; a content id cannot recover its content." });
  let q: string;
  try { q = await decodePortable(parts.token); } catch (e) { return json(422, { error: "unreadable_payload", message: (e as Error).message }); }
  const r = parseExperience(parseQueryString(q), RESEARCH_IDS, q.length);
  if (r.errors.length) return json(422, { error: "invalid_pearl", errors: r.errors });
  const pearl = toPearl(r.doc);
  const id = pearlId(pearl);
  if (id !== parts.id) return json(422, { error: "id_mismatch", claimed: parts.id, actual: id, message: "The payload does not hash to the id in the link." });
  return json(200, { capability: "pearl.decode", version: "1", id, verified: true, view: pearlUrl(pearl), document: pearl, warnings: r.warnings });
}
