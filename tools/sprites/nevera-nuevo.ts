// M14c (a7a): La Nevera Suprema, the first boss redrawn in the new style (docs/ESTILO_ARTE.md,
// «M14c · El estilo nuevo») with the painting tools of src/art/pintor.ts. The approved old sprite
// stays in characters.ts (makeNevera) as the reference art/referencia/nevera-suprema.png checks.
//
// The bosses' size, decided here for all of (a7): the frame grows about a sixth (the Nevera,
// 72 × 76 → 84 × 88), the body stays about as big as its hurt box (which does not change, it is
// the simulation's), and what grows is everything that sticks out: crown, gloves, the open door.
// More frames: an attack pose per attack (BossPatternAttack.pose) and a frame for the phase change
// (EnemyAnim.clap). And its own debris when it comes apart (`despiece-<sprite>`, see makeNeveraBits).
//
// Two-door fridge in three quarters, the face on the freezer door (red pilot-light eyes under brows
// of frost), the ice dispenser of the fridge door for a mouth full of icicle teeth, the gold crown
// it bought itself, the A+++ label and the «Empleada del mes» rosette it pinned on itself. Twenty
// years without defrosting: icicles everywhere. In its second phase the fridge door swings open
// and the lit inside, full of expired food, is the mouth.

import type { Canvas } from '../../src/art/canvas.ts';
import { SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { box34 } from './planta3-nuevo.ts';
import type { Pose } from './pose.ts';

export const NEVERA_W = 84;
export const NEVERA_H = 88;
/** Where its shoes touch the floor (EnemyDef.anchor): the outline row under the soles. */
export const NEVERA_FEET = { x: 38, y: 86 } as const;
/** Its rest pose: the left edge of each shoe. */
export const NEVERA_LEGS2 = [26, 42] as const;
/** The ice dispenser's middle (the mouth), px from the feet: BossBrain.muzzle (x to the right). */
export const NEVERA_MOUTH = { x: 5, y: 34 } as const;

/** Frame layout (EnemyAnim of src/data/enemies.ts). */
export const NEVERA_FRAMES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  /** Phase 1 poses: the dispenser shooting cubes, and lobbing frost. */
  cubes: 6,
  frost: 7,
  /** The phase change: the door bursting open (EnemyAnim.clap). */
  burst: 8,
  /** Phase 2 is the same layout from here (EnemyAnim.phaseShift). */
  phaseShift: 9,
  /** Phase 2 poses: the fan of loyalty cards, and the expired food thrown out. */
  cards: 15,
  spit: 16,
  count: 17,
} as const;

type Look = 'calm' | 'cubes' | 'frost' | 'burst' | 'cards' | 'spit';

const REST: Pose = { xb: NEVERA_LEGS2[0], xf: NEVERA_LEGS2[1], bob: 0 };

/** The heavy walk (as the old one): one shoe at a time 2 px off the floor while the body rises. */
export const NEVERA_POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

// Body box: the front face (the doors) and how far the top and the left side recede.
const X0 = 11;
const Y0 = 18;
const FW = 42;
const FH = 60;
const DEPTH = 7;
const FX = X0 + DEPTH;
/** Rows of the seam between the freezer door (above) and the fridge door. */
const SEAM = 38;

/** Short thick legs and work boots, the soles on the floor whatever the bob. */
function legs(p: Paint, pose: Pose, top: number): void {
  const floor = NEVERA_FEET.y - 1;
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 3, top, 4, L, 'goma', back ? 4 : 2);
    p.rect(x + 3, top, 1, L, 'goma', back ? 3 : 1);
    p.rect(x + 3, top, 4, 1, 'goma', 5);
    const sw = back ? 10 : 11;
    p.rect(x, yb, sw, 3, 'goma', back ? 3 : 2);
    p.rect(x + 1, yb, sw - 3, 1, 'goma', back ? 2 : 1);
    p.px(x + sw - 3, yb, 'goma', back ? 1 : 0);
    p.rect(x, yb + 3, sw, 1, 'esmalte', back ? 4 : 3);
    // The steel toe cap.
    p.rect(x + sw - 3, yb + 1, 2, 2, 'acero', back ? 3 : 2);
  }
}

