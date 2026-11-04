import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROPS } from '../src/data/props.ts';
import { TILE } from '../src/sim/room.ts';
import {
  CHEST_COUPONS,
  createWorld,
  DT,
  dropTicket,
  enterRoom,
  CLEAR_CHEST_CHANCE,
  CLEAR_HEART_CHANCE,
  FLOOR_TICKETS,
  START_TICKETS,
  TREASURE_CHESTS,
  interactable,
  isClear,
  NO_INPUT,
  placeChest,
  playerFeetBox,
  step,
  worldHash,
  type World,
} from '../src/sim/world.ts';
import { overlaps } from '../src/sim/vec.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The test room, nothing in the way, no enemies, the toaster at (120, 200). */
function bare(seed: string): World {
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
  return w;
}

/** Walks the toaster straight down into the front of chest `c` (it starts just below it). */
function walkInto(w: World, c: { x: number; y: number }, seconds = 0.5): void {
  w.player.x = c.x;
  w.player.y = c.y + 16;
  for (let i = 0; i < ticks(seconds); i++) step(w, { ...NO_INPUT, moveY: -1 });
}

test('el cofre es un objeto del decorado con sprite y caja de choque', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  assert.ok(PROPS.cofre);
  assert.ok(PROPS.cofre.blocksBullets);
  assert.ok(keys.has('cofre'), 'falta el sprite del cofre');
  assert.ok(keys.has('ticket'), 'falta el sprite del ticket');
});

test('cada planta reparte tickets y cofres entre sus salas de combate, siempre igual con la misma semilla', () => {
  let chests = 0;
  let others = 0;
  for (let i = 0; i < 40; i++) {
    const plan = (): string[] => {
      const f = createWorld({ seed: `premios${i}`, floor: true }).floor!;
      return f.rooms.map((r, id) => {
        if (r.reward) assert.equal(f.layout.rooms[id]!.kind, 'combat', 'solo las salas de combate dan premio');
        return r.reward ?? '';
      });
    };
    const a = plan();
    assert.deepEqual(a, plan());
    assert.equal(a.filter((r) => r === 'ticket').length, FLOOR_TICKETS);
    chests += a.filter((r) => r === 'chest').length;
    others += createWorld({ seed: `premios${i}`, floor: true }).floor!.layout.rooms.filter((fr) => fr.kind === 'combat').length - FLOOR_TICKETS;
  }
  // A cleared room leaves a chest now and then (nota del humano del 2026-10-30), not always.
  const rate = chests / others;
  assert.ok(rate > CLEAR_CHEST_CHANCE / 2 && rate < CLEAR_CHEST_CHANCE * 2, `cofres al limpiar: ${rate}`);
});

test('al limpiar una sala con premio sale su ticket, su cofre o su corazón', () => {
  const w = createWorld({ seed: 'premios-limpiar', floor: true });
  w.noDamage = true;
  const f = w.floor!;
  const got: string[] = [];
  for (const fr of f.layout.rooms) {
    const st = f.rooms[fr.id]!;
    if (!st.reward) continue;
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    assert.ok(w.doorsShut);
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    const seen: string[] = [];
    for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
      step(w, NO_INPUT);
      for (const e of w.events) if (e.type === 'reward') seen.push(e.reward);
    }
    assert.deepEqual(seen, [st.reward]);
    if (st.reward === 'ticket') assert.ok(w.pickups.some((k) => k.kind === 'ticket'));
    else if (st.reward === 'heart') assert.ok(w.pickups.some((k) => k.kind === 'corazon' && k.value === 2), 'no hay corazón');
    else {
      const c = w.room.props.find((pr) => pr.chest);
      assert.ok(c, 'no hay cofre');
      // On a tile like the template props, on clear floor and off the toaster.
      assert.equal((c.x - TILE / 2) % TILE, 0);
      assert.equal((c.y + 2) % TILE, 0);
      assert.ok(!overlaps(c.box, playerFeetBox(w.player, w.player.def.footRadius)));
      // It stays there when the toaster comes back.
      const back = w.room.doors[0]!;
      const other = f.layout.rooms[fr.id]!.doors.find((d) => d.dir === back.dir)!;
      enterRoom(w, other.to, other.dir);
      enterRoom(w, fr.id, back.dir);
      assert.ok(w.room.props.includes(c));
    }
    got.push(st.reward);
  }
  assert.equal(got.filter((r) => r === 'ticket').length, FLOOR_TICKETS);
});

