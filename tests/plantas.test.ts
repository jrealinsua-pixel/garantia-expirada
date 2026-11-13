import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fontText, textWidth } from '../src/art/font.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { ITEMS } from '../src/data/items.ts';
import { FLOOR_NAMES, RUN_WIN_HINT, RUN_WIN_RESOLUTION, RUN_WIN_STAMP, RUN_WIN_TITLE, runWinReport, WIN_HINT_NEXT, winReport } from '../src/data/texts.ts';
import { emptyProfile, recordFloor, recordRun } from '../src/sim/profile.ts';
import { BOSS_DEATH, checkInvariants, createWorld, DT, enterRoom, FINALE_DELAY, giveItem, isLastFloor, LAST_LEVEL, NO_INPUT, nextFloor, step } from '../src/sim/world.ts';
import type { SimEvent } from '../src/sim/world.ts';

test('encadenar plantas: tras ganar la planta 1 se sigue en la 2 con la misma tostadora', () => {
  const w = createWorld({ seed: 'cadena', floor: true });
  const p = w.player;
  giveItem(w, 'pila');
  p.coupons = 37;
  p.tickets = 2;
  p.hp = 3;
  assert.equal(nextFloor(w), null, 'sin ganar no hay siguiente planta');
  w.won = true;
  const n = nextFloor(w)!;
  assert.ok(n, 'la planta 1 ganada lleva a la 2');
  assert.equal(n.level, 2);
  assert.notEqual(n.seed, w.seed);
  const q = n.player;
  assert.equal(q.coupons, 37);
  assert.equal(q.tickets, 2);
  assert.equal(q.hp, 3);
  assert.deepEqual(q.items, p.items);
  assert.deepEqual(q.arsenal.map((ws) => ws.base.id), p.arsenal.map((ws) => ws.base.id));
  assert.ok(q.arsenal.includes(q.weapon), 'el arma en la mano está en el arsenal');
  // At the new floor's entrance, standing still.
  assert.equal(n.floor!.current, n.floor!.layout.start);
  assert.equal(n.room.kind, 'start');
  assert.deepEqual([q.x, q.y, q.vx, q.vy], [n.room.playerStart.x, n.room.playerStart.y, 0, 0]);
  // Its rooms are floor 2's, and nothing it already has comes up again.
  for (const st of n.floor!.rooms) if (ROOMS[st.template.id]!.kind === 'combat') assert.equal(ROOMS[st.template.id]!.level, 2);
  for (const id of p.items) assert.ok(!n.floor!.items.includes(id), `${id} otra vez en la planta 2`);
  for (const ws of p.arsenal) assert.ok(!n.floor!.weapons.includes(ws.base.id));
  // And it plays.
  for (let i = 0; i < 3 / DT; i++) step(n, { ...NO_INPUT, moveX: i % 120 < 60 ? 1 : -1, fire: true });
  assert.deepEqual(checkInvariants(n), []);
  // Same floor, same next floor (seeded).
  assert.equal(nextFloor(w)!.floor!.rooms.map((r) => r.template.id).join(), n.floor!.rooms.map((r) => r.template.id).join());
});

test('encadenar plantas: tras ganar la planta 2 se sube a la Juguetería, con el Muñeco de Moda en el Escaparate', () => {
  const w = createWorld({ seed: 'cadena-3', floor: true, level: 2 });
  w.player.coupons = 12;
  w.won = true;
  const n = nextFloor(w)!;
  assert.ok(n, 'la planta 2 ganada lleva a la 3');
  assert.equal(n.level, 3);
  assert.equal(n.player.coupons, 12);
  for (const st of n.floor!.rooms) assert.equal(ROOMS[st.template.id]!.level, 3, st.template.id);
  // Its boss room holds El Muñeco de Moda (M10 5b), not the Router any more.
  const boss = n.floor!.rooms.find((st) => st.template.kind === 'boss')!;
  assert.equal(boss.template.id, 'jefe-jugueteria');
  // (Or La Consola Edición Coleccionista, M14 (j4): the seed picks.)
  assert.ok(/[DÈ]/.test(boss.template.rows.join('')), 'el Muñeco (o la Consola) espera en el Escaparate');
  assert.ok(!boss.template.rows.join('').includes('X'), 'el Router se queda en Informática');
  assert.ok(FLOOR_NAMES[3], 'la planta 3 tiene nombre');
  for (let i = 0; i < 3 / DT; i++) step(n, { ...NO_INPUT, moveX: i % 120 < 60 ? 1 : -1, fire: true });
  assert.deepEqual(checkInvariants(n), []);
});

