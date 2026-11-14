// M14c (a7i): La Trituradora, the final boss, redrawn in the new style
// (tools/sprites/trituradora-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeTrituradoraFrames } from '../tools/sprites/trituradora.ts';
import * as T from '../tools/sprites/trituradora-nuevo.ts';

/** The warehouse floor's middle tone (the style guide's) and the workshop's olive floor tile. */
const FLOORS = [MATERIALS.suelo[3]!, hx('#47463c')];
const def = ENEMIES.trituradora!;
const brain = def.brain as BossBrain;
const frames = T.makeTrituradoraNuevaFrames();
const L = T.TRITURADORA_LAYOUT;
const N = T.TRITURADORA_FRAMES;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const count = (cv: Canvas, m: Material, x0 = 0, y0 = 0, x1 = cv.w, y1 = cv.h): number => {
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (cv.get(x, y)[3] === 255 && isMat(cv.get(x, y), m)) n++;
  return n;
};
const bottomRow = (f: Canvas): number => {
  for (let y = f.h - 1; y >= 0; y--) for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) return y;
  return -1;
};
const fill = (f: Canvas): number => {
  const h = def.hurt!;
  const A = def.anchor;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  return inside / (h.w * h.h);
};

test('estilo a7i: el material nuevo, la maquinaria, se despega del suelo del taller', () => {
  const m = MATERIALS.maquinaria;
  assert.ok(m.length >= 5);
  // Its front tone against the workshop's olive floor.
  const lum = (c: readonly number[]): number => 0.2126 * (c[0]! / 255) ** 2.2 + 0.7152 * (c[1]! / 255) ** 2.2 + 0.0722 * (c[2]! / 255) ** 2.2;
  assert.ok((lum(m[2]!) + 0.05) / (lum(FLOORS[1]!) + 0.05) > 3, 'el frente, mucho más claro que el suelo');
});

test('estilo a7i: se lee sobre el suelo', () => {
  for (const [i, f] of frames.entries()) {
    for (const floor of FLOORS) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${N[i]}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${N[i]}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${N[i]}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7i: la hoja del juego es la nueva, más grande, las orugas pisan el ancla y llena su caja de golpes', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [T.TRITURADORA_W, T.TRITURADORA_H, L.count]);
  assert.equal(frames.length, L.count);
  assert.equal(N.length, L.count);
  assert.deepEqual(def.anchor, T.TRITURADORA_FEET);
  assert.deepEqual(def.hurt, { x: -35, y: -80, w: 72, h: 76 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) assert.equal(bottomRow(f), def.anchor.y, `${N[i]}: no pisa el suelo`);
  assert.ok(area(frames[0]!) > area(makeTrituradoraFrames()[0]!) * 1.1, 'más grande que la vieja');
  for (const [i, f] of frames.entries()) assert.ok(fill(f) > 0.8, `${N[i]}: llena el ${(100 * fill(f)).toFixed(0)} %`);
  const bits = allSheets()['despiece-trituradora']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [T.TRITURADORA_BIT, T.TRITURADORA_BIT, 6]);
});

test('estilo a7i: los fotogramas cuadran con su anim, las fases y una pose por ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, L.idle);
  assert.deepEqual(a.walk, L.walk);
  assert.equal(a.warn, L.warn);
  assert.equal(a.clap, L.clap);
  assert.deepEqual(brain.phases.map((p) => p.look), [undefined, L.despiece, L.calidad]);
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.ok(poses[0]!.every((p) => p === L.warn), 'cada diagnóstico, con el escáner');
  assert.deepEqual(poses[1], [L.screws, L.springs, L.keys]);
  assert.deepEqual(poses[2], [L.label, L.screws, L.springs, L.keys]);
  assert.deepEqual([N[L.warn], N[L.clap], N[L.screws], N[L.springs], N[L.keys], N[L.label]], ['diagnostico', 'cambio', 'tornillos', 'muelles', 'teclas', 'calidad']);
  assert.equal(new Set(frames.map((f) => f.p.flat().join())).size, L.count, 'ningún fotograma repetido');
  // The muzzle (the output slot) is on it, between the teeth.
  const m = brain.muzzle;
  for (const f of frames) assert.equal(f.get(def.anchor.x + m.x, def.anchor.y - m.y)[3], 255);
});

