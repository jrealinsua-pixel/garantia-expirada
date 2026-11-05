// Floor 4 (Oficinas) tile set: the offices over the shop floors, where the people who sign the
// returns work. Carpet tiles in a tired grey (laid quarter-turned, so the pile changes direction
// from one tile to the next), coffee stains and the arcs of chair wheels, a darker carpet runner
// along the corridor, cubicle partitions of blue-grey fabric with notes pinned to them, a
// plasterboard back wall with the company's values in vinyl letters coming unstuck, a suspended
// ceiling with a tile missing and cold fluorescent panels. Dominant colour: neutral grey (no
// blue, no green, no warmth). Used by the room painter (src/art/room.ts) for rooms of level 4;
// drawn with the room's seeded RNG.
//
// Same rule as the floors below: floor decoration stays low-contrast and about as dark as theirs,
// so it never competes with the bullets (red and cyan with a white core, the player's orange).
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import { T, shade, stencil, stencilWidth, type RoomStyle } from './warehouse.ts';

export const C = {
  /** The two pile directions of the carpet tiles. */
  carpetA: hx('#3d3d42'),
  carpetB: hx('#39393e'),
  /** The odd tile somebody replaced: same brand, another batch. */
  carpetNew: hx('#424149'),
  runner: hx('#2f2d34'),
  wall: hx('#232227'),
  seam: hx('#19181d'),
  paint: [196, 192, 206, 92] as RGBA,
  dash: hx('#6a6672'),
  frame: hx('#8c8a94'),
  frameDark: hx('#55535c'),
  /** Fluorescent tubes: cold and a little green, the light of a Monday. */
  light: [222, 236, 240] as const,
  plaster: hx('#3b3a40'),
  plasterHi: hx('#45444b'),
  fabric: hx('#3d4352'),
  fabricHi: hx('#4a5162'),
  rail: hx('#7d7c86'),
  coffee: [78, 52, 34] as const,
};

export type CarpetVariant = 'plain' | 'stain' | 'worn' | 'patch' | 'gum' | 'curled';

/** Picks the variation of a carpet tile. Stains everywhere; curled corners in the forgotten rooms. */
export function pickCarpetVariant(rng: Rng, style: RoomStyle): CarpetVariant {
  const v = rng.next();
  const old = style === 'secret' ? 2 : 1;
  if (v < 0.015 * old) return 'curled';
  if (v < 0.07) return 'patch';
  if (v < 0.12) return 'stain';
  if (v < 0.16) return 'worn';
  if (v < 0.19) return 'gum';
  return 'plain';
}

/**
 * A carpet tile: a fine loop pile in rows, along x or along y (`across`), and the seam on its
 * top and left edges, barely there (carpet tiles are meant not to show, and show anyway).
 */
export function carpetTile(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, across: boolean): void {
  S.rect(x, y, T, T, base);
  for (let k = 1; k < T; k += 2) {
    for (let i = 0; i < T; i++) {
      if ((i + k) % 3 !== 0) continue;
      const c = shade(base, rng.chance(0.5) ? 8 : 5);
      if (across) S.set(x + i, y + k, c);
      else S.set(x + k, y + i, c);
    }
  }
  for (let i = 0; i < 10; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, T - 2), shade(base, -7));
  S.rect(x, y, T, 1, shade(base, -11));
  S.rect(x, y, 1, T, shade(base, -11));
}

