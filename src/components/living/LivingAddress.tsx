"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolve, AddressError } from "@/lib/address";
import { livingAddress } from "@/lib/living/address";
import type { Affordance, LivingRecord, Option } from "@/lib/living/record";
import { encodePortable } from "@/lib/pearl/portable";
import { PEARL_FORMAT, type Pearl } from "@/lib/pearl/model";
import { ORIGIN, HOST } from "@/config/origin";
import { CommandPalette } from "./CommandPalette";
import { LayerTabs, EvidenceTable, useFlash, copyText, type Layer } from "./parts";

type Transition = { from: string; op: string; to: string; n: number };

/** The ring: a pearl you can turn. Bit i is cell i; a cell is a link to the address with that bit flipped. */
function Ring({ x, n, hrefFor, linkFor, go, size = 300 }: { x: number; n: number; hrefFor: (bit: number) => string | null; linkFor: (h: string) => string; go: (e: React.MouseEvent, href: string, op: string) => void; size?: number }) {
  const R = size * 0.38, c = size / 2, r = Math.max(7, Math.min(22, (Math.PI * R) / n - 3));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="pearl-ring h-auto w-full max-w-[22rem]" role="group" aria-label={`A ring of ${n} cells, state ${x}. Each cell is a bit; activate one to perturb it.`}>
      <defs>
        <radialGradient id="pearl-body" cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="var(--pearl-hi)" />
          <stop offset="45%" stopColor="var(--pearl-mid)" />
          <stop offset="100%" stopColor="var(--pearl-lo)" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={R - r - 10} fill="url(#pearl-body)" className="pearl-body" />
      <circle cx={c} cy={c} r={R} className="fill-none stroke-rule-strong" strokeWidth="1" strokeDasharray="2 5" />
      {Array.from({ length: n }, (_, i) => {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const on = (x >> i) & 1;
        const h = hrefFor(i);
        const cell = <circle cx={c + R * Math.cos(angle)} cy={c + R * Math.sin(angle)} r={r} className={`ring-cell ${on ? "fill-emerald stroke-emerald" : "fill-panel stroke-rule-strong"}`} strokeWidth="1.5" />;
        return h ? (
          <a key={i} href={linkFor(h)} onClick={(e) => go(e, h, `/flip/${i}`)} aria-label={`bit ${i}, ${on ? "on" : "off"}: perturb it`} className="ring-link">
            <title>{`bit ${i} · ${on ? "on" : "off"} · PERTURB flips it`}</title>{cell}
          </a>
        ) : <g key={i} aria-hidden="true">{cell}</g>;
      })}
    </svg>
  );
}

export function Spacetime({ states, n, highlightFrom }: { states: number[]; n: number; highlightFrom?: number }) {
  const s = Math.max(4, Math.min(14, Math.floor(420 / n)));
  return (
    <svg width={n * s} height={states.length * s} viewBox={`0 0 ${n * s} ${states.length * s}`} className="block h-auto max-w-full" role="img" aria-label={`Space-time diagram: ${states.length} states of ${n} cells, time downward`}>
      {highlightFrom !== undefined && <rect x={0} y={highlightFrom * s} width={n * s} height={(states.length - highlightFrom) * s} className="fill-gold-deep" />}
      {states.flatMap((v, t) => Array.from({ length: n }, (_, i) => ((v >> (n - 1 - i)) & 1 ? <rect key={`${t}-${i}`} x={i * s} y={t * s} width={s - 0.8} height={s - 0.8} rx={s / 5} className="fill-emerald" /> : null)))}
    </svg>
  );
}

export function AddressBar({ address, prefix, transition, compact = false }: { address: string; prefix: string; transition: Transition | null; compact?: boolean }) {
  const shown = prefix + address;
  return (
    <div className="addressbar" aria-live="polite">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="addressbar-dot" />
        <p className="min-w-0 flex-1 break-all font-mono text-[0.8rem] sm:text-[0.86rem]"><span className="text-ink-3">{HOST}</span><span className="text-ink">{shown}</span></p>
      </div>
      {transition && !compact && (
        <p key={transition.n} className="transition-strip mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.72rem]">
          <span className="text-ink-3 line-through decoration-rule-strong">{transition.from}</span>
          <span className="rounded-full bg-gold-deep px-2 py-0.5 font-semibold text-ink">{transition.op}</span>
          <span aria-hidden="true" className="text-emerald">→</span>
          <span className="text-emerald">the address changed</span>
        </p>
      )}
    </div>
  );
}

