// Floor 3 (Juguetería) tile set: the toy department, one floor above Informática. Interlocking
// EVA foam mats in faded primary colours (some missing, showing the concrete), a toy road rug
// across the aisles, tall shelves of boxed toys with plastic windows and prices crossed out again
// and again, cloud wallpaper peeling off the back wall, a bunting garland instead of a cable tray.
// Dominant colour: warm (faded reds and mustards). Used by the room painter (src/art/room.ts)
// when it paints a room of level 3; drawn with the room's seeded RNG.
//
// Same rule as the floors below: floor decoration stays low-contrast and about as dark as theirs,
// so it never competes with the bullets (red and cyan with a white core, the player's orange).
import { Rng } from '../sim/rng.ts';
import { Canvas, hx, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';
import { T, shade, stencil, stencilWidth, type RoomStyle } from './warehouse.ts';

/** Faded EVA foam colours: red, mustard, blue, green, pink. Weighted so the floor reads warm. */
export const EVA: ReadonlyArray<{ c: RGBA; w: number }> = [
  { c: hx('#5f4142'), w: 30 },
  { c: hx('#574d36'), w: 26 },
  { c: hx('#3a4659'), w: 17 },
  { c: hx('#3f4b3e'), w: 14 },
  { c: hx('#5a4352'), w: 13 },
];

export const C = {
  concrete: hx('#3d3c40'),
  wall: hx('#291d2b'),
  seam: hx('#1e1520'),
  paint: [236, 156, 186, 110] as RGBA,
  dash: hx('#7d4a64'),
  frame: hx('#8a6a8c'),
  frameDark: hx('#523e56'),
  /** Warm, slightly pink shop light. */
  light: [255, 214, 196] as const,
  sky: hx('#2f3a58'),
  cloud: hx('#46506e'),
  cloudHi: hx('#58627f'),
  plaster: hx('#4c4238'),
};

/** The colour of a mat, different from the mats to its left and above (passed in). */
export function pickMat(rng: Rng, avoid: ReadonlyArray<RGBA | undefined>): RGBA {
  for (let i = 0; i < 8; i++) {
    let v = rng.next() * 100;
    let pick = EVA[0]!.c;
    for (const e of EVA) {
      if (v < e.w) {
        pick = e.c;
        break;
      }
      v -= e.w;
    }
    if (!avoid.includes(pick)) return pick;
  }
  return EVA.find((e) => !avoid.includes(e.c))!.c;
}

export type MatVariant = 'plain' | 'missing' | 'letter' | 'chewed' | 'faded' | 'sticker';

/** Picks the variation of a mat. Missing mats are rare (and commoner in the forgotten rooms). */
export function pickMatVariant(rng: Rng, style: RoomStyle): MatVariant {
  const v = rng.next();
  const old = style === 'secret' ? 2 : 1;
  if (v < 0.025 * old) return 'missing';
  if (v < 0.07 * old) return 'chewed';
  if (v < 0.11) return 'faded';
  if (v < 0.16) return 'letter';
  if (v < 0.18) return 'sticker';
  return 'plain';
}

/** A foam mat: foam texture (soft speckle), the seam on its top and left edges. */
export function mat(S: Canvas, rng: Rng, x: number, y: number, base: RGBA): void {
  S.rect(x, y, T, T, base);
  for (let i = 0; i < 14; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, T - 2), shade(base, rng.chance(0.5) ? 6 : -6));
  // Edge of the foam: a lighter lip on the top, the seam (a dark groove) on the top and left.
  S.rect(x + 1, y + 1, T - 2, 1, shade(base, 9));
  S.rect(x, y, T, 1, shade(base, -24));
  S.rect(x, y, 1, T, shade(base, -24));
}

