// M14c (a7g): El Director de Recursos Inhumanos and his executive chair, in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo», and the bosses' size rule decided with the Nevera
// in (a7a)). The old approved sprites stay in director.ts, which still draws his bullets, the
// partitions and the long table of the Sala de Juntas (those are (a9) and (a10)).
//
// The only human boss: a man with a November tan (material `bronceado`) in a corporate suit one
// size too big (`traje`, «gris marengo»), sitting in an oxblood executive chair (`polipiel`) that is
// how he gets about. You never see his eyes: his glasses reflect a spreadsheet (green cells, one
// total in red), or flash white when he decides, or show the slide he is presenting. The smile of
// his profile picture, one brow up, the company tie with its gold clip, the visitor's lanyard he
// never took off, cufflinks, the signet ring and a Bluetooth earpiece blinking blue: he is always
// on a call. Standing (phase 3), the smile goes, the brows come down and a vein beats on his temple;
// from behind, the shop's tag still hangs from his collar (the suit goes back on Monday).

import { Canvas } from '../../src/art/canvas.ts';
import { SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import type { Pose } from './pose.ts';

export const DIRECTOR_W = 84;
export const DIRECTOR_H = 88;
/** Where the chair's wheels (and, standing, his shoes) touch the floor (EnemyDef.anchor): the outline row under them. */
export const DIRECTOR_FEET = { x: 40, y: 86 } as const;
/** The last row with paint (wheels, soles). */
const FLOOR = DIRECTOR_FEET.y - 1;

/** Frame layout (EnemyAnim of src/data/enemies.ts). Seated 0-11; on his feet (phase 3) the same layout from 12. */
export const DIRECTOR_FRAMES = {
  idle: [0, 1],
  /** Pushing off with his feet: feet out, the shove, rolling with the feet up (the wheels turn). */
  walk: [2, 3, 4, 5],
  /** Leaning in, fingers steepled, the glasses flashing: «le voy a ser sincero» (EnemyAnim.warn). */
  warn: 6,
  /** The clap of the «Reestructuración» (EnemyAnim.clap). */
  clap: 7,
  /** Seated: his own stamp up, a fan of business cards, a dismissal letter, the remote of the projector. */
  stamp: 8,
  cards: 9,
  letter: 10,
  slides: 11,
  /** On his feet (phase 3, BossPhase.frameShift). */
  standing: 12,
  /** Standing: the fan of cards; spinning the line of cuts from behind, from the front with the hands out, side on; straightening his tie before he spins. */
  cards3: 19,
  spinBack: 20,
  spinFront: 21,
  spinSide: 22,
  windup: 23,
  count: 24,
} as const;

type SeatLook = 'rest' | 'warn' | 'clap' | 'stamp' | 'cards' | 'letter' | 'slides';
type StandLook = 'rest' | 'warn' | 'cards' | 'back' | 'front' | 'side' | 'windup';
type Feet = 'rest' | 'reach' | 'push' | 'glide';

const REST: Pose = { xb: 29, xf: 45, bob: 0 };

/** His walk on his feet (as the other bosses'): one shoe at a time 2 px off the floor. */
export const DIRECTOR_POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

/** A rounded block shaded as a pillow (his head, the chair's padding). */
function pillow(p: Paint, x0: number, y0: number, w: number, h: number, r: number, m: Material, bias = 0, spec = false): void {
  p.heightShade(x0, y0, w, h, (x, y) => {
    const dx = Math.min(x - x0, x0 + w - 1 - x);
    const dy = Math.min(y - y0, y0 + h - 1 - y);
    if (dx < 0 || dy < 0) return null;
    if (dx < 2 && dy < 2 && dx + dy < 2) return null;
    const d = Math.min(dx, dy, r);
    return Math.sqrt(Math.max(0, r * r - (r - d) * (r - d))) * 1.4;
  }, m, { dither: 0, bias, spec });
}

// ---------------------------------------------------------------------------------------------
// The chair.

/** Height of the chair, from the top of its backrest to the bottom of its wheels. */
const CHAIR_TALL = 56;

/**
 * The executive chair, facing right, (x, y) the top left of its backrest: a high padded back with
 * buttoned tufting, the seat, the chrome gas lift, the black star base and three wheels whose glint
 * goes round as it rolls (`spin`, 0-2). The seat runs from x + 5 to x + 40.
 */
function chair(p: Paint, x: number, y: number, spin = 0): void {
  // Backrest: a tall padded slab, the tufting stitched in rows with a button in each.
  pillow(p, x, y, 16, 34, 4, 'polipiel', 0.2, true);
  for (const j of [9, 18, 27]) p.rect(x + 3, y + j, 10, 1, 'polipiel', 3);
  for (const j of [4, 13, 22]) {
    p.px(x + 8, y + j, 'polipiel', 4);
    p.px(x + 7, y + j - 1, 'polipiel', 1);
  }
  // Seat.
  pillow(p, x + 5, y + 34, 36, 7, 3, 'polipiel', 0.2, true);
  p.rect(x + 7, y + 40, 32, 1, 'polipiel', 4);
  // The mechanism under the seat and the gas lift (chrome).
  p.rect(x + 17, y + 41, 12, 2, 'goma', 3);
  p.rect(x + 17, y + 41, 12, 1, 'goma', 2);
  p.rect(x + 21, y + 43, 4, 5, 'acero', 2);
  p.rect(x + 21, y + 43, 1, 5, 'acero', 1);
  p.rect(x + 24, y + 43, 1, 5, 'acero', 4);
  p.raw(x + 22, y + 44, SHINE);
  // The star base, polished chrome (it costs a salary): the hub, a leg each way, the one seen end on.
  p.rect(x + 19, y + 48, 8, 2, 'acero', 2);
  p.rect(x + 19, y + 48, 8, 1, 'acero', 1);
  p.rect(x + 6, y + 49, 13, 2, 'acero', 3);
  p.rect(x + 6, y + 49, 13, 1, 'acero', 1);
  p.rect(x + 27, y + 49, 13, 2, 'acero', 3);
  p.rect(x + 27, y + 49, 13, 1, 'acero', 2);
  p.rect(x + 21, y + 50, 4, 2, 'acero', 4);
  p.raw(x + 9, y + 49, SHINE);
  // Wheels: the glint on the hub goes round as it rolls.
  const glint = ([[-1, -1], [1, -1], [1, 1]] as const)[spin % 3]!;
  for (const wx of [x + 6, x + 22, x + 38]) {
    p.ellipsoid(wx + 0.5, y + 53.5, 2.6, 2.4, 'goma', { dither: 0, bias: 0.05 });
    p.px(wx + glint[0], y + 53 + glint[1], 'acero', 1);
  }
}

// ---------------------------------------------------------------------------------------------
// The man.

/** A big hand with its white shirt cuff and gold cufflink; the front one wears the company's signet ring. */
function hand(p: Paint, x: number, y: number, o: { ring?: boolean; cuff?: 'left' | 'right' | 'down'; finger?: boolean } = {}): void {
  const c = o.cuff ?? 'left';
  if (c === 'left') {
    p.rect(x - 2, y + 2, 2, 6, 'acero', 1);
    p.px(x - 2, y + 2, 'acero', 0);
    p.px(x - 2, y + 5, 'laton', 1);
  } else if (c === 'right') {
    p.rect(x + 9, y + 2, 2, 6, 'acero', 1);
    p.px(x + 10, y + 5, 'laton', 1);
  } else {
    p.rect(x + 2, y + 8, 6, 2, 'acero', 1);
    p.px(x + 5, y + 9, 'laton', 1);
  }
  p.ellipsoid(x + 4.5, y + 4.5, 4.8, 4.4, 'bronceado', { dither: 0, bias: 0.05 });
  p.ellipsoid(c === 'right' ? x + 0.5 : x + 8, y + 2.5, 1.7, 2.2, 'bronceado', { dither: 0, bias: 0.15 });
  // The knuckles.
  p.px(x + 3, y + 7, 'bronceado', 4);
  p.px(x + 6, y + 7, 'bronceado', 4);
  if (o.ring) {
    p.px(x + 2, y + 5, 'laton', 1);
    p.px(x + 3, y + 5, 'laton', 0);
  }
  if (o.finger) {
    // The index finger up: «una cosita».
    p.rect(x + 3, y - 5, 3, 6, 'bronceado', 1);
    p.rect(x + 5, y - 4, 1, 5, 'bronceado', 3);
    p.px(x + 3, y - 5, 'bronceado', 0);
    p.px(x + 4, y - 5, 'bronceado', 0);
  }
}

interface HeadLook {
  /** What the glasses show: the spreadsheet; a white flash (he decides); his slide; nothing (from behind). */
  lens?: 'sheet' | 'glint' | 'slide';
  angry?: boolean;
  back?: boolean;
  side?: boolean;
}

/** One lens of his glasses (9 x 7 with the frame), at its top left. */
function lens(p: Paint, x: number, y: number, show: NonNullable<HeadLook['lens']>): void {
  p.rect(x, y, 9, 7, 'goma', 5);
  const ix = x + 1;
  const iy = y + 1;
  if (show === 'glint') {
    p.rect(ix, iy, 7, 5, 'acero', 0);
    for (let i = 0; i < 4; i++) p.raw(ix + 1 + i, iy + 3 - i, SHINE);
    p.rect(ix, iy + 4, 7, 1, 'acero', 1);
  } else if (show === 'slide') {
    // His slide: a red header and a bar chart going down.
    p.rect(ix, iy, 7, 5, 'acero', 0);
    p.rect(ix, iy, 7, 1, 'rojo', 2);
    p.rect(ix + 1, iy + 2, 1, 3, 'azul', 3);
    p.rect(ix + 3, iy + 3, 1, 2, 'azul', 3);
    p.px(ix + 5, iy + 4, 'rojo', 2);
  } else {
    // The spreadsheet: header row, grid lines, one lit cell and the total in red.
    p.rect(ix, iy, 7, 5, 'verde', 1);
    p.rect(ix, iy, 7, 1, 'verde', 3);
    p.rect(ix + 3, iy + 1, 1, 4, 'verde', 2);
    p.rect(ix + 5, iy + 1, 1, 4, 'verde', 2);
    p.rect(ix, iy + 3, 7, 1, 'verde', 2);
    p.px(ix + 1, iy + 2, 'verde', 0);
    p.px(ix + 6, iy + 4, 'rojo', 2);
    p.raw(ix, iy + 1, SHINE);
  }
}

/**
 * The head, 34 x 30, (x, y) the top left of the skin: a big block of tan lit from the top left, the
 * left side in shade with the ear (and the earpiece) on it; steel-grey hair combed back in grooves
 * with the parting and a quiff held up with product; the glasses; the smile of the profile picture.
 */
function head(p: Paint, x: number, y: number, look: HeadLook = {}): void {
  const w = 34;
  const h = 30;
  pillow(p, x, y, w, h, 5, 'bronceado', 0.05);
  // Hair: a slab combed back, grooves, the lit top; grey temples down the shaded side.
  const hair = (): void => {
    p.rect(x - 1, y - 6, w + 1, 9, 'acero', 2);
    p.rect(x - 1, y - 6, w + 1, 1, 'acero', 1);
    for (const gx of [8, 14, 20, 26]) p.rect(x + gx, y - 3, 5, 1, 'acero', 3);
    for (const gx of [6, 12, 18, 24, 30]) p.px(x + gx, y - 5, 'acero', 0);
    p.rect(x - 1, y - 6, 6, 18, 'acero', 3);
    p.rect(x, y + 3, 4, 6, 'acero', 2);
    p.rect(x + 11, y - 6, 1, 4, 'acero', 4);
    // The quiff at the front, stiff with product.
    p.rect(x + w - 9, y - 8, 9, 3, 'acero', 1);
    p.rect(x + w - 8, y - 8, 7, 1, 'acero', 0);
    p.raw(x + w - 6, y - 7, SHINE);
    p.erase(x - 1, y - 6);
    p.erase(x + w - 1, y - 8);
    p.erase(x + w - 9, y - 8);
  };
  hair();
  if (look.back) {
    // From behind: hair down to the collar, combed in lines, and the back of the neck.
    p.rect(x, y + 3, w, h - 7, 'acero', 2);
    p.rect(x, y + 3, 5, h - 7, 'acero', 3);
    // Combed straight back with a lot of product: grooves running down, the crown catching the light.
    for (let gx = 7; gx < w - 3; gx += 4) p.rect(x + gx, y + 4 + (gx % 3), 1, h - 12 - (gx % 3), 'acero', 3);
    for (let gx = 8; gx < w - 3; gx += 8) p.rect(x + gx, y + 3, 2, 3, 'acero', 1);
    p.rect(x + 1, y + h - 5, w - 2, 1, 'acero', 4);
    // The ears, and the back of the neck.
    p.rect(x - 1, y + 11, 2, 6, 'bronceado', 3);
    p.rect(x + w - 1, y + 11, 2, 6, 'bronceado', 2);
    p.rect(x + 3, y + h - 4, w - 6, 4, 'bronceado', 3);
    p.rect(x + 3, y + h - 4, w - 6, 1, 'bronceado', 4);
    return;
  }
  if (look.side) {
    // Side on (spinning): the hair covers the back of the head down to the ear; one lens at the
    // front, the arm back to the ear, the nose sticking out of the profile.
    p.rect(x - 1, y + 3, 14, 16, 'acero', 2);
    p.rect(x - 1, y + 3, 4, 16, 'acero', 3);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 9; i++) p.px(x + 2 + i, y + 5 + k * 4 + (i >> 2), 'acero', 3);
    p.rect(x + 13, y + 11, 4, 7, 'bronceado', 3);
    p.rect(x + 14, y + 13, 2, 3, 'bronceado', 4);
    p.rect(x + 14, y + 12, 2, 3, 'goma', 3);
    p.px(x + 14, y + 12, 'azul', 1);
    p.rect(x + 17, y + 12, 8, 1, 'goma', 5);
    lens(p, x + 24, y + 9, look.lens ?? 'sheet');
    for (let i = 0; i < 6; i++) p.px(x + 23 + i, y + 7 + (i >> 1) - (i > 3 ? 1 : 0), 'acero', 4);
    p.rect(x + w, y + 16, 2, 4, 'bronceado', 2);
    p.px(x + w + 1, y + 16, 'bronceado', 1);
    p.px(x + w, y + 20, 'bronceado', 3);
    p.rect(x + 25, y + 24, 8, 1, 'pantalla', 4);
    p.px(x + 24, y + 25, 'pantalla', 4);
    p.rect(x + 18, y + h - 3, 14, 1, 'bronceado', 3);
    return;
  }
  // The shaded side of the face, and the ear on it with the earpiece blinking blue.
  p.rect(x, y + 3, 5, h - 6, 'bronceado', 3);
  p.rect(x + 5, y + 4, 1, h - 8, 'bronceado', 2);
  p.rect(x + 1, y + 11, 3, 7, 'bronceado', 4);
  p.px(x + 2, y + 13, 'bronceado', 5);
  p.px(x + 2, y + 14, 'bronceado', 5);
  p.rect(x + 1, y + 12, 2, 3, 'goma', 3);
  p.px(x + 1, y + 12, 'azul', 1);
  // The square jaw.
  p.rect(x + 8, y + h - 3, w - 11, 1, 'bronceado', 3);
  // Brows: one raised, the confident one; angry, both down to the middle; and the vein.
  if (look.angry) {
    for (let i = 0; i < 7; i++) {
      p.px(x + 12 + i, y + 6 + (i >> 1), 'acero', 4);
      p.px(x + 30 - i, y + 6 + (i >> 1), 'acero', 4);
    }
    for (const [dx, dy] of [[7, 2], [8, 3], [7, 4], [8, 5], [7, 6]] as const) p.px(x + dx, y + dy, 'bronceado', 5);
  } else {
    p.rect(x + 12, y + 8, 7, 1, 'acero', 4);
    p.rect(x + 23, y + 6, 7, 1, 'acero', 4);
    p.px(x + 22, y + 7, 'acero', 4);
  }
  // Glasses: two rectangular lenses, the bridge, the arm back to the ear.
  const show = look.lens ?? 'sheet';
  lens(p, x + 11, y + 9, show);
  lens(p, x + 23, y + 9, show);
  p.rect(x + 20, y + 11, 3, 1, 'goma', 5);
  p.rect(x + 4, y + 11, 7, 1, 'goma', 5);
  // Nose: a long straight one, lit on its ridge.
  p.rect(x + 21, y + 17, 1, 4, 'bronceado', 3);
  p.px(x + 20, y + 17, 'bronceado', 1);
  p.px(x + 22, y + 21, 'bronceado', 3);
  p.px(x + 21, y + 21, 'bronceado', 4);
  if (look.angry) {
    // A flat line, the corners down.
    p.rect(x + 15, y + 25, 14, 1, 'pantalla', 4);
    p.px(x + 14, y + 26, 'pantalla', 4);
    p.px(x + 29, y + 26, 'pantalla', 4);
  } else {
    // The profile-picture smile: closed teeth, too even, corners pulled up exactly the same; the
    // dimple that has been in every photo since 2009.
    p.rect(x + 14, y + 23, 16, 4, 'pantalla', 4);
    p.rect(x + 15, y + 24, 14, 1, 'acero', 0);
    p.rect(x + 15, y + 25, 14, 1, 'acero', 1);
    for (let i = 3; i < 14; i += 3) {
      p.px(x + 15 + i, y + 24, 'acero', 2);
      p.px(x + 15 + i, y + 25, 'acero', 2);
    }
    p.px(x + 13, y + 22, 'pantalla', 4);
    p.px(x + 30, y + 22, 'pantalla', 4);
    p.px(x + 31, y + 24, 'bronceado', 3);
  }
  // Clean-shaven sheen on the cheekbone.
  p.px(x + 30, y + 17, 'bronceado', 0);
  p.px(x + 31, y + 18, 'bronceado', 0);
}

