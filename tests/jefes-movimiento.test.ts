// M9b (8): bosses never stand still between attacks, walk erratically, drift while their bullets
// stream out, and walk and recover faster the less life they have.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { bossRage } from '../src/sim/enemies.ts';
import { createWorld, DT, NO_INPUT, step, type Enemy, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const BOSSES = Object.values(ENEMIES).filter((d) => d.brain.kind === 'boss');

/** Each boss in its own room, on its own floor. */
const ARENAS: Record<string, { room: string; level: number }> = {
  'nevera-suprema': { room: 'jefe', level: 1 },
  'router-wifi': { room: 'jefe-informatica', level: 2 },
  'muneco-moda': { room: 'jefe-jugueteria', level: 3 },
  'director-rrhh': { room: 'jefe-oficinas', level: 4 },
  centralita: { room: 'jefe-atencion', level: 5 },
  trituradora: { room: 'jefe-taller', level: 6 },
};

function fight(id: string, seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, ...ARENAS[id]! });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === id)!;
  return { w, boss };
}

test('los jefes son de los que se mueven', () => {
  assert.ok(BOSSES.length >= 3);
  for (const d of BOSSES) assert.ok(ARENAS[d.id], `${d.id}: falta su sala en ARENAS`);
  for (const d of BOSSES) {
    const b = d.brain as BossBrain;
    assert.ok(b.roam.leg[0] > 0 && b.roam.leg[0] < b.roam.leg[1], d.id);
    assert.ok(b.roam.burst[0] < 1 && b.roam.burst[1] > 1, `${d.id}: unas veces pasea y otras da tirones`);
    assert.ok(b.drift > 0 && b.drift < 1, d.id);
    assert.ok(b.rage > 0 && b.rage <= 1, d.id);
    for (const ph of b.phases) assert.ok(ph.walkSpeed >= 30, `${d.id}: ${ph.name} anda a ${ph.walkSpeed}`);
  }
});

for (const def of BOSSES) {
  test(`${def.name}: no se queda quieto, cambia de rumbo y recorre la sala`, () => {
    const { w, boss } = fight(def.id, `mueve-${def.id}`);
    assert.ok(boss, 'el jefe está en su sala');
    let path = 0;
    let turns = 0;
    let lastDir: number | null = null;
    let idleTicks = 0;
    let idleMoving = 0;
    const xs: number[] = [];
    const ys: number[] = [];
    for (let i = 0; i < ticks(20); i++) {
      const ox = boss.x;
      const oy = boss.y;
      // The toaster stands still in the middle: the boss moves by itself, not just after it.
      step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      const d = Math.hypot(boss.x - ox, boss.y - oy);
      path += d;
      xs.push(boss.x);
      ys.push(boss.y);
      if (boss.state === 'idle') {
        idleTicks++;
        if (d > 0.05) idleMoving++;
      }
      if (d > 0.3) {
        const dir = Math.atan2(boss.y - oy, boss.x - ox);
        if (lastDir !== null && Math.abs(Math.atan2(Math.sin(dir - lastDir), Math.cos(dir - lastDir))) > Math.PI / 3) turns++;
        lastDir = dir;
      }
    }
    const spanX = Math.max(...xs) - Math.min(...xs);
    const spanY = Math.max(...ys) - Math.min(...ys);
    assert.ok(idleMoving / idleTicks > 0.8, `entre ataques se mueve el ${((100 * idleMoving) / idleTicks).toFixed(0)} % del tiempo`);
    assert.ok(path > 300, `recorre ${path.toFixed(0)} px en 20 s`);
    assert.ok(turns >= 5, `cambia de rumbo ${turns} veces`);
    assert.ok(spanX > 80 && spanY > 50, `se mueve por la sala: ${spanX.toFixed(0)} × ${spanY.toFixed(0)} px`);
  });
}

test('cuanta menos vida, más deprisa: anda y se recupera hasta (1 + rabia) veces más rápido', () => {
  const def = ENEMIES['nevera-suprema']!;
  const b = def.brain as BossBrain;
  const { boss } = fight(def.id, 'rabia');
  boss.damageTaken = 0;
  assert.equal(bossRage(boss, b), 1);
  boss.damageTaken = def.hp / 2;
  assert.ok(Math.abs(bossRage(boss, b) - (1 + b.rage / 2)) < 1e-9);
  boss.damageTaken = def.hp;
  assert.ok(Math.abs(bossRage(boss, b) - (1 + b.rage)) < 1e-9);
  // Measured: the same boss, hurt, covers more ground and attacks more often.
  const measure = (lost: number): { speed: number; attacks: number } => {
    const { w, boss: en } = fight(def.id, 'rabia-medida');
    // Its phase changes by life too: both runs stay in the second phase so only the rage differs.
    en.damageTaken = def.hp * lost;
    let path = 0;
    let walking = 0;
    let attacks = 0;
    let was = en.state;
    for (let i = 0; i < ticks(60); i++) {
      const ox = en.x;
      const oy = en.y;
      const idle = en.state === 'idle';
      step(w, { ...NO_INPUT, aimX: en.x, aimY: en.y });
      if (idle && en.state === 'idle') {
        path += Math.hypot(en.x - ox, en.y - oy);
        walking += DT;
      }
      if (was === 'idle' && (en.state === 'fire' || en.state === 'warn')) attacks++;
      was = en.state;
    }
    return { speed: path / walking, attacks };
  };
  const fresh = measure(0.5);
  const hurt = measure(0.95);
  assert.ok(hurt.speed > fresh.speed * 1.08, `anda a ${fresh.speed.toFixed(0)} → ${hurt.speed.toFixed(0)} px/s`);
  assert.ok(hurt.attacks > fresh.attacks, `ataca ${fresh.attacks} → ${hurt.attacks} veces en 60 s`);
});

test('mientras dispara sigue moviéndose un poco, y sus balas salen de donde está, no de donde estaba', () => {
  const { w, boss } = fight('nevera-suprema', 'deriva');
  let checked = 0;
  let drift = 0;
  for (let i = 0; i < ticks(30); i++) {
    const ox = boss.x;
    const firing = boss.state === 'fire';
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    for (const e of w.emitters) {
      if (!e.follow || e.follow.id !== boss.id || e.t <= 0) continue;
      // (Emitters go before enemies in a tick: at most one tick of walking behind.)
      assert.ok(Math.hypot(e.x - (boss.x + e.follow.dx), e.y - (boss.y + e.follow.dy)) < 2, 'la ráfaga sale de la boquilla');
      checked++;
    }
    if (firing && boss.state === 'fire') drift += Math.abs(boss.x - ox);
  }
  assert.ok(checked >= 20, `ráfagas comprobadas: ${checked}`);
  assert.ok(drift > 5, `se mueve mientras dispara: ${drift.toFixed(1)} px`);
});
