import { substrateUrl } from "@/lib/substrate/status";
import { SubstrateClient } from "@/lib/substrate/client";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * Named genome states, mirrored to the substrate's state.keep when this
 * deployment holds a server-side API key (PEARL_API_KEY). Without it, the
 * route honestly reports {configured:false} and the browser keeps states
 * locally — the UI says which it is. The key never reaches the browser.
 */
function client() {
  const base = substrateUrl();
  const token = process.env.PEARL_API_KEY?.trim();
  if (!base || !token) return null;
  return new SubstrateClient({ baseUrl: base, token, timeoutMs: 5000 });
}

const KEY_RE = /^[a-zA-Z0-9._-]{1,128}$/;

export async function PUT(req: Request) {
  const l = limited(req); if (l) return l;
  const c = client();
  if (!c) return json(200, { stored: false, where: "browser", configured: false });
  let body: { key?: string; value?: unknown };
  try { body = await req.json(); } catch { return json(400, { error: "bad json" }); }
  if (typeof body.key !== "string" || !KEY_RE.test(body.key)) return json(400, { error: "bad key" });
  if (body.value === undefined) return json(400, { error: "missing value" });
  try {
    await c.statePut(body.key, body.value);
    return json(200, { stored: true, where: "substrate", configured: true });
  } catch (e) {
    return json(502, { stored: false, where: "browser", configured: true, reason: (e as Error).message });
  }
}

export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const c = client();
  if (!c) return json(200, { configured: false, keys: [] });
  const key = new URL(req.url).searchParams.get("key");
  try {
    if (key) return json(200, { configured: true, ...(await c.stateGet(key)) });
    return json(200, { configured: true, ...(await c.stateList()) });
  } catch (e) {
    return json(502, { configured: true, reason: (e as Error).message });
  }
}

export async function DELETE(req: Request) {
  const l = limited(req); if (l) return l;
  const c = client();
  if (!c) return json(200, { configured: false, deleted: false });
  const key = new URL(req.url).searchParams.get("key");
  if (!key || !KEY_RE.test(key)) return json(400, { error: "bad key" });
  try {
    return json(200, { configured: true, ...(await c.stateDelete(key)) });
  } catch (e) {
    return json(502, { configured: true, reason: (e as Error).message });
  }
}
