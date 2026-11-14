// M14c (a5): the plant 1 and 2 enemies redrawn in the new style, checked against the style
// guide (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo») and against the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import * as P1 from '../tools/sprites/planta1-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;

/** The redrawn ones so far, with their frames. */
const REDRAWN: Record<string, () => Canvas[]> = {
  aspirador: P1.makeAspiradorNuevoFrames,
  microondas: P1.makeMicroondasNuevoFrames,
  bombilla: P1.makeBombillaNuevaFrames,
  batidora: P1.makeBatidoraNuevaFrames,
  mando: P1.makeMandoNuevoFrames,
};

/** The flyers: no feet on the floor (the game lifts them by their altitude). */
const FLYERS: Record<string, () => Canvas[]> = {
  polilla: P1.makePolillaNueva,
};

function bottomRow(cv: Canvas, x0 = 0, x1 = cv.w - 1): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}

test('estilo a5: los enemigos redibujados se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const [id, make] of Object.entries({ ...REDRAWN, ...FLYERS })) {
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
    const used = [...a.idle, ...(a.walk ?? []), ...[a.warn, a.off].filter((k) => k !== undefined)];
    for (const k of used) assert.ok(k < frames.length, `${id}: el fotograma ${k} no está en la hoja`);
    // Its feet: the anchor is the row under the soles, right under the legs, on every frame that is
    // not a lifted step.
    assert.ok(def.anchor.x > 0 && def.anchor.x < s.frameW && def.anchor.y < s.frameH, `${id}: el ancla se sale`);
    for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, ...[a.warn, a.off].filter((k) => k !== undefined)]) {
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
  assert.deepEqual(ENEMIES['bombilla']!.hurt, { x: -13, y: -31, w: 26, h: 30 });
  assert.deepEqual(ENEMIES['batidora']!.hurt, { x: -12, y: -31, w: 24, h: 29 });
  assert.deepEqual(ENEMIES['mando']!.hurt, { x: -8, y: -28, w: 16, h: 26 });
  assert.deepEqual(ENEMIES['polilla']!.hurt, { x: -5, y: -21, w: 10, h: 9 });
});

test('estilo a5: los enemigos de la planta 1 no se parecen entre sí', () => {
  const plant1: Array<[string, Canvas]> = [
    ['aspirador', P1.makeAspiradorNuevoFrames()[0]!],
    ['microondas', P1.makeMicroondasNuevoFrames()[0]!],
    ['bombilla', P1.makeBombillaNuevaFrames()[0]!],
    ['batidora', P1.makeBatidoraNuevaFrames()[0]!],
    ['mando', P1.makeMandoNuevoFrames()[0]!],
  ];
  for (let i = 0; i < plant1.length; i++) {
    for (let j = i + 1; j < plant1.length; j++) {
      const o = silhouetteOverlap(plant1[i]![1], plant1[j]![1]);
      assert.ok(o < 0.8, `${plant1[i]![0]}–${plant1[j]![0]}: ${o.toFixed(2)}`);
    }
  }
});

test('estilo a5: la bombilla se apaga de verdad al encenderse y su halo va en el globo', () => {
  const [lit, off] = P1.makeBombillaNuevaFrames();
  const F = P1.BOMBILLA_FEET;
  const glass = MATERIALS.amarillo;
  const isGlass = (c: readonly number[]): boolean => glass.some((t) => t[0] === c[0] && t[1] === c[1] && t[2] === c[2]);
  // The glow's centre, and the globe round it, are lit glass.
  const cy = F.y - P1.BOMBILLA_GLOW_Y;
  let litGlass = 0;
  let offGlass = 0;
  for (let y = cy - 8; y <= cy + 8; y++) {
    for (let x = F.x - 8; x <= F.x + 8; x++) {
      if (isGlass(lit!.get(x, y))) litGlass++;
      if (isGlass(off!.get(x, y))) offGlass++;
    }
  }
  assert.ok(litGlass > 150, `encendida: ${litGlass} px de cristal iluminado alrededor del halo`);
  assert.equal(offGlass, 0, 'apagada no queda nada encendido');
});

test('estilo a5: la polilla aletea y su cuerpo queda sobre su caja de golpes', () => {
  const frames = P1.makePolillaNueva();
  const def = ENEMIES['polilla']!;
  assert.equal(frames.length, 2);
  assert.ok(Math.max(...def.anim!.idle) < frames.length);
  // Wings up and wings down are different shapes.
  const top = (cv: Canvas): number => {
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3] === 255 && (x < 4 || x > 12)) return y;
    return cv.h;
  };
  assert.ok(top(frames[1]!) - top(frames[0]!) >= 4, 'las alas no bajan');
  // The body (the column in the middle) is centred on the hit box (relative to the same anchor).
  const altitude = def.brain.kind === 'moth' ? def.brain.altitude : 0;
  const hitMid = def.hurt.y + def.hurt.h / 2 + altitude;
  const bodyMid = 6.5 - def.anchor.y;
  assert.ok(Math.abs(hitMid - bodyMid) <= 2, `cuerpo ${bodyMid}, caja ${hitMid}`);
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

test('estilo a5: las varillas de la batidora giran (cada fotograma de reposo, distinto)', () => {
  const f = P1.makeBatidoraNuevaFrames();
  assert.equal(f.length, 8);
  // The whisks' box, under its chin in front of the legs (same bob on frames 0 and 2).
  const box = (cv: Canvas): string => {
    const out: string[] = [];
    for (let y = 26; y < 37; y++) for (let x = 21; x < 38; x++) out.push(cv.get(x, y).join());
    return out.join('|');
  };
  const seen = new Set([0, 1, 2, 3].map((k) => box(f[k]!)));
  assert.equal(seen.size, 4, 'dos fotogramas de reposo tienen las varillas igual');
  assert.notEqual(box(f[0]!), box(f[2]!));
});

test('estilo a5: el mando dispara desde su ventana de infrarrojos', () => {
  const def = ENEMIES['mando']!;
  assert.equal(def.brain.kind, 'blinker');
  const muzzleY = def.brain.kind === 'blinker' ? def.brain.muzzleY : 0;
  assert.equal(muzzleY, P1.MANDO_IR_Y);
  const f = P1.makeMandoNuevoFrames()[0]!;
  const red = MATERIALS.rojo;
  const isRed = (c: readonly number[]): boolean => red.some((t) => t[0] === c[0] && t[1] === c[1] && t[2] === c[2]);
  const y = def.anchor.y - muzzleY;
  let n = 0;
  for (let x = 0; x < f.w; x++) if (isRed(f.get(x, y))) n++;
  assert.ok(n >= 10, `en la fila de la boca (${y}) solo hay ${n} px de la ventana roja`);
});
