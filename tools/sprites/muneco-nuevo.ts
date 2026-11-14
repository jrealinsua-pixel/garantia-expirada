// M14c (a7e): El Muñeco de Moda, its sale tag and the box it leaves behind, in the new style
// (docs/ESTILO_ARTE.md, «M14c · El estilo nuevo», and the bosses' size rule decided with the Nevera
// in (a7a)). The old approved sprites stay in muneco.ts.
//
// Last year's fashion doll, still in its shop-window box, which it wears as armour: a box of hot
// pink card gone dusty in the sun (material `cartulina`), seen in three quarters, the lid on top with
// the plastic hanger tab of every toy on a hook, the left side in shade with the barcode and the
// «3+», and the front with the yellow «MODA» band and the window. Behind the plastic, the doll
// squashed against it: hair pressed flat on the top of the window, the advert grin and eyes that
// are not in on it, a turquoise blazer and the wire twist ties round its neck and waist. On the
// window, the «¡Novedad!» burst crossed out in marker and the tape with «Temporada anterior»; the
// price tag is a sheet of its own (`etiqueta-rebaja`, EnemyAnim.badge) that the game swaps as it is
// marked down. Big hands in doll vinyl outside the box; jeans and white trainers with pink soles.
// Out of the box (phase 3), the same doll, wild: hair sprung loose, the twist tie still round its
// neck with the cut end out, the tape stuck on its chest, pinprick pupils and a grin that cracked.

import { Canvas } from '../../src/art/canvas.ts';
import { MATERIALS, SHINE, mix, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { box34 } from './planta3-nuevo.ts';
import type { Pose } from './pose.ts';

export const MUNECO_W = 84;
export const MUNECO_H = 88;
/** Where its trainers touch the floor (EnemyDef.anchor): the outline row under the soles. */
export const MUNECO_FEET = { x: 42, y: 86 } as const;
/** Its rest pose: the left edge of each trainer. */
export const MUNECO_LEGS2 = [29, 44] as const;
/** The front hand, out in front of the box, px from the feet: BossBrain.muzzle (the old one, kept). */
export const MUNECO_MOUTH = { x: 22, y: 38 } as const;

/** Frame layout (EnemyAnim of src/data/enemies.ts). */
export const MUNECO_FRAMES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  /** Posing at the end of a catwalk leg, and before crossing it (EnemyAnim.warn). */
  warn: 6,
  /** In the box: throwing the accessories, presenting the sale («¡Rebajas!»). */
  accessories: 7,
  sale: 8,
  /** Marked down (the phase change, EnemyAnim.clap): horrified at its own new price. */
  clap: 9,
  /** Frames with the box (the tag is drawn on them: EnemyAnim.badge.upTo). */
  boxed: 10,
  /** Out of the box (phase 3, BossPhase.frameShift): the same layout from here. */
  loose: 10,
  /** Spinning on the spot: from behind, from the front with the hands flung out, side on. */
  spinBack: 17,
  spinFront: 18,
  spinSide: 19,
  /** Out of the box: throwing accessories, and winding up to spin. */
  accessories3: 20,
  windup: 21,
  count: 22,
} as const;

/** Where the sale tag goes on the boxed frames (its top left, before the frame's bob). */
export const TAG_ANCHOR = { x: 25, y: 61 } as const;
export const TAG_W = 22;
export const TAG_H = 12;

type BoxedLook = 'calm' | 'pose' | 'throw' | 'sale' | 'shock';
type LooseLook = 'calm' | 'pose' | 'back' | 'front' | 'side' | 'throw' | 'windup';

const REST: Pose = { xb: MUNECO_LEGS2[0], xf: MUNECO_LEGS2[1], bob: 0 };

/** The model's walk (as the other bosses'): one trainer at a time 2 px off the floor. */
export const MUNECO_POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

/** The bob of each boxed frame (the tag goes up and down with the box: EnemyAnim.badge.frameDy). */
export const BOXED_BOB: readonly number[] = [...MUNECO_POSES.map((p) => p.bob), -1, 0, -1, 0];

// The box: the left side's x, the top of the front, the front's width and height, the lid's depth.
const X0 = 16;
const Y0 = 26;
const FW = 44;
const FH = 50;
const DEPTH = 8;
/** Bottom row of the box. */
const BOTTOM = Y0 + FH - 1;
/** The window in the front (inside its frame). */
const WIN = { x: 28, y: 38, w: 36, h: 31 } as const;
/** The crossed-out «¡Novedad!» burst: on the window's bottom right, over the blazer. */
const STICKER = { x: 58, y: 58 } as const;

const tone = (m: Material, t: number): readonly [number, number, number, number] => {
  const R = MATERIALS[m];
  return R[Math.max(0, Math.min(R.length - 1, t))]!;
};

/** Jeans and white trainers with a pink sole, the soles on the floor whatever the bob. */
function legs(p: Paint, pose: Pose, top: number): void {
  const floor = MUNECO_FEET.y - 1;
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 3, top, 5, L, 'azul', back ? 5 : 3);
    p.rect(x + 3, top, 1, L, 'azul', back ? 4 : 2);
    // The turn-up of the jeans.
    p.rect(x + 2, yb - 2, 7, 2, 'azul', back ? 4 : 2);
    p.rect(x + 2, yb - 2, 7, 1, 'azul', back ? 3 : 1);
    // The trainer: white leather, the laces, the toe rounded to the front.
    const sw = back ? 10 : 11;
    p.rect(x, yb, sw, 2, 'acero', back ? 2 : 1);
    p.rect(x + 1, yb, sw - 3, 1, 'acero', back ? 1 : 0);
    p.px(x + 4, yb, 'acero', 3);
    p.px(x + 6, yb, 'acero', 3);
    // The thick pink sole.
    p.rect(x, yb + 2, sw, 1, 'rosa', back ? 3 : 2);
    p.rect(x, yb + 3, sw, 1, 'rosa', back ? 4 : 3);
  }
}

