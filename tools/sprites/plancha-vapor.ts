// M13 (4): la Plancha de Vapor, third playable character, with her starting weapon (the
// Pulverizador de Almidón), its starch drops and the puffs of steam her soleplate leaves behind.
// M14c (a4c2): she herself redrawn in the new style, with her own frames (makeIronSheet).
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { DSTEEL, FRT, WHITE, YEL, box, outline, ramp } from '../../src/art/lib.ts';
import { INK } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

type Pt = readonly [number, number];

/** The old 4-tone teal of her shell: the Mostrador's display case still paints her with it. */
export const TEAL = ramp('#8fd9c8', '#3fa996', '#2a7b74', '#1b4f55');
/** The handle and the dial: navy rubber. */
const NAVY = ramp('#7d93c4', '#43588f', '#2d3c6a', '#1d2748');

// M14c (a4c2): the Plancha de Vapor in the new style (src/art/paleta.ts, src/art/pintor.ts), with
// her own frames after the eight of every character, like the toaster and the blender. The legs,
// the cord and the scrap of collar are painted apart from the body so the body can bob over them;
// they are stamped together and outlined once (Paint.stamp).

/** Frame size and where the feet are in it (CharacterLook of the iron in src/data/characters.ts). */
export const IRON_W = 46;
export const IRON_H = 43;
export const IRON_FEET_X = 23.5;
export const IRON_FEET_Y = 42;
/** Height in the frame of the middle of her body (handle to soleplate): the roll spins round it. */
export const IRON_SPIN_Y = 20;

export interface IronPose {
  /** Back and front leg x (at rest 16 and 24). */
  xb: number;
  xf: number;
  /** Vertical offset of the body over the legs (breathing, the walk's bounce). */
  bob: number;
  /**
   * Squeezed eyes when hit; crossed out, a crack in the shell and the handle off its front post
   * once broken; `aim` the lids lower still (shooting), `shut` eyes closed tight (rolling), `shock`
   * wide-open eyes (knocked back, the first shudder), `dizzy` rolled-up eyes (the last shudder).
   */
  face?: 'hurt' | 'broken' | 'aim' | 'shut' | 'shock' | 'dizzy';
  /** Animation frame (the puff at the tip comes every other frame). */
  frame: number;
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
  /** Sparks crackling round the dial and the cord (dying). */
  sparks?: boolean;
  /** A burst of steam out of the soleplate's holes (a hit, the shudders). */
  burst?: boolean;
  /** The water in the tank tilting (px at its sides; positive: up at the front). */
  slosh?: number;
  /** No puff at the tip (rolling: it is left behind). */
  noSteam?: boolean;
}

/** Her eight frames, in the order of CharacterLook (idle ×2, walk ×4, hurt, broken). */
export const IRON_FRAMES: readonly IronPose[] = [
  { xb: 16, xf: 24, bob: 0, frame: 0 },
  { xb: 16, xf: 24, bob: 1, frame: 1 },
  { xb: 15, xf: 25, bob: 0, frame: 0, slosh: 1 },
  { xb: 19, xf: 21, bob: -1, frame: 1 },
  { xb: 24, xf: 16, bob: 0, frame: 0, slosh: -1 },
  { xb: 21, xf: 19, bob: -1, frame: 1 },
  { xb: 17, xf: 23, bob: 1, frame: 0, face: 'hurt', burst: true },
  { xb: 16, xf: 24, bob: 1, frame: 0, face: 'broken' },
];

/**
 * Her own frames after the eight (CharacterLook.anim): a six-step walk, heavy, the water rocking
 * in the tank; the roll curled up with the cord whipping round; the landing; the kick of a shot;
 * the first instant of a hit with a burst of steam; and two shudders before she breaks.
 */
