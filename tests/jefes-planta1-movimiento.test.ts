// M14b (h10a1): floor 1's bosses, each with a way of moving only it has.
// - The Nevera Suprema skates: it pushes off, glides on braking slowly (more slowly on frost, its own
//   rink) and leaves a thin trail of frost behind it that slows the toaster a little.
// - The Lavadora Programa Eco walks by pivots, one corner and then the other, like a washing machine
//   shifted across a kitchen; in Centrifugado, wider and quicker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { onIce } from '../src/sim/enemies.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, frostSlow, layFrost, MAX_TRAIL, NO_INPUT, step, worldHash, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const NEVERA = ENEMIES['nevera-suprema']!;
const ICE = (NEVERA.brain as BossBrain).glide!;
const LAVADORA = ENEMIES['lavadora-eco']!;
const PIVOT = (LAVADORA.brain as BossBrain).waddle!;

function fight(id: 'nevera-suprema' | 'lavadora-eco', seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe', level: 1, ...(id === 'lavadora-eco' ? { boss: 'À' } : {}) });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.id === id)! };
}

/** Runs `s` seconds with the toaster still, calling `each` after every tick. */
function run(w: World, boss: Enemy, s: number, each: (ev: readonly SimEvent[]) => void = () => {}): void {
  for (let i = 0; i < ticks(s); i++) {
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    each(w.events);
  }
}

test('los datos: solo la Nevera patina y solo la Lavadora anda a pivotes', () => {
  assert.ok(ICE.push > 2 && ICE.friction > 0 && ICE.ice > 0 && ICE.ice < 1);
  assert.ok(ICE.trail.slow > 0.5 && ICE.trail.slow < 1, 'el rastro frena poco');
  assert.ok(PIVOT.angle >= 30 && PIVOT.angle <= 60 && PIVOT.step > 0.2);
  const spin = (LAVADORA.brain as BossBrain).phases.at(-1)!.waddle!;
  assert.ok(spin.angle > PIVOT.angle && spin.step < PIVOT.step, 'centrifugando, más ancho y más deprisa');
  for (const d of Object.values(ENEMIES)) {
    if (d.brain.kind !== 'boss') continue;
    if (d.id !== 'nevera-suprema') assert.ok(!d.brain.glide, `${d.id} también patina`);
    if (d.id !== 'lavadora-eco') assert.ok(!d.brain.waddle, `${d.id} también anda a pivotes`);
  }
});

test('la Nevera se impulsa y se desliza frenando: entre impulsos nunca acelera', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('nevera-suprema', `patina-${s}`);
    let pushes = 0;
    let glidingTicks = 0;
    let longest = 0;
    let since = 0;
    for (let i = 0; i < ticks(30); i++) {
      const before = Math.hypot(boss.vx, boss.vy);
      step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      const now = Math.hypot(boss.vx, boss.vy);
      const pushed = w.events.some((e) => e.type === 'glide' && e.boss === boss.id);
      if (pushed) {
        pushes++;
        longest = Math.max(longest, since);
        since = 0;
        const e = w.events.find((x) => x.type === 'glide')!;
        assert.ok(e.type === 'glide' && Math.abs(Math.hypot(e.dirX, e.dirY) - 1) < 1e-6);
      } else if (boss.state !== 'roar' && boss.state !== 'dying') {
        // Gliding: it only ever slows down (a wall may stop it dead, along one axis).
        assert.ok(now <= before + 1e-6, `acelera sin impulsarse: ${before.toFixed(1)} → ${now.toFixed(1)}`);
        if (now > 0) {
          glidingTicks++;
          since += DT;
        }
      }
    }
    assert.ok(pushes >= 12, `se impulsa ${pushes} veces en 30 s`);
    // A push carries it a good while: it glides, it does not walk.
    assert.ok(longest > 0.5, `su deslizamiento más largo dura ${longest.toFixed(2)} s`);
    assert.ok(glidingTicks > ticks(10), `se desliza ${(glidingTicks * DT).toFixed(1)} s de 30`);
  }
});

test('sobre su escarcha frena mucho menos: llega más lejos con el mismo impulso', () => {
  const slideFrom = (ice: boolean): number => {
    const { w, boss } = fight('nevera-suprema', 'pista');
    w.frost = [];
    // Between attacks, with no push due for a while: just the glide.
    boss.state = 'fire' as Enemy['state'];
    boss.t = 0;
    boss.until = 99;
    boss.attack = 0;
    boss.bossPhase = 0;
    w.emitters = [];
    const x0 = boss.x;
    if (ice) for (let k = 0; k < 6; k++) layFrost(w, x0 + k * 30, boss.y, 22, 99, 0.5, boss.id, boss.def.id).trail = false;
    boss.vx = 100;
    boss.vy = 0;
    for (let i = 0; i < ticks(2); i++) {
      step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      w.bullets = [];
      w.emitters = [];
    }
    return boss.x - x0;
  };
  const dry = slideFrom(false);
  const wet = slideFrom(true);
  // v²/2a: 100²/(2·friction) on the floor (≈ 38 px), nearly three times that on the ice.
  const expect = (100 * 100) / (2 * ICE.friction);
  assert.ok(dry > expect * 0.7 && dry < expect * 1.3, `en el suelo se desliza ${dry.toFixed(0)} px`);
  assert.ok(wet > dry * 2, `sobre la escarcha, ${wet.toFixed(0)} px (en el suelo ${dry.toFixed(0)})`);
});

