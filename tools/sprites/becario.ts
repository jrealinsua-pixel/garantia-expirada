// El Becario Eterno (M13 (5)): the only playable character who is not an appliance. Drawn by the
// toaster's rules (docs/ESTILO_ARTE.md): same 40 x 41 frame, same eight frames (idle x2, walk x4,
// hurt, broken), a big head (a skin-coloured block in 3/4, dark side on the left, face on the
// right), floating hands, short legs with its own shoes, 1 px outline.
//
// Its jokes: the lanyard with a «BECARIO» badge whose photo was never taken (a grey square), a
// coffee stain on the shirt (it fetches them, it does not drink them), the yellow pósit stuck in
// its hair and the bags under its eyes. Messy hair: no time to comb it in six years of internship.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { K, RED, STEEL, WHITE, YEL, box, clear, feet, hand, outline, pad, ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

export const BSKIN = ramp('#f2c9a6', '#e0a982', '#b87a5a', '#7a4e3c');
export const BHAIR = ramp('#9a6a44', '#6e4628', '#4e301a', '#33200f');
const SHIRT = ramp('#ffffff', '#e4e8ee', '#b3bccb', '#7e889c');
const CHINOS = ramp('#d8c49a', '#b39d70', '#8a7650', '#5e4f34');
const LOAFER = ramp('#8a5a3c', '#5e3a24', '#3e2616', '#24160c');
const COFFEE: RGBA = BHAIR[2]!;

export interface BecarioPose {
  xb: number;
  xf: number;
  bob: number;
  face?: 'hurt' | 'broken';
  frame: number;
}

