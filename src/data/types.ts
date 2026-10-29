// Typed content definitions. Adding content means adding data here, not touching the engine.

export interface WeaponDef {
  id: string;
  name: string;
  description: string;
  /** Shots per second while the trigger is held. */
  fireRate: number;
  magazine: number;
  /** Seconds. */
  reloadTime: number;
  /** Half-angle of the random spread, in degrees. */
  spreadDeg: number;
  bulletSpeed: number;
  /** Seconds a bullet lives before fading out. */
  bulletLife: number;
  damage: number;
  bulletRadius: number;
  /** Speed the shooter loses backwards per shot (px/s). */
  recoil: number;
  /** Speed given to what is hit (px/s). */
  knockback: number;
  /** Bullets per trigger pull. */
  pellets: number;
  /** What its bullets do besides flying straight (from items; see src/sim/mods.ts). */
  bullets?: BulletBehaviour;
  /** How it looks and sounds (render only): held sprite, bullet sprite, shot sound. */
  look: WeaponLook;
}

export interface WeaponLook {
  /** Texture of the weapon in the hand (about 18 x 11, barrel to the right); also lies on the floor. */
  sprite: string;
  /** Texture of its bullets, drawn for its base bulletRadius. */
  bullet: string;
  /** The bullet sprite turns to face where it flies (staples). */
  turn?: boolean;
  /** Sound of a shot (src/audio/synth.ts). */
  sound: string;
  /** Screen shake per shot (fraction of the view). */
  shake: number;
}

/**
 * What the player's bullets do besides flying straight (items give these; see src/sim/mods.ts).
 * Counts add up between items; homing takes the strongest.
 */
export interface BulletBehaviour {
  /** Enemies it goes through before stopping (each one is hit once). */
  pierce?: number;
  /** Times it bounces off walls and props before stopping. */
  bounce?: number;
  /** Turns towards the nearest enemy within `range` px, `turnDeg` per second, for `time` s. */
  homing?: { turnDeg: number; time: number; range: number };
}

/** A number a modifier can change: the weapon's and the character's. */
export type StatKey =
  | 'damage'
  | 'fireRate'
  | 'magazine'
  | 'reloadTime'
  | 'spreadDeg'
  | 'bulletSpeed'
  | 'bulletLife'
  | 'bulletRadius'
  | 'knockback'
  | 'recoil'
  | 'pellets'
  | 'speed'
  | 'maxHp'
  | 'rollCooldown';

/** One change to a stat: `add` first (all modifiers summed), then `mul` (all multiplied). */
export interface StatChange {
  stat: StatKey;
  add?: number;
  mul?: number;
}

/**
 * Everything one source (an item, a synergy, a curse) does to the player: stat changes and
 * bullet behaviours. Several stack; taking one away undoes exactly what it did.
 */
export interface Modifier {
  id: string;
  stats?: StatChange[];
  bullets?: BulletBehaviour;
}

/**
 * A passive item: lying on a pedestal until the toaster walks onto it, then carried for the
 * rest of the run. All it does is its modifier (src/sim/mods.ts).
 */
export interface PassiveItemDef {
  id: string;
  /** 2 to 4 words (docs/DISENO.md). */
  name: string;
  /** One sentence, two at most, in the game's tone. */
  description: string;
  /** Texture key of its 16 x 16 sprite (tools/sprites/items.ts). */
  sprite: string;
  /** What it does to the player; its id is the item's. */
  mod: Modifier;
}

/** What using an active item does (src/sim/world.ts useActive). */
export type ActiveEffect =
  /** Every enemy bullet (and whatever is in the air) vanishes. */
  | { type: 'clearFire' }
  /** Enemies, their bullets and their attacks stand still for `seconds` (they still take damage). */
  | { type: 'hold'; seconds: number }
  /** Gives back `amount` life (not usable at full life). */
  | { type: 'heal'; amount: number };

/**
 * An active item: the toaster carries one at a time and uses it with Q once it has `charges`
 * batteries (one per combat room cleared). Picking up another one leaves the old one on the floor.
 */
export interface ActiveItemDef {
  id: string;
  name: string;
  description: string;
  sprite: string;
  /** Batteries it needs to be used (and the most it holds). */
  charges: number;
  effect: ActiveEffect;
}

export interface CharacterDef {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  /** px/s */
  speed: number;
  /** px/s² while there is input. */
  accel: number;
  /** px/s² when the stick is released. */
  friction: number;
  rollSpeed: number;
  rollTime: number;
  /** Invulnerable for this long since the roll starts (s). */
  rollIframes: number;
  rollCooldown: number;
  startWeapon: string;
  /** Half size of the feet collision box (px). */
  footRadius: number;
}

