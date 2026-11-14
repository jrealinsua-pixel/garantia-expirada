// M14c (a8a): floor 1 (the warehouse) in the new style: plates, walls, tape, corners, the walls'
// shadow and the lamps' light (src/art/almacen-nuevo.ts, used by src/art/room.ts for level 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Canvas } from '../src/art/canvas.ts';
import { MATERIALS, luminance } from '../src/art/paleta.ts';
import { plate, paintPlate, tape, TAPE_YELLOW } from '../src/art/almacen-nuevo.ts';
import { paintRoom } from '../src/art/room.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { Rng } from '../src/sim/rng.ts';
import { buildRoom, doorCells } from '../src/sim/room.ts';

const key = (c: readonly number[]): string => c.join(',');
const floorTones = new Set(MATERIALS.suelo.map(key));
const wallTones = new Set(MATERIALS.muro.map(key));

function painted(id: string, seed = 'a8a') {
  const room = buildRoom(ROOMS[id]!);
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return { room, art: paintRoom({ ...room, tiles, level: 1 }, seed) };
}

test('estilo a8a: una chapa lisa es de la rampa del suelo, con la junta oscura y el bisel claro arriba y a la izquierda', () => {
  for (const alt of [false, true]) {
    const S = new Canvas(24, 24);
    plate(S, new Rng('chapa'), 0, 0, alt);
    const colours = new Set<string>();
    for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) colours.add(key(S.get(x, y)));
    // Flat face, bevel, rivets and maybe a scratch: few colours, no noise.
    assert.ok(colours.size <= 9, `${colours.size} colores en una chapa lisa`);
    const face = luminance(S.get(12, 12));
    assert.equal(key(S.get(10, 0)), key(MATERIALS.suelo[6]!), 'la junta de arriba es el tono más hondo');
    assert.equal(key(S.get(0, 10)), key(MATERIALS.suelo[6]!), 'la junta de la izquierda es el tono más hondo');
    assert.ok(luminance(S.get(10, 1)) > face && luminance(S.get(1, 10)) > face, 'el bisel de arriba y el de la izquierda tienen luz');
    assert.ok(luminance(S.get(10, 23)) < face && luminance(S.get(23, 10)) < face, 'el de abajo y el de la derecha, sombra');
    for (const [x, y] of [[3, 3], [19, 3], [3, 19], [19, 19]] as const) assert.ok(floorTones.has(key(S.get(x, y))) && luminance(S.get(x, y)) > face, `remache en ${x},${y}`);
  }
});

test('estilo a8a: las variantes cambian la chapa y no la sacan de su casilla', () => {
  for (const v of ['cracked', 'worn', 'patched', 'grate', 'checker'] as const) {
    const S = new Canvas(72, 72);
    const plain = new Canvas(72, 72);
    plate(S, new Rng('v'), 24, 24, false);
    plate(plain, new Rng('v'), 24, 24, false);
    paintPlate(S, new Rng('v' + v), 24, 24, false, v);
    let changed = 0;
    for (let y = 0; y < 72; y++) {
      for (let x = 0; x < 72; x++) {
        const inside = x >= 24 && x < 48 && y >= 24 && y < 48;
        if (!inside) assert.equal(S.get(x, y)[3], 0, `${v}: pinta fuera de su casilla en ${x},${y}`);
        else if (key(S.get(x, y)) !== key(plain.get(x, y))) changed++;
      }
    }
    assert.ok(changed >= 12, `${v}: apenas cambia (${changed} píxeles)`);
  }
});

