import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseExperience } from "../../src/lib/experience";
import { toPearl, pearlId } from "../../src/lib/pearl/model";
import { RESEARCH_IDS } from "../../src/lib/pearl/resolve";
import {
  emptyWorkspace, addPearl, updatePearlMeta, removePearl, createSpace, renameSpace, deleteSpace, createProject, addTask, toggleTask,
  exportWorkspace, planImport, applyImport, addNote,
} from "../../src/lib/pearl/workspace";
import { LocalWorkspaceRepository, MemoryStorage, STORAGE_KEY } from "../../src/lib/pearl/local-repository";

const IDS = new Set(RESEARCH_IDS);
const FIX = readFileSync(new URL("../fixtures/claude-2026-10-08.url", import.meta.url), "utf8").trim();
const fixture = toPearl(parseExperience(FIX.slice(FIX.indexOf("?") + 1), IDS).doc);
const other = toPearl(parseExperience("title=Second&b1=p:x", IDS).doc);

test("save, rename, tag, pin, move, delete; duplicates are detected by full digest", () => {
  let ws = emptyWorkspace();
  const a = addPearl(ws, fixture, { source: "pasted", origin: "pasted text" });
  ws = a.ws;
  assert.equal(a.duplicate, false);
  assert.equal(ws.pearls[0].id, pearlId(fixture));
  assert.equal(ws.tasks.filter((t) => t.source === "pearl").length, 2, "the fixture's two open threads become tasks");
  assert.equal(addPearl(ws, fixture, { source: "opened", origin: "x" }).duplicate, true);
  ws = updatePearlMeta(ws, a.record.id, { name: "2am", tags: ["  claude ", "", "continuity"], pinned: true });
  assert.equal(ws.pearls[0].name, "2am");
  assert.deepEqual(ws.pearls[0].tags, ["claude", "continuity"]);
  assert.equal(ws.pearls[0].pearl.title, "Abed & Claude, 2am", "renaming is local metadata; the Pearl is unchanged");
  ws = createSpace(ws, "Night shift");
  const night = ws.spaces.find((s) => s.name === "Night shift")!;
  ws = updatePearlMeta(ws, a.record.id, { spaceId: night.id });
  ws = renameSpace(ws, night.id, "Late");
  const d = deleteSpace(ws, night.id);
  assert.equal(d.moved, 1);
  assert.equal(d.to, "Archive");
  ws = d.ws;
  assert.equal(ws.pearls[0].spaceId, "s_archive", "deleting a space moves its contents, never deletes them");
  ws = removePearl(ws, a.record.id);
  assert.equal(ws.pearls.length, 0);
  assert.equal(ws.tasks.length, 0);
});

test("export → import into an empty browser: identical records; tampering and version errors rejected", () => {
  let ws = emptyWorkspace();
  ws = addPearl(ws, fixture, { source: "pasted", origin: "pasted" }).ws;
  ws = addPearl(ws, other, { source: "pasted", origin: "pasted" }).ws;
  ws = createProject(ws, "Pearl launch");
  ws = addTask(ws, "Write the report", ws.projects[0].id);
  ws = toggleTask(ws, ws.tasks[ws.tasks.length - 1].id);
  ws = addNote(ws, { kind: "project", id: ws.projects[0].id }, "Ship on Vercel");
  const json = JSON.stringify(exportWorkspace(ws));

  const plan = planImport(emptyWorkspace(), json);
  assert.ok(plan.ok);
  assert.equal(plan.add.length, 2);
  assert.equal(plan.rejected.length, 0);
  const ws2 = applyImport(emptyWorkspace(), plan);
  assert.deepEqual(ws2.pearls.map((p) => p.pearl).sort((a, b) => a.title.localeCompare(b.title)), [fixture, other].sort((a, b) => a.title.localeCompare(b.title)));
  assert.equal(ws2.projects[0].name, "Pearl launch");

  const again = planImport(ws2, json);
  assert.equal(again.add.length, 0);
  assert.equal(again.duplicates.length, 2, "re-importing reports duplicates instead of overwriting");

  const tampered = JSON.parse(json);
  tampered.pearls[0].pearl.title = "Edited after export";
  const t = planImport(emptyWorkspace(), JSON.stringify(tampered));
  assert.equal(t.add.length, 1);
  assert.equal(t.rejected.length, 1);
  assert.match(t.rejected[0].reason, /does not hash/);

  assert.equal(planImport(emptyWorkspace(), JSON.stringify({ ...JSON.parse(json), version: 2 })).ok, false);
  assert.equal(planImport(emptyWorkspace(), "not json").ok, false);
  assert.equal(planImport(emptyWorkspace(), JSON.stringify({ format: "other" })).ok, false);
});

