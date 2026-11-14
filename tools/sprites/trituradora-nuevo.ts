// M14c (a7i): La Trituradora, the final boss, redrawn in the new style (docs/ESTILO_ARTE.md,
// «M14c · El estilo nuevo», and the bosses' rules decided with the Nevera in (a7a)). The old sprite
// stays in trituradora.ts, which still draws its bullets, the belt, the rollers, the «APTO» labels
// and the stacks of crates (those are (a9) and (a10)).
//
// The Servicio Técnico Oficial in person: an industrial shredder the size of a wall, in hammered
// machine green (material `maquinaria`). The galvanised hopper on top is its mouth: two rollers of
// blades and the last customer, a slice of burnt toast, still sticking out of them, with the lever
// of a toaster beside it; a yellow «no introducir las manos» triangle on the hopper. Two «En
// servicio» pilot lamps under a steel visor are its eyes (amber while it diagnoses, red while it
// takes apart, bright green with a tick while everything passes), the output slot under them
// grins with a comb of teeth and shredded paper hanging out. Hazard stripes on the plinth,
// caterpillar tracks, an orange beacon on a post at the back of the hopper (it comes on when the
// taking apart starts), the inspection card hanging from the front, the round «APTO» sticker on its
// side and, under strips of tape, its emergency stop. Big floating hands in blue nitrile gloves
// (hygiene first); its tools: the barcode scanner, a screwdriver, a spring, half a keyboard and the
// price gun of «Control de calidad».
//
// The final boss is bigger than the others, as it was before (96 × 88 when they were 72 × 76):
// 108 × 96, against their 84 × 88. Same rule otherwise: the body is its hurt box; what grows is
// what sticks out (the toast, the beacon, the gloves and their tools).

import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { MATERIALS, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { stencil, stencilWidth } from '../../src/art/warehouse.ts';
import { box34 } from './planta3-nuevo.ts';

export const TRITURADORA_W = 108;
export const TRITURADORA_H = 96;
/** Where its tracks touch the floor (EnemyDef.anchor): the outline row under them. */
export const TRITURADORA_FEET = { x: 53, y: 93 } as const;
/** The last painted row (the bottom of the tracks). */
const FLOOR = TRITURADORA_FEET.y - 1;

/** Frame layout (EnemyAnim and BossPhase.look of src/data/enemies.ts). */
export const TRITURADORA_LAYOUT = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  /** «Diagnóstico»: the scanner raised at the toaster, the lamps amber (EnemyAnim.warn, and the pose of every diagnosis). */
  warn: 6,
  /** Between phases (EnemyAnim.clap): lamps flashing white, gloves up, the blades a blur. */
  clap: 7,
  /** «Despiece» (phase 2, BossPhase.look): red lamps, the beacon on. */
  despiece: { idle: [8, 9], walk: [10, 11, 12, 13], warn: 14 },
  /** Its poses taking things apart: screws (screwdriver up), springs (one pulled out), keys (half a keyboard). */
  screws: 15,
  springs: 16,
  keys: 17,
  /** «Control de calidad» (phase 3, BossPhase.look): lamps bright green with a tick, «APTO» stickers all over it. */
  calidad: { idle: [18, 19], walk: [20, 21, 22, 23], warn: 24 },
  /** The price gun up, sticking «APTO» on the floor. */
  label: 25,
  count: 26,
} as const;

type Lamps = 'on' | 'blink' | 'scan' | 'red' | 'qc' | 'flash';
type Hands = 'rest' | 'swing0' | 'swing1' | 'scan' | 'label' | 'up' | 'rub' | 'screw' | 'spring' | 'key';
type Slot = 'paper' | 'screws' | 'springs' | 'keys' | 'wide';

export interface TrituradoraLook {
  /** Breathing: the body (not the tracks) 1 px down. */
  dip?: 0 | 1;
  /** Where the tread lugs are (0-3), and which way the blades in the hopper have turned. */
  tread?: number;
  lamps?: Lamps;
  hands?: Hands;
  /** What is coming out of the output slot. */
  slot?: Slot;
  /** Which phase it is in: 0 «Diagnóstico», 1 «Despiece» (beacon on), 2 «Control de calidad» (beacon on, stickers). */
  phase?: 0 | 1 | 2;
  /** The blades a blur and sparks off the hopper (between phases). */
  fast?: boolean;
}

const WALK: ReadonlyArray<TrituradoraLook> = [
  { tread: 0, hands: 'swing0' },
  { tread: 1, dip: 1, hands: 'swing0' },
  { tread: 2, hands: 'swing1' },
  { tread: 3, dip: 1, hands: 'swing1' },
];

