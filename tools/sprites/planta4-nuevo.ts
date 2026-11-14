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

// ---------------------------------------------------------------------------------------------
// The Fotocopiadora de Planta: the big floor copier of every office, in pale grey steel-and-plastic
// (`acero`, so it does not read as one more beige box next to the shredder and the printer) with a
// charcoal lid (`goma`). Face on the front under the control panel; its mouth is the output slot,
// with the jammed sheet hanging out like a tongue. It shuffles on office shoes; the paper drawer is
// its belly. Jokes: the «Averiada, no tocar» sign taped on since the floor opened, the display stuck
// on E-04, the coin slot with tape over it (it copies for free, like everything in a company), and
// the side tray full of copies nobody came to pick up. To copy, it lifts its lid and a green light
// crosses the glass: back, middle, front.

export const COPIER_W = 48;
export const COPIER_H = 48;
export const COPIER_FEET = { x: 24, y: 46 } as const;
export const COPIER_LEGS2 = [18, 26] as const;
/** Its output slot, px above its feet (muzzleY): the sheets come out of its mouth. */
export const COPIER_MOUTH_Y = 10;
/** Its body: the front face's left edge, top row and size, and the depth of the top and side faces. */
const CP = { x0: 8, y0: 16, fw: 30, fh: 24, depth: 6 } as const;

/** «Averiada, no tocar»: a white sheet, two strips of yellowed tape, three red scribbled lines. */
function brokenSign(p: Paint, x: number, y: number): void {
  p.rect(x, y, 7, 8, 'acero', 0);
  p.rect(x, y + 7, 7, 1, 'crema', 2);
  p.px(x + 6, y + 7, 'acero', 3);
  p.rect(x + 1, y - 1, 2, 2, 'amarillo', 0);
  p.rect(x + 5, y - 1, 2, 2, 'amarillo', 0);
  p.rect(x + 1, y + 2, 5, 1, 'rojo', 3);
  p.rect(x + 1, y + 4, 4, 1, 'rojo', 3);
  p.rect(x + 1, y + 6, 5, 1, 'rojo', 2);
}

/** The display stuck on «E-04»: amber marks on black. */
function display(p: Paint, x: number, y: number): void {
  p.rect(x, y, 9, 5, 'goma', 5);
  p.rect(x + 1, y + 1, 7, 3, 'amarillo', 4);
  for (const [i, j] of [[1, 1], [1, 2], [1, 3], [2, 1], [2, 3], [3, 2], [5, 1], [5, 2], [6, 2], [7, 1], [7, 2], [7, 3]] as const) p.px(x + i, y + j, 'amarillo', 1);
}

/** The eyes: tired, the lids half down; wide open and the brows up while it duplicates someone. */
function copierEyes(p: Paint, xs: readonly number[], y: number, wide: boolean): void {
  for (const x of xs) {
    p.rect(x, y, 4, 4, 'acero', 5);
    p.rect(x, y + 1, 3, 3, 'acero', 0);
    p.raw(x + 1, y + 2, INK);
    p.raw(x + 2, y + 2, INK);
    p.raw(x + 1, y + 3, INK);
    if (!wide) p.rect(x, y, 4, 2, 'acero', 3);
    for (let i = -1; i < 4; i++) p.raw(x + i, wide ? y - 3 : y - 1, INK);
  }
}

/** The side tray of uncollected copies, sticking out to the left of the side face. */
function sideTray(p: Paint, x: number, y: number): void {
  for (let k = 0; k < 4; k++) p.rect(x + (k % 2), y - k, 7, 1, 'acero', k === 3 ? 0 : 1);
  p.px(x + 2, y - 2, 'acero', 3);
  p.px(x + 4, y - 1, 'acero', 3);
  p.rect(x - 1, y + 1, 9, 2, 'acero', 4);
  p.rect(x - 1, y + 1, 9, 1, 'acero', 3);
}

/**
 * The copier. `lid` 0 shut, 1-3 up with the light at the back, middle and front of the glass;
 * `out`: a whole fresh copy sliding out of its mouth.
 */
