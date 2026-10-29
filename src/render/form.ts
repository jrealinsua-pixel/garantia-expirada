// Where everything goes on a report form (the sick-leave report and the floor-done one). Pure
// (no Phaser): the scene draws it, tests/texto-grande.test.ts checks that it fits at both sizes.
import { FONT_LINE, textWidth, wrapLines } from '../art/font.ts';
import { HUD_H, HUD_W } from './hud.ts';
import { REPORT_GEAR } from '../data/texts.ts';

/** What a piece of text on the form is, which decides its colour. */
export type FormRole = 'title' | 'ref' | 'label' | 'value' | 'aside' | 'adviceLabel' | 'advice' | 'gearLabel' | 'hint';

export interface FormText {
  text: string;
  x: number;
  y: number;
  role: FormRole;
}

export interface FormLayout {
  /** The form's box on the screen. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Font size for all its text. */
  size: number;
  /** Height of the coloured title bar (it starts 1 px in). */
  barH: number;
  texts: FormText[];
  /** The row of what it was carrying: icons go from `x` to `right`, bottoms on `base`. */
  gear: { x: number; right: number; base: number };
  /** The dashed line over the hint. */
  rule: number;
  /** Where the stamp lands (its centre). */
  stamp: { x: number; y: number };
  /** No free spot for it: it lands on some text, so after a moment it fades to let it be read. */
  stampFades: boolean;
}

/** The form at the font's own size: the size it has always had. */
const SMALL = { w: 296, h: 186 };
/** At double size it takes nearly the whole screen. */
const BIG_W = HUD_W - 8;

/**
 * Lays out a report: a title bar with `title` and `ref`; the facts (label and value, or a value
 * alone in a quieter colour); before the advice line, the gear row; the advice (label, then its
 * text under it); and `hint` along the bottom. At `scale` 2 every text is double size, values and
 * advice wrap, and the form grows to fit (up to the screen's height).
 */
export function formLayout(lines: { label: string; text: string }[], title: string, ref: string, hint: string, scale = 1, stamp = ''): FormLayout {
  const s = scale;
  const line = FONT_LINE * s;
  const big = s > 1;
  // At double size the lines touch (the font's cell already has its blank rows above and below).
  const step = big ? line : line + 1;
  const w = big ? BIG_W : SMALL.w;
  const facts = lines.filter((l) => l.label && !isAdvice(l.label));
  const labelW = Math.max(...facts.map((l) => textWidth(`${l.label}:`)), big ? textWidth(`${REPORT_GEAR}:`) : 0) * s;
  const valueX = big ? 10 + labelW + 12 : 76;
  const valueRoom = w - valueX - 10;
  const texts: FormText[] = [];
  const barH = 4 + line + 1;
  texts.push({ text: title, x: 8, y: 4, role: 'title' });
  texts.push({ text: ref, x: w - 8 - textWidth(ref) * s, y: 4, role: 'ref' });
  let y = 1 + barH + (big ? 5 : 6);
  let gearBase = 0;
  for (const ln of lines) {
    const advice = isAdvice(ln.label);
    if (advice) {
      // What it was carrying goes between the facts and the advice.
      texts.push({ text: `${REPORT_GEAR}:`, x: 10, y: y + (big ? 1 : 5), role: 'gearLabel' });
      gearBase = y + 1 + 15 + (big ? 1 : 0);
      // The gear row, and a gap.
      y += big ? 24 : 25;
      texts.push({ text: `${ln.label}:`, x: 10, y, role: 'adviceLabel' });
      y += step;
      for (const l of wrapLines(ln.text, w - 20, s)) {
        texts.push({ text: l, x: 10, y, role: 'advice' });
        y += step;
      }
      continue;
    }
    if (ln.label) texts.push({ text: `${ln.label}:`, x: 10, y, role: 'label' });
    for (const l of big ? wrapLines(ln.text, valueRoom, s) : [ln.text]) {
      texts.push({ text: l, x: valueX, y, role: ln.label ? 'value' : 'aside' });
      y += step;
    }
  }
  // The bottom: a gap, the dashed rule, the hint under it.
  const bottomH = big ? 28 : 22;
  const h = big ? Math.min(HUD_H - 4, Math.max(SMALL.h, y + 8 + bottomH)) : SMALL.h;
  const hintW = textWidth(hint) * s;
  texts.push({ text: hint, x: w / 2 - Math.round(hintW / 2), y: h - (big ? 24 : 15), role: 'hint' });
  const x = Math.round(HUD_W / 2 - w / 2);
  const top = Math.round(HUD_H / 2 - h / 2);
  // The stamp: bottom right, as on paper. At double size the text fills more of the form, so it
  // goes down the right-hand side to the free spot nearest the gear row.
  let st = { x: w - 66, y: h - 45 };
  let stampFades = false;
  if (big && stamp) {
    const box = stampBox(stamp, { x: 0, y: 0 });
    const gearEnd = 10 + labelW + 12 + 9 * 17;
    // Down the right-hand side, from the gear row down and then up from it.
    const spots: { x: number; y: number }[] = [];
    const cx = w - 10 - box.w / 2;
    const yMin = 1 + barH + 2 + box.h / 2;
    const yMax = h - bottomH - 2 - box.h / 2;
    for (let d = 0; d <= h; d += 2) {
      for (const yy of [gearBase - 8 + d, gearBase - 8 - d]) if (yy >= yMin && yy <= yMax) spots.push({ x: cx, y: yy });
    }
    const free = spots.find((c) => {
      const b = stampBox(stamp, c);
      if (b.x < gearEnd && b.y < gearBase && b.y + b.h > gearBase - 16) return false;
      return texts.every((t) => !boxesOverlap(b, { x: t.x, y: t.y, w: textWidth(t.text) * s, h: line }));
    });
    st = free ?? { x: cx, y: yMax };
    stampFades = !free;
  }
  return {
    x,
    y: top,
    w,
    h,
    size: 8 * s,
    barH,
    texts: texts.map((t) => ({ ...t, x: x + t.x, y: top + t.y })),
    gear: { x: x + valueX, right: x + w - 24, base: top + gearBase },
    rule: top + h - bottomH,
    stamp: { x: x + Math.round(st.x), y: top + Math.round(st.y) },
    stampFades,
  };
}

/** The stamp's scale on the form (it slams down from bigger). */
export const STAMP_SCALE = 2;
const STAMP_TILT = 0.22;

/** The box a stamp reading `text` covers, tilted, centred on `at`. */
export function stampBox(text: string, at: { x: number; y: number }): { x: number; y: number; w: number; h: number } {
  const sw = (textWidth(text) + 8) * STAMP_SCALE;
  const sh = 13 * STAMP_SCALE;
  const w = sw * Math.cos(STAMP_TILT) + sh * Math.sin(STAMP_TILT);
  const h = sw * Math.sin(STAMP_TILT) + sh * Math.cos(STAMP_TILT);
  return { x: at.x - w / 2, y: at.y - h / 2, w, h };
}

function boxesOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** The advice line at the end («Recomendación del fabricante», «Nota de la empresa»). */
function isAdvice(label: string): boolean {
  return /^(recomendación|nota)/i.test(label);
}

/** How far down the form its content goes (the last text before the rule), for the tests. */
export function formContentBottom(f: FormLayout): number {
  return Math.max(...f.texts.filter((t) => t.role !== 'hint').map((t) => t.y + FONT_LINE * (f.size / 8)));
}
