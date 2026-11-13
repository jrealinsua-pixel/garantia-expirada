// M14b (h11a3): puddles. A Garrafa de agua bursts (shot, or by a blast next to it) into a puddle
// that stays in the room; a Regleta's zap that gets into the water reaches everything with its feet
// in it (and in any puddle touching it). Garrafas turn up in some empty obstacle slots, more often
// in a room with a Regleta, drawn with a generator of their own.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS, SPILL_CHANCE, SPILL_MAX } from '../src/data/props.ts';
import { slotEnemiesOf, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate, inPuddle, type PropInstance } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { createWorld, damageProp, DT, NO_INPUT, spawnEnemy, step, wetPuddles, worldHash, zapCentre, type World } from '../src/sim/world.ts';

const JUG = PROPS.garrafa!;
const STRIP = PROPS.regleta!;
const ZAP = STRIP.zap!;
const ticks = (s: number): number => Math.ceil(s / DT);

function bare(seed: string): World {
  const w = createWorld({ seed, noEnemies: true });
  w.room.props = [];
  w.room.puddles = [];
  w.pickups = [];
  for (const d of w.dummies) {
    d.x = 30;
    d.y = 360;
  }
  w.player.x = 330;
  w.player.y = 330;
  w.noDamage = false;
  return w;
}

