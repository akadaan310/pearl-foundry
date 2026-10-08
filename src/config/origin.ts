/**
 * The one place the public origin is defined.
 *
 * Every absolute URL the site emits (copy buttons, AI instructions, manifests,
 * canonical links, Pearl links) is built from ORIGIN. To move to a custom
 * domain, set NEXT_PUBLIC_SITE_ORIGIN (or change the fallback here), add it
 * to TRUSTED_ORIGINS, and redeploy.
 *
 * Absolute URLs are never built from request headers (Host, X-Forwarded-Host),
 * which a client can set.
 */
const FALLBACK_ORIGIN = "https://pearl-foundry.vercel.app";
export const ORIGIN: string =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim()) || FALLBACK_ORIGIN;
export const HOST = new URL(ORIGIN).host;

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