/** Concrete where a mat is missing: grey, dusty, with the glue marks of the mat that was there. */
export function missingMat(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x, y, T, T, C.concrete);
  S.rect(x, y, T, 2, shade(C.concrete, -14));
  S.rect(x, y, 2, T, shade(C.concrete, -14));
  for (let i = 0; i < 26; i++) S.set(x + rng.int(2, T - 2), y + rng.int(2, T - 2), shade(C.concrete, rng.chance(0.5) ? 8 : -8));
  // Old glue: a few yellowish blobs where the mat was stuck down.
  for (let k = 0; k < 5; k++) {
    const gx = x + rng.int(4, T - 7);
    const gy = y + rng.int(4, T - 6);
    S.rect(gx, gy, rng.int(2, 3), 2, [150, 132, 70, 70]);
    S.set(gx + 1, gy + 2, [150, 132, 70, 50]);
  }
}

/**
 * The jigsaw tab between two mats: a knob of `from`'s colour pushed into the next mat, with the
 * groove around it. (x, y) is the point on the shared edge; dx/dy the direction it pushes in.
 */
export function matTab(S: Canvas, x: number, y: number, dx: number, dy: number, from: RGBA): void {
  // Shape in (u along the edge, v into the neighbour): a 2-px neck and a 4×3 head.
  const shape: Array<[number, number]> = [];
  for (let u = -1; u <= 0; u++) shape.push([u, 0]);
  for (let u = -2; u <= 1; u++) for (let v = 1; v <= 3; v++) if (!((u === -2 || u === 1) && v === 3)) shape.push([u, v]);
  const at = (u: number, v: number): [number, number] => (dx !== 0 ? [x + v * dx, y + u] : [x + u, y + v * dy]);
  const inShape = (u: number, v: number): boolean => shape.some(([a, b]) => a === u && b === v);
  for (const [u, v] of shape) {
    const [px, py] = at(u, v);
    S.put(px, py, v === 1 && u === -2 ? shade(from, 7) : from);
  }
  // Groove around the knob (inside the neighbour only).
  const groove = shade(from, -26);
  for (const [u, v] of shape) {
    for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nu = u + du;
      const nv = v + dv;
      if (nv < 0 || inShape(nu, nv)) continue;
      const [px, py] = at(nu, nv);
      S.put(px, py, nv === 0 ? groove : shade(S.get(px, py), -22));
    }
  }
}

/** A tiny 3×5 font scaled ×2, for the letters cut out of the alphabet mats. */
function bigLetter(S: Canvas, x: number, y: number, ch: string, c: RGBA): void {
  const tmp = new Canvas(8, 9);
  stencil(tmp, 0, 2, ch, [255, 255, 255, 255]);
  for (let j = 0; j < tmp.h; j++) {
    for (let i = 0; i < tmp.w; i++) {
      if (tmp.get(i, j)[3] === 0) continue;
      S.rect(x + i * 2, y + j * 2, 2, 2, c);
    }
  }
}