test('encadenar plantas: tras ganar la planta 3 se sube a las Oficinas, con el Director en la Sala de Juntas', () => {
  const w = createWorld({ seed: 'cadena-4', floor: true, level: 3 });
  w.player.coupons = 9;
  w.player.items = ['pila'];
  w.won = true;
  const n = nextFloor(w)!;
  assert.ok(n, 'la planta 3 ganada lleva a la 4');
  assert.equal(n.level, 4);
  assert.equal(n.player.coupons, 9);
  assert.deepEqual(n.player.items, ['pila']);
  assert.equal(n.room.kind, 'start');
  for (const st of n.floor!.rooms) assert.equal(ROOMS[st.template.id]!.level, 4, st.template.id);
  // El Director de Recursos Inhumanos (M10 planta 4 5b) waits in the Sala de Juntas.
  const boss = n.floor!.rooms.find((st) => st.template.kind === 'boss')!;
  assert.equal(boss.template.id, 'jefe-oficinas');
  assert.ok(boss.template.rows.join('').includes('E'), 'el Director espera en la Sala de Juntas');
  assert.ok(FLOOR_NAMES[4], 'la planta 4 tiene nombre');
  for (let i = 0; i < 3 / DT; i++) step(n, { ...NO_INPUT, moveX: i % 120 < 60 ? 1 : -1, fire: true });
  assert.deepEqual(checkInvariants(n), []);
});

test('encadenar plantas: la última planta no tiene siguiente, y una sala suelta tampoco', () => {
  const last = createWorld({ seed: 'ultima', floor: true, level: LAST_LEVEL });
  last.won = true;
  assert.equal(nextFloor(last), null);
  const room = createWorld({ seed: 'suelta', room: 'jefe' });
  room.won = true;
  assert.equal(nextFloor(room), null);
});

test('historial: una planta superada a mitad de partida cuenta como planta, no como partida', () => {
  const gear = { character: 'tostadora', items: ['pila'], weapons: ['secador'] };
  let p = recordFloor(emptyProfile(), { ...gear, seconds: 300 });
  assert.equal(p.runs, 0);
  assert.equal(p.floorsCleared, 1);
  assert.equal(p.bestFloorSeconds, 300);
  assert.deepEqual(p.wins, { tostadora: 1 });
  assert.deepEqual(p.found.items, ['pila']);
  // The run ends on floor 2: one run, two floors, the fastest floor is the second one's time.
  p = recordRun(p, { ...gear, outcome: 'floor', seconds: 560, floorSeconds: 260, kills: 80, coupons: 50, bosses: ['nevera-suprema', 'nevera-suprema'] });
  assert.equal(p.runs, 1);
  assert.equal(p.floorsCleared, 2);
  assert.equal(p.bestFloorSeconds, 260);
  assert.equal(p.longestRun, 560);
  // Taken down on floor 2 after clearing floor 1: a run, a down, one floor.
  let d = recordFloor(emptyProfile(), { ...gear, seconds: 300 });
  d = recordRun(d, { ...gear, outcome: 'down', seconds: 400, kills: 40, coupons: 10, bosses: ['nevera-suprema'] });
  assert.deepEqual([d.runs, d.downs, d.floorsCleared, d.longestRun], [1, 1, 1, 400]);
});

test('el parte de planta superada anuncia la siguiente planta y cabe', () => {
  for (const [n, name] of Object.entries(FLOOR_NAMES)) {
    assert.ok(textWidth(fontText(name)) <= 210, name);
    const lines = winReport({ room: 'Cámara Frigorífica de la Dirección', seconds: 999, kills: 99, coupons: 999, next: Number(n) }, () => 0);
    assert.equal(lines.find((l) => l.label === 'Siguiente')!.text, name);
  }
  assert.ok(FLOOR_NAMES[2], 'la planta 2 tiene nombre');
  assert.ok(WIN_HINT_NEXT.length < 40);
});

test('el parte de planta superada no da por hecho si el jefe es jefa o jefe, y cabe', () => {
  const r = winReport({ room: 'Sala de Redes', seconds: 60, kills: 1, coupons: 1 }, () => 0).find((l) => l.label === 'Resultado')!.text;
  assert.doesNotMatch(r, /^Jef[ae] /, 'la Nevera es jefa y el Router, jefe');
  assert.ok(textWidth(fontText(r)) <= 210);
});

