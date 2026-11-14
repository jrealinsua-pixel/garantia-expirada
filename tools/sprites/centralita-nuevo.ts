// M14c (a7h): La Centralita in the new style (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo», and the
// bosses' size rule of (a7a)). The old sprite stays in centralita.ts, which still draws her bullets,
// her low counters and the zones of her voice menu.
//
// An old switchboard the size of a wardrobe, in three-quarters (the dark side on the left), of
// varnished teak (`teca`, new material) on a scuffed plinth: no legs, no gloves; her arms are the two
// long cords off the ends of her desk, with a fat plug on the end of each for a hand (`rojo` sleeves,
// black `goma` once she has torn them out in phase 3). On the bakelite jack panel, the face: two
// amber pilot lamps in chrome bezels for eyes, half covered from below so they smile (^ ^), and the
// loudspeaker for a mouth, a crescent grin of cloth with slats (the smile of a recording: she grins
// even when furious). Round the face, the jacks with their brass rims and the lamps of the calls on
// hold, blinking in turns, never all off. Jokes: the brass plate with «1962», the year she was put in
// and the last time anyone updated her; the operator's headset hanging on a hook on her door, with
// nobody in it (the operators were the first thing she replaced); and on her dark side the post-it
// «Vuelva a llamar más tarde».

import type { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

type Pt = readonly [number, number];

export const CENTRALITA_W = 84;
export const CENTRALITA_H = 88;
/** Under the middle of her plinth, on the floor (EnemyDef.anchor). */
export const CENTRALITA_FEET = { x: 38, y: 86 } as const;
/** The tip of her front cord, raised: the plugs come out of there (BossBrain.muzzle, the old one, kept). */
export const CENTRALITA_MOUTH = { x: 30, y: 44 } as const;

/**
 * Frame names, in the sheet's order. Phases 1-2: resting (the call lamps blink in turns, the cords
 * sway), dragging herself (reach, plant, pull, push), talking (the voice menu, two beats), throwing a
 * plug, the hold music, and putting you through (the phase change to phase 2: her front plug in her
 * own panel and the bell ringing). Phase 3 without her plugs: cords up and sparking (two beats),
 * dragging herself faster, mute (the moment to hit her), tearing her plugs out (the phase change),
 * swinging her cords round and the hold music gone wrong.
 */
export const CENTRALITA_FRAMES = [
  'reposo0', 'reposo1',
  'arrastra0', 'arrastra1', 'arrastra2', 'arrastra3',
  'habla0', 'habla1',
  'lanza',
  'espera',
  'pasando',
  'sin-clavijas0', 'sin-clavijas1',
  'sin-clavijas-arrastra0', 'sin-clavijas-arrastra1',
  'muda',
  'arranque',
  'barrido',
  'espera-rota',
] as const;
export type CentralitaFrame = (typeof CENTRALITA_FRAMES)[number];
/** Index of a frame by name (EnemyAnim and the attacks' `pose` in src/data/enemies.ts). */
export const CF = Object.fromEntries(CENTRALITA_FRAMES.map((n, i) => [n, i])) as Record<CentralitaFrame, number>;

export type CentralitaPhase = 'menu' | 'sin-clavijas' | 'muda';
type Arms = 'rest' | 'rest2' | 'reach' | 'plant' | 'pull' | 'push' | 'throw' | 'hold' | 'patch' | 'raised' | 'raised2' | 'sweep' | 'limp';
type Eyes = 'smile' | 'closed' | 'angry' | 'wide' | 'blank';

export interface CentralitaLook {
  phase?: CentralitaPhase;
  arms?: Arms;
  eyes?: Eyes;
  /** The loudspeaker open (talking, two beats). */
  talk?: 0 | 1;
  /** Which call lamps are lit this frame; 'all' while she puts you through. */
  calls?: 0 | 1 | 'all';
  /** The whole cabinet lurched forward (dragging), in px. */
  dx?: number;
  /** Extras: hold-music notes (good or broken), plugs flying off, the bell on top. */
  notes?: 'good' | 'broken';
  flying?: boolean;
  bell?: boolean;
  dust?: boolean;
}

// The cabinet: the front face, and how far the top and the left side recede.
const FX = 22;
const FW = 42;
const FY = 22;
const FH = 58;
const SIDE = 10;
const TOP = 6;
/** The plinth's bottom row (the floor line is the outline under it). */
const FLOOR = CENTRALITA_FEET.y - 1;
/** The jack panel. */
const PX = 25;
const PY = 29;
const PW = 36;
const PH = 25;
/** The desk shelf's top row. */
const SY = 55;
/** Where the cords come off the ends of the desk. */
const FRONT_ROOT: Pt = [65, 57];
const BACK_ROOT: Pt = [14, 58];

/** Tiny 3x5 glyphs. */
const GLYPHS: Record<string, readonly string[]> = {
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '6': ['.##', '#..', '###', '#.#', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
};

function text(p: Paint, x: number, y: number, s: string, m: Material, tone: number): void {
  [...s].forEach((ch, i) => {
    GLYPHS[ch]?.forEach((row, j) => [...row].forEach((c, k) => {
      if (c === '#') p.px(x + i * 4 + k, y + j, m, tone);
    }));
  });
}

function bez(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

/**
 * A cloth-covered cord 3 px thick along a curve: a dark rim, lit along its top, the weave every few
 * px (the long cords are her arms).
 */
function cord(p: Paint, a: Pt, c: Pt, b: Pt): void {
  const pts: Pt[] = [];
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.8) + 6;
  for (let i = 0; i <= n; i++) {
    const [x, y] = bez(a, c, b, i / n);
    const q: Pt = [Math.round(x), Math.round(y)];
    const last = pts[pts.length - 1];
    if (!last || last[0] !== q[0] || last[1] !== q[1]) pts.push(q);
  }
  for (const [x, y] of pts) p.rect(x - 1, y - 1, 3, 3, 'violeta', 5);
  for (const [x, y] of pts) p.px(x, y, 'violeta', 3);
  for (const [x, y] of pts) if (!pts.some(([u, v]) => u === x && v === y - 1)) p.px(x, y - 1, 'violeta', 4);
  pts.forEach(([x, y], i) => {
    if (i % 4 === 0) p.px(x - 1, y - 1, 'violeta', 2);
  });
}

const DIRS = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] } as const;
type Dir = keyof typeof DIRS;

