import Link from "next/link";
import type { Metadata } from "next";
import { EXPERIMENTS } from "@/content/experiments";
import { evidence } from "@/content/evidence";
import { SubstrateLayer } from "@/components/Substrate";
import { StatusBadge } from "@/components/Status";
import { AddressConsole } from "@/components/AddressConsole";

export const metadata: Metadata = {
  title: "Experiments",
  description: "Public experiments on this site: what each asks, what a visitor or agent may run, what is forbidden, and how to reproduce it.",
  alternates: { canonical: "/experiments" },
};

export default function Experiments() {
  return (
    <>
      <SubstrateLayer data={{ page: "/experiments", experiments: EXPERIMENTS }} />
      <header className="border-b border-rule" data-substrate="experiment → question → permitted → evidence → reproduce" data-address="/experiments" data-pointer="/research.json#/experiments">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ experiments</p>
          <h1 className="title max-w-[20ch] !text-[clamp(2.2rem,5vw,4rem)]">Demonstrations you can run, and how to check them.</h1>
          <p className="lede measure mt-6 text-ink-2">All execution here is sandboxed, bounded, deterministic, observable and reproducible. No visitor-supplied code runs on the server. Nothing is stored unless a person chooses to keep a composed experience, and then only what their AI wrote.</p>
        </div>
      </header>
      <div className="wrap">
        {EXPERIMENTS.map((e, i) => (
          <section key={e.id} id={e.id} aria-labelledby={`${e.id}-h`} className="rule-t py-14" data-substrate={`${e.id} → ${e.status}`} data-address={e.entry} data-pointer={`/research.json#/experiments/${i}`}>
            <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
              <div>
                <p className="flex flex-wrap items-center gap-3"><span className="coord">{e.id}</span><StatusBadge status={e.status} /></p>
                <h2 id={`${e.id}-h`} className="mt-3 font-serif text-3xl">{e.name}</h2>
                <p className="mt-4 max-w-[44rem] text-ink-2">{e.question}</p>
                <p className="mt-5"><a href={e.entry} className="arrow-link">Enter: {e.entry} →</a></p>
              </div>
              <div className="space-y-5 text-[0.88rem]">
                <div><p className="label mb-2 !text-emerald">Permitted</p><ul className="space-y-1.5 text-ink-2">{e.permitted.map((p, k) => <li key={k}>{p}</li>)}</ul></div>
                {e.forbidden.length > 0 && <div><p className="label mb-2 !text-refuse">Not permitted</p><ul className="space-y-1.5 text-ink-2">{e.forbidden.map((p, k) => <li key={k}>{p}</li>)}</ul></div>}
                <div><p className="label mb-2">Evidence</p><ul className="space-y-1">{e.evidence.map((id) => <li key={id}><Link href={`/verify#${id}`} className="font-mono text-[0.78rem]">{id}</Link> <span className="text-ink-3">{evidence(id).title}</span></li>)}</ul></div>
              </div>
            </div>
            <div className="mt-6">
              <p className="label mb-2">Reproduce</p>
              <pre tabIndex={0} className="machine machine-wrap">{e.reproduce}</pre>
            </div>
            {e.id === "X-ADDRESS" && <div className="mt-8"><AddressConsole initial="/map/eca/30/16/state/256/trace/24" /></div>}
          </section>
        ))}
      </div>
    </>
  );
}
