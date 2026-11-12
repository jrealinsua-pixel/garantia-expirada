// M13 (6): el Móvil Reacondicionado, fifth playable character, with its starting weapon (the
// Notificaciones Push), its notification bubbles, the black screen it shows while switched off and
// the empty battery that blinks over it before that.
//
// Drawn by the toaster's rules (docs/ESTILO_ARTE.md): same 40 x 41 frame and eight frames (idle x2,
// walk x4, hurt, broken), a 3/4 slab (dark edge on the left, the screen as its face on the right),
// floating back hand, short legs, 1 px outline. Its jokes: the case in «oro rosa» (it was traded in
// for the new model, the same one in another colour), the screen cracked from one corner, the
// battery icon in red at 1 %, a notification badge it never reads and the charging cable it drags
// about, taped where it frays.
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { GLOW, GLOW2, K, RED, WHITE, YEL, box, cube, feet, hand, outline, ramp } from '../../src/art/lib.ts';

type Pt = readonly [number, number];

/** The case: «oro rosa», so it never reads as the grey toaster, the violet blender or the white intern. */
export const ROSE = ramp('#fdd9c8', '#f0a994', '#c97b70', '#8a4c52');
const ROSE_SIDE = ramp('#c47f72', '#a4635c', '#83494a', '#5a3036');
const ROSE_TOP = ramp('#fce6da', '#f8d3c0', '#e2a48e', '#b8746a');
/** The screen: a dark glass, a bit blue, and the crack in a pale blue-grey. */
export const SCREEN = ramp('#3d4c7a', '#242d4e', '#171d36', '#0e0c16');
const CRACK: RGBA = [176, 190, 214, 255];
/** The charging cable and the trainers: white plastic gone grey. */
const CABLE = ramp('#f4f1e8', '#d3d8e4', '#9aa2b8', '#6a708c');
const TAPE: RGBA = YEL[1]!;

export interface PhonePose {
  xb: number;
  xf: number;
  bob: number;
  face?: 'hurt' | 'broken' | 'off';
  frame: number;
}

export const PHONE_W = 40;
export const PHONE_H = 41;

/** Its front screen's rectangle (inside the bezel). */
const SX = 14;
const SY = 7;
const SW = 15;
const SH = 19;

/** The crack: from the top back corner of the screen, branching down across it. */
const CRACK_PTS: Pt[] = [
  [28, 25], [27, 24], [26, 23], [26, 22], [25, 21], [25, 20],
  [27, 22], [28, 21], [28, 20],
  [25, 24], [24, 25],
  [14, 8], [15, 9], [15, 10], [16, 8],
];

/**
 * Móvil Reacondicionado, three-quarter view facing right: the phone stands on end, its rose
 * case's edge on the left and the screen on the right, where its face is. `off`: switched off by
 * «Batería al 1 %»: the screen black with the logo (a power symbol) and nothing else.
 */
