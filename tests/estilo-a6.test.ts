// M14c (a6): the plant 3, 4 and 5 enemies redrawn in the new style, checked against the style
// guide (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo») and against the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { MATERIALS } from '../src/art/paleta.ts';
import { legibility, silhouetteOverlap } from '../src/art/pintor.ts';
import { BRICK_KINDS, ENEMIES } from '../src/data/enemies.ts';
import { BRICK_RADIUS } from '../src/sim/world.ts';
import { allSheets } from '../tools/sprites/build.ts';
import * as P3 from '../tools/sprites/planta3-nuevo.ts';
import * as P4 from '../tools/sprites/planta4-nuevo.ts';

const FLOOR = MATERIALS.suelo[3]!;

/** The redrawn ones so far, with their frames. */
const REDRAWN: Record<string, () => Canvas[]> = {
  'robot-cuerda': P3.makeRobotNuevoFrames,
  'coche-teledirigido': P3.makeCocheNuevoFrames,
  'cubo-piezas': P3.makeCuboNuevoFrames,
  'sobre-sorpresa': P3.makeSobreNuevoFrames,
  'munequito-repetido': () => P3.makeMunequitoNuevoFrames(false),
  'munequito-dorado': () => P3.makeMunequitoNuevoFrames(true),
  destructora: P4.makeDestructoraNuevaFrames,
  fotocopiadora: P4.makeFotocopiadoraNuevaFrames,
};

