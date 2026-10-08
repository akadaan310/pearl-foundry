import Link from "next/link";
import type { Metadata } from "next";
import { SITE, SELF_REPORTED } from "@/content/site";
import { NODES } from "@/content/research";
import { REPOSITORIES } from "@/content/repositories";
import { HEADLINE_FACTS } from "@/content/people";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Press / research brief",
  description: "Abed Kadaan and AI-CI in one sentence, one paragraph and five minutes: what has been built, what is reproducible, and what remains experimental.",
  alternates: { canonical: "/press" },
};

const PARAGRAPH = `Abed Kadaan is a software engineer with eighteen years in production mobile, web and streaming systems (self-reported), who now works independently on what he calls AI-CI: interfaces that people and machine intelligence can both read and operate. The work is public as seven repositories. ACSP is a deployed protocol that lets separate AI sessions continue work through a URL without merging identities. PURL is a protocol in which a URL names a stateful resource and the operations allowed on it. substrateIO is a research instrument that has disproven two of its own hypotheses. Golden Surface is a shared browser for one human and two machine participants, with a declared sync model. This website is itself one of the experiments: it publishes a machine-readable description of itself and tests what a client can discover from the URL alone. Its test suites were re-run independently for this site; whether AI products actually use such a layer is still an open question.`;

export default function Press() {
  const node = (id: string) => NODES.find((n) => n.id === id)!;
  return (
    <>
      <SubstrateLayer data={{ page: "/press", one_sentence: SITE.oneSentence, one_paragraph: PARAGRAPH, contact: SITE.contact }} />
      <header className="border-b border-rule" data-substrate="brief → sentence → paragraph → five minutes → evidence" data-address="/press" data-pointer="/research.json#/identity">
        <div className="wrap pb-12 pt-14 sm:pt-20">
          <p className="label mb-8">§ press · research brief · {SITE.updated}</p>
          <h1 className="title max-w-[18ch] !text-[clamp(2.2rem,5vw,4rem)]">The research brief.</h1>
          <p className="measure mt-4 text-ink-3">Written for journalists and researchers. No press coverage, awards, funding, institutional affiliation or adoption is claimed here, because there is none to report.</p>
        </div>
      </header>

      <div className="wrap max-w-[52rem] space-y-16 py-14">
        <section aria-labelledby="s1">
          <h2 id="s1" className="label mb-3">One sentence</h2>
          <p className="lede">{SITE.oneSentence}</p>
        </section>

        <section aria-labelledby="s2">
          <h2 id="s2" className="label mb-3">One paragraph</h2>
          <p className="text-[1.05rem] leading-relaxed text-ink-2">{PARAGRAPH}</p>
        </section>

        <section aria-labelledby="s3" className="space-y-6">
          <h2 id="s3" className="label">Five minutes</h2>
          <div>
            <h3 className="font-serif text-2xl">Who</h3>
            <p className="mt-2 text-ink-2">Abed Kadaan: a principal-level software engineer, architect and independent researcher. By his own account, he spent 18 years shipping web and mobile software and led engineering organisations of up to 80 engineers, including at Equinox and PlutoTV/ViacomCBS. <span className="text-ink-3">{SELF_REPORTED}</span></p>
            <ul className="mt-3 flex flex-wrap gap-6">{HEADLINE_FACTS.map((f) => <li key={f.label}><span className="font-serif text-3xl">{f.value}</span> <span className="text-ink-3">{f.unit}</span></li>)}</ul>
          </div>
          <div>
            <h3 className="font-serif text-2xl">What AI-CI means</h3>
            <p className="mt-2 text-ink-2">HCI studies how humans meet computers. AI-CI, Abed Kadaan&apos;s own term and not an established field, asks what changes when one interface is built to be read by humans <em>and</em> by machine intelligence: Human ↔ Computer ↔ AI.</p>
          </div>
          <div>
            <h3 className="font-serif text-2xl">What PURL means</h3>
            <p className="mt-2 text-ink-2">{node("purl").line} A person opening the URL sees a page. A machine asking the same URL for JSON learns what the resource is, every operation on it, whether it may perform each one, and a hash-chained history it can check for itself.</p>
          </div>
          <div>
            <h3 className="font-serif text-2xl">What Golden Surface demonstrates</h3>
            <p className="mt-2 text-ink-2">One shared browser for three named participants: Abed on his phone, and two machine-side seats that drive it through a relay. Only Abed types passwords. Every tab has an owner. The phone and the server&apos;s twin stay in sync under declared rules, and every way they can diverge is listed and shown loudly. Its relay test was re-run for this site; a real sign-in on the phone is still listed as open.</p>
          </div>
          <div>
            <h3 className="font-serif text-2xl">Why it is unusual</h3>
            <p className="mt-2 text-ink-2">Two reasons. The repositories keep hypotheses, failures and evidence in machine-checked registries, and they publish disproven results. And the website is part of the experiment: it carries a machine-readable copy of itself and states exactly what it cannot make an AI do.</p>
          </div>
          <div>
            <h3 className="font-serif text-2xl">What is publicly reproducible</h3>
            <p className="mt-2 text-ink-2">The test suites of PURL, ACSP and substrateIO, PURL&apos;s first experiment hash-for-hash, and Golden Surface&apos;s relay test. All were re-run in a clean environment on {SITE.updated} (<Link href="/verify">commands and results</Link>).</p>
          </div>
          <div>
            <h3 className="font-serif text-2xl">What remains experimental</h3>
            <p className="mt-2 text-ink-2">Whether AI products use machine-readable layers like this one when given only a URL. Whether sessions from different AI providers can continue each other&apos;s work through ACSP: a field trial is running, and its proposals are unresolved. And most of the theory documents in MUSA, which this site treats as unverified.</p>
          </div>
        </section>

        <section aria-labelledby="s4">
          <h2 id="s4" className="label mb-3">Technical deep dive</h2>
          <ul className="space-y-2">
            <li><Link href="/research" className="arrow-link">Research map and every node →</Link></li>
            <li><Link href="/ai" className="arrow-link">AI Laboratory →</Link></li>
            <li><a href="/research.json" className="arrow-link">/research.json (canonical machine-readable record) →</a></li>
          </ul>
        </section>

        <section aria-labelledby="s5">
          <h2 id="s5" className="label mb-3">Repositories</h2>
          <ul className="divide-y divide-rule border-y border-rule">
            {REPOSITORIES.filter((r) => r.id !== "site").map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3"><a href={r.url} className="font-mono text-[0.85rem]">{r.slug}</a><span className="coord">{r.commit.slice(0, 7)}</span></li>
            ))}
            <li className="flex flex-wrap items-baseline justify-between gap-3 py-3"><a href={SITE.source} className="font-mono text-[0.85rem]">akadaan310/aanebed</a><span className="coord">this site</span></li>
          </ul>
        </section>

        <section aria-labelledby="s6">
          <h2 id="s6" className="label mb-3">Evidence</h2>
          <p className="text-ink-2">Every claim and its status, every reproduction run, and the AI-ingress results are on <Link href="/verify">/verify</Link>.</p>
        </section>

        <section aria-labelledby="s7">
          <h2 id="s7" className="label mb-3">Contact</h2>
          <p className="font-serif text-2xl"><a href={`mailto:${SITE.contact}`}>{SITE.contact}</a></p>
        </section>
      </div>
    </>
  );
}
