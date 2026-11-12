// The true ending (M12 (5), src/data/final.ts): after the Trituradora falls, the toaster rides the
// belt into the workshop, is washed, gets a new heating element, is boxed as «Reacondicionado» and
// ends up on a shelf of floor 1 at the price of a new one. Then the credits roll, and back to the
// title. Firing skips the shots (to the credits) and then the credits (to the end); firing at the
// end goes back to the title.
import { fontText, textWidth, wrapLines } from '../art/font.ts';
import { paintRoom } from '../art/room.ts';
import {
  ENDING_BACK, ENDING_LAST_LINE, ENDING_SHOTS, ENDING_SKIP, ENDING_THANKS,
  endingCredits, endingFor, endingShotAt, endingWarranty, shotCaption, type CharacterEnding, type CreditLine, type EndingShotId,
} from '../data/final.ts';
import { buildRoom } from '../sim/room.ts';
import { CHARACTERS } from '../data/characters.ts';
import type { GameScene } from './GameScene.ts';
import { readScale, settings } from './settings.ts';
import { addCanvasTexture, FONT } from './textures.ts';

const W = 480;
const H = 270;
/** The caption band at the bottom. */
const BAND = 38;
/** Firing does nothing for this long after a shot (or the credits) starts: a held button does not skip it all. */
const ARM = 0.6;
/** Credits scroll speed (px/s). */
const ROLL = 24;

/** Box sheet geometry (tools/sprites/final.ts BOX_W/BOX_H, BOX_SLOT; SHELF_SLOT, SHELF_W/H). */
const BOX = 60;
const SLOT = { x: 14, y: 12 };
const SHELF = { w: 236, h: 132, slotX: 118, slotY: 108 };
/** The product's sprite (40x41) and frames of the toaster's sheet. */
const HERO = { w: 40, h: 41, idle: 0, hurt: 6 };

type Obj = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible;

export interface FinalData {
  /** The product that was boxed (its sprite sheet is its id). */
  character?: string;
  /** Times the true ending had been seen before this one (the warranty gets shorter each time). */
  times?: number;
}

export class FinalScene extends Phaser.Scene {
  /** The product's sprite sheet. */
  private character = 'tostadora';
  /** Its own ending: the repair, the label on the box, the shelf and the price (M13 (7b)). */
  private end: CharacterEnding = endingFor('tostadora');
  private times = 0;
  private t = 0;
  private shot = -1;
  private shotT = 0;
  /** What the current shot put on screen (destroyed when it ends). */
  private objs: Obj[] = [];
  /** Per-shot moving parts. */
  private parts: Record<string, Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite | Phaser.GameObjects.BitmapText | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container> = {};
  private drops: { o: Phaser.GameObjects.Rectangle; vy: number; floor: number }[] = [];
  private cues = new Set<string>();
  private credits: Phaser.GameObjects.BitmapText[] = [];
  private rollY = 0;
  private rollEnd = 0;
  /** 'shots', then 'credits', then 'end' (the thanks, waiting for a button). */
  private phase: 'shots' | 'credits' | 'end' = 'shots';
  private armed = 0;
  private leaving = false;
  private padPrev = false;

  constructor() {
    super('final');
  }

  init(data: FinalData): void {
    // (The sheet is not always the id: the Plancha's is «plancha-vapor».)
    const sheet = data.character ? CHARACTERS[data.character]?.look.sheet : undefined;
    const known = !!sheet && this.textures.exists(sheet);
    this.character = known ? sheet : 'tostadora';
    this.end = endingFor(known ? data.character! : 'tostadora');
    this.times = Math.max(0, Math.floor(data.times ?? 0));
  }

  private get snd(): GameScene['sound2'] {
    return (this.scene.get('game') as GameScene).sound2;
  }

  /** For the tests: where the ending is. */
  state(): { phase: string; shot: EndingShotId | null; t: number } {
    return { phase: this.phase, shot: this.shot >= 0 && this.phase === 'shots' ? ENDING_SHOTS[this.shot]!.id : null, t: this.t };
  }

