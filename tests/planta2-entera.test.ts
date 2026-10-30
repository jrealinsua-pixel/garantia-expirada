// The whole of floor 2 with the bot (M8): what the bot found when it first played floor 2 from
// end to end, so it does not come back (see also planta2-dificultad.test.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { templatesOf } from '../src/data/rooms.ts';
import type { LaggerBrain } from '../src/data/types.ts';
import { lagSpot } from '../src/sim/enemies.ts';
import { TILE } from '../src/sim/room.ts';
import { Bot } from '../src/sim/bot.ts';
import { createWorld, dropTicket, DT, giveActive, isClear, placeChest, spawnEnemy, step } from '../src/sim/world.ts';
import { ACTIVE_ITEMS } from '../src/data/items.ts';

test('el ticket y el cofre de una sala limpia nunca caen dentro del bloque del medio (Zona de Autoimpresión)', () => {
  for (const level of [1, 2]) {
    for (const t of templatesOf('combat', level)) {
      const w = createWorld({ seed: `premio-${t.id}`, template: t, noEnemies: true, level });
      // Out of the way, in a corner.
      w.player.x = TILE * 1.5;
      w.player.y = w.room.h - TILE * 1.5;
      const mx = w.room.w / 2;
      const my = (w.room.h + 2 * TILE) / 2;
      dropTicket(w, mx, my);
      const k = w.pickups.at(-1)!;
      assert.ok(isClear(w, k.x, k.y, 4), `${t.id}: ticket en ${k.x},${k.y}, dentro de algo`);
      const c = placeChest(w, mx, my);
      w.room.props.pop();
      assert.ok(isClear(w, c.x, c.y - 4, 4), `${t.id}: cofre en ${c.x},${c.y}, dentro de algo`);
    }
  }
});

test('el ratón sin pilas, con un bloque de estanterías delante, ni aparece dentro ni salta al otro lado más lejos de lo suyo', () => {
  const def = ENEMIES['raton-inalambrico']!;
  const w = createWorld({ seed: 'raton-pared', noEnemies: true, level: 2 });
  w.room.props = [];
  const en = spawnEnemy(w.nextId++, def, 100, 200);
  w.enemies = [en];
  w.player.x = 420;
  w.player.y = 200;
  // A huge block of shelves between it and the toaster, covering where it would turn up.
  const box = { x: 130, y: 60, w: 160, h: 300 };
  w.room.props.push({ def: { id: 'bloque', box: { x: 0, y: 0, w: 0, h: 0 } } as never, x: box.x, y: box.y, box });
  const spot = lagSpot(w, en, def.brain as LaggerBrain);
  assert.ok(isClear(w, spot.x, spot.y, def.footRadius), `aparece en ${spot.x},${spot.y}`);
  const b = def.brain as LaggerBrain;
  assert.ok(Math.hypot(spot.x - en.x, spot.y - en.y) <= b.jump * 1.25, `salta ${Math.hypot(spot.x - en.x, spot.y - en.y).toFixed(0)} px, más de lo suyo`);
});

test('el bot con un objeto activo no se queda para siempre encima del que acaba de soltar', () => {
  const ids = Object.keys(ACTIVE_ITEMS);
  const w = createWorld({ seed: 'activo-suelto', room: 'tesoro-informatica', noEnemies: true, level: 2 });
  w.room.props = [];
  giveActive(w, ids[0]!);
  giveActive(w, ids[1]!);
  const k = w.pickups.at(-1)!;
  assert.equal(k.kind, 'activo');
  assert.ok(k.stepOff, 'el que llevaba queda en el suelo, esperando a que se aparte');
  const bot = new Bot('activo-suelto');
  let far = 0;
  for (let i = 0; i < Math.round(8 / DT); i++) {
    step(w, bot.think(w));
    far = Math.max(far, Math.hypot(w.player.x - k.x, w.player.y - k.y));
  }
  assert.ok(far > 60, `no se aparta: como mucho a ${far.toFixed(0)} px`);
});

