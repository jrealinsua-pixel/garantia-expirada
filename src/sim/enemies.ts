// Enemy behaviours. Each brain kind in src/data/types.ts has an update function here; the numbers
// come from the enemy's data.
import type {
  BlinkerBrain, BossAttack, BossBrain, BossMenuAttack, BossPhase,
  RelayBrain, ChargerBrain, ChaserBrain, LaggerBrain, MimicBrain, MothBrain, TurretBrain, WatcherBrain, WindupBrain, RcCarBrain, LobberBrain,
  HopperBrain, ShredderBrain, CopierBrain, StamperBrain, BlowerBrain, TurnerBrain, QueuerBrain, ChatbotBrain, PhoneBrain, LootboxBrain,
} from '../data/types.ts';
import { blockedTiles, clearLine, findPath } from './nav.ts';
import { BRICK_KINDS, ENEMIES } from '../data/enemies.ts';
import { PATTERNS } from '../data/patterns.ts';
import { EXPIRED_PRODUCTS, PROPS } from '../data/props.ts';
import { patternDuration } from './patterns.ts';
import { inConveyor, layFloorBelt } from './conveyors.ts';
import { startCrates, tickCrates } from './crates.ts';
import { normalize, overlaps, type Rect } from './vec.ts';
import { BACK_WALL_ROWS, isWallAt, TILE, wallRectsNear } from './room.ts';
import {
  BOSS_PHASE_BREAK,
  clearEnemyFire,
  isDead,
  DT,
  firePattern,
  freeSpot,
  HAND_HEIGHT,
  hurtPlayer,
  inWind,
  isClear,
  isRolling,
  peelLabels,
  playerFeetBox,
  restructureRoom,
  slide,
  spawnEnemy,
  stampInk,
  STAMP_LIFT,
  throwFrost,
  layFrost,
  inFrost,
  type Enemy,
  type SimEvent,
  type World,
} from './world.ts';

/** Bullets push enemies; this friction brings them back to their own speed. */
const KNOCK_FRICTION = 900;

export function updateEnemies(w: World): void {
  for (const en of w.enemies) {
    en.hitT = Math.max(0, en.hitT - DT);
    en.contactCooldown = Math.max(0, en.contactCooldown - DT);
    if (en.state === 'dying') {
      // A boss coming apart (see reapEnemies): it stays where it fell and touches nobody.
      en.t += DT;
      en.vx = 0;
      en.vy = 0;
      continue;
    }
    // Llamada Grabada: the mark wears off.
    if (en.markT && en.markT > 0) en.markT = Math.max(0, en.markT - DT);
    // Etiquetadora: labels left alone peel off.
    peelLabels(en);
    // Glitter (BulletBehaviour.slow): it skips one tick in every 1 / (1 − mul), walking, waiting
    // and attacking that much slower.
    if (en.slowT && en.slowT > 0) {
      en.slowT = Math.max(0, en.slowT - DT);
      const every = Math.max(2, Math.round(1 / Math.max(0.01, 1 - (en.slowMul ?? 1))));
      if ((w.tick + en.id) % every === 0) continue;
    }
    // A copy fading out (its photocopier broke): it falls when the toner is gone.
    if (en.fadeT !== undefined) {
      en.fadeT -= DT;
      if (en.fadeT <= 0) {
        en.damageTaken = en.def.hp;
        continue;
      }
    }
    // A photocopy is slower at everything: it skips one tick in every 1 / (1 − pace).
    if (en.pace !== undefined && en.pace < 1) {
      const every = Math.max(2, Math.round(1 / (1 - en.pace)));
      if ((w.tick + en.id + 2) % every === 0) continue;
    }
    switch (en.def.brain.kind) {
      case 'charger':
        updateCharger(w, en, en.def.brain);
        break;
      case 'turret':
        updateTurret(w, en, en.def.brain);
        break;
      case 'moth':
        updateMoth(w, en, en.def.brain);
        break;
      case 'chaser':
        updateChaser(w, en, en.def.brain);
        break;
      case 'blinker':
        updateBlinker(w, en, en.def.brain);
        break;
      case 'boss':
        updateBoss(w, en, en.def.brain);
        break;
      case 'mimic':
        updateMimic(w, en, en.def.brain);
        break;
      case 'lagger':
        updateLagger(w, en, en.def.brain);
        break;
      case 'watcher':
        updateWatcher(w, en, en.def.brain);
        break;
      case 'relay':
        updateRelay(w, en, en.def.brain);
        break;
      case 'windup':
        updateWindup(w, en, en.def.brain);
        break;
      case 'rccar':
        updateRcCar(w, en, en.def.brain);
        break;
      case 'lobber':
        updateLobber(w, en, en.def.brain);
        break;
      case 'hopper':
        updateHopper(w, en, en.def.brain);
        break;
      case 'shredder':
        updateShredder(w, en, en.def.brain);
        break;
      case 'copier':
        updateCopier(w, en, en.def.brain);
        break;
      case 'stamper':
        updateStamper(w, en, en.def.brain);
        break;
      case 'blower':
        updateBlower(w, en, en.def.brain);
        break;
      case 'turner':
        updateTurner(w, en, en.def.brain);
        break;
      case 'queuer':
        updateQueuer(w, en, en.def.brain);
        break;
      case 'chatbot':
        updateChatbot(w, en, en.def.brain);
        break;
      case 'phone':
        updatePhone(w, en, en.def.brain);
        break;
      case 'lootbox':
        updateLootbox(w, en, en.def.brain);
        break;
    }
    // Watched live: the time it waits between attacks runs faster.
    if (en.rush) {
      if ((en.state === 'walk' || en.state === 'idle') && en.t < en.until) en.t += DT * (en.rush.scale - 1);
      en.rush.t -= DT;
      if (en.rush.t <= 0) delete en.rush;
    }
    carry(w, en);
    contact(w, en);
  }
  separate(w);
}

/**
 * The room's own conveyor belts (M12 (3b3)) carry whoever walks on them, enemies too: those on
 * foot (not flyers, the Router's repeaters or bosses; the Trituradora's belt is hers and carries
 * only the toaster).
 */
function carry(w: World, en: Enemy): void {
  if (w.conveyors.length === 0 || isDead(en)) return;
  const k = en.def.brain.kind;
  if (k === 'moth' || k === 'boss' || k === 'relay' || en.def.boss) return;
  const belt = w.conveyors.find((c) => c.source === undefined && inConveyor(c, en.x, en.y));
  if (belt) slide(w, en, en.def.footRadius, belt.dirX * belt.speed * DT, belt.dirY * belt.speed * DT);
}

/** Room each walking enemy keeps round itself, as a share of its body width. */
const PERSONAL_SPACE = 0.4;
/** Share of the overlap two enemies undo each tick (each one half of it): soft, no jolts. */
const SEPARATION = 0.25;

/**
 * Walking enemies do not stand inside each other: two that overlap are nudged apart along the
 * line between them, sliding along walls and props. Flyers, bosses and the dying are left alone.
 */
function separate(w: World): void {
  const walkers = w.enemies.filter((en) => en.state !== 'dying' && en.def.brain.kind !== 'moth' && en.def.brain.kind !== 'boss' && en.def.brain.kind !== 'relay');
  for (let i = 0; i < walkers.length; i++) {
    const a = walkers[i]!;
    for (let j = i + 1; j < walkers.length; j++) {
      const b = walkers[j]!;
      const min = (a.def.hurt.w + b.def.hurt.w) * PERSONAL_SPACE;
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let d = Math.hypot(dx, dy);
      if (d >= min) continue;
      if (d < 0.001) {
        // Right on top of each other: apart sideways (which way, by id; no randomness).
        dx = a.id < b.id ? 1 : -1;
        dy = 0;
        d = 1;
      }
      const push = ((min - Math.min(d, min)) * SEPARATION) / 2;
      const ux = dx / d;
      const uy = dy / d;
      const ka = { x: a.x, y: a.y, vx: 0, vy: 0 };
      const kb = { x: b.x, y: b.y, vx: 0, vy: 0 };
      slide(w, ka, a.def.footRadius, -ux * push, -uy * push);
      slide(w, kb, b.def.footRadius, ux * push, uy * push);
      a.x = ka.x;
      a.y = ka.y;
      b.x = kb.x;
      b.y = kb.y;
    }
  }
}

function enter(en: Enemy, state: Enemy['state'], until: number): void {
  en.state = state;
  en.t = 0;
  en.until = until;
}

/** Slows (vx, vy) by `decel` px/s² towards (tx, ty). */
function approach(en: Enemy, tx: number, ty: number, decel: number): void {
  const dx = tx - en.vx;
  const dy = ty - en.vy;
  const d = Math.hypot(dx, dy);
  const m = decel * DT;
  if (d <= m) {
    en.vx = tx;
    en.vy = ty;
  } else {
    en.vx += (dx / d) * m;
    en.vy += (dy / d) * m;
  }
}

function updateCharger(w: World, en: Enemy, b: ChargerBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  const dist = Math.hypot(toX, toY);
  en.t += DT;

  switch (en.state) {
    case 'walk': {
      if (b.steer) {
        steerWalk(w, en, b, b.steer, toX, toY, dist);
        break;
      }
      const dir = normalize(toX, toY);
      approach(en, dir.x * b.walkSpeed, dir.y * b.walkSpeed, KNOCK_FRICTION);
      if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
      if (en.t >= en.until && dist < b.range) {
        // Lock the direction now: the warning shows exactly where it will go.
        en.dirX = dir.x;
        en.dirY = dir.y;
        en.facing = dir.x >= 0 ? 1 : -1;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: b.telegraph, aim: Math.atan2(dir.y, dir.x), aimed: true, color: 'red', source: en.id });
      }
      break;
    }
    case 'warn':
      approach(en, 0, 0, KNOCK_FRICTION);
      if (en.t >= en.until) {
        enter(en, 'charge', b.chargeTime);
        en.bounces = b.rebound ?? 0;
        en.vx = en.dirX * b.chargeSpeed;
        en.vy = en.dirY * b.chargeSpeed;
        w.events.push({ type: 'charge', x: en.x, y: en.y, dirX: en.dirX, dirY: en.dirY, source: en.id });
      }
      break;
    case 'charge':
      // Straight line: bullets do not deflect a charging vacuum.
      en.vx = en.dirX * b.chargeSpeed;
      en.vy = en.dirY * b.chargeSpeed;
      if (en.t >= en.until) {
        enter(en, 'brake', b.recover);
        w.events.push({ type: 'brake', x: en.x, y: en.y, source: en.id });
      }
      break;
    case 'brake':
    case 'stun':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) {
        if (b.reverse) {
          // «Atención: vehículo en maniobra»: straight back the way it came.
          enter(en, 'reverse', b.reverse.time);
          en.phase = 0;
          w.events.push({ type: 'reverseBeep', x: en.x, y: en.y, first: true, source: en.id });
        } else enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
      }
      break;
    case 'reverse': {
      const r = b.reverse!;
      en.vx = -en.dirX * r.speed;
      en.vy = -en.dirY * r.speed;
      en.phase += DT;
      if (en.phase >= r.beep) {
        en.phase -= r.beep;
        w.events.push({ type: 'reverseBeep', x: en.x, y: en.y, first: false, source: en.id });
      }
      break;
    }
  }

  const ox = en.x;
  const oy = en.y;
  const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
  if (en.state === 'reverse' && (en.t >= en.until || hit.hitX || hit.hitY)) {
    // Backed into something, or far enough: it stops and looks for you again.
    en.vx = 0;
    en.vy = 0;
    enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
    return;
  }
  if (en.state === 'charge' && ((hit.hitX && Math.abs(en.dirX) > 0.3) || (hit.hitY && Math.abs(en.dirY) > 0.3))) {
    w.events.push({ type: 'bonk', x: en.x + en.dirX * en.def.footRadius, y: en.y - 6, dirX: en.dirX, dirY: en.dirY, source: en.id });
    if ((en.bounces ?? 0) > 0) {
      // A billiard ball (M14b (h9a)): off the wall it goes on charging, mirrored, a little longer.
      en.bounces = (en.bounces ?? 1) - 1;
      if (hit.hitX) en.dirX = -en.dirX;
      if (hit.hitY) en.dirY = -en.dirY;
      const d = slanted(en.dirX, en.dirY, 0.25);
      en.dirX = d.x;
      en.dirY = d.y;
      en.facing = en.dirX >= 0 ? 1 : -1;
      en.until = en.t + (b.reboundTime ?? 0.4);
      en.vx = en.dirX * b.chargeSpeed;
      en.vy = en.dirY * b.chargeSpeed;
      return;
    }
    enter(en, 'stun', b.stun);
    // Small bounce back off the wall.
    en.vx = -en.dirX * 60;
    en.vy = -en.dirY * 60;
  }
}

/** The shortest signed turn (radians) from angle `from` to angle `to`, in (−π, π]. */
export function turnBetween(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * A forklift looking for the player (ChargerBrain.steer): its heading (dirX, dirY) turns towards
 * them at most `turnRate` °/s and it drives forward along it, never sideways; it charges along that
 * heading once its walk is over, the player is in range and within `aimCone` of its forks.
 */
function steerWalk(w: World, en: Enemy, b: ChargerBrain, s: { turnRate: number; aimCone: number }, toX: number, toY: number, dist: number): void {
  const want = Math.atan2(toY, toX);
  if (en.dirX === 0 && en.dirY === 0) {
    // Just arrived: it comes in already facing the room's toaster.
    en.dirX = Math.cos(want);
    en.dirY = Math.sin(want);
  }
  const cur = Math.atan2(en.dirY, en.dirX);
  const off = turnBetween(cur, want);
  const max = (s.turnRate * Math.PI) / 180 * DT;
  const head = cur + Math.max(-max, Math.min(max, off));
  en.dirX = Math.cos(head);
  en.dirY = Math.sin(head);
  // Facing follows the forks, with a little give so it does not flicker driving straight up.
  if (Math.abs(en.dirX) > 0.15) en.facing = en.dirX > 0 ? 1 : -1;
  approach(en, en.dirX * b.walkSpeed, en.dirY * b.walkSpeed, KNOCK_FRICTION);
  const lined = Math.abs(off) <= (s.aimCone * Math.PI) / 180;
  if (en.t >= en.until && dist < b.range && lined) {
    // Lock the heading now: the warning shows exactly where it will go.
    enter(en, 'warn', b.telegraph);
    w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: b.telegraph, aim: head, aimed: true, color: 'red', source: en.id });
  }
}

/**
 * A direction close to (x, y) that is never straight along an axis: each component keeps at least
 * `slant` (a billiard ball sent straight at a wall would bounce back and forth in one line).
 */
export function slanted(x: number, y: number, slant: number): { x: number; y: number } {
  const d = normalize(x, y);
  let ax = Math.abs(d.x);
  let ay = Math.abs(d.y);
  if (ax === 0 && ay === 0) ax = 1;
  if (ax < slant) {
    ax = slant;
    ay = Math.sqrt(1 - slant * slant);
  } else if (ay < slant) {
    ay = slant;
    ax = Math.sqrt(1 - slant * slant);
  }
  const l = Math.hypot(ax, ay);
  return { x: ((d.x < 0 ? -1 : 1) * ax) / l, y: ((d.y < 0 ? -1 : 1) * ay) / l };
}

/** Whether a wind-up toy is run down or winding up: stopped, and taking `exposed` times the damage. */
export function isRunDown(en: Enemy): boolean {
  return en.def.brain.kind === 'windup' && (en.state === 'stun' || en.state === 'jam');
}

/** Sets a wind-up toy off towards the player, give or take its aim jitter. */
function setOff(w: World, en: Enemy, b: WindupBrain): void {
  const p = w.player;
  const a = Math.atan2(p.y - en.y, p.x - en.x) + w.rng.range(-b.aimJitterDeg, b.aimJitterDeg) * (Math.PI / 180);
  const d = slanted(Math.cos(a), Math.sin(a), b.minSlant);
  en.dirX = d.x;
  en.dirY = d.y;
  enter(en, 'charge', w.rng.range(b.run[0], b.run[1]));
  // `phase` is the time since its last bounce (no two volleys of nuts at once in a corner).
  en.phase = b.bounceGap;
  w.events.push({ type: 'windGo', x: en.x, y: en.y, source: en.id });
}

/**
 * Robot de Cuerda: runs straight and bounces like a billiard ball, firing nuts at you on each
 * bounce, until it runs down (stopped, taking double) and winds itself up again. See WindupBrain.
 */
function updateWindup(w: World, en: Enemy, b: WindupBrain): void {
  en.t += DT;
  switch (en.state) {
    case 'charge': {
      en.phase += DT;
      en.vx = en.dirX * b.speed;
      en.vy = en.dirY * b.speed;
      en.facing = en.dirX >= 0 ? 1 : -1;
      const ox = en.x;
      const oy = en.y;
      const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
      en.moved += Math.hypot(en.x - ox, en.y - oy);
      if (hit.hitX || hit.hitY) {
        if (hit.hitX) en.dirX = -en.dirX;
        if (hit.hitY) en.dirY = -en.dirY;
        const d = slanted(en.dirX, en.dirY, b.minSlant);
        en.dirX = d.x;
        en.dirY = d.y;
        en.facing = en.dirX >= 0 ? 1 : -1;
        w.events.push({ type: 'windBounce', x: en.x, y: en.y - 6, source: en.id });
        if (en.phase >= b.bounceGap) {
          en.phase = 0;
          const def = PATTERNS[b.pattern];
          if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
          const p = w.player;
          const mh = muzzleHeight(w, en, b.muzzleY);
          firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - en.x), { telegraph: 0, source: en.id, by: en.def.id, height: mh });
        }
      }
      if (en.t >= en.until) {
        // Run down: it stops dead where it is.
        enter(en, 'stun', b.rundown - b.windup);
        en.vx = 0;
        en.vy = 0;
        w.events.push({ type: 'windDown', x: en.x, y: en.y, source: en.id });
      }
      return;
    }
    case 'stun':
      approach(en, 0, 0, KNOCK_FRICTION);
      if (en.t >= en.until) {
        enter(en, 'jam', b.windup);
        w.events.push({ type: 'windUp', x: en.x, y: en.y, source: en.id });
      }
      break;
    case 'jam':
      approach(en, 0, 0, KNOCK_FRICTION);
      if (en.t >= en.until) setOff(w, en, b);
      break;
    default:
      // Anything else (just spawned, or left waiting): it winds itself up first.
      if (en.state !== 'idle' || en.t >= en.until) {
        enter(en, 'jam', b.windup);
        w.events.push({ type: 'windUp', x: en.x, y: en.y, source: en.id });
      }
  }
  // Stopped: only a bullet's knockback moves it.
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

const DEG = Math.PI / 180;

/** Turns angle `a` towards `b` by at most `max` rad. */
function turnTowards(a: number, b: number, max: number): number {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + Math.max(-max, Math.min(max, d));
}

/**
 * Coche Teledirigido: circles the toaster in drifting arcs and, when it has it to its side, brakes,
 * aims and rams; into a wall it overturns. Its batteries give out now and then. See RcCarBrain.
 */
