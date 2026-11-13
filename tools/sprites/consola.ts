// La Consola Edición Coleccionista, floor 3's second boss (M14 (j4), docs/DISENO.md «Jefes al azar»).
// A home games console stood on end like a tower, in black gloss plastic with the gold trim of the
// collector's edition, on short legs: the disc tray across its front (it spits cartridges out of it,
// which makes no sense, and it knows), a greedy, heavy-lidded stare, and a gamepad in its front hand
// with the cable trailing to the floor. Jokes: the gold plaque numbered «000001» (of four million);
// the «+3 %» starburst sticker of «more content»; and, on its dark side, the little hatch of the
// downloadable content with a padlock on it. Updating (BossPhase.mute) its tray becomes a progress
// bar stuck near the start. In «Pase de temporada» it wears the season pass on a lanyard, its light
// strip goes all colours and its eyes turn gold. Big floating hands, never arms
// (docs/ESTILO_ARTE.md). 72x76, like the other bosses.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { GLOVE, K, PANTL, RED, STEEL, WHITE, YEL, cube, outline, ramp } from '../../src/art/lib.ts';
import { joinPose, type Pose } from './pose.ts';

type Pt = readonly [number, number];

export const CONSOLA_W = 72;
export const CONSOLA_H = 76;

/** Black gloss plastic, cold blue in the light (the front, the dark side and the top). */
const GLOSS = ramp('#6a7190', '#3c4159', '#2a2e42', '#1a1c2c');
const GLOSS_SIDE = ramp('#3a3e56', '#262a3e', '#1c1f30', '#121422');
const GLOSS_TOP = ramp('#8d94b0', '#5f6582', '#474c66', '#30344a');
/** The collector's edition's gold. */
const GOLD = YEL;
/** The light strip under the tray, and the eyes: console blue. */
const LED = hx('#69c8ff');
const LED_DK = hx('#2f7fc4');
/** Season pass purple. */
const PASS = ramp('#d9a6ff', '#9a5ad8', '#6a36a4', '#432070');
const RAINBOW: readonly RGBA[] = [RED[1]!, YEL[1]!, hx('#58b45a'), hx('#69dbd8'), hx('#5f93d4'), hx('#e070c8')];

export const CONSOLA_REST: Pose = { xb: 20, xf: 42, bob: 0 };

/** Rest, breathing and a heavy walk (a foot lifted 2 px, never crossed), like the Lavadora. */
export const CONSOLA_POSES: ReadonlyArray<{ name: string; pose: Pose }> = [
  { name: 'idle0', pose: CONSOLA_REST },
  { name: 'idle1', pose: { ...CONSOLA_REST, bob: 1 } },
  { name: 'walk0', pose: { ...CONSOLA_REST, bob: -1, lift: { leg: -1, px: 2 } } },
  { name: 'walk1', pose: CONSOLA_REST },
  { name: 'walk2', pose: { ...CONSOLA_REST, bob: -1, lift: { leg: 1, px: 2 } } },
  { name: 'walk3', pose: { ...CONSOLA_REST, bob: 1 } },
];

export interface ConsolaLook {
  /** Phase 2: «Pase de temporada». */
  pass?: boolean;
  /** The disc tray out: about to fire (the warning frame). */
  tray?: boolean;
  /** Stopped to update (BossPhase.mute): eyes shut, the progress bar instead of the tray. */
  updating?: boolean;
  /** Second breath: the light strip has moved along. */
  blink?: boolean;
}

