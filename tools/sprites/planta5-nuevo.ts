// M14c (a6e): plant 5 enemies (Atención al Cliente) redrawn in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo»), with the painting tools of src/art/pintor.ts
// and the same legs and gloves as plant 1 (tools/sprites/planta1-nuevo.ts). The old makers stay
// in clientela.ts as history. The frames and their order are the ones each enemy's `anim` names
// in src/data/enemies.ts; no floor shadow is baked in. One colour per enemy that comes off the
// petrol-blue linoleum: the dispenser's wine red (`granate`), the posts' chrome with the blue belt.

import { Canvas, hx } from '../../src/art/canvas.ts';
import { INK, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove, legs } from './planta1-nuevo.ts';
import { box34 } from './planta3-nuevo.ts';
import { narrowPoseCycle, poseCycle, type Pose } from './pose.ts';

/** The LED digits: red-orange, white-hot when it calls a turn. Raw colours (light, not paint). */
const LED = hx('#ff6a3c');
const LED_HOT = hx('#ffe6a8');

/** 3 × 5 LED digits: only the ones its display ever shows. */
const DIGITS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '8': ['###', '#.#', '###', '#.#', '###'],
  '7': ['###', '..#', '..#', '.#.', '.#.'],
};

function digits(p: Paint, x: number, y: number, s: string, hot: boolean): void {
  for (const [k, ch] of [...s].entries()) {
    const g = DIGITS[ch]!;
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j]![i] === '#') p.raw(x + k * 4 + i, y + j, hot ? LED_HOT : LED);
    // The unlit segments glow faintly behind the lit ones.
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j]![i] !== '#' && (i + j) % 2 === 0) p.px(x + k * 4 + i, y + j, 'granate', 5);
  }
}

/** A round disc of a foot seen a little from above: lit rim on top, dark underside. */
function footDisc(p: Paint, cx: number, cy: number, rx: number, m: Material): void {
  p.ellipsoid(cx, cy, rx, 2.2, m, { dither: 0 });
  p.rect(Math.round(cx - rx) + 1, Math.round(cy + 2), Math.round(rx * 2) - 1, 1, m, 5);
}

/** A vertical chrome post, `x` its left column: lit left, dark right, one glint. */
function post(p: Paint, x: number, y: number, h: number): void {
  p.rect(x, y, 1, h, 'acero', 0);
  p.rect(x + 1, y, 1, h, 'acero', 2);
  p.rect(x + 2, y, 1, h, 'acero', 4);
  p.raw(x, y + 2, SHINE);
}

// ---------------------------------------------------------------------------------------------
// The Dispensador de Turnos: the «take a number» machine on its chrome stand. A wine-red enamel
// box for a head (browner than the bullets' red), the LED display on its forehead stuck at «087»
// since the opening day, the eyes of a clerk who has called every number in the world, and the
// ticket slot for a mouth with the paper roll hanging out of it like a tongue. On top, the
// «Respete su turno» card on its wire, crooked; on its side, the little window with the roll
// inside. A cast-iron foot on two short legs and black office shoes.

export const DISP_W = 38;
export const DISP_H = 48;
export const DISP_FEET = { x: 20, y: 46 } as const;
export const DISP_LEGS2 = [15, 20] as const;
/** Its ticket slot, px above its feet (muzzleY): the tickets come out of its mouth. */
export const DISP_MOUTH_Y = 16;

/** The paper tongue: `len` px out of the slot, its torn zigzag end; curled and ripped when spat. */
function tongue(p: Paint, x: number, y: number, len: number, spat: boolean): void {
  p.rect(x, y, 6, len, 'crema', 1);
  p.rect(x, y, 1, len, 'crema', 0);
  p.rect(x + 5, y, 1, len, 'crema', 3);
  p.rect(x + 1, y, 4, 1, 'crema', 4);
  // The red number printed on it, and the perforation line of the next ticket.
  p.rect(x + 1, y + 2, 3, 1, 'granate', 2);
  for (let i = 0; i < 6; i += 2) p.px(x + i, y + 5, 'crema', 3);
  const end = y + len - 1;
  for (const i of [0, 2, 4]) p.erase(x + i, end);
  if (spat) {
    // The end curls forward and a strip has torn off.
    p.rect(x + 6, end - 3, 2, 2, 'crema', 1);
    p.px(x + 7, end - 3, 'crema', 3);
  }
}