/** A pink rubber washing-up glove: the hand, the thumb sticking up, the rolled cuff. */
function mitt(p: Paint, x: number, y: number, thumbLeft = false): void {
  p.ellipsoid(x + 4, y + 4, 4.2, 3.8, 'rosa', { dither: 0 });
  p.ellipsoid(thumbLeft ? x + 0.5 : x + 7.5, y + 2, 1.6, 2.2, 'rosa', { dither: 0, bias: 0.1 });
  p.rect(x + 1, y + 8, 7, 3, 'rosa', 3);
  p.rect(x + 1, y + 8, 7, 1, 'rosa', 1);
  p.rect(x + 1, y + 10, 7, 1, 'rosa', 4);
}

/** The gold crown it bought itself, its base on row `by`, a little crooked. */
function crown(p: Paint, cx: number, by: number, iced: boolean): void {
  // The band: three rows, lit on top, with a red stone in the middle and two cyan ones.
  p.rect(cx - 10, by - 3, 21, 3, 'laton', 2);
  p.rect(cx - 10, by - 3, 21, 1, 'laton', 1);
  p.rect(cx - 10, by - 1, 21, 1, 'laton', 3);
  p.rect(cx - 10, by - 3, 1, 3, 'laton', 1);
  p.ellipsoid(cx + 0.5, by - 1.5, 1.6, 1.5, 'rojo', { dither: 0, bias: 0.2 });
  for (const gx of [cx - 6, cx + 6]) {
    p.px(gx, by - 2, 'cian', 1);
    p.px(gx + 1, by - 2, 'cian', 3);
  }
  // Five points with a ball on each, the middle one tallest; it sits tilted (the right side higher).
  const pts = [[-9, 4], [-5, 5], [0, 7], [5, 6], [9, 5]] as const;
  for (const [dx, hgt] of pts) {
    const x = cx + dx;
    // A triangle: 5 px wide at the band, 1 at the tip.
    for (let j = 0; j < hgt; j++) {
      const w = j < hgt / 3 ? 5 : j < (2 * hgt) / 3 ? 3 : 1;
      p.rect(x - (w >> 1), by - 4 - j, w, 1, 'laton', 2);
      p.px(x - (w >> 1), by - 4 - j, 'laton', 1);
      if (w > 1) p.px(x + (w >> 1), by - 4 - j, 'laton', 3);
    }
    p.ellipsoid(x + 0.5, by - 4 - hgt - 0.5, 1.4, 1.4, 'laton', { dither: 0, bias: 0.15 });
    // Frosted over (its frost attack): a cap of rime on each ball.
    if (iced) p.px(x, by - 5 - hgt, 'vidrio', 0);
  }
}

/** Icicles hanging from row `y`: [x, length]. */
function icicles(p: Paint, y: number, list: ReadonlyArray<readonly [number, number]>): void {
  for (const [x, len] of list) {
    for (let j = 0; j < len; j++) p.px(x, y + j, 'vidrio', j === 0 ? 1 : j === len - 1 ? 3 : 2);
    if (len > 2) p.px(x + 1, y, 'vidrio', 2);
  }
}

/**
 * The face on the freezer door. `look` changes the eyes and brows: calm-angry (the default), wide
 * and white-hot (the burst), squinting through the cold (frost), smug, one brow up (the offers).
 */