export interface PropDef {
  id: string;
  name: string;
  /** Collision box relative to the prop position (bottom-centre of the sprite). */
  box: { x: number; y: number; w: number; h: number };
  blocksBullets: boolean;
}

export interface DummyDef {
  id: string;
  name: string;
  description: string;
  /** Hit box relative to the feet position. */
  hurt: { x: number; y: number; w: number; h: number };
  /** Collision box for movement (feet). */
  box: { x: number; y: number; w: number; h: number };
}

/** What a room is for on a floor (src/sim/floor.ts); `test` is the Sala de Pruebas. */
export type RoomKind = 'start' | 'combat' | 'treasure' | 'shop' | 'secret' | 'boss';

/**
 * Room templates are drawn as text. Legend:
 * `#` wall, `.` floor, `P` player start, `c` box, `b` barrel, `k` shopping cart, `M` training dummy,
 * `A` Aspirador Desahuciado, `O` Microondas Sin Seguro, `L` Bombilla de Bajo Consumo (con su polilla), `T` Batidora de Mano,
 * `Z` Mandos a Distancia (vienen en grupo: see EnemyDef.pack).
 * Slots, filled when a floor is built (src/sim/room.ts, fillTemplate): `e` an enemy (or nothing),
 * `o` an obstacle (or nothing), `*` an item pedestal, `$` the shopkeeper, `s` a shop shelf,
 * `J` the boss.
 * The top two rows are the back wall (shelves are painted on them).
 * Floor templates keep the four door openings (centre of each wall) and the two tiles in front
 * of them clear, so any template fits any set of doors.
 */
export interface RoomTemplate {
  id: string;
  name: string;
  rows: readonly string[];
  /** What the room is for on a floor; templates without one (the test room) never appear on a floor. */
  kind?: RoomKind;
  /** Seconds after the last enemy dies before the room's enemies come back (test room only). */
  restock?: number;
}

/** One enemy that can fill an `e` slot: its template letter, how much of the room's budget it takes and how often it comes up. */
export interface SlotEnemy {
  ch: string;
  cost: number;
  weight: number;
  /** At most this many per room. */
  max?: number;
}

/** What an enemy leaves behind when it is taken apart. */
export interface LootDef {
  /** How many coupons it drops (random in this range, both included). */
  coupons: [number, number];
  /** Spare hearts it drops (each gives back a heart: 2 life). A boss's reward. */
  hearts?: number;
}

/**
 * Charges in a straight line: walks towards the player, warns (`telegraph` s, direction locked),
 * dashes at `chargeSpeed` for up to `chargeTime` s, then brakes for `recover` s. Hitting a wall
 * or a prop mid-charge stuns it for `stun` s.
 */
export interface ChargerBrain {
  kind: 'charger';
  walkSpeed: number;
  /** Only charges when the player is closer than this (px). */
  range: number;
  /** Seconds walking between charges (random in this range). */
  walkTime: [number, number];
  telegraph: number;
  chargeSpeed: number;
  chargeTime: number;
  /** Deceleration while braking (px/s²). */
  brake: number;
  recover: number;
  stun: number;
}

/**
 * Stands still and fires a pattern: every `interval` s (random in the range), if the player is
 * closer than `range`, it warns for `telegraph` s and then fires `pattern` (src/data/patterns.ts)
 * from `muzzleY` px above its feet.
 */
export interface TurretBrain {
  kind: 'turret';
  range: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  muzzleY: number;
  /** Seconds «switching on» when it appears, before its first attack (it flickers meanwhile). */
  startup?: number;
  /** If present, it walks between attacks to stay about `keep` px from the player. */
  walk?: { speed: number; keep: number };
}

/**
 * Flies around its owner (the enemy that brought it, see EnemyDef.escort) and now and then darts at
 * the player: `telegraph` s of fluttering on the spot, then `dartTime` s straight at where the player
 * was. Flies over props; only the room walls stop it. With no owner left it circles the player.
 */
export interface MothBrain {
  kind: 'moth';
  orbitRadius: number;
  /** Radians per second around the owner. */
  orbitSpeed: number;
  /** How fast it catches up with its place in the orbit (px/s). */
  flySpeed: number;
  /** Only darts when the player is closer than this to it (px). */
  range: number;
  /** Seconds between darts (random in this range). */
  interval: [number, number];
  telegraph: number;
  dartSpeed: number;
  dartTime: number;
  /** Height it flies at, for drawing (px above its shadow). */
  altitude: number;
}

/**
 * Chases the player on foot and, when close, lunges: `telegraph` s winding up on the spot (the
 * direction is locked when it starts), then `lungeTime` s at `lungeSpeed` straight at where the
 * player was, then `recover` s braking. Waits `cooldown` s (random in the range) between lunges.
 * Below `turbo.below` of its life it goes into TURBO: everything `turbo.scale` times faster.
 */