export function makeFotocopiadoraNueva(pose: Pose = { xb: COPIER_LEGS2[0], xf: COPIER_LEGS2[1], bob: 0 }, lid = 0, out = false): Canvas {
  const p = new Paint(COPIER_W, COPIER_H);
  const F = COPIER_FEET;
  const { x0, y0, fw, fh, depth } = CP;
  legs(p, pose, y0 + fh + pose.bob, F.y, 'goma');
  const b = new Paint(COPIER_W, COPIER_H);
  const my = F.y - COPIER_MOUTH_Y - 1;
  glove(b, 0, 20, 'acero');
  if (lid > 0) {
    // The lid up, leaning back on its hinge: charcoal back, the white pad facing us.
    b.rect(x0 + 2, 1, fw + 1, 11, 'goma', 3);
    b.rect(x0 + 2, 1, fw + 1, 1, 'goma', 1);
    b.rect(x0 + 4, 3, fw - 3, 7, 'acero', 0);
    b.rect(x0 + 4, 9, fw - 3, 1, 'acero', 2);
    b.px(x0 + 6, 4, 'crema', 2);
  }
  const { fx } = box34(b, x0, y0, fw, fh, depth, 'acero');
  // The top face: the lid shut (charcoal slab with its handle), or the glass with the light.
  for (let j = 0; j < depth; j++) {
    const xa = x0 + j + 1;
    const w = fw - 1;
    if (lid === 0) b.rect(xa, y0 - depth + j, w, 1, 'goma', j === 0 ? 1 : j < 3 ? 2 : 3);
    else {
      b.rect(xa, y0 - depth + j, w, 1, 'vidrio', j === 0 ? 4 : 5);
      // The bar of light, sweeping from the back (left) to the front (right).
      const bx = xa + [0, 4, 14, 24][lid]!;
      b.rect(bx, y0 - depth + j, 3, 1, 'verde', 1);
      b.px(bx + 1, y0 - depth + j, 'verde', 0);
    }
  }
  if (lid === 0) {
    b.rect(fx + fw - 9, y0 - 1, 6, 1, 'goma', 4);
    // A coffee ring left on the lid.
    for (const [i, j] of [[0, 0], [1, -1], [2, 0], [1, 1]] as const) b.px(x0 + 12 + i, y0 - 3 + j, 'goma', 4);
  }
  // The control panel: a strip along the top of the front with the display and the buttons.
  b.rect(fx + 1, y0 + 1, fw - 2, 6, 'acero', 2);
  b.rect(fx + 1, y0 + 6, fw - 2, 1, 'acero', 4);
  display(b, fx + fw - 11, y0 + 1);
  for (let i = 0; i < 4; i++) b.px(fx + 3 + i * 2, y0 + 3, 'acero', i === 3 ? 5 : 4);
  b.rect(fx + 11, y0 + 3, 2, 2, 'verde', 2);
  b.px(fx + 11, y0 + 3, 'verde', 0);
  b.rect(fx + 14, y0 + 3, 2, 2, 'rojo', 2);
  // The face.
  copierEyes(b, [fx + 13, fx + 21], y0 + 10, lid > 0);
  // The mouth: the output slot, dark, with the lip catching the light.
  b.rect(fx + 7, my - 1, 21, 3, 'acero', 6);
  b.rect(fx + 7, my + 2, 21, 1, 'acero', 1);
  if (out) {
    // A whole fresh copy sliding out, toner lines on it.
    b.rect(fx + 9, my, 16, 6, 'acero', 0);
    b.rect(fx + 9, my + 5, 16, 1, 'acero', 2);
    for (const y of [my + 1, my + 3]) b.rect(fx + 11, y, 10, 1, 'acero', 3);
    b.raw(fx + 22, my + 2, INK);
  } else {
    // The jammed sheet hanging out like a tongue, crumpled at the corner.
    b.rect(fx + 15, my, 6, 5, 'acero', 0);
    b.rect(fx + 16, my + 5, 4, 1, 'acero', 0);
    b.px(fx + 15, my + 4, 'acero', 2);
    b.px(fx + 20, my + 3, 'crema', 2);
    b.rect(fx + 17, my + 2, 2, 1, 'acero', 2);
  }
  // The paper drawer, its belly: a seam and a handle.
  b.rect(fx + 1, y0 + fh - 3, fw - 2, 1, 'acero', 4);
  b.rect(fx + 12, y0 + fh - 2, 6, 1, 'acero', 5);
  brokenSign(b, fx + 2, y0 + 10);
  // The coin slot on the side, taped over: it copies for free.
  b.rect(x0 + 2, y0 + 3, 2, 5, 'acero', 6);
  b.px(x0 + 1, y0 + 4, 'amarillo', 1);
  b.px(x0 + 2, y0 + 5, 'amarillo', 1);
  b.px(x0 + 3, y0 + 6, 'amarillo', 1);
  b.px(x0 + 4, y0 + 7, 'amarillo', 1);
  sideTray(b, 1, y0 + 13);
  // Wear: a scuff on the side, a dent and a speck of rust by the slot.
  b.px(x0 + 3, y0 + fh - 5, 'acero', 5);
  b.px(fx + fw - 3, my + 3, 'oxido', 1);
  glove(b, 43, 21, 'acero');
  p.stamp(b, 0, pose.bob);
  return p.outline();
}

