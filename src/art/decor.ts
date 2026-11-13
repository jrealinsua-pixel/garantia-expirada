// Floor decoration by floor (M14b (h11b), the human's note of 2026-11-13: «los escenarios son
// pésimos, necesito más detalles, más decoración»). What the room painter (src/art/room.ts) puts on
// top of the tiles so a room tells you which floor of the store you are on:
//
// - the contact shadow of the walls on the floor (the back wall is tall: its shadow is long);
// - clutter piled in the corners (two or three pieces of the floor's own junk);
// - odd pieces left along the walls.
//
// Everything here is decoration, painted into the room's background: nothing collides. So every
// piece is low (lying on the floor, at most a knee high), a little darker and less saturated than
// the props you can use (src/data/props.ts: boxes, barrels, tables), and never in the bullets'
// colours (bright red, cyan), so it is never mistaken for something that blocks or hurts.
//
// Floor 1, the warehouse: flattened boxes, pallets, packing peanuts, rolls of stretch film.
// Floor 2, Informática: tangles of cable, stacks of circuit boards, mice, a crate of keyboards.
// Floor 3, Juguetería: spilled building blocks, a deflated ball, a toy car on its back, a lost puzzle.
// Floor 4, Oficinas: reams of paper, a binder that fell, a dead plant, the box of personal effects.
// Floor 5, Atención al Cliente: stacks of complaint forms, the wet-floor sign, a bin of queue tickets.
// Floor 6, the workshop: a crate of spare parts, oily rags, a fan with no blades, a toolbox.
import { Rng } from '../sim/rng.ts';
import { Canvas, hx } from './canvas.ts';
import { BROWN, CARD, CREAM, DSTEEL, K, outline, ramp, STEEL, type Ramp } from './lib.ts';

/** How much darker than full colour a decoration piece is drawn (props are drawn at 1). */
export const DECOR_DIM = 0.86;
/** Saturation kept (the rest goes to grey). */
export const DECOR_SAT = 0.9;

export interface Piece {
  canvas: Canvas;
  /** Its name, for the room's feature list (tests). */
  name: string;
}

/** Dims and greys a finished (outlined) piece so it sits in the background. */
function settle(cv: Canvas): Canvas {
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) {
      const c = cv.get(x, y);
      if (c[3] === 0) continue;
      const g = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
      const f = (v: number): number => Math.max(0, Math.min(255, Math.round((g + (v - g) * DECOR_SAT) * DECOR_DIM)));
      cv.p[y]![x] = [f(c[0]), f(c[1]), f(c[2]), c[3]];
    }
  }
  return cv;
}

/** Draws a piece on a canvas with a 1 px margin, outlines and settles it. */
function piece(name: string, w: number, h: number, draw: (c: Canvas) => void): Piece {
  const c = new Canvas(w + 2, h + 2);
  const inner = new Canvas(w, h);
  draw(inner);
  c.blit(inner, 1, 1);
  return { name, canvas: settle(outline(c)) };
}

// ---- Floor 1: the warehouse -------------------------------------------------------------------

/** A cardboard box somebody flattened and left there, with its strip of tape. */
function flatBox(rng: Rng): Piece {
  const w = rng.int(12, 16);
  const h = rng.int(7, 9);
  return piece('carton-plano', w, h, (c) => {
    c.rect(0, 0, w, h, CARD[1]!);
    c.rect(0, 0, w, 1, CARD[0]!);
    c.rect(0, h - 1, w, 1, CARD[2]!);
    // The fold lines of the flaps.
    const f = rng.int(3, w - 4);
    c.rect(f, 0, 1, h, CARD[2]!);
    c.rect(0, Math.floor(h / 2), w, 1, CARD[2]!);
    // Brown tape across, a printed arrow «this side up» that no longer means anything.
    c.rect(0, 2, w, 2, hx('#a07a44'));
    c.set(rng.int(1, f - 1 > 1 ? f - 1 : 1), h - 3, CARD[3]!);
  });
}

