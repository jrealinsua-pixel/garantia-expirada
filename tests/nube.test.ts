// M14 (j3): La Nube de Almacenamiento, el segundo jefe de la planta 2. Flota y llueve en columnas
// marcadas; «Sincronizando…» llena una barra que suelta un anillo enorme si no se la rompes a tiros;
// y con el «Almacenamiento lleno» deja caer muros de carpetas que hay que romper (o esperar).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { PROPS } from '../src/data/props.ts';
import { floorBossPool } from '../src/data/rooms.ts';
import type { BossBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { bossesOfFloor, pickFloorBoss } from '../src/sim/bosses.ts';
import { dropFolders, rainColumns } from '../src/sim/enemies.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { makeNubeFrames, NUBE_PER_PHASE } from '../tools/sprites/nube.ts';
import { activeWarnings, checkInvariants, createWorld, damageProp, DT, firePattern, NO_INPUT, step, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['nube-almacenamiento']!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'nube'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-informatica', level: 2, boss: 'Ç' });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'nube-almacenamiento');
  assert.ok(boss, 'la Nube está en la sala del jefe de la planta 2');
  return { w, boss };
}

/** Makes the boss do attack `i` of its current phase right now. */
function force(w: World, boss: Enemy, kind: string): void {
  const ph = brain.phases[boss.bossPhase ?? 0]!;
  const i = ph.attacks.findIndex((a) => a.kind === kind);
  assert.ok(i >= 0, kind);
  // Only this attack is left to pick, with no rest before it.
  boss.state = 'idle';
  boss.t = 0;
  boss.until = 0;
  boss.attack = undefined;
  const saved = ph.attacks.map((a) => a.weight);
  ph.attacks.forEach((a, j) => ((a as { weight: number }).weight = j === i ? 1 : 0));
  step(w, NO_INPUT);
  ph.attacks.forEach((a, j) => ((a as { weight: number }).weight = saved[j]!));
}

test('la planta 2 elige entre el Router y la Nube con la semilla, más o menos a medias', () => {
  assert.deepEqual(floorBossPool(2), ['X', 'Ç']);
  assert.deepEqual(bossesOfFloor(2), ['router-wifi', 'nube-almacenamiento']);
  let nube = 0;
  for (let i = 0; i < 400; i++) if (pickFloorBoss(`s-${i}`, 2) === 'Ç') nube++;
  assert.ok(nube > 140 && nube < 260, `${nube} de 400`);
});

test('sus datos: dos fases, lema, causa de baja, la carpeta y una hoja de 12 fotogramas', () => {
  assert.deepEqual(brain.phases.map((p) => p.name), ['Subiendo archivos', 'Almacenamiento lleno']);
  assert.deepEqual(brain.phases.map((p) => p.frameShift ?? 0), [0, NUBE_PER_PHASE]);
  for (const p of brain.phases) {
    for (const a of p.attacks) {
      if (a.kind === 'pattern' || a.kind === 'rain' || a.kind === 'sync') assert.ok(PATTERNS[a.pattern], a.pattern);
    }
  }
  assert.equal(def.boss?.motto, 'Sus archivos, a salvo en la nube. Ya no son suyos.');
  assert.ok(DOWN_CAUSES['nube-almacenamiento']?.bullet && DOWN_CAUSES['nube-almacenamiento']?.contact);
  const carpeta = PROPS['carpeta-nube']!;
  assert.ok(carpeta.crumble && carpeta.hp && carpeta.blocksBullets);
  const frames = makeNubeFrames();
  assert.equal(frames.length, 2 * NUBE_PER_PHASE);
  for (const f of frames) assert.deepEqual([f.w, f.h], [72, 76]);
});

test('lluvia en columnas: una sobre el jugador, las demás separadas, marcadas desde la pared del fondo', () => {
  const { w, boss } = fight('lluvia');
  const xs = rainColumns(w, 5, 50);
  assert.equal(xs.length, 5);
  assert.ok(Math.abs(xs[0]! - w.player.x) < 1);
  for (const a of xs) for (const b of xs) if (a !== b) assert.ok(Math.abs(a - b) >= 50);
  force(w, boss, 'rain');
  const lanes = activeWarnings(w).filter((wn) => wn.mark === 'rain');
  assert.equal(lanes.length, 5, 'cinco calles avisadas');
  assert.ok(lanes.every((wn) => (wn.size?.h ?? 0) > w.room.h / 2), 'de arriba abajo');
  // Then it falls: drops going straight down.
  for (let i = 0; i < ticks(1.4); i++) step(w, NO_INPUT);
  const drops = w.bullets.filter((b) => b.color === 'drop');
  assert.ok(drops.length >= 5);
  assert.ok(drops.every((b) => b.vy > 0 && Math.abs(b.vx) < 1));
  assert.deepEqual(checkInvariants(w), []);
});

test('sincronizando: si se llena, suelta el anillo; si le das lo bastante, error y aturdida', () => {
  const { w, boss } = fight('sync');
  force(w, boss, 'sync');
  assert.equal(boss.state, 'warn');
  let done = 0;
  for (let i = 0; i < ticks(4) && !done; i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'syncEnd' && e.done) done++;
  }
  assert.equal(done, 1, 'la barra se llena');
  for (let i = 0; i < ticks(0.7); i++) step(w, NO_INPUT);
  assert.ok(w.bullets.filter((b) => b.color === 'file' || b.color === 'drop').length >= 40, 'el anillo enorme');
  // Again, and this time it is hurt while it fills.
  const { w: w2, boss: b2 } = fight('sync-2');
  force(w2, b2, 'sync');
  const a = brain.phases[0]!.attacks.find((x) => x.kind === 'sync')!;
  assert.ok(a.kind === 'sync');
  b2.damageTaken += a.cancel;
  let broke = false;
  step(w2, NO_INPUT);
  for (const e of w2.events) if (e.type === 'syncEnd' && !e.done) broke = true;
  assert.ok(broke, 'Error de sincronización');
  assert.equal(b2.state, 'stun');
  assert.equal(enemyFrame(b2, 0), 5, 'con las X en los ojos');
  for (let i = 0; i < ticks(2.5); i++) step(w2, NO_INPUT);
  assert.ok(!w2.bullets.some((b) => b.color === 'file' && b.speed < 80), 'no hubo anillo');
});