export const IRON_EXTRA: readonly IronPose[] = [
  { xb: 24, xf: 16, bob: 1, frame: 0, hand: 0, slosh: -1 },
  { xb: 22, xf: 18, bob: -1, frame: 1, lift: 'front', hand: 1, slosh: 0 },
  { xb: 18, xf: 22, bob: -1, frame: 0, lift: 'front', hand: 1, slosh: 1 },
  { xb: 15, xf: 25, bob: 1, frame: 1, hand: 0, slosh: 1 },
  { xb: 18, xf: 22, bob: -1, frame: 0, lift: 'back', hand: -1, slosh: 0 },
  { xb: 22, xf: 18, bob: -1, frame: 1, lift: 'back', hand: -1, slosh: -1 },
  { xb: 17, xf: 23, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 0, hand: -2, slosh: 2, noSteam: true },
  { xb: 18, xf: 22, bob: 0, frame: 1, face: 'shut', legLen: 1, cord: 1, hand: -2, slosh: -2, noSteam: true },
  { xb: 17, xf: 23, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 2, hand: -2, slosh: 2, noSteam: true },
  { xb: 18, xf: 22, bob: 0, frame: 1, face: 'shut', legLen: 1, cord: 3, hand: -2, slosh: -2, noSteam: true },
  { xb: 17, xf: 23, bob: 0, frame: 0, face: 'shut', legLen: 1, cord: 4, hand: -2, slosh: 2, noSteam: true },
  { xb: 15, xf: 25, bob: 0, frame: 1, legLen: 3, cord: 5, hand: 1, slosh: -1 },
  { xb: 16, xf: 24, bob: 0, frame: 0, face: 'aim', lean: -1, slosh: -1 },
  { xb: 17, xf: 24, bob: 1, frame: 1, face: 'shock', lean: -2, hand: -2, burst: true, slosh: -2 },
  { xb: 16, xf: 24, bob: 1, frame: 0, face: 'shock', sparks: true, burst: true, hand: -1, slosh: 2 },
  { xb: 17, xf: 23, bob: 2, frame: 1, face: 'dizzy', lean: 1, sparks: true, hand: 1, slosh: -2 },
];

/** Where each animation is in her sheet (CharacterLook.anim). */
export const IRON_ANIM = {
  walk: [8, 9, 10, 11, 12, 13],
  roll: [14, 15, 16, 17, 18, 19],
  shoot: 20,
  hurt: [21, 6],
  die: [22, 23],
} as const;

/** White cotton gloves, for ironing the good shirts (the hands float, no arms). */
function glove(p: Paint, x: number, y: number): void {
  p.ellipsoid(x + 2, y + 2, 2.2, 2.2, 'crema', { dither: 0, bias: -0.15 });
}

/**
 * Short legs in dark trousers and the black shoes polished for the job interview, long and
 * pointed, with a shine on the toe. The back leg one tone darker.
 */
function legs(p: Paint, xb: number, xf: number, y: number, L0: number, lift?: 'back' | 'front'): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    const L = L0 - (lift === (back ? 'back' : 'front') ? 1 : 0);
    p.rect(x + 1, y, 3, L, 'azul', back ? 6 : 5);
    p.px(x + 3, y, 'azul', 6);
    const yb = y + L;
    const sw = back ? 6 : 7;
    p.rect(x, yb, sw, 2, 'goma', back ? 5 : 4);
    p.rect(x + 1, yb, sw - 3, 1, 'goma', back ? 4 : 3);
    p.px(x + sw - 2, yb, 'acero', back ? 2 : 0);
    p.rect(x, yb + 2, sw, 1, 'goma', 5);
  }
}

// The body's geometry (frame coordinates, before the bob and the lean).
const BACK = 6; // the flat back of the shell
const SH_TOP = 15; // the shell's top row
const SH_BOT = 31; // its last row (the white trim)
const SOLE = 32; // the soleplate's first row

/** Where the shell's sloping front edge is on row y. */
function front(y: number): number {
  return 24 + y - SH_TOP;
}

