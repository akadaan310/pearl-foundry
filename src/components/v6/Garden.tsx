"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readTrail, garden, TRAIL_KEY, type TrailEntry, type TrailKind } from "@/lib/v6/trail";
import { useWorkspace } from "@/components/pearl/useWorkspace";

const VERB: Record<TrailKind, string> = { opened: "opened", made: "made", forked: "made your own", kept: "kept", returned: "came back from an AI", moved: "moved", gave: "given to an AI" };
const TONE: Record<TrailKind, string> = { opened: "#a7a5c2", made: "#86e3bb", forked: "#86e3bb", kept: "#f2cb7b", returned: "#c7b8ff", moved: "#86e3bb", gave: "#c7b8ff" };

/** Your Pearls as a living constellation: things you opened, made, kept, gave to an AI and got back. */
export function Garden() {
  const [trail, setTrail] = useState<TrailEntry[] | null>(null);
  const [substrate, setSubstrate] = useState<string | null>(null);
  const { ws, ready } = useWorkspace();
  useEffect(() => {
    const load = () => { try { setTrail(readTrail(localStorage)); } catch { setTrail([]); } };
    load();
    window.addEventListener("pearls:trail", load);
    window.addEventListener("storage", (e) => { if (e.key === TRAIL_KEY) load(); });
    fetch("/api/substrate/status").then((r) => r.json()).then((s) => setSubstrate(s.kind)).catch(() => setSubstrate("unknown"));
    return () => window.removeEventListener("pearls:trail", load);
  }, []);

  const g = useMemo(() => garden(trail ?? []), [trail]);
  const nodes = g.nodes.slice(-40);
  const W = 720, H = 420, cx = W / 2, cy = H / 2;
  const pos = new Map(nodes.map((n, i) => { const a = i * 2.39996; const r = 40 + Math.sqrt(i + 1) * 28; return [n.url, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) * 0.62 }]; }));

  if (trail === null) return <p className="text-ink-3">Looking around…</p>;
  if (!nodes.length && !(ready && ws.pearls.length)) {
    return (
      <div className="glass p-8 text-center">
        <div className="orb orb-float mx-auto h-20 w-20" aria-hidden="true" />
        <p className="mt-6 font-serif text-3xl">Nothing here yet.</p>
        <p className="mt-2 text-ink-2">Open something, touch it, give it to an AI. It will start to grow here.</p>
        <Link href="/" className="btn-glow mt-6">Come here</Link>
      </div>
    );
  }
  const whoAll = [...new Set(g.nodes.flatMap((n) => n.who).filter((w) => w && w !== "you"))];
  return (
    <div className="space-y-10">
      {nodes.length > 0 && (
        <div className="glass overflow-hidden p-3">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true" focusable="false">
            {g.edges.filter((e) => pos.has(e.from) && pos.has(e.to)).map((e, i) => { const a = pos.get(e.from)!, b = pos.get(e.to)!; return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={TONE[e.kind]} strokeOpacity="0.5" strokeWidth="1.5" />; })}
            {nodes.map((n) => { const p = pos.get(n.url)!; const k = n.kinds.includes("returned") ? "returned" : n.kinds.includes("kept") ? "kept" : n.kinds.includes("made") || n.kinds.includes("forked") ? "made" : "opened"; return (
              <g key={n.url}><circle cx={p.x} cy={p.y} r={k === "opened" ? 6 : 9} fill={TONE[k as TrailKind]} opacity="0.9" /><circle cx={p.x} cy={p.y} r={k === "opened" ? 12 : 18} fill={TONE[k as TrailKind]} opacity="0.12" /></g>
            ); })}
          </svg>
        </div>
      )}
      {whoAll.length > 0 && <p className="text-ink-2">AIs that joined, by the names they gave: {whoAll.join(", ")}. <span className="text-ink-3">Self-declared; not verified.</span></p>}
      <section aria-labelledby="g-trail">
        <h2 id="g-trail" className="zone-title mb-4">Where you&apos;ve been</h2>
        <ol className="space-y-2">
          {[...g.nodes].reverse().slice(0, 40).map((n) => (
            <li key={n.url} className="glass flex flex-wrap items-center gap-3 !rounded-2xl px-4 py-3">
              <Link href={n.url} className="min-w-0 flex-1 font-medium text-ink">{n.title}</Link>
              <span className="text-[0.82rem] text-ink-3">{n.kinds.map((k) => VERB[k]).join(" · ")}{n.who.filter((w) => w !== "you").length ? ` · ${n.who.filter((w) => w !== "you").join(", ")}*` : ""}</span>
            </li>
          ))}
        </ol>
      </section>
      {ready && ws.pearls.length > 0 && (
        <section aria-labelledby="g-kept">
          <h2 id="g-kept" className="zone-title mb-4">Kept in this browser</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ws.pearls.slice(-12).reverse().map((p) => <li key={p.id}><Link href={`/workspace?pearl=${p.id}`} className="glass pearl-tile block p-4"><span className="font-serif text-lg">{p.name}</span><span className="mt-1 block font-mono text-[0.72rem] text-ink-3">{p.id}</span></Link></li>)}</ul>
        </section>
      )}
      <div className="glass p-5 text-[0.92rem] text-ink-2">
        <p className="font-medium text-ink">This garden lives in this browser.</p>
        <p className="mt-1">It doesn&apos;t sync and there&apos;s no account yet: the substrate that will remember you across devices is {substrate === "connected" ? "connected, but sign-in is not available in production yet" : "not connected to this site yet"}. Every link still works anywhere, because each thing lives in its link.</p>
      </div>
    </div>
  );
}
