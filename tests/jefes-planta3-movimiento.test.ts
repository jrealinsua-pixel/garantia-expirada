// M14b (h10b1): floor 3's bosses, each with a way of moving only it has.
// - The Muñeco de Moda walks a catwalk: straight legs, only across or only up and down, round the
//   toaster, and a pose at the end of each one.
// - The Consola Edición Coleccionista lags: its ghost walks and it snaps to it now and then, or
//   rubber-bands back to where it was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { createWorld, DT, NO_INPUT, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const MUNECO = ENEMIES['muneco-moda']!;
const CAT = (MUNECO.brain as BossBrain).catwalk!;
const CONSOLA = ENEMIES['consola-coleccionista']!;
const LAG = (CONSOLA.brain as BossBrain).lag!;

function fight(id: 'muneco-moda' | 'consola-coleccionista', seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-jugueteria', level: 3, ...(id === 'consola-coleccionista' ? { boss: 'È' } : {}) });
  w.intro = null;
  w.noDamage = true;
  return { w, boss: w.enemies.find((e) => e.def.id === id)! };
}

/** The toaster strolls about a little (so the legs and the ghost have something to follow). */
const stroll = (i: number, boss: Enemy) => ({ ...NO_INPUT, moveX: Math.sin(i / 110) * 0.7, moveY: Math.cos(i / 150) * 0.5, aimX: boss.x, aimY: boss.y });

test('los datos: solo el Muñeco desfila y solo la Consola va con lag', () => {
  assert.ok(CAT.stride > 1 && CAT.pose > 0.2 && CAT.pose < 1 && CAT.rise >= 40);
  assert.ok(LAG.every[0] >= 0.3 && LAG.every[1] >= LAG.every[0] && LAG.every[1] < 1.5 && LAG.back > 0 && LAG.back < 0.5);
  for (const d of Object.values(ENEMIES)) {
    if (d.brain.kind !== 'boss') continue;
    if (d.id !== 'muneco-moda') assert.ok(!d.brain.catwalk, `${d.id} también desfila`);
    if (d.id !== 'consola-coleccionista') assert.ok(!d.brain.lag, `${d.id} también va con lag`);
  }
});

test('el Muñeco anda en línea recta, solo de lado o solo arriba y abajo, y posa al final de cada tramo', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('muneco-moda', `desfile-${s}`);
    let poses = 0;
    let diagonal = 0;
    let moving = 0;
    let posing = 0;
    let posingStill = 0;
    for (let i = 0; i < ticks(25); i++) {
      const ox = boss.x;
      const oy = boss.y;
      const wasPosing = (boss.catPose ?? 0) > DT && boss.state === 'idle';
      step(w, stroll(i, boss));
      for (const e of w.events) if (e.type === 'pose') poses++;
      if (boss.state === 'charge') continue; // the runway attack goes its own way
      const dx = Math.abs(boss.x - ox);
      const dy = Math.abs(boss.y - oy);
      if (boss.state === 'idle' || boss.state === 'fire') {
        if (dx + dy > 0.3) {
          moving++;
          if (dx > 0.15 && dy > 0.15) diagonal++;
        }
        if (wasPosing && boss.state === 'idle') {
          posing++;
          if (dx + dy < 0.01) posingStill++;
        }
      }
      w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
    }
    assert.ok(moving > ticks(5), `apenas anda (${moving} ticks)`);
    assert.ok(diagonal / moving < 0.03, `anda en diagonal el ${((diagonal / moving) * 100).toFixed(1)} % del tiempo`);
    assert.ok(poses >= 4, `posa ${poses} veces en 25 s`);
    assert.equal(posingStill, posing, 'se mueve mientras posa');
  }
});

