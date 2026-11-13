// M12 (3b3): the workshop's own conveyor belts, drawn in the room templates with `→` and `←`. They
// run from the start and for good, carry the toaster and the enemies on foot, and a belt that runs
// into a wall ends in intake rollers that bite.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, SLOT_ENEMIES_1, templatesOf } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { Rng } from '../src/sim/rng.ts';
import { buildRoom, fillTemplate, ROOM_BELT_BITE, ROOM_BELT_SPEED, TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, enterRoom, NO_INPUT, SERVICE_LEVEL, spawnEnemy, step, type World } from '../src/sim/world.ts';
import type { RoomTemplate } from '../src/data/types.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

function room(id: string): World {
  const w = createWorld({ seed: 'cintas', room: id, level: SERVICE_LEVEL, noEnemies: true });
  w.intro = null;
  return w;
}

test('las plantillas: cada tira de flechas es una cinta; con pared al final, rodillos', () => {
  const linea = buildRoom(ROOMS['linea-desmontaje']!);
  assert.equal(linea.conveyors.length, 2);
  // At the foot of the benches, both towards the gap in the middle, and they just end on the floor.
  assert.deepEqual(linea.conveyors.map((c) => c.dirX), [1, -1]);
  for (const c of linea.conveyors) assert.equal(c.bite, 0);
  assert.ok(linea.conveyors[0]!.x + linea.conveyors[0]!.w < linea.conveyors[1]!.x, 'un hueco entre las dos');
  const sort = buildRoom(ROOMS['cinta-clasificacion']!);
  assert.equal(sort.conveyors.length, 2);
  for (const c of sort.conveyors) {
    assert.equal(c.bite, ROOM_BELT_BITE, 'las dos acaban contra una jaula');
    const end = c.dirX > 0 ? c.x + c.w : c.x - 1;
    assert.equal(sort.tiles[Math.floor(c.y / TILE) * sort.cols + Math.floor(end / TILE)], 1);
  }
  assert.ok(templatesOf('combat', SERVICE_LEVEL).filter((t) => buildRoom(t).conveyors.length > 0).length >= 2);
  // No other floor has any.
  for (const t of Object.values(ROOMS)) if ((t.level ?? 1) < SERVICE_LEVEL) assert.equal(buildRoom(t).conveyors.length, 0, t.id);
  // A run that is not a rectangle is a mistake in the template.
  const bad: RoomTemplate = { id: 'mala', name: 'Mala', rows: ['######', '######', '#→→..#', '#.→..#', '#.P..#', '######'] };
  assert.throws(() => buildRoom(bad), /rectangle/);
});

test('una sala reflejada da la vuelta a sus cintas, y los rodillos siguen contra la pared', () => {
  const t = ROOMS['cinta-clasificacion']!;
  let mirrored = 0;
  for (let i = 0; i < 40; i++) {
    const f = fillTemplate(t, new Rng(`espejo${i}`), { depth: 3, pool: SLOT_ENEMIES_1, vary: true });
    const r = buildRoom(f);
    if (r.conveyors[0]!.dirX < 0) mirrored++;
    for (const c of r.conveyors) {
      assert.equal(c.bite, ROOM_BELT_BITE, `espejo${i}`);
      const end = c.dirX > 0 ? c.x + c.w : c.x - 1;
      assert.equal(r.tiles[Math.floor(c.y / TILE) * r.cols + Math.floor(end / TILE)], 1);
    }
  }
  assert.ok(mirrored > 5 && mirrored < 35, `${mirrored} de 40 reflejadas`);
});

test('quieta encima, la cinta se la lleva; andando en contra se avanza; los rodillos muerden y devuelven', () => {
  const w = room('cinta-clasificacion');
  assert.equal(w.conveyors.length, 2, 'las cintas corren desde que se entra');
  const top = w.conveyors.find((c) => c.dirX > 0)!;
  assert.equal(top.speed, ROOM_BELT_SPEED);
  assert.ok(top.speed < w.player.def.speed / 2, 'se remonta andando');
  // Standing still in the middle of the top belt: carried right.
  w.player.x = top.x + 100;
  w.player.y = top.y + top.h / 2;
  const x0 = w.player.x;
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(Math.abs(w.player.x - x0 - ROOM_BELT_SPEED) < 4, `${w.player.x - x0} px en 1 s`);
  // Walking against it: slower, but it gets there.
  const x1 = w.player.x;
  for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, moveX: -1 });
  assert.ok(w.player.x < x1 - 40, `${x1 - w.player.x} px en contra`);
  // Left there: into the rollers, a hit and thrown back up the belt.
  w.player.x = top.x + top.w - 40;
  w.player.y = top.y + top.h / 2;
  const hp = w.player.hp;
  let bitten = false;
  for (let i = 0; i < ticks(2) && !bitten; i++) {
    step(w, NO_INPUT);
    bitten = w.events.some((e) => e.type === 'bite');
  }
  assert.ok(bitten, 'los rodillos muerden');
  assert.equal(w.player.hp, hp - 1);
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT);
  assert.ok(w.player.x < top.x + top.w - 50, 'de vuelta cinta arriba');
  assert.ok(DOWN_CAUSES.cinta?.contact, 'su causa de baja');
  assert.deepEqual(checkInvariants(w), []);
});

test('los enemigos a pie también van de viaje (aunque sean un microondas que no anda)', () => {
  const w = room('cinta-clasificacion');
  w.noDamage = true;
  const bottom = w.conveyors.find((c) => c.dirX < 0)!;
  const y = bottom.y + bottom.h / 2 + 4;
  // One that does not walk by itself (the microwave, without its walk to your reflection).
  const def = structuredClone(ENEMIES.microondas!);
  if (def.brain.kind === 'turret') delete def.brain.mirror;
  const walker = spawnEnemy(w.nextId++, def, bottom.x + 200, y);
  w.enemies.push(walker);
  w.player.x = 300;
  w.player.y = 60;
  const wx = walker.x;
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(walker.x < wx - 25, `el microondas: ${walker.x - wx} px`);
  assert.ok(Math.abs(walker.y - y) < 12);
  assert.deepEqual(checkInvariants(w), []);
});

test('en el taller las salas con cinta se juegan sin romper nada, y la cinta viaja con la sala', () => {
  for (let s = 0; s < 30; s++) {
    const w = createWorld({ seed: `cinta-${s}`, floor: true, level: SERVICE_LEVEL, service: true });
    w.noDamage = true;
    const i = w.floor!.rooms.findIndex((st) => buildRoom(st.template).conveyors.length > 0);
    if (i < 0) continue;
    enterRoom(w, i, 'S');
    assert.ok(w.conveyors.length > 0);
    for (let k = 0; k < ticks(3); k++) step(w, { ...NO_INPUT, moveX: k % 90 < 45 ? 1 : -1, fire: true });
    assert.deepEqual(checkInvariants(w), []);
    // Out and back: the same belts, none doubled.
    const n = w.conveyors.length;
    enterRoom(w, 0, 'S');
    assert.equal(w.conveyors.length, buildRoom(w.floor!.rooms[0]!.template).conveyors.length);
    enterRoom(w, i, 'S');
    assert.equal(w.conveyors.length, n);
    return;
  }
  assert.fail('ninguna planta de 30 trae una sala con cinta');
});
