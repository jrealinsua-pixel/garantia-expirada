import { WEAPONS } from '../src/data/weapons.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { FINDABLE_ITEMS, ITEMS } from '../src/data/items.ts';
import { FINDABLE_WEAPONS } from '../src/data/weapons.ts';
import { createWorld, DT, enterRoom, giveItem, HAND_HEIGHT, NO_INPUT, spawnEnemy, step, worldHash, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const fireAt = (x: number, y: number): Input => ({ ...NO_INPUT, fire: true, aimX: x, aimY: y });

/** The test room with nothing in the way: no props, no enemies, no pedestals, the dummies put aside. */
function bare(seed: string, ...items: string[]): World {
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
  for (const id of items) giveItem(w, id);
  return w;
}

/** Shots and bullets fired in `secs` holding the trigger to the right. */
function fireFor(w: World, secs: number): { shots: number; bullets: number } {
  let shots = 0;
  let bullets = 0;
  for (let i = 0; i < ticks(secs); i++) {
    const before = w.bullets.length;
    step(w, fireAt(w.player.x + 100, w.player.y - HAND_HEIGHT));
    const n = w.events.filter((e) => e.type === 'shot').length;
    shots += n;
    if (n) bullets += w.bullets.filter((b) => b.owner === 'player').length - before;
  }
  return { shots, bullets };
}

/** Damage the first dummy takes from `secs` of fire, standing 140 px to the right. */
function dummyDamage(w: World, secs: number): number {
  const d = w.dummies[0]!;
  d.x = w.player.x + 140;
  d.y = w.player.y;
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  for (let i = 0; i < ticks(secs); i++) step(w, fireAt(d.x, d.y - 20));
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  return d.damageTaken;
}

/** The furthest one straight shot gets from the toaster before it vanishes (px). */
function reach(w: World): number {
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  w.player.x = 60;
  step(w, fireAt(1000, w.player.y - HAND_HEIGHT));
  const b = w.bullets[0]!;
  let far = 0;
  for (let i = 0; i < ticks(3) && w.bullets.includes(b); i++) {
    far = Math.max(far, b.x - 60);
    step(w, NO_INPUT);
  }
  return far;
}

// ---------- The items as content ----------

test('hay 15 objetos pasivos (10 de la planta 1 y 5 de la 2) con nombre corto, descripción en el tono del juego y sprite', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  const defs = Object.values(ITEMS);
  assert.equal(defs.length, 15);
  assert.equal(defs.filter((d) => (d.level ?? 1) === 2).length, 5);
  assert.deepEqual([...FINDABLE_ITEMS].sort(), Object.keys(ITEMS).sort());
  const names = new Set<string>();
  for (const d of defs) {
    assert.equal(d.mod.id, d.id, `${d.id}: el modificador lleva el id del objeto`);
    const words = d.name.split(' ').length;
    assert.ok(words >= 2 && words <= 4, `${d.id}: «${d.name}» tiene ${words} palabras`);
    assert.ok(!names.has(d.name), `nombre repetido ${d.name}`);
    names.add(d.name);
    const sentences = d.description.split(/[.:]\s/).length;
    assert.ok(d.description.length > 15 && sentences <= 3 && d.description.endsWith('.'), `${d.id}: descripción`);
    assert.ok(!/[!¡]/.test(d.name + d.description), `${d.id}: sin exclamaciones`);
    assert.ok(keys.has(d.sprite), `${d.id}: falta el sprite ${d.sprite}`);
    assert.ok(d.mod.stats?.length || d.mod.bullets, `${d.id}: no hace nada`);
  }
});

