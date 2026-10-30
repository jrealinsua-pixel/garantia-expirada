import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { cajaPages, chatarreroHere, chatarreroPages, holds, pickLine, telefonoPages, turnosScreen } from '../src/sim/dialogue.ts';
import { CAJA, CHATARRERO, DIALOGUE_PAGE_MAX, TELEFONO, TURNOS, type DialogueLine } from '../src/data/dialogues.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';

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

/** A profile after these runs, one after another. */
const played = (...runs: RunResult[]): Profile => runs.reduce((p, r) => recordRun(p, r), emptyProfile());

test('el perfil recuerda cómo acabó la última partida, y se guarda y se lee', () => {
  assert.equal(emptyProfile().last, null);
  const p = played(run({ level: 2, seconds: 312.6, cause: { by: 'router-wifi', how: 'contact' } }));
  assert.deepEqual(p.last, { character: 'tostadora', outcome: 'down', level: 2, seconds: 313, kills: 10, cause: { by: 'router-wifi', how: 'contact' } });
  assert.deepEqual(parseProfile(JSON.stringify(p)).last, p.last);
  const won = recordRun(p, run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.equal(won.last?.outcome, 'floor');
  assert.equal(won.last?.cause, undefined, 'una victoria no tiene causa de baja');
  assert.equal(won.last?.level, 1, 'sin planta, cuenta como la primera');
  // A broken or old save never breaks the hub.
  assert.equal(parseProfile('{"runs":3}').last, null);
  assert.equal(parseProfile('{"last":{"character":"tostadora","outcome":"explotó"}}').last, null);
  assert.deepEqual(parseProfile('{"last":{"character":"x","outcome":"down","level":-4,"cause":{"by":7}}}').last, { character: 'x', outcome: 'down', level: 1, seconds: 0, kills: 0 });
});

test('las condiciones de los diálogos se leen del perfil', () => {
  const p0 = emptyProfile();
  assert.ok(holds(undefined, p0));
  assert.ok(holds({ last: 'none' }, p0));
  assert.ok(!holds({ last: 'down' }, p0));
  assert.ok(!holds({ lastMinLevel: 1 }, p0), 'sin partidas no hay planta');
  const p = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }), run({ level: 2, seconds: 40, cause: { by: 'router-wifi', how: 'bullet' } }));
  assert.ok(holds({ beaten: ['nevera-suprema'], notBeaten: ['router-wifi'], minBosses: 1 }, p));
  assert.ok(!holds({ minBosses: 2 }, p));
  assert.ok(holds({ last: 'down', lastMinLevel: 2, lastByBoss: true, lastUnder: 60 }, p));
  assert.ok(!holds({ lastUnder: 40 }, p), 'el límite de tiempo es estricto');
  assert.ok(holds({ minRuns: 2, maxRuns: 2, maxFound: 1 }, p));
  assert.ok(!holds({ minFound: 1 }, p));
});

test('se elige entre las de más prioridad y no se repite la misma frase dos partidas seguidas', () => {
  const lines: DialogueLine[] = [
    { id: 'a', pages: ['a'] },
    { id: 'b', pages: ['b'] },
    { id: 'c', pages: ['c'] },
    { id: 'x', pages: ['x'], when: { minRuns: 99 }, priority: 9 },
  ];
  const seen: string[] = [];
  for (let runs = 0; runs < 9; runs++) seen.push(pickLine(lines, { ...emptyProfile(), runs }, 'prueba')!.id);
  assert.ok(!seen.includes('x'), 'la de prioridad alta no vale si no se cumple');
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.deepEqual(new Set(seen), new Set(['a', 'b', 'c']), 'salen todas');
  assert.equal(pickLine(lines, { ...emptyProfile(), runs: 4 }, 'prueba')!.id, seen[4], 'la misma visita dice lo mismo');
  assert.equal(pickLine([{ id: 'n', pages: ['n'], when: { last: 'down' } }], emptyProfile(), 's'), null);
});

