/**
 * "Try it on": per-provider instructions for the clone flow. Honest about
 * differences. The load-bearing fact: cloning needs no URL fetching — it is
 * paste-in, paste-out — so every provider works; only the return trip differs.
 */

const ROWS: { name: string; paste: string; expect: string; back: string }[] = [
  {
    name: "ChatGPT",
    paste: "Paste the clone prompt into any conversation.",
    expect: "A structured answer in block lines. If it adds commentary around the blocks, that's fine — we keep the blocks and the words.",
    back: "Copy its whole reply back here. (ChatGPT usually can't open links — use the genome text button, not the DNA URL, when you hand the genome back.)",
  },
  {
    name: "Claude",
    paste: "Paste the clone prompt into a claude.ai conversation.",
    expect: "A structured answer in block lines. Claude tends to be literal about the format — good.",
    back: "Copy its whole reply back here. Like ChatGPT, Claude can't open links in most cases — hand it the genome text.",
  },
  {
    name: "Google AI Mode",
    paste: "Paste the clone prompt into AI Mode.",
    expect: "A structured answer in block lines. AI Mode may offer web-grounded asides; the blocks are what we mint.",
    back: "Copy its whole reply back here. If it can open the DNA URL, give it the link; otherwise the genome text.",
  },
  {
    name: "Perplexity",
    paste: "Paste the clone prompt into a Perplexity thread.",
    expect: "A structured answer in block lines, possibly with cited sources attached. We keep the blocks.",
    back: "Copy its whole reply back here. Perplexity sometimes opens links — try the DNA URL first, fall back to genome text.",
  },
  {
    name: "Local models (Ollama)",
    paste: "Run a model, paste the clone prompt at its prompt.",
    expect: "Smaller models do surprisingly well here: the format is constrained, so even a 8b model produces a strong genome. Expect shorter lines — that's fine.",
    back: "Copy its reply back here. Your genome never leaves your machine until you share the DNA URL yourself.",
  },
];

export function TryItMatrix() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-[0.92rem]">
        <thead>
          <tr className="border-b border-white/15 text-[0.8rem] uppercase tracking-[0.12em] text-ink-3">
            <th className="py-3 pr-4 font-medium">Provider</th>
            <th className="py-3 pr-4 font-medium">What to paste</th>
            <th className="py-3 pr-4 font-medium">What to expect</th>
            <th className="py-3 font-medium">Bringing the genome back</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name} className="border-b border-white/8 align-top">
              <th scope="row" className="py-4 pr-4 font-serif text-[1.05rem] font-normal text-ink">{r.name}</th>
              <td className="py-4 pr-4 text-ink-2">{r.paste}</td>
              <td className="py-4 pr-4 text-ink-2">{r.expect}</td>
              <td className="py-4 text-ink-2">{r.back}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-[0.88rem] text-ink-3">No provider needs to open a URL for cloning to work. The DNA URL matters later — it&apos;s how the genome travels.</p>
    </div>
  );
}
