// El Muñeco de Moda, boss of floor 3 (Juguetería): last year's fashion doll, still in its shop
// window box, which it wears as armour (docs/DISENO.md). Its sale tags and the box it leaves
// behind in phase 3 are sheets of their own.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, CARD, CREAM, K, PINK, RED, STEEL, WHITE, YEL, clear, cube, outline, ramp, type Ramp } from '../../src/art/lib.ts';
import { joinPose, type Pose } from './pose.ts';

type Pt = readonly [number, number];

/** The box: magenta cardboard, faded after a whole season in the shop window. */
export const BOX = ramp('#f08bc0', '#d0549a', '#9e3a78', '#6a2654');
const BOX_SIDE = ramp('#b04888', '#8c3470', '#6a2654', '#4a1a3c');
const BOX_TOP = ramp('#f7b6d6', '#e47fb2', '#c05a92', '#8c3470');
/** The printed card behind the window: night-club navy with pink stars. */
const BACK = ramp('#5a5f9a', '#3a3e74', '#2a2d58', '#1c1e3e');
/** Doll vinyl, a tan that never existed in nature. */
export const SKIN = ramp('#ffe0c2', '#f2b98e', '#c98a64', '#8a5a40');
/** Sculpted plastic hair, golden, gone frizzy at the edges. */
const HAIR = ramp('#f6d675', '#d9a23c', '#a06e22', '#664414');
/** Turquoise blazer with the collar up. */
const JACKET = ramp('#a4f2e2', '#4fcfbf', '#2f978e', '#1e605e');
/** Glare on the window's plastic. */
const GLARE = hx('#f4f1e8', 90);
const STAR = hx('#e88fa4');

export const MUNECO_REST: Pose = { xb: 20, xf: 40, bob: 0 };

/** Rest, breathing and the walk (big legs: a foot lifted 2 px, never crossed, like the other bosses). */
export const MUNECO_POSES: ReadonlyArray<{ name: string; pose: Pose }> = [
  { name: 'idle0', pose: MUNECO_REST },
  { name: 'idle1', pose: { ...MUNECO_REST, bob: 1 } },
  { name: 'walk0', pose: { ...MUNECO_REST, bob: -1, lift: { leg: -1, px: 2 } } },
  { name: 'walk1', pose: MUNECO_REST },
  { name: 'walk2', pose: { ...MUNECO_REST, bob: -1, lift: { leg: 1, px: 2 } } },
  { name: 'walk3', pose: { ...MUNECO_REST, bob: 1 } },
];

/**
 * Where the sale tag (sheet `etiqueta-rebaja`) goes on the boxed frames, from the frame's top
 * left: over the bottom left corner of the window. Mirrored when it faces left
 * (x = MUNECO_W - TAG_ANCHOR.x - TAG_W). It moves with the body: add the frame's bob.
 */
export const TAG_ANCHOR = { x: 16, y: 48 } as const;
export const MUNECO_W = 72;
export const MUNECO_H = 76;
export const TAG_W = 22;
export const TAG_H = 12;

/** Doll legs in jeans and white trainers with a pink sole, on their own layer. */
function legs(pose: Pose, top: number, len: number): Canvas {
  const cv = new Canvas(MUNECO_W, MUNECO_H);
  const lb = pose.lift?.leg === -1 ? pose.lift.px : 0;
  const lf = pose.lift?.leg === 1 ? pose.lift.px : 0;
  const bx = pose.xb - MUNECO_REST.xb;
  const fx = pose.xf - MUNECO_REST.xf;
  const foot = top + len;
  cv.rect(23 + bx, top, 5, len - lb, BLUE[2]!);
  cv.rect(43 + fx, top, 5, len - lf, BLUE[1]!);
  cv.rect(43 + fx, top, 1, len - lf, BLUE[0]!);
  for (const [x, l, back] of [[20 + bx, lb, true], [40 + fx, lf, false]] as const) {
    cv.rect(x, foot - l, 11, 3, back ? CREAM[1]! : WHITE);
    cv.rect(x, foot - l, 10, 1, back ? CREAM[0]! : WHITE);
    cv.rect(x + 2, foot - l + 1, 3, 1, back ? CREAM[2]! : CREAM[1]!);
    cv.rect(x, foot - l + 3, 11, 1, back ? PINK[2]! : PINK[1]!);
  }
  return cv;
}

