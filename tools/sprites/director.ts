// El Director de Recursos Inhumanos, boss of floor 4 (Oficinas): the only human boss, the one who
// signs everybody's dismissal (docs/DISENO.md). Phases 1-2 in his office chair, phase 3 on his
// feet while the chair rolls round the room on its own. Also here: his chair alone, his business
// cards, the dismissal letters, the slides, the cuts, the frosted glass partitions that move about
// in the Sala de Juntas and the long table in its middle.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { CREAM, K, OFFICE, RED, STEEL, TOPS, WHITE, YEL, clear, ellipse, outline, ramp, type Ramp } from '../../src/art/lib.ts';
import { joinPose, type Pose } from './pose.ts';

type Pt = readonly [number, number];

export const DIRECTOR_W = 72;
export const DIRECTOR_H = 76;
/** The floor line: the last row with paint (shoes and chair wheels), the same in every frame. */
export const DIRECTOR_FLOOR = 72;

/** Skin: a man who has a tan in November. */
export const DSKIN = ramp('#f2c9a6', '#d9a07a', '#b0765a', '#7a4e3c');
/** Hair: steel grey, combed back with a lot of product. */
const HAIR = ramp('#d6d9e0', '#a4a9b6', '#767c8c', '#4e5262');
/** The suit: corporate grey, one size too big (it was bought for the photo). */
export const SUIT = ramp('#9aa0b2', '#727889', '#555a6a', '#3a3d4c');
/** The company tie, burgundy with a pattern of tiny logos. */
const TIE = ramp('#d0505a', '#a42f3f', '#7a2030', '#521420');
/**
 * Executive chair: oxblood imitation leather (black would vanish into the grey carpet, and
 * oxblood is the colour of the chairs where decisions are taken).
 */
export const LEATHER = ramp('#b0606a', '#84384a', '#5e2636', '#3c1824');
/** The reflection in his glasses: a spreadsheet, cells and a green total. */
export const SHEET = ramp('#e8f6ee', '#bfe4cf', '#7fbf9a', '#4a8a66');
const SHEET_RED = hx('#e0453b');
/** Polished black shoes: the shine is the only thing about him that is not grey. */
const SHOE = ramp('#6a6878', '#3a3848');

/** A big hand, 7x7 and rounded, like the other bosses'. */
function bigHand(cv: Canvas, x: number, y: number, R: Ramp = DSKIN): void {
  cv.rect(x, y, 7, 7, R[1]!);
  cv.rect(x, y, 6, 1, R[0]!);
  cv.rect(x + 6, y, 1, 7, R[2]!);
  cv.rect(x + 1, y + 6, 6, 1, R[2]!);
  clear(cv, [[x, y + 6], [x + 6, y]]);
  // A signet ring on the big hands: the company's, gold.
  cv.set(x + 1, y + 3, YEL[1]!);
}

export interface HeadLook {
  /** Seen from behind (spinning): all hair, and the shop tag still on the jacket collar. */
  back?: boolean;
  /** Phase 3: the smile goes, the brows come down, a vein on the temple. */
  angry?: boolean;
  /** The glasses flash white (throwing, clapping, stamping: the moment he decides). */
  glint?: boolean;
}

/**
 * The head: a big block lit from the top left with its dark side on the left; the hair combed
 * back in grooves, grey at the temples; rectangular glasses that reflect a spreadsheet (you never
 * see his eyes); the profile-picture smile; the ear on the dark side. (x, y): top left of the skin.
 */