function face(p: Paint, look: Look, open: boolean): void {
  const ey = 27;
  for (const [ex, side] of [[30, -1], [48, 1]] as const) {
    // The socket: a dark recess in the enamel with a lit lower rim.
    p.ellipsoid(ex + 0.5, ey + 0.5, 4.4, 3.6, 'pantalla', { dither: 0, bias: -0.4 });
    p.rect(ex - 2, ey + 4, 6, 1, 'esmalte', 1);
    if (look === 'burst') {
      // Wide open: the whole socket white-hot with a pinprick pupil.
      p.ellipsoid(ex + 0.5, ey + 0.5, 3.4, 2.8, 'acero', { dither: 0, bias: 0.4 });
      p.rect(ex, ey, 2, 2, 'rojo', 3);
      p.raw(ex, ey, SHINE);
      continue;
    }
    // The pilot light: red, glowing, with a white-hot pip.
    p.ellipsoid(ex + 0.5, ey + 1, 2.4, 2.2, look === 'frost' ? 'cian' : 'rojo', { dither: 0, bias: 0.35 });
    p.raw(ex - 1, ey, SHINE);
    // Lids: heavy, flat, enamel-coloured; lower when it squints through the cold or sells you something.
    const lid = look === 'frost' ? 3 : look === 'cards' && side < 0 ? 3 : 2;
    p.rect(ex - 4, ey - 4, 9, lid + 1, 'esmalte', 3);
    p.rect(ex - 4, ey - 4 + lid, 9, 1, 'esmalte', 5);
  }
  // The brows: thick bars of frost, down to the middle (angry). Selling, the right one goes up.
  for (let i = 0; i < 11; i++) {
    const dy = Math.min(4, i >> 1);
    const lx = 24 + i;
    const rx = 56 - i;
    p.px(lx, 20 + dy, 'esmalte', 6);
    p.px(lx, 21 + dy, 'esmalte', 5);
    p.px(lx, 19 + dy, 'vidrio', 1);
    const up = look === 'cards' || look === 'spit' ? (open ? 2 : 0) : 0;
    const rdy = up ? Math.max(0, 3 - (i >> 2)) - up : dy;
    p.px(rx, 20 + rdy, 'esmalte', 6);
    p.px(rx, 21 + rdy, 'esmalte', 5);
    p.px(rx, 19 + rdy, 'vidrio', 1);
  }
}

/** The ice dispenser of the fridge door, its mouth: icicle teeth above, ice cubes below. */
function dispenser(p: Paint, lit: boolean): void {
  const cx = NEVERA_FEET.x + NEVERA_MOUTH.x;
  const cy = NEVERA_FEET.y - NEVERA_MOUTH.y;
  const x0 = cx - 11;
  const y0 = cy - 7;
  const w = 23;
  const h = 15;
  // The recess: a rounded dark well with a lit bottom lip.
  for (let y = 0; y < h; y++) {
    const inset = y === 0 || y === h - 1 ? 2 : y === 1 || y === h - 2 ? 1 : 0;
    p.rect(x0 + inset, y0 + y, w - 2 * inset, 1, lit ? 'cian' : 'pantalla', lit ? (y < 4 ? 4 : y < 9 ? 3 : 2) : y < 3 ? 5 : 4);
  }
  p.rect(x0 + 2, y0 + h, w - 4, 1, 'esmalte', 1);
  p.rect(x0 + 2, y0 - 1, w - 4, 1, 'esmalte', 5);
  // The paddle, hanging in the middle like a uvula (pushed in while it shoots).
  p.rect(cx - 1, y0 + 1, 3, lit ? 4 : 6, 'acero', 3);
  p.rect(cx - 1, y0 + 1, 1, lit ? 4 : 6, 'acero', 1);
  // Icicle teeth from the top lip, ice-cube teeth from the bottom.
  for (const tx of [x0 + 3, x0 + 7, x0 + 15, x0 + 19]) {
    p.rect(tx, y0 + 1, 3, 1, 'vidrio', 1);
    p.px(tx + 1, y0 + 2, 'vidrio', 2);
    p.px(tx + 1, y0 + 3, 'vidrio', 3);
    p.px(tx, y0 + 1, 'vidrio', 0);
  }
  for (const tx of [x0 + 3, x0 + 8, x0 + 13, x0 + 18]) {
    p.rect(tx, y0 + h - 4, 3, 3, 'vidrio', 2);
    p.rect(tx, y0 + h - 4, 3, 1, 'vidrio', lit ? 0 : 1);
    p.px(tx + 2, y0 + h - 3, 'vidrio', 4);
  }
  // A cube on its way out while it shoots.
  if (lit) {
    p.rect(cx + 3, cy - 1, 3, 3, 'vidrio', 1);
    p.raw(cx + 3, cy - 1, SHINE);
  }
  // The little temperature display above it: «-18», three cyan blobs.
  p.rect(cx - 6, y0 - 5, 12, 3, 'pantalla', 5);
  for (const [dx, wd] of [[-5, 2], [-2, 1], [0, 3]] as const) p.rect(cx + dx, y0 - 4, wd, 1, 'cian', lit ? 1 : 2);
}

