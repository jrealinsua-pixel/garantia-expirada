// M14c (a7c): El Router del Wifi and its repeaters in the new style (docs/ESTILO_ARTE.md, «M14c ·
// El estilo nuevo», and the bosses' size rule decided with the Nevera in (a7a)). The old approved
// sprites stay in router.ts.
//
// A wide, flat home router in three quarters: the lid on top (the light side) with its vents and
// four antennas along the back edge, the dark side on the left with the password sticker torn off,
// the front facing you with a smug half-lidded face, the wifi logo on its forehead (where the waves
// come out: BossBrain.muzzle) and the row of status lights, the «internet» one red since the day it
// was installed. Blue nitrile gloves (IT's), brown office shoes, and a network cable out of its side
// that ends in a clip plugged into nothing. After the firmware update (phase 2) it is worse: red
// eyes, brows down, red-hot antenna tips and a «v2.0» sticker slapped over the password.

import type { Canvas } from '../../src/art/canvas.ts';
import { SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { box34 } from './planta3-nuevo.ts';
import type { Pose } from './pose.ts';

export const ROUTER_W = 84;
export const ROUTER_H = 88;
/** Where its shoes touch the floor (EnemyDef.anchor): the outline row under the soles. */
export const ROUTER_FEET = { x: 40, y: 86 } as const;
/** Its rest pose: the left edge of each shoe. */
export const ROUTER_LEGS2 = [26, 45] as const;
/** The wifi logo on its forehead, px from the feet: BossBrain.muzzle (the old one, kept). */
export const ROUTER_MOUTH = { x: 6, y: 40 } as const;

/** Frame layout (EnemyAnim of src/data/enemies.ts). */
export const ROUTER_FRAMES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  /** Phase 1 poses: broadcasting its waves («Cobertura total»), spitting packets. */
  waves: 6,
  packets: 7,
  /** The reboot between phases (EnemyAnim.reboot): eyes shut, 0 to 5 lights lit. */
  reboot: [8, 9, 10, 11, 12, 13],
  /** Phase 2, updated: the same layout from here (EnemyAnim.phaseShift). */
  phaseShift: 14,
  /** Phase 2 poses: the firmware rings, the packets, and slamming down the dropped connections. */
  firmware: 20,
  packets2: 21,
  drop: 22,
  count: 23,
} as const;

type Look = 'calm' | 'waves' | 'packets' | 'reboot' | 'drop';

const REST: Pose = { xb: ROUTER_LEGS2[0], xf: ROUTER_LEGS2[1], bob: 0 };

/** The heavy walk (as the Nevera's): one shoe at a time 2 px off the floor while the body rises. */
export const ROUTER_POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

// The box: x0, y0 (the top of the front face), the front's width and height, and the lid's depth.
const X0 = 12;
const Y0 = 40;
const FW = 44;
const FH = 34;
const DEPTH = 12;
const FX = X0 + DEPTH;
/** Bottom row of the box. */
const BOTTOM = Y0 + FH - 1;
const MX = ROUTER_FEET.x + ROUTER_MOUTH.x;
const MY = ROUTER_FEET.y - ROUTER_MOUTH.y;
/** The status lights, left to right: power, wifi, internet, LAN 1, LAN 2. */
const LED_X = [30, 35, 40, 45, 50] as const;
const LED_Y = 65;

/** Short dark legs and brown office shoes, the soles on the floor whatever the bob. */
function legs(p: Paint, pose: Pose, top: number): void {
  const floor = ROUTER_FEET.y - 1;
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 3 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 3, top, 4, L, 'goma', back ? 4 : 2);
    p.rect(x + 3, top, 1, L, 'goma', back ? 3 : 1);
    const sw = back ? 10 : 11;
    p.rect(x, yb, sw, 3, 'quemada', back ? 2 : 1);
    p.rect(x + 1, yb, sw - 4, 1, 'quemada', back ? 1 : 0);
    // The shine on the toe, and the sole.
    p.px(x + sw - 3, yb + 1, 'tostada', back ? 3 : 2);
    p.rect(x, yb + 3, sw, 1, 'goma', 5);
  }
}

