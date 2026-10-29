// Floor 1 (the warehouse) tile set: variations of the floor plate and the decoration that makes
// every room look lived-in (badly). Used by the room painter (src/art/room.ts); everything is
// drawn with the room's seeded RNG so a room always looks the same.
//
// Rule of thumb: floor decoration stays low-contrast (dark or faded, alpha well under the
// bullets') so it never competes with what the player has to read.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { GLYPHS, fontText } from './font.ts';
import { K, WHITE } from './lib.ts';

export const T = 24;

export type RoomStyle = 'start' | 'combat' | 'treasure' | 'shop' | 'secret' | 'boss' | 'test';

export const shade = (c: RGBA, d: number): RGBA => [
  Math.max(0, Math.min(255, c[0] + d)),
  Math.max(0, Math.min(255, c[1] + d)),
  Math.max(0, Math.min(255, c[2] + Math.round(d * 1.15))),
  c[3],
];

const alpha = (c: RGBA, a: number): RGBA => [c[0], c[1], c[2], a];

/** Plain text in «Letra Pequeña» (no outline), body rows only: 5 px tall. Returns its width. */
export function stencil(S: Canvas, x: number, y: number, text: string, c: RGBA, skip?: (i: number) => boolean): number {
  let cx = x;
  let n = 0;
  for (const ch of fontText(text)) {
    if (ch === ' ') {
      cx += 3;
      continue;
    }
    const g = GLYPHS.get(ch);
    if (!g) continue;
    g.rows.forEach((row, ry) => {
      [...row].forEach((p, rx) => {
        // Accent rows sit above the body (rows 0-1): keep them, 2 px higher.
        if (p === '#' && !(skip && skip(n++))) S.set(cx + rx, y + ry - 2, c);
      });
    });
    cx += g.w + 1;
  }
  return cx - x - 1;
}

export function stencilWidth(text: string): number {
  let w = 0;
  for (const ch of fontText(text)) w += ch === ' ' ? 3 : (GLYPHS.get(ch)?.w ?? 3) + 1;
  return Math.max(0, w - 1);
}

// ---------------------------------------------------------------------------------------------
// Floor plate variations (one 24 × 24 tile each). The plain plate is drawn by the painter.

export type TileVariant = 'plain' | 'cracked' | 'worn' | 'patched' | 'grate' | 'checker';

/** Picks the variation of a floor tile. Grates are rare and never two side by side. */
export function pickVariant(rng: Rng, style: RoomStyle): TileVariant {
  const v = rng.next();
  const old = style === 'secret' ? 2 : 1;
  if (v < 0.06 * old) return 'cracked';
  if (v < 0.11 * old) return 'worn';
  if (v < 0.13) return 'patched';
  if (v < 0.137) return 'grate';
  return 'plain';
}

