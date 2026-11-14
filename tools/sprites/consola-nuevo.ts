// M14c (a7f): La Consola Edición Coleccionista in the new style (docs/ESTILO_ARTE.md, «M14c · El
// estilo nuevo», and the bosses' size rule of (a7a)). The old sprite stays in consola.ts, which still
// draws her loot box and her bullets.
//
// A home console stood on end like a tower, in three-quarters (the dark side on the left, the front
// on the right), of piano-black gloss (`lacado`, new material): mostly deep blue-black with sharp
// cold reflections, the gold trim of the collector's edition (`laton`), short legs with rubber feet.
// The disc tray across the front is its mouth (its muzzle): it spits cartridges out of it, which
// makes no sense, and it knows. A greedy heavy-lidded stare with console-blue irises, gamer gloves
// (`violeta`) and the wired gamepad in its front hand, the cable trailing to the floor. Jokes: the
// gold plaque «000001» (of a run of four million), the «+3 %» starburst of «more content», and on
// its dark side the padlocked hatch of the downloadable content. Updating, the tray is a progress bar
// stuck near the start. «Pase de temporada»: the pass on a lanyard, the light strip in every colour,
// gold irises; and its own pose for «Remasterizada»: a brand-new «HD» sticker slapped over the old.

import type { Canvas } from '../../src/art/canvas.ts';
import { INK, SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import type { Pose } from './pose.ts';

export const CONSOLA_W = 84;
export const CONSOLA_H = 88;
/** Between its feet on the floor (EnemyDef.anchor). */
export const CONSOLA_FEET = { x: 40, y: 86 } as const;
/** The disc tray, px from the anchor: BossBrain.muzzle (the old one, kept). */
export const CONSOLA_MOUTH = { x: 14, y: 40 } as const;

/** Frames per phase (EnemyAnim.phaseShift: «Pase de temporada» is the same layout this far on). */
export const CONSOLA_PER_PHASE = 11;
/** Frame layout (EnemyAnim and the attacks' `pose` in src/data/enemies.ts). */
export const CONSOLA_FRAMES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  /** The tray out with a disc on it (the warning). */
  warn: 6,
  /** «Actualización obligatoria» (BossPhase.mute, its stun frame): the progress bar. */
  update: 7,
  /** Attack poses: spitting a cartridge; the gamepad up, mashing a combo; a loot box overhead. */
  cartridges: 8,
  gamepad: 9,
  boxes: 10,
  /** The phase change (anim.clap): the season pass comes in. */
  clap: 2 * CONSOLA_PER_PHASE,
  /** «Temporada remasterizada»'s pose (phase 2 only): the new «HD» sticker. */
  remaster: 2 * CONSOLA_PER_PHASE + 1,
  count: 2 * CONSOLA_PER_PHASE + 2,
} as const;

type Look = 'idle' | 'warn' | 'update' | 'cartridges' | 'gamepad' | 'boxes' | 'clap' | 'remaster';

const REST: Pose = { xb: 23, xf: 47, bob: 0 };
/** Rest, breathing and a heavy walk (a foot lifted 2 px, never crossed). */
const POSES: readonly Pose[] = [
  REST,
  { ...REST, bob: 1 },
  { ...REST, bob: -1, lift: { leg: -1, px: 2 } },
  REST,
  { ...REST, bob: -1, lift: { leg: 1, px: 2 } },
  { ...REST, bob: 1 },
];

// The tower: the front face, and how far the top and the left side recede.
const FX = 24;
const FY = 27;
const FW = 42;
const FH = 53;
const SIDE = 8;
const TOP = 5;
/** The tray slot's top row (its muzzle: the anchor's y minus CONSOLA_MOUTH.y). */
const TRAY = CONSOLA_FEET.y - CONSOLA_MOUTH.y;