function put(w: World, def: typeof JUG, x: number, y: number): PropInstance {
  const pr: PropInstance = { def, x, y, box: { x: x + def.box.x, y: y + def.box.y, w: def.box.w, h: def.box.h } };
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

test('la garrafa está en los datos: baja, para balas, se rompe en dos y deja un charco; con dibujo', () => {
  assert.ok(JUG.low && JUG.blocksBullets && !JUG.blast);
  assert.equal(JUG.hp, 2);
  assert.ok(JUG.spill && JUG.spill.rx > ZAP.radius / 2, 'el charco es grande');
  const sheets = readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8');
  assert.ok(sheets.includes('"garrafa"'), 'tiene sprite');
  for (const level of [1, 2, 3, 4, 5, 6]) assert.ok((SPILL_CHANCE[level] ?? 0) > 0 && SPILL_CHANCE[level]! < 0.5);
});

test('a tiros revienta: se va y deja un charco donde estaba, que se queda en la sala', () => {
  const w = bare('charco-1');
  const jug = put(w, JUG, 200, 214);
  damageProp(w, jug, 1);
  assert.ok(w.room.props.includes(jug), 'aguanta uno');
  damageProp(w, jug, 1);
  assert.ok(!w.room.props.includes(jug), 'con dos, revienta');
  assert.equal(w.room.puddles?.length, 1);
  const p = w.room.puddles![0]!;
  assert.ok(inPuddle(w.room, p, 200, 210) && !inPuddle(w.room, p, 200 + JUG.spill!.rx + 4, 210));
  for (let i = 0; i < ticks(5); i++) step(w, NO_INPUT);
  assert.equal(w.room.puddles?.length, 1, 'el agua no se va');
});

test('un bidón que explota al lado la revienta (y no explota ella)', () => {
  const w = bare('charco-2');
  const jug = put(w, JUG, 200, 214);
  const drum = PROPS.barril!;
  w.room.props.push({ def: drum, x: 230, y: 214, box: { x: 230 + drum.box.x, y: 214 + drum.box.y, w: drum.box.w, h: drum.box.h }, damage: drum.hp, fuse: 0.05 });
  for (let i = 0; i < ticks(0.4); i++) step(w, NO_INPUT);
  assert.ok(!w.room.props.includes(jug));
  assert.equal(w.room.puddles?.length, 1, 'un charco, sin explosión propia');
});

test('la descarga de una regleta llega por el agua a lo que está en el charco, lejos de su alcance', () => {
  const w = bare('charco-3');
  const strip = put(w, STRIP, 150, 214);
  const c = zapCentre(strip);
  // A puddle starting at the edge of its reach and going on well past it.
  w.room.puddles = [{ x: c.x + ZAP.radius + 20, y: c.y + 4, rx: 34, ry: 22 }];
  const wet = idle(w, 'microondas', c.x + ZAP.radius + 40, c.y + 8);
  const dry = idle(w, 'microondas', c.x + ZAP.radius + 40, c.y + 60);
  strip.zapT = ZAP.every - 0.05;
  let zap: Extract<World['events'][number], { type: 'zap' }> | null = null;
  for (let i = 0; i < ticks(0.3) && !zap; i++) {
    for (const [en, y] of [[wet, c.y + 8], [dry, c.y + 60]] as const) {
      en.x = c.x + ZAP.radius + 40;
      en.y = y;
    }
    step(w, NO_INPUT);
    const z = w.events.find((e) => e.type === 'zap');
    if (z?.type === 'zap') zap = z;
  }
  assert.ok(zap);
  assert.equal(zap.puddles.length, 1, 'el charco se enciende');
  assert.ok(wet.damageTaken > 0, 'el del charco se la lleva');
  assert.equal(dry.damageTaken, 0, 'el de fuera, no');
});

test('la tostadora en el charco también; rodando, no', () => {
  for (const roll of [false, true]) {
    const w = bare(`charco-4-${roll}`);
    const strip = put(w, STRIP, 150, 214);
    const c = zapCentre(strip);
    w.room.puddles = [{ x: c.x + ZAP.radius + 20, y: c.y + 4, rx: 34, ry: 22 }];
    w.player.x = c.x + ZAP.radius + 36;
    w.player.y = c.y + 8;
    w.player.invulnerable = 0;
    const hp = w.player.hp;
    strip.zapT = ZAP.every - 0.04;
    if (roll) step(w, { ...NO_INPUT, moveX: 0, moveY: 1, roll: true });
    for (let i = 0; i < ticks(0.2); i++) step(w, NO_INPUT);
    assert.equal(w.player.hp, roll ? hp : hp - ZAP.hurt);
  }
});

test('los charcos que se tocan llevan la corriente de uno a otro; uno suelto, no', () => {
  const w = bare('charco-5');
  w.room.puddles = [
    { x: 200, y: 200, rx: 30, ry: 20 },
    { x: 250, y: 205, rx: 30, ry: 20 },
    { x: 400, y: 200, rx: 30, ry: 20 },
  ];
  assert.deepEqual(wetPuddles(w, 160, 200, 20), [0, 1]);
  assert.deepEqual(wetPuddles(w, 160, 300, 20), []);
});

test('el relleno pone como mucho una garrafa en un hueco vacío, más a menudo con regleta, y en partida igual con la misma semilla', () => {
  const combat = [1, 2, 3, 4, 5, 6].flatMap((l) => templatesOf('combat', l)).filter((t) => t.rows.join('').includes('o'));
  let placed = 0;
  for (const t of combat) {
    for (let s = 0; s < 3; s++) {
      const opts = (): Parameters<typeof fillTemplate>[2] => ({
        depth: 3,
        pool: slotEnemiesOf(1),
        vary: true,
        hazard: { rng: new Rng(`h${s}`), chance: 0.3 },
        shelf: { rng: new Rng(`e${s}`), chance: 0.3 },
      });
      const plain = fillTemplate(t, new Rng(`r${s}${t.id}`), opts());
      const wet = fillTemplate(t, new Rng(`r${s}${t.id}`), { ...opts(), spill: { rng: new Rng(`g${s}`), chance: 1 } });
      let n = 0;
      plain.rows.forEach((row, r) => [...row].forEach((ch, c) => {
        const other = wet.rows[r]![c];
        if (other === ch) return;
        assert.equal(ch, '.', `${t.id}: solo cambia un hueco vacío`);
        assert.equal(other, 'g');
        n++;
      }));
      assert.ok(n <= SPILL_MAX);
      placed += n;
    }
  }
  assert.ok(placed > 0);
  // With a Regleta in the room, about twice as likely (in rooms with room to spare for both).
  const tally = { with: [0, 0], without: [0, 0] };
  for (const t of combat) {
    if ([...t.rows.join('')].filter((ch) => ch === 'o').length < 4) continue;
    for (let s = 0; s < 80; s++) {
      const hazard = { rng: new Rng(`h${s}`), chance: 0.3 };
      const spill = { rng: new Rng(`g${s}`), chance: 0.25 };
      const rows = fillTemplate(t, new Rng(`r${s}${t.id}`), { depth: 3, pool: slotEnemiesOf(1), hazard, spill }).rows.join('');
      const bin = rows.includes('r') ? tally.with : tally.without;
      bin[0]!++;
      if (rows.includes('g')) bin[1]!++;
    }
  }
  const rate = (b: number[]): number => b[1]! / Math.max(1, b[0]!);
  assert.ok(tally.with[0]! > 20 && tally.without[0]! > 20);
  assert.ok(rate(tally.with) > rate(tally.without) * 1.4, `con regleta ${rate(tally.with).toFixed(2)}, sin ${rate(tally.without).toFixed(2)}`);
  let rooms = 0;
  let jugs = 0;
  for (let s = 0; s < 6; s++) {
    for (const level of [2, 4]) {
      const w = createWorld({ seed: `garrafas-${s}`, floor: true, level });
      assert.equal(worldHash(w), worldHash(createWorld({ seed: `garrafas-${s}`, floor: true, level })));
      for (const fr of w.floor!.rooms) {
        if (fr.template.kind !== 'combat') continue;
        rooms++;
        if (fr.template.rows.join('').includes('g')) jugs++;
      }
    }
  }
  assert.ok(jugs > 0 && jugs < rooms * 0.6, `${jugs} en ${rooms} salas`);
});
