// M13 (3): la Batidora de Vaso, second playable character, with her starting weapon (the
// Picahielos Turbo), its frozen orange juice cubes and the whirl of her blades while she rolls.
// M14c (a4c): she herself redrawn in the new style, with her own frames (makeBlenderSheet).
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { DSTEEL, FRT, GLOW, GLOW2, K, RED, STEEL, WHITE, YEL, box, outline, ramp } from '../../src/art/lib.ts';
import { INK } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

type Pt = readonly [number, number];

/** The old 4-tone ramp of her motor: the Mostrador's display case still paints her with it. */
export const VIOLET = ramp('#c7a6ec', '#9670cf', '#6c4ea3', '#47337a');

// M14c (a4c): the Batidora de Vaso in the new style (src/art/paleta.ts, src/art/pintor.ts), with
// her own frames after the eight of every character, like the toaster (tools/sprites/tostadora.ts).
// The legs and the cord are painted apart from the body so the body can bob over them; the two are
// stamped together and outlined once (Paint.stamp).

/** Frame size and where the feet are in it (CharacterLook of the blender in src/data/characters.ts). */
export const BLENDER_W = 40;
export const BLENDER_H = 50;
export const BLENDER_FEET_X = 20.5;
export const BLENDER_FEET_Y = 49;
/** Height in the frame of the middle of her body (jar and motor): the roll spins round it. */
export const BLENDER_SPIN_Y = 22;

export interface BlenderPose {
  /** Back and front leg x (at rest 13 and 21). */
  xb: number;
  xf: number;
  /** Vertical offset of the body over the legs (breathing, the walk's bounce). */
  bob: number;
  /**
   * Squeezed eyes when hit; crossed out, the jar cracked and the lid knocked askew once broken;
   * `aim` narrowed eyes and bared teeth (shooting), `shut` eyes closed tight (rolling), `shock`
   * wide-open eyes (knocked back, the first shudder), `dizzy` rolled-up eyes (the last shudder).
   */
  face?: 'hurt' | 'broken' | 'aim' | 'shut' | 'shock' | 'dizzy';
  /** Animation frame (the straw nods a pixel between odd and even). */
  frame: number;
  /** How many pixels the lid and the straw jump (default: 1 when hurt, else 0). */
  jump?: number;
  /** The body leaning over the legs, in px (negative: back, away from where she looks). */
  lean?: number;
  /** Leg length (default 5; 1 tucked up in the roll, 3 stretching out to land). */
  legLen?: number;
  /** The swinging leg's foot lifted a pixel off the floor (the six-frame walk). */
  lift?: 'back' | 'front';
  /** The back glove a pixel up or down (it swings with the steps). */
  hand?: number;
  /** Which way the cord whips while rolling (0–5; unset: coiled on the floor). */
  cord?: number;
  /** Sparks crackling round the motor and the cord (dying). */
  sparks?: boolean;
  /** The smoothie's surface tilting in the jar (px at the jar's sides; positive: up at the front). */
  slosh?: number;
  /** The blades a blur (rolling: she spins them). */
  spin?: boolean;
}

/** Her eight frames, in the order of CharacterLook (idle ×2, walk ×4, hurt, broken). */
export const BLENDER_FRAMES: readonly BlenderPose[] = [
  { xb: 13, xf: 21, bob: 0, frame: 0 },
  { xb: 13, xf: 21, bob: 1, frame: 1 },
  { xb: 12, xf: 22, bob: 0, frame: 0, slosh: 1 },
  { xb: 16, xf: 18, bob: -1, frame: 1 },
  { xb: 21, xf: 13, bob: 0, frame: 0, slosh: -1 },
  { xb: 18, xf: 16, bob: -1, frame: 1 },
  { xb: 14, xf: 20, bob: 1, frame: 0, face: 'hurt', slosh: 2 },
  { xb: 13, xf: 21, bob: 1, frame: 0, face: 'broken' },
];

/**
 * Her own frames after the eight (CharacterLook.anim): a six-step walk with the smoothie sloshing
 * from side to side, the roll curled up with the blades a blur and the cord whipping round, the
 * landing, the kick of a shot, the first instant of a hit and two shudders before she breaks.
 */
