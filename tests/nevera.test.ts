import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { isWallAt } from '../src/sim/room.ts';
import { bossPhaseFor } from '../src/sim/enemies.ts';
import { createWorld, DT, frostSlow, NO_INPUT, step, throwFrost, worldHash, type Enemy, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The boss room with the entrance already over. */
function fight(seed = 'nevera'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe' });
  w.intro = null;
  const boss = w.enemies.find((e) => e.def.boss)!;
  return { w, boss };
}

/** Strafes left and right below the boss, never shooting, so the fight goes on. */
function dance(w: World, i: number): Input {
  return { ...NO_INPUT, moveX: Math.sin(i / 50) > 0 ? 1 : -1, aimX: w.player.x, aimY: w.player.y - 50 };
}

test('nevera fase 1: dispara cubitos y lanza escarcha', () => {
  const { w } = fight();
  w.noDamage = true;
  let ice = 0;
  let thrown = 0;
  let landed = 0;
  for (let i = 0; i < ticks(25); i++) {
    step(w, dance(w, i));
    for (const e of w.events) {
      if (e.type === 'frostThrow') thrown++;
      if (e.type === 'frostLand') landed++;
    }
    ice = Math.max(ice, w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'ice' && b.by === 'nevera-suprema').length);
  }
  assert.ok(ice >= 10, `cubitos en el aire: ${ice}`);
  assert.ok(thrown >= 3, `bolas de escarcha: ${thrown}`);
  assert.ok(landed >= 3 && landed <= thrown);
});

test('nevera fase 1: cada ataque avisa antes y nunca repite el mismo dos veces seguidas', () => {
  const { w, boss } = fight('nevera-ataques');
  w.noDamage = true;
  const seq: number[] = [];
  let prevState = boss.state;
  let warned = false;
  for (let i = 0; i < ticks(90); i++) {
    step(w, dance(w, i));
    if (w.events.some((e) => e.type === 'telegraph' && e.source === boss.id)) warned = true;
    if (prevState === 'idle' && boss.state !== 'idle') {
      assert.ok(warned, 'el ataque llega con su aviso');
      seq.push(boss.attack!);
      warned = false;
    }
    prevState = boss.state;
  }
  const b = ENEMIES['nevera-suprema']!.brain;
  assert.equal(b.kind, 'boss');
  if (b.kind !== 'boss') return;
  assert.ok(seq.length >= 20, `ataques en 90 s: ${seq.length}`);
  for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], `repite el ataque ${seq[i]}`);
  assert.deepEqual([...new Set(seq)].sort(), b.phases[0]!.attacks.map((_, i) => i));
  for (const a of b.phases.flatMap((ph) => ph.attacks)) {
    if (a.kind === 'pattern') assert.ok(PATTERNS[a.pattern], a.pattern);
    if (a.kind === 'frost' && a.shatter) assert.ok(PATTERNS[a.shatter], a.shatter);
  }
});

test('escarcha: ralentiza al andar, no al rodar, y se derrite', () => {
  const { w, boss } = fight('escarcha');
  w.noDamage = true;
  w.enemies = [];
  const p = w.player;
  const f = throwFrost(w, p.x, p.y - 60, 30, p.x, p.y, { r: 22, life: 3, slow: 0.5, flight: 0.5, source: boss.id, by: 'nevera-suprema' });
  assert.equal(frostSlow(w, p.x, p.y), 1, 'en el aire todavía no');
  for (let i = 0; i < ticks(0.6); i++) step(w, NO_INPUT);
  assert.ok(f.t >= 0);
  assert.equal(frostSlow(w, p.x, p.y), 0.5);
  // Walking out of it: half speed while inside.
  const x0 = p.x;
  for (let i = 0; i < ticks(0.15); i++) step(w, { ...NO_INPUT, moveX: 1, aimX: p.x + 50, aimY: p.y });
  assert.ok(Math.abs(p.vx - p.def.speed * 0.5) < 1, `velocidad en la escarcha ${p.vx.toFixed(1)}`);
  assert.ok(p.x > x0);
  // A roll goes at full speed.
  step(w, { ...NO_INPUT, moveX: -1, roll: true, aimX: p.x + 50, aimY: p.y });
  step(w, { ...NO_INPUT, moveX: -1, aimX: p.x + 50, aimY: p.y });
  assert.ok(Math.abs(p.vx) > p.def.speed, `rodando ${p.vx.toFixed(1)}`);
  for (let i = 0; i < ticks(3); i++) step(w, NO_INPUT);
  assert.equal(w.frost.length, 0, 'se ha derretido');
  assert.equal(frostSlow(w, f.x, f.y), 1);
});

test('escarcha: siempre cae en suelo libre y no se acumula sin fin', () => {
  for (let s = 0; s < 6; s++) {
    const { w } = fight(`escarcha-suelo-${s}`);
    w.noDamage = true;
    let most = 0;
    for (let i = 0; i < ticks(60); i++) {
      // Hugging the walls, so the throws around the player aim at them.
      step(w, { ...NO_INPUT, moveX: i % 600 < 300 ? -1 : 1, moveY: i % 400 < 200 ? -1 : 1, aimX: w.player.x, aimY: w.player.y - 50 });
      for (const f of w.frost) assert.ok(!isWallAt(w.room, f.x, f.y), `escarcha en la pared en ${f.x},${f.y}`);
      most = Math.max(most, w.frost.filter((f) => f.t >= 0).length);
    }
    assert.ok(most >= 2 && most <= 8, `charcos a la vez: ${most}`);
  }
});

test('nevera: sin la nevera, la escarcha que cae ya no suelta esquirlas', () => {
  const w = createWorld({ seed: 'nevera-sala', room: 'jefe' });
  w.intro = null;
  w.noDamage = true;
  for (let i = 0; i < ticks(12); i++) step(w, dance(w, i));
  const boss = w.enemies[0]!;
  // Taking it apart: no more frost lands with splinters after it is gone.
  boss.damageTaken = boss.def.hp;
  step(w, NO_INPUT);
  const before = w.bullets.filter((b) => b.owner === 'enemy').length;
  for (let i = 0; i < ticks(1.2); i++) step(w, NO_INPUT);
  assert.ok(w.bullets.filter((b) => b.owner === 'enemy').length <= before, 'no nacen esquirlas sin nevera');
});

test('nevera: la fase depende de la vida que le queda', () => {
  const { boss } = fight();
  const b = boss.def.brain;
  if (b.kind !== 'boss') throw new Error('no es jefe');
  assert.equal(bossPhaseFor(boss, b), 0);
  boss.damageTaken = boss.def.hp - 1;
  assert.equal(bossPhaseFor(boss, b), b.phases.length - 1);
});

test('nevera: el combate es determinista', () => {
  const run = (): string => {
    const { w } = fight('nevera-det');
    w.noDamage = true;
    for (let i = 0; i < ticks(30); i++) step(w, { ...dance(w, i), fire: i % 3 === 0 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
