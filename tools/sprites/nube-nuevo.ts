// M14c (a7d): La Nube de Almacenamiento in the new style (docs/ESTILO_ARTE.md, «M14c · El estilo
// nuevo», and the bosses' size rule of (a7a)). The old sprite, and its folder and bullets, stay in
// nube.ts.
//
// A fat cloud that floats (no legs: only its shadow and its drizzle touch the floor), shaded as one
// puffy volume with the height-map shader (a union of spheres: the seams between the lobes come out
// of the slopes). A smug stare with sky-blue irises, the mouth where the files come out (its
// muzzle), yellow rain-jacket gloves. Jokes: the storage bar at 99 % on its shaded side, the USB
// cable it says it does not need dangling from its belly, and the open padlock sticker of
// «privacidad garantizada». Full («Almacenamiento lleno»), it swells into a grey storm cloud with
// folders sticking out everywhere, the bar at 100 % in red and bags under its eyes.

import type { Canvas } from '../../src/art/canvas.ts';
import { SHINE, type Material } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';

export const NUBE_W = 84;
export const NUBE_H = 88;
/** Its shadow's middle on the floor (EnemyDef.anchor): it floats, nothing of it stands there. */
export const NUBE_FEET = { x: 42, y: 86 } as const;
/** Its mouth, px from the anchor: BossBrain.muzzle (the old one, kept). */
export const NUBE_MOUTH = { x: 6, y: 42 } as const;

/** Frames per phase (BossPhase.frameShift of «Almacenamiento lleno»). */
export const NUBE_PER_PHASE = 8;
/** Frame layout (EnemyAnim of src/data/enemies.ts); phase 2 is the same `NUBE_PER_PHASE` on. */
export const NUBE_FRAMES = {
  float: [0, 1, 2, 3],
  /** Holding its breath (warning, syncing). */
  hold: 4,
  /** The connection error (stunned). */
  error: 5,
  /** Attack poses: the rain, spitting files; and (phase 2 only) dropping its folders. */
  rain: 6,
  files: 7,
  folders: 2 * NUBE_PER_PHASE,
  count: 2 * NUBE_PER_PHASE + 1,
} as const;

type Look = 'float' | 'hold' | 'error' | 'rain' | 'files' | 'folders';

/** Bob of each step of the floating cycle (px down). */
const BOB = [0, 1, 2, 1] as const;

/** The lobes: centre and radius. The bottom ones make the flat belly. */
const LOBES: ReadonlyArray<readonly [number, number, number]> = [
  [25, 31, 10],
  [42, 26, 12],
  [59, 31, 10],
  [17, 42, 10],
  [67, 41, 10],
  [32, 38, 13],
  [52, 37, 13],
  [26, 50, 9],
  [42, 49, 10],
  [58, 50, 9],
];
/** The belly: nothing of the cloud below this row (before the bob). */
const BELLY = 59;

/** The height of the cloud at a pixel: the highest of its spheres, or null outside. */
function cloudHeight(x: number, y: number, top: number, grow: number): number | null {
  if (y > BELLY + top) return null;
  let h = -1;
  for (const [cx, cy, r0] of LOBES) {
    const r = r0 + grow;
    const dx = x + 0.5 - cx;
    const dy = y + 0.5 - (cy + top);
    const d = r * r - dx * dx - dy * dy;
    if (d > 0) h = Math.max(h, Math.sqrt(d) + r * 0.15);
  }
  return h < 0 ? null : h;
}

/** A yellow rain-jacket glove: the hand, the thumb, the cuff. */
function glove(p: Paint, x: number, y: number, thumbLeft = false): void {
  p.ellipsoid(x + 4, y + 4, 4.2, 3.8, 'mostaza', { dither: 0, bias: 0.1 });
  p.ellipsoid(thumbLeft ? x + 0.5 : x + 7.5, y + 2, 1.6, 2.2, 'mostaza', { dither: 0, bias: 0.2 });
  p.rect(x + 1, y + 8, 7, 2, 'mostaza', 3);
  p.rect(x + 1, y + 8, 7, 1, 'mostaza', 1);
}

