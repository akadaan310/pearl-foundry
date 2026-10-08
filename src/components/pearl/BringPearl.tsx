"use client";

import { useEffect, useId, useState } from "react";
import { resolvePearl, type Resolution } from "@/lib/pearl/resolve";
import { TYPE_INFO } from "@/lib/pearl/model";
import { useWorkspace } from "@/components/pearl/useWorkspace";
import { PearlActions } from "@/components/PearlActions";
import { ORIGIN, HOST } from "@/config/origin";

const STATUS: Record<Resolution["status"], { label: string; tone: string }> = {
  valid: { label: "Valid Pearl", tone: "text-emerald border-emerald/50" },
  local: { label: "Found in this browser only", tone: "text-ink border-rule-strong" },
  unavailable: { label: "Unavailable", tone: "text-refuse border-refuse/60" },
  unsupported: { label: "Recognised, but not a Pearl this site can open", tone: "text-gold border-gold/50" },
  external: { label: "External URL", tone: "text-gold border-gold/50" },
  malformed: { label: "Malformed", tone: "text-refuse border-refuse/60" },
  invalid: { label: "Invalid or oversized", tone: "text-refuse border-refuse/60" },
  empty: { label: "", tone: "" },
};

const KIND_ORDER = ["ai", "human", "nick", "lex", "nuance", "mem", "said", "decision", "thread", "action", "close"];

/**
 * Bring your Pearl: paste a link (or the text around it), see what it is.
 * Inspection happens entirely in this browser: nothing is sent anywhere,
 * nothing is fetched, nothing runs.
 */
export function BringPearl({ autofocus = false }: { autofocus?: boolean }) {
  const [text, setText] = useState("");
  const [res, setRes] = useState<Resolution | null>(null);
  const [busy, setBusy] = useState(false);
  const { ws } = useWorkspace();
  const fieldId = useId();

  const inspect = async (value = text) => {
    setBusy(true);
    try {
      setRes(await resolvePearl(value, (id) => { const r = ws.pearls.find((p) => p.id === id); return r ? { pearl: r.pearl, digest: r.digest } : undefined; }));
    } finally {
      setBusy(false);
    }
  };

  // A Pearl link can arrive as ?inspect=… (from the workspace or another page).
  useEffect(() => {
    const v = new URLSearchParams(location.search).get("inspect");
    if (v) { setText(v); void inspect(v); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = res?.pearl;
  const cs = p?.blocks.filter((b) => b.type === "c") ?? [];
  const shown = res && res.status !== "empty";

  return (
    <div id="bring" className="scroll-mt-20">
      <form onSubmit={(e) => { e.preventDefault(); void inspect(); }} className="border border-gold/50 bg-ground/90">
        <label htmlFor={fieldId} className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
          <span className="font-serif text-xl">Bring your Pearl</span>
          <span className="hidden font-mono text-[0.68rem] text-ink-3 sm:inline">inspected in your browser · nothing is sent</span>
        </label>
        <textarea
          id={fieldId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => { const v = e.clipboardData.getData("text"); if (v) { setTimeout(() => void inspect(v), 0); } }}
          rows={3}
          autoFocus={autofocus}
          spellCheck={false}
          placeholder={`Paste a Pearl your AI composed: a link starting ${HOST}/e?… or /p/…, or the whole message it came in.`}
          aria-describedby={`${fieldId}-help`}
          className="block w-full resize-y bg-transparent px-4 py-3 font-mono text-[0.85rem] leading-relaxed text-ink placeholder:text-ink-3 focus-visible:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3 border-t border-rule px-4 py-3">
          <button type="submit" className="btn btn-primary" disabled={busy || !text.trim()}>{busy ? "Inspecting…" : "Inspect Pearl"}</button>
          {res?.links && <a className="btn" href={res.links.compact.replace(ORIGIN, "")}>Open Pearl</a>}
          {text && <button type="button" className="btn" onClick={() => { setText(""); setRes(null); }}>Clear</button>}
          <p id={`${fieldId}-help`} className="text-[0.8rem] text-ink-3">We&apos;ll inspect it, explain what it contains, and show you what you can do with it.</p>
        </div>
      </form>

      <div aria-live="polite">
        {shown && (
          <div className="motion-reveal mt-4 border border-rule-strong bg-panel">
            <div className="flex flex-wrap items-center gap-3 border-b border-rule px-4 py-3">
              <span className={`border px-2 py-0.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] ${STATUS[res.status].tone}`}>{STATUS[res.status].label}</span>
              {p && <span className="font-mono text-[0.72rem] text-gold">{TYPE_INFO[p.type].label} Pearl</span>}
              {res.id && <span className="font-mono text-[0.72rem] text-ink" title={res.digest ? `sha256:${res.digest}` : undefined}>{res.id}</span>}
              {res.source && <span className="font-mono text-[0.68rem] text-ink-3">from {res.source === "portable" ? "a portable /p/ link" : res.source === "url" ? "the link itself" : res.source === "local" ? "this browser's library" : res.source === "export" ? "a pasted record" : "pasted text"}</span>}
            </div>

            <div className="space-y-3 px-4 py-4">
              {res.errors.map((e, i) => <p key={i} className="text-[0.92rem] text-refuse">{e}</p>)}
              {res.notes.map((n, i) => <p key={i} className="text-[0.85rem] text-gold">{n}</p>)}
              {p && (
                <>
                  <h3 className="font-serif text-2xl">{p.title}</h3>
                  <p className="text-[0.88rem] text-ink-2">
                    {p.blocks.length} blocks · composed by {p.by ?? "an unnamed composer"} <span className="text-ink-3">(asserted)</span>
                    {p.session && <> · session <span className="font-mono text-[0.8rem]">{p.session}</span></>}
                    {p.for && <> · for {p.for}</>}
                  </p>
                  <p className="text-[0.88rem] text-ink-2">{TYPE_INFO[p.type].does}</p>
                  {cs.length > 0 && (
                    <ul className="grid gap-x-6 gap-y-1 text-[0.86rem] sm:grid-cols-2">
                      {[...cs].sort((a, b) => KIND_ORDER.indexOf((a as { kind: string }).kind) - KIND_ORDER.indexOf((b as { kind: string }).kind)).slice(0, 10).map((c, i) => {
                        const k = c as { kind: string; key?: string; text: string };
                        return <li key={i} className="truncate text-ink-2"><span className="mr-2 font-mono text-[0.66rem] uppercase text-ink-3">{k.kind}</span>{k.key ? <><span className="text-ink">{k.key}</span> — {k.text}</> : k.text}</li>;
                      })}
                    </ul>
                  )}
                  {res.warnings.length > 0 && <ul className="space-y-1 font-mono text-[0.72rem] text-gold">{res.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}</ul>}
                  <p className="border-l border-rule-strong pl-3 text-[0.8rem] text-ink-3">The id is a fingerprint of the content: the same Pearl always gets the same id. It does not prove who wrote it or that what it says is true. Don&apos;t keep passwords, tokens or secrets in a Pearl: links get copied and logged.</p>
                </>
              )}
            </div>

            {p && res.id && res.digest && res.links && (
              <div className="border-t border-rule px-4 py-4">
                <PearlActions compact pearl={p} id={res.id} digest={res.digest} links={res.links} source="pasted" origin={res.source === "text" ? "pasted text" : HOST} />
                <p className="mt-4 text-[0.85rem] text-ink-2"><span className="text-gold">Next:</span> give this Pearl to another AI and ask it to continue the work. When it composes an updated Pearl, bring that one back here: both are kept, side by side.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
