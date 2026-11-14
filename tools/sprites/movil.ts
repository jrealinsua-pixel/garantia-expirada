// M13 (6): el Móvil Reacondicionado, fifth playable character, with its starting weapon (the
// Notificaciones Push), its notification bubbles, the black screen it shows while switched off and
// the empty battery that blinks over it before that.
// M14c (a4d2): the phone itself redrawn in the new style (src/art/paleta.ts, src/art/pintor.ts),
// bigger, with its own frames after the eight of every character, like the other four. The weapon,
// its bullets and the low battery keep the old drawing until (a13).
//
// Its jokes: the case in «oro rosa» (it was traded in for the new model, the same one in another
// colour), the screen cracked from the bottom corner, the battery at 1 % in red, the notification
// badge it never reads, the «REACONDICIONADO» sticker on its edge, a drop of sweat on the screen
// (it is always about to die) and the charging cable it drags about, taped where it frays. Walking
// it charges (a lightning bolt by the battery); rolling, the screen shows the loading wheel; a hit
// glitches the screen; dying, the empty battery fills the screen.
//
// The legs and the cable are painted apart from the body so the body can bob over them; the two are
// stamped together and outlined once (Paint.stamp).
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { GLOW, GLOW2, RED, WHITE, YEL, box, outline, ramp } from '../../src/art/lib.ts';
import { INK, MATERIALS, SHINE } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

type Pt = readonly [number, number];

/** The old case and screen colours: the Mostrador's shop window still paints its phone with them. */
export const ROSE = ramp('#fdd9c8', '#f0a994', '#c97b70', '#8a4c52');
export const SCREEN = ramp('#3d4c7a', '#242d4e', '#171d36', '#0e0c16');

/** Frame size and where the feet are in it (CharacterLook of the Móvil in src/data/characters.ts). */
export const PHONE_W = 40;
export const PHONE_H = 48;
export const PHONE_FEET_X = 21;
export const PHONE_FEET_Y = 47;
/** Height in the frame of the middle of the slab: the roll spins round it. */
export const PHONE_SPIN_Y = 22;

export interface PhonePose {
  /** Back and front leg x (at rest 15 and 22). */
  xb: number;
  xf: number;
  /** Vertical offset of the body over the legs (breathing, the walk's bounce). */
  bob: number;
  /**
   * What the screen shows. `hurt` squeezed eyes; `broken` dead black glass, cracked all over;
   * `off` switched off («Batería al 1 %»), just the power symbol; `aim` narrowed eyes (shooting);
   * `shock` wide-open eyes with tiny pupils (knocked back); `battery` the empty battery filling the
   * screen (the first shudder of dying); `dizzy` eyes rolled up (the last shudder).
   */
  face?: 'hurt' | 'broken' | 'off' | 'aim' | 'shock' | 'battery' | 'dizzy';
  /** Animation frame (on frame 1 of the idle the back eye blinks; the sparks alternate). */
  frame: number;
  /** The body leaning over the legs, in px (negative: back, away from where it looks). */
  lean?: number;
  /** Leg length (default 4; 1 tucked up in the roll, 2 stretching out to land). */
  legLen?: number;
  /** The swinging leg's foot lifted a pixel off the floor (the six-frame walk). */
  lift?: 'back' | 'front';
  /** The back hand a pixel up or down (it swings with the steps). */
  hand?: number;
  /** Rolling: the loading wheel on the screen (0–5) and the cable whipping round. */
  spin?: number;
  /** Walking: the lightning bolt by the battery (it charges as it walks). */
  charging?: boolean;
  /** Bands of the screen shifted sideways in red and cyan (a hit). */
  glitch?: boolean;
  /** Sparks from the charging port (dying). */
  sparks?: boolean;
}

/** The eight frames of every character (CharacterLook): idle ×2, walk ×4, hurt, broken. */
export const PHONE_FRAMES: readonly PhonePose[] = [
  { xb: 15, xf: 22, bob: 0, frame: 0 },
  { xb: 15, xf: 22, bob: 1, frame: 1 },
  { xb: 14, xf: 23, bob: 0, frame: 0, hand: 1, charging: true },
  { xb: 17, xf: 20, bob: -1, frame: 1, charging: true },
  { xb: 22, xf: 15, bob: 0, frame: 0, hand: -1, charging: true },
  { xb: 20, xf: 17, bob: -1, frame: 1, charging: true },
  { xb: 16, xf: 21, bob: 1, frame: 0, face: 'hurt', glitch: true },
  { xb: 15, xf: 22, bob: 1, frame: 0, face: 'broken' },
];

