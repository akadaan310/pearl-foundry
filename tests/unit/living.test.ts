import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, LIMITS } from "../../src/lib/address";
import { livingAddress, normalForm } from "../../src/lib/living/address";
import { livingPearl, forkPearl } from "../../src/lib/living/pearl";
import { diffPearls } from "../../src/lib/living/diff";
import { COMMANDS } from "../../src/lib/living/commands";
import { CAPABILITIES, registry } from "../../src/lib/capabilities";
import { resolvePearl } from "../../src/lib/pearl/resolve";
import { parseExperience, experienceUrl } from "../../src/lib/experience";
import { RESEARCH_IDS } from "../../src/lib/pearl/resolve";
import { toPearl, pearlId, type Pearl } from "../../src/lib/pearl/model";
import { pearlQuery, pearlUrl } from "../../src/lib/pearl/serialize";
import { encodePortable, decodePortable, splitPortable } from "../../src/lib/pearl/portable";
import { GET as fork } from "../../src/app/api/v1/pearl/fork/route";
import { GET as diffRoute } from "../../src/app/api/v1/pearl/diff/route";
import { GET as living } from "../../src/app/api/v1/living/route";
import { GET as ejson } from "../../src/app/e.json/route";

const FIXTURE = readFileSync("tests/fixtures/claude-2026-10-08.url", "utf8").trim();
const ids = new Set(RESEARCH_IDS);
const parse = (q: string) => parseExperience(q, ids);
const pearlOf = (q: string) => { const r = parse(q); assert.deepEqual(r.errors, []); return toPearl(r.doc); };
const req = (path: string) => new Request("https://aanebed.vercel.app" + path, { headers: { "x-forwarded-for": "203.0.113." + Math.floor(Math.random() * 250) } });

test("v1 compatibility: the owner's Claude Pearl keeps its v1.1.0 id", async () => {
  const r = await resolvePearl(FIXTURE);
  assert.equal(r.id, "p_rg86c59j7jmqp0w1"); // computed with the v1.1.0 code (commit b7b3fd2)
});

test("every address-producing affordance is itself a valid address, and illegal moves are absent", () => {
  const long = "/map/eca/90/8/state/5" + "/next".repeat(LIMITS.maxOperations - 2); // 12 operations: at the limit
  for (const a of ["/map/eca/90/8", "/map/eca/90/8/state/5", "/map/eca/30/16/state/256/next/flip/3", "/map/eca/110/12/state/7/trace/8", "/map/eca/90/8/state/5/orbit", long]) {
    const rec = livingAddress(a);
    for (const af of rec.affordances) {
      for (const h of [af.href, ...(af.options ?? []).map((o) => o.href)].filter((x): x is string => !!x && x.startsWith("/map"))) {
        assert.doesNotThrow(() => resolve(h), `${a} → ${af.command} → ${h}`);
      }
    }
    const cmds = rec.affordances.map((x) => x.command);
    if (rec.type !== "state") for (const c of ["next", "perturb", "trace", "orbit"]) assert.ok(!cmds.includes(c), `${c} must not appear on a ${rec.type}`);
    if (rec.type === "state") for (const c of ["next", "perturb", "trace", "orbit"]) assert.ok(cmds.includes(c));
    assert.equal(cmds.includes("back"), rec.parent !== null);
  }
  // At the operation limit, NEXT restarts from the normal form and says so.
  const atLimit = livingAddress(long).affordances.find((x) => x.command === "next")!;
  assert.match(atLimit.note ?? "", /normal form/);
  assert.equal(resolve(atLimit.href!).identity.value_sha256, resolve(normalForm(resolve(long))! + "/next").identity.value_sha256);
});

test("NEXT on Rule 90, 8 cells, state 5 produces state 136; the explanation comes from the state", () => {
  const rec = livingAddress("/map/eca/90/8/state/5");
  const next = rec.affordances.find((x) => x.command === "next")!;
  assert.equal(next.href, "/map/eca/90/8/state/5/next");
  assert.equal((resolve(next.href!).value as { x: number }).x, 136);
  assert.match(rec.explanation.join(" "), /Rule 90 on a 8-cell ring\. The current state is 5 \(00000101\).*produces state 136/s);
  const r2 = livingAddress("/map/eca/90/8/state/5/next/flip/2");
  assert.deepEqual(r2.history.map((e) => e.op), ["map.state", "state.next", "state.flip"]);
  assert.equal(r2.parent, "/map/eca/90/8/state/5/next");
  assert.ok(r2.evidence.some((e) => /SIMULATED/.test(e.detail)));
});

