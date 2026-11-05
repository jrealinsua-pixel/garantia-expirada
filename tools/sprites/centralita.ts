// La Centralita, boss of floor 5 (Atención al Cliente): the voice menu that answers every call in
// the building and solves none (docs/DISENO.md). An old switchboard the size of a wardrobe: two
// pilot lamps for eyes, a loudspeaker for a mouth, a recorded voice that is far too friendly, and
// the cords hanging off its desk like arms, which it drags itself round the room with (it has no
// legs: nobody ever needed it to come to them). Also here: the plugs it throws, the notes of the
// hold music, the low counters that split its room into four departments and the zones of the
// voice menu («Pulse 1», «Pulse 2», «Pulse 3»).
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { C as ATT } from '../../src/art/atencion.ts';
import { CREAM, CYAN, K, OFFICE, RED, STEEL, WHITE, YEL, cube, outline, ramp, type Ramp } from '../../src/art/lib.ts';
import { stencil, stencilWidth } from '../../src/art/warehouse.ts';

type Pt = readonly [number, number];

export const CENTRALITA_W = 72;
export const CENTRALITA_H = 76;
/** The floor line: the last row with paint (the plinth and the cords on the floor). */
export const CENTRALITA_FLOOR = 72;

/** Varnished teak, the cabinet: from the days when a switchboard was a piece of furniture. */
export const TEAK = ramp('#c8925c', '#9a643c', '#724628', '#4c2e1a');
const TEAK_SIDE = ramp('#7e5234', '#663f26', '#4e2e1a', '#341e10');
const TEAK_TOP = ramp('#e2b07a', '#c08a58', '#9a6a42', '#6e4a2c');
/** The jack panel: black bakelite, a little brown with sixty years of fingers. */
export const BAKELITE = ramp('#5a5060', '#3a3242', '#28222e', '#1a1620');
/** Brass: the jack rims, the name plate, the plug tips. */
export const BRASS = ramp('#fff1a8', '#d8b050', '#a07c30', '#6a5020');
/** The pilot lamps (its eyes): warm amber glass. Phase 3: red. Mute: blank white. */
export const LAMP = ramp('#fff4c8', '#ffc24a', '#e08a24', '#9a5418');
const LAMP_RED = ramp('#ffd0c0', '#ff5a3c', '#c02a2a', '#7a1620');
/** The loudspeaker cloth: oatmeal, gone grey where the voice comes out. */
export const CLOTH = ramp('#efe6cc', '#cfc3a2', '#a89a78', '#7a6e54');
/** The cords: cloth-covered, two colours like the real ones (the arms are the long cords). */
export const CORD = ramp('#8a6a8a', '#5e4460', '#422e46', '#2a1c2e');
const CORD_RED = ramp('#e07a6a', '#b0403a', '#7e2a2a', '#521a1e');
/** The plug sleeves on the desk and on the end of the cords. */
const SLEEVE_R = ramp('#ff8a70', '#e0453b', '#a42f37', '#6a1d2a');
const SLEEVE_K = ramp('#6a6478', '#3e3a4c', '#2a2636', '#1a1622');

export type CentralitaPhase = 'menu' | 'sin-clavijas' | 'muda';

export interface CentralitaLook {
  /** menu: phases 1-2 (lamps amber, smiling); sin-clavijas: phase 3; muda: phase 3, silent. */
  phase?: CentralitaPhase;
  /** Talking: the loudspeaker cloth bulges and sound comes out of it (0 or 1, two beats). */
  talk?: 0 | 1;
  /** Which call lamps on the panel are lit this frame (calls waiting: there are always some). */
  calls?: 0 | 1;
  /** Where the arms are: rest (hanging), reach and pull (dragging), throw, raised (phase 3). */
  arms?: 'rest' | 'rest2' | 'reach' | 'plant' | 'pull' | 'push' | 'throw' | 'raised' | 'raised2' | 'limp';
  /** The whole cabinet shifted (dragging lurches it forward and back), in px. */
  dx?: number;
  dy?: number;
}

/** A point on a quadratic Bézier from a to b bending towards c. */
function bez(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

/**
 * A cord 3 px thick along a curve, lit on its upper edge, with the cloth weave every few px. The
 * long cords are the switchboard's arms; coiled near the end like a phone cord.
 */
function cord(cv: Canvas, a: Pt, c: Pt, b: Pt, R: Ramp = CORD): void {
  const pts: Pt[] = [];
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 1.6) + 4;
  for (let i = 0; i <= n; i++) {
    const [x, y] = bez(a, c, b, i / n);
    const p: Pt = [Math.round(x), Math.round(y)];
    const last = pts[pts.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) pts.push(p);
  }
  for (const [x, y] of pts) cv.rect(x - 1, y - 1, 3, 3, R[2]!);
  for (const [x, y] of pts) cv.set(x, y, R[1]!);
  for (const [x, y] of pts) if (cv.get(x, y - 1) === R[2]) cv.set(x, y - 1, R[1]!);
  pts.forEach(([x, y], i) => {
    if (i % 4 === 0) cv.set(x - 1, y - 1, R[0]!);
    if (i % 4 === 2) cv.set(x + 1, y + 1, R[3]!);
  });
}

