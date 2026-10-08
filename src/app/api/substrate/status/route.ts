import { substrateStatus } from "@/lib/substrate/status";
import { json, limited } from "@/lib/api";

export const dynamic = "force-dynamic";

/** Is the Pearl Runtime Substrate connected to this deployment? Public, read-only; never reveals the base URL. */
export async function GET(req: Request) {
  const l = limited(req); if (l) return l;
  const s = await substrateStatus();
  return json(200, { ...s, note: "The consumer surface works without the substrate: a Pearl lives in its URL. The substrate adds shared storage, AI identity and server-side lineage when it is connected." }, false);
}
