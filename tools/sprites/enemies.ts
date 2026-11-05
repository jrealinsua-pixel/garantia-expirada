// New enemies drawn after the approved set, by the same rules (docs/ESTILO_ARTE.md): 3/4 cube
// heads looking right, floating 3x3 hands, short legs with their own shoes, 1 px outline.
import { Canvas, hx } from '../../src/art/canvas.ts';
import { joinPose, narrowPoseCycle, poseCycle, poseFeet, type Pose } from './pose.ts';
import {
  BLUE, BURNT, CREAM, type Ramp, CYAN, GREEN, DSTEEL, K, OFFICE, PANTL, PINK, RED, RUBBER, RUSTR, SMOKE, STEEL, WHITE, YEL, box, clear, cube, ellipse, feet, hand, outline, pad, ramp,
} from '../../src/art/lib.ts';

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
export function makeBatidora(spin = 0, pose: Pose = { xb: BATIDORA_LEGS[0], xf: BATIDORA_LEGS[1], bob: 0 }): Canvas {
  const legs = new Canvas(32, 36);
  const cv = new Canvas(32, 36);
  hand(cv, 4, 20, MINT);
  poseFeet(legs, pose, 24, { L: 4, shoe: RUBBER });
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
  let o = outline(joinPose(legs, cv, pose));
  // Cord out of its back, tied in a knot.
  const cord: Pt[] = [[1, 16], [0, 17], [0, 18], [1, 19], [2, 19], [2, 18], [1, 18], [0, 20], [0, 21], [1, 22]];
  for (const [x, y] of cord) o.set(x, y + pose.bob, K);
  o.set(1, 23 + pose.bob, YEL[2]!);
  o = pad(o, 2);
  // A fleck of batter flying off the beaters on every other frame.
  if (spin % 2 === 1) o.set(28, 26 + pose.bob, BATTER[0]!);
  else o.set(27, 33, SMOKE[1]!);
  return o;
}

export const BATIDORA_LEGS = [8, 13] as const;

/**
 * The mixer's frames: 0-3 standing with its beaters turning (winding up, braking), 4-7 running
 * after you, a step of the walk cycle and a quarter turn of the beaters in each.
 */
