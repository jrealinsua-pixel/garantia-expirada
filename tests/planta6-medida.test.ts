// The Servicio Técnico, measured (M12 (6)): `node tools/medir-plantas.ts N 0 6` gets runs with the
// appointment up to the sixth floor, and the Trituradora's last phase is the one that hurts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { SERVICE_LEVEL } from '../src/sim/world.ts';
import { rebuild } from '../tools/medir-plantas.ts';

test('medir-plantas lleva una partida con la cita hasta el Servicio Técnico, con lo recogido abajo', () => {
  const errors: string[] = [];
  const w = rebuild('medir-plantas-0', 0, SERVICE_LEVEL, 600, errors, true);
  assert.deepEqual(errors, []);
  assert.ok(w, 'gana sin daño las cinco plantas de abajo');
  assert.equal(w.level, SERVICE_LEVEL);
  assert.equal(w.service, true);
  assert.equal(w.won, false);
  assert.ok(w.player.items.length > 0, 'llega con objetos');
});

test('sin la cita, medir-plantas se queda en la planta 5', () => {
  const w = rebuild('medir-plantas-0', 0, 1, 600, [], false);
  assert.ok(w);
  assert.equal(w.service, false);
});

test('el control de calidad de la Trituradora empieza antes y dispara más de lo que etiqueta', () => {
  const brain = ENEMIES.trituradora!.brain as BossBrain;
  const [, two, three] = brain.phases;
  assert.equal(three!.from, 0.35);
  assert.ok(three!.from < two!.from);
  const weight = (k: string): number => three!.attacks.filter((a) => a.kind === k).reduce((s, a) => s + (a.weight ?? 1), 0);
  assert.ok(weight('pattern') >= 3 * weight('frost'), 'casi todo son abanicos de piezas');
  // Fans of springs too, as in the Despiece.
  assert.ok(three!.attacks.some((a) => a.kind === 'pattern' && a.pattern === 'despiece-muelles'));
  // It rests less than in the Despiece.
  assert.ok(three!.rest![1] < two!.rest![1]);
});
