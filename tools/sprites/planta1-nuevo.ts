// M14c (a5): the plant 1 enemies redrawn in the new style (docs/ESTILO_ARTE.md, «M14c · El
// estilo nuevo»), with the painting tools of src/art/pintor.ts. The old makers stay in
// characters.ts: art/referencia/ keeps the approved old sprites as history (tests/sprites.test.ts).
//
// Every enemy here is drawn on its own canvas with the legs on the floor and everything above
// them moved by the pose's `bob`, like the old ones (tools/sprites/pose.ts); the frames and their
// order are the ones its `anim` names in src/data/enemies.ts. No floor shadow is baked in: the
// game draws its own under every enemy.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE, type Material } from '../../src/art/paleta.ts';
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
