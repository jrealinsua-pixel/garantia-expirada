// M13 (8): once a character is unlocked, its starting weapon can turn up in the other characters'
// runs (docs/DISENO.md, «Los cinco, en detalle»), from its own floor up, and never the one the
// character already carries.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, leaveHub, nextFloor, weaponPool } from '../src/sim/world.ts';
import { FINDABLE_WEAPONS, WEAPONS, weaponsUpTo } from '../src/data/weapons.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { ROSTER } from '../src/data/unlocks.ts';

const ALL = ROSTER.map((r) => r.id);
const sorted = (a: readonly string[]) => [...a].sort();

test('sin nadie desbloqueado, lo de siempre: las armas encontrables de la planta', () => {
  for (let level = 1; level <= 6; level++) assert.deepEqual(weaponPool(level, 'tostadora', []), weaponsUpTo(level));
  assert.deepEqual(weaponPool(1, 'tostadora', ['tostadora']), weaponsUpTo(1), 'el Secador es suyo: no lo encuentra');
  assert.deepEqual(weaponsUpTo(3), weaponsUpTo(3, []), 'sin extras, la misma lista y el mismo orden');
});

test('las armas iniciales de los desbloqueados entran en el reparto, cada una desde su planta', () => {
  const p1 = weaponPool(1, 'tostadora', ALL);
  assert.ok(p1.includes('picahielos'), 'el Picahielos, desde la planta 1');
  assert.ok(!p1.includes('notificaciones') && !p1.includes('almidon'));
  assert.ok(weaponPool(2, 'tostadora', ALL).includes('notificaciones'), 'las Notificaciones, desde la 2');
  assert.ok(!weaponPool(2, 'tostadora', ALL).includes('almidon'));
  const p5 = weaponPool(5, 'tostadora', ALL);
  assert.deepEqual(sorted(p5), sorted([...FINDABLE_WEAPONS, 'picahielos', 'almidon', 'notificaciones']), 'el Secador no: lo lleva');
  assert.equal(new Set(p5).size, p5.length, 'ninguna repetida (la Grapadora ya era encontrable)');
  assert.deepEqual(p5.slice(0, FINDABLE_WEAPONS.length), [...FINDABLE_WEAPONS], 'las de siempre, primero y en su orden');
  // Only the unlocked ones.
  assert.ok(!weaponPool(5, 'tostadora', ['tostadora', 'movil']).includes('picahielos'));
  assert.ok(weaponPool(5, 'tostadora', ['tostadora', 'movil']).includes('notificaciones'));
});

test('nadie encuentra la suya; los demás, también el Secador', () => {
  for (const id of Object.keys(CHARACTERS)) {
    const own = CHARACTERS[id]!.startWeapon;
    const pool = weaponPool(5, id, ALL);
    assert.ok(!pool.includes(own), `${id} no encuentra su ${own}`);
    for (const other of Object.keys(CHARACTERS)) {
      const w = CHARACTERS[other]!.startWeapon;
      if (w !== own) assert.ok(pool.includes(w), `${id} puede encontrar ${w}`);
    }
    for (const w of pool) assert.ok(WEAPONS[w], w);
  }
  assert.ok(weaponPool(1, 'batidora-vaso', ALL).includes('secador'));
  assert.ok(!weaponPool(1, 'becario', ALL).includes('grapadora'), 'el Becario no se encuentra otra grapadora');
});

test('la partida que sale del Mostrador se lleva los desbloqueos de planta en planta', () => {
  const hub = createWorld({ seed: 'mostrador', hub: {}, unlocked: ALL });
  assert.deepEqual(hub.unlocked, ALL);
  hub.leftHub = true;
  const run = leaveHub(hub, 'desbloqueo-armas')!;
  assert.deepEqual(run.unlocked, ALL);
  assert.deepEqual(sorted(run.floor!.weapons), sorted(weaponPool(1, 'tostadora', ALL)));
  run.won = true;
  const two = nextFloor(run)!;
  assert.deepEqual(two.unlocked, ALL);
  assert.ok(two.floor!.weapons.includes('notificaciones'), 'en la planta 2 ya pueden salir las Notificaciones');
  // The same seed with nobody unlocked deals exactly what it dealt before M13 (8).
  const plain = createWorld({ seed: 'desbloqueo-armas', floor: true, level: 1 });
  assert.deepEqual(plain.unlocked, []);
  assert.deepEqual(sorted(plain.floor!.weapons), sorted(weaponsUpTo(1)));
});

test('una sala suelta (el tesoro) también reparte las de los desbloqueados', () => {
  let seen = false;
  for (let i = 0; i < 40 && !seen; i++) {
    const w = createWorld({ seed: `tesoro-desbloqueo-${i}`, room: 'tesoro', level: 1, unlocked: ['tostadora', 'batidora-vaso'], noEnemies: true });
    seen = w.pickups.some((k) => k.kind === 'arma' && k.weapon === 'picahielos');
  }
  assert.ok(seen, 'en cuarenta tesoros, alguna vez el Picahielos en un pedestal');
});
