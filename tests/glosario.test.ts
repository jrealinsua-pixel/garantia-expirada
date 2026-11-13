// M14 glosario (g1): the profile counts the enemies taken apart of each kind, so the glossary
// knows which ones the player has discovered and the achievements can ask for «100 of a kind».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import { emptyProfile, parseProfile, recordEnding, recordFloor, recordRun, type RunResult } from '../src/sim/profile.ts';
import { checkInvariants, createWorld, step } from '../src/sim/world.ts';
import { Bot } from '../src/sim/bot.ts';
import { readFileSync } from 'node:fs';
import { WEAPONS } from '../src/data/weapons.ts';
import { FONT_CHARS, fontText, textWidth } from '../src/art/font.ts';
import { glossary, GLOSSARY_ENEMIES, glossaryProgress, GLOSSARY_TAB_ORDER, GLOSSARY_WEAPONS } from '../src/sim/glossary.ts';
import { entryName, GLOSSARY, listWindow, pictureScale } from '../src/render/glosario.ts';
import {
  GLOSSARY_HINT,
  GLOSSARY_SUB,
  GLOSSARY_TABS,
  GLOSSARY_TITLE,
  GLOSSARY_UNKNOWN,
  GLOSSARY_UNKNOWN_BOSS,
  GLOSSARY_UNKNOWN_ENEMY,
  GLOSSARY_UNKNOWN_WEAPON,
  glossaryCount,
  glossaryTab,
} from '../src/data/texts.ts';

const run: RunResult = {
  character: 'tostadora',
  outcome: 'down',
  seconds: 200,
  kills: 5,
  coupons: 3,
  bosses: [],
  items: [],
  weapons: ['secador'],
  killsBy: { microondas: 3, batidora: 2 },
};

test('la partida cuenta las bajas de cada tipo, y suman lo mismo que las bajas', () => {
  const w = createWorld({ seed: 'glosario-sala', room: 'pasillo-devoluciones' });
  w.noDamage = true;
  const bot = new Bot('glosario-sala');
  for (let i = 0; i < 60 * 90 && !(w.kills > 0 && w.enemies.length === 0); i++) {
    step(w, bot.think(w));
    assert.deepEqual(checkInvariants(w), [], `tick ${i}`);
  }
  assert.ok(w.kills > 0, 'el bot ha desmontado algo');
  const sum = Object.values(w.killsBy).reduce((a, b) => a + b, 0);
  assert.equal(sum, w.kills);
  for (const id of Object.keys(w.killsBy)) assert.ok(ENEMIES[id], `${id} es un enemigo de verdad`);
});

test('el perfil suma las bajas de cada tipo de la partida, de cada planta y del final', () => {
  const p0 = emptyProfile();
  assert.deepEqual(p0.killed, {});
  const p1 = recordFloor(p0, { character: 'tostadora', seconds: 100, items: [], weapons: [], killsBy: { microondas: 4 } });
  assert.deepEqual(p1.killed, { microondas: 4 });
  assert.deepEqual(p0.killed, {}, 'el perfil viejo no cambia');
  const p2 = recordRun(p1, run);
  assert.deepEqual(p2.killed, { microondas: 7, batidora: 2 });
  // A won run (outcome «floor») counts the last floor once, not twice.
  const p3 = recordRun(p2, { ...run, outcome: 'floor', killsBy: { batidora: 1 } });
  assert.deepEqual(p3.killed, { microondas: 7, batidora: 3 });
  const p4 = recordEnding(p3, { character: 'tostadora', seconds: 60, items: [], weapons: [], killsBy: { trituradora: 1 } });
  assert.equal(p4.killed['trituradora'], 1);
  // Runs from before (no killsBy) still go in.
  const { killsBy: _, ...old } = run;
  assert.deepEqual(recordRun(p4, old).killed, p4.killed);
});

test('las bajas por tipo se guardan, y un guardado viejo o raro no rompe nada', () => {
  const p = recordRun(emptyProfile(), run);
  assert.deepEqual(parseProfile(JSON.stringify(p)).killed, { microondas: 3, batidora: 2 });
  const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
  delete old.killed;
  assert.deepEqual(parseProfile(JSON.stringify(old)).killed, {});
  assert.deepEqual(parseProfile(JSON.stringify({ ...p, killed: { microondas: -2, batidora: 'mucho', nevera: 2.7 } })).killed, { nevera: 2 });
  assert.deepEqual(parseProfile(JSON.stringify({ ...p, killed: [1, 2] })).killed, {});
});

