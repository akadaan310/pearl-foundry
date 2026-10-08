import type { PearlTypeName } from "@/lib/experience";
import { ORIGIN } from "@/config/origin";

/**
 * The Create catalogue. One model, eight experiences. Each experience is a
 * set of fields; each field maps to Pearl blocks of the documented grammar.
 * The builder (src/components/pearl/ExperienceBuilder.tsx) turns filled fields
 * into a real Pearl through the same parser and serializer as everything else.
 *
 * The three names for each experience are the translation layer between
 * everyday language, the product action and the research vocabulary.
 */

export type FieldKind = "line" | "text" | "lines" | "pairs" | "number";

export interface Field {
  id: string;
  label: string;
  help?: string;
  kind: FieldKind;
  placeholder?: string;
  /** block kind (a continuity kind or a display kind) each value becomes */
  block: string;
  /** for "lines": one block per line, or one list/steps block for all lines */
  as?: "each" | "list" | "steps";
  /** for claim fields */
  status?: string;
  min?: number;
  max?: number;
  initial?: string;
}

export interface ExperienceDef {
  id: string;
  name: string;
  situation: string;      // everyday language
  action: string;         // product language
  research: string;       // the underlying concept
  pitch: string;
  type: PearlTypeName;
  accent: string;         // a tailwind class for the card mark
  fields: Field[];
  example: { title: string; values: Record<string, string> };
  prompt: string;
  computation?: true;
}

const ASK = (what: string, type: PearlTypeName) => `Help me make a Pearl: ${what}

Read ${ORIGIN}/llms.txt first and follow the Pearl grammar it describes (full grammar: ${ORIGIN}/compose).
Use type=${type}. Write one link to ${ORIGIN}/e with title=, by= (your model), session= (a short label), and numbered blocks b1=, b2=, … in reading order. Encode & as %26, # as %23 and + as %2B; write spaces as +.
Use only what we have actually discussed. Don't include passwords or secrets.
Reply with the link on its own line, then one sentence saying what it contains. I will open it at ${ORIGIN} and keep it.`;

