// node tools/medir-plantas.ts [partidas] — how hard each floor is for someone who gets there
// (M10 (7)). npm run bot plays whole runs, but the bot rarely wins floor 1, so the floors above
// get two or three samples. Here, for every run, the floors below are played without damage
// (the bot gathers weapons, items and coupons as it would by playing well) and each floor is then
// played with damage from that arrival, with full life: the floor's pass rate for whoever gets
// there. The wall is the floor with the lowest pass rate.
import { crossHub } from '../src/sim/bot.ts';
import { LAST_LEVEL, nextFloor, type World } from '../src/sim/world.ts';
import { playFloor, upperTime } from './bot.ts';

export interface FloorPass {
  level: number;
  /** Runs that arrived (the floors below won without damage). */
  arrived: number;
  won: number;
  downAtBoss: number;
  /** Hits per combat room and seconds per combat room, with damage. */
  hurtsPerRoom: number;
  secondsPerRoom: number;
  /** Weapons and items carried on arrival. */
  weapons: number;
  items: number;
}

export function measureFloors(runs: number, maxSeconds = 600, prefix = 'medir-plantas', from = 0): { floors: FloorPass[]; errors: string[] } {
  const errors: string[] = [];
  const floors: FloorPass[] = [];
  const acc = new Map<number, { arrived: number; won: number; downAtBoss: number; hurts: number; rooms: number[]; weapons: number; items: number }>();
  for (let l = 1; l <= LAST_LEVEL; l++) acc.set(l, { arrived: 0, won: 0, downAtBoss: 0, hurts: 0, rooms: [], weapons: 0, items: 0 });
  for (let i = from; i < from + runs; i++) {
    const seed = `${prefix}-${i}`;
    const hub = crossHub(seed, { chatarrero: i % 2 === 1 });
    if (hub.errors.length || !hub.run) {
      errors.push(...hub.errors);
      continue;
    }
    for (let l = 1; l <= LAST_LEVEL; l++) {
      // playFloor plays on in the world it is given, so each floor starts from an arrival rebuilt
      // from the floors below (all deterministic).
      const start = l === 1 ? hub.run : rebuild(seed, i, l, maxSeconds, errors);
      if (!start) break;
      const a = acc.get(l)!;
      a.arrived++;
      a.weapons += start.player.arsenal.length;
      a.items += start.player.items.length;
      const c = playFloor(seed, upperTime(maxSeconds, l), false, true, l, start);
      if (c.errors.length) errors.push(...c.errors);
      if (c.won) a.won++;
      if (c.downAtBoss) a.downAtBoss++;
      a.hurts += c.hurts;
      a.rooms.push(...c.roomSeconds);
    }
  }
  for (const [level, a] of acc) {
    floors.push({
      level,
      arrived: a.arrived,
      won: a.won,
      downAtBoss: a.downAtBoss,
      hurtsPerRoom: a.rooms.length ? a.hurts / a.rooms.length : 0,
      secondsPerRoom: a.rooms.length ? a.rooms.reduce((s, x) => s + x, 0) / a.rooms.length : 0,
      weapons: a.arrived ? a.weapons / a.arrived : 0,
      items: a.arrived ? a.items / a.arrived : 0,
    });
  }
  return { floors, errors };
}

/** The world arriving at `level` after winning the floors below without damage (null if one of them was not won). */
function rebuild(seed: string, i: number, level: number, maxSeconds: number, errors: string[]): World | null {
  let w: World | null = crossHub(seed, { chatarrero: i % 2 === 1 }).run;
  for (let l = 1; l < level && w; l++) {
    const r = playFloor(seed, upperTime(maxSeconds, l), true, true, l, w);
    if (r.errors.length) errors.push(...r.errors);
    if (!r.won) return null;
    w = nextFloor(r.world);
    if (w) w.noDamage = false;
  }
  return w;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runs = Number(process.argv[2] ?? 20);
  const t0 = Date.now();
  const { floors, errors } = measureFloors(runs, 600, 'medir-plantas', Number(process.argv[3] ?? 0));
  for (const f of floors) {
    const pct = f.arrived ? ((f.won / f.arrived) * 100).toFixed(1) : '—';
    console.log(
      `Planta ${f.level} · llegan ${f.arrived} (con ${f.weapons.toFixed(1)} armas y ${f.items.toFixed(1)} objetos) · la gana el ${pct} % · ` +
        `cae ante el jefe ${f.downAtBoss} · ${f.hurtsPerRoom.toFixed(2)} heridas y ${f.secondsPerRoom.toFixed(1)} s por sala de combate`,
    );
  }
  for (const e of errors) console.error('✖ ' + e);
  console.log(`${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
