# Test matrix — recorded 2026-10-08

Environment: clean Linux container, Node.js 22.22.0, Chromium (Playwright 1.56.1),
PostgreSQL 16.15. Server: `next build` + `next start` (production mode) with
`CONTINUITY_STORE=memory`.

| Layer | Command | Result |
|---|---|---|
| Unit | `npm test` | 45 tests pass: resolver vs substrateIO vectors (12/12), canonical JSON + SHA-256 vs node:crypto, manifest vs its JSON Schema, evidence integrity, grammar (tolerance, injection, unsafe links, bidi, bounds), continuity model and memory store, Golden Surface sync rules |
| SQL | `CB_TEST_PG='-h /tmp -p 54329 -U postgres -d cbtest' npm test` | Same continuity scenario passes against the real migration: atomic append, idempotency, append-only trigger, anon denied, forget by owner key, JS-verified SQL hash chain |
| Browser | `NO_SERVER=1 npx playwright test` | 76 pass, 4 skipped by design (device-specific). 13 pages × desktop + mobile: one h1, landmarks, machine layer, no console errors, axe WCAG 2.1 A/AA = 0 violations; no horizontal overflow at 412 px; skip link and keyboard navigation; constellation focusable; mobile list instead of diagram; navigation and disclosures without JavaScript; reduced motion; deep links; 404; first-interaction trace; address console; Human ↔ AI-CI demo; Golden Surface model; **the three links end to end** |
| AI ingress | `npm run test:ingress` | 12/12 questions, 29/29 checks. See `ingress-results.json` |

## AI-ingress questions (a client given only `https://abedkadaan.com`)

1–9: discovery, machine interface, topology, experiments, claims vs evidence,
repositories, AI-CI, permissions plus one verified computation, summary without
hidden context.
10: the offer to compose is in the root page's **static visible text**.
11: a URL filled in from the documented template renders, and `/e.json` reports it valid with 0 warnings.
12: a person's click keeps it, three sessions write in turn, a repeated write
is recorded once, a returning session sees what changed, a thread opened by one
session is closed by another, and the hash chain verifies.

## Not established

- Whether ChatGPT, Gemini, Claude, Perplexity or Copilot, given only the plain
  URL, will take stock of the conversation and compose a link without being
  asked (research claim C-18, open).
- Whether their browsing tools may open a constructed write link. Some can only
  open links the user pasted; for those, the person clicks.
- The PostgREST transport against a hosted Supabase project. The SQL was tested
  on plain PostgreSQL with Supabase's roles created by hand.
