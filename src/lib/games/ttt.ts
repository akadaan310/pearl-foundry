/**
 * Noughts and crosses whose address is its whole history.
 *
 *   /g/ttt                         an empty board, X to play
 *   /g/ttt/4~you/0~claude/8~gpt    X at 4 (by "you"), O at 0 (by "claude"), X at 8 (by "gpt")
 *
 * Each segment is one move: a cell 0–8 (row-major), optionally "~name" for who
 * says they made it. Names are SELF-DECLARED: a label in a URL proves nothing
 * about who wrote it. Everything (board, turn, result, legal next moves,
 * lineage) is derived from the address alone. Pure; nothing is stored.
 */
import { hashJson, type Json } from "../canonical";
import { TRUSTED_ORIGINS } from "../../config/origin";

const TRUSTED = new Set(TRUSTED_ORIGINS.map((o) => new URL(o).host));

export type Mark = "X" | "O";
export interface Move { cell: number; mark: Mark; who: string | null; address: string }
export interface Game {
  address: string;            // canonical path, e.g. /g/ttt/4~you/0~claude
  moves: Move[];
  board: (Mark | null)[];
  turn: Mark | null;          // null when the game is over
  winner: Mark | null;
  line: number[] | null;
  draw: boolean;
  legal: { cell: number; address: string }[];
  hash: string;               // sha256 of the canonical game value
}
export class GameError extends Error { constructor(public code: "malformed" | "occupied" | "over" | "too_long", message: string, public at: number, public valid: string) { super(message); } }

export const BASE = "/g/ttt";
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const SEG = /^([0-8])(?:~([a-z0-9][a-z0-9-]{0,23}))?$/;

export function cleanName(s: string): string | null {
  const v = s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24);
  return v || null;
}

export function playGame(segments: string[]): Game {
  if (segments.length > 9) throw new GameError("too_long", "a game has at most 9 moves", 9, BASE);
  const board: (Mark | null)[] = Array(9).fill(null);
  const moves: Move[] = [];
  let path = BASE, winner: Mark | null = null, line: number[] | null = null;
  segments.forEach((raw, i) => {
    const m = SEG.exec(decodeURIComponent(raw).toLowerCase());
    if (!m) throw new GameError("malformed", `move ${i + 1} (“${raw.slice(0, 20)}”) is not a cell 0–8 with an optional ~name`, i, path);
    if (winner) throw new GameError("over", `the game was already won by ${winner} before move ${i + 1}`, i, path);
    const cell = Number(m[1]);
    if (board[cell]) throw new GameError("occupied", `cell ${cell} is already taken`, i, path);
    const mark: Mark = i % 2 === 0 ? "X" : "O";
    board[cell] = mark;
    path += `/${cell}${m[2] ? `~${m[2]}` : ""}`;
    moves.push({ cell, mark, who: m[2] ?? null, address: path });
    const l = LINES.find((ln) => ln.every((c) => board[c] === mark));
    if (l) { winner = mark; line = l; }
  });
  const full = board.every(Boolean);
  const over = !!winner || full;
  const turn: Mark | null = over ? null : moves.length % 2 === 0 ? "X" : "O";
  const legal = over ? [] : board.map((v, c) => (v ? null : { cell: c, address: `${path}/${c}` })).filter((x): x is { cell: number; address: string } => !!x);
  const value = { game: "ttt/1", board: board.map((v) => v ?? "-").join(""), moves: moves.map((m) => ({ cell: m.cell, mark: m.mark, who: m.who })) };
  return { address: path, moves, board, turn, winner, line, draw: full && !winner, legal, hash: hashJson(value as unknown as Json) };
}

/** Segments from any form of a game link: absolute, /g/ttt/…, or the JSON route. */
export function gameSegments(u: string): string[] | null {
  let p = u.trim();
  try { if (/^https?:/.test(p)) { const u = new URL(p); if (!TRUSTED.has(u.host)) return null; p = u.pathname; } } catch { return null; }
  p = p.replace(/^\/api\/v1\/game\/ttt/, BASE).replace(/[?#].*$/, "");
  if (p !== BASE && !p.startsWith(BASE + "/")) return null;
  return p.slice(BASE.length).split("/").filter(Boolean);
}

/** Is b a continuation of a (same moves so far, then more)? Used to recognise a game an AI brought back. */
export function continues(a: Game, b: Game): boolean {
  return b.moves.length >= a.moves.length && a.moves.every((m, i) => b.moves[i].cell === m.cell);
}

export const describe = (g: Game) => g.winner ? `${g.winner} won` : g.draw ? "a draw" : `${g.turn} to play`;
