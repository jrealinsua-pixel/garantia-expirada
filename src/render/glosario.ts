// The glossary screen (M14), drawn by the pause menu (src/render/PauseScene.ts): a tab for the
// enemies and one for the weapons; on the left the list (the unknown ones as «Sin catalogar»), on
// the right the chosen one's card: its picture (a dark silhouette until it is known), its name,
// its line and how many have been taken apart (the weapons, their numbers).
import { fontText, textWidth } from '../art/font.ts';
import { ENEMIES } from '../data/enemies.ts';
import { WEAPONS } from '../data/weapons.ts';
import { weaponStatRows } from '../data/describe.ts';
import {
  GLOSSARY_HINT,
  GLOSSARY_SUB,
  GLOSSARY_TABS,
  GLOSSARY_TITLE,
  GLOSSARY_UNKNOWN,
  GLOSSARY_UNKNOWN_BOSS,
  GLOSSARY_UNKNOWN_ENEMY,
  GLOSSARY_UNKNOWN_WEAPON,
  glossaryCount,
  glossaryTab,
  PAUSE_MENU,
} from '../data/texts.ts';
import { GLOSSARY_TAB_ORDER, type GlossaryEntry, type GlossaryTab } from '../sim/glossary.ts';
import { INVENTORY } from './hud.ts';
import { FONT } from './textures.ts';

const GOLD = 0xf6c431;
const CREAM = 0xd6cdb2;
const GREY = 0x858ea8;
const DIM = 0x5a627c;
const TEAL = 0x69dbd8;

/** Where things go (the panel is the inventory's). */
export const GLOSSARY = { listW: 168, rowH: 12, visible: 14, picW: 110, picH: 92 } as const;

export interface GlossaryPaint {
  tab: GlossaryTab;
  entries: readonly GlossaryEntry[];
  /** Known / total of each tab, for the tab labels. */
  progress: Record<GlossaryTab, { known: number; total: number }>;
  /** The cursor: 0..entries.length-1, or entries.length on «Volver». */
  index: number;
  hover: (i: number) => void;
  tabTo: (t: GlossaryTab) => void;
  back: () => void;
}

/** The name an entry shows in the list and on its card. */
export function entryName(tab: GlossaryTab, e: GlossaryEntry): string {
  if (!e.known) return GLOSSARY_UNKNOWN;
  return (tab === 'weapons' ? WEAPONS[e.id]?.name : ENEMIES[e.id]?.name) ?? e.id;
}

/** The first visible line of a list of `n` with `visible` lines, keeping the cursor in view. */
export function listWindow(n: number, visible: number, index: number): number {
  return Math.max(0, Math.min(n - visible, index - Math.floor(visible / 2)));
}

/** The biggest whole scale that fits a `w`×`h` frame in the picture box (at least 1, at most 4). */
export function pictureScale(w: number, h: number): number {
  return Math.max(1, Math.min(4, Math.floor(Math.min(GLOSSARY.picW / w, GLOSSARY.picH / h))));
}