/** A boss hand in doll vinyl: a round mitten with its thumb (the doll has no fingers to speak of). */
function hand(p: Paint, x: number, y: number, thumbLeft = false): void {
  p.ellipsoid(x + 4, y + 4, 4.4, 4, 'vinilo', { dither: 0, bias: 0.05, spec: true });
  p.ellipsoid(thumbLeft ? x + 0.5 : x + 7.5, y + 2.5, 1.6, 2.2, 'vinilo', { dither: 0, bias: 0.15 });
  // The moulding line where the fingers would be.
  p.px(x + 3, y + 6, 'vinilo', 4);
  p.px(x + 5, y + 6, 'vinilo', 4);
}

/** A pink stiletto (the accessories it throws), its heel down, `x, y` its top left. */
function shoe(p: Paint, x: number, y: number): void {
  p.rect(x, y + 2, 7, 3, 'rosa', 2);
  p.rect(x, y + 2, 7, 1, 'rosa', 1);
  p.rect(x + 4, y, 3, 2, 'rosa', 2);
  p.px(x + 4, y, 'rosa', 1);
  p.rect(x + 6, y + 5, 1, 3, 'rosa', 4);
  p.raw(x + 1, y + 2, SHINE);
}

/** A little pink handbag with its strap. */
function purse(p: Paint, x: number, y: number): void {
  p.rect(x, y + 3, 7, 5, 'rosa', 2);
  p.rect(x, y + 3, 7, 1, 'rosa', 1);
  p.rect(x + 1, y + 7, 6, 1, 'rosa', 4);
  p.rect(x + 2, y, 3, 1, 'rosa', 3);
  p.px(x + 1, y + 1, 'rosa', 3);
  p.px(x + 5, y + 1, 'rosa', 3);
  p.px(x + 1, y + 2, 'rosa', 3);
  p.px(x + 5, y + 2, 'rosa', 3);
  p.px(x + 3, y + 5, 'amarillo', 1);
}

/** 4x5 blocky letters for the logo band. */
const LOGO: Record<string, readonly string[]> = {
  M: ['1001', '1111', '1111', '1001', '1001'],
  O: ['0110', '1001', '1001', '1001', '0110'],
  D: ['1110', '1001', '1001', '1001', '1110'],
  A: ['0110', '1001', '1111', '1001', '1001'],
};

function logoText(p: Paint, x: number, y: number, text: string, m: Material, t: number): void {
  for (const ch of text) {
    LOGO[ch]!.forEach((row, j) => [...row].forEach((b, i) => b === '1' && p.px(x + i, y + j, m, t)));
    x += 5;
  }
}

/**
 * The «¡Novedad!» burst, crossed out with marker corner to corner, and the strip of tape under it
 * with «Temporada anterior» scrawled on it. (x, y): the burst's centre.
 */
function oldNewSticker(p: Paint, x: number, y: number): void {
  p.rect(x - 3, y - 3, 7, 7, 'amarillo', 1);
  for (const [dx, dy] of [[0, -5], [0, -4], [0, 4], [0, 5], [-5, 0], [-4, 0], [4, 0], [5, 0], [-4, -4], [4, -4], [-4, 4], [4, 4]] as const) p.px(x + dx, y + dy, 'amarillo', dy > 0 || dx > 0 ? 2 : 1);
  p.rect(x - 3, y - 3, 4, 1, 'amarillo', 0);
  // «¡Novedad!» as two red strokes.
  p.rect(x - 2, y - 1, 5, 1, 'rojo', 2);
  p.rect(x - 1, y + 1, 3, 1, 'rojo', 2);
  for (let i = -4; i <= 4; i++) {
    p.px(x + i, y + i, 'goma', 5);
    p.px(x + i, y - i, 'goma', 5);
  }
  // The tape, a little skew, with the handwriting.
  p.rect(x - 7, y + 6, 13, 3, 'acero', 1);
  p.rect(x - 7, y + 8, 13, 1, 'acero', 2);
  p.px(x + 5, y + 6, 'acero', 2);
  for (let i = 0; i < 11; i++) if (i % 3 !== 2) p.px(x - 6 + i, y + 7 - (i % 2), 'goma', 4);
}

/** Lighten the pixels of a diagonal streak (the glare on the window's plastic), keeping their material. */
function glare(p: Paint, x: number, y: number, len: number, wide: number, k: number, clip: (x: number, y: number) => boolean): void {
  for (let i = 0; i < len; i++) {
    for (let w = 0; w < wide; w++) {
      const gx = x + i + w;
      const gy = y - i;
      if (!clip(gx, gy) || !p.filled(gx, gy)) continue;
      const c = p.cv.get(gx, gy);
      p.cv.put(gx, gy, mix(c, SHINE, k));
    }
  }
}

/** A rounded block of vinyl shaded as a pillow (the doll's head). */
function pillow(p: Paint, x0: number, y0: number, w: number, h: number, r: number, m: Material, bias = 0): void {
  p.heightShade(x0, y0, w, h, (x, y) => {
    const dx = Math.min(x - x0, x0 + w - 1 - x);
    const dy = Math.min(y - y0, y0 + h - 1 - y);
    if (dx < 0 || dy < 0) return null;
    // Rounded corners.
    if (dx < 2 && dy < 2 && dx + dy < 2) return null;
    const d = Math.min(dx, dy, r);
    return Math.sqrt(Math.max(0, r * r - (r - d) * (r - d))) * 1.4;
  }, m, { dither: 0, bias, spec: false });
}

