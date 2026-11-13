// El Asistente Virtual (M11 (4c), Atención al Cliente): a touch-screen totem that keeps its
// distance and sends speech bubbles that stop halfway («Escribiendo…») and set off again towards
// where the toaster is going. It learns: three hits in a row from nearly the same side (within 60°)
// and up goes its shield of frequently asked questions on that side for 3 s; it has to be shot from
// somewhere else. When it breaks, «¿Le he ayudado?» and two slow buttons, SÍ and NO.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { SLOT_ENEMIES_4, SLOT_ENEMIES_5, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { DOWN_CAUSES, FAQ_LINE, HELP_ASK_LINE, TYPING_LINE } from '../src/data/texts.ts';
import type { ChatbotBrain } from '../src/data/types.ts';
import { createWorld, DT, faqBlocks, NO_INPUT, spawnEnemy, step, type Enemy, type Input, type World } from '../src/sim/world.ts';

const def = ENEMIES['asistente-virtual']!;
const brain = def.brain as ChatbotBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/** An empty room with the toaster (untouchable) and the assistant `dx` px to its right, standing still if `still`. */
function counter(seed: string, dx = 120, still = false): { w: World; a: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2 - 40;
  w.player.y = w.room.h / 2 + 10;
  const a = spawnEnemy(w.nextId++, def, w.player.x + dx, w.player.y);
  if (still) {
    // Typing for ever: it stands still and sends nothing.
    a.state = 'warn';
    a.until = 999;
  }
  w.enemies = [a];
  return { w, a };
}

/** Shoots at the assistant from where the toaster stands until `hits` more bullets have hit or been stopped. */
function shootAt(w: World, a: Enemy, hits: number): { hit: number; blocked: number } {
  let hit = 0;
  let blocked = 0;
  for (let i = 0; i < ticks(6) && hit + blocked < hits; i++) {
    w.player.weapon.ammo = w.player.weapon.def.magazine;
    const input: Input = { ...NO_INPUT, aimX: a.x, aimY: a.y - 16, fire: true };
    step(w, input);
    for (const e of w.events) {
      if (e.type === 'hit' && e.target === a.id) hit++;
      if (e.type === 'faqBlock') blocked++;
    }
  }
  return { hit, blocked };
}

test('el asistente es contenido: datos, sprites, bocadillos, botones, textos, causa de baja y solo desde la planta 5', () => {
  assert.equal(def.name, 'Asistente Virtual');
  assert.equal(def.hp, 9);
  assert.equal(brain.learn, 3);
  assert.equal(brain.sameDeg, 60);
  assert.equal(brain.shield, 3);
  const bubbles = PATTERNS[brain.pattern]!;
  assert.ok(bubbles.kind === 'fan' && bubbles.pause && bubbles.color === 'bubble');
  const buttons = PATTERNS[brain.farewell]!;
  assert.ok(buttons.kind === 'fan' && buttons.count === 2 && buttons.color === 'help' && buttons.speed < 60);
  const lines = [def.name, def.description, TYPING_LINE, FAQ_LINE].join(' ');
  assert.ok(!/[!¡]/.test(lines));
  assert.equal(HELP_ASK_LINE, '¿Le he ayudado?');
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  for (const k of ['asistente-virtual', 'bocadillo', 'escudo-faq', 'boton-ayuda']) assert.ok(sheets[k], `falta el sprite ${k}`);
  assert.ok(DOWN_CAUSES['asistente-virtual']?.bullet && DOWN_CAUSES['asistente-virtual'].contact);
  assert.ok(!SLOT_ENEMIES_4.some((s) => s.ch === 'É'));
  assert.equal(SLOT_ENEMIES_5.find((s) => s.ch === 'É')?.max, 2);
  const tpl = templatesOf('combat', 5)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-e'), { depth: 3, pool: [{ ch: 'É', cost: 1, weight: 1, max: 1 }] });
  const ws = createWorld({ seed: 'letra-e', template: filled });
  assert.equal(ws.enemies.filter((e) => e.def.id === 'asistente-virtual').length, 1);
});

