// M11 (5a): the sprites of La Centralita, floor 5's boss (an old switchboard: pilot lamps for eyes,
// a loudspeaker for a mouth, the cords for arms), her plugs and hold-music notes, the low counters
// of her room and the zones of the voice menu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { C as ATT } from '../src/art/atencion.ts';
import { TILE } from '../src/sim/room.ts';
import {
  BAKELITE, BRASS, CENTRALITA_FLOOR, CENTRALITA_FRAMES, CENTRALITA_H, CENTRALITA_W, CLOTH, DEPARTMENTS, LAMP, LOW_COUNTER_BOX, LOW_COUNTER_H, LOW_COUNTER_V_BOX,
  LOW_COUNTER_V_H, LOW_COUNTER_V_W, LOW_COUNTER_W, TEAK, ZONE_H, ZONE_W, centralitaLook, makeCentralitaFrames, makeHoldNotes, makeLowCounterFrames, makeLowCounterV,
  makeMenuZoneFrames, makePlugBullet,
} from '../tools/sprites/centralita.ts';
import { allSheets } from '../tools/sprites/build.ts';

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const count = (cv: Canvas, c: readonly number[]): number => cv.p.flat().filter((p) => p[3] === 255 && same(p, c)).length;
const painted = (cv: Canvas): number => cv.p.flat().filter((p) => p[3] > 0).length;
const bottom = (cv: Canvas): number => {
  for (let y = cv.h - 1; y >= 0; y--) if (cv.p[y]!.some((p) => p[3] > 0)) return y;
  return -1;
};
const WHITE = [0xf4, 0xf1, 0xe8];
const RED_LAMP = [0xff, 0x5a, 0x3c];

test('la Centralita: catorce fotogramas distintos, del tamaño de un jefe, sobre la misma línea de suelo', () => {
  const fr = makeCentralitaFrames();
  assert.equal(fr.length, CENTRALITA_FRAMES.length);
  assert.equal(fr.length, 14);
  assert.equal(new Set(fr.map((f) => JSON.stringify(f.p))).size, fr.length, 'no hay fotogramas repetidos');
  for (const [i, f] of fr.entries()) {
    assert.deepEqual([f.w, f.h], [CENTRALITA_W, CENTRALITA_H], `fotograma ${i}`);
    assert.equal(bottom(f), CENTRALITA_FLOOR, `el fotograma ${i} se apoya en el suelo`);
    // The wardrobe of teak and its bakelite panel are always there.
    assert.ok(count(f, TEAK[1]!) > 400, `el fotograma ${i} es un armario de teca`);
    assert.ok(count(f, BAKELITE[1]!) > 150, `el fotograma ${i} tiene su cuadro de clavijas`);
  }
  assert.ok(CENTRALITA_FLOOR >= CENTRALITA_H - 4, 'abajo del todo, como los otros jefes');
});

test('los pilotos: ámbar en el menú, rojos sin clavijas y en blanco cuando se queda muda', () => {
  const fr = makeCentralitaFrames();
  for (const [i, name] of CENTRALITA_FRAMES.entries()) {
    const f = fr[i]!;
    const phase = centralitaLook(name).phase ?? 'menu';
    const amber = count(f, LAMP[1]!);
    const red = count(f, RED_LAMP);
    if (phase === 'menu') {
      assert.ok(amber >= 16, `${name}: los ojos ámbar (${amber} px)`);
      assert.equal(red, 0, `${name}: nada rojo en los ojos`);
    } else if (phase === 'sin-clavijas') {
      assert.ok(red >= 12, `${name}: los ojos rojos (${red} px)`);
      assert.equal(amber, 0, `${name}: nada ámbar`);
    } else {
      assert.equal(amber + red, 0, `${name}: muda, los pilotos apagados`);
      assert.ok(count(f, WHITE) >= 40, `${name}: los pilotos en blanco`);
    }
  }
});

test('las clavijas del pupitre se arrancan en la fase 3 y el altavoz habla en dos tiempos', () => {
  const fr = makeCentralitaFrames();
  const at = (n: (typeof CENTRALITA_FRAMES)[number]): Canvas => fr[CENTRALITA_FRAMES.indexOf(n)]!;
  // The brass tips of the plugs standing on the desk: phases 1-2 have them, phase 3 does not.
  const tips = (f: Canvas): number => count(f, BRASS[1]!);
  assert.ok(tips(at('reposo0')) > tips(at('sin-clavijas0')) + 5, 'sin clavijas en el pupitre');
  // Talking: the cloth of the loudspeaker goes pale in the middle, in two different beats.
  const pale = (f: Canvas): number => count(f, CLOTH[0]!);
  assert.ok(pale(at('habla0')) > pale(at('reposo0')) + 10, 'el altavoz se abre al hablar');
  assert.notDeepEqual(at('habla0').p, at('habla1').p);
  // Throwing a plug: the front cord goes up, above the cabinet's top.
  const top = (f: Canvas, x0: number): number => {
    for (let y = 0; y < f.h; y++) for (let x = x0; x < f.w; x++) if (f.p[y]![x]![3] > 0) return y;
    return f.h;
  };
  assert.ok(top(at('lanza'), 61) < top(at('reposo0'), 61) - 10, 'lanza con el cable en alto');
  assert.ok(top(at('sin-clavijas0'), 0) < 6, 'en la fase 3 los cables suben por encima del armario');
});

