// npm run bot [-- --partidas N --segundos S]: plays N headless games with the bot and fails on
// exceptions, broken invariants, non-determinism or a bot that gets stuck for good.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Bot } from '../src/sim/bot.ts';
import { checkInvariants, createWorld, DT, frostSlow, step, worldHash } from '../src/sim/world.ts';
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
  /** Enemies taken apart and coupons picked up, per minute. */
  bajasPorMinuto: number;
  cuponesPorMinuto: number;
  /** Mean seconds until the first full clear of the test room (games that never clear it count as the whole game). */
  primeraLimpieza: number;
  /** Games the bot is still standing at the end (%), mean seconds alive, and hits taken per minute alive. */
  supervivencia: number;
  /** Games in which the bot empties the room (every enemy taken apart) before going down (%): the M2 criterion. */
  superaSala: number;
  segundosVivo: number;
  heridasPorMinuto: number;
  msPorPartida: number;
  /** The boss fight (M4 criterion): see BossReport. */
  jefe?: BossReport;
  /** Whole floors (M3 criterion): see FloorReport. */
  plantas: FloorReport;
  errores: string[];
}

export interface FloorReport {
  plantas: number;
  /** Floors whose every room (but the secret one) the bot walks into, with nothing able to hurt it: must be 100 %. */
  recorridoSinDanio: number;
  /** Mean seconds to walk the whole floor that way. */
  segundosRecorrido: number;
  /** The same floors with damage on: walked whole (%), went down (%), rooms visited and combat rooms cleared per floor. */
  recorridoConDanio: number;
  caidas: number;
  salasVisitadas: number;
  salasLimpias: number;
  /** Mean seconds a combat room takes to clear (from walking in to the shutters rolling up). */
  segundosPorSala: number;
  heridasPorSala: number;
  /** Weapons carried at the end (with damage on), and how many different arsenals the floors ended with. */
  armas: number;
  arsenalesDistintos: number;
  /** Passive items carried at the end (with damage on), and how many different builds (weapons + items) the floors ended with. */
  objetos: number;
  buildsDistintas: number;
  /** Floors (with damage on) that ended with an active item, and how many times it was used per floor. */
  conActivo: number;
  usosActivo: number;
}

function arg(name: string, def: number): number {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? Number(process.argv[i + 1]) : def;
}

interface GameResult {
  hash: string;
  shots: number;
  /** Bullets fired (the iron fires several per shot): what the accuracy is measured on. */
  bullets: number;
  hits: number;
  contacts: number;
  stuck: number;
  kills: number;
  coupons: number;
  clearT: number;
  alive: number;
  hurts: number;
  errors: string[];
}

