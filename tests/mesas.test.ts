// M9b (13b): the bargain tables. Standing, bullets fly over them; tipped over with the interact
// button they stop the bullets that come at their top, let the toaster's go out from behind, wear
// down and break; a drum blowing up next to one breaks it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROPS } from '../src/data/props.ts';
import { INTERACT_VERBS } from '../src/data/texts.ts';
import { buildRoom, fillTemplate, TILE, type PropInstance } from '../src/sim/room.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { Rng } from '../src/sim/rng.ts';
import {
  checkInvariants,
  coversFrom,
  createWorld,
  damageProp,
  DT,
  HAND_HEIGHT,
  interactable,
  NO_INPUT,
  step,
  tipSide,
  worldHash,
  type World,
} from '../src/sim/world.ts';
import { readFileSync } from 'node:fs';

const ticks = (s: number): number => Math.ceil(s / DT);
const TABLE = PROPS.mesa!;
const DRUM = PROPS.barril!;

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

function put(w: World, def: typeof TABLE, x: number, y: number): PropInstance {
  const pr: PropInstance = { def, x, y, box: { x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h } };
  w.room.props.push(pr);
  return pr;
}

/** An enemy bullet at (x, y) flying (vx, vy), its shadow on the floor. */
function enemyBullet(w: World, x: number, y: number, vx: number, vy: number): World['bullets'][number] {
  const speed = Math.hypot(vx, vy);
  const b = { id: w.nextId++, owner: 'enemy', x, y, vx, vy, r: 3.5, life: 3, damage: 1, knockback: 0, color: 'red', age: 0, dir: Math.atan2(vy, vx), speed, h: 0 };
  w.bullets.push(b as World['bullets'][number]);
  return b as World['bullets'][number];
}

/** Presses the interact button for one tick, then lets a few go by. */
function press(w: World): void {
  step(w, { ...NO_INPUT, interact: true });
  for (let i = 0; i < 3; i++) step(w, NO_INPUT);
}

test('la mesa está en los datos: de pie no para balas, se vuelca y aguanta unas cuantas', () => {
  assert.equal(TABLE.blocksBullets, false);
  assert.ok(TABLE.tip && TABLE.tip.hp >= 8, 'aguanta una ráfaga, no una sala entera');
  assert.equal(INTERACT_VERBS.tip, 'Volcar');
  const s = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number }>;
  assert.equal(s.mesa?.frames, 5, 'de pie y volcada hacia cada lado');
  assert.equal(s['mesa-2']?.frames, 5, 'y con el aspecto de la planta 2');
});

test('de pie, las balas pasan por encima', () => {
  const w = bare('mesa-de-pie');
  const t = put(w, TABLE, 300, 250);
  const b = enemyBullet(w, 300, 200, 0, 140);
  for (let i = 0; i < ticks(0.8); i++) step(w, NO_INPUT);
  assert.ok(b.y > t.y + 20, 'la bala sigue de largo');
  assert.equal(t.damage, undefined);
});

test('el botón de interactuar la vuelca lejos de la tostadora, y solo una vez', () => {
  const w = bare('mesa-volcar');
  const t = put(w, TABLE, 240, 250);
  // Below it (south), right next to it: the button says «Volcar».
  w.player.x = 240;
  w.player.y = t.box.y + t.box.h + 6;
  assert.equal(interactable(w)?.kind, 'tip');
  press(w);
  assert.equal(t.tipped, 'N', 'empujada desde el sur, la tapa mira al norte');
  assert.notEqual(interactable(w)?.kind, 'tip', 'una mesa volcada no se vuelve a volcar');
  // From the other sides.
  const sides: Array<[number, number, string]> = [[0, -1, 'S'], [-1, 0, 'E'], [1, 0, 'W']];
  for (const [dx, dy, want] of sides) {
    const p = { x: 240 + dx * 20, y: 243 + dy * 14 };
    assert.equal(tipSide(t, p.x, p.y), want);
  }
  // Too far away: nothing.
  const v = bare('mesa-lejos');
  put(v, TABLE, 240, 250);
  v.player.x = 240;
  v.player.y = 300;
  assert.equal(interactable(v), null);
});