export const BLENDER_EXTRA: readonly BlenderPose[] = [
  { xb: 21, xf: 13, bob: 1, frame: 0, hand: 0, slosh: -1 },
  { xb: 19, xf: 15, bob: -1, frame: 1, lift: 'front', hand: 1, slosh: 0 },
  { xb: 15, xf: 19, bob: -1, frame: 0, lift: 'front', hand: 1, slosh: 1 },
  { xb: 12, xf: 22, bob: 1, frame: 1, hand: 0, slosh: 1 },
  { xb: 15, xf: 19, bob: -1, frame: 0, lift: 'back', hand: -1, slosh: 0 },
  { xb: 19, xf: 15, bob: -1, frame: 1, lift: 'back', hand: -1, slosh: -1 },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 0, hand: -2, slosh: 3, spin: true },
  { xb: 15, xf: 19, bob: 0, frame: 1, face: 'shut', legLen: 1, cord: 1, hand: -2, slosh: -3, spin: true },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 2, hand: -2, slosh: 3, spin: true },
  { xb: 15, xf: 19, bob: 0, frame: 1, face: 'shut', legLen: 1, cord: 3, hand: -2, slosh: -3, spin: true },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 4, hand: -2, slosh: 3, spin: true },
  { xb: 12, xf: 22, bob: 0, frame: 1, legLen: 3, cord: 5, hand: 1, slosh: -2 },
  { xb: 13, xf: 21, bob: 0, frame: 0, face: 'aim', lean: -1, jump: 1, slosh: -1 },
  { xb: 14, xf: 21, bob: 1, frame: 1, face: 'shock', lean: -2, jump: 3, hand: -2, slosh: -3 },
  { xb: 13, xf: 21, bob: 1, frame: 0, face: 'shock', jump: 2, sparks: true, hand: -1, slosh: 2 },
  { xb: 14, xf: 20, bob: 2, frame: 1, face: 'dizzy', lean: 1, jump: 4, sparks: true, hand: 1, slosh: -2 },
];

/** Where each animation is in her sheet (CharacterLook.anim). */
export const BLENDER_ANIM = {
  walk: [8, 9, 10, 11, 12, 13],
  roll: [14, 15, 16, 17, 18, 19],
  shoot: 20,
  hurt: [21, 6],
  die: [22, 23],
} as const;

/** Sweatband gloves: lime, like the running shoes (the hands float, no arms). */
function glove(p: Paint, x: number, y: number): void {
  p.ellipsoid(x + 2, y + 2, 2.2, 2.2, 'verde', { dither: 0, bias: -0.1 });
}

/**
 * Short legs, white sports socks and the lime running shoes bought for the same diet: hardly worn,
 * the soles still white. The back leg one tone darker.
 */
function legs(p: Paint, xb: number, xf: number, y: number, L0: number, lift?: 'back' | 'front'): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    const L = L0 - (lift === (back ? 'back' : 'front') ? 1 : 0);
    p.rect(x + 1, y, 2, L, 'goma', back ? 4 : 2);
    p.px(x + 1, y, 'goma', back ? 5 : 3);
    if (L >= 3) p.rect(x + 1, y + L - 2, 2, 2, 'acero', back ? 2 : 0);
    const yb = y + L;
    const sw = back ? 5 : 6;
    p.rect(x, yb, sw, 2, 'verde', back ? 2 : 1);
    p.rect(x + 1, yb, sw - 3, 1, 'verde', back ? 1 : 0);
    p.px(x + sw - 2, yb + 1, 'rosa', back ? 3 : 2);
    p.rect(x, yb + 2, sw, 1, 'acero', back ? 2 : 0);
  }
}

// The body's geometry (frame coordinates, before the bob and the lean).
const X0 = 7; // the motor's left edge
const SW = 6; // its side face's width
const X1 = 33; // its right edge (inclusive)
const TOP = 23; // its top face starts
const TH = 3; // top face height
const FY = TOP + TH; // front face top
const BOT = 39; // front face bottom (exclusive); the rubber foot under it down to the legs
const JAR_TOP = 8;
const JAR_BOT = 19;
const JAR_CX = 20.5;

