// M11 (4s): the sprites of floor 5's four enemies (Dispensador de Turnos, Postes de Cola,
// Asistente Virtual, Teléfono de Recepción), what they throw and what they leave on the floor.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import * as CL from '../tools/sprites/clientela.ts';
import * as P5 from '../tools/sprites/planta5-nuevo.ts';
import { allSheets } from '../tools/sprites/build.ts';

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const count = (cv: Canvas, c: readonly number[]): number => cv.p.flat().filter((p) => p[3] === 255 && same(p, c)).length;
const bottom = (cv: Canvas): number => {
  for (let y = cv.h - 1; y >= 0; y--) if (cv.p[y]!.some((p) => p[3] > 0)) return y;
  return -1;
};
const region = (cv: Canvas, x: number, y: number, w: number, h: number): string => JSON.stringify(cv.p.slice(y, y + h).map((r) => r.slice(x, x + w)));
const K = [0x0e, 0x0c, 0x16];
const WHITE = [0xf4, 0xf1, 0xe8];

const ENEMIES = [
  { name: 'Dispensador de Turnos', frames: CL.makeDispensadorFrames(), names: CL.DISP_FRAMES, w: CL.DISP_W, h: CL.DISP_H },
  { name: 'Poste de Cola', frames: CL.makePosteFrames(), names: CL.POST_FRAMES, w: CL.POST_W, h: CL.POST_H },
  { name: 'Poste de Cola desconchado', frames: CL.makePosteFrames(true), names: CL.POST_FRAMES, w: CL.POST_W, h: CL.POST_H },
  { name: 'Asistente Virtual', frames: CL.makeAsistenteFrames(), names: CL.AV_FRAMES, w: CL.AV_W, h: CL.AV_H },
  { name: 'Teléfono de Recepción', frames: CL.makeTelefonoFrames(), names: CL.PHONE_FRAMES, w: CL.PHONE_W, h: CL.PHONE_H },
];

test('los cuatro enemigos: fotogramas distintos, de tamaño de enemigo normal, con contorno y en el suelo', () => {
  for (const e of ENEMIES) {
    assert.equal(e.frames.length, e.names.length, `${e.name}: un fotograma por nombre`);
    assert.equal(new Set(e.frames.map((f) => JSON.stringify(f.p))).size, e.frames.length, `${e.name}: sin fotogramas repetidos`);
    assert.ok(e.w <= 36 && e.h <= 36, `${e.name}: tamaño de enemigo normal (${e.w}x${e.h})`);
    const floor = bottom(e.frames[0]!);
    for (const [i, f] of e.frames.entries()) {
      assert.deepEqual([f.w, f.h], [e.w, e.h], `${e.name} ${e.names[i]}`);
      assert.ok(count(f, K) > 40, `${e.name} ${e.names[i]}: contorno negro`);
      // Nothing touches the edge of the frame (the outline needs its pixel).
      const edge = [...f.p[0]!, ...f.p.map((r) => r[0]!), ...f.p.map((r) => r[f.w - 1]!)];
      assert.ok(edge.every((p) => p[3] === 0 || same(p, K)), `${e.name} ${e.names[i]}: nada pegado al borde`);
      if (e.names[i] !== 'aire') assert.equal(bottom(f), floor, `${e.name} ${e.names[i]}: los pies en el suelo`);
    }
  }
  // The phone hops: in the air its lowest pixel is off the floor.
  const ph = CL.makeTelefonoFrames();
  assert.ok(bottom(ph[CL.PHONE_FRAMES.indexOf('aire')]!) < bottom(ph[0]!) - 2, 'el teléfono salta');
});