export function paintMat(S: Canvas, rng: Rng, x: number, y: number, base: RGBA, v: MatVariant): void {
  switch (v) {
    case 'letter': {
      // Alphabet mat: the letter is a cut-out piece, a bit darker, with its seam.
      const ch = rng.pick([...'ABCDEFGHIJKLMNOPRSTUVZ0123456789']);
      const w = stencilWidth(ch) * 2;
      const lx = x + Math.floor((T - w) / 2);
      const ly = y + 4;
      bigLetter(S, lx + 1, ly + 1, ch, shade(base, -24));
      bigLetter(S, lx, ly, ch, shade(base, -9));
      break;
    }
    case 'chewed': {
      // Somebody small tested it with their teeth: a bite out of one corner.
      const cx = rng.chance(0.5) ? x + T - 1 : x + 1;
      const cy = rng.chance(0.5) ? y + T - 1 : y + 1;
      const r = rng.int(3, 5);
      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          const px = cx + i;
          const py = cy + j;
          if (px <= x || py <= y || px >= x + T || py >= y + T) continue;
          const d = i * i + j * j;
          if (d <= r * r - ((i + j) & 1 ? 2 : 0)) S.put(px, py, d >= (r - 1) * (r - 1) ? shade(C.concrete, -12) : C.concrete);
        }
      }
      break;
    }
    case 'faded': {
      // Sun-bleached by the shop window, and the foam gone shiny where people stand.
      for (let j = 2; j < T - 1; j++) for (let i = 2; i < T - 1; i++) S.put(x + i, y + j, shade(S.get(x + i, y + j), 7));
      for (let k = 0; k < 3; k++) S.rect(x + rng.int(3, 10), y + rng.int(4, T - 5), rng.int(4, 9), 1, shade(base, 14));
      break;
    }
    case 'sticker': {
      // A reward star sticker («¡Muy bien!»), half peeled off.
      const sx = x + rng.int(5, T - 11);
      const sy = y + rng.int(5, T - 11);
      const gold: RGBA = [214, 176, 76, 120];
      for (const [i, j] of [
        [3, 0], [2, 1], [3, 1], [4, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [1, 5], [2, 5], [4, 5], [5, 5]
      ] as const) {
        S.set(sx + i, sy + j, gold);
      }
      S.set(sx + 5, sy + 5, [240, 232, 210, 110]);
      break;
    }
    default:
  }
}

// ---------------------------------------------------------------------------------------------
// Things on the floor.

const CRAYONS = ['#c4473f', '#3f74bd', '#4b9a4e', '#d9a52a', '#8a4fa8'];

/** A crayon scribble: a waxy zigzag somebody left on the mats. */
export function crayonScribble(S: Canvas, rng: Rng, cx: number, cy: number): void {
  const c = hx(rng.pick(CRAYONS));
  const col: RGBA = [c[0], c[1], c[2], 78];
  let x = cx - rng.int(6, 10);
  let y = cy;
  const n = rng.int(14, 24);
  let up = rng.chance(0.5);
  for (let i = 0; i < n; i++) {
    S.set(x, y, col);
    S.set(x, y + 1, col);
    x += 1;
    y += up ? -1 : 1;
    if (rng.chance(0.3) || Math.abs(y - cy) > 4) up = !up;
  }
}

/** Glitter: it never comes off. Pastel specks scattered in a patch. */
export function glitter(S: Canvas, rng: Rng, cx: number, cy: number, r: number): void {
  const cols: RGBA[] = [[246, 196, 220, 0], [190, 220, 246, 0], [246, 232, 160, 0], [210, 246, 210, 0]];
  for (let k = 0; k < r * 2; k++) {
    const a = rng.next() * Math.PI * 2;
    const d = Math.sqrt(rng.next()) * r;
    const c = rng.pick(cols);
    S.set(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.6), [c[0], c[1], c[2], rng.int(50, 95)]);
  }
}

/**
 * A loose building brick (you step on it once), flat and faded into the mat: half the size of the
 * pieces a Cubo de Piezas throws and without their outline and shadow, so it never passes for one.
 */
export function brick(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = hx(rng.pick(['#9a3a36', '#3f66a6', '#c2a23a', '#3f7a42', '#d3d8e4']));
  const a: RGBA = [c[0], c[1], c[2], 120];
  S.rect(x, y, 4, 3, a);
  S.set(x + 1, y, shade(a, 30));
  S.set(x + 3, y, shade(a, 30));
  S.rect(x, y + 2, 4, 1, shade(a, -40));
}

/** A marble that rolled under everything. */
export function marble(S: Canvas, rng: Rng, x: number, y: number): void {
  const c = hx(rng.pick(['#5f93d4', '#58b45a', '#e88fa4', '#69dbd8']));
  S.rect(x, y, 2, 2, [c[0], c[1], c[2], 170]);
  S.set(x, y, [255, 255, 255, 150]);
}

