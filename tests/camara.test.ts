import { test } from 'node:test';
import assert from 'node:assert/strict';
import { frameAxis } from '../src/render/camera.ts';

test('cámara: si caben los dos, enseña a la jefa entera y a la tostadora', () => {
  // View 270 px; toaster with its margins at 200–280, boss (crown and feet) at 40–120.
  const s = frameAxis(150, { lo: 200, hi: 280 }, { lo: 40, hi: 120 }, 270);
  assert.ok(s <= 40 && s + 270 >= 280, `scroll ${s}`);
  // As close as it can to where it wanted to be.
  assert.equal(s, 40);
  // Already both in the picture: it does not move.
  assert.equal(frameAxis(30, { lo: 200, hi: 280 }, { lo: 40, hi: 120 }, 270), 30);
});

test('cámara: si no caben, manda la tostadora y se acerca a la jefa todo lo que puede', () => {
  // The toaster at the south door (306–382), the boss at the top (16–118): 366 px > 270.
  const up = frameAxis(150, { lo: 306, hi: 382 }, { lo: 16, hi: 118 }, 270);
  assert.equal(up, 382 - 270);
  const down = frameAxis(0, { lo: 16, hi: 90 }, { lo: 300, hi: 380 }, 270);
  assert.equal(down, 16);
});

test('cámara: la tostadora nunca se sale de su margen, quiera la cámara lo que quiera', () => {
  // The other span being the toaster's own: what it wanted, kept within the toaster's range.
  assert.equal(frameAxis(100, { lo: 200, hi: 280 }, { lo: 200, hi: 280 }, 270), 100);
  assert.equal(frameAxis(250, { lo: 200, hi: 280 }, { lo: 200, hi: 280 }, 270), 200);
});
