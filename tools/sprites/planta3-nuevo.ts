// M14c (a6): the plant 3 enemies (Juguetería) redrawn in the new style (docs/ESTILO_ARTE.md,
// «M14c · El estilo nuevo»), with the painting tools of src/art/pintor.ts and the same legs and
// gloves as plant 1 (tools/sprites/planta1-nuevo.ts). The old makers stay in enemies.ts: the
// approved old sprites are kept as history. The frames and their order are the ones each enemy's
// `anim` names in src/data/enemies.ts; no floor shadow is baked in.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove, legs } from './planta1-nuevo.ts';
import { narrowPoseCycle, type Pose } from './pose.ts';

type RGBA = [number, number, number, number];
const raw = (m: Material, t: number): RGBA => [...MATERIALS[m][t]!] as RGBA;

/**
 * A box in three quarters (the same convention as plant 2's): the front face lit at its top-left,
 * the top face going back and up to the left, the left side in shade. Returns the front's corner.
 */
function box34(p: Paint, x0: number, y0: number, fw: number, fh: number, depth: number, m: Material, tones = { top: [0, 1], side: [4, 3], front: [1, 2, 3] }): { fx: number; fy: number } {
  for (let j = 0; j < depth; j++) p.rect(x0 + j, y0 - depth + j, fw, 1, m, j === 0 ? tones.top[0]! : tones.top[1]!);
  for (let i = 0; i < depth; i++) {
    const back = depth - i;
    p.rect(x0 + i, y0 - back + 1, 1, fh - 1, m, i === 0 ? tones.side[0]! : tones.side[1]!);
    p.px(x0 + i, y0 - back + fh - 1, m, tones.side[0]! + 1);
  }
  const fx = x0 + depth;
  const [lit, mid, low] = tones.front as [number, number, number];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) p.px(fx + x, y0 + y, m, y < 2 ? lit : y > fh - 3 ? low : mid);
  p.rect(fx, y0, fw, 1, m, Math.max(0, lit - 1));
  p.rect(fx, y0, 1, fh, m, lit);
  return { fx, fy: y0 };
}

// ---------------------------------------------------------------------------------------------
// The Robot de Cuerda: an old tin wind-up robot, head and body one dented box of faded teal tin
// with a red lithographed band round the bottom, rivets, a mouth grille of tin teeth and an
// antenna bent to one side. One eye is a sour little eye under a heavy lid; the other, a screw (it
// lost the real one). Jokes: the brass key on its back held on with a strip of sticking plaster,
// and the age label on its side, «3+» scratched to «33+». Red tin shoes.

export const ROBOT_W = 42;
export const ROBOT_H = 44;
export const ROBOT_FEET = { x: 21, y: 42 } as const;
export const ROBOT_LEGS2 = [15, 21] as const;
/** Its mouth grille, px above its feet (muzzleY): the nuts come out of here. */
export const ROBOT_MOUTH_Y = 14;

/** The brass key on its back, centred at (bx, by): `key` 0 broadside, 1 edge on, 2 three quarters. */
function windKey(p: Paint, bx: number, by: number, key: number): void {
  // The shaft into its back.
  p.rect(bx + 1, by, 4, 2, 'laton', 2);
  p.rect(bx + 1, by, 4, 1, 'laton', 1);
  if (key === 1) {
    p.rect(bx, by - 5, 1, 12, 'laton', 1);
    p.px(bx, by - 5, 'laton', 0);
    p.px(bx, by + 6, 'laton', 3);
    return;
  }
  const rx = key === 0 ? 1.9 : 1.1;
  for (const cy of [by - 2.6, by + 3.6]) p.ellipsoid(bx + 0.5, cy, rx, 2.8, 'laton', { dither: 0 });
  if (key === 0) {
    p.px(bx, by - 3, 'laton', 3);
    p.px(bx, by + 3, 'laton', 3);
  }
}

/**
 * The robot. `key` (0-2) turns the key; `mood`: 0 wound up (glaring), 1 run down (eyes half shut,
 * antenna drooping, teeth slack), 2 winding itself up (eyes squeezed shut, shaken `jx` px).
 */
