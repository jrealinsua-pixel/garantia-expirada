// Approved characters and weapons. Faithful port of tools/referencia/build4.py:
// the output must match art/referencia/ pixel for pixel (see tests/sprites.test.ts).
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import {
  BLUE, BROWN, BURNT, CREAM, CYAN, DSTEEL, FRT, GLOVE, GLOW, GLOW2, GREEN, ICE, K, OFFICE, PANTL, PINK, RED,
  RUBBER, RUSTR, SMOKE, SNEAK, STEEL, SUITB, TOASTC, TOPS, WHITE, YEL, box, cube, feet, hand, outline, pad, ramp,
} from '../../src/art/lib.ts';

type Pt = readonly [number, number];

export function miniDryer(): Canvas {
  const cv = new Canvas(18, 11);
  box(cv, 0, 2, 3, 4, DSTEEL);
  cv.rect(1, 3, 1, 2, K);
  box(cv, 2, 1, 10, 6, PINK);
  cv.rect(3, 2, 6, 1, PINK[0]!);
  cv.rect(5, 3, 1, 3, PINK[2]!);
  box(cv, 12, 2, 5, 4, DSTEEL);
  cv.rect(16, 2, 1, 4, GLOW);
  cv.set(16, 3, GLOW2);
  cv.set(16, 4, GLOW2);
  box(cv, 5, 7, 3, 4, PINK);
  cv.set(8, 7, RED[1]!);
  return outline(cv);
}

export function miniStapler(): Canvas {
  const cv = new Canvas(18, 11);
  box(cv, 1, 1, 15, 4, RED);
  cv.rect(2, 1, 10, 1, RED[0]!);
  box(cv, 0, 5, 17, 2, STEEL);
  cv.rect(14, 5, 2, 1, K);
  box(cv, 5, 7, 3, 4, DSTEEL);
  cv.set(8, 7, YEL[1]!);
  return outline(cv);
}

export interface HeroPose {
  /** Draw the Secador in the front hand (approved reference look). */
  gun: boolean;
  /** Back and front leg x positions (reference: 12 and 18). */
  xb: number;
  xf: number;
  /** Vertical offset of everything above the legs (idle breathing, walk bounce). */
  bob: number;
  /** Expression: squeezed eyes when hit, crossed-out eyes and empty slots once broken. */
  face?: 'hurt' | 'broken';
  /** Animation frame, used for the smoke. */
  frame: number;
}

const DEFAULT_POSE: HeroPose = { gun: true, xb: 12, xf: 18, bob: 0, frame: 0 };

/** Toaster hero. The default pose reproduces the approved reference exactly. */
export function makeHero(withGun = true): Canvas {
  return makeHeroPose({ ...DEFAULT_POSE, gun: withGun });
}

