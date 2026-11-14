// M14c (a4a): the Toaster in the new style, in the game. The drawing is the (a1) test sprite
// (tools/sprites/prueba-a1.ts, art/prueba/tostadora.png) turned into the eight frames every
// playable character has (CharacterLook): idle ×2, walk ×4, hurt and broken. Without the gun and
// the front hand (the game draws them turning with the aim) and without the floor shadow and the
// crumbs (the game draws its own shadow under the feet).
//
// The legs and the cord are painted apart from the body so the body can bob over them; the two
// are stamped together and outlined once (Paint.stamp), so the figure keeps one clean outline.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, type Material, type Ramp6 } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

const M = MATERIALS;

/** Frame size and where the feet are in it (CharacterLook of the toaster in src/data/characters.ts). */
export const TOASTER_W = 40;
export const TOASTER_H = 46;
export const TOASTER_FEET_X = 22.5;
export const TOASTER_FEET_Y = 45;
/** Height in the frame of the middle of the body: the roll spins round it. */
export const TOASTER_SPIN_Y = 26;

/** Where the painting goes in the frame: one column of room for the plug's outline, two rows for the smoke. */
const OX = 1;
const OY = 2;

export interface ToasterPose {
  /** Back and front leg x (at rest 15 and 23). */
  xb: number;
  xf: number;
  /** Vertical offset of the body over the legs (breathing, the walk's bounce). */
  bob: number;
  /** Squeezed eyes when hit; crossed out, slices gone and mouth hanging once broken. */
  face?: 'hurt' | 'broken';
  /** Animation frame (the smoke drifts one pixel between odd and even). */
  frame: number;
}

/** The eight frames, in the order of CharacterLook (the same names as the old HERO_FRAMES). */
export const TOASTER_FRAMES: ReadonlyArray<{ name: string; pose: ToasterPose }> = [
  { name: 'idle0', pose: { xb: 15, xf: 23, bob: 0, frame: 0 } },
  { name: 'idle1', pose: { xb: 15, xf: 23, bob: 1, frame: 1 } },
  { name: 'walk0', pose: { xb: 14, xf: 24, bob: 0, frame: 0 } },
  { name: 'walk1', pose: { xb: 18, xf: 20, bob: -1, frame: 1 } },
  { name: 'walk2', pose: { xb: 23, xf: 15, bob: 0, frame: 0 } },
  { name: 'walk3', pose: { xb: 20, xf: 18, bob: -1, frame: 1 } },
  { name: 'hurt', pose: { xb: 16, xf: 22, bob: 1, frame: 0, face: 'hurt' } },
  { name: 'broken', pose: { xb: 15, xf: 23, bob: 1, frame: 0, face: 'broken' } },
];

/** Glove: a small shaded ball, the hands float (no arms). */
function glove(p: Paint, x: number, y: number, m: Material = 'goma'): void {
  p.ellipsoid(x + 2, y + 2, 2.2, 2.2, m, { dither: 0 });
}

/** Short legs and red sneakers. The back leg one tone darker. */
function legs(p: Paint, xb: number, xf: number, y: number, L: number): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    p.rect(x + 1, y, 2, L, 'goma', back ? 4 : 2);
    p.px(x + 1, y, 'goma', back ? 5 : 3);
    p.px(x + 2, y + L - 1, 'goma', back ? 3 : 1);
    const yb = y + L;
    const sw = back ? 5 : 6;
    p.rect(x, yb, sw, 2, 'rojo', back ? 3 : 2);
    p.rect(x + 1, yb, sw - 2, 1, 'rojo', back ? 2 : 1);
    p.px(x + sw - 2, yb, 'rojo', back ? 1 : 0);
    p.rect(x, yb + 2, sw, 1, 'acero', back ? 3 : 1);
    p.px(x + 2, yb, 'acero', back ? 2 : 0);
  }
}

// The body's geometry (in the painting, before OX/OY).
const X0 = 7;
const SW = 7; // side face width
const X1 = 35; // right edge (inclusive)
const TOP = 10; // top face starts
const TH = 5; // top face height
const BOT = 32; // bottom edge (exclusive)
const FY = TOP + TH; // front face top
const HZ = FY + 7; // the horizon reflected in the chrome

/** The chrome front face's tone at (x, y): bright ceiling, sharp horizon, darker room, floor bounce. */
function frontTone(x: number, y: number): number {
  const right = x > X1 - 6;
  let tone: number;
  if (y < HZ) tone = right ? 2 : 1;
  else if (y < BOT - 3) tone = right ? 3 : 2;
  else tone = 4;
  if (y >= BOT - 3 && y < BOT - 1 && !right) tone = 3;
  return tone;
}

