// Room geometry built from a text template (src/data/rooms.ts).
import { DUMMIES, PROPS } from '../data/props.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { DummyDef, EnemyDef, PropDef, RoomKind, RoomTemplate, SlotEnemy } from '../data/types.ts';
import type { Dir } from './floor.ts';
import type { Rng } from './rng.ts';
import type { Rect, Vec } from './vec.ts';

export const TILE = 24;
/** Rows at the top of every room drawn as the back wall with shelves. */
export const BACK_WALL_ROWS = 2;

export interface PropInstance {
  def: PropDef;
  x: number;
  y: number;
  box: Rect;
}

export interface Room {
  id: string;
  name: string;
  cols: number;
  rows: number;
  /** Pixel size. */
  w: number;
  h: number;
  /** 1 = wall, 0 = floor. Row-major. */
  tiles: Uint8Array;
  playerStart: Vec;
  props: PropInstance[];
  dummySpawns: Array<{ def: DummyDef; x: number; y: number }>;
  enemySpawns: Array<{ def: EnemyDef; x: number; y: number }>;
  /** Seconds before dead enemies come back (0 = never). */
  restock: number;
  kind: RoomKind | 'test';
  /** Openings in the walls (still solid until the floor's transitions arrive). */
  doors: RoomDoor[];
  /** Item pedestals, shopkeeper, shop shelves and boss spot (centre of the tile). */
  slots: Array<{ kind: SlotKind; x: number; y: number }>;
}