export function paintCarpet(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: CarpetVariant): void {
  switch (v) {
    case 'stain': {
      // An old coffee stain, scrubbed into a paler ring.
      coffeeStain(S, rng, x + rng.int(8, 16), y + rng.int(8, 16), rng.int(4, 6), 56);
      break;
    }
    case 'worn': {
      // Where a chair lives: the pile flattened into a shiny oval.
      const cx = x + 12;
      const cy = y + 12;
      for (let j = -7; j <= 7; j++) {
        for (let i = -10; i <= 10; i++) if ((i / 10) ** 2 + (j / 7) ** 2 <= 1 && (i + j) % 2 === 0) S.put(cx + i, cy + j, shade(S.get(cx + i, cy + j), 6));
      }
      break;
    }
    case 'patch': {
      // A tile from another batch: a shade off, and its pile the other way.
      carpetTile(S, rng, x, y, C.carpetNew, rng.chance(0.5));
      S.rect(x, y, T, 1, shade(C.carpetNew, -16));
      S.rect(x, y, 1, T, shade(C.carpetNew, -16));
      break;
    }
    case 'gum': {
      // Chewing gum, flattened grey years ago.
      const gx = x + rng.int(5, T - 8);
      const gy = y + rng.int(5, T - 7);
      S.rect(gx, gy, 3, 2, shade(base, 16));
      S.set(gx + 1, gy + 2, shade(base, 12));
      S.set(gx + 3, gy + 1, shade(base, 10));
      break;
    }
    case 'curled': {
      // The corner of the tile coming up: the backing shows, black, under a lighter lip.
      const right = rng.chance(0.5);
      const cx = right ? x + T - 1 : x;
      for (let j = 0; j < 6; j++) {
        for (let i = 0; i < 6 - j; i++) {
          const px = right ? cx - i : cx + i;
          S.put(px, y + T - 1 - j, i + j === 5 ? shade(base, 12) : shade(base, -20));
        }
      }
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

/** A coffee stain: a soft ring (darker at the rim, where it dried), sometimes a splash beside it. */
export function coffeeStain(S: Canvas, rng: Rng, cx: number, cy: number, r: number, a = 84): void {
  const [cr, cg, cb] = C.coffee;
  for (let j = -r; j <= r; j++) {
    for (let i = -r - 1; i <= r + 1; i++) {
      const d = (i / (r + 1)) ** 2 + (j / r) ** 2;
      if (d > 1) continue;
      S.set(cx + i, cy + j, [cr, cg, cb, d > 0.6 ? a : Math.round(a * 0.45)]);
    }
  }
  if (rng.chance(0.5)) for (let k = 0; k < 4; k++) S.set(cx + r + rng.int(2, 5), cy + rng.int(-3, 3), [cr, cg, cb, a]);
}

/** The arcs a chair's five wheels draw in the carpet, swivelling in the same spot for years. */
export function chairArcs(S: Canvas, rng: Rng, cx: number, cy: number): void {
  const r0 = rng.int(9, 13);
  const a0 = rng.next() * Math.PI * 2;
  for (const r of [r0, r0 + 3]) {
    for (let t = 0; t < 1.6; t += 0.04) {
      const a = a0 + t;
      S.set(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.6), [210, 206, 220, 26]);
    }
  }
}

/** A sticky note that fell off somebody's screen: «llamar», «URGENTE», a phone number. */
export function postIt(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = hx(rng.pick(['#c9b44a', '#c97a8a', '#7ab0c9', '#9ac97a']));
  const col: RGBA = [c[0], c[1], c[2], 150];
  S.rect(x, y, 5, 5, col);
  S.rect(x, y, 5, 1, shade(col, 18));
  S.rect(x + 1, y + 2, 3, 1, [40, 40, 50, 110]);
}

/** A paper clip, bent open (somebody was nervous). */
export function paperClip(S: Canvas, x: number, y: number): void {
  const c: RGBA = [184, 190, 204, 150];
  S.rect(x, y, 4, 1, c);
  S.set(x + 4, y + 1, c);
  S.rect(x + 1, y + 2, 3, 1, c);
}

/** The dark carpet runner along the corridor, with its bound edges (where the floor 3 had a road). */
export function runner(S: Canvas, rng: Rng, x: number, y: number, len: number, vertical: boolean): void {
  const W = 16;
  const pile: RGBA = [C.runner[0], C.runner[1], C.runner[2], 165];
  const edge: RGBA = [120, 116, 130, 70];
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < W; k++) {
      let c = k === 0 || k === W - 1 ? edge : pile;
      if (k > 1 && k < W - 2 && (i * 3 + k) % 7 === 0) c = shade(pile, 6);
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
  // Worn pale where everybody walks: down the middle, in patches.
  for (let n = 0; n < Math.round(len / 40); n++) {
    const at = rng.int(0, Math.max(0, len - 18));
    for (let i = at; i < at + rng.int(10, 18); i++) {
      for (let k = 5; k < W - 5; k++) if ((i + k) % 2 === 0) vertical ? S.set(x + k, y + i, [150, 146, 160, 18]) : S.set(x + i, y + k, [150, 146, 160, 18]);
    }
  }
}

/** Shredded paper strips (the secret room is where the confidential things went to die). */
export function shreds(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.round(((x1 - x0) * (y1 - y0)) / 260);
  for (let i = 0; i < n; i++) {
    const x = rng.int(x0, x1 - 6);
    const y = rng.int(y0, y1 - 2);
    const a: RGBA = [222, 218, 206, rng.int(40, 80)];
    const len = rng.int(4, 8);
    for (let k = 0; k < len; k++) S.set(x + k, y + (k % 4 === 3 ? 1 : 0), a);
  }
}

// ---------------------------------------------------------------------------------------------
// Walls and ceiling.

/** One tile of a cubicle partition (interior wall): an aluminium rail on top, fabric in front, notes pinned on. */
export function partitionUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const TOP = hx('#55545d');
  const TOP_HI = hx('#6c6b75');
  const topH = o.front ? 7 : T;
  S.rect(x, y, T, topH, TOP);
  // The top of a partition is a rail with a groove down the middle.
  if (o.front) S.rect(x, y + 3, T, 1, shade(TOP, -14));
  else for (let j = y + 2; j < y + T - 1; j += 5) S.rect(x + 4, j, T - 8, 1, shade(TOP, -8));
  for (let i = 0; i < 4; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, topH - 2), shade(TOP, rng.chance(0.5) ? 7 : -7));
  if (o.front) {
    const fy = y + topH;
    S.rect(x, fy, T, T - topH, C.fabric);
    S.rect(x, fy, T, 1, K);
    // Fabric weave.
    for (let j = fy + 2; j < y + T - 1; j += 2) for (let i = x + ((j >> 1) & 1); i < x + T; i += 3) S.set(i, j, C.fabricHi);
    // What is pinned on it: a sticky note, a printed sheet, a calendar of last year.
    const k = rng.int(0, 5);
    if (k <= 1) {
      const c = hx(rng.pick(['#e8d86a', '#e89aa8', '#9ad0e8']));
      const px = x + rng.int(3, T - 8);
      const py = fy + rng.int(2, 6);
      S.rect(px, py, 5, 5, c);
      S.rect(px + 1, py + 2, 3, 1, shade(c, -60));
    } else if (k === 2) {
      const px = x + rng.int(3, T - 10);
      const py = fy + 2;
      S.rect(px, py, 7, 9, hx('#d8d6ce'));
      for (let j = py + 2; j < py + 8; j += 2) S.rect(px + 1, j, rng.int(3, 5), 1, hx('#8a8894'));
      S.set(px + 3, py, hx('#e0453b'));
    } else if (k === 3) {
      const px = x + rng.int(3, T - 11);
      const py = fy + 2;
      S.rect(px, py, 8, 9, WHITE);
      S.rect(px, py, 8, 2, hx('#a42f37'));
      for (let j = py + 3; j < py + 9; j += 2) for (let i = px + 1; i < px + 8; i += 2) S.set(i, j, hx('#9a98a4'));
      // Last year's calendar: one day circled, long gone.
      S.set(px + 5, py + 5, hx('#e0453b'));
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) S.rect(x, y, T, 1, K);
  if (o.up) S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, TOP_HI);
}

