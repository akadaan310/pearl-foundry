import type { Metadata } from "next";
import Link from "next/link";
import { SubstrateLayer } from "@/components/Substrate";
import { Chain } from "@/components/Chain";
import { CopyButton } from "@/components/CopyPrompt";
import { LIFE_EXAMPLE } from "@/content/compose";
import { PROMPTS } from "@/content/prompts";
import { ORIGIN, HOST } from "@/config/origin";

export const metadata: Metadata = {
  title: "Continuity Pearls",
  description: "Carry a conversation between AI sessions with a continuity Pearl: what it holds, the round trip, what is stored, and what is not claimed.",
  alternates: { canonical: "/continue" },
};

const NOT_CLAIMED = [
  "No model state is copied, moved or merged. A Pearl carries only what a session wrote into it; the next session reads it and chooses to continue.",
  "Names in a Pearl (by=, session=) are asserted by the composer, not proven. The content id proves the content is intact, not who wrote it or that it is true.",
  "Whether a given AI product will compose a valid Pearl, or open one by itself, varies by product and has not been tested across products. Some can only read links you paste.",
  "Pearls you keep are stored in your browser only. They do not sync to other devices.",
];

export default function Continue() {
  const first = PROMPTS.find((p) => p.id === "first-pearl")!;
  const resume = PROMPTS.find((p) => p.id === "resume")!;
  return (
    <>
      <SubstrateLayer data={{ page: "/continue", kind: "continuity", round_trip: ["AI A composes", "person inspects", "person keeps", "person copies link", "AI B reads", "AI B composes update", "person imports update"], not_claimed: NOT_CLAIMED, brain: "proposed: requires durable storage, not enabled on this deployment" }} />
      <header className="grid-paper border-b border-rule" data-substrate="ai a → pearl → person → ai b → updated pearl" data-address="/continue" data-pointer="/research.json">
        <div className="wrap pb-14 pt-16 sm:pt-24">
          <p className="label mb-8">§ continuity pearls</p>
          <h1 className="display max-w-[13ch]">Carry a conversation to another AI.</h1>
          <p className="lede measure mt-8">Your conversations with AI happen in separate rooms that forget each other. A continuity Pearl is a link one room writes and another room reads.</p>
          <div className="mt-8 flex flex-wrap gap-3"><CopyButton text={first.prompt} label="Copy the prompt that makes one" /><CopyButton text={ORIGIN} label={`Copy ${HOST}`} /></div>
        </div>
      </header>

      <section className="wrap py-14" aria-labelledby="how-h">
        <h2 id="how-h" className="label mb-6">The round trip</h2>
        <Chain steps={[
          { k: "AI A", v: "takes stock of your conversation and composes a Pearl link" },
          { k: "You", v: "bring it here: inspect, keep, copy" },
          { k: "AI B", v: "reads the Pearl and continues the work" },
          { k: "AI B", v: "composes an updated Pearl: a new link" },
          { k: "You", v: "bring it back: both versions kept, side by side" },
        ]} caption="The original is never rewritten. The update records which Pearl it continues; the two sessions stay distinct." />
        <div className="mt-8 flex flex-wrap gap-4">
          <a href={LIFE_EXAMPLE.replace(ORIGIN, "")} className="arrow-link">Open an example continuity Pearl →</a>
          <Link href="/#bring" className="arrow-link">Bring yours →</Link>
          <Link href={`/prompts#prompt-${resume.id}`} className="arrow-link">The prompt for AI B →</Link>
        </div>
      </section>

      <section className="wrap py-14" aria-labelledby="ex-h">
        <h2 id="ex-h" className="label mb-6">What a continuity Pearl holds</h2>
        <div className="grid gap-px border border-rule bg-rule md:grid-cols-3">
          {[["Context", "Who you are to each other, how you talk, what happened."], ["Vocabulary", "Nicknames and the words you made up: the things only you two would know."], ["Decisions", "What was decided, so nobody re-decides it."], ["Open threads", "What is unresolved, and what got closed."], ["Next actions", "The concrete next step for whoever continues."], ["Provenance", "Which session wrote it, and that all of it is asserted, not verified."]].map(([k, v]) => (
            <div key={k} className="bg-ground p-5"><p className="font-serif text-xl">{k}</p><p className="mt-2 text-[0.9rem] text-ink-2">{v}</p></div>
          ))}
        </div>
      </section>

      <section className="wrap py-14" aria-labelledby="brain-h">
        <h2 id="brain-h" className="label mb-4 !text-gold">Proposed: a shared continuity brain</h2>
        <p className="measure text-ink-2">The repository also contains a durable “continuity brain” (/c/…, ACSP-CB/0.1): one short link that many sessions append to, with a hash-chained record. It is implemented and tested against PostgreSQL, but it needs server storage, which this deployment deliberately does not have yet. Until then, continuity travels in Pearls. See <a href="https://github.com/akadaan310/aanebed/blob/HEAD/docs/architecture/FUTURE_PERSISTENCE.md">the persistence plan</a>.</p>
      </section>

      <section className="wrap py-14" aria-labelledby="not-h">
        <h2 id="not-h" className="label mb-6 !text-gold">What is not claimed</h2>
        <ul className="space-y-3 text-ink-2">{NOT_CLAIMED.map((x, i) => <li key={i} className="border-l border-gold/60 pl-4">{x}</li>)}</ul>
      </section>
    </>
  );
}
