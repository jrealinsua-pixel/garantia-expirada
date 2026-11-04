// El Robot de Cuerda (M10 4a, planta 3): runs in a straight line and bounces like a billiard ball,
// a fan of nuts at you on each bounce, until it runs down (stopped, taking double) and winds
// itself up again.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_2, SLOT_ENEMIES_3, slotEnemiesOf } from '../src/data/rooms.ts';
import { DOWN_CAUSES, WIND_DOWN_LINE } from '../src/data/texts.ts';
import type { WindupBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { isRunDown, slanted } from '../src/sim/enemies.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, takenScale, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['robot-cuerda']!;
const brain = def.brain as WindupBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function playroom(seed = 'robot'): { w: World; en: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  const en = spawnEnemy(w.nextId++, def, w.room.w / 2, w.room.h / 2);
  w.enemies = [en];
  w.player.x = 60;
  w.player.y = w.room.h / 2;
  return { w, en };
}

/** Steps until `en` is in `state` (or `s` seconds go by). */
function until(w: World, en: Enemy, state: Enemy['state'], s = 8): void {
  for (let i = 0; i < ticks(s) && en.state !== state; i++) step(w, NO_INPUT);
}

test('el robot de cuerda es contenido: datos, sprites, tuercas, causa de baja y solo desde la planta 3', () => {
  assert.equal(def.name, 'Robot de Cuerda');
  assert.equal(def.hp, 14);
  assert.ok(!/[!¡]/.test(def.name + def.description + WIND_DOWN_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  assert.ok(sheets['robot-cuerda'], 'falta el sprite');
  assert.ok(sheets['bala-tuerca'], 'falta la tuerca');
  assert.ok(DOWN_CAUSES['robot-cuerda']?.bullet && DOWN_CAUSES['robot-cuerda'].contact);
  assert.ok(!SLOT_ENEMIES_2.some((s) => s.ch === 'Q'));
  assert.ok(SLOT_ENEMIES_3.some((s) => s.ch === 'Q'));
  assert.equal(slotEnemiesOf(3), SLOT_ENEMIES_3);
  assert.equal(slotEnemiesOf(2), SLOT_ENEMIES_2);
});

test('nunca va recto por un eje: así no rebota siempre en la misma línea', () => {
  for (const [x, y] of [[1, 0], [0, -1], [0.99, 0.05], [-0.1, 1], [0.6, 0.8], [0, 0]] as const) {
    const d = slanted(x, y, brain.minSlant);
    assert.ok(Math.abs(Math.hypot(d.x, d.y) - 1) < 1e-9);
    assert.ok(Math.abs(d.x) >= brain.minSlant - 1e-9 && Math.abs(d.y) >= brain.minSlant - 1e-9, `${x},${y} → ${d.x},${d.y}`);
    if (x !== 0) assert.equal(Math.sign(d.x), Math.sign(x));
    if (y !== 0) assert.equal(Math.sign(d.y), Math.sign(y));
  }
});

test('entra dándose cuerda y sale disparado hacia la tostadora, en línea recta y deprisa', () => {
  const { w, en } = playroom();
  assert.equal(en.state, 'jam', 'empieza dándose cuerda');
  assert.equal(enemyFrame(en, 0), def.anim!.jam![0]);
  let wound = false;
  for (let i = 0; i < ticks(brain.windup + 0.05); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'windGo' && e.source === en.id)) wound = true;
  }
  assert.ok(wound && (en.state as string) === 'charge');
  // Towards the toaster (it is to the left), give or take its jitter.
  const aim = Math.atan2(w.player.y - en.y, w.player.x - en.x);
  const went = Math.atan2(en.dirY, en.dirX);
  const off = Math.abs(Math.atan2(Math.sin(went - aim), Math.cos(went - aim)));
  assert.ok(off <= (brain.aimJitterDeg * Math.PI) / 180 + 0.5, `se va hacia la tostadora: ${off.toFixed(2)} rad`);
  const x0 = en.x;
  const y0 = en.y;
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT);
  const moved = Math.hypot(en.x - x0, en.y - y0);
  assert.ok(Math.abs(moved - brain.speed * 0.3) < 4 || w.events.some((e) => e.type === 'windBounce'), `corre a ${brain.speed} px/s: ${moved}`);
});

test('rebota en las paredes como una bola de billar y en cada rebote suelta tres tuercas', () => {
  const { w, en } = playroom('billar');
  until(w, en, 'charge');
  // Straight at the right wall, a little downwards.
  en.dirX = slanted(1, 0.2, brain.minSlant).x;
  en.dirY = slanted(1, 0.2, brain.minSlant).y;
  en.until = 99;
  w.player.x = 60;
  let bounce = -1;
  let nuts = 0;
  for (let i = 0; i < ticks(6) && bounce < 0; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'windBounce')) bounce = i;
  }
  // The nuts come out of the emitter on the next tick.
  step(w, NO_INPUT);
  nuts = w.bullets.filter((b) => b.owner === 'enemy').length;
  assert.ok(bounce >= 0, 'llega a la pared y rebota');
  assert.ok(en.dirX < 0, 'vuelve por donde iba');
  assert.ok(en.dirY > 0, 'y sigue bajando: solo cambia lo que choca');
  assert.equal(nuts, 3, 'abanico de tres tuercas');
  assert.ok(w.bullets.every((b) => b.color === 'nut' && b.by === 'robot-cuerda'));
  // Aimed at the toaster: the middle nut goes towards it.
  const mid = w.bullets.map((b) => Math.atan2(b.vy, b.vx)).sort((a, b) => a - b)[1]!;
  const aim = Math.atan2(w.player.y - en.y, w.player.x - en.x);
  assert.ok(Math.abs(Math.atan2(Math.sin(mid - aim), Math.cos(mid - aim))) < 0.25, 'apuntadas a la tostadora');
});