/**
 * Its frames (the ones its `anim` names): 0-1 humming, 2-5 shuffling, 6-8 lid up with the light at
 * the back, middle and front of the glass, 9 a copy sliding out.
 */
export function makeFotocopiadoraNuevaFrames(): Canvas[] {
  return [
    ...poseCycle(COPIER_LEGS2[0], COPIER_LEGS2[1]).map((f) => makeFotocopiadoraNueva(f.pose)),
    makeFotocopiadoraNueva(undefined, 1),
    makeFotocopiadoraNueva(undefined, 2),
    makeFotocopiadoraNueva(undefined, 3),
    makeFotocopiadoraNueva(undefined, 0, true),
  ];
}

// ---------------------------------------------------------------------------------------------
// The Sello de Denegado: an office rubber stamp, all varnished beech (`haya`, a material of its
// own): a big round knob on top with two tooth marks bitten into it (someone waited a long time),
// a neck and the mount, a block in three quarters with a face that has seen every form; under it
// the red rubber, worn pink at the corners, with the backwards letters of «DENEGADO» raised on its
// edge. Jokes: the tooth marks, and the «Revisado» sticker on its front, stamped over in red. It
// does not walk: it hops, and comes down to stamp.

export const STAMP_W = 34;
export const STAMP_H = 46;
export const STAMP_FEET = { x: 17, y: 44 } as const;

/** The rubber's edge: a red slab with the raised mirrored letters (darker) along its front. */
function rubber(p: Paint, x: number, y: number, w: number, h: number, inked: boolean): void {
  p.rect(x, y, w, h, 'rojo', 2);
  p.rect(x, y, w, 1, 'rojo', 1);
  p.rect(x, y + h - 1, w, 1, 'rojo', inked ? 4 : 3);
  // Worn pink at the corners.
  p.px(x, y, 'rojo', 0);
  p.px(x + w - 1, y, 'rojo', 0);
  // «ODAGENED», mirrored: little raised blocks, a letter every three px.
  for (let i = 2; i < w - 2; i += 3) {
    p.px(x + i, y + 1, 'rojo', 3);
    if ((i / 3) % 2 < 1) p.px(x + i, y + 2, 'rojo', 3);
    else p.px(x + i + 1, y + 2, 'rojo', 3);
  }
}

