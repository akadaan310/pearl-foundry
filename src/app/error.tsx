"use client";

import Link from "next/link";
import { useEffect } from "react";
import { play } from "@/lib/v6/sound";

/** Errors in human language first. Technical detail goes into a diagnostic report, only if the person wants it. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { play("unsure"); }, []);
  const where = typeof window !== "undefined" ? location.pathname + location.search : "";
  const detail = `${error.name}: ${error.message}${error.digest ? ` (digest ${error.digest})` : ""}`.slice(0, 600);
  return (
    <section className="wrap py-24">
      <h1 className="font-serif text-[clamp(2rem,5vw,3.4rem)]">That couldn&apos;t continue.</h1>
      <p className="mt-3 text-ink-2">Something went wrong while opening this. Nothing you made is lost: everything here lives in its link.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="btn-glow">Try again</button>
        <Link href={`/report?from=${encodeURIComponent(where)}&detail=${encodeURIComponent(detail)}`} className="btn-glass">Make a diagnostic report</Link>
        <Link href="/" className="btn-glass">Come back home</Link>
      </div>
      <details className="mt-6 text-[0.85rem] text-ink-3"><summary className="cursor-pointer">Technical detail</summary><pre className="mt-2 whitespace-pre-wrap font-mono text-[0.75rem]">{detail}</pre></details>
    </section>
  );
}
