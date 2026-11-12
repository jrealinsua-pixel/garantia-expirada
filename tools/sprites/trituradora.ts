// La Trituradora, the final boss (M12 (4a)): the Servicio Técnico Oficial in person
// (docs/DISENO.md, «El Servicio Técnico»). An industrial shredder the size of a wall: the hopper
// on top is its mouth (two rollers of blades, and a slice of burnt toast still sticking out of
// them: the last customer), two «En servicio» pilot lamps for eyes under a steel visor, the
// output slot below them grinning with teeth, hazard stripes on the plinth and caterpillar
// tracks, because the Servicio Técnico does not come to you, except this once. Big floating
// hands in blue nitrile gloves (a boss may have big hands, never arms: docs/ESTILO_ARTE.md); in
// «Diagnóstico» the front one raises a barcode scanner at the toaster.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, BURNT, CREAM, K, RED, STEEL, TOASTC, WHITE, YEL, cube, outline, ramp, type Ramp } from '../../src/art/lib.ts';
import { stencil, stencilWidth } from '../../src/art/warehouse.ts';

export const TRITURADORA_W = 96;
export const TRITURADORA_H = 88;
/** The floor line: the bottom of the tracks. */
export const TRITURADORA_FLOOR = 85;

/** Machine green, the paint of every industrial thing that has outlived its warranty. */
export const MACHINE = ramp('#a7c0a4', '#7b9880', '#58725e', '#3a4c40');
const MACHINE_SIDE = ramp('#62806a', '#4c6654', '#3a5040', '#28382e');
const MACHINE_TOP = ramp('#c4d8c0', '#a2bca0', '#80a084', '#5a7a60');
/** The hopper: bare galvanised steel, scratched by everything that went in. */
const HOPPER = ramp('#e4e8f0', '#b7bed0', '#858ea8', '#5a627c');
/** Its throat: dark, and darker down where the blades are. */
const THROAT = ramp('#3a3448', '#26202e', '#18141e', '#0e0c16');
/** The tracks: black rubber, the lugs a shade lighter where they catch the light. */
const RUBBER = ramp('#5a5668', '#3a3646', '#28242e', '#18141e');
/** The pilot lamps (its eyes): «En servicio» green; amber while it diagnoses. */
export const LAMP_GREEN = ramp('#e8ffd8', '#8ef07a', '#4cb84a', '#2a7a34');
export const LAMP_AMBER = ramp('#fff4c8', '#ffc24a', '#e08a24', '#9a5418');
/** Red while it takes things apart (M12 (4b), «Despiece»). */
export const LAMP_RED = ramp('#ffd0c0', '#ff6a50', '#d0302c', '#7a1a22');
const hexTape: RGBA = [176, 138, 82, 255];

/** Bright green while it passes everything (M12 (4c), «Control de calidad»). */
export const LAMP_QC = ramp('#f4ffe8', '#b4ff8a', '#62d050', '#2a8a34');
/** Blue nitrile gloves: hygiene first. */
const GLOVE_B = ramp('#b8d4f4', '#6aa0dc', '#4672b0', '#2c4a80');

type Pt = readonly [number, number];

export interface TrituradoraLook {
  /** Breathing: the body (not the tracks) 1 px down. */
  dip?: 0 | 1;
  /** Where the tread lugs are (0-3), and which way the blades in the hopper have turned. */
  tread?: number;
  /**
   * Lamps: on (green), dim (one of them blinking), scan (amber, diagnosing), red (taking apart),
   * qc (quality control, M12 (4c): bright green, each with a white tick: everything passes).
   */
  lamps?: 'on' | 'blink' | 'scan' | 'red' | 'qc';
  /** Hands: hanging, swung (walking, two beats), the scanner raised at the toaster, or the label gun. */
  hands?: 'rest' | 'swing0' | 'swing1' | 'scan' | 'label';
}

/** A big round glove, 8x7, lit from the top left; `fist`: the fingers curled round a handle. */
function glove(cv: Canvas, x: number, y: number, fist = false): void {
  const G = GLOVE_B;
  cv.rect(x + 1, y, 6, 7, G[1]!);
  cv.rect(x, y + 1, 8, 5, G[1]!);
  cv.rect(x + 1, y, 5, 1, G[0]!);
  cv.rect(x, y + 1, 1, 3, G[0]!);
  cv.rect(x + 7, y + 2, 1, 4, G[2]!);
  cv.rect(x + 1, y + 6, 6, 1, G[2]!);
  // The fingers: three creases on the front of the hand.
  if (fist) {
    cv.rect(x + 3, y + 2, 4, 1, G[2]!);
    cv.rect(x + 3, y + 4, 4, 1, G[2]!);
  } else {
    for (const fx of [2, 4, 6]) cv.set(x + fx, y + 5, G[2]!);
  }
  // The cuff, rolled.
  cv.rect(x + 1, y, 2, 2, G[0]!);
}

