// Floor 6 (the Servicio Técnico's Taller de Reacondicionado) tile set: the secret floor, where
// returned products are wiped, relabelled and sold again as new. Small square workshop tiles that
// were white once (years of grease have turned them the colour of a bone), black grease, oil
// drips and swarf, a floor drain, the anchor bolts of a machine that was taken away, a painted
// pedestrian walkway; wire parts cages with the green label «REACONDICIONADO · COMO NUEVO» as
// interior walls; a back wall half tiled, half painted factory green, with a pegboard of tools
// (the outlines of the ones that went missing), parts bins and a board «Días sin incidencias: 0»;
// an exposed steel truss with fluorescent battens hanging on chains and a compressed-air line on
// the side walls. Dominant colour: a dirty khaki grey, warmer than the offices, colder than the
// toy shop. Used by the room painter (src/art/room.ts) for rooms of level 6 and up; drawn with
// the room's seeded RNG.
//
// The tiles are «white» in name only, on purpose: the floor stays about as dark and low-contrast
// as the floors below, so it never competes with the bullets (red and cyan with a white core, the
// player's orange). The workshop's white is in the walls, the lamps and the labels.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import { T, shade, stencil, stencilWidth } from './warehouse.ts';
import type { RoomStyle } from './warehouse.ts';

export const C = {
  /** The tiles: two batches of the same white that grease has turned two shades of bone. */
  tileA: hx('#47463c'),
  tileB: hx('#434238'),
  /** The grout, black with what got into it. */
  grout: hx('#2c2b24'),
  wall: hx('#201f1b'),
  seam: hx('#171612'),
  /** Floor paint: the green of the «Reacondicionado» labels, faded. */
  paint: [104, 176, 96, 100] as RGBA,
  dash: hx('#7a744a'),
  frame: hx('#8c9088'),
  frameDark: hx('#4e524c'),
  /** Fluorescent tubes: cold, a little green (the starter is going). */
  light: [226, 242, 230] as const,
  /** The back wall: factory green above, tiles below. */
  wallHi: hx('#36433a'),
  wallTile: hx('#5c5e54'),
  wallTileGrout: hx('#3a3c34'),
  /** Grease: dark brown, almost black, with a sheen. */
  grease: [22, 18, 12, 120] as RGBA,
  /** The walkway lines (yellow), worn. */
  walk: [196, 168, 54, 110] as RGBA,
  cage: hx('#8a8e86'),
  cageDark: hx('#4c5048'),
  label: hx('#58b45a'),
};

export type WorkshopVariant = 'plain' | 'grease' | 'chipped' | 'drain' | 'bolts' | 'gone' | 'solder';

/** Picks the variation of a workshop tile. Drains are rare (one now and then); more grease in the forgotten rooms. */
export function pickWorkshopVariant(rng: Rng, style: RoomStyle): WorkshopVariant {
  const v = rng.next();
  const old = style === 'secret' ? 2 : 1;
  if (v < 0.006) return 'drain';
  if (v < 0.025) return 'bolts';
  if (v < 0.045) return 'gone';
  if (v < 0.07) return 'solder';
  if (v < 0.11) return 'chipped';
  if (v < 0.11 + 0.07 * old) return 'grease';
  return 'plain';
}

/**
 * A floor cell of workshop tiles: four small square tiles (12 × 12) with dark grout, each a
 * touch lighter or darker than its neighbours (they were laid from two boxes), a dull glaze
 * highlight on the top left and fine specks of dirt.
 */
export function workshopTile(S: Canvas, rng: Rng, x: number, y: number, base: RGBA): void {
  for (const [ox, oy] of [[0, 0], [12, 0], [0, 12], [12, 12]] as const) {
    const c = shade(base, rng.int(-3, 3));
    S.rect(x + ox, y + oy, 12, 12, c);
    S.rect(x + ox, y + oy, 12, 1, C.grout);
    S.rect(x + ox, y + oy, 1, 12, C.grout);
    // What is left of the glaze, where the light catches it.
    S.set(x + ox + 2, y + oy + 2, shade(c, 9));
    S.set(x + ox + 3, y + oy + 2, shade(c, 5));
    for (let k = 0; k < 3; k++) S.set(x + ox + rng.int(2, 11), y + oy + rng.int(2, 11), shade(c, rng.chance(0.5) ? 6 : -7));
  }
}