/** Names of its frames, in order (each one's look is trituradoraLook(name)). */
export const TRITURADORA_FRAMES = [
  'reposo0', 'reposo1', 'avanza0', 'avanza1', 'avanza2', 'avanza3', 'diagnostico', 'cambio',
  'despiece-reposo0', 'despiece-reposo1', 'despiece-avanza0', 'despiece-avanza1', 'despiece-avanza2', 'despiece-avanza3', 'despiece', 'tornillos', 'muelles', 'teclas',
  'calidad-reposo0', 'calidad-reposo1', 'calidad-avanza0', 'calidad-avanza1', 'calidad-avanza2', 'calidad-avanza3', 'calidad-aviso', 'calidad',
] as const;
export type TrituradoraFrame = (typeof TRITURADORA_FRAMES)[number];

function phaseLooks(prefix: string, phase: 0 | 1 | 2, lamps: Lamps): Array<[string, TrituradoraLook]> {
  return [
    [`${prefix}reposo0`, { phase, lamps }],
    [`${prefix}reposo1`, { phase, lamps: lamps === 'on' ? 'blink' : lamps, dip: 1, tread: 1 }],
    ...WALK.map((w, i): [string, TrituradoraLook] => [`${prefix}avanza${i}`, { ...w, phase, lamps }]),
  ];
}

const LOOKS = Object.fromEntries([
  ...phaseLooks('', 0, 'on'),
  ['diagnostico', { lamps: 'scan', hands: 'scan', tread: 2 }],
  ['cambio', { lamps: 'flash', hands: 'up', slot: 'wide', fast: true, phase: 1, tread: 1 }],
  ...phaseLooks('despiece-', 1, 'red'),
  ['despiece', { phase: 1, lamps: 'red', hands: 'rub', slot: 'wide', tread: 2 }],
  ['tornillos', { phase: 1, lamps: 'red', hands: 'screw', slot: 'screws', tread: 1 }],
  ['muelles', { phase: 1, lamps: 'red', hands: 'spring', slot: 'springs', tread: 2 }],
  ['teclas', { phase: 1, lamps: 'red', hands: 'key', slot: 'keys', tread: 3 }],
  ...phaseLooks('calidad-', 2, 'qc'),
  ['calidad-aviso', { phase: 2, lamps: 'qc', hands: 'rub', tread: 2 }],
  ['calidad', { phase: 2, lamps: 'qc', hands: 'label', tread: 3 }],
]) as Record<TrituradoraFrame, TrituradoraLook>;

export function trituradoraLook(name: TrituradoraFrame): TrituradoraLook {
  return LOOKS[name];
}

// ---------------------------------------------------------------------------------------------
// The body: the cabinet's front face (where its face is) and how far the top and the left side recede.
const X0 = 18;
const Y0 = 36;
const FW = 64;
const FH = 44;
const DEPTH = 10;
const FX = X0 + DEPTH;
/** The lamps (its eyes): centres. */
const LAMPS: ReadonlyArray<readonly [number, number]> = [[50, 55], [74, 55]];
/** The output slot (its grin): the muzzle of BossBrain is in it. */
const SLOT = { x: 44, y: 64, w: 43, h: 8 } as const;
/** The hopper: its rim's back edge, front edge, and the bottom of its front wall. */
const RIM0 = 8;
const RIM1 = 17;
const WALL1 = 31;
const rimL = (y: number): number => Math.round(22 + ((y - RIM0) * 8) / 9);
const rimR = (y: number): number => Math.round(86 + ((y - RIM0) * 8) / 9);
const wallL = (y: number): number => Math.round(30 + ((y - RIM1) * 8) / (WALL1 - RIM1));
const wallR = (y: number): number => Math.round(94 - ((y - RIM1) * 10) / (WALL1 - RIM1));

/** The «EN SERVICIO» plate: top left (x, y) in a frame (1 px lower on the dipped ones), and its size. */
const PLATE_W = stencilWidth('EN SERVICIO') + 6;
export const PLATE = { x: 60 - Math.floor(PLATE_W / 2), y: 38, w: PLATE_W, h: 9 } as const;

/** The barcode scanner's red window in the «diagnostico» frame, px from the feet (GameScene's SCANNER_TIP). */
export const SCANNER_TIP = { x: 106 - TRITURADORA_FEET.x, y: TRITURADORA_FEET.y - 44 } as const;

const tone = (m: Material, t: number): RGBA => MATERIALS[m][t]!;

