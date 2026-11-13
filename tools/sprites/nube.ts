// La Nube de Almacenamiento, floor 2's second boss (M14 (j3), docs/DISENO.md «Jefes al azar»).
// A fat storm cloud that floats over the floor (no legs: it never touches the ground, only its
// shadow does), lit from the top left in lobes, with a smug, heavy-lidded stare on its front, big
// floating hands like every boss's (docs/ESTILO_ARTE.md: never arms) and a drizzle under it. Jokes:
// the storage bar on its dark side, at 99 % (100 % and red once full); the USB cable it says it does
// not need, dangling from its belly with the plug swinging; and the open padlock sticker of
// «privacidad garantizada». Once full («Almacenamiento lleno») it swells and greys over, and
// folders stick out of it everywhere. 72x76, like the other bosses.
import { Canvas, hx, type RGBA } from '../../src/art/canvas.ts';
import { GLOVE, K, RED, STEEL, WHITE, YEL, outline, ramp, type Ramp } from '../../src/art/lib.ts';

export const NUBE_W = 72;
export const NUBE_H = 76;

/** White cloud, a little blue in the shade (it is the brand colour). */
const CLOUD = ramp('#ffffff', '#e2eaf5', '#b4c2d9', '#8392b0');
/** Full: the same cloud, grey and heavy with rain. */
const STORM = ramp('#e3e6ee', '#b0b7c8', '#868ea4', '#5d6480');
const DROP = hx('#69dbd8');
const DROP_DK = hx('#3a9ea6');
/** Manila folders sticking out of it once full. */
const MANILA = ramp('#ffe2a0', '#e8bd62', '#b98a3a', '#7e5a24');
const CABLE = ramp('#5a5f7a', '#3a3e56', '#262a3e');

export type NubeState = 'float' | 'hold' | 'error';

export interface NubeLook {
  /** Phase 2: «Almacenamiento lleno». */
  full?: boolean;
  /** 0-3: the floating cycle (its bob and where the drizzle is). */
  step?: number;
  /** Holding its breath (warning, syncing) or the connection error. */
  state?: NubeState;
}

/** Bob of each step of the floating cycle (px down). */
const BOB = [0, 1, 2, 1] as const;

/** The lobes, back to front: centre and radius (the full cloud's are a little bigger). */
const LOBES: ReadonlyArray<readonly [number, number, number]> = [
  [20, 26, 11],
  [36, 18, 13],
  [52, 24, 11],
  [14, 38, 10],
  [60, 36, 9],
  [28, 36, 14],
  [46, 34, 15],
];

function lobeShade(dx: number, dy: number, r: number, R: Ramp): RGBA {
  // Lit from the top left: a bright crescent there, the bottom in shade, the very bottom deeper.
  const k = (dx + dy * 1.2) / r;
  if (dy > r * 0.62) return R[3]!;
  if (k < -0.75) return R[0]!;
  if (k > 0.7 || dy > r * 0.35) return R[2]!;
  return R[1]!;
}