/**
 * The fat plug on the end of a cord, her «hand»: the sleeve (ribbed, with a darker band), the steel
 * ferrule and the brass tip, from (x, y) where the cord goes in, pointing `dir`. 14 px long.
 */
function plug(p: Paint, x: number, y: number, dir: Dir, black: boolean): void {
  const [dx, dy] = DIRS[dir];
  const ax = -dy;
  const ay = dx;
  const sleeve: Material = black ? 'goma' : 'rojo';
  const put = (u: number, v: number, m: Material, tone: number): void => p.px(x + dx * u + ax * v, y + dy * u + ay * v, m, tone);
  for (let u = 0; u < 14; u++) {
    const half = u < 8 ? 3 : u < 11 ? 2 : u < 13 ? 1 : 0;
    for (let v = -half; v <= half; v++) {
      // Lit towards the upper left: how far this pixel is that way across the plug.
      const s = -(ax * v) - ay * v;
      const tone = s >= 2 ? 1 : s >= 0 ? 2 : s >= -1 ? 3 : 4;
      if (u < 8) put(u, v, sleeve, u === 2 || u === 5 ? tone + 1 : u === 0 ? tone + 1 : tone);
      else if (u < 11) put(u, v, 'acero', tone);
      else put(u, v, 'laton', Math.max(0, tone - 1));
    }
  }
  // The white core of a fresh plug (red ones only: the game's red things have one).
  if (!black) put(4, 0, 'rojo', 0);
}

/** A little spark (phase 3): cyan, the colour of electricity in this game, with a white core. */
function spark(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy] of [[0, 0], [-1, -1], [1, -1], [2, -2], [-2, 1], [1, 1], [-1, 2]] as const) {
    if (x + dx < 0 || y + dy < 0 || x + dx >= cv.w || y + dy >= cv.h) continue;
    cv.put(x + dx, y + dy, dx === 0 && dy === 0 ? SHINE : [105, 219, 216, 255]);
  }
}

/**
 * Where her brass plate is in the frame. The game draws it again on top, unflipped
 * (`placa-centralita`, EnemyAnim.badge), so «1962» reads when she faces left too.
 */
export const CENTRALITA_PLATE = { x: FX + 11, y: FY, w: 19, h: 6 } as const;

/** The brass plate: «1962», the year she was put in (nobody has updated her since). */
function plate(p: Paint, bx: number, by: number): void {
  p.rect(bx, by, 19, 6, 'laton', 1);
  p.rect(bx, by, 19, 1, 'laton', 0);
  p.rect(bx, by + 5, 19, 1, 'laton', 2);
  p.px(bx + 1, by + 2, 'laton', 2);
  p.px(bx + 17, by + 2, 'laton', 2);
  text(p, bx + 2, by + 1, '1962', 'laton', 3);
}

