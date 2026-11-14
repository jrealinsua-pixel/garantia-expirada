// M14c (a3): sprites made outside the project (by an image AI or by the human) dropped in
// art/entrada/. Each PNG comes with a JSON of the same name saying what it is and where it comes
// from (see art/entrada/LEEME.md). This script:
//
// 1. reads them and refuses any without a compatible licence;
// 2. finds the pixel size the picture was blown up by (AI pixel art usually comes at 4×–16×,
//    with soft edges) and brings it down to real pixels, block by block;
// 3. snaps every colour to the game's palette (src/art/paleta.ts), in OKLab, and drops the
//    half-transparent edge;
// 4. crops it to the frame (standing on the bottom edge, centred), and can give it the selective
//    outline of the new style;
// 5. hands the sheets to `npm run sprites` (tools/sprites/build.ts adds them to public/assets/),
//    leaves a preview in art/entrada/procesados/ and writes their credits in CREDITOS.md.
//
//   node tools/sprites/entrada.ts     (then npm run sprites)

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, type RGBA } from '../../src/art/canvas.ts';
import { INK, MATERIALS, SHINE, type Material, type Ramp6 } from '../../src/art/paleta.ts';
import { Paint } from '../../src/art/pintor.ts';
import { decodePng, encodePng } from './png.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const INCOMING_DIR = join(ROOT, 'art', 'entrada');

/** Licences that can go into the game (and get credited). */
export const LICENCES = ['CC0', 'CC-BY', 'CC-BY-SA', 'OFL', 'MIT', 'propia', 'IA-uso-comercial'] as const;
export type Licence = (typeof LICENCES)[number];

export interface IncomingMeta {
  /** Sheet name in public/assets/sprites.json (kebab-case). */
  id: string;
  /** What it is, in a few words (goes to the credits). */
  que: string;
  autor: string;
  licencia: Licence;
  /** Where it comes from: a link, or the tool and the prompt for an image AI. */
  origen: string;
  /** Frames side by side in the PNG (default 1). */
  fotogramas?: number;
  /** Size of each frame once processed; by default, the cropped sprite. */
  ancho?: number;
  alto?: number;
  /** How much the picture is blown up (pixels per real pixel); default: found by itself. */
  escala?: number;
  /** Draw the selective outline of the new style around it (for sprites that come without). */
  contorno?: boolean;
  /** It replaces a sheet the game already draws by code (must be said on purpose). */
  reemplaza?: boolean;
}

export interface Sheet {
  canvas: Canvas;
  frameW: number;
  frameH: number;
}

// ---------------------------------------------------------------------------------------------
// Colour: OKLab distance to the palette.

