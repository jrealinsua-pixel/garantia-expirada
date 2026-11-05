// Los objetos de la planta 3 (M10 6a y 6b1): Pilas No Incluidas, Muelle de Juguete, Bote de
// Purpurina, Juguete del Menú Infantil, Caja de Cartón Vacía, Pegatina de Edición Limitada, Llave
// Allen Sobrante y Mando con Vibración; y la sinergia Unboxing. Cada uno hace lo que dice su ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { modifierLines } from '../src/data/describe.ts';
import { createWorld, DT, giveItem, HAND_HEIGHT, hurtPlayer, NO_INPUT, placeChest, spawnEnemy, step, worldHash, type Bullet, type Enemy, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const fireAt = (x: number, y: number): Input => ({ ...NO_INPUT, fire: true, aimX: x, aimY: y });
const OWN = ['pilas-no-incluidas', 'muelle', 'purpurina', 'menu-infantil', 'caja-vacia', 'pegatina', 'llave-allen', 'mando-vibracion', 'plastilina', 'mascota-virtual'];

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

test('con todos a la vez la partida sigue siendo determinista', () => {
  const run = (): string => {
    const w = bare('todos3', ...OWN);
    w.enemies.push(spawnEnemy(w.nextId++, ENEMIES.aspirador!, 400, 200));
    for (let i = 0; i < ticks(4); i++) step(w, { ...fireAt(400, 150), roll: i % 90 === 0, moveY: i % 120 < 60 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('Pegatina de Edición Limitada: la última bala del cargador hace el triple, y con la caja (Unboxing) atraviesa a todos', () => {
  const lastOf = (w: World): { damage: number; pierce: number; limited: boolean } => {
    w.player.weapon.ammo = 1;
    step(w, fireAt(w.player.x + 100, w.player.y - HAND_HEIGHT));
    const b = w.bullets.filter((x) => x.owner === 'player').at(-1)!;
    return { damage: b.damage, pierce: b.pierce ?? 0, limited: !!b.limited };
  };
  const plain = lastOf(bare('pegatina'));
  const limited = lastOf(bare('pegatina', 'pegatina'));
  assert.ok(Math.abs(limited.damage - plain.damage * 3) < 1e-9 && limited.limited && !plain.limited);
  // The others are ordinary.
  const w = bare('pegatina', 'pegatina');
  step(w, fireAt(w.player.x + 100, w.player.y - HAND_HEIGHT));
  const first = w.bullets.find((x) => x.owner === 'player')!;
  assert.ok(!first.limited && Math.abs(first.damage - plain.damage) < 1e-9);
  // Unboxing: the empty box and the sticker.
  const both = bare('unboxing', 'caja-vacia', 'pegatina');
  assert.ok(both.player.synergies.includes('unboxing'));
  const u = lastOf(both);
  assert.ok(u.pierce >= 10 && Math.abs(u.damage - plain.damage * 3) < 1e-9, JSON.stringify(u));
});

test('Llave Allen Sobrante: un cofre por planta se abre sin ticket (y antes que gastar uno)', () => {
  const w = bare('allen', 'llave-allen');
  w.player.tickets = 0;
  const chests = [placeChest(w, 200, 120, false, 'carton'), placeChest(w, 320, 120, false, 'carton')];
  const openAt = (c: (typeof chests)[number]): boolean => {
    w.player.x = c.x;
    w.player.y = c.y + 8;
    for (let i = 0; i < 3; i++) step(w, { ...NO_INPUT, interact: i === 1 });
    return !!c.chest!.open;
  };
  assert.ok(openAt(chests[0]!), 'el primero se abre sin ticket');
  assert.ok(!openAt(chests[1]!), 'el segundo ya no');
  w.player.tickets = 1;
  assert.ok(openAt(chests[1]!) && w.player.tickets === 0, 'con ticket, sí');
  // A new floor, a new spare key; and without the key a chest needs a ticket.
  const f = createWorld({ seed: 'allen-planta', floor: true, level: 3 });
  assert.equal(f.floor!.freeChests ?? 0, 0);
});

test('Mando con Vibración: cada golpe suelta un corro de diez balas propias', () => {
  const w = bare('mando', 'mando-vibracion');
  w.noDamage = false;
  w.player.invulnerable = 0;
  const before = w.bullets.filter((b) => b.owner === 'player').length;
  assert.ok(hurtPlayer(w, 1, -1, 1, 0));
  assert.ok(w.events.some((e) => e.type === 'hurtRing'));
  step(w, NO_INPUT);
  const ring = w.bullets.filter((b) => b.owner === 'player').length - before;
  assert.equal(ring, 10);
  // Hurt by a real bullet (in the middle of the bullet update), the ring still comes out.
  const v = bare('mando-bala', 'mando-vibracion');
  v.noDamage = false;
  v.player.invulnerable = 0;
  const p = v.player;
  v.bullets.push({
    id: v.nextId++, owner: 'enemy', x: p.x - 20, y: p.y - 9, vx: 140, vy: 0, r: 2.5, life: 3, damage: 1, knockback: 0,
    color: 'red', age: 0, dir: 0, speed: 140, h: 9, by: 'microondas',
  });
  for (let i = 0; i < ticks(0.4); i++) step(v, NO_INPUT);
  assert.ok(v.player.hp < v.player.def.maxHp, 'le da');
  assert.ok(v.bullets.filter((b) => b.owner === 'player').length >= 8, 'y sale el corro');
  // Without it, nothing.
  const b = bare('mando');
  b.noDamage = false;
  b.player.invulnerable = 0;
  hurtPlayer(b, 1, -1, 1, 0);
  assert.equal(b.bullets.filter((x) => x.owner === 'player').length, 0);
});

/** Keeps an enemy standing on a blob (the middle of its body box on it). */
function onBlob(en: Enemy, b: Bullet): void {
  en.x = b.x - (en.def.hurt.x + en.def.hurt.w / 2);
  en.y = b.y - (en.def.hurt.y + en.def.hurt.h / 2);
  en.vx = 0;
  en.vy = 0;
}

/** Fires one shot west, into the wall, and lets it fly until it sticks (or is gone). */
function shootWall(w: World): Bullet | undefined {
  step(w, fireAt(0, w.player.y - HAND_HEIGHT));
  for (let i = 0; i < ticks(1.2); i++) {
    step(w, NO_INPUT);
    const b = w.bullets.find((x) => x.owner === 'player' && x.stuck);
    if (b) return b;
  }
  return undefined;
}

test('Plastilina Mezclada: las balas que chocan se quedan pegadas 1,5 s y dañan una vez a cada enemigo que pasa', () => {
  const w = bare('plastilina', 'plastilina');
  const plain = bare('plastilina');
  assert.ok(Math.abs(w.player.weapon.def.bulletSpeed - plain.player.weapon.def.bulletSpeed * 0.85) < 1e-9, 'más lentas');
  const b = shootWall(w);
  assert.ok(b, 'se queda pegada');
  assert.ok(b.vx === 0 && b.vy === 0 && Math.abs(b.life - 1.5) < 0.05, JSON.stringify({ vx: b.vx, life: b.life }));
  // It stays put...
  const at = { x: b.x, y: b.y };
  step(w, NO_INPUT);
  assert.deepEqual({ x: b.x, y: b.y }, at);
  // ...and an enemy that walks into it gets hurt once (not every tick).
  const en = spawnEnemy(w.nextId++, ENEMIES.microondas!, b.x, b.y);
  w.enemies.push(en);
  for (let i = 0; i < 20 && w.bullets.includes(b); i++) {
    onBlob(en, b);
    step(w, NO_INPUT);
  }
  assert.ok(en.damageTaken > 0, 'le hace daño');
  assert.ok(Math.abs(en.damageTaken - b.damage) < 1e-9, `una sola vez (${en.damageTaken} frente a ${b.damage})`);
  // And after its time, the blob is gone.
  for (let i = 0; i < ticks(1.6); i++) step(w, NO_INPUT);
  assert.ok(!w.bullets.some((x) => x.stuck));
  // Without the plasticine, a bullet that hits the wall is just gone.
  assert.equal(shootWall(plain), undefined);
});

test('Manualidades (Plastilina + Purpurina): los pegotes duran más y frenan a la mitad', () => {
  const w = bare('manualidades', 'plastilina', 'purpurina');
  assert.ok(w.player.synergies.includes('manualidades'));
  const b = shootWall(w);
  assert.ok(b && Math.abs(b.life - 2.5) < 0.05 && b.slow?.mul === 0.5, JSON.stringify(b?.slow));
  const en = spawnEnemy(w.nextId++, ENEMIES.microondas!, b.x, b.y);
  w.enemies.push(en);
  for (let i = 0; i < 10; i++) {
    onBlob(en, b);
    step(w, NO_INPUT);
  }
  assert.equal(en.slowMul, 0.5);
  // Plasticine alone: they stick, but do not slow.
  const p = shootWall(bare('solo-plastilina', 'plastilina'));
  assert.ok(p && !p.slow);
});

test('Mascota Virtual: cada sala limpia sin golpes, +10 % de daño (hasta +30 %); un golpe la deja a cero', () => {
  const w = createWorld({ seed: 'mascota' });
  w.noDamage = true;
  giveItem(w, 'mascota-virtual');
  const base = w.player.weapon.def.damage;
  const shotDamage = (): number => {
    w.player.weapon.ammo = Math.max(2, w.player.weapon.ammo);
    w.player.weapon.cooldown = 0;
    w.player.weapon.reload = 0;
    step(w, fireAt(w.player.x + 100, w.player.y - HAND_HEIGHT));
    return w.bullets.filter((x) => x.owner === 'player').at(-1)!.damage;
  };
  assert.ok(Math.abs(shotDamage() - base) < 1e-9, 'con hambre, nada');
  // Emptying the test room counts as a room cleared (it restocks).
  const clear = (): void => {
    w.enemies = [];
    w.events = [];
    for (let i = 0; i < ticks(w.room.restock + 0.2) && !w.events.some((e) => e.type === 'restock'); i++) step(w, NO_INPUT);
  };
  for (let lvl = 1; lvl <= 4; lvl++) {
    clear();
    assert.equal(w.player.pet, Math.min(3, lvl), `nivel tras ${lvl} salas`);
  }
  assert.ok(Math.abs(shotDamage() - base * 1.3) < 1e-9, 'hasta +30 %');
  // A hit: back to zero, and the room it happened in does not feed it.
  w.noDamage = false;
  w.player.invulnerable = 0;
  hurtPlayer(w, 1, -1, 1, 0);
  assert.equal(w.player.pet, 0);
  assert.ok(w.events.some((e) => e.type === 'pet' && e.level === 0));
  w.noDamage = true;
  clear();
  assert.equal(w.player.pet ?? 0, 0, 'la sala del golpe no cuenta');
  clear();
  assert.equal(w.player.pet, 1, 'la siguiente sí');
});
