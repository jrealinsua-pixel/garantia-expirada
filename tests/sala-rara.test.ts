// M14 (r2): the rare room, the Oficina de Financiación. It comes up now and then on a spare dead
// end of a floor; on its shelves, a good weapon and a good passive item, paid with a heart
// container each instead of coupons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_CHARS, fontText } from '../src/art/font.ts';
import { ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { templatesOf } from '../src/data/rooms.ts';
import { FINANCE, FINANCE_PRICE, financeHearts } from '../src/data/shop.ts';
import { generateFloor, generateWorkshop, RARE_ROOM_CHANCE, validateFloor } from '../src/sim/floor.ts';
import { checkInvariants, createWorld, DT, enterRoom, NO_INPUT, step, worldHash, type Pickup, type SimEvent, type World } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const forSale = (w: World): Pickup[] => w.pickups.filter((k) => k.price !== undefined);

function office(seed = 'financiacion', level = 1): World {
  const w = createWorld({ seed, room: 'financiacion', level });
  w.noDamage = true;
  return w;
}

/** Walks the toaster up onto `k` and presses the interact button; the events on the way. */
function finance(w: World, k: { x: number; y: number }): SimEvent[] {
  w.player.x = k.x;
  w.player.y = k.y + 14;
  const ev: SimEvent[] = [];
  for (let i = 0; i < ticks(0.4); i++) {
    step(w, { ...NO_INPUT, moveY: i < 8 ? -1 : 0, interact: i === 12 });
    ev.push(...w.events);
  }
  w.player.x = 40;
  w.player.y = w.room.h - 40;
  for (let i = 0; i < 5; i++) step(w, NO_INPUT);
  return ev;
}

test('la sala rara sale en pocas plantas, como mucho una, siempre en un callejón sin salida', () => {
  let rare = 0;
  const N = 400;
  for (let i = 0; i < N; i++) {
    const f = generateFloor(`rara-${i}`);
    assert.deepEqual(validateFloor(f), [], `planta rara-${i}`);
    const r = f.rooms.filter((x) => x.kind === 'rare');
    assert.ok(r.length <= 1);
    if (r.length) {
      rare++;
      assert.equal(r[0]!.doors.filter((d) => !d.secret).length, 1, 'un callejón sin salida');
    }
    assert.deepEqual(generateFloor(`rara-${i}`), f, 'determinista');
  }
  // About one floor in five (RARE_ROOM_CHANCE on the floors with a spare dead end, nearly all).
  assert.ok(rare / N > 0.12 && rare / N <= RARE_ROOM_CHANCE + 0.03, `${rare} de ${N} plantas`);
  for (let i = 0; i < 40; i++) assert.ok(!generateWorkshop(`rara-${i}`).rooms.some((r) => r.kind === 'rare'), 'el taller no financia');
});

test('la Oficina de Financiación tiene la caja y vende un arma y un objeto buenos, por un corazón cada uno', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    assert.ok(templatesOf('rare', level).length > 0, `planta ${level} sin sala rara`);
    const w = office(`financiacion-${level}`, level);
    assert.ok(w.room.props.some((p) => p.def.id === 'autocobro'), 'la misma caja de la tienda');
    const goods = forSale(w).sort((a, b) => a.x - b.x);
    assert.deepEqual(goods.map((k) => k.kind), ['arma', 'objeto']);
    for (const k of goods) {
      assert.equal(k.pay, 'vida');
      assert.equal(k.price, FINANCE_PRICE);
    }
    assert.equal(WEAPONS[goods[0]!.weapon!]!.quality, 'buena');
    assert.equal(ITEMS[goods[1]!.item!]!.quality, 'buena');
  }
});

test('financiar quita un corazón para siempre y da lo comprado; cupones, ni uno', () => {
  const w = office();
  w.player.coupons = 99;
  const max = w.player.def.maxHp;
  const [weapon, item] = forSale(w).sort((a, b) => a.x - b.x);
  const ev = finance(w, weapon!);
  const deal = ev.find((e) => e.type === 'shop');
  assert.ok(deal && deal.type === 'shop' && deal.outcome === 'bought' && deal.pay === 'vida');
  assert.equal(w.player.def.maxHp, max - 2, 'un corazón menos de máximo');
  assert.equal(w.player.hp, w.player.def.maxHp, 'la vida que queda, entera');
  assert.equal(w.player.coupons, 99, 'los cupones no se tocan');
  assert.ok(w.player.arsenal.some((ws) => ws.base.id === weapon!.weapon), 'el arma es suya');
  finance(w, item!);
  assert.ok(w.player.items.includes(item!.item!), 'el objeto también');
  assert.equal(forSale(w).length, 0, 'baldas vacías');
  // Nothing in the item itself puts the heart back: the debt is a modifier of its own.
  assert.equal(w.player.mods.filter((m) => m.id === 'financiacion').length, 2);
});