/** A boss hand, 7x7 and rounded, in doll vinyl. */
function bigHand(cv: Canvas, x: number, y: number, R: Ramp = SKIN): void {
  cv.rect(x, y, 7, 7, R[1]!);
  cv.rect(x, y, 6, 1, R[0]!);
  cv.rect(x + 6, y, 1, 7, R[2]!);
  cv.rect(x + 1, y + 6, 6, 1, R[2]!);
  clear(cv, [[x, y + 6], [x + 6, y]]);
}

/** 3x5 digits for the price tags (and a 3x5 per cent sign). */
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '5': ['111', '100', '111', '001', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '9': ['111', '101', '111', '001', '111'],
  '%': ['101', '001', '010', '100', '101'],
  '-': ['000', '000', '110', '000', '000'],
};

function glyphs(cv: Canvas, x: number, y: number, text: string, c: RGBA): void {
  for (const ch of text) {
    const g = GLYPHS[ch]!;
    g.forEach((row, j) => [...row].forEach((b, i) => b === '1' && cv.set(x + i, y + j, c)));
    x += ch === '-' ? 3 : 4;
  }
}

/**
 * The «¡Novedad!» starburst, crossed out with marker, and the strip of tape over it with
 * «Temporada anterior» scrawled on it (a squiggle at this size). (x, y): the burst's centre.
 */
function oldNewSticker(cv: Canvas, x: number, y: number): void {
  cv.rect(x - 3, y - 3, 7, 7, YEL[1]!);
  for (const [dx, dy] of [[0, -5], [0, -4], [0, 4], [0, 5], [-5, 0], [-4, 0], [4, 0], [5, 0], [-4, -4], [4, -4], [-4, 4], [4, 4]] as Pt[]) cv.set(x + dx, y + dy, YEL[1]!);
  cv.rect(x - 3, y - 3, 3, 1, YEL[0]!);
  cv.rect(x - 2, y + 3, 6, 1, YEL[2]!);
  cv.rect(x - 2, y - 1, 5, 1, RED[1]!);
  cv.rect(x - 1, y + 1, 3, 1, RED[1]!);
  // The marker cross, corner to corner.
  for (let i = -4; i <= 4; i++) {
    cv.set(x + i, y + i, K);
    cv.set(x + i, y - i, K);
  }
  // The tape, a little skew, with the handwriting.
  cv.rect(x - 7, y + 5, 14, 3, WHITE);
  cv.rect(x - 7, y + 7, 14, 1, CREAM[1]!);
  cv.set(x + 6, y + 5, CREAM[1]!);
  for (let i = 0; i < 12; i++) if (i % 3 !== 2) cv.set(x - 6 + i, y + 6 - (i % 2), K);
}

export interface BoxedLook {
  /** Catwalk pose: the front hand up high, the back one on the hip, a wink and a sparkle off the teeth. */
  pose?: boolean;
}

/**
 * The doll in its box: a magenta window box in three-quarters with a logo band on top, the doll
 * squashed inside against the plastic (its hair against the top of the window, a wire twist tie
 * round its waist), the advert grin and eyes that are not in on it. On the front, the «¡Novedad!»
 * burst crossed out and «Temporada anterior» on tape; on the side, the barcode. Big hands in doll
 * vinyl outside the box, gripping it. The sale tag goes on top (TAG_ANCHOR). 72x76.
 */
