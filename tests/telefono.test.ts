// El Teléfono de Recepción (M11 (4d), Atención al Cliente): a beige desk phone that hops about,
// rings (three rings of the bell, each a small slow ring of six bullets) and places calls (one fat
// bullet that homes in a little), by turns. Once it has lost half its life, a hit makes it pass the
// toaster on to a colleague («Le paso con un compañero»): a dotted line to the enemy farthest from
// the toaster for 0.8 s and then they swap places, at most once every 4 s. With nobody left, it
// puts the toaster on hold instead: a ring of slow notes that wave about.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { SLOT_ENEMIES_4, SLOT_ENEMIES_5, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { DOWN_CAUSES, HOLD_LINE, TRANSFER_LINE } from '../src/data/texts.ts';
import type { PhoneBrain } from '../src/data/types.ts';
import { farthestColleague } from '../src/sim/enemies.ts';
import { createWorld, DT, ENEMY_BULLET_RADIUS, NO_INPUT, spawnEnemy, step, type Enemy, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const def = ENEMIES['telefono-recepcion']!;
const brain = def.brain as PhoneBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/** An empty room with the toaster (untouchable) and the phone `dx` px to its right. */
function desk(seed: string, dx = 110): { w: World; ph: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2 - 60;
  w.player.y = w.room.h / 2 + 10;
  const ph = spawnEnemy(w.nextId++, def, w.player.x + dx, w.player.y);
  w.enemies = [ph];
  return { w, ph };
}

/** Another enemy, standing still waiting (to be passed on to), at (x, y). */
function colleague(w: World, id: string, x: number, y: number): Enemy {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** Runs `s` seconds and returns every event. */
function run(w: World, s: number, input: Input = NO_INPUT): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, input);
    out.push(...w.events);
  }
  return out;
}

/** Keeps the phone from attacking or hopping (resting for ever), so only the transfer happens. */
function hold(ph: Enemy): void {
  ph.state = 'idle';
  ph.t = 0;
  ph.until = 999;
}

test('el teléfono es contenido: datos, sprites, timbres, llamada, espera, textos, causa de baja y solo desde la planta 5', () => {
  assert.equal(def.name, 'Teléfono de Recepción');
  assert.equal(def.hp, 12);
  assert.equal(brain.transferAt, 0.5);
  assert.equal(brain.transferWarn, 0.8);
  assert.equal(brain.transferEvery, 4);
  const rings = PATTERNS[brain.rings]!;
  assert.ok(rings.kind === 'sequence' && rings.parts.length === 3);
  for (const part of rings.parts) assert.ok(part.pattern.kind === 'ring' && part.pattern.count === 6 && part.pattern.speed < 80);
  const call = PATTERNS[brain.call]!;
  assert.ok(call.kind === 'fan' && call.count === 1 && call.homing && call.color === 'call' && (call.radius ?? 0) > ENEMY_BULLET_RADIUS);
  const notes = PATTERNS[brain.hold]!;
  assert.ok(notes.kind === 'ring' && notes.wave && notes.color === 'note' && notes.speed < 60);
  const lines = [def.name, def.description, TRANSFER_LINE, HOLD_LINE].join(' ');
  assert.ok(!/[!¡]/.test(lines));
  assert.equal(TRANSFER_LINE, 'Le paso con un compañero');
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  for (const k of ['telefono-recepcion', 'bala-llamada', 'nota-espera']) assert.ok(sheets[k], `falta el sprite ${k}`);
  assert.ok(DOWN_CAUSES['telefono-recepcion']?.bullet && DOWN_CAUSES['telefono-recepcion'].contact);
  assert.ok(!SLOT_ENEMIES_4.some((s) => s.ch === 'Ó'));
  assert.equal(SLOT_ENEMIES_5.find((s) => s.ch === 'Ó')?.max, 2);
  const tpl = templatesOf('combat', 5)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-o'), { depth: 3, pool: [{ ch: 'Ó', cost: 1, weight: 1, max: 1 }] });
  const ws = createWorld({ seed: 'letra-o', template: filled });
  assert.equal(ws.enemies.filter((e) => e.def.id === 'telefono-recepcion').length, 1);
});