export function paintWorkshop(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: WorkshopVariant): void {
  switch (v) {
    case 'grease': {
      // A black smear of grease across a tile or two of the four, wiped with a rag (it spread).
      const cx = x + rng.int(6, T - 7);
      const cy = y + rng.int(6, T - 7);
      const rx = rng.int(4, 7);
      const ry = rng.int(2, 4);
      for (let j = -ry; j <= ry; j++) {
        for (let i = -rx; i <= rx; i++) if ((i / rx) ** 2 + (j / ry) ** 2 <= 1 + rng.next() * 0.3 - 0.15) S.set(cx + i, cy + j, C.grease);
      }
      // The rag's streaks, and the sheen on top.
      for (let i = 0; i < rng.int(4, 7); i++) S.set(cx + rx + i, cy + rng.int(-1, 1), [22, 18, 12, 60]);
      S.set(cx - 1, cy - 1, [150, 140, 110, 90]);
      break;
    }
    case 'chipped': {
      // A corner chipped off one tile: the grey cement under the glaze.
      const ox = x + (rng.chance(0.5) ? 1 : 13);
      const oy = y + (rng.chance(0.5) ? 1 : 13);
      const n = rng.int(3, 5);
      for (let j = 0; j < n; j++) for (let i = 0; i < n - j; i++) S.put(ox + i, oy + j, hx('#2f2e28'));
      S.set(ox + n - 1, oy, shade(base, 10));
      break;
    }
    case 'drain': {
      // A round floor drain in the middle of the cell: steel ring, slots, black below.
      const cx = x + 12;
      const cy = y + 12;
      for (let j = -6; j <= 6; j++) {
        for (let i = -6; i <= 6; i++) {
          const d = i * i + j * j;
          if (d > 36) continue;
          S.put(cx + i, cy + j, d > 25 ? (i + j < 0 ? hx('#8a8c82') : hx('#4a4c44')) : hx('#16150f'));
        }
      }
      for (let j = -3; j <= 3; j += 2) S.rect(cx - 4, cy + j, 9, 1, hx('#5e6058'));
      // The floor slopes to it: a darker ring of dirt around.
      for (let a = 0; a < Math.PI * 2; a += 0.15) S.set(cx + Math.round(Math.cos(a) * 8), cy + Math.round(Math.sin(a) * 8), [24, 22, 16, 70]);
      break;
    }
    case 'bolts': {
      // Where a machine stood: four anchor bolts and the clean rectangle of its foot.
      const px = x + 4;
      const py = y + 5;
      S.rect(px, py, 16, 13, shade(base, 5));
      for (const [i, j] of [[0, 0], [15, 0], [0, 12], [15, 12]] as const) {
        S.put(px + i, py + j, hx('#8a8c82'));
        S.set(px + i + 1, py + j + 1, [12, 10, 8, 140]);
      }
      break;
    }
    case 'gone': {
      // A tile missing altogether: the grey mortar with the notched trowel lines.
      const ox = x + (rng.chance(0.5) ? 0 : 12);
      const oy = y + (rng.chance(0.5) ? 0 : 12);
      S.rect(ox + 1, oy + 1, 11, 11, hx('#353329'));
      for (let j = oy + 3; j < oy + 12; j += 3) S.rect(ox + 1, j, 11, 1, hx('#2b2a22'));
      S.rect(ox + 1, oy + 1, 11, 1, hx('#1e1d17'));
      break;
    }
    case 'solder': {
      // Spatter from a soldering iron: tiny bright beads and scorch dots.
      for (let k = 0; k < rng.int(5, 8); k++) {
        const sx = x + rng.int(3, T - 4);
        const sy = y + rng.int(3, T - 4);
        S.set(sx, sy, rng.chance(0.5) ? [178, 182, 172, 150] : [26, 22, 16, 130]);
      }
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

/** A pool of spilt oil with a drip trail leading away from it. */
export function oilDrips(S: Canvas, rng: Rng, cx: number, cy: number): void {
  const rx = rng.int(5, 9);
  const ry = Math.max(2, Math.round(rx / 2.4));
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng.next() * 0.25 - 0.1) S.set(x, y, [16, 12, 8, rng.int(80, 105)]);
    }
  }
  S.set(cx - 2, cy - 1, [160, 150, 120, 70]);
  const dx = rng.pick([-1, 1]);
  let x = cx + dx * rx;
  let y = cy;
  for (let i = 0; i < rng.int(3, 6); i++) {
    x += dx * rng.int(3, 6);
    y += rng.int(-1, 1);
    S.set(x, y, [16, 12, 8, 90]);
    if (rng.chance(0.5)) S.set(x + 1, y, [16, 12, 8, 60]);
  }
}