test('encadenar plantas: tras ganar la planta 4 se sube a Atención al Cliente, la última, con lo de abajo', () => {
  assert.equal(LAST_LEVEL, 5);
  const w = createWorld({ seed: 'cadena-5', floor: true, level: 4 });
  w.player.coupons = 21;
  w.player.items = ['pila'];
  w.won = true;
  const n = nextFloor(w)!;
  assert.ok(n, 'la planta 4 ganada lleva a la 5');
  assert.equal(n.level, 5);
  assert.equal(n.player.coupons, 21);
  assert.deepEqual(n.player.items, ['pila']);
  assert.ok(isLastFloor(n) && !isLastFloor(w));
  // All its own rooms; La Centralita (M11 5b) waits in hers.
  for (const st of n.floor!.rooms) {
    const t = ROOMS[st.template.id]!;
    assert.equal(t.level, 5, st.template.id);
    if (t.kind === 'boss') assert.equal(t.id, 'jefe-atencion');
  }
  // Its items are in the decks now (floor 5's own, M11 6a-6b).
  const deck = [...n.floor!.items, ...n.floor!.actives];
  assert.ok(deck.some((id) => ITEMS[id]?.level === 5), 'ningún objeto de la planta 5 en sus cofres');
  assert.ok(FLOOR_NAMES[5], 'la planta 5 tiene nombre');
  for (let i = 0; i < 3 / DT; i++) step(n, { ...NO_INPUT, moveX: i % 120 < 60 ? 1 : -1, fire: true });
  assert.deepEqual(checkInvariants(n), []);
});

test('la última planta: su jefe no deja montacargas y la partida se gana sola al poco', () => {
  const w = createWorld({ seed: 'final', floor: true, level: LAST_LEVEL });
  const bossRoom = w.floor!.rooms.findIndex((st) => st.template.kind === 'boss');
  enterRoom(w, bossRoom, 'S');
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.boss)!;
  assert.ok(boss, 'hay jefe');
  boss.damageTaken = boss.def.hp;
  const seen: SimEvent[] = [];
  const run = (s: number): void => {
    for (let i = 0; i < Math.ceil(s / DT) && !w.won; i++) {
      step(w, NO_INPUT);
      seen.push(...w.events);
    }
  };
  run(BOSS_DEATH + 0.2);
  assert.ok(!w.enemies.some((e) => e.def.boss), 'el jefe ha caído');
  assert.equal(w.lift, null, 'no hay montacargas en la última planta');
  assert.ok(w.finale, 'empieza el final');
  assert.ok(!seen.some((e) => e.type === 'lift'));
  assert.equal(w.won, false, 'aún no: primero salen los cupones');
  const coupons = w.pickups.filter((k) => k.kind === 'cupon').length + w.player.coupons;
  assert.ok(coupons >= 5, 'los cupones del jefe salen igual');
  run(FINALE_DELAY + 0.5);
  assert.equal(w.won, true);
  const done = seen.find((e) => e.type === 'floorDone');
  assert.ok(done && done.type === 'floorDone' && done.final === true, 'la partida entera ganada');
  assert.ok(w.finale!.t >= FINALE_DELAY - DT && w.finale!.t <= FINALE_DELAY + DT);
  // There is nothing upstairs: the run ends (and the hub comes next).
  assert.equal(nextFloor(w), null);
  assert.deepEqual(checkInvariants(w), []);
});

test('el parte de la partida ganada: «Su incidencia ha sido cerrada», y cabe en el formulario', () => {
  for (let k = 0; k < 6; k++) {
    const lines = runWinReport({ room: 'Sala de Juntas (Aquí No Se Decide Nada)', seconds: 300, kills: 40, coupons: 61, floors: 5, totalSeconds: 3125, totalKills: 412 }, (n) => k % n);
    assert.equal(lines.length, 6);
    assert.ok(lines.every((l) => l.text.length > 0));
    assert.match(lines[3]!.text, /5 plantas · 52:05 · Bajas: 412 · Cupones: 61/);
  }
  assert.equal(RUN_WIN_TITLE, 'Su incidencia ha sido cerrada');
  for (const s of [RUN_WIN_TITLE, RUN_WIN_STAMP, RUN_WIN_HINT, ...RUN_WIN_RESOLUTION]) assert.ok(textWidth(fontText(s)) <= 210, s);
});
