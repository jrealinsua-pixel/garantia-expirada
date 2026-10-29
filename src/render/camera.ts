// Camera framing, pure (no Phaser): tests/camara.test.ts checks it.

/** A span along one axis, in room pixels. */
export interface Span {
  lo: number;
  hi: number;
}

/**
 * The scroll along one axis for a view `view` px long that wants to be at `want`: it always keeps
 * `keep` in the picture (the toaster, with room round it), and `also` too if both fit (the boss).
 * If they do not fit, it keeps `keep` and shows as much of `also` as it can.
 */
export function frameAxis(want: number, keep: Span, also: Span, view: number): number {
  const keepMin = keep.hi - view;
  const keepMax = keep.lo;
  const lo = Math.max(keepMin, also.hi - view);
  const hi = Math.min(keepMax, also.lo);
  if (lo <= hi) return Math.min(hi, Math.max(lo, want));
  // Both do not fit: as close to the other one as the toaster allows.
  return also.lo < keep.lo ? keepMin : keepMax;
}
