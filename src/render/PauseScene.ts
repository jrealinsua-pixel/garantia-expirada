// Menus: the pause menu, drawn over the frozen game (GameScene is paused underneath), and the
// title screen (TitleScene, the same machinery with its own first screen). Options (effects
// volume, full screen, camera shake), the controls, credits, a new unit and back to the title,
// with the keyboard, the mouse or a pad.
import { fontText, textWidth } from '../art/font.ts';
import { paintRoom } from '../art/room.ts';
import { ROOMS } from '../data/rooms.ts';
import { buildRoom } from '../sim/room.ts';
import { Rng } from '../sim/rng.ts';
import {
  CONFIRM_MENU,
  CONFIRM_TEXT,
  CONFIRM_TITLE,
  CONTROLS_HEADERS,
  CONTROLS_ROWS,
  CONTROLS_TITLE,
  CREDITS_LINES,
  INVENTORY_BEFORE,
  INVENTORY_EMPTY,
  INVENTORY_ITEMS,
  INVENTORY_MENU,
  INVENTORY_NO_SYNERGY,
  INVENTORY_SUB,
  INVENTORY_SYNERGIES,
  INVENTORY_TITLE,
  INVENTORY_WEAPON,
  inventoryBatteries,
  CREDITS_TITLE,
  MENU_HINT,
  OPTION_LABELS,
  OPTIONS_TITLE,
  PAUSE_LINES,
  PAUSE_MENU,
  PAUSE_QUIT,
  PAUSE_TITLE,
  QUIT_MENU,
  QUIT_TEXT,
  QUIT_TITLE,
  TITLE,
  TITLE_FOOTER,
  TITLE_MENU,
  TITLE_TAGLINE,
} from '../data/texts.ts';
import { activeLines, characterStatRows, modifierLines, weaponStatRows, type EffectLine, type StatRow } from '../data/describe.ts';
import { ACTIVE_ITEMS, FINDABLE_ACTIVES, FINDABLE_ITEMS, ITEMS } from '../data/items.ts';
import { FINDABLE_WEAPONS } from '../data/weapons.ts';
import { downCause, HISTORY_EMPTY, HISTORY_MENU, HISTORY_SUB, HISTORY_TITLE, historyLines } from '../data/texts.ts';
import { topCause } from '../sim/profile.ts';
import { profile } from './save.ts';
import { SYNERGIES } from '../data/synergies.ts';
import { Menu, type MenuItem, type MenuResult } from './menu.ts';
import { saveSettings, settings } from './settings.ts';
import { addCanvasTexture, FONT } from './textures.ts';
import type { GameScene } from './GameScene.ts';

declare const __VERSION__: string;

const VIEW_W = 480;
const VIEW_H = 270;
const PANEL_W = 300;
const GOLD = 0xf6c431;
const CREAM = 0xd6cdb2;
const GREY = 0x858ea8;

type Screen = 'main' | 'history' | 'inventory' | 'options' | 'controls' | 'credits' | 'confirmNew' | 'confirmQuit';

/** Where each first-screen action sits, so going back from a screen lands on what opened it. */
const PAUSE_ITEMS: MenuItem[] = [
  { kind: 'action', id: 'resume', label: PAUSE_MENU.resume },
  { kind: 'action', id: 'inventory', label: INVENTORY_MENU },
  { kind: 'action', id: 'options', label: PAUSE_MENU.options },
  { kind: 'action', id: 'controls', label: PAUSE_MENU.controls },
  { kind: 'action', id: 'newUnit', label: PAUSE_MENU.newUnit },
  { kind: 'action', id: 'quit', label: PAUSE_QUIT },
];
const TITLE_ITEMS: MenuItem[] = [
  { kind: 'action', id: 'start', label: TITLE_MENU.start },
  { kind: 'action', id: 'practice', label: TITLE_MENU.practice },
  { kind: 'action', id: 'options', label: TITLE_MENU.options },
  { kind: 'action', id: 'controls', label: TITLE_MENU.controls },
  { kind: 'action', id: 'history', label: HISTORY_MENU },
  { kind: 'action', id: 'credits', label: TITLE_MENU.credits },
];
/** The credits, with the engine (named here: data files may not mention it). */
const CREDITS: readonly string[] = [...CREDITS_LINES.slice(0, 2), 'Motor: Phaser 3 (licencia MIT)', ...CREDITS_LINES.slice(2)];
const OPENED_BY: Partial<Record<Screen, string>> = {
  history: 'history',
  inventory: 'inventory',
  options: 'options',
  controls: 'controls',
  credits: 'credits',
  confirmNew: 'newUnit',
  confirmQuit: 'quit',
};