function updateRcCar(w: World, en: Enemy, b: RcCarBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  const dist = Math.hypot(toX, toY) || 1;
  en.t += DT;
  if (en.legSpin === undefined) en.legSpin = w.rng.next() < 0.5 ? 1 : -1;
  if (en.stallT === undefined) en.stallT = w.rng.range(b.stall.every[0], b.stall.every[1]);
  switch (en.state) {
    case 'walk': {
      // Steer to a point further round its circle about the toaster, turning no faster than it can.
      const round = Math.atan2(en.y - p.y, en.x - p.x) + en.legSpin * b.leadDeg * DEG;
      const want = Math.atan2(p.y + Math.sin(round) * b.orbit - en.y, p.x + Math.cos(round) * b.orbit - en.x);
      const head = turnTowards(Math.atan2(en.dirY, en.dirX), want, b.turnDeg * DEG * DT);
      en.dirX = Math.cos(head);
      en.dirY = Math.sin(head);
      approach(en, en.dirX * b.speed, en.dirY * b.speed, KNOCK_FRICTION);
      en.facing = en.dirX >= 0 ? 1 : -1;
      en.stallT -= DT;
      // Side on: the toaster is roughly square to where it is going.
      const side = Math.abs(en.dirX * toX + en.dirY * toY) / dist < Math.sin(b.sideDeg * DEG);
      if (en.t >= en.until && side && dist < b.range) {
        const d = normalize(toX, toY);
        en.dirX = d.x;
        en.dirY = d.y;
        en.facing = d.x >= 0 ? 1 : -1;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: b.telegraph, aim: Math.atan2(d.y, d.x), aimed: true, color: 'red', source: en.id });
      } else if (en.stallT <= 0) {
        // «Pilas no incluidas»: it stops dead mid-arc and flickers (the wait before ramming keeps).
        en.legT = Math.max(0.3, en.until - en.t);
        enter(en, 'off', b.stall.time);
        en.stallT = w.rng.range(b.stall.every[0], b.stall.every[1]);
        w.events.push({ type: 'carStall', x: en.x, y: en.y, source: en.id });
      }
      break;
    }
    case 'off':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) enter(en, 'walk', en.legT ?? 0.3);
      break;
    case 'warn':
      // Brakes hard and turns to face it (the direction is already locked).
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) {
        enter(en, 'charge', b.ramTime);
        en.vx = en.dirX * b.ramSpeed;
        en.vy = en.dirY * b.ramSpeed;
        w.events.push({ type: 'charge', x: en.x, y: en.y, dirX: en.dirX, dirY: en.dirY, source: en.id });
      }
      break;
    case 'charge':
      en.vx = en.dirX * b.ramSpeed;
      en.vy = en.dirY * b.ramSpeed;
      if (en.t >= en.until) {
        enter(en, 'brake', b.recover);
        w.events.push({ type: 'brake', x: en.x, y: en.y, source: en.id });
      }
      break;
    case 'brake':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) {
        // Off again, the other way round half the time.
        if (w.rng.next() < 0.5) en.legSpin = -en.legSpin;
        enter(en, 'walk', w.rng.range(b.ramAfter[0], b.ramAfter[1]));
      }
      break;
    case 'stun':
      // Overturned, wheels in the air.
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) {
        enter(en, 'walk', w.rng.range(b.ramAfter[0], b.ramAfter[1]));
        en.dirX = -en.dirX;
        en.dirY = -en.dirY;
        w.events.push({ type: 'carRight', x: en.x, y: en.y, source: en.id });
      }
      break;
    default:
      enter(en, 'walk', w.rng.range(b.ramAfter[0], b.ramAfter[1]));
  }
  const ox = en.x;
  const oy = en.y;
  const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
  if (en.state === 'charge' && ((hit.hitX && Math.abs(en.dirX) > 0.3) || (hit.hitY && Math.abs(en.dirY) > 0.3))) {
    w.events.push({ type: 'bonk', x: en.x + en.dirX * en.def.footRadius, y: en.y - 6, dirX: en.dirX, dirY: en.dirY, source: en.id });
    w.events.push({ type: 'carFlip', x: en.x, y: en.y, source: en.id });
    enter(en, 'stun', b.flip);
    en.vx = -en.dirX * 50;
    en.vy = -en.dirY * 50;
  } else if (en.state === 'walk' && (hit.hitX || hit.hitY)) {
    // Scraping along a wall while circling: it bounces off and goes round the other way.
    if (hit.hitX) en.dirX = -en.dirX;
    if (hit.hitY) en.dirY = -en.dirY;
    en.legSpin = -en.legSpin;
  }
}

/**
 * Where a player bullet flying at `angle` (rad) hits a shredder: `front` if it comes at it within
 * frontDeg / 2 of where it faces (swallowed), `back` if within the same of its back (backMul), else
 * `side`. Anything that is not a shredder is always hit on the `side` (normal damage).
 */
export function shredSide(en: Enemy, angle: number): 'front' | 'side' | 'back' {
  const b = en.def.brain;
  if (b.kind !== 'shredder') return 'side';
  // The bullet travels along `angle`: it comes from the opposite way.
  const along = Math.cos(angle) * en.dirX + Math.sin(angle) * en.dirY;
  const cone = Math.cos((b.frontDeg / 2) * DEG);
  if (-along >= cone) return 'front';
  if (along >= cone) return 'back';
  return 'side';
}

/**
 * A shredder swallows a bullet that came at it from the front: it chews (the blades show red for a
 * moment) and every `spitEvery` bullets it spits a fan of paper strips back at the player.
 */
export function shredBullet(w: World, en: Enemy, x: number, y: number): void {
  const b = en.def.brain;
  if (b.kind !== 'shredder') return;
  en.swallowed = (en.swallowed ?? 0) + 1;
  en.chompT = 0.18;
  w.events.push({ type: 'shred', x, y, source: en.id });
  if (en.swallowed % b.spitEvery !== 0) return;
  const def = PATTERNS[b.pattern];
  if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
  const p = w.player;
  const mh = muzzleHeight(w, en, b.muzzleY);
  firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - en.x), { telegraph: 0, source: en.id, by: en.def.id, height: mh });
  w.events.push({ type: 'shredSpit', x: en.x, y: en.y - mh, source: en.id });
}

/**
 * Destructora de Documentos: plods towards the toaster always facing it (turning slowly), swallows
 * what is shot at its front and now and then lunges to swallow the toaster too. See ShredderBrain.
 */
function updateShredder(w: World, en: Enemy, b: ShredderBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  const dist = Math.hypot(toX, toY) || 1;
  en.t += DT;
  en.chompT = Math.max(0, (en.chompT ?? 0) - DT);
  if (en.swallowed === undefined) {
    // Just switched on: it already faces the toaster, and waits a while before its first lunge.
    en.swallowed = 0;
    en.dirX = toX / dist;
    en.dirY = toY / dist;
    enter(en, 'walk', w.rng.range(b.lungeEvery[0], b.lungeEvery[1]));
  }
  switch (en.state) {
    case 'walk': {
      const head = turnTowards(Math.atan2(en.dirY, en.dirX), Math.atan2(toY, toX), b.turnDeg * DEG * DT);
      en.dirX = Math.cos(head);
      en.dirY = Math.sin(head);
      // It walks where it faces, but not into the toaster's face.
      const pace = dist > 26 ? b.speed : 0;
      approach(en, en.dirX * pace, en.dirY * pace, KNOCK_FRICTION);
      const ahead = (en.dirX * toX + en.dirY * toY) / dist >= Math.cos((b.frontDeg / 2) * DEG);
      if (en.t >= en.until && dist < b.range && ahead) {
        const d = normalize(toX, toY);
        en.dirX = d.x;
        en.dirY = d.y;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: b.telegraph, aim: Math.atan2(d.y, d.x), aimed: true, color: 'red', source: en.id });
        w.events.push({ type: 'shredJam', x: en.x, y: en.y, source: en.id });
      }
      break;
    }
    case 'warn':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) {
        enter(en, 'charge', b.lungeTime);
        en.vx = en.dirX * b.lungeSpeed;
        en.vy = en.dirY * b.lungeSpeed;
        w.events.push({ type: 'charge', x: en.x, y: en.y, dirX: en.dirX, dirY: en.dirY, source: en.id });
      }
      break;
    case 'charge':
      en.vx = en.dirX * b.lungeSpeed;
      en.vy = en.dirY * b.lungeSpeed;
      if (en.t >= en.until) {
        enter(en, 'brake', b.recover);
        w.events.push({ type: 'brake', x: en.x, y: en.y, source: en.id });
      }
      break;
    case 'brake':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.lungeEvery[0], b.lungeEvery[1]));
      break;
    default:
      enter(en, 'walk', w.rng.range(b.lungeEvery[0], b.lungeEvery[1]));
  }
  if (Math.abs(en.dirX) > 0.2) en.facing = en.dirX >= 0 ? 1 : -1;
  const ox = en.x;
  const oy = en.y;
  const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
  // A lunge into a wall or a prop ends there.
  if (en.state === 'charge' && ((hit.hitX && Math.abs(en.dirX) > 0.3) || (hit.hitY && Math.abs(en.dirY) > 0.3))) {
    w.events.push({ type: 'bonk', x: en.x + en.dirX * en.def.footRadius, y: en.y - 6, dirX: en.dirX, dirY: en.dirY, source: en.id });
    enter(en, 'brake', b.recover);
    en.vx = -en.dirX * 40;
    en.vy = -en.dirY * 40;
  }
}

/** Whether a chaser is in TURBO (low on life): faster at everything. */
export function inTurbo(en: Enemy): boolean {
  const b = en.def.brain;
  return b.kind === 'chaser' && !!b.turbo && en.damageTaken >= en.def.hp * (1 - b.turbo.below);
}

function updateChaser(w: World, en: Enemy, b: ChaserBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  const dist = Math.hypot(toX, toY);
  const turbo = inTurbo(en);
  const k = turbo && b.turbo ? b.turbo.scale : 1;
  if (turbo && !en.turbo) {
    en.turbo = true;
    w.events.push({ type: 'turbo', x: en.x, y: en.y, source: en.id });
  }
  en.t += DT * (en.state === 'walk' ? 1 : k);

  switch (en.state) {
    case 'walk': {
      // Straight at the player, weaving a little so a crowd of them does not move as one.
      const weave = Math.sin(w.tick / 9 + en.id) * 0.35;
      const dir = normalize(toX - toY * weave, toY + toX * weave);
      approach(en, dir.x * b.walkSpeed * k, dir.y * b.walkSpeed * k, KNOCK_FRICTION);
      if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
      if (en.t >= en.until && dist < b.range && !w.over) {
        const d = normalize(toX, toY);
        en.dirX = d.x;
        en.dirY = d.y;
        en.facing = d.x >= 0 ? 1 : -1;
        en.bounces = undefined;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: b.telegraph / k, aim: Math.atan2(d.y, d.x), aimed: true, color: 'red', source: en.id });
      }
      break;
    }
    case 'warn':
      approach(en, 0, 0, KNOCK_FRICTION);
      if (en.t >= en.until) {
        enter(en, 'charge', b.lungeTime);
        en.vx = en.dirX * b.lungeSpeed;
        en.vy = en.dirY * b.lungeSpeed;
        w.events.push({ type: 'lunge', x: en.x, y: en.y, dirX: en.dirX, dirY: en.dirY, source: en.id });
      }
      break;
    case 'charge':
      en.vx = en.dirX * b.lungeSpeed;
      en.vy = en.dirY * b.lungeSpeed;
      if (en.t >= en.until) {
        // A burst (M14b (h9a)): the first lunge sets how many follow it.
        if (en.bounces === undefined) en.bounces = (b.chain ?? 1) - 1;
        enter(en, 'brake', en.bounces > 0 ? Math.min(b.recover, 0.12) : b.recover);
      }
      break;
    case 'brake':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until && (en.bounces ?? 0) > 0 && !w.over) {
        // The next lunge of the burst, re-aimed, with a short warning.
        en.bounces = (en.bounces ?? 1) - 1;
        const d = normalize(toX, toY);
        en.dirX = d.x;
        en.dirY = d.y;
        en.facing = d.x >= 0 ? 1 : -1;
        const tg = b.chainTelegraph ?? b.telegraph;
        enter(en, 'warn', tg);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - 2, time: tg / k, aim: Math.atan2(d.y, d.x), aimed: true, color: 'red', source: en.id });
      } else if (en.t >= en.until) {
        en.bounces = undefined;
        enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]) / k);
      }
      break;
    default:
      enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]));
  }
  const ox = en.x;
  const oy = en.y;
  slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
}

/** Where a lagging mouse will appear: towards the player, at most `jump` px, never closer than `keep`, on clear floor. */
export function lagSpot(w: World, en: Enemy, b: LaggerBrain): { x: number; y: number } {
  const p = w.player;
  const d = Math.hypot(p.x - en.x, p.y - en.y) || 1;
  const ux = (p.x - en.x) / d;
  const uy = (p.y - en.y) / d;
  let step = Math.min(b.jump, d - b.keep);
  // Already too close: it skips sideways instead.
  let sx = ux;
  let sy = uy;
  if (step < 16) {
    step = b.jump * 0.6;
    const side = en.id % 2 === 0 ? 1 : -1;
    sx = -uy * side;
    sy = ux * side;
  }
  // Nowhere free near there (deep into a block of shelves): it stays where it is, rather than
  // turning up inside it or far beyond its jump.
  const spot = freeSpot(w, en.x + sx * step, en.y + sy * step, en.def.footRadius + 2, { x: en.x, y: en.y });
  if (Math.hypot(spot.x - en.x, spot.y - en.y) > b.jump * 1.25) return { x: en.x, y: en.y };
  // Never on top of the player.
  if (Math.hypot(spot.x - p.x, spot.y - p.y) < b.keep * 0.75) return { x: en.x, y: en.y };
  return spot;
}

function updateLagger(w: World, en: Enemy, b: LaggerBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  en.t += DT;
  switch (en.state) {
    case 'walk': {
      // After the player, weaving; within `keep` it circles instead of walking into it.
      const close = Math.hypot(toX, toY) < b.keep;
      const weave = close ? (en.id % 2 === 0 ? 4 : -4) : Math.sin(w.tick / 11 + en.id) * 0.4;
      const dir = normalize(toX - toY * weave, toY + toX * weave);
      approach(en, dir.x * b.walkSpeed, dir.y * b.walkSpeed, KNOCK_FRICTION);
      if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
      if (en.t >= en.until && !w.over) {
        // No signal: it freezes, and the spot where it will turn up is marked.
        en.dest = lagSpot(w, en, b);
        enter(en, 'warn', b.freeze);
        w.events.push({ type: 'telegraph', x: en.dest.x, y: en.dest.y - b.muzzleY, time: b.freeze, aim: 0, aimed: false, color: 'red', source: en.id });
      }
      break;
    }
    case 'warn':
      approach(en, 0, 0, KNOCK_FRICTION * 2);
      if (en.t >= en.until) {
        // The signal comes back: it is suddenly where the cursor was, and clicks.
        const to = en.dest ?? { x: en.x, y: en.y };
        w.events.push({ type: 'lagJump', x: en.x, y: en.y, tx: to.x, ty: to.y, source: en.id });
        en.x = to.x;
        en.y = to.y;
        en.vx = 0;
        en.vy = 0;
        delete en.dest;
        if (Math.abs(p.x - en.x) > 2) en.facing = p.x > en.x ? 1 : -1;
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - en.y, p.x - en.x), { telegraph: 0, source: en.id, by: en.def.id, height: mh });
        enter(en, 'brake', b.recover);
      }
      break;
    case 'brake':
      approach(en, 0, 0, KNOCK_FRICTION);
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
      break;
    default:
      enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
  }
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/** Whether a webcam has the player in view: close enough and nothing (wall or prop) in between. */
export function watcherSees(w: World, en: Enemy, b: WatcherBrain): boolean {
  const p = w.player;
  const d = Math.hypot(p.x - en.x, p.y - en.y);
  if (d > b.range || w.over) return false;
  const n = Math.max(1, Math.ceil(d / 6));
  // The last few px are the player's own feet: they never block the view.
  for (let i = 1; i < n; i++) {
    const k = i / n;
    if (!isClear(w, en.x + (p.x - en.x) * k, en.y + (p.y - en.y) * k, 1)) return false;
  }
  return true;
}

/**
 * «Compartiendo pantalla»: every other enemy in the room stops waiting and attacks as soon as it
 * can (its wait ends now), and for a while its waits run faster. Webcams do not set each other
 * off, and bait still lying in wait stays bait. Returns the ids of those it told.
 */
function shareScreen(w: World, en: Enemy, b: WatcherBrain): number[] {
  const told: number[] = [];
  for (const o of w.enemies) {
    if (o === en || o.state === 'dying' || o.state === 'lurk') continue;
    const k = o.def.brain.kind;
    if (k === 'watcher' || k === 'boss') continue;
    if ((o.state === 'walk' || o.state === 'idle') && Number.isFinite(o.until) && o.t < o.until) o.t = o.until;
    o.rush = { t: b.rush.time, scale: b.rush.scale };
    told.push(o.id);
  }
  return told;
}

function updateWatcher(w: World, en: Enemy, b: WatcherBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  en.t += DT;
  if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'walk': {
      // Keeps its distance, sidestepping when it backs off (like the walking turrets).
      const d = Math.hypot(toX, toY) || 1;
      const sign = d > b.keep + 24 ? 1 : d < b.keep - 24 ? -1 : 0;
      const side = sign < 0 ? (en.phase >= 0 ? 0.8 : -0.8) : 0;
      const mx = (toX / d) * sign - (toY / d) * side;
      const my = (toY / d) * sign + (toX / d) * side;
      const ml = Math.hypot(mx, my) || 1;
      if (b.shy) {
        // Only when you are not looking (M14b (h9b)): then it sneaks round behind your back.
        const at = Math.atan2(en.y - p.y, en.x - p.x);
        let off = Math.abs(at - p.aim) % (Math.PI * 2);
        if (off > Math.PI) off = Math.PI * 2 - off;
        if (off > (b.shy.cone * Math.PI) / 180) {
          const gx = p.x - Math.cos(p.aim) * b.keep - en.x;
          const gy = p.y - Math.sin(p.aim) * b.keep - en.y;
          const gl = Math.hypot(gx, gy);
          if (gl > 6) {
            walkX = (gx / gl) * b.shy.speed;
            walkY = (gy / gl) * b.shy.speed;
          }
        }
      } else if (sign !== 0) {
        walkX = (mx / ml) * b.walkSpeed;
        walkY = (my / ml) * b.walkSpeed;
      }
      if (en.t >= en.until && watcherSees(w, en, b)) {
        // Recording: the red light comes on and the line of sight follows you.
        enter(en, 'warn', b.focus);
        en.dirX = toX / d;
        en.dirY = toY / d;
        w.events.push({ type: 'recStart', x: en.x, y: en.y - b.muzzleY, source: en.id });
      }
      break;
    }
    case 'warn': {
      const d = Math.hypot(toX, toY) || 1;
      en.dirX = toX / d;
      en.dirY = toY / d;
      if (!watcherSees(w, en, b)) {
        // Hidden behind something: the recording is lost, and it has to start again later.
        w.events.push({ type: 'recLost', x: en.x, y: en.y - b.muzzleY, source: en.id });
        enter(en, 'walk', b.cooldown[0] * 0.5);
      } else if (en.t >= en.until) {
        const told = shareScreen(w, en, b);
        w.events.push({ type: 'alert', x: en.x, y: en.y - b.muzzleY, told, source: en.id });
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), toX), { telegraph: 0, source: en.id, by: en.def.id, height: mh });
        enter(en, 'brake', b.recover);
      }
      break;
    }
    case 'brake':
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]));
      break;
    default:
      enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]));
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
    if ((hit.hitX || hit.hitY) && Math.hypot(en.x - ox, en.y - oy) < b.walkSpeed * DT * 0.3) en.phase = en.phase >= 0 ? -1 : 1;
  }
}