export function makePhone(pose: PhonePose): Canvas {
  const cv = new Canvas(PHONE_W, PHONE_H);
  const body = new Canvas(PHONE_W, PHONE_H);
  const broken = pose.face === 'broken';
  const off = pose.face === 'off';
  if (!broken) hand(body, 5, 22);
  feet(cv, pose.xb, pose.xf, 30, { L: 4, shoe: CABLE });
  // The slab: the rose case, with its thin dark edge on the left and the camera bump on top.
  cube(body, 9, 3, 22, 28, 3, 2, ROSE, ROSE_SIDE, ROSE_TOP);
  // The volume buttons on the edge.
  body.rect(10, 7, 1, 3, ROSE_SIDE[3]!);
  body.rect(10, 12, 1, 2, ROSE_SIDE[3]!);
  // The screen with its bezel.
  body.rect(SX - 1, SY - 1, SW + 2, SH + 2, K);
  body.rect(SX, SY, SW, SH, SCREEN[off || broken ? 3 : 1]!);
  if (!off && !broken) {
    // A faint shine down the glass and the status bar along the top.
    body.rect(SX, SY, SW, 1, SCREEN[0]!);
    body.set(SX + SW - 2, SY + 3, SCREEN[0]!);
    body.set(SX + SW - 2, SY + 4, SCREEN[0]!);
    // The clock (always 9:41 somewhere) and the battery at 1 %: a red sliver in an empty outline.
    body.rect(SX + 1, SY + 1, 2, 1, WHITE);
    body.rect(SX + 7, SY + 1, 4, 1, WHITE);
    body.rect(SX + 8, SY + 1, 2, 1, SCREEN[2]!);
    body.set(SX + 8, SY + 1, RED[1]!);
    body.set(SX + 11, SY + 1, WHITE);
    // The notification badge in the corner, never read.
    body.rect(SX + SW - 1, SY - 2, 2, 2, RED[1]!);
    body.set(SX + SW - 1, SY - 2, RED[0]!);
  }
  if (off) {
    // Switched off: just the logo, a power symbol in the middle of the black glass.
    const cx = SX + 6;
    const cy = SY + 9;
    const ring: Pt[] = [
      [cx - 1, cy - 2], [cx - 2, cy - 1], [cx - 2, cy], [cx - 2, cy + 1], [cx - 1, cy + 2], [cx, cy + 2],
      [cx + 1, cy + 2], [cx + 2, cy + 2], [cx + 3, cy + 1], [cx + 3, cy], [cx + 3, cy - 1], [cx + 2, cy - 2],
    ];
    for (const [x, y] of ring) body.set(x, y, CABLE[1]!);
    body.rect(cx, cy - 3, 2, 3, WHITE);
  } else if (broken) {
    // Dead: black glass with the crack all over it.
    for (const [x, y] of [...CRACK_PTS, [24, 19], [23, 18], [22, 17], [21, 16], [20, 15], [19, 14], [18, 13], [17, 12], [16, 11], [21, 18], [20, 19]] as Pt[]) body.set(x, y, CRACK);
  } else {
    // The face on the screen: two big rounded eyes, one under the crack, and a small mouth.
    for (const ex of [17, 23]) {
      if (pose.face === 'hurt') {
        const back = ex === 17;
        const pts: Pt[] = back ? [[ex, 12], [ex + 1, 13], [ex + 2, 14], [ex + 1, 15], [ex, 16]] : [[ex + 2, 12], [ex + 1, 13], [ex, 14], [ex + 1, 15], [ex + 2, 16]];
        for (const [x, y] of pts) body.set(x, y, WHITE);
      } else {
        body.rect(ex, 12, 3, 5, WHITE);
        body.set(ex, 12, SCREEN[1]!);
        body.set(ex + 2, 16, SCREEN[1]!);
        // Pupils looking ahead; one eye blinks shut on the second idle frame.
        body.rect(ex + 1, 14, 2, 2, K);
        if (pose.frame === 1 && ex === 17) {
          body.rect(ex, 12, 3, 5, SCREEN[1]!);
          body.rect(ex, 15, 3, 1, WHITE);
        }
      }
    }
    // The mouth: a small worried line (open when hurt).
    if (pose.face === 'hurt') body.rect(20, 19, 3, 2, WHITE);
    else {
      body.rect(19, 20, 4, 1, WHITE);
      body.set(18, 19, WHITE);
    }
    // The home bar.
    body.rect(SX + 3, SY + SH - 2, SW - 6, 1, SCREEN[0]!);
    // The crack, over everything.
    for (const [x, y] of CRACK_PTS) body.set(x, y, CRACK);
  }
  cv.blit(body, 0, pose.bob);
  const o = outline(cv);
  // The charging cable: out of the bottom port, round behind the back leg, dragged along the floor
  // with yellow tape where it frays. Broken, it has come out and lies there.
  const cable: Pt[] = broken
    ? [[28, 35], [29, 35], [30, 35], [31, 35], [32, 34], [33, 34], [34, 35], [35, 35]]
    : [[10, 31], [9, 32], [8, 33], [7, 34], [6, 35], [5, 35], [4, 35], [3, 35], [2, 34]];
  for (const [x, y] of cable) o.set(x, y + (y < 33 && !broken ? pose.bob : 0), CABLE[2]!);
  const [tx, ty] = broken ? [32, 34] : [5, 35];
  o.set(tx, ty, TAPE);
  o.set(tx + 1, ty, TAPE);
  return o;
}