export function makeMunecoBoxed(pose: Pose = MUNECO_REST, look: BoxedLook = {}): Canvas {
  const lg = legs(pose, 62, 8);
  const body = new Canvas(MUNECO_W, MUNECO_H);
  // Back hand, behind the box (on the hip when posing).
  bigHand(body, look.pose ? 3 : 2, look.pose ? 46 : 38);
  cube(body, 9, 4, 52, 58, 8, 6, BOX, BOX_SIDE, BOX_TOP);
  // A crease across the lid and a dent in the side.
  body.rect(24, 6, 18, 1, BOX_TOP[2]!);
  body.rect(11, 50, 3, 2, BOX_SIDE[2]!);
  body.set(12, 52, BOX_SIDE[3]!);
  // Barcode on the side.
  body.rect(10, 34, 6, 9, WHITE);
  for (const x of [10, 12, 13, 15]) body.rect(x, 35, 1, 6, K);
  // Logo band: a yellow pill with blocky letters that spell nothing (the brand went bust).
  body.rect(21, 12, 36, 6, YEL[1]!);
  body.rect(21, 12, 36, 1, YEL[0]!);
  body.rect(21, 17, 36, 1, YEL[2]!);
  clear(body, [[21, 12], [56, 12], [21, 17], [56, 17]]);
  for (const x of [24, 30, 36, 42, 48]) {
    body.rect(x, 14, 4, 3, BOX[2]!);
    body.set(x + 1 + (x % 3), 15, YEL[1]!);
  }
  // The window: a frame of darker card, the printed backdrop with its stars.
  body.rect(20, 19, 38, 38, BOX[3]!);
  body.rect(21, 20, 36, 36, BACK[2]!);
  body.rect(21, 20, 36, 2, BACK[3]!);
  for (const [x, y] of [[24, 24], [53, 30], [26, 44], [52, 50], [33, 22], [23, 35]] as Pt[]) {
    body.set(x, y, STAR);
    body.set(x - 1, y, BACK[0]!);
    body.set(x + 1, y, BACK[0]!);
    body.set(x, y - 1, BACK[0]!);
    body.set(x, y + 1, BACK[0]!);
  }
  // Small print under the window.
  for (const y of [58, 60]) body.rect(22, y, 34, 1, BOX[2]!);

  // The doll, drawn on its own and clipped to the window.
  const doll = new Canvas(MUNECO_W, MUNECO_H);
  boxedDoll(doll, look);
  for (let y = 20; y < 56; y++) for (let x = 21; x < 57; x++) {
    const c = doll.get(x, y);
    if (c[3] > 0) body.set(x, y, c);
  }
  // The twist tie across its waist, fixed to the card on both sides.
  body.rect(21, 49, 36, 1, STEEL[1]!);
  for (const x of [38, 39, 40]) body.set(x, 48 + (x % 2), STEEL[0]!);
  body.set(41, 50, STEEL[2]!);
  // Glare on the plastic: two diagonal streaks.
  for (let i = 0; i < 14; i++) {
    body.set(22 + i, 45 - i, GLARE);
    body.set(23 + i, 45 - i, GLARE);
    body.set(28 + i, 46 - i, GLARE);
  }

  oldNewSticker(body, 55, 22);
  // Front hand, gripping the box's front edge; posing, flung up above it.
  if (look.pose) bigHand(body, 61, 0);
  else bigHand(body, 59, 42);
  const out = outline(joinPose(lg, body, pose));
  // A sparkle off the teeth when it poses (outside the outline).
  if (look.pose) {
    const y = 31 + pose.bob;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [0, -2], [0, 2]] as Pt[]) out.set(51 + dx, y + dy, WHITE);
  }
  return out;
}

