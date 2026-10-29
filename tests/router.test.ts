import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allSheets } from '../tools/sprites/build.ts';
import { makeRepetidorFrames, makeRouter, makeRouterFrames, ROUTER_REST } from '../tools/sprites/router.ts';
import type { Canvas } from '../src/art/canvas.ts';

const same = (a: Canvas, b: Canvas): boolean => a.p.every((row, y) => row.every((c, x) => c.join() === b.p[y]![x]!.join()));
const amber = (cv: Canvas): number => cv.p.flat().filter((c) => c[0] === 0xf6 && c[1] === 0xc4 && c[2] === 0x31).length;

test('router: hoja de jefe de 72 × 76, despierto y reiniciándose con las luces una a una', () => {
  const fr = makeRouterFrames();
  assert.equal(fr.length, 12);
  for (const f of fr) assert.deepEqual([f.w, f.h], [72, 76]);
  assert.ok(same(fr[0]!, makeRouter(ROUTER_REST)), 'el fotograma 0 es el de reposo');
  assert.ok(!same(fr[0]!, fr[1]!), 'respira (y parpadea el wifi)');
  assert.ok(!same(fr[0]!, fr[6]!), 'reiniciando se ve distinto');
  // Each boot frame lights one LED more (the yellow brand plate is there in all of them).
  const lit = fr.slice(6).map(amber);
  for (let i = 1; i < lit.length; i++) assert.ok(lit[i]! > lit[i - 1]!, `luces ${lit.join(', ')}`);
  const sheets = allSheets();
  assert.equal(sheets['router-wifi']!.frameW, 72);
  assert.equal(sheets['router-wifi']!.canvas.w, 72 * 12);
});

test('repetidor: encendido (parpadea) y desenchufado', () => {
  const fr = makeRepetidorFrames();
  assert.equal(fr.length, 3);
  for (const f of fr) assert.deepEqual([f.w, f.h], [20, 24]);
  assert.ok(!same(fr[0]!, fr[1]!) && !same(fr[0]!, fr[2]!));
  assert.equal(allSheets().repetidor!.canvas.w, 60);
});
