// A simple bot player that drives the simulation through the same Input as a human.
// Used by `npm run bot` and by tests to measure balance and detect hangs.
import { Rng } from './rng.ts';
import { ACTIVE_ITEMS } from '../data/items.ts';
import { FROST_FLAT, HAND_HEIGHT, isRolling, PLAYER_HURT_Y, type Input, type World } from './world.ts';
import { isWallAt, TILE } from './room.ts';
import { blockedTiles, clearLine, doorGoal, nextDoor, steer, type Point } from './nav.ts';

/** What the dodging part of the bot wants this tick. */
interface Dodge {
  /** Avoidance direction (not normalised; zero when nothing threatens) and how urgent it is (0..1). */
  x: number;
  y: number;
  urgency: number;
  roll: boolean;
  rollX: number;
  rollY: number;
}

/** How far ahead the bot looks at bullets (s), and how close a pass counts as a hit (px). */
const LOOKAHEAD = 0.55;
const DANGER = 11;
/** Seconds a bullet has to be in the air before the bot «sees» it: a human's reaction time, roughly. */
export const BOT_REACTION = 0.2;

/**
 * Basic dodging, enough to measure difficulty: sidesteps bullets that will pass close, rolls
 * through the ones about to land, gets out of the vacuum's path and keeps a little distance.
 */
export function dodge(w: World): Dodge {
  const p = w.player;
  const bx = p.x;
  const by = p.y - PLAYER_HURT_Y;
  const out: Dodge = { x: 0, y: 0, urgency: 0, roll: false, rollX: 0, rollY: 0 };
  let soonest = Infinity;
  for (const b of w.bullets) {
    if (b.owner !== 'enemy' || b.age < BOT_REACTION) continue;
    const rx = bx - b.x;
    const ry = by - b.y;
    const v2 = b.vx * b.vx + b.vy * b.vy;
    if (v2 < 1) continue;
    // Time of closest approach and how close it gets.
    const t = (rx * b.vx + ry * b.vy) / v2;
    if (t < 0 || t > LOOKAHEAD) continue;
    const cx = b.x + b.vx * t - bx;
    const cy = b.y + b.vy * t - by;
    const miss = Math.hypot(cx, cy);
    if (miss > DANGER + 8) continue;
    // Step away from the closest point of its path (sideways to the bullet).
    const k = (1 - t / LOOKAHEAD) * (miss < DANGER ? 1 : 0.4);
    const v = Math.sqrt(v2);
    let sx = -cx;
    let sy = -cy;
    if (Math.hypot(sx, sy) < 0.5) {
      sx = -b.vy / v;
      sy = b.vx / v;
    }
    const sl = Math.hypot(sx, sy);
    out.x += (sx / sl) * k;
    out.y += (sy / sl) * k;
    if (miss < DANGER && t < soonest) {
      soonest = t;
      out.rollX = -b.vy / v;
      out.rollY = b.vx / v;
      // Roll to the side that leads away from its path.
      if (out.rollX * sx + out.rollY * sy < 0) {
        out.rollX = -out.rollX;
        out.rollY = -out.rollY;
      }
    }
  }
  for (const en of w.enemies) {
    const dx = p.x - en.x;
    const dy = p.y - en.y;
    const d = Math.hypot(dx, dy) || 1;
    // The locked line of a charge or a lunge: get off it, roll if it is already coming.
    const kind = en.def.brain.kind;
    if (((en.state === 'warn' && en.t >= BOT_REACTION) || en.state === 'charge') && (kind === 'charger' || kind === 'chaser')) {
      const along = dx * en.dirX + dy * en.dirY;
      const side = dx * -en.dirY + dy * en.dirX;
      if (along > -8 && Math.abs(side) < 22) {
        const sgn = side >= 0 ? 1 : -1;
        const k = en.state === 'charge' ? 1 : 0.7;
        out.x += -en.dirY * sgn * k * 1.5;
        out.y += en.dirX * sgn * k * 1.5;
        if (en.state === 'charge' && along < 70 && along / 230 < soonest) {
          soonest = along / 230;
          out.rollX = -en.dirY * sgn;
          out.rollY = en.dirX * sgn;
        }
      }
    }
    // A little personal space from everything that bumps.
    if (d < 46) {
      out.x += (dx / d) * (1 - d / 46) * 0.8;
      out.y += (dy / d) * (1 - d / 46) * 0.8;
    }
  }
  // Frost: walk out of a patch, and away from where a ball is about to land (once it has seen it).
  for (const f of w.frost) {
    if (f.t < 0 && f.t + f.flight < BOT_REACTION) continue;
    const dx = p.x - f.x;
    const dy = (p.y - f.y) / FROST_FLAT;
    const d = Math.hypot(dx, dy) || 1;
    const reach = f.r + 8;
    if (d > reach) continue;
    const k = (1 - d / reach) * (f.t < 0 ? 0.9 : 0.5);
    out.x += (dx / d) * k;
    out.y += (dy / d) * k;
  }
  // Do not dodge into a wall.
  const ahead = 18;
  const l = Math.hypot(out.x, out.y);
  if (l > 0 && isWallAt(w.room, p.x + (out.x / l) * ahead, p.y + (out.y / l) * ahead)) {
    if (!isWallAt(w.room, p.x + (out.x / l) * ahead, p.y)) out.y = 0;
    else if (!isWallAt(w.room, p.x, p.y + (out.y / l) * ahead)) out.x = 0;
  }
  out.urgency = Math.min(1, Math.hypot(out.x, out.y));
  if (soonest < 0.2 && !isRolling(p) && p.rollCooldown <= 0) {
    out.roll = true;
    if (isWallAt(w.room, p.x + out.rollX * 40, p.y + out.rollY * 40)) {
      out.rollX = -out.rollX;
      out.rollY = -out.rollY;
    }
  }
  return out;
}

