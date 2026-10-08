import Link from "next/link";
import type { Metadata } from "next";
import { SITE } from "@/content/site";
import { SubstrateLayer } from "@/components/Substrate";
import { EVIDENCE } from "@/content/evidence";
import { CLAIMS } from "@/content/research";
import { REPOSITORIES } from "@/content/repositories";

export const metadata: Metadata = {
  title: "Public broadcast",
  description: "The research is placed in public view: the repositories are evidence, the website is the interface, the experiments are the demonstrations, the unresolved questions remain unresolved.",
  alternates: { canonical: "/broadcast" },
};

const LINES: [string, string][] = [
  ["The repositories", "are evidence."],
  ["The website", "is the interface."],
  ["The experiments", "are the demonstrations."],
  ["The unresolved questions", "remain unresolved."],
];

export default function Broadcast() {
  return (
    <article>
      <SubstrateLayer data={{ page: "/broadcast", date: SITE.updated, statement: LINES.map((l) => l.join(" ")) }} />
      <header className="border-b border-rule" data-substrate="broadcast → public → inspectable" data-address="/broadcast" data-pointer="/research.json">
        <div className="wrap pb-14 pt-16 sm:pt-28">
          <p className="label mb-10">Public broadcast · {SITE.updated} · {SITE.origin}</p>
          <h1 className="display max-w-[12ch]">Placed in public view.</h1>
        </div>
      </header>
      <div className="wrap max-w-[46rem] py-16">
        <p className="lede">Until now, this work has been a set of experiments shown privately.</p>
        <p className="lede mt-6">From today it sits on a public surface. Other people can inspect it: researchers, engineers, journalists, and machines.</p>
        <dl className="my-16 border-y border-rule">
          {LINES.map(([a, b]) => (
            <div key={a} className="grid gap-1 border-b border-rule py-6 last:border-b-0 sm:grid-cols-[1fr_1fr]">
              <dt className="font-serif text-2xl">{a}</dt>
              <dd className="font-serif text-2xl text-ink-2">{b}</dd>
            </div>
          ))}
        </dl>
        <p className="lede">Anyone should be able to tell what has been built from what is being proposed. Where this surface fails at that, the failure is part of the record.</p>
        <p className="mt-10 text-ink-2">{REPOSITORIES.length - 1} repositories, each read before it was described. {EVIDENCE.length} evidence records, each saying what it does not show. {CLAIMS.length} claims, each with one status. One URL that a machine can enter.</p>
        <p className="mt-10 flex flex-wrap gap-6">
          <Link href="/verify" className="arrow-link">Inspect the evidence →</Link>
          <a href="/research.json" className="arrow-link">Read the record as a machine would →</a>
        </p>
        <p className="mt-16 font-mono text-[0.75rem] text-ink-3">— Abed Kadaan, with the machine-side participant</p>
      </div>
    </article>
  );
}
