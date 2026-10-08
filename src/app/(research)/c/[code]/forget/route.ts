import { getStore } from "@/lib/continuity/store";
import { normaliseCode } from "@/lib/continuity/model";

/** POST /c/{code}/forget with key=<owner key>: erase the brain's content. */
export async function POST(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const code = normaliseCode((await ctx.params).code);
  const store = getStore();
  if (!code || !store) return new Response("Not found", { status: 404 });
  const key = String((await req.formData()).get("key") ?? "").trim();
  const ok = key.length > 0 && (await store.forget(code, key));
  return new Response(null, { status: 303, headers: { Location: ok ? `/continue?forgotten=${code}` : `/c/${code}?forget=failed` } });
}
