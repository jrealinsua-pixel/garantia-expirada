// The archivador «Reclamaciones sin Resolver» opened as a panel when the toaster stands at it in
// the Mostrador: the list of story documents (found or not) and the open page of one of them.
// Pure (no Phaser): the scene draws it, tests/archivador-panel.test.ts checks it fits at both sizes.
import { FONT_LINE, textWidth, wrapLines } from '../art/font.ts';
import { HUD_H, HUD_W } from './hud.ts';
import type { ArchiveCursor, ArchiveEntry } from '../sim/archive.ts';
import { ARCHIVE_EMPTY, ARCHIVE_NEW, ARCHIVE_TITLE, archivePage } from '../data/texts.ts';

/** What a text on the panel is, which decides its colour. */
export type ArchiveRole = 'title' | 'count' | 'doc' | 'open' | 'missing' | 'new' | 'page' | 'folio' | 'hint';

export interface ArchiveText {
  text: string;
  x: number;
  y: number;
  role: ArchiveRole;
  /** Right-aligned at x. */
  right?: boolean;
}

export interface ArchiveLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  barH: number;
  texts: ArchiveText[];
  /** The dashed line between the list and the open page. */
  rule: number;
}

/** Room left at the bottom of the screen for the controls hint and the ammo counter. */
const BOTTOM_HUD = 24;

/**
 * At the font's size: the title bar with how many there are, one line per document (the open one
 * brighter, the missing ones as «Expediente extraviado»), then the open page and, along the
 * bottom, which sheet it is and the key that turns it. At double size there is no list: the open
 * document's heading, its page and the footer.
 */
export function archiveLayout(entries: readonly ArchiveEntry[], cursor: ArchiveCursor, hint: string, scale = 1): ArchiveLayout {
  const s = scale;
  const big = s > 1;
  const line = FONT_LINE * s;
  const w = big ? HUD_W - 8 : 340;
  const barH = line + 3;
  const room = w - 16;
  const found = entries.filter((e) => e.found).length;
  const texts: ArchiveText[] = [
    { text: ARCHIVE_TITLE, x: 6, y: 2, role: 'title' },
    { text: `${found}/${entries.length}`, x: w - 6, y: 2, role: 'count', right: true },
  ];
  const open = entries[cursor.doc];
  let y = barH + 4;
  const put = (s2: string, role: ArchiveRole): void => {
    for (const l of wrapLines(s2, room, s)) {
      texts.push({ text: l, x: 8, y, role });
      y += line;
    }
  };
  if (!big) {
    for (const [i, e] of entries.entries()) {
      // One line each: a heading too long for it is cut with «...».
      const right = e.fresh ? ARCHIVE_NEW : '';
      texts.push({ text: fit(e.heading, room - (right ? 40 : 0)), x: 8, y, role: !e.found ? 'missing' : i === cursor.doc ? 'open' : 'doc' });
      if (right) texts.push({ text: right, x: w - 8, y, role: 'new', right: true });
      y += line;
    }
  } else if (open) put(open.heading, 'open');
  y += 2;
  const rule = y;
  y += 4;
  if (open) put(open.pages[cursor.page] ?? '', 'page');
  else put(ARCHIVE_EMPTY, 'page');
  y += 3;
  if (open) texts.push({ text: archivePage(cursor.page + 1, open.pages.length), x: 8, y, role: 'folio' });
  if (open && found > 0) texts.push({ text: hint, x: w - 8, y, role: 'hint', right: true });
  y += line + 2;
  const h = y;
  const x = Math.round((HUD_W - w) / 2);
  const top = Math.max(4, HUD_H - h - BOTTOM_HUD);
  for (const t of texts) {
    t.x += x;
    t.y += top;
  }
  return { x, y: top, w, h, size: 8 * s, barH, texts, rule: rule + top };
}

/** `s` cut to fit in `maxW` px at the font's size, with «...» if it had to be cut. */
export function fit(s: string, maxW: number): string {
  if (textWidth(s) <= maxW) return s;
  let out = s;
  while (out.length > 1 && textWidth(`${out}...`) > maxW) out = out.slice(0, -1).trimEnd();
  return `${out}...`;
}
