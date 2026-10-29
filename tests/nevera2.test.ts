import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { EXPIRED_PRODUCTS } from '../src/data/props.ts';
import { isWallAt } from '../src/sim/room.ts';
import { createWorld, DT, firePattern, frostSlow, NO_INPUT, step, worldHash, type Bullet, type Enemy, type Input, type World } from '../src/sim/world.ts';

const ticks = (s: number): number => Math.ceil(s / DT);

/** The boss room, entrance over, with the fridge already at half its life (second phase). */
function phase2(seed = 'nevera-2'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe' });
  w.intro = null;
  const boss = w.enemies.find((e) => e.def.boss)!;
  boss.damageTaken = Math.ceil(boss.def.hp * 0.5) + 1;
  return { w, boss };
}

function dance(w: World, i: number): Input {
  return { ...NO_INPUT, moveX: Math.sin(i / 50) > 0 ? 1 : -1, aimX: w.player.x, aimY: w.player.y - 50 };
}

const brain = (() => {
  const b = ENEMIES['nevera-suprema']!.brain;
  if (b.kind !== 'boss') throw new Error('no es jefe');
  return b;
})();

test('nevera fase 2: empieza a mitad de vida con su nombre y usa sus tres ataques', () => {
  const { w, boss } = phase2();
  w.noDamage = true;
  const phases: string[] = [];
  const used = new Set<number>();
  let cards = 0;
  let products = 0;
  let prev = boss.state;
  for (let i = 0; i < ticks(60); i++) {
    step(w, dance(w, i));
    for (const e of w.events) if (e.type === 'bossPhase') phases.push(e.name);
    if (prev === 'idle' && boss.state !== 'idle') used.add(boss.attack!);
    prev = boss.state;
    cards = Math.max(cards, w.bullets.filter((b) => b.color === 'card').length);
    products = Math.max(products, w.frost.filter((f) => f.product !== undefined).length);
  }
  assert.deepEqual(phases, ['Oferta irrechazable']);
  assert.equal(boss.bossPhase, 1);
  assert.deepEqual([...used].sort(), brain.phases[1]!.attacks.map((_, i) => i));
  assert.ok(cards >= 3, `tarjetas a la vez: ${cards}`);
  assert.ok(products >= 3, `productos en el aire a la vez: ${products}`);
  for (const a of brain.phases[1]!.attacks) {
    if (a.kind === 'pattern') assert.ok(PATTERNS[a.pattern], a.pattern);
    if (a.kind === 'spit') assert.ok(PATTERNS[a.burst], a.burst);
  }
});

test('nevera fase 2: con vida de sobra sigue en la fase 1', () => {
  const { w, boss } = phase2();
  boss.damageTaken = Math.floor(boss.def.hp * 0.5) - 2;
  w.noDamage = true;
  for (let i = 0; i < ticks(5); i++) step(w, dance(w, i));
  assert.equal(boss.bossPhase, 0);
});

/** One loyalty card fired from (x, y) at `aim`. */
function card(w: World, x: number, y: number, aim: number): Bullet {
  const before = new Set(w.bullets.map((b) => b.id));
  firePattern(w, { kind: 'fan', count: 1, spreadDeg: 0, speed: 72, homing: { turnDeg: 75, time: 2.2 }, shootable: true, life: 4.5, color: 'card' }, x, y, aim, { by: 'nevera-suprema' });
  step(w, NO_INPUT);
  return w.bullets.find((b) => !before.has(b.id))!;
}

test('tarjetas: persiguen a la tostadora un rato y luego siguen recto', () => {
  const { w } = phase2('tarjetas');
  w.enemies = [];
  w.noDamage = true;
  const p = w.player;
  // Fired straight up from beside the toaster: it bends round towards it.
  const c = card(w, p.x - 70, p.y - 10, -Math.PI / 2);
  const dir0 = c.dir;
  for (let i = 0; i < ticks(1); i++) step(w, NO_INPUT);
  assert.ok(Math.cos(c.dir) > Math.cos(dir0) + 0.5, `gira hacia la tostadora (dir ${c.dir.toFixed(2)})`);
  // After its homing time it no longer turns.
  for (let i = 0; i < ticks(1.4); i++) step(w, NO_INPUT);
  const late = c.dir;
  for (let i = 0; i < ticks(0.5); i++) step(w, NO_INPUT);
  if (w.bullets.includes(c)) assert.equal(c.dir, late);
});