export function makeHeroPose(pose: HeroPose): Canvas {
  const cv = new Canvas(40, 36);
  const body = new Canvas(40, 36);
  const broken = pose.face === 'broken';
  if (!broken) hand(body, 9, 21);
  feet(cv, pose.xb, pose.xf, 25, { L: 4, shoe: SNEAK });
  box(body, 12, 19, 10, 6, DSTEEL);
  body.rect(12, 22, 10, 1, YEL[1]!);
  for (const x of [13, 16, 19]) body.set(x, 22, K);
  cube(body, 6, 5, 22, 15, 5, 4, STEEL, DSTEEL, TOPS);
  const slots: Array<[number, number, typeof TOASTC]> = [
    [14, 0, TOASTC],
    [20, 1, BURNT],
  ];
  for (const [sx, top, T] of slots) {
    body.rect(sx - 1, 7, 6, 1, K);
    // Once broken the slices have popped out: only the dark slots are left.
    if (broken) continue;
    body.rect(sx, top, 4, 8 - top, T[1]!);
    body.rect(sx, top, 4, 1, T[3]!);
    body.rect(sx, top, 1, 8 - top, T[2]!);
    body.rect(sx + 3, top, 1, 8 - top, T[3]!);
    body.set(sx + 1, top + 2, T[0]!);
    body.set(sx + 2, top + 3, T[2]!);
  }
  body.rect(7, 9, 4, 2, hx('#e9c9a8'));
  body.set(8, 9, hx('#c99a7a'));
  body.set(9, 10, hx('#c99a7a'));
  body.rect(8, 11, 1, 6, K);
  body.rect(7, 13, 3, 2, RED[1]!);
  body.set(7, 13, RED[0]!);
  for (const ex of [18, 24]) {
    body.rect(ex, 11, 3, 4, K);
    body.rect(ex, 11, 3, 2, STEEL[3]!);
    body.rect(ex - 1, 11, 4, 1, K);
    body.set(ex + 1, 13, WHITE);
    body.rect(ex, 15, 3, 1, STEEL[2]!);
    if (pose.face) {
      // Wipe the eye and draw it again: squeezed shut (> <) when hit, crossed out when broken.
      body.rect(ex - 1, 11, 4, 4, STEEL[1]!);
      const left = ex === 18;
      const pts: Pt[] =
        pose.face === 'hurt'
          ? left
            ? [[ex, 12], [ex + 1, 13], [ex, 14]]
            : [[ex + 2, 12], [ex + 1, 13], [ex + 2, 14]]
          : [[ex, 12], [ex + 2, 12], [ex + 1, 13], [ex, 14], [ex + 2, 14]];
      for (const [x, y] of pts) body.set(x, y, K);
      body.rect(ex - 1, 11, 4, 1, STEEL[2]!);
    }
  }
  if (pose.face) {
    // Mouth open in a grimace (hit) or hanging open (broken).
    body.rect(21, 17, 3, 2, K);
    if (pose.face === 'hurt') body.set(22, 17, WHITE);
  } else {
    body.rect(21, 17, 3, 1, K);
    body.set(20, 18, K);
    body.set(24, 16, K);
  }
  body.rect(12, 14, 4, 3, YEL[1]!);
  body.rect(12, 15, 4, 1, RED[1]!);
  const rust: Pt[] = [[26, 10], [27, 11], [13, 18], [25, 17], [10, 9], [17, 11]];
  for (const [x, y] of rust) body.set(x, y, RUSTR[1]!);
  body.rect(13, 10, 2, 1, STEEL[0]!);
  if (pose.gun) {
    body.blit(miniDryer(), 20, 17);
    hand(body, 25, 24);
  }
  cv.blit(body, 0, pose.bob);
  let o = outline(cv);
  const cord: Pt[] = [[11, 24], [10, 25], [9, 26], [8, 27], [7, 28], [6, 29], [5, 30], [4, 31], [3, 31]];
  for (const [x, y] of cord) o.set(x, y, K);
  o.set(2, 31, STEEL[1]!);
  o.set(2, 30, GLOW);
  const crumbs: Pt[] = [[24, 30], [27, 33], [9, 33]];
  for (const [x, y] of crumbs) o.set(x, y, TOASTC[1]!);
  o = pad(o, 5);
  // Smoke from the burnt slice drifts one pixel left and right between frames.
  if (broken) return o;
  const sx = pose.frame % 2 === 1 ? 1 : 0;
  const smoke: Array<[number, number, number]> = [[22, 4, 0], [23, 3, 0], [22, 2, 1], [21, 1, 1], [22, 0, 2], [24, 2, 1]];
  for (const [x, y, k] of smoke) o.set(x + (y < 3 ? sx : 0), y + pose.bob, SMOKE[k]!);
  return o;
}

/** Game frames for the toaster, without the gun (the game draws gun and front hand rotating). */
export const HERO_FRAMES: ReadonlyArray<{ name: string; pose: HeroPose }> = [
  { name: 'idle0', pose: { gun: false, xb: 12, xf: 18, bob: 0, frame: 0 } },
  { name: 'idle1', pose: { gun: false, xb: 12, xf: 18, bob: 1, frame: 1 } },
  { name: 'walk0', pose: { gun: false, xb: 11, xf: 19, bob: 0, frame: 0 } },
  { name: 'walk1', pose: { gun: false, xb: 14, xf: 16, bob: -1, frame: 1 } },
  { name: 'walk2', pose: { gun: false, xb: 18, xf: 12, bob: 0, frame: 0 } },
  { name: 'walk3', pose: { gun: false, xb: 16, xf: 14, bob: -1, frame: 1 } },
  { name: 'hurt', pose: { gun: false, xb: 13, xf: 17, bob: 1, frame: 0, face: 'hurt' } },
  { name: 'broken', pose: { gun: false, xb: 12, xf: 18, bob: 1, frame: 0, face: 'broken' } },
];