/**
 * The barcode scanner it diagnoses with: a dark grey pistol, the red window at the front (it
 * points right) and the trigger under the glove. (x, y): top left of the head.
 */
function scanner(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 10, 5, STEEL[3]!);
  cv.rect(x, y, 10, 1, STEEL[2]!);
  cv.rect(x + 1, y + 5, 4, 5, STEEL[4]!);
  cv.rect(x + 1, y + 5, 1, 5, STEEL[3]!);
  // The window, lit.
  cv.rect(x + 9, y + 1, 2, 3, RED[1]!);
  cv.set(x + 10, y + 2, WHITE);
}

/**
 * «Control de calidad» (M12 (4c)): a big price gun, the one from every supermarket aisle grown to
 * its size: blue body pointing right, the roll of labels on top at the back, the nozzle with a
 * green «APTO» label half out, the grip under the glove. (x, y): top left of the body.
 */
function labelGun(cv: Canvas, x: number, y: number): void {
  // The body: a wedge, taller at the back.
  for (let xx = 0; xx < 13; xx++) {
    const top = xx < 7 ? 0 : 1;
    cv.rect(x + xx, y + top, 1, 6 - top, BLUE[1]!);
    cv.set(x + xx, y + top, BLUE[0]!);
    cv.set(x + xx, y + 5, BLUE[3]!);
  }
  cv.rect(x, y + 4, 13, 1, BLUE[2]!);
  // The window with the price wheels.
  cv.rect(x + 7, y + 2, 4, 2, CREAM[0]!);
  cv.set(x + 8, y + 2, RED[1]!);
  cv.set(x + 9, y + 3, RED[1]!);
  // The roll of labels on top at the back.
  for (let yy = -4; yy <= 0; yy++) for (let xx = 0; xx <= 6; xx++) if (Math.hypot(xx - 3, yy + 2) <= 2.7) cv.set(x + xx, y + yy, Math.hypot(xx - 3, yy + 2) > 1.8 ? CREAM[2]! : WHITE);
  cv.set(x + 3, y - 2, CREAM[3]!);
  // The nozzle and the label coming out of it: green with a white tick.
  cv.rect(x + 13, y + 1, 1, 4, STEEL[2]!);
  cv.rect(x + 14, y + 1, 4, 3, LAMP_GREEN[2]!);
  cv.rect(x + 14, y + 1, 4, 1, LAMP_GREEN[1]!);
  cv.set(x + 15, y + 2, WHITE);
  cv.set(x + 16, y + 3, LAMP_GREEN[3]!);
  cv.set(x + 17, y + 2, WHITE);
  // The grip and the squeeze lever.
  cv.rect(x + 2, y + 6, 4, 5, BLUE[2]!);
  cv.rect(x + 2, y + 6, 1, 5, BLUE[1]!);
  cv.rect(x + 7, y + 6, 1, 3, STEEL[1]!);
}

/** The «EN SERVICIO» plate on the front, top left at (PLATE.x, PLATE.y) of a frame (1 px lower on the dipped ones). */
export const PLATE = { x: 30, y: 34, w: stencilWidth('EN SERVICIO') + 4, h: 8 } as const;

function plate(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, PLATE.w, PLATE.h, K);
  cv.rect(x, y, PLATE.w, 1, STEEL[3]!);
  stencil(cv, x + 2, y + 2, 'EN SERVICIO', LAMP_GREEN[2]!);
}

/** The plate alone, for the game to draw unflipped over a body facing left. */
export function makeServicePlate(): Canvas {
  const cv = new Canvas(PLATE.w, PLATE.h);
  plate(cv, 0, 0);
  return cv;
}

