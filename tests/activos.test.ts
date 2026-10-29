import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { ACTIVE_ITEMS, FINDABLE_ACTIVES } from '../src/data/items.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { createWorld, DT, enterRoom, firePattern, giveActive, NO_INPUT, spawnEnemy, step, worldHash, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const use: Input = { ...NO_INPUT, useItem: true };

/** The test room, nothing in the way, no enemies, the toaster carrying active item `id` (full). */
function bare(seed: string, id?: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  if (id) giveActive(w, id);
  return w;
}

/** An enemy standing still at (x, y). */
function still(w: World, id: string, x: number, y: number): void {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
}

/** A ring of enemy bullets fired at the toaster from (x, y). */
function ring(w: World, x: number, y: number): void {
  const def = PATTERNS[Object.keys(PATTERNS)[0]!]!;
  firePattern(w, def, x, y, Math.atan2(w.player.y - y, w.player.x - x));
  for (let i = 0; i < 6; i++) step(w, NO_INPUT);
}

test('hay 3 objetos activos con nombre corto, descripción, sprite y pilas', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  const defs = Object.values(ACTIVE_ITEMS);
  assert.equal(defs.length, 3);
  assert.deepEqual([...FINDABLE_ACTIVES].sort(), Object.keys(ACTIVE_ITEMS).sort());
  for (const d of defs) {
    const words = d.name.split(' ').length;
    assert.ok(words >= 2 && words <= 4, `${d.id}: ${d.name}`);
    assert.ok(d.description.endsWith('.') && !/[!¡]/.test(d.description), d.id);
    assert.ok(keys.has(d.sprite), `${d.id}: falta el sprite ${d.sprite}`);
    assert.ok(d.charges >= 1 && d.charges <= 6, d.id);
  }
});

test('se coge andando, llega cargado y al coger otro deja el viejo en el suelo con sus pilas', () => {
  const w = bare('activo-cambio', 'encuesta');
  const carried = (): string | undefined => w.player.active?.id;
  assert.deepEqual(w.player.active, { id: 'encuesta', charge: 2 });
  w.player.active!.charge = 1;
  w.pickups.push({ id: w.nextId++, kind: 'activo', item: 'pegamento', charge: 2, value: 1, x: 160, y: 200, vx: 0, vy: 0, age: 1 });
  for (let i = 0; i < ticks(1) && carried() !== 'pegamento'; i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.deepEqual(w.player.active, { id: 'pegamento', charge: 2 });
  const old = w.pickups.find((k) => k.kind === 'activo')!;
  assert.equal(old.item, 'encuesta');
  assert.equal(old.charge, 1);
  // Standing on the old one does not swap them back (no flip-flop)...
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.equal(carried(), 'pegamento');
  // ...stepping off and back on does.
  w.player.x = old.x + 40;
  step(w, NO_INPUT);
  for (let i = 0; i < ticks(1.5) && carried() !== 'encuesta'; i++) step(w, { ...NO_INPUT, moveX: -1 });
  assert.deepEqual(w.player.active, { id: 'encuesta', charge: 1 });
});

test('sin pilas suficientes no hace nada', () => {
  const w = bare('activo-vacio', 'encuesta');
  w.player.active!.charge = 1;
  ring(w, 300, 200);
  const n = w.bullets.length;
  step(w, use);
  assert.ok(w.events.some((e) => e.type === 'activeEmpty'));
  assert.equal(w.player.active!.charge, 1);
  assert.ok(w.bullets.length >= n - 2);
  // And with nothing carried, Q just buzzes.
  const w2 = bare('activo-nada');
  step(w2, use);
  assert.ok(w2.events.some((e) => e.type === 'activeEmpty' && e.item === null));
});

test('Encuesta de Satisfacción: borra todas las balas enemigas y gasta las pilas', () => {
  const w = bare('encuesta', 'encuesta');
  ring(w, 300, 200);
  assert.ok(w.bullets.some((b) => b.owner === 'enemy'));
  step(w, use);
  assert.ok(w.events.some((e) => e.type === 'active' && e.effect === 'clearFire'));
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0);
  assert.equal(w.player.active!.charge, 0);
});

test('Música de Espera: enemigos y balas enemigas se quedan quietos, las balas propias no', () => {
  const w = bare('espera', 'espera');
  still(w, 'microondas', 300, 260);
  ring(w, 300, 140);
  step(w, use);
  assert.ok(w.holdT > 3);
  const eb = w.bullets.filter((b) => b.owner === 'enemy').map((b) => ({ b, x: b.x, y: b.y }));
  assert.ok(eb.length > 0);
  const en = w.enemies[0]!;
  const t = en.t;
  // Fire at the microwave while everything waits.
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  let hits = 0;
  for (let i = 0; i < ticks(1); i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
    hits += w.events.filter((e) => e.type === 'hit').length;
  }
  for (const { b, x, y } of eb) {
    assert.ok(w.bullets.includes(b), 'una bala en espera ha desaparecido');
    assert.equal(b.x, x);
    assert.equal(b.y, y);
  }
  assert.equal(en.t, t, 'el enemigo sigue pensando');
  assert.ok(hits > 0, 'las balas de la tostadora no le dan');
  // Then the music stops and they move again.
  let ended = false;
  for (let i = 0; i < ticks(3) && !ended; i++) {
    step(w, NO_INPUT);
    ended = w.events.some((e) => e.type === 'holdEnd');
  }
  assert.ok(ended);
  step(w, NO_INPUT);
  const moving = eb.filter(({ b, x, y }) => w.bullets.includes(b) && (b.x !== x || b.y !== y));
  assert.ok(moving.length > 0);
});

test('Pegamento Exprés: devuelve un corazón; con la vida llena no se gasta', () => {
  const w = bare('pegamento', 'pegamento');
  step(w, use);
  assert.ok(w.events.some((e) => e.type === 'activeEmpty'));
  assert.equal(w.player.active!.charge, 2);
  w.player.hp = 2;
  step(w, use);
  assert.equal(w.player.hp, 4);
  assert.equal(w.player.active!.charge, 0);
});

test('limpiar una sala de combate mete una pila, hasta llenarlo', () => {
  const clear = (w: World): void => {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    for (let i = 0; i < ticks(4) && w.doorsShut; i++) step(w, NO_INPUT);
  };
  const w = createWorld({ seed: 'pilas', floor: true });
  w.noDamage = true;
  const f = w.floor!;
  giveActive(w, 'espera', 0);
  const combats = f.layout.rooms.filter((r) => r.kind === 'combat').slice(0, 4);
  const charges: number[] = [];
  for (const r of combats) {
    // Walk in (any wall will do for the test) and clear it.
    const via = r.doors[0]!.dir;
    enterRoom(w, r.id, via);
    assert.ok(w.doorsShut, `la sala ${r.id} no cierra`);
    clear(w);
    assert.ok(!w.doorsShut);
    charges.push(w.player.active!.charge);
  }
  assert.deepEqual(charges, [1, 2, 3, 3]);
});

test('con objetos activos la simulación sigue siendo determinista', () => {
  const run = (): string => {
    const w = bare('activos-det', 'espera');
    still(w, 'microondas', 300, 260);
    for (let i = 0; i < ticks(4); i++) step(w, i === 30 ? use : { ...NO_INPUT, fire: true, aimX: 300, aimY: 246 });
    return worldHash(w) + w.holdT;
  };
  assert.equal(run(), run());
});
