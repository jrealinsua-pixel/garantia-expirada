// M9b (7) and (15): the human found the weapons too strong and the items too generous
// (nota del 2026-10-30). These tests keep the numbers where the rebalance left them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIVE_ITEMS, ITEMS } from '../src/data/items.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { weaponProfile } from '../src/data/describe.ts';

const LESS_IS_BETTER = new Set(['reloadTime', 'spreadDeg', 'recoil', 'rollCooldown']);

test('las armas hacen un quinto menos de daño de base que antes de M9b (7)', () => {
  // Before: Secador 2, Grapadora 1, Plancha 2 per cloud.
  assert.equal(WEAPONS.secador!.damage, 1.6);
  assert.equal(WEAPONS.grapadora!.damage, 0.8);
  assert.equal(WEAPONS.plancha!.damage, 1.6);
  for (const id of ['secador', ...FINDABLE_WEAPONS]) assert.ok(weaponProfile(WEAPONS[id]!).dps < 7, `${id}: ${weaponProfile(WEAPONS[id]!).dps.toFixed(1)} de daño por segundo`);
});

test('ningún objeto ni sinergia sube una estadística más de un 30 % (ni recorta más de un 40 % las que mejor bajas), ni suma puntos de daño', () => {
  const mods = [...Object.values(ITEMS).map((i) => i.mod), ...Object.values(SYNERGIES).map((s) => s.mod)];
  for (const m of mods) {
    for (const c of m.stats ?? []) {
      if (c.mul !== undefined) {
        // Where less is better (reloads, spread…), it cuts at most 40 %; elsewhere it raises at
        // most 30 % (the magazine, a whole number of bullets, up to 50 %).
        if (LESS_IS_BETTER.has(c.stat)) assert.ok(c.mul >= 0.6 - 1e-9, `${m.id}: ${c.stat} ×${c.mul}`);
        else assert.ok(c.mul <= (c.stat === 'magazine' ? 1.5 : 1.3) + 1e-9, `${m.id}: ${c.stat} ×${c.mul}`);
      }
      if (c.stat === 'damage') assert.equal(c.add, undefined, `${m.id}: el daño cambia en porcentaje, no en puntos`);
    }
    if (m.bullets?.pierce) assert.ok(m.bullets.pierce <= 1, `${m.id}: atraviesa ${m.bullets.pierce}`);
    if (m.bullets?.crit) assert.ok(m.bullets.crit.chance <= 0.15, `${m.id}: ${m.bullets.crit.chance} de críticos`);
  }
});

test('el activo que cura es de un solo uso', () => {
  for (const a of Object.values(ACTIVE_ITEMS)) {
    if (a.effect.type === 'heal') assert.ok(a.singleUse, `${a.id} cura y se recarga`);
  }
});
