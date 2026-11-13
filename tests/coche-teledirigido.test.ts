// El Coche Teledirigido (M10 4b, planta 3): circles the toaster in drifting arcs, rams it when it
// has it to its side, overturns against walls and stalls now and then (batteries not included).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import { SLOT_ENEMIES_2, SLOT_ENEMIES_3 } from '../src/data/rooms.ts';
import { DOWN_CAUSES, STALL_LINE } from '../src/data/texts.ts';
import type { RcCarBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['coche-teledirigido']!;
const brain = def.brain as RcCarBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function track(seed = 'coche'): { w: World; en: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const en = spawnEnemy(w.nextId++, def, w.player.x + 100, w.player.y);
  w.enemies = [en];
  return { w, en };
}

test('el coche teledirigido es contenido: datos, sprite, causa de baja y solo desde la planta 3', () => {
  assert.equal(def.name, 'Coche Teledirigido');
  assert.equal(def.hp, 4);
  assert.ok(!/[!¡]/.test(def.name + def.description + STALL_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.ok(sheets['coche-teledirigido'], 'falta el sprite');
  assert.ok(DOWN_CAUSES['coche-teledirigido']?.contact);
  assert.ok(!SLOT_ENEMIES_2.some((s) => s.ch === 'V'));
  assert.ok(SLOT_ENEMIES_3.some((s) => s.ch === 'V'));
});

test('da vueltas alrededor de la tostadora, deprisa y en arcos', () => {
  const { w, en } = track();
  en.stallT = 99;
  en.until = 99; // no ramming: just circling
  let swept = 0;
  let last = Math.atan2(en.y - w.player.y, en.x - w.player.x);
  let far = 0;
  let near = Infinity;
  for (let i = 0; i < ticks(5); i++) {
    step(w, NO_INPUT);
    const a = Math.atan2(en.y - w.player.y, en.x - w.player.x);
    swept += Math.atan2(Math.sin(a - last), Math.cos(a - last));
    last = a;
    if (i > ticks(1)) {
      const d = Math.hypot(en.x - w.player.x, en.y - w.player.y);
      far = Math.max(far, d);
      near = Math.min(near, d);
    }
  }
  assert.ok(Math.abs(swept) > 2 * Math.PI, `da al menos una vuelta en 5 s: ${(swept / (2 * Math.PI)).toFixed(2)}`);
  assert.ok(near > 40 && far < 170, `a su distancia: ${near.toFixed(0)}–${far.toFixed(0)} px`);
  assert.ok(Math.hypot(en.vx, en.vy) > brain.speed * 0.9, 'a toda velocidad');
});

test('cuando la tiene de lado, frena, apunta y embiste en línea recta', () => {
  const { w, en } = track('embiste');
  en.stallT = 99;
  let warnAt = -1;
  for (let i = 0; i < ticks(6) && warnAt < 0; i++) {
    step(w, NO_INPUT);
    if (en.state === 'warn') warnAt = i;
  }
  assert.ok(warnAt >= 0, 'se prepara');
  const tg = w.events.find((e) => e.type === 'telegraph' && e.source === en.id);
  assert.ok(tg && tg.type === 'telegraph' && tg.aimed, 'con su línea de aviso');
  assert.equal(enemyFrame(en, 0), def.anim!.warn);
  const aim = Math.atan2(en.dirY, en.dirX);
  const to = Math.atan2(w.player.y - en.y, w.player.x - en.x);
  assert.ok(Math.abs(Math.atan2(Math.sin(aim - to), Math.cos(aim - to))) < 0.05, 'apunta a la tostadora');
  for (let i = 0; i < ticks(brain.telegraph + 0.05); i++) step(w, NO_INPUT);
  assert.equal(en.state, 'charge');
  assert.ok(Math.abs(Math.hypot(en.vx, en.vy) - brain.ramSpeed) < 1, 'embiste deprisa');
  assert.ok(Math.abs(Math.atan2(en.vy, en.vx) - aim) < 1e-9, 'en línea recta, por donde avisó');
});

test('si embiste contra una caja vuelca con las ruedas al aire y luego se endereza', () => {
  const { w, en } = track('vuelca');
  en.stallT = 99;
  // A box right between them: ramming the toaster means ramming the box.
  const x = w.player.x + 50;
  w.room.props.push({ def: PROPS.caja!, x, y: w.player.y + 12, box: { x: x - 10, y: w.player.y - 30, w: 20, h: 60 } });
  en.x = w.player.x + 100;
  en.y = w.player.y;
  en.state = 'warn';
  en.t = 0;
  en.until = 0.01;
  en.dirX = -1;
  en.dirY = 0;
  let flipped = false;
  for (let i = 0; i < ticks(1) && !flipped; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'carFlip' && e.source === en.id)) flipped = true;
  }
  assert.ok(flipped && (en.state as string) === 'stun', 'vuelca');
  assert.equal(enemyFrame(en, 0), def.anim!.stun, 'ruedas al aire');
  let righted = false;
  for (let i = 0; i < ticks(brain.flip + 0.1); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'carRight' && e.source === en.id)) righted = true;
    if (!righted) assert.ok(Math.hypot(en.vx, en.vy) < 60, 'volcado no anda');
  }
  assert.ok(righted && (en.state as string) === 'walk', 'y se endereza');
});

test('pilas no incluidas: de vez en cuando se para a mitad de un arco, parpadea y sigue', () => {
  const { w, en } = track('pilas');
  en.until = 99;
  let stalls = 0;
  let off = 0;
  let offFrames = 0;
  for (let i = 0; i < ticks(20); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'carStall' && e.source === en.id)) stalls++;
    if (en.state === 'off') {
      off += DT;
      if (enemyFrame(en, i * DT * 1000) === def.anim!.off) offFrames++;
    }
  }
  assert.ok(stalls >= 3 && stalls <= 6, `se para entre 3 y 6 veces en 20 s: ${stalls}`);
  assert.ok(Math.abs(off - stalls * brain.stall.time) < 0.2, 'cada vez un rato');
  assert.ok(offFrames > 0, 'parpadea');
});

test('en las salas de verdad no se mete en la pared ni se queda clavado, y es determinista', () => {
  const run = (seed: string): { hash: string; rams: number; moved: number } => {
    const w = createWorld({ seed, noEnemies: true, room: 'sala-pruebas' });
    w.noDamage = true;
    const en = spawnEnemy(w.nextId++, def, w.room.w / 2 + 60, w.room.h / 2 - 30);
    w.enemies = [en];
    let rams = 0;
    for (let i = 0; i < ticks(30); i++) {
      step(w, { ...NO_INPUT, moveX: i % 240 < 120 ? 1 : -1, moveY: i % 90 < 45 ? 0.5 : -0.5 });
      if (w.events.some((e) => e.type === 'charge' && e.source === en.id)) rams++;
      assert.ok(!isWallAt(w.room, en.x, en.y), 'nunca dentro de la pared');
    }
    return { hash: worldHash(w), rams, moved: en.moved };
  };
  const a = run('circuito');
  assert.deepEqual(a, run('circuito'));
  assert.ok(a.rams >= 4, `embiste a menudo: ${a.rams} veces en 30 s`);
  assert.ok(a.moved > 30 * brain.speed * 0.4, `anda: ${a.moved.toFixed(0)} px`);
});
