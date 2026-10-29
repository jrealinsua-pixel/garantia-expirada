// The whole of floor 2 (M8): more enemies per room than floor 1, and the spots where things drop
// are always on clear floor, even in the middle of a big block of shelving.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isClear, createWorld, freeSpot, LEVEL_DEPTH } from '../src/sim/world.ts';

const enemiesIn = (rows: readonly string[]): number => rows.join('').replace(/[^AOLTZIFRW]/g, '').length;

test('la planta 2 cuenta como más honda: más enemigos por sala de combate que la 1', () => {
  assert.ok(LEVEL_DEPTH >= 2);
  let one = 0;
  let two = 0;
  let rooms1 = 0;
  let rooms2 = 0;
  for (let i = 0; i < 12; i++) {
    for (const [level, add] of [[1, (n: number) => (one += n)], [2, (n: number) => (two += n)]] as const) {
      const f = createWorld({ seed: `hondo-${i}`, floor: true, level }).floor!;
      for (const r of f.rooms) {
        if (r.template.kind !== 'combat') continue;
        add(enemiesIn(r.template.rows));
        if (level === 1) rooms1++;
        else rooms2++;
      }
    }
  }
  assert.ok(two / rooms2 > (one / rooms1) * 1.2, `por sala: planta 1 ${(one / rooms1).toFixed(2)}, planta 2 ${(two / rooms2).toFixed(2)}`);
});

test('freeSpot encuentra suelo libre aunque el centro sea un bloque de estanterías de seis casillas', () => {
  const w = createWorld({ seed: 'bloque', room: 'autoimpresion', level: 2, noEnemies: true });
  const x = w.room.w / 2;
  const y = 216;
  assert.ok(!isClear(w, x, y, 4), 'el centro de la sala es estantería');
  const at = freeSpot(w, x, y, 4);
  assert.ok(isClear(w, at.x, at.y, 4), `sale en ${at.x}, ${at.y}`);
});
