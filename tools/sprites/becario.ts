// M13 (5): El Becario Eterno, the only playable character who is not an appliance.
// M14c (a4d1): redrawn in the new style (src/art/paleta.ts, src/art/pintor.ts), bigger, with his
// own frames after the eight of every character, like the toaster, the blender and the iron.
//
// His jokes: the lanyard with a «BECARIO» badge whose photo was never taken (a grey square), the
// coffee he carries in the back hand (he fetches them, he does not drink them) and its stain on
// the shirt, the yellow pósit stuck in his hair and the bags under his eyes. Messy hair: no time
// to comb it in six years of internship. Cheap loafers with a penny in the slot (his only savings).
//
// The legs (and the coffee once dropped) are painted apart from the body so the body can bob over
// them; the two are stamped together and outlined once (Paint.stamp).
import type { Canvas, RGBA } from '../../src/art/canvas.ts';
import { INK, SHINE, MATERIALS } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

type Pt = readonly [number, number];

/** Frame size and where the feet are in it (CharacterLook of the Becario in src/data/characters.ts). */
export const BECARIO_W = 40;
export const BECARIO_H = 47;
export const BECARIO_FEET_X = 20.5;
export const BECARIO_FEET_Y = 46;
/** Height in the frame of the middle of his body (pósit to belt): the roll spins round it. */
export const BECARIO_SPIN_Y = 20;

export interface BecarioPose {
  /** Back and front leg x (at rest 13 and 21). */
  xb: number;
  xf: number;
  /** Vertical offset of the body over the legs (breathing, the walk's bounce). */
  bob: number;
  /**
   * Squeezed eyes when hit; crossed out, the badge turned round and the coffee on the floor once
   * broken; `aim` narrowed eyes (shooting), `shut` eyes closed tight (rolling), `shock` wide-open
   * eyes (knocked back, the first shudder), `dizzy` rolled-up eyes (the last shudder).
   */
  face?: 'hurt' | 'broken' | 'aim' | 'shut' | 'shock' | 'dizzy';
  /** Animation frame (the pósit's corner curls up on odd frames). */
  frame: number;
  /** The body leaning over the legs, in px (negative: back, away from where he looks). */
  lean?: number;
  /** Leg length (default 5; 1 tucked up in the roll, 3 stretching out to land). */
  legLen?: number;
  /** The swinging leg's foot lifted a pixel off the floor (the six-frame walk). */
  lift?: 'back' | 'front';
  /** The back hand (and its coffee) a pixel up or down (it swings with the steps). */
  hand?: number;
  /** Where the badge has swung to on its lanyard while rolling (0–5; unset: on his chest). */
  swing?: number;
  /** Coffee jumping out of the cup (a hit, the first shudder). */
  spill?: boolean;
  /** Papers flying off him (dying: he is not an appliance, there are no sparks). */
  papers?: boolean;
}

/** His eight frames, in the order of CharacterLook (idle ×2, walk ×4, hurt, broken). */
export const BECARIO_FRAMES: readonly BecarioPose[] = [
  { xb: 13, xf: 21, bob: 0, frame: 0 },
  { xb: 13, xf: 21, bob: 1, frame: 1 },
  { xb: 12, xf: 22, bob: 0, frame: 0, hand: 1 },
  { xb: 16, xf: 18, bob: -1, frame: 1 },
  { xb: 21, xf: 13, bob: 0, frame: 0, hand: -1 },
  { xb: 18, xf: 16, bob: -1, frame: 1 },
  { xb: 14, xf: 20, bob: 1, frame: 0, face: 'hurt', spill: true },
  { xb: 13, xf: 21, bob: 1, frame: 0, face: 'broken' },
];

/**
 * His own frames after the eight (CharacterLook.anim): a six-step walk, a bit hurried (he is
 * always late with the coffees); the roll curled up with the badge whirling on its lanyard; the
 * landing; the kick of a shot; the first instant of a hit with the coffee jumping out; and two
 * shudders, with his papers flying, before he collapses.
 */