export function makeBatidoraFrames(): Canvas[] {
  const walk = poseCycle(BATIDORA_LEGS[0], BATIDORA_LEGS[1]).slice(2);
  return [...[0, 1, 2, 3].map((k) => makeBatidora(k)), ...walk.map((f, k) => makeBatidora(k, f.pose))];
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
export function makeMando(bob = 0, legs: readonly [number, number] = MANDO_LEGS, lift?: Pose['lift']): Canvas {
  const cv = new Canvas(22, 30);
  const u = -bob;
  const [xb, xf] = legs;
  hand(cv, 2, 15 + u, REMOTE);
  poseFeet(cv, { xb, xf, bob: u, ...(lift ? { lift } : {}) }, 23, { L: 4, leg: REMOTE_SIDE, shoe: SLIPPER });
  // Slipper check pattern (on the lifted slipper too).
  const yb = 27 - (lift?.leg === -1 ? lift.px : 0);
  const yf = 27 - (lift?.leg === 1 ? lift.px : 0);
  cv.set(xf + 1, yf, SLIPPER[3]!);
  cv.set(xf + 3, yf, SLIPPER[3]!);
  cv.set(xb + 1, yb, SLIPPER[3]!);
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

export const MANDO_LEGS = [7, 11] as const;

/**
 * The remote's frames: 0-1 breathing, 2-5 shuffling sideways around you in its slippers. Its legs
 * are only 4 px apart, so on the passing steps they don't cross: the swinging slipper comes off
 * the floor (`narrowPoseCycle`).
 */
export function makeMandoFrames(): Canvas[] {
  const walk = narrowPoseCycle(MANDO_LEGS[0], MANDO_LEGS[1]).slice(2);
  return [makeMando(0), makeMando(1), ...walk.map((f) => makeMando(-f.pose.bob, [f.pose.xb, f.pose.xf], f.pose.lift))];
}

/** Office printer beige, yellowed by the years next to the window. */
const PRINTER = ramp('#ece4cc', '#d2c7a6', '#aa9e7e', '#7b7058');
const PRINTER_SIDE = ramp('#aa9e7e', '#91856a', '#736950', '#514a3a');
const PRINTER_TOP = ramp('#f7f1df', '#ece4cc', '#d2c7a6', '#aa9e7e');
const LCD = ramp('#b9e6a0', '#7fbf6a', '#4f8a48', '#2f5a33');

/**
 * Impresora que se Atasca: an office printer with a stack of paper sticking up at the back, the
 * output slot for a mouth and an invoice hanging out of it (white, red border: it only prints
 * invoices). Tired, resentful eyes; a little LCD on its front says ERR. Jokes: a yellow post-it
 * on its side («NO»), a red price tag for the ink («39,99») and black office shoes. `jam` (0-1)
 * draws it jammed: shaken 1 px left or right, the invoice crumpled in its mouth, eyes squeezed
 * shut and the light red. 34x32.
 */
export function makeImpresora(pose: Pose = { xb: PRINTER_LEGS[0], xf: PRINTER_LEGS[1], bob: 0 }, jam?: 0 | 1): Canvas {
  const legs = new Canvas(34, 30);
  const cv = new Canvas(34, 30);
  const jx = jam === undefined ? 0 : jam === 0 ? -1 : 1;
  poseFeet(legs, pose, 23, { L: 4, leg: PANTL, shoe: OFFICE });
  hand(cv, 2 + jx, 16, PRINTER);
  // Paper stack in the input tray, behind the top: three sheets, the front one with print lines.
  cv.rect(7 + jx, 0, 13, 7, WHITE);
  cv.rect(8 + jx, 1, 11, 1, CREAM[1]!);
  for (const y of [3, 5]) cv.rect(9 + jx, y, 8, 1, CREAM[2]!);
  cv.rect(6 + jx, 2, 1, 5, CREAM[2]!);
  cube(cv, 3 + jx, 5, 27, 18, 5, 4, PRINTER, PRINTER_SIDE, PRINTER_TOP);
  // Feed slot along the top where the tray goes in.
  cv.rect(10 + jx, 6, 15, 1, PRINTER[3]!);
  // Eyes on the front face: back one smaller, both with heavy lids; jammed, squeezed shut.
  if (jam === undefined) {
    cv.rect(13 + jx, 10, 3, 3, K);
    cv.set(14 + jx, 11, WHITE);
    cv.rect(13 + jx, 10, 3, 1, PRINTER[2]!);
    cv.rect(19 + jx, 10, 4, 3, K);
    cv.set(21 + jx, 11, WHITE);
    cv.rect(19 + jx, 10, 4, 1, PRINTER[2]!);
    // Brows slanting down to the middle: fed up with everyone.
    const brows: Pt[] = [[12, 8], [13, 8], [14, 9], [15, 9], [19, 9], [20, 9], [21, 8], [22, 8], [23, 8]];
    for (const [x, y] of brows) cv.set(x + jx, y, K);
  } else {
    // > <
    const shut: Pt[] = [[13, 10], [14, 11], [15, 12], [14, 12], [22, 10], [21, 11], [20, 12], [21, 12]];
    for (const [x, y] of shut) cv.set(x + jx, y, K);
  }
  // LCD on the front corner: ERR in three dark pixels, and the light beside it.
  cv.rect(25 + jx, 9, 4, 3, LCD[1]!);
  cv.rect(25 + jx, 9, 4, 1, LCD[0]!);
  cv.rect(26 + jx, 10, 2, 1, LCD[3]!);
  cv.set(27 + jx, 13, jam === undefined ? YEL[1]! : RED[1]!);
  // Output slot: the mouth, a dark letterbox across the front.
  cv.rect(11 + jx, 16, 17, 2, K);
  cv.rect(12 + jx, 17, 15, 1, PRINTER_SIDE[3]!);
  if (jam === undefined) {
    // An invoice hanging out: white with a thick red border, a total in the corner.
    cv.rect(15 + jx, 17, 10, 6, RED[1]!);
    cv.rect(16 + jx, 18, 8, 4, WHITE);
    cv.rect(17 + jx, 19, 5, 1, CREAM[2]!);
    cv.rect(20 + jx, 21, 3, 1, RED[2]!);
  } else {
    // Crumpled in the rollers: a zigzag of paper with red edges sticking out at odd angles.
    const crumple: Pt[] = [[14, 17], [15, 18], [16, 17], [17, 18], [18, 19], [19, 18], [20, 17], [21, 18], [22, 19], [23, 18], [24, 17], [25, 18]];
    for (const [x, y] of crumple) {
      cv.set(x + jx, y, WHITE);
      cv.set(x + jx, y + 1, x % 3 === 0 ? RED[1]! : CREAM[1]!);
    }
    cv.set(18 + jx, 20, WHITE);
    cv.set(23 + jx, 20, RED[1]!);
  }
  // Side: a yellow post-it saying NO, and a red price tag for the ink.
  cv.rect(4 + jx, 11, 3, 3, YEL[1]!);
  cv.set(4 + jx, 11, YEL[0]!);
  cv.rect(5 + jx, 12, 1, 1, YEL[3]!);
  cv.rect(4 + jx, 16, 3, 2, RED[1]!);
  cv.set(5 + jx, 17, WHITE);
  // Wear: a scuff on the top and a dent near the slot.
  cv.set(24 + jx, 7, PRINTER[3]!);
  cv.set(9 + jx, 19, RUSTR[1]!);
  hand(cv, 28 + jx, 17, PRINTER);
  return pad(outline(joinPose(legs, cv, pose)), 2);
}

export const PRINTER_LEGS = [11, 18] as const;

/** The printer's frames: 0-1 humming, 2-5 shuffling, 6-7 jammed and shaking. */
export function makeImpresoraFrames(): Canvas[] {
  return [...poseCycle(PRINTER_LEGS[0], PRINTER_LEGS[1]).map((f) => makeImpresora(f.pose)), makeImpresora(undefined, 0), makeImpresora(undefined, 1)];
}

/** Cheap white charger plastic, already a little yellow. */
const CHARGER = ramp('#f4f1e8', '#d8d4c6', '#aba696', '#7a7668');
const CHARGER_SIDE = ramp('#aba696', '#918c7d', '#757062', '#545046');
const CHARGER_TOP = ramp('#ffffff', '#f4f1e8', '#d8d4c6', '#aba696');

/**
 * Cargador Falso: a phone charger brick on short legs, its two metal prongs sticking up like horns
 * and a toothy grin. Its cable trails behind like a tail. Jokes: a scorch mark on its face (it
 * overheats), a yellow GRATIS tag tied to the cable, and grey flip-flops. `mood`: 0 rest, 1 humming
 * (a spark between the prongs), 2 found out (eyes wide, sparks). 22x26.
 */
export function makeCargador(pose: Pose = { xb: CHARGER_LEGS[0], xf: CHARGER_LEGS[1], bob: 0 }, mood: 0 | 1 | 2 = 0): Canvas {
  const legs = new Canvas(22, 24);
  const cv = new Canvas(22, 24);
  poseFeet(legs, pose, 18, { L: 3, leg: PANTL, shoe: RUBBER });
  hand(cv, 1, 12, CHARGER);
  // Prongs: two metal horns on top.
  for (const x of [9, 14]) {
    cv.rect(x, 3, 2, 3, STEEL[2]!);
    cv.rect(x, 3, 1, 3, STEEL[0]!);
  }
  cube(cv, 4, 5, 14, 13, 4, 3, CHARGER, CHARGER_SIDE, CHARGER_TOP);
  // Eyes: narrowed and shifty; found out, wide open.
  if (mood === 2) {
    cv.rect(9, 9, 3, 3, K);
    cv.set(10, 10, WHITE);
    cv.rect(13, 9, 3, 3, K);
    cv.set(14, 10, WHITE);
  } else {
    cv.rect(9, 10, 2, 2, K);
    cv.set(10, 10, WHITE);
    cv.rect(13, 10, 3, 2, K);
    cv.set(15, 10, WHITE);
    // Brows slanting down to the middle: up to no good.
    const brows: Pt[] = [[8, 8], [9, 8], [10, 9], [13, 9], [14, 8], [15, 8], [16, 8]];
    for (const [x, y] of brows) cv.set(x, y, K);
  }
  // Toothy grin across the front.
  cv.rect(9, 13, 8, 3, K);
  for (const x of [10, 12, 14]) cv.rect(x, 13, 1, 2, WHITE);
  cv.set(16, 12, K);
  // Scorch mark: it overheats.
  cv.set(16, 7, BURNT[1]!);
  cv.set(17, 8, BURNT[2]!);
  cv.set(16, 8, BURNT[0]!);
  hand(cv, 17, 13, CHARGER);
  let o = outline(joinPose(legs, cv, pose));
  // Cable tail out of its back, down to the floor, with the GRATIS tag tied on.
  const cable: Pt[] = [[3, 15], [2, 16], [1, 17], [1, 18], [1, 19], [2, 20], [3, 21]];
  for (const [x, y] of cable) o.set(x, y + (y < 18 ? pose.bob : 0), K);
  o.rect(0, 20, 2, 2, YEL[1]!);
  o.set(0, 20, YEL[0]!);
  // Sparks between the prongs.
  if (mood >= 1) {
    o.set(12, 4 + pose.bob, CYAN);
    o.set(11, 5 + pose.bob, WHITE);
    if (mood === 2) {
      o.set(13, 3 + pose.bob, CYAN);
      o.set(8, 2 + pose.bob, CYAN);
      o.set(17, 2 + pose.bob, CYAN);
    }
  }
  return pad(o, 2);
}

export const CHARGER_LEGS = [7, 12] as const;

/**
 * Lying in wait: just a charger dropped on the floor, on its side, prongs to the right, eyes shut
 * to a line, its cable coiled and the GRATIS tag showing. 22x26.
 */
export function makeCargadorBait(): Canvas {
  const cv = new Canvas(22, 26);
  box(cv, 4, 16, 13, 8, CHARGER);
  cv.rect(4, 16, 13, 2, CHARGER_TOP[1]!);
  cv.rect(4, 22, 13, 2, CHARGER_SIDE[1]!);
  for (const y of [18, 21]) {
    cv.rect(17, y, 4, 1, STEEL[1]!);
    cv.set(20, y, STEEL[2]!);
  }
  // Eyes shut: two dark slits (you only notice if you look).
  cv.rect(9, 19, 2, 1, CHARGER[3]!);
  cv.rect(13, 19, 2, 1, CHARGER[3]!);
  cv.set(15, 17, BURNT[1]!);
  let o = outline(cv);
  // Coiled cable and the tag.
  const coil: Pt[] = [[3, 21], [2, 22], [1, 23], [2, 24], [3, 24], [4, 25], [1, 25]];
  for (const [x, y] of coil) o.set(x, y, K);
  o.rect(0, 18, 3, 2, YEL[1]!);
  o.set(0, 18, YEL[0]!);
  o.set(1, 20, K);
  return o;
}

/** The fake charger's frames: 0-1 humming, 2-5 scuttling, 6 lying in wait, 7 found out. */
export function makeCargadorFrames(): Canvas[] {
  const cyc = narrowPoseCycle(CHARGER_LEGS[0], CHARGER_LEGS[1]);
  return [
    makeCargador(cyc[0]!.pose, 0),
    makeCargador(cyc[1]!.pose, 1),
    ...cyc.slice(2).map((f, k) => makeCargador(f.pose, (k % 2) as 0 | 1)),
    makeCargadorBait(),
    makeCargador({ xb: CHARGER_LEGS[0], xf: CHARGER_LEGS[1], bob: -2 }, 2),
  ];
}

/** Office mouse plastic: grey, with a darker underside. */
const MOUSE = ramp('#cfd3de', '#a3a9b9', '#7a8094', '#565b6d');
const MOUSE_SIDE = ramp('#6f7488', '#5a5f72', '#45495a', '#303342');
const MOUSE_TOP = ramp('#eef0f5', '#cfd3de', '#a3a9b9', '#7a8094');

/**
 * Ratón Inalámbrico sin Pilas: an office mouse on its glide pads, two buttons and a scroll wheel on
 * top, fed-up eyes on its front. Jokes: the low-battery light blinking red, the battery cover
 * gone and a cobweb in the empty slot, and its cable cut off with scissors to make it «wireless». `led` lights the red light; `frozen` is the no-signal frame: grey, the light
 * off and a loading spinner for eyes. 26x26.
 */
export function makeRaton(pose: Pose = { xb: MOUSE_LEGS[0], xf: MOUSE_LEGS[1], bob: 0 }, led = false, frozen = false): Canvas {
  const legs = new Canvas(26, 24);
  const cv = new Canvas(26, 24);
  poseFeet(legs, pose, 18, { L: 3, leg: PANTL, shoe: OFFICE });
  hand(cv, 1, 12, MOUSE);
  cube(cv, 4, 5, 18, 13, 5, 4, MOUSE, MOUSE_SIDE, MOUSE_TOP);
  // Rounded front-top corner.
  clear(cv, [[21, 5], [21, 6], [20, 5]]);
  // Buttons: two lighter pads on top, split down the middle, and the scroll wheel sticking up.
  cv.rect(10, 5, 10, 1, MOUSE_TOP[0]!);
  cv.rect(14, 4, 1, 5, MOUSE[3]!);
  cv.rect(13, 3, 3, 3, K);
  cv.rect(14, 3, 1, 2, DSTEEL[0]!);
  // Low-battery light on top.
  cv.set(18, 6, frozen ? MOUSE_SIDE[2]! : led ? RED[0]! : RED[3]!);
  if (frozen) {
    // No signal: a loading spinner where the eyes were.
    const ring: Pt[] = [[14, 10], [15, 10], [16, 11], [16, 12], [15, 13], [14, 13], [13, 12], [13, 11]];
    ring.forEach(([x, y], i) => cv.set(x, y, i < 3 ? WHITE : K));
  } else {
    // Fed-up eyes under brows pulled down to the middle, a flat mouth pulled to one side.
    cv.rect(11, 10, 2, 3, K);
    cv.set(12, 11, WHITE);
    cv.rect(16, 10, 3, 3, K);
    cv.set(18, 11, WHITE);
    const brows: Pt[] = [[10, 8], [11, 8], [12, 9], [16, 9], [17, 8], [18, 8], [19, 8]];
    for (const [x, y] of brows) cv.set(x, y, K);
    cv.rect(13, 15, 5, 1, K);
    cv.set(18, 14, K);
  }
  // Back: no battery cover, an empty slot with a cobweb.
  cv.rect(5, 10, 3, 6, MOUSE_SIDE[3]!);
  cv.set(5, 10, WHITE);
  cv.set(6, 11, MOUSE[1]!);
  cv.set(7, 12, WHITE);
  hand(cv, 21, 13, MOUSE);
  const o = outline(joinPose(legs, cv, pose));
  // Its tail: the cable, cut off with scissors to make it «wireless», copper showing at the end.
  const tail: Pt[] = [[3, 9], [2, 10], [1, 11], [1, 12], [0, 13]];
  for (const [x, y] of tail) o.set(x, y + pose.bob, K);
  o.set(0, 14 + pose.bob, RUSTR[0]!);
  o.set(1, 14 + pose.bob, YEL[2]!);
  return pad(o, 2);
}

export const MOUSE_LEGS = [9, 15] as const;

/** The mouse's frames: 0-1 breathing (the light blinks), 2-5 gliding, 6 frozen without signal. */
export function makeRatonFrames(): Canvas[] {
  const cyc = poseCycle(MOUSE_LEGS[0], MOUSE_LEGS[1]);
  return [...cyc.map((f, k) => makeRaton(f.pose, k === 1 || k === 3 || k === 5)), makeRaton(undefined, false, true)];
}

/** Webcam plastic: charcoal, with a lighter top so it reads on the dark floor. */
const CAM = ramp('#8a8fa6', '#5b6078', '#41455a', '#2a2d3e');
const CAM_SIDE = ramp('#4c5066', '#3b3f52', '#2d3042', '#1d1f2e');
const CAM_TOP = ramp('#b9bdcd', '#8a8fa6', '#5b6078', '#41455a');

export const WEBCAM_LEGS = [9, 14] as const;

/**
 * Webcam Siempre Encendida: a webcam bar on its monitor clip, its one big lens for an eye under the
 * privacy shutter, slid half down like a suspicious eyelid. Jokes: the «not recording» light, dead
 * and cracked; the piece of tape someone stuck over it, peeled off and hanging from its side; and a
 * USB tail ending in a plug. `look` (0-1) shifts the iris (the lens refocusing); `rec` is the
 * recording frame: shutter up, lens wide open and red inside (the light stays off: that's the joke).
 * 26x30.
 */
export function makeWebcam(pose: Pose = { xb: WEBCAM_LEGS[0], xf: WEBCAM_LEGS[1], bob: 0 }, look = 0, rec = false): Canvas {
  const legs = new Canvas(26, 28);
  const cv = new Canvas(26, 28);
  poseFeet(legs, pose, 22, { L: 3, leg: PANTL, shoe: OFFICE });
  // The monitor clip it stands on: a hinged neck down to the legs.
  box(cv, 10, 17, 6, 6, CAM_SIDE);
  cv.rect(10, 19, 6, 1, CAM_SIDE[3]!);
  cv.set(15, 18, DSTEEL[0]!);
  hand(cv, 2, 16, CAM);
  cube(cv, 3, 2, 21, 16, 5, 3, CAM, CAM_SIDE, CAM_TOP);
  // Rounded ends, like a real webcam bar.
  clear(cv, [[23, 5], [23, 17], [22, 17], [3, 16], [3, 6]]);
  // Lens: a silver bezel, dark glass and the iris (blue, or red while recording).
  const cx = 16;
  const cy = 11;
  ellipse(cv, cx, cy, 5.4, 5, STEEL[1]!);
  ellipse(cv, cx + 0.6, cy + 0.6, 4.6, 4.2, STEEL[2]!);
  ellipse(cv, cx, cy, 4.1, 3.8, K);
  if (rec) {
    ellipse(cv, cx, cy, 3, 2.8, RED[2]!);
    ellipse(cv, cx, cy, 2, 1.9, RED[1]!);
    cv.rect(cx - 1, cy - 1, 2, 2, RED[0]!);
    cv.set(cx, cy, K);
    cv.set(cx - 2, cy - 2, WHITE);
    cv.set(cx - 1, cy - 2, WHITE);
  } else {
    ellipse(cv, cx, cy, 2.6, 2.4, BLUE[3]!);
    const ix = cx + look;
    cv.rect(ix - 1, cy - 1, 3, 3, BLUE[1]!);
    cv.set(ix, cy, K);
    cv.set(ix + 1, cy, K);
    cv.set(ix - 1, cy - 1, WHITE);
    // The privacy shutter, slid half down over the lens: a heavy lid, lower towards the front.
    for (let x = cx - 5; x <= cx + 5; x++) {
      const rows = x < cx - 1 ? 3 : 4;
      cv.rect(x, cy - 5, 1, rows, CAM_TOP[1]!);
      cv.set(x, cy - 5 + rows - 1, CAM[3]!);
      cv.set(x, cy - 5, CAM_TOP[0]!);
    }
  }
  // Microphone holes under the lens.
  for (const x of [10, 12, 20, 22]) cv.set(x, 15, CAM[3]!);
  // The «not recording» light: dead and cracked, recording or not.
  cv.rect(21, 4, 2, 1, DSTEEL[1]!);
  cv.set(22, 4, K);
  // Its side: the tape someone stuck over the lens, peeled off and hanging.
  cv.rect(5, 6, 3, 2, CREAM[0]!);
  cv.set(7, 7, CREAM[1]!);
  cv.rect(5, 8, 2, 4, CREAM[1]!);
  cv.set(5, 11, CREAM[2]!);
  hand(cv, 21, 17, CAM);
  const o = outline(joinPose(legs, cv, pose));
  // USB tail: out of the back, down to the floor, ending in the plug.
  const tail: Pt[] = [[2, 13], [1, 14], [1, 15], [1, 16], [0, 17], [0, 18], [0, 19]];
  for (const [x, y] of tail) o.set(x, y + pose.bob, K);
  o.set(0, 20 + pose.bob, STEEL[1]!);
  o.set(1, 20 + pose.bob, STEEL[2]!);
  o.set(0, 21 + pose.bob, STEEL[2]!);
  return pad(o, 2);
}

/** The webcam's frames: 0-1 looking about, 2-5 tiptoeing on its clip, 6 recording. */
export function makeWebcamFrames(): Canvas[] {
  const cyc = narrowPoseCycle(WEBCAM_LEGS[0], WEBCAM_LEGS[1]);
  return [...cyc.map((f, k) => makeWebcam(f.pose, k === 1 || k === 4 ? -1 : 0)), makeWebcam(undefined, 0, true)];
}

/** Faded tin, painted a toy blue-green long ago and chipped down to the metal here and there. */
const TIN = ramp('#a7c9c0', '#6f9f97', '#4c7570', '#324f4d');
const TIN_SIDE = ramp('#4c7570', '#3d625e', '#2f4d4a', '#213735');
const TIN_TOP = ramp('#cfe4dc', '#a7c9c0', '#6f9f97', '#4c7570');
/** The red tin of its feet (stamped, with the paint worn off the toes). */
const TIN_RED = ramp('#e07a62', '#b94a3c', '#86323a', '#5a2130');

/**
 * The wind-up key on its back, seen from the side as it turns: 0 the bow face-on (a brass figure
 * of eight), 1 edge-on (a line), 2 halfway (a slanted loop). The shaft goes into the body at (4, y).
 */
function windKey(cv: Canvas, y: number, turn: number): void {
  const k = ((turn % 3) + 3) % 3;
  cv.rect(2, y, 3, 1, YEL[2]!);
  cv.set(2, y, YEL[3]!);
  if (k === 0) {
    const bow: Pt[] = [[0, y - 4], [1, y - 4], [0, y - 3], [1, y - 3], [0, y - 2], [1, y - 1], [0, y + 1], [1, y + 1], [0, y + 2], [1, y + 3], [0, y + 3], [0, y + 4], [1, y + 4]];
    for (const [x, yy] of bow) cv.set(x, yy, YEL[1]!);
    cv.set(1, y - 2, YEL[3]!);
    cv.set(1, y + 2, YEL[3]!);
    cv.set(0, y - 4, YEL[0]!);
    cv.rect(1, y, 1, 1, YEL[2]!);
  } else if (k === 1) {
    cv.rect(1, y - 4, 1, 9, YEL[2]!);
    cv.set(1, y - 4, YEL[0]!);
  } else {
    const bow: Pt[] = [[1, y - 3], [0, y - 2], [1, y - 1], [1, y + 1], [2, y + 2], [1, y + 3]];
    for (const [x, yy] of bow) cv.set(x, yy, YEL[1]!);
    cv.set(1, y - 3, YEL[0]!);
  }
}

/**
 * Robot de Cuerda: an old tin wind-up robot, a big dented box of a head and body in one, a mouth
 * grille and an antenna bent to one side. One eye is a sour little eye under a heavy lid; the
 * other, a screw (it lost the real one). Jokes: the key on its back held on with a strip of white
 * sticking plaster, and the age label on its side, «3+» scratched to «33+». `key` (0-2) turns the
 * key; `mood`: 0 wound (glaring), 1 run down (eyes half shut, antenna drooping), 2 winding itself up
 * (eyes squeezed, shaken `jx` px). 27x31.
 */
export function makeRobot(pose: Pose = { xb: ROBOT_LEGS[0], xf: ROBOT_LEGS[1], bob: 0 }, key = 0, mood: 0 | 1 | 2 = 0, jx = 0): Canvas {
  const legs = new Canvas(26, 30);
  const cv = new Canvas(26, 30);
  poseFeet(legs, pose, 24, { L: 3, leg: DSTEEL, shoe: TIN_RED });
  hand(cv, 3 + jx, 18, TIN);
  // Antenna: a rod out of the top with a ball, bent (and drooping when run down).
  if (mood === 1) {
    const rod: Pt[] = [[15, 4], [15, 3], [16, 2], [17, 2], [18, 3]];
    for (const [x, y] of rod) cv.set(x + jx, y, STEEL[2]!);
    cv.rect(19 + jx, 3, 2, 2, RED[2]!);
  } else {
    const rod: Pt[] = [[15, 5], [15, 4], [15, 3], [16, 2], [17, 1]];
    for (const [x, y] of rod) cv.set(x + jx, y, STEEL[2]!);
    cv.rect(17 + jx, 0, 2, 2, RED[1]!);
    cv.set(17 + jx, 0, RED[0]!);
  }
  cube(cv, 4 + jx, 5, 19, 19, 4, 3, TIN, TIN_SIDE, TIN_TOP);
  // A dent in the top front corner, and the paint chipped down to the tin.
  cv.set(20 + jx, 8, TIN[3]!);
  cv.set(21 + jx, 8, TIN[2]!);
  cv.set(20 + jx, 9, TIN[0]!);
  for (const [x, y] of [[9, 21], [22, 13], [12, 6]] as Pt[]) cv.set(x + jx, y, STEEL[1]!);
  // Rivets in the corners of its front.
  for (const [x, y] of [[9, 9], [21, 10], [9, 20], [21, 20]] as Pt[]) cv.set(x + jx, y, TIN[3]!);
  // Eyes: the back one small and sour under a heavy lid; the front one a screw head with its slot.
  const ex = 11 + jx;
  const sx = 18 + jx;
  if (mood === 2) {
    const shut: Pt[] = [[ex, 11], [ex + 1, 12], [ex + 2, 13], [ex + 1, 13]];
    for (const [x, y] of shut) cv.set(x, y, K);
  } else {
    cv.rect(ex, 11, 3, 3, K);
    cv.set(ex + 1, 12, WHITE);
    cv.rect(ex, 11, 3, mood === 1 ? 2 : 1, TIN[2]!);
  }
  ellipse(cv, sx, 12, 2.2, 2.2, STEEL[1]!);
  cv.set(sx - 1, 11, STEEL[0]!);
  cv.set(sx + 1, 13, STEEL[3]!);
  if (mood === 1) cv.rect(sx - 1, 12, 3, 1, K);
  else {
    cv.set(sx - 1, 13, K);
    cv.set(sx, 12, K);
    cv.set(sx + 1, 11, K);
  }
  // Brows: one slanting down to the middle, a crease over the screw.
  if (mood === 0) {
    const brows: Pt[] = [[10, 9], [11, 9], [12, 10], [13, 10], [17, 9], [18, 9], [19, 9]];
    for (const [x, y] of brows) cv.set(x + jx, y, K);
  }
  // Mouth: a grille of tin teeth.
  cv.rect(11 + jx, 16, 10, 3, K);
  for (let x = 12; x <= 20; x += 2) cv.rect(x + jx, 16, 1, mood === 1 ? 2 : 3, STEEL[mood === 1 ? 2 : 1]!);
  // Its side: the age label, «3+» scratched to «33+», and the plaster holding the key on.
  cv.rect(5 + jx, 15, 3, 4, CREAM[0]!);
  cv.set(5 + jx, 16, K);
  cv.set(6 + jx, 16, K);
  cv.set(7 + jx, 17, RED[1]!);
  cv.set(5 + jx, 18, CREAM[2]!);
  cv.rect(4 + jx, 10, 3, 3, WHITE);
  cv.set(5 + jx, 11, CREAM[1]!);
  cv.set(6 + jx, 12, CREAM[2]!);
  windKey(cv, 11, key);
  hand(cv, 22 + jx, 19, TIN);
  // One px of room on the left (the key) and on top (the antenna) for the outline.
  const out = new Canvas(27, 31);
  out.blit(joinPose(legs, cv, pose), 1, 1);
  return outline(out);
}

export const ROBOT_LEGS = [9, 15] as const;

/**
 * The robot's frames: 0-1 standing (the key ticking over), 2-5 the stiff quick march with the key
 * turning, 6 run down (key still), 7-8 winding itself up (the key spins, it shakes).
 */
export function makeRobotFrames(): Canvas[] {
  const cyc = narrowPoseCycle(ROBOT_LEGS[0], ROBOT_LEGS[1]);
  return [
    ...cyc.map((f, k) => makeRobot(f.pose, k)),
    makeRobot({ xb: ROBOT_LEGS[0], xf: ROBOT_LEGS[1], bob: 1 }, 0, 1),
    makeRobot(undefined, 1, 2, -1),
    makeRobot(undefined, 2, 2, 1),
  ];
}

/** Cheap purple plastic, a little faded on top. */
const RCP = ramp('#c79be0', '#9a63c4', '#6f4196', '#4a2a68');
const RCP_SIDE = ramp('#8a55b4', '#7a4aa6', '#5e3586', '#3f2360');
const RCP_TOP = ramp('#e3c8f0', '#c79be0', '#9a63c4', '#6f4196');

/** A wheel at (cx, cy): `r` its size, the hub `hub` coloured, `spin` (0-1) turning its spokes. */
function rcWheel(cv: Canvas, cx: number, cy: number, r: number, hub: Ramp, spin: number): void {
  ellipse(cv, cx, cy, r, r, RUBBER[3]!);
  ellipse(cv, cx - 0.4, cy - 0.4, r - 1, r - 1, K);
  ellipse(cv, cx, cy, r - 1.6, r - 1.6, hub[1]!);
  cv.set(Math.round(cx) - 1, Math.round(cy) - 1, hub[0]!);
  const c: Pt = [Math.round(cx), Math.round(cy)];
  if (spin === 0) {
    cv.set(c[0], c[1] - 1, hub[3]!);
    cv.set(c[0], c[1] + 1, hub[3]!);
  } else {
    cv.set(c[0] - 1, c[1], hub[3]!);
    cv.set(c[0] + 1, c[1], hub[3]!);
  }
  cv.set(c[0], c[1], K);
}

/**
 * Coche Teledirigido: a plastic sports car seen from the side, nose to the right, with a bully's
 * face on its front bumper (the headlights glaring under heavy brows, the grille a grin of teeth).
 * Jokes: a bent antenna, a spoiler stuck on with tape, a peeling racing stripe and a front wheel
 * from another car (smaller, white). `spin` (0-1) turns the wheels and `bob` shakes the body (its
 * motor); `mood`: 0 cruising, 1 revving to ram (eyes red, mouth open), 2 overturned (drawn upside
 * down, dizzy), 3 batteries out (lights dead). 32x22.
 */
export function makeRcCar(spin = 0, bob = 0, mood: 0 | 1 | 2 | 3 = 0): Canvas {
  const cv = new Canvas(32, 22);
  const y = 1 + bob;
  // Bent antenna out of the back of the roof, and the spoiler on its taped post.
  const ant: Pt[] = [[11, 3], [11, 2], [10, 1], [9, 1], [8, 0]];
  for (const [x, yy] of ant) cv.set(x, yy + y, DSTEEL[0]!);
  cv.set(7, y, RED[1]!);
  cv.rect(2, 4 + y, 6, 2, RCP[2]!);
  cv.rect(2, 4 + y, 6, 1, RCP_TOP[0]!);
  cv.rect(4, 6 + y, 2, 2, RCP_SIDE[2]!);
  // The cabin: roof and dark windows with a glint.
  cv.rect(9, 3 + y, 11, 2, RCP_TOP[1]!);
  cv.rect(10, 3 + y, 9, 1, RCP_TOP[0]!);
  cv.rect(8, 5 + y, 14, 3, BLUE[3]!);
  cv.set(20, 5 + y, BLUE[2]!);
  cv.rect(21, 6 + y, 2, 2, BLUE[3]!);
  cv.rect(10, 5 + y, 3, 1, BLUE[1]!);
  cv.rect(15, 5 + y, 1, 3, RCP_SIDE[2]!);
  // The body: long side face on the left, the bumper (its face) on the right.
  cube(cv, 1, 7 + y, 30, 10, 23, 2, RCP, RCP_SIDE, RCP_TOP);
  // Tape holding the spoiler on: two white strips across the post.
  cv.rect(3, 7 + y, 4, 1, WHITE);
  cv.rect(3, 8 + y, 1, 1, CREAM[1]!);
  // Racing stripe, peeling at the back.
  cv.rect(6, 12 + y, 17, 1, YEL[1]!);
  cv.set(5, 13 + y, YEL[2]!);
  cv.set(11, 12 + y, RCP_SIDE[1]!);
  // Its face on the bumper: headlight eyes under brows, a grille of teeth.
  const fx = 24;
  const eye = mood === 1 ? RED[1]! : mood === 3 ? DSTEEL[1]! : YEL[0]!;
  if (mood === 2) {
    // Dizzy: X X.
    const xx: Pt[] = [[fx + 1, 11], [fx + 2, 12], [fx + 1, 12], [fx + 2, 11], [fx + 4, 11], [fx + 5, 12], [fx + 4, 12], [fx + 5, 11]];
    for (const [x, yy] of xx) cv.set(x, yy + y, K);
  } else {
    cv.rect(fx + 1, 11 + y, 2, 2, eye);
    cv.rect(fx + 4, 11 + y, 2, 2, eye);
    cv.set(fx + 2, 12 + y, K);
    cv.set(fx + 5, 12 + y, K);
    if (mood !== 3) {
      cv.set(fx + 1, 11 + y, WHITE);
      cv.set(fx + 4, 11 + y, WHITE);
    }
    // Heavy brows sloping down to the middle (lower still when it revs).
    const brows: Pt[] = [[fx, 10], [fx + 1, 10], [fx + 2, mood === 1 ? 11 : 10], [fx + 4, mood === 1 ? 11 : 10], [fx + 5, 10], [fx + 6, 10]];
    for (const [x, yy] of brows) cv.set(x, yy + y, K);
  }
  cv.rect(fx + 1, 14 + y, 5, mood === 1 ? 2 : 1, K);
  for (let x = fx + 1; x <= fx + 5; x += 2) cv.set(x, 14 + y, WHITE);
  // Wheels: its own at the back, a smaller white one from another car at the front.
  rcWheel(cv, 8, 17, 3.6, DSTEEL, spin);
  rcWheel(cv, 24, 18, 2.8, CREAM, spin);
  // A scuff on the side.
  cv.set(17, 14 + y, RCP_SIDE[3]!);
  cv.set(18, 14 + y, RCP_SIDE[0]!);
  let out = outline(cv);
  if (mood === 2) {
    // Overturned: upside down, resting on its roof at the bottom of the frame.
    const flipped = new Canvas(32, 22);
    for (let j = 0; j < 22; j++) for (let i = 0; i < 32; i++) flipped.p[21 - j]![i] = out.p[j]![i]!;
    let low = 0;
    for (let j = 0; j < 22; j++) for (let i = 0; i < 32; i++) if (flipped.get(i, j)[3] > 0) low = j;
    out = new Canvas(32, 22);
    out.blit(flipped, 0, 21 - low);
  }
  return out;
}

/** The car's frames: 0-1 idling (the motor shakes it), 2-3 driving, 4 revving to ram, 5 overturned, 6 batteries out. */
export function makeRcCarFrames(): Canvas[] {
  return [makeRcCar(0, 0), makeRcCar(0, 1), makeRcCar(1, 0), makeRcCar(0, 1), makeRcCar(0, 0, 1), makeRcCar(0, 0, 2), makeRcCar(0, 0, 3)];
}

/** Shiny red bucket plastic, and the lid's yellow; the piece that fits nothing is green. */
const BKT = ramp('#ff8a70', '#e0453b', '#a42f37', '#6a1d2a');
const BKT_LIP = ramp('#ffb09a', '#ff8a70', '#e0453b', '#a42f37');
const LIME = ramp('#b8ec8c', '#58b45a', '#3d8a45', '#285f33');

/** One stud seen from above-right: a light dot over its base and a dark rim below. */
function stud(cv: Canvas, x: number, y: number, R: Ramp): void {
  cv.rect(x, y, 2, 1, R[0]!);
  cv.rect(x, y + 1, 2, 1, R[2]!);
}

/**
 * Cubo de Piezas: a red plastic bucket of building pieces, wider at the top, with its yellow
 * studded lid worn as a cap (the peak to the right) and its handle down under the chin as the
 * cap's strap. Its eyes are two round pieces (white, dark centre); a wrong green piece that fits
 * nothing is stuck on its forehead. Jokes: the «1000+» label, a crack mended with a plaster, the
 * shoes two blue bricks. `lid` lifts the lid by that many px (about to throw: a fistful of pieces
 * shows inside and it glares); `jx` shakes it. 27x31.
 */
export function makeCubo(pose: Pose = { xb: CUBO_LEGS[0], xf: CUBO_LEGS[1], bob: 0 }, lid = 0): Canvas {
  const legs = new Canvas(26, 30);
  const cv = new Canvas(26, 30);
  poseFeet(legs, pose, 24, { L: 3, leg: DSTEEL, shoe: BLUE });
  hand(cv, 1, 17, YEL);
  // The bucket: a cone cut short, x0..x1 per row from the rim (y 10) to the bottom (y 24), lit
  // from the top left: a dark band round the back, one bright streak, a shadow on the front edge.
  for (let y = 10; y <= 24; y++) {
    const k = (y - 10) / 14;
    const x0 = Math.round(3 + 3.4 * k);
    const x1 = Math.round(22 - 3.4 * k);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      const c = u < 0.1 ? BKT[3]! : u < 0.24 ? BKT[2]! : u < 0.32 ? BKT[0]! : u > 0.92 ? BKT[2]! : BKT[1]!;
      cv.set(x, y, y >= 23 ? BKT[y === 24 ? 3 : 2]! : c);
    }
  }
  clear(cv, [[6, 24], [19, 24]]);
  // The rim: a lip one px wider all round.
  cv.rect(2, 10, 22, 2, BKT_LIP[1]!);
  cv.rect(2, 11, 22, 1, BKT_LIP[2]!);
  cv.rect(2, 10, 3, 2, BKT[2]!);
  // Inside, when the lid is up: a fistful of pieces of every colour, and a dark mouth.
  if (lid > 0) {
    cv.rect(4, 9, 18, 1, K);
    const bits: Array<[number, Ramp]> = [[5, BLUE], [8, YEL], [11, LIME], [14, BLUE], [17, YEL], [20, LIME]];
    for (const [x, R] of bits) {
      cv.rect(x, 8, 2, 2, R[1]!);
      cv.set(x, 8, R[0]!);
    }
  }
  // The lid, worn as a cap: a flat studded disc, the peak sticking out to the right.
  const ly = 6 - lid;
  cv.rect(3, ly + 1, 20, 3, YEL[1]!);
  cv.rect(4, ly, 18, 1, YEL[0]!);
  cv.rect(3, ly + 3, 20, 1, YEL[2]!);
  cv.rect(3, ly + 1, 2, 3, YEL[2]!);
  cv.rect(21, ly + 3, 5, 1, YEL[2]!);
  cv.rect(21, ly + 2, 5, 1, YEL[1]!);
  cv.set(25, ly + 3, YEL[3]!);
  for (const x of [6, 10, 14, 18]) stud(cv, x, ly - 1, YEL);
  // A wrong piece on its forehead: a green brick stuck on askew, its two studs out of line.
  cv.rect(14, 13, 5, 2, LIME[1]!);
  cv.rect(14, 14, 5, 1, LIME[2]!);
  cv.set(18, 13, LIME[2]!);
  cv.set(15, 12, LIME[0]!);
  cv.set(18, 12, LIME[0]!);
  cv.set(13, 14, LIME[3]!);
  // Eyes: two round white pieces with dark centres, looking right; heavy brows sloping inward.
  const eye = (x: number, y: number): void => {
    cv.rect(x, y, 3, 3, WHITE);
    cv.set(x, y, CREAM[1]!);
    cv.set(x + 2, y + 2, CREAM[2]!);
    cv.rect(x + 1, y + 1, 2, 2, K);
  };
  eye(11, 16);
  eye(17, 16);
  const brows: Pt[] = lid > 0
    ? [[10, 15], [11, 15], [12, 16], [13, 16], [17, 16], [18, 16], [19, 15], [20, 15]]
    : [[11, 15], [12, 15], [13, 15], [17, 15], [18, 15], [19, 15]];
  for (const [x, y] of brows) cv.set(x, y, K);
  // Mouth: tight and sour (open when it throws).
  cv.rect(15, 20, 3, lid > 0 ? 2 : 1, K);
  cv.set(14, 21, K);
  // The handle, down round the chin as the cap's strap: grey wire from the rim to under the mouth.
  const strap: Pt[] = [[4, 12], [5, 14], [6, 16], [7, 18], [8, 20], [9, 21], [10, 22], [11, 22], [12, 22], [13, 22], [14, 22]];
  for (const [x, y] of strap) cv.set(x, y, DSTEEL[0]!);
  for (const [x, y] of [[19, 22], [20, 21], [21, 19], [22, 16], [22, 13]] as Pt[]) cv.set(x, y, DSTEEL[1]!);
  cv.rect(15, 22, 4, 1, DSTEEL[0]!);
  // Its back: a «1000+» sticker (white, a red burst) and a plaster over a crack.
  cv.rect(5, 17, 3, 3, WHITE);
  cv.set(6, 18, RED[1]!);
  cv.set(5, 17, CREAM[1]!);
  cv.rect(17, 11, 1, 1, BKT[3]!);
  hand(cv, 22, lid > 0 ? 11 : 18, YEL);
  const out = new Canvas(27, 31);
  out.blit(joinPose(legs, cv, pose), 1, 1);
  return outline(out);
}

export const CUBO_LEGS = [8, 14] as const;

/** The bucket's frames: 0-1 standing, 2-5 a heavy waddle, 6 lid up (about to throw). */
export function makeCuboFrames(): Canvas[] {
  return [...narrowPoseCycle(CUBO_LEGS[0], CUBO_LEGS[1], 1).map((f) => makeCubo(f.pose)), makeCubo(undefined, 3)];
}

/**
 * The building pieces it throws, seen from above-right as they lie on the floor: a red 2x2, a blue
 * 2x3, a yellow 1x2 and a green corner. Each 10x8.
 */
export function makePiezas(): Canvas[] {
  // A block `cols` x `rows` studs (each 3 px wide, 2 deep on top), 2 px of front face; `skip`: an
  // empty cell (the corner piece).
  const piece = (cols: number, rows: number, R: Ramp, skip?: Pt): Canvas => {
    const cv = new Canvas(10, 8);
    const ox = 5 - Math.ceil((cols * 3) / 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (skip && skip[0] === c && skip[1] === r) continue;
        const x = ox + c * 3;
        const y = 1 + r * 2;
        cv.rect(x, y, 3, 2, R[1]!);
        // The front face, under the front row (or under a cell with nothing in front of it).
        const front = r === rows - 1 || (skip && skip[0] === c && skip[1] === r + 1);
        if (front) cv.rect(x, y + 2, 3, 2, R[2]!);
        cv.set(x + 1, y, R[0]!);
        cv.set(x + 1, y + 1, R[3]!);
      }
    }
    return outline(cv);
  };
  return [piece(2, 2, RED), piece(3, 1, BLUE), piece(2, 1, YEL), piece(2, 2, LIME, [1, 0])];
}

