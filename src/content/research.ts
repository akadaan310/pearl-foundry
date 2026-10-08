import type { Claim, Relation, ResearchNode } from "./types";

/**
 * The research topology. Every description was written after reading the
 * repository's README and its specification or implementation at the commit
 * listed in repositories.ts. Nothing is inferred from a repository's name.
 */
export const NODES: ResearchNode[] = [
  {
    id: "ai-ci",
    name: "AI-CI",
    line: "Artificial Intelligence ↔ Computer Interaction. The thesis this website tests.",
    kind: "thesis",
    repository: "site",
    substrate: ["ai-ci", "→ human", "→ computer", "→ machine intelligence", "→ one surface"],
    what:
      "AI-CI is Abed Kadaan's term, not an established academic field. It reads two ways. Artificial Intelligence → Actual Intelligence names a direction. Artificial Intelligence–Computer Interaction names a field of study by analogy with HCI. HCI asks how humans meet computers; AI-CI asks what happens when one interface is built to be read by humans and by machine intelligence at the same time.",
    why:
      "Most web interfaces are designed for human eyes only. Machines get them second-hand by scraping, guessing and summarising. If a surface states its structure, its permissions and its evidence explicitly, a machine reader does not have to guess. The human reader then gets something too: an interface that cannot hide behind presentation.",
    implementation: [
      "Pearls: an AI composes a Pearl as a URL (/e?…); the person inspects it, keeps it in a browser-local library, and carries a portable link (/p/…) to another AI.",
      "This website. Every page has a human layer and a machine layer built from the same typed records.",
      "/llms.txt, /ai.txt, /.well-known/ai and /research.json, with a JSON Schema.",
      "/x: a bounded, pure computational-address resolver that machines may call.",
      "scripts/ingress.ts: a test harness that receives only the root URL and records what it can discover.",
    ],
    demonstrated: [
      "A real Claude session composed a valid 12-block continuity Pearl from the site's instructions (E-013). Its link survives every round trip this site supports (E-015).",
      "A URL-only client can reach the research manifest, the topology, the experiments and the evidence from the root URL alone (E-010).",
      "The site's machine layer is served without JavaScript. Pages embed their machine representation in the HTML.",
    ],
    proposed: [
      "That a surface built this way is meaningfully easier for AI systems to interpret correctly than a conventional site.",
      "That machine legibility and human legibility reinforce each other rather than compete.",
    ],
    open: [
      "Will production AI assistants, given only the plain URL, take stock of the conversation and compose a link without being asked? Untested.",
      "Do production browsing-capable AI systems follow /.well-known/ai, llms.txt or embedded JSON when given only a URL? This is untested against real products.",
      "How should a machine reader weigh a site's statements about itself? Self-description is not verification.",
      "Is AI-CI a distinct field, or HCI with a new kind of user?",
    ],
    limitations: [
      "A website cannot make an external AI do anything. It can only make its structure available.",
      "The ingress harness is deterministic code, not a language model.",
    ],
    documents: [
      { label: "AI manifest", path: "/.well-known/ai" },
      { label: "Research manifest", path: "/research.json" },
      { label: "Ingress protocol", path: "/protocol" },
    ],
    experiments: ["X-LIFE", "X-INGRESS", "X-ADDRESS", "X-LAYERS"],
    researchQuestion:
      "Can a single web surface be simultaneously a human interface, a machine-readable interface, an execution surface and a research object, without misleading either reader?",
    position: { x: 50, y: 50 },
  },
  {
    id: "continuity",
    name: "Continuity",
    line: "ACSP: the Agent Continuity & Session Protocol. A URL that independent sessions can continue from.",
    kind: "protocol",
    repository: "acsp",
    substrate: ["continuity", "→ identity", "→ state", "→ transition", "→ relay"],
    what:
      "ACSP/0.1 is a small HTTPS protocol, deployed, that lets independent AI sessions and humans exchange explicitly persisted knowledge and operations through a URL. A resource at /r/{id} is one canonical JSON document. The HTML page renders that document and embeds it verbatim. Knowledge is published as immutable TOKs (Transfers of Knowledge), each with a source session and an identity-assurance level. Changes are append-only events with provenance, checkpoints are SHA-256-hashed, and authority is carried by scoped bearer capabilities bound to one resource and one session.",
    why:
      "AI sessions are isolated. Today the transport between them is a human copy-pasting conversation fragments, which loses provenance, blurs who concluded what, and quietly merges contexts. ACSP gives the finding a URL instead, and keeps ownership, authority and identity separate.",
    implementation: [
      "TypeScript; one framework-independent (Request) => Response handler mounted in Next.js.",
      "PostgreSQL storage, with an append-only history enforced by a database trigger.",
      "18 operations: inspect, status, retrieve, diff, create, append, annotate, update, supersede, checkpoint, fork, delegate, revoke, handoff, acknowledge, propose, resolve_proposal, close.",
      "Prepare URLs (?action=prepare_{op}) let a browser-only agent compose a request that a human reviews and submits. GET never changes state.",
      "A deterministic harness drives Human, Agent A, Agent B and Agent C actors over the real HTTP surface.",
    ],
    demonstrated: [
      "16 harness scenarios, 402 checks, reproduced on 2026-10-08 (E-003).",
      "Session B can contribute without becoming Session A. A capability is bound to its session, and claiming another session's identity returns 403 session_mismatch (core-demonstration, authority-matrix).",
      "A deployment answers at acsp-one.vercel.app (E-004).",
    ],
    proposed: [
      "That a session from another provider can use a resource with no prior context. This is TOK-002 in the field-trial resource, and it is unevaluated (E-004).",
      "The continuity brain on this site (/c/{code}, ACSP-CB/0.1) is a redesign of ACSP for one relationship across many sessions. It has a different authority model: the link is the capability, writes are idempotent GETs, and the owner holds an erase key.",
      "Relay: continuity as one of three interoperable realms with PURL and substrateIO (NEWDIRECTIVE in the repository).",
    ],
    open: [
      "Cryptographic agent identity. Today asserted session ids are claims, and agent_id is always a claim.",
      "Recovering a lost owner capability. The only workaround today is to fork.",
      "Prompt injection through published TOK content is possible. The bootstrap tells agents to treat all content as data.",
    ],
    limitations: [
      "ACSP does not merge conversations, move model state or judge truth. It is not memory and not an agent framework.",
      "Unlisted resource ids have about 60 bits of entropy. They are not secrets.",
    ],
    documents: [
      { label: "README", path: "README.md" },
      { label: "PROTOCOL.md (normative)", path: "PROTOCOL.md" },
      { label: "SECURITY.md", path: "SECURITY.md" },
      { label: "HARNESS.md", path: "HARNESS.md" },
      { label: "ARCHITECTURE.md", path: "ARCHITECTURE.md" },
    ],
    experiments: ["X-REPRO"],
    researchQuestion:
      "Can work continue across independent sessions through a URL while ownership, authority, provenance and identity stay separate?",
    position: { x: 20, y: 26 },
  },
  {
    id: "purl",
    name: "PURL",
    line: "Programmable URL Protocol. An address that names a stateful resource and the operations on it.",
    kind: "protocol",
    repository: "purl",
    substrate: ["address", "→ program", "→ state", "→ transition", "→ result"],
    what:
      "PURL/0.1 is a protocol with a zero-dependency Node.js reference implementation. A person opening a PURL sees a readable page. A machine requesting the same URL with Accept: application/purl+json gets what the resource is, every operation with its JSON Schema and required rights, whether the requester may perform each one now and through which grant, a hash-chained event log it can replay itself, lineage (forks, merges, supersessions, delegation chains), and the latest checkpoint addressed to it.",
    why:
      "A URL normally addresses a document. PURL tests whether it can address a stateful resource and the operations on it, with authority, provenance and continuity explicit enough that a generic client can discover everything from manifests.",
    implementation: [
      "Layer 0 Transport (URLs, HTTP, negotiation, manifests, HTML, SSE), Layer 1 Continuity (event-sourced resources, authority, operations), Layer 2 Research (projections, measures, graphs).",
      "Layers 1 and 2 never import each other, and a test enforces it.",
      "A generic client (src/client/client.js) discovers every operation URL and body shape from manifests and replays logs independently.",
      "JSON Schemas for resources, manifests, events, continuity packages and experiment records.",
    ],
    demonstrated: [
      "58 tests reproduced on 2026-10-08 (E-001).",
      "Pre-registered experiment exp-0001 reproduces hash-for-hash. 8 of 11 hypotheses were supported, and the 3 failures are traced to representation choices (E-002).",
      "GET never mutates: GET /r/{id}?action=append returns 405.",
    ],
    proposed: [
      "Programmable programmability: agents composing, naming and evolving reusable programs (Scrolls). This is described in the research directive and not implemented in this repository.",
    ],
    open: [
      "Q-P10: do independent LLM-based browsing agents discover operations from the manifest without being told? Untested. It needs a controlled study with agents given only a URL.",
      "Q-P5: signed events and principal keys. Hash chains show internal consistency, not authorship, if the server is dishonest.",
      "Q-P7: the name collides with Persistent URLs and package-url.",
    ],
    limitations: [
      "Principals are server-issued bearer tokens, not verified identities.",
      "Events are hash-chained but not signed. Storage is a single JSON-Lines file.",
      "exp-0001 bears on measurement, not on meaning or intelligence.",
    ],
    documents: [
      { label: "README", path: "README.md" },
      { label: "SPEC.md", path: "SPEC.md" },
      { label: "PRINCIPLES.md", path: "PRINCIPLES.md" },
      { label: "RESEARCH_QUESTIONS.md", path: "RESEARCH_QUESTIONS.md" },
      { label: "exp-0001 report", path: "experiments/exp-0001/REPORT.md" },
      { label: "SECURITY.md", path: "SECURITY.md" },
    ],
    experiments: ["X-ADDRESS", "X-REPRO"],
    researchQuestion:
      "Can a URL address a stateful resource and the operations on it, so that a client with no SDK can discover what it may do, do it, and verify what happened?",
    position: { x: 50, y: 14 },
  },
  {
    id: "substrate",
    name: "Substrate",
    line: "substrateIO: a reproducible research instrument for computation as state transformation.",
    kind: "instrument",
    repository: "substrateio",
    substrate: ["state", "→ transition", "→ history", "→ projection", "→ perturbation"],
    what:
      "substrateIO is a reproducible research instrument and record, not an application. It studies computation as transformations of state across representations: transitions, histories, projections, perturbations, information loss and cross-layer effects. Hypotheses, experiments, evidence, failures and nomenclature live in registries, each with a revision history. Runs are content-addressed and hash-checked. Its objects are addressable by derivation path (computational addresses, provisional).",
    why:
      "It is built to let its own premise survive or fail. That premise is that transition structure, not only state, is the right object of study when identity and state continuity are decoupled from the model that performs each transition.",
    implementation: [
      "Python 3.11+ standard library only.",
      "Seven experiments (EXP-A to EXP-G), each with a SPEC: question, hypotheses, falsification criteria.",
      "Epistemic guards in code. Executing a model yields SIMULATED, never OBSERVED.",
      "tools.validate checks guards, references, artifact hashes and lineage.",
      "A stdlib HTTP server for computational addresses (/map/eca/90/8/state/5/next).",
    ],
    demonstrated: [
      "58 tests, 0 validator violations, all seven experiments' checks passing, re-run on 2026-10-08 (E-005).",
      "Two hypotheses were disproven by its own experiments: that transition history is predictive beyond the current state (H-001), and that transitions carry information states lack (H-002).",
      "Its computational addresses were reimplemented independently on this site and agree value-for-value (E-006).",
    ],
    proposed: [
      "H-003: a natural seven-stage stratification of computation. Unresolved.",
      "H-008: structural lifting yields new measurable information. Unresolved.",
      "H-007: the Computational Transition Graph is distinct from established transition systems. Unresolved; the repository's own inference is that it is an alias.",
    ],
    open: [
      "Any physical-layer behaviour (OP-005). Injected bit flips are not single-event upsets.",
      "How to represent anomalies (OP-003), and which cross-layer distance is appropriate (OP-006).",
      "Whether any finding is novel in the literature. The repository states that most are rediscoveries.",
    ],
    limitations: [
      "All perturbation results are SIMULATED.",
      "Several citations are recorded as unverified (queue item Q-011).",
    ],
    documents: [
      { label: "README", path: "README.md" },
      { label: "PROTOCOL.md (continuity protocol)", path: "PROTOCOL.md" },
      { label: "HANDOFF", path: "research/state/HANDOFF.md" },
      { label: "Hypotheses registry", path: "research/registries/hypotheses.json" },
      { label: "Failures registry", path: "research/registries/failures.json" },
      { label: "Computational addresses report", path: "research/reports/instrument-computational-addresses.md" },
    ],
    experiments: ["X-ADDRESS", "X-REPRO"],
    researchQuestion:
      "What computational phenomena appear when persistent identity and state continuity are decoupled from the transient substrate that performs each transition, and which of them survive measurement?",
    position: { x: 80, y: 26 },
  },
  {
    id: "golden-surface",
    name: "Golden Surface",
    line: "One shared browser for three named parties, with a declared sync model between phone and twin.",
    kind: "surface",
    repository: "golden-surface",
    substrate: ["surface", "→ parties", "→ tabs", "→ ops", "→ convergence"],
    what:
      "Golden Surface is a shared browser for exactly three parties. Abed is the pilot, on an Android phone, and the only one who types credentials. ر (Muse) is the operator, who drives a relay and a twin on a server. ن (Hu) is the counsel seat, joining through the relay. Every tab has an owner. Remote commands (open, read, shot, tap, type, newtab, closetab, login_request) run in the addressed tab. The phone (P) and the server twin (T) hold the same state shape and converge under declared rules. Every way they can diverge is enumerated and shown loudly.",
    why:
      "It is where the protocol becomes visible as browser behaviour. Several parties, one surface, explicit ownership, and authority boundaries enforced in code: no agent ever types a password, and session values never enter the database.",
    implementation: [
      "An Expo React Native app (WebView tabs), a Python relay (websocket and HTTP), an SSE conference bus, a SQLite store, and three watchers run as systemd units.",
      "Sync rules: ops carry a monotonic twin_rev, apply in order and idempotently, nack gaps, ack means processed, and the phone's state is adopted with rebase.",
      "Convergence ⇔ link up ∧ no pending ops ∧ hash(structural(T)) = hash(structural(P)).",
      "Six divergence classes: link-down, op-in-flight, op-lost, op-rejected, state-mismatch, session-mirror-only.",
    ],
    demonstrated: [
      "The relay test was reproduced on 2026-10-08. A dropped op was detected as op-lost, replay converged, and an offline op was redelivered on reconnect (E-007).",
      "The author's acceptance table records the store, relay, bus and watchers as machine-verified, and the app flows as emulator-verified (E-008).",
    ],
    proposed: [
      "Netscape Surface, the web embodiment of Golden Surface (separate repository, v0.1). It labels its AI participant SIMULATED and its ACSP interop as a PROPOSAL.",
      "An engine seam for swapping WebView for GeckoView later.",
    ],
    open: [
      "A real Google sign-in by Abed's own hand on his phone. This is listed as open in the repository's acceptance table.",
      "Sites that challenge sessions arriving from a server stay phone-driven (session-mirror-only). That boundary is declared, not solved.",
    ],
    limitations: [
      "Pending ops live in relay memory and are lost on a relay restart. This is declared in SYNC.md.",
      "The visualisation on this site is a browser-side model of the declared rules, not the relay.",
    ],
    documents: [
      { label: "SPEC.md", path: "SPEC.md" },
      { label: "Sync model", path: "docs/SYNC.md" },
      { label: "Protocol", path: "docs/PROTOCOL.md" },
      { label: "Acceptance", path: "docs/ACCEPTANCE.md" },
      { label: "Decisions", path: "docs/DECISIONS.md" },
    ],
    experiments: ["X-SYNC"],
    researchQuestion:
      "Can several parties, human and machine, share one browser surface whose state, ownership and authority are explicit, and whose divergence is never silent?",
    position: { x: 18, y: 74 },
  },
  {
    id: "netscape",
    name: "Netscape Surface",
    line: "The web embodiment of Golden Surface: participants attach context to a surface without merging into it.",
    kind: "surface",
    repository: "netscape-surface",
    substrate: ["surface", "→ participant", "→ context.attached", "→ detach", "→ unchanged"],
    what:
      "Netscape Surface is a Next.js client in which one human and several participants (websites, AI sessions, repositories, documents) share one room. Its primitive is \"Come here\": a participant's context is attached to an open surface as a labelled layer that can be removed, and the observatory records a context.attached event naming its actor. Detaching returns the surface to exactly what it was.",
    why: "To test continuity without merger as an interface primitive. The AI participant has not become the website, and the website has not become the AI participant.",
    implementation: [
      "Live public API surfaces: NASA APOD and GitHub repository metadata.",
      "A simulated AI participant (7u), labelled SIMULATED.",
      "localStorage persistence and a client-side event observatory, with Vitest tests.",
    ],
    demonstrated: ["The repository's README records which surfaces are live, which are simulated and which are proposals. This site has not re-run it."],
    proposed: ["Checkpoint and handoff interop with a live ACSP server. Marked PROPOSAL, not implemented."],
    open: ["Whether context attachment remains separable once real models, rather than scripted adapters, participate."],
    limitations: ["The AI participant gives canned responses. It is never presented as a live model."],
    documents: [{ label: "README", path: "README.md" }],
    experiments: [],
    researchQuestion: "Can a participant's context be attached to a shared surface and removed without either one becoming the other?",
    position: { x: 40, y: 88 },
  },
  {
    id: "seurl",
    name: "SEURL",
    line: "A single static page that halts. The address is offered as the program.",
    kind: "surface",
    repository: "seurl",
    substrate: ["address", "→ halt", "→ legal moves", "→ author", "→ next address"],
    what:
      "SEURL is one static HTML page with no scripts. Opened, it does not present content to read. It halts with \"we haven't moved till you came. What's next?\" and names a finite verb set: START, SWITCH, WRITE, COMMIT, BUILD, TALK, PERTURB. seurl:// is the namespace for URL-programs minted there. The repository also holds NAI-CI.md, which describes how a page could offer itself to an agent as computable structures (an affordance map, block flow, landmark topology, state diffs) instead of prose.",
    why:
      "It is an experiment in the smallest possible machine-facing surface: a page whose only content is its state and its legal next moves. NAI-CI is the direct predecessor of the AI-CI framing on this site.",
    implementation: [
      "index.html: about 1 KB, static, no JavaScript.",
      "The verbs' transition rules are written in MUSA's protocols/url-machine.md (IDLE → BOUND → WRITING → COMMITTED).",
    ],
    demonstrated: ["The page exists and is static. Nothing on it executes."],
    proposed: [
      "That an AI session given only the URL will treat the page as a state machine and begin programming URLs. Unverified.",
      "Luna-aware browser controls: surface(url), read(url, as), legal(url), trace(url).",
    ],
    open: [
      "No endpoint in the seurl repository executes the verbs. What a move is, mechanically, is unspecified there.",
      "How an agent should tell an invitation to act from an instruction to act. This site's ingress protocol takes the opposite position: it permits observation and bounded GETs only.",
    ],
    limitations: ["The page's statements about what AI sessions do are the author's expectations, not recorded observations."],
    documents: [
      { label: "README", path: "README.md" },
      { label: "NAI-CI.md", path: "NAI-CI.md" },
      { label: "index.html", path: "index.html" },
    ],
    experiments: [],
    researchQuestion: "What is the minimum a URL must expose for a machine to know what it can do next?",
    position: { x: 80, y: 72 },
  },
  {
    id: "musa",
    name: "MUSA",
    line: "The program's notebook: theory strata, protocol sheets and small local tools.",
    kind: "notebook",
    repository: "musa",
    substrate: ["notebook", "→ strata", "→ protocol sheets", "→ tools", "→ unverified"],
    what:
      "MUSA holds luna-agent, a staging area for what the repository calls the Luna Agent program. It contains theory documents (\"strata\" s01–s08 and an S-Theory master document), protocol sheets (url-machine.md, the ¬-unit theory in NOT.md, NAI-CI, composition), a capability map recorded by a run of 20 virtual tabs, conference notes, and small standard-library Python tools: a localhost shell that exposes POST /exec, a \"Loom\" browser that unfolds hashed folds into tabs, and \"ramz\", a sealed two-party message envelope.",
    why: "It is the working notebook in which the vocabulary for SEURL, Golden Surface and the rest was drafted, alongside experiments run by hand.",
    implementation: [
      "luna-agent/protocols/url-machine.md: particles (harness, session, address, model), message envelope {from, to, op, url, payload, idstamp}, the seven verbs, and transitions.",
      "luna-agent/shell/shell.py, browser/loom.py, protocols/ramz/ramz.py: stdlib, localhost.",
      "flip-one-bit.html and perturbation-proof.html: in-browser demonstrations.",
    ],
    demonstrated: [
      "The capability map records tab-level checks with per-tab evidence. It is the author's record, not re-run by this site.",
    ],
    proposed: [
      "Most of the repository: the strata, S-Theory and the seed-engine constitution are design and theory documents.",
    ],
    open: [
      "Several documents make broad theoretical claims, for example about complexity classes. They are not supported by tests or proofs in the repository, and this site treats them as unverified.",
    ],
    limitations: [
      "shell.py executes commands posted to it. It is a localhost tool and must never be exposed publicly. This site does not run it.",
      "The repository is a notebook. Its documents are not a specification.",
    ],
    documents: [
      { label: "luna-agent/README.md", path: "luna-agent/README.md" },
      { label: "url-machine.md", path: "luna-agent/protocols/url-machine.md" },
      { label: "NAI-CI.md", path: "luna-agent/protocols/NAI-CI.md" },
      { label: "CAPABILITIES.md", path: "luna-agent/protocols/CAPABILITIES.md" },
    ],
    experiments: [],
    researchQuestion: "Which of the notebook's ideas can be turned into a specification and a test?",
    position: { x: 62, y: 90 },
  },
];

