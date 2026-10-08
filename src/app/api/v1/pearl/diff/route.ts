import { readPearl } from "@/lib/living/input";
import { diffPearls } from "@/lib/living/diff";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/v1/pearl/diff?a={Pearl link}&b={Pearl link} → a structural comparison. */
export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const q = new URL(req.url).searchParams;
  const a = q.get("a"), b = q.get("b");
  if (!a || !b) return json(400, { error: "missing_params", message: "Pass ?a= and ?b=, two Pearl links." });
  const [ra, rb] = await Promise.all([readPearl(a), readPearl(b)]);
  if (!ra.ok || !rb.ok) return json(422, { error: "not_a_pearl", a: ra.ok ? "ok" : ra.errors, b: rb.ok ? "ok" : rb.errors });
  return json(200, { capability: "pearl.diff", version: "1", diff: diffPearls(ra.pearl, rb.pearl), provenance: { engine: "javascript", deterministic: true } });
}
