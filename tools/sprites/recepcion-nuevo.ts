// M14c (a6f1): two of the plant 5 enemies (Atención al Cliente) redrawn in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo»): the Asistente Virtual and the Teléfono de
// Recepción. Same painting tools, legs and gloves as plants 1-4 (planta1-nuevo.ts, box34 from
// planta3-nuevo.ts). The old makers stay in clientela.ts as history. The frames and their order
// are the ones each enemy's `anim` names in src/data/enemies.ts (and AV_FRAMES / PHONE_FRAMES);
// no floor shadow is baked in. The other two of plant 5 (the dispenser and the queue posts) live
// in their own file.

import { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { glove, legs } from './planta1-nuevo.ts';
import { box34 } from './planta3-nuevo.ts';
import { poseCycle, type Pose } from './pose.ts';

// ---------------------------------------------------------------------------------------------
// The Asistente Virtual: a self-service touch-screen totem of the kind every customer-service
// hall has instead of people. White plastic (`acero`), a big screen (`azul`, glowing) whose
// cartoon face never changes: two dot eyes and a huge smile, whatever happens. A turquoise brand
// band round its base with a white swoosh, sneakers to match. Jokes: «¿En qué puedo ayudarle?»
// burned into the top of the screen, fingerprints all over the face, the paper sign taped on its
// side («Si no le entiende, hable más despacio»), the «Valore su experiencia» QR sticker, the
// webcam on top with its red light on (it is always listening) and the receipt nobody asked for
// curling out of its printer slot. Typing: the three dots of «Escribiendo…» under the smile.

export const AV_W = 34;
export const AV_H = 48;
export const AV_FEET = { x: 17, y: 46 } as const;
export const AV_LEGS2 = [12, 18] as const;
/** Its smile, px above its feet (muzzleY): the speech bubbles come out of its mouth. */
export const AV_MOUTH_Y = 22;
/** The body: front face's left edge comes after `depth`; top row and size. */
const AVB = { x0: 6, y0: 10, fw: 20, fh: 26, depth: 4 } as const;
/** The screen's inner rectangle, relative to the front face. */
const AVS = { dx: 2, dy: 2, w: 16, h: 16 } as const;

/** «Valore su experiencia»: a QR sticker, white with a dark pattern. */
function qr(p: Paint, x: number, y: number): void {
  p.rect(x, y, 5, 5, 'acero', 0);
  const bits = ['##.##', '#..#.', '..#.#', '##..#', '#.##.'];
  bits.forEach((row, j) => [...row].forEach((c, i) => c === '#' && p.px(x + i, y + j, 'goma', 5)));
}

/** The paper sign taped to its side: a white sheet, a strip of tape, scribbled lines, a red underline. */
function sideSign(p: Paint, x: number, y: number): void {
  p.rect(x, y, 3, 8, 'crema', 0);
  p.px(x + 2, y + 7, 'crema', 2);
  p.rect(x, y - 1, 2, 1, 'amarillo', 0);
  for (const j of [2, 4]) p.rect(x, y + j, 2, 1, 'goma', 4);
  p.rect(x, y + 6, 3, 1, 'rojo', 2);
}

/**
 * The totem. `typing` 0 none, 1-2 the three dots of «Escribiendo…» under the smile with the lit
 * one moving (two beats; its raised hand taps the screen). `glow` 0/1: the screen breathing.
 */
export function makeAsistenteNuevo(pose: Pose = { xb: AV_LEGS2[0], xf: AV_LEGS2[1], bob: 0 }, typing: 0 | 1 | 2 = 0, glow = 0): Canvas {
  const p = new Paint(AV_W, AV_H);
  const F = AV_FEET;
  const { x0, y0, fw, fh, depth } = AVB;
  legs(p, pose, y0 + fh + 3 + pose.bob, F.y, 'turquesa');
  const b = new Paint(AV_W, AV_H);
  glove(b, 1, 24, 'acero');
  // The webcam on top, at the back: a little dark dome with its red light always on.
  b.ellipsoid(x0 + 12, y0 - depth - 1, 3, 2, 'goma', { dither: 0 });
  b.px(x0 + 12, y0 - depth - 2, 'goma', 0);
  b.px(x0 + 14, y0 - depth - 1, 'rojo', 1);
  const { fx } = box34(b, x0, y0, fw, fh, depth, 'acero', { top: [0, 1], side: [3, 2], front: [0, 1, 2] });
  // Rounded top corners on the front.
  b.erase(fx + fw - 1, y0);
  // The plinth under the body: a narrower neck down to the brand band.
  b.rect(fx + 2, y0 + fh, fw - 4, 3, 'acero', 3);
  b.rect(fx + 2, y0 + fh, fw - 4, 1, 'acero', 4);
  b.rect(x0 + 2, y0 + fh, depth, 3, 'acero', 4);
  // The brand band round the bottom of the body, with its white swoosh.
  b.rect(fx, y0 + fh - 4, fw, 3, 'turquesa', 2);
  b.rect(fx, y0 + fh - 4, fw, 1, 'turquesa', 1);
  b.rect(fx, y0 + fh - 2, fw, 1, 'turquesa', 3);
  for (let i = 0; i < depth; i++) b.rect(x0 + i, y0 + fh - 4 - (depth - i) + 1, 1, 3, 'turquesa', 4);
  for (const [i, j] of [[3, 2], [4, 1], [5, 1], [6, 1], [7, 0], [8, 0]] as const) b.px(fx + 4 + i, y0 + fh - 4 + j, 'acero', 0);
  // The screen: a dark bezel and the glowing blue, lighter at the top.
  const sx = fx + AVS.dx;
  const sy = y0 + AVS.dy;
  b.rect(sx - 1, sy - 1, AVS.w + 2, AVS.h + 2, 'goma', 5);
  for (let j = 0; j < AVS.h; j++) b.rect(sx, sy + j, AVS.w, 1, 'azul', j < 2 ? 0 : j < 9 - glow ? 1 : 2);
  // The glare across the top-left corner of the glass.
  for (let k = 0; k < 4; k++) b.raw(sx + 1 + k, sy + 4 - k, SHINE);
  // Burned in: the ghost of «¿En qué puedo ayudarle?», a broken line of darker pixels.
  for (const i of [5, 6, 8, 9, 10, 12, 13, 14]) b.px(sx + i, sy + 1, 'azul', 2);
  // The face, always the same: two dot eyes with a glint, cheeks and the huge smile.
  const my = F.y - AV_MOUTH_Y - 1;
  for (const ex of [sx + 4, sx + 10]) {
    b.raw(ex, my - 6, INK);
    b.raw(ex + 1, my - 6, INK);
    b.raw(ex, my - 5, INK);
    b.raw(ex + 1, my - 5, INK);
    b.raw(ex, my - 4, INK);
    b.raw(ex + 1, my - 4, INK);
    b.raw(ex, my - 6, SHINE);
  }
  b.px(sx + 2, my - 3, 'rosa', 2);
  b.px(sx + 14, my - 3, 'rosa', 2);
  // The smile: corners up, the bottom of it on the muzzle row, the inside dark with a tongue.
  for (const [i, j] of [[3, -2], [4, -1], [12, -1], [13, -2]] as const) b.raw(sx + i, my + j, INK);
  b.rect(sx + 5, my - 1, 7, 1, 'pantalla', 3);
  b.rect(sx + 5, my - 1, 7, 1, 'pantalla', 4);
  for (let i = 5; i < 12; i++) b.raw(sx + i, my, INK);
  b.px(sx + 7, my - 1, 'rojo', 2);
  b.px(sx + 8, my - 1, 'rojo', 1);
  for (let i = 4; i < 13; i++) b.raw(sx + i, my - 2, INK);
  for (let i = 5; i < 12; i++) b.px(sx + i, my - 1, i === 7 || i === 8 ? 'rojo' : 'pantalla', i === 7 || i === 8 ? 2 : 4);
  // Fingerprints: greasy smears where everyone pressed the face.
  for (const [i, j] of [[3, 9], [4, 10], [13, 4], [14, 5], [11, 13], [2, 14]] as const) b.px(sx + i, sy + j, 'azul', 0);
  // «Escribiendo…»: three dots under the smile, the lit one moving.
  if (typing) for (let k = 0; k < 3; k++) b.px(sx + 5 + k * 3, my + 3, 'azul', k === typing ? 0 : 4);
  if (typing) b.raw(sx + 5 + typing * 3, my + 3, SHINE);
  // Under the screen: the receipt printer slot, a receipt nobody asked for curling out of it.
  const ry = sy + AVS.h + 2;
  b.rect(fx + 5, ry, 10, 1, 'goma', 5);
  b.rect(fx + 7, ry + 1, 5, 2, 'crema', 0);
  b.px(fx + 12, ry + 2, 'crema', 1);
  b.px(fx + 8, ry + 2, 'crema', 3);
  b.px(fx + 10, ry + 1, 'crema', 3);
  // The speaker grille, by the slot.
  for (const i of [16, 18]) b.px(fx + i, ry, 'acero', 4);
  qr(b, fx + 1, ry - 1 + 1);
  sideSign(b, x0 + 0, y0 + 6);
  // Wear: a scuff on the side, a sticker torn off.
  b.px(x0 + 2, y0 + 18, 'acero', 4);
  b.rect(fx + fw - 4, ry + 1, 2, 1, 'acero', 3);
  // The helping hand: up by the screen; tapping it while it types.
  glove(b, 28, typing ? 13 + (typing === 2 ? 1 : 0) : 18, 'acero');
  p.stamp(b, 0, pose.bob);
  return p.outline();
}

/** Its frames (AV_FRAMES): 0-1 standing (the screen breathing), 2-5 walking, 6-7 typing. */
export function makeAsistenteNuevoFrames(): Canvas[] {
  const cyc = poseCycle(AV_LEGS2[0], AV_LEGS2[1]);
  return [
    makeAsistenteNuevo(cyc[0]!.pose, 0, 0),
    makeAsistenteNuevo(cyc[1]!.pose, 0, 1),
    ...cyc.slice(2).map((f) => makeAsistenteNuevo(f.pose)),
    makeAsistenteNuevo(undefined, 1),
    makeAsistenteNuevo(undefined, 2),
  ];
}

// ---------------------------------------------------------------------------------------------
// The Teléfono de Recepción: a reception desk phone thirty years old, its plastic yellowed
// (`crema`), with far too many keys. A low wedge in three quarters: the top slopes back to the
// cradle, the face on the front over the keypad. Its handset hangs off the left on the curly cord
// (the cradle is empty: it is always off the hook). Jokes: the post-it «Ext. 0» on top, the
// «message waiting» light always on (it blinks, nobody listens to them), the little display stuck
// on «L1 RETENIDA», and a column of red keys nobody knows what they do. It hops on short legs.

export const PHONE_W = 46;
export const PHONE_H = 38;
export const PHONE_FEET = { x: 23, y: 36 } as const;
export const PHONE_LEGS2 = [17, 24] as const;
/** Its mouth, px above its feet (muzzleY): the calls come out of it. */
export const PHONE_MOUTH_Y = 13;
/** The body: left edge, front height, top depth. */
const PH = { x0: 10, fw: 26, fh: 19, depth: 6 } as const;

export type PhoneLook = 'stand' | 'crouch' | 'air' | 'ring0' | 'ring1' | 'pass';

/** The handset hanging off the left side: earpiece up, mouthpiece down, on its curly cord. */
function handset(p: Paint, x: number, y: number, cordFrom: readonly [number, number]): void {
  // The curly cord, from the side of the body to the bottom of the handset.
  const [cx, cy] = cordFrom;
  const tx = x + 2;
  const ty = y + 12;
  const n = 6;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    const px = Math.round(cx + (tx - cx) * u);
    const py = Math.round(cy + (ty - cy) * u + Math.sin(u * Math.PI) * 3);
    p.px(px, py, 'crema', k % 2 ? 3 : 4);
    p.px(px + (k % 2 ? 1 : -1), py, 'crema', 4);
  }
  // The grip: a bar with the ear and mouth cups at its ends, facing right.
  p.rect(x, y, 3, 12, 'crema', 2);
  p.rect(x, y, 1, 12, 'crema', 1);
  p.rect(x + 2, y + 1, 1, 10, 'crema', 3);
  for (const yy of [y - 1, y + 9]) {
    p.rect(x, yy, 5, 4, 'crema', 2);
    p.rect(x, yy, 5, 1, 'crema', 1);
    p.rect(x + 3, yy + 1, 2, 2, 'crema', 4);
    p.px(x + 4, yy + 3, 'crema', 4);
  }
  p.px(x + 4, y + 1, 'crema', 5);
  p.px(x + 4, y + 11, 'crema', 5);
}

