// Los objetos de la planta 4 (M10 planta 4 6a): Taza de Mejor Empleado, Corbata de Lunes, Café de
// Máquina, Silla con Ruedas y Bola Antiestrés; y (6b1) Tarjeta de Fichar, Contrato en Prácticas y
// Acreditación de Visitante. Cada uno hace lo que dice su ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { modifierLines } from '../src/data/describe.ts';
import { SHOP_PRICES } from '../src/data/shop.ts';
import { createWorld, DT, enterRoom, giveItem, HAND_HEIGHT, HURT_IFRAMES, hurtPlayer, nextFloor, NO_INPUT, shopPrice, step, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const OWN = ['taza-empleado', 'corbata-lunes', 'cafe-maquina', 'silla-ruedas', 'bola-antiestres', 'tarjeta-fichar', 'contrato-practicas', 'acreditacion'];

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

/** The damage of the next bullet the toaster fires. */
function nextBulletDamage(w: World): number {
  const fire: Input = { ...NO_INPUT, fire: true, aimX: w.player.x + 100, aimY: w.player.y - HAND_HEIGHT };
  w.player.weapon.cooldown = 0;
  for (let i = 0; i < 30; i++) {
    const before = new Set(w.bullets.map((b) => b.id));
    step(w, fire);
    const shot = w.bullets.find((b) => b.owner === 'player' && !before.has(b.id));
    if (shot) return shot.damage;
  }
  throw new Error('no ha disparado');
}

test('son de la planta 4: solo salen desde la planta 4, y su ficha dice lo que hacen', () => {
  for (const id of OWN) {
    assert.equal(ITEMS[id]?.level, 4, id);
    assert.ok(!itemsUpTo(3).includes(id) && itemsUpTo(4).includes(id), id);
    assert.ok(modifierLines(ITEMS[id]!.mod).length > 0, `${id}: su ventana dice algo`);
  }
  for (let i = 0; i < 10; i++) {
    const f3 = createWorld({ seed: `mazo4-${i}`, floor: true, level: 3 }).floor!;
    for (const id of OWN) assert.ok(!f3.items.includes(id), `${id} en la planta 3`);
    const f4 = createWorld({ seed: `mazo4-${i}`, floor: true, level: 4 }).floor!;
    for (const id of OWN) assert.ok(f4.items.includes(id), `${id} falta en la planta 4`);
  }
  const line = (id: string): string[] => modifierLines(ITEMS[id]!.mod).map((l) => l.text);
  assert.ok(line('taza-empleado').includes('Con la vida llena: daño +20 %'), line('taza-empleado').join(' / '));
  assert.ok(line('silla-ruedas').includes('Resbala: tarda en frenar y en girar'), line('silla-ruedas').join(' / '));
  assert.ok(line('bola-antiestres').includes('Tras un golpe, invulnerable ×2 de tiempo'), line('bola-antiestres').join(' / '));
  // The pass is only good, so only the premium chest (and the shop) has it.
  assert.equal(ITEMS.acreditacion!.quality, 'buena');
  // Every one but the mug, the card and the pass has a bad side written on its card (the mug's is losing it at the first hit).
  for (const id of ['corbata-lunes', 'cafe-maquina', 'silla-ruedas', 'bola-antiestres', 'contrato-practicas']) {
    assert.ok(modifierLines(ITEMS[id]!.mod).some((l) => !l.good), `${id}: su pega está en la ficha`);
  }
});

test('Taza de Mejor Empleado: ×1,2 de daño con la vida llena, y nada en cuanto falta medio corazón', () => {
  const base = nextBulletDamage(bare('taza-base'));
  const w = bare('taza', 'taza-empleado');
  assert.equal(w.player.hp, w.player.def.maxHp);
  const full = nextBulletDamage(w);
  assert.ok(Math.abs(full - base * 1.2) < 1e-9, `${full} frente a ${base}`);
  w.noDamage = false;
  w.player.invulnerable = 0;
  w.events = [];
  assert.ok(hurtPlayer(w, 1, -1, 1, 0));
  assert.ok(w.events.some((e) => e.type === 'mugLost'), 'avisa de que ya no es el mejor empleado');
  const hurt = nextBulletDamage(w);
  assert.ok(Math.abs(hurt - base) < 1e-9, `herida: ${hurt} frente a ${base}`);
  // Healed back to full, the mug works again.
  w.player.hp = w.player.def.maxHp;
  assert.ok(Math.abs(nextBulletDamage(w) - base * 1.2) < 1e-9);
});

test('Corbata de Lunes y Café de Máquina: las cifras de su ficha', () => {
  const base = bare('cifras');
  const tie = bare('corbata', 'corbata-lunes');
  assert.ok(Math.abs(tie.player.weapon.def.damage - base.player.weapon.def.damage * 1.2) < 1e-9);
  assert.ok(Math.abs(tie.player.def.speed - base.player.def.speed * 0.92) < 1e-9);
  const coffee = bare('cafe', 'cafe-maquina');
  const b = base.player.weapon.def;
  const c = coffee.player.weapon.def;
  assert.ok(Math.abs(c.fireRate - b.fireRate * 1.15) < 1e-9);
  assert.ok(Math.abs(c.reloadTime - b.reloadTime * 0.85) < 1e-9);
  assert.equal(c.spreadDeg, b.spreadDeg + 5);
});

/** Walks right `secs` s, lets go and measures how far it slides until it stops (and its top speed). */
function slideAfterWalking(w: World, secs: number): { top: number; slide: number; stopTime: number } {
  const right: Input = { ...NO_INPUT, moveX: 1, aimX: 600, aimY: 200 };
  let top = 0;
  for (let i = 0; i < ticks(secs); i++) {
    step(w, right);
    top = Math.max(top, Math.hypot(w.player.vx, w.player.vy));
  }
  const x0 = w.player.x;
  let n = 0;
  while (Math.hypot(w.player.vx, w.player.vy) > 0.01 && n < 600) {
    step(w, { ...NO_INPUT, aimX: 600, aimY: 200 });
    n++;
  }
  return { top, slide: w.player.x - x0, stopTime: n * DT };
}

test('Silla con Ruedas: más rápida, pero tarda mucho más en frenar; la voltereta recorre lo mismo', () => {
  const base = slideAfterWalking(bare('silla-base'), 0.6);
  const w = bare('silla', 'silla-ruedas');
  const chair = slideAfterWalking(w, 0.6);
  assert.ok(chair.top > base.top * 1.12, `velocidad ${chair.top} frente a ${base.top}`);
  assert.ok(chair.slide > base.slide * 3, `resbala ${chair.slide} px frente a ${base.slide}`);
  assert.ok(chair.stopTime > base.stopTime * 2.5, `${chair.stopTime} s frente a ${base.stopTime} s`);
  // A roll is a roll: same speed and length as without the chair.
  const roll = (x: World): void => {
    step(x, { ...NO_INPUT, moveY: 1, roll: true, aimX: 600, aimY: 200 });
    for (let i = 0; i < ticks(0.2); i++) step(x, { ...NO_INPUT, aimX: 600, aimY: 200 });
  };
  const a = bare('rueda-a');
  const b = bare('rueda-b', 'silla-ruedas');
  const ya = a.player.y;
  const yb = b.player.y;
  roll(a);
  roll(b);
  assert.ok(Math.abs(a.player.y - ya - (b.player.y - yb)) < 0.5, 'la voltereta recorre lo mismo');
});

test('Bola Antiestrés: tras un golpe el respiro dura el doble, y dispara un poco más despacio', () => {
  const base = bare('bola-base');
  const w = bare('bola', 'bola-antiestres');
  assert.ok(Math.abs(w.player.weapon.def.fireRate - base.player.weapon.def.fireRate * 0.9) < 1e-9);
  w.noDamage = false;
  w.player.invulnerable = 0;
  assert.ok(hurtPlayer(w, 1, -1, 1, 0));
  assert.ok(Math.abs(w.player.invulnerable - HURT_IFRAMES * 2) < 1e-9);
  // Still invulnerable after the normal blink would have ended.
  for (let i = 0; i < ticks(HURT_IFRAMES + 0.2); i++) step(w, NO_INPUT);
  assert.ok(!hurtPlayer(w, 1, -1, 1, 0), 'a los 1,3 s todavía no le pueden dar');
  for (let i = 0; i < ticks(HURT_IFRAMES); i++) step(w, NO_INPUT);
  assert.ok(hurtPlayer(w, 1, -1, 1, 0), 'pasado el doble, sí');
});

/**
 * Clears the first combat room of a floor 4 after `secs` s with the shutters down (its enemies
 * fall at once); returns the events of the clearing and the coupons lying in the room.
 */
function clearAfter(secs: number, ...items: string[]): { events: SimEvent[]; coupons: number } {
  const w = createWorld({ seed: 'fichar', floor: true, level: 4 });
  w.noDamage = true;
  for (const id of items) giveItem(w, id);
  const f = w.floor!;
  const fr = f.layout.rooms.find((r) => r.kind === 'combat')!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  assert.ok(w.doorsShut);
  for (let i = 0; i < ticks(secs); i++) step(w, NO_INPUT);
  const events: SimEvent[] = [];
  w.pickups = w.pickups.filter((k) => k.kind !== 'cupon');
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    // Whatever is left falls (also what pops out of a surprise envelope).
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
    events.push(...w.events);
  }
  assert.ok(!w.doorsShut, 'la sala se ha limpiado');
  return { events, coupons: w.pickups.filter((k) => k.kind === 'cupon').length };
}

