import { parseExperience, GRAMMAR_VERSION } from "@/lib/experience";
import { RESEARCH_IDS } from "@/lib/experience-request";
import { toPearl, pearlDigest, idFromDigest, TYPE_INFO } from "@/lib/pearl/model";
import { pearlUrl } from "@/lib/pearl/serialize";
import { encodePortable } from "@/lib/pearl/portable";
import { ORIGIN } from "@/config/origin";
import { livingPearl } from "@/lib/living/pearl";

/**
 * GET /e.json?…: what a Pearl link encodes, as JSON. A composer can open this
 * to check its link before giving it to a person. "received" lists the
 * parameters exactly as they arrived, so a composer can see whether its own
 * fetcher changed the link. Nothing is stored.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Next.js hands route handlers an already-normalised query (repeated keys grouped, values re-encoded).
  const q = new URL(req.url).searchParams;
  const raw = q.toString();
  const r = parseExperience(q, RESEARCH_IDS, raw.length + 30);
  const received = [...q.entries()].map(([k, v]) => [k, v.length > 120 ? v.slice(0, 117) + "…" : v]);
  const blockKeys = received.filter(([k]) => /^(b\d*|block|s)$/.test(k)).length;
  const hints: string[] = [];
  if (blockKeys === 1 && q.has("b") && !q.has("s")) hints.push("Only one block arrived. If you wrote several b= blocks, your fetcher may have merged repeated keys: use numbered blocks b1=, b2=, b3=…");
  if ([...q.keys()].some((k) => !/^(title|t|by|session|for|type|from|b\d*|block|s|format)$/.test(k))) hints.push("Unknown parameters arrived. A bare & or # inside text splits or cuts the link: encode & as %26 and # as %23.");
  const body: Record<string, unknown> = { grammar: GRAMMAR_VERSION, valid: r.errors.length === 0, errors: r.errors, warnings: r.warnings, hints, received, stored: false };
  if (!r.errors.length) {
    const pearl = toPearl(r.doc);
    const digest = pearlDigest(pearl);
    const portable = await encodePortable(pearl);
    Object.assign(body, {
      pearl: { id: idFromDigest(digest), digest: "sha256:" + digest, type: pearl.type, support: TYPE_INFO[pearl.type].support, does: TYPE_INFO[pearl.type].does, blocks: pearl.blocks.length },
      links: { view: pearlUrl(pearl), portable: portable.url, as_received: `${ORIGIN}/e?${raw}` },
      document: r.doc,
      living: livingPearl(pearl, { id: idFromDigest(digest), digest, link: portable.url }),
    });
  } else body.document = r.doc;
  return new Response(JSON.stringify(body, null, 1), {
    status: r.errors.length ? 422 : 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*", "X-Robots-Tag": "noindex" },
  });
}
