import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom, doorCells, type Room } from '../src/sim/room.ts';
import { paintRoom } from '../src/art/room.ts';
import { hx } from '../src/art/canvas.ts';

// The painter gets the doorways as wall, like the renderer does (src/render/GameScene.ts).
function paint(room: Room, seed: string) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles }, seed);
}

const floorTemplates = Object.values(ROOMS).filter((t) => t.kind);

test('arte de sala: la misma semilla pinta lo mismo y otra semilla pinta otra cosa', () => {
  const room = buildRoom(ROOMS['carga-descarga']!);
  const a = paint(room, 'x').canvas;
  const b = paint(room, 'x').canvas;
  const c = paint(room, 'y').canvas;
  assert.deepEqual(a.p, b.p);
  assert.notDeepEqual(a.p, c.p);
});

test('arte de sala: cada tipo de sala tiene su cartel y su decoración propia', () => {
  const own: Record<string, string[]> = {
    start: ['cartel:ENTRADA DE PERSONAL', 'felpudo'],
    shop: ['cartel:OFERTAS', 'alfombra', 'etiquetas'],
    treasure: ['cartel:OBJETOS PERDIDOS'],
    secret: ['cartel:ARCHIVO MUERTO', 'telarañas', 'polvo'],
    boss: ['cartel:DIRECCIÓN', 'escarcha'],
  };
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c']) {
      const f = paint(buildRoom(t), seed).features;
      for (const want of own[t.kind!] ?? []) assert.ok(f.includes(want), `${t.id} (${seed}): falta ${want} en ${f.join(', ')}`);
      if (t.kind === 'combat') assert.ok(f.some((x) => x.startsWith('cartel:')), `${t.id}: sin cartel`);
      assert.ok(f.some((x) => x.startsWith('letrero:')), `${t.id} (${seed}): sin letras pintadas en el suelo`);
      assert.ok(f.includes('basura') && f.includes('pared'), `${t.id}: sin basura o sin nada en las paredes`);
    }
  }
});

test('arte de sala: el suelo tiene variaciones (grietas, desgaste, parches)', () => {
  for (const t of floorTemplates.filter((x) => x.kind === 'combat')) {
    const kinds = new Set<string>();
    for (const seed of ['1', '2', '3', '4']) for (const x of paint(buildRoom(t), seed).features) if (x.startsWith('casilla:')) kinds.add(x);
    for (const v of ['casilla:cracked', 'casilla:worn', 'casilla:patched']) assert.ok(kinds.has(v), `${t.id}: nunca sale ${v}`);
  }
});

test('arte de sala: la decoración no tapa los huecos de las puertas', () => {
  const hole = hx('#0b0a12').join();
  for (const t of floorTemplates) {
    const room = buildRoom(t);
    const art = paint(room, 'puertas');
    for (const d of art.doors) {
      for (let y = d.y; y < d.y + d.h; y++) {
        for (let x = d.x; x < d.x + d.w; x++) assert.equal(art.canvas.get(x, y).join(), hole, `${t.id}: puerta ${d.dir} pintada en (${x}, ${y})`);
      }
    }
  }
});

// Floor 2 (Informática): its own tile set and colour (src/art/informatica.ts).
function paint2(room: Room, seed: string) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles, level: 2 }, seed);
}

/** Average colour of the walkable floor (rows 2.. inside the walls). */
function floorMean(art: ReturnType<typeof paint>, room: Room): [number, number, number] {
  const sum = [0, 0, 0];
  let n = 0;
  for (let r = 2; r < room.rows - 1; r++) {
    for (let c = 1; c < room.cols - 1; c++) {
      if (room.tiles[r * room.cols + c] === 1) continue;
      for (let y = r * 24; y < r * 24 + 24; y += 3) {
        for (let x = c * 24; x < c * 24 + 24; x += 3) {
          const p = art.canvas.get(x, y);
          sum[0]! += p[0];
          sum[1]! += p[1];
          sum[2]! += p[2];
          n++;
        }
      }
    }
  }
  return [sum[0]! / n, sum[1]! / n, sum[2]! / n];
}