/** The jar's edges on row y: it widens upwards, a pixel every four rows. */
function jarSpan(y: number): [number, number] {
  const grow = Math.floor((JAR_BOT - y) / 4);
  return [14 - grow, 27 + grow];
}

function paintBody(p: Paint, pose: BlenderPose): void {
  const broken = pose.face === 'broken';
  if (!broken) glove(p, 1, 30 + (pose.hand ?? 0)); // back hand (once broken it has let go)

  // The rubber foot under the motor, with its suction cups.
  p.rect(10, BOT, 21, 3, 'goma', 3);
  p.rect(10, BOT, 21, 1, 'goma', 1);
  p.rect(10, BOT + 2, 21, 1, 'goma', 5);
  for (const x of [12, 27]) p.rect(x, BOT + 1, 2, 1, 'goma', 4);

  // The motor block (the head): top face, a skewed band, the most lit.
  for (let j = 0; j < TH; j++) {
    const off = Math.floor((TH - j) / 2);
    for (let x = X0 + off; x <= X1 - (j === 0 ? 1 : 0); x++) p.px(x, TOP + j, 'violeta', j === 0 ? 1 : x < X0 + off + 2 ? 1 : x < X0 + 10 ? 0 : 1);
  }
  for (let x = X0 + SW; x <= X1; x++) p.px(x, FY, 'violeta', x < X1 - 1 ? 1 : 2);
  // Side face, in shade.
  for (let y = FY; y < BOT; y++) for (let x = X0; x < X0 + SW; x++) p.px(x, y, 'violeta', x === X0 || y === BOT - 1 ? 5 : 4);
  p.rect(X0, FY, SW, 1, 'violeta', 3);
  for (let y = FY + 1; y < BOT; y++) p.px(X0 + SW, y, 'violeta', 1);
  // Front face: glossy plastic, lit at the top, a band of reflection and darker towards the floor.
  for (let y = FY + 1; y < BOT; y++) {
    for (let x = X0 + SW + 1; x <= X1; x++) {
      let tone = y < FY + 3 ? 2 : y < BOT - 2 ? 3 : 4;
      if (x >= X1 - 1) tone++;
      p.px(x, y, 'violeta', tone);
    }
  }
  for (let y = FY + 2; y < FY + 5; y++) p.px(X0 + SW + 2, y, 'violeta', 2);
  for (let x = X0 + SW + 1; x <= X1; x++) p.px(x, BOT - 1, 'violeta', 5);
  for (const [x, y] of [[X0, TOP + 2], [X0, TOP + 3], [X1, TOP], [X1, BOT - 1], [X0, BOT - 1]] as const) p.erase(x, y);

  // Side face: the speed dial, jammed on PULSE (the red pointer), and the returns sticker.
  p.ellipsoid(X0 + 3, FY + 3.5, 1.8, 1.8, 'goma', { dither: 0, bias: 0.1 });
  p.px(X0 + 4, FY + 4, 'rojo', 1);
  p.rect(X0 + 1, FY + 6, 4, 3, 'acero', 1);
  p.rect(X0 + 1, FY + 8, 4, 1, 'acero', 3);
  p.rect(X0 + 2, FY + 7, 2, 1, 'rojo', 2);

  // The jar's rubber collar on the motor, ribbed.
  p.rect(13, 20, 16, 4, 'goma', 3);
  p.rect(13, 20, 16, 1, 'goma', 1);
  p.rect(13, 23, 16, 1, 'goma', 4);
  for (const x of [15, 18, 21, 24, 27]) p.px(x, 21, 'goma', 4);
  p.px(13, 21, 'goma', 2);

  // The glass jar: a cylinder lit from the left, the back rim seen through it at the top.
  for (let y = JAR_TOP; y <= JAR_BOT; y++) {
    const [x0, x1] = jarSpan(y);
    for (let x = x0; x <= x1; x++) {
      const u = (x - x0) / (x1 - x0);
      const tone = x === x0 ? 3 : x === x1 ? 4 : u < 0.2 ? 1 : u < 0.62 ? 2 : u < 0.85 ? 3 : 4;
      p.px(x, y, 'vidrio', tone);
    }
  }
  {
    const [x0, x1] = jarSpan(JAR_TOP);
    p.rect(x0 + 1, JAR_TOP, x1 - x0 - 1, 1, 'vidrio', 4);
  }
  // The smoothie dried since the diet: a thick green layer, its surface tilting as she moves.
  const level = 13;
  const slosh = pose.slosh ?? 0;
  for (let x = 13; x <= 28; x++) {
    const surf = Math.round(level - (slosh * (x - JAR_CX)) / 6);
    for (let y = Math.max(JAR_TOP + 2, surf); y <= JAR_BOT; y++) {
      const [x0, x1] = jarSpan(y);
      if (x <= x0 || x >= x1) continue;
      const u = (x - x0) / (x1 - x0);
      const tone = y === surf ? 1 : y >= JAR_BOT - 1 ? 3 : u > 0.75 ? 3 : 2;
      p.px(x, y, 'verde', tone);
    }
  }
  // Splashes dried up the glass.
  for (const [x, y] of [[17, 10], [24, 9], [25, 11], [19, 9]] as const) p.px(x, y, 'verde', 2);
  // The blades, just showing through the smoothie (a blur while she spins).
  if (pose.spin) {
    p.rect(16, JAR_BOT - 1, 10, 1, 'acero', 2);
    p.rect(18, JAR_BOT - 1, 5, 1, 'acero', 0);
  } else {
    for (const [x, y, t] of [[17, 18, 2], [18, 17, 1], [19, 18, 2], [21, 17, 0], [22, 18, 2], [23, 17, 1]] as const) p.px(x, y, 'acero', t);
  }
  // The glass in front of it all: the window's reflection down the lit side, and the measuring marks.
  for (let y = JAR_TOP + 1; y <= JAR_BOT - 1; y++) {
    const [x0] = jarSpan(y);
    p.px(x0 + 1, y, 'vidrio', 0);
    if (y < JAR_TOP + 6) p.px(x0 + 3, y, 'vidrio', 0);
  }
  for (const y of [10, 13, 16]) {
    const [, x1] = jarSpan(y);
    p.px(x1 - 2, y, 'vidrio', 5);
    p.px(x1 - 3, y, 'vidrio', 5);
  }
  // The handle at the back: dark rubber, open in the middle.
  p.rect(8, 10, 2, 9, 'goma', 3);
  p.px(8, 10, 'goma', 1);
  p.rect(9, 10, 3, 2, 'goma', 2);
  p.rect(9, 17, 3, 2, 'goma', 4);

  // The lid with its measuring cap (they jump on a hit; knocked askew once broken).
  const jump = pose.jump ?? (pose.face === 'hurt' ? 1 : 0);
  const lx = broken ? 3 : 0;
  const ly = broken ? 1 : -jump;
  p.rect(11 + lx, 6 + ly, 20, 2, 'goma', 3);
  p.rect(11 + lx, 6 + ly, 20, 1, 'goma', 2);
  p.rect(12 + lx, 5 + ly, 18, 1, 'goma', 1);
  p.px(30 + lx, 7 + ly, 'goma', 5);
  p.rect(17 + lx, 3 + ly, 6, 2, 'goma', 2);
  p.rect(17 + lx, 3 + ly, 6, 1, 'goma', 0);
  if (broken) {
    // Askew: the lid's front end drops onto the rim; the straw is gone.
    p.rect(29 + lx, 7 + ly, 2, 1, 'goma', 4);
  } else {
    // The straw, red and white, poking out of the lid; it nods a pixel with every other frame.
    const nod = pose.frame % 2;
    const straw: Array<[number, number]> = [[26, 4], [27, 3], [27, 2], [28 + nod, 1], [28 + nod, 0]];
    straw.forEach(([x, y], i) => p.px(x, y - jump, i % 2 ? 'acero' : 'rojo', i % 2 ? 0 : 2));
  }

  // The face, on the front of the motor: the eye nearer to us a pixel wider (three-quarter view).
  const eyes: Array<[number, number, boolean]> = [[17, 4, true], [24, 5, false]];
  for (const [ex, ew, back] of eyes) {
    const inner = back ? ex + ew - 1 : ex; // the brow's end towards the nose
    const outer = back ? ex : ex + ew - 1;
    if (pose.face === 'aim') {
      // Narrowed: the lids down to the middle, the pupil looking ahead, the brows pinched.
      p.rect(ex, 29, ew, 5, 'violeta', 4);
      p.rect(ex, 31, ew, 2, 'acero', 1);
      p.rect(ex, 31, ew, 1, 'violeta', 6);
      p.raw(ex + ew - 2, 32, INK);
      p.rect(ex, 28, ew, 1, 'violeta', 6);
      p.px(inner, 29, 'violeta', 6);
      p.px(inner, 30, 'violeta', 6);
      continue;
    }
    if (pose.face === 'shut') {
      // Closed tight against the spin, a crease at the outer corner.
      p.rect(ex, 31, ew, 1, 'violeta', 6);
      p.px(outer, 30, 'violeta', 6);
      p.px(outer, 32, 'violeta', 5);
      p.rect(ex, 28, ew, 1, 'violeta', 5);
      continue;
    }
    if (pose.face === 'shock' || pose.face === 'dizzy') {
      // Wide open: a dark ring, the whites and a tiny pupil (dizzy: rolled up).
      p.rect(ex, 28, ew, 7, 'violeta', 6);
      p.rect(ex, 29, ew, 5, 'acero', 0);
      p.rect(ex, 33, ew, 1, 'acero', 1);
      if (pose.face === 'shock') p.raw(ex + Math.floor(ew / 2), 31, INK);
      else p.raw(back ? ex + 1 : ex + 2, 29, INK);
      p.rect(ex, 26, ew, 1, 'violeta', 6);
      continue;
    }
    if (!pose.face) {
      // Wide, sleepless eyes with tiny pupils, a vein of red and dark bags under them: she has
      // not slept since the diet. She is going to blend you anyway.
      p.rect(ex, 29, ew, 5, 'acero', 1);
      p.rect(ex, 33, ew, 1, 'acero', 2);
      p.rect(ex, 29, ew, 1, 'violeta', 4);
      p.raw(ex + ew - 2, 31, INK);
      p.px(outer, 32, 'rojo', 1);
      p.rect(ex, 34, ew, 1, 'violeta', 5);
      // Brows: a dark line sloping down to the nose.
      p.rect(ex, 28, ew, 1, 'violeta', 6);
      p.px(inner, 29, 'violeta', 6);
      p.px(outer, 27, 'violeta', 6);
      continue;
    }
    // Hit: squeezed shut (> <). Broken: crossed out.
    const c = ex + Math.floor((ew - 1) / 2);
    const pts: Array<[number, number]> =
      pose.face === 'hurt'
        ? back
          ? [[c - 1, 29], [c, 30], [c + 1, 31], [c, 32], [c - 1, 33]]
          : [[c + 1, 29], [c, 30], [c - 1, 31], [c, 32], [c + 1, 33]]
        : [[c - 1, 30], [c + 1, 30], [c, 31], [c - 1, 32], [c + 1, 32]];
    for (const [x, y] of pts) p.px(x, y, 'violeta', 6);
    p.rect(ex, 28, ew, 1, 'violeta', 5);
  }
  // The mouth: a manic grin, all teeth, pulled up at the front.
  if (pose.face === 'shock') {
    p.rect(21, 35, 3, 3, 'violeta', 6);
    p.px(22, 36, 'rojo', 4);
  } else if (pose.face === 'dizzy') {
    p.rect(21, 35, 3, 2, 'violeta', 6);
    p.px(22, 37, 'rojo', 2);
    p.px(22, 38, 'rojo', 3);
  } else if (broken) {
    p.rect(20, 36, 5, 2, 'violeta', 6);
    p.px(25, 37, 'violeta', 6);
  } else if (pose.face === 'hurt' || pose.face === 'shut') {
    // Teeth clenched, the lips pulled back.
    p.rect(18, 35, 12, 3, 'violeta', 6);
    p.rect(19, 36, 10, 1, 'acero', 1);
    for (const x of [21, 24, 27]) p.px(x, 36, 'acero', 3);
  } else {
    p.rect(18, 35, 12, 3, 'violeta', 6);
    p.rect(19, 35, 10, 1, 'acero', pose.face === 'aim' ? 0 : 1);
    p.rect(20, 37, 8, 1, 'acero', 3);
    for (const x of [21, 24, 27]) p.px(x, 35, 'acero', 3);
    p.px(30, 34, 'violeta', 6);
    p.px(30, 35, 'violeta', 6);
    p.px(18, 37, 'violeta', 4);
    p.px(18, 35, 'violeta', 4);
  }
  // Smoothie dribbled down the front of the motor from the collar, dried long ago.
  p.px(24, FY, 'verde', 2);
  p.px(24, FY + 1, 'verde', 3);
  p.px(31, FY + 1, 'verde', 3);
  if (broken) {
    // A crack right across the jar.
    for (const [x, y] of [[15, 9], [16, 10], [17, 10], [18, 11], [19, 12], [20, 12], [21, 13], [22, 14]] as const) p.px(x, y, 'vidrio', 6);
  }
}