/** Metal swarf: little bright curls of turnings swept nowhere. */
export function swarf(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(8, Math.round(((x1 - x0) * (y1 - y0)) / 1800));
  for (let k = 0; k < n; k++) {
    const cx = rng.int(x0 + 6, x1 - 6);
    const cy = rng.int(y0 + 6, y1 - 6);
    const c: RGBA = rng.chance(0.7) ? [170, 174, 166, 110] : [196, 150, 84, 100];
    const a0 = rng.next() * Math.PI * 2;
    for (let t = 0; t < 4.5; t += 0.5) S.set(Math.round(cx + Math.cos(a0 + t) * (1 + t * 0.5)), Math.round(cy + Math.sin(a0 + t) * (1 + t * 0.4)), c);
  }
}

/** The painted pedestrian walkway: two yellow lines and, now and then, a little walking figure. */
export function walkway(S: Canvas, x: number, y: number, len: number, vertical: boolean): void {
  const gap = 18;
  for (let i = 0; i < len; i++) {
    for (const off of [0, gap]) {
      for (let k = 0; k < 2; k++) {
        const px = vertical ? x + off + k : x + i;
        const py = vertical ? y + i : y + off + k;
        // Worn where the trolleys cross.
        if ((px * 5 + py * 11) % 19 === 0) continue;
        if (S.get(px, py)[3] === 0) continue;
        S.set(px, py, C.walk);
      }
    }
  }
  // The figure: a head and a body striding, every 72 px.
  for (let i = 30; i < len - 10; i += 72) {
    const fx = vertical ? x + 8 : x + i;
    const fy = vertical ? y + i : y + 6;
    const fig = ['.#.', '###', '.#.', '#.#'];
    fig.forEach((row, j) => [...row].forEach((p, k) => p === '#' && S.set(fx + k, fy + j, C.walk)));
  }
}

/** A coil spring off something that will never close again. */
export function spring(S: Canvas, x: number, y: number): void {
  const c: RGBA = [150, 154, 146, 150];
  for (let i = 0; i < 6; i += 2) {
    S.set(x + i, y, c);
    S.set(x + i + 1, y + 1, c);
  }
}

/** A washer: a tiny ring. */
export function washer(S: Canvas, x: number, y: number): void {
  const c: RGBA = [160, 162, 154, 140];
  S.set(x + 1, y, c);
  S.set(x, y + 1, c);
  S.set(x + 2, y + 1, c);
  S.set(x + 1, y + 2, c);
}

/** A green «Reacondicionado» sticker that came off its product: a small green rectangle with a tick. */
export function lostSticker(S: Canvas, x: number, y: number): void {
  S.rect(x, y, 5, 3, [88, 180, 90, 130]);
  S.set(x + 1, y + 1, [244, 241, 232, 150]);
  S.set(x + 2, y + 2, [244, 241, 232, 150]);
}

// ---------------------------------------------------------------------------------------------
// Walls and ceiling.

const PARTS = ['#7a6a5a', '#5a627c', '#8a5a3a', '#4b7a4e', '#a8916c', '#6a6e66', '#3f74bd'];

/**
 * One tile of a parts cage (interior wall), seen in three-quarter view: a galvanised mesh top,
 * and on the tiles with floor below the mesh front, with the parts stacked behind it (motors,
 * coils, circuit boards, a toaster's heating element) and now and then the green label
 * «REACONDICIONADO · COMO NUEVO» zip-tied on.
 */
