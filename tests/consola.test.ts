// M14 (j4): La Consola Edición Coleccionista, el segundo jefe de la planta 3. Suelta cajas de botín
// (rotas a tiros: un juguete o cupones falsos; abiertas solas: lo peor), se para a actualizarse y, con
// el «Pase de temporada», cambia de ataques cada pocos segundos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { floorBossPool } from '../src/data/rooms.ts';
import type { BossBrain, LootboxBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { bossesOfFloor, pickFloorBoss } from '../src/sim/bosses.ts';
import { helpersOf, tossHelpers } from '../src/sim/enemies.ts';
import { makeCajaBotinFrames, makeConsolaFrames, CONSOLA_PER_PHASE } from '../tools/sprites/consola.ts';
import { checkInvariants, createWorld, DT, NO_INPUT, step, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';

const def = ENEMIES['consola-coleccionista']!;
const brain = def.brain as BossBrain;
const caja = ENEMIES['caja-botin']!;
const cajaBrain = caja.brain as LootboxBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'consola'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-jugueteria', level: 3, boss: 'È' });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'consola-coleccionista');
  assert.ok(boss, 'la Consola está en la sala del jefe de la planta 3');
  return { w, boss };
}

/** Runs `s` seconds, collecting the events. */
function run(w: World, s: number): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    out.push(...w.events);
  }
  return out;
}

/** Tosses `n` boxes out of the boss right now. */
function toss(w: World, boss: Enemy, n: number, max = 10): Enemy[] {
  const ids = tossHelpers(w, boss, { kind: 'summon', id: 'caja-botin', count: n, max, toss: 190, telegraph: 0, weight: 1 });
  return w.enemies.filter((e) => ids.includes(e.id));
}

test('la planta 3 elige entre el Muñeco y la Consola con la semilla, más o menos a medias', () => {
  assert.deepEqual(floorBossPool(3), ['D', 'È']);
  assert.deepEqual(bossesOfFloor(3), ['muneco-moda', 'consola-coleccionista']);
  let consola = 0;
  for (let i = 0; i < 400; i++) if (pickFloorBoss(`s-${i}`, 3) === 'È') consola++;
  assert.ok(consola > 140 && consola < 260, `${consola} de 400`);
});

test('sus datos: dos fases, lema, causa de baja, la caja de botín y sus hojas', () => {
  assert.deepEqual(brain.phases.map((p) => p.name), ['Edición Coleccionista', 'Pase de temporada']);
  // M14c (a7f): the second phase shifts the new sheet's frames (EnemyAnim.phaseShift; see tests/estilo-a7f.test.ts).
  assert.equal(def.anim?.phaseShift, 11);
  for (const p of brain.phases) for (const a of p.attacks) if (a.kind === 'pattern') assert.ok(PATTERNS[a.pattern], a.pattern);
  for (const s of [...(caja.surprise ?? []), ...(caja.selfSurprise ?? [])]) {
    if (s.pattern) assert.ok(PATTERNS[s.pattern], s.pattern);
    if (s.spawn) assert.ok(ENEMIES[s.spawn.id], s.spawn.id);
  }
  // Left alone, what comes out is always a toy: never coupons.
  assert.ok(caja.selfSurprise!.every((s) => s.spawn && !s.coupons && !s.pattern));
  assert.equal(def.boss?.motto, 'Ahora con un 3 % más de contenido. Desbloqueable.');
  assert.ok(DOWN_CAUSES['consola-coleccionista']?.bullet && DOWN_CAUSES['consola-coleccionista']?.contact);
  assert.equal(caja.contactDamage, 0);
  assert.equal(caja.glossary, false);
  const frames = makeConsolaFrames();
  assert.equal(frames.length, 2 * CONSOLA_PER_PHASE);
  for (const f of frames) assert.deepEqual([f.w, f.h], [72, 76]);
  assert.equal(makeCajaBotinFrames().length, 4);
});

test('«Cajas de botín»: salen hacia el jugador, se paran y nunca hay más de las que dice', () => {
  const { w, boss } = fight();
  const boxes = toss(w, boss, 3, 4);
  assert.equal(boxes.length, 3);
  for (const b of boxes) assert.equal(b.owner, boss.id);
  run(w, 1);
  for (const b of boxes) assert.ok(Math.hypot(b.vx, b.vy) < 1, 'se para donde cae');
  // Only one more fits under a max of 4.
  assert.equal(toss(w, boss, 3, 4).length, 1);
  assert.equal(helpersOf(w, boss).length, 4);
  assert.deepEqual(checkInvariants(w), []);
});

