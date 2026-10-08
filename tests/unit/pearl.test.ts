import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseExperience, parseQueryString } from "../../src/lib/experience";
import { toPearl, pearlId, pearlDigest, idFromDigest, isPearlId, base32, TYPE_INFO, inferType } from "../../src/lib/pearl/model";
import { pearlQuery, pearlUrl, encodeValue } from "../../src/lib/pearl/serialize";
import { encodePortable, decodePortable, splitPortable } from "../../src/lib/pearl/portable";
import { resolvePearl, RESEARCH_IDS, findUrls } from "../../src/lib/pearl/resolve";
import { NODES } from "../../src/content/research";
import { ORIGIN } from "../../src/config/origin";

const IDS = new Set(RESEARCH_IDS);
const FIXTURE = readFileSync(new URL("../fixtures/claude-2026-10-08.url", import.meta.url), "utf8").trim();
const fq = FIXTURE.slice(FIXTURE.indexOf("?") + 1);
const parse = (q: string) => parseExperience(q, IDS);

test("research ids used by the resolver match the research record", () => {
  assert.deepEqual([...RESEARCH_IDS].sort(), NODES.map((n) => n.id).sort());
});

test("the owner's Claude Pearl (2026-10-08): every block, in order, with title, model, session and Arabizi", () => {
  const r = parse(fq);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.doc.title, "Abed & Claude, 2am");
  assert.equal(r.doc.by, "Claude Opus 5.5");
  assert.equal(r.doc.session, "claude-abed-2026-10-08");
  assert.equal(r.doc.for, "Abed");
  assert.deepEqual(r.doc.blocks.map((b) => (b.type === "c" ? b.kind : b.type)), ["ai", "human", "nuance", "lex", "lex", "mem", "mem", "thread", "thread", "h", "p", "flow"]);
  const lex = r.doc.blocks.filter((b) => b.type === "c" && b.kind === "lex") as { key?: string; text: string }[];
  assert.deepEqual(lex.map((l) => [l.key, l.text]), [["7abeebi", "habibi, my dear"], ["sht2tillak", "I missed you"]]);
  const flow = r.doc.blocks[11] as { items: string[] };
  assert.deepEqual(flow.items, ["llms.txt", "Read", "Ask", "Compose", "Give it a life"]);
  assert.equal(inferType(r.doc), "continuity");
});

test("the fixture survives serialize → parse, in both block styles, with a stable id", () => {
  const p = toPearl(parse(fq).doc);
  const numbered = parse(pearlQuery(p, "numbered"));
  const repeated = parse(pearlQuery(p, "repeated"));
  assert.deepEqual(toPearl(numbered.doc), p);
  assert.deepEqual(toPearl(repeated.doc), p);
  assert.equal(pearlId(toPearl(numbered.doc)), pearlId(p));
  assert.match(pearlId(p), /^p_[0-9a-hjkmnp-tv-z]{16}$/);
});

test("numbered blocks survive a fetcher that sorts keys and keeps one value per key (the reported collapse)", () => {
  const p = toPearl(parse(fq).doc);
  const normalised = (q: string) => {
    const seen = new Map<string, string>();
    for (const [k, v] of new URLSearchParams(q)) if (!seen.has(k)) seen.set(k, v);
    return new URLSearchParams([...seen].sort(([a], [b]) => a.localeCompare(b))).toString();
  };
  assert.equal(parse(normalised(pearlQuery(p, "repeated"))).doc.blocks.length, 1, "repeated b= collapses, as reported");
  const survived = parse(normalised(pearlQuery(p, "numbered")));
  assert.deepEqual(survived.doc.blocks, p.blocks, "numbered blocks come back complete and in order (b10 after b9)");
});

