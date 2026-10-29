import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS } from '../src/data/rooms.ts';
import { buildRoom, TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, NO_INPUT, step, worldHash, type Input, type World } from '../src/sim/world.ts';

const aimRight = (w: World): Input => ({ ...NO_INPUT, aimX: w.player.x + 100, aimY: w.player.y - 14 });

function run(w: World, seconds: number, f: (w: World) => Input): void {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) step(w, f(w));
}

test('todas las salas de datos se construyen', () => {
  for (const t of Object.values(ROOMS)) {
    const r = buildRoom(t);
    assert.ok(r.w > 0 && r.h > 0);
  }
});

test('una sala sin borde de pared o con casillas desconocidas falla', () => {
  assert.throws(() => buildRoom({ id: 'x', name: 'x', rows: ['####', '#P.#', '#..#', '#...'] }));
  assert.throws(() => buildRoom({ id: 'x', name: 'x', rows: ['####', '#Pz#', '#..#', '####'] }));
});

test('el jugador acelera rápido y no pasa de su velocidad máxima', () => {
  const w = createWorld({ seed: 'mover' });
  const p = w.player;
  step(w, { ...aimRight(w), moveX: 1 });
  assert.ok(p.vx > 0 && p.vx < p.def.speed);
  run(w, 0.2, (w) => ({ ...aimRight(w), moveX: 1 }));
  assert.ok(Math.abs(p.vx - p.def.speed) < 1e-6, `vx ${p.vx}`);
});

test('el movimiento en diagonal no es más rápido', () => {
  const w = createWorld({ seed: 'diagonal' });
  run(w, 0.3, (w) => ({ ...aimRight(w), moveX: 1, moveY: 1 }));
  assert.ok(Math.hypot(w.player.vx, w.player.vy) <= w.player.def.speed + 1e-6);
});

test('al soltar, frena en menos de 0,1 s', () => {
  const w = createWorld({ seed: 'frenar' });
  run(w, 0.3, (w) => ({ ...aimRight(w), moveX: 1 }));
  run(w, 0.1, aimRight);
  assert.equal(w.player.vx, 0);
});

test('las paredes detienen al jugador', () => {
  const w = createWorld({ seed: 'pared' });
  run(w, 6, (w) => ({ ...aimRight(w), moveX: -1, moveY: -1 }));
  assert.deepEqual(checkInvariants(w), []);
  assert.ok(w.player.x > TILE && w.player.y > 2 * TILE, `${w.player.x},${w.player.y}`);
});

test('rodar recorre unas tres casillas y da invulnerabilidad', () => {
  const w = createWorld({ seed: 'rodar' });
  const x0 = w.player.x;
  step(w, { ...aimRight(w), moveX: 1, roll: true });
  assert.ok(w.player.invulnerable > 0.35);
  assert.ok(w.events.some((e) => e.type === 'roll'));
  run(w, 0.6, aimRight);
  const d = w.player.x - x0;
  assert.ok(d > 2.4 * TILE && d < 3.6 * TILE, `distance ${d}`);
});

test('no se puede encadenar una voltereta sin enfriamiento', () => {
  const w = createWorld({ seed: 'enfriar' });
  step(w, { ...aimRight(w), moveX: 1, roll: true });
  run(w, w.player.def.rollTime + DT, aimRight);
  step(w, { ...aimRight(w), moveX: 1, roll: true });
  assert.equal(w.player.rollT, -1);
});

test('disparar respeta la cadencia, gasta munición y recarga sola', () => {
  const w = createWorld({ seed: 'disparo' });
  const def = w.player.weapon.def;
  let shots = 0;
  const n = Math.round(1 / DT);
  for (let i = 0; i < n; i++) {
    step(w, { ...aimRight(w), fire: true });
    shots += w.events.filter((e) => e.type === 'shot').length;
  }
  assert.ok(shots >= Math.floor(def.fireRate) && shots <= Math.ceil(def.fireRate) + 1, `shots ${shots}`);
  assert.equal(w.player.weapon.ammo, def.magazine - shots);
  // Emptying the magazine starts the reload by itself.
  let reloading = false;
  for (let i = 0; i < 600 && !reloading; i++) {
    step(w, { ...aimRight(w), fire: true });
    reloading = w.events.some((e) => e.type === 'reloadStart');
  }
  assert.ok(reloading);
  assert.equal(w.player.weapon.ammo, 0);
  run(w, def.reloadTime + 0.1, aimRight);
  assert.equal(w.player.weapon.ammo, def.magazine);
  // Manual reload.
  step(w, { ...aimRight(w), fire: true });
  step(w, { ...aimRight(w), reload: true });
  assert.ok(w.player.weapon.reload > 0);
});

test('no se dispara mientras se rueda', () => {
  const w = createWorld({ seed: 'rodar-disparo' });
  step(w, { ...aimRight(w), moveX: 1, roll: true, fire: true });
  for (let i = 0; i < 10; i++) {
    step(w, { ...aimRight(w), fire: true });
    assert.equal(w.events.filter((e) => e.type === 'shot').length, 0);
  }
});

test('las balas golpean al maniquí y lo hacen tambalearse', () => {
  const w = createWorld({ seed: 'maniqui' });
  const d = w.dummies[0]!;
  // Stand to the left of the dummy, same row, and shoot at it.
  w.player.x = d.x - 90;
  w.player.y = d.y;
  run(w, 1.5, () => ({ ...NO_INPUT, aimX: d.x, aimY: d.y - 16, fire: true }));
  assert.ok(d.damageTaken >= 5, `damage ${d.damageTaken}`);
  assert.ok(Math.abs(d.lean) > 0 || Math.abs(d.leanV) > 0);
});

test('las balas mueren contra la pared', () => {
  const w = createWorld({ seed: 'balas-pared' });
  run(w, 0.5, (w) => ({ ...NO_INPUT, aimX: w.player.x - 300, aimY: w.player.y - 14, fire: true }));
  let walls = 0;
  run(w, 1, (w) => {
    walls += w.events.filter((e) => e.type === 'bulletWall').length;
    return { ...NO_INPUT, aimX: w.player.x - 300, aimY: w.player.y - 14 };
  });
  assert.ok(walls > 0);
  assert.equal(w.bullets.length, 0);
});

test('la simulación es determinista', () => {
  const play = (seed: string): string => {
    const w = createWorld({ seed });
    run(w, 5, (w) => ({
      moveX: Math.sin(w.tick / 30),
      moveY: Math.cos(w.tick / 47),
      aimX: w.player.x + Math.cos(w.tick / 20) * 50,
      aimY: w.player.y + Math.sin(w.tick / 20) * 50,
      fire: w.tick % 90 < 60,
      roll: w.tick % 100 === 0,
      reload: false,
    }));
    return worldHash(w);
  };
  assert.equal(play('a'), play('a'));
});

test('la planta (level) por ahora solo cambia el aspecto: misma partida en la planta 1 y en la 2', () => {
  const a = createWorld({ seed: 'nivel', floor: true });
  const b = createWorld({ seed: 'nivel', floor: true, level: 2 });
  assert.equal(a.level, 1);
  assert.equal(b.level, 2);
  run(a, 3, aimRight);
  run(b, 3, aimRight);
  assert.equal(worldHash(a), worldHash(b));
});
