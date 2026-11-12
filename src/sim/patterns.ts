// Declarative bullet patterns. A pattern is data (src/data/patterns.ts); expandPattern() turns it
// into a timeline of shots relative to the moment and direction it is fired. Enemies only say
// «fire pattern X at the player»; the timing and geometry live here.
import type { Rng } from './rng.ts';

/**
 * `ice` are the boss's ice cubes: cyan too, but square, so they read as cubes. `card` are its
 * loyalty cards: red, with a white band, spinning. `invoice` are the printer's invoices: white
 * sheets with a thick red border, fluttering. `nut` are the wind-up robot's hex nuts: red with a
 * white core like `red`, spinning. `confetti` is the surprise envelope's gift wrap: red paper with a
 * yellow ribbon, fluttering. `accessory` are the Muñeco de Moda's pink plastic shoes and handbags, spinning.
 * `sticker` are its sale stickers out of the box: round, yellow, with a red «%», turning. `strip`
 * are the shredder's strips of paper: white with a red edge, wriggling. `sheet` are the
 * photocopier's sheets: white with toner lines and a red rim, tumbling. `ink` are the DENEGADO
 * stamp's drops: red, with a white glint, wobbling. `bizcard` are the Director's business cards: white
 * with a cyan edge, spinning; `slide` his slides: a red frame round a chart going down, turning; `cut` his line of
 * cuts: red with a white core and an arrow pointing down. `ticket` are the ticket dispenser's paper
 * tickets: red with a white core, flat or folded over as they glide. `steel` are the queue posts'
 * steel balls: grey with a cyan glint and a white core. `bubble` are the virtual assistant's speech
 * bubbles: cyan with a white core, with «…» while they wait; `help` its «¿Le he ayudado?» buttons
 * (SÍ cyan and NO red, by turns). `call` is the reception phone's call: a fat red ball with a white
 * core and a handset on it, its ring pulsing; `note` the notes of the hold music: cyan, one or two;
 * `plug` the Centralita's plugs, red with a white core, pointing where they fly. `screw`, `spring`
 * and `key` are what the Trituradora has taken apart (M12 (4b)): steel screws with a red head,
 * spinning; red coiled springs, squashing and stretching; old keyboard keys, white with a red letter, tumbling.
 * `foam` and `sock` are the Lavadora Programa Eco's (M14 (j2)): big soap bubbles, cyan-rimmed with a
 * white glint, wobbling; and odd socks, red with a white heel and toe, flapping as they bounce.
 */
export type BulletColor =
  | 'red' | 'cyan' | 'ice' | 'card' | 'invoice' | 'nut' | 'confetti' | 'accessory' | 'sticker' | 'strip' | 'sheet' | 'ink' | 'bizcard' | 'slide' | 'cut' | 'ticket' | 'steel' | 'bubble' | 'help'
  | 'call' | 'note' | 'plug' | 'cord' | 'screw' | 'spring' | 'key' | 'foam' | 'sock';

/**
 * «Escribiendo…»: at `at` s it stops in mid-air for `wait` s, then sets off again (at its speed)
 * towards where the player will be `lead` s later, going by how it is moving.
 */
export interface Pause {
  at: number;
  wait: number;
  lead: number;
}

/** Turns towards the player at up to `turnDeg` degrees per second for its first `time` seconds. */
export interface Homing {
  turnDeg: number;
  time: number;
}

interface Common {
  speed: number;
  color?: BulletColor;
  /** Sine wobble across the direction of travel: amplitude (px) and frequency (Hz). */
  wave?: { amp: number; freq: number };
  /** Speed change in px/s² (negative slows down). */
  accel?: number;
  /** With `accel`: it stops speeding up at this speed (px/s). */
  maxSpeed?: number;
  /** It chases the player for a while (see Homing). */
  homing?: Homing;
  /** It stops halfway and aims again (see Pause). */
  pause?: Pause;
  /** The player's bullets can break it (both are lost). */
  shootable?: boolean;
  /** Seconds it lives, if not the usual. */
  life?: number;
  /** Its radius (px), if not the usual (ENEMY_BULLET_RADIUS): the phone's fat call. */
  radius?: number;
  /** Walls (and props) it bounces off before it breaks: the Lavadora's odd socks. */
  bounce?: number;
}