/**
 * Its own frames after the eight (CharacterLook.anim): a six-step walk, charging; the roll with
 * the loading wheel turning on the screen and the cable whipping; the landing; the kick of a
 * shot; the first instant of a hit, the screen glitching; and two shudders, sparks from the port,
 * the first with the empty battery on the screen.
 */
export const PHONE_EXTRA: readonly PhonePose[] = [
  { xb: 22, xf: 15, bob: 1, frame: 0, hand: 0, charging: true },
  { xb: 20, xf: 17, bob: -1, frame: 1, lift: 'front', hand: 1, charging: true },
  { xb: 17, xf: 20, bob: -1, frame: 0, lift: 'front', hand: 1, charging: true },
  { xb: 14, xf: 23, bob: 1, frame: 1, hand: 0, charging: true },
  { xb: 17, xf: 20, bob: -1, frame: 0, lift: 'back', hand: -1, charging: true },
  { xb: 20, xf: 17, bob: -1, frame: 1, lift: 'back', hand: -1, charging: true },
  { xb: 16, xf: 21, bob: 0, frame: 0, legLen: 1, spin: 0, hand: -2 },
  { xb: 17, xf: 20, bob: 0, frame: 1, legLen: 1, spin: 1, hand: -2 },
  { xb: 16, xf: 21, bob: 0, frame: 0, legLen: 1, spin: 2, hand: -2 },
  { xb: 17, xf: 20, bob: 0, frame: 1, legLen: 1, spin: 3, hand: -2 },
  { xb: 16, xf: 21, bob: 0, frame: 0, legLen: 1, spin: 4, hand: -2 },
  { xb: 14, xf: 23, bob: 0, frame: 1, legLen: 2, spin: 5, hand: 1 },
  { xb: 15, xf: 22, bob: 0, frame: 0, face: 'aim', lean: -1 },
  { xb: 16, xf: 22, bob: 1, frame: 1, face: 'shock', lean: -2, hand: -2, glitch: true },
  { xb: 15, xf: 22, bob: 1, frame: 0, face: 'battery', sparks: true, hand: -1 },
  { xb: 16, xf: 21, bob: 2, frame: 1, face: 'dizzy', lean: 1, sparks: true, glitch: true, hand: 1 },
];

/** Where each animation is in its sheet (CharacterLook.anim). */
export const PHONE_ANIM = {
  walk: [8, 9, 10, 11, 12, 13],
  roll: [14, 15, 16, 17, 18, 19],
  shoot: 20,
  hurt: [21, 6],
  die: [22, 23],
} as const;

// The slab's geometry (frame coordinates, before the bob and the lean).
const X0 = 9; // the rounded edge (left side, in shade)
const FX = 13; // the front face, left
const X1 = 32; // right (inclusive)
const TOP = 5; // the top edge's first row
const FY = 8; // the front face's first row
const BOT = 39; // the last row of the slab (inclusive)
// The screen, inside the case: a two-pixel rim at the sides, the forehead with the speaker over it
// and the chin with the home button under it (a refurbished phone is an old model).
const SX0 = 15;
const SX1 = 30;
const SY0 = 12;
const SY1 = 33;

/** Thin legs in dark rubber and white trainers, gone grey, with a blue stripe. */
function legs(p: Paint, xb: number, xf: number, y: number, L0: number, lift?: 'back' | 'front'): void {
  for (const [x, back] of [[xb, true], [xf, false]] as const) {
    const L = L0 - (lift === (back ? 'back' : 'front') ? 1 : 0);
    p.rect(x + 1, y, 2, L, 'goma', back ? 4 : 2);
    p.px(x + 1, y, 'goma', back ? 5 : 3);
    const yb = y + L;
    const sw = back ? 5 : 6;
    p.rect(x, yb, sw, 2, 'acero', back ? 3 : 1);
    p.rect(x + 1, yb, sw - 3, 1, 'acero', back ? 2 : 0);
    p.px(x + sw - 2, yb + 1, 'azul', back ? 4 : 3); // the stripe
    p.px(x + 2, yb, 'acero', back ? 4 : 3); // the laces
    p.rect(x, yb + 2, sw, 1, 'goma', back ? 3 : 1);
  }
}

