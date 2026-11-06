// El Dispensador de Turnos (M11 (4a), Atención al Cliente): a slow support enemy that, every
// 4-5 s, calls a turn: a numbered circle lights up on the floor away from the toaster, somewhere
// it can walk to in time. Into it in 2.5 s, «Atendido»: nothing happens, and the circle stops
// enemy bullets for a moment. Late, «Turno perdido»: a wide fan of tickets at the toaster. With
// no turn on, a couple of loose tickets that glide slowly. Hiding and waiting is what it punishes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { SLOT_ENEMIES_4, SLOT_ENEMIES_5, slotEnemiesOf, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { DOWN_CAUSES, turnCallLine, TURN_LOST_LINE, TURN_SERVED_LINE } from '../src/data/texts.ts';
import type { TurnerBrain } from '../src/data/types.ts';
import { copiable, OWN_TURN, turnSpot } from '../src/sim/enemies.ts';
import { findPath } from '../src/sim/nav.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { activeWarnings, createWorld, DT, isClear, NO_INPUT, spawnEnemy, step, type Bullet, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['dispensador-turnos']!;
const brain = def.brain as TurnerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/** An empty room with the toaster in the middle (untouchable) and the dispenser `dx` px to its left. */
function waiting(seed: string, dx = 150): { w: World; d: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const d = spawnEnemy(w.nextId++, def, w.player.x - dx, w.player.y);
  w.enemies = [d];
  return { w, d };
}

/** Steps until the dispenser has called a turn (at most `s` s); the ticks it took. */
function untilCalled(w: World, d: Enemy, s = 8): number {
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    if (d.turn) return i;
  }
  throw new Error('no ha llamado ningún turno');
}

/** The toaster held still (its roll spent, so the bot-free world never moves it). */
function holdStill(w: World): void {
  w.player.vx = 0;
  w.player.vy = 0;
}

test('el dispensador es contenido: datos, sprite, tiques, textos, causa de baja y solo desde la planta 5', () => {
  assert.equal(def.name, 'Dispensador de Turnos');
  assert.equal(def.hp, 14);
  assert.equal(brain.radius, 40);
  assert.equal(brain.countdown, 2.5);
  assert.deepEqual(brain.interval, [4, 5]);
  assert.ok(PATTERNS[brain.pattern] && PATTERNS[brain.punish]);
  const lines = [def.name, def.description, turnCallLine(7, 3), TURN_SERVED_LINE, TURN_LOST_LINE].join(' ');
  assert.ok(!/[!¡]/.test(lines));
  assert.equal(turnCallLine(87, 3), 'Turno 087, ventanilla 3');
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  for (const k of ['dispensador-turnos', 'tique-turno', 'circulo-turno']) assert.ok(sheets[k], `falta el sprite ${k}`);
  assert.equal(sheets['dispensador-turnos']!.frames, 8);
  assert.ok(DOWN_CAUSES['dispensador-turnos']?.bullet && DOWN_CAUSES['dispensador-turnos'].contact);
  // Only on floor 5, and one per room at most.
  assert.ok(!SLOT_ENEMIES_4.some((s) => s.ch === 'Ñ'));
  assert.equal(SLOT_ENEMIES_5.find((s) => s.ch === 'Ñ')?.max, 1);
  assert.equal(slotEnemiesOf(5), SLOT_ENEMIES_5);
  assert.equal(slotEnemiesOf(4), SLOT_ENEMIES_4);
  const tpl = templatesOf('combat', 5)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-ñ'), { depth: 3, pool: [{ ch: 'Ñ', cost: 1, weight: 1, max: 1 }] });
  const ws = createWorld({ seed: 'letra-ñ', template: filled });
  assert.equal(ws.enemies.filter((e) => e.def.id === 'dispensador-turnos').length, 1);
  // Never copied by a photocopier: two would call turns at once.
  const { d } = waiting('copia');
  assert.equal(copiable(d), false);
});

test('llama un turno a los 2–2,5 s y luego cada 4–5 s; nunca el 087 de su pantalla', () => {
  const { w, d } = waiting('llamadas');
  const calls: number[] = [];
  const nums: number[] = [];
  for (let i = 0; i < ticks(30); i++) {
    // Always served at once, so the calls come at their own pace.
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'turnCall') {
      calls.push(i * DT);
      nums.push(e.num);
      assert.ok(e.desk >= 1 && e.desk <= 9);
    }
    if (d.turn?.state === 'called' && d.turn.t > 0.2) {
      w.player.x = d.turn.x;
      w.player.y = d.turn.y;
    }
  }
  assert.ok(calls.length >= 6, `llamó ${calls.length} turnos`);
  assert.ok(calls[0]! >= brain.interval[0] * 0.5 - 0.05 && calls[0]! <= brain.interval[0] * 0.5 + 0.5, `el primero a los ${calls[0]!.toFixed(2)} s`);
  for (let k = 1; k < calls.length; k++) {
    const gap = calls[k]! - calls[k - 1]!;
    // From one call to the next: 4-5 s (served in time, the circle is gone well before).
    assert.ok(gap >= brain.interval[0] - 0.05 && gap <= brain.interval[1] + 0.1, `entre llamadas ${gap.toFixed(2)} s`);
  }
  assert.ok(!nums.includes(OWN_TURN));
});