export function cageUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const topH = o.front ? 7 : T;
  // The top: dark, with the mesh grid catching the light.
  S.rect(x, y, T, topH, hx('#33362f'));
  for (let j = y + 1; j < y + topH; j += 3) for (let i = x + ((j - y) % 2); i < x + T; i += 3) S.set(i, j, C.cageDark);
  if (o.front) {
    const fy = y + topH;
    const fh = T - topH;
    // Behind the mesh: the parts, in the dark.
    S.rect(x, fy, T, fh, hx('#1c1d18'));
    let bx = x + 1;
    while (bx < x + T - 3) {
      const w = rng.int(4, 7);
      const h = rng.int(4, 9);
      if (bx + w > x + T - 1) break;
      const col = hx(rng.pick(PARTS));
      const kind = rng.int(0, 2);
      const by = y + T - 2 - h;
      if (kind === 0) {
        // A motor: a cylinder lying down.
        S.rect(bx, by, w, h, shade(col, -25));
        S.rect(bx, by, w, 1, shade(col, 5));
        S.set(bx + Math.floor(w / 2), by + Math.floor(h / 2), shade(col, 20));
      } else if (kind === 1) {
        // A coil of copper.
        for (let j = 0; j < h; j += 2) S.rect(bx, by + j, w, 1, [150, 96, 52, 255]);
      } else {
        // A circuit board, on its side.
        S.rect(bx, by, w, h, [40, 82, 52, 255]);
        S.set(bx + 1, by + 1, [180, 170, 90, 255]);
      }
      bx += w + rng.int(0, 2);
    }
    // The mesh: a diamond lattice of galvanised wire over it all.
    for (let j = 0; j < fh; j++) {
      for (let i = 0; i < T; i++) {
        if ((i + j) % 4 === 0 || (i - j + 64) % 4 === 0) S.put(x + i, fy + j, (i + j) % 8 < 4 ? C.cage : C.cageDark);
      }
    }
    S.rect(x, fy, T, 1, K);
    S.rect(x, fy + 1, T, 1, shade(C.cage, 18));
    // The frame: a post on each open side and a rail along the bottom.
    S.rect(x, y + T - 2, T, 1, C.cageDark);
    if (o.left) S.rect(x + 1, fy, 1, fh, C.cage);
    if (o.right) S.rect(x + T - 2, fy, 1, fh, C.cageDark);
    // The label, zip-tied to the mesh.
    if (rng.chance(0.3)) {
      const lx = x + rng.int(4, T - 13);
      const ly = fy + rng.int(3, 6);
      S.rect(lx - 1, ly - 1, 11, 7, K);
      S.rect(lx, ly, 9, 5, C.label);
      S.rect(lx, ly, 9, 1, hx('#8ad88a'));
      S.rect(lx + 1, ly + 2, 4, 1, WHITE);
      S.set(lx + 6, ly + 3, WHITE);
      S.set(lx + 7, ly + 2, WHITE);
      S.set(lx + 8, ly + 1, WHITE);
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) {
    S.rect(x, y, T, 1, K);
    S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, C.cage);
  }
}

/** The back wall: factory green above (roller marks, a stripe of hazard paint), white tiles below, black with grime at the bottom. */
export function backWall(S: Canvas, rng: Rng, w: number, h: number): void {
  S.rect(0, 0, w, h, C.wallHi);
  for (let x = 0; x < w; x += 2) if (rng.chance(0.18)) S.rect(x, rng.int(12, 26), 1, rng.int(3, 7), shade(C.wallHi, -4));
  // The tiles: 6 × 6, the grout darker near the floor.
  const top = 31;
  S.rect(0, top, w, h - top, C.wallTile);
  for (let y = top; y < h; y += 6) S.rect(0, y, w, 1, C.wallTileGrout);
  for (let y = top; y < h; y += 6) for (let x = (Math.floor((y - top) / 6) % 2) * 3; x < w; x += 6) S.rect(x, y, 1, 6, C.wallTileGrout);
  for (let y = h - 6; y < h; y++) for (let x = 0; x < w; x++) S.set(x, y, [20, 18, 12, 40 + (y - (h - 6)) * 14]);
  // A tile cracked here and there, and one fallen off.
  for (let x = rng.int(10, 60); x < w - 10; x += rng.int(50, 120)) {
    const ty = top + 1 + 6 * rng.int(0, 2);
    if (rng.chance(0.3)) S.rect(x, ty, 5, 5, hx('#3a3a30'));
    else for (let i = 0; i < 4; i++) S.set(x + i, ty + (i % 2), C.wallTileGrout);
  }
  S.rect(0, top - 1, w, 1, hx('#1c241e'));
}

/**
 * The tool pegboard: a brown board full of holes, a few tools hanging (spanners, a screwdriver,
 * pliers) and the painted outlines of the ones that are gone. Returns nothing; `w` is its width.
 */