test('almacenamiento lleno: un muro de carpetas que para balas, se rompe a tiros (solo las del jugador) y caduca', () => {
  const { w, boss } = fight('carpetas');
  boss.damageTaken = Math.ceil(def.hp * 0.55);
  for (let i = 0; i < ticks(2.5); i++) step(w, NO_INPUT);
  assert.equal(boss.bossPhase, 1);
  // Put the toaster well away from it, so there is room for the wall.
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h - 60;
  boss.x = w.room.w / 2;
  boss.y = 110;
  const a = brain.phases[1]!.attacks.find((x) => x.kind === 'folders')!;
  assert.ok(a.kind === 'folders');
  const spots = dropFolders(w, boss, a);
  assert.ok(spots.length >= 3, `${spots.length} carpetas`);
  const folders = w.room.props.filter((p) => p.def.id === 'carpeta-nube');
  assert.equal(folders.length, spots.length);
  // Between the two: across the line.
  for (const f of folders) assert.ok(f.y > boss.y && f.y < w.player.y);
  // From here on the Nube just watches.
  boss.state = 'roar';
  boss.until = 999;
  // Its own rain stops on them and does them no harm; the toaster's shots wear them down.
  const f1 = folders[1]!;
  firePattern(w, PATTERNS['nube-lluvia']!, f1.x, f1.box.y - 30, Math.PI / 2, { by: 'nube-almacenamiento' });
  for (let i = 0; i < ticks(1.2); i++) step(w, NO_INPUT);
  assert.ok(w.room.props.includes(f1) && !f1.damage, 'la lluvia no la gasta');
  const f0 = folders[0]!;
  damageProp(w, f0, PROPS['carpeta-nube']!.hp!);
  assert.ok(!w.room.props.includes(f0), 'rota a tiros');
  // And the rest go by themselves.
  for (let i = 0; i < ticks(a.life - 1); i++) step(w, NO_INPUT);
  assert.equal(w.room.props.filter((p) => p.def.id === 'carpeta-nube').length, 0);
  assert.deepEqual(checkInvariants(w), []);
});

test('al caer la Nube, sus carpetas se van con ella', () => {
  const { w, boss } = fight('caida');
  boss.damageTaken = Math.ceil(def.hp * 0.55);
  for (let i = 0; i < ticks(2.5); i++) step(w, NO_INPUT);
  w.player.y = w.room.h - 60;
  boss.y = 110;
  const a = brain.phases[1]!.attacks.find((x) => x.kind === 'folders')!;
  assert.ok(a.kind === 'folders');
  dropFolders(w, boss, a);
  boss.damageTaken = def.hp;
  step(w, NO_INPUT);
  step(w, NO_INPUT);
  assert.equal(w.room.props.filter((p) => p.def.id === 'carpeta-nube').length, 0);
});
