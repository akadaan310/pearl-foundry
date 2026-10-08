"use client";

import Link from "next/link";
import { useWorkspace } from "@/components/pearl/useWorkspace";
import { PEARL_STATES } from "@/lib/pearl/states";

/** /p/{id} with no payload: only this browser's library can supply the content. */
export function LocalPearl({ id }: { id: string }) {
  const { ws, ready } = useWorkspace();
  const rec = ws.pearls.find((p) => p.id === id);
  return (
    <section className="wrap py-24">
      <p className="label mb-6">pearl · {id} · {!ready ? "checking this browser…" : rec ? "LOCAL" : "UNAVAILABLE"}</p>
      {!ready ? <p className="text-ink-3">Checking this browser&apos;s library…</p> : rec ? (
        <>
          <h1 className="title max-w-[22ch]">{rec.name}</h1>
          <p className="measure mt-6 text-ink-2">{PEARL_STATES.LOCAL.means} This short link names the Pearl by its content id but does not carry its content, so it opens only here.</p>
          <p className="mt-8 flex flex-wrap gap-4"><Link href={`/workspace?pearl=${id}`} className="btn btn-primary">Open in My Pearls</Link></p>
        </>
      ) : (
        <>
          <h1 className="title max-w-[22ch]">This Pearl isn&apos;t available here.</h1>
          <p className="measure mt-6 text-ink-2">{id} is a content id. It names a Pearl, but a short id cannot recover the content it names, and this site keeps no copies. Ask for the full Pearl link (/p/{id}.… or /e?…), or open this link in the browser where the Pearl was kept.</p>
          <p className="mt-8"><Link href="/#bring" className="arrow-link">Bring a Pearl →</Link></p>
        </>
      )}
    </section>
  );
}