/** The plate: a steel bezel with four screws, black glass, «EN SERVICIO» in green. */
function plate(p: Paint, x: number, y: number): void {
  const { w, h } = PLATE;
  p.rect(x, y, w, h, 'acero', 3);
  p.rect(x, y, w, 1, 'acero', 1);
  p.rect(x, y + h - 1, w, 1, 'acero', 5);
  p.rect(x + w - 1, y + 1, 1, h - 1, 'acero', 4);
  p.rect(x + 1, y + 1, w - 2, h - 2, 'pantalla', 5);
  p.rect(x + 1, y + 1, w - 2, 1, 'pantalla', 3);
  const txt = new Canvas(w, h);
  stencil(txt, 3, 2, 'EN SERVICIO', [255, 255, 255, 255]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (txt.get(i, j)[3] > 0) p.raw(x + i, y + j, tone('verde', 1));
  for (const [sx, sy] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]] as const) p.px(x + sx, y + sy, 'acero', 1);
}

/** The plate alone, for the game to draw unflipped over a body facing left (EnemyAnim.badge). */
export function makeServicePlate(): Canvas {
  const p = new Paint(PLATE.w, PLATE.h);
  plate(p, 0, 0);
  return p.cv;
}

/**
 * The tracks, fixed on the floor: the far one peeking out behind, the near one a rubber belt round
 * two sprockets and three rollers, the lugs moving with `tread` (one way on top, the other below).
 */
function tracks(p: Paint, tread: number): void {
  // The far track, behind and up to the left (in shade).
  p.rect(13, 76, 66, 10, 'goma', 4);
  p.rect(13, 76, 66, 1, 'goma', 3);
  for (let x = 14; x < 78; x += 4) p.px(x + (tread % 4), 76, 'goma', 2);
  const x = 19;
  const y = 80;
  const w = 77;
  const h = FLOOR - y + 1;
  p.rect(x + 2, y, w - 4, h, 'goma', 3);
  p.rect(x, y + 2, w, h - 4, 'goma', 3);
  p.rect(x + 1, y + 1, w - 2, h - 2, 'goma', 3);
  p.rect(x + 2, y, w - 4, 1, 'goma', 1);
  p.rect(x + 1, y + 1, w - 2, 1, 'goma', 2);
  p.rect(x + 2, y + h - 1, w - 4, 1, 'goma', 5);
  p.rect(x + 1, y + h - 2, w - 2, 1, 'goma', 4);
  // The lugs: across the top run moving forward, across the bottom moving back.
  for (let i = 3; i < w - 3; i++) {
    if ((i + tread) % 4 === 0) {
      p.px(x + i, y, 'goma', 0);
      p.px(x + i, y + 1, 'goma', 1);
    }
    if ((i - tread + 40) % 4 === 0) p.px(x + i, y + h - 1, 'goma', 3);
  }
  // The inner plate the wheels turn in, darker.
  p.rect(x + 4, y + 3, w - 8, h - 6, 'goma', 4);
  const wheel = (cx: number, cy: number, r: number): void => {
    p.ellipsoid(cx + 0.5, cy + 0.5, r, r, 'acero', { dither: 0, bias: -0.4 });
    p.px(cx, cy, 'acero', 5);
    // A bolt that goes round with the wheel.
    const a = (tread / 4) * Math.PI * 2;
    p.px(cx + Math.round(Math.cos(a) * (r - 1.5)), cy + Math.round(Math.sin(a) * (r - 1.5)), 'acero', 0);
  };
  wheel(x + 6, y + 6, 5);
  wheel(x + w - 7, y + 6, 5);
  for (const cx of [x + 22, x + 38, x + 54]) wheel(cx, y + 7, 3.4);
}

/** Yellow and black hazard stripes, leaning right, in a w × h band. */
function hazard(p: Paint, x: number, y: number, w: number, h: number): void {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const band = Math.floor((x + xx + yy) / 4) % 2;
      if (band) p.px(x + xx, y + yy, 'goma', yy === 0 ? 4 : 5);
      else p.px(x + xx, y + yy, 'amarillo', yy === 0 ? 0 : yy === h - 1 ? 3 : 1);
    }
  }
}

/** A round «APTO» sticker: green with a white tick (the one on its side, and in phase 3 everywhere). */
function apto(p: Paint, cx: number, cy: number): void {
  p.ellipsoid(cx + 0.5, cy + 0.5, 2.8, 2.6, 'verde', { dither: 0, bias: 0.2 });
  for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0], [2, -1]] as const) p.raw(cx + dx, cy + dy, SHINE);
}

/**
 * The hopper on top: a galvanised funnel seen from above at three quarters, its rim rolled and lit,
 * the inner back wall, the throat dark with the two rollers of blades (they turn with `tread`, or
 * blur), the slice of toast and the toaster's lever caught in them; the front wall going down to
 * the cabinet with two ribs, a weld seam, a dent and the warning triangle; the beacon on its post.
 */
