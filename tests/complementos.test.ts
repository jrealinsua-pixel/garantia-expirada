// M9b (14): indirect synergies. Pairs of items that work better together than apart, with nothing
// switched on (src/data/complements.ts). Each pair is measured here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPLEMENTS } from '../src/data/complements.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { ITEMS } from '../src/data/items.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { moddedCharacter, moddedWeapon } from '../src/sim/mods.ts';
import { createWorld, DT, giveItem, hurtPlayer, NO_INPUT, spawnEnemy, step, type World } from '../src/sim/world.ts';
import { Rng } from '../src/sim/rng.ts';
import type { StatKey } from '../src/data/types.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const WEAPON_KEYS = new Set<StatKey>(['damage', 'fireRate', 'magazine', 'reloadTime', 'spreadDeg', 'bulletSpeed', 'bulletLife', 'bulletRadius', 'knockback', 'recoil', 'pellets']);
const LESS_IS_BETTER = new Set<StatKey>(['reloadTime', 'spreadDeg', 'recoil', 'rollCooldown']);

/** `stat` with the starting weapon (or character) and these items. */
function statWith(stat: StatKey, items: string[], weapon = 'secador'): number {
  const mods = items.map((i) => ITEMS[i]!.mod);
  if (WEAPON_KEYS.has(stat)) return (moddedWeapon(WEAPONS[weapon]!, mods) as unknown as Record<string, number>)[stat]!;
  const c = Object.values(CHARACTERS)[0]!;
  return (moddedCharacter(c, mods) as unknown as Record<string, number>)[stat]!;
}

/** «tapa» pairs whose cover is not a stat: each has its own test below (sorted ids, joined by +). */
const TAPA_MEASURED = new Set(['bola-antiestres+hinchada']);

test('las parejas son de objetos que existen, distintas entre sí y ninguna es ya una sinergia', () => {
  const seen = new Set<string>();
  for (const c of COMPLEMENTS) {
    for (const id of c.items) assert.ok(ITEMS[id], `${id} no es un objeto pasivo`);
    assert.notEqual(c.items[0], c.items[1]);
    const key = [...c.items].sort().join('+');
    assert.ok(!seen.has(key), `${key} repetida`);
    seen.add(key);
    for (const s of Object.values(SYNERGIES)) {
      if (s.weapon) continue;
      assert.ok(!(s.items.length === 2 && s.items.every((i) => c.items.includes(i))), `${key} ya es la sinergia ${s.id}`);
    }
    assert.ok(c.why.length > 20 && c.why.length < 140, `${key}: el texto`);
    if (c.kind === 'tapa') assert.ok(c.stat || TAPA_MEASURED.has(key), `${key}: «tapa» dice qué tapa, o tiene su prueba aquí`);
  }
  assert.ok(COMPLEMENTS.length >= 8, 'al menos ocho parejas');
});

test('«tapa»: el segundo objeto devuelve casi todo lo que el primero quita, con todas las armas', () => {
  for (const c of COMPLEMENTS.filter((x) => x.kind === 'tapa' && x.stat)) {
    const stat = c.stat!;
    const weapons = WEAPON_KEYS.has(stat) ? Object.keys(WEAPONS) : ['secador'];
    for (const wp of weapons) {
      const base = statWith(stat, [], wp);
      const a = statWith(stat, [c.items[0]], wp);
      const pair = statWith(stat, [...c.items], wp);
      const sign = LESS_IS_BETTER.has(stat) ? -1 : 1;
      const lost = sign * (base - a);
      assert.ok(lost > 0, `${c.items[0]} empeora ${stat} con ${wp} (${base} → ${a})`);
      // The pair is back to base (or better), or at worst keeps 40 % of the drawback.
      const left = sign * (base - pair);
      assert.ok(left <= lost * 0.4 + 1e-9, `${c.items.join('+')} con ${wp}: ${stat} ${base} → ${a} → ${pair}`);
    }
  }
});

test('Pila y Cinta: juntas suben el daño sostenido más que el producto de cada una por separado', () => {
  for (const wp of Object.keys(WEAPONS)) {
    const dps = (items: string[]): number => weaponProfile(moddedWeapon(WEAPONS[wp]!, items.map((i) => ITEMS[i]!.mod))).dps;
    const none = dps([]);
    const gain = (items: string[]): number => dps(items) / none;
    const together = gain(['pila', 'cinta']);
    const apart = gain(['pila']) * gain(['cinta']);
    assert.ok(together > apart, `${wp}: juntas ×${together.toFixed(3)}, por separado ×${apart.toFixed(3)}`);
  }
});

/** A bullet's life with the card, scripted: does it seek again after bouncing / going through? */
function bare(seed: string, items: string[]): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  w.noDamage = true;
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  for (const id of items) giveItem(w, id);
  w.player.weapon.def = { ...w.player.weapon.def, spreadDeg: 0 };
  return w;
}

