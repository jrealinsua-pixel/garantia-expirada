// Los Postes de Cola (M11 (4b), Atención al Cliente): always a pair, with a tape stretched between
// them that the toaster cannot cross walking or rolling (bullets go through). They walk to put the
// tape in front of the toaster; with it in the middle and close, the tape shortens and pushes it
// away (they make it queue). Every 3 s the nearer one lets go of a short ring of four steel balls.
// Break one and the tape snaps back into the other, which fires more often.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { SLOT_ENEMIES_4, SLOT_ENEMIES_5, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { DOWN_CAUSES, TAPE_BUMP_LINE, TAPE_SNAP_LINE } from '../src/data/texts.ts';
import type { QueuerBrain } from '../src/data/types.ts';
import { copiable } from '../src/sim/enemies.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { createWorld, DT, NO_INPUT, pairUp, spawnEnemy, step, tapesOf, type Enemy, type Input, type World } from '../src/sim/world.ts';

const def = ENEMIES['poste-cola']!;
const brain = def.brain as QueuerBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/**
 * An empty room with the toaster in the middle (untouchable) and a pair of posts `up` px above it,
 * `spread` px apart, the tape across.
 */
function queue(seed: string, up = 40, spread = 90): { w: World; a: Enemy; b: Enemy } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2 + 20;
  const a = spawnEnemy(w.nextId++, def, w.player.x - spread / 2, w.player.y - up);
  const b = spawnEnemy(w.nextId++, def, w.player.x + spread / 2, w.player.y - up);
  pairUp(a, b);
  w.enemies = [a, b];
  return { w, a, b };
}

/** Puts the posts back where they were before each tick (so only the toaster moves). */
function pinned(w: World, a: Enemy, b: Enemy, input: Input, s: number, each?: () => void): void {
  const ax = a.x;
  const ay = a.y;
  const bx = b.x;
  const by = b.y;
  for (let i = 0; i < ticks(s); i++) {
    a.x = ax;
    a.y = ay;
    b.x = bx;
    b.y = by;
    a.vx = a.vy = b.vx = b.vy = 0;
    // Nobody fires in these: they are about the tape.
    a.queueT = 99;
    step(w, input);
    each?.();
  }
}

const UP: Input = { ...NO_INPUT, moveY: -1 };

test('los postes son contenido: datos, sprites, bolas, textos, causa de baja y una pareja solo desde la planta 5', () => {
  assert.equal(def.name, 'Postes de Cola');
  assert.equal(def.hp, 10);
  assert.equal(def.pack, 2);
  assert.equal(brain.interval, 3);
  const ring = PATTERNS[brain.pattern];
  assert.ok(ring && ring.kind === 'ring' && ring.count === 4 && ring.color === 'steel');
  const lines = [def.name, def.description, TAPE_BUMP_LINE, TAPE_SNAP_LINE].join(' ');
  assert.ok(!/[!¡]/.test(lines));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number }>;
  for (const k of ['poste-cola', 'cinta-poste', 'bola-acero']) assert.ok(sheets[k], `falta el sprite ${k}`);
  assert.equal(sheets['poste-cola']!.frames, 16);
  assert.ok(DOWN_CAUSES['poste-cola']?.bullet && DOWN_CAUSES['poste-cola'].contact);
  assert.ok(!SLOT_ENEMIES_4.some((s) => s.ch === 'Á'));
  assert.equal(SLOT_ENEMIES_5.find((s) => s.ch === 'Á')?.max, 1);
  // One slot brings the pair, joined by their tape; the second one has the chipped base.
  const tpl = templatesOf('combat', 5)[0]!;
  const filled = fillTemplate(tpl, new Rng('letra-a'), { depth: 3, pool: [{ ch: 'Á', cost: 1, weight: 1, max: 1 }] });
  const ws = createWorld({ seed: 'letra-a', template: filled });
  const posts = ws.enemies.filter((e) => e.def.id === 'poste-cola');
  assert.equal(posts.length, 2);
  assert.equal(posts[0]!.mate, posts[1]!.id);
  assert.equal(posts[1]!.mate, posts[0]!.id);
  assert.equal(tapesOf(ws).length, 1);
  assert.ok(!posts[0]!.alt && posts[1]!.alt);
  const plain = enemyFrame(posts[1]!, 0);
  posts[1]!.alt = false;
  assert.equal(plain - enemyFrame(posts[1]!, 0), 8);
  posts[1]!.alt = true;
  // Never copied: a copy would have no other post for its tape.
  assert.equal(copiable(posts[0]!), false);
});

test('la cinta no se cruza andando: la tostadora se queda de su lado', () => {
  const { w, a, b } = queue('andar');
  const line = a.y;
  let bumps = 0;
  pinned(w, a, b, UP, 3, () => {
    assert.ok(w.player.y > line, `cruzó la cinta (y ${w.player.y.toFixed(1)}, cinta ${line})`);
    bumps += w.events.filter((e) => e.type === 'tapeBump').length;
  });
  assert.ok(w.player.y > line + w.player.def.footRadius - 0.5);
  assert.ok(bumps >= 1, 'chocar con la cinta no avisa');
});

test('ni rodando', () => {
  const { w, a, b } = queue('rodar');
  const line = a.y;
  let rolled = false;
  pinned(w, a, b, UP, 0.2);
  for (let k = 0; k < 4; k++) {
    pinned(w, a, b, { ...UP, roll: true }, DT);
    if (w.player.rollT >= 0) rolled = true;
    pinned(w, a, b, UP, 0.8, () => assert.ok(w.player.y > line, 'cruzó la cinta rodando'));
  }
  assert.ok(rolled, 'no llegó a rodar');
});