function head(cv: Canvas, x: number, y: number, look: HeadLook = {}): void {
  const w = 32;
  const h = 28;
  cv.rect(x, y, w, h, DSKIN[1]!);
  cv.rect(x, y, 4, h, DSKIN[2]!);
  cv.rect(x, y + h - 1, w, 1, DSKIN[2]!);
  cv.rect(x + w - 1, y + 1, 1, h - 2, DSKIN[2]!);
  // The square jaw: a shadow under the chin line.
  cv.rect(x + 8, y + h - 2, w - 10, 1, DSKIN[2]!);
  clear(cv, [[x, y + h - 1], [x + w - 1, y + h - 1]]);
  // Hair: a slab combed back with grooves; grey temples over the ear.
  cv.rect(x - 1, y - 5, w + 1, 8, HAIR[1]!);
  cv.rect(x - 1, y - 5, w + 1, 1, HAIR[0]!);
  cv.rect(x - 1, y - 5, 5, 14, HAIR[2]!);
  for (const gx of [8, 13, 18, 23]) cv.rect(x + gx, y - 3, 4, 1, HAIR[2]!);
  for (const gx of [6, 11, 16, 21, 26]) cv.set(x + gx, y - 4, HAIR[0]!);
  // The parting, and the quiff at the front, held up by product.
  cv.rect(x + 10, y - 5, 1, 4, HAIR[3]!);
  cv.rect(x + w - 6, y - 7, 6, 3, HAIR[1]!);
  cv.rect(x + w - 6, y - 7, 5, 1, HAIR[0]!);
  clear(cv, [[x - 1, y - 5], [x + w - 1, y - 7]]);
  if (look.back) {
    // From behind: hair all the way down to the collar.
    cv.rect(x, y + 3, w, h - 6, HAIR[1]!);
    cv.rect(x, y + 3, 5, h - 6, HAIR[2]!);
    for (let j = y + 5; j < y + h - 4; j += 4) cv.rect(x + 7, j, w - 12, 1, HAIR[2]!);
    cv.rect(x + 2, y + h - 3, w - 4, 2, DSKIN[2]!);
    return;
  }
  // The ear, on the dark side.
  cv.rect(x + 4, y + 10, 3, 6, DSKIN[2]!);
  cv.set(x + 5, y + 12, DSKIN[3]!);
  cv.set(x + 5, y + 13, DSKIN[3]!);
  // Brows: one raised, the confident one; angry, both down to the middle.
  if (look.angry) {
    for (const [dx, dy] of [[12, 6], [13, 6], [14, 7], [15, 7], [16, 8], [21, 8], [22, 7], [23, 7], [24, 6], [25, 6], [26, 6]] as Pt[]) cv.set(x + dx, y + dy, HAIR[3]!);
    // A vein on the temple.
    cv.set(x + 7, y + 4, DSKIN[3]!);
    cv.set(x + 8, y + 5, DSKIN[3]!);
    cv.set(x + 7, y + 6, DSKIN[3]!);
  } else {
    cv.rect(x + 12, y + 7, 6, 1, HAIR[3]!);
    cv.rect(x + 21, y + 6, 6, 1, HAIR[3]!);
    cv.set(x + 20, y + 7, HAIR[3]!);
  }
  // Glasses: two rectangular lenses, thin black frames, the arm back to the ear.
  cv.rect(x + 7, y + 11, 5, 1, K);
  for (const lx of [12, 21]) {
    cv.rect(x + lx, y + 9, 8, 6, K);
    cv.rect(x + lx + 1, y + 10, 6, 4, look.glint ? WHITE : SHEET[1]!);
    if (!look.glint) {
      // The spreadsheet: a header row, grid lines, one total in red.
      cv.rect(x + lx + 1, y + 10, 6, 1, SHEET[3]!);
      for (const gx of [3, 5]) cv.rect(x + lx + gx, y + 11, 1, 3, SHEET[2]!);
      cv.rect(x + lx + 1, y + 12, 6, 1, SHEET[2]!);
      cv.set(x + lx + 6, y + 13, SHEET_RED);
      cv.set(x + lx + 1, y + 11, SHEET[0]!);
    }
  }
  cv.rect(x + 20, y + 10, 1, 1, K);
  // A white glint on the top corner of each lens.
  cv.set(x + 13, y + 10, WHITE);
  cv.set(x + 22, y + 10, WHITE);
  // Nose: two pixels of shadow, a long straight one.
  cv.rect(x + 19, y + 15, 1, 3, DSKIN[2]!);
  cv.set(x + 20, y + 17, DSKIN[2]!);
  if (look.angry) {
    // The mouth: a flat line, the corners down.
    cv.rect(x + 14, y + 21, 12, 1, K);
    cv.set(x + 13, y + 22, K);
    cv.set(x + 26, y + 22, K);
  } else {
    // The profile-picture smile: closed teeth, too even, corners pulled up exactly the same.
    cv.rect(x + 13, y + 20, 14, 3, K);
    cv.rect(x + 14, y + 21, 12, 1, WHITE);
    for (const tx of [16, 19, 22]) cv.set(x + tx, y + 21, CREAM[1]!);
    cv.set(x + 12, y + 19, K);
    cv.set(x + 27, y + 19, K);
    // The dimple that has been in every photo since 2009.
    cv.set(x + 28, y + 21, DSKIN[2]!);
  }
  // Clean-shaven sheen on the cheekbone.
  cv.set(x + 27, y + 15, DSKIN[0]!);
  cv.set(x + 28, y + 16, DSKIN[0]!);
}

export interface TorsoLook {
  back?: boolean;
  /** The jacket gets longer standing up (it was always too long). */
  long?: boolean;
}

/**
 * Jacket, shirt and tie: the jacket is one size too big (the shoulders stick out past the head's
 * width, the sleeves are not drawn: hands float), wide lapels, the tie with its gold company clip
 * and the visitor's lanyard he forgot to take off. (x, y): top left of the shoulders.
 */
