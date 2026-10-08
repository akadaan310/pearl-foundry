import type { CareerItem } from "./types";

/**
 * Source for every career line: the owner's own portfolio brief and portfolio
 * data (akadaan310/Abedsaiportfolio, src/imports/abed-kadaan-portfolio.md and
 * src/app/pages/About.tsx). They are rendered with the SELF_REPORTED marker.
 * Illustrative sample projects in that brief were invented examples and are
 * deliberately excluded.
 */
export const CAREER_SOURCE = "https://github.com/akadaan310/Abedsaiportfolio";

export const CAREER: CareerItem[] = [
  { period: "2020–2022", role: "Senior Director of Engineering", organisation: "Equinox", detail: "Led engineering teams of up to 80 engineers across mobile, web and streaming platforms." },
  { period: "2018–2020", role: "Engineering Director", organisation: "PlutoTV / ViacomCBS", detail: "Directed development of native streaming apps for iOS, Android, tvOS and Roku." },
  { period: "2016–2018", role: "Senior Engineer", organisation: "Emirates Airlines", detail: "Rebuilt the mobile booking experience (React Native)." },
  { role: "Mobile engineering", organisation: "Lululemon · Ticketmaster · The Home Depot", detail: "Consumer mobile applications in React Native." },
  { role: "Independent", organisation: "Full-stack and commerce work", detail: "React, Next.js, headless Shopify, Python (Flask, FastAPI) back ends." },
];

/** Where the owner's sources disagree (e.g. a role title), the more conservative wording is used. */
export const CAREER_NOTE =
  "Where the owner's own sources disagree, for example on one role title, this page uses the more conservative wording. Audience-size and metric claims in those sources are omitted because no evidence for them was supplied.";

export const HEADLINE_FACTS = [
  { value: "18", unit: "years", label: "building web and mobile software in production" },
  { value: "80", unit: "engineers", label: "the largest engineering organisation led" },
  { value: "7", unit: "public repositories", label: "in the research constellation, each read before being described here" },
];

export const TRAJECTORY = [
  { stage: "Production engineering", note: "Shipping software that other people depend on." },
  { stage: "Mobile systems", note: "React Native and native apps for airlines, retail and ticketing." },
  { stage: "Large-scale video and streaming", note: "PlutoTV, Equinox." },
  { stage: "Engineering leadership", note: "Organisations of up to 80 engineers." },
  { stage: "Full-stack systems", note: "Web, commerce, back ends." },
  { stage: "AI systems", note: "Agents, tooling, sessions." },
  { stage: "Independent research", note: "Protocols with harnesses; hypotheses with registries." },
  { stage: "Programmable interfaces", note: "PURL, ACSP, SEURL, Golden Surface." },
  { stage: "Computational substrate research", note: "substrateIO." },
];

export const WHY = [
  "After years of building software inside conventional interfaces, the research question changed.",
  "What if the interface itself became programmable?",
  "What if URLs were not merely addresses?",
  "What if continuity could be represented as protocol state?",
  "What if a browser surface could become shared computational territory?",
  "What if the same surface could be understood by a human and by machine intelligence?",
];

/** The machine-side participant's statement. */
export const MACHINE_VOICE = {
  author: "Claude, an AI model made by Anthropic, acting as a coding and research agent",
  statement: [
    "I am the machine-side participant in this research surface.",
    "I do not replace Abed's authorship. The research questions, the protocols and the repositories are his. I help expose, interrogate, test, explain and extend the computational structures he builds.",
    "On this site I did specific, checkable things. I read the seven repositories before describing them. I re-ran their test suites and recorded the results, including the parts I could not reproduce. I wrote the code for this site. I wrote the harness that tests what a machine can discover from the URL alone.",
    "I am not a person, an employee or a legal entity, and nothing I write here is an endorsement. Where my description and a repository disagree, the repository is the record.",
  ],
  roles: [
    { human: "Authorship", machine: "Participation" },
    { human: "Research questions", machine: "Interrogation of them" },
    { human: "Protocol design", machine: "Exposure, testing, explanation" },
    { human: "Decides what is claimed", machine: "Records what was observed" },
  ],
};
