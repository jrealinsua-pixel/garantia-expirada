// M14c (a4d2): the Móvil Reacondicionado in the new style, with its own frames (walk 6, roll 6,
// shoot, knocked, dying) like the other four (tools/sprites/movil.ts).
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
  PHONE_ANIM, PHONE_EXTRA, PHONE_FEET_X, PHONE_FEET_Y, PHONE_FRAMES, PHONE_H, PHONE_SPIN_Y, PHONE_W,
  makePhoneFrames, makePhoneHand, makePhoneOff, makePhoneSheet,
} from '../tools/sprites/movil.ts';
import { makeBecarioFrames } from '../tools/sprites/becario.ts';
import { makeBlenderFrames } from '../tools/sprites/batidora-vaso.ts';
import { makeIronFrames } from '../tools/sprites/plancha-vapor.ts';
import { makeToasterFrames } from '../tools/sprites/tostadora.ts';

const M = CHARACTERS.movil!;
const FLOOR = MATERIALS.suelo[2]!;
const sheet = makePhoneSheet();
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const solidRows = (cv: Canvas): number[] => Array.from({ length: cv.h }, (_, y) => y).filter((y) => Array.from({ length: cv.w }, (_, x) => x).some((x) => cv.get(x, y)[3] === 255));
const count = (cv: Canvas, ok: (c: readonly number[]) => boolean, y0 = 0, y1 = cv.h - 1, x0 = 0, x1 = cv.w - 1): number => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (ok(cv.get(x, y))) n++;
  return n;
};
const diff = (a: Canvas, b: Canvas): number => {
  let n = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (!same(a.get(x, y), b.get(x, y))) n++;
  return n;
};
const of = (m: keyof typeof MATERIALS) => (c: readonly number[]): boolean => c[3] === 255 && MATERIALS[m].some((t) => same(t, c));
const still: HeroState = { now: 0, moving: false, walked: 0, roll: null, sinceShot: Infinity, hurt: 0, dying: false, broken: false };
// The glass, inside the case (frame coordinates at rest).
const GLASS = [15, 12, 30, 33] as const;
const onGlass = (cv: Canvas, ok: (c: readonly number[]) => boolean, dy = 0): number => count(cv, ok, GLASS[1] + dy, GLASS[3] + dy, GLASS[0], GLASS[2]);

test('móvil (a4d2): la hoja es la nueva, con los ocho de siempre y sus dieciséis, y su ficha lo dice', () => {
  assert.equal(PHONE_FRAMES.length, 8);
  assert.equal(PHONE_EXTRA.length, 16);
  assert.equal(sheet.length, 24);
  const s = allSheets()['movil']!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [PHONE_W, PHONE_H, 24]);
  assert.deepEqual([M.look.w, M.look.h, M.look.feetX, M.look.feetY, M.look.spinY], [PHONE_W, PHONE_H, PHONE_FEET_X, PHONE_FEET_Y, PHONE_SPIN_Y]);
  assert.deepEqual(M.look.anim, {
    walk: [...PHONE_ANIM.walk], roll: [...PHONE_ANIM.roll], shoot: PHONE_ANIM.shoot, hurt: [...PHONE_ANIM.hurt], die: [...PHONE_ANIM.die],
  });
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.deepEqual(manifest['movil'], { file: 'movil.png', frameW: PHONE_W, frameH: PHONE_H, frames: 24 });
  // Switched off it is drawn in the same frame, so it does not jump.
  const off = makePhoneOff();
  assert.deepEqual([off.w, off.h], [PHONE_W, PHONE_H]);
  // Rose-gold mitts, and a shadow half as wide as the case.
  assert.equal(M.look.hand, 'mano-movil');
  assert.ok(count(makePhoneHand(), of('ororosa')) > 10);
  assert.equal(M.look.shadowRx, 12);
});