/** A spike of frizzy hair from (x0, y0) to its tip (x1, y1), `w` px wide at the root. */
function spike(p: Paint, x0: number, y0: number, x1: number, y1: number, w: number): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = x0 + (x1 - x0) * k;
    const y = y0 + (y1 - y0) * k;
    const r = Math.max(0, (w / 2) * (1 - k));
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      if (dx * dx + dy * dy > r * r + 0.3) continue;
      // Lit on the top and left of each spike, in shade below.
      p.px(x + dx, y + dy, 'tostada', dy < 0 || dx < 0 ? 1 : 2);
    }
    p.px(x, y, 'tostada', k > 0.6 ? 0 : 1);
  }
}

/** A twist tie: a strip of steel wire across, with its twist. */
function twistTie(p: Paint, x: number, y: number, w: number): void {
  p.rect(x, y, w, 1, 'acero', 2);
  const c = x + (w >> 1);
  p.px(c, y - 1, 'acero', 1);
  p.px(c + 1, y + 1, 'acero', 3);
  p.px(c + 2, y - 1, 'acero', 1);
}

/** Its face, the advert's: painted brows, glassy eyes, rouge and the grin. (cx, ey): between the eyes. */
function dollFace(p: Paint, cx: number, ey: number, look: BoxedLook): void {
  // Brows: flat and level, painted on; up in horror when marked down.
  const by = look === 'shock' ? ey - 4 : ey - 2;
  p.rect(cx - 8, by, 5, 1, 'quemada', 1);
  p.rect(cx + 3, by, 5, 1, 'quemada', 1);
  const eye = (x: number, shut: boolean): void => {
    if (shut) {
      // A wink: a curve of lashes.
      p.rect(x, ey + 2, 4, 1, 'goma', 5);
      p.px(x - 1, ey + 1, 'goma', 5);
      p.px(x + 4, ey + 1, 'goma', 5);
      return;
    }
    p.rect(x, ey, 4, 4, 'pantalla', 4);
    if (look === 'shock') {
      // Pinprick pupils in big whites.
      p.rect(x, ey, 4, 4, 'acero', 0);
      p.px(x + 2, ey + 2, 'pantalla', 5);
    } else {
      p.rect(x, ey + 1, 3, 3, 'azul', 3);
      p.px(x + 1, ey + 2, 'azul', 5);
      p.raw(x + 2, ey + 1, SHINE);
      // The heavy painted lashes on top.
      p.rect(x - 1, ey, 5, 1, 'goma', 5);
    }
    // Bags: it has not slept since the advert ended.
    p.rect(x, ey + 4, 4, 1, 'vinilo', 3);
  };
  eye(cx - 7, false);
  eye(cx + 3, look === 'pose');
  // Rouge, painted at the factory, one dot off.
  p.px(cx - 9, ey + 5, 'rosa', 2);
  p.px(cx - 8, ey + 5, 'rosa', 2);
  p.px(cx + 8, ey + 4, 'rosa', 2);
  p.px(cx + 9, ey + 4, 'rosa', 2);
  // The nose: a pixel of shadow.
  p.px(cx, ey + 4, 'vinilo', 3);
  const my = ey + 6;
  if (look === 'shock') {
    // A wobbly «O».
    p.rect(cx - 2, my, 4, 3, 'pantalla', 4);
    p.rect(cx - 1, my + 1, 2, 1, 'rojo', 4);
    // And a drop of sweat down the plastic.
    p.px(cx + 10, ey - 1, 'cian', 1);
    p.px(cx + 10, ey, 'cian', 2);
    return;
  }
  // The advert grin: a full row of white teeth, the corners pulled up. Wider presenting the sale.
  const w = look === 'sale' || look === 'throw' ? 13 : 11;
  const x = cx - (w >> 1);
  p.rect(x, my, w, 3, 'pantalla', 4);
  p.rect(x + 1, my + 1, w - 2, 1, 'acero', 0);
  for (let i = 3; i < w - 2; i += 3) p.px(x + i, my + 1, 'acero', 2);
  p.px(x - 1, my - 1, 'pantalla', 4);
  p.px(x + w, my - 1, 'pantalla', 4);
  if (look === 'sale' || look === 'throw') p.rect(x + 2, my + 2, w - 4, 1, 'rojo', 4);
}

/** The doll as seen through the window: head pressed to the top, the blazer, the twist ties. */
function boxedDoll(p: Paint, look: BoxedLook): void {
  // The printed backdrop: night-club navy with pink stars.
  p.rect(WIN.x, WIN.y, WIN.w, WIN.h, 'pantalla', 3);
  p.rect(WIN.x, WIN.y, WIN.w, 2, 'pantalla', 4);
  for (const [x, y] of [[31, 42], [60, 48], [31, 60], [61, 62], [57, 40], [30, 51]] as const) {
    p.px(x, y, 'rosa', 1);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) p.px(x + dx, y + dy, 'rosa', 4);
  }
  // The card insert the doll is wired to, the colour of the box.
  p.rect(33, 57, 26, 12, 'cartulina', 4);
  // Blazer with the collar up and a white shirt open at the neck.
  p.rect(36, 58, 21, 11, 'turquesa', 2);
  p.rect(36, 58, 4, 11, 'turquesa', 4);
  p.rect(36, 58, 21, 1, 'turquesa', 1);
  p.rect(55, 59, 2, 10, 'turquesa', 3);
  for (const [x, y] of [[40, 56], [40, 57], [41, 57], [52, 56], [52, 57], [51, 57]] as const) p.px(x, y, 'turquesa', 1);
  for (let j = 0; j < 6; j++) p.rect(44 + (j >> 1), 58 + j, 6 - 2 * (j >> 1), 1, 'acero', j < 2 ? 0 : 1);
  p.rect(42, 63, 1, 6, 'turquesa', 5);
  // The neck.
  p.rect(44, 56, 6, 2, 'vinilo', 3);
  // Head: big, a block of vinyl lit from the top left.
  pillow(p, 35, 42, 24, 15, 4, 'vinilo', 0.05);
  // The mould seam down the side of the head.
  for (let y = 46; y <= 54; y += 2) p.px(37, y, 'vinilo', 4);
  // Sculpted golden hair, squashed flat against the top of the window, frizz out at the sides.
  p.rect(33, 38, 28, 5, 'tostada', 1);
  p.rect(33, 38, 28, 1, 'tostada', 0);
  p.rect(33, 42, 4, 6, 'tostada', 2);
  p.rect(58, 42, 3, 4, 'tostada', 2);
  p.rect(34, 47, 2, 2, 'tostada', 3);
  for (const x of [38, 43, 48, 53]) p.px(x, 40, 'tostada', 0);
  for (const x of [40, 45, 50, 55]) p.rect(x, 42, 2, 1, 'tostada', 3);
  for (const [x, y] of [[31, 41], [30, 43], [31, 45], [62, 40], [62, 43]] as const) p.px(x, y, 'tostada', 2);
  dollFace(p, 47, 47, look);
}