/** The cord: from the back of the motor down to a coil on the floor, still with its twist tie («no se usa»). */
function paintCord(p: Paint, whip?: number): void {
  if (whip !== undefined) {
    // Rolling: the cord whips round behind her, the coil come undone and the plug at its end.
    const th = -1.25 + whip * 0.3;
    let x = 8;
    let y = 39;
    let end: [number, number] = [8, 39];
    for (let i = 1; i <= 11; i++) {
      const a = th + i * 0.09 * (whip % 2 === 0 ? 1 : -1);
      x -= Math.cos(a);
      y -= Math.sin(a) * 0.9;
      const px = Math.round(x);
      const py = Math.min(47, Math.round(y));
      p.px(px, py, 'goma', i % 3 === 0 ? 2 : 3);
      end = [px, py];
    }
    const [ex, ey] = end;
    p.rect(ex - 2, ey - 1, 3, 3, 'acero', 2);
    p.px(ex - 2, ey - 1, 'acero', 0);
    p.px(ex, ey + 1, 'acero', 4);
    return;
  }
  for (const [i, [x, y]] of ([[7, 39], [6, 40], [6, 41], [5, 42]] as const).entries()) p.px(x, y, 'goma', i % 2 ? 2 : 3);
  // The coil lying on the floor and the yellow twist tie round it.
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    p.px(Math.round(4 + Math.cos(a) * 3.2), Math.round(45 + Math.sin(a) * 1.8), 'goma', Math.sin(a) < 0 ? 2 : 4);
  }
  p.px(4, 43, 'amarillo', 1);
  p.px(4, 44, 'amarillo', 2);
}

