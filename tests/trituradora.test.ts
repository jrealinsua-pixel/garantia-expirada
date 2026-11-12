// La Trituradora en la simulación (M12 (4a)), el jefe final, en el Taller de Reacondicionado: su
// sala al final de la planta 6, sus sprites, y la fase 1 «Diagnóstico» (escanea a la tostadora y
// responde con un patrón de cada jefe vencido, uno por turno, en versión reacondicionada).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { LORE } from '../src/data/lore.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { floorBossOf, ROOMS, templatesOf } from '../src/data/rooms.ts';
import { FLOOR_BOSSES } from '../src/data/servicio.ts';
import type { BossBrain, BossPatternAttack } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { Bot } from '../src/sim/bot.ts';
import { textWidth } from '../src/art/font.ts';
import { checkInvariants, createWorld, DT, isLastFloor, NO_INPUT, SERVICE_LEVEL, step, type Enemy, type SimEvent, type World } from '../src/sim/world.ts';
import { makeTrituradoraFrames, TRITURADORA_FRAMES, TRITURADORA_H, TRITURADORA_W } from '../tools/sprites/trituradora.ts';

const def = ENEMIES.trituradora!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'trituradora'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-taller', level: SERVICE_LEVEL });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'trituradora');
  assert.ok(boss, 'la Trituradora está en su sala');
  return { w, boss };
}

test('la Trituradora es el jefe de la planta 6, con su sala, su cartel, su causa de baja y su documento', () => {
  assert.equal(floorBossOf(SERVICE_LEVEL), 'Ü');
  assert.equal(floorBossOf(5), 'Ú', 'la Centralita sigue en la 5');
  assert.deepEqual(templatesOf('boss', SERVICE_LEVEL).map((t) => t.id), ['jefe-taller']);
  assert.equal(ROOMS['jefe-taller']!.level, SERVICE_LEVEL);
  assert.equal(def.boss?.title, 'La Trituradora');
  assert.ok(DOWN_CAUSES.trituradora?.bullet && DOWN_CAUSES.trituradora?.contact);
  // Its document is the Servicio Técnico's own: it does not count for the appointment.
  const doc = LORE.find((l) => 'boss' in l.source && l.source.boss === 'trituradora');
  assert.ok(doc?.beyond);
  // More life than any floor boss: it is the last.
  for (const b of FLOOR_BOSSES) assert.ok(def.hp > ENEMIES[b]!.hp, b);
});

test('en la planta 6 con cita, la última sala es la suya y vencerla acaba la partida', () => {
  const w = createWorld({ seed: 'trit-planta', floor: true, level: SERVICE_LEVEL, service: true });
  assert.ok(isLastFloor(w));
  const last = w.floor!.rooms.find((r) => r.template.kind === 'boss')!;
  assert.equal(last.template.id, 'jefe-taller');
});

test('sus fotogramas: el tamaño de la hoja, distintos entre sí, y los que piden los datos existen', () => {
  const frames = makeTrituradoraFrames();
  assert.equal(frames.length, TRITURADORA_FRAMES.length);
  for (const f of frames) assert.ok(f.w === TRITURADORA_W && f.h === TRITURADORA_H);
  const keys = frames.map((f) => JSON.stringify(f.p));
  assert.equal(new Set(keys).size, frames.length, 'ningún fotograma repetido');
  const anim = def.anim!;
  for (const i of [...anim.idle, ...(anim.walk ?? []), anim.warn ?? 0]) assert.ok(i < frames.length, `fotograma ${i}`);
  for (const a of brain.phases[0]!.attacks) if (a.kind === 'pattern' && a.pose !== undefined) assert.ok(a.pose < frames.length);
  // Its feet are on the bottom of the tracks: the anchor sits on the last painted row.
  const f0 = frames[0]!;
  const painted = (y: number): boolean => f0.p[y]!.some((c) => c[3] > 0);
  assert.ok(painted(def.anchor.y - 1) && !painted(def.anchor.y + 1), 'el ancla está en el suelo');
});

test('«Diagnóstico»: un ataque por jefe vencido, en orden y vuelta a empezar, cada uno con su escaneo', () => {
  const ph = brain.phases[0]!;
  assert.equal(ph.name, 'Diagnóstico');
  assert.ok(ph.cycle);
  assert.equal(ph.attacks.length, FLOOR_BOSSES.length);
  for (const a of ph.attacks) {
    assert.equal(a.kind, 'pattern');
    const pa = a as BossPatternAttack;
    assert.ok(PATTERNS[pa.pattern], pa.pattern);
    assert.ok(pa.scan && pa.scan.startsWith('Diagnóstico:'), String(pa.scan));
    assert.ok(textWidth(pa.scan) <= 200, `«${pa.scan}» cabe sobre ella`);
  }
  // Each one is a pattern of a fallen boss: its bullets look like that boss's.
  const looks = ph.attacks.map((a) => {
    const p = PATTERNS[(a as BossPatternAttack).pattern]!;
    const first = p.kind === 'sequence' ? p.parts[0]!.pattern : p;
    return 'color' in first ? first.color : undefined;
  });
  assert.deepEqual(looks, ['ice', 'cyan', 'accessory', 'bizcard', 'note']);

  const { w, boss } = fight();
  const order: number[] = [];
  const scans: Array<Extract<SimEvent, { type: 'scan' }>> = [];
  for (let i = 0; i < ticks(60) && order.length < 7; i++) {
    const before = boss.attack;
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    for (const e of w.events) if (e.type === 'scan') scans.push(e);
    if (boss.attack !== undefined && (boss.attack !== before || order.length === 0) && boss.state === 'fire' && order[order.length - 1] !== boss.attack) order.push(boss.attack);
  }
  assert.deepEqual(order, [0, 1, 2, 3, 4, 0, 1], 'uno por turno, en orden');
  assert.ok(scans.length >= 7);
  assert.equal(scans[0]!.line, (ph.attacks[0] as BossPatternAttack).scan);
  assert.equal(scans[0]!.time, ph.attacks[0]!.telegraph);
  assert.deepEqual(checkInvariants(w), []);
});

test('el bot pelea contra ella sin romper nada y la acaba venciendo alguna vez', () => {
  let won = 0;
  for (let i = 0; i < 4; i++) {
    const w = createWorld({ seed: `trit-bot-${i}`, room: 'jefe-taller', level: SERVICE_LEVEL });
    w.intro = null;
    w.noDamage = true;
    const bot = new Bot(`trit-bot-${i}`);
    for (let t = 0; t < ticks(240) && !w.over && !w.won; t++) {
      step(w, bot.think(w));
      if (w.events.some((e) => e.type === 'bossDying')) won++;
      if (t % 60 === 0) assert.deepEqual(checkInvariants(w), [], `tick ${t}`);
    }
  }
  assert.ok(won >= 1, `la vence ${won} de 4 veces sin recibir daño`);
});
