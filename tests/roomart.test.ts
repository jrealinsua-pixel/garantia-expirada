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

// Floor 3 (Juguetería): foam mats, its own colour and decoration (src/art/jugueteria.ts).
function paint3(room: Room, seed: string) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles, level: 3 }, seed);
}

test('arte de sala, planta 3: color dominante cálido, distinto de las otras dos, y igual de oscuro', () => {
  const lum = (c: number[]): number => 0.3 * c[0]! + 0.59 * c[1]! + 0.11 * c[2]!;
  for (const t of floorTemplates) {
    const room = buildRoom(t);
    const one = floorMean(paint(room, 'c'), room);
    const two = floorMean(paint2(room, 'c'), room);
    const three = floorMean(paint3(room, 'c'), room);
    // Warm: more red than blue and than green (floor 1 is blue, floor 2 green).
    assert.ok(three[0] > three[2] + 8 && three[0] > three[1] + 4, `${t.id}: la planta 3 debería ser cálida (${three.map(Math.round)})`);
    for (const other of [one, two]) {
      const d = Math.hypot(three[0] - other[0], three[1] - other[1], three[2] - other[2]);
      assert.ok(d > 12, `${t.id}: la planta 3 se parece demasiado a otra (${three.map(Math.round)} frente a ${other.map(Math.round)})`);
    }
    assert.ok(Math.abs(lum(one) - lum(three)) < 14, `${t.id}: brillo ${lum(one).toFixed(1)} frente a ${lum(three).toFixed(1)}`);
  }
});

test('arte de sala, planta 3: las losetas de goma no repiten color con la de la izquierda ni con la de arriba', () => {
  const room = buildRoom(ROOMS['carga-descarga']!);
  const art = paint3(room, 'losetas');
  // Sample the middle of each mat away from tabs, letters and decoration: the most common colour
  // of a 6×6 patch near its top-left corner.
  const colour = (c: number, r: number): string => {
    const n = new Map<string, number>();
    for (let y = r * 24 + 2; y < r * 24 + 8; y++) for (let x = c * 24 + 2; x < c * 24 + 8; x++) {
      const p = art.canvas.get(x, y).slice(0, 3).map((v) => v >> 4).join();
      n.set(p, (n.get(p) ?? 0) + 1);
    }
    return [...n.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  };
  let same = 0;
  let pairs = 0;
  for (let r = 3; r < room.rows - 1; r++) {
    for (let c = 2; c < room.cols - 1; c++) {
      if (room.tiles[r * room.cols + c] || room.tiles[r * room.cols + c - 1]) continue;
      pairs++;
      if (colour(c, r) === colour(c - 1, r)) same++;
    }
  }
  // Decoration, light pools and missing mats blur a few; the mats themselves never repeat.
  assert.ok(same / pairs < 0.15, `${same} de ${pairs} parejas iguales`);
});

test('arte de sala, planta 3: cada tipo de sala tiene su cartel, su decoración y sus casillas propias', () => {
  const own: Record<string, string[]> = {
    start: ['cartel:PLANTA 3 · JUGUETERÍA', 'felpudo'],
    shop: ['cartel:TODO A UN TICKET', 'alfombra', 'etiquetas'],
    treasure: ['cartel:CARTAS A LOS REYES'],
    secret: ['cartel:RETIRADOS POR SEGURIDAD', 'telarañas', 'polvo'],
    boss: ['cartel:ESCAPARATE DE NOVEDADES', 'confeti'],
  };
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c']) {
      const f = paint3(buildRoom(t), seed).features;
      for (const want of own[t.kind!] ?? []) assert.ok(f.includes(want), `${t.id} (${seed}): falta ${want} en ${f.join(', ')}`);
      if (t.kind === 'combat') assert.ok(f.some((x) => x.startsWith('cartel:')), `${t.id}: sin cartel`);
      assert.ok(f.some((x) => x.startsWith('letrero:')), `${t.id} (${seed}): sin letras pintadas en el suelo`);
      assert.ok(f.includes('basura') && f.includes('pared'), `${t.id}: sin basura o sin nada en las paredes`);
      // Nothing of the floors below.
      const below = ['rodadas', 'muelle', 'turno', 'escarcha', 'chapa', 'cubrecables', 'expositor', 'progreso', 'interferencias'];
      below.push('casilla:cracked', 'casilla:grate', 'casilla:lifted', 'casilla:grommet');
      for (const no of below) assert.ok(!f.includes(no), `${t.id} (${seed}): ${no} en la planta 3`);
    }
  }
  const kinds = new Set<string>();
  const extras = new Set<string>();
  for (const t of floorTemplates.filter((x) => x.kind === 'combat')) {
    for (const seed of ['1', '2', '3', '4']) {
      for (const x of paint3(buildRoom(t), seed).features) (x.startsWith('casilla:') ? kinds : extras).add(x);
    }
  }
  for (const v of ['casilla:missing', 'casilla:letter', 'casilla:chewed', 'casilla:faded', 'casilla:sticker']) assert.ok(kinds.has(v), `nunca sale ${v}`);
  for (const v of ['carretera', 'zona-juego', 'precios']) assert.ok(extras.has(v), `nunca sale ${v}`);
});

