// The tablón «Productos en Exposición» opened as a panel when the toaster stands at it in the
// Mostrador. Pure (no Phaser): the scene draws it, tests/tablon.test.ts checks that it fits at
// both text sizes.
import { FONT_LINE, textWidth, wrapLines } from '../art/font.ts';
import { HUD_H, HUD_W } from './hud.ts';
import { BOARD_FOOT, BOARD_RESTOCK, BOARD_TITLE } from '../data/texts.ts';

/** One character on the board, as src/sim/unlocks.ts `rosterBoard` gives it (plus whether it can be played yet). */
export interface BoardEntry {
  id: string;
  name: string;
  /** The blurb once unlocked; the condition while locked. */
  text: string;
  unlocked: boolean;
  progress: { done: number; needed: number }[];
  /** Unlocked but not in the game yet (the others arrive in M13). */
  soon?: boolean;
}

/** What a text on the panel is, which decides its colour. */
export type BoardRole = 'title' | 'name' | 'locked' | 'text' | 'progress' | 'soon' | 'foot';

export interface BoardText {
  text: string;
  x: number;
  y: number;
  role: BoardRole;
  /** Right-aligned at x. */
  right?: boolean;
}

export interface BoardLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  size: number;
  barH: number;
  texts: BoardText[];
  /** The face of each row (frame of the `fichas-tablon` sheet), its top-left and its zoom. */
  faces: { frame: number; x: number; y: number; zoom: number }[];
  /** A thin line under every row but the last. */
  rules: number[];
}

/** «3/10» for the counted parts of a condition (a single boss is just there or not). */
export function progressLabel(progress: { done: number; needed: number }[]): string {
  return progress
    .filter((p) => p.needed > 1)
    .map((p) => `${p.done}/${p.needed}`)
    .join(' · ');
}

/** Room left at the bottom of the screen for the controls hint and the ammo counter. */
const BOTTOM_HUD = 24;

/** The faces sheet: the five in colour, then their silhouettes, in board order. */
const FACES = 5;

/**
 * The panel low on the screen (the board hangs high, so the toaster is up there): a red title bar and one row per character, its face
 * on the left. At the font's size, each row has the name (with how far along it is, or «Reposición
 * pronto») and under it the blurb or the condition. At double size there is room for one thing
 * per row: the name once unlocked, the condition (and how far along) while locked.
 */
export function boardLayout(entries: readonly BoardEntry[], scale = 1): BoardLayout {
  const s = scale;
  const big = s > 1;
  const line = FONT_LINE * s;
  const w = big ? HUD_W - 8 : 340;
  const barH = line + 3;
  const zoom = big ? 3 : 2;
  const faceW = 6 * zoom;
  const faceH = 7 * zoom;
  const textX = 8 + faceW + 6;
  const room = w - textX - 8;
  const texts: BoardText[] = [{ text: BOARD_TITLE, x: 6, y: 2, role: 'title' }];
  const faces: BoardLayout['faces'] = [];
  const rules: number[] = [];
  let y = barH + 4;
  entries.forEach((e, i) => {
    const top = y;
    const right = e.unlocked ? (e.soon ? BOARD_RESTOCK : '') : progressLabel(e.progress);
    let lines = 0;
    if (!big) {
      texts.push({ text: e.name, x: textX, y, role: e.unlocked ? 'name' : 'locked' });
      if (right) texts.push({ text: right, x: w - 8, y, role: e.unlocked ? 'soon' : 'progress', right: true });
      for (const l of wrapLines(e.text, room, s)) texts.push({ text: l, x: textX, y: y + line * ++lines, role: 'text' });
      lines++;
    } else {
      const main = e.unlocked ? e.name : right ? `${e.text} ${right}` : e.text;
      for (const l of wrapLines(main, room, s)) texts.push({ text: l, x: textX, y: y + line * lines++, role: e.unlocked ? 'name' : 'text' });
    }
    const rowH = Math.max(faceH + 2, lines * line);
    faces.push({ frame: e.unlocked ? i : FACES + i, x: 8, y: top + Math.floor((rowH - faceH) / 2), zoom });
    y = top + rowH + 3;
    if (i < entries.length - 1) rules.push(y - 2);
  });
  if (!big) {
    texts.push({ text: BOARD_FOOT, x: w - 8, y: y + 1, role: 'foot', right: true });
    y += line + 1;
  }
  const h = y + 2;
  const x = Math.round((HUD_W - w) / 2);
  // Above the controls hint and the ammo along the bottom edge, when there is room for it.
  const top = Math.max(4, HUD_H - h - BOTTOM_HUD);
  for (const t of texts) {
    t.x += x;
    t.y += top;
  }
  for (const f of faces) {
    f.x += x;
    f.y += top;
  }
  return { x, y: top, w, h, size: 8 * s, barH, texts, faces, rules: rules.map((r) => r + top) };
}

/** Width of a placed text, to check that it stays inside the panel. */
export function boardTextBox(t: BoardText, size: number): { left: number; right: number } {
  const wd = textWidth(t.text) * (size / 8);
  return t.right ? { left: t.x - wd, right: t.x } : { left: t.x, right: t.x + wd };
}
