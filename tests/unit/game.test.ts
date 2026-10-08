import { test } from "node:test";
import assert from "node:assert/strict";
import { playGame, gameSegments, continues, GameError, cleanName } from "../../src/lib/games/ttt";

test("the address is the game: board, turn, legal moves and lineage come from the URL alone", () => {
  const g = playGame(["4~you", "0~claude", "8~gpt"]);
  assert.equal(g.address, "/g/ttt/4~you/0~claude/8~gpt");
  assert.deepEqual(g.board.map((v) => v ?? "-").join(""), "O---X---X");
  assert.equal(g.turn, "O");
  assert.deepEqual(g.moves.map((m) => `${m.mark}${m.cell}:${m.who}`), ["X4:you", "O0:claude", "X8:gpt"]);
  assert.equal(g.legal.length, 6);
  for (const l of g.legal) assert.doesNotThrow(() => playGame(gameSegments(l.address)!), "every legal move is itself a valid game address");
  assert.equal(playGame(["4~you", "0~claude", "8~gpt"]).hash, g.hash, "deterministic");
  assert.notEqual(playGame(["4~you", "0~gemini", "8~gpt"]).hash, g.hash, "who said they moved is part of the record");
});

test("wins, draws, and illegal moves are named; nothing after a win", () => {
  const w = playGame(["0", "3", "1", "4", "2"]);
  assert.equal(w.winner, "X"); assert.deepEqual(w.line, [0, 1, 2]); assert.equal(w.legal.length, 0); assert.equal(w.turn, null);
  const d = playGame(["0", "1", "2", "4", "3", "5", "7", "6", "8"]);
  assert.equal(d.draw, true);
  assert.throws(() => playGame(["4", "4"]), (e: GameError) => e.code === "occupied" && e.valid === "/g/ttt/4");
  assert.throws(() => playGame(["0", "3", "1", "4", "2", "5"]), (e: GameError) => e.code === "over");
  assert.throws(() => playGame(["9"]), (e: GameError) => e.code === "malformed");
  assert.throws(() => playGame(["4~<script>"]), (e: GameError) => e.code === "malformed");
});

test("a returned link is recognised from any form, and a continuation is detected", () => {
  assert.deepEqual(gameSegments("Here you go: https://aanebed.vercel.app/g/ttt/4~you/0~claude".split(": ")[1]), ["4~you", "0~claude"]);
  assert.deepEqual(gameSegments("/api/v1/game/ttt/4/0"), ["4", "0"]);
  assert.equal(gameSegments("https://example.org/g/ttt/4"), null, "a game link on another host is not this game");
  const a = playGame(["4~you"]), b = playGame(["4~you", "0~claude"]), c = playGame(["2~you"]);
  assert.equal(continues(a, b), true); assert.equal(continues(a, c), false);
  assert.equal(cleanName("Claude Opus!"), "claude-opus");
});
