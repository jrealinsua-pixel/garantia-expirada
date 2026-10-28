// Draws the simulation and plays its events. Phaser only draws and reads input: all the rules
// live in src/sim/.
import { paintRoom } from '../art/room.ts';
import { fontText } from '../art/font.ts';
import { DEATH_STAMPS, DOWN_HINT, DOWN_TITLE, RESTOCK_LINE } from '../data/texts.ts';
import { activeWarnings, createWorld, PICKUP_DELAY, DT, enemyAltitude, gunPivot, isRolling, sourceTelegraph, step, BODY_HEIGHT, type Enemy, type SimEvent, type World } from '../sim/world.ts';
import { Rng } from '../sim/rng.ts';
import { Sound } from './audio.ts';
import { Controls } from './input.ts';
import { addCanvasTexture, FONT, shadowTexture } from './textures.ts';

export const VIEW_W = 480;
export const VIEW_H = 270;

const HERO_FEET_X = 17.5;
const HERO_FEET_Y = 36;
const HERO_W = 40;
const HERO_H = 41;
/** Grip of the hair dryer in its 18x11 sprite. */
const GUN_GRIP = { x: 6.5, y: 8.5 };

interface Particle {
  s: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  /** Height above its floor line, for things that bounce (casings). */
  z: number;
  vz: number;
  life: number;
  maxLife: number;
  gravity: boolean;
  spin: number;
  fade: boolean;
  anim?: { key: string; frames: number; fps: number };
  /** Half size of the image, for bouncing particles (their origin moves up with the height). */
  hw?: number;
  hh?: number;
  /** Seconds it fades out over at the end (default 0.4). */
  fadeTime?: number;
}

/** A piece of an enemy's sprite (frame `name` of the texture `key`), `dx, dy` px from its feet. */
interface SpritePiece {
  name: string;
  dx: number;
  dy: number;
  w: number;
  h: number;
}

interface FloatText {
  t: Phaser.GameObjects.BitmapText;
  vy: number;
  life: number;
}

export interface GameStateForTests {
  ready: boolean;
  tick: number;
  x: number;
  y: number;
  ammo: number;
  hp: number;
  bullets: number;
  rolling: boolean;
  dummyDamage: number;
  /** Attack warnings seen so far, and charges of the vacuum. */
  warnings: number;
  charges: number;
  enemyDamage: number;
  fps: number;
  shots: number;
  kills: number;
  coupons: number;
  pickups: number;
  over: boolean;
}

export class GameScene extends Phaser.Scene {
  world!: World;
  controls!: Controls;
  sound2 = new Sound();
  private fx = new Rng('fx');
  private acc = 0;
  private hitstop = 0;
  private shots = 0;

  private hero!: Phaser.GameObjects.Sprite;
  private heroShadow!: Phaser.GameObjects.Image;
  private gun!: Phaser.GameObjects.Image;
  private hand!: Phaser.GameObjects.Image;
  private gunKick = 0;
  private flashHero = 0;
  private muzzle!: Phaser.GameObjects.Image;
  private muzzleT = 0;
  private crosshair!: Phaser.GameObjects.Image;
  private dummySprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, EnemyView>();
  private bulletSprites = new Map<number, Phaser.GameObjects.Image>();
  private pickupSprites = new Map<number, { s: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image }>();
  /** Pieces each enemy sprite breaks into, cut once per texture and frame. */
  private pieces = new Map<string, SpritePiece[]>();
  private couponIcon!: Phaser.GameObjects.Image;
  private couponText!: Phaser.GameObjects.BitmapText;
  private couponPop = 0;
  private banner!: Phaser.GameObjects.BitmapText;
  /** Red flash over the whole screen when hurt, and the heart that just broke. */
  private hurtFlash!: Phaser.GameObjects.Rectangle;
  private heartHit = -1;
  private heartHitT = 0;
  /** Seconds since the toaster went down (-1 while alive). */
  private downT = -1;
  private downPanel: Phaser.GameObjects.GameObject[] = [];
  /** The restart only listens once the buttons held while dying have been let go. */
  private downArmed = false;
  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private hearts: Phaser.GameObjects.Image[] = [];
  private ammoPips: Phaser.GameObjects.Image[] = [];
  private ammoText!: Phaser.GameObjects.BitmapText;
  private reloadBar!: Phaser.GameObjects.Graphics;
  /** Attack warnings: shrinking ring, aim dots and «!», redrawn every frame from the emitters. */
  private warn!: Phaser.GameObjects.Graphics;
  private warnings = 0;
  private charges = 0;
  private hint!: Phaser.GameObjects.BitmapText;
  private hintT = 9;
  private camX = 0;
  private camY = 0;

  constructor() {
    super('game');
  }

