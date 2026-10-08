# Pearl protocol (pearl/1)

A **Pearl** is a validated document carried by a URL. It is not a memory, not a credential, and not a program this site executes (except computations, below).

## Types

| Type | What this site does | Support |
|---|---|---|
| experience | renders the page | implemented |
| continuity | renders Context, Vocabulary, Decisions, Open threads, Next actions, Provenance | implemented |
| research | renders claims with their *asserted* status | implemented (claims unverified) |
| computation | resolves every `x:` address through the bounded `/x` registry and shows its value hash | implemented |
| collection | renders links to other Pearls on this site; never expanded recursively. Spaces compose one (`src/lib/pearl/collection.ts`) | implemented |
| project | renders goal, decisions, open threads, next actions, resources and referenced Pearls | implemented |
| notes | renders notes and lists: recipes, study notes, ideas | implemented |
| prompt | renders prompts with copy buttons; never runs them | descriptive |
| workflow | renders declarative steps and prompts; never executes them | descriptive |

`type=` is optional; without it the type is inferred (continuity entries → continuity; claims → research; …). An unknown `type=` is ignored with a warning, so old links never change meaning.

## URL grammar (experience/1, extended compatibly)

```
https://aanebed.vercel.app/e?type=<type>&title=<t>&by=<model>&session=<label>&for=<who>&b1=<kind>:<text>&b2=…
```

Block carriers, joined in this order: numbered `b1…b999` (sorted by index), then repeated `b=`/`block=`, then `s=` (one block per line; lines split on a real newline, `%0A`, or the two characters `\n`). Numbered blocks are recommended: they survive fetchers that sort or de-duplicate keys.

Continuity kinds: `ai human nick lex nuance mem said decision thread close action`. Display kinds: `h p note quote list steps facts table flow code x research link prompt claim pearl`. Grammar and examples: `/compose`.

Limits: 8,000 characters, 40 blocks, 1,500 characters per block, 140-character titles. Text is cleaned (control and bidi-override characters removed, whitespace collapsed). Values that still contain `%XX` after URL decoding are decoded once more (tolerance for double-encoding by models); a literal `%41` in text therefore reads as `A`.

## Canonical form and id

```
pearl     = { format: "pearl/1", type, title, by, for, session, blocks }   (after parsing)
canonical = JSON with sorted keys, no spaces, non-ASCII escaped as \uXXXX  (src/lib/canonical.ts; matches Python json.dumps(sort_keys=True, separators=(",",":"), ensure_ascii=True))
digest    = SHA-256(canonical), 64 hex
id        = "p_" + first 80 bits of digest in lower-case Crockford base32 (16 chars)
```

The full digest is always stored and compared; the short id is for display and links. Two Pearls with the same 80-bit prefix and different digests are reported as a conflict, never merged. An edit produces a new id; the workspace records `derivedFrom`.

**The id is content addressing.** It establishes integrity (the content is what the id names), not authorship, authorisation, authenticity or truth.

## Serialisation

`src/lib/pearl/serialize.ts`: parameters in the order `type, title, by, session, for, b1…`; values `encodeURIComponent`-encoded, then made readable (`+` for spaces; `: | > = , / ; @ ! ' ( ) * ~` literal); `& # + %` and non-ASCII stay encoded. Round trip guarantee (tested): `parse(serialize(p)) == p`.

## Portable links

`/p/{id}.{payload}`, payload = base64url(deflate-raw(canonical query string)). Opening one inflates it (max 64 KiB; token max 12,000 chars), parses it with the same validator as `/e`, recomputes the id and refuses to show content that does not hash to the id in the link. `/p/{id}` with no payload is only resolvable from the current browser's library; otherwise it is shown as **unavailable** (a content id cannot recover its content).

## Resolver

`src/lib/pearl/resolve.ts` `resolvePearl(input, localLookup?)`. Pure: no network, no redirects, no execution. Accepts a URL, a message containing one Pearl URL (Markdown punctuation stripped; two different Pearls → ambiguous), a bare `/e?…` or `?…`, Pearl lines (`h: …`), or a pasted Pearl record (JSON). In pasted links a raw `#` is read as text and a bare `&` is kept inside the block. Statuses: `valid, local, unavailable, unsupported, external, malformed, invalid, empty`.

## Storage classes