test('arte de sala, planta 2: la planta 1 no cambia y la 2 tiene su color dominante (verde pantalla)', () => {
  const room = buildRoom(ROOMS['carga-descarga']!);
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  assert.deepEqual(paintRoom({ ...room, tiles, level: 1 }, 'x').canvas.p, paint(room, 'x').canvas.p);
  for (const t of floorTemplates) {
    const one = floorMean(paint(buildRoom(t), 'c'), buildRoom(t));
    const two = floorMean(paint2(buildRoom(t), 'c'), buildRoom(t));
    assert.ok(one[2] > one[1] + 8, `${t.id}: la planta 1 debería ser azulada (${one.map(Math.round)})`);
    assert.ok(two[1] >= two[2] && two[1] > two[0] + 8 && two[1] - two[2] > one[1] - one[2] + 15, `${t.id}: la planta 2 debería ser verdosa (${two.map(Math.round)})`);
    // Same darkness, so the bullets read the same on both floors.
    const lum = (c: number[]): number => 0.3 * c[0]! + 0.59 * c[1]! + 0.11 * c[2]!;
    assert.ok(Math.abs(lum(one) - lum(two)) < 14, `${t.id}: brillo ${lum(one).toFixed(1)} frente a ${lum(two).toFixed(1)}`);
  }
});

test('arte de sala, planta 2: cada tipo de sala tiene su cartel, su decoración y sus casillas propias', () => {
  const own: Record<string, string[]> = {
    start: ['cartel:PLANTA 2 · INFORMÁTICA', 'felpudo'],
    shop: ['cartel:OFERTAS FLASH', 'alfombra', 'etiquetas'],
    treasure: ['cartel:COPIAS DE SEGURIDAD'],
    secret: ['cartel:PAPELERA DE RECICLAJE', 'telarañas', 'polvo'],
    boss: ['cartel:SALA DE SERVIDORES', 'interferencias'],
  };
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c']) {
      const f = paint2(buildRoom(t), seed).features;
      for (const want of own[t.kind!] ?? []) assert.ok(f.includes(want), `${t.id} (${seed}): falta ${want} en ${f.join(', ')}`);
      if (t.kind === 'combat') assert.ok(f.some((x) => x.startsWith('cartel:')), `${t.id}: sin cartel`);
      assert.ok(f.some((x) => x.startsWith('letrero:')), `${t.id} (${seed}): sin letras pintadas en el suelo`);
      assert.ok(f.includes('basura') && f.includes('pared'), `${t.id}: sin basura o sin nada en las paredes`);
      // Nothing of the warehouse's own: no forklift tracks, no loading bay, no queue display, no frost.
      const warehouse = ['rodadas', 'muelle', 'turno', 'escarcha', 'chapa', 'casilla:cracked', 'casilla:grate', 'casilla:patched'];
      for (const no of warehouse) assert.ok(!f.includes(no), `${t.id} (${seed}): ${no} en la planta 2`);
    }
  }
  for (const t of floorTemplates.filter((x) => x.kind === 'combat')) {
    const kinds = new Set<string>();
    for (const seed of ['1', '2', '3', '4']) for (const x of paint2(buildRoom(t), seed).features) if (x.startsWith('casilla:')) kinds.add(x);
    for (const v of ['casilla:lifted', 'casilla:worn', 'casilla:grommet']) assert.ok(kinds.has(v), `${t.id}: nunca sale ${v}`);
  }
});

test('arte de sala, planta 2: la decoración no tapa los huecos de las puertas', () => {
  const hole = hx('#0b0a12').join();
  for (const t of floorTemplates) {
    const art = paint2(buildRoom(t), 'puertas');
    for (const d of art.doors) {
      for (let y = d.y; y < d.y + d.h; y++) {
        for (let x = d.x; x < d.x + d.w; x++) assert.equal(art.canvas.get(x, y).join(), hole, `${t.id}: puerta ${d.dir} pintada en (${x}, ${y})`);
      }
    }
  }
});
