import { resolve, AddressError, REGISTRY, LIMITS, PROTOCOL } from "@/lib/address";
import { take } from "@/lib/ratelimit";
import { renderAddressHtml } from "@/lib/address-html";

/**
 * GET /x/{address}: resolve a computational address.
 * Pure and deterministic: the same address always yields the same value, so
 * responses are cacheable forever. There is no other method.
 */
export const dynamic = "force-dynamic";

function index() {
  return {
    protocol: PROTOCOL,
    kind: "registry",
    description: "Computational addresses. An address is a derivation path: a root constructor followed by operations, each applied to the object the prefix denotes. Path segments are looked up in this fixed registry and never evaluated.",
    effects: "pure (GET only; nothing is written, nothing is logged)",
    limits: LIMITS,
    operations: REGISTRY.map((o) => ({ id: o.id, segment: o.segment.join("/"), applies_to: o.appliesTo, yields: o.yields, params: o.params, description: o.description, epistemic_status: o.epistemic })),
    examples: ["/x/map/eca/90/8/state/5/next", "/x/map/eca/30/16/state/1/trace/16", "/x/map/eca/110/12/state/1/orbit", "/x/map/eca/90/8/state/5/flip/0/next"],
    reference_implementation: "https://github.com/akadaan310/substrateIO/blob/7ace119a544fc736f0d4ec1d72cded9dad0a83e3/substrate/purl.py",
  };
}

function wantsHtml(req: Request): boolean {
  const url = new URL(req.url);
  if (url.searchParams.get("format") === "json") return false;
  if (url.searchParams.get("format") === "html") return true;
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html") && !accept.includes("application/json");
}

export async function GET(req: Request, ctx: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await ctx.params;
  const address = "/" + path.map((p) => decodeURIComponent(p)).join("/");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip");
  const html = wantsHtml(req);
  const common = { "X-Content-Type-Options": "nosniff", Vary: "Accept", Link: '</x>; rel="index"' };

  const limit = take(ip);
  if (!limit.ok) {
    return Response.json({ protocol: PROTOCOL, kind: "error", error: { status: 429, code: "rate_limited", message: "Too many requests from this client on this instance. Results are deterministic: cache them." } }, { status: 429, headers: { ...common, "Retry-After": "5" } });
  }

  let status = 200;
  let doc: object;
  if (path.length === 0) doc = index();
  else {
    try {
      doc = resolve(address);
    } catch (e) {
      if (!(e instanceof AddressError)) throw e;
      status = e.status;
      doc = { protocol: PROTOCOL, kind: "error", address, error: { status: e.status, code: e.code, message: e.message, ...e.details }, index: "/x" };
    }
  }

  const cache = status === 200 ? "public, max-age=31536000, immutable" : "public, max-age=3600";
  if (html) {
    return new Response(renderAddressHtml(address, doc, status), { status, headers: { ...common, "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache } });
  }
  return new Response(JSON.stringify(doc, null, 1), { status, headers: { ...common, "Content-Type": "application/json; charset=utf-8", "Cache-Control": cache, "Access-Control-Allow-Origin": "*" } });
}

const notAllowed = () =>
  Response.json({ error: { status: 405, code: "method_not_allowed", message: "Computational addresses are GET-only. Resolution is pure; there is nothing to submit." } }, { status: 405, headers: { Allow: "GET, HEAD" } });
export { notAllowed as POST, notAllowed as PUT, notAllowed as PATCH, notAllowed as DELETE };
