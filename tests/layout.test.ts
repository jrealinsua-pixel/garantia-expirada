import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stackAbove, type LabelBox } from '../src/render/layout.ts';

test('un texto flotante nuevo no tapa a los que ya están: sube hasta encontrar sitio', () => {
  const a: LabelBox = { x: 100, y: 50, w: 40, h: 8 };
  assert.equal(stackAbove([], a), 50, 'sin nadie, donde se pidió');
  assert.equal(stackAbove([a], { x: 105, y: 52, w: 30, h: 8 }), 41, 'encima del que tapaba');
  const b: LabelBox = { x: 100, y: 41, w: 40, h: 8 };
  assert.equal(stackAbove([a, b], { x: 100, y: 50, w: 20, h: 8 }), 32, 'y encima del siguiente');
  assert.equal(stackAbove([a], { x: 160, y: 50, w: 30, h: 8 }), 50, 'al lado no estorba');
  assert.equal(stackAbove([a], { x: 100, y: 70, w: 30, h: 8 }), 70, 'muy por debajo tampoco');
});
