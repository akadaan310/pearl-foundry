"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "./CopyPrompt";

/** Shows the owner key from the URL fragment once, then removes it from the address bar. */
export function OwnerKey({ code }: { code: string }) {
  const [key, setKey] = useState<string | null>(null);
  useEffect(() => {
    const m = /key=([0-9A-Z]{20,40})/.exec(location.hash);
    if (m) {
      setKey(m[1]);
      history.replaceState(null, "", location.pathname + location.search);
    }
  }, []);
  if (!key) return null;
  return (
    <div className="mt-8 border border-rule-strong p-4">
      <p className="label mb-2">your erase key · shown once</p>
      <p className="break-all font-mono text-[0.85rem] text-ink">{key}</p>
      <p className="mt-2 text-[0.85rem] text-ink-3">Only this key can erase brain {code}. It is not stored anywhere readable, and no AI session has it. Keep it somewhere private.</p>
      <div className="mt-3"><CopyButton text={key} label="Copy erase key" /></div>
    </div>
  );
}
