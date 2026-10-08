import Link from "next/link";
import type { Metadata } from "next";
import { SITE, SELF_REPORTED } from "@/content/site";
import { CAREER, CAREER_NOTE, CAREER_SOURCE, HEADLINE_FACTS, TRAJECTORY, WHY, MACHINE_VOICE } from "@/content/people";
import { SubstrateLayer, SubstrateDisclosure } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Abed Kadaan",
  description: "Principal-level software engineer, architect, researcher and independent builder: from production mobile, streaming and engineering leadership to programmable interfaces and computational substrate research.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <SubstrateLayer data={{ page: "/about", person: SITE.name, career: { provenance: SELF_REPORTED, source: CAREER_SOURCE, items: CAREER }, trajectory: TRAJECTORY, machine_participant: MACHINE_VOICE }} />
      <header className="border-b border-rule" data-substrate="person → trajectory → question → research" data-address="/about" data-pointer="/research.json#/identity">
        <div className="wrap pb-14 pt-14 sm:pt-20">
          <p className="label mb-8">§ the human behind the work</p>
          <h1 className="display">Abed Kadaan</h1>
          <p className="lede measure mt-6">Principal-level software engineer, architect, researcher and independent builder. Decades of production engineering converging on experimental computer science.</p>
        </div>
      </header>

      <section aria-labelledby="facts-h" className="wrap py-14" data-substrate="career → self-reported" data-address="/about#career" data-pointer="/research.json#/identity/career">
        <h2 id="facts-h" className="sr-only">In numbers</h2>
        <dl className="grid gap-px bg-rule sm:grid-cols-3">
          {HEADLINE_FACTS.map((f) => (
            <div key={f.label} className="flex flex-col bg-ground p-6">
              <dt className="order-2 mt-2 text-[0.9rem] text-ink-2">{f.label}</dt>
              <dd className="font-serif text-5xl">{f.value} <span className="font-sans text-base text-ink-3">{f.unit}</span></dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="career" aria-labelledby="career-h" className="rule-t py-14">
        <div className="wrap grid gap-12 lg:grid-cols-[1fr_20rem]">
          <div>
            <h2 id="career-h" className="title mb-8">Production engineering, at scale.</h2>
            <ol className="divide-y divide-rule border-y border-rule">
              {CAREER.map((c) => (
                <li key={c.organisation} className="grid gap-2 py-5 sm:grid-cols-[8rem_1fr]">
                  <span className="coord pt-1">{c.period ?? "—"}</span>
                  <div>
                    <p><span className="font-serif text-xl">{c.organisation}</span> <span className="text-ink-3">· {c.role}</span></p>
                    <p className="mt-1 text-ink-2">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="self-start border-l border-gold/60 pl-5 text-[0.88rem]">
            <p className="label mb-2 !text-gold">Provenance</p>
            <p className="text-ink-2">{SELF_REPORTED}</p>
            <p className="mt-3 text-ink-3">{CAREER_NOTE}</p>
            <p className="mt-3"><a href={CAREER_SOURCE} className="font-mono text-[0.78rem]">source: owner&apos;s portfolio repository</a></p>
          </aside>
        </div>
      </section>

      <section aria-labelledby="traj-h" className="rule-t py-14">
        <div className="wrap">
          <h2 id="traj-h" className="label mb-8">Trajectory</h2>
          <ol className="grid gap-px bg-rule sm:grid-cols-3 lg:grid-cols-9">
            {TRAJECTORY.map((t, i) => (
              <li key={t.stage} className="bg-ground p-4">
                <span className="coord">{String(i).padStart(2, "0")}</span>
                <p className={`mt-2 font-serif text-[1.05rem] leading-snug ${i >= 6 ? "text-emerald" : ""}`}>{t.stage}</p>
                <p className="mt-1 text-[0.78rem] text-ink-3">{t.note}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="why" aria-labelledby="why-h" className="rule-t py-16 sm:py-24" data-substrate="question → changed" data-address="/about#why" data-pointer="/research.json#/thesis">
        <div className="wrap max-w-[46rem]">
          <p className="label mb-6">§ why this person?</p>
          <h2 id="why-h" className="title">Why would a principal engineer build this?</h2>
          <div className="mt-10 space-y-5">
            {WHY.map((w, i) => <p key={i} className={i === 0 ? "lede" : "font-serif text-2xl text-ink-2"}>{w}</p>)}
          </div>
          <p className="mt-10 text-ink-2">Every repository on the <Link href="/research">research map</Link> is an attempt to answer one of these questions with code, a test and a record, instead of an essay.</p>
        </div>
      </section>

      <section id="machine" aria-labelledby="machine-h" className="rule-t py-16" data-substrate="participant → machine ≠ author" data-address="/about#machine" data-pointer="/research.json#/identity/machine_participant">
        <div className="wrap grid gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="label mb-6">§ the intelligence layer</p>
            <h2 id="machine-h" className="title">The other engineer.</h2>
            <blockquote className="mt-8 border-l border-rule-strong pl-6">
              {MACHINE_VOICE.statement.map((p, i) => <p key={i} className={i === 0 ? "lede" : "mt-4 text-ink-2"}>{p}</p>)}
              <footer className="mt-6 font-mono text-[0.75rem] text-ink-3">— {MACHINE_VOICE.author}</footer>
            </blockquote>
          </div>
          <div className="self-end">
            <SubstrateDisclosure lines={["collaboration", "≠ authorship", "→ human: authorship", "→ machine: participation", "→ record: the repositories"]} label="substrate · the distinction" />
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-h" className="rule-t py-14">
        <div className="wrap flex flex-wrap items-baseline justify-between gap-6">
          <h2 id="contact-h" className="font-serif text-2xl">Contact</h2>
          <a href={`mailto:${SITE.contact}`} className="font-serif text-2xl">{SITE.contact}</a>
          <a href={SITE.github} className="font-mono text-[0.85rem]">github.com/akadaan310</a>
        </div>
      </section>
    </>
  );
}