function hopper(p: Paint, look: TrituradoraLook): void {
  const tread = look.tread ?? 0;
  // The beacon on its post at the back right: orange, lit from the second phase.
  const lit = (look.phase ?? 0) >= 1;
  p.rect(83, 6, 2, 3, 'acero', 2);
  p.px(83, 6, 'acero', 1);
  p.rect(81, 5, 6, 1, 'acero', 3);
  p.ellipsoid(84, 2.6, 2.8, 2.4, 'amarillo', { dither: 0, bias: lit ? 0.35 : -0.55 });
  if (lit) p.raw((tread % 2) ? 85 : 83, 2, SHINE);
  // The rim and inside, row by row.
  for (let y = RIM0; y <= RIM1; y++) {
    const x0 = rimL(y);
    const x1 = rimR(y);
    for (let x = x0; x <= x1; x++) {
      const k = y - RIM0;
      if (k === 0) p.px(x, y, 'acero', 1);
      else if (k === 1) p.px(x, y, 'acero', 3);
      else if (y === RIM1 - 1) p.px(x, y, 'acero', 0);
      else if (y === RIM1) p.px(x, y, 'acero', 2);
      else if (x - x0 < 2) p.px(x, y, 'acero', x - x0 === 0 ? 1 : 2);
      else if (x1 - x < 2) p.px(x, y, 'acero', x1 - x === 0 ? 4 : 3);
      else if (k <= 3) p.px(x, y, 'acero', k === 2 ? 3 : 4);
      else p.px(x, y, 'pantalla', k <= 5 ? 4 : 5);
    }
  }
  // The two rollers of blades across the throat: teeth that turn (a bright blur between phases).
  for (const [ry, off] of [[RIM0 + 5, 0], [RIM0 + 7, 2]] as const) {
    for (let x = rimL(ry) + 4; x <= rimR(ry) - 4; x++) {
      if (look.fast) {
        p.px(x, ry, 'acero', (x + ry) % 2 ? 2 : 1);
        continue;
      }
      const k = (x + off + tread) % 4;
      if (k === 0) {
        p.px(x, ry, 'acero', 1);
        p.px(x, ry - 1, 'acero', 3);
      } else if (k === 1) p.px(x, ry, 'acero', 4);
    }
  }
  // The last customer: an upright slice of toast, burnt at the corner, half in the blades, leaning.
  const sx = 63;
  const toast = ['.cccc.', 'ctttTc', 'cttttc', 'ctTttc', 'cttttc', 'cttbbc', 'ctbbbc', 'cttbbc', 'cttttc', 'cttttc'];
  toast.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      const x = sx + i + (j < 4 ? 1 : 0);
      const y = 3 + j;
      if (ch === 'c') p.px(x, y, 'tostada', j === 0 || i === 0 ? 3 : 4);
      else if (ch === 't') p.px(x, y, 'tostada', i < 3 ? 1 : 2);
      else if (ch === 'T') p.px(x, y, 'tostada', 0);
      else if (ch === 'b') p.px(x, y, 'quemada', 2);
    });
  });
  // The toaster's lever: a black knob on a steel stalk.
  p.rect(43, 7, 1, 7, 'acero', 2);
  p.rect(41, 5, 5, 2, 'goma', 2);
  p.px(41, 5, 'goma', 0);
  // The front wall, narrowing to the cabinet.
  for (let y = RIM1 + 1; y <= WALL1; y++) {
    const x0 = wallL(y);
    const x1 = wallR(y);
    const t = (y - RIM1) / (WALL1 - RIM1);
    for (let x = x0; x <= x1; x++) p.px(x, y, 'acero', x === x0 ? 1 : x === x1 ? 5 : t < 0.3 ? 2 : t < 0.7 ? 3 : 4);
  }
  // Two ribs, the weld seam, a dent.
  for (const ry of [22, 27]) {
    p.rect(wallL(ry) + 1, ry, wallR(ry) - wallL(ry) - 1, 1, 'acero', 1);
    p.rect(wallL(ry + 1) + 1, ry + 1, wallR(ry + 1) - wallL(ry + 1) - 1, 1, 'acero', 5);
  }
  for (let y = RIM1 + 1; y <= WALL1; y++) p.px(62, y, 'acero', y % 2 ? 4 : 2);
  p.ellipsoid(77, 25, 2.4, 1.6, 'acero', { dither: 0, bias: -0.35 });
  // «No introducir las manos»: a yellow triangle with a black exclamation mark.
  for (let j = 0; j < 6; j++) p.rect(46 - (j >> 1), 18 + j, 1 + 2 * (j >> 1), 1, 'amarillo', j === 5 ? 2 : 1);
  p.px(46, 18, 'amarillo', 0);
  p.rect(46, 20, 1, 2, 'goma', 5);
  p.px(46, 23, 'goma', 5);
}

