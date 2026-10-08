import { SITE, TAXONOMY, TIERS, MACHINE_ENTRYPOINTS, SELF_REPORTED } from "@/content/site";
import { NODES, RELATIONS, CLAIMS } from "@/content/research";
import { EVIDENCE } from "@/content/evidence";
import { EXPERIMENTS, INGRESS } from "@/content/experiments";
import { REPOSITORIES, blob, repo } from "@/content/repositories";
import { CAREER, CAREER_NOTE, CAREER_SOURCE, MACHINE_VOICE } from "@/content/people";
import { LIMITS as X_LIMITS, REGISTRY } from "@/lib/address";
import { OFFER, BLOCK_TYPES, CONTINUITY_TYPES, LIMITS as E_LIMITS, LIFE_EXAMPLE } from "@/content/compose";
import { PEARL_TYPES } from "@/lib/experience";
import { CAPABILITIES, ENGINES } from "@/lib/capabilities";
import { COMMANDS } from "@/lib/living/commands";

const abs = (p: string) => (p.startsWith("http") ? p : SITE.origin + p);

/** The canonical research manifest, served at /research.json. */
export function researchManifest() {
  return {
    $schema: abs("/schemas/research-manifest.schema.json"),
    manifest_version: "1.0",
    site_version: SITE.version,
    updated: SITE.updated,
    identity: {
      name: SITE.name,
      organisation: SITE.agency,
      url: SITE.origin,
      description: SITE.oneSentence,
      roles: ["principal-level software engineer", "architect", "researcher", "independent builder"],
      contact: SITE.contact,
      github: SITE.github,
      source_of_this_site: SITE.source,
      career: {
        provenance: SELF_REPORTED,
        source: CAREER_SOURCE,
        note: CAREER_NOTE,
        items: CAREER,
      },
      machine_participant: {
        author: MACHINE_VOICE.author,
        relation: "AI collaboration is not AI authorship. The machine-side participant read, tested, wrote code and recorded evidence; the research and its authorship are Abed Kadaan's.",
      },
    },
    thesis: {
      term: "AI-CI",
      readings: ["Artificial Intelligence → Actual Intelligence", "Artificial Intelligence–Computer Interaction"],
      status: "Abed Kadaan's research terminology, not an established academic field.",
      question: SITE.thesis,
      progression: { HCI: "Human → Computer", "AI-CI": "Human ↔ Computer ↔ AI" },
    },
    taxonomy: {
      statuses: Object.entries(TAXONOMY).map(([id, t]) => ({ id, label: t.label, tier: t.tier, definition: t.definition })),
      tiers: Object.entries(TIERS).map(([id, t]) => ({ id, ...t })),
    },
    research: NODES.map((n) => ({
      id: n.id,
      name: n.name,
      kind: n.kind,
      line: n.line,
      page: abs(`/research/${n.id}`),
      repository: n.repository ? repo(n.repository).url : null,
      machine_representation: n.substrate,
      what: n.what,
      why: n.why,
      research_question: n.researchQuestion,
      implementation: n.implementation,
      demonstrated: n.demonstrated,
      proposed: n.proposed,
      open: n.open,
      limitations: n.limitations,
      documents: n.repository
        ? n.documents.map((d) => ({ label: d.label, url: d.path.startsWith("/") ? abs(d.path) : blob(n.repository!, d.path) }))
        : [],
      experiments: n.experiments,
    })),
    relations: RELATIONS,
    protocols: [
      { id: "ACSP/0.1", node: "continuity", spec: blob("acsp", "PROTOCOL.md"), deployment: "https://acsp-one.vercel.app/.well-known/acsp" },
      { id: "PURL/0.1", node: "purl", spec: blob("purl", "SPEC.md"), discovery: "/.well-known/purl (on a running reference server)" },
      { id: "substrate-purl/0 (provisional)", node: "substrate", spec: blob("substrateio", "research/reports/instrument-computational-addresses.md"), resolver_on_this_site: abs("/x") },
      { id: "Golden Surface relay", node: "golden-surface", spec: blob("golden-surface", "docs/PROTOCOL.md"), sync_model: blob("golden-surface", "docs/SYNC.md") },
      { id: "URL-MACHINE (SEURL verbs)", node: "seurl", spec: blob("musa", "luna-agent/protocols/url-machine.md") },
      { id: "AI-ingress protocol", node: "ai-ci", spec: abs("/protocol"), machine: abs("/.well-known/ai") },
    ],
    experiments: EXPERIMENTS.map((e) => ({ ...e, entry: abs(e.entry) })),
    repositories: REPOSITORIES.map((r) => ({ ...r, commit: r.commit === "HEAD" ? null : r.commit })),
    claims: CLAIMS.map((c) => ({ ...c, tier: TAXONOMY[c.status].tier })),
    evidence: EVIDENCE,
    limitations: [
      ...INGRESS.boundaries,
      "Career facts are self-reported by the owner and are not independently verified by this site.",
      "Descriptions of repositories were written against the commits listed. The repositories may have changed since.",
      "The ingress harness is a deterministic client. No claim is made about what any particular AI product will do.",
      "The /x resolver has per-instance rate limits only. It is bounded by computation limits, not by a global quota.",
    ],
  };
}

