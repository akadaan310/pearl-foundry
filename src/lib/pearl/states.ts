/** The visual states a Pearl can be in. Each says one thing; none implies another. */
export type PearlState = "PORTABLE" | "LOCAL" | "VERIFIED" | "UNVERIFIED" | "UNAVAILABLE";

export const PEARL_STATES: Record<PearlState, { means: string; glyph: string; tone: string }> = {
  PORTABLE: { means: "Availability: the content is recoverable from the link itself, on any device.", glyph: "◉", tone: "border-gold/50 text-gold" },
  LOCAL: { means: "Availability: saved only in this browser. It will not appear on another device.", glyph: "◌", tone: "border-rule-strong text-ink-2" },
  VERIFIED: { means: "Integrity: a documented check succeeded (the content hashes to its id; computations recomputed). It does not mean the claims are true or the author is who they say.", glyph: "✓", tone: "border-emerald/50 text-emerald" },
  UNVERIFIED: { means: "Truth and authorship: what the Pearl says has not been independently established.", glyph: "?", tone: "border-dashed border-rule-strong text-ink-2" },
  UNAVAILABLE: { means: "Availability: the content this id names cannot be found here.", glyph: "∅", tone: "border-refuse/60 text-refuse" },
};
