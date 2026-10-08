"use client";

import Link from "next/link";
import { useWorkspace } from "./useWorkspace";
import { PearlGlyphClient } from "./PearlGlyphClient";
import { TYPE_INFO } from "@/lib/pearl/model";
import { pearlUrl } from "@/lib/pearl/serialize";

export function MyPearlsPreview() {
  const { ws, ready } = useWorkspace();
  const items = [...ws.pearls].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.modifiedAt.localeCompare(a.modifiedAt)).slice(0, 5);
  return (
    <div className="border border-rule bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <span className="font-serif text-lg">My Pearls</span>
        <span className="font-mono text-[0.66rem] text-ink-3">stored in this browser</span>
      </div>
      {!ready ? <p className="px-4 py-4 text-[0.88rem] text-ink-3">Reading this browser…</p> : items.length === 0 ? (
        <p className="px-4 py-4 text-[0.9rem] text-ink-2">Nothing kept yet. Pearls you keep appear here: on this device only, until you export them.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <PearlGlyphClient size={14} />
              <a href={pearlUrl(p.pearl).replace(/^https?:\/\/[^/]+/, "")} className="min-w-0 flex-1 truncate no-underline hover:text-gold">{p.name}</a>
              <span className="font-mono text-[0.64rem] text-ink-3">{TYPE_INFO[p.pearl.type].label}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-rule px-4 py-2.5"><Link href="/workspace" className="arrow-link text-[0.85rem]">{ws.pearls.length ? `All ${ws.pearls.length} · spaces · projects · backup →` : "Open My Pearls →"}</Link></div>
    </div>
  );
}
