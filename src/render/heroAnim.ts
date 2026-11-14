// Which frame of its sheet the playable character shows (pure: tests use it without Phaser).
// M14c (a4b): the characters redrawn with more frames (CharacterLook.anim) walk in six steps, roll
// tucked up, kick back when they shoot, are knocked by a hit and shudder before they break; the
// rest keep the eight frames of always.
import type { CharacterLook } from '../data/types.ts';

/** The common eight: idle ×2, walk ×4, hurt and broken. */
export const HERO_IDLE = [0, 1] as const;
export const HERO_WALK = [2, 3, 4, 5] as const;
export const HERO_ROLL = 3;
export const HERO_HURT = 6;
export const HERO_BROKEN = 7;

/** Pixels walked per full stride (both feet): the same for four or six frames. */
export const STRIDE_PX = 28;
/** How long the shooting pose lasts after a shot (s). */
export const SHOOT_POSE = 0.1;
/** The roll's spin ends at this share of it (GameScene turns the sprite until then); the landing frame after. */
export const ROLL_SPIN_END = 0.85;
/** Dying, each shudder frame lasts this (ms). */
export const DIE_FRAME_MS = 70;

export interface HeroState {
  /** Time (ms) for the idle breathing and the dying shudder. */
  now: number;
  moving: boolean;
  /** Distance walked (px). */
  walked: number;
  /** Rolling: the share of the roll gone (0–1); null when not rolling. */
  roll: number | null;
  /** Seconds since the last shot (Infinity: none). */
  sinceShot: number;
  /** The squash after a hit, 1 → 0 (0: none). */
  hurt: number;
  /** Shuddering before it breaks. */
  dying: boolean;
  /** Broken, on the floor. */
  broken: boolean;
}

function pick(list: readonly number[], k: number): number {
  return list[Math.min(list.length - 1, Math.max(0, Math.floor(k * list.length)))]!;
}

export function heroFrame(look: CharacterLook, s: HeroState): number {
  const a = look.anim;
  if (s.broken) return HERO_BROKEN;
  if (s.dying) return a?.die?.length ? a.die[Math.floor(s.now / DIE_FRAME_MS) % a.die.length]! : HERO_HURT;
  if (s.roll !== null) {
    if (!a) return HERO_ROLL;
    // The spin frames while it turns, the landing one after.
    const spin = a.roll.slice(0, -1);
    return s.roll >= ROLL_SPIN_END ? a.roll[a.roll.length - 1]! : pick(spin, s.roll / ROLL_SPIN_END);
  }
  if (s.hurt > 0) return a?.hurt?.length ? pick(a.hurt, 1 - s.hurt) : HERO_HURT;
  if (s.moving) {
    const walk = a?.walk ?? HERO_WALK;
    return walk[Math.floor(s.walked / (STRIDE_PX / walk.length)) % walk.length]!;
  }
  if (a?.shoot !== undefined && s.sinceShot < SHOOT_POSE) return a.shoot;
  return HERO_IDLE[Math.floor(s.now / 500) % 2]!;
}