/** A blue nitrile glove (the kind IT wears to open you up): the hand, the thumb, the cuff. */
function glove(p: Paint, x: number, y: number, thumbLeft = false): void {
  p.ellipsoid(x + 4, y + 4, 4.2, 3.8, 'azul', { dither: 0, bias: 0.05 });
  p.ellipsoid(thumbLeft ? x + 0.5 : x + 7.5, y + 2, 1.6, 2.2, 'azul', { dither: 0, bias: 0.15 });
  p.rect(x + 1, y + 8, 7, 2, 'azul', 3);
  p.rect(x + 1, y + 8, 7, 1, 'azul', 1);
}

/**
 * An antenna: a black rubber stick shaded as a cylinder (lit on the left), the tip rounded, from
 * row `top` down to the lid. `tip`: the tip's glow (broadcasting cyan, red-hot after the update).
 */
function antenna(p: Paint, x: number, top: number, bottom: number, tip?: Material): void {
  for (let y = top; y < bottom; y++) {
    p.px(x, y, 'goma', 1);
    p.px(x + 1, y, 'goma', 2);
    p.px(x + 2, y, 'goma', 4);
  }
  p.px(x, top, 'goma', 2);
  p.px(x + 2, top, 'goma', 5);
  // The grip rings near the foot.
  for (const y of [bottom - 6, bottom - 4]) p.rect(x, y, 3, 1, 'goma', 4);
  if (tip) {
    p.rect(x, top, 3, 2, tip, 1);
    p.px(x + 1, top, tip, 0);
  }
}

/** The one somebody leant on: straight up to halfway, then bent over to the left, taped. */
function bentAntenna(p: Paint, x: number, top: number, bottom: number, tip?: Material): void {
  const bend = top + 11;
  antenna(p, x, bend, bottom);
  for (let i = 0; i < 10; i++) {
    const bx = x - i - 1;
    const by = bend - i;
    p.px(bx, by, 'goma', 1);
    p.px(bx + 1, by, 'goma', 2);
    p.px(bx + 2, by, 'goma', 3);
    p.px(bx + 1, by + 1, 'goma', 4);
  }
  if (tip) p.rect(x - 10, bend - 10, 2, 2, tip, 1);
  // Brown parcel tape round the bend, wound twice.
  p.rect(x - 2, bend - 2, 5, 4, 'carton', 1);
  p.rect(x - 2, bend - 2, 5, 1, 'carton', 0);
  p.rect(x - 2, bend + 1, 5, 1, 'carton', 3);
  p.px(x + 3, bend + 1, 'carton', 2);
}

/** The hinge where an antenna meets the lid. */
function hinge(p: Paint, x: number, y: number): void {
  p.rect(x - 1, y, 5, 3, 'goma', 3);
  p.rect(x - 1, y, 5, 1, 'goma', 1);
  p.px(x + 3, y + 2, 'goma', 5);
}

/** The wifi logo on its forehead, centred on the muzzle: a dot and three arcs, lit when it emits. */
function wifiLogo(p: Paint, lit: Material | null, crossed: boolean): void {
  const m: Material = lit ?? 'abs';
  const t = (k: number): number => (lit ? k : 4);
  // The dot, and the arcs above it (the muzzle is on the first one).
  p.rect(MX, MY + 2, 2, 1, m, t(1));
  for (const [r, dy] of [[2, 0], [4, -2], [6, -4]] as const) {
    p.rect(MX - r + 2, MY + dy, 2 * r - 2, 1, m, t(r === 2 ? 1 : 2));
    p.px(MX - r + 1, MY + dy + 1, m, t(2));
    p.px(MX + r, MY + dy + 1, m, t(2));
  }
  if (lit) p.raw(MX, MY + 2, SHINE);
  if (crossed) {
    // No connection: a red cross over it.
    for (let i = -4; i <= 4; i++) {
      p.px(MX + i, MY - 1 + i * 0.75, 'rojo', 2);
      p.px(MX + i, MY - 1 - i * 0.75, 'rojo', 2);
    }
  }
}

/**
 * The face on the front: big eyes under heavy lids of casing (smug, bored), green irises like status
 * lights and a smirk up on one side. Updated (phase 2): red irises and brows down. Rebooting: shut.
 */
