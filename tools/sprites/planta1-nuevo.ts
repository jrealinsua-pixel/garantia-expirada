// M14c (a5): the plant 1 enemies redrawn in the new style (docs/ESTILO_ARTE.md, «M14c · El
// estilo nuevo»), with the painting tools of src/art/pintor.ts. The old makers stay in
// characters.ts: art/referencia/ keeps the approved old sprites as history (tests/sprites.test.ts).
//
// Every enemy here is drawn on its own canvas with the legs on the floor and everything above
// them moved by the pose's `bob`, like the old ones (tools/sprites/pose.ts); the frames and their
// order are the ones its `anim` names in src/data/enemies.ts. No floor shadow is baked in: the
// game draws its own under every enemy.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { narrowPoseCycle, poseCycle, type Pose } from './pose.ts';

/** Glove: a small shaded ball, the hands float (no arms). */
function glove(p: Paint, x: number, y: number, m: Material): void {
  p.ellipsoid(x + 2, y + 2, 2.2, 2.2, m, { dither: 0 });
}

/**
 * Short legs and sneakers, the soles on row `floor` - 1 whatever the bob: the legs start at
 * `top` (the body's underside, already moved by the bob) and grow or shrink to reach the floor.
 * A lifted foot (pose.lift) is drawn `px` off the floor with a shorter leg.
 */
function legs(p: Paint, pose: Pose, top: number, floor: number, shoe: Material): void {
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 1, top, 2, L, 'goma', back ? 4 : 2);
    p.px(x + 1, top, 'goma', back ? 5 : 3);
    p.px(x + 2, top + L - 1, 'goma', back ? 3 : 1);
    const sw = back ? 5 : 6;
    p.rect(x, yb, sw, 2, shoe, back ? 3 : 2);
    p.rect(x + 1, yb, sw - 2, 1, shoe, back ? 2 : 1);
    p.px(x + sw - 2, yb, shoe, back ? 1 : 0);
    p.rect(x, yb + 2, sw, 1, 'acero', back ? 3 : 1);
    p.px(x + 2, yb, 'acero', back ? 2 : 0);
  }
}

// ---------------------------------------------------------------------------------------------
// The Aspirador Desahuciado (from art/prueba/aspirador.png, M14c (a1))

export const ASPIRADOR_W = 42;
export const ASPIRADOR_H = 40;
/** Where its feet are in the frame (EnemyDef.anchor): the row under the soles. */
export const ASPIRADOR_FEET = { x: 19, y: 38 } as const;
/** Rest leg positions (back, front): set close, so it walks with `narrowPoseCycle`. */
export const ASPIRADOR_LEGS2 = [12, 19] as const;

/**
 * The vacuum in a pose. `rev` is its warning before a charge: the eye flares white-hot, it leans
 * back on its heels and spits dust from under the wheels. `spin` turns the wheels (0–3).
 */