export function makeConsola(pose: Pose = CONSOLA_REST, look: ConsolaLook = {}): Canvas {
  const legs = new Canvas(CONSOLA_W, CONSOLA_H);
  const body = new Canvas(CONSOLA_W, CONSOLA_H);
  const lb = pose.lift?.leg === -1 ? pose.lift.px : 0;
  const lf = pose.lift?.leg === 1 ? pose.lift.px : 0;
  const bx = pose.xb - CONSOLA_REST.xb;
  const fx = pose.xf - CONSOLA_REST.xf;
  // Short legs and rubber feet (the ones that leave marks on the furniture).
  legs.rect(23 + bx, 62, 5, 8 - lb, PANTL[2]!);
  legs.rect(45 + fx, 62, 5, 8 - lf, PANTL[1]!);
  legs.rect(45 + fx, 62, 1, 8 - lf, PANTL[0]!);
  legs.rect(20 + bx, 69 - lb, 10, 4, GLOVE[2]!);
  legs.rect(20 + bx, 69 - lb, 9, 1, GLOVE[1]!);
  legs.rect(42 + fx, 69 - lf, 12, 4, GLOVE[1]!);
  legs.rect(42 + fx, 69 - lf, 11, 1, GLOVE[0]!);

  // Back hand, behind the body.
  bigHand(body, 4, 38);
  // The tower, in three-quarters: the glossy top, the dark side on the left, the front on the right.
  cube(body, 12, 6, 48, 58, 9, 5, GLOSS, GLOSS_SIDE, GLOSS_TOP);
  // Gloss: a streak of light down the front, top left.
  body.rect(22, 12, 1, 14, GLOSS[0]!);
  body.rect(23, 12, 1, 6, GLOSS[0]!);
  // The gold trim of the collector's edition: along the top edge of the front and its foot.
  body.rect(21, 11, 38, 1, GOLD[1]!);
  body.rect(21, 61, 38, 1, GOLD[2]!);
  body.rect(13, 61, 8, 1, GOLD[3]!);
  // The power button on top, lit.
  body.rect(50, 7, 4, 2, look.updating ? YEL[1]! : LED);
  body.set(50, 7, WHITE);

  // The numbered plaque: gold, «000001» in black (of a run of four million).
  body.rect(26, 14, 28, 8, GOLD[2]!);
  body.rect(26, 14, 28, 1, GOLD[0]!);
  body.rect(27, 15, 26, 6, GOLD[1]!);
  digits(body, 28, 16, '000001', GOLD[3]!);

  eyes(body, look);

  // The disc tray across the front, the light strip under it (all colours with the season pass).
  if (look.updating) progress(body, look);
  else tray(body, look);

  // The «+3 %» starburst (of «more content»); with the season pass, the pass on its lanyard instead.
  if (look.pass) seasonPass(body);
  else starburst(body, 29, 42);
  // Two USB ports low on the front, one with a bit of fluff in it.
  for (const x of [25, 31]) {
    body.rect(x, 55, 4, 2, K);
    body.rect(x, 55, 4, 1, GLOSS[3]!);
  }
  body.set(32, 56, hx('#9da3b8'));

  // On the dark side: the hatch of the downloadable content, padlocked; and vents.
  body.rect(14, 28, 6, 12, GLOSS_SIDE[2]!);
  body.rect(14, 28, 6, 1, GLOSS_SIDE[0]!);
  body.rect(14, 39, 6, 1, GLOSS_SIDE[3]!);
  padlock(body, 15, 31);
  for (let y = 45; y < 58; y += 3) body.rect(14, y, 5, 1, GLOSS_SIDE[3]!);
  // Scratches on the gloss (it has been dusted with a sleeve).
  for (const [x, y] of [[56, 30], [57, 31], [24, 47], [55, 52]] as const) body.set(x, y, GLOSS[0]!);

  // The gamepad in the front hand, held out to the right: its cable trails to the floor (drawn after the outline).
  bigHand(body, 62, 48);
  gamepad(body, 55, 44, look.pass ?? false);

  const o = outline(joinPose(legs, body, pose));
  // The gamepad's cable: down from it to the floor in a lazy loop (it is wired: the wireless one is sold apart).
  const cable: Pt[] = [
    [57, 52], [57, 53], [57, 54], [58, 55], [58, 56], [59, 57],
    [60, 58], [61, 59], [62, 60], [62, 61], [61, 62], [60, 63], [60, 64], [61, 65], [62, 66], [64, 67], [66, 67], [67, 68],
  ];
  for (const [x, y] of cable) {
    const yy = y + (y < 60 ? pose.bob : 0);
    if (o.get(x, yy)[3] === 0 || y >= 58) o.set(x, yy, GLOVE[0]!);
  }
  return o;
}

/** Tiny 3x5 glyphs. */
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
};