function updateMimic(w: World, en: Enemy, b: MimicBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - en.y;
  const dist = Math.hypot(toX, toY);
  en.t += DT;
  switch (en.state) {
    case 'lurk':
      // Just a charger on the floor... until you come close, shoot it, it tires of waiting or it is
      // only bait is left in the room (no other kind of enemy standing). `until` is its patience (drawn the first time it waits) and
      // `phase` counts the time it has been left on its own.
      if (!Number.isFinite(en.until)) en.until = w.rng.range(b.patience[0], b.patience[1]);
      if (w.enemies.some((o) => o.def.brain.kind !== 'mimic' && o.state !== 'dying')) en.phase = 0;
      else en.phase += DT;
      if ((dist < b.wake || en.t >= en.until || en.phase >= b.alone) && !w.over || en.damageTaken > 0) {
        enter(en, 'reveal', b.reveal);
        if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
        w.events.push({ type: 'reveal', x: en.x, y: en.y - b.muzzleY, source: en.id });
      }
      break;
    case 'reveal':
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]) * 0.5);
      break;
    case 'walk': {
      const dir = normalize(toX, toY);
      approach(en, dir.x * b.walkSpeed, dir.y * b.walkSpeed, KNOCK_FRICTION);
      if (Math.abs(toX) > 2) en.facing = toX > 0 ? 1 : -1;
      if (en.t >= en.until && dist < b.range && !w.over) {
        // It stops, crackles and lets go a shock all round itself.
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(toY, toX), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
        enter(en, 'fire', b.telegraph + patternDuration(def));
      }
      break;
    }
    case 'fire':
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]));
      break;
    default:
      enter(en, 'walk', b.cooldown[0]);
  }
  if (en.state !== 'walk') approach(en, 0, 0, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

function updateTurret(w: World, en: Enemy, b: TurretBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - HAND_HEIGHT - (en.y - b.muzzleY);
  const dist = Math.hypot(toX, toY);
  en.t += DT;
  if (Math.abs(toX) > 2 && en.state !== 'fire' && en.state !== 'jam') en.facing = toX > 0 ? 1 : -1;
  let walkX = 0;
  let walkY = 0;
  if (en.state === 'off') {
    // Still switching on: it cannot attack yet.
    if (en.t >= en.until) {
      enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]) * 0.5);
      w.events.push({ type: 'switchOn', x: en.x, y: en.y - b.muzzleY, source: en.id });
    }
  } else if (en.state === 'idle' && en.t >= en.until && dist < b.range) {
    const def = PATTERNS[b.pattern];
    if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
    const mh = muzzleHeight(w, en, b.muzzleY);
    firePattern(w, def, en.x, en.y - mh, Math.atan2(toY + b.muzzleY - mh, toX), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
    enter(en, 'fire', b.telegraph + patternDuration(def));
    // A printer counts its volleys down to the next jam (the count is only drawn if it jams).
    if (b.jam) en.volleys = (en.volleys ?? w.rng.int(b.jam.after[0], b.jam.after[1])) - 1;
  } else if (en.state === 'fire' && en.t >= en.until) {
    if (b.jam && en.volleys !== undefined && en.volleys <= 0) {
      // Paper jam (once the last invoice is out): it stands there shaking, harmless, until it clears it.
      if (!w.emitters.some((e) => e.source === en.id)) {
        en.volleys = undefined;
        enter(en, 'jam', b.jam.time);
        w.events.push({ type: 'jam', x: en.x, y: en.y - b.muzzleY, source: en.id });
      }
    } else enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
  } else if (en.state === 'jam' && en.t >= en.until && b.jam) {
    // The jam clears with a bang: everything stuck inside comes out at once.
    const def = PATTERNS[b.jam.pattern];
    if (!def) throw new Error(`Unknown pattern ${b.jam.pattern}`);
    const mh = muzzleHeight(w, en, b.muzzleY);
    firePattern(w, def, en.x, en.y - mh, Math.atan2(toY + b.muzzleY - mh, toX), { telegraph: b.jam.telegraph, source: en.id, by: en.def.id, height: mh });
    enter(en, 'fire', b.jam.telegraph + patternDuration(def));
  }
  if (b.walk && en.state === 'idle') {
    // Keeps its distance: closer than `keep` it backs off, farther it comes closer, in between it
    // stays. Backing off it also sidesteps, so it slides along walls instead of getting cornered.
    const d = Math.hypot(p.x - en.x, p.y - en.y) || 1;
    const ux = (p.x - en.x) / d;
    const uy = (p.y - en.y) / d;
    const sign = d > b.walk.keep + 24 ? 1 : d < b.walk.keep - 24 ? -1 : 0;
    const side = sign < 0 ? (en.phase >= 0 ? 0.8 : -0.8) : 0;
    const mx = ux * sign - uy * side;
    const my = uy * sign + ux * side;
    const ml = Math.hypot(mx, my) || 1;
    walkX = sign !== 0 ? (mx / ml) * b.walk.speed : 0;
    walkY = sign !== 0 ? (my / ml) * b.walk.speed : 0;
  }
  if (b.mirror && en.state === 'idle') {
    // Your reflection in its glass door (M14b (h9c)): it goes to the mirror image of where you
    // are, across the middle of the room.
    const gx = w.room.w - p.x - en.x;
    const gy = w.room.h - p.y - en.y;
    const gl = Math.hypot(gx, gy);
    if (gl > 4) {
      const k = Math.min(1, gl / 24);
      walkX = (gx / gl) * b.mirror.speed * k;
      walkY = (gy / gl) * b.mirror.speed * k;
    }
  }
  if (b.carriage && en.state === 'idle') {
    // Side to side on its rail, like a print head (M14b (h9b)).
    if (en.phase === 0) en.phase = w.rng.chance(0.5) ? 1 : -1;
    walkX = en.phase * b.carriage.speed;
    walkY = 0;
  }
  if (b.drift && en.state !== 'off') {
    // Always drifting in a slanted line (M14b (h9a)), also while it warns and fires.
    if (Math.abs(en.dirX) < 0.3 || Math.abs(en.dirY) < 0.3) {
      // (Not set yet, or knocked straight: a fresh slanted heading.)
      const a = w.rng.range(0, Math.PI * 2);
      const d = slanted(Math.cos(a), Math.sin(a), 0.4);
      en.dirX = d.x;
      en.dirY = d.y;
    }
    walkX = en.dirX * b.drift.speed;
    walkY = en.dirY * b.drift.speed;
  }
  // Bullets and bumps may still nudge it if its data allows.
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
    // Stuck against something while walking: sidestep the other way next time.
    if (b.walk && (hit.hitX || hit.hitY) && Math.hypot(en.x - ox, en.y - oy) < b.walk.speed * DT * 0.3) en.phase = en.phase >= 0 ? -1 : 1;
    // A print head turns back at the end of its rail.
    if (b.carriage && hit.hitX) en.phase = en.phase >= 0 ? -1 : 1;
    // A drifter bounces off what it hits, like a ball.
    if (b.drift) {
      if (hit.hitX) en.dirX = -en.dirX;
      if (hit.hitY) en.dirY = -en.dirY;
    }
  }
}

/**
 * Where a blinker switches back on: `hop` px from the player, on clear floor, preferring spots away
 * from where the player is aiming (never where you look for it) and not on top of the player.
 */
export function blinkSpot(w: World, en: Enemy, b: BlinkerBrain): { x: number; y: number } {
  const p = w.player;
  let best: { x: number; y: number } | null = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 14; i++) {
    const a = w.rng.range(0, Math.PI * 2);
    const d = w.rng.range(b.hop[0], b.hop[1]);
    const x = p.x + Math.cos(a) * d;
    const y = p.y + Math.sin(a) * d * 0.8;
    if (!isClear(w, x, y, en.def.footRadius + 1)) continue;
    // Angle away from the aim (0 in the crosshair, 1 right behind), and a little spread from where it was.
    let off = Math.abs(a - p.aim) % (Math.PI * 2);
    if (off > Math.PI) off = Math.PI * 2 - off;
    const score = off / Math.PI + Math.min(1, Math.hypot(x - en.x, y - en.y) / 120) * 0.4 + w.rng.range(0, 0.3);
    if (score > bestScore) {
      bestScore = score;
      best = { x, y };
    }
  }
  return best ?? { x: en.x, y: en.y };
}

function startBlink(w: World, en: Enemy, b: BlinkerBrain): void {
  // Anything it was about to fire goes with it.
  w.emitters = w.emitters.filter((e) => e.source !== en.id || e.t >= 0);
  en.dest = blinkSpot(w, en, b);
  enter(en, 'blink', b.vanish);
  en.blinkCd = b.hitBlinkCooldown;
  w.events.push({ type: 'blinkOut', x: en.x, y: en.y, tx: en.dest.x, ty: en.dest.y, source: en.id });
}

function updateBlinker(w: World, en: Enemy, b: BlinkerBrain): void {
  const p = w.player;
  en.t += DT;
  en.blinkCd = Math.max(0, (en.blinkCd ?? 0) - DT);
  const hitNow = en.damageTaken > (en.seenDamage ?? 0);
  en.seenDamage = en.damageTaken;
  const toX = p.x - en.x;
  const toY = p.y - HAND_HEIGHT - (en.y - b.muzzleY);
  if (Math.abs(toX) > 2 && (en.state === 'idle' || en.state === 'fire')) en.facing = toX > 0 ? 1 : -1;
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'idle': {
      // Sidles around the player at about `keep` px, a different way round each.
      const d = Math.hypot(p.x - en.x, p.y - en.y) || 1;
      const ux = (p.x - en.x) / d;
      const uy = (p.y - en.y) / d;
      const radial = d > b.keep + 20 ? 1 : d < b.keep - 20 ? -1 : 0;
      const side = en.id % 2 === 0 ? 0.7 : -0.7;
      const mx = ux * radial - uy * side;
      const my = uy * radial + ux * side;
      const ml = Math.hypot(mx, my) || 1;
      walkX = (mx / ml) * b.walkSpeed;
      walkY = (my / ml) * b.walkSpeed;
      if (hitNow && en.blinkCd <= 0 && !w.over) {
        startBlink(w, en, b);
        break;
      }
      if (en.t >= en.until && Math.hypot(toX, toY) < b.range && !w.over) {
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(toY + b.muzzleY - mh, toX), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
        // A short pose after the last shot, so you can see who fired before it vanishes.
        enter(en, 'fire', b.telegraph + patternDuration(def) + 0.2);
      }
      break;
    }
    case 'fire':
      if (en.t >= en.until) startBlink(w, en, b);
      break;
    case 'blink':
      if (en.t >= en.until) enter(en, 'gone', b.gone);
      break;
    case 'gone':
      if (en.t >= en.until) {
        const dest = en.dest && isClear(w, en.dest.x, en.dest.y, en.def.footRadius) ? en.dest : { x: en.x, y: en.y };
        en.x = dest.x;
        en.y = dest.y;
        en.vx = 0;
        en.vy = 0;
        delete en.dest;
        enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
        en.seenDamage = en.damageTaken;
        w.events.push({ type: 'blinkIn', x: en.x, y: en.y, source: en.id });
      }
      break;
    default:
      enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
  }
  if (en.state === 'gone') return;
  approach(en, walkX, walkY, KNOCK_FRICTION);
  const ox = en.x;
  const oy = en.y;
  slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
}

/** Index of the phase a boss should be in for the life it has left (the last one it qualifies for). */
export function bossPhaseFor(en: Enemy, b: BossBrain): number {
  const left = 1 - en.damageTaken / en.def.hp;
  let k = 0;
  b.phases.forEach((ph, i) => {
    if (left <= ph.from) k = i;
  });
  return k;
}

/** Picks the boss's next attack: weighted, and never the one it just did (if it has others). */
function pickAttack(w: World, attacks: readonly BossAttack[], last: number | undefined, season?: number): number {
  // «Pase de temporada»: only this season's attacks (and those of every season).
  const ok = (i: number): boolean => season === undefined || attacks[i]!.season === undefined || attacks[i]!.season === season;
  let n = 0;
  for (let i = 0; i < attacks.length; i++) if (ok(i)) n++;
  const skip = (i: number): boolean => !ok(i) || (i === last && n > 1);
  let total = 0;
  for (let i = 0; i < attacks.length; i++) if (!skip(i)) total += attacks[i]!.weight;
  let r = w.rng.range(0, total);
  let lastOk = attacks.length - 1;
  for (let i = 0; i < attacks.length; i++) {
    if (skip(i)) continue;
    lastOk = i;
    r -= attacks[i]!.weight;
    if (r < 0) return i;
  }
  return lastOk;
}

/**
 * A boss: shuffles closer if you keep away, then picks an attack of its phase, warns and does it. A
 * pattern comes out of its muzzle; frost is lobbed at the player and around it at the end of the
 * warning. Moving into a new phase is announced (event `bossPhase`).
 */
/** How much faster a boss walks and recovers for the life it has lost (1 at full life, 1 + rage at none). */
export function bossRage(en: Enemy, b: BossBrain): number {
  const lost = Math.min(1, Math.max(0, en.damageTaken / en.def.hp));
  return 1 + b.rage * lost;
}

/** Seconds of warning of the boss's current attack (0 if it has none). */
function bossWarnTime(phase: BossPhase, en: Enemy): number {
  const a = en.attack === undefined ? undefined : phase.attacks[en.attack];
  return a && 'telegraph' in a ? a.telegraph : 0;
}

/**
 * The boss's erratic walk: it circles the player at about `keep` px, in legs of random length; each
 * leg it may turn back the other way, change pace (a stroll or a lurch) and pick a new distance
 * (`keep` ± roam.spread), which it closes or opens as it goes. Returns the velocity it wants.
 */
function bossRoam(w: World, en: Enemy, b: BossBrain, speed: number, keep: number): { x: number; y: number } {
  const p = w.player;
  en.legT = (en.legT ?? 0) - DT;
  if (en.legT <= 0 || en.legSpin === undefined) {
    en.legT = w.rng.range(b.roam.leg[0], b.roam.leg[1]);
    en.legPace = w.rng.range(b.roam.burst[0], b.roam.burst[1]);
    // Mostly it turns back: that is what makes it hard to read. (Less often while it is going
    // round something in its way: then it mostly keeps on round it.)
    en.legSpin = en.legSpin === undefined ? (w.rng.next() < 0.5 ? 1 : -1) : w.rng.next() < (en.hugging ? ROAM_FLIP_HUGGING : ROAM_FLIP) ? -en.legSpin : en.legSpin;
    en.legKeep = keep + w.rng.range(-b.roam.spread, b.roam.spread);
  }
  // Round the player, on a flattened circle (see FLOOR_FLAT).
  const rx = en.x - p.x;
  const ry = (en.y - p.y) / FLOOR_FLAT;
  const r = Math.hypot(rx, ry) || 1;
  const out = Math.max(-1, Math.min(1, ((en.legKeep ?? keep) - r) / 40));
  let vx = (-ry / r) * en.legSpin + (rx / r) * out;
  let vy = ((rx / r) * en.legSpin + (ry / r) * out) * FLOOR_FLAT;
  // Something between it and where it wants to be (the long table): it goes round it, along its
  // edge, instead of pressing against it.
  const r0 = en.def.footRadius;
  const ahead = (x: number, y: number): boolean => {
    const n = Math.hypot(x, y) || 1;
    return isClear(w, en.x + (x / n) * 8, en.y + (y / n) * 8, r0);
  };
  // Only big furniture (over two tiles wide, like the long table): elsewhere bosses walk as they did.
  const bigInWay = (x: number, y: number): boolean => {
    const n = Math.hypot(x, y) || 1;
    const feet = playerFeetBox({ x: en.x + (x / n) * 8, y: en.y + (y / n) * 8 }, r0);
    return w.room.props.some((pr) => pr.box.w > TILE * 2 && overlaps(pr.box, feet));
  };
  en.hugging = false;
  if (!ahead(vx, vy) && bigInWay(vx, vy)) {
    const tx = (-ry / r) * en.legSpin;
    const ty = (rx / r) * en.legSpin * FLOOR_FLAT;
    // Round it, or straight along its edge (whichever way round it is going).
    for (const [hx, hy] of [[tx, ty], [Math.sign(tx), 0], [0, Math.sign(ty)]] as const) {
      if ((hx || hy) && ahead(hx, hy)) {
        vx = hx;
        vy = hy;
        en.hugging = true;
        break;
      }
    }
  }
  const n = Math.hypot(vx, vy) || 1;
  const v = speed * (en.legPace ?? 1);
  vx = (vx / n) * v;
  vy = (vy / n) * v;
  // Into a wall: it turns back at once rather than grinding against it.
  if (!isClear(w, en.x + vx * 0.25, en.y + vy * 0.25, r0)) {
    en.legSpin = -en.legSpin;
    en.legT = Math.min(en.legT, 0.3);
  }
  return { x: vx, y: vy };
}

/**
 * A boss riding the end of its conveyor belt (BossPhase.belt): first straight over to the rail (at
 * `move` times its speed), then up and down along it in legs, like bossRoam (now a stroll, now a
 * lurch, mostly turning back), half of them towards the toaster's height. Returns its velocity.
 */
function railRoam(w: World, en: Enemy, b: BossBrain, speed: number): { x: number; y: number } {
  const rail = en.rail!;
  const r0 = en.def.footRadius;
  const dx = rail.x - en.x;
  if (!rail.on) {
    if (Math.abs(dx) <= RAIL_SNAP) {
      rail.on = true;
      delete en.legSpin;
      // A breath before the first fan: it has only just got there.
      en.until = Math.max(en.until, en.t * bossRage(en, b) + RAIL_SETTLE);
    } else {
      const v = speed * rail.move;
      // Something in the way (a crate in a corner): round it, up or down towards the middle.
      if (!isClear(w, en.x + Math.sign(dx) * 10, en.y, r0)) return { x: 0, y: (en.y < w.room.h / 2 ? 1 : -1) * v };
      return { x: Math.sign(dx) * v, y: 0 };
    }
  }
  en.legT = (en.legT ?? 0) - DT;
  if (en.legT <= 0 || en.legSpin === undefined) {
    en.legT = w.rng.range(b.roam.leg[0], b.roam.leg[1]);
    en.legPace = w.rng.range(b.roam.burst[0], b.roam.burst[1]);
    const towards = w.player.y >= en.y ? 1 : -1;
    en.legSpin = w.rng.next() < 0.5 ? towards : en.legSpin === undefined ? -towards : w.rng.next() < ROAM_FLIP ? -en.legSpin : en.legSpin;
  }
  let vy = en.legSpin * speed * (en.legPace ?? 1);
  // The end of the rail (a wall, a crate): back the other way at once.
  if (!isClear(w, en.x, en.y + vy * 0.25, r0)) {
    en.legSpin = -en.legSpin;
    en.legT = Math.min(en.legT, 0.3);
    vy = -vy;
  }
  // Kept on its line: pushed off it, it steps back.
  const vx = Math.max(-speed, Math.min(speed, dx * 4));
  return { x: vx, y: vy };
}

/** px between a boss on its rail and the wall at the end of its belt, and how near the rail counts as on it. */
const RAIL_GAP = 4;
const RAIL_SNAP = 6;
/** Seconds it waits on its rail before the first attack. */
const RAIL_SETTLE = 0.6;

/** Share of a boss's legs that go back the way it came (and while it goes round something in its way). */
const ROAM_FLIP = 0.6;
const ROAM_FLIP_HUGGING = 0.3;
/**
 * Vertical squash of a boss's circle round the player: the screen is wider than tall, and the
 * camera has to show the toaster and the whole boss at once (see frameAxis in render/camera.ts).
 */
const FLOOR_FLAT = 0.5;

/** Size of a zone of the voice menu (tools/sprites/centralita.ts ZONE_W × ZONE_H), and the gap between two. */
export const MENU_ZONE_W = 72;
export const MENU_ZONE_H = 48;
const MENU_ZONE_GAP = 14;
/** Seconds the zones stay up after the rain, red, so the hit reads. */
const MENU_LINGER = 0.45;
/** Spots of a wrong zone the rain falls on keep this far in from its edge (px). */
const MENU_RAIN_INSET = 9;

/**
 * Lays out a voice menu (BossMenuAttack): its zones in a line, across or down, through the player
 * (who is in one of them, any), kept inside the room; and the one to press.
 */
function layMenu(w: World, a: BossMenuAttack): NonNullable<Enemy['menu']> {
  const p = w.player;
  const room = w.room;
  const n = a.zones;
  const across = w.rng.next() < 0.6;
  const sx = across ? MENU_ZONE_W + MENU_ZONE_GAP : 0;
  const sy = across ? 0 : MENU_ZONE_H + MENU_ZONE_GAP;
  const j = w.rng.int(0, n - 1);
  const minX = TILE + MENU_ZONE_W / 2 + 2;
  const maxX = room.w - TILE - MENU_ZONE_W / 2 - 2 - (n - 1) * sx;
  const minY = BACK_WALL_ROWS * TILE + MENU_ZONE_H / 2 + 2;
  const maxY = room.h - TILE - MENU_ZONE_H / 2 - 2 - (n - 1) * sy;
  const x0 = Math.max(minX, Math.min(maxX, p.x - j * sx));
  const y0 = Math.max(minY, Math.min(maxY, p.y - j * sy));
  const zones = Array.from({ length: n }, (_, i) => ({ x: Math.round(x0 + i * sx), y: Math.round(y0 + i * sy), n: i + 1 }));
  let good = w.rng.int(0, n - 1);
  if (w.rng.next() < a.far) {
    // The farthest from the player (it is never that easy).
    good = 0;
    zones.forEach((z, i) => {
      if (Math.hypot(z.x - p.x, z.y - p.y) > Math.hypot(zones[good]!.x - p.x, zones[good]!.y - p.y)) good = i;
    });
  }
  return { zones, good, said: false, saidAt: Infinity, t: 0, rainAt: Infinity, rained: false };
}

/** Whether floor point (x, y) is inside zone `z` of a voice menu. */
export function inMenuZone(z: { x: number; y: number }, x: number, y: number): boolean {
  return Math.abs(x - z.x) <= MENU_ZONE_W / 2 && Math.abs(y - z.y) <= MENU_ZONE_H / 2;
}

/** The voice menu's clock: the rain on the wrong zones when it is due, and the zones gone a moment after. */
function updateMenu(w: World, en: Enemy, phase: BossPhase): void {
  const m = en.menu!;
  m.t += DT;
  if (m.said && !m.rained && m.t >= m.rainAt) {
    m.rained = true;
    const a = phase.attacks.find((x): x is BossMenuAttack => x.kind === 'menu');
    const def = a ? PATTERNS[a.pattern] : undefined;
    if (a && !def) throw new Error(`Unknown pattern ${a.pattern}`);
    const wrong = m.zones.filter((_, i) => i !== m.good);
    if (a && def) {
      // Spread evenly over each zone (a grid, a little jittered), so there is no dry spot in it.
      const cols = Math.ceil(Math.sqrt(a.drops * (MENU_ZONE_W / MENU_ZONE_H)));
      const rows = Math.ceil(a.drops / cols);
      const cw = (MENU_ZONE_W - MENU_RAIN_INSET * 2) / cols;
      const ch = (MENU_ZONE_H - MENU_RAIN_INSET * 2) / rows;
      for (const z of wrong) {
        for (let k = 0; k < a.drops; k++) {
          const c = k % cols;
          const r = Math.floor(k / cols);
          const x = z.x - MENU_ZONE_W / 2 + MENU_RAIN_INSET + (c + w.rng.range(0.25, 0.75)) * cw;
          const y = z.y - MENU_ZONE_H / 2 + MENU_RAIN_INSET + (r + w.rng.range(0.25, 0.75)) * ch;
          firePattern(w, def, x, y - DROP_HEIGHT, w.rng.range(0, Math.PI * 2), { source: en.id, by: en.def.id, height: DROP_HEIGHT });
        }
      }
    }
    w.events.push({ type: 'menuRain', boss: en.id, zones: wrong.map((z) => ({ x: z.x, y: z.y })) });
  }
  if (m.rained && m.t >= m.rainAt + MENU_LINGER) delete en.menu;
}

/**
 * The department (1-4) floor point (x, y) is in: the room's quarters, 1 top left, 2 top right,
 * 3 bottom left, 4 bottom right (the Centralita's room, BossPhase.transfer).
 */