function face(p: Paint, look: Look, updated: boolean): void {
  const ey = 47;
  for (const [ex, side] of [[29, -1], [54, 1]] as const) {
    if (look === 'reboot' || look === 'drop') {
      // Shut (rebooting), or screwed up (slamming down): a dark line, a crease of casing above.
      if (look === 'drop') {
        // Screwed shut: «>» and «<».
        for (let i = 0; i < 4; i++) {
          const x = side < 0 ? ex + 2 + i : ex + 5 - i;
          p.px(x, ey + 1 + i, 'abs', 6);
          p.px(x, ey + 7 - i, 'abs', 6);
        }
      } else {
        p.rect(ex, ey + 4, 8, 1, 'abs', 6);
      }
      if (look === 'reboot') p.rect(ex, ey + 3, 8, 1, 'abs', 3);
      continue;
    }
    const wide = look === 'waves';
    // The socket: a dark recess with a lit lower rim.
    p.rect(ex, ey, 8, 7, 'pantalla', 4);
    p.rect(ex + 1, ey + 7, 6, 1, 'abs', 1);
    // The iris: a status light.
    const iris: Material = updated ? 'rojo' : 'verde';
    p.ellipsoid(ex + 4.5, ey + 4.5, 2, 2, iris, { dither: 0, bias: 0.3 });
    p.raw(ex + 5, ey + 3, SHINE);
    // The lid: casing over the top half, lower to the outer corner (smug); less of it, wide-eyed.
    const lid = wide ? 1 : 3;
    p.rect(ex, ey, 8, lid, 'abs', 2);
    p.rect(ex, ey + lid, 8, 1, 'abs', 5);
    p.px(side < 0 ? ex : ex + 7, ey + lid + 1, 'abs', 5);
    if (updated) {
      // Brows down to the middle: two thick dark bars.
      for (let i = 0; i < 9; i++) {
        const dy = side < 0 ? Math.floor(i / 2.5) : Math.floor((8 - i) / 2.5);
        p.px(ex - 0.5 + i, ey - 4 + dy, 'abs', 6);
        p.px(ex - 0.5 + i, ey - 3 + dy, 'abs', 5);
      }
    }
  }
  // The mouth.
  if (look === 'packets') {
    // Open: a dark mouth, red inside where the packets come from.
    p.rect(40, 56, 11, 4, 'pantalla', 4);
    p.rect(41, 55, 9, 1, 'pantalla', 4);
    p.rect(41, 60, 9, 1, 'pantalla', 5);
    p.rect(42, 58, 7, 2, 'rojo', 3);
    p.rect(43, 56, 3, 1, 'acero', 1);
  } else if (look === 'waves') {
    p.ellipsoid(46, 57.5, 2.2, 1.8, 'pantalla', { dither: 0, bias: -0.4 });
  } else if (look === 'reboot') {
    p.rect(42, 58, 8, 1, 'abs', 6);
  } else if (look === 'drop') {
    // Teeth gritted.
    p.rect(40, 56, 11, 3, 'acero', 1);
    p.rect(40, 59, 11, 1, 'abs', 6);
    p.rect(40, 55, 11, 1, 'abs', 6);
    for (const x of [42, 45, 48]) p.px(x, 57, 'acero', 3);
  } else {
    // The smirk, up on its right.
    p.rect(41, 58, 9, 1, 'abs', 6);
    p.px(50, 57, 'abs', 6);
    p.px(51, 56, 'abs', 6);
    p.px(40, 58, 'abs', 4);
    p.rect(42, 59, 7, 1, 'abs', 1);
  }
}

/**
 * The row of status lights under a dark strip. Awake: power green, wifi green (blinks), internet
 * RED, LAN green, LAN off. Spitting packets: all of them flickering. Rebooting: the first `lit` in
 * amber. Updated: LAN 2 amber too (something new is wrong).
 */
