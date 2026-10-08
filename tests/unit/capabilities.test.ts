import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { CAPABILITIES, ENGINES, registry, normalizeText, slugify, countText, TEXT_LIMIT } from "../../src/lib/capabilities";
import { GET as hash } from "../../src/app/api/v1/hash/route";
import { GET as text } from "../../src/app/api/v1/text/[op]/route";
import { GET as decode } from "../../src/app/api/v1/pearl/decode/route";
import { encodePortable } from "../../src/lib/pearl/portable";
import { resolvePearl } from "../../src/lib/pearl/resolve";
import { composeCollection } from "../../src/lib/pearl/collection";
import { parseExperience } from "../../src/lib/experience";
import { RESEARCH_IDS } from "../../src/lib/pearl/resolve";
import { restKvStore, getPearlStore } from "../../src/lib/pearl/server-repository";
import type { Pearl } from "../../src/lib/pearl/model";
import { MACHINE_ENTRYPOINTS } from "../../src/content/site";
import { aiManifest, llmsTxt } from "../../src/lib/manifest";
import { ORIGIN } from "../../src/config/origin";

const req = (path: string, ip = "198.51.100." + Math.floor(Math.random() * 250)) => new Request("https://aanebed.vercel.app" + path, { headers: { "x-forwarded-for": ip } });
const body = async (r: Response) => ({ status: r.status, json: await r.json() });
const fixture = readFileSync("tests/fixtures/claude-2026-10-08.url", "utf8").trim();

test("registry lists only pure GET operations, and the only active engine is javascript (no fake Julia)", () => {
  const r = registry();
  assert.equal(r.capabilities.length, CAPABILITIES.length);
  for (const c of r.capabilities) { assert.equal(c.method, "GET"); assert.equal(c.side_effects, "none"); assert.equal(c.auth, "none"); }
  assert.deepEqual(ENGINES.filter((e) => e.status === "active").map((e) => e.id), ["javascript"]);
  assert.equal(ENGINES.find((e) => e.id === "julia")?.status, "not available");
  assert.ok(MACHINE_ENTRYPOINTS.some((e) => e.path === "/capabilities.json"));
  assert.equal((aiManifest() as { capabilities: { registry: string } }).capabilities.registry, `${ORIGIN}/capabilities.json`);
  assert.match(llmsTxt(), /## Capabilities/);
});

test("hash.sha256 matches the known SHA-256 of 'hello' and enforces limits", async () => {
  const ok = await body(hash(req("/api/v1/hash?text=hello")));
  assert.equal(ok.status, 200);
  assert.equal(ok.json.sha256, "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
  assert.equal(ok.json.short.length, 16);
  assert.equal((await body(hash(req("/api/v1/hash")))).status, 400);
  assert.equal((await body(hash(req("/api/v1/hash?text=" + "a".repeat(TEXT_LIMIT + 1))))).status, 413);
});

test("text.transform operations are deterministic and reject unknown ops", async () => {
  assert.equal(normalizeText("  a‮b \n\t c  "), "ab c");
  assert.equal(slugify("Teta's Lentil Soup — Café"), "tetas-lentil-soup-cafe");
  assert.deepEqual(countText("one two\nthree"), { characters: 13, code_points: 13, words: 3, lines: 2 });
  const ctx = (op: string) => ({ params: Promise.resolve({ op }) });
  const s = await body(await text(req("/api/v1/text/slug?text=Hello+World"), ctx("slug")));
  assert.equal(s.json.result, "hello-world");
  assert.equal((await text(req("/api/v1/text/eval?text=1"), ctx("eval"))).status, 404);
});

test("pearl.decode round-trips the owner's Claude Pearl and rejects a tampered payload", async () => {
  const r = await resolvePearl(fixture);
  assert.ok(r.pearl);
  const portable = await encodePortable(r.pearl!);
  const path = new URL(portable.url).pathname;
  const ok = await body(await decode(req("/api/v1/pearl/decode?u=" + encodeURIComponent(path))));
  assert.equal(ok.status, 200);
  assert.equal(ok.json.id, r.id);
  assert.equal(ok.json.verified, true);
  const other = await encodePortable({ ...r.pearl!, title: "Something else" });
  const forged = path.split(".")[0] + "." + new URL(other.url).pathname.split(".").slice(1).join(".");
  assert.equal((await decode(req("/api/v1/pearl/decode?u=" + encodeURIComponent(forged)))).status, 422);
  assert.equal((await decode(req("/api/v1/pearl/decode?u=hello"))).status, 400);
});

test("a space composes into a valid collection Pearl; oversize members are reported, not truncated", async () => {
  const r = await resolvePearl(fixture);
  const small = new URL((await encodePortable(r.pearl!)).url).pathname;
  const plan = composeCollection("Cooking", "My kitchen.", [{ title: "Claude", href: small }, { title: "Huge", href: "/p/x." + "a".repeat(2000) }]);
  assert.equal(plan.included.length, 1);
  assert.equal(plan.omitted[0].title, "Huge");
  const u = new URL(plan.url);
  const parsed = parseExperience(u.searchParams, new Set(RESEARCH_IDS), plan.url.length);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.doc.type, "collection");
  assert.equal(parsed.doc.blocks.filter((b) => b.type === "pearl").length, 1);
});

test("the shared Pearl store is inactive without configuration and content-addressed with it", async () => {
  assert.equal(getPearlStore({}), null);
  const kv = new Map<string, string>();
  const fake = async (url: string, init?: { method?: string; body?: string }) => {
    const m = url.match(/\/(get|set)\/([^?]+)(\?nx=true)?$/)!;
    const k = decodeURIComponent(m[2]);
    let result: unknown = null;
    if (m[1] === "get") result = kv.get(k) ?? null;
    else if (!kv.has(k)) { kv.set(k, init!.body!); result = "OK"; }
    return { ok: true, status: 200, json: async () => ({ result }) };
  };
  const store = restKvStore("https://kv.example", "t", fake);
  const r = await resolvePearl(fixture);
  const put = await store.put(r.pearl!);
  assert.equal(put.id, r.id);
  assert.equal(put.created, true);
  assert.equal((await store.put(r.pearl!)).created, false);
  assert.equal((await store.get(r.id!))?.digest, r.digest);
  // A record that does not hash to its key is never served.
  const tampered = JSON.parse(kv.get(`pearl:v1:${r.id}`)!);
  tampered.pearl.title = "edited";
  kv.set(`pearl:v1:${r.id}`, JSON.stringify(tampered));
  assert.equal(await store.get(r.id!), null);
  await assert.rejects(store.put(tampered.pearl as Pearl).then(() => store.put({ ...(r.pearl as Pearl) })), /conflict/);
  assert.equal(await store.get("not-an-id"), null);
});
