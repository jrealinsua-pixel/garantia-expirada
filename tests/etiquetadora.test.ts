// M11 (6c1): the Etiquetadora de Precios, floor 5's weapon of sticky labels and «Rebajado».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WEAPONS, weaponsUpTo } from '../src/data/weapons.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { weaponLines, weaponProfile } from '../src/data/describe.ts';
import { moddedWeapon } from '../src/sim/mods.ts';
import { createWorld, DT, giveWeapon, NO_INPUT, spawnEnemy, step, SWAP_TIME, type Enemy, type World } from '../src/sim/world.ts';

const E = WEAPONS.etiquetadora!;
const TAG = E.bullets!.tag!;

/** The test room with nothing in the way, the toaster holding the labeller (ready to fire). */
function range(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 120;
  w.player.y = 200;
  giveWeapon(w, 'etiquetadora');
  for (let i = 0; i < Math.ceil(SWAP_TIME / DT) + 2; i++) step(w, NO_INPUT);
  return w;
}

/** A vacuum that stands still (and does not die of what it takes: its life is huge). */
function still(w: World, x: number, y: number): Enemy {
  const en = spawnEnemy(w.nextId++, { ...ENEMIES['aspirador']!, hp: 999 }, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** Holds the trigger towards (x, y) for `secs`, keeping the enemies still; returns the events seen. */
function fireAt(w: World, x: number, y: number, secs: number, fire = true): World['events'] {
  const seen: World['events'] = [];
  for (let i = 0; i < Math.round(secs / DT); i++) {
    for (const en of w.enemies) {
      en.state = 'idle';
      en.until = 999;
      en.vx = 0;
      en.vy = 0;
    }
    step(w, { ...NO_INPUT, aimX: x, aimY: y, fire });
    seen.push(...w.events);
  }
  return seen;
}

test('la Etiquetadora es de la planta 5, con su sprite, sus balas y su etiqueta pegada', () => {
  assert.equal(E.level, 5);
  for (let level = 1; level <= 4; level++) assert.ok(!weaponsUpTo(level).includes('etiquetadora'), `planta ${level}`);
  assert.ok(weaponsUpTo(5).includes('etiquetadora'));
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  for (const k of ['arma-etiquetadora', 'bala-etiqueta', 'etiqueta-pegada']) assert.ok(keys.has(k), k);
  // The card says what is special about it.
  const lines = weaponLines(E).map((l) => l.text);
  assert.ok(lines.some((t) => t.includes('ráfagas de 3') && t.includes('estalla')), lines.join(' / '));
});

test('en el papel: el estallido es lo que cuenta; poco daño por etiqueta y el cargador que menos dura', () => {
  const others = Object.values(WEAPONS).filter((d) => d.id !== 'etiquetadora');
  // Each label alone: about half the dryer's shot (the stapler's staples stay the weakest).
  assert.ok(E.damage <= WEAPONS.secador!.damage * 0.55 && E.damage > WEAPONS.grapadora!.damage, 'daño por etiqueta');
  assert.ok(others.every((d) => weaponProfile(E).magazineSeconds < weaponProfile(d).magazineSeconds), 'segundos de cargador');
  // Three bursts a magazine: shorter than the dryer's and the stapler's.
  assert.ok(E.magazine < WEAPONS.secador!.magazine && E.magazine < WEAPONS.grapadora!.magazine, 'cargador');
  // The blast is worth twice the best single shot of the dryer (it is what you play it for).
  assert.ok(E.damage * TAG.mul > WEAPONS.secador!.damage * 1.5);
  // Better than the starting dryer per second against one, never over the balance cap.
  const p = weaponProfile(E);
  assert.ok(p.dps > weaponProfile(WEAPONS.secador!).dps && p.dps < 7, `${p.dps.toFixed(2)}`);
});

test('dispara en ráfagas de tres: tres disparos seguidos y una pausa', () => {
  const w = range('etiq-rafaga');
  const times: number[] = [];
  for (let i = 0; i < Math.round(1.6 / DT); i++) {
    step(w, { ...NO_INPUT, aimX: w.player.x + 200, aimY: w.player.y - 6, fire: true });
    if (w.events.some((e) => e.type === 'shot')) times.push(i * DT);
  }
  assert.ok(times.length >= 6, `${times.length} disparos`);
  const gaps = times.slice(1).map((t, i) => t - times[i]!);
  // Inside a burst at 1 / fireRate; after the third, the pause on top.
  assert.ok(gaps[0]! < 0.15 && gaps[1]! < 0.15, gaps.join(', '));
  assert.ok(gaps[2]! > gaps[0]! + E.burst!.pause - 0.03, gaps.join(', '));
  assert.ok(gaps[3]! < 0.15, gaps.join(', '));
});

test('soltar el gatillo a media ráfaga también espera la pausa (pulsar no dispara más rápido)', () => {
  const w = range('etiq-pulsar');
  let shots = 0;
  for (let i = 0; i < Math.round(3 / DT); i++) {
    // Taps: one tick down, one tick up.
    step(w, { ...NO_INPUT, aimX: w.player.x + 200, aimY: w.player.y - 6, fire: i % 2 === 0 });
    shots += w.events.filter((e) => e.type === 'shot').length;
  }
  const held = range('etiq-mantener');
  let heldShots = 0;
  for (let i = 0; i < Math.round(3 / DT); i++) {
    step(held, { ...NO_INPUT, aimX: held.player.x + 200, aimY: held.player.y - 6, fire: true });
    heldShots += held.events.filter((e) => e.type === 'shot').length;
  }
  assert.ok(shots <= heldShots, `pulsando ${shots}, manteniendo ${heldShots}`);
});

test('las etiquetas se pegan y la tercera en el mismo hace «Rebajado»: daño alrededor y fuera etiquetas', () => {
  const w = range('etiq-rebajado');
  const y = w.player.y - 6;
  const a = still(w, w.player.x + 70, y + 6);
  // A second one right behind it, out of the line of fire, catches only the blast.
  const b = still(w, w.player.x + 84, y + 22);
  const seen = fireAt(w, a.x + 40, y, 0.3);
  const tags = seen.filter((e) => e.type === 'tag');
  assert.ok(tags.length >= 2, `${tags.length} etiquetas`);
  // Walk on until the third one lands.
  const more = fireAt(w, a.x + 40, y, 0.5, false);
  const all = [...seen, ...more];
  const md = all.find((e) => e.type === 'markdown');
  assert.ok(md && md.type === 'markdown' && md.target === a.id, 'no ha habido «Rebajado»');
  assert.ok(md.hit >= 2, `el estallido alcanza a ${md.hit}`);
  assert.ok(b.damageTaken >= E.damage * TAG.mul * 0.99, `el de al lado recibe ${b.damageTaken}`);
  assert.ok(a.damageTaken >= E.damage * (TAG.need + TAG.mul) * 0.99, `el etiquetado recibe ${a.damageTaken}`);
  assert.ok(!a.tags, 'las etiquetas siguen pegadas');
});

test('las etiquetas se despegan si pasa su tiempo sin otra', () => {
  const w = range('etiq-despegar');
  const y = w.player.y - 6;
  const a = still(w, w.player.x + 70, y + 6);
  // One label only: fire a single tick and let go.
  fireAt(w, a.x + 40, y, DT);
  fireAt(w, a.x + 40, y, 0.4, false);
  assert.equal(a.tags, 1);
  fireAt(w, a.x + 40, y, TAG.time, false);
  assert.ok(!a.tags, `quedan ${a.tags}`);
});

test('las etiquetas también se pegan a los maniquíes de la Sala de Pruebas', () => {
  const w = range('etiq-maniqui');
  const d = w.dummies[0]!;
  d.x = w.player.x + 70;
  d.y = w.player.y + 4;
  const seen = fireAt(w, d.x + 40, w.player.y - 10, 1);
  assert.ok(seen.some((e) => e.type === 'tag' && e.target === d.id));
  assert.ok(seen.some((e) => e.type === 'markdown' && e.target === d.id));
});

test('el arma lleva sus etiquetas aunque haya objetos, y el daño de los objetos sube el estallido', () => {
  const m = moddedWeapon(E, [{ id: 'prueba', stats: [{ stat: 'damage', mul: 2 }] }]);
  assert.deepEqual(m.bullets?.tag, TAG);
  assert.equal(m.burst, E.burst);
  const w = range('etiq-objetos');
  w.player.weapon.def = m;
  const y = w.player.y - 6;
  const a = still(w, w.player.x + 70, y + 6);
  fireAt(w, a.x + 40, y, 0.8);
  assert.ok(a.damageTaken >= m.damage * (TAG.need + TAG.mul) * 0.99, `${a.damageTaken}`);
});
