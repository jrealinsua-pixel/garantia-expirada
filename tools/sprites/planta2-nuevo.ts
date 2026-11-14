// M14c (a5): the plant 2 enemies (Informática) redrawn in the new style (docs/ESTILO_ARTE.md,
// «M14c · El estilo nuevo»), with the painting tools of src/art/pintor.ts and the same legs and
// gloves as plant 1 (tools/sprites/planta1-nuevo.ts). The old makers stay in enemies.ts: the
// approved old sprites are kept as history. The frames and their order are the ones each enemy's
// `anim` names in src/data/enemies.ts; no floor shadow is baked in.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove, legs } from './planta1-nuevo.ts';
import { narrowPoseCycle, poseCycle, type Pose } from './pose.ts';

type RGBA = [number, number, number, number];
const raw = (m: Material, t: number): RGBA => [...MATERIALS[m][t]!] as RGBA;

/**
 * A box in three quarters, like the microwave: the front face (lit at its top-left corner, darker
 * towards the bottom), the top face going back and up to the left, and the left side in shade.
 * Returns the front face's top-left corner.
 */
function box34(p: Paint, x0: number, y0: number, fw: number, fh: number, depth: number, m: Material, tones = { top: [0, 1], side: [4, 3], front: [1, 2, 3] }): { fx: number; fy: number } {
  for (let j = 0; j < depth; j++) p.rect(x0 + j, y0 - depth + j, fw, 1, m, j === 0 ? tones.top[0]! : tones.top[1]!);
  for (let i = 0; i < depth; i++) {
    const back = depth - i;
    p.rect(x0 + i, y0 - back + 1, 1, fh - 1, m, i === 0 ? tones.side[0]! : tones.side[1]!);
    p.px(x0 + i, y0 - back + fh - 1, m, tones.side[0]! + 1);
  }
  const fx = x0 + depth;
  const [lit, mid, low] = tones.front as [number, number, number];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) p.px(fx + x, y0 + y, m, y < 2 ? lit : y > fh - 3 ? low : mid);
  p.rect(fx, y0, fw, 1, m, Math.max(0, lit - 1));
  p.rect(fx, y0, 1, fh, m, lit);
  return { fx, fy: y0 };
}

// ---------------------------------------------------------------------------------------------
// The Impresora que se Atasca: an office printer in computer beige with a stack of paper sticking
// up from the tray at its back and the output slot for a mouth, an invoice hanging out of it (it
// only prints invoices). Tired, resentful eyes, an LCD that says ERR, a post-it on its side that
// says NO, the price of the ink, and black office shoes. Jammed, it shakes, the invoice crumples in
// its rollers, its eyes squeeze shut and the light goes red.

export const IMPRESORA_W = 48;
export const IMPRESORA_H = 42;
export const IMPRESORA_FEET = { x: 24, y: 40 } as const;
export const IMPRESORA_LEGS2 = [17, 25] as const;
/** The output slot (its mouth), px above its feet: where the invoices come out (muzzleY). */
export const IMPRESORA_SLOT_Y = 14;

