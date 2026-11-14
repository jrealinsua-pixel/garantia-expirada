// M14c (a7b): La Lavadora Programa Eco, the floor 1's other boss, redrawn in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo», and the bosses' size decided in (a7a)). The old
// maker stays in lavadora.ts (with its bullets, which are not redrawn until (a10)).
//
// A front-loader in three quarters in the same cold white enamel as the Nevera (they never share a
// floor: the seed draws one), told apart by everything else: the porthole that is its belly, the
// control panel across its brow with the «2:59» that never moves, the program dial, the detergent
// drawer pulled out and leaking blue powder, the towel everyone leaves on top, the ECO leaf and the
// A+++ label it printed itself, the odd red sock caught in the door seal, the drain hose that goes
// nowhere, and spindly levelling feet (it walks on its corners) instead of shoes.

import type { Canvas, RGBA } from '../../src/art/canvas.ts';
import { INK, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { box34 } from './planta3-nuevo.ts';
import type { Pose } from './pose.ts';
import { PROGRAMS, type Program } from './lavadora.ts';

export const LAVADORA_W = 84;
export const LAVADORA_H = 88;
/** Where its feet touch the floor (EnemyDef.anchor). */
export const LAVADORA_FEET = { x: 38, y: 86 } as const;
/** The porthole's middle, px from the feet: BossBrain.muzzle (everything comes out of the drum). */
export const LAVADORA_DRUM = { x: 7, y: 26 } as const;
/** Frames per program: rest, breathing, four of walking, weighing the load, and its attack pose. */
export const LAVADORA_PER_PROGRAM = 8;
export const LAVADORA_WEIGH = 6;
export const LAVADORA_POSE = 7;

const REST: Pose = { xb: 22, xf: 50, bob: 0 };
const POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

interface Look {
  program: Program;
  slosh?: boolean;
  weighing?: boolean;
  /** Its attack: foam out of the seal, a sock flying, the drum flat out. */
  attack?: boolean;
}

// The cabinet.
const X0 = 12;
const Y0 = 21;
const FW = 46;
const FH = 57;
const DEPTH = 7;
const FX = X0 + DEPTH;
/** The porthole: centre (the muzzle) and outer radius of the chrome ring. */
const PX = LAVADORA_FEET.x + LAVADORA_DRUM.x;
const PY = LAVADORA_FEET.y - LAVADORA_DRUM.y;
const PR = 14;

/** Tiny 3 × 5 digits of its display. */
const DIGITS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '9': ['###', '#.#', '###', '..#', '##.'],
  ':': ['...', '.#.', '...', '.#.', '...'],
};

function text(p: Paint, x: number, y: number, s: string, m: Material, tone: number): void {
  let cx = x;
  for (const ch of s) {
    const g = DIGITS[ch]!;
    const w = ch === ':' ? 1 : 3;
    const off = ch === ':' ? 1 : 0;
    g.forEach((row, j) => [...row].forEach((c, k) => {
      if (c === '#' && k - off >= 0 && k - off < w) p.px(cx + k - off, y + j, m, tone);
    }));
    cx += w + 1;
  }
}

/** Levelling feet: a threaded steel stem and a round rubber pad, on the floor whatever the bob. */
function feet(p: Paint, pose: Pose, top: number): void {
  const floor = LAVADORA_FEET.y - 1;
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 3, top, 3, L, 'acero', back ? 4 : 3);
    p.rect(x + 3, top, 1, L, 'acero', back ? 3 : 1);
    for (let y = top + 1; y < top + L; y += 2) p.px(x + 5, y, 'acero', 5);
    // The lock nut under the cabinet.
    p.rect(x + 2, top, 5, 2, 'acero', back ? 3 : 2);
    // The pad.
    p.rect(x, yb, 9, 3, 'goma', back ? 3 : 2);
    p.rect(x + 1, yb, 7, 1, 'goma', back ? 2 : 1);
    p.rect(x, yb + 3, 9, 1, 'goma', 4);
  }
}