/** `count` bullets evenly around a full circle. `offsetDeg` rotates the ring. */
export interface RingDef extends Common {
  kind: 'ring';
  count: number;
  offsetDeg?: number;
  /** If true the ring is rotated so a bullet points at the target. */
  aimed?: boolean;
  /**
   * Holes in the ring, to go through: no bullets within `widthDeg` / 2 of the aim turned by each
   * of `atDeg` (the wifi's «zonas sin cobertura»).
   */
  gaps?: { widthDeg: number; atDeg: number[] };
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
  /**
   * Holes that turn with the arms, to follow round (the Director's «línea de recortes»): the spiral
   * is then aimed (its arms start from the aim, turned `offsetDeg`) and no arm fires within
   * `widthDeg` / 2 of the aim turned by each of `atDeg` and by the turn so far.
   */
  gaps?: { widthDeg: number; atDeg: number[] };
  /** Its arms start from the aim (turned `offsetDeg`) instead of from straight right. */
  aimed?: boolean;
  /**
   * Its warning shows where the arms start, as long dotted lines (Emitter.arms): the Centralita's
   * cords sweeping the room, M11 (5c).
   */
  preview?: boolean;
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
  maxSpeed?: number;
  homing?: Homing;
  pause?: Pause;
  shootable?: boolean;
  life?: number;
  radius?: number;
  bounce?: number;
}

const DEG = Math.PI / 180;

function shot(def: Common, delay: number, angle: number): ShotSpec {
  const s: ShotSpec = { delay, angle, speed: def.speed, color: def.color ?? 'red' };
  if (def.wave) s.wave = def.wave;
  if (def.accel) s.accel = def.accel;
  if (def.maxSpeed) s.maxSpeed = def.maxSpeed;
  if (def.homing) s.homing = def.homing;
  if (def.pause) s.pause = def.pause;
  if (def.shootable) s.shootable = true;
  if (def.life) s.life = def.life;
  if (def.radius) s.radius = def.radius;
  if (def.bounce) s.bounce = def.bounce;
  return s;
}

/** Angle between two directions (0 to π). */
function angleGap(a: number, b: number): number {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
}

/** All the shots of a pattern, sorted by delay. `aim` is the angle towards the target. */
export function expandPattern(def: PatternDef, aim: number, rng: Rng): ShotSpec[] {
  const out: ShotSpec[] = [];
  switch (def.kind) {
    case 'ring': {
      const base = (def.aimed ? aim : 0) + (def.offsetDeg ?? 0) * DEG;
      for (let i = 0; i < def.count; i++) {
        const a = base + (i * 2 * Math.PI) / def.count;
        if (def.gaps && def.gaps.atDeg.some((g) => angleGap(a, aim + g * DEG) < (def.gaps!.widthDeg * DEG) / 2)) continue;
        out.push(shot(def, 0, a));
      }
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
      const base = (def.gaps || def.aimed ? aim : 0) + (def.offsetDeg ?? 0) * DEG;
      for (let s = 0; s < def.steps; s++) {
        const turn = s * def.stepDeg * DEG;
        for (let a = 0; a < def.arms; a++) {
          const ang = base + turn + (a * 2 * Math.PI) / def.arms;
          if (def.gaps && def.gaps.atDeg.some((g) => angleGap(ang, aim + turn + g * DEG) < (def.gaps!.widthDeg * DEG) / 2)) continue;
          out.push(shot(def, s * def.interval, ang));
        }
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
      return def.gaps !== undefined;
    case 'sequence':
      return def.parts.some((p) => isAimed(p.pattern));
  }
}