interface TorsoLook {
  long?: boolean;
  back?: boolean;
  side?: boolean;
}

/**
 * Jacket, shirt and tie, (x, y) the top left of the shoulders: the jacket one size too big (the
 * shoulder pads stick out), wide lapels, the burgundy company tie with tiny logos and the gold clip,
 * the visitor's lanyard and badge, the pocket square folded to a point. 36 wide (28 side on).
 */
function torso(p: Paint, x: number, y: number, look: TorsoLook = {}): void {
  const w = look.side ? 28 : 36;
  const h = look.long ? 28 : 20;
  p.rect(x, y, w, h, 'traje', 2);
  p.rect(x, y, look.side ? 3 : 6, h, 'traje', 3);
  p.rect(x, y, w, 1, 'traje', 1);
  p.rect(x + w - 1, y + 1, 1, h - 1, 'traje', 3);
  p.rect(x, y + h - 1, w, 1, 'traje', 4);
  // The shoulder pads, too wide.
  if (!look.side) {
    p.rect(x - 3, y + 1, 4, 5, 'traje', 4);
    p.rect(x + w - 1, y + 1, 4, 5, 'traje', 2);
    p.rect(x + w + 2, y + 2, 1, 4, 'traje', 3);
    p.erase(x - 3, y + 1);
    p.erase(x + w + 2, y + 1);
  }
  if (look.back) {
    // The seam and the vent; and the shop tag hanging from the collar on its string.
    p.rect(x + 18, y + 2, 1, h - 3, 'traje', 4);
    if (look.long) p.rect(x + 18, y + h - 7, 1, 6, 'traje', 5);
    p.rect(x + 16, y - 1, 1, 3, 'acero', 1);
    p.rect(x + 13, y + 2, 7, 8, 'acero', 0);
    p.rect(x + 13, y + 9, 7, 1, 'acero', 1);
    p.rect(x + 14, y + 4, 5, 1, 'rojo', 2);
    p.rect(x + 14, y + 6, 5, 1, 'acero', 3);
    p.rect(x + 14, y + 7, 3, 1, 'acero', 3);
    return;
  }
  if (look.side) {
    // Side on: the sleeve seam, a pocket flap, the edge of the tie at the front.
    p.rect(x + 9, y + 3, 1, h - 6, 'traje', 4);
    p.rect(x + 14, y + h - 9, 8, 1, 'traje', 4);
    p.rect(x + w - 3, y + 1, 2, 14, 'granate', 2);
    p.px(x + w - 3, y + 1, 'granate', 1);
    p.rect(x + w - 4, y, 3, 2, 'acero', 1);
    return;
  }
  const mid = x + 21;
  // Shirt: a V of white between the lapels, and the collar points.
  for (let j = 0; j < 12; j++) {
    const half = Math.max(0, 5 - (j >> 1));
    p.rect(mid - half, y + j, 2 * half + 1, 1, 'acero', j === 0 ? 0 : 1);
  }
  p.px(mid - 6, y, 'acero', 0);
  p.px(mid + 6, y, 'acero', 0);
  // The lapels, lit on the left, in shade on the right.
  for (let j = 0; j < 12; j++) {
    const half = Math.max(0, 5 - (j >> 1));
    p.px(mid - half - 1, y + j, 'traje', 1);
    p.px(mid - half - 2, y + j, 'traje', 1);
    p.px(mid + half + 1, y + j, 'traje', 3);
    p.px(mid + half + 2, y + j, 'traje', 3);
  }
  // The jacket's front edge below the V, and the buttons.
  p.rect(mid + 2, y + 12, 1, h - 13, 'traje', 4);
  p.px(mid + 5, y + h - 5, 'traje', 5);
  if (look.long) p.px(mid + 5, y + h - 12, 'traje', 5);
  // The tie: knot, blade, a pattern of tiny logos and the gold clip.
  p.rect(mid - 1, y + 1, 3, 3, 'granate', 2);
  p.rect(mid - 1, y + 1, 3, 1, 'granate', 1);
  p.rect(mid - 1, y + 4, 3, h - 6, 'granate', 2);
  p.rect(mid - 1, y + 4, 1, h - 6, 'granate', 1);
  for (let j = y + 6; j < y + h - 3; j += 3) p.px(mid + 1, j, 'granate', 4);
  p.px(mid, y + h - 2, 'granate', 3);
  p.rect(mid - 2, y + 9, 5, 1, 'laton', 1);
  p.px(mid - 2, y + 9, 'laton', 0);
  // The lanyard round the neck, down to the visitor's badge he never gave back.
  for (let j = 1; j < 10; j++) p.px(x + 11 + (j >> 2), y + j, 'azul', 3);
  p.rect(x + 9, y + 10, 6, 7, 'acero', 0);
  p.rect(x + 9, y + 10, 6, 2, 'rojo', 2);
  p.rect(x + 10, y + 13, 2, 2, 'bronceado', 2);
  p.rect(x + 13, y + 13, 1, 1, 'acero', 3);
  p.rect(x + 10, y + 16, 4, 1, 'acero', 2);
  // The breast pocket and the pocket square folded to a point.
  p.rect(x + 27, y + 7, 6, 1, 'traje', 4);
  for (const [dx, dy] of [[1, 6], [2, 6], [3, 6], [2, 5], [3, 5], [3, 4]] as const) p.px(x + 27 + dx, y + dy, 'acero', 0);
  // Creases where the jacket bunches (seated), or the hem's shadow (standing).
  if (!look.long) for (const [dx, dy] of [[7, 15], [8, 15], [9, 14], [26, 16], [27, 15], [28, 15]] as const) p.px(x + dx, y + dy, 'traje', 3);
}

