// M14 glosario (g1): the profile counts the enemies taken apart of each kind, so the glossary
// knows which ones the player has discovered and the achievements can ask for «100 of a kind».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { emptyProfile, parseProfile, recordEnding, recordFloor, recordRun, type RunResult } from '../src/sim/profile.ts';
import { checkInvariants, createWorld, step } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';

const run: RunResult = {
  character: 'tostadora',
  outcome: 'down',
  seconds: 200,
  kills: 5,
  coupons: 3,
  bosses: [],
  items: [],
  weapons: ['secador'],
  killsBy: { microondas: 3, batidora: 2 },
};

test('la partida cuenta las bajas de cada tipo, y suman lo mismo que las bajas', () => {
  const w = createWorld({ seed: 'glosario-sala', room: 'pasillo-devoluciones' });
  w.noDamage = true;
  const bot = new Bot('glosario-sala');
  for (let i = 0; i < 60 * 90 && !(w.kills > 0 && w.enemies.length === 0); i++) {
    step(w, bot.think(w));
    assert.deepEqual(checkInvariants(w), [], `tick ${i}`);
  }
  assert.ok(w.kills > 0, 'el bot ha desmontado algo');
  const sum = Object.values(w.killsBy).reduce((a, b) => a + b, 0);
  assert.equal(sum, w.kills);
  for (const id of Object.keys(w.killsBy)) assert.ok(ENEMIES[id], `${id} es un enemigo de verdad`);
});

test('el perfil suma las bajas de cada tipo de la partida, de cada planta y del final', () => {
  const p0 = emptyProfile();
  assert.deepEqual(p0.killed, {});
  const p1 = recordFloor(p0, { character: 'tostadora', seconds: 100, items: [], weapons: [], killsBy: { microondas: 4 } });
  assert.deepEqual(p1.killed, { microondas: 4 });
  assert.deepEqual(p0.killed, {}, 'el perfil viejo no cambia');
  const p2 = recordRun(p1, run);
  assert.deepEqual(p2.killed, { microondas: 7, batidora: 2 });
  // A won run (outcome «floor») counts the last floor once, not twice.
  const p3 = recordRun(p2, { ...run, outcome: 'floor', killsBy: { batidora: 1 } });
  assert.deepEqual(p3.killed, { microondas: 7, batidora: 3 });
  const p4 = recordEnding(p3, { character: 'tostadora', seconds: 60, items: [], weapons: [], killsBy: { trituradora: 1 } });
  assert.equal(p4.killed['trituradora'], 1);
  // Runs from before (no killsBy) still go in.
  const { killsBy: _, ...old } = run;
  assert.deepEqual(recordRun(p4, old).killed, p4.killed);
});

test('las bajas por tipo se guardan, y un guardado viejo o raro no rompe nada', () => {
  const p = recordRun(emptyProfile(), run);
  assert.deepEqual(parseProfile(JSON.stringify(p)).killed, { microondas: 3, batidora: 2 });
  const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
  delete old.killed;
  assert.deepEqual(parseProfile(JSON.stringify(old)).killed, {});
  assert.deepEqual(parseProfile(JSON.stringify({ ...p, killed: { microondas: -2, batidora: 'mucho', nevera: 2.7 } })).killed, { nevera: 2 });
  assert.deepEqual(parseProfile(JSON.stringify({ ...p, killed: [1, 2] })).killed, {});
});
