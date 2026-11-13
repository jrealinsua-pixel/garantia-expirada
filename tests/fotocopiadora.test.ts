// La Fotocopiadora de Planta (M10 planta 4 (4b), Oficinas): keeps its distance and, every few
// seconds, lifts its lid and slides out a copy of the nearest enemy: grey, half the life, slower
// and worth nothing. At most three copies; with nobody to copy it prints sheets at you. When it
// breaks, its copies fade out and fall.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies.ts';
import { SLOT_ENEMIES_3, SLOT_ENEMIES_4, templatesOf } from '../src/data/rooms.ts';
import { fillTemplate } from '../src/sim/room.ts';
import { Rng } from '../src/sim/rng.ts';
import { COPY_LINE, DOWN_CAUSES, TONER_OUT_LINE } from '../src/data/texts.ts';
import type { CopierBrain } from '../src/data/types.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { copiable } from '../src/sim/enemies.ts';
import { activeWarnings, createWorld, DT, isDead, NO_INPUT, spawnEnemy, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';

const def = ENEMIES.fotocopiadora!;
const brain = def.brain as CopierBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

/** An empty room with the toaster in the middle (untouchable), the copier to its right and `others` around. */
function office(seed: string, others: string[] = []): { w: World; cp: Enemy; mates: Enemy[] } {
  const w = createWorld({ seed, noEnemies: true });
  w.noDamage = true;
  w.room.props = [];
  w.player.x = w.room.w / 2;
  w.player.y = w.room.h / 2;
  const cp = spawnEnemy(w.nextId++, def, w.player.x + 170, w.player.y);
  const mates = others.map((id, i) => spawnEnemy(w.nextId++, ENEMIES[id]!, w.player.x + 110, w.player.y - 50 + i * 40));
  w.enemies = [cp, ...mates];
  return { w, cp, mates };
}

/** Runs until a photocopier finishes its next scan (or `max` s go by). */
function untilScan(w: World, cp: Enemy, max = 8): void {
  for (let i = 0; i < ticks(max); i++) {
    step(w, NO_INPUT);
    if (cp.state === 'brake') return;
  }
}

test('la fotocopiadora es contenido: datos, sprite, folios, textos, causa de baja y solo desde la planta 4', () => {
  assert.equal(def.name, 'Fotocopiadora de Planta');
  assert.equal(def.hp, 6);
  assert.ok(!/[!¡]/.test(def.name + def.description + COPY_LINE + TONER_OUT_LINE));
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames?: number; frameW: number }>;
  assert.ok(sheets.fotocopiadora, 'falta el sprite');
  assert.ok(sheets['bala-folio'], 'faltan los folios');
  assert.ok(DOWN_CAUSES.fotocopiadora?.bullet && DOWN_CAUSES.fotocopiadora.contact);
  assert.ok(!SLOT_ENEMIES_3.some((s) => s.ch === 'K'));
  // As a support enemy: at most one per room.
  assert.equal(SLOT_ENEMIES_4.find((s) => s.ch === 'K')?.max, 1);
});

test('cada letra de enemigo de la planta 4 trae a su enemigo a la sala (la K no choca con nada del Mostrador)', () => {
  const tpl = templatesOf('combat', 4)[0]!;
  for (const slot of SLOT_ENEMIES_4) {
    const filled = fillTemplate(tpl, new Rng(`letra-${slot.ch}`), { depth: 3, pool: [{ ...slot, cost: 1, max: 1 }] });
    const w = createWorld({ seed: `letra-${slot.ch}`, template: filled });
    assert.ok(w.enemies.length > 0, `la letra ${slot.ch} no trae a nadie`);
  }
  const filled = fillTemplate(tpl, new Rng('letra'), { depth: 3, pool: [{ ch: 'K', cost: 1, weight: 1, max: 1 }] });
  assert.ok(createWorld({ seed: 'letra', template: filled }).enemies.some((e) => e.def.id === 'fotocopiadora'));
});

test('avisa un segundo con la tapa levantada, la luz cruzando el cristal y una raya hasta a quien copia', () => {
  const { w, cp, mates } = office('aviso', ['aspirador']);
  let scan = -1;
  for (let i = 0; i < ticks(6) && cp.state !== 'warn'; i++) step(w, NO_INPUT);
  assert.equal(cp.state, 'warn', 'empieza a escanear');
  assert.ok(Math.abs(cp.until - brain.telegraph) < 1e-9);
  const seen = new Set<number>();
  while (cp.state === 'warn') {
    const wn = activeWarnings(w).find((x) => x.source === cp.id);
    if (wn?.scan !== undefined) scan = wn.scan;
    seen.add(enemyFrame(cp, 0));
    assert.ok(Math.hypot(cp.vx, cp.vy) < 1, 'quieta mientras copia');
    step(w, NO_INPUT);
  }
  assert.equal(scan, mates[0]!.id, 'la raya va hasta el aspirador');
  assert.deepEqual([...seen].sort(), [6, 7, 8], 'la luz recorre el cristal');
  assert.equal(enemyFrame(cp, 0), 9, 'y la copia sale por la bandeja');
});

