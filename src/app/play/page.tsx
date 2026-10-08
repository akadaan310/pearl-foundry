import type { Metadata } from "next";
import Link from "next/link";
import { SevenVerbs, SharedSurface } from "@/components/living/PlayApp";
import { SubstrateLayer } from "@/components/Substrate";

export const metadata: Metadata = {
  title: "Play",
  description: "Discovery modes: the Seven Verbs (an experimental URL interaction grammar from SEURL and MUSA) and a shared surface in Golden Surface's vocabulary. Simulated in your browser.",
  alternates: { canonical: "/play" },
};

export default function Play() {
  return (
    <>
      <SubstrateLayer data={{ page: "/play", modes: ["seven-verbs", "shared-surface"], sources: ["MUSA luna-agent/protocols/url-machine.md", "seurl/README.md", "golden-surface docs/SYNC.md (via src/lib/goldenSync.ts)"], status: { seven_verbs: "experimental interaction grammar; C-12 remains HYPOTHESIS", shared_surface: "browser-side simulation" } }} />
      <header className="paper-glow border-b border-rule">
        <div className="wrap act !pb-12">
          <p className="eyebrow mb-5">Play · discovery modes</p>
          <h1 className="keynote max-w-[15ch]">We haven&apos;t moved till you came. What&apos;s next?</h1>
          <p className="mt-6 max-w-[46ch] text-[1.2rem] text-ink-2">Two small worlds where the URL is the computer. Each move shows the state you were in, the legal move you made, what happened, and the address you reached.</p>
        </div>
      </header>
      <section aria-labelledby="verbs-h" className="wrap py-14">
        <p className="eyebrow mb-2">SEURL · the Seven Verbs</p>
        <h2 id="verbs-h" className="title max-w-[24ch]">START, SWITCH, WRITE, COMMIT, BUILD, TALK, PERTURB.</h2>
        <p className="measure mt-4 text-ink-2">The verbs and their transitions are written in MUSA&apos;s <span className="font-mono text-[0.85rem]">url-machine.md</span>. What a move <em>is</em> mechanically is left open in the SEURL repository, so this is this site&apos;s interpretation, built only from registered operations: a session&apos;s address is a computational address, WRITE drafts typed Pearl blocks (text, never code), BUILD runs the real Pearl parser. It is an experimental interaction grammar, not a programming language. Whether an AI given only the SEURL address will begin programming URLs is still a <Link href="/research/seurl">hypothesis (C-12)</Link>.</p>
        <div className="mt-8"><SevenVerbs /></div>
      </section>
      <section aria-labelledby="surface-h" className="rule-t">
        <div className="wrap py-14">
          <p className="eyebrow mb-2">Golden Surface · a shared surface</p>
          <h2 id="surface-h" className="title max-w-[24ch]">Participant → surface → operation → authority → state → convergence.</h2>
          <p className="measure mt-4 text-ink-2">Three parties share one browser. Every tab has an owner, and an operation outside a participant&apos;s authority is not offered; if attempted, it is refused and logged. The pilot&apos;s phone and the server twin converge under Golden Surface&apos;s declared sync rules (the <Link href="/research/golden-surface#model">same model as the research page</Link>). This is a simulation in your browser: no page is fetched, and the pages are this site&apos;s own computational addresses.</p>
          <div className="mt-8"><SharedSurface /></div>
        </div>
      </section>
    </>
  );
}