function bottomRow(cv: Canvas, x0 = 0, x1 = cv.w - 1): number {
  for (let y = cv.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (cv.get(x, y)[3] === 255) return y;
  return -1;
}

const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

test('estilo a6: los enemigos redibujados se leen sobre el suelo, en todos sus fotogramas', () => {
  for (const [id, make] of Object.entries(REDRAWN)) {
    for (const [i, f] of make().entries()) {
      const l = legibility(f, FLOOR);
      assert.ok(l.darkEdge >= 0.8, `${id} ${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${id} ${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${id} ${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a6: las hojas del juego son las nuevas y casan con los datos (fotogramas, anclas)', () => {
  const sheets = allSheets();
  for (const [id, make] of Object.entries(REDRAWN)) {
    const def = ENEMIES[id]!;
    const frames = make();
    const s = sheets[def.sprite]!;
    assert.equal(s.frameW, frames[0]!.w, `${id}: ancho de fotograma`);
    assert.equal(s.frameH, frames[0]!.h, `${id}: alto de fotograma`);
    assert.equal(s.canvas.w / s.frameW, frames.length, `${id}: número de fotogramas`);
    const a = def.anim!;
    const used = [...a.idle, ...(a.walk ?? []), ...(a.jam ?? []), ...[a.warn, a.off, a.stun].filter((k) => k !== undefined)];
    for (const k of used) assert.ok(k < frames.length, `${id}: el fotograma ${k} no está en la hoja`);
    assert.ok(def.anchor.x > 0 && def.anchor.x < s.frameW && def.anchor.y < s.frameH, `${id}: el ancla se sale`);
  }
});

test('estilo a6: el robot pisa el suelo en su ancla (de pie, andando, sin cuerda y dándose cuerda)', () => {
  const def = ENEMIES['robot-cuerda']!;
  const frames = P3.makeRobotNuevoFrames();
  assert.deepEqual(def.anchor, P3.ROBOT_FEET);
  const a = def.anim!;
  for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, a.stun!, ...a.jam!]) {
    assert.equal(bottomRow(frames[k]!, def.anchor.x - 8, def.anchor.x + 8), def.anchor.y, `fotograma ${k}: los pies no tocan el suelo`);
  }
});

test('estilo a6: el coche va sobre sus ruedas en el ancla, también volcado', () => {
  const def = ENEMIES['coche-teledirigido']!;
  assert.deepEqual(def.anchor, P3.COCHE_FEET);
  for (const [k, f] of P3.makeCocheNuevoFrames().entries()) assert.equal(bottomRow(f), def.anchor.y, `fotograma ${k}`);
});

test('estilo a6: más grandes que antes y sin cambiar las cajas de choque', () => {
  const widest = (f: Canvas): number => {
    let best = 0;
    for (let y = 0; y < f.h; y++) {
      let n = 0;
      for (let x = 0; x < f.w; x++) if (f.get(x, y)[3] === 255) n++;
      best = Math.max(best, n);
    }
    return best;
  };
  assert.ok(widest(P3.makeRobotNuevoFrames()[0]!) >= 26, 'robot');
  assert.ok(widest(P3.makeCocheNuevoFrames()[0]!) >= 40, 'coche');
  assert.deepEqual(ENEMIES['robot-cuerda']!.hurt, { x: -12, y: -28, w: 24, h: 27 });
  assert.deepEqual(ENEMIES['coche-teledirigido']!.hurt, { x: -14, y: -20, w: 28, h: 19 });
});

test('estilo a6: las tuercas salen de la boca del robot (muzzleY) y la llave gira', () => {
  const def = ENEMIES['robot-cuerda']!;
  assert.equal(def.brain.kind === 'windup' && def.brain.muzzleY, P3.ROBOT_MOUTH_Y);
  const [f] = P3.makeRobotNuevoFrames();
  // The grille's dark row: the deepest tin tone right under the anchor's column, at muzzleY.
  const row = P3.ROBOT_FEET.y - P3.ROBOT_MOUTH_Y - 1;
  const deep = MATERIALS.hojalata[6]!;
  let dark = 0;
  for (let x = P3.ROBOT_FEET.x - 6; x <= P3.ROBOT_FEET.x + 8; x++) if (same(f!.get(x, row), deep)) dark++;
  assert.ok(dark >= 4, `la rejilla no está en la fila ${row} (${dark} px)`);
  // The key (the left end of the frame) is drawn differently in the three march frames in a row.
  const keyOf = (cv: Canvas): string => {
    const px: string[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < 7; x++) px.push(cv.get(x, y).join(','));
    return px.join(';');
  };
  const frames = P3.makeRobotNuevoFrames();
  const keys = [2, 3, 4].map((k) => keyOf(frames[k]!));
  assert.equal(new Set(keys).size, 3, 'la llave no gira');
  // Winding itself up, it shakes from side to side: frames 7 and 8 differ.
  assert.notEqual(keyOf(frames[7]!), keyOf(frames[8]!));
});

test('estilo a6: el coche volcado está boca abajo y sin pilas enseña la batería', () => {
  const frames = P3.makeCocheNuevoFrames();
  const tip = MATERIALS.rojo[1]!;
  const rowsWith = (cv: Canvas, c: readonly number[], x0 = 0): number[] => {
    const rows: number[] = [];
    for (let y = 0; y < cv.h; y++) for (let x = x0; x < cv.w; x++) if (same(cv.get(x, y), c)) rows.push(y);
    return rows;
  };
  // The antenna's red tip: at the top upright, at the bottom overturned.
  assert.ok(Math.max(...rowsWith(frames[0]!, tip)) < 6, 'de pie, la antena arriba');
  assert.ok(Math.min(...rowsWith(frames[5]!, tip)) > P3.COCHE_FEET.y - 6, 'volcado, la antena abajo');
  // Batteries out: the eyes on the bumper go dark (no yellow headlights) and the battery sign is there.
  const yellow = MATERIALS.amarillo[1]!;
  assert.ok(rowsWith(frames[0]!, yellow, 36).some((y) => y >= 16 && y <= 18), 'los faros encendidos');
  assert.ok(!rowsWith(frames[6]!, yellow, 36).some((y) => y >= 16 && y <= 18), 'sin pilas, los faros apagados');
  assert.ok(rowsWith(frames[6]!, MATERIALS.rojo[2]!).some((y) => y < 6), 'falta la batería baja');
});

test('estilo a6: los enemigos de la planta 3 no se parecen entre sí', () => {
  const plant3: Array<[string, Canvas]> = [
    ['robot', P3.makeRobotNuevoFrames()[0]!],
    ['coche', P3.makeCocheNuevoFrames()[0]!],
    ['cubo', P3.makeCuboNuevoFrames()[0]!],
    ['sobre', P3.makeSobreNuevoFrames()[0]!],
  ];
  for (let i = 0; i < plant3.length; i++) {
    for (let j = i + 1; j < plant3.length; j++) {
      const o = silhouetteOverlap(plant3[i]![1], plant3[j]![1]);
      assert.ok(o < 0.8, `${plant3[i]![0]}–${plant3[j]![0]}: ${o.toFixed(2)}`);
    }
  }
});

test('estilo a6: el cubo y el sobre pisan el suelo en su ancla y disparan desde donde dicen los datos', () => {
  const cubo = ENEMIES['cubo-piezas']!;
  const sobre = ENEMIES['sobre-sorpresa']!;
  assert.deepEqual(cubo.anchor, P3.CUBO_FEET);
  assert.deepEqual(sobre.anchor, P3.SOBRE_FEET);
  const cf = P3.makeCuboNuevoFrames();
  for (const k of [...cubo.anim!.idle, cubo.anim!.walk![0]!, cubo.anim!.walk![2]!, cubo.anim!.warn!]) {
    assert.equal(bottomRow(cf[k]!, cubo.anchor.x - 8, cubo.anchor.x + 8), cubo.anchor.y, `cubo ${k}: los pies no tocan el suelo`);
  }
  const sf = P3.makeSobreNuevoFrames();
  const a = sobre.anim!;
  for (const k of [...a.idle, a.crouch!, a.warn!]) {
    assert.equal(bottomRow(sf[k]!, sobre.anchor.x - 8, sobre.anchor.x + 8), sobre.anchor.y, `sobre ${k}: los pies no tocan el suelo`);
  }
  // In the air, the legs are tucked up (the game lifts it by the hop).
  assert.ok(bottomRow(sf[a.jump!]!) < sobre.anchor.y - 2, 'en el aire, con los pies recogidos');
  // muzzleY: the bucket's rim, the envelope's mouth.
  assert.equal(cubo.brain.kind === 'lobber' && cubo.brain.muzzleY, P3.CUBO_RIM_Y);
  assert.equal(sobre.brain.kind === 'hopper' && sobre.brain.muzzleY, P3.SOBRE_MOUTH_Y);
  const rim = P3.CUBO_FEET.y - P3.CUBO_RIM_Y - 1;
  const red = MATERIALS.rojo;
  const isRed = (c: readonly number[]): boolean => red.some((t) => t[0] === c[0] && t[1] === c[1] && t[2] === c[2]);
  let lip = 0;
  for (let x = 0; x < P3.CUBO_W; x++) if (isRed(cf[0]!.get(x, rim))) lip++;
  assert.ok(lip >= 24, `el borde del cubo no está en la fila ${rim} (${lip} px)`);
  // With the lid up, the pieces show between the rim and the lid (blue and green, not just red and yellow).
  const pieces = (cv: Canvas): number => {
    let n = 0;
    for (let y = rim - 4; y < rim; y++) for (let x = 0; x < P3.CUBO_W; x++) {
      const c = cv.get(x, y);
      if (MATERIALS.azul.some((t) => same([...t], c)) || MATERIALS.verde.some((t) => same([...t], c))) n++;
    }
    return n;
  };
  assert.equal(pieces(cf[0]!), 0, 'con la tapa puesta no se ven piezas');
  assert.ok(pieces(cf[cubo.anim!.warn!]!) >= 8, 'con la tapa levantada se ven las piezas');
  // About to spit, the envelope's mouth is open: dark, with confetti, on the mouth's row (the side face, left of x 12, is dark too).
  const my = P3.SOBRE_FEET.y - P3.SOBRE_MOUTH_Y - 1;
  const deep = MATERIALS.fucsia[5]!;
  const dark = (cv: Canvas): number => {
    let n = 0;
    for (let x = 12; x < P3.SOBRE_W; x++) if (same(cv.get(x, my + 1), deep)) n++;
    return n;
  };
  assert.ok(dark(sf[a.warn!]!) >= 4 && dark(sf[0]!) === 0, 'la boca abierta para escupir el confeti');
});

test('estilo a6: los muñequitos pisan el suelo en su ancla, con la pegatina o la estrella a la altura de su muzzleY', () => {
  const plain = P3.makeMunequitoNuevoFrames(false);
  const gold = P3.makeMunequitoNuevoFrames(true);
  for (const [id, frames] of [['munequito-repetido', plain], ['munequito-dorado', gold]] as const) {
    const def = ENEMIES[id]!;
    assert.deepEqual(def.anchor, P3.MUNE_FEET, `${id}: el ancla`);
    const a = def.anim!;
    for (const k of [...a.idle, ...a.walk!.filter((_, i) => i % 2 === 0), ...[a.warn].filter((k) => k !== undefined)]) {
      assert.equal(bottomRow(frames[k]!, def.anchor.x - 6, def.anchor.x + 6), def.anchor.y, `${id} ${k}: los pies no tocan el suelo`);
    }
    // The hurt box is the old one, and the figure fills it (and is bigger than the old 18 x 20 one).
    assert.deepEqual(def.hurt, { x: -7, y: -18, w: 14, h: 17 });
    let top = frames[0]!.h;
    for (let y = 0; y < frames[0]!.h && top === frames[0]!.h; y++) for (let x = 0; x < frames[0]!.w; x++) if (frames[0]!.get(x, y)[3] === 255) { top = y; break; }
    assert.ok(def.anchor.y - top >= 22, `${id}: mide ${def.anchor.y - top} px`);
  }
  // The gold one shoots from its chest: the star (SHINE) on the row of its muzzleY; the plain one
  // wears its white «x3» sticker there with the red print.
  const dorado = ENEMIES['munequito-dorado']!;
  assert.equal(dorado.brain.kind === 'turret' && dorado.brain.muzzleY, P3.MUNE_CHEST_Y);
  const row = P3.MUNE_FEET.y - P3.MUNE_CHEST_Y - 1;
  const count = (cv: Canvas, c: readonly number[]): number => {
    let n = 0;
    for (let x = 8; x < 18; x++) if (same(cv.get(x, row), c)) n++;
    return n;
  };
  assert.ok(count(gold[0]!, [255, 250, 240, 255]) >= 3, 'la estrella del dorado');
  assert.ok(count(plain[0]!, MATERIALS.acero[0]!) >= 1 && count(plain[0]!, MATERIALS.rojo[3]!) >= 2, 'la pegatina del repetido');
  // Biting, the mouth is open (darker pixels in the face than standing); the gold one has no bite.
  assert.equal(plain.length, 7);
  assert.equal(gold.length, 6);
  const darkFace = (cv: Canvas): number => {
    let n = 0;
    for (let y = 11; y < 15; y++) for (let x = 12; x < 19; x++) { const c = cv.get(x, y); if (c[3] === 255 && c[0] + c[1] + c[2] < 200) n++; }
    return n;
  };
  assert.ok(darkFace(plain[6]!) >= darkFace(plain[0]!) + 6, 'la boca abierta para morder');
  // The plain ones and the gold one are told apart by colour, not only by size: they share the mould.
  assert.ok(silhouetteOverlap(plain[0]!, gold[0]!) > 0.8, 'el mismo molde');
});

test('estilo a6: las piezas del suelo, una por clase, de su color, del tamaño de su radio y legibles', () => {
  const pieces = P3.makePiezasNuevas();
  assert.equal(pieces.length, BRICK_KINDS);
  const sheets = allSheets();
  assert.equal(sheets.pieza!.frameW, P3.PIEZA_W);
  assert.equal(sheets.pieza!.canvas.w / sheets.pieza!.frameW, BRICK_KINDS);
  const mats = ['rojo', 'azul', 'amarillo', 'verde'] as const;
  for (const [i, f] of pieces.entries()) {
    const l = legibility(f, FLOOR);
    assert.ok(l.darkEdge >= 0.8 && l.melts <= 1 / 3, `pieza ${i}: no se lee sobre el suelo`);
    // Most of it is its own colour.
    let own = 0;
    let all = 0;
    let x0 = f.w;
    let x1 = -1;
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const c = f.get(x, y);
      if (c[3] !== 255) continue;
      all++;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      if (MATERIALS[mats[i]!].some((t) => same([...t], c))) own++;
    }
    assert.ok(own / all >= 0.55, `pieza ${i}: ${own}/${all} de su color`);
    // As wide as the circle that hurts on the floor (BRICK_RADIUS), give or take the outline.
    assert.ok(x1 - x0 + 1 >= 2 * BRICK_RADIUS - 2 && x1 - x0 + 1 <= 2 * BRICK_RADIUS + 3, `pieza ${i}: ${x1 - x0 + 1} px de ancho`);
  }
});

test('estilo a6: la destructora, desde sus tres lados, pisa el suelo en su ancla con la boca en su muzzleY', () => {
  const def = ENEMIES.destructora!;
  assert.deepEqual(def.anchor, P4.SHRED_FEET);
  assert.deepEqual(def.hurt, { x: -14, y: -26, w: 28, h: 24 }, 'la caja de golpes de siempre');
  const frames = P4.makeDestructoraNuevaFrames();
  const a = def.anim!;
  assert.equal(frames.length, 21);
  assert.deepEqual(a.views, { front: 7, back: 14 });
  for (const shift of [0, 7, 14]) {
    for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, a.warn!]) {
      assert.equal(bottomRow(frames[k + shift]!, def.anchor.x - 10, def.anchor.x + 10), def.anchor.y, `fotograma ${k + shift}: los pies no tocan el suelo`);
    }
  }
  assert.equal(def.brain.kind === 'shredder' && def.brain.muzzleY, P4.SHRED_MOUTH_Y);
  // The blade slot (the beige's deepest tone with teeth) on the muzzle row, in the side and front
  // views; the teeth go red in the warning frame; from the back, no mouth at all.
  const row = P4.SHRED_FEET.y - P4.SHRED_MOUTH_Y - 1;
  const deep = MATERIALS.beige[6]!;
  const count = (cv: Canvas, c: readonly number[], y = row): number => {
    let n = 0;
    for (let x = 0; x < cv.w; x++) if (same(cv.get(x, y), c)) n++;
    return n;
  };
  const mouthRow = (cv: Canvas): number => count(cv, deep, row - 1) + count(cv, deep, row + 1);
  assert.ok(mouthRow(frames[0]!) >= 30, `de lado, la boca no está en la fila ${row}`);
  assert.ok(mouthRow(frames[7]!) >= 30, 'de frente, la boca');
  assert.equal(mouthRow(frames[14]!), 0, 'de espaldas no tiene boca');
  assert.equal(count(frames[0]!, MATERIALS.rojo[1]!), 0, 'los dientes, de acero');
  assert.ok(count(frames[6]!, MATERIALS.rojo[1]!) >= 5, 'a punto de embestir, los dientes rojos');
  // The bin shows (see-through glass) on the side and all over the back, not from the front.
  const glass = (cv: Canvas): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (MATERIALS.vidrio.some((t) => same([...t], cv.get(x, y)))) n++;
    return n;
  };
  assert.ok(glass(frames[14]!) > glass(frames[0]!) && glass(frames[0]!) > 40 && glass(frames[7]!) === 0, 'la papelera');
});

test('estilo a6: la fotocopiadora pisa el suelo en su ancla, saca los folios por la boca y escanea con la tapa levantada', () => {
  const def = ENEMIES.fotocopiadora!;
  assert.deepEqual(def.anchor, P4.COPIER_FEET);
  assert.deepEqual(def.hurt, { x: -16, y: -29, w: 32, h: 29 }, 'la caja de golpes de siempre');
  const frames = P4.makeFotocopiadoraNuevaFrames();
  const a = def.anim!;
  assert.equal(frames.length, 10);
  for (const k of [...a.idle, a.walk![0]!, a.walk![2]!, a.warn!, ...a.scan!, a.out!]) {
    assert.equal(bottomRow(frames[k]!, def.anchor.x - 10, def.anchor.x + 10), def.anchor.y, `fotograma ${k}: los pies no tocan el suelo`);
  }
  // The output slot (the steel's deepest tone) on the muzzle row.
  assert.equal(def.brain.kind === 'copier' && def.brain.muzzleY, P4.COPIER_MOUTH_Y);
  const row = P4.COPIER_FEET.y - P4.COPIER_MOUTH_Y - 1;
  const count = (cv: Canvas, c: readonly number[], y0 = 0, y1 = cv.h - 1): number => {
    let n = 0;
    for (let y = y0; y <= y1; y++) for (let x = 0; x < cv.w; x++) if (same(cv.get(x, y), c)) n++;
    return n;
  };
  assert.ok(count(frames[0]!, MATERIALS.acero[6]!, row - 1, row - 1) >= 15, `la boca no está en la fila ${row}`);
  // Grey, not one more beige box next to the shredder and the printer.
  const of = (cv: Canvas, m: readonly (readonly number[])[]): number => m.reduce((n, t) => n + count(cv, t), 0);
  assert.ok(of(frames[0]!, MATERIALS.acero) > 4 * of(frames[0]!, MATERIALS.beige), 'gris y no beige');
  // Lid shut: no glass, no light. Copying: the lid stands up over the body and the green bar
  // crosses the glass from the back to the front.
  const top = (cv: Canvas): number => { for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (cv.get(x, y)[3] === 255) return y; return cv.h; };
  const bar = (cv: Canvas): number => {
    let s = 0;
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) if (same(cv.get(x, y), MATERIALS.verde[1]!) && y < 18) { s += x; n++; }
    return n ? s / n : -1;
  };
  assert.equal(bar(frames[0]!), -1, 'con la tapa bajada no se ve la luz');
  const xs = a.scan!.slice(0, 3).map((k) => bar(frames[k]!));
  assert.ok(xs[0]! > 0 && xs[0]! < xs[1]! && xs[1]! < xs[2]!, `la luz no cruza el cristal (${xs.join(', ')})`);
  assert.ok(top(frames[a.warn!]!) < top(frames[0]!) - 4, 'la tapa levantada');
  // A copy coming out: more white below the slot than with the jammed sheet.
  const white = (cv: Canvas): number => count(cv, MATERIALS.acero[0]!, row, row + 6);
  assert.ok(white(frames[a.out!]!) > white(frames[0]!) + 20, 'la copia que sale');
});