test('arte de sala, planta 3: la decoración no tapa los huecos de las puertas y las plantas 1 y 2 no cambian', () => {
  const hole = hx('#0b0a12').join();
  for (const t of floorTemplates) {
    const art = paint3(buildRoom(t), 'puertas');
    for (const d of art.doors) {
      for (let y = d.y; y < d.y + d.h; y++) {
        for (let x = d.x; x < d.x + d.w; x++) assert.equal(art.canvas.get(x, y).join(), hole, `${t.id}: puerta ${d.dir} pintada en (${x}, ${y})`);
      }
    }
  }
  const room = buildRoom(ROOMS['carga-descarga']!);
  assert.notDeepEqual(paint3(room, 'x').canvas.p, paint2(room, 'x').canvas.p);
  assert.deepEqual(paint3(room, 'x').canvas.p, paint3(room, 'x').canvas.p);
});

// Floor 4 (Oficinas): carpet tiles, cubicle partitions, its own colour and decoration (src/art/oficinas.ts).
function paint4(room: Room, seed: string) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles, level: 4 }, seed);
}

test('arte de sala, planta 4: gris neutro (ni azul, ni verde, ni cálido), distinto de las otras tres e igual de oscuro', () => {
  const lum = (c: number[]): number => 0.3 * c[0]! + 0.59 * c[1]! + 0.11 * c[2]!;
  for (const t of floorTemplates) {
    const room = buildRoom(t);
    const four = floorMean(paint4(room, 'c'), room);
    assert.ok(Math.max(...four) - Math.min(...four) < 12, `${t.id}: la planta 4 debería ser gris (${four.map(Math.round)})`);
    for (const other of [floorMean(paint(room, 'c'), room), floorMean(paint2(room, 'c'), room), floorMean(paint3(room, 'c'), room)]) {
      const d = Math.hypot(four[0] - other[0], four[1] - other[1], four[2] - other[2]);
      assert.ok(d > 12, `${t.id}: la planta 4 se parece demasiado a otra (${four.map(Math.round)} frente a ${other.map(Math.round)})`);
    }
    const one = floorMean(paint(room, 'c'), room);
    assert.ok(Math.abs(lum(one) - lum(four)) < 14, `${t.id}: brillo ${lum(one).toFixed(1)} frente a ${lum(four).toFixed(1)}`);
  }
});

