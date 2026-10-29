// The simulation: pure, deterministic, no Phaser and no DOM. One call to step() is one tick of 1/60 s.
import { CHARACTERS } from '../data/characters.ts';
import { FLOOR_BOSS_1, ROOMS, slotEnemiesOf, templatesOf } from '../data/rooms.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../data/weapons.ts';
import { ACTIVE_ITEMS, FINDABLE_ACTIVES, ITEMS, itemsUpTo } from '../data/items.ts';
import { ENEMIES } from '../data/enemies.ts';
import { SHOP_PRICES, SHOP_SHELVES, type ShopGood } from '../data/shop.ts';
import type { BulletBehaviour, CharacterDef, DummyDef, EnemyDef, Modifier, Perks, RoomTemplate, WeaponDef } from '../data/types.ts';
import { activeSynergies, moddedCharacter, moddedWeapon, perksOf } from './mods.ts';
import { SYNERGIES } from '../data/synergies.ts';
import { bossWarnSpot, updateEnemies } from './enemies.ts';
import { PATTERNS } from '../data/patterns.ts';
import { Rng } from './rng.ts';
import { expandPattern, isAimed, type BulletColor, type Homing, type PatternDef, type ShotSpec } from './patterns.ts';
import { generateFloor, OPPOSITE, type Dir, type Floor } from './floor.ts';
import { BACK_WALL_ROWS, buildRoom, doorApron, doorCells, fillTemplate, isWallAt, TILE, wallRectsNear, type PropInstance, type Room, type RoomDoor } from './room.ts';
import { PROPS } from '../data/props.ts';
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
  /** Change weapon on this tick: +1 the next one, -1 the previous one (wheel or button). */
  swap?: number;
  /** Use the active item on this tick (Q or a pad button). */
  useItem?: boolean;
  /** Test room only: name of a pattern (src/data/patterns.ts) the first dummy fires at the player. */
  debugPattern?: string;
}

export const NO_INPUT: Input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, fire: false, roll: false, reload: false };

export interface WeaponState {
  /** The weapon as the player's modifiers leave it (see refreshPlayer); `base` is the untouched one. */
  def: WeaponDef;
  base: WeaponDef;
  ammo: number;
  cooldown: number;
  /** Seconds left of reload, 0 when not reloading. */
  reload: number;
}

export interface Player {
  /** The character as its modifiers leave it (see refreshPlayer); `base` is the untouched one. */
  def: CharacterDef;
  base: { def: CharacterDef };
  /** What items do to it, in the order they were picked up (synergies come on top, see refreshPlayer). */
  mods: Modifier[];
  /** Ids of the synergies switched on (src/data/synergies.ts), in table order. */
  synergies: string[];
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
  /** The weapon in hand: always one of `arsenal`, the one at `slot`. */
  weapon: WeaponState;
  /** Every weapon it carries, in the order they were found; each keeps its own ammo. */
  arsenal: WeaponState[];
  slot: number;
  /** Distance walked, for the walk animation. */
  walked: number;
  /** Discount coupons picked up (the currency). */
  coupons: number;
  /** Purchase tickets picked up (the keys): each opens one chest. */
  tickets: number;
  /** Ids of the passive items it carries (src/data/items.ts), in the order they were picked up. */
  items: string[];
  /** The active item it carries (one at most) and the batteries it has stored. */
  active: { id: string; charge: number } | null;
}

/**
 * A discount coupon (currency), a spare heart (gives back `value` life; left alone at full
 * life), a weapon or a passive item (these two wait on a pedestal).
 */
export type PickupKind = 'cupon' | 'corazon' | 'ticket' | 'arma' | 'objeto' | 'activo';

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
  /** A weapon lying on the floor (kind 'arma'): its id in src/data/weapons.ts. */
  weapon?: string;
  /** A passive or active item on its pedestal (kind 'objeto' or 'activo'): its id in src/data/items.ts. */
  item?: string;
  /** An active item's stored batteries (one put down keeps them). */
  charge?: number;
  /** Put down just now under the toaster: it cannot be picked up until the toaster has stepped off it. */
  stepOff?: boolean;
  /** For sale on a shop shelf: its price in coupons (walking onto it buys it, if it can be paid). */
  price?: number;
  /** For sale: the toaster is standing on it (so a refusal is said once per visit, not every tick). */
  touched?: boolean;
}

/** Seconds after changing weapon before the new one fires (it is being drawn). */
export const SWAP_TIME = 0.22;
/** A weapon on the floor is picked up this close (px); it never flies to the player. */
const WEAPON_GRAB = 12;

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
  maxSpeed?: number;
  homing?: Homing;
  /** The player's bullets break it (the boss's loyalty cards). */
  shootable?: boolean;
  /** Player bullets with item behaviours: enemies it can still go through, walls it can still bounce off, */
  pierce?: number;
  bounce?: number;
  /** the enemies (and dummies) it already hit, and how it seeks the nearest enemy. */
  hits?: number[];
  seek?: NonNullable<BulletBehaviour['homing']>;
  /** Shot down this tick: it is gone. */
  cut?: boolean;
  /** Player bullets: id of the weapon that fired it (how it is drawn). */
  weapon?: string;
  /** Player bullets: a critical hit (its damage is already multiplied). */
  crit?: boolean;
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

/**
 * `roar`: a boss between two phases (it takes no damage and does nothing for BOSS_PHASE_BREAK s).
 * `dying`: a boss with no life left, coming apart for BOSS_DEATH s before it is taken out.
 */
export type EnemyState = 'walk' | 'warn' | 'charge' | 'brake' | 'stun' | 'idle' | 'fire' | 'off' | 'blink' | 'gone' | 'roar' | 'dying' | 'jam' | 'lurk' | 'reveal';

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
  /** Turrets that jam: volleys left before the next jam. */
  volleys?: number;
  /** Bosses: index of the phase it is in, and of the attack it is doing or did last. */
  bossPhase?: number;
  attack?: number;
}

/**
 * A ball of frost thrown by a boss, then the patch it leaves. While `t` < 0 it is in the air,
 * flying from (fromX, fromY) to (x, y); at 0 it lands and the patch slows the player down
 * (to `slow` of its speed) inside an ellipse of `r` by `r` × FROST_FLAT until `t` reaches `life`.
 */
export interface Frost {
  id: number;
  x: number;
  y: number;
  r: number;
  t: number;
  life: number;
  slow: number;
  fromX: number;
  fromY: number;
  /** Height it is thrown from (px above the floor). */
  fromH: number;
  flight: number;
  /** Pattern it shatters into when it lands. */
  shatter?: string;
  /**
   * Not frost but an expired product the boss spits (its frame in the `producto-caducado` sheet):
   * it bursts where it lands and leaves no patch (`life` is 0).
   */
  product?: number;
  /** Who threw it (enemy id, and its kind for the sick-leave report). */
  source: number;
  by: string;
}

/** Frost patches are flattened ellipses, as seen in three-quarter view. */
export const FROST_FLAT = 0.6;
/** No more patches than this at once: the oldest melts. */
export const MAX_FROST = 8;

