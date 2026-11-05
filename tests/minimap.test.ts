import { test } from 'node:test';
import assert from 'node:assert/strict';
import { minimap, roomLoot } from '../src/sim/minimap.ts';
import { OPPOSITE } from '../src/sim/floor.ts';
import { createWorld, enterRoom, placeChest, type Pickup } from '../src/sim/world.ts';

test('minimapa: al empezar, la entrada y las salas que se ven por sus puertas', () => {
  const w = createWorld({ seed: 'minimapa', floor: true });
  const f = w.floor!;
  const cells = minimap(w);
  const start = f.layout.rooms[f.layout.start]!;
  const here = cells.filter((c) => c.state === 'here');
  assert.deepEqual(here.map((c) => c.id), [start.id]);
  const seen = cells.filter((c) => c.state === 'seen').map((c) => c.id).sort();
  assert.deepEqual(seen, start.doors.filter((d) => !d.secret).map((d) => d.to).sort());
  assert.equal(cells.length, 1 + seen.length);
  assert.ok(!cells.some((c) => c.kind === 'secret'), 'la secreta no sale');
  for (const c of cells) assert.equal(c.danger, false, 'de las vistas no se sabe nada');
});

test('minimapa: al cruzar, la sala anterior queda visitada y aparecen las nuevas vecinas', () => {
  const w = createWorld({ seed: 'minimapa', floor: true });
  const f = w.floor!;
  const door = f.layout.rooms[f.layout.start]!.doors.find((d) => !d.secret && f.layout.rooms[d.to]!.kind === 'combat')!;
  enterRoom(w, door.to, OPPOSITE[door.dir]);
  const cells = minimap(w);
  const byId = new Map(cells.map((c) => [c.id, c]));
  assert.equal(byId.get(door.to)!.state, 'here');
  assert.equal(byId.get(door.to)!.danger, w.enemies.length > 0);
  assert.equal(byId.get(f.layout.start)!.state, 'visited');
  for (const d of f.layout.rooms[door.to]!.doors) if (!d.secret) assert.ok(byId.has(d.to), `se ve la vecina ${d.to}`);
  // Each known pair of neighbours is linked from both sides.
  for (const c of cells) for (const dir of c.links) {
    const to = f.layout.rooms[c.id]!.doors.find((d) => d.dir === dir)!.to;
    assert.ok(byId.get(to)!.links.includes(OPPOSITE[dir]), `pasillo ${c.id}-${to} de ida y vuelta`);
  }
});

test('minimapa: con todo visitado salen todas las salas, la secreta también', () => {
  const w = createWorld({ seed: 'minimapa', floor: true });
  for (const r of w.floor!.rooms) r.visited = true;
  const cells = minimap(w);
  assert.equal(cells.length, w.floor!.layout.rooms.length);
  assert.ok(cells.some((c) => c.kind === 'secret'));
  assert.deepEqual(cells.filter((c) => c.kind === 'boss').length, 1);
});

test('minimapa: sin planta (una sala suelta) no hay mapa', () => {
  assert.deepEqual(minimap(createWorld({ seed: 'x' })), []);
});

test('minimapa: lo que queda por coger en una sala se marca una vez por tipo (nota del humano del 2026-11-05)', () => {
  const w = createWorld({ seed: 'minimapa-botin', floor: true });
  const f = w.floor!;
  const start = f.layout.start;
  // In the entrance: two coupons, a ticket, a heart, something for sale and a shut chest.
  const at = { x: w.player.x, y: w.player.y - 40, vx: 0, vy: 0, age: 0 };
  let id = 9000;
  const k = (kind: Pickup['kind'], extra: Partial<Pickup> = {}): Pickup => ({ id: id++, kind, value: 1, ...at, ...extra });
  w.pickups.push(k('cupon'), k('cupon'), k('ticket'), k('corazon'), k('objeto', { item: 'pila', price: 15 }));
  placeChest(w, w.player.x + 60, w.player.y - 60, false, 'carton');
  // While the toaster is in it, the mark is worked out too (the map draws it only for rooms left behind).
  assert.deepEqual(minimap(w).find((c) => c.id === start)!.loot, ['cofre', 'ticket', 'corazon', 'cupon']);
  const door = f.layout.rooms[start]!.doors.find((d) => !d.secret)!;
  enterRoom(w, door.to, OPPOSITE[door.dir]);
  const left = minimap(w).find((c) => c.id === start)!;
  assert.equal(left.state, 'visited');
  // One coupon mark for two coupons; the goods for sale are not loot.
  assert.deepEqual(left.loot, ['cofre', 'ticket', 'corazon', 'cupon']);
  // Rooms only seen through a door: nothing is known about them.
  for (const c of minimap(w).filter((x) => x.state === 'seen')) assert.deepEqual(c.loot, []);
  // An opened chest and an empty floor: nothing.
  assert.deepEqual(roomLoot([], [{ ...f.rooms[start]!.room!.props.find((p) => p.chest)!, chest: { ...f.rooms[start]!.room!.props.find((p) => p.chest)!.chest!, open: true } }]), []);
  assert.deepEqual(roomLoot([k('garantia'), k('documento'), k('arma', { weapon: 'secador' })], []), ['corazon', 'objeto']);
});