/** Cheap metallic foil, magenta, shinier on top. */
const FOIL = ramp('#ffd6f2', '#e070c8', '#a8459a', '#6e2a68');

/**
 * Sobre Sorpresa: a sealed packet of collectable stickers, crimped at the top and bottom, with a
 * big yellow star on the front (a «?» in it) and a greedy face over it. Jokes: the dotted «tear
 * here» line across the top with its little scissors, and the back covered in tiny print (the
 * odds). `squash`: crouching to hop (shorter, wider); `air`: legs tucked up in a hop; `puff`:
 * cheeks blown out and mouth open, confetti showing (about to spit); `jx` shakes it. 24x28.
 */
export function makeSobre(squash = 0, air = false, puff = false, jx = 0): Canvas {
  const legs = new Canvas(23, 27);
  const cv = new Canvas(23, 27);
  if (!air) feet(legs, 7, 12, 22, { L: 3, leg: DSTEEL, shoe: RED });
  else {
    legs.rect(8, 22, 4, 2, RED[2]!);
    legs.rect(13, 22, 4, 2, RED[1]!);
  }
  const top = 2 + squash * 2;
  const x0 = 3 - squash + jx;
  const x1 = 19 + squash + jx;
  // The packet: side face on the left, foil front with a light streak, crimped top and bottom.
  for (let y = top; y <= 21; y++) {
    for (let x = x0; x <= x1; x++) {
      const c = x <= x0 + 1 ? FOIL[3]! : x === x0 + 3 ? FOIL[0]! : x === x1 ? FOIL[2]! : FOIL[1]!;
      cv.set(x, y, c);
    }
  }
  for (let x = x0; x <= x1; x++) {
    cv.set(x, top, (x - x0) % 2 === 0 ? FOIL[0]! : FOIL[2]!);
    cv.set(x, top + 1, FOIL[2]!);
    cv.set(x, 20, FOIL[2]!);
    cv.set(x, 21, (x - x0) % 2 === 0 ? FOIL[3]! : FOIL[1]!);
  }
  clear(cv, [[x0, top], [x1, top], [x0, 21], [x1, 21]]);
  // «Tear here»: a dotted line under the crimp, with the scissors at its start.
  for (let x = x0 + 5; x <= x1 - 1; x += 2) cv.set(x, top + 3, WHITE);
  cv.set(x0 + 3, top + 2, WHITE);
  cv.set(x0 + 3, top + 4, WHITE);
  // Tiny print down the side (the odds, unreadable).
  for (let y = top + 5; y <= 18; y += 2) cv.rect(x0 + 1, y, 1, 1, FOIL[1]!);
  // Its face: greedy eyes under brows, a grin (puffed and open when it spits).
  const fy = top + 5;
  const ex = 11 + jx;
  cv.rect(ex, fy, 2, 3, K);
  cv.rect(ex + 5, fy, 2, 3, K);
  cv.set(ex + 1, fy, WHITE);
  cv.set(ex + 6, fy, WHITE);
  const brows: Pt[] = [[ex - 1, fy - 1], [ex, fy - 1], [ex + 1, fy], [ex + 5, fy], [ex + 6, fy - 1], [ex + 7, fy - 1]];
  for (const [x, y] of brows) cv.set(x, y, K);
  if (puff) {
    cv.rect(ex + 1, fy + 4, 5, 3, K);
    cv.set(ex + 2, fy + 5, YEL[1]!);
    cv.set(ex + 4, fy + 4, RED[1]!);
    cv.set(ex + 3, fy + 6, CYAN);
    cv.set(ex - 1, fy + 4, FOIL[0]!);
    cv.set(ex + 7, fy + 4, FOIL[0]!);
  } else {
    cv.rect(ex + 1, fy + 4, 5, 1, K);
    cv.set(ex, fy + 3, K);
    cv.set(ex + 6, fy + 3, K);
    for (const x of [ex + 2, ex + 4]) cv.set(x, fy + 4, WHITE);
  }
  // The star on its belly, a «?» in it.
  const sx = 13 + jx;
  const sy = 16;
  const star: Pt[] = [[sx, sy - 3], [sx - 1, sy - 2], [sx, sy - 2], [sx + 1, sy - 2], [sx - 3, sy - 1], [sx + 3, sy - 1]];
  cv.rect(sx - 2, sy - 1, 5, 3, YEL[1]!);
  for (const [x, y] of star) cv.set(x, y, YEL[1]!);
  cv.set(sx - 2, sy + 2, YEL[2]!);
  cv.set(sx + 2, sy + 2, YEL[2]!);
  cv.rect(sx - 1, sy - 2, 2, 1, YEL[0]!);
  cv.set(sx, sy - 1, K);
  cv.set(sx + 1, sy, K);
  cv.set(sx, sy + 1, K);
  hand(cv, x0 - 2, 14 + squash, PINK);
  hand(cv, x1, 15 + squash, PINK);
  const out = new Canvas(24, 28);
  out.blit(legs, 1, 1);
  out.blit(cv, 1, 1);
  return outline(out);
}

