// Which frame of its sprite sheet an enemy shows (pure: tests use it without Phaser).
import type { Enemy, EnemyState } from '../sim/world.ts';

/** States in which it stands planted: no breathing, no steps (stunned, braking, dying...). */
const PLANTED: ReadonlySet<EnemyState> = new Set<EnemyState>(['brake', 'stun', 'dying', 'roar', 'blink', 'gone']);

/** Below this speed (px/s) it is standing, even if a bullet nudged it a little. */
export const WALK_MIN_SPEED = 6;
/** Stride frames never change faster than this (a charge would otherwise flicker). */
export const MAX_STEP_FPS = 14;

/**
 * Whether the bulb is lit: always, except while it switches on, when it flickers more and more
 * often (deterministic noise per 70 ms slot, only for drawing).
 */
export function bulbLit(en: Enemy, now: number): boolean {
  if (en.state !== 'off') return true;
  const k = en.t / en.until;
  const slot = Math.floor(now / 70);
  const n = ((slot * 2654435761 + en.id * 97) >>> 0) % 100;
  return k > 0.35 && n < k * k * 90;
}

/** Winding up or flat out: the mixer's beaters and the moth's wings go faster. */
function busy(en: Enemy): boolean {
  return en.state === 'warn' || en.state === 'charge' || en.turbo === true;
}

/**
 * The sheet frame for `en` at time `now` (ms), from its `anim` data: the off frame while a bulb
 * flickers on; a stride frame per `stepPx` px moved while it walks (so the feet do not slide), at
 * most MAX_STEP_FPS; otherwise its idle cycle in time, each enemy out of step with the rest. The
 * boss's second phase uses the same layout `phaseShift` frames on.
 */
export function enemyFrame(en: Enemy, now: number): number {
  const a = en.def.anim;
  if (!a) return 0;
  const shift = a.phaseShift !== undefined && (en.bossPhase ?? 0) >= 1 ? a.phaseShift : 0;
  if (a.off !== undefined && !bulbLit(en, now)) return a.off;
  // Frozen while it warns (the wireless mouse without signal).
  if (a.warn !== undefined && en.state === 'warn') return a.warn;
  // A mimic lying in wait, and jumping up when found out.
  if (a.lurk !== undefined && en.state === 'lurk') return a.lurk;
  if (a.reveal !== undefined && en.state === 'reveal') return a.reveal;
  // Jammed: it shakes on the spot.
  if (a.jam && en.state === 'jam') return a.jam[Math.floor(now / (a.jamMs ?? 60)) % a.jam.length]! + shift;
  if (PLANTED.has(en.state)) return a.idle[0]! + shift;
  const speed = Math.hypot(en.vx, en.vy);
  if (a.walk && a.stepPx && en.state !== 'warn' && speed >= WALK_MIN_SPEED) {
    const fps = speed / a.stepPx;
    const k = fps > MAX_STEP_FPS ? Math.floor((now / 1000) * MAX_STEP_FPS) : Math.floor(en.moved / a.stepPx);
    return a.walk[k % a.walk.length]! + shift;
  }
  const ms = busy(en) && a.busyMs ? a.busyMs : a.idleMs;
  return a.idle[Math.floor(now / ms + en.id * 0.5) % a.idle.length]! + shift;
}
