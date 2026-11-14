// M14c (a6f2): the Servicio Técnico's own enemy, the Carretilla Elevadora, redrawn in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo») with the painting tools of src/art/pintor.ts. The
// old maker stays in taller.ts as history. Frames and order as its `anim` in src/data/enemies.ts
// (taller.ts FORK_FRAMES); no floor shadow baked in. It is not reconditioned: it keeps its colours.

import type { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove } from './planta1-nuevo.ts';
import { box34 } from './planta3-nuevo.ts';

export const FORK_W = 46;
export const FORK_H = 46;
/** Where its wheels touch the floor (EnemyDef.anchor): the row under them. */
export const FORK_FEET = { x: 22, y: 44 } as const;
/** The tips of its forks rest this many px above the floor (ankle height), and rise to ram. */
export const FORK_TINE_LOW = 3;
export const FORK_TINE_HIGH = 11;

/** A wheel: dark rubber tyre, a mustard hub with two bolts that turn an eighth a frame. */
function wheel(p: Paint, cx: number, cy: number, r: number, spin: number): void {
  p.ellipsoid(cx, cy, r, r, 'goma', { dither: 0, bias: -0.15 });
  // The tread: a few darker notches round the lower half.
  for (const a of [0.5, 1.3, 2.1, 2.9]) p.px(cx + Math.cos(a + spin * 0.4) * (r - 0.6), cy + Math.sin(a + spin * 0.4) * (r - 0.6), 'goma', 5);
  p.ellipsoid(cx, cy, r * 0.52, r * 0.52, 'mostaza', { dither: 0, bias: -0.2 });
  const x = Math.round(cx - 0.5);
  const y = Math.round(cy - 0.5);
  const turns = [[[0, -1], [0, 1]], [[1, -1], [-1, 1]], [[-1, 0], [1, 0]], [[-1, -1], [1, 1]]] as const;
  for (const [dx, dy] of turns[spin % 4]!) p.px(x + dx, y + dy, 'mostaza', 5);
  p.raw(x, y, INK);
}

/**
 * The forklift: a small electric one, nose to the right, the face on the front of its cab. `mood`:
 * 0 calm (bored headlight eyes under the visor), 1 about to ram (beacon lit, forks up, brows down,
 * the grille open), 2 bonked into a wall (forks bent up, dizzy X eyes, beacon out, a spring loose).
 * `bob` shakes the body over the wheels (the motor), `spin` turns the hubs.
 */