export function makeRobotNuevo(pose: Pose = { xb: ROBOT_LEGS2[0], xf: ROBOT_LEGS2[1], bob: 0 }, key = 0, mood: 0 | 1 | 2 = 0, jx = 0): Canvas {
  const p = new Paint(ROBOT_W, ROBOT_H);
  const b = new Paint(ROBOT_W, ROBOT_H);
  legs(p, pose, 36 + pose.bob, ROBOT_FEET.y, 'rojo');
  glove(b, 5, 25, 'hojalata');
  const x0 = 9;
  const y0 = 14;
  const fw = 22;
  const fh = 22;
  // The antenna: a rod out of the top with a red ball, bent; drooping when it has run down.
  const rod: Array<[number, number]> = mood === 1 ? [[21, 11], [21, 10], [22, 9], [23, 9], [24, 10]] : [[21, 11], [21, 10], [21, 9], [22, 8], [22, 7], [23, 6]];
  for (const [x, y] of rod) b.px(x, y, 'acero', 3);
  if (mood === 1) b.ellipsoid(25.5, 11.5, 1.7, 1.7, 'rojo', { dither: 0, spec: true });
  else b.ellipsoid(24, 5, 1.8, 1.8, 'rojo', { dither: 0, spec: true });
  const { fx } = box34(b, x0, y0, fw, fh, 4, 'hojalata', { top: [0, 1], side: [5, 4], front: [2, 3, 3] });
  // Tin shines: a streak down the lit edge of the front and a glint on the top corner.
  b.rect(fx + 1, y0 + 2, 1, fh - 6, 'hojalata', 2);
  b.rect(fx + 2, y0 + 2, 1, 3, 'hojalata', 2);
  b.raw(x0 + 1, y0 - 4, SHINE);
  b.raw(x0 + 2, y0 - 4, SHINE);
  // The red lithographed band round its bottom, with a yellow pinstripe.
  const band = y0 + fh - 4;
  b.rect(fx, band, fw, 4, 'rojo', 3);
  b.rect(fx, band, fw, 1, 'rojo', 2);
  b.rect(fx, band + 3, fw, 1, 'rojo', 4);
  b.rect(fx + 1, band + 1, fw - 2, 1, 'amarillo', 2);
  for (let i = 0; i < 4; i++) b.rect(x0 + i, band - 4 + i + 1, 1, 3, 'rojo', 4);
  // A seam across the front, where the head was soldered on, with its rivets.
  const seam = band - 2;
  b.rect(fx + 1, seam, fw - 2, 1, 'hojalata', 4);
  for (const x of [fx + 2, fx + fw - 3]) {
    for (const y of [y0 + 2, seam - 2]) {
      b.px(x, y, 'hojalata', 4);
      b.px(x - 1, y - 1, 'hojalata', 0);
    }
  }
  // The dent in the top front corner, and the paint chipped down to the bare tin.
  b.px(fx + fw - 4, y0 + 3, 'hojalata', 4);
  b.px(fx + fw - 3, y0 + 3, 'hojalata', 3);
  b.px(fx + fw - 4, y0 + 4, 'hojalata', 0);
  for (const [x, y] of [[fx + 4, seam - 1], [fx + fw - 6, y0 + 9], [x0 + 6, y0 - 3]] as const) b.px(x, y, 'acero', 1);
  b.px(fx + fw - 2, band + 2, 'oxido', 1);
  // Eyes: the back one small and sour under a heavy lid; the front one a screw head.
  const ey = y0 + 4;
  const ex = fx + 3;
  if (mood === 2) {
    for (const [x, y] of [[0, 1], [1, 2], [2, 2], [3, 1]] as const) b.px(ex + x, ey + y, 'hojalata', 6);
  } else {
    // The socket, the white with the pupil looking at you, and the heavy lid over half of it.
    const lid = mood === 1 ? 3 : 2;
    b.rect(ex, ey, 5, 5, 'hojalata', 6);
    b.rect(ex + 1, ey + 1, 3, 3, 'acero', 1);
    b.rect(ex + 2, ey + 2, 2, 2, 'acero', 6);
    b.raw(ex + 3, ey + 3, INK);
    b.rect(ex, ey, 5, lid, 'hojalata', 3);
    b.rect(ex, ey + lid, 5, 1, 'hojalata', 5);
  }
  const sx = fx + 15.5;
  const sy = ey + 2.5;
  b.ellipsoid(sx, sy, 2.7, 2.7, 'acero', { dither: 0, spec: true });
  // The screw's slot: slanted and glaring; flat when run down; it turns while it winds itself up.
  const flat = [[-1, 0], [0, 0], [1, 0]] as const;
  const upright = [[0, -1], [0, 0], [0, 1]] as const;
  const back = [[-1, -1], [0, 0], [1, 1]] as const;
  const fwd = [[-1, 1], [0, 0], [1, -1]] as const;
  const slot = mood === 1 ? flat : mood === 2 ? (key === 1 ? upright : back) : fwd;
  for (const [x, y] of slot) b.px(Math.floor(sx) + x, Math.floor(sy) + y, 'acero', 6);
  // Brows down to the middle (only when it means it).
  if (mood === 0) {
    const sour = [[-1, 3], [0, 3], [1, 2], [2, 2], [3, 1]] as const;
    const screw = [[12, 1], [13, 2], [14, 2], [15, 3], [16, 3], [17, 3]] as const;
    for (const [x, up] of sour) b.px(ex + x, ey - up, 'hojalata', 6);
    for (const [x, up] of screw) b.px(fx + x, ey - up, 'hojalata', 6);
  }
  // The mouth: a grille of tin teeth, at the height the nuts come out of.
  const my = ROBOT_FEET.y - ROBOT_MOUTH_Y - 1;
  b.rect(fx + 5, my - 1, 12, 4, 'hojalata', 6);
  b.rect(fx + 5, my + 3, 12, 1, 'hojalata', 1);
  for (let x = fx + 6; x <= fx + 15; x += 2) {
    b.rect(x, my - 1, 1, mood === 1 ? 2 : 3, 'acero', 2);
    b.px(x, my - 1, 'acero', 0);
  }
  // Its side: the age label, «3+» scratched to «33+», under the key.
  const ly = y0 + 11;
  b.rect(x0, ly, 4, 4, 'amarillo', 1);
  b.px(x0, ly, 'amarillo', 0);
  for (const [x, y] of [[x0, ly + 1], [x0 + 1, ly + 1], [x0, ly + 2], [x0 + 1, ly + 2]] as const) b.px(x, y, 'goma', 4);
  b.px(x0 + 2, ly + 1, 'oxido', 1);
  b.px(x0 + 2, ly + 2, 'rojo', 3);
  b.px(x0 + 3, ly + 3, 'amarillo', 3);
  // The key, and the strip of plaster holding it on.
  windKey(b, 4, y0 + 4, key);
  for (let i = 0; i < 6; i++) {
    b.px(6 + Math.floor(i / 2), y0 + 1 + i, 'crema', i === 5 ? 2 : 0);
    b.px(7 + Math.floor(i / 2), y0 + 1 + i, 'crema', i % 2 ? 1 : 2);
  }
  glove(b, 35, 27, 'hojalata');
  p.stamp(b, jx, pose.bob);
  const out = p.outline();
  // Winding itself up: two little lines of effort by the key.
  if (mood === 2) {
    for (const [x, y] of [[1, y0 - 3], [2, y0 - 4], [1, y0 + 12], [2, y0 + 13]] as const) if (out.get(x, y)[3] === 0) out.set(x, y, raw('acero', 1));
  }
  return out;
}

