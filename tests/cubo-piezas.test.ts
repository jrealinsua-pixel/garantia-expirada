// El Cubo de Piezas (M10 4c, planta 3): a slow turret that keeps its distance and lobs handfuls
// of building pieces; they lie on the floor 6 s, hurt if walked on (not rolled over) and a bullet
// sweeps them away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BRICK_KINDS, ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_2, SLOT_ENEMIES_3 } from '../src/data/rooms.ts';
import { BRICK_LINE, DOWN_CAUSES } from '../src/data/texts.ts';
import type { LobberBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { isWallAt } from '../src/sim/room.ts';
import {
  activeWarnings, brickUnder, createWorld, DT, frostSlow, isRolling, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type Frost, type World,
} from '../src/sim/world.ts';

const def = ENEMIES['cubo-piezas']!;
const brain = def.brain as LobberBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function yard(seed = 'cubo', dist = 140): { w: World; en: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const en = spawnEnemy(w.nextId++, def, w.player.x + dist, w.player.y);
  w.enemies = [en];
  return { w, en };
}

const bricks = (w: World): Frost[] => w.frost.filter((f) => f.brick !== undefined);

/** Steps until the bucket has thrown a handful (or `max` s go by). */
function untilThrown(w: World, max = 6): void {
  for (let i = 0; i < ticks(max) && bricks(w).length === 0; i++) step(w, NO_INPUT);
}

test('el cubo de piezas es contenido: datos, sprites, causa de baja y solo desde la planta 3', () => {
  assert.equal(def.name, 'Cubo de Piezas');
  assert.equal(def.hp, 7);
  assert.equal(brain.life, 6, 'las piezas se quedan 6 s');
  assert.equal(brain.damage, 1, 'pisar una quita medio corazón');
  assert.ok(!/[!¡]/.test(def.name + def.description + BRICK_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number }>;
  assert.equal(sheets['cubo-piezas']?.frames, 7, 'de pie, andando y con la tapa levantada');
  assert.equal(sheets['pieza']?.frames, BRICK_KINDS, 'una por clase de pieza');
  assert.ok(DOWN_CAUSES['cubo-piezas']?.contact);
  assert.ok(!SLOT_ENEMIES_2.some((s) => s.ch === 'U'));
  assert.ok(SLOT_ENEMIES_3.some((s) => s.ch === 'U'));
});

test('levanta la tapa (aviso), se queda quieto y lanza un puñado de piezas en parábola alrededor de la tostadora', () => {
  const { w, en } = yard('lanza');
  w.noDamage = true;
  let warned = false;
  for (let i = 0; i < ticks(4) && en.state !== 'warn'; i++) step(w, NO_INPUT);
  assert.equal(en.state, 'warn');
  assert.equal(enemyFrame(en, 0), def.anim!.warn, 'con la tapa levantada');
  for (let i = 0; i < ticks(brain.telegraph) - 2; i++) {
    step(w, NO_INPUT);
    if (activeWarnings(w).some((wn) => wn.source === en.id)) warned = true;
    assert.ok(Math.hypot(en.vx, en.vy) < 1, 'quieto mientras avisa');
  }
  assert.ok(warned, 'el aviso se ve');
  untilThrown(w, 0.5);
  const thrown = bricks(w);
  assert.equal(thrown.length, brain.count);
  assert.ok(thrown.every((f) => f.t < 0 && f.by === 'cubo-piezas' && f.brick! >= 0 && f.brick! < BRICK_KINDS), 'en el aire');
  for (const f of thrown) assert.ok(Math.hypot(f.x - w.player.x, f.y - w.player.y) <= brain.spread * 1.05 + 1, 'cerca de la tostadora');
  // They land and stay on the floor `life` s, without slowing anyone down.
  let landed = 0;
  for (let i = 0; i < ticks(brain.flight * 1.2); i++) {
    step(w, NO_INPUT);
    landed += w.events.filter((e) => e.type === 'frostLand' && e.brick !== undefined).length;
  }
  assert.equal(landed, brain.count);
  for (const f of bricks(w)) assert.equal(frostSlow(w, f.x, f.y), 1);
  const first = bricks(w)[0]!.id;
  for (let i = 0; i < ticks(brain.life - 0.4); i++) step(w, NO_INPUT);
  assert.ok(w.frost.some((f) => f.id === first), 'siguen ahí casi 6 s después');
  for (let i = 0; i < ticks(0.6); i++) step(w, NO_INPUT);
  assert.ok(!w.frost.some((f) => f.id === first), 'y luego se recogen');
});

/** A world with one landed piece just right of the player (the bucket out of the way). */
function pieceAhead(seed: string): { w: World; f: Frost } {
  const { w, en } = yard(seed);
  en.until = 999;
  en.x = 30;
  w.player.x = 200;
  w.player.y = 150;
  untilThrown(w, 0.1);
  w.frost.push({ id: w.nextId++, x: 230, y: 150, r: 7, t: 0, life: 6, slow: 1, fromX: 0, fromY: 0, fromH: 0, flight: 1, brick: 2, damage: 1, source: en.id, by: 'cubo-piezas' });
  return { w, f: w.frost[w.frost.length - 1]! };
}

test('pisar una pieza andando quita medio corazón y la gasta; rodando por encima no pasa nada', () => {
  const walk = pieceAhead('pisar');
  const hp0 = walk.w.player.hp;
  let stepped = 0;
  for (let i = 0; i < ticks(0.6); i++) {
    step(walk.w, { ...NO_INPUT, moveX: 1 });
    stepped += walk.w.events.filter((e) => e.type === 'brickStep').length;
  }
  assert.equal(stepped, 1);
  assert.equal(walk.w.player.hp, hp0 - 1, 'medio corazón');
  assert.ok(!walk.w.frost.includes(walk.f), 'la pieza se gasta');

  const roll = pieceAhead('rodar');
  const r0 = roll.w.player.hp;
  step(roll.w, { ...NO_INPUT, moveX: 1, roll: true });
  let crossed = false;
  for (let i = 0; i < ticks(0.5) && isRolling(roll.w.player); i++) {
    step(roll.w, { ...NO_INPUT, moveX: 1 });
    if (Math.abs(roll.w.player.x - roll.f.x) < 2) crossed = true;
  }
  assert.ok(crossed, 'pasa rodando por encima');
  assert.equal(roll.w.player.hp, r0, 'sin daño');
  assert.ok(roll.w.frost.includes(roll.f), 'y la pieza sigue ahí');
  assert.ok(!roll.w.events.some((e) => e.type === 'brickStep'));
});

test('si cae a los pies de la tostadora no hace nada hasta que se aparta de ella y vuelve a pisarla', () => {
  const { w, f } = pieceAhead('a-los-pies');
  f.x = w.player.x;
  f.y = w.player.y;
  const hp0 = w.player.hp;
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  assert.equal(w.player.hp, hp0, 'quieta encima, nada');
  for (let i = 0; i < ticks(0.3); i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(w.player.hp, hp0, 'saliendo de encima, nada');
  for (let i = 0; i < ticks(0.6) && w.player.hp === hp0; i++) step(w, { ...NO_INPUT, moveX: -1 });
  assert.equal(w.player.hp, hp0 - 1, 'al volver a pisarla, sí');
});

test('una bala del jugador barre las piezas que encuentra y sigue su camino', () => {
  const { w, f } = pieceAhead('barrer');
  w.noDamage = true;
  w.player.x = 150;
  // Aim along the floor so the bullet's shadow runs over the piece.
  let swept = 0;
  for (let i = 0; i < ticks(0.6) && swept === 0; i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: 400, aimY: w.player.y - 12 });
    swept += w.events.filter((e) => e.type === 'brickSwept').length;
  }
  assert.equal(swept, 1, 'barrida');
  assert.ok(w.bullets.some((b) => b.owner === 'player'), 'y la bala sigue');
  step(w, NO_INPUT);
  assert.ok(!w.frost.includes(f));
  assert.equal(brickUnder(w, f.x, f.y), undefined);
});

test('en las salas de verdad no se mete en la pared, lanza a menudo y es determinista', () => {
  const run = (seed: string): { hash: string; throws: number } => {
    const w = createWorld({ seed, noEnemies: true, room: 'sala-pruebas' });
    w.noDamage = true;
    const en = spawnEnemy(w.nextId++, def, w.room.w / 2, w.room.h / 2 - 20);
    w.enemies = [en];
    let throws = 0;
    for (let i = 0; i < ticks(30); i++) {
      step(w, { ...NO_INPUT, moveX: i % 200 < 100 ? 1 : -1 });
      if (w.events.some((e) => e.type === 'frostThrow' && e.source === en.id)) throws++;
      assert.ok(!isWallAt(w.room, en.x, en.y), 'nunca dentro de la pared');
    }
    return { hash: worldHash(w), throws };
  };
  const a = run('juguete');
  assert.deepEqual(a, run('juguete'));
  assert.ok(a.throws >= 6, `lanza unas cuantas veces en 30 s: ${a.throws}`);
});

test('sigue tus pasos: anda por el mismo camino que la tostadora, algo más de un segundo por detrás (M14b (h9c))', () => {
  assert.ok(brain.follow);
  const { w, en } = yard('pasos', 60);
  en.state = 'idle';
  en.until = 999;
  const p = w.player;
  // The toaster walks up, then right: the corner is where it turned.
  for (let i = 0; i < ticks(0.8); i++) step(w, { ...NO_INPUT, moveY: -1 });
  const corner = { x: p.x, y: p.y };
  let nearest = Infinity;
  for (let i = 0; i < ticks(6); i++) {
    step(w, { ...NO_INPUT, moveX: i < ticks(2.5) ? 1 : 0 });
    nearest = Math.min(nearest, Math.hypot(en.x - corner.x, en.y - corner.y));
  }
  assert.ok(nearest < 14, `no pasa por la esquina donde giró la tostadora (${nearest.toFixed(1)} px)`);
});