/** The A+++ energy label it never earned: a white card with the rainbow of bars. */
function energyLabel(p: Paint, x: number, y: number): void {
  p.rect(x, y, 8, 11, 'acero', 1);
  p.rect(x, y, 8, 1, 'acero', 0);
  p.rect(x + 7, y + 1, 1, 10, 'acero', 3);
  const bars: ReadonlyArray<readonly [Material, number, number]> = [['verde', 2, 3], ['verde', 1, 4], ['amarillo', 1, 5], ['amarillo', 3, 5], ['rojo', 2, 6]];
  bars.forEach(([m, t, w], i) => p.rect(x + 1, y + 1 + i * 2, w, 1, m, t));
  // The black arrow on the best class, pointing at it.
  p.rect(x + 5, y + 1, 2, 1, 'goma', 5);
}

/** The «Empleada del mes» rosette it pinned on itself: gold medal, red ribbon tails. */
function rosette(p: Paint, cx: number, cy: number): void {
  p.rect(cx - 3, cy + 2, 2, 4, 'rojo', 3);
  p.px(cx - 3, cy + 6, 'rojo', 4);
  p.rect(cx + 2, cy + 2, 2, 4, 'rojo', 2);
  p.px(cx + 3, cy + 6, 'rojo', 3);
  p.ellipsoid(cx + 0.5, cy + 0.5, 3.4, 3.4, 'laton', { dither: 0 });
  p.px(cx, cy, 'amarillo', 0);
  p.px(cx - 1, cy, 'amarillo', 1);
  p.px(cx + 1, cy, 'amarillo', 1);
  p.px(cx, cy - 1, 'amarillo', 1);
  p.px(cx, cy + 1, 'amarillo', 2);
}

/** A chrome handle on the left of a door, rows y0..y1. */
function handle(p: Paint, y0: number, y1: number): void {
  p.rect(FX + 3, y0, 2, y1 - y0 + 1, 'acero', 2);
  p.rect(FX + 3, y0, 1, y1 - y0 + 1, 'acero', 1);
  p.rect(FX + 5, y0 + 1, 1, y1 - y0, 'esmalte', 4);
  p.px(FX + 3, y0, 'acero', 4);
  p.px(FX + 4, y1, 'acero', 5);
  p.raw(FX + 3, y0 + 2, SHINE);
}

/**
 * Its inside, door open (second phase): a lit cave in cream plastic, the bulb at the top, icicle
 * teeth along the top of the opening, two wire shelves of food long expired and the crisper drawer.
 * `flare`: the light up and the food going (it throws it at you).
 */
