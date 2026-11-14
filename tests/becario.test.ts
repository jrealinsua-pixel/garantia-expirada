// M13 (5): El Becario Eterno. «Experiencia demostrable»: cada sala de combate limpiada sin que le
// hieran suma un punto (+4 % de daño, hasta 6); una herida le deja la mitad («no se valora»).
// «Sin remunerar»: los enemigos le dejan la mitad de cupones (exacta, sin dados).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { meritRows } from '../src/data/describe.ts';
import { meritLine, MERIT_LOST_LINE } from '../src/data/texts.ts';
import { textWidth } from '../src/art/font.ts';
import { createWorld, DT, enterRoom, hurtPlayer, meritScale, NO_INPUT, nextFloor, spawnEnemy, step, worldHash, type World } from '../src/sim/world.ts';
import { BECARIO_FRAMES, makeBecarioFrames, makeBecarioHand, makeBecarioPose } from '../tools/sprites/becario.ts';
import { HERO_FRAMES } from '../tools/sprites/characters.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const def = CHARACTERS.becario!;
const ab = def.ability!;

/** Clears a floor's `pick`-th combat room (every enemy down at once). */
function clearCombatRoom(w: World, pick: number): void {
  const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[pick]!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
  }
  assert.ok(!w.doorsShut, 'la sala se ha limpiado');
}

test('el Becario es contenido: datos, los ocho fotogramas de siempre, su mano y sus textos', () => {
  assert.equal(def.startWeapon, 'grapadora');
  assert.equal(def.maxHp, 6);
  assert.ok(def.speed > CHARACTERS.tostadora!.speed, 'anda algo más deprisa');
  assert.ok(ab.kind === 'merit');
  assert.ok(ab.step > 0 && ab.max > 0 && ab.kept > 0 && ab.kept < 1 && ab.couponMul === 0.5);
  // (M14c (a4d1): redrawn in the new style with his own frames; tests/becario-a4d.test.ts.)
  const frames = makeBecarioFrames();
  assert.equal(frames.length, 8);
  assert.equal(BECARIO_FRAMES.length, HERO_FRAMES.length);
  for (const f of frames) assert.deepEqual([f.w, f.h], [def.look.w, def.look.h]);
  assert.equal(def.look.hand, 'mano-becario');
  assert.deepEqual([makeBecarioHand().w, makeBecarioHand().h], [7, 7]);
  // The feet stand where the look says (the shoes' last row).
  const rest = makeBecarioPose(BECARIO_FRAMES[0]!);
  const lowest = Math.max(...Array.from({ length: rest.h }, (_, y) => y).filter((y) => Array.from({ length: rest.w }, (_, x) => x).some((x) => rest.get(x, y)[3] > 0)));
  assert.equal(lowest, def.look.feetY, 'el contorno de los zapatos, justo donde pisa');
  for (const s of [meritLine(1, 6), meritLine(6, 6), MERIT_LOST_LINE]) assert.ok(textWidth(s) > 0 && textWidth(s) < 220, s);
  assert.deepEqual(meritRows(CHARACTERS.tostadora!, 3), []);
  assert.equal(meritRows(def, 3)[0]!.now, '3 (daño +12 %)');
});