/** The «Respete su turno» card on a wire, a little crooked: white, red border, two lines of writing. */
function sign(p: Paint, x: number, y: number): void {
  p.rect(x + 6, y + 6, 1, 3, 'acero', 4);
  p.rect(x, y + 1, 13, 5, 'granate', 2);
  p.rect(x + 1, y, 12, 1, 'granate', 2);
  p.rect(x + 1, y + 2, 11, 3, 'crema', 0);
  p.rect(x + 2, y + 1, 10, 1, 'crema', 0);
  p.rect(x + 1, y + 4, 11, 1, 'crema', 2);
  for (const [dx, dy, w] of [[2, 2, 4], [7, 2, 3], [3, 3, 2], [6, 3, 4]] as const) p.rect(x + dx, y + dy, w, 1, 'granate', 3);
}

/**
 * The dispenser. `mood`: 0 waiting (bored, heavy lids), 1 calling a turn (the display white-hot,
 * brows up, hands up, a ticket half out), 2 «turno perdido» (furious, the tongue spat out long and
 * torn, tickets flying off).
 */
export function makeDispensadorNuevo(pose: Pose = { xb: DISP_LEGS2[0], xf: DISP_LEGS2[1], bob: 0 }, mood: 0 | 1 | 2 = 0): Canvas {
  const p = new Paint(DISP_W, DISP_H);
  const F = DISP_FEET;
  legs(p, pose, 40 + pose.bob, F.y, 'goma');
  const b = new Paint(DISP_W, DISP_H);
  footDisc(b, 20.5, 38.5, 9, 'goma');
  post(b, 19, 31, 7);
  // The head: an enamel box in three quarters, its front looking at you.
  const y0 = 12;
  const fh = 20;
  const { fx } = box34(b, 6, y0, 23, fh, 4, 'granate');
  // The side window with the paper roll inside, and a scratch down to the metal.
  b.ellipsoid(7.8, 20, 1.3, 2.4, 'crema', { dither: 0 });
  b.px(8, 25, 'acero', 3);
  b.px(7, 26, 'acero', 4);
  // The display: «087», never anything else.
  b.rect(fx + 3, y0 + 2, 17, 8, 'pantalla', 5);
  b.rect(fx + 3, y0 + 2, 17, 1, 'granate', 4);
  digits(b, fx + 6, y0 + 3, '087', mood === 1);
  if (mood === 1) for (const [x, y] of [[fx + 2, y0 + 1], [fx + 20, y0 + 1], [fx + 2, y0 + 10], [fx + 20, y0 + 10]] as const) b.px(x, y, 'amarillo', 0);
  // Eyes under the display: whites, big pupils; heavy lids when bored, red when furious.
  const ey = y0 + 11;
  for (const ex of [fx + 5, fx + 14]) {
    b.rect(ex, ey, 4, 4, 'granate', 5);
    b.rect(ex, ey + 1, 4, 3, mood === 2 ? 'rojo' : 'crema', mood === 2 ? 1 : 0);
    const px = ex + (ex === fx + 5 ? 2 : 1);
    b.raw(px, ey + 2, INK);
    b.raw(px, ey + 3, INK);
    b.raw(px - (ex === fx + 5 ? 1 : -1), ey + 3, INK);
    if (mood === 0) b.rect(ex, ey, 4, 2, 'granate', 3);
    if (mood === 2) b.rect(ex, ey, 4, 1, 'granate', 3);
  }
  // Brows: flat when bored, up when it calls, down to the middle when it is furious.
  for (const [ex, side] of [[fx + 5, -1], [fx + 14, 1]] as const) {
    for (let i = 0; i < 4; i++) {
      const inner = side < 0 ? i : 3 - i;
      const dy = mood === 1 ? -2 : mood === 2 ? (inner === 3 ? 1 : inner === 2 ? 0 : -1) : -1;
      b.raw(ex + i, ey - 1 + dy, INK);
    }
  }
  // The ticket slot (its mouth), and the paper tongue hanging out of it over the stand.
  const my = F.y - DISP_MOUTH_Y - 1;
  b.rect(fx + 5, my - 1, 13, 2, 'granate', 6);
  b.rect(fx + 5, my + 1, 13, 1, 'granate', 1);
  tongue(b, fx + 8, my + 1, mood === 2 ? 13 : mood === 1 ? 10 : 7, mood === 2);
  // On top, the card, crooked; on the front, a chip of enamel and the glue of an old sticker.
  sign(b, fx + 5, 0);
  b.px(fx + 21, y0 + 1, 'acero', 2);
  b.px(fx + 22, y0 + 2, 'acero', 3);
  for (const [x, y] of [[fx + 1, y0 + 16], [fx + 2, y0 + 16], [fx + 1, y0 + 17]] as const) b.px(x, y, 'granate', 1);
  // Hands: its own red, at its sides; up when it calls.
  const hy = mood === 1 ? 14 : 21;
  glove(b, 1, hy + 1, 'granate');
  glove(b, 33, hy, 'granate');
  p.stamp(b, 0, pose.bob);
  if (mood === 2) {
    // Two tickets flying off to the right.
    for (const [x, y] of [[31, 32], [33, 36]] as const) {
      p.rect(x, y, 3, 2, 'crema', 1);
      p.px(x, y, 'crema', 0);
    }
  }
  return p.outline();
}

