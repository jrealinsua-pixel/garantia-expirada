// El Sello de Denegado (M10 planta 4 (4c), Oficinas): hops towards the toaster and every third hop
// stamps: up in the air over where it stands (a square shadow warns), down with a thud, and a
// square of red ink on the floor for 5 s. Caught under it: half a heart. Inside the ink the toaster
// cannot roll: «Solicitud denegada», a clumsy step with no invulnerability.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_3, SLOT_ENEMIES_4, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { DOWN_CAUSES, ROLL_DENIED_LINE, STAMP_LINE } from '../src/data/texts.ts';
import type { StamperBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import {
  activeWarnings, createWorld, DT, enterRoom, dummyHurtBox, enemyAltitude, inkUnder, isRolling, NO_INPUT, spawnEnemy, stampInk, step, worldHash, type Enemy, type World,
} from '../src/sim/world.ts';

const def = ENEMIES.sello!;
const brain = def.brain as StamperBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/** An empty room with the toaster in the middle (untouchable unless `hurt`) and the stamp `dx` px to its right. */
function office(seed: string, dx = 120, hurt = false): { w: World; st: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = !hurt;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const st = spawnEnemy(w.nextId++, def, w.player.x + dx, w.player.y);
  w.enemies = [st];
  return { w, st };
}

/** Runs until the stamp starts rising to stamp (or `max` s go by). */
function untilRise(w: World, st: Enemy, max = 8): void {
  for (let i = 0; i < ticks(max) && st.state !== 'warn'; i++) step(w, NO_INPUT);
}

/** Runs until the stamp has stamped (state `brake`) or `max` s go by. */
function untilStamp(w: World, st: Enemy, max = 8): void {
  for (let i = 0; i < ticks(max) && st.state !== 'brake'; i++) step(w, NO_INPUT);
}

test('el sello es contenido: datos, sprites, gotas, tinta, textos, causa de baja y solo desde la planta 4', () => {
  assert.equal(def.name, 'Sello de Denegado');
  assert.equal(def.hp, 10);
  assert.ok(!/[!¡]/.test(def.name + def.description + ROLL_DENIED_LINE + STAMP_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number; frameW: number }>;
  for (const k of ['sello', 'bala-tinta', 'tinta-denegado']) assert.ok(sheets[k], `falta el sprite ${k}`);
  assert.equal(sheets['tinta-denegado']!.frameW, brain.ink.w, 'la tinta se dibuja del tamaño que ocupa');
  assert.ok(DOWN_CAUSES.sello?.bullet && DOWN_CAUSES.sello.contact);
  assert.ok(!SLOT_ENEMIES_3.some((s) => s.ch === 'G'));
  assert.equal(SLOT_ENEMIES_4.find((s) => s.ch === 'G')?.max, 2);
  const tpl = templatesOf('combat', 4)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-g'), { depth: 3, pool: [{ ch: 'G', cost: 1, weight: 1, max: 1 }] });
  assert.ok(createWorld({ seed: 'letra-g', template: filled }).enemies.some((e) => e.def.id === 'sello'));
});

test('avanza a saltos hacia la tostadora, en el aire se le da donde se le ve, y cada tercer salto estampa', () => {
  const { w, st } = office('saltos', 200);
  const order: string[] = [];
  let maxAlt = 0;
  let raised = false;
  const start = Math.hypot(st.x - w.player.x, st.y - w.player.y);
  for (let i = 0; i < ticks(10) && order.filter((o) => o === 'stamp').length < 2; i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'hop' || e.type === 'stampRise' || e.type === 'stamp') order.push(e.type === 'stampRise' ? 'rise' : e.type);
    if (st.state === 'charge') {
      const alt = enemyAltitude(st);
      maxAlt = Math.max(maxAlt, alt);
      if (alt > 4) raised ||= Math.abs(dummyHurtBox(st).y - (st.y + def.hurt.y - alt)) < 1e-9;
    }
  }
  assert.deepEqual(order.slice(0, 6), ['hop', 'hop', 'rise', 'stamp', 'hop', 'hop'], 'dos saltos y el tercero estampa');
  assert.ok(maxAlt > brain.hopHeight * 0.9 && maxAlt <= brain.hopHeight + 1e-9, 'salta a su altura');
  assert.ok(raised, 'en el aire la caja de golpe sube con él');
  assert.ok(Math.hypot(st.x - w.player.x, st.y - w.player.y) < start - 60, 'se acerca');
});

test('para estampar sube, planea hasta encima de la tostadora con una sombra cuadrada de aviso y cae', () => {
  const { w, st } = office('aviso', 90);
  untilRise(w, st);
  assert.equal(st.state, 'warn');
  assert.ok(Math.abs(st.until - brain.telegraph) < 1e-9, 'medio segundo de aviso');
  const dest = { ...st.dest! };
  assert.ok(Math.hypot(dest.x - w.player.x, dest.y - w.player.y) < 1, 'apunta a donde está la tostadora');
  const wn = activeWarnings(w).find((x) => x.source === st.id);
  assert.equal(wn?.mark, 'stamp');
  assert.deepEqual(wn?.size, { w: brain.ink.w, h: brain.ink.h });
  assert.equal(enemyFrame(st, 0), def.anim!.warn, 'con cara de estampar');
  while (st.state === 'warn') step(w, NO_INPUT);
  assert.equal(st.state, 'fire');
  assert.ok(Math.hypot(st.x - dest.x, st.y - dest.y) < 1.5, 'llega justo encima');
  assert.ok(enemyAltitude(st) > brain.slamHeight * 0.9, 'arriba del todo');
  untilStamp(w, st);
  assert.equal(enemyAltitude(st), 0, 'ya en el suelo');
  assert.equal(enemyFrame(st, 0), def.anim!.out, 'aplastado');
});

test('no estampa más lejos de su alcance', () => {
  const { w, st } = office('alcance', 160);
  st.volleys = 1;
  st.until = 0;
  step(w, NO_INPUT);
  assert.equal(st.state, 'warn');
  assert.ok(Math.hypot(st.dest!.x - (w.player.x + 160), st.dest!.y - w.player.y) <= brain.reach + 1, 'como mucho su alcance');
});

test('estampa un cuadro de tinta de 5 s; pillar a la tostadora debajo quita medio corazón; si no, salpica ocho gotas', () => {
  const { w, st } = office('golpe', 90, true);
  const hp = w.player.hp;
  untilRise(w, st);
  let hurtInAir = false;
  while (st.state === 'warn' || st.state === 'fire') {
    step(w, NO_INPUT);
    if ((st.state as string) !== 'brake' && w.events.some((e) => e.type === 'hurt')) hurtInAir = true;
  }
  assert.ok(!hurtInAir, 'en el aire, encima, no hace daño: lo hace al caer');
  assert.equal(w.player.hp, hp - brain.damage, 'medio corazón');
  assert.equal(w.ink.length, 1);
  const ink = w.ink[0]!;
  assert.deepEqual([ink.w, ink.h, ink.life], [brain.ink.w, brain.ink.h, brain.ink.life]);
  assert.ok(inkUnder(w, w.player.x, w.player.y), 'la tostadora está en la tinta');
  // Like every hit, it clears the enemy bullets in the air: its own drops too.
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0);
  // Not under it: no harm, but the drops still splash.
  const o = office('fallo', 90, true);
  untilRise(o.w, o.st);
  o.w.player.x -= 60;
  const hp2 = o.w.player.hp;
  untilStamp(o.w, o.st);
  assert.equal(o.w.player.hp, hp2);
  assert.ok(o.w.events.some((e) => e.type === 'stamp' && !e.hit));
  for (let i = 0; i < 2; i++) step(o.w, NO_INPUT);
  assert.equal(o.w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'ink').length, 8, 'un anillo de ocho gotas');
  // The ink dries in its 5 s.
  for (let i = 0; i < ticks(brain.ink.life - 0.3); i++) step(w, { ...NO_INPUT, moveX: 0 });
  assert.equal(w.ink.filter((k) => k.id === ink.id).length, 1, 'sigue a los 4,7 s');
  for (let i = 0; i < ticks(0.4); i++) step(w, NO_INPUT);
  assert.equal(w.ink.filter((k) => k.id === ink.id).length, 0, 'y se seca');
});