/** The plastic hanger tab on top of every toy box, with its slot for the shop's hook. */
function hangerTab(p: Paint, cx: number, top: number, bottom: number, torn = false): void {
  const w = 16;
  const x = cx - (w >> 1);
  for (let y = top; y <= bottom; y++) {
    const inset = y === top ? 2 : y === top + 1 ? 1 : 0;
    p.rect(x + inset, y, w - 2 * inset, 1, 'cartulina', y < top + 2 ? 1 : 2);
  }
  p.rect(x + w - 1, top + 2, 1, bottom - top - 1, 'cartulina', 3);
  // The slot: a hole right through it (the floor shows through).
  const sy = top + 3;
  for (let i = 0; i < 8; i++) for (const yy of [sy, sy + 1]) p.erase(x + 4 + i, yy);
  p.px(x + 3, sy, 'cartulina', 4);
  p.px(x + 3, sy + 1, 'cartulina', 4);
  p.rect(x + 4, sy + 2, 8, 1, 'cartulina', 0);
  if (torn) {
    // Torn off on the right: a jagged edge.
    for (let y = top; y <= bottom - 2; y++) for (let xx = x + 9 + ((y * 3) % 3); xx < x + w; xx++) p.erase(xx, y);
  }
}

/**
 * The box, its lid, side and front, with everything printed or stuck on them (not the doll).
 * Drawn on `b` with its top-left at (x0, y0) as in the boss frame.
 */
function drawBox(b: Paint, x0: number, y0: number, opts: { tab?: 'whole' | 'torn' } = {}): void {
  const fx = x0 + DEPTH;
  if (opts.tab) hangerTab(b, fx + 20, y0 - DEPTH - 8, y0 - DEPTH + 1, opts.tab === 'torn');
  box34(b, x0, y0, FW, FH, DEPTH, 'cartulina', { top: [0, 1], side: [5, 4], front: [1, 2, 3] });
  const bottom = y0 + FH - 1;
  // The front's right edge rounded off and its bottom darker, further from the light.
  b.rect(fx + FW - 1, y0 + 1, 1, FH - 2, 'cartulina', 3);
  b.rect(fx + 1, bottom - 3, FW - 2, 3, 'cartulina', 3);
  b.rect(fx, y0, FW, 1, 'cartulina', 0);
  // A crease across the lid, and a dent in the side.
  b.rect(x0 + 10, y0 - 5, 20, 1, 'cartulina', 2);
  b.rect(x0 + 2, y0 + 32, 3, 2, 'cartulina', 6);
  b.px(x0 + 3, y0 + 34, 'cartulina', 6);
  // The side: the barcode and the age rating.
  b.rect(x0 + 1, y0 + 14, 6, 10, 'acero', 1);
  b.rect(x0 + 1, y0 + 14, 6, 1, 'acero', 0);
  for (const x of [x0 + 1, x0 + 3, x0 + 4, x0 + 6]) b.rect(x, y0 + 15, 1, 7, 'goma', 4);
  b.rect(x0 + 1, y0 + 26, 6, 5, 'amarillo', 2);
  b.px(x0 + 2, y0 + 28, 'amarillo', 5);
  b.rect(x0 + 4, y0 + 27, 1, 3, 'amarillo', 5);
  b.rect(x0 + 3, y0 + 28, 3, 1, 'amarillo', 5);
  // Logo band: a yellow pill with «MODA» in the box's pink.
  const ly = y0 + 2;
  b.rect(fx + 5, ly, FW - 10, 7, 'amarillo', 1);
  b.rect(fx + 5, ly, FW - 10, 1, 'amarillo', 0);
  b.rect(fx + 5, ly + 6, FW - 10, 1, 'amarillo', 3);
  for (const [x, y] of [[fx + 5, ly], [fx + FW - 6, ly], [fx + 5, ly + 6], [fx + FW - 6, ly + 6]] as const) b.px(x, y, 'cartulina', 2);
  logoText(b, fx + 11, ly + 1, 'MODA', 'cartulina', 3);
  // The trademark, and the «2025» edition crossed out (it is last year's).
  b.px(fx + 31, ly + 1, 'cartulina', 3);
  b.rect(fx + 33, ly + 2, 4, 3, 'amarillo', 3);
  b.rect(fx + 32, ly + 3, 6, 1, 'rojo', 2);
  // The window's frame, in darker card.
  b.rect(fx + 3, y0 + 11, FW - 6, FH - 17, 'cartulina', 4);
  b.rect(fx + 3, y0 + 11, FW - 6, 1, 'cartulina', 5);
  b.rect(fx + 3, y0 + FH - 7, FW - 6, 1, 'cartulina', 1);
  // Small print under the window.
  for (const y of [bottom - 5, bottom - 3]) for (let x = fx + 4; x < fx + FW - 4; x += 1) if ((x * 7 + y) % 5 !== 0) b.px(x, y, 'cartulina', 4);
}