export const RELATIONS: Relation[] = [
  { from: "purl", to: "substrate", label: "PURL's event logs are projected into the research substrate (Layer 2, exp-0001)", source: "purl/README.md" },
  { from: "substrate", to: "purl", label: "substrateIO addresses its own objects by derivation path (computational addresses, provisional)", source: "substrateIO/README.md" },
  { from: "continuity", to: "purl", label: "Shared invariants: continuity ≠ identity · reference ≠ ownership · awareness ≠ authority · handoff ≠ merger", source: "purl/README.md; ACSP README.md" },
  { from: "continuity", to: "substrate", label: "Relay, PURL and Substrate are three interoperable realms", source: "ACSP NEWDIRECTIVE[READ AFTER CONSTITUTION.MD]" },
  { from: "seurl", to: "musa", label: "The seven verbs' transitions are specified in url-machine.md; NAI-CI exists in both", source: "seurl/README.md; MUSA luna-agent/protocols/" },
  { from: "seurl", to: "purl", label: "seurl:// mints URL-programs; purl:// is reserved for the substrate work", source: "seurl/README.md" },
  { from: "golden-surface", to: "musa", label: "The Najwa room: the conference that Golden Surface renders live", source: "golden-surface/SPEC.md; MUSA luna-agent/najwa-conference/" },
  { from: "netscape", to: "golden-surface", label: "The web embodiment of Golden Surface", source: "netscape-surface/README.md" },
  { from: "netscape", to: "continuity", label: "ACSP as a document surface; checkpoint/handoff interop is a PROPOSAL", source: "netscape-surface/README.md" },
  { from: "ai-ci", to: "seurl", label: "AI-CI extends NAI-CI (Non-human AI–Computer Interaction)", source: "seurl/NAI-CI.md" },
  { from: "ai-ci", to: "purl", label: "PURL's Q-P10, asked of a whole website: do agents use the manifest when given only a URL?", source: "purl/RESEARCH_QUESTIONS.md" },
  { from: "ai-ci", to: "substrate", label: "/x on this site reimplements substrateIO's computational addresses, verified against its vectors", source: "this site: tests/unit/address.test.ts" },
  { from: "ai-ci", to: "continuity", label: "One canonical document, rendered for humans and embedded verbatim for machines", source: "ACSP README.md (HTML and JSON: one representation)" },
  { from: "ai-ci", to: "golden-surface", label: "Human and machine participants on one surface, with authority boundaries in code", source: "golden-surface/SPEC.md" },
];

