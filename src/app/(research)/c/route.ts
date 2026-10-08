import { getStore } from "@/lib/continuity/store";
import { bodyFromQuery } from "@/lib/continuity/request";
import { take, clientIp } from "@/lib/ratelimit";

/**
 * POST /c: give a composed experience a life. Called by the person's own click
 * on the "Give it a life" button of /e (their consent to storing it).
 * Body: application/x-www-form-urlencoded with q = the experience's query string.
 */
export async function POST(req: Request) {
  const store = getStore();
  if (!store) return new Response("Continuity storage is not configured on this deployment.", { status: 503 });
  if (!take(clientIp(req), Date.now(), "create", 12).ok) return new Response("Too many new brains from this client. Try again in a minute.", { status: 429, headers: { "Retry-After": "60" } });
  const form = await req.formData();
  const q = new URLSearchParams(String(form.get("q") ?? ""));
  const { body, errors } = bodyFromQuery(q, "genesis");
  if (errors.length) return new Response(errors.join("\n"), { status: 422 });
  const r = await store.create(body);
  // The owner key travels in the fragment: browsers never send it to any server, and it is shown once.
  return new Response(null, { status: 303, headers: { Location: `/c/${r.code}?welcome=1#key=${r.ownerKey}` } });
}

export function GET() {
  return new Response(null, { status: 307, headers: { Location: "/continue" } });
}
