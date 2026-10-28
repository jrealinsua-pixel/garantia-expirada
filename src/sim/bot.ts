// A simple bot player that drives the simulation through the same Input as a human.
// Used by `npm run bot` and by tests to measure balance and detect hangs.
import { Rng } from './rng.ts';
import { HAND_HEIGHT, type Input, type World } from './world.ts';

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

  constructor(seed: string) {
    this.rng = new Rng('bot:' + seed);
  }

  think(w: World): Input {
    const p = w.player;
    const r = w.room;
    this.retargetIn--;
    if (!this.target || this.retargetIn <= 0 || Math.hypot(this.target.x - p.x, this.target.y - p.y) < 8) {
      this.target = { x: this.rng.range(40, r.w - 40), y: this.rng.range(64, r.h - 40) };
      this.retargetIn = this.rng.int(60, 240);
    }
    if (w.tick - this.lastPos.t >= 180) {
      if (Math.hypot(p.x - this.lastPos.x, p.y - this.lastPos.y) < 3) {
        this.stuck++;
        this.target = null;
        this.ignorePickups = 240;
      }
      this.lastPos = { x: p.x, y: p.y, t: w.tick };
    }
    // Coupons lying close by are worth a detour.
    let goal = this.target;
    let near = 110;
    if (this.ignorePickups > 0) this.ignorePickups--;
    else for (const k of w.pickups) {
      const d = Math.hypot(k.x - p.x, k.y - p.y);
      if (d < near) {
        near = d;
        goal = { x: k.x, y: k.y };
      }
    }
    const tx = (goal?.x ?? p.x) - p.x;
    const ty = (goal?.y ?? p.y) - p.y;
    const l = Math.hypot(tx, ty) || 1;
    // Aim at the nearest target, with a little wobble.
    let aimX = p.x + 50;
    let aimY = p.y - HAND_HEIGHT;
    let best = Infinity;
    // Enemies first (half the distance counts as nearer), then the dummies.
    for (const d of [...w.enemies.map((e) => ({ x: e.x, y: e.y, k: 0.5 })), ...w.dummies.map((d) => ({ x: d.x, y: d.y, k: 1 }))]) {
      const dd = Math.hypot(d.x - p.x, d.y - p.y) * d.k;
      if (dd < best) {
        best = dd;
        aimX = d.x + this.rng.range(-6, 6);
        aimY = d.y - 16 + this.rng.range(-6, 6);
      }
    }
    if (this.burst <= 0 && this.rng.chance(0.03)) this.burst = this.rng.int(10, 50);
    const fire = this.burst > 0;
    this.burst--;
    return {
      moveX: tx / l,
      moveY: ty / l,
      aimX,
      aimY,
      fire,
      roll: this.rng.chance(0.01),
      reload: this.rng.chance(0.002),
    };
  }
}