test('estilo a7i: los pilotos dicen en qué fase está; la baliza se enciende con el despiece', () => {
  // The lamps' glass, both eyes: green at rest, amber diagnosing, red taking apart.
  const eyes = (f: Canvas, m: Material): number => count(f, m, 45, 50, 80, 61);
  assert.ok(eyes(frames[0]!, 'verde') > 30 && eyes(frames[0]!, 'rojo') === 0);
  assert.ok(eyes(frames[L.warn]!, 'amarillo') > 30, 'ámbar al diagnosticar');
  for (const i of [...L.despiece.idle, ...L.despiece.walk, L.despiece.warn, L.screws, L.springs, L.keys]) assert.ok(eyes(frames[i]!, 'rojo') > 30, `${N[i]}: rojo`);
  for (const i of [...L.calidad.idle, L.calidad.warn, L.label]) assert.ok(eyes(frames[i]!, 'verde') > 30 && eyes(frames[i]!, 'rojo') === 0, `${N[i]}: verde`);
  // The beacon (a dome at the top right), dark in phase 1, lit after.
  const beacon = (f: Canvas): number => count(f, 'amarillo', 80, 0, 89, 6);
  const lit = (f: Canvas): boolean => {
    for (let y = 0; y < 6; y++) for (let x = 80; x < 89; x++) {
      const c = f.get(x, y);
      if (c[3] === 255 && (same(c, MATERIALS.amarillo[0]!) || same(c, MATERIALS.amarillo[1]!))) return true;
    }
    return false;
  };
  assert.ok(beacon(frames[0]!) > 8 && !lit(frames[0]!), 'apagada en el diagnóstico');
  assert.ok(lit(frames[L.despiece.idle[0]]!) && lit(frames[L.calidad.idle[0]]!), 'encendida después');
  // «Control de calidad»: stickers of «APTO» on it (more green than in phase 2).
  assert.ok(count(frames[L.calidad.idle[0]]!, 'verde') > count(frames[L.despiece.idle[0]]!, 'verde') + 30);
  // Its tools: the scanner (rubber and a red window), the screwdriver, the spring, the keyboard, the gun.
  assert.ok(count(frames[L.screws]!, 'acero', 8, 18, 14, 38) > 15, 'el destornillador');
  assert.ok(count(frames[L.keys]!, 'beige', 88, 46, 108, 58) > 60, 'el teclado');
  assert.ok(count(frames[L.label]!, 'rojo', 86, 48, 104, 64) > 40, 'la etiquetadora');
});

test('estilo a7i: la placa del juego es la del cuerpo, el escáner apunta donde dice el juego', () => {
  const plate = T.makeServicePlate();
  const P = T.PLATE;
  assert.deepEqual([plate.w, plate.h], [P.w, P.h]);
  const bd = def.anim!.badge!;
  for (const [i, f] of frames.entries()) {
    const dy = bd.frameDy?.[i] ?? 0;
    for (let y = 0; y < P.h; y++) for (let x = 0; x < P.w; x++) assert.ok(same(f.get(P.x + x, P.y + dy + y), plate.get(x, y)), `${N[i]}: la placa en (${x}, ${y})`);
  }
  // The scanner's window is red, where GameScene starts its beam from.
  const f = frames[L.warn]!;
  const c = f.get(def.anchor.x + T.SCANNER_TIP.x, def.anchor.y - T.SCANNER_TIP.y);
  assert.ok(c[3] === 255 && (isMat(c, 'rojo') || c[0] > 240), 'la ventana del escáner');
  const src = readFileSync(new URL('../src/render/GameScene.ts', import.meta.url), 'utf8');
  assert.ok(src.includes(`const SCANNER_TIP = { x: ${T.SCANNER_TIP.x}, y: ${T.SCANNER_TIP.y} } as const;`), 'GameScene usa la misma punta');
});
