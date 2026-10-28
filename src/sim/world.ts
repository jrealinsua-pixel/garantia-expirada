// The simulation: pure, deterministic, no Phaser and no DOM. One call to step() is one tick of 1/60 s.
import { CHARACTERS } from '../data/characters.ts';
import { ROOMS } from '../data/rooms.ts';
import { WEAPONS } from '../data/weapons.ts';
import type { CharacterDef, DummyDef, WeaponDef } from '../data/types.ts';
import { Rng } from './rng.ts';
import { buildRoom, isWallAt, wallRectsNear, type Room } from './room.ts';
import { normalize, overlaps, pointInRect, type Rect } from './vec.ts';

export const DT = 1 / 60;
/** Height of the hand/gun pivot above the feet. */
export const BODY_HEIGHT = 14;
/** The floating hand orbits this point (feet minus this height) holding the gun. */
export const HAND_HEIGHT = 7;
/** Horizontal and vertical radius of that orbit. */
export const HAND_REACH = 10;
export const HAND_REACH_Y = 6;
/** Distance from the pivot to the muzzle. */
export const MUZZLE = 12;

export interface Input {
  /** Movement, each axis in [-1, 1]. */
  moveX: number;
  moveY: number;
  /** Aim point in world pixels. */
  aimX: number;
  aimY: number;
  fire: boolean;
  /** True only on the tick the button is pressed. */
  roll: boolean;
  reload: boolean;
}

export const NO_INPUT: Input = { moveX: 0, moveY: 0, aimX: 0, aimY: 0, fire: false, roll: false, reload: false };

export interface WeaponState {
  def: WeaponDef;
  ammo: number;
  cooldown: number;
  /** Seconds left of reload, 0 when not reloading. */
  reload: number;
}

export interface Player {
  def: CharacterDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  aim: number;
  facing: 1 | -1;
  hp: number;
  /** Seconds since the roll started, or -1 when not rolling. */
  rollT: number;
  rollDirX: number;
  rollDirY: number;
  rollCooldown: number;
  invulnerable: number;
  weapon: WeaponState;
  /** Distance walked, for the walk animation. */
  walked: number;
}

export interface Bullet {
  id: number;
  owner: 'player' | 'enemy';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  damage: number;
  knockback: number;
}

export interface Dummy {
  id: number;
  def: DummyDef;
  x: number;
  y: number;
  /** Lean angle (radians) and its velocity: the dummy wobbles on its stand when hit. */
  lean: number;
  leanV: number;
  hitT: number;
  damageTaken: number;
}

export type SimEvent =
  | { type: 'shot'; x: number; y: number; angle: number; weapon: string }
  | { type: 'hit'; x: number; y: number; angle: number; damage: number; target: number }
  | { type: 'bulletWall'; x: number; y: number; angle: number }
  | { type: 'bulletFade'; x: number; y: number }
  | { type: 'roll'; x: number; y: number; dirX: number; dirY: number }
  | { type: 'reloadStart'; time: number }
  | { type: 'reloadEnd' }
  | { type: 'empty' };

export interface World {
  seed: string;
  tick: number;
  rng: Rng;
  room: Room;
  player: Player;
  bullets: Bullet[];
  dummies: Dummy[];
  events: SimEvent[];
  nextId: number;
}

export interface WorldOptions {
  seed: string;
  room?: string;
  character?: string;
}

export function createWorld(opts: WorldOptions): World {
  const tpl = ROOMS[opts.room ?? 'sala-pruebas'];
  if (!tpl) throw new Error(`Unknown room ${opts.room}`);
  const def = CHARACTERS[opts.character ?? 'tostadora'];
  if (!def) throw new Error(`Unknown character ${opts.character}`);
  const wdef = WEAPONS[def.startWeapon];
  if (!wdef) throw new Error(`Unknown weapon ${def.startWeapon}`);
  const room = buildRoom(tpl);
  let nextId = 1;
  const dummies: Dummy[] = room.dummySpawns.map((s) => ({ id: nextId++, def: s.def, x: s.x, y: s.y, lean: 0, leanV: 0, hitT: 0, damageTaken: 0 }));
  return {
    seed: opts.seed,
    tick: 0,
    rng: new Rng(opts.seed),
    room,
    player: {
      def,
      x: room.playerStart.x,
      y: room.playerStart.y,
      vx: 0,
      vy: 0,
      aim: 0,
      facing: 1,
      hp: def.maxHp,
      rollT: -1,
      rollDirX: 1,
      rollDirY: 0,
      rollCooldown: 0,
      invulnerable: 0,
      weapon: { def: wdef, ammo: wdef.magazine, cooldown: 0, reload: 0 },
      walked: 0,
    },
    bullets: [],
    dummies,
    events: [],
    nextId,
  };
}

export const isRolling = (p: Player): boolean => p.rollT >= 0;

/** Where the floating hand holding the gun is. */
export function gunPivot(p: Player): { x: number; y: number } {
  return { x: p.x + Math.cos(p.aim) * HAND_REACH, y: p.y - HAND_HEIGHT + Math.sin(p.aim) * HAND_REACH_Y };
}

