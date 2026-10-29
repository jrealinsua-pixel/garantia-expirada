import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom, TILE } from '../src/sim/room.ts';
import { createWorld, NO_INPUT, step, type SimEvent } from '../src/sim/world.ts';

test('puertas: cada sala abre hueco solo en las paredes que se le piden', () => {
  const r = buildRoom(ROOMS['carga-descarga']!, ['N', 'E']);
  assert.deepEqual(r.doors.map((d) => d.dir), ['N', 'E']);
  const n = r.doors[0]!;
  assert.deepEqual([n.x, n.y, n.w, n.h], [9 * TILE, 0, 2 * TILE, 2 * TILE], 'norte: dos casillas de ancho en el centro del muro de fondo');
  const e = r.doors[1]!;
  assert.deepEqual([e.x, e.y, e.w, e.h], [19 * TILE, 6 * TILE, TILE, 2 * TILE], 'este: dos casillas de alto en el centro del lateral');
  assert.equal(buildRoom(ROOMS['carga-descarga']!).doors.length, 4, 'por defecto, una plantilla de planta tiene las cuatro');
  assert.deepEqual(buildRoom(ROOMS['sala-pruebas']!).doors.map((d) => d.dir), ['N', 'S']);
});

test('puertas: una puerta que no cae en pared es un error', () => {
  const rows = ['########', '########', '#......#', '#P......', '#......#', '########'];
  assert.throws(() => buildRoom({ id: 'x', name: 'x', rows }, ['E']), /door E/);
});

test('puertas: una sala de combate se cierra al entrar y se abre al caer el último enemigo', () => {
  const w = createWorld({ seed: 'persianas', room: 'oferta-relampago', depth: 2 });
  assert.ok(w.enemies.length > 0);
  assert.equal(w.doorsShut, true);
  step(w, NO_INPUT);
  assert.equal(w.doorsShut, true, 'siguen cerradas mientras quede alguien');
  // Every enemy but one falls: still shut.
  const last = w.enemies[w.enemies.length - 1]!;
  for (const en of w.enemies) if (en !== last) en.damageTaken = en.def.hp;
  step(w, NO_INPUT);
  assert.equal(w.doorsShut, w.enemies.length > 0);
  for (const en of w.enemies) en.damageTaken = en.def.hp;
  const events: SimEvent[] = [];
  for (let i = 0; i < 3; i++) {
    step(w, NO_INPUT);
    events.push(...w.events);
  }
  assert.equal(w.doorsShut, false);
  assert.equal(events.filter((e) => e.type === 'doors').length, 1, 'un solo aviso de apertura');
});

test('puertas: las salas sin combate están abiertas y la de pruebas nunca se abre', () => {
  for (const id of ['entrada', 'tesoro', 'tienda', 'secreta']) assert.equal(createWorld({ seed: 'x', room: id }).doorsShut, false, id);
  const w = createWorld({ seed: 'pruebas' });
  assert.equal(w.doorsShut, true);
  for (const en of w.enemies) en.damageTaken = en.def.hp;
  for (let i = 0; i < 10; i++) step(w, NO_INPUT);
  assert.equal(w.enemies.length, 0);
  assert.equal(w.doorsShut, true, 'de la Sala de Pruebas no se sale');
  // A combat room built without enemies (tests) has nothing to lock in.
  assert.equal(createWorld({ seed: 'x', room: 'carga-descarga', noEnemies: true }).doorsShut, false);
});