export function makeBlender(pose: BlenderPose): Canvas {
  const ground = new Paint(BLENDER_W, BLENDER_H);
  paintCord(ground, pose.cord);
  legs(ground, pose.xb, pose.xf, 41, pose.legLen ?? 5, pose.lift);
  const body = new Paint(BLENDER_W, BLENDER_H);
  paintBody(body, pose);
  const all = new Paint(BLENDER_W, BLENDER_H);
  const lean = pose.lean ?? 0;
  all.stamp(ground, 0, 0);
  all.stamp(body, lean, pose.bob);
  const o = all.outline();
  if (pose.sparks) {
    // Dying: yellow-white sparks off the motor, the collar and the cord (two sets, alternating).
    const sets: Array<Array<[number, number]>> = [
      [[11, 19], [31, 21], [35, 30], [5, 38], [2, 42]],
      [[30, 18], [36, 26], [10, 21], [6, 36], [1, 40]],
    ];
    for (const [x, y] of sets[pose.frame % 2]!) {
      const px = x + lean;
      const py = y + pose.bob;
      if (px < 0 || py < 0 || px >= o.w || py >= o.h) continue;
      if (o.get(px, py)[3] === 0) {
        o.set(px, py, [255, 244, 170, 255]);
        if (px + 1 < o.w && o.get(px + 1, py)[3] === 0) o.set(px + 1, py, [240, 184, 64, 200]);
      }
    }
  }
  return o;
}

