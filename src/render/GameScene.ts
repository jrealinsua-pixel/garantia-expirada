// Draws the simulation and plays its events. Phaser only draws and reads input: all the rules
// live in src/sim/.
import { paintRoom } from '../art/room.ts';
import { fontText } from '../art/font.ts';
import { activeWarnings, createWorld, DT, gunPivot, isRolling, sourceTelegraph, step, BODY_HEIGHT, type SimEvent, type World } from '../sim/world.ts';
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
  private enemySprites = new Map<number, { s: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; blink?: Phaser.GameObjects.Graphics }>();
  private bulletSprites = new Map<number, Phaser.GameObjects.Image>();
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

    for (const en of this.world.enemies) {
      const shadow = this.add.image(en.x, en.y, shadowTexture(this, 10, 3)).setDepth(-50000);
      const tex = this.textures.get(en.def.sprite).getSourceImage();
      const s = this.add.image(en.x, en.y, en.def.sprite).setOrigin(en.def.anchor.x / tex.width, en.def.anchor.y / tex.height);
      const blink = SPRITE_BLINKS[en.def.sprite] ? this.add.graphics() : undefined;
      this.enemySprites.set(en.id, blink ? { s, shadow, blink } : { s, shadow });
    }

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
    this.hero.setDepth(p.y);
    this.heroShadow.setPosition(Math.round(p.x), Math.round(p.y));
    if (this.flashHero > 0) {
      this.flashHero -= dt;
      this.hero.setTintFill(0xffffff);
    } else if (p.invulnerable > 0 && rolling) {
      this.hero.setTint(0xfff1c8);
    } else this.hero.clearTint();

    // Gun and floating hand.
    this.gunKick = Math.max(0, this.gunKick - dt * 30);
    const pv = gunPivot(p);
    const gx = pv.x - Math.cos(p.aim) * this.gunKick;
    const gy = pv.y - Math.sin(p.aim) * this.gunKick;
    const behind = Math.sin(p.aim) < -0.35;
    this.gun.setVisible(!rolling);
    this.hand.setVisible(!rolling);
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
    // Enemies.
    for (const en of w.enemies) {
      const v = this.enemySprites.get(en.id);
      if (!v) continue;
      const s = v.s;
      const warnK = sourceTelegraph(w, en.id);
      // Hop of one pixel while walking; leans into the charge, back when braking, wobbles when stunned.
      const bob = en.state === 'walk' && Math.floor(en.moved / 5) % 2 === 1 ? -1 : 0;
      const shiver = warnK > 0.6 ? (Math.floor(this.time.now / 40) % 2 === 0 ? 1 : -1) : 0;
      s.setPosition(Math.round(en.x) + shiver, Math.round(en.y) + bob).setDepth(en.y);
      s.setScale(en.facing, 1);
      let rot = 0;
      if (en.state === 'charge') rot = 0.18 * en.facing;
      else if (en.state === 'brake') rot = -0.12 * en.facing * (1 - en.t / en.until);
      else if (en.state === 'stun') rot = Math.sin(en.t * 22) * 0.2 * (1 - en.t / en.until);
      s.setRotation(rot);
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

    this.drawWarnings();

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
        q.s.setDisplayOrigin(2, 2 + q.z);
      } else {
        q.vx *= 0.9;
        q.vy *= 0.9;
        q.s.setDepth(85000);
      }
      if (q.anim) q.s.setFrame(Math.min(q.anim.frames - 1, Math.floor((1 - q.life / q.maxLife) * q.anim.frames)));
      if (q.fade && q.life < 0.4) q.s.setAlpha(Math.round((q.life / 0.4) * 3) / 3);
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
    this.hearts.forEach((h, i) => {
      const hp = p.hp - i * 2;
      h.setFrame(hp >= 2 ? 0 : hp === 1 ? 1 : 2);
    });
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
