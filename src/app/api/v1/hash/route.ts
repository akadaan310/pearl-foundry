import { sha256 } from "@/lib/canonical";
import { base32 } from "@/lib/pearl/model";
import { TEXT_LIMIT } from "@/lib/capabilities";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const text = new URL(req.url).searchParams.get("text");
  if (text === null) return json(400, { error: "missing_text", message: "Pass ?text=…" });
  if (text.length > TEXT_LIMIT) return json(413, { error: "too_long", limit: TEXT_LIMIT });
  const hex = sha256(text);
  return json(200, { capability: "hash.sha256", version: "1", sha256: hex, short: base32(hex), bytes: new TextEncoder().encode(text).length, provenance: { engine: "javascript", deterministic: true } });
}