function inside(p: Paint, flare: boolean): void {
  const x0 = FX + 1;
  const x1 = FX + FW - 2;
  const y0 = SEAM + 2;
  const y1 = Y0 + FH - 5;
  // The opening: the dark frame of the gasket, then the inside, lighter near the bulb.
  p.rect(x0 - 1, y0 - 1, x1 - x0 + 3, y1 - y0 + 3, 'goma', 4);
  for (let y = y0; y <= y1; y++) {
    const k = (y - y0) / (y1 - y0);
    p.rect(x0, y, x1 - x0 + 1, 1, 'crema', flare ? (k < 0.3 ? 0 : k < 0.6 ? 1 : 2) : k < 0.25 ? 1 : k < 0.55 ? 2 : k < 0.8 ? 3 : 4);
  }
  // The inner walls in perspective: the left one in shade, the ceiling.
  for (let y = y0; y <= y1; y++) p.rect(x0, y, 3, 1, 'crema', 4);
  p.rect(x0, y0, x1 - x0 + 1, 2, 'crema', 3);
  // The bulb.
  const bx = NEVERA_FEET.x;
  p.rect(bx - 2, y0, 5, 2, 'amarillo', flare ? 0 : 1);
  p.raw(bx, y0, SHINE);
  // Two wire shelves.
  for (const y of [y0 + 11, y0 + 22]) {
    p.rect(x0, y, x1 - x0 + 1, 1, 'acero', 1);
    p.rect(x0, y + 1, x1 - x0 + 1, 1, 'acero', 4);
  }
  const s1 = y0 + 11;
  const s2 = y0 + 22;
  // Top shelf: a swollen yogurt with a hat of mould, a milk carton (gable top), a can, a green lump.
  p.rect(x0 + 4, s1 - 5, 5, 5, 'crema', 0);
  p.rect(x0 + 4, s1 - 3, 5, 1, 'rojo', 2);
  p.ellipsoid(x0 + 6.5, s1 - 6, 3.4, 1.8, 'verde', { dither: 0, bias: -0.1 });
  p.rect(x0 + 11, s1 - 8, 6, 8, 'acero', 1);
  p.rect(x0 + 12, s1 - 10, 4, 2, 'acero', 2);
  p.rect(x0 + 11, s1 - 5, 6, 2, 'azul', 3);
  p.px(x0 + 15, s1 - 2, 'verde', 3);
  p.rect(x0 + 26, s1 - 6, 4, 6, 'rojo', 2);
  p.rect(x0 + 26, s1 - 6, 4, 1, 'acero', 2);
  p.px(x0 + 27, s1 - 4, 'acero', 0);
  p.ellipsoid(x0 + 34, s1 - 2.5, 3.6, 2.6, 'menta', { dither: 0, bias: -0.25 });
  // Bottom shelf: a tin of fish, a jar of pickles, a cake with one sad candle.
  p.rect(x0 + 4, s2 - 4, 8, 4, 'hojalata', 2);
  p.rect(x0 + 4, s2 - 4, 8, 1, 'hojalata', 1);
  p.rect(x0 + 5, s2 - 2, 5, 1, 'azul', 3);
  p.rect(x0 + 15, s2 - 8, 6, 8, 'vidrio', 3);
  p.rect(x0 + 15, s2 - 9, 6, 2, 'rojo', 3);
  p.rect(x0 + 16, s2 - 6, 4, 5, 'verde', 3);
  p.px(x0 + 16, s2 - 6, 'vidrio', 0);
  p.rect(x0 + 25, s2 - 4, 9, 4, 'rosa', 2);
  p.rect(x0 + 25, s2 - 4, 9, 1, 'rosa', 0);
  p.rect(x0 + 29, s2 - 7, 1, 3, 'azul', 2);
  p.px(x0 + 31, s2 - 3, 'verde', 2);
  p.px(x0 + 27, s2 - 2, 'verde', 3);
  // The crisper drawer: misted plastic with a wilted lettuce.
  p.rect(x0 + 3, s2 + 3, x1 - x0 - 4, y1 - s2 - 3, 'vidrio', 4);
  p.rect(x0 + 3, s2 + 3, x1 - x0 - 4, 1, 'vidrio', 2);
  p.ellipsoid(x0 + 12, y1 - 3, 5, 3, 'verde', { dither: 0, bias: -0.35 });
  p.px(x0 + 9, y1 - 5, 'oxido', 1);
  // Icicle teeth along the top of the opening (it is still its mouth).
  icicles(p, y0, [[x0 + 5, 3], [x0 + 10, 4], [x0 + 22, 4], [x0 + 28, 3], [x0 + 34, 2]]);
}

