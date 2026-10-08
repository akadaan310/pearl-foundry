/** The Pearl mark: a small ring with a highlight. Decorative; always paired with text. */
export function PearlGlyphClient({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="inline-block shrink-0">
      <circle cx="8" cy="8" r="6.4" className="fill-none stroke-gold" strokeWidth="1.1" />
      <circle cx="6.2" cy="6" r="1.7" className="fill-ink" opacity="0.85" />
      <path d="M2.6 9.5 A6 6 0 0 0 13.4 9.5" className="fill-none stroke-gold" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}
