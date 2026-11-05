// Los objetos de la planta 5 (M11 6a): Formulario en Línea, Tecla Almohadilla, Tiempo de Espera
// Estimado, Código Promocional Caducado y Cable de Teléfono Rizado; y (6b1) Número de Turno,
// Contestador Automático y Llamada Grabada; y (6b2) Hoja de Reclamaciones, Valoración de Cinco
// Estrellas y las sinergias Ticket de Incidencia y Buzón Lleno. Cada uno hace lo que dice su ficha.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, itemsUpTo } from '../src/data/items.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { modifierLines } from '../src/data/describe.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { addModifier, createWorld, DT, enterRoom, giveActive, giveItem, HAND_HEIGHT, hurtPlayer, spawnEnemy } from '../src/sim/world.ts';
import { NO_INPUT, step, type Input, type SimEvent, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const OWN = ['formulario-linea', 'tecla-almohadilla', 'tiempo-espera', 'codigo-caducado', 'cable-rizado', 'numero-turno', 'contestador', 'llamada-grabada', 'hoja-reclamaciones', 'cinco-estrellas'];

/** The test room with nothing in the way (as in objetos.test.ts). */
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

/** Clears the first combat room of a floor-4 run (every enemy down at once) and returns the world. */
function clearCombatRoom(w: World, pick = 0): World {
  const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[pick]!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
  }
  assert.ok(!w.doorsShut, 'la sala se ha limpiado');
  return w;
}

test('son de la planta 5: solo salen desde la planta 5, y su ficha dice lo que hacen', () => {
  for (const id of OWN) {
    assert.equal(ITEMS[id]?.level, 5, id);
    assert.ok(!itemsUpTo(4).includes(id) && itemsUpTo(5).includes(id), id);
    assert.ok(modifierLines(ITEMS[id]!.mod).length > 0, `${id}: su ventana dice algo`);
    assert.ok(ITEMS[id]!.name.split(' ').length <= 4, `${id}: nombre de 2 a 4 palabras`);
  }
  const line = (id: string): string[] => modifierLines(ITEMS[id]!.mod).map((l) => l.text);
  assert.deepEqual(line('formulario-linea'), ['Cargador +40 %', 'Tiempo de recarga +25 %']);
  assert.deepEqual(line('tecla-almohadilla'), ['El objeto activo se carga un 50 % más deprisa']);
  assert.deepEqual(line('tiempo-espera'), ['Espera entre volteretas -25 %', 'Velocidad -5 %']);
  assert.deepEqual(line('codigo-caducado'), ['25 % de bajas con un cupón más', '3 de cada 10 cofres de premio han caducado']);
  assert.deepEqual(line('cable-rizado'), ['Daño +15 %', 'Alcance -10 %', 'Las balas van en tirabuzón']);
  assert.deepEqual(line('numero-turno'), ['Al entrar en una sala: daño -10 %', 'Cada 5 s en ella: daño +5 % (hasta +25 %)']);
  assert.deepEqual(line('contestador'), ['Cada 4 s, un disparo se repite solo (daño ×0,6)']);
  assert.deepEqual(line('llamada-grabada'), ['Quien te hiere queda grabado 6 s: daño ×1,5']);
  // The recorded call is only good, so only the premium chest (and the shop) has it.
  assert.equal(ITEMS['llamada-grabada']!.quality, 'buena');
  assert.deepEqual(line('hoja-reclamaciones'), ['Tras un golpe: 3 disparos persiguen al culpable']);
  assert.deepEqual(line('cinco-estrellas'), ['Sala limpia sin daño: una estrella', 'Con 5 estrellas: +1 corazón', 'Un golpe borra las estrellas']);
  assert.equal(ITEMS['cinco-estrellas']!.quality, 'buena');
  // All but the hash key give something and take something (as the design asks of half of them at least).
  for (const id of ['formulario-linea', 'tiempo-espera', 'codigo-caducado', 'cable-rizado']) {
    assert.ok(modifierLines(ITEMS[id]!.mod).some((l) => !l.good), `${id}: su pega está en la ficha`);
    assert.ok(modifierLines(ITEMS[id]!.mod).some((l) => l.good), `${id}: también da algo`);
  }
});