/** A polished black shoe, its toe to the right; (x, y) the top left. 12 x 4. */
function shoe(p: Paint, x: number, y: number, back = false): void {
  p.rect(x, y, 12, 3, 'goma', back ? 4 : 3);
  p.rect(x + 1, y, 8, 1, 'goma', back ? 3 : 2);
  p.rect(x, y + 3, 12, 1, 'goma', 5);
  p.erase(x + 11, y);
  p.erase(x, y);
  // The shine on the toe: the only thing about him that is not grey.
  if (!back) p.raw(x + 9, y + 1, SHINE);
}

/** Seated: thighs over the seat (on the body layer), and the shins and shoes, which never bob. */
function thighs(p: Paint, feet: Feet): void {
  if (feet === 'glide') {
    // Knees up: gliding, the only fun he has.
    for (let i = 0; i < 22; i++) p.rect(38 + i, 62 - (i >> 2), 1, 6, 'traje', 2);
    for (let i = 0; i < 22; i++) p.px(38 + i, 62 - (i >> 2), 'traje', 1);
    for (let i = 0; i < 22; i++) p.px(38 + i, 67 - (i >> 2), 'traje', 4);
    return;
  }
  p.rect(36, 63, 24, 6, 'traje', 2);
  p.rect(36, 63, 24, 1, 'traje', 1);
  p.rect(36, 68, 24, 1, 'traje', 4);
  p.rect(58, 64, 2, 4, 'traje', 3);
  p.erase(59, 63);
}