/** The charging cable: out of the port at the bottom, round behind the back leg, along the floor. */
function paintCable(p: Paint, pose: PhonePose): void {
  if (pose.face === 'broken') {
    // Unplugged at last: it lies on the floor in front, the plug and the tape.
    const pts: Pt[] = [[27, 45], [28, 45], [29, 44], [30, 44], [31, 44], [32, 45], [33, 45], [34, 45]];
    for (const [i, [x, y]] of pts.entries()) p.px(x, y, 'acero', i % 3 === 0 ? 2 : 1);
    p.rect(25, 44, 2, 2, 'acero', 3);
    p.px(25, 44, 'laton', 1);
    p.px(30, 44, 'amarillo', 1);
    p.px(31, 44, 'amarillo', 2);
    return;
  }
  if (pose.spin !== undefined) {
    // Rolling: the cable whips round from the port, swinging further each frame.
    const th = -1.1 + pose.spin * 0.32;
    let x = 13;
    let y = 39;
    for (let i = 1; i <= 12; i++) {
      const a = th + i * 0.08 * (pose.spin % 2 === 0 ? 1 : -1);
      x -= Math.cos(a);
      y -= Math.sin(a) * 0.9;
      const px = Math.round(x);
      const py = Math.min(45, Math.round(y));
      p.px(px, py, 'acero', i === 6 ? 3 : 1);
      if (i === 6) p.px(px, py, 'amarillo', 1);
    }
    return;
  }
  // At rest it trails behind on the floor, the frayed bit taped.
  const pts: Pt[] = [[13, 40], [12, 41], [11, 42], [10, 43], [9, 44], [8, 45], [7, 45], [6, 45], [5, 45], [4, 45], [3, 44], [2, 44], [1, 45]];
  for (const [i, [x, y]] of pts.entries()) p.px(x, y, 'acero', i % 4 === 3 ? 2 : 1);
  p.px(6, 45, 'amarillo', 1);
  p.px(7, 45, 'amarillo', 2);
}

