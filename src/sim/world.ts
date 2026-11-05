// The simulation: pure, deterministic, no Phaser and no DOM. One call to step() is one tick of 1/60 s.
import { CHARACTERS } from '../data/characters.ts';
import { floorBossOf, HUB, ROOMS, slotEnemiesOf, templatesOf } from '../data/rooms.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../data/weapons.ts';
import { ACTIVE_ITEMS, FINDABLE_ACTIVES, ITEMS, itemsUpTo } from '../data/items.ts';
import { ENEMIES } from '../data/enemies.ts';
import { SHOP_PRICES, SHOP_SHELVES, type ShopGood } from '../data/shop.ts';
import type { BulletBehaviour, CharacterDef, DummyDef, EnemyDef, Modifier, Perks, RoomTemplate, SurpriseDef, WeaponDef } from '../data/types.ts';
import { activeSynergies, moddedCharacter, moddedWeapon, perksOf } from './mods.ts';
import { SYNERGIES } from '../data/synergies.ts';
import { bossWarnSpot, isRunDown, updateEnemies } from './enemies.ts';
import { PATTERNS } from '../data/patterns.ts';
import { Rng } from './rng.ts';
import { expandPattern, isAimed, type BulletColor, type Homing, type PatternDef, type ShotSpec } from './patterns.ts';
import { generateFloor, OPPOSITE, type Dir, type Floor } from './floor.ts';
import {
  BACK_WALL_ROWS,
  buildRoom,
  doorApron,
  doorCells,
  fillTemplate,
  isWallAt,
  TILE,
  wallRectsNear,
  type PropInstance,
  type Room,
  type RoomDoor,
  type ChestTier,
  type Station,
  type StationKind,
  type TipSide,
} from './room.ts';
import { PROPS } from '../data/props.ts';
import { SPECIAL_HEARTS, SURGE_DAMAGE, SURGE_VALUE, TURBO_DAMAGE, TURBO_HEAL } from '../data/hearts.ts';
import { LORE } from '../data/lore.ts';
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
  /**
   * The interact button was pressed on this tick (F or a pad button): talk, buy, open a chest.
   * Walking onto them no longer does it (nota del humano del 2026-10-30).
   */
  interact?: boolean;
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
  /** Pilas No Incluidas (Perks.rush): seconds left of firing faster after a reload. */
  rushT?: number;
  /**
   * Mascota Virtual (Perks.pet): how fed it is (0 to its max), and whether the toaster has been hurt
   * since the last combat room was cleared (then clearing one does not feed it).
   */
  pet?: number;
  petHurt?: boolean;
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
  /**
   * The Garantía Provisional (M9b 12a): life on loan, in halves of a heart like `hp`. A hit takes
   * it first; it is not healed, and it expires when the toaster goes down to another floor.
   */
  shield: number;
  /**
   * The special temporary hearts (M9b 12b, src/data/hearts.ts). `surge`: the Corazón de
   * Sobretensión, life on loan in halves (it pays before the warranty, and when a hit breaks it, it
   * shocks the room). `turbo`: the Corazón Modo Turbo is on (more damage until the next combat room
   * is cleared). Both are gone on the next floor.
   */
  surge: number;
  turbo: boolean;
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
export type PickupKind = 'cupon' | 'corazon' | 'garantia' | 'turbo' | 'sobretension' | 'ticket' | 'arma' | 'objeto' | 'activo' | 'documento';

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
  /** A story document on the floor of a secret room (kind 'documento'): its id in src/data/lore.ts. */
  doc?: string;
  /** Put down just now under the toaster: it cannot be picked up until the toaster has stepped off it. */
  stepOff?: boolean;
  /** For sale on a shop shelf: its price in coupons (the interact button buys it, if it can be paid). */
  price?: number;
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
  /** Glitter: what it does to the speed of the enemies it hits (BulletBehaviour.slow). */
  slow?: NonNullable<BulletBehaviour['slow']>;
  /**
   * Age (s) at which its seeking last started: 0 when fired, and again every time it bounces or
   * goes through an enemy (M9b (14): the card and the manual or the drill complement each other).
   */
  seekFrom?: number;
  /** Shot down this tick: it is gone. */
  cut?: boolean;
  /** Player bullets: id of the weapon that fired it (how it is drawn). */
  weapon?: string;
  /** Player bullets: a critical hit (its damage is already multiplied). */
  crit?: boolean;
  /** Player bullets: the last of the magazine with the limited-edition sticker (BulletBehaviour.last). */
  limited?: boolean;
  /** Player bullets with Plastilina Mezclada: they stick where they hit (BulletBehaviour.stick)... */
  stick?: NonNullable<BulletBehaviour['stick']>;
  /** ...and this one is stuck: it stays put and hurts every enemy that walks into it. */
  stuck?: boolean;
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
  /** It comes out of enemy `id`, (dx, dy) px from its feet, wherever that enemy walks (a boss drifting while it fires). */
  follow?: { id: number; dx: number; dy: number };
  /** How its warning looks, if not the usual closing ring: a camera flash charging on the floor. */
  mark?: 'flash';
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
  /** How its warning looks (Emitter.mark). */
  mark?: 'flash';
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
  /** Being watched live (a webcam shared its screen): for `t` more s its waits run `scale` times faster. */
  rush?: { t: number; scale: number };
  /** Remote-control cars: seconds before its batteries next give out (see RcCarBrain.stall). */
  stallT?: number;
  /** Glitter (BulletBehaviour.slow): seconds left of going at `slowMul` of its speed. */
  slowT?: number;
  slowMul?: number;
  /** Turrets that jam: volleys left before the next jam. */
  volleys?: number;
  /** Bosses: index of the phase it is in, and of the attack it is doing or did last. */
  bossPhase?: number;
  attack?: number;
  /** Bosses with relays: seconds it has gone without any (see BossPhase.relays.every). */
  relayT?: number;
  /**
   * Bosses: seconds left of the current leg of its walk, how fast (share of its speed), which way
   * round the player (1 or -1) and how far from it.
   */
  legT?: number;
  legPace?: number;
  legSpin?: number;
  legKeep?: number;
  /**
   * Bosses on the catwalk (BossRunwayAttack): where it is walking to, px left before the next
   * flash, and seconds it has gone without getting anywhere (it gives up on a blocked catwalk).
   */
  runTo?: { x: number; y: number };
  /** The turn onto the catwalk: it first walks straight up or down to its lane, with no flashes. */
  runVia?: { x: number; y: number };
  runGap?: number;
  runStuck?: number;
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
  /**
   * Not frost but a building piece a bucket lobs (its frame in the `pieza` sheet): it lies on the
   * floor until `life`; stepping on it walking hurts (`damage`) and uses it up; a player bullet
   * sweeps it away (`swept`); rolling over it does nothing. It never slows anyone down.
   */
  brick?: number;
  damage?: number;
  swept?: boolean;
  /** A piece that lands under the player's feet does nothing until the player has stepped off it. */
  armed?: boolean;
  /** Who threw it (enemy id, and its kind for the sick-leave report). */
  source: number;
  by: string;
}

/** Frost patches are flattened ellipses, as seen in three-quarter view. */
export const FROST_FLAT = 0.6;
/** No more patches than this at once: the oldest melts. */
export const MAX_FROST = 8;
/** No more building pieces on the floor than this: the oldest is tidied away. */
export const MAX_BRICKS = 12;
/** Building pieces hurt within this radius of the player's feet (and are swept by bullets within it). */
export const BRICK_RADIUS = 5;

