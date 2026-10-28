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
 * `A` Aspirador Desahuciado.
 * The top two rows are the back wall (shelves are painted on them).
 */
export interface RoomTemplate {
  id: string;
  name: string;
  rows: readonly string[];
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

export type EnemyBrain = ChargerBrain;

export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  hp: number;
  /** Texture key. */
  sprite: string;
  /** Hit box relative to the feet position. */
  hurt: { x: number; y: number; w: number; h: number };
  /** Half size of the feet collision box (px). */
  footRadius: number;
  /** Speed given to the player when it bumps into them (px/s). */
  contactPush: number;
  /** How much a bullet's knockback moves it (0 = immovable). */
  knockbackScale: number;
  brain: EnemyBrain;
}