export function makeNube(look: NubeLook = {}): Canvas {
  const full = !!look.full;
  const step = look.step ?? 0;
  const state = look.state ?? 'float';
  const R = full ? STORM : CLOUD;
  const bob = state === 'float' ? BOB[step % 4]! : state === 'hold' ? -1 : 2;
  const grow = full ? 1 : 0;
  const body = new Canvas(NUBE_W, NUBE_H);
  const top = 8 + bob;

  // Back hand, behind the cloud.
  bigHand(body, 4, top + 34 + (step % 2));

  // The lobes, back to front; where a front one overlaps a back one, a seam of the deep shade.
  const owner: number[][] = Array.from({ length: NUBE_H }, () => Array<number>(NUBE_W).fill(-1));
  LOBES.forEach(([cx, cy, r0], i) => {
    const r = r0 + grow + (state === 'hold' && i >= 5 ? 1 : 0);
    const y0 = cy + top - 8;
    for (let y = y0 - r; y <= y0 + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const dx = x - cx;
        const dy = y - y0;
        if (dx * dx + dy * dy > r * r + r * 0.5) continue;
        // The base of the cloud is flat-ish: nothing below the line of its belly.
        if (y > top + 44 + grow) continue;
        const onEdge = dx * dx + dy * dy > (r - 1) * (r - 1) + (r - 1) * 0.5;
        const behind = owner[y]?.[x] ?? -1;
        body.set(x, y, onEdge && behind >= 0 && dy < r * 0.5 ? R[3]! : lobeShade(dx, dy, r, R));
        if (owner[y]) owner[y]![x] = i;
      }
    }
  });
  // The flat belly: a band of deep shade along the bottom, and its drizzle under it.
  for (let x = 8; x < 66; x++) {
    for (let y = top + 38; y <= top + 44 + grow; y++) if (body.get(x, y)[3] > 0 && y >= top + 42 + grow) body.set(x, y, R[3]!);
  }

  if (full) {
    // Folders stuck in it everywhere (manila, a white sheet poking out of each).
    folder(body, 8, top + 8, false);
    folder(body, 55, top + 4, true);
    folder(body, 24, top - 1, true);
    folder(body, 61, top + 26, false);
  }

  // The storage bar on its dark side: 99 % (and the last bit red and full once it is full).
  const bx = 10;
  const by = top + 24;
  body.rect(bx, by, 16, 5, K);
  body.rect(bx + 1, by + 1, 14, 3, R[3]!);
  body.rect(bx + 1, by + 1, full ? 14 : 13, 3, full ? RED[1]! : YEL[1]!);
  body.rect(bx + 1, by + 1, full ? 14 : 13, 1, full ? RED[0]! : YEL[0]!);
  // «99» under it, tiny, in the deep shade (or «100», red).
  if (full) digits(body, bx + 2, by + 7, '100', RED[2]!);
  else digits(body, bx + 4, by + 7, '99', R[3]!);

  // The face, on its front: heavy lids, a smug little mouth.
  face(body, top, state, R);

  // The open padlock of «privacidad garantizada», a sticker on its cheek.
  padlock(body, 56, top + 32);

  // The USB cable it does not need, out of its belly, the plug swinging.
  const swing = state === 'float' ? [0, 1, 0, -1][step % 4]! : 0;
  const cx0 = 40;
  const cy0 = top + 44 + grow;
  for (let i = 0; i < 9; i++) {
    const x = cx0 + Math.round((swing * i) / 8) + (i > 4 ? 1 : 0);
    body.set(x, cy0 + i, CABLE[1]!);
    body.set(x + 1, cy0 + i, CABLE[2]!);
  }
  const px = cx0 + swing + 1;
  body.rect(px - 1, cy0 + 9, 4, 4, STEEL[1]!);
  body.rect(px - 1, cy0 + 9, 4, 1, STEEL[0]!);
  body.rect(px, cy0 + 11, 2, 1, STEEL[3]!);

  // Front hand, on the right, at the edge of the cloud.
  bigHand(body, 61, top + 38 - (step % 2));

  const o = outline(body);
  // The drizzle under it (no outline: it is rain), moving down the cycle; heavier once full.
  const drops = full ? [14, 22, 30, 48, 56, 34] : [18, 30, 50, 58];
  if (state !== 'hold') {
    drops.forEach((x, i) => {
      const y = top + 48 + grow + ((step * 3 + i * 5) % 12);
      if (Math.abs(x - 41) < 3) return;
      o.set(x, y, DROP);
      o.set(x, y + 1, DROP);
      o.set(x, y + 2, DROP_DK);
    });
  }
  return o;
}

function face(cv: Canvas, top: number, state: NubeState, R: Ramp): void {
  const ey = top + 22;
  for (const ex of [36, 49]) {
    if (state === 'hold') {
      // Holding its breath: eyes squeezed shut, two dark slits curving down.
      cv.rect(ex, ey + 3, 7, 1, K);
      cv.set(ex, ey + 2, K);
      cv.set(ex + 6, ey + 2, K);
      continue;
    }
    if (state === 'error') {
      // Connection lost: an X in each eye.
      cv.rect(ex, ey, 7, 6, WHITE);
      for (let i = 0; i < 5; i++) {
        cv.set(ex + 1 + i, ey + i, K);
        cv.set(ex + 5 - i, ey + i, K);
      }
      continue;
    }
    cv.rect(ex, ey, 7, 6, K);
    // The iris, sky blue, looking to the right (at you), a glint.
    cv.rect(ex + 3, ey + 2, 3, 3, hx('#5f93d4'));
    cv.set(ex + 5, ey + 2, WHITE);
    // Heavy lids of cloud: half shut, smug.
    cv.rect(ex, ey, 7, 2, R[1]!);
    cv.rect(ex, ey + 2, 7, 1, R[3]!);
  }
  // The mouth: a smug little curve on one side; a wobbly line on error; puffed cheeks holding.
  const my = top + 32;
  if (state === 'error') {
    for (let i = 0; i < 8; i++) cv.set(42 + i, my + (i % 2), K);
  } else if (state === 'hold') {
    cv.rect(44, my, 4, 2, K);
    cv.set(34, my - 2, R[2]!);
    cv.set(56, my - 2, R[2]!);
  } else {
    cv.rect(43, my + 1, 6, 1, K);
    cv.set(49, my, K);
    cv.set(50, my - 1, K);
  }
}

/** A manila folder stuck in the cloud, a white sheet poking out (tilted one way or the other). */
function folder(cv: Canvas, x: number, y: number, tilt: boolean): void {
  const w = 9;
  const h = 7;
  for (let j = 0; j < h; j++) {
    const off = tilt ? Math.floor(j / 3) : -Math.floor(j / 3);
    cv.rect(x + off, y + j, w, 1, j === 0 ? MANILA[0]! : j === h - 1 ? MANILA[2]! : MANILA[1]!);
  }
  // The tab, and the sheet sticking out of the top.
  cv.rect(x + 1, y - 1, 3, 1, MANILA[1]!);
  cv.rect(x + 4, y - 2, 4, 2, WHITE);
  cv.set(x + 5, y - 1, hx('#b7bed0'));
}

