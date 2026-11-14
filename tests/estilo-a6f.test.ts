// M14c (a6f1): the Asistente Virtual and the Teléfono de Recepción in the new style
// (tools/sprites/recepcion-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { allSheets } from '../tools/sprites/build.ts';
import * as CL from '../tools/sprites/clientela.ts';
import * as RC from '../tools/sprites/recepcion-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const count = (cv: Canvas, cs: readonly (readonly number[])[], y0 = 0, y1 = cv.h - 1): number => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < cv.w; x++) if (cs.some((c) => same(cv.get(x, y), c))) n++;
  return n;
};
function bottomRow(cv: Canvas, x0 = 0, x1 = cv.w - 1): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}
function topRow(cv: Canvas): number {
  for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3] === 255) return y;
  return cv.h;
}

const BOTH = [
  { id: 'asistente-virtual', frames: RC.makeAsistenteNuevoFrames(), names: CL.AV_FRAMES, feet: RC.AV_FEET, w: RC.AV_W, h: RC.AV_H },
  { id: 'telefono-recepcion', frames: RC.makeTelefonoNuevoFrames(), names: CL.PHONE_FRAMES, feet: RC.PHONE_FEET, w: RC.PHONE_W, h: RC.PHONE_H },
];

test('estilo a6f: se leen sobre el suelo, sin fotogramas repetidos ni nada pegado al borde', () => {
  for (const e of BOTH) {
    assert.equal(e.frames.length, e.names.length, `${e.id}: un fotograma por nombre`);
    assert.equal(new Set(e.frames.map((f) => JSON.stringify(f.p))).size, e.frames.length, `${e.id}: fotogramas repetidos`);
    for (const [i, f] of e.frames.entries()) {
      assert.deepEqual([f.w, f.h], [e.w, e.h]);
      const l = legibility(f, FLOOR);
      assert.ok(l.darkEdge >= 0.8, `${e.id} ${e.names[i]}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${e.id} ${e.names[i]}: contraste ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${e.id} ${e.names[i]}: se funde con el suelo`);
      for (let y = 0; y < f.h; y++) assert.ok(f.get(0, y)[3] === 0 || f.get(0, y)[3] === 255, 'sin semitransparencias');
      for (let x = 0; x < f.w; x++) assert.equal(f.get(x, 0)[3], 0, `${e.id} ${e.names[i]}: pegado arriba`);
    }
  }
});

test('estilo a6f: las hojas del juego son las nuevas, con el ancla en los pies y las cajas de golpes de siempre', () => {
  const sheets = allSheets();
  for (const e of BOTH) {
    const def = ENEMIES[e.id]!;
    const s = sheets[def.sprite]!;
    assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [e.w, e.h, e.frames.length], e.id);
    assert.deepEqual(def.anchor, e.feet, `${e.id}: el ancla`);
    for (const [i, f] of e.frames.entries()) {
      if (e.names[i] === 'aire') continue;
      assert.equal(bottomRow(f, e.feet.x - 10, e.feet.x + 10), e.feet.y, `${e.id} ${e.names[i]}: los pies no tocan el suelo`);
    }
  }
  assert.deepEqual(ENEMIES['asistente-virtual']!.hurt, { x: -12, y: -33, w: 24, h: 32 });
  assert.deepEqual(ENEMIES['telefono-recepcion']!.hurt, { x: -14, y: -21, w: 28, h: 20 });
  // More presence than before: taller and wider than the old sheets.
  assert.ok(RC.AV_H > CL.AV_H && RC.PHONE_W > CL.PHONE_W);
});

test('estilo a6f: el asistente sonríe en la fila de su boca, tiene pantalla azul y escribe con los tres puntos', () => {
  const def = ENEMIES['asistente-virtual']!;
  assert.equal(def.brain.kind === 'chatbot' && def.brain.muzzleY, RC.AV_MOUTH_Y);
  const fr = RC.makeAsistenteNuevoFrames();
  const row = RC.AV_FEET.y - RC.AV_MOUTH_Y - 1;
  // The bottom of the smile (ink) on the muzzle row, at the same place standing and typing.
  const ink = [[0x14, 0x0f, 0x20, 255]];
  for (const k of [0, 6]) assert.ok(count(fr[k]!, ink, row, row) >= 7, `fotograma ${k}: la sonrisa no está en la fila ${row}`);
  // The screen glows blue: lots of `azul`, more than any other colour on it but the white plastic.
  assert.ok(count(fr[0]!, MATERIALS.azul) > 150, 'la pantalla');
  assert.ok(count(fr[0]!, MATERIALS.turquesa) > 25, 'la franja de la marca y las zapatillas');
  // Typing: the lit dot moves; standing there are no dots.
  const dots = (cv: Canvas): number => count(cv, [MATERIALS.azul[4]!], row + 3, row + 3);
  assert.equal(dots(fr[0]!), 0);
  assert.ok(dots(fr[6]!) >= 2 && dots(fr[7]!) >= 2);
  assert.notDeepEqual(fr[6]!.p[row + 3], fr[7]!.p[row + 3], 'el punto encendido se mueve');
});

test('estilo a6f: el teléfono salta, suena con los ojos cerrados y la boca abierta en su fila, y pasa la llamada', () => {
  const def = ENEMIES['telefono-recepcion']!;
  assert.equal(def.brain.kind === 'phone' && def.brain.muzzleY, RC.PHONE_MOUTH_Y);
  const fr = RC.makeTelefonoNuevoFrames();
  const at = (n: (typeof CL.PHONE_FRAMES)[number]): Canvas => fr[CL.PHONE_FRAMES.indexOf(n)]!;
  const row = RC.PHONE_FEET.y - RC.PHONE_MOUTH_Y - 1;
  const ink = [[0x14, 0x0f, 0x20, 255]];
  // The mouth on its row standing; open (red inside) when it rings.
  assert.ok(count(at('reposo0'), ink, row, row) >= 6, `la boca no está en la fila ${row}`);
  assert.ok(count(at('suena0'), [MATERIALS.rojo[4]!], row - 1, row + 1) >= 4, 'al sonar, la boca abierta');
  // In the air: off the floor, and higher than standing; crouching, lower.
  assert.ok(bottomRow(at('aire')) < RC.PHONE_FEET.y - 2, 'el teléfono salta');
  assert.ok(topRow(at('aire')) < topRow(at('reposo0')) && topRow(at('agacha')) > topRow(at('reposo0')));
  // Yellowed plastic (crema), not the grey of the copier nor the beige of the printers.
  assert.ok(count(at('reposo0'), MATERIALS.crema) > 8 * count(at('reposo0'), MATERIALS.beige), 'amarillento');
  // The post-it «Ext. 0» on top and the message light on in every frame.
  for (const f of fr) assert.ok(count(f, [MATERIALS.amarillo[1]!]) >= 10, 'el pósit');
  // Ringing it shakes: the two ringing frames differ, and their body is shifted.
  assert.notDeepEqual(at('suena0').p, at('suena1').p);
});
