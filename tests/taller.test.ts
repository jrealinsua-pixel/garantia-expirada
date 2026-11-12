// M12 (3a): the Servicio Técnico's floor, the Taller de Reacondicionado. A short line of rooms
// (reception, workshop rooms, the boss's), no treasure, shop or secret; nothing given away; the
// five floors' enemies, reconditioned (tougher).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { floorToText, generateWorkshop, validateWorkshop, WORKSHOP_ROOMS } from '../src/sim/floor.ts';
import { checkInvariants, createWorld, DT, enterRoom, NO_INPUT, SERVICE_LEVEL, step } from '../src/sim/world.ts';
import { FLOOR_TOUGHNESS, ROOMS, slotEnemiesOf, templatesOf, toughened } from '../src/data/rooms.ts';
import { ENEMIES } from '../src/data/enemies.ts';

test('el taller: de 5 a 6 salas casi en línea, sin tesoro, tienda ni secreta, y siempre igual con la misma semilla', () => {
  const sizes = new Set<number>();
  let turns = 0;
  for (let i = 0; i < 300; i++) {
    const f = generateWorkshop(`t${i}`);
    assert.deepEqual(validateWorkshop(f), [], `t${i}\n${floorToText(f)}`);
    sizes.add(f.rooms.length);
    // A turn: three rooms in a row that are not in a straight line.
    for (let k = 1; k + 1 < f.rooms.length; k++) {
      const [a, b, c] = [f.rooms[k - 1]!, f.rooms[k]!, f.rooms[k + 1]!];
      if (b.gx - a.gx !== c.gx - b.gx || b.gy - a.gy !== c.gy - b.gy) turns++;
    }
  }
  assert.deepEqual([...sizes].sort(), [...WORKSHOP_ROOMS]);
  assert.ok(turns > 100 && turns < 300 * 3, `${turns} giros: ni recta del todo ni un zigzag`);
  assert.equal(floorToText(generateWorkshop('igual')), floorToText(generateWorkshop('igual')));
});

test('la planta 6: sus salas, nada regalado y los enemigos de las cinco plantas, más duros', () => {
  for (let i = 0; i < 12; i++) {
    const w = createWorld({ seed: `taller-${i}`, floor: true, level: SERVICE_LEVEL, service: true });
    const f = w.floor!;
    assert.deepEqual(validateWorkshop(f.layout), []);
    for (const st of f.rooms) {
      const t = ROOMS[st.template.id]!;
      // The boss's room is still floor 5's until the Trituradora (M12 (4a)).
      if (t.kind === 'boss') assert.equal(t.id, 'jefe-atencion');
      else assert.equal(t.level, SERVICE_LEVEL, t.id);
      assert.ok(st.reward !== 'ticket' && st.reward !== 'chest', `${t.id}: ${st.reward}`);
    }
  }
  assert.ok(templatesOf('combat', SERVICE_LEVEL).length >= 4);
  assert.equal(templatesOf('start', SERVICE_LEVEL)[0]!.id, 'recepcion-taller');
  // Everything the five floors have can turn up, and it takes more than on the fifth.
  assert.equal(slotEnemiesOf(SERVICE_LEVEL), slotEnemiesOf(5));
  assert.ok(FLOOR_TOUGHNESS[SERVICE_LEVEL]! > FLOOR_TOUGHNESS[5]!);
  const micro = ENEMIES.microondas!;
  assert.ok(toughened(micro, SERVICE_LEVEL).hp > toughened(micro, 5).hp);
  assert.equal(toughened(ENEMIES.centralita!, SERVICE_LEVEL).hp, ENEMIES.centralita!.hp, 'los jefes, aparte');
});

test('la planta 6 se juega: cada sala de combate con sus enemigos, sin romper nada', () => {
  const w = createWorld({ seed: 'taller-juego', floor: true, level: SERVICE_LEVEL, service: true });
  w.noDamage = true;
  const combat = w.floor!.rooms.map((st, i) => ({ st, i })).filter(({ st }) => st.template.kind === 'combat');
  assert.ok(combat.length >= 3);
  for (const { i } of combat) {
    enterRoom(w, i, 'S');
    assert.ok(w.enemies.length >= 3, `${w.room.name}: ${w.enemies.length} enemigos`);
    for (const en of w.enemies) assert.ok(en.def.hp >= ENEMIES[en.def.id]!.hp);
    for (let k = 0; k < 4 / DT; k++) step(w, { ...NO_INPUT, moveX: k % 90 < 45 ? 1 : -1, fire: true });
    assert.deepEqual(checkInvariants(w), []);
  }
});
