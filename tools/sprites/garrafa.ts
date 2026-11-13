// M14b (h11a3): the Garrafa de Agua «de Manantial», a big blue water jug standing on the floor, the
// kind whose deposit nobody ever claims back. Bursting, it leaves a puddle (drawn by the game).
import { Canvas, hx } from '../../src/art/canvas.ts';
import { WHITE, YEL, outline, ramp } from '../../src/art/lib.ts';

/** Clear blue plastic, the water inside a shade darker. */
const PLASTIC = ramp('#cfe9f7', '#8fc6e6', '#5d95c2', '#3c6a96');
const WATER = ramp('#7fb8e0', '#4f8cc4', '#346aa0', '#244d7a');

/** The cap, a deeper blue. */
const CAP = hx('#2a5ca8');

export const JUG_W = 18;
export const JUG_H = 22;

export function makeJug(): Canvas {
  const cv = new Canvas(JUG_W, JUG_H);
  // The body: rounded shoulders, ribs, the water line two thirds up.
  const body: Array<[number, number, number]> = [[6, 7, 6], [7, 4, 10], [8, 3, 12]];
  for (const [y, x, w] of body) cv.rect(x, y, w, 1, PLASTIC[1]!);
  cv.rect(3, 9, 12, 11, WATER[1]!);
  cv.rect(3, 9, 12, 2, PLASTIC[1]!);
  // Light from the top left: a shine down the left, shade on the right.
  cv.rect(4, 7, 1, 12, PLASTIC[0]!);
  cv.rect(5, 11, 1, 6, WATER[0]!);
  cv.rect(14, 9, 1, 11, WATER[2]!);
  cv.rect(13, 12, 1, 7, WATER[2]!);
  // Ribs across.
  for (const y of [13, 17]) cv.rect(4, y, 10, 1, WATER[2]!);
  cv.rect(3, 20, 12, 1, WATER[3]!);
  // The neck and the cap with its tear-off ring.
  cv.rect(7, 3, 4, 3, PLASTIC[2]!);
  cv.rect(7, 3, 1, 3, PLASTIC[1]!);
  cv.rect(6, 1, 6, 2, CAP);
  cv.set(6, 1, WHITE);
  // The label: yellow, a mountain that has never seen a spring.
  cv.rect(5, 14, 8, 3, YEL[1]!);
  cv.rect(7, 16, 5, 1, WATER[2]!);
  cv.set(8, 15, WATER[2]!);
  cv.set(9, 14, WHITE);
  cv.set(10, 15, WATER[2]!);
  return outline(cv);
}
