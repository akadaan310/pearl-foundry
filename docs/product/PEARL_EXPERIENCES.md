# Pearl experiences — the Create catalogue

Every experience makes the same object, a Pearl, with the same grammar. Each is a form over that grammar (`src/content/experiences.ts`, `src/components/pearl/ExperienceBuilder.tsx`), plus a standalone prompt that asks an AI to make the same Pearl. The form re-parses its output with the `/e` parser on every keystroke. `tests/unit/experiences.test.ts` builds every example and requires zero errors and zero warnings.

| Route | Experience | The person's situation | Pearl type | Blocks produced | Research it rests on |
|---|---|---|---|---|---|
| /create/conversation | Conversation Keeper | Keep a conversation you care about. | continuity | ai, human, lex, mem, decision, thread, action | Continuity (ACSP): identity asserted, not proven |
| /create/research | Research Space | Organise your research. | research | p, claim:observed / tested / hypothesis / open, link, action | Evidence taxonomy |
| /create/creative | Creative Studio | Collect ideas for a creative project. | project | p, list, steps, link, action | Composition |
| /create/recipe | Recipe Space | Build a recipe or a meal plan. | notes | facts, list, steps | Structured blocks |
| /create/study | Study Companion | Carry a study session into another AI. | project | list, p, thread, steps, mem | Continuity across sessions |
| /create/handoff | Project Handoff | Carry a project into another AI. | continuity | said, decision, link, thread, action | Continuity with provenance |
| /create/workflow | Workflow Composer | Create a reusable workflow. | workflow | p, facts, steps, prompt | Declarative; never executed here |
| /create/computation | Computation Explorer | Explore structured computation. | computation | x (four addresses), p | PURL / substrateIO; resolved by `/x` and checked by hash |

## What each experience can and cannot do

- **Implemented and tested:** building, validating, previewing, keeping (browser-local), copying the readable and portable links, exporting, and opening the Pearl at `/e` or `/p/…`. The computation Pearl is actually computed by the `/x` registry.
- **Descriptive only:** workflow and prompt Pearls are rendered, never executed.
- **Not tested:** whether any particular AI, given the "ask your AI" prompt, produces a valid Pearl. The prompts are written to be standalone. The only real cross-model evidence is the owner-supplied Claude report (E-013, `tests/fixtures/claude-2026-10-08.url`). No other provider was tested in this phase.

## Spaces as composition

`/spaces` holds Pearls that belong together, with suggested starting spaces (My Life, Creative Studio, Cooking, Study, Work). A space can be:

- renamed;
- exported as a `pearl-export` file;
- imported, with every Pearl re-hashed against its id;
- deleted, which moves its contents to Archive;
- composed into a **collection Pearl** (`src/lib/pearl/collection.ts`): one link of `pearl:` references to each member's portable link. Members that would exceed the grammar's limits (1,500 characters per block, 40 blocks, 8,000-character URL) are left out and named; they are never truncated. A collection is a set of references, not copies, and is never expanded recursively.