// (g2) The glossary screen: which entries, what each one says and that it all fits.
test('el glosario: todos los enemigos salvo las piezas de jefe, los jefes al final y por plantas, y todas las armas', () => {
  assert.ok(!GLOSSARY_ENEMIES.includes('silla-director') && !GLOSSARY_ENEMIES.includes('repetidor'));
  const bosses = GLOSSARY_ENEMIES.filter((id) => ENEMIES[id]!.boss);
  assert.deepEqual(bosses, ['nevera-suprema', 'lavadora-eco', 'router-wifi', 'nube-almacenamiento', 'muneco-moda', 'director-rrhh', 'centralita', 'trituradora']);
  assert.deepEqual(GLOSSARY_ENEMIES.slice(-bosses.length), bosses);
  assert.equal(GLOSSARY_ENEMIES.length, Object.values(ENEMIES).filter((e) => e.glossary !== false).length);
  assert.deepEqual([...GLOSSARY_WEAPONS].sort(), Object.keys(WEAPONS).sort());
});

test('el glosario lee el perfil: desmontado, derrotado o el que te tumbó, y las armas llevadas', () => {
  const p0 = emptyProfile();
  assert.ok(glossary(p0, 'enemies').every((e) => !e.known && e.count === 0));
  assert.deepEqual(glossaryProgress(p0, 'weapons'), { known: 0, total: GLOSSARY_WEAPONS.length });
  const p = recordRun(p0, { ...run, cause: { by: 'impresora', how: 'bullet' }, weapons: ['secador', 'grapadora'] });
  p.bosses['nevera-suprema'] = 2; // a save from before the tally: its bosses still count
  const by = (id: string) => glossary(p, 'enemies').find((e) => e.id === id)!;
  assert.deepEqual([by('microondas').known, by('microondas').count], [true, 3]);
  assert.deepEqual([by('impresora').known, by('impresora').count], [true, 0], 'el que te tumbó, conocido aunque no lo hayas desmontado');
  assert.deepEqual([by('nevera-suprema').known, by('nevera-suprema').count, by('nevera-suprema').boss], [true, 2, true]);
  assert.equal(by('webcam').known, false);
  assert.deepEqual(glossaryProgress(p, 'enemies').known, 4);
  assert.deepEqual(glossary(p, 'weapons').filter((e) => e.known).map((e) => e.id), ['secador', 'grapadora']);
});

test('el glosario: cada ficha tiene dibujo y fotograma, y sus textos se escriben con la fuente y caben', () => {
  const sheets = JSON.parse(readFileSync(new URL('../public/assets/sprites.json', import.meta.url), 'utf8')) as Record<string, { frames: number; frameW: number; frameH: number }>;
  const glyphs = new Set([...FONT_CHARS, ' ']);
  const fits = (t: string, w: number): void => {
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
    assert.ok(textWidth(t) <= w, `«${t}» no cabe (${textWidth(t)} > ${w})`);
  };
  for (const tab of GLOSSARY_TAB_ORDER) {
    for (const e of glossary(emptyProfile(), tab)) {
      const s = sheets[e.sprite];
      assert.ok(s, `${e.id}: no hay hoja «${e.sprite}»`);
      assert.ok(e.frame < s.frames, `${e.id}: fotograma ${e.frame} de ${s.frames}`);
      assert.ok(pictureScale(s.frameW, s.frameH) * s.frameH <= Math.max(GLOSSARY.picH, s.frameH), `${e.id}: el dibujo se sale del recuadro`);
      fits(entryName(tab, { ...e, known: true }), GLOSSARY.listW - 12);
      if (tab === 'merits') continue; // their texts: tests/logros.test.ts
      const desc = tab === 'weapons' ? WEAPONS[e.id]!.description : ENEMIES[e.id]!.description;
      for (const ch of fontText(desc)) assert.ok(glyphs.has(ch), `«${desc}»: falta «${ch}»`);
    }
  }
  fits(GLOSSARY_TITLE, 440);
  fits(GLOSSARY_SUB, 440);
  fits(GLOSSARY_HINT, 440);
  fits(GLOSSARY_UNKNOWN, GLOSSARY.listW - 12);
  const counts = [glossaryCount(0, false), glossaryCount(3, false), glossaryCount(0, true), glossaryCount(1, true), glossaryCount(12, true)];
  for (const t of [GLOSSARY_UNKNOWN_ENEMY, GLOSSARY_UNKNOWN_BOSS, GLOSSARY_UNKNOWN_WEAPON, ...counts]) {
    for (const ch of fontText(t)) assert.ok(glyphs.has(ch), `«${t}»: falta «${ch}»`);
  }
  for (const t of GLOSSARY_TAB_ORDER) fits(glossaryTab(GLOSSARY_TABS[t], 99, 99) + ' «»', 110);
  // The cursor stays in the window, and the window never runs past the end.
  assert.equal(listWindow(5, 14, 3), 0);
  assert.equal(listWindow(31, 14, 30), 17);
  assert.equal(listWindow(31, 14, 15), 8);
});
