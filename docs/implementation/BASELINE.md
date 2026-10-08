# Baseline — 2026-10-08, before Project Pearl

## Repository

- `akadaan310/aanebed`, single branch `ccr-d6dc9f9c-fvwlfi` (also the remote HEAD; the Vercel project deploys it). Clean working tree at `66e5025`.
- Next.js 16.3.8 (App Router), React 19.2, TypeScript 5.9, Tailwind CSS 4. No runtime dependencies beyond Next/React.
- Scripts: `test` (= `test:unit`, node:test via tsx), `test:browser` (Playwright), `test:ingress` (deterministic AI-ingress harness).

## Implementation found

| Surface | Where | Notes |
|---|---|---|
| `/e` | `src/app/e/page.tsx` → `src/lib/experience.ts` `parseExperience` | experience/1 grammar: `title`, `by`, `session`, `for`, repeated `b=`, `s=` lines; 8,000-char and 40-block limits confirmed in code |
| `/e.json` | `src/app/e.json/route.ts` | same parser; `view` link hard-coded to `https://abedkadaan.com` |
| `/compose` | `src/app/compose/page.tsx`, `src/components/Composer.tsx` | composer emitted repeated `b=` |
| `/c/[code]`, `/c/[code]/w`, `/json`, `/verify`, `/forget`, `POST /c` | `src/app/c/**`, `src/lib/continuity/*` | continuity brain; needs Supabase env vars; **none configured on Vercel**, so `POST /c` returns 503 |
| `/x` | `src/app/x/[[...path]]/route.ts`, `src/lib/address.ts` | bounded ECA resolver, parity-tested against substrateIO |
| `/research.json`, `/llms.txt`, `/ai.txt`, `/.well-known/ai`, `/verify/ingress.json` | route handlers built from `src/content/*` via `src/lib/manifest.ts` | every absolute URL derived from `SITE.origin = "https://abedkadaan.com"` |
| ingress harness | `scripts/ingress.ts` | origin hard-coded to abedkadaan.com |

Tests at baseline: 45 unit tests pass; `next build` succeeds; the browser matrix (76) had passed in the previous session.

## Defects, reproduced against https://aanebed.vercel.app

| Report (E-013) | What was actually found (E-014) |
|---|---|
| abedkadaan.com 404s while llms.txt points there | Confirmed: abedkadaan.com serves `/` but returns 404 for `/compose`, `/e.json`, `/llms.txt`. Every machine file, AI prompt, copy button and the research manifest pointed at it. |
| Repeated `b=` collapse in `/e.json` | **Not a server defect.** `curl` of the exact reported 12-block link returns all 12 blocks in order. The collapse reproduces through a client that sorts keys and keeps one value per key (12 → 1). Two further causes found: a raw `#` in text cuts every later block before the server sees it; a bare `&` in text splits a block. |
| `s=` returns 422 for 3 lines | `s=` with `%0A` returns 200 and 3 blocks. A literal `\n` (as models write it) returns 200 but **1 block**. No encoding produced a 422; the most likely cause is a fetcher dropping the `s=` parameter (an empty request is a 422). |

Platform constraint found later: Next.js normalises the query before application code (and before `proxy.ts`): repeated keys are grouped and values re-encoded. The raw query is unavailable server-side, so a bare `&` can only be recovered where the raw text is available (pasting into Bring your Pearl).

## Constraints carried into this phase

No environment variables, no database, no credentials. Existing research pages, evidence taxonomy and `/x` must keep working.
