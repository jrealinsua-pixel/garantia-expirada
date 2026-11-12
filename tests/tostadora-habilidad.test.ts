// M13 (2): la habilidad de la Tostadora, «Una de cada dos». Al acabar una recarga que ha rellenado
// al menos medio cargador salta una tostada hacia donde apunta, que atraviesa a los enemigos; una
// de cada dos sale quemada (el doble de daño) y su humo borra las balas enemigas que toca.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/data/characters.ts';
import type { ToastAbility } from '../src/data/types.ts';
import { createWorld, DT, NO_INPUT, step, type Bullet, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

function bare(seed: string, character = 'tostadora'): World {
  const w = createWorld({ seed, noEnemies: true, character });
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

/** Aiming right, along the floor. */
const aimRight = (w: World): Input => ({ ...NO_INPUT, aimX: w.player.x + 100, aimY: w.player.y - 7 });

/** Plays until the reload under way ends; returns the toasts that popped meanwhile. */
function finishReload(w: World, input: Input): Bullet[] {
  const seen = new Map<number, Bullet>();
  for (let i = 0; i < ticks(5) && w.player.weapon.reload > 0; i++) {
    step(w, input);
    for (const b of w.bullets) if (b.toast) seen.set(b.id, b);
  }
  step(w, input);
  for (const b of w.bullets) if (b.toast) seen.set(b.id, b);
  return [...seen.values()];
}

/** Empties the magazine (and lets the reload start by itself). */
function emptyMagazine(w: World): void {
  const fire = { ...aimRight(w), fire: true };
  for (let i = 0; i < ticks(10) && w.player.weapon.reload <= 0; i++) step(w, fire);
  assert.ok(w.player.weapon.reload > 0, 'recargando');
}

test('la Tostadora tiene su habilidad en los datos', () => {
  const ab = CHARACTERS['tostadora']!.ability;
  assert.ok(ab && ab.kind === 'toast');
  assert.ok(ab.burntMul > 1 && ab.damage > 0 && ab.minSpent > 0 && ab.minSpent <= 1);
});

test('vaciar el cargador y recargar hace saltar una tostada dorada; la siguiente sale quemada y hace el doble', () => {
  const w = bare('tostada-dos');
  const ab = CHARACTERS['tostadora']!.ability as ToastAbility;
  emptyMagazine(w);
  const first = finishReload(w, aimRight(w));
  assert.equal(first.length, 1, 'una tostada');
  assert.equal(first[0]!.toast, 'golden');
  assert.ok(Math.abs(first[0]!.damage - ab.damage) < 1e-9);
  assert.ok(first[0]!.vx > 0 && Math.abs(first[0]!.vy) < first[0]!.vx * 0.2, 'sale hacia donde apunta');
  emptyMagazine(w);
  const second = finishReload(w, aimRight(w)).filter((b) => b.id !== first[0]!.id);
  assert.equal(second.length, 1);
  assert.equal(second[0]!.toast, 'burnt');
  assert.ok(Math.abs(second[0]!.damage - ab.damage * ab.burntMul) < 1e-9);
  assert.equal(w.player.toasts, 2);
});

test('recargar con el cargador casi lleno no hace saltar nada (no se puede ordeñar)', () => {
  const w = bare('tostada-ordeñar');
  const fire = { ...aimRight(w), fire: true };
  // One shot, then reload.
  step(w, fire);
  for (let i = 0; i < ticks(0.5); i++) step(w, aimRight(w));
  step(w, { ...aimRight(w), reload: true });
  assert.ok(w.player.weapon.reload > 0, 'recarga a mano');
  assert.equal(finishReload(w, aimRight(w)).length, 0);
  assert.equal(w.player.toasts ?? 0, 0);
  // Half the magazine spent is enough.
  const mag = w.player.weapon.def.magazine;
  w.player.weapon.ammo = Math.floor(mag / 2);
  step(w, { ...aimRight(w), reload: true });
  assert.equal(finishReload(w, aimRight(w)).length, 1);
});

test('la tostada atraviesa a los muñecos que pilla por el camino', () => {
  const w = bare('tostada-atraviesa');
  const [a, b] = w.dummies;
  assert.ok(a && b, 'la sala de pruebas tiene dos maniquíes');
  a.x = w.player.x + 40;
  b.x = w.player.x + 80;
  a.y = b.y = w.player.y + 6;
  emptyMagazine(w);
  // Out of the way while the magazine empties: the dryer must not hit them.
  a.damageTaken = b.damageTaken = 0;
  finishReload(w, aimRight(w));
  for (let i = 0; i < ticks(1); i++) step(w, aimRight(w));
  assert.ok(a.damageTaken > 0 && b.damageTaken > 0, `les da a los dos (${a.damageTaken}, ${b.damageTaken})`);
});

test('el humo de la quemada borra las balas enemigas que toca y sigue volando; la dorada no', () => {
  for (const kind of ['burnt', 'golden'] as const) {
    const w = bare(`tostada-humo-${kind}`);
    w.player.toasts = kind === 'burnt' ? 1 : 0;
    w.player.weapon.ammo = 0;
    w.player.weapon.reload = DT;
    w.player.toastPrimed = true;
    step(w, aimRight(w));
    const toast = w.bullets.find((b) => b.toast);
    assert.equal(toast?.toast, kind);
    // An enemy bullet sitting right in its way.
    w.bullets.push({ id: w.nextId++, owner: 'enemy', x: toast!.x + 30, y: toast!.y, vx: 0, vy: 0, r: 3, life: 5, damage: 1, knockback: 0, color: 'red', age: 0, dir: 0, speed: 0, h: 7 });
    const enemyId = w.nextId - 1;
    for (let i = 0; i < ticks(0.3); i++) step(w, aimRight(w));
    const still = w.bullets.some((b) => b.id === enemyId);
    if (kind === 'burnt') {
      assert.equal(still, false, 'la bala enemiga se borra');
      assert.ok(w.bullets.some((b) => b.id === toast!.id), 'la tostada sigue');
    } else assert.equal(still, true, 'la dorada no borra balas');
  }
});

test('sin la habilidad (otro personaje), recargar no hace saltar nada', () => {
  const base = CHARACTERS['tostadora']!;
  CHARACTERS['sin-habilidad'] = { ...base, id: 'sin-habilidad' };
  delete CHARACTERS['sin-habilidad'].ability;
  try {
    const w = bare('sin-habilidad', 'sin-habilidad');
    emptyMagazine(w);
    assert.equal(finishReload(w, aimRight(w)).length, 0);
  } finally {
    delete CHARACTERS['sin-habilidad'];
  }
});