test('con un solo corazón de máximo, la caja no financia', () => {
  // The Batidora de Vaso has two hearts: the first deal leaves her with one, and then no more credit.
  const w = createWorld({ seed: 'financiacion-sin-credito', room: 'financiacion', character: 'batidora-vaso' });
  w.noDamage = true;
  const [weapon, item] = forSale(w).sort((a, b) => a.x - b.x);
  finance(w, item!);
  assert.equal(w.player.def.maxHp, 2);
  const ev = finance(w, weapon!);
  const deal = ev.find((e) => e.type === 'shop');
  assert.ok(deal && deal.type === 'shop' && deal.outcome === 'insolvent');
  assert.equal(w.player.def.maxHp, 2);
  assert.ok(!w.player.arsenal.some((ws) => ws.base.id === weapon!.weapon), 'no se lleva el arma');
  assert.equal(forSale(w).length, 1, 'sigue en la balda');
});

test('en una planta la sala rara se llena al entrar la primera vez, con cosas de la baraja de la planta', () => {
  let seen = 0;
  for (let i = 0; seen < 4 && i < 200; i++) {
    const w = createWorld({ seed: `planta-rara-${i}`, floor: true });
    const f = w.floor!;
    const fr = f.layout.rooms.find((r) => r.kind === 'rare');
    if (!fr) continue;
    seen++;
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    const goods = forSale(w);
    assert.equal(goods.length, 2);
    for (const k of goods) {
      if (k.weapon) assert.ok(!f.weapons.includes(k.weapon), 'el arma sale de la baraja');
      if (k.item) assert.ok(!f.items.includes(k.item), 'el objeto sale de la baraja');
    }
    // Out and back in: the same goods, not a second lot.
    const back = fr.doors[0]!;
    enterRoom(w, back.to, back.dir === 'N' ? 'S' : back.dir === 'S' ? 'N' : back.dir === 'E' ? 'W' : 'E');
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    assert.equal(forSale(w).length, 2);
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.equal(seen, 4, 'hay plantas con sala rara');
});

test('el bot no se endeuda, recorre la sala rara y la planta sigue siendo determinista', () => {
  let i = 0;
  while (!generateFloor(`bot-rara-${i}`).rooms.some((r) => r.kind === 'rare')) i++;
  const run = (): string => {
    const w = createWorld({ seed: `bot-rara-${i}`, floor: true });
    w.noDamage = true;
    const bot = new Bot(`bot-rara-${i}`);
    const max = w.player.def.maxHp;
    const rare = w.floor!.layout.rooms.find((r) => r.kind === 'rare')!;
    // No damage: it lives to see the whole floor (it explores it all before taking the lift).
    for (let t = 0; t < ticks(400) && !w.over && !w.floor!.rooms[rare.id]!.visited; t++) {
      step(w, bot.think(w));
      assert.ok(!w.events.some((e) => e.type === 'shop' && e.pay === 'vida' && e.outcome === 'bought'), 'el bot no financia');
    }
    // A while in there: it walks past the shelves and never signs.
    for (let t = 0; t < ticks(8) && !w.over; t++) step(w, bot.think(w));
    assert.ok(w.player.mods.every((m) => m.id !== 'financiacion'));
    assert.ok(w.floor!.rooms[rare.id]!.visited, 'el bot entra en la sala rara');
    assert.ok(w.player.def.maxHp >= max - 4);
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('los textos de la financiación caben y se escriben con la fuente del juego', () => {
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const lines = [...FINANCE.greet, ...FINANCE.thanks, ...FINANCE.insolvent, FINANCE.soldOut, FINANCE.verb, financeHearts(2), financeHearts(4)];
  lines.push(templatesOf('rare', 1)[0]!.name);
  for (const t of lines) {
    assert.ok(t.length <= 60, `«${t}» no cabe en un bocadillo`);
    assert.ok(!t.includes('!'), `«${t}»: la caja no se emociona`);
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
  }
  assert.equal(financeHearts(2), '1 corazón');
  assert.equal(financeHearts(4), '2 corazones');
});
