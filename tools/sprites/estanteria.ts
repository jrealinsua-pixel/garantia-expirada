// M14b (h11a2): the Estantería Inestable, a tall display rack of returns that goes over when it is
// shot enough. Standing (whole, and battered), and lying: on its side (to the right; flipped for
// the left), face down towards the camera (S), on its back away from it (N), and in a heap.
// Steel uprights, a pegboard back, and on the shelves what people brought back.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { BLUE, CARD, CREAM, DSTEEL, K, RED, RUSTR, STEEL, WHITE, YEL, box, outline, ramp } from '../../src/art/lib.ts';

/** The pegboard back: dark grey-brown hardboard with its rows of holes. */
const PEG = ramp('#8a7a62', '#6b5d49', '#4f4436', '#382f25');
const MINT = ramp('#c6efd8', '#8fd1ad', '#5fa383', '#3d6e57');

/** Standing frame size, and where its feet are (bottom-centre). */
export const SHELF_W = 26;
export const SHELF_H = 50;

function pegboard(cv: Canvas, x: number, y: number, w: number, h: number): void {
  cv.rect(x, y, w, h, PEG[2]!);
  for (let yy = y + 1; yy < y + h; yy += 3) for (let xx = x + 1 + ((yy - y) % 2); xx < x + w; xx += 3) cv.set(xx, yy, PEG[3]!);
}

/** A price tag hanging off a shelf's front edge. */
function tag(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 3, 2, YEL[1]!);
  cv.set(x, y, YEL[0]!);
  cv.set(x + 2, y + 1, YEL[2]!);
}

/** Small things for the shelves (x, y is their bottom-left). */
const GOODS = {
  /** A cardboard box, `w` × `h`. */
  carton(cv: Canvas, x: number, y: number, w: number, h: number): void {
    box(cv, x, y - h, w, h, CARD);
    cv.rect(x + Math.floor(w / 2), y - h, 1, h, CARD[0]!);
  },
  /** A red kettle, spout to the right. */
  kettle(cv: Canvas, x: number, y: number): void {
    box(cv, x, y - 6, 5, 6, RED);
    cv.rect(x + 1, y - 7, 3, 1, K);
    cv.set(x + 5, y - 4, RED[2]!);
    cv.set(x + 6, y - 5, RED[2]!);
  },
  /** A mint blender jug. */
  jug(cv: Canvas, x: number, y: number): void {
    box(cv, x, y - 8, 4, 6, MINT);
    cv.rect(x, y - 2, 4, 2, STEEL[3]!);
    cv.rect(x + 1, y - 9, 2, 1, K);
  },
  /** A small blue radio with a dial. */
  radio(cv: Canvas, x: number, y: number): void {
    box(cv, x, y - 5, 7, 5, BLUE);
    cv.set(x + 5, y - 3, WHITE);
    cv.rect(x + 1, y - 3, 3, 1, BLUE[3]!);
    cv.set(x + 1, y - 6, STEEL[2]!);
    cv.set(x + 1, y - 7, STEEL[2]!);
  },
  /** A grey microwave, door to the left. */
  micro(cv: Canvas, x: number, y: number): void {
    box(cv, x, y - 7, 11, 7, STEEL);
    cv.rect(x + 1, y - 6, 6, 4, DSTEEL[3]!);
    cv.set(x + 2, y - 5, DSTEEL[0]!);
    cv.rect(x + 8, y - 6, 2, 1, RED[1]!);
    cv.rect(x + 8, y - 4, 2, 1, DSTEEL[2]!);
  },
  /** A cream crate with a red «devuelto» stripe. */
  crate(cv: Canvas, x: number, y: number, w: number): void {
    box(cv, x, y - 6, w, 6, CREAM);
    cv.rect(x + 1, y - 4, w - 2, 1, RED[1]!);
  },
};