function shins(p: Paint, feet: Feet): void {
  if (feet === 'rest') {
    p.rect(52, 66, 7, FLOOR - 3 - 66, 'traje', 3);
    p.rect(55, 67, 1, FLOOR - 3 - 67, 'traje', 2);
    shoe(p, 51, FLOOR - 3);
  } else if (feet === 'reach') {
    // Stretched out in front, heel down, to pull himself along.
    for (let j = 0; j < FLOOR - 3 - 66; j++) p.rect(52 + (j >> 1), 66 + j, 7, 1, 'traje', 3);
    shoe(p, 60, FLOOR - 3);
  } else if (feet === 'push') {
    // Shoved back under the seat, toes on the floor: the push.
    for (let j = 0; j < FLOOR - 3 - 66; j++) p.rect(52 - (j >> 1), 66 + j, 7, 1, 'traje', 3);
    shoe(p, 42, FLOOR - 3);
  } else {
    for (let j = 0; j < 8; j++) p.rect(56 + (j >> 1), 61 + j, 6, 1, 'traje', 3);
    shoe(p, 60, 69);
  }
}

/** A fan of three business cards in his fingers: white, the cyan edge, the red logo. */
function cardFan(p: Paint, x: number, y: number): void {
  for (const [dx, dy] of [[0, 3], [4, 1], [8, 0]] as const) {
    p.rect(x + dx, y + dy, 7, 5, 'cian', 3);
    p.rect(x + dx + 1, y + dy + 1, 5, 3, 'acero', 0);
    p.px(x + dx + 1, y + dy + 1, 'rojo', 2);
    p.px(x + dx + 3, y + dy + 2, 'acero', 3);
    p.px(x + dx + 4, y + dy + 2, 'acero', 3);
  }
}

