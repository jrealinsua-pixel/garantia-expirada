// La Lavadora Programa Eco, floor 1's second boss (M14 (j2), docs/DISENO.md «Jefes al azar»).
// A front-loading washing machine on short legs: the control panel on top (the detergent drawer
// half open and leaking blue powder, the display that always says three hours, the program dial),
// a tired, superior stare under heavy lids of casing, and the porthole as its belly, where you can
// see which program it is on: foam (Prelavado), water with an odd sock (Lavado) or a grey blur
// (Centrifugado). Jokes: the «2:59» on the display, a red sock caught in the door seal, and the
// green «ECO» leaf sticker on its side next to the A+++ label it gave itself. Big floating hands,
// never arms (docs/ESTILO_ARTE.md). 72x76, like the Nevera.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, GLOVE, GREEN, K, PANTL, RED, RUSTR, STEEL, WHITE, YEL, cube, outline, ramp } from '../../src/art/lib.ts';
import { joinPose, type Pose } from './pose.ts';

type Pt = readonly [number, number];

export const LAVADORA_W = 72;
export const LAVADORA_H = 76;

/** Enamelled white, a little cold (it is a washing machine, not a fridge: bluer than the Nevera). */
const SHELL = ramp('#ffffff', '#e4e9f2', '#bcc5d6', '#8c96ac');
const SHELL_SIDE = ramp('#aab3c6', '#8a93aa', '#6c758e', '#4e566e');
const SHELL_TOP = ramp('#f6f8fc', '#dde3ee', '#c0c8d8', '#949db2');
/** The control panel: grey plastic. */
const PANEL = ramp('#c9cfdc', '#a3aabc', '#7d8499', '#5a6076');
/** The glass of the porthole and the water behind it. */
const GLASS = ramp('#8fc4ec', '#4f86c4', '#2f5a96', '#1d3a68');
const FOAM = ramp('#ffffff', '#e8f4fb', '#bcd8ea');
const LCD_ON = hx('#7ef08a');
const LCD_BG = hx('#1f3a2c');
const AMBER = YEL[1]!;

export const LAVADORA_REST: Pose = { xb: 18, xf: 40, bob: 0 };

/** Rest, breathing and the heavy walk (a foot lifted 2 px, never crossed, like the Nevera). */
export const LAVADORA_POSES: ReadonlyArray<{ name: string; pose: Pose }> = [
  { name: 'idle0', pose: LAVADORA_REST },
  { name: 'idle1', pose: { ...LAVADORA_REST, bob: 1 } },
  { name: 'walk0', pose: { ...LAVADORA_REST, bob: -1, lift: { leg: -1, px: 2 } } },
  { name: 'walk1', pose: LAVADORA_REST },
  { name: 'walk2', pose: { ...LAVADORA_REST, bob: -1, lift: { leg: 1, px: 2 } } },
  { name: 'walk3', pose: { ...LAVADORA_REST, bob: 1 } },
];

/** Its three programs (the boss's phases): what is in the porthole, the display and the stare. */
export type Program = 'prelavado' | 'lavado' | 'centrifugado';
export const PROGRAMS: readonly Program[] = ['prelavado', 'lavado', 'centrifugado'];

export interface LavadoraLook {
  program: Program;
  /** The second breath: what is in the drum has moved a little. */
  slosh?: boolean;
  /** Stopped to weigh the load (BossPhase.mute): eyes down at its own feet, the display blinking dashes. */
  weighing?: boolean;
}

/** Porthole centre and radius (outer chrome ring). */
const PX = 41;
const PY = 47;
const PR = 12;

