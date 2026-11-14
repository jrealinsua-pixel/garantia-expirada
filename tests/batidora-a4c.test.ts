// M14c (a4c1): the Batidora de Vaso in the new style, with her own frames (walk 6, roll 6, shoot,
// knocked, dying) like the toaster's (tools/sprites/batidora-vaso.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { INK, MATERIALS } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { CHARACTERS, CLASSIC_FRAME, classicOrigin } from '../src/data/characters.ts';
import { ROLL_SPIN_END, SHOOT_POSE, STRIDE_PX, heroFrame, type HeroState } from '../src/render/heroAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import {
  BLENDER_ANIM, BLENDER_EXTRA, BLENDER_FEET_X, BLENDER_FEET_Y, BLENDER_FRAMES, BLENDER_H, BLENDER_SPIN_Y, BLENDER_W,
  makeBlenderFrames, makeBlenderHand, makeBlenderSheet,
} from '../tools/sprites/batidora-vaso.ts';
import { makeToasterFrames } from '../tools/sprites/tostadora.ts';

const B = CHARACTERS['batidora-vaso']!;
const FLOOR = MATERIALS.suelo[2]!;
const sheet = makeBlenderSheet();
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const solidRows = (cv: Canvas): number[] => Array.from({ length: cv.h }, (_, y) => y).filter((y) => Array.from({ length: cv.w }, (_, x) => x).some((x) => cv.get(x, y)[3] === 255));
const count = (cv: Canvas, ok: (c: readonly number[]) => boolean): number => {
  let n = 0;
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (ok(cv.get(x, y))) n++;
  return n;
};
const diff = (a: Canvas, b: Canvas): number => {
  let n = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (!same(a.get(x, y), b.get(x, y))) n++;
  return n;
};
const of = (m: keyof typeof MATERIALS) => (c: readonly number[]): boolean => c[3] === 255 && MATERIALS[m].some((t) => same(t, c));
const still: HeroState = { now: 0, moving: false, walked: 0, roll: null, sinceShot: Infinity, hurt: 0, dying: false, broken: false };

test('batidora (a4c1): la hoja es la nueva, con los ocho de siempre y sus dieciséis, y su ficha lo dice', () => {
  assert.equal(BLENDER_FRAMES.length, 8);
  assert.equal(BLENDER_EXTRA.length, 16);
  assert.equal(sheet.length, 24);
  const s = allSheets()['batidora-vaso']!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [BLENDER_W, BLENDER_H, 24]);
  assert.deepEqual([B.look.w, B.look.h, B.look.feetX, B.look.feetY, B.look.spinY], [BLENDER_W, BLENDER_H, BLENDER_FEET_X, BLENDER_FEET_Y, BLENDER_SPIN_Y]);
  assert.deepEqual(B.look.anim, {
    walk: [...BLENDER_ANIM.walk], roll: [...BLENDER_ANIM.roll], shoot: BLENDER_ANIM.shoot, hurt: [...BLENDER_ANIM.hurt], die: [...BLENDER_ANIM.die],
  });
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frameW: number; frameH: number; frames: number }>;
  assert.deepEqual(manifest['batidora-vaso'], { file: 'batidora-vaso.png', frameW: BLENDER_W, frameH: BLENDER_H, frames: 24 });
  // Her glove in the new style (lime, like the shoes) and a shadow as wide as her motor.
  assert.equal(B.look.hand, 'mano-batidora');
  assert.ok(manifest['mano-batidora']);
  assert.deepEqual([makeBlenderHand().w, makeBlenderHand().h], [7, 7]);
  assert.ok(count(makeBlenderHand(), of('verde')) > 10);
  assert.equal(B.look.shadowRx, 12);
});

