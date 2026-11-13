// M14b (h9e2): the last two enemies with a way of moving of their own.
// - The Asistente Virtual evades the question: hold your aim on it and it glides sideways out of the
//   line of fire (never while typing, at most once every so often).
// - The Carretilla Elevadora steers like a forklift (turns slowly, only drives forward along its forks,
//   charges only when they point at you) and backs up beeping after every charge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { textWidth } from '../src/art/font.ts';
import { REVERSE_LINE, SIDESTEP_LINE } from '../src/data/texts.ts';
import type { ChargerBrain, ChatbotBrain } from '../src/data/types.ts';
import { turnBetween } from '../src/sim/enemies.ts';
import { BACK_WALL_ROWS, TILE } from '../src/sim/room.ts';
import { createWorld, DT, HAND_HEIGHT, NO_INPUT, SERVICE_LEVEL, spawnEnemy, step, worldHash, type Enemy, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const bot = ENEMIES['asistente-virtual']!;
const chat = bot.brain as ChatbotBrain;
const fork = ENEMIES.carretilla!;
const drive = fork.brain as ChargerBrain;

test('turnBetween: el giro más corto, con su signo', () => {
  assert.ok(Math.abs(turnBetween(0, Math.PI / 2) - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(turnBetween(Math.PI * 0.9, -Math.PI * 0.9) - Math.PI * 0.2) < 1e-9);
  assert.ok(Math.abs(turnBetween(-Math.PI * 0.9, Math.PI * 0.9) + Math.PI * 0.2) < 1e-9);
  assert.equal(turnBetween(1, 1), 0);
});

test('los datos y los textos nuevos caben en la fuente', () => {
  assert.ok(chat.dodge && chat.dodge.time > 0 && chat.dodge.every > chat.dodge.time);
  assert.ok(drive.steer && drive.reverse);
  assert.equal(ENEMIES.aspirador!.brain.kind, 'charger');
  assert.ok(!(ENEMIES.aspirador!.brain as ChargerBrain).steer, 'el aspirador sigue yendo a lo suyo');
  for (const t of [SIDESTEP_LINE, REVERSE_LINE]) assert.ok(textWidth(t) > 0 && textWidth(t) < 140, t);
});

/** An empty office with the toaster (untouchable) and the assistant `dx` px to its right. */
function office(seed: string, dx = 140): { w: World; a: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.intro = null;
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2 - 70;
  w.player.y = w.room.h / 2;
  const a = spawnEnemy(w.nextId++, bot, w.player.x + dx, w.player.y);
  w.enemies = [a];
  return { w, a };
}

/** Aiming at the middle of `en`'s screen, without firing. */
function aimAt(en: Enemy): Input {
  return { ...NO_INPUT, aimX: en.x, aimY: en.y - en.def.anchor.y / 2 };
}

/** Distance (px) from `en`'s feet to the line from the player's hand along their aim. */
function offLine(w: World, en: Enemy): number {
  const p = w.player;
  const ux = Math.cos(p.aim);
  const uy = Math.sin(p.aim);
  const rx = en.x - p.x;
  const ry = en.y - en.def.anchor.y / 2 - (p.y - HAND_HEIGHT);
  return Math.abs(rx * uy - ry * ux);
}

test('el asistente se aparta de tu línea de tiro cuando le apuntas, no antes', () => {
  const { w, a } = office('evasivas');
  // Typing would freeze it: keep it walking for the test.
  a.state = 'walk';
  a.until = 999;
  const first = aimAt(a);
  let at = -1;
  let dir = { x: 0, y: 0 };
  for (let i = 0; i < ticks(1); i++) {
    const before = w.events.length;
    step(w, first);
    const ev = w.events.slice(before).find((e) => e.type === 'sidestep') ?? w.events.find((e) => e.type === 'sidestep');
    if (ev && ev.type === 'sidestep' && at < 0) {
      at = i * DT;
      dir = { x: ev.dirX, y: ev.dirY };
      assert.ok(ev.first, 'la primera vez lo dice');
    }
  }
  assert.ok(at >= chat.dodge!.react - DT * 2, `no esquiva al instante: ${at.toFixed(2)} s`);
  assert.ok(at > 0 && at < chat.dodge!.react + 0.2, `esquiva al rato de apuntarle: ${at.toFixed(2)} s`);
  // Sideways: across the line from the toaster to it, not towards or away.
  assert.ok(Math.abs(dir.x) < 0.35, `de lado: (${dir.x.toFixed(2)}, ${dir.y.toFixed(2)})`);
  assert.ok(offLine(w, a) > 30, `fuera de la línea de tiro: ${offLine(w, a).toFixed(1)} px`);
});

test('no esquiva si no le apuntas, ni mientras escribe, y no más de una vez cada tanto', () => {
  {
    const { w, a } = office('sin-apuntar');
    a.state = 'walk';
    a.until = 999;
    // Aiming straight up: well away from it.
    for (let i = 0; i < ticks(2); i++) step(w, { ...NO_INPUT, aimX: w.player.x, aimY: w.player.y - 200 });
    assert.equal(a.evade?.n ?? 0, 0);
  }
  {
    const { w, a } = office('escribiendo');
    a.state = 'warn';
    a.until = 999;
    for (let i = 0; i < ticks(2); i++) step(w, aimAt(a));
    assert.equal(a.evade?.n ?? 0, 0, 'escribiendo no se mueve');
  }
  {
    const { w, a } = office('cada-tanto');
    a.state = 'walk';
    a.until = 999;
    const times: number[] = [];
    for (let i = 0; i < ticks(4); i++) {
      a.until = 999;
      const n = a.evade?.n ?? 0;
      // Following it with the aim all the time.
      step(w, aimAt(a));
      if ((a.evade?.n ?? 0) > n) times.push(i * DT);
    }
    assert.ok(times.length >= 2, `esquiva más de una vez si le sigues: ${times.length}`);
    for (let i = 1; i < times.length; i++) assert.ok(times[i]! - times[i - 1]! >= chat.dodge!.every - DT, `cada ${chat.dodge!.every} s como poco`);
  }
});

test('si un lado está tapado, se aparta por el otro', () => {
  const { w, a } = office('pared');
  // Up against the top wall: the only way out of the line is down.
  a.y = BACK_WALL_ROWS * TILE + bot.footRadius + 3;
  w.player.y = a.y;
  for (let i = 0; i < 5; i++) {
    a.state = 'walk';
    a.until = 999;
    step(w, aimAt(a));
  }
  const y0 = a.y;
  let side: number | undefined;
  for (let i = 0; i < ticks(1) && side === undefined; i++) {
    a.until = 999;
    const before = w.events.length;
    step(w, aimAt(a));
    const ev = w.events.slice(before).find((e) => e.type === 'sidestep');
    if (ev && ev.type === 'sidestep') side = ev.dirY;
  }
  assert.ok(side !== undefined, 'esquiva');
  assert.ok(side! > 0.5, `hacia abajo: ${side}`);
  for (let i = 0; i < ticks(chat.dodge!.time); i++) step(w, NO_INPUT);
  assert.ok(a.y > y0 + 20, `bajó: ${y0.toFixed(0)} → ${a.y.toFixed(0)}`);
});

/** The workshop with its belts off, the toaster (untouchable) and a forklift. */
function workshop(seed: string, fx: number, fy: number, px: number, py: number): { w: World; f: Enemy } {
  const w = createWorld({ seed, room: 'cinta-clasificacion', level: SERVICE_LEVEL, noEnemies: true });
  w.intro = null;
  w.noDamage = true;
  w.conveyors = [];
  w.room.props = [];
  w.player.x = px;
  w.player.y = py;
  const f = spawnEnemy(w.nextId++, fork, fx, fy);
  w.enemies = [f];
  return { w, f };
}

test('la carretilla gira despacio y solo avanza hacia donde miran las horquillas', () => {
  // Facing right, with the toaster behind it.
  const { w, f } = workshop('volante', 300, 180, 160, 180);
  f.dirX = 1;
  f.dirY = 0;
  f.until = 999;
  let head = 0;
  let worstSide = 0;
  for (let i = 0; i < ticks(1); i++) {
    step(w, NO_INPUT);
    const now = Math.atan2(f.dirY, f.dirX);
    const turned = Math.abs(turnBetween(head, now));
    assert.ok(turned <= (drive.steer!.turnRate * Math.PI) / 180 * DT + 1e-6, `gira ${turned} rad en un tick`);
    head = now;
    assert.equal(f.state, 'walk', 'de espaldas no embiste');
    const v = Math.hypot(f.vx, f.vy);
    if (v > 5) worstSide = Math.max(worstSide, Math.abs(f.vx * f.dirY - f.vy * f.dirX) / v);
  }
  assert.ok(worstSide < 0.25, `no va de lado: ${worstSide.toFixed(2)}`);
  assert.ok(Math.abs(turnBetween(0, head)) > Math.PI * 0.25, 'pero va girando hacia ti');
  // Given time, it comes round and charges.
  let charged = false;
  f.until = 0;
  for (let i = 0; i < ticks(5) && !charged; i++) {
    step(w, NO_INPUT);
    if (f.state === 'charge') charged = true;
  }
  assert.ok(charged, 'acaba dando la vuelta y embistiendo');
});

test('tras embestir da marcha atrás pitando, por donde vino', () => {
  const { w, f } = workshop('marcha-atras', 200, 180, 300, 180);
  const beeps: boolean[] = [];
  let charge: { x: number; y: number } | undefined;
  let backed = 0;
  let after = '';
  for (let i = 0; i < ticks(8) && !after; i++) {
    const before = w.events.length;
    const prev = f.state;
    const ox = f.x;
    const oy = f.y;
    step(w, NO_INPUT);
    for (const e of w.events.slice(before)) if (e.type === 'reverseBeep') beeps.push(e.first);
    if (f.state === 'charge' && !charge) {
      charge = { x: f.dirX, y: f.dirY };
      // Out of its way.
      w.player.y = 60;
    }
    if (f.state === 'reverse' && charge) {
      const mx = f.x - ox;
      const my = f.y - oy;
      assert.ok(mx * charge.x + my * charge.y <= 1e-6, 'hacia atrás');
      backed += Math.hypot(mx, my);
    }
    if (prev === 'reverse' && f.state !== 'reverse') after = f.state;
  }
  assert.ok(charge, 'embiste');
  assert.equal(beeps[0], true, 'avisa al meter la marcha atrás');
  assert.ok(beeps.length >= 3, `pita: ${beeps.length}`);
  assert.ok(backed > 30, `recula: ${backed.toFixed(0)} px`);
  assert.equal(after, 'walk', 'y vuelve a buscarte');
});

test('la marcha atrás se para al dar con algo', () => {
  const { w, f } = workshop('tope', 200, 180, 300, 180);
  // Put it in reverse with its back against the left wall.
  f.x = 40;
  f.dirX = 1;
  f.dirY = 0;
  f.state = 'reverse';
  f.t = 0;
  f.until = 5;
  let stopped = -1;
  for (let i = 0; i < ticks(3) && stopped < 0; i++) {
    step(w, NO_INPUT);
    if (f.state !== 'reverse') stopped = i * DT;
  }
  assert.ok(stopped >= 0 && stopped < 1, `se para contra la pared: ${stopped.toFixed(2)} s`);
});

test('determinista: misma semilla, misma partida con los dos', () => {
  const run = (): string => {
    const { w, a } = office('det');
    const f = spawnEnemy(w.nextId++, fork, a.x, a.y + 60);
    w.enemies.push(f);
    for (let i = 0; i < ticks(6); i++) step(w, aimAt(a));
    return worldHash(w);
  };
  assert.equal(run(), run());
});
