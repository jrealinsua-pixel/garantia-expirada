// Drawing helpers and palette ramps, ported from tools/referencia/build2.py and build4.py.
import { Canvas, hx, TRANSPARENT, type RGBA } from './canvas.ts';

export type Ramp = readonly RGBA[];
export const ramp = (...h: string[]): Ramp => h.map((c) => hx(c));

export const K = hx('#0e0c16');
export const WHITE = hx('#f4f1e8');
export const STEEL = ramp('#e4e8f0', '#b7bed0', '#858ea8', '#5a627c', '#3a4058');
export const DSTEEL = ramp('#838ca6', '#5d647e', '#434963', '#2c3048');
export const GLOVE = ramp('#6a708c', '#454a66', '#2e3250', '#1c1f36');
export const YEL = ramp('#fff1a8', '#f6c431', '#d9932a', '#8f5a1c');
export const RED = ramp('#ff8a70', '#e0453b', '#a42f37', '#6a1d2a');
export const RUSTR = ramp('#e0a060', '#b8683a', '#8a4528', '#5e2e1e');
export const BLUE = ramp('#a9cbf2', '#5f93d4', '#3f66a6', '#27447a');
export const BROWN = ramp('#d2b184', '#a98258', '#7a5a3c', '#4f3a28');
export const CREAM = ramp('#f4efdc', '#d6cdb2', '#a89f86', '#756e5a');
export const ICE = ramp('#ffffff', '#b6f1f0', '#69dbd8', '#3a9ea6');
export const CARD = ramp('#e2c797', '#b8935f', '#8f6c40', '#664a2c');
export const GLOW = hx('#ffb347');
export const GLOW2 = hx('#ff7a1f');
export const GREEN = hx('#58b45a');
export const CYAN = hx('#69dbd8');

export const TOPS = ramp('#f2f4f8', '#d3d8e4', '#aab1c4', '#7d8499');
export const PINK = ramp('#f7c0cc', '#e88fa4', '#bd6680', '#86435c');
export const TOASTC = ramp('#f2cf8c', '#d9a35a', '#a8702f', '#6b4220');
export const FRT = ramp('#ffffff', '#e2e7f0', '#b9c1d3', '#8a93ab');
export const SUITB = ramp('#5d6386', '#40445f', '#2c2f45', '#1b1d2e');
export const SNEAK = ramp('#f4f1e8', '#d64a3e', '#9e2f33', '#5e1d24');
export const OFFICE = ramp('#5a5f7a', '#262a3e', '#16182a', '#0e0c16');
export const RUBBER = ramp('#d6cdb2', '#a89f86', '#756e5a', '#4a4538');
export const PANTL = ramp('#6a708c', '#454a66', '#2e3250', '#1c1f36');
export const BURNT = ramp('#8a5a34', '#5c3a22', '#3e2616', '#24160c');
export const SMOKE: readonly RGBA[] = [
  [150, 150, 165, 200],
  [120, 120, 138, 170],
  [95, 95, 110, 140],
];

export function box(cv: Canvas, x: number, y: number, w: number, h: number, R: Ramp): void {
  cv.rect(x, y, w, h, R[1]!);
  cv.rect(x, y, w, 1, R[0]!);
  if (w > 2) {
    cv.rect(x, y, 1, h, R[0]!);
    cv.rect(x + w - 1, y, 1, h, R[2]!);
  }
  cv.rect(x, y + h - 1, w, 1, R[2]!);
  if (w > 2 && h > 2) cv.set(x + w - 1, y + h - 1, R[3]!);
}

export function ellipse(cv: Canvas, cx: number, cy: number, rx: number, ry: number, c: RGBA): void {
  for (let y = Math.trunc(cy - ry) - 1; y < Math.trunc(cy + ry) + 2; y++) {
    for (let x = Math.trunc(cx - rx) - 1; x < Math.trunc(cx + rx) + 2; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) cv.set(x, y, c);
    }
  }
}

