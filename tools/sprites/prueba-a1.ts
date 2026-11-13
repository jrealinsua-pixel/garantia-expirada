// M14c (a1): three test sprites in the new style (the Toaster, the Vacuum and a warehouse floor
// tile), drawn next to the approved old ones. Writes art/prueba/. Not part of `npm run sprites`:
// nothing here goes into the game yet; (a2) moves the shading helpers into src/art/ and (a4)–(a8)
// redraw the real sheets.
//
//   node tools/sprites/prueba-a1.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, hx, scaled, TRANSPARENT, type RGBA } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, mix, toneAt, type Material, type Ramp6 } from '../../src/art/paleta.ts';
import { stencil } from '../../src/art/warehouse.ts';
import { decodePng, encodePng } from './png.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const M = MATERIALS;
/** Light direction (x right, y down, z towards the viewer): from the top left and the front. */
const LIGHT = norm([-0.5, -0.65, 0.58]);

function norm(v: readonly [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

/**
 * A sprite being painted: the colours plus, for each pixel, which material it is. The selective
 * outline needs the material: around a lit edge it is that material's own darkest tone, and
 * only on the shadow side (below and right) is it ink.
 */
export class Paint {
  readonly cv: Canvas;
  readonly mat: (Material | null)[][];
  constructor(w: number, h: number) {
    this.cv = new Canvas(w, h);
    this.mat = Array.from({ length: h }, () => new Array<Material | null>(w).fill(null));
  }
  px(x: number, y: number, m: Material, tone: number): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.cv.w || y >= this.cv.h) return;
    const R = M[m] as Ramp6;
    this.cv.put(x, y, R[Math.max(0, Math.min(R.length - 1, tone))]!);
    this.mat[y]![x] = m;
  }
  rect(x: number, y: number, w: number, h: number, m: Material, tone: number): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, m, tone);
  }
  /** A raw colour that is not part of a ramp (eyes, glints). Keeps the material under it. */
  raw(x: number, y: number, c: RGBA): void {
    this.cv.put(x, y, c);
  }
  erase(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.cv.w || y >= this.cv.h) return;
    this.cv.put(x, y, TRANSPARENT);
    this.mat[y]![x] = null;
  }
  filled(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.cv.w && y < this.cv.h && this.cv.get(x, y)[3] > 0;
  }
  /**
   * Shade an ellipsoid (centre, radii) with the light: normals from the sphere equation, ordered
   * dithering only on the band between two tones. `z` squashes the bulge (0.5 = flatter).
   */
  ellipsoid(cx: number, cy: number, rx: number, ry: number, m: Material, o: { z?: number; dither?: number; bias?: number; spec?: boolean } = {}): void {
    const R = M[m] as Ramp6;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const nz = Math.sqrt(1 - d) * (o.z ?? 1);
        const n = norm([nx, ny, nz]);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const light = 0.12 + lit * 0.95 + (o.bias ?? 0);
        this.px(x, y, m, toneAt(R, light, x, y, o.dither ?? 0.35));
        if (o.spec && lit > 0.97) this.raw(x, y, SHINE);
      }
    }
  }
  /** A horizontal cylinder (a barrel, a hose): the tone depends only on the row. */
  cylinderH(x: number, y: number, w: number, h: number, m: Material): void {
    const R = M[m] as Ramp6;
    for (let j = 0; j < h; j++) {
      const ny = ((j + 0.5) / h) * 2 - 1;
      const n = norm([0, ny, Math.sqrt(Math.max(0, 1 - ny * ny))]);
      const lit = Math.max(0, n[1] * LIGHT[1] + n[2] * LIGHT[2]);
      for (let i = 0; i < w; i++) this.px(x + i, y + j, m, toneAt(R, 0.1 + lit, x + i, y + j, 0));
    }
    this.px(x + 1, y + 1, m, 0);
    this.px(x + 2, y + 1, m, 0);
  }
  /** Selective outline. Returns the finished canvas. */
  outline(): Canvas {
    const out = this.cv.clone();
    const { w, h } = this.cv;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.filled(x, y)) continue;
        // Neighbours: the shape lies left/above this pixel → it is on the shape's shadow side.
        const shadowSide = this.filled(x - 1, y) || this.filled(x, y - 1);
        let m: Material | null = null;
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]] as const) {
          if (this.filled(x + dx, y + dy)) {
            m = this.mat[y + dy]![x + dx] ?? m;
            if (!m) m = 'goma';
            break;
          }
        }
        if (!m) continue;
        const R = M[m] as Ramp6;
        out.put(x, y, shadowSide ? INK : mix(R[R.length - 1]!, INK, 0.45));
      }
    }
    return out;
  }
}

