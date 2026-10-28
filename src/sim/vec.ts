export interface Vec {
  x: number;
  y: number;
}

export const len = (x: number, y: number): number => Math.hypot(x, y);

export function normalize(x: number, y: number): Vec {
  const l = Math.hypot(x, y);
  return l > 1e-9 ? { x: x / l, y: y / l } : { x: 0, y: 0 };
}

export const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Moves `v` towards `target` by at most `step`. */
export function approach(v: number, target: number, step: number): number {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const overlaps = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export const pointInRect = (px: number, py: number, r: Rect): boolean => px >= r.x && px < r.x + r.w && py >= r.y && py < r.y + r.h;
