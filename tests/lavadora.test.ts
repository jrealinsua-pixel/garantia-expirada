// M14 (j2): La Lavadora Programa Eco, el segundo jefe de la planta 1. Tres programas (Prelavado:
// anillos de espuma lentos que se pueden reventar; Lavado: calcetines desparejados que rebotan en
// las paredes; Centrifugado: espirales rápidas mientras tiembla) y, entre medias, se para a pesar la
// carga: la ventana para pegarle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { floorBossPool } from '../src/data/rooms.ts';
import type { BossBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { bossesOfFloor, pickFloorBoss } from '../src/sim/bosses.ts';
import { enemyFrame, rattleOffset } from '../src/render/enemyAnim.ts';
import { LAVADORA_PER_PROGRAM, makeLavadoraFrames } from '../tools/sprites/lavadora.ts';
import { checkInvariants, createWorld, DT, firePattern, NO_INPUT, step, takenScale, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['lavadora-eco']!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'lavadora'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe', level: 1, boss: 'À' });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'lavadora-eco');
  assert.ok(boss, 'la Lavadora está en la sala del jefe de la planta 1');
  return { w, boss };
}

test('la planta 1 elige entre la Nevera y la Lavadora con la semilla, más o menos a medias', () => {
  assert.deepEqual(floorBossPool(1), ['N', 'À']);
  assert.deepEqual(bossesOfFloor(1), ['nevera-suprema', 'lavadora-eco']);
  let lav = 0;
  for (let i = 0; i < 400; i++) if (pickFloorBoss(`s-${i}`, 1) === 'À') lav++;
  assert.ok(lav > 140 && lav < 260, `${lav} de 400`);
  // The same seed, the same boss, and the boss room of a whole floor has it.
  assert.equal(pickFloorBoss('x', 1), pickFloorBoss('x', 1));
  const seed = Array.from({ length: 50 }, (_, i) => `p-${i}`).find((s) => pickFloorBoss(s, 1) === 'À')!;
  const w = createWorld({ seed, floor: true, level: 1 });
  assert.equal(w.floor!.boss, 'À');
});

test('sus datos: tres programas, nombre, lema, causa de baja y una hoja de 21 fotogramas', () => {
  assert.deepEqual(brain.phases.map((p) => p.name), ['Prelavado', 'Lavado', 'Centrifugado']);
  assert.deepEqual(brain.phases.map((p) => p.frameShift ?? 0), [0, LAVADORA_PER_PROGRAM, 2 * LAVADORA_PER_PROGRAM]);
  for (const p of brain.phases) {
    assert.equal(p.mute?.line, 'Pesando la carga…');
    assert.ok((p.mute?.taken ?? 1) > 1);
    for (const a of p.attacks) if (a.kind === 'pattern') assert.ok(PATTERNS[a.pattern], a.pattern);
  }
  assert.equal(def.boss?.motto, 'Tres horas para lavar lo mismo. Pero ahorra.');
  assert.ok(DOWN_CAUSES['lavadora-eco']?.bullet && DOWN_CAUSES['lavadora-eco']?.contact);
  const frames = makeLavadoraFrames();
  assert.equal(frames.length, 3 * LAVADORA_PER_PROGRAM);
  for (const f of frames) assert.deepEqual([f.w, f.h], [72, 76]);
});

test('Lavado: los calcetines rebotan en las paredes (dos veces) en lugar de romperse', () => {
  const { w, boss } = fight('calcetines');
  w.enemies = [boss];
  boss.state = 'roar';
  boss.until = 999;
  // Straight at the left wall from the middle of the room.
  firePattern(w, PATTERNS['lavadora-calcetines']!, w.room.w / 2, w.room.h / 2, Math.PI, { by: 'lavadora-eco' });
  let bounced = 0;
  let turned = false;
  for (let i = 0; i < ticks(4); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'bulletWall' && e.bounced) bounced++;
    if (w.bullets.some((b) => b.color === 'sock' && b.vx > 0)) turned = true;
    assert.deepEqual(checkInvariants(w), []);
  }
  assert.ok(turned, 'vuelven hacia la sala');
  assert.ok(bounced >= 5, `${bounced} rebotes`);
  assert.ok(bounced <= 10, 'como mucho dos por calcetín');
});

test('Prelavado: la espuma frena hasta quedarse flotando, y se revienta a tiros', () => {
  const ring = PATTERNS['lavadora-espuma']!;
  assert.equal(ring.kind, 'sequence');
  if (ring.kind === 'sequence') {
    for (const part of ring.parts) {
      const p = part.pattern;
      assert.ok(p.kind !== 'sequence' && p.shootable && (p.accel ?? 0) < 0 && (p.radius ?? 0) >= 6);
    }
  }
  const { w, boss } = fight('espuma');
  w.enemies = [boss];
  boss.state = 'roar';
  boss.until = 999;
  firePattern(w, ring, w.room.w / 2, w.room.h / 2 - 40, 0, { by: 'lavadora-eco' });
  for (let i = 0; i < ticks(3); i++) step(w, NO_INPUT);
  const foam = w.bullets.filter((b) => b.color === 'foam');
  assert.ok(foam.length >= 12, `${foam.length} pompas`);
  assert.ok(foam.every((b) => b.speed <= 12 && b.shootable), 'flotando, y se pueden romper');
});

test('se para a pesar la carga: quieta, sin atacar, con su frase y más daño; el centrifugado tiembla', () => {
  const { w, boss } = fight('pesar');
  let weighed = 0;
  for (let i = 0; i < ticks(25); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) {
      if (e.type !== 'mute') continue;
      weighed++;
      assert.equal(e.line, 'Pesando la carga…');
      assert.equal(boss.state, 'stun');
      assert.equal(takenScale(boss), 1.5);
      assert.equal(enemyFrame(boss, 0), 6, 'mirándose los pies');
      assert.deepEqual(rattleOffset(boss, 0), { x: 0, y: 0 });
    }
  }
  assert.ok(weighed >= 2, `${weighed} pesadas en 25 s`);
  // Centrifugado: its own frames, fourteen on, and it rattles while it moves about.
  boss.damageTaken = Math.ceil(def.hp * 0.7);
  for (let i = 0; i < ticks(3); i++) step(w, NO_INPUT);
  assert.equal(boss.bossPhase, 2);
  assert.ok(enemyFrame(boss, 0) >= 14);
  boss.state = 'idle';
  const offs = new Set([0, 45, 90, 135].map((t) => rattleOffset(boss, t).x));
  assert.deepEqual([...offs].sort(), [-1, 1]);
});
