// The Mostrador de Devoluciones (the hub between runs, docs/DISENO.md): its counter and Caja, the
// queue posts and their tape, the ticket machine, the filing cabinet, the Chatarrero, the board,
// the phone and the conveyor into the warehouse with its strip curtain and its sign.
// Props stand on their bottom-centre like the others (src/data/props.ts); the board, the phone,
// the curtain and the sign hang on the back wall.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { GLYPHS } from '../../src/art/font.ts';
import { BLUE, BROWN, CARD, CREAM, DSTEEL, GLOVE, GREEN, ICE, K, RED, RUSTR, STEEL, WHITE, YEL } from '../../src/art/lib.ts';
import { box, cube, ellipse, hand, outline, ramp } from '../../src/art/lib.ts';
import { BOARD_CARDS, TAPE_Y, WALL_BOARD_Y, WALL_PHONE_Y, WALL_SIGN_Y } from '../../src/art/hub.ts';

/** The counter's melamine front: the store's grey-blue with the red «Devoluciones» stripe. */
const FRONT = DSTEEL;
const TOP = CREAM;
/** Cork. */
const CORK = ramp('#d9a066', '#b97d48', '#8f5a32', '#633d22');
/** Old cash-register enamel: a tired mint green. */
const MINT = ramp('#cfe8d0', '#9cc7a4', '#6c9a7c', '#46695a');
const LED = hx('#ff4a3a');
/** The Caja's old green display (red eyes are for enemies). */
const VFD = hx('#7ef0a0');
/** Toast and skin for the tiny faces on the board. */
const TOAST = hx('#d9a35a');
const SKIN = hx('#e9b98f');
const LED_OFF = hx('#5a1d22');

/** Writes `s` with «Letra Pequeña» glyphs (no outline) at (x, y): y is the top of the accent rows. */
function letters(cv: Canvas, x: number, y: number, s: string, c: RGBA): void {
  let cx = x;
  for (const ch of s.toLocaleUpperCase('es-ES')) {
    if (ch === ' ') {
      cx += 3;
      continue;
    }
    const g = GLYPHS.get(ch);
    if (!g) continue;
    g.rows.forEach((row, ry) => [...row].forEach((p, rx) => p === '#' && cv.set(cx + rx, y + ry, c)));
    cx += g.w + 1;
  }
}

/** 3 × 5 digits for the ticket machine's display. */
const DIGITS: Record<string, string> = {
  '0': '###/#.#/#.#/#.#/###',
  '1': '.#./##./.#./.#./###',
  '2': '###/..#/###/#../###',
  '4': '#.#/#.#/###/..#/..#',
};
function digits(cv: Canvas, x: number, y: number, s: string, c: RGBA): void {
  [...s].forEach((d, i) => DIGITS[d]!.split('/').forEach((row, ry) => [...row].forEach((p, rx) => p === '#' && cv.set(x + i * 4 + rx, y + ry, c))));
}

/**
 * One stretch of counter, 24 × 30 (the counter itself from y = 4; its bottom on the last row).
 * `left`/`right`: it ends there (its side shows and gets an outline); a stretch in the middle
 * joins up with its neighbours.
 */
function counter(left: boolean, right: boolean): Canvas {
  const cv = new Canvas(24, 30);
  const x0 = left ? 1 : 0;
  const x1 = right ? 22 : 23;
  const w = x1 - x0 + 1;
  // The top: laminate, lit from the top left, with a worn lip along the front.
  cv.rect(x0, 4, w, 6, TOP[1]!);
  cv.rect(x0, 4, w, 1, TOP[0]!);
  cv.rect(x0, 9, w, 1, TOP[2]!);
  cv.rect(x0, 10, w, 1, TOP[3]!);
  // Coffee rings and a scratch nobody will sand.
  if (!left && !right) {
    cv.set(5, 6, TOP[2]!);
    cv.set(6, 7, TOP[2]!);
    cv.set(4, 7, TOP[2]!);
    cv.set(5, 8, TOP[2]!);
  }
  if (left) for (let x = 14; x < 19; x++) cv.set(x, 7, TOP[2]!);
  // The front: the red stripe, melamine panels with seams, a dark kick plate.
  cv.rect(x0, 11, w, 3, RED[1]!);
  cv.rect(x0, 11, w, 1, RED[0]!);
  cv.rect(x0, 14, w, 1, RED[3]!);
  cv.rect(x0, 15, w, 11, FRONT[1]!);
  cv.rect(x0, 15, w, 1, FRONT[0]!);
  for (const x of [0, 12]) if (x >= x0 && x <= x1) cv.rect(x, 15, 1, 11, FRONT[2]!);
  cv.rect(x0, 26, w, 3, GLOVE[2]!);
  cv.rect(x0, 26, w, 1, GLOVE[3]!);
  // Scuffs from a thousand trolleys.
  cv.set(x0 + 7, 24, FRONT[0]!);
  cv.set(x0 + 8, 24, FRONT[0]!);
  cv.set(x0 + 17, 27, GLOVE[1]!);
  // Its ends: the side face, darker, and a rounded corner.
  if (left) {
    cv.rect(1, 11, 2, 18, FRONT[3]!);
    cv.rect(1, 11, 2, 3, RED[3]!);
    cv.set(1, 4, null);
  }
  if (right) {
    cv.rect(21, 11, 2, 18, FRONT[2]!);
    cv.set(22, 4, null);
  }
  const out = outline(cv);
  // Outline the bottom too: the canvas ends there.
  for (let x = 0; x < 24; x++) if (out.get(x, 28)[3] > 0) out.set(x, 29, K);
  return out;
}

