import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bot } from '../src/sim/bot.ts';
import { OPPOSITE } from '../src/sim/floor.ts';
import { isWallAt, TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, enterRoom, entrySpot, isClear, leavingThrough, NO_INPUT, step, type Input, type World } from '../src/sim/world.ts';

/** Walks the player straight into the door on wall `dir` of the room it is in. */
function walkOut(w: World, dir: 'N' | 'S' | 'E' | 'W', maxTicks = 240): boolean {
  const d = w.room.doors.find((x) => x.dir === dir)!;
  const from = w.floor!.current;
  w.player.x = d.x + d.w / 2;
  w.player.y = dir === 'N' ? d.y + d.h + 6 : dir === 'S' ? d.y - 6 : d.y + d.h / 2 + 4;
  if (dir === 'E') w.player.x = d.x - 8;
  if (dir === 'W') w.player.x = d.x + d.w + 8;
  const input: Input = { ...NO_INPUT, moveX: dir === 'E' ? 1 : dir === 'W' ? -1 : 0, moveY: dir === 'S' ? 1 : dir === 'N' ? -1 : 0 };
  for (let i = 0; i < maxTicks; i++) {
    step(w, input);
    if (w.floor!.current !== from) return true;
  }
  return false;
}

test('planta: se empieza en la entrada, sin enemigos y con las puertas abiertas', () => {
  const w = createWorld({ seed: 'transicion', floor: true });
  const f = w.floor!;
  assert.equal(f.current, f.layout.start);
  assert.equal(w.room.kind, 'start');
  assert.equal(w.enemies.length, 0);
  assert.equal(w.doorsShut, false);
  assert.deepEqual(w.room.doors.map((d) => d.dir).sort(), f.layout.rooms[f.current]!.doors.filter((d) => !d.secret).map((d) => d.dir).sort());
  for (const d of w.room.doors) assert.equal(isWallAt(w.room, d.x + d.w / 2, d.y + d.h / 2), false, `la puerta ${d.dir} se puede cruzar`);
  assert.equal(f.rooms[f.current]!.visited, true);
  assert.equal(f.rooms.filter((r) => r.visited).length, 1);
});

test('planta: cruzar una puerta abierta lleva a la sala vecina, delante de la puerta contraria', () => {
  const w = createWorld({ seed: 'transicion', floor: true });
  const f = w.floor!;
  const start = f.current;
  for (const door of f.layout.rooms[start]!.doors.filter((d) => !d.secret)) {
    enterRoom(w, start, 'S'); // back to the entrance (it has no enemies)
    w.events = [];
    assert.ok(walkOut(w, door.dir), `sale por ${door.dir}`);
    assert.equal(f.current, door.to);
    assert.ok(w.events.some((e) => e.type === 'room' && e.id === door.to && e.via === OPPOSITE[door.dir]));
    const at = entrySpot(w.room, OPPOSITE[door.dir]);
    assert.ok(Math.hypot(w.player.x - at.x, w.player.y - at.y) < 4, 'aparece junto a la puerta por la que entra');
    assert.equal(leavingThrough(w), null, 'no vuelve a salir sin querer');
    assert.equal(w.bullets.length, 0);
    assert.deepEqual(checkInvariants(w), []);
  }
});

test('planta: una sala de combate cierra al entrar, abre al vaciarla y se queda vacía al volver', () => {
  const w = createWorld({ seed: 'transicion', floor: true });
  const f = w.floor!;
  const combat = f.layout.rooms.find((r) => r.kind === 'combat' && r.doors.some((d) => !d.secret))!;
  const door = combat.doors.find((d) => !d.secret)!;
  enterRoom(w, combat.id, door.dir);
  assert.ok(w.enemies.length > 0);
  assert.equal(w.doorsShut, true);
  assert.equal(leavingThrough(w), null);
  const d = w.room.doors.find((x) => x.dir === door.dir)!;
  assert.equal(isWallAt(w.room, d.x + d.w / 2, d.y + d.h / 2), true, 'la persiana cerrada es pared');
  assert.equal(walkOut(w, door.dir, 90), false, 'con las persianas bajadas no se sale');
  for (const en of w.enemies) en.damageTaken = en.def.hp;
  for (let i = 0; i < 3; i++) step(w, NO_INPUT);
  assert.equal(w.doorsShut, false);
  assert.equal(f.rooms[combat.id]!.cleared, true);
  // Coupons left on the floor stay there.
  const left = w.pickups.length;
  assert.ok(left > 0, 'han caído cupones');
  for (const k of w.pickups) k.age = 0;
  w.player.x = d.x + d.w / 2;
  assert.ok(walkOut(w, door.dir));
  assert.equal(w.pickups.length, 0, 'los cupones no viajan con la tostadora');
  enterRoom(w, combat.id, door.dir);
  assert.equal(w.enemies.length, 0, 'los enemigos no vuelven');
  assert.equal(w.doorsShut, false);
  assert.equal(w.pickups.length, left, 'los cupones siguen donde estaban');
});

