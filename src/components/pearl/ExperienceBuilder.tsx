"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { linesFor, type ExperienceDef } from "@/content/experiences";
import { experienceUrl, parseExperience } from "@/lib/experience";
import { toPearl, pearlDigest, idFromDigest, TYPE_INFO } from "@/lib/pearl/model";
import { pearlUrl } from "@/lib/pearl/serialize";
import { encodePortable } from "@/lib/pearl/portable";
import { RESEARCH_IDS } from "@/lib/pearl/resolve";
import { PearlActions } from "@/components/PearlActions";
import { CopyButton } from "@/components/CopyPrompt";
import { ORIGIN } from "@/config/origin";

/**
 * Make a Pearl yourself, or ask your AI to. The form is a view over the real
 * grammar: every keystroke re-parses the Pearl with the same parser /e uses.
 */
export function ExperienceBuilder({ def }: { def: ExperienceDef }) {
  const uid = useId();
  const initial = () => Object.fromEntries(def.fields.map((f) => [f.id, f.id === "title" ? def.example.title : def.example.values[f.id] ?? f.initial ?? ""]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [portable, setPortable] = useState<string | null>(null);

  const built = useMemo(() => {
    const { title, lines } = linesFor(def, values);
    const u = new URL(experienceUrl(ORIGIN, { title, by: "Pearls Create", session: `create-${def.id}`, lines }));
    u.searchParams.set("type", def.type);
    const r = parseExperience(u.searchParams, new Set(RESEARCH_IDS), u.toString().length);
    if (r.errors.length) return { errors: r.errors, warnings: r.warnings } as const;
    const pearl = toPearl(r.doc);
    const digest = pearlDigest(pearl);
    return { pearl, digest, id: idFromDigest(digest), e: pearlUrl(pearl), warnings: r.warnings, errors: [] as string[] } as const;
  }, [def, values]);

  useEffect(() => {
    let live = true;
    if ("pearl" in built && built.pearl) encodePortable(built.pearl).then((p) => { if (live) setPortable(p.url); });
    return () => { live = false; };
  }, [built]);

  const links = "pearl" in built && built.pearl && portable ? { e: built.e, portable, compact: portable.length < built.e.length ? portable : built.e } : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form className="card space-y-4 p-5 sm:p-6" onSubmit={(e) => e.preventDefault()} aria-label={`${def.name} form`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-serif text-xl">Make it yourself</p>
          <div className="flex gap-2">
            <button type="button" className="btn-soft !min-h-9 !px-3 !py-1 text-[0.82rem]" onClick={() => setValues(initial())}>Example</button>
            <button type="button" className="btn-soft !min-h-9 !px-3 !py-1 text-[0.82rem]" onClick={() => setValues(Object.fromEntries(def.fields.map((f) => [f.id, f.initial ?? ""])))}>Clear</button>
          </div>
        </div>
        {def.fields.map((f) => {
          const id = `${uid}-${f.id}`;
          const common = { id, value: values[f.id] ?? "", onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [f.id]: e.target.value })), placeholder: f.placeholder, className: "field !rounded-lg !font-sans !text-[0.95rem]" };
          return (
            <div key={f.id}>
              <label htmlFor={id} className="block text-[0.92rem] font-medium">{f.label}</label>
              {f.help && <p className="text-[0.8rem] text-ink-3">{f.help}</p>}
              <div className="mt-1.5">
                {f.kind === "line" ? <input {...common} maxLength={140} /> :
                 f.kind === "number" ? <input {...common} inputMode="numeric" pattern="[0-9]*" /> :
                 <textarea {...common} rows={f.kind === "text" ? 3 : 3} className={`${common.className} min-h-20 resize-y py-2`} />}
              </div>
              <p className="explore-only mt-1 font-mono text-[0.68rem] text-ink-3">→ {f.block === "title" ? "title=" : def.computation ? "x:/map/eca/…" : `${f.block}${f.status ? `:${f.status}|…` : ":…"}`}{f.kind === "lines" && f.as === "each" ? " (one block per line)" : f.kind === "pairs" ? " (key=value)" : ""}</p>
            </div>
          );
        })}
      </form>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="card overflow-hidden">
          <div className={`h-1.5 ${def.accent}`} aria-hidden="true" />
          <div className="space-y-3 p-5" aria-live="polite">
            <p className="eyebrow">Your Pearl · {TYPE_INFO[def.type].label}</p>
            {built.errors.length > 0 ? (
              <ul className="space-y-1 text-[0.9rem] text-refuse">{built.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            ) : "pearl" in built && built.pearl ? (
              <>
                <p className="font-serif text-2xl">{built.pearl.title}</p>
                <p className="text-[0.9rem] text-ink-2">{built.pearl.blocks.length} parts · ready to carry: the whole Pearl lives in its link.</p>
                {built.warnings.length > 0 && <ul className="space-y-1 text-[0.82rem] text-gold">{built.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
                <div className="explore-only space-y-2 border-t border-rule pt-3 font-mono text-[0.72rem] text-ink-2">
                  <p>id <span className="text-ink">{built.id}</span> · sha256:{built.digest.slice(0, 24)}…</p>
                  <ol className="space-y-0.5">{built.pearl.blocks.map((b, i) => <li key={i} className="truncate">b{i + 1} = {b.type === "c" ? b.kind : b.type}</li>)}</ol>
                  <pre tabIndex={0} className="machine machine-wrap max-h-40 !text-[0.68rem]">{built.e}</pre>
                </div>
              </>
            ) : null}
          </div>
          {"pearl" in built && built.pearl && links && (
            <div className="border-t border-rule p-5">
              <PearlActions compact pearl={built.pearl} id={built.id} digest={built.digest} links={links} source="pasted" origin="Create" />
            </div>
          )}
        </div>
        <div className="card p-5">
          <p className="font-serif text-xl">Or ask your AI to make it</p>
          <p className="mt-1 text-[0.9rem] text-ink-2">Copy this into ChatGPT, Gemini, Claude or any AI, then bring back the link it gives you.</p>
          <details className="mt-2"><summary className="text-[0.85rem] text-ink-3 hover:text-ink">Show the prompt</summary><pre tabIndex={0} className="machine machine-wrap mt-2 max-h-56 !text-[0.7rem]">{def.prompt}</pre></details>
          <div className="mt-3 flex flex-wrap gap-2"><CopyButton text={def.prompt} label="Copy prompt" /><a href="/#bring" className="btn !min-h-9 !py-1 text-[0.8rem]">Bring back the result</a></div>
        </div>
      </div>
    </div>
  );
}
