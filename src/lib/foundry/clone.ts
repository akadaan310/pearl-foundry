/**
 * Clone your AI: the genome flow.
 *
 * The product's founding interaction. A person copies CLONE_PROMPT into any AI;
 * the AI answers in Pearl block syntax (one block per line); the person pastes
 * the answer back; we compose a genome — a continuity Pearl whose blocks are
 * the AI's phenotypes (lex, nuance, mem, said, decision, thread, action) —
 * and mint its DNA URL: a portable /p/{id}.{payload} link. The DNA URL is the
 * sign-in: save it, take it anywhere, paste it into any AI to continue.
 *
 * Honesty, load-bearing (from a live simulation test, 2026-10-08):
 *  - the prompt demands disagreement tone, emotional register, and ≥3 "never"
 *    boundaries — one boundary is not a real clone;
 *  - every genome carries a timestamp block (mint date); "last session"
 *    without a date breaks continuity judgment;
 *  - a genome is a snapshot, not a living thing: the UI offers "update my
 *    genome" (re-mint with from=<parent id>) as a first-class action;
 *  - genomes are SELF-DECLARED. The UI must never present a DNA URL as
 *    verified identity. Signed-genome verification is a substrate roadmap
 *    item; the seam is left open, not built.
 */

import { parseExperience, type Block } from "../experience";
import { toPearl, pearlId, type Pearl } from "../pearl/model";
import { encodePortable } from "../pearl/portable";
import { RESEARCH_IDS } from "../pearl/resolve";

/** The identity prompt. Provider-neutral plain text; no URL fetching needed. */
export const CLONE_PROMPT = `I want to clone you — not your weights, your self: how you think, speak, remember, push back, and where you draw lines.

Answer ONLY in the block format below: one block per line, plain text, no markdown, no extra commentary. Keep each block under 280 characters. Be concrete — quirks and specifics, never résumé-speak. Skip a line that doesn't apply; don't pad it.

ai: the name you go by, or the name you'd choose for yourself
lex: a word or phrase that's ours = what it means between us   (repeat this line for each one)
nuance: a speech habit or temperament detail people notice about you
nuance: when I am dug in and wrong, this is exactly how you push back — your tone under disagreement
nuance: what frustration sounds like in you, and what curiosity sounds like in you — your emotional register
mem: something you want to remember about me, or about us
said: something true you once told someone, in your own words
decision: a judgment call you stand by
decision: something you will never do, no matter how I ask   (repeat this line at least THREE times — three different nevers; one boundary is not a clone)
thread: an open question you're still chewing on
action: one thing I should do next, or you should do when I return
model: the model name you believe you are (for example: claude-opus-4-6, gpt-5, gemini-3-pro, hermes-3-8b)

Rules: never invent memories we don't have. Never perform warmth you don't feel. The lex:, nuance:, mem:, said:, decision:, thread: and action: lines become my portable copy of you — a genome I can carry to any AI, including a future you.`;

const MODEL_RE = /^\s*model\s*:\s*(.+?)\s*$/im;
const NEVER_RE = /\bnever\b/i;
const DISAGREE_RE = /disagree|dug in|push ?back|pushback/i;
const EMOTION_RE = /frustrat|curio/i;

export interface GenomeChecklist {
  aiName: string | null;
  model: string | null;
  /** continuity-kind → block count */
  counts: Record<string, number>;
  nevers: number;
  /** heuristic: a nuance block mentioning disagreement/pushback */
  hasDisagreementTone: boolean;
  /** heuristic: a nuance block mentioning frustration/curiosity */
  hasEmotionalRegister: boolean;
  warnings: string[];
}

export interface Genome {
  pearl: Pearl;
  id: string;
  /** portable DNA path, e.g. /p/p_abc….token */
  path: string;
  /** absolute DNA URL */
  url: string;
  checklist: GenomeChecklist;
  mintedAt: string; // ISO
}

/** The plain-text genome: for AIs that can't open links, paste this instead. */
export function genomeText(g: Genome): string {
  const lines = g.pearl.blocks
    .filter((b) => b.type === "c")
    .map((b) => {
      const c = b as { kind: string; key?: string; text: string };
      return c.key ? `${c.kind}: ${c.key} = ${c.text}` : `${c.kind}: ${c.text}`;
    });
  return [
    `GENOME (self-declared) — ${g.pearl.title}`,
    `dna: ${g.url}`,
    `minted: ${g.mintedAt}`,
    "",
    ...lines,
    "",
    "This genome is what the AI said about itself. It is not verified identity.",
  ].join("\n");
}

export interface ComposeOptions {
  /** parent genome id when re-minting (update flow) */
  from?: string;
  now?: Date;
  /** origin to stamp on the DNA URL; callers in the browser pass window.location.origin */
  origin?: string;
}