test('un objeto se coge andando por encima (rodando no) y se lleva el resto de la partida', () => {
  const w2 = createWorld({ seed: 'objeto-suelo', room: 'tesoro' });
  const k2 = w2.pickups.find((k) => k.kind === 'objeto')!;
  // Rolling right over it does not pick it up.
  w2.player.y = k2.y + 2;
  w2.player.rollT = 0;
  w2.player.rollDirX = 1;
  w2.player.rollDirY = 0;
  w2.player.x = k2.x - 2;
  step(w2, NO_INPUT);
  assert.equal(w2.player.items.length, 0, 'rodando no se coge');
  const w3 = createWorld({ seed: 'objeto-suelo', room: 'tesoro' });
  const k3 = w3.pickups.find((k) => k.kind === 'objeto')!;
  w3.player.x = k3.x - 30;
  w3.player.y = k3.y + 2;
  let got = false;
  for (let i = 0; i < 60 && !got; i++) {
    step(w3, { ...NO_INPUT, moveX: 1 });
    got = w3.events.some((e) => e.type === 'pickup' && e.kind === 'objeto' && e.item === k3.item);
  }
  assert.ok(got, 'no se ha cogido');
  assert.deepEqual(w3.player.items, [k3.item]);
  assert.ok(w3.player.mods.some((m) => m.id === k3.item));
  assert.ok(!w3.pickups.includes(k3));
});

test('la sala del tesoro tiene un arma, un objeto y un activo; la secreta, otro; cada planta en su orden', () => {
  const seen = new Set<string>();
  const firsts = new Set<string>();
  for (let s = 0; s < 12; s++) {
    const w = createWorld({ seed: `planta-objetos-${s}`, floor: true });
    const f = w.floor!;
    const treasure = f.layout.rooms.find((r) => r.kind === 'treasure')!;
    const secret = f.layout.rooms.find((r) => r.kind === 'secret');
    enterRoom(w, treasure.id, 'S');
    const kinds = w.pickups.map((k) => k.kind).sort();
    assert.deepEqual(kinds, ['activo', 'arma', 'objeto'], `semilla ${s}: ${kinds}`);
    const it = w.pickups.find((k) => k.kind === 'objeto')!.item!;
    firsts.add(it);
    seen.add(it);
    if (secret) {
      enterRoom(w, secret.id, 'S');
      assert.equal(w.pickups.length, 1);
      // The second weapon if it is still there, or else an item.
      const k = w.pickups[0]!;
      assert.ok(k.kind === 'arma' ? FINDABLE_WEAPONS.includes(k.weapon!) : ITEMS[k.item!], `semilla ${s}`);
      if (k.item) seen.add(k.item);
    }
    // Stocked once: walking back in does not refill it.
    enterRoom(w, treasure.id, 'S');
    assert.equal(w.pickups.length, 3);
  }
  assert.ok(firsts.size >= 5, `el tesoro reparte siempre lo mismo: ${[...firsts]}`);
  assert.ok(seen.size >= 6);
});

// ---------- One test per item: what it does in play ----------

test('Pila Casi Agotada: dispara más deprisa con un cargador más corto', () => {
  const base = bare('pila');
  const pila = bare('pila', 'pila');
  assert.ok(pila.player.weapon.def.magazine < base.player.weapon.def.magazine);
  assert.equal(pila.player.weapon.ammo, pila.player.weapon.def.magazine);
  // In the first second neither reloads (the battery one empties just about then).
  const a = fireFor(base, 0.9).shots;
  const b = fireFor(pila, 0.9).shots;
  assert.ok(b >= a + 1, `${b} disparos frente a ${a}`);
});

test('Manual en Chino: las balas rebotan dos veces en las paredes', () => {
  const w = bare('manual', 'manual');
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  step(w, fireAt(0, w.player.y - HAND_HEIGHT));
  const b = w.bullets[0]!;
  let bounces = 0;
  for (let i = 0; i < ticks(1.5) && w.bullets.includes(b); i++) {
    step(w, NO_INPUT);
    bounces += w.events.filter((e) => e.type === 'bulletWall' && e.bounced).length;
  }
  assert.ok(bounces >= 1, 'no rebota');
  assert.equal(b.bounce ?? 0, 2 - bounces);
  // Without it the same shot dies at the wall.
  const w2 = bare('manual');
  w2.player.weapon.def = { ...w2.player.weapon.def, spreadDeg: 0 };
  step(w2, fireAt(0, w2.player.y - HAND_HEIGHT));
  for (let i = 0; i < ticks(1.5); i++) step(w2, NO_INPUT);
  assert.equal(w2.bullets.length, 0);
});

test('Garantía Extendida: un corazón más, y llega lleno', () => {
  const base = bare('garantia');
  const w = bare('garantia', 'garantia');
  assert.equal(w.player.def.maxHp, base.player.def.maxHp + 2);
  assert.equal(w.player.hp, base.player.hp + 2);
});