export const EXPERIENCES: ExperienceDef[] = [
  {
    id: "conversation",
    name: "Conversation Keeper",
    situation: "Keep a conversation you care about.",
    action: "Compose a continuity Pearl",
    research: "Continuity (ACSP): context, vocabulary, provenance; identity asserted, not proven",
    pitch: "The names, the in-jokes, what you decided and what's still open — so the next AI can pick up where this one left off.",
    type: "continuity",
    accent: "bg-[#0e6b50]",
    fields: [
      { id: "title", label: "What should this be called?", kind: "line", block: "title", placeholder: "Planning the trip with Juniper" },
      { id: "ai", label: "What do you call the AI?", kind: "line", block: "ai", placeholder: "Juniper" },
      { id: "human", label: "What does it call you?", kind: "line", block: "human", placeholder: "Sam" },
      { id: "lex", label: "Words and nicknames only you two use", help: "One per line: word = what it means", kind: "pairs", block: "lex", placeholder: "the drawer = ideas we parked for later" },
      { id: "mem", label: "What matters from this conversation", help: "One per line", kind: "lines", block: "mem", as: "each", placeholder: "We chose Lisbon over Porto" },
      { id: "decision", label: "What you decided", kind: "lines", block: "decision", as: "each", placeholder: "Leave on the 14th" },
      { id: "thread", label: "What's still open", kind: "lines", block: "thread", as: "each", placeholder: "Find a place near the river" },
      { id: "action", label: "The next step", kind: "lines", block: "action", as: "each", placeholder: "Compare three neighbourhoods" },
    ],
    example: { title: "Planning the trip with Juniper", values: { ai: "Juniper", human: "Sam", lex: "the drawer = ideas we parked for later\nslow mornings = no plans before 10", mem: "We chose Lisbon over Porto\nSam gets seasick, so no boat day", decision: "Leave on the 14th", thread: "Find a place near the river", action: "Compare three neighbourhoods" } },
    prompt: ASK("keep this conversation so another AI can continue it. Include what we call each other, our own words and nicknames, what matters, decisions, open threads and the next step", "continuity"),
  },
  {
    id: "research",
    name: "Research Space",
    situation: "Organise your research.",
    action: "Compose a research Pearl",
    research: "Evidence taxonomy: observed, tested, hypothesis, open; claims kept apart from evidence",
    pitch: "Questions, sources and claims — with what you've seen kept apart from what you only suspect.",
    type: "research",
    accent: "bg-[#2a4fa8]",
    fields: [
      { id: "title", label: "Research question", kind: "line", block: "title", placeholder: "Do houseplants improve sleep?" },
      { id: "context", label: "Context", kind: "text", block: "p", placeholder: "Why this question matters to you" },
      { id: "observed", label: "What you've seen yourself", kind: "lines", block: "claim", status: "observed", as: "each", placeholder: "I sleep later in the room with plants" },
      { id: "tested", label: "What a study or test showed", kind: "lines", block: "claim", status: "tested", as: "each" },
      { id: "hypothesis", label: "What you suspect", kind: "lines", block: "claim", status: "hypothesis", as: "each", placeholder: "Humidity, not the plants, does it" },
      { id: "open", label: "Open questions", kind: "lines", block: "claim", status: "open", as: "each" },
      { id: "sources", label: "Sources (https links)", kind: "lines", block: "link", as: "each", placeholder: "https://example.org/study" },
      { id: "action", label: "Next steps", kind: "lines", block: "action", as: "each" },
    ],
    example: { title: "Do houseplants improve sleep?", values: { context: "Two rooms, one with plants. I keep notes for a month.", observed: "I fall asleep faster in the room with plants (12 of 15 nights)", hypothesis: "Humidity, not the plants themselves, makes the difference", open: "Would a humidifier alone do the same?", action: "Borrow a hygrometer for both rooms" } },
    prompt: ASK("organise the research we've been discussing. Use claim blocks claim:<status>|<text>, with status exactly one of observed, implemented, tested, reproduced, proposed, hypothesis, open, and never upgrade a status beyond the evidence. Add link blocks for sources", "research"),
  },
  {
    id: "creative",
    name: "Creative Studio",
    situation: "Collect ideas for a creative project.",
    action: "Compose a project Pearl",
    research: "Composition: a project Pearl referencing ideas, drafts and other Pearls",
    pitch: "Ideas, drafts, references and a plan, in one place you can hand to any AI.",
    type: "project",
    accent: "bg-[#b4532a]",
    fields: [
      { id: "title", label: "Project name", kind: "line", block: "title", placeholder: "A zine about our street" },
      { id: "idea", label: "The idea", kind: "text", block: "p" },
      { id: "ideas", label: "Ideas and fragments", kind: "lines", block: "list", as: "list" },
      { id: "plan", label: "Plan", kind: "lines", block: "steps", as: "steps" },
      { id: "refs", label: "References (https links)", kind: "lines", block: "link", as: "each" },
      { id: "action", label: "Next step", kind: "lines", block: "action", as: "each" },
    ],
    example: { title: "A zine about our street", values: { idea: "Twelve pages, one per house, drawn by the people who live there.", ideas: "Cover: the old bakery sign\nA map with everyone's favourite tree\nRecipes from number 9", plan: "Ask the neighbours\nCollect drawings\nScan and lay out\nPrint 40 copies", action: "Write the note to the neighbours" } },
    prompt: ASK("collect the ideas, drafts and plan for the creative project we've been talking about", "project"),
  },
  {
    id: "recipe",
    name: "Recipe Space",
    situation: "Build a recipe or a meal plan.",
    action: "Compose a notes Pearl",
    research: "Structured blocks: facts, lists and steps rendered as text",
    pitch: "A recipe with its substitutions and a shopping list — family recipes included.",
    type: "notes",
    accent: "bg-[#8a5a06]",
    fields: [
      { id: "title", label: "Dish", kind: "line", block: "title", placeholder: "Teta's lentil soup" },
      { id: "facts", label: "Serves, time, notes", help: "One per line: Serves = 4", kind: "pairs", block: "facts" },
      { id: "ingredients", label: "Ingredients", kind: "lines", block: "list", as: "list" },
      { id: "steps", label: "Steps", kind: "lines", block: "steps", as: "steps" },
      { id: "subs", label: "Substitutions", help: "One per line: instead of = use", kind: "pairs", block: "facts" },
      { id: "shopping", label: "Shopping list", kind: "lines", block: "list", as: "list" },
    ],
    example: { title: "Teta's lentil soup", values: { facts: "Serves = 4\nTime = 40 minutes", ingredients: "1 cup red lentils\n1 onion\n1 carrot\n1 tsp cumin\nLemon", steps: "Soften the onion and carrot\nAdd lentils, cumin and 5 cups of water\nSimmer 25 minutes\nBlend, then squeeze in lemon", subs: "Red lentils = yellow split peas (add 15 minutes)", shopping: "Red lentils\nLemons" } },
    prompt: ASK("write up the recipe or meal plan we discussed, with ingredients, steps, substitutions and a shopping list", "notes"),
  },
  {
    id: "study",
    name: "Study Companion",
    situation: "Carry a study session into another AI.",
    action: "Compose a project Pearl",
    research: "Continuity across sessions: goals, questions and checkpoints",
    pitch: "What you're learning, what you've understood, and what to practise next.",
    type: "project",
    accent: "bg-[#5b3fa0]",
    fields: [
      { id: "title", label: "Subject", kind: "line", block: "title", placeholder: "Photosynthesis, week 3" },
      { id: "goals", label: "Learning goals", kind: "lines", block: "list", as: "list" },
      { id: "notes", label: "Notes", kind: "text", block: "p" },
      { id: "questions", label: "Questions I still have", kind: "lines", block: "thread", as: "each" },
      { id: "exercises", label: "Exercises", kind: "lines", block: "steps", as: "steps" },
      { id: "progress", label: "Where I got to", kind: "lines", block: "mem", as: "each" },
    ],
    example: { title: "Photosynthesis, week 3", values: { goals: "Explain the light reactions\nDraw the Calvin cycle from memory", notes: "Light reactions make ATP and NADPH; the Calvin cycle spends them to fix carbon.", questions: "Why does RuBisCO also bind oxygen?", exercises: "Label a chloroplast diagram\nExplain C4 plants in three sentences", progress: "I can explain the light reactions without notes" } },
    prompt: ASK("capture this study session: my learning goals, notes, questions I still have, exercises and where I got to", "project"),
  },
  {
    id: "handoff",
    name: "Project Handoff",
    situation: "Carry a project into another AI.",
    action: "Compose a continuity Pearl (handoff)",
    research: "Continuity: decisions, open issues and next actions, with provenance",
    pitch: "A portable snapshot of a project: where it stands, what was decided, what's next.",
    type: "continuity",
    accent: "bg-[#1f5f6b]",
    fields: [
      { id: "title", label: "Project", kind: "line", block: "title", placeholder: "Website relaunch" },
      { id: "said", label: "Where it stands", kind: "text", block: "said" },
      { id: "decision", label: "Decisions", kind: "lines", block: "decision", as: "each" },
      { id: "links", label: "Files and links (https)", kind: "lines", block: "link", as: "each" },
      { id: "thread", label: "Open issues", kind: "lines", block: "thread", as: "each" },
      { id: "action", label: "Next steps", kind: "lines", block: "action", as: "each" },
    ],
    example: { title: "Website relaunch", values: { said: "Design approved; the content migration is half done.", decision: "Keep the old URLs with redirects\nLaunch after the newsletter goes out", thread: "Who writes the about page?", action: "Migrate the remaining 14 posts\nSet up redirects" } },
    prompt: ASK("make a project handoff: where the project stands, decisions and why, files and links, open issues and the next three steps", "continuity"),
  },
  {
    id: "workflow",
    name: "Workflow Composer",
    situation: "Create a reusable workflow.",
    action: "Compose a workflow Pearl",
    research: "Declarative composition; descriptive, never executed by this site",
    pitch: "A process you repeat — written once as steps and prompts, usable with any AI.",
    type: "workflow",
    accent: "bg-[#6b4a2a]",
    fields: [
      { id: "title", label: "Workflow name", kind: "line", block: "title", placeholder: "Weekly newsletter" },
      { id: "purpose", label: "What it's for", kind: "text", block: "p" },
      { id: "io", label: "Inputs and outputs", help: "One per line: Input = links I saved", kind: "pairs", block: "facts" },
      { id: "steps", label: "Steps", kind: "lines", block: "steps", as: "steps" },
      { id: "prompt", label: "The prompt to run", kind: "text", block: "prompt" },
    ],
    example: { title: "Weekly newsletter", values: { purpose: "Turn the week's saved links into a short newsletter.", io: "Input = links saved this week\nOutput = a 300-word draft", steps: "Paste the links\nGroup them into three themes\nWrite one paragraph per theme\nAdd a closing question", prompt: "Group these links into three themes and write one warm paragraph per theme, then a closing question for readers." } },
    prompt: ASK("describe this workflow as declarative steps and the exact prompts to run, with no executable code", "workflow"),
  },
  {
    id: "computation",
    name: "Computation Explorer",
    situation: "Explore structured computation.",
    action: "Compose a computation Pearl",
    research: "PURL / substrateIO: computational addresses resolved by a bounded registry",
    pitch: "An address that computes: an elementary cellular automaton this site runs and verifies by hash.",
    type: "computation",
    accent: "bg-[#1d1b17]",
    computation: true,
    fields: [
      { id: "title", label: "Title", kind: "line", block: "title", placeholder: "Rule 30 from a single cell" },
      { id: "rule", label: "Rule (0–255)", kind: "number", block: "x", min: 0, max: 255, initial: "30" },
      { id: "n", label: "Cells (1–16)", kind: "number", block: "x", min: 1, max: 16, initial: "16" },
      { id: "x", label: "Starting state", help: "An integer below 2^cells", kind: "number", block: "x", min: 0, max: 65535, initial: "256" },
      { id: "steps", label: "Steps (1–256)", kind: "number", block: "x", min: 1, max: 256, initial: "24" },
      { id: "note", label: "What to notice", kind: "text", block: "p" },
    ],
    example: { title: "Rule 30 from a single cell", values: { rule: "30", n: "16", x: "256", steps: "24", note: "One live cell, a simple rule, and a pattern that never settles." } },
    prompt: ASK(`a computation Pearl. Read ${ORIGIN}/x first and use only the operations it lists (map/eca/{rule}/{n}/state/{x} then next, flip/{bit}, trace/{steps} or orbit; n ≤ 16, steps ≤ 256). Put each address in an x: block and explain it with h and p blocks`, "computation"),
  },
];