export function makeAspiradorNuevo(pose: Pose = { xb: ASPIRADOR_LEGS2[0], xf: ASPIRADOR_LEGS2[1], bob: 0 }, spin = 0, rev = false): Canvas {
  const W = ASPIRADOR_W;
  const p = new Paint(W, ASPIRADOR_H);
  const d = pose.bob + (rev ? 1 : 0);
  // Leaning back while it revs: the top half one px further back.
  const lean = (y: number): number => (rev && y < 18 ? -1 : 0);
  // Hose behind: from the body's front, an arc down to the nozzle on the floor; it sways with the body.
  const hose: Array<[number, number]> = [[31, 18], [33, 19], [34, 20], [35, 22], [35, 24], [35, 26], [34, 28], [34, 30], [33, 32]];
  for (const [i, [x, y]] of hose.entries()) {
    const yy = y + Math.round((d * (hose.length - 1 - i)) / (hose.length - 1));
    p.rect(x, yy, 2, 2, 'acero', i % 2 ? 2 : 4);
    p.px(x, yy, 'acero', i % 2 ? 1 : 3);
  }
  glove(p, 4 + lean(0), 22 + d, 'azul');
  legs(p, pose, 31 + d, 38, 'azul');
  // Wheels peeking under the body; the hub's notch goes round.
  for (const wx of [9, 27]) {
    p.ellipsoid(wx, 30 + d, 2, 2, 'goma', { dither: 0 });
    const [nx, ny] = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const)[spin & 3]!;
    p.px(wx - 1 + (nx > 0 ? 1 : 0) + (nx < 0 ? -1 : 0), 29 + d + (ny > 0 ? 1 : 0) + (ny < 0 ? -1 : 0), 'goma', 5);
  }
  // Canister body: a fat lying capsule, shaded as an ellipsoid; the handle on top.
  const top = 2 + d;
  const l = lean(0);
  p.rect(14 + l, top, 10, 2, 'goma', 2);
  p.rect(14 + l, top, 10, 1, 'goma', 0);
  p.rect(14 + l, top, 2, 6, 'goma', 2);
  p.rect(22 + l, top, 2, 6, 'goma', 3);
  p.ellipsoid(19, 18 + d, 15, 12, 'azul', { z: 0.85, dither: 0.25, spec: true, bias: 0.2 });
  // A darker band round the middle (where the two shells close) with screws.
  const band = (x: number): number => Math.round(18 + d + 7 * Math.sqrt(Math.max(0, 1 - ((x + 0.5 - 19) / 15) ** 2)));
  for (let x = 5; x <= 33; x++) {
    const by = band(x);
    if (p.filled(x, by)) p.px(x, by, 'azul', 5);
    if (p.filled(x, by + 1)) p.px(x, by + 1, 'azul', x < 19 ? 3 : 4);
  }
  for (const sx of [10, 28]) p.px(sx, band(sx) - 1, 'acero', 1);
  // The dust window on the side, stuffed with the bag (brown, grubby).
  const wy = 15 + d;
  p.rect(8, wy, 6, 7, 'azul', 6);
  p.rect(9, wy + 1, 4, 5, 'quemada', 0);
  p.px(9, wy + 1, 'tostada', 3);
  p.px(11, wy + 3, 'quemada', 1);
  p.px(12, wy + 4, 'quemada', 1);
  p.px(10, wy + 5, 'oxido', 2);
  p.px(12, wy + 1, 'azul', 1);
  // The eye: a big red visor across the front with an angry slanted lid. Revving, it flares.
  const ey = 12 + d;
  const el = lean(0);
  p.rect(18 + el, ey, 14, 7, 'azul', 6);
  for (let x = 19; x < 31; x++) for (let y = ey + 1; y < ey + 6; y++) p.px(x + el, y, 'rojo', rev ? 3 : 4);
  p.ellipsoid(26 + el, ey + 3.5, rev ? 4.8 : 4.2, rev ? 3 : 2.8, rev ? 'amarillo' : 'rojo', { dither: 0, bias: rev ? 0.25 : 0.35 });
  p.rect(25 + el, ey + 3, 2, 1, 'amarillo', rev ? 0 : 1);
  if (rev) p.raw(26 + el, ey + 3, SHINE);
  p.raw(28 + el, ey + 2, SHINE);
  p.raw(29 + el, ey + 2, SHINE);
  p.raw(20 + el, ey + 4, SHINE);
  // The lid, lower and angrier while it revs.
  for (let i = 0; i < 13; i++) p.px(19 + i + el, ey + Math.floor(i / 4) + (rev ? 1 : 0), 'azul', 6);
  for (let i = 0; i < 13; i++) p.px(19 + i + el, ey - 1 + Math.floor(i / 4) + (rev ? 1 : 0), 'azul', 2);
  // Grille mouth (clenched while it revs).
  for (let x = 22; x < 31; x += rev ? 1 : 2) p.px(x, 21 + d, 'azul', 6);
  // Repair tag hanging from the handle: a cream label with a red stripe (the -70 % tag).
  p.px(13 + l, top + 1, 'acero', 3);
  p.px(12 + l, top + 2, 'acero', 3);
  p.rect(7 + l, top + 3, 5, 4, 'acero', 0);
  p.rect(8 + l, top + 4, 3, 1, 'rojo', 2);
  p.px(11 + l, top + 6, 'acero', 2);
  for (const [x, y] of [[30, 9], [7, 21], [16, 27]] as const) p.px(x, y + d, 'oxido', 1);
  // Nozzle on the floor, in front.
  p.rect(30, 34, 11, 3, 'acero', 2);
  p.rect(30, 34, 11, 1, 'acero', 0);
  p.rect(30, 36, 11, 1, 'acero', 5);
  for (let x = 31; x < 40; x += 2) p.px(x, 36, 'goma', 5);
  glove(p, 31 + el, 21 + d, 'azul');
  const out = p.outline();
  // Revving: dust kicked out from under the back wheel (see-through, so not part of the body).
  if (rev) for (const [x, y, a] of [[3, 34, 200], [2, 34, 160], [1, 32, 150], [5, 31, 120], [0, 35, 110], [2, 29, 90], [4, 33, 170], [0, 31, 80]] as const) out.set(x, y, [190, 180, 205, a]);
  else for (const [x, y, a] of [[4, 37, 90], [2, 36, 60]] as const) out.set(x, y, [170, 160, 190, a]);
  return out;
}

/** Its sheet: 0-1 breathing, 2-5 rolling on its wheeled shoes, 6 revving before a charge. */
export function makeAspiradorNuevoFrames(): Canvas[] {
  const walk = narrowPoseCycle(...ASPIRADOR_LEGS2);
  return [...walk.map((f, i) => makeAspiradorNuevo(f.pose, i < 2 ? 0 : i - 2)), makeAspiradorNuevo(walk[0]!.pose, 1, true)];
}

// ---------------------------------------------------------------------------------------------
// The Microondas Sin Seguro

export const MICROONDAS_W = 44;
export const MICROONDAS_H = 46;
export const MICROONDAS_FEET = { x: 22, y: 44 } as const;
export const MICROONDAS_LEGS2 = [14, 23] as const;
/** The 12:00 on its clock (px from the frame's top-left at bob 0), which the game makes blink. */
export const MICROONDAS_CLOCK = { x: 30, y: 17, w: 7, h: 3 } as const;

/**
 * The microwave in a pose. Its window is its face: the light inside, its eyes and a grimace; a
 * fork stuck in the door seam sparks (no safety catch). `heat` is its warning before a ring of
 * bullets: the window goes white-orange and steam comes out of the vents.
 */