/** Her plate on its own, the same pixels as in the frame (`placa-centralita`). */
export function makeCentralitaPlate(): Canvas {
  const p = new Paint(CENTRALITA_PLATE.w, CENTRALITA_PLATE.h);
  plate(p, 0, 0);
  return p.cv;
}

/** The teak cabinet: the top, the dark side with the post-it, the front, the plinth. */
function cabinet(p: Paint): void {
  // The dark side, receding up and to the left; its far edge catches a little light.
  for (let i = 0; i < SIDE; i++) {
    const x = FX - SIDE + i;
    const y0 = FY - TOP + Math.round((i * TOP) / SIDE);
    for (let y = y0; y < y0 + FH; y++) p.px(x, y, 'teca', i === 0 ? 2 : y > y0 + FH - 6 ? 4 : 3);
    // Its own bit of plinth, darker.
    for (let y = y0 + FH; y < y0 + FH + 6 && y <= FLOOR; y++) p.px(x, y, 'teca', 6);
    p.px(x, y0 + FH, 'teca', 5);
  }
  // The grain of the teak along the side.
  for (const gy of [9, 20, 31, 44, 52]) for (let i = 1; i < SIDE - 1; i++) p.px(FX - SIDE + i, FY - TOP + Math.round((i * TOP) / SIDE) + gy + (i % 3 === 0 ? 1 : 0), 'teca', 4);
  // The top: lit, darker at the back, a bright edge at the front.
  for (let j = 0; j < TOP; j++) {
    const off = Math.round(((j + 1) * SIDE) / TOP);
    const y = FY - TOP + j;
    for (let x = FX - SIDE + off; x < FX - SIDE + off + FW; x++) p.px(x, y, 'teca', j === TOP - 1 ? 0 : j === 0 ? 2 : 1);
  }
  for (let x = FX + 6; x < FX + 24; x++) p.px(x, FY - 3, 'teca', 0);
  // The front: varnished teak with its grain, lit down the left edge.
  for (let y = FY; y < FY + FH; y++) {
    for (let x = FX; x < FX + FW; x++) {
      const grain = (x * 7 + Math.floor(y / 9) * 3) % 11 === 0;
      p.px(x, y, 'teca', x === FX ? 1 : grain ? 3 : 2);
    }
  }
  // The cornice: a moulding along the top of the front.
  p.rect(FX, FY, FW, 2, 'teca', 1);
  p.rect(FX, FY + 2, FW, 1, 'teca', 0);
  p.rect(FX, FY + 5, FW, 1, 'teca', 3);
  plate(p, CENTRALITA_PLATE.x, CENTRALITA_PLATE.y);
  // The post-it on the dark side: «Vuelva a llamar más tarde» (three lines of scrawl), a corner up.
  const nx = FX - SIDE + 2;
  const ny = FY + 14;
  p.rect(nx, ny, 7, 7, 'amarillo', 1);
  p.rect(nx, ny, 7, 1, 'amarillo', 0);
  p.rect(nx + 1, ny + 2, 5, 1, 'amarillo', 3);
  p.rect(nx + 1, ny + 4, 4, 1, 'amarillo', 3);
  p.rect(nx + 1, ny + 5, 2, 1, 'amarillo', 3);
  p.px(nx + 6, ny + 6, 'amarillo', 2);
  p.px(nx + 6, ny + 7, 'amarillo', 3);
  // The frame round the jack panel.
  p.rect(PX - 1, PY - 1, PW + 2, PH + 2, 'teca', 3);
  p.rect(PX - 1, PY + PH, PW + 2, 1, 'teca', 1);
  // The plinth: darker, scuffed from being dragged across every floor in the building.
  p.rect(FX, FY + FH, FW, FLOOR - FY - FH + 1, 'teca', 4);
  p.rect(FX, FY + FH, FW, 1, 'teca', 5);
  p.rect(FX, FY + FH + 1, FW, 1, 'teca', 3);
  for (const [sx, w] of [[FX + 4, 4], [FX + 13, 2], [FX + 22, 5], [FX + 33, 3]] as const) p.rect(sx, FLOOR - 2, w, 1, 'teca', 2);
  p.rect(FX, FLOOR, FW, 1, 'teca', 5);
}

