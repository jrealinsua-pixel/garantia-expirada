// The «Cita previa» notice of the Servicio Técnico (M12), opened as a panel when the toaster
// stands at it in the Mostrador: each requirement with its box (ticked once met) and how far along
// it is, and under them the small print, or the stamp once the appointment is granted. Pure (no
// Phaser): the scene draws it, tests/servicio-cartel.test.ts checks that it fits at both text sizes.
import { FONT_LINE, wrapLines } from '../art/font.ts';
import { HUD_H, HUD_W } from './hud.ts';
import { SERVICE } from '../data/servicio.ts';
import type { ServiceRow } from '../sim/unlocks.ts';

export type CitaRole = 'title' | 'text' | 'met' | 'progress' | 'done' | 'foot' | 'granted';

export interface CitaText {
  text: string;
  x: number;
  y: number;
  role: CitaRole;
  /** Right-aligned at x. */
  right?: boolean;
}

export interface CitaLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  barH: number;
  texts: CitaText[];
  /** Each requirement's box (top-left, side in px) and whether it is ticked. */
  boxes: { x: number; y: number; side: number; ticked: boolean }[];
  /** A thin line under every row but the last. */
  rules: number[];
}

/** What the notice says (src/sim/unlocks.ts serviceBoard). */
export interface CitaBoard {
  rows: readonly ServiceRow[];
  granted: boolean;
  fewProducts: boolean;
}

/** On the right of a row: «3/5» while it is not met, «Cumplido» once it is. */
export const CITA_DONE = 'Cumplido';
export const citaCount = (r: ServiceRow): string => (r.met ? CITA_DONE : `${r.done}/${r.needed}`);

/** Room left at the bottom of the screen for the controls hint. */
const BOTTOM_HUD = 24;

/** The panel, low on the screen (the notice hangs high, so the toaster is up there). */
export function citaLayout(b: CitaBoard, scale = 1): CitaLayout {
  const s = scale;
  const big = s > 1;
  const line = FONT_LINE * s;
  const w = big ? HUD_W - 8 : 340;
  const barH = line + 3;
  // The box fits the tick sprite (7 × 7, drawn one up) at a whole scale: 1, or 2 at double size.
  const side = big ? 14 : 8;
  const textX = 8 + side + 6;
  const countW = big ? 0 : 52;
  const room = w - textX - 8 - countW;
  const texts: CitaText[] = [{ text: SERVICE.title, x: 6, y: 2, role: 'title' }];
  const boxes: CitaLayout['boxes'] = [];
  const rules: number[] = [];
  let y = barH + 5;
  b.rows.forEach((r, i) => {
    const top = y;
    // At double size the count goes at the end of the text: there is no room for a column.
    const body = big ? `${r.text} ${citaCount(r)}` : r.text;
    const lines = wrapLines(body, room, s);
    lines.forEach((l, k) => texts.push({ text: l, x: textX, y: y + line * k, role: r.met ? 'met' : 'text' }));
    if (!big) texts.push({ text: citaCount(r), x: w - 8, y, role: r.met ? 'done' : 'progress', right: true });
    const rowH = Math.max(side + 2, lines.length * line);
    boxes.push({ x: 8, y: top + Math.max(0, Math.floor((Math.min(rowH, line) - side) / 2)), side, ticked: r.met });
    y = top + rowH + 4;
    if (i < b.rows.length - 1) rules.push(y - 2);
  });
  y += 2;
  const foot = b.granted ? [SERVICE.granted] : [SERVICE.pending, ...(b.fewProducts ? [SERVICE.fewProducts] : [])];
  for (const f of foot) {
    for (const l of wrapLines(f, w - 16, s)) {
      texts.push({ text: l, x: 8, y, role: b.granted ? 'granted' : 'foot' });
      y += line;
    }
  }
  const h = y + 3;
  const x = Math.round((HUD_W - w) / 2);
  const top = Math.max(4, HUD_H - h - BOTTOM_HUD);
  for (const t of texts) {
    t.x += x;
    t.y += top;
  }
  for (const bx of boxes) {
    bx.x += x;
    bx.y += top;
  }
  return { x, y: top, w, h, size: 8 * s, barH, texts, boxes, rules: rules.map((r) => r + top) };
}
