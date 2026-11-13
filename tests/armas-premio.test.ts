// M14 (l4b): the two prize weapons. The Soldador de Estaño («Fin de la garantía») leaves the drops
// that miss stuck where they land; the Mando Universal («Toda la gama») fires fast pinpoints of
// light that go through one enemy and sometimes find «the right channel».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { ACHIEVEMENTS, lockedContent } from '../src/data/logros.ts';
import { FINDABLE_WEAPONS, WEAPONS, weaponsUpTo } from '../src/data/weapons.ts';
import { weaponProfile } from '../src/data/describe.ts';
import { SFX } from '../src/audio/synth.ts';
import { createWorld, DT, giveWeapon, HAND_HEIGHT, NO_INPUT, spawnEnemy, step, SWAP_TIME, type Bullet, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);
const fireAt = (x: number, y: number): Input => ({ ...NO_INPUT, fire: true, aimX: x, aimY: y });

/** The test room with nothing in the way, the toaster holding `weapon` (ready to fire). */
function range(seed: string, weapon: string): World {
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
  giveWeapon(w, weapon);
  for (let i = 0; i < ticks(SWAP_TIME) + 2; i++) step(w, NO_INPUT);
  return w;
}

test('son contenido: datos, sprites, sonido, y premio de los dos últimos logros (desde la planta 1, una vez ganados)', () => {
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  const prizes: Record<string, string> = { soldador: 'fin-garantia', mando: 'toda-la-gama' };
  for (const [id, ach] of Object.entries(prizes)) {
    const d = WEAPONS[id]!;
    assert.ok(FINDABLE_WEAPONS.includes(id) && weaponsUpTo(1).includes(id), id);
    assert.deepEqual(ACHIEVEMENTS.find((a) => a.id === ach)!.reward, { kind: 'arma', id });
    assert.ok(lockedContent([]).includes(id) && !lockedContent([ach]).includes(id));
    assert.ok(!d.quality, `${id}: no solo de la Caja Fuerte Premium`);
    for (const k of [d.look.sprite, d.look.bullet]) assert.ok(keys.has(k), k);
    assert.ok(SFX[d.look.sound], d.look.sound);
    // An upgrade on the starting dryer per second, under the balance cap.
    assert.ok(weaponProfile(d).dps > weaponProfile(WEAPONS.secador!).dps && weaponProfile(d).dps < 7, id);
  }
  // Not in the daily challenge, nor for a fresh profile.
  const fresh = createWorld({ seed: 'premio-armas', floor: true, level: 1, locked: lockedContent([]) });
  assert.ok(!fresh.floor!.weapons.some((id) => id in prizes));
});

test('Soldador: la gota que falla se queda pegada 3 s en la pared y quema una vez a quien la pisa', () => {
  const w = range('soldador-pared', 'soldador');
  step(w, fireAt(0, w.player.y - HAND_HEIGHT));
  let b: Bullet | undefined;
  for (let i = 0; i < ticks(1.2) && !b; i++) {
    step(w, NO_INPUT);
    b = w.bullets.find((x) => x.owner === 'player' && x.stuck);
  }
  assert.ok(b, 'se queda pegada');
  assert.ok(b.vx === 0 && b.vy === 0 && Math.abs(b.life - 3) < 0.05, JSON.stringify({ vx: b.vx, life: b.life }));
  const en = spawnEnemy(w.nextId++, ENEMIES.microondas!, b.x, b.y);
  w.enemies.push(en);
  for (let i = 0; i < 20 && w.bullets.includes(b); i++) {
    en.x = b.x - (en.def.hurt.x + en.def.hurt.w / 2);
    en.y = b.y - (en.def.hurt.y + en.def.hurt.h / 2);
    en.vx = 0;
    en.vy = 0;
    step(w, NO_INPUT);
  }
  assert.ok(Math.abs(en.damageTaken - b.damage) < 1e-9, `una sola vez (${en.damageTaken} frente a ${b.damage})`);
  for (let i = 0; i < ticks(3.1); i++) step(w, NO_INPUT);
  assert.ok(!w.bullets.some((x) => x.stuck), 'y luego se enfría');
});

test('Mando: atraviesa a uno, y una de cada cinco veces más o menos acierta con el canal (×3)', () => {
  const w = range('mando-fila', 'mando');
  const y = w.player.y - HAND_HEIGHT;
  const row = [0, 1, 2].map((i) => {
    const en = spawnEnemy(w.nextId++, ENEMIES.aspirador!, w.player.x + 50 + 22 * i, w.player.y);
    en.state = 'idle';
    en.until = 999;
    en.def = { ...en.def, hp: 1e6 };
    w.enemies.push(en);
    return en;
  });
  for (let i = 0; i < ticks(0.12); i++) step(w, fireAt(400, y));
  for (let i = 0; i < ticks(0.3); i++) step(w, NO_INPUT);
  assert.ok(row[0]!.damageTaken > 0 && row[1]!.damageTaken > 0, 'atraviesa al primero');
  assert.equal(row[2]!.damageTaken, 0, 'pero no a dos');
  // Criticals: over many pulses, about a fifth do three times the damage.
  const m = WEAPONS.mando!;
  const v = range('mando-canal', 'mando');
  const target = spawnEnemy(v.nextId++, ENEMIES.aspirador!, v.player.x + 60, v.player.y);
  target.state = 'idle';
  target.until = 999;
  target.def = { ...target.def, hp: 1e6 };
  v.enemies.push(target);
  let hits = 0;
  let crits = 0;
  let last = 0;
  for (let i = 0; i < ticks(30); i++) {
    step(v, fireAt(400, v.player.y - HAND_HEIGHT));
    target.x = v.player.x + 60;
    target.y = v.player.y;
    target.vx = 0;
    target.vy = 0;
    const got = target.damageTaken - last;
    last = target.damageTaken;
    if (got > 0) {
      hits++;
      if (got > m.damage * 2) crits++;
    }
  }
  assert.ok(hits > 60, `${hits} impactos`);
  const share = crits / hits;
  assert.ok(share > 0.1 && share < 0.32, `críticos ${crits}/${hits}`);
});