/**
 * The door swung out on its hinge (right), seen from the inside: the gasket, the liner and the door
 * bins with a ketchup bottle, a mustard and a half-empty bottle of cava from some Christmas. `ajar`:
 * half open (the burst), so less of it shows.
 */
function door(p: Paint, ajar: boolean): void {
  const x = FX + FW - 1;
  const w = ajar ? 6 : 11;
  const y0 = SEAM + 1;
  const y1 = Y0 + FH - 1;
  for (let i = 0; i < w; i++) {
    // The far edge drops a little (it comes towards you).
    const drop = Math.round((i / w) * 3);
    p.rect(x + i, y0 + drop, 1, y1 - y0 + 1, 'esmalte', i === 0 ? 5 : i === w - 1 ? 3 : 1);
  }
  p.rect(x + 1, y0 + 1, 1, y1 - y0 - 1, 'goma', 3);
  if (ajar) return;
  for (const [by, m, t] of [[y0 + 12, 'rojo', 2], [y0 + 24, 'amarillo', 2], [y0 + 36, 'verde', 4]] as const) {
    p.rect(x + 3, by - 6, 3, 6, m, t);
    p.px(x + 3, by - 6, m, t - 1);
    p.rect(x + 4, by - 8, 1, 2, m, t + 1);
    p.rect(x + 2, by, 9, 2, 'vidrio', 2);
    p.rect(x + 2, by, 9, 1, 'vidrio', 1);
  }
  p.rect(x + 7, y0 + 30, 2, 6, 'vidrio', 3);
  p.px(x + 7, y0 + 29, 'laton', 1);
}

/**
 * La Nevera Suprema in a pose. `open`: its second phase (the fridge door open). `look`: which
 * frame of the fight (the attack poses and the burst).
 */
