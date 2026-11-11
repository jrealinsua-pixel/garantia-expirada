import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Bot, BOT_REACTION, dodge } from '../src/sim/bot.ts';
import { createWorld, PLAYER_HURT_Y, step, type World } from '../src/sim/world.ts';

const ROW3 = 3 * 24 + 12;

function withBullet(dist: number, age = 1): World {
  const w = createWorld({ seed: 'esquivar', noEnemies: true });
  w.player.x = 200;
  w.player.y = ROW3 + 40;
  w.bullets.push({
    id: w.nextId++,
    owner: 'enemy',
    x: w.player.x - dist,
    y: w.player.y - PLAYER_HURT_Y,
    vx: 130,
    vy: 0,
    r: 2.5,
    life: 6,
    damage: 1,
    knockback: 0,
    color: 'red',
    age,
    dir: 0,
    speed: 130,
    h: 0,
  });
  return w;
}

test('el bot se aparta de lado de una bala que viene hacia él', () => {
  const d = dodge(withBullet(40));
  assert.ok(d.urgency > 0.3, `urgencia ${d.urgency}`);
  assert.ok(Math.abs(d.y) > Math.abs(d.x) * 2, 'se mueve en perpendicular');
  assert.equal(d.roll, false, 'con tiempo de sobra no rueda');
});

test('el bot rueda si la bala está a punto de darle', () => {
  const d = dodge(withBullet(18));
  assert.ok(d.roll);
  assert.ok(Math.abs(d.rollY) > 0.9, 'rueda de lado');
});

test('el bot no ve una bala recién disparada (tiempo de reacción)', () => {
  const d = dodge(withBullet(60, BOT_REACTION / 2));
  assert.equal(d.urgency, 0);
});

test('esquivando recibe muchos menos golpes que sin esquivar', () => {
  const play = (dodges: boolean): number => {
    let hurts = 0;
    for (let i = 0; i < 30; i++) {
      const w = createWorld({ seed: `prueba-${i}` });
      const bot = new Bot(`prueba-${i}`, { dodge: dodges });
      for (let t = 0; t < 30 * 60 && !w.over; t++) {
        step(w, bot.think(w));
        hurts += w.events.filter((e) => e.type === 'hurt').length;
      }
    }
    return hurts;
  };
  const without = play(false);
  const withDodge = play(true);
  assert.ok(withDodge * 2 < without, `con esquiva ${withDodge}, sin esquiva ${without}`);
});

test('en una sala suelta, el bot que caza va a por los enemigos y limpia más salas que el que pasea', async () => {
  const { templatesOf, slotEnemiesOf } = await import('../src/data/rooms.ts');
  const { fillTemplate } = await import('../src/sim/room.ts');
  const { Rng } = await import('../src/sim/rng.ts');
  const { DT } = await import('../src/sim/world.ts');
  const play = (hunt: boolean): number => {
    let cleared = 0;
    for (const t of templatesOf('combat', 5).slice(0, 6)) {
      for (let i = 0; i < 3; i++) {
        const seed = `caza:${t.id}:${i}`;
        const tpl = fillTemplate(t, new Rng(seed), { depth: 6, pool: slotEnemiesOf(5) });
        const w = createWorld({ seed, template: tpl, level: 5 });
        const bot = new Bot(seed, { hunt });
        for (let n = 0; n < 60 / DT && w.enemies.length > 0; n++) {
          step(w, bot.think(w));
          w.player.hp = w.player.def.maxHp;
        }
        if (w.enemies.length === 0) cleared++;
      }
    }
    return cleared;
  };
  const wander = play(false);
  const hunt = play(true);
  assert.ok(hunt > wander + 3, `cazando ${hunt} de 18, paseando ${wander}`);
});
