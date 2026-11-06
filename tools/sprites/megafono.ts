// Floor 5's weapons (M11 6c): the Megáfono de Reclamaciones and its sound waves.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { CREAM, DSTEEL, FRT, GLOW, RED, WHITE, YEL, outline } from '../../src/art/lib.ts';

/**
 * Megáfono de Reclamaciones in the hand (18 x 11, the horn to the right): a red driver housing at
 * the back, a cream horn that widens with a red rim at the mouth, a black pistol grip with its
 * trigger, the price sticker nobody peeled off and a strip of tape on the battery lid.
 */
export function makeMiniMegaphone(): Canvas {
  const cv = new Canvas(18, 11);
  // The horn: from 3 px tall behind the driver, flaring to 9 px at the mouth.
  const half = (x: number): number => 1.1 + 2.9 * ((x - 6) / 9) ** 1.7;
  for (let x = 6; x <= 15; x++) {
    const h = half(x);
    const y0 = Math.round(5 - h);
    const y1 = Math.round(5 + h);
    cv.rect(x, y0, 1, y1 - y0 + 1, CREAM[1]!);
    cv.set(x, y0, FRT[0]!);
    cv.set(x, y1, CREAM[3]!);
    if (y1 - 1 > y0) cv.set(x, y1 - 1, CREAM[2]!);
  }
  // A ring of red half way along and the red rim of the mouth, with the dark inside showing.
  for (let y = Math.round(5 - half(10)); y <= Math.round(5 + half(10)); y++) cv.set(10, y, y <= 3 ? RED[0]! : RED[1]!);
  for (let y = 1; y <= 9; y++) cv.set(16, y, y <= 2 ? RED[0]! : y >= 8 ? RED[3]! : RED[1]!);
  for (let y = 3; y <= 7; y++) cv.set(15, y, DSTEEL[3]!);
  cv.set(15, 2, CREAM[2]!);
  // The price sticker on the horn: yellow, with the price struck out.
  cv.rect(12, 3, 2, 2, YEL[1]!);
  cv.set(12, 3, YEL[0]!);
  cv.set(13, 4, RED[2]!);
  // The driver housing: a red drum.
  cv.rect(1, 3, 5, 5, RED[1]!);
  cv.rect(1, 3, 5, 1, RED[0]!);
  cv.rect(1, 7, 5, 1, RED[3]!);
  cv.rect(1, 6, 5, 1, RED[2]!);
  // Grey tape across the battery lid.
  cv.rect(3, 3, 1, 4, DSTEEL[0]!);
  // The pistol grip and its trigger.
  cv.rect(4, 8, 2, 3, DSTEEL[2]!);
  cv.set(4, 8, DSTEEL[1]!);
  cv.set(7, 8, DSTEEL[1]!);
  return outline(cv);
}

/**
 * A sound wave (player bullet of the megaphone, flies to the right; the game turns it): a bright
 * front arc and a fainter one behind it. Drawn for a bullet radius of 4.
 */
export function makeSoundWave(): Canvas {
  const cv = new Canvas(7, 13);
  const cx = -2.5;
  const cy = 6;
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 7; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      let c: RGBA | null = null;
      if (Math.abs(d - 7.4) < 0.85) c = Math.abs(y - cy) < 4 ? WHITE : YEL[0]!;
      else if (Math.abs(d - 8.6) < 0.5 && Math.abs(y - cy) < 5) c = YEL[1]!;
      else if (Math.abs(d - 4.6) < 0.55 && Math.abs(y - cy) < 4) c = GLOW;
      if (c) cv.set(x, y, c);
    }
  }
  return cv;
}