/** The face: heavy smug lids over sky-blue irises; shut, crossed out, squinting down or wide. */
function face(p: Paint, top: number, look: Look, full: boolean, M: Material): void {
  const ey = 34 + top;
  const mx = NUBE_FEET.x + NUBE_MOUTH.x;
  const my = NUBE_FEET.y - NUBE_MOUTH.y + top;
  for (const ex of [36, 52]) {
    if (look === 'hold') {
      // Holding its breath: eyes squeezed shut, curving down.
      for (let i = 0; i < 8; i++) p.px(ex + i, ey + 3 + (i === 0 || i === 7 ? 0 : 1), M, 6);
      continue;
    }
    if (look === 'error') {
      // Connection lost: an X in each eye.
      for (let i = 0; i < 5; i++) {
        p.px(ex + 1 + i, ey + 1 + i, 'pantalla', 4);
        p.px(ex + 5 - i, ey + 1 + i, 'pantalla', 4);
      }
      continue;
    }
    // The socket, the iris looking at you (to the right; down at the floor while it rains), a glint.
    p.rect(ex, ey, 8, 7, 'pantalla', 4);
    p.rect(ex + 1, ey + 7, 6, 1, M, 1);
    const ix = ex + (look === 'rain' ? 2 : 4);
    const iy = ey + (look === 'rain' ? 3 : 2);
    p.rect(ix, iy, 3, 4, 'azul', 2);
    p.rect(ix, iy + 3, 3, 1, 'azul', 4);
    p.px(ix, iy, 'azul', 1);
    p.raw(ix + 2, iy, SHINE);
    // Heavy lids of cloud, half shut and smug; less of them spitting files (wide awake).
    const lid = look === 'files' || look === 'folders' ? 1 : 3;
    p.rect(ex, ey, 8, lid, M, 2);
    p.rect(ex, ey + lid, 8, 1, M, 5);
    if (full) {
      // Bags under the eyes: it has not slept since it filled up.
      p.rect(ex + 1, ey + 8, 6, 1, M, 4);
      p.px(ex, ey + 7, M, 4);
    }
  }
  // The mouth, on the muzzle.
  if (look === 'files' || look === 'folders') {
    p.ellipsoid(mx + 0.5, my + 1, 4, 3, 'pantalla', { dither: 0, bias: -0.5 });
    // A file coming out: a white sheet with lines.
    if (look === 'files') {
      p.rect(mx + 2, my - 1, 5, 6, 'acero', 1);
      p.rect(mx + 2, my - 1, 5, 1, 'acero', 0);
      for (const y of [my + 1, my + 3]) p.rect(mx + 3, y, 3, 1, 'acero', 3);
    }
  } else if (look === 'hold') {
    // Puffed cheeks, lips pressed: a short line with round cheeks either side.
    p.rect(mx - 2, my, 5, 1, M, 6);
    for (const cx of [mx - 6, mx + 6]) p.ellipsoid(cx + 0.5, my - 0.5, 2.2, 1.8, M, { dither: 0, bias: 0.4 });
  } else if (look === 'error') {
    for (let i = 0; i < 9; i++) p.px(mx - 4 + i, my + (i % 2), M, 6);
  } else {
    // Smug: a little curve up on one side.
    p.rect(mx - 3, my + 1, 6, 1, M, 6);
    p.px(mx + 3, my, M, 6);
    p.px(mx + 4, my - 1, M, 6);
  }
}

/** The storage bar on its shaded side: 99 % (100 % and red once full), with the figure under it. */
function storage(p: Paint, top: number, full: boolean): void {
  const x = 12;
  const y = 41 + top;
  p.rect(x, y, 14, 5, 'pantalla', 5);
  p.rect(x + 1, y + 1, 12, 3, full ? 'rojo' : 'amarillo', 2);
  p.rect(x + 1, y + 1, 12, 1, full ? 'rojo' : 'amarillo', 1);
  if (!full) p.rect(x + 12, y + 1, 1, 3, 'pantalla', 4);
  // «99» or «100», tiny, in dark dots.
  const m: Material = full ? 'rojo' : 'pantalla';
  const t = full ? 3 : 3;
  const ty = y + 7;
  const glyphs = full ? [[0, 1], [0, 0], [0, 0]] : [[1, 1], [1, 1]];
  let gx = x + 2;
  for (const g of glyphs) {
    if (g[0] === 0 && g[1] === 1) {
      p.rect(gx + 1, ty, 1, 4, m, t);
      gx += 3;
    } else if (g[0] === 0) {
      p.rect(gx, ty, 3, 1, m, t);
      p.rect(gx, ty + 3, 3, 1, m, t);
      p.rect(gx, ty, 1, 4, m, t);
      p.rect(gx + 2, ty, 1, 4, m, t);
      gx += 4;
    } else {
      p.rect(gx, ty, 3, 1, m, t);
      p.rect(gx, ty + 2, 3, 1, m, t);
      p.px(gx, ty + 1, m, t);
      p.rect(gx + 2, ty, 1, 4, m, t);
      gx += 4;
    }
  }
}

