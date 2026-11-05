// Floor 5 (Atención al Cliente) tile set: the customer service floor, the last of the normal
// ones, where every call in the building ends up and nothing gets solved. Institutional blue
// linoleum laid in sheets (marbled, welded seams, polisher swirls, heel marks), a yellow line
// painted on the floor («Siga la línea») that leads nowhere, service counters with a perspex
// screen full of holes as interior walls, a two-tone wall with a row of bolted waiting chairs, the
// slogan «Su satisfacción es nuestra prioridad» with a one-star rating, clocks that each tell a
// different time, a queue screen that always shows the same number and a ceiling of acoustic
// tiles with cold panels. Dominant colour: a petrol blue, greener and paler than the warehouse's
// indigo. Used by the room painter (src/art/room.ts) for rooms of level 5 and up; drawn with the
// room's seeded RNG.
//
// Same rule as the floors below: floor decoration stays low-contrast and about as dark as theirs,
// so it never competes with the bullets (red and cyan with a white core, the player's orange).
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import { T, shade, stencil, stencilWidth } from './warehouse.ts';
import type { RoomStyle } from './warehouse.ts';

export const C = {
  /** The linoleum: two dye lots that alternate sheet by sheet (nobody ordered enough of one). */
  linoA: hx('#2d4a5e'),
  linoB: hx('#2a465a'),
  /** The patch cut in after a leak: same brand, the wrong blue. */
  linoPatch: hx('#30506a'),
  /** The weld rod between two sheets. */
  weld: hx('#22384a'),
  wall: hx('#1b2531'),
  seam: hx('#131a24'),
  paint: [226, 200, 92, 96] as RGBA,
  dash: hx('#5a7a8a'),
  frame: hx('#7d94a4'),
  frameDark: hx('#4a5e6c'),
  /** The panels: cold, a little blue, the light of a waiting room at nine in the morning. */
  light: [214, 232, 255] as const,
  /** The upper wall (paint called «Azul Servicio») and the darker dado. */
  wallHi: hx('#34485a'),
  dado: hx('#23344a'),
  /** The yellow line on the floor. */
  line: [214, 176, 48, 118] as RGBA,
  counter: hx('#5e7486'),
  counterHi: hx('#7890a2'),
  counterFront: hx('#2f4458'),
  perspex: [206, 232, 240, 96] as RGBA,
};

export type LinoVariant = 'plain' | 'scuff' | 'burn' | 'bubble' | 'mended' | 'feet';

/** Picks the variation of a linoleum tile. Burns in the forgotten rooms (from before the ban). */
export function pickLinoVariant(rng: Rng, style: RoomStyle): LinoVariant {
  const v = rng.next();
  const old = style === 'secret' ? 3 : 1;
  if (v < 0.012 * old) return 'burn';
  if (v < 0.035) return 'mended';
  if (v < 0.06) return 'bubble';
  if (v < 0.08) return 'feet';
  if (v < 0.15) return 'scuff';
  return 'plain';
}

/**
 * A tile's worth of linoleum: flat colour, marbled streaks running along the sheet (vertical), and
 * the welded seam on the left edge where a sheet starts (every other column).
 */
export function linoTile(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, seam: boolean): void {
  S.rect(x, y, T, T, base);
  // Marbling: short streaks along the roll, lighter and darker.
  for (let k = 0; k < 9; k++) {
    const sx = x + rng.int(0, T - 1);
    const sy = y + rng.int(0, T - 6);
    const len = rng.int(3, 6);
    const c = shade(base, rng.chance(0.55) ? 7 : -6);
    for (let i = 0; i < len; i++) S.set(sx + (i > len / 2 && rng.chance(0.3) ? 1 : 0), sy + i, c);
  }
  // Fine flecks of the other colours in the mix.
  for (let k = 0; k < 6; k++) S.set(x + rng.int(0, T - 1), y + rng.int(0, T - 1), shade(base, rng.chance(0.5) ? 14 : -10));
  if (seam) {
    S.rect(x, y, 1, T, C.weld);
    for (let j = y + 2; j < y + T; j += 5) S.set(x, j, shade(C.weld, 10));
  }
}

