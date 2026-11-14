// M14c (a6e): the Dispensador de Turnos and the Postes de Cola (plant 5) redrawn in the new
// style (tools/sprites/planta5-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import * as CL from '../tools/sprites/clientela.ts';
import * as P5 from '../tools/sprites/planta5-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

const REDRAWN: Record<string, () => Canvas[]> = {
  'dispensador-turnos': P5.makeDispensadorNuevoFrames,
  'poste-cola': () => [...P5.makePosteNuevoFrames(false), ...P5.makePosteNuevoFrames(true)],
};

function bottomRow(cv: Canvas, x0: number, x1: number): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}

function count(cv: Canvas, m: Material, tones?: readonly number[], y0 = 0, y1 = cv.h - 1): number {
  const R = MATERIALS[m];
  const want = (tones ?? R.map((_, i) => i)).map((t) => R[t]!);
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < cv.w; x++) if (want.some((c) => same(c, cv.get(x, y)))) n++;
  return n;
}

test('estilo a6e: el dispensador y los postes se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const [id, make] of Object.entries(REDRAWN)) {
    for (const [i, f] of make().entries()) {
      const l = legibility(f, FLOOR);
      assert.ok(l.darkEdge >= 0.8, `${id} ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${id} ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${id} ${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a6e: las hojas del juego son las nuevas y casan con los datos (fotogramas, anclas, pies)', () => {
  const sheets = allSheets();
  for (const [id, make] of Object.entries(REDRAWN)) {
    const def = ENEMIES[id]!;
    const frames = make();
    const s = sheets[def.sprite]!;
    assert.equal(s.frameW, frames[0]!.w, `${id}: ancho`);
    assert.equal(s.frameH, frames[0]!.h, `${id}: alto`);
    assert.equal(s.canvas.w / s.frameW, frames.length, `${id}: número de fotogramas`);
    const a = def.anim!;
    const used = [...a.idle, ...(a.walk ?? []), ...[a.warn, a.spit, a.reveal].filter((k) => k !== undefined)];
    const shifts = a.altShift ? [0, a.altShift] : [0];
    for (const sh of shifts) {
      for (const k of used) {
        assert.ok(k + sh < frames.length, `${id}: el fotograma ${k + sh} no está en la hoja`);
        assert.equal(bottomRow(frames[k + sh]!, def.anchor.x - 8, def.anchor.x + 8), def.anchor.y, `${id} ${k + sh}: los pies no tocan el suelo en el ancla`);
      }
    }
  }
  assert.deepEqual(ENEMIES['dispensador-turnos']!.anchor, P5.DISP_FEET);
  assert.deepEqual(ENEMIES['poste-cola']!.anchor, P5.POST_FEET);
  // The hit boxes do not change with the drawing.
  assert.deepEqual(ENEMIES['dispensador-turnos']!.hurt, { x: -13, y: -31, w: 26, h: 30 });
  assert.deepEqual(ENEMIES['poste-cola']!.hurt, { x: -8, y: -31, w: 16, h: 30 });
  // The belt is the new one, opaque to tile, the same size as before (the game repeats it).
  const belt = sheets['cinta-poste']!;
  assert.deepEqual([belt.frameW, belt.frameH], [CL.BELT_W, CL.BELT_H]);
  for (const f of P5.makeBeltNuevo()) for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) assert.equal(f.get(x, y)[3], 255, 'la cinta tiene huecos');
});

test('estilo a6e: más grandes que los de antes', () => {
  const area = (cv: Canvas): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3] === 255) n++;
    return n;
  };
  assert.ok(area(P5.makeDispensadorNuevoFrames()[0]!) > area(CL.makeDispensadorFrames()[0]!) * 1.3, 'dispensador');
  assert.ok(area(P5.makePosteNuevoFrames()[0]!) > area(CL.makePosteFrames()[0]!) * 1.3, 'poste');
});

test('estilo a6e: los tiques salen de la ranura del dispensador (muzzleY), el «087» se enciende al llamar y la lengua crece', () => {
  const def = ENEMIES['dispensador-turnos']!;
  assert.equal(def.brain.kind === 'turner' && def.brain.muzzleY, P5.DISP_MOUTH_Y);
  const frames = P5.makeDispensadorNuevoFrames();
  const a = def.anim!;
  const my = P5.DISP_FEET.y - P5.DISP_MOUTH_Y - 1;
  // The slot: the enamel's deepest tone, a long dark line on the muzzle row.
  for (const k of [0, a.warn!, a.spit!]) assert.ok(count(frames[k]!, 'granate', [6], my, my) >= 10, `fotograma ${k}: la ranura no está en la fila ${my}`);
  // The LED digits: red-orange normally, white-hot when it calls.
  const hot = [0xff, 0xe6, 0xa8, 255];
  const hotPx = (cv: Canvas): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (same(cv.get(x, y), hot)) n++;
    return n;
  };
  assert.equal(hotPx(frames[0]!), 0);
  assert.ok(hotPx(frames[a.warn!]!) >= 20, 'al llamar, el 087 al blanco');
  // The paper tongue: longer calling, longest spat out.
  const paperBelow = (cv: Canvas): number => count(cv, 'crema', undefined, my + 1);
  assert.ok(paperBelow(frames[a.warn!]!) > paperBelow(frames[0]!) && paperBelow(frames[a.spit!]!) > paperBelow(frames[a.warn!]!), 'la lengua de papel');
  // Its red is its own: mostly `granate`, almost no bullet red.
  assert.ok(count(frames[0]!, 'granate') > 250, 'la carcasa granate');
  assert.ok(count(frames[0]!, 'rojo') === 0, 'sin el rojo de las balas en reposo');
});

test('estilo a6e: la cinta sale del tambor a la altura que la dibuja el juego; el enganche desaparece al soltarla; uno desconchado', () => {
  const def = ENEMIES['poste-cola']!;
  // GameScene draws the belt `muzzleY - 3` px above the feet.
  assert.equal(def.brain.kind === 'queuer' && def.brain.muzzleY - 3, P5.POST_BELT_Y);
  const clean = P5.makePosteNuevoFrames(false);
  const chipped = P5.makePosteNuevoFrames(true);
  const sy = P5.POST_FEET.y - P5.POST_BELT_Y;
  assert.ok(count(clean[0]!, 'azul', undefined, sy, sy + 1) >= 30, `la banda azul no está en la fila ${sy}`);
  // The clip sticks out in front of the drum (x ≥ 23) except when the belt is let go.
  const clip = (cv: Canvas): number => {
    let n = 0;
    for (let y = sy - 1; y <= sy + 2; y++) for (let x = 23; x < cv.w; x++) if (MATERIALS.azul.some((c) => same(c, cv.get(x, y)))) n++;
    return n;
  };
  assert.ok(clip(clean[0]!) >= 4 && clip(clean[def.anim!.warn!]!) >= 4, 'el enganche');
  assert.equal(clip(clean[def.anim!.reveal!]!), 0, 'soltada, sin enganche');
  // Shooting, red eyes; the chipped one has rust on its foot and the clean one none.
  assert.ok(count(clean[def.anim!.warn!]!, 'rojo') >= 4 && count(clean[0]!, 'rojo') === 0, 'los ojos al disparar');
  assert.equal(count(clean[0]!, 'oxido'), 0);
  for (const f of chipped) assert.ok(count(f, 'oxido') >= 4, 'la base desconchada');
});

test('estilo a6e: los enemigos de Atención al Cliente no se parecen entre sí', () => {
  const o = silhouetteOverlap(P5.makeDispensadorNuevoFrames()[0]!, P5.makePosteNuevoFrames()[0]!);
  assert.ok(o < 0.8, `dispensador–poste: ${o.toFixed(2)}`);
});
