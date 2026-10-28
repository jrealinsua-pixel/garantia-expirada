import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PATTERNS } from '../src/data/patterns.ts';
import { expandPattern, patternDuration, type PatternDef } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, DT, firePattern, NO_INPUT, step } from '../src/sim/world.ts';

const TAU = Math.PI * 2;
const norm = (a: number): number => ((a % TAU) + TAU) % TAU;
const close = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;

test('anillo: N balas repartidas por igual', () => {
  const shots = expandPattern({ kind: 'ring', count: 8, speed: 50 }, 1.234, new Rng(1));
  assert.equal(shots.length, 8);
  const angles = shots.map((s) => norm(s.angle)).sort((a, b) => a - b);
  for (let i = 1; i < 8; i++) assert.ok(close(angles[i]! - angles[i - 1]!, TAU / 8));
  assert.ok(shots.every((s) => s.delay === 0 && s.speed === 50));
});

test('anillo apuntado: una bala va directa al objetivo', () => {
  const aim = 0.7;
  const shots = expandPattern({ kind: 'ring', count: 6, speed: 50, aimed: true }, aim, new Rng(1));
  assert.ok(shots.some((s) => close(norm(s.angle), norm(aim))));
});

test('abanico: centrado en la mira y con la apertura pedida', () => {
  const aim = 2;
  const shots = expandPattern({ kind: 'fan', count: 5, spreadDeg: 40, speed: 80 }, aim, new Rng(1));
  const a = shots.map((s) => s.angle).sort((x, y) => x - y);
  assert.ok(close(a[2]!, aim));
  assert.ok(close(a[4]! - a[0]!, (40 * Math.PI) / 180));
  const one = expandPattern({ kind: 'fan', count: 1, spreadDeg: 40, speed: 80 }, aim, new Rng(1));
  assert.ok(close(one[0]!.angle, aim));
});

test('espiral: brazos simétricos que giran paso a paso', () => {
  const def: PatternDef = { kind: 'spiral', arms: 2, steps: 4, stepDeg: 15, interval: 0.1, speed: 60 };
  const shots = expandPattern(def, 0, new Rng(1));
  assert.equal(shots.length, 8);
  const step0 = shots.filter((s) => s.delay === 0).map((s) => norm(s.angle)).sort((a, b) => a - b);
  assert.ok(close(step0[1]! - step0[0]!, Math.PI));
  const step1 = shots.filter((s) => close(s.delay, 0.1)).map((s) => norm(s.angle)).sort((a, b) => a - b);
  assert.ok(close(step1[0]! - step0[0]!, (15 * Math.PI) / 180));
  assert.ok(close(patternDuration(def), 0.3));
});

test('ráfaga: disparos espaciados en el tiempo, con dispersión limitada y reproducible', () => {
  const def: PatternDef = { kind: 'burst', count: 5, interval: 0.2, jitterDeg: 5, speed: 100 };
  const a = expandPattern(def, 1, new Rng('r'));
  const b = expandPattern(def, 1, new Rng('r'));
  assert.deepEqual(a, b);
  a.forEach((s, i) => {
    assert.ok(close(s.delay, i * 0.2));
    assert.ok(Math.abs(s.angle - 1) <= (5 * Math.PI) / 180 + 1e-9);
  });
});

test('secuencia: desplaza los tiempos y gira las partes', () => {
  const def: PatternDef = {
    kind: 'sequence',
    parts: [
      { at: 0, pattern: { kind: 'fan', count: 1, spreadDeg: 0, speed: 10 } },
      { at: 0.5, turnDeg: 90, pattern: { kind: 'fan', count: 1, spreadDeg: 0, speed: 10 } },
    ],
  };
  const s = expandPattern(def, 0, new Rng(1));
  assert.equal(s.length, 2);
  assert.ok(close(s[1]!.delay, 0.5));
  assert.ok(close(s[1]!.angle, Math.PI / 2));
  assert.ok(close(patternDuration(def), 0.5));
});

test('todos los patrones de datos se expanden sin errores', () => {
  for (const [name, def] of Object.entries(PATTERNS)) {
    const shots = expandPattern(def, 0, new Rng(name));
    assert.ok(shots.length > 0, name);
    assert.ok(shots.every((s) => Number.isFinite(s.angle) && s.speed > 0), name);
  }
});

test('en el mundo, el emisor suelta las balas a su tiempo y luego desaparece', () => {
  const w = createWorld({ seed: 'emisor' });
  const def = PATTERNS['bombilla-espiral']!;
  const cx = w.room.w / 2;
  const cy = w.room.h / 2;
  firePattern(w, def, cx, cy, 0);
  const total = expandPattern(def, 0, new Rng(1)).length;
  step(w, NO_INPUT);
  const first = w.bullets.filter((b) => b.owner === 'enemy').length;
  assert.equal(first, 3);
  const ticks = Math.ceil(patternDuration(def) / DT) + 2;
  let spawned = first;
  for (let i = 0; i < ticks; i++) {
    const before = new Set(w.bullets.map((b) => b.id));
    step(w, NO_INPUT);
    spawned += w.bullets.filter((b) => !before.has(b.id) && b.owner === 'enemy').length;
  }
  assert.equal(spawned, total);
  assert.equal(w.emitters.length, 0);
});

test('las balas en onda se mueven de lado pero avanzan a su velocidad', () => {
  const w = createWorld({ seed: 'onda' });
  // Row 3 of the test room is empty from wall to wall.
  const cx = 100;
  const cy = 3 * 24 + 12;
  firePattern(w, { kind: 'fan', count: 1, spreadDeg: 0, speed: 60, wave: { amp: 8, freq: 2 } }, cx, cy, 0);
  step(w, NO_INPUT);
  let maxSide = 0;
  for (let i = 0; i < 60; i++) {
    step(w, NO_INPUT);
    const b = w.bullets.find((b) => b.owner === 'enemy')!;
    maxSide = Math.max(maxSide, Math.abs(b.y - cy));
  }
  const b = w.bullets.find((b) => b.owner === 'enemy')!;
  assert.ok(maxSide > 4 && maxSide < 12, `lateral ${maxSide}`);
  assert.ok(Math.abs(b.x - cx - 61) < 3, `avance ${b.x - cx}`);
});