test("s= accepts real newlines, %0A and the literal two characters \\n; a 3-line minimal case is valid", () => {
  for (const q of ["s=h:Hello%0Ap:World%0Alist:a|b", "s=h:Hello\\np:World\\nlist:a|b", "title=T&s=h%3AHello%5Cnp%3AWorld%5Cnlist%3Aa%7Cb"]) {
    const r = parse(q);
    assert.deepEqual(r.errors, [], q);
    assert.deepEqual(r.doc.blocks.map((b) => b.type), ["h", "p", "list"], q);
  }
  assert.ok(parse("s=").errors.length > 0, "an empty s= is still an error");
});

test("a bare & inside text is kept as text when parsing a raw query", () => {
  const r = parse("title=T&b=p:Tom & Jerry&b=p:Second");
  assert.deepEqual(r.doc.blocks.map((b) => (b as { text: string }).text), ["Tom & Jerry", "Second"]);
});

test("encoding: + is a space, %2B is a plus, Arabic and reserved characters round-trip", () => {
  const r = parse("title=1%2B1+is+2&b1=p:" + encodeURIComponent("مرحبا يا حبيبي — 7abeebi") + "&b2=p:a%26b%23c%25d%3Ae");
  assert.equal(r.doc.title, "1+1 is 2");
  assert.equal((r.doc.blocks[0] as { text: string }).text, "مرحبا يا حبيبي — 7abeebi");
  assert.equal((r.doc.blocks[1] as { text: string }).text, "a&b#c%d:e");
  const p = toPearl(r.doc);
  assert.deepEqual(toPearl(parse(pearlQuery(p)).doc), p);
  assert.equal(encodeValue("a b+c&d#e"), "a+b%2Bc%26d%23e");
});

test("pearl ids: stable for identical content, different for different content, deterministic encoding", () => {
  const a = toPearl(parse("title=A&b1=p:x").doc);
  const b = toPearl(parse("b1=p:x&title=A").doc);
  const c = toPearl(parse("title=A&b1=p:y").doc);
  assert.equal(pearlId(a), pearlId(b));
  assert.notEqual(pearlId(a), pearlId(c));
  assert.equal(idFromDigest(pearlDigest(a)), pearlId(a));
  assert.equal(base32("ffffffffffffffffffff"), "zzzzzzzzzzzzzzzz");
  assert.equal(base32("00000000000000000000"), "0000000000000000");
  assert.ok(!isPearlId("p_ILLEGALCHARSxx00"));
  assert.ok(!isPearlId("p_123"));
});

test("portable links: round trip, id check, tamper and size rejection", async () => {
  const p = toPearl(parse(fq).doc);
  const { id, token, url } = await encodePortable(p);
  assert.equal(id, pearlId(p));
  assert.ok(url.startsWith(ORIGIN + "/p/" + id + "."));
  const q = await decodePortable(token);
  assert.deepEqual(toPearl(parse(q).doc), p);
  assert.deepEqual(splitPortable(`/p/${id}.${token}`), { id, token });
  const r = await resolvePearl(url);
  assert.equal(r.status, "valid");
  assert.equal(r.id, id);
  // a payload belonging to a different id is rejected
  const other = await encodePortable(toPearl(parse("title=Other&b1=p:x").doc));
  const forged = await resolvePearl(`${ORIGIN}/p/${id}.${other.token}`);
  assert.equal(forged.status, "invalid");
  await assert.rejects(decodePortable("@@@"));
  await assert.rejects(decodePortable("A".repeat(13_000)));
});

test("resolver: the fixture pasted inside prose, with Markdown punctuation around it", async () => {
  const r = await resolvePearl(`**Your link, composed by me:**\n\n${FIXTURE}\n\nSources: [llms.txt](${ORIGIN}/llms.txt)`);
  assert.equal(r.status, "valid", "the one Pearl is picked out; the llms.txt source link is a page, not a Pearl");
  assert.equal(r.pearl?.blocks.length, 12);
  const two = await resolvePearl(`${FIXTURE}\nand also ${ORIGIN}/e?title=Other&b1=p:x`);
  assert.equal(two.status, "malformed", "two different Pearls: ambiguous, never guessed");
  const one = await resolvePearl(`Here it is: ${FIXTURE}.`);
  assert.equal(one.status, "valid");
  assert.equal(one.pearl?.blocks.length, 12);
  assert.equal(one.pearl?.type, "continuity");
  assert.ok(one.links!.e.startsWith(ORIGIN + "/e?type=continuity&title=Abed+%26+Claude"));
});

