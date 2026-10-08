"use client";

import { useRef, useState } from "react";
import { hashJson, type Json } from "@/lib/canonical";

type Line = { kind: "req" | "out" | "note"; text: string };
interface Step { actor: string; title: string; lines: Line[] }

const STEPS = [
  { actor: "Human", title: "asks a question" },
  { actor: "Website", title: "exposes structure" },
  { actor: "Machine layer", title: "becomes available" },
  { actor: "Client", title: "interprets the representation" },
  { actor: "Client", title: "navigates the research surface" },
  { actor: "Client", title: "executes a permitted experiment" },
  { actor: "Experiment", title: "produces evidence" },
  { actor: "Human", title: "sees the result" },
];

async function get(path: string, accept = "*/*") {
  const t0 = performance.now();
  const res = await fetch(path, { headers: { Accept: accept } });
  const text = await res.text();
  return { res, text, ms: Math.round(performance.now() - t0), size: new Blob([text]).size };
}
const kb = (n: number) => (n > 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);

/**
 * The Human ↔ AI-CI demonstration. Every step performs a real request against
 * this site. The client is a deterministic script standing in for an AI: it
 * uses only what the site serves, and it does not generate language.
 */
export function IngressDemo() {
  const [done, setDone] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const memo = useRef<Record<string, unknown>>({});

  async function perform(i: number): Promise<Line[]> {
    const m = memo.current;
    switch (i) {
      case 0:
        return [{ kind: "note", text: "“What is this website?” The client receives one thing: the URL " + location.origin }];
      case 1: {
        const r = await get("/", "text/html");
        const doc = new DOMParser().parseFromString(r.text, "text/html");
        const alts = [...doc.querySelectorAll('link[rel="alternate"],link[rel="describedby"]')].map((l) => `${l.getAttribute("rel")} → ${l.getAttribute("href")}`);
        const layer = doc.getElementById("substrate-layer");
        m.alts = alts;
        return [
          { kind: "req", text: `GET / → ${r.res.status} text/html · ${kb(r.size)} · ${r.ms} ms` },
          { kind: "out", text: `HTTP Link header: ${r.res.headers.get("link") ?? "(not exposed to scripts)"}` },
          ...alts.map((a) => ({ kind: "out" as const, text: `<link> ${a}` })),
          { kind: "out", text: `<script id="substrate-layer"> present: ${layer ? "yes, " + kb(layer.textContent?.length ?? 0) : "no"}` },
          { kind: "note", text: "The page announces its machine representations without JavaScript." },
        ];
      }
      case 2: {
        const r = await get("/.well-known/ai", "application/json");
        const ai = JSON.parse(r.text);
        m.ai = ai;
        return [
          { kind: "req", text: `GET /.well-known/ai → ${r.res.status} application/json · ${kb(r.size)}` },
          { kind: "out", text: `type: ${ai.type} · site.kind: ${ai.site.kind}` },
          { kind: "out", text: `author: ${ai.author}` },
          { kind: "out", text: `allowed: ${ai.permissions.allowed.map((a: { method: string; scope: string }) => `${a.method} ${a.scope.replace(location.origin, "")}`).join(" · ")}` },
          { kind: "out", text: `accepts post/forms/credentials: ${ai.permissions.accepts.post}/${ai.permissions.accepts.forms}/${ai.permissions.accepts.credentials}` },
        ];
      }
      case 3: {
        const r = await get("/research.json", "application/json");
        const rm = JSON.parse(r.text);
        m.rm = rm;
        const tiers = rm.claims.reduce((a: Record<string, number>, c: { tier: string }) => ({ ...a, [c.tier]: (a[c.tier] ?? 0) + 1 }), {});
        return [
          { kind: "req", text: `GET /research.json → ${r.res.status} · ${kb(r.size)}` },
          { kind: "out", text: `nodes (${rm.research.length}): ${rm.research.map((n: { name: string }) => n.name).join(", ")}` },
          { kind: "out", text: `relations: ${rm.relations.length}, each with a cited source` },
          { kind: "out", text: `claims: ${rm.claims.length} · demonstrated ${tiers.demonstrated ?? 0} · proposed ${tiers.proposed ?? 0} · open ${tiers.open ?? 0}` },
          { kind: "out", text: `evidence records: ${rm.evidence.length} · repositories: ${rm.repositories.length}` },
        ];
      }
      case 4: {
        const rm = m.rm as { experiments: { id: string; name: string; status: string; entry: string; forbidden: string[] }[] };
        const x = rm.experiments.find((e) => e.id === "X-ADDRESS")!;
        m.entry = new URL(x.entry).pathname;
        return [
          ...rm.experiments.map((e) => ({ kind: "out" as const, text: `${e.id.padEnd(10)} ${e.status.padEnd(12)} ${e.name}` })),
          { kind: "note", text: `Selected ${x.id}: it is the only experiment whose manifest entry is a GET the client may perform. Forbidden: ${x.forbidden.join(" ")}` },
        ];
      }
      case 5: {
        const entry = m.entry as string;
        const r = await get(entry, "application/json");
        const d = JSON.parse(r.text);
        m.result = d;
        return [
          { kind: "req", text: `GET ${entry} → ${r.res.status} · ${r.res.headers.get("cache-control")}` },
          { kind: "out", text: `derivation: ${d.derivation.map((s: { operation: string }) => s.operation.replace("substrate.", "")).join(" → ")}` },
          { kind: "out", text: `value: ${JSON.stringify(d.value)}` },
        ];
      }
      case 6: {
        const d = m.result as { value: Json; identity: { value_sha256: string } };
        const local = hashJson(d.value);
        m.match = local === d.identity.value_sha256;
        return [
          { kind: "out", text: `server  value_sha256 ${d.identity.value_sha256}` },
          { kind: "out", text: `browser value_sha256 ${local}` },
          { kind: "note", text: m.match ? "Identical. The result is checkable without trusting the server. The same hash comes from substrateIO's Python resolver (evidence E-006)." : "Mismatch: record this as a failure." },
        ];
      }
      case 7: {
        const rm = m.rm as { identity: { name: string; description: string }; research: unknown[]; claims: { tier: string }[] };
        const d = m.result as { value: { x: number; transition: { src: number } } };
        return [
          { kind: "note", text: `${rm.identity.name}'s site is a research surface. ${rm.identity.description} It exposes ${rm.research.length} research nodes, a manifest, and an executable address. The client resolved ${m.entry as string}: f(${d.value.transition.src}) = ${d.value.x}, verified by hash. Of ${rm.claims.length} claims, ${rm.claims.filter((c) => c.tier === "open").length} are explicitly open.` },
          { kind: "note", text: "This summary was assembled by a template from fetched data. A real AI's summary would be its own interpretation, and the repositories remain the record." },
        ];
      }
    }
    return [];
  }

  const count = useRef(0);

  async function step(): Promise<boolean> {
    const i = count.current;
    if (i >= STEPS.length) return false;
    let lines: Line[];
    try {
      lines = await perform(i);
    } catch (e) {
      lines = [{ kind: "note", text: `Failed: ${(e as Error).message}` }];
    }
    count.current = i + 1;
    setDone((d) => [...d, { ...STEPS[i], lines }]);
    return true;
  }
  async function next() {
    if (busy) return;
    setBusy(true);
    await step();
    setBusy(false);
  }
  async function all() {
    if (busy) return;
    setBusy(true);
    while (await step()) { /* each step depends on the previous one */ }
    setBusy(false);
  }
  function reset() {
    count.current = 0;
    memo.current = {};
    setDone([]);
  }

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-rule p-4">
        <button type="button" className="btn btn-primary" onClick={next} disabled={busy || done.length >= STEPS.length}>
          {done.length === 0 ? "Begin" : done.length >= STEPS.length ? "Complete" : `Step ${done.length + 1}: ${STEPS[done.length].actor} ${STEPS[done.length].title}`}
        </button>
        {done.length < STEPS.length && <button type="button" className="btn" onClick={all} disabled={busy}>Run all</button>}
        {done.length > 0 && <button type="button" className="btn" onClick={reset}>Reset</button>}
        <span className="ml-auto font-mono text-[0.72rem] text-ink-3">client: deterministic script in your browser · not a language model</span>
      </div>
      <ol className="divide-y divide-rule" aria-live="polite">
        {STEPS.map((s, i) => {
          const d = done[i];
          return (
            <li key={i} className="grid gap-3 p-4 sm:grid-cols-[13rem_1fr]" data-pending={d ? undefined : "true"}>
              <div>
                <p className="label">{String(i + 1).padStart(2, "0")} · {s.actor}</p>
                <p className="font-serif text-[1.05rem]">{s.title}</p>
              </div>
              <div className="min-w-0 font-mono text-[0.76rem] leading-relaxed">
                {d ? d.lines.map((l, k) => (
                  <p key={k} className={`motion-reveal break-words ${l.kind === "req" ? "text-emerald" : l.kind === "note" ? "font-sans text-[0.88rem] text-ink" : "text-ink-2"}`} style={{ animationDelay: `${k * 60}ms` }}>
                    {l.kind === "req" ? "› " : l.kind === "out" ? "  " : ""}{l.text}
                  </p>
                )) : <p className="text-ink-3">↓ not run yet</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
