// M14b (h11a1): the Regleta Sobrecargada. While there is a fight it crackles and zaps whatever is
// near (enemies too); rolling, the toaster is off the floor; shot, it shorts out and is gone. It
// turns up in some empty obstacle slots, drawn with a generator of its own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS, REGLETA_CHANCE, REGLETA_MAX } from '../src/data/props.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { slotEnemiesOf, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate, TILE, type PropInstance } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import {
  createWorld,
  damageProp,
  isRolling,
  DT,
  NO_INPUT,
  spawnEnemy,
  step,
  worldHash,
  zapCentre,
  zapPhase,
  type World,
} from '../src/sim/world.ts';

const STRIP = PROPS.regleta!;
const ZAP = STRIP.zap!;
const ticks = (s: number): number => Math.ceil(s / DT);

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.pickups = [];
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 300;
  w.player.y = 300;
  w.noDamage = false;
  return w;
}

function strip(w: World, x: number, y: number): PropInstance {
  const pr: PropInstance = { def: STRIP, x, y, box: { x: x + STRIP.box.x, y: y + STRIP.box.y, w: STRIP.box.w, h: STRIP.box.h } };
  w.room.props.push(pr);
  return pr;
}

function idle(w: World, id: string, x: number, y: number): ReturnType<typeof spawnEnemy> {
  const en = spawnEnemy(w.nextId++, ENEMIES[id]!, x, y);
  en.state = 'idle';
  en.until = 999;
  w.enemies.push(en);
  return en;
}

/** Steps until the strip zaps (at most `max` s); the zap event, or null. */
function untilZap(w: World, max = 6): Extract<World['events'][number], { type: 'zap' }> | null {
  for (let i = 0; i < ticks(max); i++) {
    step(w, NO_INPUT);
    const z = w.events.find((e) => e.type === 'zap');
    if (z && z.type === 'zap') return z;
  }
  return null;
}

test('la regleta está en los datos: baja, se rompe, da descargas; con su dibujo y su causa de baja', () => {
  assert.ok(STRIP.low && STRIP.blocksBullets, 'se salta rodando y se le puede disparar');
  assert.ok(STRIP.hp && STRIP.hp <= 4, 'aguanta pocos disparos');
  assert.ok(STRIP.blast && STRIP.blast.hurt <= 1, 'el cortocircuito quita medio corazón, no uno');
  assert.ok(ZAP.warn >= 0.8, 'el aviso da tiempo a apartarse');
  assert.ok(ZAP.radius >= TILE && ZAP.radius <= 2 * TILE);
  assert.ok(DOWN_CAUSES.regleta?.contact);
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number; frameW: number }> | Array<{ key: string }>;
  assert.ok(JSON.stringify(sheets).includes('"regleta"'), 'tiene sprite');
  for (const level of [1, 2, 3, 4, 5, 6]) assert.ok((REGLETA_CHANCE[level] ?? 0) > 0 && REGLETA_CHANCE[level]! < 0.5);
});

test('avisa antes, y la descarga daña a los enemigos de alrededor y no a los lejanos', () => {
  const w = bare('regleta-1');
  const pr = strip(w, 200, 200);
  const c = zapCentre(pr);
  const near = idle(w, 'microondas', c.x + 20, c.y + 6);
  const far = idle(w, 'microondas', c.x + 120, c.y);
  let warned = -1;
  let zap: ReturnType<typeof untilZap> = null;
  for (let i = 0; i < ticks(6) && !zap; i++) {
    // Pinned where they are (the microwave orbits the toaster on its own since M14b (h9a)).
    near.x = c.x + 20;
    near.y = c.y + 6;
    far.x = c.x + 120;
    far.y = c.y;
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'zapWarn')) warned = i;
    const z = w.events.find((e) => e.type === 'zap');
    if (z?.type === 'zap') {
      zap = z;
      assert.ok(warned >= 0, 'avisó antes');
      assert.ok((i - warned) * DT >= ZAP.warn - 2 * DT, `el aviso dura ${ZAP.warn} s`);
    }
  }
  assert.ok(zap, 'da una descarga');
  assert.equal(zap.targets.length, 1);
  assert.ok(near.damageTaken > 0, 'el de al lado se lleva la descarga');
  assert.equal(far.damageTaken, 0, 'el lejano, no');
  assert.equal(zap.player, false);
});