/**
 * The big plug on the end of a cord, the switchboard's «hand»: a fat sleeve, the steel ferrule
 * and the brass tip. `dir`: where the tip points.
 */
function bigPlug(cv: Canvas, x: number, y: number, dir: 'down' | 'right' | 'up' | 'left', S: Ramp = SLEEVE_R): void {
  if (dir === 'down' || dir === 'up') {
    const sy = dir === 'down' ? y : y + 4;
    cv.rect(x, sy, 5, 6, S[1]!);
    cv.rect(x, sy, 1, 6, S[0]!);
    cv.rect(x + 4, sy, 1, 6, S[2]!);
    cv.rect(x, sy + (dir === 'down' ? 2 : 3), 5, 1, S[2]!);
    const fy = dir === 'down' ? sy + 6 : sy - 2;
    cv.rect(x + 1, fy, 3, 2, STEEL[1]!);
    cv.set(x + 1, fy, STEEL[0]!);
    const ty = dir === 'down' ? fy + 2 : fy - 2;
    cv.rect(x + 2, ty, 1, 2, BRASS[1]!);
    cv.set(x + 2, dir === 'down' ? ty + 1 : ty, BRASS[0]!);
  } else {
    const sx = dir === 'right' ? x : x + 4;
    cv.rect(sx, y, 6, 5, S[1]!);
    cv.rect(sx, y, 6, 1, S[0]!);
    cv.rect(sx, y + 4, 6, 1, S[2]!);
    cv.rect(sx + (dir === 'right' ? 2 : 3), y, 1, 5, S[2]!);
    const fx = dir === 'right' ? sx + 6 : sx - 2;
    cv.rect(fx, y + 1, 2, 3, STEEL[1]!);
    cv.set(fx, y + 1, STEEL[0]!);
    const tx = dir === 'right' ? fx + 2 : fx - 2;
    cv.rect(tx, y + 2, 2, 1, BRASS[1]!);
    cv.set(dir === 'right' ? tx + 1 : tx, y + 2, BRASS[0]!);
  }
}

/** A little spark off a pulled plug (phase 3): cyan, the colour of electricity in this game. */
function spark(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy] of [[0, 0], [-1, -1], [1, -1], [2, -2], [-2, 1], [1, 1]] as Pt[]) cv.set(x + dx, y + dy, dx === 0 ? WHITE : CYAN);
}

/**
 * The cabinet: a teak wardrobe in three quarters (light top, dark side on the left, front on the
 * right) on a plinth; the bakelite jack panel with the face on it; the desk shelf with its rows of
 * plugs standing up and the rotary dial; the doors below. (ox, oy): offset of the whole thing.
 */
