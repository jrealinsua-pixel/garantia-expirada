import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fontText, textWidth } from '../src/art/font.ts';
import { winReport, WIN_NEXT, WIN_NOTES } from '../src/data/texts.ts';
import { Bot } from '../src/sim/bot.ts';
import { BOSS_DEATH, checkInvariants, createWorld, DT, isClear, LIFT_HALF, LIFT_READY, NO_INPUT, onLift, step, worldHash } from '../src/sim/world.ts';
import type { Enemy, Input, SimEvent, World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The boss room right after the fridge has come apart (no damage). */
function afterBoss(seed = 'montacargas'): { w: World; events: SimEvent[] } {
  const w = createWorld({ seed, room: 'jefe' });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.boss) as Enemy;
  boss.damageTaken = boss.def.hp;
  const events: SimEvent[] = [];
  for (let i = 0; i < ticks(BOSS_DEATH) + 5; i++) {
    step(w, NO_INPUT);
    events.push(...w.events);
  }
  return { w, events };
}

/** Walks the toaster's feet straight towards (x, y). */
const walkTo = (w: World, x: number, y: number): Input => {
  const dx = x - w.player.x;
  const dy = y - w.player.y;
  const d = Math.hypot(dx, dy) || 1;
  return { ...NO_INPUT, moveX: dx / d, moveY: dy / d, aimX: x, aimY: y };
};

test('la jefa suelta un corazón y el montacargas sube en suelo libre donde cayó', () => {
  const { w, events } = afterBoss();
  assert.equal(w.enemies.length, 0);
  assert.ok(events.some((e) => e.type === 'lift'));
  assert.equal(w.pickups.filter((k) => k.kind === 'corazon').length, 1);
  assert.ok(w.pickups.filter((k) => k.kind === 'cupon').length >= 10);
  const l = w.lift!;
  assert.ok(l, 'no hay montacargas');
  assert.ok(isClear(w, l.x, l.y, Math.max(LIFT_HALF.x, LIFT_HALF.y)), 'el montacargas pisa algo');
});

test('los cupones de la jefa salen despedidos y no se quedan encima del montacargas', () => {
  for (const seed of ['cupones-1', 'cupones-2', 'cupones-3', 'cupones-4', 'cupones-5']) {
    const { w } = afterBoss(seed);
    for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
    const l = w.lift!;
    const coupons = w.pickups.filter((k) => k.kind === 'cupon');
    assert.ok(coupons.length + w.player.coupons >= 10, seed);
    // Off the plate with room to spare: not even the edge of a coupon (4 px) on it.
    const on = coupons.filter((k) => Math.abs(k.x - l.x) < LIFT_HALF.x + 4 && Math.abs(k.y - l.y) < LIFT_HALF.y + 4);
    assert.deepEqual(on.map((k) => `${k.x.toFixed(0)},${k.y.toFixed(0)}`), [], `${seed}: cupones sobre el montacargas en ${l.x.toFixed(0)},${l.y.toFixed(0)}`);
    assert.ok(!coupons.some((k) => onLift(l, k.x, k.y)));
  }
});

test('el corazón cura medio corazón por mitad y se queda en el suelo con la vida llena', () => {
  const { w } = afterBoss('corazon');
  const heart = w.pickups.find((k) => k.kind === 'corazon')!;
  // (The heart lies on the lift: keep the lift from taking the toaster meanwhile.)
  w.lift!.t = -999;
  // Full life: walking over it does nothing.
  for (let i = 0; i < ticks(4); i++) step(w, walkTo(w, heart.x, heart.y + 2));
  assert.ok(w.pickups.includes(heart), 'se lo ha comido con la vida llena');
  // Hurt: now it gives a heart back (2 life), no more than the maximum.
  w.player.hp = w.player.def.maxHp - 3;
  let got: SimEvent | undefined;
  for (let i = 0; i < ticks(2) && !got; i++) {
    step(w, walkTo(w, heart.x, heart.y + 2));
    got = w.events.find((e) => e.type === 'pickup' && e.kind === 'corazon');
  }
  assert.ok(got, 'no lo recoge');
  assert.equal(w.player.hp, w.player.def.maxHp - 1);
  assert.ok(!w.pickups.includes(heart));
});

test('el montacargas solo se lleva a la tostadora cuando está listo; luego el mundo se queda quieto', () => {
  const { w, events } = afterBoss('bajar');
  const l = w.lift!;
  assert.ok(l.t < LIFT_READY);
  // Standing on it before it is ready does nothing.
  w.player.x = l.x;
  w.player.y = l.y;
  step(w, NO_INPUT);
  assert.equal(w.won, false);
  const seen: SimEvent[] = [...events];
  for (let i = 0; i < ticks(LIFT_READY) && !w.won; i++) {
    step(w, NO_INPUT);
    seen.push(...w.events);
  }
  assert.ok(seen.some((e) => e.type === 'liftReady'));
  assert.equal(w.won, true);
  const done = seen.find((e) => e.type === 'floorDone');
  assert.ok(done && done.type === 'floorDone' && done.kills === 1);
  // Gone down: nothing moves any more.
  // (Only the clock goes on: the hash without the tick.)
  const still = (): string => worldHash(w).split('|').filter((_, i) => i !== 1).join('|');
  const h = still();
  for (let i = 0; i < 60; i++) step(w, { ...NO_INPUT, moveX: 1, fire: true });
  assert.equal(still(), h);
  assert.deepEqual(checkInvariants(w), []);
});

test('rodando por encima no se baja', () => {
  const { w } = afterBoss('rodar');
  const l = w.lift!;
  l.t = LIFT_READY + 1;
  w.player.x = l.x - LIFT_HALF.x - 10;
  w.player.y = l.y;
  let rolled = false;
  for (let i = 0; i < 20; i++) {
    step(w, { ...NO_INPUT, moveX: 1, roll: i === 0, aimX: l.x + 100, aimY: l.y });
    if (w.player.rollT >= 0 && Math.abs(w.player.x - l.x) < 6) rolled = true;
    if (w.player.rollT >= 0) assert.equal(w.won, false);
  }
  assert.ok(rolled, 'la prueba no ha rodado por encima');
});

test('el bot gana a la jefa y baja en el montacargas', () => {
  const seed = 'jefe-0';
  const w = createWorld({ seed, room: 'jefe' });
  w.intro = null;
  w.noDamage = true;
  const bot = new Bot(seed);
  for (let i = 0; i < ticks(200) && !w.won; i++) step(w, bot.think(w));
  assert.equal(w.won, true);
});

test('el informe de planta superada cabe en el formulario', () => {
  for (const n of WIN_NOTES) assert.ok(textWidth(fontText(n)) <= 276, n);
  for (const n of WIN_NEXT) assert.ok(textWidth(fontText(n)) <= 210, n);
  const lines = winReport({ room: 'Cámara Frigorífica de la Dirección', seconds: 999, kills: 99, coupons: 999 }, () => 0);
  assert.equal(lines.length, 6);
  for (const ln of lines.slice(0, 5)) assert.ok(textWidth(fontText(ln.text)) <= 210, ln.text);
});
