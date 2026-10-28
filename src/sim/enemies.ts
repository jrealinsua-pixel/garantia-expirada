// Enemy behaviours. Each brain kind in src/data/types.ts has an update function here; the numbers
// come from the enemy's data.
import type { ChargerBrain, MothBrain, TurretBrain } from '../data/types.ts';
import { PATTERNS } from '../data/patterns.ts';
import { patternDuration } from './patterns.ts';
import { normalize, overlaps, type Rect } from './vec.ts';
import { isWallAt, wallRectsNear } from './room.ts';
import { DT, firePattern, HAND_HEIGHT, hurtPlayer, isRolling, playerFeetBox, slide, type Enemy, type World } from './world.ts';

/** Bullets push enemies; this friction brings them back to their own speed. */
const KNOCK_FRICTION = 900;

export function updateEnemies(w: World): void {
  for (const en of w.enemies) {
    en.hitT = Math.max(0, en.hitT - DT);
    en.contactCooldown = Math.max(0, en.contactCooldown - DT);
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
    }
    contact(w, en);
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

function updateTurret(w: World, en: Enemy, b: TurretBrain): void {
  const p = w.player;
  const toX = p.x - en.x;
  const toY = p.y - HAND_HEIGHT - (en.y - b.muzzleY);
  const dist = Math.hypot(toX, toY);
  en.t += DT;
  if (Math.abs(toX) > 2 && en.state !== 'fire') en.facing = toX > 0 ? 1 : -1;
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
    firePattern(w, def, en.x, en.y - mh, Math.atan2(toY + b.muzzleY - mh, toX), { telegraph: b.telegraph, source: en.id, by: en.def.id });
    enter(en, 'fire', b.telegraph + patternDuration(def));
  } else if (en.state === 'fire' && en.t >= en.until) {
    enter(en, 'idle', w.rng.range(b.interval[0], b.interval[1]));
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
  if (en.contactCooldown > 0 || isRolling(p) || w.over) return;
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