test('M9b (15): de vez en cuando una sala limpia suelta un corazón, sin mover los tickets ni los cofres', () => {
  let hearts = 0;
  let free = 0;
  let premios = 0;
  for (let i = 0; i < 60; i++) {
    const f = createWorld({ seed: `corazones${i}`, floor: true }).floor!;
    for (const [id, r] of f.rooms.entries()) {
      if (f.layout.rooms[id]!.kind !== 'combat') continue;
      if (r.reward === 'heart') hearts++;
      if (r.reward === 'ticket' || r.reward === 'chest') premios++;
      else free++;
    }
  }
  const rate = hearts / free;
  assert.ok(rate > CLEAR_HEART_CHANCE * 0.6 && rate < CLEAR_HEART_CHANCE * 1.4, `corazones al limpiar: ${rate.toFixed(2)}`);
  assert.ok(premios > 0);
  // Never the default: hard means most rooms give nothing back.
  assert.ok(CLEAR_HEART_CHANCE < 0.5);
});

test('escasez (nota del humano del 2026-10-30): se empieza con un ticket, el tesoro guarda dos cofres y nada suelto, la secreta uno', () => {
  for (let i = 0; i < 6; i++) {
    const w = createWorld({ seed: `escasez${i}`, floor: true });
    assert.equal(w.player.tickets, START_TICKETS);
    assert.equal(START_TICKETS, 1);
    const f = w.floor!;
    for (const fr of f.layout.rooms) {
      if (fr.kind !== 'treasure' && fr.kind !== 'secret') continue;
      enterRoom(w, fr.id, fr.doors[0]?.dir ?? 'S');
      const chests = w.room.props.filter((pr) => pr.chest && !pr.chest.open);
      assert.equal(chests.length, fr.kind === 'treasure' ? TREASURE_CHESTS : 1, `${fr.kind}: cofres`);
      assert.ok(!w.pickups.some((k) => k.kind === 'objeto' || k.kind === 'activo' || k.kind === 'arma'), `${fr.kind}: hay objetos sueltos`);
      // Already there: no thud of a chest dropping in.
      assert.ok(!w.events.some((e) => e.type === 'reward'));
    }
  }
  // A single room (the test room) starts with none: the tests give them by hand.
  assert.equal(createWorld({ seed: 'x' }).player.tickets, 0);
});

test('un cofre suelta a veces un arma o un activo, no solo pasivos', () => {
  const kinds = new Set<string>();
  for (let i = 0; i < 30; i++) {
    const w = bare(`contenido${i}`);
    w.player.tickets = 1;
    const c = placeChest(w, 200, 150);
    walkInto(w, c, 0.3);
    step(w, { ...NO_INPUT, interact: true });
    assert.ok(c.chest!.open);
    for (const k of w.pickups) if (k.kind !== 'cupon') kinds.add(k.kind);
  }
  assert.deepEqual([...kinds].sort(), ['activo', 'arma', 'objeto']);
});

test('un ticket se recoge como un cupón y cuenta aparte', () => {
  const w = bare('ticket');
  dropTicket(w, 150, 200);
  const picked: number[] = [];
  for (let i = 0; i < ticks(2); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'pickup' && e.kind === 'ticket') picked.push(e.total);
  }
  assert.deepEqual(picked, [1]);
  assert.equal(w.player.tickets, 1);
  assert.equal(w.player.coupons, 0);
});

test('sin ticket el cofre no se abre y se queja cada vez que se pulsa interactuar', () => {
  const w = bare('cofre-cerrado');
  const c = placeChest(w, 200, 150);
  const nags: boolean[] = [];
  walkInto(w, c, 0.1);
  for (let i = 0; i < ticks(3); i++) {
    // Pushing against it says nothing; the interact button, twice, complains twice.
    step(w, { ...NO_INPUT, moveY: -1, interact: i === 10 || i === ticks(2) });
    for (const e of w.events) if (e.type === 'chest') nags.push(e.opened);
  }
  assert.ok(!c.chest!.open);
  assert.deepEqual(nags, [false, false]);
  assert.equal(w.pickups.length, 0);
});

test('con ticket el cofre se abre con el botón de interactuar (no andando contra él): gasta el ticket y suelta un objeto y cupones', () => {
  const w = bare('cofre-abierto');
  w.player.tickets = 2;
  const c = placeChest(w, 200, 150);
  const opened: Array<{ item?: string; tickets: number }> = [];
  w.player.x = c.x;
  w.player.y = c.y + 16;
  // Walking into it does not open it any more (nota del humano del 2026-10-30).
  for (let i = 0; i < ticks(0.5); i++) step(w, { ...NO_INPUT, moveY: -1 });
  assert.ok(!c.chest!.open);
  assert.equal(w.player.tickets, 2);
  step(w, { ...NO_INPUT, interact: true });
  for (const e of w.events) if (e.type === 'chest' && e.opened) opened.push({ item: e.item, tickets: e.tickets });
  assert.equal(opened.length, 1);
  assert.ok(c.chest!.open);
  assert.equal(w.player.tickets, 1);
  assert.equal(opened[0]!.tickets, 1);
  const item = w.pickups.find((k) => k.kind === 'objeto');
  assert.ok(item, 'no ha salido ningún objeto');
  assert.equal(item.item, opened[0]!.item);
  assert.equal(w.pickups.filter((k) => k.kind === 'cupon').length, CHEST_COUPONS);
  // The item lands on clear floor in front, out of reach of where the toaster stands.
  assert.ok(isClear(w, item.x, item.y, 2));
  assert.ok(item.y > c.y);
  // An open chest does not open again.
  for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, moveY: -1, interact: i % 10 === 0 });
  assert.equal(w.player.tickets, 1);
});

