import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { spawnEnemy } from '../src/sim/world.ts';
import { enemyFrame, MAX_STEP_FPS } from '../src/render/enemyAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { narrowPoseCycle } from '../tools/sprites/pose.ts';
import { ASPIRADOR_LEGS } from '../tools/sprites/characters.ts';
import { MANDO_LEGS } from '../tools/sprites/enemies.ts';

const manifest = JSON.parse(readFileSync('public/assets/sprites.json', 'utf8')) as Record<string, { frames: number }>;
/** Brains that move on their feet (the moth flies, so it flaps instead). */
const WALKERS = new Set(['charger', 'chaser', 'blinker', 'boss']);

test('cada enemigo tiene animación y sus fotogramas existen en la hoja', () => {
  for (const def of Object.values(ENEMIES)) {
    const a = def.anim;
    assert.ok(a, `${def.id} no tiene anim`);
    const n = manifest[def.sprite]!.frames;
    const all = [...a.idle, ...(a.walk ?? []), ...(a.off !== undefined ? [a.off] : [])];
    const shifted = a.phaseShift ? all.map((f) => f + a.phaseShift!) : [];
    for (const f of [...all, ...shifted]) assert.ok(f >= 0 && f < n, `${def.id}: el fotograma ${f} no está en su hoja (${n})`);
    assert.equal(a.idle[0], 0, `${def.id}: el reposo es el fotograma 0 (el aprobado)`);
    assert.ok(a.idle.length >= 2, `${def.id}: el reposo necesita 2 fotogramas como mínimo (docs/ESTILO_ARTE.md)`);
  }
});

test('los enemigos que andan tienen 4 pasos o más, y cada paso es distinto', () => {
  const sheets = allSheets();
  for (const def of Object.values(ENEMIES)) {
    const walks = WALKERS.has(def.brain.kind) || (def.brain.kind === 'turret' && def.brain.walk);
    if (!walks) continue;
    const walk = def.anim!.walk;
    assert.ok(walk && walk.length >= 4, `${def.id} anda y no tiene pasos`);
    const s = sheets[def.sprite]!;
    const frame = (i: number) => {
      const rows: string[] = [];
      for (let y = 0; y < s.frameH; y++) rows.push(s.canvas.p[y]!.slice(i * s.frameW, (i + 1) * s.frameW).map((c) => c.join()).join('|'));
      return rows.join('/');
    };
    const seen = new Set(walk.map(frame));
    assert.equal(seen.size, walk.length, `${def.id}: hay pasos repetidos`);
  }
});

test('andando, el paso cambia con la distancia y no con el tiempo', () => {
  const en = spawnEnemy(1, ENEMIES.aspirador!, 100, 100);
  en.state = 'walk';
  en.vx = 28;
  const a = en.def.anim!;
  en.moved = 0;
  const f0 = enemyFrame(en, 0);
  assert.equal(enemyFrame(en, 900), f0, 'parado en el mismo sitio, el mismo paso');
  en.moved = a.stepPx!;
  assert.notEqual(enemyFrame(en, 0), f0);
  for (let k = 0; k < 8; k++) {
    en.moved = k * a.stepPx!;
    assert.equal(enemyFrame(en, 0), a.walk![k % a.walk!.length]);
  }
});

test('quieto respira; frenando o aturdido se queda en el reposo', () => {
  const en = spawnEnemy(2, ENEMIES.microondas!, 100, 100);
  en.state = 'idle';
  const seen = new Set<number>();
  for (let t = 0; t < 3000; t += 50) seen.add(enemyFrame(en, t));
  assert.deepEqual([...seen].sort(), [0, 1]);
  const asp = spawnEnemy(3, ENEMIES.aspirador!, 100, 100);
  asp.vx = 200;
  for (const st of ['brake', 'stun'] as const) {
    asp.state = st;
    assert.equal(enemyFrame(asp, 1234), 0, st);
  }
});

test('en carrera, los pasos no van más deprisa que el máximo', () => {
  const en = spawnEnemy(4, ENEMIES.aspirador!, 100, 100);
  en.state = 'charge';
  en.vx = 230;
  let changes = 0;
  let last = enemyFrame(en, 0);
  for (let t = 0; t <= 1000; t += 5) {
    en.moved = (230 * t) / 1000;
    const f = enemyFrame(en, t);
    if (f !== last) changes++;
    last = f;
  }
  assert.ok(changes <= MAX_STEP_FPS + 1, `${changes} cambios en un segundo`);
});

test('la bombilla apagada enseña su fotograma apagado y la jefa abierta los suyos', () => {
  const b = spawnEnemy(5, ENEMIES.bombilla!, 100, 100);
  b.state = 'off';
  b.t = 0;
  b.until = 1;
  assert.equal(enemyFrame(b, 0), ENEMIES.bombilla!.anim!.off);
  const n = spawnEnemy(6, ENEMIES['nevera-suprema']!, 100, 100);
  n.state = 'walk';
  const a = n.def.anim!;
  const closed = new Set<number>();
  const open = new Set<number>();
  for (let t = 0; t < 4000; t += 70) closed.add(enemyFrame(n, t));
  n.bossPhase = 1;
  for (let t = 0; t < 4000; t += 70) open.add(enemyFrame(n, t));
  for (const f of open) assert.ok(f >= a.phaseShift!, `fotograma ${f} con la puerta abierta`);
  for (const f of closed) assert.ok(f < a.phaseShift!, `fotograma ${f} con la puerta cerrada`);
});

test('piernas juntas: en los pasos elevados las dos zapatillas no se tapan (Mando y Aspirador)', () => {
  for (const [name, legs] of [['mando', MANDO_LEGS], ['aspirador', ASPIRADOR_LEGS]] as const) {
    for (const { name: f, pose } of narrowPoseCycle(legs[0], legs[1]).slice(2)) {
      const apart = Math.abs(pose.xf - pose.xb) >= 4;
      const lifted = (pose.lift?.px ?? 0) >= 2; // shoes are 2 px tall: a 2 px lift clears the other one
      assert.ok(apart || lifted, `${name} ${f}: las dos zapatillas caen una encima de otra`);
      assert.ok(pose.bob <= 0, `${name} ${f}`);
    }
  }
});

test('la boquilla del Aspirador se queda en el suelo en todos los fotogramas', () => {
  const s = allSheets().aspirador!;
  const region = (i: number) => {
    const rows: string[] = [];
    for (let y = 27; y < 32; y++) rows.push(s.canvas.p[y]!.slice(i * s.frameW + 22, i * s.frameW + 32).map((c) => c.join()).join('|'));
    return rows.join('/');
  };
  const n = s.canvas.w / s.frameW;
  for (let i = 1; i < n; i++) assert.equal(region(i), region(0), `fotograma ${i}: la boquilla se mueve`);
});