export function departmentOf(room: { w: number; rows: number }, x: number, y: number): number {
  const midY = (BACK_WALL_ROWS * TILE + (room.rows - 1) * TILE) / 2;
  return (y < midY ? 1 : 3) + (x < room.w / 2 ? 0 : 1);
}

/** The floor of department `d` (1-4), inside the walls. */
export function departmentRect(room: { w: number; rows: number }, d: number): Rect {
  const top = BACK_WALL_ROWS * TILE;
  const bottom = (room.rows - 1) * TILE;
  const midY = (top + bottom) / 2;
  const midX = room.w / 2;
  const left = d === 1 || d === 3;
  const up = d <= 2;
  return { x: left ? TILE : midX, y: up ? top : midY, w: left ? midX - TILE : room.w - TILE - midX, h: up ? midY - top : bottom - midY };
}

/** Free floor this far from the toaster's new spot at least, for the boss (px). */
const TRANSFER_CLEAR_OF_BOSS = 90;

/**
 * «Le paso con el departamento» (BossPhase.transfer): every `every` s a bell rings and a circle
 * marks the toaster; `mark` s later it is somewhere else: a free spot in another department, away
 * from the boss, with `grace` s of invulnerability; and that department's welcome is fired at it
 * from the department's far corner. A roll does not get it out of the call: it is cut short.
 */
function updateTransfer(w: World, en: Enemy, phase: BossPhase, tr: NonNullable<BossPhase['transfer']>): void {
  const p = w.player;
  if (en.deptMark) {
    en.deptMark.t += DT;
    if (en.deptMark.t < en.deptMark.until) return;
    delete en.deptMark;
    const from = departmentOf(w.room, p.x, p.y);
    const boss = departmentOf(w.room, en.x, en.y);
    const others = [1, 2, 3, 4].filter((d) => d !== from);
    // Never into the boss's lap, if it can be helped.
    const away = others.filter((d) => d !== boss);
    const dept = w.rng.pick(away.length > 0 ? away : others);
    const r = departmentRect(w.room, dept);
    const fr = p.def.footRadius + 2;
    let spot = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    for (let tries = 0; tries < 12; tries++) {
      const x = r.x + r.w * w.rng.range(0.25, 0.75);
      const y = r.y + r.h * w.rng.range(0.3, 0.75);
      if (isClear(w, x, y, fr) && Math.hypot(x - en.x, y - en.y) > TRANSFER_CLEAR_OF_BOSS) {
        spot = { x, y };
        break;
      }
    }
    if (!isClear(w, spot.x, spot.y, fr)) spot = freeSpot(w, spot.x, spot.y, fr);
    const fromX = p.x;
    const fromY = p.y;
    p.x = spot.x;
    p.y = spot.y;
    p.vx = 0;
    p.vy = 0;
    if (isRolling(p)) {
      p.rollT = -1;
      p.rollCooldown = p.def.rollCooldown;
    }
    p.invulnerable = Math.max(p.invulnerable, tr.grace);
    w.events.push({ type: 'deptTransfer', boss: en.id, fromX, fromY, x: p.x, y: p.y, dept });
    // What waits in that department, from its corner farthest from where the toaster landed.
    const welcome = tr.welcome[dept - 1];
    const def = welcome ? PATTERNS[welcome] : undefined;
    if (welcome && !def) throw new Error(`Unknown pattern ${welcome}`);
    if (def) {
      const cx = p.x < r.x + r.w / 2 ? r.x + r.w - TILE : r.x + TILE;
      const cy = p.y < r.y + r.h / 2 ? r.y + r.h - TILE / 2 : r.y + TILE;
      const at = freeSpot(w, cx, cy, 4);
      firePattern(w, def, at.x, at.y - DROP_HEIGHT * 4, Math.atan2(p.y - HAND_HEIGHT - (at.y - DROP_HEIGHT * 4), p.x - at.x), {
        telegraph: tr.warn,
        source: en.id,
        by: en.def.id,
        height: DROP_HEIGHT * 4,
      });
    }
    en.deptCount = (en.deptCount ?? 0) + 1;
    // Its reception phone, again, if it is down (BossPhase.summon).
    if (phase.summon && tr.recall && en.deptCount % tr.recall === 0) summonHelpers(w, en, phase.summon);
    return;
  }
  en.deptT = (en.deptT ?? 0) + DT;
  // The bell waits for the voice menu to be over: two things to read at once is one too many.
  if (en.deptT >= tr.every && !en.menu) {
    en.deptT = 0;
    en.deptMark = { t: 0, until: tr.mark };
    w.events.push({ type: 'deptMark', boss: en.id, x: p.x, y: p.y });
  }
}

function updateBoss(w: World, en: Enemy, b: BossBrain): void {
  const p = w.player;
  en.t += DT;
  const phaseIdx = bossPhaseFor(en, b);
  if (en.bossPhase === undefined || phaseIdx > en.bossPhase) {
    const announced = en.bossPhase !== undefined || phaseIdx > 0;
    en.bossPhase = phaseIdx;
    delete en.attack;
    const next = b.phases[phaseIdx]!;
    // A reboot takes its relays down with it.
    if (next.reboot) dropRelays(w, en);
    if (announced) {
      // Between phases it stops, shrugs bullets off and clears the screen: a breath (or a whole
      // reboot), and the phase's name, before the new attacks.
      const ev: SimEvent = { type: 'bossPhase', boss: en.id, phase: phaseIdx, name: next.name };
      if (next.reboot) ev.reboot = next.reboot.line;
      if (next.line) ev.line = next.line;
      if (next.stage !== undefined) ev.stage = next.stage;
      w.events.push(ev);
      clearEnemyFire(w);
      delete en.runTo;
      delete en.runVia;
      enter(en, 'roar', next.reboot?.time ?? BOSS_PHASE_BREAK);
      if (next.shed) shedShell(w, en, next.shed.prop);
      if (next.summon) summonHelpers(w, en, next.summon);
      // Tearing the plugs out: they fly off all round as the break ends.
      if (next.opening) {
        const def = PATTERNS[next.opening];
        if (!def) throw new Error(`Unknown pattern ${next.opening}`);
        const mh = muzzleHeight(w, en, b.muzzle.y);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - en.x), { telegraph: BOSS_PHASE_BREAK, source: en.id, by: en.def.id, height: mh });
      }
      // «Reestructuración»: the clap of the phase change moves the partitions at once.
      if (next.restructure && restructureRoom(w, next.restructure.prop, next.restructure.warn, next.restructure.time) > 0) {
        w.events.push({ type: 'clap', boss: en.id, x: en.x, y: en.y });
      }
    }
    en.restructT = 0;
    en.relayT = 0;
    // A new phase cuts the voice menu short (its zones go with the bullets on screen), and the
    // transfers start counting from now.
    delete en.menu;
    delete en.deptMark;
    if (next.transfer) {
      en.deptT = next.transfer.every - next.transfer.first;
      en.deptCount = 0;
    }
    if (next.mute) en.muteIn = w.rng.range(next.mute.every[0], next.mute.every[1]);
    // Its seasons start over (the first one as the break ends).
    delete en.season;
    delete en.seasonT;
    if (next.relays && next.relays.count > 0) plantRelays(w, en, next.relays.id, next.relays.count);
    // «Despiece»: the floor starts running towards the far wall, and over there it goes.
    if (next.belt && !w.conveyors.some((c) => c.source === en.id)) {
      const c = layFloorBelt(w, en, next.belt.speed, next.belt.bite);
      const end = c.dirX > 0 ? c.x + c.w : c.x;
      en.rail = { x: end - c.dirX * (en.def.footRadius + RAIL_GAP), move: next.belt.move, on: false };
      delete en.legSpin;
    }
    // «Control de calidad»: the crates start coming down, from the far wall in.
    if (next.crates && !en.crates) en.crates = startCrates(w, en, next.crates);
  }
  const phase = b.phases[en.bossPhase]!;
  const rage = bossRage(en, b);
  // Without relays left, it plants a new one now and then (if the phase says so).
  if (phase.relays?.every && en.state !== 'roar' && !w.over) {
    if (relaysOf(w, en).length > 0) en.relayT = 0;
    else if ((en.relayT = (en.relayT ?? 0) + DT) >= phase.relays.every) {
      en.relayT = 0;
      plantRelays(w, en, phase.relays.id, 1);
    }
  }
  // And again every so often: between attacks it claps, and the partitions move.
  const rs = phase.restructure;
  if (rs && en.state !== 'roar' && !w.over) {
    en.restructT = (en.restructT ?? 0) + DT;
    if (en.restructT >= rs.every && en.state === 'idle') {
      en.restructT = 0;
      if (restructureRoom(w, rs.prop, rs.warn, rs.time) > 0) {
        w.events.push({ type: 'clap', boss: en.id, x: en.x, y: en.y });
        enter(en, 'roar', BOSS_CLAP);
      }
    }
  }
  // The crates keep coming down (BossPhase.crates), whatever it is doing, but not in the break.
  if (phase.crates && en.crates && en.state !== 'roar') tickCrates(w, en, phase.crates, en.crates);
  // The silence comes round (BossPhase.mute): counted all the time, it falls between attacks.
  if (phase.mute && en.muteIn !== undefined && en.state !== 'roar' && en.state !== 'stun') en.muteIn -= DT;
  // «Pase de temporada»: a new season every so often (not in the break), announced.
  if (phase.seasons && en.state !== 'roar' && !w.over) {
    en.seasonT = (en.seasonT ?? phase.seasons.every) + DT;
    if (en.seasonT >= phase.seasons.every) {
      en.seasonT = 0;
      en.season = ((en.season ?? -1) + 1) % phase.seasons.names.length;
      w.events.push({ type: 'season', boss: en.id, x: en.x, y: en.y, index: en.season, name: phase.seasons.names[en.season]! });
    }
  }
  // The voice menu goes on by itself once it is out: the rain falls when it is due.
  if (en.menu) updateMenu(w, en, phase);
  // «Le paso con el departamento»: the bell every so often, and off the toaster goes.
  if (phase.transfer && en.state !== 'roar' && !w.over) updateTransfer(w, en, phase, phase.transfer);
  // «Cambio de punto de acceso»: now and then it hops over to one of its relays.
  if (b.handoff) updateHandoff(w, en, b.handoff, rage);
  const toX = p.x - en.x;
  if (Math.abs(toX) > 4 && en.state !== 'fire') en.facing = toX > 0 ? 1 : -1;
  const mx = en.x + b.muzzle.x * en.facing;
  const mh = muzzleHeight(w, en, b.muzzle.y);
  let walkX = 0;
  let walkY = 0;
  // Skating (BossBrain.glide): walkX/walkY are then its velocity itself, not one to approach.
  let glided = false;
  switch (en.state) {
    case 'idle': {
      // Never still between attacks: from spot to spot round the player, now strolling, now
      // lurching, and quicker the less life it has.
      // (The Nevera skates instead, pushing off now and then; the Lavadora swings corner to corner.)
      if (en.rail) ({ x: walkX, y: walkY } = railRoam(w, en, b, phase.walkSpeed * rage));
      else if (b.glide) {
        ({ x: walkX, y: walkY } = glideWalk(w, en, b, b.glide, phase.walkSpeed * rage, phase.keep, true));
        glided = true;
      } else if (b.hover) ({ x: walkX, y: walkY } = hoverWalk(w, en, b.hover, phase.walkSpeed * rage));
      else ({ x: walkX, y: walkY } = waddleWalk(w, en, b, phase, bossRoam(w, en, b, phase.walkSpeed * rage, phase.keep)));
      // Gone quiet: its lights blank, it stops dead and takes more (BossPhase.mute). Only between
      // attacks, so a sweep is never cut short and the silence is never under a hail of bullets.
      if (phase.mute && en.muteIn !== undefined && en.muteIn <= 0 && !w.over) {
        en.muteIn = w.rng.range(phase.mute.every[0], phase.mute.every[1]);
        const ev: SimEvent = { type: 'mute', boss: en.id, x: en.x, y: en.y, time: phase.mute.time };
        if (phase.mute.line) ev.line = phase.mute.line;
        w.events.push(ev);
        enter(en, 'stun', phase.mute.time);
        walkX = 0;
        walkY = 0;
        glided = false;
        break;
      }
      // On its way over to the end of the belt it attacks nothing.
      if (en.t * rage >= en.until && !w.over && (!en.rail || en.rail.on)) {
        const i = phase.cycle ? ((en.attack ?? -1) + 1) % phase.attacks.length : pickAttack(w, phase.attacks, en.attack, phase.seasons ? en.season : undefined);
        en.attack = i;
        const a = phase.attacks[i]!;
        const aim = Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - mx);
        if (a.kind === 'pattern') {
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          const em = firePattern(w, def, mx, en.y - mh, aim, { telegraph: a.telegraph, source: en.id, by: en.def.id, height: mh });
          em.follow = { id: en.id, dx: mx - en.x, dy: -mh };
          enter(en, 'fire', a.telegraph + patternDuration(def) + 0.25);
          // «Diagnóstico»: the scanner beam goes over the toaster while it warns, and the verdict comes up.
          if (a.scan) w.events.push({ type: 'scan', boss: en.id, time: a.telegraph, line: a.scan });
          // Its relays send the same thing out from where they stand.
          const relayed = a.relay ? PATTERNS[a.relay] : undefined;
          if (a.relay && !relayed) throw new Error(`Unknown pattern ${a.relay}`);
          if (relayed) {
            for (const r of relaysOf(w, en)) {
              if (r.def.brain.kind !== 'relay') continue;
              const rh = muzzleHeight(w, r, r.def.brain.muzzleY);
              firePattern(w, relayed, r.x, r.y - rh, Math.atan2(p.y - HAND_HEIGHT - (r.y - rh), p.x - r.x), { telegraph: a.telegraph, source: r.id, by: r.def.id, height: rh });
            }
          }
        } else if (a.kind === 'drop') {
          // Dropped connections: spots on the floor (one under the player) that burst a moment later.
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          for (let k = 0; k < a.count; k++) {
            const ang = w.rng.range(0, Math.PI * 2);
            const dist = k === 0 ? 0 : a.spread * w.rng.range(0.45, 1);
            let tx = p.x + Math.cos(ang) * dist;
            let ty = p.y + Math.sin(ang) * dist * 0.75;
            if (!isClear(w, tx, ty, 4)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, 4));
            firePattern(w, def, tx, ty - DROP_HEIGHT, 0, { telegraph: a.telegraph, source: en.id, by: en.def.id, height: DROP_HEIGHT });
          }
          w.events.push({ type: 'drops', boss: en.id, count: a.count });
          enter(en, 'fire', a.telegraph + patternDuration(def) + 0.4);
        } else if (a.kind === 'stamp') {
          // «Denegado»: square shadows on the floor (one under the player) where the stamp comes down.
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          const spots: Array<{ x: number; y: number }> = [];
          for (let k = 0; k < a.count; k++) {
            let tx = p.x;
            let ty = p.y;
            // The others where the player would step to, never on top of each other.
            for (let tries = 0; k > 0 && tries < 8; tries++) {
              const ang = w.rng.range(0, Math.PI * 2);
              const dist = a.spread * w.rng.range(0.6, 1);
              tx = p.x + Math.cos(ang) * dist;
              ty = p.y + Math.sin(ang) * dist * 0.75;
              if (spots.every((o) => Math.abs(o.x - tx) > a.ink.w * 0.8 || Math.abs(o.y - ty) > a.ink.h * 0.8)) break;
            }
            // The whole square on the floor, not half up a wall.
            tx = Math.max(TILE + a.ink.w / 2, Math.min(w.room.w - TILE - a.ink.w / 2, tx));
            ty = Math.max(TILE * 2 + a.ink.h / 2, Math.min(w.room.h - TILE - a.ink.h / 2, ty));
            if (!isClear(w, tx, ty, 4)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, 4));
            spots.push({ x: tx, y: ty });
            firePattern(w, def, tx, ty - STAMP_LIFT, w.rng.range(0, Math.PI * 2), {
              telegraph: a.telegraph,
              source: en.id,
              by: en.def.id,
              height: STAMP_LIFT,
              mark: 'stamp',
              stamp: { ...a.ink, damage: 1 },
            });
          }
          enter(en, 'fire', a.telegraph + patternDuration(def) + 0.35);
        } else if (a.kind === 'rain') {
          // «Lluvia en columnas»: lanes marked from the back wall down, one over the player.
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          const top = (BACK_WALL_ROWS + 0.25) * TILE;
          const lane = w.room.h - TILE - top;
          for (const x of rainColumns(w, a.cols, a.gap)) {
            firePattern(w, def, x, top, Math.PI / 2, { telegraph: a.telegraph, source: en.id, by: en.def.id, height: RAIN_HEIGHT, mark: 'rain', lane });
          }
          w.events.push({ type: 'rain', boss: en.id, cols: a.cols });
          enter(en, 'fire', a.telegraph + patternDuration(def) + 0.3);
        } else if (a.kind === 'sync') {
          // «Sincronizando…»: it stops to fill its bar; hurting it enough meanwhile breaks it.
          en.syncFrom = en.damageTaken;
          w.events.push({ type: 'sync', boss: en.id, time: a.time });
          enter(en, 'warn', a.time);
        } else if (a.kind === 'menu') {
          // «Su llamada es importante»: the zones light up while it reads the menu out.
          en.menu = layMenu(w, a);
          w.events.push({ type: 'menuZones', boss: en.id, count: a.zones });
          enter(en, 'warn', a.telegraph);
        } else if (a.kind === 'runway') {
          // It strikes a pose (warning by itself, see activeWarnings) before setting off; the lane
          // is picked now, so the warning can show it: first straight up or down onto it, then along it.
          en.runTo = runwayEnd(w, en);
          en.runVia = { x: en.x, y: en.runTo.y };
          en.dirX = en.runTo.x > en.x ? 1 : -1;
          en.dirY = 0;
          enter(en, 'warn', a.telegraph);
        } else {
          // Frost and spit warn by themselves (see activeWarnings): the ring closes on the dispenser
          // (or on the open door).
          enter(en, 'warn', a.telegraph);
          const at = bossWarnSpot(en, b, a);
          const color = a.kind === 'spit' ? 'red' : a.kind === 'frost' && a.sticker ? 'sticker' : 'ice';
          w.events.push({ type: 'telegraph', x: at.x, y: at.y, time: 'telegraph' in a ? a.telegraph : 0, aim, aimed: false, color, source: en.id });
        }
      }
      break;
    }
    case 'warn': {
      const sa = phase.attacks[en.attack ?? 0];
      // «Sincronizando…»: hurt enough while the bar fills, it breaks, and it is left dazed.
      if (sa?.kind === 'sync' && en.damageTaken - (en.syncFrom ?? en.damageTaken) >= sa.cancel) {
        delete en.syncFrom;
        w.events.push({ type: 'syncEnd', boss: en.id, x: en.x, y: en.y, done: false });
        enter(en, 'stun', sa.stun);
        break;
      }
      // End of the frost warning: lob the balls.
      if (en.t >= en.until) {
        const a = phase.attacks[en.attack ?? 0]!;
        if (a.kind === 'frost') {
          for (let k = 0; k < a.count; k++) {
            // The first one lands where the player is; the others around it, where it would dodge to.
            const ang = k === 0 ? 0 : w.rng.range(0, Math.PI * 2);
            const dist = k === 0 ? 0 : a.spread * w.rng.range(0.8, 1.2);
            let tx = p.x + p.vx * 0.25 * (k === 0 ? 1 : 0) + Math.cos(ang) * dist;
            let ty = p.y + p.vy * 0.25 * (k === 0 ? 1 : 0) + Math.sin(ang) * dist * 0.75;
            if (!isClear(w, tx, ty, 4)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, 4));
            const opts = { r: a.radius, life: a.life, slow: a.slow, flight: a.flight * w.rng.range(0.9, 1.1), source: en.id, by: en.def.id, ...(a.sticker ? { sticker: a.sticker } : {}) };
            throwFrost(w, mx, en.y, mh, tx, ty, a.shatter ? { ...opts, shatter: a.shatter } : opts);
          }
        } else if (a.kind === 'spit') {
          // A spray of expired products over where the player is and around it.
          const sx = en.x + a.from.x * en.facing;
          const sh = muzzleHeight(w, en, a.from.y);
          for (let k = 0; k < a.count; k++) {
            const ang = w.rng.range(0, Math.PI * 2);
            const dist = k === 0 ? 0 : a.spread * Math.sqrt(w.rng.next());
            let tx = p.x + Math.cos(ang) * dist;
            let ty = p.y + Math.sin(ang) * dist * 0.75;
            if (!isClear(w, tx, ty, 4)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, 4));
            const product = a.look ? 0 : w.rng.int(0, EXPIRED_PRODUCTS.length - 1);
            const opts = { r: 12, life: 0, slow: 1, flight: a.flight * w.rng.range(0.75, 1.25), shatter: a.burst, product, source: en.id, by: en.def.id };
            throwFrost(w, sx, en.y, sh, tx, ty, a.look ? { ...opts, look: a.look } : opts);
          }
        } else if (a.kind === 'sync') {
          // Synced: everything it was holding goes out all round, at once.
          delete en.syncFrom;
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          firePattern(w, def, mx, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - mx), { source: en.id, by: en.def.id, height: mh });
          w.events.push({ type: 'syncEnd', boss: en.id, x: en.x, y: en.y, done: true });
          enter(en, 'fire', patternDuration(def) + 0.4);
          break;
        } else if (a.kind === 'folders') {
          // «Almacenamiento lleno»: a wall of folders across the way to the player.
          const spots = dropFolders(w, en, a);
          w.events.push({ type: 'folders', boss: en.id, spots });
        } else if (a.kind === 'summon') {
          // «Cajas de botín»: out they go, to its sides and towards the player.
          tossHelpers(w, en, a);
        } else if (a.kind === 'menu') {
          // «Para reclamaciones, pulse 3»: which one; the rain is `wait` s away.
          const m = en.menu;
          if (m) {
            m.said = true;
            m.saidAt = m.t;
            m.rainAt = m.t + a.wait;
            const z = m.zones[m.good]!;
            w.events.push({ type: 'menuOption', boss: en.id, n: z.n, x: en.x, y: en.y });
          }
          enter(en, 'fire', a.wait + 0.5);
          break;
        } else if (a.kind === 'runway') {
          // Off down the catwalk it picked when it struck the pose.
          en.runTo ??= runwayEnd(w, en);
          en.runVia ??= { x: en.x, y: en.runTo.y };
          en.runGap = 0;
          en.runStuck = 0;
          en.facing = en.runTo.x > en.x ? 1 : -1;
          w.events.push({ type: 'runway', boss: en.id, x: en.x, y: en.y });
          enter(en, 'charge', Math.hypot(en.runTo.x - en.x, en.runTo.y - en.y) / a.speed + 1.5);
          break;
        }
        enter(en, 'fire', 0.5);
      }
      break;
    }
    case 'charge': {
      // On the catwalk: straight to the end, a flash on the floor every `gap` px, posing all the way.
      const a = phase.attacks[en.attack ?? 0];
      const to = en.runTo;
      if (!a || a.kind !== 'runway' || !to) {
        enter(en, 'idle', 0.4);
        break;
      }
      const step = a.speed * DT;
      // First onto its lane, then down it.
      if (en.runVia && Math.hypot(en.runVia.x - en.x, en.runVia.y - en.y) <= step) delete en.runVia;
      const goal = en.runVia ?? to;
      const dx = goal.x - en.x;
      const dy = goal.y - en.y;
      const d = Math.hypot(dx, dy);
      if ((!en.runVia && d <= step) || en.t >= en.until || (en.runStuck ?? 0) > 0.3) {
        delete en.runTo;
        delete en.runVia;
        en.vx = 0;
        en.vy = 0;
        enter(en, 'fire', a.fuse + 0.3);
        break;
      }
      if (Math.abs(dx) > 1) en.facing = dx >= 0 ? 1 : -1;
      en.vx = (dx / d) * a.speed;
      en.vy = (dy / d) * a.speed;
      const ox = en.x;
      const oy = en.y;
      slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
      const moved = Math.hypot(en.x - ox, en.y - oy);
      en.moved += moved;
      en.runStuck = moved < step * 0.3 ? (en.runStuck ?? 0) + DT : 0;
      if (!en.runVia) en.runGap = (en.runGap ?? 0) - moved;
      if (!en.runVia && en.runGap !== undefined && en.runGap <= 0) {
        en.runGap += a.gap;
        const def = PATTERNS[a.pattern];
        if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
        firePattern(w, def, en.x, en.y - DROP_HEIGHT, w.rng.range(0, Math.PI * 2), { telegraph: a.fuse, by: en.def.id, height: DROP_HEIGHT, mark: 'flash' });
        w.events.push({ type: 'flash', x: en.x, y: en.y });
      }
      return;
    }
    case 'fire':
      // Once the warning is over it drifts on while its bullets stream out (they follow it).
      // (Spinning on the spot it stays put: BossPatternAttack.spin.)
      if (b.glide && !en.rail) {
        // Skating, it does not push off while it fires: it glides on, braking.
        ({ x: walkX, y: walkY } = glideWalk(w, en, b, b.glide, phase.walkSpeed * rage, phase.keep, false));
        glided = true;
      } else if (en.t > bossWarnTime(phase, en) && !isSpinning(en)) {
        const v = phase.walkSpeed * rage * b.drift;
        if (en.rail) ({ x: walkX, y: walkY } = railRoam(w, en, b, v));
        else if (b.hover) ({ x: walkX, y: walkY } = hoverWalk(w, en, b.hover, v));
        else ({ x: walkX, y: walkY } = waddleWalk(w, en, b, phase, bossRoam(w, en, b, v, phase.keep)));
      }
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(phase.rest[0], phase.rest[1]));
      break;
    case 'roar':
      if (en.t >= en.until) enter(en, 'idle', 0.5);
      break;
    case 'stun':
      // Quiet (BossPhase.mute): stock-still, then a short breath before it picks up again.
      en.vx = 0;
      en.vy = 0;
      if (en.t >= en.until) enter(en, 'idle', 0.35);
      break;
    default:
      // First tick after its entrance: a short breath, then the first attack.
      enter(en, 'idle', 0.6);
  }
  // Skating, it brakes slowly whatever it is doing (warning too); only stopped dead (a break, a
  // silence) does it lose its glide at once.
  if (b.glide && !en.rail && !glided && en.state === 'warn') {
    ({ x: walkX, y: walkY } = glideWalk(w, en, b, b.glide, phase.walkSpeed * rage, phase.keep, false));
    glided = true;
  }
  if (glided) {
    en.vx = walkX;
    en.vy = walkY;
  } else approach(en, walkX, walkY, b.hover ? b.hover.accel : KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    // (Floating, BossBrain.hover, it goes over the furniture.)
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT, b.hover ? 'all' : false);
    const moved = Math.hypot(en.x - ox, en.y - oy);
    en.moved += moved;
    if (glided && b.glide) iceTrail(w, en, b.glide, moved);
  }
}

