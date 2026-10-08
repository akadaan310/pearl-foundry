import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validate } from "../../scripts/lib/schema";
import { researchManifest, aiManifest, llmsTxt, aiTxt } from "../../src/lib/manifest";
import { CLAIMS, NODES, RELATIONS } from "../../src/content/research";
import { EVIDENCE } from "../../src/content/evidence";
import { TAXONOMY } from "../../src/content/site";

const schema = JSON.parse(readFileSync(new URL("../../public/schemas/research-manifest.schema.json", import.meta.url), "utf8"));

test("the research manifest validates against its published schema", () => {
  assert.deepEqual(validate(schema, JSON.parse(JSON.stringify(researchManifest()))), []);
});

test("the validator rejects a manifest with an unknown status", () => {
  const bad = JSON.parse(JSON.stringify(researchManifest()));
  bad.claims[0].status = "PROVEN";
  assert.ok(validate(schema, bad).length > 0);
});

test("every demonstrated claim cites existing evidence; no dangling evidence ids", () => {
  const ids = new Set(EVIDENCE.map((e) => e.id));
  for (const c of CLAIMS) {
    for (const e of c.evidence) assert.ok(ids.has(e), `${c.id} cites unknown ${e}`);
    if (TAXONOMY[c.status].tier === "demonstrated") assert.ok(c.evidence.length > 0, `${c.id} is demonstrated without evidence`);
  }
});

test("every relation connects known nodes and cites a source", () => {
  const ids = new Set(NODES.map((n) => n.id));
  for (const r of RELATIONS) { assert.ok(ids.has(r.from) && ids.has(r.to)); assert.ok(r.source.length > 3); }
});

test("every node states demonstrated, proposed and open separately, and its limitations", () => {
  for (const n of NODES) {
    assert.ok(n.demonstrated.length && n.proposed.length && n.open.length && n.limitations.length, n.id);
  }
});

test("the AI manifest permits agents GET only, takes no credentials, and is labelled", () => {
  const m = aiManifest();
  assert.equal(m.permissions.accepts.credentials, false);
  assert.ok(m.permissions.allowed.every((a) => a.method === "GET"));
  assert.match(m.notice, /Machine-readable research instructions/);
});

test("llms.txt follows the llmstxt.org shape; ai.txt names author, permissions and prohibitions", () => {
  const l = llmsTxt();
  assert.match(l, /^# Pearl Foundry\n\n> /);
  assert.match(l, /\n## Machine interface\n/);
  const a = aiTxt();
  for (const s of ["MACHINE-READABLE RESEARCH INSTRUCTIONS", "Author:", "WHAT YOU MAY DO", "WHAT YOU MAY NOT DO", "WHAT TO RETURN", "BOUNDARIES"]) assert.ok(a.includes(s), s);
});

test("no marketing fiction: no invented metrics vocabulary in the record", () => {
  const all = JSON.stringify(researchManifest());
  for (const w of ["customers", "revenue", "investors", "award", "patent", "funding", "users served", "millions"]) {
    assert.ok(!all.toLowerCase().includes(w), `found "${w}"`);
  }
});