test('Formulario en Línea y Tiempo de Espera Estimado: las cifras de su ficha', () => {
  const w = bare('formulario', 'formulario-linea', 'tiempo-espera');
  const base = WEAPONS[w.player.weapon.base.id]!;
  const ch = CHARACTERS.tostadora!;
  assert.equal(w.player.weapon.def.magazine, Math.round(base.magazine * 1.4));
  assert.ok(Math.abs(w.player.weapon.def.reloadTime - base.reloadTime * 1.25) < 1e-9);
  assert.ok(Math.abs(w.player.def.rollCooldown - ch.rollCooldown * 0.75) < 1e-9);
  assert.ok(Math.abs(w.player.def.speed - ch.speed * 0.95) < 1e-9);
  // A bigger magazine comes full.
  assert.equal(w.player.weapon.ammo, w.player.weapon.def.magazine);
});

test('Tecla Almohadilla: pila y media por sala; la media pila espera a la siguiente', () => {
  const run = (...items: string[]): number[] => {
    const w = createWorld({ seed: 'almohadilla', floor: true, level: 4 });
    w.noDamage = true;
    for (const id of items) giveItem(w, id);
    giveActive(w, 'espera', 0);
    const out: number[] = [];
    for (let i = 0; i < 3; i++) {
      clearCombatRoom(w, i);
      out.push(w.player.active!.charge);
    }
    return out;
  };
  assert.deepEqual(run(), [1, 2, 3]);
  // 1.5, then 3, then 4.5 batteries: 1 (and a half waiting), 3, 4 (and a half). The waiting room item needs 3.
  const hash = run('tecla-almohadilla');
  assert.equal(hash[0], 1);
  assert.equal(hash[1], 3);
  assert.equal(hash[2], 3, 'nunca pasa de las pilas que pide');
  // With the spare battery (+1 a room) it is 3 a room.
  assert.equal(run('tecla-almohadilla', 'bateria')[0], 3);
});

test('Código Promocional Caducado: una baja de cada cuatro suelta un cupón más', () => {
  const coupons = (item: boolean): number => {
    let total = 0;
    for (let i = 0; i < 80; i++) {
      const w = createWorld({ seed: `codigo-${i}` });
      w.noDamage = true;
      w.pickups = [];
      if (item) giveItem(w, 'codigo-caducado');
      w.enemies = w.enemies.slice(0, 1);
      w.enemies[0]!.damageTaken = w.enemies[0]!.def.hp;
      step(w, NO_INPUT);
      total += w.pickups.filter((k) => k.kind === 'cupon').length;
    }
    return total / 80;
  };
  const gain = coupons(true) - coupons(false);
  assert.ok(gain > 0.1 && gain < 0.45, `cupones de más por baja: ${gain.toFixed(2)}`);
});

test('Código Promocional Caducado: unos tres de cada diez cofres de premio han caducado (y lo dice)', () => {
  const chestOf = (seed: string, mod: 'item' | 'always' | null): { chest: boolean; expired: boolean } => {
    const w = createWorld({ seed, floor: true, level: 4 });
    w.noDamage = true;
    if (mod === 'item') giveItem(w, 'codigo-caducado');
    if (mod === 'always') addModifier(w, { id: 'caducado-siempre', perks: { expiredChests: 1 } });
    const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[0]!;
    w.floor!.rooms[fr.id]!.reward = 'chest';
    const events: SimEvent[] = [];
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
      for (const en of w.enemies) en.damageTaken = en.def.hp;
      step(w, NO_INPUT);
      events.push(...w.events);
    }
    return { chest: w.room.props.some((pr) => pr.chest), expired: events.some((e) => e.type === 'expired') };
  };
  // Without the item, the chest is always there.
  for (let i = 0; i < 10; i++) assert.deepEqual(chestOf(`premio-${i}`, null), { chest: true, expired: false });
  assert.deepEqual(chestOf('premio-x', 'always'), { chest: false, expired: true });
  let gone = 0;
  const n = 60;
  for (let i = 0; i < n; i++) {
    const r = chestOf(`premio-${i}`, 'item');
    assert.equal(r.chest, !r.expired);
    if (r.expired) gone++;
  }
  assert.ok(gone / n > 0.12 && gone / n < 0.5, `caducados: ${gone} de ${n}`);
});

