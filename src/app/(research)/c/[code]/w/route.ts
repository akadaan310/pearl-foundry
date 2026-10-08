import { getStore } from "@/lib/continuity/store";
import { normaliseCode } from "@/lib/continuity/model";
import { bodyFromQuery, ORIGIN } from "@/lib/continuity/request";
import { take, clientIp } from "@/lib/ratelimit";

/**
 * GET /c/{code}/w?session=…&by=…&b=kind:text…: append to a brain.
 *
 * A deliberate departure from "GET never mutates": AI browsing tools can
 * generally only GET, and a person can click a link. The write is
 * idempotent (same content → same event), append-only, and bounded, so a
 * repeated, prefetched or unfurled GET cannot write twice or erase anything.
 */
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function page(status: number, title: string, lines: string[], code: string | null) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0c0d0c;color:#eeeae1;font:16px/1.6 ui-sans-serif,system-ui,sans-serif}main{max-width:40rem;margin:0 auto;padding:3rem 1.2rem}h1{font:400 2rem/1.15 Georgia,serif;margin:.5rem 0 1rem}p{color:#bdb8ac}.l{font:12px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:${status < 300 ? "#cdae68" : "#dc9583"}}a{color:#74c39c}</style></head>
<body><main><p class="l">continuity brain${code ? " · " + esc(code) : ""} · HTTP ${status}</p><h1>${esc(title)}</h1>${lines.map((l) => `<p>${l}</p>`).join("")}</main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const url = new URL(req.url);
  const json = url.searchParams.get("format") === "json" || (req.headers.get("accept") ?? "").includes("application/json");
  const code = normaliseCode((await ctx.params).code);
  const reply = (status: number, data: Record<string, unknown>, title: string, lines: string[]) =>
    json ? Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }) : page(status, title, lines, code);

  if (!code) return reply(404, { error: "bad_code" }, "That is not a continuity code.", ["Codes are ten characters, like K7Q2M9XTAB."]);
  const store = getStore();
  if (!store) return reply(503, { error: "no_store" }, "Continuity storage is not configured here.", []);
  if (!take(clientIp(req), Date.now(), "write", 120).ok) return reply(429, { error: "rate_limited" }, "Too many writes. Wait a moment.", []);

  const q = new URLSearchParams(url.searchParams);
  q.delete("format");
  const { body, errors, warnings } = bodyFromQuery(q, "unnamed-session");
  if (errors.length) return reply(422, { error: "invalid", errors, warnings }, "Nothing was written.", errors.map(esc));

  const r = await store.append(code, body);
  if ("error" in r) return reply(r.error === "full" ? 409 : 404, { error: r.error }, r.error === "full" ? "This brain is full." : "No brain with that code.", []);

  const brainUrl = `${ORIGIN}/c/${code}`;
  const n = body.entries.length + (body.display?.length ?? 0);
  return reply(
    200,
    { saved: true, code, version: r.v, hash: r.hash, duplicate: r.duplicate, session: body.session, entries: body.entries.length, warnings, brain: brainUrl, view_for_session: `${brainUrl}?session=${encodeURIComponent(body.session)}` },
    r.duplicate ? `Already saved as version ${r.v}.` : `Saved to the brain as version ${r.v}.`,
    [
      `SAVED: continuity brain ${esc(code)}, version ${r.v}, written by session “${esc(body.session)}”${body.by ? ` (${esc(body.by)})` : ""}: ${n} entr${n === 1 ? "y" : "ies"}.${r.duplicate ? " This exact write was already recorded, so nothing was duplicated." : ""}`,
      ...warnings.map((w) => `⚠ ${esc(w)}`),
      `Every session holding <a href="/c/${code}">${esc(brainUrl)}</a> will see it.`,
      `If a person clicked this link: you can tell your AI “saved” and carry on.`,
    ],
  );
}
