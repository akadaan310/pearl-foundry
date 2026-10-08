import { addressOf, readPearl } from "@/lib/living/input";
import { livingAddress } from "@/lib/living/address";
import { livingPearl } from "@/lib/living/pearl";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/living?u={Pearl link | /x/… | /live/… address} → the living record the human page renders. */
export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const u = new URL(req.url).searchParams.get("u");
  if (!u) return json(400, { error: "missing_u", message: "Pass ?u= a Pearl link or a computational address." });
  const a = addressOf(u);
  if (a) return json(200, { capability: "living.describe", version: "1", record: livingAddress(a) });
  const r = await readPearl(u);
  if (!r.ok) return json(422, { error: "not_living", message: "Neither a resolvable computational address nor a valid Pearl.", errors: r.errors });
  return json(200, { capability: "living.describe", version: "1", record: livingPearl(r.pearl, { id: r.id, digest: r.digest, link: r.links.compact }) });
}