function leds(p: Paint, look: Look, lit: number, blink: boolean, updated: boolean): void {
  // A band of glossy black plastic right across the front: the lights live on it.
  p.rect(FX + 1, LED_Y - 3, FW - 2, 7, 'pantalla', 4);
  p.rect(FX + 1, LED_Y - 3, FW - 2, 1, 'pantalla', 1);
  p.rect(FX + 1, LED_Y - 2, FW - 2, 1, 'pantalla', 3);
  p.rect(FX + 1, LED_Y + 4, FW - 2, 1, 'abs', 3);
  // The window's reflection slanting across it.
  for (let i = 0; i < 4; i++) p.px(FX + 6 + i, LED_Y + 2 - i, 'pantalla', 2);
  const awake: Array<Material | null> = ['verde', blink ? null : 'verde', 'rojo', 'verde', updated ? 'amarillo' : null];
  LED_X.forEach((x, i) => {
    let c: Material | null = awake[i] ?? null;
    if (look === 'reboot') c = i < lit ? 'amarillo' : null;
    else if (look === 'packets') c = i === 2 ? 'rojo' : i % 2 === 0 ? 'verde' : 'amarillo';
    if (c) {
      p.rect(x, LED_Y, 2, 1, c, 1);
      p.raw(x, LED_Y, SHINE);
    } else {
      p.rect(x, LED_Y, 2, 1, 'pantalla', 5);
    }
    // The tiny printed icon above each.
    p.px(x, LED_Y + 2, 'pantalla', 1);
    if (i !== 2) p.px(x + 1, LED_Y + 2, 'pantalla', 1);
  });
}

/** The «5G» plate that it is not: a yellow badge at the bottom right of the front. */
function plate(p: Paint): void {
  p.rect(58, 62, 8, 6, 'amarillo', 1);
  p.rect(58, 62, 8, 1, 'amarillo', 0);
  p.rect(65, 63, 1, 5, 'amarillo', 3);
  // «5G» in two blobs of ink-brown.
  p.rect(59, 64, 2, 1, 'amarillo', 4);
  p.px(59, 65, 'amarillo', 4);
  p.rect(59, 66, 2, 1, 'amarillo', 4);
  p.rect(62, 64, 2, 1, 'amarillo', 4);
  p.rect(62, 65, 1, 2, 'amarillo', 4);
  p.px(63, 66, 'amarillo', 4);
}

/** The password sticker on its side, its bottom corner torn off; after the update, «v2.0» over it. */
function sticker(p: Paint, updated: boolean): void {
  p.rect(14, 46, 7, 10, 'acero', 1);
  p.rect(14, 46, 7, 1, 'acero', 0);
  for (const y of [48, 50, 52]) p.rect(15, y, 5, 1, 'acero', 3);
  // Torn off: the corner gone, a curl of paper left.
  for (const [x, y] of [[20, 55], [19, 55], [20, 54], [18, 55]] as const) p.px(x, y, 'abs', 4);
  p.px(17, 55, 'acero', 2);
  if (updated) {
    // A white label stuck on crooked over half of it, with its «v2.0» in red.
    for (let i = 0; i < 9; i++) p.rect(13 + i, 50 - (i >> 2), 1, 5, 'acero', i === 0 ? 0 : 1);
    p.rect(14, 51, 2, 1, 'rojo', 2);
    p.px(15, 52, 'rojo', 2);
    p.rect(17, 50, 1, 2, 'rojo', 2);
    p.px(18, 51, 'rojo', 3);
    p.rect(19, 49, 2, 2, 'rojo', 2);
  }
}

/** Arcs of wifi in the air over it (see-through, outside the outline). */
function arcs(out: Canvas, color: readonly [number, number, number], d: number): void {
  const cx = 38;
  const cy = 20;
  for (const [r, a] of [[14, 150], [20, 110], [26, 75]] as const) {
    for (let deg = 205; deg <= 335; deg += 4) {
      const x = Math.round(cx + Math.cos((deg * Math.PI) / 180) * r * 1.45);
      const y = Math.round(cy + Math.sin((deg * Math.PI) / 180) * r * 0.8) + d;
      if (x >= 0 && y >= 0 && x < out.w && y < out.h && out.get(x, y)[3] === 0) out.put(x, y, [color[0], color[1], color[2], a]);
    }
  }
}

export interface RouterLook {
  look?: Look;
  /** Phase 2: after the firmware update. */
  updated?: boolean;
  /** Rebooting: how many lights are lit (0-5). */
  lit?: number;
  /** Second breath: the wifi light blinks. */
  blink?: boolean;
}

