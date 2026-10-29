// The humour guide (docs/DISENO.md, «Tono y guía de humor») as checks over every visible text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as TEXTS from '../src/data/texts.ts';
import { ACTIVE_ITEMS, ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { DUMMIES, PROPS } from '../src/data/props.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { GOOD_NAMES, SHOPKEEPER } from '../src/data/shop.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';

/** Every string inside a value (objects and arrays, not functions). */
function strings(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === 'object') for (const x of Object.values(v)) strings(x, out);
  return out;
}

/** The visible fields of the content definitions (ids, sprites and the like are not visible). */
const VISIBLE = new Set(['name', 'description', 'text', 'title', 'motto']);
function fields(v: unknown, out: string[] = []): string[] {
  if (Array.isArray(v)) for (const x of v) fields(x, out);
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (VISIBLE.has(k) && typeof x === 'string') out.push(x);
      else if (typeof x === 'object') fields(x, out);
    }
  }
  return out;
}

const content = [ITEMS, ACTIVE_ITEMS, WEAPONS, SYNERGIES, ENEMIES, ROOMS, PROPS, DUMMIES, CHARACTERS];
const BASE = [...strings(Object.fromEntries(Object.entries(TEXTS).filter(([, v]) => typeof v !== 'function'))), ...strings(SHOPKEEPER), ...strings(GOOD_NAMES), ...content.flatMap((c) => fields(c))];

// The texts built by functions, with sample values.
const ALL = [
  ...BASE,
  TEXTS.bossPhaseLabel(2),
  TEXTS.activeHint(1),
  TEXTS.activeHint(3),
  TEXTS.inventoryBatteries(1, 2),
  ...TEXTS.downReport({ by: 'microondas', how: 'bullet', room: 'Sala', seconds: 90, kills: 3, coupons: 4 }, () => 0).map((l) => [l.label, l.text].filter(Boolean).join(' ')),
];

test('hay textos que revisar (el recolector funciona)', () => {
  assert.ok(ALL.length > 200, `solo ${ALL.length} textos`);
  assert.ok(ALL.includes('Pila Casi Agotada'));
  assert.ok(ALL.includes(TEXTS.DOWN_ADVICE[0]!));
});

test('seco: ningún texto lleva signos de exclamación', () => {
  for (const s of ALL) assert.ok(!/[!¡]/.test(s), `«${s}» grita`);
});

test('todo se puede escribir con «Letra Pequeña» y sin espacios de más', () => {
  const glyphs = new Set([...FONT_CHARS, ' ', '\n']);
  for (const s of ALL) {
    for (const ch of fontText(s)) assert.ok(glyphs.has(ch), `«${s}»: la fuente no tiene «${ch}»`);
    assert.equal(s, s.trim(), `«${s}» tiene espacios al principio o al final`);
    assert.ok(!/ {2}/.test(s), `«${s}» tiene dos espacios seguidos`);
    assert.ok(!/ [.,:;]/.test(s), `«${s}» tiene un espacio antes de un signo`);
  }
});

test('corto: nombres de 2 a 4 palabras y descripciones de pocas frases', () => {
  const things = [...Object.values(ITEMS), ...Object.values(ACTIVE_ITEMS), ...Object.values(WEAPONS)];
  for (const t of things) {
    const words = t.name.split(' ').length;
    assert.ok(words >= 2 && words <= 4, `«${t.name}» tiene ${words} palabras`);
    const sentences = t.description.split(/[.?]\s/).length;
    // Two sentences; three only when the last one is a short warning, like the approved Plancha.
    assert.ok(sentences <= 3, `«${t.name}»: ${sentences} frases`);
    assert.ok(t.description.length <= 110, `«${t.name}»: descripción de ${t.description.length} caracteres`);
    assert.ok(/[.?»]$/.test(t.description), `«${t.name}»: la descripción no acaba en punto`);
  }
  for (const e of Object.values(ENEMIES)) assert.ok(e.description.split(/[.?]\s/).length <= 2, `${e.id}: más de dos frases`);
});

test('variado: no se repite el mismo chiste en dos sitios', () => {
  const seen = new Map<string, number>();
  // Names that are meant to appear twice (the chest and the shop register are also props).
  const shared = new Set([
    TEXTS.CHEST_NAME, SHOPKEEPER.name, ...Object.values(GOOD_NAMES), ...Object.values(TEXTS.PAUSE_MENU),
    TEXTS.OPTIONS_TITLE, TEXTS.CONTROLS_TITLE, TEXTS.INVENTORY_TITLE, TEXTS.CREDITS_TITLE, TEXTS.TITLE, TEXTS.DOWN_UNIT,
    'La Nevera Suprema',
    // Key names and actions: the controls screen and Opciones › Teclas use the same words.
    ...Object.values(TEXTS.KEYS_ACTIONS), ...Object.values(TEXTS.DEFAULT_KEY_WORDS).flatMap((w) => [w.own, w.all]),
  ]);
  // Only the written texts: the function-built ones quote them on purpose.
  for (const s of BASE) if (s.length > 12 && !shared.has(s)) seen.set(s, (seen.get(s) ?? 0) + 1);
  const twice = [...seen].filter(([, n]) => n > 1).map(([s]) => s);
  assert.deepEqual(twice, []);
  // The same stock phrase («es muy importante para nosotros») only once.
  const important = ALL.filter((s) => /muy importante/.test(s));
  assert.ok(important.length <= 2, `«muy importante» sale ${important.length} veces: ${important.join(' | ')}`);
});