test('la copia es el mismo enemigo, con la mitad de vida, más lento y sin cupones', () => {
  const { w, cp } = office('copia', ['aspirador']);
  untilScan(w, cp);
  const copy = w.enemies.find((o) => o.copyOf === cp.id);
  assert.ok(copy, 'saca una copia');
  assert.equal(copy.def.id, 'aspirador');
  assert.equal(copy.def.hp - copy.damageTaken, Math.ceil(copy.def.hp * brain.copyLife), 'con la mitad de vida');
  assert.ok(!copiable(copy), 'una copia no se copia');
  // 20 % slower at everything: the same vacuum, walking the same way for a second, covers about 80 %.
  const walked = (pace?: number): number => {
    const o = office('paso', ['aspirador']);
    const v = o.mates[0]!;
    o.w.enemies = [v];
    v.x = o.w.player.x + 150;
    v.y = o.w.player.y;
    v.state = 'walk';
    v.t = 0;
    v.until = 999;
    if (pace !== undefined) v.pace = pace;
    for (let i = 0; i < ticks(1); i++) step(o.w, NO_INPUT);
    return v.moved;
  };
  const ratio = walked(brain.copyPace) / walked();
  assert.ok(ratio > 0.75 && ratio < 0.85, `la copia anda al ${(ratio * 100).toFixed(0)} %`);
  // It drops nothing.
  const before = w.pickups.length;
  copy.damageTaken = copy.def.hp;
  step(w, NO_INPUT);
  assert.ok(!w.enemies.includes(copy));
  assert.equal(w.pickups.length, before, 'la copia no suelta cupones');
});

test('como mucho tres copias suyas; sin nadie a quien copiar, imprime tres folios hacia la tostadora', () => {
  const { w, cp } = office('tope', ['aspirador']);
  for (let n = 0; n < 5; n++) {
    cp.state = 'walk';
    cp.t = 0;
    cp.until = 0;
    untilScan(w, cp);
  }
  assert.equal(w.enemies.filter((o) => o.copyOf === cp.id).length, brain.maxCopies);
  // Alone: sheets at the toaster.
  const solo = office('solo');
  untilScan(solo.w, solo.cp);
  for (let i = 0; i < 3; i++) step(solo.w, NO_INPUT);
  const sheets = solo.w.bullets.filter((b) => b.owner === 'enemy' && b.color === 'sheet');
  assert.equal(sheets.length, 3, 'tres folios');
  for (const b of sheets) assert.ok(b.vx < 0, 'hacia la tostadora');
  assert.equal(solo.w.enemies.length, 1, 'no se copia a sí misma');
});

test('no copia jefes ni cebos escondidos', () => {
  const { w, cp } = office('jefes', ['muneco-moda', 'cargador']);
  const bait = w.enemies.find((o) => o.def.id === 'cargador')!;
  assert.equal(bait.state, 'lurk');
  untilScan(w, cp);
  assert.equal(w.enemies.filter((o) => o.copyOf !== undefined).length, 0);
});

test('al romperla, «Sin tóner»: sus copias se destiñen y caen en un segundo', () => {
  const { w, cp } = office('toner', ['aspirador']);
  untilScan(w, cp);
  cp.state = 'walk';
  cp.t = 0;
  cp.until = 0;
  untilScan(w, cp);
  const copies = w.enemies.filter((o) => o.copyOf === cp.id);
  assert.equal(copies.length, 2);
  const coupons = w.pickups.length;
  cp.damageTaken = def.hp;
  step(w, NO_INPUT);
  assert.ok(w.events.some((e) => e.type === 'tonerOut'));
  assert.ok(copies.every((c) => c.fadeT !== undefined));
  for (let i = 0; i < ticks(brain.fade) + 2; i++) step(w, NO_INPUT);
  assert.ok(copies.every((c) => isDead(c) && !w.enemies.includes(c)), 'las copias caen');
  assert.ok(w.enemies.some((o) => o.def.id === 'aspirador'), 'el original sigue');
  assert.ok(w.pickups.length - coupons <= def.loot.coupons[1], 'solo la fotocopiadora suelta cupones');
});

test('determinista: dos salas iguales acaban igual', () => {
  const run = (): string => {
    const { w } = office('det', ['aspirador', 'batidora']);
    w.noDamage = false;
    for (let i = 0; i < ticks(12); i++) step(w, { ...NO_INPUT, moveX: Math.sin(i / 40) });
    return worldHash(w);
  };
  assert.equal(run(), run());
});