/** The router in a pose. */
export function makeRouterNuevo(pose: Pose = REST, o: RouterLook = {}): Canvas {
  const look = o.look ?? 'calm';
  const up = o.updated === true;
  const p = new Paint(ROUTER_W, ROUTER_H);
  const d = pose.bob;
  legs(p, pose, BOTTOM + 1 + d);
  const b = new Paint(ROUTER_W, ROUTER_H);
  // Antennas behind the lid, along its back edge. The second one is bent and taped.
  const tip: Material | undefined = look === 'waves' ? (up ? 'rojo' : 'cian') : up && look !== 'reboot' ? 'rojo' : undefined;
  // Rebooting they sag a little (the springs of their hinges give).
  const sag = look === 'reboot' ? 2 : 0;
  const ab = Y0 - DEPTH + 1;
  antenna(b, 16, 7 + sag, ab + 2, tip);
  bentAntenna(b, 30, 4 + sag, ab + 2, tip);
  antenna(b, 43, 2 + sag, ab + 2, tip);
  antenna(b, 55, 8 + sag, ab + 4, tip);
  // The back hand, behind the box: down by its side; up, broadcasting; slamming down.
  const bh = look === 'waves' ? [0, 20] : look === 'drop' ? [1, 66] : look === 'reboot' ? [1, 60] : [1, 52];
  glove(b, bh[0]!, bh[1]!, true);
  // The box: the lid lit, the left side in shade, the front in middle tones.
  box34(b, X0, Y0, FW, FH, DEPTH, 'abs', { top: [0, 0], side: [4, 3], front: [0, 1, 2] });
  // The front's right edge rounded off, and its bottom darker (further from the light).
  b.rect(FX + FW - 1, Y0 + 1, 1, FH - 2, 'abs', 3);
  b.rect(FX + 1, BOTTOM - 4, FW - 2, 4, 'abs', 3);
  b.rect(FX, BOTTOM - 5, FW, 1, 'abs', 4);
  // The lid's front edge catches the light.
  b.rect(FX, Y0, FW, 1, 'abs', 0);
  // Vents across the lid: rows of dark slots, following its slant.
  for (const j of [3, 6, 9]) for (let s = 0; s < 4; s++) b.rect(X0 + j + 9 + s * 8, Y0 - DEPTH + j, 5, 1, 'abs', 4);
  // A coffee ring on the lid, and dust in the corner.
  for (const [x, y] of [[50, 31], [51, 30], [52, 30], [53, 31], [52, 32], [51, 32]] as const) b.px(x, y, 'carton', 2);
  for (const [x, y] of [[20, 37], [22, 38], [60, 38]] as const) b.px(x, y, 'abs', 3);
  for (const x of [16, 30, 43, 55]) hinge(b, x, x === 55 ? ab + 2 : ab);
  // The side: ventilation slits, the sticker, scuffs.
  for (let y = 58; y < 70; y += 3) b.rect(15, y, 6, 1, 'abs', 5);
  sticker(b, up);
  // The front: the wifi logo, the face, the lights, the plate, a scuff.
  wifiLogo(b, look === 'waves' ? (up ? 'rojo' : 'cian') : null, look === 'drop');
  if (look === 'reboot') {
    // A loading wheel instead of the logo: the dots that are on, going round with the lights.
    const dots = [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]] as const;
    dots.forEach(([dx, dy], i) => b.px(MX + dx, MY + dy - 1, 'abs', i <= (o.lit ?? 0) + 1 ? 6 : 3));
  }
  face(b, look, up);
  leds(b, look, o.lit ?? 0, o.blink === true, up);
  plate(b);
  for (const [x, y] of [[27, 70], [62, 46], [66, 69]] as const) b.px(x, y, 'abs', 4);
  b.px(25, 71, 'oxido', 1);
  // The front hand: half over the box; up, broadcasting; out, throwing packets; slamming down.
  if (look === 'packets') {
    glove(b, 72, 42);
    // The packet in it: a red block of data.
    b.rect(78, 38, 5, 4, 'rojo', 2);
    b.rect(78, 38, 5, 1, 'rojo', 1);
    b.px(82, 39, 'rojo', 4);
  } else {
    const fh = look === 'waves' ? [71, 16] : look === 'drop' ? [70, 66] : look === 'reboot' ? [66, 62] : [66, 54];
    glove(b, fh[0]!, fh[1]!);
  }
  p.stamp(b, 0, d);
  const out = p.outline();
  // The network cable: out of its side, down to the floor, and its clip end plugged into nothing.
  const cable: Array<readonly [number, number]> = [
    [11, 62], [10, 63], [9, 64], [8, 65], [8, 66], [7, 67], [7, 68], [7, 69], [7, 70], [7, 71], [7, 72],
    [8, 73], [8, 74], [9, 75], [9, 76], [10, 77], [11, 78], [12, 79], [13, 80], [14, 81],
  ];
  for (const [x, y] of cable) {
    const yy = y + (y < 72 ? d : 0);
    if (out.get(x, yy)[3] === 0 || y < 72) {
      out.put(x, yy, [74, 119, 199, 255]);
      if (out.get(x + 1, yy)[3] === 0) out.put(x + 1, yy, [33, 31, 82, 255]);
    }
  }
  // The clip: clear plastic, its latch up, a few gold pins.
  out.put(14, 81, [174, 210, 219, 255]);
  out.put(15, 81, [214, 238, 242, 255]);
  out.put(16, 81, [174, 210, 219, 255]);
  out.put(15, 80, [132, 171, 190, 255]);
  out.put(17, 81, [224, 184, 74, 255]);
  for (const x of [14, 15, 16, 17]) if (out.get(x, 82)[3] === 0) out.put(x, 82, [20, 15, 32, 255]);
  if (out.get(18, 81)[3] === 0) out.put(18, 81, [20, 15, 32, 255]);
  // Waves in the air while it broadcasts: cyan, or red after the update.
  if (look === 'waves') arcs(out, up ? [255, 125, 92] : [105, 219, 216], d);
  return out;
}