/** Floor shadow: a violet-tinted, see-through ellipse (never black). */
function floorShadow(cv: Canvas, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) cv.set(x, y, [24, 14, 44, d < 0.4 ? 80 : 45]);
    }
  }
}

/** Glove: a small shaded ball, the hands still float (no arms). */
function glove(p: Paint, x: number, y: number, m: Material = 'goma'): void {
  p.ellipsoid(x + 2, y + 2, 2.2, 2.2, m, { dither: 0 });
}

/** Short legs and shoes: a stride of `xb` (back) and `xf` (front). */
function legs(p: Paint, xb: number, xf: number, y: number, L: number, shoe: Material): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    p.rect(x + 1, y, 2, L, 'goma', back ? 4 : 2);
    p.px(x + 1, y, 'goma', back ? 5 : 3);
    p.px(x + 2, y + L - 1, 'goma', back ? 3 : 1);
    const yb = y + L;
    const sw = back ? 5 : 6;
    // Sneaker: rubber sole, coloured upper with a lit toe cap and a lace.
    p.rect(x, yb, sw, 2, shoe, back ? 3 : 2);
    p.rect(x + 1, yb, sw - 2, 1, shoe, back ? 2 : 1);
    p.px(x + sw - 2, yb, shoe, back ? 1 : 0);
    p.rect(x, yb + 2, sw, 1, 'acero', back ? 3 : 1);
    p.px(x + 2, yb, 'acero', back ? 2 : 0);
  }
}

// ---------------------------------------------------------------------------------------------
// The Toaster

