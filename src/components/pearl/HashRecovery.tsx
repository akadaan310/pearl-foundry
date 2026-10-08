"use client";

import { useEffect } from "react";

/**
 * A raw "#" in a Pearl link cuts it short: the browser never sends what
 * follows. If the fragment clearly continues the grammar (it contains "&b",
 * "&title=" …), put it back as text (%23) and reload with the full Pearl.
 */
export function HashRecovery() {
  useEffect(() => {
    const h = location.hash.slice(1);
    if (h && /(^|&)(b\d*|title|by|session|for|type|s)=/.test(h)) {
      location.replace(location.pathname + location.search + "%23" + h.replace(/#/g, "%23"));
    }
  }, []);
  return null;
}