test('arte de sala, planta 4: cada tipo de sala tiene su cartel, su decoración y sus casillas propias', () => {
  const own: Record<string, string[]> = {
    start: ['cartel:PLANTA 4 · OFICINAS', 'felpudo'],
    shop: ['cartel:ECONOMATO', 'alfombra', 'etiquetas'],
    treasure: ['cartel:MATERIAL DE OFICINA'],
    secret: ['cartel:CONFIDENCIAL', 'telarañas', 'polvo', 'tiras'],
    boss: ['cartel:SALA DE JUNTAS', 'moqueta-juntas'],
  };
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c']) {
      const f = paint4(buildRoom(t), seed).features;
      for (const want of own[t.kind!] ?? []) assert.ok(f.includes(want), `${t.id} (${seed}): falta ${want} en ${f.join(', ')}`);
      if (t.kind === 'combat') assert.ok(f.some((x) => x.startsWith('cartel:')), `${t.id}: sin cartel`);
      assert.ok(f.some((x) => x.startsWith('letrero:')), `${t.id} (${seed}): sin letras en el suelo`);
      assert.ok(f.includes('basura') && f.includes('pared'), `${t.id}: sin basura o sin nada en las paredes`);
      // Nothing of the floors below.
      const below = ['rodadas', 'muelle', 'turno', 'escarcha', 'chapa', 'cubrecables', 'expositor', 'progreso', 'interferencias'];
      below.push('carretera', 'zona-juego', 'precios', 'confeti');
      below.push('casilla:cracked', 'casilla:grate', 'casilla:lifted', 'casilla:grommet', 'casilla:missing', 'casilla:letter', 'casilla:chewed');
      for (const no of below) assert.ok(!f.includes(no), `${t.id} (${seed}): ${no} en la planta 4`);
    }
  }
  const kinds = new Set<string>();
  const extras = new Set<string>();
  for (const t of floorTemplates.filter((x) => x.kind === 'combat')) {
    for (const seed of ['1', '2', '3', '4']) {
      for (const x of paint4(buildRoom(t), seed).features) (x.startsWith('casilla:') ? kinds : extras).add(x);
    }
  }
  for (const v of ['casilla:stain', 'casilla:worn', 'casilla:patch', 'casilla:gum', 'casilla:curled']) assert.ok(kinds.has(v), `nunca sale ${v}`);
  for (const v of ['pasillo', 'puesto-libre', 'objetivos']) assert.ok(extras.has(v), `nunca sale ${v}`);
});

test('arte de sala, planta 4: la decoración no tapa los huecos de las puertas y no es la Juguetería', () => {
  const hole = hx('#0b0a12').join();
  for (const t of floorTemplates) {
    const art = paint4(buildRoom(t), 'puertas');
    for (const d of art.doors) {
      for (let y = d.y; y < d.y + d.h; y++) {
        for (let x = d.x; x < d.x + d.w; x++) assert.equal(art.canvas.get(x, y).join(), hole, `${t.id}: puerta ${d.dir} pintada en (${x}, ${y})`);
      }
    }
  }
  const room = buildRoom(ROOMS['carga-descarga']!);
  assert.notDeepEqual(paint4(room, 'x').canvas.p, paint3(room, 'x').canvas.p);
  assert.deepEqual(paint4(room, 'x').canvas.p, paint4(room, 'x').canvas.p);
});

// Floor 5 (Atención al Cliente): linoleum, service counters, its own colour and decoration (src/art/atencion.ts).
function paint5(room: Room, seed: string) {
  const tiles = room.tiles.slice();
  for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
  return paintRoom({ ...room, tiles, level: 5 }, seed);
}

test('arte de sala, planta 5: azul petróleo (más verde que el añil del almacén), distinto de las otras cuatro e igual de oscuro', () => {
  const lum = (c: number[]): number => 0.3 * c[0]! + 0.59 * c[1]! + 0.11 * c[2]!;
  for (const t of floorTemplates) {
    const room = buildRoom(t);
    const five = floorMean(paint5(room, 'c'), room);
    const one = floorMean(paint(room, 'c'), room);
    // Blue, and greener than the warehouse: blue over red by a lot, green over red too.
    assert.ok(five[2] > five[0] + 30 && five[1] > five[0] + 16, `${t.id}: la planta 5 debería ser azul petróleo (${five.map(Math.round)})`);
    for (const other of [one, floorMean(paint2(room, 'c'), room), floorMean(paint3(room, 'c'), room), floorMean(paint4(room, 'c'), room)]) {
      const d = Math.hypot(five[0] - other[0], five[1] - other[1], five[2] - other[2]);
      assert.ok(d > 12, `${t.id}: la planta 5 se parece demasiado a otra (${five.map(Math.round)} frente a ${other.map(Math.round)})`);
    }
    assert.ok(Math.abs(lum(one) - lum(five)) < 14, `${t.id}: brillo ${lum(one).toFixed(1)} frente a ${lum(five).toFixed(1)}`);
  }
});