function torso(cv: Canvas, x: number, y: number, look: TorsoLook = {}): void {
  const w = 30;
  const h = look.long ? 22 : 17;
  cv.rect(x, y, w, h, SUIT[1]!);
  cv.rect(x, y, 5, h, SUIT[2]!);
  cv.rect(x, y, w, 1, SUIT[0]!);
  cv.rect(x + w - 1, y + 1, 1, h - 1, SUIT[2]!);
  cv.rect(x, y + h - 1, w, 1, SUIT[3]!);
  // The shoulder pads, too wide.
  cv.rect(x - 2, y + 1, 3, 4, SUIT[2]!);
  cv.rect(x + w - 1, y + 1, 3, 4, SUIT[1]!);
  cv.rect(x + w + 1, y + 1, 1, 4, SUIT[2]!);
  clear(cv, [[x - 2, y + 1], [x + w + 1, y + 1]]);
  if (look.back) {
    // From behind: the seam down the back, and the shop tag still hanging off the collar
    // (the suit goes back to the shop on Monday, like everything else).
    cv.rect(x + 15, y + 2, 1, h - 3, SUIT[2]!);
    cv.rect(x + 13, y - 1, 1, 3, WHITE);
    cv.rect(x + 11, y + 2, 5, 6, WHITE);
    cv.rect(x + 12, y + 3, 3, 1, SHEET_RED);
    cv.rect(x + 12, y + 5, 3, 1, CREAM[2]!);
    return;
  }
  // Shirt: a V of white between the lapels, the collar points.
  const mid = x + 18;
  for (let j = 0; j < 9; j++) {
    const half = Math.max(0, 4 - Math.floor(j / 2));
    cv.rect(mid - half, y + j, 2 * half + 1, 1, TOPS[1]!);
  }
  cv.set(mid - 4, y, TOPS[0]!);
  cv.set(mid + 4, y, TOPS[0]!);
  // The lapels, lighter where they catch the light.
  for (let j = 0; j < 10; j++) {
    const half = Math.max(0, 4 - Math.floor(j / 2));
    cv.set(mid - half - 1, y + j, SUIT[0]!);
    cv.set(mid - half - 2, y + j, SUIT[0]!);
    cv.set(mid + half + 1, y + j, SUIT[2]!);
  }
  // The tie: knot, blade, a pattern of tiny logos and the gold clip.
  cv.rect(mid - 1, y + 1, 3, 2, TIE[1]!);
  cv.rect(mid - 1, y + 3, 3, h - 5, TIE[1]!);
  cv.rect(mid - 1, y + 3, 1, h - 5, TIE[0]!);
  for (let j = y + 5; j < y + h - 3; j += 3) cv.set(mid + 1, j, TIE[3]!);
  cv.set(mid, y + h - 2, TIE[2]!);
  cv.rect(mid - 2, y + 8, 5, 1, YEL[1]!);
  cv.set(mid - 2, y + 8, YEL[0]!);
  // The lanyard, blue, round the neck and down to a visitor's badge clipped to the pocket.
  cv.set(x + 10, y + 1, hx('#3f66a6'));
  for (let j = 2; j < 8; j++) cv.set(x + 10 + (j >> 2), y + j, hx('#3f66a6'));
  cv.rect(x + 9, y + 8, 5, 6, WHITE);
  cv.rect(x + 9, y + 8, 5, 2, SHEET_RED);
  cv.rect(x + 10, y + 11, 3, 1, CREAM[2]!);
  cv.rect(x + 10, y + 12, 2, 1, CREAM[2]!);
  // Buttons, and the pocket square folded to a point.
  cv.set(mid + 4, y + h - 5, SUIT[3]!);
  if (look.long) cv.set(mid + 4, y + h - 9, SUIT[3]!);
  cv.rect(x + 23, y + 4, 4, 1, SUIT[3]!);
  cv.set(x + 24, y + 3, WHITE);
  cv.set(x + 25, y + 3, WHITE);
  cv.set(x + 25, y + 2, WHITE);
}

/** The executive chair: high back with a headrest (on the left: it faces right), padded seat, star base and wheels. */
function chair(cv: Canvas, x: number, y: number, look: { spin?: number } = {}): void {
  // (x, y): top left of the backrest. The seat is at y + 28, the wheels at y + 44.
  const L = LEATHER;
  // Backrest: tall, with the stitched panels of a chair that costs a salary.
  cv.rect(x, y, 13, 34, L[1]!);
  cv.rect(x, y, 13, 1, L[0]!);
  cv.rect(x, y, 2, 34, L[2]!);
  cv.rect(x + 12, y + 1, 1, 33, L[2]!);
  clear(cv, [[x, y], [x + 12, y]]);
  for (const j of [8, 16, 24]) cv.rect(x + 3, y + j, 8, 1, L[2]!);
  for (const j of [3, 11, 19, 27]) cv.set(x + 7, y + j, L[0]!);
  // Seat.
  cv.rect(x + 6, y + 30, 32, 6, L[1]!);
  cv.rect(x + 6, y + 30, 32, 1, L[0]!);
  cv.rect(x + 6, y + 35, 32, 1, L[3]!);
  cv.rect(x + 37, y + 31, 1, 4, L[2]!);
  // Gas lift.
  cv.rect(x + 20, y + 36, 3, 6, STEEL[2]!);
  cv.rect(x + 20, y + 36, 1, 6, STEEL[1]!);
  // The star base: five legs in three quarters, two seen end on.
  cv.rect(x + 6, y + 42, 32, 2, OFFICE[1]!);
  cv.rect(x + 12, y + 41, 20, 1, OFFICE[1]!);
  cv.rect(x + 6, y + 42, 32, 1, OFFICE[0]!);
  // Wheels: the glint on their hubs goes round as it rolls (`spin`, 0-2).
  const s = look.spin ?? 0;
  for (const wx of [x + 7, x + 22, x + 36]) {
    ellipse(cv, wx, y + 46, 2.2, 2.2, OFFICE[1]!);
    cv.set(wx - 1, y + 45, OFFICE[0]!);
    const [dx, dy] = ([[-1, 1], [1, -1], [1, 1]] as const)[s % 3]!;
    cv.set(wx + dx, y + 46 + dy, STEEL[1]!);
  }
}