/** The envelope's frames: 0-1 standing (it trembles with impatience), 2 crouching, 3 in the air, 4 about to spit confetti. */
export function makeSobreFrames(): Canvas[] {
  return [makeSobre(), makeSobre(0, false, false, 1), makeSobre(1), makeSobre(0, true), makeSobre(0, false, true)];
}

/** Off-the-mould vinyl: the figurine's skin, its painted clothes, and the gold of the ultra-rare one. */
const VINYL = ramp('#f2d9b8', '#d9b48a', '#a8825c', '#6e5238');
const PAINT = ramp('#8fd0c8', '#4f9e96', '#33706c', '#204a48');
const GOLD = ramp('#fff1a8', '#f6c431', '#c8902a', '#7a5418');
const BROWN_HAIR = ramp('#a8744a', '#7a4f30', '#55351f', '#3a2414');

/**
 * Muñequito Repetido: a little mass-produced vinyl figure, all head, the mould seam running down
 * its face, the smile painted on a pixel off its mouth (cheap printing) and a «x3» sticker on its
 * chest. `gold` makes it the Muñequito Dorado Ultrarraro (all gold, a sparkle, a smug face);
 * `bite`: mouth wide open. 18x20.
 */
export function makeMunequito(pose: Pose = { xb: 5, xf: 9, bob: 0 }, gold = false, bite = false): Canvas {
  const legs = new Canvas(17, 19);
  const cv = new Canvas(17, 19);
  const skin = gold ? GOLD : VINYL;
  const cloth = gold ? GOLD : PAINT;
  poseFeet(legs, pose, 15, { L: 2, leg: cloth, shoe: gold ? GOLD : DSTEEL });
  // Body: a small block of painted clothes.
  cv.rect(5, 11, 7, 5, cloth[1]!);
  cv.rect(5, 11, 2, 5, cloth[2]!);
  cv.rect(5, 15, 7, 1, cloth[3]!);
  // Head: big and round-cornered, light from the top left.
  cv.rect(3, 1, 11, 10, skin[1]!);
  cv.rect(4, 0, 9, 1, skin[0]!);
  cv.rect(3, 1, 2, 10, skin[2]!);
  cv.rect(4, 1, 8, 1, skin[0]!);
  cv.rect(3, 10, 11, 1, skin[2]!);
  clear(cv, [[3, 1], [13, 1], [3, 10], [13, 10]]);
  // Painted hair (a flat cap of colour) on the plain ones; the gold one shines.
  if (!gold) {
    cv.rect(4, 0, 9, 2, BROWN_HAIR[1]!);
    cv.rect(4, 0, 4, 1, BROWN_HAIR[0]!);
    cv.set(12, 2, BROWN_HAIR[2]!);
  } else {
    cv.set(6, 2, WHITE);
    cv.set(5, 3, WHITE);
    cv.set(7, 3, skin[0]!);
  }
  // The mould seam down the side of its head.
  for (let y = 2; y <= 9; y += 2) cv.set(5, y, skin[3]!);
  // Eyes: two dots looking right (half-lidded and smug if gold).
  cv.rect(8, 4, 2, 2, K);
  cv.rect(11, 4, 2, 2, K);
  if (gold) {
    cv.rect(8, 4, 2, 1, skin[2]!);
    cv.rect(11, 4, 2, 1, skin[2]!);
  } else {
    cv.set(8, 4, WHITE);
    cv.set(11, 4, WHITE);
    // Painted-on smile, real anger: brows sloping down to the middle.
    for (const [x, y] of [[7, 2], [8, 2], [9, 3], [11, 3], [12, 2], [13, 2]] as Pt[]) cv.set(x, y, K);
  }
  // Mouth: printed a pixel off (the smile lands on its cheek); open wide to bite.
  if (bite) {
    cv.rect(9, 7, 4, 3, K);
    cv.set(10, 7, WHITE);
    cv.set(12, 7, WHITE);
  } else {
    cv.rect(10, 8, 3, 1, K);
    cv.set(9, 7, K);
    cv.set(13, 7, K);
  }
  // «x3» sticker on its chest (the plain ones), a star on the gold one.
  if (!gold) {
    cv.rect(8, 12, 3, 2, WHITE);
    cv.set(9, 12, RED[1]!);
    cv.set(10, 13, RED[1]!);
  } else cv.set(9, 13, WHITE);
  hand(cv, 2, 11, skin);
  hand(cv, 12, 12, skin);
  const out = new Canvas(18, 20);
  out.blit(joinPose(legs, cv, pose), 1, 1);
  return outline(out);
}