/** A turquoise rubber glove (the eco range), fingers together. */
function mitt(p: Paint, x: number, y: number): void {
  p.ellipsoid(x + 4, y + 4, 4.2, 3.8, 'turquesa', { dither: 0 });
  p.ellipsoid(x + 7.5, y + 2, 1.6, 2.2, 'turquesa', { dither: 0, bias: 0.1 });
  p.rect(x + 1, y + 8, 7, 3, 'turquesa', 3);
  p.rect(x + 1, y + 8, 7, 1, 'turquesa', 1);
  p.rect(x + 1, y + 10, 7, 1, 'turquesa', 4);
}

/** The control panel across its brow: drawer, display, dial. */
function panel(p: Paint, look: Look): void {
  const y0 = Y0 + 2;
  p.rect(FX + 1, y0, FW - 2, 11, 'esmalte', 2);
  p.rect(FX + 1, y0, FW - 2, 1, 'esmalte', 1);
  p.rect(FX + 1, y0 + 11, FW - 2, 1, 'esmalte', 5);
  // The detergent drawer, pulled half out (its lip in light), leaking blue powder down the front.
  p.rect(FX + 2, y0 + 2, 10, 7, 'esmalte', 3);
  p.rect(FX + 2, y0 + 2, 10, 1, 'esmalte', 0);
  p.rect(FX + 3, y0 + 4, 8, 1, 'esmalte', 5);
  p.rect(FX + 4, y0 + 6, 5, 2, 'azul', 2);
  for (const [x, y] of [[FX + 5, y0 + 9], [FX + 6, y0 + 10], [FX + 5, y0 + 12], [FX + 6, y0 + 14], [FX + 5, y0 + 17]] as const) p.px(x, y, 'azul', 1);
  // The display: «2:59», always; spinning, the revs in red; weighing, amber dashes.
  const dx = FX + 14;
  p.rect(dx, y0 + 2, 18, 8, 'pantalla', 5);
  p.rect(dx, y0 + 9, 18, 1, 'esmalte', 1);
  if (look.weighing) for (const x of [dx + 2, dx + 7, dx + 12]) p.rect(x, y0 + 5, 4, 1, 'amarillo', 1);
  else if (look.program === 'centrifugado') text(p, dx + 2, y0 + 3, '1400', 'rojo', 1);
  else text(p, dx + 2, y0 + 3, '2:59', 'verde', 1);
  // The program dial: a chrome knob with the pointer (to ECO, straight up for Lavado, hard right spinning).
  const kx = FX + 37;
  const ky = y0 + 5;
  p.ellipsoid(kx + 0.5, ky + 0.5, 3.8, 3.8, 'acero', { dither: 0, spec: true });
  const tip: Record<Program, readonly [number, number]> = { prelavado: [-2, -2], lavado: [0, -3], centrifugado: [3, 0] };
  const [tx, ty] = tip[look.program];
  p.raw(kx, ky, INK);
  p.raw(kx + Math.round(tx / 2), ky + Math.round(ty / 2), INK);
  p.raw(kx + tx, ky + ty, INK);
  // The marks round the dial: the leaf of ECO in green at its top left.
  p.px(kx - 5, ky - 3, 'verde', 2);
  p.px(kx - 5, ky + 3, 'esmalte', 5);
  p.px(kx + 5, ky - 3, 'esmalte', 5);
  p.px(kx + 5, ky + 3, 'rojo', 2);
}

/**
 * The eyes, between the panel and the porthole: tired and superior (Prelavado, lids half shut),
 * cross (Lavado, lids slanting in), wide awake with pinprick pupils (Centrifugado), and looking
 * down at its own feet while it weighs the load.
 */
