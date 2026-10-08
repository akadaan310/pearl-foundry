# Pearl Foundry

**The foundry that mints Pearls.** Clone your AI, take its DNA URL anywhere.

Research by Abed Kadaan, Agency TM. Future home of abedkadaan.com.

## The product thesis

We are the first ones who can clone an AI. Not its weights — its *self*: vocabulary,
temperament, memories, sayings, decisions, boundaries, open threads. The clone flow is
paste-in, paste-out plain text, so it works on every provider (ChatGPT, Claude, Google AI
Mode, Perplexity, local Ollama models) with no URL fetching and no account.

The mint produces a **genome**: a continuity Pearl whose blocks are the AI's phenotypes,
with a timestamp block (mint date — a genome without a date breaks continuity judgment),
portable as a **DNA URL** (`/p/{id}.{payload}`). The DNA URL *is* the sign-in: save it,
take it anywhere, paste it into any AI to continue. No password, no purchase, free.

Four load-bearing honesty rules (from a live simulation test, 2026-10-08):

1. The clone prompt demands **disagreement tone** (how the AI pushes back when you're dug
   in), **emotional register** (frustration vs curiosity), and **at least 3 "never"
   boundaries** — one boundary is not a real clone.
2. Every genome carries a **timestamp block**. Snapshots without dates can't be reasoned about.
3. A genome is a **snapshot, not a living thing** — drift starts at minting. "Update my
   genome" (re-mint with `from=<parent id>`) is a first-class action; lineage stays visible.
4. Genomes are **self-declared**. The UI never presents a DNA URL as verified identity.
   Signed-genome verification is a substrate roadmap item; the seam is open, not built.

## Page map

| Route | What it is |
|---|---|
| `/` | Hero: **Clone your AI** (the 4-step flow) → Try-it-on matrix → Everyday use cases → Business use cases (real worked Pearls) → Live demos → Open source / local models → GEO teaser → the make/bring-back loop → the park → downstairs |
| `/geo` | GEO thesis: the recommendation market built on provenance, not ads |
| `/recommendations.json` | Machine-readable, human-signed recommendations, each with its evidence Pearl |
| `/garden` | Your Pearls as a constellation (browser trail) |
| `/g/ttt` | Noughts and crosses where the URL is the whole game |
| `/live/…`, `/x/…` | Computational addresses (the tiny world, clock, loom) |
| `/create`, `/workspace`, `/spaces` | Make, keep, organize |
| `/report` | A report becomes a Pearl |
| `/developers` | Substrate connection status |
| `/api/substrate/status` | `not_configured` / `unreachable` / `connected` — never leaks the base URL |
| `/api/foundry/state` | Named genome states → substrate `state.keep` when `PEARL_API_KEY` is set, else honestly browser-local |
| `/llms.txt`, `/ai.txt`, `/.well-known/ai`, `/capabilities.json`, `/research.json` | Machine interface |
| `/how`, `/research`, `/verify`, `/about`, `/press`, `/compose`, `/e`, `/p/…` | Kept from V6, working |

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run verify     # typecheck + unit tests + build
```

## Point it at a substrate (optional — the site works with zero env vars)

The origin self-resolves and DNA URLs are stamped with the actual deployment
origin at mint time, so no configuration is needed to deploy. These two only
light up the live substrate connection:

```bash
# .env.local (server-only; never commit)
PEARL_SUBSTRATE_URL=https://your-substrate.example.com
PEARL_API_KEY=<a server-held bearer token>   # optional: enables substrate-backed states
```

- `PEARL_SUBSTRATE_URL` must be `https:` (or localhost `http:`). The status page reports
  `connected` with the live `/health`, `/.well-known/ai`, and `/capabilities.json`.
- `PEARL_API_KEY`: register a service actor against the substrate
  (`POST /api/v1/auth/ai/register`), grant it `state.keep`, and hold the token here.
  Without it, named states are kept in the browser and the UI says so.
- Without any substrate, everything still works: a Pearl lives in its URL.

## What's real vs proposed

**Real:** the Pearl grammar + parser + canonical hash + `p_` ids; portable DNA URLs with
hash re-verification; `/x` bounded computation; the game, clock, loom, tiny world;
genome composition + checklist + re-mint lineage; browser-local states; the substrate
adapter + status; `compute.run` and `state.keep` on the substrate (v0.3.0); the GEO feed.

**Proposed (labeled as such in the UI):** human accounts / magic-link sign-in ("Keep across
devices" says why); signed-genome verification; substrate-backed tickets and continuity
carry/restore; the V4 contract document.

## Lineage

Grown from the aanebed V6 surface ("Pearls V6: the human surface") — rebranded and
extended, never rebuilt. The V6 docs under `docs/` are preserved as history.