/** The tracks: a rubber belt round two wheels and a bogie, lugs moving with `tread`. */
function tracks(cv: Canvas, tread: number): void {
  const x = 10;
  const y = 72;
  const w = 74;
  const h = 13;
  const R = RUBBER;
  // The belt: a long rounded box.
  cv.rect(x + 2, y, w - 4, h, R[1]!);
  cv.rect(x, y + 2, w, h - 4, R[1]!);
  cv.rect(x + 1, y + 1, w - 2, h - 2, R[1]!);
  cv.rect(x + 2, y, w - 4, 1, R[0]!);
  cv.rect(x + 2, y + h - 1, w - 4, 1, R[3]!);
  // The lugs along the top and bottom runs, moving one way on top and the other below.
  for (let i = 0; i < 20; i++) {
    const tx = x + 3 + ((i * 4 + tread) % (w - 6));
    cv.set(tx, y, R[0]!);
    cv.set(tx + 1, y, R[0]!);
    const bx = x + w - 4 - ((i * 4 + tread) % (w - 6));
    cv.set(bx, y + h - 1, R[2]!);
  }
  // The wheels inside: the two big ones at the ends and three small rollers between.
  const wheel = (cx: number, cy: number, r: number): void => {
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r) cv.set(cx + xx, cy + yy, STEEL[3]!);
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= (r - 1) * (r - 1)) cv.set(cx + xx, cy + yy, STEEL[2]!);
    cv.set(cx - 1, cy - 1, STEEL[1]!);
    cv.set(cx, cy, STEEL[4]!);
    // A bolt that goes round with the wheel.
    const a = (tread / 4) * Math.PI * 2;
    cv.set(cx + Math.round(Math.cos(a) * (r - 2)), cy + Math.round(Math.sin(a) * (r - 2)), STEEL[0]!);
  };
  wheel(x + 6, y + 6, 4);
  wheel(x + w - 7, y + 6, 4);
  for (const cx of [x + 22, x + 37, x + 52]) wheel(cx, y + 7, 3);
}

/** Yellow and black hazard stripes, leaning right, in a w × h band. */
function hazard(cv: Canvas, x: number, y: number, w: number, h: number): void {
  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const band = Math.floor((xx + yy) / 4) % 2;
      cv.set(x + xx, y + yy, band ? K : YEL[1]!);
    }
  }
  cv.rect(x, y, w, 1, YEL[0]!);
}

/**
 * The hopper on top, seen from above at three quarters: a galvanised funnel, wider at the top,
 * its throat dark with the two rollers of blades (they turn with `tread`), and the slice of burnt
 * toast with its lever still caught in them.
 */
function hopper(cv: Canvas, dy: number, tread: number): void {
  const top = 4 + dy;
  const bottom = 27 + dy;
  // The funnel walls: from 70 wide at the top to 52 where it meets the cabinet.
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const x0 = Math.round(16 + t * 10);
    const x1 = Math.round(86 - t * 8);
    cv.rect(x0, y, x1 - x0, 1, HOPPER[1]!);
    cv.set(x0, y, HOPPER[2]!);
    cv.set(x0 + 1, y, HOPPER[2]!);
    cv.set(x1 - 1, y, HOPPER[2]!);
  }
  // The rim, rolled and lit, and the front lip a band of light.
  cv.rect(17, top, 68, 2, HOPPER[0]!);
  cv.rect(16, top + 2, 70, 1, HOPPER[2]!);
  // The throat (the mouth, open), a dark slab inside the rim.
  const ty = top + 3;
  for (let y = ty; y < ty + 9; y++) {
    const inset = Math.round((y - ty) * 0.9);
    cv.rect(21 + inset, y, 60 - inset * 2, 1, y < ty + 2 ? THROAT[1]! : y < ty + 6 ? THROAT[2]! : THROAT[3]!);
  }
  // The two rollers of blades, across the bottom of the throat: teeth that turn.
  for (const [ry, off] of [[ty + 5, 0], [ty + 7, 2]] as const) {
    for (let x = 27; x < 76; x++) {
      const k = (x + off + tread) % 4;
      if (k === 0) {
        cv.set(x, ry, STEEL[0]!);
        cv.set(x, ry - 1, STEEL[1]!);
      } else if (k === 1) cv.set(x, ry, STEEL[2]!);
    }
  }
  // The last customer: a slice of toast, burnt at the edge, sticking out of the blades at an
  // angle, and the lever of a toaster next to it.
  // An upright slice: crust all round, the rounded top of a loaf, a burnt corner, half in the blades.
  const sx = 58;
  const sy = ty - 6;
  const rows = ['.cccc.', 'cttttc', 'cttttc', 'ctTttc', 'cttttc', 'cttbbc', 'cttbbc'];
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      const c = ch === 'c' ? BURNT[1] : ch === 't' ? TOASTC[1] : ch === 'T' ? TOASTC[0] : ch === 'b' ? BURNT[2] : undefined;
      // Leaning a little to the right as it goes in.
      if (c) cv.set(sx + i + (j < 3 ? 1 : 0), sy + j, c);
    });
  });
  // The lever: a little black knob on a steel stalk.
  cv.rect(42, ty - 2, 1, 5, STEEL[2]!);
  cv.rect(40, ty - 4, 4, 2, K);
  cv.set(40, ty - 4, STEEL[3]!);
  // Its sides go down to the cabinet: the welded seam where they meet.
  cv.rect(26, bottom, 52, 1, HOPPER[3]!);
}

