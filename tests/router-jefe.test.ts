// El Router del Wifi en la simulación (M8, jefe de la planta 2): repetidores, anillos con hueco,
// reinicio a media vida y caídas de conexión.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { floorBossOf } from '../src/data/rooms.ts';
import type { BossBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { relaysOf } from '../src/sim/enemies.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, DT, NO_INPUT, step, worldHash, type Bullet, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['router-wifi']!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'router'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-informatica', level: 2 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'router-wifi');
  assert.ok(boss, 'el Router está en la Sala de Redes');
  return { w, boss };
}

const run = (w: World, s: number): void => {
  for (let i = 0; i < ticks(s); i++) step(w, NO_INPUT);
};

test('el Router es el jefe de la planta 2 (la Nevera sigue en la 1) y entra con su cartel', () => {
  assert.equal(floorBossOf(1), 'N');
  assert.equal(floorBossOf(2), 'X');
  assert.equal(def.boss?.subtitle, 'Jefe de planta · Informática');
  assert.equal(def.boss?.motto, 'Cobertura total. En la otra habitación.');
  const f2 = createWorld({ seed: 'planta-router', floor: true, level: 2 }).floor!;
  const bossRoom = f2.rooms.find((r) => r.template.kind === 'boss')!;
  assert.ok(bossRoom.template.rows.join('').includes('X'));
  assert.ok(!bossRoom.template.rows.join('').includes('N'));
  const f1 = createWorld({ seed: 'planta-router', floor: true }).floor!;
  assert.ok(f1.rooms.find((r) => r.template.kind === 'boss')!.template.rows.join('').includes('N'));
});

test('los anillos tienen su hueco: ninguna bala en la «zona sin cobertura»', () => {
  const aim = 0.7;
  const shots = expandPattern(PATTERNS['router-cobertura']!, aim, new Rng('x'));
  const first = shots.filter((s) => s.delay === 0);
  const gap = (35 * Math.PI) / 180;
  const off = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  assert.ok(first.length > 15 && first.length < 24, `${first.length} balas`);
  for (const s of first) assert.ok(off(s.angle, aim + gap) >= (28 * Math.PI) / 180, 'nada en el hueco');
  // Phase 2: two holes, either side of the aim, moving apart ring after ring.
  const fw = expandPattern(PATTERNS['router-firmware']!, aim, new Rng('x'));
  const last = fw.filter((s) => s.delay === Math.max(...fw.map((x) => x.delay)));
  for (const g of [90, -90]) for (const s of last) assert.ok(off(s.angle, aim + (g * Math.PI) / 180) >= (22 * Math.PI) / 180);
});

test('fase 1: planta dos repetidores en las esquinas y le reenvían los anillos', () => {
  const { w, boss } = fight();
  step(w, NO_INPUT);
  const relays = relaysOf(w, boss);
  assert.equal(relays.length, 2, 'dos repetidores');
  for (const r of relays) {
    assert.equal(r.def.id, 'repetidor');
    const nearSide = Math.min(r.x, w.room.cols * 24 - r.x);
    assert.ok(nearSide < 130, 'en una esquina');
  }
  // Sooner or later a wave: the repeaters fire too, each from where it stands.
  let relayed = false;
  for (let i = 0; i < ticks(20) && !relayed; i++) {
    step(w, NO_INPUT);
    relayed = relays.every((r) => w.emitters.some((e) => e.source === r.id && Math.hypot(e.x - r.x, e.y - r.y) < 20));
  }
  assert.ok(relayed, 'los repetidores reenvían la onda');
});

test('a media vida se reinicia: 5 s apagado, sin recibir daño, sin balas y sin repetidores', () => {
  const { w, boss } = fight('reinicio');
  run(w, 3);
  assert.ok(relaysOf(w, boss).length > 0);
  boss.damageTaken = def.hp * 0.51;
  let reboot = '';
  for (let i = 0; i < ticks(1) && !reboot; i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'bossPhase' && e.reboot) reboot = e.reboot;
  }
  assert.ok(reboot.startsWith('Reiniciando'), 'avisa de que se reinicia');
  assert.equal(boss.state, 'roar');
  assert.equal(boss.until, brain.phases[1]!.reboot!.time);
  step(w, NO_INPUT);
  assert.equal(relaysOf(w, boss).length, 0, 'los repetidores caen');
  assert.ok(!w.enemies.some((e) => e.def.id === 'repetidor'));
  assert.equal(w.bullets.filter((b) => b.owner === 'enemy').length, 0, 'se limpian las balas');
  // The lights come on one by one.
  const frames = new Set<number>();
  const hp = boss.damageTaken;
  for (let i = 0; i < ticks(4.8); i++) {
    frames.add(enemyFrame(boss, i * 16));
    w.bullets.push({ id: w.nextId++, owner: 'player', x: boss.x, y: boss.y - 30, vx: 0, vy: 0, r: 2, life: 1, damage: 3, knockback: 0, color: 'red', age: 0, dir: 0, speed: 0, h: 0 } satisfies Bullet);
    step(w, NO_INPUT);
  }
  assert.deepEqual([...frames].sort((a, b) => a - b), [6, 7, 8, 9, 10, 11]);
  assert.equal(boss.damageTaken, hp, 'reiniciándose no recibe daño');
  run(w, 0.5);
  assert.notEqual(boss.state, 'roar', 'vuelve');
});

test('fase 2: sin repetidores, planta uno cada 12 s; las caídas de conexión salen del suelo', () => {
  const { w, boss } = fight('fase2');
  run(w, 1);
  boss.damageTaken = def.hp * 0.51;
  run(w, 6);
  assert.equal(relaysOf(w, boss).length, 0);
  let drops = false;
  for (let i = 0; i < ticks(14); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'drops')) {
      drops = true;
      // Marked on the floor, away from the boss's muzzle, each with its warning.
      const far = w.emitters.filter((e) => e.source === boss.id && e.height <= 3);
      assert.equal(far.length, 3);
    }
  }
  assert.equal(relaysOf(w, boss).length, 1, 'un repetidor nuevo a los 12 s');
  assert.ok(drops, 'en 14 s hay alguna caída de conexión');
});

test('al caer el Router caen sus repetidores, sube el montacargas, y todo es determinista', () => {
  const { w, boss } = fight('final');
  run(w, 1);
  boss.damageTaken = def.hp;
  run(w, 4);
  assert.equal(w.enemies.length, 0, 'ni el Router ni sus repetidores');
  assert.ok(w.lift, 'el montacargas');
  const hash = (): string => {
    const { w: x } = fight('det');
    x.noDamage = false;
    for (let i = 0; i < ticks(30); i++) step(x, { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
    return worldHash(x);
  };
  assert.equal(hash(), hash());
});
