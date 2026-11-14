import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, SLOT_ENEMIES_1, templatesOf } from '../src/data/rooms.ts';
import { paintRoom } from '../src/art/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { buildRoom, fillTemplate } from '../src/sim/room.ts';

// M14b (h11c): rooms with more shape (an L, a cross, the corners cut off, pillars, islands).
const SHAPED = [
  'almacen-ele', 'nave-pilares', 'cpd-cruz', 'islas-demostracion', 'casa-munecas', 'pista-bicis',
  'despacho-esquina', 'columnas-oficina', 'ventanilla-fondo', 'cruce-pasillos', 'taller-pilares', 'taller-ele',
];

test('salas con forma: dos nuevas de combate en cada planta, de la 1 a la 6', () => {
  for (let level = 1; level <= 6; level++) {
    const ids = templatesOf('combat', level).map((t) => t.id);
    assert.equal(SHAPED.filter((id) => ids.includes(id)).length, 2, `planta ${level}`);
  }
});

test('salas con forma: lo que queda fuera de la forma (« ») es pared, y solo eso va a outside', () => {
  const cut = SHAPED.filter((id) => ROOMS[id]!.rows.join('').includes(' '));
  assert.ok(cut.length >= 6, `${cut.length} salas recortadas`);
  for (const id of cut) {
    const t = ROOMS[id]!;
    const room = buildRoom(t);
    assert.ok(room.outside, id);
    t.rows.forEach((line, r) => [...line].forEach((ch, c) => {
      const i = r * room.cols + c;
      if (ch === ' ') assert.ok(room.tiles[i] === 1 && room.outside![i] === 1, `${id} ${c},${r}`);
      else assert.ok(room.outside![i] !== 1, `${id} ${c},${r}`);
    }));
  }
  assert.equal(buildRoom(ROOMS['carga-descarga']!).outside, undefined, 'una sala rectangular no lleva outside');
});

test('salas con forma: el recorte se pinta como pared de fuera (sin estanterías) y las de siempre no cambian', () => {
  const t = fillTemplate(ROOMS['almacen-ele']!, new Rng('forma'), { depth: 3, pool: SLOT_ENEMIES_1 });
  const room = buildRoom(t);
  const art = paintRoom({ ...room, level: 1 }, 'forma');
  assert.ok(art.features.includes('recorte'));
  // The top of a cut-out corner is the plain dark wall: one colour, no shelving in it.
  const at = (x: number, y: number): string => art.canvas.get(x, y).join(',');
  const top = at(15 * 24 + 5, 24 + 5);
  for (const [x, y] of [[15 * 24 + 12, 24 + 12], [17 * 24 + 3, 2 * 24 + 6], [13 * 24 + 20, 2 * 24 + 20]] as const) {
    const [r, g, b] = art.canvas.get(x, y);
    const [r0, g0, b0] = art.canvas.get(15 * 24 + 5, 24 + 5);
    assert.ok(Math.abs(r - r0) + Math.abs(g - g0) + Math.abs(b - b0) < 40, `${x},${y}: ${at(x, y)} frente a ${top}`);
  }
  // Without cut-outs, a room paints exactly as before.
  const plain = buildRoom(ROOMS['carga-descarga']!);
  assert.ok(!paintRoom({ ...plain, level: 1 }, 'x').features.includes('recorte'));
  // The lamps keep to the stretch of back wall still in view.
  for (const id of ['cpd-cruz', 'cruce-pasillos', 'taller-ele']) {
    const r = buildRoom(ROOMS[id]!);
    const a = paintRoom({ ...r, level: ROOMS[id]!.level ?? 1 }, id);
    assert.ok(a.lamps.length >= 1, id);
    for (const l of a.lamps) assert.ok(!r.outside![2 * r.cols + Math.floor(l.x / 24)], `${id}: lámpara sobre el recorte en x=${l.x}`);
  }
});
