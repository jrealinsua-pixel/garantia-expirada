// The workshop's own enemies (M12 (3c)): machines of the Servicio Técnico, not reconditioned (they
// keep their own colours; the scene does not grey them).
import { Canvas, hx } from '../../src/art/canvas.ts';
import { K, RED, RUBBER, STEEL, DSTEEL, WHITE, YEL, cube, ellipse, hand, outline, ramp, type Ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

/** Workshop mustard: older and browner than the coupons' yellow, so a coupon never hides on it. */
const MUST = ramp('#e8c25a', '#c99a2e', '#94691e', '#5e4214');
const MUST_SIDE = ramp('#a8781f', '#8c6219', '#6a4812', '#46300c');
const MUST_TOP = ramp('#f6dc8a', '#e8c25a', '#c99a2e', '#94691e');
/** The counterweight: cast iron. */
const IRON = ramp('#5a5e6c', '#3e4250', '#2c2f3c', '#1c1e28');
/** Nitrile gloves, the Trituradora's colleagues. */
const NITRILE = ramp('#9ad4f4', '#5aa6e0', '#3a78b4', '#24507e');
/** The beacon: amber, lit or not. */
const BEACON_ON = ramp('#fff1a8', '#ffb347', '#ff7a1f', '#a8501a');
const BEACON_OFF = ramp('#e8a860', '#c0702e', '#8a4a1e', '#5a3014');

export const FORK_W = 36;
export const FORK_H = 37;
/** Frame names of the forklift's sheet, in order. */
export const FORK_FRAMES = ['reposo0', 'reposo1', 'rueda0', 'rueda1', 'rueda2', 'rueda3', 'aviso', 'aturdida'] as const;

function wheel(cv: Canvas, cx: number, cy: number, r: number, spin: number): void {
  ellipse(cv, cx, cy, r, r, RUBBER[3]!);
  ellipse(cv, cx - 0.4, cy - 0.4, r - 1, r - 1, K);
  ellipse(cv, cx, cy, r - 1.8, r - 1.8, MUST[2]!);
  const c: Pt = [Math.round(cx), Math.round(cy)];
  cv.set(c[0] - 1, c[1] - 1, MUST[0]!);
  // Two bolts on the hub, an eighth of a turn on frame by frame.
  const turns: Pt[][] = [[[0, -1], [0, 1]], [[1, -1], [-1, 1]], [[-1, 0], [1, 0]], [[-1, -1], [1, 1]]];
  const bolts = turns[spin % 4]!;
  for (const [dx, dy] of bolts) cv.set(c[0] + dx, c[1] + dy, MUST[3]!);
  cv.set(c[0], c[1], K);
}

/**
 * Carretilla Elevadora (M12 (3c)): a small electric forklift, nose to the right, with a face on
 * the front of its cab: two headlight eyes under a steel visor, bored and sure of itself, and a
 * grille for a mouth. Its forks stick out in front, low, at ankle height (what it rams with). Jokes:
 * the amber beacon on its roof guard (it lights when it charges), the red «FUERA DE SERVICIO»
 * lockout tag hanging from its mast that nobody has read, and a hazard-striped counterweight with
 * the green «APTO» sticker of the Servicio Técnico. Blue nitrile gloves float at its sides, one on
 * the lift lever. `mood`: 0 calm, 1 about to ram (beacon lit, forks up, brows down, mouth open),
 * 2 bonked into a wall (forks bent up, dizzy X eyes, beacon out, a spring loose). 36x37.
 */
export function makeCarretilla(spin = 0, bob = 0, mood: 0 | 1 | 2 = 0): Canvas {
  const cv = new Canvas(FORK_W, FORK_H - 1);
  const y = bob;
  // Wheels: a big drive wheel at the back, a small one under the mast.
  wheel(cv, 9, 31, 4.2, spin);
  wheel(cv, 23, 32, 3.2, spin + 1);
  // The mast: two steel rails in front of the cab, from the roof guard down to the floor.
  cv.rect(27, 7 + y, 2, 26 - y, STEEL[2]!);
  cv.rect(27, 7 + y, 1, 26 - y, STEEL[1]!);
  cv.rect(29, 8 + y, 1, 25 - y, DSTEEL[2]!);
  for (let yy = 11 + y; yy < 32; yy += 5) cv.set(28, yy, DSTEEL[3]!);
  // The forks: an L off the carriage, low (at ankle height); raised when it is about to ram, bent up after a wall.
  const fy = mood === 1 ? 24 : 31;
  cv.rect(28, fy - 3, 3, 4, DSTEEL[1]!);
  cv.rect(28, fy - 3, 3, 1, DSTEEL[0]!);
  if (mood === 2) {
    // Bent: the tips curl up.
    cv.rect(30, fy, 4, 1, STEEL[2]!);
    cv.rect(33, fy - 2, 1, 2, STEEL[2]!);
    cv.set(34, fy - 3, STEEL[1]!);
  } else {
    cv.rect(30, fy, 5, 1, STEEL[1]!);
    cv.set(34, fy, STEEL[0]!);
    cv.rect(30, fy - 1, 1, 1, STEEL[2]!);
  }
  // The counterweight at the back: cast iron with the hazard stripe.
  cv.rect(0, 17 + y, 7, 12, IRON[1]!);
  cv.rect(0, 17 + y, 7, 1, IRON[0]!);
  cv.rect(0, 17 + y, 1, 12, IRON[2]!);
  for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 4; xx++) cv.set(1 + xx, 21 + y + yy, ((xx + yy) >> 1) % 2 === 0 ? YEL[1]! : K);
  // The body: long side face on the left, front on the right.
  cube(cv, 5, 17 + y, 23, 13, 16, 2, MUST, MUST_SIDE, MUST_TOP);
  // The green «APTO» sticker on the side (a dot of a tick), a little skew.
  cv.rect(8, 21 + y, 4, 3, hx('#58b45a'));
  cv.set(9, 22 + y, WHITE);
  cv.set(10, 23 + y, WHITE);
  cv.set(11, 21 + y, hx('#3d8a45'));
  // A scrape along the side, down to the primer.
  cv.rect(13, 26 + y, 3, 1, MUST_SIDE[3]!);
  cv.set(16, 25 + y, MUST_SIDE[0]!);
  // The cab: its head, a cube, the face on the front.
  cube(cv, 9, 6 + y, 17, 13, 6, 2, MUST, MUST_SIDE, MUST_TOP);
  // The roof guard: a steel plate on two posts, with the beacon on top.
  cv.rect(8, 3 + y, 19, 2, DSTEEL[1]!);
  cv.rect(8, 3 + y, 19, 1, DSTEEL[0]!);
  // The rear post of the guard, down behind the cab to the body.
  cv.rect(8, 5 + y, 1, 12, DSTEEL[1]!);
  cv.rect(25, 5 + y, 1, 2, DSTEEL[2]!);
  const B: Ramp = mood === 1 ? BEACON_ON : BEACON_OFF;
  cv.rect(15, 0 + y, 4, 3, B[1]!);
  cv.rect(15, 0 + y, 2, 1, B[0]!);
  cv.rect(18, 1 + y, 1, 2, B[2]!);
  if (mood === 1) {
    // Lit: light spilling either side.
    cv.set(13, 1 + y, BEACON_ON[1]!);
    cv.set(20, 1 + y, BEACON_ON[1]!);
    cv.set(12, 0 + y, BEACON_ON[2]!);
    cv.set(21, 0 + y, BEACON_ON[2]!);
  }
  // The face: a steel visor over the eyes (its brows), two headlight eyes, a grille mouth.
  const fx = 15;
  const ey = 11 + y;
  if (mood === 2) {
    const xx: Pt[] = [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]];
    for (const ex of [fx + 1, fx + 6]) for (const [dx, dy] of xx) cv.set(ex + dx, ey + dy, K);
  } else {
    for (const ex of [fx + 1, fx + 6]) {
      cv.rect(ex, ey, 3, 3, K);
      cv.set(ex + 1, ey + 1, mood === 1 ? RED[0]! : WHITE);
      // Lids of the cab's colour: half shut, bored; when it is about to ram, only the visor.
      if (mood === 0) cv.rect(ex, ey, 3, 1, MUST[2]!);
    }
  }
  // The visor: straight when bored, sloping down to the middle when it means it.
  if (mood === 1) {
    for (const [x, yy] of [[fx, ey - 2], [fx + 1, ey - 2], [fx + 2, ey - 1], [fx + 3, ey - 1], [fx + 6, ey - 1], [fx + 7, ey - 1], [fx + 8, ey - 2], [fx + 9, ey - 2]] as Pt[]) cv.set(x, yy, K);
  } else cv.rect(fx, ey - 2, 10, 1, DSTEEL[2]!);
  // The grille: three slots; open (a black mouth with the slots as teeth) when it means it.
  const my = ey + 5;
  if (mood === 1) {
    cv.rect(fx + 2, my, 7, 3, K);
    for (let x = fx + 3; x <= fx + 7; x += 2) cv.set(x, my, WHITE);
  } else {
    for (let x = fx + 2; x <= fx + 8; x += 3) cv.rect(x, my, 2, 1, K);
    if (mood === 2) cv.rect(fx + 4, my + 1, 3, 1, K);
  }
  // The lockout tag nobody read: red card, white stripe, on a wire from the mast.
  cv.set(30, 9 + y, DSTEEL[2]!);
  cv.set(31, 10 + y, DSTEEL[2]!);
  cv.rect(30, 11 + y, 4, 6, RED[1]!);
  cv.rect(30, 11 + y, 1, 6, RED[0]!);
  cv.rect(30, 13 + y, 4, 1, WHITE);
  cv.set(33, 16 + y, RED[2]!);
  // The gloves: one floating behind, one on the lift lever by the mast (up with the forks).
  hand(cv, 3, 12 + y + (mood === 2 ? 3 : 0), NITRILE);
  hand(cv, 24, (mood === 1 ? 17 : 20) + y, NITRILE);
  if (mood === 2) {
    // A spring loose, sprung out of the cab's roof.
    for (const [x, yy] of [[22, 2], [23, 1], [22, 0], [23, -1]] as Pt[]) if (yy + y >= 0) cv.set(x, yy + y + 1, STEEL[1]!);
  }
  // One row of room on top for the beacon's outline.
  const out = new Canvas(FORK_W, FORK_H);
  out.blit(cv, 0, 1);
  return outline(out);
}

/** The forklift's frames (FORK_FRAMES): 0-1 idling (the motor shakes it), 2-5 rolling, 6 about to ram, 7 bonked. */
export function makeCarretillaFrames(): Canvas[] {
  return [
    makeCarretilla(0, 0),
    makeCarretilla(0, 1),
    makeCarretilla(0, 0),
    makeCarretilla(1, 1),
    makeCarretilla(2, 0),
    makeCarretilla(3, 1),
    makeCarretilla(0, 0, 1),
    makeCarretilla(0, 1, 2),
  ];
}