test('Regleta Sin Tierra: una bala más por disparo y más dispersión', () => {
  const base = fireFor(bare('regleta'), 0.5);
  const w = bare('regleta', 'regleta');
  assert.ok(w.player.weapon.def.spreadDeg > bare('regleta').player.weapon.def.spreadDeg);
  const r = fireFor(w, 0.5);
  assert.equal(base.bullets, base.shots);
  assert.equal(r.bullets, r.shots * 2);
});

test('Tarjeta de Socio: las balas tuercen hacia un enemigo al que no se apunta', () => {
  const hits = (items: string[]): number => {
    const w = bare('tarjeta', ...items);
    const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, 250, 240);
    en.state = 'idle';
    en.until = 999;
    w.enemies.push(en);
    w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
    let n = 0;
    for (let i = 0; i < ticks(1.5); i++) {
      step(w, i < 3 ? fireAt(400, w.player.y - HAND_HEIGHT - 20) : NO_INPUT);
      n += w.events.filter((e) => e.type === 'hit').length;
    }
    return n;
  };
  assert.equal(hits([]), 0);
  assert.ok(hits(['tarjeta']) >= 1);
});

test('Etiqueta A+++: anda más y vuelve a rodar antes', () => {
  const walk = (items: string[]): number => {
    const w = bare('etiqueta', ...items);
    const x0 = w.player.x;
    for (let i = 0; i < ticks(1); i++) step(w, { ...NO_INPUT, moveX: 1 });
    return w.player.x - x0;
  };
  assert.ok(walk(['etiqueta']) > walk([]) * 1.1);
  const w = bare('etiqueta', 'etiqueta');
  assert.ok(w.player.def.rollCooldown < bare('etiqueta').player.def.rollCooldown);
});

test('Alargador de Tres Metros: las balas llegan más lejos', () => {
  const a = reach(bare('alargador'));
  const b = reach(bare('alargador', 'alargador'));
  assert.ok(b > a * 1.4, `${b} px frente a ${a}`);
});

test('Broca del Ocho: una bala atraviesa a dos maniquíes en fila', () => {
  const run = (items: string[]): number[] => {
    const w = bare('broca', ...items);
    w.dummies.forEach((d, i) => {
      d.x = 220 + i * 40;
      d.y = 200;
    });
    w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
    step(w, fireAt(400, 200 - HAND_HEIGHT));
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return w.dummies.map((d) => d.damageTaken);
  };
  const d = WEAPONS.secador!.damage;
  assert.deepEqual(run([]), [d, 0]);
  assert.deepEqual(run(['broca']), [d, d]);
});

test('Cinta Americana: recarga mucho antes', () => {
  const reloadSecs = (items: string[]): number => {
    const w = bare('cinta', ...items);
    w.player.weapon.ammo = 0;
    let t = 0;
    step(w, { ...NO_INPUT, reload: true });
    while (w.player.weapon.ammo === 0 && t < 600) {
      step(w, NO_INPUT);
      t++;
    }
    return t * DT;
  };
  const a = reloadSecs([]);
  const b = reloadSecs(['cinta']);
  assert.ok(b < a * 0.7, `${b} s frente a ${a} s`);
});

test('Resistencia de Recambio: cada bala hace un punto más de daño, aunque dispara más despacio', () => {
  const base = bare('resistencia');
  const w = bare('resistencia', 'resistencia');
  assert.equal(w.player.weapon.def.damage, base.player.weapon.def.damage + 1);
  assert.ok(w.player.weapon.def.fireRate < base.player.weapon.def.fireRate);
  // One shot at the dummy: a point more.
  const one = (x: World): number => {
    const d = x.dummies[0]!;
    d.x = x.player.x + 120;
    d.y = x.player.y;
    x.player.weapon.def = { ...x.player.weapon.def, spreadDeg: 0 };
    step(x, fireAt(d.x, d.y - 20));
    for (let i = 0; i < ticks(1); i++) step(x, NO_INPUT);
    return d.damageTaken;
  };
  assert.equal(one(base), WEAPONS.secador!.damage);
  assert.equal(one(w), WEAPONS.secador!.damage + 1);
  // And over a while it still deals more.
  assert.ok(dummyDamage(bare('resistencia', 'resistencia'), 2) > dummyDamage(bare('resistencia'), 2));
});