export function makeNeveraNueva(pose: Pose = REST, open = false, look: Look = 'calm'): Canvas {
  const p = new Paint(NEVERA_W, NEVERA_H);
  const d = pose.bob;
  legs(p, pose, Y0 + FH - 1 + d);
  const b = new Paint(NEVERA_W, NEVERA_H);
  // The cabinet: the top face (lit), the left side in shade, the doors facing you.
  box34(b, X0, Y0, FW, FH, DEPTH, 'esmalte', { top: [0, 0], side: [4, 3], front: [0, 1, 2] });
  // The rounded right edge, and the bottom of the doors a shade darker (further from the light).
  b.rect(FX + FW - 1, Y0 + 1, 1, FH - 2, 'esmalte', 3);
  b.rect(FX + 1, Y0 + FH - 14, FW - 2, 10, 'esmalte', 2);
  // The seam between the doors, and the dark kick plate with its grille.
  b.rect(FX, SEAM, FW, 1, 'esmalte', 5);
  b.rect(FX, SEAM + 1, FW, 1, 'esmalte', 0);
  b.rect(FX, Y0 + FH - 4, FW, 4, 'goma', 4);
  b.rect(FX, Y0 + FH - 4, FW, 1, 'goma', 2);
  for (let x = FX + 3; x < FX + FW - 3; x += 3) b.rect(x, Y0 + FH - 3, 2, 2, 'goma', 5);
  // Along the side: the dark coil of the back showing at the edge, and old rust at its feet.
  for (let y = Y0 + 4; y < Y0 + FH - 6; y += 4) b.px(X0 + 1, y, 'esmalte', 5);
  for (const [x, y, t] of [[X0 + 2, Y0 + FH - 6, 1], [X0 + 3, Y0 + FH - 5, 2], [FX + FW - 3, Y0 + FH - 6, 1], [FX + FW - 4, Y0 + FH - 5, 2], [FX + 9, SEAM - 2, 1]] as const) b.px(x, y, 'oxido', t);
  // Twenty years without defrosting: a crust of rime along the top edge, icicles under the seam.
  for (let x = X0 + 1; x < FX + FW - 1; x += 1) if ((x * 7) % 5 < 2) b.px(x, Y0 - DEPTH + Math.max(0, x - X0 - FW + 1), 'vidrio', 1);
  for (const [x, y] of [[FX + 1, Y0 + 1], [FX + 2, Y0 + 1], [FX + 1, Y0 + 2], [FX + FW - 3, Y0 + 2], [FX + FW - 4, Y0 + 1]] as const) b.px(x, y, 'vidrio', 1);
  icicles(b, SEAM + 2, open ? [[FX + 41, 0]] : [[FX + 6, 3], [FX + 12, 4], [FX + 30, 2], [FX + 35, 4]]);
  // The freezer door: the handle and the face.
  handle(b, Y0 + 4, SEAM - 4);
  face(b, look, open);
  if (look === 'burst') {
    // The door bursting: it swings, half open, the light pouring out.
    inside(b, true);
    b.rect(FX + 22, SEAM + 1, FW - 22, FH - SEAM + Y0 - 1, 'esmalte', 2);
    b.rect(FX + 22, SEAM + 1, 1, FH - SEAM + Y0 - 1, 'esmalte', 0);
    b.rect(FX + 23, SEAM + 1, 1, FH - SEAM + Y0 - 1, 'goma', 3);
    rosette(b, FX + 34, SEAM + 29);
    door(b, true);
  } else if (open) {
    inside(b, look === 'spit');
    door(b, false);
  } else {
    handle(b, SEAM + 4, SEAM + 24);
    dispenser(b, look === 'cubes');
    energyLabel(b, FX + 3, SEAM + 25);
    rosette(b, FX + 34, SEAM + 29);
  }
  crown(b, NEVERA_FEET.x + 1, Y0 - DEPTH + 2, look === 'frost');
  // The gloves: down by its sides, up when it attacks (overhead to lob the frost).
  const up = look === 'frost' ? -34 : look === 'cubes' || look === 'spit' ? -8 : look === 'burst' ? -14 : 0;
  mitt(b, look === 'frost' ? 6 : 3, 46 + up, true);
  if (look === 'cards') {
    // The right glove fans out three loyalty cards.
    const cx = 72;
    const cy = 30;
    for (const [dx, dy, m] of [[-5, 2, 'azul'], [0, -1, 'amarillo'], [5, 1, 'rojo']] as const) {
      b.rect(cx + dx, cy + dy - 9, 7, 10, m, 2);
      b.rect(cx + dx, cy + dy - 9, 7, 1, m, 1);
      b.rect(cx + dx, cy + dy - 9, 1, 10, m, 1);
      b.rect(cx + dx + 1, cy + dy - 5, 5, 1, 'acero', 1);
      b.rect(cx + dx + 1, cy + dy - 3, 3, 1, 'acero', 2);
    }
    mitt(b, 69, cy);
  } else {
    mitt(b, open ? 72 : look === 'frost' ? 61 : 63, 46 + up);
  }
  if (look === 'spit') {
    // Thrown out: a milk carton tumbling over the door, and a lump of something green.
    for (let j = 0; j < 7; j++) b.rect(62 + (j >> 1), 22 + j, 5, 1, 'acero', j < 2 ? 0 : 1);
    b.rect(63, 25, 5, 2, 'azul', 3);
    b.ellipsoid(72.5, 17.5, 2.6, 2, 'menta', { dither: 0, bias: -0.2 });
    b.ellipsoid(10.5, 33.5, 2.4, 2.2, 'verde', { dither: 0, bias: -0.2 });
  }
  p.stamp(b, 0, d);
  const out = p.outline();
  // Cold breath around it (see-through, outside the outline): more while it lobs frost.
  const puffs: ReadonlyArray<readonly [number, number, number]> = look === 'frost'
    ? [[8, 14, 150], [6, 10, 110], [10, 8, 80], [66, 14, 150], [69, 10, 110], [64, 7, 80], [30, 2, 90], [50, 1, 90]]
    : [[7, 16, 110], [8, 13, 70], [66, 18, 100]];
  for (const [x, y, a] of puffs) if (out.get(x, y + d)[3] === 0) out.set(x, y + d, [225, 240, 250, a]);
  // The stink of the inside, open (a green haze over the opening's top), worse while it throws.
  if (open && look !== 'burst') {
    const haze = look === 'spit' ? [[30, 37], [34, 35], [44, 36], [49, 34], [40, 33], [26, 34]] : [[33, 37], [46, 36]];
    for (const [x, y] of haze) if (out.get(x!, y! + d)[3] === 0) out.set(x!, y! + d, [166, 224, 112, 120]);
  }
  // Light spilling out of the burst door onto the floor.
  if (look === 'burst') for (const [x, y] of [[60, 80], [63, 82], [66, 84], [58, 84], [62, 86]] as const) if (out.get(x, y)[3] === 0) out.set(x, y, [255, 246, 194, 140]);
  return out;
}