/** A lamp: a round 7x7 glass in a steel ring, the shine at its top left. */
function lamp(cv: Canvas, cx: number, cy: number, L: Ramp, dim = false): void {
  for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 17) cv.set(cx + x, cy + y, STEEL[3]!);
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) cv.set(cx + x, cy + y, dim ? L[3]! : L[2]!);
  if (!dim) {
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) if (x * x + y * y <= 4) cv.set(cx + x, cy + y, L[1]!);
    cv.set(cx - 1, cy - 1, L[0]!);
    cv.set(cx - 2, cy - 1, L[0]!);
    cv.set(cx - 1, cy - 2, WHITE);
  }
}

/**
 * The cabinet: a machine-green box in three quarters on its tracks, the hopper on top; on the
 * front the «En servicio» plate, the lamps under a steel visor that gives it its look (bored,
 * and sure of itself), the output slot grinning with teeth and paper strips hanging out of it,
 * the hazard band on the plinth. On the side, the round «APTO» inspection sticker.
 */
function cabinet(cv: Canvas, look: TrituradoraLook): void {
  const dy = look.dip ?? 0;
  const x = 10;
  const y = 26 + dy;
  const w = 74;
  const h = 47;
  const sw = 13;
  const th = 6;
  cube(cv, x, y, w, h, sw, th, MACHINE, MACHINE_SIDE, MACHINE_TOP);
  const fx = x + sw;
  const fw = w - sw;
  // Rivets down the front corners and along the side.
  for (let ry = y + th + 3; ry < y + h - 4; ry += 6) {
    cv.set(fx + 2, ry, MACHINE[0]!);
    cv.set(x + w - 3, ry, MACHINE[3]!);
    cv.set(x + 3, ry, MACHINE_SIDE[0]!);
  }
  // The plate: «EN SERVICIO» in green on black, screwed on (the game draws it again over the
  // body, unflipped, so it reads when she faces left: EnemyAnim.badge, PLATE).
  plate(cv, PLATE.x, PLATE.y + dy);
  // The visor: a steel brow across both lamps, lower over the inner corners (that is the look).
  const ey = y + th + 18;
  const lamps: Array<[number, number]> = [[fx + 17, ey], [fx + 41, ey]];
  const L = look.lamps === 'scan' ? LAMP_AMBER : look.lamps === 'red' ? LAMP_RED : look.lamps === 'qc' ? LAMP_QC : LAMP_GREEN;
  lamps.forEach(([cx, cy], i) => lamp(cv, cx, cy, L, look.lamps === 'blink' && i === 1));
  for (const [cx, cy] of lamps) {
    for (let xx = -6; xx <= 6; xx++) {
      // Lower towards the middle of the face: a frown, the corners raised a little.
      const inner = cx < fx + fw / 2 ? xx : -xx;
      // The lid comes down over the top of the glass, lower on the inner side: half-shut, unimpressed.
      const drop = 1 + Math.round(((inner + 6) / 12) * 3);
      cv.rect(cx + xx, cy - 5, 1, 2 + drop, MACHINE[1]!);
      cv.set(cx + xx, cy - 5, MACHINE[0]!);
      cv.set(cx + xx, cy - 4 + drop, MACHINE[3]!);
    }
  }
  // Scanning: a thin cross-hair of amber over each glass.
  if (look.lamps === 'scan') {
    for (const [cx, cy] of lamps) {
      cv.set(cx + 3, cy, WHITE);
      cv.set(cx - 3, cy, LAMP_AMBER[3]!);
    }
  }
  // Quality control: a white tick in each glass (everything passes).
  if (look.lamps === 'qc') {
    for (const [cx, cy] of lamps) for (const [tx, ty] of [[-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0]] as Pt[]) cv.set(cx + tx, cy + ty - 1, WHITE);
  }
  // The output slot: a wide dark grin with steel teeth top and bottom, and strips of shredded
  // paper (and one of toast) hanging out of it.
  const my = ey + 9;
  const mx0 = fx + 9;
  const mw = 42;
  cv.rect(mx0, my, mw, 7, THROAT[3]!);
  cv.rect(mx0, my - 1, mw, 1, MACHINE[3]!);
  cv.rect(mx0 - 1, my, 1, 7, MACHINE[3]!);
  cv.rect(mx0, my + 7, mw, 1, MACHINE[0]!);
  for (let tx = mx0 + 1; tx < mx0 + mw - 1; tx += 3) {
    cv.rect(tx, my, 2, 2, STEEL[1]!);
    cv.set(tx, my, STEEL[0]!);
    cv.rect(tx + 1, my + 5, 2, 2, STEEL[2]!);
  }
  const strips: Array<[number, number, RGBA]> = [[mx0 + 6, 6, WHITE], [mx0 + 10, 4, STEEL[0]!], [mx0 + 23, 7, WHITE], [mx0 + 31, 5, TOASTC[1]!], [mx0 + 35, 3, WHITE]];
  for (const [sx, len, c] of strips) {
    cv.rect(sx, my + 5, 1, len, c);
    cv.set(sx + 1, my + 5 + len - 1, c);
  }
  // Taking apart: the slot is full of what is about to come out (a red screw head, a white key, a coil of spring).
  if (look.lamps === 'red') {
    cv.rect(mx0 + 4, my + 2, 3, 3, RED[1]!);
    cv.set(mx0 + 5, my + 3, WHITE);
    cv.rect(mx0 + 14, my + 2, 4, 3, WHITE);
    cv.set(mx0 + 15, my + 3, RED[1]!);
    for (let k = 0; k < 4; k++) cv.set(mx0 + 25 + k * 2, my + 2 + (k % 2), RED[0]!);
    for (let k = 0; k < 4; k++) cv.set(mx0 + 26 + k * 2, my + 3 - (k % 2), RED[2]!);
    cv.rect(mx0 + 36, my + 3, 3, 2, STEEL[0]!);
  }
  // The hazard band on the plinth, under the front.
  hazard(cv, fx, y + h - 6, fw - 1, 4);
  // The inspection sticker on the side: a round green «APTO» seal, a little crooked.
  const scx = x + 6;
  const scy = y + th + 22;
  for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) if (xx * xx + yy * yy <= 18) cv.set(scx + xx, scy + yy, LAMP_GREEN[3]!);
  for (let yy = -3; yy <= 3; yy++) for (let xx = -3; xx <= 3; xx++) if (xx * xx + yy * yy <= 9) cv.set(scx + xx, scy + yy, LAMP_GREEN[2]!);
  // A tick on it.
  for (const [tx, ty] of [[-2, 0], [-1, 1], [0, 2], [1, 1], [2, 0], [3, -1]] as Pt[]) cv.set(scx + tx, scy + ty, WHITE);
  // A vent of louvres lower down the side.
  for (let vy = y + th + 30; vy < y + h - 6; vy += 2) cv.rect(x + 3, vy, sw - 6, 1, MACHINE_SIDE[3]!);
}