export function toaster(): Canvas {
  const W = 48;
  const H = 50;
  const p = new Paint(W, H);
  // Cord first (behind everything): from the back of the base, curling to the plug on the floor.
  const cord: Array<[number, number]> = [[12, 34], [11, 35], [10, 36], [9, 37], [8, 38], [7, 39], [6, 40], [5, 41], [5, 42], [4, 43], [3, 43]];
  for (const [i, [x, y]] of cord.entries()) p.px(x, y, 'goma', i % 3 === 0 ? 2 : 3);
  p.rect(0, 42, 3, 3, 'acero', 2);
  p.px(0, 42, 'acero', 0);
  p.px(2, 44, 'acero', 4);
  p.px(0, 41, 'laton', 1);
  p.px(2, 41, 'laton', 2);

  glove(p, 7, 25); // back hand, behind the body
  legs(p, 15, 23, 36, 4, 'rojo');

  // Crumb tray / base: dark rubber with a yellow strip and three vent holes.
  p.rect(14, 32, 16, 4, 'goma', 3);
  p.rect(14, 32, 16, 1, 'goma', 1);
  p.rect(15, 34, 14, 1, 'amarillo', 2);
  for (const x of [17, 21, 25]) p.px(x, 34, 'amarillo', 4);
  p.rect(14, 35, 16, 1, 'goma', 5);

  // Body: a rounded box in three quarters. Side face (left, in shade), front face (right, the
  // face), top face (the most lit). 28 px wide.
  const X0 = 7;
  const SW = 7; // side face width
  const X1 = 35; // right edge (inclusive)
  const TOP = 10; // top face starts
  const TH = 5; // top face height
  const BOT = 32; // bottom edge (exclusive)
  const FY = TOP + TH; // front face top
  // Clean bands of tone with a single checkered row where two meet: on big flat faces a wide
  // dither reads as dirt, so it is only for the seams.
  // Top face: a skewed band (its far edge is offset right), the most lit face.
  for (let j = 0; j < TH; j++) {
    const off = Math.floor((TH - j) / 2);
    for (let x = X0 + off; x <= X1 - (j === 0 ? 1 : 0); x++) {
      const tone = j === 0 ? 2 : x < X0 + off + 2 ? 1 : x < X0 + 14 ? 0 : 1;
      p.px(x, TOP + j, 'acero', tone);
    }
  }
  // Rim where the top meets the front: a bright chamfer line.
  for (let x = X0 + SW; x <= X1; x++) p.px(x, FY, 'acero', x < X1 - 1 ? 0 : 1);
  // Side face, in shade: tone 3 above, 4 below, a checkered seam between them.
  const SEAM = FY + 9;
  for (let y = FY; y < BOT; y++) {
    for (let x = X0; x < X0 + SW; x++) {
      const tone = y < SEAM ? 3 : y > SEAM ? 4 : (x + y) % 2 ? 3 : 4;
      p.px(x, y, 'acero', x === X0 ? tone + 1 : tone);
    }
  }
  p.rect(X0, FY, SW, 1, 'acero', 2);
  // Bevel between side and front: a lit rounded edge.
  for (let y = FY + 1; y < BOT; y++) p.px(X0 + SW, y, 'acero', y < FY + 8 ? 1 : 2);
  // Front face: chrome. Chrome is a mirror, so it is drawn as what it reflects: the bright
  // ceiling above a sharp horizon, the darker room below it, and the floor bounce at the bottom.
  const HZ = FY + 7; // horizon
  for (let y = FY + 1; y < BOT; y++) {
    for (let x = X0 + SW + 1; x <= X1; x++) {
      const right = x > X1 - 6;
      let tone: number;
      if (y < HZ) tone = right ? 2 : 1;
      else if (y < BOT - 3) tone = right ? 3 : 2;
      else tone = 4;
      if (y >= BOT - 3 && y < BOT - 1 && !right) tone = 3; // floor bounce
      p.px(x, y, 'acero', tone);
    }
  }
  // The window reflected twice above the horizon, softer below it.
  for (let y = FY + 2; y < BOT - 4; y++) {
    p.px(X0 + SW + 3, y, 'acero', y < HZ ? 0 : 1);
    if (y < HZ) p.px(X0 + SW + 5, y, 'acero', 0);
  }
  // Right edge rounded away from the light.
  for (let y = FY + 1; y < BOT; y++) p.px(X1, y, 'acero', 4);
  for (let x = X0 + SW + 1; x <= X1; x++) p.px(x, BOT - 1, 'acero', 5);
  p.rect(X0, BOT - 1, SW + 1, 1, 'acero', 6);
  // Round the corners.
  for (const [x, y] of [[X0, TOP + 3], [X0, TOP + 4], [X0 + 1, TOP + 3], [X1, TOP], [X1, BOT - 1], [X0, BOT - 1]] as const) p.erase(x, y);

  // Slots and toast. The golden slice sticks up proud; the burnt one sits lower and smokes.
  const slots: Array<[number, number, Material]> = [[17, 1, 'tostada'], [25, 3, 'quemada']];
  for (const [sx, top, m] of slots) {
    const R = M[m] as Ramp6;
    const n = R.length;
    for (let y = top; y < TOP + 2; y++) {
      for (let x = sx; x < sx + 5; x++) {
        const edge = y === top || x === sx + 4;
        p.px(x, y, m, edge ? n - 2 : x === sx ? 1 : y < top + 3 ? 1 : 2);
      }
    }
    // Crust on top, crumbs of texture.
    p.rect(sx, top, 5, 1, m, n - 3);
    p.px(sx, top, m, n - 2);
    p.px(sx + 4, top, m, n - 1);
    p.px(sx + 2, top + 2, m, 0);
    p.px(sx + 3, top + 4, m, 3);
    p.px(sx + 1, top + 5, m, 3);
    // Slot: a dark lip in front of the slice.
    p.rect(sx - 1, TOP + 2, 7, 1, 'acero', 6);
    p.rect(sx - 1, TOP + 3, 7, 1, 'acero', 3);
  }

  // Side face details: the lever (a groove with a red knob) and the browning dial.
  p.rect(X0 + 2, FY + 2, 1, 10, 'acero', 6);
  p.ellipsoid(X0 + 3, FY + 5.5, 1.8, 1.4, 'rojo', { dither: 0 });
  p.ellipsoid(X0 + 3.5, FY + 13.5, 1.6, 1.6, 'acero', { dither: 0, bias: 0.15 });
  p.px(X0 + 4, FY + 12, 'rojo', 2);

  // Face on the front: tired, fed-up eyes under heavy lids and a crooked grimace.
  for (const [ex, wide] of [[22, 3], [29, 3]] as const) {
    p.rect(ex, 19, wide, 4, 'acero', 6);
    p.raw(ex, 19, INK);
    p.raw(ex + 1, 19, INK);
    p.raw(ex + 2, 19, INK);
    p.rect(ex, 20, wide, 1, 'acero', 4); // heavy lid
    p.raw(ex + 1, 21, SHINE);
    p.rect(ex - 1, 18, wide + 2, 1, 'acero', 5); // brow
    p.px(ex + (ex === 22 ? -1 : wide), 17, 'acero', 5); // the brows tilt in: annoyed
    p.rect(ex, 23, wide, 1, 'acero', 1); // bag under the eye catches the light
  }
  p.rect(26, 27, 4, 1, 'acero', 6);
  p.px(25, 28, 'acero', 6);
  p.px(30, 26, 'acero', 6);
  p.px(27, 28, 'acero', 2);

  // Price sticker, half peeled: -70 %.
  p.rect(16, 24, 5, 4, 'amarillo', 1);
  p.rect(16, 27, 5, 1, 'amarillo', 3);
  p.px(20, 24, 'amarillo', 0);
  p.rect(17, 25, 3, 1, 'rojo', 2);
  p.px(16, 24, 'amarillo', 3);
  // Rust and a dent: a few specks, never a carpet of them.
  for (const [x, y, t] of [[33, 17, 1], [34, 18, 2], [12, 13, 1], [16, 30, 2], [9, 28, 1]] as const) p.px(x, y, 'oxido', t);
  p.px(32, 23, 'acero', 5);
  p.px(33, 24, 'acero', 1);

  // Front hand holding the new Secador (the game draws the gun apart; it is here to compare).
  dryer(p, 25, 27);
  glove(p, 26, 33);

  const o = p.outline();
  // Shadow under the feet, behind the outline.
  const out = new Canvas(W, H);
  floorShadow(out, 23, 45, 11, 2);
  out.blit(o, 0, 0);
  // Smoke from the burnt slice (see-through, violet-grey) and crumbs on the floor.
  const smoke: Array<[number, number, number]> = [[27, 0, 70], [28, 1, 110], [26, 1, 90], [29, 0, 50]];
  for (const [x, y, a] of smoke) out.set(x, y, [170, 160, 190, a]);
  for (const [x, y] of [[36, 46], [11, 47], [31, 48]] as const) out.set(x, y, M.tostada[2]!);
  return out;
}