test('el botón de interactuar lejos del cofre no hace nada', () => {
  const w = bare('cofre-lejos');
  w.player.tickets = 1;
  const c = placeChest(w, 200, 150);
  w.player.x = c.x + 60;
  w.player.y = c.y + 40;
  assert.equal(interactable(w), null);
  step(w, { ...NO_INPUT, interact: true });
  assert.ok(!c.chest!.open);
  assert.equal(w.player.tickets, 1);
});

test('rodando contra el cofre no se abre', () => {
  const w = bare('cofre-rodando');
  w.player.tickets = 1;
  const c = placeChest(w, 200, 150);
  w.player.x = c.x;
  w.player.y = c.y + 16;
  step(w, { ...NO_INPUT, moveY: -1, roll: true });
  for (let i = 0; i < 12; i++) step(w, { ...NO_INPUT, interact: true });
  assert.ok(!c.chest!.open);
});

test('los cofres paran las balas y no se pueden atravesar', () => {
  const w = bare('cofre-solido');
  const c = placeChest(w, 200, 150);
  assert.ok(!isClear(w, c.x, c.y - 4, 4));
  walkInto(w, c, 1);
  assert.ok(w.player.y > c.box.y + c.box.h - 1, 'la tostadora ha atravesado el cofre');
});

test('con cofres y tickets la simulación sigue siendo determinista', () => {
  const run = (): string => {
    const w = bare('cofres-det');
    w.player.tickets = 1;
    const c = placeChest(w, 200, 150);
    walkInto(w, c, 2);
    return worldHash(w) + w.pickups.map((k) => `${k.kind}${k.x.toFixed(2)}`).join();
  };
  assert.equal(run(), run());
});

test('calidades de cofre (nota del humano del 2026-10-30): el de cartón da cosas normales, el premium solo buenas, y es raro', async () => {
  const { ITEMS, ACTIVE_ITEMS } = await import('../src/data/items.ts');
  const { WEAPONS, FINDABLE_WEAPONS } = await import('../src/data/weapons.ts');
  const { PREMIUM_CHANCE } = await import('../src/sim/world.ts');
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  assert.ok(keys.has('cofre-premium'), 'falta el sprite del cofre premium');
  // There are good and ordinary ones of each: weapons and passive items.
  assert.ok(FINDABLE_WEAPONS.some((id) => WEAPONS[id]!.quality === 'buena') && FINDABLE_WEAPONS.some((id) => !WEAPONS[id]!.quality));
  const good = Object.values(ITEMS).filter((d) => d.quality === 'buena').length;
  assert.ok(good >= 5 && good <= Object.keys(ITEMS).length / 2, `objetos buenos: ${good}`);
  const quality = (k: { kind: string; item?: string; weapon?: string }): string | undefined =>
    k.kind === 'arma' ? WEAPONS[k.weapon!]!.quality : k.kind === 'activo' ? ACTIVE_ITEMS[k.item!]!.quality : ITEMS[k.item!]!.quality;
  for (const tier of ['carton', 'premium'] as const) {
    for (let i = 0; i < 25; i++) {
      const w = bare(`calidad-${tier}-${i}`);
      w.player.tickets = 1;
      const c = placeChest(w, 200, 150, true, tier);
      walkInto(w, c, 0.3);
      step(w, { ...NO_INPUT, interact: true });
      const got = w.pickups.find((k) => k.kind !== 'cupon')!;
      assert.ok(got, 'el cofre no da nada');
      assert.equal(quality(got) === 'buena', tier === 'premium', `${tier} ${i}: ${got.item ?? got.weapon}`);
    }
  }
  let premium = 0;
  for (let i = 0; i < 400; i++) if (placeChest(bare(`raro-${i}`), 200, 150).chest!.tier === 'premium') premium++;
  assert.ok(premium / 400 > PREMIUM_CHANCE / 2 && premium / 400 < PREMIUM_CHANCE * 2, `premium: ${premium / 400}`);
});
