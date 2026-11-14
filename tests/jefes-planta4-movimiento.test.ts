// M14b (h10b2): floor 4's boss with a way of moving only it has. The Director de Recursos Inhumanos,
// seated, rolls about in his office chair facing the toaster, by kicks of his feet: backwards, away
// from it (keeping his «distancia de seguridad»), and back in when he has got too far. On his feet
// (phase 3) he walks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { clearLine } from '../src/sim/nav.ts';
import { createWorld, DT, NO_INPUT, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const DIRECTOR = ENEMIES['director-rrhh']!;
const BRAIN = DIRECTOR.brain as BossBrain;
const CHAIR = BRAIN.chair!;

function fight(seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-oficinas', level: 4 });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.id === 'director-rrhh')! };
}

const stroll = (i: number, boss: Enemy) => ({ ...NO_INPUT, moveX: Math.sin(i / 110) * 0.7, moveY: Math.cos(i / 150) * 0.5, aimX: boss.x, aimY: boss.y });
const angleBetween = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

test('los datos: solo el Director va en silla, y en la fase 3 se pone de pie', () => {
  assert.ok(CHAIR.push > 1.5 && CHAIR.friction > 0 && CHAIR.angle[0] >= 0 && CHAIR.angle[1] < 90 && CHAIR.far >= 0);
  for (const d of Object.values(ENEMIES)) {
    if (d.brain.kind === 'boss' && d.id !== 'director-rrhh') assert.ok(!d.brain.chair, `${d.id} también va en silla`);
  }
  const last = BRAIN.phases[BRAIN.phases.length - 1]!;
  assert.ok(last.onFoot && last.summon?.id === 'silla-director');
  assert.ok(BRAIN.phases.slice(0, -1).every((ph) => !ph.onFoot));
});

test('sentado se impulsa hacia atrás, lejos de la tostadora, y vuelve cuando se ha alejado demasiado', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight(`silla-${s}`);
    let kicks = 0;
    let back = 0;
    let backIn = 0;
    let hidden = 0;
    let skipped = 0;
    let speedUps = 0;
    for (let i = 0; i < ticks(30); i++) {
      const sp = Math.hypot(boss.vx, boss.vy);
      step(w, stroll(i, boss));
      let kicked = false;
      for (const e of w.events) {
        if (e.type !== 'chairKick') continue;
        kicked = true;
        kicks++;
        const dir = Math.atan2(e.dirY, e.dirX);
        // (The toaster moves in the same tick, before or after: give or take its step.)
        const qx = w.player.x;
        const qy = w.player.y;
        const away = Math.atan2(e.y - qy, e.x - qx);
        const d = Math.hypot(e.x - qx, e.y - qy);
        const edge = BRAIN.phases[boss.bossPhase ?? 0]!.keep + CHAIR.far;
        if (Math.abs(d - edge) < 4 || d < 30) {
          skipped++;
          continue;
        }
        const far = d > edge;
        if (far) {
          // Back in, at a slant.
          assert.ok(angleBetween(dir, away + Math.PI) <= (50 * Math.PI) / 180 + 1e-6, 'lejos, no vuelve hacia la tostadora');
          backIn++;
        } else {
          // Backwards (or sideways, if cornered): never towards the toaster.
          assert.ok(angleBetween(dir, away) <= Math.PI / 2 + 1e-6, 'se impulsa hacia la tostadora');
          // Hidden behind his table, he goes across, round the end of it.
          if (!clearLine(w, e, { x: qx, y: qy }, 1)) hidden++;
          else if (angleBetween(dir, away) <= (CHAIR.angle[1] * Math.PI) / 180 + 1e-6) back++;
        }
      }
      // Between kicks it only brakes (a bullet's knock aside: it has none).
      if (!kicked && Math.hypot(boss.vx, boss.vy) > sp + 1e-6) speedUps++;
      w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
      if (boss.bossPhase === 2) break;
    }
    assert.ok(kicks >= 15, `se impulsa ${kicks} veces en 30 s`);
    // Near, mostly straight back (sideways only when cornered); and it is near often enough.
    assert.ok(back >= (kicks - backIn - hidden - skipped) * 0.6, `${back} de ${kicks - backIn - hidden - skipped} impulsos de cerca hacia atrás`);
    assert.ok(back >= kicks * 0.2, `${back} de ${kicks} impulsos hacia atrás`);
    assert.ok(backIn >= 1, 'nunca vuelve');
    assert.equal(speedUps, 0, 'acelera entre impulsos');
  }
});

test('sentado mira siempre a la tostadora (rueda de espaldas)', () => {
  const { w, boss } = fight('mira');
  let checked = 0;
  for (let i = 0; i < ticks(15); i++) {
    step(w, stroll(i, boss));
    const dx = w.player.x - boss.x;
    if (boss.state === 'idle' && Math.abs(dx) > 8 && Math.hypot(boss.vx, boss.vy) > 20) {
      assert.equal(boss.facing, dx > 0 ? 1 : -1);
      checked++;
    }
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.ok(checked > ticks(2));
});

test('contra una pared se para en seco con un golpe y se impulsa antes', () => {
  const { w, boss } = fight('choque');
  // Rolling fast at the left wall, a tile away from it.
  boss.x = 70;
  boss.vx = -150;
  boss.vy = 0;
  boss.glideT = 1;
  let bumped = false;
  for (let i = 0; i < ticks(1) && !bumped; i++) {
    step(w, { ...NO_INPUT });
    if (w.events.some((e) => e.type === 'chairBump')) {
      bumped = true;
      assert.equal(boss.vx, 0);
      assert.ok((boss.glideT ?? 0) <= 0.12 + 1e-9);
    }
  }
  assert.ok(bumped, 'no choca con la pared');
});

test('de pie (fase 3) ya no va en silla: anda', () => {
  const { w, boss } = fight('de-pie');
  boss.damageTaken = Math.ceil(DIRECTOR.hp * 0.8);
  let kicks = 0;
  let path = 0;
  for (let i = 0; i < ticks(12); i++) {
    const ox = boss.x;
    const oy = boss.y;
    step(w, stroll(i, boss));
    path += Math.hypot(boss.x - ox, boss.y - oy);
    for (const e of w.events) if (e.type === 'chairKick') kicks++;
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.equal(boss.bossPhase, 2);
  assert.equal(kicks, 0);
  assert.ok(path > 100, `anda ${path.toFixed(0)} px`);
});

test('determinista: dos combates iguales acaban igual', () => {
  const run = (): string => {
    const { w, boss } = fight('det');
    for (let i = 0; i < ticks(15); i++) step(w, stroll(i, boss));
    return worldHash(w);
  };
  assert.equal(run(), run());
});