function digits(cv: Canvas, x: number, y: number, text: string, c: RGBA, gap = 4): void {
  [...text].forEach((ch, i) => {
    GLYPHS[ch]?.forEach((row, j) => [...row].forEach((p, k) => {
      if (p === '#') cv.set(x + i * gap + k, y + j, c);
    }));
  });
}

function eyes(cv: Canvas, look: ConsolaLook): void {
  for (const ex of [30, 44]) {
    if (look.updating) {
      // Shut, waiting for the update: two flat lines and a bead of sweat.
      cv.rect(ex, 29, 8, 1, K);
      cv.rect(ex + 1, 28, 6, 1, GLOSS[3]!);
      continue;
    }
    cv.rect(ex, 24, 8, 7, K);
    // The iris: console blue, or gold once it sells the season pass; a glint; looking at you.
    const iris = look.pass ? GOLD[1]! : LED;
    const irisDk = look.pass ? GOLD[2]! : LED_DK;
    cv.rect(ex + 4, 27, 3, 3, iris);
    cv.rect(ex + 4, 29, 3, 1, irisDk);
    cv.set(ex + 6, 27, WHITE);
    // Heavy lids of gloss, slanting down to the middle: greed. Lower still with the pass.
    const lid = look.pass ? 3 : 2;
    cv.rect(ex, 24, 8, lid, GLOSS[1]!);
    const inner = ex === 30 ? ex + 7 : ex;
    const outer = ex === 30 ? ex : ex + 7;
    cv.set(inner, 24 + lid, GLOSS[1]!);
    cv.set(outer, 24 + lid - 1, K);
    cv.rect(ex, 24 + lid - 1, 8, 1, GLOSS[3]!);
    cv.set(inner, 24 + lid, GLOSS[3]!);
  }
}

/** The disc tray, a slot across the front, and the light strip under it; out, with a disc on it. */
function tray(cv: Canvas, look: ConsolaLook): void {
  cv.rect(24, 34, 32, 3, K);
  cv.rect(24, 34, 32, 1, GLOSS[3]!);
  // The light strip: blue, a brighter bit running along it; or the season's colours.
  for (let x = 24; x < 56; x++) {
    const run = Math.abs(((x + (look.blink ? 6 : 0)) % 16) - 8) < 2;
    const c = look.pass ? RAINBOW[Math.floor((x - 24 + (look.blink ? 3 : 0)) / 6) % RAINBOW.length]! : run ? WHITE : LED;
    cv.set(x, 38, c);
  }
  if (look.tray) {
    // The tray slid out to the right, a disc on it (silver, the hole in the middle), and a glow.
    cv.rect(40, 33, 21, 4, GLOSS[2]!);
    cv.rect(40, 33, 21, 1, GLOSS[0]!);
    cv.rect(44, 31, 14, 3, STEEL[1]!);
    cv.rect(46, 30, 10, 1, STEEL[0]!);
    cv.rect(50, 32, 2, 1, K);
    cv.rect(44, 33, 14, 1, STEEL[2]!);
    cv.set(56, 31, WHITE);
  }
}

/** Updating: the tray is a progress bar, stuck near the start (1 of 37). */
function progress(cv: Canvas, look: ConsolaLook): void {
  cv.rect(24, 33, 32, 5, K);
  cv.rect(25, 34, 30, 3, GLOSS[3]!);
  cv.rect(25, 34, 3, 3, look.pass ? GOLD[1]! : hx('#58b45a'));
  cv.rect(25, 34, 3, 1, look.pass ? GOLD[0]! : hx('#9be29a'));
  // The strip under it, all dark but one blinking light.
  cv.rect(24, 38, 32, 1, GLOSS[3]!);
  cv.set(look.blink ? 30 : 26, 38, YEL[1]!);
}

/** «+3 %»: a yellow starburst with a red edge, the text in red. */
function starburst(cv: Canvas, x: number, y: number): void {
  const cx = x + 7;
  const cy = y + 5;
  for (let j = -6; j <= 6; j++) {
    for (let i = -8; i <= 8; i++) {
      const a = Math.atan2(j, i * 0.75);
      const r = 6.2 + 1.1 * Math.cos(a * 6);
      const d = Math.hypot(i * 0.75, j);
      if (d <= r) cv.set(cx + i, cy + j, d > r - 1 ? YEL[2]! : YEL[1]!);
    }
  }
  cv.rect(cx - 4, cy - 5, 4, 1, YEL[0]!);
  digits(cv, cx - 6, cy - 2, '+3%', RED[2]!);
}

