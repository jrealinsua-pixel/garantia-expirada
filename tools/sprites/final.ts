// The true ending (M12 (5)): what the Servicio Técnico does with the toaster once the Trituradora
// has fallen. The refurbished box (its back, its front open and closed, with a cellophane window so
// whichever product is inside shows through), the green «Reacondicionado» sticker, the nitrile glove
// that swaps the heating element, the spray bar of the wash, and the warehouse shelf of floor 1 where
// it ends up, at the price of a new one.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { CARD, DSTEEL, GLOW, GLOW2, K, RED, STEEL, WHITE, YEL, box, cube, ellipse, outline, ramp } from '../../src/art/lib.ts';

/** The box, a size up from the shop's (the toaster, 40x41, fits inside). */
export const BOX_W = 60;
export const BOX_H = 60;
/** Where the product's sprite goes inside the box (its top-left, in box pixels). */
export const BOX_SLOT = { x: 14, y: 12 } as const;
/** Frames of the box sheet, in order. */
export const BOX_FRAMES = ['fondo', 'abierta', 'cerrada', 'fondo-cerrada'] as const;

/** Clean new cardboard: lighter and yellower than the warehouse's battered boxes. */
const KRAFT = ramp('#ecd2a0', '#cfa66a', '#a07a46', '#6e5030');
const KRAFT_SIDE = ramp('#b58c56', '#94703f', '#74552e', '#4e3820');
const KRAFT_TOP = ramp('#f6e2b8', '#e2c08a', '#c49a5e', '#94703f');
/** The inside: unprinted, in shadow. */
const INSIDE = ramp('#8a6a40', '#6e5232', '#523c24', '#3a2a18');
/** The Servicio Técnico's green (the «APTO» stickers, the workshop's stripes). */
const WS = ramp('#a8e6a0', '#58b45a', '#3a8a46', '#245a30');
/** Nitrile, the Trituradora's gloves. */
const NITRILE = ramp('#9ad4f4', '#5aa6e0', '#3a78b4', '#24507e');
/** Packing tape. */
const TAPE: RGBA = hx('#c89a52', 230);
const TAPE_HI: RGBA = hx('#e8c27e', 230);

// Box geometry: front face on the right, the side face on the left, the top a parallelogram.
const BX = 2;
const BY = 10;
const BW = 54;
const BH = 48;
const SW = 12;
const TH = 8;

/** The cellophane window on the front face (box pixels). */
const WIN = { x: BX + SW + 6, y: BY + TH + 4, w: 28, h: 24 } as const;

function frontPrint(cv: Canvas): void {
  // The brand stripe along the bottom of the front: Rojo Oferta, as on every Megamarket box.
  cv.rect(BX + SW, BY + BH - 9, BW - SW - 1, 4, RED[1]!);
  cv.rect(BX + SW, BY + BH - 9, BW - SW - 1, 1, RED[0]!);
  cv.rect(BX + SW, BY + BH - 6, BW - SW - 1, 1, RED[2]!);
  // A row of tiny «features» bullets under the window (unreadable on purpose).
  for (let x = WIN.x; x < WIN.x + WIN.w; x += 4) cv.rect(x, WIN.y + WIN.h + 3, 2, 1, KRAFT[3]!);
  // The window's printed frame.
  cv.rect(WIN.x - 1, WIN.y - 1, WIN.w + 2, 1, KRAFT[3]!);
  cv.rect(WIN.x - 1, WIN.y + WIN.h, WIN.w + 2, 1, KRAFT[0]!);
  cv.rect(WIN.x - 1, WIN.y - 1, 1, WIN.h + 2, KRAFT[3]!);
  cv.rect(WIN.x + WIN.w, WIN.y - 1, 1, WIN.h + 2, KRAFT[0]!);
}

function sidePrint(cv: Canvas): void {
  // «This side up», two arrows on the side face...
  for (const ax of [BX + 3, BX + 7]) {
    const ay = BY + TH + 5;
    cv.set(ax + 1, ay, K);
    cv.rect(ax, ay + 1, 3, 1, K);
    cv.rect(ax + 1, ay + 2, 1, 4, K);
  }
  // ...and the «fragile» wine glass, cracked.
  const gx = BX + 4;
  const gy = BY + TH + 15;
  cv.rect(gx, gy, 5, 1, K);
  cv.set(gx, gy + 1, K);
  cv.set(gx + 4, gy + 1, K);
  cv.rect(gx + 1, gy + 2, 3, 1, K);
  cv.rect(gx + 2, gy + 3, 1, 3, K);
  cv.rect(gx + 1, gy + 6, 3, 1, K);
  cv.set(gx + 3, gy + 1, KRAFT_SIDE[0]!);
  cv.set(gx + 2, gy + 1, K);
  // A barcode near the bottom.
  for (let i = 0; i < 8; i++) if (i % 3 !== 1) cv.rect(BX + 2 + i, BY + BH - 10, 1, 6, K);
  cv.rect(BX + 2, BY + BH - 10, 8, 6, hx('#f4f1e8', 60));
}