/** Eyes that have seen every form: half shut, brows flat; furious and gritting its teeth to slam. */
function stampFace(p: Paint, ex: number, ey: number, slam: boolean): void {
  for (const x of [ex, ex + 7]) {
    p.rect(x, ey, 4, 3, 'haya', 5);
    if (!slam) {
      p.rect(x, ey + 1, 3, 2, 'acero', 0);
      p.raw(x + 1, ey + 2, INK);
      p.raw(x + 2, ey + 2, INK);
      p.rect(x, ey, 4, 1, 'haya', 2);
    } else {
      p.rect(x, ey + 1, 3, 1, 'rojo', 1);
      p.raw(x + 1, ey + 1, INK);
    }
  }
  if (slam) {
    // Brows slanting down to the middle.
    const brow = [3, 3, 2, 1, 1] as const;
    brow.forEach((up, i) => {
      p.raw(ex - 1 + i, ey - up, INK);
      p.raw(ex + 11 - i, ey - up, INK);
    });
    // Gritted teeth.
    p.rect(ex + 2, ey + 4, 7, 3, 'haya', 6);
    p.rect(ex + 3, ey + 5, 5, 1, 'acero', 0);
    p.raw(ex + 5, ey + 5, INK);
  } else {
    for (let i = -1; i < 4; i++) {
      p.raw(ex + i, ey - 1, INK);
      p.raw(ex + 7 + i + 1, ey - 1, INK);
    }
    // A flat line of a mouth, turned down at one end.
    p.rect(ex + 3, ey + 5, 5, 1, 'haya', 6);
    p.px(ex + 8, ey + 6, 'haya', 6);
  }
}

/**
 * The stamp. `squash` px lower (crouching, just stamped), `air`: legs tucked up, `slam`: coming down
 * stretched and furious, `jx`: shaking sideways, `inked`: just stamped (red ink round the rubber).
 */
export function makeSelloNuevo(squash = 0, air = false, slam = false, jx = 0, inked = false): Canvas {
  const p = new Paint(STAMP_W, STAMP_H);
  const F = STAMP_FEET;
  const stretch = slam ? 2 : 0;
  // The rubber's underside: on the legs standing; tucked a little higher in the air.
  const rb = air || slam ? F.y - 5 : F.y - 4;
  if (air || slam) {
    for (const x of [10, 19]) {
      p.rect(x, rb + 1, 5, 2, 'goma', 2);
      p.rect(x + 1, rb + 1, 3, 1, 'goma', 1);
    }
  } else legs(p, { xb: 10, xf: 18, bob: 0 }, rb + 1, F.y, 'goma');
  const b = new Paint(STAMP_W, STAMP_H);
  const x0 = 5 + jx;
  const rh = 4;
  const rt = rb - rh + 1;
  rubber(b, x0, rt, 24, rh, inked);
  // The mount: a beech block in three quarters, with the face on its front.
  const mh = 12 - squash + stretch;
  const my = rt - mh;
  const { fx } = box34(b, x0 + 1, my, 19, mh, 4, 'haya');
  // A dark band where it meets the rubber, and the grain down the side.
  b.rect(fx, rt - 1, 19, 1, 'haya', 4);
  b.px(x0 + 2, my + 4, 'haya', 5);
  b.px(x0 + 3, my + 7, 'haya', 5);
  // The «Revisado» sticker on the front corner, stamped DENEGADO over in red.
  b.rect(fx + 1, my + 2, 5, 4, 'acero', 0);
  b.rect(fx + 2, my + 3, 3, 1, 'verde', 3);
  for (let i = 0; i < 5; i++) b.px(fx + 1 + i, my + 5 - (i >> 1), 'rojo', 2);
  stampFace(b, fx + 6, my + Math.max(2, 4 - squash), slam);
  // Neck and knob: the handle, the knob a varnished ball with two tooth marks.
  const nh = 4 + stretch;
  const ny = my - 4 - nh + 1;
  b.rect(x0 + 10, ny, 6, nh + 1, 'haya', 2);
  b.rect(x0 + 10, ny, 1, nh + 1, 'haya', 1);
  b.rect(x0 + 15, ny, 1, nh + 1, 'haya', 4);
  b.rect(x0 + 9, ny + nh - 1, 8, 1, 'haya', 3);
  const kc = { x: x0 + 13, y: ny - 5 };
  b.ellipsoid(kc.x, kc.y, 7, 6, 'haya', { dither: 0.3, spec: true });
  for (const [dx, dy] of [[4, 1], [4, 2], [2, 3]] as const) b.px(kc.x + dx, kc.y + dy, 'haya', 5);
  // Gloves at the mount's sides: up in the air while it hops, clenched high to slam.
  const gy = air ? my - 2 : slam ? my - 4 : my + 4;
  glove(b, x0 - 5, gy, 'haya');
  glove(b, x0 + 24, gy, 'haya');
  if (inked) {
    // Ink squashed out round the rubber.
    for (const [x, y] of [[x0 - 1, rb], [x0 - 2, rb - 1], [x0 + 24, rb], [x0 + 25, rb - 1], [x0 + 8, rb + 1], [x0 + 15, rb + 1]] as const) b.px(x, y, 'rojo', 3);
  }
  p.stamp(b, 0, 0);
  return p.outline();
}

