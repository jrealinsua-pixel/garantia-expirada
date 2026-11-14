// M14c (a7e): El Muñeco de Moda, its sale tag and the box it leaves behind, redrawn in the new
// style (tools/sprites/muneco-nuevo.ts), checked against the style guide and the game's data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hx, type Canvas } from '../src/art/canvas.ts';
import { MATERIALS, type Material } from '../src/art/paleta.ts';
import { legibility } from '../src/art/pintor.ts';
import { ENEMIES } from '../src/data/enemies.ts';
import type { BossBrain } from '../src/data/types.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { makeMunecoFrames } from '../tools/sprites/muneco.ts';
import * as MN from '../tools/sprites/muneco-nuevo.ts';

/** The warehouse floor's middle tone, and the Juguetería's two main foam mats (where it fights). */
const FLOORS = [MATERIALS.suelo[3]!, hx('#5f4142'), hx('#574d36')];
const def = ENEMIES['muneco-moda']!;
const brain = def.brain as BossBrain;
const frames = MN.makeMunecoNuevoFrames();
const F = MN.MUNECO_FRAMES;
const same = (a: readonly number[], b: readonly number[]): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
const isMat = (c: readonly number[], m: Material): boolean => MATERIALS[m].some((t) => same(t, c));
const area = (cv: Canvas): number => cv.p.flat().filter((c) => c[3] === 255).length;
const count = (cv: Canvas, m: Material): number => cv.p.flat().filter((c) => c[3] === 255 && isMat(c, m)).length;
const bottomRow = (f: Canvas, x0: number, x1: number): number => {
  for (let y = f.h - 1; y >= 0; y--) for (let x = x0; x <= x1; x++) if (f.get(x, y)[3] === 255) return y;
  return -1;
};

test('estilo a7e: el muñeco, su etiqueta y la caja rota se leen sobre el suelo', () => {
  for (const floor of FLOORS) {
    for (const [i, f] of [...frames, MN.makeBrokenBoxNuevo()].entries()) {
      const l = legibility(f, floor);
      assert.ok(l.darkEdge >= 0.8, `${i}: borde oscuro ${l.darkEdge.toFixed(2)}`);
      assert.ok(l.edgeContrast >= 1.6, `${i}: contraste del borde ${l.edgeContrast.toFixed(2)}`);
      assert.ok(l.melts <= 1 / 3, `${i}: se funde con el suelo (${l.melts.toFixed(2)})`);
    }
  }
});

test('estilo a7e: las hojas del juego son las nuevas, más grandes, y las zapatillas pisan el ancla', () => {
  const s = allSheets()[def.sprite]!;
  assert.deepEqual([s.frameW, s.frameH, s.canvas.w / s.frameW], [MN.MUNECO_W, MN.MUNECO_H, F.count]);
  assert.equal(frames.length, F.count);
  assert.deepEqual(def.anchor, MN.MUNECO_FEET);
  assert.deepEqual(def.hurt, { x: -26, y: -68, w: 52, h: 58 }, 'la caja de golpes de siempre');
  for (const [i, f] of frames.entries()) assert.equal(bottomRow(f, def.anchor.x - 16, def.anchor.x + 16), def.anchor.y, `fotograma ${i}: las zapatillas no tocan el suelo`);
  // In its box it was already the size of its hurt box (the bosses' rule: the body does not grow),
  // so boxed it is no smaller; out of the box, much bigger.
  const old = makeMunecoFrames();
  assert.ok(area(frames[0]!) >= area(old[0]!), 'con caja, no más pequeño que el viejo');
  assert.ok(area(frames[F.loose]!) > area(old[7]!) * 1.1, 'sin caja, más grande que el viejo');
  const bits = allSheets()['despiece-muneco-moda']!;
  assert.deepEqual([bits.frameW, bits.frameH, bits.canvas.w / bits.frameW], [MN.MUNECO_BIT, MN.MUNECO_BIT, 6]);
  const tag = allSheets()['etiqueta-rebaja']!;
  assert.deepEqual([tag.frameW, tag.frameH, tag.canvas.w / tag.frameW], [MN.TAG_W, MN.TAG_H, 4]);
});

test('estilo a7e: la caja llena la caja de golpes y no se sale mucho de ella; sin caja no queda cartulina', () => {
  const h = def.hurt!;
  const A = def.anchor;
  const f = frames[0]!;
  let inside = 0;
  for (let y = A.y + h.y; y < A.y + h.y + h.h; y++) for (let x = A.x + h.x; x < A.x + h.x + h.w; x++) if (f.get(x, y)[3] === 255) inside++;
  assert.ok(inside / (h.w * h.h) > 0.85, `la caja está llena al ${((100 * inside) / (h.w * h.h)).toFixed(0)} %`);
  for (const [i, fr] of frames.entries()) {
    const card = count(fr, 'cartulina');
    if (i < F.boxed) assert.ok(card > 1200, `el fotograma ${i} lleva la caja (${card} px)`);
    else assert.equal(card, 0, `el fotograma ${i} ya no lleva caja`);
    assert.ok(count(fr, 'vinilo') > 60, `el fotograma ${i} tiene manos (y cara) de muñeco`);
    if (i >= F.boxed) continue;
    // The card stays within 6 px of the hurt box (the hanger tab sticks up above it; it is thin).
    for (let y = 0; y < fr.h; y++) for (let x = 0; x < fr.w; x++) {
      if (!isMat(fr.get(x, y), 'cartulina')) continue;
      assert.ok(x >= A.x + h.x - 6 && x < A.x + h.x + h.w + 6, `${i}: cartulina en x ${x}`);
      assert.ok(y >= A.y + h.y - 10 && y < A.y + h.y + h.h + 6, `${i}: cartulina en y ${y}`);
    }
  }
});