/** The counter: three frames of 24 × 30 (an end on the left, the middle, an end on the right). */
export function makeCounter(): Canvas {
  const sheet = new Canvas(72, 30);
  sheet.blit(counter(true, false), 0, 0);
  sheet.blit(counter(false, false), 24, 0);
  sheet.blit(counter(false, true), 48, 0);
  return sheet;
}

/**
 * La Caja de Devoluciones on its stretch of counter, 24 × 46, two frames: 0 bored, 1 talking (the
 * drawer, its mouth, slams out). The «Esta caja cierra en 5 minutos» card hangs off its display.
 */
export function makeReturnsTill(): Canvas {
  const sheet = new Canvas(48, 46);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(24, 46);
    cv.blit(counter(false, false), 0, 16);
    const reg = new Canvas(24, 26);
    // The body, a heavy old register in 3/4.
    cube(reg, 3, 8, 18, 14, 4, 4, MINT, ramp('#7fae8c', '#5e8a6e', '#46695a', '#2e4a40'), MINT);
    // The display hood on top: its «eyes» are two dead digits, under heavy lids.
    box(reg, 7, 1, 12, 8, MINT);
    reg.rect(8, 3, 10, 4, K);
    reg.rect(9, 4, 3, 2, VFD);
    reg.rect(14, 4, 3, 2, VFD);
    reg.set(9, 4, WHITE);
    reg.set(14, 4, WHITE);
    // Lids: half shut, bored stiff.
    reg.rect(9, 3, 3, 1, MINT[2]!);
    reg.rect(14, 3, 3, 1, MINT[2]!);
    // The keys, in rows, a couple stuck down.
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) reg.rect(9 + c * 3, 13 + r * 3, 2, 2, (r + c) % 3 === 0 ? CREAM[2]! : CREAM[0]!);
    reg.set(15, 16, RED[1]!);
    // The crank on the side.
    reg.rect(2, 13, 1, 4, STEEL[2]!);
    reg.rect(0, 16, 3, 1, STEEL[1]!);
    // The drawer: its mouth. Bored, a slit; talking, it slams out showing three coins and a button.
    if (k === 0) {
      reg.rect(8, 20, 12, 1, K);
    } else {
      reg.rect(7, 20, 14, 4, MINT[2]!);
      reg.rect(8, 20, 12, 3, K);
      reg.rect(9, 21, 2, 1, YEL[1]!);
      reg.rect(12, 21, 2, 1, STEEL[1]!);
      reg.rect(15, 21, 2, 1, YEL[2]!);
      reg.rect(7, 23, 14, 1, MINT[3]!);
    }
    // The card off the hood, on a string: yellow with three red lines (the small print).
    reg.set(19, 2, K);
    reg.rect(19, 3, 1, 2, STEEL[3]!);
    reg.rect(18, 5, 6, 5, YEL[1]!);
    reg.rect(18, 5, 6, 1, YEL[0]!);
    reg.rect(19, 7, 4, 1, RED[2]!);
    reg.rect(19, 9, 3, 1, RED[2]!);
    cv.blit(outline(reg), 0, k === 1 ? 0 : 1);
    sheet.blit(cv, k * 24, 0);
  }
  return sheet;
}