export const BECARIO_EXTRA: readonly BecarioPose[] = [
  { xb: 21, xf: 13, bob: 1, frame: 0, hand: 0 },
  { xb: 19, xf: 15, bob: -1, frame: 1, lift: 'front', hand: 1 },
  { xb: 15, xf: 19, bob: -1, frame: 0, lift: 'front', hand: 1 },
  { xb: 12, xf: 22, bob: 1, frame: 1, hand: 0 },
  { xb: 15, xf: 19, bob: -1, frame: 0, lift: 'back', hand: -1 },
  { xb: 19, xf: 15, bob: -1, frame: 1, lift: 'back', hand: -1 },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, swing: 0, hand: -2 },
  { xb: 15, xf: 19, bob: 0, frame: 1, face: 'shut', legLen: 1, swing: 1, hand: -2 },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, swing: 2, hand: -2 },
  { xb: 15, xf: 19, bob: 0, frame: 1, face: 'shut', legLen: 1, swing: 3, hand: -2 },
  { xb: 14, xf: 20, bob: 0, frame: 0, face: 'shut', legLen: 1, swing: 4, hand: -2 },
  { xb: 12, xf: 22, bob: 0, frame: 1, legLen: 3, swing: 5, hand: 1 },
  { xb: 13, xf: 21, bob: 0, frame: 0, face: 'aim', lean: -1 },
  { xb: 14, xf: 21, bob: 1, frame: 1, face: 'shock', lean: -2, hand: -2, spill: true },
  { xb: 13, xf: 21, bob: 1, frame: 0, face: 'shock', papers: true, hand: -1 },
  { xb: 14, xf: 20, bob: 2, frame: 1, face: 'dizzy', lean: 1, papers: true, hand: 1 },
];

/** Where each animation is in his sheet (CharacterLook.anim). */
export const BECARIO_ANIM = {
  walk: [8, 9, 10, 11, 12, 13],
  roll: [14, 15, 16, 17, 18, 19],
  shoot: 20,
  hurt: [21, 6],
  die: [22, 23],
} as const;

/** Short legs in chinos (the back one a tone darker) and cheap brown loafers with a penny in the slot. */
function legs(p: Paint, xb: number, xf: number, y: number, L0: number, lift?: 'back' | 'front'): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    const L = L0 - (lift === (back ? 'back' : 'front') ? 1 : 0);
    p.rect(x + 1, y, 3, L, 'carton', back ? 3 : 2);
    p.px(x + 1, y, 'carton', back ? 4 : 3);
    if (L >= 3) p.px(x + 1, y + 1, 'carton', back ? 2 : 1);
    const yb = y + L;
    const sw = back ? 6 : 7;
    p.rect(x, yb, sw, 2, 'quemada', back ? 2 : 1);
    p.rect(x + 1, yb, sw - 3, 1, 'quemada', back ? 1 : 0);
    p.px(x + sw - 3, yb, 'laton', back ? 2 : 1); // the penny
    p.rect(x, yb + 2, sw, 1, 'quemada', 4);
  }
}

// The body's geometry (frame coordinates, before the bob and the lean).
const HX0 = 10; // head, left (the ear side, in shade)
const HX1 = 31; // head, right (inclusive)
const HY0 = 10; // head, top (under the hair)
const HY1 = 25; // head, bottom (inclusive)
const SX0 = 13; // shirt, left
const SX1 = 28; // shirt, right (inclusive)
const SY0 = 27; // shirt, top
const BELT = 37; // the belt row; the legs start under it

/** Where the badge hangs (top-left corner) for each step of the roll's swing; unset: on the chest. */
const SWING: readonly Pt[] = [[11, 33], [6, 27], [12, 21], [26, 22], [30, 29], [24, 34]];

