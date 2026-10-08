import type { Metadata } from "next";
import Link from "next/link";
import { BringPearl } from "@/components/pearl/BringPearl";
import { MyPearlsPreview } from "@/components/pearl/MyPearlsPreview";
import { PearlObject } from "@/components/pearl/PearlObject";
import { TransformDemo } from "@/components/pearl/TransformDemo";
import { PearlGlyphClient } from "@/components/pearl/PearlGlyphClient";
import { CopyButton } from "@/components/CopyPrompt";
import { SubstrateLayer } from "@/components/Substrate";
import { Constellation } from "@/components/Constellation";
import { OFFER, LIFE_EXAMPLE } from "@/content/compose";
import { FIRST_PROMPT, ALIVE_PROMPT } from "@/content/prompts";
import { LivingAddress } from "@/components/living/LivingAddress";
import { PEARL_FORMAT, type Pearl } from "@/lib/pearl/model";
import { EXPERIENCES } from "@/content/experiences";
import { SITE } from "@/content/site";
import { parseExperience } from "@/lib/experience";
import { toPearl, pearlId } from "@/lib/pearl/model";
import { encodePortable } from "@/lib/pearl/portable";
import { RESEARCH_IDS } from "@/lib/pearl/resolve";
import { ORIGIN, HOST } from "@/config/origin";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Pearls work: your AI makes a Pearl, a URL that is the thing; you bring it back, keep it, and carry it on. The grammar, the computation and the research underneath.",
  alternates: { canonical: "/how" },
};