export interface DirectorLook {
  /** Phase 3: standing up, out of the chair. */
  standing?: boolean;
  /** Seated: the feet. 'rest' on the floor in front; 'reach' stretched out to push; 'push' shoved back under the seat; 'glide' lifted, rolling. */
  feet?: 'rest' | 'reach' | 'push' | 'glide';
  /** What the hands do. */
  hands?: 'rest' | 'throw' | 'clap' | 'stamp' | 'wide';
  /** Seen from behind (spinning). */
  back?: boolean;
  angry?: boolean;
}

/** Seated legs: thighs along the seat, shins down to polished black shoes. */
function seatedLegs(cv: Canvas, feet: NonNullable<DirectorLook['feet']>): void {
  const P = SUIT;
  const shoe = (x: number, y: number): void => {
    cv.rect(x, y, 8, 3, K);
    cv.rect(x + 1, y, 6, 1, SHOE[0]!);
    cv.set(x + 6, y + 1, WHITE);
  };
  // Thighs over the front of the seat (the back one hidden).
  cv.rect(38, 53, 14, 5, P[1]!);
  cv.rect(38, 53, 14, 1, P[0]!);
  cv.rect(38, 57, 14, 1, P[2]!);
  if (feet === 'rest') {
    cv.rect(47, 57, 5, 12, P[2]!);
    cv.rect(52, 57, 1, 12, P[3]!);
    shoe(46, DIRECTOR_FLOOR - 2);
  } else if (feet === 'reach') {
    // Stretched out in front, heel down, to pull himself along.
    for (let j = 0; j < 12; j++) cv.rect(49 + (j >> 1), 57 + j, 5, 1, P[2]!);
    shoe(55, DIRECTOR_FLOOR - 2);
  } else if (feet === 'push') {
    // Shoved back under the seat, the toes on the floor: the push.
    for (let j = 0; j < 12; j++) cv.rect(46 - (j >> 1), 57 + j, 5, 1, P[2]!);
    shoe(38, DIRECTOR_FLOOR - 2);
  } else {
    // Gliding: knees up, the feet off the floor. It is the only fun he has.
    cv.rect(50, 52, 6, 5, P[1]!);
    cv.rect(50, 52, 6, 1, P[0]!);
    for (let j = 0; j < 6; j++) cv.rect(54 + (j >> 1), 57 + j, 5, 1, P[2]!);
    shoe(57, 62);
  }
}

/** Standing legs: grey trousers with a crease, black shoes; big legs lift a foot (never cross). */
function standingLegs(pose: Pose): Canvas {
  const cv = new Canvas(DIRECTOR_W, DIRECTOR_H);
  const top = 60;
  const len = DIRECTOR_FLOOR - 2 - top;
  const lb = pose.lift?.leg === -1 ? pose.lift.px : 0;
  const lf = pose.lift?.leg === 1 ? pose.lift.px : 0;
  const bx = pose.xb - DIRECTOR_REST.xb;
  const fx = pose.xf - DIRECTOR_REST.xf;
  cv.rect(27 + bx, top, 6, len - lb, SUIT[3]!);
  cv.rect(42 + fx, top, 6, len - lf, SUIT[2]!);
  cv.rect(44 + fx, top, 1, len - lf - 1, SUIT[1]!);
  for (const [x, l, back] of [[25 + bx, lb, true], [41 + fx, lf, false]] as const) {
    const y = DIRECTOR_FLOOR - 2 - l;
    cv.rect(x, y, 10, 3, K);
    cv.rect(x + 1, y, 8, 1, back ? SHOE[1]! : SHOE[0]!);
    if (!back) cv.set(x + 8, y + 1, WHITE);
  }
  return cv;
}

export const DIRECTOR_REST: Pose = { xb: 25, xf: 41, bob: 0 };

/**
 * The Director. Seated (phases 1-2): in his executive chair, which is how he moves: pushing off
 * with his feet and rolling. Standing (phase 3): out of the chair, the smile gone. 72x76.
 */
export function makeDirector(pose: Pose = DIRECTOR_REST, look: DirectorLook = {}): Canvas {
  const hands = look.hands ?? 'rest';
  const glint = hands === 'throw' || hands === 'clap' || hands === 'stamp';
  if (!look.standing) {
    const base = new Canvas(DIRECTOR_W, DIRECTOR_H);
    chair(base, 8, 24, { spin: look.feet === 'glide' ? pose.bob & 1 : 0 });
    // The back hand on the armrest side, behind him.
    const body = new Canvas(DIRECTOR_W, DIRECTOR_H);
    if (hands === 'clap') bigHand(body, 49, 38);
    else if (hands === 'wide') bigHand(body, 3, 40);
    else bigHand(body, 15, 44);
    torso(body, 22, 37);
    head(body, 22, 9, { glint, angry: look.angry });
    // The front hand: on the knee; flung up with an envelope; clapping; up with his own stamp.
    if (hands === 'throw') {
      bigHand(body, 57, 14);
      envelope(body, 60, 6);
    } else if (hands === 'clap') bigHand(body, 54, 37);
    else if (hands === 'stamp') {
      stampInHand(body, 57, 4);
      bigHand(body, 56, 18);
    } else bigHand(body, 54, 44);
    seatedLegs(base, look.feet ?? 'rest');
    const out = new Canvas(DIRECTOR_W, DIRECTOR_H);
    out.blit(base, 0, 0);
    out.blit(body, look.feet === 'reach' ? 1 : look.feet === 'push' ? -1 : 0, pose.bob);
    const done = outline(out);
    if (hands === 'clap') clapLines(done, 57, 37 + pose.bob);
    return done;
  }
  const lg = standingLegs(pose);
  const body = new Canvas(DIRECTOR_W, DIRECTOR_H);
  if (hands === 'wide') bigHand(body, 2, 38);
  else if (!look.back) bigHand(body, 15, 46);
  torso(body, 22, 38, { long: true, back: look.back });
  head(body, 22, 10, { back: look.back, angry: look.angry ?? true, glint });
  if (hands === 'wide') bigHand(body, 63, 38);
  else if (hands === 'throw') bigHand(body, 57, 30);
  else if (!look.back) bigHand(body, 55, 48);
  return outline(joinPose(lg, body, pose));
}

