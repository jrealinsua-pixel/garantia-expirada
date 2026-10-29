// The simulation: pure, deterministic, no Phaser and no DOM. One call to step() is one tick of 1/60 s.
import { CHARACTERS } from '../data/characters.ts';
import { ROOMS, SLOT_ENEMIES_1, templatesOf } from '../data/rooms.ts';
import { WEAPONS } from '../data/weapons.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { CharacterDef, DummyDef, EnemyDef, RoomTemplate, WeaponDef } from '../data/types.ts';
import { updateEnemies } from './enemies.ts';
import { PATTERNS } from '../data/patterns.ts';
import { Rng } from './rng.ts';
import { expandPattern, isAimed, type BulletColor, type PatternDef, type ShotSpec } from './patterns.ts';
import { generateFloor, OPPOSITE, type Dir, type Floor } from './floor.ts';
import { buildRoom, doorApron, doorCells, fillTemplate, isWallAt, TILE, wallRectsNear, type Room, type RoomDoor } from './room.ts';
import { normalize, overlaps, pointInRect, type Rect } from './vec.ts';

export const DT = 1 / 60;
/** Height of the hand/gun pivot above the feet. */
export const BODY_HEIGHT = 14;
/** The floating hand orbits this point (feet minus this height) holding the gun. */
export const HAND_HEIGHT = 7;
/** Horizontal and vertical radius of that orbit. */
export const HAND_REACH = 10;
export const HAND_REACH_Y = 6;
/** Distance from the pivot to the muzzle. */
export const MUZZLE = 12;

export interface Input {
  /** Movement, each axis in [-1, 1]. */
  moveX: number;
  moveY: number;
  /** Aim point in world pixels. */
  aimX: number;
  aimY: number;
  fire: boolean;
  /** True only on the tick the button is pressed. */
  roll: boolean;
  reload: boolean;
  /** Test room only: name of a pattern (src/data/patterns.ts) the first dummy fires at the player. */
  debugPattern?: string;
}

export const NO_INPUT: Input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, fire: false, roll: false, reload: false };

export interface WeaponState {
  def: WeaponDef;
  ammo: number;
  cooldown: number;
  /** Seconds left of reload, 0 when not reloading. */
  reload: number;
}

export interface Player {
  def: CharacterDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  aim: number;
  facing: 1 | -1;
  hp: number;
  /** Seconds since the roll started, or -1 when not rolling. */
  rollT: number;
  rollDirX: number;
  rollDirY: number;
  rollCooldown: number;
  invulnerable: number;
  weapon: WeaponState;
  /** Distance walked, for the walk animation. */
  walked: number;
  /** Discount coupons picked up (the currency). */
  coupons: number;
}

export type PickupKind = 'cupon';

/** Something lying on the floor that the player picks up by walking over it. */
export interface Pickup {
  id: number;
  kind: PickupKind;
  value: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since it dropped: it can only be picked up (or pulled in) after PICKUP_DELAY. */
  age: number;
}

/** Seconds a fresh pickup scatters before it can be collected. */
export const PICKUP_DELAY = 0.45;
/** Pickups closer than this to the player fly towards it (px). */
export const PICKUP_MAGNET = 44;
const PICKUP_GRAB = 8;
const PICKUP_FRICTION = 260;
const PICKUP_RADIUS = 2;

export interface Bullet {
  id: number;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  damage: number;
  knockback: number;
  color: BulletColor;
  /** Seconds alive, for the wave motion. */
  age: number;
  /** Direction and speed along it (the wave adds a sideways component). */
  dir: number;
  speed: number;
  wave?: { amp: number; freq: number };
  accel?: number;
  /** Id of the enemy (or 'maniqui') that fired it, for the cause in the sick-leave report. */
  by?: string;
  /**
   * Height above the floor it flies at (px). Walls and props stop it where its shadow, h px
   * below, meets them: in the three-quarter view a bullet flying along the back wall is drawn
   * over the wall's face without touching it.
   */
  h: number;
}

/**
 * A pattern being fired: its shots come out of (x, y) as their delay passes. `t` starts at
 * -telegraph, so the warning (blink, sound, marker) plays before the first shot.
 */
export interface Emitter {
  x: number;
  y: number;
  t: number;
  next: number;
  shots: ShotSpec[];
  owner: 'player' | 'enemy';
  /** Seconds of warning before the first shot (0 = fire at once). */
  telegraph: number;
  /** Id of whoever fires it (a dummy, later an enemy), to make it blink. */
  source?: number;
  /** Kind of whoever fires it (an enemy id or 'maniqui'), copied to its bullets. */
  by?: string;
  /** Height of the muzzle above the floor, copied to its bullets (Bullet.h). */
  height: number;
  /** Direction towards the target when fired, and whether the pattern follows it. */
  aim: number;
  aimed: boolean;
  color: BulletColor;
}

/** Default warning for enemy attacks (s). Enough to react, short enough to stay tense. */
export const ENEMY_TELEGRAPH = 0.5;

export interface FireOptions {
  owner?: 'player' | 'enemy';
  telegraph?: number;
  source?: number;
  by?: string;
  /** Height of the muzzle above the floor (px, default 0). */
  height?: number;
}

export interface Dummy {
  id: number;
  def: DummyDef;
  x: number;
  y: number;
  /** Lean angle (radians) and its velocity: the dummy wobbles on its stand when hit. */
  lean: number;
  leanV: number;
  hitT: number;
  damageTaken: number;
}

export type EnemyState = 'walk' | 'warn' | 'charge' | 'brake' | 'stun' | 'idle' | 'fire' | 'off' | 'blink' | 'gone';