function paintHead(p: Paint, pose: BecarioPose): void {
  const broken = pose.face === 'broken';
  // The skin block in three-quarter view: the ear side in shade on the left, the face in the
  // middle tones, the chin darker; the hair casts a band of shade on the forehead.
  for (let y = HY0; y <= HY1; y++) {
    for (let x = HX0; x <= HX1; x++) {
      if ((y === HY1 && (x === HX0 || x === HX1 || x === HX0 + 1)) || (y === HY0 && x === HX1)) continue;
      let tone = 1;
      if (x <= HX0 + 2) tone = 3;
      else if (x === HX0 + 3) tone = 2;
      else if (y >= HY1 - 1 || x === HX1) tone = 2;
      if (y >= HY1 - 1 && x <= HX0 + 3) tone = 4;
      p.px(x, y, 'piel', tone);
    }
  }
  // A highlight on the cheekbone and the forehead.
  for (const [x, y] of [[16, 15], [17, 15], [28, 20], [29, 19]] as const) p.px(x, y, 'piel', 0);
  // The ear.
  p.rect(HX0 + 1, 17, 2, 4, 'piel', 2);
  p.px(HX0 + 1, 18, 'piel', 4);
  p.px(HX0 + 1, 19, 'piel', 4);
  // The nose, sticking out of his profile.
  p.px(HX1 + 1, 19, 'piel', 2);
  p.px(HX1 + 1, 20, 'piel', 3);
  p.px(HX1, 21, 'piel', 3);

  // Eyes: tired, heavy lids, bags underneath.
  for (const [ex, far] of [[18, true], [25, false]] as const) {
    const f = pose.face;
    p.rect(ex - (far ? 0 : 0), 15, 3, 1, 'quemada', 2); // brows, flat
    if (f === 'shock' || f === 'dizzy') {
      p.rect(ex, 14, 3, 1, 'quemada', 2);
      p.rect(ex, 15, 3, 4, 'acero', 0);
      p.px(ex, 18, 'acero', 2);
      if (f === 'shock') p.raw(ex + 1, 16, INK);
      else p.raw(ex + (far ? 0 : 1), 15, INK);
      continue;
    }
    if (f === 'shut') {
      p.rect(ex, 17, 3, 1, 'piel', 5);
      p.px(ex + 2, 16, 'piel', 5);
      p.rect(ex, 18, 3, 1, 'piel', 3);
      continue;
    }
    if (f === 'aim') {
      p.rect(ex, 16, 3, 1, 'piel', 3);
      p.rect(ex, 17, 3, 1, 'piel', 5);
      p.px(ex, 18, 'acero', 1);
      p.raw(ex + 1, 18, INK);
      p.raw(ex + 2, 18, INK);
      p.rect(ex, 19, 3, 1, 'piel', 3);
      continue;
    }
    if (f === 'hurt' || f === 'broken') {
      const pts: Pt[] =
        f === 'hurt'
          ? far
            ? [[ex, 16], [ex + 1, 17], [ex + 2, 17], [ex, 18]]
            : [[ex + 2, 16], [ex + 1, 17], [ex, 17], [ex + 2, 18]]
          : [[ex, 16], [ex + 2, 16], [ex + 1, 17], [ex, 18], [ex + 2, 18]];
      for (const [x, y] of pts) p.px(x, y, 'piel', 5);
      p.rect(ex, 19, 3, 1, 'piel', 3);
      continue;
    }
    // At rest: the lid down to half the eye, the pupil looking ahead (right), the bags.
    p.rect(ex, 16, 3, 1, 'piel', 3);
    p.rect(ex, 17, 3, 1, 'piel', 5);
    p.px(ex, 18, 'acero', 1);
    p.raw(ex + 1, 18, INK);
    p.raw(ex + 2, 18, INK);
    p.rect(ex, 19, 3, 1, 'piel', 3);
    p.px(ex + 1, 20, 'piel', 2);
  }
  // The mouth: a polite line that has given up, one corner down.
  const f = pose.face;
  if (f === 'shock' || f === 'dizzy') {
    p.rect(24, 22, 2, 2, 'piel', 5);
  } else if (broken) {
    p.rect(23, 22, 3, 2, 'piel', 5);
    p.px(24, 23, 'rojo', 2);
  } else if (f === 'hurt' || f === 'shut') {
    p.rect(22, 22, 5, 2, 'piel', 5);
    p.rect(23, 22, 3, 1, 'acero', 1);
  } else {
    p.rect(23, 22, 4, 1, 'piel', 5);
    p.px(22, 23, 'piel', 5);
    if (f === 'aim') p.px(27, 21, 'piel', 5);
  }
}

function paintHair(p: Paint, pose: BecarioPose): void {
  // The mop: rounded on top, down to the eyebrows, a sideburn over the ear.
  const rows: Array<[number, number, number]> = [
    [5, 13, 28], [6, 11, 30], [7, 9, 32], [8, 9, 32], [9, 9, 32], [10, 9, 32], [11, 9, 32], [12, 9, 31],
  ];
  for (const [y, x0, x1] of rows) {
    for (let x = x0; x <= x1; x++) {
      let tone = y <= 6 ? 0 : y <= 9 ? 1 : 2;
      if (x <= 12) tone += 1;
      p.px(x, y, 'quemada', tone);
    }
  }
  // The sideburn and the hair falling over the shaded side.
  p.rect(9, 13, 4, 4, 'quemada', 3);
  p.rect(9, 17, 2, 2, 'quemada', 3);
  p.px(12, 13, 'quemada', 2);
  // Tufts sticking up: no comb in six years.
  for (const [x, y] of [[13, 4], [14, 3], [19, 4], [20, 3], [21, 4], [26, 4], [27, 3], [30, 5], [31, 5]] as const) p.px(x, y, 'quemada', y <= 3 ? 0 : 1);
  // The fringe: locks falling onto the forehead, a shine along the top.
  for (const [x, len] of [[15, 2], [16, 3], [20, 2], [21, 3], [22, 1], [26, 2], [27, 3], [31, 1]] as const) {
    for (let k = 0; k < len; k++) p.px(x, 13 + k, 'quemada', k === len - 1 ? 3 : 2);
  }
  for (const x of [16, 17, 18, 23, 24, 25]) p.px(x, 7, 'quemada', 0);
  for (const x of [13, 14, 20, 21, 27]) p.px(x, 8, 'quemada', 2); // the strands' partings
  // The pósit stuck in the hair, the corner curling up on odd frames (it is never off).
  p.rect(10, 1, 5, 4, 'amarillo', 1);
  p.rect(10, 1, 5, 1, 'amarillo', 0);
  p.rect(11, 3, 3, 1, 'amarillo', 3);
  p.px(14, 4, 'amarillo', 2);
  if (pose.frame % 2 === 1) {
    p.erase(14, 1);
    p.px(14, 2, 'amarillo', 2);
  }
}

