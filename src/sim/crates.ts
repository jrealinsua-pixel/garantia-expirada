// «Control de calidad» (M12 (4c)): the Trituradora's stacks of crates. They come down a half
// column at a time (BossPhase.crates), from the side wall farthest from the boss inwards, so the
// room closes bit by bit and the toaster is pushed towards the end of the belt. Each one is marked
// on the floor before it lands; whoever is under it then takes a hit and is thrown out towards the
// boss. Once down they are ordinary props (a whole tile each, they stop bullets and cannot break).
import { PROPS } from '../data/props.ts';
import type { BossPhase } from '../data/types.ts';
import { BACK_WALL_ROWS, TILE, isWallAt } from './room.ts';
import { overlaps, type Rect } from './vec.ts';
import { DT, freeSpot, hurtPlayer, isDead, playerFeetBox, type Enemy, type World } from './world.ts';

export type CrateSpec = NonNullable<BossPhase['crates']>;

/** A stack on its way down: its tile, how long it has been marked and when it lands. */
export interface CrateDrop {
  id: number;
  /** Bottom-centre of its tile (where the prop will stand), and its box. */
  x: number;
  y: number;
  box: Rect;
  t: number;
  warn: number;
  prop: string;
  hurt: number;
  /** Which way out is towards the boss (−1 or 1): who is under it is thrown that way. */
  out: number;
  source: number;
  by: string;
}

/** Where a boss is in its closing of the room: the column it is on (counted from the far wall) and which half. */
export interface CrateState {
  t: number;
  col: number;
  half: 0 | 1;
  /** The side the crates start from: −1 the left wall, 1 the right one. */
  from: -1 | 1;
}

/** The box of tile (c, r) as a prop standing on it. */
function tileBox(c: number, r: number): Rect {
  return { x: c * TILE, y: r * TILE, w: TILE, h: TILE };
}

/**
 * Starts the closing of the room: from the side wall farthest from the boss (where the belt comes
 * from, if it has laid one), the first chunk `first` s from now.
 */
export function startCrates(w: World, en: Enemy, spec: CrateSpec): CrateState {
  const belt = w.conveyors.find((c) => c.source === en.id);
  const from: -1 | 1 = belt ? (belt.dirX > 0 ? -1 : 1) : en.x > w.room.w / 2 ? -1 : 1;
  return { t: spec.every - spec.first, col: 0, half: 0, from };
}

/** The floor tiles of the next chunk (a half column), skipping walls and anything already standing there. */
export function nextChunk(w: World, st: CrateState): Array<{ c: number; r: number }> {
  const room = w.room;
  const c = st.from < 0 ? 1 + st.col : room.cols - 2 - st.col;
  const top = BACK_WALL_ROWS;
  const bottom = room.rows - 2;
  const mid = top + Math.floor((bottom - top + 1) / 2);
  const rows = st.half === 0 ? [top, mid - 1] : [mid, bottom];
  const out: Array<{ c: number; r: number }> = [];
  for (let r = rows[0]!; r <= rows[1]!; r++) {
    const box = tileBox(c, r);
    if (isWallAt(room, box.x + TILE / 2, box.y + TILE / 2)) continue;
    const inner = { x: box.x + 2, y: box.y + 2, w: box.w - 4, h: box.h - 4 };
    if (room.props.some((pr) => overlaps(pr.box, inner))) continue;
    if (w.crates.some((d) => overlaps(d.box, inner))) continue;
    out.push({ c, r });
  }
  return out;
}

/**
 * Counts down to the next chunk and marks it (between attacks or not: the crates come from above,
 * not from the boss). Stops after `cols` columns.
 */
export function tickCrates(w: World, en: Enemy, spec: CrateSpec, st: CrateState): void {
  if (st.col >= spec.cols || w.over) return;
  st.t += DT;
  if (st.t < spec.every) return;
  st.t = 0;
  const tiles = nextChunk(w, st);
  const out = -st.from;
  for (const { c, r } of tiles) {
    const box = tileBox(c, r);
    w.crates.push({ id: w.nextId++, x: box.x + TILE / 2, y: box.y + TILE, box, t: 0, warn: spec.warn, prop: spec.prop, hurt: spec.hurt, out, source: en.id, by: en.def.id });
  }
  if (tiles.length > 0) {
    const ys = tiles.map((t) => t.r);
    w.events.push({ type: 'crateMark', x: tiles[0]!.c * TILE + TILE / 2, y: ((Math.min(...ys) + Math.max(...ys) + 1) / 2) * TILE, count: tiles.length, warn: spec.warn });
  }
  if (st.half === 0) st.half = 1;
  else {
    st.half = 0;
    st.col++;
  }
}

/** The crates on their way down land: a prop each, and a hit for whoever is under one. */
export function updateCrates(w: World): void {
  if (w.crates.length === 0) return;
  const keep: CrateDrop[] = [];
  const landed: CrateDrop[] = [];
  for (const d of w.crates) {
    d.t += DT;
    if (d.t < d.warn) keep.push(d);
    else landed.push(d);
  }
  w.crates = keep;
  if (landed.length === 0) return;
  const p = w.player;
  let hit: CrateDrop | null = null;
  for (const d of landed) {
    const def = PROPS[d.prop];
    if (!def) throw new Error(`Unknown prop ${d.prop}`);
    const box = { x: d.x + def.box.x, y: d.y + def.box.y, w: def.box.w, h: def.box.h };
    w.room.props.push({ def, x: d.x, y: d.y, box });
    if (overlaps(playerFeetBox(p, p.def.footRadius), box)) hit = d;
    // Anyone else under it (the boss's helpers, if any) steps out the same way.
    for (const o of w.enemies) {
      if (isDead(o) || !overlaps(playerFeetBox(o, o.def.footRadius), box)) continue;
      const at = freeSpot(w, d.out > 0 ? box.x + box.w + o.def.footRadius + 1 : box.x - o.def.footRadius - 1, o.y, o.def.footRadius);
      o.x = at.x;
      o.y = at.y;
    }
  }
  const xs = landed.map((d) => d.x);
  const ys = landed.map((d) => d.y);
  w.events.push({ type: 'crateLand', x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2, count: landed.length, spots: landed.map((d) => ({ x: d.x, y: d.y })) });
  if (!hit) return;
  // Under it: out towards the boss, past the column, and a hit if it can be hurt.
  const at = freeSpot(w, hit.out > 0 ? hit.box.x + hit.box.w + p.def.footRadius + 2 : hit.box.x - p.def.footRadius - 2, p.y, p.def.footRadius);
  p.x = at.x;
  p.y = at.y;
  p.vx = hit.out * 120;
  p.vy = 0;
  if (p.rollT >= 0) {
    p.rollT = -1;
    p.rollCooldown = p.def.rollCooldown;
  }
  hurtPlayer(w, hit.hurt, hit.source, hit.out, 0, { by: hit.by, how: 'contact' });
}
