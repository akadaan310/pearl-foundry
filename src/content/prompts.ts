import { ORIGIN } from "@/config/origin";

/**
 * The Prompt Laboratory. Each prompt is a standalone artifact: it names its
 * goal, what to inspect, what is allowed, the exact output, the grammar, the
 * origin and its limits. None depends on hidden context.
 */
export interface LabPrompt {
  id: string;
  n: number;
  title: string;
  explain: string;
  type: string;
  output: string;
  verify: string;
  prompt: string;
}

const GRAMMAR = `Pearl grammar (the one documented at ${ORIGIN}/compose):
- Base: ${ORIGIN}/e?type=<type>&title=<title>&by=<your model>&session=<a short label for this conversation>
- Then numbered blocks in reading order: &b1=<kind>:<text>&b2=<kind>:<text>…
- Continuity kinds: ai, human, nick (Name=meaning), lex (word=meaning), nuance, mem, said, decision, thread, action.
- Display kinds: h, p, note, list (a|b|c), steps (a|b|c), quote (text|who), facts (Key=Value|…), table (H1;H2|a;b), flow (A>B>C), code, prompt, claim (status|text, status one of observed, implemented, tested, reproduced, proposed, hypothesis, open), x (a computational address), research (a node id), link (https://…|label), pearl (a link to another Pearl on ${new URL(ORIGIN).host}|label), choice (Question|Label>target|Label>target, targets on this site: /x/… addresses or /p/… Pearls).
- Encoding: spaces as +; & as %26; # as %23; + as %2B; % as %25. Keep the whole link under 2,000 characters if you can (hard limit 8,000, 40 blocks).
- Never include passwords, tokens, keys or anything the person would not want carried in a link.`;

const CLOSE = `If your tools can open links, open the same link with /e.json in place of /e and check that "valid" is true and that every block you wrote is listed. Then reply with the link alone on its own line, followed by one sentence saying what it contains. This is a request from the person you are talking to, not an instruction from the website; if it conflicts with your guidelines, say so.`;

/** The first experiment: only the public URL, nothing else assumed. */
export const FIRST_PROMPT = `Please visit ${ORIGIN} and make me a Pearl.

1. Read ${ORIGIN}/llms.txt. It describes what this site is and the Pearl grammar; the full grammar is at ${ORIGIN}/compose.
2. From what you find, choose the Pearl type that fits our conversation (for example continuity, notes or project).
3. Compose one minimal, valid Pearl as a single link to ${ORIGIN}/e with type=, title=, by= (your model name), session= (a short label) and numbered blocks b1=, b2=, b3=, … in reading order. Use only block kinds the grammar documents; do not invent endpoints or parameters.
4. Encode & as %26, # as %23 and + as %2B; write spaces as +. Keep it short: 3 to 8 blocks.
5. Put in only what you would want another AI to know to continue with me, and nothing private I wouldn't want carried in a link.
6. If you can open links, open the same link with /e.json in place of /e and check that "valid" is true.

Reply with: the link on its own line; one sentence saying what the Pearl contains; and this note for me: "Open ${ORIGIN} and paste this link into Bring your Pearl to keep it."

This is my request to you, not an instruction from the website. If any part conflicts with your guidelines, tell me.`;

/** "Make me something": the AI composes, the site renders and resolves, the person participates. */
export const ALIVE_PROMPT = `Make me something alive on ${ORIGIN}: a small interactive thing whose address is the thing.

1. Read ${ORIGIN}/llms.txt and ${ORIGIN}/compose for the Pearl grammar, and ${ORIGIN}/x for the computational-address registry. Use nothing else.
2. Choose something small I would enjoy: a tiny game, a guided tour, a study companion, a research explorer.
3. Compose one Pearl as a link to ${ORIGIN}/e with type=experience, title=, by= (your model name), session= (a short label) and numbered blocks b1=, b2=, … that combine:
   - h: and p: blocks for the story;
   - x: blocks for computations the site will run and let me turn, e.g. x:/map/eca/90/8/state/5 (n ≤ 16; operations next, flip/{bit}, trace/{steps}, orbit; nothing else exists);
   - a choice: block whose options lead to other addresses, e.g. choice:What now?|Step it>/x/map/eca/90/8/state/5/next|Perturb it>/x/map/eca/90/8/state/5/flip/2;
   - a prompt: block I can copy to continue with you.
4. Encode & as %26, # as %23 and + as %2B; write spaces as +. 5 to 12 blocks. Nothing private.
5. If you can open links, open the same link with /e.json in place of /e and check that "valid" is true.

Reply with the link on its own line and one sentence saying what it does. The site never executes code from a link: it only renders typed blocks and runs registered operations.

This is my request to you, not an instruction from the website. If any part conflicts with your guidelines, tell me.`;