test('por el extremo, pasado el poste, sí se pasa; y las balas atraviesan la cinta', () => {
  const { w, a, b } = queue('rodeo');
  w.player.x = b.x + 30;
  pinned(w, a, b, UP, 2);
  assert.ok(w.player.y < a.y - 20, 'no pasa por fuera de la cinta');
  // Bullets: the toaster shoots across the tape from below, and they fly well past it.
  const q = queue('balas');
  let far = Infinity;
  pinned(q.w, q.a, q.b, { ...NO_INPUT, aimX: q.w.player.x, aimY: q.w.player.y - 200, fire: true }, 1, () => {
    for (const bl of q.w.bullets) if (bl.owner === 'player') far = Math.min(far, bl.y);
  });
  assert.ok(far < q.a.y - 40, `las balas no pasan de la cinta (${far.toFixed(0)})`);
});

test('se ponen a los lados, con la cinta entre ellos y la tostadora; con ella en medio, la cinta se acorta y empuja', () => {
  // Posts down to the left; the toaster still, well away.
  const w = createWorld({ seed: 'colocarse', noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  const p = w.player;
  p.x = w.room.w / 2 + 40;
  p.y = w.room.h / 2 - 30;
  const a = spawnEnemy(w.nextId++, def, p.x - 110, p.y + 60);
  const b = spawnEnemy(w.nextId++, def, p.x - 88, p.y + 74);
  pairUp(a, b);
  w.enemies = [a, b];
  let tense = false;
  const start = Math.hypot(p.x - (a.x + b.x) / 2, p.y - (a.y + b.y) / 2);
  const p0 = { x: p.x, y: p.y };
  for (let i = 0; i < ticks(6); i++) {
    a.queueT = 99;
    step(w, NO_INPUT);
    if (a.tense) tense = true;
  }
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const sep = Math.hypot(a.x - b.x, a.y - b.y);
  // The tape's middle, about `gap` px from the toaster, and the toaster across it from them.
  const mid = Math.hypot(p.x - mx, p.y - my);
  assert.ok(mid < start, 'no se acercan');
  assert.ok(mid > brain.gap * 0.6 && mid < brain.gap * 1.8, `la cinta a ${mid.toFixed(0)} px`);
  // The tape crosses the line from the toaster to them: the toaster sees it head-on.
  const ex = b.x - a.x;
  const ey = b.y - a.y;
  const along = ((p.x - a.x) * ex + (p.y - a.y) * ey) / (sep * sep);
  assert.ok(along > 0.05 && along < 0.95, `la tostadora no está frente a la cinta (${along.toFixed(2)})`);
  assert.ok(tense, 'la cinta no se tensa nunca');
  assert.ok(sep < brain.spread[1] - 4 && sep > brain.spread[0] - 10, `la cinta mide ${sep.toFixed(0)} px`);
  // Tense, it pushes: the toaster, standing still, has been moved away from them (to the back of the queue).
  const moved = Math.hypot(p.x - p0.x, p.y - p0.y);
  assert.ok(moved > 15, `la cinta no empuja (${moved.toFixed(1)} px)`);
  assert.ok((p.x - p0.x) * (mx - p.x) + (p.y - p0.y) * (my - p.y) < 0, 'la empuja hacia ellos');
});

test('dispara el más cercano: un anillo corto de cuatro bolas cada 3 s, por turnos', () => {
  const { w, a, b } = queue('bolas', 60);
  // The toaster nearer to b.
  w.player.x = b.x - 10;
  const volleys: { t: number; from: number }[] = [];
  for (let i = 0; i < ticks(10.2); i++) {
    a.x = w.player.x - 100;
    b.x = w.player.x;
    a.y = b.y = w.player.y - 60;
    step(w, NO_INPUT);
    for (const e of w.events) if (e.type === 'telegraph' && e.color === 'steel' && e.source !== undefined) volleys.push({ t: i * DT, from: e.source });
  }
  const steel = w.bullets.filter((bl) => bl.owner === 'enemy' && bl.color === 'steel');
  assert.ok(steel.length > 0 || volleys.length > 0);
  const shots = new Map<number, number>();
  for (const v of volleys) shots.set(v.from, (shots.get(v.from) ?? 0) + 1);
  assert.ok((shots.get(b.id) ?? 0) >= 2, `el cercano disparó ${shots.get(b.id) ?? 0} veces`);
  assert.equal(shots.get(a.id) ?? 0, 0, 'el lejano también dispara');
});

test('romper uno suelta la cinta: chasquido, se pasa, y el que queda dispara más a menudo', () => {
  const { w, a, b } = queue('romper');
  b.damageTaken = b.def.hp;
  let snapped = false;
  let fires = 0;
  for (let i = 0; i < ticks(8); i++) {
    step(w, i < ticks(1) ? NO_INPUT : UP);
    for (const e of w.events) {
      if (e.type === 'tapeSnap') snapped = true;
      if (e.type === 'telegraph' && e.color === 'steel') fires++;
    }
    if (i === 2) assert.equal(a.state, 'reveal', 'no suelta la cinta');
  }
  assert.ok(snapped, 'sin chasquido');
  assert.equal(a.mate, undefined);
  assert.equal(tapesOf(w).length, 0);
  // Alone, every `alone` s instead of 3: about four volleys in 7 s.
  assert.ok(fires >= 3, `el que queda solo disparó ${fires} veces`);
});