test('da saltitos y, por turnos, suena (tres anillos de seis) y llama (una bala gorda que persigue un poco)', () => {
  const { w, ph } = desk('timbres');
  const start = { x: ph.x, y: ph.y };
  const kinds: string[] = [];
  let hops = 0;
  let ringBullets = 0;
  let calls = 0;
  const seen = new Set<number>();
  for (let i = 0; i < ticks(16); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) {
      if (e.type === 'hop' && e.source === ph.id) hops++;
      if (e.type === 'phoneRing' && e.source === ph.id) {
        kinds.push('ring');
        assert.equal(e.at.length, 3);
      }
      if (e.type === 'phoneCall' && e.source === ph.id) kinds.push('call');
    }
    for (const b of w.bullets) {
      if (b.owner !== 'enemy' || seen.has(b.id)) continue;
      seen.add(b.id);
      if (b.color === 'red') {
        ringBullets++;
        assert.equal(b.r, ENEMY_BULLET_RADIUS);
      }
      if (b.color === 'call') {
        calls++;
        assert.ok(b.r > ENEMY_BULLET_RADIUS && b.homing);
      }
    }
  }
  assert.ok(hops >= 9, `solo ${hops} saltos`);
  assert.ok(Math.hypot(ph.x - start.x, ph.y - start.y) > 0 || hops > 0);
  assert.ok(kinds.length >= 3, `solo ${kinds.length} ataques`);
  assert.equal(kinds[0], 'ring');
  for (let i = 1; i < kinds.length; i++) assert.notEqual(kinds[i], kinds[i - 1], 'no alterna timbres y llamadas');
  assert.equal(ringBullets, 18 * kinds.filter((k) => k === 'ring').length);
  assert.equal(calls, kinds.filter((k) => k === 'call').length);
});

test('la llamada persigue un poco: se tuerce hacia la tostadora si se aparta, y luego sigue recta', () => {
  const { w, ph } = desk('llamada', 150);
  ph.callNext = true;
  ph.volleys = 0;
  ph.until = 0.05;
  const up: Input = { ...NO_INPUT, moveY: -1 };
  let call = w.bullets.find((b) => b.color === 'call');
  for (let i = 0; i < ticks(1.5) && !call; i++) {
    step(w, NO_INPUT);
    call = w.bullets.find((b) => b.color === 'call');
  }
  assert.ok(call, 'no llama');
  const dir0 = Math.atan2(call.vy, call.vx);
  run(w, 0.6, up);
  const dir1 = Math.atan2(call.vy, call.vx);
  // The toaster went up the screen (to the left of the call, which flies left): it turned that way.
  assert.ok(Math.abs(dir1 - dir0) > 0.15, `apenas gira (${(dir1 - dir0).toFixed(2)})`);
  run(w, 1.2, up);
  const dir2 = Math.atan2(call.vy, call.vx);
  run(w, 0.5, { ...NO_INPUT, moveY: 1 });
  assert.ok(Math.abs(Math.atan2(call.vy, call.vx) - dir2) < 0.02, 'sigue persiguiendo pasado su tiempo');
});

test('con más de la mitad de la vida no pasa con nadie; pasada la mitad, un golpe y «Le paso con un compañero»: se cambian de sitio', () => {
  const { w, ph } = desk('compañero', 90);
  hold(ph);
  const near = colleague(w, 'sobre-sorpresa', w.player.x - 40, w.player.y + 30);
  const far = colleague(w, 'sobre-sorpresa', w.player.x - 150, w.player.y - 60);
  // A hit while it still has more than half: nothing.
  ph.damageTaken = 5;
  assert.ok(!run(w, 0.3).some((e) => e.type === 'transferStart'));
  // One more and it is at half: it passes you on, to the one farthest from the toaster.
  ph.damageTaken = 6;
  step(w, NO_INPUT);
  const ev = w.events.find((e) => e.type === 'transferStart');
  assert.ok(ev && ev.type === 'transferStart' && ev.to === far.id, 'no pasa con el más lejano');
  assert.ok(ph.transfer && ph.transfer.to === far.id);
  const phoneAt = { x: ph.x, y: ph.y };
  const farAt = { x: far.x, y: far.y };
  // It holds the line (still) for 0.8 s, and then they swap.
  const during = run(w, brain.transferWarn - 0.1);
  assert.ok(!during.some((e) => e.type === 'transferDone'));
  assert.ok(Math.hypot(ph.x - phoneAt.x, ph.y - phoneAt.y) < 1, 'se mueve mientras pasa la llamada');
  const after = run(w, 0.2);
  assert.ok(after.some((e) => e.type === 'transferDone'));
  assert.ok(Math.hypot(ph.x - farAt.x, ph.y - farAt.y) < 6, 'el teléfono no está donde estaba el compañero');
  assert.ok(Math.hypot(far.x - phoneAt.x, far.y - phoneAt.y) < 6, 'el compañero no está donde estaba el teléfono');
  assert.ok(Math.hypot(near.x - (w.player.x - 40), near.y - (w.player.y + 30)) < 1);
  assert.equal(ph.transfer, undefined);
});