export function makeMicroondasNuevo(pose: Pose = { xb: MICROONDAS_LEGS2[0], xf: MICROONDAS_LEGS2[1], bob: 0 }, heat = false): Canvas {
  const p = new Paint(MICROONDAS_W, MICROONDAS_H);
  const d = pose.bob;
  glove(p, 1, 29 + d, 'crema');
  legs(p, pose, 35 + d, 44, 'rojo');
  // The box in three quarters: top face (lit), left side (shade), front face (mid tones).
  const x0 = 6;
  const y0 = 14 + d;
  const fw = 28; // front face width
  const fh = 21; // front face height
  const depth = 4; // the top face and the side, foreshortened
  // Top face: a parallelogram going back and up to the left.
  for (let j = 0; j < depth; j++) p.rect(x0 + j, y0 - depth + j, fw, 1, 'crema', j === 0 ? 0 : 1);
  // Left side: a parallelogram, its back edge higher (it recedes up the screen).
  for (let i = 0; i < depth; i++) {
    const back = depth - i;
    p.rect(x0 + i, y0 - back + 1, 1, fh - 1, 'crema', i === 0 ? 5 : 4);
    p.px(x0 + i, y0 - back + fh - 1, 'crema', 6);
  }
  // Front face, with a soft light on its top-left corner and darker towards the bottom.
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) p.px(x0 + depth + x, y0 + y, 'crema', y < 2 ? 1 : y > fh - 4 ? 3 : 2);
  const fx = x0 + depth;
  // The edges between the faces.
  p.rect(fx, y0, fw, 1, 'crema', 0);
  p.rect(fx, y0, 1, fh, 'crema', 1);
  // Door window on the left two thirds: a dark frame and the lit inside, which is its face.
  const wx = fx + 2;
  const wy = y0 + 3;
  const ww = 17;
  const wh = 14;
  p.rect(wx, wy, ww, wh, 'goma', 4);
  p.rect(wx, wy, ww, 1, 'goma', 2);
  p.rect(wx, wy + wh - 1, ww, 1, 'crema', 3);
  // The light inside: brightest in the middle, warmer (or white-hot) all over while it heats.
  for (let y = 1; y < wh - 1; y++) {
    for (let x = 1; x < ww - 1; x++) {
      const k = Math.hypot((x - ww / 2) / (ww / 2), (y - wh / 2) / (wh / 2));
      const tone = heat ? (k < 0.55 ? 0 : k < 0.85 ? 1 : 2) : k < 0.45 ? 1 : k < 0.8 ? 2 : 3;
      p.px(wx + x, wy + y, 'amarillo', tone);
    }
  }
  // The mesh of the door: every other row a touch darker (only at the edges, it reads as glass).
  for (let x = 1; x < ww - 1; x += 2) {
    p.px(wx + x, wy + 1, 'amarillo', heat ? 2 : 4);
    p.px(wx + x, wy + wh - 2, 'amarillo', heat ? 2 : 4);
  }
  // Its face, in the window: narrowed eyes under brows that slant in (fed up), and a frown.
  const ex = wx + 4;
  const ey = wy + 5;
  for (const x of [ex, ex + 7]) {
    p.rect(x, ey, 3, 2, 'amarillo', 5);
    p.raw(x + 1, ey + 1, INK);
    p.raw(x + 2, ey + 1, INK);
    p.raw(x + 2, ey, INK);
    p.raw(x + 1, ey, heat ? SHINE : INK);
  }
  // The brows, thick and lower towards the middle.
  for (const [x, y] of [[ex - 1, ey - 3], [ex, ey - 3], [ex + 1, ey - 2], [ex + 2, ey - 1], [ex + 7, ey - 1], [ex + 8, ey - 2], [ex + 9, ey - 3], [ex + 10, ey - 3]] as const) {
    p.px(x, y, 'amarillo', 5);
    p.px(x, y - 1, 'amarillo', 4);
  }
  // Mouth: a frown, gritted teeth while it heats.
  const my = ey + 5;
  p.rect(ex + 2, my, 6, 1, 'amarillo', 5);
  p.px(ex + 1, my + 1, 'amarillo', 5);
  p.px(ex + 8, my + 1, 'amarillo', 5);
  if (heat) for (const x of [ex + 3, ex + 5]) p.raw(x, my, SHINE);
  // The control panel on the right third: the LCD clock and two knobs.
  const cx = fx + ww + 3;
  p.rect(cx - 1, y0 + 2, 1, fh - 4, 'crema', 4);
  p.rect(cx, y0 + 2, 7, 5, 'goma', 5);
  p.rect(MICROONDAS_CLOCK.x, MICROONDAS_CLOCK.y + d, MICROONDAS_CLOCK.w, MICROONDAS_CLOCK.h, 'verde', 5);
  // «12:00» in three-pixel-high segments, squeezed: 1, 2, the colon, 0 and 0.
  const lit: Array<[number, number]> = [
    [0, 0], [0, 1], [0, 2],
    [2, 0], [2, 2], [3, 1], [3, 0],
    [4, 0], [4, 2],
    [5, 0], [5, 1], [5, 2], [6, 0], [6, 2],
  ];
  for (const [x, y] of lit) p.px(MICROONDAS_CLOCK.x + x, MICROONDAS_CLOCK.y + d + y, 'verde', heat ? 0 : 1);
  // Knobs: little shaded domes with a mark (the timer one, turned all the way round).
  for (const [kx, ky, mark] of [[cx + 1, y0 + 10, 1], [cx + 4, y0 + 15, 0]] as const) {
    p.ellipsoid(kx + 0.5, ky + 0.5, 2.2, 2.2, 'acero', { dither: 0, spec: true });
    p.px(kx + mark, ky - 1 + mark, 'rojo', 2);
  }
  // A start button.
  p.rect(cx + 1, y0 + 19, 5, 1, heat ? 'rojo' : 'verde', heat ? 1 : 2);
  // Vents on the side, and the handle line between the door and the panel.
  for (let i = 0; i < 3; i++) p.px(x0 + 1 + i, y0 + 4 + i * 3 - i, 'crema', 6);
  // The underside: a dark lip with two little feet over the legs.
  p.rect(fx, y0 + fh, fw, 1, 'crema', 5);
  // The fork stuck in its top (no safety catch): the handle leaning out, the tines up.
  const fkx = fx + 18;
  const fky = y0 - 2;
  for (const [x, y, t] of [[0, 0, 3], [0, -1, 2], [1, -2, 1], [1, -3, 2], [2, -4, 1], [2, -5, 1]] as const) p.px(fkx + x, fky + y, 'acero', t);
  for (const [x, y, t] of [[1, -6, 0], [3, -6, 1], [1, -7, 1], [3, -7, 2], [2, -6, 2]] as const) p.px(fkx + x, fky + y, 'acero', t);
  // Rust specks and a scorch mark above the door.
  for (const [x, y] of [[x0 + 2, y0 + 15], [fx + fw - 3, y0 + fh - 3], [fx + 5, y0 + 1]] as const) p.px(x, y, 'oxido', 1);
  p.rect(wx + 2, wy - 1, 4, 1, 'quemada', 2);
  glove(p, 38, 28 + d, 'crema');
  const out = p.outline();
  // Sparks off the fork (raw light, outside the outline), more while it heats.
  const sparks: Array<[number, number, 'y' | 'c' | 'w']> = heat
    ? [[fkx, fky - 9, 'y'], [fkx + 5, fky - 8, 'c'], [fkx + 3, fky - 10, 'w'], [fkx - 1, fky - 7, 'c'], [fkx + 6, fky - 6, 'y'], [fkx + 1, fky - 11, 'w']]
    : [[fkx, fky - 9, 'y'], [fkx + 5, fky - 8, 'c']];
  const col = { y: [255, 217, 90, 255], c: [182, 241, 240, 255], w: [255, 250, 240, 255] } as const;
  for (const [x, y, c] of sparks) if (y >= 0 && out.get(x, y)[3] === 0) out.set(x, y, [...col[c]] as [number, number, number, number]);
  // Steam from the vents while it heats (see-through).
  if (heat) for (const [x, y, a] of [[x0 + 1, y0 - 2, 120], [x0, y0 - 4, 90], [x0 + 2, y0 - 6, 60], [x0 - 1, y0 - 7, 40]] as const) out.set(x, y, [235, 230, 245, a]);
  return out;
}