/** The rack itself (uprights, cap, shelves, kick plate) over a pegboard, in a canvas of the standing size. */
function rack(cv: Canvas, ox: number, battered: boolean): number[] {
  const top = 8;
  const bottom = SHELF_H - 2;
  // The back between the uprights.
  pegboard(cv, ox + 3, top, 17, bottom - top);
  // Uprights: the left one shows its dark side, the right one its lit front.
  cv.rect(ox + 1, top - 1, 2, bottom - top + 1, DSTEEL[1]!);
  cv.rect(ox + 1, top - 1, 1, bottom - top + 1, DSTEEL[2]!);
  cv.rect(ox + 20, top - 1, 2, bottom - top + 1, STEEL[1]!);
  cv.rect(ox + 20, top - 1, 1, bottom - top + 1, STEEL[0]!);
  // The holes up the uprights.
  for (let y = top + 1; y < bottom; y += 3) {
    cv.set(ox + 2, y, DSTEEL[3]!);
    cv.set(ox + 21, y, STEEL[3]!);
  }
  // Cap.
  cv.rect(ox + 1, top - 2, 21, 2, STEEL[0]!);
  cv.rect(ox + 1, top - 1, 21, 1, STEEL[2]!);
  // Shelves: a lit top, a front lip in shadow. A battered one sags in the middle.
  const shelves = [top + 9, top + 19, top + 29, bottom - 3];
  shelves.forEach((y, i) => {
    const sag = battered && i === 1 ? 1 : 0;
    cv.rect(ox + 1, y, 21, 1, STEEL[0]!);
    cv.rect(ox + 1, y + 1, 21, 2, STEEL[2]!);
    if (sag) {
      cv.rect(ox + 7, y + 1, 9, 1, STEEL[0]!);
      cv.rect(ox + 7, y + 2, 9, 2, STEEL[2]!);
    }
  });
  // Kick plate and feet.
  cv.rect(ox + 1, bottom, 21, 2, DSTEEL[2]!);
  return shelves;
}

/**
 * Standing: frame 0 whole, with a box too many on top; frame 1 battered (the shelves sagging, a
 * box gone, the top one sliding off, a dent).
 */
export function makeShelfFrames(): Canvas[] {
  return [false, true].map((battered) => {
    const cv = new Canvas(SHELF_W, SHELF_H);
    const ox = 2;
    const [s1, s2, s3, s4] = rack(cv, ox, battered);
    // Top shelf: two boxes and the kettle.
    GOODS.carton(cv, ox + 3, s1!, 6, 6);
    GOODS.kettle(cv, ox + 11, s1!);
    if (!battered) GOODS.carton(cv, ox + 16, s1!, 4, 4);
    // Second: the blender jug and the radio (the radio slid to the edge once battered).
    GOODS.jug(cv, ox + 4, s2! + (battered ? 1 : 0));
    GOODS.radio(cv, ox + (battered ? 14 : 11), s2! + (battered ? 1 : 0));
    // Third: the crate of returns.
    GOODS.crate(cv, ox + 3, s3!, 15);
    // Bottom: the microwave.
    GOODS.micro(cv, ox + 5, s4!);
    // On top, the stack that makes it top-heavy: a big box over the edge, a small one on it.
    if (battered) {
      // Sliding off to the right, tilted.
      for (let i = 0; i < 9; i++) cv.rect(ox + 12 + i, 1 + Math.floor(i / 3), 1, 6, i === 0 ? CARD[0]! : i === 8 ? CARD[2]! : CARD[1]!);
      cv.rect(ox + 16, 2, 1, 6, CARD[0]!);
    } else {
      GOODS.carton(cv, ox + 4, 6, 14, 5);
      GOODS.carton(cv, ox + 9, 1, 7, 4);
      cv.set(ox + 14, 0, RED[1]!);
    }
    // The tags on the shelves, and the sticker on the left upright (yellow: «no apoyarse»).
    tag(cv, ox + 7, s1! + 1);
    tag(cv, ox + 15, s2! + 1);
    tag(cv, ox + 9, s3! + 1);
    cv.rect(ox + 1, 22, 2, 3, YEL[1]!);
    cv.set(ox + 1, 23, K);
    // Rust and a dent where it was knocked.
    cv.set(ox + 21, 30, RUSTR[1]!);
    cv.set(ox + 21, 31, RUSTR[2]!);
    if (battered) {
      cv.set(ox + 20, 18, STEEL[3]!);
      cv.set(ox + 21, 19, STEEL[3]!);
      cv.set(ox + 1, 36, RUSTR[1]!);
    }
    return outline(cv);
  });
}

