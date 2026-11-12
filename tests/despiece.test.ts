// La Trituradora, fase 2 «Despiece» (M12 (4b)): desde el 60 % el suelo entero es una cinta que
// lleva hacia la pared más lejana de la tostadora; ella se va allí, sube y baja por el final de la
// cinta y escupe tornillos, muelles y teclas en abanicos. Al final de la cinta, los rodillos muerden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import type { BossBrain, BossPatternAttack } from '../src/data/types.ts';
import { textWidth } from '../src/art/font.ts';
import { BITE_COOLDOWN, conveyorPush, inBite } from '../src/sim/conveyors.ts';
import { TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, NO_INPUT, SERVICE_LEVEL, step, type Enemy, type World } from '../src/sim/world.ts';
import { makeTrituradoraFrames, TRITURADORA_FRAMES } from '../tools/sprites/trituradora.ts';

const def = ENEMIES.trituradora!;
const brain = def.brain as BossBrain;
const phase = brain.phases[1]!;
const ticks = (s: number): number => Math.ceil(s / DT);

/** The fight, the boss already down to 59 % and the toaster where it is put, until the belt is laid. */
function despiece(seed = 'despiece', at = { x: 160, y: 200 }): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-taller', level: SERVICE_LEVEL });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'trituradora')!;
  w.player.x = at.x;
  w.player.y = at.y;
  boss.damageTaken = Math.ceil(def.hp * 0.41);
  step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  return { w, boss };
}

test('la fase 2 es «Despiece», desde el 60 %, con su cinta y sus tres abanicos de piezas', () => {
  assert.equal(phase.name, 'Despiece');
  assert.equal(phase.from, 0.6);
  assert.ok(phase.belt && phase.belt.speed > 0 && phase.belt.speed < 50, 'la cinta se puede remontar andando');
  assert.ok(phase.line && textWidth(phase.line) <= 220);
  const colors = phase.attacks.map((a) => {
    const p = PATTERNS[(a as BossPatternAttack).pattern]!;
    const first = p.kind === 'sequence' ? p.parts[0]!.pattern : p;
    return 'color' in first ? first.color : undefined;
  });
  assert.deepEqual(colors, ['screw', 'spring', 'key']);
  // While it warns it shows the red lamps and the slot full of parts.
  const frames = makeTrituradoraFrames();
  for (const a of phase.attacks) assert.equal(TRITURADORA_FRAMES[(a as BossPatternAttack).pose!], 'despiece');
  assert.equal(frames.length, TRITURADORA_FRAMES.length);
});

test('al llegar al 60 % el suelo entero corre hacia la pared lejana y ella se va allí', () => {
  for (const [at, dir] of [[{ x: 160, y: 200 }, 1], [{ x: 470, y: 260 }, -1]] as const) {
    const { w, boss } = despiece(`despiece-${dir}`, at);
    assert.equal(boss.bossPhase, 1);
    assert.equal(w.conveyors.length, 1);
    const c = w.conveyors[0]!;
    assert.equal(c.dirX, dir, 'hacia la pared más lejana de la tostadora');
    assert.equal(c.x, TILE);
    assert.equal(c.w, w.room.w - 2 * TILE);
    assert.ok(boss.rail && !boss.rail.on);
    // Over there, attacking nothing on the way.
    let fired = false;
    for (let i = 0; i < ticks(12) && !boss.rail.on; i++) {
      step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      if (boss.state === 'fire' || boss.state === 'warn') fired = true;
    }
    assert.ok(boss.rail.on, 'llega a su raíl');
    assert.ok(!fired, 'de camino no ataca');
    assert.ok(Math.abs(boss.x - boss.rail.x) <= 6);
    // And then it rides up and down along the wall, attacking.
    const ys: number[] = [];
    let attacks = 0;
    for (let i = 0; i < ticks(15); i++) {
      const before = boss.state;
      step(w, { ...NO_INPUT, moveX: -dir * 0.4, aimX: boss.x, aimY: boss.y });
      ys.push(boss.y);
      if (boss.state === 'fire' && before !== 'fire') attacks++;
      assert.ok(Math.abs(boss.x - boss.rail.x) < 30, `se queda en su pared (x ${boss.x.toFixed(0)})`);
    }
    assert.ok(Math.max(...ys) - Math.min(...ys) > 80, 'sube y baja por la pared');
    assert.ok(attacks >= 3, `${attacks} ataques en 15 s`);
    assert.deepEqual(checkInvariants(w), []);
  }
});

test('la cinta arrastra: quieta se va hacia la tolva, andando en contra se avanza, y los rodillos muerden', () => {
  const { w, boss } = despiece();
  const c = w.conveyors[0]!;
  const p = w.player;
  assert.deepEqual(conveyorPush(w, p.x, p.y), { x: c.speed * c.dirX, y: 0 });
  // Standing still: carried towards the end.
  const x0 = p.x;
  for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  assert.ok(Math.abs(p.x - x0 - c.speed * c.dirX) < 4, `en 1 s la cinta la lleva ${(p.x - x0).toFixed(1)} px`);
  // Walking against it: slower than on the floor, but it gets somewhere.
  const x1 = p.x;
  for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, moveX: -c.dirX, aimX: boss.x, aimY: boss.y });
  const back = (x1 - p.x) * c.dirX;
  assert.ok(back > 30 && back < p.def.speed - 20, `remonta ${back.toFixed(1)} px en 1 s`);

  // The rollers: a hit and thrown back down the belt.
  w.noDamage = false;
  boss.y = c.y + c.h - 30;
  boss.rail!.on = true;
  p.x = c.dirX > 0 ? c.x + c.w - 6 : c.x + 6;
  p.y = c.y + 60;
  p.invulnerable = 0;
  assert.ok(inBite(c, p.x, p.y));
  const hp = p.hp;
  step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  assert.equal(p.hp, hp - 1, 'los rodillos quitan un corazón');
  assert.ok(p.vx * c.dirX < -100, 'y la echan cinta abajo');
  for (let i = 0; i < ticks(0.5); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  assert.ok(!inBite(c, p.x, p.y), 'fuera de los rodillos');
  assert.ok(BITE_COOLDOWN > 0);
  assert.deepEqual(checkInvariants(w), []);
});

test('cuando cae, la cinta se para', () => {
  const { w, boss } = despiece();
  assert.equal(w.conveyors.length, 1);
  boss.damageTaken = def.hp - 1;
  w.player.weapon.ammo = w.player.weapon.def.magazine;
  // Shot down from close by.
  let stopped = false;
  for (let i = 0; i < ticks(20) && !stopped; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: boss.x, aimY: boss.y - 30, moveX: (boss.x - w.player.x) * 0.01 });
    if (w.events.some((e) => e.type === 'conveyor' && !e.on)) stopped = true;
  }
  assert.ok(stopped, 'la cinta se para al caer');
  assert.equal(w.conveyors.length, 0);
  assert.deepEqual(conveyorPush(w, w.player.x, w.player.y), { x: 0, y: 0 });
});
