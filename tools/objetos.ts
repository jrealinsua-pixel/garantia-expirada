// Passive item review (M7): what each item is worth to the bot, alone, with each weapon.
//   node tools/objetos.ts [--jefes 40] [--salas 60]
// For every item and weapon: boss fights won (%) and their length, and hits taken per combat room,
// against the same weapon with no item. Writes logs/objetos.json.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { templatesOf } from '../src/data/rooms.ts';
import { ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { fight, type Fight } from './armas.ts';

const ROOT = join(import.meta.dirname, '..');

function arg(name: string, def: number): number {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}

export interface ItemRow {
  item: string;
  weapon: string;
  /** Boss fights won (%), mean seconds of the wins, hits per fight; combat rooms: mean seconds and hits per room. */
  jefa: number;
  segundosJefa: number;
  heridasJefa: number;
  segundosSala: number;
  heridasSala: number;
}

export function reviewItems(bosses: number, rooms: number): ItemRow[] {
  const combat = templatesOf('combat');
  const one = (n: number): number => Math.round(n * 10) / 10;
  const rows: ItemRow[] = [];
  for (const item of ['', ...Object.keys(ITEMS)]) {
    for (const weapon of Object.keys(WEAPONS)) {
      const items = item ? [item] : [];
      const bs: Fight[] = [];
      for (let i = 0; i < bosses; i++) bs.push(fight(`objetos-jefa-${i}`, 'jefe', weapon, 240, true, items));
      const fs: Fight[] = [];
      for (let i = 0; i < rooms; i++) fs.push(fight(`objetos-${i}`, combat[i % combat.length]!.id, weapon, 90, false, items));
      const won = bs.filter((f) => f.won);
      rows.push({
        item: item || '(nada)',
        weapon,
        jefa: one((won.length / bosses) * 100),
        segundosJefa: won.length ? one(won.reduce((s, f) => s + f.seconds, 0) / won.length) : 0,
        heridasJefa: one(bs.reduce((s, f) => s + f.hurts, 0) / bosses),
        segundosSala: one(fs.reduce((s, f) => s + f.seconds, 0) / rooms),
        heridasSala: Math.round((fs.reduce((s, f) => s + f.hurts, 0) / rooms) * 100) / 100,
      });
    }
  }
  return rows;
}

if (import.meta.main) {
  const rows = reviewItems(arg('jefes', 40), arg('salas', 60));
  mkdirSync(join(ROOT, 'logs'), { recursive: true });
  writeFileSync(join(ROOT, 'logs/objetos.json'), JSON.stringify(rows, null, 2));
  console.log('objeto        arma        jefa %   s   heridas | s/sala heridas/sala');
  for (const r of rows) {
    console.log(
      `${r.item.padEnd(13)} ${r.weapon.padEnd(10)} ${String(r.jefa).padStart(6)} ${String(r.segundosJefa).padStart(5)} ${String(r.heridasJefa).padStart(7)} | ` +
        `${String(r.segundosSala).padStart(6)} ${String(r.heridasSala).padStart(6)}`,
    );
  }
}