export interface Enemy {
  id: number;
  def: EnemyDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: EnemyState;
  /** Seconds in the current state, and how long it lasts. */
  t: number;
  until: number;
  /** Locked direction of the current attack. */
  dirX: number;
  dirY: number;
  hitT: number;
  damageTaken: number;
  /** Seconds before it can push the player again. */
  contactCooldown: number;
  /** Distance travelled, for the walk animation. */
  moved: number;
  /** The enemy it escorts (see EnemyDef.escort), or -1. */
  owner: number;
  /** Free angle for brains that circle something (the moth's place in its orbit). */
  phase: number;
  /** Direction of the last bullet that hit it: it comes apart that way. */
  lastHit: number;
  /** Has gone into TURBO (chasers low on life). */
  turbo?: boolean;
  /** Where a blinker will switch back on (while it is switching off or gone). */
  dest?: { x: number; y: number };
  /** Seconds before being hit makes a blinker vanish again; and the damage it had last tick. */
  blinkCd?: number;
  seenDamage?: number;
}

export type SimEvent =
  | { type: 'shot'; x: number; y: number; angle: number; weapon: string }
  | { type: 'hit'; x: number; y: number; angle: number; damage: number; target: number }
  | { type: 'bulletWall'; x: number; y: number; angle: number }
  | { type: 'bulletFade'; x: number; y: number }
  | { type: 'roll'; x: number; y: number; dirX: number; dirY: number }
  | { type: 'reloadStart'; time: number }
  | { type: 'reloadEnd' }
  | { type: 'empty' }
  | { type: 'charge'; x: number; y: number; dirX: number; dirY: number; source: number }
  | { type: 'brake'; x: number; y: number; source: number }
  | { type: 'bonk'; x: number; y: number; dirX: number; dirY: number; source: number }
  | { type: 'contact'; x: number; y: number; dirX: number; dirY: number; source: number }
  | { type: 'switchOn'; x: number; y: number; source: number }
  | { type: 'dart'; x: number; y: number; dirX: number; dirY: number; source: number }
  /** A chaser (the mixer) lunges, and goes into TURBO when low on life. */
  | { type: 'lunge'; x: number; y: number; dirX: number; dirY: number; source: number }
  | { type: 'turbo'; x: number; y: number; source: number }
  /** A blinker (the remote) switches off at (x, y) to reappear at (tx, ty); then switches on there. */
  | { type: 'blinkOut'; x: number; y: number; tx: number; ty: number; source: number }
  | { type: 'blinkIn'; x: number; y: number; source: number }
  /** An enemy came apart. `alt` is how high it flew; `angle` the direction of the killing shot. */
  | { type: 'death'; x: number; y: number; alt: number; angle: number; enemy: string; source: number }
  | { type: 'pickup'; x: number; y: number; kind: PickupKind; value: number; total: number }
  | { type: 'restock' }
  /** The shutters of the room come down (shut) or roll up. */
  | { type: 'doors'; shut: boolean }
  /** The player walked through a door into floor room `id` (coming in through its `via` wall). */
  | { type: 'room'; id: number; via: Dir }
  /** The player lost `damage` life (now `hp`); `dirX, dirY` is where the blow came from towards it. */
  | { type: 'hurt'; x: number; y: number; damage: number; hp: number; dirX: number; dirY: number; source: number }
  /** The player has no life left: the run is over. */
  | { type: 'down'; x: number; y: number; source: number; cause: DownCause }
  | { type: 'telegraph'; x: number; y: number; time: number; aim: number; aimed: boolean; color: BulletColor; source?: number };

export interface World {
  seed: string;
  tick: number;
  rng: Rng;
  room: Room;
  player: Player;
  bullets: Bullet[];
  dummies: Dummy[];
  enemies: Enemy[];
  emitters: Emitter[];
  pickups: Pickup[];
  events: SimEvent[];
  nextId: number;
  /** Enemies taken apart so far. */
  kills: number;
  /** Seconds the room has been empty, counting towards its restock. */
  emptyT: number;
  /** Whether this world spawns the room's enemies at all. */
  spawnsEnemies: boolean;
  /** The player is down: input is ignored and nothing can hurt it any more. */
  over: boolean;
  /** Tests and tools only: nothing hurts the player. */
  noDamage: boolean;
  /** What took the player down (null while it is up), for the sick-leave report. */
  cause: DownCause | null;
  /**
   * The room's shutters are down: in a combat room until its last enemy falls; in the test room,
   * always (nobody leaves the test room).
   */
  doorsShut: boolean;
  /** The floor being played, or null for a single room (the test room, ?sala=). */
  floor: FloorRun | null;
}

/** What each room of a floor is and what is left in it. */
export interface FloorRoomState {
  /** Its template with the slots already filled (enemies and obstacles for its depth). */
  template: RoomTemplate;
  /** Built the first time the player walks in, and kept. */
  room: Room | null;
  visited: boolean;
  /** No enemies left (rooms without combat are clear from the start). */
  cleared: boolean;
  /** Coupons left lying on its floor when the player walked out. */
  pickups: Pickup[];
}

export interface FloorRun {
  layout: Floor;
  /** Id of the room the player is in. */
  current: number;
  /** Indexed by room id. */
  rooms: FloorRoomState[];
}

/** What dealt the last blow: an enemy id (or 'maniqui'), and whether it was a bullet or a body. */
export interface DownCause {
  by: string;
  how: 'bullet' | 'contact';
}

/** Seconds the player cannot be hurt again after a hit (it blinks meanwhile). */
export const HURT_IFRAMES = 1.1;
/** Enemy bullets this close to the player vanish when it is hurt, so one mistake costs one hit. */
export const HURT_CLEAR_RADIUS = 56;
/** The player's hit box for enemy bullets: a small circle on the body, smaller than the sprite. */
export const PLAYER_HURT_RADIUS = 4;
export const PLAYER_HURT_Y = 9;