function cabinet(cv: Canvas, ox: number, oy: number, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  const x = 14 + ox;
  const y = 6 + oy;
  const w = 46;
  const h = 58;
  const sw = 9;
  const th = 7;
  cube(cv, x, y, w, h, sw, th, TEAK, TEAK_SIDE, TEAK_TOP);
  const fx = x + sw;
  const fw = w - sw;
  // The cornice: a moulding along the top of the front, and the brass name plate (illegible
  // print and the year it was installed, which nobody has updated either).
  cv.rect(fx, y + th, fw, 3, TEAK[0]!);
  cv.rect(fx, y + th + 3, fw, 1, TEAK[2]!);
  cv.rect(fx + 10, y + th + 1, 16, 4, BRASS[1]!);
  cv.rect(fx + 10, y + th + 1, 16, 1, BRASS[0]!);
  cv.rect(fx + 10, y + th + 4, 16, 1, BRASS[2]!);
  for (let i = fx + 12; i < fx + 24; i += 2) cv.set(i, y + th + 2, BRASS[3]!);
  // On the dark side: the yellow post-it «Vuelva a llamar más tarde» and the grain of the teak.
  for (const gy of [18, 27, 40, 51]) cv.rect(x + 2, y + gy, sw - 4, 1, TEAK_SIDE[2]!);
  cv.rect(x + 2, y + 30, 6, 6, YEL[1]!);
  cv.rect(x + 2, y + 30, 6, 1, YEL[0]!);
  cv.rect(x + 3, y + 32, 4, 1, YEL[3]!);
  cv.rect(x + 3, y + 34, 3, 1, YEL[3]!);
  cv.set(x + 7, y + 35, YEL[2]!);

  // The jack panel: bakelite, framed in teak, rows of jacks with brass rims round the face.
  const px = fx + 2;
  const py = y + th + 5;
  const pw = fw - 4;
  const ph = 22;
  cv.rect(px, py, pw, ph, BAKELITE[1]!);
  cv.rect(px, py, pw, 1, BAKELITE[3]!);
  cv.rect(px, py, 1, ph, BAKELITE[3]!);
  cv.rect(px + pw - 1, py + 1, 1, ph - 1, BAKELITE[0]!);
  const faceX0 = px + 5;
  const faceX1 = px + pw - 4;
  let jack = 0;
  for (let jy = py + 3; jy < py + ph - 2; jy += 4) {
    for (let jx = px + 2; jx < px + pw - 2; jx += 4) {
      // The face sits in the middle: jacks only round it.
      if (jx >= faceX0 && jx <= faceX1 && jy >= py + 2 && jy <= py + ph - 4) continue;
      cv.rect(jx, jy, 2, 2, BAKELITE[3]!);
      cv.set(jx, jy, BRASS[2]!);
      // The call lamp above each jack: calls waiting. They blink in turns (never all off).
      const on = phase !== 'muda' && (jack + (look.calls ?? 0)) % 3 === 0;
      cv.set(jx + 1, jy - 1, on ? (phase === 'sin-clavijas' ? LAMP_RED[1]! : LAMP[1]!) : BAKELITE[2]!);
      jack++;
    }
  }
  face(cv, px + 4, py + 1, look);

  // The desk shelf: it sticks out over the doors, light on top, the plugs standing in rows at the
  // back of it, the keys in the middle and the dial on the right.
  const sy = py + ph;
  cv.rect(fx - 2, sy, fw + 5, 6, TEAK_TOP[1]!);
  cv.rect(fx - 2, sy, fw + 5, 1, TEAK_TOP[0]!);
  cv.rect(fx - 2, sy + 5, fw + 5, 2, TEAK[2]!);
  cv.rect(fx - 2, sy + 6, fw + 5, 1, TEAK[3]!);
  cv.rect(fx - 2, sy, 1, 7, TEAK[2]!);
  // The plugs on the desk (phase 3: torn out, only the holes left, and their cords gone).
  for (let i = 0; i < 8; i++) {
    const kx = fx + 1 + i * 3;
    if (phase === 'menu') {
      const S = i % 3 === 1 ? SLEEVE_K : SLEEVE_R;
      cv.rect(kx, sy - 3, 2, 4, S[1]!);
      cv.set(kx, sy - 3, S[0]!);
      cv.set(kx + 1, sy - 4, BRASS[1]!);
    } else {
      cv.rect(kx, sy + 1, 2, 1, BAKELITE[3]!);
    }
  }
  // The switch keys: a row of little levers, some up and some down.
  for (let i = 0; i < 5; i++) cv.set(fx + 3 + i * 3, sy + 3 + (i % 2), STEEL[1]!);
  // The rotary dial on the right end of the desk.
  const dx = fx + fw - 6;
  cv.rect(dx - 1, sy + 1, 7, 4, BAKELITE[1]!);
  cv.rect(dx, sy, 5, 6, BAKELITE[1]!);
  for (const [ax, ay] of [[0, 1], [2, 1], [4, 1], [0, 4], [4, 4], [2, 4]] as Pt[]) cv.set(dx + ax, sy + ay, CLOTH[0]!);
  cv.set(dx + 2, sy + 2, BRASS[1]!);

  // The doors under the desk: two panels, the brass keyhole, and on a hook the operator's
  // headset, with nobody in it (the operators were the first thing it replaced).
  const dy = sy + 7;
  const dh = y + h - 2 - dy;
  for (const [ddx, dw] of [[1, 16], [18, fw - 19]] as const) {
    cv.rect(fx + ddx, dy + 1, dw, dh - 2, TEAK[2]!);
    cv.rect(fx + ddx + 1, dy + 2, dw - 2, dh - 4, TEAK[1]!);
    cv.rect(fx + ddx + 1, dy + 2, dw - 2, 1, TEAK[0]!);
  }
  cv.rect(fx + 17, dy + 5, 1, 2, BRASS[1]!);
  cv.set(fx + 17, dy + 7, K);
  const hx0 = fx + 24;
  const hy0 = dy + 3;
  cv.rect(hx0, hy0, 2, 1, STEEL[2]!);
  // The headband, the earpiece and the boom with its mic.
  for (const [ax, ay] of [[-2, 1], [-3, 2], [-3, 3], [-3, 4], [-2, 5], [3, 1], [4, 2], [4, 3], [4, 4]] as Pt[]) cv.set(hx0 + ax, hy0 + ay, OFFICE[1]!);
  cv.rect(hx0 + 3, hy0 + 5, 3, 4, OFFICE[1]!);
  cv.set(hx0 + 3, hy0 + 5, OFFICE[0]!);
  for (const [ax, ay] of [[2, 8], [1, 9], [0, 9], [-1, 9]] as Pt[]) cv.set(hx0 + ax, hy0 + ay, STEEL[3]!);
  cv.rect(hx0 - 3, hy0 + 8, 2, 2, OFFICE[0]!);

  // The plinth: darker, scuffed by being dragged across every floor in the building.
  cv.rect(x + 1, y + h, w - 2, 8, TEAK_SIDE[2]!);
  cv.rect(x + 1, y + h, sw - 1, 8, TEAK_SIDE[3]!);
  cv.rect(fx, y + h, w - sw - 1, 1, TEAK[3]!);
  for (const sx of [fx + 4, fx + 12, fx + 21, fx + 30]) cv.rect(sx, y + h + 5, 3, 1, TEAK_SIDE[1]!);
}