/** Where its hands go, by pose: [back hand, front hand], top left of each glove. */
function handSpots(look: TrituradoraLook): [Pt, Pt] {
  const dy = look.dip ?? 0;
  switch (look.hands) {
    case 'swing0':
      return [[2, 50 + dy], [86, 54 + dy]];
    case 'swing1':
      return [[2, 54 + dy], [86, 50 + dy]];
    case 'scan':
      return [[2, 54 + dy], [80, 38 + dy]];
    case 'label':
      return [[2, 52 + dy], [76, 46 + dy]];
    default:
      return [[2, 52 + dy], [86, 52 + dy]];
  }
}

export function makeTrituradora(look: TrituradoraLook = {}): Canvas {
  const W = TRITURADORA_W;
  const H = TRITURADORA_H;
  const [back, front] = handSpots(look);
  const backLayer = new Canvas(W, H);
  glove(backLayer, back[0], back[1]);
  const base = new Canvas(W, H);
  tracks(base, look.tread ?? 0);
  const body = new Canvas(W, H);
  cabinet(body, look);
  const top = new Canvas(W, H);
  hopper(top, look.dip ?? 0, look.tread ?? 0);
  const frontLayer = new Canvas(W, H);
  if (look.hands === 'scan') {
    scanner(frontLayer, front[0] + 3, front[1] - 3);
    glove(frontLayer, front[0], front[1] + 1, true);
  } else if (look.hands === 'label') {
    labelGun(frontLayer, front[0] + 1, front[1] - 3);
    glove(frontLayer, front[0], front[1] + 2, true);
  } else glove(frontLayer, front[0], front[1]);
  const all = new Canvas(W, H);
  all.blit(outline(backLayer), 0, 0);
  all.blit(outline(base), 0, 0);
  all.blit(outline(body), 0, 0);
  all.blit(outline(top), 0, 0);
  all.blit(outline(frontLayer), 0, 0);
  // A wisp of toast smoke out of the hopper (it is still warm).
  if (look.lamps !== 'scan' && look.lamps !== 'red' && look.lamps !== 'qc') {
    const sx = 63 + (look.tread ?? 0) % 2;
    all.set(sx, 1, [150, 150, 165, 170]);
    all.set(sx + 1, 0, [120, 120, 138, 140]);
    all.set(sx - 1, 2 + (look.dip ?? 0), [150, 150, 165, 120]);
  }
  // Scanning: the scanner's window throws a short red glow ahead (the beam itself is drawn by the game).
  if (look.hands === 'scan') {
    const gx = front[0] + 14;
    const gy = front[1] - 1;
    all.set(gx, gy, [255, 90, 70, 200]);
    all.set(gx + 1, gy, [255, 90, 70, 120]);
    all.set(gx, gy - 1, [255, 90, 70, 90]);
    all.set(gx, gy + 1, [255, 90, 70, 90]);
  }
  return all;
}

