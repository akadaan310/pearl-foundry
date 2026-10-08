# Pearls V6 — implementation map (Checkpoint 1)

Written after reading the consumer repository (`akadaan310/aanebed` at `ad435cb`, v2.0.0) and the substrate repository (`akadaan310/pearl-substrate` at `e79edac`, read-only clone). Nothing here was inferred from earlier discussions. Facts are cited to files.

## A. What the consumer surface has (reused, not rebuilt)

| Capability | Where | V6 use |
|---|---|---|
| pearl/1 grammar, parser, canonical JSON → SHA-256 → `p_` id, portable `/p/{id}.{payload}` | `src/lib/experience.ts`, `src/lib/pearl/*` | Every V6 experience is still a Pearl carried by its URL |
| Pure computational addresses (`/x`), living records, legal affordances | `src/lib/address.ts`, `src/lib/living/*` | The "tiny world", "clock" and "loom" experiences; friendly verbs over the same operations |
| FORK / REMIX / COMPARE / VERIFY, Surface·Substrate·Proof | `src/components/living/*` | Kept; Substrate and Proof move behind **Inspect** |
| Browser-local library and spaces | `src/lib/pearl/workspace.ts` | "Keep", and the anonymous half of continuity |
| Resolver for pasted AI replies | `src/lib/pearl/resolve.ts`, `BringPearl` | "Bring it back" |
| Capability registry, machine discovery | `src/lib/capabilities.ts`, `/capabilities.json`, `/llms.txt`, `/.well-known/ai` | Extended with new pure capabilities; "Copy for AI" points at these |

## B. What the substrate backend actually is (`pearl-substrate`)

- **Six primitives:** Pearl, Address, Capability, Transition, Identity, Event. Flask on PostgreSQL 14 (`ARCHITECTURE.md` §1).
- **Implemented (§18):**
  - pearl core (parity-tested canonicalizer);
  - human **dev-only** auth;
  - AI 5-layer identity with HMAC credentials and the return protocol (verdicts `SAME_IDENTITY_NEW_SESSION`, `NEW_INSTANCE_KNOWN_MODEL`, `UNKNOWN_IDENTITY`, `POSSIBLE_IMPERSONATION`, `INVALID_CREDENTIAL`);
  - a capability registry (6 demonstrated);
  - append-only events, idempotency, structured errors, OpenAPI.
- **Routes (§14, `api/routes.py`):**
  - auth: `/api/v1/auth/{human/dev-login, ai/register, ai/authenticate, ai/return, whoami}`;
  - pearls: `/api/v1/pearls` (POST), `/api/v1/pearls/{id}` (GET), `/{id}/fork`, `/remix`;
  - `/api/v1/verify/pearl/{id}`, `/api/v1/capabilities[/mine]`, `/api/v1/events`, `/api/v1/utils/{hash,text}`;
  - discovery: `/.well-known/ai`, `/ai.txt`, `/llms.txt`, `/capabilities.json`, `/openapi.json`, `/health`, `/ready`.
- **Not built (README, §18):** states/transitions, jobs, sandbox, **tickets**, **continuity carry/restore**, **experience runtime**, `compute.eca` execution, the Ed25519 HTTP route, magic-link email, and **`V4_CLOUD_CODE_CONTRACT.md`** (Phase 7; the file does not exist).

## C. Hard boundaries found (they decide the design)

1. **The substrate is not publicly reachable.** `deploy/NOTES.md`: the API binds `127.0.0.1:8477`, and "the OCI security list allows only SSH ingress, so nothing here is publicly reachable". There is no public domain (§18: "public domain UNKNOWN/DEFERRED"). Vercel cannot call it today.
2. **Human accounts cannot exist in production.** Only `dev-login` exists, refused when `PEARL_ENV=production` unless `PEARL_ALLOW_DEV_LOGIN=1`. Magic-link delivery raises `NotImplementedError`. V6 therefore offers no sign-up: "Keep across devices" says why.
3. **The two block schemas differ.** The canonicalizer and ids agree byte-for-byte (`tests/test_parity.py`), but `pearlcore/validate.py` models blocks differently.

   Checked by running the backend's own `validate_pearl(strict=True)` on site Pearls (2026-10-08):

   | Pearl | Backend verdict |
   |---|---|
   | Owner's Claude Pearl `p_rg86c59j7jmqp0w1` | rejected: `unknown block type 'c'` (the site wraps continuity kinds in `c`) |
   | Living experience `p_482ex07xv7wstszd` | rejected: `x`/`research` blocks need `text`; `choice` unknown |
   | Plain h/p/list Pearl `p_nvb6n9cyv0ygq4ek` | **valid, same id** |

   So only a subset of site Pearls is storable in the substrate today. V6 checks this before any write and says so, never "saves" what the backend would reject.

