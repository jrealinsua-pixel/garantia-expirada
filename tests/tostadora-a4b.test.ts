// M14c (a4b): the Toaster's own frames (walk 6, roll 6, shoot, knocked, dying) and how the game picks them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Canvas } from '../src/art/canvas.ts';
import { CHARACTERS } from '../src/data/characters.ts';
import {
  DIE_FRAME_MS, HERO_BROKEN, HERO_HURT, HERO_ROLL, ROLL_SPIN_END, SHOOT_POSE, STRIDE_PX, heroFrame, type HeroState,
} from '../src/render/heroAnim.ts';
import { allSheets } from '../tools/sprites/build.ts';
import { TOASTER_ANIM, TOASTER_EXTRA, TOASTER_FEET_Y, TOASTER_FRAMES, makeToasterSheet } from '../tools/sprites/tostadora.ts';

const T = CHARACTERS.tostadora!;
const sheet = makeToasterSheet();
const solidRows = (cv: Canvas): number[] => Array.from({ length: cv.h }, (_, y) => y).filter((y) => Array.from({ length: cv.w }, (_, x) => x).some((x) => cv.get(x, y)[3] === 255));
const diff = (a: Canvas, b: Canvas): number => {
  let n = 0;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.get(x, y).some((v, i) => v !== b.get(x, y)[i])) n++;
  return n;
};
const at = (name: string): Canvas => sheet[TOASTER_FRAMES.length + TOASTER_EXTRA.findIndex((f) => f.name === name)]!;
const still: HeroState = { now: 0, moving: false, walked: 0, roll: null, sinceShot: Infinity, hurt: 0, dying: false, broken: false };

test('tostadora (a4b): la hoja lleva los ocho de siempre y luego sus dieciséis, donde dice su ficha', () => {
  assert.equal(sheet.length, 24);
  assert.equal(allSheets().tostadora!.canvas.w / 40, 24);
  assert.deepEqual(T.look.anim, {
    walk: [...TOASTER_ANIM.walk], roll: [...TOASTER_ANIM.roll], shoot: TOASTER_ANIM.shoot, hurt: [...TOASTER_ANIM.hurt], die: [...TOASTER_ANIM.die],
  });
  const names = [...TOASTER_FRAMES, ...TOASTER_EXTRA].map((f) => f.name);
  assert.deepEqual(TOASTER_ANIM.walk.map((i) => names[i]), ['walk6-0', 'walk6-1', 'walk6-2', 'walk6-3', 'walk6-4', 'walk6-5']);
  assert.deepEqual(TOASTER_ANIM.roll.map((i) => names[i]), ['roll-0', 'roll-1', 'roll-2', 'roll-3', 'roll-4', 'roll-5']);
  assert.deepEqual([names[TOASTER_ANIM.shoot], ...TOASTER_ANIM.hurt.map((i) => names[i]), ...TOASTER_ANIM.die.map((i) => names[i])], ['shoot', 'knocked', 'hurt', 'die-0', 'die-1']);
});

test('tostadora (a4b): cada fotograma es distinto y los de pie pisan el suelo', () => {
  for (let i = 0; i < sheet.length; i++) for (let j = i + 1; j < sheet.length; j++) assert.ok(diff(sheet[i]!, sheet[j]!) > 0, `${i} y ${j} son iguales`);
  // Walking, shooting, knocked and dying it stands on its feet (one foot may be lifted, never both).
  for (const i of [...TOASTER_ANIM.walk, TOASTER_ANIM.shoot, ...TOASTER_ANIM.hurt, ...TOASTER_ANIM.die]) {
    assert.equal(Math.max(...solidRows(sheet[i]!)), TOASTER_FEET_Y, `fotograma ${i}`);
  }
  // In the walk, consecutive frames change enough to read as steps, not a shiver.
  for (let k = 0; k < 6; k++) assert.ok(diff(sheet[TOASTER_ANIM.walk[k]!]!, sheet[TOASTER_ANIM.walk[(k + 1) % 6]!]!) >= 12, `paso ${k}`);
});

test('tostadora (a4b): rodando se encoge (piernas recogidas) sin mover la carcasa del eje del giro', () => {
  const casingMid = (cv: Canvas): number => {
    const rows = solidRows(cv).filter((y) => y < 36 && Array.from({ length: cv.w }, (_, x) => x).filter((x) => cv.get(x, y)[3] === 255).length > 20);
    return (Math.min(...rows) + Math.max(...rows)) / 2;
  };
  const rest = sheet[0]!;
  for (const i of TOASTER_ANIM.roll) {
    assert.ok(Math.abs(casingMid(sheet[i]!) - casingMid(rest)) <= 1, `fotograma ${i}: la carcasa no se mueve`);
  }
  // Tucked, the shoes are higher than when it lands.
  const shoeBottom = (cv: Canvas): number => {
    let b = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 14; x < 30; x++) if (cv.get(x, y)[3] === 255) b = Math.max(b, y);
    return b;
  };
  // Off the floor all the roll long (the cord may whip lower: it is not under the body).
  for (const i of TOASTER_ANIM.roll) assert.ok(shoeBottom(sheet[i]!) <= TOASTER_FEET_Y - 2, `fotograma ${i}`);
  assert.ok(shoeBottom(at('roll-2')) < shoeBottom(at('roll-5')));
  assert.ok(shoeBottom(at('roll-5')) < shoeBottom(sheet[0]!));
});

