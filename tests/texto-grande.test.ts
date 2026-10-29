// «Texto grande» (M7, accesibilidad parte 2): lo que se lee con calma, a doble tamaño, y que
// todo siga cabiendo: la ventana de descripción, los nombres de sala, los letreros.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FONT_LINE, textWidth, wrapLines } from '../src/art/font.ts';
import { CARD_WIDTH, CARD_WIDTH_BIG, HUD_H, HUD_W, TITLE_TOP, cardLayout, hudLayout, inside, overlaps, splitTitle, titleLines, titleX, type Box, type HudState } from '../src/render/hud.ts';
import { DEFAULT_SETTINGS, parseSettings, readScale } from '../src/render/settings.ts';
import { ACTIVE_ITEMS, ITEMS } from '../src/data/items.ts';
import { WEAPONS } from '../src/data/weapons.ts';
import { SYNERGIES } from '../src/data/synergies.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { activeLines, modifierLines, weaponLines } from '../src/data/describe.ts';
import { DOORS_OPEN_LINES, ITEM_KIND_ACTIVE, ITEM_KIND_PASSIVE, ITEM_KIND_WEAPON, LIFT_LINE, RESTOCK_LINE, SWAP_HINT, SYNERGY_LINE } from '../src/data/texts.ts';
import { SHOPKEEPER } from '../src/data/shop.ts';

/** Everything that opens a description window: name, kind, description and effect lines. */
function cards(): { name: string; kind: string; description: string; effects: string[] }[] {
  return [
    ...Object.values(ITEMS).map((i) => ({ name: i.name, kind: ITEM_KIND_PASSIVE, description: i.description, effects: modifierLines(i.mod).map((l) => l.text) })),
    ...Object.values(ACTIVE_ITEMS).map((a) => ({ name: a.name, kind: ITEM_KIND_ACTIVE, description: a.description, effects: activeLines(a).map((l) => l.text) })),
    ...Object.values(WEAPONS).map((w) => ({ name: w.name, kind: ITEM_KIND_WEAPON, description: w.description, effects: weaponLines(w).map((l) => l.text) })),
  ].map((c) => ({ ...c, effects: c.effects.slice(0, 5) }));
}

test('texto grande: se guarda, y por defecto está apagado', () => {
  assert.equal(DEFAULT_SETTINGS.bigText, false);
  assert.equal(parseSettings('{"bigText":true}').bigText, true);
  assert.equal(parseSettings('{"bigText":1}').bigText, false);
  assert.equal(readScale({ bigText: false }), 1);
  assert.equal(readScale({ bigText: true }), 2);
});

test('el partido de líneas no corta palabras, no se pasa de ancho y no pierde nada', () => {
  const s = 'Dura lo que un contrato temporal. Después, nada.';
  for (const [w, scale] of [[60, 1], [120, 1], [234, 1], [120, 2], [382, 2]] as const) {
    const lines = wrapLines(s, w, scale);
    assert.equal(lines.join(' '), s);
    for (const l of lines) assert.ok(textWidth(l) * scale <= w || !l.includes(' '), `«${l}» se pasa de ${w}`);
  }
  assert.deepEqual(wrapLines('uno\ndos', 400), ['uno', 'dos'], 'el salto de línea se respeta');
  assert.deepEqual(wrapLines('Supercalifragilístico', 10), ['Supercalifragilístico'], 'una palabra sola no se parte');
});

test('la ventana de descripción normal no cambia con el texto grande apagado', () => {
  for (const c of cards()) {
    const L = cardLayout(c.name, c.kind, c.description, c.effects, 1);
    const n = wrapLines(c.description, CARD_WIDTH - 50 - 8).length;
    assert.equal(L.w, CARD_WIDTH);
    assert.equal(L.size, 8);
    assert.equal(L.h, Math.max(48, 28 + n * 10 + 5 + c.effects.length * 10 + 3), `${c.name}: alto de antes`);
    assert.deepEqual([L.name.y, L.kind.y, L.desc.y], [6, 16, 28]);
  }
});

