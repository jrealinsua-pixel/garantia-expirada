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

/**
 * Room templates are drawn as text. Legend:
 * `#` wall, `.` floor, `P` player start, `c` box, `b` barrel, `k` shopping cart, `M` training dummy,
 * `A` Aspirador Desahuciado, `O` Microondas Sin Seguro, `L` Bombilla de Bajo Consumo (con su polilla), `T` Batidora de Mano.
 * The top two rows are the back wall (shelves are painted on them).
 */
export interface RoomTemplate {
  id: string;
  name: string;
  rows: readonly string[];
  /** Seconds after the last enemy dies before the room's enemies come back (test room only). */
  restock?: number;
}

/** What an enemy leaves behind when it is taken apart. */
export interface LootDef {
  /** How many coupons it drops (random in this range, both included). */
  coupons: [number, number];
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

export type EnemyBrain = ChargerBrain | TurretBrain | MothBrain | ChaserBrain;

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
}
