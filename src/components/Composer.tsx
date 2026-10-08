"use client";

import { useMemo, useState } from "react";
import { experienceUrl, parseExperience } from "@/lib/experience";
import { ORIGIN } from "@/config/origin";

/** A human-facing composer for the same grammar the AI uses. Prefills from ?… when remixing. */
export function Composer({ initial, researchIds }: { initial: { title: string; by: string; session: string; lines: string[] }; researchIds: string[] }) {
  const [title, setTitle] = useState(initial.title);
  const [by, setBy] = useState(initial.by);
  const [session, setSession] = useState(initial.session);
  const [text, setText] = useState(initial.lines.join("\n"));
  const ids = useMemo(() => new Set(researchIds), [researchIds]);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const url = experienceUrl("", { title, by, session, lines });
  const parsed = parseExperience(new URL(url, ORIGIN).searchParams, ids, url.length + ORIGIN.length);

  return (
    <div className="panel grid gap-0 lg:grid-cols-2">
      <div className="space-y-3 border-b border-rule p-4 lg:border-b-0 lg:border-r">
        <label className="block"><span className="label">title</span><input className="field mt-1" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="label">by (model)</span><input className="field mt-1" value={by} onChange={(e) => setBy(e.target.value)} /></label>
          <label className="block"><span className="label">session</span><input className="field mt-1" value={session} onChange={(e) => setSession(e.target.value)} /></label>
        </div>
        <label className="block"><span className="label">blocks · one per line · type:content</span>
          <textarea className="field mt-1 min-h-72 leading-relaxed" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
        </label>
      </div>
      <div className="space-y-3 p-4" aria-live="polite">
        <p className="label">the URL · {url.length + ORIGIN.length} characters · {parsed.doc.blocks.length} blocks</p>
        <pre tabIndex={0} className="machine machine-wrap max-h-60 !text-[0.72rem]">{ORIGIN}{url}</pre>
        {parsed.errors.map((e, i) => <p key={i} className="font-mono text-[0.78rem] text-refuse">✗ {e}</p>)}
        {parsed.warnings.map((w, i) => <p key={i} className="font-mono text-[0.78rem] text-gold">⚠ {w}</p>)}
        <p className="flex flex-wrap gap-3">
          <a href={url} className="btn btn-primary">Open it</a>
          <a href={`/e.json${url.slice(2)}`} className="btn">Check as JSON</a>
        </p>
      </div>
    </div>
  );
}