/**
 * Its sheet: 0-1 breathing, 2-5 walking (since M14b (h9c) it goes where your reflection in its
 * door would be; before, it never walked and had no stride), 6 heating before it fires.
 */
export function makeMicroondasNuevoFrames(): Canvas[] {
  const cycle = poseCycle(...MICROONDAS_LEGS2);
  return [...cycle.map((f) => makeMicroondasNuevo(f.pose)), makeMicroondasNuevo(cycle[0]!.pose, true)];
}

// ---------------------------------------------------------------------------------------------
// The Bombilla de Bajo Consumo: an energy-saving bulb in a suit (middle management). Its head is
// a glass globe with the fluorescent spiral showing inside it, lit or off; a white ballast collar
// with its A+ label, the brass screw cap as a neck, a briefcase.

export const BOMBILLA_W = 38;
export const BOMBILLA_H = 48;
export const BOMBILLA_FEET = { x: 18, y: 46 } as const;
export const BOMBILLA_LEGS2 = [12, 19] as const;
/** The middle of its glass globe, px above its feet (where the game draws its glow). */
export const BOMBILLA_GLOW_Y = 33;

/** `lit`: the globe glowing (false: switching on, the glass grey and dead). */
export function makeBombillaNueva(pose: Pose = { xb: BOMBILLA_LEGS2[0], xf: BOMBILLA_LEGS2[1], bob: 0 }, lit = true): Canvas {
  const p = new Paint(BOMBILLA_W, BOMBILLA_H);
  const d = pose.bob;
  // Briefcase in the back hand (behind the body), then the legs.
  const by = 31 + d;
  p.rect(1, by + 2, 9, 6, 'carton', 2);
  p.rect(1, by + 2, 9, 1, 'carton', 1);
  p.rect(1, by + 7, 9, 1, 'carton', 4);
  p.rect(1, by + 2, 1, 6, 'carton', 3);
  p.rect(4, by + 1, 3, 1, 'carton', 4);
  p.px(5, by + 4, 'laton', 1);
  glove(p, 7, by - 1, 'goma');
  legs(p, pose, 39 + d, 46, 'quemada');
  // The suit: a short jacket, darker on the left, the shirt and the tie down the middle.
  const sy = 30 + d;
  for (let y = 0; y < 9; y++) for (let x = 0; x < 16; x++) p.px(10 + x, sy + y, 'goma', x < 3 ? 4 : y < 1 ? 2 : 3);
  p.rect(16, sy, 4, 3, 'acero', 1);
  p.px(16, sy + 3, 'acero', 2);
  p.px(19, sy + 3, 'acero', 2);
  p.rect(17, sy + 1, 2, 7, 'rojo', 2);
  p.px(17, sy + 1, 'rojo', 1);
  p.px(18, sy + 7, 'rojo', 4);
  // Lapels and a pen in the breast pocket.
  p.px(15, sy + 1, 'goma', 1);
  p.px(20, sy + 1, 'goma', 1);
  p.rect(22, sy + 3, 2, 1, 'goma', 5);
  p.px(23, sy + 2, 'azul', 2);
  // The brass screw cap as a neck, its threads.
  const ny = 27 + d;
  p.rect(15, ny, 7, 3, 'laton', 1);
  p.rect(15, ny + 1, 7, 1, 'laton', 2);
  p.rect(15, ny, 2, 3, 'laton', 3);
  // The white ballast collar, with the A+ label it is so proud of.
  const cy = 23 + d;
  for (let x = 0; x < 15; x++) p.rect(11 + x, cy, 1, 4, 'acero', x < 3 ? 3 : x < 11 ? 1 : 2);
  p.rect(11, cy, 15, 1, 'acero', 0);
  p.rect(12, cy + 1, 4, 2, 'verde', 2);
  p.px(12, cy + 1, 'verde', 1);
  p.px(15, cy + 2, 'verde', 4);
  // The globe: glass lit from inside (brightest in the middle) or dead grey, shaded as a ball.
  const gx = 18.5;
  const gy = 12.5 + d;
  const gm: Material = lit ? 'amarillo' : 'acero';
  p.ellipsoid(gx, gy, 10.8, 10.8, gm, { dither: 0.3, bias: lit ? 0.45 : 0.15, z: 0.9 });
  // The spiral tube showing through: slanted loops, a tone darker than the glass round them, above
  // and below the face (across it, they muddle the eyes).
  for (const ly of [gy - 9, gy - 6, gy + 7]) {
    for (let x = -7; x <= 7; x++) {
      const y = Math.round(ly + x * 0.18 + (Math.abs(x) > 5 ? 1 : 0));
      if (!p.filled(Math.round(gx + x), y)) continue;
      p.px(Math.round(gx + x), y, gm, lit ? 3 : 4);
    }
  }
  // The face on the glass, looking right: heavy brows, lids half down, a smug little mouth.
  const fx = 18;
  const fy = Math.round(gy) - 1;
  for (const ex of [fx, fx + 6]) {
    p.rect(ex, fy, 3, 3, gm, lit ? 5 : 6);
    p.raw(ex + 1, fy + 1, INK);
    p.raw(ex + 2, fy + 1, INK);
    p.raw(ex + 2, fy + 2, INK);
    p.raw(ex + 1, fy + 2, lit ? SHINE : INK);
    p.rect(ex, fy, 3, 1, gm, lit ? 4 : 5);
  }
  for (const [x, y] of [[fx - 1, fy - 2], [fx, fy - 2], [fx + 1, fy - 2], [fx + 2, fy - 1], [fx + 6, fy - 1], [fx + 7, fy - 2], [fx + 8, fy - 2], [fx + 9, fy - 2]] as const) p.px(x, y, gm, 5);
  p.rect(fx + 2, fy + 6, 5, 1, gm, 5);
  p.px(fx + 7, fy + 5, gm, 5);
  // The highlight on the glass, and a crack (it has seen things).
  p.raw(12, Math.round(gy) - 6, SHINE);
  p.raw(13, Math.round(gy) - 7, SHINE);
  p.raw(11, Math.round(gy) - 4, SHINE);
  for (const [x, y] of [[24, gy - 9], [25, gy - 8], [24, gy - 7], [25, gy - 6]] as const) p.px(x, Math.round(y), gm, lit ? 3 : 5);
  // The front hand.
  glove(p, 27, sy + 1, 'goma');
  return p.outline();
}