test('el Dispensador: el «087» de siempre, que se enciende al llamar, y la lengua de papel', () => {
  const fr = CL.makeDispensadorFrames();
  const at = (n: (typeof CL.DISP_FRAMES)[number]): Canvas => fr[CL.DISP_FRAMES.indexOf(n)]!;
  for (const n of CL.DISP_FRAMES) {
    const led = count(at(n), CL.LED);
    if (n === 'llama') assert.equal(led, 0, 'al llamar el número sale al blanco');
    else assert.ok(led >= 25, `${n}: el número en rojo (${led} px)`);
  }
  // The display never changes: the same pixels in every frame standing still.
  const display = (f: Canvas): string => region(f, 10, 6, 14, 7);
  assert.equal(display(at('reposo0')), display(at('escupe')), 'el número nunca cambia');
  // The tongue of paper: longer when it calls and longest when you miss the turn.
  const paper = (f: Canvas): number => count(f, CL.PAPER[1]!);
  assert.ok(paper(at('llama')) > paper(at('reposo0')) + 4, 'al llamar saca un tique');
  assert.ok(paper(at('escupe')) > paper(at('llama')) + 6, '«turno perdido»: escupe el rollo');
  assert.ok(count(at('reposo0'), CL.DISP[1]!) > 70, 'la carcasa roja');
});

test('los Postes de Cola: cinta enganchada salvo al soltarla, y uno con la base desconchada', () => {
  const clean = CL.makePosteFrames(false);
  const chipped = CL.makePosteFrames(true);
  const rust = [0xb8, 0x68, 0x3a];
  for (const f of clean) assert.equal(count(f, rust), 0, 'el limpio no tiene óxido');
  for (const f of chipped) assert.ok(count(f, rust) >= 3, 'el otro, desconchado');
  const clip = (f: Canvas): number => count(f, CL.BELT[1]!);
  const i = CL.POST_FRAMES.indexOf('suelta');
  assert.ok(clip(clean[0]!) >= 4 && clip(clean[i]!) === 0, 'al soltar la cinta, el enganche desaparece');
  // The belt between them: two frames (slack and pulling), blue, opaque, to repeat along it.
  const belt = CL.makeBeltFrames();
  assert.equal(belt.length, 2);
  for (const b of belt) {
    assert.deepEqual([b.w, b.h], [CL.BELT_W, CL.BELT_H]);
    assert.ok(b.p.every((r) => r.every((p) => p[3] === 255)), 'la cinta es opaca y se repite sin huecos');
  }
  assert.ok(count(belt[0]!, WHITE) >= 10, 'las letras al revés, en blanco');
  assert.notDeepEqual(belt[0]!.p, belt[1]!.p);
});

test('el Asistente Virtual: la cara de la pantalla no cambia nunca, ni cuando escribe', () => {
  const fr = CL.makeAsistenteFrames();
  const face = (f: Canvas): string => region(f, 10, 9, 10, 7);
  const typing = fr[CL.AV_FRAMES.indexOf('escribe0')]!;
  assert.equal(face(fr[0]!), face(typing), 'la misma sonrisa escribiendo');
  assert.equal(face(fr[0]!), face(fr[CL.AV_FRAMES.indexOf('escribe1')]!));
  // The three dots of «Escribiendo…» under the smile, the lit one moving.
  assert.notEqual(region(fr[0]!, 10, 17, 10, 1), region(typing, 10, 17, 10, 1));
  assert.notEqual(region(typing, 10, 17, 10, 1), region(fr[CL.AV_FRAMES.indexOf('escribe1')]!, 10, 17, 10, 1));
  for (const f of fr) assert.ok(count(f, CL.SCREEN[1]!) > 50, 'la pantalla azul');
});

test('el Teléfono de Recepción: la luz de mensaje en espera siempre encendida', () => {
  for (const [i, f] of CL.makeTelefonoFrames().entries()) {
    assert.ok(count(f, CL.MSG) >= 3, `${CL.PHONE_FRAMES[i]}: la luz roja`);
    assert.ok(count(f, CL.PHONE[1]!) > 80, `${CL.PHONE_FRAMES[i]}: el plástico beis`);
  }
});

