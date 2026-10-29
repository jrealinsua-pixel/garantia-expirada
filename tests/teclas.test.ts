// Opciones › Teclas (M7, accesibilidad parte 3): cambiar qué tecla hace qué, y que los textos
// que nombran teclas digan las de verdad.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACTIONS, actionOf, DEFAULT_KEYMAP, KEY_TEXT_W, keyLabel, keyNames, parseKeymap, rebind, RESERVED_KEYS } from '../src/render/keymap.ts';
import { parseSettings } from '../src/render/settings.ts';
import { activeHint, controlsHint, controlsRows, DEFAULT_KEY_WORDS, itemKindActive, KEYS_ACTIONS, KEYS_RESERVED, KEYS_RESET, KEYS_SUB, KEYS_WAITING, swapHint } from '../src/data/texts.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';

const up = (s: string): string => fontText(s);

test('las teclas de fábrica se llaman como siempre', () => {
  const k = keyNames(DEFAULT_KEYMAP);
  for (const a of ['move', 'roll', 'reload', 'swap', 'use'] as const) {
    assert.equal(up(k[a].own), up(DEFAULT_KEY_WORDS[a].own), a);
    assert.equal(up(k[a].all), up(DEFAULT_KEY_WORDS[a].all), a);
  }
  assert.equal(controlsHint(DEFAULT_KEY_WORDS), 'WASD mover · ratón apuntar · clic disparar · Espacio rodar · R recargar');
  assert.equal(activeHint(2), 'Q: usar · necesita 2 pilas (una por sala limpia)');
  // Every key has exactly one action.
  const all = ACTIONS.flatMap((a) => DEFAULT_KEYMAP[a]);
  assert.equal(new Set(all).size, all.length);
});

test('cambiar una tecla: la nueva pasa a ser la suya y se la quita a quien la tuviera', () => {
  const m = rebind(DEFAULT_KEYMAP, 'roll', 'KeyK');
  assert.deepEqual(m.roll, ['KeyK', 'ShiftLeft', 'ShiftRight'], 'la vieja (espacio) se va; las mayúsculas se quedan');
  assert.equal(actionOf(m, 'Space'), null);
  assert.equal(actionOf(m, 'KeyK'), 'roll');
  const n = rebind(m, 'use', 'KeyR');
  assert.deepEqual(n.use, ['KeyR']);
  assert.deepEqual(n.reload, [], 'recargar se queda sin tecla');
  assert.equal(keyNames(n).reload.own, 'sin tecla');
  const o = rebind(DEFAULT_KEYMAP, 'up', 'ArrowUp');
  assert.deepEqual(o.up, ['ArrowUp'], 'si la nueva era la de reserva, no se repite');
  for (const r of RESERVED_KEYS) assert.deepEqual(rebind(DEFAULT_KEYMAP, 'use', r), DEFAULT_KEYMAP, `${r} es de la pausa`);
  assert.deepEqual(DEFAULT_KEYMAP.roll, ['Space', 'ShiftLeft', 'ShiftRight'], 'no toca el mapa de fábrica');
});

test('los textos dicen las teclas elegidas', () => {
  let m = DEFAULT_KEYMAP;
  for (const [a, c] of [['up', 'KeyI'], ['left', 'KeyJ'], ['down', 'KeyK'], ['right', 'KeyL'], ['use', 'KeyF'], ['swap', 'KeyC']] as const) m = rebind(m, a, c);
  const k = keyNames(m);
  assert.equal(k.move.own, 'IJKL');
  assert.equal(k.move.all, 'IJKL o flechas');
  assert.equal(swapHint(k), 'C o rueda del ratón: cambiar de arma');
  assert.equal(itemKindActive(k), 'Objeto activo · se usa con F');
  assert.ok(activeHint(1, k).startsWith('F: usar'));
  let arrows = DEFAULT_KEYMAP;
  for (const [a, c] of [['up', 'ArrowUp'], ['left', 'ArrowLeft'], ['down', 'ArrowDown'], ['right', 'ArrowRight']] as const) arrows = rebind(arrows, a, c);
  assert.equal(keyNames(arrows).move.all, 'Flechas');
  // A layout-dependent key is named by what it typed.
  const n = rebind(DEFAULT_KEYMAP, 'use', 'Semicolon');
  assert.equal(keyNames(n, { Semicolon: 'ñ' }).use.own, 'Ñ');
  assert.equal(keyLabel('Numpad4'), 'Numérico 4');
  assert.equal(keyLabel('Backquote', { Backquote: '☃' }), 'Backquote', 'lo que la fuente no sabe escribir no se usa');
  assert.equal(keyLabel('Digit7'), '7');
});

test('ningún nombre de tecla se sale de su columna', () => {
  const codes = ['KeyW', 'Space', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'AltRight', 'Enter', 'Tab', 'Backspace'];
  codes.push('CapsLock', 'ArrowUp', 'ArrowLeft', 'Numpad8', 'F12', 'Digit1', 'IntlBackslash', 'Semicolon');
  for (const a of ACTIONS) {
    for (const c of codes) {
      for (const b of ACTIONS) {
        const m = rebind(rebind(DEFAULT_KEYMAP, a, c), b, codes[(codes.indexOf(c) + 5) % codes.length]!);
        const k = keyNames(m);
        for (const w of Object.values(k)) {
          assert.ok(textWidth(w.own) <= KEY_TEXT_W && textWidth(w.all) <= KEY_TEXT_W, `«${w.all}» no cabe`);
        }
        for (const [, kb] of controlsRows(k)) assert.ok(textWidth(kb) < 114, `«${kb}» no cabe en la columna del teclado`);
        const glyphs = new Set([...FONT_CHARS, ' ']);
        for (const ch of fontText(controlsHint(k))) assert.ok(glyphs.has(ch), `«${ch}» no está en la fuente`);
      }
    }
  }
});

test('un mapa guardado roto o tramposo se arregla al leerlo', () => {
  assert.deepEqual(parseKeymap(null), DEFAULT_KEYMAP);
  assert.deepEqual(parseKeymap({ up: 'KeyW' }), DEFAULT_KEYMAP, 'una lista o nada');
  assert.deepEqual(parseKeymap({ up: ['Key W'] }).up, DEFAULT_KEYMAP.up, 'códigos raros fuera');
  const m = parseKeymap({ up: ['KeyI'], down: ['KeyI', 'KeyK'], use: ['Escape', 'KeyF'] });
  assert.deepEqual(m.up, ['KeyI']);
  assert.deepEqual(m.down, ['KeyK'], 'una tecla en dos sitios: se la queda la primera');
  assert.deepEqual(m.use, ['KeyF'], 'la tecla de la pausa no se puede quitar');
  const s = parseSettings(JSON.stringify({ keys: { use: ['KeyF'] }, keyLabels: { Semicolon: 'ñ', KeyF: 'demasiado', 'Mal Código': 'x' } }));
  assert.deepEqual(s.keys.use, ['KeyF']);
  assert.deepEqual(s.keys.up, DEFAULT_KEYMAP.up);
  assert.deepEqual(s.keyLabels, { Semicolon: 'ñ' });
  assert.deepEqual(parseSettings(null).keys, DEFAULT_KEYMAP);
});

test('la pantalla de teclas cabe en su panel', () => {
  for (const t of [KEYS_SUB, KEYS_WAITING, KEYS_RESERVED, KEYS_RESET]) assert.ok(textWidth(t) <= 290, `«${t}» no cabe`);
  for (const a of ACTIONS) assert.ok(textWidth(`» ${KEYS_ACTIONS[a]}: Flecha izquierda «`) <= 290);
});
