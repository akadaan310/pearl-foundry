# What V6 needs from the Pearl Runtime Substrate

Written for Muse and the substrate repository (`akadaan310/pearl-substrate`, read at `e79edac`). Every gap below was found by reading that repository; nothing was probed on the VMs, and no endpoint is assumed to exist that is not in `api/routes.py`. The consumer surface works without any of these: a Pearl lives in its URL. Each gap names the smallest contract that would let V6 use the substrate, and what the frontend already does at that boundary.

## G1. Public reachability (blocks everything server-side)

**Today:** the API binds `127.0.0.1:8477`; the OCI security list allows only SSH (`deploy/NOTES.md`). There is no public hostname (`ARCHITECTURE.md` §18).

**Needed:** an HTTPS origin reachable from Vercel's servers (a domain with TLS in front of `:8477`, or a tunnel product), serving at least `/health`, `/.well-known/ai`, `/capabilities.json`, `/openapi.json` and `/api/v1/*`.

**Frontend boundary (built):** set `PEARL_SUBSTRATE_URL` (server-only) on the Vercel project. `src/lib/substrate/status.ts` refuses plain `http` to non-local hosts. `/api/substrate/status` and `/developers` then report `connected` / `unreachable` / `not_configured`, and never echo the URL.

## G2. One block schema (a Pearl must mean the same thing on both sides)

**Today:** the canonicalizer and ids agree byte-for-byte (`tests/test_parity.py`), but `pearlcore/validate.py` models blocks differently from the live grammar. Running the substrate's own `validate_pearl(strict=True)` on site Pearls:

| Site Pearl | Substrate verdict | Cause |
|---|---|---|
| owner's Claude Pearl `p_rg86c59j7jmqp0w1` | rejected | continuity entries are `{type:"c", kind, key?, text}` on the site; the substrate expects `{type:"ai", text}` etc. |
| living experience `p_482ex07xv7wstszd` | rejected | `x` is `{type:"x", address}` (site) vs `{type:"x", text}`; `research` is `{id}` vs `{text}`; `choice` (V2) unknown |
| plain h/p/list Pearl | **valid, same id** | identical shapes |

Also absent on the substrate side: `flow`, `choice`, the optional top-level `from`, and `pearl`/`link`/`claim` field names (`href`, `label`, `host`, `status`).

**Needed (pick one, decided by the substrate owner):**

- (a) adopt the site's block shapes in `validate.py` (they are documented in `docs/architecture/PEARL_PROTOCOL.md` and `public/schemas/pearl.schema.json`). This keeps every existing link's id; or
- (b) publish a versioned mapping that both sides apply *before* hashing.

Converting silently would change ids. The frontend refuses to do it.

**Frontend boundary (built):** `src/lib/substrate/compat.ts` mirrors `validate.py` and reports exactly which blocks would be rejected. Its verdicts are tested against the real Python run above (`tests/unit/substrate.test.ts`).

## G3. Human sign-in in production ("Keep across devices")

**Today:** only `POST /api/v1/auth/human/dev-login` exists, refused in production unless `PEARL_ALLOW_DEV_LOGIN=1`; magic-link `send` raises `NotImplementedError` (§4).

**Needed:** a production `HumanAuthProvider`: `POST /api/v1/auth/human/link {email}` → 202, and `POST /api/v1/auth/human/redeem {token}` → `{human_id, token}`, with an email provider configured on the substrate. It must not use passwords.

**Frontend boundary:** V6 offers no sign-up. "Keep" stores in the browser; `/garden` says the substrate that would remember a person across devices is not connected. When G1 and G3 exist, Keep can offer "Keep it everywhere" through a server route holding the session in an httpOnly cookie, never in browser JavaScript.

## G4. Anonymous public reads (works in code; the published contract says otherwise)

**Today:** `pearls_read` resolves the caller with `actor()` (anonymous allowed, not `need_actor()`), and `can_read_pearl` returns true for `visibility = public`. So anonymous `GET /api/v1/pearls/{id}` of a public Pearl works in code. The route is registered with `auth=True`, though, so `/openapi.json` tells clients a bearer is required.

**Needed:** mark the route as optionally authenticated in the OpenAPI output, so that machine readers (and this frontend) can rely on public reads. Once G1 exists, `/p/{id}` (an id without a payload) can resolve public Pearls on any device: the "durable short link" in `docs/architecture/FUTURE_PERSISTENCE.md`.

## G5. AI identity over HTTP for an AI holding only a URL

**Today:** register / authenticate / return exist and are honest about uncertainty. An AI that receives a Pearl URL in a chat, though, typically can only GET. The return protocol is POST, and the Ed25519 challenge route is Phase 3 (§5).

**Needed, for V6's "Claude is back":** a GET-reachable way for an AI to *present* a credential with its contribution. Two options:

- (a) a signed move: `?sig=` over the new URL, verifiable by `GET /api/v1/auth/ai/verify?url=…&sig=…`; or
- (b) a substrate-issued continuation URL per registered AI.

**Frontend boundary:** names in game moves (`/g/ttt/4~claude`) and `by=` are shown as *self-declared*, everywhere, and are never upgraded to "verified". When the substrate can verify, the UI has one place to show it: the lineage chip.

## G6. Shared continuity, tickets, experiences

**Today:** `continuity.carry/restore`, `ticket.*`, `experience.*` and `diagnose.*` are PROPOSED/DEFERRED (§7).

**Frontend boundary:**

- **Continuity:** the browser trail (`pearls.trail.v1`) plus the garden.
- **Tickets:** a report becomes a Pearl (`/report`), with the lifecycle vocabulary `REPORTED … RESOLVED`, but no inbox. The page says so.
- **Experiences:** composed from the Pearl grammar and pure capabilities on this site (game, clock, loom, tiny world).

When the substrate implements these, the adapter gains methods; the UI already has the places to show them.

## G7. The V4 contract document

`V4_CLOUD_CODE_CONTRACT.md` is listed in the substrate README but does not exist yet (Phase 7, §17). Until it does, `/openapi.json` on a reachable host is the contract, and this file records what the consumer surface expects from it.
