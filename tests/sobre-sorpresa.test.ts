// El Sobre Sorpresa (M10 4d, planta 3): hops about, spits short fans of confetti, and when it
// breaks something comes out: two repeated figurines (almost always), a shower of coupons
// (sometimes) or the ultra-rare golden figurine (hardly ever).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { SLOT_ENEMIES_2, SLOT_ENEMIES_3 } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import type { HopperBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, dummyHurtBox, enemyAltitude, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['sobre-sorpresa']!;
const brain = def.brain as HopperBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function field(seed = 'sobre', dist = 110): { w: World; en: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const en = spawnEnemy(w.nextId++, def, w.player.x + dist, w.player.y);
  w.enemies = [en];
  return { w, en };
}

test('el sobre sorpresa es contenido: datos, sprites, causas de baja y solo desde la planta 3', () => {
  assert.equal(def.name, 'Sobre Sorpresa');
  assert.equal(def.hp, 4);
  // The odds are on the back, in small print, and they add up.
  assert.match(def.description, /75 %.*20 %.*5 %/);
  assert.deepEqual(def.surprise!.map((s) => s.weight), [75, 20, 5]);
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number }>;
  assert.equal(sheets['sobre-sorpresa']?.frames, 5);
  assert.equal(sheets['munequito-repetido']?.frames, 7);
  assert.equal(sheets['munequito-dorado']?.frames, 6);
  assert.equal(sheets['bala-confeti']?.frames, 2);
  for (const id of ['sobre-sorpresa', 'munequito-repetido', 'munequito-dorado']) {
    assert.ok(DOWN_CAUSES[id]?.contact, id);
    assert.ok(!/[!¡]/.test(ENEMIES[id]!.name + ENEMIES[id]!.description), id);
  }
  assert.equal(ENEMIES['munequito-repetido']!.hp, 2);
  assert.deepEqual(ENEMIES['munequito-dorado']!.loot.coupons, [5, 5], 'el dorado vale cinco cupones');
  assert.ok(!SLOT_ENEMIES_2.some((s) => s.ch === 'Y'));
  assert.ok(SLOT_ENEMIES_3.some((s) => s.ch === 'Y'));
  // The figurines only come out of envelopes (and, later, from the boss).
  assert.ok(!SLOT_ENEMIES_3.some((s) => ['munequito-repetido', 'munequito-dorado'].includes(s.ch)));
});

test('da saltitos: en el aire se levanta (y se le da arriba), aterriza y vuelve a saltar', () => {
  const { w, en } = field();
  let hops = 0;
  let lands = 0;
  let peak = 0;
  let hurtUp = false;
  for (let i = 0; i < ticks(4); i++) {
    step(w, NO_INPUT);
    hops += w.events.filter((e) => e.type === 'hop').length;
    lands += w.events.filter((e) => e.type === 'hopLand').length;
    const alt = enemyAltitude(en);
    if (alt > peak) {
      peak = alt;
      // Hit where it is drawn: the hurt box goes up with it.
      hurtUp = dummyHurtBox(en).y < en.y + def.hurt.y - alt + 0.01;
      assert.equal(enemyFrame(en, 0), def.anim!.jump, 'fotograma en el aire');
    }
  }
  assert.ok(hops >= 3, `salta a menudo: ${hops} saltos en 4 s`);
  assert.ok(lands >= hops - 1);
  assert.ok(peak > brain.hopHeight * 0.9 && peak <= brain.hopHeight, `altura ${peak.toFixed(1)}`);
  assert.ok(hurtUp);
  assert.equal(enemyAltitude({ ...en, state: 'idle' }), 0, 'en el suelo, a ras');
});

