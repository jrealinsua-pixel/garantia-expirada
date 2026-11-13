// M9b (13a): the oil drums take a few shots and blow up: damage to enemies and to the toaster
// around them, and the drums next to them go up too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import { TILE } from '../src/sim/room.ts';
import type { PropInstance } from '../src/sim/room.ts';
import {
  BLAST_FUSE,
  checkInvariants,
  createWorld,
  damageProp,
  DT,
  HAND_HEIGHT,
  NO_INPUT,
  spawnEnemy,
  step,
  worldHash,
  type World,
} from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const DRUM = PROPS.barril!;

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  return w;
}

/** A drum standing on the tile whose centre is (x, y-ish). */
function drum(w: World, x: number, y: number): PropInstance {
  const pr: PropInstance = { def: DRUM, x, y, box: { x: x + DRUM.box.x, y: y + DRUM.box.y, w: DRUM.box.w, h: DRUM.box.h } };
  w.room.props.push(pr);
  return pr;
}

function idle(w: World, id: string, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

test('el bidón tiene vida y su explosión en los datos', () => {
  assert.ok(DRUM.hp && DRUM.hp > 0);
  assert.ok(DRUM.blast && DRUM.blast.radius > TILE && DRUM.blast.hurt === 2, 'quita un corazón a la tostadora');
});

test('aguanta unos disparos, se enciende y explota: daña a los enemigos de alrededor, no a los lejanos', () => {
  const w = bare('bidon');
  w.noDamage = true;
  const pr = drum(w, 240, 202);
  const near = idle(w, 'aspirador', 250, 236);
  const far = idle(w, 'aspirador', 420, 300);
  // Shoot it until it goes up.
  let shots = 0;
  let shotsToLight = 0; // hits it takes before it is lit
  let lit = false;
  for (let i = 0; i < ticks(10) && w.room.props.includes(pr); i++) {
    // Straight at it: the bullet's shadow runs along the floor into the drum.
    step(w, { ...NO_INPUT, fire: true, aimX: pr.x, aimY: w.player.y - HAND_HEIGHT });
    shots += w.events.filter((e) => e.type === 'shot').length;
    lit ||= w.events.some((e) => e.type === 'propLit');
    if (!lit) shotsToLight += w.events.filter((e) => e.type === 'propHit').length;
  }
  assert.ok(lit, 'se enciende antes de explotar');
  assert.ok(!w.room.props.includes(pr), 'el bidón ya no está');
  assert.ok(shots >= 3, `aguanta unos cuantos disparos del Secador (${shots})`);
  // M14b (h5): but not many more: it was slow to go up.
  assert.ok(shotsToLight <= 4, `y se enciende pronto (${shotsToLight} impactos)`);
  assert.equal(near.damageTaken, Math.min(DRUM.blast!.damage, near.def.hp), 'el que está cerca se lleva la explosión entera (o cae)');
  assert.equal(far.damageTaken, 0);
  assert.deepEqual(checkInvariants(w), []);
});

test('encendido tarda un momento en explotar (se ve venir)', () => {
  const w = bare('bidon-mecha');
  const pr = drum(w, 300, 250);
  damageProp(w, pr, DRUM.hp!);
  assert.equal(pr.fuse, BLAST_FUSE);
  for (let i = 0; i < ticks(BLAST_FUSE) - 2; i++) step(w, NO_INPUT);
  assert.ok(w.room.props.includes(pr), 'todavía no');
  for (let i = 0; i < 4; i++) step(w, NO_INPUT);
  assert.ok(!w.room.props.includes(pr));
});

test('a la tostadora cerca le quita un corazón; lejos, nada', () => {
  const w = bare('bidon-tostadora');
  const hp = w.player.hp;
  const pr = drum(w, w.player.x + 26, w.player.y);
  damageProp(w, pr, DRUM.hp!);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.equal(w.player.hp, hp - DRUM.blast!.hurt);
  const v = bare('bidon-lejos');
  const p2 = drum(v, v.player.x + 150, v.player.y);
  damageProp(v, p2, DRUM.hp!);
  for (let i = 0; i < ticks(1); i++) step(v, NO_INPUT);
  assert.equal(v.player.hp, hp);
});

test('las balas enemigas también lo van rompiendo, pero poco a poco', () => {
  const w = bare('bidon-enemigo');
  const pr = drum(w, 300, 250);
  const bullet = { id: w.nextId++, owner: 'enemy', x: 260, y: 243, vx: 140, vy: 0, r: 3.5, life: 3, damage: 1, knockback: 0, color: 'red', age: 0, dir: 0, speed: 140, h: 0 };
  w.bullets.push(bullet as World['bullets'][number]);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.equal(pr.damage, 1);
  assert.ok(w.room.props.includes(pr));
});

test('en cadena: un bidón que explota enciende a los vecinos, y explotan uno detrás de otro', () => {
  const w = bare('bidon-cadena');
  w.noDamage = true;
  const a = drum(w, 240, 250);
  // Each one within reach of the next, but the third out of reach of the first.
  const gap = Math.round(DRUM.blast!.radius * 0.8);
  const b = drum(w, 240 + gap, 250);
  const c = drum(w, 240 + 2 * gap, 250);
  const lone = drum(w, 240, 250 + 6 * TILE);
  damageProp(w, a, DRUM.hp!);
  const blasts: number[] = [];
  for (let i = 0; i < ticks(2); i++) {
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'blast') blasts.push(w.tick);
  }
  assert.ok(![a, b, c].some((x) => w.room.props.includes(x)), 'los tres en fila');
  assert.ok(w.room.props.includes(lone), 'el que está lejos sigue');
  assert.equal(blasts.length, 3);
  assert.ok(blasts[1]! > blasts[0]! && blasts[2]! > blasts[1]!, 'uno detrás de otro, no a la vez');
});

test('M14b (h5): explota pronto, llega lejos y hace daño de verdad', () => {
  // The fuse is short but there: a moment to roll out of the ring.
  assert.ok(BLAST_FUSE >= 0.3 && BLAST_FUSE <= 0.45, `mecha de ${BLAST_FUSE} s`);
  assert.ok(DRUM.blast!.radius >= 2.5 * TILE, `radio de ${DRUM.blast!.radius} px (dos baldosas y media o más)`);
  // A normal enemy of the first floor, caught in it, is gone or nearly.
  const w = bare('bidon-alcance');
  w.noDamage = true;
  const pr = drum(w, 300, 250);
  const en = idle(w, 'aspirador', 300 + 2.5 * TILE, 250);
  damageProp(w, pr, DRUM.hp!);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(en.damageTaken >= Math.min(ENEMIES.aspirador!.hp, 18), `a dos baldosas y media le quita ${en.damageTaken}`);
});

test('es determinista', () => {
  const run = (): string => {
    const w = bare('bidon-hash');
    w.noDamage = true;
    drum(w, 240, 202);
    idle(w, 'microondas', 270, 230);
    for (let i = 0; i < ticks(3); i++) step(w, { ...NO_INPUT, fire: true, aimX: 240, aimY: 195 - HAND_HEIGHT + 9 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
