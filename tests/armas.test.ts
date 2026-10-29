import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { createWorld, DT, enterRoom, giveWeapon, NO_INPUT, SWAP_TIME, step, addModifier, type Input, type World } from '../src/sim/world.ts';

const aimRight = (w: World): Input => ({ ...NO_INPUT, aimX: w.player.x + 100, aimY: w.player.y - 10 });

/** Empty test room (no enemies, no weapons lying about) with the toaster in the open middle row. */
function range(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.pickups = [];
  w.dummies = [];
  w.player.x = 60;
  w.player.y = 3 * 24 + 12;
  return w;
}

/** Shots (trigger pulls) and bullets fired in `secs` holding the trigger. */
function fireFor(w: World, secs: number): { shots: number; bullets: number } {
  let shots = 0;
  let bullets = 0;
  for (let i = 0; i < Math.round(secs / DT); i++) {
    const before = w.bullets.length;
    step(w, { ...aimRight(w), fire: true });
    const n = w.events.filter((e) => e.type === 'shot').length;
    shots += n;
    if (n) bullets += w.bullets.filter((b) => b.owner === 'player').length - before;
  }
  return { shots, bullets };
}

test('hay tres armas distintas, con nombre, descripción y sprites que existen', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  const ids = Object.keys(WEAPONS);
  assert.ok(ids.length >= 3);
  for (const id of ['secador', 'grapadora']) assert.ok(WEAPONS[id], id);
  for (const def of Object.values(WEAPONS)) {
    assert.ok(def.name.length > 3 && def.description.length > 20, def.id);
    for (const t of [def.look.sprite, def.look.bullet]) assert.ok(keys.has(t), `${def.id}: falta el sprite ${t}`);
  }
  for (const id of FINDABLE_WEAPONS) assert.ok(WEAPONS[id], id);
  // They really play differently: rate, magazine, pellets and range.
  const s = WEAPONS.secador!;
  const g = WEAPONS.grapadora!;
  const p = WEAPONS.plancha!;
  assert.ok(g.fireRate > s.fireRate && g.magazine > s.magazine);
  assert.ok(p.pellets > 1 && p.bulletSpeed * p.bulletLife < (s.bulletSpeed * s.bulletLife) / 2);
});

test('la Sala de Pruebas tiene las armas en sus pedestales y se cogen andando por encima', () => {
  const w = createWorld({ seed: 'pedestal', noEnemies: true });
  const arms = w.pickups.filter((k) => k.kind === 'arma');
  assert.deepEqual(arms.map((k) => k.weapon).sort(), [...FINDABLE_WEAPONS].sort());
  const k = arms[0]!;
  w.player.x = k.x - 30;
  w.player.y = k.y + 2;
  for (let i = 0; i < 40 && w.player.arsenal.length < 2; i++) step(w, { ...NO_INPUT, moveX: 1 });
  assert.equal(w.player.arsenal.length, 2);
  assert.equal(w.player.weapon.base.id, k.weapon);
  assert.ok(!w.pickups.includes(k));
  const sw = w.events.find((e) => e.type === 'swap');
  assert.ok(sw && sw.type === 'swap' && sw.found && sw.count === 2);
});

test('rodando por encima de un arma no se coge', () => {
  const w = createWorld({ seed: 'rodar-arma', noEnemies: true });
  const k = w.pickups.find((p) => p.kind === 'arma')!;
  w.pickups = [k];
  w.player.x = k.x - 20;
  w.player.y = k.y + 2;
  step(w, { ...NO_INPUT, moveX: 1, aimX: k.x + 100, aimY: k.y, roll: true });
  let picked = false;
  for (let i = 0; i < 12; i++) {
    step(w, { ...NO_INPUT, moveX: 1 });
    if (w.player.rollT < 0) break;
    picked ||= w.events.some((e) => e.type === 'pickup');
  }
  assert.equal(picked, false);
});

