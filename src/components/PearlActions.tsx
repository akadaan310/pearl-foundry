"use client";

import { useState } from "react";
import type { Pearl } from "@/lib/pearl/model";
import { addPearl } from "@/lib/pearl/workspace";
import { useWorkspace, download } from "@/components/pearl/useWorkspace";
import { CopyButton } from "@/components/CopyPrompt";
import { HOST } from "@/config/origin";

/**
 * What a person can do with a Pearl. Nothing happens without a click:
 * keeping saves to this browser only; copying puts a link on the clipboard.
 */
export function PearlActions({ pearl, id, digest, links, compact = false, source = "opened", origin = HOST + "/e" }: {
  pearl: Pearl; id: string; digest: string; links: { e: string; portable: string; compact: string };
  compact?: boolean; source?: "opened" | "pasted"; origin?: string;
}) {
  const { ws, ready, available, update } = useWorkspace();
  const [space, setSpace] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const kept = ws.pearls.find((p) => p.digest === digest);
  const handoff = `Here is a Pearl from an earlier AI session: ${links.compact}\n\nOpen it and read it. It holds what that session wrote down, not verified facts and not its memory. Tell me what it contains, then continue from it. When something important changes, compose an updated Pearl using the grammar at https://${HOST}/compose.`;

  const keep = () => {
    const r = update((w) => addPearl(w, pearl, { source, origin, spaceId: space || undefined }).ws);
    setMsg(r.ok ? "Kept in My Pearls, in this browser." : r.error ?? "Could not save.");
  };

  return (
    <section aria-label="What you can do with this Pearl" className={compact ? "" : "border-b border-rule bg-panel"}>
      <div className={compact ? "space-y-4" : "wrap grid gap-6 py-6 lg:grid-cols-[1.1fr_1fr]"}>
        <div className="space-y-3">
          <p className="label">keep it · this browser only</p>
          {!ready ? <p className="text-[0.85rem] text-ink-3">Reading this browser&apos;s library…</p> : !available ? (
            <p className="text-[0.85rem] text-refuse">This browser does not allow local storage here. You can still copy or export the Pearl.</p>
          ) : kept ? (
            <p className="text-[0.9rem] text-ink-2"><span className="text-emerald">✓ In My Pearls</span> as “{kept.name}”, in {ws.spaces.find((s) => s.id === kept.spaceId)?.name ?? "a space"}. <a href="/workspace" className="arrow-link">Open My Pearls →</a></p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`space-${id}`}>Space</label>
              <select id={`space-${id}`} className="field !w-auto !min-h-10" value={space} onChange={(e) => setSpace(e.target.value)}>
                {ws.spaces.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" className="btn btn-primary" onClick={keep}>Keep in My Pearls</button>
            </div>
          )}
          {msg && <p className="text-[0.82rem] text-ink-2" role="status">{msg}</p>}
          <p className="text-[0.78rem] text-ink-3">Stored in this browser&apos;s localStorage. It will not appear on another device, and clearing site data removes it. Export to keep a copy.</p>
        </div>
        <div className="space-y-3">
          <p className="label">carry it · to any AI or device</p>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={links.compact} label="Copy Pearl link" />
            <CopyButton text={handoff} label="Copy a message for another AI" />
            <button type="button" className="btn !min-h-9 !py-1 text-[0.8rem]" onClick={() => download(`${id}.pearl.json`, { ...pearl, id, digest: digest })}>Export Pearl</button>
            <a className="btn !min-h-9 !py-1 text-[0.8rem]" href={links.compact.replace(/^https?:\/\/[^/]+/, "")}>Open</a>
          </div>
          <p className="break-all font-mono text-[0.7rem] text-ink-3">{links.compact.length} characters · {links.compact === links.portable ? "portable /p/ link (compressed, self-contained)" : "readable /e link (self-contained)"}</p>
        </div>
      </div>
    </section>
  );
}