/** The eight frames of every character. */
export function makeBlenderFrames(): Canvas[] {
  return BLENDER_FRAMES.map((p) => makeBlender(p));
}

/** The whole sheet: the eight frames of every character and then her own (M14c (a4c)). */
export function makeBlenderSheet(): Canvas[] {
  return [...BLENDER_FRAMES, ...BLENDER_EXTRA].map((p) => makeBlender(p));
}

/** Her floating glove in the new style: a lime sweatband glove (the game draws it with the gun). */
export function makeBlenderHand(): Canvas {
  const p = new Paint(7, 7);
  p.ellipsoid(3.5, 3.5, 2.4, 2.4, 'verde', { dither: 0, bias: -0.1 });
  return p.outline();
}

/** The ice crusher's clear hopper (the old 4-tone glass; the weapons are redrawn in (a13)). */
const GLASS = ramp('#f2fbfc', '#cfe8ee', '#9fc3cf', '#6a8f9e');

/**
 * Picahielos Turbo in the hand (18 x 11, spout to the right): a white body with a red TURBO
 * stripe, a clear hopper on top full of orange juice cubes, the chute they come out of and the
 * pistol grip. The plug dangles under it, never plugged in: it runs on «turbo».
 */
export function makeMiniIceCrusher(): Canvas {
  const cv = new Canvas(18, 11);
  // Hopper: clear plastic with cubes inside.
  box(cv, 3, 0, 7, 4, GLASS);
  for (const [x, y] of [[4, 1], [6, 2], [7, 1], [5, 2], [8, 2]] as Pt[]) cv.set(x, y, (x + y) % 2 ? GLOW : GLOW2);
  cv.set(4, 1, YEL[0]!);
  // Body.
  box(cv, 1, 4, 12, 4, FRT);
  cv.rect(2, 6, 10, 1, RED[1]!);
  cv.set(11, 6, RED[0]!);
  // Chute.
  box(cv, 13, 4, 4, 3, DSTEEL);
  cv.set(16, 5, K);
  cv.set(16, 6, GLOW);
  // Grip and trigger.
  cv.rect(4, 8, 3, 3, DSTEEL[2]!);
  cv.set(4, 8, DSTEEL[1]!);
  cv.set(8, 8, DSTEEL[1]!);
  return outline(cv);
}

