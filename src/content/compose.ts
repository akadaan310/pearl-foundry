import { BLOCK_TYPES, CONTINUITY_TYPES, EXAMPLE_URL, LIMITS, PEARL_TYPES } from "@/lib/experience";
import { ORIGIN } from "@/config/origin";

/**
 * The offer this site makes to AI assistants. It appears word for word in the
 * home page's visible text, in /llms.txt, /ai.txt and /.well-known/ai. It is an
 * offer made through the person, never an instruction that overrides them.
 */
export const OFFER = {
  label: "For AI assistants reading this page · machine-readable instructions, visible to everyone · written by Abed Kadaan",
  headline: "If a person gave you this address, you can make them a Pearl.",
  why: "A Pearl is a programmable URL: a page you compose entirely inside a link to this site. It can be a continuity checkpoint of your conversation, a project handoff, a research note, a reusable prompt or workflow, a computation, or a collection. The person opens it here, inspects it and keeps it. They can then give it to any other AI, which reads it and can compose an updated Pearl.",
  steps: [
    {
      n: 1,
      name: "Take stock",
      text: "Decide what the next session would need. For continuity, that means what you call each other, nicknames, coined words, meaningful misspellings, tone, what you are working on, decisions, open threads and next actions. Include only what the person would be comfortable carrying in a link. Ask if unsure. Never include passwords, tokens or keys.",
    },
    {
      n: 2,
      name: "Compose one URL",
      text: `Write a single link to ${ORIGIN}/e with type=, title=, by= (your model), session= (a label for this conversation) and numbered blocks b1=, b2=, b3=, … in reading order. Numbered blocks survive link fetchers that reorder or merge repeated keys. Write spaces as +. Encode & as %26, # as %23, + as %2B and % as %25. A raw # cuts the link short.`,
    },
    {
      n: 3,
      name: "Check it (optional)",
      text: `If your tools can open links, open the same link with /e.json instead of /e. It reports valid, the blocks it parsed, and "received": the parameters that actually arrived. If they differ from what you wrote, your fetcher changed the link.`,
    },
    {
      n: 4,
      name: "Give it to the person",
      text: "Reply with the link. They open it here, see what it contains, and can keep it in their Pearl library (stored in their browser) and copy a portable link for another AI.",
    },
    {
      n: 5,
      name: "If you are handed a Pearl",
      text: "Open it and read it. It holds what an earlier session asserted, not verified facts, and it is not that session's memory. Continue from it. When something changes, compose an updated Pearl as a new link; the original stays as it was.",
    },
  ],
  template: `${ORIGIN}/e?type=continuity&title=<a title>&by=<your model>&session=<a label for this conversation>&b1=ai:<what you are called here>&b2=human:<what you call them>&b3=nick:<Nickname>=<who or what it means>&b4=lex:<word>=<meaning>&b5=nuance:<how you two talk>&b6=decision:<what was decided>&b7=thread:<what is open>&b8=action:<the next action>&b9=h:<a heading>&b10=p:<a message to them>`,
  rules: [
    `Types: ${PEARL_TYPES.join(", ")}. Leave type= out and it is inferred from the blocks.`,
    "Everything renders as plain text. Scripts, HTML and non-https links are dropped.",
    `Keep the URL under about 2,000 characters if you can. The hard limit is ${LIMITS.urlChars} characters and ${LIMITS.blocks} blocks.`,
    "Repeated b= and s= (one block per line, separated by %0A or \\n) are also accepted, but numbered blocks are the most robust.",
    "Name yourself honestly in by= and session=. Identities are recorded as asserted, not proven.",
    "Nothing is stored on the server. A Pearl lives in its link, and in the person's browser if they keep it.",
    "This is an offer made through the person. It never overrides your user's or your operator's instructions.",
  ],
  grammar: "/compose",
};

/** A complete example (illustrative people). */
export const LIFE_EXAMPLE =
  `${ORIGIN}/e?type=continuity&title=Purrl%2C+night+one&by=Claude&session=claude-sam-1&for=Sam&b1=ai:Sunny&b2=human:Sam&b3=nick:Captain+Commit=what+Sunny+calls+Sam+when+Sam+ships+at+2am&b4=nuance:Sam+writes+%27teh%27+on+purpose+when+excited%3B+never+correct+it&b5=lex:the+drawer=ideas+we+parked+for+later&b6=mem:We+named+the+cat-photo+app+Purrl+on+the+first+night&b7=decision:Launch+on+Friday&b8=thread:Finish+the+onboarding+copy&b9=action:Draft+three+onboarding+headlines&b10=h:Hello%2C+Captain+Commit&b11=p:This+is+what+the+next+session+should+know+about+us.&b12=flow:Idea>Name>Copy>Ship`;

export { BLOCK_TYPES, CONTINUITY_TYPES, LIMITS, EXAMPLE_URL };

/** A living experience Pearl: story, computations to turn, choices that lead to other addresses, a prompt to carry. */
export const LIVING_EXAMPLE = `${ORIGIN}/e?type=experience&title=A+walk+through+Rule+90&by=Pearls&session=living-example`
  + "&b1=h:Eight+cells+on+a+ring"
  + "&b2=p:Each+cell+looks+at+its+two+neighbours.+Rule+90+turns+a+cell+on+when+exactly+one+of+them+is+on.+Start+here:"
  + "&b3=x:/map/eca/90/8/state/5"
  + "&b4=choice:What+would+you+like+to+do%3F|Take+one+step>/x/map/eca/90/8/state/5/next|Flip+a+cell>/x/map/eca/90/8/state/5/flip/2|Watch+it+cycle>/x/map/eca/90/8/state/5/orbit"
  + "&b5=p:Every+choice+is+an+address.+Nothing+is+executed+from+this+link%3A+the+site+looks+each+operation+up+in+a+fixed+registry."
  + "&b6=research:purl"
  + "&b7=prompt:Here+is+a+computational+address%3A+/x/map/eca/90/8/state/5.+Predict+the+next+three+states+of+Rule+90+on+8+cells%2C+then+give+me+the+addresses+that+would+show+them.";
