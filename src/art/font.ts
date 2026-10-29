// «Letra Pequeña»: the game's own pixel font (uppercase only for now). 5 px caps, 2 rows above
// for accents and 1 below for descenders. Glyphs are drawn white with a 1 px dark outline so
// they read over any floor and can be tinted.
import { Canvas, type RGBA } from './canvas.ts';
import { K, WHITE } from './lib.ts';

const BODY: Record<string, string> = {
  A: '.#./#.#/###/#.#/#.#',
  B: '##./#.#/##./#.#/##.',
  C: '.##/#../#../#../.##',
  D: '##./#.#/#.#/#.#/##.',
  E: '###/#../##./#../###',
  F: '###/#../##./#../#..',
  G: '.##/#../#.#/#.#/.##',
  H: '#.#/#.#/###/#.#/#.#',
  I: '###/.#./.#./.#./###',
  J: '..#/..#/..#/#.#/.#.',
  K: '#.#/#.#/##./#.#/#.#',
  L: '#../#../#../#../###',
  M: '#...#/##.##/#.#.#/#...#/#...#',
  N: '#..#/##.#/#.##/#..#/#..#',
  O: '.#./#.#/#.#/#.#/.#.',
  P: '##./#.#/##./#../#..',
  Q: '.#./#.#/#.#/#.#/.##',
  R: '##./#.#/##./#.#/#.#',
  S: '.##/#../.#./..#/##.',
  T: '###/.#./.#./.#./.#.',
  U: '#.#/#.#/#.#/#.#/###',
  V: '#.#/#.#/#.#/#.#/.#.',
  W: '#...#/#...#/#.#.#/##.##/#...#',
  X: '#.#/#.#/.#./#.#/#.#',
  Y: '#.#/#.#/.#./.#./.#.',
  Z: '###/..#/.#./#../###',
  '0': '###/#.#/#.#/#.#/###',
  '1': '.#./##./.#./.#./###',
  '2': '##./..#/.#./#../###',
  '3': '##./..#/.#./..#/##.',
  '4': '#.#/#.#/###/..#/..#',
  '5': '###/#../##./..#/##.',
  '6': '.##/#../###/#.#/###',
  '7': '###/..#/.#./.#./.#.',
  '8': '###/#.#/###/#.#/###',
  '9': '###/#.#/###/..#/##.',
  '.': '././././#',
  ':': './#/./#/.',
  '·': '././#/./.',
  '!': '#/#/#/./#',
  '¡': '#/./#/#/#',
  '?': '##./..#/.#./.../.#.',
  '¿': '.#./.../.#./#../.##',
  '-': '.../.../###/.../...',
  '+': '.../.#./###/.#./...',
  '=': '.../###/.../###/...',
  '×': '.../#.#/.#./#.#/...',
  '%': '#.#/..#/.#./#../#.#',
  '/': '..#/..#/.#./#../#..',
  '(': '.#/#./#./#./.#',
  ')': '#./.#/.#/.#/#.',
  "'": '#/#/././.',
  '"': '#.#/#.#/.../.../...',
  '«': '..../.#.#/#.#./.#.#/....',
  '»': '..../#.#./.#.#/#.#./....',
};

// Two rows above the body.
const ACCENT: Record<string, [string, string]> = {
  Á: ['A', '..#/.#.'],
  É: ['E', '..#/.#.'],
  Í: ['I', '..#/.#.'],
  Ó: ['O', '..#/.#.'],
  Ú: ['U', '..#/.#.'],
  Ü: ['U', '.../#.#'],
  Ñ: ['N', '.#.#/#.#.'],
};

export const FONT_H = 8;
export const FONT_LINE = 10;
const SPACE = 2;

export interface Glyph {
  w: number;
  /** 8 rows: 2 accent rows, 5 body rows, 1 descender row. */
  rows: string[];
}

function glyph(ch: string): Glyph | null {
  let top = ['', ''];
  let body = BODY[ch];
  const acc = ACCENT[ch];
  if (acc) {
    body = BODY[acc[0]];
    top = acc[1].split('/');
  }
  let bottom = '';
  if (ch === ',' || ch === ';') {
    body = ch === ',' ? '././././#' : './#/././#';
    bottom = '#';
  }
  if (!body) return null;
  const b = body.split('/');
  const w = Math.max(...b.map((r) => r.length), ...top.map((r) => r.length));
  const pad = (r: string): string => r.padEnd(w, '.');
  return { w, rows: [pad(top[0]!), pad(top[1]!), ...b.map(pad), pad(bottom)] };
}

export const GLYPHS: Map<string, Glyph> = new Map();
for (const ch of [...Object.keys(BODY), ...Object.keys(ACCENT), ',', ';']) {
  const g = glyph(ch);
  if (g) GLYPHS.set(ch, g);
}

export const FONT_CHARS = [...GLYPHS.keys()];

/** Normalises text for this uppercase-only font. */
export function fontText(s: string): string {
  return s.toLocaleUpperCase('es-ES');
}

export function textWidth(s: string): number {
  let w = 0;
  for (const ch of fontText(s)) w += ch === ' ' ? SPACE + 1 : (GLYPHS.get(ch)?.w ?? 3) + 1;
  return Math.max(0, w - 1);
}

/**
 * Atlas with one cell per glyph (outlined), laid out in a single row.
 * Each cell is (w + 2) x (FONT_H + 2); `cells` gives the x of each cell.
 */
export function buildFontAtlas(fill: RGBA = WHITE, line: RGBA = K): { canvas: Canvas; cells: Map<string, { x: number; w: number }> } {
  const cells = new Map<string, { x: number; w: number }>();
  let total = 0;
  for (const [ch, g] of GLYPHS) {
    cells.set(ch, { x: total, w: g.w + 2 });
    total += g.w + 2;
  }
  const cv = new Canvas(total, FONT_H + 2);
  for (const [ch, g] of GLYPHS) {
    const cx = cells.get(ch)!.x;
    g.rows.forEach((row, y) => [...row].forEach((p, x) => p === '#' && cv.set(cx + 1 + x, 1 + y, fill)));
  }
  // Outline inside each cell only.
  const out = cv.clone();
  for (const [ch, g] of GLYPHS) {
    const cx = cells.get(ch)!.x;
    for (let y = 0; y < FONT_H + 2; y++) {
      for (let x = cx; x < cx + g.w + 2; x++) {
        if (cv.get(x, y)[3] > 0) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx!;
          const ny = y + dy!;
          return nx >= cx && nx < cx + g.w + 2 && ny >= 0 && ny < FONT_H + 2 && cv.get(nx, ny)[3] > 0;
        });
        if (near) out.put(x, y, line);
      }
    }
  }
  return { canvas: out, cells };
}

/**
 * Word wrap for this font: `s` in lines no wider than `maxW` px when drawn `scale` times its
 * size (a single word wider than that gets a line to itself). `\n` always breaks.
 */
export function wrapLines(s: string, maxW: number, scale = 1): string[] {
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const word of para.split(' ').filter((w) => w !== '')) {
      const next = line ? `${line} ${word}` : word;
      if (line && textWidth(next) * scale > maxW) {
        out.push(line);
        line = word;
      } else line = next;
    }
    out.push(line);
  }
  return out;
}
