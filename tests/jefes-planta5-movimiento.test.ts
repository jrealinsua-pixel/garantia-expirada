// M14b (h10b3): the bosses of floor 5 and of the Servicio Técnico with a way of moving only they
// have. The Centralita hauls herself about by her cords: she plugs one into the wall past a spot
// round the toaster and drags herself down it in a heave. The Trituradora drives on its tracks: it
// pivots on the spot to face the toaster, marks its run and drives straight through, crushing
// whatever is in the way.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import type { BossBrain } from '../src/data/types.ts';
import type { PropInstance } from '../src/sim/room.ts';
import { createWorld, DT, isClear, NO_INPUT, SERVICE_LEVEL, step, worldHash, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const CENTRALITA = ENEMIES.centralita!;
const CB = CENTRALITA.brain as BossBrain;
const CORD = CB.cord!;
const TRITURADORA = ENEMIES.trituradora!;
const TB = TRITURADORA.brain as BossBrain;
const TREADS = TB.treads!;

function fight(id: 'centralita' | 'trituradora', seed: string): { w: World; boss: Enemy } {
  const w = createWorld(id === 'centralita' ? { seed, room: 'jefe-atencion', level: 5 } : { seed, room: 'jefe-taller', level: SERVICE_LEVEL });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.id === id)! };
}

const stroll = (i: number, boss: Enemy) => ({ ...NO_INPUT, moveX: Math.sin(i / 110) * 0.7, moveY: Math.cos(i / 150) * 0.5, aimX: boss.x, aimY: boss.y });
const calm = (w: World): void => {
  w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
};

test('los datos: solo la Centralita se arrastra con cables y solo la Trituradora va sobre orugas', () => {
  assert.ok(CORD.warn >= 0.3 && CORD.top > 2 && CORD.accel > 0 && CORD.brake > 0 && CORD.arc[0] > 0 && CORD.arc[1] <= 120);
  assert.ok(TREADS.turn > 30 && TREADS.turn < 180 && TREADS.aim > 0 && TREADS.warn >= 0.4 && TREADS.push > 1 && TREADS.over > 0);
  for (const d of Object.values(ENEMIES)) {
    if (d.brain.kind !== 'boss') continue;
    if (d.id !== 'centralita') assert.ok(!d.brain.cord, `${d.id} también se arrastra con cables`);
    if (d.id !== 'trituradora') assert.ok(!d.brain.treads, `${d.id} también va sobre orugas`);
  }
});

test('la Centralita enchufa el cable en la pared, pasado el sitio, y se arrastra en línea recta hasta él', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('centralita', `cable-${s}`);
    let throws = 0;
    let arrived = 0;
    let braced = 0;
    let offLane = 0;
    let pulling = 0;
    let lane: { x: number; y: number; ux: number; uy: number } | null = null;
    for (let i = 0; i < ticks(40); i++) {
      const before = boss.cord ? { ...boss.cord } : null;
      const ox = boss.x;
      const oy = boss.y;
      step(w, stroll(i, boss));
      for (const e of w.events) {
        if (e.type === 'cordThrow') {
          throws++;
          const c = boss.cord!;
          // Plugged into something solid, past the spot, on the line from her through it.
          assert.ok(!isClear(w, e.ax, e.ay, 1), 'el enchufe no está en nada');
          const past = (e.ax - c.tx) * c.ux + (e.ay - c.ty) * c.uy;
          assert.ok(past >= CENTRALITA.footRadius, `enchufado ${past.toFixed(0)} px pasado el sitio`);
          const across = Math.abs((e.ax - e.x) * -c.uy + (e.ay - e.y) * c.ux);
          assert.ok(across < 1e-6, 'el cable no está en la línea');
          assert.ok(Math.hypot(c.tx - e.x, c.ty - e.y) >= 40, 'un tirón de nada');
          lane = { x: e.x, y: e.y, ux: c.ux, uy: c.uy };
        }
        if (e.type === 'cordLetGo' && before && !e.bump && Math.hypot(before.tx - boss.x, before.ty - boss.y) < 4) arrived++;
      }
      const c = boss.cord;
      if (c && before && c.t <= c.warn) {
        // Bracing while her cord flies out: still.
        if (Math.hypot(boss.x - ox, boss.y - oy) > 1e-6) braced++;
      } else if (c && before && lane) {
        // Hauling: down her lane and nowhere else.
        pulling++;
        const off = Math.abs((boss.x - lane.x) * -lane.uy + (boss.y - lane.y) * lane.ux);
        if (off > 0.5) offLane++;
      }
      calm(w);
      if ((boss.bossPhase ?? 0) >= 2) break;
    }
    assert.ok(throws >= 10, `lanza el cable ${throws} veces en 40 s`);
    assert.ok(arrived >= throws * 0.6, `llega a su sitio ${arrived} de ${throws} veces`);
    assert.equal(braced, 0, 'se mueve con el cable en el aire');
    assert.ok(pulling > ticks(4), `se arrastra ${(pulling * DT).toFixed(1)} s`);
    assert.equal(offLane, 0, 'se sale de la línea del cable');
  }
});