test('las balas: colores saturados con núcleo blanco, nunca el naranja de la tostadora', () => {
  const ORANGE = [[0xff, 0xb3, 0x47], [0xff, 0x7a, 0x1f]];
  const bullets: [string, Canvas][] = [
    ...CL.makeTicketBullets().map((c, i): [string, Canvas] => [`tique ${i}`, c]),
    ['bola de acero', CL.makeSteelBall()],
    ...CL.makeBubbleFrames().map((c, i): [string, Canvas] => [`bocadillo ${i}`, c]),
    ...CL.makeHelpButtons().map((c, i): [string, Canvas] => [`botón ${i}`, c]),
    ...CL.makeCallBullets().map((c, i): [string, Canvas] => [`llamada ${i}`, c]),
  ];
  const saturated = (p: readonly number[]): boolean => p[3] === 255 && Math.max(p[0]!, p[1]!, p[2]!) - Math.min(p[0]!, p[1]!, p[2]!) > 90;
  for (const [name, c] of bullets) {
    assert.ok(count(c, WHITE) + count(c, [255, 255, 255]) >= 2, `${name}: núcleo blanco`);
    assert.ok(c.p.flat().filter(saturated).length >= 6, `${name}: color saturado`);
    for (const o of ORANGE) assert.equal(count(c, o), 0, `${name}: nada naranja`);
    assert.ok(count(c, K) > 0, `${name}: con contorno`);
  }
});

test('el círculo del turno: unos 40 px de radio, translúcido, en espera, atendido y perdido', () => {
  const fr = CL.makeTurnCircleFrames();
  assert.equal(fr.length, 3);
  assert.equal(new Set(fr.map((f) => JSON.stringify(f.p))).size, 3);
  for (const f of fr) {
    assert.deepEqual([f.w, f.h], [CL.TURN_SIZE, CL.TURN_SIZE]);
    const mid = Math.floor(f.w / 2);
    assert.ok(f.p[mid]![mid]![3] > 0 && f.p[mid]![mid]![3] < 120, 'el suelo se ve a través');
    assert.equal(f.p[0]![0]![3], 0, 'redondo: las esquinas vacías');
    // The edge, about TURN_R from the centre (the leftmost painted column).
    const left = Math.min(...f.p.map((r) => r.findIndex((p) => p[3] > 0)).filter((x) => x >= 0));
    assert.ok(Math.abs(mid - left - CL.TURN_R) <= 2, `borde a ${mid - left} px`);
  }
  // The FAQ shield is translucent too, and fades in its second frame.
  const [up, fading] = CL.makeFaqShieldFrames();
  const alpha = (c: Canvas): number => Math.max(...c.p.flat().map((p) => p[3]));
  assert.ok(alpha(up!) < 255 && alpha(fading!) < alpha(up!));
});

test('las hojas nuevas están en sprites.json sin pisar ninguna (la cinta de la cola del Mostrador sigue siendo suya)', () => {
  const sheets = allSheets();
  const want: Record<string, [number, number, number]> = {
    // M14c (a6e): the dispenser, the posts and their belt are drawn in planta5-nuevo.ts now
    // (tests/estilo-a6e.test.ts); same frame counts.
    'dispensador-turnos': [P5.DISP_W, P5.DISP_H, CL.DISP_FRAMES.length],
    'tique-turno': [9, 7, 2],
    'circulo-turno': [CL.TURN_SIZE, CL.TURN_SIZE, 3],
    'poste-cola': [P5.POST_W, P5.POST_H, CL.POST_FRAMES.length * 2],
    'cinta-poste': [CL.BELT_W, CL.BELT_H, 2],
    'bola-acero': [7, 7, 1],
    'asistente-virtual': [CL.AV_W, CL.AV_H, CL.AV_FRAMES.length],
    bocadillo: [11, 9, 2],
    'escudo-faq': [CL.FAQ_W, CL.FAQ_H, 2],
    'boton-ayuda': [13, 10, 2],
    'telefono-recepcion': [CL.PHONE_W, CL.PHONE_H, CL.PHONE_FRAMES.length],
    'bala-llamada': [13, 13, 2],
  };
  for (const [k, [w, h, n]] of Object.entries(want)) {
    const s = sheets[k];
    assert.ok(s, `falta ${k}`);
    assert.deepEqual([s.frameW, s.frameH, Math.floor(s.canvas.w / s.frameW)], [w, h, n], k);
  }
  assert.notEqual(sheets['cinta-cola']!.frameW, CL.BELT_W, 'la cinta del Mostrador no se ha pisado');
});
