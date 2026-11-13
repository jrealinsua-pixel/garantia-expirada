// M14 (l4b): the two prize weapons, only ever the reward of an achievement: the Soldador de Estaño
// (the true ending, the Servicio Técnico's own tool) and the Mando Universal (winning with all five
// products). The hand sprites are 18 x 11 with the business end to the right, like the others.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { DSTEEL, GLOW, GLOW2, K, RED, STEEL, WHITE, YEL, outline } from '../../src/art/lib.ts';

/**
 * Soldador de Estaño in the hand: a fat red-and-yellow handle at the back with its cable coming
 * out of the end, a steel shaft with the vent rings, and the thin tip glowing orange-hot at the
 * front, a drop of tin hanging from it.
 */
export function makeMiniSolderingIron(): Canvas {
  const cv = new Canvas(18, 11);
  // The cable: from the back of the handle, curling down and out of the frame.
  cv.set(0, 7, K);
  cv.set(1, 6, K);
  cv.set(0, 8, K);
  cv.set(1, 9, K);
  // The handle: red rubber, a yellow grip band, rounded at the back.
  for (let x = 2; x <= 8; x++) {
    const top = x === 2 ? 4 : 3;
    const bottom = x === 2 ? 6 : 7;
    for (let y = top; y <= bottom; y++) cv.set(x, y, y === top ? RED[0]! : y === bottom ? RED[3]! : RED[1]!);
  }
  for (let y = 3; y <= 7; y++) cv.set(5, y, y === 3 ? YEL[0]! : y === 7 ? YEL[2]! : YEL[1]!);
  cv.rect(3, 5, 1, 1, RED[2]!);
  // The steel shaft with two vent rings, thinner than the handle.
  for (let x = 9; x <= 13; x++) {
    cv.set(x, 4, STEEL[0]!);
    cv.set(x, 5, STEEL[1]!);
    cv.set(x, 6, STEEL[3]!);
  }
  cv.set(10, 4, DSTEEL[1]!);
  cv.set(10, 5, DSTEEL[2]!);
  cv.set(12, 4, DSTEEL[1]!);
  cv.set(12, 5, DSTEEL[2]!);
  // The tip: a thin point going white-hot at the end.
  cv.set(14, 5, DSTEEL[0]!);
  cv.set(15, 5, GLOW2);
  cv.set(16, 5, GLOW);
  cv.set(17, 5, YEL[0]!);
  // A drop of tin hanging off the tip.
  cv.set(16, 6, STEEL[1]!);
  cv.set(16, 7, STEEL[0]!);
  return outline(cv);
}

/**
 * A drop of molten tin in flight (radius 2; round, so it does not turn): silver with a bright
 * highlight, inside the warm rim every player bullet has.
 */
export function makeTinDrop(): Canvas {
  const cv = new Canvas(5, 5);
  const pat = ['.111.', '13321', '13221', '12241', '.111.'];
  const cols: Record<string, RGBA> = { '1': GLOW, '2': STEEL[1]!, '3': WHITE, '4': STEEL[3]! };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/**
 * Mando Universal in the hand: a long dark remote seen from the side and a little from above,
 * three rows of tiny buttons (one red, the power), the label strip, and the infrared bulb at the
 * front lit up red.
 */
export function makeMiniRemote(): Canvas {
  const cv = new Canvas(18, 11);
  // The body: dark plastic, slightly fatter at the back (where the batteries go).
  for (let x = 1; x <= 15; x++) {
    const top = x <= 6 ? 3 : 4;
    const bottom = 7;
    for (let y = top; y <= bottom; y++) cv.set(x, y, y === top ? DSTEEL[1]! : y === bottom ? DSTEEL[3]! : DSTEEL[2]!);
  }
  // The buttons: a grid of light dots, the red power button at the front, a rubber strip at the back.
  for (const x of [8, 10, 12]) cv.set(x, 5, STEEL[1]!);
  for (const x of [9, 11]) cv.set(x, 6, STEEL[2]!);
  cv.set(14, 5, RED[1]!);
  cv.rect(2, 5, 4, 1, STEEL[3]!);
  cv.set(3, 4, WHITE);
  cv.set(4, 4, STEEL[0]!);
  // The infrared bulb at the front, glowing.
  cv.set(16, 5, RED[2]!);
  cv.set(16, 6, RED[1]!);
  cv.set(17, 5, RED[0]!);
  cv.set(17, 6, RED[1]!);
  return outline(cv);
}

/**
 * An infrared pulse in flight (radius 2, flies to the right; the game turns it): a short red
 * streak, hot in the middle, with the warm rim of the player's bullets.
 */
export function makeInfraredPulse(): Canvas {
  const cv = new Canvas(7, 5);
  const pat = ['.1111.', '122331', '1233w1', '122331', '.1111.'];
  const cols: Record<string, RGBA> = { '1': GLOW2, '2': RED[2]!, '3': RED[0]!, w: WHITE };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/**
 * The puddle a drop of tin leaves where it lands (2 frames of 12 x 10, like the plasticine blob):
 * molten silver with a white glint and an orange-hot rim, the glint moving between frames so it
 * shimmers. The game shrinks it away when it cools.
 */
export function makeTinPuddle(): Canvas {
  const shapes = [
    ['............', '....0000....', '..00111100..', '.0122332210.', '.0123442210.', '012233322210', '.0122222210.', '.0012222100.', '..00000000..', '............'],
    ['............', '............', '..00000000..', '.0112223110.', '012223442210', '012222332210', '.0122222210.', '..01111110..', '...000000...', '............'],
  ];
  const cols: Record<string, RGBA> = { '0': GLOW2, '1': STEEL[3]!, '2': STEEL[2]!, '3': STEEL[0]!, '4': WHITE };
  const cv = new Canvas(12 * shapes.length, 10);
  shapes.forEach((pat, f) => pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(f * 12 + i, j, cols[ch]!))));
  return cv;
}
