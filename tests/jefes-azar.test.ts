// M14 (j1): los jefes al azar. Cada planta elige su jefe de una lista con la semilla (nota del humano
// del 2026-10-30), y lo que pedía un jefe concreto pasa a pedir «el jefe de la planta N».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLOOR_BOSS_POOLS, floorBossOf, floorBossPool } from '../src/data/rooms.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { ROSTER } from '../src/data/unlocks.ts';
import { LORE } from '../src/data/lore.ts';
import { BOSS_FLOORS, bossesOfFloor, floorBossBeaten, floorOfBoss, pickFloorBoss } from '../src/sim/bosses.ts';
import { enemyOfChar } from '../src/sim/room.ts';
import { createWorld, type World } from '../src/sim/world.ts';
import { emptyProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { meets, serviceBoard, unlockProgress } from '../src/sim/unlocks.ts';

const pools = FLOOR_BOSS_POOLS as Record<number, string[]>;

/** Runs `fn` with floor `level`'s list swapped for `pool` (the real lists may still have one boss). */
function withPool<T>(level: number, pool: string[], fn: () => T): T {
  const old = pools[level]!;
  pools[level] = pool;
  try {
    return fn();
  } finally {
    pools[level] = old;
  }
}

const bossRoomRows = (w: World): string => {
  const f = w.floor!;
  const id = f.layout.rooms.find((r) => r.kind === 'boss')!.id;
  return f.rooms[id]!.template.rows.join('\n');
};

const run = (over: Partial<RunResult> = {}): RunResult => ({
  character: 'tostadora',
  outcome: 'down',
  seconds: 300,
  kills: 20,
  coupons: 3,
  bosses: [],
  level: 1,
  cause: { by: 'microondas', how: 'bullet' },
  items: [],
  weapons: ['secador'],
  ...over,
});
const played = (...runs: RunResult[]): Profile => runs.reduce((p, r) => recordRun(p, r), emptyProfile());

test('las listas de jefes: cada planta tiene la suya, la primera es la de siempre y todos son jefes de una sola planta', () => {
  const seen = new Map<string, number>();
  for (const n of BOSS_FLOORS) {
    const pool = floorBossPool(n);
    assert.ok(pool.length >= 1, `la planta ${n} tiene jefes`);
    assert.equal(pool[0], floorBossOf(n), `la planta ${n} empieza por su jefe de siempre`);
    for (const ch of pool) {
      const id = enemyOfChar(ch);
      assert.ok(id && ENEMIES[id]?.boss, `«${ch}» de la planta ${n} es un jefe`);
      assert.equal(seen.get(id!), undefined, `${id} sale en una sola planta`);
      seen.set(id!, n);
      assert.equal(floorOfBoss(id!), n);
    }
  }
  assert.equal(floorOfBoss('microondas'), undefined);
});

test('con un solo jefe en la lista no cambia nada: la planta trae el de siempre', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    if (floorBossPool(n).length > 1) continue;
    const w = createWorld({ seed: `azar-${n}`, floor: true, level: n });
    assert.equal(w.floor!.boss, floorBossOf(n));
    assert.ok(bossRoomRows(w).includes(floorBossOf(n)), `la sala del jefe de la planta ${n} trae a su jefe`);
  }
});

test('con dos jefes en la lista, la semilla elige uno, siempre el mismo, y los dos salen a menudo', () => {
  withPool(1, ['N', 'D'], () => {
    const count: Record<string, number> = { N: 0, D: 0 };
    for (let i = 0; i < 200; i++) {
      const b = pickFloorBoss(`s${i}`, 1);
      assert.equal(pickFloorBoss(`s${i}`, 1), b, 'la misma semilla, el mismo jefe');
      count[b] = (count[b] ?? 0) + 1;
    }
    assert.ok(count.N! > 60 && count.D! > 60, `reparto razonable: ${JSON.stringify(count)}`);
    // The boss room of the floor brings the one picked, and only it.
    for (let i = 0; i < 12; i++) {
      const w = createWorld({ seed: `planta-${i}`, floor: true, level: 1 });
      const other = w.floor!.boss === 'N' ? 'D' : 'N';
      assert.equal(w.floor!.boss, pickFloorBoss(`planta-${i}`, 1));
      assert.ok(bossRoomRows(w).includes(w.floor!.boss));
      assert.ok(!bossRoomRows(w).includes(other));
    }
  });
});

