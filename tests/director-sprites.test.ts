// M10 planta 4 (5a): the sprites of El Director de Recursos Inhumanos, floor 4's boss (in his
// chair and on his feet), his chair alone, his bullets, the partitions that move and the long
// table of the Sala de Juntas, which is now in the room and stops bullets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { PROPS } from '../src/data/props.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom, TILE } from '../src/sim/room.ts';
import { createWorld, isClear } from '../src/sim/world.ts';
import {
  CHAIR_H, CHAIR_W, DIRECTOR_FRAMES, DIRECTOR_H, DIRECTOR_W, DSKIN, LEATHER, makeBoardTable, makeBusinessCard, makeChairFrames, makeCut,
  makeDirectorFrames, makeDismissalLetter, makePartitionFrames, makeSlide, PARTITION_H, PARTITION_W, SHEET, SUIT, TABLE_BOX, TABLE_H, TABLE_W,
} from '../tools/sprites/director.ts';

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const count = (cv: Canvas, c: readonly number[]): number => cv.p.flat().filter((p) => p[3] === 255 && same(p, c)).length;
const bottom = (cv: Canvas): number => {
  for (let y = cv.h - 1; y >= 0; y--) if (cv.p[y]!.some((p) => p[3] > 0)) return y;
  return -1;
};

test('el Director: dieciocho fotogramas de jefe, en la silla los nueve primeros y de pie el resto', () => {
  const fr = makeDirectorFrames();
  assert.equal(fr.length, DIRECTOR_FRAMES.length);
  assert.equal(fr.length, 18);
  // Only the walk's passing steps repeat the rest pose (as with the other bosses).
  assert.equal(new Set(fr.map((f) => JSON.stringify(f.p))).size, fr.length - 2, 'no hay más fotogramas repetidos');
  for (const [i, f] of fr.entries()) {
    assert.deepEqual([f.w, f.h], [DIRECTOR_W, DIRECTOR_H], `fotograma ${i}`);
    const seated = DIRECTOR_FRAMES[i]!.startsWith('silla');
    const chair = count(f, LEATHER[1]!);
    if (seated) assert.ok(chair > 150, `el fotograma ${i} va en la silla (${chair} px)`);
    else assert.equal(chair, 0, `el fotograma ${i} ya se ha levantado`);
    assert.ok(count(f, SUIT[1]!) > 120, `el fotograma ${i} lleva el traje`);
    const back = DIRECTOR_FRAMES[i] === 'pie-gira-espalda';
    // You never see his eyes: the glasses show a spreadsheet, or flash white when he decides.
    const sheet = count(f, SHEET[1]!);
    const decides = /lanza|palmada|sello/.test(DIRECTOR_FRAMES[i]!);
    if (back || decides) assert.equal(sheet, 0, `el fotograma ${i} no enseña la hoja de cálculo`);
    else assert.ok(sheet >= 8, `las gafas del fotograma ${i} reflejan la hoja de cálculo`);
    if (!back) assert.ok(count(f, DSKIN[1]!) > 300, `el fotograma ${i} tiene cara`);
  }
  // The same floor line in every frame: the wheels in the chair, the shoes standing.
  const floor = bottom(fr[0]!);
  for (const [i, f] of fr.entries()) assert.equal(bottom(f), floor, `fotograma ${i}`);
  assert.ok(floor >= DIRECTOR_H - 4, 'los pies, abajo del todo, como los otros jefes');
});

test('la silla sola, las balas y las cartas de despido', () => {
  const chairs = makeChairFrames();
  assert.equal(chairs.length, 7);
  for (const c of chairs) {
    assert.deepEqual([c.w, c.h], [CHAIR_W, CHAIR_H]);
    assert.ok(count(c, LEATHER[1]!) > 150);
    assert.equal(count(c, SUIT[1]!), 0, 'vacía');
  }
  assert.equal(new Set(chairs.map((c) => JSON.stringify(c.p))).size, 7, 'las ruedas giran, la etiqueta se mueve y avisa antes de embestir');
  assert.deepEqual([makeBusinessCard().w, makeBusinessCard().h], [40, 8]);
  assert.deepEqual([makeDismissalLetter().w, makeDismissalLetter().h], [24, 10]);
  assert.deepEqual([makeSlide().w, makeSlide().h], [18, 9]);
  assert.deepEqual([makeCut().w, makeCut().h], [9, 9]);
});

test('la mampara que se mueve: del tamaño de tres casillas de pared, y su silueta discontinua', () => {
  const [solid, ghost] = makePartitionFrames();
  assert.deepEqual([solid!.w, solid!.h], [PARTITION_W, PARTITION_H]);
  assert.equal(PARTITION_W, 3 * TILE);
  assert.equal(PARTITION_H, TILE);
  const painted = (c: Canvas): number => c.p.flat().filter((p) => p[3] > 0).length;
  assert.equal(painted(solid!), PARTITION_W * PARTITION_H, 'la mampara es maciza');
  assert.ok(painted(ghost!) < PARTITION_W * 3, 'la silueta es solo el borde');
});

test('la mesa larga está en la Sala de Juntas, para balas, no se vuelca y se rodea por los dos lados', () => {
  const def = PROPS['mesa-juntas']!;
  assert.deepEqual(def.box, { ...TABLE_BOX });
  assert.ok(def.blocksBullets);
  assert.equal(def.tip, undefined, 'no es una mesa de las que se vuelcan');
  // The box falls inside the sprite (drawn from its bottom-centre).
  const t = makeBoardTable();
  assert.deepEqual([t.w, t.h], [TABLE_W, TABLE_H]);
  assert.ok(-def.box.x <= TABLE_W / 2 && def.box.x + def.box.w <= TABLE_W / 2 && -def.box.y <= TABLE_H && def.box.y + def.box.h <= 0);
  const room = buildRoom(ROOMS['jefe-oficinas']!);
  const tables = room.props.filter((p) => p.def.id === 'mesa-juntas');
  assert.equal(tables.length, 1);
  const tb = tables[0]!;
  assert.ok(Math.abs(tb.x - room.w / 2) <= TILE / 2, 'en el centro de la sala');
  const w = createWorld({ seed: 'mesa-juntas', room: 'jefe-oficinas', level: 4 });
  const r = 5;
  assert.ok(!isClear(w, tb.x, tb.box.y + tb.box.h / 2, r), 'no se atraviesa');
  // Clear above it, below it and at both ends: it is gone round.
  assert.ok(isClear(w, tb.x, tb.box.y - 10, r), 'se pasa por encima');
  assert.ok(isClear(w, tb.x, tb.box.y + tb.box.h + 10, r), 'se pasa por debajo');
  assert.ok(isClear(w, tb.box.x - 12, tb.y - 12, r), 'se pasa por la izquierda');
  assert.ok(isClear(w, tb.box.x + tb.box.w + 12, tb.y - 12, r), 'se pasa por la derecha');
});