test('una sala limpia sin daño suma un punto y un poco más de daño a cada disparo; hasta el tope', () => {
  const w = createWorld({ seed: 'becario-salas', floor: true, level: 4, character: 'becario' });
  w.noDamage = true;
  const combats = w.floor!.layout.rooms.filter((r) => r.kind === 'combat');
  assert.ok(combats.length >= 3);
  const seen: number[] = [];
  for (let i = 0; i < 3; i++) {
    clearCombatRoom(w, i);
    seen.push(w.player.merit ?? 0);
  }
  assert.deepEqual(seen, [1, 2, 3]);
  assert.ok(ab.kind === 'merit');
  const scale = 1 + 3 * ab.step;
  assert.ok(Math.abs(meritScale(w.player) - scale) < 1e-9);
  // The shots carry it: a staple from the Grapadora does that much more damage.
  w.player.weapon.cooldown = 0;
  w.player.weapon.ammo = w.player.weapon.def.magazine;
  const before = new Set(w.bullets.map((b) => b.id));
  step(w, { ...NO_INPUT, fire: true, aimX: w.player.x + 100, aimY: w.player.y });
  const shot = w.bullets.find((b) => b.owner === 'player' && !before.has(b.id));
  assert.ok(shot, 'ha disparado');
  assert.ok(Math.abs(shot.damage - w.player.weapon.def.damage * scale) < 1e-9, `daño ${shot.damage}`);
  // At the top, no more (and nothing is said).
  w.player.merit = ab.kind === 'merit' ? ab.max : 0;
  clearCombatRoom(w, 3);
  assert.equal(w.player.merit, ab.kind === 'merit' ? ab.max : -1);
  // The tostadora never gets any.
  const t = createWorld({ seed: 'becario-salas', floor: true, level: 4 });
  t.noDamage = true;
  clearCombatRoom(t, 0);
  assert.equal(t.player.merit ?? 0, 0);
  assert.equal(meritScale(t.player), 1);
});

test('una herida deja la mitad («no se valora») y la sala del golpe no suma', () => {
  const w = createWorld({ seed: 'becario-golpe', floor: true, level: 4, character: 'becario' });
  w.noDamage = true;
  for (let i = 0; i < 3; i++) clearCombatRoom(w, i);
  assert.equal(w.player.merit, 3);
  w.noDamage = false;
  w.player.invulnerable = 0;
  hurtPlayer(w, 1, -1, 1, 0);
  assert.equal(w.player.merit, 1, 'tres a la mitad, hacia abajo');
  assert.ok(w.events.some((e) => e.type === 'merit' && e.was === 3 && e.level === 1));
  // Hurt in this room (and then cleared): no point.
  w.noDamage = true;
  const fr = w.floor!.layout.rooms.filter((r) => r.kind === 'combat')[3]!;
  enterRoom(w, fr.id, fr.doors[0]!.dir);
  w.player.meritHurt = true;
  for (let i = 0; i < ticks(4) && w.doorsShut; i++) {
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    step(w, NO_INPUT);
  }
  assert.equal(w.player.merit, 1, 'la sala del golpe no suma');
});

test('la experiencia se lleva a la planta siguiente', () => {
  const w = createWorld({ seed: 'becario-planta', floor: true, level: 1, character: 'becario' });
  w.player.merit = 4;
  w.won = true;
  const n = nextFloor(w)!;
  assert.equal(n.player.base.def.id, 'becario');
  assert.equal(n.player.merit, 4);
});

test('«Sin remunerar»: exactamente la mitad de los cupones, sin tirar dados', () => {
  const kill = (character: string): { coupons: number; hash: string } => {
    const w = createWorld({ seed: 'becario-cupones', noEnemies: true, character });
    w.noDamage = true;
    w.room.props = [];
    w.pickups = [];
    let total = 0;
    for (let k = 0; k < 20; k++) {
      const en = spawnEnemy(w.nextId++, ENEMIES.microondas!, 200 + (k % 4) * 10, 150);
      w.enemies.push(en);
      en.damageTaken = en.def.hp;
      const before = w.pickups.filter((p) => p.kind === 'cupon').reduce((s, p) => s + p.value, 0);
      for (let i = 0; i < 3; i++) step(w, NO_INPUT);
      total += w.pickups.filter((p) => p.kind === 'cupon').reduce((s, p) => s + p.value, 0) - before;
      w.pickups = [];
    }
    return { coupons: total, hash: worldHash(w) };
  };
  const toaster = kill('tostadora');
  const intern = kill('becario');
  assert.ok(toaster.coupons >= 6, `la tostadora recoge ${toaster.coupons}`);
  assert.ok(Math.abs(intern.coupons - toaster.coupons / 2) <= 0.5, `${intern.coupons} de ${toaster.coupons}`);
  assert.equal(kill('becario').hash, intern.hash, 'determinista');
});