/** Seconds after a hop to a relay before it attacks, however long its rest had to go (BossBrain.handoff). */
const HANDOFF_SETTLE = 0.2;
/** It never hops to a relay this close to itself (px). */
const HANDOFF_NEAR = 60;

/**
 * «Cambio de punto de acceso» (BossBrain.handoff): counts down (walking or firing) while it has relays;
 * when due, it picks the relay nearest the player (not within `clear` px of it, and nearer it than
 * itself: better coverage), warns, and once the
 * warning is over (and it is between attacks) swaps places with it. A break or a fallen relay calls
 * the hop off.
 */
function updateHandoff(w: World, en: Enemy, h: NonNullable<BossBrain['handoff']>, rage: number): void {
  if (en.state === 'roar' || en.state === 'dying' || w.over) {
    delete en.handoff;
    return;
  }
  const relays = relaysOf(w, en);
  const p = w.player;
  if (en.handoff) {
    const r = relays.find((o) => o.id === en.handoff!.relay);
    if (!r) {
      delete en.handoff;
      return;
    }
    en.handoff.t -= DT;
    if (en.handoff.t > 0 || en.state !== 'idle') return;
    const fromX = en.x;
    const fromY = en.y;
    const to = freeSpot(w, r.x, r.y, en.def.footRadius + 1);
    const back = freeSpot(w, fromX, fromY, r.def.footRadius + 1);
    en.x = to.x;
    en.y = to.y;
    en.vx = 0;
    en.vy = 0;
    r.x = back.x;
    r.y = back.y;
    r.facing = p.x > r.x ? 1 : -1;
    delete en.handoff;
    delete en.legSpin;
    en.handoffIn = w.rng.range(h.every[0], h.every[1]);
    // It comes out of the relay attacking: its next attack starts in a moment, whatever was left of its rest.
    en.until = en.t * rage + HANDOFF_SETTLE;
    w.events.push({ type: 'handoff', boss: en.id, relay: r.id, x: fromX, y: fromY, tx: en.x, ty: en.y });
    return;
  }
  en.handoffIn ??= w.rng.range(h.every[0], h.every[1]);
  // (Counted while it walks and while it fires; it hops between attacks.)
  if ((en.state === 'idle' || en.state === 'fire') && relays.length > 0) en.handoffIn -= DT;
  if (en.handoffIn > 0) return;
  let best: Enemy | undefined;
  for (const r of relays) {
    // Better coverage or nothing: a relay nearer the player than itself (but not on top of it).
    const d = Math.hypot(r.x - p.x, r.y - p.y);
    if (d < h.clear || d > Math.hypot(en.x - p.x, en.y - p.y) - HANDOFF_NEAR / 3 || Math.hypot(r.x - en.x, r.y - en.y) < HANDOFF_NEAR) continue;
    if (!best || Math.hypot(r.x - p.x, r.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y)) best = r;
  }
  if (!best) {
    // None worth it now: it looks again in a moment.
    en.handoffIn = 0.5;
    return;
  }
  const first = !en.hopped;
  en.hopped = true;
  en.handoff = { relay: best.id, t: h.warn, warn: h.warn };
  w.events.push({ type: 'handoffWarn', boss: en.id, relay: best.id, x: en.x, y: en.y, tx: best.x, ty: best.y, time: h.warn, first });
}

/**
 * «Nubarrón» (BossBrain.hover): the velocity it wants, towards its spot over the player (north of it,
 * or south when north is the back wall), swaying across and up and down, never faster than `speed`
 * and slowing as it gets there. (It reaches it drifting: see the approach in updateBoss.)
 */
function hoverWalk(w: World, en: Enemy, h: NonNullable<BossBrain['hover']>, speed: number): { x: number; y: number } {
  const p = w.player;
  const r0 = en.def.footRadius;
  const top = (BACK_WALL_ROWS + 0.5) * TILE + r0;
  const bottom = w.room.h - TILE - 4;
  let ty = p.y - h.above;
  if (ty < top) ty = p.y + h.above * HOVER_BELOW;
  const tt = w.tick * DT + en.id;
  const tx = Math.max(TILE + r0 + 2, Math.min(w.room.w - TILE - r0 - 2, p.x + Math.sin(tt * HOVER_SWAY_X) * h.sway));
  ty = Math.max(top, Math.min(bottom, ty + Math.sin(tt * HOVER_SWAY_Y) * h.sway * 0.5));
  const dx = tx - en.x;
  const dy = ty - en.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) return { x: 0, y: 0 };
  const v = Math.min(speed, d * HOVER_GAIN);
  return { x: (dx / d) * v, y: (dy / d) * v };
}

/** The Nube's sway (rad/s across and up and down), how it slows near its spot, and how far south of the player it hangs when north is a wall (share of `above`). */
const HOVER_SWAY_X = 1.1;
const HOVER_SWAY_Y = 1.7;
const HOVER_GAIN = 1.5;
const HOVER_BELOW = 0.7;

/** Below this share of its push it may push off again (BossBrain.glide), and not sooner than this (s). */
const GLIDE_REPUSH = 0.3;
const GLIDE_EVERY = 0.35;
/** It leaves frost only while gliding faster than this share of its push (not at a crawl). */
const GLIDE_TRAIL_FROM = 0.35;

/**
 * «Patina sobre su escarcha» (BossBrain.glide): its velocity this tick. It brakes at `friction`
 * (less on landed frost); with `push`, once it has almost stopped, it pushes off along its walk
 * round the player (bossRoam, which is asked every tick so its legs keep turning over).
 */
function glideWalk(w: World, en: Enemy, b: BossBrain, g: NonNullable<BossBrain['glide']>, speed: number, keep: number, push: boolean): { x: number; y: number } {
  const want = bossRoam(w, en, b, speed * g.push, keep);
  const fr = g.friction * (onIce(w, en.x, en.y) ? g.ice : 1);
  const sp = Math.hypot(en.vx, en.vy);
  const ns = Math.max(0, sp - fr * DT);
  let vx = sp > 0 ? (en.vx / sp) * ns : 0;
  let vy = sp > 0 ? (en.vy / sp) * ns : 0;
  en.glideT = (en.glideT ?? 0) - DT;
  if (push && en.glideT <= 0 && ns < speed * g.push * GLIDE_REPUSH && !w.over) {
    vx = want.x;
    vy = want.y;
    en.glideT = GLIDE_EVERY;
    const v = Math.hypot(vx, vy) || 1;
    w.events.push({ type: 'glide', boss: en.id, x: en.x, y: en.y, dirX: vx / v, dirY: vy / v, speed: v });
  }
  return { x: vx, y: vy };
}

/**
 * Whether (x, y) is on landed frost (not a label, a product or a piece, nor its own thin trail, or it
 * would never stop): the Nevera's rink.
 */
export function onIce(w: World, x: number, y: number): boolean {
  return w.frost.some((f) => !f.sticker && !f.trail && f.product === undefined && f.brick === undefined && inFrost(f, x, y));
}

/** The Nevera's trail (BossBrain.glide): a patch of frost every `trail.gap` px it glides fast. */
function iceTrail(w: World, en: Enemy, g: NonNullable<BossBrain['glide']>, moved: number): void {
  const b = en.def.brain as BossBrain;
  const phase = b.phases[en.bossPhase ?? 0]!;
  if (w.over || Math.hypot(en.vx, en.vy) < phase.walkSpeed * g.push * GLIDE_TRAIL_FROM) return;
  en.glideTrail = (en.glideTrail ?? 0) + moved;
  if (en.glideTrail < g.trail.gap) return;
  en.glideTrail = 0;
  layFrost(w, en.x, en.y, g.trail.r, g.trail.life, g.trail.slow, en.id, en.def.id);
}

/**
 * «Anda a pivotes» (BossBrain.waddle): `want` (where its walk takes it) swung `angle` to one side
 * and then to the other, step by step, in lurches (still at the ends of each step). Without a
 * waddle, `want` as it is.
 */
function waddleWalk(w: World, en: Enemy, b: BossBrain, phase: BossPhase, want: { x: number; y: number }): { x: number; y: number } {
  const wd = phase.waddle ?? b.waddle;
  if (!wd) return want;
  en.waddleSide ??= 1;
  en.waddleT = (en.waddleT ?? 0) + DT;
  if (en.waddleT >= wd.step) {
    en.waddleT -= wd.step;
    en.waddleSide = -en.waddleSide;
    w.events.push({ type: 'pivot', boss: en.id, x: en.x, y: en.y, side: en.waddleSide });
  }
  const k = (Math.PI / 2) * Math.sin((Math.PI * en.waddleT) / wd.step);
  const a = ((wd.angle * Math.PI) / 180) * en.waddleSide;
  const c = Math.cos(a);
  const sn = Math.sin(a);
  return { x: (want.x * c - want.y * sn) * k, y: (want.x * sn + want.y * c) * k };
}

/**
 * Whether a boss is spinning on the spot (BossPatternAttack.spin): firing such an attack, its
 * warning over. The render turns it round meanwhile.
 */
export function isSpinning(en: Enemy): boolean {
  const b = en.def.brain;
  if (b.kind !== 'boss' || en.state !== 'fire' || en.attack === undefined) return false;
  const phase = b.phases[en.bossPhase ?? 0];
  const a = phase?.attacks[en.attack];
  return !!a && a.kind === 'pattern' && !!a.spin && en.t > a.telegraph;
}

/** Seconds a boss stands clapping when it restructures its room (BossPhase.restructure). */
const BOSS_CLAP = 0.55;

/** Height a dropped connection bursts at (px above the floor). */
const DROP_HEIGHT = 3;
/** Height the Nube's rain falls at (it comes from above, so it is drawn high). */
const RAIN_HEIGHT = 18;

/**
 * The lanes of «Lluvia en columnas» (BossRainAttack): one over the player, the rest at random
 * across the room's floor, never closer than `gap` px to each other.
 */
export function rainColumns(w: World, cols: number, gap: number): number[] {
  const lo = TILE * 1.5;
  const hi = w.room.w - TILE * 1.5;
  const xs = [Math.max(lo, Math.min(hi, w.player.x))];
  for (let tries = 0; xs.length < cols && tries < 60; tries++) {
    const x = w.rng.range(lo, hi);
    if (xs.every((o) => Math.abs(o - x) >= gap)) xs.push(x);
  }
  return xs.map((x) => Math.round(x));
}

/**
 * «Almacenamiento lleno» (BossFolderAttack): `count` folders in a row across the line from the boss
 * to the player, `dist` of the way along it, one prop width apart; any spot on a wall, on another
 * prop, on the toaster or on the boss is skipped. Returns where they went.
 */
export function dropFolders(w: World, en: Enemy, a: Extract<BossAttack, { kind: 'folders' }>): Array<{ x: number; y: number }> {
  const def = PROPS[a.prop];
  if (!def) throw new Error(`Unknown prop ${a.prop}`);
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const d = Math.hypot(dx, dy) || 1;
  const cx = en.x + dx * a.dist;
  const cy = en.y + dy * a.dist;
  // Across the line: perpendicular to it (squashed a little, the floor is seen from above).
  const nx = -dy / d;
  const ny = dx / d;
  const step = def.box.w + 4;
  const out: Array<{ x: number; y: number }> = [];
  const pb = playerFeetBox(p, p.def.footRadius + 6);
  const eb = playerFeetBox(en, en.def.footRadius + 4);
  for (let k = 0; k < a.count; k++) {
    const off = (k - (a.count - 1) / 2) * step;
    const x = Math.round(cx + nx * off);
    const y = Math.round(cy + ny * off);
    const box = { x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h };
    if (box.x < TILE || box.x + box.w > w.room.w - TILE || box.y < BACK_WALL_ROWS * TILE || box.y + box.h > w.room.h - TILE) continue;
    if (!isClear(w, x, y + def.box.y + def.box.h / 2, Math.max(def.box.w, def.box.h) / 2)) continue;
    if (overlaps(box, pb) || overlaps(box, eb)) continue;
    if (w.room.props.some((o) => overlaps(o.box, box))) continue;
    w.room.props.push({ def, x, y, box, life: a.life });
    out.push({ x, y });
  }
  return out;
}

/** How far in from the side walls the catwalk ends (px): the boss's body has to fit. */
const RUNWAY_MARGIN = TILE * 2.5;
/** How far above or below the player it likes its catwalk (px). */
const RUNWAY_ASIDE = 40;

/**
 * The end of a catwalk: the far side of the room from where the boss stands, on the horizontal lane
 * clear from wall to wall that passes closest to RUNWAY_ASIDE px above or below the player. Without
 * one, level with the player.
 */
export function runwayEnd(w: World, en: Enemy): { x: number; y: number } {
  const { cols, rows } = w.room;
  const x0 = RUNWAY_MARGIN;
  const x1 = cols * TILE - RUNWAY_MARGIN;
  const r = en.def.footRadius;
  const py = w.player.y;
  // Beside the player, not over them: the flashes are the threat, not being trodden on.
  const off = (y: number): number => Math.abs(Math.abs(y - py) - RUNWAY_ASIDE);
  let best: number | undefined;
  for (let y = TILE * 2 + r; y <= (rows - 1) * TILE - r; y += 4) {
    let clear = true;
    for (let x = x0; x <= x1 && clear; x += 8) clear = isClear(w, x, y, r);
    if (clear && (best === undefined || off(y) < off(best) || (off(y) === off(best) && w.rng.next() < 0.5))) best = y;
  }
  const x = en.x < (cols * TILE) / 2 ? x1 : x0;
  return { x, y: best ?? Math.max(TILE * 2 + r, Math.min((rows - 1) * TILE - r, w.player.y)) };
}

/**
 * A boss breaks out of its shell (BossPhase.shed): the prop `id` is left where it stood, snapped to
 * the tiles like the props of the templates (the bot's paths go round whole tiles), on the nearest
 * spot where it touches no wall, prop or the toaster; whoever stands on it (the boss first) steps
 * out towards the player.
 */
function shedShell(w: World, en: Enemy, id: string): void {
  const def = PROPS[id];
  if (!def) throw new Error(`Unknown prop ${id}`);
  const p = w.player;
  const boxAt = (x: number, y: number): Rect => ({ x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h });
  const fits = (x: number, y: number): boolean => {
    const box = boxAt(x, y);
    const pad = { x: box.x - 4, y: box.y - 4, w: box.w + 8, h: box.h + 8 };
    if (overlaps(pad, playerFeetBox(p, p.def.footRadius + 6))) return false;
    if (w.room.props.some((pr) => overlaps(pr.box, pad))) return false;
    const walls: Rect[] = [];
    wallRectsNear(w.room, pad, walls);
    return !walls.some((r) => overlaps(r, pad));
  };
  // Two tiles wide: its middle on the tile edge nearest the boss's feet.
  const c0 = Math.round(en.x / TILE);
  const r0 = Math.floor(en.y / TILE);
  let at: { x: number; y: number } | null = null;
  search: for (let d = 0; d <= 4; d++) {
    for (let dr = -d; dr <= d; dr++) {
      for (let dc = -d; dc <= d; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== d) continue;
        const x = (c0 + dc) * TILE;
        const y = (r0 + dr + 1) * TILE - 2;
        if (fits(x, y)) {
          at = { x, y };
          break search;
        }
      }
    }
  }
  // Nowhere to leave it (it never happens in its own room): it just breaks out.
  if (!at) return;
  const box = boxAt(at.x, at.y);
  w.room.props.push({ def, x: at.x, y: at.y, box });
  // Out of the box, towards the toaster: the boss and anyone else caught under it.
  const d = normalize(p.x - at.x, p.y - at.y);
  for (const o of w.enemies) {
    if (isDead(o)) continue;
    const feet = playerFeetBox(o, o.def.footRadius);
    if (!overlaps(feet, box)) continue;
    const out = freeSpot(w, at.x + d.x * (def.box.w / 2 + o.def.footRadius), at.y + d.y * 14 + (d.y >= 0 ? 6 : -def.box.h), o.def.footRadius);
    o.x = out.x;
    o.y = out.y;
    o.vx = 0;
    o.vy = 0;
  }
  w.events.push({ type: 'shed', boss: en.id, x: at.x, y: at.y, prop: id });
}

