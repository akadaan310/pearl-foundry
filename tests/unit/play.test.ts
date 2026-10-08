import { test } from "node:test";
import assert from "node:assert/strict";
import { initialMachine, legal, step, VERBS } from "../../src/lib/living/sevenVerbs";
import { initialSurface, legalMoves, perform, status, control } from "../../src/lib/living/surface";
import { resolve } from "../../src/lib/address";

test("Seven Verbs follow url-machine.md: IDLE → BOUND → WRITING → COMMITTED → BUILT, illegal moves refused", () => {
  let m = initialMachine();
  assert.deepEqual(legal(m, "s1"), ["START"]);
  assert.ok(step(m, "s1", "COMMIT").refused);
  let r = step(m, "s1", "START"); m = r.machine;
  assert.equal(r.after, "BOUND");
  r = step(m, "s1", "SWITCH"); m = r.machine;
  assert.equal(r.next, "/map/eca/90/8/state/5/next");
  assert.doesNotThrow(() => resolve(r.next!));
  assert.ok(!legal(m, "s1").includes("COMMIT"), "COMMIT needs a draft");
  r = step(m, "s1", "WRITE", "h:Rule 90"); m = r.machine;
  r = step(m, "s1", "WRITE"); m = r.machine; // default: x: the session's address
  assert.equal(r.after, "WRITING");
  r = step(m, "s1", "COMMIT"); m = r.machine;
  assert.match(r.result, /p_[0-9a-z]{16}/);
  assert.deepEqual(legal(m, "s1").filter((v) => v === "WRITE" || v === "SWITCH"), [], "COMMITTED only BUILDs (or TALKs, PERTURBs)");
  r = step(m, "s1", "BUILD"); m = r.machine;
  assert.equal(r.after, "BUILT");
  assert.match(m.sessions[0].built!.link, /\/e\?type=/);
  // TALK goes through the harness, PERTURB is reversible
  r = step(m, "s1", "TALK", "hello"); m = r.machine;
  assert.deepEqual(m.sessions[1].inbox, ["you: hello"]);
  assert.equal(m.log.at(-1)!.to, "s2");
  const x = (u: string) => (resolve(u).value as { x: number }).x;
  const x0 = x(m.sessions[0].url!);
  m = step(m, "s1", "PERTURB", "3").machine;
  assert.notEqual(x(m.sessions[0].url!), x0);
  m = step(m, "s1", "PERTURB", "3").machine;
  assert.equal(x(m.sessions[0].url!), x0, "the same flip restores the state (the address keeps both moves: it is logged)");
  assert.ok(m.log.every((e) => VERBS.includes(e.op) && e.idstamp && e.from));
});

test("Seven Verbs: a draft with an invalid block FAILS to build, with the parser's reason", () => {
  let m = step(initialMachine(), "s1", "START").machine;
  m = step(m, "s1", "WRITE", "link:http://not-https.example").machine;
  m = step(m, "s1", "COMMIT").machine;
  const r = step(m, "s1", "BUILD");
  assert.equal(r.after, "FAILED");
  assert.match(r.machine.sessions[0].errors.join(" "), /link rejected/);
});

test("Shared surface: authority is visible; crossing ownership and credentials are refused; convergence holds", () => {
  let s = initialSurface();
  // the operator does not own t1 (the pilot's): only read/shot are offered on it
  const rMoves = legalMoves(s, "r").filter((m) => m.tab === "t1").map((m) => m.verb);
  assert.deepEqual(rMoves.sort(), ["read", "shot"]);
  s = perform(s, "r", "tap", "t1");
  assert.equal(s.log.at(-1)!.allowed, false);
  assert.match(s.log.at(-1)!.output, /belongs to abed/);
  s = perform(s, "r", "newtab", null);
  assert.ok(status(s).converged);
  s = perform(s, "r", "tap", "t2");
  assert.equal(s.log.at(-1)!.allowed, true);
  assert.ok(status(s).converged, "delivered over the relay: T and P hash equal");
  s = perform(s, "r", "type", "t2", "my password is hunter2");
  assert.equal(s.log.at(-1)!.allowed, false);
  s = perform(s, "abed", "closetab", "t2"); // the pilot may act on any tab
  assert.equal(s.log.at(-1)!.allowed, true);
  // a dropped op is never silent
  s = perform(control(s, "drop"), "n", "newtab", null);
  assert.deepEqual(status(s).divergence, ["op-lost"]);
  s = control(s, "resync");
  assert.ok(status(s).converged);
});