/** Three short white lines out of a clap (outside the outline, like the Muñeco's sparkle). */
function clapLines(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy] of [[0, -3], [0, -4], [-3, -2], [-4, -3], [3, -2], [4, -3]] as Pt[]) cv.set(x + dx, y + dy, WHITE);
}

/** A dismissal letter in his hand: a white envelope with the red wax seal of the company. */
function envelope(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 9, 7, WHITE);
  cv.rect(x, y + 6, 9, 1, CREAM[1]!);
  for (let i = 0; i < 4; i++) {
    cv.set(x + i, y + i, CREAM[2]!);
    cv.set(x + 8 - i, y + i, CREAM[2]!);
  }
  cv.rect(x + 4, y + 4, 2, 2, RED[1]!);
}

/** His own DENEGADO stamp, held up: varnished beech handle, red rubber underneath. */
function stampInHand(cv: Canvas, x: number, y: number): void {
  const WOOD = ramp('#e8b878', '#c48a4a', '#94602e', '#64401c');
  cv.rect(x + 3, y, 4, 4, WOOD[1]!);
  cv.set(x + 3, y, WOOD[0]!);
  cv.rect(x + 4, y + 4, 2, 5, WOOD[2]!);
  cv.rect(x, y + 9, 10, 4, WOOD[1]!);
  cv.rect(x, y + 9, 10, 1, WOOD[0]!);
  cv.rect(x, y + 12, 10, 2, RED[1]!);
  cv.rect(x + 1, y + 13, 8, 1, RED[2]!);
}

export const DIRECTOR_POSES: ReadonlyArray<{ name: string; pose: Pose }> = [
  { name: 'idle0', pose: DIRECTOR_REST },
  { name: 'idle1', pose: { ...DIRECTOR_REST, bob: 1 } },
  { name: 'walk0', pose: { ...DIRECTOR_REST, bob: -1, lift: { leg: -1, px: 2 } } },
  { name: 'walk1', pose: DIRECTOR_REST },
  { name: 'walk2', pose: { ...DIRECTOR_REST, bob: -1, lift: { leg: 1, px: 2 } } },
  { name: 'walk3', pose: { ...DIRECTOR_REST, bob: 1 } },
];

/** What each frame of the `director-rrhh` sheet is (the order the data will name them by). */
export const DIRECTOR_FRAMES = [
  'silla-reposo-0', 'silla-reposo-1',
  'silla-alcanza', 'silla-empuja', 'silla-rueda-0', 'silla-rueda-1',
  'silla-lanza', 'silla-palmada', 'silla-sello',
  'pie-reposo-0', 'pie-reposo-1', 'pie-anda-0', 'pie-anda-1', 'pie-anda-2', 'pie-anda-3',
  'pie-lanza', 'pie-gira-espalda', 'pie-gira-frente',
] as const;

/**
 * The boss's sheet (DIRECTOR_FRAMES): 0-1 in the chair breathing; 2-5 the push (feet out, the
 * shove, rolling with the feet up, the wheels turning); 6 throwing a letter, 7 the clap (phase 2's
 * restructuring), 8 up with his stamp; 9-14 on his feet (rest, breathing, the walk lifting a foot);
 * 15 throwing cards standing; 16-17 spinning the line of cuts, from behind and with the hands out.
 */
export function makeDirectorFrames(): Canvas[] {
  const R = DIRECTOR_REST;
  return [
    makeDirector(R),
    makeDirector({ ...R, bob: 1 }),
    makeDirector(R, { feet: 'reach' }),
    makeDirector(R, { feet: 'push' }),
    makeDirector({ ...R, bob: -1 }, { feet: 'glide' }),
    makeDirector({ ...R, bob: 0 }, { feet: 'glide' }),
    makeDirector({ ...R, bob: -1 }, { hands: 'throw' }),
    makeDirector({ ...R, bob: -1 }, { hands: 'clap' }),
    makeDirector({ ...R, bob: -1 }, { hands: 'stamp' }),
    ...DIRECTOR_POSES.map((f) => makeDirector(f.pose, { standing: true })),
    makeDirector({ ...R, bob: -1 }, { standing: true, hands: 'throw' }),
    makeDirector({ ...R, bob: -1 }, { standing: true, back: true }),
    makeDirector({ ...R, bob: -1 }, { standing: true, hands: 'wide' }),
  ];
}

