// M9b (12b): the special temporary hearts. The Corazón Modo Turbo (more damage until the next
// combat room is cleared) and the Corazón de Sobretensión (a heart on loan that shocks the room
// when it breaks). Rarer than the Garantía Provisional, and the stronger, the rarer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SPECIAL_HEARTS, SURGE_DAMAGE, SURGE_VALUE, TURBO_DAMAGE, TURBO_HEAL } from '../src/data/hearts.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import {
  checkInvariants,
  CLEAR_SHIELD_CHANCE,
  createWorld,
  DT,
  dropHeart,
  enterRoom,
  HAND_HEIGHT,
  hurtPlayer,
  NO_INPUT,
  nextFloor,
  SHIELD_VALUE,
  spawnEnemy,
  step,
  worldHash,
  type World,
} from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
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

function idle(w: World, id: string, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

test('más raros que la garantía, y cuanto más potentes, más raros', () => {
  assert.ok(SPECIAL_HEARTS.turbo.chance < CLEAR_SHIELD_CHANCE);
  assert.ok(SPECIAL_HEARTS.sobretension.chance < SPECIAL_HEARTS.turbo.chance);
  let free = 0;
  const seen = { turbo: 0, surge: 0, shield: 0 };
  for (let i = 0; i < 200; i++) {
    const f = createWorld({ seed: `especiales${i}`, floor: true }).floor!;
    for (const [id, r] of f.rooms.entries()) {
      if (f.layout.rooms[id]!.kind !== 'combat' || r.reward === 'ticket' || r.reward === 'chest') continue;
      free++;
      if (r.reward === 'turbo') seen.turbo++;
      if (r.reward === 'surge') seen.surge++;
      if (r.reward === 'shield') seen.shield++;
    }
  }
  const rate = (n: number): number => n / free;
  assert.ok(Math.abs(rate(seen.turbo) - SPECIAL_HEARTS.turbo.chance) < 0.025, `turbo ${rate(seen.turbo).toFixed(3)}`);
  assert.ok(Math.abs(rate(seen.surge) - SPECIAL_HEARTS.sobretension.chance) < 0.02, `sobretensión ${rate(seen.surge).toFixed(3)}`);
  assert.ok(seen.surge < seen.turbo && seen.turbo < seen.shield, JSON.stringify(seen));
});

test('Modo Turbo: cura un corazón y cada disparo hace un 30 % más, hasta limpiar la siguiente sala de combate', () => {
  const w = bare('turbo');
  w.noDamage = true;
  w.player.hp = 2;
  dropHeart(w, w.player.x, w.player.y, 'turbo');
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  assert.equal(w.player.hp, 2 + TURBO_HEAL);
  assert.ok(w.player.turbo);
  const base = w.player.weapon.def.damage;
  step(w, { ...NO_INPUT, fire: true, aimX: w.player.x + 100, aimY: w.player.y - HAND_HEIGHT });
  const b = w.bullets.find((x) => x.owner === 'player')!;
  assert.ok(Math.abs(b.damage - base * TURBO_DAMAGE) < 1e-9, `${b.damage} contra ${base}`);
  // A combat room cleared: the turbo is over.
  const f = createWorld({ seed: 'turbo-sala', floor: true });
  f.noDamage = true;
  f.player.turbo = true;
  const at = f.floor!.layout.rooms.find((r) => r.kind === 'combat')!;
  enterRoom(f, at.id, at.doors[0]!.dir);
  assert.ok(f.player.turbo, 'sigue al entrar');
  for (const en of f.enemies) en.damageTaken = en.def.hp;
  let ended = false;
  for (let t = 0; t < ticks(4) && f.player.turbo; t++) {
    step(f, NO_INPUT);
    ended ||= f.events.some((e) => e.type === 'turboEnd');
  }
  assert.ok(!f.player.turbo && ended, 'se acaba al limpiar la sala');
});

test('Modo Turbo: con la vida llena y ya en turbo se queda en el suelo', () => {
  const w = bare('turbo-lleno');
  w.noDamage = true;
  w.player.turbo = true;
  dropHeart(w, w.player.x, w.player.y, 'turbo');
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  assert.equal(w.pickups.filter((k) => k.kind === 'turbo').length, 1);
});

test('Sobretensión: paga antes que la garantía y la vida, y al romperse sacude a todos los enemigos de la sala', () => {
  const w = bare('sobretension');
  const hp = w.player.hp;
  w.player.surge = SURGE_VALUE;
  w.player.shield = SHIELD_VALUE;
  const far = idle(w, 'aspirador', 400, 260);
  const small = idle(w, 'polilla', 300, 120);
  hurtPlayer(w, 1, -1, 0, 1);
  assert.equal(w.player.surge, 1);
  assert.equal(w.player.shield, SHIELD_VALUE, 'la garantía no se toca mientras quede sobretensión');
  assert.equal(far.damageTaken, 0, 'medio roto, todavía no suelta la descarga');
  w.player.invulnerable = 0;
  hurtPlayer(w, 2, -1, 0, 1);
  assert.equal(w.player.surge, 0);
  assert.equal(w.player.shield, SHIELD_VALUE - 1, 'lo que sobra lo paga la garantía');
  assert.equal(w.player.hp, hp);
  const ev = w.events.find((e) => e.type === 'surge');
  assert.ok(ev && ev.type === 'surge' && ev.targets.length === 2, 'la descarga llega a los dos');
  assert.equal(far.damageTaken, SURGE_DAMAGE, 'lejos también');
  assert.ok(small.damageTaken >= small.def.hp, 'una polilla no la aguanta');
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(!w.enemies.includes(small), 'y se desmonta');
  assert.ok(w.enemies.includes(far));
  assert.deepEqual(checkInvariants(w), []);
});

test('Sobretensión: se coge una como mucho y no cura', () => {
  const w = bare('sobretension-coger');
  w.noDamage = true;
  w.player.hp = 2;
  dropHeart(w, w.player.x, w.player.y, 'sobretension');
  dropHeart(w, w.player.x, w.player.y, 'sobretension');
  for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  assert.equal(w.player.surge, SURGE_VALUE);
  assert.equal(w.player.hp, 2);
  assert.equal(w.pickups.filter((k) => k.kind === 'sobretension').length, 1);
});

test('todo caduca al bajar de planta', () => {
  const w = createWorld({ seed: 'especiales-planta', floor: true });
  w.player.surge = SURGE_VALUE;
  w.player.turbo = true;
  w.won = true;
  const n = nextFloor(w)!;
  assert.equal(n.player.surge, 0);
  assert.equal(n.player.turbo, false);
});

test('al limpiar una sala con corazón especial, sale en el centro', () => {
  for (const [reward, kind] of [['turbo', 'turbo'], ['surge', 'sobretension']] as const) {
    let done = false;
    for (let i = 0; i < 200 && !done; i++) {
      const w = createWorld({ seed: `especiales${i}`, floor: true });
      w.noDamage = true;
      const at = w.floor!.rooms.findIndex((r) => r.reward === reward);
      if (at < 0) continue;
      const fr = w.floor!.layout.rooms[at]!;
      enterRoom(w, fr.id, fr.doors[0]!.dir);
      for (const en of w.enemies) en.damageTaken = en.def.hp;
      for (let t = 0; t < ticks(4) && w.doorsShut; t++) step(w, NO_INPUT);
      assert.ok(w.pickups.some((k) => k.kind === kind), `${kind} en el suelo`);
      done = true;
    }
    assert.ok(done, `ninguna planta tiene ${reward}`);
  }
});

test('es determinista y tiene sus sprites (en el suelo y en el marcador)', () => {
  const run = (): string => {
    const w = bare('especiales-hash');
    w.player.surge = 1;
    w.player.turbo = true;
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return worldHash(w);
  };
  assert.equal(run(), run());
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  for (const h of Object.values(SPECIAL_HEARTS)) assert.ok(keys.has(h.sprite) && keys.has(h.hud), h.id);
});