/** A queue post, 8 × 22: chrome pole on a heavy black base, the tape's cassette on top. */
export function makePost(): Canvas {
  const cv = new Canvas(8, 22);
  ellipse(cv, 3.5, 19, 3.5, 1.6, GLOVE[2]!);
  cv.rect(2, 18, 4, 1, GLOVE[1]!);
  cv.rect(3, 4, 2, 15, STEEL[1]!);
  cv.rect(3, 4, 1, 15, STEEL[0]!);
  // The cassette: the tape comes out of its side (TAPE_Y px above the feet).
  cv.rect(1, 1, 6, 4, DSTEEL[1]!);
  cv.rect(1, 1, 6, 1, RED[1]!);
  cv.rect(6, 2, 1, 2, BLUE[2]!);
  return outline(cv);
}


/** The queue tape, 4 × 4, tiled between two posts: blue with the store's dashes. */
export function makeQueueTape(): Canvas {
  const cv = new Canvas(4, 4);
  cv.rect(0, 0, 4, 1, K);
  cv.rect(0, 1, 4, 1, BLUE[1]!);
  cv.rect(0, 2, 4, 1, BLUE[2]!);
  cv.rect(0, 3, 4, 1, K);
  cv.set(0, 1, BLUE[0]!);
  cv.set(1, 1, BLUE[0]!);
  return cv;
}

/** La máquina de turnos, 16 × 34, two frames: «12» lit, and the dot that blinks while nothing happens. */
export function makeTicketMachine(): Canvas {
  const sheet = new Canvas(32, 34);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(16, 34);
    ellipse(cv, 7.5, 31, 5, 1.8, GLOVE[2]!);
    cv.rect(7, 14, 2, 17, STEEL[2]!);
    cv.set(7, 14, STEEL[1]!);
    // The head: the red display and, under it, the dispenser with its tongue of paper.
    box(cv, 1, 1, 14, 9, RED);
    cv.rect(2, 2, 12, 7, K);
    digits(cv, 4, 3, '12', k === 0 ? LED : hx('#c7372d'));
    cv.set(12, 3, k === 1 ? LED : LED_OFF);
    box(cv, 3, 10, 10, 5, CREAM);
    cv.rect(5, 12, 6, 1, K);
    // The ticket hanging out: «4.000.0..», too long to read.
    cv.rect(6, 13, 4, 5, WHITE);
    cv.rect(7, 14, 2, 1, CREAM[2]!);
    cv.rect(7, 16, 2, 1, CREAM[2]!);
    cv.set(9, 17, CREAM[1]!);
    sheet.blit(outline(cv), k * 16, 0);
  }
  return sheet;
}

/** «Reclamaciones sin Resolver», 24 × 34: a grey filing cabinet, the top drawer stuffed shut. */
export function makeFilingCabinet(): Canvas {
  const cv = new Canvas(24, 34);
  cube(cv, 1, 4, 21, 29, 4, 4, STEEL, DSTEEL, STEEL);
  // Three drawers: seams, handles, label slots. The top one bulges open with papers.
  for (const [i, y] of [[0, 9], [1, 17], [2, 25]] as const) {
    cv.rect(6, y + 6, 15, 1, STEEL[3]!);
    cv.rect(10, y + 2, 7, 3, CREAM[0]!);
    cv.rect(11, y + 3, 5, 1, CREAM[2]!);
    cv.rect(12, y + 5, 3, 1, K);
    if (i === 0) {
      cv.rect(6, y - 1, 15, 2, STEEL[1]!);
      for (const x of [7, 10, 13, 17]) cv.rect(x, y - 3, 2, 2, x === 13 ? YEL[1]! : WHITE);
      cv.set(14, y - 3, RED[1]!);
    }
  }
  // On top: a mug nobody washed and a pile of forms.
  cv.rect(5, 1, 6, 4, WHITE);
  cv.rect(5, 1, 6, 1, CREAM[1]!);
  cv.rect(6, 2, 4, 1, CREAM[2]!);
  cv.rect(14, 1, 4, 4, RED[1]!);
  cv.rect(14, 1, 4, 1, BROWN[3]!);
  cv.set(18, 2, RED[2]!);
  // A dent and a «No abrir» sticker gone pale.
  cv.set(20, 21, STEEL[3]!);
  cv.rect(2, 22, 2, 3, YEL[2]!);
  cv.set(16, 30, RUSTR[1]!);
  return outline(cv);
}

