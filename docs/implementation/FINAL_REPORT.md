# Final report — Pearls V6, the human surface

Date: 2026-10-08 · Branch `ccr-d6dc9f9c-fvwlfi` · Version 6.0.0 · Plan: `docs/v6/IMPLEMENTATION_MAP.md` · Backend gaps: `docs/v6/BACKEND_CONTRACT_GAPS.md`

V6 makes the machine disappear until someone wants to see it. The landing is a place, not a lecture: "Come here." Under it, every V2 capability, research page and machine interface is preserved: moved downstairs, not deleted.

## Implemented

- **Landing (`/`):**
  - "Come here." with a tiny world that responds to the first touch. The ECA ring is reframed as "Continue / Watch it evolve / Make it mine", the address changes in the URL, and the technical view is one link away ("How does it work?").
  - A "Want another?" park in five zones: Play, Strange, With AI, Useful, Continuity.
  - "What should we make?" turns the person's sentence into a Copy-for-AI program. The site has no model of its own and says so.
  - "Bring it back" finds the link in an AI's reply.
  - "One link, many minds", and a downstairs band holding the AI offer, AI-CI and the research links.
  - "You were here" for returning visitors.
- **The ten experiences, all on the same substrate (pearl/1 + pure capabilities):**
  1. the tiny world (`/live/…`);
  2. a game, noughts and crosses whose URL is its history (`/g/ttt/{cell}~{name}/…`);
  3. a strange clock (`/clock/{rule}/{n}/{seed}`);
  4. a pattern loom (`/loom/…`);
  5. a conversation Pearl;
  6. an AI-made tool (a two-minute decider, by Claude in this session, labelled so);
  7. AI handoff (Copy for AI everywhere);
  8. a report Pearl (`/report`);
  9. fork and remix ("Make your own", "Change it");
  10. multi-AI continuation (the game passed between AIs, with its lineage).
- **Copy for AI:** a small, provider-neutral program per object (`src/lib/v6/handoff.ts`), generated from the object. It covers what it is, where to read it, the legal moves, and what to return.
- **Continuity without an account:** a browser trail (`pearls.trail.v1`) and the garden (`/garden`): what you opened, made, kept, gave to an AI and got back, as a constellation. AI participants are shown by the names they gave, marked self-declared.
- **Pearl viewer in human language:** Copy for AI · Copy link · Make your own · Change it · Keep · Check it · Explain · Inspect. The technical badges and the Surface/Substrate/Proof tabs moved behind Explore and Inspect. The palette keeps the precise commands.
- **The world surface:** a cinematic night-glass theme for the whole product (token-driven), mobile-first, with reduced motion respected. The optional computational sound is off by default, never needed, and has a toggle.
- **Errors in human language:** a global error boundary offers Try again, a diagnostic report (which becomes a Pearl), and the technical detail on request.
- **Substrate adapter (`src/lib/substrate/`):**
  - a typed client for routes that exist in `pearl-substrate`, with the structured error envelope mapped to human messages;
  - a server-only config (`PEARL_SUBSTRATE_URL`, https only);
  - `/api/substrate/status`, which never echoes the base URL;
  - a schema-compatibility mirror of the substrate validator.
- **Machine surface:** the `game.ttt` capability (JSON at `/api/v1/game/ttt/…`), new entry points, a V6 section in `llms.txt`, and `/developers`.

## Tested (local production build)

