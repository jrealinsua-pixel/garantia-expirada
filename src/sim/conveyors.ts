// Conveyor belts on the floor (M12 (4b)): a rectangle of the room that carries whoever stands on it
// along at its speed (walking against it still gets somewhere), and may end in intake rollers that
// bite. The Trituradora lays one over its whole room in phase 2, «Despiece» (BossPhase.belt); the
// workshop's own belts (M12 (3b3)) can be laid the same way from the room templates.
import { isDead, DT, hurtPlayer, type Enemy, type World } from './world.ts';
import { TILE, BACK_WALL_ROWS } from './room.ts';

export interface Conveyor {
  id: number;
  /** The belt (px): the rectangle that carries. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Which way it runs (a unit vector along an axis) and how fast (px/s). */
  dirX: number;
  dirY: number;
  speed: number;
  /** The intake rollers: the last `bite` px of the belt, downstream (0: none). */
  bite: number;
  /** Seconds before the rollers can bite again. */
  biteCd: number;
  /** Seconds it has been running (the render moves the belt by `t * speed`). */
  t: number;
  /** The boss that laid it (it stops when that one falls), and who to blame for a bite. */
  source?: number;
  by?: string;
}

/**
 * Damage of a bite (the boss's touch), and how hard it throws the toaster back up the belt (px/s):
 * enough to land some 60 px out, over a second and a half of belt away from the next bite.
 */
export const BITE_DAMAGE = 1;
export const BITE_THROW = 480;
/** Seconds between two bites. */
export const BITE_COOLDOWN = 0.7;

export function inConveyor(c: Conveyor, x: number, y: number): boolean {
  return x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h;
}

/** Whether (x, y) is in the intake rollers at the end of the belt. */
export function inBite(c: Conveyor, x: number, y: number): boolean {
  if (c.bite <= 0 || !inConveyor(c, x, y)) return false;
  if (c.dirX > 0) return x >= c.x + c.w - c.bite;
  if (c.dirX < 0) return x < c.x + c.bite;
  if (c.dirY > 0) return y >= c.y + c.h - c.bite;
  return y < c.y + c.bite;
}

/** px/s the belts carry whoever stands at (x, y): one belt at a time, the fastest. */
export function conveyorPush(w: World, x: number, y: number): { x: number; y: number } {
  let best: Conveyor | undefined;
  for (const c of w.conveyors) if (inConveyor(c, x, y) && (!best || c.speed > best.speed)) best = c;
  return best ? { x: best.dirX * best.speed, y: best.dirY * best.speed } : { x: 0, y: 0 };
}

/** The belt under (x, y), if any. */
export function conveyorAt(w: World, x: number, y: number): Conveyor | undefined {
  return w.conveyors.find((c) => inConveyor(c, x, y));
}

/**
 * Lays a belt over the whole floor of the room (inside the walls), running towards the side wall
 * farther from the player, for boss `boss`. Returns it.
 */
export function layFloorBelt(w: World, boss: Enemy, speed: number, bite: number): Conveyor {
  const dirX = w.player.x < w.room.w / 2 ? 1 : -1;
  const c: Conveyor = {
    id: w.nextId++,
    x: TILE,
    y: TILE * BACK_WALL_ROWS,
    w: w.room.w - TILE * 2,
    h: w.room.h - TILE * (BACK_WALL_ROWS + 1),
    dirX,
    dirY: 0,
    speed,
    bite,
    biteCd: 0,
    t: 0,
    source: boss.id,
    by: boss.def.id,
  };
  w.conveyors.push(c);
  w.events.push({ type: 'conveyor', id: c.id, on: true, x: c.x + c.w / 2, y: c.y + c.h / 2 });
  return c;
}

/** The belts run on; those of a fallen boss stop; the rollers bite. */
export function updateConveyors(w: World): void {
  if (w.conveyors.length === 0) return;
  w.conveyors = w.conveyors.filter((c) => {
    if (c.source === undefined) return true;
    const boss = w.enemies.find((e) => e.id === c.source);
    if (boss && !isDead(boss) && boss.state !== 'dying') return true;
    w.events.push({ type: 'conveyor', id: c.id, on: false, x: c.x + c.w / 2, y: c.y + c.h / 2 });
    return false;
  });
  const p = w.player;
  for (const c of w.conveyors) {
    c.t += DT;
    c.biteCd = Math.max(0, c.biteCd - DT);
    if (w.over || c.biteCd > 0 || !inBite(c, p.x, p.y)) continue;
    // Caught in the rollers: a hit (if it can be hurt) and thrown back down the belt either way.
    c.biteCd = BITE_COOLDOWN;
    p.vx = -c.dirX * BITE_THROW;
    p.vy = -c.dirY * BITE_THROW;
    if (p.rollT >= 0) {
      // A roll into the rollers ends there.
      p.rollT = -1;
      p.rollCooldown = p.def.rollCooldown;
    }
    hurtPlayer(w, BITE_DAMAGE, c.source ?? -1, -c.dirX, -c.dirY, { by: c.by ?? 'desconocido', how: 'contact' });
    w.events.push({ type: 'bite', x: p.x, y: p.y, dirX: -c.dirX, dirY: -c.dirY, source: c.source ?? -1 });
  }
}
