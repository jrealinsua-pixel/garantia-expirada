// M13 (6): el Móvil Reacondicionado. Notificaciones Push (balitas lentas que persiguen al enemigo
// más cercano); «Carga en movimiento» (andar en combate carga el objeto activo: una pila cada
// 600 px); «Batería al 1 %» (quieto 3 s en combate, se apaga 1 s: ni anda, ni rueda, ni dispara).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTERS } from '../src/data/characters.ts';
import type { PhoneAbility } from '../src/data/types.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { ACTIVE_ITEMS } from '../src/data/items.ts';
import { PHONE_OFF_LINE, PHONE_ON_LINE } from '../src/data/texts.ts';
import { textWidth } from '../src/art/font.ts';
import { createWorld, DT, giveActive, NO_INPUT, phoneIsOff, spawnEnemy, step, worldHash, type Enemy, type Input, type World } from '../src/sim/world.ts';
import { makeLowBattery, makePhone, makePhoneFrames, makePhoneOff, PHONE_FRAMES } from '../tools/sprites/movil.ts';
import { makeBlenderFrames } from '../tools/sprites/batidora-vaso.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const M = CHARACTERS.movil!;
const ab = M.ability as PhoneAbility;

/** The test room with nothing in the way, the character at (120, 200) and the dummies far off. */
function bare(seed: string, character = 'movil'): World {
  const w = createWorld({ seed, noEnemies: true, character });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  return w;
}

