// Enemy behaviours. Each brain kind in src/data/types.ts has an update function here; the numbers
// come from the enemy's data.
import type { ChargerBrain } from '../data/types.ts';
import { normalize, overlaps } from './vec.ts';
import { DT, HAND_HEIGHT, isRolling, playerFeetBox, slide, type Enemy, type World } from './world.ts';

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

/** Bumping into an enemy pushes the player away (damage arrives with the hearts in M2). */
function contact(w: World, en: Enemy): void {
  const p = w.player;
  if (en.contactCooldown > 0 || isRolling(p)) return;
  const pb = playerFeetBox(p, p.def.footRadius + 2);
  const eb = { x: en.x - en.def.footRadius - 2, y: en.y - 10, w: (en.def.footRadius + 2) * 2, h: 12 };
  if (!overlaps(pb, eb)) return;
  let d = normalize(p.x - en.x, p.y - en.y);
  if (d.x === 0 && d.y === 0) d = { x: en.dirX, y: en.dirY };
  const push = en.state === 'charge' ? en.def.contactPush : en.def.contactPush * 0.5;
  p.vx += d.x * push;
  p.vy += d.y * push;
  en.contactCooldown = 0.5;
  w.events.push({ type: 'contact', x: (p.x + en.x) / 2, y: (p.y + en.y) / 2 - HAND_HEIGHT, dirX: d.x, dirY: d.y, source: en.id });
}