export type SimEvent =
  | { type: 'shot'; x: number; y: number; angle: number; weapon: string }
  | { type: 'hit'; x: number; y: number; angle: number; damage: number; target: number; crit?: boolean }
  | { type: 'bulletWall'; x: number; y: number; angle: number; bounced?: boolean }
  /** The player's modifiers changed (an item picked up or lost): its stats are recomputed. */
  | { type: 'mods'; id: string; added: boolean }
  /** A synergy switched on (or off: a piece of it was lost). */
  | { type: 'synergy'; id: string; added: boolean }
  /** A player bullet broke an enemy bullet that can be shot (a loyalty card). */
  | { type: 'bulletCut'; x: number; y: number; color: BulletColor }
  | { type: 'revive'; item: string; x: number; y: number; hp: number }
  | { type: 'jam'; x: number; y: number; source: number }
  | { type: 'reveal'; x: number; y: number; source: number }
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
  /** A boss throws a ball of frost from (x, y) to land at (tx, ty) in `flight` s; then it lands. */
  | { type: 'frostThrow'; x: number; y: number; tx: number; ty: number; flight: number; source: number }
  | { type: 'frostLand'; x: number; y: number; r: number; product?: number }
  /** A boss starts a new phase of its fight. */
  | { type: 'bossPhase'; boss: number; phase: number; name: string }
  /** Every enemy bullet (and whatever was in the air) vanished at once: a boss changed phase or fell. */
  | { type: 'fireCleared'; points: Array<{ x: number; y: number; color: BulletColor }> }
  /** A boss has no life left: it comes apart for `duration` s, then the usual `death`. */
  | { type: 'bossDying'; boss: number; x: number; y: number; duration: number; enemy: string }
  /** An enemy came apart. `alt` is how high it flew; `angle` the direction of the killing shot. */
  | { type: 'death'; x: number; y: number; alt: number; angle: number; enemy: string; source: number }
  /** Picked something up; `total` is the coupons after it, the life for a heart, the tickets for a ticket. */
  | { type: 'pickup'; x: number; y: number; kind: PickupKind; value: number; total: number; weapon?: string; item?: string }
  /** The player took weapon `weapon` in hand (`slot` of `count` it carries); `found` when it was just picked up. */
  | { type: 'swap'; weapon: string; slot: number; count: number; found: boolean }
  /** The goods lift came up where the boss fell (it can be used once it is `ready`). */
  | { type: 'lift'; x: number; y: number }
  | { type: 'liftReady'; x: number; y: number }
  /** The toaster stepped on the lift: the floor is done (see World.won). */
  | { type: 'floorDone'; x: number; y: number; seconds: number; kills: number; coupons: number }
  | { type: 'restock' }
  /** A cleared room left its reward: a ticket popped out, or a chest turned up. */
  | { type: 'reward'; reward: RoomReward; x: number; y: number }
  /** Walked into a shut chest: opened with a ticket (`item` is what came out), or locked (no ticket). */
  | { type: 'chest'; x: number; y: number; opened: boolean; tickets: number; item?: string }
  /** Walked onto something for sale: bought it (`left` coupons after paying), or not (too poor, or a heart with all its life). */
  | { type: 'shop'; x: number; y: number; outcome: 'bought' | 'poor' | 'full'; good: PickupKind; price: number; left: number; item?: string }
  /** The active item was used (`effect` is its effect's type). */
  | { type: 'active'; item: string; effect: string; x: number; y: number }
  /** Q with an active item that cannot be used now (not charged, or nothing to heal). */
  | { type: 'activeEmpty'; item: string | null; charge: number; needs: number }
  /** A battery went into the active item (a combat room was cleared): `charge` of `needs`. */
  | { type: 'battery'; item: string; charge: number; needs: number }
  /** A hold (Música de Espera) ended: enemies and their bullets move again. */
  | { type: 'holdEnd' }
  /** The shutters of the room come down (shut) or roll up. */
  | { type: 'doors'; shut: boolean }
  /** The player walked through a door into floor room `id` (coming in through its `via` wall). */
  | { type: 'room'; id: number; via: Dir }
  /** A boss makes its entrance (World.intro): the player stands still for `duration` s. */
  | { type: 'bossIntro'; boss: number; duration: number }
  /** The entrance is over (or was skipped): the fight starts. */
  | { type: 'bossIntroEnd'; boss: number; skipped: boolean }
  /** The player lost `damage` life (now `hp`); `dirX, dirY` is where the blow came from towards it. */
  | { type: 'hurt'; x: number; y: number; damage: number; hp: number; dirX: number; dirY: number; source: number }
  /** The player has no life left: the run is over. */
  | { type: 'down'; x: number; y: number; source: number; cause: DownCause }
  | { type: 'telegraph'; x: number; y: number; time: number; aim: number; aimed: boolean; color: BulletColor; source?: number };

export interface World {
  seed: string;
  /** Which floor of the store this is (1: the warehouse, 2: Informática). For now it only picks the look. */
  level: number;
  tick: number;
  rng: Rng;
  room: Room;
  player: Player;
  bullets: Bullet[];
  dummies: Dummy[];
  enemies: Enemy[];
  emitters: Emitter[];
  pickups: Pickup[];
  /** Loot decks of a world without a floor (made the first time a chest opens). */
  looseDecks?: { weapons: string[]; items: string[]; actives: string[] };
  /** Frost thrown by a boss: in the air or lying on the floor. */
  frost: Frost[];
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
  /** A boss is making its entrance: nothing moves but the clock (see BOSS_INTRO). */
  intro: BossIntro | null;
  /** The goods lift down to the next floor, once the boss has fallen. */
  lift: Lift | null;
  /** The toaster took the lift: the floor is done and the world stands still. */
  won: boolean;
  /** Seconds left of a hold (Música de Espera): enemies, their bullets and attacks stand still. */
  holdT: number;
}

export interface Lift {
  x: number;
  y: number;
  /** Seconds since it came up: it takes the toaster from LIFT_READY on. */
  t: number;
}

/** Seconds the lift takes to come up and be ready (the «Liquidación total» stamp is read meanwhile), and how close the toaster's feet must be (px). */
export const LIFT_READY = 2.6;
export const LIFT_RADIUS = 12;
/** Half size of the lift's plate (the sprite is 40 × 20 px of plate). */
export const LIFT_HALF = { x: 20, y: 10 };

export interface BossIntro {
  /** Id of the boss. */
  boss: number;
  /** Seconds since it started. */
  t: number;
  /** Fire was released since it started: pressing it again skips the rest. */
  armed: boolean;
}

/** Seconds a boss's entrance lasts (name card and motto), and how soon it can be skipped. */
export const BOSS_INTRO = 3.6;
export const BOSS_INTRO_SKIP = 0.8;
/** Seconds a boss stops between two phases (no damage, no attacks), and how long it takes to fall. */
export const BOSS_PHASE_BREAK = 1.6;
export const BOSS_DEATH = 2.6;

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
  /** What a combat room leaves when it is cleared, besides its coupons (decided with the floor). */
  reward?: RoomReward;
  /** The goods lift, once its boss has fallen: it stays in its room when the player walks out. */
  lift?: Lift | null;
}

/** A ticket (a key) or a chest that a ticket opens. */
export type RoomReward = 'ticket' | 'chest';
/** Combat rooms of each floor that leave a ticket, and a chest, when cleared. */
export const FLOOR_TICKETS = 2;
export const FLOOR_CHESTS = 2;
/** Coupons that spill out of a chest with its item. */
export const CHEST_COUPONS = 3;
/** How close the toaster's feet have to get to a chest to open it (px). */
const CHEST_REACH = 3;

export interface FloorRun {
  layout: Floor;
  /** Id of the room the player is in. */
  current: number;
  /** Indexed by room id. */
  rooms: FloorRoomState[];
  /** Weapons still to be found on this floor, next one first (a seeded shuffle of FINDABLE_WEAPONS). */
  weapons: string[];
  /** Passive items still to be found on this floor, next one first (a seeded shuffle of itemsUpTo(level)). */
  items: string[];
  /** Active items still to be found on this floor (a seeded shuffle of FINDABLE_ACTIVES). */
  actives: string[];
}

/** What dealt the last blow: an enemy id (or 'maniqui'), and whether it was a bullet or a body. */
export interface DownCause {
  by: string;
  how: 'bullet' | 'contact';
}

/** Seconds the player cannot be hurt again after a hit (it blinks meanwhile). */
export const HURT_IFRAMES = 1.1;
/** Seconds the toaster cannot be hurt after a backup brings it back. */
export const REVIVE_IFRAMES = 2.5;
/** Px beyond its body at which a rolling toaster in flight mode cuts enemy bullets. */
export const ROLL_CUT_REACH = 4;
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
  /** Which floor of the store (default 1). */
  level?: number;
}