export function pegboard(S: Canvas, rng: Rng, x: number, y: number, w: number): void {
  S.rect(x - 1, y - 1, w + 2, 15, K);
  S.rect(x, y, w, 13, hx('#7a5a3a'));
  S.rect(x, y, w, 1, hx('#9a7a52'));
  for (let j = y + 2; j < y + 13; j += 3) for (let i = x + 1; i < x + w - 1; i += 3) S.set(i, j, hx('#4a3424'));
  for (let i = x + 3; i < x + w - 4; i += rng.int(5, 7)) {
    const missing = rng.chance(0.4);
    const c = missing ? hx('#e2dccc') : hx(rng.pick(['#b7bed0', '#858ea8', '#e0453b', '#f6c431']));
    const len = rng.int(6, 10);
    const kind = rng.int(0, 1);
    if (missing) {
      // Only its outline, in white paint: whoever took it never brought it back.
      S.set(i, y + 2, c);
      S.set(i + 2, y + 2, c);
      for (let j = 1; j < len; j++) {
        S.set(i, y + 2 + j, c);
        S.set(i + 2, y + 2 + j, c);
      }
      S.set(i + 1, y + 1 + len, c);
    } else {
      S.rect(i, y + 2, 3, 2, c);
      if (kind === 0) S.rect(i + 1, y + 4, 1, len - 2, c);
      else S.rect(i, y + 4, 3, len - 2, hx('#2b3048'));
      S.set(i + 1, y + 2, K);
    }
  }
}

/** «Días sin incidencias: 0»: the board by the door, the number in red, never changed. */
export function incidentBoard(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 26, 17, K);
  S.rect(x, y, 24, 15, hx('#e2dccc'));
  S.rect(x, y, 24, 4, hx('#2f6b3a'));
  S.rect(x + 1, y + 1, 22, 1, hx('#58b45a'));
  for (let j = y + 6; j < y + 13; j += 2) S.rect(x + 2, j, 10, 1, hx('#8a8878'));
  S.rect(x + 14, y + 5, 9, 9, hx('#1c1d18'));
  stencil(S, x + 17, y + 8, '0', hx('#e0453b'));
}

/** Rows of plastic parts bins along the back wall, each with its little white label. Drawn low, over the tiles. */
export function partsBins(S: Canvas, rng: Rng, w: number, y: number): void {
  let x = rng.int(24, 40);
  while (x < w - 50) {
    const n = rng.int(4, 6);
    const col = hx(rng.pick(['#3f66a6', '#a42f37', '#d9a52a', '#4b7a4e']));
    // The steel rail they hang on.
    S.rect(x - 2, y, n * 8 + 3, 1, hx('#8c9088'));
    S.rect(x - 2, y + 1, n * 8 + 3, 1, hx('#3a3c34'));
    for (let i = 0; i < n; i++) {
      const bx = x + i * 8;
      if (rng.chance(0.12)) continue;
      S.rect(bx, y + 2, 7, 6, col);
      S.rect(bx, y + 2, 7, 1, shade(col, 30));
      S.rect(bx + 6, y + 2, 1, 6, shade(col, -40));
      // The open lip and what sticks out of it.
      S.rect(bx + 1, y + 3, 5, 1, shade(col, -55));
      if (rng.chance(0.5)) S.set(bx + rng.int(1, 4), y + 2, hx(rng.pick(PARTS)));
      S.rect(bx + 2, y + 5, 3, 2, hx('#e2dccc'));
    }
    x += n * 8 + rng.int(26, 56);
  }
}

/** The ceiling: an exposed steel truss (two chords and the lattice between them), rust in the joints. */
export function truss(S: Canvas, rng: Rng, w: number): void {
  S.rect(0, 0, w, 12, hx('#262620'));
  S.rect(0, 1, w, 2, hx('#5a5c52'));
  S.rect(0, 1, w, 1, hx('#7a7c70'));
  S.rect(0, 9, w, 2, hx('#4a4c44'));
  for (let x = 0; x < w; x += 12) {
    for (let j = 0; j < 6; j++) {
      S.set(x + j, 3 + j, hx('#4a4c44'));
      S.set(x + 11 - j, 3 + j, hx('#3a3c34'));
    }
  }
  for (let x = rng.int(20, 50); x < w; x += rng.int(60, 140)) S.set(x, 10, hx('#b8683a'));
}

/** A fluorescent batten hanging from the truss on two chains: the steel housing and the cold tube. */
export function lamp(S: Canvas, x: number, y: number): void {
  for (let j = 3; j < y; j++) {
    if (j % 2 === 0) {
      S.set(x + 4, j, hx('#6a6c62'));
      S.set(x + 39, j, hx('#6a6c62'));
    }
  }
  S.rect(x, y, 44, 2, hx('#8c9088'));
  S.rect(x, y, 44, 1, hx('#b4b8ae'));
  S.rect(x + 1, y + 2, 42, 2, hx('#e6f4ea'));
  S.rect(x + 3, y + 2, 38, 1, WHITE);
  // The ends of the tube, darker (it is on its way out).
  S.set(x + 1, y + 2, hx('#8a948c'));
  S.set(x + 42, y + 2, hx('#8a948c'));
}

