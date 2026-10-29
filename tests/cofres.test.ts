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
  FLOOR_CHESTS,
  FLOOR_TICKETS,
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
  for (let i = 0; i < 10; i++) {
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
    assert.equal(a.filter((r) => r === 'chest').length, FLOOR_CHESTS);
  }
});

test('al limpiar una sala con premio sale su ticket o su cofre', () => {
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
  assert.equal(got.length, FLOOR_TICKETS + FLOOR_CHESTS);
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

test('sin ticket el cofre no se abre y se queja de vez en cuando', () => {
  const w = bare('cofre-cerrado');
  const c = placeChest(w, 200, 150);
  const nags: boolean[] = [];
  walkInto(w, c, 0.1);
  for (let i = 0; i < ticks(3); i++) {
    step(w, { ...NO_INPUT, moveY: -1 });
    for (const e of w.events) if (e.type === 'chest') nags.push(e.opened);
  }
  assert.ok(!c.chest!.open);
  // Pushing against it for 3 s: once at the start and again after 2 s.
  assert.deepEqual(nags, [false, false]);
  assert.equal(w.pickups.length, 0);
});

test('con ticket el cofre se abre: gasta el ticket y suelta un objeto y cupones', () => {
  const w = bare('cofre-abierto');
  w.player.tickets = 2;
  const c = placeChest(w, 200, 150);
  const opened: Array<{ item?: string; tickets: number }> = [];
  w.player.x = c.x;
  w.player.y = c.y + 16;
  for (let i = 0; i < ticks(0.5); i++) {
    step(w, { ...NO_INPUT, moveY: -1 });
    for (const e of w.events) if (e.type === 'chest' && e.opened) opened.push({ item: e.item, tickets: e.tickets });
  }
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
  for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, moveY: -1 });
  assert.equal(w.player.tickets, 1);
});

test('rodando contra el cofre no se abre', () => {
  const w = bare('cofre-rodando');
  w.player.tickets = 1;
  const c = placeChest(w, 200, 150);
  w.player.x = c.x;
  w.player.y = c.y + 16;
  step(w, { ...NO_INPUT, moveY: -1, roll: true });
  for (let i = 0; i < 12; i++) step(w, NO_INPUT);
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