/**
 * Its sheet: 0-1 standing (the key ticking over), 2-5 the stiff quick march with the key turning,
 * 6 run down (key still), 7-8 winding itself up (the key spins, it shakes).
 */
export function makeRobotNuevoFrames(): Canvas[] {
  const cyc = narrowPoseCycle(...ROBOT_LEGS2);
  return [
    ...cyc.map((f, k) => makeRobotNuevo(f.pose, k % 3)),
    makeRobotNuevo({ xb: ROBOT_LEGS2[0], xf: ROBOT_LEGS2[1], bob: 1 }, 0, 1),
    makeRobotNuevo(undefined, 1, 2, -1),
    makeRobotNuevo(undefined, 2, 2, 1),
  ];
}

// ---------------------------------------------------------------------------------------------
// The Coche Teledirigido: a cheap purple plastic sports car seen from the side, nose to the right,
// with a bully's face on its front bumper (headlight eyes glaring under heavy brows, the grille a
// grin of teeth). Jokes: a bent antenna, the spoiler held on with tape, a peeling racing stripe
// and a front wheel from another car (smaller, white).

export const COCHE_W = 46;
export const COCHE_H = 30;
/** The row under its wheels, under the middle of the body (EnemyDef.anchor). */
export const COCHE_FEET = { x: 22, y: 28 } as const;

