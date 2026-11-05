// Measures the combat templates of one floor with the bot (scratch tool, M10 planta 4 (2a)):
// node tools/medir-salas.ts [nivel] — for each combat template, 30 rooms at depth 6 with that
// floor's enemies: hurts per room and seconds; then 20 whole floors (playFloor, no items).
import { templatesOf, slotEnemiesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, DT, step } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';
import { playFloor } from './bot.ts';

const level = Number(process.argv[2] ?? 4);
const all: number[] = [];
for (const t of templatesOf('combat', level)) {
  let hurts = 0;
  let secs = 0;
  for (let i = 0; i < 30; i++) {
    const seed = `medir:${t.id}:${i}`;
    const tpl = fillTemplate(t, new Rng(seed), { depth: 6, pool: slotEnemiesOf(level) });
    const w = createWorld({ seed, template: tpl, level });
    const bot = new Bot(seed);
    let n = 0;
    for (; n < 60 / DT && w.enemies.length > 0; n++) {
      step(w, bot.think(w));
      for (const e of w.events) if (e.type === 'hurt') hurts++;
      // Hurt but never down: every hit counts, the fight goes on.
      w.player.hp = w.player.def.maxHp;
    }
    secs += n * DT;
  }
  all.push(hurts / 30);
  console.log(`${t.id}: ${(hurts / 30).toFixed(2)} heridas, ${(secs / 30).toFixed(1)} s`);
}
console.log(`media: ${(all.reduce((a, b) => a + b, 0) / all.length).toFixed(2)}`);
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