/** The doll as seen through the window: head pressed to the top, the grin, the blazer. */
function boxedDoll(cv: Canvas, look: BoxedLook): void {
  // Blazer with the collar up and a white shirt open at the neck.
  cv.rect(30, 39, 19, 17, JACKET[1]!);
  cv.rect(30, 39, 3, 17, JACKET[2]!);
  cv.rect(30, 39, 19, 1, JACKET[0]!);
  for (const [x, y] of [[34, 37], [34, 38], [35, 38], [45, 37], [45, 38], [44, 38]] as Pt[]) cv.set(x, y, JACKET[0]!);
  for (let j = 0; j < 6; j++) cv.rect(38 + Math.floor(j / 2), 39 + j, 5 - 2 * Math.floor(j / 2), 1, WHITE);
  cv.rect(36, 45, 1, 10, JACKET[3]!);
  // Head: big, a block of vinyl lit from the top left; the dark side on the left.
  cv.rect(28, 22, 22, 16, SKIN[1]!);
  cv.rect(28, 22, 3, 16, SKIN[2]!);
  cv.rect(28, 37, 22, 1, SKIN[2]!);
  cv.rect(49, 23, 1, 14, SKIN[2]!);
  clear(cv, [[28, 37], [49, 37]]);
  // Mould seam down the side of the head.
  for (let y = 25; y <= 35; y += 2) cv.set(31, y, SKIN[3]!);
  // Sculpted hair squashed against the top of the window, frizz poking out at the sides.
  cv.rect(27, 19, 24, 6, HAIR[1]!);
  cv.rect(27, 19, 24, 1, HAIR[0]!);
  cv.rect(27, 24, 6, 3, HAIR[2]!);
  for (const x of [33, 37, 41, 45]) cv.set(x, 21, HAIR[0]!);
  for (const x of [35, 39, 43, 47]) cv.set(x, 23, HAIR[2]!);
  for (const [x, y] of [[26, 22], [25, 23], [26, 25], [51, 21], [52, 22], [51, 24], [27, 27]] as Pt[]) cv.set(x, y, HAIR[1]!);
  cv.rect(48, 25, 2, 2, HAIR[2]!);
  // Brows: flat and level, painted on.
  cv.rect(36, 26, 4, 1, HAIR[3]!);
  cv.rect(43, 26, 4, 1, HAIR[3]!);
  // Eyes: wide, glassy and tired, with bags. Posing: the front one winks.
  const dollEye = (x: number): void => {
    cv.rect(x, 28, 3, 1, SKIN[2]!);
    cv.rect(x, 29, 3, 2, K);
    cv.rect(x, 29, 2, 2, BLUE[1]!);
    cv.set(x, 30, BLUE[2]!);
    cv.set(x + 2, 29, WHITE);
    cv.rect(x, 31, 3, 1, SKIN[2]!);
  };
  dollEye(36);
  if (look.pose) {
    cv.rect(43, 30, 3, 1, K);
    cv.set(46, 29, K);
  } else dollEye(43);
  // Rouge, painted at the factory.
  cv.set(34, 32, PINK[1]!);
  cv.set(47, 31, PINK[1]!);
  // Nose: a pixel of shadow.
  cv.set(41, 31, SKIN[2]!);
  // The advert grin: a full row of white teeth, corners pulled up.
  cv.rect(36, 33, 12, 3, K);
  cv.rect(37, 34, 10, 1, WHITE);
  for (const x of [39, 42, 45]) cv.set(x, 34, CREAM[2]!);
  cv.set(35, 32, K);
  cv.set(48, 32, K);
}

export interface LooseLook {
  /** Spinning: `back` from behind, `front` with the hands flung out and the eyes screwed shut. */
  spin?: 'back' | 'front';
  pose?: boolean;
}

/**
 * Out of the box (phase 3, «Liquidación total»): the same doll, bigger and wilder. The hair has
 * sprung out in all directions, the twist tie still round its neck with the cut end sticking out,
 * the «Temporada anterior» tape stuck to its chest, a manic grin and pinprick pupils. 72x76.
 */