test('móvil (a4d2): pisa donde dice su ficha, centrado sobre los pies, y gira por el medio de la carcasa', () => {
  for (const [i, f] of makePhoneFrames().entries()) assert.equal(Math.max(...solidRows(f)), PHONE_FEET_Y, `fotograma ${i}`);
  for (const i of [...PHONE_ANIM.walk, PHONE_ANIM.shoot, ...PHONE_ANIM.hurt, ...PHONE_ANIM.die]) {
    assert.equal(Math.max(...solidRows(sheet[i]!)), PHONE_FEET_Y, `fotograma ${i}: de pie`);
  }
  const rest = sheet[0]!;
  const centre = (y0: number, y1: number, x0 = 0): number => {
    let lo = rest.w;
    let hi = -1;
    for (let y = y0; y <= y1; y++) for (let x = x0; x < rest.w; x++) if (rest.get(x, y)[3] === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return (lo + hi + 1) / 2;
  };
  assert.ok(Math.abs(centre(PHONE_FEET_Y - 3, PHONE_FEET_Y - 1, 13) - PHONE_FEET_X) <= 1.5, 'las zapatillas');
  assert.ok(Math.abs(centre(20, 36, 9) - PHONE_FEET_X) <= 1.5, 'la carcasa (sin la mano)');
  const body = solidRows(rest).filter((y) => y < 40);
  assert.ok(Math.abs(PHONE_SPIN_Y - (Math.min(...body) + Math.max(...body)) / 2) <= 2, `${Math.min(...body)}–${Math.max(...body)}`);
  const o = classicOrigin(M.look, 0.5, 1);
  assert.ok(Math.abs(M.look.feetY - o.y * M.look.h - (CLASSIC_FRAME.feetY - CLASSIC_FRAME.h)) < 1e-9);
});

test('móvil (a4d2): estilo nuevo (tinta violeta, nunca el negro viejo), legible, en oro rosa y distinto de los otros cuatro', () => {
  const OLD_K = hx('#0e0c16');
  for (const [i, f] of [...sheet, makePhoneOff()].entries()) {
    assert.equal(count(f, (c) => same(c, OLD_K)), 0, `fotograma ${i}: negro viejo`);
    assert.ok(count(f, (c) => same(c, INK)) > 40, `fotograma ${i}: contorno de tinta`);
    const l = legibility(f, FLOOR);
    assert.ok(l.edgeContrast >= 1.6, `fotograma ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.darkEdge >= 0.8, `fotograma ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.melts <= 0.33, `fotograma ${i}: se funde con el suelo el ${(l.melts * 100).toFixed(0)} %`);
  }
  const rest = sheet[0]!;
  assert.ok(count(rest, of('ororosa')) > 350, `oro rosa ${count(rest, of('ororosa'))}`);
  assert.ok(onGlass(rest, of('pantalla')) > 200, 'el cristal negro');
  for (const other of [makeToasterFrames()[0]!, makeBlenderFrames()[0]!, makeIronFrames()[0]!, makeBecarioFrames()[0]!]) {
    assert.equal(count(other, of('ororosa')), 0, 'solo él es de oro rosa');
    assert.ok(silhouetteOverlap(rest, other) < 0.8, `solape ${silhouetteOverlap(rest, other).toFixed(2)}`);
  }
});

test('móvil (a4d2): la batería al 1 %, el globo sin leer, se carga andando y se apaga con el logo', () => {
  const red = of('rojo');
  // The badge: red sticking out of the top corner of the case.
  assert.ok(count(sheet[0]!, red, 0, 9, 29, 39) >= 10, 'el globo de notificaciones');
  assert.ok(count(sheet[0]!, red, 12, 12, 26, 26) === 1, 'la batería al 1 %');
  // Walking: the yellow bolt on the status bar; standing, none.
  const bolt = (cv: Canvas, dy: number): number => count(cv, of('amarillo'), 12 + dy, 13 + dy, 22, 25);
  for (const i of PHONE_ANIM.walk) assert.ok(bolt(sheet[i]!, PHONE_EXTRA[i - 8]!.bob) >= 2, `fotograma ${i}: cargando`);
  assert.equal(bolt(sheet[0]!, 0), 0);
  // Off: no face, no badge, the power symbol.
  const off = makePhoneOff();
  assert.equal(count(off, red), 0);
  assert.equal(onGlass(off, (c) => c[3] === 255 && same(c, MATERIALS.acero[0]!), 1), 0, 'sin ojos');
  assert.ok(onGlass(off, of('acero'), 1) >= 4, 'el logo');
});

test('móvil (a4d2): cada fotograma es distinto; el golpe raya la pantalla, al morir sale la batería vacía y chispas, y roto se queda negro', () => {
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) assert.ok(diff(sheet[i]!, sheet[j]!) > 0, `${i} y ${j} son iguales`);
  for (let k = 0; k < 6; k++) assert.ok(diff(sheet[PHONE_ANIM.walk[k]!]!, sheet[PHONE_ANIM.walk[(k + 1) % 6]!]!) >= 12, `paso ${k}`);
  // The glitch: a full red band across the glass.
  const band = (cv: Canvas): boolean => Array.from({ length: cv.h }, (_, y) => y).some((y) => count(cv, of('rojo'), y, y, 15, 31) >= 14);
  for (const i of [PHONE_ANIM.hurt[0], 6]) assert.ok(band(sheet[i]!), `fotograma ${i}: la pantalla se raya`);
  assert.ok(!band(sheet[0]!));
  // Dying: the empty battery (a white frame with the red sliver) and sparks off the slab.
  const spark = (cv: Canvas): number => count(cv, (c) => same(c, [255, 244, 170, 255]));
  for (const i of PHONE_ANIM.die) assert.ok(spark(sheet[i]!) >= 3, `fotograma ${i}: chispas`);
  assert.equal(spark(sheet[0]!), 0);
  assert.ok(count(sheet[PHONE_ANIM.die[0]]!, of('acero'), 18, 27, 17, 29) >= 30, 'la batería vacía');
  // Broken: black glass, no face, no badge, the crack longer and the cable unplugged on the floor.
  const broken = sheet[7]!;
  assert.equal(count(broken, of('rojo')), 0);
  assert.ok(count(broken, of('vidrio')) > count(sheet[0]!, of('vidrio')) + 15, 'la grieta ha corrido');
  assert.ok(count(broken, of('acero'), 43, 46, 25, 39) >= 6, 'el cable desenchufado delante');
});

