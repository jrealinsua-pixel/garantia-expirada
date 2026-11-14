// M14c (a8a): floor 1 (the warehouse) in the new style (docs/ESTILO_ARTE.md, «M14c · El estilo
// nuevo»): bevelled steel plates from the `suelo` ramp with their variations, the concrete-block
// tops of the side and front walls (`muro`), the hazard tape along them with steel corner guards,
// the walls' shadow and the lamps' pools of light, both in bands with an ordered dither on the
// seams instead of a smooth gradient. Used by the room painter (src/art/room.ts) for level 1;
// the old tile set (src/art/warehouse.ts) keeps the decoration on top.
//
// Same rule as before: the floor stays dark and quiet (mean luminance 0.035–0.075) so that the
// bullets read on it; the detail goes to the edges of things, not across their faces.
import { Rng } from '../sim/rng.ts';
import { Canvas, type RGBA } from './canvas.ts';
import { INK, MATERIALS, bayer, mix } from './paleta.ts';

const T = 24;
const F = MATERIALS.suelo;
const M = MATERIALS.muro;
const A = MATERIALS.amarillo;
const AC = MATERIALS.acero;
const OX = MATERIALS.oxido;
const f = (i: number): RGBA => F[i]!;

/**
 * Quantise a level `v` (0–3) to a whole step; only in the last fifth before the next step does the
 * ordered dither mix the two (dither on the seams, never across a flat band).
 */
function step(v: number, x: number, y: number, width = 0.2): number {
  const base = Math.floor(v);
  const frac = v - base;
  return width > 0 && frac > 1 - width && bayer(x, y) < (frac - (1 - width)) / width ? base + 1 : base;
}
const m = (i: number): RGBA => M[i]!;

/**
 * The flat face of a plate: one tone, the next plate a shade lighter (laid in a checker). A pool
 * of light per plate was tried (the one in art/prueba/suelo.png): over a whole room its dithered
 * edge drew a little star on every plate, so the face is flat and the light is the room's.
 */
function face(alt: boolean): RGBA {
  return alt ? mix(F[3]!, F[2]!, 0.35) : F[3]!;
}

/**
 * A plain floor plate (24 × 24) at (x, y): the dithered pool of light, the dark joint on its top
 * and left (the plates are laid edge to edge, the joint is shared), a lit bevel inside it, the
 * shadowed bevel at the bottom and right, and a rivet in each corner. Now and then a scratch.
 */
export function plate(S: Canvas, rng: Rng, x: number, y: number, alt: boolean): void {
  S.rect(x, y, T, T, face(alt));
  for (let k = 0; k < T; k++) {
    S.put(x + k, y, f(6));
    S.put(x, y + k, f(6));
    if (k > 0) {
      S.put(x + k, y + 1, f(alt ? 2 : 1));
      S.put(x + 1, y + k, f(alt ? 2 : 1));
      S.put(x + k, y + T - 1, f(4));
      S.put(x + T - 1, y + k, f(4));
    }
  }
  S.put(x + 1, y + 1, f(0));
  for (const [ox, oy] of [[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]] as const) rivet(S, x + ox, y + oy);
  if (rng.chance(0.3)) {
    // A scratch from something dragged: lit on its top edge, a dark pixel at each end.
    const len = rng.int(4, 7);
    const sx = x + rng.int(6, T - 8 - len);
    const sy = y + rng.int(7, T - 9);
    const dy = rng.chance(0.5) ? 1 : 0;
    for (let k = 0; k < len; k++) S.put(sx + k, sy + Math.floor((k * dy) / 2), f(alt ? 2 : 1));
    S.put(sx + len, sy + Math.floor((len * dy) / 2), f(5));
  }
}

/** A rivet: a lit cap with its shadow below and to the right (2 × 2 plus the shadow). */
function rivet(S: Canvas, x: number, y: number): void {
  S.put(x, y, f(0));
  S.put(x + 1, y, f(1));
  S.put(x, y + 1, f(1));
  S.put(x + 1, y + 1, f(3));
  S.put(x + 2, y + 1, f(5));
  S.put(x + 1, y + 2, f(5));
  S.put(x + 2, y + 2, f(4));
}

/** The variations of a plate (the names are the old tile set's: the tests and the features count them). */
export type PlateVariant = 'plain' | 'cracked' | 'worn' | 'patched' | 'grate' | 'checker';