/** The cellophane: mostly see-through, a faint cold tint and two diagonal glints. */
function cellophane(cv: Canvas): void {
  for (let y = WIN.y; y < WIN.y + WIN.h; y++) for (let x = WIN.x; x < WIN.x + WIN.w; x++) cv.put(x, y, hx('#cfe8f0', 34));
  for (let i = 0; i < 9; i++) {
    cv.put(WIN.x + 3 + i, WIN.y + 10 - i, hx('#ffffff', 150));
    cv.put(WIN.x + 4 + i, WIN.y + 10 - i, hx('#ffffff', 90));
  }
  for (let i = 0; i < 5; i++) cv.put(WIN.x + 18 + i, WIN.y + WIN.h - 2 - i, hx('#ffffff', 120));
}

/** Frame 0: what is behind the product: the inside of the box and (open) its back flap standing up. */
function makeBack(flap: boolean): Canvas {
  const cv = new Canvas(BOX_W, BOX_H);
  // The back flap, standing up behind the opening, a little tilted back.
  if (flap) for (let j = 0; j < 9; j++) cv.rect(BX + 4 + Math.floor(j / 3), BY - 8 + j, BW - 8, 1, j === 0 ? KRAFT[0]! : KRAFT[2]!);
  // The inside: the back wall (lit a little from the opening) and the floor in shadow.
  cv.rect(BX + 4, BY + 1, BW - 6, BH - 6, INSIDE[1]!);
  cv.rect(BX + 4, BY + 1, BW - 6, 2, INSIDE[0]!);
  cv.rect(BX + 4, BY + BH - 14, BW - 6, 9, INSIDE[2]!);
  // Corrugation showing on the cut edge of the back wall.
  for (let x = BX + 5; x < BX + BW - 3; x += 2) cv.set(x, BY + 1, KRAFT[0]!);
  return outline(cv);
}

/** The front: side, front and (closed) top, with the window cut out; open, the flaps lie out to the sides. */
function makeFront(closed: boolean): Canvas {
  const cv = new Canvas(BOX_W, BOX_H);
  cube(cv, BX, BY, BW, BH, SW, TH, KRAFT, KRAFT_SIDE, KRAFT_TOP);
  frontPrint(cv);
  sidePrint(cv);
  if (closed) {
    // The two top flaps meeting in the middle, and the tape over the seam and down the front.
    const mid = BY + Math.floor(TH / 2);
    for (let x = BX + 3; x < BX + BW - 1; x++) cv.set(x, mid, KRAFT_TOP[2]!);
    for (let j = 0; j < TH; j++) {
      const off = Math.floor((TH - j) / 2);
      cv.rect(BX + SW + 10 + off, BY + j, 7, 1, j % 3 === 0 ? TAPE_HI : TAPE);
    }
    cv.rect(BX + SW + 10, BY + TH, 7, 6, TAPE);
    cv.rect(BX + SW + 10, BY + TH, 7, 1, TAPE_HI);
  } else {
    // Open: the top face is the opening (the back of the box shows through, frame 0)...
    for (let j = 1; j < TH; j++) {
      const off = Math.floor((TH - j) / 2);
      for (let x = BX + off + 2; x < BX + BW - 2; x++) cv.put(x, BY + j, [0, 0, 0, 0]);
    }
    // ...the front flap hanging down over the front, and the side flap out to the left.
    cv.rect(BX + SW + 2, BY + TH - 1, BW - SW - 4, 2, KRAFT_TOP[3]!);
    for (let j = 0; j < 7; j++) cv.rect(BX - Math.min(2, j), BY + 1 + j, 3, 1, KRAFT_SIDE[j < 2 ? 0 : 1]!);
  }
  // The window: cut out of the front, with the cellophane in it.
  for (let y = WIN.y; y < WIN.y + WIN.h; y++) for (let x = WIN.x; x < WIN.x + WIN.w; x++) cv.put(x, y, [0, 0, 0, 0]);
  const out = outline(cv);
  cellophane(out);
  return out;
}

