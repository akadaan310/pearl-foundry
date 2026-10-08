"use client";

import { useState } from "react";
import { resolvePearl, type Resolution } from "@/lib/pearl/resolve";
import { addPearl } from "@/lib/pearl/workspace";
import { TYPE_INFO } from "@/lib/pearl/model";
import { useWorkspace } from "./useWorkspace";
import { CopyButton } from "@/components/CopyPrompt";

const STAGES = ["AI response", "Pearl", "Readable", "Kept", "Reusable link"] as const;

/**
 * AI response → Pearl → readable artifact → saved item → reusable link,
 * operated by the visitor with the same code the product uses. Edit the
 * response, or paste your own.
 */
export function TransformDemo({ sample }: { sample: string }) {
  const [text, setText] = useState(sample);
  const [stage, setStage] = useState(0);
  const [res, setRes] = useState<Resolution | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { update, ws } = useWorkspace();

  const advance = async () => {
    setError(null);
    if (stage === 0) {
      const r = await resolvePearl(text);
      setRes(r);
      if (!r.pearl) { setError(r.errors[0] ?? "No Pearl found in that response."); return; }
      setStage(1);
    } else if (stage === 1) setStage(2);
    else if (stage === 2 && res?.pearl) {
      const r = update((w) => addPearl(w, res.pearl!, { source: "pasted", origin: "the transformation demo" }).ws);
      if (!r.ok) { setError(r.error ?? "Could not save in this browser."); return; }
      setStage(3);
    } else if (stage === 3) setStage(4);
  };
  const reset = () => { setStage(0); setRes(null); setError(null); };
  const p = res?.pearl;
  const kept = p && ws.pearls.some((x) => x.digest === res?.digest);
  const next = ["Find the Pearl", "Read it", "Keep it", "Make it reusable", null][stage];

  return (
    <div className="card overflow-hidden">
      <ol className="grid grid-cols-5 border-b border-rule text-center text-[0.72rem] sm:text-[0.82rem]" aria-label="Stages">
        {STAGES.map((s, i) => (
          <li key={s} aria-current={i === stage ? "step" : undefined}
            className={`px-1 py-3 transition-colors duration-300 ${i <= stage ? "bg-emerald-deep/70 font-medium text-ink" : "text-ink-3"} ${i === stage ? "shadow-[inset_0_-2px_0_var(--color-emerald)]" : ""}`}>
            <span className="hidden sm:inline">{String(i + 1).padStart(2, "0")} · </span>{s}
          </li>
        ))}
      </ol>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div>
          <label htmlFor="ai-response" className="text-[0.9rem] font-medium">What an AI replied</label>
          <textarea id="ai-response" value={text} onChange={(e) => { setText(e.target.value); reset(); }} rows={9}
            className="field mt-2 !rounded-lg !font-mono !text-[0.75rem] leading-relaxed" spellCheck={false} />
          <p className="mt-2 text-[0.82rem] text-ink-3">Replace it with a real reply from your AI if you have one.</p>
        </div>
        <div className="flex flex-col" aria-live="polite">
          {stage === 0 && <p className="text-ink-2">A message from an AI, with a Pearl link somewhere inside it. Nothing has been read yet.</p>}
          {stage >= 1 && p && res && (
            <div className="motion-reveal space-y-3">
              <p className="eyebrow">{TYPE_INFO[p.type].label} Pearl found</p>
              <p className="font-serif text-2xl">{p.title}</p>
              <p className="text-[0.9rem] text-ink-2">{p.blocks.length} parts, composed by {p.by ?? "an AI"} <span className="text-ink-3">(as it says)</span>.</p>
              <p className="explore-only font-mono text-[0.72rem] text-ink-3">{res.id} · sha256:{res.digest?.slice(0, 20)}… · status {res.status}</p>
            </div>
          )}
          {stage >= 2 && p && (
            <ul className="motion-reveal mt-4 space-y-1.5 text-[0.92rem]">
              {p.blocks.filter((b) => b.type === "c").slice(0, 6).map((b, i) => {
                const c = b as { kind: string; key?: string; text: string };
                return <li key={i} className="text-ink-2"><span className="mr-2 text-[0.72rem] uppercase tracking-wide text-ink-3">{c.kind}</span>{c.key ? <><b className="font-medium text-ink">{c.key}</b> — {c.text}</> : c.text}</li>;
              })}
            </ul>
          )}
          {stage >= 3 && <p className="motion-reveal mt-4 text-[0.92rem] text-emerald">{kept ? "✓ Kept in My Pearls, in this browser." : "Kept."}</p>}
          {stage >= 4 && res?.links && (
            <div className="motion-reveal mt-4 space-y-2">
              <p className="text-[0.9rem] text-ink-2">A self-contained link: give it to any AI, or open it on any device.</p>
              <p className="break-all rounded-lg bg-raised px-3 py-2 font-mono text-[0.7rem] text-ink-2">{res.links.compact}</p>
              <div className="flex flex-wrap gap-2"><CopyButton text={res.links.compact} label="Copy Pearl link" /><a className="btn !min-h-9 !py-1 text-[0.8rem]" href={res.links.compact.replace(/^https?:\/\/[^/]+/, "")}>Open it</a></div>
            </div>
          )}
          {error && <p className="mt-4 text-[0.92rem] text-refuse" role="alert">{error}</p>}
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {next && <button type="button" className="btn-solid" onClick={advance}>{next} →</button>}
            {stage > 0 && <button type="button" className="btn-soft" onClick={reset}>Start over</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
