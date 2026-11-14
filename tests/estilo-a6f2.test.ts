// M14c (a6f2): the Carretilla Elevadora (the Servicio Técnico's own) redrawn in the new style
// (tools/sprites/taller-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import * as P1 from '../tools/sprites/planta1-nuevo.ts';
import * as TL from '../tools/sprites/taller.ts';
import * as TN from '../tools/sprites/taller-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;
const def = ENEMIES.carretilla!;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

function rowsOf(cv: Canvas, m: Material, tones: readonly number[], x0 = 0, x1 = cv.w - 1): number[] {
  const want = tones.map((t) => MATERIALS[m][t]!);
  const rows: number[] = [];
  for (let y = 0; y < cv.h; y++) for (let x = x0; x <= x1; x++) if (want.some((c) => same(c, cv.get(x, y)))) rows.push(y);
  return rows;
}

test('estilo a6f2: la carretilla se lee sobre el suelo, en todos sus fotogramas', () => {
  for (const [i, f] of TN.makeCarretillaNuevaFrames().entries()) {
    const l = legibility(f, FLOOR);
    assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
  }
});

test('estilo a6f2: la hoja del juego es la nueva, con los mismos fotogramas, y las ruedas pisan el ancla', () => {
  const frames = TN.makeCarretillaNuevaFrames();
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [TN.FORK_W, TN.FORK_H, TL.FORK_FRAMES.length]);
  assert.deepEqual(def.anchor, TN.FORK_FEET);
  assert.deepEqual(def.hurt, { x: -15, y: -34, w: 30, h: 33 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) {
    let bottom = -1;
    for (let y = f.h - 1; y >= 0 && bottom < 0; y--) for (let x = def.anchor.x - 12; x <= def.anchor.x + 12; x++) if (f.get(x, y)[3] === 255) bottom = y;
    assert.equal(bottom, def.anchor.y, `fotograma ${i}: las ruedas no tocan el suelo`);
  }
  // Bigger than before (it was the size of a character).
  const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
  assert.ok(area(frames[0]!) > area(TL.makeCarretillaFrames()[0]!) * 1.3);
});

test('estilo a6f2: avisa con la rotativa y las horquillas arriba; aturdida, horquillas dobladas; las ruedas giran', () => {
  const frames = TN.makeCarretillaNuevaFrames();
  const a = def.anim!;
  // The forks' tips (right of the mast): their lowest steel row is low when calm, high before ramming.
  const tip = (cv: Canvas): number => Math.max(...rowsOf(cv, 'acero', [1, 2], 41, TN.FORK_W - 1));
  assert.equal(tip(frames[0]!), TN.FORK_FEET.y - 1 - TN.FORK_TINE_LOW);
  assert.equal(tip(frames[a.warn!]!), TN.FORK_FEET.y - 1 - TN.FORK_TINE_HIGH);
  // The beacon: its lightest tone only when it is about to ram.
  const lit = (cv: Canvas): number => rowsOf(cv, 'amarillo', [0], 14, 32).filter((y) => y < 5).length;
  assert.equal(lit(frames[0]!), 0, 'la rotativa apagada');
  assert.ok(lit(frames[a.warn!]!) >= 2, 'la rotativa encendida');
  // Bonked: X eyes, no headlights (no cream or red in the eyes).
  assert.equal(rowsOf(frames[a.stun!]!, 'crema', [0], 17, 34).filter((y) => y < 22).length, 0, 'ojos en X');
  // Rolling: the hubs turn (the walk frames differ at the wheels).
  const wheels = (cv: Canvas): string => {
    const px: string[] = [];
    for (let y = 34; y < 44; y++) for (let x = 8; x < 36; x++) px.push(cv.get(x, y).join(','));
    return px.join(';');
  };
  assert.equal(new Set(a.walk!.map((k) => wheels(frames[k]!))).size, 4, 'las ruedas no giran');
  // The red lockout tag hangs from the mast in every frame.
  for (const f of frames) assert.ok(rowsOf(f, 'rojo', [2], 39, 44).length >= 20, 'la tarjeta de «Fuera de servicio»');
});

test('estilo a6f2: su mostaza no es el amarillo de los cupones y no se parece al aspirador (los dos embisten)', () => {
  const [f] = TN.makeCarretillaNuevaFrames();
  assert.ok(rowsOf(f!, 'mostaza', [0, 1, 2, 3, 4, 5, 6]).length > 300, 'la pintura mostaza');
  const o = silhouetteOverlap(f!, P1.makeAspiradorNuevoFrames()[0]!);
  assert.ok(o < 0.8, `carretilla–aspirador: ${o.toFixed(2)}`);
});