test('los objetos se acumulan y la partida sigue siendo determinista', () => {
  const run = (): string => {
    const w = bare('todo', ...FINDABLE_ITEMS);
    assert.equal(w.player.items.length, FINDABLE_ITEMS.length);
    for (let i = 0; i < ticks(3); i++) step(w, fireAt(400, 150));
    return worldHash(w);
  };
  assert.equal(run(), run());
  // The data is never changed by playing with it.
  assert.deepEqual(ITEMS.pila!.mod.stats, [{ stat: 'fireRate', mul: 1.3 }, { stat: 'magazine', mul: 0.7 }]);
});

test('ningún objeto es obligatorio: ninguno multiplica el daño por segundo de todas las armas por más de 1,6', async () => {
  const { weaponProfile } = await import('../src/data/describe.ts');
  const { moddedWeapon } = await import('../src/sim/mods.ts');
  for (const it of Object.values(ITEMS)) {
    const gains = Object.values(WEAPONS).map((wd) => weaponProfile(moddedWeapon(wd, [it.mod])).dps / weaponProfile(wd).dps);
    assert.ok(Math.min(...gains) <= 1.6, `${it.id}: ×${gains.map((g) => g.toFixed(2)).join(' ×')}`);
    // And none is worse for every weapon (pellets aside, which paper cannot weigh against spread).
    assert.ok(Math.max(...gains) >= 0.99, `${it.id} empeora todas las armas`);
  }
});

test('los objetos de la planta 2 solo salen desde la planta 2; la planta 1 reparte los de siempre', async () => {
  const { itemsUpTo } = await import('../src/data/items.ts');
  const own = Object.values(ITEMS).filter((d) => d.level === 2).map((d) => d.id);
  assert.equal(own.length, 5);
  assert.deepEqual(itemsUpTo(1).sort(), Object.values(ITEMS).filter((d) => (d.level ?? 1) === 1).map((d) => d.id).sort());
  assert.deepEqual(itemsUpTo(2).sort(), Object.keys(ITEMS).sort());
  for (let i = 0; i < 20; i++) {
    const f1 = createWorld({ seed: `mazo-${i}`, floor: true }).floor!;
    for (const id of own) assert.ok(!f1.items.includes(id), `${id} en la planta 1`);
    const f2 = createWorld({ seed: `mazo-${i}`, floor: true, level: 2 }).floor!;
    assert.deepEqual([...f2.items].sort(), itemsUpTo(2).sort());
  }
  // A treasure room played on its own deals from its floor's deck too.
  const t2 = createWorld({ seed: 'mazo-tesoro', room: 'tesoro', level: 2 });
  const t1 = createWorld({ seed: 'mazo-tesoro', room: 'tesoro' });
  const objeto = (w: World): string[] => w.pickups.filter((k) => k.kind === 'objeto').map((k) => k.item!);
  assert.ok(objeto(t1).every((id) => !own.includes(id)));
  assert.equal(objeto(t2).length, objeto(t1).length);
});

test('cada objeto de la planta 2 hace lo que dice su ficha', () => {
  const base = bare('p2');
  const w = (id: string): World => bare('p2', id);
  const wd = (x: World) => x.player.weapon.def;
  assert.ok(wd(w('usb')).magazine > wd(base).magazine && wd(w('usb')).reloadTime > wd(base).reloadTime);
  assert.equal(w('antivirus').player.def.maxHp, base.player.def.maxHp + 2);
  assert.ok(w('antivirus').player.def.speed < base.player.def.speed && w('antivirus').player.def.rollCooldown > base.player.def.rollCooldown);
  assert.ok(wd(w('hdmi')).bulletSpeed > wd(base).bulletSpeed && wd(w('hdmi')).spreadDeg <= wd(base).spreadDeg);
  assert.ok(wd(w('ventilador')).fireRate > wd(base).fireRate && wd(w('ventilador')).bulletLife < wd(base).bulletLife);
  assert.equal(wd(w('actualizacion')).damage, wd(base).damage + 1);
  assert.ok(wd(w('actualizacion')).reloadTime > wd(base).reloadTime);
});
