// M14c (a2): the new painting tools (src/art/pintor.ts) and the legibility checker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, luminance } from '../src/art/paleta.ts';
import { Paint, legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { decodePng, encodePng } from '../tools/sprites/png.ts';
import { aaDemo, dentDemo, heartDemo, toaster, toolsDemo, vacuum } from '../tools/sprites/prueba-a1.ts';

const FLOOR = MATERIALS.suelo[3]!;
const ref = (name: string): Canvas => decodePng(readFileSync(new URL(`../art/referencia/${name}.png`, import.meta.url)));

test('pintor: el sombreador de alturas ilumina lo que mira arriba a la izquierda', () => {
  const p = new Paint(20, 20);
  // A dome: height falls from the centre.
  p.heightShade(0, 0, 20, 20, (x, y) => {
    const d = Math.hypot(x - 10, y - 10);
    return d > 8 ? null : Math.sqrt(64 - d * d);
  }, 'acero', { dither: 0 });
  const tl = luminance(p.cv.get(6, 6));
  const br = luminance(p.cv.get(14, 14));
  assert.ok(tl > br, 'la ladera de arriba a la izquierda es más clara');
  assert.equal(p.cv.get(1, 1)[3], 0, 'fuera del mapa no pinta');
  // A flat plate is a single tone (no dither on flat faces when it lands on a tone).
  const q = new Paint(10, 10);
  q.heightShade(0, 0, 10, 10, () => 0, 'suelo', { dither: 0.3, bias: -0.17 });
  const tones = new Set<string>();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) tones.add(q.cv.get(x, y).join());
  assert.equal(tones.size, 1, 'una plancha plana es un solo tono');
});

test('pintor: una abolladura se ve hundida y un remache saliente', () => {
  const d = dentDemo();
  // Dent centred at (13, 12): its upper-left slope faces away from the light → darker than its
  // lower-right slope. The rivet at (4, 4) is the other way round.
  assert.ok(luminance(d.get(11, 11)) < luminance(d.get(15, 14)), 'abolladura');
  assert.ok(luminance(d.get(3, 3)) > luminance(d.get(5, 5)), 'remache');
});

test('pintor: el antialias solo añade píxeles en el borde, más oscuros que su vecino', () => {
  const a = new Paint(14, 14);
  a.ellipsoid(7, 7, 5.6, 5.6, 'azul', { dither: 0 });
  const b = new Paint(14, 14);
  b.ellipsoid(7, 7, 5.6, 5.6, 'azul', { dither: 0, aa: 0.35 });
  let added = 0;
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 14; x++) {
      const was = a.filled(x, y);
      const is = b.filled(x, y);
      assert.ok(!(was && !is), 'el antialias no quita píxeles');
      if (was) assert.deepEqual(b.cv.get(x, y), a.cv.get(x, y), 'ni cambia los de dentro');
      if (!was && is) added++;
    }
  }
  assert.ok(added > 0 && added < 20, `píxeles de antialias: ${added}`);
});

test('pintor: el comprobador de legibilidad aprueba los sprites nuevos y suspende una mancha', () => {
  for (const [name, cv] of [['tostadora', toaster()], ['aspirador', vacuum()], ['corazón', heartDemo()]] as const) {
    const l = legibility(cv, FLOOR);
    assert.ok(l.edgeContrast >= 1.6, `${name}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
    assert.ok(l.darkEdge >= 0.8, `${name}: borde oscuro ${l.darkEdge.toFixed(2)}`);
    assert.ok(l.melts <= 0.33, `${name}: se funde con el suelo el ${(l.melts * 100).toFixed(0)} %`);
    assert.ok(l.colours >= 8 && l.colours <= 70, `${name}: ${l.colours} colores`);
  }
  // A blob of floor colour with no outline: the checker must catch it.
  const blob = new Paint(16, 16);
  blob.ellipsoid(8, 8, 6, 6, 'suelo', { dither: 0 });
  const l = legibility(blob.cv, FLOOR);
  assert.ok(l.edgeContrast < 1.6 || l.melts > 0.33, 'una mancha del color del suelo no es legible');
});

test('pintor: la silueta del aspirador nuevo ya no se parece a la de la tostadora', () => {
  assert.equal(silhouetteOverlap(toaster(), toaster()), 1);
  const now = silhouetteOverlap(toaster(), vacuum());
  const before = silhouetteOverlap(ref('tostadora'), ref('aspirador'));
  assert.ok(now < 0.8, `tostadora y aspirador nuevos: ${now.toFixed(2)}`);
  assert.ok(now < before, `antes ${before.toFixed(2)}, ahora ${now.toFixed(2)}`);
});

test('pintor: las demostraciones de art/prueba/ se regeneran idénticas', () => {
  for (const [name, make] of [['corazon', heartDemo], ['herramientas', toolsDemo]] as const) {
    const want = readFileSync(new URL(`../art/prueba/${name}.png`, import.meta.url));
    assert.ok(encodePng(make()).equals(want), `${name}: node tools/sprites/prueba-a1.ts`);
  }
  assert.equal(aaDemo().w, 30);
});