/** 1 px black outline around every non-transparent pixel (4-neighbourhood). */
export function outline(cv: Canvas, color: RGBA = K): Canvas {
  const out = new Canvas(cv.w, cv.h);
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3] > 0) out.p[y]![x] = cv.get(x, y);
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      if (cv.get(x, y)[3] !== 0) continue;
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < cv.w && ny < cv.h && cv.get(nx, ny)[3] > 0) {
          out.p[y]![x] = color;
          break;
        }
      }
    }
  }
  return out;
}

export function clear(cv: Canvas, pts: ReadonlyArray<readonly [number, number]>): void {
  for (const [x, y] of pts) if (x >= 0 && y >= 0 && x < cv.w && y < cv.h) cv.p[y]![x] = TRANSPARENT;
}

/** 3/4 box seen from the front-right: light top face, dark side face on the left, front face on the right. */
export function cube(cv: Canvas, x: number, y: number, w: number, h: number, sw: number, th: number, F: Ramp, S: Ramp, T: Ramp): void {
  for (let j = 0; j < th; j++) {
    const off = Math.floor((th - j) / 2);
    cv.rect(x + off, y + j, w - off, 1, j ? T[1]! : T[0]!);
  }
  cv.rect(x, y + th, sw, h - th, S[1]!);
  cv.rect(x, y + th, 1, h - th, S[2]!);
  cv.rect(x + sw - 1, y + th, 1, h - th, S[3]!);
  cv.rect(x + sw, y + th, w - sw, h - th, F[1]!);
  cv.rect(x + sw, y + th, w - sw, 1, F[0]!);
  cv.rect(x + w - 1, y + th, 1, h - th, F[2]!);
  cv.rect(x + sw, y + h - 2, w - sw, 2, F[2]!);
  cv.rect(x, y + h - 1, sw, 1, S[3]!);
  clear(cv, [
    [x, y],
    [x + 1, y],
    [x, y + 1],
    [x + w - 1, y],
    [x + w - 1, y + h - 1],
    [x, y + h - 1],
  ]);
}

/** Floating rounded hand, 3x3 px. */
export function hand(cv: Canvas, x: number, y: number, R: Ramp = GLOVE): void {
  cv.rect(x, y, 3, 3, R[1]!);
  cv.set(x, y, R[0]!);
  cv.set(x + 2, y + 2, R[2]!);
}

/** Short legs of length L plus shoes. Back leg slightly behind, front leg mid-stride. */
export function feet(cv: Canvas, xb: number, xf: number, y: number, opts: { R?: Ramp; L?: number; leg?: Ramp; shoe?: Ramp } = {}): void {
  const R = opts.R ?? GLOVE;
  const L = opts.L ?? 4;
  const leg = opts.leg ?? PANTL;
  const shoe = opts.shoe ?? R;
  cv.rect(xb + 1, y, 2, L, leg[2]!);
  cv.set(xb + 1, y, leg[3]!);
  cv.rect(xf + 1, y, 2, L, leg[1]!);
  cv.set(xf + 1, y, leg[0]!);
  const yb = y + L;
  cv.rect(xb, yb, 4, 2, shoe[2]!);
  cv.set(xb, yb, shoe[1]!);
  cv.rect(xf, yb, 5, 2, shoe[1]!);
  cv.rect(xf, yb, 4, 1, shoe[0]!);
  cv.rect(xf, yb + 1, 5, 1, shoe[2]!);
}

export function pad(cv: Canvas, top: number): Canvas {
  const out = new Canvas(cv.w, cv.h + top);
  for (let y = 0; y < cv.h; y++) out.p[y + top] = cv.p[y]!.slice();
  return out;
}

export function flip(cv: Canvas): Canvas {
  const out = new Canvas(cv.w, cv.h);
  for (let y = 0; y < cv.h; y++) out.p[y] = cv.p[y]!.slice().reverse();
  return out;
}

/** Semi-transparent floor shadow ellipse. */
export function shadow(cv: Canvas, cx: number, cy: number, rx: number, ry: number, a = 105): void {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) cv.set(x, y, [8, 6, 16, a]);
    }
  }
}
