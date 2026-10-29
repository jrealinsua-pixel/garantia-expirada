import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfile, recordRun, topCause, type RunResult } from '../src/sim/profile.ts';
import { historyLines, HISTORY_EMPTY, HISTORY_SUB, HISTORY_TITLE } from '../src/data/texts.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';

const down: RunResult = {
  character: 'tostadora',
  outcome: 'down',
  seconds: 125.4,
  kills: 12,
  coupons: 9,
  bosses: [],
  cause: { by: 'microondas', how: 'bullet' },
  items: ['pila', 'manual'],
  weapons: ['secador'],
};
const win: RunResult = {
  character: 'tostadora',
  outcome: 'floor',
  seconds: 410,
  kills: 40,
  coupons: 31,
  bosses: ['nevera-suprema'],
  items: ['pila', 'broca'],
  active: 'espera',
  weapons: ['secador', 'plancha'],
};

test('cada partida terminada suma al historial sin tocar el anterior', () => {
  const p0 = emptyProfile();
  const p1 = recordRun(p0, down);
  assert.equal(p0.runs, 0, 'el perfil viejo no cambia');
  assert.equal(p1.runs, 1);
  assert.equal(p1.downs, 1);
  assert.equal(p1.longestRun, 125);
  assert.deepEqual(p1.causes, { 'microondas:bullet': 1 });
  const p2 = recordRun(recordRun(p1, win), { ...win, seconds: 380 });
  assert.equal(p2.runs, 3);
  assert.equal(p2.floorsCleared, 2);
  assert.equal(p2.bestFloorSeconds, 380);
  assert.deepEqual(p2.bosses, { 'nevera-suprema': 2 });
  assert.deepEqual(p2.wins, { tostadora: 2 });
  assert.equal(p2.kills, 92);
  assert.deepEqual(p2.found.items, ['pila', 'manual', 'broca'], 'cada objeto se apunta una vez');
  assert.deepEqual(p2.found.actives, ['espera']);
  assert.deepEqual(p2.found.weapons, ['secador', 'plancha']);
  assert.deepEqual(topCause(p2), { by: 'microondas', how: 'bullet', times: 1 });
});

test('un guardado roto, viejo o con trampas no rompe nada: se queda lo que tiene sentido', () => {
  assert.deepEqual(parseProfile(null), emptyProfile());
  assert.deepEqual(parseProfile('{roto'), emptyProfile());
  assert.deepEqual(parseProfile('[1,2]').runs, 0);
  const p = parseProfile(JSON.stringify({ runs: 4.7, downs: -3, kills: 'muchos', bosses: { 'nevera-suprema': 2, x: -1 }, found: { items: ['pila', 3, 'pila'] }, bestFloorSeconds: 0 }));
  assert.equal(p.runs, 4);
  assert.equal(p.downs, 0);
  assert.equal(p.kills, 0);
  assert.deepEqual(p.bosses, { 'nevera-suprema': 2 });
  assert.deepEqual(p.found.items, ['pila']);
  assert.equal(p.bestFloorSeconds, null);
  // What is saved is read back the same.
  const saved = recordRun(recordRun(emptyProfile(), down), win);
  assert.deepEqual(parseProfile(JSON.stringify(saved)), saved);
});

test('el historial se lee con la fuente y cabe en su pantalla', () => {
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const cause = { text: 'Exposición prolongada a microondas', times: 42 };
  const big = { runs: 123, downs: 99, floorsCleared: 24, bestFloorSeconds: 377, bossesBeaten: 24, kills: 99999, coupons: 9999, longestRun: 3600 };
  const lines = historyLines({ ...big, found: 13, findable: 13, weapons: 3, findableWeapons: 3, cause });
  for (const l of [...lines.flatMap((x) => [x.label, x.text]), HISTORY_TITLE, HISTORY_SUB, HISTORY_EMPTY]) {
    for (const ch of fontText(l)) assert.ok(glyphs.has(ch), `«${l}»: falta «${ch}»`);
  }
  for (const l of lines) {
    assert.ok(textWidth(l.label) < 142, `«${l.label}» no cabe en su columna`);
    assert.ok(textWidth(l.text) < 190, `«${l.text}» no cabe`);
  }
  assert.ok(textWidth(HISTORY_SUB) < 340);
});