/** Its sheet: 0 lit, 1 off (switching on), 2 lit breathing out, 3-6 walking (all lit). */
export function makeBombillaNuevaFrames(): Canvas[] {
  const cycle = poseCycle(...BOMBILLA_LEGS2);
  return [makeBombillaNueva(cycle[0]!.pose), makeBombillaNueva(cycle[0]!.pose, false), ...cycle.slice(1).map((f) => makeBombillaNueva(f.pose))];
}

// ---------------------------------------------------------------------------------------------
// The Polilla Fiel: a moth seen from above, two wing beats, its head to the right like the rest.

export const POLILLA_W = 17;
export const POLILLA_H = 15;
export const POLILLA_FEET = { x: 8, y: 14 } as const;

/** Whether (x, y) is inside the triangle a, b, c. */
function inTri(x: number, y: number, a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): boolean {
  const s = (p: readonly [number, number], q: readonly [number, number]): number => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const d1 = s(a, b);
  const d2 = s(b, c);
  const d3 = s(c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

export function makePolillaNueva(): Canvas[] {
  const frames: Canvas[] = [];
  for (const up of [true, false]) {
    const p = new Paint(POLILLA_W, POLILLA_H);
    // Each side: a fore wing (a triangle from the body out to its tip) and a smaller hind wing
    // below it. Up, the tips reach high and wide; down, they fold low and in.
    for (const side of [-1, 1]) {
      const X = (dx: number): number => 8 + side * dx;
      const tip: [number, number] = up ? [X(8), 1] : [X(7), 9];
      const fore: Array<[number, number]> = [[X(0.5), 4], tip, [X(up ? 5 : 3), up ? 8 : 11]];
      const hind: Array<[number, number]> = [[X(0.5), 7], [X(up ? 5 : 4.5), up ? 10 : 12.5], [X(1.5), up ? 12 : 13]];
      for (let y = 0; y < POLILLA_H; y++) {
        for (let x = 0; x < POLILLA_W; x++) {
          if (inTri(x + 0.5, y + 0.5, hind[0]!, hind[1]!, hind[2]!)) p.px(x, y, 'carton', 2);
        }
      }
      for (let y = 0; y < POLILLA_H; y++) {
        for (let x = 0; x < POLILLA_W; x++) {
          if (!inTri(x + 0.5, y + 0.5, fore[0]!, fore[1]!, fore[2]!)) continue;
          // Lighter out towards the tip, a dark band across the middle.
          const out = Math.abs(x + 0.5 - 8) / 8;
          p.px(x, y, 'carton', out > 0.7 ? 0 : out > 0.45 ? 3 : 1);
        }
      }
      // The eyespot on the fore wing.
      p.px(X(4), up ? 5 : 7, 'quemada', 2);
    }
    // The furry body down the middle, the head with its eye to the right, feathery antennae.
    p.rect(7, 3, 2, 8, 'quemada', 1);
    p.rect(7, 3, 1, 8, 'quemada', 2);
    p.px(8, 10, 'quemada', 3);
    p.rect(7, 2, 3, 2, 'quemada', 0);
    p.raw(9, 2, [255, 217, 90, 255]);
    p.px(10, 1, 'quemada', 1);
    p.px(11, 0, 'quemada', 1);
    p.px(6, 1, 'quemada', 2);
    p.px(5, 0, 'quemada', 2);
    frames.push(p.outline());
  }
  return frames;
}

// ---------------------------------------------------------------------------------------------
// The Batidora de Mano: a seventies mint hand mixer with the carrying handle as a loop on its
// back, wild uneven eyes and gritted teeth; two balloon whisks crusted with old batter hang in
// front of it. The speed slider on the handle is jammed on the red TURBO notch and its cord is tied
// in a knot behind it.

export const BATIDORA_W = 42;
export const BATIDORA_H = 38;
export const BATIDORA_FEET = { x: 15, y: 36 } as const;
export const BATIDORA_LEGS2 = [9, 15] as const;

/** One balloon whisk: a stem from the socket and a wire loop; `phase` turns its inner wires. */
function whisk(p: Paint, cx: number, top: number, bottom: number, phase: number): void {
  p.rect(cx, top, 1, 2, 'acero', 3);
  const y0 = top + 2;
  const rx = 3.4;
  for (let y = y0; y <= bottom; y++) {
    const t = (y - y0 + 0.5) / (bottom - y0 + 1);
    const w = rx * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.55);
    const wl = Math.round(cx - w);
    const wr = Math.round(cx + w);
    // Through the wires, the dark inside of the balloon (so it reads as one shape).
    for (let x = wl + 1; x < wr; x++) p.px(x, y, 'acero', 6);
    // The silhouette wires: lit on the left, in shade on the right.
    p.px(wl, y, 'acero', 2);
    p.px(wr, y, 'acero', 4);
    // Two inner wires going round: the one in front bright, the one behind dark.
    for (const [k, front] of [[0, true], [Math.PI / 2, false]] as const) {
      const x = Math.round(cx + w * Math.cos(phase + k));
      if (x !== wl && x !== wr) p.px(x, y, 'acero', front ? 0 : 4);
    }
  }
  p.px(cx, bottom + 1, 'acero', 3);
}

/**
 * The mixer in a pose; `spin` (0-3) turns the whisks a quarter of a quarter turn each frame (the
 * game plays them faster while it winds up).
 */
export function makeBatidoraNueva(pose: Pose = { xb: BATIDORA_LEGS2[0], xf: BATIDORA_LEGS2[1], bob: 0 }, spin = 0): Canvas {
  const p = new Paint(BATIDORA_W, BATIDORA_H);
  const d = pose.bob;
  // The cord out of its back, tied in a knot, the plug dragging behind.
  const cord: Array<[number, number]> = [
    [3, 19], [2, 20], [1, 21], [1, 22], [2, 23], [3, 23], [3, 22], [2, 22], [1, 24], [1, 25], [2, 26], [2, 27], [1, 28],
  ];
  for (const [x, y] of cord) p.px(x, y + d, 'goma', 3);
  p.rect(0, 29 + d, 3, 2, 'goma', 2);
  p.px(0, 31 + d, 'laton', 1);
  p.px(2, 31 + d, 'laton', 2);
  glove(p, 1, 13 + d, 'menta');
  legs(p, pose, 26 + d, BATIDORA_FEET.y, 'goma');
  // The whisks under its chin (behind the body's lip), turning.
  const phase = (spin * Math.PI) / 4;
  whisk(p, 25, 26 + d, 34 + d, phase);
  whisk(p, 33, 26 + d, 34 + d, phase + Math.PI / 3);
  // The sockets: a steel plate under the front.
  p.rect(22, 25 + d, 13, 2, 'acero', 3);
  p.rect(22, 25 + d, 13, 1, 'acero', 2);
  // The handle: a loop over its back (open underneath), shaded like a tube.
  const hy = 2 + d;
  const tube = (x: number, y: number, w: number, h: number): void => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(x + i, y + j, 'menta', j === 0 ? 1 : j === h - 1 ? 4 : i === 0 ? 2 : 2);
  };
  tube(6, hy, 22, 4);
  p.rect(7, hy, 20, 1, 'menta', 0);
  for (let j = 0; j < 6; j++) {
    p.rect(6, hy + 1 + j, 3, 1, 'menta', 2);
    p.px(6, hy + 1 + j, 'menta', 1);
    p.px(8, hy + 1 + j, 'menta', 4);
    p.rect(25, hy + 1 + j, 3, 1, 'menta', 3);
    p.px(27, hy + 1 + j, 'menta', 5);
  }
  // The speed slider along the handle: a groove, five notches, the knob jammed on red TURBO.
  p.rect(11, hy + 1, 12, 1, 'menta', 5);
  for (const x of [12, 14, 16, 18]) p.px(x, hy + 2, 'menta', 4);
  p.rect(20, hy, 4, 2, 'rojo', 2);
  p.px(20, hy, 'rojo', 1);
  p.px(23, hy + 1, 'rojo', 4);
  // The body: a fat rounded block, shaded as a pillow (flat front, rounded edges).
  const bx0 = 3;
  const bx1 = 37;
  const by0 = 9 + d;
  const by1 = 26 + d;
  const cx = (bx0 + bx1) / 2;
  const cy = (by0 + by1) / 2;
  const rx = (bx1 - bx0) / 2;
  const ry = (by1 - by0) / 2;
  p.heightShade(bx0 - 1, by0 - 1, bx1 - bx0 + 3, by1 - by0 + 3, (x, y) => {
    const nx = (x + 0.5 - cx) / rx;
    const ny = (y + 0.5 - cy) / ry;
    const v = nx ** 4 + ny ** 4;
    return v > 1 ? null : 7 * Math.pow(1 - v, 0.35);
  }, 'menta', { dither: 0.3, bias: 0.05 });
  // A seam round its nose where the two shells close, and the vents at its back.
  for (let y = by0 + 3; y < by1 - 2; y++) p.px(30, y, 'menta', 4);
  for (const x of [6, 8, 10]) {
    p.rect(x, by0 + 4, 1, 5, 'menta', 5);
    p.px(x, by0 + 4, 'menta', 6);
  }
  // Its face, on the front half: the back eye small and squinting, the front one wide and mad.
  const ex = 15;
  const ey = by0 + 4;
  p.rect(ex, ey + 1, 4, 3, 'menta', 6);
  p.raw(ex + 1, ey + 2, INK);
  p.raw(ex + 2, ey + 2, INK);
  p.raw(ex + 3, ey + 2, SHINE);
  p.rect(ex, ey + 1, 4, 1, 'menta', 3);
  p.rect(ex + 7, ey, 5, 5, 'menta', 6);
  p.rect(ex + 8, ey + 1, 3, 3, 'acero', 0);
  p.raw(ex + 9, ey + 2, INK);
  p.raw(ex + 10, ey + 2, INK);
  p.raw(ex + 10, ey + 3, INK);
  p.raw(ex + 9, ey + 1, SHINE);
  // Brows: angry, slanting down to the middle; the front one twitching up at its end.
  const brows = [
    [ex - 1, ey - 1], [ex, ey - 1], [ex + 1, ey], [ex + 2, ey], [ex + 3, ey],
    [ex + 6, ey - 1], [ex + 7, ey - 1], [ex + 8, ey - 2], [ex + 9, ey - 2], [ex + 10, ey - 2], [ex + 11, ey - 3],
  ] as const;
  for (const [x, y] of brows) p.px(x, y, 'menta', 6);
  // Gritted teeth, the mouth pulled down at the front in a snarl.
  const my = ey + 7;
  p.rect(ex + 1, my, 11, 4, 'menta', 6);
  p.rect(ex + 2, my + 1, 9, 1, 'acero', 0);
  p.rect(ex + 2, my + 2, 9, 1, 'crema', 2);
  for (const x of [ex + 4, ex + 6, ex + 8]) p.rect(x, my + 1, 1, 2, 'menta', 6);
  p.px(ex + 12, my + 3, 'menta', 6);
  p.px(ex + 12, my + 4, 'menta', 6);
  p.px(ex, my, 'menta', 5);
  // The highlight on the casing, rust specks and old batter dried on its chin.
  p.raw(6, by0 + 2, SHINE);
  p.raw(7, by0 + 1, SHINE);
  for (const [x, y] of [[33, by0 + 3], [12, by1 - 3], [5, by0 + 12]] as const) p.px(x, y, 'oxido', 1);
  const batter = [
    [26, by1 - 1, 1], [27, by1 - 2, 2], [33, by1 - 1, 1], [23, 31 + d, 1], [23, 32 + d, 2], [24, 32 + d, 1],
    [26, 29 + d, 2], [34, 31 + d, 1], [35, 31 + d, 2], [34, 32 + d, 2], [32, 28 + d, 1],
  ] as const;
  for (const [x, y, t] of batter) p.px(x, y, 'crema', t);
  glove(p, 36, 17 + d, 'menta');
  const out = p.outline();
  // A fleck of batter flying off the whisks every other frame.
  if (spin % 2 === 1) out.set(40, 29 + d, [...MATERIALS.crema[1]!] as [number, number, number, number]);
  else out.set(21, 33 + d, [...MATERIALS.crema[2]!] as [number, number, number, number]);
  return out;
}