test('el círculo: lejos de la tostadora, en el suelo, libre y al que se llega andando a tiempo', () => {
  for (let s = 0; s < 40; s++) {
    const w = createWorld({ seed: `sitio-${s}`, template: templatesOf('combat', 5)[s % templatesOf('combat', 5).length]!, noEnemies: true });
    w.noDamage = true;
    const d = spawnEnemy(w.nextId++, def, w.player.x - 120, w.player.y);
    w.enemies = [d];
    const at = turnSpot(w, d, brain);
    if (!at) continue;
    const p = w.player;
    const dist = Math.hypot(at.x - p.x, at.y - p.y);
    assert.ok(dist >= brain.near * 0.55 * 0.8 - 1 && dist <= brain.far + 1, `a ${dist.toFixed(0)} px`);
    assert.ok(isClear(w, at.x, at.y, p.def.footRadius), 'el centro está ocupado');
    assert.ok(Math.hypot(at.x - d.x, at.y - d.y) >= brain.radius + 12, 'encima del dispensador');
    const path = findPath(w, p, at, p.def.footRadius);
    let len = 0;
    let from = { x: p.x, y: p.y };
    for (const q of [...path, at]) {
      len += Math.hypot(q.x - from.x, q.y - from.y);
      from = q;
    }
    assert.ok(len <= p.def.speed * brain.countdown * 0.7 + 1, `${len.toFixed(0)} px de camino`);
  }
  // In an open room it always finds one, and well away from the toaster.
  let far = 0;
  for (let s = 0; s < 20; s++) {
    const { w, d } = waiting(`abierta-${s}`);
    const at = turnSpot(w, d, brain);
    assert.ok(at, 'sin sitio en una sala vacía');
    // (Up and down the floor counts a fifth less: it is seen in three-quarter view.)
    if (Math.hypot(at.x - w.player.x, (at.y - w.player.y) / 0.8) >= brain.near) far++;
  }
  assert.ok(far >= 18, `${far} de 20 lejos`);
});

test('llegar a tiempo: «Atendido», sin abanico, y el círculo para las balas enemigas un rato', () => {
  const { w, d } = waiting('atendido');
  untilCalled(w, d);
  const c = d.turn!;
  assert.equal(c.state, 'called');
  w.player.x = c.x;
  w.player.y = c.y;
  step(w, NO_INPUT);
  assert.equal(d.turn?.state, 'served');
  assert.ok(w.events.some((e) => e.type === 'turnServed'));
  // A bullet flying into the circle from outside is stopped at its edge.
  const b: Bullet = { id: w.nextId++, owner: 'enemy', x: c.x - c.r - 30, y: c.y, vx: 120, vy: 0, r: 3.5, life: 3, damage: 1, knockback: 0, color: 'red', age: 1, dir: 0, speed: 120, h: 0 };
  w.bullets = [b];
  w.emitters = [];
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  assert.ok(!w.bullets.includes(b), 'la bala ha cruzado el círculo');
  assert.ok(b.x <= c.x - c.r + 4, `paró en x=${b.x.toFixed(1)}`);
  // No fan: nothing came out of the dispenser for missing the turn.
  for (let i = 0; i < ticks(brain.served); i++) {
    step(w, NO_INPUT);
    assert.ok(!w.events.some((e) => e.type === 'turnLost'));
  }
  assert.equal(d.turn, undefined, 'el círculo sigue ahí');
  // Gone, it stops nothing.
  const b2: Bullet = { ...b, id: w.nextId++, x: c.x - c.r - 30, life: 3 };
  w.bullets = [b2];
  w.emitters = [];
  for (let i = 0; i < ticks(0.4); i++) step(w, NO_INPUT);
  assert.ok(b2.x > c.x - c.r + 10, 'para balas sin turno');
  // The toaster's own bullets go through the circle, always.
});