/** A wheel: dark rubber with a tread glint and a hub of `hub` whose spokes turn with `spin`. */
function wheel(p: Paint, cx: number, cy: number, r: number, hub: Material, spin: number): void {
  p.ellipsoid(cx, cy, r, r, 'goma', { dither: 0, bias: -0.15 });
  p.ellipsoid(cx, cy, r - 1.7, r - 1.7, hub, { dither: 0, spec: true });
  const c = [Math.floor(cx), Math.floor(cy)] as const;
  const spokes = spin === 0 ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  for (const [x, y] of spokes) p.px(c[0] + x!, c[1] + y!, hub, 4);
  p.px(c[0], c[1], 'goma', 5);
}

/**
 * The car. `spin` (0-1) turns the wheels, `bob` shakes the body on them (its motor); `mood`: 0
 * cruising, 1 revving to ram (eyes red, mouth open, smoke out of the back), 2 overturned (upside
 * down on its roof, dizzy), 3 batteries out (lights dead, the low battery sign over its roof).
 */
export function makeCocheNuevo(spin = 0, bob = 0, mood: 0 | 1 | 2 | 3 = 0): Canvas {
  const p = new Paint(COCHE_W, COCHE_H);
  const y = bob;
  // The bent antenna out of the back of the roof, a red tip on it.
  for (const [x, yy] of [[14, 7], [13, 6], [13, 5], [12, 4], [11, 3], [10, 3], [9, 2]] as const) p.px(x, yy + y, 'goma', 2);
  p.px(8, 2 + y, 'rojo', 1);
  // The spoiler on its post at the back, held on with tape.
  p.rect(5, 10 + y, 2, 5, 'violeta', 4);
  p.rect(1, 8 + y, 9, 2, 'violeta', 2);
  p.rect(1, 8 + y, 9, 1, 'violeta', 1);
  p.px(1, 8 + y, 'violeta', 0);
  p.rect(4, 11 + y, 4, 2, 'crema', 0);
  p.px(7, 12 + y, 'crema', 2);
  p.px(3, 12 + y, 'crema', 1);
  // The cabin: the roof and the dark windows, the windscreen raked back, a glint across the glass.
  for (let r = 0; r < 6; r++) {
    const xa = 13 + (r < 2 ? 2 - r : 0);
    const xb = 27 + Math.min(r, 4);
    if (r < 2) p.rect(xa, 7 + r + y, xb - xa + 1, 1, 'violeta', r === 0 ? 0 : 1);
    else {
      p.rect(xa, 7 + r + y, xb - xa + 1, 1, 'azul', 5);
      p.px(xb, 7 + r + y, 'violeta', 2);
    }
  }
  p.rect(21, 9 + y, 1, 4, 'violeta', 3);
  for (const [x, yy] of [[16, 9], [17, 9], [15, 10], [24, 10], [25, 9], [23, 11]] as const) p.px(x, yy + y, 'azul', 2);
  // The hood and the deck along the top.
  p.rect(3, 13 + y, 33, 2, 'violeta', 1);
  p.rect(3, 13 + y, 33, 1, 'violeta', 0);
  p.rect(32, 13 + y, 11, 2, 'violeta', 1);
  p.rect(32, 13 + y, 10, 1, 'violeta', 0);
  // The long side, lit along the top, darker down to the sill.
  for (let r = 0; r < 9; r++) p.rect(2, 15 + r + y, 34, 1, 'violeta', r === 0 ? 1 : r < 6 ? 2 : r < 8 ? 3 : 4);
  // The bumper at the front: the face of the car, a step darker (it faces away from the light).
  for (let r = 0; r < 9; r++) p.rect(36, 15 + r + y, 8, 1, 'violeta', r === 0 ? 2 : r < 7 ? 3 : 4);
  p.erase(43, 23 + y);
  p.erase(2, 23 + y);
  // The door seam and the racing stripe, peeling at the back.
  p.rect(22, 15 + y, 1, 6, 'violeta', 4);
  p.rect(7, 18 + y, 28, 1, 'amarillo', 1);
  p.rect(13, 18 + y, 2, 1, 'violeta', 2);
  p.px(6, 19 + y, 'amarillo', 2);
  p.px(5, 20 + y, 'amarillo', 3);
  // A scuff on the side.
  p.px(28, 20 + y, 'violeta', 0);
  p.px(29, 20 + y, 'violeta', 4);
  // Its face on the bumper: headlight eyes under heavy brows, a grille of teeth.
  const fx = 36;
  if (mood === 2) {
    for (const ex of [fx + 1, fx + 5]) for (const [x, yy] of [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]] as const) p.raw(ex + x, 16 + yy + y, INK);
  } else {
    const eye: Material = mood === 1 ? 'rojo' : mood === 3 ? 'goma' : 'amarillo';
    for (const ex of [fx + 1, fx + 5]) {
      p.rect(ex, 17 + y, 3, 2, eye, mood === 3 ? 3 : 1);
      p.raw(ex + 2, 18 + y, INK);
      if (mood !== 3) p.raw(ex, 17 + y, SHINE);
    }
    const low = mood === 1 ? 1 : 0;
    const brows = [[fx, 15], [fx + 1, 15], [fx + 2, 16 + low], [fx + 3, 16 + low], [fx + 5, 16 + low], [fx + 6, 15], [fx + 7, 15]] as const;
    for (const [x, yy] of brows) p.px(x, yy + y, 'violeta', 6);
  }
  const mh = mood === 1 ? 2 : 1;
  p.rect(fx + 1, 20 + y, 6, mh + 1, 'violeta', 6);
  for (let x = fx + 1; x <= fx + 6; x += 2) p.rect(x, 20 + y, 1, mh, 'acero', 1);
  // Wheels: its own at the back, a smaller white one from another car at the front.
  wheel(p, 11.5, 23.5, 4.5, 'acero', spin);
  wheel(p, 35.5, 24.5, 3.5, 'crema', spin);
  let out = p.outline();
  if (mood === 1) {
    // Smoke out of the back while it revs.
    for (const [x, yy, a] of [[1, 20, 170], [0, 19, 120], [1, 18, 90], [0, 21, 140]] as const) if (out.get(x, yy)[3] === 0) out.set(x, yy, [215, 210, 225, a]);
  }
  if (mood === 3) {
    // The low battery sign over the roof: a little battery with one red bar.
    const bx = 31;
    const by = 1;
    for (let i = 0; i < 6; i++) {
      out.set(bx + i, by, INK);
      out.set(bx + i, by + 4, INK);
    }
    for (let j = 0; j < 5; j++) {
      out.set(bx, by + j, INK);
      out.set(bx + 5, by + j, INK);
    }
    out.set(bx + 6, by + 2, INK);
    for (let j = 1; j < 4; j++) for (let i = 1; i < 5; i++) out.set(bx + i, by + j, i === 1 ? raw('rojo', 2) : raw('acero', 1));
  }
  if (mood === 2) {
    // Overturned: upside down, resting on its roof on the floor.
    const flipped = new Canvas(COCHE_W, COCHE_H);
    let low = 0;
    for (let j = 0; j < COCHE_H; j++) {
      for (let i = 0; i < COCHE_W; i++) {
        const c = out.get(i, j);
        flipped.set(i, COCHE_H - 1 - j, c);
        if (c[3] > 0) low = Math.max(low, COCHE_H - 1 - j);
      }
    }
    out = new Canvas(COCHE_W, COCHE_H);
    out.blit(flipped, 0, COCHE_FEET.y - low);
  }
  return out;
}

/** Its sheet: 0-1 idling (the motor shakes it), 2-3 driving, 4 revving to ram, 5 overturned, 6 batteries out. */
export function makeCocheNuevoFrames(): Canvas[] {
  return [makeCocheNuevo(0, 0), makeCocheNuevo(0, 1), makeCocheNuevo(1, 0), makeCocheNuevo(0, 1), makeCocheNuevo(0, 0, 1), makeCocheNuevo(0, 0, 2), makeCocheNuevo(0, 0, 3)];
}