/** The figurines' frames: 0-1 standing, 2-5 running, 6 biting (the plain ones). */
export function makeMunequitoFrames(gold: boolean): Canvas[] {
  const cyc = narrowPoseCycle(5, 9, 1).map((f) => makeMunequito(f.pose, gold));
  return gold ? cyc : [...cyc, makeMunequito(undefined, false, true)];
}

// ---------- Floor 4 (Oficinas) ----------

/** Office beige plastic, gone a little yellow under the fluorescents. */
const SHRED = ramp('#ece2c6', '#d3c49e', '#ab9a73', '#7b6c4e');
const SHRED_SIDE = ramp('#ab9a73', '#958560', '#77694b', '#544a36');
const SHRED_TOP = ramp('#f8f1dc', '#ece2c6', '#d3c49e', '#ab9a73');
/** The see-through waste bin, with what shows through it. */
const BIN = ramp('#d5e3ea', '#a9c0cc', '#7f98a8', '#566b7a');

/** Shredded paper seen through the bin (or spilling over it): wavy white strips with grey edges. */
function strips(cv: Canvas, x: number, y: number, w: number, h: number): void {
  for (let i = 0; i < w; i += 2) {
    for (let j = 0; j < h; j++) {
      const wob = ((j + i) >> 1) % 2;
      cv.set(x + i + wob, y + j, (i + j) % 5 === 0 ? CREAM[1]! : WHITE);
    }
  }
}

