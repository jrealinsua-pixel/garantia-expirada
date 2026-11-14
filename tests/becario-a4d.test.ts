// M14c (a4d1): the Becario Eterno in the new style, with his own frames (walk 6, roll 6, shoot,
// knocked, dying) like the toaster's, the blender's and the iron's (tools/sprites/becario.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { INK, MATERIALS, SHINE } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { CHARACTERS, CLASSIC_FRAME, classicOrigin } from '../src/data/characters.ts';
import { ROLL_SPIN_END, SHOOT_POSE, STRIDE_PX, heroFrame, type HeroState } from '../src/render/heroAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import {
  BECARIO_ANIM, BECARIO_EXTRA, BECARIO_FEET_X, BECARIO_FEET_Y, BECARIO_FRAMES, BECARIO_H, BECARIO_SPIN_Y, BECARIO_W,
  makeBecarioFrames, makeBecarioHand, makeBecarioSheet,
} from '../tools/sprites/becario.ts';
import { makeBlenderFrames } from '../tools/sprites/batidora-vaso.ts';
import { makeIronFrames } from '../tools/sprites/plancha-vapor.ts';
import { makeToasterFrames } from '../tools/sprites/tostadora.ts';

const B = CHARACTERS.becario!;
const FLOOR = MATERIALS.suelo[2]!;
const sheet = makeBecarioSheet();
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

test('becario (a4d1): la hoja es la nueva, con los ocho de siempre y sus dieciséis, y su ficha lo dice', () => {
  assert.equal(BECARIO_FRAMES.length, 8);
  assert.equal(BECARIO_EXTRA.length, 16);
  assert.equal(sheet.length, 24);
  const s = allSheets()['becario']!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [BECARIO_W, BECARIO_H, 24]);
  assert.deepEqual([B.look.w, B.look.h, B.look.feetX, B.look.feetY, B.look.spinY], [BECARIO_W, BECARIO_H, BECARIO_FEET_X, BECARIO_FEET_Y, BECARIO_SPIN_Y]);
  assert.deepEqual(B.look.anim, {
    walk: [...BECARIO_ANIM.walk], roll: [...BECARIO_ANIM.roll], shoot: BECARIO_ANIM.shoot, hurt: [...BECARIO_ANIM.hurt], die: [...BECARIO_ANIM.die],
  });
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frameW: number; frameH: number; frames: number }>;
  assert.deepEqual(manifest['becario'], { file: 'becario.png', frameW: BECARIO_W, frameH: BECARIO_H, frames: 24 });
  // Bare hands (skin, no gloves), and a shadow as wide as his shoes.
  assert.equal(B.look.hand, 'mano-becario');
  assert.ok(count(makeBecarioHand(), of('piel')) > 10);
  assert.equal(B.look.shadowRx, 10);
});

test('becario (a4d1): pisa donde dice su ficha, centrado sobre los pies, y gira por el medio del cuerpo', () => {
  for (const [i, f] of makeBecarioFrames().entries()) assert.equal(Math.max(...solidRows(f)), BECARIO_FEET_Y, `fotograma ${i}`);
  for (const i of [...BECARIO_ANIM.walk, BECARIO_ANIM.shoot, ...BECARIO_ANIM.hurt, ...BECARIO_ANIM.die]) {
    assert.equal(Math.max(...solidRows(sheet[i]!)), BECARIO_FEET_Y, `fotograma ${i}: de pie`);
  }
  const rest = sheet[0]!;
  const centre = (y0: number, y1: number, x0 = 0): number => {
    let lo = rest.w;
    let hi = -1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < rest.w; x++) if (rest.get(x, y)[3] === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return (lo + hi + 1) / 2;
  };
  assert.ok(Math.abs(centre(BECARIO_FEET_Y - 3, BECARIO_FEET_Y - 1) - BECARIO_FEET_X) <= 1.5, 'los zapatos');
  assert.ok(Math.abs(centre(29, 36, 12) - BECARIO_FEET_X) <= 1.5, 'la camisa (sin el café)');
  const body = solidRows(rest).filter((y) => y < 38);
  assert.ok(Math.abs(BECARIO_SPIN_Y - (Math.min(...body) + Math.max(...body)) / 2) <= 2, `${Math.min(...body)}–${Math.max(...body)}`);
  const o = classicOrigin(B.look, 0.5, 1);
  assert.ok(Math.abs(B.look.feetY - o.y * B.look.h - (CLASSIC_FRAME.feetY - CLASSIC_FRAME.h)) < 1e-9);
});

test('becario (a4d1): estilo nuevo (tinta violeta, nunca el negro viejo), legible y distinto de los otros tres', () => {
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
  assert.ok(count(rest, of('piel')) > 250, `piel ${count(rest, of('piel'))}`);
  assert.ok(count(rest, of('quemada')) > 120, 'el pelo');
  assert.ok(count(rest, of('acero')) > 100, 'la camisa blanca');
  for (const other of [makeToasterFrames()[0]!, makeBlenderFrames()[0]!, makeIronFrames()[0]!]) {
    assert.equal(count(other, of('piel')), 0, 'solo él tiene piel');
    assert.ok(silhouetteOverlap(rest, other) < 0.8, `solape ${silhouetteOverlap(rest, other).toFixed(2)}`);
  }
});

