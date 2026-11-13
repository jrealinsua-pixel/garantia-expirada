// M13 (4): la Plancha de Vapor. Lenta y dura: cuatro corazones, anda y rueda menos, y la suela
// caliente (por donde anda deja vapor que quema a quien lo pisa). Empieza con el Pulverizador de
// Almidón: chorros cortos que dejan tiesos (más lentos) a los enemigos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { createWorld, DT, isDead, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { makeIronFrames, makeSteamFrames } from '../tools/sprites/plancha-vapor.ts';
import { makeBlenderFrames } from '../tools/sprites/batidora-vaso.ts';
import { HERO_FRAMES, makeHeroPose } from '../tools/sprites/characters.ts';

const P = CHARACTERS['plancha']!;
const T = CHARACTERS['tostadora']!;
const B = CHARACTERS['batidora-vaso']!;
const ticks = (s: number): number => Math.ceil(s / DT);

/** The test room with nothing in the way, the character at (120, 200) and the dummies far off. */
function bare(seed: string, character = 'plancha'): World {
  const w = createWorld({ seed, noEnemies: true, character });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  return w;
}

/** An enemy standing still at (x, y), with plenty of life. */
function still(w: World, x: number, y: number, id = 'microondas', hp = 100): Enemy {
  // Standing still: without the microwave's walk to the player's reflection (M14b (h9c)).
  const def = structuredClone({ ...ENEMIES[id]!, hp });
  if (def.brain.kind === 'turret') delete def.brain.mirror;
  const en = spawnEnemy(w.nextId++, def, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

test('sus números: cuatro corazones, la más lenta, rueda poco y tarda en volver, y empieza con el almidón', () => {
  assert.equal(P.maxHp, 8, 'cuatro corazones');
  assert.ok(P.maxHp > T.maxHp);
  assert.ok(P.speed < T.speed && P.speed < B.speed, 'la más lenta');
  assert.ok(P.rollTime * P.rollSpeed < T.rollTime * T.rollSpeed, 'la voltereta llega menos lejos');
  assert.ok(P.rollCooldown > T.rollCooldown, 'y tarda más en volver');
  assert.ok(P.rollIframes <= P.rollTime);
  assert.equal(P.startWeapon, 'almidon');
  assert.equal(P.ability?.kind, 'sole');
  // 2 of damage a second on the trail, as the design says.
  assert.equal(P.ability?.kind === 'sole' && P.ability.damage / P.ability.tick, 2);
});

test('el Pulverizador: dos gotas que dejan tiesos (más lentos), el que menos daño por segundo hace, y no sale en cofres', () => {
  const A = WEAPONS.almidon!;
  assert.equal(A.pellets, 2);
  assert.equal(A.bullets?.slow?.mul, 0.75);
  assert.equal(A.bullets?.slow?.look, 'starch');
  const others = Object.values(WEAPONS).filter((d) => d.id !== 'almidon');
  assert.ok(others.every((d) => (d.bullets?.slow?.mul ?? 1) > A.bullets!.slow!.mul), 'ninguna otra frena');
  assert.ok(others.every((d) => weaponProfile(A).dps < weaponProfile(d).dps), 'el daño está en el vapor');
  assert.ok(weaponProfile(A).range < weaponProfile(WEAPONS.secador!).range / 3, 'chorros cortos');
  assert.ok(!FINDABLE_WEAPONS.includes('almidon'));
  // A hit leaves the enemy starched: slower, with the starch look.
  const w = bare('almidon-disparo');
  const en = still(w, 170, 200);
  for (let i = 0; i < ticks(0.4); i++) step(w, { ...NO_INPUT, aimX: 170, aimY: 190, fire: i === 0 });
  assert.ok(en.damageTaken > 0, 'le da');
  assert.equal(en.slowMul, 0.75);
  assert.equal(en.slowLook, 'starch');
  assert.ok((en.slowT ?? 0) > 0.6);
});

test('andar deja vapor en el suelo, uno cada pocos píxeles, que se va a los 1,2 s; quieta o rodando, no', () => {
  const w = bare('rastro');
  for (let i = 0; i < ticks(0.5); i++) step(w, { ...NO_INPUT, moveX: 1 });
  const walked = w.player.x - 120;
  assert.ok(w.steam.length >= Math.floor(walked / 7) - 1 && w.steam.length <= Math.ceil(walked / 7) + 1, `${w.steam.length} nubes en ${walked.toFixed(0)} px`);
  // Standing still: no new puffs, and the old ones go.
  const n = w.steam.length;
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT);
  assert.ok(w.steam.length <= n);
  for (let i = 0; i < ticks(1.2); i++) step(w, NO_INPUT);
  assert.equal(w.steam.length, 0, 'se disipa');
  // Rolling lifts the soleplate off the floor.
  step(w, { ...NO_INPUT, moveX: 1, roll: true });
  for (let i = 0; i < ticks(P.rollTime) - 2; i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(w.steam.length, 0);
  // Nor do the others leave any.
  const t = bare('rastro-tostadora', 'tostadora');
  for (let i = 0; i < ticks(0.5); i++) step(t, { ...NO_INPUT, moveX: 1 });
  assert.equal(t.steam.length, 0);
});

test('el vapor quema a quien lo pisa: 2 de daño por segundo mientras sigue encima, y nada cuando se va', () => {
  const w = bare('quema');
  // A trail across where the enemy will stand, then walk away up the room.
  for (let i = 0; i < ticks(0.6); i++) step(w, { ...NO_INPUT, moveX: 1 });
  const en = still(w, 140, 200);
  let scalds = 0;
  for (let i = 0; i < ticks(0.6); i++) {
    step(w, { ...NO_INPUT, moveY: -1 });
    scalds += w.events.filter((e) => e.type === 'scald').length;
  }
  // At once and every 0.25 s: 3 scalds in 0.6 s (0.5 each).
  assert.equal(scalds, 3);
  assert.ok(Math.abs(en.damageTaken - 1.5) < 1e-9, `${en.damageTaken}`);
  // Once the trail is gone, nothing more.
  for (let i = 0; i < ticks(1.2); i++) step(w, NO_INPUT);
  const before = en.damageTaken;
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.equal(en.damageTaken, before);
  // Far from the trail: nothing.
  const far = still(w, 300, 100);
  for (let i = 0; i < ticks(0.4); i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(far.damageTaken, 0);
});

test('un enemigo que la persigue por su rastro acaba cayendo; uno que vuela por encima, no se quema', () => {
  const w = bare('persigue');
  const weak = still(w, 150, 200, 'microondas', 2);
  // Walk to the left past it: it stands on the trail and goes down in about a second.
  w.player.x = 175;
  for (let i = 0; i < ticks(1.5); i++) step(w, { ...NO_INPUT, moveX: i < ticks(0.4) ? -1 : 0 });
  assert.ok(isDead(weak) || weak.state === 'dying', 'cae');
  const moth = Object.values(ENEMIES).find((d) => d.brain.kind === 'moth');
  if (moth) {
    const w2 = bare('polilla');
    w2.player.x = 175;
    const m = spawnEnemy(w2.nextId++, { ...moth, hp: 100 }, 150, 200);
    w2.enemies.push(m);
    for (let i = 0; i < ticks(0.4); i++) {
      step(w2, { ...NO_INPUT, moveX: -1 });
      m.x = 150;
      m.y = 200;
    }
    assert.equal(w2.events.filter((e) => e.type === 'scald').length, 0);
  }
});

test('el maniquí de la sala de pruebas también se quema (y lo cuenta)', () => {
  const w = bare('maniqui');
  const d = w.dummies[0]!;
  d.x = 150;
  d.y = 200;
  w.player.x = 175;
  for (let i = 0; i < ticks(0.4); i++) step(w, { ...NO_INPUT, moveX: -1 });
  assert.ok(d.damageTaken > 0);
});

test('en el Mostrador no deja vapor (allí nadie se pelea)', () => {
  const w = createWorld({ seed: 'mostrador-plancha', hub: {}, character: 'plancha' });
  for (let i = 0; i < ticks(0.5); i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(w.steam.length, 0);
});

test('la partida con la plancha es determinista', () => {
  const play = (): string => {
    const w = createWorld({ seed: 'plancha-det', floor: true, character: 'plancha' });
    for (let i = 0; i < ticks(6); i++) step(w, { ...NO_INPUT, moveX: Math.sin(i / 20), moveY: Math.cos(i / 31), fire: i % 3 === 0, aimX: 300, aimY: 100, roll: i % 50 === 0 });
    return worldHash(w);
  };
  assert.equal(play(), play());
});

test('sprites: ocho fotogramas del tamaño de la tostadora, verde azulado, ancha y baja: no se confunde con las otras', () => {
  const frames = makeIronFrames();
  assert.equal(frames.length, 8);
  type Cv = { w: number; h: number; get(x: number, y: number): readonly number[] };
  for (const f of frames) assert.deepEqual([f.w, f.h], [P.look.w, P.look.h]);
  // Dominant colour: teal (green and blue well over red).
  const teal = (c: readonly number[]): boolean => c[3]! === 255 && c[1]! > c[0]! + 40 && c[2]! > c[0]! + 30;
  const count = (cv: Cv): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (teal(cv.get(x, y))) n++;
    return n;
  };
  const toaster = makeHeroPose(HERO_FRAMES[0]!.pose);
  const blender = makeBlenderFrames()[0]!;
  assert.ok(count(frames[0]!) > 150, `la plancha es verde azulada (${count(frames[0]!)})`);
  assert.ok(count(toaster) < 20 && count(blender) < 40, 'las otras, no');
  // Wider than the others: the soleplate's point sticks out in front.
  const width = (cv: Cv): number => {
    let lo = cv.w;
    let hi = 0;
    for (let y = 0; y < 30; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3]! === 255) ((lo = Math.min(lo, x)), (hi = Math.max(hi, x)));
    return hi - lo;
  };
  assert.ok(width(frames[0]!) > width(toaster) + 4 && width(frames[0]!) > width(blender) + 4);
  for (let i = 1; i < 8; i++) assert.notDeepEqual(frames[i]!.p, frames[i - 1]!.p, `fotograma ${i}`);
  assert.equal(makeSteamFrames().length, 4);
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number }>;
  assert.equal(manifest['plancha-vapor']?.frames, 8);
  assert.equal(manifest['vapor-suela']?.frames, 4);
  for (const k of ['arma-almidon', 'bala-almidon']) assert.ok(manifest[k], k);
});