test('la Caja de Devoluciones comenta la última partida: causa, jefe, planta, rapidez o victoria', () => {
  const first = cajaPages(emptyProfile());
  assert.ok(CAJA.lines.some((l) => l.when?.last === 'none' && l.pages[0] === first[0]), 'la primera vez da la bienvenida');

  const micro = cajaPages(played(run({ seconds: 300 })));
  assert.equal(micro[0], 'Motivo de la devolución: exposición prolongada a microondas.');
  assert.ok(CAJA.stamps.includes(micro.at(-1)! as never), 'acaba con un sello');

  const boss = cajaPages(played(run({ level: 2, cause: { by: 'router-wifi', how: 'bullet' } })));
  assert.equal(boss[0], 'Motivo de la devolución: exceso de cobertura.');
  const bossLines = CAJA.lines.filter((l) => l.when?.lastByBoss).map((l) => l.pages[0]);
  assert.ok(bossLines.includes(boss[1]!), 'si la tumbó un jefe, lo dice (antes que la planta)');

  const quick = cajaPages(played(run({ seconds: 25 })));
  assert.ok(CAJA.lines.filter((l) => l.when?.lastUnder).some((l) => l.pages[0] === quick[1]), 'una partida corta se nota');

  const upstairs = cajaPages(played(run({ level: 2, seconds: 400, cause: { by: 'webcam', how: 'bullet' } })));
  assert.ok(CAJA.lines.filter((l) => l.when?.lastMinLevel).some((l) => l.pages[0] === upstairs[1]), 'llegar arriba se nota');

  const nocause = cajaPages(played(run({ cause: undefined })));
  assert.equal(nocause[0], 'Motivo de la devolución: daños por mal uso.');

  const won = cajaPages(played(run({ outcome: 'floor', level: 2, bosses: ['nevera-suprema', 'router-wifi'] })));
  assert.ok(!won[0]!.startsWith('Motivo'), 'ganar no es una baja');
  assert.ok(CAJA.lines.filter((l) => l.when?.last === 'floor').some((l) => l.pages[0] === won[0]));
});

test('la grabación del teléfono avanza con los jefes vencidos', () => {
  const chapter = (p: Profile): string => TELEFONO.lines.find((l) => l.pages[0] === telefonoPages(p)[0])!.id;
  assert.equal(chapter(emptyProfile()), 'tel-0');
  assert.equal(chapter(played(run())), 'tel-0', 'caer no hace avanzar la grabación');
  const nevera = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.equal(chapter(nevera), 'tel-nevera');
  assert.equal(chapter(recordRun(nevera, run({ level: 2, bosses: ['router-wifi'] }))), 'tel-router');
  assert.equal(chapter(recordRun(nevera, run({ seconds: 1 }))), 'tel-nevera', 'una partida mala no la hace retroceder');
  for (const l of TELEFONO.lines) for (const b of l.when?.beaten ?? []) assert.ok(ENEMIES[b]?.boss, `${b} es un jefe`);
});

test('la máquina de turnos: siempre atiende al 12, y tu número son las partidas más cuatro millones', () => {
  assert.equal(turnosScreen(emptyProfile()).screen, 'Atendiendo al 12 · Su turno: 4.000.000');
  const t = turnosScreen({ ...emptyProfile(), runs: 37 });
  assert.equal(t.screen, `Atendiendo al ${TURNOS.serving} · Su turno: 4.000.037`);
  assert.ok(TURNOS.notes.includes(t.note as never));
});

test('el Chatarrero sale tras el primer jefe y da pistas de lo que falta', () => {
  assert.equal(chatarreroHere(emptyProfile()), false);
  assert.equal(chatarreroPages(played(run(), run({ level: 2 }))), null, 'llegar arriba no basta: hay que vencer a un jefe');
  const nevera = played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }));
  assert.ok(chatarreroHere(nevera));
  assert.equal(pickLine(CHATARRERO.lines, nevera, 'chatarrero')!.id, 'chat-router', 'lo primero: el jefe que falta');
  const both = recordRun(nevera, run({ outcome: 'floor', level: 2, bosses: ['router-wifi'] }));
  const hint = pickLine(CHATARRERO.lines, both, 'chatarrero')!.id;
  assert.ok(['chat-objetos', 'chat-secretas'].includes(hint), `con pocos objetos o dos jefes, otra pista (${hint})`);
  const all = { ...both, found: { ...both.found, items: Array.from({ length: 30 }, (_, i) => `o${i}`) } };
  assert.equal(pickLine(CHATARRERO.lines, { ...all, runs: 0 }, 'chatarrero')!.id === 'chat-objetos', false, 'con casi todo encontrado no insiste en los objetos');
  assert.ok(chatarreroPages(both)!.length > 0);
});

test('todos los textos del Mostrador caben en el bocadillo y se pueden escribir con la fuente', () => {
  const all = [CAJA.lines, TELEFONO.lines, CHATARRERO.lines].flat();
  const pages = [...all.flatMap((l) => l.pages), ...CAJA.stamps, ...TURNOS.notes, TURNOS.screen(12, 4_123_456), CAJA.reason('Atasco de papel con daños personales')];
  const ids = all.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'ids sin repetir');
  for (const page of pages) {
    assert.ok(page.length > 0 && page.length <= DIALOGUE_PAGE_MAX, `«${page}» cabe (${page.length})`);
    for (const ch of fontText(page)) assert.ok(ch === ' ' || FONT_CHARS.includes(ch), `«${ch}» de «${page}» está en la fuente`);
  }
  // Every hub visit, whatever the profile, gives the Caja and the phone something to say.
  const profiles = [emptyProfile(), played(run()), played(run({ outcome: 'floor', bosses: ['nevera-suprema'] }))];
  for (const p of profiles) {
    assert.ok(cajaPages(p).length > 0);
    assert.ok(telefonoPages(p).length > 0);
  }
});