export function playerFeetBox(p: { x: number; y: number }, r: number): Rect {
  return { x: p.x - r, y: p.y - 3, w: r * 2, h: 4 };
}

export function dummyHurtBox(d: Dummy): Rect {
  return { x: d.x + d.def.hurt.x, y: d.y + d.def.hurt.y, w: d.def.hurt.w, h: d.def.hurt.h };
}

function solidsNear(w: World, box: Rect): Rect[] {
  const out: Rect[] = [];
  const probe = { x: box.x - 4, y: box.y - 4, w: box.w + 8, h: box.h + 8 };
  wallRectsNear(w.room, probe, out);
  for (const pr of w.room.props) if (overlaps(pr.box, probe)) out.push(pr.box);
  for (const d of w.dummies) {
    const b = { x: d.x + d.def.box.x, y: d.y + d.def.box.y, w: d.def.box.w, h: d.def.box.h };
    if (overlaps(b, probe)) out.push(b);
  }
  return out;
}

/** Moves an axis-aligned feet box, sliding along whatever is solid. */
function moveWithCollision(w: World, p: Player, dx: number, dy: number): void {
  const r = p.def.footRadius;
  const eps = 0.001;
  if (dx !== 0) {
    p.x += dx;
    const box = playerFeetBox(p, r);
    for (const s of solidsNear(w, box)) {
      if (!overlaps(playerFeetBox(p, r), s)) continue;
      p.x = dx > 0 ? s.x - r - eps : s.x + s.w + r + eps;
      p.vx = 0;
    }
  }
  if (dy !== 0) {
    p.y += dy;
    const box = playerFeetBox(p, r);
    for (const s of solidsNear(w, box)) {
      if (!overlaps(playerFeetBox(p, r), s)) continue;
      // feet box spans [y-3, y+1]
      p.y = dy > 0 ? s.y - 1 - eps : s.y + s.h + 3 + eps;
      p.vy = 0;
    }
  }
}

function updatePlayer(w: World, input: Input): void {
  const p = w.player;
  const d = p.def;
  p.rollCooldown = Math.max(0, p.rollCooldown - DT);
  p.invulnerable = Math.max(0, p.invulnerable - DT);

  // Aim from the centre of the hand's orbit, so bullets go where the crosshair is.
  const ax = input.aimX - p.x;
  const ay = input.aimY - (p.y - HAND_HEIGHT);
  if (ax * ax + ay * ay > 4) p.aim = Math.atan2(ay, ax);
  p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;

  let mx = Math.max(-1, Math.min(1, input.moveX));
  let my = Math.max(-1, Math.min(1, input.moveY));
  const ml = Math.hypot(mx, my);
  if (ml > 1) {
    mx /= ml;
    my /= ml;
  }

  if (input.roll && !isRolling(p) && p.rollCooldown <= 0) {
    const dir = ml > 0.1 ? normalize(mx, my) : { x: Math.cos(p.aim), y: Math.sin(p.aim) };
    p.rollT = 0;
    p.rollDirX = dir.x;
    p.rollDirY = dir.y;
    p.invulnerable = d.rollIframes;
    w.events.push({ type: 'roll', x: p.x, y: p.y, dirX: dir.x, dirY: dir.y });
  }

  if (isRolling(p)) {
    const k = p.rollT / d.rollTime;
    // Full speed for most of the roll, then a quick ease-out so the landing reads.
    const speed = d.rollSpeed * (k < 0.7 ? 1 : 1 - ((k - 0.7) / 0.3) * 0.65);
    p.vx = p.rollDirX * speed;
    p.vy = p.rollDirY * speed;
    p.rollT += DT;
    if (p.rollT >= d.rollTime) {
      p.rollT = -1;
      p.rollCooldown = d.rollCooldown;
      // Keep part of the momentum so the exit is not a dead stop.
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
  } else {
    const tx = mx * d.speed;
    const ty = my * d.speed;
    const dvx = tx - p.vx;
    const dvy = ty - p.vy;
    const dl = Math.hypot(dvx, dvy);
    const maxStep = (ml > 0.05 ? d.accel : d.friction) * DT;
    if (dl <= maxStep) {
      p.vx = tx;
      p.vy = ty;
    } else {
      p.vx += (dvx / dl) * maxStep;
      p.vy += (dvy / dl) * maxStep;
    }
  }

  updateWeapon(w, input);

  const ox = p.x;
  const oy = p.y;
  moveWithCollision(w, p, p.vx * DT, p.vy * DT);
  if (!isRolling(p)) p.walked += Math.hypot(p.x - ox, p.y - oy);
}

function updateWeapon(w: World, input: Input): void {
  const p = w.player;
  const ws = p.weapon;
  const def = ws.def;
  ws.cooldown = Math.max(0, ws.cooldown - DT);
  if (ws.reload > 0) {
    ws.reload -= DT;
    if (ws.reload <= 0) {
      ws.reload = 0;
      ws.ammo = def.magazine;
      w.events.push({ type: 'reloadEnd' });
    }
    return;
  }
  if (input.reload && ws.ammo < def.magazine) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'reloadStart', time: def.reloadTime });
    return;
  }
  if (!input.fire || isRolling(p) || ws.cooldown > 0) return;
  if (ws.ammo <= 0) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'empty' }, { type: 'reloadStart', time: def.reloadTime });
    return;
  }
  ws.ammo--;
  ws.cooldown = 1 / def.fireRate;
  const pivot = gunPivot(p);
  const mx = pivot.x + Math.cos(p.aim) * MUZZLE;
  const my = pivot.y + Math.sin(p.aim) * MUZZLE;
  for (let i = 0; i < def.pellets; i++) {
    const a = p.aim + ((w.rng.range(-1, 1) * def.spreadDeg) / 180) * Math.PI;
    w.bullets.push({
      id: w.nextId++,
      owner: 'player',
      x: mx,
      y: my,
      vx: Math.cos(a) * def.bulletSpeed,
      vy: Math.sin(a) * def.bulletSpeed,
      r: def.bulletRadius,
      life: def.bulletLife,
      damage: def.damage,
      knockback: def.knockback,
    });
  }
  p.vx -= Math.cos(p.aim) * def.recoil;
  p.vy -= Math.sin(p.aim) * def.recoil;
  w.events.push({ type: 'shot', x: mx, y: my, angle: p.aim, weapon: def.id });
  if (ws.ammo === 0) {
    ws.reload = def.reloadTime;
    w.events.push({ type: 'reloadStart', time: def.reloadTime });
  }
}