export interface RoomDoor {
  dir: Dir;
  /** The opening in pixels (the wall tiles it takes). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type SlotKind = 'item' | 'shopkeeper' | 'shelf' | 'boss';
const SLOT_CHARS: Record<string, SlotKind> = { '*': 'item', $: 'shopkeeper', s: 'shelf', J: 'boss' };

const PROP_CHARS: Record<string, string> = { c: 'caja', b: 'barril', k: 'carrito' };
const ENEMY_CHARS: Record<string, string> = { A: 'aspirador', O: 'microondas', L: 'bombilla', T: 'batidora', Z: 'mando', N: 'nevera-suprema' };

/**
 * Builds a room from a template. `doors` are the walls with an opening: by default all four for
 * floor templates and north and south for the test room.
 */
export function buildRoom(t: RoomTemplate, doors?: readonly Dir[]): Room {
  const rows = t.rows.length;
  const cols = t.rows[0]?.length ?? 0;
  if (rows < 4 || cols < 4) throw new Error(`Room ${t.id}: too small`);
  const tiles = new Uint8Array(rows * cols);
  const props: PropInstance[] = [];
  const dummySpawns: Room['dummySpawns'] = [];
  const enemySpawns: Room['enemySpawns'] = [];
  const slots: Room['slots'] = [];
  let playerStart: Vec | null = null;
  t.rows.forEach((line, r) => {
    if (line.length !== cols) throw new Error(`Room ${t.id}: row ${r} has ${line.length} columns, expected ${cols}`);
    [...line].forEach((ch, c) => {
      const cx = c * TILE + TILE / 2;
      const bottom = (r + 1) * TILE - 2;
      if (ch === '#') tiles[r * cols + c] = 1;
      else if (ch === 'P') playerStart = { x: cx, y: r * TILE + TILE / 2 + 4 };
      else if (SLOT_CHARS[ch]) slots.push({ kind: SLOT_CHARS[ch], x: cx, y: r * TILE + TILE / 2 + 4 });
      else if (ch === 'M') dummySpawns.push({ def: DUMMIES.maniqui!, x: cx, y: bottom });
      else if (ENEMY_CHARS[ch]) enemySpawns.push({ def: ENEMIES[ENEMY_CHARS[ch]]!, x: cx, y: r * TILE + TILE / 2 + 4 });
      else if (PROP_CHARS[ch]) {
        const def = PROPS[PROP_CHARS[ch]]!;
        props.push({ def, x: cx, y: bottom, box: { x: cx + def.box.x, y: bottom + def.box.y, w: def.box.w, h: def.box.h } });
      } else if (ch !== '.' && ch !== 'e' && ch !== 'o') throw new Error(`Room ${t.id}: unknown tile «${ch}» at ${c},${r}`);
    });
  });
  for (let c = 0; c < cols; c++) {
    if (!tiles[c] || !tiles[(rows - 1) * cols + c]) throw new Error(`Room ${t.id}: the border must be wall`);
  }
  // Floor rooms are entered through a door: without a P the player starts in front of the south one.
  if (!playerStart) {
    if (!t.kind) throw new Error(`Room ${t.id}: no player start (P)`);
    const a = doorApron(cols, rows, 'S');
    const inner = a[a.length - 1]!;
    playerStart = { x: (inner.c + 1) * TILE, y: inner.r * TILE + TILE / 2 + 4 };
  }
  const roomDoors: RoomDoor[] = [];
  for (const dir of doors ?? (t.kind ? (['N', 'S', 'E', 'W'] as const) : (['N', 'S'] as const))) {
    const cells = doorCells(cols, rows, dir);
    if (cells.some((c) => !tiles[c.r * cols + c.c])) throw new Error(`Room ${t.id}: door ${dir} is not in a wall`);
    const c0 = Math.min(...cells.map((c) => c.c));
    const r0 = Math.min(...cells.map((c) => c.r));
    const c1 = Math.max(...cells.map((c) => c.c));
    const r1 = Math.max(...cells.map((c) => c.r));
    roomDoors.push({ dir, x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE });
  }
  return {
    id: t.id,
    name: t.name,
    cols,
    rows,
    w: cols * TILE,
    h: rows * TILE,
    tiles,
    playerStart,
    props,
    dummySpawns,
    enemySpawns,
    restock: t.restock ?? 0,
    kind: t.kind ?? 'test',
    doors: roomDoors,
    slots,
  };
}

export interface Cell {
  c: number;
  r: number;
}

/**
 * The two wall tiles a door opens in, at the centre of its wall. North doors go through both
 * rows of the back wall; the others through the one-tile border.
 */
export function doorCells(cols: number, rows: number, dir: Dir): Cell[] {
  const c0 = Math.floor(cols / 2) - 1;
  const r0 = Math.floor((rows + 1) / 2) - 1;
  switch (dir) {
    case 'N':
      return [{ c: c0, r: 0 }, { c: c0 + 1, r: 0 }, { c: c0, r: 1 }, { c: c0 + 1, r: 1 }];
    case 'S':
      return [{ c: c0, r: rows - 1 }, { c: c0 + 1, r: rows - 1 }];
    case 'W':
      return [{ c: 0, r: r0 }, { c: 0, r: r0 + 1 }];
    case 'E':
      return [{ c: cols - 1, r: r0 }, { c: cols - 1, r: r0 + 1 }];
  }
}

/** Depth (tiles) of the clear floor in front of every door. */
export const DOOR_APRON = 2;

/** Floor tiles in front of a door that a floor template must keep clear, nearest to the door first. */
export function doorApron(cols: number, rows: number, dir: Dir): Cell[] {
  const c0 = Math.floor(cols / 2) - 1;
  const r0 = Math.floor((rows + 1) / 2) - 1;
  const out: Cell[] = [];
  for (let k = 0; k < DOOR_APRON; k++) {
    if (dir === 'N') out.push({ c: c0, r: BACK_WALL_ROWS + k }, { c: c0 + 1, r: BACK_WALL_ROWS + k });
    else if (dir === 'S') out.push({ c: c0, r: rows - 2 - k }, { c: c0 + 1, r: rows - 2 - k });
    else if (dir === 'W') out.push({ c: 1 + k, r: r0 }, { c: 1 + k, r: r0 + 1 });
    else out.push({ c: cols - 2 - k, r: r0 }, { c: cols - 2 - k, r: r0 + 1 });
  }
  return out;
}

export interface FillOptions {
  /** Rooms away from the floor's start: deeper rooms get a bigger enemy budget. */
  depth: number;
  /** Enemies that may fill `e` slots (src/data/rooms.ts SLOT_ENEMIES). */
  pool: readonly SlotEnemy[];
  /** Template letter of the floor's boss, which takes the `J` spot (src/data/rooms.ts FLOOR_BOSS_1). */
  boss?: string;
}

/** Enemy budget of a combat room at a given depth (each enemy costs SlotEnemy.cost). */
export function enemyBudget(depth: number): number {
  return Math.min(14, 4 + depth * 1.5);
}

/** Obstacles an `o` slot can become ('.' = nothing), with weights. */
const OBSTACLES: readonly [string, number][] = [['.', 5], ['c', 3], ['b', 2], ['k', 1]];

/**
 * Turns a floor template into a concrete room: picks which `e` slots get an enemy (within the
 * depth's budget, at least one if the template has slots) and what each `o` slot holds. Seeded:
 * the same rng state gives the same room.
 */
export function fillTemplate(t: RoomTemplate, rng: Rng, opts: FillOptions): RoomTemplate {
  const grid = t.rows.map((r) => [...r]);
  const enemySlots: Cell[] = [];
  grid.forEach((line, r) => line.forEach((ch, c) => {
    if (ch === 'e') enemySlots.push({ c, r });
    else if (ch === 'J' && opts.boss) line[c] = opts.boss;
    else if (ch === 'o') line[c] = weighted(rng, OBSTACLES);
  }));
  rng.shuffle(enemySlots);
  let budget = enemyBudget(opts.depth);
  const used = new Map<string, number>();
  let placed = 0;
  for (const cell of enemySlots) {
    const options = opts.pool.filter((e) => e.cost <= budget && (used.get(e.ch) ?? 0) < (e.max ?? Infinity));
    // The first enemy always comes (the cheapest if nothing fits): a combat room is never empty.
    const pick = options.length ? weighted(rng, options.map((e) => [e, e.weight] as const)) : placed === 0 ? cheapest(opts.pool) : null;
    grid[cell.r]![cell.c] = pick ? pick.ch : '.';
    if (!pick) continue;
    budget -= pick.cost;
    used.set(pick.ch, (used.get(pick.ch) ?? 0) + 1);
    placed++;
  }
  return { ...t, rows: grid.map((l) => l.join('')) };
}

function cheapest(pool: readonly SlotEnemy[]): SlotEnemy | null {
  let best: SlotEnemy | null = null;
  for (const e of pool) if (!best || e.cost < best.cost) best = e;
  return best;
}

function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  let total = 0;
  for (const [, wt] of items) total += wt;
  let x = rng.next() * total;
  for (const [it, wt] of items) {
    x -= wt;
    if (x < 0) return it;
  }
  return items[items.length - 1]![0];
}

export function isWallAt(room: Room, px: number, py: number): boolean {
  const c = Math.floor(px / TILE);
  const r = Math.floor(py / TILE);
  if (c < 0 || r < 0 || c >= room.cols || r >= room.rows) return true;
  return room.tiles[r * room.cols + c] === 1;
}

/** Wall tiles overlapping a rectangle, as rectangles. */
export function wallRectsNear(room: Room, box: Rect, out: Rect[]): void {
  const c0 = Math.floor(box.x / TILE);
  const c1 = Math.floor((box.x + box.w) / TILE);
  const r0 = Math.floor(box.y / TILE);
  const r1 = Math.floor((box.y + box.h) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const solid = c < 0 || r < 0 || c >= room.cols || r >= room.rows || room.tiles[r * room.cols + c] === 1;
      if (solid) out.push({ x: c * TILE, y: r * TILE, w: TILE, h: TILE });
    }
  }
}