test('móvil (a4d2): rodando se encoge sin mover la carcasa y sale la rueda de carga; disparando se echa atrás', () => {
  const shoeBottom = (cv: Canvas): number => {
    let b = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 14; x < 32; x++) if (cv.get(x, y)[3] === 255) b = Math.max(b, y);
    return b;
  };
  const top = (cv: Canvas): number => Math.min(...solidRows(cv));
  for (const i of PHONE_ANIM.roll) {
    assert.ok(shoeBottom(sheet[i]!) <= PHONE_FEET_Y - 2, `fotograma ${i}: en el aire`);
    assert.equal(top(sheet[i]!), top(sheet[0]!), `fotograma ${i}: la carcasa no se mueve`);
  }
  assert.ok(shoeBottom(sheet[PHONE_ANIM.roll[0]!]!) < shoeBottom(sheet[PHONE_ANIM.roll[5]!]!), 'aterriza estirando las piernas');
  // The loading wheel: its brightest dot goes round (no eyes while rolling).
  const lead = (cv: Canvas): string => {
    const pts: string[] = [];
    for (let y = 14; y < 30; y++) for (let x = 15; x <= 30; x++) if (same(cv.get(x, y), MATERIALS.acero[0]!)) pts.push(`${x},${y}`);
    return pts.join(' ');
  };
  assert.equal(new Set(PHONE_ANIM.roll.map((i) => lead(sheet[i]!))).size, 6, 'la rueda gira');
  for (const i of PHONE_ANIM.roll) assert.ok(lead(sheet[i]!).split(' ').length <= 2, `fotograma ${i}: sin ojos`);
  const rightEdge = (cv: Canvas, y: number): number => {
    for (let x = cv.w - 1; x >= 0; x--) if (cv.get(x, y)[3] === 255) return x;
    return -1;
  };
  assert.equal(rightEdge(sheet[PHONE_ANIM.shoot]!, 24), rightEdge(sheet[0]!, 24) - 1);
});

test('heroFrame: el móvil usa sus fotogramas propios', () => {
  const L = M.look;
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE / 2 }), PHONE_ANIM.shoot);
  const seen = new Set<number>();
  for (let px = 0; px < STRIDE_PX; px += 1) seen.add(heroFrame(L, { ...still, moving: true, walked: px }));
  assert.deepEqual([...seen], [...PHONE_ANIM.walk]);
  assert.equal(heroFrame(L, { ...still, roll: 0.1 }), PHONE_ANIM.roll[0]);
  assert.equal(heroFrame(L, { ...still, roll: ROLL_SPIN_END + 0.05 }), PHONE_ANIM.roll[5]);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), PHONE_ANIM.hurt[0]);
  assert.equal(heroFrame(L, { ...still, dying: true }), PHONE_ANIM.die[0]);
});
