// M14c (a7d): La Nube de Almacenamiento redrawn in the new style (tools/sprites/nube-nuevo.ts),
// checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeNubeFrames } from '../tools/sprites/nube.ts';
import * as NN from '../tools/sprites/nube-nuevo.ts';

const FLOORS = [MATERIALS.suelo[3]!, hx('#304541')];
const def = ENEMIES['nube-almacenamiento']!;
const frames = NN.makeNubeNuevaFrames();
const F = NN.NUBE_FRAMES;
const P = NN.NUBE_PER_PHASE;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;

test('estilo a7d: la nube se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const floor of FLOORS) {
    for (const [i, f] of frames.entries()) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7d: la hoja del juego es la nueva, más grande, con su despiece', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [NN.NUBE_W, NN.NUBE_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, NN.NUBE_FEET);
  assert.deepEqual(def.hurt, { x: -30, y: -66, w: 60, h: 40 }, 'la caja de golpes de siempre');
  // Only a little bigger: the old cloud already spilled out of its hurt box, and the new one keeps
  // to it (the bosses' size rule); what grows is the frame, the hands and the cable.
  assert.ok(area(frames[0]!) > area(makeNubeFrames()[0]!) * 1.05, 'más grande que la vieja');
  const bits = allSheets()['despiece-nube-almacenamiento']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [NN.NUBE_BIT, NN.NUBE_BIT, 6]);
});

test('estilo a7d: la nube llena la caja de golpes, flota y no se sale mucho', () => {
  const h = def.hurt!;
  const A = def.anchor;
  const f = frames[0]!;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  assert.ok(inside / (h.w * h.h) > 0.85, `la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
  for (let y = 0; y < f.h; y++) {
    for (let x = 0; x < f.w; x++) {
      if (!isMat(f.get(x, y), 'vidrio')) continue;
      assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `nube en x ${x}`);
      assert.ok(y >= A.y + h.y - 6 && y < A.y + h.y + h.h + 6, `nube en y ${y}`);
    }
  }
  // It floats: no solid pixel of the cloud on the floor rows, only rain, the cable and its plug.
  for (const fr of frames) for (let x = 0; x < fr.w; x++) for (let y = A.y - 4; y < fr.h; y++) assert.ok(!isMat(fr.get(x, y), 'vidrio') && !isMat(fr.get(x, y), 'acero') || x > 38 && x < 52);
});

test('estilo a7d: los fotogramas cuadran con su anim, sus fases y las poses de cada ataque', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.float);
  assert.equal(a.warn, F.hold);
  assert.equal(a.stun, F.error);
  const brain = def.brain;
  if (brain.kind !== 'boss') return assert.fail('no es jefe');
  assert.deepEqual(brain.phases.map((ph) => ph.frameShift ?? 0), [0, P]);
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses[0], [F.rain, F.files, undefined]);
  assert.deepEqual(poses[1], [F.folders, F.rain + P, F.files + P, undefined]);
  assert.equal(new Set(frames.map((f) => f.p.flat().join())).size, F.count, 'todos distintos');
});

test('estilo a7d: los archivos salen de su boca, y llena se pone gris con la barra al 100 %', () => {
  const brain = def.brain;
  if (brain.kind !== 'boss') return;
  const m = brain.muzzle!;
  assert.deepEqual(m, NN.NUBE_MOUTH);
  const at = (f: Canvas, dx = 0) => f.get(def.anchor.x + m.x + dx, def.anchor.y - m.y + 1);
  for (const k of [F.files, F.files + P, F.folders]) assert.ok(isMat(at(frames[k]!, -1), 'pantalla'), `fotograma ${k}: boca abierta`);
  const count = (f: Canvas, mat: Material): number => f.p.flat().filter((c) => isMat(c, mat)).length;
  for (let k = 0; k < P; k++) {
    assert.ok(count(frames[k]!, 'vidrio') > 1500 && count(frames[k]!, 'carton') === 0, `${k}: blanca y sin carpetas`);
    assert.ok(count(frames[k + P]!, 'acero') > 1500 && count(frames[k + P]!, 'carton') > 20, `${k + P}: gris y con carpetas`);
    assert.ok(count(frames[k]!, 'amarillo') > 0 && count(frames[k + P]!, 'rojo') > 10, 'la barra');
  }
});