/** The blades' mouth: a dark slot with a row of teeth along its top (red when it is about to lunge). */
function bladeSlot(cv: Canvas, x: number, y: number, w: number, red: boolean): void {
  cv.rect(x, y, w, 3, K);
  for (let i = 1; i < w - 1; i += 2) cv.set(x + i, y + 1, red ? RED[1]! : STEEL[1]!);
  for (let i = 2; i < w - 1; i += 2) cv.set(x + i, y + 2, red ? RED[2]! : STEEL[3]!);
}

/** The post-it stuck over its mouth: «Confidencial» in three red scribbles. */
function confidentialNote(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 5, 4, YEL[1]!);
  cv.rect(x, y, 5, 1, YEL[0]!);
  cv.set(x + 4, y + 3, YEL[2]!);
  cv.rect(x + 1, y + 1, 3, 1, RED[2]!);
  cv.set(x + 1, y + 2, RED[2]!);
}

/** The red-and-white «No introducir la mano» sticker: a white square, red border, a red slash. */
function noHandSticker(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 4, 4, RED[1]!);
  cv.rect(x + 1, y + 1, 2, 2, WHITE);
  cv.set(x + 2, y + 1, RED[1]!);
  cv.set(x + 1, y + 2, RED[1]!);
}

/**
 * Destructora de Documentos (M10 planta 4 (4a)): an office paper shredder in beige plastic, the
 * blade slot for a mouth and its see-through bin, full to bursting with strips, on its back. Always
 * facing its target, so it is drawn from three sides: `side` (facing right, the bin behind it on
 * the left), `front` (facing the camera: eyes and blades, strips poking up behind) and `back`
 * (facing away: all bin). A post-it saying «Confidencial» stuck over the mouth, the «No introducir
 * la mano» sticker, office shoes. `red`: the blades red and the eyes narrowed (about to lunge, or
 * chewing). 34x32, like the printer.
 */
export function makeDestructora(pose: Pose = { xb: SHREDDER_LEGS[0], xf: SHREDDER_LEGS[1], bob: 0 }, view: 'side' | 'front' | 'back' = 'side', red = false): Canvas {
  const legs = new Canvas(34, 30);
  const cv = new Canvas(34, 30);
  poseFeet(legs, pose, 23, { L: 4, leg: PANTL, shoe: OFFICE });
  const eyes = (lx: number, rx: number, y: number): void => {
    for (const x of [lx, rx]) {
      cv.rect(x, y, 3, 3, K);
      if (!red) cv.set(x + 1, y + 1, WHITE);
      // Heavy lids, lower still when it means it.
      cv.rect(x, y, 3, red ? 2 : 1, SHRED[2]!);
    }
    // Brows down to the middle: a document is a document.
    const brows: Pt[] = [[lx - 1, y - 2], [lx, y - 2], [lx + 1, y - 1], [lx + 2, y - 1], [rx, y - 1], [rx + 1, y - 1], [rx + 2, y - 2], [rx + 3, y - 2]];
    for (const [x, yy] of brows) cv.set(x, yy, K);
  };
  if (view === 'side') {
    hand(cv, 3, 15, SHRED);
    // The bin on its back: see-through plastic with the strips pressed against it, and more spilling over the top.
    cv.rect(1, 7, 10, 15, BIN[1]!);
    strips(cv, 2, 9, 8, 12);
    cv.rect(1, 7, 10, 1, BIN[0]!);
    cv.rect(1, 21, 10, 1, BIN[3]!);
    cv.rect(1, 8, 1, 13, BIN[2]!);
    strips(cv, 2, 4, 7, 3);
    cube(cv, 7, 3, 24, 20, 6, 4, SHRED, SHRED_SIDE, SHRED_TOP);
    // The paper slot along the top, and the switch.
    cv.rect(15, 5, 12, 1, SHRED[3]!);
    cv.set(28, 8, red ? RED[1]! : GREEN);
    eyes(17, 23, 9);
    bladeSlot(cv, 14, 15, 16, red);
    confidentialNote(cv, 24, 13);
    noHandSticker(cv, 8, 12);
    // Wear: a scuff on the top and a coffee ring on the side.
    cv.set(22, 6, SHRED[3]!);
    cv.set(10, 18, SHRED_SIDE[3]!);
    hand(cv, 29, 16, SHRED);
  } else if (view === 'front') {
    hand(cv, 3, 15, SHRED);
    // Strips poking up from the bin behind it.
    strips(cv, 9, 0, 16, 4);
    cube(cv, 5, 3, 25, 20, 3, 4, SHRED, SHRED_SIDE, SHRED_TOP);
    cv.rect(11, 5, 14, 1, SHRED[3]!);
    eyes(13, 20, 9);
    bladeSlot(cv, 10, 15, 17, red);
    confidentialNote(cv, 21, 13);
    cv.set(26, 8, red ? RED[1]! : GREEN);
    noHandSticker(cv, 23, 18);
    hand(cv, 29, 15, SHRED);
  } else {
    hand(cv, 3, 15, SHRED);
    cube(cv, 5, 3, 25, 20, 3, 4, SHRED, SHRED_SIDE, SHRED_TOP);
    // All bin: see-through, packed with strips, a bulge of them over the top and the sticker on it.
    cv.rect(9, 6, 18, 16, BIN[1]!);
    strips(cv, 10, 8, 16, 13);
    cv.rect(9, 6, 18, 1, BIN[0]!);
    cv.rect(9, 21, 18, 1, BIN[3]!);
    cv.rect(9, 7, 1, 14, BIN[2]!);
    cv.rect(26, 7, 1, 14, BIN[2]!);
    strips(cv, 11, 2, 14, 4);
    noHandSticker(cv, 20, 15);
    hand(cv, 29, 15, SHRED);
  }
  return pad(outline(joinPose(legs, cv, pose)), 2);
}