function paintShirt(p: Paint): void {
  // Neck, in the shade of the chin.
  p.rect(18, 26, 5, 1, 'piel', 4);
  // The white shirt, a size too big: the left side in shade, the folds where it is tucked in.
  for (let y = SY0; y < BELT; y++) {
    for (let x = SX0; x <= SX1; x++) {
      let tone = y === SY0 ? 0 : 1;
      if (x <= SX0 + 2) tone = 3;
      else if (x === SX0 + 3) tone = 2;
      else if (x === SX1 || y >= BELT - 2) tone = 2;
      p.px(x, y, 'acero', tone);
    }
  }
  p.erase(SX0, SY0);
  p.erase(SX1, SY0);
  for (const x of [17, 22, 26]) p.px(x, BELT - 1, 'acero', 3); // folds
  // The open collar: a V of skin, the two points.
  for (const [x, y] of [[19, 27], [20, 27], [21, 27], [20, 28]] as const) p.px(x, y, 'piel', 2);
  for (const [x, y] of [[17, 27], [18, 28], [23, 27], [22, 28]] as const) p.px(x, y, 'acero', 0);
  p.px(18, 27, 'acero', 1);
  p.px(22, 27, 'acero', 1);
  // The coffee stain on the belly.
  for (const [x, y, t] of [[15, 33, 3], [16, 33, 3], [15, 34, 4], [16, 34, 3], [17, 34, 3], [16, 35, 3]] as const) p.px(x, y, 'carton', t);
  // The belt, a buckle.
  p.rect(SX0, BELT, SX1 - SX0 + 1, 1, 'goma', 4);
  p.rect(20, BELT, 2, 1, 'laton', 1);
}

/** Lanyard and badge, painted last so that swung up while rolling they go over his face. */
function paintBadge(p: Paint, pose: BecarioPose): void {
  const broken = pose.face === 'broken';
  // Lanyard and badge: on the chest, or swung out on its lanyard while rolling.
  const [bx, by] = pose.swing === undefined ? ([18, 31] as Pt) : SWING[pose.swing]!;
  const line = (x0: number, y0: number, x1: number, y1: number): void => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) p.px(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 'amarillo', 1);
  };
  line(17, 28, bx + 1, by - 1);
  line(23, 28, bx + 4, by - 1);
  if (broken) {
    // Turned round, hanging by one side: the back of the badge, blank.
    p.rect(bx + 1, by + 1, 4, 4, 'crema', 3);
    p.rect(bx + 1, by + 1, 4, 1, 'crema', 2);
    return;
  }
  p.rect(bx, by, 6, 5, 'crema', 0);
  p.rect(bx, by, 6, 1, 'rojo', 2);
  p.rect(bx, by + 4, 6, 1, 'crema', 2);
  // No photo: they never took one.
  p.rect(bx + 1, by + 2, 2, 2, 'acero', 3);
  p.rect(bx + 4, by + 2, 1, 1, 'goma', 2);
  p.rect(bx + 4, by + 3, 1, 1, 'goma', 2);
  p.px(bx + 2, by - 1, 'acero', 2); // the clip
  p.px(bx + 3, by - 1, 'acero', 2);
}

/** The paper coffee cup in the back hand (the hand grips its bottom). */
function paintCoffee(p: Paint, dy: number): void {
  const y0 = 26 + dy;
  // The lid, white, wider than the cup.
  p.rect(5, y0, 6, 1, 'crema', 1);
  p.rect(4, y0 + 1, 8, 1, 'crema', 2);
  p.px(9, y0 - 1, 'crema', 0); // the sip hole's spout
  // The cup, tapering down, in shade on the left; the cardboard sleeve.
  for (let j = 0; j < 6; j++) {
    const x0 = 5 + (j >= 4 ? 1 : 0);
    const x1 = 10;
    for (let x = x0; x <= x1; x++) p.px(x, y0 + 2 + j, 'crema', x <= x0 + 1 ? 3 : x === x1 ? 2 : 1);
  }
  p.rect(5, y0 + 4, 6, 2, 'carton', 2);
  p.rect(5, y0 + 4, 2, 2, 'carton', 4);
  p.px(9, y0 + 4, 'carton', 1);
  // The hand round its bottom.
  p.ellipsoid(10.5, y0 + 7.5, 2.2, 2.2, 'piel', { dither: 0, bias: -0.1 });
}

