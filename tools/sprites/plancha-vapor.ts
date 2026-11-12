// M13 (4): la Plancha de Vapor, third playable character, with her starting weapon (the
// Pulverizador de Almidón), its starch drops and the puffs of steam her soleplate leaves behind.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { BROWN, clear, DSTEEL, FRT, ICE, K, OFFICE, RED, STEEL, WHITE, YEL, box, feet, hand, outline, ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

/**
 * The shell: deep teal plastic, so she never reads as the grey toaster, the violet blender, the
 * mint hand mixer or the white iron you can find in a chest.
 */
export const TEAL = ramp('#8fd9c8', '#3fa996', '#2a7b74', '#1b4f55');
const TEAL_SIDE = ramp('#2f8579', '#22665f', '#184a4a', '#0f3236');
/** The handle and the dial: navy rubber. */
const NAVY = ramp('#7d93c4', '#43588f', '#2d3c6a', '#1d2748');
/** Water in the tank window. */
const WATER = ICE;

export interface IronPose {
  xb: number;
  xf: number;
  bob: number;
  face?: 'hurt' | 'broken';
  frame: number;
}

/** Frame size: the same as the toaster's, so the hand and the gun sit at the same height. */
export const IRON_W = 40;
export const IRON_H = 41;

/** Where the shell's front edge is on row y (it slopes down to the tip of the soleplate). */
function front(y: number): number {
  return 22 + Math.round(((y - 12) * 11) / 13);
}

/**
 * Plancha de Vapor, side view facing right: the head is the whole iron, wide and low, the
 * soleplate's point forward and the handle arching over the top (a silhouette none of the others
 * has). Teal shell, white trim, steel soleplate with its steam holes, and the water tank as a
 * window at the back. Jokes: the scrap of a burnt shirt collar still stuck under the soleplate
 * (the job interview), the dial jammed on LINO (red), and polished black interview shoes. Face:
 * heavy, flat lids and a straight mouth: she has ironed worse than you.
 */
