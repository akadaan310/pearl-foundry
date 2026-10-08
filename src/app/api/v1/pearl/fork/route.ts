import { readPearl } from "@/lib/living/input";
import { forkPearl } from "@/lib/living/pearl";
import { pearlDigest, idFromDigest } from "@/lib/pearl/model";
import { pearlUrl } from "@/lib/pearl/serialize";
import { encodePortable } from "@/lib/pearl/portable";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/pearl/fork?u={a Pearl link} → a new Pearl whose from= names the parent. Pure: nothing is stored. */
export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return json(400, { error: "missing_u", message: "Pass ?u= a Pearl link (/e?… or /p/…)." });
  const r = await readPearl(u);
  if (!r.ok) return json(422, { error: "not_a_pearl", status: r.status, errors: r.errors });
  const fork = forkPearl(r.pearl, r.id);
  const digest = pearlDigest(fork);
  const portable = (await encodePortable(fork)).url;
  return json(200, { capability: "pearl.fork", version: "1", parent: { id: r.id, unchanged: true }, fork: { id: idFromDigest(digest), digest, from: r.id, pearl: fork }, links: { e: pearlUrl(fork), portable }, provenance: { engine: "javascript", deterministic: true, note: "from= is lineage as asserted, not proof of authorship" } });
}
