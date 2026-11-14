// M14c (a6c): the plant 4 enemies (Oficinas) redrawn in the new style (docs/ESTILO_ARTE.md,
// «M14c · El estilo nuevo»), with the painting tools of src/art/pintor.ts and the same legs and
// gloves as plant 1 (tools/sprites/planta1-nuevo.ts). The old makers stay in enemies.ts as
// history. The frames and their order are the ones each enemy's `anim` names in
// src/data/enemies.ts; no floor shadow is baked in.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove, legs } from './planta1-nuevo.ts';
import { box34 } from './planta3-nuevo.ts';
import { poseCycle, type Pose } from './pose.ts';

// ---------------------------------------------------------------------------------------------
// The Destructora de Documentos: an office paper shredder in beige plastic gone yellow under the
// fluorescents, its blade slot for a mouth and its see-through bin, packed with strips, on its
// back. It always turns to face its target, so it is drawn from three sides: side (facing right,
// the bin behind it on the left), front (eyes and blades, strips poking up behind) and back (all
// bin). Jokes: the post-it «Confidencial» stuck over its mouth, the «No introducir la mano»
// sticker, and a document half eaten in the paper slot on top. Black office shoes.

export const SHRED_W = 46;
export const SHRED_H = 44;
export const SHRED_FEET = { x: 23, y: 42 } as const;
export const SHRED_LEGS2 = [17, 25] as const;
/** Its blade slot, px above its feet (muzzleY): the strips come out of its mouth. */
export const SHRED_MOUTH_Y = 12;

export type ShredView = 'side' | 'front' | 'back';

/** Shredded paper: wavy strips side by side, `t0` the light tone (seen through the bin, darker). */
function strips(p: Paint, x: number, y: number, w: number, h: number, t0 = 0): void {
  for (let i = 0; i < w; i++) {
    // Two px of paper, one of gap, the strips swaying a px every few rows.
    for (let j = 0; j < h; j++) {
      const k = (i + (((j >> 2) + (i >> 2)) % 2)) % 3;
      if (k === 2) continue;
      p.px(x + i, y + j, 'crema', t0 + (k === 0 ? 0 : 1) + ((j + i * 3) % 7 === 0 ? 1 : 0));
    }
  }
}

/**
 * Strips bulging over the top of the bin, `w` wide with its base on row `y`: a ragged heap,
 * taller in the middle, the strips curling over at their tips.
 */
function heap(p: Paint, x: number, y: number, w: number, h: number): void {
  for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / w - 0.5;
    const top = Math.round(h * (1 - 4 * u * u)) + ((i * 7) % 3 === 0 ? 1 : 0);
    for (let j = 0; j < top; j++) p.px(x + i, y - j, 'crema', j === top - 1 ? 0 : (i + j) % 4 === 0 ? 2 : 1);
  }
}

/** The see-through bin: tinted glass, the strips packed inside, a reflection down its lit side. */
function bin(p: Paint, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, 'vidrio', 3);
  strips(p, x + 1, y + 2, w - 2, h - 3, 1);
  p.rect(x, y, w, 1, 'vidrio', 1);
  p.rect(x, y + 1, w, 1, 'vidrio', 2);
  p.rect(x, y + h - 1, w, 1, 'vidrio', 5);
  p.rect(x, y + 1, 1, h - 2, 'vidrio', 2);
  p.rect(x + w - 1, y + 1, 1, h - 2, 'vidrio', 4);
  // The reflection of the window on the glass.
  for (let j = 3; j < h - 3; j++) p.px(x + 2, y + j, 'vidrio', j % 6 < 4 ? 0 : 1);
  p.px(x + 3, y + 3, 'vidrio', 0);
}

/** The «No introducir la mano» sticker: a white square, red border, a red slash across a hand. */
function noHand(p: Paint, x: number, y: number): void {
  p.rect(x, y, 5, 5, 'rojo', 2);
  p.rect(x + 1, y + 1, 3, 3, 'acero', 0);
  p.px(x + 2, y + 2, 'tostada', 1);
  for (let i = 0; i < 5; i++) p.px(x + i, y + 4 - i, 'rojo', 2);
}

/** The post-it «Confidencial» stuck over a corner of the mouth: yellow, curling, three red scribbles. */
function postIt(p: Paint, x: number, y: number): void {
  p.rect(x, y, 6, 5, 'amarillo', 1);
  p.rect(x, y, 6, 1, 'amarillo', 0);
  p.px(x + 5, y + 4, 'amarillo', 3);
  p.px(x + 4, y + 4, 'amarillo', 2);
  p.rect(x + 1, y + 1, 4, 1, 'rojo', 3);
  p.rect(x + 1, y + 2, 3, 1, 'rojo', 3);
  p.rect(x + 1, y + 3, 2, 1, 'rojo', 3);
}

/** The blade slot: dark, a row of teeth along its top (red when it means it). */
function blades(p: Paint, x: number, y: number, w: number, red: boolean): void {
  p.rect(x, y, w, 3, 'beige', 6);
  for (let i = 1; i < w - 1; i += 2) {
    p.px(x + i, y + 1, red ? 'rojo' : 'acero', red ? 1 : 1);
    p.px(x + i + 1, y + 1, red ? 'rojo' : 'acero', red ? 3 : 3);
  }
  // The lip of the slot catches the light.
  p.rect(x, y + 3, w, 1, 'beige', 1);
}