export function makeLavadora(pose: Pose = LAVADORA_REST, look: LavadoraLook = { program: 'prelavado' }): Canvas {
  const legs = new Canvas(LAVADORA_W, LAVADORA_H);
  const body = new Canvas(LAVADORA_W, LAVADORA_H);
  const lb = pose.lift?.leg === -1 ? pose.lift.px : 0;
  const lf = pose.lift?.leg === 1 ? pose.lift.px : 0;
  const bx = pose.xb - LAVADORA_REST.xb;
  const fx = pose.xf - LAVADORA_REST.xf;
  // Legs and shoes: grey anti-vibration feet with a rubber sole (they do not work).
  legs.rect(22 + bx, 62, 5, 8 - lb, PANTL[2]!);
  legs.rect(44 + fx, 62, 5, 8 - lf, PANTL[1]!);
  legs.rect(44 + fx, 62, 1, 8 - lf, PANTL[0]!);
  legs.rect(19 + bx, 69 - lb, 10, 4, GLOVE[2]!);
  legs.rect(19 + bx, 69 - lb, 9, 1, GLOVE[1]!);
  legs.rect(41 + fx, 69 - lf, 12, 4, GLOVE[1]!);
  legs.rect(41 + fx, 69 - lf, 11, 1, GLOVE[0]!);

  // Back hand, behind the body.
  bigHand(body, 3, 40);
  // The box: tall, in three-quarters (the top lit, the dark side on the left, the front on the right).
  cube(body, 10, 8, 52, 56, 9, 5, SHELL, SHELL_SIDE, SHELL_TOP);
  // A crumpled towel left on top (everyone uses it as a shelf).
  body.rect(36, 6, 14, 4, BLUE[1]!);
  body.rect(37, 5, 11, 1, BLUE[0]!);
  body.rect(36, 9, 14, 1, BLUE[2]!);
  body.rect(48, 9, 2, 3, BLUE[2]!);
  body.set(41, 7, BLUE[0]!);

  // The control panel across the top of the front.
  body.rect(19, 14, 42, 10, PANEL[1]!);
  body.rect(19, 14, 42, 1, PANEL[0]!);
  body.rect(19, 23, 42, 1, PANEL[3]!);
  // The detergent drawer, on the left, pulled half out (seen as a lip) and leaking blue powder.
  body.rect(20, 16, 9, 6, PANEL[2]!);
  body.rect(20, 16, 9, 1, PANEL[0]!);
  body.rect(21, 18, 7, 1, PANEL[3]!);
  body.rect(22, 21, 4, 1, BLUE[0]!);
  for (const [x, y] of [[23, 22], [24, 23], [23, 24], [24, 26]] as const) body.set(x, y, BLUE[0]!);
  // The display: «2:59», always (three hours to wash what it washed yesterday). Weighing: dashes, in amber.
  body.rect(30, 15, 19, 9, K);
  body.rect(31, 16, 17, 7, LCD_BG);
  if (look.weighing) {
    for (const x of [32, 37, 42]) body.rect(x, 19, 4, 1, AMBER);
  } else if (look.program === 'centrifugado') {
    // Spinning: the revs, in red.
    digits(body, 32, 17, '1400', RED[0]!);
  } else {
    digits(body, 33, 17, '259', LCD_ON);
    // The colon between the 2 and the 59.
    body.set(36, 18, LCD_ON);
    body.set(36, 20, LCD_ON);
  }
  // The program dial: a big knob with its pointer on «ECO».
  dial(body, 52, 16, look.program);
  // Little program marks round the dial.
  for (const [x, y] of [[51, 15], [50, 22], [59, 15], [59, 22]] as const) body.set(x, y, PANEL[3]!);

  // The face, under the panel: heavy lids of casing over tired, superior eyes (it has all day).
  eyes(body, look);

  // The porthole: chrome ring, rubber seal, the glass, and in it the program.
  porthole(body, look);
  // The handle on the right of the door.
  body.rect(54, 44, 3, 7, STEEL[2]!);
  body.rect(54, 44, 1, 7, STEEL[0]!);
  // The red sock caught in the seal, hanging out at the bottom of the door.
  body.rect(36, 58, 3, 3, RED[1]!);
  body.rect(36, 58, 1, 3, RED[0]!);
  body.rect(35, 61, 4, 2, RED[1]!);
  body.rect(35, 62, 2, 1, WHITE);
  body.set(38, 61, RED[2]!);

  // On the dark side: the energy label it printed itself (A+++, all green) and the ECO leaf sticker.
  body.rect(11, 26, 7, 11, WHITE);
  for (let i = 0; i < 4; i++) body.rect(12, 27 + i * 2, 3 + i, 1, i === 0 ? GREEN : hx(['#58b45a', '#7cc85a', '#a6d24e', '#d9cf3a'][i]!));
  body.rect(16, 27, 1, 1, K);
  leaf(body, 12, 41);
  // Vents on the side, low down.
  for (let y = 50; y < 60; y += 3) body.rect(12, y, 5, 1, SHELL_SIDE[3]!);
  // Scuffs, a dent and rust where water always drips.
  for (const [x, y] of [[22, 60], [58, 30], [26, 38], [57, 58]] as const) body.set(x, y, SHELL[3]!);
  for (const [x, y] of [[21, 61], [22, 62], [59, 61], [60, 60], [14, 61]] as const) body.set(x, y, RUSTR[1]!);
  body.rect(57, 33, 2, 1, SHELL[2]!);
  body.set(58, 34, SHELL[3]!);

  // Front hand, on the right, half over the box.
  bigHand(body, 61, 46);

  const o = outline(joinPose(legs, body, pose));
  // A drip under the door, and the hose out of its back that goes nowhere (like everything here).
  if (look.program !== 'prelavado') o.set(37, 66 + (look.slosh ? 1 : 0), [105, 170, 230, 200]);
  const hose: Pt[] = [[8, 52], [7, 53], [6, 54], [5, 55], [5, 56], [5, 57], [5, 58], [6, 59], [6, 60], [7, 61], [8, 62]];
  for (const [x, y] of hose) o.set(x, y + (y < 58 ? pose.bob : 0), GLOVE[1]!);
  o.rect(8, 63, 3, 2, GLOVE[0]!);
  return o;
}