test('estilo a8a: el suelo del almacén sigue igual de oscuro y sin ruido de píxeles', () => {
  for (const id of ['pasillo-devoluciones', 'carga-descarga', 'sala-pruebas', 'almacen-ele']) {
    const { room, art } = painted(id);
    let sum = 0;
    let n = 0;
    let lonely = 0;
    for (let r = 3; r < room.rows - 1; r++) {
      for (let c = 1; c < room.cols - 1; c++) {
        if (room.tiles[r * room.cols + c] === 1 || room.outside?.[r * room.cols + c]) continue;
        for (let y = r * 24 + 3; y < r * 24 + 21; y++) {
          for (let x = c * 24 + 3; x < c * 24 + 21; x++) {
            sum += luminance(art.canvas.get(x, y));
            n++;
          }
        }
      }
    }
    const mean = sum / n;
    assert.ok(mean > 0.035 && mean < 0.075, `${id}: luminancia media del suelo ${mean.toFixed(3)}`);
    // The old ±11 noise put a pixel unlike all four neighbours on ~8 % of the floor (on top of the
    // rivets, the litter and the decoration, which are most of what is left now).
    for (let y = 80; y < 200; y++) {
      for (let x = 40; x < 300; x++) {
        const c = key(art.canvas.get(x, y));
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => key(art.canvas.get(x + dx!, y + dy!)) !== c)) lonely++;
      }
    }
    assert.ok(lonely / (120 * 260) < 0.075, `${id}: ${((lonely / (120 * 260)) * 100).toFixed(1)} % de píxeles sueltos`);
  }
});

test('estilo a8a: las paredes son bloques de hormigón, la cinta es apagada y las esquinas tienen cantonera', () => {
  const { room, art } = painted('pasillo-devoluciones');
  assert.ok(art.features.includes('esquinas'));
  // The side walls' tops, between the conduit and the tape: concrete (the wall boxes aside).
  let block = 0;
  let total = 0;
  for (let y = 3 * 24; y < (room.rows - 1) * 24; y++) {
    if (art.doors.some((d) => y >= d.y - 8 && y < d.y + d.h + 8)) continue;
    for (const x of [12, 13, 14, 15, 16, room.cols * 24 - 12, room.cols * 24 - 14]) {
      total++;
      if (wallTones.has(key(art.canvas.get(x, y)))) block++;
    }
  }
  assert.ok(block / total > 0.75, `solo el ${Math.round((block / total) * 100)} % del muro es hormigón`);
  // Walls darker than the floor: the room reads as a pit.
  assert.ok(luminance(MATERIALS.muro[4]!) < luminance(MATERIALS.suelo[3]!));
  // The tape is worn: well under the bullets' yellow, and it has chips.
  assert.ok(luminance(TAPE_YELLOW) < luminance(MATERIALS.amarillo[2]!) * 0.6);
  const S = new Canvas(5, 60);
  tape(S, 0, 0, 5, 60);
  let chips = 0;
  for (let y = 0; y < 60; y++) for (let x = 0; x < 5; x++) if (key(S.get(x, y)) === key(MATERIALS.muro[4]!)) chips++;
  assert.ok(chips > 3 && chips < 40, `${chips} desconchones`);
  // Steel corner guards where the tape turns (bottom corners of the room).
  const H = room.rows * 24;
  const steel = new Set(MATERIALS.acero.map(key));
  for (const x of [24 - 3, room.cols * 24 - 22]) assert.ok(steel.has(key(art.canvas.get(x, H - 24 + 2))), `cantonera en ${x}`);
});

test('estilo a8a: la sombra de las paredes va por escalones violeta y la luz de las lámparas no quema el suelo', () => {
  const { room, art } = painted('carga-descarga', 's');
  // Along the back wall: darker right under it than a tile further down, never black.
  const row = (y: number): number => {
    let s = 0;
    for (let x = 3 * 24; x < (room.cols - 3) * 24; x++) s += luminance(art.canvas.get(x, y));
    return s / ((room.cols - 6) * 24);
  };
  assert.ok(row(48 + 1) < row(48 + 26) * 0.8, `junto a la pared ${row(49).toFixed(3)}, más abajo ${row(74).toFixed(3)}`);
  for (let x = 3 * 24; x < (room.cols - 3) * 24; x++) {
    const c = art.canvas.get(x, 49);
    assert.ok(c[2] > c[0] && c[0] + c[1] + c[2] > 30, `sombra negra o gris en ${x}: ${key(c)}`);
  }
  // The lamps: brighter under them, but still dark enough for the bullets.
  for (const l of art.lamps) {
    let s = 0;
    for (let y = -6; y < 6; y++) for (let x = -6; x < 6; x++) s += luminance(art.canvas.get(Math.round(l.x) + x, Math.round(l.y) + y));
    assert.ok(s / 144 < 0.09, `luz demasiado fuerte: ${(s / 144).toFixed(3)}`);
  }
});