/** A lamp: steel bezel, dark recess, the glass in the colour of what it is doing, the glint. */
function lamp(p: Paint, cx: number, cy: number, kind: Lamps, second: boolean): void {
  p.ellipsoid(cx + 0.5, cy + 0.5, 5.6, 5.6, 'acero', { dither: 0, bias: 0.05 });
  p.ellipsoid(cx + 0.5, cy + 0.5, 4.5, 4.5, 'pantalla', { dither: 0, bias: -0.35 });
  const glass: [Material, number] =
    kind === 'scan' ? ['amarillo', 0.3] :
    kind === 'red' ? ['rojo', 0.25] :
    kind === 'qc' ? ['verde', 0.55] :
    kind === 'flash' ? ['acero', 0.7] :
    kind === 'blink' && second ? ['verde', -0.6] : ['verde', 0.25];
  p.ellipsoid(cx + 0.5, cy + 0.5, 3.6, 3.6, glass[0], { dither: 0, bias: glass[1] });
  if (!(kind === 'blink' && second)) {
    p.raw(cx - 1, cy - 2, SHINE);
    p.raw(cx - 2, cy - 1, SHINE);
  }
  if (kind === 'qc') {
    // A white tick on each: everything passes.
    for (const [dx, dy] of [[-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0], [3, -1]] as const) p.raw(cx + dx, cy + dy, SHINE);
  }
  if (kind === 'scan') {
    // Scanning: a thin cross-hair of amber over each glass.
    p.rect(cx - 3, cy, 7, 1, 'amarillo', 3);
    p.rect(cx, cy - 3, 1, 7, 'amarillo', 3);
  }
}

/**
 * The visor and the lids: a steel brow across both lamps, the lids of machine paint coming down
 * over the glass, lower on the inner side (bored, and sure of itself); angrier in red, raised
 * while it flashes, level and content while everything passes.
 */
function brows(p: Paint, kind: Lamps): void {
  p.cylinderH(43, 47, 39, 3, 'acero');
  for (const [cx, cy] of LAMPS) {
    for (let xx = -5; xx <= 5; xx++) {
      const inner = cx < 62 ? xx : -xx;
      const k = (inner + 5) / 10;
      const drop = kind === 'flash' ? 0 : kind === 'qc' ? 2 : kind === 'red' ? 2 + Math.round(k * 4) : 2 + Math.round(k * 3);
      if (drop === 0) continue;
      p.rect(cx + xx, cy - 5, 1, drop, 'maquinaria', 1);
      p.px(cx + xx, cy - 5 + drop, 'maquinaria', 5);
    }
  }
}

/** The output slot, its grin: a dark recess, a comb of steel teeth, and what comes out. */
function slot(p: Paint, look: TrituradoraLook): void {
  const kind = look.slot ?? 'paper';
  const tread = look.tread ?? 0;
  const wide = kind === 'wide';
  const y0 = SLOT.y - (wide ? 2 : 0);
  const h = SLOT.h + (wide ? 3 : 0);
  const { x, w } = SLOT;
  p.cylinderH(x - 1, y0 - 2, w + 2, 2, 'acero');
  for (let j = 0; j < h; j++) p.rect(x, y0 + j, w, 1, 'pantalla', j < 2 ? 3 : j < h - 2 ? 5 : 4);
  p.rect(x - 1, y0 + h, w + 2, 1, 'acero', 1);
  p.rect(x - 1, y0 + h + 1, w + 2, 1, 'acero', 4);
  // The comb: teeth down from the top lip and up from the bottom one, interlocking.
  const tl = wide ? 3 : 2;
  for (let tx = x + 1; tx < x + w - 1; tx += 4) {
    for (let j = 0; j < tl; j++) p.rect(tx + (j > 0 ? 1 : 0), y0 + j, j > 0 ? 1 : 3, 1, 'acero', j === 0 ? 1 : 2);
    for (let j = 0; j < tl; j++) p.rect(tx + 2 + (j > 0 ? 1 : 0), y0 + h - 1 - j, j > 0 ? 1 : 3, 1, 'acero', j === 0 ? 3 : 2);
  }
  const mid = y0 + (h >> 1);
  if (kind === 'paper') {
    // Shredded paper hanging out over the stripes, swaying with the tracks.
    for (const [sx, len] of [[49, 6], [56, 4], [63, 7], [71, 5], [79, 6]] as const) {
      for (let j = 0; j < len; j++) {
        const sway = j > 2 && (tread + sx) % 4 < 2 ? 1 : 0;
        p.px(sx + sway, y0 + h - 1 + j, 'crema', j % 3 === 2 ? 2 : 0);
        p.px(sx + 1 + sway, y0 + h - 1 + j, 'crema', 3);
      }
    }
  } else if (kind === 'screws') {
    for (const [sx, sy] of [[50, mid], [58, mid - 1], [67, mid], [75, mid - 1], [83, mid]] as const) {
      p.rect(sx, sy, 2, 1, 'laton', 1);
      p.px(sx + 1, sy + 1, 'acero', 2);
    }
    // Three screws dropping out of the corner of its mouth.
    for (const [sx, sy] of [[88, 70], [91, 66], [94, 72]] as const) {
      p.rect(sx, sy, 3, 1, 'laton', 1);
      p.rect(sx + 1, sy + 1, 1, 3, 'acero', 2);
      p.px(sx + 1, sy + 3, 'acero', 4);
    }
  } else if (kind === 'springs') {
    for (const sx of [50, 61, 72]) for (let j = 0; j < 4; j++) p.rect(sx + (j % 2), mid - 2 + j, 4, 1, 'acero', j % 2 ? 3 : 1);
  } else if (kind === 'keys') {
    for (const [sx, sy] of [[50, mid - 1], [60, mid], [70, mid - 1], [80, mid]] as const) {
      p.rect(sx, sy, 3, 3, 'beige', 1);
      p.rect(sx, sy, 3, 1, 'beige', 0);
      p.px(sx + 1, sy + 1, 'beige', 4);
    }
    for (const [sx, sy] of [[90, 63], [95, 70]] as const) {
      p.rect(sx, sy, 3, 3, 'beige', 1);
      p.px(sx, sy, 'beige', 0);
      p.px(sx + 1, sy + 1, 'goma', 4);
    }
  } else {
    // Wide open: the dark throat goes deep, lit red by the motor at the back.
    p.rect(x + 4, mid, w - 8, 1, 'rojo', 4);
    p.rect(x + 10, mid, w - 20, 1, 'rojo', 3);
  }
}

