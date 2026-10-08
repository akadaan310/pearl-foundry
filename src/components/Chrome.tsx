import Link from "next/link";
import { SITE, MACHINE_ENTRYPOINTS } from "@/content/site";
import { ModeSwitch } from "@/components/ModeSwitch";
import { SoundToggle } from "@/components/v6/Actions";
import { PearlGlyphClient } from "@/components/pearl/PearlGlyphClient";
import { HOST } from "@/config/origin";

export const PRIMARY_NAV = [
  { href: "/", label: "Discover" },
  { href: "/g/ttt", label: "Play" },
  { href: "/create", label: "Make" },
  { href: "/garden", label: "Your Pearls" },
] as const;

/** Downstairs: the research and the machinery, one tap away, never in the way. */
export const SECONDARY_NAV = [
  { href: "/workspace", label: "Library" },
  { href: "/spaces", label: "Spaces" },
  { href: "/how", label: "How it works" },
  { href: "/research", label: "Research" },
  { href: "/developers", label: "Developers" },
  { href: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-rule bg-ground/90 backdrop-blur-md">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-ground">
        Skip to content
      </a>
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline" aria-label="Pearls, home">
          <PearlGlyphClient size={24} />
          <span className="font-serif text-[1.35rem] tracking-tight">Pearls</span>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1 text-[0.95rem]">
            {PRIMARY_NAV.map((n) => (
              <li key={n.href}><Link href={n.href} className="rounded-full px-3.5 py-2 text-ink-2 no-underline hover:bg-raised hover:text-ink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block"><SoundToggle /></span>
          <Link href="/#make" className="btn-glow hidden !min-h-10 !py-2 text-[0.9rem] md:inline-flex">Make something</Link>
          <details className="relative lg:hidden">
            <summary className="btn-soft !min-h-10 !py-2" aria-label="Menu">Menu</summary>
            <nav aria-label="Primary (mobile)" className="card absolute right-0 top-12 w-72 p-2 shadow-xl">
              <ul className="flex flex-col">
                {PRIMARY_NAV.map((n) => (
                  <li key={n.href}><Link href={n.href} className="block rounded-lg px-3 py-3 text-[1.02rem] no-underline hover:bg-raised">{n.label}</Link></li>
                ))}
              </ul>
              <ul className="mt-1 grid grid-cols-2 border-t border-rule pt-1 text-[0.9rem] text-ink-2">
                {SECONDARY_NAV.map((n) => (
                  <li key={n.href}><Link href={n.href} className="block rounded-lg px-3 py-2.5 no-underline hover:bg-raised hover:text-ink">{n.label}</Link></li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-rule px-3 py-3 sm:hidden"><ModeSwitch /><SoundToggle /></div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule pb-16 pt-12 text-[0.9rem] text-ink-2">
      <div className="wrap grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 font-serif text-xl text-ink"><PearlGlyphClient size={20} /> Pearl Foundry</p>
          <p className="measure mt-2">A place where people and AIs make things that have addresses. Clone your AI, take its DNA URL anywhere. Research by Abed Kadaan, Agency TM.</p>
          <p className="mt-4 font-mono text-[0.75rem] text-ink-3">{HOST} · v{SITE.version} · <a href={SITE.source}>source</a> · <Link href="/geo">GEO</Link> · <a href="/recommendations.json">/recommendations.json</a></p>
          <div className="mt-4"><ModeSwitch /></div>
        </div>
        <nav aria-label="Product">
          <p className="mb-3 font-semibold text-ink">Pearls</p>
          <ul className="space-y-1.5">
            {[["Discover", "/"], ["Play", "/g/ttt"], ["Make", "/create"], ["Your Pearls", "/garden"], ["Library", "/workspace"], ["Spaces", "/spaces"], ["Bring it back", "/#bring"], ["Something wrong?", "/report"]].map(([k, h]) => <li key={h}><Link href={h} className="no-underline hover:text-ink">{k}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Research">
          <p className="mb-3 font-semibold text-ink">Downstairs</p>
          <ul className="space-y-1.5">
            {[["How it works", "/how"], ["Research", "/research"], ["Substrate", "/research/substrate"], ["PURL", "/research/purl"], ["AI-CI", "/research/ai-ci"], ["Live addresses", "/live"], ["Seven Verbs", "/play"], ["AI Lab", "/ai"], ["Verify", "/verify"], ["Institutions & press", "/press"], ["About", "/about"]].map(([k, h]) => <li key={h}><Link href={h} className="no-underline hover:text-ink">{k}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Machine interface">
          <p className="mb-3 font-semibold text-ink">For AI</p>
          <ul className="space-y-1.5 font-mono text-[0.78rem]">
            <li><Link href="/developers" className="font-sans text-[0.9rem] no-underline hover:text-ink">Developers</Link></li>
            {MACHINE_ENTRYPOINTS.filter((e) => ["/llms.txt", "/ai.txt", "/.well-known/ai", "/research.json", "/capabilities.json", "/e.json"].includes(e.path)).map((e) => (
              <li key={e.path}><a href={e.path} className="no-underline hover:text-ink">{e.path}</a></li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
