// The Juguetería is the wall (M10 (7)): its room enemies take more breaking than the same ones
// on floors 1 and 2, the Oficinas' more still, and the bosses keep their own life.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/sim/world.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FLOOR_TOUGHNESS, templatesOf } from '../src/data/rooms.ts';

const toughness = (l: number): number => FLOOR_TOUGHNESS[l] ?? 1;

test('las plantas 1 y 2 no cambian; la 3 es más dura y la 4 más todavía', () => {
  assert.equal(toughness(1), 1);
  assert.equal(toughness(2), 1);
  assert.ok(toughness(3) > 1);
  assert.ok(toughness(4) >= toughness(3));
});

test('los enemigos de una sala de la planta 3 tienen la vida de su planta', () => {
  for (const level of [1, 2, 3, 4]) {
    let seen = 0;
    for (const t of templatesOf('combat', level).slice(0, 4)) {
      const w = createWorld({ seed: `muro-${t.id}`, room: t.id, level });
      for (const en of w.enemies) {
        const base = ENEMIES[en.def.id]!;
        assert.equal(en.def.hp, Math.round(base.hp * toughness(level)), `${en.def.id} en la planta ${level}`);
        seen++;
      }
    }
    assert.ok(seen > 4, `planta ${level}: ${seen} enemigos`);
  }
});

test('los jefes conservan su vida en su planta', () => {
  for (const [level, room] of [[3, 'jefe-jugueteria'], [4, 'jefe-oficinas']] as const) {
    const w = createWorld({ seed: `muro-jefe-${level}`, room, level });
    const boss = w.enemies.find((e) => e.def.brain.kind === 'boss');
    assert.ok(boss, `hay jefe en ${room}`);
    assert.equal(boss.def.hp, ENEMIES[boss.def.id]!.hp);
  }
});