/** The jack panel: bakelite, the jacks with brass rims round the face, the lamps of the calls on hold. */
function panel(p: Paint, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  p.rect(PX, PY, PW, PH, 'quemada', 3);
  p.rect(PX, PY, PW, 1, 'quemada', 4);
  p.rect(PX, PY, 1, PH, 'quemada', 4);
  p.rect(PX + PW - 1, PY + 1, 1, PH - 1, 'quemada', 2);
  // A sheen across the bakelite (sixty years of fingers).
  for (let i = 0; i < 6; i++) p.px(PX + 2 + i, PY + 2 + i * 3, 'quemada', 2);
  let jack = 0;
  for (let jy = PY + 2; jy <= PY + PH - 3; jy += 4) {
    for (let jx = PX + 1; jx <= PX + PW - 3; jx += 4) {
      if (jx >= PX + 3 && jx <= PX + PW - 5 && jy <= PY + PH - 5) continue;
      p.rect(jx, jy, 2, 2, 'quemada', 4);
      p.px(jx, jy, 'laton', 2);
      p.px(jx + 1, jy + 1, 'laton', 3);
      const lit = look.calls === 'all' || (phase !== 'muda' && (jack + (look.calls === 1 ? 1 : 0)) % 3 === 0);
      p.px(jx + 1, jy - 1, lit ? (phase === 'sin-clavijas' ? 'rojo' : 'amarillo') : 'quemada', lit ? 1 : 2);
      jack++;
    }
  }
}

/** The eyes: two pilot lamps in chrome bezels. */
function eyes(p: Paint, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  const kind: Eyes = look.eyes ?? (phase === 'muda' ? 'blank' : phase === 'sin-clavijas' ? 'angry' : 'smile');
  for (const ex of [PX + 4, PX + 20]) {
    const left = ex === PX + 4;
    // The chrome bezel, 11x11 with the corners cut, lit from the top left.
    for (let j = 0; j < 11; j++) {
      for (let i = 0; i < 11; i++) {
        const cut = (i === 0 || i === 10) && (j === 0 || j === 10);
        if (cut) continue;
        p.px(ex + i, PY + 1 + j, 'acero', i + j < 6 ? 1 : i + j > 15 ? 4 : 3);
      }
    }
    const gx = ex + 1;
    const gy = PY + 2;
    const insetOf = (j: number): number => (j === 0 || j === 8 ? 3 : j === 1 || j === 7 ? 1 : 0);
    const m: Material = kind === 'angry' || kind === 'wide' ? 'rojo' : 'amarillo';
    for (let j = 0; j < 9; j++) {
      const ins = insetOf(j);
      for (let i = ins; i < 9 - ins; i++) {
        if (kind === 'blank') p.px(gx + i, gy + j, 'crema', j > 5 || i > 6 ? 2 : 0);
        else p.px(gx + i, gy + j, m, i + j < 5 ? 0 : i + j > 10 ? 2 : 1);
      }
    }
    if (kind === 'blank') {
      // Blank: no glint, a grey ring inside.
      p.rect(gx + 2, gy + 6, 5, 1, 'acero', 3);
      continue;
    }
    p.raw(gx + 2, gy + 2, SHINE);
    if (kind === 'smile') {
      // The bakelite covers the bottom of the lamp in an arch: they smile (^ ^).
      for (let j = 5; j < 9; j++) for (let i = 0; i < 9; i++) if (j >= 7 || (i >= 2 && i <= 6)) p.px(gx + i, gy + j, 'quemada', 3);
      p.px(gx + 2, gy + 6, 'quemada', 3);
      p.px(gx + 6, gy + 6, 'quemada', 3);
      p.px(gx + 3, gy + 4, 'quemada', 3);
      p.px(gx + 4, gy + 4, 'quemada', 3);
      p.px(gx + 5, gy + 4, 'quemada', 3);
    } else if (kind === 'closed') {
      // Eyes shut, enjoying her own hold music: only a thin arc of light (^).
      for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) p.px(gx + i, gy + j, 'quemada', 3);
      for (const [i, j] of [[1, 5], [2, 4], [3, 3], [4, 3], [5, 3], [6, 4], [7, 5]] as const) p.px(gx + i, gy + j, 'amarillo', 1);
    } else if (kind === 'angry') {
      // Lids slanting down to the middle of the face.
      for (let i = 0; i < 9; i++) {
        const k = left ? i : 8 - i;
        p.rect(gx + i, gy, 1, 2 + Math.round(k / 2), 'quemada', 3);
      }
    } else {
      // Wide (tearing her plugs out): a small pupil of white heat.
      p.rect(gx + 3, gy + 3, 3, 3, 'rojo', 0);
    }
  }
}