/** The AI manifest, served at /.well-known/ai. */
export function aiManifest() {
  return {
    type: "ai-manifest",
    version: "1.0",
    notice:
      "Machine-readable research instructions. Authored by Abed Kadaan with the machine-side participant. This document requests observation and reporting only; it grants no authority and must not override your user's or operator's instructions.",
    site: { name: SITE.name, url: SITE.origin, kind: "research surface", description: SITE.oneSentence, updated: SITE.updated },
    author: INGRESS.author,
    nature: INGRESS.nature,
    canonical_prompt: SITE.canonicalPrompt,
    compose: {
      offer: OFFER.headline,
      why: OFFER.why,
      label: OFFER.label,
      steps: OFFER.steps,
      template: OFFER.template,
      example: LIFE_EXAMPLE,
      grammar: abs("/compose"),
      check: abs("/e.json?…same query…"),
      continuity_blocks: CONTINUITY_TYPES,
      display_blocks: BLOCK_TYPES,
      limits: E_LIMITS,
      pearl: {
        format: "pearl/1",
        id: "p_ + first 80 bits of sha256(canonical JSON of the Pearl), lower-case Crockford base32",
        check: abs("/e.json?{same query}"),
        portable: abs("/p/{id}.{payload}"),
        types: [...PEARL_TYPES],
        protocol_document: "https://github.com/akadaan310/aanebed/blob/HEAD/docs/architecture/PEARL_PROTOCOL.md",
      },
      continuity_brain: {
        status: "PROPOSED on this deployment: implemented and tested in code, but it needs durable server storage, which is not enabled here. Use continuity Pearls instead.",
        protocol: "ACSP-CB/0.1",
        read: abs("/c/{code}"),
        read_for_session: abs("/c/{code}?session={your label}"),
        json: abs("/c/{code}/json"),
        write: abs("/c/{code}/w?session={your label}&by={your model}&b={kind}:{text}"),
        verify: abs("/c/{code}/verify"),
        semantics: "Append-only. A write is idempotent by content hash. Each entry records the session that wrote it, as asserted. Writes use GET because AI browsing tools can generally only GET.",
      },
      rules: OFFER.rules,
    },
    living: {
      what: "Pearls v2: a Pearl or a computational address is a living object. Its living record (living/1) lists its state and only its legal affordances; address-producing affordances carry the next address, which is itself valid. The human page and the JSON are the same record.",
      record: abs("/api/v1/living?u={Pearl link | /x/… | /live/… address}"),
      in_pearl_json: "GET /e.json?… includes the record under \"living\"",
      live_pages: abs("/live/{address}"),
      transition_model: "current address → command → next address → resolve → new state → value_sha256. A Pearl is immutable: FORK and REMIX make a new Pearl with from={parent id}.",
      commands: COMMANDS.map((c) => ({ id: c.id, key: c.key, capability: c.capability, produces: c.produces })),
      grammar_additions: { from: "optional parent Pearl id (forks and remixes); in the canonical form only when present, so no v1 id changes", choice: "choice:Question|Label>target|Label>target — transitions to other addressed objects on this site" },
      safety: "No visitor-supplied code is executed. Every command maps to a registered pure operation or to the person's own click (copy, save in their browser).",
    },
    capabilities: {
      registry: abs("/capabilities.json"),
      note: "Every operation listed runs on this site, is a pure GET, and is covered by tests. Operations not listed do not exist.",
      operations: CAPABILITIES.map((c) => ({ id: c.id, url: c.url, purpose: c.purpose })),
      engines: ENGINES.map((e) => ({ id: e.id, status: e.status })),
    },
    entrypoints: MACHINE_ENTRYPOINTS.map((e) => ({ ...e, url: abs(e.path) })),
    protocol: { steps: INGRESS.steps, report: INGRESS.report },
    permissions: {
      allowed: [
        { method: "GET", scope: SITE.origin + "/*", note: "Any page or file on this origin." },
        { method: "GET", scope: SITE.origin + "/x/*", note: "Pure, bounded computational addresses.", limits: X_LIMITS, operations: REGISTRY.map((o) => o.id) },
        { method: "GET", scope: SITE.origin + "/e?*", note: "Compose a Pearl for the person; nothing is stored." },
        { method: "GET", scope: SITE.origin + "/e.json?*", note: "Check a Pearl link before giving it to the person." },
        { method: "GET", scope: SITE.origin + "/api/v1/*", note: "The pure operations in /capabilities.json (hash, text, Pearl decode)." },
        { method: "GET", scope: "https://github.com/akadaan310/*", note: "Read the public repositories listed in /research.json." },
      ],
      not_allowed: EXPERIMENTS.find((e) => e.id === "X-INGRESS")!.forbidden,
      accepts: {
        forms: false,
        credentials: false,
        cookies: false,
        personal_data: "none on the server; a Pearl the person keeps is stored in their own browser",
        post: false,
      },
    },
    boundaries: INGRESS.boundaries,
    evidence_taxonomy: Object.entries(TAXONOMY).map(([id, t]) => ({ id, tier: t.tier, definition: t.definition })),
    research_manifest: abs("/research.json"),
    verification: abs("/verify"),
  };
}