test('una caja que nadie rompe se abre sola y suelta lo peor: juguetes del jefe', () => {
  const { w, boss } = fight('consola-sola');
  const [box] = toss(w, boss, 1);
  boss.state = 'stun';
  boss.until = 99;
  const ev = run(w, cajaBrain.open + 0.2);
  assert.ok(ev.some((e) => e.type === 'lootShake'), 'tiembla antes de abrirse');
  const s = ev.find((e) => e.type === 'surprise');
  assert.ok(s && s.type === 'surprise' && s.self, 'se abre sola');
  assert.ok(!w.enemies.includes(box!));
  assert.ok(s.spawned.length > 0);
  for (const id of s.spawned) assert.equal(w.enemies.find((e) => e.id === id)?.owner, boss.id, 'el juguete es del jefe');
});

test('rota a tiros sale de su tabla: a veces juguete, a veces cupones falsos (balas)', () => {
  const { w, boss } = fight('consola-tiros');
  boss.state = 'stun';
  boss.until = 999;
  let fake = 0;
  let toy = 0;
  for (let i = 0; i < 40; i++) {
    const [box] = toss(w, boss, 1, 99);
    box!.damageTaken = box!.def.hp;
    const ev = run(w, DT);
    const s = ev.find((e) => e.type === 'surprise');
    assert.ok(s && s.type === 'surprise' && !s.self);
    if (s.spawned.length) toy++;
    if (s.line === 'Cupones (no canjeables)') fake++;
    // Clear the toys so the room does not fill up.
    for (const e of w.enemies) if (e !== boss) e.damageTaken = e.def.hp;
    run(w, DT);
  }
  assert.ok(fake > 3 && toy > 10, `${fake} cupones falsos, ${toy} juguetes`);
  assert.ok(w.bullets.some((b) => b.color === 'fakecoupon') || fake > 0);
});

test('cuando cae la Consola caen sus cajas sin abrirse, y sus juguetes', () => {
  const { w, boss } = fight('consola-cae');
  toss(w, boss, 3);
  boss.damageTaken = boss.def.hp;
  const ev = run(w, 0.5);
  assert.equal(ev.filter((e) => e.type === 'surprise').length, 0, 'ninguna caja se abre');
  assert.equal(w.enemies.filter((e) => e.def.id === 'caja-botin' && e.damageTaken < e.def.hp).length, 0);
});

test('«Pase de temporada»: anuncia cada temporada, en orden, y solo usa los ataques de la que toca', () => {
  const { w, boss } = fight('consola-temporadas');
  boss.damageTaken = Math.ceil(def.hp * 0.55);
  const ph = brain.phases[1]!;
  const seasons: number[] = [];
  const used = new Map<number, Set<number>>();
  for (let i = 0; i < ticks(60); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'season') seasons.push(e.index);
    if (boss.bossPhase === 1 && boss.attack !== undefined && (boss.state === 'warn' || boss.state === 'fire')) {
      const s = boss.season ?? -1;
      if (!used.has(s)) used.set(s, new Set());
      used.get(s)!.add(boss.attack ?? -1);
    }
    // No damage taken: it stays in phase 2.
    boss.damageTaken = Math.ceil(def.hp * 0.55);
    for (const e of w.enemies) if (e !== boss) e.damageTaken = e.def.hp;
  }
  assert.deepEqual(seasons.slice(0, 4), [0, 1, 2, 0]);
  for (const [s, attacks] of used) {
    for (const i of attacks) {
      const a = ph.attacks[i];
      if (!a || a.season === undefined) continue;
      // An attack picked at the very end of a season can still be going when the next one starts.
      const prev = (s + ph.seasons!.names.length - 1) % ph.seasons!.names.length;
      assert.ok(a.season === s || a.season === prev, `temporada ${s}: ataque ${i} es de la ${a.season}`);
    }
  }
  assert.ok(used.size >= 3);
});

test('se para a actualizarse: quieta, con su línea, y recibe más', () => {
  const { w, boss } = fight('consola-update');
  // (Its first tick starts the phase, which sets when the first update comes.)
  run(w, DT);
  boss.muteIn = 0;
  boss.state = 'idle';
  boss.t = 0;
  boss.until = 99;
  const ev = run(w, 0.1);
  const m = ev.find((e) => e.type === 'mute');
  assert.ok(m && m.type === 'mute' && m.line?.startsWith('Actualización obligatoria'));
  assert.equal(boss.state, 'stun');
});