/** The season pass: a purple card with a gold star and «T2», on a lanyard over its top corners. */
function seasonPass(cv: Canvas): void {
  // The lanyard: from both top corners of the front down to the card.
  for (let i = 0; i < 30; i++) {
    const y = 12 + i;
    cv.set(24 + Math.floor(i / 2), y, PASS[2]!);
    cv.set(57 - Math.floor(i / 3), y, PASS[1]!);
  }
  const x = 37;
  const y = 42;
  cv.rect(x, y, 13, 11, PASS[1]!);
  cv.rect(x, y, 13, 1, PASS[0]!);
  cv.rect(x, y, 1, 11, PASS[0]!);
  cv.rect(x + 12, y + 1, 1, 10, PASS[3]!);
  cv.rect(x + 1, y + 10, 12, 1, PASS[3]!);
  // The clip.
  cv.rect(x + 5, y - 1, 3, 2, STEEL[1]!);
  // A gold star and «T2».
  for (const [i, j] of [[3, 2], [2, 3], [3, 3], [4, 3], [3, 4], [1, 3], [5, 3]] as const) cv.set(x + i, y + j, GOLD[1]!);
  digits(cv, x + 4, y + 4, 'T2', WHITE);
}

/** «Contenido descargable»: a little gold padlock, shut. */
function padlock(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y + 3, 5, 4, GOLD[1]!);
  cv.rect(x, y + 3, 5, 1, GOLD[0]!);
  cv.rect(x, y + 6, 5, 1, GOLD[2]!);
  cv.set(x + 2, y + 4, K);
  cv.rect(x + 1, y, 3, 1, STEEL[2]!);
  cv.rect(x + 1, y, 1, 3, STEEL[2]!);
  cv.rect(x + 3, y, 1, 3, STEEL[2]!);
}

/** The gamepad: dark grey, a cross on the left and four buttons on the right (red, yellow, cyan, white). */
function gamepad(cv: Canvas, x: number, y: number, pass: boolean): void {
  cv.rect(x, y + 1, 12, 5, GLOVE[1]!);
  cv.rect(x + 1, y, 10, 1, GLOVE[0]!);
  cv.rect(x, y + 5, 4, 2, GLOVE[2]!);
  cv.rect(x + 8, y + 5, 4, 2, GLOVE[2]!);
  cv.rect(x + 2, y + 2, 1, 3, K);
  cv.rect(x + 1, y + 3, 3, 1, K);
  cv.set(x + 9, y + 2, RED[1]!);
  cv.set(x + 10, y + 3, pass ? GOLD[1]! : YEL[1]!);
  cv.set(x + 8, y + 3, hx('#69dbd8'));
  cv.set(x + 9, y + 4, WHITE);
}

/** A boss hand: 7x7 and rounded, like the Nevera's. */
function bigHand(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 7, 7, GLOVE[1]!);
  cv.rect(x, y, 6, 1, GLOVE[0]!);
  cv.rect(x + 6, y, 1, 7, GLOVE[2]!);
  cv.rect(x + 1, y + 6, 6, 1, GLOVE[2]!);
}

/** Frames per phase on the sheet: two breathing, four walking, the tray out and updating. */
export const CONSOLA_PER_PHASE = 8;

/** The sheet: «Edición Coleccionista» 0-7 and «Pase de temporada» 8-15. Frame 0 is the rest pose. */
export function makeConsolaFrames(): Canvas[] {
  return [false, true].flatMap((pass) => [
    ...CONSOLA_POSES.map((f, i) => makeConsola(f.pose, { pass, blink: i % 2 === 1 })),
    makeConsola(CONSOLA_REST, { pass, tray: true }),
    makeConsola({ ...CONSOLA_REST, bob: 1 }, { pass, updating: true }),
  ]);
}

export const CAJA_W = 24;
export const CAJA_H = 24;

