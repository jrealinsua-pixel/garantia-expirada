// El Router del Wifi, boss of floor 2 (Informática), and its wifi repeater (docs/DISENO.md).
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { GLOVE, GREEN, K, PANTL, RED, STEEL, WHITE, YEL, box, cube, outline, ramp } from '../../src/art/lib.ts';
import { joinPose, type Pose } from './pose.ts';

type Pt = readonly [number, number];

/** Glossy white router plastic, gone a little yellow on top from years next to the window. */
const SHELL = ramp('#ffffff', '#e6e8ee', '#bfc3cf', '#8f94a4');
const SHELL_SIDE = ramp('#a9aebc', '#8d92a2', '#6f7486', '#515567');
const SHELL_TOP = ramp('#fbf8ec', '#efe9d6', '#d6cfb8', '#aaa38c');
const ANTENNA = ramp('#5a5f7a', '#3a3e56', '#262a3e', '#16182a');
const LED_OFF = hx('#3a3f52');
const AMBER = YEL[1]!;

export const ROUTER_REST: Pose = { xb: 18, xf: 40, bob: 0 };

/** Rest, breathing and the big-legged walk (the Nevera's: a foot lifted 2 px, never crossed). */
export const ROUTER_POSES: ReadonlyArray<{ name: string; pose: Pose }> = [
  { name: 'idle0', pose: ROUTER_REST },
  { name: 'idle1', pose: { ...ROUTER_REST, bob: 1 } },
  { name: 'walk0', pose: { ...ROUTER_REST, bob: -1, lift: { leg: -1, px: 2 } } },
  { name: 'walk1', pose: ROUTER_REST },
  { name: 'walk2', pose: { ...ROUTER_REST, bob: -1, lift: { leg: 1, px: 2 } } },
  { name: 'walk3', pose: { ...ROUTER_REST, bob: 1 } },
];

/** The five LEDs on its front, left to right: power, wifi, internet, LAN 1, LAN 2. */
const LED_X = [24, 29, 34, 39, 44] as const;

export interface RouterLook {
  /** Rebooting: eyes shut, LEDs dark except the first `lit` (0-5), in amber while it boots. */
  rebooting?: boolean;
  lit?: number;
  /** Second breath: the wifi LED blinks. */
  blink?: boolean;
}

/**
 * El Router del Wifi: a wide white router on short legs with four antennas, big floating hands
 * and a smug half-lidded stare. Jokes: one antenna bent and taped, the «internet» LED always red
 * (connected, no internet), the password sticker on its side half torn off, and a network cable
 * out of its back that goes nowhere. 72x76, like the Nevera.
 */