/** `jam`: shaken 1 px left (0) or right (1), the jam drawn; undefined, working. */
export function makeImpresoraNueva(pose: Pose = { xb: IMPRESORA_LEGS2[0], xf: IMPRESORA_LEGS2[1], bob: 0 }, jam?: 0 | 1): Canvas {
  const p = new Paint(IMPRESORA_W, IMPRESORA_H);
  const body = new Paint(IMPRESORA_W, IMPRESORA_H);
  const jx = jam === undefined ? 0 : jam === 0 ? -1 : 1;
  legs(p, pose, 34 + pose.bob, IMPRESORA_FEET.y, 'goma');
  // The body is painted apart (it shakes when jammed) and stamped over the legs.
  const b = body;
  glove(b, 2, 24, 'beige');
  // The paper stack in the input tray at the back, leaning back: three sheets, print on the front one.
  for (let i = 0; i < 9; i++) {
    const y = 2 + i;
    const x = 15 - Math.floor(i / 3);
    b.rect(x, y, 16, 1, 'acero', i === 0 ? 0 : 1);
    b.px(x, y, 'acero', 2);
    b.px(x + 15, y, 'acero', 3);
  }
  for (const y of [4, 6, 8]) b.rect(17 - Math.floor((y - 2) / 3), y, y === 8 ? 7 : 10, 1, 'acero', 3);
  b.rect(11, 9, 18, 1, 'beige', 5);
  // The box: wide and flat, a big top face.
  const x0 = 6;
  const y0 = 16;
  const fw = 32;
  const fh = 18;
  const { fx } = box34(b, x0, y0, fw, fh, 5, 'beige');
  // The feed slot along the top, where the tray goes in.
  b.rect(x0 + 8, y0 - 3, 18, 1, 'beige', 4);
  b.rect(x0 + 8, y0 - 2, 18, 1, 'beige', 2);
  // The output slot: its mouth, a dark letterbox across the front at the height it fires from.
  const my = IMPRESORA_FEET.y - IMPRESORA_SLOT_Y - 1;
  b.rect(fx + 3, my, fw - 8, 3, 'beige', 6);
  b.rect(fx + 3, my, fw - 8, 1, 'beige', 4);
  b.rect(fx + 3, my + 3, fw - 8, 1, 'beige', 0);
  // Eyes on the front: tired, with heavy lids; the back one smaller. Jammed: > <.
  const ey = y0 + 3;
  const exs = [fx + 6, fx + 13];
  if (jam === undefined) {
    for (const [k, ex] of exs.entries()) {
      const w = k === 0 ? 3 : 4;
      b.rect(ex, ey, w, 4, 'beige', 5);
      b.rect(ex + 1, ey + 1, w - 1, 2, 'acero', 1);
      b.raw(ex + w - 1, ey + 2, INK);
      b.raw(ex + w - 2, ey + 2, INK);
      b.rect(ex, ey, w, 2, 'beige', 4);
      b.raw(ex + w - 1, ey + 2, INK);
    }
    // Brows down to the middle: fed up with everyone.
    const [e0, e1] = exs as [number, number];
    const brows = [[e0 - 1, ey - 2], [e0, ey - 2], [e0 + 1, ey - 1], [e0 + 2, ey - 1], [e1, ey - 1], [e1 + 1, ey - 1], [e1 + 2, ey - 2], [e1 + 3, ey - 2], [e1 + 4, ey - 2]] as const;
    for (const [x, y] of brows) b.px(x, y, 'beige', 6);
  } else {
    for (const [x, y] of [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]] as const) {
      b.px(exs[0]! + x, ey + y - 1, 'beige', 6);
      b.px(exs[1]! + 3 - x, ey + y - 1, 'beige', 6);
    }
  }
  // The LCD in the right corner of the front: ERR, and the status light under it.
  const lx = fx + fw - 9;
  b.rect(lx, y0 + 3, 7, 4, 'verde', 5);
  b.rect(lx + 1, y0 + 4, 5, 2, 'verde', jam === undefined ? 2 : 1);
  for (const x of [lx + 1, lx + 3, lx + 5]) b.px(x, y0 + 4, 'verde', 5);
  b.px(lx + 2, y0 + 5, 'verde', 5);
  b.px(lx + 4, y0 + 5, 'verde', 5);
  b.ellipsoid(lx + 5.5, y0 + 9.5, 1.3, 1.3, jam === undefined ? 'amarillo' : 'rojo', { dither: 0, bias: 0.4 });
  // Buttons by the LCD.
  b.rect(lx, y0 + 9, 2, 1, 'beige', 4);
  // Side: the yellow post-it (NO) and a red price tag for the ink.
  b.rect(x0 - 1, y0 + 2, 4, 4, 'amarillo', 1);
  b.px(x0 - 1, y0 + 2, 'amarillo', 0);
  b.px(x0, y0 + 3, 'amarillo', 4);
  b.px(x0 + 1, y0 + 4, 'amarillo', 4);
  b.px(x0 + 2, y0 + 3, 'amarillo', 4);
  b.rect(x0 + 1, y0 + 9, 3, 2, 'rojo', 2);
  b.px(x0 + 2, y0 + 10, 'acero', 0);
  // The highlight on the top, wear by the slot.
  b.raw(x0 + 3, y0 - 4, SHINE);
  b.raw(x0 + 4, y0 - 4, SHINE);
  b.px(fx + fw - 3, y0 + fh - 4, 'oxido', 1);
  b.px(fx + 2, y0 + 1, 'oxido', 1);
  // The invoice coming out of the slot: white with a thick red border and the total in the corner;
  // jammed, crumpled in the rollers with red edges sticking out at odd angles.
  if (jam === undefined) {
    const ix = fx + 9;
    b.rect(ix, my + 1, 12, 8, 'rojo', 2);
    b.rect(ix + 1, my + 2, 10, 6, 'acero', 0);
    b.rect(ix + 2, my + 3, 6, 1, 'acero', 3);
    b.rect(ix + 2, my + 5, 4, 1, 'acero', 3);
    b.rect(ix + 7, my + 6, 3, 1, 'rojo', 3);
    b.rect(ix, my + 1, 12, 1, 'beige', 6);
  } else {
    for (let i = 0; i < 16; i++) {
      const x = fx + 7 + i;
      const y = my + 1 + ((i * 7) % 3);
      b.px(x, y, 'acero', i % 4 === 0 ? 2 : 0);
      b.px(x, y + 1, i % 3 === 0 ? 'rojo' : 'acero', i % 3 === 0 ? 2 : 3);
    }
    b.px(fx + 10, my + 4, 'acero', 0);
    b.px(fx + 18, my + 4, 'rojo', 2);
  }
  glove(b, 43, 25, 'beige');
  p.stamp(body, jx, pose.bob);
  const out = p.outline();
  // Jammed: a puff of grey from the slot, and a little spark.
  if (jam !== undefined) {
    for (const [x, y, a] of [[fx + 26, my - 1, 150], [fx + 27, my - 2, 110], [fx + 28, my - 4, 70]] as const) if (out.get(x + jx, y)[3] === 0) out.set(x + jx, y, [215, 210, 225, a]);
    if (out.get(fx + 2 + jx, my - 1)[3] === 0) out.set(fx + 2 + jx, my - 1, raw('cian', 1));
  }
  return out;
}