| Class | Where | Status |
|---|---|---|
| in the link (`/e`, `/p/…`) | the URL | PORTABLE |
| browser library | `localStorage["pearls.workspace.v1"]` | LOCAL |
| shared server store | — | not implemented (see FUTURE_PERSISTENCE.md) |

## Export / import

`pearl-export` version 1 (`/schemas/pearl-export.schema.json`); Pearl records `/schemas/pearl.schema.json`. Import re-parses each Pearl, recomputes digest and id, rejects mismatches, reports duplicates and conflicts, previews, and applies only on confirmation, in one write. Other major versions are refused.

## Trust boundaries and security

Everything renders as text. Links must be https; `javascript:`, `data:` and credentials are dropped. `pearl:` links must point at this site. The server never fetches user-supplied URLs. `by`/`session` are recorded as asserted. Pearls are portable and get copied and logged: never put secrets in them. Machine-facing instructions (`/llms.txt`, `/ai.txt`, `/.well-known/ai`, the home page) are visible to humans and subordinate to the reader's user and operator.

## Compatibility

Links valid before this phase (repeated `b=`, `s=` with `%0A`) parse identically; new forms are additive. The continuity brain (`/c/…`) remains in code and is reported as unavailable where no store is configured.

## Capabilities

Operations the site performs by URL are listed in `/capabilities.json` (human view: `/capabilities`), generated from `src/lib/capabilities.ts`. Every entry is a pure GET with no side effects, no authentication, no network access and no evaluation of submitted code, and is covered by `tests/unit/capabilities.test.ts`:

| id | URL | engine |
|---|---|---|
| pearl.check | `/e.json?{query}` | javascript |
| pearl.decode | `/api/v1/pearl/decode?u=/p/{id}.{payload}` (payload re-hashed against the id) | javascript |
| hash.sha256 | `/api/v1/hash?text=` (≤ 10,000 chars) | javascript |
| text.transform | `/api/v1/text/{normalize\|slug\|count}?text=` | javascript |
| compute.eca | `/x/map/eca/…` | javascript, parity-tested against substrateIO |

Engines: only `javascript` is active. `julia` is listed as **not available**; a future engine implements the `ComputeEngine` interface behind a named, bounded capability. Nothing is substituted for it. The `/api/v1/*` routes share the rate limiter (120 requests per window per IP, best-effort per instance).

## Experiences

The Create catalogue (`src/content/experiences.ts`, see `docs/product/PEARL_EXPERIENCES.md`) is a set of forms over this grammar. Each form re-parses its output with the same parser `/e` uses on every keystroke; a unit test builds every example and requires zero errors and zero warnings.

## v2 additions (Pearls v2, the living surface)

Backward compatible: every v1 Pearl renders unchanged and keeps its id. A test pins the owner's Claude Pearl at `p_rg86c59j7jmqp0w1`.

- **`from=`** (optional): the parent Pearl id, set by FORK and REMIX. It is validated against the id pattern; an invalid value is ignored with a warning. It is part of the canonical form **only when present**, so ids of Pearls without it are unchanged. It is lineage as asserted, not authorship.
- **`choice:` block:** `choice:Question|Label>target|Label>target` (up to 6 options). Every target must be on this site (`/e`, `/p`, `/x`, `/live`, `/c`). A `|` inside an unencoded `/e` target is re-joined to that target. Choosing never changes the Pearl; each option is a link to another addressed object.
- **Empty experiences:** a title with no blocks is valid but warns that there is nothing to experience yet.
- **Living record (`living/1`):** `livingPearl()` and `livingAddress()` in `src/lib/living/` build identity, type, state, affordances (only legal ones; address-producing ones carry the next address), history, parent, related objects, evidence rows (computed / checked / recorded / asserted / external / cannot be established) and a generated explanation. The same record is in `/e.json` (`living`), at `/api/v1/living`, and in each page's substrate layer.
- **Commands:** `src/lib/living/commands.ts` is the single table of verbs, keys and the capability each uses. It is published in `/capabilities.json` under `commands`.
- **New capabilities:** `pearl.fork`, `pearl.diff`, `living.describe`. All are pure GETs.
- **New routes:**
  - `/live/{address}`: the browser URL is the computational address;
  - `/compare`;
  - `/play`: the Seven Verbs and the shared surface, both simulated.

See `docs/architecture/PEARLS_V2.md` for the design.