test('como mucho una vez cada 4 s: los golpes de en medio no pasan con nadie', () => {
  const { w, ph } = desk('cada-cuatro', 90);
  hold(ph);
  colleague(w, 'sobre-sorpresa', w.player.x - 150, w.player.y - 60);
  ph.damageTaken = 6;
  let starts = run(w, 1).filter((e) => e.type === 'transferStart').length;
  assert.equal(starts, 1);
  hold(ph);
  // Hit again and again for the next 2.5 s: no second transfer.
  for (let i = 0; i < 5; i++) {
    hold(ph);
    ph.damageTaken += 0.5;
    starts += run(w, 0.5).filter((e) => e.type === 'transferStart').length;
  }
  assert.equal(starts, 1);
  // Past the 4 s, the next hit passes you on again (back the other way).
  hold(ph);
  run(w, 1);
  hold(ph);
  ph.damageTaken += 0.5;
  starts += run(w, 0.1).filter((e) => e.type === 'transferStart').length;
  assert.equal(starts, 2);
});

test('sin nadie con quien pasarla, pone a la tostadora en espera: un anillo de notas lentas que ondulan', () => {
  const { w, ph } = desk('en-espera', 90);
  hold(ph);
  ph.damageTaken = 7;
  step(w, NO_INPUT);
  const ev = w.events.find((e) => e.type === 'transferStart');
  assert.ok(ev && ev.type === 'transferStart' && ev.to === undefined);
  const events = run(w, brain.transferWarn + 0.1);
  assert.ok(events.some((e) => e.type === 'onHold'));
  const notes = w.bullets.filter((b) => b.color === 'note');
  assert.equal(notes.length, (PATTERNS[brain.hold] as { count: number }).count);
  for (const n of notes) assert.ok(n.wave && n.speed < 60);
});

test('no pasa con jefes ni con postes de cola; y si el compañero se rompe antes, se corta la llamada', () => {
  const { w, ph } = desk('sin-jefes', 90);
  hold(ph);
  colleague(w, 'poste-cola', w.player.x - 160, w.player.y - 60);
  const boss = Object.values(ENEMIES).find((d) => d.brain.kind === 'boss')!;
  colleague(w, boss.id, w.player.x - 170, w.player.y + 60);
  assert.equal(farthestColleague(w, ph), undefined);
  const mate = colleague(w, 'sobre-sorpresa', w.player.x - 100, w.player.y);
  assert.equal(farthestColleague(w, ph), mate);
  ph.damageTaken = 6;
  step(w, NO_INPUT);
  assert.equal(ph.transfer?.to, mate.id);
  const at = { x: ph.x, y: ph.y };
  mate.damageTaken = mate.def.hp;
  const events = run(w, 1);
  assert.ok(!events.some((e) => e.type === 'transferDone'));
  assert.equal(ph.transfer, undefined);
  assert.ok(Math.hypot(ph.x - at.x, ph.y - at.y) < 60);
});

test('a tiros de verdad: pasada la mitad, la tostadora que lo fija desde lejos acaba disparando a otro', () => {
  const { w, ph } = desk('a-tiros', 140);
  const far = colleague(w, 'sobre-sorpresa', w.player.x + 20, w.player.y - 110);
  hold(ph);
  ph.damageTaken = def.hp / 2 - 0.1;
  let swapped = false;
  for (let i = 0; i < ticks(4) && !swapped; i++) {
    hold(ph);
    w.player.weapon.ammo = w.player.weapon.def.magazine;
    step(w, { ...NO_INPUT, aimX: ph.x, aimY: ph.y - 12, fire: true });
    if (w.events.some((e) => e.type === 'transferDone')) swapped = true;
  }
  assert.ok(swapped, 'no se cambia de sitio');
  assert.ok(far.y > ph.y + 40 || Math.abs(far.x - ph.x) > 40, 'siguen en el mismo sitio');
});