/** The «oro rosa» slab: the rounded edge in shade on the left, the top edge lit, the rim round the screen. */
function paintCase(p: Paint, pose: PhonePose): void {
  // The top edge, seen from above: three rows going back to the left, brightest in the middle.
  for (let j = 0; j < 3; j++) {
    const y = TOP + j;
    for (let x = X0 + 3 - j; x <= X1 - (j === 0 ? 2 : 1); x++) p.px(x, y, 'ororosa', j === 1 ? 0 : 1);
  }
  // The rounded edge: a cylinder seen side on, the rim catching the light where it meets the front.
  const edgeTone = [5, 4, 3, 2];
  for (let y = FY - 1; y <= BOT; y++) {
    for (let i = 0; i < 4; i++) {
      if (y === FY - 1 && i < 1) continue;
      p.px(X0 + i, y, 'ororosa', edgeTone[i]! + (y >= BOT - 1 ? 1 : 0));
    }
  }
  // The volume buttons standing out of the edge.
  p.rect(X0 - 1, 13, 1, 3, 'ororosa', 4);
  p.rect(X0 - 1, 17, 1, 2, 'ororosa', 4);
  // The sticker on the edge: «REACONDICIONADO» and a barcode nobody scanned again.
  p.rect(X0 + 1, 27, 3, 6, 'crema', 1);
  for (const y of [28, 30, 31]) p.rect(X0 + 1, y, 3, 1, 'crema', 5);
  p.px(X0 + 1, 27, 'crema', 0);
  // The front, all case round the glass: lit along the top and the left, darker to the right and
  // down, a bevel of one pixel where it meets the glass.
  for (let y = FY; y <= BOT; y++) {
    for (let x = FX; x <= X1; x++) {
      let tone = 1;
      if (y === FY || x === FX) tone = 0;
      else if (x === X1 || y === BOT) tone = 3;
      else if (x >= X1 - 1 || y >= BOT - 1) tone = 2;
      p.px(x, y, 'ororosa', tone);
    }
  }
  p.rect(SX0 - 1, SY0 - 1, SX1 - SX0 + 3, SY1 - SY0 + 3, 'ororosa', 3);
  p.rect(SX0 - 1, SY1 + 1, SX1 - SX0 + 3, 1, 'ororosa', 0);
  p.rect(SX1 + 1, SY0 - 1, 1, SY1 - SY0 + 3, 'ororosa', 0);
  // The forehead: the earpiece slit and the front camera.
  p.rect(20, FY + 2, 6, 1, 'ororosa', 5);
  p.px(17, FY + 2, 'pantalla', 4);
  p.px(17, FY + 1, 'pantalla', 2);
  // The chin: the round home button, worn in the middle from so much pressing.
  for (const [x, y] of [[22, 35], [23, 35], [21, 36], [24, 36], [22, 37], [23, 37]] as const) p.px(x, y, 'ororosa', 4);
  p.px(22, 36, 'ororosa', 2);
  p.px(23, 36, 'ororosa', 1);
  // Rounded corners.
  for (const [x, y] of [[X1, TOP], [X1 - 1, TOP], [X0, BOT], [X1, BOT]] as const) p.erase(x, y);
  p.px(X1, FY, 'ororosa', 1);
  p.px(X1 - 1, BOT, 'ororosa', 4);
  // The charging port in the bottom edge.
  p.rect(20, BOT, 4, 1, 'ororosa', 5);
  if (pose.face === 'broken' || pose.face === 'off') return;
  // The notification badge it never reads, sticking out of the top corner.
  p.ellipsoid(32.5, 6, 2.6, 2.6, 'rojo', { dither: 0 });
  p.px(32, 5, 'acero', 0);
  p.px(32, 6, 'acero', 0);
  p.px(32, 7, 'acero', 0);
  p.px(31, 5, 'acero', 1);
}

/** The glass: dark, a cold reflection in the upper corner, the notch and the home bar. */
function paintGlass(p: Paint, pose: PhonePose): void {
  const dead = pose.face === 'broken' || pose.face === 'off';
  for (let y = SY0; y <= SY1; y++) {
    for (let x = SX0; x <= SX1; x++) {
      // The window's reflection: two diagonal strips in the top-left corner (none once dead).
      const d = x - SX0 + (y - SY0);
      const glint = !dead && (d === 3 || d === 4 || d === 7) && y < SY0 + 8;
      p.px(x, y, 'pantalla', glint ? 3 : dead ? 5 : 4);
    }
  }
  for (const [x, y] of [[SX0, SY0], [SX1, SY0], [SX0, SY1], [SX1, SY1]] as const) p.px(x, y, 'pantalla', 5);
  if (dead) return;
  // The status bar: the clock (always 9:41 somewhere) and the battery at 1 %.
  for (const x of [16, 18, 19]) p.px(x, SY0, 'acero', 2);
  p.rect(26, SY0, 4, 1, 'acero', 3);
  p.px(26, SY0, 'rojo', 1);
  p.px(30, SY0, 'acero', 3);
  if (pose.charging) {
    // Charging as it walks: the lightning bolt by the battery.
    p.px(24, SY0, 'amarillo', 0);
    p.px(23, SY0 + 1, 'amarillo', 1);
  }
}