/** A dismissal letter: a white envelope with the company's red wax seal. */
function envelope(p: Paint, x: number, y: number): void {
  p.rect(x, y, 11, 8, 'acero', 0);
  p.rect(x, y + 7, 11, 1, 'acero', 2);
  for (let i = 0; i < 5; i++) {
    p.px(x + i, y + i, 'acero', 2);
    p.px(x + 10 - i, y + i, 'acero', 2);
  }
  p.rect(x + 4, y + 4, 3, 3, 'rojo', 2);
  p.px(x + 4, y + 4, 'rojo', 1);
}

/** His own DENEGADO stamp, held up: varnished beech, red rubber underneath. */
function stampTool(p: Paint, x: number, y: number): void {
  p.ellipsoid(x + 5.5, y + 2.5, 3, 2.6, 'haya', { dither: 0, spec: true });
  p.rect(x + 4, y + 5, 3, 5, 'haya', 2);
  p.rect(x + 4, y + 5, 1, 5, 'haya', 1);
  p.rect(x, y + 10, 11, 4, 'haya', 2);
  p.rect(x, y + 10, 11, 1, 'haya', 0);
  p.rect(x + 10, y + 11, 1, 3, 'haya', 4);
  p.rect(x, y + 14, 11, 2, 'rojo', 2);
  p.rect(x, y + 15, 11, 1, 'rojo', 3);
}

