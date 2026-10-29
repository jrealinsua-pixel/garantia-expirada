// El Ratón Inalámbrico sin Pilas (M8, planta 2): walks, freezes without signal and turns up
// somewhere else with a click.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_1, SLOT_ENEMIES_2 } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import type { LaggerBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { activeWarnings, createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type World } from '../src/sim/world.ts';

const def = ENEMIES['raton-inalambrico']!;
const brain = def.brain as LaggerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function desk(seed = 'raton', px = 120): World {
  const w = createWorld({ seed, noEnemies: true, level: 2 });
  w.noDamage = true;
  w.room.props = [];
  w.enemies = [spawnEnemy(w.nextId++, def, 330, 200)];
  w.player.x = px;
  w.player.y = 200;
  return w;
}

test('el ratón es contenido: datos, sprite de 7 fotogramas, causa de baja y solo en la planta 2', () => {
  assert.equal(def.name, 'Ratón Inalámbrico sin Pilas');
  assert.ok(!/[!¡]/.test(def.name + def.description));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.ok(sheets['raton-inalambrico'], 'falta el sprite');
  assert.ok(DOWN_CAUSES['raton-inalambrico']?.bullet);
  assert.ok(!SLOT_ENEMIES_1.some((s) => s.ch === 'R'));
  assert.ok(SLOT_ENEMIES_2.some((s) => s.ch === 'R'));
});

test('anda hacia ti, se congela marcando dónde va a aparecer, aparece allí y hace clic en corro', () => {
  const w = desk();
  const en = w.enemies[0]!;
  const x0 = en.x;
  for (let i = 0; i < ticks(3) && en.state !== 'warn'; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'warn', 'se congela');
  assert.ok(en.x < x0 - 20, 'antes ha andado hacia la tostadora');
  assert.equal(enemyFrame(en, 500), def.anim!.warn, 'congelado, con el círculo de carga');
  const dest = { ...en.dest! };
  const from = { x: en.x, y: en.y };
  assert.ok(Math.hypot(dest.x - from.x, dest.y - from.y) <= brain.jump + 4, 'salta como mucho lo suyo');
  assert.ok(Math.hypot(dest.x - w.player.x, dest.y - w.player.y) >= brain.keep * 0.75, 'nunca encima de la tostadora');
  // The spot is marked with a closing ring while it is frozen.
  const wn = activeWarnings(w).find((x) => x.source === en.id);
  assert.ok(wn && wn.bullets);
  assert.ok(Math.abs(wn.x - dest.x) < 1e-9);
  // Frozen: it does not move.
  for (let i = 0; i < ticks(brain.freeze) - 3; i++) step(w, NO_INPUT);
  assert.ok(Math.hypot(en.x - from.x, en.y - from.y) < 2);
  let jumped = false;
  const ids = new Set<number>();
  for (let i = 0; i < ticks(0.6); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'lagJump' && e.source === en.id)) jumped = true;
    for (const b of w.bullets) if (b.owner === 'enemy') ids.add(b.id);
  }
  assert.ok(jumped);
  assert.ok(Math.hypot(en.x - dest.x, en.y - dest.y) < 3, 'está donde marcaba');
  assert.equal(ids.size, 16, 'dos anillos de ocho');
});

test('si está ya muy cerca, salta de lado en vez de encima', () => {
  const w = desk('cerca', 300);
  const en = w.enemies[0]!;
  for (let i = 0; i < ticks(3) && en.state !== 'warn'; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'warn');
  assert.ok(Math.hypot(en.dest!.x - w.player.x, en.dest!.y - w.player.y) >= brain.keep * 0.75);
});

test('el ratón es determinista y sale en la planta 2', () => {
  const run = (): string => {
    const w = desk('det');
    for (let i = 0; i < ticks(10); i++) step(w, { ...NO_INPUT, moveY: i % 120 < 60 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
  let n = 0;
  for (let i = 0; i < 10; i++) {
    const f2 = createWorld({ seed: `rat-${i}`, floor: true, level: 2 }).floor!;
    for (const st of f2.rooms) n += st.template.rows.join('').split('R').length - 1;
  }
  assert.ok(n >= 3, `ratones en 10 plantas 2: ${n}`);
});
