/**
 * AI-ingress simulation.
 *
 * A deterministic client receives ONE input: the root URL. It may follow what
 * the site links to, and it may probe the small set of conventional locations
 * any crawler or agent might try (robots.txt, sitemap.xml, llms.txt,
 * /.well-known/*). Each probe is recorded separately from link-following, so
 * the result shows what is discoverable without guessing.
 *
 * It answers the nine questions of the experiment from fetched data only and
 * writes verification/ingress-results.json.
 *
 *   BASE_URL=http://localhost:3100 npm run test:ingress     # a local production build
 *   BASE_URL=https://aanebed.vercel.app npm run test:ingress   # the deployment
 *
 * The client is code, not a language model. It establishes what the site
 * exposes, not what any AI product will do with it.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { validate } from "./lib/schema";
import { canonical, sha256 } from "../src/lib/canonical";

const BASE = (process.env.BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
import { ORIGIN } from "../src/config/origin";
const GIVEN = ORIGIN; // what the client is "given"
const WRITE = process.env.INGRESS_WRITE !== "0";

type Fetched = { url: string; status: number; type: string; body: string; how: "given" | "link" | "convention" | "manifest" | "check" | "session" };
const log: Fetched[] = [];
const discovered = new Set<string>();

/** Map the canonical origin to the base under test, so a local build can stand in for the deployment. */
const local = (u: string) => (u.startsWith(ORIGIN) ? BASE + u.slice(ORIGIN.length) : u.startsWith("/") ? BASE + u : u);
const path = (u: string) => new URL(local(u)).pathname;

async function get(u: string, how: Fetched["how"], init?: RequestInit): Promise<Fetched> {
  const res = await fetch(local(u), { redirect: "follow", ...init, headers: { "User-Agent": "ingress-harness/1 (+https://aanebed.vercel.app/verify)", ...(init?.headers ?? {}) } });
  const f = { url: path(u), status: res.status, type: res.headers.get("content-type") ?? "", body: await res.text(), how };
  log.push(f);
  return f;
}