function eyes(p: Paint, look: Look): void {
  const ey = Y0 + 15;
  for (const [ex, inner] of [[PX - 13, 1], [PX + 3, -1]] as const) {
    // The socket: a dark recess (9 x 8) with a lit lower rim; the eye white inside it.
    p.ellipsoid(ex + 5, ey + 4, 5.4, 4.4, 'pantalla', { dither: 0, bias: -0.5 });
    p.rect(ex + 1, ey + 8, 8, 1, 'esmalte', 1);
    p.ellipsoid(ex + 5, ey + 4, 4.2, 3.4, 'acero', { dither: 0, bias: 0.3 });
    if (look.weighing) {
      // Looking down at its feet, at the scale it does not have.
      p.rect(ex + 3, ey + 5, 4, 2, 'azul', 3);
      p.raw(ex + 4, ey + 6, INK);
      p.raw(ex + 5, ey + 6, INK);
      p.rect(ex, ey, 10, 5, 'esmalte', 1);
      p.rect(ex, ey + 4, 10, 1, 'esmalte', 5);
      continue;
    }
    if (look.program === 'centrifugado' && !look.attack) {
      // Wide awake, the pupils shrunk to a dot.
      p.rect(ex + 5, ey + 3, 2, 2, 'azul', 3);
      p.raw(ex + 5, ey + 3, INK);
    } else if (look.program === 'centrifugado') {
      // Flat out: the eyes going round with the drum.
      for (const [dx, dy] of [[4, 2], [5, 2], [6, 3], [6, 4], [5, 5], [4, 5], [3, 4], [4, 3]] as const) p.px(ex + dx, ey + dy, 'azul', 3);
      p.raw(ex + 5, ey + 4, INK);
    } else {
      // Soap blue irises with a white glint, looking ahead (to the right).
      p.rect(ex + 4, ey + 2, 4, 5, 'azul', 2);
      p.rect(ex + 4, ey + 5, 4, 2, 'azul', 4);
      p.rect(ex + 5, ey + 3, 2, 3, 'pantalla', 5);
      p.raw(ex + 7, ey + 2, SHINE);
      p.raw(ex + 4, ey + 5, SHINE);
    }
    // The lids: tired and superior in Prelavado (half shut, flat), cross in Lavado and when it
    // attacks (slanting in towards the middle), barely any spinning.
    if (look.program === 'prelavado' && !look.attack) {
      p.rect(ex, ey - 1, 10, 4, 'esmalte', 1);
      p.rect(ex, ey + 3, 10, 1, 'esmalte', 5);
    } else if (look.program !== 'centrifugado' || look.attack) {
      for (let i = 0; i < 10; i++) {
        const k = inner > 0 ? i : 9 - i;
        const h = 1 + Math.floor((k * 5) / 10);
        p.rect(ex + i, ey - 1, 1, h, 'esmalte', 1);
        p.px(ex + i, ey - 1 + h, 'esmalte', 5);
      }
    } else {
      p.rect(ex + 1, ey, 8, 1, 'esmalte', 4);
    }
  }
}