export function makeAspirador(): Canvas {
  const cv = new Canvas(32, 36);
  hand(cv, 6, 20, BLUE);
  feet(cv, 9, 14, 24, { L: 4, shoe: ramp('#8fb5e6', '#5f93d4', '#3f66a6', '#27447a') });
  for (const wx of [10, 12, 15, 17]) {
    cv.rect(wx, 30, 2, 2, K);
    cv.set(wx, 30, STEEL[2]!);
  }
  box(cv, 9, 19, 9, 5, GLOVE);
  const tag: Pt[] = [[9, 2], [8, 3], [7, 4]];
  for (const [x, y] of tag) cv.set(x, y, CREAM[2]!);
  cv.rect(2, 4, 6, 4, WHITE);
  cv.rect(3, 5, 4, 1, RED[1]!);
  cv.rect(3, 6, 2, 1, RED[1]!);
  cv.set(2, 4, CREAM[2]!);
  cv.rect(10, 1, 9, 2, DSTEEL[1]!);
  cv.rect(10, 1, 9, 1, DSTEEL[0]!);
  cv.rect(10, 1, 2, 5, DSTEEL[1]!);
  cv.rect(17, 1, 2, 5, DSTEEL[2]!);
  cube(cv, 3, 5, 22, 15, 5, 3, BLUE, ramp('#3f66a6', '#2f4f88', '#22396a', '#16264a'), ramp('#c6dcf6', '#8fb5e6', '#5f93d4', '#3f66a6'));
  cv.rect(13, 10, 12, 5, K);
  cv.rect(14, 11, 10, 3, hx('#2a0f18'));
  cv.rect(19, 11, 4, 3, RED[1]!);
  cv.rect(20, 11, 2, 2, RED[0]!);
  cv.set(20, 11, WHITE);
  for (let i = 0; i < 8; i++) cv.set(16 + i, 9 + Math.floor(i / 3), K);
  for (let x = 16; x < 24; x += 2) cv.set(x, 16, K);
  cv.rect(4, 11, 3, 6, BROWN[2]!);
  cv.set(5, 12, BROWN[0]!);
  cv.set(4, 15, GREEN);
  cv.rect(10, 16, 7, 1, BLUE[3]!);
  const rust: Pt[] = [[23, 8], [12, 18], [4, 9]];
  for (const [x, y] of rust) cv.set(x, y, RUSTR[1]!);
  const hose: Pt[] = [[25, 15], [26, 16], [27, 17], [28, 18], [28, 19], [28, 20], [27, 21], [27, 22], [27, 23]];
  for (const [x, y] of hose) cv.rect(x, y, 2, 1, y % 2 ? DSTEEL[1]! : DSTEEL[3]!);
  const hose2: Pt[] = [[27, 24], [27, 25], [27, 26], [26, 27]];
  for (const [x, y] of hose2) cv.rect(x, y, 2, 1, y % 2 ? DSTEEL[1]! : DSTEEL[3]!);
  box(cv, 23, 28, 9, 3, STEEL);
  cv.rect(23, 30, 9, 1, K);
  hand(cv, 25, 19, BLUE);
  const o = outline(cv);
  const dust: Array<[number, number, number]> = [[5, 31, 0], [3, 30, 1], [2, 32, 2], [6, 33, 1]];
  for (const [x, y, k] of dust) o.set(x, y, SMOKE[k]!);
  return o;
}