/** The doll in its box. */
export function makeMunecoBoxedNuevo(pose: Pose = REST, look: BoxedLook = 'calm'): Canvas {
  const p = new Paint(MUNECO_W, MUNECO_H);
  const d = pose.bob;
  legs(p, pose, BOTTOM + 1 + d);
  const b = new Paint(MUNECO_W, MUNECO_H);
  // The back hand, behind the box: gripping its side; on the hip posing; up with the purse
  // throwing; up beside the tag for the sale; pressed against the side in horror.
  const back = { calm: [8, 46], pose: [9, 60], throw: [5, 22], sale: [7, 12], shock: [9, 38] }[look];
  if (look === 'throw') purse(b, back[0]! - 1, back[1]! - 8);
  hand(b, back[0]!, back[1]!, true);
  drawBox(b, X0, Y0, { tab: 'whole' });
  // The doll behind the plastic, clipped to the window.
  const doll = new Paint(MUNECO_W, MUNECO_H);
  boxedDoll(doll, look);
  for (let y = WIN.y; y < WIN.y + WIN.h; y++) for (let x = WIN.x; x < WIN.x + WIN.w; x++) {
    if (!doll.filled(x, y)) continue;
    b.cv.put(x, y, doll.cv.get(x, y));
    b.mat[y]![x] = doll.mat[y]![x] ?? null;
  }
  // The twist ties, across its neck and waist, fixed to the card on both sides.
  twistTie(b, WIN.x, 57, WIN.w);
  twistTie(b, WIN.x, 65, WIN.w);
  // The glare on the plastic: two diagonal streaks.
  const inWin = (x: number, y: number): boolean => x >= WIN.x && x < WIN.x + WIN.w && y >= WIN.y && y < WIN.y + WIN.h;
  glare(b, WIN.x, WIN.y + 14, 8, 2, 0.45, inWin);
  glare(b, WIN.x, WIN.y + 20, 9, 1, 0.35, inWin);
  glare(b, WIN.x + 27, WIN.y + 9, 9, 2, 0.4, inWin);
  oldNewSticker(b, STICKER.x, STICKER.y);
  // The front hand: gripping the front edge; flung up above the box posing; out with a shoe
  // throwing; up beside the tag for the sale; pressed on the side in horror.
  const front = { calm: [64, 50], pose: [68, 4], throw: [72, 40], sale: [69, 12], shock: [65, 38] }[look];
  hand(b, front[0]!, front[1]!);
  if (look === 'throw') shoe(b, front[0]! + 2, front[1]! - 8);
  p.stamp(b, 0, d);
  const out = p.outline();
  // A sparkle off the teeth when it poses (outside the outline), and the shine of the sale.
  if (look === 'pose' || look === 'sale') {
    const [sx, sy] = look === 'pose' ? [58, 51 + d] : [40, 4 + d];
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-2, 0], [2, 0], [0, -2], [0, 2]] as const) {
      const x = sx + dx;
      const y = sy + dy;
      if (look === 'sale' || out.get(x, y)[3] === 0 || Math.abs(dx) + Math.abs(dy) <= 1) out.put(x, y, dx === 0 && dy === 0 ? SHINE : [255, 246, 194, 255]);
    }
  }
  return out;
}