/** An enemy standing still at (x, y) that never attacks: a fight is on while it stands. */
function still(w: World, x: number, y: number, hp = 100): Enemy {
  const en = spawnEnemy(w.nextId++, { ...ENEMIES.microondas!, hp }, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** Walks left and right (half a second each way) for `secs`. */
function pace(w: World, secs: number, extra: Partial<Input> = {}): void {
  for (let i = 0; i < ticks(secs); i++) step(w, { ...NO_INPUT, ...extra, moveX: Math.floor(i / ticks(0.5)) % 2 ? -1 : 1 });
}

test('sus números y su dibujo: tres corazones, las Notificaciones Push, ocho fotogramas y la pantalla apagada', () => {
  assert.equal(M.maxHp, 6);
  assert.equal(M.speed, CHARACTERS.tostadora!.speed);
  assert.equal(M.startWeapon, 'notificaciones');
  assert.ok(ab.kind === 'phone' && ab.chargeEvery === 600 && ab.idleTime === 3 && ab.offTime === 1);
  const nw = WEAPONS.notificaciones!;
  assert.ok(nw.bullets?.homing, 'persiguen');
  const others = Object.values(WEAPONS).filter((x) => x.id !== 'notificaciones');
  assert.ok(nw.bulletSpeed < Math.min(...others.map((x) => x.bulletSpeed)), 'las balas más lentas');
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  for (const k of ['movil', 'movil-apagado', 'arma-notificaciones', 'bala-notificacion', 'bateria-baja']) assert.ok(keys.has(k), k);
  assert.equal(M.look.off, 'movil-apagado');
  const frames = makePhoneFrames();
  assert.equal(frames.length, 8);
  for (const f of [...frames, makePhoneOff()]) assert.deepEqual([f.w, f.h], [M.look.w, M.look.h]);
  // Its feet stand where the look says (the shoes' last row).
  const rest = makePhone(PHONE_FRAMES[0]!);
  const rows = Array.from({ length: rest.h }, (_, y) => y).filter((y) => Array.from({ length: 30 }, (_, x) => x + 10).some((x) => rest.get(x, y)[3] > 0));
  assert.equal(Math.max(...rows), M.look.feetY);
  // Taller than the blender (a phone stands on end) and, in the middle of the screen, dark glass.
  const top = (c: ReturnType<typeof makePhone>): number =>
    Math.min(...Array.from({ length: c.h }, (_, y) => y).filter((y) => Array.from({ length: c.w }, (_, x) => x).some((x) => c.get(x, y)[3] > 0)));
  // (M14c (a4d2): redrawn bigger, 40 × 48; tests/movil-a4d.test.ts.)
  assert.ok(M.look.feetY - top(rest) >= 40 && M.look.feetY - top(rest) <= 46, `alto ${M.look.feetY - top(rest)}`);
  assert.ok(top(rest) <= top(makeBlenderFrames()[0]!) + 2);
  const off = makePhoneOff();
  const [r, g, b] = off.get(18, 28);
  assert.ok(r + g + b < 120, 'la pantalla apagada es negra');
  assert.deepEqual([makeLowBattery().w, makeLowBattery().h], [11, 7]);
  for (const s of [PHONE_OFF_LINE, PHONE_ON_LINE]) assert.ok(textWidth(s) > 0 && textWidth(s) < 240, s);
});

test('las notificaciones persiguen: disparando hacia arriba, aciertan a un enemigo que está a un lado', () => {
  const w = bare('movil-push');
  const en = still(w, 220, 200);
  for (let i = 0; i < ticks(0.6); i++) step(w, { ...NO_INPUT, fire: i === 0 || i < ticks(0.2), aimX: w.player.x, aimY: w.player.y - 200 });
  for (let i = 0; i < ticks(2); i++) step(w, { ...NO_INPUT, aimX: w.player.x, aimY: w.player.y - 200 });
  assert.ok(en.damageTaken > 0, 'le ha dado');
  // With the toaster's dryer, the same shot misses.
  const t = bare('movil-push', 'tostadora');
  const te = still(t, 220, 200);
  for (let i = 0; i < ticks(0.6); i++) step(t, { ...NO_INPUT, fire: i < ticks(0.2), aimX: t.player.x, aimY: t.player.y - 200 });
  for (let i = 0; i < ticks(2); i++) step(t, NO_INPUT);
  assert.equal(te.damageTaken, 0);
});

test('carga en movimiento: andando en combate, una pila cada 600 px; sin combate o quieto, nada', () => {
  const w = bare('movil-carga');
  still(w, 300, 120);
  giveActive(w, 'espera', 0);
  const needs = ACTIVE_ITEMS.espera!.charges;
  const batteries: number[] = [];
  let walked = 0;
  for (let i = 0; i < ticks(14); i++) {
    const x0 = w.player.x;
    const y0 = w.player.y;
    step(w, { ...NO_INPUT, moveX: Math.floor(i / ticks(0.5)) % 2 ? -1 : 1 });
    walked += Math.hypot(w.player.x - x0, w.player.y - y0);
    for (const e of w.events) if (e.type === 'battery' && e.walked) batteries.push(walked);
  }
  assert.ok(batteries.length >= 2, `${batteries.length} pilas en ${Math.round(walked)} px`);
  assert.ok(Math.abs(batteries[0]! - 600) < 12, `la primera a ${batteries[0]} px`);
  assert.ok(Math.abs(batteries[1]! - 1200) < 12, `la segunda a ${batteries[1]} px`);
  assert.equal(w.player.active!.charge, Math.min(needs, batteries.length));
  // With no fight on, walking charges nothing.
  const calm = bare('movil-carga');
  giveActive(calm, 'espera', 0);
  pace(calm, 10);
  assert.equal(calm.player.active!.charge, 0);
  // Nor does the toaster.
  const t = bare('movil-carga', 'tostadora');
  still(t, 300, 120);
  giveActive(t, 'espera', 0);
  pace(t, 10);
  assert.equal(t.player.active!.charge, 0);
});

test('batería al 1 %: quieto 3 s en combate se apaga 1 s, sin moverse ni disparar; andar o rodar lo evitan', () => {
  const w = bare('movil-bateria');
  still(w, 300, 120);
  // Moving (and rolling) keeps it on.
  pace(w, 5);
  assert.ok(!phoneIsOff(w.player));
  // Standing still (shooting is not moving): off after 3 s.
  let offAt = -1;
  for (let i = 0; i < ticks(3.2) && offAt < 0; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: 300, aimY: 120 });
    if (w.events.some((e) => e.type === 'phoneOff' && !e.on)) offAt = (i + 1) * DT;
  }
  assert.ok(Math.abs(offAt - ab.idleTime) < 2 * DT, `apagado a los ${offAt} s`);
  // Off: it neither walks, nor rolls, nor shoots.
  const x0 = w.player.x;
  const bullets = w.bullets.filter((b) => b.owner === 'player').length;
  let onAt = -1;
  for (let i = 0; i < ticks(1.2) && onAt < 0; i++) {
    step(w, { ...NO_INPUT, moveX: 1, fire: true, roll: i % 10 === 0, aimX: 300, aimY: 120 });
    if (w.events.some((e) => e.type === 'phoneOff' && e.on)) onAt = (i + 1) * DT;
    else {
      assert.equal(w.player.x, x0, 'apagado no anda');
      assert.equal(w.player.rollT, -1, 'apagado no rueda');
      assert.ok(!w.events.some((e) => e.type === 'shot'), 'apagado no dispara');
    }
  }
  assert.ok(Math.abs(onAt - ab.offTime) < 2 * DT, `encendido a los ${onAt} s`);
  assert.ok(w.bullets.filter((b) => b.owner === 'player').length <= bullets);
  // Back on: it walks again.
  for (let i = 0; i < 10; i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.ok(w.player.x > x0);
  // A roll now and then is enough: the count starts again.
  const r = bare('movil-bateria');
  still(r, 300, 120);
  for (let i = 0; i < ticks(9); i++) step(r, { ...NO_INPUT, roll: i % ticks(2.5) === 0 });
  assert.ok(!r.events.some((e) => e.type === 'phoneOff'));
  assert.equal(r.player.offT ?? 0, 0);
  // With no fight on, or as the toaster, it never switches off.
  const calm = bare('movil-bateria');
  for (let i = 0; i < ticks(6); i++) step(calm, NO_INPUT);
  assert.ok(!phoneIsOff(calm.player) && (calm.player.stillT ?? 0) === 0);
  const t = bare('movil-bateria', 'tostadora');
  still(t, 300, 120);
  for (let i = 0; i < ticks(6); i++) step(t, NO_INPUT);
  assert.ok(!phoneIsOff(t.player));
});

test('el móvil es determinista', () => {
  const run = (): string => {
    const w = createWorld({ seed: 'movil-det', character: 'movil' });
    giveActive(w, 'encuesta', 0);
    for (let i = 0; i < ticks(12); i++) step(w, { ...NO_INPUT, moveX: i % 200 < 120 ? Math.sin(i / 30) : 0, moveY: Math.cos(i / 40), fire: i % 3 === 0, aimX: 300, aimY: 150 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
