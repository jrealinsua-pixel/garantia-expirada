import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, HURT_CLEAR_RADIUS, HURT_IFRAMES, NO_INPUT, PLAYER_HURT_Y, step, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;

function arena(): World {
  const w = createWorld({ seed: 'heridas', noEnemies: true });
  w.player.x = 200;
  w.player.y = ROW3;
  return w;
}

/** An enemy bullet `dist` px to the left of the player's body, flying at it. */
function incoming(w: World, dist: number, dy = 0): void {
  w.bullets.push({
    id: w.nextId++,
    owner: 'enemy',
    x: w.player.x - dist,
    y: w.player.y - PLAYER_HURT_Y + dy,
    vx: 120,
    vy: 0,
    r: 2.5,
    life: 6,
    damage: 1,
    knockback: 0,
    color: 'red',
    age: 0,
    dir: 0,
    speed: 120,
    h: 0,
  });
}

function run(w: World, ticks: number, input = NO_INPUT): string[] {
  const seen: string[] = [];
  for (let i = 0; i < ticks; i++) {
    step(w, input);
    for (const e of w.events) seen.push(e.type);
  }
  return seen;
}

test('una bala enemiga quita medio corazón y deja a la tostadora parpadeando un rato', () => {
  const w = arena();
  const hp = w.player.hp;
  incoming(w, 30);
  const seen = run(w, 30);
  assert.ok(seen.includes('hurt'));
  assert.equal(w.player.hp, hp - 1);
  assert.ok(w.player.invulnerable > 0 && w.player.invulnerable <= HURT_IFRAMES);
  assert.equal(w.bullets.length, 0, 'la bala se gasta');
});

test('mientras parpadea, otra bala la atraviesa sin hacer daño', () => {
  const w = arena();
  incoming(w, 20);
  run(w, 20);
  const hp = w.player.hp;
  incoming(w, 20);
  run(w, 20);
  assert.equal(w.player.hp, hp);
});

test('rodando no se recibe daño', () => {
  const w = arena();
  const hp = w.player.hp;
  incoming(w, 14);
  run(w, 1, { ...NO_INPUT, moveY: 1, roll: true });
  run(w, 15, { ...NO_INPUT, moveY: 1 });
  assert.equal(w.player.hp, hp);
});

test('una bala que pasa rozando por encima no da: la caja de daño es más pequeña que el sprite', () => {
  const w = arena();
  const hp = w.player.hp;
  incoming(w, 30, -12);
  run(w, 40);
  assert.equal(w.player.hp, hp);
});

test('al recibir un golpe desaparecen las balas enemigas cercanas, no las lejanas', () => {
  const w = arena();
  incoming(w, 10);
  // Two more aimed elsewhere: one close, one far away.
  incoming(w, HURT_CLEAR_RADIUS - 20, 30);
  incoming(w, HURT_CLEAR_RADIUS + 90, 60);
  run(w, 8);
  assert.equal(w.bullets.length, 1);
  assert.ok(w.bullets[0]!.x < w.player.x - HURT_CLEAR_RADIUS);
});

test('sin vida se acaba la partida: evento, la tostadora no responde y ya no recibe daño', () => {
  const w = arena();
  w.player.hp = 1;
  incoming(w, 20);
  const seen = run(w, 20);
  assert.ok(seen.includes('down'));
  assert.ok(w.over);
  assert.equal(w.player.hp, 0);
  const x = w.player.x;
  w.player.invulnerable = 0;
  incoming(w, 20);
  const later = run(w, 60, { ...NO_INPUT, moveX: 1, fire: true, aimX: 400, aimY: ROW3 });
  assert.ok(Math.abs(w.player.x - x) < 2, 'no se mueve');
  assert.ok(!later.includes('shot') && !later.includes('hurt'));
});

test('la sala de pruebas mata a una tostadora quieta (las balas de verdad hacen daño)', () => {
  const w = createWorld({ seed: 'quieta' });
  run(w, 60 * 60);
  assert.ok(w.player.hp < w.player.def.maxHp);
});
