// M13, acceptance criterion: «los cinco se distinguen a la primera en una captura». The e2e takes
// the picture (47c-los-cinco: the five in a row in the Mostrador); this checks, from the exported
// sheets, the two things that make them tell apart: each one's dominant colour is its own, and no
// two silhouettes are nearly the same shape (docs/DISENO.md, «Los cinco, en detalle»).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodePng } from '../tools/sprites/png.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { ROSTER } from '../src/data/unlocks.ts';

interface Look {
  /** Hue in 30° steps (0–11) of most of its lit pixels, or «gris» if most are unsaturated. */
  colour: string;
  /** Opaque pixels of the first idle frame, as y * 100 + x. */
  mask: Set<number>;
}

function lookOf(id: string): Look {
  const l = CHARACTERS[id]!.look;
  const sheet = decodePng(readFileSync(new URL(`../public/assets/${l.sheet}.png`, import.meta.url)));
  const counts = new Map<string, number>();
  const mask = new Set<number>();
  for (let y = 0; y < l.h; y++) {
    for (let x = 0; x < l.w; x++) {
      const [r, g, b, a] = sheet.get(x, y);
      if (a < 128) continue;
      mask.add(y * 100 + x);
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      if (max < 0.3) continue; // outline and shadows say nothing about the colour
      let key = 'gris';
      if ((max - min) / max > 0.22) {
        const d = max - min;
        const [R, G, B] = [r / 255, g / 255, b / 255];
        let h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
        h = (h * 60 + 360) % 360;
        key = String(Math.round(h / 30) % 12);
      }
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const colour = [...counts].sort((a, b) => b[1] - a[1])[0]![0];
  return { colour, mask };
}

test('los cinco del tablón son jugables y tienen hoja propia', () => {
  assert.equal(ROSTER.length, 5);
  const sheets = ROSTER.map((r) => CHARACTERS[r.id]?.look.sheet);
  assert.ok(sheets.every(Boolean), 'los cinco son jugables');
  assert.equal(new Set(sheets).size, 5, 'cada uno con su hoja');
});

test('cada uno tiene su color dominante: no hay dos del mismo', () => {
  const colours = ROSTER.map((r) => `${r.id}: ${lookOf(r.id).colour}`);
  assert.equal(new Set(colours.map((c) => c.split(': ')[1])).size, 5, colours.join(' · '));
});

test('no hay dos siluetas casi iguales', () => {
  const looks = ROSTER.map((r) => ({ id: r.id, ...lookOf(r.id) }));
  for (let i = 0; i < looks.length; i++) {
    for (let j = i + 1; j < looks.length; j++) {
      const a = looks[i]!;
      const b = looks[j]!;
      let both = 0;
      for (const k of a.mask) if (b.mask.has(k)) both++;
      const differ = 1 - both / (a.mask.size + b.mask.size - both);
      // The closest pair today is the toaster and the Becario (0.20: they share the frame and the feet).
      assert.ok(differ >= 0.18, `${a.id} y ${b.id} se parecen demasiado (${differ.toFixed(2)} de silueta distinta)`);
    }
  }
});