/** The «privacidad garantizada» sticker on its cheek: a padlock, open. */
function padlock(p: Paint, x: number, y: number): void {
  p.rect(x, y + 3, 6, 5, 'amarillo', 2);
  p.rect(x, y + 3, 6, 1, 'amarillo', 1);
  p.rect(x + 2, y + 5, 2, 2, 'amarillo', 4);
  // The shackle, open: up and off to the right.
  p.rect(x + 3, y, 1, 3, 'acero', 2);
  p.rect(x + 3, y - 1, 4, 1, 'acero', 2);
  p.rect(x + 6, y, 1, 2, 'acero', 3);
}

/** A manila folder stuck in it, tilted one way or the other, a sheet poking out. */
function folder(p: Paint, x: number, y: number, left: boolean): void {
  for (let j = 0; j < 6; j++) p.rect(x + (left ? -(j >> 1) : j >> 1), y + j, 8, 1, 'carton', j === 0 ? 0 : j < 3 ? 1 : 2);
  p.rect(x + (left ? 0 : 1), y - 1, 3, 1, 'carton', 1);
  p.rect(x + 3, y - 2, 4, 2, 'acero', 1);
}

export interface NubeLook {
  look?: Look;
  full?: boolean;
  /** 0-3: the floating cycle. */
  step?: number;
}

/** The cloud in a frame. */
export function makeNubeNueva(o: NubeLook = {}): Canvas {
  const look = o.look ?? 'float';
  const full = o.full === true;
  const step = o.step ?? 0;
  const M: Material = full ? 'acero' : 'vidrio';
  const bob = look === 'float' ? BOB[step % 4]! : look === 'hold' ? -1 : look === 'error' ? 2 : 0;
  const top = bob;
  const grow = (full ? 1 : 0) + (look === 'hold' ? 1 : 0);
  const p = new Paint(NUBE_W, NUBE_H);
  // The back hand, behind the cloud (up for the rain and the folders).
  const raised = look === 'rain' || look === 'folders';
  glove(p, raised ? 2 : 1, (raised ? 18 : 46) + top + (step % 2), true);
  // The cloud: one volume (the full one, greyer and lower in the light).
  p.heightShade(0, 0, NUBE_W, NUBE_H, (x, y) => cloudHeight(x, y, top, grow), M, { dither: 0.2, bias: full ? -0.02 : 0.18, z: 1.8 });
  // The flat belly: a band of deep shade along the bottom (darker while it rains).
  for (let x = 0; x < NUBE_W; x++) {
    for (let y = BELLY + top - 2; y <= BELLY + top; y++) if (p.filled(x, y)) p.px(x, y, M, look === 'rain' || full ? 5 : 4);
  }
  if (full) {
    // Folders stuck in it everywhere.
    folder(p, 22, 17 + top, true);
    folder(p, 52, 14 + top, false);
    folder(p, 64, 30 + top, false);
    folder(p, 9, 32 + top, true);
  }
  storage(p, top, full);
  face(p, top, look, full, M);
  padlock(p, 62, 46 + top);
  if (look === 'error') {
    // A red warning triangle with its «!» over its head.
    for (let j = 0; j < 7; j++) p.rect(42 - (j >> 1), 5 + j + top, 1 + 2 * (j >> 1), 1, 'rojo', 2);
    p.rect(42, 7 + top, 1, 3, 'acero', 1);
    p.px(42, 11 + top, 'acero', 1);
  }
  // The front hand: by its side; up for the rain and the folders; flung out with the files.
  const fh = look === 'files' ? [74, 32] : raised ? [72, 16] : [72, 48];
  glove(p, fh[0]!, fh[1]! + top + (step % 2 === 1 ? 1 : 0));
  if (look === 'folders') {
    // Folders tumbling out of its belly.
    folder(p, 30, BELLY + top + 2, true);
    folder(p, 50, BELLY + top + 5, false);
  }
  const out = p.outline();
  // The USB cable it does not need, out of its belly, the plug swinging with the float.
  const swing = [0, 1, 0, -1][step % 4]!;
  const cx = 44;
  for (let y = BELLY + top + 1; y < BELLY + top + 14; y++) {
    const k = (y - BELLY - top) / 14;
    const x = Math.round(cx + swing * k * 2);
    if (out.get(x, y)[3] === 0) out.put(x, y, [58, 62, 86, 255]);
    if (out.get(x + 1, y)[3] === 0) out.put(x + 1, y, [20, 15, 32, 255]);
  }
  const px = cx + swing * 2;
  const py = BELLY + top + 14;
  for (let j = 0; j < 4; j++) {
    for (let i = -1; i <= 1; i++) out.put(px + i, py + j, j === 0 ? [180, 188, 203, 255] : [135, 144, 169, 255]);
    out.put(px + 2, py + j, [20, 15, 32, 255]);
  }
  out.put(px - 1, py + 4, [20, 15, 32, 255]);
  out.put(px, py + 4, [20, 15, 32, 255]);
  out.put(px + 1, py + 4, [20, 15, 32, 255]);
  // The drizzle under it (see-through: rain), down the cycle; heavier full, a downpour in the pose.
  const heavy = look === 'rain' ? 3 : full ? 2 : 1;
  const cols = [14, 22, 31, 52, 60, 69, 26, 64, 37, 57];
  cols.slice(0, 4 + heavy * 2).forEach((x, i) => {
    const y0 = BELLY + top + 3 + ((i * 5 + step * 3) % 12);
    const len = look === 'rain' ? 4 : 2;
    for (let j = 0; j < len; j++) if (y0 + j < NUBE_H && out.get(x, y0 + j)[3] === 0) out.put(x, y0 + j, [105, 219, 216, 230 - j * 40]);
  });
  return out;
}

