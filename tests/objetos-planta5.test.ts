// Los objetos de la planta 5 (M11 6a): Formulario en Línea, Tecla Almohadilla, Tiempo de Espera
// Estimado, Código Promocional Caducado y Cable de Teléfono Rizado. Cada uno hace lo que dice su ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { modifierLines } from '../src/data/describe.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { addModifier, createWorld, DT, enterRoom, giveActive, giveItem, HAND_HEIGHT } from '../src/sim/world.ts';
import { NO_INPUT, step, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const OWN = ['formulario-linea', 'tecla-almohadilla', 'tiempo-espera', 'codigo-caducado', 'cable-rizado'];

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

/** Clears the first combat room of a floor-4 run (every enemy down at once) and returns the world. */
function clearCombatRoom(w: World, pick = 0): World {
  const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[pick]!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
  }
  assert.ok(!w.doorsShut, 'la sala se ha limpiado');
  return w;
}

test('son de la planta 5: solo salen desde la planta 5, y su ficha dice lo que hacen', () => {
  for (const id of OWN) {
    assert.equal(ITEMS[id]?.level, 5, id);
    assert.ok(!itemsUpTo(4).includes(id) && itemsUpTo(5).includes(id), id);
    assert.ok(modifierLines(ITEMS[id]!.mod).length > 0, `${id}: su ventana dice algo`);
    assert.ok(ITEMS[id]!.name.split(' ').length <= 4, `${id}: nombre de 2 a 4 palabras`);
  }
  const line = (id: string): string[] => modifierLines(ITEMS[id]!.mod).map((l) => l.text);
  assert.deepEqual(line('formulario-linea'), ['Cargador +40 %', 'Tiempo de recarga +25 %']);
  assert.deepEqual(line('tecla-almohadilla'), ['El objeto activo se carga un 50 % más deprisa']);
  assert.deepEqual(line('tiempo-espera'), ['Espera entre volteretas -25 %', 'Velocidad -5 %']);
  assert.deepEqual(line('codigo-caducado'), ['25 % de bajas con un cupón más', '3 de cada 10 cofres de premio han caducado']);
  assert.deepEqual(line('cable-rizado'), ['Daño +15 %', 'Alcance -10 %', 'Las balas van en tirabuzón']);
  // All but the hash key give something and take something (as the design asks of half of them at least).
  for (const id of ['formulario-linea', 'tiempo-espera', 'codigo-caducado', 'cable-rizado']) {
    assert.ok(modifierLines(ITEMS[id]!.mod).some((l) => !l.good), `${id}: su pega está en la ficha`);
    assert.ok(modifierLines(ITEMS[id]!.mod).some((l) => l.good), `${id}: también da algo`);
  }
});

test('Formulario en Línea y Tiempo de Espera Estimado: las cifras de su ficha', () => {
  const w = bare('formulario', 'formulario-linea', 'tiempo-espera');
  const base = WEAPONS[w.player.weapon.base.id]!;
  const ch = CHARACTERS.tostadora!;
  assert.equal(w.player.weapon.def.magazine, Math.round(base.magazine * 1.4));
  assert.ok(Math.abs(w.player.weapon.def.reloadTime - base.reloadTime * 1.25) < 1e-9);
  assert.ok(Math.abs(w.player.def.rollCooldown - ch.rollCooldown * 0.75) < 1e-9);
  assert.ok(Math.abs(w.player.def.speed - ch.speed * 0.95) < 1e-9);
  // A bigger magazine comes full.
  assert.equal(w.player.weapon.ammo, w.player.weapon.def.magazine);
});

test('Tecla Almohadilla: pila y media por sala; la media pila espera a la siguiente', () => {
  const run = (...items: string[]): number[] => {
    const w = createWorld({ seed: 'almohadilla', floor: true, level: 4 });
    w.noDamage = true;
    for (const id of items) giveItem(w, id);
    giveActive(w, 'espera', 0);
    const out: number[] = [];
    for (let i = 0; i < 3; i++) {
      clearCombatRoom(w, i);
      out.push(w.player.active!.charge);
    }
    return out;
  };
  assert.deepEqual(run(), [1, 2, 3]);
  // 1.5, then 3, then 4.5 batteries: 1 (and a half waiting), 3, 4 (and a half). The waiting room item needs 3.
  const hash = run('tecla-almohadilla');
  assert.equal(hash[0], 1);
  assert.equal(hash[1], 3);
  assert.equal(hash[2], 3, 'nunca pasa de las pilas que pide');
  // With the spare battery (+1 a room) it is 3 a room.
  assert.equal(run('tecla-almohadilla', 'bateria')[0], 3);
});

test('Código Promocional Caducado: una baja de cada cuatro suelta un cupón más', () => {
  const coupons = (item: boolean): number => {
    let total = 0;
    for (let i = 0; i < 80; i++) {
      const w = createWorld({ seed: `codigo-${i}` });
      w.noDamage = true;
      w.pickups = [];
      if (item) giveItem(w, 'codigo-caducado');
      w.enemies = w.enemies.slice(0, 1);
      w.enemies[0]!.damageTaken = w.enemies[0]!.def.hp;
      step(w, NO_INPUT);
      total += w.pickups.filter((k) => k.kind === 'cupon').length;
    }
    return total / 80;
  };
  const gain = coupons(true) - coupons(false);
  assert.ok(gain > 0.1 && gain < 0.45, `cupones de más por baja: ${gain.toFixed(2)}`);
});

