# Product audit — Pearls, 2026-10-08

Source of truth: the repository at `aef3ed8` (branch `ccr-d6dc9f9c-fvwlfi`, deployed to https://aanebed.vercel.app as Vercel deployment `dpl_9xNsJdxSjjKvCM3H1kQ38Hvwxo4o`) and the live site.

## Works today (implemented and tested)

| Area | Where | Evidence |
|---|---|---|
| Pearl grammar experience/1 (+ numbered b1…, `s=` with `\n`, `type=`) | `src/lib/experience.ts` | 67 unit tests; live smoke 21/21 |
| Pearl model: types, canonical form, id `p_…`, serializer, portable `/p/{id}.{payload}` | `src/lib/pearl/*` | `tests/unit/pearl.test.ts` |
| Resolver (paste → typed status), Bring your Pearl | `src/lib/pearl/resolve.ts`, `src/components/pearl/BringPearl.tsx` | unit + browser tests |
| Browser-local workspace: library, spaces, projects, notes, tasks, export/import | `src/lib/pearl/workspace.ts`, `/workspace` | unit + browser tests |
| Prompt Laboratory (7 prompts) | `/prompts` | browser test |
| `/x` bounded ECA resolver (parity with substrateIO) | `src/lib/address.ts` | 12 reference vectors |
| Machine surface: llms.txt, ai.txt, /.well-known/ai, research.json, schemas | `src/lib/manifest.ts` | ingress harness 12/12 (1 skipped), 26/26 checks |
| Research topology, evidence, verify, press, broadcast, about | `src/content/*` | browser tests (axe WCAG 2.1 AA) |

## Incomplete or only proposed

- **Durable, multi-user storage: none.** The Vercel project has no environment variables and no connected store (checked through the Vercel API: `envs: []`). A Supabase marketplace integration is installed on the account, but it is not connected to this project, and this phase deliberately does not use it.
- **Continuity brain (`/c`)**: implemented and tested against PostgreSQL, but inactive (no store). POST /c returns 503.
- **Accounts: none.** No identity provider.
- **Julia / external compute: none.** No Julia runtime in the repository or the deployment. The only executing computation is the `/x` ECA registry (JavaScript, deterministic, bounded).
- **Fresh-session AI test**: one real Claude session's report exists (E-013). No controlled cross-provider test has been run.
- `FINAL_REPORT.md` from the previous phase was not written; it is replaced by this phase's report.

## Must be preserved

The research topology and evidence records; the `/e` grammar and every previously valid link; `/x` parity; the continuity-brain code and its SQL; the machine-readable surface; the local workspace data format (`pearls.workspace.v1`, `pearl-export` v1).

## Design debt

The product surface reads as a dark laboratory notebook: tiny mono labels, technical nav (Research, AI Lab, Verify), protocol vocabulary on the first screen. That suits research and Explore views, not a first-time visitor.

## Decisions for this phase

1. Warm product surface (ivory, ink, one primary accent) for product pages; the dark editorial theme stays for research and Explore.
2. Simple | Explore as one global presentation mode over the same data (CSS-level progressive disclosure; no second data model).
3. Navigation by intent: Discover, My Pearls, Spaces, Create, Explore.
4. One reusable experience model (`src/content/experiences.ts`) drives Create; each experience produces a real Pearl through the existing serializer.
5. A typed capability registry over real, pure operations only.
6. A server Pearl repository adapter behind the existing interfaces, inactive until a store is connected. Documented, never faked.