/**
 * The frames of its sheet, by name: at rest (breathing, a lamp blinking, the blades turning),
 * rolling on its tracks (four, the hands swinging), and diagnosing (the scanner raised, lamps
 * amber), and taking apart (M12 (4b): the lamps red and the slot full of parts about to fly).
 * And quality control (M12 (4c)): the label gun up, the lamps bright green with a tick in each.
 */
export const TRITURADORA_FRAMES = ['reposo0', 'reposo1', 'avanza0', 'avanza1', 'avanza2', 'avanza3', 'diagnostico', 'despiece', 'calidad'] as const;

const LOOKS: Record<(typeof TRITURADORA_FRAMES)[number], TrituradoraLook> = {
  reposo0: {},
  reposo1: { dip: 1, lamps: 'blink', tread: 1 },
  avanza0: { tread: 0, hands: 'swing0' },
  avanza1: { tread: 1, dip: 1, hands: 'swing0' },
  avanza2: { tread: 2, hands: 'swing1' },
  avanza3: { tread: 3, dip: 1, hands: 'swing1' },
  diagnostico: { lamps: 'scan', hands: 'scan', tread: 2 },
  despiece: { lamps: 'red', hands: 'swing1', tread: 1, dip: 1 },
  calidad: { lamps: 'qc', hands: 'label', tread: 3 },
};

export function trituradoraLook(name: (typeof TRITURADORA_FRAMES)[number]): TrituradoraLook {
  return LOOKS[name];
}

export function makeTrituradoraFrames(): Canvas[] {
  return TRITURADORA_FRAMES.map((n) => makeTrituradora(LOOKS[n]));
}

/** Where the scanner's window is in the «diagnostico» frame (px from the left and from the top): the beam starts there. */
export const SCANNER_TIP = { x: 94, y: 37 } as const;

/** Enemy-bullet grids: `r` red, `R` dark red, `l` light red, `w` white, `s`/`S`/`d` steel light, base, dark. */
const PART_COLS: Record<string, RGBA> = { r: RED[1]!, R: RED[2]!, l: RED[0]!, w: WHITE, s: STEEL[0]!, S: STEEL[1]!, d: STEEL[2]! };

function partFrames(frames: ReadonlyArray<readonly string[]>, size: number): Canvas {
  const sheet = new Canvas(size * frames.length, size);
  frames.forEach((rows, f) => {
    const cv = new Canvas(size, size);
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = PART_COLS[ch];
      if (c) cv.set(i + 1, j + 1, c);
    }));
    sheet.blit(outline(cv), f * size, 0);
  });
  return sheet;
}

/**
 * «Despiece» (M12 (4b)): a screw it has taken out, flying. 10x10, 2 frames a quarter-turn apart
 * (it spins): the round red head with its white slot (the saturated rim and white core of every
 * enemy bullet) and the steel shank with its thread.
 */
export function makeScrewBullet(): Canvas {
  return partFrames(
    [
      ['.lll....', 'lrwrr...', 'lwwwr...', 'rrwRR...', '.rRRsd..', '....Sd..', '.....sd.', '......S.'],
      ['....lll.', '...rrwrl', '...rwwwl', '...RRwrr', '..dsRRr.', '..dS....', '.ds.....', '.S......'],
    ],
    10,
  );
}

/**
 * A spring out of something (M12 (4b)): a red coil with white glints, squashed and stretched by
 * turns as it boings along. 10x10, 2 frames.
 */
export function makeSpringBullet(): Canvas {
  return partFrames(
    [
      ['........', 'lwwwwwl.', '..RRrr..', '.lrrrrrl', '..rRRR..', 'lrrrrrl.', '..RRrr..', '.lrwwrrl'],
      ['lwwwwwl.', '...RRr..', '.lrrrrrl', '...rRR..', 'lrrrrrl.', '...RRr..', '.lrrrrrl', '...rR...'],
    ],
    10,
  );
}