test('Código Promocional Caducado: unos tres de cada diez cofres de premio han caducado (y lo dice)', () => {
  const chestOf = (seed: string, mod: 'item' | 'always' | null): { chest: boolean; expired: boolean } => {
    const w = createWorld({ seed, floor: true, level: 4 });
    w.noDamage = true;
    if (mod === 'item') giveItem(w, 'codigo-caducado');
    if (mod === 'always') addModifier(w, { id: 'caducado-siempre', perks: { expiredChests: 1 } });
    const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[0]!;
    w.floor!.rooms[fr.id]!.reward = 'chest';
    const events: SimEvent[] = [];
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
      for (const en of w.enemies) en.damageTaken = en.def.hp;
      step(w, NO_INPUT);
      events.push(...w.events);
    }
    return { chest: w.room.props.some((pr) => pr.chest), expired: events.some((e) => e.type === 'expired') };
  };
  // Without the item, the chest is always there.
  for (let i = 0; i < 10; i++) assert.deepEqual(chestOf(`premio-${i}`, null), { chest: true, expired: false });
  assert.deepEqual(chestOf('premio-x', 'always'), { chest: false, expired: true });
  let gone = 0;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const r = chestOf(`premio-${i}`, 'item');
    assert.equal(r.chest, !r.expired);
    if (r.expired) gone++;
  }
  assert.ok(gone / n > 0.12 && gone / n < 0.5, `caducados: ${gone} de ${n}`);
});

test('Cable de Teléfono Rizado: las balas ondulan a los lados de su línea, hacen ×1,15 y llegan un 10 % menos', () => {
  const fire: Input = { ...NO_INPUT, fire: true, aimX: 400, aimY: 200 - HAND_HEIGHT };
  const shoot = (...items: string[]): { w: World; id: number } => {
    const w = bare('cable', ...items);
    w.player.weapon.cooldown = 0;
    for (let i = 0; i < 30; i++) {
      step(w, fire);
      const b = w.bullets.find((o) => o.owner === 'player');
      if (b) return { w, id: b.id };
    }
    throw new Error('no ha disparado');
  };
  const plain = shoot();
  const curly = shoot('cable-rizado');
  const bp = plain.w.bullets.find((b) => b.id === plain.id)!;
  const bc = curly.w.bullets.find((b) => b.id === curly.id)!;
  assert.ok(Math.abs(bc.damage - bp.damage * 1.15) < 1e-9, `${bc.damage} frente a ${bp.damage}`);
  assert.ok(Math.abs(bc.life - bp.life * 0.9) < 0.05, `${bc.life} frente a ${bp.life}`);
  assert.deepEqual(bc.wave, { amp: 5, freq: 3 });
  // Flying on: the line it weaves along (its direction) stays put, and it sways 5 px either way of it
  // (10 from one side to the other; measured from where it was one tick in, already on its way out).
  const x0 = bc.x;
  const y0 = bc.y;
  const dir = bc.dir;
  let most = 0;
  let least = 0;
  for (let i = 0; i < ticks(0.3); i++) {
    step(curly.w, NO_INPUT);
    const b = curly.w.bullets.find((o) => o.id === curly.id);
    if (!b) break;
    assert.ok(Math.abs(b.dir - dir) < 1e-9, 'su línea no se tuerce');
    const side = -(b.x - x0) * Math.sin(dir) + (b.y - y0) * Math.cos(dir);
    most = Math.max(most, side);
    least = Math.min(least, side);
  }
  assert.ok(most - least > 8.5 && most - least < 11, `va de ${least.toFixed(2)} a ${most.toFixed(2)} px de su línea`);
});

test('Cable de Teléfono Rizado: al rebotar, refleja su línea, no su vaivén', () => {
  const w = bare('cable-rebote', 'cable-rizado');
  addModifier(w, { id: 'rebote', bullets: { bounce: 2 } });
  w.player.x = 140;
  w.player.weapon.cooldown = 0;
  // Straight at the left wall.
  const fire: Input = { ...NO_INPUT, fire: true, aimX: 0, aimY: 200 - HAND_HEIGHT };
  let id = -1;
  for (let i = 0; i < 30 && id < 0; i++) {
    step(w, fire);
    id = w.bullets.find((o) => o.owner === 'player')?.id ?? -1;
  }
  const b0 = w.bullets.find((o) => o.id === id)!;
  const before = b0.dir;
  for (let i = 0; i < ticks(2); i++) {
    step(w, NO_INPUT);
    const b = w.bullets.find((o) => o.id === id);
    if (!b) break;
    if ((b.bounce ?? 0) < 2) {
      // Mirrored across the vertical: cos flips, sin stays.
      assert.ok(Math.abs(Math.cos(b.dir) + Math.cos(before)) < 1e-6, `${b.dir} frente a ${before}`);
      assert.ok(Math.abs(Math.sin(b.dir) - Math.sin(before)) < 1e-6);
      return;
    }
  }
  assert.fail('no ha rebotado');
});
