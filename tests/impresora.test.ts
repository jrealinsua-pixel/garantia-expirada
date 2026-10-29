// La Impresora que se Atasca (M8, planta 2): prints invoices at you and jams every few volleys.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_1, SLOT_ENEMIES_2 } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import type { TurretBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type World } from '../src/sim/world.ts';

const def = ENEMIES.impresora!;
const brain = def.brain as TurretBrain;

/** The test room with just a printer at (300, 200) and the toaster in range, unhurt. */
function office(seed = 'impresora'): World {
  const w = createWorld({ seed, noEnemies: true, level: 2 });
  w.noDamage = true;
  w.room.props = [];
  w.enemies = [spawnEnemy(w.nextId++, def, 300, 200)];
  w.player.x = 170;
  w.player.y = 200;
  return w;
}

test('la impresora es contenido: datos, sprite de 8 fotogramas, causa de baja y solo en la planta 2', () => {
  assert.equal(def.name, 'Impresora que se Atasca');
  assert.ok(!/[!¡]/.test(def.name + def.description));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number; frameWidth?: number }>;
  assert.ok(sheets.impresora, 'falta el sprite');
  assert.ok(sheets['bala-factura'], 'falta la factura');
  assert.ok(DOWN_CAUSES.impresora?.bullet && DOWN_CAUSES.impresora.contact);
  assert.ok(brain.jam);
  assert.ok(!SLOT_ENEMIES_1.some((s) => s.ch === 'I'), 'no sale en la planta 1');
  assert.ok(SLOT_ENEMIES_2.some((s) => s.ch === 'I'));
});

test('dispara facturas, y cada dos o tres ráfagas se atasca: quieta y sin disparar, y luego lo suelta todo', () => {
  const w = office();
  const en = w.enemies[0]!;
  const jam = brain.jam!;
  let volleys = 0;
  let jams = 0;
  let jamTicks = 0;
  let firedWhileJammed = false;
  const volleysBeforeJam: number[] = [];
  let since = 0;
  let prev = en.state;
  for (let i = 0; i < Math.ceil(30 / DT); i++) {
    const before = w.bullets.filter((b) => b.owner === 'enemy').length;
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'telegraph' && e.source === en.id) && prev !== 'jam') {
      volleys++;
      since++;
    }
    if (w.events.some((e) => e.type === 'jam' && e.source === en.id)) {
      jams++;
      volleysBeforeJam.push(since);
      since = 0;
    }
    if (en.state === 'jam') {
      jamTicks++;
      assert.equal(Math.hypot(en.vx, en.vy), 0, 'atascada no anda');
      // (The tick it jams, the last invoice of the volley may still come out.)
      if (en.t > 0 && w.bullets.filter((b) => b.owner === 'enemy').length > before) firedWhileJammed = true;
    }
    prev = en.state;
  }
  assert.ok(volleys >= 6, `ráfagas: ${volleys}`);
  assert.ok(jams >= 2, `atascos: ${jams}`);
  assert.ok(volleysBeforeJam.every((n) => n >= jam.after[0] && n <= jam.after[1]), `ráfagas antes de cada atasco: ${volleysBeforeJam}`);
  assert.ok(!firedWhileJammed, 'atascada no dispara');
  assert.ok(Math.abs(jamTicks / jams - jam.time / DT) <= 2, 'cada atasco dura lo que dice');
});

test('al desatascarse avisa y suelta dos anillos', () => {
  const w = office('desatasco');
  const en = w.enemies[0]!;
  for (let i = 0; i < Math.ceil(20 / DT) && en.state !== 'jam'; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'jam');
  w.bullets = [];
  for (let i = 0; i < Math.ceil(brain.jam!.time / DT) + 2; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'fire', 'tras el atasco, dispara');
  const ids = new Set<number>();
  for (let i = 0; i < Math.ceil(1.2 / DT); i++) {
    step(w, NO_INPUT);
    for (const b of w.bullets) if (b.owner === 'enemy') ids.add(b.id);
  }
  assert.equal(ids.size, 24, 'dos anillos de doce');
});

test('atascada tiembla en sus fotogramas de atasco; la simulación sigue siendo determinista', () => {
  const w = office('fotogramas');
  const en = w.enemies[0]!;
  for (let i = 0; i < Math.ceil(20 / DT) && en.state !== 'jam'; i++) step(w, NO_INPUT);
  const frames = new Set([0, 60, 120, 180].map((ms) => enemyFrame(en, ms)));
  assert.deepEqual([...frames].sort(), [6, 7]);
  const run = (): string => {
    const v = office('det');
    for (let i = 0; i < Math.ceil(12 / DT); i++) step(v, { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
    return worldHash(v);
  };
  assert.equal(run(), run());
});

test('en la planta 2 salen impresoras; en la 1, ninguna', () => {
  let p2 = 0;
  for (let i = 0; i < 10; i++) {
    const f1 = createWorld({ seed: `imp-${i}`, floor: true }).floor!;
    const f2 = createWorld({ seed: `imp-${i}`, floor: true, level: 2 }).floor!;
    for (const st of f1.rooms) assert.ok(!st.template.rows.some((r) => r.includes('I')), 'impresora en la planta 1');
    for (const st of f2.rooms) p2 += st.template.rows.join('').split('I').length - 1;
  }
  assert.ok(p2 >= 5, `impresoras en 10 plantas 2: ${p2}`);
});