/** Tiny 3x5 digits for the display. */
const DIGITS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '4': ['#.#', '#.#', '###', '..#', '..#'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '9': ['###', '#.#', '###', '..#', '##.'],
};

function digits(cv: Canvas, x: number, y: number, text: string, c: RGBA): void {
  // «259» leaves a column for the colon after the first digit; «1400» goes one after another.
  [...text].forEach((ch, i) => {
    const g = DIGITS[ch];
    if (!g) return;
    const gx = x + i * 4 + (text.length === 3 && i > 0 ? 1 : 0);
    g.forEach((row, j) => [...row].forEach((p, k) => {
      if (p === '#') cv.set(gx + k, y + j, c);
    }));
  });
}

/** The program dial: a round knob 7x7 with a pointer (to ECO; to the far end, spinning). */
function dial(cv: Canvas, x: number, y: number, program: Program): void {
  cv.rect(x + 1, y, 5, 7, STEEL[1]!);
  cv.rect(x, y + 1, 7, 5, STEEL[1]!);
  cv.rect(x + 1, y + 1, 3, 1, STEEL[0]!);
  cv.rect(x + 1, y + 6, 5, 1, STEEL[3]!);
  cv.rect(x + 6, y + 2, 1, 4, STEEL[3]!);
  // The pointer: up-left for ECO, straight up for Lavado, hard right for Centrifugado.
  const tip: Record<Program, Pt> = { prelavado: [x + 2, y + 2], lavado: [x + 3, y + 1], centrifugado: [x + 5, y + 3] };
  const [tx, ty] = tip[program];
  cv.set(x + 3, y + 3, K);
  cv.set(tx, ty, K);
  cv.set(Math.round((tx + x + 3) / 2), Math.round((ty + y + 3) / 2), K);
}

function eyes(cv: Canvas, look: LavadoraLook): void {
  for (const ex of [32, 46]) {
    cv.rect(ex, 27, 8, 7, K);
    if (look.weighing) {
      // Looking down at its feet, at the scale it does not have.
      cv.rect(ex + 3, 31, 3, 2, WHITE);
      cv.rect(ex + 3, 32, 3, 1, hx('#3a5a8a'));
      cv.rect(ex, 27, 8, 4, SHELL[1]!);
      cv.rect(ex, 30, 8, 1, SHELL[3]!);
      continue;
    }
    // The iris: soap blue, a white glint.
    const small = look.program === 'centrifugado';
    if (small) {
      // Spinning: wide awake, the pupils shrunk to a dot.
      cv.rect(ex + 3, 29, 2, 2, BLUE[0]!);
      cv.set(ex + 3, 29, WHITE);
    } else {
      cv.rect(ex + 3, 29, 3, 3, BLUE[1]!);
      cv.rect(ex + 3, 31, 3, 1, BLUE[2]!);
      cv.set(ex + 5, 29, WHITE);
    }
    // The lids: tired and superior in Prelavado (half shut, flat), cross in Lavado (slanting in
    // towards the middle), barely any in Centrifugado.
    if (look.program === 'prelavado') {
      cv.rect(ex, 27, 8, 2, SHELL[1]!);
      cv.rect(ex, 28, 8, 1, SHELL[3]!);
    } else if (look.program === 'lavado') {
      const inner = ex === 32 ? 1 : -1;
      for (let i = 0; i < 8; i++) {
        const k = inner > 0 ? i : 7 - i;
        const h = 1 + Math.floor((k * 4) / 8);
        cv.rect(ex + i, 27, 1, h, SHELL[1]!);
        cv.set(ex + i, 27 + h, SHELL[3]!);
      }
    } else {
      cv.rect(ex, 27, 8, 1, SHELL[3]!);
    }
  }
}

