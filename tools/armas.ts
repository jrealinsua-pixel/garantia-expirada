// Weapon comparison (M7): the numbers on paper and what the bot gets out of each weapon alone.
//   node tools/armas.ts [--salas 60] [--jefes 20]
// Writes logs/armas.json and prints a table. See also tests/armas.test.ts (the paper rules).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { templatesOf } from '../src/data/rooms.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { Bot } from '../src/sim/bot.ts';
import { createWorld, DT, giveItem, newWeapon, step, type World } from '../src/sim/world.ts';

const ROOT = join(import.meta.dirname, '..');

function arg(name: string, def: number): number {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}

/** The toaster with this weapon and nothing else. */
function armed(w: World, id: string): void {
  const p = w.player;
  p.arsenal = [newWeapon(WEAPONS[id]!)];
  p.slot = 0;
  p.weapon = p.arsenal[0]!;
}

export interface Fight {
  won: boolean;
  seconds: number;
  hurts: number;
  damage: number;
  pellets: number;
  hits: number;
}

/** The bot alone in `room` with `weapon` (and `items`) until the room is empty or the boss falls. */
export function fight(seed: string, room: string, weapon: string, maxSeconds: number, boss: boolean, items: string[] = []): Fight {
  const w = createWorld({ seed, room, depth: 3 });
  if (boss) w.intro = null;
  armed(w, weapon);
  for (const id of items) giveItem(w, id);
  const bot = new Bot(seed);
  const out: Fight = { won: false, seconds: maxSeconds, hurts: 0, damage: 0, pellets: 0, hits: 0 };
  for (let t = 0; t < maxSeconds / DT && !w.over; t++) {
    step(w, bot.think(w));
    for (const e of w.events) {
      if (e.type === 'hurt') out.hurts++;
      else if (e.type === 'hit') {
        out.hits++;
        out.damage += e.damage;
      } else if (e.type === 'shot') out.pellets += w.player.weapon.def.pellets;
      else if (e.type === 'bossDying') {
        out.won = true;
        out.seconds = t * DT;
      }
    }
    if (out.won) break;
    if (!boss && w.enemies.length === 0) {
      out.won = true;
      out.seconds = t * DT;
      break;
    }
  }
  return out;
}

export interface WeaponReport {
  id: string;
  /** On paper (see weaponProfile). */
  dps: number;
  burst: number;
  alpha: number;
  range: number;
  /** Combat rooms at depth 3 with only this weapon: cleared (%), mean seconds, hits taken per room, damage per second, accuracy (%). */
  salas: number;
  segundosSala: number;
  heridasSala: number;
  danioPorSegundo: number;
  precision: number;
  /** The boss with only this weapon: won (%), mean seconds of the wins, hits taken per fight. */
  jefa: number;
  segundosJefa: number;
  heridasJefa: number;
}

export function compareWeapons(rooms: number, bosses: number): WeaponReport[] {
  const combat = templatesOf('combat');
  const one = (n: number): number => Math.round(n * 10) / 10;
  return Object.keys(WEAPONS).map((id) => {
    const prof = weaponProfile(WEAPONS[id]!);
    const fs: Fight[] = [];
    for (let i = 0; i < rooms; i++) fs.push(fight(`armas-${i}`, combat[i % combat.length]!.id, id, 90, false));
    const bs: Fight[] = [];
    for (let i = 0; i < bosses; i++) bs.push(fight(`armas-jefa-${i}`, 'jefe', id, 240, true));
    const won = fs.filter((f) => f.won);
    const bwon = bs.filter((f) => f.won);
    const sum = (a: Fight[], k: keyof Fight): number => a.reduce((s, f) => s + Number(f[k]), 0);
    return {
      id,
      dps: one(prof.dps),
      burst: one(prof.burst),
      alpha: one(prof.alpha),
      range: Math.round(prof.range),
      salas: one((won.length / rooms) * 100),
      segundosSala: won.length ? one(sum(won, 'seconds') / won.length) : 0,
      heridasSala: one(sum(fs, 'hurts') / rooms),
      danioPorSegundo: one(sum(fs, 'damage') / sum(fs, 'seconds')),
      precision: one((sum(fs, 'hits') / Math.max(1, sum(fs, 'pellets'))) * 100),
      jefa: bosses ? one((bwon.length / bosses) * 100) : 0,
      segundosJefa: bwon.length ? one(sum(bwon, 'seconds') / bwon.length) : 0,
      heridasJefa: bosses ? one(sum(bs, 'hurts') / bosses) : 0,
    };
  });
}

if (import.meta.main) {
  const report = compareWeapons(arg('salas', 60), arg('jefes', 20));
  mkdirSync(join(ROOT, 'logs'), { recursive: true });
  writeFileSync(join(ROOT, 'logs/armas.json'), JSON.stringify(report, null, 2));
  console.log('arma        dps  ráfaga golpe alcance | salas  s/sala heridas daño/s precis. | jefa   s     heridas');
  for (const r of report) {
    console.log(
      `${r.id.padEnd(11)} ${String(r.dps).padStart(4)} ${String(r.burst).padStart(6)} ${String(r.alpha).padStart(5)} ${String(r.range).padStart(7)} | ` +
        `${String(r.salas).padStart(5)} ${String(r.segundosSala).padStart(7)} ${String(r.heridasSala).padStart(7)} ${String(r.danioPorSegundo).padStart(6)} ${String(r.precision).padStart(7)} | ` +
        `${String(r.jefa).padStart(5)} ${String(r.segundosJefa).padStart(5)} ${String(r.heridasJefa).padStart(7)}`,
    );
  }
}
