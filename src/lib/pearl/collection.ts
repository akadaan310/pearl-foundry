/**
 * Compose a collection Pearl from Pearls you already have. A collection
 * carries references (pearl: blocks), never copies, and the site never
 * expands them recursively. Members that do not fit within the grammar's
 * limits are left out and reported, never truncated.
 */
import { ORIGIN } from "@/config/origin";
import { LIMITS, experienceUrl } from "../experience";

export interface Member { title: string; href: string }
export interface CollectionPlan { url: string; included: Member[]; omitted: { title: string; reason: string }[] }

const label = (s: string) => s.replace(/[|\n\r]/g, " ").trim().slice(0, 80) || "Pearl";

export function composeCollection(name: string, intro: string, members: Member[], by = "Pearls Spaces"): CollectionPlan {
  const title = name.trim().slice(0, LIMITS.titleChars) || "A collection";
  const head = [`h:${title}`, ...(intro.trim() ? [`p:${intro.trim().slice(0, 600)}`] : [])];
  const included: Member[] = [];
  const omitted: CollectionPlan["omitted"] = [];
  const build = (ms: Member[]) => experienceUrl(ORIGIN, { title, by, session: "collection", lines: [...head, ...ms.map((m) => `pearl:${m.href}|${label(m.title)}`)] }) + "&type=collection";
  for (const m of members) {
    const line = `pearl:${m.href}|${label(m.title)}`;
    if (line.length > LIMITS.blockChars) { omitted.push({ title: m.title, reason: "its link is longer than one block allows" }); continue; }
    if (head.length + included.length + 1 > LIMITS.blocks) { omitted.push({ title: m.title, reason: `a Pearl holds at most ${LIMITS.blocks} parts` }); continue; }
    if (build([...included, m]).length > LIMITS.urlChars) { omitted.push({ title: m.title, reason: `the collection link would pass ${LIMITS.urlChars.toLocaleString("en")} characters` }); continue; }
    included.push(m);
  }
  return { url: build(included), included, omitted };
}