test('batidora (a4c1): pisa donde dice su ficha, centrada sobre los pies, y gira por el medio del cuerpo', () => {
  for (const [i, f] of makeBlenderFrames().entries()) assert.equal(Math.max(...solidRows(f)), BLENDER_FEET_Y, `fotograma ${i}`);
  for (const i of [...BLENDER_ANIM.walk, BLENDER_ANIM.shoot, ...BLENDER_ANIM.hurt, ...BLENDER_ANIM.die]) {
    assert.equal(Math.max(...solidRows(sheet[i]!)), BLENDER_FEET_Y, `fotograma ${i}: de pie`);
  }
  const rest = sheet[0]!;
  const centre = (y0: number, y1: number, x0 = 0): number => {
    let lo = rest.w;
    let hi = -1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < rest.w; x++) if (rest.get(x, y)[3] === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return (lo + hi + 1) / 2;
  };
  assert.ok(Math.abs(centre(BLENDER_FEET_Y - 3, BLENDER_FEET_Y - 1, 10) - BLENDER_FEET_X) <= 1.5, 'las zapatillas (sin el cable)');
  assert.ok(Math.abs(centre(24, 38, 6) - BLENDER_FEET_X) <= 1.5, 'el motor (sin el guante)');
  // The roll spins round the middle of the body, from the lid to the rubber foot (not the legs).
  const body = solidRows(rest).filter((y) => y < 42);
  assert.ok(Math.abs(BLENDER_SPIN_Y - (Math.min(...body) + Math.max(...body)) / 2) <= 3, `${Math.min(...body)}–${Math.max(...body)}`);
  // Taller than the toaster from the feet up: the jar sticks up over the toast.
  const toaster = makeToasterFrames()[0]!;
  assert.ok(BLENDER_FEET_Y - Math.min(...solidRows(rest)) > CHARACTERS.tostadora!.look.feetY - Math.min(...solidRows(toaster)) + 4);
  // In the menus and the ending she stands where the classic frame put the feet.
  const o = classicOrigin(B.look, 0.5, 1);
  assert.ok(Math.abs(B.look.feetY - o.y * B.look.h - (CLASSIC_FRAME.feetY - CLASSIC_FRAME.h)) < 1e-9);
});

test('batidora (a4c1): estilo nuevo (tinta violeta, nunca el negro viejo), legible y distinta de la tostadora', () => {
  const OLD_K = hx('#0e0c16');
  for (const [i, f] of sheet.entries()) {
    assert.equal(count(f, (c) => same(c, OLD_K)), 0, `fotograma ${i}: negro viejo`);
    assert.ok(count(f, (c) => same(c, INK)) > 40, `fotograma ${i}: contorno de tinta`);
    const l = legibility(f, FLOOR);
    assert.ok(l.edgeContrast >= 1.6, `fotograma ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.darkEdge >= 0.8, `fotograma ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.melts <= 0.33, `fotograma ${i}: se funde con el suelo el ${(l.melts * 100).toFixed(0)} %`);
  }
  // Violet motor, glass jar and green smoothie: none of them on the toaster.
  const rest = sheet[0]!;
  assert.ok(count(rest, of('violeta')) > 250, `violeta ${count(rest, of('violeta'))}`);
  assert.ok(count(rest, of('vidrio')) > 60, `vidrio ${count(rest, of('vidrio'))}`);
  assert.ok(count(rest, of('verde')) > 60, `batido ${count(rest, of('verde'))}`);
  const toaster = makeToasterFrames()[0]!;
  assert.equal(count(toaster, of('violeta')) + count(toaster, of('vidrio')), 0);
  // Side by side on the floor their silhouettes differ (the tall jar against the wide toast).
  assert.ok(silhouetteOverlap(rest, toaster) < 0.8, `solape ${silhouetteOverlap(rest, toaster).toFixed(2)}`);
});