export function createWorld(opts: WorldOptions): World {
  const floor = opts.floor ? planFloor(opts.seed, opts.level ?? 1) : null;
  let tpl = floor ? floor.rooms[floor.current]!.template : opts.template ?? ROOMS[opts.room ?? 'sala-pruebas'];
  if (!tpl) throw new Error(`Unknown room ${opts.room}`);
  if (!floor && !opts.template && tpl.kind) tpl = fillTemplate(tpl, new Rng(`sala:${opts.seed}`), { depth: opts.depth ?? 3, pool: slotEnemiesOf(opts.level ?? 1), boss: FLOOR_BOSS_1 });
  const def = CHARACTERS[opts.character ?? 'tostadora'];
  if (!def) throw new Error(`Unknown character ${opts.character}`);
  const wdef = WEAPONS[def.startWeapon];
  if (!wdef) throw new Error(`Unknown weapon ${def.startWeapon}`);
  const room = floor ? floorRoomOf(floor, floor.current) : buildRoom(tpl, opts.doors);
  let nextId = 1;
  const dummies: Dummy[] = room.dummySpawns.map((s) => ({ id: nextId++, def: s.def, x: s.x, y: s.y, lean: 0, leanV: 0, hitT: 0, damageTaken: 0 }));
  const w: World = {
    seed: opts.seed,
    level: opts.level ?? 1,
    tick: 0,
    rng: new Rng(opts.seed),
    room,
    player: {
      def,
      base: { def },
      mods: [],
      synergies: [],
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
      weapon: newWeapon(wdef),
      arsenal: [],
      slot: 0,
      walked: 0,
      coupons: 0,
      tickets: 0,
      items: [],
      active: null,
    },
    bullets: [],
    dummies,
    enemies: [],
    emitters: [],
    pickups: [],
    frost: [],
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
    intro: null,
    lift: null,
    won: false,
    holdT: 0,
  };
  w.player.arsenal.push(w.player.weapon);
  if (floor) {
    floor.rooms[floor.current]!.visited = true;
    setDoorTiles(w, true);
    return w;
  }
  // The test room lays out every findable weapon on its pedestals, to try them all; a treasure
  // (or secret) room played on its own stocks its pedestals as on a floor.
  if (room.kind === 'test') stockPedestals(w, [...FINDABLE_WEAPONS], [], []);
  else if (room.kind === 'shop') stockShop(w, decksOf(w));
  else if (room.kind === 'treasure' || room.kind === 'secret') {
    const decks = lootDecks(opts.seed, opts.level ?? 1);
    stockPedestals(w, decks.weapons, decks.items, decks.actives);
  }
  if (w.spawnsEnemies) spawnRoomEnemies(w);
  // Walking into a combat room brings its shutters down until the last enemy falls.
  if (fights(room) && w.enemies.length > 0) w.doorsShut = true;
  startIntro(w);
  return w;
}

/** The floors of the store that exist so far (1: the warehouse, 2: Informática). */
export const LAST_LEVEL = 2;

/**
 * The next floor of the same run, once this one is won (the toaster went down the lift): a new
 * floor one level up, seeded from this one, with the same toaster at its entrance: weapons (and
 * their ammo), items, active item, hearts, coupons and tickets. What it already carries is taken
 * out of the new floor's loot decks. Null on the last floor (the run ends there).
 */
export function nextFloor(w: World): World | null {
  if (!w.won || !w.floor || w.level >= LAST_LEVEL) return null;
  const p = w.player;
  const n = createWorld({ seed: `${w.seed}:planta${w.level + 1}`, floor: true, level: w.level + 1, character: p.base.def.id });
  const q = n.player;
  n.player = { ...p, x: q.x, y: q.y, vx: 0, vy: 0, aim: q.aim, facing: q.facing, rollT: q.rollT, rollDirX: q.rollDirX, rollDirY: q.rollDirY, rollCooldown: 0, invulnerable: q.invulnerable };
  const f = n.floor!;
  const owned = new Set([...p.arsenal.map((ws) => ws.base.id), ...p.items, ...(p.active ? [p.active.id] : [])]);
  f.weapons = f.weapons.filter((id) => !owned.has(id));
  f.items = f.items.filter((id) => !owned.has(id));
  f.actives = f.actives.filter((id) => !owned.has(id));
  return n;
}

/**
 * Lays out a floor and decides what every room is: a template of its kind (combat templates
 * are dealt from a shuffled deck, so a floor repeats one only when it runs out) with its slots
 * filled for the room's depth. Seeded by the world's seed.
 */
function planFloor(seed: string, level: number): FloorRun {
  const layout = generateFloor(seed);
  const rng = new Rng(`salas:${seed}`);
  const decks = new Map<string, RoomTemplate[]>();
  const deal = (kind: NonNullable<RoomTemplate['kind']>): RoomTemplate => {
    let deck = decks.get(kind);
    if (!deck || deck.length === 0) {
      deck = rng.shuffle([...templatesOf(kind, level)]);
      if (deck.length === 0) throw new Error(`No templates for ${kind} rooms`);
      decks.set(kind, deck);
    }
    return deck.pop()!;
  };
  const rooms = layout.rooms.map((fr): FloorRoomState => {
    const template = fillTemplate(deal(fr.kind), rng.fork(`sala${fr.id}`), { depth: Math.max(1, fr.depth), pool: slotEnemiesOf(level), boss: FLOOR_BOSS_1, vary: true });
    return { template, room: null, visited: false, cleared: fr.kind !== 'combat' && fr.kind !== 'boss', pickups: [] };
  });
  // Rewards: a seeded pick of combat rooms (the first ones get the tickets, the next ones the chests).
  const combat = new Rng(`premios:${seed}`).shuffle(layout.rooms.filter((fr) => fr.kind === 'combat').map((fr) => fr.id));
  combat.forEach((id, i) => {
    if (i < FLOOR_TICKETS) rooms[id]!.reward = 'ticket';
    else if (i < FLOOR_TICKETS + FLOOR_CHESTS) rooms[id]!.reward = 'chest';
  });
  return { layout, current: layout.start, rooms, ...lootDecks(seed, level) };
}

/** The weapons and items floor `level` hands out, each in its own seeded order (items: see itemsUpTo). */
function lootDecks(seed: string, level: number): { weapons: string[]; items: string[]; actives: string[] } {
  return {
    weapons: new Rng(`armas:${seed}`).shuffle([...FINDABLE_WEAPONS]),
    items: new Rng(`objetos:${seed}`).shuffle(itemsUpTo(level)),
    actives: new Rng(`activos:${seed}`).shuffle([...FINDABLE_ACTIVES]),
  };
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
  f.rooms[f.current]!.lift = w.lift;
  f.current = id;
  const st = f.rooms[id]!;
  const first = !st.visited;
  st.visited = true;
  w.room = floorRoomOf(f, id);
  w.bullets = [];
  w.emitters = [];
  w.frost = [];
  w.enemies = [];
  w.dummies = [];
  w.pickups = st.pickups;
  st.pickups = [];
  w.lift = st.lift ?? null;
  st.lift = null;
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
  if (!st.cleared && w.spawnsEnemies) {
    spawnRoomEnemies(w);
    // The boss waits at the far end: walking in from the north would put it in the toaster's face.
    if (w.room.kind === 'boss' && via === 'N') for (const en of w.enemies) if (en.def.boss) en.y = w.room.h - en.y;
  }
  if (w.enemies.length === 0) st.cleared = true;
  // Until there are chests, the treasure room (and the secret one) keep a weapon and items on their pedestals.
  const kind = f.layout.rooms[id]!.kind;
  if (first && (kind === 'treasure' || kind === 'secret')) stockPedestals(w, f.weapons, f.items, f.actives);
  if (first && kind === 'shop') stockShop(w, f);
  w.doorsShut = !st.cleared;
  setDoorTiles(w, !w.doorsShut);
  w.events.push({ type: 'room', id, via });
  if (w.doorsShut) w.events.push({ type: 'doors', shut: true });
  startIntro(w);
}

/**
 * Fills the room's pedestals from the decks (taking what it puts out of them): the first one
 * gets the next weapon, the second the next passive item, the third the next active item, and
 * so on round; when a deck runs out the next one fills in.
 */
function stockPedestals(w: World, weapons: string[], items: string[], actives: string[]): void {
  const decks = [weapons, items, actives];
  let n = 0;
  for (const s of w.room.slots) {
    if (s.kind !== 'item') continue;
    const at = { x: s.x, y: s.y, vx: 0, vy: 0, age: PICKUP_DELAY, value: 1 };
    let d = -1;
    for (let k = 0; k < 3 && d < 0; k++) if (decks[(n + k) % 3]!.length > 0) d = (n + k) % 3;
    n++;
    if (d < 0) return;
    const id = decks[d]!.shift()!;
    if (d === 0) w.pickups.push({ id: w.nextId++, kind: 'arma', weapon: id, ...at });
    else if (d === 1) w.pickups.push({ id: w.nextId++, kind: 'objeto', item: id, ...at });
    else w.pickups.push({ id: w.nextId++, kind: 'activo', item: id, charge: ACTIVE_ITEMS[id]!.charges, ...at });
  }
}