/** Its sheet: 0-1 humming, 2-5 shuffling, 6-7 jammed and shaking. */
export function makeImpresoraNuevaFrames(): Canvas[] {
  const cycle = poseCycle(...IMPRESORA_LEGS2);
  return [...cycle.map((f) => makeImpresoraNueva(f.pose)), makeImpresoraNueva(undefined, 0), makeImpresoraNueva(undefined, 1)];
}

// ---------------------------------------------------------------------------------------------
// The Cargador Falso: a white phone charger brick on short legs, its two metal prongs sticking up
// like horns and a toothy grin, a scorch mark where it overheats; its cable trails behind like a
// tail with a yellow GRATIS tag tied on, and it wears flip-flops. It lies in wait as a charger
// dropped on the floor.

export const CARGADOR_W = 32;
export const CARGADOR_H = 32;
export const CARGADOR_FEET = { x: 15, y: 30 } as const;
export const CARGADOR_LEGS2 = [10, 16] as const;
/** Its mouth, px above its feet (muzzleY). */
export const CARGADOR_MOUTH_Y = 10;

/** `mood`: 0 rest, 1 humming (a spark between the prongs), 2 found out (eyes wide, sparks). */
export function makeCargadorNuevo(pose: Pose = { xb: CARGADOR_LEGS2[0], xf: CARGADOR_LEGS2[1], bob: 0 }, mood: 0 | 1 | 2 = 0): Canvas {
  const p = new Paint(CARGADOR_W, CARGADOR_H);
  const d = pose.bob;
  // The cable tail out of its back, down to the floor, the GRATIS tag tied on.
  const cable: Array<[number, number]> = [[6, 20], [5, 21], [4, 22], [3, 23], [3, 24], [3, 25], [4, 26], [5, 27], [6, 28]];
  for (const [x, y] of cable) p.px(x, y + (y < 24 ? d : 0), 'goma', 3);
  p.rect(0, 25, 3, 3, 'amarillo', 1);
  p.px(0, 25, 'amarillo', 0);
  p.px(1, 26, 'amarillo', 4);
  p.px(2, 24, 'goma', 3);
  glove(p, 3, 15 + d, 'acero');
  legs(p, pose, 24 + d, CARGADOR_FEET.y, 'acero');
  // Flip-flop straps over the feet.
  for (const [x, leg] of [[pose.xb, -1], [pose.xf, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    p.px(x + 2, CARGADOR_FEET.y - 3 - up, 'azul', 3);
    p.px(x + 3, CARGADOR_FEET.y - 3 - up, 'azul', 2);
  }
  // The prongs: two brass horns on top.
  for (const x of [13, 19]) {
    p.rect(x, 3 + d, 2, 5, 'laton', 2);
    p.rect(x, 3 + d, 1, 5, 'laton', 1);
    p.px(x, 3 + d, 'laton', 0);
    p.px(x + 1, 7 + d, 'laton', 3);
  }
  const x0 = 7;
  const y0 = 10 + d;
  const fw = 16;
  const fh = 14;
  const { fx } = box34(p, x0, y0, fw, fh, 3, 'acero', { top: [0, 1], side: [3, 2], front: [1, 1, 2] });
  // The prongs' feet in the top face.
  for (const x of [13, 19]) p.rect(x, y0 - 2, 2, 1, 'acero', 4);
  // Eyes: narrowed and shifty; found out, wide open.
  const ey = y0 + 3;
  for (const ex of [fx + 3, fx + 9]) {
    if (mood === 2) {
      p.rect(ex, ey - 1, 4, 4, 'acero', 6);
      p.rect(ex + 1, ey, 2, 2, 'acero', 0);
      p.raw(ex + 2, ey + 1, INK);
    } else {
      // Looking sideways at you: the white on the left, the pupil in the corner, a heavy lid.
      p.rect(ex - 1, ey - 1, 6, 4, 'acero', 5);
      p.rect(ex, ey, 4, 2, 'acero', 6);
      p.rect(ex, ey + 1, 2, 1, 'acero', 0);
      p.raw(ex + 2, ey + 1, INK);
      p.raw(ex + 3, ey + 1, INK);
      p.raw(ex + 3, ey, SHINE);
      p.rect(ex - 1, ey - 1, 6, 1, 'acero', 4);
    }
  }
  const brows = [[fx + 2, ey - 3], [fx + 3, ey - 3], [fx + 4, ey - 2], [fx + 5, ey - 2], [fx + 9, ey - 2], [fx + 10, ey - 2], [fx + 11, ey - 3], [fx + 12, ey - 3], [fx + 13, ey - 3]] as const;
  if (mood !== 2) for (const [x, y] of brows) p.px(x, y, 'acero', 6);
  // The toothy grin, at the height it spits from.
  const my = CARGADOR_FEET.y - CARGADOR_MOUTH_Y - 1 + d;
  p.rect(fx + 3, my, 10, 3, 'acero', 6);
  for (const x of [fx + 4, fx + 6, fx + 8, fx + 10]) p.rect(x, my, 1, 2, 'acero', 0);
  p.px(fx + 13, my - 1, 'acero', 6);
  p.px(fx + 2, my, 'acero', 5);
  // The scorch mark (it overheats), and the CE mark that isn't quite.
  for (const [x, y, t] of [[fx + 12, y0 + 1, 1], [fx + 13, y0 + 1, 2], [fx + 13, y0 + 2, 1], [fx + 14, y0 + 2, 3], [fx + 12, y0 + 2, 0]] as const) p.px(x, y, 'quemada', t);
  p.px(fx + 12, y0 + fh - 3, 'acero', 4);
  p.px(fx + 13, y0 + fh - 3, 'acero', 4);
  glove(p, 24, 16 + d, 'acero');
  const out = p.outline();
  // Sparks between the prongs.
  if (mood >= 1) {
    const sparks: Array<[number, number, Material, number]> = [[16, 4, 'cian', 1], [17, 5, 'cian', 0]];
    if (mood === 2) sparks.push([17, 2, 'cian', 1], [11, 1, 'cian', 2], [22, 1, 'cian', 1], [16, 0, 'amarillo', 1]);
    for (const [x, y, m, t] of sparks) if (y + d >= 0 && out.get(x, y + d)[3] === 0) out.set(x, y + d, raw(m, t));
  }
  return out;
}

/**
 * Lying in wait: just a charger dropped on the floor, on its side, prongs to the right, eyes shut
 * to a line, its cable coiled and the GRATIS tag showing.
 */
export function makeCargadorNuevoCebo(): Canvas {
  const p = new Paint(CARGADOR_W, CARGADOR_H);
  // The coiled cable behind it and the tag.
  for (const [x, y] of [[6, 26], [5, 27], [4, 28], [5, 29], [6, 29], [7, 28], [3, 29], [2, 28]] as const) p.px(x, y, 'goma', 3);
  p.rect(0, 25, 3, 3, 'amarillo', 1);
  p.px(0, 25, 'amarillo', 0);
  // The brick on its side: the face up towards us, lying long.
  const { fx, fy } = box34(p, 7, 22, 15, 8, 3, 'acero', { top: [0, 1], side: [3, 2], front: [1, 1, 2] });
  // Prongs pointing right.
  for (const y of [fy + 2, fy + 5]) {
    p.rect(fx + 15, y, 4, 1, 'laton', 1);
    p.px(fx + 18, y, 'laton', 3);
  }
  // Eyes shut: two slits (you only notice if you look), and the scorch mark.
  p.rect(fx + 3, fy + 3, 3, 1, 'acero', 4);
  p.rect(fx + 8, fy + 3, 3, 1, 'acero', 4);
  p.px(fx + 11, fy + 1, 'quemada', 1);
  p.px(fx + 12, fy + 1, 'quemada', 2);
  return p.outline();
}

/** Its sheet: 0-1 humming, 2-5 scuttling, 6 lying in wait, 7 found out (jumping up). */
export function makeCargadorNuevoFrames(): Canvas[] {
  const cyc = narrowPoseCycle(...CARGADOR_LEGS2);
  return [
    makeCargadorNuevo(cyc[0]!.pose, 0),
    makeCargadorNuevo(cyc[1]!.pose, 1),
    ...cyc.slice(2).map((f, k) => makeCargadorNuevo(f.pose, (k % 2) as 0 | 1)),
    makeCargadorNuevoCebo(),
    makeCargadorNuevo({ xb: CARGADOR_LEGS2[0], xf: CARGADOR_LEGS2[1], bob: -2 }, 2),
  ];
}

// ---------------------------------------------------------------------------------------------
// The Ratón Inalámbrico sin Pilas: a silver office mouse on legs, two buttons split down the
// middle and the scroll wheel sticking up, fed-up eyes on its front. The low-battery light blinks
// red, the battery cover is gone (a cobweb in the empty slot), and its cable was cut off with
// scissors to make it «wireless». Frozen without signal it goes grey with a loading spinner.

export const RATON_W = 36;
export const RATON_H = 34;
export const RATON_FEET = { x: 17, y: 32 } as const;
export const RATON_LEGS2 = [11, 18] as const;
/** Its mouth, px above its feet (muzzleY). */
export const RATON_MOUTH_Y = 10;

/** `led`: the low-battery light on; `frozen`: the no-signal frame. */
export function makeRatonNuevo(pose: Pose = { xb: RATON_LEGS2[0], xf: RATON_LEGS2[1], bob: 0 }, led = false, frozen = false): Canvas {
  const p = new Paint(RATON_W, RATON_H);
  const d = pose.bob;
  const m: Material = frozen ? 'goma' : 'acero';
  // The cut cable tail out of its back, copper showing at the end.
  for (const [x, y] of [[5, 16], [4, 17], [3, 18], [2, 19], [2, 20], [1, 21]] as const) p.px(x, y + d, 'goma', 3);
  p.px(0, 22 + d, 'oxido', 0);
  p.px(1, 22 + d, 'laton', 1);
  glove(p, 2, 19 + d, m);
  legs(p, pose, 26 + d, RATON_FEET.y, 'goma');
  // The body: a long dome, highest towards the back like a real mouse.
  const cx = 17;
  const cy = 18 + d;
  p.heightShade(3, 6 + d, 30, 22, (x, y) => {
    const nx = (x + 0.5 - cx) / 13.5;
    const ny = (y + 0.5 - cy) / (8.5 - (x > cx ? (x - cx) * 0.12 : 0));
    const v = nx * nx + ny * ny;
    if (v > 1 || y + 0.5 > 26 + d) return null;
    return 9 * Math.sqrt(1 - v);
  }, m, { dither: 0.15, bias: frozen ? 0.3 : -0.08, z: 1.2 });
  // The flat underside rim.
  for (let x = 6; x < 30; x++) if (p.filled(x, 25 + d)) p.px(x, 25 + d, m, 4);
  // The two buttons: the split line from the top of the dome down its back half.
  for (let i = 0; i < 5; i++) p.px(15 + Math.floor(i / 2), 10 + d + i, m, 5);
  // The scroll wheel sticking up at the top of the split (dark rubber, ridged).
  p.rect(13, 7 + d, 3, 4, 'goma', 3);
  p.rect(13, 7 + d, 3, 1, 'goma', 1);
  p.px(14, 9 + d, 'goma', 1);
  p.px(15, 8 + d, 'goma', 5);
  // The low-battery light on top, behind the wheel.
  if (frozen) p.px(9, 11 + d, 'goma', 4);
  else {
    p.px(9, 11 + d, 'rojo', led ? 1 : 4);
    p.px(10, 11 + d, 'rojo', led ? 2 : 5);
    if (led) p.raw(9, 10 + d, [...MATERIALS.rojo[0]!] as RGBA);
  }
  // The face on its front, low on the slope.
  const ey = 15 + d;
  if (frozen) {
    // No signal: a loading spinner where the eyes were.
    const ring = [[24, ey - 1], [25, ey - 1], [26, ey - 1], [27, ey], [27, ey + 1], [27, ey + 2], [26, ey + 3], [25, ey + 3], [24, ey + 3], [23, ey + 2], [23, ey + 1], [23, ey]] as const;
    ring.forEach(([x, y], i) => (i < 4 ? p.raw(x, y, SHINE) : p.px(x, y, 'goma', 5)));
  } else {
    // Fed up: dark eyes with the lids half down, brows pulled down to the middle.
    for (const [ex, w] of [[19, 3], [24, 4]] as const) {
      p.rect(ex - 1, ey, w + 2, 4, m, 6);
      p.rect(ex, ey + 1, w, 2, 'acero', 0);
      p.raw(ex + w - 1, ey + 1, INK);
      p.raw(ex + w - 1, ey + 2, INK);
      p.raw(ex + w - 2, ey + 2, INK);
    }
    for (const [x, y] of [[17, ey - 2], [18, ey - 2], [19, ey - 1], [20, ey - 1], [21, ey - 1], [24, ey - 1], [25, ey - 1], [26, ey - 1], [27, ey - 2], [28, ey - 2]] as const) p.px(x, y, m, 6);
  }
  // A flat mouth pulled to one side, at the height it fires from.
  const my = RATON_FEET.y - RATON_MOUTH_Y + d;
  for (let x = 21; x < 26; x++) p.raw(x, my, INK);
  p.raw(26, my - 1, INK);
  // The empty battery slot low on its back, with a cobweb.
  p.rect(6, 19 + d, 5, 3, m, 6);
  for (const [x, y] of [[6, 20], [7, 21], [8, 19], [9, 20], [10, 21]] as const) p.px(x, y + d, m, 2);
  glove(p, 29, 20 + d, m);
  return p.outline();
}

/** Its sheet: 0-1 breathing (the light blinks), 2-5 walking, 6 frozen without signal. */
export function makeRatonNuevoFrames(): Canvas[] {
  const cyc = poseCycle(...RATON_LEGS2);
  return [...cyc.map((f, k) => makeRatonNuevo(f.pose, k === 1 || k === 3 || k === 5)), makeRatonNuevo(undefined, false, true)];
}

// ---------------------------------------------------------------------------------------------
// The Webcam Siempre Encendida: a webcam bar standing on its monitor clip, one big lens for an eye
// under the privacy shutter, slid half down like a suspicious lid. The «not recording» light is dead
// and cracked, the tape someone stuck over the lens hangs peeled off its side, and its USB tail ends
// in the plug. Recording, the shutter goes up and the lens is red inside (the light stays off: that's
// the joke).

export const WEBCAM_W = 38;
export const WEBCAM_H = 40;
export const WEBCAM_FEET = { x: 18, y: 38 } as const;
export const WEBCAM_LEGS2 = [13, 19] as const;
/** The middle of its lens, px above its feet (muzzleY). */
export const WEBCAM_LENS_Y = 17;

/** `look` shifts the iris (the lens refocusing); `rec` is the recording frame. */
export function makeWebcamNueva(pose: Pose = { xb: WEBCAM_LEGS2[0], xf: WEBCAM_LEGS2[1], bob: 0 }, look = 0, rec = false): Canvas {
  const p = new Paint(WEBCAM_W, WEBCAM_H);
  const d = pose.bob;
  // The USB tail from its back down to the floor, the plug at the end.
  for (const [x, y] of [[4, 22], [3, 23], [2, 24], [2, 25], [2, 26], [1, 27], [1, 28], [1, 29]] as const) p.px(x, y + d, 'goma', 3);
  p.rect(0, 30 + d, 3, 3, 'acero', 2);
  p.rect(0, 30 + d, 3, 1, 'acero', 1);
  p.px(1, 32 + d, 'acero', 5);
  legs(p, pose, 33 + d, WEBCAM_FEET.y, 'goma');
  // The monitor clip it stands on: a hinged neck, the hinge pin catching the light.
  p.rect(14, 27 + d, 9, 6, 'goma', 2);
  p.rect(14, 27 + d, 9, 1, 'goma', 1);
  p.rect(14, 27 + d, 2, 6, 'goma', 3);
  p.rect(14, 30 + d, 9, 1, 'goma', 4);
  p.px(21, 28 + d, 'acero', 1);
  glove(p, 2, 21 + d, 'goma');
  // The bar: a wide capsule, glossy charcoal lit from the top-left.
  const cy = WEBCAM_FEET.y - WEBCAM_LENS_Y + d;
  p.heightShade(2, cy - 10, 34, 20, (x, y) => {
    const nx = (x + 0.5 - 18.5) / 15.5;
    const ny = (y + 0.5 - cy) / 8.5;
    const v = Math.max(0, Math.abs(nx) - 0.45) / 0.55;
    const r = v * v + ny * ny;
    return r > 1 ? null : 6 * Math.sqrt(1 - r);
  }, 'goma', { dither: 0.3, bias: 0.3, z: 1.1 });
  // The lens: a steel bezel, the dark glass, the iris (blue, or red while it records).
  const lx = 21;
  p.ellipsoid(lx + 0.5, cy + 0.5, 7, 7, 'acero', { dither: 0, bias: 0.1 });
  p.ellipsoid(lx + 0.5, cy + 0.5, 5.2, 5.2, 'goma', { dither: 0, bias: -0.5 });
  const iris: Material = rec ? 'rojo' : 'azul';
  const ix = lx + look;
  p.ellipsoid(ix + 0.5, cy + 0.5, 3.2, 3.2, iris, { dither: 0, bias: rec ? 0.2 : 0 });
  p.rect(ix, cy, 2, 2, iris, rec ? 0 : 6);
  p.raw(ix, cy, INK);
  p.raw(ix - 2, cy - 2, SHINE);
  p.raw(ix - 1, cy - 2, SHINE);
  if (!rec) {
    // The privacy shutter slid half down over the lens: a heavy lid, lower towards the front.
    for (let x = lx - 6; x <= lx + 6; x++) {
      const rows = 5 + (x > lx ? 1 : 0);
      for (let r = 0; r < rows; r++) if (p.filled(x, cy - 6 + r)) p.px(x, cy - 6 + r, 'acero', r === 0 ? 1 : r === rows - 1 ? 5 : r === rows - 2 ? 3 : 2);
    }
  }
  // The microphone holes either side of the lens.
  for (const x of [8, 10, 12, 31, 33]) p.px(x, cy + 3, 'goma', 5);
  // The «not recording» light: dead and cracked, recording or not.
  p.rect(31, cy - 5, 2, 2, 'goma', 4);
  p.px(32, cy - 5, 'acero', 2);
  // The tape someone stuck over the lens, peeled off and hanging from its side.
  p.rect(5, cy - 4, 5, 2, 'crema', 1);
  p.px(9, cy - 3, 'crema', 3);
  p.rect(5, cy - 2, 3, 6, 'crema', 2);
  p.px(5, cy - 2, 'crema', 1);
  p.px(7, cy + 3, 'crema', 4);
  glove(p, 32, 22 + d, 'goma');
  const out = p.outline();
  // Recording: a little red glint off the iris.
  if (rec) out.set(lx + 4, cy - 3, raw('rojo', 0));
  return out;
}

/** Its sheet: 0-1 looking about, 2-5 tiptoeing on its clip, 6 recording. */
export function makeWebcamNuevaFrames(): Canvas[] {
  const cyc = narrowPoseCycle(...WEBCAM_LEGS2);
  return [...cyc.map((f, k) => makeWebcamNueva(f.pose, k === 1 || k === 4 ? -1 : 0)), makeWebcamNueva(undefined, 0, true)];
}