test('batidora (a4c1): cada fotograma es distinto; el batido se mueve al andar, la tapa salta y rota se raja', () => {
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) assert.ok(diff(sheet[i]!, sheet[j]!) > 0, `${i} y ${j} son iguales`);
  for (let k = 0; k < 6; k++) assert.ok(diff(sheet[BLENDER_ANIM.walk[k]!]!, sheet[BLENDER_ANIM.walk[(k + 1) % 6]!]!) >= 12, `paso ${k}`);
  // The smoothie's surface (its lightest green) tilts one way and the other in the walk.
  const surface = (cv: Canvas, x: number): number => {
    for (let y = 0; y < cv.h; y++) if (same(cv.get(x, y), MATERIALS.verde[1]!)) return y;
    return -1;
  };
  const tilt = (cv: Canvas): number => surface(cv, 25) - surface(cv, 16);
  const tilts = new Set(BLENDER_ANIM.walk.map((i) => tilt(sheet[i]!)));
  assert.ok(tilts.size >= 2, `el batido no se mueve: ${[...tilts]}`);
  // The lid: the topmost goma row jumps on the knock.
  const lidTop = (cv: Canvas): number => {
    for (let y = 0; y < cv.h; y++) for (let x = 15; x < 26; x++) if (of('goma')(cv.get(x, y))) return y;
    return cv.h;
  };
  assert.ok(lidTop(sheet[BLENDER_ANIM.hurt[0]!]!) < lidTop(sheet[0]!) - 1, 'la tapa salta');
  // Broken: no straw (no red up there) and a crack across the glass.
  const strawRed = (cv: Canvas): number => count({ ...cv, h: 6, get: (x: number, y: number) => cv.get(x, y) } as Canvas, of('rojo'));
  assert.ok(strawRed(sheet[0]!) >= 2);
  assert.equal(strawRed(sheet[7]!), 0);
  assert.ok(count(sheet[7]!, (c) => same(c, MATERIALS.vidrio[6]!)) >= 6, 'la grieta del vaso');
  // Dying: sparks (the toaster's colour), never at rest.
  const sparks = (cv: Canvas): number => count(cv, (c) => c[0] === 255 && c[1] === 244 && c[2] === 170 && c[3] === 255);
  for (const i of BLENDER_ANIM.die) assert.ok(sparks(sheet[i]!) >= 3);
  assert.equal(sparks(sheet[0]!), 0);
});

test('batidora (a4c1): rodando se encoge sin mover el cuerpo, y disparando se echa atrás', () => {
  const shoeBottom = (cv: Canvas): number => {
    let b = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 10; x < 30; x++) if (cv.get(x, y)[3] === 255) b = Math.max(b, y);
    return b;
  };
  const mid = (cv: Canvas): number => {
    const rows = solidRows(cv).filter((y) => y < 42 && Array.from({ length: cv.w }, (_, x) => x).filter((x) => cv.get(x, y)[3] === 255).length > 20);
    return (Math.min(...rows) + Math.max(...rows)) / 2;
  };
  const spin = BLENDER_ANIM.roll.slice(0, -1);
  for (const i of BLENDER_ANIM.roll) {
    assert.ok(shoeBottom(sheet[i]!) <= BLENDER_FEET_Y - 2, `fotograma ${i}: en el aire`);
    assert.ok(Math.abs(mid(sheet[i]!) - mid(sheet[0]!)) <= 1, `fotograma ${i}: el cuerpo no se mueve`);
  }
  assert.ok(shoeBottom(sheet[spin[0]!]!) < shoeBottom(sheet[BLENDER_ANIM.roll[5]!]!), 'aterriza estirando las piernas');
  const rightEdge = (cv: Canvas, y: number): number => {
    for (let x = cv.w - 1; x >= 0; x--) if (cv.get(x, y)[3] === 255) return x;
    return -1;
  };
  assert.equal(rightEdge(sheet[BLENDER_ANIM.shoot]!, 32), rightEdge(sheet[0]!, 32) - 1);
});

test('heroFrame: la batidora usa sus fotogramas propios', () => {
  const L = B.look;
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE / 2 }), BLENDER_ANIM.shoot);
  const seen = new Set<number>();
  for (let px = 0; px < STRIDE_PX; px += 1) seen.add(heroFrame(L, { ...still, moving: true, walked: px }));
  assert.deepEqual([...seen], [...BLENDER_ANIM.walk]);
  assert.equal(heroFrame(L, { ...still, roll: 0.1 }), BLENDER_ANIM.roll[0]);
  assert.equal(heroFrame(L, { ...still, roll: ROLL_SPIN_END + 0.05 }), BLENDER_ANIM.roll[5]);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), BLENDER_ANIM.hurt[0]);
  assert.equal(heroFrame(L, { ...still, dying: true }), BLENDER_ANIM.die[0]);
});