/**
 * A boss calls `count` helpers (enemy `id`) next to it, never more than `max` of its own standing:
 * they pop out to its sides and slide a little before they go for the player. They are its own
 * (owner), and fall with it.
 */
function summonHelpers(w: World, boss: Enemy, s: { id: string; count: number; max: number }): void {
  const def = ENEMIES[s.id];
  if (!def) throw new Error(`Unknown enemy ${s.id}`);
  const standing = w.enemies.filter((o) => o.owner === boss.id && o.def.id === s.id && o.damageTaken < o.def.hp).length;
  const n = Math.max(0, Math.min(s.count, s.max - standing));
  const spawned: number[] = [];
  for (let i = 0; i < n; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const at = freeSpot(w, boss.x + side * (boss.def.footRadius + 14), boss.y + 6, def.footRadius + 1);
    const kid = spawnEnemy(w.nextId++, def, at.x, at.y);
    kid.owner = boss.id;
    kid.vx = side * 150;
    kid.vy = w.rng.range(-40, 60);
    if (def.brain.kind === 'chaser') {
      kid.state = 'brake';
      kid.until = 0.5;
    }
    w.enemies.push(kid);
    spawned.push(kid.id);
  }
  if (spawned.length) w.events.push({ type: 'summon', boss: boss.id, x: boss.x, y: boss.y, spawned });
}

/** A boss's helpers still standing (not its relays): what it called, and what came out of them. */
export function helpersOf(w: World, boss: Enemy): Enemy[] {
  return w.enemies.filter((o) => o.owner === boss.id && o.def.brain.kind !== 'relay' && o.state !== 'dying' && o.damageTaken < o.def.hp);
}

/**
 * «Cajas de botín» (BossSummonAttack): `count` helpers tossed out of the boss, fanned towards the
 * player (one straight at it, the rest to each side), sliding to a stop where they land; never more
 * than `max` of its helpers standing. They are its own and fall with it.
 */
export function tossHelpers(w: World, boss: Enemy, a: Extract<BossAttack, { kind: 'summon' }>): number[] {
  const def = ENEMIES[a.id];
  if (!def) throw new Error(`Unknown enemy ${a.id}`);
  const n = Math.max(0, Math.min(a.count, a.max - helpersOf(w, boss).length));
  const toward = Math.atan2(w.player.y - boss.y, w.player.x - boss.x);
  const spawned: number[] = [];
  for (let i = 0; i < n; i++) {
    const side = i === 0 ? 0 : (i % 2 === 1 ? 1 : -1) * Math.ceil(i / 2);
    const ang = toward + side * 0.75 + w.rng.range(-0.2, 0.2);
    const at = freeSpot(w, boss.x + Math.cos(ang) * (boss.def.footRadius + 10), boss.y + Math.sin(ang) * 8 + 4, def.footRadius + 1);
    const kid = spawnEnemy(w.nextId++, def, at.x, at.y);
    kid.owner = boss.id;
    const sp = a.toss * w.rng.range(0.8, 1.15);
    kid.vx = Math.cos(ang) * sp;
    kid.vy = Math.sin(ang) * sp * 0.8;
    w.enemies.push(kid);
    spawned.push(kid.id);
  }
  if (spawned.length) w.events.push({ type: 'summon', boss: boss.id, x: boss.x, y: boss.y, spawned });
  return spawned;
}

/** The relays a boss has planted that are still standing. */
export function relaysOf(w: World, boss: Enemy): Enemy[] {
  return w.enemies.filter((r) => r.owner === boss.id && r.def.brain.kind === 'relay' && r.damageTaken < r.def.hp);
}

/** Knocks down every relay of a boss (they fall like any enemy, loot and all). */
function dropRelays(w: World, boss: Enemy): void {
  for (const r of relaysOf(w, boss)) r.damageTaken = r.def.hp;
}

/**
 * Plants `n` relays (enemy `id`) in the corners of the room farthest from the player, skipping
 * corners that already have one.
 */
function plantRelays(w: World, boss: Enemy, id: string, n: number): void {
  const def = ENEMIES[id];
  if (!def) throw new Error(`Unknown enemy ${id}`);
  const p = w.player;
  const { cols, rows } = w.room;
  // Corners, but far enough in to be on screen when the player stands in the middle.
  const xs = [TILE * 4.5, (cols - 4.5) * TILE];
  const ys = [TILE * 4.5, (rows - 2.5) * TILE];
  const corners = xs.flatMap((x) => ys.map((y) => ({ x, y })));
  corners.sort((a, b) => Math.hypot(b.x - p.x, b.y - p.y) - Math.hypot(a.x - p.x, a.y - p.y));
  const standing = relaysOf(w, boss);
  let planted = 0;
  for (const c of corners) {
    if (planted >= n) break;
    if (standing.some((r) => Math.hypot(r.x - c.x, r.y - c.y) < 40)) continue;
    const at = freeSpot(w, c.x, c.y, def.footRadius + 1);
    const r = spawnEnemy(w.nextId++, def, at.x, at.y);
    r.owner = boss.id;
    r.facing = p.x > r.x ? 1 : -1;
    w.enemies.push(r);
    w.events.push({ type: 'relayPlant', x: r.x, y: r.y, source: r.id });
    planted++;
  }
}

/** A relay just stands there, plugged in, facing the player; it falls when its owner goes down. */
function updateRelay(w: World, en: Enemy, _b: RelayBrain): void {
  en.t += DT;
  const owner = w.enemies.find((o) => o.id === en.owner);
  if (!owner || owner.state === 'dying' || owner.damageTaken >= owner.def.hp) {
    en.damageTaken = en.def.hp;
    return;
  }
  if (Math.abs(w.player.x - en.x) > 2) en.facing = w.player.x > en.x ? 1 : -1;
  en.vx = 0;
  en.vy = 0;
}

/** Friction of a tossed loot box sliding to a stop (px/s²). */
const LOOTBOX_FRICTION = 520;

/**
 * A loot box (LootboxBrain): it slides to a stop where it was tossed, sits there glowing and, the
 * last `shake` s of its `open`, rattles (state `jam`); then it opens by itself (Enemy.selfOpened:
 * reapEnemies draws from its selfSurprise). If its owner falls first, it goes too, unopened.
 */
function updateLootbox(w: World, en: Enemy, b: LootboxBrain): void {
  en.t += DT;
  if (en.owner !== undefined) {
    const owner = w.enemies.find((o) => o.id === en.owner);
    if (!owner || owner.state === 'dying' || owner.damageTaken >= owner.def.hp) {
      en.damageTaken = en.def.hp;
      return;
    }
  }
  const sp = Math.hypot(en.vx, en.vy);
  if (sp > 0) {
    const k = Math.max(0, sp - LOOTBOX_FRICTION * DT) / sp;
    en.vx *= k;
    en.vy *= k;
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    // Into a wall: it stops there.
    if (Math.hypot(en.x - ox, en.y - oy) < sp * DT * 0.3) {
      en.vx = 0;
      en.vy = 0;
    }
  }
  if (en.state !== 'jam' && en.t >= b.open - b.shake) {
    const t = en.t;
    enter(en, 'jam', b.shake);
    en.t = t;
    en.until = b.open;
    w.events.push({ type: 'lootShake', x: en.x, y: en.y, id: en.id });
  }
  if (en.t >= b.open && !w.over) {
    en.selfOpened = true;
    en.damageTaken = en.def.hp;
  }
}

/** Where a boss attack that warns by itself shows its warning: the dispenser, or the open door. */
export function bossWarnSpot(en: Enemy, b: BossBrain, a: BossAttack): { x: number; y: number } {
  const at = a.kind === 'spit' ? a.from : b.muzzle;
  return { x: en.x + at.x * en.facing, y: en.y - at.y };
}

/** Height its bullets come out at: `muzzleY` above the feet, lower if a wall is right above it. */
/**
 * The surprise envelope: rests on the floor a moment, then hops (state `charge`, `until` the length
 * of the hop; enemyAltitude lifts it) to a spot about `keep` px from the player, with a random
 * swerve; every `volleyEvery` hops it spits its confetti instead (state `fire`, its pattern warns).
 * A hop that hits a wall or a prop just ends there.
 */
function updateHopper(w: World, en: Enemy, b: HopperBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  switch (en.state) {
    case 'charge': {
      const ox = en.x;
      const oy = en.y;
      slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
      en.moved += Math.hypot(en.x - ox, en.y - oy);
      if (en.t >= en.until) {
        en.vx = 0;
        en.vy = 0;
        enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
        en.volleys = (en.volleys ?? b.volleyEvery) - 1;
        w.events.push({ type: 'hopLand', x: en.x, y: en.y, source: en.id });
      }
      return;
    }
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
      if (en.t < en.until || w.over) break;
      if ((en.volleys ?? b.volleyEvery) <= 0 && dist < b.range) {
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), dx), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
        enter(en, 'fire', b.telegraph + patternDuration(def));
        en.volleys = b.volleyEvery;
        break;
      }
      // Hop: towards (or away from) its distance from the player, swerving to one side or the other.
      const sign = dist > b.keep + 20 ? 1 : dist < b.keep - 20 ? -1 : 0;
      const swerve = w.rng.range(-1, 1) * (sign === 0 ? 1.6 : 0.9);
      const ux = dx / dist;
      const uy = dy / dist;
      const d = normalize(ux * sign - uy * swerve, uy * sign + ux * swerve);
      const len = w.rng.range(b.hopDist[0], b.hopDist[1]);
      en.dirX = d.x;
      en.dirY = d.y;
      en.vx = (d.x * len) / b.hopTime;
      en.vy = (d.y * len) / b.hopTime;
      if (Math.abs(d.x) > 0.2) en.facing = d.x > 0 ? 1 : -1;
      enter(en, 'charge', b.hopTime);
      w.events.push({ type: 'hop', x: en.x, y: en.y, source: en.id });
      return;
    }
  }
  // On the floor: bullets may nudge it, friction stops it.
  approach(en, 0, 0, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/**
 * The portable air conditioner: crawls to keep its distance, its vent turning slowly towards the
 * player and swinging from side to side (the sweep); the cone of cold air itself (pushing the
 * player, bending its bullets) is applied by the world (windOn, windBend). With the player in the
 * cone and its wait over, it warns and blows a handful of frost flakes along the air.
 */
function updateBlower(w: World, en: Enemy, b: BlowerBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  const want = Math.atan2(dy, dx);
  if (en.sweepT === undefined) en.phase = want;
  en.sweepT = (en.sweepT ?? 0) + DT;
  en.phase = turnTowards(en.phase, want, b.turnDeg * DEG * DT);
  const a = en.phase + Math.sin((Math.PI * en.sweepT) / b.sweepTime) * (b.sweepDeg / 2) * DEG;
  en.dirX = Math.cos(a);
  en.dirY = Math.sin(a);
  if (Math.abs(en.dirX) > 0.15) en.facing = en.dirX > 0 ? 1 : -1;
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'warn':
      if (en.t >= en.until) {
        const def = PATTERNS[b.pattern];
        if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x + en.dirX * 10, en.y - mh, a, { source: en.id, by: en.def.id, height: mh });
        enter(en, 'fire', patternDuration(def) + 0.2);
      }
      break;
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
      if (en.t >= en.until && !w.over && inWind(en, b, p.x, p.y)) {
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'acBlow', x: en.x, y: en.y, source: en.id });
        break;
      }
      if (b.hose) {
        // M14b (h9d): on its hose, it goes to the point of its reach nearest the player.
        const to = hoseSpot(w, en, b);
        const hx = to.x - en.x;
        const hy = to.y - en.y;
        const hd = Math.hypot(hx, hy);
        if (hd > 3) {
          const v = b.hose.speed * Math.min(1, hd / 12);
          walkX = (hx / hd) * v;
          walkY = (hy / hd) * v;
        }
        break;
      }
      // It drags itself to its distance (never backwards: the hose would not reach).
      if (dist > b.keep + 20) {
        walkX = (dx / dist) * b.speed;
        walkY = (dy / dist) * b.speed;
      }
    }
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    // The hose holds it (shoves and knockback included): back onto the edge of its reach.
    const pl = en.plug;
    if (pl) {
      const px = en.x - pl.x;
      const py = en.y - pl.y;
      const pd = Math.hypot(px, py);
      if (pd > pl.reach) {
        slide(w, en, en.def.footRadius, pl.x + (px / pd) * pl.reach - en.x, pl.y + (py / pd) * pl.reach - en.y);
        // Its speed outwards is gone: the hose is taut.
        const out = (en.vx * px + en.vy * py) / pd;
        if (out > 0) {
          en.vx -= (out * px) / pd;
          en.vy -= (out * py) / pd;
        }
      }
    }
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/**
 * Where an air conditioner's hose is plugged in (BlowerBrain.hose): the nearest wall straight up,
 * down, left or right of where it is the first time it is asked, just off the wall. Its reach is
 * `hose.reach`, or a little more than the hose already spans.
 */
export function plugOf(w: World, en: Enemy, b: BlowerBrain): NonNullable<Enemy['plug']> {
  if (en.plug) return en.plug;
  let best = { x: en.x, y: en.y, d: Infinity };
  for (const [ux, uy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
    for (let d = 0; d < 2000; d += 2) {
      const x = en.x + ux * d;
      const y = en.y + uy * d;
      if (isWallAt(w.room, x, y)) {
        const back = Math.max(0, d - 4);
        if (back < best.d) best = { x: en.x + ux * back, y: en.y + uy * back, d: back };
        break;
      }
    }
  }
  const reach = Math.max(b.hose?.reach ?? 0, (Number.isFinite(best.d) ? best.d : 0) + 10);
  en.plug = { x: best.x, y: best.y, reach };
  return en.plug;
}

/**
 * Where an air conditioner on its hose wants to be: on the line from its plug to the player, as
 * far along as its reach lets it, but never closer to the player than `keep`.
 */
export function hoseSpot(w: World, en: Enemy, b: BlowerBrain): { x: number; y: number } {
  const pl = plugOf(w, en, b);
  const p = w.player;
  const ux = p.x - pl.x;
  const uy = p.y - pl.y;
  const d = Math.hypot(ux, uy) || 1;
  const along = Math.max(0, Math.min(pl.reach, d - b.keep));
  return { x: pl.x + (ux / d) * along, y: pl.y + (uy / d) * along };
}

/** Warning before a ticket dispenser's loose tickets (s): they are slow, so a short one. */
const ENEMY_TELEGRAPH_SHORT = 0.35;

/** The number on the dispenser's own screen: the one turn it never calls. */
export const OWN_TURN = 87;

/**
 * Where a ticket dispenser lights its next turn: `near`–`far` px from the player (closer, if
 * nothing fits), on the floor and clear of the walls, not on the dispenser itself, and somewhere
 * the toaster can walk to (round whatever is in the way) in under 70 % of the countdown. Null if
 * there is no such place (it will try again a moment later).
 */
export function turnSpot(w: World, en: Enemy, b: TurnerBrain): { x: number; y: number } | null {
  const p = w.player;
  const r = p.def.footRadius;
  const room = w.room;
  const blocked = blockedTiles(w, r);
  const reach = p.def.speed * b.countdown * 0.7;
  for (let i = 0; i < 28; i++) {
    const d = i < 18 ? w.rng.range(b.near, b.far) : w.rng.range(b.near * 0.55, b.near);
    const a = w.rng.range(0, Math.PI * 2);
    const x = p.x + Math.cos(a) * d;
    const y = p.y + Math.sin(a) * d * 0.8;
    // Most of the circle on the floor (it is painted there), the middle well clear of anything.
    if (x < TILE + b.radius * 0.6 || x > room.w - TILE - b.radius * 0.6) continue;
    if (y < TILE * 2 + b.radius * 0.5 || y > room.h - TILE - b.radius * 0.5) continue;
    if (Math.hypot(x - en.x, y - en.y) < b.radius + 12 || !isClear(w, x, y, r + 2)) continue;
    const path = findPath(w, p, { x, y }, r, blocked);
    const end = path[path.length - 1];
    if (!end || Math.hypot(end.x - x, end.y - y) > TILE * 0.75) continue;
    let len = 0;
    let at: { x: number; y: number } = p;
    for (const q of [...path, { x, y }]) {
      len += Math.hypot(q.x - at.x, q.y - at.y);
      at = q;
    }
    if (len <= reach) return { x, y };
  }
  return null;
}

/**
 * The ticket dispenser: keeps its distance and, every few seconds, calls a turn: a numbered circle
 * lights up on the floor away from the player, who has a moment to get into it. In time, the
 * circle stops enemy bullets for a little longer; too late, it spits a wide fan of tickets at the
 * player. With no turn on, it lets go of a couple of slow gliding tickets now and then.
 */
function updateTurner(w: World, en: Enemy, b: TurnerBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
  // Its next call counts down all the time (it can only come with no turn on the floor).
  en.callT = (en.callT ?? b.interval[0] * 0.5) - DT;
  const c = en.turn;
  if (c) {
    c.t += DT;
    if (c.state === 'called') {
      if (!w.over && Math.hypot(p.x - c.x, p.y - c.y) <= c.r - 2) {
        c.state = 'served';
        c.t = 0;
        c.until = b.served;
        w.events.push({ type: 'turnServed', x: c.x, y: c.y, source: en.id });
      } else if (c.t >= c.until) {
        c.state = 'lost';
        c.t = 0;
        c.until = b.lost;
        w.events.push({ type: 'turnLost', x: c.x, y: c.y, source: en.id });
        if (!w.over) {
          const def = PATTERNS[b.punish];
          if (!def) throw new Error(`Unknown pattern ${b.punish}`);
          const mh = muzzleHeight(w, en, b.muzzleY);
          firePattern(w, def, en.x + 3 * en.facing, en.y - mh, Math.atan2(dy, dx), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
          enter(en, 'fire', b.telegraph + patternDuration(def) + 0.3);
        }
      }
    } else if (c.t >= c.until) {
      delete en.turn;
    }
  }
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'warn':
      // Calling the turn: it stands still, the number lit up.
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.between[0], b.between[1]));
      break;
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.between[0], b.between[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.between[0], b.between[1]));
      if (!en.turn && !w.over) {
        if (en.callT <= 0 && dist < b.range) {
          const at = turnSpot(w, en, b);
          if (!at) {
            en.callT = 0.4;
          } else {
            let num = w.rng.int(1, 999);
            if (num === OWN_TURN) num++;
            const desk = w.rng.int(1, 9);
            en.turn = { x: at.x, y: at.y, r: b.radius, num, desk, state: 'called', t: 0, until: b.countdown };
            // The next call counts from this one (a turn served or lost takes less than that).
            en.callT = w.rng.range(b.interval[0], b.interval[1]);
            w.events.push({ type: 'turnCall', x: at.x, y: at.y, num, desk, source: en.id });
            enter(en, 'warn', b.call);
            break;
          }
        }
        // No turn on: a couple of loose tickets, gliding slowly at the player.
        if (en.t >= en.until && dist < b.range) {
          const def = PATTERNS[b.pattern];
          if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
          const mh = muzzleHeight(w, en, b.muzzleY);
          firePattern(w, def, en.x + 3 * en.facing, en.y - mh, Math.atan2(dy, dx), { telegraph: ENEMY_TELEGRAPH_SHORT, source: en.id, by: en.def.id, height: mh });
          enter(en, 'fire', ENEMY_TELEGRAPH_SHORT + patternDuration(def) + 0.15);
          break;
        }
      }
      if (b.wall) {
        // M14b (h9e1): along the walls, like the real ones.
        en.wallT = (en.wallT ?? 0) - DT;
        if (!en.wallSpot || en.wallT <= 0) {
          en.wallT = b.wall.every;
          const spot = wallSpot(w, en, b.keep);
          if (spot) en.wallSpot = spot;
        }
        const ws = en.wallSpot;
        if (ws) {
          const to = wayTo(w, en, ws);
          const hx = to.x - en.x;
          const hy = to.y - en.y;
          const hd = Math.hypot(hx, hy);
          if (Math.hypot(ws.x - en.x, ws.y - en.y) > 3 && hd > 0.5) {
            const v = b.wall.speed * Math.min(1, Math.hypot(ws.x - en.x, ws.y - en.y) / 12);
            walkX = (hx / hd) * v;
            walkY = (hy / hd) * v;
          }
          break;
        }
      }
      // Keeps its distance, backing off sideways (as the bucket of pieces does).
      const sign = dist > b.keep + 24 ? 1 : dist < b.keep - 24 ? -1 : 0;
      const side = sign < 0 ? (en.phase >= 0 ? 0.8 : -0.8) : 0;
      const ux = dx / dist;
      const uy = dy / dist;
      const mx = ux * sign - uy * side;
      const my = uy * sign + ux * side;
      const ml = Math.hypot(mx, my) || 1;
      if (sign !== 0) {
        walkX = (mx / ml) * b.speed;
        walkY = (my / ml) * b.speed;
      }
    }
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/**
 * Where a ticket dispenser on the wall goes next (TurnerBrain.wall): of the floor tiles with a wall
 * beside them (left, right, above or below), the spot against that wall (just off it) that is
 * clear of props, in sight of the player, and best balances being about `keep` px from the player
 * with being near where it already is. Null if there is none.
 */