/** A wooden pallet seen from above: slats with gaps, sometimes with a box nobody took off it. */
function pallet(rng: Rng): Piece {
  const w = 20;
  const h = 12;
  const loaded = rng.chance(0.5);
  return piece(loaded ? 'palet-caja' : 'palet', w, h, (c) => {
    for (let x = 0; x < w; x += 4) {
      c.rect(x, 0, 3, h, BROWN[1]!);
      c.rect(x, 0, 3, 1, BROWN[0]!);
      c.rect(x + 2, 0, 1, h, BROWN[2]!);
    }
    // The three cross boards underneath show between the slats.
    for (const y of [1, 5, 10]) for (let x = 3; x < w; x += 4) c.set(x, y, BROWN[3]!);
    if (loaded) {
      // A low box on it, seen from above: lid flaps and the tape.
      const bx = rng.int(2, 6);
      c.rect(bx, 2, 11, 8, CARD[1]!);
      c.rect(bx, 2, 11, 1, CARD[0]!);
      c.rect(bx + 10, 3, 1, 7, CARD[2]!);
      c.rect(bx, 9, 11, 1, CARD[3]!);
      c.rect(bx + 5, 2, 1, 7, hx('#a07a44'));
    } else if (rng.chance(0.5)) c.rect(rng.int(0, 2) * 4, h - 4, 3, 4, [0, 0, 0, 0]); // a broken slat
  });
}

/** A heap of packing peanuts, the ones that stick to everything. */
function peanuts(rng: Rng): Piece {
  const w = 12;
  const h = 6;
  return piece('bolitas', w, h, (c) => {
    for (let i = 0; i < 22; i++) {
      const x = rng.int(0, w - 2);
      const y = rng.int(Math.abs(x - w / 2) > 4 ? 3 : 1, h - 1);
      c.rect(x, y, 2, 1, i % 3 === 0 ? CREAM[2]! : CREAM[1]!);
    }
  });
}

/** A roll of stretch film lying on its side. */
function filmRoll(): Piece {
  return piece('film', 13, 6, (c) => {
    c.rect(0, 0, 13, 6, hx('#9aa6b4'));
    c.rect(0, 0, 13, 1, hx('#cfd8e2'));
    c.rect(0, 5, 13, 1, hx('#6a7484'));
    c.rect(1, 2, 11, 1, hx('#b4c0cc'));
    // The cardboard core at the end.
    c.rect(12, 1, 1, 4, CARD[1]!);
    c.set(12, 2, CARD[3]!);
  });
}

// ---- Floor 2: Informática -----------------------------------------------------------------------

/** Cables nobody will ever untangle. */
function tangle(rng: Rng): Piece {
  const w = 14;
  const h = 8;
  const cols = [hx('#2a2a34'), hx('#4a4e5a'), hx('#c9c3b0')];
  return piece('maraña', w, h, (c) => {
    for (const col of cols) {
      let x = rng.int(1, w - 2);
      let y = rng.int(1, h - 2);
      for (let i = 0; i < 26; i++) {
        c.set(x, y, col);
        x = Math.max(0, Math.min(w - 1, x + rng.int(-1, 1)));
        y = Math.max(0, Math.min(h - 1, y + rng.int(-1, 1)));
      }
    }
    // A plug at one end.
    c.rect(w - 3, 1, 2, 2, hx('#d6cdb2'));
  });
}

/** Circuit boards stacked any old way. */
function boards(rng: Rng): Piece {
  return piece('placas', 14, 8, (c) => {
    for (let k = 0; k < 3; k++) {
      const x = rng.int(0, 3);
      const y = k * 2;
      c.rect(x, y, 10, 3, hx(k % 2 ? '#2f6b4a' : '#3a7a52'));
      c.rect(x, y, 10, 1, hx('#5a9a6a'));
      c.set(x + rng.int(1, 8), y + 1, hx('#c9a23a'));
      c.set(x + rng.int(1, 8), y + 2, hx('#1c1f2a'));
    }
  });
}

/** A mouse with its cord, belly up. */
function mouse(rng: Rng): Piece {
  return piece('raton', 11, 5, (c) => {
    c.rect(0, 1, 5, 4, hx('#b7bed0'));
    c.rect(0, 1, 5, 1, hx('#e4e8f0'));
    c.set(4, 4, hx('#5a627c'));
    c.set(2, 3, hx('#3a4058'));
    for (let x = 5; x < 11; x++) c.set(x, 2 + Math.round(Math.sin(x + rng.next()) * 1.2), hx('#2a2a34'));
  });
}

/** A plastic crate of keyboards nobody wanted. */
function keyboardCrate(): Piece {
  return piece('teclados', 15, 9, (c) => {
    c.rect(0, 2, 15, 7, hx('#3a4a6a'));
    c.rect(0, 2, 15, 1, hx('#5a6a8a'));
    for (let x = 2; x < 14; x += 3) c.rect(x, 5, 1, 3, hx('#27344e'));
    // The keyboards sticking out of the top.
    c.rect(1, 0, 13, 2, hx('#d6cdb2'));
    for (let x = 2; x < 13; x += 2) c.set(x, 0, hx('#a89f86'));
  });
}

