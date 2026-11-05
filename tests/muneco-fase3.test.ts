// El Muñeco de Moda, fase 3 (M10 5c): «Fin de existencias». Rompe la caja, que se queda en la sala
// como obstáculo que para balas; sin ella gira sobre sí mismo soltando espirales de pegatinas que
// persiguen un poco, va más deprisa que nunca y recibe un 25 % más de daño.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { PROPS } from '../src/data/props.ts';
import type { BossBrain } from '../src/data/types.ts';
import { BOSS_DOWN_STAMP } from '../src/data/texts.ts';
import { enemyFrame, spinMirrored } from '../src/render/enemyAnim.ts';
import { isSpinning } from '../src/sim/enemies.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { TILE } from '../src/sim/room.ts';
import { overlaps } from '../src/sim/vec.ts';
import { createWorld, DT, isClear, NO_INPUT, playerFeetBox, step, takenScale, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['muneco-moda']!;
const brain = def.brain as BossBrain;
const last = brain.phases[brain.phases.length - 1]!;
const ticks = (s: number): number => Math.ceil(s / DT);

/** The Escaparate with the Muñeco a moment into the fight, nothing hurting the toaster. */
function fight(seed: string): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-jugueteria', level: 3 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'muneco-moda')!;
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  return { w, boss };
}

/** Takes it down to phase 3 and steps `s` seconds, gathering the events. */
function toPhase3(w: World, boss: Enemy, s = 0.1): Array<(typeof w.events)[number]> {
  boss.damageTaken = def.hp * 0.78;
  const out: Array<(typeof w.events)[number]> = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    out.push(...w.events);
  }
  return out;
}

test('la fase 3 empieza al 25 %, se llama «Fin de existencias» (no «Liquidación total», que es el sello) y es la fase 3', () => {
  assert.equal(last.from, 0.25);
  assert.equal(last.name, 'Fin de existencias');
  assert.notEqual(last.name, BOSS_DOWN_STAMP);
  assert.equal(last.taken, 1.25);
  assert.equal(last.shed?.prop, 'caja-muneco');
  const { w, boss } = fight('fase3');
  const evs = toPhase3(w, boss);
  const ph = evs.find((e) => e.type === 'bossPhase');
  assert.ok(ph && ph.type === 'bossPhase');
  assert.equal(ph.name, 'Fin de existencias');
  assert.equal(ph.stage, 3);
  assert.equal(ph.line, '¡Todo debe desaparecer! Yo también.');
  assert.equal(boss.bossPhase, brain.phases.length - 1);
});

test('rompe la caja: se queda en la sala, encajada en las casillas, para balas y no pisa a nadie', () => {
  for (let k = 0; k < 6; k++) {
    const { w, boss } = fight(`caja-${k}`);
    // Anywhere in the room, as the fight goes.
    for (let i = 0; i < ticks(k * 2.5); i++) step(w, NO_INPUT);
    const evs = toPhase3(w, boss);
    const shed = evs.find((e) => e.type === 'shed');
    assert.ok(shed && shed.type === 'shed', 'suelta la caja');
    const box = w.room.props.filter((p) => p.def.id === 'caja-muneco');
    assert.equal(box.length, 1, 'una caja, y solo una');
    const b = box[0]!;
    assert.equal(b.x % TILE, 0, 'dos casillas de ancho, centrada en el borde de una');
    assert.equal((b.y + 2) % TILE, 0);
    assert.ok(PROPS['caja-muneco']!.blocksBullets, 'para balas');
    // Neither the Muñeco nor the toaster is left inside it.
    assert.ok(!overlaps(playerFeetBox(boss, boss.def.footRadius), b.box), 'el Muñeco sale de la caja');
    assert.ok(!overlaps(playerFeetBox(w.player, w.player.def.footRadius), b.box), 'la caja no cae encima de la tostadora');
    for (const e of w.enemies) assert.ok(!overlaps(playerFeetBox(e, e.def.footRadius), b.box), `${e.def.id} fuera de la caja`);
    // And it can walk on from there.
    assert.ok(isClear(w, boss.x, boss.y, boss.def.footRadius));
  }
});

