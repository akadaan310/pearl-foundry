/**
 * The one place the public origin is defined.
 *
 * Zero configuration required. The origin resolves itself:
 *   1. NEXT_PUBLIC_SITE_ORIGIN — only if you want to override (optional).
 *   2. VERCEL_URL — provided automatically by Vercel on every deployment.
 *   3. A built-in fallback.
 *
 * A malformed override can never break the build: it is sanitized, and
 * anything unusable falls through to the next source. Nothing here throws.
 *
 * On the client, minted links (DNA URLs) prefer window.location.origin at
 * mint time, so a genome minted on any deployment always points at the
 * deployment it was minted on — no environment variable needed, ever.
 *
 * Absolute URLs are never built from request headers (Host, X-Forwarded-Host),
 * which a client can set.
 */
function cleanOrigin(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let v = raw.trim();
  if (!v) return null;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(v)) v = "https://" + v;
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.origin;
  } catch {
    return null;
  }
}

const FALLBACK_ORIGIN = "https://pearl-foundry.vercel.app";

function resolveOrigin(): string {
  return (
    cleanOrigin(typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_ORIGIN : null) ??
    cleanOrigin(typeof process !== "undefined" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    FALLBACK_ORIGIN
  );
}

export const ORIGIN: string = resolveOrigin();

let _host = "pearl-foundry.vercel.app";
try {
  _host = new URL(ORIGIN).host;
} catch {
  /* keep fallback */
}
export const HOST: string = _host;

/** Origins whose Pearl URLs this site recognises when a person pastes one. */
export const TRUSTED_ORIGINS: readonly string[] = [
  ORIGIN,
  "https://aanebed.vercel.app", // the V6 surface this foundry grew out of
  "https://abedkadaan.com", // the planned custom domain; not serving this app yet
  "https://www.abedkadaan.com",
  "http://localhost:3000",
  "http://localhost:3100",
];

export const abs = (path: string) => (path.startsWith("http") ? path : ORIGIN + (path.startsWith("/") ? path : "/" + path));

/**
 * The origin to stamp on a freshly minted link. In the browser this is always
 * the actual deployment origin; on the server it is the resolved ORIGIN.
 */
export function runtimeOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return ORIGIN;
}
