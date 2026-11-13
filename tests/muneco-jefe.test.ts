// El Muñeco de Moda en la simulación (M10 5b, jefe de la planta 3): accesorios, la pasarela con sus
// destellos, y las rebajas (la etiqueta baja, más deprisa, y llama a los Muñequitos Repetidos).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { floorBossOf } from '../src/data/rooms.ts';
import type { BossBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { TILE } from '../src/sim/room.ts';
import { activeWarnings, createWorld, DT, NO_INPUT, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['muneco-moda']!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'muneco'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-jugueteria', level: 3 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'muneco-moda');
  assert.ok(boss, 'el Muñeco está en el Escaparate');
  return { w, boss };
}

const run = (w: World, s: number): void => {
  for (let i = 0; i < ticks(s); i++) step(w, NO_INPUT);
};

/** Steps until the boss strikes its catwalk pose (state `warn` on a runway), at most `s` seconds. */
function untilPose(w: World, boss: Enemy, s = 40): boolean {
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    if (boss.state === 'warn' && boss.runTo) return true;
  }
  return false;
}

test('el Muñeco es el jefe de la planta 3, con su cartel, su causa de baja y su documento', () => {
  assert.equal(floorBossOf(3), 'D');
  assert.equal(floorBossOf(2), 'X');
  assert.equal(def.boss?.subtitle, 'Jefe de planta · Juguetería');
  assert.equal(def.boss?.motto, 'Pasado de moda. Como tú.');
  assert.ok(DOWN_CAUSES['muneco-moda']?.bullet && DOWN_CAUSES['muneco-moda']?.contact);
  const f3 = createWorld({ seed: 'planta-muneco-4', floor: true, level: 3 }).floor!;
  const room = f3.rooms.find((r) => r.template.kind === 'boss')!;
  assert.equal(room.template.id, 'jefe-jugueteria');
  assert.ok(room.template.rows.join('').includes('D'));
  // Its sheet: boxed frames first (0-6), the tag drawn on top of them in the phase's price.
  assert.equal(def.anim?.badge?.sprite, 'etiqueta-rebaja');
  // (Out of the box, phase 3, there is no tag: see muneco-fase3.test.ts.)
  assert.deepEqual(brain.phases.map((p) => p.badge), [0, 1, 2, 3, undefined]);
});

test('los accesorios son zapatos y bolsos rosas; los anillos de las rebajas tienen su hueco y son cada vez más densos', () => {
  const acc = expandPattern(PATTERNS['muneco-accesorios']!, 0, new Rng('a'));
  assert.ok(acc.length >= 15 && acc.every((s) => s.color === 'accessory'));
  const aim = 0.4;
  const off = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  let last = 0;
  for (const id of ['muneco-rebaja-30', 'muneco-rebaja-50', 'muneco-rebaja-70']) {
    const shots = expandPattern(PATTERNS[id]!, aim, new Rng('r'));
    assert.ok(shots.length > last, `${id}: más denso que el anterior`);
    last = shots.length;
    const first = shots.filter((s) => s.delay === 0);
    // Its first hole is 20° off the aim: there is always a way through.
    for (const s of first) assert.ok(off(s.angle, aim + (20 * Math.PI) / 180) >= (20 * Math.PI) / 180, `${id}: nada en el hueco`);
  }
});

test('la pasarela: posa, enseña su carril, lo cruza de lado a lado y deja destellos que estallan', () => {
  const { w, boss } = fight('pasarela');
  assert.ok(untilPose(w, boss), 'tarde o temprano sale a la pasarela');
  // Posing: the posing frame, and a warning over the whole lane.
  assert.equal(enemyFrame(boss, 0), def.anim!.warn);
  const lane = activeWarnings(w).find((wn) => wn.aimed && !wn.bullets && wn.reach !== undefined);
  assert.ok(lane, 'el aviso enseña el carril');
  assert.ok(lane.reach! > 150, `un carril largo: ${lane.reach}`);
  const to = { ...boss.runTo! };
  const startX = boss.x;
  // The lane is clear from wall to wall, and the far side of the room from where it stood.
  assert.ok(Math.abs(to.x - startX) > w.room.cols * TILE * 0.3);
  let flashes = 0;
  const flashYs: number[] = [];
  const sparks = new Set<number>();
  const count = (): void => {
    for (const b of w.bullets) if (b.owner === 'enemy' && b.by === 'muneco-moda' && b.color === 'red') sparks.add(b.id);
  };
  for (let i = 0; i < ticks(6) && (boss.state === 'warn' || boss.state === 'charge'); i++) {
    step(w, NO_INPUT);
    count();
    for (const e of w.events) if (e.type === 'flash') {
      flashes++;
      flashYs.push(e.y);
    }
  }
  assert.ok(Math.abs(boss.x - to.x) < 12 && Math.abs(boss.y - to.y) < 12, 'llega al otro lado');
  assert.ok(flashes >= 6, `${flashes} destellos`);
  // All of them in a row along its lane.
  for (const y of flashYs) assert.ok(Math.abs(y - to.y) < 3, 'los destellos van en fila por el carril');
  const marked = w.emitters.filter((e) => e.mark === 'flash');
  assert.ok(marked.length > 0, 'los destellos avisan en el suelo');
  // They go off a moment later: bullets out of the floor along the lane, six from each.
  for (let i = 0; i < ticks(0.8); i++) {
    step(w, NO_INPUT);
    count();
  }
  assert.equal(sparks.size, flashes * 6, `${sparks.size} chispas de ${flashes} destellos`);
});