test('la tostadora cerca recibe medio corazón; rodando no le llega', () => {
  const w = bare('regleta-2');
  const pr = strip(w, 200, 200);
  w.player.x = pr.x + 16;
  w.player.y = pr.y + 14;
  const hp = w.player.hp;
  const z = untilZap(w);
  assert.ok(z?.player, 'le da');
  assert.equal(w.player.hp, hp - ZAP.hurt);

  const w2 = bare('regleta-2');
  const pr2 = strip(w2, 200, 200);
  w2.player.x = pr2.x + 16;
  w2.player.y = pr2.y + 14;
  // Run up to just before the zap, then roll through it.
  pr2.zapT = ZAP.every - 0.06;
  w2.player.invulnerable = 0;
  step(w2, { ...NO_INPUT, moveX: 1, moveY: 0, roll: true });
  let zapped = false;
  for (let i = 0; i < ticks(0.3) && !zapped; i++) {
    step(w2, NO_INPUT);
    const z = w2.events.find((e) => e.type === 'zap');
    if (z?.type !== 'zap') continue;
    zapped = true;
    assert.ok(isRolling(w2.player), 'rodaba cuando saltó la descarga');
    assert.ok(Math.hypot(w2.player.x - z.cx, w2.player.y - z.cy) < ZAP.radius, 'y estaba a su alcance');
    assert.equal(z.player, false, 'rodando está en el aire');
  }
  assert.ok(zapped);
  assert.equal(w2.player.hp, hp);
});

test('con la sala tranquila no da descargas, y un aviso a medias se cancela', () => {
  const w = bare('regleta-3');
  const pr = strip(w, 200, 200);
  w.doorsShut = false;
  pr.zapT = ZAP.every - 0.5;
  for (let i = 0; i < ticks(10); i++) {
    step(w, NO_INPUT);
    assert.ok(!w.events.some((e) => e.type === 'zap' || e.type === 'zapWarn'));
  }
  assert.ok((pr.zapT ?? 0) <= ZAP.every - ZAP.warn, 'el aviso se apagó');
});

test('a tiros hace cortocircuito: una última descarga y se va', () => {
  const w = bare('regleta-4');
  const pr = strip(w, 200, 200);
  const c = zapCentre(pr);
  const en = idle(w, 'microondas', c.x + 30, c.y);
  damageProp(w, pr, STRIP.hp!);
  let blast = false;
  for (let i = 0; i < ticks(1); i++) {
    step(w, NO_INPUT);
    if (w.events.some((e) => e.type === 'blast' && e.prop === 'regleta')) blast = true;
  }
  assert.ok(blast);
  assert.ok(!w.room.props.includes(pr), 'ya no está');
  assert.ok(en.damageTaken > 0);
});

test('dos regletas no se descargan a la vez si están en sitios distintos, y la primera tarda al menos un segundo', () => {
  const a = { def: STRIP, x: 108, y: 166 } as PropInstance;
  const b = { def: STRIP, x: 252, y: 190 } as PropInstance;
  assert.notEqual(zapPhase(a, ZAP), zapPhase(b, ZAP));
  for (const p of [a, b]) assert.ok(ZAP.every - ZAP.warn - zapPhase(p, ZAP) >= 1 - 1e-9);
});

test('el relleno pone regletas solo en huecos de obstáculo vacíos, como mucho dos, y no mueve nada más', () => {
  const combat = [1, 2, 3, 4, 5, 6].flatMap((l) => templatesOf('combat', l)).filter((t) => t.rows.join('').includes('o'));
  assert.ok(combat.length > 5);
  let placed = 0;
  for (const t of combat) {
    for (let s = 0; s < 4; s++) {
      const opts = { depth: 3, pool: slotEnemiesOf(1), vary: true };
      const plain = fillTemplate(t, new Rng(`r${s}${t.id}`), opts);
      const lit = fillTemplate(t, new Rng(`r${s}${t.id}`), { ...opts, hazard: { rng: new Rng(`h${s}`), chance: 1 } });
      let n = 0;
      plain.rows.forEach((row, r) => [...row].forEach((ch, c) => {
        const other = lit.rows[r]![c];
        if (other === ch) return;
        assert.equal(ch, '.', `${t.id}: solo cambia un hueco vacío`);
        assert.equal(other, 'r');
        n++;
      }));
      assert.ok(n <= REGLETA_MAX);
      placed += n;
    }
  }
  assert.ok(placed > 0, 'alguna sale');
});

test('en una partida salen de vez en cuando, y la misma semilla da lo mismo', () => {
  let rooms = 0;
  let strips = 0;
  for (let s = 0; s < 6; s++) {
    for (const level of [1, 2]) {
      const w = createWorld({ seed: `regletas-${s}`, floor: true, level });
      const again = createWorld({ seed: `regletas-${s}`, floor: true, level });
      assert.equal(worldHash(w), worldHash(again));
      for (const fr of w.floor!.rooms) {
        if (fr.template.kind !== 'combat') continue;
        rooms++;
        strips += [...fr.template.rows.join('')].filter((ch) => ch === 'r').length;
        assert.deepEqual(fr.template.rows, again.floor!.rooms[w.floor!.rooms.indexOf(fr)]!.template.rows);
      }
    }
  }
  assert.ok(strips > 0, 'salen');
  assert.ok(strips < rooms / 2, `pocas: ${strips} en ${rooms} salas`);
});
