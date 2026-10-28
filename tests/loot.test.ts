import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { createWorld, NO_INPUT, PICKUP_DELAY, step, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;

/** Test room with only the microwave, in the empty row 3, and the toaster to its left. */
function microwaveArena(seed = 'botin'): World {
  const w = createWorld({ seed });
  w.enemies = w.enemies.filter((e) => e.def.id === 'microondas');
  const en = w.enemies[0]!;
  en.x = 300;
  en.y = ROW3;
  w.player.x = 200;
  w.player.y = ROW3;
  return w;
}

/** Fires at the microwave's body until something happens or time runs out. */
function shootUntil(w: World, pred: (e: SimEvent) => boolean, maxTicks = 900): SimEvent | null {
  const fire: Input = { ...NO_INPUT, aimX: 300, aimY: ROW3 - 14, fire: true };
  for (let i = 0; i < maxTicks; i++) {
    const en = w.enemies.find((e) => e.def.id === 'microondas');
    step(w, en ? fire : NO_INPUT);
    const e = w.events.find(pred);
    if (e) return e;
  }
  return null;
}

test('todos los enemigos tienen vida y botín con sentido', () => {
  for (const def of Object.values(ENEMIES)) {
    assert.ok(def.hp > 0, def.id);
    const [lo, hi] = def.loot.coupons;
    assert.ok(lo >= 0 && hi >= lo, `${def.id}: rango de cupones`);
  }
});

test('un enemigo sin vida se desmonta: evento, sale del mundo y suelta cupones', () => {
  const w = microwaveArena();
  const id = w.enemies[0]!.id;
  const death = shootUntil(w, (e) => e.type === 'death');
  assert.ok(death && death.type === 'death', 'muere');
  assert.equal(death.source, id);
  assert.equal(death.enemy, 'microondas');
  assert.equal(w.enemies.length, 0);
  assert.equal(w.kills, 1);
  const [lo, hi] = ENEMIES.microondas!.loot.coupons;
  assert.ok(w.pickups.length >= lo && w.pickups.length <= hi, `cupones: ${w.pickups.length}`);
  assert.ok(w.pickups.every((k) => k.kind === 'cupon'));
});

test('las balas atraviesan el sitio de un enemigo ya desmontado', () => {
  const w = microwaveArena();
  shootUntil(w, (e) => e.type === 'death');
  let hits = 0;
  const fire: Input = { ...NO_INPUT, aimX: 300, aimY: ROW3 - 14, fire: true };
  for (let i = 0; i < 60; i++) {
    step(w, fire);
    hits += w.events.filter((e) => e.type === 'hit').length;
  }
  assert.equal(hits, 0);
});

test('los cupones se esparcen, esperan un momento y la tostadora los recoge al acercarse', () => {
  const w = microwaveArena('cupones');
  shootUntil(w, (e) => e.type === 'death');
  // Make sure there is something to pick up whatever the dice said.
  if (w.pickups.length === 0) w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: 300, y: ROW3, vx: 0, vy: 0, age: 0 });
  const n = w.pickups.length;
  const fresh = w.pickups[0]!;
  // Right on top of a fresh one: not yet.
  w.player.x = fresh.x;
  w.player.y = fresh.y + 2;
  step(w, NO_INPUT);
  if (fresh.age < PICKUP_DELAY) assert.ok(w.pickups.includes(fresh), 'no se recoge en el acto');
  // Walk over them all.
  let picked = 0;
  for (let i = 0; i < 400 && w.pickups.length; i++) {
    const k = w.pickups[0]!;
    const dx = k.x - w.player.x;
    const dy = k.y - w.player.y;
    const l = Math.hypot(dx, dy) || 1;
    step(w, { ...NO_INPUT, moveX: dx / l, moveY: dy / l });
    picked += w.events.filter((e) => e.type === 'pickup').length;
  }
  assert.equal(w.pickups.length, 0);
  assert.equal(picked, n);
  assert.equal(w.player.coupons, n);
});

test('los cupones cercanos vuelan hacia la tostadora', () => {
  const w = createWorld({ seed: 'iman', noEnemies: true });
  w.player.x = 200;
  w.player.y = ROW3;
  w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: 235, y: ROW3, vx: 0, vy: 0, age: 1 });
  for (let i = 0; i < 30; i++) step(w, NO_INPUT);
  assert.equal(w.player.coupons, 1);
});

test('si muere la bombilla, su polilla se queda sin dueña y ronda a la tostadora', () => {
  const w = createWorld({ seed: 'viuda' });
  const bulb = w.enemies.find((e) => e.def.id === 'bombilla')!;
  bulb.damageTaken = bulb.def.hp;
  step(w, NO_INPUT);
  assert.ok(!w.enemies.includes(bulb));
  const moth = w.enemies.find((e) => e.def.id === 'polilla');
  assert.ok(moth, 'la polilla sigue viva');
  for (let i = 0; i < 120; i++) step(w, NO_INPUT);
  assert.ok(w.enemies.includes(moth));
});

test('la sala de pruebas repone a sus enemigos unos segundos después de vaciarse', () => {
  const w = createWorld({ seed: 'reponer' });
  const total = w.enemies.length;
  for (const en of w.enemies) en.damageTaken = en.def.hp;
  step(w, NO_INPUT);
  assert.equal(w.enemies.length, 0);
  assert.equal(w.kills, total);
  let restocked = false;
  for (let i = 0; i < Math.ceil(w.room.restock * 60) + 5 && !restocked; i++) {
    step(w, NO_INPUT);
    restocked = w.events.some((e) => e.type === 'restock');
  }
  assert.ok(restocked);
  assert.equal(w.enemies.length, total);
  assert.ok(new Set(w.enemies.map((e) => e.id)).size === total, 'ids nuevos y únicos');
});

test('morir y recoger es determinista', () => {
  const run = (): string => {
    const w = microwaveArena('det');
    shootUntil(w, (e) => e.type === 'death');
    for (let i = 0; i < 60; i++) step(w, NO_INPUT);
    return JSON.stringify(w.pickups.map((k) => [k.x.toFixed(3), k.y.toFixed(3)]));
  };
  assert.equal(run(), run());
});

test('lo que un enemigo iba a disparar se cancela si lo desmontan', () => {
  const w = microwaveArena('cancelar');
  const en = w.enemies[0]!;
  // Wait until it is warming up, then take it apart.
  for (let i = 0; i < 600 && !w.emitters.some((e) => e.source === en.id); i++) step(w, NO_INPUT);
  assert.ok(w.emitters.some((e) => e.source === en.id), 'empieza a calentar');
  en.damageTaken = en.def.hp;
  step(w, NO_INPUT);
  assert.equal(w.emitters.filter((e) => e.source === en.id).length, 0);
});

test('el botín de un enemigo pegado a la pared no aparece dentro del muro', async () => {
  const { createWorld, step, NO_INPUT, checkInvariants } = await import('../src/sim/world.ts');
  const w = createWorld({ seed: 'botin-pared' });
  const en = w.enemies.find((e) => e.def.id === 'batidora')!;
  w.enemies = [en];
  // Feet right against the back wall (it ends at y = 48), like the bot found it.
  en.x = 256;
  en.y = 51;
  en.damageTaken = en.def.hp;
  en.lastHit = -Math.PI / 2;
  w.player.x = 100;
  w.player.y = 300;
  for (let i = 0; i < 60; i++) {
    step(w, NO_INPUT);
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.ok(w.pickups.length > 0);
});