test('se arrastra deprisa (a tirones) y entre tirón y tirón solo se arrastra despacio', () => {
  const { w, boss } = fight('centralita', 'tirones');
  let top = 0;
  let creep = 0;
  for (let i = 0; i < ticks(25); i++) {
    step(w, stroll(i, boss));
    const v = Math.hypot(boss.vx, boss.vy);
    const ph = CB.phases[boss.bossPhase ?? 0]!;
    if (boss.cord) top = Math.max(top, v / ph.walkSpeed);
    else if (boss.state === 'idle') creep = Math.max(creep, v / ph.walkSpeed);
    calm(w);
  }
  assert.ok(top > 2.5, `en el tirón va ${top.toFixed(1)} veces su paso`);
  assert.ok(creep < 1.2, `entre tirones va ${creep.toFixed(1)} veces su paso`);
});

test('muda (fase 3) suelta el cable y se queda quieta', () => {
  const { w, boss } = fight('centralita', 'muda');
  boss.damageTaken = Math.ceil(CENTRALITA.hp * 0.8);
  let muted = 0;
  for (let i = 0; i < ticks(30) && muted < 2; i++) {
    step(w, stroll(i, boss));
    if (w.events.some((e) => e.type === 'mute')) {
      muted++;
      assert.equal(boss.cord, undefined, 'muda sigue enganchada');
      assert.equal(boss.state, 'stun');
    }
    if (boss.state === 'stun') assert.equal(Math.hypot(boss.vx, boss.vy), 0);
    calm(w);
  }
  assert.ok(muted >= 1, 'no se queda muda');
});

test('la Trituradora gira sobre sí misma, marca su recorrido a través de la tostadora y avanza recto sin girar', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('trituradora', `orugas-${s}`);
    let aims = 0;
    let runs = 0;
    let pivotMoved = 0;
    let fastTurn = 0;
    let steered = 0;
    for (let i = 0; i < ticks(30); i++) {
      const t0 = boss.tread ? { ...boss.tread } : null;
      const ox = boss.x;
      const oy = boss.y;
      step(w, stroll(i, boss));
      const t = boss.tread;
      for (const e of w.events) {
        if (e.type === 'treadAim') {
          aims++;
          // Its run goes through where the toaster is (give or take its aim and the toaster's step).
          const along = (w.player.x - e.x) * e.dirX + (w.player.y - e.y) * e.dirY;
          const across = Math.abs((w.player.x - e.x) * -e.dirY + (w.player.y - e.y) * e.dirX);
          assert.ok(along > 0, 'marca un recorrido que se aleja de la tostadora');
          assert.ok(across <= Math.tan((TREADS.aim * Math.PI) / 180) * along + 6, `pasa a ${across.toFixed(0)} px de la tostadora`);
          assert.ok(t!.left >= along, 'no llega hasta la tostadora');
        }
        if (e.type === 'treadGo') runs++;
      }
      if (!t || !t0 || boss.bossPhase !== 0) continue;
      if (t0.mode === 'turn' && t.mode === 'turn') {
        // Pivoting on the spot, never faster than its tracks turn (with rage).
        if (Math.hypot(boss.x - ox, boss.y - oy) > 1e-6) pivotMoved++;
        const d = Math.abs(Math.atan2(Math.sin(t.heading - t0.heading), Math.cos(t.heading - t0.heading)));
        if (d > TREADS.turn * (1 + TB.rage) * (Math.PI / 180) * DT + 1e-9) fastTurn++;
      }
      if (t0.mode === 'drive' && t.mode === 'drive') {
        if (t.heading !== t0.heading) steered++;
        const moved = Math.hypot(boss.x - ox, boss.y - oy);
        // Straight down its heading (the walls aside: it stops dead against them).
        if (moved > 0.2) {
          const dir = Math.atan2(boss.y - oy, boss.x - ox);
          assert.ok(Math.abs(Math.atan2(Math.sin(dir - t.heading), Math.cos(dir - t.heading))) < 0.05, 'avanza de lado');
        }
      }
      calm(w);
    }
    assert.ok(aims >= 5 && runs >= 5, `${aims} recorridos marcados y ${runs} arrancadas en 30 s`);
    assert.equal(pivotMoved, 0, 'se desplaza mientras gira');
    assert.equal(fastTurn, 0, 'gira más deprisa que sus orugas');
    assert.equal(steered, 0, 'gira mientras avanza');
  }
});

