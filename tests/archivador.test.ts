import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { archive, archiveCount } from '../src/sim/archive.ts';
import { LORE, LORE_MISSING, LORE_PAGE_MAX } from '../src/data/lore.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';

const run = (over: Partial<RunResult> = {}): RunResult => ({
  character: 'tostadora',
  outcome: 'down',
  seconds: 200,
  kills: 10,
  coupons: 5,
  bosses: [],
  items: [],
  weapons: ['secador'],
  ...over,
});
const played = (...runs: RunResult[]): Profile => runs.reduce((p, r) => recordRun(p, r), emptyProfile());

test('cada jefe vencido tiene su documento y cada sala secreta de las plantas que hay, el suyo', () => {
  const ids = LORE.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  const bosses = Object.keys(ENEMIES).filter((e) => ENEMIES[e]!.boss);
  for (const b of bosses) assert.equal(LORE.filter((l) => 'boss' in l.source && l.source.boss === b).length, 1, `${b} deja un documento`);
  for (const floor of [1, 2]) assert.equal(LORE.filter((l) => 'secret' in l.source && l.source.secret === floor).length, 1, `la sala secreta de la planta ${floor} guarda uno`);
  for (const l of LORE) if ('boss' in l.source) assert.ok(ENEMIES[l.source.boss]?.boss, `${l.id}: ${l.source.boss} es un jefe`);
  for (const l of LORE) {
    for (const s of [l.kind, l.title, ...l.pages]) {
      assert.ok(s.length > 0 && s.length <= LORE_PAGE_MAX, `«${s}» cabe (${s.length})`);
      for (const ch of fontText(s)) assert.ok(ch === ' ' || FONT_CHARS.includes(ch), `«${ch}» de «${s}» está en la fuente`);
    }
  }
});

test('vencer a un jefe por primera vez archiva su documento, una sola vez', () => {
  assert.deepEqual(emptyProfile().docs, []);
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.deepEqual(p.docs, ['albaran-1']);
  assert.deepEqual(p.last?.docs, ['albaran-1']);
  const q = recordRun(p, run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.deepEqual(q.docs, ['albaran-1'], 'la segunda vez no hay papel nuevo');
  assert.equal(q.last?.docs, undefined);
  const r = recordRun(q, run({ level: 2, bosses: ['router-wifi'], docs: ['ticket-1', 'inventado'] }));
  assert.deepEqual(r.docs, ['albaran-1', 'correo-1', 'ticket-1'], 'los de las salas secretas llegan con la partida; los ids raros no');
});

test('el archivador enseña lo encontrado en orden de lectura, y lo que falta como extraviado', () => {
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  const a = archive(p);
  assert.deepEqual(a.map((e) => e.id), LORE.map((l) => l.id), 'en el orden de la historia, no en el de encontrarlos');
  assert.equal(a[0]!.found, true);
  assert.equal(a[0]!.heading, 'Albarán de entrada · N.0000001 · Dirección del almacén');
  assert.equal(a[0]!.fresh, true, 'recién encontrado');
  assert.equal(a[0]!.pages.length, LORE[0]!.pages.length);
  for (const e of a.slice(1)) {
    assert.equal(e.found, false);
    assert.equal(e.heading, LORE_MISSING);
    assert.deepEqual(e.pages, [], 'no se lee lo que no se ha encontrado');
  }
  assert.deepEqual(archiveCount(p), { found: 1, total: LORE.length });
  assert.equal(archive(recordRun(p, run()))[0]!.fresh, false);
});

test('los documentos se guardan y una partida guardada de antes recibe los de sus jefes', () => {
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }), run({ docs: ['manual-1'] }));
  assert.deepEqual(parseProfile(JSON.stringify(p)).docs, ['albaran-1', 'manual-1']);
  assert.deepEqual(parseProfile(JSON.stringify({ ...p, docs: undefined })).docs, ['albaran-1']);
  assert.deepEqual(parseProfile('{"docs":{"a":1}}').docs, []);
});