test('arte de sala, planta 5: cada tipo de sala tiene su cartel, su decoración y sus casillas propias', () => {
  const own: Record<string, string[]> = {
    start: ['cartel:PLANTA 5 · ATENCIÓN', 'felpudo', 'linea'],
    shop: ['cartel:REPUESTOS ORIGINALES', 'alfombra', 'etiquetas'],
    treasure: ['cartel:NO SE DEVUELVEN'],
    secret: ['cartel:GRABACIONES', 'telarañas', 'polvo', 'cinta'],
    boss: ['cartel:CENTRALITA', 'cables'],
  };
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c']) {
      const f = paint5(buildRoom(t), seed).features;
      for (const want of own[t.kind!] ?? []) assert.ok(f.includes(want), `${t.id} (${seed}): falta ${want} en ${f.join(', ')}`);
      if (t.kind === 'combat') assert.ok(f.some((x) => x.startsWith('cartel:')), `${t.id}: sin cartel`);
      assert.ok(f.some((x) => x.startsWith('letrero:')), `${t.id} (${seed}): sin letras en el suelo`);
      assert.ok(f.includes('basura') && f.includes('pared'), `${t.id}: sin basura o sin nada en las paredes`);
      // Nothing of the floors below.
      const below = ['rodadas', 'muelle', 'turno', 'escarcha', 'chapa', 'cubrecables', 'expositor', 'progreso', 'interferencias'];
      below.push('carretera', 'zona-juego', 'precios', 'confeti', 'pasillo', 'puesto-libre', 'objetivos', 'moqueta-juntas', 'tiras');
      below.push('casilla:cracked', 'casilla:grate', 'casilla:lifted', 'casilla:grommet', 'casilla:missing', 'casilla:letter', 'casilla:chewed');
      below.push('casilla:stain', 'casilla:worn', 'casilla:patch', 'casilla:gum', 'casilla:curled');
      for (const no of below) assert.ok(!f.includes(no), `${t.id} (${seed}): ${no} en la planta 5`);
    }
  }
  const kinds = new Set<string>();
  const extras = new Set<string>();
  for (const t of floorTemplates.filter((x) => x.kind === 'combat')) {
    for (const seed of ['1', '2', '3', '4']) {
      for (const x of paint5(buildRoom(t), seed).features) (x.startsWith('casilla:') ? kinds : extras).add(x);
    }
  }
  for (const v of ['casilla:scuff', 'casilla:burn', 'casilla:bubble', 'casilla:mended', 'casilla:feet']) assert.ok(kinds.has(v), `nunca sale ${v}`);
  for (const v of ['linea', 'zona-espera', 'pantalla', 'eslogan', 'reloj']) assert.ok(extras.has(v), `nunca sale ${v}`);
});

test('arte de sala, planta 5: lo de la pared del fondo no se pisa ni tapa la puerta de arriba', () => {
  // The slogan is wide: it never shares wall with the sign, the queue screen or the clocks, nor sits over the north door.
  for (const t of floorTemplates) {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const room = buildRoom(t);
      const art = paint5(room, seed);
      if (!art.features.includes('eslogan')) continue;
      const north = art.doors.find((d) => d.dir === 'N');
      // The first star of the rating (the filled one) is the only #fff1a8 at that height: the slogan is centred 24 px right of it.
      let starX = -1;
      for (let x = 0; x < art.canvas.w && starX < 0; x++) for (let y = 23; y < 25; y++) if (art.canvas.get(x, y).join() === hx('#fff1a8').join()) starX = x;
      assert.ok(starX >= 0, `${t.id} (${seed}): eslogan sin estrella`);
      const cx = starX + 24;
      if (north) assert.ok(cx + 70 < north.x || cx - 70 > north.x + north.w, `${t.id} (${seed}): el eslogan pisa la puerta de arriba`);
    }
  }
});

test('arte de sala, planta 5: la decoración no tapa los huecos de las puertas y no son las Oficinas', () => {
  const hole = hx('#0b0a12').join();
  for (const t of floorTemplates) {
    const art = paint5(buildRoom(t), 'puertas');
    for (const d of art.doors) {
      for (let y = d.y; y < d.y + d.h; y++) {
        for (let x = d.x; x < d.x + d.w; x++) assert.equal(art.canvas.get(x, y).join(), hole, `${t.id}: puerta ${d.dir} pintada en (${x}, ${y})`);
      }
    }
  }
  const room = buildRoom(ROOMS['carga-descarga']!);
  assert.notDeepEqual(paint5(room, 'x').canvas.p, paint4(room, 'x').canvas.p);
  assert.deepEqual(paint5(room, 'x').canvas.p, paint5(room, 'x').canvas.p);
  // Higher levels (the secret floor, until it has its own look) paint as floor 5.
  assert.deepEqual(paintRoom({ ...room, level: 6 }, 'x').canvas.p, paintRoom({ ...room, level: 5 }, 'x').canvas.p);
});
