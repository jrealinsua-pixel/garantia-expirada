import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { meets, newUnlocks, rosterBoard, unlockProgress } from '../src/sim/unlocks.ts';
import { ROSTER } from '../src/data/unlocks.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';

const run = (over: Partial<RunResult> = {}): RunResult => ({
  character: 'tostadora',
  outcome: 'down',
  seconds: 200,
  kills: 10,
  coupons: 5,
  bosses: [],
  cause: { by: 'microondas', how: 'bullet' },
  items: [],
  weapons: ['secador'],
  ...over,
});
const played = (...runs: RunResult[]): Profile => runs.reduce((p, r) => recordRun(p, r), emptyProfile());

test('el tablón tiene a los cinco personajes, y solo la Tostadora viene de serie', () => {
  assert.equal(ROSTER.length, 5);
  assert.equal(new Set(ROSTER.map((r) => r.id)).size, 5);
  assert.deepEqual(ROSTER.filter((r) => !r.condition).map((r) => r.id), ['tostadora']);
  assert.ok(CHARACTERS.tostadora, 'la de serie es jugable');
  assert.deepEqual(emptyProfile().unlocked, ['tostadora']);
  for (const r of ROSTER) {
    for (const b of r.condition?.beaten ?? []) assert.ok(ENEMIES[b]?.boss, `${r.id}: ${b} es un jefe`);
    for (const s of [r.name, r.blurb, r.conditionText]) {
      assert.ok(s.length <= 70, `«${s}» cabe en el tablón`);
      for (const ch of fontText(s)) assert.ok(ch === ' ' || FONT_CHARS.includes(ch), `«${ch}» de «${s}» está en la fuente`);
    }
  }
});

test('vencer a un jefe desbloquea al acabar la partida, y la partida lo apunta', () => {
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.deepEqual(p.unlocked, ['tostadora', 'batidora-vaso']);
  assert.deepEqual(p.last?.unlocked, ['batidora-vaso']);
  const q = recordRun(p, run());
  assert.deepEqual(q.unlocked, ['tostadora', 'batidora-vaso'], 'no se pierde');
  assert.equal(q.last?.unlocked, undefined, 'la siguiente partida no lo vuelve a anunciar');
  const r = recordRun(q, run({ level: 2, bosses: ['router-wifi'] }));
  assert.deepEqual(r.last?.unlocked, ['movil'], 'vencer al jefe cuenta aunque luego caigas');
  const s = recordRun(r, run({ level: 4, bosses: ['director-rrhh'] }));
  assert.deepEqual(s.last?.unlocked, ['plancha']);
});

test('el Becario sale tras diez bajas; encontrar objetos no desbloquea a nadie', () => {
  const nine = played(...Array.from({ length: 9 }, () => run()));
  assert.ok(!nine.unlocked.includes('becario'));
  assert.deepEqual(unlockProgress(ROSTER.find((r) => r.id === 'becario')!.condition, nine), [{ done: 9, needed: 10 }]);
  assert.ok(recordRun(nine, run()).unlocked.includes('becario'));
  const items = Array.from({ length: 40 }, (_, i) => `o${i}`);
  assert.deepEqual(played(run({ outcome: 'floor', items })).unlocked, ['tostadora']);
});

test('cada personaje se desbloquea con una condición propia (M13 (8))', () => {
  const keys = ROSTER.filter((r) => r.condition).map((r) => JSON.stringify(r.condition));
  assert.equal(new Set(keys).size, keys.length, 'no hay dos condiciones iguales');
  const bosses = ROSTER.flatMap((r) => r.condition?.floorBosses ?? []);
  assert.equal(new Set(bosses).size, bosses.length, 'ningún jefe de planta desbloquea a dos');
  const by = (id: string) => ROSTER.find((r) => r.id === id)!.condition;
  // M14 (j1): the floor's boss, whichever came out (the floor's own is still the Nevera, the Router, the Director).
  assert.deepEqual(by('batidora-vaso'), { floorBosses: [1] }, 'la de la cocina, con el jefe de la planta 1');
  assert.deepEqual(by('movil'), { floorBosses: [2] }, 'el móvil, con el de Informática');
  assert.deepEqual(by('plancha'), { floorBosses: [4] }, 'la plancha, con el de las Oficinas');
  assert.deepEqual(by('becario'), { minDowns: 10 });
  for (const r of ROSTER.filter((x) => x.condition)) assert.ok(CHARACTERS[r.id], `${r.id} es jugable`);
});

test('las condiciones se comprueban con todos sus campos', () => {
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.ok(meets(null, p));
  assert.ok(meets({ beaten: ['nevera-suprema'], minFloors: 1 }, p));
  assert.ok(!meets({ beaten: ['nevera-suprema', 'router-wifi'] }, p));
  assert.ok(!meets({ minFloors: 2 }, p));
  assert.ok(!meets({ minDowns: 1 }, p));
  assert.deepEqual(newUnlocks(p), [], 'lo ya desbloqueado no vuelve a salir');
});

test('los desbloqueos se guardan, se leen y una partida guardada de antes recibe lo que ganó', () => {
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.deepEqual(parseProfile(JSON.stringify(p)).unlocked, p.unlocked);
  // A save from before unlocks existed, with the fridge beaten.
  const old = JSON.stringify({ ...p, unlocked: undefined });
  assert.deepEqual(parseProfile(old).unlocked, ['tostadora', 'batidora-vaso']);
  // Strange data never breaks it; unknown ids (a character of another version) are kept.
  assert.deepEqual(parseProfile('{"unlocked":"todo"}').unlocked, ['tostadora']);
  assert.deepEqual(parseProfile('{"unlocked":["futuro",3,"futuro"]}').unlocked, ['tostadora', 'futuro']);
});

test('el tablón enseña nombre y frase a los desbloqueados, y condición y avance a los demás', () => {
  const board = rosterBoard(played(run({ outcome: 'floor', bosses: ['nevera-suprema'] })));
  assert.deepEqual(board.map((b) => b.unlocked), [true, true, false, false, false]);
  const plancha = board.find((b) => b.id === 'plancha')!;
  assert.equal(plancha.text, 'Disponible al vencer al jefe de Oficinas. Traiga camisa.');
  assert.deepEqual(plancha.progress, [{ done: 0, needed: 1 }]);
  assert.equal(board[1]!.text, ROSTER[1]!.blurb);
  assert.deepEqual(board[1]!.progress, []);
});
