// Enemy behaviours. Each brain kind in src/data/types.ts has an update function here; the numbers
// come from the enemy's data.
import type { BlinkerBrain, BossAttack, BossBrain, RelayBrain, ChargerBrain, ChaserBrain, LaggerBrain, MimicBrain, MothBrain, TurretBrain, WatcherBrain } from '../data/types.ts';
import { ENEMIES } from '../data/enemies.ts';
import { PATTERNS } from '../data/patterns.ts';
import { EXPIRED_PRODUCTS } from '../data/props.ts';
import { patternDuration } from './patterns.ts';
import { normalize, overlaps, type Rect } from './vec.ts';
import { isWallAt, TILE, wallRectsNear } from './room.ts';
import {
  BOSS_PHASE_BREAK,
  clearEnemyFire,
  DT,
  firePattern,
  freeSpot,
  HAND_HEIGHT,
  hurtPlayer,
  isClear,
  isRolling,
  playerFeetBox,
  slide,
  spawnEnemy,
  throwFrost,
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
    }
    // Watched live: the time it waits between attacks runs faster.
    if (en.rush) {
      if ((en.state === 'walk' || en.state === 'idle') && en.t < en.until) en.t += DT * (en.rush.scale - 1);
      en.rush.t -= DT;
      if (en.rush.t <= 0) delete en.rush;
    }
    contact(w, en);
  }
  separate(w);
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
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
      break;
    case 'stun':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.walkTime[0], b.walkTime[1]));
      break;
  }

  const ox = en.x;
  const oy = en.y;
  const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
  en.moved += Math.hypot(en.x - ox, en.y - oy);
  if (en.state === 'charge' && ((hit.hitX && Math.abs(en.dirX) > 0.3) || (hit.hitY && Math.abs(en.dirY) > 0.3))) {
    w.events.push({ type: 'bonk', x: en.x + en.dirX * en.def.footRadius, y: en.y - 6, dirX: en.dirX, dirY: en.dirY, source: en.id });
    enter(en, 'stun', b.stun);
    // Small bounce back off the wall.
    en.vx = -en.dirX * 60;
    en.vy = -en.dirY * 60;
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
      if (en.t >= en.until) enter(en, 'brake', b.recover);
      break;
    case 'brake':
      approach(en, 0, 0, b.brake);
      if (en.t >= en.until) enter(en, 'walk', w.rng.range(b.cooldown[0], b.cooldown[1]) / k);
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
      if (sign !== 0) {
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
      // Just a charger on the floor... until you come close or shoot it.
      if ((dist < b.wake && !w.over) || en.damageTaken > 0) {
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
  // Bullets and bumps may still nudge it if its data allows.
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    const hit = slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
    // Stuck against something while walking: sidestep the other way next time.
    if (b.walk && (hit.hitX || hit.hitY) && Math.hypot(en.x - ox, en.y - oy) < b.walk.speed * DT * 0.3) en.phase = en.phase >= 0 ? -1 : 1;
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
function pickAttack(w: World, attacks: readonly BossAttack[], last: number | undefined): number {
  let total = 0;
  for (let i = 0; i < attacks.length; i++) if (i !== last || attacks.length === 1) total += attacks[i]!.weight;
  let r = w.rng.range(0, total);
  for (let i = 0; i < attacks.length; i++) {
    if (i === last && attacks.length > 1) continue;
    r -= attacks[i]!.weight;
    if (r < 0) return i;
  }
  return attacks.length - 1;
}

/**
 * A boss: shuffles closer if you keep away, then picks an attack of its phase, warns and does it. A
 * pattern comes out of its muzzle; frost is lobbed at the player and around it at the end of the
 * warning. Moving into a new phase is announced (event `bossPhase`).
 */
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
      w.events.push(ev);
      clearEnemyFire(w);
      enter(en, 'roar', next.reboot?.time ?? BOSS_PHASE_BREAK);
    }
    en.relayT = 0;
    if (next.relays && next.relays.count > 0) plantRelays(w, en, next.relays.id, next.relays.count);
  }
  const phase = b.phases[en.bossPhase]!;
  // Without relays left, it plants a new one now and then (if the phase says so).
  if (phase.relays?.every && en.state !== 'roar' && !w.over) {
    if (relaysOf(w, en).length > 0) en.relayT = 0;
    else if ((en.relayT = (en.relayT ?? 0) + DT) >= phase.relays.every) {
      en.relayT = 0;
      plantRelays(w, en, phase.relays.id, 1);
    }
  }
  const toX = p.x - en.x;
  if (Math.abs(toX) > 4 && en.state !== 'fire') en.facing = toX > 0 ? 1 : -1;
  const mx = en.x + b.muzzle.x * en.facing;
  const mh = muzzleHeight(w, en, b.muzzle.y);
  let walkX = 0;
  let walkY = 0;
  switch (en.state) {
    case 'idle': {
      // Comes closer when you keep away, slowly (it is a fridge); it never backs off: the
      // Management does not give ground (and backed against the wall it would leave the picture).
      const d = Math.hypot(p.x - en.x, p.y - en.y) || 1;
      const sign = d > phase.keep + 30 ? 1 : 0;
      walkX = ((p.x - en.x) / d) * sign * phase.walkSpeed;
      walkY = ((p.y - en.y) / d) * sign * phase.walkSpeed;
      if (en.t >= en.until && !w.over) {
        const i = pickAttack(w, phase.attacks, en.attack);
        en.attack = i;
        const a = phase.attacks[i]!;
        const aim = Math.atan2(p.y - HAND_HEIGHT - (en.y - mh), p.x - mx);
        if (a.kind === 'pattern') {
          const def = PATTERNS[a.pattern];
          if (!def) throw new Error(`Unknown pattern ${a.pattern}`);
          firePattern(w, def, mx, en.y - mh, aim, { telegraph: a.telegraph, source: en.id, by: en.def.id, height: mh });
          enter(en, 'fire', a.telegraph + patternDuration(def) + 0.25);
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
        } else {
          // Frost and spit warn by themselves (see activeWarnings): the ring closes on the dispenser
          // (or on the open door).
          enter(en, 'warn', a.telegraph);
          const at = bossWarnSpot(en, b, a);
          w.events.push({ type: 'telegraph', x: at.x, y: at.y, time: a.telegraph, aim, aimed: false, color: a.kind === 'spit' ? 'red' : 'ice', source: en.id });
        }
      }
      break;
    }
    case 'warn': {
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
            const opts = { r: a.radius, life: a.life, slow: a.slow, flight: a.flight * w.rng.range(0.9, 1.1), source: en.id, by: en.def.id };
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
            const product = w.rng.int(0, EXPIRED_PRODUCTS.length - 1);
            throwFrost(w, sx, en.y, sh, tx, ty, { r: 12, life: 0, slow: 1, flight: a.flight * w.rng.range(0.75, 1.25), shatter: a.burst, product, source: en.id, by: en.def.id });
          }
        }
        enter(en, 'fire', 0.5);
      }
      break;
    }
    case 'fire':
      if (en.t >= en.until) enter(en, 'idle', w.rng.range(phase.rest[0], phase.rest[1]));
      break;
    case 'roar':
      if (en.t >= en.until) enter(en, 'idle', 0.5);
      break;
    default:
      // First tick after its entrance: a short breath, then the first attack.
      enter(en, 'idle', 0.6);
  }
  approach(en, walkX, walkY, KNOCK_FRICTION);
  if (en.vx !== 0 || en.vy !== 0) {
    const ox = en.x;
    const oy = en.y;
    slide(w, en, en.def.footRadius, en.vx * DT, en.vy * DT);
    en.moved += Math.hypot(en.x - ox, en.y - oy);
  }
}

