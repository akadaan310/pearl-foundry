/**
 * "Copy for AI": a small, provider-neutral program that hands an object to any
 * AI. It names the object's URL, where its machine-readable form is, the legal
 * ways to continue, and what to bring back. Generated from the object itself.
 */
import { ORIGIN } from "../../config/origin";

export interface Handoff { url: string; what: string; read: string; moves: string; ret: string }

const FOOTER = "Keep everything the URL already says (it is the history). Do not claim you opened, ran or verified something you could not. If you cannot open links, ask me to paste what the page shows.";

export function program(h: Handoff): string {
  return `PEARL\n\nOpen: ${h.url}\n\n${h.what}\n\nRead: ${h.read}\nMove: ${h.moves}\nReturn: ${h.ret}\n\n${FOOTER}`;
}

export const gameHandoff = (path: string, turn: string | null) => program({
  url: ORIGIN + path,
  what: turn ? `This is a game of noughts and crosses. The URL is the whole game: every move so far is in it. It is ${turn}'s turn, and you are playing ${turn}.` : "This is a finished game of noughts and crosses. The URL is the whole game.",
  read: `${ORIGIN}${path.replace("/g/ttt", "/api/v1/game/ttt")} (JSON: board, whose turn, legal_moves, each with its URL).`,
  moves: turn ? "pick one legal move. Add your own short name to it: append ~yourname to that move's segment (for example /4~claude). The name is what you say you are; nobody can verify it from a URL." : "none. Tell me who won and how.",
  ret: turn ? "the new URL on its own line, then one sentence on why you chose that move." : "one sentence.",
});

export const addressHandoff = (path: string, title: string) => program({
  url: `${ORIGIN}/live${path}`,
  what: `This is a tiny world: ${title}. Its URL is a computational address, and the site computes it.`,
  read: `${ORIGIN}/api/v1/living?u=/x${path} (state, the legal next moves and their URLs, an explanation).`,
  moves: `choose one legal move (continue: /next, change one cell: /flip/{bit}, see history: /trace/{steps}, watch it settle: /orbit). Nothing else exists; the registry is ${ORIGIN}/x.`,
  ret: "the new URL on its own line, and one sentence saying what changed.",
});

export const pearlHandoff = (link: string, id: string, title: string) => program({
  url: link,
  what: `This is a Pearl called “${title}”. Its whole content is in the link; ${id} is its content id.`,
  read: `${ORIGIN}/api/v1/living?u=${encodeURIComponent(link.replace(ORIGIN, ""))} (what it is, its parts, what can be done with it). The grammar is ${ORIGIN}/compose.`,
  moves: `add your contribution by composing a NEW Pearl link to ${ORIGIN}/e with from=${id} and by=your name, keeping what matters and adding blocks. Never edit the original.`,
  ret: "the new Pearl URL on its own line, and one sentence saying what you changed.",
});

export const makeHandoff = (wish: string) => program({
  url: `${ORIGIN}/compose`,
  what: `Make me this, as a Pearl: “${wish.trim().slice(0, 300)}”. A Pearl is a link to ${ORIGIN}/e whose parameters carry the whole thing.`,
  read: `${ORIGIN}/llms.txt and ${ORIGIN}/compose (the grammar). Computations you can include are listed at ${ORIGIN}/x; a game you can start is ${ORIGIN}/g/ttt.`,
  moves: "compose one link: type=experience, title=, by=your name, then numbered blocks b1=, b2=… (h:, p:, list:, steps:, x:, choice:, prompt:). Encode & as %26 and # as %23. 4 to 12 blocks.",
  ret: "the link on its own line, and one sentence saying what it does. I will open it and bring it back here.",
});
