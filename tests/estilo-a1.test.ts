// M14c (a1): the new style guide's rules, checked on its palette and its three test sprites.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Canvas } from '../src/art/canvas.ts';
import { hx, type RGBA } from '../src/art/canvas.ts';
import { INK, MATERIALS, contrast, hueSat, luminance, type Ramp6 } from '../src/art/paleta.ts';
import { decodePng, encodePng } from '../tools/sprites/png.ts';
import { floorTile, toaster, vacuum } from '../tools/sprites/prueba-a1.ts';

const OLD_K = hx('#0e0c16');
const same = (a: RGBA, b: RGBA): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

/** Height of the opaque part of a sprite, ignoring see-through smoke and shadow. */
function bounds(cv: Canvas): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = cv.w;
  let y0 = cv.h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      if (cv.get(x, y)[3] < 255) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  return { x0, y0, x1, y1 };
}

test('estilo M14c: cada material tiene 4–7 tonos que van de claro a oscuro', () => {
  for (const [name, R] of Object.entries(MATERIALS) as Array<[string, Ramp6]>) {
    assert.ok(R.length >= 4 && R.length <= 7, `${name}: ${R.length} tonos`);
    for (let i = 1; i < R.length; i++) assert.ok(luminance(R[i]!) < luminance(R[i - 1]!), `${name}: el tono ${i} no es más oscuro que el ${i - 1}`);
  }
  // The main materials (casings, plastics, floor) have the full 5–7.
  for (const name of ['acero', 'tostada', 'rojo', 'azul', 'goma', 'rosa', 'amarillo', 'suelo'] as const) {
    assert.ok(MATERIALS[name].length >= 5, `${name} necesita 5–7 tonos`);
  }
});

test('estilo M14c: las sombras son de color, nunca negras ni grises', () => {
  for (const [name, R] of Object.entries(MATERIALS) as Array<[string, Ramp6]>) {
    const deep = R[R.length - 1]!;
    assert.ok(!same(deep, OLD_K) && !same(deep, INK), `${name}: la sombra más honda es el negro`);
    assert.ok(hueSat(deep).s > 0.2, `${name}: la sombra más honda es gris (saturación ${hueSat(deep).s.toFixed(2)})`);
  }
  // Ink itself is a dark violet, not neutral black.
  assert.ok(hueSat(INK).h > 240 && hueSat(INK).h < 300, 'la tinta es violeta');
});

test('estilo M14c: las rampas giran el tono (la sombra se va hacia el azul o el violeta)', () => {
  // Hue distance towards 250° (blue-violet): the shadow must be closer to it than the light.
  const toCool = (c: RGBA): number => {
    const d = Math.abs(hueSat(c).h - 250) % 360;
    return Math.min(d, 360 - d);
  };
  for (const name of ['acero', 'tostada', 'rojo', 'azul', 'rosa', 'amarillo', 'goma'] as const) {
    const R = MATERIALS[name];
    assert.ok(toCool(R[R.length - 1]!) < toCool(R[0]!), `${name}: la sombra no se enfría`);
  }
});

test('estilo M14c: los tres sprites de prueba son los de art/prueba/ (se regeneran idénticos)', () => {
  const cases: Array<[string, () => Canvas]> = [['tostadora', toaster], ['aspirador', vacuum], ['suelo', floorTile]];
  for (const [name, make] of cases) {
    const want = readFileSync(new URL(`../art/prueba/${name}.png`, import.meta.url));
    assert.ok(encodePng(make()).equals(want), `${name}: no coincide con art/prueba/${name}.png (node tools/sprites/prueba-a1.ts)`);
    assert.equal(decodePng(want).w, make().w);
  }
});

test('estilo M14c: personajes más grandes, con el cuerpo de 24–32 px de ancho', () => {
  const t = toaster();
  const b = bounds(t);
  // The toaster's casing: the widest opaque row in the body band (rows 16–30).
  let widest = 0;
  for (let y = b.y0 + 16; y < b.y0 + 30; y++) {
    let n = 0;
    for (let x = 0; x < 36; x++) if (t.get(x, y)[3] === 255) n++;
    widest = Math.max(widest, n);
  }
  assert.ok(widest >= 24 && widest <= 32, `ancho de la carcasa: ${widest}`);
  const old = decodePng(readFileSync(new URL('../art/referencia/tostadora.png', import.meta.url)));
  assert.ok(b.y1 - b.y0 > bounds(old).y1 - bounds(old).y0, 'la tostadora nueva es más alta que la vieja');
  const v = bounds(vacuum());
  assert.ok(v.x1 - v.x0 + 1 >= 32 && v.y1 - v.y0 + 1 <= 42, 'el aspirador cabe en 42 × 42');
});

test('estilo M14c: contorno selectivo (por el lado de la luz no es tinta, por el de la sombra sí)', () => {
  for (const [name, cv] of [['tostadora', toaster()], ['aspirador', vacuum()]] as const) {
    let litInk = 0;
    let litOther = 0;
    let shadeInk = 0;
    let shadeAll = 0;
    for (let y = 1; y < cv.h - 1; y++) {
      for (let x = 1; x < cv.w - 1; x++) {
        const c = cv.get(x, y);
        if (c[3] !== 255) continue;
        // An outline pixel on the top edge: nothing opaque above it, the body below it.
        if (cv.get(x, y - 1)[3] < 255 && cv.get(x, y + 1)[3] === 255) {
          if (same(c, INK)) litInk++;
          else litOther++;
        }
        // On the bottom edge (only the casing, not the feet): body above, nothing below.
        if (cv.get(x, y + 1)[3] < 255 && cv.get(x, y - 1)[3] === 255 && y < cv.h - 12) {
          shadeAll++;
          if (same(c, INK)) shadeInk++;
        }
      }
    }
    assert.ok(litOther > litInk * 3, `${name}: el borde de arriba es casi todo tinta (${litInk} de ${litInk + litOther})`);
    assert.ok(shadeInk > shadeAll * 0.5, `${name}: el borde de abajo no es tinta (${shadeInk} de ${shadeAll})`);
  }
});

test('estilo M14c: la silueta se lee sobre el suelo nuevo y el suelo deja leer las balas', () => {
  const tile = floorTile();
  let lum = 0;
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) lum += luminance(tile.get(x, y));
  lum /= 24 * 24;
  // As dark as the old warehouse floor (#3a4060 ≈ 0.053), so the bullets keep their contrast.
  assert.ok(lum > 0.035 && lum < 0.075, `luminancia media del suelo: ${lum.toFixed(3)}`);
  const floorMid = MATERIALS.suelo[3]!;
  for (const bullet of ['#e0453b', '#69dbd8', '#ffb347']) assert.ok(contrast(hx(bullet), floorMid) > 2.2, `${bullet} sobre el suelo`);
  // The outline of each sprite stands out from the floor (the selective outline is still dark).
  for (const cv of [toaster(), vacuum()]) {
    const b = bounds(cv);
    const edge = cv.get(Math.round((b.x0 + b.x1) / 2), b.y1);
    assert.ok(luminance(edge) < luminance(floorMid), 'el contorno de abajo es más oscuro que el suelo');
  }
});
