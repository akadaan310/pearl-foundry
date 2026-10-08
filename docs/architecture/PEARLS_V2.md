# Pearls v2 — the Living Programmable Surface (design report)

Status: design, written before implementation (2026-10-08). The implementation section at the end records what was built against this design.

The question this version answers:

> What becomes possible when the URL is allowed to be the address of an object, its program, its state, and its next move?

v1.1.0 already has the primitives. It presents them as documents. v2 makes them **phenomena**: objects that show their state, expose their legal moves, and change address when they change state. The research substrate, the nomenclature, the evidence model and every existing Pearl stay as they are.

---

## 1. What already exists (v1.1.0)

| Primitive | Where | Property v2 relies on |
|---|---|---|
| Pearl grammar (experience/1, pearl/1) | `src/lib/experience.ts`, `src/lib/pearl/*` | One parser. Canonical JSON, then SHA-256, then `p_` id. Portable `/p/{id}.{payload}`. |
| Computational addresses | `src/lib/address.ts`, `/x` | A pure, bounded, registry-matched resolver. An address is a derivation (`state/5/next/flip/2`), each prefix is itself an address, and every result carries `value_sha256`. The same code runs on the server and in the browser. |
| Capability registry | `src/lib/capabilities.ts`, `/capabilities.json` | Pure GET operations with inputs, outputs, limits and errors. |
| Two layers, one page | `SubstrateLayer` on every page; `/e.json`, `/x` | The machine record and the human page come from one value. |
| Evidence taxonomy | `src/content/site.ts`, `/verify` | observed, implemented, tested, reproduced, proposed, hypothesis, open. Demonstrated, proposed, open. |
| Continuity | continuity block kinds | Asserted identity. A Pearl is not memory. |
| Golden Surface sync model | `src/lib/goldenSync.ts` | newtab, open, closetab, convergence, and divergence classes. |
| Browser-local library and spaces | `src/lib/pearl/workspace.ts` | `derivedFrom` already exists on library records. |

## 2. What is reused unchanged

- `resolve()` and the `/x` JSON response: byte-for-byte. The existing vectors must stay identical.
- The parser for every existing block kind; ids of existing Pearls. A test pins the owner's Claude Pearl id.
- `/verify`, `/research/*`, the evidence records, the ingress protocol.
- The library and spaces model.

## 3. What is extended

1. **Grammar, one optional parameter `from=`:** the parent Pearl's id (`p_…`). Present only on forks and remixes. The canonical form includes `from` *only when present*, so no existing id changes. An invalid value is ignored with a warning.
2. **Grammar, one new block kind `choice:`:** `choice:Question|Label>target|Label>target`. Every target must be a Pearl or computational address on this site (the same rule as `pearl:`). This is the only new display primitive. It lets an experience Pearl offer *transitions* to other addressed objects, so branching stories, small games and guided tours become possible. A choice never executes anything. It is a set of links whose targets are addresses.
3. **Capability registry:** gains `commands`. Every verb the interface offers is listed with its key, the capability it uses, what it applies to, and what it produces. The interface reads this table. There is no second copy.
4. **New pure capabilities:**
   - `pearl.fork`: the derived Pearl, with `from=`;
   - `pearl.diff`: a structural comparison of two Pearls;
   - `living.describe`: the living record for a Pearl link or a computational address.

   All are GET, deterministic and bounded.

## 4. What stays untouched

The research pages and their dark surface, the ingress harness's questions, the continuity brain (still proposed, still 503), the Golden Surface sync model (reused, not modified), and the meaning of every v1 Pearl.

## 5. The living record (state model)

One pure function per subject builds the record that both layers render:

```ts
interface LivingRecord {
  format: "living/1";
  identity: { kind: "pearl" | "address"; id: string; hash: string; address: string }; // id = p_… or the address; hash = Pearl digest or value_sha256
  type: string;                 // Pearl type, or map | state | trace
  state: Record<string, Json>;  // what is true of the object now, derived from its address
  affordances: Affordance[];    // the legal moves only; an illegal move is absent, never disabled
  history: Edge[];              // the derivation (address) or the fork lineage (Pearl), as edges
  parent: string | null;        // the address/id this one was derived from
  related: Related[];           // pearl:, x:, research:, choice targets: separate addressed objects
  evidence: EvidenceRow[];      // what is computed, asserted, checked, and what cannot be established
  explanation: string[];        // generated from the state, not written by hand
  limits: Record<string, Json>;
}
interface Affordance { command: string; label: string; key: string; capability: string; produces: "address" | "pearl" | "view" | "copy" | "local"; href?: string; detail: string }
```

