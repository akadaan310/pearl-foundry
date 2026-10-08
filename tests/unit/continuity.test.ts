import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { parseExperience } from "../../src/lib/experience";
import { bodyFrom, fold, verifyChain, chainHash, contentHash, normaliseCode, GENESIS_PREV } from "../../src/lib/continuity/model";
import { memoryStore, sqlStore, type Rpc, type Store } from "../../src/lib/continuity/store";

const IDS = new Set(["purl"]);
const body = (q: string, fallback = "s") => bodyFrom(parseExperience(new URLSearchParams(q), IDS).doc, fallback, true);

const GENESIS = "title=Purrl&by=Claude&session=claude-1&b=ai:Sunny&b=human:Sam&b=nick:Captain Commit=Sam at 2am&b=nuance:Sam writes teh on purpose&b=lex:the drawer=parked ideas&b=thread:Finish onboarding copy&b=h:Hello Sam&b=p:This is ours.";

async function scenario(store: Store) {
  const g = await store.create(body(GENESIS));
  assert.equal(g.v, 1);
  const a1 = await store.append(g.code, body("session=gemini-1&by=Gemini&b=said:Sam asked for taglines&b=decision:Ship Friday&b=nick:Captain Commit=Sam, any time he ships"));
  const a2 = await store.append(g.code, body("session=chatgpt-1&by=ChatGPT&b=close:Finish onboarding&b=mem:Tagline chosen: Addresses that remember&b=ai:Sunny (still)"));
  const dup = await store.append(g.code, body("session=chatgpt-1&by=ChatGPT&b=close:Finish onboarding&b=mem:Tagline chosen: Addresses that remember&b=ai:Sunny (still)"));
  assert.deepEqual([("v" in a1) && a1.v, ("v" in a2) && a2.v], [2, 3]);
  assert.ok("duplicate" in dup && dup.duplicate && dup.v === 3, "same content → same event");
  const r = (await store.read(g.code))!;
  assert.equal(r.events.length, 3);
  assert.deepEqual(verifyChain(r.events), { valid: true, checked: 3, problems: [] });
  const st = fold(r.events);
  assert.equal(st.ai?.text, "Sunny (still)");
  assert.equal(st.names.ai.length, 2, "earlier names are kept, not overwritten");
  assert.equal(st.nicknames.length, 1);
  assert.equal(st.nicknames[0].text, "Sam, any time he ships");
  assert.equal(st.threads.open.length, 0);
  assert.equal(st.threads.closed.length, 1);
  assert.deepEqual(st.sessions.map((s) => s.session), ["claude-1", "gemini-1", "chatgpt-1"]);
  assert.deepEqual(st.transitions.map((t) => `${t.from}>${t.to}`), ["claude-1>gemini-1", "gemini-1>chatgpt-1"]);
  assert.equal(st.experience?.title, "Purrl");
  assert.equal(fold(r.events, 1).ai?.text, "Sunny", "state at version 1 is replayable");
  // tampering is detected
  const t = JSON.parse(JSON.stringify(r.events));
  t[1].body.entries[0].text = "rewritten";
  assert.equal(verifyChain(t).valid, false);
  // forget needs the owner key
  assert.equal(await store.forget(g.code, "wrong"), false);
  assert.equal(await store.forget(g.code, g.ownerKey), true);
  assert.equal(await store.read(g.code), null);
  assert.deepEqual(await store.append(g.code, body("session=x&b=said:after")), { error: "not_found" });
}

test("memory store: genesis, N sessions, idempotency, fold, chain, forget", async () => { await scenario(memoryStore()); });

test("chain hash matches the SQL definition", () => {
  // select cb_chain('sha256:genesis', 1, 'sha256:c1') in PostgreSQL
  assert.equal(chainHash(GENESIS_PREV, 1, "sha256:c1"), "sha256:a1e12797154c9b7a927a1da21a3e2229c440b1ecbd0080f3e8a2ea8496f4c9ea");
});

test("codes tolerate how people type them", () => {
  assert.equal(normaliseCode("k7q2-m9xt-ab"), "K7Q2M9XTAB");
  assert.equal(normaliseCode("O1IL000000"), "0111000000");
  assert.equal(normaliseCode("short"), null);
});

test("content hash ignores key order", () => {
  assert.equal(contentHash({ session: "a", by: null, entries: [] }), contentHash({ entries: [], by: null, session: "a" } as never));
});

// The same scenario against the real migration on PostgreSQL, when one is available.
const PG = process.env.CB_TEST_PG; // e.g. "-h /tmp -p 54329 -U postgres -d cbtest"
test("SQL store against PostgreSQL (supabase/migrations)", { skip: !PG && "set CB_TEST_PG to psql connection args" }, async () => {
  const args = PG!.split(" ");
  const psql = (sql: string) => {
    const r = spawnSync("psql", [...args, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql], { encoding: "utf8" });
    if (r.status !== 0) throw Object.assign(new Error(r.stderr), { body: r.stderr });
    return r.stdout.trim();
  };
  psql("drop schema if exists public cascade; create schema public;");
  const mig = spawnSync("psql", [...args, "-v", "ON_ERROR_STOP=1", "-q", "-f", "supabase/migrations/0001_continuity_brain.sql"], { encoding: "utf8" });
  assert.equal(mig.status, 0, mig.stderr);
  const lit = (v: unknown) => (v === null ? "null" : typeof v === "number" ? String(v) : `$q$${typeof v === "string" ? v : JSON.stringify(v)}$q$`);
  const rpc: Rpc = async (fn, a) => {
    const order: Record<string, string[]> = {
      cb_create: ["p_code", "p_owner_key_hash", "p_session", "p_body", "p_content_hash"],
      cb_append: ["p_code", "p_session", "p_body", "p_content_hash", "p_max_events"],
      cb_read: ["p_code", "p_from", "p_limit"],
      cb_forget: ["p_code", "p_owner_key_hash"],
    };
    const out = psql(`select ${fn}(${order[fn].map((k) => lit(a[k]) + (k === "p_body" ? "::jsonb" : "")).join(", ")})::text`);
    return out === "" ? null : JSON.parse(out);
  };
  await scenario(sqlStore(rpc));
});