export function makeCarretillaNueva(spin = 0, bob = 0, mood: 0 | 1 | 2 = 0): Canvas {
  const p = new Paint(FORK_W, FORK_H);
  const F = FORK_FEET;
  // The mast: two steel rails in front of the cab, from the roof guard to the floor (not bobbing).
  p.rect(36, 8, 2, 35, 'acero', 2);
  p.rect(36, 8, 1, 35, 'acero', 1);
  p.rect(38, 9, 1, 34, 'acero', 4);
  for (let y = 12; y < 42; y += 6) p.px(37, y, 'acero', 5);
  // The forks: an L off the carriage; raised before ramming, bent up after a wall.
  const fy = F.y - 1 - (mood === 1 ? FORK_TINE_HIGH : FORK_TINE_LOW);
  p.rect(38, fy - 5, 3, 6, 'acero', 3);
  p.rect(38, fy - 5, 3, 1, 'acero', 1);
  if (mood === 2) {
    p.rect(41, fy, 3, 1, 'acero', 2);
    p.rect(43, fy - 3, 1, 3, 'acero', 2);
    p.px(44, fy - 4, 'acero', 1);
  } else {
    p.rect(41, fy, 5, 1, 'acero', 1);
    p.rect(41, fy + 1, 5, 1, 'acero', 4);
    p.raw(45, fy, SHINE);
  }
  const b = new Paint(FORK_W, FORK_H);
  // The body: a long mustard box, its side towards you.
  const { fx: bx } = box34(b, 6, 25, 27, 12, 4, 'mostaza', { top: [1, 2], side: [5, 4], front: [2, 3, 4] });
  // The counterweight at the back: cast iron with the hazard stripe.
  b.rect(1, 22, 8, 15, 'goma', 3);
  b.rect(1, 22, 8, 1, 'goma', 1);
  b.rect(1, 22, 1, 15, 'goma', 2);
  b.rect(8, 22, 1, 15, 'goma', 5);
  for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) {
    if (((i + j) >> 1) % 2 === 0) b.px(2 + i, 26 + j, 'amarillo', 1);
    else b.raw(2 + i, 26 + j, INK);
  }
  // The green «APTO» sticker of the Servicio Técnico, a little skew, and a scrape to the primer.
  b.rect(bx + 2, 29, 5, 4, 'verde', 2);
  b.rect(bx + 2, 29, 5, 1, 'verde', 1);
  b.px(bx + 3, 31, 'verde', 0);
  b.px(bx + 4, 32, 'verde', 0);
  b.px(bx + 5, 30, 'verde', 0);
  b.rect(bx + 11, 33, 4, 1, 'mostaza', 5);
  b.px(bx + 15, 32, 'mostaza', 0);
  b.px(bx + 21, 30, 'mostaza', 4);
  // The cab: its head, a box with the face on the front.
  const y0 = 11;
  const { fx } = box34(b, 13, y0, 20, 14, 4, 'mostaza');
  // The roof guard: a steel plate on posts, with the amber beacon on top.
  b.rect(11, 4, 24, 2, 'acero', 2);
  b.rect(11, 4, 24, 1, 'acero', 0);
  b.rect(11, 6, 1, 18, 'acero', 3);
  b.rect(33, 6, 1, 2, 'acero', 4);
  b.ellipsoid(23, 2.2, 2.6, 2.2, 'amarillo', { dither: 0, bias: mood === 1 ? 0.5 : -0.25 });
  if (mood === 1) for (const [x, y] of [[18, 1], [28, 1], [17, 0], [29, 0]] as const) b.px(x, y, 'amarillo', 1);
  // The face: a steel visor (its brows), two headlight eyes, the grille for a mouth.
  const ey = y0 + 4;
  for (const ex of [fx + 3, fx + 11]) {
    if (mood === 2) {
      for (const [dx, dy] of [[0, 0], [3, 0], [1, 1], [2, 1], [1, 2], [2, 2], [0, 3], [3, 3]] as const) b.raw(ex + dx, ey + dy, INK);
      continue;
    }
    b.ellipsoid(ex + 2, ey + 2, 2.4, 2.2, 'acero', { dither: 0 });
    b.rect(ex + 1, ey + 1, 2, 2, mood === 1 ? 'rojo' : 'crema', mood === 1 ? 1 : 0);
    b.raw(ex + 2, ey + 2, INK);
    // Lids of the cab's colour: half shut, bored.
    if (mood === 0) b.rect(ex, ey, 5, 2, 'mostaza', 3);
  }
  // The visor: straight when bored, down to the middle when it means it.
  for (let i = 0; i < 15; i++) {
    const x = fx + 2 + i;
    const dy = mood === 1 ? (i < 7 ? Math.min(2, i >> 1) : Math.min(2, (14 - i) >> 1)) : 0;
    b.px(x, ey - 2 + dy, 'acero', 4);
    b.px(x, ey - 3 + dy, 'acero', 2);
  }
  // The grille: three slots; open when it means it.
  const my = ey + 7;
  if (mood === 1) {
    b.rect(fx + 5, my, 9, 3, 'mostaza', 6);
    for (let x = fx + 6; x <= fx + 12; x += 2) b.px(x, my, 'acero', 0);
  } else {
    for (let x = fx + 5; x <= fx + 11; x += 3) b.rect(x, my, 2, 2, 'mostaza', 6);
    if (mood === 2) b.rect(fx + 7, my + 2, 4, 1, 'mostaza', 6);
  }
  // The lockout tag nobody read: a red card on a wire from the mast, «FUERA DE SERVICIO».
  b.px(39, 11, 'acero', 4);
  b.px(40, 12, 'acero', 4);
  b.rect(39, 13, 6, 8, 'rojo', 2);
  b.rect(39, 13, 6, 1, 'rojo', 1);
  b.rect(44, 14, 1, 7, 'rojo', 4);
  b.rect(40, 15, 4, 1, 'crema', 0);
  b.rect(40, 17, 3, 1, 'crema', 1);
  b.px(41, 19, 'rojo', 0);
  // Blue nitrile gloves: one floating behind the cab, one on the lift lever (up with the forks).
  glove(b, 4, 13 + (mood === 2 ? 4 : 0), 'azul');
  glove(b, 32, mood === 1 ? 21 : 25, 'azul');
  if (mood === 2) for (const [x, y] of [[30, 3], [31, 2], [30, 1], [31, 0]] as const) b.px(x, y, 'acero', 1);
  p.stamp(b, 0, bob);
  // Wheels last (they don't bob): a big drive wheel at the back, a small one under the mast.
  wheel(p, 14, 38.5, 5.5, spin);
  wheel(p, 31, 39.5, 4.5, spin + 1);
  return p.outline();
}

/** Its sheet (taller.ts FORK_FRAMES): 0-1 idling (the motor shakes it), 2-5 rolling, 6 about to ram, 7 bonked. */
export function makeCarretillaNuevaFrames(): Canvas[] {
  return [
    makeCarretillaNueva(0, 0),
    makeCarretillaNueva(0, 1),
    makeCarretillaNueva(0, 0),
    makeCarretillaNueva(1, 1),
    makeCarretillaNueva(2, 0),
    makeCarretillaNueva(3, 1),
    makeCarretillaNueva(0, 0, 1),
    makeCarretillaNueva(0, 0, 2),
  ];
}