export function makeMicroondas(): Canvas {
  const cv = new Canvas(32, 36);
  hand(cv, 5, 21, CREAM);
  feet(cv, 10, 16, 25, { L: 4, shoe: RUBBER });
  box(cv, 10, 20, 10, 5, DSTEEL);
  cv.rect(10, 22, 10, 1, CREAM[2]!);
  for (let i = 0; i < 6; i++) cv.set(18 + Math.floor(i / 2), 1 + i, STEEL[1]!);
  cv.rect(19, 0, 4, 1, STEEL[0]!);
  for (const x of [19, 21]) cv.set(x, 1, STEEL[2]!);
  cube(cv, 3, 5, 25, 16, 4, 3, CREAM, ramp('#a89f86', '#8a8270', '#6c6556', '#4a4538'), ramp('#fffaf0', '#efe8d4', '#d6cdb2', '#a89f86'));
  cv.rect(8, 10, 13, 9, K);
  cv.rect(9, 11, 11, 7, YEL[2]!);
  cv.rect(9, 11, 11, 2, YEL[1]!);
  cv.rect(10, 11, 2, 1, YEL[0]!);
  cv.rect(12, 13, 2, 2, K);
  cv.rect(17, 13, 2, 2, K);
  cv.set(11, 12, K);
  cv.set(12, 12, K);
  cv.set(19, 12, K);
  cv.set(18, 12, K);
  cv.rect(13, 15, 5, 3, K);
  cv.rect(14, 16, 3, 1, RED[2]!);
  cv.rect(13, 15, 5, 1, WHITE);
  for (let x = 9; x < 20; x += 3) cv.set(x, 17, YEL[3]!);
  cv.rect(22, 9, 4, 3, K);
  for (const x of [22, 23, 25]) cv.set(x, 10, GREEN);
  const panel: Array<[number, number, RGBA]> = [
    [22, 13, RED[1]!], [24, 13, STEEL[2]!], [22, 15, STEEL[2]!], [24, 15, STEEL[2]!], [22, 17, STEEL[2]!], [24, 17, RED[1]!],
  ];
  for (const [x, y, c] of panel) cv.rect(x, y, 2, 1, c);
  const rust: Pt[] = [[4, 9], [26, 19], [6, 18], [20, 8]];
  for (const [x, y] of rust) cv.set(x, y, RUSTR[1]!);
  hand(cv, 24, 21, CREAM);
  let o = outline(cv);
  o = pad(o, 4);
  const sparks: Array<[number, number, RGBA]> = [[17, 4, YEL[0]!], [24, 5, CYAN], [25, 3, YEL[1]!], [23, 2, WHITE]];
  for (const [x, y, c] of sparks) o.set(x, y, c);
  const steam: Array<[number, number, number]> = [[8, 6, 0], [7, 4, 1], [8, 2, 2], [11, 5, 1], [12, 3, 2]];
  for (const [x, y, k] of steam) o.set(x, y, SMOKE[k]!);
  return o;
}

export function makeBombilla(): Canvas {
  const cv = new Canvas(32, 36);
  feet(cv, 11, 17, 26, { L: 4, leg: SUITB, shoe: OFFICE });
  box(cv, 11, 21, 10, 5, SUITB);
  cv.rect(15, 21, 3, 3, CREAM[0]!);
  cv.set(16, 21, RED[1]!);
  cv.set(17, 22, RED[1]!);
  cv.rect(17, 23, 1, 2, RED[1]!);
  cv.set(19, 22, CREAM[0]!);
  box(cv, 4, 20, 5, 5, CREAM);
  cv.rect(5, 22, 3, 1, RED[1]!);
  cv.set(3, 22, CREAM[2]!);
  cv.set(3, 23, CREAM[2]!);
  hand(cv, 7, 22, GLOVE);
  for (let y = 16; y < 21; y++) cv.rect(12, y, 8, 1, y % 2 === 0 ? STEEL[1]! : STEEL[3]!);
  cv.rect(13, 20, 6, 1, DSTEEL[2]!);
  const cx = 16;
  const cy = 8.5;
  const rx = 9.5;
  const ry = 8.3;
  for (let y = 0; y < 18; y++) {
    for (let x = 4; x < 28; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        const t = 0.75 * dx + 0.6 * dy;
        const c = t < -0.6 ? hx('#fff9d6') : t < 0.15 ? hx('#f9eba0') : t < 0.6 ? hx('#e3c96a') : hx('#b8973e');
        cv.set(x, y, c);
      }
    }
  }
  cv.rect(9, 3, 2, 1, WHITE);
  cv.rect(8, 4, 1, 2, WHITE);
  cv.rect(13, 14, 1, 3, STEEL[3]!);
  cv.rect(19, 14, 1, 3, STEEL[3]!);
  for (const ex of [16, 22]) {
    cv.rect(ex, 8, 2, 3, K);
    cv.set(ex, 8, GLOW);
  }
  for (let i = 0; i < 4; i++) {
    cv.set(15 + i, 5 + Math.floor(i / 2), K);
    cv.set(24 - i, 5 + Math.floor(i / 2), K);
  }
  cv.rect(18, 13, 5, 1, K);
  cv.set(23, 12, K);
  cv.rect(19, 13, 3, 1, hx('#8f7a3a'));
  cv.rect(18, 13, 1, 1, K);
  cv.rect(14, 12, 1, 4, STEEL[3]!);
  cv.rect(17, 14, 1, 2, STEEL[3]!);
  cv.rect(14, 12, 4, 1, GLOW2);
  const crack: Pt[] = [[22, 2], [23, 3], [22, 4], [23, 5], [24, 6]];
  for (const [x, y] of crack) cv.set(x, y, hx('#8f7a3a'));
  box(cv, 22, 24, 8, 5, BROWN);
  cv.rect(25, 23, 3, 1, BROWN[3]!);
  cv.rect(25, 26, 2, 1, YEL[1]!);
  hand(cv, 23, 22, GLOVE);
  let o = outline(cv);
  o = pad(o, 3);
  const MOTH = hx('#b8a07a');
  const moth: Array<[number, number, RGBA]> = [[27, 3, MOTH], [29, 3, MOTH], [28, 4, K], [27, 4, hx('#8a7454')], [29, 4, hx('#8a7454')]];
  for (const [x, y, c] of moth) o.set(x, y, c);
  const trail: Pt[] = [[26, 6], [25, 8]];
  for (const [x, y] of trail) o.set(x, y, [200, 200, 210, 120]);
  return o;
}