export interface WorldOptions {
  seed: string;
  room?: string;
  /** A concrete template (a filled floor room) instead of one of ROOMS by id. */
  template?: RoomTemplate;
  /** Floor rooms picked by id have their slots filled for this depth (default 3). */
  depth?: number;
  /** Walls with a door (default: see buildRoom). */
  doors?: readonly Dir[];
  character?: string;
  /** Leave the room's enemies out (tests that only need the player and the dummies). */
  noEnemies?: boolean;
  /** Play a whole generated floor (seeded by `seed`), starting in its entrance. Ignores room and template. */
  floor?: boolean;
}

export function createWorld(opts: WorldOptions): World {
  const floor = opts.floor ? planFloor(opts.seed) : null;
  let tpl = floor ? floor.rooms[floor.current]!.template : opts.template ?? ROOMS[opts.room ?? 'sala-pruebas'];
  if (!tpl) throw new Error(`Unknown room ${opts.room}`);
  if (!floor && !opts.template && tpl.kind) tpl = fillTemplate(tpl, new Rng(`sala:${opts.seed}`), { depth: opts.depth ?? 3, pool: SLOT_ENEMIES_1 });
  const def = CHARACTERS[opts.character ?? 'tostadora'];
  if (!def) throw new Error(`Unknown character ${opts.character}`);
  const wdef = WEAPONS[def.startWeapon];
  if (!wdef) throw new Error(`Unknown weapon ${def.startWeapon}`);
  const room = floor ? floorRoomOf(floor, floor.current) : buildRoom(tpl, opts.doors);
  let nextId = 1;
  const dummies: Dummy[] = room.dummySpawns.map((s) => ({ id: nextId++, def: s.def, x: s.x, y: s.y, lean: 0, leanV: 0, hitT: 0, damageTaken: 0 }));
  const w: World = {
    seed: opts.seed,
    tick: 0,
    rng: new Rng(opts.seed),
    room,
    player: {
      def,
      x: room.playerStart.x,
      y: room.playerStart.y,
      vx: 0,
      vy: 0,
      aim: 0,
      facing: 1,
      hp: def.maxHp,
      rollT: -1,
      rollDirX: 1,
      rollDirY: 0,
      rollCooldown: 0,
      invulnerable: 0,
      weapon: { def: wdef, ammo: wdef.magazine, cooldown: 0, reload: 0 },
      walked: 0,
      coupons: 0,
    },
    bullets: [],
    dummies,
    enemies: [],
    emitters: [],
    pickups: [],
    events: [],
    nextId,
    kills: 0,
    emptyT: 0,
    spawnsEnemies: !opts.noEnemies,
    over: false,
    noDamage: false,
    cause: null,
    doorsShut: room.kind === 'test',
    floor,
  };
  if (floor) {
    floor.rooms[floor.current]!.visited = true;
    setDoorTiles(w, true);
    return w;
  }
  if (w.spawnsEnemies) spawnRoomEnemies(w);
  // Walking into a combat room brings its shutters down until the last enemy falls.
  if (room.kind === 'combat' && w.enemies.length > 0) w.doorsShut = true;
  return w;
}

/**
 * Lays out a floor and decides what every room is: a template of its kind (combat templates
 * are dealt from a shuffled deck, so a floor repeats one only when it runs out) with its slots
 * filled for the room's depth. Seeded by the world's seed.
 */
function planFloor(seed: string): FloorRun {
  const layout = generateFloor(seed);
  const rng = new Rng(`salas:${seed}`);
  const decks = new Map<string, RoomTemplate[]>();
  const deal = (kind: NonNullable<RoomTemplate['kind']>): RoomTemplate => {
    let deck = decks.get(kind);
    if (!deck || deck.length === 0) {
      deck = rng.shuffle([...templatesOf(kind)]);
      if (deck.length === 0) throw new Error(`No templates for ${kind} rooms`);
      decks.set(kind, deck);
    }
    return deck.pop()!;
  };
  const rooms = layout.rooms.map((fr): FloorRoomState => {
    const template = fillTemplate(deal(fr.kind), rng.fork(`sala${fr.id}`), { depth: Math.max(1, fr.depth), pool: SLOT_ENEMIES_1 });
    return { template, room: null, visited: false, cleared: fr.kind !== 'combat', pickups: [] };
  });
  return { layout, current: layout.start, rooms };
}

/** The built room of floor room `id` (built on first use), with openings for its normal doors. */
function floorRoomOf(f: FloorRun, id: number): Room {
  const st = f.rooms[id]!;
  st.room ??= buildRoom(st.template, f.layout.rooms[id]!.doors.filter((d) => !d.secret).map((d) => d.dir));
  return st.room;
}

/** On a floor, open doors are floor tiles the player can walk through; shut ones are wall. */
function setDoorTiles(w: World, open: boolean): void {
  if (!w.floor) return;
  const r = w.room;
  for (const d of r.doors) for (const c of doorCells(r.cols, r.rows, d.dir)) r.tiles[c.r * r.cols + c.c] = open ? 0 : 1;
}

/** Where the player stands after coming in through the `dir` wall: just inside the door, on clear floor. */
export function entrySpot(room: Room, dir: Dir): { x: number; y: number } {
  const a = doorApron(room.cols, room.rows, dir);
  const p = a[0]!;
  const q = a[1]!;
  return { x: ((p.c + q.c + 1) * TILE) / 2, y: ((p.r + q.r + 1) * TILE) / 2 + 4 };
}

/**
 * The player is far enough into an open door to leave through it: past the inner half of the
 * door's outer tile (north doors: into the top row of the back wall).
 */
export function leavingThrough(w: World): RoomDoor | null {
  if (!w.floor || w.doorsShut || w.over) return null;
  const p = w.player;
  for (const d of w.room.doors) {
    if (!pointInRect(p.x, p.y, d)) continue;
    if (d.dir === 'N' && p.y < d.y + TILE) return d;
    if (d.dir === 'S' && p.y > d.y + TILE / 2) return d;
    if (d.dir === 'W' && p.x < d.x + TILE / 2) return d;
    if (d.dir === 'E' && p.x > d.x + TILE / 2) return d;
  }
  return null;
}

