import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { ChargerBrain, MothBrain, TurretBrain } from '../src/data/types.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, NO_INPUT, sourceTelegraph, activeWarnings, step, type SimEvent, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;
const asp = ENEMIES.aspirador!;
const brain = asp.brain as ChargerBrain;

/** Test room with the vacuum at (ex, ey) and the toaster at (px, py), both in the empty row 3. */
function arena(ex: number, px: number): World {
  const w = createWorld({ seed: 'aspirador' });
  w.enemies = w.enemies.filter((e) => e.def.id === 'aspirador');
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

test('la sala de pruebas tiene aspirador, microondas y bombilla con su polilla', () => {
  const w = createWorld({ seed: 'x' });
  assert.deepEqual(w.enemies.map((e) => e.def.id).sort(), ['aspirador', 'bombilla', 'microondas', 'polilla']);
  const bulb = w.enemies.find((e) => e.def.id === 'bombilla')!;
  const moth = w.enemies.find((e) => e.def.id === 'polilla')!;
  assert.equal(moth.owner, bulb.id, 'la polilla acompaña a la bombilla');
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

test('aspirador: al embestir empuja a la tostadora y le quita medio corazón', () => {
  const w = arena(150, 260);
  const hp = w.player.hp;
  const c = runUntil(w, (e) => e.type === 'contact', 900);
  assert.ok(c && c.type === 'contact');
  step(w, NO_INPUT);
  assert.ok(w.player.vx > 50, `empuje ${w.player.vx}`);
  assert.equal(w.player.hp, hp - asp.contactDamage);
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

/** Test room with only the microwave, at (ex, ey), and the toaster at (px, py). */
function kitchen(px: number, py: number): World {
  const w = createWorld({ seed: 'microondas' });
  w.enemies = w.enemies.filter((e) => e.def.id === 'microondas');
  w.player.x = px;
  w.player.y = py;
  return w;
}

test('microondas: calienta un segundo (avisando) y dispara sus anillos', () => {
  const mw = ENEMIES.microondas!;
  const b = mw.brain as TurretBrain;
  const w = kitchen(300, 200);
  const en = w.enemies[0]!;
  const x0 = en.x;
  const tel = runUntil(w, (e) => e.type === 'telegraph', 300);
  assert.ok(tel && tel.type === 'telegraph' && tel.source === en.id);
  assert.ok(Math.abs(tel.time - b.telegraph) < 1e-9);
  assert.equal(tel.aimed, false, 'los anillos no apuntan');
  assert.equal(en.state, 'fire');
  assert.ok(sourceTelegraph(w, en.id) >= 0, 'parpadea mientras calienta');
  const warns = activeWarnings(w).filter((x) => x.source === en.id);
  assert.equal(warns.length, 1);
  assert.ok(warns[0]!.bullets, 'con el anillo que se cierra');
  let first = -1;
  for (let i = 0; i < 120; i++) {
    step(w, NO_INPUT);
    if (w.bullets.some((x) => x.owner === 'enemy')) {
      first = i + 1;
      break;
    }
  }
  assert.ok(Math.abs(first - b.telegraph * 60) <= 1, `primera bala en el tick ${first}`);
  const expected = expandPattern(PATTERNS[b.pattern]!, 0, new Rng(1)).length;
  const seen = new Set(w.bullets.filter((x) => x.owner === 'enemy').map((x) => x.id));
  for (let i = 0; i < 60; i++) {
    step(w, NO_INPUT);
    for (const x of w.bullets) if (x.owner === 'enemy') seen.add(x.id);
  }
  assert.equal(seen.size, expected);
  assert.equal(en.x, x0, 'no se mueve');
});

test('microondas: no dispara si la tostadora está lejos', () => {
  const w = kitchen(40, 340);
  const en = w.enemies[0]!;
  assert.ok(Math.hypot(w.player.x - en.x, w.player.y - en.y) > (en.def.brain as TurretBrain).range);
  assert.equal(runUntil(w, (e) => e.type === 'telegraph', 400), null);
});

test('microondas: las balas no lo mueven', () => {
  const w = kitchen(300, 112);
  const en = w.enemies[0]!;
  en.until = 99;
  const x0 = en.x;
  let hits = 0;
  for (let i = 0; i < 90; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
    hits += w.events.filter((e) => e.type === 'hit' && e.target === en.id).length;
  }
  assert.ok(hits > 3);
  assert.equal(en.x, x0);
});

/** Test room with only the bulb and its moth, and the toaster at (px, py). */
function office(px: number, py: number, keepMoth = true): World {
  const w = createWorld({ seed: 'bombilla' });
  w.enemies = w.enemies.filter((e) => e.def.id === 'bombilla' || (keepMoth && e.def.id === 'polilla'));
  w.player.x = px;
  w.player.y = py;
  return w;
}
const bulbBrain = ENEMIES.bombilla!.brain as TurretBrain;
const mothBrain = ENEMIES.polilla!.brain as MothBrain;

test('bombilla: tarda en encenderse y no ataca mientras tanto', () => {
  const w = office(330, 140, false);
  const en = w.enemies[0]!;
  assert.equal(en.state, 'off');
  const startTicks = Math.round(bulbBrain.startup! * 60);
  let on = -1;
  for (let i = 0; i < startTicks + 5; i++) {
    step(w, NO_INPUT);
    assert.ok(!w.events.some((e) => e.type === 'telegraph'), 'no avisa estando apagada');
    if (w.events.some((e) => e.type === 'switchOn' && e.source === en.id)) on = i + 1;
  }
  assert.ok(Math.abs(on - startTicks) <= 1, `se enciende en el tick ${on}`);
  assert.equal(en.state, 'idle');
});

test('bombilla: avisa largo y dispara su espiral de chispas cian', () => {
  const w = office(330, 140, false);
  const en = w.enemies[0]!;
  const tel = runUntil(w, (e) => e.type === 'telegraph', 600);
  assert.ok(tel && tel.type === 'telegraph' && tel.source === en.id);
  assert.ok(Math.abs(tel.time - bulbBrain.telegraph) < 1e-9);
  assert.equal(tel.color, 'cyan');
  const expected = expandPattern(PATTERNS[bulbBrain.pattern]!, 0, new Rng(1)).length;
  const seen = new Set<number>();
  for (let i = 0; i < 180; i++) {
    step(w, NO_INPUT);
    for (const b of w.bullets) if (b.owner === 'enemy') seen.add(b.id);
  }
  assert.equal(seen.size, expected);
});

test('bombilla: guarda las distancias (se aleja si te acercas, se acerca si te alejas)', () => {
  const near = office(0, 0, false);
  const en = near.enemies[0]!;
  near.player.x = en.x + 40;
  near.player.y = en.y + 60;
  en.state = 'idle';
  en.until = 99;
  const d0 = Math.hypot(near.player.x - en.x, near.player.y - en.y);
  for (let i = 0; i < 60; i++) step(near, NO_INPUT);
  assert.ok(Math.hypot(near.player.x - en.x, near.player.y - en.y) > d0 + 10, 'se aleja');

  const far = office(40, 340, false);
  const fe = far.enemies[0]!;
  fe.state = 'idle';
  fe.until = 99;
  const f0 = Math.hypot(far.player.x - fe.x, far.player.y - fe.y);
  for (let i = 0; i < 60; i++) step(far, NO_INPUT);
  assert.ok(Math.hypot(far.player.x - fe.x, far.player.y - fe.y) < f0 - 10, 'se acerca');
});

test('polilla: da vueltas alrededor de su bombilla sin alejarse', () => {
  const w = office(40, 340);
  const bulb = w.enemies.find((e) => e.def.id === 'bombilla')!;
  const moth = w.enemies.find((e) => e.def.id === 'polilla')!;
  bulb.until = 99;
  bulb.state = 'off';
  let maxD = 0;
  const angles = new Set<number>();
  for (let i = 0; i < 240; i++) {
    step(w, NO_INPUT);
    maxD = Math.max(maxD, Math.hypot(moth.x - bulb.x, moth.y - bulb.y));
    angles.add(Math.floor((Math.atan2(moth.y - bulb.y, moth.x - bulb.x) + Math.PI) / (Math.PI / 2)));
  }
  assert.ok(maxD < mothBrain.orbitRadius * 1.6, `distancia máxima ${maxD.toFixed(1)}`);
  assert.ok(angles.size >= 4, 'pasa por los cuatro lados');
});

test('polilla: avisa y se lanza hacia la tostadora, y vuelve', () => {
  const w = office(0, 0);
  const moth = w.enemies.find((e) => e.def.id === 'polilla')!;
  w.player.x = moth.x + 70;
  w.player.y = moth.y + 30;
  moth.until = 0.2;
  // Let the bulb switch on first: a moth does not leave a dark bulb.
  const tel = runUntil(w, (e) => e.type === 'telegraph' && e.source === moth.id, 400);
  assert.ok(tel && tel.type === 'telegraph' && tel.aimed);
  assert.ok(activeWarnings(w).some((x) => x.source === moth.id && !x.bullets));
  const d0 = Math.hypot(w.player.x - moth.x, w.player.y - moth.y);
  const dart = runUntil(w, (e) => e.type === 'dart', Math.ceil(mothBrain.telegraph * 60) + 2);
  assert.ok(dart, 'se lanza');
  for (let i = 0; i < 15; i++) step(w, NO_INPUT);
  assert.ok(Math.hypot(w.player.x - moth.x, w.player.y - moth.y) < d0 - 30, 'va hacia la tostadora');
  for (let i = 0; i < 120; i++) step(w, NO_INPUT);
  assert.equal(moth.state, 'idle');
});

test('polilla: sin bombilla, ronda a la tostadora', () => {
  const w = office(300, 200);
  w.enemies = w.enemies.filter((e) => e.def.id === 'polilla');
  const moth = w.enemies[0]!;
  moth.until = 99;
  for (let i = 0; i < 300; i++) step(w, NO_INPUT);
  assert.ok(Math.hypot(w.player.x - moth.x, w.player.y - moth.y) < mothBrain.orbitRadius * 3.5);
});
