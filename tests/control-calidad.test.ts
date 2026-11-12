// La Trituradora, fase 3 «Control de calidad» (M12 (4c)): desde el 35 % pega etiquetas de «APTO»
// en el suelo (frenan como la escarcha) y caen pilas de cajas, media columna cada vez, que cierran
// la sala desde la pared más lejana hacia ella.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { PROPS } from '../src/data/props.ts';
import type { BossBrain, BossFrostAttack } from '../src/data/types.ts';
import { textWidth } from '../src/art/font.ts';
import { nextChunk } from '../src/sim/crates.ts';
import { BACK_WALL_ROWS, TILE } from '../src/sim/room.ts';
import { checkInvariants, createWorld, DT, frostSlow, NO_INPUT, SERVICE_LEVEL, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { PLATE, TRITURADORA_FRAMES, trituradoraLook } from '../tools/sprites/trituradora.ts';

const def = ENEMIES.trituradora!;
const brain = def.brain as BossBrain;
const phase = brain.phases[2]!;
const spec = phase.crates!;
const ticks = (s: number): number => Math.ceil(s / DT);
const crateCount = (w: World): number => w.room.props.filter((p) => p.def.id === 'pila-cajas').length;

/** The fight with the belt already laid (phase 2), then the boss down to 24 %: phase 3, after its break. */
function calidad(seed = 'calidad', at = { x: 160, y: 200 }): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-taller', level: SERVICE_LEVEL });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'trituradora')!;
  w.player.x = at.x;
  w.player.y = at.y;
  boss.damageTaken = Math.ceil(def.hp * 0.41);
  step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  boss.damageTaken = Math.ceil(def.hp * 0.76);
  step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  // Past the break between phases (it shrugs bullets off and shouts its line): the clock starts then.
  for (let i = 0; i < ticks(3) && boss.state === 'roar'; i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  return { w, boss };
}

test('la fase 3 es «Control de calidad», desde el 35 %, con sus etiquetas y sus cajas', () => {
  assert.equal(brain.phases.length, 3);
  assert.equal(phase.name, 'Control de calidad');
  assert.equal(phase.from, 0.35);
  assert.ok(phase.line && textWidth(phase.line) <= 220);
  const label = phase.attacks.find((a): a is BossFrostAttack => a.kind === 'frost');
  assert.ok(label?.sticker, 'pega etiquetas');
  assert.ok(label.slow > 0.3 && label.slow < 1, 'frenan sin pegar del todo');
  assert.equal(TRITURADORA_FRAMES[label.pose!], 'calidad');
  // Its sprites exist: the label on the floor and in flight, and the stack of crates.
  const sheets = JSON.parse(readFileSync('public/assets/sprites.json', 'utf8')) as unknown;
  const names = JSON.stringify(sheets);
  for (const n of [label.sticker, `${label.sticker}-vuelo`, spec.prop]) assert.ok(names.includes(`"${n}"`), `falta el sprite ${n}`);
  // A stack is a whole tile, so a column of them is a wall.
  const box = PROPS[spec.prop]!.box;
  assert.deepEqual([box.w, box.h, box.x, box.y], [TILE, TILE, -TILE / 2, -TILE]);
  assert.ok(PROPS[spec.prop]!.blocksBullets && !PROPS[spec.prop]!.hp);
});

test('las cajas caen media columna cada vez, desde la pared de donde viene la cinta hacia ella', () => {
  for (const [at, dir] of [[{ x: 160, y: 200 }, 1], [{ x: 470, y: 260 }, -1]] as const) {
    const { w, boss } = calidad(`calidad-${dir}`, at);
    assert.equal(boss.bossPhase, 2);
    assert.equal(w.conveyors.length, 1, 'la cinta sigue');
    assert.equal(w.conveyors[0]!.dirX, dir);
    assert.ok(boss.crates);
    assert.equal(boss.crates.from, -dir, 'empiezan por la pared de la que sale la cinta');
    // Nothing before the first chunk is due.
    for (let i = 0; i < ticks(spec.first - 0.3); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    assert.equal(w.crates.length + crateCount(w), 0);
    const startProps = w.room.props.length;
    // Then the top half of the first column, marked, and down after the warning.
    for (let i = 0; i < ticks(0.6); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    assert.ok(w.crates.length > 0, 'marcadas');
    const col = Math.floor(w.crates[0]!.box.x / TILE);
    assert.equal(col, dir > 0 ? 1 : w.room.cols - 2);
    assert.ok(w.crates.every((d) => d.box.y < (BACK_WALL_ROWS + 7) * TILE), 'la mitad de arriba');
    assert.ok(w.crates.every((d) => d.out === dir), 'el que esté debajo sale hacia ella');
    for (let i = 0; i < ticks(spec.warn); i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    assert.ok(crateCount(w) > 0, 'han caído');
    // After a while: columns in order from the far wall, each one whole (top and bottom halves),
    // and never more than `cols` of them.
    for (let i = 0; i < ticks(spec.every * (spec.cols * 2 + 3)); i++) {
      step(w, { ...NO_INPUT, moveX: -dir * 0.3, aimX: boss.x, aimY: boss.y });
      if (boss.damageTaken >= def.hp - 1) boss.damageTaken = def.hp - 2;
    }
    const cols = new Set(w.room.props.filter((p) => p.def.id === 'pila-cajas').map((p) => Math.floor(p.box.x / TILE)));
    assert.equal(cols.size, spec.cols);
    const want = Array.from({ length: spec.cols }, (_, k) => (dir > 0 ? 1 + k : w.room.cols - 2 - k));
    assert.deepEqual([...cols].sort((a, b) => a - b), want.sort((a, b) => a - b));
    // The farthest column is shut from the back wall to the bottom one (bar the corner furniture).
    const far = want[0]!;
    for (let r = BACK_WALL_ROWS; r <= w.room.rows - 2; r++) {
      const cx = far * TILE + TILE / 2;
      const cy = r * TILE + TILE / 2;
      assert.ok(w.room.props.some((p) => cx >= p.box.x && cx < p.box.x + p.box.w && cy >= p.box.y && cy < p.box.y + p.box.h), `fila ${r} cerrada`);
    }
    assert.ok(w.room.props.length > startProps);
    assert.equal(w.crates.length, 0);
    // The boss still has room to ride its wall and the toaster room to fight.
    assert.ok(Math.abs(boss.x - (dir > 0 ? w.room.w : 0)) < w.room.w / 3);
    assert.deepEqual(checkInvariants(w), []);
  }
});

test('la que está debajo cuando caen recibe un golpe y sale despedida hacia la Trituradora', () => {
  const { w, boss } = calidad('debajo');
  const p = w.player;
  for (let i = 0; i < ticks(spec.first + 0.1) && w.crates.length === 0; i++) step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  assert.ok(w.crates.length > 0);
  const d = w.crates[Math.floor(w.crates.length / 2)]!;
  w.noDamage = false;
  const hp = p.hp;
  let hurt = false;
  // It stands right on the mark (the belt is stopped for the test: it would carry it off).
  w.conveyors = [];
  while (w.crates.length > 0) {
    p.x = d.x;
    p.y = d.y - TILE / 2 + 2;
    p.vx = 0;
    p.vy = 0;
    p.invulnerable = 0;
    step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
    if (w.events.some((e) => e.type === 'hurt')) hurt = true;
  }
  assert.ok(hurt, 'le cae encima');
  assert.ok(p.hp < hp);
  assert.ok(p.x > d.box.x + d.box.w, 'fuera, del lado de ella');
  assert.ok(!w.room.props.some((pr) => p.x + p.def.footRadius > pr.box.x && p.x - p.def.footRadius < pr.box.x + pr.box.w && p.y > pr.box.y && p.y - 3 < pr.box.y + pr.box.h), 'no se queda dentro');
  assert.deepEqual(checkInvariants(w), []);
});

test('nextChunk se salta lo que ya está en pie (los muebles de las esquinas)', () => {
  const { w, boss } = calidad('esquinas');
  const st = { ...boss.crates!, col: 0, half: 0 as const };
  const top = nextChunk(w, st);
  // The far top corner has a crate of parts in the template: that tile is skipped.
  const corner = w.room.props.find((p) => p.def.id !== 'pila-cajas' && Math.floor(p.box.x / TILE) === top[0]!.c && Math.floor((p.box.y + p.box.h - 1) / TILE) === BACK_WALL_ROWS);
  if (corner) assert.ok(!top.some((t) => t.r === BACK_WALL_ROWS));
  assert.ok(top.length >= 5);
});

test('las etiquetas «APTO» se quedan en el suelo y frenan', () => {
  const { w, boss } = calidad('etiquetas');
  let landed = false;
  for (let i = 0; i < ticks(60) && !landed; i++) {
    step(w, { ...NO_INPUT, moveX: -0.3, aimX: boss.x, aimY: boss.y });
    if (boss.damageTaken >= def.hp - 1) boss.damageTaken = def.hp - 2;
    const f = w.frost.find((x) => x.sticker && x.t > 0.1);
    if (f) {
      landed = true;
      assert.equal(f.sticker, 'etiqueta-apto');
      assert.ok(frostSlow(w, f.x, f.y) < 1, 'frena');
      assert.equal(f.slow, (phase.attacks.find((a) => a.kind === 'frost') as BossFrostAttack).slow);
    }
  }
  assert.ok(landed, 'pega alguna en 60 s');
});

test('si se salta la fase 2 (de golpe al 24 %), las cajas empiezan por la pared lejana a ella', () => {
  const w = createWorld({ seed: 'salto', room: 'jefe-taller', level: SERVICE_LEVEL });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'trituradora')!;
  boss.damageTaken = Math.ceil(def.hp * 0.76);
  step(w, { ...NO_INPUT, aimX: boss.x, aimY: boss.y });
  assert.equal(boss.bossPhase, 2);
  assert.ok(boss.crates);
  assert.equal(boss.crates.from, boss.x > w.room.w / 2 ? -1 : 1);
});

test('la fase 3 es determinista', () => {
  const run = (): string => {
    const { w, boss } = calidad('det');
    for (let i = 0; i < ticks(12); i++) step(w, { ...NO_INPUT, moveX: -0.2, aimX: boss.x, aimY: boss.y });
    return worldHash(w);
  };
  assert.equal(run(), run());
});

test('su placa «EN SERVICIO» se vuelve a pintar sin voltear, para que se lea mirando a la izquierda', () => {
  const bd = def.anim!.badge!;
  assert.equal(bd.sprite, 'placa-servicio');
  assert.deepEqual([bd.x, bd.y, bd.w], [PLATE.x, PLATE.y, PLATE.w]);
  assert.equal(bd.upTo, TRITURADORA_FRAMES.length, 'en todos sus cuadros');
  TRITURADORA_FRAMES.forEach((n, i) => assert.equal(bd.frameDy?.[i] ?? 0, trituradoraLook(n).dip ?? 0, `cuadro ${n}`));
});