export function paintLino(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: LinoVariant): void {
  switch (v) {
    case 'scuff': {
      // Black heel marks: short dark arcs where somebody turned on the spot waiting.
      for (let n = 0; n < rng.int(2, 3); n++) {
        const cx = x + rng.int(5, T - 6);
        const cy = y + rng.int(5, T - 6);
        const len = rng.int(3, 6);
        const dy = rng.chance(0.5) ? 1 : -1;
        for (let i = 0; i < len; i++) S.set(cx + i, cy + (i > len / 2 ? dy : 0), [14, 16, 24, 120]);
      }
      break;
    }
    case 'burn': {
      // A cigarette burn from before the ban: a brown ring with a black middle.
      const cx = x + rng.int(6, T - 7);
      const cy = y + rng.int(6, T - 7);
      for (const [i, j] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]] as const) S.set(cx + i, cy + j, [92, 66, 40, 150]);
      S.put(cx, cy, hx('#14121a'));
      S.set(cx + 2, cy, [92, 66, 40, 80]);
      break;
    }
    case 'bubble': {
      // The linoleum lifted in a bubble: lit on top, a shadow under it.
      const cx = x + 12;
      const cy = y + 12;
      for (let j = -4; j <= 4; j++) {
        for (let i = -7; i <= 7; i++) {
          const d = (i / 7) ** 2 + (j / 4) ** 2;
          if (d > 1) continue;
          if (j < -1) S.put(cx + i, cy + j, shade(S.get(cx + i, cy + j), 9));
          else if (j > 2) S.put(cx + i, cy + j, shade(S.get(cx + i, cy + j), -9));
        }
      }
      break;
    }
    case 'mended': {
      // A rectangle cut out and replaced with the wrong blue, the cut still showing.
      const w = rng.int(10, 16);
      const h = rng.int(8, 14);
      const px = x + rng.int(2, T - w - 2);
      const py = y + rng.int(2, T - h - 2);
      S.rect(px, py, w, h, C.linoPatch);
      for (let k = 0; k < 4; k++) S.set(px + rng.int(1, w - 2), py + rng.int(1, h - 2), shade(C.linoPatch, 7));
      S.rect(px, py, w, 1, shade(C.linoPatch, -14));
      S.rect(px, py, 1, h, shade(C.linoPatch, -14));
      S.rect(px, py + h - 1, w, 1, shade(C.linoPatch, -14));
      S.rect(px + w - 1, py, 1, h, shade(C.linoPatch, -14));
      break;
    }
    case 'feet': {
      // «Espere aquí»: a pair of footprint stickers, faded yellow, one heel peeled off.
      const fx = x + rng.int(4, 8);
      const fy = y + rng.int(4, 8);
      const c: RGBA = [214, 176, 48, 70];
      for (const ox of [0, 7]) {
        S.rect(fx + ox, fy, 4, 7, c);
        S.rect(fx + ox + 1, fy - 1, 2, 1, c);
        S.rect(fx + ox, fy + 8, 4, 3, c);
      }
      S.rect(fx + 7, fy + 8, 4, 3, shade(base, 5));
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

/** The floor polisher's swirls: faint pale arcs that catch the light. */
export function polisherSwirl(S: Canvas, rng: Rng, cx: number, cy: number): void {
  const r0 = rng.int(10, 16);
  for (let k = 0; k < 3; k++) {
    const r = r0 + k * 2;
    const a0 = rng.next() * Math.PI * 2;
    for (let t = 0; t < 2.2; t += 0.035) {
      const a = a0 + t;
      S.set(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.62), [220, 236, 248, 18]);
    }
  }
}

/** A long black streak where a trolley or a shoe slid. */
export function heelStreak(S: Canvas, rng: Rng, x: number, y: number): void {
  const len = rng.int(6, 12);
  const dy = rng.pick([-1, 0, 1]);
  for (let i = 0; i < len; i++) S.set(x + i, y + Math.round((i * dy) / 4), [14, 16, 24, 90 - i * 4]);
}

