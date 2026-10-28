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

/** Remote-control plastic: charcoal with a blue cast, light enough to read against the outline. */
const REMOTE = ramp('#a0a6be', '#737992', '#555b75', '#3b3f57');
const REMOTE_SIDE = ramp('#5d6380', '#484d68', '#363a52', '#24273a');
const REMOTE_TOP = ramp('#c4c9da', '#a0a6be', '#7e849e', '#5d6380');
/** Checked house slippers: it lives on the sofa. */
const SLIPPER = ramp('#c98a6a', '#9c5f4a', '#6e3f35', '#4a2a26');
const BUTTON = ramp('#d6cdb2', '#a89f86', '#756e5a', '#4a4538');

/**
 * Mando a Distancia: a TV remote standing on its end, in house slippers. Shifty eyes looking
 * sideways under heavy lids and a smug half-smile; the dark-red infrared window is its forehead and
 * the power button sits on top of its head. Jokes: the battery cover is gone (two batteries held in
 * with a strip of tape), the «1» button is missing, and there is a cheese puff stuck to its head from
 * years between the sofa cushions. `bob` (0-1) lifts the body 1 px for the idle breath.
 * 22x32.
 */
export function makeMando(bob = 0): Canvas {
  const cv = new Canvas(22, 30);
  const u = -bob;
  hand(cv, 2, 15 + u, REMOTE);
  feet(cv, 7, 11, 23, { L: 4, leg: REMOTE_SIDE, shoe: SLIPPER });
  // Slipper check pattern.
  cv.set(12, 27, SLIPPER[3]!);
  cv.set(14, 27, SLIPPER[3]!);
  cv.set(8, 27, SLIPPER[3]!);
  cube(cv, 5, 2 + u, 12, 21, 4, 2, REMOTE, REMOTE_SIDE, REMOTE_TOP);
  // Power button on top of the head.
  cv.rect(13, 2 + u, 2, 1, RED[1]!);
  cv.set(13, 2 + u, RED[0]!);
  // Infrared window across the forehead.
  cv.rect(9, 5 + u, 7, 2, RED[3]!);
  cv.rect(9, 5 + u, 7, 1, RED[2]!);
  cv.set(10, 5 + u, RED[0]!);
  // Eyes looking sideways (the shine on the far edge), lids half down: smug.
  cv.rect(10, 8 + u, 2, 3, K);
  cv.set(11, 9 + u, WHITE);
  cv.rect(10, 8 + u, 2, 1, REMOTE[2]!);
  cv.rect(13, 8 + u, 3, 3, K);
  cv.set(15, 9 + u, WHITE);
  cv.rect(13, 8 + u, 3, 1, REMOTE[2]!);
  // Half-smile, pulled up at the front.
  cv.rect(11, 12 + u, 4, 1, K);
  cv.set(15, 11 + u, K);
  // Button grid: rows of rubber buttons; the top-left one (the «1») is just a hole.
  for (const y of [14, 16, 18]) {
    for (const x of [10, 12, 14]) {
      cv.set(x, y + u, BUTTON[1]!);
      cv.set(x, y + 1 + u, BUTTON[2]!);
    }
  }
  cv.set(10, 14 + u, K);
  cv.set(10, 15 + u, REMOTE[3]!);
  // Volume rocker, long and worn shiny from use.
  cv.rect(12, 20 + u, 3, 1, BUTTON[0]!);
  // Back: no battery cover, two batteries and a strip of tape holding them in.
  cv.rect(6, 7 + u, 2, 14, REMOTE_SIDE[3]!);
  cv.rect(6, 8 + u, 1, 12, YEL[1]!);
  cv.rect(7, 8 + u, 1, 12, YEL[2]!);
  cv.set(6, 8 + u, STEEL[0]!);
  cv.set(7, 19 + u, STEEL[2]!);
  cv.rect(5, 12 + u, 4, 2, CREAM[0]!);
  cv.set(8, 13 + u, CREAM[2]!);
  // A cheese puff stuck to the top of its head, and a scratch.
  cv.rect(8, 2 + u, 3, 1, RUSTR[0]!);
  cv.set(9, 1 + u, YEL[2]!);
  cv.set(10, 2 + u, RUSTR[1]!);
  cv.set(16, 6 + u, REMOTE[0]!);
  hand(cv, 17, 16 + u, REMOTE);
  return pad(outline(cv), 2);
}

/** Two idle frames of the remote (it breathes). */
export function makeMandoFrames(): Canvas[] {
  return [makeMando(0), makeMando(1)];
}
