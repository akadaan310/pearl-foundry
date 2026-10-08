import { test } from "node:test";
import assert from "node:assert/strict";
import { EXPERIENCES, linesFor } from "../../src/content/experiences";
import { parseExperience, experienceUrl } from "../../src/lib/experience";
import { toPearl } from "../../src/lib/pearl/model";
import { RESEARCH_IDS } from "../../src/lib/pearl/resolve";
import { resolve } from "../../src/lib/address";
import { ORIGIN } from "../../src/config/origin";

test("every Create experience's example builds a valid Pearl of its declared type, with no warnings", () => {
  assert.equal(EXPERIENCES.length, 8);
  for (const e of EXPERIENCES) {
    const { title, lines } = linesFor(e, { title: e.example.title, ...e.example.values });
    const url = experienceUrl(ORIGIN, { title, by: "Pearls Create", session: `create-${e.id}`, lines });
    const u = new URL(url);
    u.searchParams.set("type", e.type);
    const r = parseExperience(u.searchParams, new Set(RESEARCH_IDS), u.toString().length);
    assert.deepEqual(r.errors, [], e.id);
    assert.deepEqual(r.warnings, [], e.id);
    assert.equal(toPearl(r.doc).type, e.type, e.id);
    assert.ok(r.doc.blocks.length >= 2, `${e.id} has content`);
    assert.ok(e.prompt.includes(`${ORIGIN}/llms.txt`), `${e.id} prompt is standalone`);
  }
});

test("the computation experience produces an address the /x registry resolves", () => {
  const e = EXPERIENCES.find((x) => x.id === "computation")!;
  const { lines } = linesFor(e, e.example.values);
  const addr = lines[0].slice(2);
  assert.equal(resolve(addr).kind, "trace");
  assert.equal(linesFor(e, { rule: "999; drop", n: "16", x: "1", steps: "4" }).lines[0], "x:/map/eca/30/16/state/1/trace/4", "non-numeric input falls back, never injects");
});

test("pipes inside list items cannot split items; claims carry their status", () => {
  const e = EXPERIENCES.find((x) => x.id === "research")!;
  const { lines } = linesFor(e, { title: "Q", observed: "a | b", hypothesis: "h" });
  assert.deepEqual(lines, ["claim:observed|a | b", "claim:hypothesis|h"]);
  const r = EXPERIENCES.find((x) => x.id === "recipe")!;
  assert.equal(linesFor(r, { title: "x", ingredients: "salt|pepper\noil" }).lines[0], "list:salt/pepper|oil");
});