export class Bot {
  private rng: Rng;
  private target: { x: number; y: number } | null = null;
  private retargetIn = 0;
  private burst = 0;
  private lastPos = { x: 0, y: 0, t: 0 };
  /** Times it tried to move and did not get anywhere for a while. */
  stuck = 0;
  /** Ticks to leave the coupons alone (after getting stuck going for one). */
  private ignorePickups = 0;
  /** Ticks before it may change weapon again. */
  private swapIn = 0;

  /** Whether it tries to dodge (off, it is the old bot that only walks around and shoots). */
  readonly dodges: boolean;

  constructor(seed: string, opts: { dodge?: boolean } = {}) {
    this.rng = new Rng('bot:' + seed);
    this.dodges = opts.dodge ?? true;
  }

  /**
   * On a floor, where to go now: with enemies about, towards the nearest one if it is far or
   * behind something (around the shelves), else somewhere close by to keep moving; with the room
   * clear, out through the door that leads to the nearest room not visited yet. Null = keep the
   * current wandering target.
   */
  private floorGoal(w: World): Point | null {
    const p = w.player;
    const r = p.def.footRadius;
    const blocked = blockedTiles(w, r);
    const foes = w.enemies.filter((e) => e.state !== 'gone');
    if (foes.length > 0) {
      let near = foes[0]!;
      for (const e of foes) if (Math.hypot(e.x - p.x, e.y - p.y) < Math.hypot(near.x - p.x, near.y - p.y)) near = e;
      const d = Math.hypot(near.x - p.x, near.y - p.y);
      if (d > 130 || !clearLine(w, p, near, 1)) return steer(w, near, r, blocked);
      // Close and in sight: wander nearby on free floor, steering around things.
      if (!this.target || this.retargetIn === this.retargetSet) {
        for (let k = 0; k < 8; k++) {
          const c = Math.floor((p.x + this.rng.range(-110, 110)) / TILE);
          const rr = Math.floor((p.y + this.rng.range(-80, 80)) / TILE);
          if (c < 0 || rr < 0 || c >= w.room.cols || rr >= w.room.rows || blocked[rr * w.room.cols + c]) continue;
          this.wander = { x: c * TILE + TILE / 2, y: rr * TILE + TILE / 2 + 2 };
          break;
        }
      }
      return this.wander ? steer(w, this.wander, r, blocked) : null;
    }
    // A weapon or an item on a pedestal: go and get it (unless it got stuck going for something).
    const arm = this.ignorePickups > 0 ? undefined : w.pickups.find((k) => (k.kind === 'arma' || k.kind === 'objeto') && k.price === undefined);
    if (arm) return steer(w, { x: arm.x, y: arm.y }, r, blocked);
    // In the shop: buy what it can pay for (an item first, a heart if hurt, then a ticket).
    const buy = this.ignorePickups > 0 ? undefined : this.shopping(w);
    if (buy) return steer(w, { x: buy.x, y: buy.y }, r, blocked);
    // A shut chest and a ticket to open it: walk into its front.
    const chest = p.tickets > 0 && this.ignorePickups <= 0 ? w.room.props.find((pr) => pr.chest && !pr.chest.open) : undefined;
    if (chest) return steer(w, { x: chest.x, y: chest.y + 4 }, r, blocked);
    // The boss has fallen: down the goods lift, once there is nothing left to see on the floor.
    if (w.lift && nextDoor(w) === null) return steer(w, { x: w.lift.x, y: w.lift.y }, r, blocked);
    const dir = nextDoor(w, w.floor?.layout.boss);
    const door = dir ? w.room.doors.find((d) => d.dir === dir) : undefined;
    if (!door) return null;
    return steer(w, doorGoal(door), r, blocked);
  }

