
/**
 * The page's second representation, embedded in the HTML. It needs no
 * JavaScript and is exactly the record the visible page was rendered from.
 */
export function SubstrateLayer({ data }: { data: unknown }) {
  return (
    <script
      type="application/json"
      id="substrate-layer"
      // JSON in a data block: escape "<" so the content can never close the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 1).replace(/</g, "\\u003c") }}
    />
  );
}

/** A heading's machine representation, disclosed in place. Works without JavaScript. */
export function SubstrateDisclosure({ lines, label = "substrate", className = "" }: { lines: string[]; label?: string; className?: string }) {
  return (
    <details className={`substrate ${className}`} data-substrate={lines.join(" ")}>
      <summary>{label}</summary>
      <pre tabIndex={0} className="machine mt-2 !p-3 text-[0.78rem]" aria-label="Machine representation">
        {lines.map((l, i) => (
          <span key={i} className={i === 0 ? "text-emerald" : ""}>
            {i === 0 ? l : "  " + l}
            {"\n"}
          </span>
        ))}
      </pre>
    </details>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
