// M14c (a7c): El Router del Wifi and its repeaters redrawn in the new style
// (tools/sprites/router-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeRouter } from '../tools/sprites/router.ts';
import * as RT from '../tools/sprites/router-nuevo.ts';

/** The warehouse floor's middle tone, and Informática's green floor (where it fights). */
const FLOORS = [MATERIALS.suelo[3]!, hx('#304541')];
const def = ENEMIES['router-wifi']!;
const rep = ENEMIES.repetidor!;
const frames = RT.makeRouterNuevoFrames();
const F = RT.ROUTER_FRAMES;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const bottomRow = (f: Canvas, x0: number, x1: number): number => {
  for (let y = f.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (f.get(x, y)[3] === 255) return y;
  return -1;
};

test('estilo a7c: el router y su repetidor se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const floor of FLOORS) {
    for (const [i, f] of [...frames, ...RT.makeRepetidorNuevoFrames()].entries()) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7c: las hojas del juego son las nuevas, más grandes, y los pies pisan el ancla', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [RT.ROUTER_W, RT.ROUTER_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, RT.ROUTER_FEET);
  assert.deepEqual(def.hurt, { x: -28, y: -58, w: 56, h: 46 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) assert.equal(bottomRow(f, def.anchor.x - 18, def.anchor.x + 18), def.anchor.y, `fotograma ${i}: los zapatos no tocan el suelo`);
  assert.ok(area(frames[0]!) > area(makeRouter()) * 1.1, 'más grande que el viejo');
  const bits = allSheets()['despiece-router-wifi']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [RT.ROUTER_BIT, RT.ROUTER_BIT, 6]);
  // The repeater: three frames, its prongs on its anchor, the old hurt box.
  const r = allSheets().repetidor!;
  assert.deepEqual([r.frameW, r.frameH, r.canvas.w / r.frameW], [RT.REPETIDOR_W, RT.REPETIDOR_H, 3]);
  assert.deepEqual(rep.anchor, RT.REPETIDOR_FEET);
  assert.deepEqual(rep.hurt, { x: -8, y: -21, w: 16, h: 20 });
  for (const f of RT.makeRepetidorNuevoFrames()) assert.equal(bottomRow(f, 0, f.w - 1), rep.anchor.y);
});

test('estilo a7c: la carcasa llena la caja de golpes y no se sale mucho de ella', () => {
  const h = def.hurt!;
  const f = frames[0]!;
  const A = def.anchor;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  assert.ok(inside / (h.w * h.h) > 0.85, `la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      if (!isMat(f.get(x, y), 'abs')) continue;
      assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `carcasa en x ${x}`);
      assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `carcasa en y ${y}`);
    }
  }
});

test('estilo a7c: los fotogramas cuadran con su anim y con las poses de cada ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.idle);
  assert.deepEqual(a.walk, F.walk);
  assert.deepEqual(a.reboot, F.reboot);
  assert.equal(a.phaseShift, F.phaseShift);
  // No clap: the reboot is its phase change (and a clap would hide it, enemyAnim.ts).
  assert.equal(a.clap, undefined);
  const brain = def.brain;
  assert.equal(brain.kind, 'boss');
  if (brain.kind !== 'boss') return;
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses[0], [F.waves, F.packets]);
  assert.deepEqual(poses[1], [F.firmware, F.packets2, F.drop]);
  // Every frame is different, except the beat of the heavy walk with both feet down, which is the
  // rest frame, in each phase (the other breathing frame blinks the wifi light).
  const keys = frames.map((f) => f.p.flat().join());
  assert.equal(new Set(keys).size, F.count - 2);
});

test('estilo a7c: las ondas salen del logo del wifi de la frente, que se enciende al emitir', () => {
  const brain = def.brain;
  if (brain.kind !== 'boss') return;
  const m = brain.muzzle!;
  assert.deepEqual(m, RT.ROUTER_MOUTH);
  const at = (f: Canvas) => f.get(def.anchor.x + m.x, def.anchor.y - m.y);
  for (const k of [...F.idle, ...F.walk]) {
    assert.ok(isMat(at(frames[k]!), 'abs'), `fotograma ${k}`);
    assert.ok(isMat(at(frames[k + F.phaseShift]!), 'abs'), `fotograma ${k + F.phaseShift}`);
  }
  assert.ok(isMat(at(frames[F.waves]!), 'cian'), 'cian al emitir');
  assert.ok(isMat(at(frames[F.firmware]!), 'rojo'), 'rojo al emitir, actualizado');
  // The repeater's little logo, between its eyes.
  for (const f of RT.makeRepetidorNuevoFrames().slice(0, 2)) assert.ok(isMat(f.get(rep.anchor.x + 1, rep.anchor.y - 13), 'abs'));
});

test('estilo a7c: la luz de internet siempre en rojo, y al reiniciar se encienden una a una', () => {
  const count = (f: Canvas, m: Material): number => {
    let n = 0;
    for (let y = 60; y < 70; y++) for (let x = 28; x < 54; x++) if (isMat(f.get(x, y), m)) n++;
    return n;
  };
  for (const k of [...F.idle, ...F.walk, F.waves]) {
    assert.ok(count(frames[k]!, 'rojo') >= 1, `fotograma ${k}: la de internet`);
    assert.ok(count(frames[k]!, 'verde') >= 2, `fotograma ${k}: las verdes`);
  }
  const lit = F.reboot.map((k) => count(frames[k]!, 'amarillo'));
  for (let i = 1; i < lit.length; i++) assert.ok(lit[i]! > lit[i - 1]!, `luces ${lit.join(', ')}`);
  assert.equal(count(frames[F.reboot[0]]!, 'verde'), 0, 'reiniciando, ninguna verde');
  // Updated: the eyes go red.
  const eyes = (f: Canvas, m: Material): number => {
    let n = 0;
    for (let y = 46; y < 56; y++) for (let x = 28; x < 64; x++) if (isMat(f.get(x, y), m)) n++;
    return n;
  };
  assert.ok(eyes(frames[0]!, 'verde') >= 6 && eyes(frames[0]!, 'rojo') === 0);
  assert.ok(eyes(frames[F.phaseShift]!, 'rojo') >= 6 && eyes(frames[F.phaseShift]!, 'verde') === 0);
});
