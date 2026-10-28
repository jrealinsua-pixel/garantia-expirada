// Pixel canvas shared by the sprite tools (Node) and the runtime room painter (browser).
// Port of the Canvas class in tools/referencia/build.py; colour blending matches it bit for bit.

export type RGBA = readonly [number, number, number, number];
export const TRANSPARENT: RGBA = [0, 0, 0, 0];

/** Python's round(): half to even. Needed so blended pixels match the reference exactly. */
export function pyRound(v: number): number {
  const f = Math.floor(v);
  const diff = v - f;
  if (Math.abs(diff - 0.5) < 1e-9) return f % 2 === 0 ? f : f + 1;
  return Math.round(v);
}

export function hx(h: string, a = 255): RGBA {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), a];
}

export class Canvas {
  readonly w: number;
  readonly h: number;
  p: RGBA[][];

  constructor(w: number, h: number, fill: RGBA = TRANSPARENT) {
    this.w = w;
    this.h = h;
    this.p = [];
    for (let y = 0; y < h; y++) {
      const row: RGBA[] = [];
      for (let x = 0; x < w; x++) row.push(fill);
      this.p.push(row);
    }
  }

  get(x: number, y: number): RGBA {
    return this.p[y]![x]!;
  }

  set(x: number, y: number, c: RGBA | null | undefined): void {
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    if (c[3] === 255) {
      this.p[y]![x] = c;
      return;
    }
    const d = this.p[y]![x]!;
    const a = c[3] / 255;
    this.p[y]![x] = [
      pyRound(c[0] * a + d[0] * (1 - a)),
      pyRound(c[1] * a + d[1] * (1 - a)),
      pyRound(c[2] * a + d[2] * (1 - a)),
      d[3] === 255 ? 255 : Math.max(d[3], c[3]),
    ];
  }

  /** Overwrite without blending. */
  put(x: number, y: number, c: RGBA): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.p[y]![x] = c;
  }

  rect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
  }

  /** Draw another canvas on top, skipping fully transparent pixels. */
  blit(src: Canvas, x: number, y: number): void {
    for (let j = 0; j < src.h; j++) {
      for (let i = 0; i < src.w; i++) {
        const c = src.p[j]![i]!;
        if (c[3] > 0) this.set(x + i, y + j, c);
      }
    }
  }

  clone(): Canvas {
    const out = new Canvas(this.w, this.h);
    out.p = this.p.map((r) => r.slice());
    return out;
  }
}

export function scaled(cv: Canvas, k: number): Canvas {
  const out = new Canvas(cv.w * k, cv.h * k);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.p[y]![x] = cv.p[Math.floor(y / k)]![Math.floor(x / k)]!;
  return out;
}