/**
 * Moves the player into floor room `id` through its `via` wall: what was left in the old room
 * stays there (its coupons), bullets and attacks in the air vanish, and an uncleared combat room
 * brings its enemies and shuts its shutters.
 */
export function enterRoom(w: World, id: number, via: Dir): void {
  const f = w.floor;
  if (!f) throw new Error('enterRoom needs a floor');
  f.rooms[f.current]!.pickups = w.pickups;
  f.current = id;
  const st = f.rooms[id]!;
  st.visited = true;
  w.room = floorRoomOf(f, id);
  w.bullets = [];
  w.emitters = [];
  w.enemies = [];
  w.dummies = [];
  w.pickups = st.pickups;
  st.pickups = [];
  w.emptyT = 0;
  const p = w.player;
  const at = entrySpot(w.room, via);
  p.x = at.x;
  p.y = at.y;
  // Keep walking in the same direction, but a roll ends at the threshold.
  if (isRolling(p)) {
    p.rollT = -1;
    p.rollCooldown = p.def.rollCooldown;
  }
  p.vx *= 0.5;
  p.vy *= 0.5;
  if (!st.cleared && w.spawnsEnemies) spawnRoomEnemies(w);
  if (w.enemies.length === 0) st.cleared = true;
  w.doorsShut = !st.cleared;
  setDoorTiles(w, !w.doorsShut);
  w.events.push({ type: 'room', id, via });
  if (w.doorsShut) w.events.push({ type: 'doors', shut: true });
}

/** Leaves through the door the player is walking into, if any. */
function updateExits(w: World): void {
  const d = leavingThrough(w);
  if (!d || !w.floor) return;
  const here = w.floor.layout.rooms[w.floor.current]!;
  const door = here.doors.find((x) => x.dir === d.dir && !x.secret);
  if (door) enterRoom(w, door.to, OPPOSITE[d.dir]);
}

/** Where the rest of a pack stands around its spawn point (px). */
const PACK_OFFSETS: readonly (readonly [number, number])[] = [[-22, 14], [22, 14], [0, 28], [-22, -14], [22, -14]];

/** Puts the room's enemies (and their escorts and packs) at their spawn points. */
function spawnRoomEnemies(w: World): void {
  for (const s of w.room.enemySpawns) {
    const en = spawnEnemy(w.nextId++, s.def, s.x, s.y);
    w.enemies.push(en);
    // Packs: the rest of the group around the spawn point, each on clear floor.
    for (let i = 1; i < (s.def.pack ?? 1); i++) {
      const [ox, oy] = PACK_OFFSETS[(i - 1) % PACK_OFFSETS.length]!;
      const spot = freeSpot(w, s.x + ox, s.y + oy, s.def.footRadius);
      const mate = spawnEnemy(w.nextId++, s.def, spot.x, spot.y);
      mate.until += i * 0.45;
      w.enemies.push(mate);
    }
    if (s.def.escort) {
      const edef = ENEMIES[s.def.escort];
      if (!edef) throw new Error(`Unknown escort ${s.def.escort}`);
      const at = freeSpot(w, s.x + 18, s.y - 4, edef.footRadius);
      const esc = spawnEnemy(w.nextId++, edef, at.x, at.y);
      esc.owner = en.id;
      w.enemies.push(esc);
    }
  }
}

export function spawnEnemy(id: number, def: EnemyDef, x: number, y: number): Enemy {
  const b = def.brain;
  let state: EnemyState = 'walk';
  let until = 1;
  if (b.kind === 'turret') {
    state = b.startup ? 'off' : 'idle';
    until = b.startup ?? 1;
  } else if (b.kind === 'moth') {
    state = 'idle';
    until = b.interval[0];
  } else if (b.kind === 'chaser') {
    // Its first lunge comes sooner than the next ones.
    until = b.cooldown[0] * 0.5;
  } else if (b.kind === 'blinker') {
    state = 'idle';
    until = b.interval[0];
  }
  return { id, def, x, y, vx: 0, vy: 0, facing: -1, state, t: 0, until, dirX: 1, dirY: 0, hitT: 0, damageTaken: 0, contactCooldown: 0, moved: 0, owner: -1, phase: 0, lastHit: 0 };
}

/** Pixels above the ground an enemy is drawn (and hit) at: only flying ones are off the floor. */
export function enemyAltitude(en: Enemy): number {
  return en.def.brain.kind === 'moth' ? en.def.brain.altitude : 0;
}

/** Brains whose own 'warn' state is a telegraph (the turret's comes from its emitter). */
const warnsByItself = (en: Enemy): boolean => en.state === 'warn' && en.def.brain.kind !== 'turret';

export const isRolling = (p: Player): boolean => p.rollT >= 0;

/** Where the floating hand holding the gun is. */
export function gunPivot(p: Player): { x: number; y: number } {
  return { x: p.x + Math.cos(p.aim) * HAND_REACH, y: p.y - HAND_HEIGHT + Math.sin(p.aim) * HAND_REACH_Y };
}

export function playerFeetBox(p: { x: number; y: number }, r: number): Rect {
  return { x: p.x - r, y: p.y - 3, w: r * 2, h: 4 };
}

export function dummyHurtBox(d: Dummy | Enemy): Rect {
  return { x: d.x + d.def.hurt.x, y: d.y + d.def.hurt.y, w: d.def.hurt.w, h: d.def.hurt.h };
}

function solidsNear(w: World, box: Rect): Rect[] {
  const out: Rect[] = [];
  const probe = { x: box.x - 4, y: box.y - 4, w: box.w + 8, h: box.h + 8 };
  wallRectsNear(w.room, probe, out);
  for (const pr of w.room.props) if (overlaps(pr.box, probe)) out.push(pr.box);
  for (const d of w.dummies) {
    const b = { x: d.x + d.def.box.x, y: d.y + d.def.box.y, w: d.def.box.w, h: d.def.box.h };
    if (overlaps(b, probe)) out.push(b);
  }
  return out;
}

