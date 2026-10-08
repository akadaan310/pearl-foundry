/**
 * The world's first experiences. All of them are ordinary Pearls or
 * addresses on this site; none needs a bespoke backend.
 */
import { PEARL_FORMAT, pearlId, type Pearl } from "../lib/pearl/model";
import { encodePortable } from "../lib/pearl/portable";

/** Composed by Claude in the session that built V6, and labelled so (by=). */
const BY = "Claude (the AI that built this page)";

function leaf(title: string, blocks: Pearl["blocks"]): Pearl {
  return { format: PEARL_FORMAT, type: "experience", title, by: BY, for: null, session: "v6-decider", blocks };
}

/** An AI-made tool: a two-minute decider. Each answer is a separate Pearl; choosing never changes the question. */
export async function deciderPearls() {
  const now = leaf("Then do it today", [
    { type: "h", text: "Then do it today." },
    { type: "p", text: "If it will still matter in a year, a small start now beats a perfect start later." },
    { type: "steps", items: ["Set a timer for ten minutes", "Do the smallest real piece", "Write down the next piece before you stop"] },
    { type: "prompt", text: "Help me break this into a first ten-minute step: <describe the thing>." },
  ]);
  const wait = leaf("Then let it wait", [
    { type: "h", text: "Then let it wait." },
    { type: "p", text: "If it won't matter in a year, it can be small, late, or not at all. Park it somewhere you'll see it again." },
    { type: "list", items: ["Write it down in one line", "Pick a day to look again", "Let the rest of today be about something that matters more"] },
  ]);
  const [a, b] = await Promise.all([encodePortable(now), encodePortable(wait)]);
  const root = leaf("A two-minute decider", [
    { type: "h", text: "Should you do it today?" },
    { type: "p", text: "One honest question. Each answer is its own Pearl, so you can keep the one that fits, or give it to your AI." },
    { type: "choice", prompt: "Will it matter in a year?", options: [{ label: "Yes, it will", href: new URL(a.url).pathname }, { label: "Probably not", href: new URL(b.url).pathname }] },
  ]);
  const r = await encodePortable(root);
  return { root: { path: new URL(r.url).pathname, id: pearlId(root) }, leaves: [new URL(a.url).pathname, new URL(b.url).pathname] };
}

/** An illustrative path for the multi-AI demo. The names are placeholders, not real AIs. */
export const EXAMPLE_PASS = "/g/ttt/4~you/0~ai-a/8~you/2~ai-b";