/** Its frames: 0-1 standing (it shakes), 2 crouching to hop, 3 in the air, 4 coming down to stamp, 5 just stamped. */
export function makeSelloNuevoFrames(): Canvas[] {
  return [makeSelloNuevo(), makeSelloNuevo(0, false, false, 1), makeSelloNuevo(3), makeSelloNuevo(0, true), makeSelloNuevo(0, false, true), makeSelloNuevo(4, false, false, 0, true)];
}

// ---------------------------------------------------------------------------------------------
// The Climatizador Portátil: a tall portable air conditioner in ivory plastic (`crema`), a box in
// three quarters. On its front the display stuck at «17» (nobody knows who set it), two eyes of
// smug indifference and, lower down, the louvred vent where the cold comes out (its mouth, at its
// muzzleY), with a red ribbon tied to it that flutters (stiff with ice when it is about to blow).
// On its side, the sheet «NO TOCAR. Firmado: Dirección» and the round outlet of the exhaust hose,
// where the game plugs the hose that runs to the wall (GameScene.drawHose: 7 px behind its feet's
// column, 10 px up).

export const AC_W = 38;
export const AC_H = 50;
export const AC_FEET = { x: 19, y: 48 } as const;
export const AC_LEGS2 = [14, 21] as const;
/** Its vent, px above its feet (muzzleY): the flakes come out of here. */
export const AC_VENT_Y = 12;
/** Where the hose comes out of its back, from its feet (GameScene.drawHose). */
export const AC_HOSE = { dx: -7, dy: -10 } as const;

/** «17» in cold blue on a dark display. */
function display17(p: Paint, x: number, y: number): void {
  p.rect(x, y, 9, 7, 'goma', 5);
  p.rect(x + 1, y + 1, 7, 5, 'cian', 5);
  for (let j = 0; j < 5; j++) p.px(x + 2, y + 1 + j, 'cian', 1);
  p.px(x + 1, y + 2, 'cian', 1);
  p.rect(x + 4, y + 1, 3, 1, 'cian', 1);
  for (const [i, j] of [[6, 2], [6, 3], [5, 4], [5, 5]] as const) p.px(x + i, y + j, 'cian', 1);
  p.raw(x + 7, y + 1, SHINE);
}

/**
 * The air conditioner. `vent` 0-2: the louvres' shimmer and the ribbon's flutter; `frost`: rime on
 * the vent, the ribbon frozen stiff and the eyes narrowed (about to blow its flakes).
 */