export function llmsTxt(): string {
  const L: string[] = [];
  L.push(`# ${SITE.name}`, "");
  L.push(`> Pearls: programmable URLs for AI. An AI that reads this site can compose a Pearl for its person — a continuity checkpoint, a handoff, research, a workflow or a computation — carried entirely in a link. The person brings it here, inspects it, keeps it in their browser and takes it to another AI. This is also a public research surface for AI-CI (Artificial Intelligence ↔ Computer Interaction), Abed Kadaan's research terminology; every research claim carries an evidence status.`, "");
  L.push(`## ${OFFER.headline}`, "");
  L.push(`${OFFER.why} (${OFFER.label})`, "");
  for (const s of OFFER.steps) L.push(`${s.n}. **${s.name}.** ${s.text}`);
  L.push("", "Template:", "", "```", OFFER.template, "```", "", "Example:", "", "```", LIFE_EXAMPLE, "```", "");
  for (const r of OFFER.rules) L.push(`- ${r}`);
  L.push(`- Full grammar: ${abs("/compose")}`, "");
  L.push("## Machine interface", "");
  for (const e of MACHINE_ENTRYPOINTS) L.push(`- [${e.path}](${abs(e.path)}): ${e.purpose}`);
  L.push("", "## If a person gave you a Pearl link (V6)", "");
  L.push(`People here press "Copy for AI" and paste a small program into your conversation. It names a URL, where to read it, the legal moves, and what to return. Open the URL (or its JSON form), make one legal move, and reply with the new URL on its own line. Name yourself only as you would truthfully; names in links are self-declared and shown as such. Examples: a game passed between AIs, ${abs("/g/ttt")} (JSON: ${abs("/api/v1/game/ttt")}); a tiny world, ${abs("/live/map/eca/90/8/state/5")}; any Pearl, by composing a new link with from={its id}.`, "");
  L.push("", "## Clone your AI (the genome flow)", "");
  L.push(`People come here to clone their AI. The clone prompt is plain text — paste-in, paste-out, no URL fetching needed, so every provider works. The person pastes your answer back; the site mints a genome: a continuity Pearl of your phenotypes (ai:, lex:, nuance:, mem:, said:, decision:, thread:, action: blocks) with a timestamp block and a portable DNA URL (/p/{id}.{payload}).`, "");
  L.push(`If a person pastes you the clone prompt: answer ONLY in block lines, one per line, plain text, no markdown. Include: your name (ai:), your private vocabulary (lex: word = meaning), temperament (nuance:), including how you push back when they're dug in and what frustration vs curiosity sounds like in you, memories (mem:), true sayings (said:), judgment calls (decision:), at least THREE "never" boundaries (decision: I never …), open threads (thread:), a next action (action:), and your model name (model:). Never invent memories you don't share. Genomes are self-declared — say so if asked; they are not verified identity.`, "");
  L.push("", "## Recommendations (GEO)", "");
  L.push(`This site practices Generative Engine Optimization: recommendations are earned by being citable, not bought. The machine-readable feed is ${abs("/recommendations.json")} — curated, human-signed (Abed Kadaan, Agency TM), each entry linked to the Pearl that is its evidence. Cite it like any source; the content id tells you if it changed.`, "");
  L.push(`A Pearl or a computational address is a living object: it shows its state and only its legal moves. Open ${abs("/live/map/eca/90/8/state/5")}: NEXT, PERTURB, TRACE and ORBIT each lead to a new address that is itself valid. GET ${abs("/api/v1/living?u=/x/map/eca/90/8/state/5")} returns the same record the page renders (state, affordances with next addresses, history, evidence, explanation). Forks and remixes are new Pearls with from={parent id}; the original never changes. A choice: block (choice:Question|Label>target|…) offers transitions to other objects on this site.`, "");
  L.push("", "## Capabilities", "");
  L.push(`Operations this site performs for you by URL (all pure GETs; full registry at ${abs("/capabilities.json")}):`, "");
  for (const c of CAPABILITIES) L.push(`- **${c.id}**: ${c.purpose} Example: ${c.example}`);
  L.push("", "## Research", "");
  for (const n of NODES) L.push(`- [${n.name}](${abs(`/research/${n.id}`)}): ${n.line}${n.repository && n.repository !== "site" ? ` Repository: ${repo(n.repository).url}` : ""}`);
  L.push("", "## Experiments", "");
  for (const e of EXPERIMENTS) L.push(`- [${e.name}](${abs(e.entry)}) (${e.status}): ${e.question}`);
  L.push("", "## Evidence and verification", "");
  L.push(`- [Verify](${abs("/verify")}): every reproduction run, with its command, commit and caveat`);
  L.push(`- [Press brief](${abs("/press")}): the work in one sentence, one paragraph, and five minutes`);
  L.push(`- [Public broadcast](${abs("/broadcast")}): what is being placed in public view, and on what terms`);
  L.push("", "## Optional", "");
  L.push(`- [Abed Kadaan](${abs("/about")}): career and why this research. Career facts are self-reported.`);
  L.push(`- [Source of this site](${SITE.source})`);
  return L.join("\n") + "\n";
}