test('planta: la misma semilla da las mismas salas', () => {
  const ids = (seed: string): string[] => createWorld({ seed, floor: true }).floor!.rooms.map((r) => r.template.rows.join('/'));
  assert.deepEqual(ids('igual'), ids('igual'));
  assert.notDeepEqual(ids('igual'), ids('distinta'));
});

test('planta: en 300 plantas, cada puerta normal tiene suelo libre delante para entrar', () => {
  for (let i = 0; i < 300; i++) {
    const w = createWorld({ seed: `entradas-${i}`, floor: true });
    const f = w.floor!;
    const combat = f.layout.rooms.filter((r) => r.kind === 'combat').map((r) => f.rooms[r.id]!.template.id);
    assert.ok(new Set(combat).size >= Math.min(combat.length, 10), 'las salas de combate no se repiten enseguida');
    for (const fr of f.layout.rooms) {
      for (const door of fr.doors) {
        if (door.secret) continue;
        enterRoom(w, door.to, OPPOSITE[door.dir]);
        assert.ok(isClear(w, w.player.x, w.player.y, w.player.def.footRadius), `${w.room.id}: entrada ${OPPOSITE[door.dir]} libre`);
        assert.equal(leavingThrough(w), null);
        for (const en of w.enemies) assert.ok(Math.hypot(en.x - w.player.x, en.y - w.player.y) > TILE * 2.5, `${w.room.id}: ningún enemigo en la puerta`);
      }
    }
  }
});

test('planta: el bot recorre la planta entera sin atascarse', () => {
  for (const seed of ['recorrido-1', 'recorrido-2', 'recorrido-3']) {
    const w = createWorld({ seed, floor: true });
    w.noDamage = true;
    const bot = new Bot(seed);
    const max = Math.round(400 / DT);
    for (let t = 0; t < max && !Bot.explored(w); t++) {
      step(w, bot.think(w));
      if (t % 60 === 0) assert.deepEqual(checkInvariants(w), [], `${seed} tick ${t}`);
    }
    assert.ok(Bot.explored(w), `${seed}: ha visitado ${w.floor!.rooms.filter((r) => r.visited).length} salas`);
  }
});

test('planta: la sala de la jefa la tiene dentro, cierra al entrar y no se da por limpia', () => {
  // Until 2026-10-29 the boss room was born «cleared» and the floor's boss never showed up.
  for (let s = 0; s < 20; s++) {
    const w = createWorld({ seed: `jefa-en-planta-${s}`, floor: true });
    const f = w.floor!;
    const boss = f.layout.boss;
    assert.equal(f.rooms[boss]!.cleared, false, 'la sala de la jefa empieza sin limpiar');
    const door = f.layout.rooms[boss]!.doors.find((d) => !d.secret)!;
    enterRoom(w, boss, door.dir);
    assert.ok(w.enemies.some((en) => en.def.boss), `${s}: no hay jefa en su sala`);
    assert.ok(w.doorsShut, 'las persianas bajan');
    assert.ok(w.intro, 'la jefa hace su entrada');
  }
});

test('planta: el montacargas se queda en su sala al salir y sigue allí al volver', () => {
  const w = createWorld({ seed: 'montacargas-quieto', floor: true });
  const f = w.floor!;
  const boss = f.layout.boss;
  const door = f.layout.rooms[boss]!.doors.find((d) => !d.secret)!;
  enterRoom(w, boss, door.dir);
  w.intro = null;
  w.noDamage = true;
  for (const en of w.enemies) if (en.def.boss) en.damageTaken = en.def.hp;
  for (let t = 0; t < 900 && !w.lift; t++) step(w, NO_INPUT);
  assert.ok(w.lift, 'sale el montacargas al caer la jefa');
  const at = { x: w.lift.x, y: w.lift.y };
  enterRoom(w, door.to, OPPOSITE[door.dir]);
  assert.equal(w.lift, null, 'en la sala vecina no hay montacargas');
  enterRoom(w, boss, door.dir);
  const back = (w as World).lift;
  assert.deepEqual(back && { x: back.x, y: back.y }, at, 'al volver sigue en su sitio');
});
