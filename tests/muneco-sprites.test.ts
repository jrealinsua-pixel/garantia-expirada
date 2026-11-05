// M10 (5a): the sprites of El Muñeco de Moda, floor 3's boss: boxed, out of the box, its sale tags and the box it leaves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { BOX, makeBrokenBox, makeMunecoFrames, makeTagFrames, MUNECO_H, MUNECO_W, SKIN, TAG_ANCHOR, TAG_H, TAG_W } from '../tools/sprites/muneco.ts';

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const count = (cv: Canvas, c: readonly number[]): number => cv.p.flat().filter((p) => p[3] === 255 && same(p, c)).length;
const bottom = (cv: Canvas): number => {
  for (let y = cv.h - 1; y >= 0; y--) if (cv.p[y]!.some((p) => p[3] > 0)) return y;
  return -1;
};

test('el Muñeco de Moda: dieciséis fotogramas de jefe, con caja los siete primeros y sin ella el resto', () => {
  const fr = makeMunecoFrames();
  assert.equal(fr.length, 16);
  for (const [i, f] of fr.entries()) {
    assert.deepEqual([f.w, f.h], [MUNECO_W, MUNECO_H], `fotograma ${i}`);
    const box = count(f, BOX[1]!);
    if (i < 7) assert.ok(box > 250, `el fotograma ${i} lleva la caja (${box} px)`);
    else assert.equal(box, 0, `el fotograma ${i} ya no lleva caja`);
    assert.ok(count(f, SKIN[1]!) > 30, `el fotograma ${i} tiene manos (y cara) de muñeco`);
  }
  // It stands on the same floor line in every frame (the walk only lifts a foot).
  const floor = bottom(fr[0]!);
  for (const f of fr) assert.equal(bottom(f), floor);
  assert.ok(floor >= MUNECO_H - 4, 'los pies, abajo del todo, como los otros jefes');
});

test('la etiqueta de rebaja: cuatro precios distintos, y en su sitio cae entera sobre la caja', () => {
  const tags = makeTagFrames();
  assert.equal(tags.length, 4);
  const keys = tags.map((t) => JSON.stringify(t.p));
  assert.equal(new Set(keys).size, 4, 'precio completo, -30 %, -50 % y -70 %, todas distintas');
  const boxed = makeMunecoFrames().slice(0, 7);
  for (const t of tags) {
    assert.deepEqual([t.w, t.h], [TAG_W, TAG_H]);
    for (const [i, f] of boxed.entries()) {
      // Wherever the tag has paint, the box under it has paint too: it never hangs off the edge.
      const bob = i === 6 ? -1 : 0;
      for (let y = 0; y < TAG_H; y++) for (let x = 0; x < TAG_W; x++) {
        if (t.get(x, y)[3] === 0) continue;
        const ux = TAG_ANCHOR.x + x;
        const uy = TAG_ANCHOR.y + y + bob;
        const under = [f.get(ux, uy), f.get(ux, uy - 1), f.get(ux, uy + 1)];
        assert.ok(under.some((p) => p[3] > 0), `la etiqueta sale de la caja en (${ux}, ${uy}) del fotograma ${i}`);
      }
    }
  }
});

test('la caja rota se queda vacía: sin muñeco dentro y con la última rebaja puesta', () => {
  const b = makeBrokenBox();
  assert.deepEqual([b.w, b.h], [56, 64]);
  assert.ok(count(b, BOX[1]!) > 250, 'es la misma caja');
  assert.equal(count(b, SKIN[1]!), 0, 'el muñeco ya no está');
  const red = makeTagFrames()[3]!;
  assert.ok(count(b, red.get(10, 2)) > 10, 'lleva la etiqueta del -70 %');
});