export function paintPlate(S: Canvas, rng: Rng, x: number, y: number, alt: boolean, v: PlateVariant): void {
  switch (v) {
    case 'cracked': {
      // A crack from the top edge that wanders down, with a lit chipped lip on its left and a
      // short branch; a speck of rust where water got in.
      let cx = x + rng.int(5, T - 6);
      let cy = y + 2;
      const len = rng.int(10, 18);
      for (let k = 0; k < len; k++) {
        S.put(cx, cy, f(6));
        S.put(cx - 1, cy, f(alt ? 2 : 1));
        if (k % 3 === 1) S.put(cx + 1, cy, f(5));
        cy++;
        if (rng.chance(0.45)) cx += rng.chance(0.5) ? 1 : -1;
        if (rng.chance(0.16) && k > 3) {
          const d = rng.chance(0.5) ? 1 : -1;
          for (let b = 1; b < 4; b++) S.put(cx + d * b, cy + b - 1, f(b === 3 ? 5 : 6));
        }
        cx = Math.max(x + 3, Math.min(x + T - 4, cx));
      }
      S.put(cx, cy, OX[3]!);
      S.put(cx + 1, cy - 1, OX[2]!);
      break;
    }
    case 'worn': {
      // Polished in the middle where everybody walks (one tone up, dithered at the edge of the
      // ellipse), and one rivet gone, leaving its hole.
      const lit = mix(face(alt), F[2]!, 0.45);
      for (let j = 4; j < T - 4; j++) {
        for (let i = 4; i < T - 4; i++) {
          const d = ((i - 12) / 8) ** 2 + ((j - 12) / 6) ** 2;
          if (d < 0.55 || (d < 0.85 && bayer(x + i, y + j) < (0.85 - d) / 0.3)) S.put(x + i, y + j, lit);
        }
      }
      const [ox, oy] = rng.pick([[3, 3], [T - 5, 3], [3, T - 5], [T - 5, T - 5]] as const);
      S.rect(x + ox, y + oy, 3, 3, face(alt));
      S.put(x + ox, y + oy, f(6));
      S.put(x + ox + 1, y + oy, f(5));
      S.put(x + ox, y + oy + 1, f(5));
      S.put(x + ox + 1, y + oy + 1, f(alt ? 2 : 1));
      break;
    }
    case 'patched': {
      // A newer plate screwed on top: a little lighter, its own bevel and dark edge, four screws,
      // and rust creeping out from under one side.
      const px = x + 4;
      const py = y + 4;
      const w = T - 8;
      S.rect(px, py, w, w, mix(face(alt), F[2]!, 0.35));
      for (let k = 0; k < w; k++) {
        S.put(px + k, py, f(1));
        S.put(px, py + k, f(1));
        S.put(px + k, py + w - 1, f(4));
        S.put(px + w - 1, py + k, f(4));
        S.put(px + k + 1, py + w, f(6));
        S.put(px + w, py + k + 1, f(6));
      }
      S.put(px, py, f(0));
      for (const [ox, oy] of [[2, 2], [w - 3, 2], [2, w - 3], [w - 3, w - 3]] as const) {
        S.put(px + ox, py + oy, AC[2]!);
        S.put(px + ox + 1, py + oy + 1, f(6));
      }
      const side = rng.int(0, 1);
      for (let k = 0; k < 5; k++) {
        const t = rng.int(3, w - 4);
        const c = OX[rng.int(2, 3)]!;
        if (side === 0) S.put(px + t, py + w + 1, c);
        else S.put(px + w + 1, py + t, c);
      }
      break;
    }
    case 'grate': {
      // A drain grate: a bevelled frame, the pit almost ink, bars lit on top with their shadow on
      // the pit, and a coin down there that nobody will ever get back.
      const gx = x + 3;
      const gy = y + 5;
      const gw = T - 6;
      const gh = T - 10;
      for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) S.put(gx + i, gy + j, mix(f(6), INK, 0.6));
      S.put(gx + 4 + rng.int(0, 2) * 3, gy + gh - 3, MATERIALS.laton[1]!);
      for (let i = gx + 2; i < gx + gw - 1; i += 3) {
        for (let j = 1; j < gh - 1; j++) {
          S.put(i, gy + j, f(3));
          S.put(i + 1, gy + j, f(5));
        }
        S.put(i, gy + 1, f(1));
        S.put(i, gy + gh - 1, mix(f(6), INK, 0.3));
      }
      for (let i = -1; i <= gw; i++) {
        S.put(gx + i, gy - 1, f(1));
        S.put(gx + i, gy + gh, f(4));
      }
      for (let j = -1; j <= gh; j++) {
        S.put(gx - 1, gy + j, f(1));
        S.put(gx + gw, gy + j, f(4));
      }
      S.put(gx - 1, gy + gh, f(3));
      break;
    }
    case 'checker': {
      // Diamond (tread) plate: little raised lozenges, two pixels lit and one in shadow, in
      // staggered rows. Inside the plate's bevel only.
      for (let j = 4; j < T - 3; j += 4) {
        for (let i = 3 + (((j - 4) >> 2) % 2) * 3; i < T - 4; i += 6) {
          S.put(x + i, y + j + 1, f(2));
          S.put(x + i + 1, y + j, f(1));
          S.put(x + i + 1, y + j + 1, f(3));
          S.put(x + i + 2, y + j + 1, f(4));
        }
      }
      break;
    }
    default:
  }
}