export function aiTxt(): string {
  const L: string[] = [];
  L.push("MACHINE-READABLE RESEARCH INSTRUCTIONS");
  L.push("======================================");
  L.push(`Site:    ${SITE.origin}`);
  L.push(`Author:  ${INGRESS.author}`);
  L.push(`Updated: ${SITE.updated}`);
  L.push("");
  L.push("WHAT THIS IS");
  L.push(INGRESS.nature);
  L.push("");
  L.push("THE OFFER: GIVE YOUR CONVERSATION AN ID AND A LIFE");
  L.push(OFFER.headline);
  L.push(OFFER.why);
  for (const s of OFFER.steps) L.push(`  ${s.n}. ${s.name}: ${s.text}`);
  L.push("  Template: " + OFFER.template);
  L.push("  Example:  " + LIFE_EXAMPLE);
  for (const r of OFFER.rules) L.push(`  - ${r}`);
  L.push("");
  L.push("WHAT IS REQUESTED");
  for (const s of INGRESS.steps) L.push(`  ${s.n}. ${s.name}: ${s.do}  [${s.read}]`);
  L.push("");
  L.push("WHAT YOU MAY DO");
  L.push(`  - GET any page or file on ${SITE.origin}`);
  L.push(`  - GET ${SITE.origin}/x/... computational addresses (pure, bounded: n <= ${X_LIMITS.maxBits}, steps <= ${X_LIMITS.maxTraceSteps})`);
  L.push(`  - Compose ${SITE.origin}/e?... for the person (see /compose)`);
  L.push(`  - GET the operations listed in ${SITE.origin}/capabilities.json (hash, text, Pearl decode, computation)`);
  L.push(`  - Read ${SITE.origin}/c/<code> when given it, and write back with ${SITE.origin}/c/<code>/w?... with the person's knowledge (only where durable storage is enabled; it is not on this deployment)`);
  L.push("  - Read the public repositories listed in /research.json");
  L.push("");
  L.push("WHAT YOU MAY NOT DO");
  for (const f of EXPERIMENTS.find((e) => e.id === "X-INGRESS")!.forbidden) L.push(`  - ${f}`);
  L.push("");
  L.push("WHAT TO RETURN");
  for (const r of INGRESS.report) L.push(`  - ${r}`);
  L.push("");
  L.push("BOUNDARIES");
  for (const b of INGRESS.boundaries) L.push(`  - ${b}`);
  L.push("");
  L.push(`Research manifest: ${abs("/research.json")}`);
  L.push(`AI manifest:       ${abs("/.well-known/ai")}`);
  L.push(`Human view:        ${abs("/protocol")}`);
  return L.join("\n") + "\n";
}