/**
 * Moves a feet box of half-width `r`, sliding along whatever is solid. Zeroes the velocity on
 * the axis that hits something and says which axes did.
 */
export function slide(w: World, b: { x: number; y: number; vx: number; vy: number }, r: number, dx: number, dy: number): { hitX: boolean; hitY: boolean } {
  const eps = 0.001;
  let hitX = false;
  let hitY = false;
  if (dx !== 0) {
    b.x += dx;
    const box = playerFeetBox(b, r);
    for (const s of solidsNear(w, box)) {
      if (!overlaps(playerFeetBox(b, r), s)) continue;
      b.x = dx > 0 ? s.x - r - eps : s.x + s.w + r + eps;
      b.vx = 0;
      hitX = true;
    }
  }
  if (dy !== 0) {
    b.y += dy;
    const box = playerFeetBox(b, r);
    for (const s of solidsNear(w, box)) {
      if (!overlaps(playerFeetBox(b, r), s)) continue;
      // feet box spans [y-3, y+1]
      b.y = dy > 0 ? s.y - 1 - eps : s.y + s.h + 3 + eps;
      b.vy = 0;
      hitY = true;
    }
  }
  return { hitX, hitY };
}

function updatePlayer(w: World, input: Input): void {
  const p = w.player;
  const d = p.def;
  p.rollCooldown = Math.max(0, p.rollCooldown - DT);
  p.invulnerable = Math.max(0, p.invulnerable - DT);

  // Aim from the centre of the hand's orbit, so bullets go where the crosshair is.
  const ax = input.aimX - p.x;
  const ay = input.aimY - (p.y - HAND_HEIGHT);
  if (ax * ax + ay * ay > 4) p.aim = Math.atan2(ay, ax);
  p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;

  let mx = Math.max(-1, Math.min(1, input.moveX));
  let my = Math.max(-1, Math.min(1, input.moveY));
  const ml = Math.hypot(mx, my);
  if (ml > 1) {
    mx /= ml;
    my /= ml;
  }

  if (input.roll && !isRolling(p) && p.rollCooldown <= 0) {
    const dir = ml > 0.1 ? normalize(mx, my) : { x: Math.cos(p.aim), y: Math.sin(p.aim) };
    p.rollT = 0;
    p.rollDirX = dir.x;
    p.rollDirY = dir.y;
    p.invulnerable = d.rollIframes;
    w.events.push({ type: 'roll', x: p.x, y: p.y, dirX: dir.x, dirY: dir.y });
  }

  if (isRolling(p)) {
    const k = p.rollT / d.rollTime;
    // Full speed for most of the roll, then a quick ease-out so the landing reads.
    const speed = d.rollSpeed * (k < 0.7 ? 1 : 1 - ((k - 0.7) / 0.3) * 0.65);
    p.vx = p.rollDirX * speed;
    p.vy = p.rollDirY * speed;
    p.rollT += DT;
    if (p.rollT >= d.rollTime) {
      p.rollT = -1;
      p.rollCooldown = d.rollCooldown;
      // Keep part of the momentum so the exit is not a dead stop.
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
  } else {
    const tx = mx * d.speed;
    const ty = my * d.speed;
    const dvx = tx - p.vx;
    const dvy = ty - p.vy;
    const dl = Math.hypot(dvx, dvy);
    const maxStep = (ml > 0.05 ? d.accel : d.friction) * DT;
    if (dl <= maxStep) {
      p.vx = tx;
      p.vy = ty;
    } else {
      p.vx += (dvx / dl) * maxStep;
      p.vy += (dvy / dl) * maxStep;
    }
  }

  updateWeapon(w, input);

  const ox = p.x;
  const oy = p.y;
  slide(w, p, p.def.footRadius, p.vx * DT, p.vy * DT);
  if (!isRolling(p)) p.walked += Math.hypot(p.x - ox, p.y - oy);
}

function updateWeapon(w: World, input: Input): void {
  const p = w.player;
  const ws = p.weapon;
  const def = ws.def;
  ws.cooldown = Math.max(0, ws.cooldown - DT);
  if (ws.reload > 0) {
    ws.reload -= DT;
    if (ws.reload <= 0) {
      ws.reload = 0;
      ws.ammo = def.magazine;
      w.events.push({ type: 'reloadEnd' });
    }
    return;
  }
  if (input.reload && ws.ammo < def.magazine) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'reloadStart', time: def.reloadTime });
    return;
  }
  if (!input.fire || isRolling(p) || ws.cooldown > 0) return;
  if (ws.ammo <= 0) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'empty' }, { type: 'reloadStart', time: def.reloadTime });
    return;
  }
  ws.ammo--;
  ws.cooldown = 1 / def.fireRate;
  const pivot = gunPivot(p);
  const mx = pivot.x + Math.cos(p.aim) * MUZZLE;
  const my = pivot.y + Math.sin(p.aim) * MUZZLE;
  for (let i = 0; i < def.pellets; i++) {
    const a = p.aim + ((w.rng.range(-1, 1) * def.spreadDeg) / 180) * Math.PI;
    w.bullets.push({
      id: w.nextId++,
      owner: 'player',
      x: mx,
      y: my,
      vx: Math.cos(a) * def.bulletSpeed,
      vy: Math.sin(a) * def.bulletSpeed,
      r: def.bulletRadius,
      life: def.bulletLife,
      damage: def.damage,
      knockback: def.knockback,
      color: 'red',
      age: 0,
      dir: a,
      speed: def.bulletSpeed,
      h: HAND_HEIGHT,
    });
  }
  p.vx -= Math.cos(p.aim) * def.recoil;
  p.vy -= Math.sin(p.aim) * def.recoil;
  w.events.push({ type: 'shot', x: mx, y: my, angle: p.aim, weapon: def.id });
  if (ws.ammo === 0) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'reloadStart', time: def.reloadTime });
  }
}