/**
 * The face, on the jack panel: two pilot lamps for eyes in chrome bezels and the loudspeaker
 * below for a mouth. Menu phases: the lamps half covered from below by the bakelite, which makes
 * them smile (the smile of a recorded voice: the same for every call); the speaker cloth shaped
 * like a grin. Phase 3: red lamps under lids that slant down to the middle, and the cloth torn.
 * Mute: the lamps go blank white and the speaker dark.
 */
function face(cv: Canvas, x: number, y: number, look: CentralitaLook): void {
  const phase = look.phase ?? 'menu';
  for (const ex of [x + 3, x + 15]) {
    // Chrome bezel, 9x9 with the corners cut.
    cv.rect(ex, y + 1, 9, 9, STEEL[2]!);
    cv.rect(ex, y + 1, 9, 1, STEEL[0]!);
    cv.rect(ex, y + 1, 1, 9, STEEL[1]!);
    cv.set(ex, y + 1, BAKELITE[1]!);
    cv.set(ex + 8, y + 1, BAKELITE[1]!);
    cv.set(ex, y + 9, BAKELITE[1]!);
    cv.set(ex + 8, y + 9, BAKELITE[1]!);
    const L = phase === 'sin-clavijas' ? LAMP_RED : LAMP;
    const lit = phase === 'muda' ? null : L;
    // The glass: 7x7, round.
    const gx = ex + 1;
    const gy = y + 2;
    for (let j = 0; j < 7; j++) {
      const inset = j === 0 || j === 6 ? 2 : j === 1 || j === 5 ? 1 : 0;
      cv.rect(gx + inset, gy + j, 7 - 2 * inset, 1, lit ? L[1]! : WHITE);
    }
    if (lit) {
      cv.rect(gx + 2, gy + 1, 3, 2, L[0]!);
      cv.set(gx + 2, gy + 1, WHITE);
      cv.rect(gx + 5, gy + 4, 1, 2, L[2]!);
      cv.rect(gx + 2, gy + 5, 3, 1, L[2]!);
    } else {
      // Blank: no glint, no pupil, a grey ring. The moment to hit it.
      cv.rect(gx + 1, gy + 5, 5, 1, CREAM[1]!);
      cv.set(gx + 5, gy + 4, CREAM[1]!);
    }
    if (phase === 'menu') {
      // The smile: the bakelite covers the bottom of the lamp in an arch (^ ^).
      cv.rect(gx, gy + 5, 7, 2, BAKELITE[1]!);
      cv.rect(gx + 2, gy + 4, 3, 1, BAKELITE[1]!);
      cv.set(gx + 1, gy + 4, L[2]!);
      cv.set(gx + 5, gy + 4, L[2]!);
    } else if (phase === 'sin-clavijas') {
      // Angry: a lid slanting down towards the middle of the face.
      const inner = ex === x + 3 ? 1 : -1;
      for (let i = 0; i < 7; i++) {
        const k = inner === 1 ? i : 6 - i;
        const hgt = Math.round(k / 2);
        cv.rect(gx + i, gy, 1, hgt + 1, BAKELITE[1]!);
      }
    }
  }
  // The loudspeaker: a grin of cloth with slats, in a chrome rim.
  const mx = x + 4;
  const my = y + 12;
  const mw = 19;
  const talk = look.talk;
  const open = talk !== undefined && phase !== 'muda';
  const mh = open ? 7 : 5;
  // The grin: a crescent, the bottom edge curving up to both corners, and the corners curling up
  // past the top edge. Even angry it grins: it is a recording.
  const insets = open ? [0, 0, 0, 0, 1, 2, 4] : [0, 0, 0, 1, 3];
  const inMouth = (i: number, j: number): boolean => j >= 0 && j < mh && i >= insets[j]! && i < mw - insets[j]!;
  for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
    if (!inMouth(i, j)) continue;
    const edge = !inMouth(i - 1, j) || !inMouth(i + 1, j) || !inMouth(i, j - 1) || !inMouth(i, j + 1);
    cv.set(mx + i, my + j, edge ? STEEL[2]! : phase === 'muda' ? BAKELITE[2]! : CLOTH[1]!);
  }
  for (const [cx, cy] of [[-1, -1], [-1, 0], [mw, -1], [mw, 0]] as Pt[]) cv.set(mx + cx, my + cy, STEEL[2]!);
  cv.set(mx - 2, my - 2, STEEL[1]!);
  cv.set(mx + mw + 1, my - 2, STEEL[1]!);
  if (phase !== 'muda') {
    // Slats across the cloth; talking, they spread and the middle of the cloth goes pale.
    if (open) cv.rect(mx + 5, my + 2 + (talk === 1 ? 1 : 0), mw - 10, mh - 4 - (talk === 1 ? 1 : 0), CLOTH[0]!);
    for (let sx = mx + 3; sx < mx + mw - 2; sx += 3) for (let j = 1; j < mh - 1; j++) if (cv.get(sx, my + j) !== STEEL[2]) cv.set(sx, my + j, CLOTH[3]!);
    cv.rect(mx + 1, my + 1, mw - 2, 1, CLOTH[2]!);
    if (phase === 'sin-clavijas') {
      // Torn: a rip through the cloth, the cone showing red behind it.
      for (const [ax, ay] of [[7, 1], [8, 2], [9, 2], [10, 3], [11, 3]] as Pt[]) cv.set(mx + ax, my + ay, RED[2]!);
    }
  }
}