/** One frame, 40 x 41 (drawn on 40 x 36 and padded 5 px on top, like the toaster). */
export function makeBecarioPose(pose: BecarioPose): Canvas {
  const cv = new Canvas(40, 36);
  const body = new Canvas(40, 36);
  const broken = pose.face === 'broken';
  if (!broken) hand(body, 9, 21, BSKIN);
  feet(cv, pose.xb, pose.xf, 25, { L: 4, leg: CHINOS, shoe: LOAFER });
  // The shirt: white, a bit too big, the collar open; a coffee stain on the belly.
  box(body, 12, 19, 10, 6, SHIRT);
  body.rect(12, 24, 10, 1, CHINOS[2]!);
  body.set(13, 24, K);
  body.set(20, 24, K);
  body.set(14, 22, COFFEE);
  body.set(15, 22, COFFEE);
  body.set(14, 23, COFFEE);
  // The head: a skin block, its dark side on the left with the ear.
  const hx0 = 8;
  const hy0 = 6;
  const hw = 22;
  const hh = 14;
  body.rect(hx0, hy0, hw, hh, BSKIN[1]!);
  body.rect(hx0, hy0, 4, hh, BSKIN[2]!);
  body.rect(hx0 + 3, hy0, 1, hh, BSKIN[3]!);
  body.rect(hx0 + 4, hy0 + hh - 1, hw - 4, 1, BSKIN[2]!);
  body.rect(hx0 + hw - 1, hy0 + 1, 1, hh - 2, BSKIN[2]!);
  clear(body, [[hx0, hy0 + hh - 1], [hx0 + hw - 1, hy0 + hh - 1]]);
  body.rect(hx0 + 1, hy0 + 6, 2, 4, BSKIN[1]!);
  body.set(hx0 + 1, hy0 + 7, BSKIN[3]!);
  // Messy hair: a mop over the top with tufts sticking up and a fringe falling over the face.
  body.rect(hx0 - 1, hy0 - 3, hw + 1, 5, BHAIR[1]!);
  body.rect(hx0 - 1, hy0 - 3, hw + 1, 1, BHAIR[0]!);
  body.rect(hx0 - 1, hy0 - 3, 5, 9, BHAIR[2]!);
  const tufts: Pt[] = [[hx0 + 2, hy0 - 4], [hx0 + 6, hy0 - 5], [hx0 + 7, hy0 - 4], [hx0 + 12, hy0 - 4], [hx0 + 17, hy0 - 5], [hx0 + 18, hy0 - 4], [hx0 + 21, hy0 - 4]];
  for (const [x, y] of tufts) body.set(x, y, BHAIR[1]!);
  for (const gx of [7, 11, 15, 19]) body.set(hx0 + gx, hy0 - 1, BHAIR[2]!);
  // The fringe: three locks falling onto the forehead.
  for (const [fx, len] of [[13, 2], [17, 3], [20, 2]] as const) body.rect(hx0 + fx, hy0 + 2, 2, len, BHAIR[1]!);
  body.set(hx0 + 18, hy0 + 4, BHAIR[2]!);
  // The pósit stuck in the hair, a corner curling up.
  body.rect(hx0 + 1, hy0 - 6, 5, 4, YEL[1]!);
  body.rect(hx0 + 1, hy0 - 6, 5, 1, YEL[0]!);
  body.rect(hx0 + 2, hy0 - 4, 3, 1, YEL[3]!);
  body.set(hx0 + 5, hy0 - 3, YEL[2]!);
  // Face: tired eyes with bags, brows flat, a polite mouth that has given up.
  for (const ex of [17, 24]) {
    if (pose.face) {
      const left = ex === 17;
      const pts: Pt[] =
        pose.face === 'hurt'
          ? left
            ? [[ex, 10], [ex + 1, 11], [ex, 12]]
            : [[ex + 2, 10], [ex + 1, 11], [ex + 2, 12]]
          : [[ex, 10], [ex + 2, 10], [ex + 1, 11], [ex, 12], [ex + 2, 12]];
      for (const [x, y] of pts) body.set(x, y, K);
    } else {
      body.rect(ex, 10, 3, 3, K);
      // Heavy lids: the top row of the eye is skin.
      body.rect(ex, 10, 3, 1, BSKIN[2]!);
      body.set(ex + 1, 11, WHITE);
    }
    // The bags under the eyes.
    body.rect(ex, 13, 3, 1, BSKIN[2]!);
    body.set(ex + 1, 14, BSKIN[2]!);
    body.rect(ex, 9, 3, 1, BHAIR[3]!);
  }
  if (pose.face) {
    body.rect(21, 16, 3, 2, K);
    if (pose.face === 'hurt') body.set(22, 16, WHITE);
  } else {
    body.rect(20, 16, 4, 1, K);
    body.set(19, 17, K);
  }
  // The nose, from the side.
  body.set(27, 12, BSKIN[2]!);
  body.set(27, 13, BSKIN[2]!);
  // Lanyard: a yellow V from behind the neck down to the badge on the chest.
  body.set(15, 20, YEL[1]!);
  body.set(16, 21, YEL[1]!);
  body.set(20, 20, YEL[1]!);
  body.set(19, 21, YEL[1]!);
  if (!broken) {
    box(body, 16, 21, 4, 4, ramp('#ffffff', '#f4f1e8', '#d6d0c0', '#a8a090'));
    body.rect(16, 21, 4, 1, RED[1]!);
    // No photo: they never took one.
    body.set(17, 23, STEEL[2]!);
  } else {
    // Broken: the badge hangs by a thread, face down.
    body.rect(17, 22, 2, 3, STEEL[3]!);
  }
  cv.blit(body, 0, pose.bob);
  let o = outline(cv);
  o = pad(o, 5);
  // Broken: the pósit has come off and flutters on the floor.
  if (broken) {
    o.rect(30, 34, 4, 2, YEL[1]!);
    o.set(33, 34, YEL[0]!);
  }
  return o;
}

/** The game's frames: the same leg positions and rhythm as the toaster's (HERO_FRAMES). */
export const BECARIO_FRAMES: ReadonlyArray<{ name: string; pose: BecarioPose }> = [
  { name: 'idle0', pose: { xb: 12, xf: 18, bob: 0, frame: 0 } },
  { name: 'idle1', pose: { xb: 12, xf: 18, bob: 1, frame: 1 } },
  { name: 'walk0', pose: { xb: 11, xf: 19, bob: 0, frame: 0 } },
  { name: 'walk1', pose: { xb: 14, xf: 16, bob: -1, frame: 1 } },
  { name: 'walk2', pose: { xb: 18, xf: 12, bob: 0, frame: 0 } },
  { name: 'walk3', pose: { xb: 16, xf: 14, bob: -1, frame: 1 } },
  { name: 'hurt', pose: { xb: 13, xf: 17, bob: 1, frame: 0, face: 'hurt' } },
  { name: 'broken', pose: { xb: 12, xf: 18, bob: 1, frame: 0, face: 'broken' } },
];

export function makeBecarioFrames(): Canvas[] {
  return BECARIO_FRAMES.map((f) => makeBecarioPose(f.pose));
}

/** Its floating front hand (the game draws it with the weapon): bare skin, 5 x 5 with the outline. */
export function makeBecarioHand(): Canvas {
  const cv = new Canvas(5, 5);
  hand(cv, 1, 1, BSKIN);
  return outline(cv);
}
