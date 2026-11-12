// The achievements' seal (M14 (l2)): the «Mérito» rosette of the Catálogo de siniestros and of the
// notice that comes up when one is earned. One frame; the screens darken it while it is not earned.
import { Canvas } from '../../src/art/canvas.ts';
import { CREAM, RED, WHITE, YEL, outline } from '../../src/art/lib.ts';

export const SEAL_W = 26;
export const SEAL_H = 30;

/**
 * A cheap gold-foil rosette (26 x 30): a serrated round seal with a raised rim, an embossed tick in
 * the middle and «light» from the top left; two red ribbon tails cut in a V hang under it, one of
 * them with the cardboard price tag still tied on (it was on offer, like everything).
 */
export function makeMeritSeal(): Canvas {
  const cv = new Canvas(SEAL_W, SEAL_H);
  const cx = 12.5;
  const cy = 11.5;
  // The ribbon tails first (the seal covers their top): from under the seal, down and apart.
  for (const side of [-1, 1]) {
    for (let y = 14; y < SEAL_H; y++) {
      const mid = cx + side * (3 + (y - 14) * 0.32);
      const tip = y >= SEAL_H - 3 ? SEAL_H - 1 - y : 3; // the V notch at the end
      for (let x = Math.round(mid - 2); x <= Math.round(mid + 2); x++) {
        if (y >= SEAL_H - 3 && Math.abs(x - mid) < 1.6 - tip * 0.5) continue;
        const shade = x - mid < -1 ? RED[0]! : x - mid > 1 ? RED[2]! : RED[1]!;
        cv.set(x, y, side > 0 && x - mid > 1 ? RED[3]! : shade);
      }
    }
  }
  // The seal: a disc with 14 points round it.
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < SEAL_W; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const edge = 10.2 + 1.3 * Math.cos(a * 14);
      if (d > edge) continue;
      // Light from the top left: the rim bright there and dark at the bottom right.
      const lit = -(dx + dy) / (d || 1);
      let c = YEL[1]!;
      if (d > 8.6) c = lit > 0.35 ? YEL[0]! : lit < -0.35 ? YEL[3]! : YEL[2]!;
      else if (d > 7.4) c = lit > 0 ? YEL[2]! : YEL[0]!; // the groove inside the rim
      else if (lit > 0.55 && d > 4.5) c = YEL[0]!;
      cv.set(x, y, c);
    }
  }
  // The embossed tick in the middle: dark stroke with a light edge under it.
  const tick: [number, number][] = [[8, 11], [9, 12], [10, 13], [11, 14], [12, 13], [13, 12], [14, 11], [15, 10], [16, 9]];
  for (const [x, y] of tick) {
    cv.set(x, y, YEL[3]!);
    cv.set(x, y - 1, YEL[3]!);
    cv.set(x, y + 1, YEL[0]!);
  }
  // A glint on the foil.
  cv.set(7, 6, WHITE);
  cv.set(8, 5, WHITE);
  cv.set(7, 5, YEL[0]!);
  // The price tag tied to the right tail: a cardboard rectangle with its string and a red line.
  cv.rect(19, 24, 5, 4, CREAM[1]!);
  cv.rect(19, 24, 5, 1, CREAM[0]!);
  cv.rect(19, 27, 5, 1, CREAM[2]!);
  cv.set(20, 25, RED[1]!);
  cv.set(21, 25, RED[1]!);
  cv.set(22, 26, CREAM[3]!);
  cv.set(18, 23, CREAM[2]!);
  return outline(cv);
}
