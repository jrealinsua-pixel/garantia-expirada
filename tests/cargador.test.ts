// El Cargador Falso (M8, planta 2): lies on the floor as bait, jumps up and gives you a shock.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_1, SLOT_ENEMIES_2 } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import type { MimicBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type World } from '../src/sim/world.ts';

const def = ENEMIES.cargador!;
const brain = def.brain as MimicBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/**
 * The test room with a fake charger at (300, 200) and the toaster `dx` px to its left. With
 * `company`, a microwave far off keeps it from being the last one pretending.
 */
function bait(dx: number, seed = 'cargador', company = true): World {
  const w = createWorld({ seed, noEnemies: true, level: 2 });
  w.room.props = [];
  w.enemies = [spawnEnemy(w.nextId++, def, 300, 200)];
  if (company) w.enemies.push(spawnEnemy(w.nextId++, ENEMIES.microondas!, 60, 60));
  w.player.x = 300 - dx;
  w.player.y = 200;
  return w;
}

test('el cargador es contenido: datos, sprite de 8 fotogramas, causa de baja, en pareja y solo en la planta 2', () => {
  assert.equal(def.name, 'Cargador Falso');
  assert.ok(!/[!¡]/.test(def.name + def.description));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, unknown>;
  assert.ok(sheets.cargador, 'falta el sprite');
  assert.ok(DOWN_CAUSES.cargador?.bullet && DOWN_CAUSES.cargador.contact);
  assert.equal(def.pack, 2);
  assert.ok(!SLOT_ENEMIES_1.some((s) => s.ch === 'F'));
  assert.ok(SLOT_ENEMIES_2.some((s) => s.ch === 'F'));
});

test('mientras nadie se acerca es un cargador tirado en el suelo: no se mueve, no ataca y se dibuja como cebo', () => {
  const w = bait(200);
  const en = w.enemies[0]!;
  w.noDamage = true;
  for (let i = 0; i < ticks(brain.patience[0] - 0.5); i++) {
    step(w, NO_INPUT);
    assert.ok(!w.events.some((e) => 'source' in e && e.source === en.id), 'no hace nada');
  }
  assert.equal(en.state, 'lurk');
  assert.deepEqual([en.x, en.y], [300, 200]);
  assert.ok(!w.bullets.some((b) => b.color === 'cyan'), 'ni un calambre');
  assert.equal(enemyFrame(en, 1234), def.anim!.lurk);
});

test('si te acercas salta («No homologado»), corre hacia ti y da un calambre en corro que dura poco', () => {
  const w = bait(brain.wake - 4, 'cargador', false);
  w.noDamage = true;
  const en = w.enemies[0]!;
  step(w, NO_INPUT);
  assert.ok(w.events.some((e) => e.type === 'reveal' && e.source === en.id), 'salta');
  assert.equal(en.state, 'reveal');
  assert.equal(enemyFrame(en, 0), def.anim!.reveal);
  // Step back a little: it comes after you.
  w.player.x = 300 - 120;
  for (let i = 0; i < ticks(brain.reveal) + 2; i++) step(w, NO_INPUT);
  const x0 = en.x;
  for (let i = 0; i < ticks(0.4); i++) step(w, NO_INPUT);
  assert.ok(en.x < x0 - 15, `va a por la tostadora (${x0} → ${en.x})`);
  // Close enough: it warns and lets go its shock.
  let tel = false;
  const ids = new Set<number>();
  for (let i = 0; i < ticks(4); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'telegraph' && e.source === en.id)) tel = true;
    for (const b of w.bullets) if (b.owner === 'enemy') ids.add(b.id);
    if (ids.size >= 20) break;
  }
  assert.ok(tel, 'avisa antes');
  assert.ok(ids.size >= 20, `chispas: ${ids.size}`);
  assert.ok(w.bullets.every((b) => b.owner !== 'enemy' || b.color === 'cyan'));
  // They die out within half a second: it is a close-range shock.
  w.enemies = [];
  for (let i = 0; i < ticks(0.6); i++) step(w, NO_INPUT);
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0);
});

test('si le disparas desde lejos también se descubre', () => {
  const w = bait(160);
  const en = w.enemies[0]!;
  en.damageTaken = 1;
  step(w, NO_INPUT);
  assert.equal(en.state, 'reveal');
});

test('se cansa de esperar: como mucho a los pocos segundos salta aunque nadie se acerque', () => {
  const w = bait(200);
  w.noDamage = true;
  const en = w.enemies[0]!;
  let at = -1;
  for (let i = 0; i < ticks(brain.patience[1] + 0.5) && at < 0; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'reveal' && e.source === en.id)) at = i * DT;
  }
  assert.ok(at >= brain.patience[0] - 0.1 && at <= brain.patience[1] + 0.1, `salta a los ${at.toFixed(2)} s`);
  // Each one has its own patience: a pack does not jump up all at once.
  const times = new Set<string>();
  for (let k = 0; k < 6; k++) {
    const v = bait(200, `paciencia-${k}`);
    v.noDamage = true;
    const c = v.enemies[0]!;
    let i = 0;
    for (; i < ticks(brain.patience[1] + 0.5) && c.state === 'lurk'; i++) step(v, NO_INPUT);
    times.add(String(i));
  }
  assert.ok(times.size >= 3, `tiempos distintos: ${[...times].join(', ')}`);
});

test('si en la sala solo quedan cebos (los demás han caído) saltan enseguida', () => {
  const w = bait(200, 'solo');
  w.noDamage = true;
  const en = w.enemies[0]!;
  const twin = spawnEnemy(w.nextId++, def, 420, 260);
  w.enemies.push(twin);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.equal(en.state, 'lurk', 'con el microondas en pie sigue tirado');
  // The microwave goes down: the two chargers are the only ones left, both pretending.
  w.enemies = w.enemies.filter((e) => e.def.id !== 'microondas');
  for (let i = 0; i < ticks(brain.alone) + 5; i++) step(w, NO_INPUT);
  assert.notEqual(en.state, 'lurk');
  assert.notEqual(twin.state, 'lurk');
  // A room that is only bait gives itself away just as soon.
  const v = bait(200, 'solo-2', false);
  for (let i = 0; i < ticks(brain.alone) + 5; i++) step(v, NO_INPUT);
  assert.notEqual(v.enemies[0]!.state, 'lurk');
  assert.ok(brain.alone < brain.patience[0]);
});

test('el cargador es determinista y sale en la planta 2', () => {
  const run = (): string => {
    const w = bait(150, 'det');
    for (let i = 0; i < ticks(8); i++) step(w, { ...NO_INPUT, moveX: i % 120 < 60 ? 1 : -1 });
    return worldHash(w);
  };
  assert.equal(run(), run());
  let n = 0;
  for (let i = 0; i < 10; i++) {
    const f2 = createWorld({ seed: `carg-${i}`, floor: true, level: 2 }).floor!;
    for (const st of f2.rooms) n += st.template.rows.join('').split('F').length - 1;
  }
  assert.ok(n >= 3, `cargadores en 10 plantas 2: ${n}`);
});