/**
 * La Nevera Suprema (the approved sprite). With `open`, its second phase: the fridge door swung
 * open on its hinge (seen edge-on, on the right) and the lit inside full of expired food.
 */
export function makeNevera(open = false): Canvas {
  const cv = new Canvas(72, 76);
  {
    const x = 4;
    const y = 36;
    cv.rect(x, y, 7, 7, GLOVE[1]!);
    cv.rect(x, y, 6, 1, GLOVE[0]!);
    cv.rect(x + 6, y, 1, 7, GLOVE[2]!);
  }
  cv.rect(21, 62, 5, 8, PANTL[2]!);
  cv.rect(41, 62, 5, 8, PANTL[1]!);
  cv.rect(41, 62, 1, 8, PANTL[0]!);
  cv.rect(18, 69, 10, 4, GLOVE[2]!);
  cv.rect(18, 69, 9, 1, GLOVE[1]!);
  cv.rect(38, 69, 12, 4, GLOVE[1]!);
  cv.rect(38, 69, 11, 1, GLOVE[0]!);
  cube(cv, 10, 6, 46, 58, 9, 5, FRT, ramp('#a7b0c4', '#8790a8', '#6a7390', '#4a5170'), ramp('#ffffff', '#eef2f8', '#c9d0de', '#99a3ba'));
  box(cv, 26, 2, 18, 4, YEL);
  for (const x of [26, 34, 42]) cv.rect(x, 0, 2, 2, YEL[1]!);
  cv.rect(33, 3, 3, 2, RED[1]!);
  cv.set(28, 3, CYAN);
  cv.set(40, 3, CYAN);
  cv.rect(19, 25, 37, 1, FRT[3]!);
  cv.rect(19, 26, 37, 1, FRT[0]!);
  for (const [y0, h] of [[13, 9], [30, 22]] as const) {
    cv.rect(21, y0, 2, h, STEEL[2]!);
    cv.rect(21, y0, 1, h, STEEL[1]!);
    cv.rect(23, y0, 1, h, K);
  }
  for (const ex of [32, 45]) {
    cv.rect(ex, 14, 7, 7, K);
    cv.rect(ex + 2, 16, 4, 4, RED[1]!);
    cv.rect(ex + 3, 16, 2, 2, RED[0]!);
    cv.set(ex + 3, 16, WHITE);
  }
  for (let i = 0; i < 8; i++) {
    const d = Math.floor(i / 3);
    cv.set(31 + i, 11 + d, K);
    cv.set(31 + i, 12 + d, K);
    cv.set(52 - i, 11 + d, K);
    cv.set(52 - i, 12 + d, K);
  }
  cv.rect(27, 31, 26, 17, K);
  cv.rect(28, 32, 24, 15, hx('#1d3d63'));
  cv.rect(28, 39, 24, 1, hx('#69a8d8'));
  for (let tx = 28; tx < 52; tx += 4) box(cv, tx, 32, 3, 4, ICE);
  for (let tx = 30; tx < 50; tx += 4) box(cv, tx, 43, 3, 4, ICE);
  cv.rect(31, 38, 3, 1, GREEN);
  cv.rect(44, 38, 4, 1, RED[1]!);
  cv.rect(41, 51, 11, 8, GREEN);
  cv.rect(41, 51, 11, 1, hx('#2f7a41'));
  cv.rect(42, 53, 7, 1, WHITE);
  cv.rect(42, 55, 4, 1, WHITE);
  cv.rect(42, 57, 2, 1, WHITE);
  cv.rect(27, 51, 8, 7, YEL[1]!);
  cv.rect(28, 53, 5, 1, YEL[3]!);
  cv.rect(28, 55, 4, 1, YEL[3]!);
  cv.rect(30, 50, 2, 2, RED[1]!);
  for (let y = 40; y < 58; y += 3) cv.rect(12, y, 6, 1, hx('#4a5170'));
  const rust: Pt[] = [[14, 13], [15, 14], [54, 58], [53, 59], [11, 60], [25, 60], [50, 28]];
  for (const [x, y] of rust) cv.set(x, y, RUSTR[1]!);
  const frost: Pt[] = [[20, 12], [21, 11], [55, 12], [54, 11]];
  for (const [x, y] of frost) cv.set(x, y, ICE[1]!);
  if (open) neveraOpen(cv);
  box(cv, 56, 38, 13, 9, YEL);
  cv.rect(56, 41, 13, 2, K);
  cv.rect(58, 44, 4, 1, YEL[3]!);
  cv.rect(64, 44, 3, 2, RED[1]!);
  cv.rect(54, 44, 7, 7, GLOVE[1]!);
  cv.rect(54, 44, 6, 1, GLOVE[0]!);
  cv.rect(60, 44, 1, 7, GLOVE[2]!);
  const o = outline(cv);
  const cold: Pt[] = [[8, 8], [9, 7], [62, 10]];
  for (const [x, y] of cold) o.set(x, y, [225, 240, 250, 140]);
  return o;
}