export function makeMunecoLoose(pose: Pose = MUNECO_REST, look: LooseLook = {}): Canvas {
  const lg = legs(pose, 58, 12);
  const cv = new Canvas(MUNECO_W, MUNECO_H);
  const wide = look.spin !== undefined;
  // Back hand.
  if (wide) bigHand(cv, 4, 40);
  else if (look.pose) bigHand(cv, 16, 50);
  else bigHand(cv, 12, 44);
  // Blazer.
  cv.rect(25, 38, 23, 21, JACKET[1]!);
  cv.rect(25, 38, 4, 21, JACKET[2]!);
  cv.rect(25, 58, 23, 1, JACKET[3]!);
  cv.rect(47, 39, 1, 19, JACKET[2]!);
  clear(cv, [[25, 58], [47, 58]]);
  if (look.spin === 'back') {
    // From behind: a seam down the back and the «made in» label sticking out of the collar.
    cv.rect(36, 40, 1, 18, JACKET[2]!);
    cv.rect(34, 37, 4, 4, WHITE);
    cv.rect(35, 38, 2, 1, CREAM[2]!);
  } else {
    for (const [x, y] of [[29, 35], [29, 36], [30, 36], [30, 37], [43, 35], [43, 36], [42, 36], [42, 37]] as Pt[]) cv.set(x, y, JACKET[0]!);
    for (let j = 0; j < 8; j++) cv.rect(34 + Math.floor(j / 2), 38 + j, 7 - 2 * Math.floor(j / 2), 1, WHITE);
    cv.rect(33, 46, 1, 12, JACKET[3]!);
    // The tape from the box, stuck on its chest.
    cv.rect(37, 49, 10, 3, WHITE);
    cv.rect(37, 51, 10, 1, CREAM[1]!);
    for (let i = 0; i < 8; i++) if (i % 3 !== 2) cv.set(38 + i, 50 - (i % 2), K);
  }
  // Head.
  cv.rect(22, 15, 28, 22, SKIN[1]!);
  cv.rect(22, 15, 4, 22, SKIN[2]!);
  cv.rect(22, 36, 28, 1, SKIN[2]!);
  cv.rect(49, 16, 1, 20, SKIN[2]!);
  clear(cv, [[22, 15], [49, 15], [22, 36], [49, 36]]);
  // Hair: sprung loose, spikes of frizz everywhere.
  cv.rect(21, 9, 30, 9, HAIR[1]!);
  cv.rect(21, 9, 30, 1, HAIR[0]!);
  cv.rect(21, 15, 6, 7, HAIR[2]!);
  // Tufts of frizz: on top, lit; down the sides, in shadow.
  for (let i = 0; i < 8; i++) {
    const x = 19 + i * 4;
    const y = 4 + ((i * 5) % 3);
    cv.rect(x, y, 4, 6, HAIR[1]!);
    cv.rect(x, y, 3, 1, HAIR[0]!);
    cv.set(x + 1, y + 1, HAIR[0]!);
  }
  for (const [x, y] of [[17, 10], [16, 14], [17, 18], [51, 9], [52, 13]] as Pt[]) {
    cv.rect(x, y, 4, 4, HAIR[2]!);
    cv.set(x, y, HAIR[1]!);
  }
  for (const x of [26, 31, 36, 41, 46]) cv.rect(x, 12, 2, 1, HAIR[2]!);
  if (look.spin === 'back') {
    // From behind, the head is all hair.
    cv.rect(22, 17, 28, 18, HAIR[1]!);
    cv.rect(22, 17, 4, 18, HAIR[2]!);
    for (const [x, y] of [[30, 22], [36, 26], [42, 21], [33, 30], [45, 29]] as Pt[]) cv.rect(x, y, 3, 1, HAIR[2]!);
    cv.rect(24, 34, 24, 2, HAIR[3]!);
  } else {
    // The seam.
    for (let y = 20; y <= 34; y += 2) cv.set(27, y, SKIN[3]!);
    // Brows: angry now, sloping down to the middle.
    for (const [x, y] of [[33, 19], [34, 19], [35, 20], [36, 20], [37, 21], [42, 21], [43, 20], [44, 20], [45, 19], [46, 19]] as Pt[]) cv.set(x, y, HAIR[3]!);
    if (look.spin === 'front') {
      // Eyes screwed shut: two chevrons.
      for (const ex of [34, 42]) for (const [dx, dy] of [[0, 23], [1, 24], [2, 25], [3, 24], [4, 23]] as Pt[]) cv.set(ex + dx, dy, K);
    } else {
      // Wide whites with pinprick pupils, looking right; bags under them.
      for (const ex of [33, 42]) {
        cv.rect(ex, 22, 5, 5, K);
        cv.rect(ex + 1, 23, 3, 3, WHITE);
        cv.set(ex + 3, 24, BLUE[2]!);
        for (const [dx, dy] of [[0, 0], [4, 0], [0, 4], [4, 4]] as Pt[]) cv.set(ex + dx, 22 + dy, SKIN[1]!);
        cv.rect(ex, 27, 5, 1, SKIN[2]!);
      }
      cv.set(31, 28, PINK[1]!);
      cv.set(48, 27, PINK[1]!);
      if (look.pose) cv.rect(42, 22, 5, 2, SKIN[1]!);
    }
    cv.set(40, 27, SKIN[2]!);
    cv.set(41, 28, SKIN[2]!);
    // The grin, wider than the face should allow.
    cv.rect(31, 30, 18, 4, K);
    cv.rect(32, 31, 16, 2, WHITE);
    for (const x of [35, 38, 41, 44]) cv.rect(x, 31, 1, 2, CREAM[2]!);
    cv.set(30, 29, K);
    cv.set(49, 29, K);
    // A crack in the vinyl at the corner of the mouth (it smiled too long).
    cv.set(50, 30, SKIN[3]!);
    cv.set(51, 31, SKIN[3]!);
  }
  // The twist tie round the neck, cut end sticking out.
  cv.rect(27, 37, 18, 1, STEEL[1]!);
  cv.set(45, 36, STEEL[0]!);
  cv.set(46, 35, STEEL[0]!);
  cv.set(47, 34, STEEL[1]!);
  // Front hand.
  if (wide) bigHand(cv, 61, 40);
  else if (look.pose) bigHand(cv, 56, 2);
  else bigHand(cv, 52, 46);
  return outline(joinPose(lg, cv, pose));
}