/** The values of the company, in vinyl letters on the back wall, some of them gone. */
export const VALUES = ['PASIÓN', 'RESILIENCIA', 'FAMILIA', 'COMPROMISO', 'EXCELENCIA', 'PROACTIVIDAD'] as const;

/** The plasterboard back wall: panels with their joints, a scuff line, the values half peeled off. */
export function backWall(S: Canvas, rng: Rng, w: number, h: number): void {
  S.rect(0, 0, w, h, C.plaster);
  for (let x = 0; x < w; x += 40) S.rect(x, 0, 1, h, shade(C.plaster, -8));
  // Chair-back scuffs at desk height.
  for (let x = 0; x < w; x += rng.int(6, 14)) S.rect(x, h - 9, rng.int(2, 5), 1, shade(C.plaster, -6));
  // The values, one after the other, a letter or two peeled off (the glue mark stays).
  let x = rng.int(28, 44);
  for (const word of rng.shuffle([...VALUES])) {
    const tw = stencilWidth(word);
    if (x + tw > w - 28) break;
    const gone = new Set([rng.int(0, word.length - 1)]);
    if (rng.chance(0.4)) gone.add(rng.int(0, word.length - 1));
    let cx = x;
    for (const [i, ch] of [...word].entries()) {
      const cw = stencilWidth(ch);
      if (gone.has(i)) S.rect(cx, 30, cw, 5, shade(C.plaster, 4));
      else {
        stencil(S, cx, 31, ch, C.plasterHi);
        stencil(S, cx, 30, ch, hx('#8a8896'));
      }
      cx += cw + 1;
    }
    x += tw + rng.int(18, 30);
  }
}