/**
 * El Chatarrero, 36 × 36, two frames: a supermarket trolley loaded with scrap, an old transistor
 * radio in the child seat for a head (shifty, half-lidded) and two gloved hands on the handle.
 * Frame 1: the squeaky wheel wobbles and the radio bobs.
 */
export function makeScrapDealer(): Canvas {
  const sheet = new Canvas(72, 36);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(36, 36);
    const bob = k;
    // The trolley: wire basket, frame, wheels (the back left one squeaks: it sits crooked).
    cv.rect(6, 14, 26, 1, STEEL[1]!);
    cv.rect(8, 26, 22, 1, STEEL[2]!);
    for (const x of [6, 11, 16, 21, 26, 31]) cv.rect(x, 14, 1, 13, STEEL[2]!);
    cv.rect(6, 20, 26, 1, STEEL[2]!);
    cv.rect(31, 10, 1, 5, STEEL[1]!);
    cv.rect(31, 9, 4, 1, RED[1]!);
    // The scrap: a fan blade, a coil of cable, a gear, half a keyboard.
    cv.rect(8, 10, 9, 4, DSTEEL[1]!);
    for (let x = 9; x < 16; x += 2) cv.set(x, 11, CREAM[0]!);
    ellipse(cv, 21, 11, 3.2, 3, YEL[2]!);
    cv.set(21, 11, K);
    cv.rect(24, 9, 5, 5, GREEN);
    cv.rect(24, 9, 5, 1, hx('#8ad08a'));
    for (const [x, y] of [[13, 8], [14, 7], [15, 7], [16, 8]] as const) cv.set(x, y, BLUE[1]!);
    cv.rect(9, 16, 4, 3, RUSTR[1]!);
    cv.rect(18, 16, 6, 3, STEEL[0]!);
    cv.rect(26, 17, 3, 2, RED[2]!);
    cv.rect(13, 22, 5, 3, CARD[1]!);
    for (const x of [10, 27]) {
      const wob = x === 10 && k === 1 ? 1 : 0;
      ellipse(cv, x + wob, 30, 2.5, 2.5, GLOVE[1]!);
      cv.set(x + wob, 30, STEEL[1]!);
      cv.rect(x, 27, 1, 2, STEEL[3]!);
    }
    // The radio in the child seat (the head, 3/4, looking right): red bakelite, a carrying handle.
    const RADIO = ramp('#ff8a70', '#c8483c', '#8e2f30', '#5a1d22');
    reg3(cv, bob, RADIO);
    // Hands on the handle, behind the head.
    hand(cv, 30, 8 + bob);
    hand(cv, 33, 10 - bob);
    sheet.blit(outline(cv), k * 36, 0);
  }
  return sheet;
}

/** The Chatarrero's head: an old transistor radio, grille on its side, two tired eyes on its dial. */
function reg3(cv: Canvas, bob: number, R: readonly RGBA[]): void {
  // Handle on top.
  cv.rect(5, 1 + bob, 8, 1, GLOVE[1]!);
  cv.rect(5, 1 + bob, 1, 3, GLOVE[1]!);
  cv.rect(12, 1 + bob, 1, 3, GLOVE[1]!);
  cube(cv, 2, 3 + bob, 14, 10, 4, 3, R, ramp('#a8443a', '#7a2e2c', '#5a1d22', '#3a1218'), CREAM);
  // Chrome grille on the side face.
  for (let y = 7 + bob; y < 12 + bob; y += 2) cv.rect(3, y, 2, 1, STEEL[1]!);
  // The dial: a cream window with the eyes in it, lids half down.
  cv.rect(7, 6 + bob, 8, 4, CREAM[0]!);
  cv.rect(8, 7 + bob, 2, 2, K);
  cv.rect(12, 7 + bob, 2, 2, K);
  cv.set(9, 7 + bob, WHITE);
  cv.set(13, 7 + bob, WHITE);
  cv.rect(8, 6 + bob, 2, 1, R[2]!);
  cv.rect(12, 6 + bob, 2, 1, R[2]!);
  // A knob for a mouth, slightly askew, and the bent antenna.
  cv.rect(10, 11 + bob, 3, 1, K);
  cv.set(14, 11 + bob, STEEL[0]!);
  cv.rect(14, bob, 1, 3, STEEL[1]!);
  cv.set(15, bob, STEEL[0]!);
}