/**
 * A tile of the side or front wall's top: concrete blocks,
 * 12 px courses, staggered, each block bevelled (lit top and left, shadowed bottom and right),
 * flat in between with a few pores. Darker than the floor: the room reads as a pit.
 */
export function wallTop(S: Canvas, rng: Rng, x: number, y: number): void {
  for (let j = 0; j < T; j++) {
    for (let i = 0; i < T; i++) {
      const gx = x + i;
      const gy = y + j;
      // Block coordinates: 24 × 12 blocks, every other course shifted half a block.
      const course = Math.floor(gy / 12);
      const bx = (gx + (course % 2) * 12) % 24;
      const by = gy % 12;
      let t = 4;
      if (by === 0 || bx === 0) t = 6;
      else if (by === 1 || bx === 1) t = 3;
      else if (by === 11 || bx === 23) t = 5;
      S.put(gx, gy, m(t));
    }
  }
  for (let k = 0; k < 4; k++) {
    const px = x + rng.int(2, T - 3);
    const py = y + rng.int(2, T - 3);
    if (S.get(px, py)[0] === m(4)[0]) S.put(px, py, m(rng.chance(0.5) ? 5 : 3));
  }
}

/** The hazard tape's two colours: a worn, faded yellow (never as bright as the bullets) and the wall's shadow. */
export const TAPE_YELLOW = mix(A[2]!, F[4]!, 0.42);
const TAPE_YELLOW_LIT = mix(A[1]!, F[4]!, 0.45);
const TAPE_DARK = M[6]!;

/**
 * Hazard tape over (x, y, w, h), diagonal stripes 4 px wide. The paint has worn off in chips
 * (more where the trolleys bump into it) and the edge towards the light is a pixel brighter.
 */
export function tape(S: Canvas, x: number, y: number, w: number, h: number): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const yellow = Math.floor((i + j) / 4) % 2 === 0;
      let c = yellow ? TAPE_YELLOW : TAPE_DARK;
      // Chips: some yellow gone to the concrete below, by an ordered pattern so it never flickers.
      if (yellow && bayer(i * 3 + 1, j * 5 + 2) < 0.12) c = m(4);
      // The stripe's leading edge catches the light.
      else if (yellow && Math.floor((i + j - 1) / 4) % 2 === 1) c = TAPE_YELLOW_LIT;
      S.put(i, j, c);
    }
  }
}

/**
 * A steel corner guard (5 × 5) where the tape turns a corner, so the corners read: a lit edge, a
 * dark one and a screw. `sx`, `sy`: which way the corner opens towards the floor (±1).
 */
export function cornerGuard(S: Canvas, x: number, y: number, sx: number, sy: number): void {
  for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) S.put(x + i, y + j, AC[4]!);
  for (let k = 0; k < 5; k++) {
    S.put(x + k, y, AC[3]!);
    S.put(x, y + k, AC[3]!);
    S.put(x + k, y + 4, AC[5]!);
    S.put(x + 4, y + k, AC[5]!);
  }
  S.put(x, y, AC[2]!);
  S.put(x + 2 - sx, y + 2 - sy, AC[1]!);
  S.put(x + 3 - sx, y + 3 - sy, AC[6]!);
}

