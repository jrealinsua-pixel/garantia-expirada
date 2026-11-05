// El Director de Recursos Inhumanos en la simulación (M10 planta 4 5b, jefe de la planta 4): sus
// tarjetas de visita y cartas de despido, y la «Reestructuración»: las mamparas que se recolocan,
// los anillos de diapositivas y su propio sello de Denegado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { LORE } from '../src/data/lore.ts';
import { PATTERNS } from '../src/data/patterns.ts';
import { PROPS } from '../src/data/props.ts';
import { floorBossOf, ROOMS } from '../src/data/rooms.ts';
import type { BossBrain } from '../src/data/types.ts';
import { DOWN_CAUSES } from '../src/data/texts.ts';
import { enemyFrame } from '../src/render/enemyAnim.ts';
import { expandPattern } from '../src/sim/patterns.ts';
import { Rng } from '../src/sim/rng.ts';
import { buildRoom, TILE } from '../src/sim/room.ts';
import { overlaps } from '../src/sim/vec.ts';
import { activeWarnings, checkInvariants, createWorld, DT, inkUnder, isClear, NO_INPUT, step, worldHash, type Enemy, type World } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';

const def = ENEMIES['director-rrhh']!;
const brain = def.brain as BossBrain;
const ticks = (s: number): number => Math.ceil(s / DT);

function fight(seed = 'director'): { w: World; boss: Enemy } {
  const w = createWorld({ seed, room: 'jefe-oficinas', level: 4 });
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.id === 'director-rrhh');
  assert.ok(boss, 'el Director está en la Sala de Juntas');
  return { w, boss };
}

const run = (w: World, s: number): void => {
  for (let i = 0; i < ticks(s); i++) step(w, NO_INPUT);
};

const partitions = (w: World) => w.room.props.filter((p) => p.def.id === 'mampara-movil');

/** Into the «Reestructuración»: 42 % of his life gone. */
function restructure(w: World, boss: Enemy): void {
  boss.damageTaken = Math.ceil(def.hp * 0.42);
  step(w, NO_INPUT);
  assert.equal(boss.bossPhase, 1);
}

test('el Director es el jefe de la planta 4, con su cartel, su causa de baja y su evaluación de desempeño', () => {
  assert.equal(floorBossOf(4), 'E');
  assert.equal(floorBossOf(3), 'D');
  assert.equal(def.boss?.subtitle, 'Jefe de planta · Oficinas');
  assert.equal(def.boss?.motto, 'Aquí nadie es imprescindible. Usted tampoco.');
  assert.ok(DOWN_CAUSES['director-rrhh']?.bullet && DOWN_CAUSES['director-rrhh']?.contact);
  assert.ok(LORE.some((d) => 'boss' in d.source && d.source.boss === 'director-rrhh'), 'deja su documento para el archivador');
  const f4 = createWorld({ seed: 'planta-director', floor: true, level: 4 }).floor!;
  const room = f4.rooms.find((r) => r.template.kind === 'boss')!;
  assert.equal(room.template.id, 'jefe-oficinas');
  assert.ok(room.template.rows.join('').includes('E'));
  assert.deepEqual(brain.phases.map((p) => p.name), ['Somos una familia', 'Reestructuración', 'Despido procedente']);
  assert.equal(brain.phases[1]!.from, 0.6);
});

test('la Sala de Juntas: cuatro mamparas de cristal (una por cuarto), que paran balas como la pared', () => {
  const room = buildRoom(ROOMS['jefe-oficinas']!);
  const ps = room.props.filter((p) => p.def.id === 'mampara-movil');
  assert.equal(ps.length, 4);
  assert.ok(PROPS['mampara-movil']!.blocksBullets);
  const quarters = new Set(ps.map((p) => `${p.x < room.w / 2 ? 'O' : 'E'}${p.y < room.h / 2 ? 'N' : 'S'}`));
  assert.equal(quarters.size, 4, 'una en cada cuarto');
  // Exactly the three tiles they used to be (cols 5-7 and 18-20 of rows 6 and 11).
  for (const p of ps) {
    assert.equal(p.box.w, TILE * 3);
    assert.equal(p.box.h, TILE);
    assert.equal(p.box.x % TILE, 0);
    assert.equal(p.box.y % TILE, 0);
  }
  assert.deepEqual(ps.map((p) => [p.box.x / TILE, p.box.y / TILE]).sort(), [[5, 6], [5, 11], [18, 6], [18, 11]].sort());
});