function playOne(seed: string, seconds: number): GameResult {
  const w = createWorld({ seed });
  const bot = new Bot(seed);
  let shots = 0;
  let bullets = 0;
  let hits = 0;
  let contacts = 0;
  let clearT = seconds;
  let hurts = 0;
  const errors: string[] = [];
  const ticks = Math.round(seconds / DT);
  try {
    for (let i = 0; i < ticks; i++) {
      step(w, bot.think(w));
      for (const e of w.events) {
        if (e.type === 'shot') {
          shots++;
          bullets += w.player.weapon.def.pellets;
        } else if (e.type === 'hit') hits++;
        else if (e.type === 'contact') contacts++;
        else if (e.type === 'hurt') hurts++;
      }
      if (w.over) break;
      if (clearT === seconds && w.enemies.length === 0) clearT = w.tick * DT;
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
  const alive = w.over ? w.tick * DT : seconds;
  if (bot.stuck > (alive / 3) * 0.5 && alive > 9) errors.push(`${seed}: el bot se ha quedado atascado ${bot.stuck} veces`);
  return { hash: worldHash(w), shots, bullets, hits, contacts, stuck: bot.stuck, kills: w.kills, coupons: w.player.coupons, clearT, alive, hurts, errors };
}

interface FloorResult {
  explored: boolean;
  /** Weapon ids carried at the end, in the order found. */
  arsenal: string;
  /** Passive item ids carried at the end, in the order found ('' for none). */
  items: string;
  /** The active item carried at the end ('' for none) and how many times one was used. */
  active: string;
  uses: number;
  down: boolean;
  seconds: number;
  visited: number;
  cleared: number;
  roomSeconds: number[];
  hurts: number;
  hash: string;
  errors: string[];
}

/** The bot walks one generated floor until every room is visited, it goes down or time runs out. */
export function playFloor(seed: string, maxSeconds: number, noDamage: boolean): FloorResult {
  const w = createWorld({ seed, floor: true });
  w.noDamage = noDamage;
  const bot = new Bot(seed);
  const errors: string[] = [];
  const roomSeconds: number[] = [];
  let enteredAt = -1;
  let hurts = 0;
  let uses = 0;
  const ticks = Math.round(maxSeconds / DT);
  try {
    for (let i = 0; i < ticks && !Bot.explored(w) && !w.over; i++) {
      step(w, bot.think(w));
      for (const e of w.events) {
        if (e.type === 'doors') {
          if (e.shut) enteredAt = w.tick;
          else if (enteredAt >= 0) roomSeconds.push((w.tick - enteredAt) * DT);
        } else if (e.type === 'hurt') hurts++;
        else if (e.type === 'active') uses++;
      }
      if (i % 30 === 0) {
        const errs = checkInvariants(w);
        if (errs.length) {
          errors.push(`planta ${seed} tick ${w.tick}: ${errs.join('; ')}`);
          break;
        }
      }
    }
  } catch (e) {
    errors.push(`planta ${seed}: excepción ${(e as Error).stack ?? e}`);
  }
  const f = w.floor!;
  const explored = Bot.explored(w);
  if (noDamage && !explored && !errors.length) {
    errors.push(`planta ${seed}: el bot no ha recorrido la planta en ${maxSeconds} s (atascado en ${w.room.id}, ${f.rooms.filter((r) => r.visited).length}/${f.layout.rooms.length - 1} salas)`);
  }
  return {
    explored,
    down: w.over,
    seconds: w.tick * DT,
    visited: f.rooms.filter((r) => r.visited).length,
    cleared: f.layout.rooms.filter((r) => r.kind === 'combat' && f.rooms[r.id]!.cleared).length,
    roomSeconds,
    hurts,
    arsenal: w.player.arsenal.map((ws) => ws.base.id).join('+'),
    items: w.player.items.join('+'),
    active: w.player.active?.id ?? '',
    uses,
    hash: worldHash(w),
    errors,
  };
}

export interface BossReport {
  combates: number;
  /** Fights the bot wins (%), and the mean, shortest and longest of those fights (s). */
  gana: number;
  segundos: number;
  minimo: number;
  maximo: number;
  /** Hits taken per fight, and seconds per fight walking on frost. */
  heridas: number;
  segundosEnEscarcha: number;
  /** Fights that reach the second phase (%), when it starts (mean s), and hits taken in each phase per fight. */
  llegaFase2: number;
  segundoFase2: number;
  heridasFase1: number;
  heridasFase2: number;
  /** Fights won that end with the toaster going down the goods lift (%). */
  montacargas: number;
}

/** The bot fights the floor boss in its room (entrance skipped), with damage, up to `maxSeconds`. */
export function runBoss(fights: number, maxSeconds = 240): { report: BossReport; errors: string[] } {
  const errors: string[] = [];
  const won: number[] = [];
  let hurts = 0;
  let frostT = 0;
  const phase2At: number[] = [];
  const phaseHurts = [0, 0];
  let lifted = 0;
  for (let i = 0; i < fights; i++) {
    const seed = `jefe-${i}`;
    let phase = 0;
    const w = createWorld({ seed, room: 'jefe' });
    w.intro = null;
    const bot = new Bot(seed);
    try {
      for (let t = 0; t < maxSeconds / DT && !w.over; t++) {
        step(w, bot.think(w));
        for (const e of w.events) {
          if (e.type === 'hurt') {
            hurts++;
            phaseHurts[Math.min(1, phase)]!++;
          }
          // The fight is won when her life runs out; she then takes BOSS_DEATH s to come apart.
          if (e.type === 'bossDying') won.push(t * DT);
          if (e.type === 'bossPhase' && e.phase >= 1 && phase === 0) {
            phase = 1;
            phase2At.push(t * DT);
          }
        }
        if (frostSlow(w, w.player.x, w.player.y) < 1) frostT += DT;
        // After the fight, down the lift (that is the end of the floor).
        if (w.won) {
          lifted++;
          break;
        }
        if (t % 30 === 0) {
          const errs = checkInvariants(w);
          if (errs.length) {
            errors.push(`jefe ${seed} tick ${w.tick}: ${errs.join('; ')}`);
            break;
          }
        }
      }
    } catch (e) {
      errors.push(`jefe ${seed}: excepción ${(e as Error).stack ?? e}`);
    }
  }
  const one = (n: number): number => Math.round(n * 10) / 10;
  return {
    report: {
      combates: fights,
      gana: one((won.length / fights) * 100),
      segundos: won.length ? one(won.reduce((a, b) => a + b, 0) / won.length) : 0,
      minimo: won.length ? one(Math.min(...won)) : 0,
      maximo: won.length ? one(Math.max(...won)) : 0,
      heridas: Math.round((hurts / fights) * 100) / 100,
      segundosEnEscarcha: one(frostT / fights),
      llegaFase2: one((phase2At.length / fights) * 100),
      segundoFase2: phase2At.length ? one(phase2At.reduce((a, b) => a + b, 0) / phase2At.length) : 0,
      heridasFase1: Math.round((phaseHurts[0]! / fights) * 100) / 100,
      heridasFase2: Math.round((phaseHurts[1]! / fights) * 100) / 100,
      montacargas: won.length ? one((lifted / won.length) * 100) : 0,
    },
    errors,
  };
}

export function runFloors(floors: number, maxSeconds = 600): { report: FloorReport; errors: string[]; failed: number } {
  const errors: string[] = [];
  let failed = 0;
  let walked = 0;
  let walkT = 0;
  let explored = 0;
  let down = 0;
  let visited = 0;
  let cleared = 0;
  let hurts = 0;
  const rooms: number[] = [];
  const arsenals: string[] = [];
  const builds: string[] = [];
  let items = 0;
  let withActive = 0;
  let uses = 0;
  for (let i = 0; i < floors; i++) {
    const a = playFloor(`planta-${i}`, maxSeconds, true);
    if (a.explored) walked++;
    walkT += a.seconds;
    const b = playFloor(`planta-${i}`, maxSeconds, false);
    if (b.explored) explored++;
    if (b.down) down++;
    visited += b.visited;
    cleared += b.cleared;
    hurts += b.hurts;
    rooms.push(...b.roomSeconds);
    arsenals.push(b.arsenal);
    builds.push(`${b.arsenal}|${b.items}|${b.active}`);
    if (b.active) withActive++;
    uses += b.uses;
    items += b.items ? b.items.split('+').length : 0;
    for (const r of [a, b]) {
      if (r.errors.length) {
        failed++;
        errors.push(...r.errors);
      }
    }
  }
  const x = playFloor('planta-determinismo', 30, false).hash;
  const y = playFloor('planta-determinismo', 30, false).hash;
  if (x !== y) {
    failed++;
    errors.push(`Planta no determinista: ${x} ≠ ${y}`);
  }
  const pct = (n: number): number => Math.round((n / floors) * 1000) / 10;
  const one = (n: number): number => Math.round(n * 10) / 10;
  return {
    report: {
      plantas: floors,
      recorridoSinDanio: pct(walked),
      segundosRecorrido: one(walkT / floors),
      recorridoConDanio: pct(explored),
      caidas: pct(down),
      salasVisitadas: one(visited / floors),
      salasLimpias: one(cleared / floors),
      segundosPorSala: rooms.length ? one(rooms.reduce((s, v) => s + v, 0) / rooms.length) : 0,
      heridasPorSala: rooms.length ? Math.round((hurts / Math.max(1, cleared)) * 100) / 100 : 0,
      armas: one(arsenals.reduce((s, a) => s + a.split('+').length, 0) / floors),
      arsenalesDistintos: new Set(arsenals).size,
      objetos: one(items / floors),
      buildsDistintas: new Set(builds).size,
      conActivo: pct(withActive),
      usosActivo: one(uses / floors),
    },
    errors,
    failed,
  };
}

export function runBots(games: number, seconds: number, floors = 0, bosses = 0): BotReport {
  const t0 = performance.now();
  const errors: string[] = [];
  let shots = 0;
  let bullets = 0;
  let hits = 0;
  let stuck = 0;
  let contacts = 0;
  let kills = 0;
  let coupons = 0;
  let clearT = 0;
  let alive = 0;
  let survived = 0;
  let cleared = 0;
  let hurts = 0;
  let failed = 0;
  for (let i = 0; i < games; i++) {
    const r = playOne(`bot-${i}`, seconds);
    shots += r.shots;
    bullets += r.bullets;
    hits += r.hits;
    stuck += r.stuck;
    contacts += r.contacts;
    kills += r.kills;
    coupons += r.coupons;
    clearT += r.clearT;
    alive += r.alive;
    hurts += r.hurts;
    if (r.alive >= seconds) survived++;
    if (r.clearT < seconds) cleared++;
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
  const fl = runFloors(floors);
  failed += fl.failed;
  errors.push(...fl.errors);
  const boss = runBoss(bosses);
  failed += boss.errors.length;
  errors.push(...boss.errors);
  return {
    partidas: games,
    fallos: failed,
    segundosPorPartida: seconds,
    disparosMedios: Math.round(shots / games),
    precision: bullets ? Math.round((hits / bullets) * 1000) / 10 : 0,
    atascos: stuck,
    golpesPorMinuto: Math.round((contacts / games / (seconds / 60)) * 10) / 10,
    bajasPorMinuto: Math.round((kills / games / (seconds / 60)) * 10) / 10,
    cuponesPorMinuto: Math.round((coupons / games / (seconds / 60)) * 10) / 10,
    primeraLimpieza: Math.round((clearT / games) * 10) / 10,
    supervivencia: Math.round((survived / games) * 1000) / 10,
    superaSala: Math.round((cleared / games) * 1000) / 10,
    segundosVivo: Math.round((alive / games) * 10) / 10,
    heridasPorMinuto: alive ? Math.round((hurts / (alive / 60)) * 10) / 10 : 0,
    msPorPartida: Math.round((ms / (games + 2)) * 10) / 10,
    plantas: fl.report,
    jefe: boss.report,
    errores: errors.slice(0, 20),
  };
}

if (import.meta.main) {
  const report = runBots(arg('partidas', 200), arg('segundos', 60), arg('plantas', 20), arg('jefes', 30));
  mkdirSync(join(ROOT, 'logs'), { recursive: true });
  writeFileSync(join(ROOT, 'logs/bot.json'), JSON.stringify(report, null, 2));
  console.log(
    `${report.partidas} partidas de ${report.segundosPorPartida} s · ${report.fallos} fallos · ` +
      `${report.disparosMedios} disparos de media · precisión ${report.precision} % · ${report.atascos} atascos · ${report.golpesPorMinuto} golpes/min · ` +
      `${report.bajasPorMinuto} bajas/min · ${report.cuponesPorMinuto} cupones/min · sala limpia en ${report.primeraLimpieza} s · ` +
      `vacía la sala ${report.superaSala} % · sobrevive ${report.supervivencia} % · ${report.segundosVivo} s vivo · ${report.heridasPorMinuto} heridas/min · ${report.msPorPartida} ms/partida`,
  );
  const pl = report.plantas;
  if (pl.plantas) {
    console.log(
      `${pl.plantas} plantas · sin daño la recorre entera el ${pl.recorridoSinDanio} % en ${pl.segundosRecorrido} s · ` +
        `con daño la recorre el ${pl.recorridoConDanio} %, cae el ${pl.caidas} % · ${pl.salasVisitadas} salas visitadas y ${pl.salasLimpias} de combate limpias por planta · ` +
        `${pl.segundosPorSala} s y ${pl.heridasPorSala} heridas por sala de combate · ` +
        `acaba con ${pl.armas} armas y ${pl.objetos} objetos, ${pl.arsenalesDistintos} arsenales y ${pl.buildsDistintas} builds distintas · ` +
        `el ${pl.conActivo} % con objeto activo, ${pl.usosActivo} usos por planta`,
    );
  }
  const j = report.jefe;
  if (j?.combates) {
    console.log(
      `${j.combates} combates contra la jefa · gana el ${j.gana} % en ${j.segundos} s (${j.minimo}–${j.maximo} s) · ` +
        `${j.heridas} heridas por combate (${j.heridasFase1} en la fase 1, ${j.heridasFase2} en la 2) · ${j.segundosEnEscarcha} s en la escarcha · ` +
        `baja en el montacargas el ${j.montacargas} % de las victorias · ` +
        `llega a la fase 2 el ${j.llegaFase2} %, a los ${j.segundoFase2} s`,
    );
  }
  for (const e of report.errores) console.error('✖ ' + e);
  process.exit(report.fallos ? 1 : 0);
}
