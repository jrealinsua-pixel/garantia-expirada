import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Canvas } from '../src/art/canvas.ts';
import { decodePng, encodePng } from '../tools/sprites/png.ts';
import { makeAspirador, makeBombilla, makeHero, makeMicroondas, makeNevera, miniDryer, miniStapler } from '../tools/sprites/characters.ts';
import { makeItem } from '../tools/sprites/items.ts';

function diff(a: Canvas, b: Canvas): number {
  assert.equal(a.w, b.w, 'width');
  assert.equal(a.h, b.h, 'height');
  let n = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.get(x, y).join() !== b.get(x, y).join()) n++;
  return n;
}

const cases: Array<[string, () => Canvas]> = [
  ['tostadora', () => makeHero(true)],
  ['aspirador', makeAspirador],
  ['microondas', makeMicroondas],
  ['bombilla', makeBombilla],
  ['nevera-suprema', makeNevera],
  ['arma-secador', miniDryer],
  ['arma-grapadora', miniStapler],
  ['objeto-pila', () => makeItem('pila')],
  ['objeto-manual', () => makeItem('manual')],
  ['objeto-ticket', () => makeItem('ticket')],
  ['objeto-garantia', () => makeItem('garantia')],
  ['objeto-caja', () => makeItem('caja')],
];

for (const [name, make] of cases) {
  test(`el sprite ${name} coincide píxel a píxel con art/referencia`, () => {
    const ref = decodePng(readFileSync(`art/referencia/${name}.png`));
    assert.equal(diff(make(), ref), 0);
  });
}

test('codificar y decodificar PNG no cambia los píxeles', () => {
  const a = makeHero(true);
  assert.equal(diff(decodePng(encodePng(a)), a), 0);
});

test('public/assets está al día con «npm run sprites»', async () => {
  const { allSheets } = await import('../tools/sprites/build.ts');
  for (const [key, s] of Object.entries(allSheets())) {
    const file = `public/assets/${key}.png`;
    const onDisk = decodePng(readFileSync(file));
    assert.equal(diff(onDisk, s.canvas), 0, `${file} está desactualizado: ejecuta npm run sprites`);
  }
});

test('cada hoja de sprites se divide en fotogramas enteros', async () => {
  const { allSheets } = await import('../tools/sprites/build.ts');
  for (const [key, s] of Object.entries(allSheets())) {
    assert.equal(s.canvas.w % s.frameW, 0, `${key}: ancho ${s.canvas.w} no es múltiplo de ${s.frameW}`);
    assert.equal(s.canvas.h, s.frameH, `${key}: alto ${s.canvas.h} ≠ ${s.frameH}`);
  }
});

test('las versiones de la planta 2 (<id>-2) miden lo mismo que las del almacén, fotograma a fotograma', async () => {
  const { allSheets } = await import('../tools/sprites/build.ts');
  const sheets = allSheets();
  const upstairs = Object.keys(sheets).filter((k) => k.endsWith('-2'));
  for (const want of ['caja-2', 'barril-2', 'carrito-2', 'persiana-n-2', 'persiana-s-2', 'persiana-v-2']) assert.ok(upstairs.includes(want), `falta ${want}`);
  for (const k of upstairs) {
    const base = sheets[k.slice(0, -2)];
    assert.ok(base, `${k} sin su versión del almacén`);
    const s = sheets[k]!;
    // Same footprint: the collision boxes in src/data/props.ts are shared by both floors.
    assert.deepEqual([s.canvas.w, s.canvas.h, s.frameW, s.frameH], [base.canvas.w, base.canvas.h, base.frameW, base.frameH], k);
  }
});
