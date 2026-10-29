import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, SLOT_ENEMIES_1, templatesOf } from '../src/data/rooms.ts';
import type { RoomTemplate } from '../src/data/types.ts';
import { Bot } from '../src/sim/bot.ts';
import type { Dir } from '../src/sim/floor.ts';
import { Rng } from '../src/sim/rng.ts';
import { buildRoom, doorApron, doorCells, enemyBudget, fillTemplate, SLIT, type Cell } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, step } from '../src/sim/world.ts';

const DIRS: Dir[] = ['N', 'S', 'E', 'W'];
const FLOOR = Object.values(ROOMS).filter((t) => t.kind);
const OPEN = new Set(['.', 'e', 'o', '*', '$', 's', 'J', 'P', 'M']);
const ENEMY_LETTERS = new Set(['A', 'O', 'L', 'T', 'Z']);
const at = (t: RoomTemplate, c: Cell): string => t.rows[c.r]![c.c]!;

/** Tiles a walker can stand on: no wall, no fixed prop (an `o` slot may become a prop, so it blocks too). */
function walkable(t: RoomTemplate, c: number, r: number): boolean {
  const ch = t.rows[r]?.[c];
  return ch !== undefined && OPEN.has(ch) && ch !== 'o';
}

function flood(t: RoomTemplate, from: Cell): Set<string> {
  const seen = new Set<string>([`${from.c},${from.r}`]);
  const q = [from];
  while (q.length) {
    const { c, r } = q.shift()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const k = `${c + dc},${r + dr}`;
      if (!seen.has(k) && walkable(t, c + dc, r + dr)) {
        seen.add(k);
        q.push({ c: c + dc, r: r + dr });
      }
    }
  }
  return seen;
}

test('plantillas: al menos 15 salas de planta, con todos los tipos que pide el generador', () => {
  assert.ok(FLOOR.length >= 15, `${FLOOR.length} plantillas`);
  for (const k of ['start', 'combat', 'treasure', 'shop', 'secret', 'boss'] as const) assert.ok(templatesOf(k).length >= 1, k);
  assert.ok(templatesOf('combat').length >= 12);
  assert.equal(new Set(FLOOR.map((t) => t.name)).size, FLOOR.length, 'nombres distintos');
});

test('plantillas: las cuatro puertas caen en pared y tienen delante suelo despejado', () => {
  for (const t of FLOOR) {
    const cols = t.rows[0]!.length;
    const rows = t.rows.length;
    for (const d of DIRS) {
      for (const c of doorCells(cols, rows, d)) assert.equal(at(t, c), '#', `${t.id} puerta ${d} en ${c.c},${c.r}`);
      for (const c of doorApron(cols, rows, d)) assert.equal(at(t, c), '.', `${t.id} delante de la puerta ${d} en ${c.c},${c.r}`);
    }
  }
});

test('plantillas: desde cualquier puerta se llega a todas las demás y a cada hueco', () => {
  for (const t of FLOOR) {
    const cols = t.rows[0]!.length;
    const rows = t.rows.length;
    const aprons = DIRS.map((d) => doorApron(cols, rows, d)[0]!);
    const reach = flood(t, aprons[0]!);
    for (const a of aprons) assert.ok(reach.has(`${a.c},${a.r}`), `${t.id}: puerta en ${a.c},${a.r} aislada`);
    t.rows.forEach((line, r) => [...line].forEach((ch, c) => {
      if (ch === 'e' || ch === '*' || ch === '$' || ch === 'J' || ch === 's') assert.ok(reach.has(`${c},${r}`), `${t.id}: hueco ${ch} en ${c},${r} inalcanzable`);
      // An obstacle slot must not be the only way through: with it filled the room stays connected.
      if (ch === '.') assert.ok(reach.has(`${c},${r}`), `${t.id}: suelo encerrado en ${c},${r}`);
    }));
  }
});

test('plantillas: ningún enemigo aparece encima de una puerta', () => {
  for (const t of FLOOR) {
    const cols = t.rows[0]!.length;
    const rows = t.rows.length;
    const doors = DIRS.map((d) => doorApron(cols, rows, d)[0]!);
    t.rows.forEach((line, r) => [...line].forEach((ch, c) => {
      if (ch !== 'e') return;
      for (const d of doors) assert.ok(Math.hypot(d.c - c, d.r - r) >= 3.5, `${t.id}: hueco de enemigo en ${c},${r} pegado a la puerta ${d.c},${d.r}`);
    }));
  }
});