export function makeIron(pose: IronPose): Canvas {
  const cv = new Canvas(IRON_W, IRON_H);
  const body = new Canvas(IRON_W, IRON_H);
  const broken = pose.face === 'broken';
  if (!broken) hand(body, 4, 27);
  feet(cv, pose.xb, pose.xf, 30, { L: 4, leg: OFFICE, shoe: OFFICE });
  // Shine on the polished shoes.
  cv.set(pose.xf + 1, 34, STEEL[0]!);
  // The shell: rows 12–25, a flat back (with its dark side) and a front that slopes to the tip.
  for (let y = 12; y <= 25; y++) {
    const x0 = y === 12 ? 10 : y === 13 ? 9 : 8;
    const x1 = front(y);
    body.rect(x0, y, x1 - x0 + 1, 1, TEAL[1]!);
    // The dark back side (three-quarter: the face turned away from us).
    body.rect(x0, y, 3, 1, TEAL_SIDE[1]!);
    body.set(x0, y, TEAL_SIDE[2]!);
    body.set(x0 + 2, y, TEAL_SIDE[3]!);
    // The sloped front catches the light from above.
    body.set(x1, y, TEAL[0]!);
    if (y > 12) body.set(x1 - 1, y, TEAL[0]!);
  }
  body.rect(12, 12, front(12) - 12, 1, TEAL[0]!);
  // White trim along the bottom of the shell, then the steel soleplate with its point forward.
  body.rect(9, 24, front(24) - 9, 2, FRT[1]!);
  body.rect(9, 24, front(24) - 9, 1, FRT[0]!);
  body.rect(8, 26, 27, 1, STEEL[0]!);
  body.rect(8, 27, 26, 1, STEEL[2]!);
  body.set(34, 26, STEEL[1]!);
  for (const x of [11, 15, 19, 23, 27]) body.set(x, 27, STEEL[4]!);
  // The handle: navy rubber arching over the top, open underneath.
  body.rect(11, 5, 15, 2, NAVY[1]!);
  body.rect(11, 5, 15, 1, NAVY[0]!);
  body.rect(11, 7, 2, 5, NAVY[2]!);
  body.set(11, 7, NAVY[1]!);
  for (const [x, y] of [[24, 7], [25, 7], [23, 8], [24, 8], [23, 9], [22, 10], [23, 10], [22, 11]] as Pt[]) body.set(x, y, NAVY[1]!);
  body.set(25, 6, NAVY[2]!);
  // The steam button on the handle, red, pressed for years.
  body.rect(16, 4, 3, 1, RED[1]!);
  // The water tank: a window at the back, a third full, with its level marks.
  box(body, 12, 14, 5, 8, WATER);
  body.rect(13, 18, 3, 3, WATER[2]!);
  body.rect(13, 18, 3, 1, WATER[1]!);
  body.set(16, 16, WATER[3]!);
  body.set(16, 18, WATER[3]!);
  // Temperature dial on the back side, the pointer jammed on LINO (red).
  body.rect(9, 20, 2, 3, NAVY[2]!);
  body.set(9, 20, NAVY[0]!);
  body.set(10, 22, RED[1]!);
  // A scratch, a drop of limescale and the brand plate.
  body.set(25, 15, TEAL[2]!);
  body.set(30, 21, WHITE);
  body.rect(18, 23, 4, 1, TEAL[2]!);
  // Eyes on the side of the shell: flat lids down to the middle, pupils ahead.
  for (const ex of [19, 25]) {
    const back = ex === 19;
    if (pose.face === 'hurt') {
      const pts: Pt[] = back ? [[ex, 15], [ex + 1, 16], [ex + 2, 17], [ex + 1, 18], [ex, 19]] : [[ex + 2, 15], [ex + 1, 16], [ex, 17], [ex + 1, 18], [ex + 2, 19]];
      for (const [x, y] of pts) body.set(x, y, K);
    } else if (broken) {
      for (const [x, y] of [[ex, 15], [ex + 2, 15], [ex + 1, 16], [ex, 17], [ex + 2, 17]] as Pt[]) body.set(x, y, K);
    } else {
      body.rect(ex, 16, 3, 3, WHITE);
      // The lid: shell colour over the top half, a dark line under it.
      body.rect(ex, 16, 3, 1, TEAL[2]!);
      body.rect(ex - (back ? 1 : 0), 15, 4, 1, K);
      body.rect(ex + 1, 17, 2, 2, K);
      body.set(ex + 2, 17, back ? K : WHITE);
    }
  }
  // The mouth: a straight, unimpressed line (a grimace when hurt, slack when broken).
  if (pose.face === 'hurt') {
    body.rect(22, 21, 6, 1, K);
    body.set(21, 22, K);
    body.set(28, 22, K);
  } else if (broken) {
    body.rect(23, 21, 3, 2, K);
  } else {
    body.rect(22, 21, 6, 1, K);
    body.set(28, 20, K);
  }
  if (broken) {
    // A crack across the shell and the handle off its front post.
    for (const [x, y] of [[14, 12], [15, 13], [16, 13], [17, 14], [18, 15]] as Pt[]) body.set(x, y, K);
    clear(body, [[22, 10], [23, 10], [22, 11]]);
  }
  cv.blit(body, 0, pose.bob);
  // The scrap of a shirt collar, burnt in the shape of the soleplate, stuck under its back.
  const collar = new Canvas(IRON_W, IRON_H);
  collar.rect(5, 27, 4, 2, FRT[1]!);
  collar.set(4, 28, FRT[1]!);
  collar.set(5, 29, FRT[2]!);
  collar.set(7, 27, BROWN[2]!);
  collar.set(8, 28, BROWN[3]!);
  collar.set(6, 28, BROWN[1]!);
  cv.blit(collar, 0, pose.bob);
  // A little steam from the soleplate's tip every other frame (never when broken).
  const o = outline(cv);
  if (!broken && pose.frame % 2 === 1) {
    o.set(36, 25 + pose.bob, hx('#f4f1e8', 170));
    o.set(37, 24 + pose.bob, hx('#f4f1e8', 120));
    o.set(37, 23 + pose.bob, hx('#f4f1e8', 80));
  }
  // The cord: out of the back, down to a coil on the floor with a bit of black tape on it.
  const cord: Pt[] = [[7, 22], [6, 23], [5, 24], [4, 25], [3, 26], [2, 28], [2, 29], [2, 30], [2, 31], [3, 32], [4, 33], [5, 33], [6, 32], [5, 31], [4, 31]];
  for (const [x, y] of cord) {
    const yy = y + (y < 30 ? pose.bob : 0);
    if (o.get(x, yy)[3] === 0 || (x < 4 && y > 26)) o.set(x, yy, K);
  }
  o.set(2, 30, YEL[2]!);
  return o;
}

/** The eight game frames (CharacterLook): idle ×2, walk ×4, hurt, broken. */
export const IRON_FRAMES: readonly IronPose[] = [
  { xb: 14, xf: 21, bob: 0, frame: 0 },
  { xb: 14, xf: 21, bob: 1, frame: 1 },
  { xb: 13, xf: 22, bob: 0, frame: 0 },
  { xb: 16, xf: 19, bob: -1, frame: 1 },
  { xb: 21, xf: 14, bob: 0, frame: 0 },
  { xb: 19, xf: 16, bob: -1, frame: 1 },
  { xb: 15, xf: 20, bob: 1, frame: 0, face: 'hurt' },
  { xb: 14, xf: 21, bob: 1, frame: 0, face: 'broken' },
];

export function makeIronFrames(): Canvas[] {
  return IRON_FRAMES.map((p) => makeIron(p));
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