// ---- Floor 3: Juguetería ------------------------------------------------------------------------

const BLOCK_COLS = ['#c9a23a', '#3f66a6', '#4b9a4e', '#a9566a', '#d9782a'];

/** Building blocks that came out of their box and will never go back in. */
function blocks(rng: Rng): Piece {
  return piece('bloques', 14, 8, (c) => {
    for (let i = 0; i < 6; i++) {
      const col = hx(rng.pick(BLOCK_COLS));
      const x = rng.int(0, 10);
      const y = rng.int(1, 5);
      const w = rng.chance(0.5) ? 4 : 3;
      c.rect(x, y, w, 3, col);
      c.rect(x, y, w, 1, [Math.min(255, col[0] + 40), Math.min(255, col[1] + 40), Math.min(255, col[2] + 40), 255]);
      c.set(x + 1, y, [255, 255, 255, 90]);
    }
  });
}

/** A ball that lost its air, flat on one side. */
function flatBall(): Piece {
  return piece('pelota', 11, 7, (c) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 11; x++) if (((x - 5) / 5.5) ** 2 + ((y - 4) / 3.5) ** 2 <= 1) c.set(x, y, (x + (y >> 1)) % 6 < 3 ? hx('#b8564a') : hx('#e2dcc8'));
    c.rect(2, 1, 2, 1, [255, 255, 255, 120]);
    c.rect(0, 6, 11, 1, [0, 0, 0, 0]);
  });
}

/** A toy car on its back, wheels up. */
function toyCar(): Piece {
  return piece('cochecito', 12, 6, (c) => {
    c.rect(0, 2, 12, 4, hx('#3f66a6'));
    c.rect(0, 2, 12, 1, hx('#5f93d4'));
    c.rect(3, 4, 6, 1, hx('#27447a'));
    for (const x of [1, 8]) {
      c.rect(x, 0, 3, 2, hx('#1c1f2a'));
      c.set(x + 1, 0, hx('#858ea8'));
    }
  });
}

/** A puzzle box with the lid off and two pieces outside (of the 1000, 998 are left). */
function puzzleBox(rng: Rng): Piece {
  return piece('puzle', 14, 8, (c) => {
    c.rect(0, 1, 10, 7, hx('#c9b48a'));
    c.rect(0, 1, 10, 1, hx('#e2d2a8'));
    c.rect(1, 3, 8, 4, hx('#5a8aa8'));
    c.rect(1, 5, 8, 2, hx('#4b9a4e'));
    for (const [x, y] of [[11, rng.int(1, 3)], [12, rng.int(5, 6)]] as const) c.rect(x, y, 2, 2, hx('#5a8aa8'));
  });
}

// ---- Floor 4: Oficinas --------------------------------------------------------------------------

/** Reams of paper, still in their wrapping, for a printer that has no toner. */
function reams(rng: Rng): Piece {
  const n = rng.int(2, 3);
  return piece('folios', 12, 3 * n + 1, (c) => {
    for (let k = 0; k < n; k++) {
      const x = rng.int(0, 2);
      const y = k * 3;
      c.rect(x, y, 10, 3, CREAM[0]!);
      c.rect(x, y + 2, 10, 1, CREAM[2]!);
      c.rect(x + 3, y, 3, 3, hx('#7a8aa8'));
    }
  });
}

/** A lever-arch binder that fell open: «ACTAS 2009». */
function binder(): Piece {
  return piece('archivador', 13, 7, (c) => {
    c.rect(0, 0, 6, 7, hx('#3f4f7a'));
    c.rect(7, 0, 6, 7, hx('#3f4f7a'));
    c.rect(6, 0, 1, 7, hx('#2a3450'));
    c.rect(1, 1, 4, 5, CREAM[1]!);
    c.rect(8, 1, 4, 5, CREAM[1]!);
    for (const y of [2, 4]) {
      c.rect(2, y, 2, 1, CREAM[3]!);
      c.rect(9, y, 2, 1, CREAM[3]!);
    }
    c.set(6, 3, STEEL[1]!);
  });
}