/** The doll out of its box (phase 3). */
export function makeMunecoLooseNuevo(pose: Pose = REST, look: LooseLook = 'calm'): Canvas {
  const p = new Paint(MUNECO_W, MUNECO_H);
  const d = pose.bob;
  legs(p, pose, 70 + d);
  const b = new Paint(MUNECO_W, MUNECO_H);
  // The back hand.
  const back = { calm: [14, 54], pose: [18, 62], back: [9, 46], front: [4, 40], side: [6, 50], throw: [8, 30], windup: [32, 54] }[look];
  if (look !== 'windup') hand(b, back[0]!, back[1]!, true);
  // The blazer: a block in three quarters, its left side in shade.
  const bx = look === 'side' ? 30 : 26;
  const bw = look === 'side' ? 26 : 33;
  b.rect(bx, 46, bw, 25, 'turquesa', 2);
  b.rect(bx, 46, 5, 25, 'turquesa', 4);
  b.rect(bx, 46, bw, 1, 'turquesa', 1);
  b.rect(bx + bw - 2, 47, 2, 24, 'turquesa', 3);
  b.rect(bx, 69, bw, 2, 'turquesa', 4);
  // Shoulders: rounded off.
  b.erase(bx, 46);
  b.erase(bx + bw - 1, 46);
  if (look === 'back') {
    // From behind: the seam down the back and the «made in» label sticking out of the collar.
    b.rect(bx + 16, 48, 1, 21, 'turquesa', 4);
    b.rect(bx + 14, 45, 5, 4, 'acero', 1);
    b.rect(bx + 15, 46, 3, 1, 'acero', 3);
  } else if (look !== 'side') {
    // The collar up, the white shirt open at the neck, the buttons.
    for (const [x, y] of [[bx + 6, 43], [bx + 6, 44], [bx + 7, 44], [bx + 7, 45], [bx + 25, 43], [bx + 25, 44], [bx + 24, 44], [bx + 24, 45]] as const) b.px(x, y, 'turquesa', 1);
    for (let j = 0; j < 8; j++) b.rect(bx + 12 + (j >> 1), 46 + j, 9 - 2 * (j >> 1), 1, 'acero', j < 2 ? 0 : 1);
    b.rect(bx + 10, 55, 1, 14, 'turquesa', 5);
    for (const y of [58, 63]) b.px(bx + 12, y, 'laton', 1);
    // The tape from the box, stuck crooked on its chest.
    b.rect(bx + 16, 59, 13, 3, 'acero', 1);
    b.rect(bx + 16, 61, 13, 1, 'acero', 2);
    for (let i = 0; i < 11; i++) if (i % 3 !== 2) b.px(bx + 17 + i, 60 - (i % 2), 'goma', 4);
  } else {
    // Side on: the sleeve seam and a pocket.
    b.rect(bx + 10, 52, 1, 16, 'turquesa', 4);
    b.rect(bx + 14, 60, 7, 1, 'turquesa', 4);
  }
  // The head: a big block of vinyl.
  const hx0 = look === 'side' ? 26 : 22;
  pillow(b, hx0, 18, 38, 27, 5, 'vinilo', 0.05);
  // The neck, and the twist tie round it, the cut end sticking out.
  b.rect(39, 45, 8, 1, 'vinilo', 3);
  b.rect(35, 45, 16, 1, 'acero', 2);
  b.px(51, 44, 'acero', 1);
  b.px(52, 43, 'acero', 1);
  b.px(53, 42, 'acero', 2);
  // Hair: sprung loose, spikes of frizz everywhere (lit on top, in shade down the sides).
  const hx = hx0 - 1;
  b.rect(hx, 13, 40, 8, 'tostada', 1);
  b.rect(hx, 13, 40, 1, 'tostada', 0);
  // Spikes fanning out, each its own length (from the crown of its head, tip outwards).
  const spikes: Array<[number, number, number, number, number]> = [
    [hx + 3, 16, hx - 6, 8, 4], [hx + 8, 14, hx + 2, 2, 4], [hx + 14, 14, hx + 11, 0, 5], [hx + 20, 14, hx + 21, 3, 4],
    [hx + 26, 14, hx + 30, 0, 5], [hx + 32, 14, hx + 39, 4, 4], [hx + 37, 16, hx + 46, 10, 4],
    [hx + 2, 22, hx - 6, 22, 4], [hx + 2, 27, hx - 4, 32, 3], [hx + 38, 20, hx + 45, 22, 3],
  ];
  for (const [x0, y0, x1, y1, w] of spikes) spike(b, x0, y0, x1, y1, w);
  for (const x of [hx + 6, hx + 13, hx + 20, hx + 27, hx + 34]) b.rect(x, 17, 3, 1, 'tostada', 3);
  if (look === 'back') {
    // From behind, the head is all hair.
    b.rect(hx + 1, 19, 38, 25, 'tostada', 2);
    b.rect(hx + 1, 19, 5, 25, 'tostada', 3);
    // Strands combed down the back, every one its own way, and a lit crown.
    for (const [x, y, h] of [[hx + 9, 21, 12], [hx + 14, 25, 14], [hx + 19, 20, 10], [hx + 24, 24, 16], [hx + 29, 21, 13], [hx + 34, 26, 12]] as const) {
      b.rect(x, y, 1, h, 'tostada', 3);
      b.px(x + 1, y, 'tostada', 1);
    }
    b.rect(hx + 8, 19, 24, 2, 'tostada', 1);
    b.rect(hx + 3, 42, 34, 2, 'tostada', 4);
  } else {
    // The side of the head in shade, with its hair down to the jaw.
    b.rect(hx, 19, 5, 14, 'tostada', 2);
    b.rect(hx, 33, 3, 6, 'tostada', 3);
    // The seam.
    for (let y = 24; y <= 40; y += 2) b.px(hx0 + 6, y, 'vinilo', 4);
    const cx = look === 'side' ? 52 : 43;
    // Brows: angry now, sloping down to the middle.
    for (let i = 0; i < 6; i++) {
      b.px(cx - 10 + i, 21 + (i >> 1), 'quemada', 1);
      if (look !== 'side') b.px(cx + 9 - i, 21 + (i >> 1), 'quemada', 1);
    }
    const eyes = look === 'side' ? [cx + 1] : [cx - 9, cx + 3];
    if (look === 'front' || look === 'windup') {
      // Screwed shut (spinning): two chevrons; narrowed (winding up): a hard line.
      for (const ex of eyes) {
        if (look === 'front') for (const [dx, dy] of [[0, 25], [1, 26], [2, 27], [3, 26], [4, 25]] as const) b.px(ex + dx, dy, 'goma', 5);
        else {
          b.rect(ex, 26, 6, 2, 'acero', 0);
          b.px(ex + 4, 27, 'pantalla', 5);
          b.rect(ex - 1, 25, 7, 1, 'goma', 5);
        }
      }
    } else {
      // Big doll eyes gone wild: wide whites, a blue iris shrunk to a ring round a pinprick,
      // looking right; heavy painted lashes flicking out, bags under them.
      for (const ex of eyes) {
        b.rect(ex, 23, 6, 7, 'acero', 0);
        b.rect(ex, 28, 6, 2, 'acero', 1);
        b.rect(ex + 3, 25, 3, 3, 'azul', 3);
        b.px(ex + 4, 26, 'pantalla', 5);
        b.raw(ex + 3, 25, SHINE);
        b.rect(ex - 1, 22, 8, 1, 'goma', 5);
        b.px(ex + 6, 21, 'goma', 5);
        b.px(ex + 7, 20, 'goma', 5);
        b.px(ex - 1, 21, 'goma', 5);
        b.rect(ex, 30, 6, 1, 'vinilo', 3);
        b.rect(ex + 1, 31, 4, 1, 'vinilo', 4);
      }
      if (look === 'pose') {
        // The wink.
        b.rect(cx + 3, 22, 6, 8, 'vinilo', 1);
        b.rect(cx + 3, 27, 6, 1, 'goma', 5);
        b.px(cx + 2, 26, 'goma', 5);
        b.px(cx + 9, 26, 'goma', 5);
      }
    }
    // Rouge, and the nose.
    if (look !== 'side') b.rect(cx - 12, 31, 2, 1, 'rosa', 2);
    b.rect(cx + 10, 31, 2, 1, 'rosa', 2);
    if (look === 'side') {
      // The nose sticks out of the profile.
      b.px(hx0 + 38, 30, 'vinilo', 2);
      b.px(hx0 + 38, 31, 'vinilo', 3);
    } else b.px(cx, 30, 'vinilo', 3);
    // The grin, wider than the face should allow; open shouting when it throws.
    const mx = look === 'side' ? cx - 4 : cx - 10;
    const mw = look === 'side' ? 13 : 20;
    if (look === 'throw') {
      b.rect(mx + 3, 33, mw - 6, 6, 'pantalla', 4);
      b.rect(mx + 4, 33, mw - 8, 1, 'acero', 0);
      b.rect(mx + 5, 37, mw - 10, 2, 'rojo', 3);
    } else {
      b.rect(mx, 34, mw, 4, 'pantalla', 4);
      b.rect(mx + 1, 35, mw - 2, 2, 'acero', 0);
      for (let x = mx + 3; x < mx + mw - 2; x += 3) b.rect(x, 35, 1, 2, 'acero', 2);
      b.px(mx - 1, 33, 'pantalla', 4);
      b.px(mx + mw, 33, 'pantalla', 4);
      // A crack in the vinyl at the corner of the mouth (it smiled too long).
      b.px(mx + mw + 1, 34, 'vinilo', 5);
      b.px(mx + mw + 2, 35, 'vinilo', 5);
      b.px(mx + mw + 2, 36, 'vinilo', 5);
    }
  }
  // The front hand.
  const front = { calm: [58, 54], pose: [62, 2], back: [62, 46], front: [72, 40], side: [70, 46], throw: [70, 36], windup: [44, 54] }[look];
  hand(b, front[0]!, front[1]!);
  if (look === 'throw') purse(b, front[0]! + 1, front[1]! - 9);
  if (look === 'windup') hand(b, back[0]!, back[1]!, true);
  p.stamp(b, 0, d);
  return p.outline();
}