/** Colours of lever arch files: corporate blue, black, the odd red, all labelled by year. */
const BINDERS = ['#2f4a7a', '#26262c', '#3f5a8a', '#7a2a34', '#4a4a52', '#2f5a4a'];

/** The binder shelf on the back wall: lever arch files with their labels and finger holes. */
export function binderShelf(S: Canvas, rng: Rng, w: number, plankY: number, hmax: number, hmin: number): void {
  let x = 26;
  while (x < w - 28) {
    const n = rng.int(3, 7);
    const h = rng.int(hmin, hmax);
    for (let i = 0; i < n && x < w - 30; i++) {
      const bw = rng.int(3, 4);
      const col = hx(rng.pick(BINDERS));
      // Some lean on the next one.
      S.rect(x, plankY - h, bw, h, col);
      S.rect(x, plankY - h, bw, 1, shade(col, 30));
      S.rect(x + bw - 1, plankY - h, 1, h, shade(col, -30));
      S.rect(x, plankY - h + 2, bw - 1, 2, hx('#d8d6ce'));
      if (h >= 9) S.set(x + 1, plankY - 3, K);
      x += bw;
    }
    x += rng.int(3, 10);
  }
  S.rect(0, plankY, w, 2, hx('#4a4952'));
  S.rect(0, plankY, w, 1, hx('#5f5e68'));
}

/** Low things on the second shelf: in-trays, a phone on its cable, a box of paper. */
export function deskShelf(S: Canvas, rng: Rng, w: number, plankY: number): void {
  let x = 30;
  while (x < w - 34) {
    const k = rng.int(0, 3);
    if (k === 0) {
      // Stacked in-trays with paper sticking out.
      for (let j = 0; j < 3; j++) {
        S.rect(x, plankY - 2 - j * 2, 12, 1, hx('#2a2a30'));
        S.rect(x + 1, plankY - 3 - j * 2, 10, 1, hx('#d8d6ce'));
      }
      x += 14;
    } else if (k === 1) {
      // A box of printer paper.
      S.rect(x, plankY - 5, 10, 5, hx('#d8d6ce'));
      S.rect(x, plankY - 5, 10, 1, WHITE);
      S.rect(x + 1, plankY - 3, 8, 1, hx('#3f66a6'));
      x += 12;
    } else if (k === 2) {
      // A desk phone, the cable curling down.
      S.rect(x, plankY - 3, 8, 3, hx('#2a2a30'));
      S.rect(x + 1, plankY - 5, 6, 2, hx('#3a3a42'));
      S.set(x + 6, plankY - 2, hx('#e0453b'));
      x += 10;
    }
    x += rng.int(10, 26);
  }
  S.rect(0, plankY, w, 2, hx('#4a4952'));
  S.rect(0, plankY, w, 1, hx('#5f5e68'));
}