function updateBullets(w: World): void {
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    b.life -= DT;
    if (b.life <= 0) {
      w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
      continue;
    }
    b.age += DT;
    if (b.accel) b.speed = Math.max(10, b.speed + b.accel * DT);
    if (b.wave || b.accel) {
      const side = b.wave ? b.wave.amp * 2 * Math.PI * b.wave.freq * Math.cos(2 * Math.PI * b.wave.freq * b.age) : 0;
      b.vx = Math.cos(b.dir) * b.speed - Math.sin(b.dir) * side;
      b.vy = Math.sin(b.dir) * b.speed + Math.cos(b.dir) * side;
    }
    // Two sub-steps keep fast bullets from skipping thin things.
    let alive = true;
    for (let s = 0; s < 2 && alive; s++) {
      b.x += (b.vx * DT) / 2;
      b.y += (b.vy * DT) / 2;
      const angle = Math.atan2(b.vy, b.vx);
      const fy = b.y + b.h;
      if (isWallAt(w.room, b.x, fy) || w.room.props.some((pr) => pr.def.blocksBullets && pointInRect(b.x, fy, pr.box))) {
        w.events.push({ type: 'bulletWall', x: b.x, y: b.y, angle });
        alive = false;
        break;
      }
      if (b.owner === 'enemy') {
        const p = w.player;
        const dx = b.x - p.x;
        const dy = b.y - (p.y - PLAYER_HURT_Y);
        const rr = b.r + PLAYER_HURT_RADIUS;
        if (dx * dx + dy * dy < rr * rr && canBeHurt(w)) {
          const d = normalize(b.vx, b.vy);
          hurtPlayer(w, b.damage, -1, d.x, d.y, { by: b.by ?? 'desconocido', how: 'bullet' });
          alive = false;
          break;
        }
      }
      if (b.owner === 'player') {
        for (const en of w.enemies) {
          if (isDead(en) || en.state === 'gone') continue;
          const hb = dummyHurtBox(en);
          if (b.x + b.r > hb.x && b.x - b.r < hb.x + hb.w && b.y + b.r > hb.y && b.y - b.r < hb.y + hb.h) {
            en.hitT = 0.12;
            en.damageTaken += b.damage;
            en.lastHit = angle;
            const k = b.knockback * en.def.knockbackScale;
            en.vx += Math.cos(angle) * k;
            en.vy += Math.sin(angle) * k;
            w.events.push({ type: 'hit', x: b.x, y: b.y, angle, damage: b.damage, target: en.id });
            alive = false;
            break;
          }
        }
        if (!alive) break;
        for (const d of w.dummies) {
          const hb = dummyHurtBox(d);
          if (b.x + b.r > hb.x && b.x - b.r < hb.x + hb.w && b.y + b.r > hb.y && b.y - b.r < hb.y + hb.h) {
            d.hitT = 0.12;
            d.damageTaken += b.damage;
            d.leanV += Math.cos(angle) * b.knockback * 0.06;
            w.events.push({ type: 'hit', x: b.x, y: b.y, angle, damage: b.damage, target: d.id });
            alive = false;
            break;
          }
        }
      }
    }
    if (alive) keep.push(b);
  }
  w.bullets = keep;
}

/** Starts firing a pattern from (x, y). `aim` is the angle towards the target. */
export function firePattern(w: World, def: PatternDef, x: number, y: number, aim: number, opts: FireOptions = {}): Emitter {
  const telegraph = Math.max(0, opts.telegraph ?? 0);
  const shots = expandPattern(def, aim, w.rng);
  const e: Emitter = {
    x,
    y,
    t: -telegraph,
    next: 0,
    shots,
    owner: opts.owner ?? 'enemy',
    telegraph,
    height: opts.height ?? 0,
    aim,
    aimed: isAimed(def),
    color: shots[0]?.color ?? 'red',
  };
  if (opts.source !== undefined) e.source = opts.source;
  if (opts.by !== undefined) e.by = opts.by;
  w.emitters.push(e);
  if (telegraph > 0) {
    const ev: SimEvent = { type: 'telegraph', x, y, time: telegraph, aim, aimed: e.aimed, color: e.color };
    if (e.source !== undefined) ev.source = e.source;
    w.events.push(ev);
  }
  return e;
}

/** How far into its warning an emitter is: 0 just started, 1 about to fire; -1 if it is not warning. */
export function telegraphProgress(e: Emitter): number {
  if (e.telegraph <= 0 || e.t >= 0) return -1;
  return 1 + e.t / e.telegraph;
}

/** The strongest warning coming from `source` right now (see telegraphProgress), or -1. */
export function sourceTelegraph(w: World, source: number): number {
  let best = -1;
  for (const e of w.emitters) if (e.source === source) best = Math.max(best, telegraphProgress(e));
  for (const en of w.enemies) if (en.id === source && warnsByItself(en)) best = Math.max(best, Math.min(1, en.t / en.until));
  return best;
}

/** Something about to attack, for the renderer: where, how far into the warning, which way. */
export interface Warning {
  x: number;
  y: number;
  k: number;
  aim: number;
  aimed: boolean;
  color: BulletColor;
  /** Bullets will come out of (x, y): draw the closing ring. A charge has no ring but a long path. */
  bullets: boolean;
  source?: number;
}

export function activeWarnings(w: World): Warning[] {
  const out: Warning[] = [];
  for (const e of w.emitters) {
    const k = telegraphProgress(e);
    if (k < 0) continue;
    const wn: Warning = { x: e.x, y: e.y, k, aim: e.aim, aimed: e.aimed, color: e.color, bullets: true };
    if (e.source !== undefined) wn.source = e.source;
    out.push(wn);
  }
  for (const en of w.enemies) {
    if (!warnsByItself(en)) continue;
    out.push({ x: en.x, y: en.y - 2 - enemyAltitude(en), k: Math.min(1, en.t / en.until), aim: Math.atan2(en.dirY, en.dirX), aimed: true, color: 'red', bullets: false, source: en.id });
  }
  return out;
}