test('lo que pilla por delante lo tritura: una caja se rompe y un barril se enciende', () => {
  for (const id of ['caja', 'barril']) {
    const { w, boss } = fight('trituradora', `tritura-${id}`);
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    const def = PROPS[id]!;
    // A prop right between it and the toaster, and the toaster beyond.
    w.player.x = boss.x;
    w.player.y = boss.y + 170;
    const pr: PropInstance = { def, x: boss.x, y: boss.y + 70, box: { x: boss.x + def.box.x, y: boss.y + 70 + def.box.y, w: def.box.w, h: def.box.h } };
    w.room.props.push(pr);
    boss.tread = { heading: Math.PI / 2, mode: 'turn', t: 0, left: 0 };
    const events: SimEvent[] = [];
    for (let i = 0; i < ticks(5) && !events.some((e) => e.type === 'crush'); i++) {
      step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
      events.push(...w.events);
      calm(w);
    }
    const crush = events.find((e) => e.type === 'crush');
    assert.ok(crush && crush.type === 'crush' && crush.prop === id, `no tritura ${id}`);
    if (def.hp) assert.ok(pr.fuse !== undefined || !w.room.props.includes(pr), 'el barril no se enciende');
    else assert.ok(!w.room.props.includes(pr), 'la caja sigue ahí');
  }
});

test('contra la pared se para en seco y vuelve a girar; sobre su cinta (fase 2) ya no va a su aire', () => {
  const { w, boss } = fight('trituradora', 'pared');
  step(w, { ...NO_INPUT });
  boss.tread = { heading: -Math.PI / 2, mode: 'drive', t: 1, left: 400 };
  w.player.x = boss.x + 150;
  let bumped = false;
  for (let i = 0; i < ticks(4) && !bumped; i++) {
    step(w, { ...NO_INPUT });
    if (w.events.some((e) => e.type === 'treadBump')) {
      bumped = true;
      assert.equal(boss.tread.mode, 'turn');
      assert.equal(Math.hypot(boss.vx, boss.vy), 0);
    }
    calm(w);
  }
  assert.ok(bumped, 'no choca con la pared');
  // Phase 2: it goes over to its belt and rides along the wall; no more runs.
  boss.damageTaken = Math.ceil(TRITURADORA.hp * 0.42);
  let runs = 0;
  for (let i = 0; i < ticks(15); i++) {
    step(w, stroll(i, boss));
    if (i > ticks(1)) runs += w.events.filter((e) => e.type === 'treadGo').length;
    calm(w);
  }
  assert.equal(boss.bossPhase, 1);
  assert.ok(boss.rail, 'no está en su cinta');
  assert.equal(runs, 0, 'sigue avanzando sobre sus orugas en la cinta');
});

test('deterministas: dos combates iguales acaban igual', () => {
  for (const id of ['centralita', 'trituradora'] as const) {
    const run = (): string => {
      const { w, boss } = fight(id, 'det');
      for (let i = 0; i < ticks(15); i++) step(w, stroll(i, boss));
      return worldHash(w);
    };
    assert.equal(run(), run());
  }
});