/** The refurbished box: back, front open, front closed, and the back once closed (no flap). 60x60 each. */
export function makeEndingBox(): Canvas[] {
  return [makeBack(true), makeFront(false), makeFront(true), makeBack(false)];
}

/**
 * The green sticker slapped on the closed box: «REACONDICIONADO · Como nuevo», the tick of the
 * Servicio Técnico, and a corner already peeling. 26x14 (the words are written over it by the scene).
 */
export function makeEndingSticker(): Canvas {
  const cv = new Canvas(26, 14);
  box(cv, 1, 1, 24, 12, WS);
  cv.rect(2, 2, 22, 1, WS[0]!);
  // The tick in a white circle on the left.
  ellipse(cv, 6, 7, 3.2, 3.2, WHITE);
  for (const [x, y] of [[4, 7], [5, 8], [6, 9], [7, 8], [8, 7], [9, 6]] as const) cv.set(x, y, WS[2]!);
  // Two lines of white «text».
  cv.rect(11, 4, 12, 2, WHITE);
  cv.rect(11, 8, 9, 1, hx('#e2f4dc'));
  cv.rect(11, 10, 7, 1, hx('#e2f4dc'));
  // The peeling corner, showing its white back.
  cv.put(24, 1, [0, 0, 0, 0]);
  cv.set(23, 2, hx('#f4f1e8'));
  cv.set(24, 2, hx('#d6cdb2'));
  return outline(cv);
}

/**
 * The glove that swaps the heating element: a big nitrile hand coming in from the right, fingers
 * pinched round the element. Frame 0 holds the old one (burnt black, a crumb of toast still on it),
 * frame 1 the replacement (thinner, shinier, «of equal or lesser quality»). 34x24.
 */
export function makeEndingGlove(): Canvas[] {
  return [0, 1].map((f) => {
    const cv = new Canvas(34, 24);
    // The element hangs below the pinch: a zigzag coil on a mica card.
    const card = f === 0 ? ramp('#5a4a3a', '#3e3226', '#2a2018', '#1a140e') : ramp('#e8e2d0', '#cfc6ad', '#a89f86', '#756e5a');
    box(cv, 3, 8, 6, 15, card);
    const coil = f === 0 ? hx('#24160c') : GLOW;
    for (let y = 9; y < 22; y++) cv.set(y % 4 < 2 ? 4 : 7, y, coil);
    for (let y = 9; y < 22; y += 2) cv.rect(4, y, 4, 1, f === 0 ? hx('#3e2616') : GLOW2);
    if (f === 0) {
      // Burnt: a toast crumb and a wisp of soot.
      cv.rect(8, 17, 2, 2, hx('#5c3a22'));
      cv.set(2, 13, hx('#24160c'));
    } else {
      // Shiny new: a glint, and the price sticker it came with.
      cv.set(4, 10, WHITE);
      cv.rect(3, 20, 3, 2, YEL[1]!);
    }
    // The hand: a round palm off to the right, the thumb over the card's top edge and three
    // curled fingers in front of it, then the glove's cuff and a white sleeve.
    ellipse(cv, 16, 9, 6.5, 6, NITRILE[1]!);
    ellipse(cv, 15, 7, 4.5, 3.5, NITRILE[0]!);
    ellipse(cv, 17, 12, 5, 2.5, NITRILE[2]!);
    ellipse(cv, 9, 4, 3.5, 2.2, NITRILE[1]!);
    cv.rect(7, 3, 3, 1, NITRILE[0]!);
    for (const fy of [7, 10, 13]) {
      box(cv, 7, fy, 6, 3, NITRILE);
      cv.set(7, fy + 1, NITRILE[2]!);
    }
    box(cv, 21, 3, 4, 12, NITRILE);
    box(cv, 24, 4, 10, 10, ramp('#f4f1e8', '#d6dce8', '#a8b0c4', '#7a8298'));
    cv.rect(25, 6, 8, 1, hx('#b7bed0'));
    return outline(cv);
  });
}

