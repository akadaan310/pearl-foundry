"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolve } from "@/lib/address";
import { extend, normalForm } from "@/lib/living/address";
import { addressHandoff } from "@/lib/v6/handoff";
import { encodePortable } from "@/lib/pearl/portable";
import { PEARL_FORMAT, type Pearl } from "@/lib/pearl/model";
import { play } from "@/lib/v6/sound";
import { record } from "@/lib/v6/trail";
import { ORIGIN, HOST } from "@/config/origin";
import { CopyPair } from "./Actions";

const START = "/map/eca/90/8/state/5";

/**
 * A tiny world that changes when you touch it. Underneath: a computational
 * address (an elementary cellular automaton). On the surface: eight lights on
 * a ring. Every change is a new address, kept in the page's URL fragment.
 */
export function TinyWorld({ initial = START, size = "lg" }: { initial?: string; size?: "lg" | "md" }) {
  const router = useRouter();
  const [address, setAddress] = useState(initial);
  const [prev, setPrev] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fromHash = () => { const h = decodeURIComponent(location.hash.slice(1)); if (h.startsWith("/map/")) { try { resolve(h); setAddress(h); } catch { /* ignore */ } } };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const r = resolve(address);
  const v = r.value as { x: number; n_bits: number; dynamics: { rule: number; n: number } };
  const n = v.dynamics.n, x = v.x;

  const go = useCallback((next: string, cue: "transition" | "fork" = "transition") => {
    setPrev(address);
    setAddress(next);
    history.replaceState(null, "", `#${next}`);
    play(cue);
  }, [address]);

  const step = useCallback(() => go(extend(resolve(address), "next").address), [address, go]);
  const touch = (bit: number) => { go(extend(resolve(address), "flip", String(bit)).address); record({ kind: "moved", url: `/live${address}`, title: "A tiny world" }); };

  useEffect(() => {
    if (!running) { if (timer.current) clearInterval(timer.current); return; }
    timer.current = setInterval(() => {
      setAddress((a) => { const nx = extend(resolve(a), "next").address; history.replaceState(null, "", `#${nx}`); return nx; });
    }, 650);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running]);

  const keep = async () => {
    const nf = normalForm(resolve(address)) ?? address;
    const p: Pearl = { format: PEARL_FORMAT, type: "computation", title: "My tiny world", by: "a person, on Pearls", for: null, session: "tiny-world", blocks: [{ type: "h", text: "My tiny world" }, { type: "x", address: nf }, { type: "p", text: "Eight lights on a ring. I touched it until it looked like this." }] };
    const { url } = await encodePortable(p);
    const path = new URL(url).pathname;
    record({ kind: "made", url: path, title: "My tiny world", parent: `/live${nf}` });
    play("fork");
    router.push(path);
  };

  const D = size === "lg" ? 320 : 240, c = D / 2, R = D * 0.38, rr = Math.max(9, Math.min(24, (Math.PI * R) / n - 4));
  return (
    <div className="text-center">
      <svg viewBox={`0 0 ${D} ${D}`} className={`mx-auto h-auto w-full ${size === "lg" ? "max-w-[21rem]" : "max-w-[15rem]"}`} role="group" aria-label={`Eight lights on a ring; ${x.toString(2).split("").filter((b) => b === "1").length} are on. Touch a light to change it.`}>
        <defs><radialGradient id="tw-orb" cx="38%" cy="32%" r="72%"><stop offset="0%" stopColor="var(--pearl-hi)" /><stop offset="45%" stopColor="var(--pearl-mid)" /><stop offset="100%" stopColor="var(--pearl-lo)" /></radialGradient></defs>
        <circle cx={c} cy={c} r={R - rr - 14} fill="url(#tw-orb)" className="orb-float" style={{ transformOrigin: "center", filter: "drop-shadow(0 0 30px rgb(180 170 255 / 0.45))" }} />
        {Array.from({ length: n }, (_, i) => {
          const a = -Math.PI / 2 + (i * 2 * Math.PI) / n, on = (x >> i) & 1;
          return (
            <g key={i} role="button" tabIndex={0} aria-label={`light ${i + 1}, ${on ? "on" : "off"}`} aria-pressed={!!on} onClick={() => touch(i)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); touch(i); } }} className="ring-link">
              {on ? <circle cx={c + R * Math.cos(a)} cy={c + R * Math.sin(a)} r={rr + 8} fill="#86e3bb" opacity="0.18" /> : null}
              <circle cx={c + R * Math.cos(a)} cy={c + R * Math.sin(a)} r={rr} className="ring-cell" fill={on ? "#86e3bb" : "rgb(255 255 255 / 0.06)"} stroke={on ? "#86e3bb" : "rgb(255 255 255 / 0.35)"} strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button type="button" onClick={step} className="btn-glow">Continue</button>
        <button type="button" onClick={() => setRunning((v) => !v)} aria-pressed={running} className="btn-glass">{running ? "Stop" : "Watch it evolve"}</button>
        <button type="button" onClick={keep} className="btn-glass">Make it mine</button>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <CopyPair url={`${ORIGIN}/live${address}`} program={addressHandoff(address, "eight lights on a ring")} title="A tiny world" primary="link" compact />
      </div>
      <p className="mt-4 break-all font-mono text-[0.75rem] text-ink-3" aria-live="polite">
        <span className="text-ink-2">{HOST}</span>/live{address}
        {prev && <span className="block text-emerald">the address changed when the world did</span>}
      </p>
      <p className="mt-2 text-[0.8rem]"><a href={`/live${address}`} className="text-ink-3 underline decoration-dotted hover:text-ink">How does it work?</a></p>
    </div>
  );
}