/** The eight game frames (CharacterLook): idle ×2, walk ×4, hurt, broken. */
export const PHONE_FRAMES: readonly PhonePose[] = [
  { xb: 13, xf: 19, bob: 0, frame: 0 },
  { xb: 13, xf: 19, bob: 1, frame: 1 },
  { xb: 12, xf: 20, bob: 0, frame: 0 },
  { xb: 15, xf: 17, bob: -1, frame: 2 },
  { xb: 19, xf: 13, bob: 0, frame: 0 },
  { xb: 17, xf: 15, bob: -1, frame: 2 },
  { xb: 14, xf: 18, bob: 1, frame: 0, face: 'hurt' },
  { xb: 13, xf: 19, bob: 1, frame: 0, face: 'broken' },
];

export function makePhoneFrames(): Canvas[] {
  return PHONE_FRAMES.map((p) => makePhone(p));
}

/** Switched off («Batería al 1 %»): standing still, the black screen and the logo. */
export function makePhoneOff(): Canvas {
  return makePhone({ xb: 13, xf: 19, bob: 1, frame: 0, face: 'off' });
}

/**
 * Notificaciones Push in the hand (18 x 11, mouth to the right): a gold notification bell lying on
 * its side on a black handle, its clapper showing, and the red badge with a «1» on top.
 */
export function makeNotifier(): Canvas {
  const cv = new Canvas(18, 11);
  const BELL = ramp('#fff1a8', '#f6c431', '#d9932a', '#8f5a1c');
  // Handle.
  cv.rect(3, 7, 3, 4, SCREEN[2]!);
  cv.set(3, 7, SCREEN[0]!);
  cv.rect(1, 6, 7, 2, SCREEN[1]!);
  // The bell on its side, widening to the right.
  for (let x = 6; x <= 15; x++) {
    const r = x < 9 ? 1 : x < 13 ? 2 : 3;
    cv.rect(x, 5 - r, 1, r * 2 + 1, BELL[1]!);
    cv.set(x, 5 - r, BELL[0]!);
    cv.set(x, 5 + r, BELL[2]!);
  }
  cv.rect(16, 1, 1, 9, BELL[2]!);
  cv.set(16, 5, BELL[3]!);
  cv.set(17, 5, BELL[2]!);
  // The red badge with its «1».
  box(cv, 9, 0, 4, 4, RED);
  cv.rect(11, 1, 1, 2, WHITE);
  return outline(cv);
}

/**
 * A notification (player bullet of the Notificaciones Push, radius 3): a little orange speech
 * bubble with a white «!» and its tail, as the rules for player bullets ask (orange and yellow).
 */
export function makeNotification(): Canvas {
  const cv = new Canvas(7, 8);
  const pat = ['.3333..', '311113.', '312113.', '312114.', '311114.', '312114.', '.4444..', '.44....'];
  const cols: Record<string, RGBA> = { '1': GLOW, '2': WHITE, '3': YEL[0]!, '4': GLOW2 };
  pat.forEach((row, j) => [...row].forEach((ch, i) => ch !== '.' && cv.set(i, j, cols[ch]!)));
  return cv;
}

/** The empty battery that blinks over the Móvil the last second before it switches off (11 x 7). */
export function makeLowBattery(): Canvas {
  const cv = new Canvas(11, 7);
  cv.rect(1, 1, 8, 5, WHITE);
  cv.rect(2, 2, 6, 3, SCREEN[3]!);
  cv.rect(2, 2, 1, 3, RED[1]!);
  cv.rect(9, 2, 1, 3, WHITE);
  return outline(cv);
}
