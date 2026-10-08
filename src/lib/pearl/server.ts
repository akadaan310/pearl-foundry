import { toPearl, pearlDigest, idFromDigest, type Pearl } from "./model";
import { pearlUrl } from "./serialize";
import { encodePortable } from "./portable";
import type { PearlState } from "./states";
import type { Experience } from "../experience";
import { resolve } from "../address";

/** Build everything a Pearl page needs from a parsed document. */
export async function pearlPage(doc: Experience, opts: { verifiedId?: boolean }) {
  const pearl: Pearl = toPearl(doc);
  const digest = pearlDigest(pearl);
  const id = idFromDigest(digest);
  const e = pearlUrl(pearl);
  const portable = (await encodePortable(pearl)).url;
  const xs = pearl.blocks.filter((b) => b.type === "x") as { address: string }[];
  const computed = xs.length > 0 && xs.every((x) => { try { resolve(x.address); return true; } catch { return false; } });
  const states: PearlState[] = ["PORTABLE"];
  if (opts.verifiedId || computed) states.push("VERIFIED");
  states.push("UNVERIFIED");
  return { pearl, digest, id, states, links: { e, portable, compact: portable.length < e.length ? portable : e } };
}