/** The porthole: chrome ring, rubber seal, the glass, and in it the program. */
function porthole(p: Paint, look: Look): void {
  p.ellipsoid(PX, PY, PR, PR, 'acero', { dither: 0.3, aa: 0.4 });
  // The ring's inner bevel, darker, then the grey rubber seal.
  p.ellipsoid(PX, PY, PR - 2, PR - 2, 'acero', { bias: -0.55, dither: 0 });
  p.ellipsoid(PX, PY, PR - 3, PR - 3, 'goma', { bias: -0.2, dither: 0 });
  const r = PR - 4.5;
  const s = look.slosh ? 1 : 0;
  const inside = (x: number, y: number): boolean => (x + 0.5 - PX) ** 2 + (y + 0.5 - PY) ** 2 <= r * r;
  for (let y = Math.floor(PY - r); y <= Math.ceil(PY + r); y++) {
    for (let x = Math.floor(PX - r); x <= Math.ceil(PX + r); x++) {
      if (!inside(x, y)) continue;
      const dx = x + 0.5 - PX;
      const dy = y + 0.5 - PY;
      if (look.program === 'prelavado') {
        // Foam up to the brim, a little water at the bottom.
        const foam = dy < 3 - s + Math.sin((dx + s * 2) * 0.9) * 1.5;
        if (foam) p.px(x, y, 'vidrio', (Math.round(dx) * 3 + Math.round(dy)) % 7 === 0 ? 0 : (Math.round(dx + dy) + s) % 5 === 0 ? 2 : 1);
        else p.px(x, y, 'azul', dy > 6 ? 4 : 3);
      } else if (look.program === 'lavado') {
        // Water, its level sloshing, darker deep down.
        const level = -2 + s + (dx > 0 ? 1 : 0);
        p.px(x, y, dy < level ? 'pantalla' : 'azul', dy < level ? 3 : Math.abs(dy - level) < 1 ? 1 : dy > 5 ? 4 : 3);
      } else {
        // Spinning: a blur of streaks going round.
        const a = Math.atan2(dy, dx) + Math.hypot(dx, dy) * 0.35 + s * 0.6;
        const band = Math.floor(((a / (Math.PI * 2)) * 6 + 12) % 2);
        p.px(x, y, 'azul', band ? 2 : look.attack ? 1 : 4);
      }
    }
  }
  if (look.program === 'lavado') {
    // An odd sock going round in the water.
    const sx = PX - 4 + s * 2;
    const sy = PY + 1 - s;
    p.rect(sx, sy, 3, 4, 'rojo', 2);
    p.rect(sx, sy + 3, 5, 2, 'rojo', 2);
    p.rect(sx + 3, sy + 4, 2, 1, 'acero', 1);
    p.rect(sx, sy, 3, 1, 'acero', 1);
  } else if (look.program === 'centrifugado') {
    for (let a = 0; a < Math.PI * 2; a += 0.12) {
      const k = (a + s * 0.8) % (Math.PI * 2);
      if (k < 1.4) p.px(PX + Math.cos(a) * 5 - 0.5, PY + Math.sin(a) * 5 - 0.5, 'rojo', 2);
      if (k > 3.2 && k < 4.4) p.px(PX + Math.cos(a) * 3 - 0.5, PY + Math.sin(a) * 3 - 0.5, 'vidrio', 1);
    }
  }
  // The window's reflection, top left.
  for (const [x, y] of [[-5, -6], [-6, -5], [-4, -6], [-6, -4]] as const) p.raw(PX + x, PY + y, SHINE);
  p.px(PX - 3, PY - 7, 'vidrio', 0);
  // The handle on the right of the door.
  p.rect(PX + PR, PY - 4, 3, 9, 'acero', 2);
  p.rect(PX + PR, PY - 4, 1, 9, 'acero', 1);
  p.px(PX + PR + 2, PY + 4, 'acero', 4);
}

/** The ECO sticker: a green leaf with its vein, a corner peeling. */
function leaf(p: Paint, x: number, y: number): void {
  p.ellipsoid(x + 3, y + 3, 3.2, 2.6, 'verde', { dither: 0, bias: 0.1 });
  for (let i = 0; i < 5; i++) p.px(x + 1 + i, y + 5 - i, 'verde', 4);
  p.px(x + 6, y, 'acero', 1);
}

/** The A+++ label it printed itself: all the bars green. */
function label(p: Paint, x: number, y: number): void {
  p.rect(x, y, 8, 12, 'acero', 1);
  p.rect(x, y, 8, 1, 'acero', 0);
  p.rect(x + 7, y + 1, 1, 11, 'acero', 3);
  for (let i = 0; i < 5; i++) p.rect(x + 1, y + 2 + i * 2, 2 + i, 1, 'verde', i < 2 ? 2 : 1);
  p.rect(x + 5, y + 2, 2, 1, 'goma', 5);
}