/**
 * «Productos en Exposición», 50 × 34: a cork board with a red header and five empty cards pinned
 * up (the game draws who is on each: in colour or as a silhouette).
 */
export function makeBoard(): Canvas {
  const cv = new Canvas(50, 34);
  box(cv, 0, 0, 50, 34, BROWN);
  cv.rect(2, 2, 46, 30, CORK[1]!);
  for (let i = 0; i < 40; i++) cv.set(3 + ((i * 17) % 44), 3 + ((i * 11) % 28), i % 2 ? CORK[2]! : CORK[0]!);
  cv.rect(2, 2, 46, 5, RED[1]!);
  cv.rect(2, 2, 46, 1, RED[0]!);
  for (let x = 5; x < 45; x += 4) cv.rect(x, 4, 2, 1, WHITE);
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * 9;
    const y = i % 2 ? 11 : 10;
    cv.rect(x, y, 8, 11, WHITE);
    cv.rect(x + 1, y + 1, 6, 7, CREAM[1]!);
    cv.rect(x + 1, y + 9, 6, 1, CREAM[2]!);
    cv.set(x + 3, y - 1, i === 2 ? BLUE[1]! : RED[1]!);
    cv.set(x + 4, y - 1, i === 2 ? BLUE[1]! : RED[1]!);
  }
  // A curled flyer in the corner: «Se busca personal».
  cv.rect(36, 24, 9, 7, YEL[0]!);
  cv.rect(37, 26, 6, 1, CORK[3]!);
  cv.rect(37, 28, 4, 1, CORK[3]!);
  cv.set(44, 24, CORK[1]!);
  return outline(cv);
}


/** Who is on each card of the board, 6 × 7 each (the card's window), in ROSTER order: palette letters. */
const BOARD_FACES: readonly string[][] = [
  // La Tostadora: toast peeking out, chrome, the red band.
  ['.T..T.', 'SSSSSS', 'SKSSKS', 'SSSSSS', 'RRRRRR', 'ssssss', '.K..K.'],
  // La Batidora de Vaso: lid, the glass jug with its blades, the red base.
  ['.GGGG.', '.IIIIG', '.KIKIG', '.IIII.', '.IWWI.', 'rRRRRr', 'rrrrrr'],
  // La Plancha de Vapor: the handle, the white shell, the soleplate and its steam holes.
  ['..BBB.', '..B.B.', '.WWWWW', 'WKWWKW', 'WWWWWW', 'SSSSSS', '.c.c..'],
  // El Becario Eterno: messy hair, a face, a white shirt and the lanyard with its badge.
  ['.HHHH.', 'HFFFF.', '.KFFK.', '.FFFF.', 'WWYWWW', 'WWYWWW', 'WYYYWW'],
  // El Móvil Reacondicionado: a cracked screen and the battery at 1 %.
  ['GGGGGG', 'GbbWbG', 'GKWbKG', 'GbWbbG', 'GbbWbG', 'GRbbbG', 'GGGGGG'],
];

/** A card's silhouette (the locked ones): the same shape, all in the board's darkest cork. */
const SILHOUETTE = hx('#3b3348');

/**
 * The faces on the board's cards, 6 × 7 each: the five in colour (frames 0–4, ROSTER order) and
 * their silhouettes (5–9) for the ones still locked. The game pins them on the cards (BOARD_CARDS).
 */
export function makeBoardFaces(): Canvas {
  const pal: Record<string, RGBA> = {
    T: TOAST, S: STEEL[1]!, s: STEEL[2]!, K: K, R: RED[1]!, r: RED[2]!, G: GLOVE[1]!, I: ICE[1]!, W: WHITE,
    B: BLUE[1]!, c: ICE[2]!, H: BROWN[2]!, F: SKIN, Y: YEL[1]!, b: BLUE[2]!,
  };
  const n = BOARD_FACES.length;
  const sheet = new Canvas(6 * n * 2, 7);
  BOARD_FACES.forEach((rows, i) =>
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        sheet.set(i * 6 + x, y, pal[ch]!);
        sheet.set((n + i) * 6 + x, y, SILHOUETTE);
      }),
    ),
  );
  return sheet;
}

/**
 * El teléfono del Servicio Técnico, 18 × 32, two frames: a wall phone with the receiver off the
 * hook, hanging from its curly cord and swinging.
 */
