// M13 (3): la Batidora de Vaso. Rápida y frágil: dos corazones, anda y rueda más, y el giro de
// cuchillas (rodar tritura a los enemigos que toca, una vez por enemigo y vuelta, y corta las
// balas que atraviesa). Empieza con el Picahielos Turbo: muchos cubitos, poco alcance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { createWorld, DT, isDead, NO_INPUT, PLAYER_HURT_Y, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { makeBlenderFrames, makeWhirlFrames } from '../tools/sprites/batidora-vaso.ts';
import { HERO_FRAMES, makeHeroPose } from '../tools/sprites/characters.ts';

const B = CHARACTERS['batidora-vaso']!;
const T = CHARACTERS['tostadora']!;
const ticks = (s: number): number => Math.ceil(s / DT);

/** The test room with nothing in the way, the character at (120, 200) and the dummies far off. */
function bare(seed: string, character = 'batidora-vaso'): World {
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

/** An enemy standing still at (x, y), with plenty of life so the blades never finish it. */
function still(w: World, x: number, y: number, id = 'microondas'): Enemy {
  const en = spawnEnemy(w.nextId++, { ...ENEMIES[id]!, hp: 100 }, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** Rolls to the right from a standstill, then waits until the roll and its cooldown are over. */
function rollRight(w: World): void {
  for (let i = 0; i < ticks(B.rollTime + B.rollCooldown + 0.1); i++) step(w, { ...NO_INPUT, moveX: i < ticks(B.rollTime) ? 1 : 0, roll: i === 0 });
}

test('sus números: dos corazones, más rápida, rueda más y espera menos, y empieza con el Picahielos', () => {
  assert.equal(B.maxHp, 4, 'dos corazones');
  assert.ok(B.maxHp < T.maxHp);
  assert.ok(B.speed > T.speed);
  assert.ok(B.rollTime * B.rollSpeed > T.rollTime * T.rollSpeed, 'la voltereta llega más lejos');
  assert.ok(B.rollCooldown < T.rollCooldown, 'y vuelve antes');
  assert.ok(B.rollIframes <= B.rollTime);
  assert.equal(B.startWeapon, 'picahielos');
  assert.equal(B.ability?.kind, 'blades');
  assert.equal(B.ability?.kind === 'blades' && B.ability.damage, 4);
  assert.notEqual(T.ability?.kind, 'blades', 'la tostadora no tritura');
});

test('el Picahielos: dos cubitos por disparo, el que más balas echa, el que más se abre y poco alcance', () => {
  const P = WEAPONS.picahielos!;
  assert.equal(P.pellets, 2);
  const others = Object.values(WEAPONS).filter((d) => d.id !== 'picahielos');
  assert.ok(others.every((d) => P.fireRate * P.pellets > d.fireRate * d.pellets * 1.2));
  assert.ok(others.every((d) => P.spreadDeg > d.spreadDeg));
  assert.ok(weaponProfile(P).range < weaponProfile(WEAPONS.secador!).range / 3);
  assert.ok(!FINDABLE_WEAPONS.includes('picahielos'), 'no sale en los cofres');
  // Its cubes are a player's bullet: orange, never confused with the enemies' red and cyan.
  const w = bare('picahielos-disparo');
  step(w, { ...NO_INPUT, aimX: 400, aimY: 200, fire: true });
  assert.equal(w.bullets.filter((b) => b.owner === 'player').length, 2);
});

test('rodar contra un enemigo lo tritura una vez por voltereta (4 de daño) y lo aparta', () => {
  const w = bare('cuchillas');
  const en = still(w, 160, 200, 'aspirador');
  rollRight(w);
  assert.equal(en.damageTaken, 4, 'una vez, aunque la voltereta lo toque muchos pasos');
  assert.ok(w.player.x > 120);
  const blades = (): number => w.events.filter((e) => e.type === 'blade').length;
  // A second roll from the other side grinds it again.
  w.player.x = 200;
  w.player.y = 200;
  en.x = 160;
  en.y = 200;
  en.vx = en.vy = 0;
  let n = 0;
  for (let i = 0; i < ticks(B.rollTime + 0.05); i++) {
    step(w, { ...NO_INPUT, moveX: -1, roll: i === 0 });
    n += blades();
  }
  assert.equal(n, 1);
  assert.equal(en.damageTaken, 8);
  assert.ok(en.x < 157, `sale despedido hacia donde rodaba (${en.x.toFixed(1)})`);
});

test('andar contra un enemigo no tritura nada, y la tostadora rodando tampoco', () => {
  const w = bare('sin-cuchillas');
  const en = still(w, 150, 200);
  for (let i = 0; i < ticks(0.6); i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(en.damageTaken, 0);
  const t = bare('tostadora-rueda', 'tostadora');
  const en2 = still(t, 160, 200);
  for (let i = 0; i < ticks(0.5); i++) step(t, { ...NO_INPUT, moveX: 1, roll: i === 0 });
  assert.equal(en2.damageTaken, 0);
});

test('tritura también a varios en la misma vuelta, y acaba con el que tiene poca vida', () => {
  const w = bare('varios');
  const a = still(w, 150, 196);
  const b = still(w, 185, 204);
  const weak = spawnEnemy(w.nextId++, { ...ENEMIES['mando']!, hp: 3 }, 210, 200);
  weak.state = 'idle';
  weak.until = 999;
  w.enemies.push(weak);
  rollRight(w);
  assert.equal(a.damageTaken, 4);
  assert.equal(b.damageTaken, 4);
  assert.ok(isDead(weak), 'el débil cae');
});

test('la voltereta rompe las balas enemigas que atraviesa; la de la tostadora, no', () => {
  const cuts = (character: string): { cut: number; left: number } => {
    const w = bare('balas-' + character, character);
    const p = w.player;
    w.bullets.push({
      id: w.nextId++, owner: 'enemy', x: p.x + 30, y: p.y - PLAYER_HURT_Y, vx: -60, vy: 0, r: 3.5, life: 6,
      damage: 1, knockback: 0, color: 'red', age: 0, dir: Math.PI, speed: 60, h: 0,
    });
    let cut = 0;
    for (let i = 0; i < ticks(0.4); i++) {
      step(w, { ...NO_INPUT, moveX: 1, roll: i === 0 });
      cut += w.events.filter((e) => e.type === 'bulletCut').length;
    }
    return { cut, left: w.bullets.filter((b) => b.owner === 'enemy').length };
  };
  assert.deepEqual(cuts('batidora-vaso'), { cut: 1, left: 0 });
  assert.equal(cuts('tostadora').cut, 0);
});

test('el maniquí de la sala de pruebas también se tritura (y lo cuenta)', () => {
  const w = bare('maniqui');
  const d = w.dummies[0]!;
  d.x = 165;
  d.y = 200;
  rollRight(w);
  assert.equal(d.damageTaken, 4);
});

test('la partida con la batidora es determinista', () => {
  const play = (): string => {
    const w = createWorld({ seed: 'batidora-det', floor: true, character: 'batidora-vaso' });
    for (let i = 0; i < ticks(6); i++) step(w, { ...NO_INPUT, moveX: Math.sin(i / 20), moveY: Math.cos(i / 31), fire: i % 3 === 0, aimX: 300, aimY: 100, roll: i % 50 === 0 });
    return worldHash(w);
  };
  assert.equal(play(), play());
});

test('sprites: ocho fotogramas del tamaño de la tostadora, violeta y con el vaso: no se confunde con ella', () => {
  const frames = makeBlenderFrames();
  assert.equal(frames.length, 8);
  const toaster = makeHeroPose(HERO_FRAMES[0]!.pose);
  for (const f of frames) assert.deepEqual([f.w, f.h], [B.look.w, B.look.h]);
  assert.deepEqual([toaster.w, toaster.h], [T.look.w, T.look.h]);
  // Dominant colour: count opaque pixels that are clearly violet (blue and red over green).
  const violet = (c: readonly number[]): boolean => c[3]! > 0 && c[2]! > c[1]! + 30 && c[0]! > c[1]! + 10;
  const count = (cv: { w: number; h: number; get(x: number, y: number): readonly number[] }): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (violet(cv.get(x, y))) n++;
    return n;
  };
  assert.ok(count(frames[0]!) > 150, 'la batidora es violeta');
  assert.ok(count(toaster) < 20, 'la tostadora, no');
  // Taller than the toaster: the jar sticks up over where the toaster's slices end.
  const top = (cv: { w: number; h: number; get(x: number, y: number): readonly number[] }): number => {
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3]! > 0 && !(cv.get(x, y)[3]! < 255)) return y;
    return cv.h;
  };
  assert.ok(top(frames[0]!) < top(toaster));
  // Every frame differs from the last (it moves) and the hurt and broken faces differ from idle.
  for (let i = 1; i < 8; i++) assert.notDeepEqual(frames[i]!.p, frames[i - 1]!.p, `fotograma ${i}`);
  assert.equal(makeWhirlFrames().length, 4);
  // And the game has them (npm run sprites).
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number }>;
  assert.equal(manifest['batidora-vaso']?.frames, 8);
  for (const k of ['giro-cuchillas', 'arma-picahielos', 'bala-cubito-zumo']) assert.ok(manifest[k], k);
});