test('Cable de Teléfono Rizado: las balas ondulan a los lados de su línea, hacen ×1,15 y llegan un 10 % menos', () => {
  const fire: Input = { ...NO_INPUT, fire: true, aimX: 400, aimY: 200 - HAND_HEIGHT };
  const shoot = (...items: string[]): { w: World; id: number } => {
    const w = bare('cable', ...items);
    w.player.weapon.cooldown = 0;
    for (let i = 0; i < 30; i++) {
      step(w, fire);
      const b = w.bullets.find((o) => o.owner === 'player');
      if (b) return { w, id: b.id };
    }
    throw new Error('no ha disparado');
  };
  const plain = shoot();
  const curly = shoot('cable-rizado');
  const bp = plain.w.bullets.find((b) => b.id === plain.id)!;
  const bc = curly.w.bullets.find((b) => b.id === curly.id)!;
  assert.ok(Math.abs(bc.damage - bp.damage * 1.15) < 1e-9, `${bc.damage} frente a ${bp.damage}`);
  assert.ok(Math.abs(bc.life - bp.life * 0.9) < 0.05, `${bc.life} frente a ${bp.life}`);
  assert.deepEqual(bc.wave, { amp: 5, freq: 3 });
  // Flying on: the line it weaves along (its direction) stays put, and it sways 5 px either way of it
  // (10 from one side to the other; measured from where it was one tick in, already on its way out).
  const x0 = bc.x;
  const y0 = bc.y;
  const dir = bc.dir;
  let most = 0;
  let least = 0;
  for (let i = 0; i < ticks(0.3); i++) {
    step(curly.w, NO_INPUT);
    const b = curly.w.bullets.find((o) => o.id === curly.id);
    if (!b) break;
    assert.ok(Math.abs(b.dir - dir) < 1e-9, 'su línea no se tuerce');
    const side = -(b.x - x0) * Math.sin(dir) + (b.y - y0) * Math.cos(dir);
    most = Math.max(most, side);
    least = Math.min(least, side);
  }
  assert.ok(most - least > 8.5 && most - least < 11, `va de ${least.toFixed(2)} a ${most.toFixed(2)} px de su línea`);
});

test('Cable de Teléfono Rizado: al rebotar, refleja su línea, no su vaivén', () => {
  const w = bare('cable-rebote', 'cable-rizado');
  addModifier(w, { id: 'rebote', bullets: { bounce: 2 } });
  w.player.x = 140;
  w.player.weapon.cooldown = 0;
  // Straight at the left wall.
  const fire: Input = { ...NO_INPUT, fire: true, aimX: 0, aimY: 200 - HAND_HEIGHT };
  let id = -1;
  for (let i = 0; i < 30 && id < 0; i++) {
    step(w, fire);
    id = w.bullets.find((o) => o.owner === 'player')?.id ?? -1;
  }
  const b0 = w.bullets.find((o) => o.id === id)!;
  const before = b0.dir;
  for (let i = 0; i < ticks(2); i++) {
    step(w, NO_INPUT);
    const b = w.bullets.find((o) => o.id === id);
    if (!b) break;
    if ((b.bounce ?? 0) < 2) {
      // Mirrored across the vertical: cos flips, sin stays.
      assert.ok(Math.abs(Math.cos(b.dir) + Math.cos(before)) < 1e-6, `${b.dir} frente a ${before}`);
      assert.ok(Math.abs(Math.sin(b.dir) - Math.sin(before)) < 1e-6);
      return;
    }
  }
  assert.fail('no ha rebotado');
});

/** Fires one pull of the trigger to the right and returns the new player bullets. */
function pull(w: World): { id: number; damage: number; echo?: boolean }[] {
  const fire: Input = { ...NO_INPUT, fire: true, aimX: w.player.x + 200, aimY: w.player.y - HAND_HEIGHT };
  w.player.weapon.cooldown = 0;
  w.player.weapon.reload = 0;
  if (w.player.weapon.ammo === 0) w.player.weapon.ammo = w.player.weapon.def.magazine;
  for (let i = 0; i < 30; i++) {
    const before = new Set(w.bullets.map((b) => b.id));
    step(w, fire);
    const fresh = w.bullets.filter((b) => b.owner === 'player' && !before.has(b.id));
    if (fresh.length) return fresh;
  }
  throw new Error('no ha disparado');
}

/** Lets `s` seconds go by, collecting the events. */
function wait(w: World, s: number): SimEvent[] {
  const out: SimEvent[] = [];
  for (let i = 0; i < ticks(s); i++) {
    step(w, NO_INPUT);
    out.push(...w.events);
  }
  return out;
}