/** Its sheet, in the order of ROUTER_FRAMES. */
export function makeRouterNuevoFrames(): Canvas[] {
  const phase = (updated: boolean): Canvas[] => ROUTER_POSES.map((pose, i) => makeRouterNuevo(pose, { updated, blink: i === 1 || i === 4 }));
  return [
    ...phase(false),
    makeRouterNuevo(REST, { look: 'waves' }),
    makeRouterNuevo(REST, { look: 'packets' }),
    ...[0, 1, 2, 3, 4, 5].map((lit) => makeRouterNuevo(REST, { look: 'reboot', lit })),
    ...phase(true),
    makeRouterNuevo(REST, { look: 'waves', updated: true }),
    makeRouterNuevo(REST, { look: 'packets', updated: true }),
    makeRouterNuevo(REST, { look: 'drop', updated: true }),
  ];
}

/** Size of each piece of its debris. */
export const ROUTER_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-router-wifi`): an antenna, a status light on its
 * legs, the password sticker, the «5G» plate, the network clip and a piece of the vented lid.
 */
export function makeRouterBits(): Canvas[] {
  const S = ROUTER_BIT;
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      for (let y = 1; y < 11; y++) {
        p.px(5, y, 'goma', 1);
        p.px(6, y, 'goma', 2);
        p.px(7, y, 'goma', 4);
      }
      p.rect(4, 9, 5, 2, 'goma', 3);
    },
    (p) => {
      p.ellipsoid(6, 4, 2.6, 2.6, 'verde', { dither: 0, bias: 0.25 });
      p.raw(5, 3, SHINE);
      p.rect(4, 7, 1, 4, 'acero', 2);
      p.rect(7, 7, 1, 3, 'acero', 2);
    },
    (p) => {
      p.rect(2, 2, 8, 8, 'acero', 1);
      p.rect(2, 2, 8, 1, 'acero', 0);
      for (const y of [4, 6, 8]) p.rect(3, y, 6, 1, 'acero', 3);
      p.px(9, 9, 'acero', 4);
    },
    (p) => plate2(p),
    (p) => {
      p.rect(3, 4, 6, 4, 'vidrio', 2);
      p.rect(3, 4, 6, 1, 'vidrio', 0);
      for (const x of [4, 5, 6, 7]) p.px(x, 8, 'laton', 1);
      p.rect(9, 5, 2, 2, 'azul', 3);
      p.rect(4, 2, 3, 2, 'vidrio', 3);
    },
    (p) => {
      p.rect(1, 3, 10, 6, 'abs', 1);
      p.rect(1, 3, 10, 1, 'abs', 0);
      p.rect(2, 5, 7, 1, 'abs', 4);
      p.rect(3, 7, 7, 1, 'abs', 4);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(S, S);
    draw(p);
    return p.outline();
  });
}

function plate2(p: Paint): void {
  p.rect(2, 3, 8, 6, 'amarillo', 1);
  p.rect(2, 3, 8, 1, 'amarillo', 0);
  p.rect(3, 5, 2, 1, 'amarillo', 4);
  p.rect(3, 7, 2, 1, 'amarillo', 4);
  p.px(3, 6, 'amarillo', 4);
  p.rect(6, 5, 2, 1, 'amarillo', 4);
  p.rect(6, 6, 1, 2, 'amarillo', 4);
}

// ---------------------------------------------------------------------------------------------
// Its repeater: a wall plug extender with one stubby antenna, standing on its two brass prongs
// (there is no wall to plug into). Tired eyes, a small wifi logo between them (where its waves
// come from: muzzleY) and one light. Unplugged, it slumps, the light goes off and the eyes shut.

export const REPETIDOR_W = 24;
export const REPETIDOR_H = 28;
export const REPETIDOR_FEET = { x: 12, y: 26 } as const;
/** Where its waves come out, px above its feet (RelayBrain.muzzleY, the old one, kept). */
export const REPETIDOR_MOUTH_Y = 13;

export function makeRepetidorNuevo(on = true, blink = false): Canvas {
  const p = new Paint(REPETIDOR_W, REPETIDOR_H);
  const sink = on ? 0 : 1;
  const floor = REPETIDOR_FEET.y - 1;
  // The prongs as legs: brass, lit on the left.
  for (const x of [8, 14]) {
    p.rect(x, 21, 2, floor - 21 + 1, 'laton', 2);
    p.rect(x, 21, 1, floor - 21 + 1, 'laton', 1);
    p.px(x + 1, floor, 'laton', 3);
  }
  const b = new Paint(REPETIDOR_W, REPETIDOR_H);
  // The stubby antenna, drooping when unplugged.
  for (let y = 0; y < 6; y++) {
    const x = on ? 16 : 16 + (y < 2 ? 2 - y : 0);
    b.px(x, y + 1, 'goma', 1);
    b.px(x + 1, y + 1, 'goma', 3);
  }
  box34(b, 4, 9, 12, 12, 4, 'abs', { top: [0, 1], side: [4, 3], front: [1, 2, 3] });
  b.rect(8, 9, 12, 1, 'abs', 0);
  b.rect(19, 10, 1, 10, 'abs', 3);
  // The eyes: tired, half-lidded; shut when unplugged.
  for (const ex of [9, 16]) {
    if (on) {
      b.rect(ex, 12, 3, 3, 'pantalla', 4);
      b.rect(ex, 12, 3, 1, 'abs', 3);
      b.px(ex + 1, 13, 'verde', 1);
      b.raw(ex + 2, 13, SHINE);
    } else {
      b.rect(ex, 14, 3, 1, 'abs', 6);
    }
  }
  // The little wifi logo between them (its muzzle).
  const mx = REPETIDOR_FEET.x + 1;
  const my = REPETIDOR_FEET.y - REPETIDOR_MOUTH_Y;
  b.px(mx, my + 1, 'abs', on ? 5 : 4);
  b.rect(mx - 1, my, 3, 1, 'abs', on ? 5 : 4);
  // A flat mouth, and its one light: green, blinking to nothing.
  b.rect(11, 17, 5, 1, 'abs', 6);
  if (on && !blink) {
    b.rect(9, 19, 2, 1, 'verde', 1);
    b.raw(9, 19, SHINE);
  } else {
    b.rect(9, 19, 2, 1, 'pantalla', 5);
  }
  // The «Ext.» sticker someone wrote on it, in the corner.
  b.px(17, 19, 'amarillo', 1);
  b.px(18, 19, 'amarillo', 2);
  p.stamp(b, 0, sink);
  return p.outline();
}

/** Repeater sheet: 0-1 on (the light blinks), 2 unplugged. */
export function makeRepetidorNuevoFrames(): Canvas[] {
  return [makeRepetidorNuevo(true, false), makeRepetidorNuevo(true, true), makeRepetidorNuevo(false)];
}