export function wallSpot(w: World, en: Enemy, keep: number): { x: number; y: number } | null {
  const room = w.room;
  const p = w.player;
  const r = en.def.footRadius + 2;
  let best: { x: number; y: number } | null = null;
  let bestScore = Infinity;
  for (let row = 0; row < room.rows; row++) {
    for (let col = 0; col < room.cols; col++) {
      if (room.tiles[row * room.cols + col] === 1) continue;
      const cx = (col + 0.5) * TILE;
      const cy = (row + 0.5) * TILE;
      for (const [ux, uy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
        if (!isWallAt(room, cx + ux * TILE, cy + uy * TILE)) continue;
        // Against that wall: its feet just off it (the back wall is drawn tall: feet at its foot).
        const x = cx + ux * (TILE / 2 - r);
        const y = cy + uy * (TILE / 2 - r);
        const dp = Math.hypot(x - p.x, y - p.y);
        const score = Math.abs(dp - keep) + 0.4 * Math.hypot(x - en.x, y - en.y);
        if (score >= bestScore) continue;
        if (!isClear(w, x, y, r) || !clearLine(w, { x, y }, p, 1)) continue;
        best = { x, y };
        bestScore = score;
      }
    }
  }
  return best;
}

/** Farther than this from the player, queue posts do not fire (px). */
const QUEUE_RANGE = 260;

/** Seconds between two searches of the way round things (wayTo). */
const QUEUE_REPATH = 0.35;

/**
 * Where an enemy that walks round things (the queue posts, the virtual assistant) heads now to get
 * to `goal`: straight at it if nothing is in the way; otherwise the farthest point of the tile path
 * it can walk to in a straight line (worked out every QUEUE_REPATH s and kept in `dest`).
 */
function wayTo(w: World, en: Enemy, goal: { x: number; y: number }): { x: number; y: number } {
  const r = en.def.footRadius + 1;
  en.pathT = (en.pathT ?? 0) - DT;
  if (clearLine(w, en, goal, r)) {
    delete en.dest;
    return goal;
  }
  if (en.dest && en.pathT > 0) return en.dest;
  en.pathT = QUEUE_REPATH;
  const path = findPath(w, en, goal, en.def.footRadius);
  if (path.length === 0) return goal;
  let at = path[0]!;
  for (let i = Math.min(path.length - 1, 6); i > 0; i--) {
    if (clearLine(w, en, path[i]!, r)) {
      at = path[i]!;
      break;
    }
  }
  en.dest = at;
  return at;
}

/** The other post of `en`'s pair, if it is still standing. */
export function liveMate(w: World, en: Enemy): Enemy | undefined {
  if (en.mate === undefined) return undefined;
  const m = w.enemies.find((o) => o.id === en.mate);
  return m && !isDead(m) && m.state !== 'dying' ? m : undefined;
}

/**
 * Where a queue post wants to stand: its end of a tape `gap` px from the player, across the line
 * from the player to the middle of the pair (so the tape is between the player and them), as long
 * as `spread` (the short one while it is tense). Which end is its own: the one on its side of the
 * pair.
 */
export function queueSpot(w: World, en: Enemy, mate: Enemy, b: QueuerBrain): { x: number; y: number } {
  const p = w.player;
  const mx = (en.x + mate.x) / 2;
  const my = (en.y + mate.y) / 2;
  let ux = mx - p.x;
  let uy = my - p.y;
  const ul = Math.hypot(ux, uy);
  if (ul < 1) {
    ux = 0;
    uy = -1;
  } else {
    ux /= ul;
    uy /= ul;
  }
  const px = -uy;
  const py = ux;
  const lead = en.id < mate.id ? en : mate;
  const half = (lead.tense ? b.spread[0] : b.spread[1]) / 2;
  const own = (en.x - mate.x) * px + (en.y - mate.y) * py;
  const s = own > 0 || (own === 0 && en.id < mate.id) ? 1 : -1;
  return { x: p.x + ux * b.gap + px * half * s, y: p.y + uy * b.gap + py * half * s };
}

/**
 * The queue posts (QueuerBrain): two that walk to the ends of a tape in front of the player and
 * fire by turns (the nearer one), and when one breaks the other snaps its tape back, stands a
 * moment and goes on alone, firing more often.
 */
function updateQueuer(w: World, en: Enemy, b: QueuerBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
  const mate = liveMate(w, en);
  if (en.mate !== undefined && !mate) {
    // The other one broke: the tape snaps back into this one.
    delete en.mate;
    delete en.tense;
    en.queueT = Math.min(en.queueT ?? b.alone, b.snap + b.alone * 0.5);
    w.events.push({ type: 'tapeSnap', x: en.x, y: en.y - b.muzzleY, source: en.id });
    enter(en, 'reveal', b.snap);
  }
  if (en.state === 'reveal') {
    approach(en, 0, 0, KNOCK_FRICTION);
    if (en.t >= en.until) enter(en, 'walk', 1);
  } else {
    if (en.state === 'warn' && en.t >= en.until) enter(en, 'walk', 1);
    // Firing: the pair by turns (the one with the lower id keeps the time, the nearer one fires).
    const leads = !mate || en.id < mate.id;
    if (leads) {
      en.queueT = (en.queueT ?? b.interval * 0.6) - DT;
      if (en.queueT <= 0) {
        en.queueT = mate ? b.interval : b.alone;
        const shooter = mate && Math.hypot(p.x - mate.x, p.y - mate.y) < dist ? mate : en;
        const sd = Math.hypot(p.x - shooter.x, p.y - shooter.y);
        if (!w.over && sd < QUEUE_RANGE && shooter.state !== 'reveal') {
          const def = PATTERNS[b.pattern];
          if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
          const mh = muzzleHeight(w, shooter, b.muzzleY);
          const aim = Math.atan2(p.y - (shooter.y - mh), p.x - shooter.x);
          firePattern(w, def, shooter.x, shooter.y - mh, aim, { telegraph: b.telegraph, source: shooter.id, by: shooter.def.id, height: mh });
          enter(shooter, 'warn', b.telegraph + 0.15);
        }
      }
    }
    let tx: number;
    let ty: number;
    let v: number;
    if (mate) {
      const at = queueSpot(w, en, mate, b);
      const left = Math.hypot(at.x - en.x, at.y - en.y);
      const way = wayTo(w, en, at);
      tx = way.x - en.x;
      ty = way.y - en.y;
      v = left < 2 ? 0 : Math.min(b.speed, left * 4);
    } else if (dist > b.keep + 20 || !clearLine(w, en, p, 1)) {
      // Alone: comes closer (round whatever is in the way), to about `keep`, or until nothing
      // stands between them (a partition would leave the two shooting at it for ever).
      const way = wayTo(w, en, p);
      tx = way.x - en.x;
      ty = way.y - en.y;
      v = b.speed;
    } else {
      // ...and backs off if the player comes too close.
      tx = dist < b.keep - 20 ? -dx : 0;
      ty = dist < b.keep - 20 ? -dy : 0;
      v = b.speed;
    }
    const tl = Math.hypot(tx, ty);
    approach(en, tl > 0.5 ? (tx / tl) * v : 0, tl > 0.5 ? (ty / tl) * v : 0, KNOCK_FRICTION);
  }
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
  // The tape only gives so much: pulled too far apart (knocked back, say), each comes back half the excess.
  if (mate) {
    const mx = mate.x - en.x;
    const my = mate.y - en.y;
    const md = Math.hypot(mx, my);
    if (md > b.tether) {
      const k = ((md - b.tether) / 2) / md;
      slide(w, en, en.def.footRadius, mx * k, my * k);
    }
  }
}

/**
 * The virtual assistant (ChatbotBrain): keeps its distance (round things, and closer when it
 * cannot see the player), types and sends its speech bubbles; its shield (learnHit in world.ts)
 * wears off here.
 */
function updateChatbot(w: World, en: Enemy, b: ChatbotBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
  if (en.faq) {
    en.faq.t += DT;
    if (en.faq.t >= en.faq.until) delete en.faq;
  }
  if (b.dodge && evadeQuestion(w, en, b.dodge, dx, dy, dist)) return;
  let tx = 0;
  let ty = 0;
  if (en.state === 'warn') {
    // Typing: it stands still, the three dots under the smile.
    if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.interval[0], b.interval[1]));
  } else {
    if (en.state !== 'walk') enter(en, 'walk', w.rng.range(b.interval[0], b.interval[1]));
    if (en.t >= en.until && !w.over && dist < 300) {
      const def = PATTERNS[b.pattern];
      if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
      const mh = muzzleHeight(w, en, b.muzzleY);
      firePattern(w, def, en.x + 4 * en.facing, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), dx), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
      w.events.push({ type: 'typing', x: en.x, y: en.y - en.def.anchor.y, source: en.id });
      enter(en, 'warn', b.telegraph + 0.1);
    } else if (dist > b.keep + 24 || !clearLine(w, en, p, 1)) {
      const way = wayTo(w, en, p);
      tx = way.x - en.x;
      ty = way.y - en.y;
    } else if (dist < b.keep - 24) {
      tx = -dx;
      ty = -dy;
    }
  }
  const tl = Math.hypot(tx, ty);
  approach(en, tl > 0.5 ? (tx / tl) * b.speed : 0, tl > 0.5 ? (ty / tl) * b.speed : 0, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/**
 * A virtual assistant evading the question (ChatbotBrain.dodge). Counts how long the player has
 * held their aim on it; past `react` s it glides sideways out of the line of fire (further to the
 * side it already leans to, or the other if that side is blocked). True while it is gliding: the
 * glide is all it does that tick.
 */
function evadeQuestion(w: World, en: Enemy, d: NonNullable<ChatbotBrain['dodge']>, dx: number, dy: number, dist: number): boolean {
  const p = w.player;
  const ev = (en.evade ??= { t: 0, cd: 0, aimed: 0, n: 0 });
  ev.cd = Math.max(0, ev.cd - DT);
  if (ev.t > 0) {
    ev.t = Math.max(0, ev.t - DT);
    en.vx = en.dirX * d.speed;
    en.vy = en.dirY * d.speed;
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
    if (hit.hitX || hit.hitY) ev.t = 0;
    if (ev.t <= 0) {
      en.vx = 0;
      en.vy = 0;
    }
    return true;
  }
  // From the player's hand to the middle of its screen, against where the player aims.
  const off = turnBetween(p.aim, Math.atan2(en.y - en.def.anchor.y / 2 - (p.y - HAND_HEIGHT), -dx));
  const aimed = Math.abs(off) <= (d.cone * Math.PI) / 180 && dist < d.range && !w.over && clearLine(w, p, en, 1);
  ev.aimed = aimed ? ev.aimed + DT : 0;
  if (en.state !== 'walk' || ev.cd > 0 || ev.aimed < d.react) return false;
  // Sideways from the line of fire: first the side it already leans to.
  const px = dy / dist;
  const py = -dx / dist;
  const lean = off >= 0 ? 1 : -1;
  const reach = d.speed * d.time;
  for (const s of [lean, -lean]) {
    const gx = en.x + px * s * reach;
    const gy = en.y + py * s * reach;
    if (!isClear(w, gx, gy, en.def.footRadius + 1) || !clearLine(w, en, { x: gx, y: gy }, 1)) continue;
    en.dirX = px * s;
    en.dirY = py * s;
    ev.t = d.time;
    ev.cd = d.every;
    ev.aimed = 0;
    w.events.push({ type: 'sidestep', x: en.x, y: en.y, dirX: en.dirX, dirY: en.dirY, first: ev.n === 0, source: en.id });
    ev.n++;
    return true;
  }
  return false;
}

/**
 * Brains a reception phone never passes you on to: bosses and their relays, what is fixed to the
 * room or to someone (turrets, moths round their owner), the queue posts (their tape would jump
 * across the room) and mimics, which are not on duty yet.
 */
const NOT_ON_DUTY: ReadonlySet<string> = new Set(['boss', 'relay', 'turret', 'moth', 'queuer', 'mimic']);

/** Whether a reception phone can pass the player on to `o`: a colleague on the floor and on duty. */
export function onDuty(o: Enemy): boolean {
  return !isDead(o) && !NOT_ON_DUTY.has(o.def.brain.kind) && o.state !== 'dying' && o.state !== 'gone' && o.state !== 'lurk' && o.fadeT === undefined;
}

/** The colleague a reception phone passes you on to: the other enemy on duty farthest from the player. */
export function farthestColleague(w: World, en: Enemy): Enemy | undefined {
  let best: Enemy | undefined;
  let far = -1;
  for (const o of w.enemies) {
    if (o === en || !onDuty(o)) continue;
    const d = Math.hypot(o.x - w.player.x, o.y - w.player.y);
    if (d > far) {
      far = d;
      best = o;
    }
  }
  return best;
}

/**
 * The reception phone (PhoneBrain): hops about like the surprise envelope and, every few hops,
 * rings (three small rings) or places a call (one fat bullet that homes in a little), by turns.
 * Once it has lost `transferAt` of its life, a hit makes it pass the player on to a colleague: a
 * dotted line to the enemy farthest from the player for `transferWarn` s and then they swap
 * places (at most once every `transferEvery` s); with nobody left, it puts them on hold.
 */
function updatePhone(w: World, en: Enemy, b: PhoneBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  en.transferCd = Math.max(0, (en.transferCd ?? 0) - DT);
  // Hits while the line is busy do not count: it is the next one after that passes you on.
  if (en.transferCd > 0) en.seenDamage = en.damageTaken;
  const tr = en.transfer;
  if (tr) {
    // «Le paso con un compañero»: it stands still, looking away, while the line holds.
    tr.t += DT;
    const mate = tr.to === undefined ? undefined : w.enemies.find((o) => o.id === tr.to);
    if (tr.to !== undefined && (!mate || !onDuty(mate))) {
      // The colleague hung up first (it broke): the call is dropped.
      delete en.transfer;
      enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
    } else if (tr.t >= tr.until) {
      delete en.transfer;
      if (mate) swapPlaces(w, en, mate);
      else w.events.push({ type: 'onHold', x: en.x, y: en.y - b.muzzleY, source: en.id });
      enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
    }
    approach(en, 0, 0, KNOCK_FRICTION);
    return;
  }
  // Hit again once past `transferAt` of its life, on the floor and with the line free: it passes you on.
  if (en.state !== 'charge' && !w.over && en.transferCd <= 0 && en.damageTaken >= en.def.hp * b.transferAt && en.damageTaken > (en.seenDamage ?? 0)) {
    en.seenDamage = en.damageTaken;
    en.transferCd = b.transferEvery;
    const mate = farthestColleague(w, en);
    en.transfer = { t: 0, until: b.transferWarn };
    if (mate) en.transfer.to = mate.id;
    else {
      // Nobody to pass you on to: the hold music, its warning while the line holds.
      const def = PATTERNS[b.hold];
      if (!def) throw new Error(`Unknown pattern ${b.hold}`);
      const mh = muzzleHeight(w, en, b.muzzleY);
      firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), dx), { telegraph: b.transferWarn, source: en.id, by: en.def.id, height: mh });
    }
    if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
    enter(en, 'idle', b.transferWarn);
    en.vx = 0;
    en.vy = 0;
    const ev: SimEvent = { type: 'transferStart', x: en.x, y: en.y - en.def.anchor.y, source: en.id };
    if (mate) ev.to = mate.id;
    w.events.push(ev);
    return;
  }
  switch (en.state) {
    case 'charge': {
      const ox = en.x;
      const oy = en.y;
      slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
      en.moved += Math.hypot(en.x - ox, en.y - oy);
      if (en.t >= en.until) {
        en.vx = 0;
        en.vy = 0;
        enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
        en.volleys = (en.volleys ?? b.volleyEvery) - 1;
        w.events.push({ type: 'hopLand', x: en.x, y: en.y, source: en.id });
      }
      return;
    }
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
      if (en.t < en.until || w.over) break;
      if ((en.volleys ?? b.volleyEvery) <= 0 && dist < b.range) {
        // Its turn to attack: it rings, or it calls, by turns (it starts ringing).
        const call = en.callNext === true;
        const def = PATTERNS[call ? b.call : b.rings];
        if (!def) throw new Error(`Unknown pattern ${call ? b.call : b.rings}`);
        const mh = muzzleHeight(w, en, b.muzzleY);
        firePattern(w, def, en.x, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), dx), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
        enter(en, 'fire', b.telegraph + patternDuration(def) + 0.15);
        if (call) w.events.push({ type: 'phoneCall', x: en.x, y: en.y - mh, source: en.id });
        else {
          const at = def.kind === 'sequence' ? def.parts.map((q) => b.telegraph + q.at) : [b.telegraph];
          w.events.push({ type: 'phoneRing', x: en.x, y: en.y - mh, at, source: en.id });
        }
        en.callNext = !call;
        en.volleys = b.volleyEvery;
        break;
      }
      // Hop: towards (or away from) its distance from the player, swerving to one side or the
      // other; with something in between (a counter, a partition), round it towards the player,
      // so it never sits ringing behind a wall for ever.
      let d: { x: number; y: number };
      if (!clearLine(w, en, p, 1)) {
        en.pathT = 0;
        const way = wayTo(w, en, p);
        d = normalize(way.x - en.x, way.y - en.y);
      } else {
        const sign = dist > b.keep + 20 ? 1 : dist < b.keep - 20 ? -1 : 0;
        const swerve = w.rng.range(-1, 1) * (sign === 0 ? 1.6 : 0.9);
        const ux = dx / dist;
        const uy = dy / dist;
        d = normalize(ux * sign - uy * swerve, uy * sign + ux * swerve);
      }
      const len = w.rng.range(b.hopDist[0], b.hopDist[1]);
      en.dirX = d.x;
      en.dirY = d.y;
      en.vx = (d.x * len) / b.hopTime;
      en.vy = (d.y * len) / b.hopTime;
      if (Math.abs(d.x) > 0.2) en.facing = d.x > 0 ? 1 : -1;
      enter(en, 'charge', b.hopTime);
      w.events.push({ type: 'hop', x: en.x, y: en.y, source: en.id });
      return;
    }
  }
  approach(en, 0, 0, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/** A reception phone and its colleague swap places (each on clear floor for its own feet). */
function swapPlaces(w: World, en: Enemy, mate: Enemy): void {
  const ax = en.x;
  const ay = en.y;
  const here = freeSpot(w, mate.x, mate.y, en.def.footRadius);
  const there = freeSpot(w, ax, ay, mate.def.footRadius);
  en.x = here.x;
  en.y = here.y;
  mate.x = there.x;
  mate.y = there.y;
  for (const o of [en, mate]) {
    o.vx = 0;
    o.vy = 0;
    o.pathT = 0;
    delete o.dest;
  }
  w.events.push({ type: 'transferDone', ax, ay, bx: en.x, by: en.y, source: en.id, to: mate.id });
}

/** The stamp's fastest glide while it warns, px/s. */
const STAMP_GLIDE = 320;

/**
 * The DENEGADO stamp: hops towards the player (state `charge`, like the envelope) and every
 * `stampEvery` hops it stamps: it rises over the player's spot (state `warn`, gliding there while a
 * square shadow warns; `dest` is the spot), drops (`fire`) and inks the floor; whoever is under it
 * is hurt, and a ring of ink splashes out. Then it sits a moment (`brake`).
 */
function updateStamper(w: World, en: Enemy, b: StamperBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  switch (en.state) {
    case 'charge': {
      const ox = en.x;
      const oy = en.y;
      slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
      en.moved += Math.hypot(en.x - ox, en.y - oy);
      if (en.t >= en.until) {
        en.vx = 0;
        en.vy = 0;
        enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
        en.volleys = (en.volleys ?? b.stampEvery) - 1;
        w.events.push({ type: 'hopLand', x: en.x, y: en.y, source: en.id });
      }
      return;
    }
    case 'warn': {
      // Gliding over to where it will come down, so it is right above it when the warning ends.
      const d = en.dest ?? { x: en.x, y: en.y };
      const left = Math.max(DT, en.until - en.t + DT);
      const ox = en.x;
      const oy = en.y;
      // Never faster than STAMP_GLIDE: if something held it back, it comes down short rather than leaping.
      let gx = ((d.x - en.x) / left) * DT;
      let gy = ((d.y - en.y) / left) * DT;
      const g = Math.hypot(gx, gy);
      if (g > STAMP_GLIDE * DT) {
        gx *= (STAMP_GLIDE * DT) / g;
        gy *= (STAMP_GLIDE * DT) / g;
      }
      slide(w, en, en.def.footRadius, gx, gy);
      en.moved += Math.hypot(en.x - ox, en.y - oy);
      if (en.t >= en.until) {
        en.dest = { x: en.x, y: en.y };
        enter(en, 'fire', b.drop);
      }
      return;
    }
    case 'fire': {
      if (en.t < en.until) return;
      // Down: the square of ink, and whoever was under it.
      const x = en.x;
      const y = en.y;
      stampInk(w, x, y, b.ink, en.id);
      const under = Math.abs(p.x - x) <= b.ink.w / 2 && Math.abs(p.y - y) <= b.ink.h / 2;
      let hit = false;
      if (under && !w.over) {
        const d = normalize(dx, dy);
        hit = hurtPlayer(w, b.damage, en.id, d.x, d.y, { by: en.def.id, how: 'contact' });
      }
      const def = PATTERNS[b.pattern];
      if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
      firePattern(w, def, x, y - 2, Math.atan2(dy, dx), { source: en.id, by: en.def.id, height: 2 });
      w.events.push({ type: 'stamp', x, y, w: b.ink.w, h: b.ink.h, hit, source: en.id });
      delete en.dest;
      en.volleys = b.stampEvery;
      enter(en, 'brake', b.recover);
      return;
    }
    case 'brake':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.rest[0], b.rest[1]));
      if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
      if (en.t < en.until || w.over) break;
      if ((en.volleys ?? b.stampEvery) <= 1 && dist < b.reach * 1.6) {
        // Its stamping hop: up over where the player stands (or as far as it reaches that way).
        const k = Math.min(1, b.reach / dist);
        let tx = en.x + dx * k;
        let ty = en.y + dy * k;
        if (!isClear(w, tx, ty, en.def.footRadius)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, en.def.footRadius, { x: en.x, y: en.y }));
        en.dest = { x: tx, y: ty };
        en.vx = 0;
        en.vy = 0;
        if (Math.abs(tx - en.x) > 2) en.facing = tx > en.x ? 1 : -1;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'stampRise', x: en.x, y: en.y, tx, ty, source: en.id });
        return;
      }
      // An ordinary hop, straight at the player with a little swerve (never past it).
      const swerve = w.rng.range(-0.5, 0.5);
      const ux = dx / dist;
      const uy = dy / dist;
      const d = normalize(ux - uy * swerve, uy + ux * swerve);
      const len = Math.min(w.rng.range(b.hopDist[0], b.hopDist[1]), Math.max(8, dist - 18));
      en.dirX = d.x;
      en.dirY = d.y;
      en.vx = (d.x * len) / b.hopTime;
      en.vy = (d.y * len) / b.hopTime;
      if (Math.abs(d.x) > 0.2) en.facing = d.x > 0 ? 1 : -1;
      enter(en, 'charge', b.hopTime);
      w.events.push({ type: 'hop', x: en.x, y: en.y, source: en.id });
      return;
    }
  }
  // On the floor: bullets may nudge it, friction stops it.
  approach(en, 0, 0, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/**
 * The bucket of pieces: keeps its distance like a walking turret; when its wait is over and the
 * player is in range it stops, lifts its lid (the warning) and lobs a handful of pieces: the first
 * where the player is heading, the rest scattered round it, where it would step to dodge.
 */
/** Seconds between the points of the player's path an enemy that follows it remembers. */
const TRAIL_STEP = 0.1;

/** Most points of the player's path an enemy that follows it remembers (the oldest are dropped). */
const TRAIL_MAX = 40;

/**
 * Remembers where the player has been (a point every TRAIL_STEP s) and returns the next point of
 * that path to walk to: the oldest one not reached yet, as long as the enemy keeps `delay` s of
 * path behind the player (null otherwise: it waits).
 */
function followTrail(en: Enemy, w: World, delay: number): { x: number; y: number } | null {
  const trail = (en.trail ??= []);
  if (w.tick % Math.round(TRAIL_STEP / DT) === 0) {
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(last.x - w.player.x, last.y - w.player.y) > 1) trail.push({ x: w.player.x, y: w.player.y });
    while (trail.length > TRAIL_MAX) trail.shift();
  }
  // Points already reached are left behind.
  while (trail.length > 0 && Math.hypot(trail[0]!.x - en.x, trail[0]!.y - en.y) < 4) trail.shift();
  return trail.length > Math.round(delay / TRAIL_STEP) ? trail[0]! : null;
}