test('Número de Turno: ×0,9 al entrar, +5 % cada 5 s en la sala hasta ×1,25, y vuelta a empezar en la siguiente', () => {
  const base = pull(bare('turno-base'))[0]!.damage;
  const w = bare('turno', 'numero-turno');
  assert.ok(Math.abs(pull(w)[0]!.damage - base * 0.9) < 1e-9);
  const ev = wait(w, 5.1);
  assert.ok(Math.abs(pull(w)[0]!.damage - base * 0.95) < 1e-9);
  const q = ev.filter((e) => e.type === 'queue');
  assert.equal(q.length, 1);
  assert.ok(q[0]!.type === 'queue' && q[0]!.level === 1 && !q[0]!.top);
  const more = wait(w, 40).filter((e) => e.type === 'queue');
  assert.deepEqual(more.map((e) => (e.type === 'queue' ? e.level : 0)), [2, 3, 4, 5, 6, 7]);
  assert.ok(more.at(-1)!.type === 'queue' && (more.at(-1) as { top: boolean }).top, 'el último paso avisa de que ya no sube');
  assert.ok(Math.abs(pull(w)[0]!.damage - base * 1.25) < 1e-9);
  // A new room: back to the end of the queue.
  const f = createWorld({ seed: 'turno-planta', floor: true, level: 4 });
  f.noDamage = true;
  giveItem(f, 'numero-turno');
  wait(f, 12);
  const fr = f.floor!.layout.rooms.find((r) => r.kind === 'combat')!;
  enterRoom(f, fr.id, fr.doors[0]!.dir);
  f.holdT = 99;
  const fresh = pull(f)[0]!.damage;
  const plain = createWorld({ seed: 'turno-planta', floor: true, level: 4 });
  assert.ok(Math.abs(fresh - plain.player.weapon.def.damage * 0.9) < 1e-9, `${fresh}`);
});

test('Contestador Automático: un disparo se repite solo medio segundo después, al 60 %, sin gastar balas; el siguiente, a los 4 s', () => {
  const w = bare('contestador', 'contestador');
  const first = pull(w);
  const ammo = w.player.weapon.ammo;
  const dmg = first[0]!.damage;
  assert.ok(!first.some((b) => b.echo));
  let ev = wait(w, 0.55);
  const echoes = w.bullets.filter((b) => b.echo);
  assert.equal(echoes.length, first.length, 'se repite la tirada entera');
  assert.ok(Math.abs(echoes[0]!.damage - dmg * 0.6) < 1e-9);
  assert.equal(w.player.weapon.ammo, ammo, 'la repetición no gasta balas');
  assert.deepEqual(ev.filter((e) => e.type === 'echo').map((e) => (e.type === 'echo' ? e.played : null)), [true]);
  // Within the 4 s nothing else is recorded.
  pull(w);
  ev = wait(w, 1);
  assert.equal(ev.filter((e) => e.type === 'echo').length, 0);
  // After them, the next shot is recorded again.
  wait(w, 3);
  pull(w);
  ev = wait(w, 0.6);
  assert.ok(ev.some((e) => e.type === 'echo' && e.played));
  // Without the item, nothing.
  const plain = bare('contestador-no');
  pull(plain);
  wait(plain, 0.6);
  assert.ok(!plain.bullets.some((b) => b.echo));
});

test('Llamada Grabada: quien te hiere (cuerpo a cuerpo o con sus balas) queda marcado 6 s y recibe ×1,5', () => {
  const setUp = (seed: string, item: boolean): { w: World; en: ReturnType<typeof spawnEnemy> } => {
    const w = bare(seed, ...(item ? ['llamada-grabada'] : []));
    w.noDamage = false;
    const en = spawnEnemy(w.nextId++, ENEMIES['aspirador']!, w.player.x + 60, w.player.y);
    en.state = 'idle';
    en.until = 999;
    w.enemies.push(en);
    return { w, en };
  };
  /** The damage the enemy takes from one pull. */
  const took = (w: World, en: ReturnType<typeof spawnEnemy>): number => {
    const before = en.damageTaken;
    pull(w);
    for (let i = 0; i < ticks(0.4) && en.damageTaken === before; i++) step(w, NO_INPUT);
    return en.damageTaken - before;
  };
  const a = setUp('grabada-0', false);
  const plainHit = took(a.w, a.en);
  assert.ok(plainHit > 0);
  // Hurt by contact (its id as the source).
  const b = setUp('grabada-1', true);
  hurtPlayer(b.w, 1, b.en.id, 1, 0);
  assert.equal(b.en.markT, 6);
  assert.ok(b.w.events.some((e) => e.type === 'recorded' && e.target === b.en.id));
  b.w.player.invulnerable = 0;
  assert.ok(Math.abs(took(b.w, b.en) - plainHit * 1.5) < 1e-9);
  // Six seconds later the mark is gone.
  b.en.markT = 0.01;
  wait(b.w, 0.05);
  assert.ok(Math.abs(took(b.w, b.en) - plainHit) < 1e-9);
  // Hurt by one of its bullets: the pattern carries who fired it.
  const c = setUp('grabada-2', true);
  c.w.player.invulnerable = 0;
  const p = c.w.player;
  const shotAt = { id: c.w.nextId++, owner: 'enemy' as const, x: p.x + 6, y: p.y - 8, vx: -60, vy: 0, r: 3, life: 1, damage: 1, knockback: 0 };
  c.w.bullets.push({ ...shotAt, color: 'red', age: 0, dir: Math.PI, speed: 60, h: 8, from: c.en.id });
  for (let i = 0; i < 30 && !c.en.markT; i++) step(c.w, NO_INPUT);
  assert.ok((c.en.markT ?? 0) > 5, 'la bala lo delata');
  // Without the item, nobody is marked.
  const d = setUp('grabada-3', false);
  hurtPlayer(d.w, 1, d.en.id, 1, 0);
  assert.equal(d.en.markT, undefined);
});