function paintBody(p: Paint, pose: IronPose): void {
  const broken = pose.face === 'broken';
  if (!broken) glove(p, 2, 24 + (pose.hand ?? 0)); // back hand (once broken it has let go)

  // The soleplate: polished steel with its point forward, the steam holes underneath.
  p.rect(5, SOLE, 37, 1, 'acero', 1);
  p.rect(6, SOLE + 1, 37, 1, 'acero', 3);
  p.rect(7, SOLE + 2, 34, 1, 'acero', 5);
  p.px(42, SOLE + 1, 'acero', 2);
  for (let x = 9; x < 40; x += 4) p.px(x, SOLE + 2, 'acero', 6);
  p.rect(10, SOLE, 9, 1, 'acero', 0);

  // The shell: a flat back, a top that slopes down to the point. Lit from above-left: the top rows
  // and the sloping front catch the light; the back is in shade; darker towards the trim.
  for (let y = SH_TOP; y <= SH_BOT; y++) {
    const x0 = y === SH_TOP ? BACK + 2 : y === SH_TOP + 1 ? BACK + 1 : BACK;
    const x1 = Math.min(front(y), 40);
    for (let x = x0; x <= x1; x++) {
      let tone = y < SH_TOP + 3 ? 1 : y < SH_TOP + 9 ? 2 : 3;
      if (x < BACK + 3) tone += 2;
      else if (x < BACK + 4) tone += 1;
      if (x >= x1 - 1) tone = x === x1 ? 0 : 1;
      p.px(x, y, 'turquesa', tone);
    }
  }
  // A long highlight along the top of the shell, and the shell's lower lip in shade.
  for (let x = BACK + 5; x < 22; x++) p.px(x, SH_TOP + 1, 'turquesa', 0);
  for (let x = BACK + 3; x <= front(SH_BOT - 2) - 2; x++) p.px(x, SH_BOT - 2, 'turquesa', 4);
  // The white trim along the bottom of the shell.
  p.rect(BACK, SH_BOT - 1, 35, 2, 'crema', 1);
  p.rect(BACK, SH_BOT - 1, 35, 1, 'crema', 0);
  p.rect(BACK, SH_BOT - 1, 3, 2, 'crema', 3);

  // The handle: navy rubber arching over the top, open underneath; the red steam button on it,
  // pressed for years.
  p.rect(10, 5, 20, 3, 'azul', 4);
  p.rect(10, 5, 20, 1, 'azul', 2);
  p.rect(11, 7, 18, 1, 'azul', 5);
  p.rect(10, 8, 3, SH_TOP - 8, 'azul', 5);
  p.px(10, 8, 'azul', 4);
  if (!broken) for (let y = 8; y < SH_TOP + 1; y++) p.rect(29 - Math.floor((y - 8) / 2), y, 3, 1, 'azul', y === 8 ? 4 : 5);
  else for (let y = 8; y < 11; y++) p.rect(29, y, 2, 1, 'azul', 5);
  p.rect(17, 4, 4, 1, 'rojo', 2);
  p.px(17, 4, 'rojo', 1);

  // The water tank: a window at the back, a third full, the water rocking as she goes.
  p.rect(BACK + 4, SH_TOP + 4, 6, 9, 'cian', 4);
  p.rect(BACK + 5, SH_TOP + 5, 4, 7, 'cian', 1);
  const lvl = SH_TOP + 9;
  for (let x = BACK + 5; x < BACK + 9; x++) {
    const top = Math.round(lvl - ((pose.slosh ?? 0) * (x - (BACK + 6.5))) / 2);
    for (let y = Math.max(SH_TOP + 5, top); y < SH_TOP + 12; y++) p.px(x, y, 'cian', y === top ? 2 : 3);
  }
  p.px(BACK + 5, SH_TOP + 6, 'cian', 0);
  p.px(BACK + 9, SH_TOP + 7, 'cian', 5);
  p.px(BACK + 9, SH_TOP + 10, 'cian', 5);

  // The temperature dial on the shell, the pointer jammed on LINO (red), and a drop of limescale.
  p.ellipsoid(BACK + 7, SH_TOP + 13.5, 1.8, 1.6, 'azul', { dither: 0, bias: 0.1 });
  if (!broken) p.px(BACK + 8, SH_TOP + 14, 'rojo', 1);
  p.px(35, 26, 'crema', 0);

  // The face, on the side of the shell: heavy flat lids, she has ironed worse than you.
  const eyes: Array<[number, number, boolean]> = [[18, 4, true], [24, 5, false]];
  for (const [ex, ew, back] of eyes) {
    const outer = back ? ex : ex + ew - 1;
    const inner = back ? ex + ew - 1 : ex;
    if (pose.face === 'aim') {
      p.rect(ex, 19, ew, 4, 'turquesa', 3);
      p.rect(ex, 21, ew, 1, 'turquesa', 6);
      p.rect(ex, 22, ew, 1, 'acero', 1);
      p.raw(ex + ew - 2, 22, INK);
      p.px(inner, 21, 'turquesa', 6);
      continue;
    }
    if (pose.face === 'shut') {
      p.rect(ex, 21, ew, 1, 'turquesa', 6);
      p.px(outer, 20, 'turquesa', 6);
      p.rect(ex, 19, ew, 1, 'turquesa', 5);
      continue;
    }
    if (pose.face === 'shock' || pose.face === 'dizzy') {
      p.rect(ex, 18, ew, 6, 'turquesa', 6);
      p.rect(ex, 19, ew, 4, 'acero', 0);
      if (pose.face === 'shock') p.raw(ex + Math.floor(ew / 2), 21, INK);
      else p.raw(back ? ex + 1 : ex + 2, 19, INK);
      p.rect(ex, 16, ew, 1, 'turquesa', 5);
      continue;
    }
    if (!pose.face) {
      // Whites, the lid flat across the top half, a dark line under it, the pupil ahead.
      p.rect(ex, 19, ew, 4, 'acero', 1);
      p.rect(ex, 19, ew, 2, 'turquesa', 3);
      p.rect(ex, 20, ew, 1, 'turquesa', 6);
      p.rect(ex + ew - 2, 21, 2, 2, 'goma', 5);
      p.raw(ex + ew - 1, 21, INK);
      p.rect(ex, 23, ew, 1, 'turquesa', 3);
      p.px(outer, 18, 'turquesa', 5);
      continue;
    }
    const c = ex + Math.floor((ew - 1) / 2);
    const pts: Array<[number, number]> =
      pose.face === 'hurt'
        ? back
          ? [[c - 1, 19], [c, 20], [c + 1, 21], [c, 22], [c - 1, 23]]
          : [[c + 1, 19], [c, 20], [c - 1, 21], [c, 22], [c + 1, 23]]
        : [[c - 1, 20], [c + 1, 20], [c, 21], [c - 1, 22], [c + 1, 22]];
    for (const [x, y] of pts) p.px(x, y, 'turquesa', 6);
    p.rect(ex, 18, ew, 1, 'turquesa', 5);
  }
  // The mouth: a straight, unimpressed line, one corner down (a grimace hurt, slack broken).
  if (pose.face === 'shock' || pose.face === 'dizzy') {
    p.rect(25, 25, 3, 3, 'turquesa', 6);
    if (pose.face === 'dizzy') p.px(26, 27, 'rojo', 2);
  } else if (broken) {
    p.rect(24, 26, 4, 2, 'turquesa', 6);
  } else if (pose.face === 'hurt' || pose.face === 'shut') {
    p.rect(22, 25, 9, 3, 'turquesa', 6);
    p.rect(23, 26, 7, 1, 'acero', 1);
  } else {
    p.rect(22, 26, 9, 1, 'turquesa', 6);
    p.px(21, 27, 'turquesa', 6);
    if (pose.face === 'aim') p.px(31, 25, 'turquesa', 6);
    p.rect(23, 27, 7, 1, 'turquesa', 2);
  }
  if (broken) {
    // A crack across the shell.
    for (const [x, y] of [[14, 15], [15, 16], [16, 16], [17, 17], [18, 18], [18, 19]] as const) p.px(x, y, 'turquesa', 6);
  }
}