/** The compressed-air line down a side wall: a blue pipe with its brackets and a quick coupler. */
export function airLine(S: Canvas, x: number, y0: number, y1: number, skip: (y: number) => boolean): void {
  for (let y = y0; y < y1; y++) {
    if (skip(y)) continue;
    S.rect(x, y, 3, 1, hx('#3f66a6'));
    S.set(x, y, hx('#6a94d4'));
    S.set(x + 2, y, hx('#24406a'));
    if (y % 44 === 0) {
      S.rect(x - 1, y, 5, 2, hx('#8c9088'));
      // The coupler and its coiled hose, hanging.
      S.rect(x + 3, y + 3, 2, 3, hx('#d9a52a'));
      for (let j = 0; j < 6; j++) S.set(x + 4 + (j % 2), y + 6 + j, hx('#e0453b'));
    }
  }
}

/** A safety poster on a side wall: the blue circle of «EPI obligatorio» and its small print. */
export function safetyPoster(S: Canvas, x: number, y: number): void {
  S.rect(x - 1, y - 1, 12, 15, K);
  S.rect(x, y, 10, 13, hx('#e2dccc'));
  for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) S.set(x + 5 + i, y + 5 + j, hx('#3f66a6'));
  S.rect(x + 4, y + 3, 3, 2, WHITE);
  S.rect(x + 3, y + 5, 5, 1, WHITE);
  for (let j = y + 10; j < y + 13; j += 2) S.rect(x + 1, j, 8, 1, hx('#8a8878'));
}

/** The tiles turned up the wall (a coved skirting) with a steel edge. */
export function skirting(S: Canvas, x: number, y: number, w: number, h: number, vertical: boolean, flip = false): void {
  const ramp = [hx('#8c9088'), hx('#55564c'), hx('#4a4a40'), hx('#3e3e35'), hx('#1c1c16')];
  const len = vertical ? h : w;
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < 5; k++) {
      // The grout every 6 px, as on the wall.
      const c = i % 6 === 0 && k > 0 && k < 4 ? hx('#2c2b24') : ramp[flip ? 4 - k : k]!;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
}

/** The entrance's light box: «Servicio Técnico Oficial» in white on green, and the line under it. */
export const ENTRANCE = 'SERVICIO TÉCNICO OFICIAL';
export const ENTRANCE_SMALL = 'SOLO CON CITA PREVIA';

export function entranceSignWidth(): number {
  return stencilWidth(ENTRANCE) + 14;
}

export function entranceSign(S: Canvas, cx: number, y: number): void {
  const w = entranceSignWidth();
  const x = cx - Math.floor(w / 2);
  S.rect(x - 1, y - 1, w + 2, 16, K);
  // The border: green and white stripes, like the lift that brought you up.
  for (let i = 0; i < w; i++) {
    const c = Math.floor(i / 3) % 2 === 0 ? hx('#58b45a') : hx('#f4f1e8');
    S.set(x + i, y, c);
    S.set(x + i, y + 13, c);
  }
  for (let j = 0; j < 14; j++) {
    const c = Math.floor(j / 3) % 2 === 0 ? hx('#58b45a') : hx('#f4f1e8');
    S.set(x, y + j, c);
    S.set(x + w - 1, y + j, c);
  }
  S.rect(x + 1, y + 1, w - 2, 12, hx('#2f6b3a'));
  S.rect(x + 1, y + 1, w - 2, 1, hx('#4b9a4e'));
  stencil(S, x + 7, y + 6, ENTRANCE, hx('#163a1e'));
  stencil(S, x + 7, y + 5, ENTRANCE, WHITE);
  // The strip under it, on white plastic: what everybody reads too late.
  const sw = stencilWidth(ENTRANCE_SMALL) + 8;
  const sx = cx - Math.floor(sw / 2);
  S.rect(sx - 1, y + 14, sw + 2, 9, K);
  S.rect(sx, y + 14, sw, 7, hx('#e2dccc'));
  S.rect(sx, y + 20, sw, 1, hx('#8a8878'));
  stencil(S, sx + 4, y + 15, ENTRANCE_SMALL, hx('#2f6b3a'));
}
