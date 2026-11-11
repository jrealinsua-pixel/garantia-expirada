// Measures the combat templates of one floor with the bot (scratch tool, M10 planta 4 (2a)):
// node tools/medir-salas.ts [nivel] [segundos] — for each combat template, 30 rooms as deep as on that floor (a third room in), with
// that floor's enemies: hurts per room, seconds and rooms not cleared in 60 s (or [segundos]); then
// 20 whole floors (playFloor, no items), only without [segundos]. The bot goes after the enemies as on a floor (`hunt`): wandering at random,
// it left a third of the rooms of floors 4 and 5 unfinished in 90 s, with a microwave in a corner.
import { budgetCapOf, templatesOf, slotEnemiesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, DT, LEVEL_DEPTH, step } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';
import { playFloor } from './bot.ts';

const level = Number(process.argv[2] ?? 4);
const limit = Number(process.argv[3] ?? 60);
const all: number[] = [];
let allSecs = 0;
for (const t of templatesOf('combat', level)) {
  let hurts = 0;
  let secs = 0;
  let left = 0;
  for (let i = 0; i < 30; i++) {
    const seed = `medir:${t.id}:${i}`;
    const tpl = fillTemplate(t, new Rng(seed), { depth: 3 + (level - 1) * LEVEL_DEPTH, pool: slotEnemiesOf(level), cap: budgetCapOf(level) });
    const w = createWorld({ seed, template: tpl, level });
    const bot = new Bot(seed, { hunt: true });
    let n = 0;
    for (; n < limit / DT && w.enemies.length > 0; n++) {
      step(w, bot.think(w));
      for (const e of w.events) if (e.type === 'hurt') hurts++;
      // Hurt but never down: every hit counts, the fight goes on.
      w.player.hp = w.player.def.maxHp;
    }
    secs += n * DT;
    allSecs += n * DT;
    if (w.enemies.length > 0) left++;
  }
  all.push(hurts / 30);
  console.log(`${t.id}: ${(hurts / 30).toFixed(2)} heridas, ${(secs / 30).toFixed(1)} s${left ? `, ${left} de 30 sin limpiar` : ''}`);
}
console.log(`media: ${(all.reduce((a, b) => a + b, 0) / all.length).toFixed(2)} heridas por sala, ${((all.reduce((a, b) => a + b, 0) * 30 * 60) / allSecs).toFixed(2)} por minuto`);
if (process.argv[3]) process.exit(0);
let s = 0;
let rooms = 0;
let explored = 0;
for (let i = 0; i < 20; i++) {
  const r = playFloor(`medir-planta-${level}-${i}`, 900, true, false, level);
  if (r.errors.length) console.log(r.errors);
  s += r.roomSeconds.reduce((a, b) => a + b, 0);
  rooms += r.roomSeconds.length;
  if (r.explored) explored++;
}
console.log(`plantas ${level} enteras sin daño: la recorre entera ${explored} de 20 veces, ${(s / rooms).toFixed(1)} s por sala de combate`);