/**
 * The phone. `look`: 'stand' (bob 0/1), 'crouch' to hop, 'air' (legs tucked, the handset swung
 * up), 'ring0'/'ring1' ringing (it shakes, eyes screwed shut, mouth open, the handset jumping),
 * 'pass' «Le paso con un compañero» (side-eye, smirk, a hand pointing over its shoulder).
 */
export function makeTelefonoNuevo(look: PhoneLook = 'stand', bob = 0): Canvas {
  const p = new Paint(PHONE_W, PHONE_H);
  const F = PHONE_FEET;
  const crouch = look === 'crouch' ? 2 : 0;
  const air = look === 'air';
  const ring = look === 'ring0' || look === 'ring1';
  const jx = look === 'ring0' ? -1 : look === 'ring1' ? 1 : 0;
  const lift = air ? -3 : 0;
  const { x0, fw, depth } = PH;
  const fh = PH.fh - crouch;
  // Body bottom sits so the mouth row is fixed when standing (bob/crouch/air move it).
  const yb = F.y - 4;
  const y0 = yb - fh + bob + lift + crouch;
  if (!air) legs(p, { xb: PHONE_LEGS2[0], xf: PHONE_LEGS2[1], bob: 0 }, y0 + fh, F.y, 'goma');
  else {
    // Tucked under it in the air.
    p.rect(PHONE_LEGS2[0], y0 + fh, 5, 2, 'goma', 3);
    p.rect(PHONE_LEGS2[1], y0 + fh, 6, 2, 'goma', 2);
    p.rect(PHONE_LEGS2[1] + 1, y0 + fh, 4, 1, 'goma', 1);
  }
  const b = new Paint(PHONE_W, PHONE_H);
  const bx = x0 + jx;
  // The handset, behind and to the left: lower when it rests, swung up in the air, jumping when it rings.
  const hy = Math.min(F.y - 15, air ? y0 - 3 : look === 'ring0' ? y0 - 1 : look === 'ring1' ? y0 + 2 : y0 + 5);
  handset(b, 1 + jx, hy, [bx + 1, y0 + 2]);
  const { fx } = box34(b, bx, y0, fw, fh, depth, 'crema', { top: [1, 2], side: [4, 3], front: [1, 2, 3] });
  // The top face slopes: a darker band at the back where the cradle sits, then the display.
  const ty = y0 - depth;
  // The empty cradle: two prongs sticking up at the back, nothing on them.
  for (const px of [bx + 4, bx + 17]) {
    b.rect(px, ty - 2, 3, 3, 'crema', 3);
    b.rect(px, ty - 2, 3, 1, 'crema', 1);
    b.px(px + 1, ty - 1, 'crema', 5);
  }
  b.rect(bx + 7, ty + 1, 10, 1, 'crema', 3);
  // The display: «L1 RETENIDA», a little green-grey LCD with dark marks.
  b.rect(fx + 8, ty + 3, 12, 3, 'hojalata', 4);
  b.rect(fx + 9, ty + 4, 10, 1, 'hojalata', 1);
  for (const i of [9, 10, 12, 13, 15, 16, 17]) b.px(fx + i, ty + 4, 'hojalata', 5);
  // The post-it «Ext. 0» stuck on top, a corner curling.
  b.rect(bx + 9, ty - 1, 6, 4, 'amarillo', 1);
  b.rect(bx + 9, ty - 1, 6, 1, 'amarillo', 0);
  b.px(bx + 14, ty + 2, 'amarillo', 3);
  b.px(bx + 10, ty + 1, 'goma', 5);
  b.px(bx + 12, ty, 'goma', 5);
  b.px(bx + 12, ty + 1, 'goma', 5);
  // The face on the front: tired receptionist eyes, the mouth on the muzzle row.
  const my = F.y - PHONE_MOUTH_Y - 1 + bob + lift + crouch;
  const ex = fx + 6;
  for (const x of [ex, ex + 9]) {
    if (ring) {
      // Screwed shut: > <.
      b.raw(x, my - 4, INK);
      b.raw(x + 1, my - 3, INK);
      b.raw(x + 2, my - 3, INK);
      b.raw(x + 3, my - 4, INK);
      continue;
    }
    b.rect(x, my - 5, 4, 3, 'crema', 0);
    const look2 = look === 'pass' ? 0 : 1;
    b.raw(x + look2, my - 4, INK);
    b.raw(x + look2 + 1, my - 4, INK);
    b.raw(x + look2, my - 3, INK);
    b.raw(x + look2 + 1, my - 3, INK);
    // Heavy lids: the top row in the body's shade.
    b.rect(x, my - 5, 4, 1, 'crema', 3);
    for (let i = 0; i < 4; i++) b.raw(x + i, my - 6 - (look === 'pass' ? 0 : i === (x === ex ? 3 : 0) ? 1 : 0), INK);
  }
  // The mouth: a polite, worn-out line; a smirk when it passes you on; wide open when it rings.
  const mx = ex + 4;
  if (ring) {
    b.rect(mx, my - 1, 6, 3, 'rojo', 4);
    for (let i = 0; i < 6; i++) b.raw(mx + i, my - 1, INK);
    b.rect(mx + 1, my + 1, 4, 1, 'rojo', 2);
  } else if (look === 'pass') {
    for (let i = 0; i < 5; i++) b.raw(mx + i, my, INK);
    b.raw(mx + 5, my - 1, INK);
  } else {
    for (let i = 0; i < 6; i++) b.raw(mx + i, my, INK);
    b.raw(mx - 1, my + 1, INK);
  }
  // The keypad: rows of far too many little keys, and a column of red ones nobody understands.
  const ky = my + 3;
  for (let r = 0; r < 3; r++) {
    if (ky + r * 2 > y0 + fh - 2) break;
    for (let c = 0; c < 6; c++) {
      const red = c === 5;
      b.rect(fx + 3 + c * 3, ky + r * 2, 2, 1, red ? 'rojo' : 'crema', red ? 2 : 4);
      b.px(fx + 3 + c * 3, ky + r * 2, red ? 'rojo' : 'crema', red ? 1 : 3);
    }
  }
  // The «message waiting» light, always on: a red bulb at the top right of the front, blinking.
  const lit = bob === 1 || ring;
  b.rect(fx + fw - 4, y0 + 2, 2, 2, 'rojo', lit ? 0 : 1);
  b.raw(fx + fw - 4, y0 + 2, lit ? SHINE : [255, 176, 160, 255]);
  // Wear: a crack on the corner, a coffee ring on the top.
  b.px(fx + fw - 1, y0 + fh - 4, 'crema', 5);
  b.px(fx + fw - 2, y0 + fh - 3, 'crema', 5);
  for (const [i, j] of [[0, 0], [1, -1], [2, 0], [1, 1]] as const) b.px(fx + 18 + i, ty + 2 + j, 'crema', 3);
  // Hands: yellowed plastic, floating at the front; up when it rings, pointing back when it passes you on.
  if (look === 'pass') glove(b, fx - depth - 4, y0 - 2, 'crema');
  else glove(b, fx + fw + 1, y0 + (ring ? -2 : 4), 'crema');
  if (look !== 'pass') glove(b, fx + fw - 2, y0 + (ring ? -4 : 7), 'crema');
  else glove(b, fx + fw + 1, y0 + 5, 'crema');
  p.stamp(b, 0, 0);
  const out = p.outline();
  if (ring) {
    // The ring: little arcs either side of the head.
    const c = look === 'ring0' ? SHINE : ([255, 217, 90, 255] as const);
    for (const [x, y] of [[fx + fw + 6, ty - 1], [fx + fw + 7, ty], [fx + fw + 7, ty + 1], [fx + fw + 6, ty + 2], [bx + 1, ty - 4], [bx, ty - 3], [bx, ty - 2]] as const) {
      if (x >= 0 && x < PHONE_W && y >= 0) out.set(x, y, c);
    }
  }
  return out;
}

/** The phone's frames (PHONE_FRAMES): 0-1 standing, 2 crouching, 3 in the air, 4-5 ringing, 6 passing you on. */
export function makeTelefonoNuevoFrames(): Canvas[] {
  return [
    makeTelefonoNuevo('stand', 0),
    makeTelefonoNuevo('stand', 1),
    makeTelefonoNuevo('crouch'),
    makeTelefonoNuevo('air'),
    makeTelefonoNuevo('ring0'),
    makeTelefonoNuevo('ring1'),
    makeTelefonoNuevo('pass'),
  ];
}
