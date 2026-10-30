// M9 (7b): el archivador «Reclamaciones sin Resolver» del Mostrador, abierto como panel: la lista
// de documentos, la hoja abierta, cómo se pasa de hoja y que todo quepa a los dos tamaños.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archive, firstCursor, nextCursor } from '../src/sim/archive.ts';
import { emptyProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { archiveLayout, fit } from '../src/render/archivo.ts';
import { HUD_H, HUD_W } from '../src/render/hud.ts';
import { LORE, LORE_MISSING } from '../src/data/lore.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';
import { ARCHIVE_EMPTY, ARCHIVE_NEW, ARCHIVE_TITLE, archiveHint, DEFAULT_KEY_WORDS } from '../src/data/texts.ts';

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

const profiles = (): Profile[] => {
  const none = emptyProfile();
  const one = recordRun(none, run({ outcome: 'floor', bosses: ['nevera-suprema'], cause: undefined }));
  const two = recordRun(one, run({ docs: ['manual-1'] }));
  const all = recordRun(two, run({ outcome: 'floor', bosses: ['router-wifi'], docs: ['ticket-1'], cause: undefined }));
  return [none, one, two, all];
};

test('el archivador abre por lo último encontrado y pasa las hojas en orden, saltando lo que falta', () => {
  const [none, one, two] = profiles();
  assert.equal(firstCursor(archive(none!)).doc, -1, 'vacío: nada abierto');
  const a2 = archive(two!);
  // In the last run only the manual was found: it opens there.
  assert.deepEqual(firstCursor(a2), { doc: 1, page: 0 });
  let c = firstCursor(a2);
  const seen: string[] = [];
  for (let i = 0; i < 6; i++) {
    seen.push(`${a2[c.doc]!.id}:${c.page}`);
    c = nextCursor(a2, c);
  }
  // The manual's two pages, then round to the albarán (the correo and the ticket are missing).
  assert.deepEqual(seen, ['manual-1:0', 'manual-1:1', 'albaran-1:0', 'albaran-1:1', 'albaran-1:2', 'manual-1:0']);
  const a1 = archive(one!);
  assert.deepEqual(firstCursor(a1), { doc: 0, page: 0 });
  assert.deepEqual(nextCursor(a1, { doc: 0, page: 2 }), { doc: 0, page: 0 }, 'uno solo: vuelve a su primera hoja');
  assert.deepEqual(nextCursor(archive(none!), { doc: -1, page: 0 }), { doc: -1, page: 0 });
});

test('el panel enseña la lista, lo nuevo, la hoja abierta, y vacío lo dice', () => {
  const hint = archiveHint(DEFAULT_KEY_WORDS);
  const [none, , two] = profiles();
  const empty = archiveLayout(archive(none!), firstCursor(archive(none!)), hint);
  const et = empty.texts.map((t) => t.text);
  assert.ok(et.includes(ARCHIVE_TITLE) && et.includes(`0/${LORE.length}`));
  assert.equal(empty.texts.filter((t) => t.role === 'missing').length, LORE.length);
  assert.ok(et.join(' ').includes(ARCHIVE_EMPTY.split(' ')[0]!) && !et.includes(hint), 'vacío: sin hojas que pasar');
  const a = archive(two!);
  const L = archiveLayout(a, firstCursor(a), hint);
  const tt = L.texts.map((t) => t.text);
  assert.ok(tt.includes('2/4'));
  assert.equal(L.texts.filter((t) => t.role === 'new').map((t) => t.text).join(), ARCHIVE_NEW, 'solo el manual es nuevo');
  assert.equal(L.texts.find((t) => t.role === 'open')?.text, 'Manual de procedimiento · Página 1 de 400');
  assert.equal(L.texts.filter((t) => t.role === 'missing').length, 2);
  assert.ok(tt.some((t) => t.startsWith('Paso 1: reciba el aparato')));
  assert.ok(tt.includes('Hoja 1 de 2') && tt.includes(hint));
  assert.equal(LORE_MISSING, a[2]!.heading);
});

test('el archivador cabe en la pantalla y nada se sale ni se pisa, a los dos tamaños y en cada hoja', () => {
  const hint = archiveHint(DEFAULT_KEY_WORDS);
  for (const p of profiles()) {
    const a = archive(p);
    for (const scale of [1, 2]) {
      let c = firstCursor(a);
      for (let k = 0; k < 10; k++) {
        const L = archiveLayout(a, c, hint, scale);
        assert.ok(L.x >= 0 && L.y >= 0 && L.x + L.w <= HUD_W && L.y + L.h <= HUD_H, `se sale de la pantalla (escala ${scale})`);
        for (const t of L.texts) {
          const wd = textWidth(t.text) * scale;
          const left = t.right ? t.x - wd : t.x;
          assert.ok(left >= L.x + 2 && left + wd <= L.x + L.w - 2, `«${t.text}» se sale de lado (escala ${scale})`);
          assert.ok(t.y + 10 * scale <= L.y + L.h, `«${t.text}» se sale por abajo (escala ${scale})`);
        }
        for (const t of L.texts) for (const u of L.texts) {
          if (t === u || t.y !== u.y) continue;
          const [l1, r1] = t.right ? [t.x - textWidth(t.text) * scale, t.x] : [t.x, t.x + textWidth(t.text) * scale];
          const [l2, r2] = u.right ? [u.x - textWidth(u.text) * scale, u.x] : [u.x, u.x + textWidth(u.text) * scale];
          assert.ok(r1 + 4 <= l2 || r2 + 4 <= l1, `«${t.text}» pisa «${u.text}»`);
        }
        c = nextCursor(a, c);
      }
    }
  }
});

test('lo que no cabe en una línea se corta con puntos, y los textos se pueden escribir', () => {
  assert.equal(fit('corto', 100), 'corto');
  const cut = fit('Una línea larguísima que no cabe de ninguna manera en tan poco sitio', 80);
  assert.ok(cut.endsWith('...') && textWidth(cut) <= 80);
  for (const s of [ARCHIVE_TITLE, ARCHIVE_EMPTY, ARCHIVE_NEW, archiveHint(DEFAULT_KEY_WORDS), 'Hoja 1 de 2']) {
    assert.ok([...fontText(s)].every((ch) => ch === ' ' || FONT_CHARS.includes(ch)), s);
  }
});