export const SHREDDER_LEGS = [11, 18] as const;

/**
 * The shredder's frames, seven per view (side, then front, then back): 0-1 humming, 2-5 a steady
 * shuffle, 6 blades red (warning, or chewing a bullet).
 */
export function makeDestructoraFrames(): Canvas[] {
  return (['side', 'front', 'back'] as const).flatMap((v) => [
    ...poseCycle(SHREDDER_LEGS[0], SHREDDER_LEGS[1]).map((f) => makeDestructora(f.pose, v)),
    makeDestructora(undefined, v, true),
  ]);
}

/** Photocopier grey: colder than the beige of the printers, the colour of every office corridor. */
const COPIER = ramp('#e6e8ec', '#c4c9d1', '#959ba8', '#666c7a');
const COPIER_SIDE = ramp('#959ba8', '#7f8594', '#676d7b', '#4a4f5c');
const COPIER_TOP = ramp('#f6f7f9', '#e6e8ec', '#c4c9d1', '#959ba8');
/** The lid: charcoal plastic, with the white pad underneath. */
const LID = ramp('#7a8090', '#565b6a', '#3d414e', '#282b36');
/** The glass under the lid, and the green scanning light. */
const GLASS = ramp('#4c6f78', '#30474f', '#223338', '#162226');
const SCAN = ramp('#f0ffd8', '#b8f07a', '#6fcf4a', '#3f8f32');
/** The error display, amber on black. */
const AMBER = ramp('#ffe1a0', '#f0a83a', '#a8641e', '#5a3412');

/** «Averiada, no tocar»: a sheet taped on with two strips of yellowed tape, three red scribbled lines. */
function brokenSign(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 6, 7, WHITE);
  cv.rect(x, y + 6, 6, 1, CREAM[1]!);
  cv.set(x - 1, y, YEL[0]!);
  cv.set(x, y - 1, YEL[0]!);
  cv.set(x + 6, y, YEL[0]!);
  cv.set(x + 5, y - 1, YEL[0]!);
  cv.rect(x + 1, y + 1, 4, 1, RED[1]!);
  cv.rect(x + 1, y + 3, 3, 1, RED[2]!);
  cv.rect(x + 1, y + 5, 4, 1, RED[2]!);
}

/**
 * Fotocopiadora de Planta (M10 planta 4 (4b)): a big square office photocopier in corridor grey,
 * the charcoal lid on top, the output tray for a mouth with a jammed sheet hanging out of it like
 * a tongue, and a little amber display stuck on «E-04». A «Averiada, no tocar» sign taped to its
 * side that nobody remembers putting there; office shoes. `lid`: 0 shut; 1-3 lifted, the green
 * light at the back, middle or front of the glass (it is copying someone: the eyes go wide);
 * `out`: lid shut and a fresh copy sliding out of the tray (the tongue is a whole sheet). 38x36.
 */
export function makeFotocopiadora(pose: Pose = { xb: COPIER_LEGS[0], xf: COPIER_LEGS[1], bob: 0 }, lid = 0, out = false): Canvas {
  const legs = new Canvas(38, 36);
  const cv = new Canvas(38, 36);
  poseFeet(legs, pose, 29, { L: 4, leg: PANTL, shoe: OFFICE });
  hand(cv, 1, 20, COPIER);
  if (lid > 0) {
    // The lid up and leaning back: we see its white pad, and the glass below it lit by the scan.
    cv.rect(6, 0, 26, 8, LID[1]!);
    cv.rect(7, 1, 24, 6, CREAM[0]!);
    cv.rect(7, 6, 24, 1, CREAM[2]!);
    cv.rect(6, 0, 26, 1, LID[0]!);
  }
  cube(cv, 3, 7, 31, 22, 8, 4, COPIER, COPIER_SIDE, COPIER_TOP);
  if (lid > 0) {
    // Glass along the top face, the scanning bar across it.
    for (let j = 0; j < 3; j++) cv.rect(9 + Math.floor((3 - j) / 2), 8 + j, 22 - Math.floor((3 - j) / 2), 1, GLASS[j === 0 ? 0 : 1]!);
    const bx = [0, 11, 18, 25][lid]!;
    cv.rect(bx - 1, 7, 3, 4, SCAN[1]!);
    cv.rect(bx, 7, 1, 4, SCAN[0]!);
    cv.rect(bx + 2, 8, 1, 3, SCAN[2]!);
  } else {
    // The lid shut: a charcoal slab on the top face, with its handle on the front edge.
    for (let j = 0; j < 3; j++) cv.rect(5 + Math.floor((3 - j) / 2), 7 + j, 28 - Math.floor((3 - j) / 2), 1, j === 0 ? LID[0]! : LID[1]!);
    cv.rect(5, 10, 28, 1, LID[2]!);
    cv.rect(26, 10, 5, 1, LID[3]!);
  }
  // Eyes on the front: tired, the lids half down; wide open while it copies.
  const wide = lid > 0;
  for (const x of [16, 23]) {
    cv.rect(x, 15, 3, 3, K);
    cv.set(x + 1, 16, WHITE);
    if (!wide) cv.rect(x, 15, 3, 1, COPIER[2]!);
  }
  if (!wide) {
    const brows: Pt[] = [[15, 14], [16, 14], [17, 14], [23, 14], [24, 14], [25, 14]];
    for (const [x, y] of brows) cv.set(x, y, K);
  } else {
    // Brows shot up: someone is being duplicated.
    const brows: Pt[] = [[16, 13], [17, 13], [18, 13], [23, 13], [24, 13], [25, 13]];
    for (const [x, y] of brows) cv.set(x, y, K);
  }
  // The display: E-04 in four dark-amber marks.
  cv.rect(27, 15, 6, 4, K);
  cv.rect(28, 16, 4, 2, AMBER[1]!);
  cv.set(28, 16, AMBER[3]!);
  cv.set(30, 16, AMBER[3]!);
  cv.set(31, 17, AMBER[3]!);
  // Output tray: the mouth, a dark slot, and the sheet hanging out of it.
  cv.rect(13, 22, 19, 2, K);
  cv.rect(14, 23, 17, 1, COPIER_SIDE[3]!);
  if (out) {
    // A whole fresh copy coming out, grey with toner lines.
    cv.rect(15, 23, 15, 6, WHITE);
    cv.rect(15, 28, 15, 1, CREAM[1]!);
    for (const y of [24, 26]) cv.rect(17, y, 10, 1, COPIER[2]!);
    cv.set(28, 25, K);
    cv.set(19, 27, COPIER[3]!);
  } else {
    // The jammed sheet, crumpled at the corner, hanging like a tongue.
    cv.rect(20, 23, 6, 4, WHITE);
    cv.rect(21, 27, 4, 1, WHITE);
    cv.rect(20, 26, 1, 1, CREAM[1]!);
    cv.set(25, 26, CREAM[2]!);
    cv.rect(22, 24, 2, 1, CREAM[2]!);
  }
  brokenSign(cv, 4, 15);
  // Wear: a coffee ring on the top, a scuff on the side, a dent by the tray.
  if (lid === 0) cv.set(14, 8, LID[2]!);
  cv.set(9, 26, COPIER_SIDE[3]!);
  cv.set(32, 25, RUSTR[1]!);
  hand(cv, 34, 20, COPIER);
  return pad(outline(joinPose(legs, cv, pose)), 2);
}

export const COPIER_LEGS = [12, 21] as const;

/**
 * The photocopier's frames: 0-1 humming, 2-5 shuffling, 6-8 lid up with the light at the back,
 * middle and front of the glass (copying), 9 a copy sliding out of the tray.
 */
export function makeFotocopiadoraFrames(): Canvas[] {
  return [
    ...poseCycle(COPIER_LEGS[0], COPIER_LEGS[1]).map((f) => makeFotocopiadora(f.pose)),
    makeFotocopiadora(undefined, 1),
    makeFotocopiadora(undefined, 2),
    makeFotocopiadora(undefined, 3),
    makeFotocopiadora(undefined, 0, true),
  ];
}

/** Varnished beech, gone dark where it is held, for the stamp's handle and mount. */
const BEECH = ramp('#e2b277', '#b9844c', '#8a5c33', '#5c3a22');
const BEECH_SIDE = ramp('#8a5c33', '#74492a', '#5c3a22', '#3e2616');
const BEECH_TOP = ramp('#f2cf96', '#e2b277', '#b9844c', '#8a5c33');
/** Red rubber, worn pink at the edges from so much denying. */
const STAMP_RUBBER = ramp('#d9675a', '#a8323a', '#7a2230', '#521624');

/**
 * Sello de Denegado (M10 planta 4 (4c)): a rubber stamp. A round wooden knob on top (two tooth
 * marks bitten into it), a short neck and the mount as a 3/4 cube with a tired, contemptuous face
 * on its front; under it the red rubber, worn, with the edge of a backwards «D» showing; a dried
 * ink pad hanging off the neck on a string. `squash`: crouching (to hop, or just stamped);
 * `air`: legs tucked up; `slam`: coming down to stamp (stretched, legs up, the face furious);
 * `jx` shakes it. 26x34.
 */