/** A cube of frozen orange juice (player bullet of the Picahielos, radius 2): orange and yellow, as the rules for player bullets ask. */
export function makeJuiceCube(): Canvas {
  const cv = new Canvas(6, 6);
  const pat = ['.3333.', '311113', '322223', '322224', '322244', '.4444.'];
  const cols: Record<string, RGBA> = { '1': YEL[0]!, '2': GLOW, '3': WHITE, '4': GLOW2 };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** Size of the whirl of blades drawn round the rolling blender (centred on her body). */
export const WHIRL_SIZE = 34;

/**
 * Giro de cuchillas: four frames of three steel blades sweeping round, each with a white edge in
 * front and a faint trail of green smoothie behind. The game plays them while she rolls.
 */
export function makeWhirlFrames(): Canvas[] {
  const out: Canvas[] = [];
  const c = (WHIRL_SIZE - 1) / 2;
  for (let f = 0; f < 4; f++) {
    const cv = new Canvas(WHIRL_SIZE, WHIRL_SIZE);
    // A faint ring of smoothie flung out all round.
    for (let k = 0; k < 96; k++) {
      const a = (k / 96) * Math.PI * 2;
      cv.set(Math.round(c + Math.cos(a) * 15), Math.round(c + Math.sin(a) * 15), hx('#c9e07a', 70));
    }
    // Three blades: thin crescents spiralling in, white at the leading tip, turning 30° a frame.
    for (let b = 0; b < 3; b++) {
      const a0 = ((b * 120 + f * 30) * Math.PI) / 180;
      for (let k = 0; k <= 24; k++) {
        const t = k / 24;
        const a = a0 - t * 1.1;
        const r = 16 - t * 5;
        const x = Math.round(c + Math.cos(a) * r);
        const y = Math.round(c + Math.sin(a) * r);
        const col = t < 0.12 ? WHITE : t < 0.55 ? STEEL[0]! : STEEL[2]!;
        cv.set(x, y, col);
        if (t < 0.6) cv.set(Math.round(c + Math.cos(a) * (r - 1)), Math.round(c + Math.sin(a) * (r - 1)), t < 0.12 ? STEEL[0]! : STEEL[1]!);
      }
    }
    out.push(cv);
  }
  return out;
}
