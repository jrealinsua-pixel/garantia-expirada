// M14c (a3): sprites made outside (art/entrada/) brought into the game's palette and grid.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Canvas, type RGBA } from '../src/art/canvas.ts';
import { INK, MATERIALS, SHINE } from '../src/art/paleta.ts';
import { encodePng } from '../tools/sprites/png.ts';
import { detectScale, processIncoming, readIncoming, validate, withCredits, type IncomingMeta } from '../tools/sprites/entrada.ts';

const PALETTE = new Set([INK, SHINE, ...Object.values(MATERIALS).flat()].map((c) => c.slice(0, 3).join()));

/**
 * What an image AI hands over: a 12 × 10 sprite blown up 6× with an offset of 2 px, colours a
 * bit off the palette, a little noise and a soft half-transparent edge.
 */
function aiPicture(frames = 1): Canvas {
  const k = 6;
  const art = (fx: number, x: number, y: number): RGBA | null => {
    if (y < 1 || y > 9 || x < 1 || x > 10) return null;
    if (y === 9) return [24, 18, 36, 255]; // near ink
    if (x > 7 && y > 3 && y < 6) return [230, 70, 60, 255]; // near red
    return x + fx < 5 ? [190, 196, 210, 255] : [120, 130, 160, 255]; // steel tones
  };
  const W = 12 * frames;
  const out = new Canvas(W * k + 5, 10 * k + 4);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const sx = Math.floor((x - 2) / k);
      const sy = Math.floor((y - 2) / k);
      if (x < 2 || y < 2 || sx >= W || sy >= 10) continue;
      const c = art(Math.floor(sx / 12), sx % 12, sy);
      if (!c) continue;
      const n = ((x * 7 + y * 13) % 5) - 2; // noise
      const edge = (x - 2) % k === 0 && art(Math.floor(sx / 12), (sx % 12) - 1, sy) === null;
      out.put(x, y, [c[0] + n, c[1] + n, c[2] + n, edge ? 90 : 255]);
    }
  }
  return out;
}

const META: IncomingMeta = { id: 'prueba-ia', que: 'Prueba', autor: 'Test', licencia: 'CC0', origen: 'tests/entrada.test.ts' };

test('entrada: encuentra a qué escala viene el dibujo y desde dónde empieza la rejilla', () => {
  assert.deepEqual(detectScale(aiPicture()), { k: 6, ox: 2, oy: 2 });
  // A sprite already at real size stays at 1.
  const real = new Canvas(16, 16);
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) real.put(x, y, (x * 3 + y * 5) % 4 ? MATERIALS.azul[2]! : MATERIALS.rojo[1]!);
  assert.equal(detectScale(real).k, 1);
});

test('entrada: lo reduce a píxeles de verdad, en la paleta del juego y sin bordes a medias', () => {
  const s = processIncoming(aiPicture(), META);
  // The art spans x 1–10 and y 1–9: 10 × 9 once cropped.
  assert.equal(s.frameW, 10);
  assert.equal(s.frameH, 9);
  for (let y = 0; y < s.canvas.h; y++) {
    for (let x = 0; x < s.canvas.w; x++) {
      const c = s.canvas.get(x, y);
      assert.ok(c[3] === 0 || c[3] === 255, 'sin transparencias a medias');
      if (c[3]) assert.ok(PALETTE.has(c.slice(0, 3).join()), `color fuera de paleta en ${x},${y}: ${c.join()}`);
    }
  }
  // The red stripe is red, the bottom row is ink.
  assert.deepEqual(s.canvas.get(8, 3), MATERIALS.rojo[2]);
  assert.deepEqual(s.canvas.get(4, 8), INK);
});

test('entrada: lo coloca de pie en su fotograma, con contorno si se pide, y reparte las tiras', () => {
  const s = processIncoming(aiPicture(), { ...META, ancho: 16, alto: 14, contorno: true });
  assert.equal(s.frameW, 16);
  assert.equal(s.frameH, 14);
  // Standing on the bottom edge (the outline is the last row) and centred.
  let bottom = -1;
  for (let y = 0; y < 14; y++) for (let x = 0; x < 16; x++) if (s.canvas.get(x, y)[3]) bottom = y;
  assert.equal(bottom, 13);
  // 10 px of sprite plus the outline on each side, centred in 16: the outline at x 2 and 13.
  assert.equal(s.canvas.get(2, 8)[3], 255, 'el contorno de la izquierda');
  assert.equal(s.canvas.get(1, 8)[3], 0);
  assert.equal(s.canvas.get(13, 8)[3], 255, 'el contorno de la derecha');
  assert.deepEqual(s.canvas.get(13, 8), INK, 'por el lado de la sombra, tinta');
  assert.throws(() => processIncoming(aiPicture(), { ...META, ancho: 8, alto: 8 }), /no cabe/);
  const strip = processIncoming(aiPicture(3), { ...META, fotogramas: 3 });
  assert.equal(strip.canvas.w, strip.frameW * 3);
});

test('entrada: sin licencia válida o con el nombre de una hoja del juego no entra', () => {
  assert.deepEqual(validate(META), []);
  assert.ok(validate({ ...META, licencia: 'no-se' as never }).some((e) => e.includes('licencia')));
  assert.ok(validate({ ...META, origen: '' }).some((e) => e.includes('origen')));
  assert.ok(validate({ ...META, id: 'Mala Id' }).some((e) => e.includes('id')));
  assert.ok(validate({ ...META, id: 'tostadora' }, new Set(['tostadora'])).some((e) => e.includes('reemplaza')));
  assert.deepEqual(validate({ ...META, id: 'tostadora', reemplaza: true }, new Set(['tostadora'])), []);
});

test('entrada: lee la carpeta, rechaza lo que no tiene JSON y apunta los créditos', () => {
  const dir = mkdtempSync(join(tmpdir(), 'entrada-'));
  writeFileSync(join(dir, 'bueno.png'), encodePng(aiPicture()));
  writeFileSync(join(dir, 'bueno.json'), JSON.stringify({ ...META, id: 'bueno' }));
  const items = readIncoming(dir);
  assert.equal(items.length, 1);
  assert.equal(items[0]!.meta.id, 'bueno');
  writeFileSync(join(dir, 'huerfano.png'), encodePng(aiPicture()));
  assert.throws(() => readIncoming(dir), /huerfano\.png: falta huerfano\.json/);
  // Credits: the section is replaced, not added twice; the rest of the file stays.
  const once = withCredits('# Créditos\n\nAlgo.\n', items);
  const twice = withCredits(once, items);
  assert.equal(once, twice);
  assert.ok(once.startsWith('# Créditos\n\nAlgo.'));
  assert.ok(once.includes('| Prueba (`bueno`) | Test | CC0 | tests/entrada.test.ts |'));
});

test('entrada: la carpeta del repositorio está en orden y CREDITOS.md, al día', () => {
  const items = readIncoming();
  const credits = readFileSync(new URL('../CREDITOS.md', import.meta.url), 'utf8');
  assert.equal(withCredits(credits, items), credits, 'node tools/sprites/entrada.ts');
});
