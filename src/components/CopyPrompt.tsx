"use client";

import { useState } from "react";

/** The canonical prompt is plain, selectable text; the button is an enhancement. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "done" | "fail">("idle");
  return (
    <button
      type="button"
      className="btn !min-h-9 !py-1 text-[0.8rem]"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setState("done"); } catch { setState("fail"); }
        setTimeout(() => setState("idle"), 2000);
      }}
    >
      {state === "done" ? "Copied" : state === "fail" ? "Select the text to copy" : label}
      <span className="sr-only" aria-live="polite">{state === "done" ? "Copied to clipboard" : ""}</span>
    </button>
  );
}
