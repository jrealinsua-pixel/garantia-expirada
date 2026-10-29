// Measures floor 2's enemies by pairs: for each pair of template letters given (e.g. `OO WO RR`),
// 60 combat rooms of floor 2 with just those two enemies, played by the bot with the starting
// weapon. Prints wounds and seconds per room, and the webcam's alerts and lost recordings.
//   npm run enemigos -- OO WO II WI
import { templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { Bot } from '../src/sim/bot.ts';
import { createWorld, DT, step } from '../src/sim/world.ts';

const ROOMS = 60;
const MAX_SECONDS = 90;
const tpls = templatesOf('combat', 2);
for (const pair of process.argv.slice(2)) {
  let hurts = 0;
  let secs = 0;
  let downs = 0;
  let alerts = 0;
  let lost = 0;
  for (let i = 0; i < ROOMS; i++) {
    // Each letter costs half the budget at depth 3, so exactly the two of them come.
    const pool = [...new Set(pair)].map((ch) => ({ ch, cost: 4, weight: 1, max: pair.split(ch).length - 1 }));
    const tpl = fillTemplate(tpls[i % tpls.length]!, new Rng(`m${i}`), { depth: 3, pool });
    const w = createWorld({ seed: `m${pair}${i}`, template: tpl });
    const bot = new Bot(`m${i}`);
    let k = 0;
    for (; k < Math.round(MAX_SECONDS / DT); k++) {
      step(w, bot.think(w));
      for (const e of w.events) {
        if (e.type === 'hurt') hurts++;
        else if (e.type === 'alert') alerts++;
        else if (e.type === 'recLost') lost++;
      }
      if (w.over) {
        downs++;
        break;
      }
      if (w.enemies.length === 0) break;
    }
    secs += k * DT;
  }
  const f = (n: number): string => (n / ROOMS).toFixed(2);
  console.log(`${pair}: ${f(hurts)} heridas y ${(secs / ROOMS).toFixed(1)} s por sala · ${downs} bajas · webcam: ${f(alerts)} avisos y ${f(lost)} grabaciones perdidas`);
}
