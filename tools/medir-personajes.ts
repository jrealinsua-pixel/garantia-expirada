// node tools/medir-personajes.ts [partidas] [personaje…] — M13: the bot plays the first floor
// with each character (criterion: it wins floor 1 with all of them). Same seeds for everyone, from
// the floor's entrance (no Mostrador), damage on, until the boss and the goods lift or a breakdown.
import { CHARACTERS } from '../src/data/characters.ts';
import { createWorld } from '../src/sim/world.ts';
import { playFloor } from './bot.ts';

export interface CharacterPass {
  character: string;
  runs: number;
  /** Floor 1 won (%), went down (%), went down at the boss (%). */
  won: number;
  down: number;
  downAtBoss: number;
  /** Hits per combat room cleared and seconds per combat room. */
  hurtsPerRoom: number;
  secondsPerRoom: number;
  errors: string[];
}

export function measureCharacter(character: string, runs: number, prefix = 'medir-personajes', maxSeconds = 900): CharacterPass {
  let won = 0;
  let down = 0;
  let downAtBoss = 0;
  let hurts = 0;
  let cleared = 0;
  const rooms: number[] = [];
  const errors: string[] = [];
  for (let i = 0; i < runs; i++) {
    const seed = `${prefix}-${i}`;
    const start = createWorld({ seed, floor: true, level: 1, character });
    const r = playFloor(seed, maxSeconds, false, true, 1, start);
    if (r.won) won++;
    if (r.down) down++;
    if (r.downAtBoss) downAtBoss++;
    hurts += r.hurts;
    cleared += r.cleared;
    rooms.push(...r.roomSeconds);
    errors.push(...r.errors);
  }
  const pct = (n: number): number => Math.round((n / runs) * 1000) / 10;
  return {
    character,
    runs,
    won: pct(won),
    down: pct(down),
    downAtBoss: pct(downAtBoss),
    hurtsPerRoom: Math.round((hurts / Math.max(1, cleared)) * 100) / 100,
    secondsPerRoom: rooms.length ? Math.round((rooms.reduce((a, v) => a + v, 0) / rooms.length) * 10) / 10 : 0,
    errors,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const runs = Number(process.argv[2] ?? 30);
  const ids = process.argv.slice(3);
  for (const id of ids.length ? ids : Object.keys(CHARACTERS)) {
    const r = measureCharacter(id, runs);
    console.log(
      `${CHARACTERS[id]?.name ?? id}: ${r.runs} partidas · gana la planta 1 el ${r.won} % · cae el ${r.down} % (${r.downAtBoss} % ante la Nevera) · ` +
        `${r.hurtsPerRoom} heridas y ${r.secondsPerRoom} s por sala`,
    );
    for (const e of r.errors) console.error('✖ ' + e);
  }
}