export interface ChaserBrain {
  kind: 'chaser';
  walkSpeed: number;
  /** Lunges when the player is closer than this (px). */
  range: number;
  cooldown: [number, number];
  telegraph: number;
  lungeSpeed: number;
  lungeTime: number;
  recover: number;
  /** Deceleration while braking (px/s²). */
  brake: number;
  turbo?: { below: number; scale: number };
}

/**
 * Never where you look for it: sidles around the player at `keep` px and, every `interval` s, warns
 * for `telegraph` s and fires `pattern`. After firing (and when hit, at most once every
 * `hitBlinkCooldown` s) it «switches off» like an old TV for `vanish` s and is gone for `gone` s
 * (the landing spot crackles with static meanwhile), then «switches on» `hop` px from the player,
 * preferably away from where the player is aiming. While gone it cannot hit or be hit.
 */
export interface BlinkerBrain {
  kind: 'blinker';
  walkSpeed: number;
  keep: number;
  range: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  muzzleY: number;
  vanish: number;
  gone: number;
  /** Distance from the player of the landing spot (random in this range). */
  hop: [number, number];
  hitBlinkCooldown: number;
}

/** One attack of a boss: a bullet pattern from its muzzle. */
export interface BossPatternAttack {
  kind: 'pattern';
  /** Name in src/data/patterns.ts. */
  pattern: string;
  telegraph: number;
  /** How often it is picked, relative to the phase's other attacks. */
  weight: number;
}

/**
 * Lobs `count` balls of frost: one at the player and the rest `spread` px around it. Each flies
 * `flight` s (its landing spot is marked on the floor meanwhile), lands as a patch of frost of
 * radius `radius` that lasts `life` s and makes the player walk at `slow` of its speed, and
 * shatters into `shatter` (a pattern) if given.
 */
export interface BossFrostAttack {
  kind: 'frost';
  count: number;
  spread: number;
  flight: number;
  radius: number;
  life: number;
  slow: number;
  shatter?: string;
  telegraph: number;
  weight: number;
}

/**
 * Opens up and spits `count` expired products from `from` (px from its feet, facing right): they
 * fly `flight` s (give or take 25 %) to random spots up to `spread` px around the player (the
 * spots are marked meanwhile) and burst into `burst` (a pattern) where they land.
 */
export interface BossSpitAttack {
  kind: 'spit';
  count: number;
  spread: number;
  flight: number;
  from: { x: number; y: number };
  burst: string;
  telegraph: number;
  weight: number;
}

export type BossAttack = BossPatternAttack | BossFrostAttack | BossSpitAttack;

/** A stage of a boss fight, with its own attacks. */
export interface BossPhase {
  /** Name shown when it starts (in the game's tone). */
  name: string;
  /** It starts when the boss has this fraction of its life left or less (1 for the first). */
  from: number;
  /** Between attacks, farther than `keep` px from the player, it shuffles closer. */
  walkSpeed: number;
  keep: number;
  /** Seconds of rest between attacks (random in this range). */
  rest: [number, number];
  attacks: BossAttack[];
}

/**
 * A floor boss: between attacks it shuffles closer if the player keeps away; then it picks one of its current
 * phase's attacks (weighted, never the same twice in a row), warns and fires it from `muzzle`
 * (px from its feet, facing right).
 */
export interface BossBrain {
  kind: 'boss';
  muzzle: { x: number; y: number };
  phases: BossPhase[];
}

export type EnemyBrain = ChargerBrain | TurretBrain | MothBrain | ChaserBrain | BlinkerBrain | BossBrain;

export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  hp: number;
  /** Texture key, and the point of the sprite that sits on the feet (px from its top-left). */
  sprite: string;
  anchor: { x: number; y: number };
  /** Hit box relative to the feet position. */
  hurt: { x: number; y: number; w: number; h: number };
  /** Half size of the feet collision box (px). */
  footRadius: number;
  /** Speed given to the player when it bumps into them (px/s). */
  contactPush: number;
  /** Life it takes from the player when it bumps into them (1 = half a heart). */
  contactDamage: number;
  /** How much a bullet's knockback moves it (0 = immovable). */
  knockbackScale: number;
  brain: EnemyBrain;
  loot: LootDef;
  /** Enemy id that always comes with this one (spawned next to it, owned by it). */
  escort?: string;
  /** How many of it one spawn point brings (they come in groups). Default 1. */
  pack?: number;
  /** Bosses: the name card and motto of their entrance (shown big, in «Letra Pequeña»). */
  boss?: { title: string; motto: string };
}