  /**
   * Whether to use the active item now (only when charged): the glue when hurt, the survey or
   * the hold music when the air is thick with enemy bullets near it.
   */
  private wantsActive(w: World): boolean {
    const p = w.player;
    if (!p.active || w.tick % 10 !== 0 || p.active.charge < (ACTIVE_ITEMS[p.active.id]?.charges ?? Infinity)) return false;
    if (p.active.id === 'pegamento') return p.hp <= p.def.maxHp - 2;
    let near = 0;
    for (const b of w.bullets) if (b.owner === 'enemy' && Math.hypot(b.x - p.x, b.y - p.y) < 90) near++;
    return near >= 6;
  }

  /** The good on sale it wants next, if it can pay for it. */
  private shopping(w: World): Point | undefined {
    const p = w.player;
    const rank = (k: (typeof w.pickups)[number]): number =>
      k.kind === 'corazon' ? (p.hp <= p.def.maxHp - 2 ? 1 : -1) : k.kind === 'ticket' ? 2 : k.kind === 'activo' && p.active ? -1 : 0;
    let best: (typeof w.pickups)[number] | undefined;
    for (const k of w.pickups) {
      if (k.price === undefined || k.price > p.coupons || rank(k) < 0) continue;
      if (!best || rank(k) < rank(best)) best = k;
    }
    return best;
  }

  private wander: Point | null = null;
  private retargetSet = 0;

  /** Whether it has walked into every room of the floor (normal doors only). */
  static explored(w: World): boolean {
    const f = w.floor;
    return !!f && f.layout.rooms.every((fr) => fr.kind === 'secret' || f.rooms[fr.id]!.visited);
  }