/** The Secador (hair dryer), the toaster's first gun: pink round housing, barrel, hot nozzle. */
function dryer(p: Paint, x: number, y: number): void {
  // Handle first, down and slightly back, with its switch.
  for (let j = 0; j < 6; j++) {
    const hx0 = x + 3 - Math.floor(j / 3);
    p.rect(hx0, y + 6 + j, 3, 1, 'rosa', 3);
    p.px(hx0, y + 6 + j, 'rosa', 2);
    p.px(hx0 + 2, y + 6 + j, 'rosa', 4);
  }
  p.px(x + 4, y + 8, 'rojo', 1);
  // Barrel: a horizontal cylinder, the light on its upper third.
  p.cylinderH(x + 6, y + 1, 9, 5, 'rosa');
  // Nozzle: dark rubber ring and the orange glow inside.
  p.rect(x + 15, y + 1, 2, 5, 'goma', 2);
  p.rect(x + 15, y + 1, 2, 1, 'goma', 0);
  p.rect(x + 15, y + 5, 2, 1, 'goma', 4);
  p.rect(x + 17, y + 2, 1, 3, 'amarillo', 1);
  p.px(x + 17, y + 3, 'amarillo', 0);
  // Round back housing with the air intake grille.
  p.ellipsoid(x + 4, y + 3.5, 4, 4, 'rosa', { dither: 0, spec: true });
  for (const [gx, gy] of [[x + 3, y + 2], [x + 5, y + 2], [x + 2, y + 4], [x + 4, y + 4], [x + 3, y + 6]] as const) p.px(gx, gy, 'rosa', 5);
}