/** The cord: out of the back, down to a coil on the floor with a bit of yellow tape on it. */
function paintCord(p: Paint, whip?: number): void {
  if (whip !== undefined) {
    const th = -1.25 + whip * 0.3;
    let x = 6;
    let y = 30;
    let end: [number, number] = [6, 30];
    for (let i = 1; i <= 11; i++) {
      const a = th + i * 0.09 * (whip % 2 === 0 ? 1 : -1);
      x -= Math.cos(a);
      y -= Math.sin(a) * 0.9;
      const px = Math.round(x);
      const py = Math.min(40, Math.round(y));
      p.px(px, py, 'goma', i % 3 === 0 ? 2 : 3);
      end = [px, py];
    }
    const [ex, ey] = end;
    p.rect(ex - 2, ey - 1, 3, 3, 'acero', 2);
    p.px(ex - 2, ey - 1, 'acero', 0);
    p.px(ex, ey + 1, 'acero', 4);
    return;
  }
  for (const [i, [x, y]] of ([[5, 30], [4, 31], [3, 32], [3, 33], [3, 34], [3, 35]] as const).entries()) p.px(x, y, 'goma', i % 2 ? 2 : 3);
  for (let k = 0; k < 20; k++) {
    const a = (k / 20) * Math.PI * 2;
    p.px(Math.round(4 + Math.cos(a) * 3.2), Math.round(38.5 + Math.sin(a) * 1.8), 'goma', Math.sin(a) < 0 ? 2 : 4);
  }
  p.px(2, 37, 'amarillo', 1);
  p.px(2, 38, 'amarillo', 2);
}

