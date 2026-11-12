// M12 (1): los requisitos del Servicio Técnico, guardados entre partidas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProfile, parseProfile, recordRun, type Profile, type RunResult } from '../src/sim/profile.ts';
import { serviceBoard, serviceMet, winnersNeeded } from '../src/sim/unlocks.ts';
import { FLOOR_BOSSES, SERVICE, SERVICE_REQUIREMENTS } from '../src/data/servicio.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import { EXPEDIENTE, LORE } from '../src/data/lore.ts';
import { FONT_CHARS, fontText } from '../src/art/font.ts';

const run = (over: Partial<RunResult> = {}): RunResult => ({
  character: 'tostadora',
  outcome: 'down',
  seconds: 300,
  kills: 20,
  coupons: 3,
  bosses: [],
  level: 1,
  cause: { by: 'microondas', how: 'bullet' },
  items: [],
  weapons: ['secador'],
  ...over,
});
const played = (...runs: RunResult[]): Profile => runs.reduce((p, r) => recordRun(p, r), emptyProfile());
const SECRETS = LORE.filter((l) => 'secret' in l.source).map((l) => l.id);
/** A run that beats every floor boss and wins, with the secret documents given. */
const win = (docs: readonly string[] = SECRETS, character = 'tostadora'): RunResult =>
  run({ outcome: 'floor', level: 5, bosses: [...FLOOR_BOSSES], docs, character });

test('los requisitos son datos con sentido: los cinco jefes existen y cada texto cabe y se escribe con la fuente', () => {
  assert.equal(FLOOR_BOSSES.length, 5);
  for (const b of FLOOR_BOSSES) assert.ok(ENEMIES[b]?.boss, `${b} es un jefe`);
  assert.equal(new Set(SERVICE_REQUIREMENTS.map((r) => r.id)).size, SERVICE_REQUIREMENTS.length);
  const texts = [...SERVICE_REQUIREMENTS.flatMap((r) => [r.text.replace('{n}', '10'), r.one ?? '']), SERVICE.title, SERVICE.pending, SERVICE.granted, SERVICE.fewProducts];
  for (const s of texts) for (const ch of fontText(s)) assert.ok(ch === ' ' || FONT_CHARS.includes(ch), `«${ch}» de «${s}» está en la fuente`);
});

test('un perfil nuevo no tiene cita, y el cartel enseña cada requisito a cero', () => {
  const p = emptyProfile();
  assert.equal(p.service, false);
  assert.equal(serviceMet(p), false);
  const b = serviceBoard(p);
  assert.equal(b.granted, false);
  assert.deepEqual(b.rows.map((r) => r.id), ['jefes', 'victorias', 'expediente']);
  assert.ok(b.rows.every((r) => r.done === 0 && !r.met));
  assert.equal(b.rows[0]!.needed, 5);
  assert.equal(b.rows[2]!.needed, EXPEDIENTE.length);
  // The Servicio Técnico's own papers are found beyond the appointment: it does not ask for them.
  assert.ok(EXPEDIENTE.length < LORE.length && EXPEDIENTE.every((l) => !l.beyond));
  assert.match(b.rows[0]!.text, /5 jefes/);
});

test('mientras se pueda jugar con menos de tres, basta con ganar con los que hay (y el cartel lo dice)', () => {
  const playable = Object.keys(CHARACTERS).length;
  assert.equal(winnersNeeded(3), Math.min(3, playable));
  const b = serviceBoard(emptyProfile());
  assert.equal(b.rows[1]!.needed, Math.min(3, playable));
  assert.equal(b.fewProducts, playable < 3);
  if (playable === 1) assert.equal(b.rows[1]!.text, SERVICE_REQUIREMENTS[1]!.one);
});

test('ganar una partida se apunta como victoria del personaje; caer en la planta 5, no', () => {
  const p = played(run({ level: 5, bosses: ['centralita'] }), win([]));
  assert.deepEqual(p.victories, { tostadora: 1 });
  assert.equal(p.downs, 1);
});

