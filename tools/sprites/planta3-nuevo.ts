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
export function box34(p: Paint, x0: number, y0: number, fw: number, fh: number, depth: number, m: Material, tones = { top: [0, 1], side: [4, 3], front: [1, 2, 3] }): { fx: number; fy: number } {
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

// ---------------------------------------------------------------------------------------------
// The Cubo de Piezas: a red plastic bucket of building pieces, wider at the top, its yellow studded
// lid worn as a cap with the peak to the right and its wire handle down under the chin as the
// cap's strap. Its eyes are two round white pieces; a wrong green piece that fits nothing is stuck
// on its forehead. Jokes: the «1000+» sticker, a crack mended with a plaster, the shoes two blue
// bricks. With the lid up (about to throw) a fistful of pieces shows inside and it glares.

export const CUBO_W = 40;
export const CUBO_H = 42;
export const CUBO_FEET = { x: 19, y: 40 } as const;
export const CUBO_LEGS2 = [13, 19] as const;
/** The rim, px above its feet (muzzleY): the pieces fly out of the bucket from here. */
export const CUBO_RIM_Y = 26;

/** `lid`: px the lid is lifted (0 worn as a cap; up, the pieces show and it glares). */
export function makeCuboNuevo(pose: Pose = { xb: CUBO_LEGS2[0], xf: CUBO_LEGS2[1], bob: 0 }, lid = 0): Canvas {
  const p = new Paint(CUBO_W, CUBO_H);
  const d = pose.bob;
  legs(p, pose, 34 + d, CUBO_FEET.y, 'azul');
  // The shoes are bricks: two studs on each.
  for (const [x, leg] of [[pose.xb, -1], [pose.xf, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = CUBO_FEET.y - 3 - up;
    p.px(x + 1, yb - 1, 'azul', 2);
    p.px(x + 3, yb - 1, 'azul', 2);
  }
  glove(p, 1, 22 + d, 'amarillo');
  // The bucket: a cone cut short, from the rim down, shaded as a cylinder that narrows.
  const rim = CUBO_FEET.y - CUBO_RIM_Y - 1 + d;
  const cx = 18.5;
  const bottom = 33 + d;
  const half = (y: number): number => 12.5 - ((y - rim) / (bottom - rim)) * 3.5;
  p.heightShade(0, rim + 1, CUBO_W, bottom - rim, (x, y) => {
    if (y < rim + 1 || y > bottom) return null;
    const u = (x + 0.5 - cx) / half(y);
    return Math.abs(u) > 1 ? null : 9 * Math.sqrt(1 - u * u);
  }, 'rojo', { z: 1.4, dither: 0.12, spec: true });
  // The rim: a lip one px wider all round, lighter on top.
  p.rect(Math.floor(cx - 13.5), rim, 28, 2, 'rojo', 1);
  p.rect(Math.floor(cx - 13.5), rim + 1, 28, 1, 'rojo', 3);
  p.px(Math.floor(cx - 13.5), rim, 'rojo', 3);
  // The bottom edge in shadow.
  p.rect(Math.ceil(cx - 9), bottom, 18, 1, 'rojo', 4);
  // Inside, with the lid up: a dark mouth and a fistful of pieces of every colour.
  if (lid > 0) {
    p.rect(Math.floor(cx - 12), rim - 1, 25, 1, 'rojo', 5);
    const bits: Array<[number, Material]> = [[7, 'azul'], [10, 'amarillo'], [13, 'verde'], [17, 'azul'], [21, 'amarillo'], [25, 'verde'], [28, 'azul']];
    for (const [i, [x, m]] of bits.entries()) {
      const y = rim - 2 - (i % 2);
      p.rect(x, y, 3, 2, m, 2);
      p.px(x, y, m, 0);
      p.px(x + 2, y + 1, m, 4);
    }
  }
  // The lid, worn as a cap: a flat yellow disc seen from above, its front edge, the peak to the right.
  const ly = rim - 4 - lid;
  p.ellipsoid(cx, ly, 14, 3.2, 'amarillo', { z: 0.4, dither: 0, bias: 0.15 });
  p.rect(Math.floor(cx - 13), ly + 2, 27, 2, 'amarillo', 3);
  p.rect(Math.floor(cx - 13), ly + 3, 27, 1, 'amarillo', 4);
  for (let i = 0; i < 6; i++) p.rect(31 + i, ly + 1 + Math.floor(i / 3), 1, 2, 'amarillo', i < 3 ? 2 : 3);
  // Four studs on top, in a row going back.
  for (const sx of [10, 15, 21, 26]) {
    p.rect(sx, ly - 2, 3, 2, 'amarillo', 2);
    p.rect(sx, ly - 2, 3, 1, 'amarillo', 1);
    p.px(sx, ly - 2, 'amarillo', 0);
    p.px(sx + 2, ly - 1, 'amarillo', 4);
  }
  // The wrong piece on its forehead: a green brick stuck on askew, its two studs out of line.
  const gy = rim + 3;
  p.rect(21, gy, 6, 3, 'verde', 2);
  p.rect(21, gy + 2, 6, 1, 'verde', 4);
  p.px(22, gy - 1, 'verde', 1);
  p.px(25, gy - 1, 'verde', 1);
  p.px(21, gy, 'verde', 1);
  p.px(20, gy + 2, 'verde', 5);
  // Eyes: two round white pieces with dark centres, looking right; heavy brows.
  const ey = rim + 8;
  for (const ex of [17, 24]) {
    p.ellipsoid(ex + 1.5, ey + 1.5, 2.2, 2.2, 'acero', { dither: 0, bias: 0.3 });
    p.raw(ex + 2, ey + 1, INK);
    p.raw(ex + 2, ey + 2, INK);
    p.raw(ex + 1, ey + 2, INK);
  }
  const brows = lid > 0 ? [[15, 2], [16, 2], [17, 1], [18, 1], [19, 0], [23, 0], [24, 1], [25, 1], [26, 2], [27, 2]] : [[16, 1], [17, 1], [18, 1], [19, 1], [24, 1], [25, 1], [26, 1], [27, 1]];
  for (const [x, up] of brows) p.px(x!, ey - 1 - up!, 'rojo', 5);
  // Mouth: tight and sour, pulled down at the back (open when it throws).
  const my = ey + 6;
  p.rect(21, my, 4, lid > 0 ? 2 : 1, 'rojo', 5);
  p.px(20, my + 1, 'rojo', 5);
  if (lid > 0) p.px(22, my + 1, 'acero', 1);
  // The handle, down round the chin as the cap's strap: wire from the rim to under the mouth.
  const strap = [[6, 0], [7, 3], [8, 6], [9, 9], [10, 11], [11, 13], [12, 14], [13, 15], [14, 16], [15, 16]] as const;
  for (const [x, dy] of strap) p.px(x, rim + 2 + dy, 'acero', 2);
  for (const [x, dy] of [[26, 16], [27, 15], [28, 13], [29, 10], [30, 6], [31, 2]] as const) p.px(x, rim + 2 + dy, 'acero', 3);
  p.rect(16, rim + 18, 10, 1, 'acero', 2);
  p.px(16, rim + 18, 'acero', 1);
  // Its back: the «1000+» sticker (white, a red burst), and the plaster over a crack at the front.
  p.rect(9, rim + 5, 5, 4, 'acero', 0);
  p.px(10, rim + 6, 'rojo', 2);
  p.px(11, rim + 6, 'rojo', 2);
  p.px(11, rim + 7, 'rojo', 3);
  p.px(13, rim + 8, 'acero', 2);
  for (let i = 0; i < 4; i++) p.px(26 + i, bottom - 6 + i, 'crema', i % 2 ? 1 : 0);
  for (let i = 0; i < 4; i++) p.px(27 + i, bottom - 6 + i, 'crema', 2);
  p.px(25, bottom - 4, 'rojo', 5);
  glove(p, 33, (lid > 0 ? rim - 2 : rim + 9), 'amarillo');
  return p.outline();
}

/** Its sheet: 0-1 standing, 2-5 a heavy waddle, 6 the lid up (about to throw). */
export function makeCuboNuevoFrames(): Canvas[] {
  return [...narrowPoseCycle(CUBO_LEGS2[0], CUBO_LEGS2[1], 1).map((f) => makeCuboNuevo(f.pose)), makeCuboNuevo(undefined, 4)];
}

// ---------------------------------------------------------------------------------------------
// The Sobre Sorpresa: a sealed foil packet of collectable stickers, crimped at the top and bottom,
// a big yellow star with a «?» on its front and a greedy face. Jokes: the dotted «tear here» line
// with its little scissors, and the side covered in tiny print (the odds). It hops.

export const SOBRE_W = 34;
export const SOBRE_H = 40;
export const SOBRE_FEET = { x: 17, y: 38 } as const;
/** Its mouth, px above its feet (muzzleY): the confetti comes out of here. */
export const SOBRE_MOUTH_Y = 12;

/**
 * `squash` crouching to hop (shorter and wider); `air` the legs tucked up in a hop; `puff` cheeks
 * blown out and the mouth open full of confetti (about to spit); `jx` shakes it (impatience).
 */
export function makeSobreNuevo(squash = 0, air = false, puff = false, jx = 0): Canvas {
  const p = new Paint(SOBRE_W, SOBRE_H);
  const F = SOBRE_FEET;
  if (air) {
    for (const [x, t] of [[12, 3], [18, 2]] as const) {
      p.rect(x, F.y - 6, 5, 2, 'rojo', t);
      p.rect(x, F.y - 4, 5, 1, 'acero', t - 1);
    }
  } else legs(p, { xb: 12, xf: 18, bob: 0 }, 33, F.y, 'rojo');
  const b = new Paint(SOBRE_W, SOBRE_H);
  const top = 3 + squash * 3;
  const bot = 32;
  const x0 = 8 - squash;
  const x1 = 25 + squash;
  // The packet: a thin side face on the left, the foil front crinkled with diagonal glints.
  for (let y = top; y <= bot; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x < x0 + 2) b.px(x, y, 'fucsia', x === x0 ? 5 : 4);
      else {
        const g = (x - y + 40) % 11;
        const t = g === 0 ? 1 : g === 1 || g === 6 ? 2 : x > x1 - 2 || y > bot - 4 ? 4 : 3;
        b.px(x, y, 'fucsia', t);
      }
    }
  }
  // The crimps, top and bottom: a zigzag of foil.
  for (let x = x0; x <= x1; x++) {
    const odd = (x - x0) % 2;
    b.px(x, top, 'fucsia', odd ? 3 : 0);
    b.px(x, top + 1, 'fucsia', odd ? 1 : 3);
    b.px(x, bot - 1, 'fucsia', odd ? 2 : 4);
    b.px(x, bot, 'fucsia', odd ? 4 : 2);
  }
  // The crimps' teeth stick out of the silhouette.
  for (let x = x0; x <= x1; x += 2) {
    b.erase(x, top);
    b.erase(x + 1, bot);
  }
  // «Tear here»: a dotted line under the crimp, with the scissors at its start.
  for (let x = x0 + 7; x < x1; x += 2) b.px(x, top + 3, 'acero', 1);
  for (const [x, y] of [[x0 + 3, top + 2], [x0 + 4, top + 3], [x0 + 3, top + 4], [x0 + 5, top + 3]] as const) b.px(x, y, 'acero', 1);
  // Tiny print down the side (the odds, unreadable).
  for (let y = top + 4; y < bot - 2; y += 2) b.px(x0 + 1, y, 'fucsia', 2);
  // Its face: greedy eyes under brows that go down to the middle.
  const my = F.y - SOBRE_MOUTH_Y - 1 + Math.max(0, squash);
  const ey = my - 7;
  for (const ex of [13, 20]) {
    b.rect(ex, ey, 3, 4, 'fucsia', 5);
    b.rect(ex, ey + 1, 2, 2, 'acero', 0);
    b.raw(ex + 2, ey + 1, INK);
    b.raw(ex + 2, ey + 2, INK);
    b.raw(ex + 1, ey + 2, INK);
    b.raw(ex, ey + 1, SHINE);
  }
  for (const [x, up] of [[12, 2], [13, 2], [14, 1], [15, 1], [19, 1], [20, 1], [21, 2], [22, 2], [23, 2]] as const) b.px(x, ey - up, 'fucsia', 5);
  // The mouth, at the height it spits from: a greedy grin, or puffed and open, full of confetti.
  if (puff) {
    b.rect(14, my - 1, 9, 4, 'fucsia', 5);
    for (const [x, y, m] of [[15, my, 'amarillo'], [17, my + 1, 'cian'], [19, my, 'rojo'], [21, my + 1, 'verde'], [18, my - 1, 'acero']] as const) b.px(x, y, m, 1);
    b.px(12, my, 'fucsia', 1);
    b.px(24, my, 'fucsia', 1);
  } else {
    b.rect(15, my, 7, 1, 'fucsia', 5);
    b.px(14, my - 1, 'fucsia', 5);
    b.px(22, my - 1, 'fucsia', 5);
    for (const x of [16, 18, 20]) b.px(x, my, 'acero', 0);
  }
  // The star in its top corner, a «?» in it. Rows of the star: [dy, from dx, to dx], with a gap
  // between the two legs.
  const sx = 13;
  const sy = top + 7;
  const rows = [[-3, 0, 0], [-2, -1, 1], [-1, -3, 3], [0, -2, 2], [1, -2, 2], [2, -2, 2]] as const;
  for (const [y, a, z] of rows) {
    for (let x = a; x <= z; x++) if (!(y === 1 && x === 0) && !(y === 2 && Math.abs(x) < 2)) b.px(sx + x, sy + y, 'amarillo', y < -1 ? 0 : y > 0 ? 2 : 1);
  }
  for (const [x, y] of [[-1, -1], [0, -1], [0, 0], [0, 1]] as const) b.px(sx + x, sy + y, 'amarillo', 4);
  // The small print along the bottom (the odds again, in case).
  for (const [x, y, w] of [[x0 + 4, bot - 4, 4], [x0 + 9, bot - 4, 6], [x0 + 4, bot - 3, 7], [x0 + 12, bot - 3, 3]] as const) b.rect(x, y, w, 1, 'fucsia', 4);
  glove(b, x0 - 5, 17 + squash, 'rosa');
  glove(b, x1 + 1, 18 + squash, 'rosa');
  p.stamp(b, jx, 0);
  return p.outline();
}

/** Its sheet: 0-1 standing (it trembles with impatience), 2 crouching, 3 in the air, 4 about to spit confetti. */
export function makeSobreNuevoFrames(): Canvas[] {
  return [makeSobreNuevo(), makeSobreNuevo(0, false, false, 1), makeSobreNuevo(1), makeSobreNuevo(0, true), makeSobreNuevo(0, false, true)];
}

// ---------------------------------------------------------------------------------------------
// M14c (a6b2): the building pieces the bucket throws, lying on the floor, and the figurines that
// come out of the envelope, in the new style.

export const PIEZA_W = 12;
export const PIEZA_H = 10;

/**
 * A building piece seen from the front and above, as it lies on the floor waiting for a bare
 * foot: `cols` x `rows` studs (3 px a stud, 2 px of top per row), a 3 px front face and a 1 px
 * side face on the right, each stud a little dome lit at its top-left. `skip`: an empty cell (the
 * corner piece). Painted from the back row to the front, so the front ones cover the back ones.
 */
function brick(cols: number, rows: number, m: Material, skip?: readonly [number, number]): Canvas {
  const p = new Paint(PIEZA_W, PIEZA_H);
  const U = 3;
  const D = 2;
  const F = 3;
  const ox = Math.floor((PIEZA_W - cols * U - 1) / 2);
  const oy = Math.floor((PIEZA_H - rows * D - F) / 2);
  const has = (c: number, r: number): boolean => c >= 0 && r >= 0 && c < cols && r < rows && !(skip && skip[0] === c && skip[1] === r);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!has(c, r)) continue;
      const x = ox + c * U;
      const y = oy + r * D;
      // The top, and its stud.
      p.rect(x, y, U, D, m, 2);
      p.px(x, y, m, 0);
      p.px(x + 1, y, m, 1);
      p.px(x + 1, y + 1, m, 3);
      // The front face, if nothing stands in front of this cell: lit edge, body, shadow at the floor.
      if (!has(c, r + 1)) {
        p.rect(x, y + D, U, F, m, 3);
        p.rect(x, y + D, U, 1, m, 2);
        p.rect(x, y + D + F - 1, U, 1, m, 4);
        if (c === 0 || !has(c - 1, r + 1)) p.px(x, y + D + 1, m, 2);
      }
      // The side face on the right, if nothing stands to its right.
      if (!has(c + 1, r)) {
        const deep = has(c, r + 1) ? D : D + F;
        p.rect(x + U, y + 1, 1, deep - 1, m, 4);
        p.px(x + U, y + deep - 1, m, 5);
      }
    }
  }
  return p.outline();
}