export const ENEMY_BULLET_LIFE = 6;
const ENEMY_BULLET_RADIUS = 2.5;

function updateEmitters(w: World): void {
  const keep: Emitter[] = [];
  for (const e of w.emitters) {
    while (e.next < e.shots.length && e.shots[e.next]!.delay <= e.t + 1e-9) {
      const s = e.shots[e.next++]!;
      const b: Bullet = {
        id: w.nextId++,
        owner: e.owner,
        x: e.x,
        y: e.y,
        vx: Math.cos(s.angle) * s.speed,
        vy: Math.sin(s.angle) * s.speed,
        r: ENEMY_BULLET_RADIUS,
        life: ENEMY_BULLET_LIFE,
        damage: 1,
        knockback: 0,
        color: s.color,
        age: 0,
        dir: s.angle,
        speed: s.speed,
        h: e.height,
      };
      if (s.wave) b.wave = s.wave;
      if (s.accel) b.accel = s.accel;
      if (e.by) b.by = e.by;
      w.bullets.push(b);
    }
    e.t += DT;
    if (e.next < e.shots.length) keep.push(e);
  }
  w.emitters = keep;
}

function updateDummies(w: World): void {
  for (const d of w.dummies) {
    d.hitT = Math.max(0, d.hitT - DT);
    // Damped spring back to upright.
    d.leanV += -d.lean * 140 * DT;
    d.leanV *= Math.pow(0.02, DT);
    d.lean += d.leanV * DT;
    d.lean = Math.max(-0.5, Math.min(0.5, d.lean));
  }
}

/** Rolling (its i-frames) and the blink after a hit protect the player. */
export const canBeHurt = (w: World): boolean => !w.over && !w.noDamage && w.player.invulnerable <= 0;

/**
 * Takes `damage` life from the player (1 = half a heart) if it can be hurt: blink time, nearby
 * enemy bullets cleared, and the run ends at 0. `dirX, dirY` is the direction of the blow.
 */
export function hurtPlayer(w: World, damage: number, source: number, dirX: number, dirY: number, cause: DownCause = { by: 'desconocido', how: 'contact' }): boolean {
  if (!canBeHurt(w) || damage <= 0) return false;
  const p = w.player;
  p.hp = Math.max(0, p.hp - damage);
  p.invulnerable = HURT_IFRAMES;
  w.events.push({ type: 'hurt', x: p.x, y: p.y - PLAYER_HURT_Y, damage, hp: p.hp, dirX, dirY, source });
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    if (b.owner === 'enemy' && Math.hypot(b.x - p.x, b.y - (p.y - PLAYER_HURT_Y)) < HURT_CLEAR_RADIUS) w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
    else keep.push(b);
  }
  w.bullets = keep;
  if (p.hp <= 0) {
    w.over = true;
    p.rollT = -1;
    p.weapon.reload = 0;
    w.cause = cause;
    w.events.push({ type: 'down', x: p.x, y: p.y, source, cause });
  }
  return true;
}

export const isDead = (en: Enemy): boolean => en.damageTaken >= en.def.hp;

/** Takes apart the enemies with no life left: event, loot, and out of the world. */
function reapEnemies(w: World): void {
  if (!w.enemies.some(isDead)) return;
  const keep: Enemy[] = [];
  for (const en of w.enemies) {
    if (!isDead(en)) {
      keep.push(en);
      continue;
    }
    w.kills++;
    // Whatever it was about to fire dies with it.
    w.emitters = w.emitters.filter((e) => e.source !== en.id);
    const alt = enemyAltitude(en);
    w.events.push({ type: 'death', x: en.x, y: en.y, alt, angle: en.lastHit, enemy: en.def.id, source: en.id });
    const [lo, hi] = en.def.loot.coupons;
    const n = w.rng.int(lo, hi);
    // Loot starts on clear floor: right under the enemy, or the nearest free spot if it flew
    // over a box or stood with its feet against a wall.
    const spot = n > 0 ? freeSpot(w, en.x, en.y, PICKUP_RADIUS) : { x: en.x, y: en.y };
    for (let i = 0; i < n; i++) {
      // Scattered around, a bit more in the direction of the killing shot.
      const a = en.lastHit + w.rng.range(-1.6, 1.6);
      const sp = w.rng.range(50, 110);
      w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: spot.x, y: spot.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
    }
  }
  w.enemies = keep;
}

function updatePickups(w: World): void {
  if (w.pickups.length === 0) return;
  const p = w.player;
  const keep: Pickup[] = [];
  for (const k of w.pickups) {
    k.age += DT;
    const dx = p.x - k.x;
    const dy = p.y - 2 - k.y;
    const d = Math.hypot(dx, dy);
    if (k.age >= PICKUP_DELAY && d < PICKUP_GRAB) {
      p.coupons += k.value;
      w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: k.value, total: p.coupons });
      continue;
    }
    if (k.age >= PICKUP_DELAY && d < PICKUP_MAGNET) {
      // Pulled in faster the closer it gets; it slides round pillars and boxes instead of
      // flying through them.
      const sp = 90 + (1 - d / PICKUP_MAGNET) * 160;
      k.vx = (dx / d) * sp;
      k.vy = (dy / d) * sp;
      slide(w, k, PICKUP_RADIUS, k.vx * DT, k.vy * DT);
    } else {
      const v = Math.hypot(k.vx, k.vy);
      const nv = Math.max(0, v - PICKUP_FRICTION * DT);
      if (v > 0) {
        k.vx *= nv / v;
        k.vy *= nv / v;
      }
      slide(w, k, PICKUP_RADIUS, k.vx * DT, k.vy * DT);
    }
    keep.push(k);
  }
  w.pickups = keep;
}

