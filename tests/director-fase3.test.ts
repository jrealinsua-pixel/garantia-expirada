// El Director de Recursos Inhumanos, fase 3 (M10 planta 4 5c): «Despido procedente». Se levanta:
// su silla sale rodando sola y embiste en línea recta; él, de pie y más lento, gira sobre sí mismo
// soltando la línea de recortes (una espiral con un hueco que hay que seguir) y abanicos de tarjetas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import type { BossBrain, ChargerBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { isSpinning } from '../src/sim/enemies.ts';
import { expandPattern, isAimed, type ShotSpec, type SpiralDef } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { checkInvariants, createWorld, DT, isClear, isDead, NO_INPUT, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';

const def = ENEMIES['director-rrhh']!;
const brain = def.brain as BossBrain;
const last = brain.phases[brain.phases.length - 1]!;
const chairDef = ENEMIES['silla-director']!;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-oficinas', level: 4 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'director-rrhh')!;
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  return { w, boss };
}

/** Takes him down to phase 3 and steps `s` seconds, gathering the events. */
function toPhase3(w: World, boss: Enemy, s = 0.1): Array<(typeof w.events)[number]> {
  boss.damageTaken = Math.ceil(def.hp * 0.78);
  const out: Array<(typeof w.events)[number]> = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    out.push(...w.events);
  }
  return out;
}

const chairOf = (w: World): Enemy | undefined => w.enemies.find((e) => e.def.id === 'silla-director' && !isDead(e));

test('la fase 3 empieza al 25 %, se llama «Despido procedente», con su grito, y es la fase 3', () => {
  assert.deepEqual(brain.phases.map((p) => p.name), ['Somos una familia', 'Reestructuración', 'Despido procedente']);
  assert.equal(last.from, 0.25);
  assert.equal(last.restructure, undefined, 'las mamparas se quedan donde estaban');
  const { w, boss } = fight('fase3');
  const evs = toPhase3(w, boss);
  const ph = evs.find((e) => e.type === 'bossPhase' && e.phase === 2);
  assert.ok(ph && ph.type === 'bossPhase');
  assert.equal(ph.name, 'Despido procedente');
  assert.equal(ph.stage, 3);
  assert.equal(ph.line, 'No es nada personal. Es todo.');
  assert.equal(boss.bossPhase, 2);
  // On his feet, slower than in his chair.
  assert.ok(last.walkSpeed < brain.phases[1]!.walkSpeed);
});

test('se levanta: de pie se dibuja con sus fotogramas de pie, y la línea de recortes la gira sobre sí mismo', () => {
  const { w, boss } = fight('de-pie');
  toPhase3(w, boss, 0.1);
  // Already up while he shouts the phase (his clap is a seated frame).
  assert.equal(boss.state, 'roar');
  assert.equal(enemyFrame(boss, 0), 9, 'de pie al anunciar la fase');
  boss.state = 'idle';
  boss.vx = 0;
  boss.vy = 0;
  assert.ok([9, 10].includes(enemyFrame(boss, 0)), 'de pie, respirando');
  // Throughout the phase, every frame is one of his standing ones (9-17), never the chair's.
  const seen = new Set<number>();
  let spun = false;
  for (let i = 0; i < ticks(25); i++) {
    step(w, NO_INPUT);
    if (isDead(boss)) break;
    seen.add(enemyFrame(boss, i * DT * 1000));
    if (isSpinning(boss)) spun = true;
  }
  assert.ok([...seen].every((f) => f >= 9 && f <= 17), `fotogramas ${[...seen].join(',')}`);
  assert.ok(spun, 'gira con la línea de recortes');
  assert.ok(seen.has(16) && seen.has(17), 'de espaldas y de frente al girar');
});