test('elegir jefe no mueve nada más de la planta: salas, plantillas, armas y objetos son los mismos', () => {
  for (let i = 0; i < 8; i++) {
    const seed = `igual-${i}`;
    const a = createWorld({ seed, floor: true, level: 1 });
    const b = withPool(1, ['N', 'D'], () => createWorld({ seed, floor: true, level: 1, boss: 'D' }));
    const fa = a.floor!;
    const fb = b.floor!;
    assert.deepEqual(fa.layout, fb.layout);
    assert.deepEqual(fa.weapons, fb.weapons);
    assert.deepEqual(fa.items, fb.items);
    fa.rooms.forEach((r, id) => {
      if (fa.layout.rooms[id]!.kind === 'boss') return;
      assert.deepEqual(r.template.rows, fb.rooms[id]!.template.rows, `sala ${id} igual`);
    });
  }
});

test('el jefe se puede forzar (tests y ?jefe=), pero solo con la letra de un jefe', () => {
  const w = createWorld({ seed: 'forzado', floor: true, level: 1, boss: 'X' });
  assert.equal(w.floor!.boss, 'X');
  assert.ok(bossRoomRows(w).includes('X'));
  const n = createWorld({ seed: 'forzado', floor: true, level: 1, boss: 'A' });
  assert.equal(n.floor!.boss, 'N', 'el aspirador no es un jefe: se ignora');
});

test('los personajes y la cita piden el jefe de una planta, sea cual sea', () => {
  const batidora = ROSTER.find((r) => r.id === 'batidora-vaso')!;
  const movil = ROSTER.find((r) => r.id === 'movil')!;
  const plancha = ROSTER.find((r) => r.id === 'plancha')!;
  assert.deepEqual(batidora.condition, { floorBosses: [1] });
  assert.deepEqual(movil.condition, { floorBosses: [2] });
  assert.deepEqual(plancha.condition, { floorBosses: [4] });
  // With the default lists, the bosses of always still unlock them.
  assert.ok(meets(batidora.condition, played(run({ bosses: ['nevera-suprema'] }))));
  assert.ok(!meets(batidora.condition, played(run({ bosses: ['router-wifi'] }))));
  // And with another boss on floor 1, beating that one is enough.
  withPool(1, ['N', 'D'], () => {
    const p = played(run({ bosses: ['muneco-moda'] }));
    assert.ok(floorBossBeaten(p.bosses, 1));
    assert.ok(meets(batidora.condition, p));
    assert.deepEqual(unlockProgress(batidora.condition, p), [{ done: 1, needed: 1 }]);
    assert.ok(p.unlocked.includes('batidora-vaso'), 'se desbloquea al guardar la partida');
  });
  const jefes = serviceBoard(played(run({ bosses: ['nevera-suprema', 'router-wifi'] }))).rows.find((r) => r.id === 'jefes')!;
  assert.equal(jefes.done, 2);
  assert.equal(jefes.needed, 5);
  assert.match(jefes.text, /jefe de las 5 plantas/);
});

test('el documento del jefe es de su planta: lo deja cualquiera de sus jefes', () => {
  const nevera = LORE.find((l) => 'boss' in l.source && l.source.boss === 'nevera-suprema')!;
  assert.ok(played(run({ bosses: ['nevera-suprema'] })).docs.includes(nevera.id));
  withPool(1, ['N', 'D'], () => {
    assert.deepEqual(bossesOfFloor(1), ['nevera-suprema', 'muneco-moda']);
    assert.ok(played(run({ bosses: ['muneco-moda'] })).docs.includes(nevera.id), 'el otro jefe de la planta 1 lo deja');
  });
  assert.ok(!played(run({ bosses: ['router-wifi'] })).docs.includes(nevera.id));
});