export function makeLavadoraNueva(pose: Pose = REST, look: Look = { program: 'prelavado' }): Canvas {
  const p = new Paint(LAVADORA_W, LAVADORA_H);
  const d = pose.bob;
  feet(p, pose, Y0 + FH + d);
  const b = new Paint(LAVADORA_W, LAVADORA_H);
  // The back glove, behind the cabinet; up while it attacks.
  const up = look.attack ? -10 : look.weighing ? 4 : 0;
  mitt(b, 1, 50 + up);
  // The drain hose out of its back, looping down to nowhere, and the plug of the cable.
  for (const [x, y] of [[9, 60], [8, 61], [7, 62], [6, 63], [6, 64], [6, 65], [6, 66], [7, 67], [8, 68], [9, 69]] as const) {
    b.px(x, y, 'goma', 2);
    b.px(x + 1, y, 'goma', 4);
  }
  b.rect(9, 70, 3, 2, 'goma', 1);
  box34(b, X0, Y0, FW, FH, DEPTH, 'esmalte', { top: [0, 0], side: [4, 3], front: [0, 1, 2] });
  b.rect(FX + FW - 1, Y0 + 1, 1, FH - 2, 'esmalte', 3);
  b.rect(FX + 1, Y0 + FH - 8, FW - 2, 6, 'esmalte', 2);
  // The towel left on top (everyone uses it as a shelf), crumpled, hanging over the back edge.
  b.rect(X0 + 22, Y0 - 6, 16, 4, 'azul', 2);
  b.rect(X0 + 23, Y0 - 7, 13, 1, 'azul', 1);
  b.rect(X0 + 22, Y0 - 3, 16, 1, 'azul', 4);
  b.rect(X0 + 26, Y0 - 6, 1, 3, 'azul', 3);
  b.rect(X0 + 31, Y0 - 5, 1, 2, 'azul', 3);
  for (let j = 0; j < 6; j++) b.px(X0 + 37 + (j >> 2), Y0 - 3 + j, 'azul', j < 2 ? 3 : 4);
  panel(b, look);
  eyes(b, look);
  porthole(b, look);
  // The red sock caught in the seal, hanging out of the bottom of the door.
  const sy = PY + PR - 3;
  b.rect(PX - 6, sy, 3, 4, 'rojo', 2);
  b.rect(PX - 6, sy, 1, 4, 'rojo', 1);
  b.rect(PX - 7, sy + 4, 4, 2, 'rojo', 2);
  b.rect(PX - 7, sy + 5, 2, 1, 'acero', 1);
  // On the front, left of the door: the A+++ label it printed, the ECO leaf; vents on the side.
  label(b, FX + 2, Y0 + 26);
  leaf(b, FX + 2, Y0 + 41);
  for (let y = Y0 + 40; y < Y0 + FH - 6; y += 3) b.rect(X0 + 1, y - 4 + 2, 5, 1, 'esmalte', 5);
  // Scuffs and rust where water always drips.
  for (const [x, y, t] of [[FX + 2, Y0 + FH - 4, 1], [FX + 3, Y0 + FH - 3, 2], [FX + FW - 3, Y0 + FH - 4, 1], [X0 + 2, Y0 + FH - 4, 2]] as const) b.px(x, y, 'oxido', t);
  b.rect(FX + FW - 5, Y0 + 13, 2, 1, 'esmalte', 3);
  if (look.attack && look.program === 'prelavado') {
    // Foam frothing out of the seal all round the door.
    for (let a = 0; a < Math.PI * 2; a += 0.38) {
      const fx = PX + Math.cos(a) * (PR - 1) + Math.sin(a * 3) * 0.8;
      const fy = PY + Math.sin(a) * (PR - 1);
      b.ellipsoid(fx, fy, 1.8, 1.6, 'vidrio', { dither: 0, bias: 0.3 });
    }
  }
  if (look.attack && look.program === 'lavado') {
    // A sock flying out over the door, never with its pair.
    const kx = FX + FW + 4;
    const ky = Y0 + 6;
    b.rect(kx, ky, 6, 4, 'rojo', 2);
    b.rect(kx, ky, 6, 1, 'rojo', 1);
    b.rect(kx + 4, ky + 1, 4, 6, 'rojo', 3);
    b.rect(kx, ky, 1, 4, 'acero', 1);
    b.rect(kx + 5, ky + 6, 3, 2, 'acero', 1);
  }
  // The front glove, half over the cabinet.
  mitt(b, FX + FW + 2, 54 + up);
  p.stamp(b, 0, d);
  const out = p.outline();
  const put = (x: number, y: number, c: RGBA): void => {
    if (x >= 0 && y >= 0 && x < out.w && y < out.h && out.get(x, y)[3] === 0) out.set(x, y, c);
  };
  // A drip under the door while it washes.
  if (look.program !== 'prelavado') put(PX - 2, LAVADORA_FEET.y - 4 + (look.slosh ? 1 : 0), [105, 170, 230, 200]);
  // Spinning flat out: steam off the top.
  if (look.attack && look.program === 'centrifugado') for (const [x, y, a] of [[20, 10, 140], [24, 7, 110], [52, 9, 140], [56, 6, 100], [38, 4, 90]] as const) put(x, y + d, [235, 238, 248, a]);
  return out;
}