/** Its sheet: 0-1 standing, 2-5 walking, 6 calling a turn, 7 «turno perdido». */
export function makeDispensadorNuevoFrames(): Canvas[] {
  return [...poseCycle(DISP_LEGS2[0], DISP_LEGS2[1]).map((f) => makeDispensadorNuevo(f.pose)), makeDispensadorNuevo(undefined, 1), makeDispensadorNuevo(undefined, 2)];
}

// ---------------------------------------------------------------------------------------------
// The Postes de Cola: two chrome queue stanchions with a retractable belt between them. The head
// is the belt cassette, a chrome drum shaded as a cylinder with its lid catching the light, the
// eyes of a doorman who has seen you try to slip through, the blue belt showing through its slot
// and its clip sticking out in front. Under it, the post, the weighted foot and two short legs.
// The other post of the pair has its foot chipped down to the rust.

export const POST_W = 28;
export const POST_H = 42;
export const POST_FEET = { x: 14, y: 40 } as const;
export const POST_LEGS2 = [9, 14] as const;
/** Where the belt comes out of the drum, px above its feet: the game draws the belt there (muzzleY - 3). */
export const POST_BELT_Y = 24;

/**
 * A post. `mood`: 0 standing guard (lids, flat brows), 1 shooting (furious brows, the lid of the
 * drum flashing), 2 the belt let go (the clip gone with motion lines, the eyes wide, the mouth an
 * O). `chipped`: the other of the pair.
 */