// ---------------------------------------------------------------------------------------------
// The Vacuum (Aspirador), a plant 1 enemy

export function vacuum(): Canvas {
  const W = 42;
  const H = 42;
  const p = new Paint(W, H);
  // Hose behind: from the body's front, an arc down to the nozzle on the floor.
  const hose: Array<[number, number]> = [[31, 18], [33, 19], [34, 20], [35, 22], [35, 24], [35, 26], [34, 28], [34, 30], [33, 32]];
  for (const [i, [x, y]] of hose.entries()) {
    p.rect(x, y, 2, 2, 'acero', i % 2 ? 2 : 4);
    p.px(x, y, 'acero', i % 2 ? 1 : 3);
  }
  glove(p, 4, 22, 'azul');
  legs(p, 12, 19, 31, 4, 'azul');
  // Wheels peeking under the body.
  for (const wx of [9, 27]) p.ellipsoid(wx, 30, 2, 2, 'goma', { dither: 0 });
  // Canister body: a fat lying capsule, shaded as an ellipsoid; the handle on top.
  p.rect(14, 2, 10, 2, 'goma', 2);
  p.rect(14, 2, 10, 1, 'goma', 0);
  p.rect(14, 2, 2, 6, 'goma', 2);
  p.rect(22, 2, 2, 6, 'goma', 3);
  p.ellipsoid(19, 18, 15, 12, 'azul', { z: 0.85, dither: 0.25, spec: true });
  // A darker band round the middle (where the two shells close) with screws.
  for (let x = 5; x <= 33; x++) {
    const k = (x + 0.5 - 19) / 15;
    const by = Math.round(18 + 7 * Math.sqrt(Math.max(0, 1 - k * k)));
    if (p.filled(x, by)) p.px(x, by, 'azul', 6);
    if (p.filled(x, by + 1)) p.px(x, by + 1, 'azul', x < 19 ? 3 : 4);
  }
  for (const sx of [10, 28]) p.px(sx, Math.round(18 + 7 * Math.sqrt(1 - ((sx + 0.5 - 19) / 15) ** 2)) - 1, 'acero', 1);
  // The dust window on the side, stuffed with the bag (brown, grubby).
  p.rect(8, 15, 6, 7, 'azul', 6);
  p.rect(9, 16, 4, 5, 'quemada', 0);
  p.px(9, 16, 'tostada', 3);
  p.px(11, 18, 'quemada', 1);
  p.px(12, 19, 'quemada', 1);
  p.px(10, 20, 'oxido', 2);
  p.px(12, 16, 'azul', 1);
  // The eye: a big red visor across the front, glowing, with an angry slanted lid.
  p.rect(18, 12, 14, 7, 'azul', 6);
  for (let x = 19; x < 31; x++) for (let y = 13; y < 18; y++) p.px(x, y, 'rojo', 4);
  p.ellipsoid(26, 15.5, 4.2, 2.8, 'rojo', { dither: 0, bias: 0.35 });
  p.rect(25, 15, 2, 1, 'amarillo', 1); // the hot centre of the eye
  p.raw(28, 14, SHINE);
  p.raw(29, 14, SHINE);
  p.raw(20, 16, SHINE);
  for (let i = 0; i < 13; i++) p.px(19 + i, 12 + Math.floor(i / 4), 'azul', 6); // the lid
  for (let i = 0; i < 13; i++) p.px(19 + i, 11 + Math.floor(i / 4), 'azul', 2);
  // Grille mouth.
  for (let x = 22; x < 31; x += 2) p.px(x, 21, 'azul', 6);
  // Repair tag hanging from the handle: a cream label with a red stripe.
  p.px(13, 3, 'acero', 3);
  p.px(12, 4, 'acero', 3);
  p.rect(7, 5, 5, 4, 'acero', 0);
  p.rect(8, 6, 3, 1, 'rojo', 2);
  p.px(11, 8, 'acero', 2);
  for (const [x, y] of [[30, 9], [7, 21], [16, 27]] as const) p.px(x, y, 'oxido', 1);
  // Nozzle on the floor, in front.
  p.rect(30, 34, 11, 3, 'acero', 2);
  p.rect(30, 34, 11, 1, 'acero', 0);
  p.rect(30, 36, 11, 1, 'acero', 5);
  for (let x = 31; x < 40; x += 2) p.px(x, 36, 'goma', 5);
  glove(p, 31, 21, 'azul');
  const o = p.outline();
  const out = new Canvas(W, H);
  floorShadow(out, 21, 38, 15, 2);
  out.blit(o, 0, 0);
  for (const [x, y, a] of [[4, 37, 90], [2, 36, 60], [6, 39, 70]] as const) out.set(x, y, [170, 160, 190, a]);
  return out;
}