test('dentro de la tinta no se rueda: «Solicitud denegada», un paso torpe y sin invulnerabilidad', () => {
  const w = createWorld({ seed: 'rodar', noEnemies: true });
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  stampInk(w, w.player.x, w.player.y, brain.ink, 999);
  const x0 = w.player.x;
  step(w, { ...NO_INPUT, roll: true, moveX: 1 });
  assert.ok(!isRolling(w.player), 'no rueda');
  assert.equal(w.player.invulnerable, 0, 'sin invulnerabilidad');
  assert.ok(w.events.some((e) => e.type === 'rollDenied'));
  assert.ok(w.player.x > x0, 'da un paso');
  for (let i = 0; i < ticks(0.3); i++) step(w, { ...NO_INPUT, moveX: 1 });
  const lurch = w.player.x - x0;
  assert.ok(lurch < w.player.def.rollSpeed * w.player.def.rollTime * 0.6, `un paso, no una voltereta (${lurch.toFixed(1)} px)`);
  // Spamming the button does not help: it waits as long as after a roll, and a bit more.
  step(w, { ...NO_INPUT, roll: true, moveX: 1 });
  assert.ok(!w.events.some((e) => e.type === 'rollDenied' || e.type === 'roll'));
  // Andar y disparar, sí; out of the ink, it rolls again.
  w.player.x = x0 + brain.ink.w;
  w.player.rollCooldown = 0;
  step(w, { ...NO_INPUT, roll: true, moveX: 1 });
  assert.ok(isRolling(w.player), 'fuera de la tinta rueda');
});

test('como mucho tres cuadros de tinta suyos: el más viejo se seca antes', () => {
  const { w, st } = office('tope', 90);
  const ids: number[] = [];
  for (let n = 0; n < 4; n++) {
    st.volleys = 1;
    st.state = 'idle';
    st.t = 0;
    st.until = 0;
    w.player.x += n % 2 ? 50 : -50;
    untilStamp(w, st);
    ids.push(w.ink.at(-1)!.id);
  }
  assert.equal(w.ink.filter((k) => k.source === st.id).length, brain.ink.max);
  assert.ok(!w.ink.some((k) => k.id === ids[0]), 'el primero ya no está');
  // Another stamp's ink does not count against it.
  stampInk(w, 30, 30, brain.ink, 12345);
  assert.equal(w.ink.length, brain.ink.max + 1);
});

test('la tinta se queda en su sala: al cruzar una puerta no hay', () => {
  const w = createWorld({ seed: 'sala', floor: true });
  stampInk(w, w.player.x, w.player.y, brain.ink, 1);
  assert.equal(w.ink.length, 1);
  const f = w.floor!;
  const door = f.layout.rooms[f.current]!.doors[0]!;
  enterRoom(w, door.to, door.dir);
  assert.equal(w.ink.length, 0);
  assert.equal(inkUnder(w, w.player.x, w.player.y), undefined);
});

test('determinista: dos salas iguales acaban igual', () => {
  const run = (): string => {
    const { w } = office('det', 150, true);
    for (let i = 0; i < ticks(12); i++) step(w, { ...NO_INPUT, moveX: Math.sin(i / 40), roll: i % 50 === 0 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