/** Its sheet, in the order of MUNECO_FRAMES. */
export function makeMunecoNuevoFrames(): Canvas[] {
  const lift = { ...REST, bob: -1 };
  return [
    ...MUNECO_POSES.map((pose) => makeMunecoBoxedNuevo(pose)),
    makeMunecoBoxedNuevo(lift, 'pose'),
    makeMunecoBoxedNuevo(REST, 'throw'),
    makeMunecoBoxedNuevo(lift, 'sale'),
    makeMunecoBoxedNuevo(REST, 'shock'),
    ...MUNECO_POSES.map((pose) => makeMunecoLooseNuevo(pose)),
    makeMunecoLooseNuevo(lift, 'pose'),
    makeMunecoLooseNuevo(lift, 'back'),
    makeMunecoLooseNuevo(lift, 'front'),
    makeMunecoLooseNuevo(lift, 'side'),
    makeMunecoLooseNuevo(REST, 'throw'),
    makeMunecoLooseNuevo({ ...REST, bob: 1 }, 'windup'),
  ];
}

/** 3x5 digits for the price tags (and a 3x5 per cent sign). */
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['111', '101', '101', '101', '111'],
  '3': ['111', '001', '011', '001', '111'],
  '5': ['111', '100', '111', '001', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '9': ['111', '101', '111', '001', '111'],
  '%': ['101', '001', '010', '100', '101'],
  '-': ['000', '000', '110', '000', '000'],
};

/**
 * The tag on its box (TAG_ANCHOR), one frame per price: 0 full price («99»), then −30 %, −50 % and
 * −70 % (phase 2, «Rebajas»), each one redder; a pointed tag with its hole and string, every
 * discount stuck over the one before (a corner of it peeks out).
 */
export function makeTagNuevoFrames(): Canvas[] {
  const looks: Array<{ text: string; m: Material; t: number; ink: [Material, number]; under?: [Material, number] }> = [
    { text: '99', m: 'acero', t: 1, ink: ['goma', 5] },
    { text: '-30%', m: 'amarillo', t: 1, ink: ['amarillo', 5], under: ['acero', 1] },
    { text: '-50%', m: 'tostada', t: 1, ink: ['quemada', 3], under: ['amarillo', 1] },
    { text: '-70%', m: 'rojo', t: 2, ink: ['acero', 0], under: ['tostada', 1] },
  ];
  return looks.map(({ text, m, t, ink, under }) => {
    const p = new Paint(TAG_W, TAG_H);
    if (under) p.rect(18, 8, 3, 3, under[0], under[1]);
    p.rect(4, 1, 17, 10, m, t);
    p.rect(4, 1, 17, 1, m, t - 1);
    p.rect(4, 10, 17, 1, m, t + 2);
    p.rect(20, 2, 1, 8, m, t + 1);
    for (let j = 0; j < 4; j++) {
      p.rect(3 - Math.min(j, 2), 3 + j, 1 + Math.min(j, 2), 1, m, t);
      p.rect(3 - Math.min(j, 2), 8 - j, 1 + Math.min(j, 2), 1, m, t + 1);
    }
    if (under) p.rect(19, 9, 2, 2, under[0], under[1]);
    // The hole.
    p.px(3, 5, m, 5);
    p.px(3, 6, m, 5);
    let x = text.length > 2 ? 6 : 10;
    for (const ch of text) {
      GLYPHS[ch]!.forEach((row, j) => [...row].forEach((bit, i) => bit === '1' && p.px(x + i, 3 + j, ink[0], ink[1])));
      x += ch === '-' ? 3 : 4;
    }
    const out = p.outline();
    // The string out of the hole.
    out.put(0, 4, tone('goma', 3));
    out.put(0, 5, tone('goma', 3));
    return out;
  });
}