/**
 * Puts the goods on the shop's shelves, left to right as SHOP_SHELVES says: the next item of the
 * decks (passive, else active, else weapon), a spare heart and a ticket, each with its price.
 */
function stockShop(w: World, decks: { weapons: string[]; items: string[]; actives: string[] }): void {
  const shelves = w.room.slots.filter((s) => s.kind === 'shelf').sort((a, b) => a.x - b.x || a.y - b.y);
  shelves.forEach((s, i) => {
    const what = SHOP_SHELVES[i % SHOP_SHELVES.length]!;
    const at = { id: 0, x: s.x, y: s.y, vx: 0, vy: 0, age: PICKUP_DELAY, value: 1 };
    let k: Pickup | null = null;
    if (what === 'corazon') k = { ...at, kind: 'corazon', value: 2 };
    else if (what === 'ticket') k = { ...at, kind: 'ticket' };
    else if (decks.items.length > 0) k = { ...at, kind: 'objeto', item: decks.items.shift()! };
    else if (decks.actives.length > 0) {
      const item = decks.actives.shift()!;
      k = { ...at, kind: 'activo', item, charge: ACTIVE_ITEMS[item]!.charges };
    } else if (decks.weapons.length > 0) k = { ...at, kind: 'arma', weapon: decks.weapons.shift()! };
    if (!k) return;
    k.id = w.nextId++;
    k.price = SHOP_PRICES[k.kind as ShopGood];
    w.pickups.push(k);
  });
}

/**
 * The player picks up active item `id` with `charge` batteries (a new one comes full). The one
 * it carried is put down where it stands, keeping its batteries.
 */
export function giveActive(w: World, id: string, charge?: number): void {
  const def = ACTIVE_ITEMS[id];
  if (!def) throw new Error(`Unknown active item ${id}`);
  const p = w.player;
  const old = p.active;
  if (old) w.pickups.push({ id: w.nextId++, kind: 'activo', item: old.id, charge: old.charge, value: 1, x: p.x, y: p.y, vx: 0, vy: 0, age: PICKUP_DELAY, stepOff: true });
  p.active = { id, charge: Math.min(def.charges, charge ?? def.charges) };
}

/** Uses the active item if it is charged (and has something to do): its effect, and the batteries are spent. */
export function useActive(w: World): boolean {
  const p = w.player;
  const a = p.active;
  const def = a ? ACTIVE_ITEMS[a.id] : undefined;
  const effect = def?.effect;
  const pointless = effect?.type === 'heal' && p.hp >= p.def.maxHp;
  if (!a || !def || !effect || w.over || a.charge < def.charges || pointless) {
    w.events.push({ type: 'activeEmpty', item: a?.id ?? null, charge: a?.charge ?? 0, needs: def?.charges ?? 0 });
    return false;
  }
  a.charge = 0;
  if (effect.type === 'clearFire') clearEnemyFire(w);
  else if (effect.type === 'hold') w.holdT = Math.max(w.holdT, effect.seconds);
  else p.hp = Math.min(p.def.maxHp, p.hp + effect.amount);
  w.events.push({ type: 'active', item: a.id, effect: effect.type, x: p.x, y: p.y });
  return true;
}

/** One battery into the active item (a combat room has been cleared). */
function chargeActive(w: World): void {
  const a = w.player.active;
  const def = a ? ACTIVE_ITEMS[a.id] : undefined;
  if (!a || !def || a.charge >= def.charges) return;
  a.charge = Math.min(def.charges, a.charge + 1 + playerPerks(w.player).charge);
  w.events.push({ type: 'battery', item: a.id, charge: a.charge, needs: def.charges });
}

