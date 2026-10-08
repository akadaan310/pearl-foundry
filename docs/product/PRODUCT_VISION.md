# Product vision — Pearls

**Your AI can make a Pearl.** A Pearl is a small, carryable object an AI composes for you as a link: a conversation worth keeping, a recipe, a study session, a project handoff, research with its evidence kept honest, or a computation this site runs. You bring it back, keep it, organise it in spaces, and hand it to any AI to continue.

## The loop

DISCOVER → ASK → COMPOSE → BRING BACK → KEEP → REUSE → COMPOSE AGAIN

| Step | Where | What is real today |
|---|---|---|
| Discover | `/` Act I | The hero, a live Pearl object (the life example, opening its own portable link) |
| Ask | `/` Act II (`#first`) | One standalone prompt (`FIRST_PROMPT`) that needs only the public URL; `/prompts` holds seven more |
| Compose | the person's AI, or `/create/*` | The grammar at `/compose`, `/llms.txt`, `/.well-known/ai`; eight form-based experiences |
| Bring back | Bring a Pearl (`/#bring`) | Paste a link or a whole AI reply; the resolver finds, validates and explains it without fetching anything |
| Keep | My Pearls (`/workspace`) | Browser-local library, with tasks created from a Pearl's open threads and next actions |
| Reuse | portable `/p/` links, "copy a message for another AI" | Self-contained links verified against their content id |
| Compose again | Spaces → collection Pearl, Create | A space becomes one link referencing all its Pearls |

Act III (the transformation demo) lets a visitor run the loop on a sample reply with the product's own code.

## Two modes, one dataset

**Simple** (the default) uses everyday language. **Explore** shows the same objects with their protocol: type, id, digest, blocks, the generated URL, capabilities, the substrate trace. The switch only changes presentation (`html[data-mode]`, `.simple-only` / `.explore-only`). It is stored per browser in `pearls.mode` and applied before first paint.

## Information architecture

- Primary navigation: Discover `/`, My Pearls `/workspace`, Spaces `/spaces`, Create `/create`, Explore `/explore`.
- The research surface stays one tap away (Research, AI Lab, Verify, About in the mobile menu and the footer) and keeps its own dark theme under `src/app/(research)/`. The former homepage now lives at `/explore`.
- For AI: `/llms.txt`, `/ai.txt`, `/.well-known/ai`, `/capabilities.json`, `/research.json`, `/compose`.

## Principles

1. **Only real operations.** The capability registry lists what runs here and is tested. Julia is listed as not available, not imitated.
2. **Honest storage.** "Kept" means kept in this browser, and the UI says so. Shared links wait for a store the owner connects (see `docs/architecture/FUTURE_PERSISTENCE.md`).
3. **Assertions are labelled as assertions.** A Pearl says who made it; the site never claims to verify identity or truth, only content (by hash).
4. **No forms that pretend.** No signup, no passwords, no fake accounts.
5. **Warm, legible, accessible.** A light paper theme for the product, dark for the research surface, WCAG 2.1 AA checked by axe on every page.

## Next (proposed, not built)

- Publishing to a shared store, so `/p/{id}` short links work across devices (adapter built and inactive).
- Accounts and private sharing on Postgres (designed in FUTURE_PERSISTENCE).
- Real cross-provider trials of the first-Pearl prompt, recorded as evidence with transcripts.
