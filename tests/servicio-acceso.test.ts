// M12 (2): the way up to the Servicio Técnico. With the appointment (Profile.service), beating the
// Centralita wins the run and raises the Servicio Técnico's lift instead of ending it; without
// it, the run ends on floor 5 as before (the acceptance criterion of M12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BOSS_DEATH,
  checkInvariants,
  createWorld,
  DT,
  enterRoom,
  FINALE_DELAY,
  isLastFloor,
  LAST_LEVEL,
  leaveHub,
  LIFT_READY,
  NO_INPUT,
  nextFloor,
  SERVICE_LEVEL,
  step,
  topLevelOf,
  winsRun,
  type SimEvent,
  type World,
} from '../src/sim/world.ts';
import { FLOOR_NAMES, SERVICE_LIFT_LINE, SERVICE_WON_LINE } from '../src/data/texts.ts';
import { fontText, textWidth } from '../src/art/font.ts';

/** Floor 5 with its boss beaten: steps until the lift is ready or the run is won by itself. */
function beatCentralita(service: boolean): { w: World; seen: SimEvent[] } {
  const w = createWorld({ seed: 'acceso-servicio', floor: true, level: LAST_LEVEL, service });
  const bossRoom = w.floor!.rooms.findIndex((st) => st.template.kind === 'boss');
  enterRoom(w, bossRoom, 'S');
  w.intro = null;
  w.noDamage = true;
  const boss = w.enemies.find((e) => e.def.boss)!;
  assert.equal(boss.def.id, 'centralita');
  boss.damageTaken = boss.def.hp;
  const seen: SimEvent[] = [];
  for (let i = 0; i < Math.ceil((BOSS_DEATH + LIFT_READY + FINALE_DELAY + 1) / DT) && !w.won; i++) {
    step(w, NO_INPUT);
    seen.push(...w.events);
  }
  return { w, seen };
}

test('sin cita, la partida acaba en la planta 5: ni montacargas ni planta 6', () => {
  const { w, seen } = beatCentralita(false);
  assert.equal(w.service, false);
  assert.equal(topLevelOf(w), LAST_LEVEL);
  assert.ok(isLastFloor(w) && winsRun(w));
  assert.equal(w.lift, null);
  assert.ok(!seen.some((e) => e.type === 'lift'));
  assert.equal(w.won, true, 'se gana sola, como siempre');
  const done = seen.find((e) => e.type === 'floorDone');
  assert.ok(done && done.type === 'floorDone' && done.final === true);
  assert.equal(nextFloor(w), null, 'no hay nada arriba');
});

test('con cita, vencer a la Centralita gana la partida y sube el montacargas del Servicio Técnico', () => {
  const { w, seen } = beatCentralita(true);
  assert.equal(topLevelOf(w), SERVICE_LEVEL);
  assert.ok(winsRun(w) && !isLastFloor(w), 'la planta 5 gana la partida, pero ya no es la última');
  assert.ok(!w.finale, 'no se cierra la partida');
  assert.ok(w.lift?.service, 'el montacargas es el del Servicio Técnico');
  const up = seen.find((e) => e.type === 'lift');
  assert.ok(up && up.type === 'lift' && up.service === true, 'el aviso del montacargas dice que se apunte la victoria');
  assert.equal(w.won, false, 'espera a que la tostadora se suba');
  // Step on it: the floor is done (not the run's finale) and the next floor is the secret one.
  const l = w.lift!;
  w.player.x = l.x;
  w.player.y = l.y;
  step(w, NO_INPUT);
  assert.equal(w.won, true);
  const done = w.events.find((e) => e.type === 'floorDone');
  assert.ok(done && done.type === 'floorDone' && !done.final);
  w.player.coupons = 33;
  const n = nextFloor(w)!;
  assert.ok(n, 'hay planta 6');
  assert.equal(n.level, SERVICE_LEVEL);
  assert.equal(n.service, true);
  assert.equal(n.player.coupons, 33, 'sube con lo que llevaba');
  assert.ok(isLastFloor(n), 'el Servicio Técnico es la última');
  for (let i = 0; i < 2 / DT; i++) step(n, { ...NO_INPUT, moveX: 1, fire: true });
  assert.deepEqual(checkInvariants(n), []);
  n.won = true;
  assert.equal(nextFloor(n), null, 'y encima no hay nada');
});

test('la cita viaja del Mostrador a la partida y de planta en planta', () => {
  for (const service of [false, true]) {
    const hub = createWorld({ seed: 'mostrador', hub: { service } });
    hub.leftHub = true;
    let w = leaveHub(hub, 'cita-viaja')!;
    assert.equal(w.service, service);
    for (let l = 2; l <= LAST_LEVEL; l++) {
      w.won = true;
      w = nextFloor(w)!;
      assert.equal(w.level, l);
      assert.equal(w.service, service);
    }
  }
  // A world made without saying is a run without the appointment.
  assert.equal(createWorld({ seed: 'x', floor: true }).service, false);
});

test('los textos del acceso caben', () => {
  assert.ok(FLOOR_NAMES[SERVICE_LEVEL]);
  for (const s of [SERVICE_LIFT_LINE, SERVICE_WON_LINE]) assert.ok(textWidth(fontText(s)) <= 230, s);
});