/**
 * A computational address as a living object. In "page" mode the browser URL
 * is the address (/live/…) and every move is real navigation; in "embedded"
 * mode the address lives in the fragment (#/map/…), so the URL still changes.
 */
export function LivingAddress({ initial, mode, pearl, compact = false }: {
  initial: string;
  mode: "page" | "embedded";
  pearl?: { id: string; title: string };
  compact?: boolean;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(initial);
  const [transition, setTransition] = useState<Transition | null>(null);
  const [layer, setLayer] = useState<Layer>("surface");
  const [proof, setProof] = useState<{ browser: string; server: string | null; error?: string } | null>(null);
  const { flash, say } = useFlash();
  const seq = useRef(0);
  const explainRef = useRef<HTMLDivElement>(null);
  const prefix = mode === "page" ? "/live" : "/#";

  // page mode: the server renders each address; keep in step with it
  useEffect(() => { if (mode === "page") setAddress(initial); }, [initial, mode]);
  // embedded mode: the fragment is the address
  useEffect(() => {
    if (mode !== "embedded") return;
    const fromHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h.startsWith("/map/")) { try { resolve(h); setAddress(h); } catch { /* not an address; ignore */ } }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [mode]);

  const rec: LivingRecord | { error: string } = useMemo(() => {
    try { return livingAddress(address); } catch (e) { return { error: e instanceof AddressError ? e.message : "This address does not resolve." }; }
  }, [address]);

  const go = useCallback((href: string, op: string) => {
    setTransition({ from: prefix + address, op, to: href, n: ++seq.current });
    setProof(null);
    if (mode === "page") router.push(`/live${href}`, { scroll: false });
    else { history.pushState(null, "", `#${href}`); setAddress(href); }
  }, [address, mode, prefix, router]);

  const onLink = useCallback((e: React.MouseEvent, href: string, op: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(href, op);
  }, [go]);

  const verify = useCallback(async () => {
    setLayer("proof");
    const browser = resolve(address).identity.value_sha256;
    setProof({ browser, server: null });
    try {
      const j = await (await fetch(`/x${address}`, { headers: { Accept: "application/json" } })).json();
      setProof({ browser, server: j.identity?.value_sha256 ?? null });
    } catch { setProof({ browser, server: null, error: "The server copy could not be fetched; the browser computation stands on its own." }); }
  }, [address]);

  const fork = useCallback(async (r: LivingRecord) => {
    const p: Pearl = { format: PEARL_FORMAT, type: "computation", title: r.title, by: "a person, on Pearls", for: null, session: "live", blocks: [{ type: "h", text: r.title }, { type: "x", address: r.identity.address }, { type: "p", text: r.explanation[0].slice(0, 1400) }] };
    if (pearl) p.from = pearl.id;
    const { url } = await encodePortable(p);
    say(`Forked: a new computation Pearl${pearl ? `, derived from ${pearl.id}` : ""}. Opening it…`);
    router.push(new URL(url).pathname);
  }, [pearl, router, say]);

  const run = useCallback((a: Affordance, o?: Option) => {
    if (!("format" in rec)) return;
    const href = o?.href ?? a.href;
    if (href && a.produces === "address") return go(href, href.startsWith(address) ? href.slice(address.length) || "/" : a.label.toLowerCase());
    switch (a.command) {
      case "verify": return void verify();
      case "inspect": return setLayer("substrate");
      case "explain": setLayer("surface"); setTimeout(() => { explainRef.current?.scrollIntoView({ block: "center", behavior: "smooth" }); explainRef.current?.focus(); }, 0); return;
      case "fork": return void fork(rec);
      case "carry": return void copyText(`Here is a computational address: ${ORIGIN}/live${address}\nIts machine form: ${ORIGIN}/x${address} (value_sha256 ${rec.identity.hash}).\nIt is ${rec.title}. ${rec.explanation[0]}\nContinue by appending registered operations (/next, /flip/{bit}, /trace/{steps}, /orbit; the registry is at ${ORIGIN}/x). Tell me what happens and give me the new address.`).then((ok) => say(ok ? "Copied a message for another AI. Nothing was sent." : "Could not copy."));
      case "copy-link": return void copyText(`${ORIGIN}/live${address}`).then((ok) => say(ok ? "Address copied." : "Could not copy."));
      case "copy-id": return void copyText(rec.identity.hash).then((ok) => say(ok ? "Value hash copied: this exact value's identity." : "Could not copy."));
    }
  }, [rec, address, go, verify, fork, say]);

  if (!("format" in rec)) return <p className="text-refuse">{rec.error}</p>;
  const s = rec.state as Record<string, number | string>;
  const st = rec.type === "state";
  const perturb = rec.affordances.find((a) => a.command === "perturb");
  const primary = rec.affordances.filter((a) => ["next", "trace", "orbit", "back", "normalize", "fork", "verify"].includes(a.command));
  const value = resolve(address).value as Record<string, unknown>;

  const commands = (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-4" : "mt-5"}`}>
                {primary.map((a) => a.href ? (
                  <a key={a.command} href={mode === "page" ? `/live${a.href}` : `#${a.href}`} onClick={(e) => onLink(e, a.href!, a.href!.startsWith(address) ? a.href!.slice(address.length) : a.label.toLowerCase())} className="cmd" aria-keyshortcuts={a.key}>
                    {a.label}<kbd className="kbd">{a.key}</kbd>
                  </a>
                ) : (
                  <button key={a.command} type="button" className="cmd" onClick={() => run(a)} aria-keyshortcuts={a.key}>{a.label}<kbd className="kbd">{a.key}</kbd></button>
                ))}
                {rec.affordances.filter((a) => a.command === "open").flatMap((a) => a.options ?? []).map((o) => (
                  <a key={o.href} href={mode === "page" ? `/live${o.href}` : `#${o.href}`} onClick={(e) => onLink(e, o.href, "open")} className="cmd">OPEN {o.label}</a>
                ))}
              </div>
  );

  return (
    <div className={`living overflow-x-clip ${compact ? "living-compact" : ""}`} data-living={rec.identity.address}>
      <AddressBar address={address} prefix={prefix} transition={transition} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <LayerTabs layer={layer} setLayer={setLayer} />
        <CommandPalette affordances={rec.affordances} run={run} layer={layer} setLayer={setLayer} title={rec.title} />
      </div>

      {compact && layer === "surface" && commands}
      <div className="mt-5" role="tabpanel" aria-label={`${layer} layer`}>
        {layer === "surface" && (
          <div className={`grid items-center gap-6 ${compact ? "" : "md:grid-cols-[minmax(0,22rem)_1fr]"}`}>
            <div key={address} className={`turn mx-auto w-full ${compact ? "max-w-[17rem]" : "max-w-[22rem]"}`}>
              {rec.type === "trace" ? <Spacetime states={value.states as number[]} n={s.n as number} highlightFrom={typeof s.tail_length === "number" ? (s.tail_length as number) : undefined} />
                : <Ring x={st ? (s.x as number) : 0} n={s.n as number} hrefFor={(b) => perturb?.options?.[b]?.href ?? null} linkFor={(h) => (mode === "page" ? `/live${h}` : `#${h}`)} go={(e, h, op) => onLink(e, h, op)} />}
            </div>
            <div className="min-w-0">
              <p className="eyebrow">{rec.type === "state" ? "the object · a state" : rec.type === "map" ? "the program · no state yet" : "the history"}</p>
              <p className="mt-1 font-serif text-[clamp(1.6rem,3.4vw,2.4rem)] leading-tight">{rec.title}</p>
              {st && <p className="mt-1 font-mono text-[1rem] tracking-[0.2em] text-ink-2" aria-label={`bits ${s.bits}`}>{String(s.bits)}</p>}
              <div ref={explainRef} tabIndex={-1} className="mt-3 space-y-2 text-[0.98rem] text-ink-2 outline-none">
                {(compact ? rec.explanation.slice(0, 1) : rec.explanation).map((t, i) => <p key={i}>{t}</p>)}
              </div>
              {!compact && commands}
              {st && <p className="mt-3 text-[0.82rem] text-ink-3">Touch a cell to PERTURB it: a simulated bit flip, never a physical event.</p>}
            </div>
          </div>
        )}

        {layer === "substrate" && (
          <div className="space-y-6">
            <ol className="pipeline" aria-label="address → program → state → transition → result → hash">
              {[
                ["ADDRESS", rec.identity.address],
                ["PROGRAM", `eca rule ${s.rule} · ring of ${s.n} cells · /map/eca/${s.rule}/${s.n}`],
                ["STATE", st ? (value.transition ? `x = ${(value.transition as { src: number }).src}` : value.perturbed_from !== undefined ? `x = ${value.perturbed_from}` : `x = ${s.x}`) : rec.type === "trace" ? `x₀ = ${s.x0}` : "none chosen"],
                ["TRANSITION", rec.history.length ? rec.history[rec.history.length - 1].op : "—"],
                ["RESULT", st ? `x = ${s.x} · ${s.bits}` : rec.type === "trace" ? `${s.length} states${s.cycle_length ? ` · cycle ${s.cycle_length}` : ""}` : `${s.states} states`],
                ["HASH", rec.identity.hash.slice(0, 24) + "…"],
              ].map(([k, v], i) => (
                <li key={k} className="pipeline-step"><span className="eyebrow">{k}</span><span className="mt-1 block break-all font-mono text-[0.78rem] text-ink">{v}</span>{i < 5 && <span aria-hidden="true" className="pipeline-arrow">↓</span>}</li>
              ))}
            </ol>
            <div>
              <p className="eyebrow mb-3">History as topology · each node is an address</p>
              <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.75rem]" aria-label="Derivation">
                {rec.history.length === 0 ? <li className="text-ink-3">This address has no derivation beyond its program.</li> : (
                  <>
                    <li><a href={mode === "page" ? `/live${rec.history[0].from}` : `#${rec.history[0].from}`} onClick={(e) => onLink(e, rec.history[0].from, "back")} className="node">rule {String(s.rule)} · {String(s.n)} cells</a></li>
                    {rec.history.map((h) => (
                      <li key={h.to} className="flex items-center gap-2"><span className="text-emerald">—{h.op}→</span><a href={mode === "page" ? `/live${h.to}` : `#${h.to}`} onClick={(e) => onLink(e, h.to, "back")} className="node" aria-current={h.to === address ? "step" : undefined}>{h.label}</a></li>
                    ))}
                  </>
                )}
              </ol>
            </div>
            <details className="substrate"><summary>the living record (living/1) · the same JSON at /api/v1/living</summary><pre tabIndex={0} className="machine mt-2 max-h-80 text-[0.7rem]">{JSON.stringify(rec, null, 1)}</pre></details>
            <p className="font-mono text-[0.75rem]"><a href={`/x${address}`}>/x{address}</a> · the machine form of this object</p>
          </div>
        )}

        {layer === "proof" && (
          <div className="space-y-5">
            <div className="card p-4">
              <p className="eyebrow">This exact value has this identity</p>
              <p className="mt-2 break-all font-mono text-[0.8rem]">value_sha256 {rec.identity.hash}</p>
              {!proof ? <button type="button" className="cmd mt-3" onClick={verify}>VERIFY · recompute it<kbd className="kbd">v</kbd></button> : (
                <ul className="mt-3 space-y-1 font-mono text-[0.75rem]" aria-live="polite">
                  <li>browser · {proof.browser.slice(0, 32)}… <span className="text-ink-3">computed in your browser just now</span></li>
                  <li>server · {proof.server ? proof.server.slice(0, 32) + "…" : proof.error ? "unavailable" : "fetching…"} <span className="text-ink-3">GET /x{address}</span></li>
                  {proof.server && <li className={proof.server === proof.browser ? "text-emerald" : "text-refuse"}>{proof.server === proof.browser ? "✓ identical: the same resolver, run twice, agrees" : "✗ different: report this"}</li>}
                  {proof.error && <li className="text-ink-3">{proof.error}</li>}
                </ul>
              )}
            </div>
            <EvidenceTable rows={rec.evidence} />
          </div>
        )}
      </div>
      {flash && <p role="status" className="mt-4 text-[0.88rem] text-emerald">{flash}</p>}
    </div>
  );
}