/** A blue nitrile glove: the hand, the thumb towards the body, the rolled cuff below. */
function glove(p: Paint, cx: number, cy: number, side: -1 | 1, fist = false): void {
  p.rect(cx - 3, cy + 3, 7, 3, 'azul', 3);
  p.rect(cx - 3, cy + 3, 7, 1, 'azul', 1);
  p.rect(cx - 3, cy + 5, 7, 1, 'azul', 5);
  p.ellipsoid(cx + 0.5, cy, 5.6, 4.6, 'azul', { dither: 0 });
  p.ellipsoid(cx + 0.5 - side * 4.5, cy - 3, 1.8, 2.2, 'azul', { dither: 0, bias: 0.1 });
  for (const fx of [-2, 0, 2]) {
    if (fist) p.rect(cx + fx, cy - 1, 1, 3, 'azul', 4);
    else p.px(cx + fx, cy + 3, 'azul', 4);
  }
}

/** The barcode scanner: a dark pistol pointing right, the red window lit (the tip is SCANNER_TIP). */
function scanner(p: Paint, x: number, y: number): void {
  p.rect(x, y, 9, 5, 'goma', 2);
  p.rect(x, y, 9, 1, 'goma', 0);
  p.rect(x, y + 4, 9, 1, 'goma', 4);
  p.rect(x + 1, y + 5, 3, 5, 'goma', 3);
  p.rect(x + 9, y + 1, 2, 3, 'rojo', 1);
  p.raw(x + 10, y + 2, SHINE);
}

/** «Control de calidad»: the supermarket price gun grown to its size, a green «APTO» label coming out. */
function labelGun(p: Paint, x: number, y: number): void {
  p.rect(x, y, 13, 6, 'rojo', 2);
  p.rect(x, y, 13, 1, 'rojo', 1);
  p.rect(x, y + 5, 13, 1, 'rojo', 4);
  p.rect(x + 7, y + 2, 4, 2, 'crema', 0);
  p.px(x + 8, y + 2, 'goma', 4);
  p.px(x + 9, y + 3, 'goma', 4);
  p.ellipsoid(x + 3.5, y - 1.5, 2.8, 2.6, 'crema', { dither: 0, bias: 0.1 });
  p.px(x + 3, y - 2, 'crema', 4);
  p.rect(x + 13, y + 1, 1, 4, 'acero', 2);
  p.rect(x + 14, y + 1, 4, 3, 'verde', 2);
  p.rect(x + 14, y + 1, 4, 1, 'verde', 1);
  p.raw(x + 15, y + 2, SHINE);
  p.raw(x + 16, y + 3, SHINE);
  p.rect(x + 2, y + 6, 4, 5, 'rojo', 3);
}