test('becario (a4d1): cada fotograma es distinto; el golpe tira el café, roto lo deja en el suelo y al morir vuelan sus papeles', () => {
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) assert.ok(diff(sheet[i]!, sheet[j]!) > 0, `${i} y ${j} son iguales`);
  for (let k = 0; k < 6; k++) assert.ok(diff(sheet[BECARIO_ANIM.walk[k]!]!, sheet[BECARIO_ANIM.walk[(k + 1) % 6]!]!) >= 12, `paso ${k}`);
  // Coffee drops over the cup (none at rest above it).
  const drops = (cv: Canvas): number => {
    let n = 0;
    for (let y = 15; y < 25; y++) for (let x = 0; x < 14; x++) if (of('carton')(cv.get(x, y))) n++;
    return n;
  };
  assert.ok(drops(sheet[BECARIO_ANIM.hurt[0]!]!) >= 4, 'el golpe tira el café');
  assert.equal(drops(sheet[0]!), 0);
  // Broken: the cup on the floor (cream down by the feet) and the pósit off his head.
  const low = (cv: Canvas, m: keyof typeof MATERIALS, y0: number, y1: number): number => {
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < cv.w; x++) if (of(m)(cv.get(x, y))) n++;
    return n;
  };
  assert.ok(low(sheet[7]!, 'crema', 40, 45) >= 10, 'el vaso en el suelo');
  assert.equal(low(sheet[0]!, 'crema', 40, 45), 0);
  assert.equal(low(sheet[7]!, 'amarillo', 0, 6), 0, 'el pósit se ha caído');
  assert.ok(low(sheet[7]!, 'amarillo', 43, 45) >= 5);
  const papers = (cv: Canvas): number => count(cv, (c) => same(c, SHINE));
  for (const i of BECARIO_ANIM.die) assert.ok(papers(sheet[i]!) >= 9, `fotograma ${i}: papeles`);
  assert.equal(papers(sheet[0]!), 0);
});

test('becario (a4d1): rodando se encoge sin mover el cuerpo y la acreditación da vueltas; disparando se echa atrás', () => {
  const shoeBottom = (cv: Canvas): number => {
    let b = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 12; x < 32; x++) if (cv.get(x, y)[3] === 255) b = Math.max(b, y);
    return b;
  };
  const mid = (cv: Canvas): number => {
    const rows = solidRows(cv).filter((y) => y < 38 && Array.from({ length: cv.w }, (_, x) => x).filter((x) => cv.get(x, y)[3] === 255).length > 20);
    return (Math.min(...rows) + Math.max(...rows)) / 2;
  };
  for (const i of BECARIO_ANIM.roll) {
    assert.ok(shoeBottom(sheet[i]!) <= BECARIO_FEET_Y - 2, `fotograma ${i}: en el aire`);
    assert.ok(Math.abs(mid(sheet[i]!) - mid(sheet[0]!)) <= 1, `fotograma ${i}: el cuerpo no se mueve`);
  }
  assert.ok(shoeBottom(sheet[BECARIO_ANIM.roll[0]!]!) < shoeBottom(sheet[BECARIO_ANIM.roll[5]!]!), 'aterriza estirando las piernas');
  // The badge's red strip moves round from frame to frame.
  const strip = (cv: Canvas): string => {
    const pts: string[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (same(cv.get(x, y), MATERIALS.rojo[2]!)) pts.push(`${x},${y}`);
    return pts.join(' ');
  };
  assert.equal(new Set(BECARIO_ANIM.roll.map((i) => strip(sheet[i]!))).size, 6, 'la acreditación gira');
  const rightEdge = (cv: Canvas, y: number): number => {
    for (let x = cv.w - 1; x >= 0; x--) if (cv.get(x, y)[3] === 255) return x;
    return -1;
  };
  assert.equal(rightEdge(sheet[BECARIO_ANIM.shoot]!, 18), rightEdge(sheet[0]!, 18) - 1);
});

test('heroFrame: el becario usa sus fotogramas propios', () => {
  const L = B.look;
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE / 2 }), BECARIO_ANIM.shoot);
  const seen = new Set<number>();
  for (let px = 0; px < STRIDE_PX; px += 1) seen.add(heroFrame(L, { ...still, moving: true, walked: px }));
  assert.deepEqual([...seen], [...BECARIO_ANIM.walk]);
  assert.equal(heroFrame(L, { ...still, roll: 0.1 }), BECARIO_ANIM.roll[0]);
  assert.equal(heroFrame(L, { ...still, roll: ROLL_SPIN_END + 0.05 }), BECARIO_ANIM.roll[5]);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), BECARIO_ANIM.hurt[0]);
  assert.equal(heroFrame(L, { ...still, dying: true }), BECARIO_ANIM.die[0]);
});