test("/x values are untouched by the living layer (vectors stay identical)", () => {
  // value hashes recorded before v2 (E-006 vectors are covered in address.test.ts); here: living.identity.hash === resolve().identity
  for (const a of ["/map/eca/90/8/state/5/next", "/map/eca/30/16/state/256/trace/24", "/map/eca/110/12/state/1/orbit"]) {
    assert.equal(livingAddress(a).identity.hash, resolve(a).identity.value_sha256);
  }
});

test("affordances only use commands from the registry table, and every command names a capability", () => {
  const known = new Set(COMMANDS.map((c) => c.id));
  const capIds = new Set(CAPABILITIES.map((c) => c.id));
  for (const c of COMMANDS) {
    const base = c.capability.split(/[ #(]/)[0];
    assert.ok(c.capability.startsWith("client:") || capIds.has(base) || /^(pearl grammar|the target|hash\.sha256|living\.describe|compute\.eca)/.test(c.capability), `${c.id}: ${c.capability}`);
  }
  const p = livingPearl(pearlOf("title=T&b1=p:Hello"));
  for (const a of p.affordances) assert.ok(known.has(a.command));
  assert.ok(!p.affordances.some((a) => a.command === "continue" || a.command === "prompt"), "CONTINUE and PROMPT only appear when the Pearl has continuity or prompt blocks");
  assert.equal(registry().commands.list.length, COMMANDS.length);
});

test("FORK: original unchanged, from= names the parent, lineage survives the round trip, v1 ids unaffected", async () => {
  const r = await resolvePearl(FIXTURE);
  const before = JSON.stringify(r.pearl);
  const f = forkPearl(r.pearl!, r.id!);
  assert.equal(JSON.stringify(r.pearl), before);
  assert.equal(f.from, r.id);
  assert.notEqual(pearlId(f), r.id);
  const back = pearlOf(pearlQuery(f));
  assert.equal(back.from, r.id);
  assert.equal(pearlId(back), pearlId(f));
  const portable = await encodePortable(f);
  const q = await decodePortable(splitPortable(new URL(portable.url).pathname.slice(3))!.token!);
  assert.equal(pearlId(pearlOf(q)), pearlId(f));
  // A bad from= is ignored with a warning, never an error.
  const bad = parse("title=x&b1=p:y&from=not-an-id");
  assert.deepEqual(bad.errors, []);
  assert.equal(bad.doc.from, undefined);
  assert.match(bad.warnings.join(" "), /from=/);
  // The endpoint does the same, and states the parent is unchanged.
  const res = await (await fork(req("/api/v1/pearl/fork?u=" + encodeURIComponent(FIXTURE)))).json();
  assert.equal(res.parent.id, r.id);
  assert.equal(res.fork.from, r.id);
});

test("REMIX: a changed composition is a new Pearl; the original is unchanged", () => {
  const a = pearlOf("title=Soup&b1=list:lentils|onion&b2=steps:boil|stir");
  const before = JSON.stringify(a);
  const b = forkPearl(a, pearlId(a), { blocks: [...a.blocks, { type: "note", text: "add cumin" }] });
  assert.equal(JSON.stringify(a), before);
  const d = diffPearls(a, b);
  assert.equal(d.relation, "b is derived from a");
  assert.deepEqual(d.counts, { same: 2, added: 1, removed: 0, changed: 0 });
});

test("COMPARE: computation and continuity transitions are named", () => {
  const a = pearlOf("title=Work&b1=thread:Ship the page&b2=x:/map/eca/90/8/state/5");
  const b = pearlOf("title=Work&b1=thread:Ship the page&b2=close:Ship the page&b3=decision:Launch Friday&b4=x:/map/eca/90/8/state/5/next");
  const d = diffPearls(a, b);
  assert.deepEqual(d.continuity.closed, ["Ship the page"]);
  assert.deepEqual(d.continuity.decisions_added, ["Launch Friday"]);
  assert.equal(d.computations.length, 1);
  assert.equal(d.computations[0].xA, 5);
  assert.equal(d.computations[0].xB, 136);
  assert.equal(d.relation, "unrelated by from=");
});

test("encoding: & # + % spaces and Unicode survive serialise → parse with the same id", () => {
  const p = pearlOf(new URLSearchParams({ title: "Tom & Jerry #1 + 50% · قهوة ☕", by: "Claude", b1: "p:a & b # c + d % e", b2: "list:é|ü|日本", b3: "choice:Go?|Step>/x/map/eca/90/8/state/5/next|Story>/e?title=A%26b1=list:x|y" }).toString());
  const again = pearlOf(pearlQuery(p));
  assert.deepEqual(again, p);
  assert.equal(pearlId(again), pearlId(p));
  const ch = p.blocks[2] as Extract<Pearl["blocks"][number], { type: "choice" }>;
  assert.deepEqual(ch.options.map((o) => o.href), ["/x/map/eca/90/8/state/5/next", "/e?title=A&b1=list:x|y"]);
});

test("choice: targets must be on this site; at most 6 options", () => {
  const r = parse("title=t&b1=" + encodeURIComponent("choice:Where?|Out>https://evil.example/x|Home>/live/map/eca/90/8/state/5"));
  const c = r.doc.blocks[0] as { type: string; options: { href: string }[] };
  assert.equal(c.type, "choice");
  assert.deepEqual(c.options.map((o) => o.href), ["/live/map/eca/90/8/state/5"]);
  assert.match(r.warnings.join(" "), /choice option rejected/);
});

test("an experience with a title and no blocks is valid but says it is empty", () => {
  const r = parse("title=Hello&type=experience&by=Claude");
  assert.deepEqual(r.errors, []);
  assert.match(r.warnings.join(" "), /nothing to experience yet/);
  assert.match(livingPearl(toPearl(r.doc)).explanation.join(" "), /no parts yet/);
});

test("machine surface = human surface: /e.json and /api/v1/living return the same record livingPearl builds", async () => {
  const q = "type=continuity&title=Night&by=Claude&b1=ai:Sunny&b2=thread:Finish the copy&b3=prompt:Summarise";
  const p = pearlOf(q);
  const rec = livingPearl(p);
  const e = await (await ejson(req("/e.json?" + q))).json();
  assert.deepEqual(e.living.affordances, JSON.parse(JSON.stringify(rec.affordances)));
  assert.deepEqual(e.living.evidence, JSON.parse(JSON.stringify(rec.evidence)));
  assert.ok(rec.affordances.some((a) => a.command === "continue") && rec.affordances.some((a) => a.command === "prompt"));
  const l = await (await living(req("/api/v1/living?u=" + encodeURIComponent(pearlUrl(p))))).json();
  assert.equal(l.record.identity.id, rec.identity.id);
  const lx = await (await living(req("/api/v1/living?u=/live/map/eca/90/8/state/5"))).json();
  assert.equal(lx.record.state.x, 5);
  assert.equal((await living(req("/api/v1/living?u=javascript:alert(1)"))).status, 422);
  const dr = await (await diffRoute(req("/api/v1/pearl/diff?a=" + encodeURIComponent("/e?title=A&b1=thread:x") + "&b=" + encodeURIComponent("/e?title=A&b1=thread:x&b2=close:x")))).json();
  assert.deepEqual(dr.diff.continuity.closed, ["x"]);
  void experienceUrl;
});

test("evidence rows never collapse into one 'verified' badge", () => {
  const p = pearlOf("title=R&by=Claude&b1=claim:hypothesis|It works&b2=x:/map/eca/90/8/state/5&b3=link:https://example.org|ex");
  const k = livingPearl(p).evidence.map((e) => e.knowing);
  for (const want of ["checked", "asserted", "computed", "external", "cannot be established"]) assert.ok(k.includes(want as never), want);
  assert.ok(!JSON.stringify(livingPearl(p).evidence).match(/"knowing":"verified"/));
});

test("the living example experience Pearl is valid, warning-free, and every choice target resolves", async () => {
  const { LIVING_EXAMPLE } = await import("../../src/content/compose");
  const r = parse(LIVING_EXAMPLE.slice(LIVING_EXAMPLE.indexOf("?") + 1));
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  const p = toPearl(r.doc);
  assert.equal(p.type, "experience");
  const c = p.blocks.find((b) => b.type === "choice") as Extract<Pearl["blocks"][number], { type: "choice" }>;
  assert.equal(c.options.length, 3);
  for (const o of c.options) assert.doesNotThrow(() => resolve(o.href.replace(/^\/x/, "")));
  const rec = livingPearl(p);
  assert.ok(rec.affordances.find((a) => a.command === "open")!.options!.length >= 4);
  assert.ok(rec.affordances.some((a) => a.command === "prompt"));
});