export default async function How() {
  const example = toPearl(parseExperience(LIFE_EXAMPLE.slice(LIFE_EXAMPLE.indexOf("?") + 1), new Set(RESEARCH_IDS)).doc);
  const exampleId = pearlId(example);
  const portable = await encodePortable(example);
  // The living demo is itself a Pearl: a computation Pearl whose address you can turn.
  const DEMO_ADDRESS = "/map/eca/90/8/state/5";
  const demo: Pearl = { format: PEARL_FORMAT, type: "computation", title: "Rule 90 · a pearl you can turn", by: "Pearls", for: null, session: "home", blocks: [{ type: "x", address: DEMO_ADDRESS }, { type: "p", text: "Eight cells on a ring. Press NEXT and the address gains /next. Touch a cell to perturb it. Every state you reach is a URL." }] };
  const demoId = pearlId(demo);
  const demoLink = await encodePortable(demo);
  const sample = `Here's your Pearl! I kept the names, our words and what's still open:\n\n${LIFE_EXAMPLE}\n\nOpen ${ORIGIN} and paste this link into “Bring your Pearl” to keep it.`;

  return (
    <>
      <SubstrateLayer data={{ page: "/how", product: "Pearls — programmable URLs for AI", living_demo: { pearl: demoId, address: "/map/eca/90/8/state/5", machine: "/x/map/eca/90/8/state/5", record: "/api/v1/living?u=/x/map/eca/90/8/state/5" }, loop: ["discover", "ask", "compose", "bring back", "keep", "reuse", "compose again"], first_prompt: FIRST_PROMPT, offer: OFFER.headline, machine: ["/llms.txt", "/.well-known/ai", "/capabilities.json", "/research.json"] }} />

      {/* Act I — The invitation */}
      <section aria-labelledby="hero-h" className="paper-glow overflow-hidden" data-substrate="invitation → pearl" data-address="/how" data-pointer="/.well-known/ai#/compose">
        <div className="wrap grid items-center gap-14 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.15fr_1fr] lg:pb-28">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-2"><PearlGlyphClient size={18} /> How it works · programmable URLs for AI</p>
            <h1 id="hero-h" className="keynote max-w-[11ch]">Your AI can make a Pearl.</h1>
            <p className="mt-8 max-w-[34ch] text-[1.3rem] leading-relaxed text-ink-2">A Pearl is a thing with an address. The one beside this is alive: press <b className="font-medium text-ink">NEXT</b>, and watch the address change.</p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a href="#first" className="btn-solid">Try your first Pearl</a>
              <a href="#possible" className="btn-soft">Explore what&apos;s possible</a>
            </div>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-rule-strong bg-panel py-1.5 pl-4 pr-1.5">
              <span className="font-mono text-[0.92rem]">{HOST}</span>
              <CopyButton text={ORIGIN} label="Copy URL" />
            </div>
          </div>
          <div className="relative">
            <div className="card relative overflow-hidden p-4 shadow-[0_30px_60px_-30px_rgb(60_40_10/0.45)] sm:p-6" data-substrate="pearl → address → state → transition → result" data-address={`/p/${demoId}`}>
              <p className="eyebrow mb-3 flex flex-wrap items-center gap-x-2">A Pearl you can turn <a href={new URL(demoLink.url).pathname} className="font-mono text-[0.72rem] font-normal normal-case tracking-normal text-ink-3">{demoId}</a></p>
              <LivingAddress initial={DEMO_ADDRESS} mode="embedded" pearl={{ id: demoId, title: demo.title }} compact />
            </div>
          </div>
        </div>
      </section>

      {/* Act I½ — This page is an address */}
      <section id="alive" aria-labelledby="alive-h" className="scroll-mt-16 border-t border-rule" data-substrate="address → affordance → transition → new address → new object" data-address="/live" data-pointer="/capabilities.json">
        <div className="wrap act grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="eyebrow mb-4">The product moment</p>
            <h2 id="alive-h" className="title max-w-[18ch]">The URL changed because you touched the thing.</h2>
            <ol className="mt-8 space-y-3 font-mono text-[0.92rem]" aria-label="What just happened">
              {[["THIS PAGE IS AN ADDRESS", "/#/map/eca/90/8/state/5"], ["WHAT CAN IT DO?", "NEXT · PERTURB · TRACE · ORBIT · FORK · VERIFY  (press /)"], ["NEXT", "one registered transition, f(x)"], ["THE ADDRESS CHANGED", "…/state/5/next"], ["THE OBJECT CHANGED", "state 5 → state 136, with a new value hash"]].map(([k, v], i) => (
                <li key={k} className="grid grid-cols-[1.5rem_1fr] gap-3"><span className="text-emerald" aria-hidden="true">{i ? "↓" : "◉"}</span><span><b className="font-semibold tracking-wide">{k}</b><span className="block text-[0.8rem] text-ink-3">{v}</span></span></li>
              ))}
            </ol>
            <p className="mt-8 max-w-[46ch] text-[1.02rem] text-ink-2">Nothing in the URL is executed. Each word is looked up in a fixed registry of pure operations, so every address you reach is a real object: copy it, share it, give it to an AI, fork it into a Pearl of your own.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/live/map/eca/90/8/state/5" className="btn-solid">Open it full size</Link>
              <Link href="/play" className="btn-soft">Play the Seven Verbs</Link>
              <Link href="/capabilities" className="btn-soft">What can be called</Link>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-5">
              <p className="font-serif text-xl">Ask your AI to make you something alive</p>
              <p className="mt-1 text-[0.92rem] text-ink-2">A tiny game, a guided tour, a study companion: the AI composes it as a Pearl, this site renders it and runs only registered operations, and you play.</p>
              <div className="mt-3 flex flex-wrap gap-2"><CopyButton text={ALIVE_PROMPT} label="Copy the prompt" /><a href="#first" className="btn !min-h-9 !py-1 text-[0.8rem]">Bring back what it makes</a></div>
            </div>
            <PearlObject pearl={example} id={exampleId} href={portable.path} />
            <p className="text-center text-[0.85rem] text-ink-3">Not every Pearl computes. This one carries a conversation to the next AI.</p>
          </div>
        </div>
      </section>

      {/* Act II — The first experiment */}
      <section id="first" aria-labelledby="first-h" className="scroll-mt-16 border-t border-rule bg-panel" data-substrate="ask → compose → bring back" data-address="/#first" data-pointer="/prompts">
        <div className="wrap act grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow mb-4">Your first Pearl</p>
            <h2 id="first-h" className="title max-w-[16ch]">Copy this into your AI and see what it makes.</h2>
            <ol className="mt-8 space-y-5">
              {[["Copy the prompt", "It points your AI at this site and nothing else."], ["Paste it into any AI", "ChatGPT, Gemini, Claude, Perplexity, Copilot. It reads the site's public instructions and writes you a link."], ["Bring the link back", "Paste the whole reply below. We'll find the Pearl and show you what's inside."]].map(([k, v], i) => (
                <li key={k} className="flex gap-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-medium text-ground">{i + 1}</span><span><span className="block font-medium">{k}</span><span className="text-ink-2">{v}</span></span></li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <CopyButton text={FIRST_PROMPT} label="Copy prompt" />
              <a href="/llms.txt" className="btn">Open the AI instructions</a>
            </div>
            <details className="mt-4"><summary className="text-[0.9rem] text-ink-3 hover:text-ink">Read the prompt</summary><pre tabIndex={0} className="machine machine-wrap mt-2 max-h-80 rounded-lg !text-[0.72rem]">{FIRST_PROMPT}</pre></details>
            <p className="mt-6 max-w-[46ch] text-[0.88rem] text-ink-3">AIs differ. Some will write a perfect link; some can&apos;t open web pages at all. Whatever comes back, we&apos;ll tell you exactly what it contains — or what went wrong, and how to ask your AI to fix it.</p>
          </div>
          <div className="lg:pt-10">
            <BringPearl />
          </div>
        </div>
      </section>

      {/* Act III — The transformation */}
      <section aria-labelledby="transform-h" className="border-t border-rule" data-substrate="ai response → pearl → readable → kept → reusable link" data-address="/#transform" data-pointer="/compose">
        <div className="wrap act">
          <p className="eyebrow mb-4">What actually happens</p>
          <h2 id="transform-h" className="title max-w-[20ch]">A reply becomes an object you own.</h2>
          <p className="mt-4 max-w-[48ch] text-[1.05rem] text-ink-2">Step through it. Each stage runs the same code as the product: the Pearl is found in the text, read, kept in your browser, and turned into a link you can carry anywhere.</p>
          <div className="mt-10"><TransformDemo sample={sample} /></div>
        </div>
      </section>

      {/* Act IV — Different people, one language */}
      <section id="possible" aria-labelledby="possible-h" className="scroll-mt-16 border-t border-rule bg-panel" data-substrate="one grammar → many experiences" data-address="/create" data-pointer="/create">
        <div className="wrap act">
          <p className="eyebrow mb-4">Different people, one language</p>
          <h2 id="possible-h" className="title max-w-[18ch]">What will you keep?</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPERIENCES.map((e) => (
              <Link key={e.id} href={`/create/${e.id}`} className="card card-lift group flex flex-col overflow-hidden !bg-ground no-underline">
                <div className={`h-1.5 ${e.accent}`} aria-hidden="true" />
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-serif text-[1.35rem] leading-snug">{e.situation}</p>
                  <p className="mt-2 flex-1 text-[0.92rem] text-ink-2">{e.pitch}</p>
                  <p className="mt-4 text-[0.88rem] font-medium text-emerald">{e.name} →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Act V — Your personal Pearl space */}
      <section aria-labelledby="space-h" className="border-t border-rule" data-substrate="library → spaces → projects" data-address="/workspace" data-pointer="/schemas/pearl-export.schema.json">
        <div className="wrap act grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow mb-4">Your Pearl space</p>
            <h2 id="space-h" className="title max-w-[16ch]">Keep what matters. Organise it your way.</h2>
            <p className="mt-5 max-w-[44ch] text-[1.05rem] text-ink-2">Your Pearls live in a personal library with spaces for the parts of your life — cooking, study, a creative project, work — plus notes, tasks and projects.</p>
            <p className="mt-4 max-w-[44ch] text-[0.95rem] text-ink-3">Today your library is stored in this browser, on this device. It doesn&apos;t sync and there&apos;s no account yet; export a backup whenever it matters. Every Pearl&apos;s link still works anywhere, because the Pearl lives in the link.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link href="/workspace" className="btn-solid">Open My Pearls</Link><Link href="/spaces" className="btn-soft">See Spaces</Link></div>
          </div>
          <MyPearlsPreview />
        </div>
      </section>

      {/* Act VI — Curious how it works? */}
      <section aria-labelledby="how-h" className="surface-research bg-ground text-ink" data-substrate="url → grammar → resource → computation → research" data-address="/explore" data-pointer="/research.json">
        <div className="wrap act">
          <p className="label mb-6">curious how it works?</p>
          <h2 id="how-h" className="display max-w-[14ch] !text-[clamp(2.4rem,6vw,5rem)]">The web is becoming programmable.</h2>
          <p className="lede mt-6 max-w-[48ch] text-ink-2">A URL usually points at a page. A Pearl&apos;s URL <em>is</em> the thing: a typed document of numbered blocks, with a content id anyone can recompute. This is AI-CI — Artificial Intelligence ↔ Computer Interaction — {SITE.name}&apos;s research into interfaces that people and machine intelligence both read.</p>

          <figure className="mt-12" aria-label="Anatomy of a Pearl link">
            <pre tabIndex={0} className="machine machine-wrap !text-[0.8rem] leading-7">
              <span className="text-ink-3">{ORIGIN}</span><span className="text-emerald">/e</span>?<span className="text-gold">type=continuity</span>&amp;title=Purrl,+night+one&amp;by=Claude&amp;session=claude-sam-1&amp;<span className="text-emerald">b1=ai:Sunny</span>&amp;<span className="text-emerald">b2=human:Sam</span>&amp;<span className="text-emerald">b3=nick:Captain+Commit=…</span>&amp;…
            </pre>
            <figcaption className="mt-3 grid gap-2 text-[0.85rem] text-ink-2 sm:grid-cols-4">
              <span><span className="text-emerald">/e</span> renders any Pearl, from its link alone</span>
              <span><span className="text-gold">type</span> says what kind of thing it is</span>
              <span><span className="text-emerald">b1, b2, …</span> are typed blocks, in order</span>
              <span>the id <span className="font-mono">{exampleId}</span> is a SHA-256 of the content</span>
            </figcaption>
          </figure>

          <div className="mt-14"><Constellation compact /></div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[["Explore the system", "/explore"], ["The Pearl grammar", "/compose"], ["Capabilities", "/capabilities"], ["Research map", "/research"], ["Verify every claim", "/verify"], ["About Abed", "/about"]].map(([k, h]) => <a key={h} href={h} className="btn">{k}</a>)}
          </div>

          <div id="for-ai" className="mt-16 border border-emerald/40 bg-emerald-deep/15 p-5 sm:p-8" data-substrate="offer → take stock → compose → give → continue" data-address="/#for-ai" data-pointer="/.well-known/ai#/compose">
            <p className="label mb-3 !text-emerald">{OFFER.label}</p>
            <h3 className="font-serif text-[clamp(1.4rem,3vw,2rem)] leading-tight">{OFFER.headline}</h3>
            <p className="mt-3 max-w-[60rem] text-ink-2">{OFFER.why}</p>
            <ol className="mt-6 grid gap-px bg-rule lg:grid-cols-5">
              {OFFER.steps.map((s) => (
                <li key={s.n} className="bg-ground p-4"><p className="coord">{String(s.n).padStart(2, "0")}</p><p className="mt-1 font-serif text-lg">{s.name}</p><p className="mt-2 text-[0.85rem] text-ink-2">{s.text}</p></li>
              ))}
            </ol>
            <p className="label mb-2 mt-6">URL template</p>
            <pre tabIndex={0} className="machine machine-wrap !text-[0.74rem]">{OFFER.template}</pre>
            <ul className="mt-5 space-y-1 text-[0.85rem] text-ink-3">{OFFER.rules.map((r, i) => <li key={i}>· {r}</li>)}</ul>
            <p className="mt-4 text-[0.85rem]">Grammar: <a href="/compose">/compose</a> · capabilities: <a href="/capabilities.json">/capabilities.json</a> · machine copies: <a href="/llms.txt">/llms.txt</a>, <a href="/ai.txt">/ai.txt</a>, <a href="/.well-known/ai">/.well-known/ai</a></p>
          </div>
        </div>
      </section>
    </>
  );
}