/** The scrap of shirt collar burnt in the shape of the soleplate, stuck under its back. */
function paintCollar(p: Paint): void {
  p.rect(2, 33, 6, 2, 'crema', 1);
  p.rect(3, 35, 3, 1, 'crema', 2);
  p.px(2, 33, 'crema', 0);
  p.rect(5, 33, 3, 2, 'quemada', 1);
  p.px(4, 34, 'quemada', 0);
  p.px(7, 33, 'quemada', 3);
}

export function makeIron(pose: IronPose): Canvas {
  const ground = new Paint(IRON_W, IRON_H);
  paintCord(ground, pose.cord);
  legs(ground, pose.xb, pose.xf, 34, pose.legLen ?? 5, pose.lift);
  const body = new Paint(IRON_W, IRON_H);
  paintCollar(body);
  paintBody(body, pose);
  const all = new Paint(IRON_W, IRON_H);
  const lean = pose.lean ?? 0;
  all.stamp(ground, 0, 0);
  all.stamp(body, lean, pose.bob);
  const o = all.outline();
  const put = (x: number, y: number, c: RGBA): void => {
    // put, not set: set would blend the see-through steam with the empty pixel and darken it.
    if (x >= 0 && y >= 0 && x < o.w && y < o.h && o.get(x, y)[3] === 0) o.put(x, y, c);
  };
  if (pose.sparks) {
    const sets: Array<Array<[number, number]>> = [
      [[4, 26], [12, 3], [33, 9], [1, 31], [44, 30]],
      [[3, 22], [9, 4], [36, 12], [0, 34], [44, 28]],
    ];
    for (const [x, y] of sets[pose.frame % 2]!) {
      put(x + lean, y + pose.bob, [255, 244, 170, 255]);
      put(x + lean + 1, y + pose.bob, [240, 184, 64, 200]);
    }
  }
  if (pose.burst) {
    // A burst of steam out of the holes, along the soleplate and past the point.
    for (const [x, y, a] of [[11, 36, 190], [34, 36, 190], [38, 37, 170], [42, 35, 170], [44, 32, 140], [14, 38, 120]] as const) {
      for (const [dx, dy, k] of [[0, 0, 1], [1, 0, 0.8], [0, -1, 0.7], [-1, 0, 0.6], [1, -1, 0.5]] as const) put(x + dx + lean, y + dy + pose.bob, hx('#f4f1e8', Math.round(a * k)));
    }
  }
  if (pose.face !== 'broken' && !pose.noSteam && pose.frame % 2 === 1) {
    // A little steam from the soleplate's tip every other frame.
    put(43 + lean, 31 + pose.bob, hx('#f4f1e8', 170));
    put(44 + lean, 30 + pose.bob, hx('#f4f1e8', 120));
    put(44 + lean, 29 + pose.bob, hx('#f4f1e8', 80));
  }
  return o;
}

/** The eight frames of every character. */
export function makeIronFrames(): Canvas[] {
  return IRON_FRAMES.map((p) => makeIron(p));
}

/** The whole sheet: the eight frames of every character and then her own (M14c (a4c2)). */
export function makeIronSheet(): Canvas[] {
  return [...IRON_FRAMES, ...IRON_EXTRA].map((p) => makeIron(p));
}