export class PauseScene extends Phaser.Scene {
  protected readonly mode: 'pause' | 'title';
  private screen: Screen = 'main';
  private menu!: Menu;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private subtitle = '';
  private fx = new Rng('pausa');
  /** Pad buttons and stick direction held last frame (so a press counts once). */
  private padPrev: boolean[] = [];
  private padDirPrev = 0;
  /** Title screen: the toaster standing in front of the warehouse. */
  private hero: Phaser.GameObjects.Image | null = null;

  constructor(key = 'pause', mode: 'pause' | 'title' = 'pause') {
    super(key);
    this.mode = mode;
  }

  private get game_(): GameScene {
    return this.scene.get('game') as GameScene;
  }

  create(): void {
    this.screen = 'main';
    this.objs = [];
    this.hero = null;
    this.subtitle = this.fx.pick(PAUSE_LINES);
    this.padPrev = [];
    this.padDirPrev = 0;
    // The pad button that opened the menu is still down: it does not count.
    const pad = this.pad();
    if (pad) this.padPrev = pad.buttons.map((b) => b.pressed);
    const snd = this.game_.sound2;
    if (this.mode === 'title') {
      this.drawTitleBackground();
      // Browsers only let sound start after the first key or click.
      snd.setVolume(settings().volume / 10);
      snd.setMusicVolume(settings().music / 10);
      snd.playMusic('planta');
      const unlock = (): void => snd.unlock();
      this.input.on('pointerdown', unlock);
      this.input.keyboard?.on('keydown', unlock);
    } else {
      this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0e0c16, 0.72).setOrigin(0, 0);
      snd.play('cambiar', { detune: -300 });
      snd.duckMusic(true);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => snd.duckMusic(false));
    }
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e.code));
    this.show('main');
  }

  /** The entrance of the warehouse, dimmed, with the toaster in front and a vignette. */
  private drawTitleBackground(): void {
    const room = buildRoom(ROOMS.entrada!);
    if (!this.textures.exists('portada-sala')) addCanvasTexture(this, 'portada-sala', paintRoom(room, 'portada').canvas);
    this.add.image(VIEW_W / 2, VIEW_H / 2 + 20, 'portada-sala').setOrigin(0.5, 0.5);
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0e0c16, 0.6).setOrigin(0, 0);
    this.hero = this.add.image(74, VIEW_H - 30, 'tostadora', 0).setOrigin(0.5, 1).setScale(3);
    this.add.image(0, 0, 'vineta').setOrigin(0, 0);
  }

  private key(code: string): void {
    if (code === 'ArrowUp' || code === 'KeyW') this.move(-1);
    else if (code === 'ArrowDown' || code === 'KeyS') this.move(1);
    else if (code === 'ArrowLeft' || code === 'KeyA') this.apply(this.menu.adjust(-1));
    else if (code === 'ArrowRight' || code === 'KeyD') this.apply(this.menu.adjust(1));
    else if (code === 'Enter' || code === 'Space' || code === 'NumpadEnter') this.apply(this.menu.confirm());
    else if (code === 'Escape' || code === 'KeyP' || code === 'Backspace') this.back();
  }

  private move(d: number): void {
    this.menu.move(d);
    this.game_.sound2.play('cambiar', { volume: 0.6 });
    this.paint();
  }

  private back(): void {
    if (this.screen === 'main') {
      if (this.mode === 'pause') this.resume();
      return;
    }
    const items = this.mode === 'title' ? TITLE_ITEMS : PAUSE_ITEMS;
    this.show('main', Math.max(0, items.findIndex((it) => it.id === OPENED_BY[this.screen])));
  }

  private resume(): void {
    const g = this.game_;
    g.input.keyboard?.resetKeys();
    g.sound2.play('cambiar', { detune: 300 });
    this.scene.resume('game');
    this.scene.stop();
  }

  private apply(r: MenuResult): void {
    const snd = this.game_.sound2;
    if (r.type === 'changed') {
      if (r.id === 'volume') {
        saveSettings({ volume: r.value as number });
        snd.setVolume((r.value as number) / 10);
      } else if (r.id === 'music') {
        saveSettings({ music: r.value as number });
        snd.setMusicVolume((r.value as number) / 10);
      } else if (r.id === 'shake') saveSettings({ shake: r.value as boolean });
      else if (r.id === 'fullscreen') {
        try {
          if (r.value) this.scale.startFullscreen();
          else this.scale.stopFullscreen();
        } catch {
          // The browser may refuse (no gesture, an iframe): the line shows what really happened.
        }
        this.time.delayedCall(300, () => this.screen === 'options' && this.show('options', this.menu.index));
      }
      snd.play('cupon', { volume: 0.7 });
      this.paint();
      return;
    }
    if (r.type !== 'action') return;
    const id = r.id;
    // A line of the inventory: nothing to do but read it.
    if (id.includes(':')) return;
    snd.play('recargar');
    if (id === 'resume' || id === 'no' || id === 'back') this.back();
    else if (id === 'options' || id === 'controls' || id === 'credits' || id === 'inventory' || id === 'history') this.show(id);
    else if (id === 'newUnit') this.show('confirmNew');
    else if (id === 'quit') this.show('confirmQuit');
    else if (id === 'start' || id === 'practice') {
      snd.play('arma');
      this.scene.start('game', id === 'practice' ? { sala: 'sala-pruebas' } : {});
    } else if (id === 'yes' && this.screen === 'confirmNew') {
      // Off to the recycling point: a new run of the same kind.
      this.scene.stop('game');
      this.scene.start('game');
    } else if (id === 'yes') {
      this.scene.stop('game');
      this.scene.start('title');
    }
  }

  /** Builds a screen's menu and draws it; `index` is where the cursor starts. */
  private show(screen: Screen, index = 0): void {
    this.screen = screen;
    if (screen === 'main') this.menu = new Menu((this.mode === 'title' ? TITLE_ITEMS : PAUSE_ITEMS).map((it) => ({ ...it })));
    else if (screen === 'options') {
      const s = settings();
      this.menu = new Menu([
        { kind: 'range', id: 'volume', label: OPTION_LABELS.volume, min: 0, max: 10, value: s.volume },
        { kind: 'range', id: 'music', label: OPTION_LABELS.music, min: 0, max: 10, value: s.music },
        { kind: 'toggle', id: 'fullscreen', label: OPTION_LABELS.fullscreen, value: this.scale.isFullscreen },
        { kind: 'toggle', id: 'shake', label: OPTION_LABELS.shake, value: s.shake },
        { kind: 'action', id: 'back', label: PAUSE_MENU.back },
      ]);
    } else if (screen === 'inventory') {
      // One line per thing carried (passive items in the order found, the active one, the synergies on), then back.
      const p = this.game_.world.player;
      const lines: MenuItem[] = p.items.map((id) => ({ kind: 'action', id: `item:${id}`, label: ITEMS[id]?.name ?? id }));
      if (p.active) lines.push({ kind: 'action', id: `active:${p.active.id}`, label: ACTIVE_ITEMS[p.active.id]?.name ?? p.active.id });
      for (const id of p.synergies) lines.push({ kind: 'action', id: `syn:${id}`, label: SYNERGIES[id]?.name ?? id });
      lines.push({ kind: 'action', id: 'back', label: PAUSE_MENU.back });
      this.menu = new Menu(lines);
    } else if (screen === 'controls' || screen === 'credits' || screen === 'history') this.menu = new Menu([{ kind: 'action', id: 'back', label: PAUSE_MENU.back }]);
    else {
      const t = screen === 'confirmNew' ? CONFIRM_MENU : QUIT_MENU;
      this.menu = new Menu([
        { kind: 'action', id: 'no', label: t.no },
        { kind: 'action', id: 'yes', label: t.yes },
      ]);
    }
    this.menu.index = Math.min(index, this.menu.items.length - 1);
    this.paint();
  }

  /** Draws the current screen from scratch (it is small; nothing to keep between frames). */
  private paint(): void {
    for (const o of this.objs) o.destroy();
    this.objs = [];
    if (this.screen === 'inventory') {
      this.paintInventory();
      return;
    }
    const text = (x: number, y: number, s: string, tint: number, origin = 0.5): Phaser.GameObjects.BitmapText => {
      const t = this.add.bitmapText(x, y, FONT, fontText(s), 8).setOrigin(origin, 0).setTint(tint);
      this.objs.push(t);
      return t;
    };
    const cx = VIEW_W / 2;
    const titleMain = this.mode === 'title' && this.screen === 'main';
    const titles: Record<Screen, string> = {
      main: PAUSE_TITLE,
      history: HISTORY_TITLE,
      inventory: INVENTORY_TITLE,
      options: OPTIONS_TITLE,
      controls: CONTROLS_TITLE,
      credits: CREDITS_TITLE,
      confirmNew: CONFIRM_TITLE,
      confirmQuit: QUIT_TITLE,
    };
    const history = this.screen === 'history' ? this.historyRows() : [];
    const subs: Partial<Record<Screen, string>> = { history: HISTORY_SUB, main: this.subtitle, confirmNew: CONFIRM_TEXT, confirmQuit: QUIT_TEXT };
    const sub = titleMain ? '' : subs[this.screen] ?? '';
    const rows = this.screen === 'controls' ? CONTROLS_ROWS.length + 1 : this.screen === 'credits' ? CREDITS.length : history.length;
    let h = 44 + (sub ? 12 : 0) + (rows ? rows * 11 + 8 : 0) + this.menu.items.length * 13 + 18;
    let w = this.screen === 'controls' || this.screen === 'credits' || this.screen === 'history' ? 360 : PANEL_W;
    let y0 = Math.round((VIEW_H - h) / 2) - 6;
    if (titleMain) {
      // The logo up top, the menu in a narrower panel under it, to the right of the toaster.
      this.drawLogo(cx, 26);
      h = this.menu.items.length * 13 + 30;
      w = 200;
      y0 = 112;
    }
    const x0 = Math.round(cx - w / 2) + (titleMain ? 30 : 0);
    const mx = x0 + w / 2;
    const g = this.add.graphics();
    this.objs.push(g);
    g.fillStyle(0x0e0c16, 1).fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    g.fillStyle(0x101420, 0.96).fillRect(x0, y0, w, h);
    g.lineStyle(1, GOLD, 0.9).strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    // A strip of hazard tape along the top, like the walls of the warehouse.
    for (let x = x0 + 1; x < x0 + w - 1; x++) g.fillStyle(Math.floor(x / 4) % 2 === 0 ? 0xb08a1c : 0x191622, 1).fillRect(x, y0 + 1, 1, 3);
    let y = y0 + 12;
    if (!titleMain) {
      text(cx, y, titles[this.screen], GOLD);
      y += 14;
      if (sub) {
        text(cx, y, sub, GREY);
        y += 12;
      }
      y += 4;
    }
    if (this.screen === 'controls') {
      const c1 = x0 + 14;
      const c2 = x0 + 120;
      const c3 = x0 + 236;
      text(c2, y, CONTROLS_HEADERS[0], GREY, 0);
      text(c3, y, CONTROLS_HEADERS[1], GREY, 0);
      y += 11;
      for (const [a, k, p] of CONTROLS_ROWS) {
        text(c1, y, a, CREAM, 0);
        text(c2, y, k, 0xf4f1e8, 0);
        text(c3, y, p, 0x69dbd8, 0);
        y += 11;
      }
      y += 8;
    } else if (this.screen === 'history') {
      for (const r of history) {
        text(x0 + 14, y, r.label, CREAM, 0);
        text(x0 + 160, y, r.text, r.label ? 0xf4f1e8 : GREY, 0);
        y += 11;
      }
      y += 8;
    } else if (this.screen === 'credits') {
      CREDITS.forEach((l, i) => {
        text(cx, y, l, i === CREDITS.length - 1 ? GREY : CREAM);
        y += 11;
      });
      y += 8;
    }
    this.menu.items.forEach((it, i) => {
      const on = i === this.menu.index;
      const t = text(mx, y, (on ? '» ' : '') + Menu.text(it) + (on ? ' «' : ''), on ? GOLD : CREAM);
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => {
        if (this.menu.index !== i) {
          this.menu.index = i;
          this.paint();
        }
      });
      t.on('pointerdown', () => {
        this.menu.index = i;
        this.apply(this.menu.confirm());
      });
      y += 13;
    });
    // How to use it, along the bottom of the panel (on the title, under it).
    if (titleMain) {
      text(cx, VIEW_H - 24, MENU_HINT, GREY);
      text(6, VIEW_H - 11, TITLE_FOOTER, 0x5a627c, 0);
      const v = `v${__VERSION__}`;
      text(VIEW_W - 6 - textWidth(v), VIEW_H - 11, v, 0x5a627c, 0);
    } else text(cx, y0 + h - 14, MENU_HINT, GREY);
  }

  /**
   * The inventory: on the left, the weapon in hand and the character with what the items have
   * done to each number (green better, red worse, and what it was before), and the synergies on;
   * on the right, what is carried (icon and name) and, under it, the chosen one in full.
   */
  private paintInventory(): void {
    const p = this.game_.world.player;
    const text = (x: number, y: number, s: string, tint: number, origin = 0): Phaser.GameObjects.BitmapText => {
      const t = this.add.bitmapText(x, y, FONT, fontText(s), 8).setOrigin(origin, 0).setTint(tint);
      this.objs.push(t);
      return t;
    };
    const x0 = 10;
    const y0 = 8;
    const W = VIEW_W - 20;
    const H = VIEW_H - 16;
    const g = this.add.graphics();
    this.objs.push(g);
    g.fillStyle(0x0e0c16, 1).fillRect(x0 - 1, y0 - 1, W + 2, H + 2);
    g.fillStyle(0x101420, 0.97).fillRect(x0, y0, W, H);
    g.lineStyle(1, GOLD, 0.9).strokeRect(x0 + 0.5, y0 + 0.5, W - 1, H - 1);
    for (let x = x0 + 1; x < x0 + W - 1; x++) g.fillStyle(Math.floor(x / 4) % 2 === 0 ? 0xb08a1c : 0x191622, 1).fillRect(x, y0 + 1, 1, 3);
    text(VIEW_W / 2, y0 + 9, INVENTORY_TITLE, GOLD, 0.5);
    text(VIEW_W / 2, y0 + 20, INVENTORY_SUB, GREY, 0.5);
    // A divider between the two columns.
    const rx = x0 + 232;
    g.fillStyle(0x2c3048, 1).fillRect(rx - 8, y0 + 34, 1, H - 64);

    // Left: the numbers.
    const lx = x0 + 10;
    let y = y0 + 36;
    const rows = (list: StatRow[]): void => {
      for (const r of list) {
        text(lx, y, r.label, CREAM);
        text(lx + 92, y, r.now, r.delta > 0 ? 0x7ef0a0 : r.delta < 0 ? 0xe0453b : 0xf4f1e8);
        if (r.delta !== 0) text(lx + 150, y, `${INVENTORY_BEFORE} ${r.base}`, GREY);
        y += 10;
      }
    };
    text(lx, y, `${INVENTORY_WEAPON} · ${p.weapon.def.name}`, GOLD);
    y += 12;
    rows(weaponStatRows(p.weapon.base, p.weapon.def));
    y += 6;
    text(lx, y, p.def.name, GOLD);
    y += 12;
    rows(characterStatRows(p.base.def, p.def));
    y += 6;
    text(lx, y, INVENTORY_SYNERGIES, GOLD);
    y += 12;
    if (p.synergies.length === 0) text(lx, y, INVENTORY_NO_SYNERGY, GREY);
    else text(lx, y, p.synergies.map((id) => SYNERGIES[id]?.name ?? id).join(' · '), 0x69dbd8).setMaxWidth(212);

    // Right: what is carried, a window of 6 lines round the chosen one.
    let ry = y0 + 36;
    const things = this.menu.items.filter((it) => it.id !== 'back');
    text(rx, ry, `${INVENTORY_ITEMS} (${p.items.length})`, GOLD);
    ry += 13;
    if (things.length === 0) text(rx, ry + 2, INVENTORY_EMPTY, GREY);
    const VISIBLE = 6;
    const first = Math.max(0, Math.min(things.length - VISIBLE, this.menu.index - 2));
    things.slice(first, first + VISIBLE).forEach((it, k) => {
      const i = first + k;
      const on = i === this.menu.index;
      const [kind, id] = it.id.split(':') as [string, string];
      const sprite = kind === 'item' ? ITEMS[id]?.sprite : kind === 'active' ? ACTIVE_ITEMS[id]?.sprite : undefined;
      if (on) g.fillStyle(0x2c3048, 1).fillRect(rx - 3, ry - 1, W - (rx - x0) - 8, 17);
      if (sprite) this.objs.push(this.add.image(rx + 8, ry + 8, sprite).setOrigin(0.5, 0.5));
      const t = text(rx + 20, ry + 4, it.label + (kind === 'active' ? ' (Q)' : ''), on ? GOLD : kind === 'syn' ? 0x69dbd8 : CREAM);
      t.setInteractive({ useHandCursor: true }).on('pointerover', () => {
        if (this.menu.index !== i) {
          this.menu.index = i;
          this.paint();
        }
      });
      ry += 17;
    });
    if (first + VISIBLE < things.length) text(rx + 20, ry - 3, '...', GREY);

    // Under the list: the chosen one in full.
    const sel = this.menu.current;
    const dy = y0 + 36 + 13 + VISIBLE * 17 + 6;
    if (sel.id.includes(':')) {
      const [kind, id] = sel.id.split(':') as [string, string];
      let desc = '';
      let lines: EffectLine[] = [];
      if (kind === 'item' && ITEMS[id]) {
        desc = ITEMS[id].description;
        lines = modifierLines(ITEMS[id].mod);
      } else if (kind === 'active' && ACTIVE_ITEMS[id]) {
        const a = ACTIVE_ITEMS[id];
        desc = a.description;
        lines = [...activeLines(a), { text: inventoryBatteries(p.active?.charge ?? 0, a.charges), good: (p.active?.charge ?? 0) >= a.charges }];
      } else if (kind === 'syn' && SYNERGIES[id]) {
        desc = SYNERGIES[id].text;
        lines = modifierLines(SYNERGIES[id].mod);
      }
      g.fillStyle(0x0e0c16, 0.8).fillRect(rx - 3, dy - 3, W - (rx - x0) - 8, H - (dy - y0) - 24);
      const d = text(rx + 2, dy, desc, CREAM).setMaxWidth(W - (rx - x0) - 16);
      let ly = dy + Math.ceil(d.getTextBounds(true).global.height) + 4;
      for (const l of lines) {
        text(rx + 2, ly, l.text, l.good ? 0x7ef0a0 : 0xe0453b);
        ly += 10;
      }
    }

    // Back, and how to use it.
    const back = this.menu.items.length - 1;
    const on = this.menu.index === back;
    const b = text(VIEW_W / 2, y0 + H - 26, (on ? '» ' : '') + PAUSE_MENU.back + (on ? ' «' : ''), on ? GOLD : CREAM, 0.5);
    b.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.back());
    text(VIEW_W / 2, y0 + H - 13, MENU_HINT, GREY, 0.5);
  }

  /** «Garantía Expirada» three times the size of the font, with a red stamp-like shadow, and the tagline. */
  private drawLogo(cx: number, y: number): void {
    const shadow = this.add.bitmapText(cx + 3, y + 3, FONT, fontText(TITLE), 8).setOrigin(0.5, 0).setScale(4).setTint(0xa42f37);
    const logo = this.add.bitmapText(cx, y, FONT, fontText(TITLE), 8).setOrigin(0.5, 0).setScale(4).setTint(GOLD);
    const tag = this.add.bitmapText(cx, y + 46, FONT, fontText(TITLE_TAGLINE), 8).setOrigin(0.5, 0).setTint(CREAM);
    this.objs.push(shadow, logo, tag);
  }

  /** The record of past runs, as lines (or a single one when there is none yet). */
  private historyRows(): { label: string; text: string }[] {
    const p = profile();
    if (p.runs === 0) return [{ label: '', text: HISTORY_EMPTY }];
    const c = topCause(p);
    return historyLines({
      runs: p.runs,
      downs: p.downs,
      floorsCleared: p.floorsCleared,
      bestFloorSeconds: p.bestFloorSeconds,
      bossesBeaten: Object.values(p.bosses).reduce((a, b) => a + b, 0),
      kills: p.kills,
      coupons: p.coupons,
      longestRun: p.longestRun,
      found: p.found.items.filter((id) => FINDABLE_ITEMS.includes(id)).length + p.found.actives.filter((id) => FINDABLE_ACTIVES.includes(id)).length,
      findable: FINDABLE_ITEMS.length + FINDABLE_ACTIVES.length,
      weapons: p.found.weapons.filter((id) => FINDABLE_WEAPONS.includes(id)).length,
      findableWeapons: FINDABLE_WEAPONS.length,
      cause: c ? { text: downCause(c.by, c.how), times: c.times } : null,
    });
  }

  private pad(): Gamepad | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  update(time: number): void {
    // The toaster on the title screen bobs a little, as if it still had a spring in it.
    if (this.hero) this.hero.setY(VIEW_H - 30 - (Math.sin(time / 500) > 0.6 ? 3 : 0));
    // The pad: d-pad or left stick to choose, A to accept, B to go back, Start to continue.
    const pad = this.pad();
    if (!pad) return;
    const now = pad.buttons.map((b) => b.pressed);
    const hit = (i: number): boolean => !!now[i] && !this.padPrev[i];
    const ay = pad.axes[1] ?? 0;
    const ax = pad.axes[0] ?? 0;
    const dir = now[12] || ay < -0.6 ? -1 : now[13] || ay > 0.6 ? 1 : now[14] || ax < -0.6 ? -2 : now[15] || ax > 0.6 ? 2 : 0;
    if (dir !== this.padDirPrev && dir !== 0) {
      if (Math.abs(dir) === 1) this.move(dir);
      else this.apply(this.menu.adjust(Math.sign(dir)));
    }
    this.padDirPrev = dir;
    if (hit(0)) this.apply(this.menu.confirm());
    else if (hit(1)) this.back();
    else if (hit(9)) {
      if (this.mode === 'pause') this.resume();
      else this.apply(this.menu.confirm());
    }
    this.padPrev = now;
  }
}

/** The title screen: the menus of the pause scene with their own first screen. */
export class TitleScene extends PauseScene {
  constructor() {
    super('title', 'title');
  }
}