test('«Somos una familia»: abanicos de tarjetas de visita y cartas de despido que caen donde marca el anillo y se abren en folios', () => {
  const cards = expandPattern(PATTERNS['director-tarjetas']!, 0, new Rng('t'));
  assert.ok(cards.length >= 15 && cards.every((s) => s.color === 'bizcard'));
  const { w, boss } = fight('familia');
  let cardSeen = false;
  let letters = 0;
  let sheets = 0;
  let posed = false;
  for (let i = 0; i < ticks(40) && (!cardSeen || sheets === 0); i++) {
    step(w, NO_INPUT);
    if (w.bullets.some((b) => b.by === 'director-rrhh' && b.color === 'bizcard')) cardSeen = true;
    const fl = w.frost.filter((f) => f.look === 'carta-despido');
    letters = Math.max(letters, fl.length);
    if (fl.length) assert.ok(fl.every((f) => f.product === 0 && f.life === 0), 'una carta no deja charco');
    if (w.bullets.some((b) => b.color === 'sheet')) sheets++;
    if (boss.state === 'warn' && boss.attack !== undefined && brain.phases[0]!.attacks[boss.attack]!.kind === 'spit') posed ||= enemyFrame(boss, 0) === 6;
  }
  assert.ok(cardSeen, 'lanza tarjetas de visita');
  assert.ok(letters >= 3, `lanza ${letters} cartas a la vez`);
  assert.ok(sheets > 0, 'las cartas se abren en folios');
  assert.ok(posed, 'con la carta en la mano mientras avisa');
  // The sheets of a letter only go a couple of steps.
  assert.ok((PATTERNS['director-folios'] as { life?: number }).life! <= 1.5);
});

test('«Reestructuración»: una palmada y las cuatro mamparas se recolocan, avisando dónde, cada una en su cuarto y sin encerrar a nadie', () => {
  const { w, boss } = fight('reestructura');
  run(w, 2);
  const before = partitions(w).map((p) => ({ x: p.x, y: p.y }));
  boss.damageTaken = Math.ceil(def.hp * 0.42);
  step(w, NO_INPUT);
  assert.ok(w.events.some((e) => e.type === 'clap'), 'da una palmada');
  assert.ok(w.events.some((e) => e.type === 'restructure'));
  assert.equal(boss.state, 'roar');
  assert.equal(enemyFrame(boss, 0), def.anim!.clap, 'el fotograma de la palmada');
  const ps = partitions(w);
  assert.ok(ps.every((p) => p.slide), 'las cuatro se mueven');
  // Marked first: still where they were for the warning.
  run(w, 0.5);
  assert.deepEqual(ps.map((p) => ({ x: p.x, y: p.y })), before, 'durante el aviso no se mueven');
  run(w, 1.4);
  const room = w.room;
  for (const [i, p] of ps.entries()) {
    assert.equal(p.slide, undefined, 'han llegado');
    assert.ok(Math.abs(p.x - before[i]!.x) + Math.abs(p.y - before[i]!.y) >= TILE * 2, 'a otro sitio');
    assert.equal((p.x < room.w / 2) === (before[i]!.x < room.w / 2), true, 'en su mitad');
    assert.equal((p.y < room.h / 2) === (before[i]!.y < room.h / 2), true, 'en su mitad');
    assert.equal(p.box.x % TILE, 0);
    // A tile of clear floor all round: no way through is shut.
    const pad = { x: p.box.x - TILE + 1, y: p.box.y - TILE + 1, w: p.box.w + TILE * 2 - 2, h: p.box.h + TILE * 2 - 2 };
    for (const o of room.props) if (o !== p) assert.ok(!overlaps(o.box, pad), `${o.def.id} pegado a una mampara`);
  }
  // The middle corridors stay open from wall to wall.
  for (let y = TILE * 2 + 8; y < room.h - TILE; y += 6) assert.ok(isClear(w, room.w / 2, y, 5) || y > 190 && y < 245, `pasillo central cortado en y=${y}`);
  assert.deepEqual(checkInvariants(w), []);
  // And again every 12 s.
  let again = false;
  for (let i = 0; i < ticks(16) && !again; i++) {
    step(w, NO_INPUT);
    again = w.events.some((e) => e.type === 'clap');
  }
  assert.ok(again, 'otra palmada antes de 16 s');
});

