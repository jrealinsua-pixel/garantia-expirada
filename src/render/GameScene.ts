// Draws the simulation and plays its events. Phaser only draws and reads input: all the rules
// live in src/sim/.
import { paintRoom } from '../art/room.ts';
import { FONT_LINE, fontText, textWidth, wrapLines } from '../art/font.ts';
import { CHEST_LOCKED_LINES, CHEST_NAME, CHEST_OPEN_LINES, controlsHint, RELOADING, swapHint, TEST_ROOM_HINT, SYNERGY_LINE, TICKET_LINE, WEAPON_FOUND_LINES } from '../data/texts.ts';
import { SYNERGIES } from '../data/synergies.ts';
import { GOOD_NAMES, SHOPKEEPER } from '../data/shop.ts';
import { activeLines, modifierLines, weaponLines, type EffectLine } from '../data/describe.ts';
import { WEAPONS } from '../data/weapons.ts';
import { ACTIVE_ITEMS, ITEMS } from '../data/items.ts';
import { REPORT_MENU_HINT } from '../data/texts.ts';
import { ACTIVE_LINES, itemKindActive, ITEM_KIND_PASSIVE, itemKindWeapon, NO_CHARGE_LINE } from '../data/texts.ts';
import { BOSS_CARD_SKIP, BOSS_CARD_SUBTITLE, BOSS_DOWN_LINE, BOSS_DOWN_STAMP, bossPhaseLabel, HEART_LINE, LIFT_LINE, WIN_HINT, WIN_STAMP, WIN_TITLE, winReport } from '../data/texts.ts';
import { DEATH_STAMPS, DOORS_OPEN_LINES, DOWN_HINT, DOWN_STAMP, DOWN_TITLE, downReport, RESTOCK_LINE, TURBO_LINE } from '../data/texts.ts';
import { doorCells, isWallAt } from '../sim/room.ts';
import { pointInRect } from '../sim/vec.ts';
import { minimap } from '../sim/minimap.ts';
import { activeWarnings, addModifier, createWorld, LIFT_READY, PICKUP_DELAY, DT, enemyAltitude, FROST_FLAT, frostSlow, gunPivot, isRolling, sourceTelegraph, step, BODY_HEIGHT } from '../sim/world.ts';
import { dropTicket, giveActive, giveItem, placeChest, type DownCause, type Enemy, type SimEvent, type World } from '../sim/world.ts';
import type { Modifier } from '../data/types.ts';
import { Rng } from '../sim/rng.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { BulletColor } from '../sim/patterns.ts';
import { Sound } from './audio.ts';
import { Controls } from './input.ts';
import { keyWords, readScale, screenFlashAlpha, settings, SOFT_FLASH_TINT } from './settings.ts';
import { saveRun } from './save.ts';
import { addCanvasTexture, FONT, shadowTexture } from './textures.ts';
import { frameAxis } from './camera.ts';
import { formLayout, STAMP_SCALE, type FormRole } from './form.ts';
import { cardLayout, hudLayout, splitTitle, titleLines, stackFloat, TITLE_TOP, titleX, type Box, type HudLayout } from './hud.ts';
import { bulbLit, enemyFrame } from './enemyAnim.ts';

export const VIEW_W = 480;

/** The pieces of the description window (all HUD objects). */
interface ItemCard {
  plate: Phaser.GameObjects.Graphics;
  icon: Phaser.GameObjects.Image;
  name: Phaser.GameObjects.BitmapText;
  kind: Phaser.GameObjects.BitmapText;
  desc: Phaser.GameObjects.BitmapText;
  lines: Phaser.GameObjects.BitmapText[];
  /** Top and bottom of the window on screen while it is up (0 when it is not): the synergy plate goes next to it. */
  top: number;
  bottom: number;
}

/** Width of the description window, and the gap of its text column. */

/** How a pickup is drawn: its sprite and shadow, its name, and its price when it is for sale. */
interface PickupView {
  s: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  label?: Phaser.GameObjects.BitmapText;
  price?: Phaser.GameObjects.BitmapText;
  priceIcon?: Phaser.GameObjects.Image;
}
export const VIEW_H = 270;

const HERO_FEET_X = 17.5;
const HERO_FEET_Y = 36;
const HERO_W = 40;
const HERO_H = 41;
/** Grip of the hair dryer in its 18x11 sprite. */
const GUN_GRIP = { x: 6.5, y: 8.5 };
/** Frames of the toaster sheet: squeezed face when hit, and broken (slices gone, eyes crossed out). */
const HERO_HURT = 6;
const HERO_BROKEN = 7;
/** Seconds from going down to the slices popping out, and to the sick-leave report. */
const DOWN_POP = 0.35;
const DOWN_REPORT = 1.9;
/** Seconds the lift takes to sink with the toaster, and until the floor-done report shows. */
const WIN_SINK = 1.3;
const WIN_REPORT = 2.1;

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
  /** Damage numbers on the same target add up in one number instead of piling up. */
  key?: string;
  sum?: number;
  age?: number;
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
  /** The toaster went down the goods lift: the floor is done. */
  won: boolean;
  /** Text of the sick-leave report (or the floor-done one) once it is on screen (empty before). */
  report: string[];
}