| Suite | Result |
|---|---|
| Unit | 100 tests: 99 pass, 1 skipped (PostgreSQL), 0 fail. New: substrate adapter (fake of the documented API; compat verdicts equal a real run of the substrate's `validate.py`), the game engine |
| Browser (desktop + Pixel 7) | 212 tests: 206 pass, 6 skipped (device-specific), 0 fail. axe WCAG 2.1 A/AA on every page including all V6 pages; the §66 stranger journey (touch, change, URL changes, Copy for AI, no account anywhere); the §54/§55 multi-AI game (you → "claude" → you → "gpt", lineage in the URL, names marked self-declared, garden remembers); refusals; make / loom / clock / report; the machine surface |
| Ingress harness | questions 12/12 (1 skipped: POST /c returns 503 without a store), checks 26/26; the root-page readability strings were updated for the new landing |
| Smoke | 48 checks, see below |

## Deployed

Commit `3c33aa0` was deployed by Vercel to https://aanebed.vercel.app. Against the live origin:

- smoke: **48/48** (`verification/smoke-live-v6.json`);
- ingress: questions 12/12 (1 skipped), checks 26/26;
- the V6 Playwright journeys (`BASE_URL=https://aanebed.vercel.app`, "V6"): **10 passed**, 0 failed.

`/api/substrate/status` reports `not_configured` on this deployment, which is the true state (G1).

## Blocked (backend), with the exact contract needed

See `docs/v6/BACKEND_CONTRACT_GAPS.md`:

- G1: the substrate is not publicly reachable (127.0.0.1 behind SSH-only ingress).
- G2: the block schemas differ, so the owner's Claude Pearl and the living experience are rejected by the substrate's own validator, while plain Pearls agree with identical ids.
- G3: no production human sign-in exists (dev-login only; magic links deferred), so V6 has no sign-up.
- G4: the OpenAPI output marks public reads as authenticated.
- G5: no GET-reachable way for an AI to prove identity with a contribution.
- G6: tickets, continuity carry/restore and experiences are deferred on the substrate.
- G7: the V4 contract document does not exist yet.

The consumer surface did not SSH anywhere, install anything, invent endpoints, or modify the substrate repository.

## Not established

- No person was observed doing the §66 journey. The browser test performs it; it is not a user study (claim C-24 remains HYPOTHESIS).
- No AI was actually given the Copy-for-AI programs in this phase. The multi-AI test pastes replies written by the test, with names "claude" and "gpt" as labels, not real model runs. Whether real AIs follow the programs is the next experiment.

---

# Previous phase — Pearls v2, the Living Programmable Surface

Date: 2026-10-08 · Branch `ccr-d6dc9f9c-fvwlfi` · Version 2.0.0 · Design: `docs/architecture/PEARLS_V2.md`

v2 makes the existing primitives into phenomena: a Pearl or a computational address shows its state, offers only its legal moves, and changes address when it changes. The research substrate, the vocabulary, the evidence model and every v1 Pearl are preserved. The owner's Claude Pearl keeps its v1.1.0 id, `p_rg86c59j7jmqp0w1`.

## Implemented

- **Living record (`living/1`)** for addresses and Pearls. It covers identity, state, legal affordances (address-producing ones carry the next address), history, parent, related objects, evidence rows (computed / checked / recorded / asserted / external / cannot be established) and an explanation generated from the state.
- **Command palette:** `/` opens it, `?` shows help, single-key shortcuts work (n t x o m b v i e f r = c k p s y l), and keys 1–3 switch layers. The palette is contextual, so illegal commands are absent, and shortcuts ignore text fields.
- **SURFACE · SUBSTRATE · PROOF** layers on every living object.
- **`/live/{address}`:** the browser URL is the computational address. NEXT, PERTURB (touch a cell), TRACE, ORBIT, NORMALIZE and BACK are real links, so they work without JavaScript and the browser's back button works. The address bar animates old → operation → new. PROOF recomputes the value hash in the browser and compares it with the server's.
- **The homepage hero is a living computation Pearl.** Its address lives in the fragment (`/#/map/…`), so the visible URL changes as you act. FORK turns it into a Pearl of your own.
- **Living Pearls on `/e` and `/p`:**
  - an object bar with VERIFY, FORK, REMIX, CARRY, SAVE and EXPLAIN;
  - a **world**, showing related objects as a constellation plus an accessible list;
  - a substrate view (URL anatomy, parsed blocks, state, lineage);
  - a proof view (id recomputed in the browser, plus the evidence rows).
- **FORK, REMIX, COMPARE:**
  - FORK and REMIX produce new Pearls with `from={parent}`; the original is never modified;
  - REMIX shows ORIGINAL · REMIX · DIFF;
  - `/compare` names computation transitions (address A → B) and continuity transitions (thread → close).
- **Grammar:** the optional `from=`, and the `choice:` block (transitions to other addressed objects). Empty experiences are valid but say they are empty. Everything is documented on `/compose` and in the schema.
- **Capabilities:** `pearl.fork`, `pearl.diff`, `living.describe` (pure GETs). The command table is published in `/capabilities.json`, and `living` sections were added to `/.well-known/ai`, `llms.txt` and `/e.json`.
- **`/play`:**
  - the **Seven Verbs**, using MUSA url-machine transitions, labelled an experimental interaction grammar;
  - a **shared surface** in Golden Surface's vocabulary, with visible ownership and authority, refusal of credentials, and convergence through the existing sync model. It is simulated in the browser.
- **AI-generated experience mode:** the "Make me something alive" prompt (Prompt Laboratory #7 and the homepage), plus a showcase experience Pearl.
- **Evidence:** E-016 (TESTED); claims C-23 (TESTED) and C-24 (HYPOTHESIS).

## Tested (local production build)

| Suite | Result |
|---|---|
| Unit | 94 tests: 93 pass, 1 skipped (PostgreSQL store test needs `CB_TEST_PG`), 0 fail |
| Browser (Playwright, desktop + Pixel 7) | 164 pass, 6 skipped (device-specific), 0 fail. Includes axe WCAG 2.1 A/AA on 28 pages × 2 devices, the §44 design journey, keyboard navigation, no-JS links, illegal commands absent, remix with the original unchanged, `/play`, and the machine surface matching the human surface |
| Ingress harness | questions 12/12 (1 skipped: POST /c returns 503 without a store), checks 26/26 |
| Smoke | 38/38 |

Specifically verified: every address-producing affordance resolves, including at the 12-operation limit; `/x` value hashes are unchanged; encoding survives for `&`, `#`, `+`, `%`, spaces and Unicode; a fork or remix leaves the original byte-identical; no command executes visitor-supplied code.

## Deployed

Commit `b77a53f` was deployed by Vercel to https://aanebed.vercel.app. Against the live origin:

- `npm run test:smoke`: **38/38** (`verification/smoke-live-v2.json`), including the v1 Pearl id check, `/live`, `/play`, `living.describe`, `pearl.fork` and `pearl.diff`;
- the ingress harness: questions 12/12 (1 skipped), checks 26/26;
- the v2 Playwright journeys (`BASE_URL=https://aanebed.vercel.app`, matching "v2 design test", "/live", "Living Pearl", "Play:" and "machine surface"): **28 passed**, 2 skipped (device-specific), 0 failed. The full browser suite was run against the local production build.

## Proposed (not built)

- Shared persistence of Pearls and history. The adapter exists and is inactive; see FUTURE_PERSISTENCE.
- A general-purpose programming language for URLs. The Seven Verbs are explicitly an experimental grammar.
- New compute engines (Julia and others). The registry stays the only way in.

## Not established

- **C-24:** that a first-time person discovers the address transition within about 90 seconds. No user study was run; the browser test performs the journey, but it is not a person.
- That AIs given the "Make me something alive" prompt compose good living Pearls. No AI provider was tested in this phase.

## Security

- No `eval` and no visitor code.
- Every command maps to a registered pure operation or to the person's own click: the clipboard, or saving to their browser.
- No credentials: the shared-surface simulation refuses anything credential-shaped and has no credential fields.
- No hidden persistence, no outbound fetches from capabilities, no secrets, no force-push.

---

# Previous phase — Pearls product transformation (v1.1.0)

Date: 2026-10-08 · Branch `ccr-d6dc9f9c-fvwlfi` · Product commit `3d51588` · Deployment https://aanebed.vercel.app

This report separates what is **implemented**, **tested**, **deployed**, **proposed** and **blocked**. Nothing below is claimed beyond the evidence named.

## Implemented

- **Product surface.** A light "paper" theme for the product, while the research surface keeps its dark theme (`src/app/(research)/`). A Simple | Explore mode switch over the same data, stored per browser and applied before first paint.
- **Navigation.** Discover / My Pearls / Spaces / Create / Explore. Research, AI Lab, Verify and About stay in the mobile menu and the footer. The former homepage is now `/explore`.
- **Homepage, Acts I–VI:**
  - I: the hero and a live Pearl object.
  - II: a standalone first prompt and Bring a Pearl.
  - III: a transformation demo that runs the product's own resolver, library and portable-link code.
  - IV: the experiences.
  - V: My Pearls and Spaces.
  - VI: the programmable web, the URL anatomy, the topology and the AI offer.
- **Create.** Eight experiences (`/create/*`): Conversation Keeper, Research Space, Creative Studio, Recipe Space, Study Companion, Project Handoff, Workflow Composer and Computation Explorer. Each is a form with live validation and preview. Each can be kept, copied, opened or exported. Each also has a standalone "ask your AI" prompt.
- **Spaces** (`/spaces`):
  - visual cards with counts and suggested spaces;
  - create, rename, and delete (contents move to Archive);
  - move Pearls between spaces;
  - export and verified import;
  - compose a space into a **collection Pearl**: members that do not fit are named, never truncated.
- **Pearl types.** Now nine: `project` and `notes` were added.
- **Capability registry** (`/capabilities`, `/capabilities.json`, plus entries in llms.txt, ai.txt and `/.well-known/ai`):
  - Operations: `pearl.check`, `pearl.decode`, `hash.sha256`, `text.transform` and `compute.eca`.
  - All are pure GETs and rate-limited.
  - Julia is listed as **not available**, with no stand-in.
- **Shared Pearl store adapter** (`src/lib/pearl/server-repository.ts`):
  - content-addressed and never overwrites;
  - re-hashes on write and on read;
  - **inactive**: no configuration, and no route uses it.

## Tested (local production build unless stated)

| Suite | Result |
|---|---|
| Unit (`npm run test:unit`) | 77 tests: 76 pass, 1 skipped (the PostgreSQL store test needs `CB_TEST_PG`), 0 fail |
| Typecheck, `next build` | pass |
| Browser (Playwright, desktop + Pixel 7) | 128 pass, 4 skipped (device-specific), 0 fail. Includes axe WCAG 2.1 A/AA on 21 pages × 2 devices, no-JS, reduced motion, no overflow, and journeys for Bring, Keep, Export/Import, Create, Spaces, modes, the demo and capabilities |
| Ingress harness (`npm run test:ingress`) | questions 12/12 (1 skipped: POST /c returns 503 without a store), checks 26/26 |
| Smoke (`npm run test:smoke`) | 29/29 |

New unit tests cover:
- the capability endpoints, called directly (including the known SHA-256 of "hello");
- tamper rejection in `pearl.decode`;
- collection composition limits;
- the store adapter against an in-memory fake of the REST protocol. It was not tested against a real store.

The owner-supplied Claude Pearl (`tests/fixtures/claude-2026-10-08.url`, evidence E-013) is the regression fixture throughout.

## Deployed and verified live

After `3d51588` was pushed, Vercel deployed it to https://aanebed.vercel.app. Against the live origin:

- `npm run test:smoke` passed **29/29** (`verification/smoke-live-3d51588.json`);
- the ingress harness passed 12/12 questions (1 skipped) and 26/26 checks.

The Playwright suite was run against the local production build, not against the live deployment.

## Proposed (designed, not built)

- Publishing Pearls to a shared store, so that `/p/{id}` short links resolve on any device.
- Accounts, private sharing, and a Postgres model with row-level security (`docs/architecture/FUTURE_PERSISTENCE.md`).
- The continuity brain (ACSP-CB/0.1) on this deployment. The code and SQL exist and are tested in code; the deployment has no store, so it returns 503.
- Further compute engines, such as Julia, behind the `ComputeEngine` interface.

## Blocked, and what would unblock it

| Item | Blocker | Minimum owner action |
|---|---|---|
| Shared short links / cross-device library | No durable store connected; zero environment variables on the project. Supabase is installed on the account but not connected, and was out of scope for this phase | Connect an Upstash/KV store to the project in Vercel → Storage (sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`), then approve the two publish/lookup routes |
| Continuity brain writes | Same: no store | Connect Supabase and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then decide on write authorisation |
| Julia capability | No Julia runtime deployed | Provide a bounded runtime; implement `ComputeEngine` |

## Not done, stated plainly

- **No external AI provider was tested** with the first-Pearl prompt or the Create prompts in this phase. The only real cross-model evidence is the owner-supplied Claude report (E-013). A fresh-session fetch test was proposed and declined.
- "Kept" means kept in this browser's localStorage. It does not sync, and the UI says so.
- Rate limiting is per serverless instance, so it is best-effort.

## Security review

- No secrets or credentials in source.
- No mandatory environment variables.
- No admin token in the browser.
- No signup form or passwords.
- No code evaluation, shell execution or outbound fetch from capabilities.
- Pasted links are parsed, never fetched.
- No `force` push.
