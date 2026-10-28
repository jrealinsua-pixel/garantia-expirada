// 16x16 pickup sprites, copied from tools/referencia/build.py (approved).
import { Canvas, hx } from '../../src/art/canvas.ts';

const PAL: Record<string, string> = {
  K: '#14111f', W: '#f4f1e8', w: '#d9d5c7', G: '#c3c9d6', g: '#8a92a8', D: '#565c75',
  R: '#e0453b', r: '#962d35', Y: '#f6c431', y: '#c28f1c', O: '#ec8a2c', B: '#4a86d8',
  b: '#2c4f94', C: '#69dbd8', c: '#3a9ea6', N: '#58b45a', n: '#2f7a41', P: '#ea93a8',
  T: '#a96a3f', t: '#6b4128', M: '#b8a07a', L: '#e9d9a8',
};

export const ITEM_GRIDS: Record<string, readonly string[]> = {
  pila: [
    '................',
    '......KKKK......',
    '......KGGK......',
    '....KKKKKKKK....',
    '....KOOOOOOK....',
    '....KOOOOOOK....',
    '....KDDDDDDK....',
    '....KDDWWDDK....',
    '....KDDDDDDK....',
    '....KDKKKKDK....',
    '....KDKDDKDK....',
    '....KDKDDKDK....',
    '....KDKRRKDK....',
    '....KDKKKKDK....',
    '....KKKKKKKK....',
    '................',
  ],
  manual: [
    '................',
    '................',
    '...KKKKKKKKKK...',
    '..KRRRRRRRRRRK..',
    '..KRYYRRRYRYRK..',
    '..KRRYRYYRRRRK..',
    '..KRYYRRYRYYRK..',
    '..KRRRRRRRRRRK..',
    '..KRYRYRYRYRRK..',
    '..KRRRRRRRRRRK..',
    '..KrrrrrrrrrrK..',
    '..KKKKKKKKKKKK..',
    '...KWWWWWWWWK...',
    '...KKKKKKKKKK...',
    '................',
    '................',
  ],
  ticket: [
    '................',
    '....KKKKKKKK....',
    '...KWWWWWWWWK...',
    '...KWKKKKKKWK...',
    '...KWWWWWWWWK...',
    '...KWgggggWWK...',
    '...KWWWWWWWWK...',
    '...KWggggWWWK...',
    '...KWWWWWWWWK...',
    '...KWgggggWWK...',
    '...KWWWWWWWWK...',
    '...KWRRRRRRWK...',
    '...KWWWWWWWWK...',
    '...KKWWKKWWKK...',
    '....K..KK..K....',
    '................',
  ],
  garantia: [
    '................',
    '................',
    '..KKKKKKKKKKKK..',
    '..KLLLLLLLLLLK..',
    '..KLYYYYYYYYLK..',
    '..KLLLLLLLLLLK..',
    '..KLtttttttLLK..',
    '..KLLLLLLLLLLK..',
    '..KLtttttttLLK..',
    '..KLLLLLLLLLLK..',
    '..KLttttLRRRLK..',
    '..KLLLLLLRRRLK..',
    '..KLLLLLLRRRLK..',
    '..KLLLLLLLLLLK..',
    '..KKKKKKKKKKKK..',
    '................',
  ],
  caja: [
    '................',
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KLLLLLLLLLLLLK.',
    '.KLLLLLLLLLLLLK.',
    '.KKKKKKKKKKKKKK.',
    '.KMMMMMLLMMMMMK.',
    '.KMMMMMLLMMMMMK.',
    '.KMMMMMLLMMMMMK.',
    '.KMMMMMLLMRRRMK.',
    '.KMMMMMLLMRRRMK.',
    '.KMMMMMLLMMMMMK.',
    '.KMMMMMLLMMMMMK.',
    '.KttttttttttttK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ],
};

export function makeItem(name: string): Canvas {
  const rows = ITEM_GRIDS[name];
  if (!rows) throw new Error('Unknown item ' + name);
  const cv = new Canvas(16, 16);
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') cv.set(x, y, hx(PAL[ch]!));
    });
  });
  return cv;
}
