// M9 (6): el tablón «Productos en Exposición» del Mostrador, abierto como panel. Que enseñe a los
// cinco (a color o en silueta), cuánto falta, y que quepa a los dos tamaños de texto.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardLayout, boardTextBox, progressLabel, type BoardEntry } from '../src/render/board.ts';
import { HUD_H, HUD_W } from '../src/render/hud.ts';
import { emptyProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { rosterBoard } from '../src/sim/unlocks.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { BOARD_CARDS } from '../src/art/hub.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';
import { BOARD_FOOT, BOARD_RESTOCK, BOARD_TITLE } from '../src/data/texts.ts';

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

const entries = (p: Profile): BoardEntry[] => rosterBoard(p).map((r) => ({ ...r, soon: r.unlocked && !CHARACTERS[r.id] }));

const profiles = (): Profile[] => {
  let p = emptyProfile();
  const out = [p];
  for (let i = 0; i < 4; i++) p = recordRun(p, run());
  out.push(p);
  p = recordRun(p, run({ outcome: 'floor', bosses: ['nevera-suprema', 'router-wifi'], cause: undefined }));
  out.push(p);
  for (let i = 0; i < 10; i++) p = recordRun(p, run());
  out.push(p);
  return out;
};

test('el progreso se cuenta solo cuando hay algo que contar', () => {
  assert.equal(progressLabel([]), '');
  assert.equal(progressLabel([{ done: 0, needed: 1 }]), '', 'un jefe se vence o no');
  assert.equal(progressLabel([{ done: 3, needed: 10 }]), '3/10');
  assert.equal(progressLabel([{ done: 1, needed: 1 }, { done: 7, needed: 20 }]), '7/20');
});

test('el tablón: los desbloqueados a color, los otros en silueta, con su condición y cuánto falta', () => {
  const fresh = boardLayout(entries(emptyProfile()));
  assert.deepEqual(fresh.faces.map((f) => f.frame), [0, 6, 7, 8, 9], 'solo la Tostadora a color');
  const texts = fresh.texts.map((t) => t.text);
  assert.ok(texts.includes('Disponible al vencer a la Nevera Suprema.'));
  assert.ok(texts.includes('0/10') && texts.includes('0/20'), 'las bajas y los objetos que faltan');
  assert.equal(fresh.texts.filter((t) => t.role === 'soon').length, 0);
  const four = boardLayout(entries(profiles()[1]!));
  assert.ok(four.texts.some((t) => t.text === '4/10'));
  const beaten = boardLayout(entries(profiles()[2]!));
  assert.deepEqual(beaten.faces.map((f) => f.frame), [0, 1, 2, 8, 9]);
  // Unlocked but not playable until M13: «Reposición pronto», and the blurb instead of the condition.
  assert.equal(beaten.texts.filter((t) => t.text === BOARD_RESTOCK).length, 2);
  assert.ok(beaten.texts.some((t) => t.text.startsWith('Rápida y frágil')));
  assert.ok(!beaten.texts.some((t) => t.text.includes('Nevera Suprema')));
});

test('el tablón cabe en la pantalla y nada se sale ni se pisa, a los dos tamaños', () => {
  for (const p of profiles()) {
    for (const scale of [1, 2]) {
      const L = boardLayout(entries(p), scale);
      assert.ok(L.x >= 0 && L.y >= 0 && L.x + L.w <= HUD_W && L.y + L.h <= HUD_H, `el panel se sale (escala ${scale}): ${JSON.stringify([L.x, L.y, L.w, L.h])}`);
      const line = 10 * scale;
      for (const t of L.texts) {
        const b = boardTextBox(t, L.size);
        assert.ok(b.left >= L.x + 2 && b.right <= L.x + L.w - 2, `«${t.text}» se sale de lado (escala ${scale})`);
        assert.ok(t.y >= L.y && t.y + line <= L.y + L.h, `«${t.text}» se sale por abajo (escala ${scale})`);
      }
      // Texts on the same line do not overlap.
      for (const a of L.texts) for (const b of L.texts) {
        if (a === b || a.y !== b.y) continue;
        const A = boardTextBox(a, L.size);
        const B = boardTextBox(b, L.size);
        assert.ok(A.right + 4 <= B.left || B.right + 4 <= A.left, `«${a.text}» pisa «${b.text}» (escala ${scale})`);
      }
      for (const f of L.faces) assert.ok(f.x >= L.x && f.y + 7 * f.zoom <= L.y + L.h);
      assert.equal(L.faces.length, 5);
    }
  }
});

test('las caras caben en las tarjetas del tablón y los textos se pueden escribir', () => {
  assert.equal(BOARD_CARDS.length, 5);
  for (const s of [BOARD_TITLE, BOARD_RESTOCK, BOARD_FOOT]) assert.ok([...fontText(s)].every((c) => c === ' ' || FONT_CHARS.includes(c)), s);
});
