// npm run bot [-- --partidas N --segundos S]: plays N headless games with the bot and fails on
// exceptions, broken invariants, non-determinism or a bot that gets stuck for good.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Bot } from '../src/sim/bot.ts';
import { checkInvariants, createWorld, DT, step, worldHash } from '../src/sim/world.ts';
import { ROOT } from './lib/deps.ts';

export interface BotReport {
  partidas: number;
  fallos: number;
  segundosPorPartida: number;
  disparosMedios: number;
  precision: number;
  atascos: number;
  /** Times an enemy bumped into the player, per minute (no hearts yet: a proxy for danger). */
  golpesPorMinuto: number;
  msPorPartida: number;
  errores: string[];
}

function arg(name: string, def: number): number {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}

function playOne(seed: string, seconds: number): { hash: string; shots: number; hits: number; contacts: number; stuck: number; errors: string[] } {
  const w = createWorld({ seed });
  const bot = new Bot(seed);
  let shots = 0;
  let hits = 0;
  let contacts = 0;
  const errors: string[] = [];
  const ticks = Math.round(seconds / DT);
  try {
    for (let i = 0; i < ticks; i++) {
      step(w, bot.think(w));
      for (const e of w.events) {
        if (e.type === 'shot') shots++;
        else if (e.type === 'hit') hits++;
        else if (e.type === 'contact') contacts++;
      }
      if (i % 30 === 0) {
        const errs = checkInvariants(w);
        if (errs.length) {
          errors.push(`${seed} tick ${w.tick}: ${errs.join('; ')}`);
          break;
        }
      }
    }
  } catch (e) {
    errors.push(`${seed}: excepción ${(e as Error).stack ?? e}`);
  }
  // Stuck for most of the game counts as a hang.
  if (bot.stuck > (seconds / 3) * 0.5) errors.push(`${seed}: el bot se ha quedado atascado ${bot.stuck} veces`);
  return { hash: worldHash(w), shots, hits, contacts, stuck: bot.stuck, errors };
}

export function runBots(games: number, seconds: number): BotReport {
  const t0 = performance.now();
  const errors: string[] = [];
  let shots = 0;
  let hits = 0;
  let stuck = 0;
  let contacts = 0;
  let failed = 0;
  for (let i = 0; i < games; i++) {
    const r = playOne(`bot-${i}`, seconds);
    shots += r.shots;
    hits += r.hits;
    stuck += r.stuck;
    contacts += r.contacts;
    if (r.errors.length) {
      failed++;
      errors.push(...r.errors);
    }
  }
  // Determinism: the same seed must give the same result.
  const a = playOne('bot-determinismo', 20).hash;
  const b = playOne('bot-determinismo', 20).hash;
  if (a !== b) {
    failed++;
    errors.push(`No determinista: ${a} ≠ ${b}`);
  }
  const ms = performance.now() - t0;
  return {
    partidas: games,
    fallos: failed,
    segundosPorPartida: seconds,
    disparosMedios: Math.round(shots / games),
    precision: shots ? Math.round((hits / shots) * 1000) / 10 : 0,
    atascos: stuck,
    golpesPorMinuto: Math.round((contacts / games / (seconds / 60)) * 10) / 10,
    msPorPartida: Math.round((ms / (games + 2)) * 10) / 10,
    errores: errors.slice(0, 20),
  };
}

if (import.meta.main) {
  const report = runBots(arg('partidas', 200), arg('segundos', 60));
  mkdirSync(join(ROOT, 'logs'), { recursive: true });
  writeFileSync(join(ROOT, 'logs/bot.json'), JSON.stringify(report, null, 2));
  console.log(
    `${report.partidas} partidas de ${report.segundosPorPartida} s · ${report.fallos} fallos · ` +
      `${report.disparosMedios} disparos de media · precisión ${report.precision} % · ${report.atascos} atascos · ${report.golpesPorMinuto} golpes/min · ${report.msPorPartida} ms/partida`,
  );
  for (const e of report.errores) console.error('✖ ' + e);
  process.exit(report.fallos ? 1 : 0);
}