test('la tarjeta vuelve a buscar tras rebotar o atravesar (y sin tarjeta no se marca nada)', () => {
  const w = bare('reglas', ['tarjeta', 'manual']);
  w.player.x = w.room.w - 100;
  step(w, { ...NO_INPUT, fire: true, aimX: w.player.x + 400, aimY: w.player.y - 10 });
  const b = w.bullets.find((x) => x.owner === 'player')!;
  assert.ok(b.seek && b.bounce);
  let bounced = false;
  for (let i = 0; i < ticks(1.4) && w.bullets.includes(b); i++) {
    const left = b.bounce!;
    step(w, NO_INPUT);
    if (b.bounce! < left) {
      bounced = true;
      assert.ok(Math.abs(b.seekFrom! - b.age) < DT * 1.01, 'empieza a buscar otra vez al rebotar');
      break;
    }
  }
  assert.ok(bounced, 'la bala ha rebotado');
  const m = bare('reglas-sin', ['manual']);
  m.player.x = m.room.w - 100;
  step(m, { ...NO_INPUT, fire: true, aimX: m.player.x + 400, aimY: m.player.y - 10 });
  const c = m.bullets.find((x) => x.owner === 'player')!;
  for (let i = 0; i < ticks(1.4) && m.bullets.includes(c); i++) step(m, NO_INPUT);
  assert.ok(c.bounce! < 2, 'la bala sin tarjeta también ha rebotado');
  assert.equal(c.seekFrom, undefined);
  // Going through: the drill's pierce restarts it as well.
  const p = bare('reglas-broca', ['tarjeta', 'broca']);
  const en = spawnEnemy(p.nextId++, ENEMIES['aspirador']!, p.player.x + 60, p.player.y);
  en.state = 'idle';
  en.until = 999;
  p.enemies.push(en);
  step(p, { ...NO_INPUT, fire: true, aimX: en.x, aimY: en.y - 10 });
  const d = p.bullets.find((x) => x.owner === 'player')!;
  for (let i = 0; i < ticks(0.6) && !d.hits?.length; i++) step(p, NO_INPUT);
  assert.ok(d.hits?.includes(en.id), 'ha atravesado al aspirador');
  assert.ok(d.seekFrom! > 0 && Math.abs(d.seekFrom! - d.age) < DT * 1.01, 'y vuelve a buscar desde ahí');
});

/**
 * Hits on idle enemies scattered round the room, shooting in random directions: what the bot
 * would get by spraying. Same seeds for every set of items.
 */
function sprayHits(items: string[], rounds = 40): number {
  let hits = 0;
  for (let r = 0; r < rounds; r++) {
    const w = bare(`rociar-${r}`, items);
    const rng = new Rng(`rociar-${r}`);
    for (let k = 0; k < 4; k++) {
      const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, 60 + rng.next() * 360, 60 + rng.next() * 220);
      en.state = 'idle';
      en.until = 999;
      w.enemies.push(en);
    }
    w.player.x = 240;
    w.player.y = 180;
    for (let s = 0; s < 3; s++) {
      const a = rng.next() * Math.PI * 2;
      step(w, { ...NO_INPUT, fire: true, aimX: w.player.x + Math.cos(a) * 100, aimY: w.player.y + Math.sin(a) * 100 });
      hits += w.events.filter((e) => e.type === 'hit').length;
      for (let i = 0; i < ticks(0.4); i++) {
        step(w, NO_INPUT);
        hits += w.events.filter((e) => e.type === 'hit').length;
      }
    }
    for (let i = 0; i < ticks(1.6); i++) {
      step(w, NO_INPUT);
      hits += w.events.filter((e) => e.type === 'hit').length;
    }
  }
  return hits;
}

test('Tarjeta con Manual o con Broca: juntas aciertan más que la suma de lo que añade cada una', () => {
  const none = sprayHits([]);
  const card = sprayHits(['tarjeta']) - none;
  for (const other of ['manual', 'broca']) {
    const alone = sprayHits([other]) - none;
    const pair = sprayHits(['tarjeta', other]) - none;
    console.log(`  tarjeta + ${other}: nada ${none}, tarjeta +${card}, ${other} +${alone}, juntas +${pair}`);
    assert.ok(pair > card + alone, `tarjeta + ${other}: +${pair} contra +${card} y +${alone}`);
  }
});

/** Seconds until the toaster goes down under a barrage that hits it as often as it can (every 0.3 s while it can be hurt). */
function underFire(items: string[]): number {
  const w = createWorld({ seed: 'aguante', noEnemies: true });
  w.pickups = [];
  for (const id of items) giveItem(w, id);
  let t = 0;
  for (let i = 0; i < ticks(60) && !w.over; i++) {
    if (i % Math.round(0.3 / DT) === 0) hurtPlayer(w, 1, -1, 1, 0);
    step(w, NO_INPUT);
    t = i * DT;
  }
  assert.ok(w.over, 'acaba cayendo');
  return t;
}

test('Bola Antiestrés y Batería Hinchada: con un corazón menos, juntas aguantan una lluvia de golpes más que sin nada', () => {
  const none = underFire([]);
  const swollen = underFire(['hinchada']);
  const ball = underFire(['bola-antiestres']);
  const pair = underFire(['hinchada', 'bola-antiestres']);
  assert.ok(swollen < none * 0.8, `la batería quita aguante (${swollen.toFixed(1)} s frente a ${none.toFixed(1)} s)`);
  assert.ok(ball > none * 1.5, `la bola lo da (${ball.toFixed(1)} s)`);
  assert.ok(pair >= none, `juntas, al menos lo de antes (${pair.toFixed(1)} s frente a ${none.toFixed(1)} s)`);
});