/** The loudspeaker: a crescent grin of cloth with slats in a chrome rim. Talking, it opens. */
function mouth(p: Paint, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  const mx = PX + 6;
  const my = PY + 14;
  const mw = 24;
  const open = look.talk !== undefined && phase !== 'muda';
  const insets = open ? [0, 0, 0, 0, 1, 2, 4, 7] : [0, 0, 0, 1, 3, 6];
  const mh = insets.length;
  const inMouth = (i: number, j: number): boolean => j >= 0 && j < mh && i >= insets[j]! && i < mw - insets[j]!;
  for (let j = 0; j < mh; j++) {
    for (let i = 0; i < mw; i++) {
      if (!inMouth(i, j)) continue;
      const edge = !inMouth(i - 1, j) || !inMouth(i + 1, j) || !inMouth(i, j - 1) || !inMouth(i, j + 1);
      if (edge) p.px(mx + i, my + j, 'acero', j === 0 ? 2 : 3);
      else if (phase === 'muda') p.px(mx + i, my + j, 'quemada', 4);
      else p.px(mx + i, my + j, 'crema', j === 1 ? 3 : 2);
    }
  }
  // The corners curl up past the top edge: a grin.
  for (const [cx, cy] of [[-1, -1], [-1, 0], [mw, -1], [mw, 0], [-2, -2], [mw + 1, -2]] as const) p.px(mx + cx, my + cy, 'acero', 2);
  if (phase === 'muda') return;
  if (open) p.rect(mx + 6, my + 2 + (look.talk === 1 ? 1 : 0), mw - 12, mh - 4 - (look.talk === 1 ? 1 : 0), 'crema', 0);
  for (let sx = mx + 3; sx < mx + mw - 2; sx += 3) for (let j = 2; j < mh - 1; j++) if (inMouth(sx - mx, j) && p.mat[my + j]![sx] === 'crema') p.px(sx, my + j, 'crema', 4);
  if (phase === 'sin-clavijas') {
    // Torn: a rip through the cloth, the red cone behind it.
    for (const [ax, ay] of [[8, 1], [9, 2], [10, 2], [11, 3], [12, 3], [13, 4]] as const) p.px(mx + ax, my + ay, 'rojo', 3);
  }
}

/** The desk shelf: the plugs standing at the back (torn out in phase 3), the keys, the rotary dial. */
function desk(p: Paint, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  if (phase === 'menu') {
    for (let i = 0; i < 9; i++) {
      const kx = FX + 3 + i * 4;
      const m: Material = i % 3 === 1 ? 'goma' : 'rojo';
      p.rect(kx, SY - 4, 2, 4, m, 2);
      p.px(kx, SY - 4, m, 1);
      p.px(kx + 1, SY - 5, 'laton', 1);
    }
  }
  p.rect(FX - 3, SY, FW + 5, 7, 'teca', 1);
  p.rect(FX - 3, SY, FW + 5, 1, 'teca', 0);
  p.rect(FX - 3, SY + 4, FW + 5, 2, 'teca', 3);
  p.rect(FX - 3, SY + 6, FW + 5, 1, 'teca', 5);
  p.rect(FX - 3, SY, 1, 7, 'teca', 3);
  if (phase !== 'menu') for (let i = 0; i < 9; i++) p.rect(FX + 3 + i * 4, SY + 1, 2, 1, 'quemada', 4);
  // The switch keys: a row of little levers, some up and some down.
  for (let i = 0; i < 6; i++) {
    p.px(FX + 3 + i * 4, SY + 2 + (i % 2), 'acero', 1);
    p.px(FX + 3 + i * 4, SY + 3 + (i % 2), 'acero', 3);
  }
  // The rotary dial at the right end.
  const dx = FX + FW - 7;
  for (let j = -2; j <= 2; j++) for (let i = -4; i <= 4; i++) if ((i * i) / 20 + (j * j) / 6 <= 1) p.px(dx + i, SY + 2 + j, 'crema', i + j < 0 ? 0 : 2);
  for (const [i, j] of [[-3, 0], [-2, -1], [0, -2], [2, -1], [3, 0], [2, 1], [-2, 1]] as const) p.px(dx + i, SY + 2 + j, 'quemada', 3);
  p.px(dx, SY + 2, 'laton', 1);
}

/** The doors under the desk: two panels, the brass keyhole and the operator's headset on a hook. */
function doors(p: Paint): void {
  const dy = SY + 8;
  const dh = FY + FH - 1 - dy;
  for (const [x, w] of [[FX + 1, 19], [FX + 21, FW - 22]] as const) {
    p.rect(x, dy, w, dh, 'teca', 3);
    p.rect(x + 1, dy + 1, w - 2, dh - 2, 'teca', 2);
    p.rect(x + 1, dy + 1, w - 2, 1, 'teca', 1);
    p.rect(x + 1, dy + 1, 1, dh - 2, 'teca', 1);
    p.rect(x + 1, dy + dh - 2, w - 2, 1, 'teca', 4);
  }
  p.rect(FX + 20, dy + 6, 1, 2, 'laton', 1);
  p.px(FX + 20, dy + 8, 'quemada', 4);
  // The headset on its hook, nobody in it.
  const hx = FX + 30;
  const hy = dy + 2;
  p.rect(hx, hy, 3, 1, 'acero', 2);
  for (const [i, j] of [[-1, 1], [-2, 2], [-3, 3], [-3, 4], [-3, 5], [-2, 6], [3, 1], [4, 2], [5, 3], [5, 4]] as const) p.px(hx + i, hy + j, 'goma', 2);
  p.rect(hx + 4, hy + 5, 3, 4, 'goma', 1);
  p.px(hx + 4, hy + 5, 'goma', 0);
  for (const [i, j] of [[3, 9], [2, 10], [1, 10], [0, 10], [-1, 10]] as const) p.px(hx + i, hy + j, 'acero', 3);
  p.rect(hx - 4, hy + 9, 3, 2, 'goma', 1);
  p.rect(hx - 5, hy + 7, 3, 3, 'goma', 2);
}