/**
 * A key off an old keyboard (M12 (4b)): white keycap with a red rim and a red letter on it, tumbling
 * (face on, then tipped over showing its stem). 10x10, 2 frames. The letter is an A: the first of
 * «Avería», and of «Anulada».
 */
export function makeKeyBullet(): Canvas {
  return partFrames(
    [
      ['rrrrrrr.', 'rwwwwwRr', 'rwwrwwRr', 'rwrwrwRr', 'rwrrrwRr', 'rwrwrwRr', 'rRRRRRRr', '.rrrrrr.'],
      ['........', '.rrrrrr.', 'rwwwwwwr', 'rwwrrwwr', 'rRRRRRRr', '..rssr..', '...SS...', '........'],
    ],
    10,
  );
}

/**
 * The conveyor belt of «Despiece» (M12 (4b)): a 48x24 tile of a belt running right (the game
 * flips it to run left and scrolls it). Black rubber slats with the joint between them, worn grey
 * where the parts rub, and a faded yellow chevron every two tiles pointing the way it goes: dark, so
 * the bullets over it still read.
 */
export function makeBeltTile(): Canvas {
  const cv = new Canvas(BELT_TILE_W, 24);
  const B = RUBBER;
  cv.rect(0, 0, BELT_TILE_W, 24, B[2]!);
  // Slats 6 px wide: a lit edge on the left, the joint (deep shadow) on the right.
  for (let x = 0; x < BELT_TILE_W; x += 6) {
    cv.rect(x, 0, 1, 24, B[1]!);
    cv.rect(x + 5, 0, 1, 24, B[3]!);
  }
  // Worn patches along the slats.
  for (const [x, y, h] of [[2, 3, 3], [8, 15, 4], [15, 7, 2], [20, 18, 3], [33, 5, 3], [40, 14, 2], [44, 20, 3]] as const) cv.rect(x, y, 2, h, B[1]!);
  // One chevron every two tiles, faded yellow, pointing right.
  const C: RGBA = [112, 100, 58, 255];
  for (let k = 0; k < 5; k++) {
    cv.rect(9 + k, 7 + k, 2, 1, C);
    cv.rect(9 + k, 16 - k, 2, 1, C);
  }
  return cv;
}

/** Width of the belt's tile: two tiles of the room, one chevron. */
export const BELT_TILE_W = 48;

/**
 * The intake rollers at the end of the belt (M12 (4b)): a 16x24 tile of a vertical column of
 * toothed steel rollers going into the dark, with a hazard stripe along the outer edge. Two frames:
 * the teeth half a step round (the game swaps them as the belt runs).
 */
export function makeIntakeTiles(): Canvas {
  const sheet = new Canvas(32, 24);
  for (const f of [0, 1]) {
    const cv = new Canvas(16, 24);
    cv.rect(0, 0, 16, 24, THROAT[3]!);
    for (let y = 0; y < 24; y += 8) {
      // A roller: steel, lit on top, its teeth sticking out on the belt side.
      cv.rect(3, y + 1, 10, 6, STEEL[2]!);
      cv.rect(3, y + 1, 10, 2, STEEL[1]!);
      cv.rect(3, y + 1, 10, 1, STEEL[0]!);
      cv.rect(3, y + 6, 10, 1, STEEL[3]!);
      for (let k = 0; k < 3; k++) {
        const ty = y + 1 + ((k * 2 + f) % 6);
        cv.set(1, ty, STEEL[1]!);
        cv.set(2, ty, STEEL[0]!);
      }
    }
    // The hazard stripe along the far edge: yellow and black, diagonal.
    for (let y = 0; y < 24; y++) cv.rect(14, y, 2, 1, ((y + f * 2) >> 2) % 2 === 0 ? YEL[1]! : K);
    sheet.blit(cv, f * 16, 0);
  }
  return sheet;
}

/**
 * «Control de calidad» (M12 (4c)): the «APTO» label it sticks on the floor (it slows you down like
 * frost). 36x18, flat on the floor: a white label with rounded corners, curling up at one corner,
 * a green band with «APTO» in white stencil and a row of small print under it that nobody reads.
 */
