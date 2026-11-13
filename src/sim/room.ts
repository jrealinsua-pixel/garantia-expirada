// Room geometry built from a text template (src/data/rooms.ts).
import { DUMMIES, PROPS, REGLETA_MAX } from '../data/props.ts';
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
  /** Set when the prop is a chest (it appears when a room is cleared; see world.ts). */
  chest?: ChestState;
  /** A prop that can blow up (its def has `hp`): damage taken so far, and the seconds left once it is lit. */
  damage?: number;
  fuse?: number;
  /** Furniture tipped over (its def has `tip`): the way its top faces, where it covers from. */
  tipped?: TipSide;
  /**
   * A partition being moved (BossPhase.restructure): where its bottom-centre is going, marked for
   * `warn` s (the dashed outline) and then slid there in `time` s; `t` counts from the start of the
   * warning, and (fromX, fromY) is where it was.
   */
  slide?: { fromX: number; fromY: number; toX: number; toY: number; t: number; warn: number; time: number };
  /** A temporary prop (the Nube's folders, M14 (j3)): seconds left before it goes. */
  life?: number;
  /** A prop that zaps (PropDef.zap, M14b (h11a1)): seconds into its cycle (it zaps at `every`). */
  zapT?: number;
}

/** The four ways a tipped table can face (its top, the side that stops bullets). */
export type TipSide = 'N' | 'S' | 'E' | 'W';

/** A chest: shut until the interact button is pressed at it with a ticket. */
export interface ChestState {
  id: number;
  open: boolean;
  /**
   * 'carton' (the ordinary one: an ordinary passive item, active or weapon) or 'premium' (rare:
   * only things of quality «buena»). Nota del humano del 2026-10-30.
   */
  tier: ChestTier;
}

export type ChestTier = 'carton' | 'premium';

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
  kind: RoomKind | 'test' | 'hub';
  /** Openings in the walls (still solid until the floor's transitions arrive). */
  doors: RoomDoor[];
  /** Item pedestals, shopkeeper, shop shelves and boss spot (centre of the tile). */
  slots: Array<{ kind: SlotKind; x: number; y: number }>;
  /** The Mostrador's things that talk or show something (see Station). Empty in any other room. */
  stations: Station[];
  /** The Mostrador's conveyor into the warehouse (pixels): stepping on it starts a run. */
  belt: Rect | null;
  /**
   * The workshop's conveyor belts (M12 (3b3)): `←` and `→` in the template, each run of the same
   * arrow a rectangle (pixels), the way it runs and, if it ends against a wall, its intake rollers.
   * The world lays them as Conveyors (src/sim/conveyors.ts layRoomBelts) on entering the room.
   */
  conveyors: RoomBelt[];
}

/** A conveyor belt drawn in a room template (see Room.conveyors). */
export interface RoomBelt {
  x: number;
  y: number;
  w: number;
  h: number;
  dirX: number;
  dirY: number;
  /** px of intake rollers at its downstream end (0: it just ends on the floor). */
  bite: number;
}

/** Template arrows of a conveyor belt and the way each runs (M12 (3b3)). Only sideways: the belt's sprite is drawn side-on. */
export const BELT_CHARS: Record<string, number> = { '→': 1, '←': -1 };
/** Mirrors a belt arrow left to right (fillTemplate's mirrored rooms). */
export const MIRROR_CHARS: Record<string, string> = { '→': '←', '←': '→' };
/** Speed (px/s) of the workshop's belts: under half the toaster's walk, a bit slower than the Trituradora's. */
export const ROOM_BELT_SPEED = 40;
/** Rollers of a belt that runs into a wall (px, as the Trituradora's). */
export const ROOM_BELT_BITE = 16;

/** What can be talked to or looked at in the Mostrador de Devoluciones (the hub). */
export type StationKind = 'caja' | 'telefono' | 'turnos' | 'chatarrero' | 'tablon' | 'archivador' | 'cita';

/**
 * A station of the hub. `x, y` is where the toaster's feet go to use it: the bottom-centre of a
 * prop that stands (the Caja, the ticket machine, the cabinet, the Chatarrero), or the middle of
 * the tile under something that hangs on the back wall (the board, the phone, the notice).
 */
export interface Station {
  kind: StationKind;
  x: number;
  y: number;
}

const STATION_CHARS: Record<string, { kind: StationKind; prop?: string }> = {
  C: { kind: 'caja', prop: 'caja-devoluciones' },
  n: { kind: 'turnos', prop: 'turnos' },
  a: { kind: 'archivador', prop: 'archivador' },
  h: { kind: 'chatarrero', prop: 'chatarrero' },
  B: { kind: 'tablon' },
  t: { kind: 'telefono' },
  // The Servicio Técnico's «Cita previa» notice (M12), on the back wall.
  y: { kind: 'cita' },
};

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

