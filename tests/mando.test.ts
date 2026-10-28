import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BlinkerBrain } from '../src/data/types.ts';
import { blinkSpot } from '../src/sim/enemies.ts';
import { checkInvariants, createWorld, isClear, NO_INPUT, step, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';

const def = ENEMIES.mando!;
const brain = def.brain as BlinkerBrain;
const ROW3 = 3 * 24 + 12;

/** Test room with a single remote at (ex, row 3) and the toaster at (px, row 3). */
function arena(ex: number, px: number, seed = 'mando'): { w: World; en: Enemy } {
  const w = createWorld({ seed });
  const en = w.enemies.find((e) => e.def.id === 'mando')!;
  w.enemies = [en];
  en.x = ex;
  en.y = ROW3;
  w.player.x = px;
  w.player.y = ROW3;
  w.noDamage = true;
  return { w, en };
}

function runUntil(w: World, pred: (e: SimEvent) => boolean, maxTicks = 600): SimEvent | null {
  for (let i = 0; i < maxTicks; i++) {
    step(w, NO_INPUT);
    const e = w.events.find(pred);
    if (e) return e;
  }
  return null;
}

test('mando: vienen en grupo de tres, en suelo libre y separados', () => {
  const w = createWorld({ seed: 'grupo' });
  const ms = w.enemies.filter((e) => e.def.id === 'mando');
  assert.equal(ms.length, def.pack);
  for (const m of ms) assert.ok(isClear(w, m.x, m.y, def.footRadius), `mando en ${m.x},${m.y} libre`);
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) assert.ok(Math.hypot(ms[i]!.x - ms[j]!.x, ms[i]!.y - ms[j]!.y) > 12);
  // They do not all attack at the same moment.
  assert.equal(new Set(ms.map((m) => m.until)).size, ms.length);
});

test('mando: avisa, dispara su ráfaga y se teletransporta lejos de donde estaba', () => {
  const { w, en } = arena(300, 180);
  const warn = runUntil(w, (e) => e.type === 'telegraph' && e.source === en.id);
  assert.ok(warn, 'avisa antes de disparar');
  const before = w.bullets.filter((b) => b.owner === 'enemy').length;
  const out = runUntil(w, (e) => e.type === 'blinkOut' && e.source === en.id, 200);
  assert.ok(out && out.type === 'blinkOut', 'se apaga después de disparar');
  assert.ok(w.bullets.filter((b) => b.owner === 'enemy').length - before >= 3, 'ha soltado la ráfaga');
  const from = { x: out.x, y: out.y };
  assert.equal(en.state, 'blink');
  const inn = runUntil(w, (e) => e.type === 'blinkIn' && e.source === en.id, 120);
  assert.ok(inn && inn.type === 'blinkIn');
  assert.ok(Math.abs(inn.x - out.tx) < 0.01 && Math.abs(inn.y - out.ty) < 0.01, 'aparece donde anunció la estática');
  assert.ok(Math.hypot(inn.x - from.x, inn.y - from.y) > 10, 'no aparece donde estaba');
  const d = Math.hypot(inn.x - w.player.x, inn.y - w.player.y);
  assert.ok(d >= brain.hop[0] * 0.75 && d <= brain.hop[1] + 1, `a distancia de salto (${d.toFixed(0)})`);
  assert.deepEqual(checkInvariants(w), []);
});

test('mando: mientras no está, ni recibe balas ni empuja', () => {
  const { w, en } = arena(240, 180);
  en.state = 'gone';
  en.t = 0;
  en.until = 5;
  en.dest = { x: 240, y: ROW3 + 60 };
  const p = w.player;
  for (let i = 0; i < 40; i++) step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
  assert.equal(en.damageTaken, 0, 'las balas lo atraviesan');
  // Standing right on top of it does nothing either.
  p.x = en.x;
  p.y = en.y;
  const hp = p.hp;
  w.noDamage = false;
  for (let i = 0; i < 30; i++) step(w, NO_INPUT);
  assert.equal(p.hp, hp);
});

test('mando: al recibir un disparo se esfuma, pero no a cada disparo', () => {
  const { w, en } = arena(260, 180);
  en.until = 99; // not attacking
  let outs = 0;
  for (let i = 0; i < 120 && en.damageTaken < 1; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 14 });
    if (w.events.some((e) => e.type === 'blinkOut')) outs++;
  }
  assert.ok(en.damageTaken >= 1, 'le da');
  for (let i = 0; i < 3; i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'blinkOut')) outs++;
  }
  assert.equal(outs, 1, 'se apaga al recibir el golpe');
  // Back on, a second hit inside the cooldown does not send it away again.
  runUntil(w, (e) => e.type === 'blinkIn', 120);
  en.until = 99;
  en.damageTaken += 1;
  step(w, NO_INPUT);
  assert.equal(en.state, 'idle', 'con el enfriamiento, aguanta el golpe');
});

test('mando: prefiere aparecer fuera de la mira', () => {
  let behind = 0;
  const N = 60;
  for (let i = 0; i < N; i++) {
    const { w, en } = arena(300, 300, `mira${i}`);
    w.player.y = 7 * 24 + 12;
    en.y = w.player.y;
    w.player.aim = 0; // looking right
    const s = blinkSpot(w, en, brain);
    assert.ok(isClear(w, s.x, s.y, def.footRadius));
    if (s.x < w.player.x) behind++;
  }
  assert.ok(behind / N > 0.75, `aparece detrás casi siempre (${behind}/${N})`);
});
