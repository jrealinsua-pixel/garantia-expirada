// M13 (7c): each playable character goes down its own way (src/data/bajas.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHARACTER_DOWNS, characterDown } from '../src/data/bajas.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { DOWN_ADVICE, DOWN_COVERAGE, DOWN_UNIT, downReport } from '../src/data/texts.ts';

const SHEETS = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frameW: number; frameH: number; frames: number }>;
const INFO = { by: 'cargador', how: 'bullet' as const, room: 'Pasillo', seconds: 125, kills: 7, coupons: 3 };

test('cada personaje jugable tiene su propia muerte, con su despiece de cuatro piezas', () => {
  const sheets = new Set<string>();
  for (const id of Object.keys(CHARACTERS)) {
    const d = CHARACTER_DOWNS[id];
    assert.ok(d, `${id} no tiene muerte propia`);
    const sheet = SHEETS[d.debris];
    assert.ok(sheet, `falta la hoja ${d.debris}`);
    assert.deepEqual([sheet.frameW, sheet.frameH, sheet.frames], [8, 8, 4], d.debris);
    sheets.add(d.debris);
  }
  assert.equal(sheets.size, Object.keys(CHARACTERS).length, 'dos personajes sueltan las mismas piezas');
  assert.equal(new Set(Object.values(CHARACTER_DOWNS).map((d) => d.burst)).size, Object.keys(CHARACTERS).length, 'dos revientan igual');
});

test('la tostadora muere como siempre: mismo parte, mismas piezas', () => {
  const pick = (n: number): number => n - 1;
  assert.deepEqual(downReport(INFO, pick, characterDown('tostadora')), downReport(INFO, pick));
  assert.equal(characterDown('tostadora').debris, 'despiece');
  assert.equal(downReport(INFO, pick)[0]!.text, DOWN_UNIT);
  assert.equal(characterDown('no-existe'), characterDown('tostadora'));
});

test('el parte de baja dice quién era y lo justifica a su manera', () => {
  for (const [id, d] of Object.entries(CHARACTER_DOWNS)) {
    for (let i = 0; i < Math.max(d.coverage.length, d.advice.length); i++) {
      const lines = downReport(INFO, (n) => i % n, d);
      assert.equal(lines[0]!.text, d.unit);
      assert.ok(d.coverage.includes(lines[2]!.text), `${id}: excusa ajena`);
      assert.ok(d.advice.includes(lines[5]!.text), `${id}: recomendación ajena`);
      assert.equal(lines[4]!.label, d.lifeLabel);
    }
    if (id === 'tostadora') continue;
    // At least two lines of its own in each pool: not just the toaster's jokes again.
    assert.ok(d.coverage.filter((t) => !DOWN_COVERAGE.includes(t)).length >= 2, `${id}: excusas propias`);
    assert.ok(d.advice.filter((t) => !DOWN_ADVICE.includes(t)).length >= 2, `${id}: recomendaciones propias`);
  }
  assert.match(characterDown('becario').unit, /sin número de serie/);
  assert.equal(characterDown('becario').lifeLabel, 'Prácticas');
  assert.equal(characterDown('movil').unit, CHARACTERS.movil!.name);
});

test('el Becario no es un electrodoméstico: ni chatarra, ni humo, ni chispas', () => {
  const b = characterDown('becario');
  assert.equal(b.scrap, false);
  assert.equal(b.smoke, undefined);
  assert.equal(b.sparks, undefined);
  for (const id of ['tostadora', 'batidora-vaso', 'plancha', 'movil']) {
    const d = characterDown(id);
    assert.ok(d.scrap && d.sparks, `${id} es un aparato: suelta chatarra y echa chispas`);
  }
  // A phone does not smoke; the Plancha lets off steam, not smoke.
  assert.equal(characterDown('movil').smoke, undefined);
  assert.equal(characterDown('plancha').smoke?.steam, true);
});
