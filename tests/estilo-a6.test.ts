// M14c (a6): the plant 3, 4 and 5 enemies redrawn in the new style, checked against the style
// guide (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo») and against the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeCuboFrames, makeSobreFrames } from '../tools/sprites/enemies.ts';
import * as P3 from '../tools/sprites/planta3-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;

/** The redrawn ones so far, with their frames. */
const REDRAWN: Record<string, () => Canvas[]> = {
  'robot-cuerda': P3.makeRobotNuevoFrames,
  'coche-teledirigido': P3.makeCocheNuevoFrames,
};

function bottomRow(cv: Canvas, x0 = 0, x1 = cv.w - 1): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

test('estilo a6: los enemigos redibujados se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const [id, make] of Object.entries(REDRAWN)) {
    for (const [i, f] of make().entries()) {
      const l = legibility(f, FLOOR);
      assert.ok(l.darkEdge >= 0.8, `${id} ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${id} ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${id} ${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a6: las hojas del juego son las nuevas y casan con los datos (fotogramas, anclas)', () => {
  const sheets = allSheets();
  for (const [id, make] of Object.entries(REDRAWN)) {
    const def = ENEMIES[id]!;
    const frames = make();
    const s = sheets[def.sprite]!;
    assert.equal(s.frameW, frames[0]!.w, `${id}: ancho de fotograma`);
    assert.equal(s.frameH, frames[0]!.h, `${id}: alto de fotograma`);
    assert.equal(s.canvas.w / s.frameW, frames.length, `${id}: número de fotogramas`);
    const a = def.anim!;
    const used = [...a.idle, ...(a.walk ?? []), ...(a.jam ?? []), ...[a.warn, a.off, a.stun].filter((k) => k !== undefined)];
    for (const k of used) assert.ok(k < frames.length, `${id}: el fotograma ${k} no está en la hoja`);
    assert.ok(def.anchor.x > 0 && def.anchor.x < s.frameW && def.anchor.y < s.frameH, `${id}: el ancla se sale`);
  }
});

test('estilo a6: el robot pisa el suelo en su ancla (de pie, andando, sin cuerda y dándose cuerda)', () => {
  const def = ENEMIES['robot-cuerda']!;
  const frames = P3.makeRobotNuevoFrames();
  assert.deepEqual(def.anchor, P3.ROBOT_FEET);
  const a = def.anim!;
  for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, a.stun!, ...a.jam!]) {
    assert.equal(bottomRow(frames[k]!, def.anchor.x - 8, def.anchor.x + 8), def.anchor.y, `fotograma ${k}: los pies no tocan el suelo`);
  }
});

test('estilo a6: el coche va sobre sus ruedas en el ancla, también volcado', () => {
  const def = ENEMIES['coche-teledirigido']!;
  assert.deepEqual(def.anchor, P3.COCHE_FEET);
  for (const [k, f] of P3.makeCocheNuevoFrames().entries()) assert.equal(bottomRow(f), def.anchor.y, `fotograma ${k}`);
});

test('estilo a6: más grandes que antes y sin cambiar las cajas de choque', () => {
  const widest = (f: Canvas): number => {
    let best = 0;
    for (let y = 0; y < f.h; y++) {
      let n = 0;
      for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) n++;
      best = Math.max(best, n);
    }
    return best;
  };
  assert.ok(widest(P3.makeRobotNuevoFrames()[0]!) >= 26, 'robot');
  assert.ok(widest(P3.makeCocheNuevoFrames()[0]!) >= 40, 'coche');
  assert.deepEqual(ENEMIES['robot-cuerda']!.hurt, { x: -12, y: -28, w: 24, h: 27 });
  assert.deepEqual(ENEMIES['coche-teledirigido']!.hurt, { x: -14, y: -20, w: 28, h: 19 });
});

test('estilo a6: las tuercas salen de la boca del robot (muzzleY) y la llave gira', () => {
  const def = ENEMIES['robot-cuerda']!;
  assert.equal(def.brain.kind === 'windup' && def.brain.muzzleY, P3.ROBOT_MOUTH_Y);
  const [f] = P3.makeRobotNuevoFrames();
  // The grille's dark row: the deepest tin tone right under the anchor's column, at muzzleY.
  const row = P3.ROBOT_FEET.y - P3.ROBOT_MOUTH_Y - 1;
  const deep = MATERIALS.hojalata[6]!;
  let dark = 0;
  for (let x = P3.ROBOT_FEET.x - 6; x <= P3.ROBOT_FEET.x + 8; x++) if (same(f!.get(x, row), deep)) dark++;
  assert.ok(dark >= 4, `la rejilla no está en la fila ${row} (${dark} px)`);
  // The key (the left end of the frame) is drawn differently in the three march frames in a row.
  const keyOf = (cv: Canvas): string => {
    const px: string[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < 7; x++) px.push(cv.get(x, y).join(','));
    return px.join(';');
  };
  const frames = P3.makeRobotNuevoFrames();
  const keys = [2, 3, 4].map((k) => keyOf(frames[k]!));
  assert.equal(new Set(keys).size, 3, 'la llave no gira');
  // Winding itself up, it shakes from side to side: frames 7 and 8 differ.
  assert.notEqual(keyOf(frames[7]!), keyOf(frames[8]!));
});

test('estilo a6: el coche volcado está boca abajo y sin pilas enseña la batería', () => {
  const frames = P3.makeCocheNuevoFrames();
  const tip = MATERIALS.rojo[1]!;
  const rowsWith = (cv: Canvas, c: readonly number[], x0 = 0): number[] => {
    const rows: number[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = x0; x < cv.w; x++) if (same(cv.get(x, y), c)) rows.push(y);
    return rows;
  };
  // The antenna's red tip: at the top upright, at the bottom overturned.
  assert.ok(Math.max(...rowsWith(frames[0]!, tip)) < 6, 'de pie, la antena arriba');
  assert.ok(Math.min(...rowsWith(frames[5]!, tip)) > P3.COCHE_FEET.y - 6, 'volcado, la antena abajo');
  // Batteries out: the eyes on the bumper go dark (no yellow headlights) and the battery sign is there.
  const yellow = MATERIALS.amarillo[1]!;
  assert.ok(rowsWith(frames[0]!, yellow, 36).some((y) => y >= 16 && y <= 18), 'los faros encendidos');
  assert.ok(!rowsWith(frames[6]!, yellow, 36).some((y) => y >= 16 && y <= 18), 'sin pilas, los faros apagados');
  assert.ok(rowsWith(frames[6]!, MATERIALS.rojo[2]!).some((y) => y < 6), 'falta la batería baja');
});

test('estilo a6: los redibujados de la planta 3 no se parecen a los demás de su planta', () => {
  const plant3: Array<[string, Canvas]> = [
    ['robot', P3.makeRobotNuevoFrames()[0]!],
    ['coche', P3.makeCocheNuevoFrames()[0]!],
    ['cubo', makeCuboFrames()[0]!],
    ['sobre', makeSobreFrames()[0]!],
  ];
  // Only the pairs with a redrawn one (the old cube and envelope are 0.84 alike: their turn is (a6b)).
  const redrawn = 2;
  for (let i = 0; i < redrawn; i++) {
    for (let j = i + 1; j < plant3.length; j++) {
      const o = silhouetteOverlap(plant3[i]![1], plant3[j]![1]);
      assert.ok(o < 0.8, `${plant3[i]![0]}–${plant3[j]![0]}: ${o.toFixed(2)}`);
    }
  }
});