function paintBody(p: Paint, pose: ToasterPose): void {
  const broken = pose.face === 'broken';
  if (!broken) glove(p, 7, 25); // back hand (once broken it has let go)

  // Crumb tray / base: dark rubber with a yellow strip and three vent holes.
  p.rect(14, 32, 16, 4, 'goma', 3);
  p.rect(14, 32, 16, 1, 'goma', 1);
  p.rect(15, 34, 14, 1, 'amarillo', 2);
  for (const x of [17, 21, 25]) p.px(x, 34, 'amarillo', 4);
  p.rect(14, 35, 16, 1, 'goma', 5);

  // Top face: a skewed band, the most lit.
  for (let j = 0; j < TH; j++) {
    const off = Math.floor((TH - j) / 2);
    for (let x = X0 + off; x <= X1 - (j === 0 ? 1 : 0); x++) {
      const tone = j === 0 ? 2 : x < X0 + off + 2 ? 1 : x < X0 + 14 ? 0 : 1;
      p.px(x, TOP + j, 'acero', tone);
    }
  }
  for (let x = X0 + SW; x <= X1; x++) p.px(x, FY, 'acero', x < X1 - 1 ? 0 : 1);
  // Side face, in shade, with a checkered seam.
  const SEAM = FY + 9;
  for (let y = FY; y < BOT; y++) {
    for (let x = X0; x < X0 + SW; x++) {
      const tone = y < SEAM ? 3 : y > SEAM ? 4 : (x + y) % 2 ? 3 : 4;
      p.px(x, y, 'acero', x === X0 ? tone + 1 : tone);
    }
  }
  p.rect(X0, FY, SW, 1, 'acero', 2);
  for (let y = FY + 1; y < BOT; y++) p.px(X0 + SW, y, 'acero', y < FY + 8 ? 1 : 2);
  // Front face: chrome, a mirror.
  for (let y = FY + 1; y < BOT; y++) for (let x = X0 + SW + 1; x <= X1; x++) p.px(x, y, 'acero', frontTone(x, y));
  for (let y = FY + 2; y < BOT - 4; y++) {
    p.px(X0 + SW + 3, y, 'acero', y < HZ ? 0 : 1);
    if (y < HZ) p.px(X0 + SW + 5, y, 'acero', 0);
  }
  for (let y = FY + 1; y < BOT; y++) p.px(X1, y, 'acero', 4);
  for (let x = X0 + SW + 1; x <= X1; x++) p.px(x, BOT - 1, 'acero', 5);
  p.rect(X0, BOT - 1, SW + 1, 1, 'acero', 6);
  for (const [x, y] of [[X0, TOP + 3], [X0, TOP + 4], [X0 + 1, TOP + 3], [X1, TOP], [X1, BOT - 1], [X0, BOT - 1]] as const) p.erase(x, y);

  // Slots and toast: the golden slice sticks up proud, the burnt one sits lower and smokes. Hit,
  // both jump up two pixels; broken, they have popped out and only the dark slots are left.
  const jump = pose.face === 'hurt' ? 2 : 0;
  const slots: Array<[number, number, Material]> = [[17, 1 - jump, 'tostada'], [25, 3 - jump, 'quemada']];
  for (const [sx, top, m] of slots) {
    if (broken) {
      p.rect(sx, TOP + 1, 5, 1, 'acero', 6);
    } else {
      const R = M[m] as Ramp6;
      const n = R.length;
      for (let y = Math.max(0, top); y < TOP + 2; y++) {
        for (let x = sx; x < sx + 5; x++) {
          const edge = y === top || x === sx + 4;
          p.px(x, y, m, edge ? n - 2 : x === sx ? 1 : y < top + 3 ? 1 : 2);
        }
      }
      if (top >= 0) {
        p.rect(sx, top, 5, 1, m, n - 3);
        p.px(sx, top, m, n - 2);
        p.px(sx + 4, top, m, n - 1);
      }
      p.px(sx + 2, top + 2, m, 0);
      p.px(sx + 3, top + 4, m, 3);
      p.px(sx + 1, top + 5, m, 3);
    }
    p.rect(sx - 1, TOP + 2, 7, 1, 'acero', 6);
    p.rect(sx - 1, TOP + 3, 7, 1, 'acero', 3);
  }

  // Side face: the lever (pushed down once broken) and the browning dial.
  p.rect(X0 + 2, FY + 2, 1, 10, 'acero', 6);
  p.ellipsoid(X0 + 3, FY + (broken ? 11 : 5.5), 1.8, 1.4, 'rojo', { dither: 0 });
  p.ellipsoid(X0 + 3.5, FY + 13.5, 1.6, 1.6, 'acero', { dither: 0, bias: 0.15 });
  p.px(X0 + 4, FY + 12, 'rojo', 2);

  // The face.
  for (const [ex, left] of [[22, true], [29, false]] as const) {
    if (!pose.face) {
      // Tired, fed-up eyes under heavy lids, brows tilted in.
      p.rect(ex, 19, 3, 4, 'acero', 6);
      for (let i = 0; i < 3; i++) p.raw(ex + i, 19, INK);
      p.rect(ex, 20, 3, 1, 'acero', 4);
      p.raw(ex + 1, 21, SHINE);
      p.rect(ex - 1, 18, 5, 1, 'acero', 5);
      p.px(left ? ex - 1 : ex + 3, 17, 'acero', 5);
      p.rect(ex, 23, 3, 1, 'acero', 1);
      continue;
    }
    // Hit: squeezed shut (> <). Broken: crossed out. The brows still frown.
    const pts: Array<[number, number]> =
      pose.face === 'hurt'
        ? left
          ? [[ex, 19], [ex + 1, 20], [ex + 2, 21], [ex + 1, 22], [ex, 23]]
          : [[ex + 2, 19], [ex + 1, 20], [ex, 21], [ex + 1, 22], [ex + 2, 23]]
        : [[ex, 19], [ex + 2, 19], [ex + 1, 20], [ex, 21], [ex + 2, 21]];
    for (const [x, y] of pts) p.px(x, y, 'acero', 6);
    p.rect(ex - 1, 17, 5, 1, 'acero', 5);
    if (pose.face === 'hurt') p.px(left ? ex + 3 : ex - 1, 16, 'acero', 5);
  }
  if (pose.face === 'hurt') {
    // Mouth wide open in a grimace, teeth clenched.
    p.rect(25, 26, 5, 3, 'acero', 6);
    p.rect(26, 26, 3, 1, 'acero', 0);
  } else if (broken) {
    // Hanging open, crooked.
    p.rect(26, 26, 3, 3, 'acero', 6);
    p.px(25, 27, 'acero', 6);
    p.px(27, 28, 'rojo', 3);
  } else {
    p.rect(26, 27, 4, 1, 'acero', 6);
    p.px(25, 28, 'acero', 6);
    p.px(30, 26, 'acero', 6);
    p.px(27, 28, 'acero', 2);
  }

  // Price sticker, half peeled: -70 %.
  p.rect(16, 24, 5, 4, 'amarillo', 1);
  p.rect(16, 27, 5, 1, 'amarillo', 3);
  p.px(20, 24, 'amarillo', 0);
  p.rect(17, 25, 3, 1, 'rojo', 2);
  p.px(16, 24, 'amarillo', 3);
  // Rust and a dent: a few specks.
  for (const [x, y, t] of [[33, 17, 1], [34, 18, 2], [12, 13, 1], [16, 30, 2], [9, 28, 1]] as const) p.px(x, y, 'oxido', t);
  p.px(32, 23, 'acero', 5);
  p.px(33, 24, 'acero', 1);
}

