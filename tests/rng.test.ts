import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rng, hashSeed } from '../src/sim/rng.ts';

test('la misma semilla da la misma secuencia', () => {
  const a = new Rng('tostada');
  const b = new Rng('tostada');
  for (let i = 0; i < 1000; i++) assert.equal(a.nextU32(), b.nextU32());
});

test('semillas distintas dan secuencias distintas', () => {
  const a = new Rng(1);
  const b = new Rng(2);
  let same = 0;
  for (let i = 0; i < 100; i++) if (a.nextU32() === b.nextU32()) same++;
  assert.ok(same < 3);
});

test('next() está en [0, 1) y int() respeta los límites', () => {
  const r = new Rng('limites');
  const seen = new Set<number>();
  for (let i = 0; i < 20000; i++) {
    const f = r.next();
    assert.ok(f >= 0 && f < 1);
    const n = r.int(-3, 3);
    assert.ok(n >= -3 && n <= 3 && Number.isInteger(n));
    seen.add(n);
  }
  assert.equal(seen.size, 7);
});

test('la distribución es razonablemente uniforme', () => {
  const r = new Rng('uniforme');
  const buckets = new Array<number>(10).fill(0);
  const n = 100000;
  for (let i = 0; i < n; i++) buckets[Math.floor(r.next() * 10)]!++;
  for (const b of buckets) assert.ok(Math.abs(b - n / 10) < n / 100, `bucket ${b}`);
});

test('el estado se puede guardar y restaurar', () => {
  const r = new Rng('guardar');
  r.next();
  const s = r.state();
  const x = [r.next(), r.next(), r.next()];
  const r2 = Rng.fromState(s);
  assert.deepEqual([r2.next(), r2.next(), r2.next()], x);
});

test('fork() crea generadores independientes y reproducibles', () => {
  const a = new Rng('padre').fork('salas');
  const b = new Rng('padre').fork('salas');
  const c = new Rng('padre').fork('botin');
  assert.equal(a.nextU32(), b.nextU32());
  assert.notEqual(new Rng('padre').fork('salas').nextU32(), c.nextU32());
});

test('pick() falla con listas vacías y hashSeed es estable', () => {
  assert.throws(() => new Rng(1).pick([]));
  assert.equal(hashSeed('abc'), hashSeed('abc'));
  assert.equal(hashSeed(42), 42);
});