test('plantillas: solo las de combate llevan huecos de enemigo y cada una tiene de 3 a 7', () => {
  for (const t of FLOOR) {
    const n = t.rows.join('').split('e').length - 1;
    if (t.kind === 'combat') assert.ok(n >= 3 && n <= 7, `${t.id}: ${n} huecos`);
    else assert.equal(n, 0, t.id);
    assert.ok(![...t.rows.join('')].some((ch) => ENEMY_LETTERS.has(ch)), `${t.id}: los enemigos van en huecos, no fijos`);
  }
});

test('rellenar: misma semilla, misma sala; los huecos se vuelven enemigos u obstáculos', () => {
  for (const t of FLOOR) {
    const a = fillTemplate(t, new Rng('r:' + t.id), { depth: 3, pool: SLOT_ENEMIES_1 });
    const b = fillTemplate(t, new Rng('r:' + t.id), { depth: 3, pool: SLOT_ENEMIES_1 });
    assert.deepEqual(a.rows, b.rows);
    assert.ok(!a.rows.join('').includes('e') && !a.rows.join('').includes('o'), t.id);
    const room = buildRoom(a);
    if (t.kind === 'combat') assert.ok(room.enemySpawns.length >= 1, `${t.id}: sala de combate vacía`);
    else assert.equal(room.enemySpawns.length, 0);
  }
});

test('rellenar: el presupuesto crece con la profundidad y respeta los máximos', () => {
  assert.ok(enemyBudget(6) > enemyBudget(1));
  const cost = new Map(SLOT_ENEMIES_1.map((e) => [e.ch, e]));
  let shallow = 0;
  let deep = 0;
  for (let i = 0; i < 400; i++) {
    for (const [depth, add] of [[1, (n: number) => (shallow += n)], [7, (n: number) => (deep += n)]] as const) {
      const t = templatesOf('combat')[i % templatesOf('combat').length]!;
      const f = fillTemplate(t, new Rng(`p${i}`), { depth, pool: SLOT_ENEMIES_1 });
      const letters = [...f.rows.join('')].filter((ch) => cost.has(ch));
      const spent = letters.reduce((s, ch) => s + cost.get(ch)!.cost, 0);
      assert.ok(letters.length === 1 || spent <= enemyBudget(depth), `${t.id}: gasta ${spent} de ${enemyBudget(depth)}`);
      for (const e of SLOT_ENEMIES_1) assert.ok(letters.filter((ch) => ch === e.ch).length <= (e.max ?? 99), `${t.id}: demasiados ${e.ch}`);
      add(spent);
    }
  }
  assert.ok(deep > shallow * 1.5, `profundas ${deep}, someras ${shallow}`);
});

test('plantillas: el bot juega 25 s en cada sala de combate rellena sin romper nada', () => {
  for (const t of [...templatesOf('combat'), ...templatesOf('combat', 2)]) {
    for (const depth of [1, 6]) {
      const seed = `bot:${t.id}:${depth}`;
      const tpl = fillTemplate(t, new Rng(seed), { depth, pool: SLOT_ENEMIES_1 });
      const w = createWorld({ seed, template: tpl });
      const bot = new Bot(seed);
      for (let i = 0; i < 25 / DT && !w.over; i++) {
        step(w, bot.think(w));
        if (i % 30 === 0) assert.deepEqual(checkInvariants(w), [], `${t.id} (${depth}) tick ${w.tick}`);
      }
    }
  }
});