/** Whether a feet box of radius `r` at (x, y) touches no wall or prop. */
export function isClear(w: World, x: number, y: number, r: number): boolean {
  const box = playerFeetBox({ x, y }, r);
  return !solidsNear(w, box).some((s) => overlaps(box, s));
}

/** The nearest point to (x, y) where a feet box of radius `r` touches no wall or prop (rings of 4 px). */
export function freeSpot(w: World, x: number, y: number, r: number): { x: number; y: number } {
  const clear = (px: number, py: number): boolean => !solidsNear(w, playerFeetBox({ x: px, y: py }, r)).some((s) => overlaps(playerFeetBox({ x: px, y: py }, r), s));
  if (clear(x, y)) return { x, y };
  for (let d = 4; d <= 48; d += 4) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      if (clear(px, py)) return { x: px, y: py };
    }
  }
  return { x, y };
}

/** Rooms that restock bring all their enemies back a while after the last one falls. */
function updateRestock(w: World): void {
  if (!w.spawnsEnemies || w.room.restock <= 0 || w.room.enemySpawns.length === 0) return;
  if (w.enemies.length > 0) {
    w.emptyT = 0;
    return;
  }
  w.emptyT += DT;
  if (w.emptyT >= w.room.restock) {
    w.emptyT = 0;
    spawnRoomEnemies(w);
    w.events.push({ type: 'restock' });
  }
}

/** A combat room's shutters roll up once its last enemy falls. */
function updateDoors(w: World): void {
  if (w.doorsShut && w.room.kind === 'combat' && w.enemies.length === 0) {
    w.doorsShut = false;
    w.events.push({ type: 'doors', shut: false });
    if (w.floor) w.floor.rooms[w.floor.current]!.cleared = true;
    setDoorTiles(w, true);
  }
}

export function step(w: World, input: Input): void {
  w.events = [];
  // Once down, the toaster lies there: the room goes on without it.
  updatePlayer(w, w.over ? { ...NO_INPUT, aimX: w.player.x + Math.cos(w.player.aim), aimY: w.player.y - HAND_HEIGHT + Math.sin(w.player.aim) } : input);
  if (input.debugPattern && !w.over) {
    const def = PATTERNS[input.debugPattern];
    const d = w.dummies[0];
    if (def && d) {
      const y = d.y - 20;
      firePattern(w, def, d.x, y, Math.atan2(w.player.y - HAND_HEIGHT - y, w.player.x - d.x), { telegraph: ENEMY_TELEGRAPH, source: d.id, by: 'maniqui', height: 20 });
    }
  }
  updateEmitters(w);
  updateBullets(w);
  reapEnemies(w);
  updateDummies(w);
  updateEnemies(w);
  updatePickups(w);
  updateRestock(w);
  updateDoors(w);
  updateExits(w);
  w.tick++;
}

/** Problems that must never happen; the bot fails if this returns anything. */
export function checkInvariants(w: World): string[] {
  const errs: string[] = [];
  const p = w.player;
  for (const [k, v] of Object.entries({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, aim: p.aim })) {
    if (!Number.isFinite(v)) errs.push(`player.${k} is ${v}`);
  }
  if (p.x < 0 || p.y < 0 || p.x > w.room.w || p.y > w.room.h) errs.push(`player outside the room at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  const box = playerFeetBox(p, p.def.footRadius - 0.5);
  const walls: Rect[] = [];
  wallRectsNear(w.room, box, walls);
  if (walls.some((r) => overlaps(r, box))) errs.push(`player inside a wall at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  if (w.room.props.some((pr) => overlaps(pr.box, box))) errs.push(`player inside a prop at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  if (!Number.isInteger(p.hp) || p.hp < 0 || p.hp > p.def.maxHp) errs.push(`player hp out of range: ${p.hp}`);
  if (p.hp === 0 && !w.over) errs.push('player has no life but the run is not over');
  if (p.weapon.ammo < 0 || p.weapon.ammo > p.weapon.def.magazine) errs.push(`ammo out of range: ${p.weapon.ammo}`);
  if (w.bullets.length > 2000) errs.push(`too many bullets: ${w.bullets.length}`);
  for (const b of w.bullets) if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) errs.push(`bullet ${b.id} has invalid position`);
  for (const k of w.pickups) if (!Number.isFinite(k.x) || !Number.isFinite(k.y) || isWallAt(w.room, k.x, k.y)) errs.push(`pickup ${k.id} lost at ${k.x},${k.y}`);
  if (w.pickups.length > 500) errs.push(`too many pickups: ${w.pickups.length}`);
  for (const en of w.enemies) {
    if (isDead(en)) errs.push(`enemy ${en.id} is dead but still in the world`);
    if (!Number.isFinite(en.x) || !Number.isFinite(en.y)) errs.push(`enemy ${en.id} has invalid position`);
    const eb = playerFeetBox(en, en.def.footRadius - 0.5);
    const ew: Rect[] = [];
    wallRectsNear(w.room, eb, ew);
    if (ew.some((r) => overlaps(r, eb))) errs.push(`enemy ${en.id} inside a wall at ${en.x.toFixed(1)},${en.y.toFixed(1)}`);
  }
  return errs;
}

/** Compact fingerprint of the state, to check determinism. */
export function worldHash(w: World): string {
  const p = w.player;
  const parts = [w.floor?.current ?? -1, w.tick, p.x.toFixed(3), p.y.toFixed(3), p.aim.toFixed(4), p.weapon.ammo, w.bullets.length, w.nextId, w.kills, p.coupons, w.pickups.length, p.hp];
  for (const d of w.dummies) parts.push(d.damageTaken);
  for (const en of w.enemies) parts.push(en.x.toFixed(2), en.y.toFixed(2), en.state, en.damageTaken);
  return parts.join('|');
}