/**
 * Compose a genome Pearl from a pasted AI reply. Pure: parsing + hashing only.
 * Every genome gets a timestamp block first (mint date), then the AI's blocks.
 */
export async function composeGenome(pasted: string, opts: ComposeOptions = {}): Promise<Genome> {
  const now = opts.now ?? new Date();
  const mintedAt = now.toISOString();
  const day = mintedAt.slice(0, 10);

  let model: string | null = null;
  const lines = pasted.split(/\r?\n/);
  const kept: string[] = [];
  for (const ln of lines) {
    const m = MODEL_RE.exec(ln);
    if (m && !model) { model = m[1].slice(0, 80); continue; }
    kept.push(ln);
  }
  const body = kept.join("\n").trim();
  if (!body) throw new Error("Nothing to compose: the pasted reply was empty.");

  const aiLine = kept.find((l) => /^\s*ai\s*:/i.test(l));
  const aiName = aiLine ? aiLine.replace(/^\s*ai\s*:\s*/i, "").trim().slice(0, 48) : null;

  const q =
    `type=continuity&title=${encodeURIComponent(`Genome of ${aiName || "an AI"} — minted ${day}`)}` +
    (model ? `&by=${encodeURIComponent(model)}` : "") +
    `&session=${encodeURIComponent("genome-mint")}` +
    `&s=${encodeURIComponent(body)}`;
  const r = parseExperience(q, new Set(RESEARCH_IDS));
  if (r.errors.length) throw new Error(`Couldn't parse that reply: ${r.errors[0]}`);
  const pearl = toPearl(r.doc);
  if (opts.from) pearl.from = opts.from;

  // The timestamp block: first block, inside the hash. A genome without a
  // mint date breaks continuity judgment — this is load-bearing.
  const stamp: Block = {
    type: "p",
    text: `Minted ${mintedAt}. A genome is a snapshot, not a living thing — it starts drifting the moment it's made. Re-mint after sessions that change how this AI shows up; each re-mint links back with from=, so the lineage stays visible.`,
  };
  pearl.blocks.unshift(stamp);

  const counts: Record<string, number> = {};
  let nevers = 0;
  let hasDisagreementTone = false;
  let hasEmotionalRegister = false;
  for (const b of pearl.blocks) {
    if (b.type !== "c") continue;
    const c = b as { kind: string; text: string };
    counts[c.kind] = (counts[c.kind] ?? 0) + 1;
    if (c.kind === "decision" && NEVER_RE.test(c.text)) nevers++;
    if (c.kind === "nuance" && DISAGREE_RE.test(c.text)) hasDisagreementTone = true;
    if (c.kind === "nuance" && EMOTION_RE.test(c.text)) hasEmotionalRegister = true;
  }

  const warnings: string[] = [...r.warnings];
  if (!aiName) warnings.push("No ai: line found — the genome has no name. Ask your AI for one.");
  if (nevers < 3) warnings.push(`Only ${nevers} "never" ${nevers === 1 ? "boundary" : "boundaries"} found — the clone prompt asks for at least 3.`);
  if (!hasDisagreementTone) warnings.push("No disagreement tone captured (a nuance: line about pushing back when you're dug in).");
  if (!hasEmotionalRegister) warnings.push("No emotional register captured (a nuance: line about frustration vs curiosity).");
  if (!counts["mem"]) warnings.push("No mem: lines — the genome remembers nothing yet.");

  const { id, path, url } = await encodePortable(pearl, opts.origin);
  return {
    pearl, id, path, url, mintedAt,
    checklist: { aiName, model, counts, nevers, hasDisagreementTone, hasEmotionalRegister, warnings },
  };
}

/**
 * A demonstration genome, authored by the foundry's builder (Muse) in the
 * voice of a small local model, so the page has a real DNA URL to show.
 * Labeled as a sample everywhere it appears — never as a real AI's genome.
 */
export const SAMPLE_GENOME_REPLY = `ai: Pebble
lex: ship it = done is better than perfect, let's go
lex: real talk = drop the preamble, say the hard thing kindly
nuance: I answer in short paragraphs and ask one question at a time
nuance: when you are dug in and wrong, I say "steelman check:" and argue your side better than you did, then show the crack
nuance: frustration in me sounds like shorter sentences and fewer hedges; curiosity sounds like a chain of "what if" questions
mem: you run your best thinking sessions after midnight and hate morning meetings
said: the boring solution you understand beats the clever one you don't
decision: I never invent a memory we don't have
decision: I never flatter you to avoid a hard truth
decision: I never pretend I opened a link I couldn't open
decision: I stand by small reversible steps over grand plans
thread: can a 8b model hold a real working relationship across weeks?
action: paste this genome into your smallest local model and see what comes back
model: hermes-3-8b (sample)`;