/** Eyes under heavy lids, brows down to the middle (narrowed when `red`). */
function eyes(p: Paint, xs: readonly number[], y: number, red: boolean): void {
  for (const x of xs) {
    p.rect(x, y, 4, 4, 'beige', 5);
    if (!red) {
      p.rect(x, y + 1, 3, 2, 'acero', 0);
      p.raw(x + 2, y + 1, INK);
      p.raw(x + 2, y + 2, INK);
      p.raw(x + 1, y + 2, INK);
    } else {
      p.rect(x, y + 2, 3, 1, 'rojo', 1);
      p.raw(x + 2, y + 2, INK);
    }
    // The lid: heavy, lower still when it means it.
    p.rect(x, y, 4, red ? 2 : 1, 'beige', 3);
  }
  const [a, b] = xs as [number, number];
  for (const [x, up] of [[a - 1, 2], [a, 2], [a + 1, 1], [a + 2, 1], [a + 3, 0], [b, 0], [b + 1, 1], [b + 2, 1], [b + 3, 2], [b + 4, 2]] as const) p.raw(x, y - 1 - up + (red ? 1 : 0), INK);
}

/** The switch light: green while it hums, red when it is about to lunge. */
function light(p: Paint, x: number, y: number, red: boolean): void {
  p.raw(x, y, SHINE);
  p.px(x + 1, y, red ? 'rojo' : 'verde', 1);
  p.px(x, y + 1, red ? 'rojo' : 'verde', 2);
  p.px(x + 1, y + 1, red ? 'rojo' : 'verde', 3);
}

/** The document half eaten in the paper slot on top: a white sheet, a red stamp, the torn edge. */
function sheet(p: Paint, x: number, y: number): void {
  p.rect(x, y, 7, 4, 'acero', 0);
  p.rect(x, y + 3, 7, 1, 'acero', 1);
  p.rect(x + 1, y + 1, 4, 1, 'rojo', 2);
  p.px(x + 6, y, 'acero', 2);
  for (const i of [1, 3, 5]) p.px(x + i, y + 2, 'acero', 2);
}

/**
 * The shredder from one side. `red`: the blades red and the eyes narrowed (about to lunge, or
 * chewing a bullet it swallowed).
 */
export function makeDestructoraNueva(pose: Pose = { xb: SHRED_LEGS2[0], xf: SHRED_LEGS2[1], bob: 0 }, view: ShredView = 'side', red = false): Canvas {
  const p = new Paint(SHRED_W, SHRED_H);
  const F = SHRED_FEET;
  legs(p, pose, 35 + pose.bob, F.y, 'goma');
  const b = new Paint(SHRED_W, SHRED_H);
  // Its mouth (the blade slot) is on this row, whatever the view.
  const my = F.y - SHRED_MOUTH_Y - 1;
  const y0 = 13;
  const fh = 22;
  if (view === 'side') {
    glove(b, 1, 22, 'beige');
    // The bin on its back: strips piled over the top of it.
    heap(b, 4, 12, 11, 5);
    bin(b, 3, 12, 12, 23);
    // The head: a box in three quarters, the front (with the face) looking right.
    const { fx } = box34(b, 11, y0, 25, fh, 5, 'beige');
    // The paper slot along the top, with the half-eaten document.
    b.rect(fx - 2, y0 - 3, 22, 1, 'beige', 5);
    sheet(b, fx + 8, y0 - 7);
    noHand(b, fx + 2, y0 + 3);
    eyes(b, [fx + 9, fx + 17], y0 + 5, red);
    blades(b, fx + 2, my - 1, 21, red);
    postIt(b, fx + 17, my - 3);
    light(b, fx + 22, y0 + 2, red);
    // Wear: a scuff on the top, a crack in the corner and the ring of a coffee cup on the side.
    b.px(fx + 4, y0 - 2, 'beige', 3);
    b.px(fx + 1, y0 + fh - 3, 'beige', 4);
    b.px(fx + 2, y0 + fh - 4, 'beige', 4);
    b.px(13, y0 + 12, 'beige', 5);
    b.px(14, y0 + 13, 'beige', 5);
    glove(b, 40, my - 4, 'beige');
  } else if (view === 'front') {
    glove(b, 1, my - 5, 'beige');
    // Strips poking up from the bin behind it.
    heap(b, 11, y0 - 3, 22, 6);
    const { fx } = box34(b, 7, y0, 28, fh, 3, 'beige');
    b.rect(fx + 3, y0 - 2, 22, 1, 'beige', 5);
    sheet(b, fx + 11, y0 - 6);
    eyes(b, [fx + 8, fx + 17], y0 + 5, red);
    blades(b, fx + 3, my - 1, 22, red);
    postIt(b, fx + 19, my - 3);
    light(b, fx + 24, y0 + 2, red);
    noHand(b, fx + 1, y0 + 3);
    glove(b, 39, my - 5, 'beige');
  } else {
    glove(b, 1, my - 5, 'beige');
    heap(b, 12, y0 - 3, 20, 7);
    const { fx } = box34(b, 7, y0, 28, fh, 3, 'beige');
    // All bin: the see-through back packed with strips, and the sticker on it.
    bin(b, fx + 2, y0 + 1, 24, fh - 3);
    noHand(b, fx + 17, y0 + 9);
    glove(b, 39, my - 5, 'beige');
  }
  p.stamp(b, 0, pose.bob);
  return p.outline();
}

/** Its sheet, seven frames a side (side 0-6, front 7-13, back 14-20): 0-1 humming, 2-5 shuffling, 6 blades red. */
export function makeDestructoraNuevaFrames(): Canvas[] {
  return (['side', 'front', 'back'] as const).flatMap((v) => [
    ...poseCycle(SHRED_LEGS2[0], SHRED_LEGS2[1]).map((f) => makeDestructoraNueva(f.pose, v)),
    makeDestructoraNueva(undefined, v, true),
  ]);
}