test('tostadora (a4b): disparando se echa atrás, y al morir echa chispas', () => {
  // The kick leans the body back (left, away from where it looks): its right edge moves left.
  const rightEdge = (cv: Canvas, y: number): number => {
    for (let x = cv.w - 1; x >= 0; x--) if (cv.get(x, y)[3] === 255) return x;
    return -1;
  };
  assert.equal(rightEdge(at('shoot'), 24), rightEdge(sheet[0]!, 24) - 1);
  assert.equal(rightEdge(at('knocked'), 26), rightEdge(sheet[0]!, 26) - 2);
  const sparks = (cv: Canvas): number => {
    let n = 0;
    for (let y = 0; y < cv.h; y++) for (let x = 0; x < cv.w; x++) {
      const [r, g, b, a] = cv.get(x, y);
      if (a === 255 && r === 255 && g === 244 && b === 170) n++;
    }
    return n;
  };
  assert.ok(sparks(at('die-0')) >= 3 && sparks(at('die-1')) >= 3);
  assert.equal(sparks(sheet[0]!), 0);
});

test('heroFrame: elige el fotograma de la tostadora según lo que hace', () => {
  const L = T.look;
  // Standing: breathing; just after a shot, the kick.
  assert.equal(heroFrame(L, still), 0);
  assert.equal(heroFrame(L, { ...still, now: 600 }), 1);
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE / 2 }), TOASTER_ANIM.shoot);
  assert.equal(heroFrame(L, { ...still, sinceShot: SHOOT_POSE * 2 }), 0);
  // Walking: six frames per stride (and shooting while walking keeps walking).
  const seen = new Set<number>();
  for (let px = 0; px < STRIDE_PX; px += 1) seen.add(heroFrame(L, { ...still, moving: true, walked: px, sinceShot: 0 }));
  assert.deepEqual([...seen], [...TOASTER_ANIM.walk]);
  assert.equal(heroFrame(L, { ...still, moving: true, walked: STRIDE_PX }), TOASTER_ANIM.walk[0]);
  // Rolling: the tucked frames while spinning, the landing one after.
  const rolled: number[] = [];
  for (let k = 0; k < 1; k += 0.05) rolled.push(heroFrame(L, { ...still, roll: k, moving: true }));
  assert.deepEqual([...new Set(rolled)], [...TOASTER_ANIM.roll]);
  assert.equal(heroFrame(L, { ...still, roll: ROLL_SPIN_END - 0.01 }), TOASTER_ANIM.roll[4]);
  // Hit: knocked first, then the squeezed face. Rolling wins over it.
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), TOASTER_ANIM.hurt[0]);
  assert.equal(heroFrame(L, { ...still, hurt: 0.3 }), HERO_HURT);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9, roll: 0.1 }), TOASTER_ANIM.roll[0]);
  // Dying: two shudders, alternating; then broken.
  assert.equal(heroFrame(L, { ...still, dying: true, now: 0 }), TOASTER_ANIM.die[0]);
  assert.equal(heroFrame(L, { ...still, dying: true, now: DIE_FRAME_MS }), TOASTER_ANIM.die[1]);
  assert.equal(heroFrame(L, { ...still, broken: true }), HERO_BROKEN);
});

test('heroFrame: los personajes sin fotogramas propios siguen con los ocho de siempre', () => {
  // (The Batidora de Vaso had none until M14c (a4c1), the Becario until (a4d1) and the Móvil until
  // (a4d2): all five have them now, so a look without them stands in for a sheet still to redraw.)
  const L = { ...CHARACTERS.movil!.look, anim: undefined };
  assert.equal(heroFrame(L, { ...still, sinceShot: 0 }), 0);
  assert.deepEqual([0, 7, 14, 21].map((walked) => heroFrame(L, { ...still, moving: true, walked })), [2, 3, 4, 5]);
  assert.equal(heroFrame(L, { ...still, roll: 0.5 }), HERO_ROLL);
  assert.equal(heroFrame(L, { ...still, hurt: 0.9 }), HERO_HURT);
  assert.equal(heroFrame(L, { ...still, dying: true }), HERO_HURT);
  assert.equal(heroFrame(L, { ...still, broken: true }), HERO_BROKEN);
});
