/**
 * A tiny computational sound language (WebAudio, no files). Off until the
 * person turns it on; never required to understand anything. Each event is a
 * short interval figure, so the same event always sounds the same.
 */
export type Cue = "open" | "transition" | "fork" | "arrive" | "return" | "done" | "unsure" | "copy";
const FIG: Record<Cue, number[]> = { open: [0, 7], transition: [0, 4], fork: [0, 5, 12], arrive: [0, 4, 7, 12], return: [12, 7, 4, 0], done: [0, 12], unsure: [0, 1], copy: [7] };
const KEY = "pearls.sound";
let ctx: AudioContext | null = null;

export const soundOn = () => { try { return localStorage.getItem(KEY) === "on"; } catch { return false; } };
export function setSound(on: boolean) { try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* ignore */ } if (on) play("open"); }

export function play(c: Cue) {
  if (!soundOn()) return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const t0 = ctx.currentTime;
    FIG[c].forEach((semi, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = "sine"; o.frequency.value = 523.25 * 2 ** (semi / 12);
      const t = t0 + i * 0.07;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx!.destination); o.start(t); o.stop(t + 0.25);
    });
  } catch { /* audio unavailable: silence is fine */ }
}