/** The open fridge: lit inside with two shelves of expired food, and the door swung out on the right. */
function neveraOpen(cv: Canvas): void {
  const BACK = ramp('#3d4a66', '#2c3550', '#1f263c');
  const MOLD = ramp('#b5d36a', '#7fa83f', '#4f6e2a');
  const LIGHT = hx('#fff4c2');
  // The dark frame of the opening, then the inside: lighter at the top where the bulb is.
  cv.rect(19, 27, 37, 36, K);
  for (let y = 28; y < 62; y++) cv.rect(20, y, 35, 1, y < 33 ? BACK[0]! : y < 48 ? BACK[1]! : BACK[2]!);
  cv.rect(34, 28, 7, 1, LIGHT);
  cv.rect(35, 29, 5, 1, hx('#d9cf9c'));
  // Two wire shelves.
  for (const y of [42, 53]) {
    cv.rect(20, y, 35, 1, STEEL[1]!);
    cv.rect(20, y + 1, 35, 1, STEEL[3]!);
  }
  // Top shelf: a swollen yogurt, a milk carton, a can.
  cv.rect(23, 37, 5, 5, CREAM[1]!);
  cv.rect(22, 35, 7, 2, MOLD[1]!);
  cv.rect(23, 34, 5, 1, MOLD[0]!);
  cv.rect(23, 39, 5, 2, RED[1]!);
  cv.rect(31, 33, 6, 9, WHITE);
  cv.rect(32, 32, 4, 1, WHITE);
  cv.rect(31, 36, 6, 2, BLUE[1]!);
  cv.rect(35, 39, 2, 2, MOLD[2]!);
  cv.rect(40, 36, 5, 6, RED[1]!);
  cv.rect(40, 35, 5, 1, STEEL[1]!);
  cv.rect(41, 37, 2, 1, WHITE);
  cv.set(44, 39, K);
  cv.rect(47, 38, 6, 4, MOLD[2]!);
  cv.rect(48, 37, 4, 1, MOLD[1]!);
  // Bottom shelf: a mouldy lump, a tin of fish, a tub with a green cloud.
  cv.rect(22, 49, 8, 4, MOLD[1]!);
  cv.rect(23, 48, 5, 1, MOLD[0]!);
  cv.set(25, 50, MOLD[2]!);
  cv.rect(32, 50, 9, 3, STEEL[2]!);
  cv.rect(32, 50, 9, 1, STEEL[0]!);
  cv.rect(43, 47, 7, 6, CREAM[1]!);
  cv.rect(43, 47, 7, 1, CREAM[0]!);
  cv.rect(44, 45, 5, 2, MOLD[0]!);
  // Drips and a puddle at the bottom.
  for (const [x, y] of [[29, 54], [29, 55], [46, 54]] as const) cv.set(x, y, MOLD[1]!);
  cv.rect(24, 59, 12, 1, MOLD[2]!);
  // The door, open towards us: seen edge-on as a slanted panel hinged on the right edge.
  for (let y = 27; y < 63; y++) {
    const sl = Math.floor((y - 27) / 12);
    cv.rect(56 + sl, y, 7 - sl, 1, FRT[2]!);
    cv.set(56 + sl, y, FRT[0]!);
    cv.set(62, y, FRT[3]!);
  }
  // Its inner side: two door bins with bottles.
  for (const y of [34, 48]) {
    cv.rect(57, y, 6, 3, FRT[1]!);
    cv.rect(57, y + 2, 6, 1, FRT[3]!);
    cv.rect(58, y - 3, 1, 3, GREEN);
    cv.rect(60, y - 2, 2, 2, RED[1]!);
  }
}