/** The four pieces (frames of `pieza`, BRICK_KINDS): a red 2x2, a blue 3x1, a yellow 2x1 and a green corner. */
export function makePiezasNuevas(): Canvas[] {
  return [brick(2, 2, 'rojo'), brick(3, 1, 'azul'), brick(2, 1, 'amarillo'), brick(2, 2, 'verde', [1, 0])];
}

// The Muñequito Repetido: a little mass-produced vinyl figure, nearly all head, the mould seam down
// the side of its face, the smile printed out of register (the red ink a pixel off its mouth) and a
// «x3» sticker on its chest: you have it three times already. The Muñequito Dorado Ultrarraro is the
// same mould in gold: shiny, smug, a star where the sticker goes and a sparkle on its head.

export const MUNE_W = 24;
export const MUNE_H = 28;
export const MUNE_FEET = { x: 12, y: 26 } as const;
export const MUNE_LEGS2 = [9, 13] as const;
/** Where the gold one's rings come from, px above its feet (its muzzleY): the star on its chest. */
export const MUNE_CHEST_Y = 10;

/** `gold` the ultra-rare one; `bite` the mouth wide open (about to bite, the plain ones). */
export function makeMunequitoNuevo(pose: Pose = { xb: MUNE_LEGS2[0], xf: MUNE_LEGS2[1], bob: 0 }, gold = false, bite = false): Canvas {
  const skin: Material = gold ? 'amarillo' : 'carton';
  const cloth: Material = gold ? 'amarillo' : 'turquesa';
  const p = new Paint(MUNE_W, MUNE_H);
  const F = MUNE_FEET;
  const d = pose.bob;
  // Stubby moulded legs and feet, all one piece with the trousers (no laces on a figurine).
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = F.y - 2 - up;
    const top = 21 + d;
    p.rect(x, top, 2, Math.max(1, yb - top), cloth, back ? 4 : 3);
    p.rect(x, yb, 4, 2, gold ? 'amarillo' : 'goma', back ? 3 : 2);
    p.px(x + 1, yb, gold ? 'amarillo' : 'goma', back ? 2 : 1);
  }
  const b = new Paint(MUNE_W, MUNE_H);
  // The body: a small painted block, a dome lit at the top left.
  b.ellipsoid(12.5, 18.4, 4.6, 3.4, cloth, { dither: 0.2, z: 0.8, spec: gold });
  // Stubby arms: two nubs of vinyl, no fingers (the mould saved on fingers).
  b.ellipsoid(7.2, 18.8, 1.7, 1.7, skin, { dither: 0, bias: 0.15 });
  b.ellipsoid(18, 18, 1.7, 1.7, skin, { dither: 0, bias: 0.15 });
  // The head: a big rounded square of vinyl (a superellipse), lit at the top left.
  const hx = 12.5;
  const hy = 7.4;
  b.heightShade(2, 0, 21, 16, (x, y) => {
    const u = Math.abs((x + 0.5 - hx) / 8.6);
    const v = Math.abs((y + 0.5 - hy) / 6.9);
    const s = u ** 3 + v ** 3;
    return s > 1 ? null : 6 * Math.sqrt(1 - s);
  }, skin, { z: gold ? 0.9 : 1.6, dither: 0, spec: gold, bias: gold ? -0.05 : 0.2 });
  // The chest, right under the chin and at its muzzleY: the «x3» sticker (white, red print), or
  // the gold one's star.
  const cy = F.y - MUNE_CHEST_Y - 1;
  if (gold) {
    for (const [x, y] of [[13, cy - 1], [12, cy], [13, cy], [14, cy], [13, cy + 1]] as const) b.raw(x, y, SHINE);
    b.px(12, cy + 1, 'amarillo', 4);
    b.px(14, cy + 1, 'amarillo', 4);
  } else {
    b.rect(11, cy, 5, 3, 'acero', 0);
    b.px(15, cy + 2, 'acero', 2);
    for (const [x, y] of [[11, cy], [12, cy + 1], [11, cy + 2], [13, cy + 2], [14, cy], [14, cy + 1], [14, cy + 2]] as const) b.px(x, y, 'rojo', 3);
  }
  // Painted hair: a flat cap of brown, deeper at the back of the head (on the left) with a jagged
  // fringe; on the gold one, the same shape one tone down (it is all one cast) and a sparkle.
  const fringe = [8, 8, 7, 6, 6, 5, 4, 4, 4, 3, 3, 4, 3, 3, 3, 3, 3];
  for (const [i, n] of fringe.entries()) {
    const x = 4 + i;
    for (let y = 0; y < n; y++) {
      if (!b.filled(x, y)) continue;
      const t = y <= 1 && x > 6 ? 0 : x < 6 ? 2 : 1;
      if (gold) b.px(x, y, 'amarillo', t + 1);
      else b.px(x, y, 'quemada', t);
    }
    // The hair's shadow on the forehead.
    if (!gold && b.filled(x, n) && x > 5) b.px(x, n, 'carton', 2);
  }
  if (gold) {
    for (const [x, y] of [[8, 1], [7, 2], [8, 2], [9, 2], [8, 3]] as const) b.raw(x, y, SHINE);
  } else {
    b.px(10, 1, 'quemada', 0);
    b.px(11, 1, 'carton', 1);
  }
  // The mould seam down the side of its head.
  for (let y = 7; y <= 13; y += 2) b.px(5, y, skin, 3);
  // Eyes, looking right: two black dots with a glint (plain), or half shut and smug (gold), under
  // brows that slope down to the middle.
  const ey = 8;
  for (const ex of [12, 17]) {
    b.raw(ex, ey, INK);
    b.raw(ex + 1, ey, INK);
    b.raw(ex, ey + 1, INK);
    b.raw(ex + 1, ey + 1, INK);
    if (gold) {
      b.px(ex, ey, skin, 3);
      b.px(ex + 1, ey, skin, 3);
    } else b.px(ex, ey, 'acero', 0);
  }
  const brows = gold ? [[11, 6], [12, 6], [13, 6], [17, 6], [18, 6], [19, 6]] : [[11, 6], [12, 6], [13, 7], [16, 7], [17, 6], [18, 6]];
  for (const [x, y] of brows) b.px(x!, y!, gold ? 'amarillo' : 'quemada', gold ? 5 : 3);
  // Mouth: the hole of the mould, and the red smile printed a pixel off it (cheap printing);
  // wide open to bite; on the gold one, a smirk.
  const my = 12;
  if (bite) {
    b.rect(13, my, 5, 3, skin, 5);
    b.raw(13, my, INK);
    b.px(14, my, 'acero', 0);
    b.px(16, my, 'acero', 0);
    b.px(15, my + 2, 'rojo', 3);
  } else if (gold) {
    b.rect(14, my, 3, 1, 'amarillo', 5);
    b.px(17, my - 1, 'amarillo', 5);
  } else {
    b.rect(14, my, 3, 1, skin, 4);
    for (const [x, y] of [[12, my], [13, my + 1], [14, my + 1], [15, my + 1], [16, my]] as const) b.px(x, y, 'rojo', 2);
  }
  // A blush of cheap paint on the cheek (the plain ones).
  if (!gold) b.px(19, 11, 'rosa', 2);
  p.stamp(b, 0, d);
  return p.outline();
}

/** The figurines' frames: 0-1 standing, 2-5 running, 6 biting (the plain ones only). */
export function makeMunequitoNuevoFrames(gold: boolean): Canvas[] {
  const cyc = narrowPoseCycle(MUNE_LEGS2[0], MUNE_LEGS2[1], 1).map((f) => makeMunequitoNuevo(f.pose, gold));
  return gold ? cyc : [...cyc, makeMunequitoNuevo(undefined, false, true)];
}