test('el Muñeco alterna tramos de lado y de arriba abajo y acaba los de lado a la altura de la tostadora', () => {
  const { w, boss } = fight('muneco-moda', 'tramos');
  let last: boolean | undefined;
  let alternations = 0;
  let rowsChecked = 0;
  for (let i = 0; i < ticks(25); i++) {
    const before = boss.catTo;
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    // A leg just ended: it was across or up and down, alternately.
    if (before && !boss.catTo && boss.catAcross !== undefined && boss.state !== 'roar') {
      if (last !== undefined && last !== boss.catAcross) alternations++;
      last = boss.catAcross;
      // Across legs end on the (standing) toaster's row, `keep` to one side of it.
      if (boss.catAcross && Math.abs(boss.x - before.x) < 2) {
        assert.ok(Math.abs(boss.y - w.player.y) <= CAT.rise + 2);
        rowsChecked++;
      }
    }
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.ok(alternations >= 3, `${alternations} cambios de tramo`);
  assert.ok(rowsChecked >= 1);
});

test('el Muñeco posa con su fotograma de pose y la pose es más corta cuanta menos vida le queda', () => {
  const { w, boss } = fight('muneco-moda', 'pose');
  let seen = false;
  for (let i = 0; i < ticks(10) && !seen; i++) {
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    if (boss.state === 'idle' && (boss.catPose ?? 0) > 0) {
      assert.equal(enemyFrame(boss, 0), MUNECO.anim!.warn);
      seen = true;
    }
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.ok(seen, 'no posa entre ataques');
  // With a third of its life the pose is shorter (rage).
  const full: number[] = [];
  const hurt: number[] = [];
  for (const [hp, out] of [[1, full], [0.3, hurt]] as const) {
    const f = fight('muneco-moda', 'rabia');
    f.boss.damageTaken = Math.round(MUNECO.hp * (1 - hp));
    for (let i = 0; i < ticks(12); i++) {
      step(f.w, { ...NO_INPUT, aimX: f.boss.x, aimY: f.boss.y });
      for (const e of f.w.events) if (e.type === 'pose') out.push(f.boss.catPose!);
      f.w.bullets = f.w.bullets.filter((b) => b.owner !== 'enemy');
    }
  }
  assert.ok(full.length > 0 && hurt.length > 0);
  assert.ok(Math.max(...hurt) < Math.min(...full), 'la pose no se acorta con la rabia');
});

test('la Consola no se mueve donde la ves: se queda quieta y salta a su fantasma', () => {
  for (let s = 0; s < 3; s++) {
    const { w, boss } = fight('consola-coleccionista', `lag-${s}`);
    let snaps = 0;
    let backs = 0;
    let crept = 0;
    let lastSnap = -1;
    let gaps: number[] = [];
    for (let i = 0; i < ticks(30); i++) {
      const ox = boss.x;
      const oy = boss.y;
      step(w, stroll(i, boss));
      let snapped = false;
      for (const e of w.events) {
        if (e.type !== 'lag') continue;
        snapped = true;
        snaps++;
        if (e.back) backs++;
        assert.ok(Math.abs(e.tx - boss.x) < 1e-6 && Math.abs(e.ty - boss.y) < 1e-6, 'no acaba donde dice el salto');
        // Never onto the toaster.
        assert.ok(Math.hypot(boss.x - w.player.x, boss.y - w.player.y) >= boss.def.footRadius + w.player.def.footRadius);
        if (lastSnap >= 0) gaps.push((i - lastSnap) * DT);
        lastSnap = i;
      }
      // Between snaps it does not creep (it may only be pushed by something else, which it is not here).
      if (!snapped && Math.hypot(boss.x - ox, boss.y - oy) > 0.01) crept++;
      w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
    }
    assert.ok(snaps >= 10, `salta ${snaps} veces en 30 s`);
    assert.ok(backs >= 1 && backs < snaps / 2, `${backs} de ${snaps} saltos hacia atrás`);
    assert.equal(crept, 0, 'se mueve entre saltos');
    gaps = gaps.sort((a, b) => a - b);
    // Its snaps come every `every` s or so (later while it fires or would land on the toaster).
    assert.ok(gaps[0]! >= LAG.every[0] - DT * 1.5, `dos saltos a ${gaps[0]!.toFixed(2)} s`);
  }
});

test('el fantasma de la Consola anda como un jefe y ella acaba donde estaba él', () => {
  const { w, boss } = fight('consola-coleccionista', 'fantasma');
  let far = 0;
  for (let i = 0; i < ticks(20); i++) {
    const g = boss.lagGhost ? { ...boss.lagGhost } : undefined;
    step(w, stroll(i, boss));
    for (const e of w.events) {
      if (e.type === 'lag' && !e.back && g) {
        // Where its ghost was (give or take this tick's step).
        assert.ok(Math.hypot(e.tx - g.x, e.ty - g.y) < 3, 'no salta a su fantasma');
      }
    }
    if (boss.lagGhost && Math.hypot(boss.lagGhost.x - boss.x, boss.lagGhost.y - boss.y) > 12) far++;
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.ok(far > ticks(4), 'el fantasma no se separa de ella');
});

test('la Consola no hace lag mientras se actualiza, y el cambio de fase le quita el fantasma', () => {
  const { w, boss } = fight('consola-coleccionista', 'actualiza');
  let stunned = 0;
  for (let i = 0; i < ticks(30); i++) {
    const ox = boss.x;
    const oy = boss.y;
    const gx = boss.lagGhost?.x;
    const was = boss.state;
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    if (boss.state === 'stun' && was === 'stun') {
      stunned++;
      assert.ok(Math.hypot(boss.x - ox, boss.y - oy) < 1e-6);
      if (gx !== undefined && boss.lagGhost) assert.equal(boss.lagGhost.x, gx);
      assert.ok(!w.events.some((e) => e.type === 'lag'));
    }
    w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  }
  assert.ok(stunned > 0, 'no se ha actualizado en 30 s');
  boss.damageTaken = Math.ceil(CONSOLA.hp * 0.55);
  step(w, { ...NO_INPUT });
  assert.equal(boss.state, 'roar');
  assert.equal(boss.lagGhost, undefined);
});

test('deterministas: dos combates iguales acaban igual', () => {
  for (const id of ['muneco-moda', 'consola-coleccionista'] as const) {
    const run = (): string => {
      const { w, boss } = fight(id, 'det');
      for (let i = 0; i < ticks(15); i++) step(w, stroll(i, boss));
      return worldHash(w);
    };
    assert.equal(run(), run());
  }
});