test('plantillas: no hay rendijas por las que solo quepan los pies (cada hueco «o» con cada obstáculo)', () => {
  // A gap of 5–13 px between a wall or prop and the prop under it: the feet (4 px tall) fit, the
  // body is drawn through both (the trolley and the box in cola-atencion, a crate against the back wall).
  const bad: string[] = [];
  for (const t of Object.values(ROOMS)) {
    for (const ob of ['c', 'b', 'k', 'c.', 'b.', 'k.']) {
      // The second three: with every group of shelving taken away.
      const rows = t.rows.map((r) => r.replaceAll('o', ob[0]!).replace(/[1-9]/g, ob.length > 1 ? '.' : '#'));
      const room = buildRoom({ ...t, rows });
      const solids = room.props.map((p) => ({ ...p.box, n: p.def.id }));
      for (let r = 0; r < room.rows; r++) for (let c = 0; c < room.cols; c++) if (room.tiles[r * room.cols + c]) solids.push({ x: c * 24, y: r * 24, w: 24, h: 24, n: '#' });
      for (const a of solids) for (const b of solids) {
        if (a === b || b.n === '#') continue;
        const side = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const gap = b.y - (a.y + a.h);
        if (side > 0 && gap > 4 && gap < SLIT) bad.push(`${t.id} (o=${ob}): ${a.n} sobre ${b.n}, ${gap} px`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

test('plantillas: cada sala de combate tiene su idea de combate escrita', () => {
  for (const t of [...templatesOf('combat'), ...templatesOf('combat', 2)]) assert.ok((t.idea ?? '').length > 20, `${t.id}: sin idea`);
});

test('variantes: los grupos de estanterías salen y no salen con la semilla, y la sala se puede reflejar', () => {
  const withGroups = FLOOR.filter((t) => /[1-9]/.test(t.rows.join('')));
  assert.ok(withGroups.length >= 8, `${withGroups.length} plantillas con grupos`);
  for (const t of withGroups) {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const f = fillTemplate(t, new Rng(`g${i}`), { depth: 3, pool: SLOT_ENEMIES_1 });
      assert.ok(!/[1-9]/.test(f.rows.join('')), `${t.id}: quedan grupos sin resolver`);
      seen.add(f.rows.join('').split('#').length > t.rows.join('').split('#').length ? 'con' : 'sin');
    }
    assert.ok(seen.has('con') && seen.has('sin'), `${t.id}: los grupos salen siempre igual`);
  }
  // Mirrored only on a generated floor (vary), only combat rooms, and about half of the time.
  let mirrored = 0;
  for (let i = 0; i < 200; i++) {
    const t = templatesOf('combat')[i % templatesOf('combat').length]!;
    const plain = fillTemplate(t, new Rng(`m${i}`), { depth: 3, pool: SLOT_ENEMIES_1 });
    const varied = fillTemplate(t, new Rng(`m${i}`), { depth: 3, pool: SLOT_ENEMIES_1, vary: true });
    const flipped = plain.rows.map((r) => [...r].reverse().join(''));
    if (varied.rows.join() !== plain.rows.join()) {
      assert.deepEqual(varied.rows, flipped, `${t.id}: o igual o reflejada`);
      mirrored++;
    }
  }
  assert.ok(mirrored > 60 && mirrored < 140, `${mirrored} de 200 reflejadas`);
  for (const t of templatesOf('boss')) {
    const a = fillTemplate(t, new Rng('j'), { depth: 3, pool: SLOT_ENEMIES_1, boss: 'N' });
    const b = fillTemplate(t, new Rng('j'), { depth: 3, pool: SLOT_ENEMIES_1, boss: 'N', vary: true });
    assert.deepEqual(a.rows, b.rows, 'la sala de la jefa no se refleja');
  }
});

test('variantes: una sala reflejada sigue teniendo las puertas en su sitio y despejadas', () => {
  for (const t of [...templatesOf('combat'), ...templatesOf('combat', 2)]) {
    const m: RoomTemplate = { ...t, rows: t.rows.map((r) => [...r].reverse().join('')) };
    const cols = t.rows[0]!.length;
    const rows = t.rows.length;
    for (const d of DIRS) {
      for (const c of doorCells(cols, rows, d)) assert.equal(at(m, c), '#', `${t.id} reflejada: puerta ${d}`);
      for (const c of doorApron(cols, rows, d)) assert.equal(at(m, c), '.', `${t.id} reflejada: delante de la puerta ${d}`);
    }
  }
});

test('plantillas de la planta 2: las de combate son suyas, con nombre propio; las especiales caen en las de la planta 1', () => {
  const two = templatesOf('combat', 2);
  assert.ok(two.length >= 12, `${two.length} salas de combate en la planta 2`);
  for (const t of two) assert.equal(t.level, 2, t.id);
  for (const t of templatesOf('combat')) assert.equal(t.level ?? 1, 1, t.id);
  for (const k of ['start', 'treasure', 'shop', 'secret', 'boss'] as const) assert.deepEqual(templatesOf(k, 2), templatesOf(k), k);
});