/** Its sheet, in the order of NEVERA_FRAMES. */
export function makeNeveraNuevaFrames(): Canvas[] {
  const shut = NEVERA_POSES.map((pose) => makeNeveraNueva(pose, false));
  const open = NEVERA_POSES.map((pose) => makeNeveraNueva(pose, true));
  return [
    ...shut,
    makeNeveraNueva(REST, false, 'cubes'),
    makeNeveraNueva(REST, false, 'frost'),
    makeNeveraNueva(REST, false, 'burst'),
    ...open,
    makeNeveraNueva(REST, true, 'cards'),
    makeNeveraNueva(REST, true, 'spit'),
  ];
}

/** Size of each piece of its debris. */
export const NEVERA_BIT = 12;

/**
 * What flies off it as it comes apart (GameScene's dying boss, `despiece-nevera-suprema`): the crown,
 * a chrome handle, an ice cube, the mouldy yogurt, the A+++ label and the ketchup from the door.
 */
export function makeNeveraBits(): Canvas[] {
  const S = NEVERA_BIT;
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      p.rect(1, 7, 10, 3, 'laton', 2);
      p.rect(1, 7, 10, 1, 'laton', 1);
      for (const x of [1, 5, 9]) {
        p.rect(x, 4, 2, 3, 'laton', 1);
        p.px(x, 3, 'laton', 0);
      }
      p.px(5, 8, 'rojo', 1);
    },
    (p) => {
      p.rect(5, 1, 2, 10, 'acero', 2);
      p.rect(5, 1, 1, 10, 'acero', 1);
      p.raw(5, 3, SHINE);
      p.px(6, 10, 'acero', 4);
    },
    (p) => {
      p.rect(3, 3, 6, 6, 'vidrio', 2);
      p.rect(3, 3, 6, 1, 'vidrio', 0);
      p.rect(3, 3, 1, 6, 'vidrio', 1);
      p.rect(8, 4, 1, 5, 'vidrio', 4);
      p.raw(4, 4, SHINE);
    },
    (p) => {
      p.rect(3, 4, 6, 6, 'crema', 0);
      p.rect(3, 6, 6, 2, 'rojo', 2);
      p.ellipsoid(6, 3.5, 3.6, 2, 'verde', { dither: 0, bias: -0.1 });
    },
    (p) => energyLabel(p, 2, 0),
    (p) => {
      p.rect(4, 3, 4, 8, 'rojo', 2);
      p.rect(4, 3, 1, 8, 'rojo', 1);
      p.rect(5, 1, 2, 2, 'acero', 2);
      p.rect(5, 6, 2, 2, 'acero', 1);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(S, S);
    draw(p);
    return p.outline();
  });
}