`livingAddress(path)` (`src/lib/living/address.ts`) and `livingPearl(pearl)` (`src/lib/living/pearl.ts`) are pure. The page embeds the record in its substrate layer. `/api/v1/living` and the `living` field of `/e.json` serve the same record. Nothing is persisted on the server. State comes from the URL; a saved Pearl is still the durable, human-owned artifact.

## 6. Command model (the palette)

`/` opens the palette and `?` shows help. Single keys act directly unless focus is in a text field. The palette lists **only** the affordances in the living record, so the palette *is* the affordance map (NAI-CI's first page-reading structure, rendered for a human).

| Command | Key | Capability | Applies to | Produces |
|---|---|---|---|---|
| NEXT | n | `compute.eca` (`substrate.state.next`) | state | address |
| BACK | b | derivation prefix | any address with a parent | address |
| PERTURB (flip a bit) | x | `compute.eca` (`substrate.state.flip`) | state | address |
| TRACE | t | `compute.eca` (`substrate.state.trace`) | state | address |
| ORBIT | o | `compute.eca` (`substrate.state.orbit`) | state | address |
| NORMALIZE | m | `compute.eca` (`substrate.map.state`) | derived state | address (the same value at its shortest address) |
| VERIFY | v | `hash.sha256` / `pearl.check` / `compute.eca` | all | view: the Proof layer |
| INSPECT | i | `living.describe` | all | view: the Substrate layer |
| EXPLAIN | e | `living.describe` | all | view |
| FORK | f | `pearl.fork` | Pearl, address | pearl |
| REMIX | r | Pearl grammar (`/e?…&from=`) | Pearl | pearl |
| COMPARE | = | `pearl.diff` | Pearl | view (`/compare`) |
| CARRY | c | none (clipboard) | Pearl, address | copy: a handoff message |
| CONTINUE | k | none (clipboard) | continuity Pearl | copy: a continuation prompt |
| PROMPT | p | none (clipboard) | Pearl with `prompt:` blocks | copy |
| SAVE | s | browser-local library | Pearl | local (the person's click) |
| COPY ID / COPY LINK | y / l | none | all | copy |
| OPEN … | enter | the target's own route | related objects | address |

The brief's words that are **not** commands, and why:

- TALK and BUILD exist only inside the Seven Verbs mode (§9), where MUSA's url-machine gives them meaning.
- LINK and COLLECT are covered by OPEN and SAVE.
- RUN AS DESCRIPTION is the workflow type's rendering. The site never runs a workflow.

## 7. URL transition model

```
current address ── command ──▶ next address ── resolve() ──▶ new state ── value_sha256
```

- Every computation command produces a URL that is itself a valid computational address. Commands append registry segments, so the derivation (the history) is the address. The 12-operation limit is enforced by the resolver. When the next step would pass it, the command starts from the normal form (`…/state/{x}`) and says so. Nothing is truncated silently.
- On `/live/{address}` the browser URL **is** the address, and commands are real links: they work without JavaScript, BACK is real navigation, and every state can be copied and shared. `/x/{address}` is the same object's machine form.
- On the homepage, the embedded object keeps its address in the fragment (`/#/map/eca/…`), so the visible URL changes as you act, and a reload restores the state.
- A Pearl is immutable. FORK and REMIX navigate to a *new* Pearl (a new portable link with `from=`). The original is never edited.

## 8. Three layers

| SURFACE | SUBSTRATE | PROOF |
|---|---|---|
| What a person sees: the ring of cells, the story, the choices | address → program → state → transition → result; the derivation graph; the living record | Content ids and value hashes, recomputed in the browser and compared with the server; each element's evidence status: computed here, asserted by the composer, checked (hash), or cannot be established |

The toggle is per view (keys 1, 2, 3). Simple | Explore remains the site-wide presentation switch.

## 9. Discovery modes

- **Seven Verbs** (`/play`): MUSA `luna-agent/protocols/url-machine.md` defines START, SWITCH, WRITE, COMMIT, BUILD, TALK and PERTURB, with transitions IDLE → BOUND → WRITING → COMMITTED → BUILT | FAILED. The seurl repository leaves the mechanics unspecified. This site's interpretation:
  - the session's address is a computational address;
  - WRITE drafts typed Pearl block lines (text, never code to execute);
  - COMMIT computes the draft's content id;
  - BUILD runs the real parser (BUILT or FAILED with its errors);
  - TALK routes an envelope `{from, to, op, url, payload, idstamp}` through the harness;
  - PERTURB flips a bit of the session's address (logged and reversible).

  It is labelled an experimental interaction grammar, not a programming language. C-12 stays HYPOTHESIS.
- **Shared surface:** Golden Surface's vocabulary (newtab, open, read, shot, tap, type, closetab) runs on a local simulated surface. Participants, tab ownership and authority are visible. An operation outside a participant's authority is refused and logged. `type` never accepts a credential, and the simulation has no password fields at all. Convergence uses the existing sync model's rule, hash(structural(T)) = hash(structural(P)). Nothing leaves the browser.

## 10. Visual system

- The light paper surface stays. A Living object is drawn as a **pearl**: the cells of an ECA ring sit on a circle, with depth from a soft radial highlight. Turning the pearl, which is the transition, is a short rotation and fade.
- The address bar is a first-class element. A transition animates the old address, the operation and the new address in mono type, and each part is a real link.
- The palette is a centred sheet: large type, the key on the right, grouped by intent (Change it / Understand it / Make it yours / Carry it).
- Motion respects `prefers-reduced-motion`. Every command has a visible label and a key, and the interface works without a pointer.

## 11. Safety boundaries (unchanged, restated)

- No `eval`, no visitor-supplied code, and no outbound requests from capabilities.
- Commands map only to registered, pure operations or to the person's own clicks: copy, and save to their browser.
- No credentials, no hidden persistence, no silent external actions.
- Hashes establish *content identity*, never authorship or truth: identity ≠ authorship.

---

## Implementation record (2026-10-08)

### Built

| Design item | Where |
|---|---|
| Living record, commands, affordances | `src/lib/living/{record,commands,address,pearl}.ts` |
| FORK, REMIX, COMPARE | `forkPearl` in `src/lib/living/pearl.ts`, `src/lib/living/diff.ts`, `RemixPanel`, `/compare`, `/api/v1/pearl/{fork,diff}` |
| `from=` and `choice:` | `src/lib/experience.ts`, `src/lib/pearl/{model,serialize}.ts`, `public/schemas/pearl.schema.json` |
| Command palette, shortcuts, layers | `src/components/living/{CommandPalette,parts}.tsx` |
| Living computation | `src/components/living/LivingAddress.tsx`, `/live/{address}`, the homepage hero (`/#/map/…`) |
| Living Pearl | `src/components/living/{LivingPearl,PearlSubstrate,PearlWorld}.tsx` on `/e` and `/p` |
| Seven Verbs, shared surface | `src/lib/living/{sevenVerbs,surface}.ts`, `/play` |
| Machine surface | `/api/v1/living`, `/e.json` → `living`, `/capabilities.json` → `commands`, `/.well-known/ai` → `living`, `llms.txt` |
| AI-generated experience mode | `ALIVE_PROMPT` (Prompt Laboratory #7, homepage), `LIVING_EXAMPLE` |

### Tested

- `tests/unit/living.test.ts` (14 tests) and `play.test.ts` (3 tests).
- The v2 browser journeys in `tests/browser/site.spec.ts`:
  - the §44 design test;
  - keyboard navigation on `/live`;
  - illegal commands absent;
  - no-JS links;
  - VERIFY, REMIX and COMPARE, with the original unchanged;
  - `/play`;
  - machine surface = human surface;
  - axe on every new page.
- Smoke: 38 checks.

Evidence: E-016 (TESTED), claim C-23. The §44 question of whether a *first-time person* discovers the transition within 90 seconds is recorded as C-24, a HYPOTHESIS. No user study was run.

### Deliberately not built

- A general command language, or any operation outside the registry.
- Server persistence of history. History is the derivation (addresses) or `from=` lineage (Pearls), plus the browser-local library.
- A chatbot behind EXPLAIN. Explanations are generated from the structured state.
