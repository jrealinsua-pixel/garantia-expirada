import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import type { Modifier } from '../src/data/types.ts';
import { bulletBehaviour, modStat, moddedWeapon } from '../src/sim/mods.ts';
import { addModifier, createWorld, DT, HAND_HEIGHT, NO_INPUT, removeModifier, spawnEnemy, step, worldHash, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const secador = WEAPONS['secador']!;
const tostadora = CHARACTERS['tostadora']!;

/** The test room with nothing in the way: no props, no enemies, the dummies put aside. */
function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  return w;
}

/** Fire towards (x, y) (a point in the air, at hand height). */
const fireAt = (_w: World, x: number, y: number): Input => ({ ...NO_INPUT, fire: true, aimX: x, aimY: y });

test('modificadores: primero se suman, luego se multiplican, y hay límites', () => {
  const mods: Modifier[] = [
    { id: 'a', stats: [{ stat: 'damage', add: 1 }, { stat: 'fireRate', mul: 1.5 }] },
    { id: 'b', stats: [{ stat: 'damage', mul: 2 }, { stat: 'fireRate', add: 1 }] },
  ];
  assert.equal(modStat('damage', 1, mods), 4);
  assert.equal(modStat('fireRate', 6.5, mods), (6.5 + 1) * 1.5);
  assert.equal(modStat('magazine', 14, [{ id: 'c', stats: [{ stat: 'magazine', mul: 0.37 }] }]), 5);
  assert.equal(modStat('magazine', 14, [{ id: 'c', stats: [{ stat: 'magazine', add: -50 }] }]), 1);
  assert.equal(modStat('fireRate', 6.5, [{ id: 'c', stats: [{ stat: 'fireRate', mul: 0 }] }]), 0.5);
  assert.equal(modStat('pellets', 1, [{ id: 'c', stats: [{ stat: 'pellets', add: 40 }] }]), 12);
  // The data is not touched.
  const before = secador.damage;
  const m = moddedWeapon(secador, mods);
  assert.equal(m.damage, (before + 1) * 2);
  assert.equal(secador.damage, before);
  assert.equal(moddedWeapon(secador, []).damage, secador.damage);
});

test('comportamientos de bala: se suman y gana la persecución más fuerte', () => {
  const b = bulletBehaviour([
    { id: 'a', bullets: { pierce: 1, homing: { turnDeg: 90, time: 1, range: 100 } } },
    { id: 'b', bullets: { pierce: 2, bounce: 1, homing: { turnDeg: 200, time: 0.5, range: 80 } } },
    { id: 'c', stats: [{ stat: 'damage', add: 1 }] },
  ]);
  assert.deepEqual(b, { pierce: 3, bounce: 1, homing: { turnDeg: 200, time: 0.5, range: 80 } });
  assert.equal(bulletBehaviour([{ id: 'c', stats: [] }]), null);
});

test('coger y soltar un modificador cambia al jugador y lo deja como estaba', () => {
  const w = bare('mods-ida-vuelta');
  const p = w.player;
  const before = JSON.stringify({ def: p.def, weapon: p.weapon.def });
  addModifier(w, { id: 'pila', stats: [{ stat: 'speed', mul: 1.2 }, { stat: 'maxHp', add: 2 }, { stat: 'magazine', add: -4 }] });
  assert.ok(w.events.some((e) => e.type === 'mods' && e.added));
  assert.equal(p.def.speed, tostadora.speed * 1.2);
  assert.equal(p.def.maxHp, tostadora.maxHp + 2);
  // More maximum life comes with that life; the magazine is smaller and the ammo follows.
  assert.equal(p.hp, tostadora.maxHp + 2);
  assert.equal(p.weapon.def.magazine, secador.magazine - 4);
  assert.equal(p.weapon.ammo, secador.magazine - 4);
  assert.equal(tostadora.speed, CHARACTERS['tostadora']!.speed);
  assert.ok(removeModifier(w, 'pila'));
  assert.equal(removeModifier(w, 'pila'), false);
  assert.equal(JSON.stringify({ def: p.def, weapon: p.weapon.def }), before);
  assert.equal(p.hp, tostadora.maxHp);
});

test('perder vida máxima nunca deja a la tostadora a cero', () => {
  const w = bare('mods-vida');
  w.player.hp = 1;
  addModifier(w, { id: 'maldicion', stats: [{ stat: 'maxHp', add: -100 }] });
  assert.equal(w.player.def.maxHp, 2);
  assert.equal(w.player.hp, 1);
});

