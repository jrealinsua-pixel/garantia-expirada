// Which frame of its sprite sheet an enemy shows (pure: tests use it without Phaser).
import type { Enemy, EnemyState } from '../sim/world.ts';
import { isSpinning } from '../sim/enemies.ts';

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
 * boss's second phase uses the same layout `phaseShift` frames on (or a phase's own `frameShift`,
 * warning frame included); a boss spinning on the spot goes round its `spin` frames.
 */
export function enemyFrame(en: Enemy, now: number): number {
  // The other one of a pair (the queue post with the chipped base) has the same layout further on.
  const alt = en.alt ? en.def.anim?.altShift ?? 0 : 0;
  return sideFrame(en, now) + viewShift(en) + alt;
}

/**
 * Which way an enemy drawn from three sides (EnemyAnim.views) is seen: its side view while it
 * faces more across than up or down (mirrored by `facing`, like any other), its front facing down
 * the screen and its back facing up. The frame shift of that view.
 */
export function viewShift(en: Enemy): number {
  const v = en.def.anim?.views;
  if (!v || Math.abs(en.dirX) >= Math.abs(en.dirY)) return 0;
  return en.dirY > 0 ? v.front : v.back;
}

function sideFrame(en: Enemy, now: number): number {
  const a = en.def.anim;
  if (!a) return 0;
  // Chewing a bullet it swallowed: the blades show red for a moment.
  if (a.warn !== undefined && (en.chompT ?? 0) > 0) return a.warn;
  const own = phaseFrameShift(en);
  const shift = own ?? (a.phaseShift !== undefined && (en.bossPhase ?? 0) >= 1 ? a.phaseShift : 0);
  if (a.spin && isSpinning(en)) return a.spin[spinStep(en) % a.spin.length]!;
  if (a.off !== undefined && !bulbLit(en, now)) return a.off;
  // A boss clapping (the Director's «Reestructuración»), or striking its attack's pose while it
  // warns and throws (a card in his hand, his stamp up).
  // (Not once a phase has its own frames: the Director gets up in phase 3 and his clap is seated.)
  if (a.clap !== undefined && en.state === 'roar' && own === undefined) return a.clap;
  // A ticket dispenser whose turn was missed: furious, tongue out, spitting its fan.
  if (a.spit !== undefined && en.state === 'fire' && en.turn?.state === 'lost') return a.spit;
  const pose = attackPose(en);
  if (pose !== undefined) return pose;
  // Rebooting: its lights come on one by one over the reboot.
  if (a.reboot && en.state === 'roar') return a.reboot[Math.min(a.reboot.length - 1, Math.floor((en.t / en.until) * a.reboot.length))]!;
  // A hopper: in the air, crouching just before a hop, and puffed up while it spits confetti.
  if (a.jump !== undefined && en.state === 'charge') return a.jump;
  if (a.jump !== undefined && en.state === 'fire' && a.warn !== undefined) return a.warn;
  if (a.crouch !== undefined && en.state === 'idle' && en.until - en.t < 0.12) return a.crouch;
  // Scanning: the light crosses the glass over the warning (the photocopier); then the copy comes out.
  if (a.scan && en.state === 'warn') return a.scan[Math.min(a.scan.length - 1, Math.floor((en.t / Math.max(en.until, 1e-6)) * a.scan.length))]!;
  if (a.out !== undefined && en.state === 'brake') return a.out;
  // Frozen while it warns (the wireless mouse without signal).
  if (a.warn !== undefined && en.state === 'warn') return a.warn + (own ?? 0);
  // A mimic lying in wait, and jumping up when found out.
  if (a.lurk !== undefined && en.state === 'lurk') return a.lurk;
  if (a.reveal !== undefined && en.state === 'reveal') return a.reveal;
  // Jammed: it shakes on the spot.
  if (a.jam && en.state === 'jam') return a.jam[Math.floor(now / (a.jamMs ?? 60)) % a.jam.length]! + shift;
  // Run down (the wind-up robot with its key still).
  if (a.stun !== undefined && en.state === 'stun') return a.stun + shift;
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

/** The pose of a boss's current attack (BossPatternAttack.pose...), while it warns and just after. */
function attackPose(en: Enemy): number | undefined {
  const b = en.def.brain;
  if (b.kind !== 'boss' || en.attack === undefined) return undefined;
  const at = b.phases[en.bossPhase ?? 0]?.attacks[en.attack];
  if (!at || !('pose' in at) || at.pose === undefined) return undefined;
  if (en.state === 'warn' || (en.state === 'fire' && en.t < at.telegraph + 0.25)) return at.pose;
  return undefined;
}

/** The frame shift of the boss's current phase (BossPhase.frameShift), the last one that set it. */
function phaseFrameShift(en: Enemy): number | undefined {
  const b = en.def.brain;
  if (b.kind !== 'boss') return undefined;
  let out: number | undefined;
  for (let i = 0; i <= (en.bossPhase ?? 0) && i < b.phases.length; i++) out = b.phases[i]!.frameShift ?? out;
  return out;
}

/** Steps of the spin so far (one per `spinMs`, counted from when the warning ended). */
function spinStep(en: Enemy): number {
  const ms = en.def.anim?.spinMs ?? 80;
  return Math.max(0, Math.floor((en.t * 1000) / ms));
}

/** Whether the spinning boss is drawn mirrored now (the second half of its `spin` frames). */
export function spinMirrored(en: Enemy): boolean {
  const sp = en.def.anim?.spin;
  if (!sp || !isSpinning(en)) return false;
  return spinStep(en) % sp.length >= sp.length / 2;
}