const PROP_CHARS: Record<string, string> = {
  c: 'caja', b: 'barril', k: 'carrito', v: 'mesa', m: 'mostrador', '|': 'poste', '=': 'mesa-juntas', _: 'mampara-movil',
  // The Centralita's low counters (M11 (2c2)): `~` the middle of a long one, `!` the bottom of an upright one.
  '~': 'mostrador-bajo', '!': 'mostrador-bajo-v',
  // M14b (h11a1): the Regleta Sobrecargada (fillTemplate puts it in some empty obstacle slots).
  r: 'regleta',
};
const ENEMY_CHARS: Record<string, string> = {
  A: 'aspirador',
  O: 'microondas',
  L: 'bombilla',
  T: 'batidora',
  Z: 'mando',
  N: 'nevera-suprema',
  I: 'impresora',
  F: 'cargador',
  R: 'raton-inalambrico',
  W: 'webcam',
  X: 'router-wifi',
  Q: 'robot-cuerda',
  V: 'coche-teledirigido',
  U: 'cubo-piezas',
  Y: 'sobre-sorpresa',
  D: 'muneco-moda',
  E: 'director-rrhh',
  S: 'destructora',
  K: 'fotocopiadora',
  G: 'sello',
  H: 'climatizador',
  // The ASCII capitals ran out with the Oficinas: Atención al Cliente's enemies use Spanish ones (M11 (4a)).
  Ñ: 'dispensador-turnos',
  // Á: the queue posts (M11 (4b)), always a pair (EnemyDef.pack).
  Á: 'poste-cola',
  // É: the virtual assistant (M11 (4c)).
  É: 'asistente-virtual',
  // Ó: the reception phone (M11 (4d)).
  Ó: 'telefono-recepcion',
  // Ç: La Nube de Almacenamiento, floor 2's second boss (M14 (j3)), in the Router's room.
  Ç: 'nube-almacenamiento',
  // È: La Consola Edición Coleccionista, floor 3's second boss (M14 (j4)), in the Muñeco's room.
  È: 'consola-coleccionista',
  // À: La Lavadora Programa Eco, floor 1's second boss (M14 (j2)), in the Nevera's room.
  À: 'lavadora-eco',
  // Ú: La Centralita, floor 5's boss (M11 (5b)).
  Ú: 'centralita',
  // Ü: La Trituradora, the final boss (M12 (4a)), in the Servicio Técnico's workshop.
  Ü: 'trituradora',
  // Í: the forklift, the workshop's own (M12 (3c)).
  Í: 'carretilla',
};