export function paintGlossary(scene: Phaser.Scene, objs: Phaser.GameObjects.GameObject[], v: GlossaryPaint): void {
  const text = (x: number, y: number, s: string, tint: number, origin = 0): Phaser.GameObjects.BitmapText => {
    const t = scene.add.bitmapText(x, y, FONT, fontText(s), 8).setOrigin(origin, 0).setTint(tint);
    objs.push(t);
    return t;
  };
  const x0 = INVENTORY.x;
  const y0 = INVENTORY.y;
  const W = INVENTORY.w;
  const H = INVENTORY.h;
  const cx = x0 + W / 2;
  const g = scene.add.graphics();
  objs.push(g);
  g.fillStyle(0x0e0c16, 1).fillRect(x0 - 1, y0 - 1, W + 2, H + 2);
  g.fillStyle(0x101420, 0.97).fillRect(x0, y0, W, H);
  g.lineStyle(1, GOLD, 0.9).strokeRect(x0 + 0.5, y0 + 0.5, W - 1, H - 1);
  for (let x = x0 + 1; x < x0 + W - 1; x++) g.fillStyle(Math.floor(x / 4) % 2 === 0 ? 0xb08a1c : 0x191622, 1).fillRect(x, y0 + 1, 1, 3);
  text(cx, y0 + 9, GLOSSARY_TITLE, GOLD, 0.5);
  text(cx, y0 + 20, GLOSSARY_SUB, GREY, 0.5);

  // The two tabs, side by side: the open one gold and underlined, like a folder's label.
  const ty = y0 + 34;
  GLOSSARY_TAB_ORDER.forEach((t, i) => {
    const on = t === v.tab;
    const pr = v.progress[t];
    const label = glossaryTab(GLOSSARY_TABS[t], pr.known, pr.total);
    const tx = cx + (i === 0 ? -60 : 60);
    const lt = text(tx, ty, (on ? '« ' : '') + label + (on ? ' »' : ''), on ? GOLD : GREY, 0.5);
    lt.setInteractive({ useHandCursor: true }).on('pointerdown', () => v.tabTo(t));
    if (on) {
      const w = Math.ceil(lt.width);
      g.fillStyle(GOLD, 0.8).fillRect(Math.round(tx - w / 2), ty + 10, w, 1);
    }
  });

  // Left: the list, a window round the cursor, with a scroll bar when it does not fit.
  const lx = x0 + 10;
  const top = y0 + 52;
  const n = v.entries.length;
  const first = listWindow(n, GLOSSARY.visible, Math.min(v.index, n - 1));
  g.fillStyle(0x2c3048, 1).fillRect(x0 + GLOSSARY.listW + 10, top - 2, 1, GLOSSARY.visible * GLOSSARY.rowH + 2);
  v.entries.slice(first, first + GLOSSARY.visible).forEach((e, k) => {
    const i = first + k;
    const on = i === v.index;
    const y = top + k * GLOSSARY.rowH;
    if (on) g.fillStyle(0x2c3048, 1).fillRect(lx - 4, y - 2, GLOSSARY.listW - 2, GLOSSARY.rowH);
    // A small mark: a boss gets a gold square, the rest a dot; the unknown ones, dimmed.
    g.fillStyle(e.known ? (e.boss ? GOLD : TEAL) : DIM, 1).fillRect(lx, y + 2, e.boss ? 3 : 2, e.boss ? 3 : 2);
    const t = text(lx + 7, y, entryName(v.tab, e), on ? GOLD : e.known ? CREAM : DIM);
    t.setInteractive({ useHandCursor: true }).on('pointerover', () => i !== v.index && v.hover(i));
  });
  if (n > GLOSSARY.visible) {
    const track = GLOSSARY.visible * GLOSSARY.rowH;
    const thumb = Math.max(6, Math.round((track * GLOSSARY.visible) / n));
    const at = top - 2 + Math.round(((track - thumb) * first) / (n - GLOSSARY.visible));
    g.fillStyle(GOLD, 0.9).fillRect(x0 + GLOSSARY.listW + 9, at, 3, thumb);
  }

  // Right: the card of the one under the cursor (on «Volver», the last one looked at).
  const e = v.entries[Math.min(v.index, n - 1)];
  const rx = x0 + GLOSSARY.listW + 22;
  const rw = x0 + W - 10 - rx;
  if (e) {
    // The picture, on a dark well, centred and at a whole scale; unknown, a silhouette.
    const pw = GLOSSARY.picW + 10;
    const ph = GLOSSARY.picH + 6;
    g.fillStyle(0x0e0c16, 0.85).fillRect(rx, top - 2, pw, ph);
    g.lineStyle(1, 0x2c3048, 1).strokeRect(rx + 0.5, top - 1.5, pw - 1, ph - 1);
    const tex = scene.textures.exists(e.sprite) ? scene.textures.get(e.sprite) : null;
    if (tex) {
      const fr = tex.has(String(e.frame)) ? e.frame : 0;
      const img = scene.add.image(rx + pw / 2, top - 2 + ph / 2, e.sprite, fr).setOrigin(0.5, 0.5);
      img.setScale(pictureScale(img.width, img.height));
      if (!e.known) img.setTintFill(0x232838);
      objs.push(img);
    }
    // Beside the picture: name, kind and the count.
    const nx = rx + pw + 8;
    const nw = x0 + W - 10 - nx;
    let ny = top;
    text(nx, ny, entryName(v.tab, e), e.known ? GOLD : GREY).setMaxWidth(nw);
    ny += 12 * Math.max(1, Math.ceil(textWidth(entryName(v.tab, e)) / nw));
    if (v.tab === 'enemies') {
      const def = ENEMIES[e.id]!;
      if (e.boss && e.known && def.boss) {
        text(nx, ny, def.boss.title, TEAL).setMaxWidth(nw);
        ny += 12;
      }
      if (e.known) text(nx, ny + 4, glossaryCount(e.count, e.boss), e.count > 0 ? 0x7ef0a0 : 0xe0453b).setMaxWidth(nw);
    } else if (e.known) {
      // The weapon's numbers, as they come out of the box.
      const def = WEAPONS[e.id]!;
      for (const r of weaponStatRows(def, def)) {
        text(nx, ny, r.label, GREY);
        text(nx + 58, ny, r.now, 0xf4f1e8);
        ny += 10;
      }
    }
    // Under the picture: its line (or how to fill the card in).
    const desc = e.known
      ? (v.tab === 'weapons' ? WEAPONS[e.id]?.description : ENEMIES[e.id]?.description) ?? ''
      : v.tab === 'weapons'
        ? GLOSSARY_UNKNOWN_WEAPON
        : e.boss
          ? GLOSSARY_UNKNOWN_BOSS
          : GLOSSARY_UNKNOWN_ENEMY;
    text(rx, top + ph + 6, desc, e.known ? CREAM : GREY).setMaxWidth(rw);
  }

  // Back, and how to use it.
  const on = v.index === n;
  const b = text(cx, y0 + H - 26, (on ? '» ' : '') + PAUSE_MENU.back + (on ? ' «' : ''), on ? GOLD : CREAM, 0.5);
  b.setInteractive({ useHandCursor: true }).on('pointerdown', () => v.back());
  text(cx, y0 + H - 13, GLOSSARY_HINT, GREY, 0.5);
}