test('el carril de la pasarela no pasa por encima de la tostadora: va a su lado', () => {
  let fair = 0;
  for (let i = 0; i < 12; i++) {
    const { w, boss } = fight(`carril-${i}`);
    // The toaster in the middle band of the Escaparate (between the display cases), standing still.
    w.player.x = (w.room.cols * TILE) / 2;
    w.player.y = TILE * 9;
    if (!untilPose(w, boss)) continue;
    if (Math.abs(boss.runTo!.y - w.player.y) >= 20) fair++;
  }
  assert.ok(fair >= 10, `${fair} de 12 carriles a un lado`);
});

test('rebajas: la etiqueta baja tres veces, cada una con su grito y dos repetidos (nunca más de cuatro)', () => {
  const { w, boss } = fight('rebajas');
  run(w, 2);
  const lines: string[] = [];
  const stages: number[] = [];
  const summoned: number[] = [];
  for (const [left, phase] of [[0.58, 1], [0.45, 2], [0.32, 3]] as const) {
    boss.damageTaken = def.hp * (1 - left);
    for (let i = 0; i < ticks(1); i++) {
      step(w, NO_INPUT);
      for (const e of w.events) {
        if (e.type === 'bossPhase') {
          lines.push(e.line ?? '');
          stages.push(e.stage ?? 0);
        }
        if (e.type === 'summon') summoned.push(e.spawned.length);
      }
    }
    assert.equal(boss.bossPhase, phase);
    const helpers = w.enemies.filter((e) => e.owner === boss.id && e.def.id === 'munequito-repetido');
    assert.ok(helpers.length <= 4, `${helpers.length} repetidos`);
  }
  assert.deepEqual(lines, ['¡Ahora con más accesorios!', '¡Ahora con más accesorios!', '¡Ahora con más accesorios!']);
  assert.deepEqual(stages, [2, 2, 2], 'las tres rebajas son la fase 2');
  assert.deepEqual(summoned, [2, 2], 'dos y dos; a la tercera ya tiene cuatro');
  // Each sale makes it hurry.
  const speeds = brain.phases.map((p) => p.walkSpeed);
  for (let i = 1; i < speeds.length; i++) assert.ok(speeds[i]! > speeds[i - 1]!);
  const runs = brain.phases.flatMap((p) => p.attacks).flatMap((a) => (a.kind === 'runway' ? [a.speed] : []));
  for (let i = 1; i < runs.length; i++) assert.ok(runs[i]! > runs[i - 1]!);
});

test('al caer el Muñeco, sus repetidos caen con él', () => {
  const { w, boss } = fight('caida');
  run(w, 1);
  boss.damageTaken = def.hp * 0.42;
  run(w, 1);
  assert.ok(w.enemies.some((e) => e.owner === boss.id && e.def.id === 'munequito-repetido'));
  boss.damageTaken = def.hp;
  run(w, 0.2);
  assert.ok(!w.enemies.some((e) => e.def.id === 'munequito-repetido'), 'se van con él');
});

test('el combate contra el Muñeco es determinista', () => {
  const a = fight('det').w;
  const b = fight('det').w;
  for (let i = 0; i < ticks(20); i++) {
    const inp = { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1, fire: true, aimX: 300, aimY: 100 };
    step(a, inp);
    step(b, inp);
  }
  assert.equal(worldHash(a), worldHash(b));
});
