import type { Json } from "../canonical";
import { command, type CommandDef } from "./commands";

/**
 * The living record: one value, built by a pure function from an address or
 * a Pearl, rendered by the human page and served as JSON. Two layers, one page.
 */
export const LIVING_FORMAT = "living/1" as const;

export interface Option { label: string; href: string; detail?: string }
export interface Affordance {
  command: string;
  label: string;
  key: string;
  group: CommandDef["group"];
  capability: string;
  produces: CommandDef["produces"];
  does: string;
  /** for address-producing commands: the next address (an /x-style path, without a prefix) */
  href?: string;
  /** parameterised commands (PERTURB bit 0…n-1, TRACE 8/16/32, OPEN related…) */
  options?: Option[];
  note?: string;
}

/** How something is known. Never collapsed into one "verified" badge. */
export type Knowing = "computed" | "checked" | "asserted" | "recorded" | "external" | "cannot be established";
export interface EvidenceRow { what: string; knowing: Knowing; detail: string; status?: string; ref?: string }
export interface Edge { from: string; op: string; to: string; label?: string }
export interface Related { kind: "pearl" | "address" | "research" | "choice" | "parent" | "link"; label: string; href: string; detail?: string }

export interface LivingRecord {
  format: typeof LIVING_FORMAT;
  identity: { kind: "pearl" | "address"; id: string; hash: string; address: string; means: string };
  type: string;
  title: string;
  state: Record<string, Json>;
  affordances: Affordance[];
  history: Edge[];
  parent: string | null;
  related: Related[];
  evidence: EvidenceRow[];
  explanation: string[];
  limits: Record<string, Json>;
}

export function afford(id: string, extra: Partial<Affordance> = {}): Affordance {
  const c = command(id);
  return { command: c.id, label: c.label, key: c.key, group: c.group, capability: c.capability, produces: c.produces, does: c.does, ...extra };
}