/** Pixels of a rolled-up shutter still showing under the lintel (with its pilot light). */
const SHUTTER_ROLLED = 9;
/** Minimap: size of a room and distance between rooms (px on the 480 x 270 screen). */
const MAP_CELL_W = 9;
const MAP_CELL_H = 7;
const MAP_STEP_X = 11;
const MAP_STEP_Y = 9;
/** Minimap icons (5 px wide at most), drawn in the middle of the room. */
const MAP_ICONS: Partial<Record<string, { rows: string[]; color: number }>> = {
  // A skull: the boss.
  boss: { rows: ['.###.', '#.#.#', '#####', '.#.#.'], color: 0xe0453b },
  // A shopping trolley: the shop.
  shop: { rows: ['#....', '.####', '.###.', '.#.#.'], color: 0xf6c431 },
  // A gift box with its bow: the treasure.
  treasure: { rows: ['.#.#.', '#####', '#.#.#', '#####'], color: 0x5cc2c0 },
  // A question mark: the secret room (only once found).
  secret: { rows: ['##.', '..#', '.#.', '...', '.#.'], color: 0xd3849a },
};
/** Milliseconds of the fade between rooms. */
const ROOM_FADE_OUT = 110;
const ROOM_FADE_IN = 170;

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
  /** Bullet sprites put away to be used again (hundreds of bullets come and go every second). */
  private bulletPool: Phaser.GameObjects.Image[] = [];
  private pickupSprites = new Map<number, PickupView>();
  /** Name of the weapon in hand, over the ammo, for a moment after changing. */
  private weaponName!: Phaser.GameObjects.BitmapText;
  private weaponNameT = 0;
  /** One mark per weapon carried under the gun icon; the one in hand lit. */
  private arsenalMarks!: Phaser.GameObjects.Graphics;
  private swapHinted = false;
  /** Frost thrown by a boss: the ball and its shadow while it flies, then the patch on the floor. */
  private frostViews = new Map<number, { ball: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; patch: Phaser.GameObjects.Sprite | null }>();
  /** Pieces each enemy sprite breaks into, cut once per texture and frame. */
  private pieces = new Map<string, SpritePiece[]>();
  private couponIcon!: Phaser.GameObjects.Image;
  /** The passive items carried, in a row at the bottom left. */
  private itemIcons: Phaser.GameObjects.Image[] = [];
  /** An item's description under the banner (which shows its name) when it is picked up. */
  private itemDesc!: Phaser.GameObjects.BitmapText;
  /** A synergy that has just switched on: «Sinergia corporativa:», its name and its line, under the item's. */
  private synergyText!: Phaser.GameObjects.BitmapText;
  /** The dark plate behind it, so it reads over the floor. */
  private synergyPlate!: Phaser.GameObjects.Rectangle;
  /** Synergies switched on while the big description window was up: their plate comes after it. */
  private pendingSynergies: string[] = [];
  /** The active item in its slot (top left), its battery marks, and a shake when Q finds it flat. */
  private activeIcon!: Phaser.GameObjects.Image;
  private activeMarks!: Phaser.GameObjects.Graphics;
  private activeShake = 0;
  private activeFlash = 0;
  /** A cold blue-grey wash over the room while it is on hold. */
  private holdWash!: Phaser.GameObjects.Rectangle;
  private couponText!: Phaser.GameObjects.BitmapText;
  private ticketIcon!: Phaser.GameObjects.Image;
  private ticketText!: Phaser.GameObjects.BitmapText;
  private ticketPop = 0;
  private chestDrop = false;
  private chestSprites = new Map<number, { s: Phaser.GameObjects.Image; open: boolean; pop: number }>();
  private couponPop = 0;
  /** The shop till (only in the shop), what it is saying and for how long, and its refusal face. */
  private till: Phaser.GameObjects.Image | null = null;
  private bubble: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.BitmapText } | null = null;
  private bubbleT = 0;
  private tillNoT = 0;
  /** A line the till says once the one it is saying ends. */
  private tillNext: string | null = null;
  private banner!: Phaser.GameObjects.BitmapText;
  private bannerPlate!: Phaser.GameObjects.Graphics;
  /** The description window that opens for a while when an item or a weapon is picked up. */
  private card!: ItemCard;
  private shutters: Array<{ img: Phaser.GameObjects.Image; h: number }> = [];
  /** Red flash over the whole screen when hurt, and the heart that just broke. */
  private hurtFlash!: Phaser.GameObjects.Rectangle;
  private heartHit = -1;
  private heartHitT = 0;
  /** Seconds since the toaster went down (-1 while alive). */
  private downT = -1;
  private downPanel: Phaser.GameObjects.GameObject[] = [];
  /** The restart only listens once the buttons held while dying have been let go. */
  private downArmed = false;
  private downCause: DownCause | null = null;
  private popped = false;
  private report: string[] = [];
  /** Seconds left showing the squeezed face after a hit. */
  private hurtFace = 0;
  private particles: Particle[] = [];
  private floats: FloatText[] = [];
  private hearts: Phaser.GameObjects.Image[] = [];
  private ammoPips: Phaser.GameObjects.Image[] = [];
  private gunIcon!: Phaser.GameObjects.Image;
  private ammoText!: Phaser.GameObjects.BitmapText;
  private reloadBar!: Phaser.GameObjects.Graphics;
  /** Attack warnings: shrinking ring, aim dots and «!», redrawn every frame from the emitters. */
  private warn!: Phaser.GameObjects.Graphics;
  private warnings = 0;
  private charges = 0;
  /** The controls hint (one or two lines, bottom left) for the first seconds of a run. */
  private hint!: Phaser.GameObjects.BitmapText[];
  private hintText = '';
  private hintT = 9;
  /** The dark plates behind each corner of the HUD, so it reads over the busy shelves and floor. */
  private hudPlates!: Phaser.GameObjects.Graphics;
  /** The empty frame of the active item's slot (only once there is an active item). */
  private activeSlot!: Phaser.GameObjects.Image;
  private layout: HudLayout | null = null;
  private mapSize = { w: 0, h: 0 };
  private camX = 0;
  private camY = 0;
  /** The world to keep playing in after a restart (walking into another room), or null for a new run. */
  private carry: World | null = null;
  /** Fading out towards the next room. */
  private leaving = false;
  private mapG: Phaser.GameObjects.Graphics | null = null;
  /** Where the camera looks instead of the player (a boss's entrance), or null. */
  private camFocus: { x: number; y: number } | null = null;
  /** The boss entrance's letterbox bars and texts, removed when it ends. */
  private introParts: Phaser.GameObjects.GameObject[] = [];
  private introBars: Phaser.GameObjects.Rectangle[] = [];
  /** Everything on the HUD (hidden during a boss's entrance), and the room's name. */
  private hudObjs: Array<Phaser.GameObjects.Components.Visible> = [];
  private roomTitle: Phaser.GameObjects.Container | null = null;
  /** The boss's life bar at the bottom of the screen (null without a boss in the room). */
  private bossBar: BossBarView | null = null;
  /** Full-screen white flash (a boss changing phase or falling). */
  private whiteFlash!: Phaser.GameObjects.Rectangle;
  /** Seconds to the next blast on a boss that is coming apart. */
  private blastT = 0;
  /** The goods lift (once the boss has fallen) and the dark shaft it leaves when it goes down. */
  private liftView: { s: Phaser.GameObjects.Image; hole: Phaser.GameObjects.Rectangle; arrow: Phaser.GameObjects.Graphics; upT: number } | null = null;
  /** Seconds since the toaster stepped on the lift (-1 before). */
  private winT = -1;

  constructor() {
    super('game');
  }

  /** Bosses taken down in this run, and whether its end is already in the record (src/render/save.ts). */
  private runBosses: string[] = [];
  private runRecorded = false;

  /** Started from the title screen's practice option: that room instead of a floor (kept on restart). */
  private startSala: string | null = null;

  init(data: { sala?: string } | undefined): void {
    this.startSala = data?.sala ?? null;
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
    this.downCause = null;
    this.popped = false;
    this.report = [];
    this.hurtFace = 0;
    this.camFocus = null;
    this.introParts = [];
    this.introBars = [];
    this.pendingSynergies = [];
    this.hudObjs = [];
    this.bossBar = null;
    this.blastT = 0;
    this.liftView = null;
    this.winT = -1;
    this.dummySprites = new Map();
    this.enemySprites = new Map();
    this.bulletSprites = new Map();
    this.bulletPool = [];
    this.pickupSprites = new Map();
    this.chestSprites = new Map();
    this.ticketPop = 0;
    this.till = null;
    this.bubble = null;
    this.bubbleT = 0;
    this.tillNoT = 0;
    this.tillNext = null;
    this.frostViews = new Map();
    this.particles = [];
    this.mapG = null;
    this.floats = [];
    this.hearts = [];
    this.ammoPips = [];
    const params = new URLSearchParams(location.search);
    const carried = this.carry;
    this.carry = null;
    if (!carried) {
      // A new run: nothing beaten yet, nothing written in the record.
      this.runBosses = [];
      this.runRecorded = false;
    }
    // ?planta=2: the same rooms with the look of floor 2 (Informática) while it has no rooms of its own.
    const level = Math.max(1, Math.min(2, Math.trunc(Number(params.get('planta') ?? 1)) || 1));
    if (carried) {
      // Walked through a door: same run, next room. The controls hint was read already.
      this.world = carried;
      this.hintT = 0;
    } else if (this.startSala && !params.get('sala')) {
      this.world = createWorld({ seed: `pruebas-${Date.now().toString(36)}`, room: this.startSala, level });
    } else if (params.get('sala')) {
      // ?sala=<id>&profundidad=<n>: one room template, its slots filled for that depth (the test
      // room is ?sala=sala-pruebas).
      this.world = createWorld({ seed: params.get('semilla') ?? params.get('sala')!, room: params.get('sala')!, depth: Number(params.get('profundidad') ?? 3), level });
    } else {
      // A whole floor: ?semilla=<s> always gives the same one; without it, a new one each unit.
      this.world = createWorld({ seed: params.get('semilla') ?? `planta-${Date.now().toString(36)}`, floor: true, level });
    }
    const seed = this.world.floor ? `${this.world.seed}:${this.world.floor.current}` : this.world.seed;
    this.controls = new Controls(this);
    const unlock = (): void => this.sound2.unlock();
    this.input.on('pointerdown', unlock);
    this.input.keyboard?.on('keydown', unlock);
    // Asking for a new unit: a fresh press of R or a click once the report is up (a pad's
    // reload button is polled in syncView).
    this.input.keyboard?.on('keydown-R', () => this.newUnit());
    // Pause: Esc or P (Start on the pad, see update); also when the tab is hidden.
    // With the report on screen, Esc goes back to the title instead.
    this.input.keyboard?.on('keydown-ESC', () => (this.canAskNewUnit() ? this.scene.start('title') : this.openPause()));
    this.input.keyboard?.on('keydown-P', () => this.openPause());
    const onHidden = (): void => this.openPause();
    this.game.events.on(Phaser.Core.Events.HIDDEN, onHidden);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.HIDDEN, onHidden));
    this.sound2.setVolume(settings().volume / 10);
    this.sound2.setMusicVolume(settings().music / 10);
    // The warehouse muzak, or the boss's song while the boss is there (it carries on between rooms).
    const w0 = this.world;
    this.sound2.playMusic(w0.over || w0.won ? null : w0.room.kind === 'boss' && w0.enemies.length > 0 ? 'jefa' : 'planta');
    this.input.on('pointerdown', () => this.newUnit());

    const room = this.world.room;
    // Open doors are floor in the simulation; the painter wants the wall around the opening.
    const tiles = room.tiles.slice();
    for (const d of room.doors) for (const c of doorCells(room.cols, room.rows, d.dir)) tiles[c.r * room.cols + c.c] = 1;
    const art = paintRoom({ ...room, tiles, level: this.world.level }, seed);
    addCanvasTexture(this, 'sala', art.canvas);
    this.add.image(0, 0, 'sala').setOrigin(0, 0).setDepth(-100000);
    this.makeShutters(art.doors);

    for (const pr of room.props) {
      const key = pr.def.id;
      // Chests change (they open), so drawChests keeps them; here only their shadow.
      if (pr.chest) {
        this.add.image(pr.x, pr.y + 1, shadowTexture(this, 10, 3)).setDepth(-50000);
        continue;
      }
      if (key === 'autocobro') {
        // The shop till: drawShop changes its face.
        this.add.image(pr.x, pr.y + 1, shadowTexture(this, 12, 3)).setDepth(-50000);
        this.till = this.add.image(pr.x, pr.y, key, 0).setOrigin(0.5, 1).setDepth(pr.y);
        continue;
      }
      const look = this.levelKey(key);
      const tex = this.textures.get(look).getSourceImage();
      this.add.image(pr.x, pr.y + 1, shadowTexture(this, Math.max(6, Math.floor(tex.width / 2) - 3), 3)).setDepth(-50000);
      this.add.image(pr.x, pr.y, look).setOrigin(0.5, 1).setDepth(pr.y);
    }
    if (room.kind === 'shop') {
      // A display stand under every shelf, and the till says hello.
      for (const sl of room.slots) if (sl.kind === 'shelf') this.add.image(sl.x, sl.y + 6, 'expositor').setOrigin(0.5, 1).setDepth(sl.y - 1);
      this.time.delayedCall(700, () => this.tillSay(this.fx.pick(SHOPKEEPER.greet)));
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
    this.hudPlates = this.hud(this.add.graphics()).setDepth(94900);
    this.gunIcon = this.hud(this.add.image(0, VIEW_H - 15, 'arma-secador').setOrigin(0, 0));
    this.syncHudSlots();
    this.couponIcon = this.hud(this.add.image(7, 19, 'cupon', 0).setOrigin(0, 0));
    this.couponText = this.hud(this.add.bitmapText(21, 20, FONT, '0', 8));
    this.couponText.setTint(0xf6c431);
    this.ticketIcon = this.hud(this.add.image(44, 18, 'ticket', 0).setOrigin(0, 0));
    this.ticketText = this.hud(this.add.bitmapText(56, 20, FONT, '0', 8));
    this.ticketText.setTint(0xf4f1e8);
    this.activeSlot = this.hud(this.add.image(7, 31, 'ranura').setOrigin(0, 0)).setAlpha(0.85).setVisible(false);
    this.activeIcon = this.hud(this.add.image(9, 33, 'objeto-caja').setOrigin(0, 0)).setVisible(false);
    this.activeMarks = this.hud(this.add.graphics());
    this.holdWash = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x9fb4e0, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(88000).setAlpha(0);
    this.hurtFlash = this.hud(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xe0453b, 1).setOrigin(0, 0)).setAlpha(0).setDepth(89000);
    this.banner = this.hud(this.add.bitmapText(VIEW_W / 2, 44, FONT, '', 8).setOrigin(0.5, 0).setCenterAlign());
    // Its plate, like the HUD's, so it reads over the shelves (drawn each frame; see updateHud).
    this.bannerPlate = this.hud(this.add.graphics());
    this.bannerPlate.setDepth(this.banner.depth - 1);
    this.banner.setTint(0xf6c431).setAlpha(0);
    this.itemDesc = this.hud(this.add.bitmapText(VIEW_W / 2, 57, FONT, '', 8).setOrigin(0.5, 0).setCenterAlign().setMaxWidth(300)).setTint(0xd6cdb2).setAlpha(0);
    this.card = {
      plate: this.hud(this.add.graphics()).setAlpha(0),
      icon: this.hud(this.add.image(0, 0, 'objeto-pila').setOrigin(0.5, 0.5).setScale(2)).setAlpha(0),
      name: this.hud(this.add.bitmapText(0, 0, FONT, '', 8)).setTint(0xf6c431).setAlpha(0),
      kind: this.hud(this.add.bitmapText(0, 0, FONT, '', 8)).setTint(0x858ea8).setAlpha(0),
      desc: this.hud(this.add.bitmapText(0, 0, FONT, '', 8)).setTint(0xd6cdb2).setAlpha(0),
      lines: Array.from({ length: 5 }, () => this.hud(this.add.bitmapText(0, 0, FONT, '', 8)).setAlpha(0)),
      top: 0,
      bottom: 0,
    };
    this.synergyPlate = this.hud(this.add.rectangle(VIEW_W / 2, 80, 10, 10, 0x101420, 0.82).setOrigin(0.5, 0).setStrokeStyle(1, 0x69dbd8, 0.9)).setAlpha(0);
    this.synergyText = this.hud(this.add.bitmapText(VIEW_W / 2, 84, FONT, '', 8).setOrigin(0.5, 0).setCenterAlign()).setTint(0x69dbd8).setAlpha(0);
    this.itemIcons = [];
    this.ammoText = this.hud(this.add.bitmapText(VIEW_W - 8, VIEW_H - 26, FONT, '', 8).setOrigin(1, 0));
    this.weaponName = this.hud(this.add.bitmapText(VIEW_W - 8, VIEW_H - 37, FONT, '', 8).setOrigin(1, 0)).setTint(0xf6c431).setAlpha(0);
    this.arsenalMarks = this.hud(this.add.graphics());
    this.refreshHint();
    this.hint = [0, 1].map(() => this.hud(this.add.bitmapText(8, VIEW_H - 16, FONT, '', 8)).setTint(0xd6cdb2).setAlpha(this.hintT > 0 ? 1 : 0));
    this.mapSize = { w: 0, h: 0 };
    if (this.world.floor) this.drawMinimap();
    // The room's name, along the top on its own plate: what it is in gold, the joke in brackets quieter.
    this.layout = this.computeLayout();
    const { main, sub } = splitTitle(fontText(room.name));
    const scale = readScale(settings());
    const span = this.layout.titleSpan;
    const tLines = titleLines(main, sub, span.right - span.left - 8, scale);
    const lineH = FONT_LINE * scale;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const tw = Math.max(...tLines.map((t) => t.w)) + 8;
    const th = tLines.length * lineH + 3;
    const plate = this.add.graphics();
    plate.fillStyle(0x0e0c16, 0.78).fillRect(0, 0, tw, th);
    plate.lineStyle(1, 0x3a3f5c, 1).strokeRect(0.5, 0.5, tw - 1, th - 1);
    plate.fillStyle(0xf6c431, 1).fillRect(1, th - 1, tw - 2, 1);
    parts.push(plate);
    tLines.forEach((t, i) => {
      const y = 3 + i * lineH;
      if (t.main) parts.push(this.add.bitmapText(4, y, FONT, t.main, 8 * scale).setTint(0xf6c431));
      if (t.sub) parts.push(this.add.bitmapText(4 + (t.main ? (textWidth(t.main) + 5) * scale : 0), y, FONT, t.sub, 8 * scale).setTint(0xb9b3a3));
    });
    const title = this.hud(this.add.container(titleX(tw, span), TITLE_TOP, parts));
    // A boss's entrance has its own name card, with the room's name in its top bar.
    this.roomTitle = title;
    if (this.world.intro) title.setAlpha(0);
    else this.tweens.add({ targets: title, alpha: 0, delay: 2500, duration: 800 });
    this.reloadBar = this.add.graphics().setDepth(80000);
    this.warn = this.add.graphics().setDepth(84000);
    this.crosshair = this.hud(this.add.image(0, 0, 'mira')).setDepth(100000);
    this.whiteFlash = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xffffff, 1).setOrigin(0, 0).setScrollFactor(0).setDepth(97000).setAlpha(0);
    const boss = this.world.enemies.find((en) => en.def.boss);
    if (boss) {
      this.makeBossBar(boss);
      // The controls hint would run under the bar.
      this.hintT = 0;
      for (const h of this.hint) h.setAlpha(0);
    }

    const cam = this.cameras.main;
    cam.setBounds(0, 0, room.w, room.h);
    cam.setRoundPixels(true);
    this.camX = this.world.player.x - VIEW_W / 2;
    this.camY = this.world.player.y - VIEW_H / 2;
    cam.setScroll(Math.round(this.camX), Math.round(this.camY));
    this.leaving = false;
    if (carried) cam.fadeIn(ROOM_FADE_IN, 14, 12, 22);

    if (this.world.intro) this.startBossIntro(this.world.intro.boss);
    this.syncView(0);
    type TestHooks = {
      state: () => GameStateForTests;
      scene: GameScene;
      addModifier: (m: Modifier) => void;
      giveItem: (id: string) => void;
      giveActive: (id: string) => void;
      placeChest: (x: number, y: number) => void;
      dropTicket: (x: number, y: number) => void;
    };
    (window as unknown as { __GE__: TestHooks }).__GE__ = {
      scene: this,
      state: () => this.testState(),
      // Tests (and curious humans in the console) can hand the toaster any modifier.
      addModifier: (m: Modifier) => addModifier(this.world, m),
      // ...or any passive item (src/data/items.ts).
      giveItem: (id: string) => giveItem(this.world, id),
      giveActive: (id: string) => giveActive(this.world, id),
      // ...or a chest, or a ticket, wherever.
      placeChest: (x: number, y: number) => void placeChest(this.world, x, y),
      dropTicket: (x: number, y: number) => dropTicket(this.world, x, y),
    };
    // Back in the boss room after walking out: the lift is still there, waiting.
    const lift = this.world.lift;
    if (lift) {
      this.raiseLift(lift.x, lift.y, true);
      if (lift.t >= LIFT_READY) this.liftView!.s.setFrame(1);
    }
  }

  private makeEnemyView(en: Enemy): EnemyView {
    const flying = enemyAltitude(en) > 0;
    const big = en.def.footRadius > 10;
    const shadow = this.add.image(en.x, en.y, flying ? shadowTexture(this, 4, 2) : big ? shadowTexture(this, en.def.footRadius + 8, 5) : shadowTexture(this, 10, 3)).setDepth(-50000);
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
    this.shake(big ? 170 : 90, big ? 0.009 : 0.005, true);
    this.sound2.play('desmontar', { detune: big ? this.fx.range(-150, 100) : 500, volume: big ? 1 : 0.6 });
    const cx = e.x;
    const cy = e.y - e.alt;
    if (v) {
      const s = v.s;
      // A white silhouette for a couple of frames where it was.
      const ghost = this.add.image(s.x, s.y, s.texture.key, s.frame.name).setOrigin(s.originX, s.originY).setScale(s.scaleX, 1).setDepth(s.depth);
      this.whiteOut(ghost);
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
      this.floatText(cx, cy - 30, fontText(stamp), 0xe0453b, undefined, -18, 1.1);
    }
  }

  /**
   * The sick-leave report (parte de baja): unit, cause, room, service life and the
   * manufacturer's advice, on a dark form that drops in; then the red stamp slams onto it.
   */
  private showDownPanel(): void {
    const w = this.world;
    const cause = this.downCause ?? { by: 'desconocido', how: 'contact' as const };
    const lines = downReport(
      { by: cause.by, how: cause.how, room: w.room.name, seconds: Math.round(w.tick / 60), kills: w.kills, coupons: w.player.coupons },
      (n) => this.fx.int(0, n - 1),
    );
    this.showForm(lines, { title: DOWN_TITLE, color: 0xe0453b, light: 0xffd0c8, stamp: DOWN_STAMP, hint: DOWN_HINT });
  }

  /**
   * The floor is done: «Incidencia resuelta», the same kind of form as the sick-leave report, in
   * Fridge cyan, with «Planta superada» stamped on it.
   */
  private showWinPanel(): void {
    const w = this.world;
    const lines = winReport({ room: w.room.name, seconds: Math.round(w.tick / 60), kills: w.kills, coupons: w.player.coupons }, (n) => this.fx.int(0, n - 1));
    this.showForm(lines, { title: WIN_TITLE, color: 0x3a9ea6, light: 0xb6f1f0, stamp: WIN_STAMP, hint: WIN_HINT });
  }

  /** A report form that drops in, with its lines, a reference number, a hint and a stamp slammed on it. */
  private showForm(lines: { label: string; text: string }[], look: { title: string; color: number; light: number; stamp: string; hint: string }): void {
    const w = this.world;
    const ref = `Exp. ${String(1000 + ((w.tick * 7919) % 9000)).padStart(4, '0')}`;
    const hintText = `${look.hint} · ${REPORT_MENU_HINT}`;
    const F = formLayout(lines, look.title, ref, hintText, readScale(settings()), look.stamp);
    const parts: Array<Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.ScrollFactor> = [];
    const add = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.ScrollFactor>(o: T): T => {
      this.hud(o).setDepth(96000 + parts.length);
      parts.push(o);
      return o;
    };
    add(this.add.rectangle(F.x, F.y, F.w, F.h, 0x0e0c16, 0.93).setOrigin(0, 0)).setStrokeStyle(1, look.color);
    // A form: title bar, ruled lines, perforated edge.
    add(this.add.rectangle(F.x + 1, F.y + 1, F.w - 2, F.barH, look.color, 1).setOrigin(0, 0));
    const tints: Record<FormRole, number> = {
      title: 0xf4f1e8,
      ref: look.light,
      label: 0x858ea8,
      value: 0xd6cdb2,
      aside: 0x858ea8,
      gearLabel: 0x858ea8,
      adviceLabel: 0xf6c431,
      advice: 0xf4f1e8,
      hint: 0xf6c431,
    };
    let hint: Phaser.GameObjects.BitmapText | null = null;
    for (const t of F.texts) {
      const o = add(this.add.bitmapText(t.x, t.y, FONT, fontText(t.text), F.size)).setTint(tints[t.role]);
      if (t.role === 'hint') hint = o;
    }
    const g = add(this.add.graphics());
    for (let x = F.x + 4; x < F.x + F.w - 4; x += 4) g.fillStyle(0x3a3f5c, 1).fillRect(x, F.rule, 2, 1);
    // What it was carrying: weapons, then items, then the active one (as many as fit; the rest, «+N»).
    const p = w.player;
    const gear = [...p.arsenal.map((ws) => ws.base.look.sprite), ...p.items.map((id) => ITEMS[id]?.sprite ?? 'objeto-caja')];
    if (p.active) gear.push(ACTIVE_ITEMS[p.active.id]?.sprite ?? 'objeto-caja');
    let gx = F.gear.x;
    for (const [i, key] of gear.entries()) {
      if (gx + 16 > F.gear.right) {
        add(this.add.bitmapText(gx, F.gear.base - 11, FONT, `+${gear.length - i}`, 8)).setTint(0x858ea8);
        break;
      }
      const img = add(this.add.image(gx, F.gear.base, key).setOrigin(0, 1));
      gx += Math.max(17, img.width + 2);
    }
    this.report = lines.map((ln) => (ln.label ? `${ln.label}: ${ln.text}` : ln.text));
    if (hint) this.tweens.add({ targets: hint, alpha: 0.35, yoyo: true, repeat: -1, duration: 450, delay: 900 });
    // The whole form drops in from above.
    for (const o of parts) {
      const ty = o.y;
      o.y = ty - 40;
      this.tweens.add({ targets: o, y: ty, duration: 220, ease: 'Back.easeOut' });
    }
    // The stamp slams down a moment later.
    const stampColor = look.color === 0xe0453b ? 0xe0453b : 0x69dbd8;
    const stamp = add(this.add.bitmapText(F.stamp.x, F.stamp.y, FONT, fontText(look.stamp), 8).setOrigin(0.5, 0.5)).setTint(stampColor);
    const frame = add(this.add.rectangle(stamp.x, stamp.y, textWidth(look.stamp) + 8, 13).setStrokeStyle(1, stampColor));
    for (const o of [stamp, frame]) {
      o.setRotation(-0.22).setScale(5).setAlpha(0);
      this.tweens.add({
        targets: o,
        scale: STAMP_SCALE,
        alpha: 0.9,
        delay: 520,
        duration: 130,
        ease: 'Quad.easeIn',
        onComplete: () => {
          // With big text it may land on a line: it has its moment, then steps back.
          if (F.stampFades) this.tweens.add({ targets: o, alpha: 0.3, delay: 1400, duration: 500 });
          if (o !== stamp) return;
          this.sound2.play('sello');
          this.shake(120, 0.006, true);
        },
      });
    }
    this.report.push(look.stamp);
    this.downPanel = parts;
  }

  /**
   * The toaster comes apart: both slices pop out of the slots, the lever spring shoots off with
   * a «boing», the knob and screws scatter, and the empty body tips over.
   */
  private popToaster(): void {
    const p = this.world.player;
    const f = p.facing;
    this.popped = true;
    this.hitstop = 0.06;
    this.shake(160, 0.01, true);
    this.sound2.play('saltar');
    this.time.delayedCall(90, () => this.sound2.play('muelle'));
    this.flashHero = 0.05;
    // Slots are 2 and 6 px right of the feet (facing right), 30 px up.
    const flung = (frame: number, dx: number, z: number, vx: number, vz: number, spin: number, life = 99): void => {
      this.particles.push({
        s: this.add.image(p.x + dx * f, p.y + this.fx.range(-2, 3), 'despiece', frame).setFlipX(f < 0),
        vx,
        vy: this.fx.range(-8, 14),
        z,
        vz,
        life,
        maxLife: life,
        gravity: true,
        spin,
        fade: false,
        hw: 4,
        hh: 4,
      });
    };
    flung(0, -1, 30, f * this.fx.range(-40, -15), this.fx.range(130, 155), this.fx.range(-10, -5));
    flung(1, 5, 29, f * this.fx.range(25, 55), this.fx.range(115, 140), this.fx.range(6, 12));
    flung(2, -6, 14, -f * this.fx.range(50, 80), this.fx.range(120, 150), this.fx.range(-20, 20));
    flung(3, -8, 16, -f * this.fx.range(20, 45), this.fx.range(90, 120), this.fx.range(-14, 14));
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        s: this.add.image(p.x + this.fx.range(-6, 6), p.y + this.fx.range(-2, 2), 'chatarra', this.fx.int(0, 3)),
        vx: this.fx.range(-80, 80),
        vy: this.fx.range(-20, 20),
        z: this.fx.range(6, 18),
        vz: this.fx.range(70, 130),
        life: 99,
        maxLife: 99,
        gravity: true,
        spin: this.fx.range(-16, 16),
        fade: false,
        hw: 3,
        hh: 3,
      });
    }
    for (let i = 0; i < 6; i++) this.puff(p.x + this.fx.range(-8, 8) + 2 * f, p.y - 26 + this.fx.range(-4, 4), this.fx.range(0.5, 0.9));
    for (let i = 0; i < 12; i++) this.spark(p.x + 2 * f, p.y - 26, this.fx.range(-Math.PI, 0), this.fx.range(60, 150), this.fx.int(0, 3));
  }

  /** Walked through a door: a quick fade to black, then the scene rebuilds itself around the next room. */
  private leaveRoom(): void {
    this.leaving = true;
    this.acc = 0;
    this.sound2.play('puerta');
    this.cameras.main.fadeOut(ROOM_FADE_OUT, 14, 12, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.carry = this.world;
      this.scene.restart();
    });
  }

  /**
   * The run is over: it goes into the player's record (only runs on a floor; the practice room
   * and the single rooms of the tests do not count).
   */
  private recordRun(outcome: 'down' | 'floor'): void {
    const w = this.world;
    if (this.runRecorded || !w.floor) return;
    this.runRecorded = true;
    const p = w.player;
    saveRun({
      character: p.base.def.id,
      outcome,
      seconds: w.tick * DT,
      kills: w.kills,
      coupons: p.coupons,
      bosses: this.runBosses,
      ...(outcome === 'down' && this.downCause ? { cause: this.downCause } : {}),
      items: p.items,
      ...(p.active ? { active: p.active.id } : {}),
      weapons: p.arsenal.map((ws) => ws.base.id),
    });
  }

  /** Freezes the game and opens the pause menu over it (src/render/PauseScene.ts). */
  openPause(): void {
    if (this.leaving || !this.scene.isActive()) return;
    this.scene.launch('pause');
    this.scene.pause();
  }

  /** A camera shake, unless the player turned them off in the options. */
  private shake(ms: number, intensity: number, force?: boolean): void {
    if (settings().shake) this.cameras.main.shake(ms, intensity, force);
  }

  private canAskNewUnit(): boolean {
    if (this.world.won) return this.downPanel.length > 0 && this.winT > WIN_REPORT + 0.5;
    return this.world.over && this.downPanel.length > 0 && this.downT > DOWN_REPORT + 0.5;
  }

  private newUnit(): void {
    if (this.canAskNewUnit()) this.scene.restart();
  }

  /**
   * A boss's entrance (World.intro): black bars close in, the camera glides to the boss, its
   * name card slams in at the bottom with a groan and its motto follows. The simulation holds
   * everything still meanwhile; firing again skips it (BOSS_INTRO_SKIP).
   */
  private startBossIntro(bossId: number): void {
    const boss = this.world.enemies.find((e) => e.id === bossId);
    const card = boss?.def.boss;
    if (!boss || !card) return;
    this.camFocus = { x: boss.x, y: boss.y - 40 };
    for (const o of this.hudObjs) o.setVisible(false);
    const BAR = 30;
    for (const top of [true, false]) {
      const bar = this.hud(this.add.rectangle(0, top ? -BAR : VIEW_H, VIEW_W, BAR, 0x0e0c16, 1).setOrigin(0, 0)).setDepth(96000);
      this.tweens.add({ targets: bar, y: top ? 0 : VIEW_H - BAR, duration: 260, ease: 'Quad.easeOut' });
      this.introBars.push(bar);
    }
    // The room's name goes in the top bar (instead of over the boss's head once the fight starts).
    const scale = readScale(settings());
    const where = this.hud(this.add.bitmapText(VIEW_W / 2, Math.round((BAR - 8 * scale) / 2) + 1, FONT, fontText(this.world.room.name), 8 * scale).setOrigin(0.5, 0)).setDepth(96001);
    where.setTint(0x858ea8).setAlpha(0);
    this.introParts.push(where);
    this.tweens.add({ targets: where, alpha: 1, delay: 300, duration: 200 });
    // With big text the small lines go to double size (the name already is) and the motto may
    // take two lines; the card grows upwards from the bottom bar.
    const x = 22;
    const small = 8 * scale;
    const mottoText = wrapLines(fontText(`«${card.motto}»`), VIEW_W - 2 * x, scale).join('\n');
    const mottoH = mottoText.split('\n').length * small;
    const y = VIEW_H - BAR - 1 - mottoH - 29 - small;
    const sub = this.hud(this.add.bitmapText(x, y, FONT, fontText(BOSS_CARD_SUBTITLE), small)).setDepth(96001);
    sub.setTint(0x858ea8).setAlpha(0);
    const ny = y + small + 3;
    const name = this.hud(this.add.bitmapText(x, ny, FONT, fontText(card.title), 16)).setDepth(96001);
    name.setTint(0xf6c431).setAlpha(0);
    const line = this.hud(this.add.rectangle(x, ny + 21, 1, 2, 0xe0453b, 1).setOrigin(0, 0)).setDepth(96001);
    line.setAlpha(0);
    const motto = this.hud(this.add.bitmapText(x, ny + 26, FONT, mottoText, small)).setDepth(96001);
    motto.setTint(0xd6cdb2).setAlpha(0);
    const skip = this.hud(this.add.bitmapText(VIEW_W - 8, VIEW_H - 18, FONT, fontText(BOSS_CARD_SKIP), 8).setOrigin(1, 0)).setDepth(96001);
    skip.setTint(0x5a627c).setAlpha(0);
    this.introParts.push(sub, name, line, motto, skip);
    this.tweens.add({ targets: sub, alpha: 1, delay: 500, duration: 200 });
    // The name slams in from a bigger size, with a shake and the groan.
    this.time.delayedCall(800, () => {
      if (!this.world.intro) return;
      name.setAlpha(1).setScale(1.6);
      this.tweens.add({ targets: name, scale: 1, duration: 140, ease: 'Quad.easeIn' });
      this.time.delayedCall(140, () => {
        this.shake(180, 0.008, true);
        this.sound2.play('jefe');
        line.setAlpha(1);
        this.tweens.add({ targets: line, width: name.width + 4, duration: 420, ease: 'Quad.easeOut' });
        // Cold breath out of the fridge.
        for (let i = 0; i < 14; i++) this.puff(boss.x + this.fx.range(-24, 24), boss.y - this.fx.range(0, 8), 0.6);
      });
    });
    this.time.delayedCall(1500, () => {
      if (!this.world.intro) return;
      this.sound2.play('zumbido');
      this.tweens.add({ targets: motto, alpha: 1, duration: 350 });
      this.tweens.add({ targets: skip, alpha: 1, duration: 350 });
    });
  }

  /** The boss's life bar, bottom centre: its name over a red bar with a notch where each phase starts. */
  private makeBossBar(boss: Enemy): void {
    const name = this.hud(this.add.bitmapText(VIEW_W / 2, BOSS_BAR_Y - 11, FONT, fontText(boss.def.name), 8).setOrigin(0.5, 0)).setDepth(93001);
    name.setTint(0xd6cdb2);
    const g = this.hud(this.add.graphics()).setDepth(93000);
    // It fills up when the fight starts (after the entrance); straight away if there is none.
    this.bossBar = { boss: boss.id, name, g, trail: 0, fill: 0, flash: 0, alpha: 1 };
    if (!this.world.intro) this.bossBar.fill = this.bossBar.trail = 1 - boss.damageTaken / boss.def.hp;
  }

  private drawBossBar(dt: number): void {
    const bar = this.bossBar;
    if (!bar) return;
    const boss = this.world.enemies.find((en) => en.id === bar.boss);
    const life = boss ? Math.max(0, 1 - boss.damageTaken / boss.def.hp) : 0;
    if (this.world.intro) {
      bar.fill = bar.trail = 0;
    } else if (bar.fill < life && bar.trail <= bar.fill) {
      // Filling up at the start of the fight, with a rising tick.
      bar.fill = Math.min(life, bar.fill + dt * 1.4);
      bar.trail = bar.fill;
    } else {
      bar.fill = life;
      // The lost chunk stays white for a moment, then drains.
      if (bar.trail > life) bar.trail = Math.max(life, bar.trail - dt * (boss?.hitT ? 0 : 0.5));
      else bar.trail = life;
    }
    bar.flash = Math.max(0, bar.flash - dt);
    if (!boss) bar.alpha = Math.max(0, bar.alpha - dt * 0.8);
    const x = Math.round((VIEW_W - BOSS_BAR_W) / 2);
    const y = BOSS_BAR_Y;
    const g = bar.g;
    g.clear().setAlpha(bar.alpha);
    bar.name.setAlpha(bar.alpha);
    g.fillStyle(0x0e0c16, 0.9).fillRect(x - 2, y - 2, BOSS_BAR_W + 4, BOSS_BAR_H + 4);
    g.lineStyle(1, 0x3a3f5c, 1).strokeRect(x - 1.5, y - 1.5, BOSS_BAR_W + 3, BOSS_BAR_H + 3);
    g.fillStyle(0x2a1620, 1).fillRect(x, y, BOSS_BAR_W, BOSS_BAR_H);
    const tw = Math.round(bar.trail * BOSS_BAR_W);
    const fw = Math.round(bar.fill * BOSS_BAR_W);
    if (tw > fw) g.fillStyle(0xf4f1e8, 1).fillRect(x + fw, y, tw - fw, BOSS_BAR_H);
    const flashOn = bar.flash > 0 && Math.floor(bar.flash * 16) % 2 === 0;
    const dying = boss?.state === 'dying';
    g.fillStyle(flashOn ? 0xf4f1e8 : 0xe0453b, 1).fillRect(x, y, fw, BOSS_BAR_H);
    g.fillStyle(flashOn ? 0xffffff : 0xff7a6a, 1).fillRect(x, y, fw, 1);
    g.fillStyle(flashOn ? 0xd6cdb2 : 0x9c2a2a, 1).fillRect(x, y + BOSS_BAR_H - 1, fw, 1);
    // A notch where each later phase starts.
    const brain = boss?.def.brain ?? ENEMIES['nevera-suprema']?.brain;
    if (brain?.kind === 'boss' && !dying) {
      for (const ph of brain.phases.slice(1)) {
        const nx = x + Math.round(ph.from * BOSS_BAR_W);
        g.fillStyle(0x0e0c16, 1).fillRect(nx, y - 2, 1, BOSS_BAR_H + 4);
        g.fillStyle(0xd6cdb2, 1).fillRect(nx, y - 3, 1, 2);
      }
    }
  }

  /**
   * The goods lift rises out of the floor where the boss fell, with dust and a rumble; `already`
   * (back in the room after walking out) puts it there, up and silent.
   */
  private raiseLift(x: number, y: number, already = false): void {
    this.liftView?.s.destroy();
    this.liftView?.hole.destroy();
    this.liftView?.arrow.destroy();
    const hole = this.add.rectangle(Math.round(x) - 20, Math.round(y) - 10, 40, 23, 0x0e0c16, 1).setOrigin(0, 0).setDepth(-60001).setAlpha(0);
    const s = this.add.image(Math.round(x), Math.round(y), 'montacargas', 0).setOrigin(0.5, 20 / 34).setDepth(-60000);
    const arrow = this.add.graphics().setDepth(85000);
    this.liftView = { s, hole, arrow, upT: already ? 1 : 0 };
    if (already) return;
    this.sound2.play('ascensor', { detune: 300 });
    this.time.delayedCall(300, () => this.sound2.play('persiana', { volume: 0.6 }));
    for (let i = 0; i < 12; i++) this.puff(x + this.fx.range(-24, 24), y + this.fx.range(-10, 12), this.fx.range(0.5, 0.8));
  }

  /** The lift rising, its arrow once ready, and the lift sinking with the toaster on it. */
  private drawLift(dt: number): void {
    const v = this.liftView;
    const l = this.world.lift;
    if (!v || !l) return;
    const W = 44;
    const H = 34;
    v.upT += dt;
    let d = Math.round((1 - Math.min(1, v.upT / 0.6)) * 22);
    if (this.winT >= 0) {
      const k = Math.min(1, this.winT / WIN_SINK);
      d = Math.round(k * k * 34);
      v.hole.setAlpha(1);
    }
    v.s.setPosition(Math.round(l.x), Math.round(l.y) + d);
    v.s.setCrop(0, 0, W, Math.max(0, H - d));
    v.s.setVisible(d < H);
    v.arrow.clear();
    if (l.t >= LIFT_READY && this.winT < 0) {
      // A bouncing yellow arrow over it: step on here.
      const bob = Math.round(Math.abs(Math.sin(this.time.now / 180)) * 4);
      const ax = Math.round(l.x);
      const ay = Math.round(l.y) - 30 - bob;
      v.arrow.fillStyle(0x0e0c16, 1).fillTriangle(ax - 6, ay - 1, ax + 6, ay - 1, ax, ay + 7);
      v.arrow.fillStyle(0xf6c431, 1).fillTriangle(ax - 4, ay, ax + 4, ay, ax, ay + 5);
    }
  }

  /** A hit flash: solid white, or a light warm tint with «Destellos suaves» on. */
  private whiteOut(s: Phaser.GameObjects.Image): void {
    if (settings().flashes) s.setTintFill(0xffffff);
    else s.setTint(SOFT_FLASH_TINT);
  }

  /** Whether a warning shows this frame: blinking faster and faster, or steady with soft flashes. */
  private warnOn(warnK: number): boolean {
    return settings().flashes ? blinkOn(warnK) : true;
  }

  /** The warning on a sprite: solid yellow (white at the end); with soft flashes, a yellow tint. */
  private warnFill(s: Phaser.GameObjects.Image, warnK: number): void {
    if (settings().flashes) s.setTintFill(this.warnColor(warnK));
    else s.setTint(this.warnColor(warnK));
  }

  /** Telegraph colour: yellow, turning white at the end (only yellow with soft flashes). */
  private warnColor(warnK: number): number {
    return warnK > 0.75 && settings().flashes ? 0xffffff : 0xf6c431;
  }

  /** The screen goes white and fades back (a boss changing phase or falling). */
  private flashWhite(alpha: number, ms: number): void {
    this.tweens.killTweensOf(this.whiteFlash);
    this.whiteFlash.setAlpha(screenFlashAlpha(alpha, settings().flashes));
    this.tweens.add({ targets: this.whiteFlash, alpha: 0, duration: ms, ease: 'Quad.easeOut' });
  }

  /**
   * The phase card over the boss's life bar: a dark band slides in with «Fase n · …» and the
   * phase's name, big, in its colour; it stays while the boss stops (BOSS_PHASE_BREAK).
   */
  private showPhaseCard(phase: number, title: string): void {
    const color = phase >= 1 ? 0xe0453b : 0x69dbd8;
    const y = BOSS_BAR_Y - 46;
    const band = this.hud(this.add.rectangle(0, y, VIEW_W, 32, 0x0e0c16, 0.62).setOrigin(0, 0)).setDepth(95000);
    const edge = this.hud(this.add.rectangle(0, y + 32, VIEW_W, 1, color, 1).setOrigin(0, 0)).setDepth(95000);
    const sub = this.hud(this.add.bitmapText(VIEW_W / 2, y + 3, FONT, fontText(bossPhaseLabel(phase + 1)), 8).setOrigin(0.5, 0)).setDepth(95001);
    sub.setTint(0x858ea8);
    const name = this.hud(this.add.bitmapText(VIEW_W / 2, y + 13, FONT, fontText(title), 16).setOrigin(0.5, 0)).setDepth(95001);
    name.setTint(color).setScale(1.5);
    this.tweens.add({ targets: name, scale: 1, duration: 160, ease: 'Quad.easeIn' });
    const parts = [band, edge, sub, name];
    band.setScale(1, 0);
    this.tweens.add({ targets: band, scaleY: 1, duration: 120, ease: 'Quad.easeOut' });
    this.tweens.add({
      targets: parts,
      alpha: 0,
      delay: 1700,
      duration: 400,
      onComplete: () => {
        for (const o of parts) o.destroy();
        this.hudObjs = this.hudObjs.filter((o) => !parts.includes(o as never));
      },
    });
  }

  /**
   * A boss coming apart (state `dying`): it shakes harder and flashes faster, with blasts of
   * sparks, smoke and screws popping all over it, and cold breath leaking out.
   */
  private dyingFx(en: Enemy, v: EnemyView, dt: number): void {
    const k = Math.min(1, en.t / en.until);
    const s = v.s;
    const amp = 1 + Math.round(k * 2);
    s.setX(s.x + (Math.floor(this.time.now / 35) % 2 === 0 ? amp : -amp));
    s.setRotation(Math.sin(this.time.now / 45) * 0.03 * k);
    const period = 220 - 150 * k;
    // With soft flashes it glows steadily instead of strobing.
    if (settings().flashes && Math.floor(this.time.now / period) % 3 === 0) s.setTintFill(0xffffff);
    else s.setTint(0xffc0b0);
    this.blastT -= dt;
    if (this.blastT > 0) return;
    this.blastT = 0.22 - 0.12 * k;
    const w = s.displayWidth;
    const h = s.displayHeight;
    const bx = en.x + this.fx.range(-w * 0.4, w * 0.4);
    const by = en.y - this.fx.range(6, h * 0.85);
    this.sound2.play('estallido', { detune: this.fx.range(-300, 300), volume: 0.6 + 0.4 * k });
    this.shake(90, 0.006 + 0.006 * k, true);
    for (let i = 0; i < 7; i++) this.spark(bx, by, this.fx.range(0, Math.PI * 2), this.fx.range(40, 130), this.fx.int(0, 3));
    this.puff(bx, by, this.fx.range(0.5, 0.8));
    if (this.fx.chance(0.5)) this.puff(en.x + this.fx.range(-20, 20), en.y - this.fx.range(10, 50), 0.9);
    if (this.fx.chance(0.6)) {
      const a = this.fx.range(0, Math.PI * 2);
      this.particles.push({
        s: this.add.image(bx, en.y + this.fx.range(-3, 3), 'chatarra', this.fx.int(0, 3)),
        vx: Math.cos(a) * this.fx.range(30, 80),
        vy: Math.sin(a) * this.fx.range(10, 25),
        z: Math.max(2, en.y - by),
        vz: this.fx.range(60, 130),
        life: this.fx.range(1.8, 2.6),
        maxLife: 2.6,
        gravity: true,
        spin: this.fx.range(-16, 16),
        fade: true,
        hw: 3,
        hh: 3,
      });
    }
  }

  /**
   * The boss is finally in pieces: a last freeze, a collapse, a shockwave of dust, a rain of
   * scrap, and «Liquidación total» stamped where it stood. The camera then goes back to the toaster.
   */
  private bossDown(e: Extract<SimEvent, { type: 'death' }>): void {
    this.hitstop = 0.3;
    this.shake(700, 0.022, true);
    this.flashWhite(1, 650);
    this.sound2.play('derrumbe');
    this.sound2.play('estallido', { detune: -600 });
    for (let i = 0; i < 24; i++) {
      const a = this.fx.range(0, Math.PI * 2);
      this.particles.push({
        s: this.add.image(e.x + this.fx.range(-16, 16), e.y + this.fx.range(-4, 4), 'chatarra', this.fx.int(0, 3)),
        vx: Math.cos(a) * this.fx.range(40, 150),
        vy: Math.sin(a) * this.fx.range(15, 50),
        z: this.fx.range(10, 60),
        vz: this.fx.range(80, 180),
        life: this.fx.range(2.4, 3.4),
        maxLife: 3.4,
        gravity: true,
        spin: this.fx.range(-18, 18),
        fade: true,
        hw: 3,
        hh: 3,
      });
    }
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      this.puff(e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26 * FROST_FLAT - 4, this.fx.range(0.7, 1.1));
      this.puff(e.x + this.fx.range(-20, 20), e.y - this.fx.range(10, 60), this.fx.range(0.8, 1.2));
    }
    for (let i = 0; i < 12; i++) this.iceShard(e.x + this.fx.range(-14, 14), e.y);
    // A ring of dust running along the floor.
    const ring = this.add.graphics().setDepth(e.y - 1);
    const r = { k: 0 };
    this.tweens.add({
      targets: r,
      k: 1,
      duration: 600,
      ease: 'Quad.easeOut',
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(3 - 2 * r.k, 0xd6cdb2, 0.7 * (1 - r.k));
        ring.strokeEllipse(e.x, e.y, 30 + 170 * r.k, (30 + 170 * r.k) * FROST_FLAT);
      },
      onComplete: () => ring.destroy(),
    });
    // The stamp, slammed over where she stood (on the screen, so it does not drift).
    this.time.delayedCall(450, () => {
      this.sound2.play('sello');
      this.shake(140, 0.008, true);
      const cam = this.cameras.main;
      const sx = Math.round(e.x - cam.scrollX);
      const sy = Math.max(40, Math.min(VIEW_H - 70, Math.round(e.y - 40 - cam.scrollY)));
      const stamp = this.add.bitmapText(sx, sy, FONT, fontText(BOSS_DOWN_STAMP), 16).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(95500);
      stamp.setTint(0xe0453b).setAngle(-8).setScale(2.4).setAlpha(0);
      const box = this.add.rectangle(sx, sy, stamp.width / 2.4 + 12, 24, 0x000000, 0).setStrokeStyle(2, 0xe0453b, 1).setScrollFactor(0).setDepth(95500).setAngle(-8).setScale(2.4).setAlpha(0);
      this.tweens.add({ targets: [stamp, box], scale: 1, alpha: 1, duration: 130, ease: 'Quad.easeIn' });
      const ly = Math.min(VIEW_H - 40, sy + 26);
      const back = this.add.rectangle(0, sy - 24, VIEW_W, ly + 14 - (sy - 24), 0x0e0c16, 0.6).setOrigin(0, 0).setScrollFactor(0).setDepth(95400).setAlpha(0);
      this.tweens.add({ targets: back, alpha: 1, duration: 130 });
      const line = this.add.bitmapText(VIEW_W / 2, ly, FONT, fontText(BOSS_DOWN_LINE), 8).setOrigin(0.5, 0).setScrollFactor(0).setDepth(95500);
      line.setTint(0xd6cdb2).setAlpha(0);
      this.tweens.add({ targets: line, alpha: 1, delay: 500, duration: 300 });
      this.tweens.add({ targets: [stamp, box, line, back], alpha: 0, delay: 2000, duration: 450, onComplete: () => [stamp, box, line, back].forEach((o) => o.destroy()) });
    });
    this.time.delayedCall(1400, () => {
      this.camFocus = null;
    });
  }

  private endBossIntro(): void {
    this.camFocus = null;
    const parts = this.introParts;
    const bars = this.introBars;
    for (const bar of this.introBars) {
      const top = bar.y < VIEW_H / 2;
      this.tweens.add({ targets: bar, y: top ? -bar.height : VIEW_H, duration: 300, ease: 'Quad.easeIn', onComplete: () => bar.destroy() });
    }
    for (const o of this.introParts) {
      this.tweens.add({ targets: o, alpha: 0, duration: 250, onComplete: () => o.destroy() });
    }
    this.introBars = [];
    this.introParts = [];
    // (The card's own parts went through hud() too: they are on their way out.)
    this.hudObjs = this.hudObjs.filter((o) => !parts.includes(o as unknown as Phaser.GameObjects.GameObject) && !bars.includes(o as unknown as Phaser.GameObjects.Rectangle));
    for (const o of this.hudObjs) o.setVisible(true);
    // (The room's name was in the top bar: it does not come back over the boss's head.)
  }

  private hud<T extends Phaser.GameObjects.Components.ScrollFactor & Phaser.GameObjects.Components.Depth>(o: T): T {
    o.setScrollFactor(0);
    o.setDepth(95000);
    if ('setVisible' in o) this.hudObjs.push(o as unknown as Phaser.GameObjects.Components.Visible);
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
      won: this.world.won,
      report: this.report,
    };
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs, 100) / 1000;
    // Fading out to the next room: the picture freezes (the world is already in the next room)
    // and the simulation waits for the new scene.
    if (this.leaving) return;
    if (this.controls.padPause()) {
      this.openPause();
      return;
    }
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
        if (this.world.events.some((e) => e.type === 'room')) {
          this.leaveRoom();
          break;
        }
        this.acc -= DT;
        steps++;
        if (this.hitstop > 0) {
          this.acc = 0;
          break;
        }
      }
      if (steps === 5) this.acc = 0;
    }
    if (!this.leaving) this.syncView(dt);
  }

  private handleEvents(events: SimEvent[]): void {
    const synergies: string[] = [];
    for (const e of events) {
      switch (e.type) {
        case 'synergy':
          // Shown after the rest of this step's events, so the item's own banner comes first.
          if (e.added) synergies.push(e.id);
          break;
        case 'bossIntroEnd':
          this.endBossIntro();
          break;
        case 'shot': {
          this.shots++;
          this.gunKick = 3;
          this.muzzleT = 0.05;
          this.muzzle.setFrame(this.fx.int(0, 1));
          const look = WEAPONS[e.weapon]?.look;
          this.shake(50, look?.shake ?? 0.0025, true);
          this.sound2.play(look?.sound ?? 'disparo', { detune: this.fx.range(-150, 150) });
          if (e.weapon === 'secador') this.sound2.play('disparoTono', { detune: this.fx.range(-100, 100) });
          if (e.weapon === 'plancha') {
            // A cloud of steam at the soleplate and a heavier kick.
            this.sound2.play('vaporGolpe');
            this.gunKick = 5;
            for (let i = 0; i < 3; i++) this.puff(e.x + Math.cos(e.angle) * 4, e.y + Math.sin(e.angle) * 4, 0.4);
          } else this.ejectCasing(e.angle);
          break;
        }
        case 'hit': {
          if (e.damage <= 0) {
            // Bounced off a boss between phases: a dry clink and no number.
            this.sound2.play('clinc', { detune: this.fx.range(-200, 200) });
            for (let i = 0; i < 3; i++) this.spark(e.x, e.y, e.angle + Math.PI + this.fx.range(-1.2, 1.2), this.fx.range(40, 90), 1);
            break;
          }
          this.hitstop = 0.045;
          this.shake(70, 0.004, true);
          this.sound2.play('golpe', { detune: this.fx.range(-200, 200) });
          this.sound2.play('golpeRuido', { volume: 0.7 });
          for (let i = 0; i < 6; i++) this.spark(e.x, e.y, e.angle + Math.PI + this.fx.range(-1.1, 1.1), this.fx.range(50, 130), this.fx.int(0, 2));
          this.damageText(e.target, e.x, e.y - 6, e.damage);
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
          this.shake(120, 0.006, true);
          this.sound2.play('choque');
          for (let i = 0; i < 8; i++) this.spark(e.x, e.y, Math.atan2(-e.dirY, -e.dirX) + this.fx.range(-1.4, 1.4), this.fx.range(40, 110), this.fx.int(0, 2));
          for (let i = 0; i < 3; i++) this.puff(e.x + this.fx.range(-5, 5), e.y + this.fx.range(-3, 3), 0.45);
          break;
        }
        case 'contact':
          this.shake(90, 0.005, true);
          this.flashHero = 0.06;
          this.sound2.play('empujon');
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y, Math.atan2(e.dirY, e.dirX) + this.fx.range(-1, 1), this.fx.range(40, 90), this.fx.int(0, 2));
          break;
        case 'switchOn':
          this.sound2.play('encender');
          for (let i = 0; i < 5; i++) this.spark(e.x + this.fx.range(-6, 6), e.y + this.fx.range(-6, 4), this.fx.range(0, Math.PI * 2), this.fx.range(20, 60), 0);
          break;
        case 'lunge':
          this.sound2.play('batir', { detune: this.fx.range(-100, 100) });
          for (let i = 0; i < 3; i++) this.puff(e.x - e.dirX * 6 + this.fx.range(-3, 3), e.y + this.fx.range(-2, 1), 0.3);
          break;
        case 'turbo': {
          this.sound2.play('turbo');
          this.shake(100, 0.004, true);
          for (let i = 0; i < 10; i++) this.spark(e.x, e.y - 16, this.fx.range(0, Math.PI * 2), this.fx.range(40, 120), this.fx.int(0, 3));
          this.floatText(e.x, e.y - 38, fontText(TURBO_LINE), 0xe0453b, undefined, -14, 1);
          break;
        }
        case 'blinkOut':
          this.sound2.play('apagar', { detune: this.fx.range(-150, 150) });
          break;
        case 'blinkIn': {
          this.sound2.play('zapear', { detune: this.fx.range(-200, 200) });
          const v = this.enemySprites.get(e.source);
          if (v) v.onAt = this.time.now;
          for (let i = 0; i < 4; i++) this.spark(e.x + this.fx.range(-5, 5), e.y - this.fx.range(4, 22), this.fx.range(0, Math.PI * 2), this.fx.range(20, 50), 0);
          break;
        }
        case 'dart':
          this.sound2.play('aleteo', { detune: this.fx.range(-200, 200) });
          break;
        case 'death':
          this.breakApart(e);
          if (ENEMIES[e.enemy]?.boss) this.bossDown(e);
          break;
        case 'pickup':
          if (e.kind === 'ticket') {
            // A ticket: a paper rustle and a stamp, its line over it and the counter in the HUD jumps.
            this.sound2.play('cupon', { detune: -500 });
            this.sound2.play('sello', { volume: 0.5 });
            for (let i = 0; i < 6; i++) this.spark(e.x, e.y - 4, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 0);
            this.floatText(e.x, e.y - 14, fontText(TICKET_LINE), 0xf4f1e8);
            this.ticketPop = 0.3;
            break;
          }
          if (e.kind === 'corazon') {
            // A spare heart: a warm chime, red sparks and the heart in the HUD pumps.
            this.sound2.play('curar');
            for (let i = 0; i < 8; i++) this.spark(e.x, e.y - 4, this.fx.range(0, Math.PI * 2), this.fx.range(30, 80), 2);
            this.floatText(e.x, e.y - 14, fontText(HEART_LINE), 0xe0453b);
            this.heartHit = Math.floor((e.total - 1) / 2);
            this.heartHitT = 0.5;
            break;
          }
          if (e.kind === 'arma') {
            // A weapon found: a fanfare, a burst of sparks and a line over it (the swap event names it).
            this.sound2.play('arma');
            for (let i = 0; i < 12; i++) this.spark(e.x, e.y - 8, this.fx.range(0, Math.PI * 2), this.fx.range(40, 110), this.fx.int(0, 2));
            this.floatText(e.x, e.y - 22, fontText(this.fx.pick(WEAPON_FOUND_LINES)), 0xd6cdb2);
            const wd = WEAPONS[e.weapon ?? ''];
            if (wd) this.showCard(wd.look.sprite, wd.name, itemKindWeapon(keyWords()), wd.description, weaponLines(wd), 0xd6cdb2);
            if (e.total > 1 && !this.swapHinted) {
              this.swapHinted = true;
              this.hintT = 0;
              for (const h of this.hint) h.setAlpha(0);
              this.setBanner(swapHint(keyWords())).setTint(0xf4f1e8).setAlpha(1);
              this.tweens.killTweensOf(this.banner);
              this.tweens.add({ targets: this.banner, alpha: 0, delay: 3200, duration: 600, onComplete: () => this.banner.setTint(0xf6c431) });
            }
            break;
          }
          if (e.kind === 'objeto' || e.kind === 'activo') {
            // An item: a fanfare (a little higher than a weapon's), gold sparks, and its name and description up top.
            const act = e.kind === 'activo' ? ACTIVE_ITEMS[e.item ?? ''] : undefined;
            const pas = e.kind === 'objeto' ? ITEMS[e.item ?? ''] : undefined;
            this.sound2.play('arma', { detune: 500 });
            for (let i = 0; i < 14; i++) this.spark(e.x, e.y - 8, this.fx.range(0, Math.PI * 2), this.fx.range(40, 110), 1);
            if (act) this.showCard(act.sprite, act.name, itemKindActive(keyWords()), act.description, activeLines(act, keyWords()), 0x69dbd8);
            else if (pas) this.showCard(pas.sprite, pas.name, ITEM_KIND_PASSIVE, pas.description, modifierLines(pas.mod), 0xf6c431);
            break;
          }
          this.couponPop = 0.25;
          this.sound2.play('cupon', { detune: Math.min(600, (e.total % 8) * 80) });
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y - 3, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 1);
          break;
        case 'shop':
          if (e.outcome === 'bought') {
            // Sold: the scanner beeps, the price flies off and the till thanks you (and says when it is empty).
            this.sound2.play('escaner');
            this.time.delayedCall(90, () => this.sound2.play('escaner', { detune: 300 }));
            this.floatText(e.x, e.y + 4, `-${e.price}`, 0xf6c431);
            this.couponPop = 0.25;
            this.tillSay(this.fx.pick(SHOPKEEPER.thanks), this.world.pickups.some((k) => k.price !== undefined) ? null : SHOPKEEPER.soldOut);
          } else {
            // No: two flat notes, the screen goes red and the coupon counter shakes.
            this.sound2.play('cajaError');
            this.tillNoT = 1.1;
            if (e.outcome === 'poor') this.couponPop = -0.4;
            this.tillSay(e.outcome === 'poor' ? this.fx.pick(SHOPKEEPER.poor) : SHOPKEEPER.full);
          }
          break;
        case 'swap': {
          const def = WEAPONS[e.weapon];
          if (!e.found) this.sound2.play('cambiar');
          this.gunKick = -3;
          if (def) this.weaponName.setText(fontText(def.name)).setAlpha(1);
          this.weaponNameT = e.found ? 2.4 : 1.2;
          break;
        }
        case 'doors':
          if (!e.shut) this.openShutters();
          break;
        case 'reward':
          if (e.reward === 'chest') {
            // The chest drops in with a thud and a cloud of dust.
            this.chestDrop = true;
            this.sound2.play('choque', { volume: 0.6 });
            for (let i = 0; i < 6; i++) this.puff(e.x + this.fx.range(-12, 12), e.y - this.fx.range(0, 6), this.fx.range(0.5, 0.8));
            this.floatText(e.x, e.y - 28, fontText(CHEST_NAME), 0xd6cdb2);
            this.shake(90, 0.004, true);
          } else this.sound2.play('desbloquear', { volume: 0.6 });
          break;
        case 'chest':
          if (e.opened) {
            // Opened: the slot swallows the ticket, the lid jumps up, gold sparks and a line over it.
            this.sound2.play('sello');
            this.sound2.play('desbloquear');
            for (let i = 0; i < 16; i++) this.spark(e.x + this.fx.range(-8, 8), e.y - 14, -Math.PI / 2 + this.fx.range(-1.2, 1.2), this.fx.range(50, 130), 1);
            this.floatText(e.x, e.y - 30, fontText(this.fx.pick(CHEST_OPEN_LINES)), 0xf6c431);
            this.shake(80, 0.004, true);
            this.ticketPop = 0.3;
          } else {
            // Locked: a flat buzz, the light blinks and the ticket counter shakes.
            this.sound2.play('vacio');
            this.sound2.play('apagar', { volume: 0.5 });
            this.floatText(e.x, e.y - 30, fontText(this.fx.pick(CHEST_LOCKED_LINES)), 0xe0453b);
            this.ticketPop = -0.4;
          }
          break;
        case 'active': {
          // The active item goes off: a zap, a ring of sparks round the toaster and a line over it.
          this.sound2.play('activar');
          for (let i = 0; i < 16; i++) this.spark(e.x, e.y - 10, (i / 16) * Math.PI * 2, 90, 1);
          this.floatText(e.x, e.y - 30, fontText(ACTIVE_LINES[e.effect] ?? ''), 0x69dbd8);
          this.activeFlash = 0.4;
          if (e.effect === 'hold') this.sound2.play('espera');
          if (e.effect === 'heal') {
            this.sound2.play('curar');
            this.heartHit = Math.floor((this.world.player.hp - 1) / 2);
            this.heartHitT = 0.5;
          }
          this.shake(120, 0.004);
          break;
        }
        case 'activeEmpty':
          this.sound2.play('sinCarga');
          this.activeShake = 0.3;
          if (e.item) this.floatText(this.world.player.x, this.world.player.y - 30, fontText(NO_CHARGE_LINE), 0x858ea8);
          break;
        case 'battery':
          this.sound2.play('pila', { detune: e.charge * 200 });
          this.activeFlash = e.charge >= e.needs ? 0.6 : 0.25;
          break;
        case 'holdEnd':
          this.sound2.play('reponer', { detune: 400 });
          break;
        case 'restock':
          this.sound2.play('reponer');
          this.setBanner(RESTOCK_LINE).setAlpha(1);
          this.tweens.killTweensOf(this.banner);
          this.tweens.add({ targets: this.banner, alpha: 0, delay: 1400, duration: 600 });
          for (const en of this.world.enemies) for (let i = 0; i < 4; i++) this.puff(en.x + this.fx.range(-8, 8), en.y - enemyAltitude(en) - this.fx.range(0, 16), 0.5);
          break;
        case 'hurt': {
          this.hitstop = 0.1;
          this.hurtFace = 0.3;
          this.flashHero = 0.08;
          this.shake(220, 0.011, true);
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
          this.downCause = e.cause;
          this.recordRun('down');
          this.sound2.playMusic(null, 1.2);
          this.hitstop = 0.3;
          this.shake(400, 0.016, true);
          this.sound2.play('baja');
          for (let i = 0; i < 8; i++) this.puff(e.x + this.fx.range(-8, 8), e.y - this.fx.range(4, 22), this.fx.range(0.5, 0.9));
          break;
        case 'telegraph':
          this.warnings++;
          this.sound2.play('aviso', { detune: e.color === 'red' ? 0 : e.color === 'cyan' ? 300 : -250 });
          // The fridge's dispenser rattles as it loads the cubes.
          if (e.color === 'ice') this.sound2.play('cubitos', { detune: this.fx.range(-150, 150) });
          break;
        case 'frostThrow':
          this.sound2.play('lanzar', { detune: this.fx.range(-200, 200) });
          break;
        case 'frostLand': {
          if (e.product !== undefined) {
            // An expired product bursts: a wet splat and green bits flying.
            this.sound2.play('chof', { detune: this.fx.range(-300, 300) });
            this.shake(70, 0.003, true);
            for (let i = 0; i < 8; i++) this.goo(e.x + this.fx.range(-3, 3), e.y);
            this.puff(e.x, e.y - 2, 0.45);
            break;
          }
          this.sound2.play('escarcha', { detune: this.fx.range(-200, 200) });
          this.shake(80, 0.004, true);
          for (let i = 0; i < 7; i++) this.iceShard(e.x + this.fx.range(-4, 4), e.y);
          for (let i = 0; i < 3; i++) this.puff(e.x + this.fx.range(-e.r * 0.6, e.r * 0.6), e.y + this.fx.range(-4, 4), 0.5);
          break;
        }
        case 'bulletCut':
          // A loyalty card shot down: a snip and a few red and white bits.
          this.sound2.play('tarjeta', { detune: this.fx.range(-200, 200) });
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(25, 60), i % 2);
          break;
        case 'bossPhase': {
          // A new phase: the boss stops and shudders, the screen flashes and clears, and the phase
          // card comes up over its life bar. The second one, «Oferta irrechazable», swings the door
          // open (a creak and a cold breath) and comes in offer red.
          this.hitstop = 0.12;
          this.sound2.play('jefe', { volume: 0.7 });
          this.shake(320, 0.014, true);
          this.flashWhite(0.55, 380);
          const boss = this.world.enemies.find((en) => en.id === e.boss);
          if (e.phase >= 1 && boss) {
            this.sound2.play('portazo');
            for (let i = 0; i < 10; i++) this.puff(boss.x + this.fx.range(-14, 22) * boss.facing, boss.y - this.fx.range(8, 40), this.fx.range(0.6, 1.1));
          }
          this.showPhaseCard(e.phase, e.name);
          if (this.bossBar) this.bossBar.flash = 0.5;
          break;
        }
        case 'lift':
          this.raiseLift(e.x, e.y);
          break;
        case 'liftReady':
          this.sound2.play('desbloquear');
          if (this.liftView) this.liftView.s.setFrame(1);
          this.setBanner(LIFT_LINE).setTint(0x69dbd8).setAlpha(1);
          this.tweens.killTweensOf(this.banner);
          this.tweens.add({ targets: this.banner, alpha: 0, delay: 3200, duration: 600, onComplete: () => this.banner.setTint(0xf6c431) });
          break;
        case 'floorDone':
          this.winT = 0;
          this.recordRun('floor');
          this.sound2.play('ascensor');
          this.shake(200, 0.006, true);
          for (let i = 0; i < 8; i++) this.puff(e.x + this.fx.range(-20, 20), e.y + this.fx.range(-8, 8), 0.6);
          break;
        case 'fireCleared': {
          // Every enemy bullet pops at once: a sparkle of its colour where it was, and one sweep.
          if (e.points.length) this.sound2.play('barrido');
          for (const pt of e.points) {
            this.puff(pt.x, pt.y, 0.3);
            for (let i = 0; i < 2; i++) this.spark(pt.x, pt.y, this.fx.range(0, Math.PI * 2), this.fx.range(20, 50), pt.color === 'red' || pt.color === 'card' ? 2 : 0);
          }
          break;
        }
        case 'bossDying': {
          this.runBosses.push(e.enemy);
          this.sound2.playMusic(null, 1.5);
          // Her life runs out: a long freeze, a flash, and the camera goes to her while she comes apart.
          this.hitstop = 0.35;
          this.shake(500, 0.018, true);
          this.flashWhite(0.8, 500);
          this.sound2.play('jefe', { detune: -500 });
          this.sound2.play('estallido');
          this.camFocus = { x: e.x, y: e.y - 40 };
          this.blastT = 0.25;
          break;
        }
      }
    }
    for (const id of synergies) this.showSynergy(id);
  }

  /**
   * A synergy switches on: a rising chord, a ring of sparks round the toaster, and «Sinergia corporativa:»,
   * its name and its line on a dark plate under the item's description for a while.
   */
  private showSynergy(id: string): void {
    const def = SYNERGIES[id];
    if (!def) return;
    const p = this.world.player;
    this.sound2.play('arma', { detune: 900 });
    this.time.delayedCall(140, () => this.sound2.play('arma', { detune: 1400 }));
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      this.spark(p.x + Math.cos(a) * 6, p.y - 10 + Math.sin(a) * 4, a, this.fx.range(60, 100), 0);
    }
    this.flashHero = 0.12;
    // With big text the description window fills the middle of the screen: the synergy's plate
    // waits for it to go.
    if (settings().bigText && this.card.bottom > 0) this.pendingSynergies.push(id);
    else this.showSynergyPlate(id);
  }

  /** «Sinergia corporativa:», the synergy's name and its line, on a dark plate for a while. */
  private showSynergyPlate(id: string): void {
    const def = SYNERGIES[id];
    if (!def) return;
    const scale = readScale(settings());
    const lines = [`${SYNERGY_LINE} ${def.name}`, def.text].flatMap((t) => wrapLines(fontText(t), scale > 1 ? 440 : 300, scale));
    this.tweens.killTweensOf([this.synergyText, this.synergyPlate]);
    this.synergyText.setFontSize(8 * scale).setText(lines.join('\n')).setAlpha(1);
    const b = this.synergyText.getTextBounds(true).global;
    // Next to the description window if it is up (it usually is: the synergy came with an item):
    // under it when it is up top, over it when it is down below.
    const c = this.card;
    const ph = Math.ceil(b.height) + 8;
    const want = c.bottom === 0 ? 80 : c.top <= 40 ? c.bottom + 4 : c.top - 4 - ph;
    const sy = Math.max(2, Math.min(VIEW_H - 2 - ph, want));
    this.synergyPlate.setY(sy);
    this.synergyText.setY(sy + 4);
    this.synergyPlate.setSize(Math.ceil(b.width) + 12, Math.ceil(b.height) + 8).setOrigin(0.5, 0).setAlpha(1);
    this.tweens.add({ targets: [this.synergyText, this.synergyPlate], alpha: 0, delay: 4600, duration: 700 });
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

  /** A bit of rotten food that flies out of a burst product and lands. */
  private goo(x: number, y: number): void {
    const s = this.add.image(x, y, 'chispas', 0).setTint(this.fx.pick([0xb5d36a, 0x7fa83f, 0x4f6e2a, 0xd6cdb2]));
    const a = this.fx.range(0, Math.PI * 2);
    const sp = this.fx.range(20, 60);
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 2, vz: this.fx.range(40, 90), life: 0.9, maxLife: 0.9, gravity: true, spin: 0, fade: true, hw: 1, hh: 1 });
  }

  /** A splinter of ice that jumps out and bounces on the floor. */
  private iceShard(x: number, y: number): void {
    const s = this.add.image(x, y, 'chispas', 0).setTint(this.fx.pick([0xf4f1e8, 0xb6f1f0, 0x69dbd8]));
    const a = this.fx.range(0, Math.PI * 2);
    const sp = this.fx.range(25, 70);
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 2, vz: this.fx.range(50, 110), life: 0.7, maxLife: 0.7, gravity: true, spin: 0, fade: true, hw: 1, hh: 1 });
  }

  private spark(x: number, y: number, a: number, speed: number, frame: number): void {
    const s = this.add.image(x, y, 'chispas', frame);
    this.particles.push({ s, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, z: 0, vz: 0, life: 0.25, maxLife: 0.25, gravity: false, spin: 0, fade: false });
  }

  /**
   * One shutter sprite per door. Walking into a combat room brings them down with a slam; in any
   * other room they are already up (rolled into the lintel, green light).
   */
  /**
   * The floor plan in the top right corner: rooms visited (grey), the one the toaster is in
   * (white), and the ones seen through their doors (dark outline), with icons for the boss, the
   * shop and the treasure. Drawn once per room (the scene rebuilds on every door).
   */
  private drawMinimap(): void {
    const cells = minimap(this.world);
    if (cells.length === 0) return;
    const gx0 = Math.min(...cells.map((c) => c.gx));
    const gy0 = Math.min(...cells.map((c) => c.gy));
    const gw = Math.max(...cells.map((c) => c.gx)) - gx0 + 1;
    const gh = Math.max(...cells.map((c) => c.gy)) - gy0 + 1;
    const pad = 3;
    const W = gw * MAP_STEP_X - (MAP_STEP_X - MAP_CELL_W) + pad * 2;
    const H = gh * MAP_STEP_Y - (MAP_STEP_Y - MAP_CELL_H) + pad * 2;
    const x0 = VIEW_W - 6 - W;
    const y0 = 6;
    this.mapSize = { w: W, h: H };
    this.mapG?.destroy();
    const g = this.hud(this.add.graphics()).setDepth(94000);
    this.mapG = g;
    // Dark enough to read over the colourful back-wall shelves.
    g.fillStyle(0x0e0c16, 0.85).fillRect(x0, y0, W, H);
    g.lineStyle(1, 0x3a3f5c, 1).strokeRect(x0 + 0.5, y0 + 0.5, W - 1, H - 1);
    const at = (c: { gx: number; gy: number }): { x: number; y: number } => ({ x: x0 + pad + (c.gx - gx0) * MAP_STEP_X, y: y0 + pad + (c.gy - gy0) * MAP_STEP_Y });
    // Corridors first, so the rooms sit on top of them.
    g.fillStyle(0x6b7090, 1);
    for (const c of cells) {
      const p = at(c);
      for (const d of c.links) {
        if (d === 'E') g.fillRect(p.x + MAP_CELL_W, p.y + (MAP_CELL_H >> 1) - 1, MAP_STEP_X - MAP_CELL_W, 2);
        else if (d === 'S') g.fillRect(p.x + (MAP_CELL_W >> 1) - 1, p.y + MAP_CELL_H, 2, MAP_STEP_Y - MAP_CELL_H);
      }
    }
    for (const c of cells) {
      const p = at(c);
      if (c.state === 'seen') {
        g.fillStyle(0x1b1d2e, 1).fillRect(p.x, p.y, MAP_CELL_W, MAP_CELL_H);
        g.lineStyle(1, 0x4a4f6e, 1).strokeRect(p.x + 0.5, p.y + 0.5, MAP_CELL_W - 1, MAP_CELL_H - 1);
      } else {
        g.fillStyle(c.state === 'here' ? 0xf4f1e8 : 0x6b7090, 1).fillRect(p.x, p.y, MAP_CELL_W, MAP_CELL_H);
        // Shade along the bottom, like the room tiles.
        g.fillStyle(c.state === 'here' ? 0xb9b3a3 : 0x4a4f6e, 1).fillRect(p.x, p.y + MAP_CELL_H - 1, MAP_CELL_W, 1);
      }
      const icon = MAP_ICONS[c.kind];
      if (icon) {
        const ix = p.x + Math.floor((MAP_CELL_W - icon.rows[0]!.length) / 2);
        const iy = p.y + Math.floor((MAP_CELL_H - icon.rows.length) / 2);
        g.fillStyle(c.state === 'here' ? 0x0e0c16 : icon.color, 1);
        icon.rows.forEach((row, j) => [...row].forEach((ch, i) => {
          if (ch === '#') g.fillRect(ix + i, iy + j, 1, 1);
        }));
      }
    }
  }

  /** The texture of this floor for a sprite that changes from floor to floor (`<key>-2` upstairs), or the plain one. */
  private levelKey(key: string): string {
    const own = `${key}-${this.world.level}`;
    return this.world.level > 1 && this.textures.exists(own) ? own : key;
  }

  private makeShutters(doors: ReadonlyArray<{ dir: string; x: number; y: number; w: number; h: number }>): void {
    this.shutters = [];
    const slam = this.world.doorsShut && this.world.room.kind === 'combat';
    for (const d of doors) {
      const key = this.levelKey(d.dir === 'N' ? 'persiana-n' : d.dir === 'S' ? 'persiana-s' : 'persiana-v');
      const img = this.add.image(d.x, d.y, key, this.world.doorsShut ? 0 : 1).setOrigin(0, 0).setDepth(-99000);
      const sh = { img, h: d.h };
      this.shutters.push(sh);
      if (!this.world.doorsShut) img.setCrop(0, 0, d.w, SHUTTER_ROLLED);
      else if (slam) {
        const p = { h: SHUTTER_ROLLED };
        img.setCrop(0, 0, d.w, p.h);
        this.tweens.add({ targets: p, h: d.h, duration: 260, delay: 150, ease: 'Quad.easeIn', onUpdate: () => img.setCrop(0, 0, d.w, Math.round(p.h)) });
      }
    }
    if (slam && this.shutters.length) {
      this.time.delayedCall(410, () => {
        this.sound2.play('persiana');
        this.shake(110, 0.005, true);
        for (const s of this.shutters) for (let i = 0; i < 3; i++) this.puff(s.img.x + this.fx.range(4, s.img.width - 4), s.img.y + s.h - 2, 0.4);
      });
    }
  }

  /** The room is clear: the shutters rattle up, the lights go green, and the shop thanks you. */
  private openShutters(): void {
    this.sound2.play('desbloquear');
    this.time.delayedCall(120, () => this.sound2.play('persiana'));
    for (const s of this.shutters) {
      const img = s.img;
      img.setFrame(1);
      const p = { h: s.h };
      this.tweens.add({ targets: p, h: SHUTTER_ROLLED, duration: 650, ease: 'Sine.easeInOut', onUpdate: () => img.setCrop(0, 0, img.width, Math.round(p.h)) });
    }
    // After a boss the stamp says it all.
    if (this.bossBar) return;
    this.setBanner(this.fx.pick(DOORS_OPEN_LINES)).setAlpha(1);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 1800, duration: 600 });
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

  /** Puts `text` on the banner under the room's name: double size and in lines with big text. */
  private setBanner(text: string): Phaser.GameObjects.BitmapText {
    const scale = readScale(settings());
    return this.banner.setFontSize(8 * scale).setText(wrapLines(fontText(text), VIEW_W - 40, scale).join('\n'));
  }

  /**
   * Opens the description window: the sprite at double size on the left; the name, what kind of
   * thing it is, its description and what it does (green what it gives, red what it takes) on
   * the right, on a dark plate edged in `edge`. It stays up a few seconds (longer with more to
   * read) and fades; a new one replaces it.
   */
  private showCard(sprite: string, name: string, kind: string, description: string, effects: EffectLine[], edge: number): void {
    const c = this.card;
    const parts = [c.plate, c.icon, c.name, c.kind, c.desc, ...c.lines];
    this.tweens.killTweensOf(parts);
    // The old banner would say the same thing on top of it.
    this.tweens.killTweensOf([this.banner, this.itemDesc]);
    this.banner.setAlpha(0);
    this.itemDesc.setAlpha(0);
    const big = settings().bigText;
    const L = cardLayout(fontText(name), fontText(kind), fontText(description), effects.slice(0, c.lines.length).map((e) => fontText(e.text)), readScale(settings()));
    const h = L.h;
    const x0 = Math.round((VIEW_W - L.w) / 2);
    // Up top, unless the toaster is in the top half of the screen: then down below, out of its way.
    const p = this.world.player;
    const high = p.y - this.cameras.main.scrollY < VIEW_H / 2 + 10;
    const l = this.layout ?? this.computeLayout();
    const y0 = high ? l.cardBottom - h : l.cardTop;
    c.name.setFontSize(L.size).setText(L.name.text).setPosition(x0 + L.name.x, y0 + L.name.y);
    c.kind.setFontSize(L.size).setText(L.kind.text).setPosition(x0 + L.kind.x, y0 + L.kind.y);
    c.desc.setFontSize(L.size).setText(L.desc.text).setPosition(x0 + L.desc.x, y0 + L.desc.y);
    c.lines.forEach((t, i) => {
      const at = L.effects[i];
      t.setFontSize(L.size).setText(at?.text ?? '');
      if (at) t.setPosition(x0 + at.x, y0 + at.y).setTint(effects[at.index]!.good ? 0x7ef0a0 : 0xe0453b);
    });
    c.icon.setTexture(sprite).setPosition(x0 + L.icon.x, y0 + L.icon.y);
    c.plate.clear();
    c.plate.fillStyle(0x0e0c16, 1).fillRect(x0 - 1, y0 - 1, L.w + 2, h + 2);
    c.plate.fillStyle(0x101420, big ? 0.96 : 0.92).fillRect(x0, y0, L.w, h);
    c.plate.lineStyle(1, edge, 0.9).strokeRect(x0 + 0.5, y0 + 0.5, L.w - 1, h - 1);
    // The icon sits in a darker well.
    c.plate.fillStyle(0x0e0c16, 0.8).fillRect(x0 + L.well.x, y0 + L.well.y, L.well.w, L.well.h);
    c.top = y0;
    c.bottom = y0 + h;
    for (const o of parts) o.setAlpha(1);
    const words = description.split(' ').length + effects.length * 3;
    this.tweens.add({ targets: parts, alpha: 0, delay: Math.min(6500, 2600 + words * 110), duration: 600, onComplete: () => {
      c.top = 0;
      c.bottom = 0;
      for (const id of this.pendingSynergies.splice(0)) this.showSynergyPlate(id);
    } });
  }

  /**
   * The till says `text` in a bubble over it (replacing what it was saying); `then` follows when
   * that ends. Its screen mouths the words while the bubble is up.
   */
  private tillSay(text: string, then: string | null = null): void {
    if (!this.till) return;
    this.bubble?.g.destroy();
    this.bubble?.t.destroy();
    const room = this.world.room;
    const scale = readScale(settings());
    const t = this.add.bitmapText(0, 0, FONT, wrapLines(fontText(text), 150 * scale, scale).join('\n'), 8 * scale).setOrigin(0.5, 1).setCenterAlign().setTint(0xf4f1e8).setDepth(86001);
    const w = Math.ceil(t.width) + 10;
    const h = Math.ceil(t.height) + 7;
    const till = this.till;
    // Over the till, with the tail pointing down at its screen; if that would go off the top of
    // the view or under the room's name (big text, a till against the back wall), beside it, with
    // the tail pointing at it.
    // While the room's name is up, its plate counts as the top.
    const nameUp = this.roomTitle && this.roomTitle.alpha > 0 ? this.roomTitle.getBounds().bottom + 2 : 2;
    const viewTop = this.cameras.main.scrollY + nameUp;
    const above = till.y - 39 - h >= viewTop;
    const left = till.x > room.w / 2;
    const bx = above
      ? Math.round(Math.min(room.w - 4 - w, Math.max(4, till.x - w / 2)))
      : Math.round(left ? Math.max(4, till.x - 16 - w) : Math.min(room.w - 4 - w, till.x + 16));
    const by = above ? Math.round(till.y - 39 - h) : Math.round(Math.max(viewTop, till.y - 30 - h / 2));
    t.setPosition(bx + Math.round(w / 2), by + h - 3);
    // A dark plate with a light border (light text reads; dark text on light blurs this font).
    const g = this.add.graphics().setDepth(86000);
    g.fillStyle(0xd6cdb2, 1).fillRect(bx - 1, by - 1, w + 2, h + 2);
    g.fillStyle(0x0e0c16, 0.94).fillRect(bx, by, w, h);
    if (above) {
      // The tail points down at the till's screen.
      const tx = Math.round(till.x);
      const y = by + h;
      g.fillStyle(0xd6cdb2, 1).fillRect(tx - 3, y + 1, 7, 1).fillRect(tx - 2, y + 2, 5, 1).fillRect(tx - 1, y + 3, 3, 1);
      g.fillStyle(0x0e0c16, 1).fillRect(tx - 2, y, 5, 1).fillRect(tx - 1, y + 1, 3, 1).fillRect(tx, y + 2, 1, 1);
    } else {
      // The tail points sideways at it, level with its screen (or as near as the plate allows).
      const ty = Math.round(Math.min(by + h - 5, Math.max(by + 4, till.y - 30)));
      const d = left ? 1 : -1;
      const x = left ? bx + w : bx - 1;
      g.fillStyle(0xd6cdb2, 1).fillRect(x + d, ty - 3, 1, 7).fillRect(x + 2 * d, ty - 2, 1, 5).fillRect(x + 3 * d, ty - 1, 1, 3);
      g.fillStyle(0x0e0c16, 1).fillRect(x, ty - 2, 1, 5).fillRect(x + d, ty - 1, 1, 3).fillRect(x + 2 * d, ty, 1, 1);
    }
    this.bubble = { g, t };
    this.bubbleT = 1.4 + text.length * 0.045;
    this.tillNext = then;
  }

  /** The till's face (talking, refusing or smiling) and its bubble running out. */
  private drawShop(dt: number): void {
    if (!this.till) return;
    this.tillNoT = Math.max(0, this.tillNoT - dt);
    if (this.bubble) {
      this.bubbleT -= dt;
      this.bubble.g.setAlpha(Math.min(1, this.bubbleT * 4));
      this.bubble.t.setAlpha(Math.min(1, this.bubbleT * 4));
      if (this.bubbleT <= 0) {
        this.bubble.g.destroy();
        this.bubble.t.destroy();
        this.bubble = null;
        const next = this.tillNext;
        if (next) this.time.delayedCall(250, () => this.tillSay(next));
      }
    }
    const talking = !!this.bubble && this.bubbleT > 0.3 && Math.floor(this.time.now / 140) % 2 === 0;
    this.till.setFrame(this.tillNoT > 0 ? 2 : talking ? 1 : 0);
  }

  /** A line that pops up from (x, y) and fades; if another is still there, it goes up over it. */
  private floatText(x: number, y: number, text: string, tint: number, key?: string, vy = -30, life = 0.6): FloatText {
    // Double size with big text, like everything that is read.
    const scale = readScale(settings());
    const w = textWidth(text) * scale;
    const h = 8 * scale;
    const box = { x: Math.round(x - w / 2), y: Math.round(y) - h, w, h };
    const placed = this.floats.map((f) => {
      const b = f.t.getBounds();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    });
    const top = stackFloat(placed, box);
    const t = this.add.bitmapText(Math.round(x), top + h, FONT, text, h).setOrigin(0.5, 1).setDepth(85000).setTint(tint);
    const f: FloatText = { t, vy, life, key, age: 0 };
    this.floats.push(f);
    return f;
  }

  /**
   * A damage number over what was hit. Hits on the same target in quick succession add up in the
   * same number (it jumps and turns brighter) instead of stacking a column of «1»s.
   */
  private damageText(target: number, x: number, y: number, damage: number): void {
    const key = `hit:${target}`;
    const f = this.floats.find((o) => o.key === key && (o.age ?? 0) < 0.35);
    if (f) {
      f.sum = (f.sum ?? 0) + damage;
      f.t.setText(String(Math.round(f.sum * 10) / 10)).setTint(0xfff1a8);
      f.life = 0.6;
      f.vy = -34;
      f.t.y -= 2;
      return;
    }
    const n = this.floatText(x + this.fx.range(-3, 3), y, String(damage), 0xf6c431, key);
    n.sum = damage;
  }

  private syncView(dt: number): void {
    const w = this.world;
    this.drawBossBar(dt);
    this.drawLift(dt);
    this.drawShop(dt);
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
    this.hurtFace = Math.max(0, this.hurtFace - dt);
    if (this.hurtFace > 0 && !rolling && !w.over) {
      // Squeezed face and a quick squash after a hit.
      this.hero.setFrame(HERO_HURT);
      this.hero.setScale(p.facing * (1 + this.hurtFace * 0.4), 1 - this.hurtFace * 0.4);
    }
    if (w.over) {
      this.downT += dt;
      if (this.downT < DOWN_POP) {
        // A last shudder with the face screwed up...
        this.hero.setFrame(HERO_HURT);
        this.hero.setX(Math.round(p.x) + (Math.floor(this.time.now / 35) % 2 === 0 ? 1 : -1));
        if (this.fx.chance(dt * 30)) this.spark(p.x + this.fx.range(-8, 8), p.y - this.fx.range(6, 26), this.fx.range(0, Math.PI * 2), this.fx.range(30, 80), 0);
      } else {
        // ...then the slices pop out and the empty body tips over with a little bounce.
        if (!this.popped) this.popToaster();
        const t = this.downT - DOWN_POP;
        const k = Math.min(1, t / 0.28);
        const bounce = t > 0.28 && t < 0.5 ? Math.sin(((t - 0.28) / 0.22) * Math.PI) * 0.12 : 0;
        this.hero.setFrame(HERO_BROKEN);
        this.hero.setRotation((k * k - bounce) * (Math.PI / 2) * p.facing);
        // Smoke from the empty slots (now on its side) and sparks from the frayed cord.
        if (this.fx.chance(dt * 7)) this.puff(p.x + p.facing * this.fx.range(22, 30), p.y - 6 + this.fx.range(-3, 3), 0.9);
        if (this.fx.chance(dt * 2.5)) for (let i = 0; i < 3; i++) this.spark(p.x - p.facing * 12, p.y - 2, this.fx.range(0, Math.PI * 2), this.fx.range(20, 60), 0);
      }
      if (this.downT > DOWN_REPORT && this.downPanel.length === 0) this.showDownPanel();
      if (this.canAskNewUnit()) {
        const pressed = this.controls.read({ bodyX: p.x, bodyY: p.y }).reload;
        if (!pressed) this.downArmed = true;
        else if (this.downArmed) this.scene.restart();
      }
    }
    this.hero.setCrop();
    if (w.won && this.winT >= 0) {
      // Going down with the lift: it sinks into the shaft, hidden by the front edge of the hole.
      this.winT += dt;
      const k = Math.min(1, this.winT / WIN_SINK);
      const d = Math.round(k * k * 34);
      const edge = (w.lift ? w.lift.y : p.y) + 13;
      this.hero.setFrame(0).setRotation(0).setScale(p.facing, 1);
      this.hero.setY(Math.round(p.y) + d);
      const rows = Math.max(0, Math.round(edge - (p.y + d - HERO_FEET_Y)));
      this.hero.setCrop(0, 0, HERO_W, Math.min(HERO_H, rows));
      this.hero.setVisible(rows > 0);
      if (this.winT > WIN_REPORT && this.downPanel.length === 0) this.showWinPanel();
      if (this.canAskNewUnit()) {
        const pressed = this.controls.read({ bodyX: p.x, bodyY: p.y }).reload;
        if (!pressed) this.downArmed = true;
        else if (this.downArmed) this.scene.restart();
      }
    }
    this.hero.setDepth(p.y);
    this.hero.setAlpha(1);
    this.heroShadow.setVisible(!w.won);
    this.heroShadow.setPosition(Math.round(p.x), Math.round(p.y));
    if (this.flashHero > 0) {
      this.flashHero -= dt;
      this.whiteOut(this.hero);
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
    this.gun.setVisible(!rolling && !w.over && !w.won);
    this.hand.setVisible(!rolling && !w.over && !w.won);
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
      if (d.hitT > 0.07) this.whiteOut(s);
      else if (d.hitT > 0) s.setTint(0xffb0a0);
      else if (warnK >= 0 && this.warnOn(warnK)) this.warnFill(s, warnK);
      else s.clearTint();
    }
    // Enemies (the ones that come back after a restock get their sprites here).
    for (const en of w.enemies) {
      const v = this.enemySprites.get(en.id) ?? this.makeEnemyView(en);
      const s = v.s;
      const warnK = sourceTelegraph(w, en.id);
      // Hop of one pixel while walking (only for sheets without walk frames, which bob by themselves);
      // leans into the charge, back when braking, wobbles when stunned.
      const bob = !en.def.anim?.walk && en.state === 'walk' && Math.floor(en.moved / 5) % 2 === 1 ? -1 : 0;
      const shiver = warnK > 0.6 ? (Math.floor(this.time.now / 40) % 2 === 0 ? 1 : -1) : 0;
      const alt = enemyAltitude(en);
      // Flyers bob up and down; the moth flaps fast, faster when it dives.
      const fly = alt > 0 ? Math.round(Math.sin(this.time.now / 160 + en.id) * 1.5) : 0;
      s.setPosition(Math.round(en.x) + shiver, Math.round(en.y) + bob - alt + fly).setDepth(en.y + (alt > 0 ? 1 : 0));
      s.setScale(en.facing, 1);
      // Breathing, steps, the bulb flickering on, the beaters, the Nevera's open door: enemyFrame.
      const frame = enemyFrame(en, this.time.now);
      s.setFrame(frame);
      let rot = 0;
      if (en.def.brain.kind === 'moth') rot = en.state === 'charge' ? 0.3 * en.facing : 0;
      else if (en.state === 'charge') rot = 0.18 * en.facing;
      else if (en.state === 'brake') rot = -0.12 * en.facing * (1 - en.t / en.until);
      else if (en.state === 'stun') rot = Math.sin(en.t * 22) * 0.2 * (1 - en.t / en.until);
      s.setRotation(rot);
      // The remote switches off like an old TV (squashed to a line, then to a dot) and back on.
      const tv = tvScale(en, v.onAt === undefined ? 1 : (this.time.now - v.onAt) / 1000);
      s.setScale(en.facing * tv.x, tv.y);
      s.setVisible(tv.x > 0 && tv.y > 0);
      v.shadow.setVisible(en.state !== 'gone');
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
          const dy = bl.frameDy?.[frame] ?? 0;
          v.blink.fillStyle(bl.color, 1).fillRect(s.x + lx, s.y + bl.y + dy - en.def.anchor.y, bl.w, bl.h);
        }
        v.blink.setDepth(en.y + 0.1);
      }
      if (en.hitT > 0.07 || tv.white) this.whiteOut(s);
      else if (en.hitT > 0) s.setTint(0xffb0a0);
      // A boss only goes warm while it warns: a white fill would hide its open door.
      else if (warnK >= 0 && this.warnOn(warnK)) {
        if (en.def.boss) s.setTint(warnK > 0.75 ? 0xffe9a8 : 0xffc870);
        else this.warnFill(s, warnK);
      } else s.clearTint();
      if (en.state === 'roar') {
        // Between phases: it shudders and breathes out cold.
        s.setX(s.x + (Math.floor(this.time.now / 50) % 2 === 0 ? 1 : -1));
        if (this.fx.chance(0.2)) this.puff(en.x + this.fx.range(-24, 24), en.y - this.fx.range(10, 60), 0.7);
      }
      if (en.state === 'dying') this.dyingFx(en, v, dt);
      // In TURBO the mixer shakes and throws sparks and batter.
      if (en.turbo) {
        s.setX(s.x + (Math.floor(this.time.now / 45) % 2 === 0 ? 1 : 0));
        if (this.fx.chance(0.12)) this.spark(en.x + en.facing * 7, en.y - 6, this.fx.range(0, Math.PI * 2), this.fx.range(30, 80), this.fx.int(0, 2));
      }
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
    this.drawStatic();
    this.drawFrost(dt);
    this.drawChests(dt);
    this.drawPickups();

    // Bullets.
    const alive = new Set<number>();
    for (const b of w.bullets) {
      alive.add(b.id);
      let s = this.bulletSprites.get(b.id);
      if (!s) {
        const look = b.owner === 'player' ? WEAPONS[b.weapon ?? '']?.look : undefined;
        const tex = b.owner === 'player' ? look?.bullet ?? 'bala-jugador' : BULLET_TEXTURES[b.color];
        s = this.bulletPool.pop()?.setTexture(tex).setVisible(true).setAlpha(1).setRotation(0) ?? this.add.image(b.x, b.y, tex);
        if (look?.turn) s.setRotation(b.dir);
        this.bulletSprites.set(b.id, s);
      }
      // Bigger (or smaller) player bullets from items: the sprite is drawn for the weapon's own radius.
      const wdef = b.owner === 'player' ? WEAPONS[b.weapon ?? ''] : undefined;
      let size = b.owner === 'player' ? b.r / (wdef?.bulletRadius ?? PLAYER_BULLET_R) : 1;
      s.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(b.y + 20);
      if (wdef?.look.turn) s.setRotation(Math.atan2(b.vy, b.vx));
      if (wdef?.id === 'plancha') {
        // Steam swells and thins out as it goes.
        const k = b.age / (b.age + b.life);
        size *= 0.75 + 0.6 * k;
        s.setAlpha(1 - 0.45 * k);
      }
      // Loyalty cards spin as they fly.
      if (b.color === 'card' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 70 + b.id) % 4);
      const sc = (b.life < 0.15 ? 0.6 : 1) * size;
      s.setScale(sc);
    }
    for (const [id, s] of this.bulletSprites) {
      if (!alive.has(id)) {
        this.bulletPool.push(s.setVisible(false));
        this.bulletSprites.delete(id);
      }
    }

    this.updateParticles(dt);
    this.updateHud(dt);
    this.updateCamera(dt);
  }

  /**
   * Chests: shut (the light blinks red now and then) or open; they drop in from above when they
   * turn up and the lid jumps when they open.
   */
  private drawChests(dt: number): void {
    const alive = new Set<number>();
    for (const pr of this.world.room.props) {
      const c = pr.chest;
      if (!c) continue;
      alive.add(c.id);
      let v = this.chestSprites.get(c.id);
      if (!v) {
        // Only one that just turned up drops in (one already there when the room was built does not).
        v = { s: this.add.image(pr.x, pr.y, 'cofre', c.open ? 1 : 0).setOrigin(0.5, 1).setDepth(pr.y), open: c.open, pop: this.chestDrop ? 0.35 : 0 };
        this.chestDrop = false;
        this.chestSprites.set(c.id, v);
      }
      if (c.open && !v.open) {
        v.open = true;
        v.pop = 0.2;
      }
      v.pop = Math.max(0, v.pop - dt);
      // Turning up it falls from 30 px; opening, it hops 2 px.
      const lift = !v.open ? Math.round(v.pop * v.pop * 240) : Math.round(Math.sin((v.pop / 0.2) * Math.PI) * 2);
      v.s.setFrame(c.open ? 1 : 0).setPosition(pr.x, pr.y - lift);
      const blink = !c.open && Math.floor(this.time.now / 120 + c.id) % 14 === 0;
      if (blink) v.s.setTint(0xffd0c8);
      else v.s.clearTint();
    }
    for (const [id, v] of this.chestSprites) {
      if (alive.has(id)) continue;
      v.s.destroy();
      this.chestSprites.delete(id);
    }
  }

  /** Coupons hop out when they drop, then lie there glinting now and then. */
  private drawPickups(): void {
    const alive = new Set<number>();
    for (const k of this.world.pickups) {
      alive.add(k.id);
      let v = this.pickupSprites.get(k.id);
      if (!v) {
        const heart = k.kind === 'corazon';
        const arm = k.kind === 'arma' ? WEAPONS[k.weapon ?? ''] : undefined;
        const item = k.kind === 'objeto' ? ITEMS[k.item ?? ''] : k.kind === 'activo' ? ACTIVE_ITEMS[k.item ?? ''] : undefined;
        const good = k.price !== undefined && (k.kind === 'corazon' || k.kind === 'ticket') ? { sprite: k.kind === 'corazon' ? 'corazon-suelo' : 'ticket', name: GOOD_NAMES[k.kind] } : null;
        const shown = arm ? { sprite: arm.look.sprite, name: arm.name } : item ? { sprite: item.sprite, name: item.name } : good;
        if (shown) {
          v = {
            s: this.add.image(k.x, k.y, shown.sprite).setOrigin(0.5, 1),
            shadow: this.add.image(k.x, k.y, shadowTexture(this, 8, 3)).setDepth(-50000),
            label: this.add.bitmapText(k.x, k.y - 26, FONT, fontText(shown.name), 8).setOrigin(0.5, 1).setTint(0xf6c431).setDepth(84000).setAlpha(0),
          };
        } else {
          const key = heart ? 'corazon-suelo' : k.kind === 'ticket' ? 'ticket' : 'cupon';
          v = { s: this.add.image(k.x, k.y, key, 0).setOrigin(0.5, 1), shadow: this.add.image(k.x, k.y, shadowTexture(this, heart ? 5 : 4, 2)).setDepth(-50000) };
        }
        if (k.price !== undefined) {
          // For sale: its price under the stand, with a coupon (gold if it can be paid, grey if not).
          v.price = this.add.bitmapText(k.x + 5, k.y + 8, FONT, String(k.price), 8).setOrigin(0.5, 0).setDepth(k.y + 1);
          v.priceIcon = this.add.image(k.x - 5 - Math.ceil(v.price.width / 2), k.y + 8, 'cupon', 0).setOrigin(0.5, 0).setDepth(k.y + 1);
          v.shadow.setVisible(false);
        }
        this.pickupSprites.set(k.id, v);
      }
      if (v.price && k.price !== undefined) {
        const p = this.world.player;
        const can = p.coupons >= k.price && !(k.kind === 'corazon' && p.hp >= p.def.maxHp);
        v.price.setTint(can ? 0xf6c431 : 0x858ea8);
        v.priceIcon?.setTint(can ? 0xffffff : 0x858ea8);
      }
      if (k.kind === 'arma' || k.kind === 'objeto' || k.kind === 'activo' || k.price !== undefined) {
        // A weapon (or an item) floats over its spot, turning a little and glinting; its name shows up close.
        const t = this.time.now / 1000 + k.id;
        const glintW = Math.floor(this.time.now / 80 + k.id * 5) % 24 === 0;
        v.s.setPosition(Math.round(k.x), Math.round(k.y - 7 - Math.sin(t * 2.4) * 2)).setDepth(k.y).setRotation(Math.sin(t * 1.3) * 0.12);
        if (glintW) this.whiteOut(v.s);
        else v.s.clearTint();
        v.shadow.setPosition(Math.round(k.x), Math.round(k.y)).setScale(1 - Math.sin(t * 2.4) * 0.12, 1);
        const p = this.world.player;
        const near = Math.hypot(p.x - k.x, p.y - k.y) < 56;
        v.label?.setPosition(Math.round(k.x), Math.round(k.y - (k.kind === 'arma' ? 22 : k.kind === 'corazon' || k.kind === 'ticket' ? 21 : 26) - Math.sin(t * 2.4) * 2)).setAlpha(near ? 1 : 0);
        continue;
      }
      const hop = k.age < PICKUP_DELAY ? Math.sin((Math.PI * k.age) / PICKUP_DELAY) * 12 : Math.max(0, Math.sin(this.time.now / 260 + k.id)) * 1.5;
      // Hearts glint more often, so they are noticed on the floor.
      const glint = Math.floor(this.time.now / 90 + k.id * 7) % (k.kind === 'cupon' ? 16 : 6) === 0;
      v.s.setPosition(Math.round(k.x), Math.round(k.y - hop)).setFrame(glint ? 1 : 0).setDepth(k.y);
      v.shadow.setPosition(Math.round(k.x), Math.round(k.y));
    }
    for (const [id, v] of this.pickupSprites) {
      if (alive.has(id)) continue;
      v.s.destroy();
      v.shadow.destroy();
      v.label?.destroy();
      v.price?.destroy();
      v.priceIcon?.destroy();
      this.pickupSprites.delete(id);
    }
  }

  /**
   * Frost: a ball flies in an arc while a ring closes on where it will land (and its shadow
   * slides there); then the patch lies on the floor, sparkling, and blinks before it melts.
   * The toaster walking on it is tinted cold and kicks up rime.
   */
  private drawFrost(dt: number): void {
    const g = this.warn;
    const alive = new Set<number>();
    for (const f of this.world.frost) {
      alive.add(f.id);
      let v = this.frostViews.get(f.id);
      if (!v) {
        const ball = f.product !== undefined ? this.add.image(f.fromX, f.fromY, 'producto-caducado', f.product) : this.add.image(f.fromX, f.fromY, 'bola-escarcha');
        v = { ball, shadow: this.add.image(f.fromX, f.fromY, shadowTexture(this, 4, 2)).setDepth(-50000), patch: null };
        this.frostViews.set(f.id, v);
      }
      if (f.t < 0) {
        const k = 1 + f.t / f.flight;
        const x = f.fromX + (f.x - f.fromX) * k;
        const y = f.fromY + (f.y - f.fromY) * k;
        const h = f.fromH * (1 - k) + Math.sin(Math.PI * k) * 46;
        v.ball.setPosition(Math.round(x), Math.round(y - h)).setDepth(y + 30).setRotation(k * (f.product !== undefined ? 4 : 6));
        v.shadow.setPosition(Math.round(x), Math.round(y));
        // Where it will land: a cold ring that closes in, over a dark ellipse.
        const rx = Math.round(f.r * (1.35 - 0.35 * k));
        const ry = Math.round(rx * FROST_FLAT);
        g.fillStyle(0x0e0c16, 0.18 + 0.2 * k).fillEllipse(Math.round(f.x), Math.round(f.y), f.r * 2, f.r * 2 * FROST_FLAT);
        pixelEllipse(g, Math.round(f.x), Math.round(f.y) + 1, rx, ry, 0x0e0c16);
        // Frost marks its spot in cyan; expired products, in red.
        if (k < 0.85 || Math.floor(this.time.now / 60) % 2 === 0) pixelEllipse(g, Math.round(f.x), Math.round(f.y), rx, ry, f.product !== undefined ? 0xe0453b : 0x69dbd8);
        continue;
      }
      if (v.ball.visible) {
        v.ball.setVisible(false);
        v.shadow.setVisible(false);
      }
      if (!v.patch) v.patch = this.add.sprite(Math.round(f.x), Math.round(f.y), 'escarcha', 0).setDepth(-60000);
      const left = f.life - f.t;
      const pop = Math.min(1, f.t / 0.12);
      v.patch.setScale(0.5 + 0.5 * pop).setFrame(Math.floor(this.time.now / 420 + f.id) % 2);
      // Melting: it blinks for its last second.
      v.patch.setAlpha(left < 1 ? (Math.floor(this.time.now / 90) % 2 === 0 ? 0.35 : 0.85) : 1);
    }
    for (const [id, v] of this.frostViews) {
      if (alive.has(id)) continue;
      v.ball.destroy();
      v.shadow.destroy();
      v.patch?.destroy();
      this.frostViews.delete(id);
    }
    const p = this.world.player;
    if (!this.world.over && frostSlow(this.world, p.x, p.y) < 1) {
      if (this.flashHero <= 0 && !(p.invulnerable > 0 && !isRolling(p))) this.hero.setTint(0xbfeff0);
      if (Math.hypot(p.vx, p.vy) > 10 && this.fx.chance(dt * 14)) this.iceShard(p.x + this.fx.range(-4, 4), p.y);
    }
  }

  /** Where a remote is about to switch back on, the floor crackles with TV static. */
  private drawStatic(): void {
    const g = this.warn;
    for (const en of this.world.enemies) {
      if (!en.dest || (en.state !== 'blink' && en.state !== 'gone')) continue;
      const b = en.def.brain;
      if (b.kind !== 'blinker') continue;
      // 0 when it starts switching off, 1 when it reappears.
      const k = en.state === 'blink' ? (en.t / en.until) * 0.35 : 0.35 + (en.t / en.until) * 0.65;
      const x = Math.round(en.dest.x);
      const y = Math.round(en.dest.y);
      const h = Math.round(6 + 18 * k);
      g.fillStyle(0x0e0c16, 0.35).fillEllipse(x, y, 16, 5);
      const n = Math.round(16 + 60 * k);
      for (let i = 0; i < n; i++) {
        const px = x + this.fx.int(-7, 7);
        const py = y - this.fx.int(0, h);
        const c = this.fx.pick([0xf4f1e8, 0xb7bed0, 0x858ea8, 0x5a627c]);
        g.fillStyle(c, 1).fillRect(px, py, 1, 1);
      }
      // A rolling bright line, like a badly tuned channel.
      const ly = y - Math.floor((this.time.now / 25) % (h + 1));
      g.fillStyle(0xf4f1e8, 0.9).fillRect(x - 7, ly, 15, 1);
    }
  }

  private drawWarnings(): void {
    const g = this.warn;
    g.clear();
    for (const wn of activeWarnings(this.world)) {
      const k = wn.k;
      const col = wn.color === 'red' ? 0xe0453b : 0x69dbd8;
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

  /** Whether the floor point (x, y) is a wall or inside a prop (where debris cannot lie). */
  private solidFloor(x: number, y: number): boolean {
    const room = this.world.room;
    return isWallAt(room, x, y) || room.props.some((pr) => pointInRect(x, y, pr.box));
  }

  private updateParticles(dt: number): void {
    const keep: Particle[] = [];
    for (const q of this.particles) {
      q.life -= dt;
      if (q.life <= 0) {
        q.s.destroy();
        continue;
      }
      if (q.gravity) {
        // Pieces on the floor bounce off walls and boxes instead of going through them.
        const nx = q.s.x + q.vx * dt;
        if (this.solidFloor(nx, q.s.y)) q.vx *= -0.4;
        else q.s.x = nx;
        const ny = q.s.y + q.vy * dt;
        if (this.solidFloor(q.s.x, ny)) q.vy *= -0.4;
        else q.s.y = ny;
      } else {
        q.s.x += q.vx * dt;
        q.s.y += q.vy * dt;
      }
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
      f.age = (f.age ?? 0) + dt;
      fk.push(f);
    }
    this.floats = fk;
  }

  /**
   * One heart per 2 life and one pip per round, rebuilt when an item changes the maximum life or
   * the magazine; the gun icon sits left of the pips.
   */
  private syncHudSlots(): void {
    const p = this.world.player;
    const maxHearts = Math.ceil(p.def.maxHp / 2);
    const drop = (o: Phaser.GameObjects.Image): void => {
      this.hudObjs = this.hudObjs.filter((h) => h !== (o as unknown));
      o.destroy();
    };
    while (this.hearts.length > maxHearts) drop(this.hearts.pop()!);
    while (this.itemIcons.length < p.items.length) {
      const def = ITEMS[p.items[this.itemIcons.length]!];
      const icon = this.hud(this.add.image(8, VIEW_H - 37, def?.sprite ?? 'objeto-caja').setOrigin(0, 0));
      icon.setVisible(this.gunIcon.visible);
      this.itemIcons.push(icon);
    }
    while (this.hearts.length < maxHearts) {
      const h = this.hud(this.add.image(8, 8, 'corazones', 0).setOrigin(0, 0));
      h.setVisible(this.gunIcon.visible);
      this.hearts.push(h);
    }
    const mag = p.weapon.def.magazine;
    if (this.ammoPips.length !== mag) {
      for (const s of this.ammoPips) drop(s);
      this.ammoPips = [];
      const l = this.computeLayout();
      for (const at of l.pips) {
        const pip = this.hud(this.add.image(at.x, at.y, 'municion', 0).setOrigin(0, 0));
        pip.setVisible(this.gunIcon.visible);
        this.ammoPips.push(pip);
      }
      this.gunIcon.setPosition(l.gun.x, l.gun.y);
    }
  }

  /** The controls hint, with the keys as they are now (Opciones › Teclas may have changed them). */
  refreshHint(): void {
    this.hintText = fontText(controlsHint(keyWords()) + (this.world.room.kind === 'test' ? ` · ${TEST_ROOM_HINT}` : ''));
  }

  /** Where everything on the HUD goes right now (see src/render/hud.ts). */
  private computeLayout(): HudLayout {
    const p = this.world.player;
    return hudLayout({
      hearts: Math.ceil(p.def.maxHp / 2),
      coupons: p.coupons,
      tickets: p.tickets,
      hasActive: !!p.active,
      items: p.items.length,
      magazine: p.weapon.def.magazine,
      mapW: this.mapSize.w,
      mapH: this.mapSize.h,
      hint: this.hintT > 0 ? this.hintText : null,
      bigText: settings().bigText,
    });
  }

  /** Puts every HUD piece where the layout says and draws the plates behind them. */
  private placeHud(layout: HudLayout): void {
    let l = layout;
    // The items glide to a new place 1 px a frame (when the controls hint goes, they move down a
    // row), their plate with them; a new icon, or one far away, goes straight there.
    let lag = 0;
    this.itemIcons.forEach((icon, i) => {
      const at = l.items[i];
      if (!at) return;
      const dx = at.x - icon.x;
      const dy = at.y - icon.y;
      if (!icon.getData('placed') || Math.abs(dx) + Math.abs(dy) > 40) icon.setPosition(at.x, at.y).setData('placed', true);
      else icon.setPosition(icon.x + Math.sign(dx), icon.y + Math.sign(dy));
      if (i === 0) lag = icon.y - at.y;
    });
    if (l.itemsBox && lag) l = { ...l, itemsBox: { ...l.itemsBox, y: l.itemsBox.y + lag } };
    this.hearts.forEach((h, i) => h.setX(l.hearts[i]?.x ?? 8));
    this.hint.forEach((t, i) => {
      const line = l.hintLines[i];
      t.setText(line?.text ?? '');
      if (line) t.setPosition(line.x, line.y);
    });
    this.activeSlot.setVisible(!!l.active && this.gunIcon.visible);
    const g = this.hudPlates;
    g.clear();
    if (!this.gunIcon.visible) return;
    const plate = (b: Box | null, alpha = 1): void => {
      if (!b || alpha <= 0) return;
      g.fillStyle(0x0e0c16, 0.62 * alpha).fillRect(b.x, b.y, b.w, b.h);
      g.lineStyle(1, 0x3a3f5c, 0.9 * alpha).strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    };
    plate(l.status);
    plate(l.weapon);
    plate(l.itemsBox);
    plate(l.hintBox, this.hint[0]!.alpha);
  }

  /**
   * The active item's slot: its sprite (dim until charged), one mark per battery it needs to
   * the right (lit as they fill), a shake when Q finds it flat and a flash when it fills or goes off.
   */
  private updateActiveSlot(dt: number): void {
    const a = this.world.player.active;
    const def = a ? ACTIVE_ITEMS[a.id] : undefined;
    const g = this.activeMarks;
    g.clear();
    this.activeShake = Math.max(0, this.activeShake - dt);
    this.activeFlash = Math.max(0, this.activeFlash - dt);
    this.holdWash.setAlpha(this.world.holdT > 0 ? 0.16 + Math.sin(this.time.now / 120) * 0.03 : 0);
    if (!a || !def || !this.gunIcon.visible) {
      this.activeIcon.setVisible(false);
      return;
    }
    const ready = a.charge >= def.charges;
    const shake = this.activeShake > 0 ? Math.round(Math.sin(this.activeShake * 60) * 2) : 0;
    if (this.activeIcon.texture.key !== def.sprite) this.activeIcon.setTexture(def.sprite);
    this.activeIcon.setVisible(true).setX(9 + shake).setAlpha(ready ? 1 : 0.55);
    if (this.activeFlash > 0 && Math.floor(this.activeFlash * 20) % 2 === 0) this.whiteOut(this.activeIcon);
    else this.activeIcon.clearTint();
    // Battery marks: a column of segments right of the slot, filling from the bottom.
    const h = Math.max(2, Math.floor(16 / def.charges) - 1);
    for (let i = 0; i < def.charges; i++) {
      const y = 49 - (i + 1) * (h + 1) + 1;
      g.fillStyle(0x0e0c16, 1).fillRect(28, y - 1, 5, h + 2);
      g.fillStyle(i < a.charge ? (ready ? 0x58b45a : 0xf6c431) : 0x3a3f5c, 1).fillRect(29, y, 3, h);
    }
    // Ready: a small «Q» blinks under the slot.
    if (ready && Math.floor(this.time.now / 400) % 2 === 0) g.fillStyle(0x58b45a, 1).fillRect(12, 52, 10, 1);
  }

  private updateHud(dt: number): void {
    const p = this.world.player;
    const bp = this.bannerPlate;
    bp.clear();
    const ba = this.banner.alpha;
    if (ba > 0 && this.banner.visible && this.banner.text) {
      const b = this.banner.getBounds();
      const x = Math.round(b.x) - 4;
      const y = Math.round(b.y) - 2;
      const w = Math.round(b.width) + 8;
      const h = Math.round(b.height) + 3;
      bp.fillStyle(0x0e0c16, 0.62 * ba).fillRect(x, y, w, h);
      bp.lineStyle(1, 0x3a3f5c, 0.9 * ba).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }
    this.syncHudSlots();
    const l = this.computeLayout();
    this.layout = l;
    this.placeHud(l);
    this.heartHitT = Math.max(0, this.heartHitT - dt);
    this.hearts.forEach((h, i) => {
      const hp = p.hp - i * 2;
      h.setFrame(hp >= 2 ? 0 : hp === 1 ? 1 : 2);
      // The heart that just lost a half jumps and blinks white; with one half left, the last heart beats.
      const hit = i === this.heartHit && this.heartHitT > 0;
      const beat = p.hp === 1 && i === 0 && Math.floor(this.time.now / 300) % 3 === 0;
      h.setY(8 - (hit && this.heartHitT > 0.35 ? 2 : 0) - (beat ? 1 : 0));
      if (hit && Math.floor(this.heartHitT * 16) % 2 === 0) this.whiteOut(h);
      else h.clearTint();
    });
    this.hurtFlash.setAlpha(Math.max(0, this.hurtFlash.alpha - dt * 1.6));
    this.updateActiveSlot(dt);
    this.couponText.setText(String(p.coupons));
    // Coupons: the counter jumps when one comes in, and shakes red when the shop says no.
    const cp = this.couponPop;
    this.couponPop = cp > 0 ? Math.max(0, cp - dt) : Math.min(0, cp + dt);
    const cshake = cp < 0 ? Math.round(Math.sin(this.time.now / 25) * 1.5) : 0;
    this.couponIcon.setPosition(l.coupon.x + cshake, l.coupon.y - (cp > 0.12 ? 2 : 0));
    this.couponText.setX(l.couponText.x + cshake).setTint(cp < 0 ? 0xe0453b : cp > 0 ? 0xfff1a8 : 0xf6c431);
    // Tickets: the counter jumps when one comes in or goes, and shakes red at a locked chest.
    this.ticketText.setText(String(p.tickets));
    const tp = this.ticketPop;
    this.ticketPop = tp > 0 ? Math.max(0, tp - dt) : Math.min(0, tp + dt);
    const shake = tp < 0 ? Math.round(Math.sin(this.time.now / 25) * 1.5) : 0;
    this.ticketIcon.setPosition(l.ticket.x + shake, l.ticket.y - (tp > 0.15 ? 2 : 0));
    this.ticketText.setX(l.ticketText.x + shake).setTint(tp < 0 ? 0xe0453b : tp > 0 ? 0xfff1a8 : 0xf4f1e8);
    const ws = p.weapon;
    if (this.gunIcon.texture.key !== ws.def.look.sprite) this.gunIcon.setTexture(ws.def.look.sprite);
    if (this.gun.texture.key !== ws.def.look.sprite) this.gun.setTexture(ws.def.look.sprite);
    this.weaponNameT = Math.max(0, this.weaponNameT - dt);
    this.weaponName.setY(this.ammoText.y - 11).setAlpha(Math.min(1, this.weaponNameT * 3));
    this.arsenalMarks.clear();
    if (p.arsenal.length > 1 && this.gunIcon.visible) {
      p.arsenal.forEach((_, i) => {
        const x = Math.round(this.gunIcon.x) + 9 - p.arsenal.length * 3 + i * 6;
        this.arsenalMarks.fillStyle(0x0e0c16, 1).fillRect(x - 1, VIEW_H - 4, 6, 3);
        this.arsenalMarks.fillStyle(i === p.slot ? 0xf6c431 : 0x5a627c, 1).fillRect(x, VIEW_H - 3, 4, 1);
      });
    }
    this.ammoPips.forEach((s, i) => s.setFrame(i < ws.ammo ? 0 : 1));
    // Above the second row of pips when the magazine is long.
    this.ammoText.setY(l.ammoText.y);
    this.ammoText.setText(ws.reload > 0 ? fontText(RELOADING) : `${ws.ammo}/${ws.def.magazine}`);
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
      if (this.hintT < 1) for (const h of this.hint) h.setAlpha(Math.max(0, this.hintT));
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
    // Fighting a boss, the camera leans towards it too, so it stays in the picture (but never so
    // much that the toaster leaves it).
    const boss = this.camFocus ? undefined : this.world.enemies.find((en) => en.def.boss);
    let tx = this.camFocus ? this.camFocus.x - VIEW_W / 2 : p.x + lx - VIEW_W / 2;
    let ty = this.camFocus ? this.camFocus.y - VIEW_H / 2 : p.y - BODY_HEIGHT + ly - VIEW_H / 2;
    if (boss) {
      // The whole boss (crown included) in the picture whenever it fits with the toaster; the
      // toaster always, clear of the corners of the HUD and the boss's life bar.
      const hb = boss.def.hurt;
      tx = frameAxis(tx, { lo: p.x - 70, hi: p.x + 70 }, { lo: boss.x + hb.x - 6, hi: boss.x + hb.x + hb.w + 6 }, VIEW_W);
      ty = frameAxis(ty, { lo: p.y - BODY_HEIGHT - 30, hi: p.y + 30 }, { lo: boss.y + hb.y - 26, hi: boss.y + 6 }, VIEW_H);
    }
    const k = 1 - Math.pow(this.camFocus ? 0.02 : 0.0005, dt);
    this.camX += (tx - this.camX) * k;
    this.camY += (ty - this.camY) * k;
    const room = this.world.room;
    this.camX = Math.max(0, Math.min(room.w - VIEW_W, this.camX));
    this.camY = Math.max(0, Math.min(room.h - VIEW_H, this.camY));
    cam.setScroll(Math.round(this.camX), Math.round(this.camY));
  }
}

/** Enemy bullet sprites by colour: the boss's ice is a cube. */
/** Radius the player's bullet sprite is drawn for (the hair dryer's). */
const PLAYER_BULLET_R = 3;
const BULLET_TEXTURES: Record<BulletColor, string> = { red: 'bala-roja', cyan: 'bala-cian', ice: 'bala-cubito', card: 'bala-tarjeta' };

/** Rectangles of a sprite (px from its top-left) that blink, drawn over it in `color`. */
const SPRITE_BLINKS: Record<string, { x: number; y: number; w: number; h: number; color: number; frameDy?: Record<number, number> }> = {
  // Frame 1 is its breath out: the body (and the clock) 1 px lower.
  microondas: { x: 22, y: 14, w: 4, h: 1, color: 0x0e0c16, frameDy: { 1: 1 } },
};

/** Lights drawn around an enemy (`y` px above its feet, radius `r`) while it is lit. */
const SPRITE_GLOWS: Record<string, { y: number; r: number; color: number }> = {
  bombilla: { y: 23, r: 26, color: 0xfff1a0 },
};

/** The boss's life bar: its parts, and the life it showed (the white trail catches up with it). */
interface BossBarView {
  boss: number;
  name: Phaser.GameObjects.BitmapText;
  g: Phaser.GameObjects.Graphics;
  /** Life fraction drawn by the white trail, and by the red fill (it fills up on arrival). */
  trail: number;
  fill: number;
  /** Seconds the bar keeps flashing (a phase change). */
  flash: number;
  /** Fades out once the boss is gone. */
  alpha: number;
}

const BOSS_BAR_W = 200;
const BOSS_BAR_H = 5;
const BOSS_BAR_Y = VIEW_H - 13;

interface EnemyView {
  /** When a remote last switched back on (ms), for the TV «switch on» animation. */
  onAt?: number;
  s: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  blink?: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Graphics;
}

/**
 * Whether a bulb is lit now. While switching on it flickers like an energy-saving bulb: short,
 * uneven flashes that get longer until it stays on.
 */

const TV_ON_TIME = 0.16;

/**
 * Scale of a remote switching off like an old TV: first it flattens into a white line, then the line
 * shrinks to a dot and is gone. Switching on (`sinceOn` s after) is the same backwards, faster.
 */
function tvScale(en: Enemy, sinceOn: number): { x: number; y: number; white: boolean } {
  if (en.state === 'gone') return { x: 0, y: 0, white: true };
  if (en.state === 'blink') {
    const k = Math.min(1, en.t / en.until);
    if (k < 0.6) return { x: 1 + k * 0.3, y: Math.max(0.06, 1 - k / 0.6), white: k > 0.25 };
    const j = (k - 0.6) / 0.4;
    return { x: Math.max(0.05, 1.18 * (1 - j)), y: 0.06, white: true };
  }
  if (sinceOn < TV_ON_TIME) {
    const k = sinceOn / TV_ON_TIME;
    if (k < 0.45) return { x: Math.max(0.05, k / 0.45), y: 0.06, white: true };
    return { x: 1, y: Math.max(0.06, (k - 0.45) / 0.55), white: k < 0.75 };
  }
  return { x: 1, y: 1, white: false };
}

/** Blinks faster as the warning runs out (k from 0 to 1). */
function blinkOn(k: number): boolean {
  const hz = 5 + 13 * k;
  return Math.floor(k * hz) % 2 === 0;
}

/** A 1-px circle with no anti-aliasing (midpoint algorithm), to match the pixel art. */
/** A 1-px ellipse outline, plotted point by point so it stays crisp. */
function pixelEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, color: number): void {
  g.fillStyle(color, 1);
  const n = Math.max(16, Math.round((rx + ry) * 3));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
}

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
