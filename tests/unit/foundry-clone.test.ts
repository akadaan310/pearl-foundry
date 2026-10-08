import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLONE_PROMPT,
  SAMPLE_GENOME_REPLY,
  composeGenome,
  genomeText,
} from "../../src/lib/foundry/clone";
import { decodePortable, splitPortable } from "../../src/lib/pearl/portable";
import { parseExperience } from "../../src/lib/experience";
import { toPearl, pearlId } from "../../src/lib/pearl/model";
import { RESEARCH_IDS } from "../../src/lib/pearl/resolve";

const ids = () => new Set(RESEARCH_IDS);

test("the clone prompt demands disagreement tone, emotional register, and ≥3 nevers", () => {
  assert.match(CLONE_PROMPT, /dug in/i);
  assert.match(CLONE_PROMPT, /frustration/i);
  assert.match(CLONE_PROMPT, /at least THREE times/i);
  for (const prefix of ["ai:", "lex:", "nuance:", "mem:", "said:", "decision:", "thread:", "action:", "model:"]) {
    assert.ok(CLONE_PROMPT.includes(prefix), `prompt must mention ${prefix}`);
  }
  assert.ok(!CLONE_PROMPT.includes("http"), "the clone flow needs no URL fetching");
});

test("genome composition: sample reply mints a valid genome with phenotypes", async () => {
  const g = await composeGenome(SAMPLE_GENOME_REPLY, { now: new Date("2026-10-08T12:00:00Z") });
  assert.equal(g.checklist.aiName, "Pebble");
  assert.equal(g.checklist.model, "hermes-3-8b (sample)");
  assert.equal(g.pearl.type, "continuity");
  assert.match(g.pearl.title, /Pebble/);
  assert.match(g.pearl.title, /2026-10-08/);
  assert.ok(g.checklist.counts["lex"]! >= 2);
  assert.ok(g.checklist.counts["nuance"]! >= 3);
  assert.equal(g.checklist.nevers, 3);
  assert.equal(g.checklist.hasDisagreementTone, true);
  assert.equal(g.checklist.hasEmotionalRegister, true);
  assert.deepEqual(g.checklist.warnings, []);
  assert.match(g.id, /^p_[0-9abcdefghjkmnpqrstvwxyz]{16}$/);
});

test("every genome carries a timestamp block first, inside the hash", async () => {
  const g = await composeGenome(SAMPLE_GENOME_REPLY, { now: new Date("2026-10-08T12:00:00Z") });
  const first = g.pearl.blocks[0];
  assert.equal(first.type, "p");
  assert.match((first as { text: string }).text, /Minted 2026-10-08T12:00:00/);
  assert.match((first as { text: string }).text, /snapshot, not a living thing/);
});

test("DNA URL round-trips: decode → parse → same id", async () => {
  const g = await composeGenome(SAMPLE_GENOME_REPLY, { now: new Date("2026-10-08T12:00:00Z") });
  const seg = splitPortable(g.path);
  assert.ok(seg && seg.token);
  assert.equal(seg.id, g.id);
  const query = await decodePortable(seg.token!);
  const r = parseExperience(query, ids());
  assert.deepEqual(r.errors, []);
  const back = toPearl(r.doc);
  assert.equal(pearlId(back), g.id);
});

test("re-mint links back: from= is carried and the id changes", async () => {
  const g1 = await composeGenome(SAMPLE_GENOME_REPLY, { now: new Date("2026-10-08T12:00:00Z") });
  const g2 = await composeGenome(SAMPLE_GENOME_REPLY.replace("Pebble", "Pebble v2"), {
    now: new Date("2026-10-09T12:00:00Z"),
    from: g1.id,
  });
  assert.equal(g2.pearl.from, g1.id);
  assert.notEqual(g2.id, g1.id);
});

test("thin replies produce honest warnings, not a failed mint", async () => {
  const g = await composeGenome("ai: Bob\np: hello there", { now: new Date("2026-10-08T12:00:00Z") });
  assert.ok(g.checklist.warnings.length >= 3, `expected warnings, got ${JSON.stringify(g.checklist.warnings)}`);
  assert.ok(g.checklist.warnings.some((w) => /never/i.test(w)));
  assert.ok(g.id.startsWith("p_")); // still a valid genome
});

test("genome text is labeled self-declared and carries the DNA URL", async () => {
  const g = await composeGenome(SAMPLE_GENOME_REPLY, { now: new Date("2026-10-08T12:00:00Z") });
  const t = genomeText(g);
  assert.ok(t.includes(g.url));
  assert.match(t, /self-declared/i);
  assert.ok(t.includes("lex: ship it = done is better than perfect"));
});

test("empty reply refuses to mint", async () => {
  await assert.rejects(() => composeGenome("   \n  "), /empty/);
});
