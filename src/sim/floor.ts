// Floor layout generator: which rooms a floor has, where they are and how they connect. Rooms sit
// on a grid of cells (one cell per room for now); doors join neighbouring cells. Pure and seeded:
// the same seed always gives the same floor.
import { Rng } from './rng.ts';

import type { RoomKind } from '../data/types.ts';

export type { RoomKind };
export type Dir = 'N' | 'S' | 'E' | 'W';

export interface Door {
  dir: Dir;
  /** Id of the room on the other side. */
  to: number;
  /** Secret doors are hidden in the wall until something opens them. */
  secret: boolean;
}

export interface FloorRoom {
  id: number;
  gx: number;
  gy: number;
  kind: RoomKind;
  doors: Door[];
  /** Rooms away from the start through normal doors (secret room: through its nearest neighbour). */
  depth: number;
}

export interface Floor {
  seed: string;
  rooms: FloorRoom[];
  start: number;
  boss: number;
}

export interface FloorOptions {
  /** Rooms reachable through normal doors, start and boss included (random in this range). */
  rooms?: [number, number];
}

const DIRS: readonly { dir: Dir; dx: number; dy: number; back: Dir }[] = [
  { dir: 'N', dx: 0, dy: -1, back: 'S' },
  { dir: 'S', dx: 0, dy: 1, back: 'N' },
  { dir: 'E', dx: 1, dy: 0, back: 'W' },
  { dir: 'W', dx: -1, dy: 0, back: 'E' },
];

/** The grid is at most this many cells across, so a floor never sprawls off the minimap. */
const GRID = 9;
const MAX_TRIES = 200;

const key = (x: number, y: number): string => `${x},${y}`;

export function generateFloor(seed: string, opts: FloorOptions = {}): Floor {
  const [lo, hi] = opts.rooms ?? [10, 15];
  const rng = new Rng(`planta:${seed}`);
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const f = tryLayout(seed, rng.fork(`intento${attempt}`), rng.int(lo, hi));
    if (f) return f;
  }
  throw new Error(`No floor layout for seed ${seed}`);
}

/**
 * One go at a layout, Isaac-style: grow outwards from the start cell, never filling a cell that
 * would touch two rooms (so the floor branches instead of clumping). Dead ends become the special
 * rooms: the farthest one is the boss. Returns null if the shape does not work out.
 */
function tryLayout(seed: string, rng: Rng, target: number): Floor | null {
  const c = Math.floor(GRID / 2);
  const cells = new Map<string, { x: number; y: number }>();
  const order: { x: number; y: number }[] = [];
  const add = (x: number, y: number): void => {
    cells.set(key(x, y), { x, y });
    order.push({ x, y });
  };
  add(c, c);
  const filledAround = (x: number, y: number): number => DIRS.filter((d) => cells.has(key(x + d.dx, y + d.dy))).length;
  const queue = [{ x: c, y: c }];
  while (queue.length > 0 && order.length < target) {
    const cur = queue.shift()!;
    for (const d of rng.shuffle([...DIRS])) {
      if (order.length >= target) break;
      const nx = cur.x + d.dx;
      const ny = cur.y + d.dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      if (cells.has(key(nx, ny))) continue;
      if (filledAround(nx, ny) > 1) continue;
      // Leave some branches unexplored so the floor is not a fat cross.
      if (rng.chance(0.5) && !(cur.x === c && cur.y === c)) continue;
      add(nx, ny);
      queue.push({ x: nx, y: ny });
    }
    // Ran out of frontier before the target: restart growth from a random room.
    if (queue.length === 0 && order.length < target) queue.push(rng.pick(order));
  }
  if (order.length < target) return null;

  // Doors join every pair of filled neighbours. A cell touches only one room when it is added, so
  // the floor is a tree: one way to each room, dead ends at the tips.
  const rooms: FloorRoom[] = order.map((p, i) => ({ id: i, gx: p.x, gy: p.y, kind: 'combat', doors: [], depth: -1 }));
  const at = new Map(rooms.map((r) => [key(r.gx, r.gy), r]));
  for (const r of rooms) {
    for (const d of DIRS) {
      const o = at.get(key(r.gx + d.dx, r.gy + d.dy));
      if (o) r.doors.push({ dir: d.dir, to: o.id, secret: false });
    }
  }
  const start = rooms[0]!;
  start.kind = 'start';
  setDepths(rooms, start.id);

  // Dead ends (one door, not the start): boss is the deepest, then treasure and shop.
  const ends = rooms.filter((r) => r.id !== start.id && r.doors.length === 1).sort((a, b) => b.depth - a.depth || a.id - b.id);
  if (ends.length < 3) return null;
  const boss = ends[0]!;
  if (boss.depth < 3) return null;
  boss.kind = 'boss';
  const rest = rng.shuffle(ends.slice(1));
  rest[0]!.kind = 'treasure';
  rest[1]!.kind = 'shop';

  // Secret room: an empty cell touching at least two rooms (three is better), never the boss's
  // room nor the start, joined to all of them by secret doors.
  const candidates: { x: number; y: number; n: number }[] = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (cells.has(key(x, y))) continue;
      const near = DIRS.map((d) => at.get(key(x + d.dx, y + d.dy))).filter((r): r is FloorRoom => !!r);
      if (near.length < 2) continue;
      if (near.some((r) => r.kind === 'boss' || r.kind === 'start')) continue;
      candidates.push({ x, y, n: near.length });
    }
  }
  if (candidates.length === 0) return null;
  const best = Math.max(...candidates.map((k) => k.n));
  const spot = rng.pick(candidates.filter((k) => k.n === best));
  const secret: FloorRoom = { id: rooms.length, gx: spot.x, gy: spot.y, kind: 'secret', doors: [], depth: -1 };
  for (const d of DIRS) {
    const o = at.get(key(spot.x + d.dx, spot.y + d.dy));
    if (!o) continue;
    secret.doors.push({ dir: d.dir, to: o.id, secret: true });
    o.doors.push({ dir: d.back, to: secret.id, secret: true });
  }
  secret.depth = Math.min(...secret.doors.map((d) => rooms[d.to]!.depth)) + 1;
  rooms.push(secret);
  return { seed, rooms, start: start.id, boss: boss.id };
}