  create(): void {
    // create() runs again on restart, on the same object: start from a clean slate.
    this.acc = 0;
    this.hitstop = 0;
    this.shots = 0;
    this.warnings = 0;
    this.charges = 0;
    this.gunKick = 0;
    this.flashHero = 0;
    this.muzzleT = 0;
    this.hintT = 9;
    this.couponPop = 0;
    this.heartHit = -1;
    this.heartHitT = 0;
    this.downT = -1;
    this.downPanel = [];
    this.downArmed = false;
    this.dummySprites = new Map();
    this.enemySprites = new Map();
    this.bulletSprites = new Map();
    this.pickupSprites = new Map();
    this.particles = [];
    this.floats = [];
    this.hearts = [];
    this.ammoPips = [];
    const seed = new URLSearchParams(location.search).get('semilla') ?? 'sala-pruebas';
    this.world = createWorld({ seed });
    this.controls = new Controls(this);
    const unlock = (): void => this.sound2.unlock();
    this.input.on('pointerdown', unlock);
    this.input.keyboard?.on('keydown', unlock);

    const room = this.world.room;
    const art = paintRoom(room, seed);
    addCanvasTexture(this, 'sala', art.canvas);
    this.add.image(0, 0, 'sala').setOrigin(0, 0).setDepth(-100000);

    for (const pr of room.props) {
      const key = pr.def.id;
      const tex = this.textures.get(key).getSourceImage();
      this.add.image(pr.x, pr.y + 1, shadowTexture(this, Math.max(6, Math.floor(tex.width / 2) - 3), 3)).setDepth(-50000);
      this.add.image(pr.x, pr.y, key).setOrigin(0.5, 1).setDepth(pr.y);
    }
    for (const d of this.world.dummies) {
      this.add.image(d.x, d.y - 1, shadowTexture(this, 8, 3)).setDepth(-50000);
      this.dummySprites.set(d.id, this.add.image(d.x, d.y, 'maniqui').setOrigin(0.5, 38 / 40).setDepth(d.y));
    }

    for (const en of this.world.enemies) this.makeEnemyView(en);

    this.heroShadow = this.add.image(0, 0, shadowTexture(this, 9, 3)).setDepth(-50000);
    this.hero = this.add.sprite(0, 0, 'tostadora', 0);
    this.gun = this.add.image(0, 0, 'arma-secador').setOrigin(GUN_GRIP.x / 18, GUN_GRIP.y / 11);
    this.hand = this.add.image(0, 0, 'mano');
    this.muzzle = this.add.image(0, 0, 'fogonazo', 0).setOrigin(0.15, 0.5).setVisible(false);

    // HUD, fixed to the screen.
    this.add.image(0, 0, 'vineta').setOrigin(0, 0).setScrollFactor(0).setDepth(90000);
    const maxHearts = Math.ceil(this.world.player.def.maxHp / 2);
    for (let i = 0; i < maxHearts; i++) this.hearts.push(this.hud(this.add.image(8 + i * 10, 8, 'corazones', 0).setOrigin(0, 0)));
    const mag = this.world.player.weapon.def.magazine;
    for (let i = 0; i < mag; i++) this.ammoPips.push(this.hud(this.add.image(VIEW_W - 8 - (mag - i) * 4, VIEW_H - 14, 'municion', 0).setOrigin(0, 0)));
    this.hud(this.add.image(VIEW_W - 12 - mag * 4 - 20, VIEW_H - 15, 'arma-secador').setOrigin(0, 0));
    this.couponIcon = this.hud(this.add.image(7, 19, 'cupon', 0).setOrigin(0, 0));
    this.couponText = this.hud(this.add.bitmapText(21, 20, FONT, '0', 8));
    this.couponText.setTint(0xf6c431);
    this.hud(this.add.image(7, 31, 'ranura').setOrigin(0, 0)).setAlpha(0.85);
    this.hurtFlash = this.hud(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xe0453b, 1).setOrigin(0, 0)).setAlpha(0).setDepth(89000);
    this.banner = this.hud(this.add.bitmapText(VIEW_W / 2, 44, FONT, '', 8).setOrigin(0.5, 0));
    this.banner.setTint(0xf6c431).setAlpha(0);
    this.ammoText = this.hud(this.add.bitmapText(VIEW_W - 8, VIEW_H - 26, FONT, '', 8).setOrigin(1, 0));
    this.hint = this.hud(
      this.add.bitmapText(8, VIEW_H - 16, FONT, fontText('WASD mover · ratón apuntar · clic disparar · espacio rodar · R recargar · 1-5 balas enemigas'), 8),
    );
    this.hint.setTint(0xd6cdb2);
    const title = this.hud(this.add.bitmapText(VIEW_W / 2, 30, FONT, fontText(room.name), 8).setOrigin(0.5, 0));
    title.setTint(0xf6c431);
    this.tweens.add({ targets: title, alpha: 0, delay: 2500, duration: 800 });
    this.reloadBar = this.add.graphics().setDepth(80000);
    this.warn = this.add.graphics().setDepth(84000);
    this.crosshair = this.hud(this.add.image(0, 0, 'mira')).setDepth(100000);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, room.w, room.h);
    cam.setRoundPixels(true);
    this.camX = this.world.player.x - VIEW_W / 2;
    this.camY = this.world.player.y - VIEW_H / 2;
    cam.setScroll(Math.round(this.camX), Math.round(this.camY));

    this.syncView(0);
    (window as unknown as { __GE__: { state: () => GameStateForTests; scene: GameScene } }).__GE__ = {
      scene: this,
      state: () => this.testState(),
    };
  }

  private makeEnemyView(en: Enemy): EnemyView {
    const flying = enemyAltitude(en) > 0;
    const shadow = this.add.image(en.x, en.y, flying ? shadowTexture(this, 4, 2) : shadowTexture(this, 10, 3)).setDepth(-50000);
    const sheet = this.textures.get(en.def.sprite);
    const s = this.add.image(en.x, en.y, en.def.sprite, sheet.frameTotal > 2 ? 0 : undefined);
    s.setOrigin(en.def.anchor.x / s.width, en.def.anchor.y / s.height);
    const v: EnemyView = { s, shadow };
    if (SPRITE_BLINKS[en.def.sprite]) v.blink = this.add.graphics();
    if (SPRITE_GLOWS[en.def.sprite]) v.glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.enemySprites.set(en.id, v);
    return v;
  }

  private destroyEnemyView(id: number): void {
    const v = this.enemySprites.get(id);
    if (!v) return;
    v.s.destroy();
    v.shadow.destroy();
    v.blink?.destroy();
    v.glow?.destroy();
    this.enemySprites.delete(id);
  }

  /**
   * Cuts a sprite frame into 8x8 pieces (only the ones with enough pixels), as frames of a new
   * texture, so an enemy can come apart into bits of itself.
   */
  private piecesOf(key: string, frame: string | number, anchor: { x: number; y: number }): { tex: string; list: SpritePiece[] } {
    const tex = `piezas-${key}-${frame}`;
    const known = this.pieces.get(tex);
    if (known) return { tex, list: known };
    const fr = this.textures.getFrame(key, frame);
    const ct = this.textures.createCanvas(tex, fr.cutWidth, fr.cutHeight);
    const list: SpritePiece[] = [];
    if (!ct) return { tex, list };
    const ctx = ct.getContext();
    ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
    const data = ctx.getImageData(0, 0, fr.cutWidth, fr.cutHeight).data;
    const CELL = 8;
    for (let y = 0; y < fr.cutHeight; y += CELL) {
      for (let x = 0; x < fr.cutWidth; x += CELL) {
        const w = Math.min(CELL, fr.cutWidth - x);
        const h = Math.min(CELL, fr.cutHeight - y);
        let solid = 0;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (data[((y + j) * fr.cutWidth + x + i) * 4 + 3]! > 0) solid++;
        if (solid < 14) continue;
        const name = `p${list.length}`;
        ct.add(name, 0, x, y, w, h);
        list.push({ name, dx: x + w / 2 - anchor.x, dy: y + h / 2 - anchor.y, w, h });
      }
    }
    ct.refresh();
    this.pieces.set(tex, list);
    return { tex, list };
  }

  /** The enemy comes apart: flash, smoke, sparks, bits of its own sprite and loose screws. */
  private breakApart(e: Extract<SimEvent, { type: 'death' }>): void {
    const v = this.enemySprites.get(e.source);
    // Small fry (the moth) gets a smaller send-off.
    const big = !v || v.s.width >= 20;
    this.hitstop = big ? 0.08 : 0.04;
    this.cameras.main.shake(big ? 170 : 90, big ? 0.009 : 0.005, true);
    this.sound2.play('desmontar', { detune: big ? this.fx.range(-150, 100) : 500, volume: big ? 1 : 0.6 });
    const cx = e.x;
    const cy = e.y - e.alt;
    if (v) {
      const s = v.s;
      // A white silhouette for a couple of frames where it was.
      const ghost = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setScale(s.scaleX, 1).setTintFill(0xffffff).setDepth(s.depth);
      this.particles.push({ s: ghost, vx: 0, vy: 0, z: 0, vz: 0, life: 0.07, maxLife: 0.07, gravity: false, spin: 0, fade: false });
      const { tex, list } = this.piecesOf(s.texture.key, s.frame.name, { x: s.originX * s.width, y: s.originY * s.height });
      const flip = s.scaleX < 0 ? -1 : 1;
      for (const pc of list) {
        const img = this.add.image(0, 0, tex, pc.name).setFlipX(flip < 0);
        const px = e.x + pc.dx * flip;
        // Each piece flies off from the centre of the body and along the killing shot.
        const out = Math.atan2(pc.dy + 14, pc.dx * flip);
        const sp = this.fx.range(25, 70);
        const floorY = e.y + this.fx.range(-4, 4);
        this.particles.push({
          s: img.setPosition(px, floorY),
          vx: Math.cos(out) * sp * 0.6 + Math.cos(e.angle) * this.fx.range(30, 70),
          vy: Math.sin(e.angle) * this.fx.range(10, 30) + this.fx.range(-12, 12),
          z: Math.max(1, -pc.dy + e.alt),
          vz: this.fx.range(50, 120),
          life: this.fx.range(2.2, 3.2),
          maxLife: 3.2,
          gravity: true,
          spin: this.fx.range(-12, 12),
          fade: true,
          fadeTime: 0.6,
          hw: pc.w / 2,
          hh: pc.h / 2,
        });
      }
      this.destroyEnemyView(e.source);
    }
    // Loose screws, nuts and springs.
    const n = big ? 6 : 2;
    for (let i = 0; i < n; i++) {
      const a = e.angle + this.fx.range(-1.8, 1.8);
      this.particles.push({
        s: this.add.image(cx, e.y + this.fx.range(-3, 3), 'chatarra', this.fx.int(0, 3)),
        vx: Math.cos(a) * this.fx.range(30, 90),
        vy: Math.sin(a) * this.fx.range(10, 30),
        z: Math.max(2, e.y - cy + 12),
        vz: this.fx.range(70, 140),
        life: this.fx.range(1.8, 2.6),
        maxLife: 2.6,
        gravity: true,
        spin: this.fx.range(-16, 16),
        fade: true,
        hw: 3,
        hh: 3,
      });
    }
    for (let i = 0; i < (big ? 6 : 3); i++) this.puff(cx + this.fx.range(-8, 8), cy - this.fx.range(4, 20), this.fx.range(0.4, 0.7));
    for (let i = 0; i < (big ? 14 : 6); i++) this.spark(cx, cy - 12, this.fx.range(0, Math.PI * 2), this.fx.range(60, 160), this.fx.int(0, 3));
    if (big) {
      const stamp = DEATH_STAMPS[this.fx.int(0, DEATH_STAMPS.length - 1)]!;
      const t = this.add.bitmapText(Math.round(cx), Math.round(cy - 30), FONT, fontText(stamp), 8).setOrigin(0.5, 1).setDepth(85000).setTint(0xe0453b);
      this.floats.push({ t, vy: -18, life: 1.1 });
    }
  }

  /** Provisional end screen: title, how long it lasted and how to start again. */
  private showDownPanel(): void {
    const secs = Math.round(this.world.tick / 60);
    const box = this.hud(this.add.rectangle(VIEW_W / 2, VIEW_H / 2, 220, 64, 0x0e0c16, 0.88)).setStrokeStyle(1, 0xe0453b).setDepth(96000);
    const title = this.hud(this.add.bitmapText(VIEW_W / 2, VIEW_H / 2 - 22, FONT, fontText(DOWN_TITLE), 8).setOrigin(0.5, 0)).setDepth(96001);
    title.setTint(0xe0453b);
    const life = this.hud(this.add.bitmapText(VIEW_W / 2, VIEW_H / 2 - 6, FONT, fontText(`Vida útil: ${secs} s · Bajas: ${this.world.kills}`), 8).setOrigin(0.5, 0)).setDepth(96001);
    life.setTint(0xd6cdb2);
    const hint = this.hud(this.add.bitmapText(VIEW_W / 2, VIEW_H / 2 + 10, FONT, fontText(DOWN_HINT), 8).setOrigin(0.5, 0)).setDepth(96001);
    hint.setTint(0xf6c431);
    this.downPanel = [box, title, life, hint];
  }

  private hud<T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T): T {
    o.setScrollFactor(0);
    o.setDepth(95000);
    return o;
  }

  testState(): GameStateForTests {
    const p = this.world.player;
    return {
      ready: true,
      tick: this.world.tick,
      x: p.x,
      y: p.y,
      ammo: p.weapon.ammo,
      hp: p.hp,
      bullets: this.world.bullets.length,
      rolling: isRolling(p),
      dummyDamage: this.world.dummies.reduce((a, d) => a + d.damageTaken, 0),
      warnings: this.warnings,
      charges: this.charges,
      enemyDamage: this.world.enemies.reduce((a, d) => a + d.damageTaken, 0),
      fps: this.game.loop.actualFps,
      shots: this.shots,
      kills: this.world.kills,
      coupons: p.coupons,
      pickups: this.world.pickups.length,
      over: this.world.over,
    };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 100) / 1000;
    if (this.hitstop > 0) {
      this.hitstop -= dt;
    } else {
      this.acc += dt;
      let steps = 0;
      while (this.acc >= DT && steps < 5) {
        const p = this.world.player;
        const input = this.controls.read({ bodyX: p.x, bodyY: p.y - BODY_HEIGHT });
        step(this.world, input);
        this.handleEvents(this.world.events);
        this.acc -= DT;
        steps++;
        if (this.hitstop > 0) {
          this.acc = 0;
          break;
        }
      }
      if (steps === 5) this.acc = 0;
    }
    this.syncView(dt);
  }

  private handleEvents(events: SimEvent[]): void {
    for (const e of events) {
      switch (e.type) {
        case 'shot': {
          this.shots++;
          this.gunKick = 3;
          this.muzzleT = 0.05;
          this.muzzle.setFrame(this.fx.int(0, 1));
          this.cameras.main.shake(50, 0.0025, true);
          this.sound2.play('disparo', { detune: this.fx.range(-150, 150) });
          this.sound2.play('disparoTono', { detune: this.fx.range(-100, 100) });
          this.ejectCasing(e.angle);
          break;
        }
        case 'hit': {
          this.hitstop = 0.045;
          this.cameras.main.shake(70, 0.004, true);
          this.sound2.play('golpe', { detune: this.fx.range(-200, 200) });
          this.sound2.play('golpeRuido', { volume: 0.7 });
          for (let i = 0; i < 6; i++) this.spark(e.x, e.y, e.angle + Math.PI + this.fx.range(-1.1, 1.1), this.fx.range(50, 130), this.fx.int(0, 2));
          this.floatText(e.x + this.fx.range(-4, 4), e.y - 6, String(e.damage), 0xf6c431);
          break;
        }
        case 'bulletWall': {
          this.puff(e.x, e.y, 0.25);
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y, e.angle + Math.PI + this.fx.range(-1.2, 1.2), this.fx.range(30, 80), this.fx.int(1, 3));
          this.sound2.play('pared', { volume: 0.6, detune: this.fx.range(-300, 300) });
          break;
        }
        case 'bulletFade':
          this.puff(e.x, e.y, 0.2);
          break;
        case 'roll': {
          this.flashHero = 0.05;
          this.sound2.play('rodar');
          for (let i = 0; i < 4; i++) this.puff(e.x - e.dirX * 6 + this.fx.range(-4, 4), e.y + this.fx.range(-2, 1), 0.35);
          break;
        }
        case 'reloadStart':
          this.sound2.play('recargar');
          break;
        case 'reloadEnd':
          this.sound2.play('recargado');
          break;
        case 'empty':
          this.sound2.play('vacio');
          break;
        case 'charge':
          this.charges++;
          this.sound2.play('motor');
          for (let i = 0; i < 5; i++) this.puff(e.x - e.dirX * 8 + this.fx.range(-4, 4), e.y + this.fx.range(-2, 1), 0.4);
          break;
        case 'brake':
          this.sound2.play('derrape', { volume: 0.8 });
          break;
        case 'bonk': {
          this.cameras.main.shake(120, 0.006, true);
          this.sound2.play('choque');
          for (let i = 0; i < 8; i++) this.spark(e.x, e.y, Math.atan2(-e.dirY, -e.dirX) + this.fx.range(-1.4, 1.4), this.fx.range(40, 110), this.fx.int(0, 2));
          for (let i = 0; i < 3; i++) this.puff(e.x + this.fx.range(-5, 5), e.y + this.fx.range(-3, 3), 0.45);
          break;
        }
        case 'contact':
          this.cameras.main.shake(90, 0.005, true);
          this.flashHero = 0.06;
          this.sound2.play('empujon');
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y, Math.atan2(e.dirY, e.dirX) + this.fx.range(-1, 1), this.fx.range(40, 90), this.fx.int(0, 2));
          break;
        case 'switchOn':
          this.sound2.play('encender');
          for (let i = 0; i < 5; i++) this.spark(e.x + this.fx.range(-6, 6), e.y + this.fx.range(-6, 4), this.fx.range(0, Math.PI * 2), this.fx.range(20, 60), 0);
          break;
        case 'dart':
          this.sound2.play('aleteo', { detune: this.fx.range(-200, 200) });
          break;
        case 'death':
          this.breakApart(e);
          break;
        case 'pickup':
          this.couponPop = 0.25;
          this.sound2.play('cupon', { detune: Math.min(600, (e.total % 8) * 80) });
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y - 3, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 1);
          break;
        case 'restock':
          this.sound2.play('reponer');
          this.banner.setText(fontText(RESTOCK_LINE)).setAlpha(1);
          this.tweens.killTweensOf(this.banner);
          this.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 600 });
          for (const en of this.world.enemies) for (let i = 0; i < 4; i++) this.puff(en.x + this.fx.range(-8, 8), en.y - enemyAltitude(en) - this.fx.range(0, 16), 0.5);
          break;
        case 'hurt': {
          this.hitstop = 0.1;
          this.flashHero = 0.08;
          this.cameras.main.shake(220, 0.011, true);
          this.sound2.play('dolor');
          this.hurtFlash.setAlpha(0.28);
          this.heartHit = Math.floor(e.hp / 2);
          this.heartHitT = 0.5;
          // Crumbs and sparks thrown away from the blow.
          const a = Math.atan2(e.dirY, e.dirX);
          for (let i = 0; i < 8; i++) this.spark(e.x, e.y, a + this.fx.range(-1, 1), this.fx.range(50, 140), this.fx.int(1, 3));
          break;
        }
        case 'down':
          this.downT = 0;
          this.hitstop = 0.3;
          this.cameras.main.shake(400, 0.016, true);
          this.sound2.play('baja');
          for (let i = 0; i < 8; i++) this.puff(e.x + this.fx.range(-8, 8), e.y - this.fx.range(4, 22), this.fx.range(0.5, 0.9));
          break;
        case 'telegraph':
          this.warnings++;
          this.sound2.play('aviso', { detune: e.color === 'cyan' ? 300 : 0 });
          break;
      }
    }
  }

  private ejectCasing(angle: number): void {
    const p = this.world.player;
    const pv = gunPivot(p);
    const s = this.add.image(pv.x, pv.y, 'pelusa', this.fx.int(0, 2));
    const back = angle + Math.PI;
    this.particles.push({
      s,
      vx: Math.cos(back) * this.fx.range(20, 45) + this.fx.range(-10, 10),
      vy: 0,
      z: 4,
      vz: this.fx.range(55, 85),
      life: 1.6,
      maxLife: 1.6,
      gravity: true,
      spin: this.fx.range(-8, 8),
      fade: true,
    });
  }

  private spark(x: number, y: number, a: number, speed: number, frame: number): void {
    const s = this.add.image(x, y, 'chispas', frame);
    this.particles.push({ s, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, z: 0, vz: 0, life: 0.25, maxLife: 0.25, gravity: false, spin: 0, fade: false });
  }

  private puff(x: number, y: number, life: number): void {
    const s = this.add.image(x, y, 'polvo', 0);
    this.particles.push({
      s,
      vx: this.fx.range(-8, 8),
      vy: this.fx.range(-14, -4),
      z: 0,
      vz: 0,
      life,
      maxLife: life,
      gravity: false,
      spin: 0,
      fade: false,
      anim: { key: 'polvo', frames: 4, fps: 4 / life },
    });
  }

  private floatText(x: number, y: number, text: string, tint: number): void {
    const t = this.add.bitmapText(Math.round(x), Math.round(y), FONT, text, 8).setOrigin(0.5, 1).setDepth(85000).setTint(tint);
    this.floats.push({ t, vy: -30, life: 0.6 });
  }

  private syncView(dt: number): void {
    const w = this.world;
    const p = w.player;
    const rolling = isRolling(p);

    // Hero body.
    const moving = Math.hypot(p.vx, p.vy) > 12;
    let frame: number;
    if (rolling) frame = 3;
    else if (moving) frame = 2 + (Math.floor(p.walked / 7) % 4);
    else frame = Math.floor(this.time.now / 500) % 2;
    this.hero.setFrame(frame);
    this.hero.setScale(p.facing, 1);
    if (rolling) {
      const k = p.rollT / p.def.rollTime;
      this.hero.setOrigin(HERO_FEET_X / HERO_W, 22 / HERO_H);
      this.hero.setPosition(Math.round(p.x), Math.round(p.y - 14));
      this.hero.setRotation(Math.min(1, k / 0.85) * Math.PI * 2 * (p.rollDirX >= 0 ? 1 : -1));
    } else {
      this.hero.setOrigin(HERO_FEET_X / HERO_W, HERO_FEET_Y / HERO_H);
      this.hero.setPosition(Math.round(p.x), Math.round(p.y));
      this.hero.setRotation(0);
    }
    if (w.over) {
      // Provisional fall: it tips over onto its side and smokes (the full animation is its own task).
      this.downT += dt;
      const k = Math.min(1, this.downT / 0.35);
      this.hero.setFrame(0);
      this.hero.setRotation(k * k * (Math.PI / 2) * p.facing);
      if (this.fx.chance(dt * 6)) this.puff(p.x + this.fx.range(-6, 6), p.y - 10 + this.fx.range(-4, 4), 0.8);
      if (this.downT > 1.6 && this.downPanel.length === 0) this.showDownPanel();
      if (this.downPanel.length) {
        const pressed = this.controls.read({ bodyX: p.x, bodyY: p.y }).reload || this.input.activePointer.isDown;
        if (!pressed) this.downArmed = true;
        else if (this.downArmed) this.scene.restart();
      }
    }
    this.hero.setDepth(p.y);
    this.hero.setAlpha(1);
    this.heroShadow.setPosition(Math.round(p.x), Math.round(p.y));
    if (this.flashHero > 0) {
      this.flashHero -= dt;
      this.hero.setTintFill(0xffffff);
    } else if (p.invulnerable > 0 && rolling) {
      this.hero.setTint(0xfff1c8);
    } else if (p.invulnerable > 0 && !w.over) {
      // Blinking after a hit: it cannot be hurt again until it stops.
      this.hero.clearTint();
      this.hero.setAlpha(Math.floor(this.time.now / 70) % 2 === 0 ? 0.25 : 1);
    } else this.hero.clearTint();

    // Gun and floating hand.
    this.gunKick = Math.max(0, this.gunKick - dt * 30);
    const pv = gunPivot(p);
    const gx = pv.x - Math.cos(p.aim) * this.gunKick;
    const gy = pv.y - Math.sin(p.aim) * this.gunKick;
    const behind = Math.sin(p.aim) < -0.35;
    this.gun.setVisible(!rolling && !w.over);
    this.hand.setVisible(!rolling && !w.over);
    this.gun.setPosition(Math.round(gx), Math.round(gy)).setRotation(p.aim).setScale(1, p.facing);
    this.gun.setDepth(p.y + (behind ? -0.5 : 0.5));
    this.hand.setPosition(Math.round(gx), Math.round(gy + 1)).setDepth(p.y + (behind ? -0.4 : 0.6));
    this.muzzleT -= dt;
    const mzx = gx + Math.cos(p.aim) * 14;
    const mzy = gy + Math.sin(p.aim) * 14;
    this.muzzle.setVisible(this.muzzleT > 0 && !rolling).setPosition(Math.round(mzx), Math.round(mzy)).setRotation(p.aim).setDepth(p.y + 1);

    // Dummies.
    for (const d of w.dummies) {
      const s = this.dummySprites.get(d.id);
      if (!s) continue;
      s.setRotation(d.lean);
      const warnK = sourceTelegraph(w, d.id);
      // Shiver in place during the last part of the warning.
      const shiver = warnK > 0.6 ? (Math.floor(this.time.now / 40) % 2 === 0 ? 1 : -1) : 0;
      s.setX(d.x + shiver);
      if (d.hitT > 0.07) s.setTintFill(0xffffff);
      else if (d.hitT > 0) s.setTint(0xffb0a0);
      else if (warnK >= 0 && blinkOn(warnK)) s.setTintFill(warnK > 0.75 ? 0xffffff : 0xf6c431);
      else s.clearTint();
    }
    // Enemies (the ones that come back after a restock get their sprites here).
    for (const en of w.enemies) {
      const v = this.enemySprites.get(en.id) ?? this.makeEnemyView(en);
      const s = v.s;
      const warnK = sourceTelegraph(w, en.id);
      // Hop of one pixel while walking; leans into the charge, back when braking, wobbles when stunned.
      const bob = en.state === 'walk' && Math.floor(en.moved / 5) % 2 === 1 ? -1 : 0;
      const shiver = warnK > 0.6 ? (Math.floor(this.time.now / 40) % 2 === 0 ? 1 : -1) : 0;
      const alt = enemyAltitude(en);
      // Flyers bob up and down; the moth flaps fast, faster when it dives.
      const fly = alt > 0 ? Math.round(Math.sin(this.time.now / 160 + en.id) * 1.5) : 0;
      s.setPosition(Math.round(en.x) + shiver, Math.round(en.y) + bob - alt + fly).setDepth(en.y + (alt > 0 ? 1 : 0));
      s.setScale(en.facing, 1);
      if (en.def.brain.kind === 'moth') s.setFrame(Math.floor(this.time.now / (en.state === 'charge' ? 35 : 70)) % 2);
      else if (en.def.brain.kind === 'turret' && en.def.brain.startup) s.setFrame(bulbLit(en, this.time.now) ? 0 : 1);
      let rot = 0;
      if (en.def.brain.kind === 'moth') rot = en.state === 'charge' ? 0.3 * en.facing : 0;
      else if (en.state === 'charge') rot = 0.18 * en.facing;
      else if (en.state === 'brake') rot = -0.12 * en.facing * (1 - en.t / en.until);
      else if (en.state === 'stun') rot = Math.sin(en.t * 22) * 0.2 * (1 - en.t / en.until);
      s.setRotation(rot);
      const gl = SPRITE_GLOWS[en.def.sprite];
      if (v.glow && gl) {
        // A soft halo while lit, stronger while it fires.
        v.glow.clear();
        if (bulbLit(en, this.time.now)) {
          const k = en.state === 'fire' ? 1 : 0.45;
          const cx = Math.round(en.x);
          const cy = Math.round(en.y) - gl.y;
          v.glow.fillStyle(gl.color, 0.07 * k).fillCircle(cx, cy, gl.r);
          v.glow.fillStyle(gl.color, 0.1 * k).fillCircle(cx, cy, gl.r * 0.6);
        }
        v.glow.setDepth(en.y - 0.1);
      }
      v.shadow.setPosition(Math.round(en.x), Math.round(en.y));
      const bl = SPRITE_BLINKS[en.def.sprite];
      if (v.blink && bl) {
        // Covers a lit detail of the sprite now and then (the microwave's 12:00 that never stops blinking).
        const period = warnK >= 0 ? 120 : 500;
        const off = Math.floor(this.time.now / period) % 2 === 0;
        v.blink.clear();
        if (off && rot === 0) {
          const lx = en.facing === 1 ? bl.x - en.def.anchor.x : en.def.anchor.x - bl.x - bl.w;
          v.blink.fillStyle(bl.color, 1).fillRect(s.x + lx, s.y + bl.y - en.def.anchor.y, bl.w, bl.h);
        }
        v.blink.setDepth(en.y + 0.1);
      }
      if (en.hitT > 0.07) s.setTintFill(0xffffff);
      else if (en.hitT > 0) s.setTint(0xffb0a0);
      else if (warnK >= 0 && blinkOn(warnK)) s.setTintFill(warnK > 0.75 ? 0xffffff : 0xf6c431);
      else s.clearTint();
      // Dust trail while charging, sparks from the wheels while braking.
      if (en.state === 'charge' && this.fx.chance(0.5)) this.puff(en.x - en.dirX * 10 + this.fx.range(-3, 3), en.y + this.fx.range(-2, 1), 0.35);
      if (en.state === 'brake' && Math.hypot(en.vx, en.vy) > 40 && this.fx.chance(0.4)) {
        this.spark(en.x + this.fx.range(-6, 6), en.y, Math.atan2(-en.vy, -en.vx) + this.fx.range(-0.6, 0.6), this.fx.range(30, 70), 2);
      }
    }

    if (this.enemySprites.size > w.enemies.length) {
      const ids = new Set(w.enemies.map((en) => en.id));
      for (const id of [...this.enemySprites.keys()]) if (!ids.has(id)) this.destroyEnemyView(id);
    }

    this.drawWarnings();
    this.drawPickups();

    // Bullets.
    const alive = new Set<number>();
    for (const b of w.bullets) {
      alive.add(b.id);
      let s = this.bulletSprites.get(b.id);
      if (!s) {
        s = this.add.image(b.x, b.y, b.owner === 'player' ? 'bala-jugador' : b.color === 'cyan' ? 'bala-cian' : 'bala-roja');
        this.bulletSprites.set(b.id, s);
      }
      s.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(b.y + 20);
      const sc = b.life < 0.15 ? 0.6 : 1;
      s.setScale(sc);
    }
    for (const [id, s] of this.bulletSprites) {
      if (!alive.has(id)) {
        s.destroy();
        this.bulletSprites.delete(id);
      }
    }

    this.updateParticles(dt);
    this.updateHud(dt);
    this.updateCamera(dt);
  }

  /** Coupons hop out when they drop, then lie there glinting now and then. */
  private drawPickups(): void {
    const alive = new Set<number>();
    for (const k of this.world.pickups) {
      alive.add(k.id);
      let v = this.pickupSprites.get(k.id);
      if (!v) {
        v = { s: this.add.image(k.x, k.y, 'cupon', 0).setOrigin(0.5, 1), shadow: this.add.image(k.x, k.y, shadowTexture(this, 4, 2)).setDepth(-50000) };
        this.pickupSprites.set(k.id, v);
      }
      const hop = k.age < PICKUP_DELAY ? Math.sin((Math.PI * k.age) / PICKUP_DELAY) * 12 : Math.max(0, Math.sin(this.time.now / 260 + k.id)) * 1.5;
      const glint = Math.floor(this.time.now / 90 + k.id * 7) % 16 === 0;
      v.s.setPosition(Math.round(k.x), Math.round(k.y - hop)).setFrame(glint ? 1 : 0).setDepth(k.y);
      v.shadow.setPosition(Math.round(k.x), Math.round(k.y));
    }
    for (const [id, v] of this.pickupSprites) {
      if (alive.has(id)) continue;
      v.s.destroy();
      v.shadow.destroy();
      this.pickupSprites.delete(id);
    }
  }

  private drawWarnings(): void {
    const g = this.warn;
    g.clear();
    for (const wn of activeWarnings(this.world)) {
      const k = wn.k;
      const col = wn.color === 'cyan' ? 0x69dbd8 : 0xe0453b;
      const x = Math.round(wn.x);
      const y = Math.round(wn.y);
      // Bullets: a ring closes in on the muzzle; when it reaches it, they come out.
      if (wn.bullets) {
        const r = Math.round(4 + 16 * (1 - k));
        pixelRing(g, x, y, r + 1, 0x0e0c16);
        pixelRing(g, x, y, r, col);
      }
      // Aimed attacks: dots show where they will go (a charge shows its whole path).
      if (wn.aimed) {
        const len = wn.bullets ? 10 + 26 * k : 30 + 110 * k;
        const off = (this.time.now / 60) % 5;
        for (let d = 8 + off; d < 8 + len; d += 5) {
          const px = Math.round(x + Math.cos(wn.aim) * d);
          const py = Math.round(y + Math.sin(wn.aim) * d);
          g.fillStyle(0x0e0c16, 1).fillRect(px - 1, py - 1, 3, 3);
          g.fillStyle(col, 1).fillRect(px, py, 1, 1);
        }
      }
      // «!» above whoever attacks (or above the muzzle), in the warning yellow; it pops up.
      const src = wn.source !== undefined ? (this.dummySprites.get(wn.source) ?? this.enemySprites.get(wn.source)?.s) : undefined;
      const top = src ? Math.round(src.getTopCenter().y ?? y) - 11 : y - 14;
      const bx = src ? Math.round(src.x) : x;
      const by = top - (k < 0.15 ? Math.round((0.15 - k) * 20) : 0);
      g.fillStyle(0x0e0c16, 1).fillRect(bx - 2, by - 1, 4, 10);
      g.fillStyle(0xf6c431, 1).fillRect(bx - 1, by, 2, 5).fillRect(bx - 1, by + 6, 2, 2);
    }
  }

  private updateParticles(dt: number): void {
    const keep: Particle[] = [];
    for (const q of this.particles) {
      q.life -= dt;
      if (q.life <= 0) {
        q.s.destroy();
        continue;
      }
      q.s.x += q.vx * dt;
      q.s.y += q.vy * dt;
      if (q.gravity) {
        q.vz -= 260 * dt;
        q.z += q.vz * dt;
        if (q.z <= 0) {
          q.z = 0;
          if (q.vz < -20) q.vz = -q.vz * 0.35;
          else q.vz = 0;
          q.vx *= 0.6;
          q.spin *= 0.5;
        }
        q.s.rotation += q.spin * dt;
        q.s.setDepth(q.s.y - 1);
        q.s.setPosition(q.s.x, q.s.y);
        q.s.setDisplayOrigin(q.hw ?? 2, (q.hh ?? 2) + q.z);
      } else {
        q.vx *= 0.9;
        q.vy *= 0.9;
        q.s.setDepth(85000);
      }
      if (q.anim) q.s.setFrame(Math.min(q.anim.frames - 1, Math.floor((1 - q.life / q.maxLife) * q.anim.frames)));
      const ft = q.fadeTime ?? 0.4;
      if (q.fade && q.life < ft) q.s.setAlpha(Math.round((q.life / ft) * 3) / 3);
      keep.push(q);
    }
    this.particles = keep;
    const fk: FloatText[] = [];
    for (const f of this.floats) {
      f.life -= dt;
      if (f.life <= 0) {
        f.t.destroy();
        continue;
      }
      f.t.y += f.vy * dt;
      f.vy *= 0.92;
      fk.push(f);
    }
    this.floats = fk;
  }

  private updateHud(dt: number): void {
    const p = this.world.player;
    this.heartHitT = Math.max(0, this.heartHitT - dt);
    this.hearts.forEach((h, i) => {
      const hp = p.hp - i * 2;
      h.setFrame(hp >= 2 ? 0 : hp === 1 ? 1 : 2);
      // The heart that just lost a half jumps and blinks white; with one half left, the last heart beats.
      const hit = i === this.heartHit && this.heartHitT > 0;
      const beat = p.hp === 1 && i === 0 && Math.floor(this.time.now / 300) % 3 === 0;
      h.setY(8 - (hit && this.heartHitT > 0.35 ? 2 : 0) - (beat ? 1 : 0));
      if (hit && Math.floor(this.heartHitT * 16) % 2 === 0) h.setTintFill(0xffffff);
      else h.clearTint();
    });
    this.hurtFlash.setAlpha(Math.max(0, this.hurtFlash.alpha - dt * 1.6));
    this.couponText.setText(String(p.coupons));
    this.couponPop = Math.max(0, this.couponPop - dt);
    this.couponIcon.setY(this.couponPop > 0.12 ? 17 : 19);
    this.couponText.setTint(this.couponPop > 0 ? 0xfff1a8 : 0xf6c431);
    const ws = p.weapon;
    this.ammoPips.forEach((s, i) => s.setFrame(i < ws.ammo ? 0 : 1));
    this.ammoText.setText(ws.reload > 0 ? fontText('Recargando') : `${ws.ammo}/${ws.def.magazine}`);
    this.ammoText.setTint(ws.reload > 0 || ws.ammo === 0 ? 0xe0453b : 0xf4f1e8);
    this.reloadBar.clear();
    if (ws.reload > 0) {
      const k = 1 - ws.reload / ws.def.reloadTime;
      const x = Math.round(p.x) - 9;
      const y = Math.round(p.y) - 46;
      this.reloadBar.fillStyle(0x0e0c16, 1).fillRect(x - 1, y - 1, 20, 4);
      this.reloadBar.fillStyle(0x3a3f5c, 1).fillRect(x, y, 18, 2);
      this.reloadBar.fillStyle(0xf6c431, 1).fillRect(x, y, Math.round(18 * k), 2);
    }
    if (this.hintT > 0) {
      this.hintT -= dt;
      if (this.hintT < 1) this.hint.setAlpha(Math.max(0, this.hintT));
    }
    const pointer = this.input.activePointer;
    if (this.controls.mode === 'mouse') this.crosshair.setPosition(Math.round(pointer.x), Math.round(pointer.y));
    else {
      const cam = this.cameras.main;
      this.crosshair.setPosition(Math.round(p.x + Math.cos(p.aim) * 60 - cam.scrollX), Math.round(p.y - BODY_HEIGHT + Math.sin(p.aim) * 60 - cam.scrollY));
    }
  }

  private updateCamera(dt: number): void {
    const p = this.world.player;
    const cam = this.cameras.main;
    // Look a bit towards the aim point.
    const pointer = this.input.activePointer;
    let lx = 0;
    let ly = 0;
    if (this.controls.mode === 'mouse') {
      lx = (pointer.x - VIEW_W / 2) * 0.18;
      ly = (pointer.y - VIEW_H / 2) * 0.18;
    } else {
      lx = Math.cos(p.aim) * 30;
      ly = Math.sin(p.aim) * 30;
    }
    const tx = p.x + lx - VIEW_W / 2;
    const ty = p.y - BODY_HEIGHT + ly - VIEW_H / 2;
    const k = 1 - Math.pow(0.0005, dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    const room = this.world.room;
    this.camX = Math.max(0, Math.min(room.w - VIEW_W, this.camX));
    this.camY = Math.max(0, Math.min(room.h - VIEW_H, this.camY));
    cam.setScroll(Math.round(this.camX), Math.round(this.camY));
  }
}

