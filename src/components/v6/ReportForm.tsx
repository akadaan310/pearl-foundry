"use client";

import { useEffect, useState } from "react";
import { reportPearl } from "@/lib/v6/report";
import { encodePortable } from "@/lib/pearl/portable";
import { pearlId } from "@/lib/pearl/model";
import { pearlHandoff } from "@/lib/v6/handoff";
import { record } from "@/lib/v6/trail";
import { CopyPair } from "./Actions";

export function ReportForm() {
  const [what, setWhat] = useState("");
  const [expected, setExpected] = useState("");
  const [where, setWhere] = useState("");
  const [detail, setDetail] = useState("");
  const [out, setOut] = useState<{ url: string; id: string; title: string } | null>(null);
  useEffect(() => { const q = new URLSearchParams(location.search); setWhere(q.get("from") ?? ""); setDetail(q.get("detail") ?? ""); }, []);
  const make = async () => {
    const p = reportPearl({ what, expected, where, detail, when: new Date().toISOString(), agent: navigator.userAgent });
    const { url } = await encodePortable(p);
    const id = pearlId(p);
    setOut({ url, id, title: p.title });
    record({ kind: "made", url: new URL(url).pathname, title: p.title, parent: where || null });
  };
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form className="glass space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); void make(); }}>
        {[["r-what", "What happened?", what, setWhat, 4, true], ["r-exp", "What did you expect instead? (optional)", expected, setExpected, 2, false]].map(([id, label, v, set, rows, req]) => (
          <div key={id as string}><label htmlFor={id as string} className="block font-medium">{label as string}</label>
            <textarea id={id as string} rows={rows as number} required={req as boolean} value={v as string} onChange={(e) => (set as (s: string) => void)(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-white/15 bg-white/5 p-3 text-ink outline-none focus:border-emerald" /></div>
        ))}
        <div><label htmlFor="r-where" className="block font-medium">Where? (a link, if you have one)</label>
          <input id="r-where" value={where} onChange={(e) => setWhere(e.target.value)} className="mt-1.5 w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 font-mono text-[0.85rem] text-ink outline-none focus:border-emerald" /></div>
        {detail && <p className="text-[0.82rem] text-ink-3">Technical detail from the page that failed is attached.</p>}
        <p className="text-[0.82rem] text-ink-3">Don&apos;t include passwords or anything private: a report lives in its link, and anyone you give the link to can read it.</p>
        <button type="submit" className="btn-glow" disabled={!what.trim()}>Make it a Pearl</button>
      </form>
      <div aria-live="polite">
        {out ? (
          <div className="glass space-y-4 p-6">
            <p className="zone-title">Reported</p>
            <p className="font-serif text-2xl">{out.title}</p>
            <p className="text-ink-2">Your report is now a Pearl. Give it to an AI to reproduce and diagnose, or send the link to whoever can fix it.</p>
            <div className="flex flex-wrap gap-2"><CopyPair url={out.url} program={pearlHandoff(out.url, out.id, out.title).replace("add your contribution", "reproduce and diagnose the report, then add your findings")} title={out.title} /></div>
            <p><a href={new URL(out.url).pathname} className="underline">Open the report</a></p>
            <p className="text-[0.8rem] text-ink-3">There is no ticket inbox yet: the substrate&apos;s ticket system is planned, not built. Nobody is notified automatically.</p>
          </div>
        ) : (
          <div className="glass p-6 text-ink-2"><p className="font-serif text-2xl text-ink">Tell us what happened.</p><p className="mt-2">Your words become a small Pearl: a report with its status, where it happened, and an open thread to reproduce it. You can copy it, give it to an AI, or keep it.</p></div>
        )}
      </div>
    </div>
  );
}
