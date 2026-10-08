import { ORIGIN } from "../../config/origin";

/**
 * Use cases for the Foundry. Each everyday case is a card with a one-tap
 * prompt (copied for the person's AI) and a note on what the DNA URL carries
 * between sessions. Each business case names a real worked Pearl example
 * composed on this page (see the home page: real Pearls, rendered, not mockups).
 */

export interface EverydayCase {
  id: string;
  title: string;
  line: string;
  prompt: string;
  carries: string;
}

export const EVERYDAY: EverydayCase[] = [
  {
    id: "homework",
    title: "Plan tonight's homework",
    line: "A study plan that remembers what worked.",
    prompt: `Make me a homework plan for tonight as a Pearl. Ask me my subjects and what's due, then compose a link to ${ORIGIN}/e with type=experience, numbered blocks b1=, b2=… — one block per subject with steps: inside. Keep it under 10 blocks. Reply with the link on its own line.`,
    carries: "Subjects, what's due, which study tricks actually worked, and where you left off.",
  },
  {
    id: "nasa",
    title: "Follow a NASA research protocol",
    line: "An open protocol, tracked step by step.",
    prompt: `I want to follow an open NASA research protocol with you. Pick one published protocol (name it and link it), then compose a Pearl link to ${ORIGIN}/e with type=research: b1= the protocol's goal as a claim: block with status=open, then one steps: block per phase. Reply with the link on its own line, then tell me phase one in plain words.`,
    carries: "The protocol, the phase you're on, readings done, open questions.",
  },
  {
    id: "millennial",
    title: "Chew on an unsolved problem",
    line: "Millennial-scale problems, one thread at a time.",
    prompt: `Pick one famously unsolved problem (math, physics, or philosophy — your call) and compose a Pearl link to ${ORIGIN}/e with type=research: an h: block naming it, claim: blocks for the leading approaches with honest statuses (open, hypothesis), and a thread: block with the question we're chewing on. Reply with the link, then argue one approach in plain words.`,
    carries: "The problem, approaches considered, which ones you ruled out and why.",
  },
  {
    id: "movie",
    title: "What movie tonight?",
    line: "A taste profile that survives the scroll.",
    prompt: `Help me pick a movie for tonight. First ask me three quick taste questions, then compose a Pearl link to ${ORIGIN}/e with type=notes: your three picks as list: blocks with one-line reasons, plus a mem: block with what you learned about my taste. Reply with the link, then pitch your top pick in two sentences.`,
    carries: "Your taste profile, what you've watched, what you loved and walked out on.",
  },
  {
    id: "explore",
    title: "Explore the web with your AI",
    line: "Curiosity with a memory.",
    prompt: `Be my scout for tonight: suggest three strange corners of the web worth exploring together, then compose a Pearl link to ${ORIGIN}/e with type=collection: one pearl: block per place (site path links only). Reply with the link, then describe the strangest one in plain words.`,
    carries: "Curiosities, places visited, what was worth it and what wasn't.",
  },
];

export interface BusinessCase {
  id: string;
  title: string;
  line: string;
  /** query string (after ?) that composes the worked example Pearl */
  exampleQuery: string;
  takeaway: string;
}

export const BUSINESS: BusinessCase[] = [
  {
    id: "conflict",
    title: "Conflict resolution between co-founders",
    line: "A disagreement, written down before it's talked through.",
    exampleQuery:
      "type=continuity&title=The+pricing+argument%2C+written+down&by=Facilitator+AI&for=The+founders" +
      "&b1=said%3AWe+agreed+to+decide+pricing+by+Friday%2C+and+it+is+Thursday+night" +
      "&b2=said%3AFounder+A+hears+%22cheap%22+as+%22we+do+not+believe+in+the+product%22" +
      "&b3=said%3AFounder+B+hears+%22premium%22+as+%22we+will+never+ship%22" +
      "&b4=decision%3ASeparate+the+price+from+the+identity%3A+write+what+each+price+says+about+us%2C+then+decide" +
      "&b5=thread%3AWhat+would+we+charge+if+we+were+not+afraid%3F" +
      "&b6=action%3AEach+founder+writes+their+number+privately%2C+then+we+compare",
    takeaway: "The Pearl holds what was actually said — both founders read the same page before the next conversation. Nothing gets re-litigated.",
  },
  {
    id: "leadership",
    title: "Leadership protocols for a team",
    line: "How this team decides, carried in a link.",
    exampleQuery:
      "type=workflow&title=How+this+team+decides&by=Leadership+AI&for=The+team" +
      "&b1=h%3AThe+protocol" +
      "&b2=steps%3AWrite+the+decision+in+one+sentence%7CName+who+it+affects%7CList+two+options+with+costs%7CSleep+on+it+if+it+is+reversible%3B+decide+today+if+not" +
      "&b3=decision%3AReversible+decisions+belong+to+the+person+closest+to+the+work" +
      "&b4=decision%3AIrreversible+decisions+get+a+written+dissent%2C+then+a+call" +
      "&b5=prompt%3APaste+this+protocol+into+any+AI+with+your+situation+and+ask%3A+what+would+we+decide%3F",
    takeaway: "New join, new AI, same protocol. The workflow Pearl is the team's operating system, readable by people and models alike.",
  },
  {
    id: "validate",
    title: "Validating a product idea — and the mindset",
    line: "Claims with statuses, not vibes.",
    exampleQuery:
      "type=research&title=Would+anyone+pay+for+this%3F&by=Validator+AI&for=A+founder" +
      "&b1=h%3AThe+idea%3A+a+calendar+that+schedules+around+your+energy" +
      "&b2=claim%3Ahypothesis%7CPeople+with+ADHD+lose+hours+to+context+switching" +
      "&b3=claim%3Aopen%7CFive+strangers+would+pay+%245%2Fmo+for+this" +
      "&b4=claim%3Aproposed%7CAsk+ten+people+this+week%3A+%22walk+me+through+last+Tuesday%22" +
      "&b5=thread%3AWhat+would+make+this+embarrassing+to+be+wrong+about%3F",
    takeaway: "Every claim carries its status. The mindset is in the Pearl: separate what you know from what you're guessing, then go test the guesses.",
  },
  {
    id: "surface",
    title: "AI as a surface on top of web surfaces",
    line: "This site's own pages, operable by an AI.",
    exampleQuery:
      "type=computation&title=This+page+is+an+address&by=Foundry&for=Builders" +
      "&b1=p%3AEvery+object+on+this+site+has+an+address+an+AI+can+read+and+continue" +
      "&b2=x%3A%2Fmap%2Feca%2F90%2F8%2Fstate%2F5%2Fnext" +
      "&b3=link%3A" + encodeURIComponent(`${ORIGIN}/g/ttt`) + "%7CA+game+that+is+its+URL" +
      "&b4=link%3A" + encodeURIComponent(`${ORIGIN}/llms.txt`) + "%7CThe+machine+manual" +
      "&b5=prompt%3AGive+this+Pearl+to+an+AI+and+ask+it+to+take+one+legal+move+on+the+world+above",
    takeaway: "The interface isn't a chatbot bolted on — the pages themselves are the API. An AI reads the same addresses you click.",
  },
];