/** Tiny 3x5 glyphs. */
const GLYPHS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '2': ['##.', '..#', '.#.', '#..', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
  '+': ['...', '.#.', '###', '.#.', '...'],
  '%': ['#.#', '..#', '.#.', '#..', '#.#'],
  '/': ['..#', '..#', '.#.', '#..', '#..'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'],
  '?': ['##.', '..#', '.#.', '...', '.#.'],
};

function text(p: Paint, x: number, y: number, s: string, m: Material, tone: number, gap = 4): void {
  [...s].forEach((ch, i) => {
    GLYPHS[ch]?.forEach((row, j) => [...row].forEach((c, k) => {
      if (c === '#') p.px(x + i * gap + k, y + j, m, tone);
    }));
  });
}

/** Short legs of dark plastic and the rubber feet that leave marks on the furniture. */
function legs(p: Paint, pose: Pose, top: number): void {
  const floor = CONSOLA_FEET.y - 1;
  for (const [x, back, leg] of [[pose.xb, true, -1], [pose.xf, false, 1]] as const) {
    const up = pose.lift && pose.lift.leg === leg ? pose.lift.px : 0;
    const yb = floor - 2 - up;
    const L = Math.max(1, yb - top);
    p.rect(x + 2, top, 5, L, 'goma', back ? 4 : 3);
    p.rect(x + 2, top, 1, L, 'goma', back ? 3 : 2);
    const sw = back ? 9 : 10;
    p.rect(x, yb, sw, 3, 'goma', back ? 2 : 1);
    p.rect(x + 1, yb, sw - 2, 1, 'goma', back ? 1 : 0);
    p.rect(x, yb + 2, sw, 1, 'goma', back ? 4 : 3);
  }
}

/** A fingerless gamer glove: the hand, the thumb, the cuff with its stripe. */
function glove(p: Paint, x: number, y: number, thumbLeft = false): void {
  p.ellipsoid(x + 4, y + 4, 4.2, 3.8, 'violeta', { dither: 0, bias: 0.05 });
  p.ellipsoid(thumbLeft ? x + 0.5 : x + 7.5, y + 2, 1.6, 2.2, 'violeta', { dither: 0, bias: 0.15 });
  // The bare fingertips poking out (grey plastic: it is a console, under the glove too).
  for (const i of [2, 4, 6]) p.px(x + i, y + 1, 'goma', 1);
  p.rect(x + 1, y + 8, 7, 2, 'violeta', 4);
  p.rect(x + 1, y + 8, 7, 1, 'laton', 1);
}

/** The wired gamepad: dark grey, the cross on the left and four buttons on the right. */
function gamepad(p: Paint, x: number, y: number, pass: boolean): void {
  p.rect(x, y + 1, 13, 4, 'goma', 2);
  p.rect(x + 1, y, 11, 1, 'goma', 1);
  p.rect(x, y + 5, 4, 2, 'goma', 3);
  p.rect(x + 9, y + 5, 4, 2, 'goma', 3);
  p.rect(x + 4, y + 5, 5, 1, 'goma', 4);
  p.rect(x + 2, y + 2, 1, 3, 'goma', 5);
  p.rect(x + 1, y + 3, 3, 1, 'goma', 5);
  p.px(x + 10, y + 2, 'rojo', 2);
  p.px(x + 11, y + 3, pass ? 'laton' : 'amarillo', 1);
  p.px(x + 9, y + 3, 'cian', 2);
  p.px(x + 10, y + 4, 'acero', 1);
}

/** A loot box held up: purple, gold corners, the «?» and the glow in the crack of its lid. */
function lootBox(p: Paint, x: number, y: number): void {
  p.rect(x, y + 4, 16, 10, 'violeta', 3);
  p.rect(x, y + 4, 3, 10, 'violeta', 5);
  p.rect(x + 1, y, 15, 4, 'violeta', 2);
  p.rect(x + 2, y, 13, 1, 'violeta', 1);
  p.rect(x + 3, y + 4, 13, 1, 'amarillo', 0);
  for (const cx of [x, x + 15]) p.rect(cx, y + 5, 1, 9, 'laton', 1);
  p.rect(x, y + 13, 16, 1, 'laton', 2);
  text(p, x + 7, y + 6, '?', 'acero', 0);
}

/** The «+3 %» starburst (or, remastered, the brand-new «HD» one): yellow, a red rim, red text. */
function starburst(p: Paint, x: number, y: number, label: string, big = false): void {
  const cx = x + 8;
  const cy = y + 6;
  const R = big ? 7.4 : 6.4;
  for (let j = -8; j <= 8; j++) {
    for (let i = -10; i <= 10; i++) {
      const a = Math.atan2(j, i * 0.75);
      const r = R + 1.2 * Math.cos(a * 7);
      const d = Math.hypot(i * 0.75, j);
      if (d <= r) p.px(cx + i, cy + j, 'amarillo', d > r - 1 ? 3 : d < 3 && j < 0 ? 0 : 1);
    }
  }
  text(p, cx - (label.length * 4 - 1) / 2, cy - 2, label, 'rojo', 3);
}

/** «Contenido descargable»: a little gold padlock, shut. */
function padlock(p: Paint, x: number, y: number): void {
  p.rect(x, y + 3, 5, 4, 'laton', 1);
  p.rect(x, y + 3, 5, 1, 'laton', 0);
  p.rect(x, y + 6, 5, 1, 'laton', 2);
  p.px(x + 2, y + 4, 'laton', 3);
  p.rect(x + 1, y, 3, 1, 'acero', 3);
  p.rect(x + 1, y, 1, 3, 'acero', 3);
  p.rect(x + 3, y, 1, 3, 'acero', 3);
}

/** The season pass: a purple card with a gold star and «T2», on its lanyard. */
function seasonPass(p: Paint, x: number, y: number, swing = 0): void {
  for (let i = 0; i < y - FY; i++) {
    p.px(FX + 3 + Math.floor(i / 2) + (i > 20 ? swing : 0), FY + i, 'violeta', 2);
    p.px(FX + FW - 3 - Math.floor(i / 3) + (i > 20 ? swing : 0), FY + i, 'violeta', 1);
  }
  const cx = x + swing;
  p.rect(cx, y, 14, 12, 'violeta', 2);
  p.rect(cx, y, 14, 1, 'violeta', 0);
  p.rect(cx, y, 1, 12, 'violeta', 1);
  p.rect(cx + 13, y + 1, 1, 11, 'violeta', 4);
  p.rect(cx + 1, y + 11, 13, 1, 'violeta', 4);
  p.rect(cx + 5, y - 1, 4, 2, 'acero', 2);
  for (const [i, j] of [[3, 3], [2, 4], [3, 4], [4, 4], [3, 5], [1, 4], [5, 4]] as const) p.px(cx + i, y + j, 'laton', 0);
  text(p, cx + 5, y + 5, 'T2', 'acero', 0);
}

const RAINBOW: ReadonlyArray<readonly [Material, number]> = [['rojo', 1], ['amarillo', 1], ['verde', 1], ['cian', 2], ['azul', 2], ['fucsia', 2]];

/** The tower of gloss: the top, the dark side, the front with its reflections, the gold trim. */
function tower(p: Paint, look: Look): void {
  // The dark side, receding up and to the left; a rim of light on its far edge.
  for (let i = 0; i < SIDE; i++) {
    const x = FX - SIDE + i;
    const y0 = FY - TOP + Math.round((i * TOP) / SIDE);
    for (let y = y0; y < y0 + FH; y++) p.px(x, y, 'lacado', i === 0 ? 3 : y < y0 + 8 ? 5 : 6);
  }
  // The top, lit: darker at the back, a bright edge at the front.
  for (let j = 0; j < TOP; j++) {
    const off = Math.round(((j + 1) * SIDE) / TOP);
    const y = FY - TOP + j;
    for (let x = FX - SIDE + off; x < FX - SIDE + off + FW; x++) p.px(x, y, 'lacado', j === TOP - 1 ? 1 : j === 0 ? 3 : 2);
  }
  for (let x = FX + 4; x < FX + 26; x++) p.px(x, FY - 1, 'lacado', 0);
  // The front: deep black with the sharp reflection of a window across it.
  for (let y = FY; y < FY + FH; y++) {
    for (let x = FX; x < FX + FW; x++) {
      const u = x - FX + (y - FY) * 0.45;
      const tone = x === FX ? (y < FY + 30 ? 2 : 3) : u > 9 && u < 15 ? 4 : u > 17 && u < 19 ? 4 : y >= FY + FH - 3 ? 6 : 5;
      p.px(x, y, 'lacado', tone);
    }
  }
  // The streak of light down the front, top left.
  p.rect(FX + 2, FY + 3, 1, 18, 'lacado', 1);
  p.rect(FX + 3, FY + 3, 1, 8, 'lacado', 0);
  // The collector's gold: along the top of the front, its foot, and the foot of the side.
  p.rect(FX + 1, FY + 1, FW - 2, 1, 'laton', 1);
  p.rect(FX, FY + FH - 2, FW, 1, 'laton', 2);
  for (let i = 1; i < SIDE; i++) p.px(FX - SIDE + i, FY - TOP + Math.round((i * TOP) / SIDE) + FH - 2, 'laton', 3);
  // The power button on top, lit (amber while it updates).
  p.rect(FX + 28, FY - 3, 4, 2, look === 'update' ? 'amarillo' : 'azul', 1);
  p.px(FX + 28, FY - 3, 'azul', 0);
  // Scratches in the gloss (it has been dusted with a sleeve).
  for (const [x, y] of [[57, 41], [58, 42], [30, 66], [56, 70], [44, 74]] as const) p.px(x, y, 'lacado', 3);
}

/** The numbered plaque: «000001» (of a run of four million). */
function plaque(p: Paint): void {
  const x = FX + 5;
  const y = FY + 3;
  p.rect(x, y, 29, 7, 'laton', 2);
  p.rect(x, y, 29, 1, 'laton', 0);
  p.rect(x + 1, y + 1, 27, 5, 'laton', 1);
  p.rect(x, y + 6, 29, 1, 'laton', 3);
  text(p, x + 3, y + 1, '000001', 'laton', 3);
}

/** The eyes, under the plaque. */
function eyes(p: Paint, look: Look, pass: boolean): void {
  const ey = TRAY - 9;
  const EW = 10;
  for (const ex of [FX + 7, FX + 22]) {
    const inner = ex === FX + 7 ? ex + EW - 1 : ex;
    const outer = ex === FX + 7 ? ex : ex + EW - 1;
    if (look === 'update') {
      // Shut, waiting for the update: flat lines, the lids heavy.
      p.rect(ex, ey + 4, EW, 1, 'lacado', 2);
      p.rect(ex + 1, ey + 3, EW - 2, 1, 'lacado', 4);
      continue;
    }
    // The socket: ink, one row of reflection on the lower lid.
    for (let j = 0; j < 7; j++) for (let i = 0; i < EW; i++) p.raw(ex + i, ey + j, INK);
    p.rect(ex + 1, ey + 7, EW - 2, 1, 'lacado', 3);
    const wide = look === 'clap' || look === 'cartridges';
    const coin = look === 'boxes';
    const gold = pass || coin || look === 'clap';
    const m: Material = gold ? 'laton' : 'azul';
    // The iris: looking at you (to the right); down at the pad while it mashes a combo.
    const ix = ex + 5;
    const iy = ey + (look === 'gamepad' ? 3 : 2);
    p.rect(ix, iy, 4, 4, m, gold ? 1 : 2);
    p.rect(ix, iy + 3, 4, 1, m, gold ? 2 : 3);
    // Remastered: the same eyes, brighter.
    if (look === 'remaster') p.rect(ix, iy, 4, 2, m, 0);
    if (coin) p.rect(ix + 1, iy + 1, 2, 2, 'laton', 3);
    else p.raw(ix + 3, iy, SHINE);
    // Heavy lids of gloss slanting down to the middle: greed. Lower with the pass, up when wide.
    const lid = wide ? 0 : look === 'gamepad' ? 3 : pass ? 3 : 2;
    if (lid > 0) {
      p.rect(ex, ey, EW, lid, 'lacado', 2);
      p.rect(ex, ey + lid - 1, EW, 1, 'lacado', 4);
      p.px(inner, ey + lid, 'lacado', 4);
      p.px(outer, ey + lid - 1, 'lacado', 2);
    }
  }
}

/** The disc tray (its mouth) and the light strip under it; out, with a disc or a cartridge. */
function tray(p: Paint, look: Look, pass: boolean, run: number): void {
  const blink = run % 2 === 1;
  const y = TRAY;
  if (look === 'update') {
    // The progress bar, stuck near the start (1 of 37); the strip dark but one blinking light.
    p.rect(FX + 8, y - 1, 32, 5, 'lacado', 6);
    p.rect(FX + 9, y, 30, 3, 'lacado', 4);
    p.rect(FX + 9, y, 3, 3, pass ? 'laton' : 'verde', 2);
    p.rect(FX + 9, y, 3, 1, pass ? 'laton' : 'verde', 0);
    text(p, FX + 18, y + 5, '1/37', 'lacado', 2);
    p.px(blink ? FX + 14 : FX + 10, y + 11, 'amarillo', 1);
    return;
  }
  for (let x = FX + 8; x < FX + FW; x++) {
    p.raw(x, y, INK);
    p.raw(x, y + 1, INK);
    p.px(x, y + 2, 'lacado', 2);
  }
  // The light strip: blue, a brighter bit running along it; or the season's colours.
  for (let x = FX + 2; x < FX + FW - 1; x++) {
    const lit = Math.abs(((x + run * 3) % 16) - 8) < 2;
    if (look === 'remaster') p.px(x, y + 5, 'acero', 0);
    else if (pass || look === 'clap') {
      const [m, t] = RAINBOW[Math.floor((x - FX + run * 2) / 6) % RAINBOW.length]!;
      p.px(x, y + 5, m, t);
    } else p.px(x, y + 5, 'azul', lit ? 0 : 2);
  }
  const out = look === 'warn' || look === 'cartridges' || look === 'clap' || look === 'remaster';
  if (!out) return;
  // The tray slid out to the right (past the front a little) with a disc on it.
  const tx = FX + 18;
  const reach = look === 'clap' ? 3 : 2;
  p.rect(tx, y, FW - 18 + reach, 2, 'lacado', 3);
  p.rect(tx, y, FW - 18 + reach, 1, 'lacado', 1);
  p.rect(tx, y + 2, FW - 18 + reach, 1, 'lacado', 5);
  if (look === 'cartridges') {
    // A cartridge popping out of it, red with its white label, tilted.
    for (let j = 0; j < 8; j++) p.rect(56 + (j >> 2), y - 8 + j, 8, 1, 'rojo', j === 0 ? 1 : 2);
    p.rect(58, y - 6, 5, 3, 'acero', 1);
    p.rect(59, y - 5, 3, 1, 'rojo', 3);
    p.rect(57, y - 1, 8, 1, 'rojo', 4);
  } else {
    p.ellipsoid(tx + 12.5, y - 0.5, 7.5, 1.8, 'acero', { dither: 0, bias: 0.2 });
    p.rect(tx + 12, y - 1, 2, 1, 'acero', 5);
    p.raw(tx + 17, y - 2, SHINE);
  }
}

export interface ConsolaLook {
  look?: Look;
  /** Phase 2: «Pase de temporada». */
  pass?: boolean;
  /** 0-5: rest, breathing and walking (POSES). */
  step?: number;
}

/** The console in a frame. */
export function makeConsolaNueva(o: ConsolaLook = {}): Canvas {
  const look = o.look ?? 'idle';
  const pass = o.pass === true || look === 'clap' || look === 'remaster';
  const step = o.step ?? 0;
  const pose = look === 'idle' ? POSES[step % POSES.length]! : look === 'update' ? { ...REST, bob: 1 } : look === 'clap' ? { ...REST, bob: -1 } : REST;
  const p = new Paint(CONSOLA_W, CONSOLA_H);
  const b = new Paint(CONSOLA_W, CONSOLA_H);
  legs(p, pose, FY + FH - 2 + pose.bob);
  // The back hand, behind the tower: low; on the eject button for the cartridges; up for the boxes.
  const up = look === 'boxes' || look === 'clap';
  const back = up ? [8, 6] : look === 'update' ? [6, 62] : look === 'gamepad' ? [56, 47] : [5, 52];
  if (look !== 'gamepad') glove(b, back[0]!, back[1]!, true);
  tower(b, look);
  plaque(b);
  eyes(b, look, pass);
  tray(b, look, pass, step);
  // Its chest: the «+3 %» starburst; with the season pass, the pass on its lanyard instead.
  if (pass) seasonPass(b, FX + 18, FY + 30, look === 'clap' ? 2 : 0);
  else starburst(b, FX + 3, FY + 29, '+3%');
  if (look === 'remaster') starburst(b, FX + 1, FY + 28, 'HD', true);
  // Two USB ports low on the front, one with a bit of fluff in it.
  for (const x of [FX + 4, FX + 10]) {
    b.rect(x, FY + FH - 7, 4, 2, 'lacado', 6);
    b.rect(x, FY + FH - 7, 4, 1, 'lacado', 3);
  }
  b.px(FX + 11, FY + FH - 6, 'acero', 2);
  // The dark side: the hatch of the downloadable content, padlocked; and its vents.
  b.rect(FX - SIDE + 2, FY + 12, 5, 13, 'lacado', 4);
  b.rect(FX - SIDE + 2, FY + 12, 5, 1, 'lacado', 3);
  padlock(b, FX - SIDE + 2, FY + 16);
  for (let y = FY + 30; y < FY + 46; y += 3) b.rect(FX - SIDE + 2, y, 5, 1, 'lacado', 4);
  // The front hand and the gamepad: held out; up and mashed; dangling while it updates.
  if (look === 'boxes') {
    glove(b, 52, 4);
    lootBox(b, 28, 4);
  } else if (look === 'clap') {
    glove(b, 70, 4);
  } else if (look === 'gamepad') {
    glove(b, 53, 47, true);
    glove(b, 68, 46);
    gamepad(b, 59, 49, pass);
  } else {
    const [hx, hy] = look === 'update' ? [66, 64] : look === 'cartridges' ? [70, 50] : [68, 56];
    glove(b, hx, hy);
    gamepad(b, hx - 7, hy + 2, pass);
  }
  p.stamp(b, 0, pose.bob);
  const outImg = p.outline();
  // The gamepad's cable, wired (the wireless one is sold apart): from the pad to the floor.
  const padAt: readonly [number, number] | null =
    look === 'boxes' || look === 'clap' ? null : look === 'gamepad' ? [65, 56] : look === 'update' ? [65, 72] : look === 'cartridges' ? [69, 58] : [67, 64];
  if (padAt) {
    const [x0, y0] = [padAt[0], padAt[1] + pose.bob];
    const x1 = 76;
    const y1 = CONSOLA_FEET.y - 1;
    let px = -1;
    let py = -1;
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const sag = Math.sin(t * Math.PI) * 4;
      const x = Math.round(x0 + (x1 - x0) * t * t + sag * 0.3);
      const y = Math.round(y0 + (y1 - y0) * Math.sqrt(t));
      if (x === px && y === py) continue;
      px = x;
      py = y;
      if (outImg.get(x, y)[3] === 0 || y > y0 + 3) {
        outImg.put(x, y, [115, 118, 154, 255]);
        if (outImg.get(x + 1, y)[3] === 0) outImg.put(x + 1, y, [20, 15, 32, 255]);
      }
    }
    for (let x = x1; x < x1 + 5; x++) {
      outImg.put(x, y1, [115, 118, 154, 255]);
      outImg.put(x, y1 + 1, [20, 15, 32, 255]);
    }
  }
  if (look === 'clap') {
    // Sparkles: the season has arrived.
    for (const [x, y] of [[4, 20], [74, 22], [66, 14], [12, 40], [78, 36], [36, 2]] as const) {
      outImg.put(x, y, SHINE);
      outImg.put(x - 1, y, [255, 217, 90, 255]);
      outImg.put(x + 1, y, [255, 217, 90, 255]);
      outImg.put(x, y - 1, [255, 217, 90, 255]);
      outImg.put(x, y + 1, [255, 217, 90, 255]);
    }
  }
  return outImg;
}

