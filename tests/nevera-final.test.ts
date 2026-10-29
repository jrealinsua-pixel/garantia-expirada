import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BOSS_DEATH, BOSS_PHASE_BREAK, checkInvariants, createWorld, DT, NO_INPUT, step, worldHash, type Enemy, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The boss room with the entrance over, nothing hurting the toaster. */
function fight(seed = 'nevera-final'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe' });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.boss)! };
}

/** Aims at the boss's body and fires every other tick. */
function shoot(_w: World, boss: Enemy, i: number): Input {
  return { ...NO_INPUT, fire: i % 2 === 0, aimX: boss.x, aimY: boss.y - 30 };
}

function run(w: World, n: number, input: (i: number) => Input, seen: SimEvent[] = []): SimEvent[] {
  for (let i = 0; i < n; i++) {
    step(w, input(i));
    seen.push(...w.events);
  }
  return seen;
}

test('cambio de fase: la nevera se detiene, no recibe daño y limpia la pantalla', () => {
  const { w, boss } = fight();
  // Fight a while in phase 1 so there are bullets about.
  run(w, ticks(6), () => NO_INPUT);
  assert.ok(w.bullets.some((b) => b.owner === 'enemy') || w.emitters.length > 0 || w.frost.length > 0, 'la fase 1 no ha disparado nada');
  boss.damageTaken = Math.ceil(boss.def.hp / 2) + 1;
  const ev = run(w, 1, () => NO_INPUT);
  assert.ok(ev.some((e) => e.type === 'bossPhase' && e.phase === 1));
  assert.ok(ev.some((e) => e.type === 'fireCleared'));
  assert.equal(boss.state, 'roar');
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0);
  assert.equal(w.emitters.length, 0);
  assert.ok(w.frost.every((f) => f.t >= 0), 'queda escarcha en el aire');
  // Shooting it meanwhile does nothing: the bullets stop on it with no damage.
  const before = boss.damageTaken;
  const hits = run(w, ticks(BOSS_PHASE_BREAK) - 2, (i) => shoot(w, boss, i)).filter((e) => e.type === 'hit');
  assert.ok(hits.length > 0, 'ninguna bala la ha tocado');
  assert.ok(hits.every((e) => e.type === 'hit' && e.damage === 0));
  assert.equal(boss.damageTaken, before);
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0, 'ha atacado durante la pausa');
  // Then it fights again, and takes damage again.
  run(w, ticks(3), (i) => shoot(w, boss, i));
  assert.notEqual(boss.state, 'roar');
  assert.ok(boss.damageTaken > before);
});

test('muerte de la jefa: se desmonta un rato, no hace daño y luego cae con botín y persianas arriba', () => {
  const { w, boss } = fight('nevera-muerte');
  w.noDamage = false;
  run(w, ticks(5), () => NO_INPUT);
  boss.damageTaken = boss.def.hp - 1;
  boss.state = 'idle' as Enemy['state'];
  const hp = w.player.hp;
  const ev: SimEvent[] = [];
  // Shoot until she falls.
  for (let i = 0; i < ticks(10) && boss.state !== 'dying'; i++) run(w, 1, () => shoot(w, boss, i), ev);
  assert.equal(boss.state, 'dying');
  assert.ok(ev.some((e) => e.type === 'bossDying'));
  assert.ok(ev.some((e) => e.type === 'fireCleared'));
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0);
  assert.equal(w.enemies.length, 1, 'se ha ido sin desmontarse');
  assert.ok(w.doorsShut);
  // Meanwhile: bullets fly through, the toaster can walk into her and nothing hurts it.
  const x0 = boss.x;
  const y0 = boss.y;
  const during: SimEvent[] = [];
  for (let i = 0; i < ticks(BOSS_DEATH) - 3; i++) {
    w.player.x = boss.x;
    w.player.y = boss.y + 4;
    run(w, 1, () => shoot(w, boss, i), during);
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.equal(boss.x, x0);
  assert.equal(boss.y, y0);
  assert.equal(during.filter((e) => e.type === 'hit').length, 0, 'las balas chocan con ella');
  assert.equal(during.filter((e) => e.type === 'hurt' || e.type === 'contact').length, 0);
  assert.equal(during.filter((e) => e.type === 'death').length, 0, 'ha caído antes de tiempo');
  assert.ok(w.player.hp >= hp - 1);
  // Then the usual death: out of the world, coupons on the floor, shutters up.
  const after = run(w, 6, () => NO_INPUT);
  assert.ok(after.some((e) => e.type === 'death' && e.enemy === 'nevera-suprema'));
  assert.equal(w.enemies.length, 0);
  assert.ok(w.pickups.length >= 10);
  assert.equal(w.doorsShut, false);
  assert.deepEqual(checkInvariants(w), []);
});

test('fin del combate determinista', () => {
  const play = (): string => {
    const { w, boss } = fight('nevera-det');
    boss.damageTaken = boss.def.hp - 30;
    run(w, ticks(20), (i) => shoot(w, boss, i));
    return worldHash(w);
  };
  assert.equal(play(), play());
});