/** The cord: from the back of the base, curling down to the plug on the floor. */
function paintCord(p: Paint): void {
  // The plug rests on the floor, level with the soles.
  const cord: Array<[number, number]> = [[12, 34], [11, 35], [10, 36], [9, 37], [8, 38], [7, 39], [6, 40], [5, 40], [4, 41], [3, 41]];
  for (const [i, [x, y]] of cord.entries()) p.px(x, y, 'goma', i % 3 === 0 ? 2 : 3);
  p.rect(0, 40, 3, 3, 'acero', 2);
  p.px(0, 40, 'acero', 0);
  p.px(2, 42, 'acero', 4);
  p.px(0, 39, 'laton', 1);
  p.px(2, 39, 'laton', 2);
}

export function makeToasterPose(pose: ToasterPose): Canvas {
  const ground = new Paint(TOASTER_W, TOASTER_H);
  paintCord(ground);
  // The legs start a row higher than the base's bottom so the body never floats off them.
  legs(ground, pose.xb, pose.xf, 35, 5);
  const body = new Paint(TOASTER_W, TOASTER_H);
  paintBody(body, pose);
  const all = new Paint(TOASTER_W, TOASTER_H);
  all.stamp(ground, OX, OY);
  all.stamp(body, OX, OY + pose.bob);
  const o = all.outline();
  if (pose.face === 'broken') return o;
  // Smoke from the burnt slice: see-through violet-grey, drifting a pixel between frames.
  const sx = pose.frame % 2 === 1 ? 1 : 0;
  const top = OY + pose.bob + (pose.face === 'hurt' ? -2 : 0);
  const smoke: Array<[number, number, number]> = [[27, 0, 70], [28, 1, 110], [26, 1, 90], [29, 0, 50], [28, -1, 40]];
  for (const [x, y, a] of smoke) {
    const py = top + y;
    const px = OX + x + (y <= 0 ? sx : 0);
    if (py >= 0 && o.get(px, py)[3] === 0) o.set(px, py, [170, 160, 190, a]);
  }
  return o;
}

export function makeToasterFrames(): Canvas[] {
  return TOASTER_FRAMES.map((f) => makeToasterPose(f.pose));
}

/** Its floating glove in the new style (the game draws it with the gun, turning with the aim). */
export function makeToasterHand(): Canvas {
  const p = new Paint(7, 7);
  p.ellipsoid(3.5, 3.5, 2.4, 2.4, 'goma', { dither: 0 });
  return p.outline();
}
