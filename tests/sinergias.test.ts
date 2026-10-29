import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../src/data/items.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { createWorld, giveItem, giveWeapon, removeModifier, selectWeapon, type World } from '../src/sim/world.ts';

function world(): World {
  const w = createWorld({ seed: 'sinergias', noEnemies: true });
  w.events = [];
  return w;
}
const on = (w: World, id: string): boolean => w.player.synergies.includes(id);
const synergyEvents = (w: World): { id: string; added: boolean }[] =>
  w.events.flatMap((e) => (e.type === 'synergy' ? [{ id: e.id, added: e.added }] : []));
const weaponDef = (w: World, id: string) => w.player.arsenal.find((ws) => ws.base.id === id)?.def ?? (w.player.weapon.base.id === id ? w.player.weapon.def : undefined);

test('there are at least 4 synergies, each made of real items and weapons, with a name and a line', () => {
  const all = Object.values(SYNERGIES);
  assert.ok(all.length >= 4);
  for (const s of all) {
    assert.equal(s.mod.id, s.id);
    assert.ok(s.name.split(' ').length <= 3, s.name);
    assert.ok(s.text.length > 10 && s.text.endsWith('.'), s.text);
    for (const i of s.items) assert.ok(ITEMS[i], `${s.id}: unknown item ${i}`);
    if (s.weapon) assert.ok(WEAPONS[s.weapon], `${s.id}: unknown weapon ${s.weapon}`);
    assert.ok(s.items.length + (s.weapon ? 1 : 0) >= 2, `${s.id} needs two pieces`);
  }
});

test('every synergy switches on only with all its pieces, once, and off when a piece is lost', () => {
  for (const s of Object.values(SYNERGIES)) {
    const w = world();
    if (s.weapon && w.player.weapon.base.id !== s.weapon) giveWeapon(w, s.weapon);
    const [first, ...rest] = s.items;
    if (rest.length || s.weapon !== 'secador') {
      // Not yet: one piece is missing.
      for (const i of rest) giveItem(w, i);
      assert.ok(!on(w, s.id), `${s.id} on too soon`);
    }
    w.events = [];
    giveItem(w, first!);
    assert.ok(on(w, s.id), `${s.id} off`);
    assert.deepEqual(synergyEvents(w), [{ id: s.id, added: true }]);
    w.events = [];
    removeModifier(w, first!);
    assert.ok(!on(w, s.id));
    assert.deepEqual(synergyEvents(w), [{ id: s.id, added: false }]);
  }
});

test('Sobrecarga: with the Pila, the Secador fires faster with bigger air and reloads slower; the other weapons do not', () => {
  const w = world();
  giveWeapon(w, 'grapadora');
  const sec0 = { ...weaponDef(w, 'secador')! };
  const gra0 = { ...weaponDef(w, 'grapadora')! };
  giveItem(w, 'pila');
  assert.ok(on(w, 'sobrecarga'));
  const sec = weaponDef(w, 'secador')!;
  const gra = weaponDef(w, 'grapadora')!;
  // The Pila alone multiplies the rate by 1.3; the synergy adds 1.25 on top.
  assert.ok(Math.abs(sec.fireRate - sec0.fireRate * 1.3 * 1.25) < 1e-9);
  assert.equal(sec.bulletRadius, sec0.bulletRadius + 1);
  assert.ok(sec.reloadTime > sec0.reloadTime * 1.39);
  assert.ok(Math.abs(gra.fireRate - gra0.fireRate * 1.3) < 1e-9);
  assert.equal(gra.bulletRadius, gra0.bulletRadius);
});

test('Papeleo Exprés: with the Cinta, the Grapadora gets a longer strip (loaded) and a quicker reload', () => {
  const w = world();
  giveItem(w, 'cinta');
  const sec0 = weaponDef(w, 'secador')!.magazine;
  assert.ok(!on(w, 'papeleo'));
  giveWeapon(w, 'grapadora');
  assert.ok(on(w, 'papeleo'));
  const g = w.player.weapon;
  assert.equal(g.base.id, 'grapadora');
  assert.equal(g.def.magazine, Math.round(g.base.magazine * 1.5));
  assert.equal(g.ammo, g.def.magazine);
  assert.ok(Math.abs(g.def.reloadTime - g.base.reloadTime * 0.6 * 0.8) < 1e-9);
  assert.equal(weaponDef(w, 'secador')!.magazine, sec0);
});

test('Bricolaje Avanzado: bullets bounce three times and go through three enemies', () => {
  const w = world();
  giveItem(w, 'manual');
  giveItem(w, 'broca');
  assert.deepEqual(w.player.weapon.def.bullets, { bounce: 3, pierce: 3 });
});

test('Instalación Casera: one more bullet per shot than the two items alone, in a tighter fan', () => {
  const w = world();
  const base = w.player.weapon.base;
  giveItem(w, 'regleta');
  giveItem(w, 'alargador');
  const d = w.player.weapon.def;
  assert.equal(d.pellets, base.pellets + 2);
  assert.equal(d.spreadDeg, base.spreadDeg + 6 - 3);
});

test('Cliente Preferente: the homing turns harder, longer and from further away', () => {
  const w = world();
  giveItem(w, 'tarjeta');
  const alone = w.player.weapon.def.bullets!.homing!;
  giveItem(w, 'etiqueta');
  const h = w.player.weapon.def.bullets!.homing!;
  assert.ok(h.turnDeg > alone.turnDeg && h.time > alone.time && h.range > alone.range);
});

test('a weapon synergy follows the weapon, not the hand: swapping keeps it on', () => {
  const w = world();
  giveItem(w, 'pila');
  giveWeapon(w, 'plancha');
  assert.ok(on(w, 'sobrecarga'));
  selectWeapon(w, 0);
  assert.equal(w.player.weapon.base.id, 'secador');
  assert.ok(on(w, 'sobrecarga'));
});