export function makeClimatizadorNuevo(pose: Pose = { xb: AC_LEGS2[0], xf: AC_LEGS2[1], bob: 0 }, vent = 0, frost = false): Canvas {
  const p = new Paint(AC_W, AC_H);
  const F = AC_FEET;
  const y0 = 9;
  const fh = 33;
  legs(p, pose, y0 + fh + pose.bob, F.y, 'goma');
  const b = new Paint(AC_W, AC_H);
  glove(b, 1, 22, 'crema');
  const x0 = 7;
  const depth = 5;
  const { fx } = box34(b, x0, y0, 21, fh, depth, 'crema');
  // The rounded top: a grille of slots on the top face.
  for (let j = 1; j < depth; j += 2) for (let i = 4; i < 18; i += 2) b.px(x0 + j + i, y0 - depth + j, 'crema', 3);
  display17(b, fx + 10, y0 + 2);
  // Eyes of smug indifference: lids half down, looking off to the side.
  const ey = y0 + 12;
  for (const x of [fx + 5, fx + 12]) {
    b.rect(x, ey, 4, 3, 'crema', 5);
    b.rect(x, ey + 1, 4, 2, 'acero', 0);
    b.raw(x + 3, ey + 2, INK);
    b.raw(x + 2, ey + 2, INK);
    b.rect(x, ey, 4, frost ? 2 : 1, 'crema', 3);
    for (let i = 0; i < 4; i++) b.raw(x + i, ey - 1 - (frost && (x === fx + 5 ? i > 1 : i < 2) ? 0 : 1) + (frost ? 1 : 0), INK);
  }
  // A smug little smile.
  b.rect(fx + 9, ey + 5, 4, 1, 'crema', 6);
  b.px(fx + 13, ey + 4, 'crema', 6);
  // The vent: louvres, dark slots between pale slats, the mouth's row among them.
  const my = F.y - AC_VENT_Y - 1;
  const vx = fx + 3;
  const vw = 15;
  b.rect(vx - 1, my - 6, vw + 2, 10, 'crema', 4);
  for (let j = 0; j < 8; j++) {
    const slot = (j + vent) % 2 === 0;
    b.rect(vx, my - 5 + j, vw, 1, slot ? 'crema' : 'crema', slot ? 6 : 1);
  }
  b.rect(vx, my, vw, 1, 'crema', 6);
  if (frost) {
    // Rime on the slats, icicles under the vent.
    for (let i = 0; i < vw; i += 2) b.px(vx + i, my - 5 + (i % 4 === 0 ? 1 : 3), 'cian', 1);
    for (const i of [2, 7, 12]) {
      b.px(vx + i, my + 3, 'cian', 1);
      b.px(vx + i, my + 4, 'cian', 2);
    }
    b.rect(vx, my - 6, vw, 1, 'cian', 0);
  }
  // The ribbon tied to the vent: it flutters out to the right in the draught (frozen straight).
  const ry = my - 2;
  b.px(vx + vw - 1, ry, 'rojo', 3);
  const flutter = frost ? [0, 0, 0, 0, 0] : [[0, -1, -1, 0, 1], [0, 0, 1, 1, 0], [0, 1, 0, -1, -1]][vent]!;
  flutter.forEach((dy, i) => {
    b.px(vx + vw + i, ry + dy, frost ? 'cian' : 'rojo', frost ? 2 : i % 2 ? 2 : 1);
    if (!frost) b.px(vx + vw + i, ry + dy + 1, 'rojo', 3);
  });
  // The side: the «NO TOCAR» sheet and the round outlet of the hose.
  b.rect(x0 + 1, y0 + 4, 4, 7, 'acero', 0);
  b.rect(x0 + 1, y0 + 3, 2, 1, 'amarillo', 0);
  for (const j of [1, 3, 5]) b.rect(x0 + 1, y0 + 4 + j, 3, 1, j === 1 ? 'rojo' : 'goma', 3);
  const hx0 = F.x + AC_HOSE.dx;
  const hy0 = F.y + AC_HOSE.dy;
  b.ellipsoid(hx0 - 1, hy0, 3, 3.5, 'acero', { dither: 0 });
  b.rect(hx0 - 2, hy0 - 1, 2, 3, 'goma', 5);
  // Silver tape round the outlet, and a drip stain down the front.
  b.px(hx0 - 4, hy0 - 2, 'acero', 0);
  b.px(hx0 - 4, hy0 - 1, 'acero', 1);
  b.px(fx + 18, my + 3, 'crema', 3);
  b.px(fx + 18, my + 5, 'crema', 3);
  glove(b, 33, 22, 'crema');
  p.stamp(b, 0, pose.bob);
  return p.outline();
}

/** Its frames: 0-1 humming, 2-5 dragging itself along, 6 rime on the vent (about to blow). */
export function makeClimatizadorNuevoFrames(): Canvas[] {
  return [
    ...poseCycle(AC_LEGS2[0], AC_LEGS2[1]).map((f, i) => makeClimatizadorNuevo(f.pose, i % 3)),
    makeClimatizadorNuevo(undefined, 0, true),
  ];
}