/**
 * A loot box (`caja-botin`): a little chest in three-quarters, purple with gold corners and a «?»
 * on its front, glowing from the crack of its lid. Frames: 0-1 glowing (the glow pulses, a sparkle),
 * 2-3 rattling just before it opens by itself (tilted one way and the other, the lid lifting). 24x24.
 */
export function makeCajaBotinFrames(): Canvas[] {
  return [0, 1, 2, 3].map((f) => {
    const cv = new Canvas(CAJA_W, CAJA_H);
    const dx = f === 2 ? -1 : f === 3 ? 1 : 0;
    const lift = f >= 2 ? 1 : 0;
    const x = 4 + dx;
    // The body: a cube, dark side on the left.
    cube(cv, x, 9, 16, 12, 4, 3, PASS, ramp('#7a44b8', '#5a2f8c', '#432070', '#2c1450'), PASS);
    // The lid, a slab on top (lifted a px when it rattles), with the glow coming out of the crack.
    cv.rect(x + 1, 6 - lift, 15, 4, PASS[1]!);
    cv.rect(x + 2, 5 - lift, 13, 1, PASS[0]!);
    cv.rect(x + 1, 6 - lift, 4, 4, PASS[3]!);
    const glow = f === 1 || f >= 2 ? YEL[0]! : YEL[1]!;
    cv.rect(x + 5, 10 - lift, 11, 1 + lift, glow);
    // Gold corners and a gold band.
    for (const cx of [x, x + 15]) cv.rect(cx, 12, 1, 9, GOLD[1]!);
    cv.rect(x + 4, 6 - lift, 1, 4, GOLD[2]!);
    cv.rect(x + 1, 20, 15, 1, GOLD[2]!);
    // The «?» on the front.
    digits(cv, x + 9, 13, '?', WHITE);
    const o = outline(cv);
    // Sparkles over it (not outlined): one on the glowing frame, two when it rattles.
    if (f === 1) o.set(x + 15, 2, YEL[0]!);
    if (f >= 2) {
      o.set(x + 3, 2, YEL[0]!);
      o.set(x + 16, 3, WHITE);
    }
    return o;
  });
}

/** Bullet grids: `w` white, `g` grey, `r`/`R`/`l` reds, `k` dark slot. */
const BULLET_COLS: Record<string, RGBA> = {
  w: WHITE, g: hx('#b7bed0'), r: RED[1]!, R: RED[2]!, l: RED[0]!, k: GLOSS[3]!,
};

function grid(frames: ReadonlyArray<readonly string[]>, size: number): Canvas {
  const sheet = new Canvas(size * frames.length, size);
  frames.forEach((rows, f) => {
    const cv = new Canvas(size, size);
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = BULLET_COLS[ch];
      if (c) cv.set(i + 1, j + 1, c);
    }));
    sheet.blit(outline(cv), f * size, 0);
  });
  return sheet;
}

/** A game cartridge: red plastic, a white label, the grip ridges; end over end. 12x12. */
export function makeCartridgeBullet(): Canvas {
  return grid(
    [
      ['.lllllll.', 'lrrrrrrrR', 'lwwwwwwrR', 'lwwrrwwrR', 'lwwwwwwrR', 'lrrrrrrrR', 'lrkrkrkrR', '.RRRRRRR.'],
      ['.llllll..', 'lrrrrrrR.', 'lrwwwwkR.', 'lrwrrwrR.', 'lrwrrwkR.', 'lrwwwwrR.', 'lrwwwwkR.', 'lrrrrrrR.', '.RRRRRR..'],
    ],
    12,
  );
}

/** A fake coupon: a red ticket with notched ends and a white «%»; fluttering. 12x12. */
export function makeFakeCouponBullet(): Canvas {
  return grid(
    [
      ['.lllllll.', 'lrrrrrrrR', 'rwrrrwrrR', '.rrrwrrR.', '.rrwrrrR.', 'rrwrrrwrR', 'lrrrrrrrR', '.RRRRRRR.'],
      ['.........', '.lllllll.', 'lrwrrrwrR', '.rrrwrrR.', '.rrwrrrR.', 'lrwrrrwrR', '.RRRRRRR.', '.........'],
    ],
    12,
  );
}
