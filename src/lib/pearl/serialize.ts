/**
 * Pearl → URL. The inverse of the experience/1 parser for every block type.
 *
 * Canonicalisation (documented in docs/architecture/PEARL_PROTOCOL.md):
 *  - parameters in the order type, title, by, session, for, from, then b1, b2, … (numbered, 1-based)
 *  - values percent-encoded with encodeURIComponent, then made readable:
 *    spaces as "+", and : | > = , / ; @ ! ' ( ) * ~ left literal
 *  - "&", "#", "+", "%" and non-ASCII characters stay percent-encoded
 * Round trip: parse(serialize(pearl)) yields the same blocks in the same order.
 */

import { ORIGIN } from "../../config/origin";
import type { Block } from "../experience";
import type { Pearl } from "./model";

export function encodeValue(v: string): string {
  return encodeURIComponent(v)
    .replace(/%20/g, "+")
    .replace(/%(3A|7C|3E|3D|2C|2F|3B|40)/g, (m) => decodeURIComponent(m))
    .replace(/%21/g, "!").replace(/%27/g, "'").replace(/%28/g, "(").replace(/%29/g, ")").replace(/%2A/g, "*").replace(/%7E/g, "~");
}

export function blockToLine(b: Block): string {
  switch (b.type) {
    case "h": case "p": case "note": case "code": case "prompt": return `${b.type}:${b.text}`;
    case "quote": return b.cite ? `quote:${b.text}|${b.cite}` : `quote:${b.text}`;
    case "list": case "steps": return `${b.type}:${b.items.join("|")}`;
    case "flow": return `flow:${b.items.join(">")}`;
    case "facts": return `facts:${b.items.map((f) => (f.v ? `${f.k}=${f.v}` : f.k)).join("|")}`;
    case "table": return `table:${b.rows.map((r) => r.join(";")).join("|")}`;
    case "x": return `x:${b.address}`;
    case "research": return `research:${b.id}`;
    case "link": return b.label && b.label !== b.host ? `link:${b.href}|${b.label}` : `link:${b.href}`;
    case "claim": return `claim:${b.status}|${b.text}`;
    case "pearl": return `pearl:${b.href}|${b.label}`;
    case "choice": return `choice:${b.prompt}|${b.options.map((o) => `${o.label}>${o.href}`).join("|")}`;
    case "c":
      if (b.kind === "nick" || b.kind === "lex") return b.text ? `${b.kind}:${b.key}=${b.text}` : `${b.kind}:${b.key}`;
      return `${b.kind}:${b.text}`;
  }
}

export function pearlQuery(p: Pearl, style: "numbered" | "repeated" = "numbered"): string {
  const parts: string[] = [`type=${p.type}`];
  if (p.title) parts.push(`title=${encodeValue(p.title)}`);
  if (p.by) parts.push(`by=${encodeValue(p.by)}`);
  if (p.session) parts.push(`session=${encodeValue(p.session)}`);
  if (p.for) parts.push(`for=${encodeValue(p.for)}`);
  if (p.from) parts.push(`from=${p.from}`);
  p.blocks.forEach((b, i) => parts.push(`${style === "numbered" ? `b${i + 1}` : "b"}=${encodeValue(blockToLine(b))}`));
  return parts.join("&");
}

export const pearlUrl = (p: Pearl, origin: string = ORIGIN) => `${origin}/e?${pearlQuery(p)}`;
