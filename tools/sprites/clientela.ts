// The four enemies of floor 5 (Atención al Cliente), M11 (4s): the sprites only; each one's
// simulation is its own task (4a)-(4d). Drawn by the same rules as the rest
// (docs/ESTILO_ARTE.md): 3/4 cube heads looking right, floating 3x3 hands, short legs with their
// own shoes, 1 px outline. Also here: what they throw and what they leave on the floor (the turn
// circle, the queue belt, the FAQ shield).
//
//  - Dispensador de Turnos: the «take a number» machine on its stand.
//  - Postes de Cola: two chrome stanchions with a retractable belt between them.
//  - Asistente Virtual: a touch-screen totem with a cartoon face that never changes.
//  - Teléfono de Recepción: a beige desk phone with too many keys, its handset dangling.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { K, OFFICE, PANTL, RED, RUSTR, STEEL, WHITE, YEL, clear, cube, ellipse, hand, outline, pad, ramp } from '../../src/art/lib.ts';
import { stencil, stencilWidth } from '../../src/art/warehouse.ts';
import { joinPose, narrowPoseCycle, poseCycle, poseFeet, type Pose } from './pose.ts';

type Pt = readonly [number, number];

/** 3x5 digits for the little displays (a 7-segment look, in pixels). */
const DIGITS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '8': ['###', '#.#', '###', '#.#', '###'],
};