export function makeWallPhone(): Canvas {
  const sheet = new Canvas(36, 32);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(18, 32);
    box(cv, 3, 0, 12, 15, CREAM);
    cv.rect(4, 1, 10, 2, RED[1]!);
    // The keypad and the empty cradle.
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cv.set(6 + c * 2, 6 + r * 2, CREAM[3]!);
    cv.rect(13, 4, 1, 7, CREAM[3]!);
    // The curly cord down to the receiver, which hangs upside down and swings.
    const sx = k === 0 ? 0 : 2;
    for (let y = 15; y < 20; y++) cv.set(9 + (y % 2) + Math.floor((sx * (y - 15)) / 5), y, CREAM[2]!);
    const rx = 8 + sx;
    // Handset, mouthpiece up: two cups and the grip between them.
    cv.rect(rx - 1, 20, 5, 3, CREAM[1]!);
    cv.rect(rx - 1, 20, 5, 1, CREAM[0]!);
    cv.rect(rx, 23, 3, 4, CREAM[1]!);
    cv.rect(rx, 23, 1, 4, CREAM[0]!);
    cv.rect(rx - 1, 27, 5, 3, CREAM[1]!);
    cv.rect(rx - 1, 29, 5, 1, CREAM[2]!);
    for (const x of [rx, rx + 2]) cv.set(x, 21, CREAM[3]!);
    sheet.blit(outline(cv), k * 18, 0);
  }
  return sheet;
}

/**
 * The conveyor into the warehouse, 48 × 24 (two floor tiles), four frames: the belt runs towards
 * the wall (up), 2 px a frame, between yellow and black edges.
 */
export function makeConveyor(): Canvas {
  const sheet = new Canvas(192, 24);
  for (let k = 0; k < 4; k++) {
    const cv = new Canvas(48, 24);
    cv.rect(0, 0, 48, 24, DSTEEL[2]!);
    for (let y = 0; y < 24; y++) {
      for (const x of [0, 1, 2, 45, 46, 47]) cv.set(x, y, (Math.floor((y + (x > 40 ? 3 : 0)) / 3) % 2) ? K : YEL[1]!);
    }
    cv.rect(3, 0, 1, 24, STEEL[2]!);
    cv.rect(44, 0, 1, 24, DSTEEL[3]!);
    cv.rect(4, 0, 40, 24, GLOVE[2]!);
    // Treads: every 8 px, moving up.
    for (let y = 0; y < 24; y++) if ((y + k * 2) % 8 === 0) cv.rect(5, y, 38, 1, GLOVE[1]!);
    for (let y = 0; y < 24; y++) if ((y + k * 2) % 8 === 1) cv.rect(5, y, 38, 1, GLOVE[3]!);
    // An arrow painted on it, going in.
    const ay = (24 + 8 - ((k * 2) % 24)) % 24;
    for (let i = 0; i < 4; i++) {
      const yy = (ay + i) % 24;
      cv.rect(23 - i, yy, 2 + i * 2, 1, YEL[2]!);
    }
    cv.rect(0, 23, 48, 1, K);
    sheet.blit(cv, k * 48, 0);
  }
  return sheet;
}

/**
 * The opening in the back wall where the conveyor goes in, 48 × 33 (like a door's shutter): a dark
 * hole behind a curtain of plastic strips. Frame 1: the strips parted (something just went in).
 */
export function makeStripCurtain(): Canvas {
  const sheet = new Canvas(96, 33);
  for (let k = 0; k < 2; k++) {
    const cv = new Canvas(48, 33);
    cv.rect(0, 0, 48, 33, STEEL[3]!);
    cv.rect(0, 0, 48, 3, STEEL[2]!);
    cv.rect(0, 0, 3, 33, STEEL[2]!);
    cv.rect(45, 0, 3, 33, STEEL[4]!);
    cv.rect(3, 3, 42, 30, hx('#0b0a12'));
    // Faint light at the far end: the warehouse.
    cv.rect(16, 18, 16, 6, hx('#17151f'));
    // Seven strips, pale and scratched, a couple hanging crooked.
    for (let i = 0; i < 7; i++) {
      const x = 4 + i * 6;
      const part = k === 1 && i >= 2 && i <= 4;
      const len = part ? 14 + (i % 2) * 3 : 30;
      const shift = part ? (i < 3 ? -2 : i > 3 ? 2 : 0) : 0;
      for (let y = 3; y < 3 + len; y++) {
        const dx = part && y > 10 ? shift : 0;
        cv.set(x + dx, y, ICE[3]!);
        cv.set(x + 1 + dx, y, ICE[2]!);
        cv.set(x + 2 + dx, y, ICE[2]!);
        cv.set(x + 3 + dx, y, ICE[3]!);
      }
      if (!part) cv.set(x + 1, 3 + ((i * 7) % 20) + 6, ICE[1]!);
    }
    cv.rect(3, 3, 42, 1, STEEL[4]!);
    sheet.blit(cv, k * 48, 0);
  }
  return sheet;
}