test('tarjetas: son más lentas que la tostadora, que las deja atrás andando', () => {
  const { w } = phase2('tarjetas-lentas');
  w.enemies = [];
  const p = w.player;
  p.x = 120;
  const c = card(w, p.x - 40, p.y - 6, 0);
  assert.ok(c.speed < p.def.speed);
  // Walking away to the right: it never catches up.
  for (let i = 0; i < ticks(1.5); i++) step(w, { ...NO_INPUT, moveX: 1, aimX: p.x + 50, aimY: p.y });
  assert.equal(p.hp, p.def.maxHp);
});

test('tarjetas: un disparo las rompe (y se pierden las dos balas)', () => {
  const { w } = phase2('tarjetas-rotas');
  w.enemies = [];
  w.noDamage = true;
  const p = w.player;
  const c = card(w, p.x + 60, p.y - 10, Math.PI);
  let cut = 0;
  for (let i = 0; i < ticks(1.5); i++) {
    step(w, { ...NO_INPUT, fire: true, aimX: c.x, aimY: c.y });
    cut += w.events.filter((e) => e.type === 'bulletCut').length;
  }
  assert.equal(cut, 1);
  assert.ok(!w.bullets.includes(c), 'la tarjeta ya no está');
  // A normal bullet cannot be shot down.
  const { w: w2 } = phase2('balas-normales');
  w2.enemies = [];
  w2.noDamage = true;
  firePattern(w2, { kind: 'fan', count: 1, spreadDeg: 0, speed: 20, color: 'red' }, w2.player.x + 60, w2.player.y - 10, Math.PI);
  let cut2 = 0;
  for (let i = 0; i < ticks(1.5); i++) {
    const b = w2.bullets.find((x) => x.owner === 'enemy');
    step(w2, { ...NO_INPUT, fire: true, aimX: b?.x ?? 0, aimY: b?.y ?? 0 });
    cut2 += w2.events.filter((e) => e.type === 'bulletCut').length;
  }
  assert.equal(cut2, 0);
});

test('productos caducados: caen en suelo libre, revientan en balas y no dejan charco', () => {
  for (let s = 0; s < 4; s++) {
    const { w } = phase2(`caducados-${s}`);
    w.noDamage = true;
    let landed = 0;
    let bursts = 0;
    let spots: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < ticks(40); i++) {
      // The burst of last tick's landings: red bullets right there.
      const spotsBefore = spots;
      spots = [];
      step(w, { ...NO_INPUT, moveX: i % 600 < 300 ? -1 : 1, moveY: i % 400 < 200 ? -1 : 1, aimX: w.player.x, aimY: w.player.y - 50 });
      for (const f of w.frost) {
        if (f.product === undefined) continue;
        assert.ok(f.product >= 0 && f.product < EXPIRED_PRODUCTS.length);
        assert.ok(!isWallAt(w.room, f.x, f.y), `producto en la pared en ${f.x},${f.y}`);
      }
      for (const sp of spotsBefore) if (w.bullets.some((b) => b.color === 'red' && Math.hypot(b.x - sp.x, b.y - sp.y + 3) < 4)) bursts++;
      for (const e of w.events) {
        if (e.type === 'frostLand' && e.product !== undefined) {
          landed++;
          spots.push({ x: e.x, y: e.y });
          assert.equal(frostSlow(w, e.x, e.y), 1, 'no frena');
        }
      }
    }
    assert.ok(landed >= 5, `productos caídos: ${landed}`);
    assert.equal(bursts, landed - spots.length, 'cada producto revienta');
  }
});

test('nevera fase 2: el combate es determinista', () => {
  const run = (): string => {
    const { w } = phase2('nevera-2-det');
    w.noDamage = true;
    for (let i = 0; i < ticks(30); i++) step(w, { ...dance(w, i), fire: i % 3 === 0 });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