/** The office plant, dead since the last restructuring, still in its pot. */
function deadPlant(rng: Rng): Piece {
  return piece('planta-seca', 10, 11, (c) => {
    // The pot.
    c.rect(2, 6, 6, 5, hx('#6a6872'));
    c.rect(2, 6, 6, 1, hx('#8c8a94'));
    c.rect(7, 7, 1, 4, hx('#45434c'));
    // Brown leaves, drooping.
    const leaf = hx('#8a7a4a');
    const dry = hx('#6a5a34');
    c.rect(4, 2, 1, 4, dry);
    for (const [x, y] of [[1, 3], [2, 2], [6, 1], [7, 2], [8, 4], [0, 5], [3, 0]] as const) c.set(x, y, rng.chance(0.5) ? leaf : dry);
    c.rect(5, 3, 2, 1, leaf);
    c.rect(2, 4, 2, 1, leaf);
  });
}

/** The grey archive box of personal effects (the office's boxes are grey too): a mug and a photo frame. */
function effectsBox(): Piece {
  return piece('efectos-personales', 13, 10, (c) => {
    c.rect(0, 3, 13, 7, hx('#a4a2aa'));
    c.rect(0, 3, 13, 1, hx('#c4c2ca'));
    c.rect(0, 9, 13, 1, hx('#7a7882'));
    c.rect(4, 6, 5, 1, hx('#4a4852')); // the handle hole
    // The mug, the frame.
    c.rect(1, 0, 4, 3, hx('#d6cdb2'));
    c.set(5, 1, hx('#d6cdb2'));
    c.rect(7, 0, 4, 3, hx('#4a4e5a'));
    c.rect(8, 1, 2, 1, hx('#a89f86'));
  });
}

// ---- Floor 5: Atención al Cliente ---------------------------------------------------------------

/** A stack of complaint forms (in triplicate), weighed down with a stapler. */
function forms(rng: Rng): Piece {
  return piece('hojas-reclamacion', 12, 8, (c) => {
    for (let k = 0; k < 3; k++) {
      const x = rng.int(0, 3);
      c.rect(x, 2 + k * 2, 9, 2, k === 1 ? hx('#e2c86a') : hx('#e8e2d2'));
      c.set(x + 2, 3 + k * 2, hx('#8a8478'));
    }
    c.rect(3, 0, 6, 3, hx('#3a4058'));
    c.rect(3, 0, 6, 1, hx('#5d658a'));
  });
}

/** The «Suelo mojado» sign, folded and lying where it fell. The floor has been dry since 2015. */
function wetFloorSign(): Piece {
  return piece('suelo-mojado', 13, 7, (c) => {
    c.rect(0, 0, 13, 7, hx('#d9b02a'));
    c.rect(0, 0, 13, 1, hx('#f0d060'));
    c.rect(0, 6, 13, 1, hx('#a07a1c'));
    c.rect(6, 0, 1, 7, hx('#a07a1c'));
    // The little falling man, a dark triangle on each half.
    for (const x0 of [2, 9]) {
      c.set(x0, 2, K);
      c.rect(x0 - 1, 3, 2, 1, K);
      c.set(x0 + 1, 4, K);
    }
  });
}

/** A bin that overflows with queue tickets nobody's number was called for. */
function ticketBin(rng: Rng): Piece {
  return piece('papelera-turnos', 12, 10, (c) => {
    c.rect(2, 3, 8, 7, hx('#4a5468'));
    c.rect(2, 3, 8, 1, hx('#6a7488'));
    c.rect(9, 4, 1, 6, hx('#2e3446'));
    for (let i = 0; i < 9; i++) c.rect(rng.int(0, 10), rng.int(0, 3) + (i > 6 ? 6 : 0), 2, 1, i % 2 ? hx('#e8e2d2') : hx('#d6c88a'));
  });
}

// ---- Floor 6: the workshop ----------------------------------------------------------------------

/** A crate of spare parts, none of them the one you need. */
function partsCrate(rng: Rng): Piece {
  return piece('piezas', 14, 9, (c) => {
    c.rect(0, 3, 14, 6, hx('#4a5a3a'));
    c.rect(0, 3, 14, 1, hx('#6a7a52'));
    c.rect(13, 4, 1, 5, hx('#2e3a24'));
    for (let i = 0; i < 7; i++) {
      const col = rng.pick(STEEL.slice(1, 4));
      c.rect(rng.int(1, 11), rng.int(0, 3), rng.int(1, 3), 1, col);
    }
  });
}

/** Rags soaked in oil, in a heap. */
function rags(rng: Rng): Piece {
  return piece('trapos', 12, 6, (c) => {
    for (let i = 0; i < 5; i++) {
      const x = rng.int(0, 7);
      const y = rng.int(0, 3);
      c.rect(x, y, rng.int(3, 5), 3, i % 2 ? hx('#7a6a5a') : hx('#9a8a72'));
    }
    c.rect(rng.int(2, 7), 2, 2, 2, hx('#2a2622'));
  });
}

