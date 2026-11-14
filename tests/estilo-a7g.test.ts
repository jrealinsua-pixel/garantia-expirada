// M14c (a7g): El Director de Recursos Inhumanos and his chair, redrawn in the new style
// (tools/sprites/director-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeChairFrames, makeDirectorFrames } from '../tools/sprites/director.ts';
import * as D from '../tools/sprites/director-nuevo.ts';

/** The warehouse floor's middle tone (the style guide's), and the burgundy border of the Sala de Juntas' good carpet. */
const FLOORS = [MATERIALS.suelo[3]!, hx('#7a3a44')];
/** The offices' carpet tiles and the Sala de Juntas' charcoal carpet: darker than the rule's floor, so only «melts» is asked there. */
const CARPETS = [hx('#3d3d42'), hx('#323138')];
const def = ENEMIES['director-rrhh']!;
const chairDef = ENEMIES['silla-director']!;
const brain = def.brain as BossBrain;
const frames = D.makeDirectorNuevoFrames();
const chairs = D.makeChairNuevoFrames();
const F = D.DIRECTOR_FRAMES;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const count = (cv: Canvas, m: Material, x0 = 0, y0 = 0, x1 = cv.w, y1 = cv.h): number => {
  let n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (cv.get(x, y)[3] === 255 && isMat(cv.get(x, y), m)) n++;
  return n;
};
const bottomRow = (f: Canvas): number => {
  for (let y = f.h - 1; y >= 0; y--) for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) return y;
  return -1;
};
const fill = (f: Canvas): number => {
  const h = def.hurt!;
  const A = def.anchor;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  return inside / (h.w * h.h);
};

test('estilo a7g: el Director y su silla se leen sobre el suelo (y no se funden con la moqueta de la Sala de Juntas)', () => {
  for (const [i, f] of [...frames, ...chairs].entries()) {
    for (const floor of FLOORS) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
    for (const floor of CARPETS) assert.ok(legibility(f, floor).melts <= 0.3, `${i}: se funde con la moqueta (${legibility(f, floor).melts.toFixed(2)})`);
  }
});

test('estilo a7g: las hojas del juego son las nuevas, más grandes, y las ruedas (o los zapatos) pisan el ancla', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [D.DIRECTOR_W, D.DIRECTOR_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, D.DIRECTOR_FEET);
  assert.deepEqual(def.hurt, { x: -24, y: -66, w: 48, h: 60 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) assert.equal(bottomRow(f), def.anchor.y, `fotograma ${i}: no pisa el suelo`);
  // A sixth bigger frame (the bosses' rule), and the body grows with it.
  const old = makeDirectorFrames();
  assert.ok(area(frames[0]!) > area(old[0]!) * 1.1, 'en la silla, más grande que el viejo');
  assert.ok(area(frames[F.standing]!) > area(old[9]!) * 1.1, 'de pie, más grande que el viejo');
  const ch = allSheets()['silla-director']!;
  assert.deepEqual([ch.frameW, ch.frameH, ch.canvas.w / ch.frameW], [D.CHAIR_W, D.CHAIR_H, 7]);
  assert.deepEqual(chairDef.anchor, D.CHAIR_FEET);
  for (const c of chairs) assert.equal(bottomRow(c), D.CHAIR_FEET.y, 'las ruedas de la silla, en el suelo');
  assert.ok(area(chairs[0]!) > area(makeChairFrames()[0]!), 'la silla sola, también más grande');
  const bits = allSheets()['despiece-director-rrhh']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [D.DIRECTOR_BIT, D.DIRECTOR_BIT, 6]);
});

test('estilo a7g: sentado llena su caja de golpes y de pie no se queda corto; la silla, solo mientras está sentado', () => {
  // Seated, the chair and he fill the box (under the seat there is only air, the lift and the shins).
  for (let i = 0; i < F.standing; i++) assert.ok(fill(frames[i]!) > 0.8, `fotograma ${i}: llena el ${(100 * fill(frames[i]!)).toFixed(0)} %`);
  // Standing, a man in a suit on two legs: less, but still the box (the legs are the gap).
  for (let i = F.standing; i < F.count; i++) assert.ok(fill(frames[i]!) > 0.6, `fotograma ${i}: llena el ${(100 * fill(frames[i]!)).toFixed(0)} %`);
  for (const [i, f] of frames.entries()) {
    const leather = count(f, 'polipiel');
    if (i < F.standing) assert.ok(leather > 400, `el fotograma ${i} va en la silla (${leather} px)`);
    else assert.equal(leather, 0, `el fotograma ${i} ya se ha levantado`);
    assert.ok(count(f, 'traje') > 600, `el fotograma ${i} lleva el traje`);
    assert.ok(count(f, 'bronceado') > 120, `el fotograma ${i} tiene manos (y cara)`);
  }
  for (const c of chairs) {
    assert.ok(count(c, 'polipiel') > 500, `la silla sola (${count(c, 'polipiel')} px)`);
    assert.equal(count(c, 'traje'), 0, 'vacía');
  }
  assert.equal(new Set(chairs.map((c) => c.p.flat().join())).size, 7, 'las ruedas giran, la etiqueta se mueve y avisa antes de embestir');
});

