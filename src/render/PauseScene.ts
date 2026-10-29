// The pause menu: drawn over the frozen game (GameScene is paused underneath). Continue,
// options (effects volume, full screen, camera shake), the controls and a new unit, with the
// keyboard, the mouse or a pad.
import { fontText } from '../art/font.ts';
import { Rng } from '../sim/rng.ts';
import {
  CONFIRM_MENU,
  CONFIRM_TEXT,
  CONFIRM_TITLE,
  CONTROLS_HEADERS,
  CONTROLS_ROWS,
  CONTROLS_TITLE,
  MENU_HINT,
  OPTION_LABELS,
  OPTIONS_TITLE,
  PAUSE_LINES,
  PAUSE_MENU,
  PAUSE_TITLE,
} from '../data/texts.ts';
import { Menu, type MenuResult } from './menu.ts';
import { saveSettings, settings } from './settings.ts';
import { FONT } from './textures.ts';
import type { GameScene } from './GameScene.ts';

const VIEW_W = 480;
const VIEW_H = 270;
const PANEL_W = 300;
const GOLD = 0xf6c431;
const CREAM = 0xd6cdb2;
const GREY = 0x858ea8;

type Screen = 'main' | 'options' | 'controls' | 'confirm';

export class PauseScene extends Phaser.Scene {
  private screen: Screen = 'main';
  private menu!: Menu;
  private objs: Phaser.GameObjects.GameObject[] = [];
  private lines: Phaser.GameObjects.BitmapText[] = [];
  private subtitle = '';
  private fx = new Rng('pausa');
  /** Pad buttons and stick direction held last frame (so a press counts once). */
  private padPrev: boolean[] = [];
  private padDirPrev = 0;

  constructor() {
    super('pause');
  }

  private get game_(): GameScene {
    return this.scene.get('game') as GameScene;
  }

  create(): void {
    this.screen = 'main';
    this.subtitle = this.fx.pick(PAUSE_LINES);
    this.padPrev = [];
    this.padDirPrev = 0;
    // The pad button that opened the menu is still down: it does not count.
    const pad = this.pad();
    if (pad) this.padPrev = pad.buttons.map((b) => b.pressed);
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x0e0c16, 0.72).setOrigin(0, 0);
    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => this.key(e.code));
    this.game_.sound2.play('cambiar', { detune: -300 });
    this.show('main');
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
    if (this.screen === 'main') this.resume();
    else this.show('main', this.screen === 'confirm' ? 3 : this.screen === 'controls' ? 2 : 1);
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
    snd.play('recargar');
    if (r.id === 'resume' || r.id === 'no') this.back();
    else if (r.id === 'back') this.back();
    else if (r.id === 'options') this.show('options');
    else if (r.id === 'controls') this.show('controls');
    else if (r.id === 'newUnit') this.show('confirm', 1);
    else if (r.id === 'yes') {
      // Off to the recycling point: a new run.
      this.scene.stop('game');
      this.scene.start('game');
    }
  }

  /** Builds a screen's menu and draws it; `index` is where the cursor starts. */
  private show(screen: Screen, index = 0): void {
    this.screen = screen;
    if (screen === 'main') {
      this.menu = new Menu([
        { kind: 'action', id: 'resume', label: PAUSE_MENU.resume },
        { kind: 'action', id: 'options', label: PAUSE_MENU.options },
        { kind: 'action', id: 'controls', label: PAUSE_MENU.controls },
        { kind: 'action', id: 'newUnit', label: PAUSE_MENU.newUnit },
      ]);
    } else if (screen === 'options') {
      const s = settings();
      this.menu = new Menu([
        { kind: 'range', id: 'volume', label: OPTION_LABELS.volume, min: 0, max: 10, value: s.volume },
        { kind: 'toggle', id: 'fullscreen', label: OPTION_LABELS.fullscreen, value: this.scale.isFullscreen },
        { kind: 'toggle', id: 'shake', label: OPTION_LABELS.shake, value: s.shake },
        { kind: 'action', id: 'back', label: PAUSE_MENU.back },
      ]);
    } else if (screen === 'controls') {
      this.menu = new Menu([{ kind: 'action', id: 'back', label: PAUSE_MENU.back }]);
    } else {
      this.menu = new Menu([
        { kind: 'action', id: 'no', label: CONFIRM_MENU.no },
        { kind: 'action', id: 'yes', label: CONFIRM_MENU.yes },
      ]);
    }
    this.menu.index = Math.min(index, this.menu.items.length - 1);
    this.paint();
  }

  /** Draws the current screen from scratch (it is small; nothing to keep between frames). */
  private paint(): void {
    for (const o of this.objs) o.destroy();
    this.objs = [];
    this.lines = [];
    const text = (x: number, y: number, s: string, tint: number, origin = 0.5): Phaser.GameObjects.BitmapText => {
      const t = this.add.bitmapText(x, y, FONT, fontText(s), 8).setOrigin(origin, 0).setTint(tint);
      this.objs.push(t);
      return t;
    };
    const cx = VIEW_W / 2;
    const title = this.screen === 'main' ? PAUSE_TITLE : this.screen === 'options' ? OPTIONS_TITLE : this.screen === 'controls' ? CONTROLS_TITLE : CONFIRM_TITLE;
    const sub = this.screen === 'main' ? this.subtitle : this.screen === 'confirm' ? CONFIRM_TEXT : '';
    const rows = this.screen === 'controls' ? CONTROLS_ROWS.length : 0;
    const h = 44 + (sub ? 12 : 0) + (rows ? (rows + 1) * 11 + 8 : 0) + this.menu.items.length * 13 + 18;
    const w = this.screen === 'controls' ? 340 : PANEL_W;
    const x0 = Math.round(cx - w / 2);
    const y0 = Math.round((VIEW_H - h) / 2) - 6;
    const g = this.add.graphics();
    this.objs.push(g);
    g.fillStyle(0x0e0c16, 1).fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    g.fillStyle(0x101420, 0.96).fillRect(x0, y0, w, h);
    g.lineStyle(1, GOLD, 0.9).strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);
    // A strip of hazard tape along the top, like the walls of the warehouse.
    for (let x = x0 + 1; x < x0 + w - 1; x++) g.fillStyle(Math.floor(x / 4) % 2 === 0 ? 0xb08a1c : 0x191622, 1).fillRect(x, y0 + 1, 1, 3);
    let y = y0 + 12;
    text(cx, y, title, GOLD);
    y += 14;
    if (sub) {
      text(cx, y, sub, GREY);
      y += 12;
    }
    y += 4;
    if (rows) {
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
    }
    this.menu.items.forEach((it, i) => {
      const on = i === this.menu.index;
      const t = text(cx, y, (on ? '» ' : '') + Menu.text(it) + (on ? ' «' : ''), on ? GOLD : CREAM);
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
      this.lines.push(t);
      y += 13;
    });
    // How to use it, along the bottom of the panel.
    text(cx, y0 + h - 14, MENU_HINT, GREY);
  }

  private pad(): Gamepad | null {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  update(): void {
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
    else if (hit(9)) this.resume();
    this.padPrev = now;
  }
}
