# Pearl Foundry — clone your AI, take its DNA URL anywhere

> **Start here: [FOUNDRY.md](./FOUNDRY.md)** — what this is, the product thesis, the page map, how to run, how to point at a substrate, what's real vs proposed.

The foundry that mints Pearls. Research by Abed Kadaan, Agency TM. Future home of abedkadaan.com.

Grown from the aanebed V6 surface — rebranded and extended, never rebuilt. The V6 docs under `docs/` are preserved as history.

---

# abedkadaan.com — give your AI an ID and a life

The public research surface of Abed Kadaan, and an experiment in **AI-CI**
(Artificial Intelligence ↔ Computer Interaction): one web surface that people
and machine intelligence can both read, enter and operate.

## Pearls — programmable URLs for AI

> Your AI can create a Pearl. Bring it here. Open it, inspect it, save it, and take it to another AI.

A Pearl is a validated document carried entirely by a URL: a continuity checkpoint, a project handoff,
research, a reusable prompt or workflow, a computation, or a collection.

1. **Ask.** Copy a prompt from `/prompts` into any AI. It composes a link:
   `https://aanebed.vercel.app/e?type=continuity&title=…&b1=ai:…&b2=human:…`.
2. **Bring.** Paste the link, or the whole message it came in, into *Bring your Pearl* on the home page.
   It is parsed in the browser (nothing is sent or fetched), given a content id (`p_…`), and explained.
3. **Keep.** Save it to *My Pearls* (`/workspace`): a library, spaces, projects, notes and tasks
   **stored in this browser only**, with validated export and import.
4. **Carry.** Copy a portable link (`/p/{id}.{payload}`, compressed and self-contained) and give it to
   another AI. When it composes an updated Pearl, bring that back: both versions are kept.

The protocol (types, grammar, canonical form, id, resolver, limits, trust boundaries) is in
`docs/architecture/PEARL_PROTOCOL.md`; the path to shared storage in `docs/architecture/FUTURE_PERSISTENCE.md`.
The origin is configured in one place: `src/config/origin.ts` (`https://aanebed.vercel.app`).

## Built on the research

| | |
|---|---|
| **ACSP** (Continuity) | The brain is ACSP's continuity resource, redesigned as `ACSP-CB/0.1`: append-only events, entries attributed to the session that wrote them, continuity ≠ identity. |
| **PURL** | Every view is an address: `/c/{code}`, `?session=` (what's new since you last wrote), `?at=N` (state at a version), `/json`, `/verify` (replay the hash chain). |
| **substrateIO** | The sequence of writing sessions is recorded as transitions and shown as observed, not interpreted. `/x` reimplements substrateIO's computational addresses and matches its Python resolver hash-for-hash. |

**Deliberate deviation:** writes arrive as GET (`/c/{code}/w?…`), because AI
browsing tools can generally only GET. Writes are idempotent by content hash and
append-only, so a repeated, prefetched or unfurled GET cannot write twice or
erase anything.

## Run

```bash
npm ci
npm run dev                                  # memory store in development
npm test                                     # unit tests (resolver, manifest, grammar, continuity)
npm run build && CONTINUITY_STORE=memory npm start -- -p 3100
BASE_URL=http://localhost:3100 npm run test:ingress     # the AI-ingress simulation (writes verification/ingress-results.json)
npm run test:smoke                                      # live-origin smoke test against https://aanebed.vercel.app
NO_SERVER=1 npx playwright test                         # browser matrix (desktop + mobile, axe, keyboard, no-JS…)
```

## Deploy

Pushing to `ccr-d6dc9f9c-fvwlfi` redeploys the Vercel project. No environment variables are needed.

### Optional, not enabled: continuity-brain storage (Supabase)

1. Create a Supabase project. Apply `supabase/migrations/0001_continuity_brain.sql`
   (`supabase db push`, or paste it into the SQL editor). It creates two tables
   with row-level security enabled and no policies, an append-only trigger, and
   four `cb_*` functions callable only by the service role.
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Vercel (see `.env.example`).
   The site calls the functions through PostgREST with `fetch`; there is no client library.
3. Without those variables, production renders everything else and says that
   keeping is not switched on. It never pretends to remember.

## Layout

```
src/content/        typed records: research nodes, relations, claims, evidence, experiments, the AI offer
src/lib/            address.ts (/x resolver) · experience.ts (URL grammar) · continuity/ (model, store, requests)
                    canonical.ts (canonical JSON + SHA-256, isomorphic) · manifest.ts (llms.txt, ai.txt, manifests)
src/app/            pages; /e, /c/[code] (+ /w, /json, /verify, /forget), /x, machine files
supabase/           the migration
scripts/ingress.ts  a deterministic client given only the root URL
tests/              unit (node:test) and browser (Playwright + axe)
verification/       substrateIO reference vectors, ingress results, the test matrix
```

See `verification/TEST-MATRIX.md` for what has been tested and what has not.
