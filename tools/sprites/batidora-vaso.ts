// M13 (3): la Batidora de Vaso, second playable character, with her starting weapon (the
// Picahielos Turbo), its frozen orange juice cubes and the whirl of her blades while she rolls.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { DSTEEL, FRT, GLOW, GLOW2, K, RED, STEEL, WHITE, YEL, box, cube, feet, hand, outline, ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

/** Motor base: berry violet, so she never reads as the grey toaster or the mint hand mixer. */
export const VIOLET = ramp('#c7a6ec', '#9670cf', '#6c4ea3', '#47337a');
const VIOLET_SIDE = ramp('#7a5bb0', '#5d4392', '#463170', '#2e204e');
const VIOLET_TOP = ramp('#e2cff7', '#c7a6ec', '#9670cf', '#6c4ea3');
/** The glass jar (pale, a little blue) and the green smoothie dried inside it since the diet. */
const GLASS = ramp('#f2fbfc', '#cfe8ee', '#9fc3cf', '#6a8f9e');
const SMOOTHIE = ramp('#c9e07a', '#93b84c', '#66893a', '#435f28');
/** Running shoes bought for the same diet: lime, hardly worn. */
const RUNNER = ramp('#eef7b0', '#b9d64a', '#7f9b2c', '#4f661c');
const TIE = YEL[1]!;

export interface BlenderPose {
  xb: number;
  xf: number;
  bob: number;
  face?: 'hurt' | 'broken';
  frame: number;
}

/** Frame size: the same as the toaster's, so the hand and the gun sit at the same height. */
export const BLENDER_W = 40;
export const BLENDER_H = 41;

/**
 * Batidora de Vaso, three-quarter view facing right. The head is the violet motor block (eyes and
 * a manic grin on its front, the speed dial jammed on PULSE on its dark side) with the glass jar
 * on top; legs and the floating back hand as the toaster's. Jokes: the green smoothie dried at the
 * bottom of the jar (the diet lasted a week), a striped straw still stuck through the lid, and the
 * cord still coiled with the twist tie it came with in the box («no se usa»).
 */