export function makeSello(squash = 0, air = false, slam = false, jx = 0): Canvas {
  const legs = new Canvas(25, 33);
  const cv = new Canvas(25, 33);
  const stretch = slam ? 2 : 0;
  // Rubber bottom at y = 26 standing (feet below); squashing lowers everything above it.
  const by = 26 - (air || slam ? 2 : 0);
  if (!air && !slam) feet(legs, 8, 13, 27, { L: 2, leg: PANTL, shoe: OFFICE });
  else {
    legs.rect(9, by + 1, 4, 2, OFFICE[2]!);
    legs.rect(14, by + 1, 4, 2, OFFICE[1]!);
  }
  const x0 = 4 + jx;
  // The rubber: a slab a pixel wider than the mount, worn at the corners, the backwards «D» peeking.
  const rubTop = by - 3;
  cv.rect(x0, rubTop, 18, 3, STAMP_RUBBER[1]!);
  cv.rect(x0, rubTop, 18, 1, STAMP_RUBBER[0]!);
  cv.rect(x0, rubTop + 2, 18, 1, STAMP_RUBBER[2]!);
  cv.rect(x0, rubTop, 3, 3, STAMP_RUBBER[2]!);
  clear(cv, [[x0, rubTop + 2], [x0 + 17, rubTop + 2]]);
  cv.set(x0 + 12, rubTop + 2, STAMP_RUBBER[3]!);
  cv.set(x0 + 13, rubTop + 1, STAMP_RUBBER[3]!);
  cv.set(x0 + 14, rubTop + 2, STAMP_RUBBER[3]!);
  // The mount: the head, a varnished block in 3/4 view.
  const mh = 11 - squash + stretch;
  const my = rubTop - mh;
  cube(cv, x0 + 1, my, 16, mh, 4, 3, BEECH, BEECH_SIDE, BEECH_TOP);
  // Grain on the side, a dark band where it meets the rubber.
  cv.set(x0 + 2, my + 6, BEECH_SIDE[3]!);
  cv.set(x0 + 3, my + 8 - squash, BEECH_SIDE[3]!);
  cv.rect(x0 + 5, rubTop - 1, 12, 1, BEECH[3]!);
  // The face: half-shut eyes that have seen every form, brows down; furious when it slams.
  const ey = my + 4;
  const ex = x0 + 8;
  for (const x of [ex, ex + 5]) {
    cv.rect(x, ey, 3, 3, K);
    if (!slam) cv.set(x + 1, ey + 1, WHITE);
    cv.rect(x, ey, 3, slam ? 2 : 1, BEECH[2]!);
  }
  const brows: Pt[] = slam
    ? [[ex - 1, ey - 2], [ex, ey - 2], [ex + 1, ey - 1], [ex + 2, ey - 1], [ex + 5, ey - 1], [ex + 6, ey - 1], [ex + 7, ey - 2], [ex + 8, ey - 2]]
    : [[ex, ey - 1], [ex + 1, ey - 1], [ex + 2, ey - 1], [ex + 5, ey - 1], [ex + 6, ey - 1], [ex + 7, ey - 1]];
  for (const [x, y] of brows) cv.set(x, y, K);
  // Mouth: a flat line, turned down at the end (gritted teeth when it comes down).
  if (slam) {
    // Gritted teeth.
    cv.rect(ex + 1, ey + 4, 6, 3, K);
    cv.rect(ex + 2, ey + 5, 4, 1, WHITE);
    cv.set(ex + 4, ey + 5, K);
  } else if (mh >= 9) {
    cv.rect(ex + 2, ey + 5, 4, 1, K);
    cv.set(ex + 6, ey + 6, K);
  }
  // Neck and knob: the handle, with two tooth marks bitten into the knob.
  const ny = my - 3 - stretch;
  cv.rect(x0 + 8, ny, 4, 4 + stretch, BEECH[1]!);
  cv.rect(x0 + 8, ny, 1, 4 + stretch, BEECH[2]!);
  cv.set(x0 + 11, ny + 1, BEECH[0]!);
  const ky = ny - 6;
  cv.rect(x0 + 6, ky + 1, 8, 5, BEECH[1]!);
  cv.rect(x0 + 7, ky, 6, 1, BEECH_TOP[0]!);
  cv.rect(x0 + 6, ky + 1, 2, 5, BEECH[2]!);
  cv.rect(x0 + 7, ky + 5, 6, 1, BEECH[3]!);
  cv.set(x0 + 10, ky + 1, BEECH_TOP[0]!);
  cv.set(x0 + 11, ky + 2, BEECH_TOP[0]!);
  clear(cv, [[x0 + 6, ky + 1], [x0 + 13, ky + 1], [x0 + 6, ky + 5], [x0 + 13, ky + 5]]);
  // Tooth marks: two little dents on the right of the knob.
  cv.set(x0 + 12, ky + 3, BEECH[3]!);
  cv.set(x0 + 12, ky + 4, BEECH[3]!);
  cv.set(x0 + 10, ky + 4, BEECH[3]!);
  // The dried ink pad on a string, hanging off the back of the neck (it swings up when it falls).
  const sy = slam ? ny - 1 : ny + 1;
  cv.set(x0 + 7, sy, CREAM[2]!);
  cv.set(x0 + 6, sy + 1, CREAM[2]!);
  cv.set(x0 + 5, sy + 2, CREAM[2]!);
  const py = sy + 3;
  cv.rect(x0 + 1, py, 5, 3, DSTEEL[2]!);
  cv.rect(x0 + 2, py + 1, 3, 1, STAMP_RUBBER[3]!);
  cv.set(x0 + 1, py, DSTEEL[1]!);
  // Hands: floating either side of the mount, in the same varnished wood.
  hand(cv, x0 - 3, my + 5 + (slam ? -3 : 0), BEECH);
  hand(cv, x0 + 18, my + 6 + (slam ? -3 : 0), BEECH);
  const out = new Canvas(26, 34);
  out.blit(legs, 1, 1);
  out.blit(cv, 1, 1);
  return outline(out);
}

/** The stamp's frames: 0-1 standing (it shakes with impatience), 2 crouching, 3 in the air, 4 coming down to stamp, 5 just stamped (squashed). */
export function makeSelloFrames(): Canvas[] {
  return [makeSello(), makeSello(0, false, false, 1), makeSello(2), makeSello(0, true), makeSello(0, false, true), makeSello(3)];
}

/** The air conditioner's white plastic, gone ivory, and the grey of its flexible hose. */
const AC = ramp('#f4f3ee', '#d9d8d0', '#aeada3', '#7e7d74');
const AC_SIDE = ramp('#aeada3', '#97968c', '#7e7d74', '#5b5a53');
const AC_TOP = ramp('#ffffff', '#f4f3ee', '#d9d8d0', '#aeada3');
const HOSE = ramp('#b7bed0', '#858ea8', '#5a627c', '#3a4058');
/** The display's cold blue. */
const LCD_COLD = hx('#8fe3ff');
const ICE_C = hx('#b6f1f0');

/**
 * Climatizador Portátil (M10 planta 4 (4d)): a tall portable air conditioner, a 3/4 box of ivory
 * plastic. On its front: a little display stuck at «17» (nobody knows who set it), two eyes of
 * smug indifference under it and the louvred vent lower down, where the cold air comes out. Down
 * its side the flexible exhaust hose, patched with silver tape, curling out behind it; and a sheet
 * taped to its side: «NO TOCAR. Firmado: Dirección» (scribbles at this size). `vent`: the louvres'
 * shimmer (0-1); `frost`: about to blow its flakes (rime on the vent, eyes narrowed). 30x40.
 */
export function makeClimatizador(pose: Pose = { xb: AC_LEGS[0], xf: AC_LEGS[1], bob: 0 }, vent = 0, frost = false): Canvas {
  const legs = new Canvas(28, 38);
  const cv = new Canvas(28, 38);
  poseFeet(legs, pose, 31, { L: 3, leg: PANTL, shoe: OFFICE });
  // The hose, behind the body: out of its back, down to the floor and curling away.
  for (const [x, y] of [[2, 14], [1, 16], [1, 18], [1, 20], [1, 22], [2, 24], [2, 26], [3, 28], [4, 29]] as Pt[]) {
    cv.rect(x, y, 4, 2, HOSE[1]!);
    cv.set(x, y, HOSE[0]!);
    cv.rect(x, y + 1, 4, 1, HOSE[2]!);
  }
  // Silver tape round it, a little crooked.
  cv.rect(1, 20, 5, 2, STEEL[0]!);
  cv.set(5, 21, STEEL[2]!);
  hand(cv, 3, 21, AC);
  // The body: tall and narrow, rounded on top.
  cube(cv, 6, 3, 19, 28, 5, 4, AC, AC_SIDE, AC_TOP);
  cv.rect(7, 3, 2, 1, AC_TOP[1]!);
  // The sheet taped to its side: «NO TOCAR», scribbled.
  cv.rect(7, 16, 4, 6, WHITE);
  cv.rect(7, 16, 4, 1, STEEL[1]!);
  for (const y of [18, 20]) cv.rect(8, y, 2, 1, K);
  cv.set(9, 21, RED[1]!);
  // Display stuck at «17», in the cold blue.
  cv.rect(13, 9, 9, 6, K);
  const digits: Pt[] = [[14, 10], [14, 11], [14, 12], [14, 13], [16, 10], [17, 10], [18, 10], [18, 11], [17, 12], [17, 13]];
  for (const [x, y] of digits) cv.set(x, y, LCD_COLD);
  cv.set(20, 10, LCD_COLD);
  // Eyes: half-lidded, looking down on everyone; narrowed when it blows.
  for (const x of [14, 19]) {
    cv.rect(x, 17, 3, 3, K);
    if (!frost) cv.set(x + 1, 18, WHITE);
    cv.rect(x, 17, 3, frost ? 2 : 1, AC[2]!);
  }
  if (frost) for (const [x, y] of [[13, 15], [14, 16], [21, 16], [22, 15]] as Pt[]) cv.set(x, y, K);
  // The vent: louvres across the front, catching the light one after another.
  cv.rect(12, 22, 12, 7, AC[3]!);
  for (let i = 0; i < 3; i++) {
    const y = 23 + i * 2;
    cv.rect(12, y, 12, 1, (i + vent) % 3 === 0 ? AC[0]! : AC[1]!);
  }
  if (frost) for (const [x, y] of [[13, 22], [16, 22], [20, 22], [23, 24], [12, 26], [22, 28]] as Pt[]) cv.set(x, y, ICE_C);
  // Wear: a yellowed scuff and a sticker of the energy class, very low.
  cv.set(23, 7, AC[2]!);
  cv.rect(22, 30, 2, 1, RED[1]!);
  hand(cv, 25, 20, AC);
  return pad(outline(joinPose(legs, cv, pose)), 2);
}

export const AC_LEGS = [10, 17] as const;

/** The air conditioner's frames: 0-1 humming (the louvres shimmer), 2-5 dragging itself along, 6 rime on the vent (about to blow). */
export function makeClimatizadorFrames(): Canvas[] {
  return [
    ...poseCycle(AC_LEGS[0], AC_LEGS[1]).map((f, i) => makeClimatizador(f.pose, i % 3)),
    makeClimatizador(undefined, 0, true),
  ];
}
