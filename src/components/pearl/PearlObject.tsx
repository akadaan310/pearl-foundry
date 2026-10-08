import Link from "next/link";
import type { Pearl } from "@/lib/pearl/model";
import { TYPE_INFO } from "@/lib/pearl/model";
import { PearlGlyphClient } from "./PearlGlyphClient";

/** A Pearl as a tangible object: a real Pearl, rendered as a card you can open. */
export function PearlObject({ pearl, id, href, tilt = false }: { pearl: Pearl; id: string; href: string; tilt?: boolean }) {
  const cs = pearl.blocks.filter((b) => b.type === "c") as { kind: string; key?: string; text: string }[];
  const show = cs.filter((c) => ["ai", "human", "nick", "lex", "decision", "action"].includes(c.kind)).slice(0, 5);
  const label: Record<string, string> = { ai: "AI", human: "You", nick: "Nickname", lex: "Your word", decision: "Decided", action: "Next" };
  return (
    <Link href={href} aria-label={`Open the Pearl “${pearl.title}”`}
      className={`card group relative block overflow-hidden no-underline shadow-[0_30px_60px_-30px_rgb(60_40_10/0.45)] transition-transform duration-300 hover:-translate-y-1 ${tilt ? "lg:rotate-[1.5deg] lg:hover:rotate-0" : ""}`}>
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff_0%,#f3ead8_35%,#e2d3b4_70%,#cbb68f_100%)] opacity-90 shadow-[inset_-12px_-14px_30px_rgb(120_90_40/0.25)]" aria-hidden="true" />
      <div className="relative p-6">
        <p className="flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-emerald"><PearlGlyphClient size={16} /> {TYPE_INFO[pearl.type].label} Pearl</p>
        <p className="mt-3 max-w-[18ch] font-serif text-[1.9rem] leading-tight">{pearl.title}</p>
        <ul className="mt-5 space-y-2">
          {show.map((c, i) => (
            <li key={i} className="flex gap-3 text-[0.95rem]"><span className="w-20 shrink-0 text-[0.78rem] uppercase tracking-wide text-ink-3">{label[c.kind]}</span><span className="text-ink-2">{c.key ? <><span className="font-medium text-ink">{c.key}</span> — {c.text}</> : c.text}</span></li>
          ))}
        </ul>
        <p className="mt-6 flex items-center justify-between gap-3 border-t border-rule pt-4 text-[0.82rem] text-ink-3">
          <span>Ready to carry · lives in its link</span>
          <span className="font-mono text-ink-2">{id}</span>
        </p>
      </div>
    </Link>
  );
}
