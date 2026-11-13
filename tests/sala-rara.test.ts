// M14 (r2): the rare room, the Oficina de Financiación. It comes up now and then on a spare dead
// end of a floor; on its shelves, a good weapon and a good passive item, paid with a heart
// container each instead of coupons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_CHARS, fontText } from '../src/art/font.ts';
import { ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { templatesOf } from '../src/data/rooms.ts';
import { FINANCE, FINANCE_PRICE, financeHearts, GOOD_NAMES, RAFFLE, RAFFLE_COUPONS, RAFFLE_PRICE, RAFFLE_PRIZES, SHOP_PRICES } from '../src/data/shop.ts';
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
  // Nothing on the shelf that gives a heart back (Garantía Extendida, Póliza…): the deal has to cost one.
  const hearts = Object.values(ITEMS).filter((d) => d.mod.stats?.some((c) => c.stat === 'maxHp' && (c.add ?? 0) > 0)).map((d) => d.id);
  const w = createWorld({ seed: 'financiacion-sin-credito', room: 'financiacion', character: 'batidora-vaso', locked: hearts });
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
  for (let i = 0; seen < 8 && i < 400; i++) {
    const w = createWorld({ seed: `planta-rara-${i}`, floor: true });
    const f = w.floor!;
    const fr = f.layout.rooms.find((r) => r.kind === 'rare');
    if (!fr) continue;
    seen++;
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    const goods = forSale(w);
    const n = w.room.id === 'sorteo' ? 3 : 2;
    assert.equal(goods.length, n);
    for (const k of goods) {
      if (k.weapon) assert.ok(!f.weapons.includes(k.weapon), 'el arma sale de la baraja');
      if (k.item) assert.ok(!f.items.includes(k.item), 'el objeto sale de la baraja');
    }
    // Out and back in: the same goods, not a second lot.
    const back = fr.doors[0]!;
    enterRoom(w, back.to, back.dir === 'N' ? 'S' : back.dir === 'S' ? 'N' : back.dir === 'E' ? 'W' : 'E');
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    assert.equal(forSale(w).length, n);
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.equal(seen, 8, 'hay plantas con sala rara');
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

// ---------- M14 (r2b): el Sorteo de Fidelización ----------

function raffle(seed = 'sorteo'): World {
  const w = createWorld({ seed, room: 'sorteo' });
  w.noDamage = true;
  return w;
}

test('las salas raras se reparten al azar entre las de su tipo: la Financiación y el Sorteo', () => {
  assert.deepEqual(templatesOf('rare').map((t) => t.id).sort(), ['financiacion', 'sorteo']);
  const seen = new Set<string>();
  for (let i = 0; i < 300 && seen.size < 2; i++) {
    const w = createWorld({ seed: `reparto-${i}`, floor: true });
    const fr = w.floor!.layout.rooms.find((r) => r.kind === 'rare');
    if (fr) seen.add(w.floor!.rooms[fr.id]!.template.id);
  }
  assert.equal(seen.size, 2, 'salen las dos');
});

test('el Sorteo tiene la caja y tres rascas de cinco cupones; rascar cobra, da su premio y la caja lo dice', () => {
  const w = raffle();
  assert.ok(w.room.props.some((p) => p.def.id === 'autocobro'));
  const cards = forSale(w).sort((a, b) => a.x - b.x);
  assert.equal(cards.length, 3);
  for (const k of cards) {
    assert.equal(k.kind, 'rasca');
    assert.equal(k.price, RAFFLE_PRICE);
    assert.equal(k.pay, undefined);
  }
  w.player.coupons = 20;
  const ev = finance(w, cards[0]!);
  assert.equal(w.player.coupons, 20 - RAFFLE_PRICE);
  const said = ev.find((e) => e.type === 'raffle');
  assert.ok(said && said.type === 'raffle' && RAFFLE_PRIZES.some((r) => r.prize === said.prize));
  assert.equal(forSale(w).length, 2);
  // Too poor: the card stays.
  w.player.coupons = RAFFLE_PRICE - 1;
  const no = finance(w, cards[1]!).find((e) => e.type === 'shop');
  assert.ok(no && no.type === 'shop' && no.outcome === 'poor');
  assert.equal(forSale(w).length, 2);
  assert.deepEqual(checkInvariants(w), []);
});

test('cada premio sale delante de la balda, con su frecuencia, y la casa gana un poco', () => {
  const counts: Record<string, number> = {};
  let coupons = 0;
  let tickets = 0;
  let hearts = 0;
  let shields = 0;
  let chests = 0;
  const N = 600;
  for (let i = 0; i < N; i++) {
    const w = raffle(`sorteo-${i}`);
    w.player.coupons = RAFFLE_PRICE;
    const t0 = w.player.tickets;
    const [card] = forSale(w);
    const ev = finance(w, card!);
    const said = ev.find((e) => e.type === 'raffle');
    assert.ok(said && said.type === 'raffle');
    counts[said.prize] = (counts[said.prize] ?? 0) + 1;
    const loose = w.pickups.filter((k) => k.price === undefined);
    // finance() walks the toaster away at once: what dropped is still there (or picked up on the way).
    coupons += loose.filter((k) => k.kind === 'cupon').length + w.player.coupons;
    tickets += loose.filter((k) => k.kind === 'ticket').length + w.player.tickets - t0;
    hearts += loose.filter((k) => k.kind === 'corazon').length;
    shields += loose.filter((k) => k.kind === 'garantia').length + w.player.shield;
    chests += w.room.props.filter((p) => p.chest?.tier === 'premium').length;
    if (said.prize === 'cupones') assert.ok(coupons >= RAFFLE_COUPONS, 'diez cupones');
    if (said.prize === 'cofre') assert.ok(w.room.props.some((p) => p.chest && !p.chest.open && p.chest.tier === 'premium'), 'un cofre premium');
  }
  const total = RAFFLE_PRIZES.reduce((a, r) => a + r.weight, 0);
  for (const r of RAFFLE_PRIZES) {
    const share = (counts[r.prize] ?? 0) / N;
    assert.ok(Math.abs(share - r.weight / total) < 0.06, `${r.prize}: ${share}`);
  }
  assert.ok(tickets > 0 && hearts > 0 && shields > 0 && chests > 0, `salen todos los premios: ${JSON.stringify({ tickets, hearts, shields, chests, counts })}`);
  // In coupons: tickets at the shop's price, a heart at its price, a warranty like a heart, a premium chest like three items.
  const back = (coupons + tickets * SHOP_PRICES.ticket + hearts * SHOP_PRICES.corazon + shields * SHOP_PRICES.corazon + chests * 3 * SHOP_PRICES.objeto) / N;
  assert.ok(back > RAFFLE_PRICE * 0.6 && back < RAFFLE_PRICE * 1.1, `devuelve ${back.toFixed(2)} cupones por rasca de ${RAFFLE_PRICE}`);
});

test('los textos del Sorteo caben y se escriben con la fuente del juego', () => {
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const lines = [...RAFFLE.greet, RAFFLE.soldOut, RAFFLE.verb, ...RAFFLE_PRIZES.map((r) => r.line), GOOD_NAMES.rasca, templatesOf('rare').find((t) => t.id === 'sorteo')!.name];
  for (const t of lines) {
    assert.ok(t.length <= 64, `«${t}» no cabe en un bocadillo`);
    assert.ok(!t.includes('!'), `«${t}»: la caja no se emociona`);
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
  }
});
