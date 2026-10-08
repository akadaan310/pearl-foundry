import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SubstrateClient, SubstrateError, type Fetch } from "../../src/lib/substrate/client";
import { substrateCompat } from "../../src/lib/substrate/compat";
import { substrateStatus, substrateUrl } from "../../src/lib/substrate/status";
import { resolvePearl, RESEARCH_IDS } from "../../src/lib/pearl/resolve";
import { parseExperience } from "../../src/lib/experience";
import { toPearl } from "../../src/lib/pearl/model";
import { LIVING_EXAMPLE } from "../../src/content/compose";

const reply = (status: number, body: unknown): ReturnType<Fetch> => Promise.resolve({ ok: status < 400, status, text: async () => JSON.stringify(body) });

/** A fake that answers only the routes routes.py/app.py define. */
function fake(log: { url: string; init?: Parameters<Fetch>[1] }[] = []): Fetch {
  return (url, init) => {
    log.push({ url, init });
    const p = new URL(url).pathname;
    if (p === "/health") return reply(200, { ok: true, version: "0.2.0" });
    if (p === "/.well-known/ai") return reply(200, { name: "Pearl Runtime Substrate", version: "0.2.0", phase: "2-foundation", api_base: "/api/v1", auth: ["bearer"], primitives: ["pearl", "address", "capability", "transition", "identity", "event"], capabilities: "/api/v1/capabilities", openapi: "/openapi.json", pearl_protocol: "pearl/1" });
    if (p === "/capabilities.json") return reply(200, { capabilities: [{ id: "pearl.fork", version: "1", status: "demonstrated" }, { id: "compute.eca", version: "1", status: "proposed" }] });
    if (p === "/api/v1/pearls" && init?.method === "POST") return reply(401, { error_id: "e1", code: "unauthorized", message: "bearer token required", retryable: false, request_id: "r1" });
    return reply(404, { code: "not_found", message: "no route" });
  };
}

test("status: not configured unless PEARL_SUBSTRATE_URL is set; only https (or localhost) is accepted", async () => {
  assert.equal((await substrateStatus({})).kind, "not_configured");
  assert.equal(substrateUrl({ PEARL_SUBSTRATE_URL: "http://129.213.149.47:8477" }), null, "plain http to a public host is refused");
  assert.equal(substrateUrl({ PEARL_SUBSTRATE_URL: "https://substrate.example" }), "https://substrate.example");
  const s = await substrateStatus({ PEARL_SUBSTRATE_URL: "https://substrate.example" }, fake());
  assert.equal(s.kind, "connected");
  assert.equal(s.base, "configured", "the base URL is never echoed");
  assert.deepEqual(s.discovery?.primitives, ["pearl", "address", "capability", "transition", "identity", "event"]);
  assert.equal(s.capabilities?.find((c) => c.id === "compute.eca")?.status, "proposed");
  const down: Fetch = () => Promise.reject(new TypeError("fetch failed"));
  assert.equal((await substrateStatus({ PEARL_SUBSTRATE_URL: "https://substrate.example" }, down)).kind, "unreachable");
});

test("client: mutations carry Idempotency-Key and bearer; the error envelope becomes a human message", async () => {
  const log: { url: string; init?: Parameters<Fetch>[1] }[] = [];
  const c = new SubstrateClient({ baseUrl: "https://substrate.example/", token: "t0k", fetch: fake(log) });
  await assert.rejects(c.createPearl({ format: "pearl/1" }, { idempotencyKey: "k1" }), (e: SubstrateError) => {
    assert.equal(e.status, 401); assert.equal(e.code, "unauthorized"); assert.equal(e.requestId, "r1");
    assert.equal(e.human, "That needs permission this browser doesn't have.");
    return true;
  });
  assert.equal(log[0].url, "https://substrate.example/api/v1/pearls");
  assert.equal(log[0].init?.headers?.["Idempotency-Key"], "k1");
  assert.equal(log[0].init?.headers?.Authorization, "Bearer t0k");
});

test("compat mirrors the substrate validator: verdicts match a real run of pearlcore/validate.py on the same Pearls", async () => {
  // Expected verdicts recorded by running the substrate's own validate_pearl(strict=True) on 2026-10-08 (docs/v6/IMPLEMENTATION_MAP.md §C3).
  const claude = (await resolvePearl(readFileSync("tests/fixtures/claude-2026-10-08.url", "utf8").trim())).pearl!;
  const living = toPearl(parseExperience(LIVING_EXAMPLE.slice(LIVING_EXAMPLE.indexOf("?") + 1), new Set(RESEARCH_IDS)).doc);
  const plain = toPearl(parseExperience("title=Notes&by=me&b1=h:Hi&b2=p:Hello&b3=list:a|b", new Set(RESEARCH_IDS)).doc);
  assert.equal(substrateCompat(claude).storable, false);
  assert.match(substrateCompat(claude).problems[0].type, /^c:/);
  const l = substrateCompat(living);
  assert.equal(l.storable, false);
  assert.deepEqual(l.problems.map((p) => p.block), [2, 3, 5]); // x, choice, research — the same blocks validate.py named
  assert.deepEqual(substrateCompat(plain), { storable: true, problems: [] });
});
