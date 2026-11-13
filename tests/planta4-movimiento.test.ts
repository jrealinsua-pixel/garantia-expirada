// M14b (h9d): the floor 4 enemies that only kept their distance get a way of moving of their own.
// - The Fotocopiadora hides behind whoever is nearest (on the far side from the toaster), so they
//   take the shots meant for it; with nobody to hide behind, it keeps its distance as before.
// - The Climatizador is plugged into the nearest wall by its hose: it slides round its reach to stay
//   between the plug and the toaster, and further out it cannot follow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BlowerBrain, CopierBrain } from '../src/data/types.ts';
import { HIDE_NOT_NEARER, hideSpot, plugOf } from '../src/sim/enemies.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const copier = ENEMIES.fotocopiadora!;
const cb = copier.brain as CopierBrain;
const ac = ENEMIES.climatizador!;
const ab = ac.brain as BlowerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function office(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  return w;
}

/** Steps `s` seconds, holding `still` where they are (a dummy the copier can hide behind). */
function run(w: World, s: number, still: Enemy[] = []): void {
  for (let i = 0; i < ticks(s); i++) {
    const at = still.map((e) => ({ x: e.x, y: e.y }));
    step(w, NO_INPUT);
    still.forEach((e, k) => {
      e.x = at[k]!.x;
      e.y = at[k]!.y;
      e.vx = 0;
      e.vy = 0;
    });
  }
}

test('los datos: la fotocopiadora se esconde y el climatizador va con manguera', () => {
  assert.ok(cb.hide && cb.hide.speed > cb.speed, 'se escabulle más deprisa de lo que guardaba las distancias');
  assert.ok(ab.hose && ab.hose.reach >= 80 && ab.hose.speed > ab.speed);
});

test('la fotocopiadora se pone detrás del enemigo más cercano, al otro lado de la tostadora', () => {
  const w = office('escondida');
  const p = w.player;
  const cp = spawnEnemy(w.nextId++, copier, p.x + 60, p.y + 80);
  const asp = spawnEnemy(w.nextId++, ENEMIES.impresora!, p.x + 120, p.y);
  w.enemies = [cp, asp];
  run(w, 5, [asp]);
  // Behind the printer: further from the toaster than it, and nearly on the same line.
  const dp = Math.hypot(cp.x - p.x, cp.y - p.y);
  const da = Math.hypot(asp.x - p.x, asp.y - p.y);
  assert.ok(dp > da + cb.hide!.gap * 0.6, `más lejos que la impresora: ${dp.toFixed(0)} frente a ${da.toFixed(0)}`);
  const across = Math.abs(cp.y - asp.y);
  assert.ok(across < 10, `en la línea de tiro de la impresora: ${across.toFixed(1)} px de lado`);
});

test('si la tostadora la rodea, cambia de lado para seguir tapada', () => {
  const w = office('rodear');
  const p = w.player;
  const cp = spawnEnemy(w.nextId++, copier, p.x + 140, p.y);
  const imp = spawnEnemy(w.nextId++, ENEMIES.impresora!, p.x + 80, p.y);
  w.enemies = [cp, imp];
  // The toaster goes round to the far side of the printer.
  p.x = imp.x + 100;
  run(w, 6, [imp]);
  assert.ok(cp.x < imp.x - 10, `ahora está al otro lado: ${cp.x.toFixed(0)} frente a ${imp.x.toFixed(0)}`);
});

test('no se esconde detrás de quien está encima de la tostadora; sin nadie, guarda las distancias', () => {
  const w = office('sola');
  const p = w.player;
  const cp = spawnEnemy(w.nextId++, copier, p.x + 90, p.y);
  const near = spawnEnemy(w.nextId++, ENEMIES.impresora!, p.x + HIDE_NOT_NEARER - 20, p.y);
  w.enemies = [cp, near];
  assert.equal(hideSpot(w, cp, cb.hide!.gap), null, 'demasiado cerca de la tostadora');
  w.enemies = [cp];
  run(w, 4);
  const d = Math.hypot(cp.x - p.x, cp.y - p.y);
  assert.ok(d > cb.keep - 40, `guarda las distancias: ${d.toFixed(0)}`);
});

