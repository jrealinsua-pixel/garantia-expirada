// M9b (12a): the Garantía Provisional, a temporary shield with the staying power of one heart.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CLEAR_HEART_CHANCE,
  CLEAR_SHIELD_CHANCE,
  createWorld,
  DT,
  dropHeart,
  enterRoom,
  hurtPlayer,
  NO_INPUT,
  nextFloor,
  SHIELD_MAX,
  SHIELD_VALUE,
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

test('aguanta un corazón de daño antes que la vida, y luego se acaba', () => {
  const w = bare('garantia-golpes');
  const hp = w.player.hp;
  w.player.shield = SHIELD_VALUE;
  assert.ok(hurtPlayer(w, 1, -1, 0, 1));
  assert.equal(w.player.hp, hp, 'la vida no se toca');
  assert.equal(w.player.shield, 1);
  const ev = w.events.find((e) => e.type === 'hurt');
  assert.ok(ev && ev.type === 'hurt' && ev.covered === 1 && ev.shield === 1, 'el golpe dice que lo ha cubierto');
  // A blow bigger than what is left: the rest goes to the life.
  w.player.invulnerable = 0;
  hurtPlayer(w, 2, -1, 0, 1);
  assert.equal(w.player.shield, 0);
  assert.equal(w.player.hp, hp - 1);
  // Without a warranty, everything hurts as always.
  w.player.invulnerable = 0;
  hurtPlayer(w, 1, -1, 0, 1);
  assert.equal(w.player.hp, hp - 2);
});

test('se coge al pisarla, hasta dos a la vez, y no cura la vida', () => {
  const w = bare('garantia-coger');
  w.noDamage = true;
  const hp = (w.player.hp = 2);
  for (let n = 0; n < 3; n++) {
    dropHeart(w, w.player.x, w.player.y, 'garantia');
    for (let i = 0; i < ticks(1.5); i++) step(w, NO_INPUT);
  }
  assert.equal(w.player.shield, SHIELD_MAX, 'dos garantías como mucho');
  assert.equal(SHIELD_MAX, 2 * SHIELD_VALUE);
  assert.equal(w.player.hp, hp);
  assert.equal(w.pickups.filter((k) => k.kind === 'garantia').length, 1, 'la tercera se queda en el suelo');
});

test('caduca al bajar de planta', () => {
  const w = createWorld({ seed: 'garantia-planta', floor: true });
  w.player.shield = SHIELD_MAX;
  w.won = true;
  const n = nextFloor(w)!;
  assert.ok(n);
  assert.equal(n.player.shield, 0);
  assert.equal(n.player.hp, w.player.hp, 'la vida sí se la lleva');
});

test('sale a veces al limpiar una sala: menos que un corazón y nunca a la vez', () => {
  let shields = 0;
  let hearts = 0;
  let free = 0;
  for (let i = 0; i < 80; i++) {
    const f = createWorld({ seed: `garantias${i}`, floor: true }).floor!;
    for (const [id, r] of f.rooms.entries()) {
      if (f.layout.rooms[id]!.kind !== 'combat' || r.reward === 'ticket' || r.reward === 'chest') continue;
      free++;
      if (r.reward === 'shield') shields++;
      if (r.reward === 'heart') hearts++;
    }
  }
  const rate = shields / free;
  assert.ok(rate > CLEAR_SHIELD_CHANCE * 0.5 && rate < CLEAR_SHIELD_CHANCE * 1.6, `garantías al limpiar: ${rate.toFixed(2)}`);
  assert.ok(CLEAR_SHIELD_CHANCE < CLEAR_HEART_CHANCE && shields < hearts);
  // And clearing such a room leaves it in the middle.
  for (let i = 0; i < 80; i++) {
    const w = createWorld({ seed: `garantias${i}`, floor: true });
    w.noDamage = true;
    const at = w.floor!.rooms.findIndex((r) => r.reward === 'shield');
    if (at < 0) continue;
    const fr = w.floor!.layout.rooms[at]!;
    enterRoom(w, fr.id, fr.doors[0]!.dir);
    for (const en of w.enemies) en.damageTaken = en.def.hp;
    for (let t = 0; t < ticks(4) && w.doorsShut; t++) step(w, NO_INPUT);
    assert.ok(w.pickups.some((k) => k.kind === 'garantia' && k.value === SHIELD_VALUE));
    return;
  }
  assert.fail('ninguna planta tiene garantía');
});

test('es determinista y tiene sus sprites (en el suelo y en el marcador)', () => {
  const run = (): string => {
    const w = bare('garantia-hash');
    w.player.shield = 3;
    for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
    return worldHash(w);
  };
  assert.equal(run(), run());
  const keys = new Set(Object.keys(JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as object));
  assert.ok(keys.has('garantia-provisional') && keys.has('garantias-hud'));
});
