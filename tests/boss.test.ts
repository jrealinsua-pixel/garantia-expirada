import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from '../src/sim/bot.ts';
import { BOSS_INTRO, BOSS_INTRO_SKIP, createWorld, DT, NO_INPUT, step, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

function bossRoom(seed = 'jefe'): World {
  return createWorld({ seed, room: 'jefe' });
}

test('jefe: la Nevera Suprema espera en su sala, con las persianas bajadas y su presentación', () => {
  const w = bossRoom();
  const boss = w.enemies.find((e) => e.def.id === 'nevera-suprema');
  assert.ok(boss, 'la nevera está en la sala');
  assert.equal(w.enemies.length, 1);
  assert.equal(w.doorsShut, true);
  assert.ok(w.intro && w.intro.boss === boss.id, 'empieza la presentación');
  assert.equal(boss.def.boss?.title, 'La Nevera Suprema');
  assert.ok((boss.def.boss?.motto.length ?? 0) > 0);
});

test('jefe: durante la presentación nada se mueve y al acabar empieza el combate', () => {
  const w = bossRoom();
  const p = w.player;
  const x0 = p.x;
  const y0 = p.y;
  const ends: SimEvent[] = [];
  for (let i = 0; i < ticks(BOSS_INTRO) - 2; i++) {
    step(w, { ...NO_INPUT, moveX: 1, moveY: -1, aimX: p.x + 50, aimY: p.y, fire: true, roll: i === 3 });
    ends.push(...w.events.filter((e) => e.type === 'bossIntroEnd'));
  }
  assert.ok(w.intro, 'todavía en la presentación');
  assert.equal(ends.length, 0);
  assert.equal(p.x, x0);
  assert.equal(p.y, y0);
  assert.equal(w.bullets.length, 0, 'no se dispara');
  assert.ok(Math.sin(p.aim) < 0, 'la tostadora mira a la nevera, que está arriba');
  for (let i = 0; i < 4; i++) {
    step(w, NO_INPUT);
    ends.push(...w.events.filter((e) => e.type === 'bossIntroEnd'));
  }
  assert.equal(w.intro, null);
  assert.deepEqual(ends.map((e) => e.type === 'bossIntroEnd' && e.skipped), [false]);
  step(w, { ...NO_INPUT, moveX: 1, aimX: p.x + 50, aimY: p.y });
  assert.ok(p.x > x0, 'ya se mueve');
});

test('jefe: la presentación se salta pulsando disparo otra vez, no manteniéndolo', () => {
  const held = bossRoom();
  for (let i = 0; i < ticks(BOSS_INTRO_SKIP + 0.5); i++) step(held, { ...NO_INPUT, fire: true });
  assert.ok(held.intro, 'manteniendo el disparo desde la sala anterior no se salta');

  const w = bossRoom();
  for (let i = 0; i < ticks(BOSS_INTRO_SKIP / 2); i++) step(w, NO_INPUT);
  step(w, { ...NO_INPUT, fire: true });
  assert.ok(w.intro, 'demasiado pronto para saltarla');
  for (let i = 0; i < ticks(BOSS_INTRO_SKIP / 2) && w.intro; i++) step(w, { ...NO_INPUT, fire: i % 2 === 0 });
  for (let i = 0; i < 3 && w.intro; i++) step(w, { ...NO_INPUT, fire: i % 2 === 0 });
  assert.equal(w.intro, null);
});

test('jefe: en cada planta la sala del jefe trae a la Nevera Suprema', () => {
  for (let i = 0; i < 50; i++) {
    const w = createWorld({ seed: `planta-jefe-${i}`, floor: true });
    const f = w.floor!;
    const boss = f.layout.rooms.find((r) => r.kind === 'boss')!;
    const rows = f.rooms[boss.id]!.template.rows.join('');
    assert.equal([...rows].filter((c) => c === 'N').length, 1, `planta ${i}`);
    assert.ok(!rows.includes('J'));
  }
});

test('jefe: el bot (sin daño) la desmonta y las persianas suben', () => {
  const w = bossRoom('jefe-bot');
  w.noDamage = true;
  const bot = new Bot('jefe-bot');
  let opened = false;
  for (let t = 0; t < ticks(150) && !opened; t++) {
    step(w, bot.think(w));
    opened = w.events.some((e) => e.type === 'doors' && !e.shut);
  }
  assert.ok(opened, `la nevera sigue en pie con ${w.enemies[0]?.damageTaken} de daño`);
  assert.equal(w.enemies.length, 0);
});