/** Rectangles of a sprite (px from its top-left) that blink, drawn over it in `color`. */
const SPRITE_BLINKS: Record<string, { x: number; y: number; w: number; h: number; color: number }> = {
  microondas: { x: 22, y: 14, w: 4, h: 1, color: 0x0e0c16 },
};

/** Lights drawn around an enemy (`y` px above its feet, radius `r`) while it is lit. */
const SPRITE_GLOWS: Record<string, { y: number; r: number; color: number }> = {
  bombilla: { y: 23, r: 26, color: 0xfff1a0 },
};

interface EnemyView {
  s: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  blink?: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Graphics;
}

/**
 * Whether a bulb is lit now. While switching on it flickers like an energy-saving bulb: short,
 * uneven flashes that get longer until it stays on.
 */
function bulbLit(en: Enemy, now: number): boolean {
  if (en.state !== 'off') return true;
  const k = en.t / en.until;
  const slot = Math.floor(now / 70);
  // Cheap deterministic noise per 70 ms slot (only for drawing).
  const n = ((slot * 2654435761 + en.id * 97) >>> 0) % 100;
  return k > 0.35 && n < k * k * 90;
}

/** Blinks faster as the warning runs out (k from 0 to 1). */
function blinkOn(k: number): boolean {
  const hz = 5 + 13 * k;
  return Math.floor(k * hz) % 2 === 0;
}

/** A 1-px circle with no anti-aliasing (midpoint algorithm), to match the pixel art. */
function pixelRing(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, color: number): void {
  g.fillStyle(color, 1);
  let x = r;
  let y = 0;
  let err = 1 - r;
  while (x >= y) {
    for (const [px, py] of [
      [x, y],
      [y, x],
      [-y, x],
      [-x, y],
      [-x, -y],
      [-y, -x],
      [y, -x],
      [x, -y],
    ] as const) {
      g.fillRect(cx + px, cy + py, 1, 1);
    }
    y++;
    if (err < 0) err += 2 * y + 1;
    else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}
