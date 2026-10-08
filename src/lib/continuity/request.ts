import { parseExperience } from "../experience";
import { RESEARCH_IDS } from "../experience-request";
import { bodyFrom, fold, normaliseCode, type EventBody } from "./model";
import { getStore, type ReadResult } from "./store";

import { ORIGIN } from "../../config/origin";
export { ORIGIN };

export function bodyFromQuery(q: URLSearchParams, fallbackSession: string): { body: EventBody; errors: string[]; warnings: string[] } {
  const r = parseExperience(q, RESEARCH_IDS, q.toString().length + 40);
  const body = bodyFrom(r.doc, fallbackSession, true);
  const errors = [...r.errors];
  if (!body.entries.length && !body.display?.length) errors.push("nothing to write: add blocks such as b=said:…, b=nuance:…, b=thread:…");
  return { body, errors, warnings: r.warnings };
}

export async function loadBrain(raw: string): Promise<{ code: string; data: ReadResult } | { code: string | null; data: null; reason: "bad_code" | "no_store" | "not_found" }> {
  const code = normaliseCode(raw);
  if (!code) return { code: null, data: null, reason: "bad_code" };
  const store = getStore();
  if (!store) return { code, data: null, reason: "no_store" };
  const data = await store.read(code, 1, 5000);
  return data ? { code, data } : { code, data: null, reason: "not_found" };
}

export const writeTemplate = (code: string) =>
  `${ORIGIN}/c/${code}/w?session=YOUR-SESSION-LABEL&by=YOUR-MODEL&b=said:WHAT+YOU+TWO+TALKED+ABOUT&b=nuance:ANYTHING+NEW+ABOUT+HOW+YOU+TALK&b=thread:WHAT+IS+STILL+OPEN`;

export { fold };