/** The arms: the two long cords and their plugs. `back`: the one behind her (off the far end of the desk). */
function arms(p: Paint, look: CentralitaLook, back: boolean): void {
  const pose = look.arms ?? 'rest';
  const black = (look.phase ?? 'menu') !== 'menu';
  const ox = look.dx ?? 0;
  const R: Pt = back ? [BACK_ROOT[0] + ox, BACK_ROOT[1]] : [FRONT_ROOT[0] + ox, FRONT_ROOT[1]];
  type Arm = { c: Pt; e: Pt; dir: Dir };
  const sway = pose === 'rest2' ? 1 : 0;
  const lift = pose === 'raised2' ? 3 : 0;
  const BACK: Record<Arms, Arm> = {
    rest: { c: [3, 64], e: [6, 70], dir: 'down' },
    rest2: { c: [3, 64 + sway], e: [6, 70 + sway], dir: 'down' },
    reach: { c: [4, 62], e: [7, 69], dir: 'down' },
    plant: { c: [4, 64], e: [6, 70], dir: 'down' },
    pull: { c: [6, 66], e: [4, 71], dir: 'down' },
    push: { c: [3, 62], e: [3, 70], dir: 'down' },
    throw: { c: [2, 56], e: [5, 62], dir: 'down' },
    hold: { c: [0, 52], e: [6, 42], dir: 'up' },
    patch: { c: [3, 60], e: [6, 66], dir: 'down' },
    raised: { c: [0, 50], e: [6, 38 + lift], dir: 'up' },
    raised2: { c: [0, 50], e: [6, 38 + lift], dir: 'up' },
    sweep: { c: [4, 48], e: [13, 44], dir: 'left' },
    limp: { c: [8, 74], e: [16, 81], dir: 'left' },
  };
  const FRONT: Record<Arms, Arm> = {
    rest: { c: [78, 68], e: [72, 51], dir: 'up' },
    rest2: { c: [78, 69], e: [72, 52], dir: 'up' },
    reach: { c: [80, 56], e: [77, 62], dir: 'down' },
    plant: { c: [80, 62], e: [76, 71], dir: 'down' },
    pull: { c: [71, 63], e: [76, 71], dir: 'down' },
    push: { c: [70, 62], e: [70, 71], dir: 'down' },
    throw: { c: [82, 60], e: [67, 49], dir: 'up' },
    hold: { c: [82, 50], e: [71, 31], dir: 'up' },
    patch: { c: [80, 44], e: [71, 32], dir: 'left' },
    raised: { c: [82, 48], e: [72, 35 + lift], dir: 'up' },
    raised2: { c: [82, 48], e: [72, 35 + lift], dir: 'up' },
    sweep: { c: [74, 48], e: [70, 44], dir: 'right' },
    limp: { c: [70, 78], e: [64, 81], dir: 'right' },
  };
  const arm = (back ? BACK : FRONT)[pose];
  const e: Pt = [arm.e[0] + (back ? 0 : ox), arm.e[1]];
  cord(p, R, [arm.c[0] + ox, arm.c[1]], e);
  plug(p, e[0], e[1], arm.dir, black);
}

/** Where each plug's tip is (for the sparks), the same table as `arms`, roughly. */
function tips(look: CentralitaLook): Pt[] {
  const lift = look.arms === 'raised2' ? 3 : 0;
  switch (look.arms) {
    case 'raised':
    case 'raised2':
      return [[6, 24 + lift], [72, 21 + lift]];
    case 'sweep':
      return [[0, 44], [83, 44]];
    case 'throw':
      return [[67, 35]];
    default:
      return [];
  }
}