test('Tarjeta de Fichar: una sala limpia en menos de 25 s suelta un cupón más; pasado el plazo, nada', () => {
  const none = clearAfter(5);
  const fast = clearAfter(5, 'tarjeta-fichar');
  const punch = fast.events.find((e) => e.type === 'punch');
  assert.ok(punch && punch.type === 'punch' && punch.secs < 25, 'ficha');
  assert.equal(fast.coupons, none.coupons + 1);
  const slow = clearAfter(26, 'tarjeta-fichar');
  assert.ok(!slow.events.some((e) => e.type === 'punch'), 'a los 26 s ya no ficha');
  assert.equal(slow.coupons, clearAfter(26).coupons);
});

test('Contrato en Prácticas: ×1,1 a todo en su planta; al subir, se acaba y sale del inventario', () => {
  const w = createWorld({ seed: 'practicas', floor: true, level: 3 });
  const base = { damage: w.player.weapon.def.damage, fireRate: w.player.weapon.def.fireRate, speed: w.player.def.speed };
  giveItem(w, 'contrato-practicas');
  giveItem(w, 'corbata-lunes');
  assert.ok(Math.abs(w.player.weapon.def.fireRate - base.fireRate * 1.1) < 1e-9);
  assert.ok(Math.abs(w.player.def.speed - base.speed * 1.1 * 0.92) < 1e-9);
  w.won = true;
  const n = nextFloor(w)!;
  assert.deepEqual(n.player.items, ['corbata-lunes'], 'la corbata sigue; el contrato, no');
  assert.ok(!n.player.mods.some((m) => m.id === 'contrato-practicas'));
  assert.ok(Math.abs(n.player.def.speed - base.speed * 0.92) < 1e-9);
  assert.ok(Math.abs(n.player.weapon.def.fireRate - base.fireRate) < 1e-9);
  // The old floor is left as it was (the report still shows what it carried).
  assert.ok(w.player.items.includes('contrato-practicas'));
  // Said on the new floor's first tick.
  step(n, NO_INPUT);
  assert.ok(n.events.some((e) => e.type === 'trialEnd' && e.item === 'contrato-practicas'));
  step(n, NO_INPUT);
  assert.ok(!n.events.some((e) => e.type === 'trialEnd'), 'solo una vez');
});