test('escribe y manda bocadillos que se paran a mitad de camino y siguen hacia donde va la tostadora', () => {
  const { w, a } = counter('bocadillos', 150);
  a.until = 0.1;
  let typed = false;
  // Fired: they leave, stop at `at` s for `wait` s, and set off again.
  for (let i = 0; i < ticks(1.2) && !w.bullets.some((b) => b.color === 'bubble'); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'typing')) typed = true;
  }
  assert.ok(typed, 'no escribe');
  const bubbles = w.bullets.filter((b) => b.color === 'bubble');
  assert.equal(bubbles.length, 3);
  const b0 = bubbles[0]!;
  const p = brain.pattern && PATTERNS[brain.pattern]!;
  const pause = p && 'pause' in p ? p.pause! : { at: 0, wait: 0, lead: 0 };
  const go: Input = { ...NO_INPUT, moveY: 1 };
  let stoppedAt: { x: number; y: number } | null = null;
  let resumedDir: number | null = null;
  for (let i = 0; i < ticks(2) && resumedDir === null; i++) {
    step(w, go);
    if (b0.age > pause.at + 0.05 && b0.age < pause.at + pause.wait - 0.05) {
      if (!stoppedAt) stoppedAt = { x: b0.x, y: b0.y };
      assert.ok(Math.hypot(b0.x - stoppedAt.x, b0.y - stoppedAt.y) < 0.01, 'el bocadillo no se para');
    }
    if (b0.resumed) resumedDir = b0.dir;
  }
  assert.ok(stoppedAt, 'no llega a pararse');
  assert.ok(resumedDir !== null, 'no sigue');
  // It set off ahead of the toaster (walking down): aimed below where the toaster is now.
  const pl = w.player;
  const now = Math.atan2(pl.y - 16 - b0.y, pl.x - b0.x);
  assert.ok(Math.sin(resumedDir - now) * Math.sign(pl.x - b0.x) > 0.02, 'no apunta adonde va la tostadora');
});

test('aprende: tres balas desde el mismo lado y sube el escudo de ese lado, que para lo que llega por él 3 s', () => {
  const { w, a } = counter('aprende', 110, true);
  const first = shootAt(w, a, 3);
  assert.equal(first.hit, 3);
  assert.ok(a.faq, 'no sube el escudo');
  assert.ok(w.events.some((e) => e.type === 'faqUp') || a.faq);
  // Facing the toaster (on its left).
  assert.ok(Math.cos(a.faq!.dir) < -0.8, `el escudo mira a ${(a.faq!.dir * 180 / Math.PI).toFixed(0)}°`);
  const taken = a.damageTaken;
  const again = shootAt(w, a, 3);
  assert.equal(again.blocked, 3, 'el escudo no para las balas de ese lado');
  assert.equal(a.damageTaken, taken);
  // From the other side, it gets hurt.
  w.player.x = a.x + 110;
  const other = shootAt(w, a, 2);
  assert.equal(other.hit, 2);
  assert.ok(a.damageTaken > taken);
  // And it wears off after 3 s.
  for (let i = 0; i < ticks(brain.shield); i++) step(w, NO_INPUT);
  assert.equal(a.faq, undefined);
  assert.equal(faqBlocks(a, Math.PI), false);
});

test('desde sitios distintos no aprende nada', () => {
  const { w, a } = counter('no-aprende', 100, true);
  const spots = [[-100, 0], [0, 90], [100, 0], [0, -80], [-90, 40], [90, -40]] as const;
  for (const [ox, oy] of spots) {
    w.player.x = a.x + ox;
    w.player.y = a.y + oy;
    shootAt(w, a, 1);
    assert.equal(a.faq, undefined, `escudo tras disparar desde ${ox},${oy}`);
  }
});

test('al romperse pregunta «¿Le he ayudado?» y suelta los dos botones, lentos', () => {
  const { w, a } = counter('valoracion', 120, true);
  a.damageTaken = a.def.hp - 0.1;
  let asked = false;
  for (let i = 0; i < ticks(1.5); i++) {
    w.player.weapon.ammo = w.player.weapon.def.magazine;
    step(w, { ...NO_INPUT, aimX: a.x, aimY: a.y - 16, fire: !asked });
    if (w.events.some((e) => e.type === 'helpAsk')) asked = true;
  }
  assert.ok(asked, 'no pregunta');
  const buttons = w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'help');
  assert.equal(buttons.length, 2);
  for (const b of buttons) assert.ok(b.speed < 60);
});