/** Sound coming out of the loudspeaker: arcs to the right (two beats, so it pulses). */
function soundArcs(cv: Canvas, x: number, y: number, beat: 0 | 1): void {
  for (const r of beat === 0 ? [3, 7] : [5, 9]) {
    for (let j = -r; j <= r; j++) {
      const ax = x + Math.round(Math.sqrt(Math.max(0, r * r - j * j)) * 0.6);
      if (cv.get(ax, y + j)[3] === 0) continue;
      cv.put(ax, y + j, j === 0 ? SHINE : [243, 234, 208, 255]);
    }
  }
}

/** A note of hold music (an eighth note), brass; broken: tilted, red, with a crack. */
function note(cv: Canvas, x: number, y: number, broken: boolean): void {
  const c: [number, number, number, number] = broken ? [228, 74, 63, 255] : [224, 184, 74, 255];
  const dark: [number, number, number, number] = [20, 15, 32, 255];
  const pts: Array<readonly [number, number]> = broken
    ? [[0, 4], [1, 4], [0, 5], [1, 5], [2, 3], [2, 2], [3, 1], [3, 0], [4, 0], [5, 1]]
    : [[0, 4], [1, 4], [0, 5], [1, 5], [2, 4], [2, 3], [2, 2], [2, 1], [2, 0], [3, 0], [4, 1], [4, 2]];
  for (const [i, j] of pts) {
    cv.put(x + i + 1, y + j + 1, dark);
  }
  for (const [i, j] of pts) cv.put(x + i, y + j, c);
}

/** The service bell on her top, ringing: «le paso con el departamento». */
function bell(p: Paint): void {
  const cx = FX + 18;
  const by = FY - TOP - 1;
  for (let j = 0; j < 5; j++) {
    const half = [1, 2, 3, 3, 4][j]!;
    if (j === 0) p.px(cx, by - 7, 'laton', 2);
    for (let i = -half; i <= half; i++) p.px(cx + i, by - 5 + j, 'laton', i < 0 ? 0 : i > 1 ? 2 : 1);
  }
  p.rect(cx - 5, by, 11, 1, 'laton', 2);
  p.px(cx, by - 6, 'laton', 1);
}

/** Dust puffs off the plinth while she drags herself. */
function dust(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy, a] of [[0, 0, 190], [1, -1, 150], [-1, -1, 130], [2, 0, 120], [-2, 0, 160], [0, -2, 110], [1, -3, 80], [-1, -2, 100]] as const) {
    if (cv.get(x + dx, y + dy)[3] === 0) cv.put(x + dx, y + dy, [200, 196, 184, a]);
  }
}

/** One frame of the Centralita. */
export function makeCentralitaNueva(look: CentralitaLook = {}): Canvas {
  const p = new Paint(CENTRALITA_W, CENTRALITA_H);
  arms(p, look, true);
  const b = new Paint(CENTRALITA_W, CENTRALITA_H);
  cabinet(b);
  panel(b, look);
  eyes(b, look);
  mouth(b, look);
  desk(b, look);
  doors(b);
  if (look.bell) bell(b);
  p.stamp(b, look.dx ?? 0, 0);
  arms(p, look, false);
  const out = p.outline();
  if (look.talk !== undefined && look.phase !== 'muda') soundArcs(out, PX + PW - 3 + (look.dx ?? 0), PY + 17, look.talk);
  if ((look.phase ?? 'menu') !== 'menu' && look.phase !== 'muda') for (const [x, y] of tips(look)) spark(out, x, y);
  if (look.notes) {
    const broken = look.notes === 'broken';
    const at: readonly Pt[] = broken ? [[74, 12], [58, 6], [8, 14]] : [[76, 16], [60, 7], [10, 20], [46, 2]];
    for (const [x, y] of at) note(out, x, y, broken);
  }
  if (look.flying) {
    // Her plugs flying off all round as she tears them out, sparks where they were.
    for (const [x, y, k] of [[20, 4, 0], [34, 10, 1], [50, 2, 2], [62, 12, 3], [28, 0, 4]] as const) {
      const c: [number, number, number, number] = k % 3 === 1 ? [83, 85, 122, 255] : [228, 74, 63, 255];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
        out.put(x + i + (k % 2 ? j >> 1 : 0), y + j, j === 0 ? [255, 125, 92, 255] : c);
        out.put(x + i + 2 + (k % 2 ? j >> 1 : 0), y + j, INK);
      }
      out.put(x + (k % 2 ? 0 : 1), y - 1, [224, 184, 74, 255]);
    }
    for (const x of [FX + 6, FX + 18, FX + 30]) spark(out, x + 1, SY - 3);
  }
  if (look.bell) {
    // The bell rings: little lines either side of it.
    for (const [x, y] of [[FX + 10, FY - 11], [FX + 9, FY - 9], [FX + 26, FY - 11], [FX + 27, FY - 9]] as const) out.put(x, y, SHINE);
  }
  if (look.dust) {
    dust(out, FX - SIDE + 2 + (look.dx ?? 0), FLOOR - 1);
    dust(out, FX - SIDE - 2 + (look.dx ?? 0), FLOOR - 2);
  }
  return out;
}