/** The spray bar of the wash: a steel pipe with five nozzles and its hose. 96x12. */
export function makeEndingSprayBar(): Canvas {
  const cv = new Canvas(96, 12);
  // The hose coming in from the right, red rubber.
  cv.rect(84, 2, 12, 3, RED[2]!);
  cv.rect(84, 2, 12, 1, RED[1]!);
  box(cv, 80, 1, 5, 6, DSTEEL);
  box(cv, 4, 2, 78, 5, STEEL);
  cv.rect(5, 3, 76, 1, STEEL[0]!);
  for (let i = 0; i < 5; i++) {
    const x = 10 + i * 16;
    box(cv, x, 6, 4, 4, DSTEEL);
    cv.set(x + 1, 9, K);
    cv.set(x + 2, 9, K);
  }
  // A drip of soap under the last nozzle and the green «APTO» sticker on the pipe.
  cv.rect(72, 3, 4, 3, WS[1]!);
  cv.set(73, 4, WHITE);
  return outline(cv);
}

/** Pallet racking: blue uprights, orange beams. */
const RACK = ramp('#7aa6e0', '#4a76b4', '#30528a', '#1e3460');
const BEAM = ramp('#ffb347', '#e07a2a', '#a8521c', '#5a2a10');

/** Another product's box on the shelf: the same kraft, a coloured band and a grey shape in its window. */
function otherBox(cv: Canvas, x: number, y: number, w: number, h: number, band: RGBA, seed: number): void {
  const sw = Math.max(5, Math.floor(w / 4));
  cube(cv, x, y, w, h, sw, 5, KRAFT, KRAFT_SIDE, KRAFT_TOP);
  cv.rect(x + sw, y + h - 6, w - sw - 1, 3, band);
  const ww = w - sw - 6;
  const wh = Math.floor((h - 5) * 0.45);
  cv.rect(x + sw + 3, y + 8, ww, wh, INSIDE[2]!);
  // What is inside: a refurbished something, grey, with its green dot.
  cv.rect(x + sw + 5, y + 10 + (seed % 2), ww - 4, wh - 3, STEEL[2 + (seed % 2)]!);
  cv.set(x + sw + ww, y + 10, WS[1]!);
  cv.rect(x + sw + 3, y + 8, 2, 1, hx('#ffffff', 140));
}

export const SHELF_W = 236;
export const SHELF_H = 132;
/** Where the toaster's box stands on the shelf: the gap on the middle beam (its bottom-centre). */
export const SHELF_SLOT = { x: 118, y: 108 } as const;

/**
 * The shelf of floor 1 where the box ends up: two bays of pallet racking, other refurbished boxes
 * on both beams, a gap in the middle of the bottom one for the toaster's, and the red «Reacondicionados»
 * header card (written over by the scene). 236x132.
 */
export function makeEndingShelf(): Canvas {
  const cv = new Canvas(SHELF_W, SHELF_H);
  const beams = [52, 108];
  // Uprights with their punched holes.
  for (const x of [4, 116, 226]) {
    box(cv, x, 6, 6, SHELF_H - 6, RACK);
    for (let y = 12; y < SHELF_H - 4; y += 6) cv.set(x + 3, y, RACK[3]!);
  }
  // The other products, before the beams (they stand on them).
  const bands = [RED[1]!, hx('#5f93d4'), YEL[1]!, hx('#e88fa4'), hx('#69dbd8')];
  let n = 0;
  for (const by of beams) {
    let x = 12;
    while (x < 222) {
      const w = 26 + ((n * 7) % 12);
      const h = 30 + ((n * 5) % 12);
      // The gap for the toaster's box in the middle of the bottom beam.
      const gap = by === beams[1] && x + w > SHELF_SLOT.x - 34 && x < SHELF_SLOT.x + 34;
      if (gap) {
        x = SHELF_SLOT.x + 34;
        continue;
      }
      if (x + w > 224) break;
      if (!(x < 122 && x + w > 114)) otherBox(cv, x, by - h, w, h, bands[n % bands.length]!, n);
      x += w + 2;
      n++;
    }
  }
  // The beams.
  for (const by of beams) {
    box(cv, 2, by, SHELF_W - 4, 6, BEAM);
    cv.rect(3, by + 1, SHELF_W - 6, 1, BEAM[0]!);
  }
  // The header card on top: Rojo Oferta, hung from the top beam (the scene writes on it).
  box(cv, 74, 0, 88, 12, RED);
  cv.rect(75, 1, 86, 1, RED[0]!);
  // The price-tag rail along the bottom beam's front (the scene hangs the tag from it).
  cv.rect(6, 114, SHELF_W - 12, 1, CARD[3]!);
  const out = outline(cv);
  // Floor shadow under the uprights.
  for (const x of [4, 116, 226]) out.rect(x - 1, SHELF_H - 1, 8, 1, hx('#0e0c16', 120));
  return out;
}

