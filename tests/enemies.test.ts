import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { ChargerBrain, MothBrain, TurretBrain } from '../src/data/types.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { checkInvariants, createWorld, DT, NO_INPUT, sourceTelegraph, activeWarnings, step, type SimEvent, type World } from '../src/sim/world.ts';

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

test('la sala de pruebas tiene aspirador, microondas, bombilla con su polilla, batidora y tres mandos', () => {
  const w = createWorld({ seed: 'x' });
  assert.deepEqual(w.enemies.map((e) => e.def.id).sort(), ['aspirador', 'batidora', 'bombilla', 'mando', 'mando', 'mando', 'microondas', 'polilla']);
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

test('aspirador: rebota en la pared y sigue embistiendo; a la tercera pared, o al acabar, se para (M14b (h9a))', () => {
  assert.equal(brain.rebound, 2);
  // Player near the right wall, vacuum charging towards it: it goes past and hits the wall.
  const w = arena(470, 590);
  w.noDamage = true;
  const en = w.enemies[0]!;
  w.player.x = 590;
  const bonk = runUntil(w, (e) => e.type === 'bonk', 900);
  assert.ok(bonk && bonk.type === 'bonk', 'choca');
  assert.equal(en.state, 'charge', 'sigue embistiendo');
  assert.ok(en.dirX < 0, 'de vuelta, en espejo');
  assert.ok(en.x < w.room.w - 24);
  // It ends up stopping: stunned against a wall, or braking at the end of its run.
  let end = '';
  for (let i = 0; i < 120 && !end; i++) {
    step(w, NO_INPUT);
    if ((en.state as string) === 'stun' || (en.state as string) === 'brake') end = en.state;
  }
  assert.ok(end, 'no se para');
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
  const en = w.enemies[0]!;
  en.until = 99;
  let hits = 0;
  for (let i = 0; i < 150 && w.enemies.includes(en); i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
    hits += w.events.filter((e) => e.type === 'hit' && e.target === en.id).length;
  }
  assert.ok(hits > 3, `impactos ${hits}`);
  assert.ok(en.damageTaken > 0);
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
});

test('microondas: va al reflejo de la tostadora en el centro de la sala, y se para a calentar (M14b (h9c))', () => {
  const w = kitchen(300, 112);
  w.noDamage = true;
  const en = w.enemies[0]!;
  en.state = 'idle';
  en.until = 99;
  const p = w.player;
  const mirrorD = (): number => Math.hypot(en.x - (w.room.w - p.x), en.y - (w.room.h - p.y));
  const d0 = mirrorD();
  for (let i = 0; i < 120; i++) step(w, NO_INPUT);
  assert.ok(mirrorD() < d0 - 20, `se acerca a su reflejo (${d0.toFixed(0)} → ${mirrorD().toFixed(0)})`);
  // The toaster walks right: it walks left.
  const x1 = en.x;
  for (let i = 0; i < 40; i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.ok(en.x < x1 - 4, 'no va al revés que la tostadora');
  // Heating up and firing, it stands still.
  en.until = 0;
  runUntil(w, (e) => e.type === 'telegraph' && e.source === en.id, 120);
  const x0 = en.x;
  const y0 = en.y;
  for (let i = 0; i < 30 && (en.state as string) === 'fire'; i++) step(w, NO_INPUT);
  assert.ok(Math.hypot(en.x - x0, en.y - y0) < 1, 'se mueve mientras calienta');
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
  // (Heating up, so it does not walk round by itself.)
  en.state = 'fire';
  en.until = 99;
  const x0 = en.x;
  let hits = 0;
  for (let i = 0; i < 150; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
    hits += w.events.filter((e) => e.type === 'hit' && e.target === en.id).length;
  }
  assert.ok(hits > 3, `impactos ${hits}`);
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

test('bombilla: no para de flotar en diagonal y rebota en las paredes, también mientras se enciende y dispara (M14b (h9a))', () => {
  const w = office(330, 140, false);
  w.noDamage = true;
  const en = w.enemies[0]!;
  // Switching on (off), it does not move yet.
  const x0 = en.x;
  for (let i = 0; i < 30; i++) step(w, NO_INPUT);
  assert.ok(Math.abs(en.x - x0) < 0.5, 'apagada no flota');
  for (let i = 0; i < Math.round(bulbBrain.startup! * 60); i++) step(w, NO_INPUT);
  let flips = 0;
  let lastX = Math.sign(en.dirX);
  let lastY = Math.sign(en.dirY);
  let firing = 0;
  let movedFiring = 0;
  for (let i = 0; i < 60 * 14; i++) {
    const px = en.x;
    const py = en.y;
    step(w, NO_INPUT);
    if (en.state === 'fire') {
      firing++;
      movedFiring += Math.hypot(en.x - px, en.y - py);
    }
    if (Math.sign(en.dirX) !== lastX || Math.sign(en.dirY) !== lastY) flips++;
    lastX = Math.sign(en.dirX);
    lastY = Math.sign(en.dirY);
    assert.ok(Math.abs(en.dirX) > 0.3 && Math.abs(en.dirY) > 0.3, 'siempre en diagonal');
  }
  assert.ok(flips >= 2, `rebota (${flips})`);
  assert.ok(firing > 0 && movedFiring > firing * bulbBrain.drift!.speed * DT * 0.5, 'flota también disparando');
  assert.deepEqual(checkInvariants(w), []);
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

test('los enemigos que andan no se meten unos dentro de otros (la polilla vuela por encima)', () => {
  // The three remotes, the blender and the vacuum, all piled on one spot; the toaster far away
  // and untouchable, so they only walk.
  const w = createWorld({ seed: 'apelotonados' });
  w.noDamage = true;
  w.player.x = 40;
  w.player.y = ROW3;
  const pile = w.enemies.filter((e) => ['mando', 'batidora', 'aspirador'].includes(e.def.id));
  assert.equal(pile.length, 5);
  for (const en of pile) {
    en.x = 260;
    en.y = 5 * 24 + 12;
  }
  for (let i = 0; i < 90; i++) step(w, NO_INPUT);
  let closest = Infinity;
  for (const a of pile) for (const b of pile) if (a !== b) closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
  assert.ok(closest > 6, `dos siguen uno encima del otro (${closest.toFixed(1)} px)`);
  // And with time, each one keeps most of its room.
  for (let i = 0; i < 180; i++) step(w, NO_INPUT);
  const live = pile.filter((e) => w.enemies.includes(e));
  for (const a of live) for (const b of live) {
    if (a === b) continue;
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > (a.def.hurt.w + b.def.hurt.w) * 0.25, `${a.def.id} y ${b.def.id} se pisan`);
  }
});