test('Acreditación de Visitante: la tienda cobra un 25 % menos, redondeado y nunca gratis', () => {
  const w = createWorld({ seed: 'acreditacion', room: 'tienda' });
  w.noDamage = true;
  assert.equal(shopPrice(w.player, SHOP_PRICES.objeto), SHOP_PRICES.objeto);
  giveItem(w, 'acreditacion');
  assert.equal(shopPrice(w.player, 15), 11);
  assert.equal(shopPrice(w.player, 10), 8);
  assert.equal(shopPrice(w.player, 1), 1);
  const ticket = w.pickups.find((k) => k.kind === 'ticket' && k.price !== undefined)!;
  w.player.coupons = 20;
  const tickets = w.player.tickets;
  w.player.x = ticket.x;
  w.player.y = ticket.y + 14;
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks(0.4); i++) {
    step(w, { ...NO_INPUT, moveY: i < 8 ? -1 : 0, interact: i === 12 });
    events.push(...w.events);
  }
  const buy = events.find((e) => e.type === 'shop');
  assert.ok(buy && buy.type === 'shop' && buy.outcome === 'bought' && buy.price === 8, JSON.stringify(buy));
  assert.equal(w.player.coupons, 12);
  assert.equal(w.player.tickets, tickets + 1);
});
