// Enemy behaviours. Each brain kind in src/data/types.ts has an update function here; the numbers
// come from the enemy's data.
import type { BlinkerBrain, BossAttack, BossBrain, ChargerBrain, ChaserBrain, MothBrain, TurretBrain } from '../data/types.ts';
import { PATTERNS } from '../data/patterns.ts';
import { EXPIRED_PRODUCTS } from '../data/props.ts';
import { patternDuration } from './patterns.ts';
import { normalize, overlaps, type Rect } from './vec.ts';
import { isWallAt, wallRectsNear } from './room.ts';
import { BOSS_PHASE_BREAK, clearEnemyFire, DT, firePattern, freeSpot, HAND_HEIGHT, hurtPlayer, isClear, isRolling, playerFeetBox, slide, throwFrost, type Enemy, type World } from './world.ts';

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
    firePattern(w, def, en.x, en.y - mh, Math.atan2(toY + b.muzzleY - mh, toX), { telegraph: b.telegraph, source: en.id, by: en.def.id, height: mh });
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
    if (announced) {
      // Between phases it stops, shrugs bullets off and clears the screen: a breath, and the
      // phase's name, before the new attacks.
      w.events.push({ type: 'bossPhase', boss: en.id, phase: phaseIdx, name: b.phases[phaseIdx]!.name });
      clearEnemyFire(w);
      enter(en, 'roar', BOSS_PHASE_BREAK);
    }
  }
  const phase = b.phases[en.bossPhase]!;
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
  if (en.contactCooldown > 0 || isRolling(p) || w.over || en.state === 'blink' || en.state === 'gone') return;
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