function digits(cv: Canvas, x: number, y: number, text: string, c: RGBA): void {
  [...text].forEach((ch, i) => {
    DIGITS[ch]!.forEach((row, ry) => {
      [...row].forEach((p, rx) => {
        if (p === '#') cv.set(x + i * 4 + rx, y + ry, c);
      });
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Dispensador de Turnos

/** The dispenser's red: darker and browner than the bullets' red, so a ticket never hides on it. */
export const DISP = ramp('#ee7a62', '#c23a30', '#8a2a2e', '#5a1a22');
const DISP_SIDE = ramp('#8a2a2e', '#74232a', '#5a1a22', '#3e1218');
const DISP_TOP = ramp('#ffa088', '#ee7a62', '#c23a30', '#8a2a2e');
/** Ticket paper: off-white, gone a little grey. */
export const PAPER = ramp('#ffffff', '#f4f1e8', '#d6d0c0', '#a8a090');
/** The LED number: always 087. */
export const LED = hx('#ff6a3c');
const LED_HOT = hx('#ffd8a0');
/** The chrome stand and its cast-iron foot. */
const CHROME = ramp('#f4f6fa', '#c2c8d6', '#8a92a8', '#5a627c');
const IRON = ramp('#6a6e80', '#4a4e60', '#363a4a', '#24263a');

export const DISP_W = 30;
export const DISP_H = 35;
export const DISP_LEGS = [10, 16] as const;
/** Frame names of the dispenser's sheet, in order. */
export const DISP_FRAMES = ['reposo0', 'reposo1', 'anda0', 'anda1', 'anda2', 'anda3', 'llama', 'escupe'] as const;

/**
 * Dispensador de Turnos (M11 4a): the «take a number» machine on its chrome stand. A red box for a
 * head, the LED display on its forehead stuck at «087» (it never changes), two eyes of a clerk who
 * has called every number in the world, and the ticket slot for a mouth with the paper roll
 * hanging out of it like a tongue. On top, the «Respete su turno» sign, crooked. Its round cast-iron
 * foot sits on two short legs. `mood`: 0 waiting, 1 calling a turn (the display flashes, a ticket
 * half out, the brows up), 2 «turno perdido» (furious, the paper tongue spat out long and torn).
 * 30x35.
 */
export function makeDispensador(pose: Pose = { xb: DISP_LEGS[0], xf: DISP_LEGS[1], bob: 0 }, mood: 0 | 1 | 2 = 0): Canvas {
  const legs = new Canvas(DISP_W, DISP_H - 1);
  const cv = new Canvas(DISP_W, DISP_H - 1);
  poseFeet(legs, pose, 28, { L: 3, leg: PANTL, shoe: OFFICE });
  // The cast-iron foot: a heavy disc, seen a little from above.
  ellipse(cv, 14.5, 27, 7.5, 1.6, IRON[1]!);
  cv.rect(9, 26, 11, 1, IRON[0]!);
  cv.rect(8, 28, 14, 1, IRON[2]!);
  // The stand: a chrome post.
  cv.rect(13, 21, 3, 6, CHROME[1]!);
  cv.rect(13, 21, 1, 6, CHROME[0]!);
  cv.rect(15, 21, 1, 6, CHROME[2]!);
  // The head: the red box.
  cube(cv, 5, 4, 20, 17, 4, 3, DISP, DISP_SIDE, DISP_TOP);
  // The side: a little round window with the paper roll inside, and a scratch.
  ellipse(cv, 7, 12, 1.4, 2.2, PAPER[2]!);
  cv.set(7, 11, PAPER[0]!);
  cv.set(6, 16, DISP_SIDE[3]!);
  // The display: «087» in red LEDs (white-hot when it calls).
  cv.rect(10, 6, 14, 7, K);
  digits(cv, 11, 7, '087', mood === 1 ? LED_HOT : LED);
  if (mood === 1) for (const [x, y] of [[9, 6], [9, 11], [24, 6], [24, 11]] as Pt[]) cv.set(x, y, YEL[0]!);
  // Eyes under the display: bored, heavy-lidded; wide when it calls; furious when you miss it.
  const ey = 14;
  for (const x of [12, 19]) {
    cv.rect(x, ey, 3, 3, K);
    if (mood !== 2) cv.set(x + 1, ey + 1, WHITE);
    if (mood === 0) cv.rect(x, ey, 3, 1, DISP[2]!);
    if (mood === 2) cv.rect(x, ey, 3, 1, DISP[2]!);
  }
  if (mood === 2) for (const [x, y] of [[11, 13], [12, 13], [13, 14], [20, 14], [21, 13], [22, 13]] as Pt[]) cv.set(x, y, K);
  // The slot (its mouth) under the eyes, and the paper tongue hanging out of it over the stand.
  cv.rect(13, 18, 9, 1, K);
  const tongue = mood === 2 ? 10 : mood === 1 ? 7 : 5;
  const tx = 15;
  cv.rect(tx, 19, 5, tongue, PAPER[1]!);
  cv.rect(tx, 19, 1, tongue, PAPER[0]!);
  cv.rect(tx + 4, 19, 1, tongue, PAPER[2]!);
  // A red number printed on the ticket and the torn zigzag edge at its end.
  cv.rect(tx + 1, 21 + (tongue > 5 ? 2 : 0), 3, 1, DISP[1]!);
  const end = 19 + tongue;
  cv.set(tx + 1, end - 1, PAPER[2]!);
  cv.set(tx + 3, end - 1, PAPER[2]!);
  clear(cv, [[tx, end - 1], [tx + 2, end - 1], [tx + 4, end - 1]]);
  if (mood === 2) {
    // Spat out: the tongue curls forward at the end and a strip tears off.
    cv.rect(tx + 5, end - 3, 2, 2, PAPER[1]!);
    cv.set(tx + 6, end - 3, PAPER[2]!);
  }
  // The sign on top: «Respete su turno», a white card on a wire, leaning back.
  cv.set(16, 4, STEEL[2]!);
  cv.set(16, 3, STEEL[2]!);
  // A card leaning back: 5, 7 and 8 px wide on its three rows.
  for (const [x, y, w] of [[11, 0, 5], [10, 1, 7], [10, 2, 8]] as const) cv.rect(x + 1, y + 1, w, 1, PAPER[1]!);
  for (const [x, y] of [[12, 2], [13, 2], [15, 2], [16, 3], [17, 3]] as Pt[]) cv.set(x, y, DISP[1]!);
  // Wear: a chip of the red off the top corner and a dribble of glue from an old sticker.
  cv.set(22, 6, DISP[3]!);
  cv.set(24, 12, DISP[0]!);
  // Hands: red, floating at its sides; up when it calls.
  const hy = mood === 1 ? 10 : 14;
  hand(cv, 1, hy + 1, DISP);
  hand(cv, 26, hy, DISP);
  const out = outline(joinPose(legs, cv, pose));
  if (mood === 2) {
    // Tickets flying off.
    for (const [x, y] of [[26, 21], [27, 24]] as Pt[]) {
      out.set(x, y, PAPER[1]!);
      out.set(x + 1, y, PAPER[1]!);
    }
  }
  return pad(out, 1);
}

/** The dispenser's frames (DISP_FRAMES): 0-1 waiting, 2-5 walking, 6 calling a turn, 7 «turno perdido». */
export function makeDispensadorFrames(): Canvas[] {
  return [
    ...poseCycle(DISP_LEGS[0], DISP_LEGS[1]).map((f) => makeDispensador(f.pose)),
    makeDispensador(undefined, 1),
    makeDispensador(undefined, 2),
  ];
}

/**
 * Its bullet: a turn ticket, red-edged with a white core (two frames: flat and fluttering,
 * for the loose ones that glide). 9x6.
 */
export function makeTicketBullets(): Canvas[] {
  return [0, 1].map((k) => {
    const cv = new Canvas(9, 7);
    const y = k ? 1 : 0;
    cv.rect(0, y + 1, 9, 4, RED[1]!);
    cv.rect(1, y + 2, 7, 2, WHITE);
    cv.rect(3, y + 2, 3, 1, RED[2]!);
    if (k) {
      // Fluttering: the two ends bent.
      cv.set(0, y + 1, [0, 0, 0, 0]);
      cv.set(8, y + 4, [0, 0, 0, 0]);
      cv.set(8, y, RED[0]!);
    } else cv.rect(0, y + 1, 9, 1, RED[0]!);
    return outline(cv);
  });
}

export const TURN_R = 40;
export const TURN_SIZE = TURN_R * 2 + 2;

/**
 * The circle a called turn lights on the floor (about 40 px of radius): frame 0 called (yellow,
 * dashed, the floor shows through; the number is written over it in game), 1 «Atendido» (green,
 * solid: here the toaster is behind the glass), 2 «Turno perdido» (red, hatched). A ring of pale
 * dots round the inside, like the floor stickers of a queue. 82x82.
 */
export function makeTurnCircleFrames(): Canvas[] {
  const S = TURN_SIZE;
  const c = TURN_R + 0.5;
  const looks: { fill: RGBA; edge: RGBA; dash: boolean; hatch?: RGBA }[] = [
    { fill: [246, 196, 49, 56], edge: [255, 226, 120, 235], dash: true },
    { fill: [88, 180, 90, 60], edge: [170, 240, 160, 235], dash: false },
    { fill: [224, 69, 59, 60], edge: [255, 110, 90, 230], dash: false, hatch: [255, 120, 100, 80] },
  ];
  return looks.map(({ fill, edge, dash, hatch }) => {
    const cv = new Canvas(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > TURN_R) continue;
      if (d > TURN_R - 2.2) {
        const a = Math.atan2(y - c, x - c);
        if (!dash || Math.floor(((a + Math.PI) / (2 * Math.PI)) * 32) % 2 === 0) cv.put(x, y, edge);
      } else if (hatch && (x + y) % 6 === 0) cv.put(x, y, hatch);
      else cv.put(x, y, fill);
    }
    // The inner ring of stickers: twelve dots.
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = Math.round(c + Math.cos(a) * (TURN_R - 7));
      const y = Math.round(c + Math.sin(a) * (TURN_R - 7));
      cv.rect(x - 1, y, 2, 1, edge);
    }
    return cv;
  });
}

// ---------------------------------------------------------------------------------------------
// Postes de Cola

/** The queue belt's blue: brighter than the floor's petrol blue, so it reads as a barrier. */
export const BELT = ramp('#9cc4ff', '#3b74e0', '#2a52a8', '#1c3672');
export const POST_W = 22;
export const POST_H = 34;
export const POST_LEGS = [8, 12] as const;
export const POST_FRAMES = ['reposo0', 'reposo1', 'anda0', 'anda1', 'anda2', 'anda3', 'dispara', 'suelta'] as const;

/**
 * Poste de Cola (M11 4b): a chrome queue stanchion. Its head is the belt cassette, a chrome drum in
 * 3/4 with the eyes of a doorman who has seen you try to slip through; the belt's clip sticks out
 * of its front. Under it, the post, and the round foot on two short legs. `mood`: 0 standing
 * guard, 1 shooting (furious, the top of the cassette flashing), 2 belt let go (the clip gone,
 * the eyes wide). `chipped`: the other post of the pair, its foot chipped down to the rust. 22x34.
 */
export function makePoste(pose: Pose = { xb: POST_LEGS[0], xf: POST_LEGS[1], bob: 0 }, mood: 0 | 1 | 2 = 0, chipped = false): Canvas {
  const legs = new Canvas(POST_W, POST_H);
  const cv = new Canvas(POST_W, POST_H);
  poseFeet(legs, pose, 28, { L: 3, leg: PANTL, shoe: OFFICE });
  // The foot: a weighted chrome-and-iron disc.
  ellipse(cv, 11, 27, 7, 1.6, IRON[1]!);
  cv.rect(6, 26, 10, 1, CHROME[2]!);
  cv.rect(5, 28, 13, 1, IRON[2]!);
  if (chipped) for (const [x, y] of [[7, 27], [8, 27], [14, 26], [16, 27], [10, 28]] as Pt[]) cv.set(x, y, RUSTR[1]!);
  // The post.
  cv.rect(10, 15, 3, 11, CHROME[1]!);
  cv.rect(10, 15, 1, 11, CHROME[0]!);
  cv.rect(12, 15, 1, 11, CHROME[2]!);
  cv.set(11, 20, CHROME[0]!);
  // The cassette: a chrome drum for a head.
  cube(cv, 4, 4, 15, 12, 3, 3, CHROME, ramp('#8a92a8', '#6e7690', '#5a627c', '#3e4460'), ramp('#ffffff', '#e4e8f0', '#c2c8d6', '#8a92a8'));
  // A blue band round the drum: the belt wound inside, showing through the slot.
  cv.rect(7, 13, 12, 1, BELT[2]!);
  cv.rect(4, 13, 3, 1, BELT[3]!);
  // Eyes: narrow, suspicious, brows straight down; furious when it shoots; wide when it lets go.
  for (const x of [10, 15]) {
    cv.rect(x, 8, 3, 3, K);
    if (mood !== 1) cv.set(x + 1, 9, WHITE);
    if (mood === 0) cv.rect(x, 8, 3, 1, CHROME[2]!);
  }
  if (mood === 1) for (const [x, y] of [[9, 7], [10, 7], [11, 8], [16, 8], [17, 7], [18, 7]] as Pt[]) cv.set(x, y, K);
  else if (mood === 0) for (const x of [10, 11, 12, 15, 16, 17]) cv.set(x, 7, K);
  // The mouth: a flat line, the corner down. Wide open when the belt snaps back.
  if (mood === 2) cv.rect(13, 11, 3, 2, K);
  else cv.rect(12, 12, 4, 1, K);
  // The clip on the end of the belt, sticking out of its front.
  if (mood !== 2) {
    cv.rect(19, 9, 2, 3, BELT[1]!);
    cv.set(19, 9, BELT[0]!);
    cv.rect(20, 10, 1, 1, STEEL[1]!);
  } else {
    // Snapped back: motion lines where it was.
    for (const y of [8, 12]) cv.set(20, y, CHROME[0]!);
  }
  if (mood === 1) for (const x of [8, 12, 16]) cv.set(x, 4, WHITE);
  // Hands: chrome, either side of the post.
  hand(cv, 4, 18, CHROME);
  hand(cv, 15, 17 - (mood === 1 ? 2 : 0), CHROME);
  return outline(joinPose(legs, cv, pose));
}

export function makePosteFrames(chipped = false): Canvas[] {
  return [
    ...narrowPoseCycle(POST_LEGS[0], POST_LEGS[1]).map((f) => makePoste(f.pose, 0, chipped)),
    makePoste(undefined, 1, chipped),
    makePoste(undefined, 2, chipped),
  ];
}

export const BELT_W = 24;
export const BELT_H = 6;

/**
 * The belt between the two posts, one piece to repeat along it: blue webbing with «HAGA COLA AQUÍ»
 * printed backwards in white (the side facing you is the back). Frame 0 slack, 1 pulling in
 * (stretched: paler, the letters drawn out). 24x6.
 */
export function makeBeltFrames(): Canvas[] {
  return [false, true].map((taut) => {
    const cv = new Canvas(BELT_W, BELT_H);
    cv.rect(0, 1, BELT_W, 4, taut ? BELT[0]! : BELT[1]!);
    cv.rect(0, 1, BELT_W, 1, taut ? WHITE : BELT[0]!);
    cv.rect(0, 4, BELT_W, 1, BELT[2]!);
    cv.rect(0, 0, BELT_W, 1, K);
    cv.rect(0, 5, BELT_W, 1, K);
    // Backwards letters: white blocks of a word, mirrored, two px tall.
    const text = taut ? '##.#.##..#.##.#.##..' : '#.##.#..##.#..#.##.#';
    for (let i = 0; i < text.length; i++) if (text[i] === '#') cv.rect(2 + i, 2, 1, 2, taut ? BELT[2]! : WHITE);
    return cv;
  });
}

/** The posts' bullet: a steel ball with a cyan sheen and a white core. 7x7. */
export function makeSteelBall(): Canvas {
  const cv = new Canvas(7, 7);
  ellipse(cv, 3, 3, 2.6, 2.6, hx('#3a9ea6'));
  ellipse(cv, 3, 3, 2, 2, hx('#69dbd8'));
  cv.rect(2, 2, 2, 2, WHITE);
  cv.set(4, 4, hx('#b6f1f0'));
  return outline(cv);
}

// ---------------------------------------------------------------------------------------------
// Asistente Virtual

/** The totem's white plastic and the screen's blue. */
const KIOSK = ramp('#ffffff', '#e2e6ee', '#b6bccb', '#848a9c');
const KIOSK_SIDE = ramp('#a8aebe', '#8f95a6', '#747a8c', '#555a6a');
const KIOSK_TOP = ramp('#ffffff', '#f4f6fa', '#e2e6ee', '#b6bccb');
export const SCREEN = ramp('#e0f6ff', '#9ad8f6', '#5aa6d6', '#2e6a9a');
export const AV_W = 27;
export const AV_H = 36;
export const AV_LEGS = [9, 14] as const;
export const AV_FRAMES = ['reposo0', 'reposo1', 'anda0', 'anda1', 'anda2', 'anda3', 'escribe0', 'escribe1'] as const;

/**
 * Asistente Virtual (M11 4c): a touch-screen totem on a narrow foot. Its face is the cartoon on the
 * screen: two dot eyes and a big smile that never changes (whatever happens, it is happy to help).
 * The screen is smeared with fingerprints and «¿En qué puedo ayudarle?» has burned into the top of
 * it; on its side, a paper sign: «Si no le entiende, hable más despacio». `typing`: 0 none,
 * 1-2 the three dots of «Escribiendo…» under the smile (two beats). 27x36.
 */
export function makeAsistente(pose: Pose = { xb: AV_LEGS[0], xf: AV_LEGS[1], bob: 0 }, typing: 0 | 1 | 2 = 0): Canvas {
  const legs = new Canvas(AV_W, AV_H);
  const cv = new Canvas(AV_W, AV_H);
  poseFeet(legs, pose, 30, { L: 3, leg: PANTL, shoe: OFFICE });
  // The foot: a narrow column and a flat plate.
  cv.rect(10, 24, 6, 5, KIOSK_SIDE[1]!);
  cv.rect(10, 24, 2, 5, KIOSK_SIDE[2]!);
  cv.rect(15, 24, 1, 5, KIOSK_SIDE[3]!);
  cv.rect(7, 29, 13, 2, KIOSK[2]!);
  cv.rect(7, 29, 13, 1, KIOSK[1]!);
  // The body: a tall white panel in 3/4.
  cube(cv, 4, 2, 18, 23, 4, 3, KIOSK, KIOSK_SIDE, KIOSK_TOP);
  // The screen and its dark bezel.
  cv.rect(9, 6, 12, 13, K);
  cv.rect(10, 7, 10, 11, SCREEN[1]!);
  cv.rect(10, 7, 10, 1, SCREEN[0]!);
  cv.rect(19, 8, 1, 10, SCREEN[2]!);
  // Burned in at the top: the ghost of «¿En qué puedo ayudarle?», a broken line of darker pixels.
  for (const x of [11, 12, 14, 15, 16, 18]) cv.set(x, 8, SCREEN[2]!);
  // The face: two dot eyes and the smile, always the same.
  cv.rect(12, 10, 2, 3, K);
  cv.rect(16, 10, 2, 3, K);
  cv.set(12, 10, WHITE);
  cv.set(16, 10, WHITE);
  for (const [x, y] of [[11, 13], [12, 14], [13, 15], [14, 15], [15, 15], [16, 15], [17, 14], [18, 13]] as Pt[]) cv.set(x, y, K);
  // Fingerprints: greasy smears where everyone pressed the face.
  for (const [x, y] of [[11, 16], [12, 17], [18, 10], [19, 11], [15, 12]] as Pt[]) cv.set(x, y, SCREEN[0]!);
  // «Escribiendo…»: three dots in a row under the smile, the lit one moving.
  if (typing) for (let i = 0; i < 3; i++) cv.set(12 + i * 3, 17, i === typing ? WHITE : SCREEN[3]!);
  // Under the screen: a card slot and a little speaker grille.
  cv.rect(11, 20, 8, 1, KIOSK[3]!);
  for (const x of [11, 13, 15, 17]) cv.set(x, 22, KIOSK[2]!);
  // The paper sign taped to its side: scribbled lines and a red underline.
  cv.rect(5, 9, 3, 7, WHITE);
  cv.set(5, 9, STEEL[1]!);
  cv.set(7, 9, STEEL[1]!);
  for (const y of [11, 13]) cv.rect(5, y, 2, 1, K);
  cv.rect(5, 15, 3, 1, RED[1]!);
  // Hands: white plastic; one raised, ready to help.
  hand(cv, 1, 14, KIOSK);
  hand(cv, 23, typing ? 9 : 12, KIOSK);
  return outline(joinPose(legs, cv, pose));
}

export function makeAsistenteFrames(): Canvas[] {
  return [
    ...poseCycle(AV_LEGS[0], AV_LEGS[1]).map((f) => makeAsistente(f.pose)),
    makeAsistente(undefined, 1),
    makeAsistente(undefined, 2),
  ];
}

/**
 * Its bullet: a speech bubble, cyan with a white core and a tail. Frame 0 flying, frame 1 stopped
 * halfway with «…» inside (it is typing). 11x9.
 */
export function makeBubbleFrames(): Canvas[] {
  const C3 = ramp('#ffffff', '#69dbd8', '#3a9ea6');
  return [false, true].map((dots) => {
    const cv = new Canvas(11, 9);
    cv.rect(1, 0, 9, 6, C3[1]!);
    cv.rect(0, 1, 11, 4, C3[1]!);
    cv.rect(2, 1, 7, 4, WHITE);
    cv.rect(1, 2, 9, 2, WHITE);
    // The tail, down at the back.
    cv.rect(2, 6, 2, 1, C3[1]!);
    cv.set(1, 7, C3[1]!);
    if (dots) for (const x of [3, 5, 7]) cv.set(x, 3, C3[2]!);
    return outline(cv);
  });
}

export const FAQ_W = 8;
export const FAQ_H = 30;

/**
 * «Pregunta frecuente»: the shield of canned answers it puts up on the side it is being shot from.
 * A curved stack of little speech bubbles, translucent cyan, each with a line of text. Frame 0 up,
 * 1 fading. 8x30 (drawn on the left of the totem; the game turns it to face the shots).
 */
export function makeFaqShieldFrames(): Canvas[] {
  return [230, 120].map((a) => {
    const cv = new Canvas(FAQ_W, FAQ_H);
    for (let i = 0; i < 5; i++) {
      const y = 1 + i * 6;
      // The arc: the middle bubbles further out.
      const x = i === 2 ? 0 : i === 1 || i === 3 ? 1 : 2;
      const fill: RGBA = [105, 219, 216, Math.round(a * 0.55)];
      const edge: RGBA = [214, 250, 248, a];
      cv.rect(x, y, 6, 5, fill);
      for (let k = 0; k < 6; k++) {
        cv.put(x + k, y, edge);
        cv.put(x + k, y + 4, edge);
      }
      cv.put(x, y + 1, edge);
      cv.put(x, y + 2, edge);
      cv.put(x, y + 3, edge);
      cv.put(x + 5, y + 1, edge);
      cv.put(x + 5, y + 2, edge);
      cv.put(x + 5, y + 3, edge);
      cv.rect(x + 1, y + 2, i % 2 ? 3 : 4, 1, [255, 255, 255, a]);
    }
    return cv;
  });
}

/**
 * When it breaks: «¿Le he ayudado?», and the two buttons fall out as slow bullets. Frame 0 «SÍ»
 * (cyan), frame 1 «NO» (red); both with a white face. 13x9.
 */
export function makeHelpButtons(): Canvas[] {
  return [
    { text: 'SI', R: ramp('#ffffff', '#69dbd8', '#3a9ea6') },
    { text: 'NO', R: RED },
  ].map(({ text, R }) => {
    const cv = new Canvas(13, 10);
    cv.rect(0, 0, 13, 9, R[1]!);
    cv.rect(0, 8, 13, 1, R[2]!);
    cv.rect(1, 1, 11, 6, WHITE);
    const w = stencilWidth(text);
    stencil(cv, Math.floor((13 - w) / 2), 1, text, R[2]!);
    return outline(cv);
  });
}

// ---------------------------------------------------------------------------------------------
// Teléfono de Recepción

/** The phone's beige plastic, yellowed by thirty years of reception desks. */
export const PHONE = ramp('#f2e6c8', '#d8c69c', '#ad9a72', '#7c6c4e');
const PHONE_SIDE = ramp('#ad9a72', '#968460', '#7c6c4e', '#584c36');
const PHONE_TOP = ramp('#fff6dc', '#f2e6c8', '#d8c69c', '#ad9a72');
/** The «message waiting» light: always on. */
export const MSG = hx('#ff3c3c');
const POSTIT = ramp('#fff8a8', '#f6e05a', '#d4b832', '#9a8420');
export const PHONE_W = 36;
export const PHONE_H = 30;
export const PHONE_LEGS = [13, 19] as const;
export const PHONE_FRAMES = ['reposo0', 'reposo1', 'agacha', 'aire', 'suena0', 'suena1', 'pasa'] as const;

/**
 * Teléfono de Recepción (M11 4d): a beige desk phone with far too many keys, hopping about and
 * dragging its coiled cord. The cradle on top is empty: its handset hangs off the back on the curly
 * cord. Tired receptionist eyes over the keypad, the «message waiting» light always red, and a
 * yellow post-it stuck on top: «Ext. 0». `look`: 0 standing, 1 crouching to hop, 2 in the air
 * (legs tucked, the handset swinging up), 3-4 ringing (it shakes, the eyes screwed shut, the
 * handset jumping; two beats), 5 «Le paso con un compañero» (looking away, the smile of someone
 * passing you on). 36x30.
 */
export function makeTelefono(look: 0 | 1 | 2 | 3 | 4 | 5 = 0, bob = 0): Canvas {
  const legs = new Canvas(PHONE_W, PHONE_H);
  const cv = new Canvas(PHONE_W, PHONE_H);
  const crouch = look === 1 ? 2 : 0;
  const air = look === 2;
  const ring = look === 3 || look === 4;
  const jx = look === 3 ? -1 : look === 4 ? 1 : 0;
  const top = 9 + crouch - (air ? 3 : 0) + bob;
  if (!air) poseFeet(legs, { xb: PHONE_LEGS[0], xf: PHONE_LEGS[1], bob: 0 }, 24, { L: 2, leg: PANTL, shoe: OFFICE });
  else {
    // Tucked under it in the air.
    legs.rect(13, top + 15, 4, 2, OFFICE[2]!);
    legs.rect(18, top + 15, 4, 2, OFFICE[1]!);
  }
  const x0 = 8 + jx;
  const bodyH = 15 - crouch;
  // The coiled cord out of the back, down to the handset hanging behind it.
  const hy = air ? top + 2 : ring ? top + 4 + (look === 3 ? -2 : 0) : top + 6;
  for (let k = 0; k < 4; k++) {
    const cy = top + 4 + k * ((hy - top) / 4 + 0.5);
    cv.set(x0 - 1 - (k % 2), Math.round(cy), PHONE_SIDE[2]!);
    cv.set(x0 - 2 + (k % 2), Math.round(cy) + 1, PHONE_SIDE[1]!);
  }
  // The handset: a C on its side, earpiece up, mouthpiece down.
  const hx0 = x0 - 6;
  cv.rect(hx0, hy, 2, 10, PHONE[1]!);
  cv.rect(hx0, hy, 1, 10, PHONE[0]!);
  cv.rect(hx0, hy, 5, 3, PHONE[1]!);
  cv.rect(hx0, hy + 7, 5, 3, PHONE[1]!);
  cv.rect(hx0, hy, 5, 1, PHONE[0]!);
  cv.rect(hx0 + 2, hy + 2, 3, 1, PHONE[2]!);
  cv.rect(hx0 + 2, hy + 9, 3, 1, PHONE[2]!);
  for (const y of [hy + 1, hy + 8]) cv.set(hx0 + 3, y, PHONE[3]!);
  // The body: a low wedge, wider than tall.
  cube(cv, x0, top, 21, bodyH, 4, 4, PHONE, PHONE_SIDE, PHONE_TOP);
  // The empty cradle: two prongs sticking up, nothing on them.
  for (const px of [x0 + 7, x0 + 16]) {
    cv.rect(px, top - 2, 2, 3, PHONE_SIDE[1]!);
    cv.set(px, top - 2, PHONE[0]!);
  }
  // The post-it on top, between the prongs: «Ext. 0».
  cv.rect(x0 + 10, top - 1, 5, 4, POSTIT[1]!);
  cv.rect(x0 + 10, top - 1, 5, 1, POSTIT[0]!);
  cv.set(x0 + 14, top + 2, POSTIT[2]!);
  cv.rect(x0 + 11, top + 1, 1, 1, K);
  cv.rect(x0 + 13, top, 1, 2, K);
  // The face on the front: eyes over the keypad.
  const ey = top + 5;
  const ex = x0 + 8;
  for (const x of [ex, ex + 6]) {
    if (ring) {
      // Screwed shut: > <.
      cv.rect(x, ey + 1, 3, 1, K);
      cv.set(x + (x === ex ? 0 : 2), ey, K);
      continue;
    }
    cv.rect(x, ey, 3, 3, K);
    cv.set(x + (look === 5 ? 0 : 1), ey + 1, WHITE);
    cv.rect(x, ey, 3, 1, PHONE[2]!);
  }
  // The mouth: a polite, worn-out line; a smirk when it passes you on; open when it rings.
  if (ring) cv.rect(ex + 3, ey + 4, 3, 2, K);
  else if (look === 5) {
    cv.rect(ex + 2, ey + 4, 4, 1, K);
    cv.set(ex + 6, ey + 3, K);
  } else cv.rect(ex + 2, ey + 4, 4, 1, K);
  // The keypad: rows of little keys, and a column of red function keys.
  const ky = ey + 6 - crouch;
  if (ky + 2 < top + bodyH - 1) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) cv.rect(x0 + 6 + c * 3, ky + r * 2, 2, 1, c === 3 ? RED[2]! : PHONE[3]!);
  }
  // The «message waiting» light, always on.
  cv.rect(x0 + 18, top + 5, 2, 2, MSG);
  cv.set(x0 + 18, top + 5, hx('#ffb0a0'));
  // Hands: beige, floating at the front; up in the air when it rings.
  hand(cv, x0 + 22, top + (ring ? 2 : 7), PHONE);
  const out = outline(joinPose(legs, cv, { xb: 0, xf: 0, bob: 0 }));
  if (ring) {
    // The ring: little arcs either side.
    const c = look === 3 ? WHITE : YEL[0]!;
    for (const [x, y] of [[x0 + 24, top - 2], [x0 + 25, top - 1], [x0 + 25, top], [x0 + 24, top + 1], [x0 + 2, top - 3], [x0 + 1, top - 2], [x0 + 1, top - 1]] as Pt[]) {
      out.set(x, y, c);
    }
  }
  return out;
}

/** The phone's frames (PHONE_FRAMES): 0-1 standing, 2 crouching, 3 in the air, 4-5 ringing, 6 passing you on. */
export function makeTelefonoFrames(): Canvas[] {
  return [makeTelefono(0), makeTelefono(0, 1), makeTelefono(1), makeTelefono(2), makeTelefono(3), makeTelefono(4), makeTelefono(5)];
}

/**
 * Its call: a fat red bullet with a white core and the handset drawn on it, that homes in a little
 * (two frames, the ring pulsing). 13x13.
 */
export function makeCallBullets(): Canvas[] {
  return [0, 1].map((k) => {
    const cv = new Canvas(13, 13);
    ellipse(cv, 6, 6, 5.5, 5.5, k ? RED[0]! : RED[1]!);
    ellipse(cv, 6, 6, 3.6, 3.6, WHITE);
    // The handset: earpiece, grip, mouthpiece.
    const glyph = ['.##....', '###....', '##.....', '##.....', '.##..##', '..#####', '...###.'];
    glyph.forEach((row, gy) => [...row].forEach((p, gx) => {
      if (p === '#') cv.set(3 + gx, 3 + gy, RED[2]!);
    }));
    return outline(cv);
  });
}