/** Its sheet, in the order of CONSOLA_FRAMES. */
export function makeConsolaNuevaFrames(): Canvas[] {
  const phase = (pass: boolean): Canvas[] => [
    ...[0, 1, 2, 3, 4, 5].map((step) => makeConsolaNueva({ pass, step })),
    makeConsolaNueva({ pass, look: 'warn' }),
    makeConsolaNueva({ pass, look: 'update', step: 1 }),
    makeConsolaNueva({ pass, look: 'cartridges' }),
    makeConsolaNueva({ pass, look: 'gamepad' }),
    makeConsolaNueva({ pass, look: 'boxes' }),
  ];
  return [...phase(false), ...phase(true), makeConsolaNueva({ look: 'clap' }), makeConsolaNueva({ look: 'remaster' })];
}

/** Size of each piece of its debris. */
export const CONSOLA_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-consola-coleccionista`): a cartridge, a disc, the
 * gamepad, the DLC padlock, a bit of the gold plaque and the season pass.
 */
export function makeConsolaBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => {
      p.rect(2, 2, 8, 9, 'rojo', 2);
      p.rect(2, 2, 8, 1, 'rojo', 1);
      p.rect(3, 4, 6, 4, 'acero', 1);
      p.rect(4, 5, 4, 1, 'rojo', 3);
      for (const x of [3, 5, 7]) p.px(x, 10, 'rojo', 4);
    },
    (p) => {
      p.ellipsoid(6, 6, 5, 5, 'acero', { dither: 0, bias: 0.15 });
      p.rect(5, 5, 2, 2, 'acero', 5);
    },
    (p) => gamepad(p, 0, 3, false),
    (p) => padlock(p, 4, 2),
    (p) => {
      p.rect(1, 3, 10, 6, 'laton', 1);
      p.rect(1, 3, 10, 1, 'laton', 0);
      text(p, 2, 4, '01', 'laton', 3);
    },
    (p) => {
      p.rect(2, 2, 9, 8, 'violeta', 2);
      p.rect(2, 2, 9, 1, 'violeta', 0);
      text(p, 3, 4, 'T2', 'acero', 0);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(CONSOLA_BIT, CONSOLA_BIT);
    draw(p);
    return p.outline();
  });
}