function updateBullets(w: World): void {
  const keep: Bullet[] = [];
  for (const b of w.bullets) {
    b.life -= DT;
    if (b.life <= 0) {
      w.events.push({ type: 'bulletFade', x: b.x, y: b.y });
      continue;
    }
    // Two sub-steps keep fast bullets from skipping thin things.
    let alive = true;
    for (let s = 0; s < 2 && alive; s++) {
      b.x += (b.vx * DT) / 2;
      b.y += (b.vy * DT) / 2;
      const angle = Math.atan2(b.vy, b.vx);
      if (isWallAt(w.room, b.x, b.y) || w.room.props.some((pr) => pr.def.blocksBullets && pointInRect(b.x, b.y, pr.box))) {
        w.events.push({ type: 'bulletWall', x: b.x, y: b.y, angle });
        alive = false;
        break;
      }
      if (b.owner === 'player') {
        for (const d of w.dummies) {
          const hb = dummyHurtBox(d);
          if (b.x + b.r > hb.x && b.x - b.r < hb.x + hb.w && b.y + b.r > hb.y && b.y - b.r < hb.y + hb.h) {
            d.hitT = 0.12;
            d.damageTaken += b.damage;
            d.leanV += Math.cos(angle) * b.knockback * 0.06;
            w.events.push({ type: 'hit', x: b.x, y: b.y, angle, damage: b.damage, target: d.id });
            alive = false;
            break;
          }
        }
      }
    }
    if (alive) keep.push(b);
  }
  w.bullets = keep;
}

function updateDummies(w: World): void {
  for (const d of w.dummies) {
    d.hitT = Math.max(0, d.hitT - DT);
    // Damped spring back to upright.
    d.leanV += -d.lean * 140 * DT;
    d.leanV *= Math.pow(0.02, DT);
    d.lean += d.leanV * DT;
    d.lean = Math.max(-0.5, Math.min(0.5, d.lean));
  }
}

export function step(w: World, input: Input): void {
  w.events = [];
  updatePlayer(w, input);
  updateBullets(w);
  updateDummies(w);
  w.tick++;
}

/** Problems that must never happen; the bot fails if this returns anything. */
export function checkInvariants(w: World): string[] {
  const errs: string[] = [];
  const p = w.player;
  for (const [k, v] of Object.entries({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, aim: p.aim })) {
    if (!Number.isFinite(v)) errs.push(`player.${k} is ${v}`);
  }
  if (p.x < 0 || p.y < 0 || p.x > w.room.w || p.y > w.room.h) errs.push(`player outside the room at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  const box = playerFeetBox(p, p.def.footRadius - 0.5);
  const walls: Rect[] = [];
  wallRectsNear(w.room, box, walls);
  if (walls.some((r) => overlaps(r, box))) errs.push(`player inside a wall at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  if (w.room.props.some((pr) => overlaps(pr.box, box))) errs.push(`player inside a prop at ${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  if (p.weapon.ammo < 0 || p.weapon.ammo > p.weapon.def.magazine) errs.push(`ammo out of range: ${p.weapon.ammo}`);
  if (w.bullets.length > 2000) errs.push(`too many bullets: ${w.bullets.length}`);
  for (const b of w.bullets) if (!Number.isFinite(b.x) || !Number.isFinite(b.y)) errs.push(`bullet ${b.id} has invalid position`);
  return errs;
}

/** Compact fingerprint of the state, to check determinism. */
export function worldHash(w: World): string {
  const p = w.player;
  const parts = [w.tick, p.x.toFixed(3), p.y.toFixed(3), p.aim.toFixed(4), p.weapon.ammo, w.bullets.length, w.nextId];
  for (const d of w.dummies) parts.push(d.damageTaken);
  return parts.join('|');
}