/** Sound coming out of the loudspeaker: three arcs to the right (two beats, so it pulses). */
function soundArcs(cv: Canvas, x: number, y: number, beat: 0 | 1): void {
  const arcs = beat === 0 ? [2, 6] : [4, 8];
  for (const r of arcs) {
    for (let j = -r; j <= r; j++) {
      const ax = x + Math.round(Math.sqrt(Math.max(0, r * r - j * j)) * 0.6);
      cv.set(ax, y + j, j === 0 ? WHITE : CLOTH[0]!);
    }
  }
}

/** The arms: the two long cords off the ends of the desk and their big plugs. */
function arms(cv: Canvas, look: CentralitaLook, back: boolean): void {
  const ox = look.dx ?? 0;
  const oy = look.dy ?? 0;
  const pose = look.arms ?? 'rest';
  const phase3 = look.phase === 'sin-clavijas' || look.phase === 'muda';
  if (back) {
    // The back cord, off the left end of the desk, behind the cabinet.
    const a: Pt = [17 + ox, 40 + oy];
    switch (pose) {
      case 'raised':
      case 'raised2': {
        const up = pose === 'raised' ? 0 : 3;
        cord(cv, a, [2, 26 + up], [5, 9 + up], CORD);
        bigPlug(cv, 3, 3 + up, 'up');
        spark(cv, 5, 1 + up);
        break;
      }
      case 'push':
        cord(cv, a, [6, 48], [3, 63], CORD);
        bigPlug(cv, 1, 61, 'down');
        break;
      case 'limp':
        cord(cv, a, [6, 62], [8, 68], CORD);
        bigPlug(cv, 1, 66, 'left', SLEEVE_K);
        break;
      default: {
        const sway = pose === 'rest2' ? 1 : 0;
        cord(cv, a, [6, 50], [6 + sway, 60], CORD);
        bigPlug(cv, 4 + sway, 58, 'down', phase3 ? SLEEVE_K : SLEEVE_R);
      }
    }
    return;
  }
  // The front cord, off the right end of the desk, in front of everything.
  const a: Pt = [61 + ox, 44 + oy];
  switch (pose) {
    case 'reach':
      // Stretched out ahead, the plug about to come down on the floor.
      cord(cv, a, [64, 50], [62, 44]);
      bigPlug(cv, 62, 42, 'right');
      break;
    case 'plant':
      cord(cv, a, [70, 50], [67, 62]);
      bigPlug(cv, 65, 62, 'down');
      break;
    case 'pull':
      // Taut: the cabinet hauls itself towards the plug.
      cord(cv, a, [66, 54], [67, 63]);
      bigPlug(cv, 65, 62, 'down');
      break;
    case 'push':
      cord(cv, a, [66, 52], [64, 60]);
      bigPlug(cv, 62, 58, 'down');
      break;
    case 'throw':
      // Whipped up and forward: the plug flies out of it (the bullet leaves from here).
      cord(cv, a, [70, 34], [64, 14]);
      bigPlug(cv, 62, 6, 'up');
      break;
    case 'raised':
    case 'raised2': {
      const up = pose === 'raised' ? 0 : 3;
      cord(cv, a, [70, 32 - up], [64, 12 + up]);
      bigPlug(cv, 62, 4 + up, 'up');
      spark(cv, 64, 2 + up);
      break;
    }
    case 'limp':
      cord(cv, a, [64, 64], [58, 68]);
      bigPlug(cv, 62, 66, 'right', SLEEVE_K);
      break;
    default: {
      const sway = pose === 'rest2' ? 1 : 0;
      // Hanging in a loop off the desk, the plug held up at the end like a hand.
      cord(cv, a, [70, 58 + sway], [66, 52 + sway]);
      bigPlug(cv, 64, 52 + sway, 'right');
    }
  }
}

/** Dust puffs off the plinth while it drags itself. */
function dust(cv: Canvas, x: number, y: number): void {
  for (const [dx, dy, a] of [[0, 0, 190], [1, -1, 150], [-1, -1, 130], [2, 0, 120], [-2, 0, 160], [0, -2, 110], [1, -3, 80], [-1, -2, 100]] as const) cv.set(x + dx, y + dy, hx('#c8c4b8', a));
}

