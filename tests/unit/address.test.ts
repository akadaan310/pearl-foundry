import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, AddressError, ecaStep } from "../../src/lib/address";
import { canonical, sha256 } from "../../src/lib/canonical";

const vectors = JSON.parse(readFileSync(new URL("../../verification/substrateio-vectors.json", import.meta.url), "utf8"));

test("sha256 matches node:crypto", () => {
  for (const s of ["", "abc", "a".repeat(55), "a".repeat(56), "a".repeat(64), "é漢🙂", "x".repeat(1000)]) {
    assert.equal(sha256(s), createHash("sha256").update(s, "utf8").digest("hex"));
  }
});

test("canonical matches Python json.dumps(sort_keys, compact, ensure_ascii)", () => {
  assert.equal(canonical({ b: 1, a: [true, null, "é"] }), '{"a":[true,null,"\\u00e9"],"b":1}');
});

for (const v of vectors.vectors) {
  test(`agrees with substrateIO ${vectors.commit.slice(0, 7)}: ${v.address}`, () => {
    if (v.status === 200) {
      const r = resolve(v.address);
      assert.equal(r.kind, v.kind);
      assert.deepEqual(r.value, v.value);
      assert.equal(r.identity.value_sha256, v.value_sha256);
    } else {
      assert.throws(() => resolve(v.address), (e: unknown) => e instanceof AddressError && e.status === v.status && e.code === v.error_code);
    }
  });
}

test("rule 90 on 8 cells: f(5) = 136", () => assert.equal(ecaStep(90, 8, 5), 136));

test("refuses what it must refuse", () => {
  const refuse = (p: string, status: number) =>
    assert.throws(() => resolve(p), (e: unknown) => e instanceof AddressError && e.status === status, p);
  refuse("/map/eca/90/17", 422); // larger than this resolver's limit
  refuse("/map/eca/90/8/state/5/trace/257", 422);
  refuse("/map/eca/90/8/state/5/exec", 404);
  refuse("/map/eca/90/8/state/-1", 400);
  refuse("/map/eca/90/8/state/1e3", 400);
  refuse("/map/eca/90/8/state/5" + "/next".repeat(12), 422);
  refuse("/" + "a".repeat(300), 414);
  refuse("", 400);
});

test("pure: the same address gives the same hash", () => {
  const a = resolve("/map/eca/110/16/state/1/trace/64").identity.value_sha256;
  const b = resolve("/map/eca/110/16/state/1/trace/64").identity.value_sha256;
  assert.equal(a, b);
});