export type SimEvent =
  /** The interact button at a station of the Mostrador: it talks (or opens its panel). */
  | { type: 'interact'; station: StationKind }
  | { type: 'shot'; x: number; y: number; angle: number; weapon: string; limited?: boolean }
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
  /** A wind-up toy sets off, bounces off something, runs down, or starts winding itself up. */
  | { type: 'windGo' | 'windBounce' | 'windDown' | 'windUp'; x: number; y: number; source: number }
  /** A surprise envelope takes off or lands; or it breaks and `what` comes out (its SurpriseDef line). */
  | { type: 'hop' | 'hopLand'; x: number; y: number; source: number }
  | { type: 'surprise'; x: number; y: number; line: string; spawned: number[]; coupons: number }
  /** A remote-control car overturns against something, rights itself, or its batteries give out. */
  | { type: 'carFlip' | 'carRight' | 'carStall'; x: number; y: number; source: number }
  | { type: 'reveal'; x: number; y: number; source: number }
  | { type: 'lagJump'; x: number; y: number; tx: number; ty: number; source: number }
  /** A webcam starts recording, loses the player, or shares its screen (`told` enemies attack now). */
  | { type: 'recStart'; x: number; y: number; source: number }
  | { type: 'recLost'; x: number; y: number; source: number }
  | { type: 'alert'; x: number; y: number; told: number[]; source: number }
  | { type: 'bulletFade'; x: number; y: number }
  | { type: 'roll'; x: number; y: number; dirX: number; dirY: number }
  | { type: 'reloadStart'; time: number }
  | { type: 'reloadEnd' }
  /** Pilas No Incluidas: a fresh magazine fires faster for `time` s. */
  | { type: 'rush'; x: number; y: number; time: number }
  /** Caja de Cartón Vacía: a hit that did nothing («Era solo la caja»). */
  | { type: 'shrug'; x: number; y: number }
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
  | { type: 'frostLand'; x: number; y: number; r: number; product?: number; brick?: number }
  /** A building piece is stepped on (it hurt) or swept away by a bullet. */
  | { type: 'brickStep' | 'brickSwept'; x: number; y: number; brick: number; angle?: number }
  /** A boss starts a new phase of its fight. */
  | { type: 'bossPhase'; boss: number; phase: number; name: string; reboot?: string; line?: string; stage?: number }
  /** A boss breaks out of its shell (BossPhase.shed): the prop is left at (x, y) (bottom-centre). */
  | { type: 'shed'; boss: number; x: number; y: number; prop: string }
  /** A boss calls its helpers (BossPhase.summon): they pop out next to it. */
  | { type: 'summon'; boss: number; x: number; y: number; spawned: number[] }
  /** The catwalk starts (the boss sets off) and each camera flash is left on the floor. */
  | { type: 'runway'; boss: number; x: number; y: number }
  | { type: 'flash'; x: number; y: number }
  /** A boss plants a relay (the Router's repeaters), and marks dropped connections on the floor. */
  | { type: 'relayPlant'; x: number; y: number; source: number }
  | { type: 'drops'; boss: number; count: number }
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
  /** The toaster stepped on the Mostrador's conveyor: the hub is done and a run starts (see leaveHub). */
  | { type: 'leaveHub'; x: number; y: number }
  /** The toaster stepped on the lift: the floor is done (see World.won). */
  | { type: 'floorDone'; x: number; y: number; seconds: number; kills: number; coupons: number }
  | { type: 'restock' }
  /** A cleared room left its reward: a ticket popped out, or a chest turned up. */
  | { type: 'reward'; reward: RoomReward; x: number; y: number; tier?: ChestTier }
  /** Walked into a shut chest: opened with a ticket (`item` is what came out), or locked (no ticket). */
  | { type: 'chest'; x: number; y: number; opened: boolean; tickets: number; item?: string; tier?: ChestTier; allen?: boolean }
  /** Plastilina Mezclada: a bullet stuck where it hit (`slows`: with Manualidades). */
  | { type: 'stick'; x: number; y: number; slows: boolean }
  /** Mascota Virtual: fed one level (`level` up to `max`), or starved back to 0 by a hit (`was` the level it had). */
  | { type: 'pet'; level: number; max: number; x: number; y: number; was?: number }
  /** Mando con Vibración: hurt, the toaster shakes out a ring of its own bullets. */
  | { type: 'hurtRing'; x: number; y: number; count: number }
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
  | { type: 'hurt'; x: number; y: number; damage: number; hp: number; dirX: number; dirY: number; source: number; shield?: number; covered?: number; surge?: number }
  /** The Corazón de Sobretensión broke: every enemy in `targets` took SURGE_DAMAGE. */
  | { type: 'surge'; x: number; y: number; targets: { id: number; x: number; y: number }[] }
  /** The Corazón Modo Turbo ran out (a combat room was cleared, M9b 12b). */
  | { type: 'turboEnd' }
  /** A prop that can blow up (at its feet x, y) was hit: `damage` of its `hp` taken; then lit, then the blast (M9b 13a). */
  | { type: 'propHit'; x: number; y: number; damage: number; hp: number }
  | { type: 'propLit'; x: number; y: number; fuse: number }
  | { type: 'blast'; x: number; y: number; radius: number; prop: string; floorY: number }
  /** A table was tipped over (M9b 13b) to face `side`; hit while covering (`wear` of `hp`); broken. */
  | { type: 'tip'; x: number; y: number; side: TipSide }
  | { type: 'tableHit'; x: number; y: number; wear: number; hp: number; side: TipSide }
  | { type: 'tableBroke'; x: number; y: number; side?: TipSide }
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
  /** Story documents picked up in this run (src/data/lore.ts), carried up from floor to floor. */
  docs: string[];
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
  /** The Mostrador: the toaster stepped on the conveyor, the hub stands still and a run is due (see leaveHub). */
  leftHub: boolean;
  /** A single room (no floor): chests opened without a ticket in it (see FloorRun.freeChests). */
  freeChests?: number;
  /**
   * Bullets born in the middle of the bullet update (the Mando con Vibración's ring, when a bullet
   * hurts the toaster): they join the others once it is over (see step).
   */
  pendingBullets?: Bullet[];
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
/** Speed of a boss's bullets while on hold (Música de Espera): it slows down instead of stopping. */
export const HOLD_BOSS_SCALE = 0.5;

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
export type RoomReward = 'ticket' | 'chest' | 'heart' | 'shield' | 'turbo' | 'surge';
/**
 * The economy is scarce (nota del humano del 2026-10-30): a run starts with one ticket, each floor
 * has one combat room that leaves a ticket, two chests wait in the treasure room (one more in the
 * secret room), and now and then a cleared combat room leaves another chest. There are more
 * chests than tickets: often one stays shut.
 */
export const START_TICKETS = 1;
/** Combat rooms of each floor that leave a ticket when cleared. */
export const FLOOR_TICKETS = 1;
/** Chance that any other combat room leaves a chest when cleared (decided with the floor). */
export const CLEAR_CHEST_CHANCE = 0.15;
/**
 * Chance that a combat room with no ticket and no chest leaves a spare heart when cleared (decided
 * with the floor, M9b 15). Without them nothing heals between the start and the boss but the shop,
 * and the bot reached the boss with half a heart: hard was turning into impossible.
 */
export const CLEAR_HEART_CHANCE = 0.35;
/**
 * Chance that a combat room with no ticket and no chest leaves a Garantía Provisional instead
 * (decided before the heart, M9b 12a): rarer than a heart, but the commonest of the special ones.
 */
export const CLEAR_SHIELD_CHANCE = 0.1;
/** The provisional warranty: what one gives (a heart) and the most the toaster can carry (two). */
export const SHIELD_VALUE = 2;
export const SHIELD_MAX = 4;
/** Chests in the treasure room. */
export const TREASURE_CHESTS = 2;
/** Coupons that spill out of a chest with its item. */
export const CHEST_COUPONS = 1;
/** Odds that a chest is the premium one (only good things in it). */
export const PREMIUM_CHANCE = 0.15;
/** Odds that a chest holds a weapon, or an active item (else a passive item). */
const CHEST_WEAPON = 0.2;
const CHEST_ACTIVE = 0.25;
/** How close the toaster's feet have to get to a chest to open it with the interact button (px). */
const CHEST_REACH = 10;
/** How close (px) to a standing table the toaster must be to tip it over. */
export const TIP_REACH = 8;

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
  /** Chests opened without a ticket on this floor (Perks.freeChests, the Allen key). */
  freeChests?: number;
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
  /** The Mostrador de Devoluciones (the hub between runs) instead of a room or a floor. */
  hub?: HubOptions;
}

/** Who is in the Mostrador this time (the profile decides; see src/sim/dialogue.ts). */
export interface HubOptions {
  /** The Chatarrero turns up once a boss has fallen; without him his spot is clear floor. */
  chatarrero?: boolean;
}

export function createWorld(opts: WorldOptions): World {
  const floor = opts.floor && !opts.hub ? planFloor(opts.seed, opts.level ?? 1) : null;
  const single = opts.hub ? HUB : opts.template ?? ROOMS[opts.room ?? 'sala-pruebas'];
  let tpl = floor ? floor.rooms[floor.current]!.template : single;
  if (!tpl) throw new Error(`Unknown room ${opts.room}`);
  const filled = !floor && !opts.template && tpl.kind && tpl.kind !== 'hub';
  if (filled) tpl = fillTemplate(tpl, new Rng(`sala:${opts.seed}`), { depth: opts.depth ?? 3, pool: slotEnemiesOf(opts.level ?? 1), boss: floorBossOf(opts.level ?? 1) });
  const def = CHARACTERS[opts.character ?? 'tostadora'];
  if (!def) throw new Error(`Unknown character ${opts.character}`);
  const wdef = WEAPONS[def.startWeapon];
  if (!wdef) throw new Error(`Unknown weapon ${def.startWeapon}`);
  const room = floor ? floorRoomOf(floor, floor.current) : buildRoom(tpl, opts.doors);
  if (opts.hub && !opts.hub.chatarrero) {
    room.stations = room.stations.filter((st) => st.kind !== 'chatarrero');
    room.props = room.props.filter((pr) => pr.def.id !== 'chatarrero');
  }
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
      shield: 0,
      surge: 0,
      turbo: false,
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
      tickets: floor ? START_TICKETS : 0,
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
    docs: [],
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
    leftHub: false,
  };
  w.player.arsenal.push(w.player.weapon);
  if (floor) {
    floor.rooms[floor.current]!.visited = true;
    setDoorTiles(w, true);
    return w;
  }
  // The test room lays out every findable weapon on its pedestals, to try them all; a treasure
  // (or secret) room played on its own stocks its pedestals as on a floor (and the secret one keeps
  // its story document).
  if (room.kind === 'hub') return w;
  if (room.kind === 'test') stockPedestals(w, [...FINDABLE_WEAPONS], [], []);
  else if (room.kind === 'shop') stockShop(w, decksOf(w));
  else if (room.kind === 'treasure' || room.kind === 'secret') {
    const decks = lootDecks(opts.seed, opts.level ?? 1);
    stockPedestals(w, decks.weapons, decks.items, decks.actives);
    if (room.kind === 'secret') placeStoryDoc(w);
  }
  if (w.spawnsEnemies) spawnRoomEnemies(w);
  // Walking into a combat room brings its shutters down until the last enemy falls.
  if (fights(room) && w.enemies.length > 0) w.doorsShut = true;
  startIntro(w);
  return w;
}