test('estilo a7e: los fotogramas cuadran con su anim, sus poses de ataque y su fase sin caja', () => {
  const a = def.anim!;
  assert.deepEqual(a.idle, F.idle);
  assert.deepEqual(a.walk, F.walk);
  assert.equal(a.warn, F.warn);
  assert.equal(a.clap, F.clap);
  assert.deepEqual(a.spin, [F.spinFront, F.spinSide, F.spinBack, F.spinSide]);
  assert.equal(a.badge?.upTo, F.boxed);
  assert.deepEqual(brain.phases.map((p) => p.frameShift), [undefined, undefined, undefined, undefined, F.loose]);
  const poses = brain.phases.map((ph) => ph.attacks.map((at) => ('pose' in at ? at.pose : undefined)));
  assert.deepEqual(poses[0], [F.accessories, undefined], 'la pasarela posa con su warn');
  for (const p of poses.slice(1, 4)) assert.deepEqual(p, [F.sale, F.accessories, undefined]);
  assert.deepEqual(poses[4], [F.windup, F.windup, F.accessories3]);
  // Every frame is different, except two beats of the walk, which are the two breathing frames
  // (both feet down: the rest pose, and the body down a pixel), boxed and out of the box.
  const keys = frames.map((f) => f.p.flat().join());
  assert.equal(new Set(keys).size, F.count - 4);
  assert.equal(keys[F.walk[1]], keys[F.idle[0]]);
  assert.equal(keys[F.walk[3]], keys[F.idle[1]]);
});

test('estilo a7e: la etiqueta cae entera sobre la caja en cada fotograma, subiendo y bajando con ella', () => {
  const bd = def.anim!.badge!;
  assert.deepEqual([bd.x, bd.y, bd.w], [MN.TAG_ANCHOR.x, MN.TAG_ANCHOR.y, MN.TAG_W]);
  const tags = MN.makeTagNuevoFrames();
  assert.equal(new Set(tags.map((t) => t.p.flat().join())).size, 4, 'cuatro precios distintos');
  for (let i = 0; i < F.boxed; i++) {
    const dy = bd.frameDy?.[i] ?? 0;
    assert.equal(dy, MN.BOXED_BOB[i], `fotograma ${i}: la etiqueta sigue el bote del cuerpo`);
    const f = frames[i]!;
    for (const t of tags) for (let y = 0; y < MN.TAG_H; y++) for (let x = 1; x < MN.TAG_W; x++) {
      if (t.get(x, y)[3] === 0) continue;
      assert.ok(f.get(bd.x + x, bd.y + y + dy)[3] === 255, `la etiqueta sale de la caja en (${x}, ${y}) del fotograma ${i}`);
    }
  }
  // Mirrored (facing left) it still sits on the box.
  for (let y = 0; y < MN.TAG_H; y++) for (let x = 0; x < MN.TAG_W; x++) {
    const mx = def.anchor.x * 2 - bd.x - bd.w + x;
    assert.ok(frames[0]!.get(MN.MUNECO_W - 1 - mx, bd.y + y)[3] === 255, `reflejada, en (${x}, ${y})`);
  }
});

test('estilo a7e: las caras cuentan la historia (la pose guiña, las rebajas lo horrorizan, sin caja se le va)', () => {
  // The face inside the window (boxed): blue painted eyes at rest; the markdown, all whites.
  const eyes = (f: Canvas, m: Material, x0: number, y0: number, x1: number, y1: number): number => {
    let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (isMat(f.get(x, y), m)) n++;
    return n;
  };
  const box = [36, 45, 58, 53] as const;
  assert.ok(eyes(frames[0]!, 'azul', ...box) >= 8, 'en reposo, ojos azules pintados');
  assert.ok(eyes(frames[F.warn]!, 'azul', ...box) < eyes(frames[0]!, 'azul', ...box), 'posando, guiña un ojo');
  assert.equal(eyes(frames[F.clap]!, 'azul', ...box), 0, 'rebajado: los ojos en blanco');
  // Out of the box, the hair has sprung loose: it pokes out well above the head and to the sides.
  const loose = frames[F.loose]!;
  let top = loose.h;
  for (let y = 0; y < loose.h && top === loose.h; y++) for (let x = 0; x < loose.w; x++) if (isMat(loose.get(x, y), 'tostada')) top = y;
  assert.ok(top <= 4, `el pelo, de punta (empieza en la fila ${top})`);
  // The box it leaves: empty, the −70 % tag still on, and the same box (its card).
  const broken = MN.makeBrokenBoxNuevo();
  assert.deepEqual([broken.w, broken.h], [MN.BROKEN_W, MN.BROKEN_H]);
  assert.equal(count(broken, 'vinilo'), 0, 'el muñeco ya no está');
  assert.ok(count(broken, 'cartulina') > 1200);
  assert.ok(count(broken, 'rojo') > 40, 'con la etiqueta del -70 %');
  assert.equal(bottomRow(broken, 0, broken.w - 1), broken.h - 1, 'apoyada en el suelo');
});