/** The «Mercancía devuelta» sign over the curtain: a yellow plate, black letters, 79 × 13. */
export function makeReturnedGoodsSign(): Canvas {
  const cv = new Canvas(79, 13);
  box(cv, 0, 0, 79, 13, YEL);
  letters(cv, 3, 2, 'Mercancía devuelta', K);
  cv.set(1, 1, YEL[2]!);
  cv.set(77, 11, YEL[3]!);
  return outline(cv);
}

type Sheets = Record<string, { canvas: Canvas; frameW: number; frameH: number }>;

/** Frame `i` of a sheet. */
function frame(s: Sheets[string], i = 0): Canvas {
  const out = new Canvas(s.frameW, s.frameH);
  for (let y = 0; y < s.frameH; y++) for (let x = 0; x < s.frameW; x++) out.p[y]![x] = s.canvas.get(i * s.frameW + x, y);
  return out;
}

/**
 * A still of the whole Mostrador for checking by eye (capturas/sprites-mostrador.png): the room
 * painted as the game paints rooms, and every piece where the template puts it, in depth order.
 */
export function previewHub(
  room: import('../../src/sim/room.ts').Room,
  sheets: Sheets,
  paint: (r: import('../../src/sim/room.ts').Room, seed: string) => { canvas: Canvas },
): Canvas {
  const cv = paint(room, 'mostrador').canvas.clone();
  const T = 24;
  const b = room.belt!;
  cv.blit(frame(sheets['cinta-almacen']!, 1), b.x, b.y);
  cv.blit(frame(sheets.cortinas!), b.x, 2 * T - 33);
  const sign = sheets['cartel-mercancia']!.canvas;
  cv.blit(sign, b.x + b.w / 2 - Math.floor(sign.w / 2), WALL_SIGN_Y);
  for (const st of room.stations) {
    if (st.kind === 'tablon') {
      cv.blit(sheets.tablon!.canvas, st.x - 25, WALL_BOARD_Y);
      // As on a first visit: only the Tostadora in colour, the rest as silhouettes.
      BOARD_CARDS.forEach((c, i) => cv.blit(frame(sheets['fichas-tablon']!, i === 0 ? 0 : BOARD_FACES.length + i), st.x - 25 + c.x, WALL_BOARD_Y + c.y));
    }
    if (st.kind === 'telefono') cv.blit(frame(sheets.telefono!), st.x - 9, WALL_PHONE_Y);
  }
  const at = (key: string, x: number, y: number, i = 0): void => {
    const f = frame(sheets[key]!, i);
    cv.blit(f, Math.round(x - f.w / 2), y - f.h + 1);
  };
  const props = [...room.props].sort((p, q) => p.y - q.y);
  const isCounter = (x: number, y: number): boolean => props.some((o) => (o.def.id === 'mostrador' || o.def.id === 'caja-devoluciones') && o.y === y && o.x === x);
  for (const pr of props) {
    const id = pr.def.id;
    if (id === 'mostrador') at('mostrador', pr.x, pr.y + 1, isCounter(pr.x - T, pr.y) ? (isCounter(pr.x + T, pr.y) ? 1 : 2) : 0);
    else if (id === 'caja-devoluciones') at('caja-devoluciones', pr.x, pr.y + 1, 1);
    else if (id === 'poste') {
      at('poste', pr.x, pr.y + 1);
      const next = props.find((o) => o.def.id === 'poste' && o.y === pr.y && o.x > pr.x && o.x - pr.x <= 4 * T);
      if (next) for (let x = pr.x + 3; x < next.x - 3; x += 4) cv.blit(sheets['cinta-cola']!.canvas, x, pr.y - TAPE_Y);
    } else if (sheets[id]) at(id, pr.x, pr.y + 1);
  }
  // The toaster where it starts, for scale.
  at('tostadora', room.playerStart.x, room.playerStart.y + 4);
  return cv;
}