// ---------------------------------------------------------------------------------------------
// A warehouse floor tile (24 × 24)

export function floorTile(): Canvas {
  const S = 24;
  const p = new Paint(S, S);
  const F = M.suelo;
  // Base plate with a very soft, dithered pool of light from the top left.
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - 8, y - 7) / 22;
      p.px(x, y, 'suelo', toneAt(F, 0.6 - d * 0.16, x, y, 0.3));
    }
  }
  // Bevel: lit top and left edges, shadowed bottom and right, and the dark joint.
  for (let i = 0; i < S; i++) {
    p.px(i, 0, 'suelo', 6);
    p.px(0, i, 'suelo', 6);
    if (i > 0) {
      p.px(i, 1, 'suelo', 1);
      p.px(1, i, 'suelo', 1);
      p.px(i, S - 1, 'suelo', 4);
      p.px(S - 1, i, 'suelo', 4);
    }
  }
  p.px(1, 1, 'suelo', 0);
  // Tread plate: little raised diagonal lozenges, lit on top, shadowed below.
  for (let y = 7; y < S - 6; y += 5) {
    for (let x = 7 + ((y - 7) / 5) * 3; x < S - 6; x += 6) {
      p.px(x, y, 'suelo', 1);
      p.px(x + 1, y + 1, 'suelo', 4);
    }
  }
  // Rivets in the corners: a lit cap and a shadow.
  for (const [x, y] of [[3, 3], [S - 5, 3], [3, S - 5], [S - 5, S - 5]] as const) {
    p.rect(x, y, 2, 2, 'suelo', 2);
    p.px(x, y, 'suelo', 0);
    p.px(x + 1, y + 1, 'suelo', 5);
    p.px(x + 2, y + 1, 'suelo', 6);
    p.px(x + 1, y + 2, 'suelo', 6);
  }
  // A scratch and a worn patch where the trolleys go.
  for (const [x, y] of [[13, 15], [14, 15], [15, 16], [16, 16], [17, 17]] as const) p.px(x, y, 'suelo', 1);
  for (const [x, y] of [[14, 16], [16, 17]] as const) p.px(x, y, 'suelo', 5);
  const cv = p.cv;
  // An old oil stain: see-through violet-brown, not black.
  for (let y = 9; y < 14; y++) {
    for (let x = 14; x < 21; x++) {
      if (((x - 17) / 3.4) ** 2 + ((y - 11) / 2.2) ** 2 <= 1) cv.set(x, y, [40, 20, 46, 70]);
    }
  }
  cv.set(16, 10, [150, 120, 190, 60]);
  return cv;
}

