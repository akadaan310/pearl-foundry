"use client";

import { useCallback, useRef, useState } from "react";
import type { EvidenceRow, Knowing } from "@/lib/living/record";

export type Layer = "surface" | "substrate" | "proof";
const LAYERS: { id: Layer; label: string; hint: string }[] = [
  { id: "surface", label: "Surface", hint: "what you see" },
  { id: "substrate", label: "Substrate", hint: "what is happening" },
  { id: "proof", label: "Proof", hint: "what can be checked" },
];

/** SURFACE · SUBSTRATE · PROOF. Keys 1, 2, 3. */
export function LayerTabs({ layer, setLayer }: { layer: Layer; setLayer: (l: Layer) => void }) {
  return (
    <div role="tablist" aria-label="Layers" className="layer-tabs">
      {LAYERS.map((l, i) => (
        <button key={l.id} type="button" role="tab" aria-selected={layer === l.id} onClick={() => setLayer(l.id)} title={`${l.hint} (key ${i + 1})`}
          onKeyDown={(e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); const n = LAYERS[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3]; setLayer(n.id); (e.currentTarget.parentElement?.children[(i + (e.key === "ArrowRight" ? 1 : 2)) % 3] as HTMLElement)?.focus(); } }}
          tabIndex={layer === l.id ? 0 : -1}
          className={layer === l.id ? "is-on" : ""}>
          {l.label}
        </button>
      ))}
    </div>
  );
}

const TONE: Record<Knowing, string> = {
  computed: "text-emerald border-emerald/50",
  checked: "text-emerald border-emerald/50",
  recorded: "text-ink border-rule-strong",
  asserted: "text-gold border-gold/60",
  external: "text-ink-2 border-dashed border-rule-strong",
  "cannot be established": "text-refuse border-refuse/50",
};

/** How each thing is known. Never one "verified" badge. */
export function EvidenceTable({ rows }: { rows: EvidenceRow[] }) {
  return (
    <div>
      <p className="eyebrow mb-3">How each part is known</p>
      <ul className="divide-y divide-rule border-y border-rule">
        {rows.map((r, i) => (
          <li key={i} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr]">
            <span><span className={`inline-block border px-1.5 py-0.5 font-mono text-[0.66rem] uppercase tracking-[0.08em] ${TONE[r.knowing]}`}>{r.knowing}</span>{r.status && <span className="ml-1.5 font-mono text-[0.66rem] text-ink-3">{r.status}</span>}</span>
            <span className="min-w-0 text-[0.9rem]"><b className="font-medium text-ink">{r.what}</b> <span className="text-ink-2">— {r.detail}</span>{r.ref && <> <a className="font-mono text-[0.75rem]" href={r.ref.startsWith("/") ? r.ref : `/verify#${r.ref}`}>{r.ref}</a></>}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.8rem] text-ink-3">computed: resolved here now · checked: a hash recomputed and compared · recorded: from this site&apos;s evidence record · asserted: written by the composer · external: not fetched · cannot be established: no check on this site can show it.</p>
    </div>
  );
}

export function useFlash() {
  const [flash, setFlash] = useState<string | null>(null);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = useCallback((m: string) => { setFlash(m); if (t.current) clearTimeout(t.current); t.current = setTimeout(() => setFlash(null), 3500); }, []);
  return { flash, say };
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    try {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch { return false; }
  }
}
