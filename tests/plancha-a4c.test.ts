// M14c (a4c2): the Plancha de Vapor in the new style, with her own frames (walk 6, roll 6, shoot,
// knocked, dying) like the toaster's and the blender's (tools/sprites/plancha-vapor.ts).
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
  IRON_ANIM, IRON_EXTRA, IRON_FEET_X, IRON_FEET_Y, IRON_FRAMES, IRON_H, IRON_SPIN_Y, IRON_W, makeIronFrames, makeIronHand, makeIronSheet,
} from '../tools/sprites/plancha-vapor.ts';
import { makeBlenderFrames } from '../tools/sprites/batidora-vaso.ts';
import { makeToasterFrames } from '../tools/sprites/tostadora.ts';

const P = CHARACTERS.plancha!;
const FLOOR = MATERIALS.suelo[2]!;
const sheet = makeIronSheet();
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

test('plancha (a4c2): la hoja es la nueva, con los ocho de siempre y sus dieciséis, y su ficha lo dice', () => {
  assert.equal(IRON_FRAMES.length, 8);
  assert.equal(IRON_EXTRA.length, 16);
  assert.equal(sheet.length, 24);
  const s = allSheets()['plancha-vapor']!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [IRON_W, IRON_H, 24]);
  assert.deepEqual([P.look.w, P.look.h, P.look.feetX, P.look.feetY, P.look.spinY], [IRON_W, IRON_H, IRON_FEET_X, IRON_FEET_Y, IRON_SPIN_Y]);
  assert.deepEqual(P.look.anim, {
    walk: [...IRON_ANIM.walk], roll: [...IRON_ANIM.roll], shoot: IRON_ANIM.shoot, hurt: [...IRON_ANIM.hurt], die: [...IRON_ANIM.die],
  });
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frameW: number; frameH: number; frames: number }>;
  assert.deepEqual(manifest['plancha-vapor'], { file: 'plancha-vapor.png', frameW: IRON_W, frameH: IRON_H, frames: 24 });
  // White cotton gloves, and a shadow as wide as her soleplate.
  assert.equal(P.look.hand, 'mano-plancha');
  assert.ok(manifest['mano-plancha']);
  assert.deepEqual([makeIronHand().w, makeIronHand().h], [7, 7]);
  assert.ok(count(makeIronHand(), of('crema')) > 10);
  assert.equal(P.look.shadowRx, 15);
});

test('plancha (a4c2): pisa donde dice su ficha, centrada sobre los pies, y gira por el medio del cuerpo', () => {
  for (const [i, f] of makeIronFrames().entries()) assert.equal(Math.max(...solidRows(f)), IRON_FEET_Y, `fotograma ${i}`);
  for (const i of [...IRON_ANIM.walk, IRON_ANIM.shoot, ...IRON_ANIM.hurt, ...IRON_ANIM.die]) {
    assert.equal(Math.max(...solidRows(sheet[i]!)), IRON_FEET_Y, `fotograma ${i}: de pie`);
  }
  const rest = sheet[0]!;
  const centre = (y0: number, y1: number, x0 = 0): number => {
    let lo = rest.w;
    let hi = -1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < rest.w; x++) if (rest.get(x, y)[3] === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return (lo + hi + 1) / 2;
  };
  assert.ok(Math.abs(centre(IRON_FEET_Y - 3, IRON_FEET_Y - 1, 9) - IRON_FEET_X) <= 1.5, 'los zapatos (sin el cable)');
  assert.ok(Math.abs(centre(20, 30, 5) - IRON_FEET_X) <= 1.5, 'la carcasa (sin el guante)');
  const body = solidRows(rest).filter((y) => y < 35);
  assert.ok(Math.abs(IRON_SPIN_Y - (Math.min(...body) + Math.max(...body)) / 2) <= 2, `${Math.min(...body)}–${Math.max(...body)}`);
  const o = classicOrigin(P.look, 0.5, 1);
  assert.ok(Math.abs(P.look.feetY - o.y * P.look.h - (CLASSIC_FRAME.feetY - CLASSIC_FRAME.h)) < 1e-9);
});

test('plancha (a4c2): estilo nuevo (tinta violeta, nunca el negro viejo), legible y distinta de las otras dos', () => {
  const OLD_K = hx('#0e0c16');
  for (const [i, f] of sheet.entries()) {
    assert.equal(count(f, (c) => same(c, OLD_K)), 0, `fotograma ${i}: negro viejo`);
    assert.ok(count(f, (c) => same(c, INK)) > 40, `fotograma ${i}: contorno de tinta`);
    const l = legibility(f, FLOOR);
    assert.ok(l.edgeContrast >= 1.6, `fotograma ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.darkEdge >= 0.8, `fotograma ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.melts <= 0.33, `fotograma ${i}: se funde con el suelo el ${(l.melts * 100).toFixed(0)} %`);
  }
  const rest = sheet[0]!;
  assert.ok(count(rest, of('turquesa')) > 250, `turquesa ${count(rest, of('turquesa'))}`);
  assert.ok(count(rest, of('acero')) > 60, 'la suela de acero');
  for (const other of [makeToasterFrames()[0]!, makeBlenderFrames()[0]!]) {
    assert.equal(count(other, of('turquesa')), 0);
    assert.ok(silhouetteOverlap(rest, other) < 0.8, `solape ${silhouetteOverlap(rest, other).toFixed(2)}`);
  }
});