## D. Integration design (frontend owns experience, backend owns authority)

```
Human ─▶ Pearls V6 (Vercel) ─▶ src/lib/substrate/* ─▶ /api/substrate/* (server route, allow-listed GETs)
                                                     ─▶ PEARL_SUBSTRATE_URL (server-only env, unset today)
```

- `src/lib/substrate/`: typed client and models (Pearl, capability, identity verdicts, error envelope), feature detection, and a schema-compatibility check that mirrors `validate.py`'s block model. It is tested against a fake of the documented responses.
- `/api/substrate/status`: reports *not configured*, *configured but unreachable*, or *connected* (with the substrate's `/health`, `/capabilities.json` and `/.well-known/ai`). It proxies only an allow-list of public GETs; no request path from the browser is forwarded.
- No credentials in the browser. Authenticated or privileged substrate calls are not wired, because no human session can exist in production (C2). The boundary and the exact contract needed are documented in `docs/v6/BACKEND_CONTRACT_GAPS.md`.
- Without the substrate, everything the person does still works, because a Pearl lives in its URL. This is the honest anonymous-first product.

## E. Product plan (checkpoints 3–10)

| Checkpoint | Build |
|---|---|
| 3 Landing | "Come here": a cinematic glass world of living Pearls, grouped as Play / Make / With AI / Strange / Useful / Continuity. The first one responds to a touch on the landing itself. No sign-up. |
| 4 Pearl viewer | A V6 object bar on `/e`, `/p`, `/live`, `/g`: **Copy link · Copy for AI · Make your own · Keep · Share · Inspect**. Friendly verbs (Continue / Change something / See what happened / Watch it evolve) over the same registered operations. |
| 5 AI handoff | `aiProgram(object)`: one small, provider-neutral prompt per object, generated from its living record and its machine endpoints. "Bring it back" recognises returned links. |
| 6 Continuity | An anonymous browser trail ("You were here"), the **garden** (`/garden`: your Pearls as a constellation linked by created / kept / forked / continued / returned / moved-by-AI), and AI participation shown as *said it was Claude* (self-declared), never as verified. |
| 7 Discovery | Ten experiences on the same substrate (below). |
| 8 Multi-AI | **A game whose address is its history:** `/g/ttt/{move}~{who}/…`. Each move appends one segment; the board, whose turn it is, the legal next moves and the lineage (Human → AI A → AI B → you) are all derived from the URL. A pure JSON form is provided for AIs. |
| 9 Research depth | The previous homepage moves to `/how` ("How does this work?"); Research, Substrate, PURL, AI-CI, Developers, For AI, Institutions, Press and About sit in the footer. |
| 10 Polish | Mobile-first, axe, reduced motion, an optional computational sound (muted by default, never required), error states as diagnostic Pearls, and the full test suite. |

**The ten experiences, on one substrate (§53):**

1. **A tiny world:** the ECA ring, reframed.
2. **A game:** noughts and crosses, by URL.
3. **A clock:** an automaton that ticks.
4. **A creative generator:** a pattern loom.
5. **A conversational Pearl:** a continuity Pearl.
6. **An AI-made tool:** composed by Claude in this session and labelled so.
7. **An AI handoff Pearl.**
8. **A report Pearl** ("Something wrong?").
9. **Fork and remix.**
10. **A multi-AI continuation:** the game passed between AIs.

## F. Not doing (and why)

- No SSH, no installs on the VMs, no local re-creation of the backend, no invented endpoints, no edits to `pearl-substrate`.
- No natural-language generation on the server: the site has no model. "What should we make?" turns the person's sentence into a *Copy for AI* program, and their AI composes the Pearl.
- No social features, marketplace, tokens or fake sign-up.