/** Lying on its side, top to the right (flipped for the left): 50 × 22, its feet 12 px in from the left, 1 px from the bottom. */
export const FALLEN_H_W = 50;
export const FALLEN_H_H = 22;
export function makeShelfFallenSide(): Canvas {
  const cv = new Canvas(FALLEN_H_W, FALLEN_H_H);
  // The rack on its side: the lower upright along the floor, the upper one its top edge seen from above.
  const x0 = 2;
  const x1 = 44;
  const y0 = 8;
  const y1 = 18;
  pegboard(cv, x0, y0 + 2, x1 - x0, y1 - y0 - 2);
  // Shelves become cross bars, the cap at the right end, the kick plate at the left.
  for (const x of [x0 + 3, x0 + 13, x0 + 23, x0 + 33]) {
    cv.rect(x, y0, 2, y1 - y0 + 1, STEEL[2]!);
    cv.rect(x, y0, 1, y1 - y0 + 1, STEEL[0]!);
  }
  cv.rect(x0, y0, 2, y1 - y0 + 1, DSTEEL[2]!);
  cv.rect(x1, y0 - 1, 2, y1 - y0 + 2, STEEL[1]!);
  // The top upright (lit) and the bottom one (in shadow, on the floor).
  cv.rect(x0, y0, x1 - x0 + 2, 2, STEEL[0]!);
  cv.rect(x0, y0 + 1, x1 - x0 + 2, 1, STEEL[1]!);
  cv.rect(x0, y1, x1 - x0 + 2, 2, DSTEEL[1]!);
  // What stayed in: the microwave on its back, the crate, a jug.
  box(cv, x0 + 5, y0 + 3, 7, 6, STEEL);
  cv.rect(x0 + 6, y0 + 4, 4, 3, DSTEEL[3]!);
  box(cv, x0 + 16, y0 + 3, 6, 7, CREAM);
  cv.rect(x0 + 18, y0 + 4, 1, 5, RED[1]!);
  box(cv, x0 + 27, y0 + 4, 5, 4, MINT);
  // What came out at the top: the boxes tumbled past the end, the kettle on its side.
  box(cv, 43, 13, 6, 6, CARD);
  cv.rect(45, 13, 1, 6, CARD[0]!);
  box(cv, 38, 1, 8, 6, CARD);
  cv.rect(42, 1, 1, 6, CARD[0]!);
  box(cv, 46, 5, 4, 4, RED);
  cv.set(47, 4, K);
  tag(cv, 30, 19);
  return outline(cv);
}