function updateLobber(w: World, en: Enemy, b: LobberBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
  let walkX = 0;
  let walkY = 0;
  // (The path is remembered also while it throws, so it does not skip a stretch.)
  if (b.follow && en.state !== 'idle') followTrail(en, w, b.follow.delay);
  switch (en.state) {
    case 'warn':
      if (en.t >= en.until) {
        const mh = muzzleHeight(w, en, b.muzzleY);
        const sx = en.x + 2 * en.facing;
        for (let k = 0; k < b.count; k++) {
          const lead = k === 0 ? 0.3 : 0.15;
          const ang = w.rng.range(0, Math.PI * 2);
          const d = k === 0 ? 0 : b.spread * (0.45 + 0.55 * Math.sqrt(w.rng.next()));
          let tx = p.x + p.vx * lead + Math.cos(ang) * d;
          let ty = p.y + p.vy * lead + Math.sin(ang) * d * 0.75;
          if (!isClear(w, tx, ty, 4)) ({ x: tx, y: ty } = freeSpot(w, tx, ty, 4));
          throwFrost(w, sx, en.y, mh, tx, ty, {
            r: 7, life: b.life, slow: 1, flight: b.flight * w.rng.range(0.85, 1.15),
            brick: w.rng.int(0, BRICK_KINDS - 1), damage: b.damage, source: en.id, by: en.def.id,
          });
        }
        enter(en, 'fire', 0.35);
      }
      break;
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
      break;
    default: {
      if (en.state !== 'idle') enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
      if (en.t >= en.until && dist < b.range) {
        enter(en, 'warn', b.telegraph);
        // (It plants itself to throw.)
        if (b.follow) {
          en.vx = 0;
          en.vy = 0;
        }
        break;
      }
      if (b.follow) {
        // In your footsteps, `delay` s behind (M14b (h9c)).
        const trail = followTrail(en, w, b.follow.delay);
        if (trail) {
          const gx = trail.x - en.x;
          const gy = trail.y - en.y;
          const gl = Math.hypot(gx, gy);
          if (gl > 3) {
            walkX = (gx / gl) * b.follow.speed;
            walkY = (gy / gl) * b.follow.speed;
          }
        }
        break;
      }
      // Keeps its distance, backing off sideways (as the walking turrets do).
      const sign = dist > b.keep + 24 ? 1 : dist < b.keep - 24 ? -1 : 0;
      const side = sign < 0 ? (en.phase >= 0 ? 0.8 : -0.8) : 0;
      const ux = dx / dist;
      const uy = dy / dist;
      const mx = ux * sign - uy * side;
      const my = uy * sign + ux * side;
      const ml = Math.hypot(mx, my) || 1;
      if (sign !== 0) {
        walkX = (mx / ml) * b.speed;
        walkY = (my / ml) * b.speed;
      }
    }
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    const moved = Math.hypot(en.x - ox, en.y - oy);
    en.moved += moved;
    if ((hit.hitX || hit.hitY) && moved < b.speed * DT * 0.3) en.phase = en.phase >= 0 ? -1 : 1;
  }
}

/** Whether a photocopier can copy this enemy: alive, not a boss, a relay, a copier, an air conditioner or a copy itself, and in sight (not lying in wait or vanished). */
export function copiable(en: Enemy): boolean {
  const k = en.def.brain.kind;
  // Nor an air conditioner: one cone per room is plenty (and copies of it would pin the toaster to a wall).
  // Nor a ticket dispenser: at most one per room (two would call turns at both ends of it at once).
  // Nor a queue post: a copy would have no other post to stretch its tape to.
  if (k === 'boss' || k === 'relay' || k === 'copier' || k === 'blower' || k === 'turner' || k === 'queuer' || en.def.boss) return false;
  return en.copyOf === undefined && !isDead(en) && en.state !== 'dying' && en.state !== 'lurk' && en.state !== 'gone';
}

/** The copies of photocopier `id` still standing. */
export function copiesOf(w: World, id: number): number {
  let n = 0;
  for (const o of w.enemies) if (o.copyOf === id && !isDead(o)) n++;
  return n;
}

/** What a photocopier would copy now: the nearest copiable enemy, or none (-1) if full up or alone. */
function copyPick(w: World, en: Enemy, b: CopierBrain): number {
  if (copiesOf(w, en.id) >= b.maxCopies) return -1;
  let best = -1;
  let bestD = Infinity;
  for (const o of w.enemies) {
    if (o === en || !copiable(o)) continue;
    const d = Math.hypot(o.x - en.x, o.y - en.y);
    if (d < bestD) {
      bestD = d;
      best = o.id;
    }
  }
  return best;
}

/**
 * A photocopy of `src` slides out of the copier's tray: the same enemy, with `copyLife` of its
 * life and `copyPace` of its pace, dropping nothing. Pushed onto `w.enemies`.
 */
export function makeCopy(w: World, en: Enemy, src: Enemy, b: CopierBrain): Enemy {
  const at = freeSpot(w, en.x + en.facing * 12, en.y + 3, src.def.footRadius);
  const c = spawnEnemy(w.nextId++, src.def, at.x, at.y);
  c.copyOf = en.id;
  c.pace = b.copyPace;
  c.damageTaken = Math.floor(src.def.hp * (1 - b.copyLife));
  c.facing = en.facing;
  // Out of the tray it slides, and only then gets going.
  c.vx = en.facing * 110;
  c.vy = w.rng.range(-20, 20);
  if (src.def.brain.kind === 'chaser') {
    c.state = 'brake';
    c.until = 0.45;
  }
  w.enemies.push(c);
  w.events.push({ type: 'copyMade', x: c.x, y: c.y, copy: c.id, enemy: src.def.id, source: en.id });
  return c;
}

function updateCopier(w: World, en: Enemy, b: CopierBrain): void {
  const p = w.player;
  const dx = p.x - en.x;
  const dy = p.y - en.y;
  const dist = Math.hypot(dx, dy) || 1;
  en.t += DT;
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'warn': {
      // Lid up, standing still, the light crossing the glass; it faces whoever it copies.
      const tgt = w.enemies.find((o) => o.id === en.copyTarget);
      const fx = tgt ? tgt.x - en.x : dx;
      if (Math.abs(fx) > 2) en.facing = fx > 0 ? 1 : -1;
      if (en.t >= en.until) {
        if (tgt && copiable(tgt) && copiesOf(w, en.id) < b.maxCopies) makeCopy(w, en, tgt, b);
        else {
          // Nobody left to copy: it prints at you instead.
          const def = PATTERNS[b.pattern];
          if (!def) throw new Error(`Unknown pattern ${b.pattern}`);
          const mh = muzzleHeight(w, en, b.muzzleY);
          if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
          firePattern(w, def, en.x + en.facing * 8, en.y - mh, Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - en.x - en.facing * 8), { telegraph: 0, source: en.id, by: en.def.id, height: mh });
        }
        en.copyTarget = -1;
        enter(en, 'brake', b.recover);
      }
      break;
    }
    case 'brake':
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.interval[0], b.interval[1]));
      break;
    case 'walk': {
      if (Math.abs(dx) > 2) en.facing = dx > 0 ? 1 : -1;
      if (en.t >= en.until && !w.over) {
        en.copyTarget = copyPick(w, en, b);
        enter(en, 'warn', b.telegraph);
        // It plants itself to lift the lid (it may have been scurrying to its hiding place).
        en.vx = 0;
        en.vy = 0;
        w.events.push({ type: 'copyScan', x: en.x, y: en.y - b.muzzleY, target: en.copyTarget, source: en.id });
        break;
      }
      // M14b (h9d): it hides behind whoever is nearest, so they take the shots.
      const spot = b.hide ? hideSpot(w, en, b.hide.gap) : null;
      if (b.hide && spot) {
        const hx = spot.x - en.x;
        const hy = spot.y - en.y;
        const hd = Math.hypot(hx, hy);
        if (hd > 3) {
          const v = b.hide.speed * Math.min(1, hd / 14);
          walkX = (hx / hd) * v;
          walkY = (hy / hd) * v;
        }
        break;
      }
      // Keeps its distance, backing off sideways (as the walking turrets do).
      const sign = dist > b.keep + 24 ? 1 : dist < b.keep - 24 ? -1 : 0;
      const side = sign < 0 ? (en.phase >= 0 ? 0.8 : -0.8) : 0;
      const ux = dx / dist;
      const uy = dy / dist;
      const mx = ux * sign - uy * side;
      const my = uy * sign + ux * side;
      const ml = Math.hypot(mx, my) || 1;
      if (sign !== 0) {
        walkX = (mx / ml) * b.speed;
        walkY = (my / ml) * b.speed;
      }
      break;
    }
    default:
      // Its first copy comes a little sooner than the next ones.
      enter(en, 'walk', w.rng.range(b.interval[0], b.interval[1]) * 0.6);
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    const moved = Math.hypot(en.x - ox, en.y - oy);
    en.moved += moved;
    if ((hit.hitX || hit.hitY) && moved < b.speed * DT * 0.3) en.phase = en.phase >= 0 ? -1 : 1;
  }
}

/** A photocopier does not hide behind anyone closer than this (px) to the player. */
export const HIDE_NOT_NEARER = 80;

/**
 * Where a photocopier hides (CopierBrain.hide): `gap` px behind the nearest other enemy that is
 * up and about (not another copier, nor one hidden or gone, nor one closer than HIDE_NOT_NEARER
 * to the player), on the far side from the player; or, with that one in the way, a point beside it
 * to go round it by. Null if there is nobody to hide behind.
 */
export function hideSpot(w: World, en: Enemy, gap: number): { x: number; y: number } | null {
  let best: Enemy | null = null;
  let bestD = Infinity;
  for (const o of w.enemies) {
    if (o === en || isDead(o) || o.state === 'dying' || o.state === 'lurk' || o.state === 'gone') continue;
    if (o.def.brain.kind === 'copier') continue;
    // Not behind one in the thick of it: that is too close to the toaster for a photocopier.
    if (Math.hypot(o.x - w.player.x, o.y - w.player.y) < HIDE_NOT_NEARER) continue;
    const d = Math.hypot(o.x - en.x, o.y - en.y);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  if (!best) return null;
  const p = w.player;
  const ax = best.x - p.x;
  const ay = best.y - p.y;
  const al = Math.hypot(ax, ay) || 1;
  const spot = { x: best.x + (ax / al) * gap, y: best.y + (ay / al) * gap };
  // Its shield in the way there: round it first, on whichever side it already is.
  const sx = spot.x - en.x;
  const sy = spot.y - en.y;
  const sl = Math.hypot(sx, sy);
  if (sl > 1) {
    const k = Math.max(0, Math.min(1, ((best.x - en.x) * sx + (best.y - en.y) * sy) / (sl * sl)));
    const cx = en.x + sx * k - best.x;
    const cy = en.y + sy * k - best.y;
    const clear = best.def.footRadius + en.def.footRadius + 10;
    if (k > 0 && k < 1 && Math.hypot(cx, cy) < clear) {
      let nx = -sy / sl;
      let ny = sx / sl;
      if (nx * (en.x - best.x) + ny * (en.y - best.y) < 0) {
        nx = -nx;
        ny = -ny;
      }
      return { x: best.x + nx * (clear + 6), y: best.y + ny * (clear + 6) };
    }
  }
  return spot;
}

function muzzleHeight(w: World, en: Enemy, muzzleY: number): number {
  let h = 0;
  while (h < muzzleY && !isWallAt(w.room, en.x, en.y - h - 3)) h++;
  return h;
}

/** Flying: moves freely over props, only the room walls stop it (axis by axis). */
function fly(w: World, en: Enemy): void {
  const blocked = (x: number, y: number): boolean => {
    const box = playerFeetBox({ x, y }, en.def.footRadius);
    const walls: Rect[] = [];
    wallRectsNear(w.room, box, walls);
    return walls.some((r) => overlaps(r, box));
  };
  const nx = en.x + en.vx * DT;
  if (blocked(nx, en.y)) en.vx = 0;
  else en.x = nx;
  const ny = en.y + en.vy * DT;
  if (blocked(en.x, ny)) en.vy = 0;
  else en.y = ny;
}

function updateMoth(w: World, en: Enemy, b: MothBrain): void {
  const p = w.player;
  const owner = en.owner >= 0 ? w.enemies.find((o) => o.id === en.owner) : undefined;
  en.t += DT;
  // Moths love light: it circles faster and closer while its bulb is lit and firing.
  const lit = owner?.state === 'fire';
  const dim = owner?.state === 'off';
  const centre = owner ?? p;
  const radius = owner ? b.orbitRadius * (lit ? 0.75 : 1) : b.orbitRadius * 2.2;
  en.phase += b.orbitSpeed * (lit ? 1.8 : dim ? 0.5 : 1) * DT;
  const toPX = p.x - en.x;
  const toPY = p.y - en.y;
  switch (en.state) {
    case 'idle': {
      // Its place in the orbit, with a little wobble so the flight is not a perfect circle.
      const wob = Math.sin(en.phase * 3.7) * 4;
      const tx = centre.x + Math.cos(en.phase) * (radius + wob);
      const ty = centre.y + Math.sin(en.phase) * (radius + wob) * 0.6;
      const dx = tx - en.x;
      const dy = ty - en.y;
      const d = Math.hypot(dx, dy);
      const sp = Math.min(b.flySpeed, d * 6);
      approach(en, d > 0 ? (dx / d) * sp : 0, d > 0 ? (dy / d) * sp : 0, 600);
      if (Math.abs(en.vx) > 5) en.facing = en.vx > 0 ? 1 : -1;
      if (en.t >= en.until && Math.hypot(toPX, toPY) < b.range && !dim) {
        const dir = normalize(toPX, toPY);
        en.dirX = dir.x;
        en.dirY = dir.y;
        en.facing = dir.x >= 0 ? 1 : -1;
        enter(en, 'warn', b.telegraph);
        w.events.push({ type: 'telegraph', x: en.x, y: en.y - b.altitude, time: b.telegraph, aim: Math.atan2(dir.y, dir.x), aimed: true, color: 'red', source: en.id });
      }
      break;
    }
    case 'warn':
      approach(en, 0, 0, 900);
      if (en.t >= en.until) {
        enter(en, 'charge', b.dartTime);
        en.vx = en.dirX * b.dartSpeed;
        en.vy = en.dirY * b.dartSpeed;
        w.events.push({ type: 'dart', x: en.x, y: en.y - b.altitude, dirX: en.dirX, dirY: en.dirY, source: en.id });
      }
      break;
    case 'charge':
      en.vx = en.dirX * b.dartSpeed;
      en.vy = en.dirY * b.dartSpeed;
      if (en.t >= en.until) enter(en, 'brake', 0.35);
      break;
    case 'brake':
      approach(en, 0, 0, 500);
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
      break;
    default:
      enter(en, 'idle', 0.5);
  }
  const ox = en.x;
  const oy = en.y;
  fly(w, en);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
}

/** Bumping into an enemy pushes the player away (damage arrives with the hearts in M2). */
function contact(w: World, en: Enemy): void {
  const p = w.player;
  if (en.contactCooldown > 0 || isRolling(p) || w.over || en.state === 'blink' || en.state === 'gone' || en.state === 'lurk') return;
  // Harmless to touch (a loot box).
  if (en.def.contactDamage <= 0) return;
  const pb = playerFeetBox(p, p.def.footRadius + 2);
  const eb = { x: en.x - en.def.footRadius - 2, y: en.y - 10, w: (en.def.footRadius + 2) * 2, h: 12 };
  if (!overlaps(pb, eb)) return;
  let d = normalize(p.x - en.x, p.y - en.y);
  if (d.x === 0 && d.y === 0) d = { x: en.dirX, y: en.dirY };
  const push = en.state === 'charge' ? en.def.contactPush : en.def.contactPush * 0.5;
  if (en.def.brain.kind === 'moth' && en.state !== 'charge') return; // it only bumps into you when it dives
  // A stamp up in the air to stamp hurts by stamping (updateStamper), not by brushing past.
  if (en.def.brain.kind === 'stamper' && (en.state === 'warn' || en.state === 'fire')) return;
  p.vx += d.x * push;
  p.vy += d.y * push;
  en.contactCooldown = 0.5;
  hurtPlayer(w, en.def.contactDamage, en.id, d.x, d.y, { by: en.def.id, how: 'contact' });
  w.events.push({ type: 'contact', x: (p.x + en.x) / 2, y: (p.y + en.y) / 2 - HAND_HEIGHT, dirX: d.x, dirY: d.y, source: en.id });
}
