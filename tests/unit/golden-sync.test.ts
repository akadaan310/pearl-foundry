import { test } from "node:test";
import assert from "node:assert/strict";
import { initial, issue, deliver, resend, setLink, phoneChange, classify, converged, type World } from "../../src/lib/goldenSync";

const drain = (w: World) => { while (w.channel.length) w = deliver(w); return w; };

test("normal ops converge within one round trip", () => {
  let w = issue(initial(), { cmd: "newtab", tab: "t2", owner: "r", url: "https://a.example/" });
  assert.deepEqual(classify(w), ["op-in-flight"]);
  w = drain(w);
  assert.ok(converged(w));
  assert.deepEqual(classify(w), []);
});

test("a dropped op is classified op-lost; the next op triggers nack and resend; replicas converge", () => {
  let w = initial();
  w = { ...w, dropNext: true };
  w = issue(w, { cmd: "newtab", tab: "t2", owner: "r", url: "https://a.example/" });
  assert.deepEqual(classify(w), ["op-lost"]);
  w = issue(w, { cmd: "open", tab: "t2", url: "https://b.example/" });
  w = drain(w);
  assert.ok(w.log.some((l) => l.kind === "nack"));
  assert.ok(converged(w), JSON.stringify(classify(w)));
});

test("Resync (replay) recovers a dropped op", () => {
  let w = { ...initial(), dropNext: true };
  w = issue(w, { cmd: "newtab", tab: "t2", owner: "n", url: "https://a.example/" });
  w = drain(resend(w, "resync"));
  assert.ok(converged(w));
});

test("an op issued while the phone is offline is queued and redelivered on reconnect", () => {
  let w = setLink(initial(), "down");
  w = issue(w, { cmd: "newtab", tab: "t2", owner: "r", url: "https://a.example/" });
  assert.ok(classify(w).includes("link-down"));
  w = drain(setLink(w, "up"));
  assert.ok(converged(w));
  assert.equal(w.P.tabs.length, 2);
});

test("a phone-side change is adopted by the twin; pending ops are re-applied on top", () => {
  let w = issue(initial(), { cmd: "newtab", tab: "t2", owner: "r", url: "https://a.example/" });
  w = phoneChange(w, { cmd: "newtab", tab: "p1", owner: "abed", url: "https://phone.example/" });
  w = drain(w);
  assert.ok(converged(w));
  assert.deepEqual(w.P.tabs.map((t) => t.id).sort(), ["p1", "t1", "t2"]);
});

test("a rejected op is reported as op-rejected and the replicas still agree", () => {
  let w = issue(initial(), { cmd: "open", tab: "t1", url: "ftp://x" });
  w = drain(w);
  assert.ok(classify(w).includes("op-rejected"));
  assert.equal(w.T.pending.length, 0);
});