test('la clavija y las notas de la música de espera: balas enemigas con núcleo blanco', () => {
  const plug = makePlugBullet();
  assert.deepEqual([plug.w, plug.h], [12, 6]);
  assert.ok(count(plug, WHITE) >= 3);
  const notes = makeHoldNotes();
  assert.equal(notes.length, 2);
  for (const n of notes) {
    assert.deepEqual([n.w, n.h], [9, 10]);
    assert.ok(count(n, WHITE) >= 2, 'núcleo blanco');
    assert.ok(count(n, [0x69, 0xdb, 0xd8]) >= 10, 'cian, el color de las balas enemigas frías');
  }
  assert.notDeepEqual(notes[0]!.p, notes[1]!.p);
});

test('los mostradores bajos: tres casillas, uno por departamento, y su caja dentro del dibujo', () => {
  const hs = makeLowCounterFrames();
  assert.equal(hs.length, DEPARTMENTS.length);
  assert.equal(new Set(hs.map((h) => JSON.stringify(h.p))).size, 4, 'cada departamento, el suyo');
  for (const [i, h] of hs.entries()) {
    assert.deepEqual([h.w, h.h], [LOW_COUNTER_W, LOW_COUNTER_H]);
    assert.ok(count(h, ATT.counter) > 500, 'la misma encimera que las ventanillas de la planta');
    assert.ok(count(h, DEPARTMENTS[i]!.color) >= 20, `la franja de ${DEPARTMENTS[i]!.name}`);
  }
  assert.equal(LOW_COUNTER_W, 3 * TILE);
  // Bajo: menos alto que una casilla y media (los de ventanilla, con mampara, ocupan más).
  assert.ok(LOW_COUNTER_H < 1.5 * TILE);
  const v = makeLowCounterV();
  assert.deepEqual([v.w, v.h], [LOW_COUNTER_V_W, LOW_COUNTER_V_H]);
  assert.equal(LOW_COUNTER_V_W, TILE);
  for (const [b, w, hgt] of [[LOW_COUNTER_BOX, LOW_COUNTER_W, LOW_COUNTER_H], [LOW_COUNTER_V_BOX, LOW_COUNTER_V_W, LOW_COUNTER_V_H]] as const) {
    assert.ok(-b.x <= w / 2 && b.x + b.w <= w / 2 && -b.y <= hgt && b.y + b.h <= 0, 'la caja cae dentro del dibujo (desde el centro de abajo)');
  }
  assert.equal(LOW_COUNTER_V_BOX.h, 3 * TILE);
});

test('las zonas del menú de voz: «Pulse 1, 2, 3», en espera y con las balas encima, translúcidas', () => {
  const z = makeMenuZoneFrames();
  assert.equal(z.length, 6);
  assert.equal(new Set(z.map((f) => JSON.stringify(f.p))).size, 6);
  for (const f of z) {
    assert.deepEqual([f.w, f.h], [ZONE_W, ZONE_H]);
    assert.ok(painted(f) > ZONE_W * ZONE_H * 0.8, 'cubre la zona');
    // The middle is see-through: the floor shows (only the edge and the letters are solid).
    const solid = f.p.flat().filter((p) => p[3] > 200).length;
    assert.ok(solid < ZONE_W * ZONE_H * 0.2, 'casi todo translúcido');
  }
  // Waiting, the edge is dashed; with bullets coming, solid.
  const edge = (f: Canvas): number => f.p[0]!.filter((p) => p[3] > 200).length;
  for (let n = 0; n < 3; n++) assert.ok(edge(z[n + 3]!) > edge(z[n]!) + 10);
});

test('las hojas nuevas están en el exportador con sus medidas', () => {
  const s = allSheets();
  assert.equal(s['centralita']!.frameW, CENTRALITA_W);
  assert.equal(s['centralita']!.canvas.w, CENTRALITA_W * CENTRALITA_FRAMES.length);
  for (const k of ['bala-clavija', 'nota-espera', 'mostrador-bajo', 'mostrador-bajo-v', 'zona-menu']) assert.ok(s[k], k);
  assert.equal(s['zona-menu']!.canvas.w / s['zona-menu']!.frameW, 6);
});