/**
 * «Siga la línea»: a painted yellow line that comes in from one wall, turns a corner or two and
 * stops in the middle of the floor. Points are the corners of the path (axis-aligned); 4 px wide.
 */
export function followLine(S: Canvas, pts: ReadonlyArray<{ x: number; y: number }>): void {
  for (let k = 0; k + 1 < pts.length; k++) {
    const a = pts[k]!;
    const b = pts[k + 1]!;
    const x0 = Math.min(a.x, b.x);
    const y0 = Math.min(a.y, b.y);
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    for (let y = y0; y <= y1 + 3; y++) {
      for (let x = x0; x <= x1 + 3; x++) {
        // Worn where people actually walk: a pixel gone here and there.
        if ((x * 7 + y * 13) % 23 === 0) continue;
        if (S.get(x, y)[3] === 0) continue;
        S.set(x, y, C.line);
      }
    }
  }
  // Where it ends: nothing. A worn arrowhead that points at more floor.
  const a = pts[pts.length - 2]!;
  const b = pts[pts.length - 1]!;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  const cx = b.x + 1.5;
  const cy = b.y + 1.5;
  for (let i = 0; i < 5; i++) {
    const half = 4 - i;
    for (let j = -half; j <= half; j++) S.set(Math.round(cx + dx * (3 + i) - dy * j), Math.round(cy + dy * (3 + i) + dx * j), C.line);
  }
}

/** A queue ticket somebody threw away when the number was called and they were in the toilet. */
export function queueTicket(S: Canvas, rng: Rng, x: number, y: number): void {
  const paper: RGBA = rng.chance(0.7) ? [224, 220, 206, 150] : [230, 170, 186, 140];
  S.rect(x, y, 4, 5, paper);
  S.rect(x + 1, y + 1, 2, 1, [40, 44, 60, 120]);
  S.set(x + 1, y + 3, [40, 44, 60, 90]);
}

/** A paper cone from the water dispenser, squashed flat. */
export function paperCup(S: Canvas, x: number, y: number): void {
  const c: RGBA = [226, 232, 240, 140];
  S.rect(x, y, 5, 1, c);
  S.rect(x + 1, y + 1, 3, 1, c);
  S.set(x + 2, y + 2, c);
  S.set(x, y, [255, 255, 255, 160]);
}

/** Loops of magnetic tape pulled out of a cassette (the recordings «for quality purposes»). */
export function tapeRibbons(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(3, Math.round(((x1 - x0) * (y1 - y0)) / 9000));
  for (let k = 0; k < n; k++) {
    let x = rng.int(x0 + 10, x1 - 40);
    let y = rng.int(y0 + 10, y1 - 20);
    const c: RGBA = [64, 40, 28, rng.int(110, 150)];
    let a = rng.next() * Math.PI * 2;
    for (let i = 0; i < rng.int(40, 70); i++) {
      a += Math.sin(i * 0.45) * 0.4;
      x += Math.cos(a);
      y += Math.sin(a) * 0.6;
      if (x < x0 || x >= x1 || y < y0 || y >= y1) break;
      S.set(Math.round(x), Math.round(y), c);
    }
  }
}

