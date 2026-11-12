// The return slip (ficha de devolución) that opens every run (M13): the product's name, why it
// was returned, the customer's comments, the shop's diagnosis, the warranty and where it goes
// now, read out by the conveyor line by line; then a stamp across it. Pure (no Phaser): the scene
// draws it, tests/ficha-devolucion.test.ts checks that it fits at both text sizes.
import { FONT_LINE, textWidth, wrapLines } from '../art/font.ts';
import { HUD_H, HUD_W } from './hud.ts';
import { stampBox } from './form.ts';
import { SLIP_READER, SLIP_TITLE } from '../data/stories.ts';

export type SlipRole = 'title' | 'ref' | 'reader' | 'label' | 'value' | 'signLabel' | 'sign' | 'hint';

export interface SlipText {
  text: string;
  x: number;
  y: number;
  role: SlipRole;
  /** Order in which the conveyor reads it out (labels and values); -1: there from the start. */
  read: number;
}

export interface SlipLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  barH: number;
  texts: SlipText[];
  /** The dashed line over the hint. */
  rule: number;
  /** The stamp's centre (it is drawn at STAMP_SCALE, tilted). */
  stamp: { x: number; y: number };
  /**
   * At double size there is no room for its own band: it lands on the last rows, so after a
   * moment it fades to let them be read.
   */
  stampFades: boolean;
}

/** Where the customer signs, left of the stamp. */
export const SLIP_SIGN = { label: 'Firma del cliente', text: 'ilegible' } as const;

/**
 * Lays out the slip: the title bar (title and number), the reader's line, the rows (label column
 * and values that wrap), a band with the customer's signature on the left and room for the stamp
 * on the right, the dashed rule and the hint. Centred on the screen.
 */
export function slipLayout(rows: { label: string; text: string }[], ref: string, stamp: string, hint: string, scale = 1): SlipLayout {
  const s = scale;
  const big = s > 1;
  const line = FONT_LINE * s;
  const step = big ? line : line + 1;
  const w = big ? HUD_W - 8 : 360;
  const barH = 4 + line + 1;
  const texts: SlipText[] = [];
  texts.push({ text: SLIP_TITLE, x: 8, y: 4, role: 'title', read: -1 });
  texts.push({ text: ref, x: w - 8 - textWidth(ref) * s, y: 4, role: 'ref', read: -1 });
  let y = 1 + barH + 4;
  // At double size the reader's line does not fit: the slip itself is the voice.
  if (!big) {
    texts.push({ text: `${SLIP_READER}…`, x: 10, y, role: 'reader', read: -1 });
    y += step + 3;
  }
  const labelW = Math.max(...rows.map((r) => textWidth(`${r.label}:`))) * s;
  const valueX = 10 + labelW + 8;
  const room = w - valueX - 10;
  let read = 0;
  for (const r of rows) {
    texts.push({ text: `${r.label}:`, x: 10, y, role: 'label', read: read++ });
    for (const l of wrapLines(r.text, room, s)) {
      texts.push({ text: l, x: valueX, y, role: 'value', read: read++ });
      y += step;
    }
    y += big ? 0 : 2;
  }
  // The band: the signature on the left, the stamp on the right (at double size, the stamp goes
  // over the last rows instead).
  const sb = stampBox(stamp, { x: 0, y: 0 });
  const bandH = big ? line : Math.ceil(sb.h) + 2;
  const signY = y + Math.round(bandH / 2 - line / 2);
  texts.push({ text: `${SLIP_SIGN.label}:`, x: 10, y: signY, role: 'signLabel', read: read++ });
  texts.push({ text: SLIP_SIGN.text, x: 10 + (textWidth(`${SLIP_SIGN.label}:`) + 6) * s, y: signY, role: 'sign', read: read++ });
  const stampAt = { x: w - 10 - Math.ceil(sb.w / 2), y: big ? y + bandH - Math.ceil(sb.h / 2) : y + Math.round(bandH / 2) };
  y += bandH + 3;
  const rule = y;
  y += big ? 3 : 4;
  const hintW = textWidth(hint) * s;
  texts.push({ text: hint, x: Math.round(w / 2 - hintW / 2), y, role: 'hint', read: -1 });
  const h = y + line + (big ? 2 : 3);
  const x = Math.round((HUD_W - w) / 2);
  const top = Math.max(2, Math.round((HUD_H - h) / 2));
  return {
    x,
    y: top,
    w,
    h,
    size: 8 * s,
    barH,
    texts: texts.map((t) => ({ ...t, x: x + t.x, y: top + t.y })),
    rule: top + rule,
    stamp: { x: x + stampAt.x, y: top + stampAt.y },
    stampFades: big,
  };
}

/** How many read-out steps the slip has (the last `read` + 1). */
export function slipSteps(L: SlipLayout): number {
  return Math.max(0, ...L.texts.map((t) => t.read + 1));
}