test('en una esquina no suelta dos abanicos a la vez', () => {
  const { w, en } = playroom('esquina');
  until(w, en, 'charge');
  en.until = 99;
  const d = slanted(1, 1, brain.minSlant);
  en.dirX = d.x;
  en.dirY = d.y;
  // Right into the bottom right corner.
  en.x = w.room.w - 40;
  en.y = w.room.h - 40;
  w.player.x = 60;
  w.player.y = 60;
  let volleys = 0;
  let bounces = 0;
  for (let i = 0; i < ticks(brain.bounceGap * 0.9); i++) {
    const before = w.bullets.length;
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'windBounce')) bounces++;
    if (w.bullets.length > before) volleys++;
  }
  assert.ok(bounces >= 1, `rebota en la esquina (${bounces})`);
  assert.ok(volleys <= 1, `como mucho un abanico en ${brain.bounceGap} s: ${volleys}`);
});

test('a los 4–5 s se le acaba la cuerda: se para en seco, recibe el doble y luego se da cuerda solo', () => {
  const { w, en } = playroom('agotado');
  until(w, en, 'charge');
  let ran = 0;
  let down = false;
  for (let i = 0; i < ticks(brain.run[1] + 0.2) && en.state === 'charge'; i++) {
    step(w, NO_INPUT);
    ran += DT;
    if (w.events.some((e) => e.type === 'windDown' && e.source === en.id)) down = true;
  }
  assert.ok(down && en.state === 'stun', 'cuerda agotada');
  assert.ok(ran >= brain.run[0] - 0.05 && ran <= brain.run[1] + 0.05, `corre ${ran.toFixed(2)} s`);
  assert.equal(enemyFrame(en, 0), def.anim!.stun, 'con la llave quieta');
  assert.ok(isRunDown(en));
  assert.equal(takenScale(en), brain.exposed);
  // Stopped dead: it does not move (with no bullets pushing it).
  const x0 = en.x;
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  assert.ok(Math.abs(en.x - x0) < 0.01);
  // A shot at it takes double now.
  w.player.x = en.x + (en.x < w.room.w / 2 ? 40 : -40);
  w.player.y = en.y;
  const hp0 = en.damageTaken;
  let hitDamage = 0;
  const shot = w.player.weapon.def.damage;
  for (let i = 0; i < ticks(0.6) && hitDamage === 0; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 12 });
    for (const e of w.events) if (e.type === 'hit' && e.target === en.id) hitDamage = e.damage;
  }
  assert.ok(hitDamage > 0 && shot > 0, 'le da');
  assert.ok(Math.abs(hitDamage - brain.exposed * shot) < 1e-9, `daño doble: ${shot} → ${hitDamage}`);
  assert.ok(Math.abs(en.damageTaken - hp0 - hitDamage) < 1e-9);
  // Then it winds itself up (with its warning) and sets off again; while wound, normal damage.
  let warned = false;
  for (let i = 0; i < ticks(brain.rundown + 0.2) && (en.state as string) !== 'charge'; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'windUp' && e.source === en.id)) warned = true;
  }
  assert.ok(warned, 'avisa con el ruido de la llave');
  assert.equal(en.state, 'charge', 'y vuelve a correr');
  assert.equal(takenScale(en), 1);
});

test('en las salas de verdad no se atasca ni se mete en la pared, y es determinista', () => {
  const run = (seed: string): { hash: string; moved: number; bounces: number; stuck: number } => {
    const w = createWorld({ seed, noEnemies: true, room: 'sala-pruebas' });
    w.noDamage = true;
    const en = spawnEnemy(w.nextId++, def, w.room.w / 2, w.room.h / 2 - 20);
    w.enemies = [en];
    let bounces = 0;
    let stuck = 0;
    let last = { x: en.x, y: en.y };
    for (let i = 0; i < ticks(30); i++) {
      step(w, { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
      if (w.events.some((e) => e.type === 'windBounce')) bounces++;
      assert.ok(!isWallAt(w.room, en.x, en.y), 'nunca dentro de la pared');
      if (i % 30 === 0) {
        if (en.state === 'charge' && en.t > 0.5 && Math.hypot(en.x - last.x, en.y - last.y) < 5) {
          stuck++;
        }
        last = { x: en.x, y: en.y };
      }
    }
    return { hash: worldHash(w), moved: en.moved, bounces, stuck };
  };
  const a = run('juguete');
  assert.deepEqual(a, run('juguete'));
  assert.ok(a.bounces >= 5, `rebota: ${a.bounces}`);
  assert.ok(a.moved > 30 * brain.speed * 0.5, `anda: ${a.moved.toFixed(0)} px`);
  assert.equal(a.stuck, 0, 'nunca se queda clavado corriendo');
});