function porthole(cv: Canvas, look: LavadoraLook): void {
  // Chrome ring, then the grey rubber seal, then the glass.
  disc(cv, PX, PY, PR, STEEL[1]!);
  disc(cv, PX, PY, PR - 1, STEEL[2]!);
  // Top-left of the ring catches the light.
  arc(cv, PX, PY, PR, (a) => a > 3.4 && a < 4.9, STEEL[0]!);
  disc(cv, PX, PY, PR - 2, GLOVE[1]!);
  disc(cv, PX, PY, PR - 3, GLASS[2]!);
  const r = PR - 3;
  const s = look.slosh ? 1 : 0;
  if (look.program === 'prelavado') {
    // Foam up to the brim, a little water at the bottom.
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const foam = y < 3 - s + Math.round(Math.sin((x + s * 2) * 0.9) * 1.5);
        if (foam) cv.set(PX + x, PY + y, (x + y + s) % 5 === 0 ? FOAM[2]! : (x * 3 + y) % 7 === 0 ? FOAM[0]! : FOAM[1]!);
        else cv.set(PX + x, PY + y, GLASS[1]!);
      }
    }
    // Bubbles in the foam.
    for (const [x, y] of [[-4, -4], [3, -2], [-1, 1], [5, 3]] as const) {
      cv.set(PX + x + s, PY + y, FOAM[2]!);
      cv.set(PX + x + s + 1, PY + y - 1, FOAM[2]!);
    }
  } else if (look.program === 'lavado') {
    // Water, the level sloshing, and an odd sock going round.
    const level = -2 + s;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y > r * r) continue;
        const wet = y >= level + (x > 0 ? 1 : 0);
        cv.set(PX + x, PY + y, wet ? (y === level || (y === level + 1 && x > 0) ? GLASS[0]! : GLASS[1]!) : GLASS[3]!);
      }
    }
    const sx = PX - 3 + s * 2;
    const sy = PY + 2 - s;
    cv.rect(sx, sy, 3, 4, RED[1]!);
    cv.rect(sx, sy + 3, 5, 2, RED[1]!);
    cv.rect(sx + 3, sy + 4, 2, 1, WHITE);
    cv.rect(sx, sy, 3, 1, WHITE);
    for (const [x, y] of [[4, 4], [-5, 5], [2, -4 + s]] as const) cv.set(PX + x, PY + y, FOAM[1]!);
  } else {
    // Spinning: everything is a grey-blue blur of streaks going round.
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        const d2 = x * x + y * y;
        if (d2 > r * r) continue;
        const a = Math.atan2(y, x) + Math.sqrt(d2) * 0.35 + s * 0.6;
        const band = Math.floor(((a / (Math.PI * 2)) * 6 + 12) % 2);
        cv.set(PX + x, PY + y, band ? GLASS[1]! : GLASS[2]!);
      }
    }
    // A streak of the red sock and the white of the foam, smeared round.
    arc(cv, PX, PY, 6, (a) => (a + s * 0.8) % (Math.PI * 2) < 1.4, RED[1]!);
    arc(cv, PX, PY, 4, (a) => ((a + Math.PI + s * 0.8) % (Math.PI * 2)) < 1.2, FOAM[1]!);
    cv.set(PX, PY, GLASS[3]!);
  }
  // The glint on the glass.
  cv.set(PX - 5, PY - 6, WHITE);
  cv.set(PX - 6, PY - 5, WHITE);
  cv.set(PX - 4, PY - 6, FOAM[1]!);
}

function disc(cv: Canvas, cx: number, cy: number, r: number, c: RGBA): void {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) cv.set(cx + x, cy + y, c);
}

/** The pixels on the circle of radius r (one px thick) whose angle (0-2π, from +x clockwise on screen) passes `keep`. */
function arc(cv: Canvas, cx: number, cy: number, r: number, keep: (a: number) => boolean, c: RGBA): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d2 = x * x + y * y;
      if (d2 > r * r + r * 0.6 || d2 < (r - 1) * (r - 1) + (r - 1) * 0.6) continue;
      const a = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);
      if (keep(a)) cv.set(cx + x, cy + y, c);
    }
  }
}