function oklab(c: RGBA): [number, number, number] {
  const lin = (v: number): number => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [lin(c[0]), lin(c[1]), lin(c[2])];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

interface Swatch {
  c: RGBA;
  lab: [number, number, number];
  m: Material | null;
  tone: number;
}

const SWATCHES: Swatch[] = [
  { c: INK, lab: oklab(INK), m: null, tone: 0 },
  { c: SHINE, lab: oklab(SHINE), m: null, tone: 0 },
  ...(Object.entries(MATERIALS) as Array<[Material, Ramp6]>).flatMap(([m, R]) => R.map((c, tone) => ({ c, lab: oklab(c), m, tone }))),
];

/** The palette swatch nearest to a colour (perceptually). */
export function nearest(c: RGBA): Swatch {
  const p = oklab(c);
  let best = SWATCHES[0]!;
  let bd = Infinity;
  for (const s of SWATCHES) {
    const d = (p[0] - s.lab[0]) ** 2 + (p[1] - s.lab[1]) ** 2 + (p[2] - s.lab[2]) ** 2;
    if (d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------------
// Scale: find the block size and bring it down.

const OPAQUE = 128;

/**
 * The size of the blocks the picture is made of (1 = already real pixels), and where the grid
 * starts. The colour changes between neighbouring pixels all fall on the block borders, so for
 * the right block size k nearly all of them land on the same position modulo k (AI pictures are
 * rarely aligned to the corner, hence the offset). The largest k that gathers 80 % of them wins,
 * and then nearly every block has to be of one colour.
 */
export function detectScale(cv: Canvas, max = 16): { k: number; ox: number; oy: number } {
  const lab = cv.p.map((row) => row.map((c) => (c[3] >= OPAQUE ? oklab(c) : null)));
  const differ = (a: [number, number, number] | null, b: [number, number, number] | null): boolean =>
    (a === null) !== (b === null) || (a !== null && b !== null && Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 0.08);
  // Edges between two colours inside the sprite say where the grid is better than the edge of
  // the silhouette, which a soft (antialiased) border shifts by a pixel: those are only used
  // when there are too few of the others.
  const edges = (inside: boolean): [number[], number[]] => {
    const col = new Array<number>(cv.w + 1).fill(0);
    const row = new Array<number>(cv.h + 1).fill(0);
    const ok = (a: unknown, b: unknown): boolean => !inside || (a !== null && b !== null);
    for (let y = 0; y < cv.h; y++) for (let x = 0; x + 1 < cv.w; x++) if (ok(lab[y]![x], lab[y]![x + 1]) && differ(lab[y]![x]!, lab[y]![x + 1]!)) col[x + 1]!++;
    for (let y = 0; y + 1 < cv.h; y++) for (let x = 0; x < cv.w; x++) if (ok(lab[y]![x], lab[y + 1]![x]) && differ(lab[y]![x]!, lab[y + 1]![x]!)) row[y + 1]!++;
    return [col, row];
  };
  const sum = (a: number[]): number => a.reduce((t, n) => t + n, 0);
  let [colEdges, rowEdges] = edges(true);
  if (sum(colEdges) < 20 || sum(rowEdges) < 20) [colEdges, rowEdges] = edges(false);
  const phase = (edges: number[], k: number): { share: number; off: number } => {
    const byRes = new Array<number>(k).fill(0);
    let total = 0;
    edges.forEach((n, i) => {
      byRes[i % k]! += n;
      total += n;
    });
    let off = 0;
    for (let r = 1; r < k; r++) if (byRes[r]! > byRes[off]!) off = r;
    return { share: total ? byRes[off]! / total : 0, off };
  };
  for (let k = Math.min(max, Math.floor(Math.min(cv.w, cv.h) / 4)); k >= 2; k--) {
    const px = phase(colEdges, k);
    const py = phase(rowEdges, k);
    if (px.share < 0.8 || py.share < 0.8) continue;
    // Confirm: nearly every block with something in it is one colour.
    let blocks = 0;
    let flat = 0;
    for (let by = py.off; by + k <= cv.h; by += k) {
      for (let bx = px.off; bx + k <= cv.w; bx += k) {
        const centre = lab[by + (k >> 1)]![bx + (k >> 1)]!;
        let any = false;
        let same = 0;
        for (let y = by; y < by + k; y++) {
          for (let x = bx; x < bx + k; x++) {
            const c = lab[y]![x]!;
            if (c) any = true;
            if (!differ(c, centre)) same++;
          }
        }
        if (!any) continue;
        blocks++;
        if (same >= k * k * 0.8) flat++;
      }
    }
    if (blocks >= 4 && flat >= blocks * 0.9) return { k, ox: px.off, oy: py.off };
  }
  return { k: 1, ox: 0, oy: 0 };
}

/** One real pixel per block: the most common palette colour of its opaque pixels. */
function downscale(cv: Canvas, k: number, ox: number, oy: number): Canvas {
  if (k === 1) return cv;
  const w = Math.floor((cv.w - ox) / k);
  const h = Math.floor((cv.h - oy) / k);
  const out = new Canvas(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const votes = new Map<string, { c: RGBA; n: number }>();
      let opaque = 0;
      for (let j = 0; j < k; j++) {
        for (let i = 0; i < k; i++) {
          const c = cv.get(ox + x * k + i, oy + y * k + j);
          if (c[3] < OPAQUE) continue;
          opaque++;
          const s = nearest(c).c;
          const key = s.join();
          const v = votes.get(key);
          if (v) v.n++;
          else votes.set(key, { c: s, n: 1 });
        }
      }
      if (opaque * 2 < k * k) continue;
      let best: { c: RGBA; n: number } | null = null;
      for (const v of votes.values()) if (!best || v.n > best.n) best = v;
      out.put(x, y, best!.c);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// The whole pass.

/** Check a sidecar JSON. Returns the errors (empty if it can go in). */
export function validate(meta: Partial<IncomingMeta>, existing: ReadonlySet<string> = new Set()): string[] {
  const err: string[] = [];
  if (!meta.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta.id)) err.push('«id» tiene que ser un nombre en minúsculas con guiones (p. ej. «tostadora-nueva»)');
  if (!meta.licencia || !(LICENCES as readonly string[]).includes(meta.licencia)) err.push(`«licencia» tiene que ser una de: ${LICENCES.join(', ')}`);
  for (const k of ['que', 'autor', 'origen'] as const) if (!meta[k] || !String(meta[k]).trim()) err.push(`falta «${k}»`);
  if (meta.fotogramas !== undefined && (!Number.isInteger(meta.fotogramas) || meta.fotogramas < 1)) err.push('«fotogramas» tiene que ser un entero ≥ 1');
  if (meta.escala !== undefined && (!Number.isInteger(meta.escala) || meta.escala < 1)) err.push('«escala» tiene que ser un entero ≥ 1');
  if (meta.id && existing.has(meta.id) && !meta.reemplaza) err.push(`ya hay una hoja «${meta.id}»: pon «reemplaza»: true si quieres sustituirla`);
  return err;
}

/** Turn an outside picture into a sheet in the game's palette and size. */
export function processIncoming(src: Canvas, meta: IncomingMeta): Sheet {
  const { k, ox, oy } = meta.escala ? { k: meta.escala, ox: 0, oy: 0 } : detectScale(src);
  const small = downscale(src, k, ox, oy);
  // Snap to the palette (downscale already did when k > 1) and drop the soft edge.
  const frames = meta.fotogramas ?? 1;
  const fw = Math.floor(small.w / frames);
  if (fw * frames !== small.w) throw new Error(`${meta.id}: ${small.w} px de ancho no se reparten en ${frames} fotogramas`);
  const pad = meta.contorno ? 1 : 0;
  // A common crop for every frame, so they stay aligned.
  let x0 = fw;
  let y0 = small.h;
  let x1 = -1;
  let y1 = -1;
  for (let f = 0; f < frames; f++) {
    for (let y = 0; y < small.h; y++) {
      for (let x = 0; x < fw; x++) {
        if (small.get(f * fw + x, y)[3] < OPAQUE) continue;
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x);
        y1 = Math.max(y1, y);
      }
    }
  }
  if (x1 < 0) throw new Error(`${meta.id}: la imagen está vacía`);
  const cw = x1 - x0 + 1 + pad * 2;
  const ch = y1 - y0 + 1 + pad * 2;
  const W = meta.ancho ?? cw;
  const H = meta.alto ?? ch;
  if (cw > W || ch > H) throw new Error(`${meta.id}: mide ${cw} × ${ch} y no cabe en ${W} × ${H}`);
  // Standing on the bottom edge, centred.
  const dx = Math.floor((W - cw) / 2) + pad;
  const dy = H - ch + pad;
  const sheet = new Canvas(W * frames, H);
  for (let f = 0; f < frames; f++) {
    const p = new Paint(W, H);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const c = small.get(f * fw + x, y);
        if (c[3] < OPAQUE) continue;
        const s = nearest(c);
        if (s.m) p.px(dx + x - x0, dy + y - y0, s.m, s.tone);
        else p.raw(dx + x - x0, dy + y - y0, s.c);
      }
    }
    sheet.blit(meta.contorno ? p.outline() : p.cv, f * W, 0);
  }
  return { canvas: sheet, frameW: W, frameH: H };
}

export interface Incoming {
  meta: IncomingMeta;
  sheet: Sheet;
}

/**
 * Every sprite in a folder, processed. Refuses (throws, with every reason) anything without a
 * valid JSON. `existing` are the sheets drawn by code, which only `reemplaza` may override.
 */
export function readIncoming(dir = INCOMING_DIR, existing: ReadonlySet<string> = new Set()): Incoming[] {
  if (!existsSync(dir)) return [];
  const out: Incoming[] = [];
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const name of readdirSync(dir).filter((n) => n.toLowerCase().endsWith('.png')).sort()) {
    const json = join(dir, name.replace(/\.png$/i, '.json'));
    if (!existsSync(json)) {
      problems.push(`${name}: falta ${name.replace(/\.png$/i, '.json')} (qué es, autor, licencia y origen)`);
      continue;
    }
    let meta: Partial<IncomingMeta>;
    try {
      meta = JSON.parse(readFileSync(json, 'utf8')) as Partial<IncomingMeta>;
    } catch (e) {
      problems.push(`${name}: el JSON no se puede leer (${(e as Error).message})`);
      continue;
    }
    const err = validate(meta, existing);
    if (meta.id && seen.has(meta.id)) err.push(`«${meta.id}» está repetido en art/entrada/`);
    if (err.length) {
      problems.push(...err.map((e) => `${name}: ${e}`));
      continue;
    }
    seen.add(meta.id!);
    try {
      out.push({ meta: meta as IncomingMeta, sheet: processIncoming(decodePng(readFileSync(join(dir, name))), meta as IncomingMeta) });
    } catch (e) {
      problems.push(`${name}: ${(e as Error).message}`);
    }
  }
  if (problems.length) throw new Error('art/entrada/:\n- ' + problems.join('\n- '));
  return out;
}

const START = '<!-- entrada:inicio -->';
const END = '<!-- entrada:fin -->';

/** The credits section for the outside sprites (CREDITOS.md, between its two markers). */
export function creditsSection(items: readonly Incoming[]): string {
  const rows = items.map(({ meta: m }) => `| ${m.que} (\`${m.id}\`) | ${m.autor} | ${m.licencia} | ${m.origen} |`);
  return [
    START,
    '## Sprites de fuera (`art/entrada/`)',
    '',
    'Los apunta solo `node tools/sprites/entrada.ts`: no se editan a mano.',
    '',
    ...(rows.length ? ['| Sprite | Autor | Licencia | Origen |', '| --- | --- | --- | --- |', ...rows] : ['Ninguno todavía.']),
    END,
  ].join('\n');
}

export function withCredits(credits: string, items: readonly Incoming[]): string {
  const sec = creditsSection(items);
  const a = credits.indexOf(START);
  const b = credits.indexOf(END);
  if (a >= 0 && b > a) return credits.slice(0, a) + sec + credits.slice(b + END.length);
  return credits.trimEnd() + '\n\n' + sec + '\n';
}

/** For tools/sprites/build.ts: the outside sheets to add to (or replace in) the game's. */
export function incomingSheets(existing: ReadonlySet<string>): Record<string, Sheet> {
  const out: Record<string, Sheet> = {};
  for (const { meta, sheet } of readIncoming(INCOMING_DIR, existing)) out[meta.id] = sheet;
  return out;
}

function main(): void {
  const items = readIncoming(INCOMING_DIR);
  const prev = join(INCOMING_DIR, 'procesados');
  if (items.length) mkdirSync(prev, { recursive: true });
  for (const { meta, sheet } of items) writeFileSync(join(prev, `${meta.id}.png`), encodePng(sheet.canvas));
  const file = join(ROOT, 'CREDITOS.md');
  writeFileSync(file, withCredits(readFileSync(file, 'utf8'), items));
  console.log(items.length ? `${items.length} sprites de fuera listos (vista previa en art/entrada/procesados/). Ahora: npm run sprites` : 'No hay sprites en art/entrada/.');
}

if (import.meta.url === `file://${process.argv[1]}`) main();