test('la silla sale rodando sola: una, de él, que embiste en línea recta y cae con él', () => {
  assert.ok(DOWN_CAUSES['silla-director']?.contact);
  const cb = chairDef.brain as ChargerBrain;
  assert.equal(cb.kind, 'charger');
  const { w, boss } = fight('silla');
  const evs = toPhase3(w, boss, 0.2);
  assert.ok(evs.some((e) => e.type === 'summon'), 'la silla sale');
  const chair = chairOf(w)!;
  assert.ok(chair, 'hay silla');
  assert.equal(chair.owner, boss.id);
  assert.equal(w.enemies.filter((e) => e.def.id === 'silla-director').length, 1, 'una sola');
  assert.ok(isClear(w, chair.x, chair.y, chairDef.footRadius), 'no sale metida en la pared ni en la mesa');
  // It rams: a warning in a straight line, then the charge.
  let warned = false;
  let charged = false;
  for (let i = 0; i < ticks(20) && !charged; i++) {
    step(w, NO_INPUT);
    for (const e of w.events) {
      if (e.type === 'telegraph' && e.source === chair.id) warned = true;
      if (e.type === 'charge' && e.source === chair.id) charged = warned;
    }
  }
  assert.ok(charged, 'avisa y embiste');
  // He never calls a second one, not even when it breaks.
  chair.damageTaken = chairDef.hp;
  for (let i = 0; i < ticks(6); i++) step(w, NO_INPUT);
  assert.equal(chairOf(w), undefined, 'rota, no vuelve');
  // And with him it goes.
  const { w: w2, boss: b2 } = fight('silla-cae');
  toPhase3(w2, b2, 0.2);
  assert.ok(chairOf(w2));
  b2.damageTaken = def.hp;
  step(w2, NO_INPUT);
  assert.equal(chairOf(w2), undefined, 'cae con él');
});

test('la línea de recortes: una espiral apuntada con un hueco que empieza en la tostadora y gira con ella', () => {
  for (const id of ['director-recortes', 'director-recortes-2']) {
    const def = PATTERNS[id]!;
    assert.ok(isAimed(def), 'apunta (el aviso enseña hacia dónde)');
    if (def.kind !== 'spiral') throw new Error(`${id} no es una espiral`);
    const pat: SpiralDef = def;
    const aim = 0.7;
    const shots = expandPattern(pat, aim, new Rng('x'));
    assert.ok(shots.every((s) => s.color === 'cut'));
    // Step by step: the hole is where the aim is turned by the steps so far, and the rest is full.
    for (let s = 0; s < pat.steps; s++) {
      const at: ShotSpec[] = shots.filter((x) => Math.abs(x.delay - s * pat.interval) < 1e-9);
      const hole = aim + (s * pat.stepDeg * Math.PI) / 180;
      const off = (a: number): number => {
        const d = Math.abs(a - hole) % (2 * Math.PI);
        return (d > Math.PI ? 2 * Math.PI - d : d) * (180 / Math.PI);
      };
      assert.ok(at.every((x) => off(x.angle) >= 40 - 1e-6), `paso ${s}: nada en el hueco`);
      assert.ok(at.length >= pat.arms - 3, `paso ${s}: el resto de la espiral, entero`);
      // The hole is wide enough for the toaster two tiles away (64 px): wider than 50 px.
      const sorted = at.map((x) => off(x.angle)).sort((a, b) => a - b);
      assert.ok(((2 * sorted[0]! * Math.PI) / 180) * 64 > 50);
    }
  }
  // A plain spiral (the Muñeco's stickers) still ignores the aim.
  const plain = PATTERNS['muneco-pegatinas']!;
  assert.ok(!isAimed(plain));
});

test('un combate entero con el bot llega a la fase 3: determinista y sin romper nada', () => {
  const play = (): { hash: string; phase: number; chair: boolean } => {
    const w = createWorld({ seed: 'director-f3-bot', room: 'jefe-oficinas', level: 4 });
    w.intro = null;
    w.noDamage = true;
    const boss = w.enemies.find((e) => e.def.id === 'director-rrhh')!;
    boss.damageTaken = Math.ceil(def.hp * 0.7);
    const bot = new Bot('director-f3-bot');
    let chair = false;
    for (let i = 0; i < ticks(120) && !w.over && !isDead(boss); i++) {
      step(w, bot.think(w));
      assert.deepEqual(checkInvariants(w), [], `tick ${i}`);
      if (chairOf(w)) chair = true;
    }
    return { hash: worldHash(w), phase: boss.bossPhase ?? 0, chair };
  };
  const a = play();
  const b = play();
  assert.equal(a.hash, b.hash);
  assert.equal(a.phase, 2);
  assert.ok(a.chair);
});