/** The sheet: LAVADORA_PER_PROGRAM frames per program (Prelavado, Lavado, Centrifugado). */
export function makeLavadoraNuevaFrames(): Canvas[] {
  return PROGRAMS.flatMap((program) => [
    ...POSES.map((pose, i) => makeLavadoraNueva(pose, { program, slosh: i % 2 === 1 })),
    makeLavadoraNueva({ ...REST, bob: 1 }, { program, weighing: true }),
    makeLavadoraNueva(REST, { program, attack: true }),
  ]);
}

/** Size of each piece of its debris. */
export const LAVADORA_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-lavadora-eco`): the porthole's glass, the program
 * dial, the detergent drawer, the odd sock, the towel and a levelling foot.
 */
export function makeLavadoraBits(): Canvas[] {
  const S = LAVADORA_BIT;
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      p.ellipsoid(6, 6, 5.4, 5.4, 'acero', { dither: 0 });
      p.ellipsoid(6, 6, 3.8, 3.8, 'azul', { dither: 0, bias: -0.1 });
      p.raw(4, 4, SHINE);
    },
    (p) => {
      p.ellipsoid(6, 6, 3.8, 3.8, 'acero', { dither: 0, spec: true });
      p.raw(6, 6, INK);
      p.raw(5, 5, INK);
    },
    (p) => {
      p.rect(1, 4, 10, 5, 'esmalte', 2);
      p.rect(1, 4, 10, 1, 'esmalte', 0);
      p.rect(3, 6, 5, 2, 'azul', 2);
    },
    (p) => {
      p.rect(3, 1, 4, 6, 'rojo', 2);
      p.rect(3, 6, 7, 3, 'rojo', 2);
      p.rect(3, 1, 4, 1, 'acero', 1);
      p.rect(8, 7, 2, 2, 'acero', 1);
    },
    (p) => {
      p.rect(1, 3, 10, 6, 'azul', 2);
      p.rect(1, 3, 10, 1, 'azul', 1);
      p.rect(4, 3, 1, 6, 'azul', 3);
      p.rect(8, 4, 1, 5, 'azul', 4);
    },
    (p) => {
      p.rect(5, 1, 2, 7, 'acero', 2);
      p.rect(4, 1, 4, 2, 'acero', 1);
      p.rect(2, 8, 8, 3, 'goma', 2);
      p.rect(2, 8, 8, 1, 'goma', 1);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(S, S);
    draw(p);
    return p.outline();
  });
}