/** The face drawn on the screen, lit by it: white eyes with a cyan glow under them. */
function paintFace(p: Paint, pose: PhonePose): void {
  const f = pose.face;
  if (f === 'broken' || f === 'off') return;
  if (pose.spin !== undefined) {
    // Rolling: the loading wheel, eight dots in a ring, the bright one going round.
    const cx = 22.5;
    const cy = 21;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const x = Math.round(cx + Math.cos(a) * 4);
      const y = Math.round(cy + Math.sin(a) * 4);
      const age = (k - pose.spin * 1.4 + 16) % 8;
      p.px(x, y, age < 2 ? 'acero' : 'cian', age < 1 ? 0 : age < 2 ? 1 : age < 4 ? 1 : 3);
    }
    return;
  }
  if (f === 'battery') {
    // Dying: the empty battery, big, with its red sliver.
    p.rect(17, 17, 11, 8, 'acero', 1);
    p.rect(18, 18, 9, 6, 'pantalla', 5);
    p.rect(28, 19, 1, 4, 'acero', 1);
    p.rect(18, 18, 1, 6, 'rojo', 1);
    p.rect(21, 27, 4, 1, 'rojo', 2); // «1 %»
    return;
  }
  for (const [ex, back] of [[17, true], [24, false]] as const) {
    // Brows: worried, the inner ends up (it is always about to switch off).
    const brow: Pt[] = back ? [[ex, 14], [ex + 1, 14], [ex + 2, 13], [ex + 3, 13]] : [[ex, 13], [ex + 1, 13], [ex + 2, 14], [ex + 3, 14]];
    const fierce: Pt[] = back ? [[ex, 14], [ex + 1, 14], [ex + 2, 15], [ex + 3, 15]] : [[ex, 15], [ex + 1, 15], [ex + 2, 14], [ex + 3, 14]];
    for (const [x, y] of f === 'aim' ? fierce : brow) p.px(x, y, 'acero', 1);
    if (f === 'hurt') {
      // Squeezed shut: > <
      const pts: Pt[] = back ? [[ex, 17], [ex + 1, 18], [ex + 2, 19], [ex + 1, 20], [ex, 21]] : [[ex + 3, 17], [ex + 2, 18], [ex + 1, 19], [ex + 2, 20], [ex + 3, 21]];
      for (const [x, y] of pts) p.px(x, y, 'acero', 0);
      continue;
    }
    if (f === 'aim') {
      p.rect(ex, 18, 4, 3, 'acero', 0);
      p.rect(ex, 20, 4, 1, 'cian', 2);
      p.raw(ex + 2, 18, INK);
      p.raw(ex + 3, 18, INK);
      p.raw(ex + 2, 19, INK);
      p.raw(ex + 3, 19, INK);
      continue;
    }
    // The eye: a rounded white block, the glow under it.
    p.rect(ex, 16, 4, 6, 'acero', 0);
    p.px(ex, 16, 'pantalla', 4);
    p.px(ex + 3, 16, 'pantalla', 4);
    p.rect(ex, 20, 4, 1, 'acero', 1);
    p.rect(ex + 1, 21, 2, 1, 'cian', 1);
    p.px(ex, 21, 'pantalla', 4);
    p.px(ex + 3, 21, 'pantalla', 4);
    if (f === 'shock') {
      p.raw(ex + 2, 19, INK);
    } else if (f === 'dizzy') {
      p.raw(ex + (back ? 1 : 2), 17, INK);
    } else if (back && pose.frame === 1 && pose.face === undefined && !pose.charging) {
      // The blink: the back eye shut, a line.
      p.rect(ex, 16, 4, 6, 'pantalla', 4);
      p.rect(ex, 19, 4, 1, 'acero', 1);
    } else {
      // Pupils looking ahead (right), a glint.
      p.rect(ex + 2, 18, 2, 2, 'pantalla', 5);
      p.raw(ex + 2, 18, SHINE);
    }
  }
  // The mouth: a small wavy worried line; open in a hit; flat and tight when aiming.
  if (f === 'hurt' || f === 'shock' || f === 'dizzy') {
    p.rect(21, 25, 3, 2, 'acero', 1);
    p.rect(22, 26, 1, 1, 'rojo', 2);
  } else if (f === 'aim') {
    p.rect(20, 26, 5, 1, 'acero', 1);
  } else {
    for (const [x, y] of [[19, 26], [20, 25], [21, 25], [22, 26], [23, 26], [24, 25]] as const) p.px(x, y, 'acero', 1);
  }
  // A drop of sweat on the forehead (on the glass).
  if (f !== 'aim') {
    p.px(30, 13, 'cian', 1);
    p.px(30, 14, 'cian', 0);
    p.px(29, 14, 'cian', 2);
  }
}

