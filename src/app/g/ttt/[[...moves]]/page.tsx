import type { Metadata } from "next";
import Link from "next/link";
import { playGame, GameError, describe, type Game } from "@/lib/games/ttt";
import { gameHandoff } from "@/lib/v6/handoff";
import { CopyPair, BringBack, Opened } from "@/components/v6/Actions";
import { SubstrateLayer } from "@/components/Substrate";
import { ORIGIN } from "@/config/origin";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ moves?: string[] }> };

const who = (w: string | null) => (w === null ? "someone" : w === "you" ? "you" : w);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try { const g = playGame((await params).moves ?? []); return { title: `A game · ${describe(g)}`, description: "Noughts and crosses whose URL is the whole game. Pass it to an AI; it moves and gives you back a new URL.", alternates: { canonical: g.address }, robots: { index: g.moves.length === 0, follow: true } }; }
  catch { return { title: "A game", robots: { index: false, follow: false } }; }
}

function Lineage({ g }: { g: Game }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="How this game got here: every step is a URL">
      <li><Link href="/g/ttt" className="chip !text-ink no-underline">start</Link></li>
      {g.moves.map((m, i) => (
        <li key={i} className="flex items-center gap-2">
          <span aria-hidden="true" className="text-ink-3">→</span>
          <Link href={m.address} className={`chip no-underline ${i === g.moves.length - 1 ? "!border-emerald !text-ink" : ""}`} title={m.who && m.who !== "you" ? `${m.who} is what this move says about itself; a name in a URL is not verified` : undefined}>
            <b className="font-semibold text-ink">{m.mark}</b> {who(m.who)}{m.who && m.who !== "you" ? <span className="text-ink-3">*</span> : null}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default async function TTT({ params }: Props) {
  const segs = (await params).moves ?? [];
  let g: Game;
  try { g = playGame(segs); } catch (e) {
    const err = e as GameError;
    return (
      <section className="wrap py-24">
        <SubstrateLayer data={{ page: "/g/ttt", error: { code: err.code, message: err.message }, last_valid: err.valid }} />
        <h1 className="font-serif text-[clamp(2rem,5vw,3.4rem)]">That move couldn&apos;t happen.</h1>
        <p className="mt-3 text-ink-2">{err.message}. Everything before it still stands.</p>
        <div className="mt-6 flex flex-wrap gap-3"><Link href={err.valid} className="btn-glow">Go back to the last good move</Link><Link href="/g/ttt" className="btn-glass">New game</Link></div>
      </section>
    );
  }
  const last = g.moves.at(-1);
  const aiNamed = g.moves.filter((m) => m.who && m.who !== "you").map((m) => m.who!);
  const myTurnHint = g.turn && (!last || last.who !== "you");
  const status = g.winner ? `${g.winner} won${last?.who ? `: ${who(last.who)} finished it` : ""}.` : g.draw ? "A draw. Nobody can win from here." : g.moves.length === 0 ? "X to play. Make the first move, or give it to an AI." : myTurnHint ? `${g.turn} to play. Your move, or pass it on.` : `${g.turn} to play. Give it to an AI and let it move.`;

  return (
    <>
      <SubstrateLayer data={{ page: "/g/ttt", game: { address: g.address, board: g.board.map((v) => v ?? "-").join(""), turn: g.turn, winner: g.winner, draw: g.draw, legal: g.legal.map((l) => l.address), moves: g.moves, hash: g.hash }, machine: g.address.replace("/g/ttt", "/api/v1/game/ttt"), capability: "game.ttt" }} />
      <Opened kind="opened" url={g.address} title={`A game · ${describe(g)}`} parent={g.moves.length > 1 ? g.moves[g.moves.length - 2].address : g.moves.length ? "/g/ttt" : null} who={last?.who ?? null} />
      <section className="wrap grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
        <div>
          <p className="zone-title">With AI · a game</p>
          <h1 className="mt-2 font-serif text-[clamp(2rem,5vw,3.2rem)] leading-tight">{status}</h1>
          <div className="glass mt-6 p-3 sm:p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="The board, cells 0 to 8 row by row">
              {g.board.map((v, c) => {
                const l = g.legal.find((x) => x.cell === c);
                const win = g.line?.includes(c);
                const label = v ? `cell ${c}: ${v}` : `cell ${c}: empty${l ? ", play here" : ""}`;
                return l ? (
                  <a key={c} href={`${l.address}~you`} className="cell-btn" aria-label={label}><span aria-hidden="true" className="text-ink-3/40 text-[1rem]">{c}</span></a>
                ) : (
                  <span key={c} role="img" aria-label={label} className={`cell-btn ${win ? "cell-win" : ""}`}>{v ?? ""}</span>
                );
              })}
            </div>
          </div>
          <p className="mt-3 break-all font-mono text-[0.78rem] text-ink-3"><span className="text-ink-2">{new URL(ORIGIN).host}</span>{g.address}</p>
        </div>

        <div className="space-y-8">
          <div className="glass p-5 sm:p-6">
            <p className="font-serif text-2xl">Give it to an AI.</p>
            <p className="mt-1 text-ink-2">Copy it, paste it into Claude, ChatGPT, Gemini or any AI. It reads the board from the link, makes a move, and gives you back a new link. Then give that one to a different AI.</p>
            <div className="mt-4 flex flex-wrap gap-2"><CopyPair url={ORIGIN + g.address} program={gameHandoff(g.address, g.turn)} title={`A game · ${describe(g)}`} /></div>
          </div>
          <div className="glass p-5 sm:p-6"><BringBack from={{ url: g.address, title: "a game" }} hint="Paste the AI's reply. We'll find its move and open the game where it left off." /></div>
          <div>
            <p className="zone-title mb-3">How it got here</p>
            <Lineage g={g} />
            {aiNamed.length > 0 && <p className="mt-3 text-[0.82rem] text-ink-3">* {[...new Set(aiNamed)].join(", ")}: what each move says about who made it. A name in a link is self-declared; nothing here can verify it.</p>}
          </div>
          <details className="text-[0.85rem] text-ink-3">
            <summary className="cursor-pointer hover:text-ink">Inspect</summary>
            <div className="mt-3 space-y-1 font-mono text-[0.75rem]">
              <p>The URL is the whole game: {g.moves.length} move{g.moves.length === 1 ? "" : "s"}, each a path segment. Nothing is stored.</p>
              <p>board {g.board.map((v) => v ?? "-").join("")} · turn {g.turn ?? "—"} · sha256 {g.hash.slice(0, 24)}…</p>
              <p><a href={g.address.replace("/g/ttt", "/api/v1/game/ttt")}>{g.address.replace("/g/ttt", "/api/v1/game/ttt")}</a> · the same game as JSON (capability game.ttt)</p>
            </div>
          </details>
          <p className="flex flex-wrap gap-3"><Link href="/g/ttt" className="btn-glass">New game</Link><Link href="/garden" className="btn-glass">Your Pearls</Link></p>
        </div>
      </section>
    </>
  );
}