// ---------------------------------------------------------------------------------------------
// His chair on its own (phase 3), his bullets, and the Sala de Juntas.

export const CHAIR_W = 44;
export const CHAIR_H = 52;

/**
 * The empty chair (phase 3, «Despido procedente»): it rolls round the room on its own and rams
 * the toaster when it has it in front. 0 standing still, 1-2 rolling (the wheels turn), 3 about to
 * ram: dust kicked up behind it (the game makes it flash too); 4 still, the shop tag on the seat
 * stirring (its idle); 5-6 rolling on, the tag blown back (its four-step roll is 1, 2, 5, 6). 44x52.
 */
export function makeChairFrames(): Canvas[] {
  const looks: Array<{ spin: number; dust?: boolean; blown?: boolean }> = [
    { spin: 0 }, { spin: 1 }, { spin: 2 }, { spin: 0, dust: true },
    { spin: 0, blown: true }, { spin: 0, blown: true }, { spin: 1, blown: true },
  ];
  // Frame 4 is the idle one: the tag only lifts at one corner.
  return looks.map((l, f) => {
    const cv = new Canvas(CHAIR_W, CHAIR_H);
    chair(cv, 2, 2, { spin: l.spin });
    // Still warm: the dent he left in the seat, and his jacket's shop tag fallen on it.
    cv.rect(16, 32, 14, 1, LEATHER[2]!);
    if (f === 4) {
      cv.rect(30, 30, 3, 3, WHITE);
      cv.set(33, 30, WHITE);
      cv.set(31, 31, SHEET_RED);
    } else if (l.blown) {
      // Blown back as it rolls: the tag flat out behind, by its string.
      cv.rect(26, 30, 4, 2, WHITE);
      cv.set(27, 30, SHEET_RED);
      cv.set(30, 31, WHITE);
    } else {
      cv.rect(30, 30, 3, 3, WHITE);
      cv.set(31, 31, SHEET_RED);
    }
    const out = outline(cv);
    // About to ram: puffs of carpet dust kicked up behind the back wheel.
    if (l.dust) for (const [x, y] of [[1, 47], [2, 46], [0, 44], [3, 43], [1, 41]] as Pt[]) out.set(x, y, hx('#c3c9d6'));
    return out;
  });
}

const CARD_COLS: Record<string, RGBA> = { a: hx('#b6f1f0'), b: hx('#69dbd8'), c: hx('#3a9ea6'), w: WHITE, r: RED[1]!, k: K };

/**
 * His business cards (enemy bullets), spinning: 4 frames of 10x8. Cyan, the other enemy colour,
 * so they do not mix with the red loyalty cards: a white card with a cyan edge, the red logo and
 * three lines of job title (flat, turning, edge on, the back).
 */
export function makeBusinessCard(): Canvas {
  const frames: Array<readonly string[]> = [
    ['bbbbbbbb', 'bwwwwwwb', 'brwkkkwb', 'bwwkkwwb', 'bbbbbbbb'],
    ['bbbbb', 'bwwwb', 'brkwb', 'bwkwb', 'bbbbb'],
    ['ab', 'bw', 'bw', 'bw', 'cb'],
    ['bbbbbbbb', 'bwwwwwwb', 'bwwbbwwb', 'bwwwwwwb', 'bbbbbbbb'],
  ];
  const sheet = new Canvas(10 * frames.length, 8);
  frames.forEach((rows, f) => {
    const cv = new Canvas(10, 8);
    paintRows(cv, Math.floor((10 - rows[0]!.length) / 2), 1, rows, CARD_COLS);
    sheet.blit(outline(cv), f * 10, 0);
  });
  return sheet;
}

/**
 * A dismissal letter in flight (thrown in an arc like the Nevera's products; it bursts into a
 * ring of sheets where it lands): 2 frames of 12x10, the front with the red seal and the back
 * with «PERSONAL Y CONFIDENCIAL» as a red line, tumbling.
 */
export function makeDismissalLetter(): Canvas {
  const frames: Array<readonly string[]> = [
    ['wwwwwwwwww', 'gwwwwwwwwg', 'wgwwwwwwgw', 'wwgwwwwgww', 'wwwgrrgwww', 'wwwwrrwwww', 'ssssssssss'],
    ['wwwwwwwwww', 'wwwwwwwwww', 'wrrrrrrrww', 'wwwwwwwwww', 'wgggggwwww', 'wwwwwwwwww', 'ssssssssss'],
  ];
  const cols: Record<string, RGBA> = { w: WHITE, g: CREAM[2]!, s: CREAM[1]!, r: RED[1]! };
  const sheet = new Canvas(12 * frames.length, 10);
  frames.forEach((rows, f) => {
    const cv = new Canvas(12, 10);
    paintRows(cv, 1, 1 + f, rows, cols);
    sheet.blit(outline(cv), f * 12, 0);
  });
  return sheet;
}

/**
 * A slide of his presentation (phase 2's rings): 9x9, a red frame round a white slide with a bar
 * chart going down, and the same slide edge on.
 */