/** The crack, over everything: from the bottom corner, branching up across the glass. */
const CRACK: readonly Pt[] = [
  [15, 33], [16, 32], [17, 31], [18, 31], [19, 30], [20, 30], [21, 29],
  [17, 31], [17, 30], [16, 29],
  [18, 31], [19, 32], [20, 32], [21, 33],
  [21, 29], [22, 30], [23, 30],
];
/** Broken: it has run all the way across. */
const CRACK_DEAD: readonly Pt[] = [
  ...CRACK, [24, 29], [25, 29], [26, 28], [26, 27], [27, 26], [28, 25], [28, 24], [29, 23], [30, 22],
  [26, 26], [25, 25], [24, 24], [23, 23], [22, 22], [21, 21], [20, 20], [19, 19], [18, 18], [17, 17], [16, 16],
  [28, 23], [29, 24], [30, 25], [20, 20], [21, 19], [22, 18], [22, 17], [23, 16], [24, 15], [24, 14], [25, 13],
];

function paintCrack(p: Paint, pose: PhonePose): void {
  const pts = pose.face === 'broken' ? CRACK_DEAD : CRACK;
  for (const [x, y] of pts) p.px(x, y, 'vidrio', 1);
  // A dark pixel under each bend: the crack has depth.
  for (const [x, y] of [[17, 32], [20, 31], [16, 33]] as const) p.px(x, y, 'pantalla', 5);
}

/** The glitch of a hit: rows of the screen shifted sideways, one red and one cyan band. */
function glitchRows(p: Paint): void {
  const shift = (y: number, dx: number): void => {
    const row: Array<[RGBA, boolean]> = [];
    for (let x = SX0; x <= SX1; x++) row.push([p.cv.get(x, y), p.filled(x, y)]);
    for (let x = SX0; x <= SX1; x++) {
      const k = x - SX0 - dx;
      if (k >= 0 && k < row.length) p.raw(x, y, row[k]![0]);
      else p.px(x, y, 'pantalla', 5);
    }
  };
  for (const y of [17, 18]) shift(y, 2);
  shift(25, -2);
  p.rect(SX0, 23, SX1 - SX0 + 1, 1, 'rojo', 2);
  p.rect(SX0 + 3, 29, 9, 1, 'cian', 2);
}

/** Switched off: the power symbol in the middle of the black glass. */
function paintPowerLogo(p: Paint): void {
  const cx = 22;
  const cy = 22;
  const ring: Pt[] = [
    [cx - 1, cy - 2], [cx - 2, cy - 1], [cx - 2, cy], [cx - 2, cy + 1], [cx - 1, cy + 2], [cx, cy + 2],
    [cx + 1, cy + 2], [cx + 2, cy + 2], [cx + 3, cy + 1], [cx + 3, cy], [cx + 3, cy - 1], [cx + 2, cy - 2],
  ];
  for (const [x, y] of ring) p.px(x, y, 'pantalla', 1);
  p.rect(cx, cy - 3, 2, 3, 'acero', 2);
}

/** The back hand: a rose-gold silicone mitt, floating (no arms). */
function backHand(p: Paint, dy: number): void {
  p.ellipsoid(6, 27 + dy, 2.3, 2.3, 'ororosa', { dither: 0, bias: -0.15 });
}

export function makePhone(pose: PhonePose): Canvas {
  const broken = pose.face === 'broken';
  const ground = new Paint(PHONE_W, PHONE_H);
  paintCable(ground, pose);
  legs(ground, pose.xb, pose.xf, BOT + 1, pose.legLen ?? 4, pose.lift);
  const body = new Paint(PHONE_W, PHONE_H);
  if (!broken) backHand(body, pose.hand ?? 0);
  paintCase(body, pose);
  paintGlass(body, pose);
  // The face is drawn a row lower than the status bar's room (the loading wheel and the empty
  // battery are centred on the glass as they are).
  const face = new Paint(PHONE_W, PHONE_H);
  paintFace(face, pose);
  body.stamp(face, 0, pose.spin === undefined && pose.face !== 'battery' ? 1 : 0);
  if (pose.face === 'off') paintPowerLogo(body);
  paintCrack(body, pose);
  if (pose.glitch) glitchRows(body);
  const all = new Paint(PHONE_W, PHONE_H);
  const lean = pose.lean ?? 0;
  all.stamp(ground, 0, 0);
  all.stamp(body, lean, pose.bob);
  const o = all.outline();
  if (pose.sparks) {
    // Dying: sparks out of the charging port and the corner of the crack (two sets, alternating).
    const sets: Array<Pt[]> = [
      [[20, 41], [28, 42], [37, 10], [6, 9], [36, 16]],
      [[20, 42], [29, 41], [37, 13], [5, 12], [37, 3]],
    ];
    for (const [x, y] of sets[pose.frame % 2]!) {
      const px = x + lean;
      const py = y + pose.bob;
      if (px < 0 || py < 0 || px >= o.w || py >= o.h || o.get(px, py)[3] !== 0) continue;
      o.put(px, py, [255, 244, 170, 255]);
      if (px + 1 < o.w && o.get(px + 1, py)[3] === 0) o.put(px + 1, py, MATERIALS.amarillo[2]!);
    }
  }
  return o;
}

