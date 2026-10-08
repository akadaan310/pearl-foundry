/**
 * Live-origin smoke test. A real HTTP client (no browser, no AI fetcher)
 * requests each route and records URL, status, content type, redirects and
 * response shape. Never writes anything to the server.
 *
 *   npm run test:smoke                       # https://aanebed.vercel.app
 *   BASE_URL=http://localhost:3100 npm run test:smoke
 *   SMOKE_OUT=verification/smoke-after.json npm run test:smoke
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ORIGIN } from "../src/config/origin";

const BASE = (process.env.BASE_URL ?? ORIGIN).replace(/\/$/, "");
const OUT = process.env.SMOKE_OUT;
const fixture = readFileSync(new URL("../tests/fixtures/claude-2026-10-08.url", import.meta.url), "utf8").trim().replace(ORIGIN, "");

type Check = (r: { status: number; type: string; body: string; json: any }) => string | null; // null = ok, else the problem
const isJson = (want = 200): Check => (r) => (r.status !== want ? `status ${r.status}` : !r.type.includes("json") ? `type ${r.type}` : r.json === undefined ? "not JSON" : null);
const isHtml = (want = 200, must?: string): Check => (r) => (r.status !== want ? `status ${r.status}` : !r.type.includes("html") ? `type ${r.type}` : must && !r.body.includes(must) ? `missing “${must}”` : null);

const CASES: { name: string; path: string; check: Check }[] = [
  { name: "home: come here", path: "/", check: isHtml(200, "Come here.") },
  { name: "how it works (the previous home)", path: "/how", check: isHtml(200, "Your AI can make a Pearl") },
  { name: "game page", path: "/g/ttt/4~you/0~ai-a", check: isHtml(200, "How it got here") },
  { name: "game JSON: board and legal moves", path: "/api/v1/game/ttt/4~you/0~claude", check: (r) => isJson()(r) ?? (r.json.board !== "O---X----" || r.json.legal_moves?.length !== 7 ? `board ${r.json.board}` : null) },
  { name: "game: an illegal move is 422", path: "/api/v1/game/ttt/4/4", check: isJson(422) },
  { name: "clock", path: "/clock", check: isHtml(200, "A clock that keeps its own time.") },
  { name: "loom", path: "/loom/110/16/1", check: isHtml(200, "A loom that weaves from one rule.") },
  { name: "garden", path: "/garden", check: isHtml(200) },
  { name: "report", path: "/report", check: isHtml(200, "Tell us what happened.") },
  { name: "developers", path: "/developers", check: isHtml(200, "The Pearl Runtime Substrate") },
  { name: "substrate status is honest and hides the base", path: "/api/substrate/status", check: (r) => isJson()(r) ?? (!["not_configured", "unreachable", "connected"].includes(r.json.kind) ? `kind ${r.json.kind}` : /129\.213|8477/.test(r.body) ? "leaks the substrate address" : null) },
  { name: "compose", path: "/compose", check: isHtml(200) },
  { name: "prompts", path: "/prompts", check: isHtml(200) },
  { name: "workspace", path: "/workspace", check: isHtml(200) },
  { name: "create", path: "/create", check: isHtml(200, "Conversation Keeper") },
  { name: "create/recipe", path: "/create/recipe", check: isHtml(200, "Recipe Space") },
  { name: "spaces", path: "/spaces", check: isHtml(200) },
  { name: "explore", path: "/explore", check: isHtml(200, "The web is becoming programmable") },
  { name: "capabilities", path: "/capabilities", check: isHtml(200, "hash.sha256") },
  { name: "capabilities.json", path: "/capabilities.json", check: (r) => isJson()(r) ?? (r.json.engines?.find((e: { id: string }) => e.id === "julia")?.status !== "not available" ? "julia must be listed as not available" : null) },
  { name: "hash capability", path: "/api/v1/hash?text=hello", check: (r) => isJson()(r) ?? (r.json.sha256 !== "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824" ? "wrong digest" : null) },
  { name: "text capability", path: "/api/v1/text/slug?text=Hello+World", check: (r) => isJson()(r) ?? (r.json.result !== "hello-world" ? `result ${r.json.result}` : null) },
  { name: "live address page", path: "/live/map/eca/90/8/state/5/next", check: isHtml(200, "Rule 90 · state 136") },
  { name: "live: a bad address explains itself", path: "/live/map/eca/90/8/state/999", check: isHtml(200, "out_of_range") },
  { name: "play", path: "/play", check: isHtml(200, "START, SWITCH, WRITE, COMMIT, BUILD, TALK, PERTURB.") },
  { name: "compare", path: "/compare", check: isHtml(200) },
  { name: "living.describe (address)", path: "/api/v1/living?u=/x/map/eca/90/8/state/5", check: (r) => isJson()(r) ?? (r.json.record?.affordances?.find((a: { command: string }) => a.command === "next")?.href !== "/map/eca/90/8/state/5/next" ? "NEXT does not lead to …/next" : null) },
  { name: "pearl.fork keeps the parent", path: "/api/v1/pearl/fork?u=" + encodeURIComponent(fixture), check: (r) => isJson()(r) ?? (r.json.fork?.from !== r.json.parent?.id ? "fork.from ≠ parent" : null) },
  { name: "pearl.diff names a closed thread", path: "/api/v1/pearl/diff?a=" + encodeURIComponent("/e?title=A&b1=thread:x") + "&b=" + encodeURIComponent("/e?title=A&b1=thread:x&b2=close:x"), check: (r) => isJson()(r) ?? (r.json.diff?.continuity?.closed?.[0] !== "x" ? "no thread → close" : null) },
  { name: "/e.json carries the living record", path: fixture.replace("/e?", "/e.json?"), check: (r) => isJson()(r) ?? (r.json.living?.format !== "living/1" ? "no living record" : null) },
  { name: "v1 Pearl id unchanged", path: fixture.replace("/e?", "/e.json?"), check: (r) => (r.json?.pearl?.id !== "p_rg86c59j7jmqp0w1" ? `id ${r.json?.pearl?.id}` : null) },
  { name: "research.json", path: "/research.json", check: (r) => isJson()(r) ?? (r.json.identity?.url !== ORIGIN ? `identity.url = ${r.json.identity?.url}` : null) },
  { name: "verify/ingress.json", path: "/verify/ingress.json", check: isJson() },
  { name: "llms.txt", path: "/llms.txt", check: (r) => (r.status !== 200 ? `status ${r.status}` : !r.body.includes(ORIGIN + "/e?") ? "no link to the active origin" : /abedkadaan\.com\/(e|compose|c)\b/.test(r.body) ? "links to the old domain" : null) },
  { name: "ai.txt", path: "/ai.txt", check: (r) => (r.status !== 200 ? `status ${r.status}` : !r.type.includes("text/plain") ? `type ${r.type}` : null) },
  { name: ".well-known/ai", path: "/.well-known/ai", check: (r) => isJson()(r) ?? (!r.json.compose?.pearl ? "no Pearl section" : null) },
  { name: "/x registry", path: "/x", check: isJson() },
  { name: "computation address", path: "/x/map/eca/90/8/state/5/next", check: (r) => isJson()(r) ?? (r.json.value?.x !== 136 ? `x = ${r.json.value?.x}` : null) },
  { name: "reported Claude Pearl (/e)", path: fixture, check: isHtml(200, "7abeebi") },
  { name: "reported Claude Pearl (/e.json): 12 blocks", path: fixture.replace("/e?", "/e.json?"), check: (r) => isJson()(r) ?? (r.json.document?.blocks?.length !== 12 ? `${r.json.document?.blocks?.length} blocks` : null) },
  { name: "numbered blocks", path: "/e.json?title=N&b1=h:One&b2=p:Two&b3=list:a|b", check: (r) => isJson()(r) ?? (r.json.document?.blocks?.length !== 3 ? `${r.json.document?.blocks?.length} blocks` : null) },
  { name: "s= with literal \\n (3 lines)", path: "/e.json?s=h:Hello%5Cnp:World%5Cnlist:a%7Cb", check: (r) => isJson()(r) ?? (r.json.document?.blocks?.length !== 3 ? `${r.json.document?.blocks?.length} blocks` : null) },
  { name: "s= with %0A (3 lines)", path: "/e.json?s=h:Hello%0Ap:World%0Alist:a%7Cb", check: (r) => isJson()(r) ?? (r.json.document?.blocks?.length !== 3 ? `${r.json.document?.blocks?.length} blocks` : null) },
  { name: "malformed Pearl → 422", path: "/e.json?title=", check: isJson(422) },
  { name: "oversized Pearl → 422", path: "/e.json?title=x&b1=p:" + "y".repeat(8200), check: isJson(422) },
  { name: "unknown Pearl id → unavailable page", path: "/p/p_0123456789abcdef", check: isHtml(200) },
  { name: "corrupted portable payload", path: "/p/p_0123456789abcdef.AAAA", check: isHtml(200, "unavailable") },
  { name: "404", path: "/no-such-page", check: isHtml(404) },
];

async function main() {
  const rows = [];
  for (const c of CASES) {
    const url = BASE + c.path;
    let row: Record<string, unknown>;
    try {
      const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "pearls-smoke/1" } });
      const body = await res.text();
      const type = res.headers.get("content-type") ?? "";
      let json: unknown;
      try { json = JSON.parse(body); } catch { json = undefined; }
      const problem = c.check({ status: res.status, type, body, json });
      row = { name: c.name, url: url.length > 140 ? url.slice(0, 137) + "…" : url, status: res.status, type, redirect: res.headers.get("location"), bytes: body.length, outcome: problem ? "FAIL" : "PASS", problem };
    } catch (e) {
      row = { name: c.name, url, status: null, outcome: "FAIL", problem: `request failed: ${(e as Error).message}` };
    }
    rows.push(row);
    console.log(`${row.outcome}  ${String(row.status).padEnd(4)} ${c.name}${row.problem ? "  — " + row.problem : ""}`);
  }
  const passed = rows.filter((r) => r.outcome === "PASS").length;
  console.log(`\n${passed}/${rows.length} passed against ${BASE}`);
  if (OUT) writeFileSync(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), client: "Node.js fetch (a real HTTP client)", passed: `${passed}/${rows.length}`, rows }, null, 2) + "\n");
  if (passed !== rows.length) process.exitCode = 1;
}
main();