/** The projector's remote, pointing right. */
function remote(p: Paint, x: number, y: number): void {
  p.rect(x, y, 10, 3, 'goma', 3);
  p.rect(x, y, 10, 1, 'goma', 2);
  p.px(x + 8, y + 1, 'rojo', 2);
  p.px(x + 5, y + 1, 'goma', 1);
}

/** Three short lines out of a clap (outside the outline). */
function clapLines(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy] of [[0, -3], [0, -4], [-3, -2], [-4, -3], [3, -2], [4, -3]] as const) cv.put(x + dx, y + dy, SHINE);
}

/** The Director in his chair (phases 1-2). */
export function makeDirectorSeated(pose: Pose = REST, look: SeatLook = 'rest', feet: Feet = 'rest', spin = 0): Canvas {
  const p = new Paint(DIRECTOR_W, DIRECTOR_H);
  chair(p, 12, FLOOR + 1 - CHAIR_TALL, spin);
  shins(p, feet);
  const b = new Paint(DIRECTOR_W, DIRECTOR_H);
  // The back hand: on the chair's arm, behind him; gesturing at the slide; or in front with the other.
  const front = look === 'warn' || look === 'clap';
  const backAt = { rest: [11, 52], warn: [50, 46], clap: [54, 38], stamp: [11, 52], cards: [11, 52], letter: [11, 50], slides: [6, 38] }[look];
  if (!front) hand(b, backAt[0]!, backAt[1]!, { cuff: 'right' });
  torso(b, 23, 44);
  thighs(b, feet);
  const lensShow = look === 'slides' ? 'slide' : look === 'rest' || look === 'cards' ? 'sheet' : 'glint';
  head(b, 26, 14, { lens: lensShow });
  if (front) hand(b, backAt[0]!, backAt[1]!, { cuff: 'left' });
  // The front hand: on the knee; steepled; clapping; up with the stamp; the fan of cards; the letter flung up; the remote.
  const frontAt = { rest: [60, 52], warn: [57, 45], clap: [60, 37], stamp: [63, 23], cards: [62, 49], letter: [66, 22], slides: [62, 44] }[look];
  if (look === 'stamp') stampTool(b, frontAt[0]! - 1, frontAt[1]! - 16);
  if (look === 'letter') envelope(b, frontAt[0]! + 2, frontAt[1]! - 7);
  hand(b, frontAt[0]!, frontAt[1]!, { ring: true, cuff: 'left' });
  if (look === 'cards') cardFan(b, frontAt[0]! + 3, frontAt[1]! - 7);
  if (look === 'slides') remote(b, frontAt[0]! + 7, frontAt[1]! + 2);
  const dx = look === 'warn' ? 1 : feet === 'reach' ? 1 : feet === 'push' ? -1 : 0;
  p.stamp(b, dx, pose.bob);
  const out = p.outline();
  if (look === 'clap') clapLines(out, frontAt[0]! + 2, frontAt[1]! - 1 + pose.bob);
  if (look === 'slides') {
    // The laser pointer's dot, on the slide nobody is looking at.
    const lx = frontAt[0]! + 19;
    const ly = frontAt[1]! + 3 + pose.bob;
    out.put(lx, ly, [255, 125, 92, 255]);
    out.put(lx + 1, ly, SHINE);
  }
  return out;
}