/** The eight frames of every character. */
export function makePhoneFrames(): Canvas[] {
  return PHONE_FRAMES.map((p) => makePhone(p));
}

/** The whole sheet: the eight frames of every character and then its own (M14c (a4d2)). */
export function makePhoneSheet(): Canvas[] {
  return [...PHONE_FRAMES, ...PHONE_EXTRA].map((p) => makePhone(p));
}

/** Switched off («Batería al 1 %»): standing still, the black screen and the logo. */
export function makePhoneOff(): Canvas {
  return makePhone({ xb: 15, xf: 22, bob: 1, frame: 0, face: 'off' });
}

/** Its floating front hand in the new style: the rose-gold mitt (the game draws it with the gun). */
export function makePhoneHand(): Canvas {
  const p = new Paint(7, 7);
  p.ellipsoid(3.5, 3.5, 2.4, 2.4, 'ororosa', { dither: 0, bias: -0.15 });
  return p.outline();
}

/**
 * Notificaciones Push in the hand (18 x 11, mouth to the right): a gold notification bell lying on
 * its side on a black handle, its clapper showing, and the red badge with a «1» on top.
 */
export function makeNotifier(): Canvas {
  const cv = new Canvas(18, 11);
  const BELL = ramp('#fff1a8', '#f6c431', '#d9932a', '#8f5a1c');
  // Handle.
  cv.rect(3, 7, 3, 4, SCREEN[2]!);
  cv.set(3, 7, SCREEN[0]!);
  cv.rect(1, 6, 7, 2, SCREEN[1]!);
  // The bell on its side, widening to the right.
  for (let x = 6; x <= 15; x++) {
    const r = x < 9 ? 1 : x < 13 ? 2 : 3;
    cv.rect(x, 5 - r, 1, r * 2 + 1, BELL[1]!);
    cv.set(x, 5 - r, BELL[0]!);
    cv.set(x, 5 + r, BELL[2]!);
  }
  cv.rect(16, 1, 1, 9, BELL[2]!);
  cv.set(16, 5, BELL[3]!);
  cv.set(17, 5, BELL[2]!);
  // The red badge with its «1».
  box(cv, 9, 0, 4, 4, RED);
  cv.rect(11, 1, 1, 2, WHITE);
  return outline(cv);
}

/**
 * A notification (player bullet of the Notificaciones Push, radius 3): a little orange speech
 * bubble with a white «!» and its tail, as the rules for player bullets ask (orange and yellow).
 */
export function makeNotification(): Canvas {
  const cv = new Canvas(7, 8);
  const pat = ['.3333..', '311113.', '312113.', '312114.', '311114.', '312114.', '.4444..', '.44....'];
  const cols: Record<string, RGBA> = { '1': GLOW, '2': WHITE, '3': YEL[0]!, '4': GLOW2 };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** The empty battery that blinks over the Móvil the last second before it switches off (11 x 7). */
export function makeLowBattery(): Canvas {
  const cv = new Canvas(11, 7);
  cv.rect(1, 1, 8, 5, WHITE);
  cv.rect(2, 2, 6, 3, SCREEN[3]!);
  cv.rect(2, 2, 1, 3, RED[1]!);
  cv.rect(9, 2, 1, 3, WHITE);
  return outline(cv);
}
