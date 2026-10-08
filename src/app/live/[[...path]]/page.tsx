import type { Metadata } from "next";
import Link from "next/link";
import { AddressError } from "@/lib/address";
import { livingAddress } from "@/lib/living/address";
import { LivingAddress } from "@/components/living/LivingAddress";
import { SubstrateLayer } from "@/components/Substrate";
import { LIVING_EXAMPLE } from "@/content/compose";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ path?: string[] }> };

const STARTS = [
  { a: "/map/eca/90/8/state/5", t: "Rule 90 · 8 cells", d: "Sierpiński's rule. Small enough to hold in your hand." },
  { a: "/map/eca/30/16/state/256", t: "Rule 30 · 16 cells", d: "Chaos from one cell. Trace it." },
  { a: "/map/eca/110/12/state/1", t: "Rule 110 · 12 cells", d: "A rule known to be computationally universal." },
  { a: "/map/eca/184/10/state/341", t: "Rule 184 · 10 cells", d: "Traffic: cars move right when the road is clear." },
];

const toAddress = (path?: string[]) => (path?.length ? "/" + path.map((s) => decodeURIComponent(s)).join("/") : "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = toAddress((await params).path);
  if (!a) return { title: "Live", description: "Computational addresses you can turn: every move changes the address.", alternates: { canonical: "/live" } };
  try { const r = livingAddress(a); return { title: `${r.title} · Live`, description: r.explanation[0], alternates: { canonical: `/live${r.identity.address}` }, robots: { index: false, follow: true } }; }
  catch { return { title: "Live", robots: { index: false, follow: false } }; }
}

export default async function Live({ params }: Props) {
  const a = toAddress((await params).path);
  if (!a) {
    return (
      <>
        <SubstrateLayer data={{ page: "/live", what: "computational addresses as living objects", grammar: "/x", registry: "/capabilities.json", starts: STARTS.map((s) => s.a) }} />
        <header className="paper-glow border-b border-rule">
          <div className="wrap act !pb-12">
            <p className="eyebrow mb-5">Live</p>
            <h1 className="keynote max-w-[14ch]">This page is an address.</h1>
            <p className="mt-6 max-w-[42ch] text-[1.2rem] text-ink-2">Each object below is a URL that names a program and a state. Press NEXT, PERTURB, TRACE: the object changes, and so does the address. Every address you reach is real. Copy it, share it, give it to an AI.</p>
          </div>
        </header>
        <ul className="wrap grid gap-4 py-12 sm:grid-cols-2">
          <li className="sm:col-span-2"><Link href={LIVING_EXAMPLE.replace(ORIGIN, "")} className="card card-lift block border-gold/60 p-5 no-underline"><span className="eyebrow">An experience Pearl</span><span className="mt-1 block font-serif text-2xl">A walk through Rule 90</span><span className="mt-1 block text-ink-2">A story, a computation you can turn, choices that lead to other addresses, and a prompt to carry. Composed as one link.</span></Link></li>
          {STARTS.map((s) => (
            <li key={s.a}><Link href={`/live${s.a}`} className="card card-lift block p-5 no-underline"><span className="font-serif text-2xl">{s.t}</span><span className="mt-1 block text-ink-2">{s.d}</span><span className="mt-3 block break-all font-mono text-[0.75rem] text-ink-3">/live{s.a}</span></Link></li>
          ))}
        </ul>
      </>
    );
  }
  let rec;
  try { rec = livingAddress(a); } catch (e) {
    const err = e as AddressError;
    const applicable = (err.details?.applicable as string[] | undefined) ?? [];
    return (
      <section className="wrap py-24">
        <SubstrateLayer data={{ page: "/live", address: a, error: { status: err.status ?? 400, code: err.code ?? "malformed", message: err.message }, applicable }} />
        <p className="eyebrow mb-5">Live · this address does not resolve</p>
        <h1 className="title max-w-[22ch]">No registered operation leads here.</h1>
        <p className="mt-4 break-all font-mono text-[0.85rem] text-refuse">{a} · {err.status ?? 400} {err.code ?? "malformed"}: {err.message}</p>
        <p className="measure mt-6 text-ink-2">Addresses are matched against a fixed registry, never evaluated. {applicable.length ? "From the last valid point, these moves exist:" : "Start from one of these:"}</p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {(applicable.length ? applicable.filter((t) => !t.includes("{")) : STARTS.map((s) => s.a)).map((t) => <li key={t}><Link className="cmd" href={`/live${t}`}>{t}</Link></li>)}
          {applicable.filter((t) => t.includes("{")).map((t) => <li key={t} className="font-mono text-[0.8rem] text-ink-3">{t}</li>)}
        </ul>
      </section>
    );
  }
  return (
    <>
      <SubstrateLayer data={{ page: "/live", record: rec, machine_form: `/x${rec.identity.address}` }} />
      <section className="paper-glow border-b border-rule">
        <div className="wrap pb-14 pt-10 sm:pt-14">
          <p className="eyebrow mb-3">Live · this page is an address</p>
          <h1 className="sr-only">{rec.title}</h1>
          <LivingAddress initial={rec.identity.address} mode="page" />
        </div>
      </section>
      <section className="wrap grid gap-8 py-12 md:grid-cols-3">
        <div><p className="eyebrow">What you are holding</p><p className="mt-2 text-ink-2">An address that names a program (an elementary cellular automaton), a state, and the operations that produced it. Resolving it is the computation.</p></div>
        <div><p className="eyebrow">What a move does</p><p className="mt-2 text-ink-2">Each command appends one registered operation. The browser navigates to the new address. BACK, or your browser&apos;s back button, returns to the one before.</p></div>
        <div><p className="eyebrow">What it is not</p><p className="mt-2 text-ink-2">Nothing you type is executed. A perturbation is a simulated bit flip on a model. Commands are looked up in <a href="/capabilities">the registry</a>.</p></div>
      </section>
    </>
  );
}