/** Standing legs: grey trousers with a crease, polished shoes, one foot lifted at a time. */
function legs(p: Paint, pose: Pose, top: number): void {
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = FLOOR - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x, top, 7, L, 'traje', back ? 3 : 2);
    p.rect(x + 3, top, 1, L, 'traje', back ? 2 : 1);
    if (back) p.rect(x, top, 1, L, 'traje', 4);
    shoe(p, x - 2, yb, back);
  }
}

/** The Director on his feet (phase 3). */
export function makeDirectorStanding(pose: Pose = REST, look: StandLook = 'rest'): Canvas {
  const p = new Paint(DIRECTOR_W, DIRECTOR_H);
  const d = pose.bob;
  legs(p, pose, 66 + d);
  const b = new Paint(DIRECTOR_W, DIRECTOR_H);
  const side = look === 'side';
  const back = look === 'back';
  const backAt = { rest: [14, 56], warn: [14, 56], cards: [14, 56], back: [12, 54], front: [1, 44], side: [0, 0], windup: [16, 58] }[look];
  if (!side) hand(b, backAt[0]!, backAt[1]!, { cuff: look === 'front' ? 'right' : 'down' });
  torso(b, side ? 28 : 23, 39, { long: true, back, side });
  const lensShow = look === 'rest' || look === 'side' ? 'sheet' : 'glint';
  head(b, side ? 24 : 26, 9, { angry: true, back, side, lens: lensShow });
  const frontAt = { rest: [61, 56], warn: [63, 30], cards: [64, 46], back: [63, 54], front: [74, 44], side: [57, 55], windup: [43, 38] }[look];
  hand(b, frontAt[0]!, frontAt[1]!, { ring: !back, cuff: look === 'front' || look === 'cards' || look === 'warn' ? 'left' : 'down', finger: look === 'warn' });
  if (look === 'cards') cardFan(b, frontAt[0]! + 3, frontAt[1]! - 7);
  p.stamp(b, 0, d);
  return p.outline();
}

/** His sheet, in the order of DIRECTOR_FRAMES. */
export function makeDirectorNuevoFrames(): Canvas[] {
  const up = { ...REST, bob: -1 };
  return [
    makeDirectorSeated(REST),
    makeDirectorSeated({ ...REST, bob: 1 }),
    makeDirectorSeated(REST, 'rest', 'reach'),
    makeDirectorSeated(REST, 'rest', 'push'),
    makeDirectorSeated(up, 'rest', 'glide', 1),
    makeDirectorSeated(REST, 'rest', 'glide', 2),
    makeDirectorSeated(REST, 'warn'),
    makeDirectorSeated(up, 'clap'),
    makeDirectorSeated(up, 'stamp'),
    makeDirectorSeated(REST, 'cards'),
    makeDirectorSeated(up, 'letter'),
    makeDirectorSeated(REST, 'slides'),
    ...DIRECTOR_POSES.map((pose) => makeDirectorStanding(pose)),
    makeDirectorStanding(up, 'warn'),
    makeDirectorStanding(REST, 'cards'),
    makeDirectorStanding(up, 'back'),
    makeDirectorStanding(up, 'front'),
    makeDirectorStanding(up, 'side'),
    makeDirectorStanding({ ...REST, bob: 1 }, 'windup'),
  ];
}

// ---------------------------------------------------------------------------------------------
// His chair on its own (phase 3) and his debris.

export const CHAIR_W = 46;
export const CHAIR_H = 60;
/** Where its wheels touch the floor (EnemyDef.anchor of `silla-director`). */
export const CHAIR_FEET = { x: 25, y: 58 } as const;