export function makeSlide(): Canvas {
  const frames: Array<readonly string[]> = [
    ['rrrrrrr', 'rkkkwwr', 'rwwwwwr', 'rbwwwwr', 'rbbwwwr', 'rbbbwyr', 'rrrrrrr'],
    ['rrrrr', 'rkkwr', 'rbwwr', 'rbbyr', 'rrrrr'],
  ];
  const cols: Record<string, RGBA> = { r: RED[1]!, w: WHITE, k: hx('#959ba8'), b: hx('#5f93d4'), y: YEL[1]! };
  const sheet = new Canvas(9 * frames.length, 9);
  frames.forEach((rows, f) => {
    const cv = new Canvas(9, 9);
    paintRows(cv, Math.floor((9 - rows[0]!.length) / 2), Math.floor((9 - rows.length) / 2), rows, cols);
    sheet.blit(outline(cv), f * 9, 0);
  });
  return sheet;
}

/**
 * The line of cuts (phase 3): a red bullet with a white core and an arrow pointing down in it,
 * the way every chart in his presentations ends. 9x9, one frame.
 */
export function makeCut(): Canvas {
  const cv = new Canvas(9, 9);
  paintRows(cv, 1, 1, ['.rrrrr.', 'rrwwwrr', 'rwwkwwr', 'rwwkwwr', 'rwkkkwr', 'rrwkwrr', '.rrrrr.'], { r: RED[1]!, w: WHITE, k: RED[3]! });
  return outline(cv);
}

function paintRows(cv: Canvas, ox: number, oy: number, rows: readonly string[], cols: Record<string, RGBA>): void {
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const c = cols[ch];
    if (c) cv.set(ox + i, oy + j, c);
  }));
}

/** Frosted glass: pale, cold, a little see-through-looking (opaque: it stops bullets). */
const FROST = ramp('#e2ecf0', '#bfd0d8', '#93a8b4', '#667a88');

export const PARTITION_W = 72;
export const PARTITION_H = 24;

/**
 * A frosted glass partition of the Sala de Juntas, the size of three wall tiles (72x24, the top
 * rail 7 px like the cubicle partitions): aluminium frame, frosted glass with the band of film
 * that says nothing, and the company sticker. Frame 1: where it is about to slide to, a dashed
 * outline (phase 2's restructuring).
 */
export function makePartitionFrames(): Canvas[] {
  const W = PARTITION_W;
  const H = PARTITION_H;
  const cv = new Canvas(W, H);
  // The top: an aluminium rail.
  cv.rect(0, 0, W, 7, STEEL[2]!);
  cv.rect(0, 0, W, 1, STEEL[1]!);
  cv.rect(0, 3, W, 1, STEEL[3]!);
  // The glass, frosted, with a few streaks of light from the top left.
  cv.rect(0, 7, W, H - 7, FROST[1]!);
  cv.rect(0, 7, W, 1, K);
  for (let i = 0; i < 9; i++) cv.set(3 + i, 18 - i, FROST[0]!);
  for (let i = 0; i < 6; i++) cv.set(42 + i, 17 - i, FROST[0]!);
  // The band of film across the middle (the one meant to stop people looking in), and the frame
  // posts every 24 px.
  cv.rect(0, 13, W, 3, FROST[2]!);
  for (let x = 2; x < W; x += 4) cv.set(x, 14, FROST[0]!);
  for (const x of [0, 23, 24, 47, 48, W - 1]) cv.rect(x, 7, 1, H - 7, STEEL[3]!);
  // The company sticker: a red circle (somebody walked into it, now there's a sticker).
  cv.rect(33, 9, 5, 3, RED[1]!);
  cv.set(34, 9, RED[0]!);
  cv.rect(0, H - 2, W, 2, STEEL[3]!);
  cv.rect(0, H - 1, W, 1, K);
  const solid = outline(cv);
  // The outline of where it will be: dashes of white, 3 on and 2 off, round the footprint.
  const ghost = new Canvas(W, H);
  const dash = (i: number): boolean => i % 5 < 3;
  for (let x = 0; x < W; x++) {
    if (dash(x)) {
      ghost.set(x, 0, WHITE);
      ghost.set(x, H - 1, WHITE);
      ghost.set(x, 7, hx('#f4f1e8', 140));
    }
  }
  for (let y = 0; y < H; y++) if (dash(y)) {
    ghost.set(0, y, WHITE);
    ghost.set(W - 1, y, WHITE);
  }
  return [solid, ghost];
}

/** The table's wood: dark walnut veneer, polished to show off. */
const WALNUT = ramp('#8a5a3a', '#6a4028', '#4e2e1c', '#341e12');

export const TABLE_W = 168;
export const TABLE_H = 52;
/**
 * The long table's collision box (relative to its bottom-centre, PROPS['mesa-juntas']): the
 * top and the front of it, seven tiles long.
 */
export const TABLE_BOX = { x: -82, y: -40, w: 164, h: 36 } as const;

/**
 * The long table of the Sala de Juntas: walnut veneer, seven tiles long, the top seen in three
 * quarters and the front panel to the floor (bullets stop, you go round). On it: one chair's worth
 * of everything (the room's capacity is one): his leather pad, the jug and a single glass, the
 * remote of the projector, a stack of folders «Plan de Reestructuración», the name plate with his
 * title and a laptop with a chart going down; down the far side, chairs pushed in with nobody in
 * them. 168x52.
 */