export function makeBlender(pose: BlenderPose): Canvas {
  const cv = new Canvas(BLENDER_W, BLENDER_H);
  const body = new Canvas(BLENDER_W, BLENDER_H);
  const broken = pose.face === 'broken';
  if (!broken) hand(body, 5, 27);
  feet(cv, pose.xb, pose.xf, 30, { L: 4, shoe: RUNNER });
  // The motor block (the head): violet, with a dark rubber foot all round.
  cube(body, 8, 16, 21, 14, 4, 3, VIOLET, VIOLET_SIDE, VIOLET_TOP);
  body.rect(12, 28, 16, 1, VIOLET[3]!);
  // The jar: a rubber collar on the block, then glass that widens upwards, and the lid.
  box(body, 13, 15, 13, 3, DSTEEL);
  for (let y = 5; y <= 14; y++) {
    const grow = Math.floor((14 - y) / 4);
    const x0 = 14 - grow;
    const x1 = 24 + grow;
    body.rect(x0, y, x1 - x0 + 1, 1, GLASS[1]!);
    body.set(x0, y, GLASS[2]!);
    body.set(x1, y, GLASS[3]!);
    body.set(x0 + 1, y, GLASS[0]!);
  }
  // Dried smoothie: a thick layer at the bottom, a tide line and a few splashes up the glass.
  for (let y = 11; y <= 14; y++) body.rect(15, y, 10, 1, y === 11 ? SMOOTHIE[0]! : SMOOTHIE[1]!);
  body.rect(15, 14, 10, 1, SMOOTHIE[2]!);
  for (const [x, y] of [[17, 9], [21, 8], [23, 10], [19, 7]] as Pt[]) body.set(x, y, SMOOTHIE[1]!);
  body.set(24, 12, SMOOTHIE[3]!);
  // The blades just show through the smoothie.
  for (const [x, y] of [[18, 13], [19, 12], [20, 13], [21, 12], [22, 13]] as Pt[]) body.set(x, y, STEEL[1]!);
  // Measuring marks on the front of the glass, and the shine on its back edge.
  for (const y of [6, 8, 10]) body.set(23, y, GLASS[3]!);
  body.rect(15, 5, 1, 5, WHITE);
  // The handle at the back, the lid and its measuring cap.
  body.rect(10, 7, 1, 7, DSTEEL[1]!);
  body.rect(10, 7, 3, 1, DSTEEL[1]!);
  body.rect(10, 13, 3, 1, DSTEEL[2]!);
  box(body, 12, 3, 16, 2, DSTEEL);
  body.rect(17, 2, 4, 1, DSTEEL[0]!);
  if (pose.face === 'broken') {
    // A crack right across the jar.
    for (const [x, y] of [[16, 6], [17, 7], [18, 7], [19, 8], [20, 9], [21, 9], [22, 10]] as Pt[]) body.set(x, y, K);
  } else {
    // The straw, red and white, poking out of the lid; it nods a pixel with every other frame.
    const lean = pose.frame % 2;
    const straw: Pt[] = [[24, 2], [24, 1], [25 + lean, 0]];
    straw.forEach(([x, y], i) => body.set(x, y, i % 2 ? WHITE : RED[1]!));
  }
  // Speed dial on the dark side, the pointer jammed on PULSE (red).
  body.rect(9, 21, 2, 3, VIOLET_SIDE[3]!);
  body.set(9, 21, DSTEEL[0]!);
  body.set(10, 23, RED[1]!);
  // Eyes on the front of the block: heavy lids, tiny pupils and brows down to the middle. She
  // has not slept since the diet; she is going to blend you anyway.
  for (const ex of [15, 22]) {
    const back = ex === 15;
    body.rect(ex, 20, 4, 4, WHITE);
    if (back) {
      for (const [x, y] of [[ex - 1, 18], [ex, 18], [ex + 1, 19], [ex + 2, 19], [ex + 3, 19]] as Pt[]) body.set(x, y, K);
    } else {
      for (const [x, y] of [[ex, 19], [ex + 1, 19], [ex + 2, 18], [ex + 3, 18], [ex + 4, 18]] as Pt[]) body.set(x, y, K);
    }
    if (pose.face === 'hurt') {
      body.rect(ex, 20, 4, 4, VIOLET[1]!);
      const pts: Pt[] = back ? [[ex, 20], [ex + 1, 21], [ex + 2, 22], [ex + 1, 23], [ex, 23]] : [[ex + 3, 20], [ex + 2, 21], [ex + 1, 22], [ex + 2, 23], [ex + 3, 23]];
      for (const [x, y] of pts) body.set(x, y, K);
    } else if (broken) {
      body.rect(ex, 20, 4, 4, VIOLET[1]!);
      for (const [x, y] of [[ex, 20], [ex + 3, 20], [ex + 1, 21], [ex + 2, 22], [ex, 23], [ex + 3, 23], [ex + 2, 21], [ex + 1, 22]] as Pt[]) body.set(x, y, K);
    } else {
      // Lid over the top of the eye (darker on the back one), the pupil looking ahead.
      body.rect(ex, 20, 4, 1, VIOLET[2]!);
      if (back) body.rect(ex, 21, 4, 1, VIOLET[2]!);
      body.rect(ex + 2, 22, 2, 1, K);
      body.set(ex + 3, 21, back ? VIOLET[2]! : K);
      body.rect(ex, 23, 4, 1, VIOLET[2]!);
    }
  }
  // The grin: wide, all teeth, pulled up at the front (open and slack once broken).
  if (broken) {
    body.rect(19, 25, 4, 2, K);
  } else {
    body.rect(17, 25, 9, 2, K);
    for (const x of [18, 20, 22, 24]) body.set(x, 25, WHITE);
    body.set(26, 24, K);
    body.set(17, 26, VIOLET[1]!);
    if (pose.face === 'hurt') body.rect(18, 25, 7, 1, K);
  }
  // A scratch and a sticker of the speeds on the block.
  body.set(13, 27, VIOLET[3]!);
  body.set(27, 19, VIOLET[0]!);
  cv.blit(body, 0, pose.bob);
  const o = outline(cv);
  // The cord: from the back of the block down to a coil on the floor, still with its twist tie.
  const cord: Pt[] = [[8, 28], [7, 29], [6, 30], [5, 31], [4, 32], [3, 32], [2, 33], [2, 34], [3, 35], [5, 35], [6, 34], [5, 33]];
  for (const [x, y] of cord) o.set(x, y + (y < 30 ? pose.bob : 0), K);
  o.set(4, 33, TIE);
  o.set(4, 34, TIE);
  return o;
}

/** The eight game frames (CharacterLook): idle ×2, walk ×4, hurt, broken. */
export const BLENDER_FRAMES: readonly BlenderPose[] = [
  { xb: 13, xf: 19, bob: 0, frame: 0 },
  { xb: 13, xf: 19, bob: 1, frame: 1 },
  { xb: 12, xf: 20, bob: 0, frame: 0 },
  { xb: 15, xf: 17, bob: -1, frame: 1 },
  { xb: 19, xf: 13, bob: 0, frame: 0 },
  { xb: 17, xf: 15, bob: -1, frame: 1 },
  { xb: 14, xf: 18, bob: 1, frame: 0, face: 'hurt' },
  { xb: 13, xf: 19, bob: 1, frame: 0, face: 'broken' },
];

export function makeBlenderFrames(): Canvas[] {
  return BLENDER_FRAMES.map((p) => makeBlender(p));
}

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
