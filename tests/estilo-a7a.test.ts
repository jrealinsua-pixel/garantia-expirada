// M14c (a7a): La Nevera Suprema redrawn in the new style (tools/sprites/nevera-nuevo.ts), checked
// against the style guide and the game's data (its frames, poses, mouth and hurt box).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeNevera } from '../tools/sprites/characters.ts';
import * as NV from '../tools/sprites/nevera-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;
const def = ENEMIES['nevera-suprema']!;
const frames = NV.makeNeveraNuevaFrames();
const F = NV.NEVERA_FRAMES;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;

test('estilo a7a: la nevera se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const [i, f] of frames.entries()) {
    const l = legibility(f, FLOOR);
    assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
  }
});

test('estilo a7a: la hoja del juego es la nueva, más grande, y los zapatos pisan el ancla', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [NV.NEVERA_W, NV.NEVERA_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, NV.NEVERA_FEET);
  assert.deepEqual(def.hurt, { x: -25, y: -70, w: 48, h: 62 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) {
    let bottom = -1;
    for (let y = f.h - 1; y >= 0 && bottom < 0; y--) for (let x = def.anchor.x - 16; x <= def.anchor.x + 16; x++) if (f.get(x, y)[3] === 255) bottom = y;
    assert.equal(bottom, def.anchor.y, `fotograma ${i}: los zapatos no tocan el suelo`);
  }
  assert.ok(area(frames[0]!) > area(makeNevera()) * 1.1, 'más grande que la vieja');
  // Its debris: six pieces of its own.
  const bits = allSheets()['despiece-nevera-suprema']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [NV.NEVERA_BIT, NV.NEVERA_BIT, 6]);
});

test('estilo a7a: el cuerpo llena la caja de golpes y no se sale mucho de ella', () => {
  const h = def.hurt!;
  const f = frames[0]!;
  const A = def.anchor;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  assert.ok(inside / (h.w * h.h) > 0.85, `la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
  // The cabinet (enamel) stays within 6 px of the box on each side: what sticks out are the
  // gloves and the crown, which a bullet can graze.
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      if (y >= A.y - 4 || !isMat(f.get(x, y), 'esmalte')) continue;
      assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `esmalte en x ${x}`);
      assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `esmalte en y ${y}`);
    }
  }
});

test('estilo a7a: los fotogramas cuadran con su anim y con las poses de cada ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.idle);
  assert.deepEqual(a.walk, F.walk);
  assert.equal(a.phaseShift, F.phaseShift);
  assert.equal(a.clap, F.burst);
  const brain = def.brain;
  assert.equal(brain.kind, 'boss');
  if (brain.kind !== 'boss') return;
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  // Phase 1 poses are shut-door frames, phase 2 ones open-door frames (or none).
  for (const p of poses[0]!) assert.ok(p !== undefined && p < F.phaseShift && p !== F.burst, `fase 1: pose ${p}`);
  for (const p of poses[1]!) if (p !== undefined) assert.ok(p >= F.phaseShift + 6 && p < F.count, `fase 2: pose ${p}`);
  assert.deepEqual([...new Set(poses.flat().filter((p) => p !== undefined))].sort((x, y) => x! - y!), [F.cubes, F.frost, F.cards, F.spit]);
  // Every frame is different, except two beats of the heavy walk (both feet down), which are the
  // two breathing frames, in each phase.
  const keys = frames.map((f) => f.p.flat().join());
  assert.equal(new Set(keys).size, F.count - 4);
});

test('estilo a7a: las balas salen de su boca (el dispensador, y la nevera abierta en la fase 2)', () => {
  const brain = def.brain;
  if (brain.kind !== 'boss') return;
  const m = brain.muzzle!;
  assert.deepEqual(m, NV.NEVERA_MOUTH);
  const at = (f: Canvas, dx: number, dy: number) => f.get(def.anchor.x + dx, def.anchor.y - dy);
  // Shut: the dark well of the dispenser (cyan while it shoots).
  for (const k of [...F.idle, ...F.walk]) assert.ok(isMat(at(frames[k]!, m.x, m.y), 'pantalla') || isMat(at(frames[k]!, m.x, m.y), 'acero'), `fotograma ${k}`);
  assert.ok(isMat(at(frames[F.cubes]!, m.x - 4, m.y), 'cian'), 'el dispensador se enciende al disparar');
  // Open: its lit inside, where the cards and the expired food come from.
  const spit = brain.phases[1]!.attacks.find((x) => x.kind === 'spit')!;
  const from = 'from' in spit ? spit.from! : m;
  for (const k of [...F.idle, ...F.walk, F.cards - F.phaseShift, F.spit - F.phaseShift]) {
    const f = frames[k + F.phaseShift]!;
    for (const [dx, dy] of [[m.x, m.y], [from.x, from.y]] as const) {
      const c = at(f, dx, dy);
      assert.ok(c[3] === 255 && !isMat(c, 'esmalte') && !isMat(c, 'pantalla'), `fotograma ${k + F.phaseShift}: (${dx}, ${dy}) no está dentro de la nevera`);
    }
  }
});

test('estilo a7a: la cara está en el congelador y la corona encima, en todas las fases', () => {
  for (const [i, f] of frames.entries()) {
    // The eyes' pilot lights (red; cyan through the frost; white when the door bursts).
    let lights = 0;
    for (let y = 20; y < 36; y++) for (let x = 20; x < 60; x++) if (isMat(f.get(x, y), i === F.frost ? 'cian' : 'rojo')) lights++;
    assert.ok(lights >= 6, `${i}: los ojos (${lights})`);
    let gold = 0;
    for (let y = 0; y < 16; y++) for (let x = 20; x < 60; x++) if (isMat(f.get(x, y), 'laton')) gold++;
    assert.ok(gold >= 40, `${i}: la corona (${gold})`);
  }
});