/** Its sheet: 0-3 standing with the whisks turning, 4-7 running after you (the whisks still turning). */
export function makeBatidoraNuevaFrames(): Canvas[] {
  const cycle = poseCycle(...BATIDORA_LEGS2);
  return [...[0, 1, 2, 3].map((k) => makeBatidoraNueva(cycle[k % 2]!.pose, k)), ...cycle.slice(2).map((f, k) => makeBatidoraNueva(f.pose, k))];
}

// ---------------------------------------------------------------------------------------------
// The Mando a Distancia: a TV remote standing on its end in checked house slippers. Shifty eyes
// under heavy lids and a smug half-smile; the infrared window across its forehead is where its
// zaps come from. Its battery cover is gone (two batteries held in with tape), the «1» is missing,
// and a cheese puff is stuck to its top from years between the sofa cushions.

export const MANDO_W = 32;
export const MANDO_H = 46;
export const MANDO_FEET = { x: 17, y: 44 } as const;
export const MANDO_LEGS2 = [12, 18] as const;
/** The infrared window, px above its feet at rest (the game fires its zaps from here: muzzleY). */
export const MANDO_IR_Y = 24;

export function makeMandoNuevo(pose: Pose = { xb: MANDO_LEGS2[0], xf: MANDO_LEGS2[1], bob: 0 }): Canvas {
  const p = new Paint(MANDO_W, MANDO_H);
  const d = pose.bob;
  glove(p, 2, 24 + d, 'goma');
  legs(p, pose, 38 + d, MANDO_FEET.y, 'carton');
  // Check pattern on the slippers.
  for (const [x, leg] of [[pose.xb, -1], [pose.xf, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = MANDO_FEET.y - 3 - up;
    for (let i = 1; i < 5; i += 2) p.px(x + i, yb + 1, 'carton', 4);
    p.px(x + 2, yb, 'rojo', 3);
  }
  // The box: front face, the left side and the top, foreshortened (like the microwave).
  const x0 = 7;
  const y0 = 9 + d;
  const fw = 15;
  const fh = 29;
  const depth = 3;
  for (let j = 0; j < depth; j++) p.rect(x0 + j, y0 - depth + j, fw, 1, j === 0 ? 'acero' : 'goma', j === 0 ? 3 : 0);
  for (let i = 0; i < depth; i++) {
    const back = depth - i;
    p.rect(x0 + i, y0 - back + 1, 1, fh - 1, 'goma', i === 0 ? 3 : 2);
    p.px(x0 + i, y0 - back + fh - 1, 'goma', 4);
  }
  const fx = x0 + depth;
  // The front: lit at the top-left, darker towards the bottom; a rounded bottom edge.
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) p.px(fx + x, y0 + y, 'goma', y < 2 || (x < 3 && y < 8) ? 0 : y > fh - 3 || x > fw - 2 ? 2 : 1);
  p.rect(fx, y0, fw, 1, 'acero', 2);
  p.rect(fx, y0, 1, fh, 'goma', 0);
  p.erase(fx + fw - 1, y0 + fh - 1);
  // The cheese puff stuck on its top (curly, orange).
  const puff = [[x0 + 3, y0 - 4, 1], [x0 + 4, y0 - 5, 0], [x0 + 5, y0 - 5, 1], [x0 + 6, y0 - 4, 2], [x0 + 4, y0 - 4, 1], [x0 + 5, y0 - 4, 2], [x0 + 7, y0 - 5, 1]] as const;
  for (const [x, y, t] of puff) p.px(x, y, 'oxido', t);
  // The power button at the top-right of the front, a round red bump.
  p.ellipsoid(fx + 11.5, y0 + 2.5, 1.8, 1.8, 'rojo', { dither: 0, spec: true });
  // The infrared window: a dark glossy red band across its forehead.
  const iy = MANDO_FEET.y - MANDO_IR_Y - 2 + d;
  p.rect(fx + 1, iy, fw - 2, 3, 'rojo', 5);
  p.rect(fx + 1, iy, fw - 2, 1, 'rojo', 4);
  p.raw(fx + 2, iy, MATERIALS.rojo[2]!);
  p.raw(fx + 3, iy, MATERIALS.rojo[3]!);
  // The eyes, under the window: looking sideways at you, lids half down (smug).
  const ey = iy + 4;
  for (const ex of [fx + 3, fx + 8]) {
    p.rect(ex, ey, 3, 3, 'acero', 1);
    p.raw(ex + 2, ey + 1, INK);
    p.raw(ex + 2, ey + 2, INK);
    p.raw(ex + 1, ey + 2, INK);
    p.rect(ex, ey, 3, 1, 'goma', 4);
    p.px(ex - 1, ey, 'goma', 4);
  }
  p.raw(fx + 10, ey + 1, SHINE);
  // The half-smile, pulled up at the front.
  p.rect(fx + 5, ey + 4, 4, 1, 'goma', 5);
  p.px(fx + 9, ey + 3, 'goma', 5);
  // The keypad: three by three rubber buttons, the «1» just a hole.
  const ky = ey + 6;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const bx = fx + 3 + c * 3;
      const by = ky + r * 3;
      if (r === 0 && c === 0) {
        p.rect(bx, by, 2, 2, 'goma', 5);
        continue;
      }
      p.rect(bx, by, 2, 1, 'crema', 2);
      p.rect(bx, by + 1, 2, 1, 'crema', 4);
      p.px(bx, by, 'crema', 1);
    }
  }
  // The volume rocker, worn shiny from use.
  p.rect(fx + 2, y0 + 3, 6, 2, 'acero', 3);
  p.rect(fx + 2, y0 + 3, 6, 1, 'acero', 1);
  p.px(fx + 3, y0 + 3, 'acero', 0);
  // The side: no battery cover, two batteries and a strip of tape across them.
  p.rect(x0, y0 + 6, 3, 14, 'goma', 5);
  p.rect(x0, y0 + 7, 1, 12, 'amarillo', 2);
  p.rect(x0 + 1, y0 + 7, 1, 12, 'amarillo', 3);
  p.px(x0, y0 + 7, 'acero', 1);
  p.px(x0 + 1, y0 + 18, 'acero', 3);
  p.px(x0, y0 + 13, 'goma', 5);
  p.px(x0 + 1, y0 + 13, 'goma', 5);
  p.rect(x0 - 1, y0 + 10, 5, 2, 'crema', 1);
  p.px(x0 + 3, y0 + 11, 'crema', 3);
  // A scratch.
  p.px(fx + fw - 3, y0 + fh - 6, 'goma', 1);
  glove(p, 24, 25 + d, 'goma');
  return p.outline();
}

/** Its sheet: 0-1 breathing, 2-5 shuffling round you in its slippers. */
export function makeMandoNuevoFrames(): Canvas[] {
  return narrowPoseCycle(...MANDO_LEGS2).map((f) => makeMandoNuevo(f.pose));
}
