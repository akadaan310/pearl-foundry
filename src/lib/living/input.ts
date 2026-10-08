import { ORIGIN } from "../../config/origin";
import { resolvePearl } from "../pearl/resolve";
import { resolve as resolveAddress, AddressError } from "../address";

/** Read a Pearl link (/e?…, /p/…, absolute or relative) for a capability endpoint. Never fetches. */
export async function readPearl(u: string) {
  const v = u.trim().slice(0, 20_000);
  if (!/^(\/|https:\/\/)/.test(v)) return { ok: false as const, status: "malformed", errors: ["pass a Pearl link: /e?…, /p/… or https://…"] };
  const r = await resolvePearl(v.startsWith("/") ? ORIGIN + v : v);
  return r.pearl ? { ok: true as const, pearl: r.pearl, id: r.id!, digest: r.digest!, links: r.links! } : { ok: false as const, status: r.status, errors: r.errors.length ? r.errors : [`not a Pearl this site can read (${r.status})`] };
}

/** A computational address from /x/…, /live/… or a bare /map/… path. */
export function addressOf(u: string): string | null {
  let v = u.trim();
  try { if (/^https?:/.test(v)) v = new URL(v).pathname; } catch { return null; }
  v = v.replace(/^\/(x|live)(?=\/)/, "");
  if (!/^\/map\/[a-z0-9/]{1,200}$/.test(v)) return null;
  try { resolveAddress(v); return v; } catch (e) { if (e instanceof AddressError) return null; throw e; }
}