test('cambiar de arma: rueda adelante y atrás, cada una guarda su munición y la recarga se pierde', () => {
  const w = range('cambio');
  giveWeapon(w, 'grapadora');
  giveWeapon(w, 'plancha');
  assert.equal(w.player.arsenal.length, 3);
  assert.equal(w.player.weapon.base.id, 'plancha');
  step(w, { ...aimRight(w), swap: 1 });
  assert.equal(w.player.weapon.base.id, 'secador');
  step(w, { ...aimRight(w), swap: -1 });
  assert.equal(w.player.weapon.base.id, 'plancha');
  step(w, { ...aimRight(w), swap: -1 });
  assert.equal(w.player.weapon.base.id, 'grapadora');
  // Spend some staples, change, come back: they are still spent.
  for (let i = 0; i < 40; i++) step(w, { ...aimRight(w), fire: true });
  const left = w.player.weapon.ammo;
  assert.ok(left < WEAPONS.grapadora!.magazine);
  step(w, { ...aimRight(w), swap: 1 });
  step(w, { ...aimRight(w), swap: -1 });
  assert.equal(w.player.weapon.ammo, left);
  // A reload in progress is lost on changing weapon.
  step(w, { ...aimRight(w), reload: true });
  assert.ok(w.player.weapon.reload > 0);
  step(w, { ...aimRight(w), swap: 1 });
  step(w, { ...aimRight(w), swap: -1 });
  assert.equal(w.player.weapon.reload, 0);
  assert.equal(w.player.weapon.ammo, left);
});

test('el arma nueva tarda un momento en disparar al sacarla', () => {
  const w = range('desenfundar');
  giveWeapon(w, 'grapadora');
  let first = -1;
  for (let i = 0; i < 60 && first < 0; i++) {
    step(w, { ...aimRight(w), fire: true });
    if (w.events.some((e) => e.type === 'shot')) first = i;
  }
  assert.ok(first * DT >= SWAP_TIME - 2 * DT, `primer disparo a ${first * DT}`);
});

test('la grapadora dispara más rápido que el secador y la plancha suelta cinco perdigones de corto alcance', () => {
  const ws = range('cadencia');
  const wg = range('cadencia');
  giveWeapon(wg, 'grapadora');
  const s = fireFor(ws, 1.5).shots;
  const g = fireFor(wg, 1.5).shots;
  assert.ok(g > s, `grapadora ${g} frente a secador ${s}`);

  const wp = range('perdigones');
  giveWeapon(wp, 'plancha');
  for (let i = 0; i < 30; i++) step(wp, aimRight(wp));
  step(wp, { ...aimRight(wp), fire: true });
  const pellets = wp.bullets.filter((b) => b.owner === 'player');
  assert.equal(pellets.length, WEAPONS.plancha!.pellets);
  const x0 = wp.player.x;
  let far = 0;
  for (let i = 0; i < 60; i++) {
    step(wp, aimRight(wp));
    for (const b of wp.bullets) far = Math.max(far, b.x - x0);
  }
  assert.ok(far < 130, `el vapor llega a ${far} px`);
  assert.equal(wp.bullets.length, 0);
});

test('los modificadores valen para todas las armas que lleva', () => {
  const w = range('mods-armas');
  giveWeapon(w, 'grapadora');
  addModifier(w, { id: 'prueba', stats: [{ stat: 'damage', add: 1 }, { stat: 'magazine', add: 4 }] });
  for (const ws of w.player.arsenal) {
    assert.equal(ws.def.damage, ws.base.damage + 1, ws.base.id);
    assert.equal(ws.def.magazine, ws.base.magazine + 4, ws.base.id);
    assert.equal(ws.ammo, ws.def.magazine, ws.base.id);
  }
  // A weapon found later comes with them too.
  giveWeapon(w, 'plancha');
  assert.equal(w.player.weapon.def.damage, WEAPONS.plancha!.damage + 1);
  assert.equal(w.player.weapon.ammo, WEAPONS.plancha!.magazine + 4);
  assert.equal(WEAPONS.plancha!.damage, 1, 'los datos no se tocan');
});

test('en la planta, la sala del tesoro guarda un arma y cambia con la semilla', () => {
  const found = new Set<string>();
  for (let i = 0; i < 12; i++) {
    const w = createWorld({ seed: `tesoro${i}`, floor: true });
    const f = w.floor!;
    assert.equal(w.pickups.filter((k) => k.kind === 'arma').length, 0, 'la entrada no tiene armas');
    const t = f.layout.rooms.find((r) => r.kind === 'treasure')!;
    enterRoom(w, t.id, f.layout.rooms[t.id]!.doors[0]!.dir);
    const arms = w.pickups.filter((k) => k.kind === 'arma');
    assert.equal(arms.length, 1, `semilla ${i}`);
    found.add(arms[0]!.weapon!);
    // Coming back does not stock it again.
    const back = f.layout.rooms[t.id]!.doors[0]!;
    enterRoom(w, back.to, back.dir);
    enterRoom(w, t.id, back.dir);
    assert.equal(w.pickups.filter((k) => k.kind === 'arma').length, 1);
  }
  assert.deepEqual([...found].sort(), [...FINDABLE_WEAPONS].sort());
});