/** Curly telephone cords running across the switchboard's floor, from the back wall. */
export function phoneCords(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(4, Math.round((x1 - x0) / 70));
  for (let k = 0; k < n; k++) {
    let x = rng.int(x0 + 10, x1 - 10);
    let y = y0;
    const c: RGBA = rng.pick([[20, 22, 30, 150], [120, 40, 40, 120], [200, 196, 180, 90]] as RGBA[]);
    const drift = (rng.next() - 0.5) * 0.8;
    const len = rng.int(40, Math.max(41, Math.round((y1 - y0) * 0.8)));
    for (let i = 0; i < len; i++) {
      // The coil: a little loop every 3 px.
      const wob = Math.sin(i * 2.1) * 1.5;
      S.set(Math.round(x + wob), Math.round(y), c);
      x += drift + Math.sin(i * 0.05 + k) * 0.25;
      y += 1;
      if (y >= y1 || x < x0 || x >= x1) break;
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Walls and ceiling.

/**
 * One tile of a service counter (interior wall), seen in three-quarter view: the laminate
 * counter top with the perspex screen standing on it (holes to speak through, a sign taped on),
 * and the counter front on the tiles with floor below.
 */
export function counterUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const topH = o.front ? 9 : T;
  S.rect(x, y, T, topH, C.counter);
  // Laminate grain, and a pen on a chain now and then.
  for (let i = 0; i < 4; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, topH - 2), shade(C.counter, rng.chance(0.5) ? 6 : -6));
  // The screen runs along the counter: a pale line of perspex with its bright edge and holes.
  const sy = o.front ? y + 2 : y + 10;
  S.rect(x, sy, T, 3, C.perspex);
  S.rect(x, sy, T, 1, [236, 248, 252, 150]);
  if (rng.chance(0.5)) for (let i = x + 6; i < x + 18; i += 3) S.set(i, sy + 2, [20, 30, 40, 140]);
  if (o.front) {
    const fy = y + topH;
    S.rect(x, fy, T, T - topH, C.counterFront);
    S.rect(x, fy, T, 1, K);
    S.rect(x, fy + 1, T, 1, shade(C.counterFront, 18));
    // The kick panel at the bottom, scuffed by years of impatient shoes.
    S.rect(x, y + T - 4, T, 3, shade(C.counterFront, -10));
    for (let i = 0; i < 3; i++) S.set(x + rng.int(1, T - 2), y + T - 3, shade(C.counterFront, 16));
    // What is on the front: the window number, a «cerrada» card or a leaflet holder.
    const k = rng.int(0, 5);
    if (k <= 1) {
      const px = x + rng.int(4, T - 11);
      S.rect(px, fy + 3, 8, 7, hx('#d8dee6'));
      S.rect(px, fy + 3, 8, 1, WHITE);
      stencil(S, px + 2, fy + 5, String(rng.int(1, 9)), hx('#2f4a6a'));
    } else if (k === 2) {
      const px = x + rng.int(3, T - 12);
      S.rect(px, fy + 3, 9, 6, hx('#d8d6ce'));
      S.rect(px + 1, fy + 5, 7, 1, hx('#a42f37'));
      S.rect(px + 1, fy + 7, 5, 1, hx('#8a8894'));
    } else if (k === 3) {
      const px = x + rng.int(3, T - 10);
      S.rect(px, fy + 3, 7, 8, [180, 210, 225, 120]);
      S.rect(px + 1, fy + 4, 2, 6, hx(rng.pick(['#e0453b', '#5f93d4', '#f6c431'])));
      S.rect(px + 4, fy + 4, 2, 6, hx(rng.pick(['#d8d6ce', '#58b45a'])));
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) {
    S.rect(x, y, T, 1, K);
    S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, C.counterHi);
  }
}

/** The back wall: the upper paint, a chair rail, the darker dado, and posters taped on. */
export function backWall(S: Canvas, rng: Rng, w: number, h: number): void {
  S.rect(0, 0, w, h, C.wallHi);
  // Roller marks in the paint.
  for (let x = 0; x < w; x += 2) if (rng.chance(0.2)) S.rect(x, rng.int(12, 30), 1, rng.int(3, 8), shade(C.wallHi, -4));
  S.rect(0, 34, w, h - 34, C.dado);
  S.rect(0, 34, w, 1, hx('#8aa0b0'));
  S.rect(0, 35, w, 1, hx('#1a2636'));
  // Scuffs on the dado where chair backs hit it.
  for (let x = 0; x < w; x += rng.int(5, 12)) S.rect(x, 37 + rng.int(0, 2), rng.int(2, 4), 1, shade(C.dado, -6));
}

/** Notices taped to the wall: an A4 with a header, small print, a corner curling. */
export function notices(S: Canvas, rng: Rng, w: number, busy: (x: number) => boolean): void {
  let x = rng.int(30, 60);
  for (; x < w - 40; x += rng.int(40, 80)) {
    if (busy(x + 4)) continue;
    const y = rng.int(13, 20);
    S.rect(x, y, 8, 10, hx('#d8dee6'));
    S.rect(x, y, 8, 2, hx(rng.pick(['#a42f37', '#2f4a6a', '#3a3d4a'])));
    for (let j = y + 4; j < y + 9; j += 2) S.rect(x + 1, j, rng.int(4, 6), 1, hx('#8a94a4'));
    S.set(x + 7, y + 9, C.wallHi);
    S.set(x, y, [210, 210, 200, 200]);
  }
}

/**
 * The bolted beam seating against the back wall: rows of three or four moulded chairs on one
 * steel beam, one seat missing or tipped up. Drawn low, under the dado rail.
 */
export function waitingChairs(S: Canvas, rng: Rng, w: number, y: number): void {
  const SEAT = hx('#3f66a6');
  const SEAT_D = hx('#2a4a7a');
  let x = rng.int(26, 40);
  while (x < w - 50) {
    const n = rng.int(3, 4);
    const broken = rng.int(-1, n - 1);
    S.rect(x - 2, y + 9, n * 9 + 3, 1, hx('#7890a2'));
    S.rect(x - 2, y + 10, n * 9 + 3, 1, hx('#3a4a5a'));
    for (let i = 0; i < n; i++) {
      const cx = x + i * 9;
      if (i === broken) {
        // The missing seat: the two bolts are still there.
        S.set(cx + 2, y + 8, hx('#9aa8b4'));
        S.set(cx + 5, y + 8, hx('#9aa8b4'));
        continue;
      }
      S.rect(cx, y, 8, 6, SEAT);
      S.rect(cx, y, 8, 1, hx('#5f93d4'));
      S.rect(cx, y + 6, 8, 3, SEAT_D);
      S.rect(cx + 7, y, 1, 9, hx('#1f3456'));
    }
    // The legs at both ends of the beam.
    S.rect(x - 1, y + 11, 1, 2, hx('#5a6a7a'));
    S.rect(x + n * 9 - 1, y + 11, 1, 2, hx('#5a6a7a'));
    x += n * 9 + rng.int(28, 60);
  }
}

/** «Su satisfacción es nuestra prioridad», in vinyl, with its rating: one star of five. Returns its width. */
export const SLOGAN = 'SU SATISFACCIÓN ES NUESTRA PRIORIDAD';

export function sloganWidth(): number {
  return stencilWidth(SLOGAN);
}

export function slogan(S: Canvas, cx: number, y: number): void {
  const tw = stencilWidth(SLOGAN);
  const x = cx - Math.floor(tw / 2);
  stencil(S, x, y + 1, SLOGAN, shade(C.wallHi, -12));
  stencil(S, x, y, SLOGAN, hx('#d8dee6'));
  // The stars under it: one filled, four empty outlines.
  for (let i = 0; i < 5; i++) star(S, cx - 26 + i * 11, y + 9, i === 0);
}

function star(S: Canvas, x: number, y: number, full: boolean): void {
  // Filled, or only its outline (the four stars nobody gave).
  const rows = full ? ['...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'] : ['...#...', '..#.#..', '##...##', '.#...#.', '.#.#.#.', '#.....#'];
  rows.forEach((row, j) => {
    [...row].forEach((p, i) => {
      if (p === '#') S.set(x + i, y + j, full ? (j < 2 ? hx('#fff1a8') : hx('#f6c431')) : hx('#7a8a96'));
    });
  });
}

/** A wall clock that tells its own time (no two in the building agree). */
export function clockAt(S: Canvas, cx: number, cy: number, hour: number, minute: number): void {
  for (let y = -5; y <= 5; y++) {
    for (let x = -5; x <= 5; x++) {
      const d = x * x + y * y;
      if (d <= 25) S.set(cx + x, cy + y, d > 16 ? K : d > 9 && x + y < 0 ? WHITE : hx('#e2e7f0'));
    }
  }
  const hand = (a: number, len: number): void => {
    for (let r = 0; r <= len; r += 0.5) S.set(cx + Math.round(Math.sin(a) * r), cy - Math.round(Math.cos(a) * r), K);
  };
  hand(((hour % 12) + minute / 60) * (Math.PI / 6), 2.2);
  hand(minute * (Math.PI / 30), 3.6);
  S.set(cx, cy, hx('#e0453b'));
}

/** The queue screen: always the same number, at a window that does not exist. */
export function queueScreen(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 26, 13, K);
  S.rect(x, y, 24, 11, hx('#101820'));
  S.rect(x, y, 24, 1, hx('#2a3a4a'));
  stencil(S, x + 2, y + 4, 'A047', hx('#f6c431'));
  S.rect(x + 19, y + 3, 1, 6, hx('#2a3a4a'));
  stencil(S, x + 21, y + 4, '0', hx('#e0453b'));
}