test('el climatizador enchufa la manguera a la pared más cercana', () => {
  const w = office('enchufe');
  const top = 2 * 16 + 30;
  const en = spawnEnemy(w.nextId++, ac, w.room.w / 2 + 40, top);
  w.enemies = [en];
  const pl = plugOf(w, en, ab);
  assert.ok(Math.abs(pl.x - en.x) < 1e-9, 'enchufado justo encima');
  assert.ok(pl.y < en.y && isWallAt(w.room, pl.x, pl.y - 6), 'en la pared de arriba');
  assert.ok(pl.reach >= ab.hose!.reach);
});

test('con la manguera tirante no puede seguirte; dentro de su alcance, viene deprisa', () => {
  const w = office('correa');
  const p = w.player;
  const en = spawnEnemy(w.nextId++, ac, 60, p.y);
  w.enemies = [en];
  const pl = plugOf(w, en, ab);
  // The toaster far away to the right: it goes out to the end of its hose and stops there.
  p.x = w.room.w - 60;
  let most = 0;
  for (let i = 0; i < ticks(8); i++) {
    step(w, NO_INPUT);
    most = Math.max(most, Math.hypot(en.x - pl.x, en.y - pl.y));
  }
  assert.ok(most <= pl.reach + 0.5, `nunca pasa del alcance: ${most.toFixed(1)} de ${pl.reach}`);
  assert.ok(most > pl.reach - 6, `llega hasta el final de la manguera: ${most.toFixed(1)}`);
  // Within reach: it closes in quickly (much faster than its old 12 px/s crawl), up to `keep`.
  const w2 = office('cerca');
  const en2 = spawnEnemy(w2.nextId++, ac, 40, w2.player.y);
  w2.enemies = [en2];
  w2.player.x = en2.x + 150;
  const pl2 = plugOf(w2, en2, ab);
  const x0 = en2.x;
  for (let i = 0; i < ticks(1); i++) step(w2, NO_INPUT);
  assert.ok(en2.x - x0 > 20, `en un segundo avanza más de 20 px: ${(en2.x - x0).toFixed(1)}`);
  for (let i = 0; i < ticks(4); i++) step(w2, NO_INPUT);
  const d = Math.hypot(en2.x - w2.player.x, en2.y - w2.player.y);
  assert.ok(Math.abs(d - ab.keep) < 12 || Math.hypot(en2.x - pl2.x, en2.y - pl2.y) > pl2.reach - 6, `se queda a su distancia: ${d.toFixed(0)}`);
});

test('se desliza por el borde de su alcance para seguir entre el enchufe y la tostadora', () => {
  const w = office('arco');
  const p = w.player;
  const en = spawnEnemy(w.nextId++, ac, 60, p.y);
  w.enemies = [en];
  const pl = plugOf(w, en, ab);
  p.x = pl.x + 300;
  p.y = pl.y - 120;
  for (let i = 0; i < ticks(6); i++) step(w, NO_INPUT);
  const a1 = Math.atan2(en.y - pl.y, en.x - pl.x);
  p.y = pl.y + 120;
  for (let i = 0; i < ticks(6); i++) step(w, NO_INPUT);
  const a2 = Math.atan2(en.y - pl.y, en.x - pl.x);
  assert.ok(a1 < -0.2 && a2 > 0.2, `de arriba abajo por su arco: ${a1.toFixed(2)} → ${a2.toFixed(2)}`);
});

test('deterministas: dos salas iguales acaban igual', () => {
  const hashes = [0, 1].map(() => {
    const w = office('det');
    const p = w.player;
    w.enemies = [
      spawnEnemy(w.nextId++, copier, p.x + 150, p.y + 40),
      spawnEnemy(w.nextId++, ENEMIES.aspirador!, p.x + 100, p.y - 60),
      spawnEnemy(w.nextId++, ac, 60, p.y),
    ];
    for (let i = 0; i < ticks(6); i++) step(w, NO_INPUT);
    return worldHash(w);
  });
  assert.equal(hashes[0], hashes[1]);
});