/** The ECO sticker: a green leaf with its vein, a corner peeling. */
function leaf(cv: Canvas, x: number, y: number): void {
  const L = ramp('#a6e07a', '#58b45a', '#2f7a41');
  cv.rect(x + 1, y, 3, 1, L[0]!);
  cv.rect(x, y + 1, 5, 3, L[1]!);
  cv.rect(x + 1, y + 4, 3, 1, L[2]!);
  cv.set(x, y + 1, L[0]!);
  for (let i = 0; i < 4; i++) cv.set(x + 1 + Math.floor(i / 2), y + 4 - i, L[2]!);
  cv.set(x + 4, y + 4, WHITE);
}

/** A boss hand: 7x7 and rounded, like the Nevera's. */
function bigHand(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 7, 7, GLOVE[1]!);
  cv.rect(x, y, 6, 1, GLOVE[0]!);
  cv.rect(x + 6, y, 1, 7, GLOVE[2]!);
  cv.rect(x + 1, y + 6, 6, 1, GLOVE[2]!);
}

/** Frames per program on the sheet: rest, breathing, four of walking and one weighing the load. */
export const LAVADORA_PER_PROGRAM = 7;

/**
 * The sheet: three blocks of LAVADORA_PER_PROGRAM frames, one per program (Prelavado, Lavado,
 * Centrifugado), each idle0, idle1 (sloshing), walk0-3 and weighing. Frame 0 is the rest pose.
 */
export function makeLavadoraFrames(): Canvas[] {
  return PROGRAMS.flatMap((program) => [
    ...LAVADORA_POSES.map((f, i) => makeLavadora(f.pose, { program, slosh: i % 2 === 1 })),
    makeLavadora({ ...LAVADORA_REST, bob: 1 }, { program, weighing: true }),
  ]);
}

/** Enemy-bullet grids: `w` white, `f` foam, `F` foam shade, `c`/`C` cyan rim, `r`/`R`/`l` sock reds. */
const BULLET_COLS: Record<string, RGBA> = {
  w: WHITE, f: FOAM[1]!, F: FOAM[2]!, c: hx('#69dbd8'), C: hx('#3a9ea6'), r: RED[1]!, R: RED[2]!, l: RED[0]!,
};

function grid(frames: ReadonlyArray<readonly string[]>, size: number): Canvas {
  const sheet = new Canvas(size * frames.length, size);
  frames.forEach((rows, f) => {
    const cv = new Canvas(size, size);
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = BULLET_COLS[ch];
      if (c) cv.set(i + 1, j + 1, c);
    }));
    sheet.blit(outline(cv), f * size, 0);
  });
  return sheet;
}

/**
 * A soap bubble of «Prelavado» (radius 6 in the game): pale foam with a cyan rim, so it reads as an
 * enemy bullet and not as a cloud, a white glint top-left; two frames, round and a little squashed,
 * as it wobbles. 16x16.
 */
export function makeFoamBullet(): Canvas {
  return grid(
    [
      [
        '....cccccc....', '..ccffffffcc..', '.cfwwfffffffc.', '.cfwffffffffc.', 'cfffffffffffFc', 'cfffffffffffFc', 'cffffffffffFFc',
        'cffffffffffFFc', 'cfffffffffFFFc', 'cffffffffFFFFc', '.cffffffFFFFc.', '.cFFfFFFFFFCc.', '..ccFFFFFFcc..', '....cccccc....',
      ],
      [
        '..............', '...cccccccc...', '.ccffffffffcc.', 'cfwwfffffffffc', 'cfwffffffffffc', 'cfffffffffffFc', 'cffffffffffFFc',
        'cffffffffffFFc', 'cfffffffffFFFc', 'cfffffffFFFFFc', '.cFFfFFFFFFFc.', '..cccFFFFFCc..', '....cccccc....', '..............',
      ],
    ],
    16,
  );
}

/**
 * An odd sock of «Lavado»: red, with the white heel and toe, flapping (straight, then folded at the
 * heel). 12x12, 2 frames. Never in pairs.
 */
export function makeSockBullet(): Canvas {
  return grid(
    [
      ['.lrrr.....', '.rrrr.....', '.rRrr.....', '.rrrr.....', '.rrrrr....', '.rrrrrrr..', '.rrrrrrwww', '..wRrrrwww', '...wwwRR..', '..........'],
      ['..........', 'lrrrrr....', 'rrRrrrr...', 'rrrrrrrr..', '.rrrrrrrrw', '..wrrrrrww', '..wwwrRrww', '....RRRR..', '..........', '..........'],
    ],
    12,
  );
}