export function paintVariant(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: TileVariant): void {
  const GR = hx('#262b40');
  switch (v) {
    case 'cracked': {
      // A crack that starts at an edge and wanders across, with a lighter chipped lip.
      let cx = x + rng.int(4, T - 5);
      let cy = y + 1;
      const len = rng.int(9, 18);
      for (let i = 0; i < len; i++) {
        S.set(cx, cy, GR);
        S.set(cx + 1, cy, shade(base, 8));
        cy++;
        if (rng.chance(0.45)) cx += rng.chance(0.5) ? 1 : -1;
        if (rng.chance(0.18) && i > 3) {
          // A short branch.
          const d = rng.chance(0.5) ? 1 : -1;
          for (let k = 1; k < 4; k++) S.set(cx + d * k, cy + k - 1, GR);
        }
        cx = Math.max(x + 2, Math.min(x + T - 3, cx));
      }
      break;
    }
    case 'worn': {
      // Scuffed in the middle (where everybody walks) and one rivet gone.
      for (let j = 4; j < T - 4; j++) {
        for (let i = 4; i < T - 4; i++) {
          if (rng.chance(0.35)) S.set(x + i, y + j, shade(S.get(x + i, y + j), 6));
        }
      }
      const [ox, oy] = rng.pick([[2, 2], [T - 3, 2], [2, T - 3], [T - 3, T - 3]] as const);
      S.set(x + ox, y + oy, base);
      S.set(x + ox + 1, y + oy + 1, hx('#2c3149'));
      break;
    }
    case 'patched': {
      // A newer plate screwed on top: slightly bluer, shinier rivets, a dark seam all round.
      const P = shade(base, 4);
      S.rect(x + 3, y + 3, T - 6, T - 6, P);
      S.rect(x + 3, y + 3, T - 6, 1, shade(P, 8));
      S.rect(x + 3, y + T - 4, T - 6, 1, shade(base, -8));
      S.rect(x + T - 4, y + 3, 1, T - 6, shade(base, -8));
      for (const [ox, oy] of [[5, 5], [T - 7, 5], [5, T - 7], [T - 7, T - 7]] as const) {
        S.set(x + ox, y + oy, hx('#9aa2c0'));
        S.set(x + ox + 1, y + oy + 1, GR);
      }
      break;
    }
    case 'grate': {
      // A drain grate: dark pit with bars, a glint on the frame.
      S.rect(x + 3, y + 5, T - 6, T - 10, hx('#14162a'));
      for (let i = x + 4; i < x + T - 4; i += 3) S.rect(i, y + 6, 2, T - 12, hx('#3a4058'));
      S.rect(x + 3, y + 5, T - 6, 1, hx('#58608a'));
      S.rect(x + 3, y + T - 6, T - 6, 1, hx('#20243a'));
      break;
    }
    case 'checker': {
      // Diamond (checker) plate: little raised diagonal lozenges.
      for (let j = 3; j < T - 2; j += 4) {
        for (let i = 3 + ((j >> 2) % 2) * 2; i < T - 3; i += 4) {
          S.set(x + i, y + j, shade(base, 16));
          S.set(x + i + 1, y + j + 1, shade(base, -10));
        }
      }
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

/** A torn receipt (3-4 px long) lying on the floor. */
export function receipt(S: Canvas, rng: Rng, x: number, y: number): void {
  const paper = alpha(hx('#c9c3b0'), 150);
  const w = rng.int(3, 5);
  S.rect(x, y, w, 2, paper);
  S.set(x + 1, y, alpha(hx('#6e6a60'), 150));
  if (rng.chance(0.5)) S.set(x + w, y + 1, paper);
}

/** A loose screw or nut. */
export function screw(S: Canvas, x: number, y: number): void {
  S.set(x, y, hx('#9aa2c0'));
  S.set(x + 1, y, hx('#5a627c'));
  S.set(x, y + 1, hx('#20243a'));
}

/** A coiled bit of cable. */
export function cable(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = alpha(hx('#14121e'), 200);
  let cx = x;
  let cy = y;
  const n = rng.int(10, 18);
  for (let i = 0; i < n; i++) {
    S.set(cx, cy, c);
    const a = (i / n) * Math.PI * 2.2;
    cx = x + Math.round(Math.cos(a) * 4 + i * 0.4);
    cy = y + Math.round(Math.sin(a) * 2);
  }
  S.set(cx + 1, cy, hx('#b8683a'));
}

/** Two faint parallel tyre tracks from a forklift, `len` px long, horizontal or vertical. */
export function tyreTracks(S: Canvas, x: number, y: number, len: number, vertical: boolean): void {
  const c: RGBA = [12, 10, 22, 34];
  for (let i = 0; i < len; i++) {
    if (i % 6 === 5) continue;
    if (vertical) {
      S.rect(x, y + i, 2, 1, c);
      S.rect(x + 10, y + i, 2, 1, c);
    } else {
      S.rect(x + i, y, 1, 2, c);
      S.rect(x + i, y + 10, 1, 2, c);
    }
  }
}

/** A painted loading bay: dashed outline and diagonal hatching, faded. */
export function loadingBay(S: Canvas, x: number, y: number, w: number, h: number, label: string): void {
  const line: RGBA = [176, 138, 28, 120];
  const hatch: RGBA = [176, 138, 28, 38];
  for (let i = 0; i < w; i++) {
    if (Math.floor(i / 4) % 2 === 0) {
      S.set(x + i, y, line);
      S.set(x + i, y + h - 1, line);
    }
  }
  for (let j = 0; j < h; j++) {
    if (Math.floor(j / 4) % 2 === 0) {
      S.set(x, y + j, line);
      S.set(x + w - 1, y + j, line);
    }
  }
  for (let j = 2; j < h - 2; j++) for (let i = 2; i < w - 2; i++) if ((i + j) % 8 < 2) S.set(x + i, y + j, hatch);
  const tw = stencilWidth(label);
  if (tw < w - 6) {
    S.rect(x + Math.floor((w - tw) / 2) - 2, y + Math.floor(h / 2) - 4, tw + 4, 9, [33, 37, 58, 200]);
    // Worn paint: some pixels missing.
    stencil(S, x + Math.floor((w - tw) / 2), y + Math.floor(h / 2) - 2, label, [176, 138, 28, 150], (i) => i % 7 === 3);
  }
}

/** Faded painted words on the floor, with some pixels worn away. */
export function floorStencil(S: Canvas, x: number, y: number, text: string, c: RGBA = [176, 138, 28, 105]): void {
  stencil(S, x, y, text, c, (i) => i % 5 === 2);
}

/** A painted arrow (three chevrons) pointing at a door; (x, y) is the tip. */
export function chevrons(S: Canvas, x: number, y: number, dir: string): void {
  const c: RGBA = [176, 138, 28, 95];
  // Draw pointing up in (u, v) space (u across, v away from the tip), then map to the direction.
  const put = (u: number, v: number): void => {
    if (dir === 'N') S.set(x + u, y + v, c);
    else if (dir === 'S') S.set(x + u, y - v, c);
    else if (dir === 'W') S.set(x + v, y + u, c);
    else S.set(x - v, y + u, c);
  };
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < 4; i++) {
      for (let t = 0; t < 2; t++) {
        put(-i, k * 5 + i + t);
        put(i, k * 5 + i + t);
      }
    }
  }
}

/** A doormat (shop entrance style) with a word on it. */
export function doormat(S: Canvas, x: number, y: number, w: number, word: string): void {
  const M = hx('#5a3a2c');
  S.rect(x, y, w, 13, M);
  S.rect(x, y, w, 1, shade(M, 18));
  S.rect(x, y + 12, w, 1, hx('#2e1e18'));
  for (let i = x + 1; i < x + w - 1; i += 2) S.set(i, y + 2, shade(M, -14));
  for (let i = x + 1; i < x + w - 1; i += 2) S.set(i, y + 10, shade(M, -14));
  const tw = stencilWidth(word);
  stencil(S, x + Math.floor((w - tw) / 2), y + 4, word, hx('#c9a26a'));
}

/** A long carpet runner (shop): red with a gold border. */
export function carpet(S: Canvas, x: number, y: number, w: number, h: number): void {
  const C = hx('#7a2a34');
  S.rect(x, y, w, h, C);
  S.rect(x + 2, y + 2, w - 4, 1, hx('#b08a3c'));
  S.rect(x + 2, y + h - 3, w - 4, 1, hx('#b08a3c'));
  S.rect(x + 2, y + 2, 1, h - 4, hx('#b08a3c'));
  S.rect(x + w - 3, y + 2, 1, h - 4, hx('#b08a3c'));
  for (let j = y + 5; j < y + h - 5; j += 6) for (let i = x + 6; i < x + w - 6; i += 6) S.set(i, j, shade(C, 22));
  S.rect(x, y + h, w, 2, [12, 10, 22, 80]);
}

/** Frost creeping over the floor (the boss's cold air leaks under the door). */
export function frost(S: Canvas, rng: Rng, cx: number, cy: number, r: number): void {
  for (let k = 0; k < r * r * 1.2; k++) {
    const a = rng.next() * Math.PI * 2;
    const d = Math.sqrt(rng.next()) * r;
    const x = Math.round(cx + Math.cos(a) * d);
    const y = Math.round(cy + Math.sin(a) * d * 0.6);
    S.set(x, y, [182, 241, 240, Math.round(70 * (1 - d / r)) + 20]);
  }
}

/** A cobweb in a corner; `sx`/`sy` give which way it opens (+1 or -1). */
export function cobweb(S: Canvas, x: number, y: number, sx: number, sy: number): void {
  const c: RGBA = [214, 214, 222, 90];
  for (let i = 0; i < 9; i++) {
    S.set(x + sx * i, y + sy * i, c);
    S.set(x + sx * i, y, c);
    S.set(x, y + sy * i, c);
    if (i % 3 === 2) for (let k = 0; k <= i; k++) S.set(x + sx * k, y + sy * (i - k), c);
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the back wall (over the shelves), the side walls and the front wall.

/** «Su turno»: a ticket-queue display, always a number nobody has. */
export function turnDisplay(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 24, 13, K);
  S.rect(x, y, 22, 11, hx('#1b1d2e'));
  S.rect(x, y, 22, 1, hx('#3a4058'));
  stencil(S, x + 3, y + 4, String(rng.int(0, 999)).padStart(3, '0'), hx('#e0453b'));
  S.set(x + 18, y + 3, hx('#e0453b'));
}

/** A wall clock stopped at twelve. */
export function clock(S: Canvas, cx: number, cy: number): void {
  for (let y = -5; y <= 5; y++) {
    for (let x = -5; x <= 5; x++) {
      const d = x * x + y * y;
      if (d <= 25) S.set(cx + x, cy + y, d > 16 ? K : d > 9 && x + y < 0 ? WHITE : hx('#e2e7f0'));
    }
  }
  S.rect(cx, cy - 3, 1, 4, K);
  S.set(cx + 1, cy - 3, K);
  S.set(cx, cy, hx('#e0453b'));
}

/** A sign plate with a word, bolted to the shelving. */
export function signPlate(S: Canvas, cx: number, y: number, text: string, bg: RGBA, fg: RGBA): void {
  const tw = stencilWidth(text);
  const w = tw + 8;
  const x = cx - Math.floor(w / 2);
  S.rect(x - 1, y - 1, w + 2, 11, K);
  S.rect(x, y, w, 9, bg);
  S.rect(x, y, w, 1, shade(bg, 30));
  S.rect(x, y + 8, w, 1, shade(bg, -35));
  S.set(x + 1, y + 4, shade(bg, -50));
  S.set(x + w - 2, y + 4, shade(bg, -50));
  stencil(S, x + 4, y + 3, text, fg);
}

/** A string of price tags hanging along the shelf (shop). */
export function priceTags(S: Canvas, rng: Rng, x0: number, x1: number, y: number): void {
  for (let x = x0; x < x1; x++) S.set(x, y + Math.round(Math.sin((x - x0) / 9) * 1.5), hx('#2b3048'));
  for (let x = x0 + 6; x < x1 - 4; x += rng.int(10, 15)) {
    const ty = y + Math.round(Math.sin((x - x0) / 9) * 1.5) + 1;
    const c = rng.pick([hx('#f6c431'), hx('#e0453b'), hx('#f4f1e8')]);
    S.rect(x, ty, 4, 5, c);
    S.rect(x + 3, ty, 1, 5, shade(c, -40));
    S.set(x + 1, ty + 1, K);
  }
}

/** A red fire extinguisher hung on a side wall (top view of the wall, three-quarter body). */
export function extinguisher(S: Canvas, x: number, y: number): void {
  S.rect(x, y + 2, 5, 9, hx('#a42f37'));
  S.rect(x + 1, y + 2, 3, 9, hx('#e0453b'));
  S.rect(x + 1, y + 3, 1, 6, hx('#ff8a70'));
  S.rect(x + 1, y, 3, 2, K);
  S.rect(x + 1, y + 6, 3, 2, WHITE);
  S.rect(x - 1, y + 1, 1, 10, K);
  S.rect(x + 5, y + 1, 1, 10, K);
  S.rect(x, y + 11, 5, 1, K);
}

/** An electrical box on a wall: grey with a yellow warning triangle. */
export function junctionBox(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 10, 10, K);
  S.rect(x, y, 8, 8, hx('#5a627c'));
  S.rect(x, y, 8, 1, hx('#858ea8'));
  S.set(x + 4, y + 2, hx('#f6c431'));
  S.rect(x + 3, y + 3, 3, 1, hx('#f6c431'));
  S.rect(x + 2, y + 4, 5, 1, hx('#f6c431'));
  S.set(x + 4, y + 3, K);
}