export function makeAptoLabel(): Canvas {
  const cv = new Canvas(36, 18);
  const W0 = WHITE;
  const W1 = CREAM[0]!;
  const W2 = CREAM[2]!;
  // The label: white, the corners cut round, a shade darker along the bottom (it is thick paper).
  cv.rect(2, 1, 32, 15, W0);
  cv.rect(1, 2, 34, 13, W0);
  cv.rect(2, 15, 32, 1, W2);
  cv.rect(1, 14, 1, 1, W2);
  cv.rect(34, 14, 1, 1, W2);
  // The green band with «APTO».
  cv.rect(3, 3, 30, 8, LAMP_GREEN[2]!);
  cv.rect(3, 3, 30, 1, LAMP_GREEN[1]!);
  cv.rect(3, 10, 30, 1, LAMP_GREEN[3]!);
  const tw = stencilWidth('APTO');
  stencil(cv, 3 + Math.floor((30 - tw) / 2), 5, 'APTO', W0);
  // The small print: dashes of grey.
  for (let x = 4; x < 30; x += 3) cv.rect(x, 12, 2, 1, W2);
  // The top right corner curling up (where it will come unstuck, eventually).
  cv.rect(31, 1, 3, 2, W1);
  cv.set(33, 2, W2);
  cv.set(34, 3, W2);
  return outline(cv);
}

/**
 * «Control de calidad» (M12 (4c)): a stack of crates that came down from above (prop
 * `pila-cajas`, a whole tile). 26x46: three grey crates of reconditioned parts, each a little off
 * the one below, the tape across their lids, the green «APTO» label on the middle one and a white
 * plastic strap round the lot. A column of them makes a wall.
 */
export function makeCrateStack(): Canvas {
  const cv = new Canvas(26, 46);
  const C = ramp('#b4baae', '#868c80', '#62665c', '#40433b');
  const TOP = ramp('#d4d8cc', '#b8bcae', '#9a9e90', '#7a7e72');
  const crate = (x: number, y: number, w: number, h: number): void => {
    // The front, the lid seen from above (3 px) and the brown tape across it.
    cv.rect(x, y + 3, w, h - 3, C[1]!);
    cv.rect(x, y + 3, w, 1, C[0]!);
    cv.rect(x, y + h - 1, w, 1, C[3]!);
    cv.rect(x + w - 1, y + 3, 1, h - 3, C[2]!);
    cv.rect(x, y, w, 3, TOP[1]!);
    cv.rect(x, y, w, 1, TOP[0]!);
    cv.rect(x + Math.floor(w / 2) - 1, y, 3, 3, hexTape);
    cv.rect(x + Math.floor(w / 2) - 1, y + 3, 3, 2, hexTape);
    // Ribs down the front and the hand hole.
    for (let rx = x + 3; rx < x + w - 2; rx += 5) cv.rect(rx, y + 6, 1, h - 8, C[2]!);
    cv.rect(x + 2, y + 5, 5, 2, C[3]!);
  };
  crate(1, 33, 24, 12);
  crate(2, 20, 23, 13);
  crate(0, 8, 23, 13);
  // The label on the middle crate: green, «APTO» too small to read, a white tick.
  cv.rect(13, 25, 9, 5, LAMP_GREEN[2]!);
  cv.rect(13, 25, 9, 1, LAMP_GREEN[1]!);
  for (const [tx, ty] of [[15, 27], [16, 28], [17, 27], [18, 26]] as Pt[]) cv.set(tx, ty, WHITE);
  // The strap round the lot, white plastic.
  for (let y = 8; y < 45; y++) cv.set(20 + (y < 20 ? -1 : y < 33 ? 0 : 1), y, y % 6 === 0 ? CREAM[2]! : WHITE);
  // The top crate's lid: something left in it (a bent fork of a toaster, a coil of cable).
  cv.rect(4, 6, 6, 2, STEEL[1]!);
  cv.set(4, 6, STEEL[0]!);
  for (const [x, y] of [[13, 6], [14, 5], [15, 5], [16, 6]] as Pt[]) cv.set(x, y, RED[1]!);
  return outline(cv);
}

/**
 * The «APTO» label in flight (M12 (4c)): 14x9, curled as it comes off the gun, two frames (it
 * flutters: face up, then edge on).
 */
export function makeAptoLabelFlying(): Canvas {
  const sheet = new Canvas(28, 9);
  const a = new Canvas(14, 9);
  a.rect(1, 1, 12, 7, WHITE);
  a.rect(2, 2, 10, 3, LAMP_GREEN[2]!);
  a.rect(2, 2, 10, 1, LAMP_GREEN[1]!);
  a.set(5, 3, WHITE);
  a.set(6, 4, WHITE);
  a.set(7, 3, WHITE);
  a.set(8, 2, WHITE);
  a.rect(2, 6, 9, 1, CREAM[2]!);
  a.rect(11, 1, 2, 2, CREAM[0]!);
  const b = new Canvas(14, 9);
  b.rect(1, 3, 12, 3, WHITE);
  b.rect(2, 3, 10, 1, LAMP_GREEN[2]!);
  b.rect(1, 5, 12, 1, CREAM[2]!);
  sheet.blit(outline(a), 0, 0);
  sheet.blit(outline(b), 14, 0);
  return sheet;
}
