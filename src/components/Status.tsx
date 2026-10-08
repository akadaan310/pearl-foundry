import { TAXONOMY } from "@/content/site";
import type { EvidenceStatus, Tier } from "@/content/types";

/** Shape and text carry the meaning; colour only reinforces it. */
const GLYPH: Record<Tier, string> = { demonstrated: "●", proposed: "◐", open: "○" };
const TONE: Record<Tier, string> = {
  demonstrated: "text-emerald border-emerald/50",
  proposed: "text-gold border-gold/50",
  open: "text-ink-2 border-rule-strong border-dashed",
};

export function StatusBadge({ status, className = "" }: { status: EvidenceStatus; className?: string }) {
  const t = TAXONOMY[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap border px-1.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] ${TONE[t.tier]} ${className}`}
      title={t.definition}
      data-status={status}
    >
      <span aria-hidden="true">{GLYPH[t.tier]}</span>
      {t.label}
    </span>
  );
}

export function TierMark({ tier, label }: { tier: Tier; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.1em] ${TONE[tier].split(" ")[0]}`}>
      <span aria-hidden="true">{GLYPH[tier]}</span>
      {label ?? tier}
    </span>
  );
}
