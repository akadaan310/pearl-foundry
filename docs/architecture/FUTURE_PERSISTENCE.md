# Future persistence: from browser-local to shared

Shared persistence is **not active** on this deployment. No Supabase, no accounts, no required environment variables.

## Assessment (2026-10-08)

Checked through the Vercel API for the `aanebed` project:

- Environment variables: **none**.
- Connected storage: **none**. A Supabase marketplace integration is installed on the Vercel account but is **not connected** to this project, and the directive for this phase was not to connect it.
- Julia runtime: none.

Durable shared storage therefore cannot exist without an owner action. Embedding credentials in source to avoid environment variables was ruled out (it would publish them). Faking it (for example, an in-memory store presented as durable on serverless instances) was ruled out.

## The shared Pearl store adapter (built, inactive)

`src/lib/pearl/server-repository.ts` defines `PearlStore { put(pearl); get(id) }` and one implementation, `restKvStore`, over the Upstash / Vercel KV REST protocol (`GET {url}/get/{key}`, `POST {url}/set/{key}?nx=true`).

- Content-addressed: the key is `pearl:v1:{id}`; the Pearl is re-validated with the one parser and re-hashed before every write and after every read. A stored record that does not hash to its key is treated as absent and never served.
- Never overwrites (`nx`); a different Pearl under an existing id is reported as a conflict.
- Size limit 64 KiB per record.
- `getPearlStore()` returns `null` unless both `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set. They are not set, and no route calls it.
- Tested against an in-memory fake of the REST protocol in `tests/unit/capabilities.test.ts`, not against a real store.

### Minimum owner action to activate it

1. In Vercel → Storage, create (or connect) an Upstash Redis / KV store for the `aanebed` project. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN` as server-only environment variables; nothing is exposed to browser JavaScript.
2. Approve a follow-up change that adds two routes: `POST /api/v1/pearl` (publish: the person's explicit click, rate-limited) and a lookup in `/p/{id}` for links without a payload.
3. Redeploy. Until then `/p/{id}` without a payload stays honestly **Unavailable**.

Publishing is public by construction (a content id is not access control), so the UI must say so before the first publish. Private sharing needs the Postgres model below.

## The seam that exists today

`src/lib/pearl/workspace.ts` defines the data (`PearlRecord`, `Space`, `Project`, `Note`, `Task`) as pure functions, and one boundary:

```ts
interface WorkspaceRepository { kind: "browser-local" | "server"; load(): Workspace; save(ws: Workspace): void }
```

`LocalWorkspaceRepository` implements it over `localStorage`. The resolver takes a `LocalLookup`; a server lookup would be a second implementation. The UI only uses `useWorkspace().update(f)` with pure `f`.

## Proposed model (Postgres / Supabase)

| Table | Key fields | Notes |
|---|---|---|
| users | id, created_at | Supabase Auth; no passwords handled by this app |
| pearls | digest (pk), id, format, type, canonical jsonb, created_at | immutable, content-addressed; one row per distinct content |
| pearl_versions | id, digest, derived_from_digest, author_user, created_at | lineage; an update never mutates an existing row |
| library_items | user_id, digest, name, tags, pinned, space_id, project_id, modified_at | per-user metadata (today's `PearlRecord` minus content) |
| spaces, projects, notes, tasks | user_id + today's fields | |
| shares | token_hash, digest, scope (read), expires_at, revoked_at | capability links for private Pearls |
| events | user_id, kind, subject, at | append-only audit |

Access control: row-level security by `user_id` on every per-user table; `pearls` readable only through a library item, a public flag, or a valid share capability. A content hash is never an access control.

## Durable short links

`/p/{id}` (no payload) would resolve via `pearls.id` → `digest` for public Pearls or with a share token (`/p/{id}?k=…`) for private ones. Writes are idempotent by digest.

## Migration from local

On first sign-in, offer to upload the local library: build a `pearl-export` from `localStorage`, run the existing `planImport` server-side (same re-validation), show the preview, then apply. The local copy is kept until the user clears it.

## Deletion and export

Users can export at any time (the same `pearl-export` format) and delete their account: library items, spaces, projects, notes, tasks and shares are deleted; immutable `pearls` rows no longer referenced by anyone are deleted.

## The continuity brain

`supabase/migrations/0001_continuity_brain.sql` (ACSP-CB/0.1) is the shared-append design for many sessions on one record. It is tested on PostgreSQL 16. Enabling it requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, and a decision on write authorisation (today: the link is the capability).
