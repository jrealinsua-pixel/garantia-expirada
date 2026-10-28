import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { ChaserBrain } from '../src/data/types.ts';
import { inTurbo } from '../src/sim/enemies.ts';
import { createWorld, NO_INPUT, step, type SimEvent, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;
const def = ENEMIES.batidora!;
const brain = def.brain as ChaserBrain;

/** Test room with only the mixer at (ex, row 3) and the toaster at (px, row 3). */
function arena(ex: number, px: number): World {
  const w = createWorld({ seed: 'batidora' });
  w.enemies = w.enemies.filter((e) => e.def.id === 'batidora');
  const en = w.enemies[0]!;
  en.x = ex;
  en.y = ROW3;
  w.player.x = px;
  w.player.y = ROW3;
  w.noDamage = true;
  return w;
}

function runUntil(w: World, pred: (e: SimEvent) => boolean, maxTicks = 600): SimEvent | null {
  for (let i = 0; i < maxTicks; i++) {
    step(w, NO_INPUT);
    const e = w.events.find(pred);
    if (e) return e;
  }
  return null;
}

test('batidora: persigue a la tostadora andando', () => {
  const w = arena(120, 400);
  const en = w.enemies[0]!;
  for (let i = 0; i < 60; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'walk');
  assert.ok(en.x > 150, `se acerca (x = ${en.x.toFixed(1)})`);
  assert.equal(en.facing, 1);
});

test('batidora: de cerca avisa, se lanza en línea recta y frena', () => {
  const w = arena(200, 250);
  const en = w.enemies[0]!;
  const warn = runUntil(w, (e) => e.type === 'telegraph' && e.source === en.id);
  assert.ok(warn, 'avisa');
  assert.equal(en.state, 'warn');
  const lunge = runUntil(w, (e) => e.type === 'lunge', 60);
  assert.ok(lunge && lunge.type === 'lunge');
  assert.ok(lunge.dirX > 0.9, 'hacia la tostadora');
  const x0 = en.x;
  for (let i = 0; i < Math.round(brain.lungeTime * 60); i++) step(w, NO_INPUT);
  assert.ok(en.x - x0 > brain.lungeSpeed * brain.lungeTime * 0.6, `recorre la embestida (${(en.x - x0).toFixed(1)} px)`);
  for (let i = 0; i < 10; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'brake');
});

test('batidora: el golpe quita medio corazón', () => {
  const w = arena(200, 240);
  w.noDamage = false;
  const hp = w.player.hp;
  const hurt = runUntil(w, (e) => e.type === 'hurt', 300);
  assert.ok(hurt && hurt.type === 'hurt');
  assert.equal(w.player.hp, hp - 1);
});

test('batidora: con un tercio de vida entra en TURBO y va más deprisa', () => {
  const slow = arena(120, 420);
  const fast = arena(120, 420);
  const en = fast.enemies[0]!;
  en.damageTaken = Math.ceil(def.hp * 0.7);
  assert.ok(inTurbo(en));
  assert.ok(!inTurbo(slow.enemies[0]!));
  const ev = runUntil(fast, (e) => e.type === 'turbo', 2);
  assert.ok(ev, 'avisa del turbo una vez');
  for (let i = 0; i < 60; i++) {
    step(slow, NO_INPUT);
    step(fast, NO_INPUT);
    assert.ok(!fast.events.some((e) => e.type === 'turbo'), 'solo una vez');
  }
  assert.ok(fast.enemies[0]!.x - 120 > (slow.enemies[0]!.x - 120) * 1.3, 'corre más');
});

test('batidora: rodando se le atraviesa la embestida sin daño', () => {
  const w = arena(150, 250);
  w.noDamage = false;
  const hp = w.player.hp;
  runUntil(w, (e) => e.type === 'lunge', 300);
  step(w, { ...NO_INPUT, moveY: 1, roll: true });
  for (let i = 0; i < 12; i++) step(w, { ...NO_INPUT, moveY: 1 });
  assert.equal(w.player.hp, hp);
});