/** One frame of the Centralita. Default: at rest, phases 1-2, the call lamps in their first beat. */
export function makeCentralita(look: CentralitaLook = {}): Canvas {
  const backLayer = new Canvas(CENTRALITA_W, CENTRALITA_H);
  arms(backLayer, look, true);
  const body = new Canvas(CENTRALITA_W, CENTRALITA_H);
  cabinet(body, look.dx ?? 0, look.dy ?? 0, look);
  const front = new Canvas(CENTRALITA_W, CENTRALITA_H);
  arms(front, look, false);
  const all = new Canvas(CENTRALITA_W, CENTRALITA_H);
  all.blit(outline(backLayer), 0, 0);
  all.blit(outline(body), 0, 0);
  all.blit(outline(front), 0, 0);
  if (look.talk !== undefined && look.phase !== 'muda') soundArcs(all, 52 + (look.dx ?? 0), 34 + (look.dy ?? 0), look.talk);
  if (look.arms === 'pull' || look.arms === 'push') {
    dust(all, 12 + (look.dx ?? 0), 70);
    dust(all, 8 + (look.dx ?? 0), 69);
  }
  return all;
}

/**
 * The frames of the Centralita's sheet, by name (for the (5b) and (5c)): phases 1-2 at rest
 * (the call lamps blink in turns, the cords sway), dragging itself (reach, plant, pull, push),
 * talking (the voice menu, two beats), throwing a plug; phase 3 without its plugs (cords up and
 * sparking, two beats), dragging faster with them, sweeping, and mute (the moment to hit it).
 */
export const CENTRALITA_FRAMES = [
  'reposo0', 'reposo1',
  'arrastra0', 'arrastra1', 'arrastra2', 'arrastra3',
  'habla0', 'habla1',
  'lanza',
  'sin-clavijas0', 'sin-clavijas1',
  'sin-clavijas-arrastra0', 'sin-clavijas-arrastra1',
  'muda',
] as const;

const LOOKS: Record<(typeof CENTRALITA_FRAMES)[number], CentralitaLook> = {
  reposo0: {},
  reposo1: { calls: 1, arms: 'rest2' },
  arrastra0: { arms: 'reach' },
  arrastra1: { arms: 'plant', calls: 1 },
  arrastra2: { arms: 'pull', dx: 1 },
  arrastra3: { arms: 'push', calls: 1 },
  habla0: { talk: 0 },
  habla1: { talk: 1, calls: 1, arms: 'rest2' },
  lanza: { arms: 'throw', talk: 0 },
  'sin-clavijas0': { phase: 'sin-clavijas', arms: 'raised' },
  'sin-clavijas1': { phase: 'sin-clavijas', arms: 'raised2', calls: 1 },
  'sin-clavijas-arrastra0': { phase: 'sin-clavijas', arms: 'pull', dx: 1 },
  'sin-clavijas-arrastra1': { phase: 'sin-clavijas', arms: 'push', calls: 1 },
  muda: { phase: 'muda', arms: 'limp' },
};

export function centralitaLook(name: (typeof CENTRALITA_FRAMES)[number]): CentralitaLook {
  return LOOKS[name];
}

export function makeCentralitaFrames(): Canvas[] {
  return CENTRALITA_FRAMES.map((n) => makeCentralita(LOOKS[n]));
}

// ---------------------------------------------------------------------------------------------
// Bullets.

/**
 * A plug, thrown: a red sleeve with a white core (enemy bullets are saturated with a white core),
 * the steel ferrule and the tip, pointing right (the game rotates it), and a stub of cord. 12x6.
 */
export function makePlugBullet(): Canvas {
  const cv = new Canvas(12, 6);
  cv.rect(0, 2, 3, 2, CORD_RED[1]!);
  cv.set(0, 2, CORD_RED[0]!);
  cv.rect(3, 1, 5, 4, RED[1]!);
  cv.rect(3, 1, 5, 1, RED[0]!);
  cv.rect(4, 2, 3, 1, WHITE);
  cv.rect(3, 4, 5, 1, RED[2]!);
  cv.rect(8, 2, 2, 2, STEEL[0]!);
  cv.set(10, 2, WHITE);
  cv.set(10, 3, STEEL[1]!);
  return outline(cv);
}

/**
 * The hold music: notes that wave their way across the room. Cyan with a white core. Frame 0 a
 * quaver, frame 1 two beamed semiquavers (the same tune, forever). 9x10.
 */
export function makeHoldNotes(): Canvas[] {
  const N = ramp('#ffffff', '#69dbd8', '#3a9ea6');
  const quaver = new Canvas(9, 10);
  quaver.rect(1, 6, 4, 3, N[1]!);
  quaver.rect(2, 5, 2, 1, N[1]!);
  quaver.set(2, 6, WHITE);
  quaver.rect(4, 0, 1, 7, N[1]!);
  quaver.rect(5, 1, 1, 2, N[1]!);
  quaver.rect(6, 2, 1, 3, N[1]!);
  quaver.set(4, 0, WHITE);
  const beamed = new Canvas(9, 10);
  for (const hx0 of [0, 4]) {
    beamed.rect(hx0, 6 + (hx0 ? -1 : 0), 3, 3, N[1]!);
    beamed.set(hx0 + 1, 6 + (hx0 ? -1 : 0), WHITE);
    beamed.rect(hx0 + 2, 0, 1, 7 + (hx0 ? -1 : 0), N[1]!);
  }
  beamed.rect(2, 0, 5, 2, N[1]!);
  beamed.rect(2, 0, 5, 1, WHITE);
  return [outline(quaver), outline(beamed)];
}