test('la ventana grande: todo su texto cabe dentro y entre los corazones y la munición', () => {
  const states: HudState[] = [];
  for (const magazine of [...Object.values(WEAPONS).map((w) => w.magazine), 48]) {
    for (const hasActive of [false, true]) {
      for (const hearts of [3, 10]) {
        for (const items of [0, 30]) {
          const hint = 'WASD mover · ratón apuntar · clic disparar · espacio rodar · R recargar';
          states.push({ hearts, coupons: 999, tickets: 9, hasActive, items, magazine, hint, mapW: 103, mapH: 85, bigText: true });
        }
      }
    }
  }
  for (const c of cards()) {
    const L = cardLayout(c.name, c.kind, c.description, c.effects, 2);
    assert.equal(L.w, CARD_WIDTH_BIG);
    assert.equal(L.size, 16);
    const card: Box = { x: 0, y: 0, w: L.w, h: L.h };
    const line = FONT_LINE * 2;
    const texts = [L.name, L.kind, ...L.effects];
    for (const t of texts) assert.ok(inside({ x: t.x, y: t.y, w: textWidth(t.text) * 2, h: line - 2 }, card), `${c.name}: «${t.text}» se sale`);
    for (const l of L.desc.text.split('\n')) assert.ok(L.desc.x + textWidth(l) * 2 <= L.w - 4, `${c.name}: la descripción se sale`);
    assert.ok(L.desc.y + L.desc.lines * line <= (L.effects[0]?.y ?? L.h), `${c.name}: la descripción pisa los efectos`);
    for (let i = 0; i < L.effects.length; i++) {
      for (let j = i + 1; j < L.effects.length; j++) {
        const a = L.effects[i]!;
        const b = L.effects[j]!;
        assert.ok(!overlaps({ x: a.x, y: a.y, w: textWidth(a.text) * 2, h: line }, { x: b.x, y: b.y, w: textWidth(b.text) * 2, h: line }), `${c.name}: dos efectos se pisan`);
      }
    }
    assert.equal(new Set(L.effects.map((e) => e.index)).size, c.effects.length, `${c.name}: falta algún efecto`);
    for (const s of states) {
      const l = hudLayout(s);
      const x = Math.round((HUD_W - L.w) / 2);
      for (const y of [l.cardTop, l.cardBottom - L.h]) {
        const b: Box = { x, y, w: L.w, h: L.h };
        assert.ok(inside(b, { x: 0, y: 0, w: HUD_W, h: HUD_H }), `${c.name}: la ventana grande se sale de la pantalla`);
        assert.ok(!overlaps(b, l.status), `${c.name}: la ventana grande tapa los corazones`);
        assert.ok(!overlaps(b, l.weapon), `${c.name}: la ventana grande tapa la munición`);
      }
    }
  }
});

test('el nombre de cada sala, a doble tamaño, cabe arriba en tres líneas como mucho', () => {
  const l = hudLayout({ hearts: 10, coupons: 999, tickets: 9, hasActive: true, items: 0, magazine: 14, hint: null, mapW: 103, mapH: 85, bigText: true });
  const room = l.titleSpan.right - l.titleSpan.left - 8;
  for (const r of Object.values(ROOMS)) {
    const { main, sub } = splitTitle(r.name);
    const one = titleLines(main, sub, room, 1);
    assert.equal(one.length, 1, `«${r.name}» cabe en una línea a su tamaño`);
    const lines = titleLines(main, sub, room, 2);
    assert.ok(lines.length <= 3, `«${r.name}» ocupa ${lines.length} líneas`);
    assert.equal(lines.map((t) => [t.main, t.sub].filter(Boolean).join(' ')).join(' '), [main, sub].filter(Boolean).join(' '), 'no se pierde nada');
    const tw = Math.max(...lines.map((t) => t.w)) + 8;
    const x = titleX(tw, l.titleSpan);
    assert.ok(x >= l.titleSpan.left && x + tw <= l.titleSpan.right, `«${r.name}» no cabe a doble tamaño`);
    assert.ok(TITLE_TOP + lines.length * FONT_LINE * 2 + 3 <= l.cardTop, `«${r.name}» se mete debajo de la ventana grande`);
  }
});

test('letreros, sinergias y bocadillos de la caja, a doble tamaño, caben en la pantalla', () => {
  for (const t of [SWAP_HINT, RESTOCK_LINE, LIFT_LINE, ...DOORS_OPEN_LINES]) {
    const lines = wrapLines(t, HUD_W - 40, 2);
    assert.ok(lines.length <= 2, `«${t}» ocupa ${lines.length} líneas`);
    for (const l of lines) assert.ok(textWidth(l) * 2 <= HUD_W - 40, `«${l}» no cabe`);
  }
  for (const s of Object.values(SYNERGIES)) {
    const lines = [`${SYNERGY_LINE} ${s.name}`, s.text].flatMap((t) => wrapLines(t, 440, 2));
    assert.ok(lines.length * FONT_LINE * 2 + 8 <= HUD_H - 4, `la sinergia ${s.name} no cabe`);
  }
  const said = Object.values(SHOPKEEPER).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v): v is string => typeof v === 'string');
  assert.ok(said.length > 0);
  for (const t of said) {
    const lines = wrapLines(t, 300, 2);
    assert.ok(lines.length <= 4, `la caja dice «${t}» en ${lines.length} líneas`);
  }
});