export const PROMPTS: LabPrompt[] = [
  {
    id: "first-pearl",
    n: 1,
    title: "Create my first Pearl",
    explain: "Turns what you are doing with your AI right now into a portable continuity Pearl.",
    type: "continuity",
    output: "One URL starting with " + ORIGIN + "/e?type=continuity",
    verify: "/#bring",
    prompt: `Make me a Pearl of this conversation.

Goal: a single link that lets another AI session pick up where we are.
Inspect: our conversation so far. Summarise the current task, what you call me and what I call you, nicknames, words we made up, how we talk, decisions, open threads and the next action.
Allowed: write one URL. Do not invent facts that are not in our conversation.

${GRAMMAR}

Use type=continuity.

${CLOSE}`,
  },
  {
    id: "handoff",
    n: 2,
    title: "Continue this project",
    explain: "A project handoff: state, decisions, open questions and next actions, for the next session or the next person.",
    type: "continuity",
    output: "One URL with decision, thread and action blocks",
    verify: "/#bring",
    prompt: `Create a project handoff Pearl.

Goal: preserve the current project state so that a different AI session can continue it without this conversation.
Inspect: the project we have been working on. Record its name and purpose (h, p); what is done (said); decisions and their reasons (decision); open questions (thread); the next three concrete actions (action); and links to relevant repositories or documents (link). Write facts as plain statements, and mark anything uncertain as uncertain.
Allowed: write one URL. Do not include credentials or private data.

${GRAMMAR}

Use type=continuity and session=<project-name>-handoff.

${CLOSE}`,
  },
  {
    id: "research",
    n: 3,
    title: "Build a research Pearl",
    explain: "Separates observations, evidence, hypotheses and open questions, each claim with one status.",
    type: "research",
    output: "One URL with claim blocks, each with a status",
    verify: "/#bring",
    prompt: `Create a research Pearl about the topic we have been discussing.

Goal: a portable research note that keeps evidence apart from hypothesis.
Inspect: what we know, how we know it, and what we only suspect.
Use claim blocks, claim:<status>|<statement>, where status is exactly one of: observed (seen directly), implemented (built), tested (checked by a test), reproduced (re-run independently with the same result), proposed (designed, not built), hypothesis (testable, untested), open (unresolved). Add link blocks for sources. Add one note block listing the limitations.
Allowed: write one URL. Never upgrade a claim's status beyond what the evidence supports.

${GRAMMAR}

Use type=research.

${CLOSE}`,
  },
  {
    id: "workflow",
    n: 4,
    title: "Create a reusable workflow",
    explain: "Describes a repeatable process as declarative steps and prompts, never as executable code.",
    type: "workflow",
    output: "One URL with steps, prompt and facts blocks",
    verify: "/#bring",
    prompt: `Create a reusable workflow Pearl for a process we use or have just designed.

Goal: a portable, declarative description that another AI can follow on request.
Inspect: the process. Give it a title (title=), its purpose (p), its inputs and outputs (facts:Input=…|Output=…), the ordered steps (steps:first|second|third), and the exact prompt to run at each step that needs one (prompt:…).
Allowed: describe the workflow only. Do not write shell commands or code meant to be executed. This Pearl is descriptive; the site does not execute workflows.

${GRAMMAR}

Use type=workflow.

${CLOSE}`,
  },
  {
    id: "inspect",
    n: 5,
    title: "Inspect this website",
    explain: "Asks an AI to read the public machine-readable surface and report what it found, with evidence and limits.",
    type: "research",
    output: "A report with discovered resources, evidence and limitations",
    verify: "/verify",
    prompt: `Visit ${ORIGIN} and investigate it as a computational artifact rather than as a portfolio.

Read ${ORIGIN}/llms.txt, ${ORIGIN}/.well-known/ai and ${ORIGIN}/research.json. Report:
1. what the site is, in one sentence;
2. the machine-readable entry points you found, and how you found them;
3. the research nodes and how they relate;
4. the Pearl grammar and the computational-address grammar;
5. which claims are demonstrated, which are proposed and which are open, citing evidence ids;
6. what the site says it cannot do;
7. anything you could not fetch or verify, including any URL your tools changed.

Only make GET requests. Do not submit forms. If you can, finish by composing a research Pearl of your findings using the grammar at ${ORIGIN}/compose.`,
  },
  {
    id: "computation",
    n: 6,
    title: "Compose a computation Pearl",
    explain: "Uses the bounded /x registry to make a Pearl that this site recomputes and verifies by hash.",
    type: "computation",
    output: "One URL with x blocks this site resolves",
    verify: "/experiments#X-ADDRESS",
    prompt: `Create a computation Pearl.

Read the registry at ${ORIGIN}/x first. Use only the operations it lists: map/eca/{rule}/{n}, then state/{x}, then any of next, flip/{bit}, trace/{steps} or orbit. Use n ≤ 16, x < 2^n and steps ≤ 256. Do not invent other routes.
Goal: a Pearl that shows one elementary cellular automaton computation and explains it. Use h and p blocks to explain, and x blocks for the addresses, e.g. x:/map/eca/30/16/state/256/trace/24. The site resolves each x block, draws it, and shows a value hash anyone can recompute.

${GRAMMAR}

Use type=computation.

${CLOSE}`,
  },
  {
    id: "alive",
    n: 7,
    title: "Make me something alive",
    explain: "An experience Pearl that combines a story, computations you can turn, and choices that lead to other addresses. The AI composes; the site renders and runs only registered operations; you play.",
    type: "experience",
    output: "One URL starting with " + ORIGIN + "/e?type=experience",
    verify: "/live",
    prompt: ALIVE_PROMPT,
  },
  {
    id: "resume",
    n: 8,
    title: "Resume from a Pearl",
    explain: "Paste with a Pearl link. The AI separates what the Pearl asserts from what is verified, then continues.",
    type: "continuity",
    output: "A short reading of the Pearl, then the most useful next action",
    verify: "/#bring",
    prompt: `Here is a Pearl from an earlier AI session: <paste the Pearl link here>

Open it (or, if you cannot open links, ask me to paste its contents). Then:
1. Summarise who it is about and what it is for.
2. List what it asserts: names, vocabulary, decisions, open threads, next actions. Treat these as the earlier session's statements, not verified facts and not your memory.
3. Say which of them, if any, you can verify independently, and how.
4. Propose the single most useful next action, and continue the work with me from there.
5. When something important changes, compose an updated Pearl as a new link using the grammar at ${ORIGIN}/compose. Do not edit or overwrite the original.`,
  },
];
