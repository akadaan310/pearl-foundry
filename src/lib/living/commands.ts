/**
 * The command table: every verb the interface can offer, the key that
 * triggers it, and the registered capability it uses. The palette, the
 * keyboard handler, /capabilities.json and the living records all read this
 * table; nothing defines a command anywhere else.
 *
 * A command appears on an object only if the object's living record lists it
 * as an affordance. Illegal commands are absent, never shown disabled.
 */

export type Produces = "address" | "pearl" | "view" | "copy" | "local";
export type Group = "change" | "understand" | "make" | "carry" | "go";

export interface CommandDef {
  id: string;
  label: string;          // the verb, as shown
  key: string;            // single-key shortcut ("" = palette only)
  group: Group;
  capability: string;     // a capability id from the registry, or "client:*" for the person's own action
  produces: Produces;
  does: string;           // one sentence, present tense
}

export const COMMANDS: CommandDef[] = [
  { id: "next", label: "NEXT", key: "n", group: "change", capability: "compute.eca#substrate.state.next", produces: "address", does: "Apply one registered transition f(x). The address gains /next." },
  { id: "perturb", label: "PERTURB", key: "x", group: "change", capability: "compute.eca#substrate.state.flip", produces: "address", does: "Flip one bit: a SIMULATED intervention on the model, x XOR 2^bit. The address gains /flip/{bit}." },
  { id: "trace", label: "TRACE", key: "t", group: "change", capability: "compute.eca#substrate.state.trace", produces: "address", does: "Run several transitions and keep the whole history. The address gains /trace/{steps}." },
  { id: "orbit", label: "ORBIT", key: "o", group: "change", capability: "compute.eca#substrate.state.orbit", produces: "address", does: "Iterate until a state repeats: the transient, then the cycle. The address gains /orbit." },
  { id: "normalize", label: "NORMALIZE", key: "m", group: "change", capability: "compute.eca#substrate.map.state", produces: "address", does: "The same state at its shortest address: /map/…/state/{x}. Same value, same hash." },
  { id: "back", label: "BACK", key: "b", group: "go", capability: "compute.eca (derivation prefix)", produces: "address", does: "Go to the address this one was derived from: drop the last operation." },
  { id: "open", label: "OPEN", key: "", group: "go", capability: "the target's own route", produces: "address", does: "Open a related object. It is a separate addressed thing." },
  { id: "verify", label: "VERIFY", key: "v", group: "understand", capability: "hash.sha256 + pearl.check + compute.eca", produces: "view", does: "Show what is computed, what is checked by hash, what is only asserted, and what cannot be established." },
  { id: "inspect", label: "INSPECT", key: "i", group: "understand", capability: "living.describe", produces: "view", does: "Show the substrate: address, program, state, transition, result." },
  { id: "explain", label: "EXPLAIN", key: "e", group: "understand", capability: "living.describe", produces: "view", does: "Explain this object from its own state, in words." },
  { id: "fork", label: "FORK", key: "f", group: "make", capability: "pearl.fork", produces: "pearl", does: "Make a new Pearl derived from this one, with from= naming its parent. The original never changes." },
  { id: "remix", label: "REMIX", key: "r", group: "make", capability: "pearl grammar (/e?…&from=)", produces: "pearl", does: "Change the composition and make a new Pearl. Original, remix and diff side by side." },
  { id: "compare", label: "COMPARE", key: "=", group: "understand", capability: "pearl.diff", produces: "view", does: "Compare this Pearl with another: metadata, blocks, computations, continuity, provenance." },
  { id: "carry", label: "CARRY", key: "c", group: "carry", capability: "client:clipboard", produces: "copy", does: "Copy a message that hands this object to another AI. Nothing is sent anywhere." },
  { id: "continue", label: "CONTINUE", key: "k", group: "carry", capability: "client:clipboard", produces: "copy", does: "Copy a prompt asking another AI to continue from this continuity Pearl and compose the updated one." },
  { id: "prompt", label: "PROMPT", key: "p", group: "carry", capability: "client:clipboard", produces: "copy", does: "Copy this Pearl's prompt. The site never runs it." },
  { id: "save", label: "SAVE", key: "s", group: "make", capability: "client:browser-local library", produces: "local", does: "Keep it in My Pearls, in this browser only." },
  { id: "copy-id", label: "COPY ID", key: "y", group: "carry", capability: "client:clipboard", produces: "copy", does: "Copy the content id: this exact object's identity." },
  { id: "copy-link", label: "COPY LINK", key: "l", group: "carry", capability: "client:clipboard", produces: "copy", does: "Copy the address itself." },
];

export const command = (id: string) => COMMANDS.find((c) => c.id === id)!;

/** Keys the interface reserves besides the commands. */
export const RESERVED_KEYS = { palette: "/", help: "?", layers: ["1", "2", "3"] } as const;