test('más daño y más cadencia se notan en el maniquí', () => {
  const shoot = (mods: Modifier[]): { damage: number; shots: number } => {
    const w = bare('mods-dano');
    const d = w.dummies[0]!;
    d.x = 260;
    d.y = 200;
    for (const m of mods) addModifier(w, m);
    let shots = 0;
    for (let i = 0; i < ticks(1.5); i++) {
      step(w, fireAt(w, d.x, d.y - 20));
      shots += w.events.filter((e) => e.type === 'shot').length;
    }
    return { damage: d.damageTaken, shots };
  };
  const base = shoot([]);
  const strong = shoot([{ id: 'x', stats: [{ stat: 'damage', mul: 2 }] }]);
  const fast = shoot([{ id: 'y', stats: [{ stat: 'fireRate', mul: 2 }, { stat: 'magazine', add: 30 }] }]);
  assert.ok(base.damage > 0);
  assert.equal(strong.shots, base.shots);
  assert.equal(strong.damage, base.damage * 2);
  assert.ok(fast.shots >= base.shots * 1.8, `${fast.shots} disparos frente a ${base.shots}`);
});

test('las balas que atraviesan dan a varios maniquíes en fila, una vez a cada uno', () => {
  const run = (pierce: number): number[] => {
    const w = bare('mods-atraviesa');
    w.dummies.forEach((d, i) => {
      d.x = 220 + i * 40;
      d.y = 200;
    });
    if (pierce) addModifier(w, { id: 'aguja', bullets: { pierce } });
    // One shot, straight along the row.
    w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
    step(w, fireAt(w, 400, 200 - HAND_HEIGHT));
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return w.dummies.map((d) => d.damageTaken);
  };
  const d = WEAPONS.secador!.damage;
  assert.deepEqual(run(0), [d, 0]);
  assert.deepEqual(run(1), [d, d]);
  assert.deepEqual(run(3), [d, d]);
});

test('las balas que rebotan vuelven de la pared', () => {
  const w = bare('mods-rebota');
  addModifier(w, { id: 'muelle', bullets: { bounce: 1 } });
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  // Straight at the left wall.
  step(w, fireAt(w, 0, w.player.y - HAND_HEIGHT));
  const b = w.bullets[0]!;
  assert.ok(b.vx < 0);
  let bounced = false;
  for (let i = 0; i < ticks(1) && w.bullets.includes(b); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'bulletWall' && e.bounced)) bounced = true;
  }
  assert.ok(bounced, 'no ha rebotado');
  assert.ok(b.vx > 0, 'no vuelve');
  assert.equal(b.bounce, 0);
  // Without bounce it stops at the wall.
  const w2 = bare('mods-rebota');
  w2.player.weapon.def = { ...w2.player.weapon.def, spreadDeg: 0 };
  step(w2, fireAt(w2, 0, w2.player.y - HAND_HEIGHT));
  for (let i = 0; i < ticks(1); i++) step(w2, NO_INPUT);
  assert.equal(w2.bullets.length, 0);
});

test('las balas que persiguen tuercen hacia el enemigo más cercano', () => {
  const hits = (homing: boolean): number => {
    const w = bare('mods-persigue');
    const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, 300, 270);
    en.state = 'idle';
    en.until = 999;
    w.enemies.push(en);
    if (homing) addModifier(w, { id: 'iman', bullets: { homing: { turnDeg: 240, time: 1, range: 200 } } });
    w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
    // Aimed well to the side of it.
    let n = 0;
    for (let i = 0; i < 20; i++) {
      step(w, i < 2 ? fireAt(w, 400, w.player.y - HAND_HEIGHT - 40) : NO_INPUT);
      n += w.events.filter((e) => e.type === 'hit').length;
    }
    for (let i = 0; i < ticks(1); i++) {
      step(w, NO_INPUT);
      n += w.events.filter((e) => e.type === 'hit').length;
    }
    return n;
  };
  assert.equal(hits(false), 0);
  assert.ok(hits(true) >= 1);
});

test('con modificadores la simulación sigue siendo determinista', () => {
  const play = (): string => {
    const w = createWorld({ seed: 'mods-det' });
    w.noDamage = true;
    addModifier(w, { id: 'todo', stats: [{ stat: 'pellets', add: 2 }, { stat: 'spreadDeg', add: 10 }], bullets: { pierce: 1, bounce: 2, homing: { turnDeg: 120, time: 0.6, range: 140 } } });
    for (let i = 0; i < ticks(10); i++) step(w, { ...NO_INPUT, fire: i % 3 !== 0, moveX: Math.sin(i / 40), aimX: 300 + Math.sin(i / 30) * 200, aimY: 200 });
    return worldHash(w);
  };
  assert.equal(play(), play());
});