/** «Privacidad garantizada»: a padlock sticker, open. */
function padlock(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y + 3, 6, 5, YEL[1]!);
  cv.rect(x, y + 3, 6, 1, YEL[0]!);
  cv.rect(x, y + 7, 6, 1, YEL[2]!);
  cv.set(x + 2, y + 5, K);
  cv.set(x + 2, y + 6, K);
  // The shackle, open: up and off to the right.
  cv.rect(x + 1, y, 1, 3, STEEL[2]!);
  cv.rect(x + 1, y - 1, 4, 1, STEEL[2]!);
  cv.set(x + 5, y, STEEL[2]!);
}

const DIGITS: Record<string, readonly string[]> = {
  '0': ['###', '#.#', '#.#', '#.#', '###'],
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '9': ['###', '#.#', '###', '..#', '##.'],
};

function digits(cv: Canvas, x: number, y: number, text: string, c: RGBA): void {
  [...text].forEach((ch, i) => {
    DIGITS[ch]?.forEach((row, j) => [...row].forEach((p, k) => {
      if (p === '#') cv.set(x + i * 4 + k, y + j, c);
    }));
  });
}

/** A boss hand: 7x7 and rounded, like the Nevera's. */
function bigHand(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 7, 7, GLOVE[1]!);
  cv.rect(x, y, 6, 1, GLOVE[0]!);
  cv.rect(x + 6, y, 1, 7, GLOVE[2]!);
  cv.rect(x + 1, y + 6, 6, 1, GLOVE[2]!);
}

/** Frames per phase on the sheet: four floating, holding its breath and the error. */
export const NUBE_PER_PHASE = 6;

/** The sheet: «Subiendo archivos» 0-5 and «Almacenamiento lleno» 6-11. Frame 0 is the rest pose. */
export function makeNubeFrames(): Canvas[] {
  return [false, true].flatMap((full) => [
    ...[0, 1, 2, 3].map((step) => makeNube({ full, step })),
    makeNube({ full, state: 'hold' }),
    makeNube({ full, state: 'error' }),
  ]);
}

/** One of its folders, standing on the floor as an obstacle: a fat lever-arch box file. 20x18. */
export function makeCarpeta(): Canvas {
  const cv = new Canvas(20, 18);
  // A box file in three-quarters: the spine (dark side) on the left, the front with its label.
  cv.rect(2, 3, 4, 14, MANILA[3]!);
  cv.rect(6, 3, 12, 14, MANILA[1]!);
  cv.rect(6, 3, 12, 1, MANILA[0]!);
  cv.rect(17, 3, 1, 14, MANILA[2]!);
  cv.rect(6, 16, 12, 1, MANILA[2]!);
  cv.rect(3, 1, 14, 2, MANILA[0]!);
  // The ring hole on the spine.
  cv.rect(3, 6, 2, 2, K);
  // Its label: «Sin título (37)», a white card with scribbles.
  cv.rect(8, 6, 8, 5, WHITE);
  cv.rect(9, 7, 5, 1, hx('#858ea8'));
  cv.rect(9, 9, 3, 1, hx('#858ea8'));
  // Sheets poking out of the top.
  cv.rect(7, 0, 5, 2, WHITE);
  cv.rect(12, 1, 4, 1, hx('#e2e7f0'));
  // A cloud icon in the corner (it is still «in the cloud»).
  cv.rect(9, 13, 4, 2, CLOUD[1]!);
  cv.set(10, 12, CLOUD[1]!);
  return outline(cv);
}

/** Bullet grids: `w` white, `g` grey, `r`/`R` red, `c`/`C` cyan, `d` deep cyan. */
const BULLET_COLS: Record<string, RGBA> = {
  w: WHITE, g: hx('#b7bed0'), r: RED[1]!, R: RED[2]!, c: DROP, C: DROP_DK, d: hx('#b6f1f0'),
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

/** A raindrop of «Lluvia en columnas»: cyan, long, a white core; two frames, a little stretched. 10x12. */
export function makeDropBullet(): Canvas {
  return grid(
    [
      ['...c....', '..cc....', '..cdc...', '.cwdc...', '.cwwcc..', 'ccwwdc..', 'ccwddC..', '.cddCC..', '.cCCC...', '..CC....'],
      ['...c....', '...c....', '..cdc...', '..cwc...', '.cwdcc..', '.cwwdc..', 'ccwddC..', 'cddCCC..', '.cCCC...', '..CC....'],
    ],
    10,
  );
}

/** A file of «Subiendo archivos»: a white sheet, its corner folded down in red, two lines; fluttering. 12x12. */
export function makeFileBullet(): Canvas {
  return grid(
    [
      ['wwwwwrR..', 'wwwwwrrR.', 'wggggwrr.', 'wwwwwwww.', 'wggggggw.', 'wwwwwwww.', 'wgggggww.', 'wwwwwwww.', 'rrrrrrrr.'],
      ['.wwwwrR..', '.wwwwrrR.', '.wgggwrr.', '.wwwwwww.', '.wgggggw.', '.wwwwwww.', '.wggggww.', '.wwwwwww.', '.rrrrrrr.'],
    ],
    12,
  );
}
