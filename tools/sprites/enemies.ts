// New enemies drawn after the approved set, by the same rules (docs/ESTILO_ARTE.md): 3/4 cube
// heads looking right, floating 3x3 hands, short legs with their own shoes, 1 px outline.
import { Canvas } from '../../src/art/canvas.ts';
import { joinPose, narrowPoseCycle, poseCycle, poseFeet, type Pose } from './pose.ts';
import { BURNT, CREAM, CYAN, DSTEEL, K, OFFICE, PANTL, RED, RUBBER, RUSTR, SMOKE, STEEL, WHITE, YEL, box, clear, cube, hand, outline, pad, ramp } from '../../src/art/lib.ts';

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
