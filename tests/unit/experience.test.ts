import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExperience, experienceUrl, EXAMPLE_URL, LIMITS } from "../../src/lib/experience";

const IDS = new Set(["purl", "continuity", "ai-ci"]);
const parse = (url: string) => { const u = new URL(url); return parseExperience(u.searchParams, IDS, url.length); };

test("the documented example parses with no errors or warnings", () => {
  const r = parse(EXAMPLE_URL);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
  assert.equal(r.doc.title, "A tour for Sam");
  assert.equal(r.doc.by, "Claude");
  assert.deepEqual(r.doc.blocks.map((b) => b.type), ["h", "p", "flow", "x", "research", "note"]);
});

test("round trip: experienceUrl → parse gives the same blocks, and the id is stable", () => {
  const url = experienceUrl("https://aanebed.vercel.app", { title: "T & U", by: "Gemini", for: "a student", lines: ["h:Hi", "list:a|b|c", "table:A;B|1;2", "facts:k=v|x=y", "quote:Q|Who", "link:https://example.org/x?y=1|Example"] });
  const a = parse(url), b = parse(url);
  assert.equal(a.id, b.id);
  assert.deepEqual(a.errors, []);
  assert.equal(a.doc.blocks.length, 6);
  const l = a.doc.blocks[5];
  assert.ok(l.type === "link" && l.host === "example.org");
});

test("tolerates what language models get wrong: raw spaces, double encoding, aliases, s= lines", () => {
  const r = parseExperience(new URLSearchParams("title=Hello%2520world&b=heading:Raw spaces here&b=bullets:one|two&s=p%3AFirst%0Asteps%3Aa%7Cb"), IDS);
  assert.equal(r.doc.title, "Hello world");
  assert.deepEqual(r.doc.blocks.map((b) => b.type), ["h", "list", "p", "steps"]);
});

test("unknown block types become paragraphs, with a warning", () => {
  const r = parseExperience(new URLSearchParams("title=x&b=widget:hello"), IDS);
  assert.equal(r.doc.blocks[0].type, "p");
  assert.ok(r.warnings.some((w) => w.includes("rendered as a paragraph")));
});

test("refuses unsafe links: javascript:, data:, http:, credentials", () => {
  for (const href of ["javascript:alert(1)", "data:text/html,<b>x</b>", "http://example.org", "https://user:pw@example.org/"]) {
    const r = parseExperience(new URLSearchParams({ title: "x", b: `link:${href}|click` }), IDS);
    assert.equal(r.doc.blocks.length, 0, href);
    assert.ok(r.warnings.some((w) => w.startsWith("link rejected")), href);
  }
});

test("markup is data, not markup: tags survive only as text", () => {
  const r = parseExperience(new URLSearchParams({ title: "<script>alert(1)</script>", b: "p:<img src=x onerror=alert(1)>" }), IDS);
  assert.equal(r.doc.title, "<script>alert(1)</script>"); // rendered by React as escaped text
  assert.equal((r.doc.blocks[0] as { text: string }).text, "<img src=x onerror=alert(1)>");
});

test("strips bidi overrides and control characters", () => {
  const r = parseExperience(new URLSearchParams({ title: "safe‮txt.exe\u0007" }), IDS);
  assert.equal(r.doc.title, "safetxt.exe");
});

test("computation blocks accept only address-shaped paths; research blocks only known nodes", () => {
  const r = parseExperience(new URLSearchParams([["title", "x"], ["b", "x:https://aanebed.vercel.app/x/map/eca/90/8/state/5/next"], ["b", "x:../../etc/passwd"], ["b", "research:nope"], ["b", "research:PURL"]]), IDS);
  assert.deepEqual(r.doc.blocks, [{ type: "x", address: "/map/eca/90/8/state/5/next" }, { type: "research", id: "purl" }]);
});

test("bounded: blocks, block length, URL length", () => {
  const q = new URLSearchParams({ title: "x" });
  for (let i = 0; i < 60; i++) q.append("b", "p:" + "y".repeat(3000));
  const r = parseExperience(q, IDS, 20000);
  assert.equal(r.doc.blocks.length, LIMITS.blocks);
  assert.ok(r.doc.blocks.every((b) => (b as { text: string }).text.length <= LIMITS.blockChars));
  assert.ok(r.errors.some((e) => e.includes("limit")));
});

test("empty is an error, not a crash", () => {
  assert.ok(parseExperience(new URLSearchParams(""), IDS).errors.length > 0);
});
