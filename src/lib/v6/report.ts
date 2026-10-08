/**
 * A report ("Something wrong?") becomes a Pearl. The substrate's ticket
 * system is not built yet (pearl-substrate ARCHITECTURE.md §18: tickets
 * DEFERRED), so the report lives in its link: copyable, giveable to an AI.
 */
import { PEARL_FORMAT, type Pearl } from "../pearl/model";

export const TICKET_STATES = ["REPORTED", "UNDER_REVIEW", "REPRODUCED", "NOT_REPRODUCED", "DISPUTED", "DIAGNOSED", "RESOLVED", "OPEN"] as const;

export function reportPearl(r: { what: string; where?: string; expected?: string; detail?: string; when?: string; agent?: string }): Pearl {
  const clip = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);
  const facts = [["Status", "REPORTED"], ["Where", r.where || "not given"], ["When", r.when || "not given"], ...(r.agent ? [["Browser", clip(r.agent, 160)]] : [])].map(([k, v]) => ({ k, v: clip(v, 300) }));
  const blocks: Pearl["blocks"] = [
    { type: "h", text: "What happened" },
    { type: "p", text: clip(r.what, 1200) || "(no description)" },
    ...(r.expected ? [{ type: "p" as const, text: `Expected: ${clip(r.expected, 600)}` }] : []),
    { type: "facts", items: facts },
    ...(r.detail ? [{ type: "code" as const, text: r.detail.slice(0, 1400) }] : []),
    { type: "claim", status: "open", text: "Reported by the person who saw it; not yet reproduced." },
    { type: "c", kind: "thread", text: "Reproduce this, then diagnose it" },
  ];
  return { format: PEARL_FORMAT, type: "research", title: `Report: ${clip(r.what, 60) || "something went wrong"}`, by: "a person, on Pearls", for: null, session: "report", blocks };
}