/**
 * The run that starts when the toaster steps on the Mostrador's conveyor: floor 1 of a new run,
 * seeded by `seed` (the caller picks a fresh one per run), with the same character. Null while
 * the toaster has not stepped on it (or outside the hub).
 */
export function leaveHub(w: World, seed: string): World | null {
  if (w.room.kind !== 'hub' || !w.leftHub) return null;
  return createWorld({ seed, floor: true, level: 1, character: w.player.base.def.id });
}

/** How close (px) the toaster's feet must be to a station of the hub to use it. */
export const STATION_REACH = 30;

/** The hub's station the toaster is standing at (the closest within STATION_REACH), or null. */
export function nearStation(w: World): Station | null {
  const p = w.player;
  let best: Station | null = null;
  let bestD = STATION_REACH;
  for (const st of w.room.stations) {
    const d = Math.hypot(st.x - p.x, st.y - p.y);
    if (d < bestD) {
      best = st;
      bestD = d;
    }
  }
  return best;
}

/** Whether the toaster's feet are on the hub's conveyor (not just brushing its sides; against the wall behind it counts). */
export function onBelt(w: World): boolean {
  const b = w.room.belt;
  const p = w.player;
  return !!b && p.x > b.x + 4 && p.x < b.x + b.w - 4 && p.y > b.y && p.y < b.y + b.h;
}

/** The hub: stepping on the conveyor (not rolling over it) ends it. */
function updateBelt(w: World): void {
  if (w.room.kind !== 'hub' || w.leftHub || isRolling(w.player) || !onBelt(w)) return;
  const p = w.player;
  w.leftHub = true;
  p.vx = 0;
  p.vy = 0;
  w.events.push({ type: 'leaveHub', x: p.x, y: p.y });
}

/** How many rooms deeper each floor of the store starts (see planFloor): the enemy budget grows with it. */
export const LEVEL_DEPTH = 3;

/** The floors of the store that exist so far (1: the warehouse, 2: Informática, 3: Juguetería). */
export const LAST_LEVEL = 3;

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
  // What was on loan expires with the floor: the warranty and the special hearts.
  Object.assign(n.player, { shield: 0, surge: 0, turbo: false });
  const f = n.floor!;
  const owned = new Set([...p.arsenal.map((ws) => ws.base.id), ...p.items, ...(p.active ? [p.active.id] : [])]);
  f.weapons = f.weapons.filter((id) => !owned.has(id));
  f.items = f.items.filter((id) => !owned.has(id));
  f.actives = f.actives.filter((id) => !owned.has(id));
  n.docs = [...w.docs];
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
    // Each floor up counts as LEVEL_DEPTH rooms deeper: more enemies per room.
    const depth = Math.max(1, fr.depth) + (level - 1) * LEVEL_DEPTH;
    const template = fillTemplate(deal(fr.kind), rng.fork(`sala${fr.id}`), { depth, pool: slotEnemiesOf(level), boss: floorBossOf(level), vary: true });
    return { template, room: null, visited: false, cleared: fr.kind !== 'combat' && fr.kind !== 'boss', pickups: [] };
  });
  // Rewards: a seeded pick of combat rooms (the first ones get the tickets; each of the rest a
  // chest, now and then).
  const prize = new Rng(`premios:${seed}`);
  const combat = prize.shuffle(layout.rooms.filter((fr) => fr.kind === 'combat').map((fr) => fr.id));
  // Hearts with their own generator, so they do not move the tickets and chests around.
  const hearts = new Rng(`corazones:${seed}`);
  const shields = new Rng(`garantias:${seed}`);
  const specials = new Rng(`especiales:${seed}`);
  combat.forEach((id, i) => {
    if (i < FLOOR_TICKETS) rooms[id]!.reward = 'ticket';
    else if (prize.chance(CLEAR_CHEST_CHANCE)) rooms[id]!.reward = 'chest';
    // Every die is rolled every time, so one chance does not move the other's rooms. The rarer
    // (and stronger) reward is decided first: surge, turbo, warranty, heart.
    const special = specials.next();
    const shield = shields.chance(CLEAR_SHIELD_CHANCE);
    const heart = hearts.chance(CLEAR_HEART_CHANCE);
    const surge = SPECIAL_HEARTS.sobretension.chance;
    if (!rooms[id]!.reward && special < surge) rooms[id]!.reward = 'surge';
    else if (!rooms[id]!.reward && special < surge + SPECIAL_HEARTS.turbo.chance) rooms[id]!.reward = 'turbo';
    else if (!rooms[id]!.reward && shield) rooms[id]!.reward = 'shield';
    else if (!rooms[id]!.reward && heart) rooms[id]!.reward = 'heart';
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
  // On a floor nothing lies loose on a pedestal (nota del humano del 2026-10-30): the treasure
  // room keeps its chests, and the secret room one more.
  const kind = f.layout.rooms[id]!.kind;
  if (first && kind === 'treasure') stockChests(w, TREASURE_CHESTS);
  if (first && kind === 'secret') stockChests(w, 1);
  if (first && kind === 'secret') placeStoryDoc(w);
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

/** Shut chests on the room's first `n` item slots (no drop, no thud: they were already there). */
function stockChests(w: World, n: number): void {
  const slots = w.room.slots.filter((s) => s.kind === 'item');
  // Two chests in a row of three slots go on the outer ones, with room to stand between them.
  const pick = n === 2 && slots.length >= 3 ? [slots[0]!, slots[slots.length - 1]!] : slots.slice(0, n);
  for (const s of pick) placeChest(w, s.x, s.y, false);
}

/**
 * The secret room of floor N keeps the story document of that floor (src/data/lore.ts, source
 * `{ secret: N }`) on the floor, two tiles in front of its pedestal (or in the middle of the room).
 * It is there every time: finding it again in another run files nothing new.
 */
function placeStoryDoc(w: World): void {
  const doc = LORE.find((l) => 'secret' in l.source && l.source.secret === w.level);
  if (!doc) return;
  const slot = w.room.slots.find((s) => s.kind === 'item');
  let x = slot ? slot.x : w.room.w / 2;
  let y = slot ? slot.y + 2 * TILE : w.room.h / 2;
  if (isWallAt(w.room, x, y)) {
    x = w.room.w / 2;
    y = w.room.h / 2;
  }
  w.pickups.push({ id: w.nextId++, kind: 'documento', doc: doc.id, x, y, vx: 0, vy: 0, age: PICKUP_DELAY, value: 1 });
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
  if (def.singleUse) p.active = null;
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
  } else if (b.kind === 'relay') {
    state = 'idle';
    until = Infinity;
  } else if (b.kind === 'hopper') {
    state = 'idle';
    until = b.rest[1];
  } else if (b.kind === 'lobber') {
    state = 'idle';
    until = b.interval[0] * 0.6;
  } else if (b.kind === 'windup') {
    // It comes in winding itself up: a moment to see it before it sets off.
    state = 'jam';
    until = b.windup;
  }
  return { id, def, x, y, vx: 0, vy: 0, facing: -1, state, t: 0, until, dirX: 1, dirY: 0, hitT: 0, damageTaken: 0, contactCooldown: 0, moved: 0, owner: -1, phase: 0, lastHit: 0 };
}

/** Pixels above the ground an enemy is drawn (and hit) at: only flying ones are off the floor. */
export function enemyAltitude(en: Enemy): number {
  const b = en.def.brain;
  if (b.kind === 'hopper') return en.state === 'charge' ? Math.sin(Math.PI * Math.min(1, en.t / en.until)) * b.hopHeight : 0;
  return b.kind === 'moth' ? b.altitude : 0;
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
  // A hopping envelope is hit where it is drawn, up in the air.
  const up = 'brain' in d.def && d.def.brain.kind === 'hopper' ? enemyAltitude(d as Enemy) : 0;
  return { x: d.x + d.def.hurt.x, y: d.y + d.def.hurt.y - up, w: d.def.hurt.w, h: d.def.hurt.h };
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
  if (b.slow) out.slow = b.slow;
  if (b.stick) out.stick = b.stick;
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
  if (p.rushT) p.rushT = Math.max(0, p.rushT - DT);
  if (ws.reload > 0) {
    ws.reload -= DT;
    if (ws.reload <= 0) {
      ws.reload = 0;
      ws.ammo = def.magazine;
      w.events.push({ type: 'reloadEnd' });
      // Pilas No Incluidas: a fresh magazine goes faster for a while.
      const rush = playerPerks(p).rush;
      if (rush.time > 0) {
        p.rushT = rush.time;
        w.events.push({ type: 'rush', x: p.x, y: p.y - PLAYER_HURT_Y, time: rush.time });
      }
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
  // The limited-edition sticker: the last bullet of the magazine (before it goes down).
  const lastOne = ws.ammo === 1 && def.bullets?.last ? def.bullets.last : undefined;
  ws.ammo--;
  ws.cooldown = 1 / (def.fireRate * ((p.rushT ?? 0) > 0 ? playerPerks(p).rush.mul : 1));
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
      damage: (isCrit ? def.damage * crit.mul : def.damage) * (p.turbo ? TURBO_DAMAGE : 1) * petScale(p),
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
    if (lastOne) {
      const b = w.bullets[w.bullets.length - 1]!;
      b.damage *= lastOne.mul ?? 1;
      if (lastOne.pierce) b.pierce = (b.pierce ?? 0) + lastOne.pierce;
      b.limited = true;
    }
  }
  p.vx -= Math.cos(p.aim) * def.recoil;
  p.vy -= Math.sin(p.aim) * def.recoil;
  w.events.push({ type: 'shot', x: mx, y: my, angle: p.aim, weapon: def.id, ...(lastOne ? { limited: true } : {}) });
  if (ws.ammo === 0) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'reloadStart', time: def.reloadTime });
  }
}

