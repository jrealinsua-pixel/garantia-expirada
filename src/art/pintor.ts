// M14c (a2): the painting tools of the new style (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo»).
// Pure code, no DOM: the sprite tools use it in Node and the game could use it in the browser.
//
// - Paint: a canvas that remembers which material each pixel is, so the outline can be selective.
// - Shading by normals: ellipsoids, horizontal cylinders and, for anything else, a height map
//   (`heightShade`): the normals come from the slopes, the tone from the light, the highlight
//   from a specular term, and ordered dithering only on the band between two tones.
// - Pixel-art antialiasing: the edge pixels a shape only half covers get the tone of the outline
//   side instead of a jagged step (`aa`).
// - The legibility checker (`legibility`, `silhouetteOverlap`): silhouette contrast against a
//   floor, how much is outline, tone count, and how alike two silhouettes are. The tests run it.

import { Canvas, TRANSPARENT, type RGBA } from './canvas.ts';
import { INK, MATERIALS, SHINE, contrast, luminance, mix, toneAt, type Material, type Ramp6 } from './paleta.ts';

const M = MATERIALS;
export type Vec3 = [number, number, number];

export function norm(v: readonly [number, number, number]): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Light direction (x right, y down, z towards the viewer): from the top left and the front. */
export const LIGHT = norm([-0.5, -0.65, 0.58]);
/** Half vector between the light and the viewer (0, 0, 1), for the specular highlight. */
const HALF = norm([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);

/** Diffuse and specular light for a normal: the shared lighting model of every shader here. */
export function lightAt(n: Vec3, bias = 0): { light: number; spec: number } {
  const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
  const sp = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]);
  return { light: 0.12 + lit * 0.95 + bias, spec: sp ** 40 };
}

/** Coverage (0–1) of a pixel by an ellipse, sampled 4 × 4. */
function coverage(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  let n = 0;
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 4; i++) {
      const nx = (x + (i + 0.5) / 4 - cx) / rx;
      const ny = (y + (j + 0.5) / 4 - cy) / ry;
      if (nx * nx + ny * ny <= 1) n++;
    }
  }
  return n / 16;
}