test('una mampara que se desliza empuja a la tostadora, no la aplasta', () => {
  const { w, boss } = fight('empuja');
  run(w, 1);
  restructure(w, boss);
  const p0 = partitions(w)[0]!;
  const s = p0.slide!;
  // The toaster right where it is going.
  w.player.x = s.toX;
  w.player.y = s.toY - 6;
  for (let i = 0; i < ticks(2); i++) {
    step(w, NO_INPUT);
    assert.deepEqual(checkInvariants(w), [], `tick ${i}`);
  }
  assert.ok(!overlaps(p0.box, { x: w.player.x - 5, y: w.player.y - 3, w: 10, h: 4 }), 'fuera de la mampara');
});

test('su sello: dos sombras cuadradas avisan, caen dos cuadros de tinta y el que pilla hace daño', () => {
  const { w, boss } = fight('sello');
  restructure(w, boss);
  w.noDamage = false;
  w.player.invulnerable = 0;
  let shadows = 0;
  let inked = false;
  let pose = false;
  for (let i = 0; i < ticks(60) && !inked; i++) {
    // The toaster stays put: the first stamp comes down where it stands.
    step(w, NO_INPUT);
    const sh = activeWarnings(w).filter((wn) => wn.mark === 'stamp' && wn.size);
    if (sh.length) {
      shadows = Math.max(shadows, sh.length);
      pose ||= enemyFrame(boss, 0) === 8;
    }
    if (w.events.some((e) => e.type === 'stamp')) inked = true;
  }
  assert.ok(inked, 'estampa');
  assert.equal(shadows, 2, 'dos sombras');
  assert.ok(pose, 'con su sello en alto');
  assert.ok(w.ink.filter((k) => k.source === boss.id).length >= 1);
  assert.ok(inkUnder(w, w.player.x, w.player.y), 'uno cae donde estaba la tostadora');
  const hit = w.events.find((e) => e.type === 'stamp' && e.hit);
  assert.ok(hit, 'y la pilla');
});

test('las diapositivas: anillos con dos huecos que giran, siempre hay por dónde pasar', () => {
  const aim = 0.3;
  const shots = expandPattern(PATTERNS['director-diapositivas']!, aim, new Rng('d'));
  assert.ok(shots.every((s) => s.color === 'slide'));
  const first = shots.filter((s) => s.delay === 0);
  const off = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  for (const s of first) assert.ok(off(s.angle, aim + (25 * Math.PI) / 180) >= (20 * Math.PI) / 180, 'nada en el hueco');
});

test('un combate entero con el bot: determinista y sin romper nada', () => {
  const play = (): string => {
    const w = createWorld({ seed: 'director-bot', room: 'jefe-oficinas', level: 4 });
    w.intro = null;
    w.noDamage = true;
    const bot = new Bot('director-bot');
    for (let i = 0; i < ticks(90) && !w.over; i++) {
      step(w, bot.think(w));
      const errs = checkInvariants(w);
      assert.deepEqual(errs, [], `tick ${i}`);
    }
    return worldHash(w);
  };
  assert.equal(play(), play());
});