/** Its sheet, in the order of NUBE_FRAMES. */
export function makeNubeNuevaFrames(): Canvas[] {
  const phase = (full: boolean): Canvas[] => [
    ...[0, 1, 2, 3].map((step) => makeNubeNueva({ full, step })),
    makeNubeNueva({ full, look: 'hold' }),
    makeNubeNueva({ full, look: 'error' }),
    makeNubeNueva({ full, look: 'rain' }),
    makeNubeNueva({ full, look: 'files' }),
  ];
  return [...phase(false), ...phase(true), makeNubeNueva({ full: true, look: 'folders' })];
}

/** Size of each piece of its debris. */
export const NUBE_BIT = 12;

/**
 * What flies off it as it comes apart (`despiece-nube-almacenamiento`): a puff of cloud, a folder,
 * a file, the padlock, the USB plug and the storage bar.
 */
export function makeNubeBits(): Canvas[] {
  const bits: Array<(p: Paint) => void> = [
    (p) => p.heightShade(0, 0, 12, 12, (x, y) => {
      const a = 16 - (x - 4) ** 2 - (y - 6) ** 2;
      const b = 12 - (x - 8) ** 2 - (y - 7) ** 2;
      const h = Math.max(a, b);
      return h > 0 ? Math.sqrt(h) : null;
    }, 'vidrio', { dither: 0.3, z: 3 }),
    (p) => folder(p, 2, 4, false),
    (p) => {
      p.rect(3, 2, 6, 8, 'acero', 1);
      p.rect(3, 2, 6, 1, 'acero', 0);
      for (const y of [4, 6, 8]) p.rect(4, y, 4, 1, 'acero', 3);
    },
    (p) => padlock(p, 3, 2),
    (p) => {
      p.rect(4, 2, 4, 5, 'acero', 2);
      p.rect(4, 2, 4, 1, 'acero', 1);
      p.rect(5, 7, 2, 4, 'goma', 2);
    },
    (p) => {
      p.rect(1, 4, 10, 4, 'pantalla', 5);
      p.rect(2, 5, 8, 2, 'amarillo', 2);
    },
  ];
  return bits.map((draw) => {
    const p = new Paint(NUBE_BIT, NUBE_BIT);
    draw(p);
    return p.outline();
  });
}
