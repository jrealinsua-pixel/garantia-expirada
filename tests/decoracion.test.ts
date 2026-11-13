// M14b (h11b): the floor's own junk in the corners and along the walls, and the walls' shadow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HUB, ROOMS } from '../src/data/rooms.ts';
import { buildRoom, doorCells, type Room } from '../src/sim/room.ts';
import { paintRoom } from '../src/art/room.ts';
import { junk, junkNames } from '../src/art/decor.ts';
import { Rng } from '../src/sim/rng.ts';

function paint(room: Room, seed: string, level: number) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles, level }, seed);
}

const combat = Object.values(ROOMS).filter((t) => t.kind === 'combat');
const LEVELS = [1, 2, 3, 4, 5, 6];

test('decoración: cada planta tiene sus propios trastos, distintos de los de las demás', () => {
  const seen = new Map<string, number>();
  for (const lv of LEVELS) {
    const names = junkNames(lv);
    assert.ok(names.length >= 3, `planta ${lv}: solo ${names.length} trastos`);
    assert.equal(new Set(names).size, names.length, `planta ${lv}: trastos repetidos`);
    for (const n of names) {
      const base = n.replace(/-caja$/, '');
      assert.ok(!seen.has(base) || seen.get(base) === lv, `${n} sale en la planta ${seen.get(base)} y en la ${lv}`);
      seen.set(base, lv);
    }
  }
  assert.deepEqual(junkNames(7), junkNames(6), 'de la 6 para arriba, el taller');
});

test('decoración: los trastos son bajos, no brillan y no usan los colores de las balas', () => {
  for (const lv of LEVELS) {
    const rng = new Rng(`trastos:${lv}`);
    for (let i = 0; i < 60; i++) {
      const p = junk(rng, lv).canvas;
      assert.ok(p.h <= 14, `${lv}: un trasto de ${p.h} px de alto (son de suelo)`);
      assert.ok(p.w <= 22, `${lv}: un trasto de ${p.w} px de ancho`);
      for (let y = 0; y < p.h; y++) {
        for (let x = 0; x < p.w; x++) {
          const [r, g, b, a] = p.get(x, y);
          if (a === 0) continue;
          assert.ok(Math.max(r, g, b) <= 220, `${lv}: píxel demasiado claro ${[r, g, b]}`);
          // The enemies' bullets: bright red and cyan.
          assert.ok(!(r > 170 && g < 90 && b < 90), `${lv}: rojo de bala ${[r, g, b]}`);
          assert.ok(!(g > 170 && b > 170 && r < 120), `${lv}: cian de bala ${[r, g, b]}`);
        }
      }
    }
  }
});

test('decoración: las salas de cada planta tienen sombra de pared y trastos de su planta', () => {
  for (const lv of LEVELS) {
    const own = new Set(junkNames(lv).flatMap((n) => [n, n.replace(/-caja$/, ''), `${n}-caja`]));
    let corners = 0;
    let pieces = 0;
    let rooms = 0;
    for (const t of combat) {
      for (const seed of ['a', 'b']) {
        const f = paint(buildRoom(t), seed, lv).features;
        rooms++;
        assert.ok(f.includes('sombra-paredes'), `${t.id} planta ${lv}: sin sombra de las paredes`);
        if (f.includes('rincones')) corners++;
        for (const x of f) {
          if (!x.startsWith('trasto:')) continue;
          pieces++;
          assert.ok(own.has(x.slice(7)), `${t.id} planta ${lv}: ${x} no es de esta planta`);
        }
      }
    }
    assert.ok(corners >= rooms * 0.8, `planta ${lv}: solo ${corners} de ${rooms} salas con algún rincón lleno`);
    assert.ok(pieces >= rooms * 5, `planta ${lv}: ${pieces} trastos en ${rooms} salas (menos de 5 por sala)`);
  }
});

test('decoración: nada de trastos delante de las puertas ni en el Mostrador', () => {
  // Painted twice with the same seed: same junk (its own generator).
  const room = buildRoom(combat[0]!);
  assert.deepEqual(paint(room, 'x', 3).canvas.p, paint(room, 'x', 3).canvas.p);
  const hub = paintRoom(buildRoom(HUB), 'x').features;
  assert.ok(!hub.some((f) => f.startsWith('trasto:') || f === 'rincones'), 'el Mostrador no se ensucia');
  // In front of each door (a tile all round its opening) the floor is the same with and without junk:
  // checked by painting a room whose every door is open and looking for the junk's outline there.
  for (const t of combat.slice(0, 12)) {
    const r = buildRoom(t, ['N', 'S', 'E', 'W']);
    const art = paintRoom({ ...r, level: 1 }, 'puertas');
    const T = 24;
    for (const d of r.doors) {
      const zone = { x: d.x - T, y: d.y - T, w: d.w + 2 * T, h: d.h + 2 * T };
      assert.ok(art.features.length > 0);
      // The junk is placed with the painter's `free`, which keeps a tile clear round every door;
      // a piece's outline is pure #0e0c16 dimmed: (12, 10, 18). Look for it in the zone's floor.
      for (let y = Math.max(2 * T, zone.y); y < Math.min(r.rows * T - T, zone.y + zone.h); y++) {
        for (let x = Math.max(T, zone.x); x < Math.min(r.cols * T - T, zone.x + zone.w); x++) {
          const [cr, cg, cb] = art.canvas.get(x, y);
          assert.ok(!(cr === 12 && cg === 10 && cb === 18), `${t.id}: un trasto delante de la puerta ${d.dir} en ${x},${y}`);
        }
      }
    }
  }
});
