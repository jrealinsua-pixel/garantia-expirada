// M14c (a7f): La Consola Edición Coleccionista redrawn in the new style (tools/sprites/consola-nuevo.ts),
// checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { createWorld, DT, NO_INPUT, step } from '../src/sim/world.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeConsolaFrames } from '../tools/sprites/consola.ts';
import * as CN from '../tools/sprites/consola-nuevo.ts';

const FLOORS = [MATERIALS.suelo[3]!, hx('#304541')];
const def = ENEMIES['consola-coleccionista']!;
const frames = CN.makeConsolaNuevaFrames();
const F = CN.CONSOLA_FRAMES;
const P = CN.CONSOLA_PER_PHASE;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const count = (f: Canvas, m: Material): number => f.p.flat().filter((c) => isMat(c, m)).length;

test('estilo a7f: la consola se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const floor of FLOORS) {
    for (const [i, f] of frames.entries()) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7f: la hoja del juego es la nueva, más grande, con su despiece', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [CN.CONSOLA_W, CN.CONSOLA_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, CN.CONSOLA_FEET);
  assert.deepEqual(def.hurt, { x: -24, y: -64, w: 48, h: 60 }, 'la caja de golpes de siempre');
  assert.ok(area(frames[0]!) > area(makeConsolaFrames()[0]!) * 1.03, 'más grande que la vieja');
  const bits = allSheets()['despiece-consola-coleccionista']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [CN.CONSOLA_BIT, CN.CONSOLA_BIT, 6]);
});

test('estilo a7f: la torre llena la caja de golpes y el lacado no se sale de ella', () => {
  const h = def.hurt!;
  const A = def.anchor;
  for (const [k, f] of frames.entries()) {
    let inside = 0;
    for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
    assert.ok(inside / (h.w * h.h) > 0.85, `${k}: la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
    for (let y = 0; y < f.h; y++) {
      for (let x = 0; x < f.w; x++) {
        if (!isMat(f.get(x, y), 'lacado')) continue;
        assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `${k}: lacado en x ${x}`);
        assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `${k}: lacado en y ${y}`);
      }
    }
    // Feet on the floor line (the anchor's row or the one above it), whatever the pose.
    let lowest = 0;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) lowest = y;
    assert.ok(lowest >= A.y - 1 && lowest <= A.y, `${k}: lo más bajo en la fila ${lowest}`);
  }
});

test('estilo a7f: los fotogramas cuadran con su anim, su fase 2 y las poses de cada ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.idle);
  assert.deepEqual(a.walk, F.walk);
  assert.equal(a.warn, F.warn);
  assert.equal(a.stun, F.update);
  assert.equal(a.phaseShift, P);
  assert.equal(a.clap, F.clap);
  const brain = def.brain;
  if (brain.kind !== 'boss') return assert.fail('no es jefe');
  // No frameShift: the clap frame only shows when the phase does not shift by itself.
  assert.ok(brain.phases.every((ph) => ph.frameShift === undefined));
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses[0], [F.cartridges, F.gamepad, F.boxes]);
  assert.deepEqual(poses[1], [F.boxes + P, F.cartridges + P, F.gamepad + P, F.gamepad + P, F.remaster, F.cartridges + P]);
  assert.equal(new Set(frames.map((f) => f.p.flat().join())).size, F.count, 'todos distintos');
});

test('estilo a7f: la bandeja está en su boca, el pase de temporada en la fase 2 y el oro por todas partes', () => {
  const brain = def.brain;
  if (brain.kind !== 'boss') return;
  assert.deepEqual(brain.muzzle, CN.CONSOLA_MOUTH);
  const mx = def.anchor.x + CN.CONSOLA_MOUTH.x;
  const my = def.anchor.y - CN.CONSOLA_MOUTH.y;
  // The tray slot (ink) at the muzzle in the resting frames; the progress bar while it updates.
  for (const k of [0, P]) assert.ok(same(frames[k]!.get(mx, my), [20, 15, 32, 255]), `${k}: la ranura de la bandeja`);
  assert.ok(count(frames[F.update]!, 'verde') > 0, 'la barra de progreso');
  for (let k = 0; k < P; k++) {
    assert.ok(count(frames[k]!, 'laton') > 150, `${k}: el oro de la edición coleccionista`);
    assert.ok(count(frames[k]!, 'lacado') > 1500, `${k}: negro lacado`);
    assert.ok(count(frames[k]!, 'violeta') < count(frames[k + P]!, 'violeta'), `${k + P}: el pase de temporada`);
  }
  assert.ok(count(frames[F.cartridges]!, 'rojo') > count(frames[0]!, 'rojo') + 20, 'el cartucho saliendo');
  assert.ok(count(frames[F.remaster]!, 'amarillo') > count(frames[P]!, 'amarillo') + 60, 'la pegatina «HD»');
});

test('estilo a7f: en partida, las cajas de botín ponen su pose mientras avisa', () => {
  const w = createWorld({ seed: 'a7f-pose', room: 'jefe-jugueteria', level: 3, boss: 'È' });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'consola-coleccionista')!;
  const brain = boss.def.brain;
  if (brain.kind !== 'boss') return assert.fail('no es jefe');
  brain.phases[0]!.attacks.forEach((a) => { a.weight = a.kind === 'summon' ? 1 : 0; });
  const seen = new Set<number>();
  try {
    for (let i = 0; i < Math.ceil(12 / DT); i++) {
      step(w, NO_INPUT);
      if (boss.state === 'warn') seen.add(enemyFrame(boss, i * DT * 1000));
    }
  } finally {
    brain.phases[0]!.attacks.forEach((a, i) => { a.weight = [3, 2, 1.5][i]!; });
  }
  assert.ok(seen.has(F.boxes), `fotogramas al avisar: ${[...seen].join(', ')}`);
});