/** The toy road rug across the room: tarmac grey, kerbs, a dashed centre line, a zebra crossing. */
export function roadRug(S: Canvas, rng: Rng, x: number, y: number, len: number, vertical: boolean): void {
  const W = 14;
  const road: RGBA = [44, 44, 52, 150];
  const kerb: RGBA = [150, 150, 160, 90];
  const line: RGBA = [226, 214, 170, 95];
  const zebra = rng.int(30, Math.max(31, len - 40));
  for (let i = 0; i < len; i++) {
    for (let k = 0; k < W; k++) {
      let c = k === 0 || k === W - 1 ? kerb : road;
      if ((k === 6 || k === 7) && Math.floor(i / 5) % 2 === 0) c = line;
      if (i >= zebra && i < zebra + 9 && k > 1 && k < W - 2 && (k >> 1) % 2 === 0) c = line;
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
}

/** Confetti for the shop window of the boss: paper bits of every colour, more at the back. */
export function confetti(S: Canvas, rng: Rng, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.round(((x1 - x0) * (y1 - y0)) / 140);
  const cols = ['#e88fa4', '#f6c431', '#5f93d4', '#58b45a', '#f4f1e8', '#d9782a'];
  for (let i = 0; i < n; i++) {
    const x = rng.int(x0, x1 - 2);
    const y = y0 + Math.floor((y1 - y0) * rng.next() ** 1.4);
    const c = hx(rng.pick(cols));
    const a: RGBA = [c[0], c[1], c[2], rng.int(55, 100)];
    if (rng.chance(0.5)) S.rect(x, y, 2, 1, a);
    else S.rect(x, y, 1, 2, a);
  }
}

// ---------------------------------------------------------------------------------------------
// Walls and ceiling.

/** Colours of the boxed toys: faded box art. */
const TOYBOX = ['#c2504a', '#3f74bd', '#e0b23c', '#4b9a4e', '#e88fa4', '#8a4fa8', '#5cc2c0', '#d9782a'];

/** One boxed toy seen from the front: the box, its plastic window (with the toy inside), maybe a price crossed out. */
export function toyBox(S: Canvas, rng: Rng, x: number, plankY: number, w: number, h: number): void {
  const y = plankY - h;
  const col = hx(rng.pick(TOYBOX));
  S.rect(x, y, w, h, col);
  S.rect(x, y, w, 1, shade(col, 35));
  S.rect(x + w - 1, y, 1, h, shade(col, -45));
  if (w >= 6 && h >= 6) {
    // The window: dark plastic with a glint, and the toy's head in it.
    const ww = w - 3;
    const wh = h - 4;
    S.rect(x + 1, y + 2, ww, wh, hx('#1e2230'));
    S.set(x + 1, y + 2, [255, 255, 255, 150]);
    const tc = hx(rng.pick(['#f2cf8c', '#d3d8e4', '#e88fa4', '#a9cbf2']));
    const hx0 = x + 1 + Math.floor(ww / 2) - 1;
    S.rect(hx0, y + 3, 2, Math.min(3, wh - 1), tc);
  }
  if (rng.chance(0.4) && w >= 5) {
    // Price sticker, crossed out (and the new one, crossed out too).
    const px = x + rng.int(0, w - 4);
    const py = y + h - 3;
    S.rect(px, py, 4, 2, WHITE);
    S.rect(px, py + 1, 4, 1, hx('#e0453b'));
  }
}

/** The back wall shelf of floor 3: boxed toys, plank. */
export function toyShelf(S: Canvas, rng: Rng, w: number, plankY: number, hmax: number, hmin: number): void {
  let x = 26;
  while (x < w - 28) {
    const bw = rng.int(7, 14);
    const bh = rng.int(hmin, hmax);
    if (rng.chance(0.85)) toyBox(S, rng, x, plankY, bw, bh);
    x += bw + rng.int(1, 3);
  }
  S.rect(0, plankY, w, 2, hx('#5a4560'));
  S.rect(0, plankY, w, 1, hx('#755d7c'));
}

/** Cloud wallpaper over the back wall, peeling: dusty sky, soft clouds, strips curling off. */
export function cloudWallpaper(S: Canvas, rng: Rng, w: number, h: number): void {
  S.rect(0, 0, w, h, C.sky);
  for (let x = 0; x < w; x += 16) S.rect(x, 0, 1, h, shade(C.sky, -6));
  for (let i = 0; i < Math.round(w / 40); i++) {
    const cx = rng.int(4, w - 4);
    const cy = rng.int(10, h - 8);
    const n = rng.int(3, 4);
    for (let k = 0; k < n; k++) {
      const bx = cx + k * 5 - n * 2;
      const r = k === 0 || k === n - 1 ? 3 : 4;
      for (let j = -r; j <= 1; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) S.set(bx + i, cy + j, j < -1 ? C.cloudHi : C.cloud);
    }
  }
  // Peeling strips: the paper hangs off and the plaster shows; the curl catches the light.
  for (let i = 0; i < Math.max(2, Math.round(w / 150)); i++) {
    const px = rng.int(30, w - 40);
    const ph = rng.int(8, h - 6);
    S.rect(px, 0, 10, ph, C.plaster);
    for (let j = 0; j < ph; j += 3) S.set(px + rng.int(1, 8), j, shade(C.plaster, -10));
    S.rect(px + 10, 0, 1, ph, shade(C.sky, -20));
    // The curl at the bottom of the strip.
    S.rect(px, ph, 10, 2, C.cloudHi);
    S.rect(px + 1, ph + 2, 8, 1, shade(C.sky, -18));
  }
}

/** The bunting garland across the ceiling: a sagging string of faded triangle flags. */
export function bunting(S: Canvas, rng: Rng, w: number): void {
  const cols = ['#a84a4a', '#3f66a6', '#c2a23a', '#3f7a42', '#a85a80'];
  const span = 60;
  for (let x0 = 0; x0 < w; x0 += span) {
    const sag = 4;
    const yAt = (x: number): number => 3 + Math.round(Math.sin(((x - x0) / span) * Math.PI) * sag);
    for (let x = x0; x < Math.min(w, x0 + span); x++) S.set(x, yAt(x), hx('#2a2230'));
    for (let fx = x0 + 3; fx < Math.min(w - 5, x0 + span - 5); fx += 8) {
      if (rng.chance(0.12)) continue; // a flag fell off
      const c = hx(rng.pick(cols));
      const fy = yAt(fx) + 1;
      for (let j = 0; j < 3; j++) S.rect(fx + j, fy + j, 5 - j * 2, 1, j === 0 ? shade(c, 20) : c);
    }
  }
}

/** One tile of a free-standing toy shelf (interior wall), with outline on the open sides. */
export function toyShelfUnit(S: Canvas, rng: Rng, x: number, y: number, o: { front: boolean; up: boolean; left: boolean; right: boolean }): void {
  const TOP = hx('#5a4560');
  const TOP_HI = hx('#755d7c');
  const FRAME = hx('#2c2030');
  const topH = o.front ? 7 : T;
  S.rect(x, y, T, topH, TOP);
  for (let i = 0; i < 5; i++) S.set(x + rng.int(1, T - 2), y + rng.int(1, topH - 2), shade(TOP, rng.chance(0.5) ? 8 : -8));
  if (o.front) {
    const fy = y + topH;
    S.rect(x, fy, T, T - topH, FRAME);
    S.rect(x, fy, T, 1, K);
    for (const [plank, hmax] of [[fy + 8, 7], [fy + 16, 7]] as const) {
      let bx = x + 1;
      while (bx < x + T - 4) {
        const w = rng.int(5, 8);
        if (bx + w > x + T - 1) break;
        toyBox(S, rng, bx, plank, w, rng.int(5, hmax));
        bx += w + 1;
      }
      S.rect(x, plank, T, 1, TOP_HI);
    }
    S.rect(x, y + T - 1, T, 1, K);
  }
  if (o.left) S.rect(x, y, 1, T, K);
  if (o.right) S.rect(x + T - 1, y, 1, T, K);
  if (o.up) S.rect(x, y, T, 1, K);
  if (o.up) S.rect(x + (o.left ? 1 : 0), y + 1, T - (o.left ? 1 : 0) - (o.right ? 1 : 0), 1, TOP_HI);
}

/** A height chart on a side wall: «Si mides más que esto, ya no es tu planta». */
export function heightChart(S: Canvas, x: number, y0: number, y1: number, skip: (y: number) => boolean): void {
  const cols = [hx('#a84a4a'), hx('#c2a23a'), hx('#3f7a42'), hx('#3f66a6')];
  for (let y = y0; y < y1; y++) {
    if (skip(y)) continue;
    const c = cols[Math.floor((y - y0) / 24) % cols.length]!;
    S.rect(x, y, 4, 1, shade(c, -30));
    S.set(x, y, shade(c, -10));
    if (y % 4 === 0) S.rect(x + 1, y, y % 12 === 0 ? 3 : 2, 1, hx('#e9dcc0'));
  }
}

/** A child's drawing pinned to the wall: a sun and a little figure, in crayon. */
export function kidDrawing(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 12, 11, K);
  S.rect(x, y, 10, 9, hx('#e9e3d2'));
  S.rect(x, y, 10, 1, WHITE);
  S.rect(x + 1, y + 1, 2, 2, hx('#e0b23c'));
  S.set(x + 3, y + 1, hx('#e0b23c'));
  const c = hx(rng.pick(CRAYONS));
  S.rect(x + 6, y + 3, 2, 2, c);
  S.rect(x + 6, y + 5, 2, 2, c);
  S.set(x + 5, y + 7, c);
  S.set(x + 8, y + 7, c);
  S.rect(x, y + 8, 10, 1, hx('#4b9a4e'));
  S.set(x + 5, y - 1, hx('#e0453b'));
}

/** «Antes 59 · antes 49 · ahora 49»: a price board with every price crossed out. */
export function priceBoard(S: Canvas, rng: Rng, x: number, y: number): void {
  S.rect(x - 1, y - 1, 24, 13, K);
  S.rect(x, y, 22, 11, hx('#e9e3d2'));
  S.rect(x, y, 22, 1, WHITE);
  const a = rng.int(5, 9);
  const b = rng.int(1, a - 1);
  stencil(S, x + 2, y + 3, `${a}9`, hx('#3a3550'));
  S.rect(x + 1, y + 4, 9, 1, hx('#e0453b'));
  stencil(S, x + 12, y + 3, `${b}9`, hx('#3a3550'));
  S.rect(x + 11, y + 4, 9, 1, hx('#e0453b'));
  S.rect(x + 3, y + 8, 16, 1, hx('#c2a23a'));
}

/** The skirting along the inner edge of the walls: the straight border pieces of the foam mats. */
export function skirting(S: Canvas, x: number, y: number, w: number, h: number, vertical: boolean, flip = false): void {
  const len = vertical ? h : w;
  for (let i = 0; i < len; i++) {
    const base = EVA[Math.floor(i / 12) % EVA.length]!.c;
    for (let k = 0; k < 5; k++) {
      const kk = flip ? 4 - k : k;
      // Lit edge towards the room, the teeth of the border every 6 px on the wall side.
      let c = kk === 4 ? shade(base, -30) : kk === 0 ? shade(base, 14) : base;
      if (kk === 4 && i % 6 < 2) c = shade(base, -8);
      if (vertical) S.set(x + k, y + i, c);
      else S.set(x + i, y + k, c);
    }
  }
}
