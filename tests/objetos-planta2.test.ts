// The floor 2 items that do something new (M8): critical hits, extra batteries, extra coupons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modifierLines } from '../src/data/describe.ts';
import { ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { createWorld, DT, enterRoom, giveActive, giveItem, NO_INPUT, step, worldHash, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The test room with one dummy straight to the toaster's right and nothing else in the way. */
function range(seed: string, ...items: string[]): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  w.player.x = 120;
  w.player.y = 200;
  w.dummies.forEach((d, i) => {
    d.x = i === 0 ? 220 : 30;
    d.y = i === 0 ? 200 : 360;
  });
  for (const id of items) giveItem(w, id);
  return w;
}

/** Every hit on the dummy in `secs` of fire. */
function hits(w: World, secs: number): Extract<SimEvent, { type: 'hit' }>[] {
  const out: Extract<SimEvent, { type: 'hit' }>[] = [];
  const target = w.dummies[0]!;
  for (let i = 0; i < ticks(secs); i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: target.x, aimY: target.y - 14 });
    for (const e of w.events) if (e.type === 'hit') out.push(e);
  }
  return out;
}

test('Ratón Gaming RGB: una bala de cada cinco hace el doble, y se nota en el golpe', () => {
  const plain = hits(range('raton'), 8);
  assert.ok(plain.length > 10);
  assert.ok(plain.every((h) => !h.crit && h.damage === WEAPONS.secador!.damage), 'sin el ratón no hay críticos');
  const hs = hits(range('raton', 'raton'), 8);
  const crits = hs.filter((h) => h.crit);
  assert.ok(crits.length > 0);
  assert.ok(crits.every((h) => h.damage === WEAPONS.secador!.damage * 2));
  assert.ok(hs.filter((h) => !h.crit).every((h) => h.damage === WEAPONS.secador!.damage));
  const share = crits.length / hs.length;
  assert.ok(share > 0.08 && share < 0.35, `críticos: ${share.toFixed(2)}`);
  // Same seed, same shots: still deterministic.
  const run = (): string => {
    const w = range('raton-det', 'raton');
    hits(w, 2);
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('Batería Externa: cada sala limpia mete dos pilas en vez de una', () => {
  const w = createWorld({ seed: 'pilas', floor: true });
  w.noDamage = true;
  giveItem(w, 'bateria');
  giveActive(w, 'espera', 0);
  const charges: number[] = [];
  for (const r of w.floor!.layout.rooms.filter((r) => r.kind === 'combat').slice(0, 2)) {
    enterRoom(w, r.id, r.doors[0]!.dir);
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    for (let i = 0; i < ticks(4) && w.doorsShut; i++) step(w, NO_INPUT);
    charges.push(w.player.active!.charge);
  }
  assert.deepEqual(charges, [2, 3], 'dos por sala, sin pasar del máximo (3)');
});

test('Cookies de Terceros: la mitad de las bajas sueltan un cupón más', () => {
  const coupons = (cookies: boolean): number => {
    let total = 0;
    for (let i = 0; i < 60; i++) {
      const w = createWorld({ seed: `galleta-${i}` });
      w.noDamage = true;
      w.pickups = [];
      if (cookies) giveItem(w, 'cookies');
      w.enemies = w.enemies.slice(0, 1);
      w.enemies[0]!.damageTaken = w.enemies[0]!.def.hp;
      step(w, NO_INPUT);
      total += w.pickups.filter((k) => k.kind === 'cupon').length;
    }
    return total / 60;
  };
  const gain = coupons(true) - coupons(false);
  assert.ok(gain > 0.25 && gain < 0.75, `cupones de más por baja: ${gain.toFixed(2)}`);
});

test('la ficha de los objetos nuevos dice lo que hacen', () => {
  assert.deepEqual(modifierLines(ITEMS.raton!.mod), [{ text: '20 % de balas con daño ×2', good: true }]);
  assert.deepEqual(modifierLines(ITEMS.bateria!.mod), [
    { text: 'Velocidad -8 %', good: false },
    { text: '+1 pila por sala limpia', good: true },
  ]);
  assert.deepEqual(modifierLines(ITEMS.cookies!.mod), [{ text: '50 % de bajas con un cupón más', good: true }]);
});