// ---------------------------------------------------------------------------------------------
// The room: the low counters of the four departments, and the zones of the voice menu.

/** The four departments the room is split into (frame order of the counter sheets). */
export const DEPARTMENTS = [
  { n: 1, name: 'Reclamaciones', color: hx('#e0453b') },
  { n: 2, name: 'Facturación', color: hx('#5f93d4') },
  { n: 3, name: 'Averías', color: hx('#f6c431') },
  { n: 4, name: 'Bajas', color: hx('#9aa0b2') },
] as const;

export const LOW_COUNTER_W = 72;
export const LOW_COUNTER_H = 30;
/** Collision box of the horizontal low counter, relative to its bottom-centre (three tiles long). */
export const LOW_COUNTER_BOX = { x: -36, y: -24, w: 72, h: 20 } as const;
export const LOW_COUNTER_V_W = 24;
export const LOW_COUNTER_V_H = 82;
/** Collision box of the vertical one (three tiles tall), relative to its bottom-centre. */
export const LOW_COUNTER_V_BOX = { x: -12, y: -76, w: 24, h: 72 } as const;

/** The department's plate on the front: its colour stripe and its number. */
function deptPlate(cv: Canvas, x: number, y: number, d: (typeof DEPARTMENTS)[number]): void {
  cv.rect(x, y, 13, 9, hx('#d8dee6'));
  cv.rect(x, y, 13, 1, WHITE);
  cv.rect(x, y, 3, 9, d.color);
  stencil(cv, x + 5, y + 1, String(d.n), hx('#2f4a6a'));
}

/**
 * A low counter, three tiles long (the counters of the Centralita's room, M11 2c2): the same
 * laminate and front as the windows of this floor (src/art/atencion.ts) but waist high and with no
 * screen, so bullets stop on it and the toaster rolls over it. On the front, the department's
 * plate; on top, a pen on a chain, the bell nobody answers and a stack of forms. One frame per
 * department. 72x30.
 */
export function makeLowCounterFrames(): Canvas[] {
  return DEPARTMENTS.map((d, i) => {
    const W = LOW_COUNTER_W;
    const cv = new Canvas(W, LOW_COUNTER_H);
    const top = 0;
    const depth = 12;
    cv.rect(0, top, W, depth, ATT.counter);
    cv.rect(0, top, W, 1, ATT.counterHi);
    cv.rect(0, top + 1, W, 1, ATT.counterHi);
    for (let gx = 5; gx < W; gx += 9) cv.set(gx, top + 4 + (gx % 4), hx('#6a8092'));
    // The front, down to the floor, the kick panel scuffed.
    const fy = top + depth;
    cv.rect(0, fy, W, LOW_COUNTER_H - fy, ATT.counterFront);
    cv.rect(0, fy, W, 1, K);
    cv.rect(0, fy + 1, W, 1, hx('#41566a'));
    cv.rect(0, LOW_COUNTER_H - 4, W, 3, hx('#25384a'));
    for (const sx of [9, 30, 51, 64]) cv.set(sx, LOW_COUNTER_H - 3, hx('#4a6276'));
    deptPlate(cv, 29, fy + 3, d);
    // On top: what each department has. All of them, a pen on a chain.
    cv.rect(8, top + 5, 6, 1, BLUE_PEN);
    for (const [ax, ay] of [[14, 6], [15, 7], [16, 7], [17, 8]] as Pt[]) cv.set(ax, top + ay, STEEL[2]!);
    if (i === 0) {
      // Reclamaciones: the bell («Toque para ser atendido»), polished by hands that gave up.
      cv.rect(50, top + 4, 7, 3, STEEL[1]!);
      cv.rect(51, top + 3, 5, 1, STEEL[0]!);
      cv.set(53, top + 2, STEEL[2]!);
      cv.rect(49, top + 7, 9, 1, STEEL[3]!);
    } else if (i === 1) {
      // Facturación: a stack of forms, each one a little skew.
      for (let k = 0; k < 3; k++) cv.rect(48 + (k % 2), top + 7 - k * 2, 12, 3, k % 2 ? CREAM[1]! : WHITE);
    } else if (i === 2) {
      // Averías: a broken phone handset nobody has come to pick up.
      cv.rect(48, top + 5, 10, 3, CREAM[2]!);
      cv.rect(48, top + 4, 3, 2, CREAM[1]!);
      cv.rect(55, top + 4, 3, 2, CREAM[1]!);
      cv.set(52, top + 6, RED[1]!);
    } else {
      // Bajas: the «cerrado» card, standing. There is always one here.
      cv.rect(49, top + 2, 10, 6, WHITE);
      cv.rect(50, top + 4, 8, 1, RED[1]!);
      cv.rect(50, top + 6, 6, 1, CREAM[2]!);
    }
    cv.rect(0, 0, 1, LOW_COUNTER_H, K);
    cv.rect(W - 1, 0, 1, LOW_COUNTER_H, K);
    return outline(cv);
  });
}

