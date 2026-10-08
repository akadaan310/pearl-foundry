import { playGame, GameError } from "@/lib/games/ttt";
import { json, limited } from "@/lib/api";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";

/** GET /api/v1/game/ttt/{move}/{move}… — the game as JSON. Pure: the URL is the whole game; nothing is stored. */
export async function GET(req: Request, ctx: { params: Promise<{ moves?: string[] }> }) {
  const l = limited(req); if (l) return l;
  const segs = (await ctx.params).moves ?? [];
  try {
    const g = playGame(segs);
    return json(200, {
      capability: "game.ttt", version: "1",
      game: "noughts and crosses (ttt/1)",
      url: ORIGIN + g.address,
      board: g.board.map((v) => v ?? "-").join(""),
      board_rows: [0, 3, 6].map((r) => g.board.slice(r, r + 3).map((v) => v ?? "-").join("")),
      cells: "0 1 2 / 3 4 5 / 6 7 8 (row-major)",
      turn: g.turn, winner: g.winner, draw: g.draw,
      legal_moves: g.legal.map((m) => ({ cell: m.cell, url: `${ORIGIN}${m.address}~{yourname}`, plain_url: ORIGIN + m.address })),
      moves: g.moves.map((m, i) => ({ n: i + 1, cell: m.cell, mark: m.mark, who: m.who, who_status: m.who ? "self-declared (a name in a URL proves nothing)" : "unnamed", url: ORIGIN + m.address })),
      how_to_move: g.turn ? `Append /{cell}~{yourname} to ${ORIGIN}${g.address}. Only the legal cells above are valid.` : "The game is over.",
      identity: { hash: g.hash, note: "sha256 of the canonical game value: the same moves give the same hash" },
    }, true);
  } catch (e) {
    if (e instanceof GameError) return json(422, { error: e.code, message: e.message, last_valid: ORIGIN + e.valid }, false);
    throw e;
  }
}