test('estilo a7g: los fotogramas cuadran con su anim, sus poses de ataque y su fase de pie', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.idle);
  assert.deepEqual(a.walk, F.walk);
  assert.equal(a.warn, F.warn);
  assert.equal(a.clap, F.clap);
  assert.deepEqual(a.spin, [F.spinFront, F.spinSide, F.spinBack, F.spinSide]);
  assert.deepEqual(brain.phases.map((p) => p.frameShift), [undefined, undefined, F.standing]);
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses[0], [F.cards, F.letter]);
  assert.deepEqual(poses[1], [F.slides, F.cards, F.stamp, F.letter]);
  assert.deepEqual(poses[2], [F.windup, F.windup, F.cards3]);
  // On his feet the layout is the seated one moved on: the warning and the cards line up.
  assert.equal(F.standing + F.warn + 1, F.cards3);
  // Every frame is different, except two beats of the standing walk (both feet down: the rest
  // pose, and the body down a pixel), which are its two breathing frames.
  const keys = frames.map((f) => f.p.flat().join());
  assert.equal(new Set(keys).size, F.count - 2);
  assert.equal(keys[F.standing + F.walk[1]!], keys[F.standing + F.idle[0]!]);
  assert.equal(keys[F.standing + F.walk[3]!], keys[F.standing + F.idle[1]!]);
  // The muzzle (his front hand, at rest on his knee) and where the letters fly from (the hand flung up) are on him.
  const m = brain.muzzle;
  const at = (f: Canvas, x: number, y: number): boolean => f.get(def.anchor.x + x, def.anchor.y - y)[3] === 255;
  assert.ok(at(frames[0]!, m.x, m.y) && at(frames[F.cards]!, m.x, m.y), 'las tarjetas salen de su mano');
  const spit = brain.phases[0]!.attacks.find((x) => x.kind === 'spit')!;
  assert.ok('from' in spit && at(frames[F.letter]!, spit.from.x, spit.from.y), 'la carta sale de su mano en alto');
});

test('estilo a7g: nunca se le ven los ojos; las gafas cuentan lo que hace', () => {
  // The two lenses, seated and standing (the head is at the same x; 5 rows higher standing).
  const lenses = (f: Canvas, y0: number, m: Material): number => count(f, m, 36, y0, 59, y0 + 8);
  const seatY = 22;
  const standY = 17;
  // At rest: the spreadsheet (green), with its total in red.
  assert.ok(lenses(frames[0]!, seatY, 'verde') >= 40, 'sentado, la hoja de cálculo');
  assert.ok(lenses(frames[F.standing]!, standY, 'verde') >= 40, 'de pie, la hoja de cálculo');
  // When he decides (the warning, the clap, the stamp, the letter): a white flash, no spreadsheet.
  for (const i of [F.warn, F.clap, F.stamp, F.letter, F.standing + F.warn]) {
    const y = i < F.standing ? seatY : standY;
    assert.equal(lenses(frames[i]!, y, 'verde'), 0, `fotograma ${i}: destellan`);
  }
  // Presenting: his slide in the glasses (a red header and a bar chart going down).
  assert.equal(lenses(frames[F.slides]!, seatY, 'verde'), 0);
  assert.ok(lenses(frames[F.slides]!, seatY, 'rojo') >= 10 && lenses(frames[F.slides]!, seatY, 'azul') >= 4, 'la diapositiva en las gafas');
  // From behind: no glasses at all, only hair, and the shop tag on his collar.
  assert.equal(count(frames[F.spinBack]!, 'verde'), 0);
  assert.equal(count(frames[F.spinBack]!, 'goma', 30, 10, 64, 40), 0, 'de espaldas no hay montura');
  assert.ok(count(frames[F.spinBack]!, 'rojo') >= 4, 'la etiqueta de la tienda');
  // Seated he smiles (white teeth under the glasses); standing, a flat line.
  const teeth = (f: Canvas, y0: number): number => count(f, 'acero', 40, y0 + 14, 56, y0 + 18);
  assert.ok(teeth(frames[0]!, seatY) >= 20, 'la sonrisa de la foto de perfil');
  assert.equal(teeth(frames[F.standing]!, standY), 0, 'de pie ya no sonríe');
  // His stamp, his cards and his remote in his hand.
  assert.ok(count(frames[F.stamp]!, 'haya') > 40);
  assert.ok(count(frames[F.cards]!, 'cian') > 20 && count(frames[F.cards3]!, 'cian') > 20);
  assert.ok(count(frames[F.letter]!, 'acero', 60, 8, 84, 30) > 40, 'el sobre');
});
