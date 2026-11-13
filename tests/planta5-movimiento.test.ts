// M14b (h9e1): the Dispensador de Turnos goes along the walls, like the real ones, instead of keeping
// its distance in the open: about `keep` px from the toaster, in sight of it, and near where it was.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import type { TurnerBrain } from '../src/data/types.ts';
import { wallSpot } from '../src/sim/enemies.ts';
import { isWallAt, TILE } from '../src/sim/room.ts';
import { createWorld, DT, isClear, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES['dispensador-turnos']!;
const brain = def.brain as TurnerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function lobby(seed: string, dx = 150): { w: World; d: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const d = spawnEnemy(w.nextId++, def, w.player.x - dx, w.player.y);
  w.enemies = [d];
  return { w, d };
}

/** Distance (px) from (x, y) to the nearest wall straight up, down, left or right (up to 3 tiles). */
function toWall(w: World, x: number, y: number): number {
  let best = Infinity;
  for (const [ux, uy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
    for (let d = 0; d <= TILE * 3; d += 1) {
      if (isWallAt(w.room, x + ux * d, y + uy * d)) {
        best = Math.min(best, d);
        break;
      }
    }
  }
  return best;
}

test('el sitio que elige: contra una pared, a su distancia, libre y a la vista', () => {
  const { w, d } = lobby('sitio');
  const s = wallSpot(w, d, brain.keep)!;
  assert.ok(s, 'hay sitio');
  assert.ok(toWall(w, s.x, s.y) < TILE * 0.75, `contra la pared: ${toWall(w, s.x, s.y)} px`);
  const dist = Math.hypot(s.x - w.player.x, s.y - w.player.y);
  assert.ok(Math.abs(dist - brain.keep) < 40, `a unos ${brain.keep} px: ${dist.toFixed(0)}`);
  assert.ok(isClear(w, s.x, s.y, def.footRadius + 2));
});

test('no elige un sitio ocupado por un mueble', () => {
  const { w, d } = lobby('mueble');
  const s = wallSpot(w, d, brain.keep)!;
  const box = PROPS.archivador!;
  const y = s.y + 8;
  w.room.props = [{ def: box, x: s.x, y, box: { x: s.x + box.box.x, y: y + box.box.y, w: box.box.w, h: box.box.h } }];
  assert.ok(!isClear(w, s.x, s.y, def.footRadius + 2), 'el archivador tapa el sitio');
  const s2 = wallSpot(w, d, brain.keep);
  assert.ok(s2 && Math.hypot(s2.x - s.x, s2.y - s.y) > 4, 'busca otro');
  assert.ok(isClear(w, s2!.x, s2!.y, def.footRadius + 2));
});

test('si la tostadora se mueve, la sigue por la pared y casi siempre va pegado a ella', () => {
  const { w, d } = lobby('sigue');
  for (let i = 0; i < ticks(8); i++) {
    d.callT = 99;
    step(w, NO_INPUT);
  }
  assert.ok(toWall(w, d.x, d.y) < TILE * 0.75, 'llega a la pared');
  // The toaster crosses to the other half of the room.
  w.player.x = w.room.w - 120;
  let near = 0;
  let all = 0;
  for (let i = 0; i < ticks(10); i++) {
    d.callT = 99;
    step(w, NO_INPUT);
    all++;
    if (toWall(w, d.x, d.y) < TILE * 1.25) near++;
  }
  assert.ok(near / all > 0.75, `pegado a la pared el ${((100 * near) / all).toFixed(0)} % del tiempo`);
  const dist = Math.hypot(d.x - w.player.x, d.y - w.player.y);
  assert.ok(Math.abs(dist - brain.keep) < 60, `vuelve a su distancia: ${dist.toFixed(0)}`);
});

test('determinista: dos salas iguales acaban igual', () => {
  const hashes = [0, 1].map(() => {
    const { w } = lobby('det');
    for (let i = 0; i < ticks(6); i++) step(w, NO_INPUT);
    return worldHash(w);
  });
  assert.equal(hashes[0], hashes[1]);
});