test('deja un rastro de escarcha fina: en el suelo, poco, limitado y que frena un poco', () => {
  for (let s = 0; s < 4; s++) {
    const { w, boss } = fight('nevera-suprema', `rastro-${s}`);
    let laid = 0;
    let most = 0;
    const seen = new Set<number>();
    run(w, boss, 40, () => {
      for (const f of w.frost) {
        if (!f.trail) continue;
        assert.ok(!isWallAt(w.room, f.x, f.y), `rastro en la pared en ${f.x},${f.y}`);
        if (!seen.has(f.id)) {
          seen.add(f.id);
          laid++;
          // Left where it stands, never in the air, and it melts soon.
          assert.ok(f.t >= 0 && f.t <= DT * 2 + 1e-9, `aparece ya en el suelo (t ${f.t})`);
          assert.ok(f.life === ICE.trail.life && f.r === ICE.trail.r);
          assert.ok(Math.hypot(f.x - boss.x, f.y - boss.y) < 12, 'el rastro sale de sus pies');
        }
      }
      most = Math.max(most, w.frost.filter((f) => f.trail).length);
    });
    assert.ok(laid >= 10, `rastro dejado: ${laid}`);
    assert.ok(most <= MAX_TRAIL, `rastro a la vez: ${most}`);
    // Standing on it only slows the toaster a little.
    const f = w.frost.find((x) => x.trail) ?? layFrost(w, w.player.x, w.player.y, ICE.trail.r, 5, ICE.trail.slow, boss.id, boss.def.id);
    assert.equal(frostSlow({ ...w, frost: [f] }, f.x, f.y), ICE.trail.slow);
    // Its own trail is not its rink (it would never stop): only the frost it throws.
    assert.equal(onIce({ ...w, frost: [f] }, f.x, f.y), false);
    assert.equal(onIce({ ...w, frost: [{ ...f, trail: false }] }, f.x, f.y), true);
  }
});

test('mientras avisa o dispara no se para en seco: sigue deslizándose', () => {
  const { w, boss } = fight('nevera-suprema', 'avisa-desliza');
  let checked = 0;
  run(w, boss, 30, () => {
    if ((boss.state === 'warn' || boss.state === 'fire') && boss.t < 0.1 && Math.hypot(boss.vx, boss.vy) > 20) checked++;
  });
  assert.ok(checked >= 3, `empieza a atacar todavía deslizándose ${checked} veces`);
});

test('la Lavadora anda a pivotes: una esquina y luego la otra, a tirones', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('lavadora-eco', `pivotes-${s}`);
    // Its silence would stand it still: not now.
    boss.muteIn = 999;
    const sides: number[] = [];
    let swings = 0;
    let steps = 0;
    let headings: number[] = [];
    let prevMean: number | null = null;
    let stillAtPivot = 0;
    run(w, boss, 20, (ev) => {
      boss.muteIn = 999;
      for (const e of ev) {
        if (e.type !== 'pivot' || e.boss !== boss.id) continue;
        sides.push(e.side);
        // At the end of each step it is (nearly) still: the lurch is in the middle.
        if (Math.hypot(boss.vx, boss.vy) < 12) stillAtPivot++;
        if (headings.length > 4 && boss.state === 'idle') {
          // Mean heading of the step that just ended against the one before: swung the other way.
          const mx = headings.reduce((a, h) => a + Math.cos(h), 0);
          const my = headings.reduce((a, h) => a + Math.sin(h), 0);
          const mean = Math.atan2(my, mx);
          if (prevMean !== null) {
            steps++;
            const turn = Math.abs(Math.atan2(Math.sin(mean - prevMean), Math.cos(mean - prevMean)));
            if (turn > (PIVOT.angle * Math.PI) / 180) swings++;
          }
          prevMean = mean;
        } else prevMean = null;
        headings = [];
      }
      if (boss.state === 'idle' && Math.hypot(boss.vx, boss.vy) > 10) headings.push(Math.atan2(boss.vy, boss.vx));
    });
    assert.ok(sides.length >= 30, `pivota ${sides.length} veces en 20 s`);
    for (let k = 1; k < sides.length; k++) assert.equal(sides[k], -sides[k - 1]!, 'una esquina y luego la otra');
    assert.ok(stillAtPivot / sides.length > 0.6, `parada al cambiar de esquina el ${((100 * stillAtPivot) / sides.length).toFixed(0)} %`);
    assert.ok(steps >= 6 && swings / steps > 0.6, `zigzaguea en ${swings} de ${steps} pasos`);
  }
});

test('centrifugando pivota más deprisa', () => {
  const count = (lost: number): number => {
    const { w, boss } = fight('lavadora-eco', 'centrifugado');
    boss.damageTaken = LAVADORA.hp * lost;
    let n = 0;
    run(w, boss, 20, (ev) => {
      boss.muteIn = 999;
      n += ev.filter((e) => e.type === 'pivot').length;
    });
    return n;
  };
  const wash = count(0.4);
  const spin = count(0.8);
  assert.ok(spin > wash * 1.4, `pivotes en 20 s: lavado ${wash}, centrifugado ${spin}`);
});

test('las dos son deterministas', () => {
  for (const id of ['nevera-suprema', 'lavadora-eco'] as const) {
    const play = (): string => {
      const { w, boss } = fight(id, `det-${id}`);
      run(w, boss, 15);
      return worldHash(w);
    };
    assert.equal(play(), play(), id);
  }
});
