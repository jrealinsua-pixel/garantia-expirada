// M13: la ficha de devolución que abre cada partida. Que cada personaje (los cinco del tablón)
// tenga la suya, que diga lo que tiene que decir en orden, que su número salga de la semilla y
// que quepa a los dos tamaños de texto sin que nada se pise.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { returnSlip, slipHint, slipNumber, SLIP_LABELS, STORIES } from '../src/data/stories.ts';
import { slipLayout, slipSteps } from '../src/render/ficha.ts';
import { stampBox } from '../src/render/form.ts';
import { HUD_H, HUD_W } from '../src/render/hud.ts';
import { FONT_LINE, textWidth } from '../src/art/font.ts';
import { ROSTER } from '../src/data/unlocks.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { DEFAULT_KEY_WORDS } from '../src/data/texts.ts';

test('cada personaje del tablón tiene su historia, con un sello corto', () => {
  for (const r of ROSTER) {
    const s = STORIES[r.id];
    assert.ok(s, `${r.id} sin historia`);
    for (const k of ['reason', 'customer', 'diagnosis', 'warranty', 'destination', 'stamp'] as const) assert.ok(s[k].trim(), `${r.id}: ${k} vacío`);
    assert.ok(s.stamp.length <= 14, `${r.id}: sello demasiado largo`);
    assert.equal(s.stamp, s.stamp.toUpperCase());
  }
  for (const id of Object.keys(CHARACTERS)) assert.ok(STORIES[id], `${id} se puede jugar y no tiene ficha`);
  // Each one is its own: no two share the reason, the comments or the stamp.
  for (const k of ['reason', 'customer', 'diagnosis', 'stamp'] as const) {
    const all = Object.values(STORIES).map((s) => s[k]);
    assert.equal(new Set(all).size, all.length, `dos historias con el mismo ${k}`);
  }
});

test('la ficha dice el producto, el motivo entre comillas, los comentarios, el diagnóstico, la garantía y el destino', () => {
  const rows = returnSlip('plancha', 'Plancha de Vapor');
  assert.deepEqual(rows.map((r) => r.label), Object.values(SLIP_LABELS));
  assert.equal(rows[0]!.text, 'Plancha de Vapor');
  assert.equal(rows[1]!.text, `«${STORIES['plancha']!.reason}»`);
  // An unknown id falls back to the toaster's story (never an empty slip).
  assert.equal(returnSlip('nadie', 'X')[1]!.text, `«${STORIES['tostadora']!.reason}»`);
});

test('el número de la ficha sale de la semilla de la partida', () => {
  assert.equal(slipNumber('planta-abc'), slipNumber('planta-abc'));
  assert.notEqual(slipNumber('planta-abc'), slipNumber('planta-abd'));
  assert.match(slipNumber('x'), /^RMA-\d{5}$/);
});

test('la ficha cabe en pantalla a los dos tamaños y se lee en orden, sin pisarse', () => {
  const hint = slipHint(DEFAULT_KEY_WORDS);
  for (const r of ROSTER) {
    const story = STORIES[r.id]!;
    for (const scale of [1, 2]) {
      const L = slipLayout(returnSlip(r.id, r.name), slipNumber('e2e'), story.stamp, hint, scale);
      const where = `${r.id} a ×${scale}`;
      assert.ok(L.x >= 0 && L.y >= 0 && L.x + L.w <= HUD_W && L.y + L.h <= HUD_H, `${where}: se sale de la pantalla (${L.x},${L.y} ${L.w}×${L.h})`);
      const line = FONT_LINE * scale;
      for (const t of L.texts) {
        const w = textWidth(t.text) * scale;
        assert.ok(t.x >= L.x + 2 && t.x + w <= L.x + L.w - 2, `${where}: «${t.text}» se sale por los lados`);
        assert.ok(t.y >= L.y && t.y + line <= L.y + L.h, `${where}: «${t.text}» se sale por arriba o por abajo`);
      }
      // Nothing on top of anything else.
      for (const [i, a] of L.texts.entries()) {
        for (const b of L.texts.slice(i + 1)) {
          const apart = a.x + textWidth(a.text) * scale <= b.x || b.x + textWidth(b.text) * scale <= a.x || a.y + line <= b.y || b.y + line <= a.y;
          assert.ok(apart, `${where}: «${a.text}» pisa «${b.text}»`);
        }
      }
      // Read out top to bottom, every label before its value, all of it.
      const read = L.texts.filter((t) => t.read >= 0).sort((a, b) => a.read - b.read);
      assert.equal(read.length, slipSteps(L));
      for (let i = 1; i < read.length; i++) assert.ok(read[i]!.y >= read[i - 1]!.y, `${where}: se lee desordenada`);
      for (const row of returnSlip(r.id, r.name)) assert.ok(read.some((t) => t.text === `${row.label}:`), `${where}: falta ${row.label}`);
      // The stamp stays on the slip; at the small size it has its own band and touches no text.
      const sb = stampBox(story.stamp, L.stamp);
      assert.ok(sb.x >= L.x && sb.x + sb.w <= L.x + L.w && sb.y >= L.y && sb.y + sb.h <= L.y + L.h, `${where}: el sello se sale de la ficha`);
      if (scale === 1) {
        assert.equal(L.stampFades, false);
        for (const t of L.texts) {
          const apart = sb.x + sb.w <= t.x || t.x + textWidth(t.text) <= sb.x || sb.y + sb.h <= t.y || t.y + line <= sb.y;
          assert.ok(apart, `${where}: el sello tapa «${t.text}»`);
        }
      } else assert.equal(L.stampFades, true);
    }
  }
});
