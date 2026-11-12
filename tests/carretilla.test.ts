// M12 (3c): la Carretilla Elevadora, propia del taller. Embiste con las horquillas como el
// aspirador, pero pesa: avisa con la rotativa, apenas retrocede con las balas y, si se estrella,
// se queda aturdida con las horquillas dobladas. Solo en el Servicio Técnico, y sin reacondicionar.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { slotEnemiesOf } from '../src/data/rooms.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { textWidth } from '../src/art/font.ts';
import { createWorld, DT, NO_INPUT, SERVICE_LEVEL, spawnEnemy, step } from '../src/sim/world.ts';
import { FORK_FRAMES, FORK_H, FORK_W, makeCarretillaFrames } from '../tools/sprites/taller.ts';

const def = ENEMIES.carretilla!;

test('la carretilla es contenido: datos, ocho fotogramas, causa de baja y solo en la planta 6', () => {
  assert.equal(def.brain.kind, 'charger');
  assert.ok(def.workshop, 'no se reacondiciona: es del taller');
  assert.ok(def.knockbackScale < ENEMIES.aspirador!.knockbackScale, 'pesa más que el aspirador');
  const frames = makeCarretillaFrames();
  assert.equal(frames.length, FORK_FRAMES.length);
  for (const f of frames) assert.deepEqual([f.w, f.h], [FORK_W, FORK_H]);
  assert.equal(FORK_FRAMES[def.anim!.warn!], 'aviso');
  assert.equal(FORK_FRAMES[def.anim!.stun!], 'aturdida');
  assert.ok(DOWN_CAUSES.carretilla?.contact);
  assert.ok(textWidth(def.name) > 0);
  for (let l = 1; l <= 5; l++) assert.ok(!slotEnemiesOf(l).some((e) => e.ch === 'Í'), `planta ${l}`);
  assert.equal(slotEnemiesOf(SERVICE_LEVEL).find((e) => e.ch === 'Í')?.max, 2);
});

test('avisa, embiste en línea recta y, contra la pared, se queda aturdida', () => {
  const w = createWorld({ seed: 'carretilla', room: 'cinta-clasificacion', level: SERVICE_LEVEL, noEnemies: true });
  w.intro = null;
  w.noDamage = true;
  w.conveyors = [];
  const en = spawnEnemy(w.nextId++, def, 200, 180);
  w.enemies.push(en);
  w.player.x = 340;
  w.player.y = 180;
  const seen = new Set<string>();
  let charged: { x: number; y: number } | null = null;
  for (let i = 0; i < Math.ceil(6 / DT) && !seen.has('stun'); i++) {
    step(w, NO_INPUT);
    seen.add(en.state);
    if (en.state === 'charge' && !charged) {
      charged = { x: en.dirX, y: en.dirY };
      // Out of the way: it carries on into the wall.
      w.player.y = 60;
    }
  }
  assert.ok(seen.has('warn') && seen.has('charge'), [...seen].join(','));
  assert.ok(charged && charged.x > 0.9, 'hacia donde estaba la tostadora');
  assert.ok(seen.has('stun'), 'se estrella contra la pared');
});