test('cada pocos saltos escupe un abanico corto de confeti hacia la tostadora', () => {
  const { w, en } = field('confeti');
  let fired = false;
  for (let i = 0; i < ticks(6) && !fired; i++) {
    step(w, NO_INPUT);
    if (en.state === 'fire') fired = true;
  }
  assert.ok(fired, 'escupe');
  assert.equal(enemyFrame(en, 0), def.anim!.warn, 'hinchado');
  for (let i = 0; i < ticks(brain.telegraph + 0.3); i++) step(w, NO_INPUT);
  const shots = w.bullets.filter((b) => b.owner === 'enemy');
  assert.ok(shots.length >= 5);
  assert.ok(shots.every((b) => b.color === 'confetti' && b.by === 'sobre-sorpresa'));
  // Short: the confetti slows down and dies out within about 130 px.
  const pat = PATTERNS['sobre-confeti']!;
  assert.equal(pat.kind, 'sequence');
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  assert.ok(!w.bullets.some((b) => b.owner === 'enemy' && b.by === 'sobre-sorpresa' && Math.hypot(b.x - en.x, b.y - en.y) > 160), 'no llega lejos');
});

/** Breaks an envelope in a fresh world seeded `seed` and returns what came out. */
function open(seed: string): { line: string; spawned: string[]; coupons: number; w: World } {
  const { w, en } = field(seed);
  en.damageTaken = def.hp;
  step(w, NO_INPUT);
  const e = w.events.find((x) => x.type === 'surprise');
  assert.ok(e && e.type === 'surprise', 'sale algo');
  return { line: e.line, spawned: e.spawned.map((id) => w.enemies.find((k) => k.id === id)!.def.id), coupons: e.coupons, w };
}

test('al romperlo sale una sorpresa: casi siempre dos repetidos, a veces cupones y muy pocas veces el dorado', () => {
  const count: Record<string, number> = {};
  for (let i = 0; i < 400; i++) {
    const o = open(`abre-${i}`);
    count[o.line] = (count[o.line] ?? 0) + 1;
    if (o.line === 'Repetidos') {
      assert.deepEqual(o.spawned, ['munequito-repetido', 'munequito-repetido']);
      assert.equal(o.coupons, 0);
    } else if (o.line === 'Ultrarraro') assert.deepEqual(o.spawned, ['munequito-dorado']);
    else {
      assert.equal(o.line, 'Premio: cupones');
      assert.equal(o.coupons, 4);
      assert.ok(o.w.pickups.filter((p) => p.kind === 'cupon').length >= 4);
    }
  }
  const rep = count['Repetidos'] ?? 0;
  const cup = count['Premio: cupones'] ?? 0;
  const gold = count['Ultrarraro'] ?? 0;
  assert.ok(rep > 260 && rep < 340, `repetidos ${rep}/400`);
  assert.ok(cup > 50 && cup < 110, `cupones ${cup}/400`);
  assert.ok(gold > 5 && gold < 40, `dorado ${gold}/400`);
});

test('los repetidos salen disparados, persiguen y muerden', () => {
  let o = open('repes-0');
  for (let i = 1; o.line !== 'Repetidos'; i++) o = open(`repes-${i}`);
  const { w } = o;
  const kids = w.enemies;
  assert.equal(kids.length, 2);
  assert.ok(kids.every((k) => Math.hypot(k.vx, k.vy) > 50 && k.state === 'brake'), 'salen disparados');
  const d0 = kids.map((k) => Math.hypot(k.x - w.player.x, k.y - w.player.y));
  let bit = false;
  for (let i = 0; i < ticks(4) && !bit; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'lunge')) bit = true;
  }
  assert.ok(bit, 'muerden');
  kids.forEach((k, i) => assert.ok(Math.hypot(k.x - w.player.x, k.y - w.player.y) < d0[i]!, 'se acercan'));
});

test('en las salas de verdad no se mete en la pared y es determinista', () => {
  const run = (seed: string): { hash: string; hops: number } => {
    const w = createWorld({ seed, noEnemies: true, room: 'sala-pruebas' });
    w.noDamage = true;
    const en = spawnEnemy(w.nextId++, def, w.room.w / 2, w.room.h / 2 - 20);
    w.enemies = [en];
    let hops = 0;
    for (let i = 0; i < ticks(30); i++) {
      step(w, { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
      hops += w.events.filter((e) => e.type === 'hop').length;
      assert.ok(!isWallAt(w.room, en.x, en.y), 'nunca dentro de la pared');
    }
    return { hash: worldHash(w), hops };
  };
  const a = run('juguete');
  assert.deepEqual(a, run('juguete'));
  assert.ok(a.hops >= 20, `${a.hops} saltos`);
});