export interface ShadeOptions {
  /** Squashes the bulge (1 = round, 0.5 = flatter). */
  z?: number;
  /** Width of the dither band between two tones (0 = hard bands). */
  dither?: number;
  /** Extra light (positive) or shade (negative). */
  bias?: number;
  /** Paint the specular highlight in SHINE. */
  spec?: boolean;
  /**
   * Pixel-art antialiasing of the edge: pixels the shape covers only partly are painted one tone
   * darker than their neighbour (if at least `aa` of them is covered), instead of being left out.
   */
  aa?: number;
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
   * dithering only on the band between two tones.
   */
  ellipsoid(cx: number, cy: number, rx: number, ry: number, m: Material, o: ShadeOptions = {}): void {
    const R = M[m] as Ramp6;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) {
          if (o.aa !== undefined && coverage(x, y, cx, cy, rx, ry) >= o.aa) this.aaPixel(x, y, m, R);
          continue;
        }
        const nz = Math.sqrt(1 - d) * (o.z ?? 1);
        const n = norm([nx, ny, nz]);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const light = 0.12 + lit * 0.95 + (o.bias ?? 0);
        this.px(x, y, m, toneAt(R, light, x, y, o.dither ?? 0.35));
        if (o.spec && lit > 0.97) this.raw(x, y, SHINE);
      }
    }
  }
  /** Antialiasing pixel: one tone darker than the darkest painted neighbour of the same material. */
  private aaPixel(x: number, y: number, m: Material, R: Ramp6): void {
    if (this.filled(x, y)) return;
    let tone = -1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      if (!this.filled(x + dx, y + dy) || this.mat[y + dy]![x + dx] !== m) continue;
      const c = this.cv.get(x + dx, y + dy);
      const t = R.findIndex((r) => r[0] === c[0] && r[1] === c[1] && r[2] === c[2]);
      if (t >= 0) tone = Math.max(tone, t);
    }
    // Only next to the shape (the pass goes row by row, so the far side gets it too).
    if (tone >= 0) this.px(x, y, m, Math.min(R.length - 1, tone + 1));
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
  /**
   * The volume shader: shade a height map. `h(x, y)` is the height of the surface at a pixel
   * (in pixels, positive towards the viewer) or null where there is nothing; the normals come
   * from its slopes (central differences), so a dome, a dent, a rivet or a pillow shape are all
   * just a height function. `x0, y0, w, h` is the box to scan.
   */
  heightShade(x0: number, y0: number, w: number, hgt: number, height: (x: number, y: number) => number | null, m: Material, o: ShadeOptions = {}): void {
    const R = M[m] as Ramp6;
    const at = (x: number, y: number, fallback: number): number => height(x, y) ?? fallback;
    for (let y = y0; y < y0 + hgt; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const z = height(x, y);
        if (z === null) continue;
        const dx = (at(x + 1, y, z) - at(x - 1, y, z)) / 2;
        const dy = (at(x, y + 1, z) - at(x, y - 1, z)) / 2;
        const n = norm([-dx, -dy, o.z ?? 1]);
        const { light, spec } = lightAt(n, o.bias ?? 0);
        this.px(x, y, m, toneAt(R, light, x, y, o.dither ?? 0.35));
        if (o.spec && spec > 0.85) this.raw(x, y, SHINE);
      }
    }
  }
  /**
   * Copy another painting on top of this one, moved by (dx, dy), with its materials: a body
   * painted apart can bob over its legs and still get one outline round the whole figure.
   */
  stamp(other: Paint, dx: number, dy: number): void {
    for (let y = 0; y < other.cv.h; y++) {
      for (let x = 0; x < other.cv.w; x++) {
        if (!other.filled(x, y)) continue;
        const tx = x + dx;
        const ty = y + dy;
        if (tx < 0 || ty < 0 || tx >= this.cv.w || ty >= this.cv.h) continue;
        this.cv.put(tx, ty, other.cv.get(x, y));
        this.mat[ty]![tx] = other.mat[y]![x] ?? null;
      }
    }
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
export function floorShadow(cv: Canvas, cx: number, cy: number, rx: number, ry: number): void {
  for (let y = cy - ry; y <= cy + ry; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d <= 1) cv.set(x, y, [24, 14, 44, d < 0.4 ? 80 : 45]);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// The legibility checker

export interface Legibility {
  /** Opaque pixels (alpha 255): the body of the sprite. */
  area: number;
  /** Mean contrast (WCAG) between the silhouette's edge pixels and the floor. */
  edgeContrast: number;
  /** Share of the edge pixels darker than the floor (the outline holds the shape). */
  darkEdge: number;
  /** Distinct opaque colours: too few is flat, too many is noise. */
  colours: number;
  /** Share of the body that contrasts with the floor less than 1.5 (it melts into it). */
  melts: number;
}

/** How readable a sprite is on a floor colour. */
export function legibility(cv: Canvas, floor: RGBA): Legibility {
  let area = 0;
  let edges = 0;
  let edgeC = 0;
  let dark = 0;
  let melt = 0;
  const colours = new Set<string>();
  const fl = luminance(floor);
  const solid = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < cv.w && y < cv.h && cv.get(x, y)[3] === 255;
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      if (!solid(x, y)) continue;
      const c = cv.get(x, y);
      area++;
      colours.add(c.slice(0, 3).join());
      if (contrast(c, floor) < 1.5) melt++;
      if (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) {
        edges++;
        edgeC += contrast(c, floor);
        if (luminance(c) < fl) dark++;
      }
    }
  }
  return {
    area,
    edgeContrast: edges ? edgeC / edges : 0,
    darkEdge: edges ? dark / edges : 0,
    colours: colours.size,
    melts: area ? melt / area : 0,
  };
}

/**
 * How alike two silhouettes are (0 = nothing in common, 1 = the same shape): the overlap of their
 * opaque masks over their union, after aligning them by the bottom centre (where they stand).
 * For (a5) and (a6): enemies of the same plant should stay well under 0.8.
 */
export function silhouetteOverlap(a: Canvas, b: Canvas): number {
  const box = (cv: Canvas): { x0: number; x1: number; y1: number } => {
    let x0 = cv.w;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < cv.h; y++) {
      for (let x = 0; x < cv.w; x++) {
        if (cv.get(x, y)[3] !== 255) continue;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
    return { x0, x1, y1 };
  };
  const ba = box(a);
  const bb = box(b);
  const ox = Math.round((ba.x0 + ba.x1) / 2 - (bb.x0 + bb.x1) / 2);
  const oy = ba.y1 - bb.y1;
  let inter = 0;
  let uni = 0;
  const W = Math.max(a.w, b.w + Math.abs(ox)) + 2;
  const H = Math.max(a.h, b.h + Math.abs(oy)) + 2;
  for (let y = -Math.abs(oy) - 1; y < H; y++) {
    for (let x = -Math.abs(ox) - 1; x < W; x++) {
      const ia = x >= 0 && y >= 0 && x < a.w && y < a.h && a.get(x, y)[3] === 255;
      const xb = x - ox;
      const yb = y - oy;
      const ib = xb >= 0 && yb >= 0 && xb < b.w && yb < b.h && b.get(xb, yb)[3] === 255;
      if (ia && ib) inter++;
      if (ia || ib) uni++;
    }
  }
  return uni ? inter / uni : 0;
}
