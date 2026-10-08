import { loadBrain } from "@/lib/continuity/request";
import { verifyChain } from "@/lib/continuity/model";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ code: string }> }) {
  const r = await loadBrain((await ctx.params).code);
  if (!r.data) return Response.json({ error: r.reason }, { status: 404 });
  return Response.json({ code: r.code, head: r.data.brain.head_hash, ...verifyChain(r.data.events), method: "content_hash = sha256(canonical JSON of body); hash_v = sha256(hash_{v-1} | v | content_hash), hash_0 = sha256:genesis" }, { headers: { "Cache-Control": "no-store" } });
}
