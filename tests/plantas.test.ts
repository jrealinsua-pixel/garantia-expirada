import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fontText, textWidth } from '../src/art/font.ts';
import { ROOMS } from '../src/data/rooms.ts';
import { FLOOR_NAMES, WIN_HINT_NEXT, winReport } from '../src/data/texts.ts';
import { emptyProfile, recordFloor, recordRun } from '../src/sim/profile.ts';
import { checkInvariants, createWorld, DT, giveItem, LAST_LEVEL, NO_INPUT, nextFloor, step } from '../src/sim/world.ts';

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