test('sin caja: sus fotogramas sin caja (la etiqueta no se pinta), y recibe un 25 % más de daño', () => {
  const { w, boss } = fight('sin-caja');
  assert.equal(takenScale(boss), 1);
  const before = enemyFrame(boss, 0);
  assert.ok(before < 7, 'con caja antes');
  toPhase3(w, boss, 2.5);
  assert.equal(takenScale(boss), 1.25);
  const badge = def.anim!.badge!;
  for (let t = 0; t < 400; t++) {
    step(w, NO_INPUT);
    const f = enemyFrame(boss, t * 16);
    assert.ok(f >= badge.upTo && f <= 15, `fotograma sin caja: ${f}`);
  }
  // Its pose before an attack, out of the box.
  boss.state = 'warn';
  assert.equal(enemyFrame(boss, 0), def.anim!.warn! + 7);
});

test('gira sobre sí mismo soltando espirales de pegatinas que persiguen un poco', () => {
  const sticky = expandPattern(PATTERNS['muneco-pegatinas']!, 0, new Rng('p'));
  assert.ok(sticky.length >= 40 && sticky.every((s) => s.color === 'sticker' && s.homing && s.homing.time < 1.2));
  // Slower than the toaster, so a sidestep shakes them off.
  assert.ok(sticky.every((s) => s.speed < 90));
  const { w, boss } = fight('giro');
  toPhase3(w, boss);
  let spun = false;
  const frames = new Set<number>();
  let mirrored = 0;
  let x0 = 0;
  let y0 = 0;
  let stickers = 0;
  for (let i = 0; i < ticks(25) && !spun; i++) {
    step(w, NO_INPUT);
    if (isSpinning(boss)) {
      x0 = boss.x;
      y0 = boss.y;
      while (isSpinning(boss)) {
        frames.add(enemyFrame(boss, 0));
        if (spinMirrored(boss)) mirrored++;
        step(w, NO_INPUT);
      }
      spun = true;
      assert.ok(Math.hypot(boss.x - x0, boss.y - y0) < 6, 'gira en el sitio');
    }
  }
  assert.ok(spun, 'tarde o temprano gira');
  assert.deepEqual([...frames].sort((a, b) => a - b), [7, 14, 15], 'de frente, de lado y de espaldas');
  assert.ok(mirrored > 0, 'y del otro lado');
  stickers = w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'sticker').length;
  assert.ok(stickers > 20, `${stickers} pegatinas en el aire`);
});

test('la caja rota se queda cuando cae el Muñeco, y el montacargas no sale encima', () => {
  const { w, boss } = fight('montacargas');
  toPhase3(w, boss, 1);
  const box = w.room.props.find((p) => p.def.id === 'caja-muneco')!;
  boss.damageTaken = def.hp;
  for (let i = 0; i < ticks(6) && !w.lift; i++) step(w, NO_INPUT);
  assert.ok(w.lift, 'sale el montacargas');
  assert.ok(w.room.props.includes(box), 'la caja sigue ahí');
  assert.ok(!overlaps({ x: w.lift.x - 20, y: w.lift.y - 10, w: 40, h: 20 }, box.box), 'el montacargas no sale encima de la caja');
});

test('la fase 3 es determinista', () => {
  const a = fight('det3');
  const b = fight('det3');
  toPhase3(a.w, a.boss);
  toPhase3(b.w, b.boss);
  for (let i = 0; i < ticks(15); i++) {
    const inp = { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1, fire: true, aimX: 300, aimY: 100 };
    step(a.w, inp);
    step(b.w, inp);
  }
  assert.equal(worldHash(a.w), worldHash(b.w));
});