/** Her floating glove in the new style: white cotton (the game draws it with the gun). */
export function makeIronHand(): Canvas {
  const p = new Paint(7, 7);
  p.ellipsoid(3.5, 3.5, 2.4, 2.4, 'crema', { dither: 0, bias: -0.15 });
  return p.outline();
}

/**
 * Pulverizador de Almidón in the hand (18 x 11, nozzle to the right): a white trigger bottle with
 * a lemon-yellow label (the «Brisa de Limón» that smells of neither), the navy trigger head and
 * its nozzle, and starch dried round the nozzle.
 */
export function makeMiniStarchSpray(): Canvas {
  const cv = new Canvas(18, 11);
  // Bottle: white plastic, the label in the middle.
  box(cv, 1, 3, 9, 8, FRT);
  cv.rect(2, 5, 7, 4, YEL[1]!);
  cv.rect(2, 5, 7, 1, YEL[0]!);
  cv.set(4, 7, WHITE);
  cv.set(6, 7, WHITE);
  cv.rect(2, 8, 7, 1, YEL[2]!);
  // Neck and trigger head.
  cv.rect(3, 2, 5, 1, NAVY[2]!);
  box(cv, 2, 0, 12, 3, NAVY);
  // Nozzle with a crust of starch.
  cv.rect(14, 0, 3, 2, DSTEEL[1]!);
  cv.set(16, 0, WHITE);
  cv.set(16, 1, YEL[0]!);
  // Trigger.
  cv.rect(10, 3, 2, 3, NAVY[1]!);
  cv.set(11, 5, NAVY[2]!);
  return outline(cv);
}

/** A drop of starch (player bullet of the Pulverizador, radius 3): lemon yellow with an orange rim, as player bullets go. */
export function makeStarchDrop(): Canvas {
  const cv = new Canvas(8, 8);
  const pat = ['..33....', '.3113...', '311223..', '3122224.', '3222224.', '.322244.', '..4444..', '........'];
  const cols: Record<string, RGBA> = { '1': WHITE, '2': YEL[0]!, '3': YEL[1]!, '4': hx('#ff9a2f') };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** Size of a puff of steam on the floor (Suela caliente). */
export const STEAM_W = 18;
export const STEAM_H = 12;

/**
 * Suela caliente: four frames of a puff of steam on the floor, from the fresh print of the hot
 * soleplate (a flat, orange-hot outline with a white cloud on it) to a wisp that fades. The game
 * plays them over the puff's life.
 */
export function makeSteamFrames(): Canvas[] {
  const out: Canvas[] = [];
  const cx = (STEAM_W - 1) / 2;
  const cy = (STEAM_H - 1) / 2 + 1;
  for (let f = 0; f < 4; f++) {
    const cv = new Canvas(STEAM_W, STEAM_H);
    // The hot print on the floor, flat (it fades from orange to a dull red).
    const hot = [hx('#ffb347', 255), hx('#ff7a1f', 220), hx('#e0453b', 170), hx('#a42f37', 110)][f]!;
    for (let k = 0; k < 40; k++) {
      const a = (k / 40) * Math.PI * 2;
      cv.set(Math.round(cx + Math.cos(a) * 7), Math.round(cy + Math.sin(a) * 3.5), hot);
    }
    // The cloud: blobs that grow and thin out.
    const r = 2.5 + f * 0.8;
    const alpha = [250, 225, 180, 120][f]!;
    const blobs: Pt[] = [[-3, -1], [2, -2], [0, -4 - f], [4, 0], [-5, 1]];
    blobs.forEach(([bx, by], i) => {
      if (f === 3 && i > 2) return;
      for (let y = -4; y <= 4; y++) {
        for (let x = -4; x <= 4; x++) {
          if (x * x + y * y > r * r) continue;
          const px = Math.round(cx + bx + x);
          const py = Math.round(cy + by + y - f);
          if (px < 0 || py < 0 || px >= STEAM_W || py >= STEAM_H) continue;
          const light = y < -r / 3 || x < -r / 3 ? WHITE : hx('#e9eef5');
          cv.set(px, py, [light[0], light[1], light[2], alpha] as RGBA);
        }
      }
    });
    out.push(cv);
  }
  return out;
}