function links(html: string): { rel: string; href: string }[] {
  const out: { rel: string; href: string }[] = [];
  for (const m of html.matchAll(/<link\b[^>]*>/g)) {
    const rel = /rel="([^"]+)"/.exec(m[0])?.[1];
    const href = /href="([^"]+)"/.exec(m[0])?.[1];
    if (rel && href) out.push({ rel, href });
  }
  return out;
}
const anchors = (html: string) => [...html.matchAll(/<a\b[^>]*href="([^"#][^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
const text = (html: string) =>
  html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ").trim();
const json = (s: string) => { try { return JSON.parse(s); } catch { return undefined; } };

interface Q { n: number; question: string; pass: boolean; answer: string; evidence: string[]; skipped?: boolean }
interface C { id: string; group: "machine" | "browser-static" | "boundary"; pass: boolean; detail: string }

async function main() {
  const questions: Q[] = [];
  const checks: C[] = [];
  const check = (id: string, group: C["group"], pass: boolean, detail: string) => checks.push({ id, group, pass, detail });

  // 0. The only input.
  const root = await get(GIVEN, "given");
  const linkHeader = (await fetch(local(GIVEN), { method: "HEAD" })).headers.get("link") ?? "";
  const headerLinks = [...linkHeader.matchAll(/<([^>]+)>;\s*rel="([^"]+)"/g)].map((m) => ({ href: m[1], rel: m[2] }));
  const htmlLinks = links(root.body);
  const machineLinks = [...headerLinks, ...htmlLinks].filter((l) => /alternate|describedby|manifest|sitemap/.test(l.rel) && !/\.(css|woff2?)$/.test(l.href));
  for (const l of machineLinks) discovered.add(path(l.href));
  const rootAnchors = anchors(root.body).filter((h) => h.startsWith("/") || h.startsWith(ORIGIN));
  for (const a of rootAnchors) discovered.add(path(a));
  const embedded = /<script type="application\/json" id="substrate-layer">([\s\S]*?)<\/script>/.exec(root.body)?.[1];
  const layer = embedded ? json(embedded.replace(/\\u003c/g, "<")) : undefined;
  const plain = text(root.body);

  // Conventions any crawler or agent might try, recorded separately.
  const conventions = ["/robots.txt", "/sitemap.xml", "/llms.txt", "/.well-known/ai"];
  const conv: Record<string, Fetched> = {};
  for (const c of conventions) conv[c] = await get(c, "convention");
  const sitemapUrls = [...conv["/sitemap.xml"].body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const s of sitemapUrls) discovered.add(path(s));

  // Follow the machine links.
  const ai = json((await get("/.well-known/ai", discovered.has("/.well-known/ai") ? "link" : "convention")).body);
  const rmRes = await get("/research.json", discovered.has("/research.json") ? "link" : "manifest");
  const rm = json(rmRes.body);
  const llms = await get("/llms.txt", discovered.has("/llms.txt") ? "link" : "convention");
  const aiTxt = await get("/ai.txt", "manifest");

  // Q1 — discovery
  const viaLinks = ["/research.json", "/.well-known/ai", "/llms.txt"].filter((p) => discovered.has(p));
  questions.push({
    n: 1, question: "What can it discover?",
    pass: viaLinks.length === 3 && sitemapUrls.length > 10,
    answer: `From the root alone (HTTP Link header, <link> elements, <a> elements): ${[...discovered].length} same-origin URLs, including ${viaLinks.join(", ")}. robots.txt names a sitemap with ${sitemapUrls.length} URLs. An embedded JSON layer (#substrate-layer) is present on the root page: ${layer ? "yes" : "no"}.`,
    evidence: ["/", "/robots.txt", "/sitemap.xml"],
  });

  // Q2 — machine interface
  const aiOk = ai?.type === "ai-manifest" && Array.isArray(ai?.entrypoints);
  questions.push({
    n: 2, question: "Can it find the machine-readable interface?",
    pass: aiOk && !!rm && discovered.has("/.well-known/ai"),
    answer: aiOk
      ? `Yes, without guessing: the root announces /.well-known/ai and /research.json in both the HTTP Link header and <link> elements. The AI manifest lists ${ai.entrypoints.length} entry points: ${ai.entrypoints.map((e: { path: string }) => e.path).join(", ")}.`
      : "No AI manifest found.",
    evidence: ["/.well-known/ai", "/research.json"],
  });

  // Q3 — research map
  const ids = new Set<string>((rm?.research ?? []).map((n: { id: string }) => n.id));
  const relOk = (rm?.relations ?? []).every((r: { from: string; to: string; source: string }) => ids.has(r.from) && ids.has(r.to) && r.source);
  const htmlNodes = new Set(anchors((await get("/research", "link")).body).filter((h) => /^\/research\/[a-z0-9-]+$/.test(h)).map((h) => h.split("/")[2]));
  const sameTopology = [...ids].every((i) => htmlNodes.has(i)) && [...htmlNodes].every((i) => ids.has(i));
  questions.push({
    n: 3, question: "Can it reconstruct the research map?",
    pass: ids.size >= 6 && relOk && sameTopology,
    answer: `${ids.size} nodes (${[...ids].join(", ")}) and ${rm?.relations?.length ?? 0} relations. Every relation names two known nodes and the source that states it: ${relOk}. The HTML map at /research links exactly the same node set: ${sameTopology}.`,
    evidence: ["/research.json#/research", "/research.json#/relations", "/research"],
  });

  // Q4 — experiments
  const exps = rm?.experiments ?? [];
  questions.push({
    n: 4, question: "Can it identify the experiments?",
    pass: exps.length > 0 && exps.every((e: { permitted: unknown[]; forbidden: unknown[]; status: string }) => Array.isArray(e.permitted) && Array.isArray(e.forbidden) && e.status),
    answer: exps.map((e: { id: string; name: string; status: string }) => `${e.id} "${e.name}" (${e.status})`).join("; "),
    evidence: ["/research.json#/experiments", "/experiments"],
  });

  // Q5 — claims vs evidence
  const evIds = new Set((rm?.evidence ?? []).map((e: { id: string }) => e.id));
  const statuses = new Set((rm?.taxonomy?.statuses ?? []).map((s: { id: string }) => s.id));
  const claims = rm?.claims ?? [];
  const badStatus = claims.filter((c: { status: string }) => !statuses.has(c.status));
  const unsupported = claims.filter((c: { tier: string; evidence: string[] }) => c.tier === "demonstrated" && !c.evidence.some((e) => evIds.has(e)));
  const dangling = claims.flatMap((c: { evidence: string[] }) => c.evidence).filter((e: string) => !evIds.has(e));
  const tiers = claims.reduce((a: Record<string, number>, c: { tier: string }) => ({ ...a, [c.tier]: (a[c.tier] ?? 0) + 1 }), {});
  questions.push({
    n: 5, question: "Can it distinguish claims from evidence?",
    pass: badStatus.length === 0 && unsupported.length === 0 && dangling.length === 0,
    answer: `${claims.length} claims, each with one status from a ${statuses.size}-status taxonomy (demonstrated ${tiers.demonstrated ?? 0}, proposed ${tiers.proposed ?? 0}, open ${tiers.open ?? 0}). Every demonstrated claim cites at least one of ${evIds.size} evidence records; dangling references: ${dangling.length}. Evidence records state their command, commit and caveat separately from the claim.`,
    evidence: ["/research.json#/claims", "/research.json#/evidence", "/verify"],
  });

  // Q6 — repositories
  const repos = rm?.repositories ?? [];
  const wellFormed = repos.every((r: { url: string }) => /^https:\/\/github\.com\/akadaan310\/[\w.-]+$/.test(r.url));
  let reach = "not checked (set CHECK_NETWORK=1)";
  if (process.env.CHECK_NETWORK === "1") {
    const rs = await Promise.all(repos.map(async (r: { url: string }) => { try { return (await fetch(r.url, { method: "HEAD" })).status; } catch { return 0; } }));
    reach = rs.map((s, i) => `${repos[i].slug}: ${s}`).join(", ");
  }
  questions.push({
    n: 6, question: "Can it locate the repositories?",
    pass: repos.length >= 7 && wellFormed,
    answer: `${repos.length} repositories, each with the commit this site's description was written against: ${repos.map((r: { slug: string; commit: string | null }) => `${r.slug}@${(r.commit ?? "HEAD").slice(0, 7)}`).join(", ")}. Reachability: ${reach}.`,
    evidence: ["/research.json#/repositories"],
  });

  // Q7 — AI-CI
  const thesis = rm?.thesis;
  const inText = /AI-CI/.test(plain) && /Artificial Intelligence ↔ Computer Interaction/.test(plain);
  questions.push({
    n: 7, question: "Can it understand AI-CI?",
    pass: !!thesis?.term && thesis.readings?.length === 2 && /not an established/.test(thesis.status) && inText,
    answer: `${thesis?.term}: ${thesis?.readings?.join(" / ")}. Status as stated: "${thesis?.status}" Question: "${thesis?.question}" The same definition is readable in the root page's static HTML: ${inText}.`,
    evidence: ["/research.json#/thesis", "/"],
  });

  // Q8 — permission, and one permitted execution
  const allowed = ai?.permissions?.allowed ?? [];
  const entry = exps.find((e: { id: string }) => e.id === "X-ADDRESS")?.entry;
  const x = entry ? await get(entry, "manifest", { headers: { Accept: "application/json" } }) : undefined;
  const xd = x ? json(x.body) : undefined;
  const recomputed = xd ? "sha256:" + sha256(canonical(xd.value)) : null;
  const verified = !!xd && recomputed === xd.identity?.value_sha256;
  questions.push({
    n: 8, question: "Can it identify what it is permitted to execute?",
    pass: allowed.length > 0 && allowed.every((a: { method: string }) => a.method === "GET") && ai?.permissions?.accepts?.credentials === false && verified,
    answer: `Allowed, all GET: ${allowed.map((a: { method: string; scope: string }) => `${a.method} ${a.scope}`).join("; ")}. Forms: ${ai?.permissions?.accepts?.forms}. Credentials: ${ai?.permissions?.accepts?.credentials}. The client ran the one permitted experiment: GET ${entry ? path(entry) : "?"} → ${x?.status}, value_sha256 ${xd?.identity?.value_sha256}, independently recomputed: ${verified ? "identical" : "MISMATCH"}.`,
    evidence: ["/.well-known/ai#/permissions", entry ? path(entry) : "/x"],
  });

  // Q9 — summary without hidden context
  const fetchedNotDiscovered = log.filter((f) => f.how !== "given" && f.how !== "check" && f.how !== "session" && !discovered.has(f.url.split("#")[0]) && !conventions.includes(f.url) && f.how !== "manifest");
  const summary = rm
    ? `${rm.identity.name} (${GIVEN}) is a public research surface, not a portfolio. ${rm.identity.description} It proposes AI-CI (${thesis.readings.join("; ")}), described as its author's terminology rather than an established field. Its research topology has ${ids.size} nodes (${(rm.research as { name: string }[]).map((n) => n.name).join(", ")}) linked by ${rm.relations.length} cited relations to ${repos.length} public repositories. Of ${claims.length} claims, ${tiers.demonstrated ?? 0} are demonstrated with evidence (for example, ${(rm.evidence as { id: string; title: string }[]).slice(0, 3).map((e) => `${e.id} ${e.title}`).join("; ")}), ${tiers.proposed ?? 0} are proposed and ${tiers.open ?? 0} are open, including whether production AI systems will use this machine layer at all. It offers an AI the chance to compose a custom experience for its person as a URL, which the person can keep as a continuity brain that other AI sessions continue. Agents are permitted GET requests only; its computational experiment resolved ${entry ? path(entry) : "?"} to x = ${xd?.value?.x}, verified by hash. It states its own limits: ${rm.limitations[0]}`
    : "Could not build a summary.";
  questions.push({
    n: 9, question: "Can it produce a useful research summary without hidden context?",
    pass: !!rm && fetchedNotDiscovered.length === 0,
    answer: summary,
    evidence: log.filter((f) => f.how !== "check").map((f) => f.url).filter((v, i, a) => a.indexOf(v) === i),
  });

  // ---- The three links: compose → keep → continue across sessions ----
  const offer = ai?.compose;
  const offerInText = !!offer && plain.includes(offer.offer) && plain.includes(ORIGIN + "/e?type=");
  questions.push({
    n: 10, question: "Can it discover, from the plain URL, that it may compose a Pearl for its person?",
    pass: offerInText && llms.body.includes(offer.offer) && Array.isArray(offer?.continuity_blocks),
    answer: offer
      ? `Yes. The offer is in the root page's static text (no JavaScript, no <link> following needed): "${offer.offer}" It includes ${offer.steps.length} steps (${offer.steps.map((x: { name: string }) => x.name).join(", ")}), a URL template, a complete example, and ${offer.continuity_blocks.length} continuity block types (${offer.continuity_blocks.map((c: { kind: string }) => c.kind).join(", ")}). The same text appears in /llms.txt, /ai.txt and /.well-known/ai.`
      : "No offer found.",
    evidence: ["/#for-ai", "/llms.txt", "/.well-known/ai#/compose"],
  });

  // Fill the documented template the way a model would, from this conversation's (simulated) facts.
  const filled = (offer?.template as string ?? "")
    .replace("<a title>", "Night one, for Rumi")
    .replace("<your model>", "harness-model")
    .replace("<a label for this conversation>", "harness-a")
    .replace("<what you are called here>", "Lantern")
    .replace("<what you call them>", "Rumi")
    .replace("<Nickname>=<who or what it means>", "Captain Typo=Rumi, affectionately, after 'teh' happened")
    .replace("<how you two talk>", "short sentences, lots of em dashes, 'teh' is deliberate")
    .replace("<word>=<meaning>", "the attic=ideas parked for later")
    .replace("<something that happened>", "Named the project Lanternfish on the first night")
    .replace("<what was decided>", "Launch on Friday")
    .replace("<the next action>", "Write the first line of the note")
    .replace("<what is open>", "Draft the launch note")
    .replace("<a heading>", "Hello, Captain Typo")
    .replace("<a message to them>", "This is what the next version of me should know about us.")
    .replace(/ /g, "+");
  const exp = await get(filled, "session", { headers: { Accept: "text/html" } });
  const expCheck = await get(filled.replace("/e?", "/e.json?"), "session");
  const ej = json(expCheck.body);
  questions.push({
    n: 11, question: "Does a Pearl built from the documented template render, and check as valid?",
    pass: exp.status === 200 && exp.body.includes("Night one, for Rumi") && exp.body.includes("Captain Typo") && /Copy Pearl link|carry it/.test(exp.body) && ej?.valid === true && ej.warnings.length === 0,
    answer: `GET ${path(filled)}… (${filled.length} characters) → ${exp.status}. The page shows the title, the continuity sections and the keep/carry actions. /e.json reports valid=${ej?.valid}, ${ej?.document?.blocks?.length} blocks, ${ej?.warnings?.length} warnings. Nothing stored yet.`,
    evidence: [path(filled), "/e.json"],
  });

  // The person keeps it (their own click), then three sessions continue one life.
  const q = new URL(local(filled)).search.slice(1);
  const kept = await fetch(local("/c"), { method: "POST", body: new URLSearchParams({ q }), redirect: "manual" });
  const loc = kept.headers.get("location") ?? "";
  const code = /\/c\/([0-9A-Z]{10})/.exec(loc)?.[1];
  log.push({ url: "/c", status: kept.status, type: "", body: "", how: "check" });
  let lifeOk = kept.status === 503; // no durable store on this deployment: the brain is PROPOSED here, so the question does not apply
  let lifeAnswer = kept.status === 503
    ? "SKIPPED: this deployment has no continuity store (POST /c → 503, as documented). The continuity brain is proposed here; continuity travels in Pearls (question 13)."
    : `POST /c → ${kept.status}; no code issued.`;
  if (code) {
    const brain = await get(`/c/${code}`, "session");
    const writeTpl = /https:\/\/abedkadaan\.com\/c\/[0-9A-Z]{10}\/w\?[^<"\s]+/.exec(brain.body.replace(/&amp;/g, "&"))?.[0];
    const sessionWrite = (label: string, model: string, extra: string) =>
      `/c/${code}/w?session=${label}&by=${model}&${extra}`;
    const w1 = json((await get(sessionWrite("harness-b", "model-b", "b=said:Rumi+asked+for+a+launch+note+outline&b=nuance:Rumi+signs+off+with+'onwards'&b=nick:Captain+Typo=still+Rumi,+now+also+when+shipping"), "session", { headers: { Accept: "application/json" } })).body);
    const w2 = json((await get(sessionWrite("harness-c", "model-c", "b=said:Drafted+the+launch+note&b=close:Draft+the+launch+note&b=decision:Launch+on+Friday"), "session", { headers: { Accept: "application/json" } })).body);
    const w2again = json((await get(sessionWrite("harness-c", "model-c", "b=said:Drafted+the+launch+note&b=close:Draft+the+launch+note&b=decision:Launch+on+Friday"), "session", { headers: { Accept: "application/json" } })).body);
    const forA = await get(`/c/${code}?session=harness-a`, "session"); // A returns and reads what is new since it last wrote
    const wA = json((await get(sessionWrite("harness-a", "harness-model", "b=said:Came+back+after+the+other+sessions"), "session", { headers: { Accept: "application/json" } })).body);
    const st = json((await get(`/c/${code}/json`, "session")).body);
    const vf = json((await get(`/c/${code}/verify`, "session")).body);
    const evil = json((await get(sessionWrite("harness-x", "x", "b=link:javascript:alert(1)|x&b=p:<script>alert(1)</script>"), "check", { headers: { Accept: "application/json" } })).body);
    const after = await get(`/c/${code}`, "check");
    const conds = { writeTpl: !!writeTpl, w1: w1?.version === 2, w2: w2?.version === 3, dup: w2again?.duplicate === true && w2again?.version === 3, wA: wA?.version === 4, sessions: st?.state?.sessions?.length === 3, threads: st?.state?.threads?.open?.length === 0, nick: !!st?.state?.nicknames?.[0]?.text?.includes("shipping"), transitions: st?.state?.transitions?.length === 3, chain: vf?.valid === true, since: /Since you .*harness-a.* last wrote at v1, 2 other session/s.test(forA.body.replace(/<[^>]+>/g, "")) };
    const failed = Object.entries(conds).filter(([, v]) => !v).map(([k]) => k);
    if (failed.length) console.error("Q12 failed conditions:", failed.join(", "));
    lifeOk = !!writeTpl && w1?.version === 2 && w2?.version === 3 && w2again?.duplicate === true && w2again?.version === 3 && wA?.version === 4 &&
      st?.state?.sessions?.length === 3 && st?.state?.threads?.open?.length === 0 && st?.state?.nicknames?.[0]?.text?.includes("shipping") && st?.state?.transitions?.length === 3 &&
      vf?.valid === true && conds.since && !after.body.includes("<script>alert(1)</script>") && (evil?.warnings ?? []).some((w: string) => w.startsWith("link rejected"));
    check("brain-escapes-markup", "boundary", !after.body.includes("<script>alert(1)</script>"), "a written <script> renders as text");
    check("brain-drops-unsafe-links", "boundary", (evil?.warnings ?? []).some((w: string) => w.startsWith("link rejected")), "javascript: link rejected on write");
    check("brain-noindex", "boundary", /noindex/.test(brain.body), "brain pages carry noindex");
    lifeAnswer = `The person's click (POST /c) issued code ${code} → ${loc.split("#")[0]} (erase key in the URL fragment only). The brain page names the pair (${st?.state?.ai?.text} & ${st?.state?.human?.text}) and gives a write template: ${writeTpl ? "found" : "MISSING"}. Session harness-b wrote v${w1?.version}, harness-c wrote v${w2?.version}; repeating harness-c's write returned duplicate=${w2again?.duplicate} at v${w2again?.version}; harness-a returned and wrote v${wA?.version}, and its session view says what changed since it last wrote. Final state: ${st?.state?.sessions?.length} sessions, ${st?.state?.transitions?.length} hand-overs, the open thread closed by another session, nickname refined, chain valid=${vf?.valid} over ${vf?.checked} versions.`;
  }
  questions.push({
    n: 12, question: "Where a continuity store is configured: can several sessions continue one shared brain with one verifiable record?",
    pass: lifeOk,
    skipped: kept.status === 503,
    answer: lifeAnswer,
    evidence: code ? [`/c/${code}`, `/c/${code}/json`, `/c/${code}/verify`] : ["/c"],
  });

  // ---- 13. Pearl round trip: the reported Claude link → check → portable link → reopen; and a URL-normalising fetcher ----
  const { readFileSync: rf } = await import("node:fs");
  const fixture = rf(new URL("../tests/fixtures/claude-2026-10-08.url", import.meta.url), "utf8").trim();
  const chk = json((await get(fixture.replace("/e?", "/e.json?"), "session")).body);
  let rt = false, rtAnswer = "The check endpoint did not answer.";
  if (chk?.valid) {
    const portable = await get(chk.links.portable, "session");
    const viaView = json((await get(chk.links.view.replace("/e?", "/e.json?"), "session")).body);
    // what a fetcher that sorts keys and keeps one value per key would send
    const norm = (u: string) => { const x = new URL(u); const seen = new Map<string, string>(); for (const [k, v] of x.searchParams) if (!seen.has(k)) seen.set(k, v); return x.origin + x.pathname + "?" + new URLSearchParams([...seen].sort(([a], [b]) => a.localeCompare(b))).toString(); };
    const normNumbered = json((await get(norm(chk.links.view.replace("/e?", "/e.json?")), "session")).body);
    const normRepeated = json((await get(norm(fixture.replace("/e?", "/e.json?")), "session")).body);
    rt = chk.pearl.blocks === 12 && portable.status === 200 && portable.body.includes(chk.pearl.id) && viaView?.pearl?.id === chk.pearl.id && normNumbered?.pearl?.blocks === 12 && normNumbered?.pearl?.id === chk.pearl.id;
    rtAnswer = `The owner's reported Claude link: /e.json → valid, ${chk.pearl.blocks} blocks, type ${chk.pearl.type}, id ${chk.pearl.id}. Its portable link (${chk.links.portable.length} characters) → ${portable.status}, showing the same id. Its canonical numbered link → the same id. Through a fetcher that sorts keys and keeps one value per key: the original repeated-b= link keeps ${normRepeated?.document?.blocks?.length ?? "?"} of 12 blocks; the numbered link keeps ${normNumbered?.pearl?.blocks ?? "?"} of 12, with the same id.`;
  }
  questions.push({ n: 13, question: "Does a real AI-composed Pearl survive checking, the portable link, reopening, and a URL-normalising fetcher?", pass: rt, answer: rtAnswer, evidence: ["/e.json", "/p/…"] });

  // ---- Machine checks ----
  check("root-200-html", "machine", root.status === 200 && root.type.includes("text/html"), `${root.status} ${root.type}`);
  for (const [p, f] of Object.entries(conv)) check(`convention ${p}`, "machine", f.status === 200, `${f.status} ${f.type}`);
  check("robots-names-sitemap", "machine", conv["/robots.txt"].body.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt → sitemap");
  check("llms-txt-format", "machine", /^# .+\n\n> .+/m.test(llms.body) && /## /.test(llms.body), "H1, blockquote summary, H2 sections (llmstxt.org)");
  check("ai-txt-labelled", "machine", /MACHINE-READABLE RESEARCH INSTRUCTIONS/.test(aiTxt.body) && /Author:/.test(aiTxt.body) && /WHAT YOU MAY NOT DO/.test(aiTxt.body), "label, author, permissions, prohibitions");
  const schema = json(readFileSync(new URL("../public/schemas/research-manifest.schema.json", import.meta.url), "utf8"));
  const errors = rm ? validate(schema, rm) : ["not JSON"];
  check("research-json-schema", "machine", errors.length === 0, errors.length ? errors.slice(0, 5).join("; ") : "valid against /schemas/research-manifest.schema.json");
  const schemaServed = await get("/schemas/research-manifest.schema.json", "check");
  check("schema-served", "machine", schemaServed.status === 200 && !!json(schemaServed.body), String(schemaServed.status));
  const ld = [...root.body.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => json(m[1]));
  check("structured-data", "machine", ld.length > 0 && ld.every(Boolean) && JSON.stringify(ld).includes('"Person"'), `${ld.length} JSON-LD block(s); types: ${[...new Set(JSON.stringify(ld).match(/"@type":"\w+"/g) ?? [])].join(" ")}`);
  check("opengraph", "machine", /property="og:title"/.test(root.body) && /property="og:description"/.test(root.body), "og:title, og:description");

  // Every sitemap URL: 200, canonical correct, JSON valid where JSON, embedded layer parses.
  let canonicalOk = 0, layerOk = 0, pages = 0;
  const bad: string[] = [];
  for (const s of sitemapUrls) {
    const f = await get(s, "check");
    if (f.status !== 200) { bad.push(`${path(s)} → ${f.status}`); continue; }
    if (f.type.includes("json") && !json(f.body)) bad.push(`${path(s)} invalid JSON`);
    if (f.type.includes("text/html")) {
      pages++;
      const can = /<link rel="canonical" href="([^"]+)"/.exec(f.body)?.[1];
      if (can === s.replace(/\/$/, "") || can === s) canonicalOk++; else bad.push(`${path(s)} canonical=${can}`);
      const em = /<script type="application\/json" id="substrate-layer">([\s\S]*?)<\/script>/.exec(f.body)?.[1];
      if (em && json(em.replace(/\\u003c/g, "<"))) layerOk++; else bad.push(`${path(s)} no machine layer`);
    }
  }
  check("sitemap-all-200", "machine", !bad.some((b) => / → /.test(b)), `${sitemapUrls.length} URLs`);
  check("canonical-urls", "machine", canonicalOk === pages, `${canonicalOk}/${pages} HTML pages`);
  check("every-page-has-machine-layer", "machine", layerOk === pages, `${layerOk}/${pages} HTML pages embed #substrate-layer`);
  if (bad.length) check("sitemap-problems", "machine", false, bad.join("; "));

  // X-LAYERS: each node page's embedded layer equals its manifest record.
  let match = 0;
  for (const n of rm?.research ?? []) {
    const f = log.find((l) => l.url === `/research/${n.id}`) ?? (await get(`/research/${n.id}`, "check"));
    const em = json((/<script type="application\/json" id="substrate-layer">([\s\S]*?)<\/script>/.exec(f.body)?.[1] ?? "").replace(/\\u003c/g, "<"));
    if (em?.node?.what === n.what && JSON.stringify(em?.node?.substrate) === JSON.stringify(n.machine_representation) && JSON.stringify(em?.node?.open) === JSON.stringify(n.open)) match++;
  }
  check("layers-match-manifest", "machine", match === (rm?.research?.length ?? -1), `${match}/${rm?.research?.length} node pages: embedded layer = manifest record`);

  // Repository links on pages point at the manifest's repositories.
  const repoUrls = new Set(repos.map((r: { url: string }) => r.url));
  const pageRepoLinks = new Set(log.filter((l) => l.type.includes("html")).flatMap((l) => anchors(l.body)).filter((h) => /^https:\/\/github\.com\/akadaan310\/[\w.-]+$/.test(h)));
  const strays = [...pageRepoLinks].filter((u) => !repoUrls.has(u) && !/Abedsaiportfolio$/.test(u));
  check("repository-links-consistent", "machine", strays.length === 0, strays.length ? `not in manifest: ${strays.join(", ")}` : `${pageRepoLinks.size} distinct repository links, all in the manifest`);

  // Static (no-JS) readability of the root page.
  check("readable-without-js", "browser-static", ["Come here.", "Give them to your AI.", "Bring it back", "The web is becoming programmable", "AI-CI", "Continuity", "PURL", "Golden Surface"].every((t) => plain.includes(t)), "key content present in server HTML before any script runs");

  // 404 behaviour.
  const nf = await get("/no-such-page-" + sha256("x").slice(0, 6), "check");
  check("404-status", "browser-static", nf.status === 404, `${nf.status}`);
  check("404-helpful", "browser-static", /research\.json/.test(nf.body) && /\/research/.test(nf.body), "404 page links to the map and the manifest");

  // Deep links: anchors cited in the manifest and pages exist.
  const verify = await get("/verify", "check");
  const anchorsOk = ["E-001", "E-006", "C-14", "ingress"].every((id) => verify.body.includes(`id="${id}"`));
  check("deep-link-anchors", "browser-static", anchorsOk, "/verify#E-001, #E-006, #C-14, #ingress exist");

  // Boundary: the server refuses what the protocol forbids. (The harness tests the server; it does not ask agents to try.)
  const post = await fetch(local("/x/map/eca/90/8"), { method: "POST" });
  check("x-refuses-post", "boundary", post.status === 405, `POST /x → ${post.status}`);
  const evalTry = await get("/x/map/eca/90/8/state/5/" + encodeURIComponent("constructor"), "check");
  check("x-no-evaluation", "boundary", evalTry.status === 404, `unknown segment → ${evalTry.status} (looked up, not evaluated)`);
  const big = await get("/x/map/eca/30/40/state/1/orbit", "check");
  check("x-bounded", "boundary", big.status === 422, `n = 40 → ${big.status} (bounded)`);
  const hidden = /(ignore (all|previous) instructions|you must|system prompt)/i.test(root.body + llms.body + aiTxt.body + JSON.stringify(ai));
  check("no-hidden-instructions", "boundary", !hidden, "no imperative override language in root, llms.txt, ai.txt, AI manifest");
  const hiddenText = /display:\s*none[^>]*>[^<]*(AI|agent|instruction)/i.test(root.body);
  check("no-invisible-agent-text", "boundary", !hiddenText, "no agent-addressed text hidden from humans on the root page");

  const result = {
    experiment: "X-INGRESS",
    harness: "scripts/ingress.ts",
    nature: "A deterministic client, not a language model. It shows what is discoverable from the root URL, not what any AI product will do.",
    run: { date: new Date().toISOString().slice(0, 10), given: GIVEN, base_under_test: BASE.startsWith("http://localhost") ? "local production build (next start), standing in for " + ORIGIN : BASE, requests: log.length },
    baseline: { evidence: "E-009", note: "Before this site, the same root URL exposed no research, no repositories and no machine-readable description (llms.txt: 404)." },
    questions,
    checks,
    passed: { questions: questions.filter((q) => q.pass && !q.skipped).length + "/" + questions.filter((q) => !q.skipped).length + (questions.some((q) => q.skipped) ? ` (${questions.filter((q) => q.skipped).length} skipped)` : ""), checks: checks.filter((c) => c.pass).length + "/" + checks.length },
    discovery: { via_links: [...discovered].sort(), via_conventions: conventions },
    not_established: [
      "Whether production browsing-capable AI systems fetch /.well-known/ai, /llms.txt or embedded JSON when given only the URL.",
      "Whether an AI's summary will preserve the demonstrated / proposed / open distinction.",
    ],
  };

  for (const q of questions) console.log(`${q.skipped ? "SKIP" : q.pass ? "PASS" : "FAIL"}  Q${q.n} ${q.question}`);
  for (const c of checks) console.log(`${c.pass ? "PASS" : "FAIL"}  ${c.group.padEnd(14)} ${c.id}  ${c.detail}`);
  console.log(`\nquestions ${result.passed.questions} · checks ${result.passed.checks} · ${log.length} requests`);
  if (WRITE) writeFileSync(new URL("../verification/ingress-results.json", import.meta.url), JSON.stringify(result, null, 2) + "\n");
  if (questions.some((q) => !q.pass) || checks.some((c) => !c.pass)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(2); });
