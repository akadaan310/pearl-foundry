import type { Metadata } from "next";
import Link from "next/link";
import { CAPABILITIES } from "@/lib/capabilities";
import { substrateStatus } from "@/lib/substrate/status";
import { SubstrateLayer } from "@/components/Substrate";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Developers", description: "The machine surface of Pearls: capabilities, discovery files, the game and living-record APIs, and the status of the Pearl Runtime Substrate.", alternates: { canonical: "/developers" } };

export default async function Developers() {
  const s = await substrateStatus();
  return (
    <>
      <SubstrateLayer data={{ page: "/developers", substrate: s, capabilities: CAPABILITIES.map((c) => c.id) }} />
      <section className="wrap py-12 sm:py-16">
        <p className="zone-title">Developers · for AI</p>
        <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4rem)] leading-[1.02]">The machine underneath.</h1>
        <p className="mt-4 max-w-[60ch] text-ink-2">Everything a person can do here, an AI can do by URL. Every operation is a pure GET with stated limits; nothing a URL contains is executed.</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="glass p-6">
            <p className="font-serif text-2xl">This site</p>
            <ul className="mt-3 space-y-1.5 font-mono text-[0.8rem]">
              {["/llms.txt", "/ai.txt", "/.well-known/ai", "/capabilities.json", "/compose", "/e.json?…", "/api/v1/living?u=…", "/api/v1/game/ttt/…", "/x/map/eca/…", "/schemas/pearl.schema.json"].map((p) => <li key={p}><a href={p.replace(/\?…$|…$/, "")}>{p}</a></li>)}
            </ul>
            <p className="mt-4 text-[0.9rem] text-ink-2">{CAPABILITIES.length} capabilities: {CAPABILITIES.map((c) => c.id).join(", ")}. <Link href="/capabilities" className="underline">Details</Link>.</p>
          </div>
          <div className="glass p-6" aria-live="polite">
            <p className="font-serif text-2xl">The Pearl Runtime Substrate</p>
            <p className="mt-2 text-[0.92rem] text-ink-2">A separate backend (<a href="https://github.com/akadaan310/pearl-substrate">akadaan310/pearl-substrate</a>): Pearl, Address, Capability, Transition, Identity, Event, on PostgreSQL. This site talks to it only through its published API, from the server, through <code className="font-mono text-[0.8rem]">src/lib/substrate</code>.</p>
            <p className="mt-4 font-mono text-[0.85rem]">status: <b className={s.kind === "connected" ? "text-emerald" : "text-gold"}>{s.kind.replace("_", " ")}</b></p>
            {s.reason && <p className="mt-1 text-[0.85rem] text-ink-3">{s.reason}</p>}
            {s.discovery && <p className="mt-1 text-[0.85rem] text-ink-3">{s.discovery.name} {s.discovery.version} · phase {s.discovery.phase}</p>}
            <p className="mt-4 text-[0.88rem] text-ink-2">What it would add once connected: shared storage of Pearls, AI identity (register, authenticate, return verdicts) and server-side lineage. What stands in the way today is written down, with the exact contract needed, in <a href="https://github.com/akadaan310/aanebed/blob/HEAD/docs/v6/BACKEND_CONTRACT_GAPS.md">BACKEND_CONTRACT_GAPS.md</a>. <a href="/api/substrate/status">/api/substrate/status</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
