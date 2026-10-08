import { TEXT_LIMIT, normalizeText, slugify, countText } from "@/lib/capabilities";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";
const OPS = { normalize: normalizeText, slug: slugify, count: countText } as const;

export async function GET(req: Request, ctx: { params: Promise<{ op: string }> }) {
  const l = limited(req); if (l) return l;
  const { op } = await ctx.params;
  if (!(op in OPS)) return json(404, { error: "unknown_operation", operations: Object.keys(OPS) });
  const text = new URL(req.url).searchParams.get("text");
  if (text === null) return json(400, { error: "missing_text", message: "Pass ?text=…" });
  if (text.length > TEXT_LIMIT) return json(413, { error: "too_long", limit: TEXT_LIMIT });
  return json(200, { capability: "text.transform", version: "1", op, result: OPS[op as keyof typeof OPS](text), provenance: { engine: "javascript", deterministic: true } });
}