  create(): void {
    this.t = 0;
    this.shot = -1;
    this.phase = 'shots';
    this.objs = [];
    this.credits = [];
    this.leaving = false;
    this.armed = 0;
    this.cameras.main.setBackgroundColor('#0e0c16');
    this.backdrop('final-taller', 6);
    this.backdrop('final-planta1', 1);
    this.snd.playMusic(null, 0.5);
    this.cameras.main.fadeIn(600, 14, 12, 22);
    this.input.on('pointerdown', () => this.skip());
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'NumpadEnter', 'Escape', 'KeyF', 'KeyE'].includes(e.code)) this.skip();
    });
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    this.padPrev = [...pads].some((p) => p?.buttons[0]?.pressed);
    (window as unknown as { __GE_FINAL__: FinalScene }).__GE_FINAL__ = this;
  }

  /** A plain room of that floor, painted once and kept: the set behind the shots. */
  private backdrop(key: string, level: number): void {
    if (this.textures.exists(key)) return;
    const rows = ['#'.repeat(20), '#'.repeat(20), ...Array.from({ length: 9 }, () => `#${'.'.repeat(18)}#`), '#'.repeat(20)];
    const room = buildRoom({ id: key, name: '', kind: 'combat', rows });
    addCanvasTexture(this, key, paintRoom({ ...room, level }, key).canvas);
  }

  private add_<T extends Obj>(o: T): T {
    this.objs.push(o);
    return o;
  }

  private clearShot(): void {
    for (const o of this.objs) o.destroy();
    this.objs = [];
    this.parts = {};
    this.drops = [];
    this.cues.clear();
  }

  /** Once per shot: true the first time `t` passes `at` (for sounds and one-off effects). */
  private cue(id: string, at: number): boolean {
    if (this.shotT < at || this.cues.has(id)) return false;
    this.cues.add(id);
    return true;
  }

  private text(x: number, y: number, s: string, size: number, tint: number, origin = 0.5): Phaser.GameObjects.BitmapText {
    return this.add_(this.add.bitmapText(x, y, FONT, fontText(s), size).setOrigin(origin, 0).setTint(tint));
  }

  /** The caption band: the step of the work order (grey) and what happens (white). */
  private caption(step: string, caption: string): void {
    const scale = readScale(settings());
    const lines = wrapLines(fontText(caption), W - 24, scale);
    const h = Math.max(BAND, 12 + (lines.length + 1) * 9 * scale);
    this.add_(this.add.rectangle(0, H - h, W, h, 0x0e0c16, 0.9).setOrigin(0, 0).setDepth(9000));
    this.add_(this.add.rectangle(0, H - h, W, 1, 0x58b45a, 1).setOrigin(0, 0).setDepth(9000));
    this.text(12, H - h + 5, step, 8 * scale, 0x58b45a, 0).setDepth(9001);
    this.text(12, H - h + 5 + 10 * scale, lines.join('\n'), 8 * scale, 0xf4f1e8, 0).setDepth(9001);
    this.text(W - 12, H - h + 5, ENDING_SKIP, 8, 0x5a627c, 1).setDepth(9001);
  }

  private set(key: string, dim: number): void {
    this.add_(this.add.image(W / 2, H / 2 - 8, key).setDepth(-10));
    this.add_(this.add.rectangle(0, 0, W, H, 0x0e0c16, dim).setOrigin(0, 0).setDepth(-9));
  }

  private hero(x: number, y: number, scale: number, frame: number): Phaser.GameObjects.Image {
    return this.add_(this.add.image(x, y, this.character, frame).setOrigin(0.5, 1).setScale(scale));
  }

  private startShot(i: number): void {
    this.clearShot();
    this.shot = i;
    this.armed = ARM;
    const s = ENDING_SHOTS[i]!;
    this.caption(s.step, shotCaption(s, this.idOf()));
    if (s.id === 'cinta') {
      this.set('final-taller', 0.45);
      this.parts.belt = this.add_(this.add.tileSprite(0, 150, W / 2, 24, 'cinta-despiece').setOrigin(0, 0).setScale(2));
      this.parts.rollers = this.add_(this.add.image(W - 16, 150, 'rodillos-despiece', 0).setOrigin(0.5, 0).setScale(2).setDepth(5));
      this.parts.hero = this.hero(-40, 182, 2, HERO.hurt);
      this.snd.play('cinta');
    } else if (s.id === 'limpieza') {
      this.set('final-taller', 0.6);
      this.parts.hero = this.hero(W / 2, 200, 3, HERO.hurt).setTint(0x9a8c78);
      this.parts.bar = this.add_(this.add.image(W / 2, 40, 'final-ducha').setScale(2).setDepth(5));
      this.snd.play('soplar');
    } else if (s.id === 'resistencia') {
      this.set('final-taller', 0.6);
      this.parts.hero = this.hero(W / 2, 200, 3, HERO.idle).setDepth(2);
      // Behind the toaster: the element goes down into its slot, out of sight.
      this.parts.glove = this.add_(this.add.image(W + 80, -60, 'final-guante', 0).setOrigin(6 / 34, 1).setScale(3).setDepth(1));
    } else if (s.id === 'caja') {
      this.set('final-taller', 0.6);
      const bx = W / 2;
      const by = 216;
      this.parts.back = this.add_(this.add.image(bx, by, 'final-caja', 0).setOrigin(0.5, 1).setScale(3).setDepth(1));
      const top = by - BOX * 3;
      const left = bx - (BOX * 3) / 2;
      this.parts.hero = this.add_(this.add.image(left + SLOT.x * 3, top + SLOT.y * 3 - 160, this.character, HERO.idle).setOrigin(0, 0).setScale(3).setDepth(2));
      this.parts.front = this.add_(this.add.image(bx, by, 'final-caja', 1).setOrigin(0.5, 1).setScale(3).setDepth(3));
      this.parts.sticker = this.add_(this.add.image(left + 46 * 3, top + 48 * 3, 'final-pegatina').setScale(3).setRotation(-0.12).setDepth(4).setVisible(false));
      if (this.end.label) this.parts.label = this.boxLabel(left, top, 3, 3.5).setVisible(false);
      const wt = endingWarranty(this.times);
      this.parts.warranty = this.text(Math.min(396, W - 10 - textWidth(wt)), 92, wt, 16, 0xe0453b).setRotation(-0.16).setDepth(4).setVisible(false);
    } else {
      this.wideShelf();
    }
  }

  /** The shelf of floor 1, at game size: the box in the gap, the price tag, the header card. */
  private wideShelf(): void {
    this.set('final-planta1', 0.25);
    const sx = W / 2 - SHELF.w / 2;
    const sy = 12;
    this.add_(this.add.image(sx, sy, 'final-estanteria').setOrigin(0, 0).setDepth(1));
    if (textWidth(this.end.shelfCard) <= 84) this.text(sx + 118, sy + 2, this.end.shelfCard, 8, 0xf4f1e8).setDepth(2);
    this.boxOnShelf(sx + SHELF.slotX, sy + SHELF.slotY, 1, 3);
    this.priceTag(sx + SHELF.slotX + 36, sy + SHELF.slotY + 7, 1);
    this.parts.wide = this.add_(this.add.rectangle(0, 0, 1, 1, 0, 0));
  }

  /** The closed box with the product in it and the sticker, standing at (x, y) (its bottom centre). */
  private boxOnShelf(x: number, y: number, scale: number, depth: number): void {
    const top = y - BOX * scale;
    const left = x - (BOX * scale) / 2;
    this.add_(this.add.image(x, y, 'final-caja', 3).setOrigin(0.5, 1).setScale(scale).setDepth(depth));
    this.add_(this.add.image(left + SLOT.x * scale, top + SLOT.y * scale, this.character, HERO.idle).setOrigin(0, 0).setScale(scale).setDepth(depth + 0.1));
    this.add_(this.add.image(x, y, 'final-caja', 2).setOrigin(0.5, 1).setScale(scale).setDepth(depth + 0.2));
    this.add_(this.add.image(left + 46 * scale, top + 48 * scale, 'final-pegatina').setScale(scale).setRotation(-0.12).setDepth(depth + 0.3));
    // Up close, each one's label can be read (at game size it would be a smudge).
    if (this.end.label && scale >= 2) this.boxLabel(left, top, scale, depth + 0.25);
  }

  /**
   * The label on the box (M13 (7b)): «Recetario de regalo», «Pack Vuelta al Cole»… Under
   * the sticker, low on the left of the front. Returns its container.
   */
  private boxLabel(left: number, top: number, scale: number, depth: number): Phaser.GameObjects.Container {
    const text = fontText(this.end.label);
    const tw = textWidth(this.end.label);
    const x = left + 5 * scale;
    const y = top + 49 * scale;
    // (Straight: tilted, the small letters break up.)
    const c = this.add_(this.add.container(x, y).setDepth(depth));
    // Dark with yellow print: the font's letters carry a dark outline, so dark print on yellow blurs.
    c.add(this.add.rectangle(0, 0, tw + 8, 13, 0x2a2e44, 1).setOrigin(0, 0.5).setStrokeStyle(1, 0xf6c431));
    c.add(this.add.bitmapText(4, -5, FONT, text, 8).setTint(0xf6c431));
    return c;
  }

  /** The character id of the product (for the texts; the sheet may be named otherwise). */
  private idOf(): string {
    return Object.values(CHARACTERS).find((c) => c.look.sheet === this.character)?.id ?? 'tostadora';
  }

  /** The price tag (Rojo Oferta, as every offer in the store): the price of a new one. */
  private priceTag(x: number, y: number, scale: number): void {
    const big = 8 * scale;
    const { price, priceNote } = this.end;
    const w = Math.max(textWidth(price), textWidth(priceNote)) * scale + 8 * scale;
    const h = 22 * scale;
    this.add_(this.add.rectangle(x, y, w, h, 0xe0453b, 1).setOrigin(0, 0).setStrokeStyle(scale, 0x0e0c16).setDepth(6));
    this.add_(this.add.rectangle(x, y, w, scale, 0xff8a70, 1).setOrigin(0, 0).setDepth(6));
    this.text(x + w / 2, y + 2 * scale, price, big, 0xf4f1e8).setDepth(7);
    this.text(x + w / 2, y + 12 * scale, priceNote, 8 * Math.max(1, scale - 1), 0xfff1a8).setDepth(7);
  }

  private closeUp(): void {
    // The same shelf, close up: the box at three times the size, the tag and the last line.
    for (const o of this.objs) o.destroy();
    this.objs = [];
    const s = ENDING_SHOTS[this.shot]!;
    this.caption(s.step, shotCaption(s, this.idOf()));
    this.add_(this.add.rectangle(0, 0, W, H, 0x2a2e44, 1).setOrigin(0, 0).setDepth(-10));
    const k = 3;
    const slotX = W / 2;
    const slotY = 214;
    this.add_(this.add.image(slotX - SHELF.slotX * k, slotY - SHELF.slotY * k, 'final-estanteria').setOrigin(0, 0).setScale(k).setDepth(1));
    this.boxOnShelf(slotX, slotY, k, 3);
    // The tag hangs from the beam above on a string, beside the box.
    const tx = slotX + 100;
    this.add_(this.add.rectangle(tx + 30, slotY - 168, 1, 30, 0xd6cdb2, 1).setOrigin(0, 0).setDepth(5));
    this.priceTag(tx, slotY - 140, 2);
    this.parts.closeUp = this.add_(this.add.rectangle(0, 0, 1, 1, 0, 0));
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.05, deltaMs / 1000);
    this.armed = Math.max(0, this.armed - dt);
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].some((p) => p?.buttons[0]?.pressed);
    if (pad && !this.padPrev) this.skip();
    this.padPrev = pad;
    if (this.leaving) return;
    if (this.phase === 'shots') {
      this.t += dt;
      const at = endingShotAt(this.t);
      if (!at) {
        this.startCredits();
        return;
      }
      if (at.index !== this.shot) this.startShot(at.index);
      this.shotT = at.t;
      this.play(at.shot.id, at.t, at.shot.seconds, dt);
    } else if (this.phase === 'credits') {
      this.rollY -= ROLL * dt;
      this.placeCredits();
      if (this.rollY <= this.rollEnd) this.endCredits();
    }
  }

  private play(id: EndingShotId, t: number, len: number, dt: number): void {
    const P = this.parts;
    const hero = P.hero as Phaser.GameObjects.Image | undefined;
    if (id === 'cinta' && hero) {
      (P.belt as Phaser.GameObjects.TileSprite).tilePositionX -= 40 * dt;
      (P.rollers as Phaser.GameObjects.Image).setFrame(Math.floor(t * 8) % 2);
      const x = Math.min(W - 64, -40 + t * 92);
      hero.setPosition(Math.round(x), 182 + (Math.floor(t * 6) % 2));
      if (this.cue('ruido', 1.6)) this.snd.play('cinta', { detune: -200 });
      if (x >= W - 64 && this.cue('rodillos', 0)) {
        this.snd.play('triturar');
        this.snd.play('desmontar', { detune: -300 });
        this.cameras.main.shake(260, 0.012);
        this.cameras.main.flash(160, 244, 241, 232);
        hero.setVisible(false);
      }
      if (this.cue('fundido', len - 0.5)) this.cameras.main.fadeOut(450, 14, 12, 22);
      if (this.cue('vuelve', 0.05)) this.cameras.main.fadeIn(300, 14, 12, 22);
    } else if (id === 'limpieza' && hero) {
      if (this.cue('vuelve', 0)) this.cameras.main.fadeIn(300, 14, 12, 22);
      // Water from the five nozzles while it lasts; bubbles on the toaster in the middle of it.
      if (t < 3.4) {
        for (let n = 0; n < 5; n++) {
          if (Math.random() < 0.55) {
            // Under the nozzles of the bar (tools/sprites/final.ts: at 12 + 16n, drawn at twice the size).
            const x = W / 2 - 96 + 24 + n * 32 + 1 + Math.round((Math.random() - 0.5) * 4);
            const o = this.add_(this.add.rectangle(x, 50, 2, 5, Math.random() < 0.3 ? 0xf4f1e8 : 0x69dbd8, 0.9).setDepth(4));
            this.drops.push({ o, vy: 220 + Math.random() * 60, floor: 196 + Math.random() * 10 });
          }
        }
      }
      for (const d of this.drops) {
        if (!d.o.active) continue;
        d.o.y += d.vy * dt;
        if (d.o.y >= d.floor) {
          d.o.setSize(4, 2).setAlpha(0.6);
          d.vy = 0;
          d.o.y = d.floor;
          this.tweens.add({ targets: d.o, alpha: 0, duration: 200, onComplete: () => d.o.destroy() });
        }
      }
      this.drops = this.drops.filter((d) => d.o.active && d.vy > 0);
      if (t > 1.2 && t < 3.2 && Math.random() < 0.3) {
        const b = this.add_(this.add.circle(W / 2 + (Math.random() - 0.5) * 110, 200 - Math.random() * 110, 2 + Math.random() * 3, 0xf4f1e8, 0.5).setDepth(3));
        this.tweens.add({ targets: b, y: b.y - 20, alpha: 0, duration: 900, onComplete: () => b.destroy() });
      }
      if (this.cue('agua', 0.6)) this.snd.play('vapor', { detune: -400 });
      if (this.cue('agua2', 1.8)) this.snd.play('vapor', { detune: -600 });
      if (this.cue('limpia', 3.6)) {
        hero.clearTint().setFrame(HERO.idle);
        this.snd.play('clinc');
        this.time.delayedCall(120, () => this.snd.play('clinc', { detune: 400 }));
        for (const [dx, dy] of [[-40, -96], [34, -70], [-10, -40]] as const) this.sparkle(W / 2 + dx, 200 + dy);
      }
    } else if (id === 'resistencia' && hero) {
      const g = P.glove as Phaser.GameObjects.Image;
      const slotX = W / 2 + 4;
      const slotY = 200 - HERO.h * 3 + 18;
      const lerp = (a: number, b: number, k: number): number => a + (b - a) * Math.max(0, Math.min(1, k));
      const ease = (k: number): number => 1 - (1 - Math.max(0, Math.min(1, k))) ** 2;
      let gx = slotX;
      let gy = slotY + 40;
      if (t < 0.7) {
        gx = lerp(W + 80, slotX, ease(t / 0.7));
        gy = lerp(-60, slotY + 40, ease(t / 0.7));
      } else if (t < 1.0) {
        gx = slotX + Math.sin(t * 60) * 2;
      } else if (t < 1.9) {
        gy = lerp(slotY + 40, slotY - 6, ease((t - 1.0) / 0.9));
      } else if (t < 2.5) {
        gx = lerp(slotX, W + 90, ease((t - 1.9) / 0.6));
        gy = lerp(slotY - 6, -40, ease((t - 1.9) / 0.6));
      } else if (t < 3.2) {
        g.setFrame(1);
        gx = lerp(W + 90, slotX, ease((t - 2.5) / 0.7));
        gy = lerp(-40, slotY - 6, ease((t - 2.5) / 0.7));
      } else if (t < 4.0) {
        gy = lerp(slotY - 6, slotY + 40, ease((t - 3.2) / 0.8));
      } else {
        gx = lerp(slotX, W + 90, ease((t - 4.3) / 0.7));
        gy = lerp(slotY + 40, -60, ease((t - 4.3) / 0.7));
      }
      g.setPosition(Math.round(gx), Math.round(gy));
      if (this.cue('agarra', 0.75)) this.snd.play('desmontar', { detune: 400, volume: 0.6 });
      if (this.cue('humo', 1.4)) for (let i = 0; i < 6; i++) this.puff(slotX + (Math.random() - 0.5) * 20, slotY - 10);
      if (this.cue('mete', 3.9)) {
        this.snd.play('clinc', { detune: -300 });
        this.snd.play('recargado');
      }
      if (this.cue('bote', 4.05)) this.tweens.add({ targets: hero, y: hero.y - 6, yoyo: true, duration: 90 });
      if (this.cue('ding', 4.4)) this.snd.play('cupon');
    } else if (id === 'caja' && hero) {
      const top = 216 - BOX * 3;
      const restY = top + SLOT.y * 3;
      hero.y = Math.round(restY - 160 * (1 - Math.min(1, (t / 1.1) ** 2)));
      if (this.cue('dentro', 1.1)) {
        this.snd.play('carton', { volume: 0.6 });
        this.cameras.main.shake(120, 0.006);
      }
      if (this.cue('cierra', 1.9)) {
        (P.front as Phaser.GameObjects.Image).setFrame(2);
        (P.back as Phaser.GameObjects.Image).setFrame(3);
        this.snd.play('carton');
        this.time.delayedCall(180, () => this.snd.play('cinta', { detune: 600, volume: 0.6 }));
        for (let i = 0; i < 8; i++) this.puff(W / 2 + (Math.random() - 0.5) * 150, top + 20);
      }
      if (this.cue('pegatina', 2.8)) {
        const s = (P.sticker as Phaser.GameObjects.Image).setVisible(true).setScale(5);
        this.tweens.add({ targets: s, scale: 3, duration: 120, ease: 'Quad.easeIn' });
        this.time.delayedCall(120, () => {
          this.snd.play('pegatina');
          this.cameras.main.shake(90, 0.005);
        });
      }
      if (P.label && this.cue('etiqueta', 3.25)) {
        const l = P.label.setVisible(true).setScale(1.8);
        this.tweens.add({ targets: l, scale: 1, duration: 110, ease: 'Quad.easeIn' });
        this.time.delayedCall(110, () => this.snd.play('pegatina', { detune: 300 }));
      }
      if (this.cue('garantia', 3.7)) {
        const w = (P.warranty as Phaser.GameObjects.BitmapText).setVisible(true).setScale(1.6).setAlpha(0);
        this.tweens.add({ targets: w, scale: 1, alpha: 1, duration: 110, ease: 'Quad.easeIn' });
        this.time.delayedCall(110, () => this.snd.play('estampar'));
      }
    } else if (id === 'estanteria') {
      if (this.cue('tienda', 0)) this.snd.play('reponer');
      if (this.cue('cerca', 3.2)) {
        this.closeUp();
        this.snd.play('rebajado');
      }
      if (this.cue('frase', 5.0)) {
        const band = this.add_(this.add.rectangle(0, 24, W, 30, 0x0e0c16, 0.88).setOrigin(0, 0).setDepth(8000).setAlpha(0));
        const line = this.text(W / 2, 31, ENDING_LAST_LINE, 16, 0xf4f1e8).setDepth(8001).setAlpha(0);
        this.tweens.add({ targets: [band, line], alpha: 1, duration: 500 });
        this.snd.play('jefe', { detune: -900, volume: 0.5 });
      }
      if (this.cue('fundido', len - 0.8)) this.cameras.main.fadeOut(700, 14, 12, 22);
    }
  }

  private sparkle(x: number, y: number): void {
    for (const [dx, dy, w, h] of [[0, 0, 1, 9], [-4, 4, 9, 1]] as const) {
      const r = this.add_(this.add.rectangle(x + dx, y + dy - 4, w, h, 0xf4f1e8, 1).setOrigin(0, 0).setDepth(6));
      this.tweens.add({ targets: r, alpha: 0, duration: 700, delay: 200 });
    }
  }

  private puff(x: number, y: number): void {
    const c = this.add_(this.add.circle(x, y, 3 + Math.random() * 4, 0x858ea8, 0.7).setDepth(6));
    this.tweens.add({ targets: c, y: y - 14 - Math.random() * 14, x: x + (Math.random() - 0.5) * 20, alpha: 0, scale: 1.8, duration: 700, onComplete: () => c.destroy() });
  }

  private startCredits(): void {
    this.clearShot();
    this.phase = 'credits';
    this.armed = ARM;
    this.cameras.main.resetFX();
    this.cameras.main.fadeIn(500, 14, 12, 22);
    this.snd.playMusic('planta', 1.5);
    const lines: CreditLine[] = endingCredits('Phaser 3 (licencia MIT)');
    let y = 0;
    for (const l of lines) {
      if (l.kind === 'gap') {
        y += 12;
        continue;
      }
      const size = l.kind === 'title' ? 16 : 8;
      const tint = l.kind === 'title' ? 0xf6c431 : l.kind === 'heading' ? 0x858ea8 : l.kind === 'note' ? 0x58b45a : 0xf4f1e8;
      const o = this.add.bitmapText(W / 2 + 60, y, FONT, fontText(l.text), size).setOrigin(0.5, 0).setTint(tint);
      o.setData('y', y);
      this.credits.push(o);
      y += size + 4;
    }
    this.rollY = H;
    this.rollEnd = H / 2 - 20 - y;
    // The box, closed, on its own at the side while the names go up.
    this.boxOnShelf(84, 214, 2, 3);
    this.add_(this.add.rectangle(84 - 72, 214, 144, 4, 0xe07a2a, 1).setOrigin(0, 0).setDepth(2));
    this.placeCredits();
  }

  private placeCredits(): void {
    for (const o of this.credits) {
      const y = this.rollY + (o.getData('y') as number);
      o.setY(Math.round(y));
      o.setVisible(y > -20 && y < H);
    }
  }

  private endCredits(): void {
    for (const o of this.credits) o.destroy();
    this.credits = [];
    this.phase = 'end';
    this.armed = ARM;
    this.text(W / 2 + 60, H / 2 - 16, ENDING_THANKS, 16, 0xf4f1e8);
    this.text(W / 2 + 60, H / 2 + 8, ENDING_BACK, 8, 0x5a627c);
    this.snd.play('cupon');
  }

  /** Fire: past the shots, past the credits, then out. */
  private skip(): void {
    if (this.leaving || this.armed > 0) return;
    this.snd.unlock();
    if (this.phase === 'shots') {
      this.cameras.main.resetFX();
      this.startCredits();
    } else if (this.phase === 'credits') this.endCredits();
    else {
      this.leaving = true;
      this.snd.playMusic(null, 0.5);
      this.cameras.main.fadeOut(400, 14, 12, 22);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('title'));
    }
  }
}
