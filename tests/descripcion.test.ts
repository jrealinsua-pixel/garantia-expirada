import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeLines, modifierLines, weaponLines } from '../src/data/describe.ts';
import { ACTIVE_ITEMS, ITEMS } from '../src/data/items.ts';
import { FINDABLE_WEAPONS, WEAPONS } from '../src/data/weapons.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';

const glyphs = new Set([...FONT_CHARS, ' ', '\n']);

/** Every line can be drawn with «Letra Pequeña» and fits in the window. */
function drawable(text: string): void {
  for (const ch of fontText(text)) assert.ok(glyphs.has(ch), `«${text}»: la fuente no tiene «${ch}»`);
  assert.ok(textWidth(text) <= 250, `«${text}» no cabe en la ventana (${textWidth(text)} px)`);
}

test('cada objeto pasivo dice lo que hace, y lo que da y lo que quita va con su color', () => {
  for (const it of Object.values(ITEMS)) {
    const lines = modifierLines(it.mod);
    assert.ok(lines.length > 0, `${it.id} no dice nada`);
    for (const l of lines) drawable(l.text);
  }
  assert.deepEqual(modifierLines(ITEMS.pila!.mod), [
    { text: 'Cadencia +30 %', good: true },
    { text: 'Cargador -30 %', good: false },
  ]);
  assert.deepEqual(modifierLines(ITEMS.garantia!.mod), [{ text: '+1 corazón', good: true }]);
  assert.deepEqual(modifierLines(ITEMS.cinta!.mod), [{ text: 'Tiempo de recarga -40 %', good: true }]);
  assert.deepEqual(modifierLines(ITEMS.manual!.mod), [{ text: 'Rebota 2 veces', good: true }]);
  const res = modifierLines(ITEMS.resistencia!.mod);
  assert.ok(res.some((l) => l.text === 'Daño +1' && l.good));
  assert.ok(res.some((l) => l.text === 'Cadencia -30 %' && !l.good));
  assert.ok(res.some((l) => l.text === 'Retroceso +40 %' && !l.good), 'más retroceso es peor');
  assert.ok(modifierLines(ITEMS.etiqueta!.mod).every((l) => l.good), 'algunos objetos solo son buenos');
});

test('las sinergias y los objetos activos también se pueden describir', () => {
  for (const s of Object.values(SYNERGIES)) for (const l of modifierLines(s.mod)) drawable(l.text);
  for (const a of Object.values(ACTIVE_ITEMS)) {
    const lines = activeLines(a);
    assert.ok(lines[1]!.text.includes(String(a.charges)), 'dice cuántas pilas necesita');
    for (const l of lines) drawable(l.text);
  }
  assert.equal(activeLines(ACTIVE_ITEMS.espera!)[0]!.text, 'Congela la sala 3,5 s');
});

test('las armas enseñan sus números, y son distintos entre sí', () => {
  const seen = new Set<string>();
  for (const id of FINDABLE_WEAPONS) {
    const lines = weaponLines(WEAPONS[id]!);
    for (const l of lines) drawable(l.text);
    seen.add(lines.map((l) => l.text).join('|'));
  }
  assert.equal(seen.size, FINDABLE_WEAPONS.length);
  assert.ok(weaponLines(WEAPONS.plancha!)[0]!.text.includes('×'), 'la plancha dice que dispara varias nubes');
});
