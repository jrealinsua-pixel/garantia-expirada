import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROPS } from '../src/data/props.ts';
import { ITEMS } from '../src/data/items.ts';
import { SHOP_PRICES, SHOPKEEPER } from '../src/data/shop.ts';
import { createWorld, DT, enterRoom, NO_INPUT, step, worldHash, type Pickup, type SimEvent, type World } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The shop on its own, no damage. */
function shop(seed = 'tienda'): World {
  const w = createWorld({ seed, room: 'tienda' });
  w.noDamage = true;
  return w;
}

const forSale = (w: World): Pickup[] => w.pickups.filter((k) => k.price !== undefined);

/** Puts the toaster just below good `k` and walks it up onto it; returns the events on the way. */
function walkOnto(w: World, k: { x: number; y: number }, seconds = 0.4): SimEvent[] {
  w.player.x = k.x;
  w.player.y = k.y + 14;
  const ev: SimEvent[] = [];
  for (let i = 0; i < ticks(seconds); i++) {
    step(w, { ...NO_INPUT, moveY: i < 8 ? -1 : 0 });
    ev.push(...w.events);
  }
  return ev;
}

/** Walks the toaster well away from everything for sale. */
function stepAway(w: World): void {
  w.player.x = 60;
  w.player.y = w.room.h - 60;
  for (let i = 0; i < 5; i++) step(w, NO_INPUT);
}

test('la tienda tiene la caja de autocobro con sprite, y sus textos siguen la guía', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  assert.ok(keys.has('autocobro'), 'falta el sprite de la caja de autocobro');
  const w = shop();
  const till = w.room.props.filter((p) => p.def === PROPS.autocobro);
  assert.equal(till.length, 1, 'una caja en el sitio del vendedor');
  const spot = w.room.slots.find((s) => s.kind === 'shopkeeper')!;
  assert.equal(till[0]!.x, spot.x);
  for (const line of [...SHOPKEEPER.greet, ...SHOPKEEPER.thanks, ...SHOPKEEPER.poor, SHOPKEEPER.full, SHOPKEEPER.soldOut]) {
    assert.ok(line.length <= 60, `«${line}» no cabe en un bocadillo`);
    assert.ok(!line.includes('!'), `«${line}»: la caja no se emociona`);
  }
});

test('las baldas venden, de izquierda a derecha, un objeto, un corazón y un ticket, con su precio', () => {
  const w = shop();
  const goods = forSale(w).sort((a, b) => a.x - b.x);
  assert.deepEqual(goods.map((k) => k.kind), ['objeto', 'corazon', 'ticket']);
  for (const k of goods) assert.equal(k.price, SHOP_PRICES[k.kind as keyof typeof SHOP_PRICES]);
  assert.ok(ITEMS[goods[0]!.item!], 'el objeto existe');
  assert.ok(SHOP_PRICES.objeto > SHOP_PRICES.ticket && SHOP_PRICES.ticket > SHOP_PRICES.corazon, 'el objeto es lo más caro y el corazón lo más barato');
});

test('lo que está a la venta no se lo traga el imán ni se coge sin pagar', () => {
  const w = shop();
  const heart = forSale(w).find((k) => k.kind === 'ticket')!;
  const at = { x: heart.x, y: heart.y };
  w.player.x = heart.x + 20;
  w.player.y = heart.y;
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.deepEqual({ x: heart.x, y: heart.y }, at, 'no se mueve hacia la tostadora');
  const ev = walkOnto(w, heart);
  assert.equal(w.player.tickets, 0);
  const refused = ev.filter((e) => e.type === 'shop');
  assert.equal(refused.length, 1, 'se queja una vez, no a cada paso');
  assert.equal(refused[0]!.type === 'shop' && refused[0]!.outcome, 'poor');
  assert.equal(forSale(w).length, 3, 'sigue en la balda');
});

test('con cupones de sobra, comprar cobra el precio y da lo comprado', () => {
  const w = shop();
  w.player.coupons = 50;
  const [item, heart, ticket] = forSale(w).sort((a, b) => a.x - b.x);
  let ev = walkOnto(w, item!);
  assert.deepEqual(w.player.items, [item!.item]);
  assert.equal(w.player.coupons, 50 - SHOP_PRICES.objeto);
  const buy = ev.find((e) => e.type === 'shop');
  assert.ok(buy && buy.type === 'shop' && buy.outcome === 'bought' && buy.item === item!.item && buy.left === w.player.coupons);
  assert.ok(ev.some((e) => e.type === 'pickup' && e.kind === 'objeto'), 'y se recoge como cualquier objeto');
  stepAway(w);
  ev = walkOnto(w, ticket!);
  assert.equal(w.player.tickets, 1);
  assert.equal(w.player.coupons, 50 - SHOP_PRICES.objeto - SHOP_PRICES.ticket);
  stepAway(w);
  // A heart with all its life: it is not sold.
  ev = walkOnto(w, heart!);
  const full = ev.find((e) => e.type === 'shop');
  assert.ok(full && full.type === 'shop' && full.outcome === 'full');
  assert.equal(w.player.coupons, 50 - SHOP_PRICES.objeto - SHOP_PRICES.ticket);
  stepAway(w);
  w.player.hp -= 2;
  walkOnto(w, heart!);
  assert.equal(w.player.hp, w.player.def.maxHp);
  assert.equal(w.player.coupons, 50 - SHOP_PRICES.objeto - SHOP_PRICES.ticket - SHOP_PRICES.corazon);
  assert.equal(forSale(w).length, 0, 'baldas vacías');
});

test('rodando por encima no se compra nada', () => {
  const w = shop();
  w.player.coupons = 50;
  const item = forSale(w).find((k) => k.kind === 'objeto')!;
  w.player.x = item.x;
  w.player.y = item.y + 30;
  for (let i = 0; i < ticks(0.25); i++) step(w, { ...NO_INPUT, moveY: -1, roll: i === 0 });
  assert.equal(w.player.coupons, 50);
  assert.equal(w.player.items.length, 0);
});

test('en una planta la tienda se llena al entrar la primera vez, con el objeto siguiente de la baraja', () => {
  for (let i = 0; i < 6; i++) {
    const w = createWorld({ seed: `planta-tienda-${i}`, floor: true });
    const f = w.floor!;
    const fr = f.layout.rooms.find((r) => r.kind === 'shop')!;
    const next = f.items[0];
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    const goods = forSale(w);
    assert.equal(goods.length, 3);
    assert.equal(goods.find((k) => k.kind === 'objeto')?.item, next);
    assert.ok(!f.items.includes(next!), 'sale de la baraja: no se repite en la planta');
    // Out and back in: the same goods, not a second lot.
    const back = fr.doors[0]!;
    enterRoom(w, back.to, back.dir === 'N' ? 'S' : back.dir === 'S' ? 'N' : back.dir === 'E' ? 'W' : 'E');
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    assert.equal(forSale(w).length, 3);
  }
});

test('el bot compra en la tienda cuando le llega, y la tienda es determinista', () => {
  const play = (): { hash: string; bought: number } => {
    const w = shop('tienda-bot');
    w.player.coupons = 30;
    w.player.hp -= 2;
    const bot = new Bot('tienda-bot');
    let bought = 0;
    for (let i = 0; i < ticks(20); i++) {
      step(w, bot.think(w));
      for (const e of w.events) if (e.type === 'shop' && e.outcome === 'bought') bought++;
    }
    return { hash: worldHash(w), bought };
  };
  const a = play();
  assert.ok(a.bought >= 2, `compra ${a.bought} cosas con 30 cupones`);
  assert.deepEqual(a, play());
});
