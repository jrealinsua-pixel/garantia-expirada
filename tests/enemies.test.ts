import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { createWorld, NO_INPUT, sourceTelegraph, activeWarnings, step, type SimEvent, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;
const asp = ENEMIES.aspirador!;
const brain = asp.brain;

/** Test room with the vacuum at (ex, ey) and the toaster at (px, py), both in the empty row 3. */
function arena(ex: number, px: number): World {
  const w = createWorld({ seed: 'aspirador' });
  const en = w.enemies[0]!;
  en.x = ex;
  en.y = ROW3;
  w.player.x = px;
  w.player.y = ROW3;
  return w;
}

function runUntil(w: World, pred: (e: SimEvent) => boolean, maxTicks = 600): SimEvent | null {
  for (let i = 0; i < maxTicks; i++) {
    step(w, NO_INPUT);
    const e = w.events.find(pred);
    if (e) return e;
  }
  return null;
}

test('la sala de pruebas tiene un Aspirador Desahuciado', () => {
  const w = createWorld({ seed: 'x' });
  assert.equal(w.enemies.length, 1);
  assert.equal(w.enemies[0]!.def.id, 'aspirador');
  assert.equal(createWorld({ seed: 'x', noEnemies: true }).enemies.length, 0);
});

test('aspirador: avisa, carga en línea recta hacia donde estabas y frena', () => {
  const w = arena(150, 300);
  const en = w.enemies[0]!;
  const tel = runUntil(w, (e) => e.type === 'telegraph');
  assert.ok(tel && tel.type === 'telegraph' && tel.source === en.id && tel.aimed);
  assert.equal(en.state, 'warn');
  assert.ok(sourceTelegraph(w, en.id) >= 0);
  assert.ok(activeWarnings(w).some((x) => x.source === en.id && !x.bullets));
  // The player moves away during the warning: the charge keeps the locked direction.
  const dirX = en.dirX;
  const dirY = en.dirY;
  assert.ok(dirX > 0.95, 'apunta a la tostadora');
  w.player.y = ROW3 + 40;
  const ch = runUntil(w, (e) => e.type === 'charge', Math.ceil(brain.telegraph * 60) + 2);
  assert.ok(ch, 'carga al acabar el aviso');
  assert.equal(en.dirX, dirX);
  assert.equal(en.dirY, dirY);
  step(w, NO_INPUT);
  assert.ok(Math.abs(Math.hypot(en.vx, en.vy) - brain.chargeSpeed) < 1);
  const x0 = en.x;
  const br = runUntil(w, (e) => e.type === 'brake' || e.type === 'bonk', 120);
  assert.ok(br && br.type === 'brake', 'frena sin chocar en una fila vacía');
  assert.ok(en.x - x0 > brain.chargeSpeed * brain.chargeTime * 0.8, `recorrido ${en.x - x0}`);
  assert.ok(Math.abs(en.y - ROW3) < 0.5, 'en línea recta');
  for (let i = 0; i < Math.ceil(brain.recover * 60) + 2; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'walk');
  assert.ok(Math.hypot(en.vx, en.vy) <= brain.walkSpeed + 1);
});

test('aspirador: si choca con la pared se queda aturdido', () => {
  // Player near the right wall, vacuum charging towards it: it goes past and hits the wall.
  const w = arena(470, 590);
  const en = w.enemies[0]!;
  w.player.x = 590;
  const bonk = runUntil(w, (e) => e.type === 'bonk', 900);
  assert.ok(bonk, 'choca');
  assert.equal(en.state, 'stun');
  assert.ok(en.x < w.room.w - 24);
});

test('aspirador: al embestir empuja a la tostadora (sin daño todavía)', () => {
  const w = arena(150, 260);
  const hp = w.player.hp;
  const c = runUntil(w, (e) => e.type === 'contact', 900);
  assert.ok(c && c.type === 'contact');
  step(w, NO_INPUT);
  assert.ok(w.player.vx > 50, `empuje ${w.player.vx}`);
  assert.equal(w.player.hp, hp);
});

test('aspirador: rodando se le esquiva sin empujón', () => {
  const w = arena(150, 260);
  const en = w.enemies[0]!;
  runUntil(w, (e) => e.type === 'charge', 900);
  let contacts = 0;
  for (let i = 0; i < 40; i++) {
    // Keep rolling through it (the roll lasts 0.42 s; restart it as soon as it ends).
    step(w, { ...NO_INPUT, roll: true, moveX: -1 });
    contacts += w.events.filter((e) => e.type === 'contact').length;
    if (en.state !== 'charge') break;
  }
  assert.equal(contacts, 0);
});

test('las balas de la tostadora dan al aspirador', () => {
  const w = arena(300, 150);
  w.enemies[0]!.until = 99;
  let hits = 0;
  for (let i = 0; i < 60; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: w.enemies[0]!.x, aimY: w.enemies[0]!.y - 14 });
    hits += w.events.filter((e) => e.type === 'hit' && e.target === w.enemies[0]!.id).length;
  }
  assert.ok(hits > 3, `impactos ${hits}`);
  assert.ok(w.enemies[0]!.damageTaken > 0);
});
