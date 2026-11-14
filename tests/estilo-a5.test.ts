// M14c (a5): the plant 1 and 2 enemies redrawn in the new style, checked against the style
// guide (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo») and against the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeBatidora, makeMando } from '../tools/sprites/enemies.ts';
import { makeBombilla } from '../tools/sprites/characters.ts';
import * as P1 from '../tools/sprites/planta1-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;

/** The redrawn ones so far, with their frames. */
const REDRAWN: Record<string, () => Canvas[]> = {
  aspirador: P1.makeAspiradorNuevoFrames,
  microondas: P1.makeMicroondasNuevoFrames,
};

function bottomRow(cv: Canvas, x0 = 0, x1 = cv.w - 1): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}

test('estilo a5: los enemigos redibujados se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const [id, make] of Object.entries(REDRAWN)) {
    for (const [i, f] of make().entries()) {
      const l = legibility(f, FLOOR);
      assert.ok(l.darkEdge >= 0.8, `${id} ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${id} ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${id} ${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a5: las hojas del juego son las nuevas y casan con los datos (fotogramas, pies)', () => {
  const sheets = allSheets();
  for (const [id, make] of Object.entries(REDRAWN)) {
    const def = ENEMIES[id]!;
    const frames = make();
    const s = sheets[def.sprite]!;
    assert.equal(s.frameW, frames[0]!.w, `${id}: ancho de fotograma`);
    assert.equal(s.canvas.w / s.frameW, frames.length, `${id}: número de fotogramas`);
    // Every frame its animation names exists.
    const a = def.anim!;
    const used = [...a.idle, ...(a.walk ?? []), ...(a.warn !== undefined ? [a.warn] : [])];
    for (const k of used) assert.ok(k < frames.length, `${id}: el fotograma ${k} no está en la hoja`);
    // Its feet: the anchor is the row under the soles, right under the legs, on every frame that is
    // not a lifted step.
    assert.ok(def.anchor.x > 0 && def.anchor.x < s.frameW && def.anchor.y < s.frameH, `${id}: el ancla se sale`);
    for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, a.warn!]) {
      assert.equal(bottomRow(frames[k]!, def.anchor.x - 8, def.anchor.x + 8), def.anchor.y, `${id} ${k}: los pies no tocan el suelo`);
    }
  }
});

test('estilo a5: más grandes que antes (cuerpo de 24 px o más) y sin cambiar las cajas de choque', () => {
  for (const [id, make] of Object.entries(REDRAWN)) {
    const f = make()[0]!;
    let widest = 0;
    for (let y = 0; y < f.h; y++) {
      let n = 0;
      for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) n++;
      widest = Math.max(widest, n);
    }
    assert.ok(widest >= 26, `${id}: ${widest} px de ancho`);
  }
  assert.deepEqual(ENEMIES['aspirador']!.hurt, { x: -14, y: -30, w: 28, h: 30 });
  assert.deepEqual(ENEMIES['microondas']!.hurt, { x: -13, y: -31, w: 26, h: 30 });
});

test('estilo a5: el aspirador y el microondas no se parecen entre sí ni a los demás de la planta 1', () => {
  const asp = P1.makeAspiradorNuevoFrames()[0]!;
  const mic = P1.makeMicroondasNuevoFrames()[0]!;
  assert.ok(silhouetteOverlap(asp, mic) < 0.8, `aspirador–microondas ${silhouetteOverlap(asp, mic).toFixed(2)}`);
  for (const [name, other] of [['bombilla', makeBombilla()], ['batidora', makeBatidora()], ['mando', makeMando()]] as const) {
    for (const [mine, cv] of [['aspirador', asp], ['microondas', mic]] as const) {
      const o = silhouetteOverlap(cv, other);
      assert.ok(o < 0.8, `${mine}–${name}: ${o.toFixed(2)}`);
    }
  }
});

test('estilo a5: el 12:00 del microondas está donde el juego lo hace parpadear', () => {
  const C = P1.MICROONDAS_CLOCK;
  const lcd = MATERIALS.verde;
  const isLcd = (c: readonly number[]): boolean => lcd.some((t) => t[0] === c[0] && t[1] === c[1] && t[2] === c[2]);
  const dy: Record<number, number> = { 1: 1, 3: -1, 5: -1 };
  for (const [i, f] of P1.makeMicroondasNuevoFrames().entries()) {
    let lit = 0;
    for (let y = 0; y < C.h; y++) {
      for (let x = 0; x < C.w; x++) {
        const c = f.get(C.x + x, C.y + y + (dy[i] ?? 0));
        assert.ok(isLcd(c), `fotograma ${i}: (${C.x + x}, ${C.y + y}) no es la pantalla`);
        if (c[0] !== lcd[5]![0]) lit++;
      }
    }
    assert.ok(lit >= 10, `fotograma ${i}: el reloj casi no se ve`);
  }
});

test('estilo a5: los aspavientos de aviso (acelerar y calentar) se distinguen de estar quieto', () => {
  const diff = (a: Canvas, b: Canvas): number => {
    let n = 0;
    for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.get(x, y).join() !== b.get(x, y).join()) n++;
    return n;
  };
  const asp = P1.makeAspiradorNuevoFrames();
  const mic = P1.makeMicroondasNuevoFrames();
  assert.ok(diff(asp[0]!, asp[6]!) > 60, `aspirador: ${diff(asp[0]!, asp[6]!)} px distintos`);
  assert.ok(diff(mic[0]!, mic[6]!) > 60, `microondas: ${diff(mic[0]!, mic[6]!)} px distintos`);
});
