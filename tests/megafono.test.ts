// M11 (6c2): the Megáfono de Reclamaciones, floor 5's weapon that goes through everyone and shoves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, weaponsUpTo } from '../src/data/weapons.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { moddedWeapon } from '../src/sim/mods.ts';
import { createWorld, DT, giveWeapon, NO_INPUT, spawnEnemy, step, SWAP_TIME, type World } from '../src/sim/world.ts';

const M = WEAPONS.megafono!;

/** The test room with nothing in the way, the toaster holding the megaphone (ready to fire). */
function range(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  giveWeapon(w, 'megafono');
  for (let i = 0; i < Math.ceil(SWAP_TIME / DT) + 2; i++) step(w, NO_INPUT);
  return w;
}

function still(w: World, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

test('el Megáfono es de la planta 5: no sale en las de abajo y sí en Atención al Cliente', () => {
  assert.equal(M.level, 5);
  for (let level = 1; level <= 4; level++) assert.ok(!weaponsUpTo(level).includes('megafono'), `planta ${level}`);
  assert.ok(weaponsUpTo(5).includes('megafono'));
  // The floors below hand out what they always did, in the same order.
  assert.deepEqual(weaponsUpTo(1), ['grapadora', 'plancha']);
  const w = createWorld({ seed: 'megafono-planta', floor: true, level: 5 });
  assert.ok(w.floor!.weapons.includes('megafono'));
  assert.ok(!createWorld({ seed: 'megafono-planta', floor: true, level: 4 }).floor!.weapons.includes('megafono'));
});

test('en el papel: atraviesa a todos y empuja más que nada; corto alcance, y daño por golpe y cadencia, los peores', () => {
  const others = Object.values(WEAPONS).filter((d) => d.id !== 'megafono');
  assert.ok((M.bullets?.pierce ?? 0) >= 20);
  assert.ok(others.every((d) => M.knockback > d.knockback));
  // Reach: about the iron's (a little more, so the iron is still the shortest), half the stapler's.
  // (The Batidora's Picahielos, M13 (3), and the Plancha's starch spray, M13 (4), reach about as
  // far: they are weapons for close up.)
  assert.ok(others.every((d) => d.id === 'plancha' || d.id === 'picahielos' || d.id === 'almidon' || weaponProfile(M).range < weaponProfile(d).range / 2));
  assert.ok(weaponProfile(M).range < weaponProfile(WEAPONS.plancha!).range * 1.15);
  assert.ok(others.every((d) => M.damage < d.damage));
  assert.ok(others.every((d) => M.fireRate < d.fireRate));
  // Still an upgrade on the starting dryer, per second, and never over the cap of the balance test.
  assert.ok(weaponProfile(M).dps > weaponProfile(WEAPONS.secador!).dps && weaponProfile(M).dps < 7);
});

test('el arma lleva su atravesar aunque haya objetos, y suma con los suyos', () => {
  assert.equal(moddedWeapon(M, []).bullets?.pierce, M.bullets!.pierce);
  const both = moddedWeapon(M, [{ id: 'prueba', bullets: { pierce: 2, bounce: 1 } }]).bullets!;
  assert.equal(both.pierce, M.bullets!.pierce! + 2);
  assert.equal(both.bounce, 1);
  // The weapons without one still have none.
  assert.equal(moddedWeapon(WEAPONS.secador!, []).bullets, undefined);
});

test('una onda atraviesa a tres enemigos en fila, los hiere a todos y los empuja hacia atrás', () => {
  const w = range('megafono-fila');
  const y = w.player.y - 6;
  const row = [still(w, w.player.x + 34, y), still(w, w.player.x + 52, y), still(w, w.player.x + 70, y)];
  const x0 = row.map((en) => en.x);
  step(w, { ...NO_INPUT, aimX: w.player.x + 200, aimY: y, fire: true });
  assert.equal(w.bullets.filter((b) => b.owner === 'player').length, M.pellets);
  for (let i = 0; i < Math.ceil(0.5 / DT); i++) step(w, { ...NO_INPUT, aimX: w.player.x + 200, aimY: y });
  row.forEach((en, i) => {
    assert.ok(en.damageTaken > 0, `el enemigo ${i + 1} no ha recibido`);
    assert.ok(en.x > x0[i]! + 2, `el enemigo ${i + 1} no se ha movido hacia atrás (${(en.x - x0[i]!).toFixed(1)} px)`);
  });
});

test('las ondas no llegan lejos', () => {
  const w = range('megafono-alcance');
  const x0 = w.player.x;
  step(w, { ...NO_INPUT, aimX: x0 + 300, aimY: w.player.y - 6, fire: true });
  let far = 0;
  for (let i = 0; i < Math.ceil(1 / DT); i++) {
    step(w, { ...NO_INPUT, aimX: x0 + 300, aimY: w.player.y - 6 });
    for (const b of w.bullets) far = Math.max(far, b.x - x0);
  }
  assert.ok(far < 135, `la onda llega a ${far.toFixed(0)} px`);
  assert.equal(w.bullets.length, 0);
});