/** The acoustic ceiling: big pale tiles with pinholes, a vent grille now and then. */
export function ceiling(S: Canvas, rng: Rng, w: number): void {
  S.rect(0, 0, w, 11, hx('#3e4e5c'));
  for (let x = 0; x < w; x += 30) S.rect(x, 0, 1, 11, hx('#6a7c8a'));
  S.rect(0, 10, w, 1, hx('#6a7c8a'));
  for (let x = 1; x < w; x += 3) S.set(x, 3 + (x % 2) * 3, shade(hx('#3e4e5c'), -6));
  for (let x = rng.int(1, 4) * 30; x < w - 30; x += rng.int(4, 7) * 30) {
    S.rect(x + 6, 2, 18, 7, hx('#2a3540'));
    for (let j = 3; j < 8; j += 2) S.rect(x + 7, j, 16, 1, hx('#56687a'));
  }
}

/** A square recessed panel of cold light. */
export function lamp(S: Canvas, x: number, y: number): void {
  S.rect(x, y, 44, 5, hx('#d6e4f2'));
  S.rect(x, y, 44, 1, hx('#9aaaba'));
  S.rect(x + 21, y, 2, 5, hx('#9aaaba'));
  S.rect(x + 2, y + 5, 40, 1, WHITE);
}

/** A leaflet holder screwed to a side wall: «Sus derechos», «Cómo reclamar», all empty but one. */
export function leafletRack(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 9, 20, K);
  S.rect(x, y, 7, 18, [170, 200, 214, 255]);
  for (let j = y + 5; j < y + 18; j += 6) S.rect(x, j, 7, 1, hx('#6a8494'));
  const full = rng.int(0, 2);
  S.rect(x + 1, y + 1 + full * 6, 5, 4, hx(rng.pick(['#e0453b', '#f6c431', '#d8dee6'])));
  S.rect(x + 2, y + 2 + full * 6, 3, 1, hx('#2f4a6a'));
}

/** «Hoja de reclamaciones a su disposición»: a small framed notice on a side wall. */
export function complaintsNotice(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 12, 13, K);
  S.rect(x, y, 10, 11, hx('#d8dee6'));
  S.rect(x, y, 10, 3, hx('#2f4a6a'));
  S.rect(x + 1, y + 1, 8, 1, WHITE);
  for (let j = y + 5; j < y + 10; j += 2) S.rect(x + 1, j, 7, 1, hx('#8a94a4'));
}

/** The skirting: the linoleum turned up the wall (a coved edge) and its metal cap. */
export function skirting(S: Canvas, x: number, y: number, w: number, h: number, vertical: boolean, flip = false): void {
  const ramp = [hx('#8aa0b0'), hx('#3a5468'), hx('#2f4a5e'), hx('#263e50'), hx('#16222e')];
  const len = vertical ? h : w;
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < 5; k++) {
      const c = ramp[flip ? 4 - k : k]!;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
}