/** Its hands and whatever they hold. */
function hands(p: Paint, look: TrituradoraLook): void {
  const h = look.hands ?? 'rest';
  const L = 8;
  const R = 100;
  switch (h) {
    case 'swing0':
      glove(p, L, 63, -1);
      glove(p, R, 68, 1);
      break;
    case 'swing1':
      glove(p, L, 68, -1);
      glove(p, R, 63, 1);
      break;
    case 'scan':
      glove(p, L, 66, -1);
      scanner(p, 96, 42);
      glove(p, 98, 49, 1, true);
      break;
    case 'label':
      glove(p, L, 66, -1);
      labelGun(p, 88, 52);
      glove(p, 92, 61, 1, true);
      break;
    case 'up':
      glove(p, 7, 40, -1);
      glove(p, 101, 40, 1);
      break;
    case 'rub':
      glove(p, 11, 60, -1, true);
      glove(p, 97, 60, 1, true);
      break;
    case 'screw':
      // A screwdriver as long as a toaster, held up.
      p.rect(10, 22, 2, 15, 'acero', 2);
      p.rect(10, 22, 1, 15, 'acero', 1);
      p.rect(10, 20, 2, 2, 'acero', 4);
      p.rect(7, 37, 8, 7, 'rojo', 2);
      p.rect(7, 37, 8, 1, 'rojo', 1);
      p.rect(7, 37, 1, 7, 'rojo', 1);
      for (const gx of [9, 11, 13]) p.rect(gx, 38, 1, 5, 'rojo', 3);
      glove(p, 10, 45, -1, true);
      glove(p, R, 64, 1);
      break;
    case 'spring': {
      glove(p, L, 66, -1);
      // A spring pulled out of its mouth, stretched to the glove.
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const y = Math.round(68 - 10 * t + Math.sin(t * Math.PI * 9) * 2);
        p.px(87 + Math.round(12 * t), y, 'acero', Math.sin(t * Math.PI * 9) > 0 ? 1 : 3);
      }
      glove(p, R, 56, 1, true);
      break;
    }
    case 'key': {
      glove(p, L, 66, -1);
      // Half a keyboard, snapped, keys missing.
      p.rect(89, 48, 17, 9, 'beige', 3);
      p.rect(89, 48, 17, 1, 'beige', 1);
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          if ((r * 5 + c) % 4 === 1) continue;
          p.rect(90 + c * 3 + (r % 2), 49 + r * 3, 2, 2, 'beige', 0);
          p.px(91 + c * 3 + (r % 2), 50 + r * 3, 'beige', 2);
        }
      }
      for (let y = 48; y < 57; y += 2) p.px(89, y, 'beige', 5);
      glove(p, 96, 60, 1, true);
      break;
    }
    default:
      glove(p, L, 66, -1);
      glove(p, R, 66, 1);
  }
}

/** The cabinet with everything on it. */
function body(b: Paint, look: TrituradoraLook): void {
  box34(b, X0, Y0, FW, FH, DEPTH, 'maquinaria', { top: [0, 1], side: [4, 3], front: [1, 2, 3] });
  // The right edge in shade, the lower front a tone darker (further from the light).
  b.rect(FX + FW - 1, Y0 + 1, 1, FH - 1, 'maquinaria', 4);
  b.rect(FX + 1, Y0 + 26, FW - 2, 10, 'maquinaria', 3);
  // Rivets down the front corners and along the side; a panel seam.
  for (let ry = Y0 + 4; ry < Y0 + FH - 8; ry += 6) {
    b.px(FX + 2, ry, 'maquinaria', 0);
    b.px(FX + 2, ry + 1, 'maquinaria', 4);
    b.px(FX + FW - 3, ry, 'maquinaria', 1);
    b.px(FX + FW - 3, ry + 1, 'maquinaria', 5);
  }
  for (let x = X0 + 1; x < X0 + FW; x += 7) b.px(x + 4, Y0 - 5, 'maquinaria', 3);
  // Rust and grease where nobody looks.
  for (const [x, y, t] of [[FX + 3, Y0 + 34, 1], [FX + 4, Y0 + 35, 2], [FX + FW - 5, Y0 + 33, 1], [X0 + 2, Y0 + 30, 2], [X0 + 4, Y0 + 12, 1]] as const) b.px(x, y, 'oxido', t);
  // The side: vent louvers, the emergency stop taped over, the inspection sticker.
  for (let y = 40; y <= 50; y += 3) {
    b.rect(X0 + 2, y, 6, 1, 'maquinaria', 6);
    b.rect(X0 + 2, y + 1, 6, 1, 'maquinaria', 2);
  }
  b.rect(X0 + 1, 56, 8, 8, 'amarillo', 2);
  b.rect(X0 + 1, 56, 8, 1, 'amarillo', 1);
  b.ellipsoid(X0 + 5, 60, 2.8, 2.6, 'rojo', { dither: 0, bias: 0.1 });
  for (let i = 0; i < 8; i++) {
    b.px(X0 + 1 + i, 56 + i, 'carton', 0);
    b.px(X0 + 8 - i, 56 + i, 'carton', 1);
  }
  apto(b, X0 + 5, 70);
  // The hazard band on the plinth.
  hazard(b, FX, Y0 + FH - 7, FW - 1, 5);
  // The inspection card on a string, last stamped long ago.
  b.px(FX + 4, Y0 + 19, 'goma', 3);
  b.px(FX + 4, Y0 + 20, 'goma', 3);
  b.rect(FX + 2, Y0 + 21, 5, 7, 'crema', 1);
  b.rect(FX + 2, Y0 + 21, 5, 1, 'crema', 0);
  for (const y of [Y0 + 23, Y0 + 25]) b.rect(FX + 3, y, 3, 1, 'crema', 4);
  b.px(FX + 5, Y0 + 26, 'rojo', 2);
  plate(b, PLATE.x, PLATE.y);
  LAMPS.forEach(([cx, cy], i) => lamp(b, cx, cy, look.lamps ?? 'on', i === 1));
  brows(b, look.lamps ?? 'on');
  slot(b, look);
  hopper(b, look);
  if (look.phase === 2) {
    // Everything passes, itself included: «APTO» stickers slapped on it.
    apto(b, 75, 21);
    apto(b, 36, 59);
    apto(b, X0 + 5, 44);
  }
  hands(b, look);
}