/** A vertical conduit on a side wall at x (3 px wide), from y0 to y1, round: lit on its left. */
export function conduit(S: Canvas, x: number, y0: number, y1: number, skip: (y: number) => boolean): void {
  for (let y = y0; y < y1; y++) {
    if (skip(y)) continue;
    S.put(x, y, AC[3]!);
    S.put(x + 1, y, AC[4]!);
    S.put(x + 2, y, AC[6]!);
    S.put(x + 3, y, m(6));
    if (y % 36 === 0) {
      // A bracket: a strap round the pipe, screwed into the blocks on both sides.
      for (let i = -1; i < 4; i++) S.put(x + i, y, i < 1 ? AC[2]! : AC[4]!);
      for (let i = -1; i < 4; i++) S.put(x + i, y + 1, AC[5]!);
      S.put(x - 1, y, AC[1]!);
    }
  }
}

/** A vent in the front wall (18 × 8): bevelled steel frame, slats lit on top, dark behind. */
export function vent(S: Canvas, x: number, y: number): void {
  for (let j = 0; j < 8; j++) for (let i = 0; i < 18; i++) S.put(x + i, y + j, mix(m(6), INK, 0.4));
  for (let j = 1; j < 7; j += 2) {
    for (let i = 1; i < 17; i++) {
      S.put(x + i, y + j, AC[4]!);
      S.put(x + i, y + j + 1, AC[6]!);
    }
    S.put(x + 1, y + j, AC[3]!);
  }
  for (let i = 0; i < 18; i++) {
    S.put(x + i, y, AC[3]!);
    S.put(x + i, y + 7, AC[5]!);
  }
  for (let j = 0; j < 8; j++) {
    S.put(x, y + j, AC[3]!);
    S.put(x + 17, y + j, AC[5]!);
  }
}

/**
 * The walls' shadow on the floor (long under the back wall, short beside the side walls, a strip
 * along the front wall), in three bands with a dither on the seams, towards the floor's deepest
 * violet instead of black. `isFloor` keeps it off walls and shelving.
 */
export function wallShadow(S: Canvas, x0: number, y0: number, x1: number, y1: number, isFloor: (x: number, y: number) => boolean): void {
  const deep = mix(F[6]!, INK, 0.35);
  const shadeAt = (x: number, y: number, a: number): void => {
    if (a <= 0 || !isFloor(x, y)) return;
    // Quantise to three steps; the ordered dither decides the pixels between two of them.
    const q = Math.max(0, Math.min(3, step(a * 3, x, y)));
    if (q === 0) return;
    S.put(x, y, mix(S.get(x, y), deep, [0, 0.22, 0.42, 0.6][q]!));
  };
  const BACK = 15;
  const SIDE = 7;
  for (let x = x0; x < x1; x++) {
    for (let j = 0; j < BACK; j++) shadeAt(x, y0 + j, (1 - j / BACK) ** 1.4);
    for (let j = 0; j < 3; j++) shadeAt(x, y1 - 1 - j, 0.45 * (1 - j / 3));
  }
  for (let y = y0 + BACK; y < y1; y++) {
    for (let i = 0; i < SIDE; i++) {
      const a = 0.62 * (1 - i / SIDE) ** 1.2;
      shadeAt(x0 + i, y, a);
      shadeAt(x1 - 1 - i, y, a);
    }
  }
  // Where the back shadow is already there, the side one only adds what is missing.
  for (let y = y0; y < y0 + BACK; y++) {
    for (let i = 0; i < SIDE; i++) {
      const a = 0.62 * (1 - i / SIDE) ** 1.2 - (1 - (y - y0) / BACK) ** 1.4;
      shadeAt(x0 + i, y, a);
      shadeAt(x1 - 1 - i, y, a);
    }
  }
}

/**
 * A lamp's pool of warm light on the floor, centred at (cx, cy) with radii (rx, ry): three rings,
 * each a step brighter. Hard edges: the steps are small, and dithered seams drew dotted circles
 * all over the room. `strength` is the brightest mix towards the light
 * (0–1); `inside` keeps it on the floor.
 */
export function lightPool(S: Canvas, cx: number, cy: number, rx: number, ry: number, strength: number, glow: readonly [number, number, number], inside: (x: number, y: number) => boolean): void {
  const light: RGBA = [glow[0], glow[1], glow[2], 255];
  for (let y = Math.round(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.round(cx - rx); x <= cx + rx; x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1 || !inside(x, y)) continue;
      const q = Math.max(0, Math.min(3, step((1 - d) * 3, x, y, 0)));
      if (q === 0) continue;
      S.put(x, y, mix(S.get(x, y), light, (strength * q) / 3));
    }
  }
}
