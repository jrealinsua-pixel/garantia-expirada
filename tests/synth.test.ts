import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SFX, synth } from '../src/audio/synth.ts';

for (const [name, p] of Object.entries(SFX)) {
  test(`el efecto «${name}» suena, no satura y es determinista`, () => {
    const a = synth(p, 22050, name);
    const b = synth(p, 22050, name);
    assert.ok(a.length > 100);
    let peak = 0;
    let energy = 0;
    for (let i = 0; i < a.length; i++) {
      assert.ok(Number.isFinite(a[i]!));
      peak = Math.max(peak, Math.abs(a[i]!));
      energy += a[i]! * a[i]!;
      assert.equal(a[i], b[i]);
    }
    assert.ok(peak <= 1, `pico ${peak}`);
    assert.ok(energy / a.length > 1e-5, 'casi en silencio');
    assert.ok(Math.abs(a[a.length - 1]!) < 0.05, 'termina con un chasquido');
  });
}
