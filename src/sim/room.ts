// Room geometry built from a text template (src/data/rooms.ts).
import { DUMMIES, PROPS } from '../data/props.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { DummyDef, EnemyDef, PropDef, RoomTemplate } from '../data/types.ts';
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
}

const PROP_CHARS: Record<string, string> = { c: 'caja', b: 'barril', k: 'carrito' };
const ENEMY_CHARS: Record<string, string> = { A: 'aspirador', O: 'microondas', L: 'bombilla', T: 'batidora' };

export function buildRoom(t: RoomTemplate): Room {
  const rows = t.rows.length;
  const cols = t.rows[0]?.length ?? 0;
  if (rows < 4 || cols < 4) throw new Error(`Room ${t.id}: too small`);
  const tiles = new Uint8Array(rows * cols);
  const props: PropInstance[] = [];
  const dummySpawns: Room['dummySpawns'] = [];
  const enemySpawns: Room['enemySpawns'] = [];
  let playerStart: Vec | null = null;
  t.rows.forEach((line, r) => {
    if (line.length !== cols) throw new Error(`Room ${t.id}: row ${r} has ${line.length} columns, expected ${cols}`);
    [...line].forEach((ch, c) => {
      const cx = c * TILE + TILE / 2;
      const bottom = (r + 1) * TILE - 2;
      if (ch === '#') tiles[r * cols + c] = 1;
      else if (ch === 'P') playerStart = { x: cx, y: r * TILE + TILE / 2 + 4 };
      else if (ch === 'M') dummySpawns.push({ def: DUMMIES.maniqui!, x: cx, y: bottom });
      else if (ENEMY_CHARS[ch]) enemySpawns.push({ def: ENEMIES[ENEMY_CHARS[ch]]!, x: cx, y: r * TILE + TILE / 2 + 4 });
      else if (PROP_CHARS[ch]) {
        const def = PROPS[PROP_CHARS[ch]]!;
        props.push({ def, x: cx, y: bottom, box: { x: cx + def.box.x, y: bottom + def.box.y, w: def.box.w, h: def.box.h } });
      } else if (ch !== '.') throw new Error(`Room ${t.id}: unknown tile «${ch}» at ${c},${r}`);
    });
  });
  for (let c = 0; c < cols; c++) {
    if (!tiles[c] || !tiles[(rows - 1) * cols + c]) throw new Error(`Room ${t.id}: the border must be wall`);
  }
  if (!playerStart) throw new Error(`Room ${t.id}: no player start (P)`);
  return { id: t.id, name: t.name, cols, rows, w: cols * TILE, h: rows * TILE, tiles, playerStart, props, dummySpawns, enemySpawns, restock: t.restock ?? 0 };
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