test('la cita llega al cumplirse todo, en la partida que lo cumple, y se queda para siempre', () => {
  // Gana sin el expediente completo: aún no.
  let p = played(win([]));
  assert.equal(p.service, false);
  assert.equal(serviceBoard(p).rows[0]!.met, true, 'los cinco jefes, sí');
  assert.equal(serviceBoard(p).rows[1]!.met, Object.keys(CHARACTERS).length === 1);
  assert.equal(serviceBoard(p).rows[2]!.met, false, 'faltan las secretas');
  // Una partida que cae pero encuentra lo que faltaba la cumple (los requisitos valen de cualquier partida).
  p = recordRun(p, run({ docs: SECRETS }));
  // With more than one to play, it also needs a win with the others (one each, up to three).
  for (const c of Object.keys(CHARACTERS).slice(1, 3)) {
    assert.equal(p.service, false, `falta ganar con ${c}`);
    p = recordRun(p, win([], c));
  }
  assert.equal(p.service, true);
  assert.equal(p.last?.service, true, 'la partida lo apunta para anunciarlo en el Mostrador');
  // La siguiente ya no lo anuncia, pero la cita sigue.
  const q = recordRun({ ...p, service: true }, run());
  assert.equal(q.service, true);
  assert.equal(q.last?.service, undefined);
});

test('sin todos los requisitos no hay cita: falta un jefe, un documento o una victoria', () => {
  const allBut = (b: string): RunResult => run({ bosses: FLOOR_BOSSES.filter((x) => x !== b), docs: SECRETS, level: 5 });
  assert.equal(played(allBut('muneco-moda')).service, false, 'sin el Muñeco ni victoria');
  assert.equal(played(win(SECRETS.slice(1))).service, false, 'falta un documento');
  // Los cinco jefes (en dos partidas) y todo el expediente, pero ninguna partida ganada.
  assert.equal(played(run({ bosses: FLOOR_BOSSES.slice(0, 4), docs: SECRETS, level: 5 }), run({ bosses: ['centralita'], level: 5 })).service, false);
});

test('la cita y las victorias se guardan y se leen; un guardado viejo que ya venció a la Centralita cuenta como victoria', () => {
  const p = played(win());
  const back = parseProfile(JSON.stringify(p));
  assert.deepEqual(back.victories, p.victories);
  assert.equal(back.service, p.service);
  // Un guardado de antes de M12: sin victorias ni cita, pero con la Centralita vencida y todo el expediente.
  const old = JSON.parse(JSON.stringify(p)) as Record<string, unknown>;
  delete old.victories;
  delete old.service;
  const migrated = parseProfile(JSON.stringify(old));
  assert.deepEqual(migrated.victories, { tostadora: 1 });
  assert.equal(migrated.service, serviceMet(migrated));
  // Una cita guardada no se pierde aunque el guardado no cumpla (una versión que pide más).
  assert.equal(parseProfile(JSON.stringify({ service: true })).service, true);
  assert.equal(parseProfile(JSON.stringify({ service: 'sí' })).service, false);
});

test('el teléfono confirma la cita en cuanto se concede, y el Chatarrero señala el cartel mientras no', async () => {
  const { stationPages } = await import('../src/sim/dialogue.ts');
  const granted = { ...played(win()), service: true };
  assert.match(stationPages('telefono', granted).join(' '), /cita previa/);
  const three = played(run({ bosses: ['nevera-suprema', 'router-wifi', 'muneco-moda'], level: 3 }));
  assert.equal(three.service, false);
  assert.doesNotMatch(stationPages('telefono', three).join(' '), /cita previa/);
  // El Chatarrero tiene la pista entre sus candidatas (elige por partidas jugadas): alguna vez la dice.
  const said = new Set<string>();
  let p = three;
  for (let i = 0; i < 8; i++) {
    said.add(stationPages('chatarrero', p).join(' '));
    p = recordRun(p, run());
  }
  assert.ok([...said].some((t) => t.includes('cita previa')), 'el Chatarrero habla de la cita previa');
});