/** Pixels of the moth (and its trail) drawn next to the approved bulb: in the game the moth flies on its own. */
const BULB_MOTH: Pt[] = [[27, 3], [29, 3], [28, 4], [27, 4], [29, 4], [26, 6], [25, 8]];

/**
 * Game frames of the Bombilla de Bajo Consumo, built from the approved sprite:
 * 0 = lit (the approved look without the moth), 1 = off (still switching on: grey glass, eyes shut).
 */
export function makeBombillaFrames(): Canvas[] {
  const lit = makeBombilla();
  for (const [x, y] of BULB_MOTH) lit.p[y]![x] = [0, 0, 0, 0];
  const off = new Canvas(lit.w, lit.h);
  const glass: Record<string, RGBA> = {
    [hx('#fff9d6').join()]: hx('#b3ae98'),
    [hx('#f9eba0').join()]: hx('#96917c'),
    [hx('#e3c96a').join()]: hx('#7a7562'),
    [hx('#b8973e').join()]: hx('#5c5748'),
    [WHITE.join()]: hx('#cfcbb8'),
    [GLOW2.join()]: hx('#5c5748'),
    [GLOW.join()]: K,
    [hx('#8f7a3a').join()]: hx('#4a463a'),
  };
  for (let y = 0; y < lit.h; y++) {
    for (let x = 0; x < lit.w; x++) {
      const c = lit.get(x, y);
      // Only the glass (the bulb is above the collar, y < 20 once padded).
      off.p[y]![x] = y < 20 ? (glass[c.join()] ?? c) : c;
    }
  }
  return [lit, off];
}

/** Polilla Fiel: two wing beats, 11 x 9. Faces right like the rest. */
export function makePolilla(): Canvas[] {
  const WING = ramp('#efe2bf', '#cdb98f', '#a68d62', '#6f5a3c');
  // 0 light, 1 mid, 2 dark, 3 spot; '.' empty. Left half only, mirrored around the body column.
  const UP = ['00...', '011..', '0121.', '.1311', '..111', '.....'];
  const DOWN = ['.....', '.....', '..111', '01311', '0121.', '01...'];
  const frames: Canvas[] = [];
  for (const rows of [UP, DOWN]) {
    const cv = new Canvas(11, 9);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x]!;
        if (ch === '.') continue;
        const c = WING[Number(ch)]!;
        cv.set(x, y + 1, c);
        cv.set(10 - x, y + 1, c);
      }
    });
    // Furry body and head, a bright eye looking right, two antennae.
    cv.rect(5, 3, 1, 4, hx('#5a4630'));
    cv.set(5, 2, hx('#7a6040'));
    cv.set(6, 2, GLOW);
    cv.set(6, 1, hx('#5a4630'));
    cv.set(4, 1, hx('#5a4630'));
    frames.push(outline(cv));
  }
  return frames;
}