test("resolver: a raw # inside a pasted link is recovered as text", async () => {
  const r = await resolvePearl(`${ORIGIN}/e?title=T&b1=p:Fix+issue+#3+today&b2=p:Second`);
  assert.equal(r.status, "valid");
  assert.deepEqual(r.pearl!.blocks.map((b) => (b as { text: string }).text), ["Fix issue #3 today", "Second"]);
  assert.ok(r.notes.some((n) => n.includes("#")));
});

test("resolver classifications", async () => {
  assert.equal((await resolvePearl("")).status, "empty");
  assert.equal((await resolvePearl("https://example.org/e?title=x")).status, "external");
  assert.equal((await resolvePearl(`${ORIGIN}/research`)).status, "unsupported");
  assert.equal((await resolvePearl(`${ORIGIN}/c/K7Q2M9XTAB`)).status, "unsupported");
  assert.equal((await resolvePearl(`${ORIGIN}/p/p_0123456789abcdef`)).status, "unavailable");
  assert.equal((await resolvePearl(`${ORIGIN}/e?title=`)).status, "invalid");
  assert.equal((await resolvePearl("x".repeat(25_000))).status, "invalid");
  assert.equal((await resolvePearl("just some words")).status, "malformed");
  const x = await resolvePearl(`${ORIGIN}/x/map/eca/90/8/state/5/next`);
  assert.equal(x.status, "valid");
  assert.equal(x.pearl!.type, "computation");
  const lines = await resolvePearl("h: Hello\np: World\nthread: Finish it");
  assert.equal(lines.status, "valid");
  assert.equal(lines.pearl!.type, "continuity");
  const local = await resolvePearl(`${ORIGIN}/p/p_0123456789abcdef`, () => ({ pearl: toPearl(parse("title=L&b1=p:x").doc), digest: "x" }));
  assert.equal(local.status, "local");
  const js = await resolvePearl(`${ORIGIN}/e?title=x&b1=link:javascript:alert(1)|x&b2=p:<script>alert(1)</script>`);
  assert.equal(js.status, "valid");
  assert.equal(js.pearl!.blocks.length, 1, "the javascript: link is dropped; the script tag stays text");
  assert.equal((await resolvePearl('{"format":"nope"}')).status, "malformed");
  const rec = await resolvePearl(JSON.stringify(toPearl(parse(fq).doc)));
  assert.equal(rec.status, "valid");
  assert.equal(rec.pearl!.blocks.length, 12);
});

test("every type has an honest capability statement; descriptive types are not executed", () => {
  assert.equal(TYPE_INFO.workflow.support, "descriptive");
  assert.equal(TYPE_INFO.prompt.support, "descriptive");
  assert.equal(TYPE_INFO.computation.support, "implemented");
});

test("findUrls strips sentence punctuation but keeps balanced parentheses", () => {
  assert.deepEqual(findUrls("see https://a.b/x?y=1)."), ["https://a.b/x?y=1"]);
  assert.deepEqual(findUrls("(https://a.b/w_(x))"), ["https://a.b/w_(x)"]);
});

test("the explicit type= parameter is honoured; unknown types warn", () => {
  assert.equal(parse("type=workflow&title=W&b1=steps:a|b").doc.type, "workflow");
  assert.ok(parse("type=spaceship&title=W&b1=p:x").warnings.some((w) => w.includes("unknown type")));
});

test("parseQueryString preserves repeated keys and their order", () => {
  assert.deepEqual(parseQueryString("b=1&b=2&title=x&b=3").getAll("b"), ["1", "2", "3"]);
});