const LOOKS: Record<CentralitaFrame, CentralitaLook> = {
  reposo0: {},
  reposo1: { calls: 1, arms: 'rest2' },
  arrastra0: { arms: 'reach' },
  arrastra1: { arms: 'plant', calls: 1 },
  arrastra2: { arms: 'pull', dx: 1, dust: true },
  arrastra3: { arms: 'push', calls: 1, dust: true },
  habla0: { talk: 0 },
  habla1: { talk: 1, calls: 1, arms: 'rest2' },
  lanza: { arms: 'throw', talk: 0 },
  espera: { arms: 'hold', eyes: 'closed', talk: 1, notes: 'good' },
  pasando: { arms: 'patch', calls: 'all', talk: 0, bell: true },
  'sin-clavijas0': { phase: 'sin-clavijas', arms: 'raised' },
  'sin-clavijas1': { phase: 'sin-clavijas', arms: 'raised2', calls: 1 },
  'sin-clavijas-arrastra0': { phase: 'sin-clavijas', arms: 'pull', dx: 1, dust: true },
  'sin-clavijas-arrastra1': { phase: 'sin-clavijas', arms: 'push', calls: 1, dust: true },
  muda: { phase: 'muda', arms: 'limp' },
  arranque: { phase: 'sin-clavijas', arms: 'raised', eyes: 'wide', talk: 1, flying: true },
  barrido: { phase: 'sin-clavijas', arms: 'sweep', calls: 1 },
  'espera-rota': { phase: 'sin-clavijas', arms: 'hold', talk: 0, notes: 'broken' },
};

export function centralitaNuevaLook(name: CentralitaFrame): CentralitaLook {
  return LOOKS[name];
}

/** Her sheet, in the order of CENTRALITA_FRAMES. */
export function makeCentralitaNuevaFrames(): Canvas[] {
  return CENTRALITA_FRAMES.map((n) => makeCentralitaNueva(LOOKS[n]));
}

/** Size of each piece of her debris. */
export const CENTRALITA_BIT = 12;

/**
 * What flies off her as she comes apart (`despiece-centralita`): a plug, a bit of the jack panel, a
 * pilot lamp, the rotary dial, the operator's headset and the post-it.
 */
export function makeCentralitaBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => plug(p, 2, 6, 'right', false),
    (p) => {
      p.rect(1, 1, 10, 10, 'quemada', 3);
      p.rect(1, 1, 10, 1, 'quemada', 2);
      for (const [x, y] of [[2, 3], [6, 3], [2, 7], [6, 7]] as const) {
        p.rect(x, y, 2, 2, 'quemada', 4);
        p.px(x, y, 'laton', 2);
        p.px(x + 1, y - 1, 'amarillo', 1);
      }
    },
    (p) => {
      p.ellipsoid(6, 6, 4.6, 4.6, 'acero', { dither: 0 });
      p.ellipsoid(6, 6, 3.2, 3.2, 'amarillo', { dither: 0, bias: 0.1 });
      p.raw(5, 4, SHINE);
    },
    (p) => {
      p.ellipsoid(6, 6, 5, 4, 'crema', { dither: 0 });
      for (const [x, y] of [[3, 6], [4, 4], [6, 3], [8, 4], [9, 6], [8, 8], [4, 8]] as const) p.px(x, y, 'quemada', 3);
      p.px(6, 6, 'laton', 1);
    },
    (p) => {
      for (const [i, j] of [[3, 2], [2, 3], [1, 4], [1, 5], [1, 6], [2, 7], [7, 2], [8, 3], [9, 4]] as const) p.px(i, j, 'goma', 2);
      p.rect(8, 5, 3, 4, 'goma', 1);
      p.rect(0, 7, 3, 3, 'goma', 2);
      p.rect(4, 2, 3, 1, 'goma', 1);
    },
    (p) => {
      p.rect(2, 2, 8, 8, 'amarillo', 1);
      p.rect(2, 2, 8, 1, 'amarillo', 0);
      p.rect(3, 4, 6, 1, 'amarillo', 3);
      p.rect(3, 6, 5, 1, 'amarillo', 3);
      p.rect(3, 8, 3, 1, 'amarillo', 3);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(CENTRALITA_BIT, CENTRALITA_BIT);
    draw(p);
    return p.outline();
  });
}
