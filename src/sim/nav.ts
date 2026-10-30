// Finding the way around a room (tiles, props) and around a floor (rooms, doors), for the bot.
// Pure: reads the world, never changes it.
import type { Dir } from './floor.ts';
import { TILE, type RoomDoor } from './room.ts';
import { isClear, type World } from './world.ts';

/** Feet height of a tile's walking line (where the feet are when standing in the middle of it). */
const FEET_Y = TILE / 2 + 2;

export interface Point {
  x: number;
  y: number;
}

/** Tiles the player cannot stand in the middle of: walls, and floor taken by a prop. */
export function blockedTiles(w: World, r: number): Uint8Array {
  const room = w.room;
  const out = new Uint8Array(room.cols * room.rows);
  for (let row = 0; row < room.rows; row++) {
    for (let c = 0; c < room.cols; c++) {
      const i = row * room.cols + c;
      out[i] = room.tiles[i] === 1 || !isClear(w, c * TILE + TILE / 2, row * TILE + FEET_Y, r) ? 1 : 0;
    }
  }
  return out;
}

const tileOf = (p: Point): { c: number; r: number } => ({ c: Math.floor(p.x / TILE), r: Math.floor(p.y / TILE) });
const centre = (c: number, r: number): Point => ({ x: c * TILE + TILE / 2, y: r * TILE + FEET_Y });

/**
 * Tiles (as walking points) from `from` to `to`, four-way, avoiding blocked tiles. If `to` cannot
 * be reached, goes to the reachable tile nearest to it. Empty if already there.
 */
export function findPath(w: World, from: Point, to: Point, r: number, blocked = blockedTiles(w, r)): Point[] {
  const room = w.room;
  const { cols, rows } = room;
  const s = tileOf(from);
  const g = tileOf(to);
  const inside = (c: number, rr: number): boolean => c >= 0 && rr >= 0 && c < cols && rr < rows;
  if (!inside(s.c, s.r)) return [];
  const prev = new Int32Array(cols * rows).fill(-2);
  const start = s.r * cols + s.c;
  // Standing in a tile that is mostly a prop (just above a trolley, say): start from the free
  // tiles around that can be walked to in a straight line.
  const queue: number[] = [];
  if (blocked[start]) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nc = s.c + dc;
        const nr = s.r + dr;
        if ((dc || dr) && inside(nc, nr) && !blocked[nr * cols + nc] && clearLine(w, from, centre(nc, nr), r + 1)) queue.push(nr * cols + nc);
      }
    }
  }
  if (queue.length === 0) queue.push(start);
  for (const q of queue) prev[q] = -1;
  let best = queue[0]!;
  let bestD = Infinity;
  const goal = inside(g.c, g.r) ? g.r * cols + g.c : -1;
  for (let qi = 0; qi < queue.length; qi++) {
    const i = queue[qi]!;
    const c = i % cols;
    const rr = (i - c) / cols;
    const d = Math.abs(c - g.c) + Math.abs(rr - g.r);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
    if (i === goal) break;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nc = c + dc;
      const nr = rr + dr;
      if (!inside(nc, nr)) continue;
      const j = nr * cols + nc;
      if (prev[j] !== -2 || blocked[j]) continue;
      // Both tiles free is not enough: something small can sit between their walking points (a
      // queue post at the bottom of its tile, right in the way from the tile below).
      if (!clearLine(w, centre(c, rr), centre(nc, nr), r)) continue;
      prev[j] = i;
      queue.push(j);
    }
  }
  const path: Point[] = [];
  for (let i = best; i >= 0 && i !== start; i = prev[i]!) path.push(centre(i % cols, Math.floor(i / cols)));
  return path.reverse();
}

/** Whether a feet box of radius `r` can go in a straight line from `a` to `b` without touching anything. */
export function clearLine(w: World, a: Point, b: Point, r: number): boolean {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    if (!isClear(w, a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, r)) return false;
  }
  return true;
}

/**
 * Where to walk now to get to `goal`: straight at it if nothing is in the way; otherwise the
 * farthest point of the tile path that can be walked to in a straight line.
 */
export function steer(w: World, goal: Point, r: number, blocked?: Uint8Array): Point {
  const p = w.player;
  const r2 = r + 1;
  if (clearLine(w, p, goal, r2)) return goal;
  const path = findPath(w, p, goal, r, blocked);
  if (path.length === 0) return goal;
  // String-pulling: skip the tiles that a straight walk already covers.
  for (let i = Math.min(path.length - 1, 6); i > 0; i--) if (clearLine(w, p, path[i]!, r2)) return path[i]!;
  return path[0]!;
}

/** Point well inside a door's outer tile: walking there takes the player through it. */
export function doorGoal(d: RoomDoor): Point {
  const cx = d.x + d.w / 2;
  const cy = d.y + d.h / 2;
  if (d.dir === 'N') return { x: cx, y: d.y + 8 };
  if (d.dir === 'S') return { x: cx, y: d.y + TILE - 4 };
  if (d.dir === 'W') return { x: d.x + 4, y: cy + 4 };
  return { x: d.x + TILE - 4, y: cy + 4 };
}

/**
 * The wall to leave through to reach the nearest room not visited yet (breadth first over the
 * floor's normal doors), or towards `fallback` (a room id) once everything has been visited.
 * Null when there is nowhere left to go.
 */
export function nextDoor(w: World, fallback?: number): Dir | null {
  const f = w.floor;
  if (!f) return null;
  const rooms = f.layout.rooms;
  const firstStep = new Map<number, Dir | null>([[f.current, null]]);
  const queue = [f.current];
  let target: number | null = null;
  // The boss room is left for last, like a player who wants to arrive with everything the floor gives.
  let bossFound = false;
  for (let qi = 0; qi < queue.length; qi++) {
    const id = queue[qi]!;
    if (!f.rooms[id]!.visited) {
      if (id !== f.layout.boss) {
        target = id;
        break;
      }
      bossFound = true;
    }
    for (const d of rooms[id]!.doors) {
      if (d.secret || firstStep.has(d.to)) continue;
      firstStep.set(d.to, firstStep.get(id) ?? d.dir);
      queue.push(d.to);
    }
  }
  if (target === null && bossFound) target = f.layout.boss;
  if (target === null && fallback !== undefined && fallback !== f.current && firstStep.has(fallback)) target = fallback;
  return target === null ? null : firstStep.get(target) ?? null;
}