/** Lying face down towards the camera (it went over to the south): 22 × 40, its feet 11 px in, 22 px up from the bottom. */
export const FALLEN_S_W = 22;
export const FALLEN_S_H = 40;
export function makeShelfFallenFront(): Canvas {
  const cv = new Canvas(FALLEN_S_W, FALLEN_S_H);
  // The back of it, a slab of pegboard, the kick plate at the top (where its feet were).
  pegboard(cv, 2, 3, 18, 30);
  box(cv, 2, 3, 18, 3, DSTEEL);
  // The uprights down the sides (lit on the left: from above now).
  cv.rect(1, 3, 2, 31, STEEL[1]!);
  cv.rect(1, 3, 1, 31, STEEL[0]!);
  cv.rect(19, 3, 2, 31, DSTEEL[1]!);
  // A crack across the board, and the brace.
  for (let i = 0; i < 8; i++) cv.set(6 + i, 16 + Math.floor(i / 2), PEG[3]!);
  for (let i = 0; i < 14; i++) cv.set(4 + i, 9 + i, PEG[1]!);
  // The cap, and what came out under it: boxes and the radio sticking out at the bottom.
  cv.rect(1, 32, 20, 2, STEEL[0]!);
  box(cv, 0, 34, 7, 5, CARD);
  box(cv, 9, 35, 8, 4, BLUE);
  cv.set(14, 36, WHITE);
  box(cv, 16, 33, 5, 5, CARD);
  // The «no apoyarse» sticker, upside down by now.
  cv.rect(17, 10, 2, 3, YEL[1]!);
  return outline(cv);
}

/** Lying on its back away from the camera (north): 22 × 42, its feet 11 px in, 1 px from the bottom. */
export const FALLEN_N_W = 22;
export const FALLEN_N_H = 42;
export function makeShelfFallenBack(): Canvas {
  const cv = new Canvas(FALLEN_N_W, FALLEN_N_H);
  // Seen from above, its front up: the shelves are bars across, the goods lying in between.
  pegboard(cv, 2, 7, 18, 31);
  cv.rect(1, 7, 2, 33, DSTEEL[1]!);
  cv.rect(19, 7, 2, 33, STEEL[1]!);
  cv.rect(20, 7, 1, 33, STEEL[0]!);
  for (const y of [9, 17, 25, 33]) {
    cv.rect(1, y, 20, 2, STEEL[0]!);
    cv.rect(1, y + 1, 20, 1, STEEL[2]!);
  }
  cv.rect(1, 38, 20, 2, DSTEEL[2]!);
  // In between: the crate, the jug, the microwave (lit tops: we look down on them now).
  box(cv, 4, 12, 13, 4, CREAM);
  cv.rect(5, 13, 11, 1, RED[1]!);
  box(cv, 5, 20, 4, 4, MINT);
  box(cv, 11, 20, 6, 4, BLUE);
  box(cv, 5, 28, 11, 4, STEEL);
  cv.rect(6, 29, 5, 2, DSTEEL[3]!);
  // The cap at the top, and the boxes that flew off over it.
  cv.rect(1, 6, 20, 2, STEEL[0]!);
  box(cv, 2, 0, 8, 6, CARD);
  cv.rect(5, 0, 1, 6, CARD[0]!);
  box(cv, 12, 1, 6, 5, RED);
  cv.rect(13, 0, 3, 1, K);
  return outline(cv);
}

/** In a heap where it stood (no room to fall anywhere): 30 × 20, its feet at the bottom-centre. */
export const HEAP_W = 30;
export const HEAP_H = 20;
export function makeShelfHeap(): Canvas {
  const cv = new Canvas(HEAP_W, HEAP_H);
  const bar = (x0: number, y0: number, x1: number, y1: number, c: RGBA, c2: RGBA): void => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n);
      const y = Math.round(y0 + ((y1 - y0) * i) / n);
      cv.set(x, y, c);
      cv.set(x, y + 1, c2);
    }
  };
  pegboard(cv, 4, 10, 20, 7);
  bar(2, 16, 26, 9, STEEL[0]!, STEEL[2]!);
  bar(3, 8, 27, 15, DSTEEL[1]!, DSTEEL[2]!);
  bar(6, 17, 22, 17, STEEL[1]!, DSTEEL[2]!);
  box(cv, 8, 3, 7, 6, CARD);
  cv.rect(11, 3, 1, 6, CARD[0]!);
  box(cv, 17, 6, 6, 5, STEEL);
  box(cv, 2, 11, 5, 5, RED);
  box(cv, 22, 12, 6, 5, CREAM);
  cv.rect(23, 14, 4, 1, RED[1]!);
  return outline(cv);
}
