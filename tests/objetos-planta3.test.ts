// Los cinco primeros objetos de la planta 3 (M10 6a): Pilas No Incluidas, Muelle de Juguete, Bote
// de Purpurina, Juguete del Menú Infantil y Caja de Cartón Vacía. Cada uno hace lo que dice su ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { modifierLines } from '../src/data/describe.ts';
import { createWorld, DT, giveItem, HAND_HEIGHT, hurtPlayer, NO_INPUT, spawnEnemy, step, worldHash, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const fireAt = (x: number, y: number): Input => ({ ...NO_INPUT, fire: true, aimX: x, aimY: y });
const OWN = ['pilas-no-incluidas', 'muelle', 'purpurina', 'menu-infantil', 'caja-vacia'];

/** The test room with nothing in the way (as in objetos.test.ts). */
function bare(seed: string, ...items: string[]): World {
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
  for (const id of items) giveItem(w, id);
  return w;
}

test('son de la planta 3: solo salen desde la planta 3, y su ficha dice lo que hacen', () => {
  for (const id of OWN) {
    assert.equal(ITEMS[id]?.level, 3, id);
    assert.ok(!itemsUpTo(2).includes(id) && itemsUpTo(3).includes(id), id);
    assert.ok(modifierLines(ITEMS[id]!.mod).length > 0, `${id}: su ventana dice algo`);
  }
  for (let i = 0; i < 10; i++) {
    const f2 = createWorld({ seed: `mazo3-${i}`, floor: true, level: 2 }).floor!;
    for (const id of OWN) assert.ok(!f2.items.includes(id), `${id} en la planta 2`);
    const f3 = createWorld({ seed: `mazo3-${i}`, floor: true, level: 3 }).floor!;
    for (const id of OWN) assert.ok(f3.items.includes(id), `${id} falta en la planta 3`);
  }
  // The box is only good, so only the premium chest has it.
  assert.equal(ITEMS['caja-vacia']!.quality, 'buena');
  const texts = modifierLines(ITEMS['pilas-no-incluidas']!.mod).map((l) => l.text);
  assert.ok(texts.includes('Tras recargar: cadencia +40 % durante 3 s') && texts.includes('Cadencia -10 %'), texts.join(' / '));
});

test('Pilas No Incluidas: tras cada recarga dispara mucho más deprisa 3 s, y al final del día hace más daño', () => {
  const w = bare('pilas', 'pilas-no-incluidas');
  const shotsIn = (secs: number): number => {
    let n = 0;
    for (let i = 0; i < ticks(secs); i++) {
      step(w, fireAt(w.player.x + 100, w.player.y - HAND_HEIGHT));
      n += w.events.filter((e) => e.type === 'shot').length;
    }
    return n;
  };
  // Before any reload: the slow pace (×0.9).
  const slow = shotsIn(2);
  w.player.weapon.ammo = 0;
  w.player.weapon.reload = 0.01;
  let rushed = false;
  for (let i = 0; i < 3; i++) {
    step(w, NO_INPUT);
    rushed ||= w.events.some((e) => e.type === 'rush');
  }
  assert.ok(rushed, 'avisa de la racha');
  assert.ok((w.player.rushT ?? 0) > 2.9);
  const fast = shotsIn(2);
  assert.ok(fast > slow, `${fast} disparos con racha frente a ${slow}`);
  // Measured on the dummy: over several magazines it beats having nothing.
  const dmg = (wd: World): number => {
    const d = wd.dummies[0]!;
    d.x = wd.player.x + 140;
    d.y = wd.player.y;
    wd.player.weapon.def = { ...wd.player.weapon.def, spreadDeg: 0 };
    for (let i = 0; i < ticks(10); i++) step(wd, fireAt(d.x, d.y - 20));
    return d.damageTaken;
  };
  assert.ok(dmg(bare('pilas-d', 'pilas-no-incluidas')) > dmg(bare('pilas-d')));
});

test('Muelle de Juguete: la voltereta llega un 30 % más lejos, las balas rebotan y se abren más', () => {
  const roll = (w: World): number => {
    const x0 = w.player.x;
    step(w, { ...NO_INPUT, moveX: 1, roll: true });
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return w.player.x - x0;
  };
  const base = roll(bare('muelle'));
  const far = roll(bare('muelle', 'muelle'));
  assert.ok(far > base * 1.2 && far < base * 1.4, `${far.toFixed(1)} px frente a ${base.toFixed(1)}`);
  const w = bare('muelle', 'muelle');
  assert.equal(w.player.weapon.def.bullets?.bounce, 1);
  assert.equal(w.player.weapon.def.spreadDeg, bare('muelle').player.weapon.def.spreadDeg + 4);
});

test('Bote de Purpurina: lo que toca va un 20 % más lento 2 s; las balas salen más pequeñas', () => {
  assert.ok(bare('p', 'purpurina').player.weapon.def.bulletRadius < bare('p').player.weapon.def.bulletRadius);
  // A chaser 200 px away, with and without glitter on it: how far it gets in a second.
  const chase = (glitter: boolean): number => {
    const w = bare('purpurina');
    const en = spawnEnemy(w.nextId++, ENEMIES.aspirador!, w.player.x + 260, w.player.y);
    w.enemies.push(en);
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    if (glitter) {
      en.slowT = 2;
      en.slowMul = 0.8;
    }
    const x0 = en.x;
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return Math.abs(en.x - x0);
  };
  const free = chase(false);
  const slowed = chase(true);
  assert.ok(slowed < free * 0.9 && slowed > free * 0.65, `${slowed.toFixed(1)} px frente a ${free.toFixed(1)}`);
  // A glitter bullet that hits leaves it on.
  const w = bare('purpurina-tiro', 'purpurina');
  const en = spawnEnemy(w.nextId++, ENEMIES.microondas!, w.player.x + 120, w.player.y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  for (let i = 0; i < ticks(1) && !(en.slowT ?? 0); i++) step(w, fireAt(en.x, en.y - 14));
  assert.ok((en.slowT ?? 0) > 1.5 && en.slowMul === 0.8, 'el enemigo tocado lleva purpurina');
  for (let i = 0; i < ticks(2.2); i++) step(w, NO_INPUT);
  assert.equal(en.slowT, 0, 'se le pasa a los 2 s');
});

test('Juguete del Menú Infantil: más rápido andando y disparando, un corazón menos', () => {
  const base = bare('menu');
  const w = bare('menu', 'menu-infantil');
  assert.ok(w.player.def.speed > base.player.def.speed * 1.1);
  assert.ok(w.player.weapon.def.fireRate > base.player.weapon.def.fireRate * 1.1);
  assert.equal(w.player.def.maxHp, base.player.def.maxHp - 2);
});

test('Caja de Cartón Vacía: uno de cada cinco golpes no hace nada («Era solo la caja»)', () => {
  const w = bare('caja', 'caja-vacia');
  w.noDamage = false;
  let shrugs = 0;
  const n = 400;
  for (let i = 0; i < n; i++) {
    w.player.hp = w.player.def.maxHp;
    w.player.invulnerable = 0;
    const before = w.player.hp;
    w.events = [];
    assert.ok(hurtPlayer(w, 1, -1, 1, 0));
    if (w.events.some((e) => e.type === 'shrug')) {
      shrugs++;
      assert.equal(w.player.hp, before, 'el golpe que es solo la caja no quita vida');
      assert.ok(w.player.invulnerable > 0, 'y da el respiro de siempre');
    }
  }
  assert.ok(shrugs > n * 0.14 && shrugs < n * 0.26, `${shrugs} de ${n}`);
  // Without the box, never.
  const b = bare('caja');
  b.noDamage = false;
  b.player.invulnerable = 0;
  hurtPlayer(b, 1, -1, 1, 0);
  assert.ok(!b.events.some((e) => e.type === 'shrug'));
});

test('con los cinco a la vez la partida sigue siendo determinista', () => {
  const run = (): string => {
    const w = bare('cinco', ...OWN);
    w.enemies.push(spawnEnemy(w.nextId++, ENEMIES.aspirador!, 400, 200));
    for (let i = 0; i < ticks(4); i++) step(w, { ...fireAt(400, 150), roll: i % 90 === 0, moveY: i % 120 < 60 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