export function makeRouter(pose: Pose = ROUTER_REST, look: RouterLook = {}): Canvas {
  const legs = new Canvas(72, 76);
  const body = new Canvas(72, 76);
  const lb = pose.lift?.leg === -1 ? pose.lift.px : 0;
  const lf = pose.lift?.leg === 1 ? pose.lift.px : 0;
  const bx = pose.xb - ROUTER_REST.xb;
  const fx = pose.xf - ROUTER_REST.xf;
  // Legs and shoes (office shoes: it sits on a desk all day).
  legs.rect(21 + bx, 62, 5, 8 - lb, PANTL[2]!);
  legs.rect(43 + fx, 62, 5, 8 - lf, PANTL[1]!);
  legs.rect(43 + fx, 62, 1, 8 - lf, PANTL[0]!);
  legs.rect(18 + bx, 69 - lb, 10, 4, GLOVE[2]!);
  legs.rect(18 + bx, 69 - lb, 9, 1, GLOVE[1]!);
  legs.rect(40 + fx, 69 - lf, 12, 4, GLOVE[1]!);
  legs.rect(40 + fx, 69 - lf, 11, 1, GLOVE[0]!);

  // Back hand, behind the body.
  bigHand(body, 1, 44);
  // Four antennas on the back edge of the lid. The second one is bent halfway and taped.
  antenna(body, 16, 8, 26);
  bentAntenna(body, 28, 12);
  antenna(body, 42, 6, 28);
  antenna(body, 54, 10, 24);
  // The box: wide and low, seen in three-quarters (lid on top, dark side on the left).
  cube(body, 8, 30, 56, 32, 10, 8, SHELL, SHELL_SIDE, SHELL_TOP);
  // Vents on the lid: three dark slots.
  for (const x of [30, 38, 46]) body.rect(x, 32, 6, 1, SHELL_TOP[3]!);
  // A seam above the LED panel.
  body.rect(18, 49, 45, 1, SHELL[2]!);

  // Face on the front, to the right: big eyes under heavy lids of casing (smug, bored), green
  // irises like status lights, and a smirk up on one side. Rebooting: shut, two flat lines.
  if (look.rebooting) {
    for (const ex of [37, 50]) {
      body.rect(ex, 40, 8, 1, K);
      body.rect(ex, 39, 8, 1, SHELL[2]!);
    }
  } else {
    for (const ex of [37, 50]) {
      body.rect(ex, 36, 8, 7, K);
      body.rect(ex + 3, 39, 3, 3, GREEN);
      body.rect(ex + 3, 41, 3, 1, hx('#2f7a41'));
      body.set(ex + 5, 39, WHITE);
      // The lid: covers the top half, lower towards the outer corner.
      body.rect(ex, 36, 8, 3, SHELL[1]!);
      body.rect(ex, 38, 8, 1, SHELL[3]!);
      body.set(ex + (ex === 37 ? 0 : 7), 39, SHELL[3]!);
    }
  }
  // The smirk.
  body.rect(43, 45, 8, 1, K);
  body.set(51, 44, K);
  body.set(52, 43, K);
  body.set(42, 45, SHELL[3]!);

  // LEDs under the seam. Awake: power green, wifi green (it blinks), internet RED, LAN green, LAN off.
  body.rect(22, 51, 26, 5, SHELL[2]!);
  body.rect(23, 52, 24, 3, hx('#2a2d3d'));
  const awake: RGBA[] = [GREEN, look.blink ? LED_OFF : GREEN, RED[1]!, GREEN, LED_OFF];
  LED_X.forEach((x, i) => {
    let c = awake[i]!;
    if (look.rebooting) c = i < (look.lit ?? 0) ? AMBER : LED_OFF;
    body.rect(x, 53, 2, 1, c);
    if (c !== LED_OFF) body.set(x, 52, WHITE);
  });
  // Tiny printed icons above them (a power symbol and a fan of wifi).
  body.set(24, 49, SHELL[3]!);
  body.set(25, 49, SHELL[3]!);
  for (const [x, y] of [[29, 49], [30, 48], [31, 49]] as const) body.set(x, y, SHELL[3]!);
  // Brand plate: a yellow «5G» that it is not.
  box(body, 52, 51, 9, 5, YEL);
  body.rect(54, 53, 2, 1, YEL[3]!);
  body.rect(57, 53, 2, 1, YEL[3]!);

  // Password sticker on the side, its bottom corner torn off: lines of tiny print.
  body.rect(10, 41, 7, 9, WHITE);
  for (const y of [43, 45, 47]) body.rect(11, y, 5, 1, SHELL_SIDE[2]!);
  body.set(16, 49, SHELL_SIDE[1]!);
  body.set(15, 49, SHELL_SIDE[1]!);
  body.set(16, 48, SHELL_SIDE[1]!);
  // Scuffs and a coffee ring.
  for (const [x, y] of [[20, 58], [60, 47], [12, 56]] as const) body.set(x, y, SHELL[3]!);
  for (const [x, y] of [[37, 35], [38, 34], [39, 34], [40, 35], [39, 36], [38, 36]] as const) body.set(x, y, hx('#c2a878'));

  // Front hand, on the right, half over the box.
  bigHand(body, 62, 50);

  const o = outline(joinPose(legs, body, pose));
  // The network cable: out of the back, down to the floor, and its clip end goes nowhere.
  const cable: Pt[] = [[6, 54], [5, 55], [4, 56], [4, 57], [3, 58], [3, 59], [3, 60], [3, 61], [4, 62], [4, 63], [5, 64], [6, 65], [7, 66], [8, 67]];
  for (const [x, y] of cable) o.set(x, y + (y < 60 ? pose.bob : 0), hx('#5f93d4'));
  o.rect(8, 67, 3, 2, hx('#b6f1f0'));
  o.set(11, 68, K);
  return o;
}

