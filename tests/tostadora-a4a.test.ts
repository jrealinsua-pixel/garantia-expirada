// M14c (a4a): the Toaster in the game with the new style (tools/sprites/tostadora.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { INK, MATERIALS } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { CHARACTERS, CLASSIC_FRAME, classicOrigin } from '../src/data/characters.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { HERO_FRAMES } from '../tools/sprites/characters.ts';
import {
  TOASTER_FEET_X, TOASTER_FEET_Y, TOASTER_FRAMES, TOASTER_H, TOASTER_SPIN_Y, TOASTER_W, makeToasterFrames, makeToasterHand,
} from '../tools/sprites/tostadora.ts';

const T = CHARACTERS.tostadora!;
const FLOOR = MATERIALS.suelo[2]!;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const solidRows = (cv: Canvas): number[] => Array.from({ length: cv.h }, (_, y) => y).filter((y) => Array.from({ length: cv.w }, (_, x) => x).some((x) => cv.get(x, y)[3] === 255));
const count = (cv: Canvas, ok: (c: readonly number[]) => boolean): number => {
  let n = 0;
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (ok(cv.get(x, y))) n++;
  return n;
};

test('tostadora (a4a): la hoja del juego es la nueva, con los ocho fotogramas de siempre', () => {
  assert.deepEqual(TOASTER_FRAMES.map((f) => f.name), HERO_FRAMES.map((f) => f.name));
  const s = allSheets().tostadora!;
  // (M14c (a4b): and its own sixteen after them.)
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [TOASTER_W, TOASTER_H, 24]);
  assert.deepEqual([T.look.w, T.look.h, T.look.feetX, T.look.feetY, T.look.spinY], [TOASTER_W, TOASTER_H, TOASTER_FEET_X, TOASTER_FEET_Y, TOASTER_SPIN_Y]);
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frameW: number; frameH: number; frames: number }>;
  assert.deepEqual(manifest.tostadora, { file: 'tostadora.png', frameW: TOASTER_W, frameH: TOASTER_H, frames: 24 });
  // Its glove, in the new style too.
  assert.equal(T.look.hand, 'mano-tostadora');
  assert.ok(manifest['mano-tostadora']);
  assert.deepEqual([makeToasterHand().w, makeToasterHand().h], [7, 7]);
  // And a shadow as wide as its casing (28 px), not the old 18.
  assert.equal(T.look.shadowRx, 12);
});

test('tostadora (a4a): pisa donde dice su ficha y el cuerpo está centrado sobre los pies', () => {
  for (const [i, f] of makeToasterFrames().entries()) {
    const rows = solidRows(f);
    assert.equal(Math.max(...rows), TOASTER_FEET_Y, `fotograma ${i}: el contorno de las zapatillas, justo en los pies`);
    assert.ok(Math.min(...rows) >= 0);
  }
  // At rest the shoes and the body are centred on feetX (within a pixel and a half).
  const rest = makeToasterFrames()[0]!;
  const span = (y0: number, y1: number, x0 = 0): number => {
    let lo = rest.w;
    let hi = -1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < rest.w; x++) if (rest.get(x, y)[3] === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return (lo + hi + 1) / 2;
  };
  assert.ok(Math.abs(span(TOASTER_FEET_Y - 3, TOASTER_FEET_Y - 1, 10) - TOASTER_FEET_X) <= 1.5, 'las zapatillas (sin el enchufe)');
  assert.ok(Math.abs(span(18, 30) - TOASTER_FEET_X) <= 1.5, 'la carcasa');
  // The roll spins round the middle of the casing (the rows more than 14 px wide: not the toast or the legs).
  const casing = solidRows(rest).filter((y) => Array.from({ length: rest.w }, (_, x) => x).filter((x) => rest.get(x, y)[3] === 255).length > 14);
  assert.ok(Math.abs(TOASTER_SPIN_Y - (Math.min(...casing) + Math.max(...casing)) / 2) <= 2, `${Math.min(...casing)}–${Math.max(...casing)}`);
});

test('tostadora (a4a): estilo nuevo (tinta violeta, nunca el negro viejo) y legible sobre el suelo', () => {
  const OLD_K = hx('#0e0c16');
  for (const [i, f] of makeToasterFrames().entries()) {
    assert.equal(count(f, (c) => same(c, OLD_K)), 0, `fotograma ${i}: negro viejo`);
    assert.ok(count(f, (c) => same(c, INK)) > 40, `fotograma ${i}: contorno de tinta`);
    const l = legibility(f, FLOOR);
    assert.ok(l.edgeContrast >= 1.6, `fotograma ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.darkEdge >= 0.8, `fotograma ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.melts <= 0.33, `fotograma ${i}: se funde con el suelo el ${(l.melts * 100).toFixed(0)} %`);
  }
});

test('tostadora (a4a): cada fotograma se mueve; herida salta la tostada y rota se queda sin ella', () => {
  const frames = makeToasterFrames();
  for (let i = 1; i < frames.length; i++) assert.notDeepEqual(frames[i]!.p, frames[i - 1]!.p, `fotograma ${i}`);
  const toast = (c: readonly number[]): boolean => c[3] === 255 && MATERIALS.tostada.some((t) => same(t, c));
  const toastTop = (cv: Canvas): number => Math.min(...Array.from({ length: cv.h }, (_, y) => y).filter((y) => Array.from({ length: cv.w }, (_, x) => x).some((x) => toast(cv.get(x, y)))));
  assert.ok(toastTop(frames[6]!) < toastTop(frames[1]!), 'herida: las tostadas saltan');
  assert.ok(count(frames[0]!, toast) > 20);
  assert.equal(count(frames[7]!, toast), 0, 'rota: las tostadas han salido disparadas');
});

test('classicOrigin: coloca los dibujos nuevos donde iban los del marco clásico', () => {
  // A sheet still in the classic frame keeps its origin.
  // (Since M14c (a4d2) no character is left in it; a look in the classic frame stands in.)
  const old = { ...CHARACTERS.movil!.look, w: CLASSIC_FRAME.w, h: CLASSIC_FRAME.h, feetY: CLASSIC_FRAME.feetY };
  for (const [ox, oy] of [[0.5, 1], [0, 0]] as const) assert.deepEqual(classicOrigin(old, ox, oy), { x: ox, y: oy });
  // The new toaster: same centre, and its feet at the classic feet's height.
  const L = T.look;
  for (const [ox, oy] of [[0.5, 1], [0, 0]] as const) {
    const o = classicOrigin(L, ox, oy);
    const feetBelowAnchor = L.feetY - o.y * L.h;
    assert.ok(Math.abs(feetBelowAnchor - (CLASSIC_FRAME.feetY - oy * CLASSIC_FRAME.h)) < 1e-9);
    assert.ok(Math.abs(L.w / 2 - o.x * L.w - (CLASSIC_FRAME.w / 2 - ox * CLASSIC_FRAME.w)) < 1e-9);
  }
});