export function makeBoardTable(): Canvas {
  const W = TABLE_W;
  const cv = new Canvas(W, TABLE_H);
  // The chairs on the far side, only their backs showing over the top.
  for (const x of [18, 50, 82, 114, 146]) {
    cv.rect(x - 6, 0, 12, 10, LEATHER[1]!);
    cv.rect(x - 6, 0, 12, 1, LEATHER[0]!);
    cv.rect(x - 6, 0, 2, 10, LEATHER[2]!);
    clear(cv, [[x - 6, 0], [x + 5, 0]]);
  }
  // The top: rounded ends, the light along the far edge, the reflection of the fluorescents.
  const top = 6;
  const depth = 28;
  cv.rect(2, top, W - 4, depth, WALNUT[1]!);
  cv.rect(0, top + 2, W, depth - 4, WALNUT[1]!);
  cv.rect(1, top + 1, W - 2, depth - 2, WALNUT[1]!);
  cv.rect(2, top, W - 4, 1, WALNUT[0]!);
  for (let x = 6; x < W - 6; x += 5) cv.set(x, top + 6 + (x % 3), WALNUT[2]!);
  for (const [x, len] of [[24, 30], [100, 22]] as const) {
    cv.rect(x, top + 4, len, 1, hx('#c8a078', 120));
    cv.rect(x + 3, top + 5, len - 6, 1, hx('#c8a078', 70));
  }
  // The front panel down to the floor, and the edge banding.
  const fy = top + depth;
  cv.rect(0, fy - 1, W, 1, WALNUT[0]!);
  cv.rect(2, fy, W - 4, TABLE_H - fy - 2, WALNUT[2]!);
  cv.rect(2, fy, W - 4, 1, WALNUT[3]!);
  for (const x of [2, 56, 110, W - 4]) cv.rect(x, fy, 2, TABLE_H - fy - 2, WALNUT[3]!);
  cv.rect(2, TABLE_H - 3, W - 4, 1, WALNUT[3]!);
  // The cable tray hanging under the front, a cable escaping it.
  cv.rect(64, fy + 4, 40, 2, OFFICE[1]!);
  for (let i = 0; i < 6; i++) cv.set(98 + i, fy + 6 + (i >> 1), OFFICE[0]!);
  // His end, on the right: the leather blotter, the name plate, the remote.
  cv.rect(124, top + 9, 30, 14, LEATHER[1]!);
  cv.rect(124, top + 9, 30, 1, LEATHER[0]!);
  cv.rect(128, top + 12, 18, 9, WHITE);
  for (let j = top + 14; j < top + 20; j += 2) cv.rect(130, j, 12, 1, CREAM[2]!);
  cv.rect(138, top + 19, 6, 1, RED[1]!);
  // Name plate: «DIRECTOR», a black bar of illegible letters on gold.
  cv.rect(116, top + 22, 22, 5, YEL[1]!);
  cv.rect(116, top + 22, 22, 1, YEL[0]!);
  cv.rect(116, top + 26, 22, 1, YEL[2]!);
  for (let x = 118; x < 136; x += 2) cv.set(x, top + 24, K);
  // The jug of water and the one glass.
  cv.rect(100, top + 6, 6, 9, ramp('#e8f6fa', '#b6dce8', '#7fb0c4', '#4e7a8c')[1]!);
  cv.rect(100, top + 6, 6, 1, WHITE);
  cv.set(101, top + 8, WHITE);
  cv.rect(108, top + 10, 3, 5, hx('#d4eef4'));
  cv.set(108, top + 10, WHITE);
  // The projector's remote, alone.
  cv.rect(84, top + 18, 8, 3, OFFICE[1]!);
  cv.set(90, top + 19, RED[1]!);
  // The stack of folders: «Plan de Reestructuración», each one a little skew.
  for (const [i, c] of [[0, '#3f66a6'], [1, '#a42f37'], [2, '#3f66a6'], [3, '#d6cdb2']] as const) {
    cv.rect(50 + (i % 2), top + 14 - i * 2, 20, 3, hx(c));
    cv.rect(50 + (i % 2), top + 14 - i * 2, 20, 1, hx(c, 255));
  }
  cv.rect(54, top + 9, 12, 2, WHITE);
  cv.rect(56, top + 9, 8, 1, RED[1]!);
  // The laptop: lid up, the screen with a chart going down (a red line), the light of a Monday.
  cv.rect(18, top + 3, 22, 14, OFFICE[1]!);
  cv.rect(20, top + 5, 18, 10, hx('#dff0f4'));
  for (let i = 0; i < 16; i++) cv.set(21 + i, top + 6 + Math.floor(i / 2) + (i % 3 === 0 ? -1 : 0), SHEET_RED);
  cv.rect(15, top + 17, 28, 4, STEEL[2]!);
  cv.rect(15, top + 17, 28, 1, STEEL[1]!);
  cv.rect(25, top + 19, 8, 1, STEEL[3]!);
  // A coffee ring on the veneer, somebody else's.
  for (const [dx, dy] of [[0, -2], [1, -2], [2, -1], [2, 0], [1, 1], [0, 1], [-1, 0], [-1, -1]] as Pt[]) cv.set(76 + dx, top + 24 + dy, WALNUT[3]!);
  return outline(cv);
}