/** The enemy id a template letter stands for (undefined: not an enemy). */
export const enemyOfChar = (ch: string): string | undefined => ENEMY_CHARS[ch];

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
  const stations: Station[] = [];
  const belt: Cell[] = [];
  const arrows: Array<Cell & { ch: string }> = [];
  let playerStart: Vec | null = null;
  t.rows.forEach((line, r) => {
    if (line.length !== cols) throw new Error(`Room ${t.id}: row ${r} has ${line.length} columns, expected ${cols}`);
    [...line].forEach((ch, c) => {
      const cx = c * TILE + TILE / 2;
      const bottom = (r + 1) * TILE - 2;
      // A digit is a group of shelving that the seed may take away (fillTemplate); unfilled, it stands.
      if (ch === '#' || isGroup(ch)) tiles[r * cols + c] = 1;
      else if (ch === 'P') playerStart = { x: cx, y: r * TILE + TILE / 2 + 4 };
      else if (SLOT_CHARS[ch]) {
        slots.push({ kind: SLOT_CHARS[ch], x: cx, y: r * TILE + TILE / 2 + 4 });
        // The shopkeeper is a till that stands there (solid, like a box).
        if (SLOT_CHARS[ch] === 'shopkeeper') {
          const def = PROPS.autocobro!;
          props.push({ def, x: cx, y: bottom, box: { x: cx + def.box.x, y: bottom + def.box.y, w: def.box.w, h: def.box.h } });
        }
      }
      else if (STATION_CHARS[ch]) {
        const st = STATION_CHARS[ch];
        if (st.prop) {
          const def = PROPS[st.prop]!;
          props.push({ def, x: cx, y: bottom, box: { x: cx + def.box.x, y: bottom + def.box.y, w: def.box.w, h: def.box.h } });
          stations.push({ kind: st.kind, x: cx, y: bottom });
        } else stations.push({ kind: st.kind, x: cx, y: r * TILE + TILE / 2 + 4 });
      } else if (ch === '>') belt.push({ c, r });
      else if (BELT_CHARS[ch] !== undefined) arrows.push({ c, r, ch });
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
  sealSlits(props, tiles, cols);
  // Floor rooms are entered through a door: without a P the player starts in front of the south one.
  if (!playerStart) {
    if (!t.kind) throw new Error(`Room ${t.id}: no player start (P)`);
    const a = doorApron(cols, rows, 'S');
    const inner = a[a.length - 1]!;
    playerStart = { x: (inner.c + 1) * TILE, y: inner.r * TILE + TILE / 2 + 4 };
  }
  const roomDoors: RoomDoor[] = [];
  // The hub has no doors: it is left by the conveyor.
  for (const dir of doors ?? (t.kind === 'hub' ? [] : t.kind ? (['N', 'S', 'E', 'W'] as const) : (['N', 'S'] as const))) {
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
    stations,
    belt: beltRect(belt),
    conveyors: roomBelts(t.id, arrows, tiles, cols),
  };
}

/**
 * The template's belts: each 4-connected run of one arrow must make a rectangle. One that runs
 * into a wall (every row of its downstream end against one) ends in intake rollers.
 */
function roomBelts(id: string, arrows: Array<Cell & { ch: string }>, tiles: Uint8Array, cols: number): RoomBelt[] {
  const out: RoomBelt[] = [];
  const left = new Map(arrows.map((a) => [`${a.c},${a.r}`, a]));
  for (const start of arrows) {
    if (!left.has(`${start.c},${start.r}`)) continue;
    const run: Cell[] = [];
    const q = [start];
    left.delete(`${start.c},${start.r}`);
    while (q.length) {
      const k = q.pop()!;
      run.push(k);
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const key = `${k.c + dc},${k.r + dr}`;
        const n = left.get(key);
        if (n && n.ch === start.ch) {
          left.delete(key);
          q.push(n);
        }
      }
    }
    const c0 = Math.min(...run.map((k) => k.c));
    const c1 = Math.max(...run.map((k) => k.c));
    const r0 = Math.min(...run.map((k) => k.r));
    const r1 = Math.max(...run.map((k) => k.r));
    if ((c1 - c0 + 1) * (r1 - r0 + 1) !== run.length) throw new Error(`Room ${id}: the belt (${start.ch}) at ${start.c},${start.r} is not a rectangle`);
    const dirX = BELT_CHARS[start.ch]!;
    const end = dirX > 0 ? c1 + 1 : c0 - 1;
    let walled = true;
    for (let r = r0; r <= r1; r++) if (!tiles[r * cols + end]) walled = false;
    out.push({
      x: c0 * TILE,
      y: r0 * TILE,
      w: (c1 - c0 + 1) * TILE,
      h: (r1 - r0 + 1) * TILE,
      dirX,
      dirY: 0,
      bite: walled ? ROOM_BELT_BITE : 0,
    });
  }
  return out;
}

/** The rectangle the conveyor's tiles cover (they must make one), or null without any. */
function beltRect(cells: Cell[]): Rect | null {
  if (cells.length === 0) return null;
  const c0 = Math.min(...cells.map((k) => k.c));
  const c1 = Math.max(...cells.map((k) => k.c));
  const r0 = Math.min(...cells.map((k) => k.r));
  const r1 = Math.max(...cells.map((k) => k.r));
  if ((c1 - c0 + 1) * (r1 - r0 + 1) !== cells.length) throw new Error('The conveyor tiles (>) must make a rectangle');
  return { x: c0 * TILE, y: r0 * TILE, w: (c1 - c0 + 1) * TILE, h: (r1 - r0 + 1) * TILE };
}

/**
 * Below this, a gap between a solid and the prop under it is a slit: the toaster's feet would
 * squeeze in (they are 4 px tall), but its body would be drawn through both things.
 */
export const SLIT = 14;

/**
 * Closes the slits over props: a prop whose top is less than SLIT px under a wall or another
 * prop (overlapping sideways) grows upwards until it touches it. Behind a crate against the back
 * wall, or between a trolley and the box under it, there is no way through, instead of one only
 * the feet fit.
 */
function sealSlits(props: PropInstance[], tiles: Uint8Array, cols: number): void {
  const above = (b: Rect): number => {
    let edge = -Infinity;
    const c0 = Math.floor(b.x / TILE);
    const c1 = Math.floor((b.x + b.w - 0.001) / TILE);
    for (let r = Math.floor(b.y / TILE); r >= 0; r--) {
      if ((r + 1) * TILE > b.y) continue;
      for (let c = c0; c <= c1; c++) if (tiles[r * cols + c]) edge = Math.max(edge, (r + 1) * TILE);
      if (edge > -Infinity) break;
    }
    for (const o of props) {
      const ob = o.box;
      const bottom = ob.y + ob.h;
      if (ob === b || bottom > b.y || ob.x >= b.x + b.w || ob.x + ob.w <= b.x) continue;
      edge = Math.max(edge, bottom);
    }
    return edge;
  };
  // Top to bottom, so a prop that grew counts as it is now for the one under it.
  for (const pr of [...props].sort((a, b) => a.box.y - b.box.y)) {
    const gap = pr.box.y - above(pr.box);
    if (gap > 0 && gap < SLIT) pr.box = { x: pr.box.x, y: pr.box.y - gap, w: pr.box.w, h: pr.box.h + gap };
  }
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
  /** Template letter of the floor's boss, which takes the `J` spot (src/data/rooms.ts floorBossOf). */
  boss?: string;
  /** Rooms of a generated floor: a combat room may also come mirrored left to right. */
  vary?: boolean;
  /** Most the room may spend on enemies (BUDGET_CAP if not given). */
  cap?: number;
  /**
   * M14b (h11a1): obstacle slots left empty may get a Regleta Sobrecargada (`r`), each with
   * `chance`, drawn from this generator of its own (the room's other draws do not move).
   */
  hazard?: { rng: Rng; chance: number };
}

/** Template digits `1`–`9`: groups of shelving that stand or not, each on its own, with the seed. */
export const isGroup = (ch: string): boolean => ch >= '1' && ch <= '9';

/** Chance that a group of shelving stands. */
export const GROUP_STANDS = 0.5;

/** Most a room can spend on enemies (a floor may have its own: src/data/rooms.ts budgetCapOf). */
export const BUDGET_CAP = 14;

/** Enemy budget of a combat room at a given depth (each enemy costs SlotEnemy.cost). */
export function enemyBudget(depth: number, cap = BUDGET_CAP): number {
  return Math.min(cap, 4 + depth * 1.5);
}

/** Obstacles an `o` slot can become ('.' = nothing), with weights. */
const OBSTACLES: readonly [string, number][] = [['.', 3], ['c', 3], ['b', 2], ['k', 1], ['v', 2]];

/**
 * Turns a floor template into a concrete room: picks which `e` slots get an enemy (within the
 * depth's budget, at least one if the template has slots) and what each `o` slot holds. Seeded:
 * the same rng state gives the same room.
 */
export function fillTemplate(t: RoomTemplate, rng: Rng, opts: FillOptions): RoomTemplate {
  const grid = t.rows.map((r) => [...r]);
  const enemySlots: Cell[] = [];
  const empty: Cell[] = [];
  grid.forEach((line, r) => line.forEach((ch, c) => {
    if (ch === 'e') enemySlots.push({ c, r });
    else if (ch === 'J' && opts.boss) line[c] = opts.boss;
    else if (ch === 'o') {
      line[c] = weighted(rng, OBSTACLES);
      if (line[c] === '.') empty.push({ c, r });
    }
  }));
  rng.shuffle(enemySlots);
  let budget = enemyBudget(opts.depth, opts.cap);
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
  // Drawn after the slots, so a template without groups fills exactly as before.
  const groups = [...new Set(grid.flat().filter(isGroup))].sort();
  const stands = new Map(groups.map((g) => [g, rng.chance(GROUP_STANDS)]));
  for (const line of grid) line.forEach((ch, c) => {
    if (isGroup(ch)) line[c] = stands.get(ch) ? '#' : '.';
  });
  if (opts.hazard && t.kind === 'combat') {
    let left = REGLETA_MAX;
    for (const cell of empty) {
      if (left > 0 && opts.hazard.rng.chance(opts.hazard.chance)) {
        grid[cell.r]![cell.c] = 'r';
        left--;
      }
    }
  }
  // Floor templates are symmetric around the doors (the centre of each wall), so a mirrored
  // room keeps them; the back wall stays at the top.
  // A belt's arrows turn round with it.
  if (opts.vary && t.kind === 'combat' && rng.chance(0.5)) {
    for (const line of grid) {
      line.reverse();
      line.forEach((ch, c) => (line[c] = MIRROR_CHARS[ch] ?? ch));
    }
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