/** Breadth-first depth from the start through normal doors. */
function setDepths(rooms: FloorRoom[], from: number): void {
  for (const r of rooms) r.depth = -1;
  rooms[from]!.depth = 0;
  const q = [from];
  while (q.length) {
    const r = rooms[q.shift()!]!;
    for (const d of r.doors) {
      const o = rooms[d.to]!;
      if (d.secret || o.depth >= 0) continue;
      o.depth = r.depth + 1;
      q.push(o.id);
    }
  }
}

/** Everything that must hold for a floor to be playable; empty when it is fine. */
export function validateFloor(f: Floor, opts: FloorOptions = {}): string[] {
  const [lo, hi] = opts.rooms ?? [10, 15];
  const errs: string[] = [];
  const count = (k: RoomKind): number => f.rooms.filter((r) => r.kind === k).length;
  for (const [k, n] of [['start', 1], ['boss', 1], ['treasure', 1], ['shop', 1], ['secret', 1]] as const) {
    if (count(k) !== n) errs.push(`${count(k)} rooms of kind ${k}, expected ${n}`);
  }
  const normal = f.rooms.filter((r) => r.kind !== 'secret');
  if (normal.length < lo || normal.length > hi) errs.push(`${normal.length} rooms, expected ${lo}-${hi}`);
  const cells = new Set<string>();
  for (const r of f.rooms) {
    if (r.gx < 0 || r.gy < 0 || r.gx >= GRID || r.gy >= GRID) errs.push(`room ${r.id} off the grid`);
    if (cells.has(key(r.gx, r.gy))) errs.push(`two rooms in cell ${r.gx},${r.gy}`);
    cells.add(key(r.gx, r.gy));
    const dirs = new Set<Dir>();
    for (const d of r.doors) {
      const o = f.rooms[d.to];
      const dd = DIRS.find((x) => x.dir === d.dir)!;
      if (!o) {
        errs.push(`room ${r.id} has a door to nowhere`);
        continue;
      }
      if (o.gx !== r.gx + dd.dx || o.gy !== r.gy + dd.dy) errs.push(`door ${r.id}->${o.id} is not between neighbours`);
      if (!o.doors.some((b) => b.to === r.id && b.dir === dd.back && b.secret === d.secret)) errs.push(`door ${r.id}->${o.id} has no way back`);
      if (dirs.has(d.dir)) errs.push(`room ${r.id} has two ${d.dir} doors`);
      dirs.add(d.dir);
      if (d.secret !== (r.kind === 'secret' || o.kind === 'secret')) errs.push(`door ${r.id}->${o.id} secret flag is wrong`);
    }
  }
  // Every normal room reachable from the start without secret doors.
  const seen = new Set<number>([f.start]);
  const q = [f.start];
  while (q.length) {
    const r = f.rooms[q.shift()!]!;
    for (const d of r.doors) {
      if (d.secret || seen.has(d.to)) continue;
      seen.add(d.to);
      q.push(d.to);
    }
  }
  for (const r of normal) if (!seen.has(r.id)) errs.push(`room ${r.id} (${r.kind}) unreachable`);
  const boss = f.rooms[f.boss];
  if (!boss || boss.kind !== 'boss') errs.push('boss id does not point at the boss room');
  else {
    if (boss.doors.length !== 1) errs.push('the boss room is not a dead end');
    if (boss.doors.some((d) => d.to === f.start)) errs.push('the boss room is next to the start');
    if (boss.depth < Math.max(...normal.map((r) => r.depth))) errs.push('the boss room is not the farthest');
  }
  for (const r of f.rooms) if (r.kind === 'secret' && r.doors.length < 2) errs.push('the secret room touches fewer than two rooms');
  for (const k of ['treasure', 'shop'] as const) {
    const r = f.rooms.find((x) => x.kind === k);
    if (r && r.doors.filter((d) => !d.secret).length !== 1) errs.push(`the ${k} room is not a dead end`);
  }
  return errs;
}

const GLYPH: Record<RoomKind, string> = { start: 'E', combat: 'o', treasure: 'T', shop: '$', secret: '?', boss: 'J' };

/** ASCII map for logs and debugging: E start, o combat, T treasure, $ shop, ? secret, J boss. */
export function floorToText(f: Floor): string {
  const xs = f.rooms.map((r) => r.gx);
  const ys = f.rooms.map((r) => r.gy);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(...xs) - x0 + 1;
  const h = Math.max(...ys) - y0 + 1;
  const grid = Array.from({ length: h * 2 - 1 }, () => Array.from({ length: w * 2 - 1 }, () => ' '));
  for (const r of f.rooms) {
    const x = (r.gx - x0) * 2;
    const y = (r.gy - y0) * 2;
    grid[y]![x] = GLYPH[r.kind];
    for (const d of r.doors) {
      const ch = d.secret ? ':' : d.dir === 'E' || d.dir === 'W' ? '-' : '|';
      if (d.dir === 'E') grid[y]![x + 1] = ch;
      if (d.dir === 'S') grid[y + 1]![x] = ch;
    }
  }
  return grid.map((row) => row.join('').trimEnd()).join('\n');
}
