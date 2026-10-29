// Small layout helpers without Phaser (tests drive them directly).

/** A label: centred on `x`, standing on `y` (its bottom), `w` by `h` pixels. */
export interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: LabelBox, b: LabelBox): boolean => Math.abs(a.x - b.x) < (a.w + b.w) / 2 && a.y - a.h < b.y && b.y - b.h < a.y;

/**
 * Where a new label goes so it does not cover any label already up: the same spot if it is free,
 * else straight above whatever it would cover (it climbs until it finds room). Returns its bottom y.
 */
export function stackAbove(placed: readonly LabelBox[], box: LabelBox, gap = 1): number {
  const b = { ...box };
  for (let tries = 0; tries < 12; tries++) {
    const hit = placed.find((p) => overlaps(p, b));
    if (!hit) break;
    b.y = hit.y - hit.h - gap;
  }
  return b.y;
}