/** The suspended ceiling: a grid of tiles, one missing (the dark shows), one with a water stain. */
export function dropCeiling(S: Canvas, rng: Rng, w: number): void {
  S.rect(0, 0, w, 11, hx('#3a3940'));
  for (let x = 0; x < w; x += 24) S.rect(x, 0, 1, 11, hx('#6c6b75'));
  S.rect(0, 10, w, 1, hx('#6c6b75'));
  for (let x = 0; x < w; x += 2) S.set(x + (Math.floor(x / 24) & 1), 4, shade(hx('#3a3940'), -5));
  const gone = rng.int(1, Math.max(1, Math.floor(w / 24) - 2)) * 24;
  S.rect(gone + 1, 0, 23, 10, hx('#0e0d12'));
  // A wire hanging from where the tile was.
  for (let j = 2; j < 9; j++) S.set(gone + 12 + (j > 6 ? 1 : 0), j, hx('#4a4952'));
  const stain = (rng.int(1, Math.max(1, Math.floor(w / 24) - 2)) * 24 + 12) % Math.max(24, w - 24);
  if (Math.abs(stain - gone - 12) > 24) for (let i = -4; i <= 4; i++) S.set(stain + i, 6 + (Math.abs(i) > 2 ? 1 : 0), [110, 90, 60, 70]);
}

/** A fluorescent ceiling panel with its louvre grid (cold light). */
export function officeLamp(S: Canvas, x: number, y: number): void {
  S.rect(x, y, 44, 4, hx('#dfe8ea'));
  S.rect(x, y, 44, 1, hx('#a6b0b4'));
  for (let i = x + 4; i < x + 44; i += 5) S.rect(i, y + 1, 1, 3, hx('#a6b0b4'));
  S.rect(x + 2, y + 4, 40, 1, WHITE);
}

/** «Objetivos Q3»: a small whiteboard with a bar chart going down and a red arrow. */
export function targetsBoard(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 24, 13, K);
  S.rect(x, y, 22, 11, hx('#d8dbe0'));
  S.rect(x, y, 22, 1, WHITE);
  let h = rng.int(6, 7);
  for (let i = 0; i < 4; i++) {
    S.rect(x + 3 + i * 4, y + 9 - h, 2, h, hx('#3f66a6'));
    h = Math.max(1, h - rng.int(1, 2));
  }
  for (let i = 0; i < 12; i++) S.set(x + 4 + i, y + 2 + Math.floor(i / 2), hx('#e0453b'));
  S.rect(x + 15, y + 8, 3, 1, hx('#e0453b'));
  S.rect(x + 17, y + 6, 1, 3, hx('#e0453b'));
  S.rect(x + 1, y + 10, 20, 1, hx('#9aa0aa'));
}

/** A motivational poster on a side wall: a mountain at dawn, a caption nobody reads. */
export function poster(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 12, 13, K);
  S.rect(x, y, 10, 11, hx('#1f2230'));
  S.rect(x, y, 10, 4, hx(rng.pick(['#4a3a5a', '#5a3a3a', '#2f4a5a'])));
  for (let i = 0; i < 10; i++) S.rect(x + i, y + 7 - Math.max(0, 3 - Math.abs(i - 5)), 1, Math.max(0, 3 - Math.abs(i - 5)) + 1, hx('#6a6878'));
  S.set(x + 5, y + 4, WHITE);
  S.rect(x + 2, y + 9, 6, 1, hx('#c9b44a'));
}

/** A radiator against a side wall: columns of fins, painted the same white as everything. */
export function radiator(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 8, 20, K);
  S.rect(x, y, 6, 18, hx('#8a8994'));
  for (let j = y + 1; j < y + 18; j += 3) S.rect(x, j, 6, 1, hx('#5f5e68'));
  S.rect(x, y, 1, 18, hx('#a8a7b0'));
  S.set(x + 3, y + 18, hx('#4a4952'));
}

/** The skirting: grey PVC with a cable trunking on top, a floor box now and then. */
export function skirting(S: Canvas, x: number, y: number, w: number, h: number, vertical: boolean, flip = false): void {
  const ramp = [hx('#7a7984'), hx('#64636d'), hx('#55545d'), hx('#47464e'), hx('#26252b')];
  const len = vertical ? h : w;
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < 5; k++) {
      const c = ramp[flip ? 4 - k : k]!;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
    if (i % 56 === 28) {
      // A floor box with a network socket.
      if (vertical) S.rect(x + 1, y + i, 3, 4, hx('#a8a7b0'));
      else S.rect(x + i, y + 1, 5, 3, hx('#a8a7b0'));
      if (vertical) S.set(x + 2, y + i + 1, hx('#3f66a6'));
      else S.set(x + i + 2, y + 2, hx('#3f66a6'));
    }
  }
}