function antenna(cv: Canvas, x: number, top: number, len: number): void {
  cv.rect(x, top, 3, len, ANTENNA[1]!);
  cv.rect(x, top, 1, len, ANTENNA[0]!);
  cv.rect(x + 2, top, 1, len, ANTENNA[2]!);
  // Rounded tip and the hinge at its foot.
  cv.set(x, top, ANTENNA[1]!);
  cv.rect(x - 1, top + len - 3, 5, 3, ANTENNA[2]!);
  cv.rect(x - 1, top + len - 3, 5, 1, ANTENNA[1]!);
}

/** The antenna somebody leant on: straight up to halfway, then bent over to the left, with tape. */
function bentAntenna(cv: Canvas, x: number, top: number): void {
  const len = 22;
  cv.rect(x, top + 10, 3, len - 10, ANTENNA[1]!);
  cv.rect(x, top + 10, 1, len - 10, ANTENNA[0]!);
  cv.rect(x + 2, top + 10, 1, len - 10, ANTENNA[2]!);
  // The bent part: a diagonal going up and left.
  for (let i = 0; i < 9; i++) {
    cv.rect(x - i - 1, top + 9 - i, 3, 2, ANTENNA[1]!);
    cv.set(x - i - 1, top + 9 - i, ANTENNA[0]!);
  }
  // Tape round the bend.
  cv.rect(x - 1, top + 9, 5, 3, hx('#e8e0c0'));
  cv.rect(x - 1, top + 11, 5, 1, hx('#bdb391'));
  cv.rect(x - 1, top + len - 3, 5, 3, ANTENNA[2]!);
  cv.rect(x - 1, top + len - 3, 5, 1, ANTENNA[1]!);
}

/** A boss hand: 7x7 and rounded, like the Nevera's. */
function bigHand(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 7, 7, GLOVE[1]!);
  cv.rect(x, y, 6, 1, GLOVE[0]!);
  cv.rect(x + 6, y, 1, 7, GLOVE[2]!);
  cv.rect(x + 1, y + 6, 6, 1, GLOVE[2]!);
}

/**
 * The router's sheet: 0-5 awake (ROUTER_POSES; idle1 blinks the wifi LED), 6-11 rebooting at
 * rest with 0 to 5 LEDs lit (the last one is the moment before it wakes).
 */
export function makeRouterFrames(): Canvas[] {
  return [
    ...ROUTER_POSES.map((f, i) => makeRouter(f.pose, { blink: i === 1 || i === 4 })),
    ...[0, 1, 2, 3, 4, 5].map((lit) => makeRouter(ROUTER_REST, { rebooting: true, lit })),
  ];
}

/**
 * Its repeater: a wall plug extender with one stubby antenna, standing on its two plug prongs
 * (there is no wall to plug into). Tired eyes and a single LED. `on` false: unplugged, the LED off
 * and the eyes shut, a little slumped. 20x24.
 */
export function makeRepetidor(on = true, blink = false): Canvas {
  const cv = new Canvas(20, 24);
  const sink = on ? 0 : 1;
  // Prongs as legs.
  for (const x of [7, 12]) {
    cv.rect(x, 19, 2, 4, STEEL[2]!);
    cv.rect(x, 19, 1, 4, STEEL[0]!);
  }
  // Stubby antenna.
  cv.rect(14, 2 + sink, 2, 6, ANTENNA[1]!);
  cv.set(14, 2 + sink, ANTENNA[0]!);
  cube(cv, 3, 6 + sink, 15, 14 - sink, 4, 3, SHELL, SHELL_SIDE, SHELL_TOP);
  if (on) {
    for (const ex of [9, 14]) {
      cv.rect(ex, 11, 3, 2, K);
      cv.rect(ex, 11, 3, 1, SHELL[3]!);
      cv.set(ex + 1, 12, WHITE);
    }
  } else {
    for (const ex of [9, 14]) cv.rect(ex, 12, 3, 1, K);
  }
  cv.rect(11, 15 + sink, 4, 1, K);
  // The LED: green, blinking to nothing.
  const led = on && !blink ? GREEN : LED_OFF;
  cv.rect(8, 17, 2, 1, led);
  if (led !== LED_OFF) cv.set(8, 17, WHITE);
  return outline(cv);
}

/** Repeater sheet: 0-1 on (the LED blinks), 2 unplugged. */
export function makeRepetidorFrames(): Canvas[] {
  return [makeRepetidor(true, false), makeRepetidor(true, true), makeRepetidor(false)];
}