// ---------------------------------------------------------------------------------------------
// The comparison sheet: before (approved style) and after (new style), and both in context.

function tileOld(): Canvas {
  // A plain tile cut from the approved Returns room (the reference of plant 1).
  const room = decodePng(readFileSync(join(ROOT, 'art', 'referencia', 'sala-devoluciones.png')));
  const out = new Canvas(24, 24);
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) out.put(x, y, room.get(OLD_TILE[0] + x, OLD_TILE[1] + y));
  return out;
}
/** Where a plain floor tile sits in art/referencia/sala-devoluciones.png. */
const OLD_TILE = [72, 96] as const;

function tiled(tile: Canvas, w: number, h: number): Canvas {
  const out = new Canvas(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.put(x, y, tile.get(x % tile.w, y % tile.h));
  return out;
}

export function comparison(): Canvas {
  const old = {
    hero: decodePng(readFileSync(join(ROOT, 'art', 'referencia', 'tostadora.png'))),
    vac: decodePng(readFileSync(join(ROOT, 'art', 'referencia', 'aspirador.png'))),
    tile: tileOld(),
  };
  const neu = { hero: toaster(), vac: vacuum(), tile: floorTile() };
  // Each row: the hero and the vacuum standing on their own floor, at 1× (game size), and then
  // the three of them at 3× so the pixels can be judged.
  const K = 3;
  const rowH = 54 * K + 20;
  const sheet = new Canvas(2 + 96 + 8 + (48 + 42 + 24 + 8) * K + 8, 14 + rowH * 2, hx('#151221'));
  const label = hx('#f4f1e8');
  const rows: Array<[string, typeof old]> = [['ANTES (ESTILO APROBADO)', old], ['AHORA (M14C, PRUEBA)', neu]];
  for (const [i, [name, s]] of rows.entries()) {
    const y0 = 14 + i * rowH;
    stencil(sheet, 4, y0 - 9, name, label);
    // In context, 1×: a patch of floor with both.
    const floor = tiled(s.tile, 96, 54 * K);
    floor.blit(s.hero, 8, 30);
    floor.blit(s.vac, 50, 34);
    sheet.blit(floor, 2, y0);
    // Zoomed.
    let x = 2 + 96 + 8;
    for (const c of [s.hero, s.vac, s.tile]) {
      const bg = tiled(s.tile, c.w, Math.max(c.h, 24));
      bg.blit(c, 0, 0);
      sheet.blit(scaled(bg, K), x, y0);
      x += c.w * K + 8;
    }
  }
  return sheet;
}

export function writeAll(): void {
  const dir = join(ROOT, 'art', 'prueba');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'tostadora.png'), encodePng(toaster()));
  writeFileSync(join(dir, 'aspirador.png'), encodePng(vacuum()));
  writeFileSync(join(dir, 'suelo.png'), encodePng(floorTile()));
  writeFileSync(join(dir, 'comparativa.png'), encodePng(comparison()));
}

if (import.meta.url === `file://${process.argv[1]}`) writeAll();
