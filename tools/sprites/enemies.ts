// New enemies drawn after the approved set, by the same rules (docs/ESTILO_ARTE.md): 3/4 cube
// heads looking right, floating 3x3 hands, short legs with their own shoes, 1 px outline.
import { Canvas } from '../../src/art/canvas.ts';
import { CREAM, DSTEEL, K, RED, RUBBER, RUSTR, SMOKE, STEEL, WHITE, YEL, box, cube, feet, hand, outline, pad, ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

/** Seventies kitchen green, for the hand mixer's casing. */
const MINT = ramp('#cde7bf', '#93bf86', '#679463', '#456a48');
const MINT_SIDE = ramp('#679463', '#527d52', '#3d5f40', '#29412d');
const MINT_TOP = ramp('#e6f4dc', '#cde7bf', '#93bf86', '#679463');
const BATTER = ramp('#fff6e0', '#f2dfb4', '#d9bd86', '#a88d5e');

/**
 * Batidora de Mano: a hand mixer with a carrying handle on its head, wild uneven eyes and gritted
 * teeth. Its two beaters hang in front, crusted with old batter. Jokes: a 5-speed slider stuck on
 * the red TURBO notch, and the cord tied in a knot behind it. `spin` (0-3) turns the beaters.
 * 32x36 (+2 px on top for the handle).
 */
export function makeBatidora(spin = 0): Canvas {
  const cv = new Canvas(32, 36);
  hand(cv, 4, 20, MINT);
  feet(cv, 8, 13, 24, { L: 4, shoe: RUBBER });
  box(cv, 8, 19, 10, 5, DSTEEL);
  cv.rect(8, 21, 10, 1, MINT[2]!);
  // Carrying handle: a loop on top of the head.
  cv.rect(7, 1, 13, 2, MINT_SIDE[1]!);
  cv.rect(7, 1, 13, 1, MINT[1]!);
  cv.rect(7, 1, 2, 5, MINT_SIDE[1]!);
  cv.rect(18, 1, 2, 5, MINT_SIDE[2]!);
  cv.rect(10, 1, 6, 1, MINT[0]!);
  cube(cv, 2, 5, 23, 15, 5, 3, MINT, MINT_SIDE, MINT_TOP);
  // Speed slider on the side: five notches, the knob jammed on the red one at the top.
  cv.rect(3, 9, 1, 8, K);
  for (const y of [10, 12, 14, 16]) cv.set(4, y, MINT_SIDE[3]!);
  cv.rect(2, 8, 3, 2, RED[1]!);
  cv.set(2, 8, RED[0]!);
  // Eyes: the back one small and narrowed, the front one wide open. Brows slant to the middle.
  cv.rect(12, 10, 3, 3, K);
  cv.set(13, 11, WHITE);
  cv.rect(11, 9, 4, 1, K);
  cv.rect(18, 9, 4, 4, K);
  cv.set(20, 10, WHITE);
  cv.set(19, 8, K);
  cv.set(18, 8, K);
  cv.rect(20, 8, 3, 1, K);
  cv.set(22, 9, MINT[1]!);
  // Gritted teeth, the mouth pulled down at the front in a snarl.
  cv.rect(14, 14, 8, 4, K);
  cv.rect(15, 15, 6, 1, WHITE);
  cv.rect(15, 16, 5, 1, CREAM[1]!);
  for (const x of [17, 19]) cv.rect(x, 15, 1, 2, K);
  cv.set(22, 17, K);
  cv.set(13, 14, K);
  // Heavy lids on both eyes.
  cv.set(14, 10, MINT[1]!);
  cv.rect(18, 9, 2, 1, MINT[1]!);
  // Vents and wear.
  for (const x of [8, 10]) cv.rect(x, 9, 1, 3, MINT[2]!);
  const rust: Pt[] = [[24, 9], [9, 17], [6, 6]];
  for (const [x, y] of rust) cv.set(x, y, RUSTR[1]!);
  // Beater sockets under the chin and the two beaters, with batter stuck on.
  cv.rect(19, 20, 7, 1, DSTEEL[2]!);
  for (const bx of [19, 23]) {
    cv.rect(bx + 1, 21, 1, 2, STEEL[2]!);
    // Each beater is a loop of wire seen from the side; spin moves its bright edge.
    cv.rect(bx, 23, 3, 6, STEEL[3]!);
    cv.rect(bx + 1, 24, 1, 4, K);
    const lit = (spin + (bx === 23 ? 2 : 0)) % 4;
    if (lit === 0) cv.rect(bx, 23, 1, 6, STEEL[0]!);
    else if (lit === 1) cv.rect(bx + 1, 23, 1, 1, STEEL[0]!);
    else if (lit === 2) cv.rect(bx + 2, 23, 1, 6, STEEL[0]!);
    else cv.rect(bx + 1, 28, 1, 1, STEEL[0]!);
    cv.rect(bx, 29, 3, 1, STEEL[2]!);
  }
  const batter: Pt[] = [[19, 27], [20, 29], [24, 25], [25, 26], [23, 29], [24, 30]];
  for (const [x, y] of batter) cv.set(x, y, BATTER[1]!);
  cv.set(24, 29, BATTER[0]!);
  hand(cv, 16, 21, MINT);
  let o = outline(cv);
  // Cord out of its back, tied in a knot.
  const cord: Pt[] = [[1, 16], [0, 17], [0, 18], [1, 19], [2, 19], [2, 18], [1, 18], [0, 20], [0, 21], [1, 22]];
  for (const [x, y] of cord) o.set(x, y, K);
  o.set(1, 23, YEL[2]!);
  o = pad(o, 2);
  // A fleck of batter flying off the beaters on every other frame.
  if (spin % 2 === 1) o.set(28, 26, BATTER[0]!);
  else o.set(27, 33, SMOKE[1]!);
  return o;
}

/** Four frames of the mixer with its beaters turning. */
export function makeBatidoraFrames(): Canvas[] {
  return [0, 1, 2, 3].map((k) => makeBatidora(k));
}