export const BROKEN_W = 56;
export const BROKEN_H = 62;

/**
 * The box it leaves behind in phase 3 (prop `caja-muneco`, an obstacle that stops bullets): the
 * same box, empty, the window smashed open from inside (jagged plastic round the hole), the twist
 * ties cut and hanging, the doll-shaped hole in the card insert, the hanger tab torn and the −70 %
 * tag still on.
 */
export function makeBrokenBoxNuevo(): Canvas {
  const p = new Paint(BROKEN_W, BROKEN_H);
  const x0 = 1;
  const y0 = 11;
  const dx = x0 - X0;
  const dy = y0 - Y0;
  drawBox(p, x0, y0, { tab: 'torn' });
  // The window, empty: the backdrop and the doll-shaped hole in the card insert.
  const W = { x: WIN.x + dx, y: WIN.y + dy, w: WIN.w, h: WIN.h };
  p.rect(W.x, W.y, W.w, W.h, 'pantalla', 3);
  p.rect(W.x, W.y, W.w, 2, 'pantalla', 4);
  for (const [x, y] of [[3, 4], [32, 10], [3, 22], [33, 24]] as const) {
    p.px(W.x + x, W.y + y, 'rosa', 1);
    p.px(W.x + x + 1, W.y + y, 'rosa', 4);
    p.px(W.x + x, W.y + y + 1, 'rosa', 4);
  }
  // The card insert with the cut-out of the doll: a big head and its shoulders.
  p.rect(W.x + 5, W.y + 3, 26, W.h - 3, 'carton', 1);
  p.rect(W.x + 5, W.y + 3, 26, 1, 'carton', 0);
  p.rect(W.x + 30, W.y + 4, 1, W.h - 4, 'carton', 3);
  p.rect(W.x + 7, W.y + 4, 22, 15, 'carton', 4);
  p.rect(W.x + 9, W.y + 18, 4, 2, 'carton', 4);
  p.rect(W.x + 23, W.y + 18, 4, 2, 'carton', 4);
  p.rect(W.x + 8, W.y + 20, 20, W.h - 20, 'carton', 4);
  p.rect(W.x + 7, W.y + 4, 2, 15, 'carton', 5);
  p.rect(W.x + 8, W.y + 20, 2, W.h - 20, 'carton', 5);
  // Cut twist ties hanging from both sides.
  for (let j = 0; j < 6; j++) {
    p.px(W.x + 1 + (j % 2), W.y + 19 + j, 'acero', 2);
    p.px(W.x + W.w - 2 - (j % 2), W.y + 19 + j, 'acero', 2);
  }
  // Jagged plastic left round the frame, catching the light.
  const shards: Array<[number, number, number, number]> = [[0, 0, 7, 3], [0, 3, 3, 5], [29, 0, 7, 2], [32, 2, 4, 6], [0, 26, 4, 5], [31, 25, 5, 6], [16, 0, 5, 2]];
  for (const [x, y, w, h] of shards) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if ((i + j) % 4 === 3 && j > 0) continue;
      const c = p.cv.get(W.x + x + i, W.y + y + j);
      p.cv.put(W.x + x + i, W.y + y + j, mix(c, SHINE, 0.55));
    }
    p.raw(W.x + x, W.y + y, SHINE);
  }
  oldNewSticker(p, STICKER.x + dx, STICKER.y + dy);
  const out = p.outline();
  out.blit(makeTagNuevoFrames()[3]!, TAG_ANCHOR.x + dx, TAG_ANCHOR.y + dy);
  return out;
}

/** Size of each piece of its debris. */
export const MUNECO_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-muneco-moda`): a pink stiletto, a doll hand, the
 * torn hanger tab, a twist tie, the crossed-out «¡Novedad!» and a tuft of its golden hair.
 */
export function makeMunecoBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => shoe(p, 2, 1),
    (p) => hand(p, 1, 2),
    (p) => {
      for (let y = 2; y < 10; y++) p.rect(1, y, 10, 1, 'cartulina', y < 4 ? 1 : 2);
      for (let i = 0; i < 5; i++) p.erase(3 + i, 5);
      for (let y = 2; y < 9; y++) p.erase(9 + (y % 2), y);
      p.rect(3, 6, 5, 1, 'cartulina', 0);
    },
    (p) => {
      for (let i = 0; i < 9; i++) p.px(1 + i, 6 + Math.round(Math.sin(i * 0.9) * 2), 'acero', 1 + (i % 2));
      p.px(5, 3, 'acero', 1);
      p.px(5, 4, 'acero', 2);
    },
    (p) => oldNewSticker(p, 6, 4),
    (p) => {
      for (let i = 0; i < 4; i++) {
        p.rect(1 + i * 2, 2 + (i % 2) * 2, 3, 8 - (i % 2) * 2, 'tostada', 1);
        p.px(1 + i * 2, 2 + (i % 2) * 2, 'tostada', 0);
      }
      p.rect(2, 9, 8, 1, 'tostada', 3);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(MUNECO_BIT, MUNECO_BIT);
    draw(p);
    return p.outline();
  });
}