  think(w: World): Input {
    const p = w.player;
    const r = w.room;
    this.retargetIn--;
    if (!this.target || this.retargetIn <= 0 || Math.hypot(this.target.x - p.x, this.target.y - p.y) < 8) {
      this.target = { x: this.rng.range(40, r.w - 40), y: this.rng.range(64, r.h - 40) };
      this.retargetIn = this.rng.int(60, 240);
      this.retargetSet = this.retargetIn;
    }
    if (w.tick - this.lastPos.t >= 180) {
      if (Math.hypot(p.x - this.lastPos.x, p.y - this.lastPos.y) < 3) {
        this.stuck++;
        this.target = null;
        this.ignorePickups = 240;
      }
      this.lastPos = { x: p.x, y: p.y, t: w.tick };
    }
    if (w.floor) {
      const plan = this.floorGoal(w);
      if (plan) this.target = plan;
    } else if (w.enemies.length === 0 && this.ignorePickups <= 0 && this.shopping(w)) {
      // A shop on its own: the same shopping as on a floor.
      this.target = steer(w, this.shopping(w)!, p.def.footRadius, blockedTiles(w, p.def.footRadius));
    } else if (w.lift && w.enemies.length === 0) {
      // A single room with the lift up (the boss fight): straight to it.
      this.target = steer(w, { x: w.lift.x, y: w.lift.y }, p.def.footRadius, blockedTiles(w, p.def.footRadius));
    }
    // Coupons lying close by are worth a detour.
    let goal = this.target;
    let near = 110;
    if (this.ignorePickups > 0) this.ignorePickups--;
    else for (const k of w.pickups) {
      if ((k.kind === 'corazon' && p.hp >= p.def.maxHp) || k.price !== undefined) continue;
      const d = Math.hypot(k.x - p.x, k.y - p.y);
      if (d < near) {
        near = d;
        goal = { x: k.x, y: k.y };
      }
    }
    const gx = (goal?.x ?? p.x) - p.x;
    const gy = (goal?.y ?? p.y) - p.y;
    const gl = Math.hypot(gx, gy) || 1;
    // Mix where it wants to go with getting out of the way; danger wins.
    const dg = this.dodges ? dodge(w) : null;
    const u = dg ? dg.urgency : 0;
    const tx = (gx / gl) * (1 - u) + (dg ? dg.x : 0) * 2;
    const ty = (gy / gl) * (1 - u) + (dg ? dg.y : 0) * 2;
    const l = Math.hypot(tx, ty) || 1;
    // Aim at the nearest target, with a little wobble.
    let aimX = p.x + 50;
    let aimY = p.y - HAND_HEIGHT;
    let best = Infinity;
    // Enemies first; the dummies only when the room is empty.
    const targets = w.enemies.length ? w.enemies.filter((e) => e.state !== 'gone').map((e) => ({ x: e.x, y: e.y, k: 1 })) : w.dummies.map((d) => ({ x: d.x, y: d.y, k: 1 }));
    for (const d of targets) {
      const dd = Math.hypot(d.x - p.x, d.y - p.y) * d.k;
      if (dd < best) {
        best = dd;
        aimX = d.x + this.rng.range(-6, 6);
        aimY = d.y - 16 + this.rng.range(-6, 6);
      }
    }
    if (this.burst <= 0 && this.rng.chance(0.03)) this.burst = this.rng.int(10, 50);
    // On a floor it only shoots when there is someone to shoot at.
    const fire = this.burst > 0 && (!w.floor || targets.length > 0);
    this.burst--;
    // The right tool for the distance: the iron up close, the stapler at mid range, else the dryer.
    let swap = 0;
    this.swapIn--;
    if (p.arsenal.length > 1 && this.swapIn <= 0 && targets.length > 0) {
      const has = (id: string): boolean => p.arsenal.some((ws) => ws.base.id === id);
      const want = has('plancha') && best < 80 ? 'plancha' : has('grapadora') && best < 170 ? 'grapadora' : 'secador';
      if (p.weapon.base.id !== want && has(want)) {
        swap = 1;
        this.swapIn = 20;
      }
    }
    const useItem = this.wantsActive(w);
    if (dg?.roll) {
      // The roll goes where the stick points.
      return { moveX: dg.rollX, moveY: dg.rollY, aimX, aimY, fire, roll: true, reload: false, swap, useItem };
    }
    return {
      useItem,
      moveX: tx / l,
      moveY: ty / l,
      aimX,
      aimY,
      fire,
      roll: dg ? dg.roll : this.rng.chance(0.01),
      reload: this.rng.chance(0.002),
      swap,
    };
  }
}
