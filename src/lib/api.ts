import { take, clientIp } from "./ratelimit";

/** Shared JSON responses for the pure capability endpoints. */
export const json = (status: number, body: unknown, cache = true) =>
  new Response(JSON.stringify(body, null, 1), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": cache && status === 200 ? "public, max-age=86400" : "no-store", "X-Robots-Tag": "noindex" },
  });

export function limited(req: Request): Response | null {
  return take(clientIp(req), Date.now(), "api", 120).ok ? null : json(429, { error: "rate_limited", retry_after_seconds: 5 }, false);
}