test('volcada, para las balas que vienen hacia su tapa y deja pasar las que se alejan', () => {
  assert.ok(coversFrom('N', 0, 100), 'mira al norte: para lo que baja');
  assert.ok(!coversFrom('N', 0, -100), 'y deja salir lo que sube');
  assert.ok(coversFrom('E', -100, 20) && !coversFrom('E', 100, 0));
  const w = bare('mesa-cubre');
  const t = put(w, TABLE, 300, 250);
  t.tipped = 'N';
  // An enemy bullet coming down at it stops on it and wears it.
  const down = enemyBullet(w, 300, 200, 0, 140);
  for (let i = 0; i < ticks(0.8); i++) step(w, NO_INPUT);
  assert.ok(!w.bullets.includes(down), 'parada');
  assert.equal(t.damage, 1);
  // One going away (north, as if fired by the toaster behind it) goes through.
  const up = enemyBullet(w, 300, 255, 0, -140);
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  assert.ok(w.bullets.includes(up) && up.y < t.box.y - 10, 'sale por encima de la tapa');
  assert.equal(t.damage, 1);
});

test('la tostadora detrás de la mesa dispara por encima de ella', () => {
  const w = bare('mesa-disparo');
  w.noDamage = true;
  const t = put(w, TABLE, 240, 250);
  w.player.x = 240;
  w.player.y = t.box.y + t.box.h + 8;
  press(w);
  assert.equal(t.tipped, 'N');
  let walls = 0;
  for (let i = 0; i < ticks(1.5); i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: 240, aimY: 100 });
    walls += w.events.filter((e) => e.type === 'bulletWall' && e.y > t.box.y - 4).length;
  }
  assert.equal(walls, 0, 'ninguna bala se queda en la mesa');
  assert.equal(t.damage, undefined);
});

test('se gasta: tras las balas que aguanta, se rompe y desaparece', () => {
  const w = bare('mesa-rota');
  const t = put(w, TABLE, 300, 250);
  // Facing east: it covers from what comes from the east.
  t.tipped = 'E';
  let broke = false;
  for (let n = 0; n < TABLE.tip!.hp; n++) {
    enemyBullet(w, 360, 243, -160, 0);
    for (let i = 0; i < ticks(0.5); i++) {
      step(w, NO_INPUT);
      broke ||= w.events.some((e) => e.type === 'tableBroke');
    }
  }
  assert.ok(broke && !w.room.props.includes(t), `rota tras ${TABLE.tip!.hp} balas`);
  // The next one flies on.
  const b = enemyBullet(w, 360, 243, -160, 0);
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  assert.ok(b.x < t.box.x, 'sin mesa, la bala pasa');
  assert.deepEqual(checkInvariants(w), []);
});

test('un bidón que explota al lado la hace astillas, esté de pie o volcada', () => {
  const w = bare('mesa-bidon');
  w.noDamage = true;
  const d = put(w, DRUM, 240, 250);
  const a = put(w, TABLE, 240 + TILE, 250);
  const b = put(w, TABLE, 240 - TILE, 250);
  b.tipped = 'W';
  const far = put(w, TABLE, 240, 250 + 5 * TILE);
  damageProp(w, d, DRUM.hp!);
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(!w.room.props.includes(a) && !w.room.props.includes(b));
  assert.ok(w.room.props.includes(far));
});

test('sale en los huecos de obstáculo de las salas, y nunca dentro de una pared', () => {
  let tables = 0;
  const withSlots = Object.values(ROOMS).filter((t) => t.rows.some((r) => r.includes('o')));
  assert.ok(withSlots.length > 0);
  for (let i = 0; i < 10; i++) {
    for (const t of withSlots) {
      // Without enemies: only the obstacles matter here.
      const bare = { ...t, rows: t.rows.map((r) => r.replaceAll('e', '.').replace(/[JN X]/g, (c) => (c === ' ' ? c : '.'))) };
      const room = buildRoom(fillTemplate(bare, new Rng(`mesas-${i}`), { depth: 1, pool: [] }));
      for (const p of room.props.filter((pr) => pr.def.id === 'mesa')) {
        tables++;
        const c = Math.floor(p.x / TILE);
        const r = Math.floor((p.y - 1) / TILE);
        assert.equal(room.tiles[r * room.cols + c], 0, `${t.id}: la mesa de ${c},${r} no está en una pared`);
      }
    }
  }
  assert.ok(tables > 0, `alguna mesa (${tables})`);
});

test('es determinista', () => {
  const run = (): string => {
    const w = bare('mesa-hash');
    const t = put(w, TABLE, 240, 250);
    w.player.x = 240;
    w.player.y = t.box.y + t.box.h + 6;
    press(w);
    for (let i = 0; i < 8; i++) enemyBullet(w, 200 + i * 10, 150, 0, 150);
    for (let i = 0; i < ticks(2); i++) step(w, { ...NO_INPUT, fire: true, aimX: 240, aimY: 140 - HAND_HEIGHT });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