/** Broken: the coffee knocked over on the floor, the puddle spreading. */
function paintSpilled(p: Paint): void {
  for (let x = 1; x <= 12; x++) p.px(x, 45, 'carton', x < 3 || x > 10 ? 4 : 3);
  p.rect(3, 44, 6, 1, 'carton', 3);
  p.px(5, 44, 'carton', 1);
  // The cup on its side, the lid rolled off.
  p.rect(6, 41, 6, 3, 'crema', 1);
  p.rect(6, 41, 6, 1, 'crema', 0);
  p.rect(8, 41, 2, 3, 'carton', 2);
  p.rect(12, 41, 1, 3, 'crema', 3);
  p.rect(1, 42, 3, 1, 'crema', 2);
}

export function makeBecario(pose: BecarioPose): Canvas {
  const broken = pose.face === 'broken';
  const ground = new Paint(BECARIO_W, BECARIO_H);
  if (broken) paintSpilled(ground);
  legs(ground, pose.xb, pose.xf, BELT + 1, pose.legLen ?? 5, pose.lift);
  const body = new Paint(BECARIO_W, BECARIO_H);
  if (!broken) paintCoffee(body, pose.hand ?? 0);
  paintShirt(body);
  paintHead(body, pose);
  paintHair(body, pose);
  paintBadge(body, pose);
  if (broken) {
    // The pósit has come off at last: it lies on the floor in front of him.
    body.erase(10, 1);
    for (let y = 1; y <= 4; y++) for (let x = 10; x <= 14; x++) body.erase(x, y);
  }
  const all = new Paint(BECARIO_W, BECARIO_H);
  const lean = pose.lean ?? 0;
  all.stamp(ground, 0, 0);
  all.stamp(body, lean, pose.bob);
  if (broken) {
    all.rect(31, 44, 5, 2, 'amarillo', 1);
    all.px(31, 44, 'amarillo', 0);
    all.px(35, 45, 'amarillo', 3);
  }
  const o = all.outline();
  const put = (x: number, y: number, c: RGBA): void => {
    if (x >= 0 && y >= 0 && x < o.w && y < o.h && o.get(x, y)[3] === 0) o.put(x, y, c);
  };
  if (pose.spill) {
    // Coffee jumping out of the cup: drops, and the splash over the lid.
    const C = MATERIALS.carton;
    for (const [x, y, t] of [[6, 22, 3], [7, 21, 2], [9, 20, 3], [10, 22, 4], [4, 23, 3], [12, 21, 3], [3, 20, 4]] as const) {
      put(x + lean, y + pose.bob + (pose.hand ?? 0), C[t]!);
    }
  }
  if (pose.papers) {
    // His papers flying off: photocopies, the internship agreement, a timesheet nobody signed.
    const sets: Array<Pt[]> = [
      [[1, 12], [33, 6], [35, 28], [2, 3]],
      [[0, 8], [34, 11], [36, 24], [4, 0]],
    ];
    for (const [x, y] of sets[pose.frame % 2]!) {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) put(x + i + lean, y + j + pose.bob, j === 0 ? SHINE : MATERIALS.acero[2]!);
      put(x + 1 + lean, y + 2 + pose.bob, INK);
      put(x + 2 + lean, y + 2 + pose.bob, INK);
    }
  }
  return o;
}

/** Kept for the old callers: one frame from a pose. */
export const makeBecarioPose = makeBecario;

/** The eight frames of every character. */
export function makeBecarioFrames(): Canvas[] {
  return BECARIO_FRAMES.map((p) => makeBecario(p));
}

/** The whole sheet: the eight frames of every character and then his own (M14c (a4d1)). */
export function makeBecarioSheet(): Canvas[] {
  return [...BECARIO_FRAMES, ...BECARIO_EXTRA].map((p) => makeBecario(p));
}

/** His floating front hand in the new style: bare skin, no gloves (the game draws it with the gun). */
export function makeBecarioHand(): Canvas {
  const p = new Paint(7, 7);
  p.ellipsoid(3.5, 3.5, 2.4, 2.4, 'piel', { dither: 0, bias: -0.1 });
  return p.outline();
}