function updateBullets(w: World, held = false, enemyScale = 1): void {
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    if (b.cut) continue;
    // On hold, enemy bullets hang in the air (and hurt nobody) until the music stops.
    if (held && b.owner === 'enemy') {
      keep.push(b);
      continue;
    }
    // A boss on hold: its bullets go in slow motion (and still hurt).
    const dt = b.owner === 'enemy' ? DT * enemyScale : DT;
    b.life -= dt;
    if (b.life <= 0) {
      w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
      continue;
    }
    b.age += dt;
    if (b.accel) b.speed = Math.min(b.maxSpeed ?? Infinity, Math.max(10, b.speed + b.accel * dt));
    // Homing: it turns towards the player (towards its body, not its feet) for a while.
    let homing = !!b.homing && b.age < b.homing.time && !w.over;
    if (homing) turnTowards(b, w.player.x, w.player.y - PLAYER_HURT_Y, b.homing!.turnDeg);
    // A player bullet that seeks (an item): towards the nearest enemy in range it has not hit yet.
    if (b.seek && !b.stuck && b.age - (b.seekFrom ?? 0) < b.seek.time) {
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
      b.x += (b.vx * dt) / 2;
      b.y += (b.vy * dt) / 2;
      const angle = Math.atan2(b.vy, b.vx);
      const fy = b.y + b.h;
      const prop = isWallAt(w.room, b.x, fy) ? null : bulletProp(w, b.x, fy, b.vx, b.vy);
      if (!b.stuck && (prop || isWallAt(w.room, b.x, fy))) {
        // A prop that can blow up takes the hit (an enemy bullet counts for little); so does a tipped table.
        const hit = b.owner === 'player' ? b.damage : ENEMY_PROP_DAMAGE;
        if (prop?.def.hp) damageProp(w, prop, hit);
        else if (prop?.tipped) wearTable(w, prop, hit);
        if (b.bounce && b.bounce > 0) {
          bounceBullet(w, b);
          w.events.push({ type: 'bulletWall', x: b.x, y: b.y, angle, bounced: true });
          continue;
        }
        w.events.push({ type: 'bulletWall', x: b.x, y: b.y, angle });
        // Plastilina Mezclada: it stays stuck where it hit (just outside the wall).
        if (b.owner === 'player' && b.stick) {
          stickBullet(w, b, dt);
          break;
        }
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
            const damage = en.state === 'roar' ? 0 : b.damage * takenScale(en);
            en.hitT = damage > 0 ? 0.12 : 0.04;
            en.damageTaken += damage;
            en.lastHit = angle;
            if (b.slow && damage > 0) {
              en.slowMul = (en.slowT ?? 0) > 0 ? Math.min(en.slowMul ?? 1, b.slow.mul) : b.slow.mul;
              en.slowT = Math.max(en.slowT ?? 0, b.slow.time);
            }
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
        sweepBricks(w, b.x, fy, b.r, angle);
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

/**
 * Plastilina Mezclada: the bullet stops just short of what it hit and stays there for its stick
 * time, going through every enemy that walks into it (each one once) with no push; with
 * Manualidades it slows them too.
 */
function stickBullet(w: World, b: Bullet, dt: number): void {
  const st = b.stick!;
  b.x -= (b.vx * dt) / 2;
  b.y -= (b.vy * dt) / 2;
  b.vx = 0;
  b.vy = 0;
  b.speed = 0;
  delete b.wave;
  delete b.accel;
  delete b.seek;
  b.bounce = 0;
  b.knockback = 0;
  b.pierce = STUCK_PIERCE;
  b.life = st.time;
  b.stuck = true;
  if (st.slow && (!b.slow || st.slow.mul < b.slow.mul)) b.slow = { ...st.slow };
  w.events.push({ type: 'stick', x: b.x, y: b.y, slows: !!st.slow });
}

/** A stuck bullet goes through (nearly) everyone. */
const STUCK_PIERCE = 99;

/** Mascota Virtual: the damage multiplier its level gives (1 without it or hungry). */
export function petScale(p: Player): number {
  const pet = playerPerks(p).pet;
  return 1 + pet.step * Math.min(p.pet ?? 0, pet.max);
}

/**
 * Mascota Virtual, at a combat room cleared: fed if the toaster went through it unhurt (one more
 * level, up to its max). Either way the count starts again for the next room.
 */
function feedPet(w: World): void {
  const p = w.player;
  const pet = playerPerks(p).pet;
  const hurt = !!p.petHurt;
  p.petHurt = false;
  if (pet.max <= 0 || hurt || (p.pet ?? 0) >= pet.max) return;
  p.pet = (p.pet ?? 0) + 1;
  w.events.push({ type: 'pet', level: p.pet, max: pet.max, x: p.x, y: p.y - PLAYER_HURT_Y });
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

/** Whether a wall or a prop that stops bullets (flying vx, vy) is at (x, y) (a bullet's shadow). */
function stopsBullet(w: World, x: number, y: number, vx: number, vy: number): boolean {
  return isWallAt(w.room, x, y) || !!bulletProp(w, x, y, vx, vy);
}

/** The prop that stops a bullet flying (vx, vy) at (x, y), or null. */
function bulletProp(w: World, x: number, y: number, vx: number, vy: number): PropInstance | null {
  return w.room.props.find((pr) => (pr.def.blocksBullets || (pr.tipped && coversFrom(pr.tipped, vx, vy))) && pointInRect(x, y, pr.box)) ?? null;
}

/** The unit vector a tipped table's top faces. */
export const TIP_FACING: Record<TipSide, { x: number; y: number }> = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };

/**
 * Whether a table tipped to face `side` stops a bullet flying (vx, vy): it does when the bullet
 * comes at its top (against the way it faces), not when it flies off behind it.
 */
export function coversFrom(side: TipSide, vx: number, vy: number): boolean {
  const f = TIP_FACING[side];
  return vx * f.x + vy * f.y < 0;
}

/**
 * The way a table tips when the toaster at (px, py) pushes it: away from her, along the axis she
 * is farther off on (its top then faces what is on the other side).
 */
export function tipSide(pr: PropInstance, px: number, py: number): TipSide {
  const cx = pr.box.x + pr.box.w / 2;
  const cy = pr.box.y + pr.box.h / 2;
  const dx = cx - px;
  const dy = cy - py;
  // The table is wider than deep: compare in units of its own size, so a toaster at a corner
  // pushes it the way she is clearly off it.
  if (Math.abs(dx) / pr.box.w > Math.abs(dy) / pr.box.h) return dx > 0 ? 'E' : 'W';
  return dy > 0 ? 'S' : 'N';
}

/** The interact button at a standing table: over it goes, its top away from the toaster. */
function tipTable(w: World, pr: PropInstance): void {
  if (!pr.def.tip || pr.tipped) return;
  pr.tipped = tipSide(pr, w.player.x, w.player.y - 2);
  w.events.push({ type: 'tip', x: pr.x, y: pr.y, side: pr.tipped });
}

/** A tipped table takes a bullet for the toaster; worn through, it breaks. */
function wearTable(w: World, pr: PropInstance, hit: number): void {
  if (!pr.def.tip || !pr.tipped) return;
  pr.damage = (pr.damage ?? 0) + hit;
  w.events.push({ type: 'tableHit', x: pr.x, y: pr.y, wear: pr.damage, hp: pr.def.tip.hp, side: pr.tipped });
  if (pr.damage >= pr.def.tip.hp) breakTable(w, pr);
}

function breakTable(w: World, pr: PropInstance): void {
  w.room.props = w.room.props.filter((o) => o !== pr);
  w.events.push({ type: 'tableBroke', x: pr.x, y: pr.y, side: pr.tipped });
}

/** Damage an enemy bullet does to a prop that can blow up (the player's bullets do their own). */
export const ENEMY_PROP_DAMAGE = 1;
/** Seconds a prop burns once lit before it goes up: shot, or caught by a blast next to it. */
export const BLAST_FUSE = 0.3;
export const CHAIN_FUSE = 0.15;

/** A prop that can blow up takes `damage`; with none left, it is lit. */
export function damageProp(w: World, pr: PropInstance, damage: number): void {
  if (!pr.def.hp || pr.fuse !== undefined) return;
  pr.damage = (pr.damage ?? 0) + damage;
  w.events.push({ type: 'propHit', x: pr.x, y: pr.y, damage: pr.damage, hp: pr.def.hp });
  if (pr.damage >= pr.def.hp) lightProp(w, pr, BLAST_FUSE);
}

function lightProp(w: World, pr: PropInstance, fuse: number): void {
  if (pr.fuse !== undefined) return;
  pr.fuse = fuse;
  w.events.push({ type: 'propLit', x: pr.x, y: pr.y, fuse });
}

/** Lit props burn down their fuse and blow up (M9b 13a). */
function updateProps(w: World): void {
  for (const pr of w.room.props.slice()) {
    if (pr.fuse === undefined) continue;
    pr.fuse -= DT;
    if (pr.fuse <= 0) blowUp(w, pr);
  }
}

/**
 * A prop blows up: it is gone, every enemy (and dummy) within the blast takes its damage, the
 * toaster gets hurt if it is too close, and the props that can blow up nearby are lit.
 */
function blowUp(w: World, pr: PropInstance): void {
  const blast = pr.def.blast!;
  w.room.props = w.room.props.filter((o) => o !== pr);
  const cx = pr.x;
  const cy = pr.y + pr.def.box.y + pr.def.box.h / 2;
  const near = (x: number, y: number, extra = 0): boolean => Math.hypot(x - cx, y - cy) <= blast.radius + extra;
  for (const en of w.enemies) {
    if (isDead(en) || en.state === 'gone' || en.state === 'dying' || en.state === 'roar') continue;
    const hb = dummyHurtBox(en);
    if (!near(hb.x + hb.w / 2, hb.y + hb.h / 2, Math.min(hb.w, hb.h) / 2)) continue;
    en.damageTaken = Math.min(en.def.hp, en.damageTaken + blast.damage * takenScale(en));
    en.hitT = 0.12;
  }
  for (const d of w.dummies) {
    const hb = dummyHurtBox(d);
    if (!near(hb.x + hb.w / 2, hb.y + hb.h / 2, Math.min(hb.w, hb.h) / 2)) continue;
    d.hitT = 0.12;
    d.damageTaken += blast.damage;
  }
  const p = w.player;
  if (near(p.x, p.y - PLAYER_HURT_Y, PLAYER_HURT_RADIUS)) {
    const d = normalize(p.x - cx, p.y - PLAYER_HURT_Y - cy);
    hurtPlayer(w, blast.hurt, -1, d.x, d.y, { by: 'bidon', how: 'contact' });
  }
  for (const o of w.room.props) if (o.def.hp && near(o.x, o.y + o.def.box.y + o.def.box.h / 2)) lightProp(w, o, CHAIN_FUSE);
  // Tables next to it (standing or tipped) are blown to bits.
  for (const o of w.room.props.slice()) if (o.def.tip && near(o.x, o.y + o.def.box.y + o.def.box.h / 2)) breakTable(w, o);
  w.events.push({ type: 'blast', x: cx, y: cy, radius: blast.radius, prop: pr.def.id, floorY: pr.y });
}

/**
 * Bounces a bullet off what it just flew into: back to where it was, and its speed flipped on
 * the axis that was blocked (both, into a corner).
 */
function bounceBullet(w: World, b: Bullet): void {
  const px = b.x - (b.vx * DT) / 2;
  const py = b.y - (b.vy * DT) / 2;
  const blockedX = stopsBullet(w, b.x, py + b.h, b.vx, b.vy);
  const blockedY = stopsBullet(w, px, b.y + b.h, b.vx, b.vy);
  const flipX = blockedX || !blockedY;
  const flipY = blockedY || !blockedX;
  if (flipX) b.vx = -b.vx;
  if (flipY) b.vy = -b.vy;
  b.x = px;
  b.y = py;
  b.dir = Math.atan2(b.vy, b.vx);
  b.bounce!--;
  if (b.seek) b.seekFrom = b.age;
}

/** A bullet that pierces goes on through what it just hit (once per target), while it has pierce left. */
function pierces(b: Bullet, target: number): boolean {
  if (!b.pierce || b.pierce <= 0) return false;
  b.pierce--;
  (b.hits ??= []).push(target);
  if (b.seek) b.seekFrom = b.age;
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
  if (opts.mark) e.mark = opts.mark;
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
  /** Length of the aimed line, when it reaches a point (a webcam's line of sight to the player). */
  reach?: number;
  /** A camera flash charging on the floor instead of the closing ring (Emitter.mark). */
  mark?: 'flash';
}

export function activeWarnings(w: World): Warning[] {
  const out: Warning[] = [];
  for (const e of w.emitters) {
    const k = telegraphProgress(e);
    if (k < 0) continue;
    const wn: Warning = { x: e.x, y: e.y, k, aim: e.aim, aimed: e.aimed, color: e.color, bullets: true };
    if (e.source !== undefined) wn.source = e.source;
    if (e.mark) wn.mark = e.mark;
    out.push(wn);
  }
  for (const en of w.enemies) {
    if (!warnsByItself(en)) continue;
    const b = en.def.brain;
    if (b.kind === 'boss') {
      const a = b.phases[en.bossPhase ?? 0]?.attacks[en.attack ?? 0];
      const at = a ? bossWarnSpot(en, b, a) : { x: en.x + b.muzzle.x * en.facing, y: en.y - b.muzzle.y };
      const k = Math.min(1, en.t / en.until);
      out.push({ x: at.x, y: at.y, k, aim: 0, aimed: false, color: a?.kind === 'spit' || a?.kind === 'runway' ? 'red' : 'ice', bullets: true, source: en.id });
      // The catwalk: its whole lane, from where it turns onto it to the far end.
      if (a?.kind === 'runway' && en.runTo && en.runVia) {
        const v = en.runVia;
        out.push({ x: v.x, y: v.y, k, aim: Math.atan2(en.runTo.y - v.y, en.runTo.x - v.x), aimed: true, color: 'red', bullets: false, reach: Math.hypot(en.runTo.x - v.x, en.runTo.y - v.y) });
      }
      continue;
    }
    if (b.kind === 'watcher') {
      // Recording: the flash will come from the lens, and its line of sight follows the player.
      const lx = en.x;
      const ly = en.y - b.muzzleY;
      const reach = Math.max(0, Math.hypot(w.player.x - lx, w.player.y - HAND_HEIGHT - ly) - 8);
      out.push({ x: lx, y: ly, k: Math.min(1, en.t / en.until), aim: Math.atan2(w.player.y - HAND_HEIGHT - ly, w.player.x - lx), aimed: true, color: 'red', bullets: true, source: en.id, reach });
      continue;
    }
    if (b.kind === 'lobber') {
      // The lid comes up: the pieces will fly out of the top of the bucket.
      out.push({ x: en.x, y: en.y - b.muzzleY, k: Math.min(1, en.t / en.until), aim: 0, aimed: false, color: 'red', bullets: true, source: en.id });
      continue;
    }
    if (b.kind === 'lagger' && en.dest) {
      // Where the frozen mouse will appear and click: a ring closing in on that spot.
      out.push({ x: en.dest.x, y: en.dest.y - b.muzzleY, k: Math.min(1, en.t / en.until), aim: 0, aimed: false, color: 'red', bullets: true, source: en.id });
      continue;
    }
    out.push({ x: en.x, y: en.y - 2 - enemyAltitude(en), k: Math.min(1, en.t / en.until), aim: Math.atan2(en.dirY, en.dirX), aimed: true, color: 'red', bullets: false, source: en.id });
  }
  return out;
}

export const ENEMY_BULLET_LIFE = 6;
/** 3.5 since the human's note of 2026-10-30 (it was 2.5): bigger bullets, harder to dodge. */
export const ENEMY_BULLET_RADIUS = 3.5;

function updateEmitters(w: World): void {
  const keep: Emitter[] = [];
  for (const e of w.emitters) {
    if (e.follow) {
      const f = e.follow;
      const en = w.enemies.find((o) => o.id === f.id && o.state !== 'dying');
      if (en) {
        e.x = en.x + f.dx;
        e.y = en.y + f.dy;
      }
    }
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
  brick?: number;
  damage?: number;
  source: number;
  by: string;
}

export function throwFrost(w: World, x: number, y: number, h: number, tx: number, ty: number, opts: FrostOptions): Frost {
  const f: Frost = { id: w.nextId++, x: tx, y: ty, r: opts.r, t: -opts.flight, life: opts.life, slow: opts.slow, fromX: x, fromY: y, fromH: h, flight: opts.flight, source: opts.source, by: opts.by };
  if (opts.shatter) f.shatter = opts.shatter;
  if (opts.product !== undefined) f.product = opts.product;
  if (opts.brick !== undefined) {
    f.brick = opts.brick;
    f.damage = opts.damage ?? 1;
  }
  w.frost.push(f);
  w.events.push({ type: 'frostThrow', x, y: y - h, tx, ty, flight: opts.flight, source: opts.source });
  return f;
}

/** Whether (x, y) is inside a landed frost patch. */
export function inFrost(f: Frost, x: number, y: number): boolean {
  if (f.t < 0 || f.brick !== undefined) return false;
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
      w.events.push(
        f.product !== undefined
          ? { type: 'frostLand', x: f.x, y: f.y, r: f.r, product: f.product }
          : f.brick !== undefined
            ? { type: 'frostLand', x: f.x, y: f.y, r: f.r, brick: f.brick }
            : { type: 'frostLand', x: f.x, y: f.y, r: f.r },
      );
      // It shatters into splinters, unless whoever threw it is gone already.
      const def = f.shatter ? PATTERNS[f.shatter] : undefined;
      if (def && !w.over && w.enemies.some((en) => en.id === f.source)) {
        firePattern(w, def, f.x, f.y - 3, Math.atan2(w.player.y - f.y, w.player.x - f.x), { by: f.by, height: 3 });
      }
    }
    if (f.t < f.life && !f.swept) keep.push(f);
  }
  // Too much frost: the oldest patches on the floor melt first (and the oldest pieces are tidied away).
  const landed = (brick: boolean) => (f: Frost): boolean => f.t >= 0 && (f.brick !== undefined) === brick;
  while (keep.filter(landed(false)).length > MAX_FROST) keep.splice(keep.findIndex(landed(false)), 1);
  while (keep.filter(landed(true)).length > MAX_BRICKS) keep.splice(keep.findIndex(landed(true)), 1);
  w.frost = keep;
  stepOnBricks(w);
}

const onBrick = (f: Frost, x: number, y: number): boolean => Math.hypot(x - f.x, (y - f.y) / FROST_FLAT) <= BRICK_RADIUS + 2;

/** The building piece under the player's feet that would hurt, if any (landed, armed and not swept). */
export function brickUnder(w: World, x: number, y: number): Frost | undefined {
  return w.frost.find((f) => f.brick !== undefined && f.t >= 0 && f.armed && !f.swept && onBrick(f, x, y));
}

/**
 * Walking onto a building piece hurts (like stepping on one barefoot) and uses it up; rolling over
 * it does nothing. Only while the player can be hurt: during the blink it is not used up either.
 */
function stepOnBricks(w: World): void {
  const p = w.player;
  // Landing on the toaster's feet is not stepping on it: it arms once they are off it.
  for (const f of w.frost) if (f.brick !== undefined && f.t >= 0 && !f.armed && !onBrick(f, p.x, p.y)) f.armed = true;
  if (isRolling(p) || !canBeHurt(w)) return;
  const f = brickUnder(w, p.x, p.y);
  if (!f) return;
  f.swept = true;
  w.frost = w.frost.filter((o) => o !== f);
  w.events.push({ type: 'brickStep', x: f.x, y: f.y, brick: f.brick! });
  const d = normalize(p.vx, p.vy);
  hurtPlayer(w, f.damage ?? 1, f.source, -d.x, -d.y, { by: f.by, how: 'contact' });
}

/** A player bullet passing over building pieces on the floor sweeps them away (it flies on). */
function sweepBricks(w: World, x: number, floorY: number, r: number, angle: number): void {
  for (const f of w.frost) {
    if (f.brick === undefined || f.t < 0 || f.swept) continue;
    if (Math.hypot(x - f.x, (floorY - f.y) / FROST_FLAT) > BRICK_RADIUS + r) continue;
    f.swept = true;
    w.events.push({ type: 'brickSwept', x: f.x, y: f.y, brick: f.brick, angle });
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
  // «Era solo la caja»: some hits do nothing at all (but the toaster still gets its breather).
  const shrug = playerPerks(p).shrug;
  if (shrug > 0 && w.rng.chance(shrug)) {
    p.invulnerable = HURT_IFRAMES;
    w.events.push({ type: 'shrug', x: p.x, y: p.y - PLAYER_HURT_Y });
    return true;
  }
  // The surge heart pays first, then the provisional warranty (what they cover is gone for good).
  const bySurge = Math.min(p.surge, damage);
  p.surge -= bySurge;
  const covered = bySurge + Math.min(p.shield, damage - bySurge);
  p.shield -= covered - bySurge;
  p.hp = Math.max(0, p.hp - (damage - covered));
  p.invulnerable = HURT_IFRAMES;
  const extra = covered > 0 ? { covered, shield: p.shield, ...(bySurge > 0 ? { surge: p.surge } : {}) } : {};
  w.events.push({ type: 'hurt', x: p.x, y: p.y - PLAYER_HURT_Y, damage, hp: p.hp, dirX, dirY, source, ...extra });
  // Mascota Virtual: a hit and it is back to square one (and this room will not feed it).
  p.petHurt = true;
  if ((p.pet ?? 0) > 0) {
    w.events.push({ type: 'pet', level: 0, max: playerPerks(p).pet.max, x: p.x, y: p.y - PLAYER_HURT_Y, was: p.pet });
    p.pet = 0;
  }
  if (bySurge > 0 && p.surge === 0) surgeShock(w);
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    if (b.owner === 'enemy' && Math.hypot(b.x - p.x, b.y - (p.y - PLAYER_HURT_Y)) < HURT_CLEAR_RADIUS) w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
    else keep.push(b);
  }
  w.bullets = keep;
  // Mando con Vibración: the blow shakes a ring of its own bullets out of the toaster.
  const ring = playerPerks(p).hurtRing;
  if (ring > 0 && p.hp > 0) hurtRing(w, ring);
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

/** How much of a hit an enemy takes: a run-down wind-up toy takes its `exposed` times. */
export function takenScale(en: Enemy): number {
  const b = en.def.brain;
  // A boss out of its box (BossPhase.taken).
  if (b.kind === 'boss') return b.phases[en.bossPhase ?? 0]?.taken ?? 1;
  return isRunDown(en) && b.kind === 'windup' ? b.exposed : 1;
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
  for (const f of w.frost) if (f.t < 0) points.push({ x: f.x, y: f.y, color: f.product !== undefined || f.brick !== undefined ? 'red' : 'ice' });
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
        // The helpers it called (BossPhase.summon) go down with it.
        for (const o of w.enemies) if (o.owner === en.id && o.def.brain.kind !== 'relay' && !isDead(o)) o.damageTaken = o.def.hp;
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
    if (en.def.surprise) openSurprise(w, en, en.def.surprise, keep);
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

/**
 * A surprise envelope breaks: one of its surprises (by weight) comes out. Spawned enemies pop out
 * sideways from where it was (into `keep`, the enemies that stay), each on clear floor; extra
 * coupons burst out all round.
 */
function openSurprise(w: World, en: Enemy, table: readonly SurpriseDef[], keep: Enemy[]): void {
  let r = w.rng.range(0, table.reduce((t, s) => t + s.weight, 0));
  const pick = table.find((s) => (r -= s.weight) < 0) ?? table[table.length - 1]!;
  const spawned: number[] = [];
  if (pick.spawn) {
    const def = ENEMIES[pick.spawn.id];
    if (!def) throw new Error(`Unknown enemy ${pick.spawn.id}`);
    for (let i = 0; i < pick.spawn.count; i++) {
      const a = en.lastHit + Math.PI / 2 + (i / pick.spawn.count) * Math.PI * 2 + w.rng.range(-0.4, 0.4);
      const at = freeSpot(w, en.x + Math.cos(a) * 6, en.y + Math.sin(a) * 4, def.footRadius);
      const kid = spawnEnemy(w.nextId++, def, at.x, at.y);
      // Out it pops, sliding a little, and only then goes for you.
      kid.vx = Math.cos(a) * 160;
      kid.vy = Math.sin(a) * 100;
      if (def.brain.kind === 'chaser') {
        kid.state = 'brake';
        kid.until = 0.45;
      }
      keep.push(kid);
      spawned.push(kid.id);
    }
  }
  const n = pick.coupons ?? 0;
  for (let i = 0; i < n; i++) {
    const a = ((i + w.rng.range(0.2, 0.8)) / n) * Math.PI * 2;
    const sp = w.rng.range(70, 120);
    const at = freeSpot(w, en.x, en.y, PICKUP_RADIUS);
    w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: at.x, y: at.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
  }
  w.events.push({ type: 'surprise', x: en.x, y: en.y, line: pick.line, spawned, coupons: n });
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
      // For sale: it stays on its shelf until it is bought with the interact button (buy()).
      keep.push(k);
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
    if (k.kind === 'documento') {
      // A story document: walked over, it is filed (rolling over it too: it is only paper).
      if (k.age >= PICKUP_DELAY && d < WEAPON_GRAB && k.doc) {
        if (!w.docs.includes(k.doc)) w.docs.push(k.doc);
        w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: 1, total: w.docs.length, item: k.doc });
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
    const wanted = wantsPickup(w, k);
    if (wanted && k.age >= PICKUP_DELAY && d < PICKUP_GRAB) {
      if (k.kind === 'corazon') p.hp = Math.min(p.def.maxHp, p.hp + k.value);
      else if (k.kind === 'garantia') p.shield = Math.min(SHIELD_MAX, p.shield + k.value);
      else if (k.kind === 'sobretension') p.surge = Math.min(SURGE_VALUE, p.surge + k.value);
      else if (k.kind === 'turbo') {
        p.hp = Math.min(p.def.maxHp, p.hp + k.value);
        p.turbo = true;
      }
      else if (k.kind === 'ticket') p.tickets += k.value;
      else p.coupons += k.value;
      const total = k.kind === 'corazon' || k.kind === 'turbo' ? p.hp : k.kind === 'garantia' ? p.shield : k.kind === 'sobretension' ? p.surge : k.kind === 'ticket' ? p.tickets : p.coupons;
      w.events.push({ type: 'pickup', x: k.x, y: k.y, kind: k.kind, value: k.value, total });
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

/**
 * The nearest point to (x, y) where a feet box of radius `r` touches no wall or prop (rings of
 * 4 px). If there is none close enough, `fallback` (by default, (x, y) itself).
 */
export function freeSpot(w: World, x: number, y: number, r: number, fallback?: { x: number; y: number }): { x: number; y: number } {
  const clear = (px: number, py: number): boolean => !solidsNear(w, playerFeetBox({ x: px, y: py }, r)).some((s) => overlaps(playerFeetBox({ x: px, y: py }, r), s));
  if (clear(x, y)) return { x, y };
  // Rings of 4 px, farther and farther (a room's middle can be a block of shelving 6 tiles wide).
  for (let d = 4; d <= 240; d += 4) {
    const n = d <= 48 ? 16 : 32;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      if (clear(px, py)) return { x: px, y: py };
    }
  }
  return fallback ?? { x, y };
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
    feedPet(w);
  }
}

/** A combat room's shutters roll up once its last enemy falls. */
function updateDoors(w: World): void {
  if (w.doorsShut && fights(w.room) && w.enemies.length === 0) {
    w.doorsShut = false;
    w.events.push({ type: 'doors', shut: false });
    chargeActive(w);
    feedPet(w);
    // The turbo lasts until the next combat room is cleared (this one, if it was already on).
    if (w.player.turbo) {
      w.player.turbo = false;
      w.events.push({ type: 'turboEnd' });
    }
    if (w.floor) {
      const st = w.floor.rooms[w.floor.current]!;
      st.cleared = true;
      if (st.reward === 'ticket') dropTicket(w, ...roomMiddle(w));
      else if (st.reward === 'chest') placeChest(w, ...roomMiddle(w));
      else if (st.reward === 'heart') dropHeart(w, ...roomMiddle(w));
      else if (st.reward === 'shield') dropHeart(w, ...roomMiddle(w), 'garantia');
      else if (st.reward === 'turbo') dropHeart(w, ...roomMiddle(w), 'turbo');
      else if (st.reward === 'surge') dropHeart(w, ...roomMiddle(w), 'sobretension');
    }
    setDoorTiles(w, true);
  }
}

/** The middle of the room's floor (below the back wall), where rewards turn up. */
function roomMiddle(w: World): [number, number] {
  const r = w.room;
  return [r.w / 2, (r.h + BACK_WALL_ROWS * TILE) / 2];
}

/** The hearts a cleared room can leave: the spare one, the warranty and the special ones. */
export type HeartKind = 'corazon' | 'garantia' | 'turbo' | 'sobretension';
const HEART_DROPS: Record<HeartKind, { value: number; reward: RoomReward }> = {
  corazon: { value: 2, reward: 'heart' },
  garantia: { value: SHIELD_VALUE, reward: 'shield' },
  turbo: { value: TURBO_HEAL, reward: 'turbo' },
  sobretension: { value: SURGE_VALUE, reward: 'surge' },
};

/** A spare heart (or a Garantía Provisional, or a special heart) pops out at (x, y) (or the nearest free floor): a cleared room's reward. */
export function dropHeart(w: World, x: number, y: number, kind: HeartKind = 'corazon'): void {
  const at = freeSpot(w, x, y, PICKUP_RADIUS);
  const a = w.rng.range(0, Math.PI * 2);
  const h = HEART_DROPS[kind];
  w.pickups.push({ id: w.nextId++, kind, value: h.value, x: at.x, y: at.y, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40, age: 0 });
  w.events.push({ type: 'reward', reward: h.reward, x: at.x, y: at.y });
}

/** Whether walking over `k` picks it up now (a heart is left alone when it would do nothing). */
export function wantsPickup(w: World, k: Pickup): boolean {
  const p = w.player;
  if (k.kind === 'corazon') return p.hp < p.def.maxHp;
  if (k.kind === 'garantia') return p.shield < SHIELD_MAX;
  if (k.kind === 'sobretension') return p.surge < SURGE_VALUE;
  if (k.kind === 'turbo') return p.hp < p.def.maxHp || !p.turbo;
  return true;
}

/**
 * The Corazón de Sobretensión broke: every enemy in the room (a boss between phases aside) takes
 * SURGE_DAMAGE at once. They come apart as if shot (reapEnemies).
 */
function surgeShock(w: World): void {
  const targets: { id: number; x: number; y: number }[] = [];
  for (const en of w.enemies) {
    if (isDead(en) || en.state === 'gone' || en.state === 'dying' || en.state === 'roar') continue;
    en.damageTaken = Math.min(en.def.hp, en.damageTaken + SURGE_DAMAGE * takenScale(en));
    en.hitT = 0.12;
    const hb = dummyHurtBox(en);
    targets.push({ id: en.id, x: hb.x + hb.w / 2, y: hb.y + hb.h / 2 });
  }
  w.events.push({ type: 'surge', x: w.player.x, y: w.player.y - PLAYER_HURT_Y, targets });
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
export function placeChest(w: World, x: number, y: number, drop = true, tier: ChestTier = w.rng.chance(PREMIUM_CHANCE) ? 'premium' : 'carton'): PropInstance {
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
  const prop: PropInstance = { def, x: at.x, y: at.y, box: { x: at.x + def.box.x, y: at.y + def.box.y, w: def.box.w, h: def.box.h }, chest: { id: w.nextId++, open: false, tier } };
  w.room.props.push(prop);
  if (drop) w.events.push({ type: 'reward', reward: 'chest', x: at.x, y: at.y, tier });
  return prop;
}

/** How close (px) the toaster must be to a shelf of the shop to buy from it. */
export const SHOP_REACH = 16;

/** What the interact button would do right now, if anything (the closest thing in reach). */
export type Interactable =
  | { kind: 'chest'; prop: PropInstance }
  | { kind: 'tip'; prop: PropInstance }
  | { kind: 'shop'; pickup: Pickup }
  | { kind: 'station'; station: Station };

export function interactable(w: World): Interactable | null {
  const p = w.player;
  if (w.over || w.won || w.leftHub || isRolling(p)) return null;
  const feet = playerFeetBox(p, p.def.footRadius);
  for (const pr of w.room.props) {
    const c = pr.chest;
    if (!c || c.open) continue;
    const reach = { x: pr.box.x - CHEST_REACH, y: pr.box.y - CHEST_REACH, w: pr.box.w + CHEST_REACH * 2, h: pr.box.h + CHEST_REACH * 2 };
    if (overlaps(reach, feet)) return { kind: 'chest', prop: pr };
  }
  let table: PropInstance | null = null;
  let tableD = Infinity;
  for (const pr of w.room.props) {
    if (!pr.def.tip || pr.tipped) continue;
    const reach = { x: pr.box.x - TIP_REACH, y: pr.box.y - TIP_REACH, w: pr.box.w + TIP_REACH * 2, h: pr.box.h + TIP_REACH * 2 };
    const d = Math.hypot(pr.x - p.x, pr.y - p.y);
    if (overlaps(reach, feet) && d < tableD) {
      table = pr;
      tableD = d;
    }
  }
  let best: Pickup | null = null;
  let bestD = SHOP_REACH;
  for (const k of w.pickups) {
    if (k.price === undefined || k.age < PICKUP_DELAY) continue;
    const d = Math.hypot(p.x - k.x, p.y - 2 - k.y);
    if (d < bestD) {
      best = k;
      bestD = d;
    }
  }
  if (best) return { kind: 'shop', pickup: best };
  if (table) return { kind: 'tip', prop: table };
  const st = w.room.kind === 'hub' ? nearStation(w) : null;
  return st ? { kind: 'station', station: st } : null;
}

/** The interact button was pressed: it does what interactable() says. */
function interact(w: World): void {
  const it = interactable(w);
  if (!it) return;
  if (it.kind === 'chest') openChest(w, it.prop);
  else if (it.kind === 'tip') tipTable(w, it.prop);
  else if (it.kind === 'shop') buy(w, it.pickup);
  else w.events.push({ type: 'interact', station: it.station.kind });
}

/** Buys `k` off its shelf, if it can be paid (and is not a heart with all the life there). */
function buy(w: World, k: Pickup): void {
  const p = w.player;
  if (k.price === undefined) return;
  const good = k.kind;
  const item = k.item ?? k.weapon;
  const refuse = good === 'corazon' && p.hp >= p.def.maxHp ? 'full' : p.coupons < k.price ? 'poor' : null;
  if (refuse) {
    w.events.push({ type: 'shop', x: k.x, y: k.y, outcome: refuse, good, price: k.price, left: p.coupons, item });
    return;
  }
  p.coupons -= k.price;
  w.events.push({ type: 'shop', x: k.x, y: k.y, outcome: 'bought', good, price: k.price, left: p.coupons, item });
  delete k.price;
  w.pickups = w.pickups.filter((o) => o !== k);
  grab(w, k);
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
 * A ring of `n` of the toaster's own bullets (its weapon's damage, a short reach) from where it
 * stands (Perks.hurtRing).
 */
function hurtRing(w: World, n: number): void {
  const p = w.player;
  const def = p.weapon.def;
  const y = p.y - HAND_HEIGHT;
  const off = w.rng.range(0, Math.PI * 2);
  w.pendingBullets ??= [];
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    w.pendingBullets.push({
      id: w.nextId++, owner: 'player', x: p.x, y, vx: Math.cos(a) * HURT_RING_SPEED, vy: Math.sin(a) * HURT_RING_SPEED,
      r: def.bulletRadius, life: HURT_RING_LIFE, damage: def.damage, knockback: def.knockback, color: 'red', age: 0, dir: a,
      speed: HURT_RING_SPEED, h: HAND_HEIGHT, weapon: def.id,
    });
  }
  w.events.push({ type: 'hurtRing', x: p.x, y, count: n });
}

/** Speed (px/s) and life (s) of the Mando con Vibración's ring. */
const HURT_RING_SPEED = 230;
const HURT_RING_LIFE = 0.75;

/** Chests that can still be opened without a ticket on this floor (Llave Allen Sobrante). */
export function freeChestLeft(w: World): number {
  return Math.max(0, playerPerks(w.player).freeChests - ((w.floor ?? w).freeChests ?? 0));
}

/**
 * The interact button at a shut chest: with a ticket it opens (the ticket is spent, the next
 * passive item, else the next active item, else the next weapon comes out in front of it with a
 * few coupons). Without a ticket it only complains.
 */
function openChest(w: World, pr: PropInstance): void {
  const p = w.player;
  const c = pr.chest;
  if (!c || c.open) return;
  // The spare Allen key goes first (it is only good on this floor); then a ticket.
  const allen = freeChestLeft(w) > 0;
  if (!allen && p.tickets <= 0) {
    w.events.push({ type: 'chest', x: pr.x, y: pr.y, opened: false, tickets: 0 });
    return;
  }
  const keyring = w.floor ?? w;
  if (allen) keyring.freeChests = (keyring.freeChests ?? 0) + 1;
  else p.tickets--;
  c.open = true;
  const decks = decksOf(w);
  // Out in front (below) of the chest, or wherever there is room.
  const spot = freeSpot(w, pr.x, pr.y + 32, 8);
  const base = { x: spot.x, y: spot.y, vx: 0, vy: 0, age: 0, value: 1 };
  // Now that items only come out of chests (and the shop), a chest can hold any of the three:
  // mostly a passive item, sometimes a weapon or an active one. The cardboard one gives only
  // ordinary things; the premium one only things of quality «buena» (the first of each deck that
  // fits; if no deck has one, whatever is next).
  const good = c.tier === 'premium';
  const fits = (q: 'buena' | undefined): boolean => (q === 'buena') === good;
  const roll = w.rng.next();
  const order: Array<'objeto' | 'activo' | 'arma'> = good
    ? roll < 0.35 ? ['arma', 'objeto'] : ['objeto', 'arma']
    : roll < CHEST_WEAPON ? ['arma', 'objeto', 'activo'] : roll < CHEST_WEAPON + CHEST_ACTIVE ? ['activo', 'objeto', 'arma'] : ['objeto', 'activo', 'arma'];
  const take = (deck: string[], quality: (id: string) => 'buena' | undefined, strict: boolean): string | undefined => {
    const at = deck.findIndex((id) => !strict || fits(quality(id)));
    return at < 0 ? undefined : deck.splice(at, 1)[0];
  };
  let item: string | undefined;
  for (const strict of [true, false]) {
    for (const kind of order) {
      if (kind === 'objeto') item = take(decks.items, (id) => ITEMS[id]?.quality, strict);
      else if (kind === 'activo') item = take(decks.actives, (id) => ACTIVE_ITEMS[id]?.quality, strict);
      else item = take(decks.weapons, (id) => WEAPONS[id]?.quality, strict);
      if (!item) continue;
      if (kind === 'objeto') w.pickups.push({ id: w.nextId++, kind: 'objeto', item, ...base });
      else if (kind === 'activo') w.pickups.push({ id: w.nextId++, kind: 'activo', item, charge: ACTIVE_ITEMS[item]!.charges, ...base });
      else w.pickups.push({ id: w.nextId++, kind: 'arma', weapon: item, ...base });
      break;
    }
    if (item) break;
  }
  const out = freeSpot(w, pr.x, pr.y + 6, PICKUP_RADIUS);
  for (let i = 0; i < CHEST_COUPONS + (item ? 0 : 3); i++) {
    const a = Math.PI / 2 + w.rng.range(-1.2, 1.2);
    const sp = w.rng.range(50, 100);
    w.pickups.push({ id: w.nextId++, kind: 'cupon', value: 1, x: out.x, y: out.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0 });
  }
  w.events.push({ type: 'chest', x: pr.x, y: pr.y, opened: true, tickets: p.tickets, item, tier: c.tier, ...(allen ? { allen: true } : {}) });
}

export function step(w: World, input: Input): void {
  w.events = [];
  // Gone down the lift (or onto the hub's conveyor): nothing moves any more.
  if (w.won || w.leftHub) {
    w.tick++;
    return;
  }
  if (w.intro) {
    stepIntro(w, w.intro, input);
    w.tick++;
    return;
  }
  // The Mostrador is the one place in the building where nobody shoots.
  if (w.room.kind === 'hub') input = { ...input, fire: false, reload: false, useItem: false, debugPattern: undefined };
  // Once down, the toaster lies there: the room goes on without it.
  updatePlayer(w, w.over ? { ...NO_INPUT, aimX: w.player.x + Math.cos(w.player.aim), aimY: w.player.y - HAND_HEIGHT + Math.sin(w.player.aim) } : input);
  if (input.useItem && !w.over) useActive(w);
  // On hold (Música de Espera) enemies, their bullets and their attacks stand still. A boss does
  // not: it (and everything in its room) goes in slow motion, its bullets at HOLD_BOSS_SCALE of
  // their speed and its own thinking every other tick.
  const onHold = w.holdT > 0;
  const slowed = onHold && w.enemies.some((e) => e.def.brain.kind === 'boss' && e.state !== 'dying');
  const held = onHold && !slowed;
  const paused = held || (slowed && w.tick % 2 === 1);
  if (onHold) {
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
  if (!paused) updateEmitters(w);
  if (isRolling(w.player) && !w.over) rollCut(w);
  updateBullets(w, held, slowed ? HOLD_BOSS_SCALE : 1);
  if (w.pendingBullets?.length) {
    w.bullets.push(...w.pendingBullets);
    w.pendingBullets = [];
  }
  updateProps(w);
  if (!paused) updateFrost(w);
  reapEnemies(w);
  updateDummies(w);
  if (!paused) updateEnemies(w);
  // Enemies that fell during their own update (a boss's relays when it reboots or goes down).
  reapEnemies(w);
  if (input.interact && !w.over) interact(w);
  updatePickups(w);
  updateRestock(w);
  updateDoors(w);
  updateLift(w);
  updateBelt(w);
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
  if (!Number.isInteger(p.shield) || p.shield < 0 || p.shield > SHIELD_MAX) errs.push(`player shield out of range: ${p.shield}`);
  if (!Number.isInteger(p.surge) || p.surge < 0 || p.surge > SURGE_VALUE) errs.push(`player surge out of range: ${p.surge}`);
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
  const parts = [w.floor?.current ?? -1, w.tick, p.x.toFixed(3), p.y.toFixed(3), p.aim.toFixed(4), p.weapon.ammo, w.bullets.length, w.nextId, w.kills];
  parts.push(p.coupons, p.tickets, w.pickups.length, p.hp, p.shield, p.surge, p.turbo ? 1 : 0, w.room.props.length, p.pet ?? 0);
  for (const pr of w.room.props) if (pr.damage || pr.tipped) parts.push(pr.damage ?? 0, pr.fuse ?? -1, pr.tipped ?? '-');
  for (const d of w.dummies) parts.push(d.damageTaken);
  for (const en of w.enemies) parts.push(en.x.toFixed(2), en.y.toFixed(2), en.state, en.damageTaken);
  for (const f of w.frost) parts.push(f.x.toFixed(2), f.y.toFixed(2), f.t.toFixed(3));
  if (w.lift) parts.push(w.lift.x.toFixed(2), w.lift.y.toFixed(2), w.won ? 'won' : 'lift');
  return parts.join('|');
}