test('plancha (a4c2): cada fotograma es distinto; el agua se mueve al andar, el golpe echa vapor y rota se raja', () => {
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) assert.ok(diff(sheet[i]!, sheet[j]!) > 0, `${i} y ${j} son iguales`);
  for (let k = 0; k < 6; k++) assert.ok(diff(sheet[IRON_ANIM.walk[k]!]!, sheet[IRON_ANIM.walk[(k + 1) % 6]!]!) >= 12, `paso ${k}`);
  // The water's surface (cian tone 2) changes across the walk.
  const water = (cv: Canvas): string => {
    const pts: string[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < 20; x++) if (same(cv.get(x, y), MATERIALS.cian[2]!)) pts.push(`${x},${y}`);
    return pts.join(' ');
  };
  assert.ok(new Set(IRON_ANIM.walk.map((i) => water(sheet[i]!))).size >= 2, 'el agua no se mueve');
  // A hit: see-through steam under the soleplate (none at rest there).
  const steam = (cv: Canvas): number => {
    let n = 0;
    for (let y = 28; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
      const c = cv.get(x, y);
      if (c[3] > 0 && c[3] < 255 && c[0] > 200) n++;
    }
    return n;
  };
  assert.ok(steam(sheet[IRON_ANIM.hurt[0]!]!) >= 10, 'el golpe echa vapor');
  assert.equal(steam(sheet[0]!), 0);
  // Broken: no red pointer on the dial and the handle off its front post (fewer navy pixels).
  assert.ok(count(sheet[7]!, of('azul')) < count(sheet[0]!, of('azul')) - 6, 'el asa suelta');
  const sparks = (cv: Canvas): number => count(cv, (c) => c[0] === 255 && c[1] === 244 && c[2] === 170 && c[3] === 255);
  for (const i of IRON_ANIM.die) assert.ok(sparks(sheet[i]!) >= 3);
  assert.equal(sparks(sheet[0]!), 0);
});

test('plancha (a4c2): rodando se encoge sin mover el cuerpo, y disparando se echa atrás', () => {
  const shoeBottom = (cv: Canvas): number => {
    let b = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 12; x < 34; x++) if (cv.get(x, y)[3] === 255) b = Math.max(b, y);
    return b;
  };
  const mid = (cv: Canvas): number => {
    const rows = solidRows(cv).filter((y) => y < 34 && Array.from({ length: cv.w }, (_, x) => x).filter((x) => cv.get(x, y)[3] === 255).length > 20);
    return (Math.min(...rows) + Math.max(...rows)) / 2;
  };
  for (const i of IRON_ANIM.roll) {
    assert.ok(shoeBottom(sheet[i]!) <= IRON_FEET_Y - 2, `fotograma ${i}: en el aire`);
    assert.ok(Math.abs(mid(sheet[i]!) - mid(sheet[0]!)) <= 1, `fotograma ${i}: el cuerpo no se mueve`);
  }
  assert.ok(shoeBottom(sheet[IRON_ANIM.roll[0]!]!) < shoeBottom(sheet[IRON_ANIM.roll[5]!]!), 'aterriza estirando las piernas');
  const rightEdge = (cv: Canvas, y: number): number => {
    for (let x = cv.w - 1; x >= 0; x--) if (cv.get(x, y)[3] === 255) return x;
    return -1;
  };
  assert.equal(rightEdge(sheet[IRON_ANIM.shoot]!, 24), rightEdge(sheet[0]!, 24) - 1);
});

test('heroFrame: la plancha usa sus fotogramas propios', () => {
  const L = P.look;
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE / 2 }), IRON_ANIM.shoot);
  const seen = new Set<number>();
  for (let px = 0; px < STRIDE_PX; px += 1) seen.add(heroFrame(L, { ...still, moving: true, walked: px }));
  assert.deepEqual([...seen], [...IRON_ANIM.walk]);
  assert.equal(heroFrame(L, { ...still, roll: 0.1 }), IRON_ANIM.roll[0]);
  assert.equal(heroFrame(L, { ...still, roll: ROLL_SPIN_END + 0.05 }), IRON_ANIM.roll[5]);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), IRON_ANIM.hurt[0]);
  assert.equal(heroFrame(L, { ...still, dying: true }), IRON_ANIM.die[0]);
});