/** A fan with no blades: just the grille and the motor. */
function bladelessFan(): Piece {
  return piece('ventilador', 11, 10, (c) => {
    for (let y = 0; y < 9; y++) for (let x = 0; x < 11; x++) {
      const d = ((x - 5) / 5) ** 2 + ((y - 4) / 4) ** 2;
      if (d <= 1 && d > 0.55) c.set(x, y, (x + y) % 2 ? DSTEEL[0]! : DSTEEL[1]!);
    }
    c.rect(4, 3, 3, 3, DSTEEL[2]!);
    c.set(4, 3, DSTEEL[0]!);
    c.rect(5, 8, 1, 2, DSTEEL[2]!);
  });
}

/** A toolbox with the lid open and nothing useful inside. */
function toolbox(): Piece {
  const R: Ramp = ramp('#8aa080', '#5a7a52', '#3e5a3a', '#2a3e28');
  return piece('caja-herramientas', 14, 8, (c) => {
    c.rect(0, 2, 14, 6, R[1]!);
    c.rect(0, 2, 14, 1, R[0]!);
    c.rect(0, 7, 14, 1, R[2]!);
    c.rect(4, 0, 6, 2, R[2]!);
    c.rect(5, 1, 4, 1, [0, 0, 0, 0]);
    c.rect(2, 4, 10, 1, R[3]!);
  });
}

type Maker = (rng: Rng) => Piece;

/** The junk of each floor (index: level - 1; level 6 and up share the workshop's). */
const JUNK: readonly (readonly Maker[])[] = [
  [flatBox, pallet, peanuts, filmRoll],
  [tangle, boards, mouse, keyboardCrate],
  [blocks, flatBall, toyCar, puzzleBox],
  [reams, binder, deadPlant, effectsBox],
  [forms, wetFloorSign, ticketBin],
  [partsCrate, rags, bladelessFan, toolbox],
];

/** A random piece of floor `level`'s junk; if it comes out as `avoid`, one more draw (no two the same side by side, most times). */
export function junk(rng: Rng, level: number, avoid?: string): Piece {
  const set = JUNK[Math.min(Math.max(level, 1), 6) - 1]!;
  const p = rng.pick(set)(rng);
  return p.name === avoid ? rng.pick(set)(rng) : p;
}

/** Names of every piece floor `level` can have (tests). */
export function junkNames(level: number): string[] {
  const set = JUNK[Math.min(Math.max(level, 1), 6) - 1]!;
  const rng = new Rng('nombres');
  return set.map((m) => m(rng).name);
}

/** Draws a piece with its soft shadow under it, its top-left corner at (x, y). */
export function putPiece(S: Canvas, p: Piece, x: number, y: number): void {
  const cv = p.canvas;
  const cx = x + cv.w / 2;
  const by = y + cv.h - 1;
  const rx = cv.w / 2 + 1;
  for (let j = -2; j <= 1; j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) if (((i - cx) / rx) ** 2 + (j / 2.2) ** 2 <= 1) S.set(i, by + j + 1, [8, 6, 16, 70]);
  S.blit(cv, x, y);
}

/**
 * The walls' contact shadow on the floor: long under the back wall (it is the tall one), short
 * along the sides and the front wall. `isFloor` says which pixels are floor (only those darken).
 */
export function wallShadow(S: Canvas, x0: number, y0: number, x1: number, y1: number, isFloor: (x: number, y: number) => boolean): void {
  // Multiplied, not blended with a dark colour: the floor keeps its hue (each floor has its own).
  const shadeAt = (x: number, y: number, a: number): void => {
    if (a <= 0 || !isFloor(x, y)) return;
    const c = S.get(x, y);
    const k = 1 - a / 255;
    S.put(x, y, [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k), c[3]]);
  };
  const BACK = 14;
  const SIDE = 6;
  for (let x = x0; x < x1; x++) {
    for (let j = 0; j < BACK; j++) shadeAt(x, y0 + j, 120 * (1 - j / BACK) ** 1.6);
    for (let j = 0; j < 3; j++) shadeAt(x, y1 - 1 - j, 50 * (1 - j / 3));
  }
  for (let y = y0; y < y1; y++) {
    for (let i = 0; i < SIDE; i++) {
      const a = 70 * (1 - i / SIDE) ** 1.3;
      shadeAt(x0 + i, y, a);
      shadeAt(x1 - 1 - i, y, a);
    }
  }
}