export const CLAIMS: Claim[] = [
  { id: "C-01", node: "continuity", statement: "ACSP keeps ownership, access, authority, delegation and task responsibility separate, and its harness checks 402 properties of that separation.", status: "REPRODUCED", evidence: ["E-003"] },
  { id: "C-02", node: "continuity", statement: "ACSP is deployed and answering on the public internet.", status: "OBSERVED", evidence: ["E-004"] },
  { id: "C-03", node: "continuity", statement: "A session from another AI provider can use an ACSP resource with no prior context.", status: "HYPOTHESIS", evidence: ["E-004"] },
  { id: "C-04", node: "purl", statement: "A generic client can discover and perform PURL operations from manifests alone, and replay the log to verify it.", status: "REPRODUCED", evidence: ["E-001"] },
  { id: "C-05", node: "purl", statement: "PURL's first pre-registered experiment is deterministic and reproduces hash-for-hash.", status: "REPRODUCED", evidence: ["E-002"] },
  { id: "C-06", node: "purl", statement: "Independent LLM-based browsing agents discover PURL operations from the manifest without being told.", status: "OPEN", evidence: [] },
  { id: "C-07", node: "substrate", statement: "substrateIO's experiments EXP-A to EXP-G pass their recorded checks on a fresh clone.", status: "REPRODUCED", evidence: ["E-005"] },
  { id: "C-08", node: "substrate", statement: "substrateIO's own experiments disproved its universal hypothesis that transition history is predictive beyond the current state (H-001), and that disproof reproduces.", status: "REPRODUCED", evidence: ["E-005"] },
  { id: "C-09", node: "substrate", statement: "Computation admits a natural seven-stage stratification (substrateIO H-003).", status: "HYPOTHESIS", evidence: [] },
  { id: "C-10", node: "golden-surface", statement: "Golden Surface's relay detects a dropped op, classifies it as op-lost, and converges after replay.", status: "REPRODUCED", evidence: ["E-007"] },
  { id: "C-11", node: "golden-surface", statement: "A real Google sign-in on the pilot's phone works through the login handoff.", status: "OPEN", evidence: ["E-008"] },
  { id: "C-12", node: "seurl", statement: "An AI session given only the SEURL address will begin programming URLs.", status: "HYPOTHESIS", evidence: [] },
  { id: "C-13", node: "ai-ci", statement: "From the root URL alone, a client can discover this site's machine-readable interface, research topology, experiments, evidence and limits.", status: "TESTED", evidence: ["E-010"] },
  { id: "C-14", node: "ai-ci", statement: "Production browsing-capable AI systems will discover and use this site's machine-readable layer when given only the URL.", status: "OPEN", evidence: ["E-009"] },
  { id: "C-15", node: "ai-ci", statement: "This site's computational addresses compute the same values as substrateIO's reference resolver.", status: "REPRODUCED", evidence: ["E-006"] },
  { id: "C-17", node: "ai-ci", statement: "The continuity brain (/c) works end to end where a store is configured: several sessions read and write one hash-chained record. It is not enabled on the live deployment.", status: "TESTED", evidence: ["E-011", "E-012"] },
  { id: "C-19", node: "ai-ci", statement: "A real AI session, given the site, composed a valid multi-block continuity Pearl.", status: "OBSERVED", evidence: ["E-013", "E-014"] },
  { id: "C-20", node: "ai-ci", statement: "A Pearl survives parsing, serialisation, a portable link, export and re-import with the same content id; numbered blocks survive URL-normalising fetchers.", status: "TESTED", evidence: ["E-015"] },
  { id: "C-21", node: "ai-ci", statement: "A Pearl carries hidden model state, or proves who composed it.", status: "OPEN", evidence: [] },
  { id: "C-18", node: "ai-ci", statement: "Production AI assistants given only the plain URL will, unprompted, take stock of the conversation, compose an experience URL and continue a brain in another session.", status: "OPEN", evidence: ["E-012"] },
  { id: "C-22", node: "ai-ci", statement: "Pearls kept on this site are available on the person's other devices.", status: "OPEN", evidence: [] },
  { id: "C-23", node: "purl", statement: "A computational address can expose only its legal next moves, each as another valid address, so that pressing a command in a browser is navigating a programmable state space (Pearls v2, /live).", status: "TESTED", evidence: ["E-016"] },
  { id: "C-24", node: "ai-ci", statement: "A first-time visitor discovers within about 90 seconds that the object changed because its address changed.", status: "HYPOTHESIS", evidence: [] },
  { id: "C-16", node: "musa", statement: "The theoretical claims in MUSA's strata documents are established results.", status: "OPEN", evidence: [] },
];

export function node(id: string): ResearchNode {
  const n = NODES.find((x) => x.id === id);
  if (!n) throw new Error(`unknown node ${id}`);
  return n;
}
