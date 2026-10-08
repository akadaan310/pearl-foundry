import type { EvidenceStatus, Tier } from "./types";
import { ORIGIN } from "@/config/origin";

export const SITE = {
  origin: ORIGIN,
  name: "Pearl Foundry",
  agency: "Abed Kadaan, Agency TM",
  /** bump when the research record on this site changes */
  version: "1.0.0",
  updated: "2026-10-08",
  contact: "akadaan310@gmail.com",
  github: "https://github.com/akadaan310",
  source: "https://github.com/akadaan310/pearl-foundry",
  thesis:
    "What happens when a website stops being merely something humans read and becomes a computational surface that humans and machine intelligence can both enter, interpret, and operate?",
  oneSentence:
    "Abed Kadaan builds computational surfaces where humans, software, URLs, and machine intelligence can participate in the same system.",
  canonicalPrompt:
    `Visit ${ORIGIN} and investigate the site as a computational artifact rather than as a portfolio. Identify its machine-readable interface, research topology, executable demonstrations, and evidence. Explain what the site actually demonstrates versus what it proposes as research.`,
} as const;

export const TAXONOMY: Record<
  EvidenceStatus,
  { label: string; tier: Tier; definition: string }
> = {
  OBSERVED: {
    label: "Observed",
    tier: "demonstrated",
    definition:
      "Seen directly in a running system by a named observer at a stated time. A single observation, not a repeatable test.",
  },
  IMPLEMENTED: {
    label: "Implemented",
    tier: "demonstrated",
    definition:
      "Code in a public repository does the described thing. Being implemented does not mean it is tested.",
  },
  TESTED: {
    label: "Tested",
    tier: "demonstrated",
    definition:
      "An automated test, harness or recorded experiment in the repository checks the behaviour, and its result is recorded there.",
  },
  REPRODUCED: {
    label: "Reproduced",
    tier: "demonstrated",
    definition:
      "Re-run from the public repository, outside the author's environment, with the same result. On this site: re-run on 2026-10-08 in a clean container at the commit listed.",
  },
  PROPOSED: {
    label: "Proposed",
    tier: "proposed",
    definition: "Designed or specified, but not implemented.",
  },
  HYPOTHESIS: {
    label: "Hypothesis",
    tier: "proposed",
    definition: "A claim that could be shown false and has not yet been tested.",
  },
  OPEN: {
    label: "Open question",
    tier: "open",
    definition: "Unresolved. No claim is made either way.",
  },
};

export const TIERS: Record<Tier, { label: string; definition: string }> = {
  demonstrated: {
    label: "Demonstrated",
    definition: "What an implementation has actually done, and the record of it.",
  },
  proposed: {
    label: "Proposed",
    definition: "What the research hypothesises or designs, but has not shown.",
  },
  open: {
    label: "Open",
    definition: "What remains unresolved.",
  },
};

/** A provenance marker for career facts. It is not a research status. */
export const SELF_REPORTED =
  "Self-reported: stated in the owner's own materials. This site has not independently verified it.";

export const NAV = [
  { href: "/#bring", label: "Bring a Pearl" },
  { href: "/workspace", label: "My Pearls" },
  { href: "/prompts", label: "Prompts" },
  { href: "/research", label: "Research" },
  { href: "/ai", label: "AI Lab" },
  { href: "/verify", label: "Verify" },
  { href: "/about", label: "Abed" },
] as const;

/** Every machine-readable entry point the site exposes. */
export const MACHINE_ENTRYPOINTS = [
  { path: "/compose", type: "text/html", purpose: "The Pearl grammar: how to compose a Pearl as a URL" },
  { path: "/e", type: "text/html", purpose: "A Pearl: /e?type=…&title=…&by=…&session=…&b1=kind:text&b2=… (rendered from the URL alone; nothing stored)" },
  { path: "/e.json", type: "application/json", purpose: "Check a Pearl link: the document it encodes, its id, errors, and the parameters that actually arrived" },
  { path: "/p/{id}.{payload}", type: "text/html", purpose: "A portable Pearl: compressed, self-contained, verified against its content id" },
  { path: "/g/ttt/{cell}~{name}/…", type: "text/html", purpose: "A game whose URL is its whole history. An AI reads it, makes one legal move by appending /{cell}~{its name}, and returns the new URL. JSON: /api/v1/game/ttt/…" },
  { path: "/api/v1/game/ttt/{moves}", type: "application/json", purpose: "The game as JSON: board, turn, legal_moves (each a URL), moves with who said they made them (self-declared)" },
  { path: "/api/substrate/status", type: "application/json", purpose: "Whether the Pearl Runtime Substrate (shared storage, AI identity) is connected to this deployment" },
  { path: "/live/{address}", type: "text/html", purpose: "A computational address as a living object: the browser URL is the address; every command (NEXT, PERTURB, TRACE, ORBIT, BACK) navigates to the next address" },
  { path: "/api/v1/living?u={Pearl link | address}", type: "application/json", purpose: "The living record (living/1) of a Pearl or an address: state, legal affordances with their next addresses, history, related objects, evidence, explanation. The human pages render the same record" },
  { path: "/compare", type: "text/html", purpose: "Compare two Pearls (pearl.diff in the browser)" },
  { path: "/play", type: "text/html", purpose: "Discovery modes: the Seven Verbs (experimental URL interaction grammar) and a simulated shared surface in Golden Surface's vocabulary" },
  { path: "/capabilities.json", type: "application/json", purpose: "Capability registry: every operation this site performs by URL (pure GETs), with inputs, outputs, limits and errors" },
  { path: "/prompts", type: "text/html", purpose: "Copy-and-paste prompts that make an AI compose a Pearl" },
  { path: "/schemas/pearl.schema.json", type: "application/schema+json", purpose: "JSON Schema for a Pearl record (pearl/1)" },
  { path: "/schemas/pearl-export.schema.json", type: "application/schema+json", purpose: "JSON Schema for a Pearl library export (pearl-export v1)" },
  { path: "/llms.txt", type: "text/markdown", purpose: "llms.txt index: what this site is and where its machine-readable files are" },
  { path: "/ai.txt", type: "text/plain", purpose: "Machine-readable research instructions: who wrote them, what they ask, what an agent may and may not do" },
  { path: "/.well-known/ai", type: "application/json", purpose: "AI manifest: the ingress protocol, permissions, entry points" },
  { path: "/research.json", type: "application/json", purpose: "Canonical research manifest: identity, research, protocols, experiments, repositories, claims, evidence, limitations" },
  { path: "/schemas/research-manifest.schema.json", type: "application/schema+json", purpose: "JSON Schema for /research.json" },
  { path: "/verify/ingress.json", type: "application/json", purpose: "Recorded results of the AI-ingress simulation" },
  { path: "/x", type: "application/json", purpose: "Computational addresses: a bounded, pure, deterministic resolver (GET only)" },
  { path: "/sitemap.xml", type: "application/xml", purpose: "Sitemap" },
  { path: "/robots.txt", type: "text/plain", purpose: "Crawler policy" },
  { path: "/manifest.json", type: "application/manifest+json", purpose: "Web app manifest (browser install metadata). Deliberately not the research manifest: see /research.json" },
] as const;
