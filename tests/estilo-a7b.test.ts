// M14c (a7b): La Lavadora Programa Eco redrawn in the new style (tools/sprites/lavadora-nuevo.ts),
// checked against the style guide, the bosses' size rule of (a7a) and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeLavadoraFrames } from '../tools/sprites/lavadora.ts';
import * as LN from '../tools/sprites/lavadora-nuevo.ts';
import * as NV from '../tools/sprites/nevera-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;
const def = ENEMIES['lavadora-eco']!;
const brain = def.brain as BossBrain;
const frames = LN.makeLavadoraNuevaFrames();
const N = LN.LAVADORA_PER_PROGRAM;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;

test('estilo a7b: la lavadora se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const [i, f] of frames.entries()) {
    const l = legibility(f, FLOOR);
    assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
  }
});

test('estilo a7b: la hoja del juego es la nueva, del tamaño de los jefes, y los pies pisan el ancla', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [LN.LAVADORA_W, LN.LAVADORA_H, 3 * N]);
  assert.deepEqual([LN.LAVADORA_W, LN.LAVADORA_H], [NV.NEVERA_W, NV.NEVERA_H], 'el mismo marco que la Nevera');
  assert.deepEqual(def.anchor, LN.LAVADORA_FEET);
  assert.deepEqual(def.hurt, { x: -25, y: -66, w: 50, h: 58 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) {
    let bottom = -1;
    for (let y = f.h - 1; y >= 0 && bottom < 0; y--) for (let x = def.anchor.x - 20; x <= def.anchor.x + 20; x++) if (f.get(x, y)[3] === 255) bottom = y;
    assert.equal(bottom, def.anchor.y, `fotograma ${i}: los pies no tocan el suelo`);
  }
  assert.ok(area(frames[0]!) > area(makeLavadoraFrames()[0]!) * 1.1, 'más grande que la vieja');
  const bits = allSheets()['despiece-lavadora-eco']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [LN.LAVADORA_BIT, LN.LAVADORA_BIT, 6]);
});

test('estilo a7b: el cuerpo llena la caja de golpes y no se sale mucho de ella', () => {
  const h = def.hurt!;
  const A = def.anchor;
  const f = frames[0]!;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  assert.ok(inside / (h.w * h.h) > 0.85, `la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
  for (let y = 0; y < A.y - 4; y++) {
    for (let x = 0; x < f.w; x++) {
      if (!isMat(f.get(x, y), 'esmalte')) continue;
      assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `esmalte en x ${x}`);
      assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `esmalte en y ${y}`);
    }
  }
});

test('estilo a7b: ocho fotogramas por programa, con su pose de ataque y la de pesar la carga', () => {
  assert.deepEqual(brain.phases.map((p) => p.frameShift ?? 0), [0, N, 2 * N]);
  assert.equal(def.anim!.stun, LN.LAVADORA_WEIGH);
  brain.phases.forEach((ph, k) => {
    for (const at of ph.attacks) assert.equal('pose' in at ? at.pose : undefined, k * N + LN.LAVADORA_POSE, `${ph.name}: ${'pattern' in at ? at.pattern : at.kind}`);
  });
  // Every pose differs from its program's rest, and each program looks different.
  for (let k = 0; k < 3; k++) {
    assert.notEqual(frames[k * N + LN.LAVADORA_POSE]!.p.flat().join(), frames[k * N]!.p.flat().join());
    assert.notEqual(frames[k * N + LN.LAVADORA_WEIGH]!.p.flat().join(), frames[k * N]!.p.flat().join());
  }
  assert.equal(new Set([0, N, 2 * N].map((i) => frames[i]!.p.flat().join())).size, 3);
});

test('estilo a7b: todo sale del tambor (la boca está en el ojo de buey) y la pantalla dice lo de siempre', () => {
  const m = brain.muzzle!;
  assert.deepEqual(m, LN.LAVADORA_DRUM);
  const A = def.anchor;
  for (const [i, f] of frames.entries()) {
    // The glass of the porthole round the muzzle (blue water, white foam or the red sock), never the cabinet.
    for (const [dx, dy] of [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]] as const) {
      const c = f.get(A.x + m.x + dx, A.y - m.y + dy);
      assert.ok(!isMat(c, 'esmalte') && c[3] === 255, `fotograma ${i}: (${dx}, ${dy}) fuera del ojo de buey`);
    }
  }
  // The display: green «2:59» in Prelavado and Lavado, red «1400» spinning, amber dashes weighing.
  const lit = (f: Canvas, mm: Material): number => {
    let n = 0;
    for (let y = 20; y < 36; y++) for (let x = 30; x < 52; x++) if (isMat(f.get(x, y), mm)) n++;
    return n;
  };
  assert.ok(lit(frames[0]!, 'verde') >= 12 && lit(frames[N]!, 'verde') >= 12);
  assert.ok(lit(frames[2 * N]!, 'rojo') >= 12);
  assert.ok(lit(frames[LN.LAVADORA_WEIGH]!, 'amarillo') >= 9);
});

test('estilo a7b: no se confunde con la Nevera aunque las dos sean blancas', () => {
  const o = silhouetteOverlap(frames[0]!, NV.makeNeveraNuevaFrames()[0]!);
  assert.ok(o < 0.9, `lavadora–nevera: ${o.toFixed(2)}`);
  // What tells them apart at a glance: the big round porthole (chrome) and the turquoise gloves.
  let chrome = 0;
  let teal = 0;
  for (const c of frames[0]!.p.flat()) {
    if (isMat(c, 'acero')) chrome++;
    if (isMat(c, 'turquesa')) teal++;
  }
  assert.ok(chrome > 250, `cromo ${chrome}`);
  assert.ok(teal > 80, `guantes ${teal}`);
});