/** The Trituradora in one of its looks. */
export function makeTrituradoraNueva(look: TrituradoraLook = {}): Canvas {
  const p = new Paint(TRITURADORA_W, TRITURADORA_H);
  tracks(p, look.tread ?? 0);
  const b = new Paint(TRITURADORA_W, TRITURADORA_H);
  body(b, look);
  p.stamp(b, 0, look.dip ?? 0);
  const out = p.outline();
  const d = look.dip ?? 0;
  const glow = (pts: ReadonlyArray<readonly [number, number]>, c: RGBA): void => {
    for (const [x, y] of pts) if (out.get(x, y + d)[3] === 0) out.set(x, y + d, c);
  };
  // The beacon's light, turning: a beam left or right of it.
  if ((look.phase ?? 0) >= 1) glow((look.tread ?? 0) % 2 ? [[89, 1], [91, 1], [93, 0]] : [[79, 1], [77, 1], [75, 0]], [255, 190, 80, 150]);
  // Between phases: sparks off the blades.
  if (look.fast) glow([[30, 6], [27, 3], [36, 2], [56, 1], [74, 0], [92, 5], [95, 2], [50, 3]], [255, 232, 140, 200]);
  return out;
}

/** Its sheet, in the order of TRITURADORA_FRAMES. */
export function makeTrituradoraNuevaFrames(): Canvas[] {
  return TRITURADORA_FRAMES.map((n) => makeTrituradoraNueva(LOOKS[n]));
}

/** Size of each piece of its debris. */
export const TRITURADORA_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-trituradora`): a blade from the rollers, the slice
 * of toast, a pilot lamp, a piece of the hazard band, the scanner, the taped emergency stop.
 */
export function makeTrituradoraBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      p.ellipsoid(6, 6, 4.4, 4.4, 'acero', { dither: 0 });
      for (const [x, y] of [[6, 0], [11, 6], [6, 11], [0, 6], [10, 2], [10, 10], [2, 10], [2, 2]] as const) p.px(x, y, 'acero', 2);
      p.rect(5, 5, 2, 2, 'acero', 6);
    },
    (p) => {
      p.rect(3, 2, 6, 8, 'tostada', 1);
      p.rect(3, 2, 6, 1, 'tostada', 3);
      p.rect(3, 2, 1, 8, 'tostada', 3);
      p.rect(8, 2, 1, 8, 'tostada', 4);
      p.rect(3, 9, 6, 1, 'tostada', 4);
      p.rect(6, 6, 2, 3, 'quemada', 2);
    },
    (p) => lamp(p, 6, 6, 'on', false),
    (p) => hazard(p, 1, 3, 10, 6),
    (p) => scanner(p, 0, 2),
    (p) => {
      p.rect(2, 2, 8, 8, 'amarillo', 2);
      p.ellipsoid(6, 6, 2.8, 2.6, 'rojo', { dither: 0, bias: 0.1 });
      for (let i = 0; i < 8; i++) {
        p.px(2 + i, 2 + i, 'carton', 0);
        p.px(9 - i, 2 + i, 'carton', 1);
      }
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(TRITURADORA_BIT, TRITURADORA_BIT);
    draw(p);
    return p.outline();
  });
}
