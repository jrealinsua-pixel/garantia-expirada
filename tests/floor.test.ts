import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floorToText, generateFloor, validateFloor } from '../src/sim/floor.ts';

test('planta: 10.000 semillas dan plantas válidas', () => {
  const sizes = new Map<number, number>();
  for (let i = 0; i < 10000; i++) {
    const f = generateFloor(`s${i}`);
    const errs = validateFloor(f);
    assert.deepEqual(errs, [], `semilla s${i}:\n${floorToText(f)}`);
    const n = f.rooms.length - 1;
    sizes.set(n, (sizes.get(n) ?? 0) + 1);
  }
  // Every size in the range shows up.
  for (let n = 10; n <= 15; n++) assert.ok((sizes.get(n) ?? 0) > 500, `plantas de ${n} salas: ${sizes.get(n)}`);
});

test('planta: la misma semilla da la misma planta', () => {
  assert.equal(floorToText(generateFloor('garantia')), floorToText(generateFloor('garantia')));
  assert.notEqual(floorToText(generateFloor('garantia')), floorToText(generateFloor('expirada')));
});

test('planta: el jefe está al fondo y la sala secreta se esconde entre varias salas', () => {
  for (let i = 0; i < 300; i++) {
    const f = generateFloor(`fondo${i}`);
    const boss = f.rooms[f.boss]!;
    assert.ok(boss.depth >= 3, 'el jefe queda a tres salas o más de la entrada');
    const secret = f.rooms.find((r) => r.kind === 'secret')!;
    assert.ok(secret.doors.length >= 2);
    assert.ok(secret.doors.every((d) => d.secret));
  }
});

test('planta: se puede pedir otro tamaño', () => {
  const f = generateFloor('pequeña', { rooms: [7, 7] });
  assert.deepEqual(validateFloor(f, { rooms: [7, 7] }), []);
  assert.equal(f.rooms.length, 8);
});