/** The player picks up passive item `id`: it carries it (and its modifier) for the rest of the run. */
export function giveItem(w: World, id: string): void {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item ${id}`);
  w.player.items.push(id);
  addModifier(w, def.mod);
}

/** A fresh weapon state: full magazine, ready to fire. */
export function newWeapon(def: WeaponDef): WeaponState {
  return { def, base: def, ammo: def.magazine, cooldown: 0, reload: 0 };
}

/**
 * The player picks up weapon `id` and takes it in hand (with the modifiers it carries). A
 * weapon it already has just fills that one's magazine.
 */
export function giveWeapon(w: World, id: string): void {
  const def = WEAPONS[id];
  if (!def) throw new Error(`Unknown weapon ${id}`);
  const p = w.player;
  let i = p.arsenal.findIndex((ws) => ws.base.id === id);
  if (i < 0) {
    const ws = newWeapon(def);
    p.arsenal.push(ws);
    refreshSynergies(w);
    ws.ammo = ws.def.magazine;
    i = p.arsenal.length - 1;
  } else {
    const ws = p.arsenal[i]!;
    ws.ammo = ws.def.magazine;
    ws.reload = 0;
  }
  selectWeapon(w, i, true);
}

/** Takes weapon `slot` of the arsenal in hand. Whatever reload the old one was doing is lost. */
export function selectWeapon(w: World, slot: number, found = false): void {
  const p = w.player;
  const n = p.arsenal.length;
  const i = ((slot % n) + n) % n;
  if (i === p.slot && !found) return;
  p.weapon.reload = 0;
  p.slot = i;
  p.weapon = p.arsenal[i]!;
  p.weapon.reload = 0;
  p.weapon.cooldown = Math.max(p.weapon.cooldown, SWAP_TIME);
  w.events.push({ type: 'swap', weapon: p.weapon.base.id, slot: i, count: n, found });
}

/** Rooms that lock their shutters until their enemies are gone. */
const fights = (room: Room): boolean => room.kind === 'combat' || room.kind === 'boss';

/** In a boss room with its boss still there, the boss makes its entrance. */
function startIntro(w: World): void {
  if (w.room.kind !== 'boss') return;
  const boss = w.enemies.find((en) => en.def.boss);
  if (!boss) return;
  w.intro = { boss: boss.id, t: 0, armed: false };
  w.events.push({ type: 'bossIntro', boss: boss.id, duration: BOSS_INTRO });
}

/**
 * During a boss's entrance only the clock runs: the player stops and looks at the boss, nothing
 * else moves. Pressing fire again (after BOSS_INTRO_SKIP s) skips the rest.
 */
function stepIntro(w: World, intro: BossIntro, input: Input): void {
  const boss = w.enemies.find((en) => en.id === intro.boss);
  intro.t += DT;
  if (!input.fire) intro.armed = true;
  const skipped = intro.armed && input.fire && intro.t >= BOSS_INTRO_SKIP;
  const p = w.player;
  updatePlayer(w, { ...NO_INPUT, aimX: boss ? boss.x : p.x + p.facing, aimY: boss ? boss.y - 30 : p.y - HAND_HEIGHT });
  if (boss) boss.facing = p.x >= boss.x ? 1 : -1;
  if (!boss || skipped || intro.t >= BOSS_INTRO) {
    w.intro = null;
    w.events.push({ type: 'bossIntroEnd', boss: intro.boss, skipped });
  }
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
  } else if (b.kind === 'mimic') {
    // Lying in wait until someone comes close.
    state = 'lurk';
    until = Infinity;
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
    // Frost on the floor slows walking down (rolling is how you get out of it).
    const k = frostSlow(w, p.x, p.y);
    const tx = mx * d.speed * k;
    const ty = my * d.speed * k;
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

/** The fields a bullet needs for the weapon's item behaviours. */
function shotBehaviour(b: BulletBehaviour | undefined): Partial<Bullet> {
  if (!b) return {};
  const out: Partial<Bullet> = {};
  if (b.pierce) out.pierce = b.pierce;
  if (b.bounce) out.bounce = b.bounce;
  if (b.homing) out.seek = b.homing;
  return out;
}

/**
 * Recomputes the player's character and weapon from their base and its modifiers. A bigger
 * magazine comes with its rounds and ammo never passes it; more maximum life comes with that
 * life, less never leaves it at 0.
 */
export function refreshPlayer(p: Player): void {
  const oldMax = p.def.maxHp;
  const weapons = p.arsenal.includes(p.weapon) ? p.arsenal : [...p.arsenal, p.weapon];
  const syn = activeSynergies(p.mods, weapons.map((ws) => ws.base.id));
  p.synergies = syn.map((s) => s.id);
  const mods = [...p.mods, ...syn.filter((s) => !s.weapon).map((s) => s.mod)];
  p.def = moddedCharacter(p.base.def, mods);
  // A bigger magazine comes loaded (the extra rounds); a smaller one drops what no longer fits.
  for (const ws of weapons) {
    const oldMag = ws.def.magazine;
    ws.def = moddedWeapon(ws.base, [...mods, ...syn.filter((s) => s.weapon === ws.base.id).map((s) => s.mod)]);
    if (ws.def.magazine > oldMag) ws.ammo += ws.def.magazine - oldMag;
    ws.ammo = Math.min(ws.ammo, ws.def.magazine);
  }
  if (p.def.maxHp > oldMax) p.hp += p.def.maxHp - oldMax;
  p.hp = Math.max(Math.min(p.hp, p.def.maxHp), p.hp > 0 ? 1 : 0);
}

/** refreshPlayer, plus an event for every synergy that has just switched on or off. */
function refreshSynergies(w: World): void {
  const before = w.player.synergies;
  refreshPlayer(w.player);
  const now = w.player.synergies;
  for (const id of before) if (!now.includes(id)) w.events.push({ type: 'synergy', id, added: false });
  for (const id of now) if (!before.includes(id)) w.events.push({ type: 'synergy', id, added: true });
}

/** What the player's items (and the synergies that change no weapon) do beyond stats and bullets. */
export function playerPerks(p: Player): Required<Perks> {
  return perksOf([...p.mods, ...p.synergies.map((id) => SYNERGIES[id]!).filter((s) => !s.weapon).map((s) => s.mod)]);
}

/** Flight mode: while rolling, the enemy bullets the toaster touches are cut. */
function rollCut(w: World): void {
  const p = w.player;
  if (!playerPerks(p).rollClear) return;
  for (const b of w.bullets) {
    if (b.owner !== 'enemy' || b.cut) continue;
    const rr = b.r + PLAYER_HURT_RADIUS + ROLL_CUT_REACH;
    if ((b.x - p.x) ** 2 + (b.y - (p.y - PLAYER_HURT_Y)) ** 2 < rr * rr) {
      b.cut = true;
      w.events.push({ type: 'bulletCut', x: b.x, y: b.y, color: b.color });
    }
  }
}

/** Gives the player a modifier (picking up an item). */
export function addModifier(w: World, m: Modifier): void {
  w.player.mods.push(m);
  w.events.push({ type: 'mods', id: m.id, added: true });
  refreshSynergies(w);
}

/** Takes away the player's last modifier with this id, if it has one. */
export function removeModifier(w: World, id: string): boolean {
  const i = w.player.mods.map((m) => m.id).lastIndexOf(id);
  if (i < 0) return false;
  w.player.mods.splice(i, 1);
  w.events.push({ type: 'mods', id, added: false });
  refreshSynergies(w);
  return true;
}

function updateWeapon(w: World, input: Input): void {
  const p = w.player;
  if (input.swap && p.arsenal.length > 1) selectWeapon(w, p.slot + Math.sign(input.swap));
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
  const crit = def.bullets?.crit;
  for (let i = 0; i < def.pellets; i++) {
    const a = p.aim + ((w.rng.range(-1, 1) * def.spreadDeg) / 180) * Math.PI;
    // A critical hit is decided when the bullet leaves the barrel (no roll without the item).
    const isCrit = !!crit && w.rng.chance(crit.chance);
    w.bullets.push({
      id: w.nextId++,
      owner: 'player',
      x: mx,
      y: my,
      vx: Math.cos(a) * def.bulletSpeed,
      vy: Math.sin(a) * def.bulletSpeed,
      r: def.bulletRadius,
      life: def.bulletLife,
      damage: isCrit ? def.damage * crit.mul : def.damage,
      knockback: def.knockback,
      color: 'red',
      age: 0,
      dir: a,
      speed: def.bulletSpeed,
      h: HAND_HEIGHT,
      weapon: def.id,
      ...shotBehaviour(def.bullets),
      ...(isCrit ? { crit: true } : {}),
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

function updateBullets(w: World, held = false): void {
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    if (b.cut) continue;
    // On hold, enemy bullets hang in the air (and hurt nobody) until the music stops.
    if (held && b.owner === 'enemy') {
      keep.push(b);
      continue;
    }
    b.life -= DT;
    if (b.life <= 0) {
      w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
      continue;
    }
    b.age += DT;
    if (b.accel) b.speed = Math.min(b.maxSpeed ?? Infinity, Math.max(10, b.speed + b.accel * DT));
    // Homing: it turns towards the player (towards its body, not its feet) for a while.
    let homing = !!b.homing && b.age < b.homing.time && !w.over;
    if (homing) turnTowards(b, w.player.x, w.player.y - PLAYER_HURT_Y, b.homing!.turnDeg);
    // A player bullet that seeks (an item): towards the nearest enemy in range it has not hit yet.
    if (b.seek && b.age < b.seek.time) {
      const t = seekTarget(w, b);
      if (t) {
        turnTowards(b, t.x, t.y, b.seek.turnDeg);
        homing = true;
      }
    }
    if (b.wave || b.accel || homing) {
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
      if (stopsBullet(w, b.x, fy)) {
        if (b.bounce && b.bounce > 0) {
          bounceBullet(w, b);
          w.events.push({ type: 'bulletWall', x: b.x, y: b.y, angle, bounced: true });
          continue;
        }
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
          if (isDead(en) || en.state === 'gone' || b.hits?.includes(en.id)) continue;
          const hb = dummyHurtBox(en);
          if (b.x + b.r > hb.x && b.x - b.r < hb.x + hb.w && b.y + b.r > hb.y && b.y - b.r < hb.y + hb.h) {
            // A boss between phases shrugs bullets off (they still stop on it).
            const damage = en.state === 'roar' ? 0 : b.damage;
            en.hitT = damage > 0 ? 0.12 : 0.04;
            en.damageTaken += damage;
            en.lastHit = angle;
            const k = b.knockback * en.def.knockbackScale;
            en.vx += Math.cos(angle) * k;
            en.vy += Math.sin(angle) * k;
            w.events.push({ type: 'hit', x: b.x, y: b.y, angle, damage, target: en.id, ...(b.crit && damage > 0 ? { crit: true } : {}) });
            if (pierces(b, en.id)) continue;
            alive = false;
            break;
          }
        }
        if (!alive) break;
        // Loyalty cards can be shot down: both bullets are lost.
        for (const o of w.bullets) {
          if (o.owner !== 'enemy' || !o.shootable || o.cut) continue;
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const rr = o.r + b.r + 1;
          if (dx * dx + dy * dy < rr * rr) {
            o.cut = true;
            w.events.push({ type: 'bulletCut', x: o.x, y: o.y, color: o.color });
            alive = false;
            break;
          }
        }
        if (!alive) break;
        for (const d of w.dummies) {
          if (b.hits?.includes(d.id)) continue;
          const hb = dummyHurtBox(d);
          if (b.x + b.r > hb.x && b.x - b.r < hb.x + hb.w && b.y + b.r > hb.y && b.y - b.r < hb.y + hb.h) {
            d.hitT = 0.12;
            d.damageTaken += b.damage;
            d.leanV += Math.cos(angle) * b.knockback * 0.06;
            w.events.push({ type: 'hit', x: b.x, y: b.y, angle, damage: b.damage, target: d.id, ...(b.crit ? { crit: true } : {}) });
            if (pierces(b, d.id)) continue;
            alive = false;
            break;
          }
        }
      }
    }
    if (alive) keep.push(b);
  }
  w.bullets = keep.filter((b) => !b.cut);
}

/** Turns a bullet's direction towards (x, y), at most `turnDeg` degrees per second. */
function turnTowards(b: Bullet, x: number, y: number, turnDeg: number): void {
  let d = Math.atan2(y - b.y, x - b.x) - b.dir;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const max = (turnDeg * Math.PI * DT) / 180;
  b.dir += Math.max(-max, Math.min(max, d));
}

/** The body of the nearest enemy a seeking bullet can go for (in range, not hit yet), or null. */
function seekTarget(w: World, b: Bullet): { x: number; y: number } | null {
  let best: { x: number; y: number } | null = null;
  let bd = b.seek!.range;
  for (const en of w.enemies) {
    if (isDead(en) || en.state === 'gone' || b.hits?.includes(en.id)) continue;
    const hb = dummyHurtBox(en);
    const x = hb.x + hb.w / 2;
    const y = hb.y + hb.h / 2;
    const d = Math.hypot(x - b.x, y - b.y);
    if (d < bd) {
      bd = d;
      best = { x, y };
    }
  }
  return best;
}

/** Whether a wall or a prop that stops bullets is at (x, y) (a bullet's shadow). */
function stopsBullet(w: World, x: number, y: number): boolean {
  return isWallAt(w.room, x, y) || w.room.props.some((pr) => pr.def.blocksBullets && pointInRect(x, y, pr.box));
}

/**
 * Bounces a bullet off what it just flew into: back to where it was, and its speed flipped on
 * the axis that was blocked (both, into a corner).
 */
function bounceBullet(w: World, b: Bullet): void {
  const px = b.x - (b.vx * DT) / 2;
  const py = b.y - (b.vy * DT) / 2;
  const blockedX = stopsBullet(w, b.x, py + b.h);
  const blockedY = stopsBullet(w, px, b.y + b.h);
  const flipX = blockedX || !blockedY;
  const flipY = blockedY || !blockedX;
  if (flipX) b.vx = -b.vx;
  if (flipY) b.vy = -b.vy;
  b.x = px;
  b.y = py;
  b.dir = Math.atan2(b.vy, b.vx);
  b.bounce!--;
}

/** A bullet that pierces goes on through what it just hit (once per target), while it has pierce left. */
function pierces(b: Bullet, target: number): boolean {
  if (!b.pierce || b.pierce <= 0) return false;
  b.pierce--;
  (b.hits ??= []).push(target);
  return true;
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
    const b = en.def.brain;
    if (b.kind === 'boss') {
      const a = b.phases[en.bossPhase ?? 0]?.attacks[en.attack ?? 0];
      const at = a ? bossWarnSpot(en, b, a) : { x: en.x + b.muzzle.x * en.facing, y: en.y - b.muzzle.y };
      out.push({ x: at.x, y: at.y, k: Math.min(1, en.t / en.until), aim: 0, aimed: false, color: a?.kind === 'spit' ? 'red' : 'ice', bullets: true, source: en.id });
      continue;
    }
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
        life: s.life ?? ENEMY_BULLET_LIFE,
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
      if (s.maxSpeed) b.maxSpeed = s.maxSpeed;
      if (s.homing) b.homing = s.homing;
      if (s.shootable) b.shootable = true;
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

/** Throws a ball of frost (see Frost) from (x, y) at `h` px above the floor, to land at (tx, ty). */
export interface FrostOptions {
  r: number;
  life: number;
  slow: number;
  flight: number;
  shatter?: string;
  product?: number;
  source: number;
  by: string;
}

export function throwFrost(w: World, x: number, y: number, h: number, tx: number, ty: number, opts: FrostOptions): Frost {
  const f: Frost = { id: w.nextId++, x: tx, y: ty, r: opts.r, t: -opts.flight, life: opts.life, slow: opts.slow, fromX: x, fromY: y, fromH: h, flight: opts.flight, source: opts.source, by: opts.by };
  if (opts.shatter) f.shatter = opts.shatter;
  if (opts.product !== undefined) f.product = opts.product;
  w.frost.push(f);
  w.events.push({ type: 'frostThrow', x, y: y - h, tx, ty, flight: opts.flight, source: opts.source });
  return f;
}

/** Whether (x, y) is inside a landed frost patch. */
export function inFrost(f: Frost, x: number, y: number): boolean {
  if (f.t < 0) return false;
  const dx = (x - f.x) / f.r;
  const dy = (y - f.y) / (f.r * FROST_FLAT);
  return dx * dx + dy * dy <= 1;
}

/** How fast the player can walk at (x, y): 1 normally, less on frost (the strongest patch counts). */
export function frostSlow(w: World, x: number, y: number): number {
  let k = 1;
  for (const f of w.frost) if (inFrost(f, x, y)) k = Math.min(k, f.slow);
  return k;
}

function updateFrost(w: World): void {
  const keep: Frost[] = [];
  for (const f of w.frost) {
    const was = f.t;
    f.t += DT;
    if (was < 0 && f.t >= 0) {
      w.events.push(f.product !== undefined ? { type: 'frostLand', x: f.x, y: f.y, r: f.r, product: f.product } : { type: 'frostLand', x: f.x, y: f.y, r: f.r });
      // It shatters into splinters, unless whoever threw it is gone already.
      const def = f.shatter ? PATTERNS[f.shatter] : undefined;
      if (def && !w.over && w.enemies.some((en) => en.id === f.source)) {
        firePattern(w, def, f.x, f.y - 3, Math.atan2(w.player.y - f.y, w.player.x - f.x), { by: f.by, height: 3 });
      }
    }
    if (f.t < f.life) keep.push(f);
  }
  // Too much frost: the oldest patches on the floor melt first.
  while (keep.filter((f) => f.t >= 0).length > MAX_FROST) keep.splice(keep.findIndex((f) => f.t >= 0), 1);
  w.frost = keep;
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
  // A backup: once, instead of going down, the toaster is restored (and the backup is used up).
  const backup = p.hp <= 0 ? p.mods.find((m) => (m.perks?.revive ?? 0) > 0) : undefined;
  if (backup) {
    const at = p.items.lastIndexOf(backup.id);
    if (at >= 0) p.items.splice(at, 1);
    removeModifier(w, backup.id);
    p.hp = Math.min(p.def.maxHp, backup.perks!.revive!);
    p.invulnerable = REVIVE_IFRAMES;
    clearEnemyFire(w);
    w.events.push({ type: 'revive', item: backup.id, x: p.x, y: p.y - PLAYER_HURT_Y, hp: p.hp });
    return true;
  }
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

/**
 * Every enemy bullet, pattern about to fire and ball in the air goes (the patches already on the
 * floor stay): a boss changes phase or falls, and the screen is cleared for it.
 */
export function clearEnemyFire(w: World): void {
  const points: Array<{ x: number; y: number; color: BulletColor }> = [];
  for (const b of w.bullets) if (b.owner === 'enemy') points.push({ x: b.x, y: b.y, color: b.color });
  w.bullets = w.bullets.filter((b) => b.owner !== 'enemy');
  w.emitters = [];
  for (const f of w.frost) if (f.t < 0) points.push({ x: f.x, y: f.y, color: f.product !== undefined ? 'red' : 'ice' });
  w.frost = w.frost.filter((f) => f.t >= 0);
  w.events.push({ type: 'fireCleared', points });
}

/**
 * Takes apart the enemies with no life left: event, loot, and out of the world. A boss first
 * comes apart for BOSS_DEATH s (state `dying`: bullets go through it and it hurts nobody).
 */
function reapEnemies(w: World): void {
  if (!w.enemies.some(isDead)) return;
  const keep: Enemy[] = [];
  for (const en of w.enemies) {
    if (!isDead(en)) {
      keep.push(en);
      continue;
    }
    if (en.def.boss && !(en.state === 'dying' && en.t >= en.until)) {
      if (en.state !== 'dying') {
        en.state = 'dying';
        en.t = 0;
        en.until = BOSS_DEATH;
        en.vx = 0;
        en.vy = 0;
        clearEnemyFire(w);
        w.events.push({ type: 'bossDying', boss: en.id, x: en.x, y: en.y, duration: BOSS_DEATH, enemy: en.def.id });
      }
      keep.push(en);
      continue;
    }
    w.kills++;
    // Whatever it was about to fire dies with it.
    w.emitters = w.emitters.filter((e) => e.source !== en.id);
    const alt = enemyAltitude(en);
    w.events.push({ type: 'death', x: en.x, y: en.y, alt, angle: en.lastHit, enemy: en.def.id, source: en.id });
    const [lo, hi] = en.def.loot.coupons;
    let n = w.rng.int(lo, hi);
    // Third-party cookies: now and then, one more coupon (no roll without the item).
    const extra = en.def.boss ? 0 : playerPerks(w.player).coupons;
    if (extra > 0 && w.rng.chance(extra)) n++;
    // Loot starts on clear floor: right under the enemy, or the nearest free spot if it flew
    // over a box or stood with its feet against a wall.
    const spot = n > 0 ? freeSpot(w, en.x, en.y, PICKUP_RADIUS) : { x: en.x, y: en.y };
    // A boss leaves the way down: the goods lift comes up where it stood, and its pile of
    // coupons bursts out all round, landing off the plate (not on top of the lift).
    if (en.def.boss && w.lift === null) {
      openLift(w, en.x, en.y);
      const l = w.lift!;
      for (let i = 0; i < n; i++) {
        const a = ((i + w.rng.range(0.2, 0.8)) / n) * Math.PI * 2;
        const far = w.rng.range(LIFT_HALF.x + 14, LIFT_HALF.x + 32);
        const sp = Math.sqrt(2 * PICKUP_FRICTION * far);
        w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: l.x, y: l.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
      }
    } else for (let i = 0; i < n; i++) {
      // Scattered around, a bit more in the direction of the killing shot.
      const a = en.lastHit + w.rng.range(-1.6, 1.6);
      const sp = w.rng.range(50, 110);
      w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: spot.x, y: spot.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
    }
    for (let i = 0; i < (en.def.loot.hearts ?? 0); i++) {
      // Spare hearts roll out slowly towards the player, so they are easy to see.
      const a = Math.atan2(w.player.y - en.y, w.player.x - en.x) + w.rng.range(-0.5, 0.5);
      const sp = w.rng.range(40, 60);
      const at = freeSpot(w, en.x, en.y, PICKUP_RADIUS);
      w.pickups.push({ id: w.nextId++, kind: 'corazon', value: 2, x: at.x, y: at.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
    }
  }
  w.enemies = keep;
}

/** Raises the goods lift on clear floor as close to (x, y) as possible. */
function openLift(w: World, x: number, y: number): void {
  const r = Math.max(LIFT_HALF.x, LIFT_HALF.y);
  let at = { x, y };
  // Rings outward until the whole plate is on free floor.
  search: for (let d = 0; d <= 96; d += 6) {
    for (let i = 0; i < (d === 0 ? 1 : 16); i++) {
      const a = (i / 16) * Math.PI * 2;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      if (isClear(w, px, py, r)) {
        at = { x: px, y: py };
        break search;
      }
    }
  }
  w.lift = { x: at.x, y: at.y, t: 0 };
  w.events.push({ type: 'lift', x: at.x, y: at.y });
}

/** Whether (x, y) is on the lift's plate (well inside it). */
export function onLift(l: Lift, x: number, y: number): boolean {
  return Math.abs(x - l.x) < LIFT_HALF.x - 4 && Math.abs(y - l.y) < LIFT_HALF.y - 2;
}

function updateLift(w: World): void {
  const l = w.lift;
  if (!l || w.over) return;
  const was = l.t;
  l.t += DT;
  if (was < LIFT_READY && l.t >= LIFT_READY) w.events.push({ type: 'liftReady', x: l.x, y: l.y });
  const p = w.player;
  if (l.t >= LIFT_READY && !isRolling(p) && onLift(l, p.x, p.y)) {
    w.won = true;
    p.vx = 0;
    p.vy = 0;
    w.bullets = [];
    w.emitters = [];
    w.events.push({ type: 'floorDone', x: l.x, y: l.y, seconds: Math.round(w.tick * DT), kills: w.kills, coupons: p.coupons });
  }
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
    if (k.price !== undefined) {
      // For sale: it stays on its shelf until the toaster walks onto it and pays.
      const on = d < WEAPON_GRAB && !isRolling(p) && k.age >= PICKUP_DELAY && !w.over;
      if (!on) {
        k.touched = false;
        keep.push(k);
        continue;
      }
      if (k.touched) {
        keep.push(k);
        continue;
      }
      k.touched = true;
      const good = k.kind;
      const item = k.item ?? k.weapon;
      const refuse = good === 'corazon' && p.hp >= p.def.maxHp ? 'full' : p.coupons < k.price ? 'poor' : null;
      if (refuse) {
        w.events.push({ type: 'shop', x: k.x, y: k.y, outcome: refuse, good, price: k.price, left: p.coupons, item });
        keep.push(k);
        continue;
      }
      p.coupons -= k.price;
      w.events.push({ type: 'shop', x: k.x, y: k.y, outcome: 'bought', good, price: k.price, left: p.coupons, item });
      delete k.price;
      delete k.touched;
      grab(w, k);
      continue;
    }
    // A spare heart stays where it is while the toaster has all its life.
    if (k.kind === 'arma') {
      // A weapon waits on its pedestal until the toaster walks onto it (rolling over it does not count).
      if (k.age >= PICKUP_DELAY && d < WEAPON_GRAB && !isRolling(p) && k.weapon) {
        giveWeapon(w, k.weapon);
        w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.arsenal.length, weapon: k.weapon });
        continue;
      }
      keep.push(k);
      continue;
    }
    if (k.kind === 'objeto') {
      // So does a passive item.
      if (k.age >= PICKUP_DELAY && d < WEAPON_GRAB && !isRolling(p) && k.item) {
        giveItem(w, k.item);
        w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.items.length, item: k.item });
        continue;
      }
      keep.push(k);
      continue;
    }
    if (k.kind === 'activo') {
      // And an active item, which swaps places with the one carried (that one waits until the toaster steps off it).
      if (k.stepOff && d >= WEAPON_GRAB + 4) delete k.stepOff;
      if (k.age >= PICKUP_DELAY && d < WEAPON_GRAB && !isRolling(p) && k.item && !k.stepOff) {
        // (The one it was carrying is pushed onto w.pickups and visited later in this loop.)
        giveActive(w, k.item, k.charge);
        w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.active?.charge ?? 0, item: k.item });
        continue;
      }
      keep.push(k);
      continue;
    }
    const wanted = k.kind !== 'corazon' || p.hp < p.def.maxHp;
    if (wanted && k.age >= PICKUP_DELAY && d < PICKUP_GRAB) {
      if (k.kind === 'corazon') p.hp = Math.min(p.def.maxHp, p.hp + k.value);
      else if (k.kind === 'ticket') p.tickets += k.value;
      else p.coupons += k.value;
      w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: k.value, total: k.kind === 'corazon' ? p.hp : k.kind === 'ticket' ? p.tickets : p.coupons });
      continue;
    }
    if (wanted && k.age >= PICKUP_DELAY && d < PICKUP_MAGNET) {
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
    // Emptying the test room counts as clearing a room.
    chargeActive(w);
  }
}

/** A combat room's shutters roll up once its last enemy falls. */
function updateDoors(w: World): void {
  if (w.doorsShut && fights(w.room) && w.enemies.length === 0) {
    w.doorsShut = false;
    w.events.push({ type: 'doors', shut: false });
    chargeActive(w);
    if (w.floor) {
      const st = w.floor.rooms[w.floor.current]!;
      st.cleared = true;
      if (st.reward === 'ticket') dropTicket(w, ...roomMiddle(w));
      else if (st.reward === 'chest') placeChest(w, ...roomMiddle(w));
    }
    setDoorTiles(w, true);
  }
}

/** The middle of the room's floor (below the back wall), where rewards turn up. */
function roomMiddle(w: World): [number, number] {
  const r = w.room;
  return [r.w / 2, (r.h + BACK_WALL_ROWS * TILE) / 2];
}

/** A purchase ticket pops out at (x, y) (or the nearest free floor). */
export function dropTicket(w: World, x: number, y: number): void {
  const at = freeSpot(w, x, y, PICKUP_RADIUS);
  const a = w.rng.range(0, Math.PI * 2);
  w.pickups.push({ id: w.nextId++, kind: 'ticket', value: 1, x: at.x, y: at.y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, age: 0 });
  w.events.push({ type: 'reward', reward: 'ticket', x: at.x, y: at.y });
}

/**
 * A shut chest turns up as close to (x, y) as it fits: on clear floor, off the toaster and off
 * anything lying on the floor. Returns its prop.
 */
export function placeChest(w: World, x: number, y: number): PropInstance {
  const def = PROPS.cofre!;
  const p = w.player;
  const fits = (cx: number, cy: number): boolean => {
    const box = { x: cx + def.box.x, y: cy + def.box.y, w: def.box.w, h: def.box.h };
    const pad = { x: box.x - 6, y: box.y - 6, w: box.w + 12, h: box.h + 12 };
    if (overlaps(pad, playerFeetBox(p, p.def.footRadius + 4))) return false;
    if (w.pickups.some((k) => pointInRect(k.x, k.y, pad))) return false;
    return !solidsNear(w, pad).some((s) => overlaps(pad, s));
  };
  // Snapped to a tile, like the props of the templates (the bot's paths go round whole tiles).
  const c0 = Math.floor(x / TILE);
  const r0 = Math.floor(y / TILE);
  let at = { x: c0 * TILE + TILE / 2, y: (r0 + 1) * TILE - 2 };
  search: for (let d = 0; d <= 5; d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
        const cx = (c0 + dc) * TILE + TILE / 2;
        const cy = (r0 + dr + 1) * TILE - 2;
        if (fits(cx, cy)) {
          at = { x: cx, y: cy };
          break search;
        }
      }
    }
  }
  const prop: PropInstance = { def, x: at.x, y: at.y, box: { x: at.x + def.box.x, y: at.y + def.box.y, w: def.box.w, h: def.box.h }, chest: { id: w.nextId++, open: false, nag: 0 } };
  w.room.props.push(prop);
  w.events.push({ type: 'reward', reward: 'chest', x: at.x, y: at.y });
  return prop;
}

/** Hands over something bought (as if it had been picked up off the floor). */
function grab(w: World, k: Pickup): void {
  const p = w.player;
  if (k.kind === 'arma' && k.weapon) {
    giveWeapon(w, k.weapon);
    w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.arsenal.length, weapon: k.weapon });
  } else if (k.kind === 'objeto' && k.item) {
    giveItem(w, k.item);
    w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.items.length, item: k.item });
  } else if (k.kind === 'activo' && k.item) {
    giveActive(w, k.item, k.charge);
    w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: p.active?.charge ?? 0, item: k.item });
  } else {
    if (k.kind === 'corazon') p.hp = Math.min(p.def.maxHp, p.hp + k.value);
    else if (k.kind === 'ticket') p.tickets += k.value;
    else p.coupons += k.value;
    w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: k.value, total: k.kind === 'corazon' ? p.hp : k.kind === 'ticket' ? p.tickets : p.coupons });
  }
}

/** The decks loot comes from: the floor's, or (a single room) the world's own. */
function decksOf(w: World): { weapons: string[]; items: string[]; actives: string[] } {
  if (w.floor) return w.floor;
  w.looseDecks ??= lootDecks(w.seed, w.level);
  return w.looseDecks;
}

/**
 * Walking into a shut chest with a ticket opens it: the ticket is spent, the next passive item
 * (else the next active item, else the next weapon) comes out in front of it with a few
 * coupons. Without a ticket it only complains (now and then).
 */
function updateChests(w: World): void {
  const p = w.player;
  for (const pr of w.room.props) {
    const c = pr.chest;
    if (!c || c.open) continue;
    c.nag = Math.max(0, c.nag - DT);
    const reach = { x: pr.box.x - CHEST_REACH, y: pr.box.y - CHEST_REACH, w: pr.box.w + CHEST_REACH * 2, h: pr.box.h + CHEST_REACH * 2 };
    if (w.over || isRolling(p) || !overlaps(reach, playerFeetBox(p, p.def.footRadius))) continue;
    if (p.tickets <= 0) {
      if (c.nag === 0) {
        w.events.push({ type: 'chest', x: pr.x, y: pr.y, opened: false, tickets: 0 });
        c.nag = 2;
      }
      continue;
    }
    p.tickets--;
    c.open = true;
    const decks = decksOf(w);
    // Out in front (below) of the chest, or wherever there is room.
    const spot = freeSpot(w, pr.x, pr.y + 32, 8);
    const base = { x: spot.x, y: spot.y, vx: 0, vy: 0, age: 0, value: 1 };
    let item: string | undefined;
    if (decks.items.length > 0) {
      item = decks.items.shift()!;
      w.pickups.push({ id: w.nextId++, kind: 'objeto', item, ...base });
    } else if (decks.actives.length > 0) {
      item = decks.actives.shift()!;
      w.pickups.push({ id: w.nextId++, kind: 'activo', item, charge: ACTIVE_ITEMS[item]!.charges, ...base });
    } else if (decks.weapons.length > 0) {
      item = decks.weapons.shift()!;
      w.pickups.push({ id: w.nextId++, kind: 'arma', weapon: item, ...base });
    }
    const out = freeSpot(w, pr.x, pr.y + 6, PICKUP_RADIUS);
    for (let i = 0; i < CHEST_COUPONS + (item ? 0 : 3); i++) {
      const a = Math.PI / 2 + w.rng.range(-1.2, 1.2);
      const sp = w.rng.range(50, 100);
      w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: out.x, y: out.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
    }
    w.events.push({ type: 'chest', x: pr.x, y: pr.y, opened: true, tickets: p.tickets, item });
  }
}

export function step(w: World, input: Input): void {
  w.events = [];
  // Gone down the lift: the floor is done and nothing moves any more.
  if (w.won) {
    w.tick++;
    return;
  }
  if (w.intro) {
    stepIntro(w, w.intro, input);
    w.tick++;
    return;
  }
  // Once down, the toaster lies there: the room goes on without it.
  updatePlayer(w, w.over ? { ...NO_INPUT, aimX: w.player.x + Math.cos(w.player.aim), aimY: w.player.y - HAND_HEIGHT + Math.sin(w.player.aim) } : input);
  if (input.useItem && !w.over) useActive(w);
  // On hold (Música de Espera) enemies, their bullets and their attacks stand still.
  const held = w.holdT > 0;
  if (held) {
    w.holdT = Math.max(0, w.holdT - DT);
    if (w.holdT === 0) w.events.push({ type: 'holdEnd' });
  }
  if (input.debugPattern && !w.over) {
    const def = PATTERNS[input.debugPattern];
    const d = w.dummies[0];
    if (def && d) {
      const y = d.y - 20;
      firePattern(w, def, d.x, y, Math.atan2(w.player.y - HAND_HEIGHT - y, w.player.x - d.x), { telegraph: ENEMY_TELEGRAPH, source: d.id, by: 'maniqui', height: 20 });
    }
  }
  if (!held) updateEmitters(w);
  if (isRolling(w.player) && !w.over) rollCut(w);
  updateBullets(w, held);
  if (!held) updateFrost(w);
  reapEnemies(w);
  updateDummies(w);
  if (!held) updateEnemies(w);
  updatePickups(w);
  updateChests(w);
  updateRestock(w);
  updateDoors(w);
  updateLift(w);
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
    if (isDead(en) && !(en.state === 'dying' && en.t <= en.until + DT)) errs.push(`enemy ${en.id} is dead but still in the world`);
    if (en.state === 'dying' && !isDead(en)) errs.push(`enemy ${en.id} is coming apart with life left`);
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
  const parts = [w.floor?.current ?? -1, w.tick, p.x.toFixed(3), p.y.toFixed(3), p.aim.toFixed(4), p.weapon.ammo, w.bullets.length, w.nextId, w.kills, p.coupons, p.tickets, w.pickups.length, p.hp];
  for (const d of w.dummies) parts.push(d.damageTaken);
  for (const en of w.enemies) parts.push(en.x.toFixed(2), en.y.toFixed(2), en.state, en.damageTaken);
  for (const f of w.frost) parts.push(f.x.toFixed(2), f.y.toFixed(2), f.t.toFixed(3));
  if (w.lift) parts.push(w.lift.x.toFixed(2), w.lift.y.toFixed(2), w.won ? 'won' : 'lift');
  return parts.join('|');
}