/**
 * The boss's sheet: 0-5 boxed (MUNECO_POSES), 6 boxed posing; 7-12 out of the box (the same
 * poses), 13 posing out of the box, 14 spinning seen from behind, 15 spinning with the hands out.
 */
export function makeMunecoFrames(): Canvas[] {
  return [
    ...MUNECO_POSES.map((f) => makeMunecoBoxed(f.pose)),
    makeMunecoBoxed({ ...MUNECO_REST, bob: -1 }, { pose: true }),
    ...MUNECO_POSES.map((f) => makeMunecoLoose(f.pose)),
    makeMunecoLoose({ ...MUNECO_REST, bob: -1 }, { pose: true }),
    makeMunecoLoose({ ...MUNECO_REST, bob: -1 }, { spin: 'back' }),
    makeMunecoLoose({ ...MUNECO_REST, bob: -1 }, { spin: 'front' }),
  ];
}

/**
 * The tag on its box (TAG_ANCHOR), one frame per price: 0 full price («99»), then −30 %, −50 %
 * and −70 % (phase 2, «Rebajas»), each one redder. A pointed tag with its hole and string.
 */
export function makeTagFrames(): Canvas[] {
  const looks: Array<{ text: string; R: Ramp; ink: RGBA }> = [
    { text: '99', R: ramp('#ffffff', '#f4f1e8', '#d6cdb2', '#a89f86'), ink: K },
    { text: '-30%', R: YEL, ink: K },
    { text: '-50%', R: ramp('#ffc58a', '#f08a3a', '#c0602a', '#86401c'), ink: K },
    { text: '-70%', R: RED, ink: WHITE },
  ];
  return looks.map(({ text, R, ink }) => {
    const cv = new Canvas(TAG_W, TAG_H);
    // The body, with its point on the left.
    cv.rect(4, 1, 17, 10, R[1]!);
    cv.rect(4, 1, 17, 1, R[0]!);
    cv.rect(4, 10, 17, 1, R[2]!);
    for (let j = 0; j < 4; j++) {
      cv.rect(3 - Math.min(j, 2), 3 + j, 1 + Math.min(j, 2), 1, R[1]!);
      cv.rect(3 - Math.min(j, 2), 8 - j, 1 + Math.min(j, 2), 1, R[1]!);
    }
    // The hole and the string out of it.
    cv.set(3, 5, R[3]!);
    cv.set(3, 6, R[3]!);
    glyphs(cv, text.length > 2 ? 6 : 10, 3, text, ink);
    // Every discount is stuck over the one before: a torn corner of it peeks out.
    if (text !== '99') cv.rect(19, 9, 2, 2, text === '-30%' ? WHITE : text === '-50%' ? YEL[1]! : hx('#f08a3a'));
    const out = outline(cv);
    out.set(0, 4, K);
    out.set(0, 5, K);
    return out;
  });
}