/** An enemy standing still at (x, y) of a bare room (it neither moves nor attacks). */
function still(w: World, id: string, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

test('Hoja de Reclamaciones: tras un golpe, los tres disparos siguientes persiguen a quien te ha dado (aunque apuntes a otro lado)', () => {
  const w = bare('reclamacion', 'hoja-reclamaciones');
  w.noDamage = false;
  // The culprit is up and to the left; the toaster fires to the right.
  const culprit = still(w, 'aspirador', w.player.x - 40, w.player.y - 90);
  culprit.def = { ...culprit.def, hp: 9999 };
  hurtPlayer(w, 1, culprit.id, 1, 0);
  w.player.invulnerable = 99;
  assert.ok(w.events.some((e) => e.type === 'complaint' && e.target === culprit.id && e.shots === 3));
  const shots = [pull(w), pull(w), pull(w)];
  for (const s of shots) for (const b of s) assert.equal(w.bullets.find((o) => o.id === b.id)?.chase, culprit.id);
  assert.ok(!pull(w).some((b) => w.bullets.find((o) => o.id === b.id)?.chase !== undefined), 'el cuarto, ya no');
  // They get there: the culprit takes damage although nobody aimed at it.
  wait(w, 1.5);
  assert.ok(culprit.damageTaken > 0, 'las balas dan la vuelta y le alcanzan');
  // Without a culprit (a hit with no source), nothing to complain about.
  const n = bare('reclamacion-nadie', 'hoja-reclamaciones');
  n.noDamage = false;
  hurtPlayer(n, 1, -1, 1, 0);
  assert.equal(n.player.complaint, undefined);
  // If the culprit is down before the shots, they fly straight.
  const g = bare('reclamacion-baja', 'hoja-reclamaciones');
  g.noDamage = false;
  const gone = still(g, 'aspirador', g.player.x - 40, g.player.y - 90);
  hurtPlayer(g, 1, gone.id, 1, 0);
  g.enemies = [];
  assert.ok(pull(g).every((b) => g.bullets.find((o) => o.id === b.id)?.chase === undefined));
  // Without the item, no chasing.
  const plain = bare('reclamacion-no');
  plain.noDamage = false;
  hurtPlayer(plain, 1, still(plain, 'aspirador', 60, 100).id, 1, 0);
  assert.ok(pull(plain).every((b) => plain.bullets.find((o) => o.id === b.id)?.chase === undefined));
});

test('Ticket de Incidencia (Hoja de Reclamaciones + Llamada Grabada): las balas que persiguen al grabado le hacen la marca otra vez y se la renuevan', () => {
  assert.deepEqual(SYNERGIES['ticket-incidencia']!.items, ['hoja-reclamaciones', 'llamada-grabada']);
  /** The damage the first chasing pull does to the culprit (who sits right in the line of fire). */
  const hit = (items: string[]): { took: number; mark: number } => {
    const w = bare(`ticket-${items.join('-')}`, ...items);
    w.noDamage = false;
    const en = still(w, 'aspirador', w.player.x + 60, w.player.y - HAND_HEIGHT + 8);
    en.def = { ...en.def, hp: 9999 };
    hurtPlayer(w, 1, en.id, 1, 0);
    w.player.invulnerable = 99;
    if (en.markT) en.markT = 2;
    pull(w);
    for (let i = 0; i < ticks(0.5) && en.damageTaken === 0; i++) step(w, NO_INPUT);
    return { took: en.damageTaken, mark: en.markT ?? 0 };
  };
  const recorded = hit(['llamada-grabada']);
  const both = hit(['llamada-grabada', 'hoja-reclamaciones']);
  assert.ok(both.took > 0);
  assert.ok(Math.abs(both.took - recorded.took * 1.5) < 1e-6, `${both.took} frente a ${recorded.took}`);
  assert.ok(both.mark > 5, 'el caso sigue abierto: la marca vuelve a sus 6 s');
  assert.ok(recorded.mark < 2.1, 'sin la sinergia, la marca sigue bajando');
  const w = bare('ticket-ficha', 'llamada-grabada', 'hoja-reclamaciones');
  assert.ok(w.player.synergies.includes('ticket-incidencia'));
});

test('Buzón Lleno (Contestador + Cable Rizado): la repetición ondula, atraviesa a un enemigo y se graba cada 3 s', () => {
  assert.deepEqual(SYNERGIES['buzon-lleno']!.items, ['contestador', 'cable-rizado']);
  const w = bare('buzon', 'contestador', 'cable-rizado');
  assert.ok(w.player.synergies.includes('buzon-lleno'));
  pull(w);
  wait(w, 0.55);
  const echoes = w.bullets.filter((b) => b.echo);
  assert.ok(echoes.length > 0);
  for (const b of echoes) {
    assert.ok(b.wave, 'ondula');
    assert.equal(b.pierce, 1, 'atraviesa a uno');
  }
  // Recorded again at 3 s, not 4.
  wait(w, 2.5);
  pull(w);
  assert.ok(wait(w, 0.6).some((e) => e.type === 'echo' && e.played), 'a los 3 s graba otra vez');
  // The machine alone: no piercing playback, and still every 4 s.
  const alone = bare('buzon-solo', 'contestador');
  pull(alone);
  wait(alone, 0.55);
  assert.ok(alone.bullets.filter((b) => b.echo).every((b) => !b.pierce));
  wait(alone, 2.5);
  pull(alone);
  assert.ok(!wait(alone, 0.6).some((e) => e.type === 'echo' && e.played), 'sin el cable, a los 3 s aún no');
});

test('Valoración de Cinco Estrellas: una estrella por sala limpia sin daño; con cinco, +1 corazón y vuelta a cero; un golpe las borra', () => {
  const w = createWorld({ seed: 'estrellas', floor: true, level: 4 });
  w.noDamage = true;
  giveItem(w, 'cinco-estrellas');
  const max = w.player.def.maxHp;
  const combats = w.floor!.layout.rooms.filter((r) => r.kind === 'combat');
  assert.ok(combats.length >= 5);
  const stars: number[] = [];
  for (let i = 0; i < 4; i++) {
    clearCombatRoom(w, i);
    stars.push(w.player.stars ?? 0);
  }
  assert.deepEqual(stars, [1, 2, 3, 4]);
  // A hit wipes them (and says so).
  w.noDamage = false;
  w.player.invulnerable = 0;
  hurtPlayer(w, 1, -1, 1, 0);
  assert.equal(w.player.stars, 0);
  assert.ok(w.events.some((e) => e.type === 'stars' && e.stars === 0 && e.was === 4));
  // The room where the toaster was hurt gives no star.
  w.noDamage = true;
  w.player.starsHurt = true;
  const fr = combats[4]!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  w.player.starsHurt = true;
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
  }
  assert.equal(w.player.stars ?? 0, 0, 'la sala del golpe no da estrella');
  // Five clean rooms in a row (on a fresh floor): one more heart, filled, and back to zero.
  const f = createWorld({ seed: 'estrellas', floor: true, level: 4 });
  f.noDamage = true;
  giveItem(f, 'cinco-estrellas');
  const hpBefore = f.player.hp;
  let paid = 0;
  for (let i = 0; i < 5; i++) {
    clearCombatRoom(f, i);
    paid += f.events.filter((e) => e.type === 'stars' && e.paid === true).length;
  }
  assert.equal(paid, 1);
  assert.equal(f.player.stars, 0);
  assert.equal(f.player.def.maxHp, max + 2);
  assert.equal(f.player.hp, hpBefore + 2);
  // Without the item, no stars.
  const plain = createWorld({ seed: 'estrellas', floor: true, level: 4 });
  plain.noDamage = true;
  clearCombatRoom(plain);
  assert.equal(plain.player.stars, undefined);
});
