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
