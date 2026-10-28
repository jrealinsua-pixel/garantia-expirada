// Declarative bullet patterns. A pattern is data (src/data/patterns.ts); expandPattern() turns it
// into a timeline of shots relative to the moment and direction it is fired. Enemies only say
// «fire pattern X at the player»; the timing and geometry live here.
import type { Rng } from './rng.ts';

export type BulletColor = 'red' | 'cyan';

interface Common {
  speed: number;
  color?: BulletColor;
  /** Sine wobble across the direction of travel: amplitude (px) and frequency (Hz). */
  wave?: { amp: number; freq: number };
  /** Speed change in px/s² (negative slows down). */
  accel?: number;
}

/** `count` bullets evenly around a full circle. `offsetDeg` rotates the ring. */
export interface RingDef extends Common {
  kind: 'ring';
  count: number;
  offsetDeg?: number;
  /** If true the ring is rotated so a bullet points at the target. */
  aimed?: boolean;
}

/** `count` bullets spread over `spreadDeg`, centred on the aim. */
export interface FanDef extends Common {
  kind: 'fan';
  count: number;
  spreadDeg: number;
}

/** `arms` rotating streams: `steps` shots per arm, one every `interval` s, turning `stepDeg` each time. */
export interface SpiralDef extends Common {
  kind: 'spiral';
  arms: number;
  steps: number;
  stepDeg: number;
  interval: number;
  offsetDeg?: number;
}

/** `count` aimed shots one every `interval` s, each with up to `jitterDeg` of random spread. */
export interface BurstDef extends Common {
  kind: 'burst';
  count: number;
  interval: number;
  jitterDeg?: number;
}

/** Several patterns, each starting `at` seconds after the first. */
export interface SequenceDef {
  kind: 'sequence';
  parts: Array<{ at: number; pattern: PatternDef; /** Extra rotation of this part (deg). */ turnDeg?: number }>;
}

export type PatternDef = RingDef | FanDef | SpiralDef | BurstDef | SequenceDef;

export interface ShotSpec {
  /** Seconds after the pattern starts. */
  delay: number;
  angle: number;
  speed: number;
  color: BulletColor;
  wave?: { amp: number; freq: number };
  accel?: number;
}

const DEG = Math.PI / 180;

function shot(def: Common, delay: number, angle: number): ShotSpec {
  const s: ShotSpec = { delay, angle, speed: def.speed, color: def.color ?? 'red' };
  if (def.wave) s.wave = def.wave;
  if (def.accel) s.accel = def.accel;
  return s;
}

/** All the shots of a pattern, sorted by delay. `aim` is the angle towards the target. */
export function expandPattern(def: PatternDef, aim: number, rng: Rng): ShotSpec[] {
  const out: ShotSpec[] = [];
  switch (def.kind) {
    case 'ring': {
      const base = (def.aimed ? aim : 0) + (def.offsetDeg ?? 0) * DEG;
      for (let i = 0; i < def.count; i++) out.push(shot(def, 0, base + (i * 2 * Math.PI) / def.count));
      break;
    }
    case 'fan': {
      const spread = def.spreadDeg * DEG;
      for (let i = 0; i < def.count; i++) {
        const k = def.count === 1 ? 0 : i / (def.count - 1) - 0.5;
        out.push(shot(def, 0, aim + k * spread));
      }
      break;
    }
    case 'spiral': {
      const base = (def.offsetDeg ?? 0) * DEG;
      for (let s = 0; s < def.steps; s++) {
        for (let a = 0; a < def.arms; a++) out.push(shot(def, s * def.interval, base + s * def.stepDeg * DEG + (a * 2 * Math.PI) / def.arms));
      }
      break;
    }
    case 'burst': {
      const j = (def.jitterDeg ?? 0) * DEG;
      for (let i = 0; i < def.count; i++) out.push(shot(def, i * def.interval, aim + (j ? rng.range(-j, j) : 0)));
      break;
    }
    case 'sequence': {
      for (const part of def.parts) {
        for (const s of expandPattern(part.pattern, aim + (part.turnDeg ?? 0) * DEG, rng)) out.push({ ...s, delay: s.delay + part.at });
      }
      break;
    }
  }
  return out.sort((a, b) => a.delay - b.delay);
}

/** How long the pattern takes from the first shot to the last (s). */
export function patternDuration(def: PatternDef): number {
  switch (def.kind) {
    case 'ring':
    case 'fan':
      return 0;
    case 'spiral':
      return (def.steps - 1) * def.interval;
    case 'burst':
      return (def.count - 1) * def.interval;
    case 'sequence':
      return Math.max(0, ...def.parts.map((p) => p.at + patternDuration(p.pattern)));
  }
}

/** True if the pattern points at the target (so the warning can show the direction). */
export function isAimed(def: PatternDef): boolean {
  switch (def.kind) {
    case 'ring':
      return def.aimed === true;
    case 'fan':
    case 'burst':
      return true;
    case 'spiral':
      return false;
    case 'sequence':
      return def.parts.some((p) => isAimed(p.pattern));
  }
}