test('no llegar: «Turno perdido» a los 2,5 s, círculo rojo y un abanico ancho de tiques hacia la tostadora', () => {
  const { w, d } = waiting('perdido');
  untilCalled(w, d);
  const called = w.tick;
  w.bullets = [];
  let lostAt = -1;
  for (let i = 0; i < ticks(brain.countdown + 1.5); i++) {
    holdStill(w);
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'turnLost')) lostAt = w.tick;
    if (lostAt > 0) break;
  }
  assert.ok(lostAt > 0, 'no lo ha dado por perdido');
  assert.ok(Math.abs((lostAt - called) * DT - brain.countdown) < 0.05, `perdido a los ${((lostAt - called) * DT).toFixed(2)} s`);
  assert.equal(d.turn?.state, 'lost');
  // It warns, then spits the fan: a lot of tickets, wide, at the toaster.
  assert.ok(activeWarnings(w).some((wn) => wn.source === d.id && wn.bullets));
  assert.equal(enemyFrame(d, 0), 7, 'escupiendo');
  for (let i = 0; i < ticks(brain.telegraph + 0.3); i++) step(w, NO_INPUT);
  const fan = w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'ticket');
  assert.ok(fan.length >= 15, `${fan.length} tiques`);
  const toP = Math.atan2(w.player.y - d.y, w.player.x - d.x);
  const angles = fan.map((b) => Math.atan2(b.vy, b.vx) - toP);
  const spread = (Math.max(...angles) - Math.min(...angles)) * (180 / Math.PI);
  assert.ok(spread >= 95, `abanico de ${spread.toFixed(0)}°`);
  // The red circle stops nothing.
  assert.ok(fan.every((b) => b.life > 0));
});

test('sin turno: tiques sueltos que planean despacio; con turno, no', () => {
  const { w, d } = waiting('sueltos', 120);
  const shots: Array<{ t: number; turn: boolean }> = [];
  const seen = new Set<number>();
  for (let i = 0; i < ticks(20); i++) {
    step(w, NO_INPUT);
    // Served at once, always.
    if (d.turn?.state === 'called') {
      w.player.x = d.turn.x;
      w.player.y = d.turn.y;
    }
    for (const b of w.bullets) {
      if (b.owner !== 'enemy' || seen.has(b.id)) continue;
      seen.add(b.id);
      shots.push({ t: i * DT, turn: !!d.turn });
      assert.equal(b.color, 'ticket');
      assert.ok(b.speed < 70, `a ${b.speed} px/s`);
      assert.ok(b.wave, 'no planea');
    }
  }
  assert.ok(shots.length >= 6, `${shots.length} tiques sueltos`);
  assert.ok(shots.every((s) => !s.turn), 'suelta tiques con un turno llamado');
});

test('llamando, no avisa con anillo (el aviso es el círculo); muerto, su círculo se va y no castiga', () => {
  const { w, d } = waiting('muerto');
  untilCalled(w, d);
  assert.equal(d.state, 'warn');
  assert.ok(!activeWarnings(w).some((wn) => wn.source === d.id));
  assert.equal(enemyFrame(d, 0), 6, 'llamando');
  d.damageTaken = d.def.hp + 50;
  for (let i = 0; i < ticks(brain.countdown + 1); i++) {
    step(w, NO_INPUT);
    assert.ok(!w.events.some((e) => e.type === 'turnLost'));
  }
  assert.ok(!w.bullets.some((b) => b.owner === 'enemy'));
});

test('guarda las distancias: se acerca de lejos y se aparta de cerca, despacio', () => {
  const far = waiting('lejos', 230);
  const x0 = far.d.x;
  for (let i = 0; i < ticks(2); i++) step(far.w, NO_INPUT);
  assert.ok(far.d.x > x0 + 20, 'no se acerca');
  assert.ok(far.d.x < x0 + brain.speed * 2 + 2, 'demasiado deprisa');
  const near = waiting('cerca', 60);
  const d0 = Math.hypot(near.d.x - near.w.player.x, near.d.y - near.w.player.y);
  for (let i = 0; i < ticks(1.5); i++) step(near.w, NO_INPUT);
  assert.ok(Math.hypot(near.d.x - near.w.player.x, near.d.y - near.w.player.y) > d0 + 10, 'no se aparta');
});

test('el bot va al círculo cuando llaman su turno', async () => {
  const { Bot } = await import('../src/sim/bot.ts');
  let served = 0;
  let lost = 0;
  for (let s = 0; s < 6; s++) {
    const { w, d } = waiting(`bot-${s}`);
    const bot = new Bot(`bot-${s}`);
    for (let i = 0; i < ticks(14); i++) {
      step(w, bot.think(w));
      for (const e of w.events) {
        if (e.type === 'turnServed') served++;
        if (e.type === 'turnLost') lost++;
      }
      if (d.damageTaken > 0) d.damageTaken = 0;
    }
  }
  assert.ok(served >= lost * 3, `atendidos ${served}, perdidos ${lost}`);
});
