// A simple bot player that drives the simulation through the same Input as a human.
// Used by `npm run bot` and by tests to measure balance and detect hangs.
import { Rng } from './rng.ts';
import { ACTIVE_ITEMS } from '../data/items.ts';
import { brickUnder, checkInvariants, inkUnder, inWind, createWorld, DT, FROST_FLAT, HAND_HEIGHT, interactable, isDead, isRolling, leaveHub, NO_INPUT, nearStation } from './world.ts';
import { crushRect, wetPuddles, freeChestLeft, freeSpot, PLAYER_HURT_Y, shopPrice, step, TIP_FACING, tipSide, wantsPickup, zapCentre } from './world.ts';
import type { Enemy, Input, World } from './world.ts';
import { overlaps } from './vec.ts';
import { conveyorAt } from './conveyors.ts';
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
    if (((en.state === 'warn' && en.t >= BOT_REACTION) || en.state === 'charge') && (kind === 'charger' || kind === 'chaser' || kind === 'rccar' || kind === 'shredder')) {
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
    // A boss on (or about to take) its catwalk: off its lane, rolling if it is already coming.
    if (kind === 'boss' && en.runTo && (en.state === 'charge' || (en.state === 'warn' && en.t >= BOT_REACTION))) {
      const lane = en.runTo.y;
      const side = p.y - lane;
      const ahead = (p.x - (en.runVia?.x ?? en.x)) * en.dirX;
      const reach = en.def.footRadius + 14;
      if (ahead > -12 && Math.abs(side) < reach) {
        const sgn = side >= 0 ? 1 : -1;
        out.y += sgn * (en.state === 'charge' ? 1.5 : 1);
        const along = (p.x - en.x) * en.dirX;
        if (en.state === 'charge' && !en.runVia && along > 0 && along < 80 && along / 200 < soonest) {
          soonest = along / 200;
          out.rollX = 0;
          out.rollY = sgn;
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
    // The Nevera's trail (Frost.trail) only slows a little: walked through, as a player would.
    if (f.trail) continue;
    const dx = p.x - f.x;
    const dy = (p.y - f.y) / FROST_FLAT;
    const d = Math.hypot(dx, dy) || 1;
    // Building pieces on the floor: step round them (they hurt), and well clear of where they fall.
    const piece = f.brick !== undefined;
    // A dismissal letter opens into a ring of sheets: well clear of it (the expired products, as
    // ever, so the first floors' numbers stay comparable).
    const reach = f.r + (piece ? 14 : f.look ? 30 : 8);
    if (d > reach) continue;
    const k = (1 - d / reach) * (f.t < 0 ? 0.9 : piece ? 1.2 : 0.5);
    out.x += (dx / d) * k;
    out.y += (dy / d) * k;
  }
  // A stamp coming down: off its square shadow (once it has seen it). Ink on the floor: walk out of
  // it, it is no place to have to dodge from.
  for (const en of w.enemies) {
    const b = en.def.brain;
    if (b.kind !== 'stamper' || en.state !== 'warn' || !en.dest || en.t < BOT_REACTION) continue;
    const dx = p.x - en.dest.x;
    const dy = p.y - en.dest.y;
    if (Math.abs(dx) > b.ink.w / 2 + 10 || Math.abs(dy) > b.ink.h / 2 + 8) continue;
    const d = Math.hypot(dx, dy) || 1;
    out.x += (dx / d) * 1.2;
    out.y += (dy / d) * 1.2;
  }
  // Crates coming down (BossPhase.crates): out from under their tiles, towards the boss's side.
  for (const d of w.crates) {
    if (d.t < BOT_REACTION) continue;
    const pad = 10;
    if (p.x < d.box.x - pad || p.x > d.box.x + d.box.w + pad || p.y < d.box.y - pad || p.y > d.box.y + d.box.h + pad) continue;
    out.x += d.out * 1.6;
  }
  // A Regleta crackling (M14b (h11a1)): out of its reach before it zaps (once it has seen it).
  if (w.doorsShut) {
    for (const pr of w.room.props) {
      const zap = pr.def.zap;
      if (!zap || pr.zapT === undefined || pr.zapT < zap.every - zap.warn + BOT_REACTION) continue;
      const c = zapCentre(pr);
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      const reach = zap.radius + 12;
      // Standing in water the zap gets into (M14b (h11a3)): out of the puddle, away from its middle.
      for (const i of wetPuddles(w, c.x, c.y, zap.radius)) {
        const pd = w.room.puddles![i]!;
        const k = ((p.x - pd.x) / (pd.rx + 8)) ** 2 + ((p.y - pd.y) / (pd.ry + 8)) ** 2;
        if (k > 1) continue;
        const e = Math.hypot(p.x - pd.x, p.y - pd.y) || 1;
        out.x += ((p.x - pd.x) / e) * 1.6;
        out.y += ((p.y - pd.y) / e) * 1.6;
      }
      if (d > reach) continue;
      out.x += (dx / d) * (1 - d / reach) * 1.6 + (dx / d) * 0.4;
      out.y += (dy / d) * (1 - d / reach) * 1.6 + (dy / d) * 0.4;
    }
  }
  // A shelf going over (M14b (h11a2)): out from under where it lands, the short way.
  for (const pr of w.room.props) {
    if (!pr.fall || pr.fall.t < BOT_REACTION) continue;
    const a = crushRect(pr, pr.fall.side);
    const pad = 8;
    if (p.x < a.x - pad || p.x > a.x + a.w + pad || p.y < a.y - pad || p.y > a.y + a.h + pad) continue;
    if (a.w >= a.h) out.y += (p.y >= a.y + a.h / 2 ? 1 : -1) * 2;
    else out.x += (p.x >= a.x + a.w / 2 ? 1 : -1) * 2;
  }
  // An air conditioner's cone: step out of it sideways (in it the air pushes and the shots bend away).
  for (const en of w.enemies) {
    const b = en.def.brain;
    if (b.kind !== 'blower' || isDead(en) || !inWind(en, b, p.x, p.y)) continue;
    const side = en.dirX * (p.y - en.y) - en.dirY * (p.x - en.x) >= 0 ? 1 : -1;
    out.x += -en.dirY * side * 0.7;
    out.y += en.dirX * side * 0.7;
  }
  // A conveyor belt's rollers (M12 (4b)): hard away from them (walking against the belt itself is
  // in Bot.think, after everything else).
  const belt = conveyorAt(w, p.x, p.y);
  if (belt && belt.bite > 0) {
    const toEnd = belt.dirX > 0 ? belt.x + belt.w - p.x : belt.dirX < 0 ? p.x - belt.x : belt.dirY > 0 ? belt.y + belt.h - p.y : p.y - belt.y;
    const near = Math.max(0, 1 - (toEnd - belt.bite) / BELT_WARY);
    out.x -= belt.dirX * near * 1.4;
    out.y -= belt.dirY * near * 1.4;
  }
  // A spiral with a hole that turns (the Director's line of cuts): into the hole and round with it.
  const hole = followHole(w);
  if (hole) {
    out.x += hole.x;
    out.y += hole.y;
  }
  const ink = inkUnder(w, p.x, p.y);
  if (ink) {
    const dx = p.x - ink.x;
    const dy = (p.y - ink.y) * 1.5;
    const d = Math.hypot(dx, dy) || 1;
    out.x += (dx / d) * 0.4;
    out.y += (dy / d) * 0.4;
  }
  // Do not dodge into a wall.
  const ahead = 18;
  const l = Math.hypot(out.x, out.y);
  if (l > 0 && isWallAt(w.room, p.x + (out.x / l) * ahead, p.y + (out.y / l) * ahead)) {
    if (!isWallAt(w.room, p.x + (out.x / l) * ahead, p.y)) out.y = 0;
    else if (!isWallAt(w.room, p.x, p.y + (out.y / l) * ahead)) out.x = 0;
  }
  out.urgency = Math.min(1, Math.hypot(out.x, out.y));
  if (soonest < 0.2 && !isRolling(p) && p.rollCooldown <= 0 && !ink) {
    out.roll = true;
    if (isWallAt(w.room, p.x + out.rollX * 40, p.y + out.rollY * 40)) {
      out.rollX = -out.rollX;
      out.rollY = -out.rollY;
    }
  }
  return out;
}

/**
 * On a conveyor belt the stick also pushes against it, so the toaster goes where it means to (as a
 * player does without thinking): the belt's speed, in units of the toaster's, taken off the move.
 */
function beltCounter(w: World, mv: { x: number; y: number }): { x: number; y: number } {
  const p = w.player;
  const belt = conveyorAt(w, p.x, p.y);
  if (!belt) return mv;
  const x = mv.x - (belt.dirX * belt.speed) / p.def.speed;
  const y = mv.y - (belt.dirY * belt.speed) / p.def.speed;
  const l = Math.hypot(x, y);
  return l > 1 ? { x: x / l, y: y / l } : { x, y };
}

/** px from a belt's rollers at which the bot starts to hurry away from them. */
const BELT_WARY = 90;

/** Steps at least this many in a pattern, and its hole this many times its usual spacing, to count as a hole to follow. */
const HOLE_STEPS = 6;
const HOLE_WIDER = 1.8;

/**
 * Following the hole of a spiral round its source, as a player would read it: for an enemy
 * pattern of HOLE_STEPS steps or more whose shots leave one gap much wider than the rest, where
 * that gap will be at the toaster's distance a moment from now (the shots there left the source
 * `r / speed` s ago); a pull towards that spot, round the source, at 60-130 px. Only spirals with
 * a hole (the Director's line of cuts): rings and plain spirals are left to the usual dodging.
 */
function followHole(w: World): { x: number; y: number } | null {
  const p = w.player;
  for (const e of w.emitters) {
    if (e.owner !== 'enemy' || e.shots.length === 0) continue;
    const steps = new Map<number, number[]>();
    for (const s of e.shots) {
      const k = Math.round(s.delay * 1000);
      const list = steps.get(k);
      if (list) list.push(s.angle);
      else steps.set(k, [s.angle]);
    }
    if (steps.size < HOLE_STEPS) continue;
    const dx = p.x - e.x;
    const dy = p.y - PLAYER_HURT_Y - e.y;
    const r = Math.hypot(dx, dy) || 1;
    const speed = e.shots[0]!.speed;
    // The step whose shots will be at the toaster's distance a little from now.
    const when = e.t - r / speed + 0.25;
    const keys = [...steps.keys()].sort((a, b) => a - b);
    let key = keys[0]!;
    for (const k of keys) if (k / 1000 <= when) key = k;
    const angles = steps.get(key)!.map((a) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((a, b) => a - b);
    if (angles.length < 3) continue;
    let widest = 0;
    let centre = 0;
    const gaps: number[] = [];
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i]!;
      const b = i + 1 < angles.length ? angles[i + 1]! : angles[0]! + 2 * Math.PI;
      gaps.push(b - a);
      if (b - a > widest) {
        widest = b - a;
        centre = a + (b - a) / 2;
      }
    }
    const usual = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
    if (widest < usual * HOLE_WIDER) continue;
    const want = Math.max(60, Math.min(130, r));
    const tx = e.x + Math.cos(centre) * want - p.x;
    const ty = e.y + Math.sin(centre) * want + PLAYER_HURT_Y - p.y;
    const d = Math.hypot(tx, ty);
    if (d < 4) return { x: 0, y: 0 };
    const k = Math.min(1.2, d / 30);
    return { x: (tx / d) * k, y: (ty / d) * k };
  }
  return null;
}

/** Whether the toaster stands in front of a shredder (EnemyDef brain `shredder`): its shots there are swallowed. */
function facesShredder(w: World, en: World['enemies'][number]): boolean {
  if (en.def.brain.kind !== 'shredder') return false;
  const dx = w.player.x - en.x;
  const dy = w.player.y - en.y;
  const d = Math.hypot(dx, dy) || 1;
  return (dx * en.dirX + dy * en.dirY) / d > 0.5;
}

/**
 * Walking round a shredder that has the toaster in front, as a player would: sideways to where it
 * faces, and closing in (close up, it cannot turn as fast as the toaster goes round it).
 */
function flank(w: World): { x: number; y: number } {
  const p = w.player;
  const out = { x: 0, y: 0 };
  for (const en of w.enemies) {
    if (en.state !== 'walk' || !facesShredder(w, en)) continue;
    const dx = p.x - en.x;
    const dy = p.y - en.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 200) continue;
    const sgn = dx * -en.dirY + dy * en.dirX >= 0 ? 1 : -1;
    const close = d > 60 ? 0.5 : 0;
    out.x += -en.dirY * sgn * 0.8 - (dx / d) * close;
    out.y += en.dirX * sgn * 0.8 - (dy / d) * close;
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
  /** Ticks left walking `unstickDir` to get out of a squeeze (between a trolley and a box, say). */
  private unstick = 0;
  private unstickDir = { x: 0, y: 0 };
  /** Ticks in a row with a shredder close by facing it (all its shots swallowed). */
  private faced = 0;

  /** Whether it tries to dodge (off, it is the old bot that only walks around and shoots). */
  readonly dodges: boolean;
  /**
   * Whether, in a room on its own (no floor), it goes after the enemies as it does on a floor
   * (round the furniture to the nearest one when it is far or out of sight) instead of wandering
   * at random. Off by default: the boss fights of `npm run bot` are measured with the old way.
   */
  readonly hunts: boolean;

  constructor(seed: string, opts: { dodge?: boolean; hunt?: boolean } = {}) {
    this.rng = new Rng('bot:' + seed);
    this.dodges = opts.dodge ?? true;
    this.hunts = opts.hunt ?? false;
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
    const grabbable = (k: (typeof w.pickups)[number]): boolean =>
      k.price === undefined && (k.kind === 'arma' || k.kind === 'objeto' || k.kind === 'documento' || (k.kind === 'activo' && !p.active));
    const arm = this.ignorePickups > 0 ? undefined : w.pickups.find(grabbable);
    if (arm) return steer(w, { x: arm.x, y: arm.y }, r, blocked);
    // Coupons and tickets left lying about: they no longer fly over on their own (nota del humano
    // del 2026-11-05), so it goes for the nearest before leaving.
    let loose: (typeof w.pickups)[number] | undefined;
    if (this.ignorePickups <= 0) {
      for (const k of w.pickups) {
        if ((k.kind !== 'cupon' && k.kind !== 'ticket') || k.price !== undefined) continue;
        if (!loose || Math.hypot(k.x - p.x, k.y - p.y) < Math.hypot(loose.x - p.x, loose.y - p.y)) loose = k;
      }
    }
    if (loose) return steer(w, { x: loose.x, y: loose.y }, r, blocked);
    // In the shop: buy what it can pay for (an item first, a heart if hurt, then a ticket).
    const buy = this.ignorePickups > 0 ? undefined : this.shopping(w);
    if (buy) return steer(w, { x: buy.x, y: buy.y }, r, blocked);
    // A shut chest and a ticket (or the Allen key) to open it: walk into its front.
    const chest = (p.tickets > 0 || freeChestLeft(w) > 0) && this.ignorePickups <= 0 ? w.room.props.find((pr) => pr.chest && !pr.chest.open) : undefined;
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

  /** Whether to press the interact button now: at a chest it has a ticket for, or at what it wants to buy. */
  private wantsInteract(w: World): boolean {
    const it = interactable(w);
    if (!it) return false;
    // With a ticket, or the spare Allen key (floorGoal walks it over for either: with only the key
    // it used to stand at the chest for good).
    if (it.kind === 'chest') return w.player.tickets > 0 || freeChestLeft(w) > 0;
    if (it.kind === 'shop') return this.shopping(w) === it.pickup;
    // Something on the floor (M14b (h2)): it picks it all up (an active only if it carries none).
    if (it.kind === 'grab') return it.pickup.kind !== 'activo' || !w.player.active;
    // A table at hand (M9b 13b): over it goes if an enemy is out there, on the side it would cover.
    if (it.kind === 'tip') {
      const f = TIP_FACING[tipSide(it.prop, w.player.x, w.player.y - 2)];
      return w.enemies.some((en) => !isDead(en) && en.state !== 'gone' && (en.x - w.player.x) * f.x + (en.y - w.player.y) * f.y > 40);
    }
    return false;
  }

  /** The good on sale it wants next, if it can pay for it. */
  private shopping(w: World): (typeof w.pickups)[number] | undefined {
    const p = w.player;
    const rank = (k: (typeof w.pickups)[number]): number =>
      k.kind === 'corazon' ? (p.hp <= p.def.maxHp - 2 ? 1 : -1) : k.kind === 'ticket' ? 2 : k.kind === 'activo' && p.active ? -1 : 0;
    let best: (typeof w.pickups)[number] | undefined;
    for (const k of w.pickups) {
      // It never finances nor gambles (the rare rooms, M14 (r2)): its numbers measure the game without loans or luck.
      if (k.price === undefined || k.pay || k.kind === 'rasca' || shopPrice(p, k.price) > p.coupons || rank(k) < 0) continue;
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
        // The path keeps pointing into the same wall: walk off somewhere else for a moment.
        const a = this.rng.range(0, Math.PI * 2);
        this.unstick = 45;
        this.unstickDir = { x: Math.cos(a), y: Math.sin(a) };
      }
      this.lastPos = { x: p.x, y: p.y, t: w.tick };
    }
    if (w.floor || (this.hunts && w.enemies.length > 0)) {
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
      // Not an active item when it already has one: it would swap them back and forth (and stand
      // on the one it just put down, waiting to step off it, for ever).
      // Hearts (spare, warranty, special) it would not take: they would only be in the way.
      if (!wantsPickup(w, k)) continue;
      if (k.price !== undefined || (k.kind === 'activo' && p.active)) continue;
      const d = Math.hypot(k.x - p.x, k.y - p.y);
      // With the room clear, only in a straight line: one behind a partition is floorGoal's, which
      // steers round. In a fight, as before but not through a wall: one on the other side of a
      // partition that runs down to the wall had it walking into it for ever (M11 3, Pasillo de
      // Mamparas).
      if (d < near && clearLine(w, p, k, w.enemies.length > 0 ? 1 : p.def.footRadius)) {
        near = d;
        goal = { x: k.x, y: k.y };
      }
    }
    // A shredder facing it close by for long (pressed against a row of bolted chairs, say, with the
    // toaster on the other side): round to its back, as a player would (M11 (4a), Sala de Espera).
    const shredder = w.enemies.find((en) => !isDead(en) && facesShredder(w, en) && Math.hypot(en.x - p.x, en.y - p.y) < 120);
    this.faced = shredder ? this.faced + 1 : 0;
    if (shredder && this.faced > FACED_TOO_LONG) {
      const back = freeSpot(w, shredder.x - shredder.dirX * 56, shredder.y - shredder.dirY * 56, p.def.footRadius);
      goal = steer(w, back, p.def.footRadius, blockedTiles(w, p.def.footRadius));
    }
    // A turn called by a ticket dispenser: into its circle before the countdown runs out, and in it
    // while it is served (it stops the bullets), as a player would.
    for (const en of w.enemies) {
      const c = en.turn;
      if (!c || c.state === 'lost' || isDead(en)) continue;
      goal = Math.hypot(c.x - p.x, c.y - p.y) < c.r * 0.5 ? { x: c.x, y: c.y } : steer(w, c, p.def.footRadius, blockedTiles(w, p.def.footRadius));
      break;
    }
    let menuRush = false;
    // The Centralita's voice menu: once it has said which, into the zone to press (its middle),
    // as a player would.
    for (const en of w.enemies) {
      const m = en.menu;
      if (!m || !m.said || m.rained || isDead(en) || m.t < m.saidAt + BOT_REACTION) continue;
      const z = m.zones[m.good]!;
      goal = Math.hypot(z.x - p.x, z.y - p.y) < 14 ? { x: z.x, y: z.y } : steer(w, z, p.def.footRadius, blockedTiles(w, p.def.footRadius));
      // Too far to walk there in time: it rolls that way.
      const reach = Math.hypot(Math.max(0, Math.abs(z.x - p.x) - 30), Math.max(0, Math.abs(z.y - p.y) - 18));
      menuRush = reach > p.def.speed * Math.max(0, m.rainAt - m.t - 0.15);
      break;
    }
    let gx = (goal?.x ?? p.x) - p.x;
    let gy = (goal?.y ?? p.y) - p.y;
    if (this.unstick > 0) {
      this.unstick--;
      gx = this.unstickDir.x;
      gy = this.unstickDir.y;
    }
    const gl = Math.hypot(gx, gy) || 1;
    // Mix where it wants to go with getting out of the way; danger wins.
    const dg = this.dodges ? dodge(w) : null;
    const u = dg ? dg.urgency : 0;
    const fl = flank(w);
    const tx = (gx / gl) * (1 - u) + (dg ? dg.x : 0) * 2 + fl.x;
    const ty = (gy / gl) * (1 - u) + (dg ? dg.y : 0) * 2 + fl.y;
    const l = Math.hypot(tx, ty) || 1;
    // Aim at the nearest target, with a little wobble.
    let aimX = p.x + 50;
    let aimY = p.y - HAND_HEIGHT;
    let best = Infinity;
    // Enemies first; the dummies only when the room is empty.
    // A shredder with the toaster in front counts as further away: better to shoot the others meanwhile.
    // A photocopier counts as nearer: every second it lives fills the room (a player goes for it first).
    // A loot box too (M14 (j4)): shot open in time it gives less trouble than opening by itself.
    const weight = (e: Enemy): number => (facesShredder(w, e) ? 3 : e.def.brain.kind === 'copier' ? 0.6 : e.def.brain.kind === 'lootbox' ? 0.7 : 1);
    // (Aimed at the middle of a low loot box, not over it.)
    const height = (e: Enemy): number => (e.def.brain.kind === 'lootbox' ? 9 : 16);
    const targets = w.enemies.length
      ? w.enemies.filter((e) => e.state !== 'gone').map((e) => ({ x: e.x, y: e.y, k: weight(e), h: height(e) }))
      : w.dummies.map((d) => ({ x: d.x, y: d.y, k: 1, h: 16 }));
    for (const d of targets) {
      const dd = Math.hypot(d.x - p.x, d.y - p.y) * d.k;
      if (dd < best) {
        best = dd;
        aimX = d.x + this.rng.range(-6, 6);
        aimY = d.y - d.h + this.rng.range(-6, 6);
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
    const interact = this.wantsInteract(w);
    if (dg?.roll) {
      // The roll goes where the stick points.
      return { moveX: dg.rollX, moveY: dg.rollY, aimX, aimY, fire, roll: true, reload: false, swap, useItem, interact };
    }
    // Late for the zone of the voice menu: a roll towards it, if the roll is ready.
    if (menuRush && !isRolling(p) && p.rollCooldown <= 0) {
      return { moveX: gx / gl, moveY: gy / gl, aimX, aimY, fire, roll: true, reload: false, swap, useItem, interact };
    }
    // About to walk onto a building piece: roll over it (as a player would), if the roll is ready.
    if (!isRolling(p) && p.rollCooldown <= 0 && w.frost.length > 0) {
      const ux = tx / l;
      const uy = ty / l;
      if (brickUnder(w, p.x + ux * 7, p.y + uy * 7) || brickUnder(w, p.x + ux * 12, p.y + uy * 12)) {
        return { moveX: ux, moveY: uy, aimX, aimY, fire, roll: true, reload: false, swap, useItem, interact };
      }
    }
    // Pressed against something (the long table of the Sala de Juntas, a partition): along it
    // instead, the nearer way round, as a player would slide off it.
    let mx = tx / l;
    let my = ty / l;
    // Its shots stopped by the long table or a partition: out towards the nearer end of it, where
    // it can see the target, as a player would (the others go on as before: see slideOff).
    const cover = coverBetween(w, aimX, aimY + 16);
    if (cover && u < 0.5) {
      mx += Math.sign(p.x - (cover.box.x + cover.box.w / 2)) * 0.8;
      const ml = Math.hypot(mx, my) || 1;
      mx /= ml;
      my /= ml;
    }
    const mv = beltCounter(w, slideOff(w, mx, my));
    return {
      useItem,
      interact,
      moveX: mv.x,
      moveY: mv.y,
      aimX,
      aimY,
      fire,
      roll: dg ? dg.roll : this.rng.chance(0.01),
      reload: this.rng.chance(0.002),
      swap,
    };
  }
}

/** Ticks facing a shredder before going round to its back (6 s). */
const FACED_TOO_LONG = 360;

/** A big prop (over two tiles wide) between the toaster's feet and (x, y), if any. */
function coverBetween(w: World, x: number, y: number): World['room']['props'][number] | undefined {
  const p = w.player;
  // Bullets are stopped where their shadow is: from the feet to the target's feet.
  const hx = p.x;
  const hy = p.y;
  const d = Math.hypot(x - hx, y - hy);
  const n = Math.floor(d / 8);
  for (let i = 1; i < n; i++) {
    const px = hx + ((x - hx) * i) / n;
    const py = hy + ((y - hy) * i) / n;
    const pr = w.room.props.find((o) => o.box.w > TILE * 2 && o.def.blocksBullets && px >= o.box.x && px <= o.box.x + o.box.w && py >= o.box.y && py <= o.box.y + o.box.h);
    if (pr) return pr;
  }
  return undefined;
}

/**
 * The way the bot walks, turned off whatever stands right in front of it (up to a right angle,
 * whichever side is nearer). Only props count, and only big ones (PropDef boxes over two tiles
 * wide: the Sala de Juntas's table and partitions): elsewhere the bot walks as it always has, so
 * its numbers on the other floors stay comparable.
 */
function slideOff(w: World, x: number, y: number): { x: number; y: number } {
  const p = w.player;
  const r = p.def.footRadius;
  const ahead = (ax: number, ay: number): boolean => {
    const box = { x: p.x + ax * 8 - r, y: p.y + ay * 8 - 3, w: r * 2, h: 4 };
    return !w.room.props.some((pr) => pr.box.w > TILE * 2 && overlaps(pr.box, box));
  };
  if ((x === 0 && y === 0) || ahead(x, y)) return { x, y };
  for (const deg of [30, -30, 60, -60, 90, -90]) {
    const a = (deg * Math.PI) / 180;
    const nx = x * Math.cos(a) - y * Math.sin(a);
    const ny = x * Math.sin(a) + y * Math.cos(a);
    if (ahead(nx, ny)) return { x: nx, y: ny };
  }
  return { x, y };
}

/** What happened when the bot crossed the Mostrador (see crossHub). */
export interface HubCrossing {
  /** The run that starts on the conveyor, or null if it never got there. */
  run: World | null;
  /** Stations stood at, in the order visited. */
  visited: string[];
  seconds: number;
  errors: string[];
}

/**
 * The bot goes round the Mostrador before a run, like a player would: it stands at every station
 * (the standing ones from in front, the ones on the wall from below them), then walks onto the
 * conveyor. Fails if it gets stuck, steps on the conveyor on the way, something shoots or an
 * invariant breaks. The run it starts is the floor 1 of `seed` (as createWorld would make it).
 */
export function crossHub(seed: string, opts: { chatarrero?: boolean; character?: string } = {}): HubCrossing {
  const w = createWorld({ seed: 'mostrador', hub: { chatarrero: !!opts.chatarrero }, ...(opts.character ? { character: opts.character } : {}) });
  const r = w.player.def.footRadius;
  const blocked = blockedTiles(w, r);
  const visited: string[] = [];
  const errors: string[] = [];
  const walk = (goal: Point, done: () => boolean, label: string): boolean => {
    for (let i = 0; i < 20 / DT; i++) {
      if (done()) return true;
      const p = w.player;
      const to = steer(w, goal, r, blocked);
      const dx = to.x - p.x;
      const dy = to.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      step(w, { ...NO_INPUT, moveX: dx / d, moveY: dy / d });
      if (w.bullets.length > 0) errors.push('en el Mostrador sale una bala');
      for (const e of checkInvariants(w)) errors.push(`Mostrador: ${e}`);
      if (errors.length) return false;
    }
    errors.push(`el bot no llega a ${label} en el Mostrador (se queda en ${w.player.x.toFixed(0)},${w.player.y.toFixed(0)})`);
    return false;
  };
  for (const st of w.room.stations) {
    const standing = w.room.props.some((p) => p.x === st.x && p.y === st.y);
    if (!walk({ x: st.x, y: standing ? st.y + 10 : st.y + 6 }, () => nearStation(w)?.kind === st.kind, st.kind)) break;
    visited.push(st.kind);
    if (w.leftHub) {
      errors.push(`de camino a ${st.kind} el bot pisó la cinta`);
      break;
    }
  }
  const b = w.room.belt!;
  if (!errors.length) walk({ x: b.x + b.w / 2, y: b.y + b.h / 2 }, () => w.leftHub, 'la cinta');
  const run = errors.length ? null : leaveHub(w, seed);
  if (!errors.length && !run) errors.push('la cinta no empieza la partida');
  return { run, visited, seconds: w.tick * DT, errors };
}