/**
 * The box it leaves behind in phase 3, an obstacle that stops bullets: empty, the window
 * smashed open from inside (jagged plastic round the hole), the twist ties cut and hanging, the
 * die-cut shape of the doll in the backdrop, the −70 % tag still on. 56x64.
 */
export function makeBrokenBox(): Canvas {
  const cv = new Canvas(56, 64);
  cube(cv, 1, 2, 52, 58, 8, 6, BOX, BOX_SIDE, BOX_TOP);
  cv.rect(16, 4, 18, 1, BOX_TOP[2]!);
  cv.rect(3, 28, 3, 2, BOX_SIDE[2]!);
  cv.rect(2, 32, 6, 9, WHITE);
  for (const x of [2, 4, 5, 7]) cv.rect(x, 33, 1, 6, K);
  // Logo band, scuffed.
  cv.rect(13, 10, 36, 6, YEL[1]!);
  cv.rect(13, 10, 36, 1, YEL[0]!);
  cv.rect(13, 15, 36, 1, YEL[2]!);
  for (const x of [16, 22, 28, 34, 40]) cv.rect(x, 12, 4, 3, BOX[2]!);
  cv.rect(30, 10, 5, 3, BOX[1]!);
  // The window, empty: the backdrop with the doll-shaped hole in the card insert.
  cv.rect(12, 17, 38, 38, BOX[3]!);
  cv.rect(13, 18, 36, 36, BACK[2]!);
  cv.rect(20, 18, 22, 18, CARD[2]!);
  cv.rect(22, 36, 18, 18, CARD[2]!);
  cv.rect(20, 18, 2, 18, CARD[3]!);
  cv.rect(22, 36, 2, 18, CARD[3]!);
  for (let y = 21; y < 54; y += 3) cv.rect(y < 36 ? 23 : 25, y, y < 36 ? 18 : 14, 1, CARD[1]!);
  for (const [x, y] of [[16, 24], [45, 28], [16, 44], [45, 48]] as Pt[]) cv.set(x, y, STAR);
  // Cut twist ties hanging from both sides.
  for (let j = 0; j < 5; j++) {
    cv.set(14 + (j % 2), 47 + j, STEEL[1]!);
    cv.set(47 - (j % 2), 47 + j, STEEL[1]!);
  }
  // Jagged plastic left round the frame (with glare), the rest of the window gone.
  const shards: Array<[number, number, number, number]> = [[13, 18, 6, 3], [13, 21, 3, 4], [42, 18, 7, 2], [45, 20, 4, 5], [13, 50, 4, 4], [44, 49, 5, 5], [30, 18, 4, 2]];
  for (const [x, y, w, h] of shards) {
    cv.rect(x, y, w, h, GLARE);
    cv.set(x, y, WHITE);
  }
  for (const [x, y] of [[19, 21], [16, 25], [48, 25], [17, 49], [43, 53]] as Pt[]) cv.set(x, y, WHITE);
  oldNewSticker(cv, 47, 20);
  for (const y of [56, 58]) cv.rect(14, y, 34, 1, BOX[2]!);
  const tag = makeTagFrames()[3]!;
  const out = outline(cv);
  out.blit(tag, 8, 46);
  return out;
}