/**
 * The empty chair (phase 3, «Despido procedente»): it rolls round the room on its own and rams
 * the toaster. 0 still, 1-2 rolling (the wheels turn), 3 about to ram (carpet dust kicked up
 * behind it), 4 still with the tag stirring (its idle), 5-6 rolling with the tag blown back. Still
 * warm: the dent he left in the seat, and his jacket's shop tag fallen on it.
 */
export function makeChairNuevoFrames(): Canvas[] {
  const looks: Array<{ spin: number; dust?: boolean; blown?: boolean; stir?: boolean }> = [
    { spin: 0 }, { spin: 1 }, { spin: 2 }, { spin: 0, dust: true },
    { spin: 0, stir: true }, { spin: 1, blown: true }, { spin: 2, blown: true },
  ];
  return looks.map((l) => {
    const p = new Paint(CHAIR_W, CHAIR_H);
    const x = 3;
    const y = CHAIR_FEET.y - CHAIR_TALL;
    chair(p, x, y, l.spin);
    // The dent in the seat.
    p.rect(x + 12, y + 35, 14, 1, 'polipiel', 3);
    // The tag: lying flat, a corner lifting, or blown back by its string.
    const ty = y + 32;
    if (l.blown) {
      p.rect(x + 22, ty + 1, 6, 3, 'acero', 0);
      p.px(x + 23, ty + 2, 'rojo', 2);
      p.px(x + 28, ty + 2, 'acero', 2);
      p.px(x + 29, ty + 2, 'acero', 2);
    } else {
      p.rect(x + 27, ty, 5, 4, 'acero', 0);
      p.rect(x + 28, ty + 2, 3, 1, 'rojo', 2);
      p.px(x + 26, ty + 3, 'acero', 2);
      if (l.stir) {
        p.px(x + 31, ty - 1, 'acero', 0);
        p.px(x + 32, ty - 1, 'acero', 1);
      }
    }
    const out = p.outline();
    if (l.dust) for (const [dx, dy] of [[0, 55], [1, 54], [0, 52], [2, 51], [1, 49], [3, 53]] as const) out.put(dx, dy, [195, 201, 214, 255]);
    return out;
  });
}

/** Size of each piece of his debris. */
export const DIRECTOR_BIT = 12;

/**
 * What flies off him as he comes apart (`despiece-director-rrhh`): his glasses with the
 * spreadsheet, a stretch of the company tie with its clip, his stamp, a business card, a wheel of
 * the chair with a bit of its leg, and the visitor's badge on its lanyard.
 */
export function makeDirectorBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      p.rect(0, 3, 12, 1, 'goma', 5);
      p.rect(0, 2, 6, 6, 'goma', 5);
      p.rect(6, 2, 6, 6, 'goma', 5);
      p.rect(1, 3, 4, 4, 'verde', 1);
      p.rect(7, 3, 4, 4, 'verde', 1);
      p.rect(1, 3, 4, 1, 'verde', 3);
      p.rect(7, 3, 4, 1, 'verde', 3);
      p.px(4, 6, 'rojo', 2);
      p.raw(1, 4, SHINE);
    },
    (p) => {
      for (let j = 0; j < 10; j++) p.rect(4 + (j >> 2), 1 + j, 3, 1, 'granate', j < 2 ? 1 : 2);
      for (const j of [4, 7]) p.px(6 + (j >> 2), 1 + j, 'granate', 4);
      p.rect(3, 4, 5, 1, 'laton', 1);
    },
    (p) => {
      p.ellipsoid(5.5, 2, 2.2, 1.8, 'haya', { dither: 0, spec: true });
      p.rect(5, 3, 2, 3, 'haya', 2);
      p.rect(1, 6, 10, 3, 'haya', 2);
      p.rect(1, 6, 10, 1, 'haya', 0);
      p.rect(1, 9, 10, 2, 'rojo', 2);
    },
    (p) => {
      p.rect(1, 3, 10, 6, 'cian', 4);
      p.rect(2, 4, 8, 4, 'acero', 0);
      p.px(3, 5, 'rojo', 2);
      p.rect(5, 5, 4, 1, 'acero', 3);
      p.rect(5, 6, 3, 1, 'acero', 3);
    },
    (p) => {
      p.rect(1, 3, 8, 2, 'goma', 3);
      p.rect(1, 3, 8, 1, 'goma', 1);
      p.ellipsoid(6.5, 8, 3, 2.8, 'goma', { dither: 0, bias: 0.05 });
      p.px(7, 7, 'acero', 1);
    },
    (p) => {
      for (let j = 0; j < 5; j++) p.px(2 + (j >> 1), j, 'azul', 3);
      p.rect(3, 4, 7, 7, 'acero', 0);
      p.rect(3, 4, 7, 2, 'rojo', 2);
      p.rect(4, 7, 2, 2, 'bronceado', 2);
      p.rect(7, 7, 2, 1, 'acero', 3);
      p.rect(4, 10, 5, 1, 'acero', 2);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(DIRECTOR_BIT, DIRECTOR_BIT);
    draw(p);
    return p.outline();
  });
}
