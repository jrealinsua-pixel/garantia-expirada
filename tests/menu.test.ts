import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Menu } from '../src/render/menu.ts';
import { DEFAULT_SETTINGS, parseSettings } from '../src/render/settings.ts';
import { CONFIRM_MENU, CONTROLS_ROWS, CREDITS_LINES, MENU_HINT, OPTION_LABELS, PAUSE_LINES, PAUSE_MENU, QUIT_MENU, QUIT_TEXT, TITLE, TITLE_MENU, TITLE_TAGLINE } from '../src/data/texts.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';

const options = (): Menu =>
  new Menu([
    { kind: 'range', id: 'volume', label: 'Volumen de efectos', min: 0, max: 10, value: 9 },
    { kind: 'toggle', id: 'shake', label: 'Temblor de cámara', value: true },
    { kind: 'action', id: 'back', label: 'Volver' },
  ]);

test('el menú se recorre en círculo y cada tecla hace lo suyo', () => {
  const m = options();
  m.move(-1);
  assert.equal(m.current.id, 'back');
  m.move(1);
  assert.equal(m.current.id, 'volume');
  assert.deepEqual(m.adjust(1), { type: 'changed', id: 'volume', value: 10 });
  assert.deepEqual(m.adjust(1), { type: 'none' }, 'el volumen no pasa de 10');
  assert.deepEqual(m.confirm(), { type: 'changed', id: 'volume', value: 0 }, 'aceptar sobre el volumen da la vuelta');
  assert.equal(Menu.text(m.current), 'Volumen de efectos: 0/10');
  m.move(1);
  assert.deepEqual(m.adjust(-1), { type: 'changed', id: 'shake', value: false });
  assert.equal(Menu.text(m.current), 'Temblor de cámara: No');
  assert.deepEqual(m.confirm(), { type: 'changed', id: 'shake', value: true });
  m.move(1);
  assert.deepEqual(m.adjust(1), { type: 'none' });
  assert.deepEqual(m.confirm(), { type: 'action', id: 'back' });
});

test('las opciones guardadas se leen con cuidado: lo roto o raro vuelve al valor por defecto', () => {
  assert.deepEqual(parseSettings(null), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('{roto'), DEFAULT_SETTINGS);
  assert.deepEqual(parseSettings('{"volume":3,"shake":false}'), { volume: 3, shake: false });
  assert.deepEqual(parseSettings('{"volume":99,"shake":"sí"}'), { volume: 10, shake: true });
  assert.deepEqual(parseSettings('{"volume":-4.6}'), { ...DEFAULT_SETTINGS, volume: 0 });
});

test('los textos de la pausa se pueden escribir con la fuente y caben en pantalla', () => {
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const all = [TITLE, TITLE_TAGLINE, QUIT_TEXT, ...CREDITS_LINES, ...Object.values(TITLE_MENU), ...Object.values(QUIT_MENU)];
  all.push(...PAUSE_LINES, ...Object.values(PAUSE_MENU), ...Object.values(OPTION_LABELS), ...Object.values(CONFIRM_MENU), MENU_HINT, ...CONTROLS_ROWS.flat());
  for (const t of all) {
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
    assert.ok(textWidth(t) <= 460, `«${t}» no cabe`);
  }
  for (const t of [...PAUSE_LINES, QUIT_TEXT]) assert.ok(textWidth(t) <= 290, `«${t}» no cabe en el panel`);
  for (const t of CREDITS_LINES) assert.ok(textWidth(t) <= 330, `«${t}» no cabe en los créditos`);
  assert.ok(textWidth(TITLE) * 4 <= 470, 'el título, a cuatro veces su tamaño, cabe en la pantalla');
  for (const [a, k, p] of CONTROLS_ROWS) assert.ok(textWidth(a) < 104 && textWidth(k) < 114 && textWidth(p) < 100, `fila «${a}» no cabe en sus columnas`);
});