const BLUE_PEN = hx('#3f66a6');

/**
 * The vertical low counter (the north-south walls of the departments): three tiles of laminate
 * seen from above, the front at the bottom end. 24x82.
 */
export function makeLowCounterV(): Canvas {
  const W = LOW_COUNTER_V_W;
  const H = LOW_COUNTER_V_H;
  const cv = new Canvas(W, H);
  const len = H - 12;
  cv.rect(0, 0, W, len, ATT.counter);
  cv.rect(0, 0, W, 2, ATT.counterHi);
  cv.rect(0, 0, 2, len, ATT.counterHi);
  cv.rect(W - 2, 2, 2, len - 2, hx('#4e6274'));
  for (let gy = 6; gy < len; gy += 8) cv.set(6 + (gy % 11), gy, hx('#6a8092'));
  // A queue ticket left on it and the pen on its chain.
  cv.rect(8, 22, 5, 7, WHITE);
  cv.rect(9, 24, 3, 1, K);
  cv.rect(9, 26, 2, 1, CREAM[2]!);
  cv.rect(10, 48, 1, 6, BLUE_PEN);
  cv.set(11, 54, STEEL[2]!);
  cv.set(12, 55, STEEL[2]!);
  const fy = len;
  cv.rect(0, fy, W, H - fy, ATT.counterFront);
  cv.rect(0, fy, W, 1, K);
  cv.rect(0, fy + 1, W, 1, hx('#41566a'));
  cv.rect(0, H - 4, W, 3, hx('#25384a'));
  return outline(cv);
}

export const ZONE_W = 72;
export const ZONE_H = 48;

/** Text drawn at k times its size (the menu numbers are read from across the room). */
function bigStencil(cv: Canvas, x: number, y: number, text: string, c: RGBA, k: number): void {
  const w = stencilWidth(text);
  const tmp = new Canvas(w + 2, 12);
  stencil(tmp, 0, 2, text, c);
  for (let j = 0; j < tmp.h; j++) for (let i = 0; i < tmp.w; i++) {
    const p = tmp.p[j]![i]!;
    if (p[3] > 0) cv.rect(x + i * k, y + (j - 2) * k, k, k, p);
  }
}

/**
 * The zones of the voice menu painted on the floor (phase 1): a rounded rectangle with the option's
 * number and «PULSE» above it. Frames 0-2: zones 1-3 lit and waiting (pale blue, a dashed edge);
 * 3-5: the same zones when the bullets are coming (red, hatched, a solid edge). 72x48, drawn
 * semi-transparent so the floor shows through.
 */
export function makeMenuZoneFrames(): Canvas[] {
  const out: Canvas[] = [];
  for (const danger of [false, true]) {
    for (const n of [1, 2, 3]) {
      const W = ZONE_W;
      const H = ZONE_H;
      const cv = new Canvas(W, H);
      const fill: RGBA = danger ? [224, 69, 59, 70] : [150, 200, 240, 44];
      const edge: RGBA = danger ? [255, 110, 90, 230] : [214, 236, 255, 210];
      for (let j = 1; j < H - 1; j++) cv.rect(j < 3 || j > H - 4 ? 3 : 1, j, j < 3 || j > H - 4 ? W - 6 : W - 2, 1, fill);
      if (danger) {
        // Hatching: diagonal stripes, every 6 px.
        for (let j = 2; j < H - 2; j++) for (let i = 2; i < W - 2; i++) if ((i + j) % 6 === 0) cv.set(i, j, [255, 120, 100, 80]);
      }
      // The edge: rounded corners; dashed while waiting, solid when the bullets come.
      const on = (i: number): boolean => danger || i % 6 < 4;
      for (let i = 3; i < W - 3; i++) if (on(i)) {
        cv.put(i, 0, edge);
        cv.put(i, H - 1, edge);
      }
      for (let j = 3; j < H - 3; j++) if (on(j)) {
        cv.put(0, j, edge);
        cv.put(W - 1, j, edge);
      }
      const corners: Pt[] = [[1, 1], [2, 1], [1, 2], [W - 2, 1], [W - 3, 1], [W - 2, 2]];
      corners.push(...corners.map(([cx, cy]): Pt => [cx, H - 1 - cy]));
      for (const [cx, cy] of corners) cv.put(cx, cy, edge);
      // «PULSE» and the number, big.
      const label = danger ? hx('#ffd0c0') : hx('#e6f2fa');
      const pw = stencilWidth('PULSE');
      stencil(cv, Math.floor((W - pw) / 2), 6, 'PULSE', label);
      const nw = stencilWidth(String(n)) * 3;
      bigStencil(cv, Math.floor((W - nw) / 2), 17, String(n), danger ? WHITE : label, 3);
      out.push(cv);
    }
  }
  return out;
}