test("local repository: round trip, and corrupt storage is moved aside, not lost", () => {
  const storage = new MemoryStorage();
  const repo = new LocalWorkspaceRepository(storage);
  const ws = addPearl(repo.load(), fixture, { source: "pasted", origin: "p" }).ws;
  repo.save(ws);
  assert.equal(new LocalWorkspaceRepository(storage).load().pearls[0].pearl.title, "Abed & Claude, 2am");
  storage.setItem(STORAGE_KEY, "{broken");
  const r2 = new LocalWorkspaceRepository(storage);
  const loaded = r2.load();
  assert.equal(loaded.pearls.length, 0);
  assert.ok(r2.recovered && storage.getItem(r2.recovered) === "{broken", "the corrupt data is kept under a recovery key");
});

test("an updated Pearl is a new record that points at the original; the original is unchanged", () => {
  let ws = addPearl(emptyWorkspace(), fixture, { source: "pasted", origin: "p" }).ws;
  const updated = toPearl(parseExperience(FIX.slice(FIX.indexOf("?") + 1) + "&b=action:Point+the+domain+tonight", IDS).doc);
  const r = addPearl(ws, updated, { source: "pasted", origin: "p", derivedFrom: pearlId(fixture) });
  ws = r.ws;
  assert.equal(ws.pearls.length, 2);
  assert.equal(r.record.derivedFrom, pearlId(fixture));
  assert.notEqual(r.record.id, pearlId(fixture));
  assert.deepEqual(ws.pearls.find((p) => p.id === pearlId(fixture))!.pearl, fixture);
});

import { validate } from "../../scripts/lib/schema";
test("exports and Pearl records validate against the published schemas", () => {
  const pearlSchema = JSON.parse(readFileSync(new URL("../../public/schemas/pearl.schema.json", import.meta.url), "utf8"));
  const exportSchema = JSON.parse(readFileSync(new URL("../../public/schemas/pearl-export.schema.json", import.meta.url), "utf8"));
  assert.deepEqual(validate(pearlSchema, JSON.parse(JSON.stringify(fixture))), []);
  let ws = addPearl(emptyWorkspace(), fixture, { source: "pasted", origin: "p" }).ws;
  ws = createProject(ws, "P");
  const doc = JSON.parse(JSON.stringify(exportWorkspace(ws)));
  // $ref to the pearl schema is external; validate the envelope, then each embedded Pearl.
  const env = JSON.parse(JSON.stringify(exportSchema));
  env.properties.pearls.items.properties.pearl = { type: "object" };
  assert.deepEqual(validate(env, doc), []);
  for (const r of doc.pearls) assert.deepEqual(validate(pearlSchema, r.pearl), []);
});

test("no active source references the old custom domain as the deployment origin", () => {
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const hits = execSync("grep -rn 'abedkadaan\\.com' src scripts public --include=*.ts --include=*.tsx --include=*.json || true", { encoding: "utf8" })
    .split("\n").filter(Boolean)
    .filter((l) => !l.startsWith("src/config/origin.ts")) // the migration allowlist
    .filter((l) => !l.startsWith("src/content/evidence.ts")); // evidence records are historical observations about that domain
  assert.deepEqual(hits, []);
});