/** Turn filled fields into Pearl lines (b1, b2, …). Pure; shared by the builder and the tests. */
export function linesFor(def: ExperienceDef, values: Record<string, string>): { title: string; lines: string[] } {
  const lines: string[] = [];
  const clean = (s: string) => s.replace(/\s+/g, " ").trim();
  const noBar = (s: string) => clean(s).replace(/\|/g, "/");
  if (def.computation) {
    const num = (k: string, d: string) => (/^\d{1,5}$/.test((values[k] ?? "").trim()) ? values[k].trim() : d);
    lines.push(`x:/map/eca/${num("rule", "30")}/${num("n", "16")}/state/${num("x", "256")}/trace/${num("steps", "24")}`);
    if (clean(values.note ?? "")) lines.push(`p:${clean(values.note)}`);
    return { title: clean(values.title ?? "") || def.example.title, lines };
  }
  for (const f of def.fields) {
    if (f.block === "title") continue;
    const v = (values[f.id] ?? "").trim();
    if (!v) continue;
    const rows = v.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
    if (f.kind === "line" || f.kind === "text") { lines.push(`${f.block}:${clean(v)}`); continue; }
    if (f.kind === "pairs") {
      const pairs = rows.map((r) => { const i = r.search(/[=:]/); return i > 0 ? [noBar(r.slice(0, i)), noBar(r.slice(i + 1))] : [noBar(r), ""]; });
      if (f.block === "facts") lines.push(`facts:${pairs.map(([k, x]) => (x ? `${k}=${x}` : k)).join("|")}`);
      else for (const [k, x] of pairs) lines.push(x ? `${f.block}:${k}=${x}` : `${f.block}:${k}`);
      continue;
    }
    if (f.as === "list" || f.as === "steps") { lines.push(`${f.block}:${rows.map(noBar).join("|")}`); continue; }
    for (const r of rows) lines.push(f.block === "claim" ? `claim:${f.status}|${clean(r)}` : `${f.block}:${clean(r)}`);
  }
  return { title: clean(values.title ?? "") || def.example.title, lines };
}

export const experience = (id: string) => EXPERIENCES.find((e) => e.id === id);
