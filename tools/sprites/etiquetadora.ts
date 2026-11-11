// Floor 5's weapons (M11 6c1): the Etiquetadora de Precios, its labels in flight and stuck on.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, CREAM, DSTEEL, GLOW, K, RED, WHITE, YEL, outline } from '../../src/art/lib.ts';

/**
 * Etiquetadora de Precios in the hand (18 x 11, the nozzle to the right): a blue plastic body
 * with the roll of labels on top at the back, the window with the price wheels (red digits), the
 * nozzle at the front with a label half out, and below the grip with the squeeze lever beside it
 * (the price gun of every supermarket aisle).
 */
export function makeMiniLabeller(): Canvas {
  const cv = new Canvas(18, 11);
  // The body: a wedge, taller at the back.
  for (let x = 3; x <= 14; x++) {
    const top = x <= 9 ? 4 : 5;
    const bottom = 7;
    cv.rect(x, top, 1, bottom - top + 1, BLUE[1]!);
    cv.set(x, top, BLUE[0]!);
    cv.set(x, bottom, BLUE[3]!);
  }
  cv.rect(3, 6, 12, 1, BLUE[2]!);
  // The window with the price wheels: cream with three red digits.
  cv.rect(9, 5, 4, 2, CREAM[0]!);
  cv.set(10, 5, RED[1]!);
  cv.set(11, 6, RED[1]!);
  cv.set(12, 5, RED[2]!);
  // The nozzle and the label coming out of it (white, its price edge red).
  cv.rect(15, 5, 1, 3, DSTEEL[2]!);
  cv.set(15, 5, DSTEEL[1]!);
  cv.rect(16, 5, 2, 2, WHITE);
  cv.set(17, 6, RED[1]!);
  // The roll of labels on top at the back: white turns round a dark hub, the strip running forward.
  for (let y = 0; y <= 4; y++) {
    for (let x = 1; x <= 7; x++) {
      const d = Math.hypot(x - 4, y - 2);
      if (d <= 2.6) cv.set(x, y, d > 1.9 ? CREAM[2]! : WHITE);
    }
  }
  // The hub and the turns of the roll (a thin line round it).
  cv.set(4, 2, CREAM[3]!);
  cv.set(5, 2, CREAM[2]!);
  cv.set(3, 2, CREAM[1]!);
  cv.set(4, 1, CREAM[1]!);
  cv.set(4, 3, CREAM[1]!);
  cv.rect(7, 4, 2, 1, WHITE);
  cv.set(8, 4, YEL[0]!);
  // The grip and the squeeze lever just in front of it.
  cv.rect(3, 8, 2, 3, DSTEEL[2]!);
  cv.set(3, 8, DSTEEL[1]!);
  cv.rect(6, 8, 1, 2, BLUE[2]!);
  cv.set(7, 10, BLUE[3]!);
  cv.set(6, 10, BLUE[2]!);
  return outline(cv);
}

/**
 * A price label in flight (player bullet of the labeller, flies to the right; the game turns it):
 * white with the warm rim of every player bullet and the price in red. Drawn for radius 2.
 */
export function makeLabelShot(): Canvas {
  const cv = new Canvas(7, 5);
  const pat = ['.1111.', '133331', '13r2r1', '133331', '.1111.'];
  const cols: Record<string, RGBA> = { '1': GLOW, '2': YEL[0]!, '3': WHITE, r: RED[1]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** Frames of the stuck labels (`etiqueta-pegada`): three, each a little crooked another way. */
export const STUCK_LABEL_FRAMES = 3;

/**
 * Labels stuck on an enemy (3 frames of 7 x 6): a small pale yellow offer label with a dark
 * outline (so it reads on any body, white bodies too) and the price in red on a white strip, at
 * three different tilts.
 */
export function makeStuckLabels(): Canvas {
  const cv = new Canvas(7 * STUCK_LABEL_FRAMES, 6);
  const pats = [
    ['1111..', '13331.', '1r2r1.', '13331.', '11111.', '......'],
    ['.1111.', '133331', '1r2r31', '133331', '.11111', '......'],
    ['..111.', '.13331', '13r2r1', '133331', '11111.', '......'],
  ];
  const cols: Record<string, RGBA> = { '1': K, '2': WHITE, '3': YEL[0]!, r: RED[2]! };
  pats.forEach((pat, f) => pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(f * 7 + i, j, cols[ch]!))));
  return cv;
}