/** Height a dropped connection bursts at (px above the floor). */
const DROP_HEIGHT = 3;

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

/** Where a boss attack that warns by itself shows its warning: the dispenser, or the open door. */
export function bossWarnSpot(en: Enemy, b: BossBrain, a: BossAttack): { x: number; y: number } {
  const at = a.kind === 'spit' ? a.from : b.muzzle;
  return { x: en.x + at.x * en.facing, y: en.y - at.y };
}

/** Height its bullets come out at: `muzzleY` above the feet, lower if a wall is right above it. */
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
  const pb = playerFeetBox(p, p.def.footRadius + 2);
  const eb = { x: en.x - en.def.footRadius - 2, y: en.y - 10, w: (en.def.footRadius + 2) * 2, h: 12 };
  if (!overlaps(pb, eb)) return;
  let d = normalize(p.x - en.x, p.y - en.y);
  if (d.x === 0 && d.y === 0) d = { x: en.dirX, y: en.dirY };
  const push = en.state === 'charge' ? en.def.contactPush : en.def.contactPush * 0.5;
  if (en.def.brain.kind === 'moth' && en.state !== 'charge') return; // it only bumps into you when it dives
  p.vx += d.x * push;
  p.vy += d.y * push;
  en.contactCooldown = 0.5;
  hurtPlayer(w, en.def.contactDamage, en.id, d.x, d.y, { by: en.def.id, how: 'contact' });
  w.events.push({ type: 'contact', x: (p.x + en.x) / 2, y: (p.y + en.y) / 2 - HAND_HEIGHT, dirX: d.x, dirY: d.y, source: en.id });
}