export function makePosteNuevo(pose: Pose = { xb: POST_LEGS2[0], xf: POST_LEGS2[1], bob: 0 }, mood: 0 | 1 | 2 = 0, chipped = false): Canvas {
  const p = new Paint(POST_W, POST_H);
  const F = POST_FEET;
  legs(p, pose, 34 + pose.bob, F.y, 'goma');
  const b = new Paint(POST_W, POST_H);
  footDisc(b, 14.5, 32.5, 8, 'acero');
  b.rect(8, 34, 13, 1, 'goma', 3);
  if (chipped) for (const [x, y] of [[8, 32], [9, 33], [17, 31], [19, 33], [12, 34], [13, 34]] as const) b.px(x, y, 'oxido', (x + y) % 2 === 0 ? 1 : 2);
  post(b, 13, 19, 12);
  // The drum: a vertical chrome cylinder, x 5..22, with its lid on top.
  const cx = 13.5;
  const rx = 9;
  b.heightShade(4, 6, 20, 14, (x, y) => {
    const u = (x + 0.5 - cx) / rx;
    return Math.abs(u) > 1 || y < 6 || y > 19 ? null : Math.sqrt(1 - u * u) * rx;
  }, 'acero', { dither: 0, spec: true });
  b.ellipsoid(cx, 6, rx, 2.6, 'acero', { dither: 0 });
  b.rect(6, 8, 16, 1, 'acero', 3);
  b.rect(5, 19, 18, 1, 'acero', 5);
  // The belt slot: a dark band with the blue webbing wound inside, round the drum.
  const sy = F.y - POST_BELT_Y;
  b.rect(5, sy - 1, 18, 1, 'acero', 5);
  b.rect(5, sy, 18, 2, 'azul', 3);
  b.rect(6, sy, 15, 1, 'azul', 2);
  b.px(5, sy + 1, 'azul', 5);
  b.px(22, sy + 1, 'azul', 5);
  // The clip on the end of the belt, sticking out in front (to the right).
  if (mood !== 2) {
    b.rect(23, sy - 1, 3, 4, 'azul', 2);
    b.px(23, sy - 1, 'azul', 1);
    b.rect(24, sy, 2, 2, 'acero', 1);
    b.px(25, sy + 1, 'acero', 3);
  } else {
    // Snapped back into the drum: motion lines where it was.
    for (const [x, y] of [[24, sy - 2], [25, sy - 2], [24, sy + 3], [25, sy + 3]] as const) p.px(x, y, 'acero', 1);
  }
  // Eyes: narrow and suspicious; furious when it shoots; wide when it lets go.
  const ey = 10;
  for (const ex of [8, 15]) {
    b.rect(ex, ey, 4, 3, 'acero', 5);
    if (mood === 1) {
      b.rect(ex, ey + 1, 4, 1, 'rojo', 1);
      b.raw(ex + (ex === 8 ? 2 : 1), ey + 1, INK);
    } else {
      b.rect(ex, ey + (mood === 2 ? 0 : 1), 3, mood === 2 ? 3 : 2, 'crema', 0);
      b.raw(ex + 1, ey + 1, INK);
      if (mood === 0) b.rect(ex, ey, 4, 1, 'acero', 3);
    }
  }
  for (const [ex, side] of [[8, -1], [15, 1]] as const) {
    for (let i = 0; i < 4; i++) {
      const inner = side < 0 ? i : 3 - i;
      const dy = mood === 1 ? (inner >= 2 ? 1 : -1) : mood === 2 ? -2 : 0;
      b.raw(ex + i, ey - 1 + dy, INK);
    }
  }
  // The mouth: a flat line with one corner down; an O when the belt snaps back.
  if (mood === 2) {
    b.rect(12, 14, 3, 2, 'acero', 6);
  } else {
    b.rect(11, 15, 5, 1, 'acero', 6);
    b.px(16, 16, 'acero', 6);
  }
  if (mood === 1) for (const x of [8, 13, 18]) b.raw(x, 5, SHINE);
  // Wear: a fingerprint smear on the drum and a dent in the lid.
  b.px(19, 13, 'acero', 3);
  b.px(20, 14, 'acero', 3);
  b.px(10, 5, 'acero', 3);
  // Hands: chrome, either side of the drum; the back one up when it shoots (the front one would hide the clip).
  glove(b, 0, 18 - (mood === 1 ? 5 : 0), 'acero');
  glove(b, 23, 20, 'acero');
  p.stamp(b, 0, pose.bob);
  return p.outline();
}

/** One post's frames: 0-1 standing, 2-5 walking, 6 firing, 7 the belt let go. */
export function makePosteNuevoFrames(chipped = false): Canvas[] {
  return [...narrowPoseCycle(POST_LEGS2[0], POST_LEGS2[1]).map((f) => makePosteNuevo(f.pose, 0, chipped)), makePosteNuevo(undefined, 1, chipped), makePosteNuevo(undefined, 2, chipped)];
}

export const BELT_W = 24;
export const BELT_H = 6;

/**
 * The belt between the two posts, one piece to repeat along it: blue webbing (`azul`, the same as
 * in the drum's slot) with «HAGA COLA AQUÍ» printed backwards in white (the side facing you is the
 * back). Frame 0 slack, 1 pulling in (stretched: paler, the letters drawn out). Opaque, to tile.
 */
export function makeBeltNuevo(): Canvas[] {
  return [false, true].map((taut) => {
    const p = new Paint(BELT_W, BELT_H);
    p.rect(0, 0, BELT_W, 1, 'azul', 6);
    p.rect(0, 1, BELT_W, 1, 'azul', taut ? 0 : 1);
    p.rect(0, 2, BELT_W, 2, 'azul', taut ? 1 : 3);
    p.rect(0, 4, BELT_W, 1, 'azul', taut ? 3 : 4);
    p.rect(0, 5, BELT_W, 1, 'azul', 6);
    // The weave: a darker thread every few px.
    for (let x = 1; x < BELT_W; x += 6) p.px(x, 4, 'azul', 5);
    const text = taut ? '##.#.##..#.##.#.##..' : '#.##.#..##.#..#.##.#';
    for (let i = 0; i < text.length; i++) if (text[i] === '#') p.rect(2 + i, 2, 1, 2, taut ? 'azul' : 'acero', taut ? 4 : 0);
    return p.cv;
  });
}
