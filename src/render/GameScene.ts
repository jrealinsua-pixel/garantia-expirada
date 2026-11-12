// Draws the simulation and plays its events. Phaser only draws and reads input: all the rules
// live in src/sim/.
import { deedsOf } from '../sim/achievements.ts';
import { paintRoom } from '../art/room.ts';
import { FONT_LINE, fontText, textWidth, wrapLines } from '../art/font.ts';
import { CHEST_NAME_PREMIUM } from '../data/texts.ts';
import { CHEST_LOCKED_LINES, CHEST_NAME, CHEST_OPEN_LINES, controlsHint, RELOADING, swapHint, TEST_ROOM_HINT, SYNERGY_LINE, TICKET_LINE, WEAPON_FOUND_LINES } from '../data/texts.ts';
import { SYNERGIES } from '../data/synergies.ts';
import { FINANCE, financeHearts, GOOD_NAMES, RAFFLE, RAFFLE_PRIZES, SHOPKEEPER } from '../data/shop.ts';
import { activeLines, modifierLines, weaponLines, type EffectLine } from '../data/describe.ts';
import { WEAPONS } from '../data/weapons.ts';
import { ACTIVE_ITEMS, ITEMS } from '../data/items.ts';
import { INTERACT_VERBS, interactPrompt, REPORT_MENU_HINT } from '../data/texts.ts';
import { ACTIVE_LINES, DAILY_GIFT_KIND, dailyReportLine, itemKindActive, ITEM_KIND_PASSIVE, itemKindWeapon, NO_CHARGE_LINE } from '../data/texts.ts';
import { BOSS_CARD_SKIP, BOSS_CARD_SUBTITLE, BOSS_DOWN_LINE, BOSS_DOWN_STAMP, bossPhaseLabel, HEART_LINE, LIFT_LINE, SERVICE_LIFT_LINE, SERVICE_WON_LINE } from '../data/texts.ts';
import { SPECIAL_HEARTS } from '../data/hearts.ts';
import { SURGE_HIT_LINE, SURGE_LINE, TURBO_END_LINE } from '../data/texts.ts';
import { characterDown } from '../data/bajas.ts';
import { RUN_WIN_HINT, RUN_WIN_STAMP, RUN_WIN_TITLE, runWinReport, SHIELD_GONE_LINE, SHIELD_HIT_LINE, SHIELD_LINE, WIN_HINT, WIN_HINT_NEXT, WIN_STAMP, WIN_TITLE, winReport } from '../data/texts.ts';
import {
  DOORS_OPEN_LINES,
  DOWN_HINT,
  DOWN_STAMP,
  DOWN_TITLE,
  downReport,
  RESTOCK_LINE,
  CRIT_LINE,
  JAM_LINE,
  WIND_DOWN_LINE,
  SHRED_JAM_LINE,
  COPY_LINE,
  AC_LINE,
  turnCallLine,
  turnNumber,
  TURN_LOST_LINE,
  TURN_SERVED_LINE,
  TAPE_BUMP_LINE,
  TAPE_SNAP_LINE,
  TYPING_LINE,
  FAQ_LINE,
  HELP_ASK_LINE,
  TRANSFER_LINE,
  HOLD_LINE,
  DEPARTMENT_NAMES,
  DEPT_MARK_LINE,
  MUTE_LINE,
  deptTransferLine,
  MENU_INTRO_LINES,
  menuOptionLine,
  ROLL_DENIED_LINE,
  STAMP_LINE,
  TONER_OUT_LINE,
  STALL_LINE,
  BRICK_LINE,
  REVEAL_LINE,
  REC_LINE,
  REC_LOST_LINE,
  ALERT_LINE,
  REVIVE_LINE,
  SHRUG_LINE,
  MUG_LOST_LINE,
  TRIAL_END_LINE,
  punchLine,
  EXPIRED_LINE,
  RECORDED_LINE,
  COMPLAINT_LINE,
  starsLine,
  meritLine,
  MERIT_LOST_LINE,
  PHONE_OFF_LINE,
  PHONE_ON_LINE,
  STARS_PAID_LINE,
  STARS_LOST_LINE,
  queueLine,
  PET_DEAD_LINE,
  petFedLine,
  ALLEN_LINE,
  TURBO_LINE,
  archiveHint,
  boardHint,
  hubHint,
  docFoundLine,
} from '../data/texts.ts';
import { BACK_WALL_ROWS, doorCells, isWallAt, TILE } from '../sim/room.ts';
import { pointInRect } from '../sim/vec.ts';
import { minimap, type MapLoot } from '../sim/minimap.ts';
import {
  activeWarnings,
  addModifier,
  phoneIsOff,
  createWorld,
  LAST_LEVEL,
  SERVICE_LEVEL,
  topLevelOf,
  leaveHub,
  nearStation,
  LIFT_READY,
  nextFloor,
  shopPrice,
  canFinance,
  PICKUP_DELAY,
  DT,
  enemyAltitude,
  isDead,
  FROST_FLAT,
  frostSlow,
  inFrost,
  gunPivot,
  isRolling,
  onLowProp,
  sourceTelegraph,
  step,
  BODY_HEIGHT,
} from '../sim/world.ts';
import { dropHeart, dropTicket, giveActive, giveItem, interactable, placeChest, setCharacter, type DownCause, type Enemy, type SimEvent, type World } from '../sim/world.ts';
import { pairUp, spawnEnemy, tapesOf, TIP_FACING, PLAYER_HURT_Y, type HeartKind, type Player } from '../sim/world.ts';
import { dummyHurtBox, type Dummy } from '../sim/world.ts';
import { MARKDOWN_LINES } from '../data/texts.ts';

/** What the toaster has on loan after its hearts, in the order it pays: surge, warranties, turbo. */
function loanIcons(p: Player): { key: string; half: boolean }[] {
  const out: { key: string; half: boolean }[] = [];
  if (p.surge > 0) out.push({ key: SPECIAL_HEARTS.sobretension.hud, half: p.surge < 2 });
  for (let i = 0; i < Math.ceil(p.shield / 2); i++) out.push({ key: 'garantias-hud', half: p.shield - i * 2 < 2 });
  if (p.turbo) out.push({ key: SPECIAL_HEARTS.turbo.hud, half: false });
  return out;
}
import type { Modifier } from '../data/types.ts';
import { Rng } from '../sim/rng.ts';
import { ENEMIES } from '../data/enemies.ts';
import type { BulletColor } from '../sim/patterns.ts';
import { Sound } from './audio.ts';
import { Controls } from './input.ts';
import { keyWords, readScale, screenFlashAlpha, settings, SOFT_FLASH_TINT } from './settings.ts';
import { profile, saveChosen, saveDaily, saveEnding, saveFloor, saveRun } from './save.ts';
import { dailyGift, startDaily } from '../sim/daily.ts';
import { chatarreroHere, stationPages } from '../sim/dialogue.ts';
import type { PropInstance, StationKind, TipSide } from '../sim/room.ts';
import { departmentOf, departmentRect, isSpinning, MENU_ZONE_H, MENU_ZONE_W } from '../sim/enemies.ts';
import { exhibited, nextExhibited, playableNow, rosterBoard, serviceBoard } from '../sim/unlocks.ts';
import { CHARACTERS } from '../data/characters.ts';
import { boardLayout, type BoardEntry, type BoardRole } from './board.ts';
import { citaLayout, type CitaRole } from './cita.ts';
import { archiveLayout, type ArchiveRole } from './archivo.ts';
import { archive, firstCursor, nextCursor, type ArchiveCursor } from '../sim/archive.ts';
import { LORE } from '../data/lore.ts';

/** A piece of the tablón panel: it slides and fades. */
type BoardPart = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle;

/** How far above a station's spot of the Mostrador its bubble goes (px; the Caja uses the till's). */
/** Frame of the `mesa` sheet for each way a tipped table faces (0 is standing). */
const TABLE_FRAME: Record<TipSide, number> = { N: 1, S: 2, E: 3, W: 4 };
/** Seconds the table takes to go over (the drawing; the simulation tips it at once). */
const TIP_ANIM = 0.18;
const STATION_TOP: Record<StationKind, number> = { caja: 46, telefono: 50, turnos: 34, chatarrero: 34, tablon: 52, archivador: 34, cita: 52 };
import { BOARD_CARDS, CITA_BOXES, CITA_STAMP, CITA_W, TAPE_Y, WALL_BOARD_Y, WALL_CITA_Y, WALL_PHONE_Y, WALL_SIGN_Y } from '../art/hub.ts';
import { addCanvasTexture, FONT, shadowTexture } from './textures.ts';
import { frameAxis, scrollRange } from './camera.ts';
import { formLayout, STAMP_SCALE, type FormRole } from './form.ts';
import { slipLayout, type SlipRole } from './ficha.ts';
import { returnSlip, slipHint, slipNumber, STORIES } from '../data/stories.ts';
import { BOSS_BAR, bossBarVeiled, cardLayout, departmentLabelBox, hudLayout, splitTitle, titleLines, stackFloat, TITLE_TOP, titleX, type Box, type HudLayout } from './hud.ts';
import { bulbLit, enemyFrame, spinMirrored } from './enemyAnim.ts';

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
  /** Lines with the same key (one per source) do not pile up. */
  key?: string;
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
  /** The return slip that opens a run (M13), while it is up: read out, stamped, and what it says so far. */
  slip: { read: boolean; stamped: boolean; text: string } | null;
}

/** Pixels of a rolled-up shutter still showing under the lintel (with its pilot light). */
const SHUTTER_ROLLED = 9;
/** Minimap: size of a room and distance between rooms (px on the 480 x 270 screen). */
const MAP_CELL_W = 11;
const MAP_CELL_H = 8;
const MAP_STEP_X = 13;
const MAP_STEP_Y = 10;
/** Minimap icons (5 px wide at most), drawn in the middle of the room. */
const MAP_ICONS: Partial<Record<string, { rows: string[]; color: number }>> = {
  // A skull: the boss.
  boss: { rows: ['.###.', '#.#.#', '#####', '.#.#.'], color: 0xe0453b },
  // A shopping trolley: the shop.
  shop: { rows: ['#....', '.####', '.###.', '.#.#.'], color: 0xf6c431 },
  // A gift box with its bow: the treasure.
  treasure: { rows: ['.#.#.', '#####', '#.#.#', '#####'], color: 0x5cc2c0 },
  // A pound-sign-ish «%» (the interest): the rare room, the Oficina de Financiación (M14 (r2)).
  rare: { rows: ['#..#', '..#.', '.#..', '#..#'], color: 0x58b45a },
  // A question mark: the secret room (only once found).
  secret: { rows: ['##.', '..#', '.#.', '...', '.#.'], color: 0xd3849a },
};
/**
 * Minimap marks of what is left in a room (3 x 3, up to three side by side; nota del humano del
 * 2026-11-05): one per kind, however many there are.
 */
const MAP_LOOT_ICONS: Record<MapLoot, { rows: string[]; color: number }> = {
  // A shut chest: lid, latch and body, in cardboard.
  cofre: { rows: ['###', '#.#', '###'], color: 0xd39a5a },
  // A ticket: a white slip.
  ticket: { rows: ['###', '###', '###'], color: 0xf4f1e8 },
  // A heart (any of them).
  corazon: { rows: ['#.#', '###', '.#.'], color: 0xe0453b },
  // Something on the floor to take: a weapon, an item, a document. A sparkle.
  objeto: { rows: ['.#.', '###', '.#.'], color: 0x69dbd8 },
  // Discount coupons: a coin.
  cupon: { rows: ['.#.', '#.#', '.#.'], color: 0xf6c431 },
};
/** Milliseconds of the fade between rooms. */
const ROOM_FADE_OUT = 110;
const ROOM_FADE_IN = 170;

/** The Mostrador's moving parts. */
interface HubViews {
  belt: Phaser.GameObjects.Image;
  curtain: Phaser.GameObjects.Image;
  phone: Phaser.GameObjects.Image | null;
  turnos: Phaser.GameObjects.Image | null;
  chatarrero: Phaser.GameObjects.Image | null;
  t: number;
}

/** Where the Trituradora's scanner window is in its «diagnostico» frame, from its feet (tools/sprites/trituradora.ts SCANNER_TIP). */
const SCANNER_TIP = { x: 47, y: 48 } as const;

export class GameScene extends Phaser.Scene {
  world!: World;
  controls!: Controls;
  sound2 = new Sound();
  private fx = new Rng('fx');
  private acc = 0;
  private hitstop = 0;
  /** Tyre marks on the floor right now (see skidMark). */
  private skids = 0;
  private shots = 0;

  private hero!: Phaser.GameObjects.Sprite;
  private heroShadow!: Phaser.GameObjects.Image;
  private gun!: Phaser.GameObjects.Image;
  private hand!: Phaser.GameObjects.Image;
  private gunKick = 0;
  private flashHero = 0;
  /** Giro de cuchillas (M13 (3)): the whirl of blades round a rolling blender. */
  private whirl!: Phaser.GameObjects.Sprite;
  /** «Batería al 1 %» (M13 (6)): the empty battery that blinks over the Móvil before it switches off. */
  private lowBattery!: Phaser.GameObjects.Image;
  private muzzle!: Phaser.GameObjects.Image;
  private muzzleT = 0;
  private crosshair!: Phaser.GameObjects.Image;
  private dummySprites = new Map<number, Phaser.GameObjects.Image>();
  private enemySprites = new Map<number, EnemyView>();
  /** Etiquetadora: the labels stuck on each enemy or dummy (by id), one sprite each. */
  private labelViews = new Map<number, Phaser.GameObjects.Image[]>();
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
  /** The squares of DENEGADO ink on the floor, by Ink id. */
  private inkViews = new Map<number, Phaser.GameObjects.Image>();
  /** Suela caliente: the puffs of steam on the floor (World.steam), by id. */
  private steamViews = new Map<number, Phaser.GameObjects.Image>();
  /** When the steam last sizzled (ms), so a crowd on the trail does not buzz. */
  private scaldHeard = 0;
  /** Conveyor belts on the floor (M12 (4b)): the scrolling belt and the intake rollers at its end. */
  private beltViews = new Map<number, { belt: Phaser.GameObjects.TileSprite; rollers: Phaser.GameObjects.TileSprite | null }>();
  /** Ticket dispensers' turns on the floor, by the dispenser's id: the circle, its number and the countdown. */
  private turnViews = new Map<number, { circle: Phaser.GameObjects.Image; num: Phaser.GameObjects.BitmapText; state: string }>();
  /** Queue posts' tapes, by the id of the first post of the pair, and where their ends were last drawn (for the snap). */
  private tapeViews = new Map<number, { tape: Phaser.GameObjects.TileSprite; ax: number; ay: number; bx: number; by: number }>();
  /** Virtual assistants' shields of frequently asked questions, by the assistant's id. */
  private faqViews = new Map<number, Phaser.GameObjects.Image>();
  private faqG!: Phaser.GameObjects.Graphics;
  /** The reception phones' dotted lines to the colleague they pass you on to. */
  private transferG!: Phaser.GameObjects.Graphics;
  /** Tapes snapping back into a post: a line that shrinks towards it for a moment. */
  private tapeSnaps: { x: number; y: number; fx: number; fy: number; t: number }[] = [];
  private turnG!: Phaser.GameObjects.Graphics;
  /** The Centralita's voice menu: the zones on the floor (per boss), and the circle on the toaster before a transfer. */
  private menuViews = new Map<number, Phaser.GameObjects.Image[]>();
  private menuG!: Phaser.GameObjects.Graphics;
  /** «Le paso con el departamento»: the dotted line from where the toaster was to where it is, fading. */
  private deptLines: Array<{ ax: number; ay: number; bx: number; by: number; t: number }> = [];
  /** The Trituradora's diagnoses on screen (event `scan`): the beam from its scanner to the toaster. */
  private scans: Array<{ boss: number; t: number; time: number }> = [];
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
  /** Props that can blow up (M9b 13a), by their feet «x,y»: sprite, shadow and how hard they still shake from a hit. */
  private drumViews = new Map<string, { s: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; x: number; jolt: number; smoke: number }>();
  /** Tables (M9b 13b), by their spot: the sprite (its frame says how it lies), its shadow, a jolt and the tipping hop. */
  private tableViews = new Map<string, { s: Phaser.GameObjects.Image; shadow: Phaser.GameObjects.Image; x: number; y: number; jolt: number; tip: number; side?: TipSide }>();
  private couponPop = 0;
  /** The shop till (only in the shop), what it is saying and for how long, and its refusal face. */
  private till: Phaser.GameObjects.Image | null = null;
  private bubble: { g: Phaser.GameObjects.Graphics; t: Phaser.GameObjects.BitmapText } | null = null;
  private bubbleT = 0;
  private tillNoT = 0;
  /** A line the till says once the one it is saying ends. */
  private tillNext: string[] = [];
  /** How far above the till's feet its bubble goes (the shop's till; the Mostrador's Caja is taller). */
  private tillTop = 39;
  /** The Mostrador's station the toaster stands at, and whether it already spoke (again once it walks off). */
  private hubAt: StationKind | null = null;
  /** Who the bubble belongs to when it is not the till (a station of the Mostrador): where it points. */
  private talkAt: { x: number; y: number; top: number } | null = null;
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
  /** The Garantías Provisionales after the hearts (M9b 12a). */
  private shieldIcons: Phaser.GameObjects.Image[] = [];
  private ammoPips: Phaser.GameObjects.Image[] = [];
  private gunIcon!: Phaser.GameObjects.Image;
  private ammoText!: Phaser.GameObjects.BitmapText;
  private reloadBar!: Phaser.GameObjects.Graphics;
  /** Attack warnings: shrinking ring, aim dots and «!», redrawn every frame from the emitters. */
  private warn!: Phaser.GameObjects.Graphics;
  /** The air conditioners' cones of cold air, on the floor (cleared every frame). */
  private windG!: Phaser.GameObjects.Graphics;
  /** Enemies a photocopier is scanning (from last frame's warnings): they glow green. */
  private scanned = new Set<number>();
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
  /** Started from the title's «Partida nueva»: every run starts and ends in the Mostrador (kept on restart). */
  private hubMode = false;
  /** The world carried in is a new run (it came from the Mostrador's conveyor). */
  private freshRun = false;
  /** The Mostrador's moving parts (null in any other room). */
  private hubViews: HubViews | null = null;
  private mapG: Phaser.GameObjects.Graphics | null = null;
  /** Where the camera looks instead of the player (a boss's entrance), or null. */
  private camFocus: { x: number; y: number } | null = null;
  /** The boss entrance's letterbox bars and texts, removed when it ends. */
  private introParts: Phaser.GameObjects.GameObject[] = [];
  /**
   * The return slip that opens a run (M13): while it is up the simulation waits. The conveyor
   * reads it out a character at a time (`shown`); then the stamp; a press gets on with it.
   */
  private slip: {
    parts: Phaser.GameObjects.GameObject[];
    lines: { o: Phaser.GameObjects.BitmapText; text: string; read: number }[];
    total: number;
    shown: number;
    t: number;
    /** Seconds since the stamp came down; -1: not yet. */
    stamped: number;
    stamp: (Phaser.GameObjects.BitmapText | Phaser.GameObjects.Rectangle)[];
    fades: boolean;
    hint: Phaser.GameObjects.BitmapText | null;
    armed: boolean;
    clicked: boolean;
  } | null = null;
  /** The trigger is still down from putting the slip away. */
  private slipFire = false;
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
  private liftView: { s: Phaser.GameObjects.Image; hole: Phaser.GameObjects.Rectangle; arrow: Phaser.GameObjects.Graphics; upT: number; service: boolean } | null = null;
  /** Seconds since the toaster stepped on the lift (-1 before). */
  private winT = -1;

  constructor() {
    super('game');
  }

  /** Bosses taken down in this run, and whether its end is already in the record (src/render/save.ts). */
  private runBosses: string[] = [];
  private runRecorded = false;
  /**
   * The Trituradora fell (M12 (5)): instead of the run's report, the true ending (FinalScene) plays.
   * `times`: endings seen before this one; `started`: the fade to it has begun.
   */
  private ending: { times: number; started: boolean } | null = null;
  /** Seconds and kills of the floors already cleared in this run (each floor's world counts its own). */
  private runBefore = { seconds: 0, kills: 0 };

  /** Started from the title screen's practice option: that room instead of a floor (kept on restart). */
  private startSala: string | null = null;

  /** The daily challenge being played (its day, «AAAA-MM-DD»; M14 (r1)), kept on restart: R tries the same one again. */
  private daily: string | null = null;

  init(data: { sala?: string; hub?: boolean; daily?: string } | undefined): void {
    this.startSala = data?.sala ?? null;
    this.hubMode = !!data?.hub;
    this.daily = data?.daily ?? null;
  }

  create(): void {
    // create() runs again on restart, on the same object: start from a clean slate.
    this.prompt = null;
    this.promptBack = null;
    this.hubAsk = false;
    this.acc = 0;
    this.hitstop = 0;
    this.skids = 0;
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
    this.labelViews = new Map();
    this.bulletSprites = new Map();
    this.bulletPool = [];
    this.pickupSprites = new Map();
    this.chestSprites = new Map();
    this.drumViews = new Map();
    this.tableViews = new Map();
    this.partitionViews = [];
    this.ticketPop = 0;
    this.till = null;
    this.bubble = null;
    this.bubbleT = 0;
    this.tillNoT = 0;
    this.tillNext = [];
    this.tillTop = 39;
    this.hubAt = null;
    this.hubHeard = {};
    this.talkAt = null;
    this.frostViews = new Map();
    this.crateViews = new Map();
    this.inkViews = new Map();
    this.steamViews = new Map();
    this.beltViews = new Map();
    this.turnViews = new Map();
    this.tapeViews = new Map();
    this.faqViews = new Map();
    this.tapeSnaps = [];
    this.particles = [];
    this.mapG = null;
    this.floats = [];
    this.hearts = [];
    this.shieldIcons = [];
    this.ammoPips = [];
    this.hubViews = null;
    this.hubPending = {};
    this.panel = [];
    this.archiveCursor = { doc: -1, page: 0 };
    const params = new URLSearchParams(location.search);
    const carried = this.carry;
    this.carry = null;
    this.ending = null;
    // Off the Mostrador's conveyor: the run opens with the product's return slip (M13).
    // The daily challenge opens with it too (its first floor, not when trying again from a later one).
    const offTheBelt = this.freshRun || (!!this.daily && !carried);
    this.slip = null;
    this.slipFire = false;
    if (!carried || this.freshRun) {
      this.freshRun = false;
      // A new run: nothing beaten yet, nothing written in the record.
      this.runBosses = [];
      this.runRecorded = false;
      this.runBefore = { seconds: 0, kills: 0 };
    }
    // ?planta=2: floor 2 (Informática): its look, its rooms and its loot. ?planta=3: the Juguetería. ?planta=4: the
    // Oficinas. ?planta=5: Atención al Cliente, the last floor of a run (until La Centralita, M11 5b, the Director fights there).
    // ?planta=6: the Servicio Técnico (M12), as if with the appointment.
    const level = Math.max(1, Math.min(SERVICE_LEVEL, Math.trunc(Number(params.get('planta') ?? 1)) || 1));
    // Who plays (M13 (1)): the one on display on the tablón; ?personaje=<id> tries any character there is.
    const asked = params.get('personaje');
    const character = asked && CHARACTERS[asked] ? asked : exhibited(profile());
    if (carried) {
      // Walked through a door: same run, next room. The controls hint was read already.
      this.world = carried;
      this.hintT = 0;
    } else if (this.hubMode) {
      // The Mostrador de Devoluciones: where every run starts and ends. The Chatarrero comes once a boss has fallen.
      // The unlocked characters' starting weapons go with every run that leaves from here (weaponPool).
      this.world = createWorld({ seed: 'mostrador', character, hub: { chatarrero: chatarreroHere(profile()), service: profile().service }, unlocked: profile().unlocked });
    } else if (this.daily) {
      // The daily challenge (M14 (r1)): the day's seed, the Tostadora and the day's gift, whoever plays.
      this.world = startDaily(this.daily);
    } else if (this.startSala && !params.get('sala')) {
      this.world = createWorld({ seed: `pruebas-${Date.now().toString(36)}`, room: this.startSala, level, character });
    } else if (params.get('sala')) {
      // ?sala=<id>&profundidad=<n>: one room template, its slots filled for that depth (the test
      // room is ?sala=sala-pruebas).
      const sala = params.get('sala')!;
      this.world = createWorld({ seed: params.get('semilla') ?? sala, room: sala, depth: Number(params.get('profundidad') ?? 3), level, character, unlocked: profile().unlocked });
    } else {
      // A whole floor: ?semilla=<s> always gives the same one; without it, a new one each unit.
      // ?cita=1: as if the Servicio Técnico's appointment were granted (otherwise, the profile's).
      const service = level === SERVICE_LEVEL || params.get('cita') === '1' || profile().service;
      this.world = createWorld({ seed: params.get('semilla') ?? `planta-${Date.now().toString(36)}`, floor: true, level, service, character, unlocked: profile().unlocked });
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
    // A click on the return slip counts even if it was over between two frames (a slow first one).
    this.input.on('pointerdown', () => {
      if (this.slip) this.slip.clicked = true;
    });

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
      this.drawnProps.add(pr);
      if (room.kind === 'hub' && this.makeHubProp(pr)) continue;
      if (key === 'mampara-movil') {
        this.makePartitionView(pr);
        continue;
      }
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
      if (pr.def.tip) {
        // Tables: drawTables changes the frame when they go over.
        const shadow = this.add.image(pr.x, pr.y + 1, shadowTexture(this, 10, 3)).setDepth(-50000);
        const s = this.add.image(pr.x, pr.y, this.levelKey(key), pr.tipped ? TABLE_FRAME[pr.tipped] : 0).setOrigin(0.5, 1).setDepth(pr.y);
        this.tableViews.set(`${pr.x},${pr.y}`, { s, shadow, x: pr.x, y: pr.y, jolt: 0, tip: 0, side: pr.tipped });
        continue;
      }
      const view = this.makePropView(pr);
      // The Centralita's low counters: each long one has the plate of the department behind it.
      if (key === 'mostrador-bajo') view.setFrame(departmentOf(room, pr.x, pr.box.y - 6) - 1);
    }
    if (room.kind === 'hub') this.makeHub();
    if (room.id === 'jefe-atencion') this.paintDepartments();
    if (room.kind === 'shop' || room.kind === 'rare') {
      // A display stand under every shelf, and the till says hello (in the Oficina de
      // Financiación, M14 (r2), the same till offers credit).
      for (const sl of room.slots) if (sl.kind === 'shelf') this.add.image(sl.x, sl.y + 6, 'expositor').setOrigin(0.5, 1).setDepth(sl.y - 1);
      const greet = room.id === 'sorteo' ? RAFFLE.greet : room.kind === 'rare' ? FINANCE.greet : SHOPKEEPER.greet;
      this.time.delayedCall(700, () => this.tillSay(this.fx.pick(greet)));
    }
    for (const d of this.world.dummies) {
      this.add.image(d.x, d.y - 1, shadowTexture(this, 8, 3)).setDepth(-50000);
      this.dummySprites.set(d.id, this.add.image(d.x, d.y, 'maniqui').setOrigin(0.5, 38 / 40).setDepth(d.y));
    }

    for (const en of this.world.enemies) this.makeEnemyView(en);

    this.heroShadow = this.add.image(0, 0, shadowTexture(this, 9, 3)).setDepth(-50000);
    this.hero = this.add.sprite(0, 0, this.world.player.base.def.look.sheet, 0);
    this.whirl = this.add.sprite(0, 0, 'giro-cuchillas', 0).setVisible(false);
    this.lowBattery = this.add.image(0, 0, 'bateria-baja').setVisible(false);
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
    this.turnG = this.add.graphics().setDepth(-60350);
    this.menuG = this.add.graphics().setDepth(83700);
    this.faqG = this.add.graphics().setDepth(83900);
    this.transferG = this.add.graphics().setDepth(83800);
    this.windG = this.add.graphics().setDepth(-60100);
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
    const xr = scrollRange(room.w, VIEW_W);
    const yr = scrollRange(room.h, VIEW_H, room.kind === 'hub');
    cam.setBounds(xr.lo, yr.lo, xr.hi - xr.lo + VIEW_W, yr.hi - yr.lo + VIEW_H);
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
      placeChest: (x: number, y: number, tier?: 'carton' | 'premium') => void;
      dropTicket: (x: number, y: number) => void;
      dropShield: (x: number, y: number) => void;
      dropHeart: (x: number, y: number, kind: HeartKind) => void;
      spawnIdle: (id: string, x: number, y: number) => void;
      spawnPair: (id: string, ax: number, ay: number, bx: number, by: number) => void;
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
      placeChest: (x: number, y: number, tier?: 'carton' | 'premium') => void placeChest(this.world, x, y, true, tier),
      dropTicket: (x: number, y: number) => dropTicket(this.world, x, y),
      // ...or a Garantía Provisional.
      dropShield: (x: number, y: number) => dropHeart(this.world, x, y, 'garantia'),
      // ...or any heart (the special ones, M9b 12b).
      dropHeart: (x: number, y: number, kind: HeartKind) => dropHeart(this.world, x, y, kind),
      // ...or an enemy standing still, waiting (to see what hits it).
      spawnIdle: (id: string, x: number, y: number) => {
        const en = spawnEnemy(this.world.nextId++, ENEMIES[id]!, x, y);
        en.state = 'idle';
        en.until = 999;
        this.world.enemies.push(en);
      },
      // ...or a pair joined by their tape (the queue posts).
      spawnPair: (id: string, ax: number, ay: number, bx: number, by: number) => {
        const a = spawnEnemy(this.world.nextId++, ENEMIES[id]!, ax, ay);
        const b = spawnEnemy(this.world.nextId++, ENEMIES[id]!, bx, by);
        pairUp(a, b);
        this.world.enemies.push(a, b);
      },
    };
    if (offTheBelt && this.world.floor && this.world.level === 1) this.showSlip();
    // Back in the boss room after walking out: the lift is still there, waiting.
    const lift = this.world.lift;
    if (lift) {
      this.raiseLift(lift.x, lift.y, true, lift.service);
      if (lift.t >= LIFT_READY) this.liftView!.s.setFrame(1);
    }
  }

  private makeEnemyView(en: Enemy): EnemyView {
    const flying = enemyAltitude(en) > 0;
    const big = en.def.footRadius > 10;
    const shadow = this.add.image(en.x, en.y, flying ? shadowTexture(this, 4, 2) : big ? shadowTexture(this, en.def.footRadius + 8, 5) : shadowTexture(this, 10, 3)).setDepth(-50000);
    const sheet = this.textures.get(en.def.sprite);
    // A photocopy is drawn from a grey, toner-streaked copy of its original's sheet.
    // In the Servicio Técnico (M12 (3a)) they are all reconditioned: grey shell and a green sticker.
    const refurb = this.world.level >= SERVICE_LEVEL && !en.def.boss && !en.def.workshop;
    const key = en.copyOf !== undefined ? this.photocopyOf(en.def.sprite) : refurb ? this.refurbishedOf(en.def.sprite) : en.def.sprite;
    const s = this.add.image(en.x, en.y, key, sheet.frameTotal > 2 ? 0 : undefined);
    s.setOrigin(en.def.anchor.x / s.width, en.def.anchor.y / s.height);
    const v: EnemyView = { s, shadow };
    if (SPRITE_BLINKS[en.def.sprite]) v.blink = this.add.graphics();
    if (SPRITE_GLOWS[en.def.sprite]) v.glow = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    const badge = en.def.anim?.badge;
    if (badge) v.badge = this.add.image(en.x, en.y, badge.sprite, 0).setOrigin(0, 0);
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
    v.badge?.destroy();
    this.enemySprites.delete(id);
  }

  /**
   * A photocopy of a sprite sheet (the photocopier's copies, M10 planta 4 (4b)): grey, a little
   * washed out, every fourth row darker (the toner streaks) and a few specks of toner, with the same
   * frames. Made once per sheet.
   */
  private photocopyOf(key: string): string {
    const tex = `${key}-fotocopia`;
    if (this.textures.exists(tex)) return tex;
    const src = this.textures.get(key);
    const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const ct = this.textures.createCanvas(tex, img.width, img.height);
    if (!ct) return key;
    const ctx = ct.getContext();
    ctx.drawImage(img as CanvasImageSource, 0, 0);
    const im = ctx.getImageData(0, 0, img.width, img.height);
    const d = im.data;
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const i = (y * img.width + x) * 4;
        if (d[i + 3]! === 0) continue;
        const lum = 0.3 * d[i]! + 0.59 * d[i + 1]! + 0.11 * d[i + 2]!;
        // Outlines stay black; the rest goes to a flat office grey, lighter than the original.
        let g = lum < 30 ? lum : 70 + lum * 0.62;
        if (y % 4 === 2) g *= 0.78;
        // Toner specks, always on the same pixels (no randomness: the copy flickers otherwise).
        if (((x * 7 + y * 13) % 29) === 0) g *= 0.55;
        d[i] = g * 0.97;
        d[i + 1] = g;
        d[i + 2] = Math.min(255, g * 1.05);
      }
    }
    ctx.putImageData(im, 0, 0);
    for (const name of src.getFrameNames()) {
      const fr = src.get(name);
      ct.add(name, 0, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight);
    }
    ct.refresh();
    return tex;
  }

  /**
   * A reconditioned copy of a sprite sheet (the Servicio Técnico's enemies, M12 (3a)): the shell
   * goes three quarters of the way to a cold workshop grey (outlines stay as they are) and, on each
   * frame, a green «REACONDICIONADO» sticker is stuck on the body, a little right of centre and
   * above the middle, only where there is body under it. Same frames. Made once per sheet.
   */
  private refurbishedOf(key: string): string {
    const tex = `${key}-reacondicionado`;
    if (this.textures.exists(tex)) return tex;
    const src = this.textures.get(key);
    const img = src.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const ct = this.textures.createCanvas(tex, img.width, img.height);
    if (!ct) return key;
    const ctx = ct.getContext();
    ctx.drawImage(img as CanvasImageSource, 0, 0);
    const im = ctx.getImageData(0, 0, img.width, img.height);
    const d = im.data;
    const W = img.width;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3]! === 0) continue;
      const lum = 0.3 * d[i]! + 0.59 * d[i + 1]! + 0.11 * d[i + 2]!;
      if (lum < 30) continue;
      const g = 40 + lum * 0.78;
      d[i] = d[i]! * 0.25 + g * 0.72;
      d[i + 1] = d[i + 1]! * 0.25 + g * 0.76;
      d[i + 2] = Math.min(255, d[i + 2]! * 0.25 + g * 0.82);
    }
    const names = src.getFrameNames();
    const frames = names.length ? names.map((n) => src.get(n)) : [src.get()];
    const STICKER = ['aaaaa', 'gwwwg', 'ggggg', 'ddddd'];
    const SMALL = ['aaa', 'ggg', 'ddd'];
    const ink: Record<string, [number, number, number]> = { a: [168, 232, 154], g: [88, 180, 90], w: [232, 244, 226], d: [47, 107, 60] };
    for (const fr of frames) {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -1;
      let y1 = -1;
      for (let y = fr.cutY; y < fr.cutY + fr.cutHeight; y++) {
        for (let x = fr.cutX; x < fr.cutX + fr.cutWidth; x++) {
          if (d[(y * W + x) * 4 + 3]! === 0) continue;
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
      }
      if (x1 < 0) continue;
      const pat = x1 - x0 >= 12 && y1 - y0 >= 10 ? STICKER : SMALL;
      const pw = pat[0]!.length;
      const ph = pat.length;
      // On the shell's top right-hand corner: the first spot from there (down, then leftwards)
      // with body under all of it and no outline (so not over an eye or off the edge).
      const solid = (x: number, y: number): boolean => {
        const p = (y * W + x) * 4;
        return d[p + 3]! > 0 && 0.3 * d[p]! + 0.59 * d[p + 1]! + 0.11 * d[p + 2]! > 60;
      };
      let sx = Math.round(x0 + (x1 - x0) * 0.62 - pw / 2);
      let sy = Math.round(y0 + (y1 - y0) * 0.4 - ph / 2);
      search: for (let dy = 0; dy <= (y1 - y0) * 0.6; dy++) {
        for (let dx = 0; dx <= (x1 - x0) * 0.5; dx++) {
          const tx = x1 - 2 - pw - dx;
          const ty = y0 + 2 + dy;
          let ok = true;
          for (let j = -1; j <= ph && ok; j++) for (let i = -1; i <= pw && ok; i++) ok = solid(tx + i, ty + j);
          if (ok) {
            sx = tx;
            sy = ty;
            break search;
          }
        }
      }
      pat.forEach((row, j) => [...row].forEach((ch, i) => {
        const p = ((sy + j) * W + sx + i) * 4;
        if (d[p + 3]! === 0) return;
        const [r, g, b] = ink[ch]!;
        d[p] = r;
        d[p + 1] = g;
        d[p + 2] = b;
      }));
    }
    ctx.putImageData(im, 0, 0);
    for (const name of names) {
      const fr = src.get(name);
      ct.add(name, 0, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight);
    }
    ct.refresh();
    return tex;
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
    // (No text over it: the human asked for none, 2026-10-30. The pieces say it.)
  }

  /**
   * The return slip (M13): the character's story as the shop filed it, on a form that drops in;
   * the conveyor reads it out (a blip every couple of letters) and stamps it.
   */
  private showSlip(): void {
    const p = this.world.player;
    const id = p.base.def.id;
    const story = STORIES[id] ?? STORIES['tostadora']!;
    const L = slipLayout(returnSlip(id, p.base.def.name), slipNumber(this.world.seed), story.stamp, slipHint(keyWords()), readScale(settings()));
    const parts: Phaser.GameObjects.GameObject[] = [];
    const add = <T extends Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.ScrollFactor>(o: T): T => {
      this.hud(o).setDepth(96500 + parts.length);
      parts.push(o);
      return o;
    };
    // Return-slip pink: the carbon copy the warehouse keeps.
    const edge = 0xe08fb0;
    add(this.add.rectangle(L.x, L.y, L.w, L.h, 0x0e0c16, 0.95).setOrigin(0, 0)).setStrokeStyle(1, edge);
    add(this.add.rectangle(L.x + 1, L.y + 1, L.w - 2, L.barH, 0xb04a78, 1).setOrigin(0, 0));
    const g = add(this.add.graphics());
    for (let x = L.x + 4; x < L.x + L.w - 4; x += 4) g.fillStyle(0x3a3f5c, 1).fillRect(x, L.rule, 2, 1);
    const tints: Record<SlipRole, number> = {
      title: 0xf4f1e8, ref: 0xffd6e6, reader: 0x858ea8, label: 0x858ea8, value: 0xd6cdb2, signLabel: 0x858ea8, sign: 0x8fe3ff, hint: 0xf6c431,
    };
    const lines: { o: Phaser.GameObjects.BitmapText; text: string; read: number }[] = [];
    let hint: Phaser.GameObjects.BitmapText | null = null;
    for (const t of L.texts) {
      const text = fontText(t.text);
      const o = add(this.add.bitmapText(t.x, t.y, FONT, t.read < 0 ? text : '', L.size)).setTint(tints[t.role]);
      if (t.read >= 0) lines.push({ o, text, read: t.read });
      if (t.role === 'hint') hint = o.setAlpha(0);
    }
    lines.sort((a, b) => a.read - b.read);
    const stampText = fontText(story.stamp);
    const stampColor = 0xe0453b;
    const stamp = [
      add(this.add.bitmapText(L.stamp.x, L.stamp.y, FONT, stampText, 8).setOrigin(0.5, 0.5)).setTint(stampColor),
      add(this.add.rectangle(L.stamp.x, L.stamp.y, textWidth(story.stamp) + 8, 13).setStrokeStyle(1, stampColor)),
    ];
    for (const o of stamp) o.setRotation(-0.22).setScale(5).setAlpha(0);
    // The whole slip drops in from above, as the conveyor feeds it.
    for (const o of parts) {
      const ob = o as unknown as Phaser.GameObjects.Components.Transform;
      const ty = ob.y;
      ob.y = ty - 40;
      this.tweens.add({ targets: o, y: ty, duration: 240, ease: 'Back.easeOut' });
    }
    this.sound2.play('cinta', { detune: -300, volume: 0.7 });
    this.slip = {
      parts, lines, total: lines.reduce((a, l) => a + l.text.length, 0), shown: 0, t: -0.35, stamped: -1, stamp, fades: L.stampFades, hint, armed: false, clicked: false,
    };
  }

  /** Letters per second the conveyor reads at. */
  private static readonly SLIP_READ_SPEED = 75;

  private updateSlip(dt: number): void {
    const s = this.slip!;
    s.t += dt;
    const p = this.world.player;
    const input = this.controls.read({ bodyX: p.x, bodyY: p.y - BODY_HEIGHT });
    if (!input.fire) s.armed = true;
    const press = !!input.interact || input.roll || s.clicked || (s.armed && input.fire);
    if (press) s.armed = false;
    s.clicked = false;
    if (s.stamped < 0) {
      // Reading out: a press reads the rest at once.
      const before = s.shown;
      s.shown = press ? s.total : Math.min(s.total, Math.max(0, Math.floor(s.t * GameScene.SLIP_READ_SPEED)));
      let left = s.shown;
      for (const l of s.lines) {
        const n = Math.max(0, Math.min(l.text.length, left));
        if (l.o.text.length !== n) l.o.setText(l.text.slice(0, n));
        left -= l.text.length;
      }
      // The conveyor's voice: a blip every third letter, pitched about.
      if (!press && Math.floor(s.shown / 3) > Math.floor(before / 3)) this.sound2.play('teclear', { detune: this.fx.range(-500, 300), volume: 0.8 });
      if (s.shown >= s.total) this.stampSlip();
      return;
    }
    // Stamped: a press, or walking off, after a moment, gets on with the run.
    s.stamped += dt;
    const moved = Math.hypot(input.moveX, input.moveY) > 0.3;
    if (s.stamped > 0.45 && (press || moved)) this.closeSlip();
  }

  private stampSlip(): void {
    const s = this.slip!;
    s.stamped = 0;
    for (const o of s.stamp) {
      this.tweens.add({
        targets: o,
        scale: STAMP_SCALE,
        alpha: 0.9,
        duration: 130,
        ease: 'Quad.easeIn',
        onComplete: () => {
          if (s.fades) this.tweens.add({ targets: o, alpha: 0.3, delay: 1400, duration: 500 });
          if (o !== s.stamp[0]) return;
          this.sound2.play('sello');
          this.shake(120, 0.006, true);
        },
      });
    }
    if (s.hint) {
      s.hint.setAlpha(1);
      this.tweens.add({ targets: s.hint, alpha: 0.35, yoyo: true, repeat: -1, duration: 450, delay: 600 });
    }
  }

  /** The slip slides away and the run begins. */
  private closeSlip(): void {
    const s = this.slip!;
    this.slip = null;
    this.sound2.play('deslizar', { volume: 0.7 });
    for (const o of s.parts) {
      this.tweens.killTweensOf(o);
      this.tweens.add({ targets: o, y: (o as unknown as { y: number }).y + 30, alpha: 0, duration: 200, ease: 'Quad.easeIn', onComplete: () => o.destroy() });
    }
    this.hudObjs = this.hudObjs.filter((o) => !s.parts.includes(o as unknown as Phaser.GameObjects.GameObject));
    this.acc = 0;
    this.slipFire = true;
    // The daily challenge: then the day's gift, already in the bag (M14 (r1)).
    if (this.daily) this.showDailyGift();
  }

  /** The card of the daily challenge's gift, as if just picked up, with «Regalo del día» as its kind. */
  private showDailyGift(): void {
    const pas = ITEMS[dailyGift(this.daily!)];
    if (pas) this.showCard(pas.sprite, pas.name, DAILY_GIFT_KIND, pas.description, modifierLines(pas.mod), 0xf6c431);
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
      characterDown(w.player.base.def.id),
    );
    // In the daily challenge, how many tries today and the best of them (M14 (r1)).
    const day = this.daily ? profile().dailies[this.daily] : undefined;
    if (day) lines.splice(lines.length - 1, 0, dailyReportLine(day));
    this.showForm(lines, { title: DOWN_TITLE, color: 0xe0453b, light: 0xffd0c8, stamp: DOWN_STAMP, hint: DOWN_HINT });
  }

  /**
   * The floor is done: «Incidencia resuelta», the same kind of form as the sick-leave report, in
   * Fridge cyan, with «Planta superada» stamped on it.
   */
  private showWinPanel(): void {
    const w = this.world;
    const unit = characterDown(w.player.base.def.id).unit;
    if (w.finale) {
      // The last floor (M11 3): the whole run is won and the incident closed, in Liquidación yellow.
      const totalSeconds = Math.round(this.runBefore.seconds + w.tick * DT);
      const info = { unit, room: w.room.name, seconds: Math.round(w.tick / 60), kills: w.kills, coupons: w.player.coupons, floors: w.level, totalSeconds, totalKills: this.runBefore.kills + w.kills };
      const done = runWinReport(info, (n) => this.fx.int(0, n - 1));
      this.showForm(done, { title: RUN_WIN_TITLE, color: 0xd9932a, light: 0xfff1a8, stamp: RUN_WIN_STAMP, hint: RUN_WIN_HINT });
      return;
    }
    const next = w.level < topLevelOf(w) ? w.level + 1 : undefined;
    const lines = winReport({ unit, room: w.room.name, seconds: Math.round(w.tick / 60), kills: w.kills, coupons: w.player.coupons, next }, (n) => this.fx.int(0, n - 1));
    this.showForm(lines, { title: WIN_TITLE, color: 0x3a9ea6, light: 0xb6f1f0, stamp: WIN_STAMP, hint: next ? WIN_HINT_NEXT : WIN_HINT });
  }

  /** A report form that drops in, with its lines, a reference number, a hint and a stamp slammed on it. */
  private showForm(lines: { label: string; text: string }[], look: { title: string; color: number; light: number; stamp: string; hint: string }): void {
    const w = this.world;
    const ref = `Exp. ${String(1000 + ((w.tick * 7919) % 9000)).padStart(4, '0')}`;
    const hintText = `${look.hint} · ${REPORT_MENU_HINT}`;
    const F = formLayout(lines, look.title, ref, hintText, readScale(settings()), look.stamp);
    // A description window still up (something picked up a moment before) would show through the form.
    const c = this.card;
    const cardParts = [c.plate, c.icon, c.name, c.kind, c.desc, ...c.lines];
    this.tweens.killTweensOf(cardParts);
    for (const o of cardParts) o.setAlpha(0);
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
   * The character comes apart (M13 (7c): each its own way, src/data/bajas.ts). The toaster: both
   * slices pop out of the slots, the lever spring shoots off with a «boing», the knob and screws
   * scatter and the empty body tips over. The others fling their own four pieces the same way.
   */
  private popToaster(): void {
    const p = this.world.player;
    const f = p.facing;
    const down = characterDown(p.base.def.id);
    this.popped = true;
    this.hitstop = 0.06;
    this.shake(160, 0.01, true);
    this.sound2.play('saltar');
    this.flashHero = 0.05;
    // Slots are 2 and 6 px right of the feet (facing right), 30 px up.
    const flung = (frame: number, dx: number, z: number, vx: number, vz: number, spin: number, life = 99): void => {
      this.particles.push({
        s: this.add.image(p.x + dx * f, p.y + this.fx.range(-2, 3), down.debris, frame).setFlipX(f < 0),
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
    switch (down.burst) {
      case 'crumbs':
        this.time.delayedCall(90, () => this.sound2.play('muelle'));
        break;
      case 'steam':
        // The Plancha: the tank bursts, a last cloud of steam and the water everywhere.
        this.sound2.play('vapor', { detune: -400 });
        for (let i = 0; i < 8; i++) this.puff(p.x + this.fx.range(-12, 14), p.y - this.fx.range(8, 26), this.fx.range(0.6, 1.1), 0xf4f1e8);
        for (let i = 0; i < 12; i++) this.spark(p.x + f * this.fx.range(-8, 2), p.y - 18, this.fx.range(-Math.PI, 0), this.fx.range(40, 110), i % 2, 0xb6f1f0);
        break;
      case 'smoothie':
        // The Batidora: the jar cracks and the old smoothie splashes out.
        this.time.delayedCall(60, () => this.sound2.play('cubitos', { detune: -300 }));
        for (let i = 0; i < 12; i++) this.spark(p.x + f * this.fx.range(-4, 6), p.y - 30, this.fx.range(-Math.PI, 0), this.fx.range(40, 110), i % 2, 0x93b84c);
        break;
      case 'coffee':
        // The Becario: the coffee goes everywhere and his papers fly (no smoke: he is not an appliance).
        this.time.delayedCall(80, () => this.sound2.play('carta'));
        for (let i = 0; i < 10; i++) this.spark(p.x + f * this.fx.range(-2, 6), p.y - 20, this.fx.range(-Math.PI, 0), this.fx.range(40, 100), i % 2, 0x7a4e3c);
        for (let i = 0; i < 6; i++) this.spark(p.x + this.fx.range(-6, 6), p.y - 26, this.fx.range(-Math.PI, 0), this.fx.range(30, 70), 1, 0xf4f1e8);
        break;
      case 'glass':
        // The Móvil: the screen shatters, glittering, and the battery pops.
        this.time.delayedCall(70, () => this.sound2.play('clinc', { detune: 300 }));
        for (let i = 0; i < 14; i++) this.spark(p.x + f * this.fx.range(-2, 8), p.y - 20, this.fx.range(-Math.PI, 0), this.fx.range(50, 130), i % 2, 0xb0bed6);
        break;
    }
    flung(0, -1, 30, f * this.fx.range(-40, -15), this.fx.range(130, 155), this.fx.range(-10, -5));
    flung(1, 5, 29, f * this.fx.range(25, 55), this.fx.range(115, 140), this.fx.range(6, 12));
    flung(2, -6, 14, -f * this.fx.range(50, 80), this.fx.range(120, 150), this.fx.range(-20, 20));
    flung(3, -8, 16, -f * this.fx.range(20, 45), this.fx.range(90, 120), this.fx.range(-14, 14));
    for (let i = 0; down.scrap && i < 5; i++) {
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
    if (!down.scrap) return;
    for (let i = 0; i < 6; i++) this.puff(p.x + this.fx.range(-8, 8) + 2 * f, p.y - 26 + this.fx.range(-4, 4), this.fx.range(0.5, 0.9));
    for (let i = 0; i < 12; i++) this.spark(p.x + 2 * f, p.y - 26, this.fx.range(-Math.PI, 0), this.fx.range(60, 150), this.fx.int(0, 3));
  }

  /** The Mostrador's conveyor: a slower fade, then the first room of a new run on floor 1. */
  private leaveHubRoom(): void {
    this.leaving = true;
    this.acc = 0;
    this.cameras.main.fadeOut(ROOM_FADE_OUT * 2, 14, 12, 22);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.carry = leaveHub(this.world, `planta-${Date.now().toString(36)}`);
      this.freshRun = true;
      this.scene.restart();
    });
  }

  /**
   * A prop of the Mostrador with its own drawing (the counter's stretches, the Caja, the queue's
   * posts and tape, the ticket machine and the Chatarrero). False: draw it like any other prop.
   */
  private makeHubProp(pr: { def: { id: string }; x: number; y: number }): boolean {
    const id = pr.def.id;
    const props = this.world.room.props;
    const counterAt = (x: number): boolean => props.some((o) => (o.def.id === 'mostrador' || o.def.id === 'caja-devoluciones') && o.y === pr.y && o.x === x);
    const shadow = (rx: number): void => void this.add.image(pr.x, pr.y + 1, shadowTexture(this, rx, 3)).setDepth(-50000);
    if (id === 'mostrador') {
      const frame = counterAt(pr.x - TILE) ? (counterAt(pr.x + TILE) ? 1 : 2) : 0;
      this.add.image(pr.x, pr.y + 2, id, frame).setOrigin(0.5, 1).setDepth(pr.y);
      return true;
    }
    if (id === 'caja-devoluciones') {
      // The Caja talks through the shop till's bubble (tillSay), from higher up: it is taller.
      this.till = this.add.image(pr.x, pr.y + 2, id, 0).setOrigin(0.5, 1).setDepth(pr.y);
      this.tillTop = 46;
      return true;
    }
    if (id === 'poste') {
      shadow(4);
      this.add.image(pr.x, pr.y + 1, id).setOrigin(0.5, 1).setDepth(pr.y);
      // The tape to the next post along the row, at the height of the cassettes.
      const next = props.find((o) => o.def.id === 'poste' && o.y === pr.y && o.x > pr.x && o.x - pr.x <= 4 * TILE);
      if (next) this.add.tileSprite(pr.x + 3, pr.y + 1 - TAPE_Y, next.x - pr.x - 6, 4, 'cinta-cola').setOrigin(0, 0).setDepth(pr.y - 0.1);
      return true;
    }
    if (id === 'turnos' || id === 'chatarrero') {
      shadow(id === 'turnos' ? 5 : 13);
      const img = this.add.image(pr.x, pr.y + 1, id, 0).setOrigin(0.5, 1).setDepth(pr.y);
      this.hubPending[id] = img;
      return true;
    }
    return false;
  }

  /** An ordinary prop: its sprite (the floor's look, if it has one) and its shadow. */
  private makePropView(pr: PropInstance): Phaser.GameObjects.Image {
    const look = this.levelKey(pr.def.id);
    const tex = this.textures.get(look).getSourceImage();
    const shadow = this.add.image(pr.x, pr.y + 1, shadowTexture(this, Math.max(6, Math.floor(tex.width / 2) - 3), 3)).setDepth(-50000);
    const img = this.add.image(pr.x, pr.y, look).setOrigin(0.5, 1).setDepth(pr.y);
    if (pr.def.hp) this.drumViews.set(`${pr.x},${pr.y}`, { s: img, shadow, x: pr.x, jolt: 0, smoke: 0 });
    return img;
  }

  /** Just over the zones of a boss's voice menu (their middle), for what it says. */
  private menuTop(boss: number): { x: number; y: number } | null {
    const zones = this.world.enemies.find((en) => en.id === boss)?.menu?.zones;
    if (!zones?.length) return null;
    const x = zones.reduce((a, z) => a + z.x, 0) / zones.length;
    return { x, y: Math.min(...zones.map((z) => z.y)) - MENU_ZONE_H / 2 - 12 };
  }

  /**
   * The Centralita's room: each department's number and name stencilled on the floor, faded, in
   * the outer corner of its quarter (BossPhase.transfer puts the toaster through to them).
   */
  private paintDepartments(): void {
    const room = this.world.room;
    for (let d = 1; d <= 4; d++) {
      const label = fontText(`${d} · ${DEPARTMENT_NAMES[d - 1]!}`);
      const box = departmentLabelBox(departmentRect(room, d), d, textWidth(label));
      // Stencilled paint: a dark under-layer one pixel down, so it reads on the light lino too.
      this.add.bitmapText(box.x, box.y + 1, FONT, label, 8).setTint(0x0e0c16).setAlpha(0.3).setDepth(-60451);
      this.add.bitmapText(box.x, box.y, FONT, label, 8).setTint(0xd6ecff).setAlpha(0.42).setDepth(-60450);
    }
  }

  /** Props already drawn; any other one turned up during the fight (the Muñeco's broken box). */
  private drawnProps = new WeakSet<PropInstance>();

  /** Props that turn up in the middle of a room (not chests, which drawChests keeps): drawn when they do. */
  private drawLateProps(): void {
    for (const pr of this.world.room.props) {
      if (pr.chest || this.drawnProps.has(pr)) continue;
      this.drawnProps.add(pr);
      if (pr.def.id === 'mampara-movil') this.makePartitionView(pr);
      else this.makePropView(pr);
    }
  }

  /** The Sala de Juntas's glass partitions (PropInstance.slide): they move, so they are kept here. */
  private partitionViews: Array<{ pr: PropInstance; img: Phaser.GameObjects.Image; ghost: Phaser.GameObjects.Image }> = [];

  /**
   * A frosted glass partition: flat on its three tiles like the walls it replaces (under everything
   * that stands), and its dashed outline, shown where it is going while it is marked.
   */
  private makePartitionView(pr: PropInstance): void {
    const img = this.add.image(pr.x, pr.box.y + pr.box.h, 'mampara-movil', 0).setOrigin(0.5, 1).setDepth(PARTITION_DEPTH);
    const ghost = this.add.image(pr.x, pr.box.y + pr.box.h, 'mampara-movil', 1).setOrigin(0.5, 1).setDepth(PARTITION_DEPTH + 1).setVisible(false);
    this.partitionViews.push({ pr, img, ghost });
  }

  /** Partitions follow their props; a marked one blinks its outline where it will go, faster and faster. */
  private drawPartitions(): void {
    for (const v of this.partitionViews) {
      const pr = v.pr;
      const bottom = (y: number): number => y + pr.def.box.y + pr.def.box.h;
      v.img.setPosition(Math.round(pr.x), Math.round(bottom(pr.y)));
      const s = pr.slide;
      if (s && s.t < s.warn) {
        const k = s.t / s.warn;
        const on = Math.floor(this.time.now / (k < 0.6 ? 140 : 70)) % 2 === 0;
        v.ghost.setPosition(s.toX, bottom(s.toY)).setVisible(true).setAlpha(on ? 1 : 0.45);
        // And the glass that is about to go shivers in its rail.
        v.img.x += Math.floor(this.time.now / 50) % 2 === 0 ? 1 : 0;
      } else v.ghost.setVisible(false);
    }
  }

  private hubPending: { turnos?: Phaser.GameObjects.Image; chatarrero?: Phaser.GameObjects.Image } = {};

  /** What hangs on the Mostrador's back wall (the board, the phone, the curtain and its sign) and the conveyor. */
  private makeHub(): void {
    const room = this.world.room;
    const b = room.belt!;
    const wallY = BACK_WALL_ROWS * TILE;
    const belt = this.add.image(b.x, b.y, 'cinta-almacen', 0).setOrigin(0, 0).setDepth(-90000);
    const curtain = this.add.image(b.x, wallY, 'cortinas', 0).setOrigin(0, 1).setDepth(-90000);
    // The sign low on the wall, over the top of the curtain: the camera never shows the wall's top rows.
    this.add.image(b.x + b.w / 2, WALL_SIGN_Y, 'cartel-mercancia').setOrigin(0.5, 0).setDepth(-89999);
    let phone: Phaser.GameObjects.Image | null = null;
    for (const st of room.stations) {
      if (st.kind === 'tablon') {
        const board = this.add.image(st.x, WALL_BOARD_Y, 'tablon').setOrigin(0.5, 0).setDepth(-90000);
        // Who is on each card: in colour once unlocked, a silhouette until then.
        const faces = this.boardEntries();
        BOARD_CARDS.forEach((c, i) => {
          const e = faces[i];
          if (e) this.add.image(board.x - board.width / 2 + c.x, WALL_BOARD_Y + c.y, 'fichas-tablon', e.unlocked ? i : faces.length + i).setOrigin(0, 0).setDepth(-89999);
        });
      }
      if (st.kind === 'telefono') phone = this.add.image(st.x, WALL_PHONE_Y, 'telefono', 0).setOrigin(0.5, 0).setDepth(-90000);
      if (st.kind === 'cita') {
        // The Servicio Técnico's notice (M12): a tick for each requirement met, the stamp once granted.
        const x0 = st.x - CITA_W / 2;
        this.add.image(x0, WALL_CITA_Y, 'cita-previa').setOrigin(0, 0).setDepth(-90000);
        const b = serviceBoard(profile());
        b.rows.forEach((r, i) => {
          const c = CITA_BOXES[i];
          if (r.met && c) this.add.image(x0 + c.x, WALL_CITA_Y + c.y - 1, 'cita-marcas').setOrigin(0, 0).setDepth(-89999);
        });
        if (b.granted) this.add.image(x0 + CITA_STAMP.x, WALL_CITA_Y + CITA_STAMP.y, 'cita-sello').setOrigin(0, 0).setDepth(-89998);
      }
    }
    this.hubViews = { belt, curtain, phone, turnos: this.hubPending.turnos ?? null, chatarrero: this.hubPending.chatarrero ?? null, t: 0 };
    this.hubPending = {};
  }

  /** The tablón's five, from the saved profile (the unlocked ones that are not playable yet say so). */
  private boardEntries(): BoardEntry[] {
    const pr = profile();
    const shown = exhibited(pr);
    const several = playableNow(pr).length > 1;
    return rosterBoard(pr).map((r) => ({ ...r, soon: r.unlocked && !CHARACTERS[r.id], shown: several && r.id === shown }));
  }

  /** The panel low on the screen while the toaster stands at the board or the archivador. */
  private panel: BoardPart[] = [];

  /** Puts a piece of the station panel on the screen, over everything. */
  private panelAdd<T extends BoardPart & Phaser.GameObjects.Components.Depth & Phaser.GameObjects.Components.ScrollFactor>(o: T): T {
    o.setScrollFactor(0).setDepth(96000 + this.panel.length);
    this.panel.push(o);
    return o;
  }

  /** The panel's paper: a dark sheet with a coloured edge and title bar. */
  private panelPaper(L: { x: number; y: number; w: number; h: number; barH: number }, edge: number, bar: number): Phaser.GameObjects.Graphics {
    this.panelAdd(this.add.rectangle(L.x, L.y, L.w, L.h, 0x0e0c16, 0.93).setOrigin(0, 0)).setStrokeStyle(1, edge);
    this.panelAdd(this.add.rectangle(L.x + 1, L.y + 1, L.w - 2, L.barH, bar, 1).setOrigin(0, 0));
    return this.panelAdd(this.add.graphics());
  }

  /** The whole panel slides up from the bottom edge. */
  private panelSlideIn(): void {
    for (const o of this.panel) {
      const ty = o.y;
      o.y = ty + 24;
      o.alpha = 0;
      this.tweens.add({ targets: o, y: ty, alpha: 1, duration: 160, ease: 'Quad.easeOut' });
    }
    this.sound2.play('recargar', { detune: 200 });
  }

  private showBoard(): void {
    const L = boardLayout(this.boardEntries(), readScale(settings()), boardHint(keyWords()));
    // Cork edge and the board's red header.
    const g = this.panelPaper(L, 0xb97d48, 0xe0453b);
    for (const r of L.rules) for (let x = L.x + 6; x < L.x + L.w - 6; x += 4) g.fillStyle(0x3a3f5c, 1).fillRect(x, r, 2, 1);
    for (const f of L.faces) {
      this.panelAdd(this.add.rectangle(f.x - 1, f.y - 1, 6 * f.zoom + 2, 7 * f.zoom + 2, 0xf4efdc, 1).setOrigin(0, 0));
      this.panelAdd(this.add.image(f.x, f.y, 'fichas-tablon', f.frame).setOrigin(0, 0).setScale(f.zoom));
    }
    const tints: Record<BoardRole, number> = { title: 0xf4f1e8, name: 0xf4f1e8, locked: 0x858ea8, text: 0xd6cdb2, progress: 0xf6c431, soon: 0x69dbd8, shown: 0x58b45a, foot: 0x5d647e, hint: 0xf6c431 };
    for (const t of L.texts) this.panelAdd(this.add.bitmapText(t.x, t.y, FONT, fontText(t.text), L.size).setOrigin(t.right ? 1 : 0, 0)).setTint(tints[t.role]);
  }

  /** The Servicio Técnico's «Cita previa» (M12): the requirements, how far along, and the stamp. */
  private showCita(): void {
    const L = citaLayout(serviceBoard(profile()), readScale(settings()));
    // Laminated paper edge and the notice's red header.
    const g = this.panelPaper(L, 0xd6cdb2, 0xe0453b);
    for (const r of L.rules) for (let x = L.x + 6; x < L.x + L.w - 6; x += 4) g.fillStyle(0x3a3f5c, 1).fillRect(x, r, 2, 1);
    for (const b of L.boxes) {
      g.fillStyle(0x756e5a, 1).fillRect(b.x, b.y, b.side, b.side);
      g.fillStyle(0xf4f1e8, 1).fillRect(b.x + 1, b.y + 1, b.side - 2, b.side - 2);
      if (b.ticked) this.panelAdd(this.add.image(b.x, b.y - b.side / 8, 'cita-marcas').setOrigin(0, 0).setScale(b.side > 8 ? 2 : 1));
    }
    const tints: Record<CitaRole, number> = { title: 0xf4f1e8, text: 0xd6cdb2, met: 0x858ea8, progress: 0xf6c431, done: 0x58b45a, foot: 0x5d647e, granted: 0x58b45a };
    for (const t of L.texts) this.panelAdd(this.add.bitmapText(t.x, t.y, FONT, fontText(t.text), L.size).setOrigin(t.right ? 1 : 0, 0)).setTint(tints[t.role]);
  }

  /**
   * The use key at the open tablón (M13 (1)): the next character that can be played goes on
   * display, and walks on in place of the one standing there; the panel is redrawn with its mark.
   */
  private putOnDisplay(): void {
    const id = nextExhibited(profile());
    if (id === this.world.player.base.def.id) return;
    saveChosen(id);
    setCharacter(this.world, id);
    for (const o of this.panel) o.destroy();
    this.panel = [];
    this.showBoard();
    this.sound2.play('recargar', { detune: 400 });
    this.flashHero = 0.12;
    const p = this.world.player;
    for (let i = 0; i < 6; i++) this.puff(p.x + this.fx.range(-10, 10), p.y - this.fx.range(2, 20), 0.7);
  }

  /** Which document and page the archivador has open (src/sim/archive.ts). */
  private archiveCursor: ArchiveCursor = { doc: -1, page: 0 };

  private showArchive(): void {
    const a = archive(profile());
    const L = archiveLayout(a, this.archiveCursor, archiveHint(keyWords()), readScale(settings()));
    // Filing-cabinet grey with a manila title bar.
    const g = this.panelPaper(L, 0x858ea8, 0x8f6c40);
    for (let x = L.x + 6; x < L.x + L.w - 6; x += 4) g.fillStyle(0x3a3f5c, 1).fillRect(x, L.rule, 2, 1);
    const tints: Record<ArchiveRole, number> = {
      title: 0xf4f1e8, count: 0xe2c797, doc: 0x858ea8, open: 0xf6c431, missing: 0x434963, new: 0x69dbd8, page: 0xf4efdc, folio: 0x858ea8, hint: 0xf6c431,
    };
    for (const t of L.texts) this.panelAdd(this.add.bitmapText(t.x, t.y, FONT, fontText(t.text), L.size).setOrigin(t.right ? 1 : 0, 0)).setTint(tints[t.role]);
  }

  /** The use key at the archivador: the next sheet (redrawn in place, with a paper sound). */
  private turnArchivePage(): void {
    const a = archive(profile());
    const next = nextCursor(a, this.archiveCursor);
    if (next.doc === this.archiveCursor.doc && next.page === this.archiveCursor.page) return;
    this.archiveCursor = next;
    for (const o of this.panel) o.destroy();
    this.panel = [];
    this.showArchive();
    this.sound2.play('recargar', { detune: 700 });
  }

  private hidePanel(): void {
    const parts = this.panel;
    this.panel = [];
    for (const o of parts) this.tweens.add({ targets: o, y: o.y + 24, alpha: 0, duration: 120, ease: 'Quad.easeIn', onComplete: () => o.destroy() });
  }

  /** What a station of the Mostrador says now, from the saved profile (empty: it says nothing). */
  private hubPages(kind: StationKind): string[] {
    const heard = this.hubHeard[kind] ?? 0;
    this.hubHeard[kind] = heard + 1;
    return stationPages(kind, profile(), heard);
  }

  /** Times each station has spoken in this visit to the Mostrador: the second time it says something shorter. */
  private hubHeard: Partial<Record<StationKind, number>> = {};

  /** The interact button was pressed at a station on this frame (the sim's 'interact' event). */
  private hubAsk = false;

  /** The Mostrador's idle life: the conveyor runs, the ticket machine blinks, the Chatarrero's wheel squeaks. */
  private drawHub(dt: number): void {
    const h = this.hubViews;
    if (!h) return;
    h.t += dt;
    h.belt.setFrame(Math.floor(h.t * 10) % 4);
    h.turnos?.setFrame(Math.floor(h.t * 1.5) % 2);
    h.chatarrero?.setFrame(Math.floor(h.t * 2.5) % 3 === 0 ? 1 : 0);
    // At something that talks, the interact button makes it say its piece, page after page
    // (src/sim/dialogue.ts). Walking up to it no longer does (nota del humano del 2026-10-30).
    const st = this.world.leftHub ? null : nearStation(this.world);
    const kind = st?.kind ?? null;
    const asked = this.hubAsk;
    this.hubAsk = false;
    if (kind !== this.hubAt) {
      this.hubAt = kind;
      // Walked off: the current page ends and the rest is not said.
      this.tillNext = [];
      if (this.bubble) this.bubbleT = Math.min(this.bubbleT, 0.01);
      if (this.panel.length) this.hidePanel();
    }
    if (st && asked && (st.kind === 'tablon' || st.kind === 'archivador' || st.kind === 'cita')) {
      // The board and the archivador do not talk: they open a panel (src/render/board.ts,
      // archivo.ts); pressing again at the open archivador turns the sheet.
      if (st.kind === 'archivador' && this.panel.length) this.turnArchivePage();
      else if (st.kind === 'tablon' && this.panel.length) this.putOnDisplay();
      else if (!this.panel.length) {
        if (st.kind === 'tablon') this.showBoard();
        else if (st.kind === 'cita') this.showCita();
        else {
          this.archiveCursor = firstCursor(archive(profile()));
          this.showArchive();
        }
        this.panelSlideIn();
      }
    } else if (st && asked && !this.bubble) {
      const [first, ...rest] = this.hubPages(st.kind);
      if (first) {
        this.talkAt = st.kind === 'caja' ? null : { x: st.x, y: st.y, top: STATION_TOP[st.kind] };
        this.sound2.play('recargar', { detune: st.kind === 'telefono' ? 500 : -300 });
        this.tillSay(first, rest);
      }
    }
    // The phone's receiver swings on its cord; faster while the recording plays.
    h.phone?.setFrame(Math.floor(h.t * (this.bubble && this.hubAt === 'telefono' ? 6 : 1.2)) % 2);
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
    const p = w.player;
    if (outcome === 'floor' && w.level < LAST_LEVEL) {
      // A floor cleared, but the run goes on upstairs: it counts as a floor, not as a run.
      const weapons = p.arsenal.map((ws) => ws.base.id);
      saveFloor({ character: p.base.def.id, seconds: w.tick * DT, items: p.items, ...(p.active ? { active: p.active.id } : {}), weapons, killsBy: w.killsBy, ...deedsOf(w) });
      return;
    }
    this.runRecorded = true;
    if (this.daily) {
      saveDaily(this.daily, { level: w.level, won: outcome === 'floor', seconds: this.runBefore.seconds + w.tick * DT, kills: this.runBefore.kills + w.kills });
    }
    saveRun({
      character: p.base.def.id,
      outcome,
      seconds: this.runBefore.seconds + w.tick * DT,
      floorSeconds: w.tick * DT,
      level: w.level,
      kills: this.runBefore.kills + w.kills,
      coupons: p.coupons,
      bosses: this.runBosses,
      docs: w.docs,
      killsBy: w.killsBy,
      ...deedsOf(w),
      ...(outcome === 'down' && this.downCause ? { cause: this.downCause } : {}),
      items: p.items,
      ...(p.active ? { active: p.active.id } : {}),
      weapons: p.arsenal.map((ws) => ws.base.id),
    });
  }

  /** The true ending (M12 (5)): the screen goes dark and the workshop takes the toaster (FinalScene). */
  private startEnding(): void {
    const e = this.ending;
    if (!e || e.started) return;
    e.started = true;
    this.sound2.playMusic(null, 0.6);
    this.cameras.main.fadeOut(900, 14, 12, 22);
    const character = this.world.player.base.def.id;
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start('final', { character, times: e.times }));
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
    if (!this.canAskNewUnit()) return;
    this.goOn();
  }

  /**
   * After a report: a floor won with another one upstairs carries on there with the same
   * toaster (same run); anything else starts a new unit.
   */
  private goOn(): void {
    const next = this.world.won ? nextFloor(this.world) : null;
    if (next) {
      this.runBefore = { seconds: this.runBefore.seconds + this.world.tick * DT, kills: this.runBefore.kills + this.world.kills };
      this.carry = next;
    }
    this.scene.restart();
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
    const sub = this.hud(this.add.bitmapText(x, y, FONT, fontText(card.subtitle ?? BOSS_CARD_SUBTITLE), small)).setDepth(96001);
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
    this.bossBar = { boss: boss.id, name, g, trail: 0, fill: 0, flash: 0, alpha: 1, veil: 1 };
    if (!this.world.intro) this.bossBar.fill = this.bossBar.trail = 1 - boss.damageTaken / boss.def.hp;
  }

  /** Screen boxes of what must not hide under the boss bar: the toaster and the voice menu zones. */
  private underBossBar(boss: Enemy | undefined): Box[] {
    const v = this.cameras.main.worldView;
    const p = this.world.player;
    const out: Box[] = [{ x: p.x - v.x - 9, y: p.y - v.y - 22, w: 18, h: 24 }];
    for (const z of boss?.menu?.zones ?? []) {
      out.push({ x: z.x - v.x - MENU_ZONE_W / 2 - 2, y: z.y - v.y - MENU_ZONE_H / 2 - 2, w: MENU_ZONE_W + 4, h: MENU_ZONE_H + 4 });
    }
    return out;
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
    // It steps back while the toaster or the voice menu zones are under it on the screen.
    const veiled = bossBarVeiled(bar.name.width, this.underBossBar(boss));
    bar.veil = veiled ? Math.max(BOSS_BAR_VEIL, bar.veil - dt * 5) : Math.min(1, bar.veil + dt * 3);
    const x = Math.round((VIEW_W - BOSS_BAR_W) / 2);
    const y = BOSS_BAR_Y;
    const g = bar.g;
    g.clear().setAlpha(bar.alpha * bar.veil);
    bar.name.setAlpha(bar.alpha * bar.veil);
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
  private raiseLift(x: number, y: number, already = false, service = false): void {
    this.liftView?.s.destroy();
    this.liftView?.hole.destroy();
    this.liftView?.arrow.destroy();
    const hole = this.add.rectangle(Math.round(x) - 20, Math.round(y) - 10, 40, 23, 0x0e0c16, 1).setOrigin(0, 0).setDepth(-60001).setAlpha(0);
    // The Servicio Técnico's (M12 (2)) is taller (its sign stands behind the plate) and goes up.
    const s = service
      ? this.add.image(Math.round(x), Math.round(y), 'montacargas-servicio', 0).setOrigin(0.5, 30 / 44).setDepth(-60000)
      : this.add.image(Math.round(x), Math.round(y), 'montacargas', 0).setOrigin(0.5, 20 / 34).setDepth(-60000);
    const arrow = this.add.graphics().setDepth(85000);
    this.liftView = { s, hole, arrow, upT: already ? 1 : 0, service };
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
    const H = v.service ? 44 : 34;
    v.upT += dt;
    let d = Math.round((1 - Math.min(1, v.upT / 0.6)) * (v.service ? 30 : 22));
    if (this.winT >= 0 && v.service) {
      // Going up: the plate stays and a cold beam of light takes the toaster (see the hero's rise).
      d = 0;
      const k = Math.min(1, this.winT / WIN_SINK);
      v.arrow.clear();
      v.arrow.fillStyle(0xb6f1c0, 0.18 * Math.sin(k * Math.PI) + 0.06).fillRect(Math.round(l.x) - 16, Math.round(l.y) - 120, 32, 128);
      v.arrow.fillStyle(0xf4f1e8, 0.2 * Math.sin(k * Math.PI)).fillRect(Math.round(l.x) - 8, Math.round(l.y) - 120, 16, 128);
      v.arrow.setDepth(Math.round(l.y) + 1);
    } else if (this.winT >= 0) {
      const k = Math.min(1, this.winT / WIN_SINK);
      d = Math.round(k * k * 34);
      v.hole.setAlpha(1);
    }
    v.s.setPosition(Math.round(l.x), Math.round(l.y) + d);
    v.s.setCrop(0, 0, W, Math.max(0, H - d));
    v.s.setVisible(d < H);
    if (this.winT < 0 || !v.service) v.arrow.clear();
    if (l.t >= LIFT_READY && this.winT < 0) {
      // A bouncing yellow arrow over it: step on here.
      const bob = Math.round(Math.abs(Math.sin(this.time.now / 180)) * 4);
      const ax = Math.round(l.x);
      const ay = Math.round(l.y) - (v.service ? 40 : 30) - bob;
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
  private showPhaseCard(phase: number, title: string, stage = phase + 1): void {
    const color = phase >= 1 ? 0xe0453b : 0x69dbd8;
    const y = BOSS_BAR_Y - 46;
    const band = this.hud(this.add.rectangle(0, y, VIEW_W, 32, 0x0e0c16, 0.62).setOrigin(0, 0)).setDepth(95000);
    const edge = this.hud(this.add.rectangle(0, y + 32, VIEW_W, 1, color, 1).setOrigin(0, 0)).setDepth(95000);
    const sub = this.hud(this.add.bitmapText(VIEW_W / 2, y + 3, FONT, fontText(bossPhaseLabel(stage)), 8).setOrigin(0.5, 0)).setDepth(95001);
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
      slip: this.slip ? { read: this.slip.shown >= this.slip.total, stamped: this.slip.stamped >= 0, text: this.slip.lines.map((l) => l.o.text).join(' ') } : null,
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
    if (this.slip) {
      // The run waits for the slip to be read.
      this.updateSlip(dt);
      this.syncView(dt);
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
        // The shot that put the return slip away is not a shot: the trigger counts once let go.
        if (this.slipFire) {
          if (input.fire) input.fire = false;
          else this.slipFire = false;
        }
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
        case 'interact':
          // At a station of the Mostrador: drawHub() makes it talk (or opens its panel).
          this.hubAsk = true;
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
          // The limited edition's last bullet: a collector's chime and a bigger kick.
          if (e.limited) {
            this.sound2.play('clinc', { detune: 700 });
            this.gunKick = 5;
          }
          // Pósit de Urgente: the first shot after a roll, with a sharper click.
          if (e.urgent) {
            this.sound2.play('clinc', { detune: 200, volume: 0.7 });
            this.gunKick = 4;
          }
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
          // (No damage numbers: nota del humano del 2026-10-30. The flash, the sparks and the wobble say it.)
          if (e.crit) {
            // A critical hit: a longer stop, a wider spray and its line over the target.
            this.hitstop = 0.075;
            this.shake(90, 0.006, true);
            for (let i = 0; i < 6; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(70, 150), 0);
            this.floatText(e.x, e.y - 18, fontText(CRIT_LINE), 0xec8a2c, `crit:${e.target}`, -22, 0.5);
          }
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
        case 'toast':
          // «Una de cada dos»: the spring pops a slice out of the slots; the burnt one smokes.
          this.sound2.play('muelle', { detune: e.burnt ? -300 : 200 });
          this.gunKick = 2;
          for (let i = 0; i < (e.burnt ? 5 : 2); i++) this.puff(e.x + this.fx.range(-3, 3), e.y - this.fx.range(0, 4), e.burnt ? 0.8 : 0.4);
          break;
        case 'rush':
          // Pilas No Incluidas: borrowed batteries in, a zap and a few sparks off the gun.
          this.sound2.play('pila', { detune: 500 });
          for (let i = 0; i < 6; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 1, 0xf6c431);
          break;
        case 'hurtRing':
          // Mando con Vibración: the toaster buzzes and its bullets go out all round.
          this.sound2.play('zumbido', { detune: 400, volume: 0.6 });
          this.shake(90, 0.005);
          break;
        case 'stick':
          // Plastilina Mezclada: a wet squelch and a couple of crumbs (glitter with Manualidades).
          this.sound2.play('chof', { detune: 600 + this.fx.range(-200, 200), volume: 0.35 });
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(15, 35), 1, e.slows ? 0xea93a8 : 0x8a7a6a);
          break;
        case 'pet':
          if (e.level > 0) {
            // Mascota Virtual fed: a happy beep, little hearts and its level.
            this.sound2.play('clinc', { detune: 900 + 200 * e.level });
            for (let i = 0; i < 4 + 2 * e.level; i++) this.spark(e.x, e.y - 6, -Math.PI / 2 + this.fx.range(-1, 1), this.fx.range(30, 70), 1, 0xea93a8);
            this.floatText(e.x, e.y - 18, fontText(petFedLine(e.level, e.max)), 0xea93a8, 'pet', -14, 1.1);
          } else {
            // Starved by a hit: the sad descending beep of a dead pixel pet.
            this.sound2.play('apagar', { detune: 300 });
            this.floatText(e.x, e.y - 30, fontText(PET_DEAD_LINE), 0x8a92a8, 'pet', -10, 1.3);
          }
          break;
        case 'shrug':
          // Caja de Cartón Vacía: the blow lands on cardboard. A dull thud, scraps, and the line.
          this.sound2.play('golpe', { detune: -700, volume: 0.6 });
          for (let i = 0; i < 6; i++) this.splinter(e.x + this.fx.range(-5, 5), e.y, this.fx.range(0, Math.PI * 2), 0xa96a3f);
          this.floatText(e.x, e.y - 18, fontText(SHRUG_LINE), 0xe9d9a8, 'shrug', -12, 1.1);
          break;
        case 'replyAll':
          // Responder a Todos: the new-mail ping, and a spark down the way of each reply.
          this.sound2.play('cupon', { detune: 900, volume: 0.45 });
          for (const a of e.angles) for (let i = 0; i < 2; i++) this.spark(e.x, e.y, a + this.fx.range(-0.25, 0.25), this.fx.range(60, 110), e.urgent ? 0 : 1);
          break;
        case 'punch':
          // Tarjeta de Fichar: the clock-in machine's beep and the time stamped over the extra coupon.
          this.sound2.play('cupon', { detune: 500, volume: 0.8 });
          this.floatText(e.x, e.y - 14, fontText(punchLine(e.secs)), 0x69dbd8, 'punch', -12, 1.2);
          break;
        case 'queue':
          // Número de Turno: the queue moves on one; the ding of the ticket display and the number.
          this.sound2.play('cupon', { detune: e.top ? 1200 : 300, volume: 0.5 });
          this.floatText(e.x, e.y - 16, fontText(queueLine(e.level, e.top)), e.top ? 0xf6c431 : 0x69dbd8, 'queue', -12, 1.1);
          break;
        case 'echo':
          // Contestador Automático: the beep when the shot is recorded; the playback, a muffled copy of the shot.
          if (!e.played) this.sound2.play('clinc', { detune: 1400, volume: 0.35 });
          else {
            this.sound2.play(WEAPONS[e.weapon]?.look.sound ?? 'disparo', { detune: -400, volume: 0.45 });
            for (let i = 0; i < 2; i++) this.spark(e.x, e.y, e.angle + this.fx.range(-0.3, 0.3), this.fx.range(30, 60), 0, 0xb7bed0);
          }
          break;
        case 'recorded':
          // Llamada Grabada: the enemy that hurt you is on the record.
          this.sound2.play('clinc', { detune: -300, volume: 0.6 });
          this.floatText(e.x, e.y - 34, fontText(RECORDED_LINE), 0xe0453b, `recorded:${e.target}`, -10, 1.1);
          break;
        case 'tag':
          // Etiquetadora: a label stuck on; the slap of the paper, higher with each one.
          this.sound2.play('clinc', { detune: -900 + 500 * e.count, volume: 0.45 });
          break;
        case 'markdown':
          this.markdownFx(e);
          break;
        case 'complaint':
          // Hoja de Reclamaciones: the stamp on the form, and the name of who it is against.
          this.sound2.play('golpe', { detune: 900, volume: 0.4 });
          this.floatText(e.x, e.y - 44, fontText(COMPLAINT_LINE), 0xea93a8, `complaint:${e.target}`, -10, 1.1);
          break;
        case 'stars':
          if (e.paid) {
            // Five stars: the heart arrives, with the chime of a survey done.
            this.sound2.play('cupon', { detune: 1500, volume: 0.8 });
            for (let i = 0; i < 12; i++) this.spark(e.x, e.y - 6, -Math.PI / 2 + this.fx.range(-1.2, 1.2), this.fx.range(40, 90), 1, i % 2 ? 0xf6c431 : 0xe0453b);
            this.floatText(e.x, e.y - 20, fontText(STARS_PAID_LINE), 0xf6c431, 'stars', -14, 1.6);
          } else if (e.stars > 0) {
            this.sound2.play('clinc', { detune: 600 + 200 * e.stars, volume: 0.6 });
            for (let i = 0; i < 3 + e.stars; i++) this.spark(e.x, e.y - 6, -Math.PI / 2 + this.fx.range(-1, 1), this.fx.range(30, 60), 1, 0xf6c431);
            this.floatText(e.x, e.y - 18, fontText(starsLine(e.stars, e.need)), 0xf6c431, 'stars', -12, 1.2);
          } else {
            // A hit: the rating is taken back.
            this.sound2.play('apagar', { detune: 500, volume: 0.6 });
            this.floatText(e.x, e.y - 30, fontText(STARS_LOST_LINE), 0x8a92a8, 'stars', -10, 1.2);
          }
          break;
        case 'merit':
          if (e.was === undefined) {
            // «Experiencia demostrable»: a point on the CV, with a little chime that climbs.
            this.sound2.play('clinc', { detune: 300 + 150 * e.level, volume: 0.55 });
            for (let i = 0; i < 4; i++) this.spark(e.x, e.y - 6, -Math.PI / 2 + this.fx.range(-1, 1), this.fx.range(30, 60), 1, 0x58b45a);
            this.floatText(e.x, e.y - 18, fontText(meritLine(e.level, e.max)), 0x58b45a, 'merit', -12, 1.2);
          } else {
            // A hit: half of it «no se valora».
            this.sound2.play('apagar', { detune: 300, volume: 0.6 });
            this.floatText(e.x, e.y - 30, fontText(MERIT_LOST_LINE), 0x8a92a8, 'merit', -10, 1.2);
          }
          break;
        case 'expired':
          // Código Promocional Caducado: no chest here. A flat buzz and the stamp, in tired red.
          this.sound2.play('vacio', { detune: -300, volume: 0.6 });
          this.floatText(e.x, e.y - 14, fontText(EXPIRED_LINE), 0xe0453b, 'expired', -10, 1.4);
          break;
        case 'trialEnd':
          // Contrato en Prácticas: not renewed. The item leaves the inventory with a line.
          this.sound2.play('vacio', { detune: -500, volume: 0.7 });
          this.floatText(e.x, e.y - 30, fontText(TRIAL_END_LINE), 0xc3c9d6, 'trial', -10, 1.6);
          break;
        case 'mugLost':
          // Taza de Mejor Empleado: no longer the best. A small sad clink and the line, in grey.
          this.sound2.play('vacio', { detune: -300, volume: 0.7 });
          this.floatText(e.x, e.y - 30, fontText(MUG_LOST_LINE), 0xc3c9d6, 'mug', -10, 1.2);
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
        case 'lagJump':
          // The wireless mouse turns up somewhere else: a puff where it was and a click where it is.
          this.puff(e.x, e.y, 0.3);
          this.puff(e.tx, e.ty, 0.3);
          this.sound2.play('recargado', { detune: -600 });
          for (let i = 0; i < 4; i++) this.spark(e.tx, e.ty - 6, this.fx.range(0, Math.PI * 2), this.fx.range(30, 60), 0);
          break;
        case 'reveal':
          // A fake charger found out: it jumps up with a spark and its line.
          this.sound2.play('saltar', { detune: 300 });
          for (let i = 0; i < 5; i++) this.spark(e.x, e.y, this.fx.range(-Math.PI, 0), this.fx.range(30, 70), 0);
          // A pair found out at once says it once.
          if (!this.floats.some((f) => f.key === 'reveal' && (f.age ?? 0) < 0.6)) this.floatText(e.x, e.y - 14, fontText(REVEAL_LINE), 0x69dbd8, 'reveal', -16, 0.9);
          break;
        case 'relayPlant':
          // A repeater plugged into the floor: a hop, dust and a spark.
          this.sound2.play('saltar', { detune: -300 });
          for (let i = 0; i < 4; i++) this.puff(e.x + this.fx.range(-6, 6), e.y + this.fx.range(-2, 2), 0.4);
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y - 14, this.fx.range(-Math.PI, 0), this.fx.range(30, 60), 0);
          break;
        case 'summon':
          // Its helpers pop out of nowhere (out of stock, always): a hop, dust and gift-wrap bits.
          this.sound2.play('saltar', { detune: 600 });
          for (const id of e.spawned) {
            const k = this.world.enemies.find((en) => en.id === id);
            if (!k) continue;
            for (let i = 0; i < 4; i++) this.puff(k.x + this.fx.range(-5, 5), k.y + this.fx.range(-2, 2), 0.4);
            for (let i = 0; i < 5; i++) this.spark(k.x, k.y - 10, this.fx.range(-Math.PI, 0), this.fx.range(40, 90), 2, this.fx.pick([0xe0453b, 0xf6c431, 0xe070c8]));
          }
          break;
        case 'shed':
          this.shellShed(e);
          break;
        case 'clap': {
          // «Reestructuración»: one sharp clap, three white lines off his hands, and the glass
          // starts to move.
          this.sound2.play('palmada');
          this.shake(90, 0.004, true);
          for (let i = 0; i < 6; i++) this.spark(e.x + 20, e.y - 40, -Math.PI / 2 + this.fx.range(-1.1, 1.1), this.fx.range(60, 110), 0, 0xf4f1e8);
          break;
        }
        case 'restructure':
          this.sound2.play('deslizar', { volume: 0.6 });
          break;
        case 'slid':
          // The glass stops against its new rail: a dull knock and some carpet dust.
          this.sound2.play('chapa', { detune: -900, volume: 0.5 });
          for (let i = 0; i < 4; i++) this.puff(e.x + this.fx.range(-34, 34), e.y + 1, 0.3);
          break;
        case 'runway':
          // Off down the catwalk: a fanfare of flashes going off at once.
          this.sound2.play('pasarela');
          this.sound2.play('obturador', { volume: 0.8 });
          break;
        case 'flash':
          // Each flash left behind: a click, and it starts charging.
          this.sound2.play('obturador', { detune: this.fx.range(300, 900), volume: 0.35 });
          break;
        case 'drops':
          this.sound2.play('apagar', { detune: 400, volume: 0.7 });
          break;
        case 'recStart':
          // A webcam starts recording: a beep and its red line over it.
          this.sound2.play('grabar');
          this.floatText(e.x, e.y - 10, fontText(REC_LINE), 0xe0453b, `rec:${e.source}`, -12, 0.9);
          break;
        case 'recLost':
          this.sound2.play('apagar', { volume: 0.7 });
          this.floatText(e.x, e.y - 10, fontText(REC_LOST_LINE), 0xb7bed0, `rec:${e.source}`, -12, 0.9);
          break;
        case 'alert':
          // It shares its screen: the photo's flash and shutter, and everyone in the room attacks at once.
          this.sound2.play('obturador');
          if (e.told.length > 0) this.sound2.play('aviso', { detune: 500, volume: 0.8 });
          // A spark over each enemy it told: they are live now.
          for (const id of e.told) {
            const o = this.world.enemies.find((x) => x.id === id);
            if (o) for (let i = 0; i < 3; i++) this.spark(o.x, o.y - 20, this.fx.range(-Math.PI, 0), this.fx.range(30, 60), 0);
          }
          for (let i = 0; i < 8; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(40, 90), 0);
          this.floatText(e.x, e.y - 10, fontText(ALERT_LINE), 0xf6c431, `rec:${e.source}`, -14, 1.1);
          break;
        case 'jam':
          // A printer jams: grinding, a couple of scraps of paper and its line over it.
          this.sound2.play('atasco', { detune: this.fx.range(-150, 150) });
          for (let i = 0; i < 4; i++) this.spark(e.x + this.fx.range(-5, 5), e.y, this.fx.range(-Math.PI, 0), this.fx.range(20, 50), 0);
          this.floatText(e.x, e.y - 14, fontText(JAM_LINE), 0xf4f1e8, `jam:${e.source}`, -16, 1);
          break;
        case 'windUp':
          // A wind-up robot winding itself up: the ratchet of its key (the warning that it is off again).
          this.sound2.play('cuerda', { detune: this.fx.range(-100, 100), volume: 0.8 });
          break;
        case 'windGo':
          for (let i = 0; i < 3; i++) this.puff(e.x - this.fx.range(4, 8), e.y + this.fx.range(-2, 1), 0.3);
          break;
        case 'shred':
          // A bullet into the blades: a grind and a few white flecks of paper.
          this.sound2.play('triturar', { detune: this.fx.range(-150, 150), volume: 0.7 });
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(20, 50), 0, 0xf4f1e8);
          break;
        case 'shredSpit':
          this.sound2.play('escupir', { detune: this.fx.range(-100, 100), volume: 0.8 });
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 0, 0xf4f1e8);
          break;
        case 'copyScan':
          // The lid comes up and the lamp hums across the glass.
          this.sound2.play('escanear', { detune: e.target < 0 ? -300 : 0, volume: 0.8 });
          break;
        case 'copyMade':
          this.sound2.play('copia', { detune: this.fx.range(-100, 100), volume: 0.9 });
          for (let i = 0; i < 4; i++) this.spark(e.x, e.y - 8, this.fx.range(0, Math.PI * 2), this.fx.range(20, 50), 0, 0xf4f1e8);
          this.floatText(e.x, e.y - 30, fontText(COPY_LINE), 0xb7bed0, `copy:${e.copy}`, -16, 0.9);
          break;
        case 'acBlow':
          // It is about to blow: a rising hiss of cold air, and the temperature nobody chose.
          this.sound2.play('soplar', { detune: this.fx.range(-100, 100) });
          this.floatText(e.x, e.y - 46, fontText(AC_LINE), 0x8fe3ff, `ac:${e.source}`, -12, 0.8);
          break;
        case 'turnCall': {
          // A turn called: the chime of every waiting room, and the number and window over its circle.
          this.sound2.play('turno');
          this.time.delayedCall(190, () => this.sound2.play('turno', { detune: -500 }));
          this.floatText(e.x, e.y - 44, fontText(turnCallLine(e.num, e.desk)), 0xf6c431, `turn:${e.source}`, -8, 1.4);
          break;
        }
        case 'turnServed':
          this.sound2.play('desbloquear', { volume: 0.6 });
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            this.spark(e.x + Math.cos(a) * 36, e.y + Math.sin(a) * 36, a, this.fx.range(15, 35), 0, 0x7fe08a);
          }
          this.floatText(e.x, e.y - 30, fontText(TURN_SERVED_LINE), 0x7fe08a, `turn:${e.source}`, -14, 0.9);
          break;
        case 'tapeSnap': {
          // One post broke: its tape whips back into the other with a clack.
          this.sound2.play('cinta');
          for (const [id, v] of this.tapeViews) {
            if (this.world.enemies.some((en) => en.id === id && en.mate !== undefined)) continue;
            const atA = Math.hypot(v.ax - e.x, v.ay - e.y) < Math.hypot(v.bx - e.x, v.by - e.y);
            this.tapeSnaps.push({ x: atA ? v.ax : v.bx, y: atA ? v.ay : v.by, fx: atA ? v.bx : v.ax, fy: atA ? v.by : v.ay, t: 0 });
          }
          this.floatText(e.x, e.y - 14, fontText(TAPE_SNAP_LINE), 0x4aa8ff, `tape:${e.source}`, -14, 0.9);
          break;
        }
        case 'typing':
          for (let i = 0; i < 3; i++) this.time.delayedCall(i * 75, () => this.sound2.play('teclear', { detune: this.fx.range(-150, 150) }));
          this.floatText(e.x, e.y - 4, fontText(TYPING_LINE), 0x8fe3ff, `typing:${e.source}`, -6, 0.6);
          break;
        case 'faqUp':
          // It learned where the shots come from: up go its canned answers, that way.
          this.sound2.play('escanear', { detune: 600, volume: 0.7 });
          this.floatText(e.x + Math.cos(e.dir) * 18, e.y - 22, fontText(FAQ_LINE), 0x8fe3ff, `faq:${e.source}`, -12, 1.1);
          break;
        case 'faqBlock':
          // Answered with a frequently asked question: the shot stops on the shield.
          this.sound2.play('pared', { detune: 500, volume: 0.5 });
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y, e.angle + Math.PI + this.fx.range(-0.8, 0.8), this.fx.range(30, 60), 0, 0x8fe3ff);
          break;
        case 'helpAsk':
          this.floatText(e.x, e.y - 18, fontText(HELP_ASK_LINE), 0x8fe3ff, `help:${e.source}`, -10, 1.4);
          break;
        case 'phoneRing':
          // Three rings of the old bell, each with its little ring of bullets.
          for (const at of e.at) this.time.delayedCall(at * 1000, () => this.sound2.play('timbre', { detune: this.fx.range(-60, 60) }));
          break;
        case 'phoneCall':
          // One short ring and the call is on its way.
          this.sound2.play('timbre', { detune: 300, volume: 0.8 });
          break;
        case 'transferStart':
          this.sound2.play('transferir', { detune: -300 });
          this.floatText(e.x, e.y - 4, fontText(e.to === undefined ? HOLD_LINE : TRANSFER_LINE), 0xffd84a, `transfer:${e.source}`, -10, 1.2);
          break;
        case 'transferDone':
          // Put through: each one pops out where the other was.
          this.sound2.play('transferir', { detune: 400 });
          this.puff(e.ax, e.ay, 0.3);
          this.puff(e.bx, e.by, 0.3);
          for (let i = 0; i < 5; i++) {
            this.spark(e.ax, e.ay - 12, this.fx.range(0, Math.PI * 2), this.fx.range(25, 55), 0, 0xffd84a);
            this.spark(e.bx, e.by - 12, this.fx.range(0, Math.PI * 2), this.fx.range(25, 55), 0, 0xffd84a);
          }
          break;
        case 'onHold':
          this.sound2.play('espera', { volume: 0.6 });
          break;
        case 'menuZones': {
          // The voice menu: a keypad tone for each zone that lights up, and the recording starts.
          for (let i = 0; i < e.count; i++) this.time.delayedCall(i * 110, () => this.sound2.play('pulsar', { detune: i * 200 }));
          const top = this.menuTop(e.boss);
          if (top) this.floatText(top.x, top.y, fontText(this.fx.pick(MENU_INTRO_LINES)), 0xd6ecff, `menu:${e.boss}`, -6, 1.1);
          break;
        }
        case 'menuOption':
          // «Para reclamaciones, pulse 3»: over her, in big, with the tone of that key.
          this.sound2.play('pulsar', { detune: 700 });
          this.time.delayedCall(120, () => this.sound2.play('pulsar', { detune: 700 }));
          {
            // Over the zones, where the eyes are (she may well be off screen).
            const top = this.menuTop(e.boss) ?? { x: e.x, y: e.y - 80 };
            this.floatText(top.x, top.y, fontText(menuOptionLine(e.n, this.fx.int(0, 5))), 0xf6c431, `menu:${e.boss}`, -4, 1.6);
          }
          break;
        case 'menuRain':
          // Static on the line: the wrong zones get it all at once.
          this.sound2.play('chaparron');
          this.shake(110, 0.005);
          for (const z of e.zones) {
            for (let i = 0; i < 6; i++) {
              this.spark(z.x + this.fx.range(-30, 30), z.y + this.fx.range(-18, 18), -Math.PI / 2 + this.fx.range(-0.5, 0.5), this.fx.range(30, 70), 2, 0xff6e5a);
            }
          }
          break;
        case 'mute': {
          // Gone quiet: the busy tone, three times over the second, and it written over her.
          for (let i = 0; i < 3; i++) this.time.delayedCall(i * 330, () => this.sound2.play('comunicando'));
          const boss = this.world.enemies.find((en) => en.id === e.boss);
          if (boss) this.floatText(boss.x, boss.y - 80, fontText(MUTE_LINE), 0xb4b0c4, `menu:${boss.id}`, -6, e.time);
          break;
        }
        case 'scan': {
          // «Diagnóstico»: the scanner beeps, the beam goes over the toaster and the verdict comes up over it.
          this.scans.push({ boss: e.boss, t: 0, time: e.time });
          this.sound2.play('escaner');
          const boss = this.world.enemies.find((en) => en.id === e.boss);
          // Under its tracks, between it and the toaster: over its hopper it would be off the screen.
          if (boss) this.floatText(boss.x, boss.y + 16, fontText(e.line), 0xff8a70, `scan:${boss.id}`, -4, e.time + 0.6);
          break;
        }
        case 'conveyor':
          // «Despiece»: the belt starts up with a lurch and a clatter (or winds down when she falls).
          if (e.on) {
            this.shake(220, 0.006);
            this.sound2.play('ascensor', { detune: -300 });
            this.sound2.play('atasco', { detune: -400 });
          } else this.sound2.play('ascensor', { detune: -900 });
          break;
        case 'crateMark':
          // Up in the dark, something creaks: the crates are on their way.
          this.sound2.play('aviso', { detune: -500 });
          this.sound2.play('chapa', { detune: -900, volume: 0.5 });
          break;
        case 'crateLand':
          this.cratesLand(e);
          break;
        case 'bite': {
          // Into the intake rollers: grinding, sparks and thrown back down the belt.
          this.shake(160, 0.008, true);
          this.sound2.play('triturar', { detune: -300 });
          this.sound2.play('empujon');
          const a = Math.atan2(e.dirY, e.dirX);
          for (let i = 0; i < 10; i++) this.spark(e.x, e.y - 8, a + this.fx.range(-1.1, 1.1), this.fx.range(50, 130), this.fx.int(0, 2));
          break;
        }
        case 'deptMark': {
          // The bell: two rings, and she says it.
          this.sound2.play('timbre', { detune: 150 });
          this.time.delayedCall(260, () => this.sound2.play('timbre', { detune: 150 }));
          const boss = this.world.enemies.find((en) => en.id === e.boss);
          if (boss) this.floatText(boss.x, boss.y - 80, fontText(DEPT_MARK_LINE), 0xffd84a, `menu:${boss.id}`, -6, 1.2);
          break;
        }
        case 'deptTransfer':
          // Put through: gone from one spot in a puff, out at the other, and where it is now.
          this.sound2.play('transferir', { detune: 200 });
          this.time.delayedCall(90, () => this.sound2.play('transferir', { detune: 600 }));
          this.puff(e.fromX, e.fromY, 0.4);
          this.puff(e.x, e.y, 0.4);
          for (let i = 0; i < 6; i++) {
            this.spark(e.fromX, e.fromY - 10, this.fx.range(0, Math.PI * 2), this.fx.range(25, 60), 0, 0xffd84a);
            this.spark(e.x, e.y - 10, this.fx.range(0, Math.PI * 2), this.fx.range(25, 60), 0, 0xffd84a);
          }
          this.deptLines.push({ ax: e.fromX, ay: e.fromY - 8, bx: e.x, by: e.y - 8, t: 0 });
          this.floatText(e.x, e.y - 30, fontText(deptTransferLine(e.dept)), 0xffd84a, 'deptTransfer', -12, 1.3);
          break;
        case 'tapeBump':
          // Into the tape: it gives a little and throws the toaster back. No queue-jumping.
          this.sound2.play('muelle', { volume: 0.35, detune: 300 });
          this.floatText(e.x, e.y - 34, fontText(TAPE_BUMP_LINE), 0x4aa8ff, 'tapeBump', -14, 0.7);
          break;
        case 'turnLost':
          // Too late: the buzzer, and the dispenser loses its patience.
          this.sound2.play('denegado');
          this.shake(90, 0.004);
          this.floatText(e.x, e.y - 30, fontText(TURN_LOST_LINE), 0xe0453b, `turn:${e.source}`, -14, 1);
          break;
        case 'stampRise':
          // Up it goes, to stamp: a creak of the handle.
          this.sound2.play('saltar', { detune: -300, volume: 0.5 });
          break;
        case 'stamp': {
          // Down: a heavy thud, the floor shakes, ink splashes and it says what it is.
          this.sound2.play('estampar', { detune: this.fx.range(-100, 100) });
          this.shake(110, e.hit ? 0.009 : 0.005, true);
          for (let i = 0; i < 10; i++) {
            const a = this.fx.range(0, Math.PI * 2);
            this.spark(e.x + Math.cos(a) * e.w * 0.4, e.y + Math.sin(a) * e.h * 0.4, a, this.fx.range(20, 60), 0, 0xe0453b);
          }
          for (let i = 0; i < 4; i++) this.puff(e.x + this.fx.range(-e.w / 2, e.w / 2), e.y + this.fx.range(-2, 2), 0.3);
          this.floatText(e.x, e.y - 40, fontText(STAMP_LINE), 0xe0453b, `stamp:${e.source}`, -14, 0.7);
          break;
        }
        case 'rollDenied':
          // No roll on the ink: a buzzer, a stumble and the form letter.
          this.sound2.play('denegado');
          for (let i = 0; i < 3; i++) this.puff(e.x - e.dirX * 4 + this.fx.range(-3, 3), e.y, 0.25);
          this.floatText(e.x, e.y - 40, fontText(ROLL_DENIED_LINE), 0xe0453b, 'rollDenied', -16, 0.9);
          break;
        case 'tonerOut':
          this.floatText(e.x, e.y - 40, fontText(TONER_OUT_LINE), 0xb8f07a, `toner:${e.source}`, -12, 1.1);
          break;
        case 'shredJam':
          // About to lunge: the blades whirr up, and it says so.
          this.sound2.play('triturar', { detune: -500, volume: 0.9 });
          this.floatText(e.x, e.y - 34, fontText(SHRED_JAM_LINE), 0xe0453b, `shred:${e.source}`, -16, 0.6);
          break;
        case 'windBounce':
          // Tin against the wall: a clank and a couple of sparks.
          this.sound2.play('chapa', { detune: this.fx.range(-200, 200), volume: 0.7 });
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 2);
          break;
        case 'carStall':
          // Batteries not included: it splutters to a halt.
          this.sound2.play('apagar', { detune: -400, volume: 0.6 });
          this.floatText(e.x, e.y - 12, fontText(STALL_LINE), 0xf4f1e8, `stall:${e.source}`, -14, 0.9);
          break;
        case 'carFlip':
          // Over it goes, wheels in the air.
          this.sound2.play('saltar', { detune: -500, volume: 0.7 });
          for (let i = 0; i < 4; i++) this.puff(e.x + this.fx.range(-8, 8), e.y + this.fx.range(-2, 2), 0.4);
          break;
        case 'carRight':
          this.sound2.play('saltar', { detune: 200, volume: 0.5 });
          this.puff(e.x, e.y, 0.3);
          break;
        case 'windDown':
          // Run down: the spring winding down, a puff, and its line over it (the moment to hit it).
          this.sound2.play('agotado');
          this.puff(e.x, e.y - 20, 0.4);
          this.floatText(e.x, e.y - 14, fontText(WIND_DOWN_LINE), 0xf6c431, `wind:${e.source}`, -16, 1.1);
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
          if (e.kind === 'documento') {
            // A story document: a paper rustle, the archive's stamp and its kind over it.
            this.sound2.play('cupon', { detune: -700 });
            this.sound2.play('sello');
            for (let i = 0; i < 10; i++) this.spark(e.x, e.y - 8, this.fx.range(0, Math.PI * 2), this.fx.range(30, 90), 0);
            this.floatText(e.x, e.y - 22, fontText(docFoundLine(LORE.find((l) => l.id === e.item)?.kind ?? 'Documento')), 0xe2c797);
            break;
          }
          if (e.kind === 'ticket') {
            // A ticket: a paper rustle and a stamp, its line over it and the counter in the HUD jumps.
            this.sound2.play('cupon', { detune: -500 });
            this.sound2.play('sello', { volume: 0.5 });
            for (let i = 0; i < 6; i++) this.spark(e.x, e.y - 4, this.fx.range(0, Math.PI * 2), this.fx.range(30, 70), 0);
            this.floatText(e.x, e.y - 14, fontText(TICKET_LINE), 0xf4f1e8);
            this.ticketPop = 0.3;
            break;
          }
          if (e.kind === 'garantia') {
            // A provisional warranty: a rubber stamp, paper and blue sparks, and its line.
            this.sound2.play('sello', { volume: 0.7 });
            this.sound2.play('curar', { detune: 400, volume: 0.6 });
            for (let i = 0; i < 8; i++) this.paperBit(e.x, e.y - 4);
            this.floatText(e.x, e.y - 14, fontText(SHIELD_LINE), 0xa9cbf2);
            break;
          }
          if (e.kind === 'turbo') {
            // Turbo: the engine revs up, orange sparks, the heart in the HUD pumps and its line.
            this.sound2.play('turbo');
            this.sound2.play('curar', { volume: 0.6 });
            for (let i = 0; i < 12; i++) this.spark(e.x, e.y - 4, this.fx.range(0, Math.PI * 2), this.fx.range(40, 110), 1);
            this.floatText(e.x, e.y - 14, fontText(SPECIAL_HEARTS.turbo.line), 0xffb347);
            this.heartHit = Math.floor((e.total - 1) / 2);
            this.heartHitT = 0.5;
            this.shake(90, 0.004, true);
            break;
          }
          if (e.kind === 'sobretension') {
            // Surge: a crackle and cyan sparks jumping off it.
            this.sound2.play('zapear');
            this.sound2.play('encender', { volume: 0.6 });
            for (let i = 0; i < 10; i++) this.spark(e.x, e.y - 4, this.fx.range(0, Math.PI * 2), this.fx.range(50, 120), 0, 0x69dbd8);
            this.floatText(e.x, e.y - 14, fontText(SPECIAL_HEARTS.sobretension.line), 0xf6c431);
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
            const left = this.world.pickups.some((k) => k.price !== undefined);
            if (e.pay === 'vida') {
              // Financed: a heart goes for good. The heart counter jolts, red, like a hit without the hit.
              this.floatText(e.x, e.y + 4, `-${financeHearts(e.price)}`, 0xe0453b);
              this.hurtFlash.setAlpha(0.18);
              this.tweens.add({ targets: this.hurtFlash, alpha: 0, duration: 260 });
              // Said a moment later: the weapon's hint (the banner) comes up with the same purchase.
              const line = this.fx.pick(FINANCE.thanks);
              this.time.delayedCall(30, () => this.tillSay(line, left ? null : FINANCE.soldOut));
            } else {
              this.floatText(e.x, e.y + 4, `-${e.price}`, 0xf6c431);
              this.couponPop = 0.25;
              // A scratch card: the till says what it won instead (the «raffle» event, right after).
              if (e.good !== 'rasca') this.tillSay(this.fx.pick(SHOPKEEPER.thanks), left ? null : SHOPKEEPER.soldOut);
            }
          } else {
            // No: two flat notes, the screen goes red and the coupon counter shakes.
            this.sound2.play('cajaError');
            this.tillNoT = 1.1;
            if (e.outcome === 'poor') this.couponPop = -0.4;
            this.tillSay(e.outcome === 'insolvent' ? this.fx.pick(FINANCE.insolvent) : e.outcome === 'poor' ? this.fx.pick(SHOPKEEPER.poor) : SHOPKEEPER.full);
          }
          break;
        case 'raffle': {
          // Scratched (M14 (r2b)): a shower of silver shavings, then the verdict. A prize rings the
          // bell and glitters; nothing gets the till's flat «no».
          for (let i = 0; i < 6; i++) this.spark(e.x, e.y - 6, this.fx.range(-Math.PI, 0), this.fx.range(20, 50), 1);
          const won = e.prize !== 'nada';
          this.time.delayedCall(220, () => {
            this.sound2.play(won ? 'timbre' : 'vacio');
            if (won) for (let i = 0; i < 10; i++) this.spark(e.x, e.y + 10, this.fx.range(0, Math.PI * 2), this.fx.range(40, 90), 1);
          });
          if (!won) this.tillNoT = 0.6;
          const line = RAFFLE_PRIZES.find((r) => r.prize === e.prize)?.line ?? '';
          const left = this.world.pickups.some((k) => k.price !== undefined);
          this.time.delayedCall(30, () => this.tillSay(line, left ? null : RAFFLE.soldOut));
          break;
        }
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
            this.floatText(e.x, e.y - 28, fontText(e.tier === 'premium' ? CHEST_NAME_PREMIUM : CHEST_NAME), e.tier === 'premium' ? 0xf6c431 : 0xd6cdb2);
            this.shake(90, 0.004, true);
          } else this.sound2.play('desbloquear', { volume: 0.6 });
          break;
        case 'chest':
          if (e.opened) {
            // Opened: the slot swallows the ticket, the lid jumps up, gold sparks and a line over it.
            this.sound2.play('sello');
            this.sound2.play('desbloquear');
            for (let i = 0; i < 16; i++) this.spark(e.x + this.fx.range(-8, 8), e.y - 14, -Math.PI / 2 + this.fx.range(-1.2, 1.2), this.fx.range(50, 130), 1);
            // With the spare Allen key, its own line (and no ticket swallowed).
            this.floatText(e.x, e.y - 30, fontText(e.allen ? ALLEN_LINE : this.fx.pick(CHEST_OPEN_LINES)), 0xf6c431);
            this.shake(80, 0.004, true);
            if (!e.allen) this.ticketPop = 0.3;
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
        case 'phoneOff':
          if (!e.on) {
            // «Batería al 1 %»: the power-down blip, the screen goes black and a wisp of smoke.
            this.sound2.play('apagar', { detune: -200, volume: 0.8 });
            this.floatText(e.x, e.y - 20, fontText(PHONE_OFF_LINE), 0xd8574a, 'phone', -10, 1.1);
            this.puff(e.x, e.y - 10, 0.6);
          } else {
            this.sound2.play('notificacion', { detune: -500, volume: 0.7 });
            this.floatText(e.x, e.y - 20, fontText(PHONE_ON_LINE), 0x8a92a8, 'phone', -10, 1.1);
          }
          break;
        case 'battery':
          // «Carga en movimiento»: the Móvil walked a battery in; a little spark off its body.
          if (e.walked) for (let i = 0; i < 3; i++) this.spark(this.world.player.x, this.world.player.y - 16, -Math.PI / 2 + this.fx.range(-1, 1), this.fx.range(30, 60), 1, 0xf0c838);
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
          if (e.covered && e.surge !== undefined) {
            // The surge heart took it: a crackle (when it breaks, the 'surge' event does the rest).
            this.hitstop = 0.06;
            this.flashHero = 0.08;
            this.shake(140, 0.006, true);
            this.sound2.play('zapear');
            if (e.covered < e.damage) this.sound2.play('dolor');
            for (let i = 0; i < 8; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(50, 120), 0, 0x69dbd8);
            if (e.surge > 0) this.floatText(e.x, e.y - 12, fontText(SURGE_HIT_LINE), 0xf6c431);
            if (e.covered >= e.damage) break;
          } else if (e.covered) {
            // The provisional warranty took it: a stamp instead of the pain, torn paper, and its line.
            this.hitstop = 0.06;
            this.flashHero = 0.08;
            this.shake(140, 0.006, true);
            this.sound2.play('sello');
            if (e.covered < e.damage) this.sound2.play('dolor');
            for (let i = 0; i < 10; i++) this.paperBit(e.x, e.y);
            this.floatText(e.x, e.y - 12, fontText(e.shield ? SHIELD_HIT_LINE : SHIELD_GONE_LINE), 0xa9cbf2);
            if (e.covered >= e.damage) break;
          }
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
        case 'surge':
          this.surgeShock(e);
          break;
        case 'propHit': {
          // A drum takes a hit: a metal clang, sparks and a jolt.
          const v = this.drumViews.get(`${e.x},${e.y}`);
          if (v) v.jolt = 0.12;
          this.sound2.play('clinc', { detune: -900, volume: 0.7 });
          for (let i = 0; i < 3; i++) this.spark(e.x, e.y - 8, this.fx.range(-Math.PI, 0), this.fx.range(30, 70), 1);
          break;
        }
        case 'propLit':
          // Lit: a hiss before the bang.
          this.sound2.play('vapor', { detune: -800, volume: 0.6 });
          break;
        case 'blast':
          this.drumBlast(e);
          break;
        case 'tip':
          this.tableTipped(e);
          break;
        case 'tableHit': {
          // It takes the bullet for the toaster: a jolt and a splinter or two off the top.
          const v = this.tableViews.get(`${e.x},${e.y}`);
          if (v) v.jolt = 0.1;
          const f = TIP_FACING[e.side];
          for (let i = 0; i < 2; i++) this.splinter(e.x + f.x * 9, e.y - 8 + f.y * 4, Math.atan2(f.y, f.x) + this.fx.range(-0.8, 0.8));
          break;
        }
        case 'tableBroke':
          this.tableBroken(e);
          break;
        case 'turboEnd': {
          // The turbo winds down: the engine stops and a line over the toaster.
          const p = this.world.player;
          this.sound2.play('apagar');
          this.floatText(p.x, p.y - 30, fontText(TURBO_END_LINE), 0xd9932a);
          break;
        }
        case 'leaveHub':
          this.sound2.play('puerta');
          this.hubViews?.curtain.setFrame(1);
          this.leaveHubRoom();
          break;
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
          // The Centralita's cords: they whip round as the warning ends.
          if (e.color === 'cord') this.time.delayedCall(e.time * 1000, () => this.sound2.play('latigo', { detune: this.fx.range(-200, 200) }));
          break;
        case 'frostThrow':
          this.sound2.play('lanzar', { detune: this.fx.range(-200, 200) });
          break;
        case 'hop':
          this.sound2.play('saltar', { detune: this.fx.range(500, 800), volume: 0.35 });
          break;
        case 'hopLand':
          this.puff(e.x, e.y, 0.25);
          break;
        case 'surprise': {
          // The envelope tears open: a burst of gift-wrap confetti, and what came out says so.
          const ultra = e.line === 'Ultrarraro';
          this.sound2.play(ultra ? 'desbloquear' : 'desmontar', { detune: ultra ? 0 : this.fx.range(200, 500) });
          if (ultra) this.shake(200, 0.008, true);
          const tints = ultra ? [0xf6c431, 0xfff1a8, 0xf4f1e8] : [0xe0453b, 0xf6c431, 0xe070c8, 0x69dbd8, 0xf4f1e8];
          for (let i = 0; i < 16; i++) this.spark(e.x, e.y - 12, this.fx.range(0, Math.PI * 2), this.fx.range(40, 110), 2, this.fx.pick(tints));
          this.floatText(e.x, e.y - 34, fontText(e.line), ultra ? 0xf6c431 : 0xf4f1e8, `surprise:${e.x},${e.y}`, -14, ultra ? 1.6 : 1.1);
          break;
        }
        case 'brickStep':
          // Stepped on: the worst pain known to anyone with feet.
          this.sound2.play('chapa', { detune: 700, volume: 0.8 });
          this.brickBits(e.x, e.y, e.brick, 0);
          this.floatText(e.x, e.y - 30, fontText(BRICK_LINE), 0xf6c431, 'brick', -14, 0.8);
          break;
        case 'brickSwept':
          // A bullet sweeps the piece away: it skids off where the bullet was going.
          this.sound2.play('clinc', { detune: this.fx.range(-500, 0), volume: 0.7 });
          this.brickBits(e.x, e.y, e.brick, e.angle ?? 0, true);
          break;
        case 'frostLand': {
          if (e.brick !== undefined) {
            // A piece lands: a plastic clack and a little dust.
            this.sound2.play('clinc', { detune: this.fx.range(-900, -500), volume: 0.6 });
            this.puff(e.x, e.y, 0.25);
            break;
          }
          if (e.look) {
            // A dismissal letter lands and opens: a dry slap of paper and dust off the carpet.
            this.sound2.play('carta', { detune: this.fx.range(-200, 200) });
            this.shake(60, 0.003, true);
            this.puff(e.x, e.y - 2, 0.4);
            for (let i = 0; i < 5; i++) this.spark(e.x, e.y - 2, this.fx.range(-Math.PI, 0), this.fx.range(30, 70), 0, 0xf4f1e8);
            break;
          }
          if (e.product !== undefined) {
            // An expired product bursts: a wet splat and green bits flying.
            this.sound2.play('chof', { detune: this.fx.range(-300, 300) });
            this.shake(70, 0.003, true);
            for (let i = 0; i < 8; i++) this.goo(e.x + this.fx.range(-3, 3), e.y);
            this.puff(e.x, e.y - 2, 0.45);
            break;
          }
          if (e.sticker) {
            // An «APTO» label slaps onto the floor: the price gun's clack and a puff of dust.
            this.sound2.play('pegatina', { detune: this.fx.range(-300, 0) });
            this.sound2.play('etiqueta', { detune: this.fx.range(-200, 200), volume: 0.6 });
            this.shake(50, 0.002, true);
            this.puff(e.x, e.y, 0.35);
            break;
          }
          this.sound2.play('escarcha', { detune: this.fx.range(-200, 200) });
          this.shake(80, 0.004, true);
          for (let i = 0; i < 7; i++) this.iceShard(e.x + this.fx.range(-4, 4), e.y);
          for (let i = 0; i < 3; i++) this.puff(e.x + this.fx.range(-e.r * 0.6, e.r * 0.6), e.y + this.fx.range(-4, 4), 0.5);
          break;
        }
        case 'revive':
          // The backup: the toaster comes back with a flash, a jingle and its line.
          this.flashHero = 0.4;
          this.shake(220, 0.01, true);
          this.sound2.play('reponer', { detune: 600 });
          for (let i = 0; i < 14; i++) this.spark(e.x, e.y, (i / 14) * Math.PI * 2, this.fx.range(60, 120), i % 3);
          this.floatText(e.x, e.y - 24, fontText(REVIVE_LINE), 0x69dbd8, 'revive', -12, 1.6);
          break;
        case 'blade': {
          // Giro de cuchillas: a grinding stop, the blades' snarl and a spray of steel and smoothie.
          if (e.damage <= 0) {
            this.sound2.play('clinc', { detune: this.fx.range(-200, 200) });
            break;
          }
          this.hitstop = 0.06;
          this.shake(90, 0.005, true);
          this.sound2.play('cuchillas', { detune: this.fx.range(-250, 250) });
          this.sound2.play('golpeRuido', { volume: 0.6 });
          for (let i = 0; i < 8; i++) this.spark(e.x, e.y, e.angle + this.fx.range(-1.2, 1.2), this.fx.range(60, 140), i % 3 === 0 ? 0 : 1, i % 2 ? 0x93b84c : 0xe4e8f0);
          break;
        }
        case 'scald': {
          // Suela caliente: a sizzle (not every tick: it would buzz) and a few wisps off its feet.
          if (this.time.now - this.scaldHeard > 140) {
            this.scaldHeard = this.time.now;
            this.sound2.play('suela', { detune: this.fx.range(-300, 300) });
          }
          for (let i = 0; i < 3; i++) this.spark(e.x + this.fx.range(-6, 6), e.y - this.fx.range(0, 4), -Math.PI / 2 + this.fx.range(-0.6, 0.6), this.fx.range(25, 55), i % 2, i ? 0xf4f1e8 : 0xff9a2f);
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
          if (e.reboot && boss) {
            // The Router reboots: everything goes dark and its line comes up over it.
            this.sound2.play('apagar');
            this.floatText(boss.x, boss.y + 18, fontText(e.reboot), 0xb7bed0, `reboot:${boss.id}`, -1, 4.6);
          } else if (e.line && boss && (boss.def.id === 'director-rrhh' || boss.def.id === 'centralita')) {
            // The Director announces it calmly (the clap is its own event): just the line. The
            // Centralita too, after a ring: a recording does not raise its voice.
            if (boss.def.id === 'centralita') this.sound2.play('timbre');
            // Under its feet, unless that is where the phase card comes up: then over its head.
            const v = this.cameras.main.worldView;
            const low = boss.y + 16 - v.y > v.height * 0.7;
            this.floatText(boss.x, low ? boss.y + boss.def.hurt.y - 14 : boss.y + 16, fontText(e.line), 0xf4f1e8, `line:${boss.id}`, -6, 2.6);
          } else if (e.line && boss) {
            // A sale: the pricing gun clacks a new tag on its box, a shower of price-tag confetti,
            // and the advert line, shouted.
            this.sound2.play('rebaja');
            this.time.delayedCall(140, () => this.sound2.play('rebaja', { detune: -300 }));
            const top = boss.y - 74;
            for (let i = 0; i < 14; i++) this.spark(boss.x, top + 30, this.fx.range(-Math.PI, 0), this.fx.range(50, 120), 2, this.fx.pick([0xe0453b, 0xf6c431, 0xe070c8, 0xf4f1e8]));
            this.floatText(boss.x, top - 6, fontText(e.line), 0xf6c431, `line:${boss.id}`, -10, 2.2);
          } else if (e.phase >= 1 && boss) {
            this.sound2.play('portazo');
            for (let i = 0; i < 10; i++) this.puff(boss.x + this.fx.range(-14, 22) * boss.facing, boss.y - this.fx.range(8, 40), this.fx.range(0.6, 1.1));
          }
          this.showPhaseCard(e.phase, e.name, e.stage);
          if (this.bossBar) this.bossBar.flash = 0.5;
          break;
        }
        case 'lift':
          this.raiseLift(e.x, e.y, false, e.service);
          if (e.service) {
            // The fifth floor with the appointment (M12 (2)): the run is won now, whatever comes upstairs.
            this.recordRun('floor');
          }
          break;
        case 'liftReady':
          this.sound2.play('desbloquear');
          if (this.liftView) this.liftView.s.setFrame(1);
          // The Servicio Técnico's: once «Liquidación total» is gone, the run is said to be won.
          if (this.world.lift?.service) this.floatText(e.x, e.y - 58, fontText(SERVICE_WON_LINE), 0x58b45a, 'service', -8, 3.2);
          this.setBanner(this.world.lift?.service ? SERVICE_LIFT_LINE : LIFT_LINE).setTint(this.world.lift?.service ? 0x58b45a : 0x69dbd8).setAlpha(1);
          this.tweens.killTweensOf(this.banner);
          this.tweens.add({ targets: this.banner, alpha: 0, delay: 3200, duration: 600, onComplete: () => this.banner.setTint(0xf6c431) });
          break;
        case 'floorDone':
          this.winT = 0;
          this.recordRun('floor');
          if (e.final && this.world.level >= SERVICE_LEVEL) {
            // The Servicio Técnico's last floor: the true ending (the run was recorded at the Centralita).
            const p = this.world.player;
            const before = profile().endings;
            saveEnding({
              character: p.base.def.id,
              seconds: this.world.tick * DT,
              items: p.items,
              ...(p.active ? { active: p.active.id } : {}),
              weapons: p.arsenal.map((ws) => ws.base.id),
              killsBy: this.world.killsBy,
              ...deedsOf(this.world),
            });
            this.ending = { times: before, started: false };
          }
          // The last floor has no lift: the run is won where the toaster stands (M11 3).
          this.sound2.play(e.final ? 'desbloquear' : 'ascensor');
          this.shake(200, 0.006, true);
          for (let i = 0; i < 8; i++) this.puff(e.x + this.fx.range(-20, 20), e.y + this.fx.range(-8, 8), 0.6);
          break;
        case 'fireCleared': {
          // Every enemy bullet pops at once: a sparkle of its colour where it was, and one sweep.
          if (e.points.length) this.sound2.play('barrido');
          for (const pt of e.points) {
            this.puff(pt.x, pt.y, 0.3);
            for (let i = 0; i < 2; i++) this.spark(pt.x, pt.y, this.fx.range(0, Math.PI * 2), this.fx.range(20, 50), pt.color === 'red' || pt.color === 'card' || pt.color === 'nut' ? 2 : 0);
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

  /**
   * A building piece leaves the floor: swept by a bullet it skids off along `angle` and spins; stepped
   * on it just jumps (and a few chips of its colour fly).
   */
  private brickBits(x: number, y: number, brick: number, angle: number, swept = false): void {
    const s = this.add.image(x, y - 2, 'pieza', brick);
    const sp = swept ? this.fx.range(110, 160) : 20;
    const a = swept ? angle + this.fx.range(-0.3, 0.3) : this.fx.range(0, Math.PI * 2);
    const vz = this.fx.range(60, 110);
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 2, vz, life: 0.6, maxLife: 0.6, gravity: true, spin: this.fx.range(-14, 14), fade: true, fadeTime: 0.2 });
    const tint = [0xe0453b, 0x5f93d4, 0xf6c431, 0x58b45a][brick] ?? 0xf4f1e8;
    for (let i = 0; i < 3; i++) this.spark(x, y - 2, this.fx.range(0, Math.PI * 2), this.fx.range(25, 60), 2, tint);
  }

  /** A splinter of ice that jumps out and bounces on the floor. */
  private iceShard(x: number, y: number): void {
    const s = this.add.image(x, y, 'chispas', 0).setTint(this.fx.pick([0xf4f1e8, 0xb6f1f0, 0x69dbd8]));
    const a = this.fx.range(0, Math.PI * 2);
    const sp = this.fx.range(25, 70);
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, z: 2, vz: this.fx.range(50, 110), life: 0.7, maxLife: 0.7, gravity: true, spin: 0, fade: true, hw: 1, hh: 1 });
  }

  /**
   * The surge heart breaks: a white flash, a strong shake, a jagged bolt from the toaster to every
   * enemy in the room and a burst of cyan sparks on each one.
   */
  private surgeShock(e: Extract<SimEvent, { type: 'surge' }>): void {
    this.hitstop = 0.12;
    this.shake(260, 0.014, true);
    this.sound2.play('estallido');
    this.sound2.play('zapear', { detune: -600 });
    this.hurtFlash.setFillStyle(0xb6f1f0).setAlpha(0.35);
    this.time.delayedCall(140, () => this.hurtFlash.setFillStyle(0xe0453b));
    this.floatText(e.x, e.y - 14, fontText(SURGE_LINE), 0xb6f1f0);
    const g = this.add.graphics().setDepth(90000);
    for (const t of e.targets) {
      // A zigzag in eight steps, each knocked sideways a little.
      const steps = 8;
      const dx = t.x - e.x;
      const dy = t.y - e.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= steps; i++) {
        const off = i === 0 || i === steps ? 0 : this.fx.range(-7, 7);
        pts.push(new Phaser.Math.Vector2(e.x + (dx * i) / steps + nx * off, e.y + (dy * i) / steps + ny * off));
      }
      g.lineStyle(3, 0x69dbd8, 0.6).strokePoints(pts);
      g.lineStyle(1, 0xffffff, 1).strokePoints(pts);
      for (let i = 0; i < 6; i++) this.spark(t.x, t.y, this.fx.range(0, Math.PI * 2), this.fx.range(40, 110), 0, 0x69dbd8);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 260, ease: 'Quad.easeIn', onComplete: () => g.destroy() });
  }

  /**
   * Drums (M9b 13a): a hit jolts them; a battered one smokes now and then; a lit one blinks white
   * and trembles until it goes up.
   */
  private drawDrums(dt: number): void {
    for (const pr of this.world.room.props) {
      if (!pr.def.hp) continue;
      const v = this.drumViews.get(`${pr.x},${pr.y}`);
      if (!v) continue;
      v.jolt = Math.max(0, v.jolt - dt);
      const lit = pr.fuse !== undefined;
      const wob = lit ? this.fx.range(-1, 1) : v.jolt > 0 ? (Math.floor(v.jolt * 40) % 2 ? 1 : -1) : 0;
      v.s.setX(v.x + Math.round(wob));
      if (lit && Math.floor(this.time.now / 50) % 2 === 0) this.whiteOut(v.s);
      else v.s.clearTint();
      if ((pr.damage ?? 0) >= pr.def.hp / 2) {
        v.smoke -= dt;
        if (v.smoke <= 0) {
          v.smoke = lit ? 0.04 : this.fx.range(0.35, 0.8);
          this.puff(pr.x + this.fx.range(-3, 3), pr.y - 15, 0.6);
        }
      }
    }
  }

  /** Tables (M9b 13b): the frame of how each lies, the hop as it goes over and the jolt of a hit. */
  private drawTables(dt: number): void {
    for (const v of this.tableViews.values()) {
      v.jolt = Math.max(0, v.jolt - dt);
      v.tip = Math.max(0, v.tip - dt);
      const wob = v.jolt > 0 ? (Math.floor(v.jolt * 40) % 2 ? 1 : -1) : 0;
      // Going over: for a moment it is half way (squashed and leaning), then it lands with a bump.
      const k = v.tip / TIP_ANIM;
      const f = v.side ? TIP_FACING[v.side] : { x: 0, y: 0 };
      const lean = k > 0.5 ? (k - 0.5) * 2 : 0;
      v.s.setPosition(v.x + Math.round(wob + f.x * 3 * lean), v.y + Math.round(f.y * 2 * lean) - (k > 0 && k <= 0.5 ? 1 : 0));
      v.s.setScale(1, k > 0.5 ? 1 - 0.25 * lean : 1);
      v.s.setAngle(k > 0.5 ? f.x * 25 * lean : 0);
    }
  }

  /** A table goes over: the frame of its new side, a hop, a thud, dust where it lands. */
  private tableTipped(e: Extract<SimEvent, { type: 'tip' }>): void {
    const v = this.tableViews.get(`${e.x},${e.y}`);
    if (v) {
      v.side = e.side;
      v.tip = TIP_ANIM;
      v.s.setFrame(TABLE_FRAME[e.side]);
    }
    this.sound2.play('portazo', { detune: -500, volume: 0.8 });
    this.shake(90, 0.004);
    const f = TIP_FACING[e.side];
    for (let i = 0; i < 6; i++) this.puff(e.x + f.x * 8 + this.fx.range(-10, 10), e.y - 3 + f.y * 6 + this.fx.range(-3, 3), 0.45);
    // What was on it goes flying.
    for (let i = 0; i < 3; i++) this.splinter(e.x + this.fx.range(-6, 6), e.y - 12, Math.atan2(f.y, f.x) + this.fx.range(-0.6, 0.6), 0x5f93d4);
  }

  /** A table shot to bits (or blown up): gone, a shower of splinters, dust and a crash. */
  private tableBroken(e: Extract<SimEvent, { type: 'tableBroke' }>): void {
    const v = this.tableViews.get(`${e.x},${e.y}`);
    if (v) {
      v.s.destroy();
      v.shadow.destroy();
      this.tableViews.delete(`${e.x},${e.y}`);
    }
    this.sound2.play('derrumbe', { volume: 0.6, detune: 300 });
    this.shake(120, 0.005);
    for (let i = 0; i < 12; i++) this.splinter(e.x + this.fx.range(-9, 9), e.y - this.fx.range(4, 14), this.fx.range(0, Math.PI * 2));
    for (let i = 0; i < 5; i++) this.puff(e.x + this.fx.range(-10, 10), e.y - this.fx.range(2, 10), this.fx.range(0.4, 0.8));
    // A few planks stay on the floor.
    const lv = this.world.level;
    const wood = lv >= 6 ? 0x86683e : lv >= 5 ? 0xa08458 : lv >= 4 ? 0x84838c : lv >= 3 ? 0xb08a2a : lv > 1 ? 0xa99b74 : 0x7d5a36;
    for (let i = 0; i < 3; i++) {
      this.add.rectangle(e.x + this.fx.range(-10, 10), e.y - this.fx.range(1, 9), this.fx.int(4, 7), 2, wood, 1).setAngle(this.fx.pick([0, 0, 90, 30, -30])).setDepth(-48990);
    }
  }

  /**
   * A boss breaks out of its shell (the Muñeco's box, BossPhase.shed): cardboard tearing, a jolt,
   * scraps of magenta cardboard and plastic window, and dust where it lands.
   */
  private shellShed(e: Extract<SimEvent, { type: 'shed' }>): void {
    this.sound2.play('carton');
    this.sound2.play('derrumbe', { volume: 0.45, detune: 700 });
    this.shake(200, 0.009, true);
    for (let i = 0; i < 16; i++) {
      const tint = this.fx.pick([0xd0559c, 0xa83c7e, 0xe9d3e4, 0x9fd8e8, 0xf6c431]);
      this.splinter(e.x + this.fx.range(-22, 22), e.y - this.fx.range(10, 50), this.fx.range(0, Math.PI * 2), tint);
    }
    for (let i = 0; i < 7; i++) this.puff(e.x + this.fx.range(-24, 24), e.y - this.fx.range(0, 8), this.fx.range(0.5, 0.9));
  }

  /** A splinter of the table (or something that was on it) that jumps and falls. */
  private splinter(x: number, y: number, a: number, tint?: number): void {
    const sp = this.fx.range(30, 80);
    const lv = this.world.level;
    const wood = lv >= 6 ? 0xa8865a : lv >= 5 ? 0xc8a874 : lv >= 4 ? 0xa8a7b0 : lv >= 3 ? 0xe0b23c : lv > 1 ? 0xd4c79f : 0xa77c4c;
    const s = this.add.image(x, y, 'chispas', this.fx.int(1, 2)).setTint(tint ?? wood);
    const vz = this.fx.range(40, 90);
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.5, z: 4, vz, life: 0.6, maxLife: 0.6, gravity: true, spin: this.fx.range(-10, 10), fade: true, fadeTime: 0.2 });
  }

  /** Tyre marks: two dark dashes on the floor, fading out (at most SKID_MAX at once). */
  private skidMark(x: number, y: number, angle: number): void {
    if (this.skids >= SKID_MAX) return;
    this.skids++;
    const nx = -Math.sin(angle) * 3;
    const ny = Math.cos(angle) * 2;
    for (const k of [-1, 1]) {
      const m = this.add.rectangle(Math.round(x + nx * k), Math.round(y + ny * k), 4, 2, 0x100d18, 0.7).setRotation(angle).setDepth(-49500);
      this.tweens.add({ targets: m, alpha: 0, delay: 1800, duration: 2400, onComplete: () => m.destroy() });
    }
    this.time.delayedCall(4200, () => this.skids--);
  }

  /** A drum blows up: gone, a fireball, debris, a scorch mark, a big shake and a bang. */
  private drumBlast(e: Extract<SimEvent, { type: 'blast' }>): void {
    const v = this.drumViews.get(`${e.x},${e.floorY}`);
    if (v) {
      v.s.destroy();
      v.shadow.destroy();
      this.drumViews.delete(`${e.x},${e.floorY}`);
    }
    this.hitstop = Math.max(this.hitstop, 0.08);
    this.shake(260, 0.013, true);
    this.sound2.play('estallido');
    this.sound2.play('derrumbe', { volume: 0.5 });
    // The scorch mark stays on the floor.
    this.add.ellipse(e.x, e.floorY - 3, 26, 12, 0x15121c, 0.55).setDepth(-49000);
    this.add.ellipse(e.x, e.floorY - 3, 14, 6, 0x0e0c16, 0.6).setDepth(-48999);
    // The fireball: a ring that grows and fades, flames and smoke.
    const core = this.add.circle(e.x, e.y, 8, 0xfff1a8, 1).setDepth(e.floorY + 31);
    const fire = this.add.circle(e.x, e.y, 10, 0xff8a3a, 0.95).setDepth(e.floorY + 30);
    const ring = this.add.circle(e.x, e.y, 8).setDepth(e.floorY + 32).setStrokeStyle(2, 0xfff1a8, 1);
    this.tweens.add({ targets: core, radius: e.radius * 0.45, alpha: 0, duration: 160, ease: 'Quad.easeOut', onComplete: () => core.destroy() });
    this.tweens.add({ targets: fire, radius: e.radius * 0.8, alpha: 0, duration: 320, ease: 'Cubic.easeOut', onComplete: () => fire.destroy() });
    this.tweens.add({ targets: ring, radius: e.radius, alpha: 0, duration: 260, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    for (let i = 0; i < 18; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(60, 170), this.fx.int(1, 2));
    for (let i = 0; i < 10; i++) this.puff(e.x + this.fx.range(-14, 14), e.y + this.fx.range(-10, 8), this.fx.range(0.6, 1.1));
    for (let i = 0; i < 6; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(40, 90), 3);
  }

  /**
   * Etiquetadora: the labels stuck on enemies and dummies, a small sprite each on the body (the
   * first one high, the next ones lower, crooked each its own way). They flicker just before
   * they peel off.
   */
  private drawLabels(w: World): void {
    const seen = new Set<number>();
    const spots = [
      [0.32, 0.3],
      [0.66, 0.48],
      [0.42, 0.68],
    ] as const;
    const targets: (Enemy | Dummy)[] = [...w.enemies, ...w.dummies];
    for (const t of targets) {
      const n = t.tags ?? 0;
      const enemy = 'state' in t ? t : null;
      if (n <= 0 || enemy?.state === 'gone') continue;
      seen.add(t.id);
      const list = this.labelViews.get(t.id) ?? [];
      while (list.length < n) list.push(this.add.image(0, 0, 'etiqueta-pegada', (t.id + list.length) % 3));
      while (list.length > n) list.pop()!.destroy();
      this.labelViews.set(t.id, list);
      const hb = dummyHurtBox(t);
      const lift = enemy ? enemyAltitude(enemy) : 0;
      const peeling = (t.tagT ?? 0) < 0.6 && Math.floor(this.time.now / 90) % 2 === 0;
      list.forEach((s, i) => {
        const [fx, fy] = spots[i % spots.length]!;
        s.setPosition(Math.round(hb.x + hb.w * fx), Math.round(hb.y + hb.h * fy - lift)).setDepth(t.y + 0.4).setAlpha(peeling ? 0.45 : 1);
      });
    }
    for (const [id, list] of this.labelViews) {
      if (seen.has(id)) continue;
      for (const s of list) s.destroy();
      this.labelViews.delete(id);
    }
  }

  /**
   * Etiquetadora, «Rebajado»: the labels go off with the till's bell, a ring of yellow and red
   * the size of the blast, torn bits of label and the line over the enemy.
   */
  private markdownFx(e: Extract<SimEvent, { type: 'markdown' }>): void {
    this.hitstop = Math.max(this.hitstop, 0.04);
    this.shake(120, 0.005);
    this.sound2.play('rebajado');
    this.sound2.play('pegatina', { volume: 0.6 });
    const core = this.add.circle(e.x, e.y, 5, 0xfff1a8, 1).setDepth(e.y + 40);
    const ring = this.add.circle(e.x, e.y, 6).setDepth(e.y + 41).setStrokeStyle(2, 0xf6c431, 1);
    const ring2 = this.add.circle(e.x, e.y, 4).setDepth(e.y + 41).setStrokeStyle(1, 0xe0453b, 1);
    this.tweens.add({ targets: core, radius: e.radius * 0.45, alpha: 0, duration: 140, ease: 'Quad.easeOut', onComplete: () => core.destroy() });
    this.tweens.add({ targets: ring, radius: e.radius, alpha: 0, duration: 240, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
    this.tweens.add({ targets: ring2, radius: e.radius * 0.8, alpha: 0, duration: 300, ease: 'Cubic.easeOut', onComplete: () => ring2.destroy() });
    for (let i = 0; i < 10; i++) this.spark(e.x, e.y, this.fx.range(0, Math.PI * 2), this.fx.range(50, 120), this.fx.int(0, 1), i % 2 ? 0xf6c431 : 0xe0453b);
    for (let i = 0; i < 4; i++) this.paperBit(e.x, e.y);
    this.floatText(e.x, e.y - 22, fontText(this.fx.pick(MARKDOWN_LINES)), 0xf6c431, `markdown:${e.target}`, -14, 0.9);
  }

  /** A scrap of paper (a warranty slip) thrown out from (x, y). */
  private paperBit(x: number, y: number): void {
    const a = this.fx.range(0, Math.PI * 2);
    const sp = this.fx.range(30, 90);
    const s = this.add.image(x, y, 'chispas', 0).setTint(this.fx.pick([0xf4efdc, 0xd6cdb2, 0x5f93d4]));
    this.particles.push({ s, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, z: 0, vz: 0, life: 0.35, maxLife: 0.35, gravity: false, spin: 0, fade: true });
  }

  private spark(x: number, y: number, a: number, speed: number, frame: number, tint?: number): void {
    const s = this.add.image(x, y, 'chispas', frame);
    if (tint !== undefined) s.setTint(tint);
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
      // A room left behind with things in it shows them (the boss and the shop keep their icon).
      if (c.state === 'visited' && c.loot.length > 0 && c.kind !== 'boss' && c.kind !== 'shop' && c.kind !== 'rare') {
        const marks = c.loot.slice(0, 3);
        const w = marks.length * 4 - 1;
        let ix = p.x + Math.floor((MAP_CELL_W - w) / 2);
        const iy = p.y + Math.floor((MAP_CELL_H - 1 - 3) / 2);
        for (const m of marks) {
          const mi = MAP_LOOT_ICONS[m];
          g.fillStyle(mi.color, 1);
          mi.rows.forEach((row, j) => [...row].forEach((ch, i) => {
            if (ch === '#') g.fillRect(ix + i, iy + j, 1, 1);
          }));
          ix += 4;
        }
        continue;
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
    // Floors 2 to 6 (the Servicio Técnico) each have their own; anything without one uses the warehouse's.
    const level = this.world.level;
    const own = `${key}-${level}`;
    return level > 1 && this.textures.exists(own) ? own : key;
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

  private puff(x: number, y: number, life: number, tint?: number): void {
    const s = this.add.image(x, y, 'polvo', 0);
    if (tint !== undefined) s.setTint(tint).setDepth(y + 19);
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
  private tillSay(text: string, then: string | readonly string[] | null = null): void {
    if (!this.till) return;
    this.bubble?.g.destroy();
    this.bubble?.t.destroy();
    const room = this.world.room;
    const scale = readScale(settings());
    const t = this.add.bitmapText(0, 0, FONT, wrapLines(fontText(text), 150 * scale, scale).join('\n'), 8 * scale).setOrigin(0.5, 1).setCenterAlign().setTint(0xf4f1e8).setDepth(86001);
    const w = Math.ceil(t.width) + 10;
    const h = Math.ceil(t.height) + 7;
    const till = this.talkAt ?? this.till;
    // Over the till, with the tail pointing down at its screen; if that would go off the top of
    // the view or under the room's name (big text, a till against the back wall), beside it, with
    // the tail pointing at it.
    // While the room's name is up, its plate counts as the top.
    let nameUp = this.roomTitle && this.roomTitle.alpha > 0 ? this.roomTitle.getBounds().bottom + 2 : 2;
    // And the banner's (a hint like «E o rueda: cambiar de arma» when a weapon is financed, M14 (r2)).
    if (this.banner.alpha > 0 && this.banner.text) nameUp = Math.max(nameUp, this.banner.y + this.banner.height + 4);
    const viewTop = this.cameras.main.scrollY + nameUp;
    const top = this.talkAt?.top ?? this.tillTop;
    const above = till.y - top - h >= viewTop;
    const left = till.x > room.w / 2;
    const bx = above
      ? Math.round(Math.min(room.w - 4 - w, Math.max(4, till.x - w / 2)))
      : Math.round(left ? Math.max(4, till.x - 16 - w) : Math.min(room.w - 4 - w, till.x + 16));
    const by = above ? Math.round(till.y - top - h) : Math.round(Math.max(viewTop, till.y - 30 - h / 2));
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
    this.tillNext = then === null ? [] : typeof then === 'string' ? [then] : [...then];
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
        const [next, ...rest] = this.tillNext;
        if (next) this.time.delayedCall(250, () => this.tillSay(next, rest));
      }
    }
    const talking = !!this.bubble && !this.talkAt && this.bubbleT > 0.3 && Math.floor(this.time.now / 140) % 2 === 0;
    this.till.setFrame(this.tillNoT > 0 ? 2 : talking ? 1 : 0);
  }

  /** A line that pops up from (x, y) and fades; if another is still there, it goes up over it. */
  private floatText(x: number, y: number, text: string, tint: number, key?: string, vy = -30, life = 0.6): FloatText {
    // Double size with big text, like everything that is read.
    const scale = readScale(settings());
    const w = textWidth(text) * scale;
    const h = 8 * scale;
    // Never half out of the room (a boss shouting from against a side wall, M12 (4c)).
    const room = this.world.room;
    if (w + 8 < room.w) x = Math.max(4 + w / 2, Math.min(room.w - 4 - w / 2, x));
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

  /** «F: Abrir» under the toaster, when the interact button would do something. */
  private prompt: Phaser.GameObjects.BitmapText | null = null;
  private promptBack: Phaser.GameObjects.Rectangle | null = null;

  private drawPrompt(): void {
    const w = this.world;
    const it = interactable(w);
    // Not while something is being said or shown there (the bubble, a panel).
    const busy = it?.kind === 'station' && (this.bubble || this.panel.length > 0);
    // (The price goes in the line: it stands over the shelf's own price tag.)
    const buy = it?.kind !== 'shop' ? null
      : it.pickup.pay === 'vida' ? `${FINANCE.verb} por ${financeHearts(it.pickup.price ?? 0)}`
      : `${it.pickup.kind === 'rasca' ? RAFFLE.verb : INTERACT_VERBS.shop} por ${shopPrice(this.world.player, it.pickup.price ?? 0)}`;
    const verb = !it || busy ? null : it.kind === 'station' ? INTERACT_VERBS[it.station.kind] : (buy ?? INTERACT_VERBS[it.kind]);
    if (!verb) {
      this.prompt?.setVisible(false);
      this.promptBack?.setVisible(false);
      return;
    }
    const text = fontText(interactPrompt(keyWords(), verb));
    const h = 8 * readScale(settings());
    if (!this.prompt) {
      // A dark plate behind, so it reads on any floor.
      this.promptBack = this.add.rectangle(0, 0, 1, 1, 0x0e0c16, 0.75).setOrigin(0.5, 0).setDepth(84999);
      this.prompt = this.add.bitmapText(0, 0, FONT, text, h).setOrigin(0.5, 0).setDepth(85000).setTint(0xf4f1e8);
    }
    if (this.prompt.text !== text) this.prompt.setText(text);
    this.prompt.setFontSize(h);
    const x = Math.round(w.player.x);
    const y = Math.round(w.player.y + 6);
    this.prompt.setPosition(x, y).setVisible(true);
    this.promptBack?.setPosition(x, y - 2).setSize(this.prompt.width + 6, h + 3).setVisible(true);
  }

  private syncView(dt: number): void {
    const w = this.world;
    this.drawPrompt();
    this.drawBossBar(dt);
    this.drawLift(dt);
    this.drawShop(dt);
    this.drawHub(dt);
    const p = w.player;
    const rolling = isRolling(p);
    // Hero body: the character's own sheet (it changes in the Mostrador when another goes on display).
    const look = p.base.def.look;
    if (this.hero.texture.key !== look.sheet) this.hero.setTexture(look.sheet, 0);
    const handKey = look.hand ?? 'mano';
    if (this.hand.texture.key !== handKey) this.hand.setTexture(handKey);
    const moving = Math.hypot(p.vx, p.vy) > 12;
    let frame: number;
    if (rolling) frame = 3;
    else if (moving) frame = 2 + (Math.floor(p.walked / 7) % 4);
    else frame = Math.floor(this.time.now / 500) % 2;
    this.hero.setFrame(frame);
    // The Móvil switched off by standing still: the black screen with the logo instead.
    if (look.off && phoneIsOff(p) && !w.over) this.hero.setTexture(look.off);
    this.hero.setScale(p.facing, 1);
    if (rolling) {
      const k = p.rollT / p.def.rollTime;
      this.hero.setOrigin(look.feetX / look.w, look.spinY / look.h);
      this.hero.setPosition(Math.round(p.x), Math.round(p.y - (look.feetY - look.spinY)));
      this.hero.setRotation(Math.min(1, k / 0.85) * Math.PI * 2 * (p.rollDirX >= 0 ? 1 : -1));
    } else {
      this.hero.setOrigin(look.feetX / look.w, look.feetY / look.h);
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
        // (Sparks from the appliances; the Becario only shakes.)
        if (characterDown(p.base.def.id).sparks && this.fx.chance(dt * 30)) this.spark(p.x + this.fx.range(-8, 8), p.y - this.fx.range(6, 26), this.fx.range(0, Math.PI * 2), this.fx.range(30, 80), 0);
      } else {
        // ...then the slices pop out and the empty body tips over with a little bounce.
        if (!this.popped) this.popToaster();
        const t = this.downT - DOWN_POP;
        const k = Math.min(1, t / 0.28);
        const bounce = t > 0.28 && t < 0.5 ? Math.sin(((t - 0.28) / 0.22) * Math.PI) * 0.12 : 0;
        this.hero.setFrame(HERO_BROKEN);
        this.hero.setRotation((k * k - bounce) * (Math.PI / 2) * p.facing);
        // Smoke (the toaster's slots, the Plancha's steam) and sparks from the frayed cord: each its own.
        const down = characterDown(p.base.def.id);
        const sm = down.smoke;
        if (sm && this.fx.chance(dt * 7)) this.puff(p.x + p.facing * (sm.x + this.fx.range(-4, 4)), p.y + sm.y + this.fx.range(-3, 3), 0.9, sm.steam ? 0xf4f1e8 : undefined);
        const sp = down.sparks;
        if (sp && this.fx.chance(dt * 2.5)) for (let i = 0; i < 3; i++) this.spark(p.x + p.facing * sp.x, p.y + sp.y, this.fx.range(0, Math.PI * 2), this.fx.range(20, 60), 0);
      }
      if (this.downT > DOWN_REPORT && this.downPanel.length === 0) this.showDownPanel();
      if (this.canAskNewUnit()) {
        const pressed = this.controls.read({ bodyX: p.x, bodyY: p.y }).reload;
        if (!pressed) this.downArmed = true;
        else if (this.downArmed) this.goOn();
      }
    }
    this.hero.setCrop();
    if (w.won && this.winT >= 0) {
      // Going down with the lift: it sinks into the shaft, hidden by the front edge of the hole.
      this.winT += dt;
      this.hero.setFrame(0).setRotation(0).setScale(p.facing, 1);
      if (w.finale) {
        // The last floor has no lift (M11 3): the toaster stays where it is and jumps twice.
        const hop = this.winT < 1.2 ? Math.abs(Math.sin((this.winT / 0.6) * Math.PI)) : 0;
        this.hero.setY(Math.round(p.y - hop * 6));
        this.hero.setVisible(true);
      } else if (w.lift?.service) {
        // Up to the Servicio Técnico (M12 (2)): it floats up in the beam and fades away.
        const k = Math.min(1, this.winT / WIN_SINK);
        this.hero.setY(Math.round(p.y - k * k * 60));
        this.hero.setAlpha(1 - k);
        this.hero.setVisible(k < 1);
      } else {
        const k = Math.min(1, this.winT / WIN_SINK);
        const d = Math.round(k * k * 34);
        const edge = (w.lift ? w.lift.y : p.y) + 13;
        this.hero.setY(Math.round(p.y) + d);
        const rows = Math.max(0, Math.round(edge - (p.y + d - look.feetY)));
        this.hero.setCrop(0, 0, look.w, Math.min(look.h, rows));
        this.hero.setVisible(rows > 0);
      }
      if (this.ending) {
        if (this.winT > WIN_REPORT && !this.ending.started) this.startEnding();
      } else if (this.winT > WIN_REPORT && this.downPanel.length === 0) this.showWinPanel();
      if (this.canAskNewUnit()) {
        const pressed = this.controls.read({ bodyX: p.x, bodyY: p.y }).reload;
        if (!pressed) this.downArmed = true;
        else if (this.downArmed) this.goOn();
      }
    }
    // Rolling over a low counter: on top of it, not behind.
    const heroDepth = isRolling(p) && onLowProp(w, p) ? p.y + LOW_PROP_LIFT : p.y;
    this.hero.setDepth(heroDepth);
    // The blender's blades whirl round her body while she rolls (they turn the way she rolls).
    const blades = rolling && p.def.ability?.kind === 'blades' && !w.over;
    this.whirl.setVisible(blades);
    if (blades) {
      const f = Math.floor(p.rollT / 0.035) % 4;
      this.whirl.setFrame(p.rollDirX >= 0 ? f : 3 - f);
      this.whirl.setScale(p.rollDirX >= 0 ? 1 : -1, 1);
      this.whirl.setPosition(Math.round(p.x), Math.round(p.y - PLAYER_HURT_Y));
      this.whirl.setDepth(heroDepth + 0.5);
      this.whirl.setAlpha(p.rollT > p.def.rollTime * 0.8 ? 0.5 : 1);
    }
    // «Batería al 1 %»: the last second standing still, an empty battery blinks over its head.
    const ph = p.def.ability?.kind === 'phone' ? p.def.ability : null;
    const warn = !!ph && !w.over && !phoneIsOff(p) && (p.stillT ?? 0) > ph.idleTime - 1;
    this.lowBattery.setVisible(warn && Math.floor(this.time.now / 140) % 2 === 0);
    if (warn) this.lowBattery.setPosition(Math.round(p.x), Math.round(p.y - p.base.def.look.feetY - 2)).setDepth(heroDepth + 0.6);
    if (!(w.won && this.winT >= 0 && w.lift?.service)) this.hero.setAlpha(1);
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
    // In the Mostrador the gun stays holstered: nobody shoots there.
    const armed = !rolling && !w.over && !w.won && w.room.kind !== 'hub';
    this.gun.setVisible(armed);
    this.hand.setVisible(armed);
    this.gun.setPosition(Math.round(gx), Math.round(gy)).setRotation(p.aim).setScale(1, p.facing);
    this.gun.setDepth(heroDepth + (behind ? -0.5 : 0.5));
    this.hand.setPosition(Math.round(gx), Math.round(gy + 1)).setDepth(heroDepth + (behind ? -0.4 : 0.6));
    this.muzzleT -= dt;
    const mzx = gx + Math.cos(p.aim) * 14;
    const mzy = gy + Math.sin(p.aim) * 14;
    this.muzzle.setVisible(this.muzzleT > 0 && !rolling).setPosition(Math.round(mzx), Math.round(mzy)).setRotation(p.aim).setDepth(p.y + 1);

    this.drawLabels(w);
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
      // A boss spinning on the spot shows its other side half the time (EnemyAnim.spin), and the
      // stickers peel off with a rip as it starts.
      const spinning = isSpinning(en);
      if (spinning && !v.spinning) this.sound2.play('pegatina');
      v.spinning = spinning;
      const face = spinMirrored(en) ? -en.facing : en.facing;
      s.setScale(face, 1);
      // Breathing, steps, the bulb flickering on, the beaters, the Nevera's open door: enemyFrame.
      const frame = enemyFrame(en, this.time.now);
      s.setFrame(frame);
      let rot = 0;
      if (en.def.brain.kind === 'moth') rot = en.state === 'charge' ? 0.3 * en.facing : 0;
      // A boss on its catwalk keeps its pose (a slight lean, chin up); the rest lean into the charge.
      else if (en.state === 'charge') rot = (en.def.boss ? 0.05 : 0.18) * en.facing;
      else if (en.state === 'brake') rot = -0.12 * en.facing * (1 - en.t / en.until);
      // (A boss gone quiet, BossPhase.mute, stands stock-still instead.)
      else if (en.state === 'stun' && !en.def.boss) rot = Math.sin(en.t * 22) * 0.2 * (1 - en.t / en.until);
      s.setRotation(rot);
      // The remote switches off like an old TV (squashed to a line, then to a dot) and back on.
      const tv = tvScale(en, v.onAt === undefined ? 1 : (this.time.now - v.onAt) / 1000);
      s.setScale(face * tv.x, tv.y);
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
      } else if (this.scanned.has(en.id)) s.setTint(0xd8ffb0);
      // Llamada Grabada: a marked enemy blinks red, like the light of a recording.
      else if ((en.markT ?? 0) > 0 && Math.floor(this.time.now / 220) % 2 === 0) s.setTint(0xff8a80);
      // Starched (the Plancha's Pulverizador): pale and stiff while it lasts.
      else if (en.slowLook === 'starch' && (en.slowT ?? 0) > 0) s.setTint(0xe6ead6);
      else s.clearTint();
      // A copy whose photocopier broke fades out, flickering like a bad print.
      if (en.fadeT !== undefined) s.setAlpha(Math.max(0.1, en.fadeT) * (Math.floor(this.time.now / 60) % 2 === 0 ? 1 : 0.6));
      if (en.state === 'roar' && en.def.anim?.reboot) {
        // Rebooting: still and dark, a spark from the lights now and then as they come on.
        if (this.fx.chance(0.06)) this.spark(en.x + this.fx.range(-14, 10) * en.facing, en.y - 30, this.fx.range(-Math.PI, 0), this.fx.range(20, 40), 0);
      } else if (en.state === 'roar') {
        // Between phases: it shudders and breathes out cold.
        s.setX(s.x + (Math.floor(this.time.now / 50) % 2 === 0 ? 1 : -1));
        if (this.fx.chance(0.2)) this.puff(en.x + this.fx.range(-24, 24), en.y - this.fx.range(10, 60), 0.7);
      }
      if (en.state === 'dying') this.dyingFx(en, v, dt);
      // Glitter on it (Bote de Purpurina): it sheds pink and gold specks as it goes. Starch (the
      // Plancha's Pulverizador): it goes stiff and pale, and white flakes fall off it.
      if ((en.slowT ?? 0) > 0) {
        const hb = en.def.hurt;
        const starch = en.slowLook === 'starch';
        if (this.fx.chance(starch ? 0.5 : 0.25)) {
          const tint = starch ? this.fx.pick([0xf4f1e8, 0xfff1a8, 0xdfe6ee]) : this.fx.pick([0xea93a8, 0xf6c431, 0xf4f1e8]);
          const a = starch ? Math.PI / 2 + this.fx.range(-0.4, 0.4) : this.fx.range(0, Math.PI * 2);
          this.spark(en.x + this.fx.range(hb.x, hb.x + hb.w), en.y + this.fx.range(hb.y, hb.y + hb.h), a, this.fx.range(5, 20), 0, tint);
        }
      }
      if (v.badge) this.drawBadge(en, v, frame);
      // In TURBO the mixer shakes and throws sparks and batter.
      if (en.turbo) {
        s.setX(s.x + (Math.floor(this.time.now / 45) % 2 === 0 ? 1 : 0));
        if (this.fx.chance(0.12)) this.spark(en.x + en.facing * 7, en.y - 6, this.fx.range(0, Math.PI * 2), this.fx.range(30, 80), this.fx.int(0, 2));
      }
      // A remote-control car drifting leaves tyre marks (they fade in a few seconds).
      if (en.def.brain.kind === 'rccar' && (en.state === 'walk' || en.state === 'brake' || en.state === 'warn') && Math.hypot(en.vx, en.vy) > 50 && this.fx.chance(0.45)) {
        this.skidMark(en.x - en.dirX * 8, en.y - 1, Math.atan2(en.vy, en.vx));
      }
      // Dust trail while charging, sparks from the wheels while braking.
      if (en.state === 'charge' && this.fx.chance(en.def.brain.kind === 'windup' ? 0.12 : 0.5)) this.puff(en.x - en.dirX * 10 + this.fx.range(-3, 3), en.y + this.fx.range(-2, 1), 0.35);
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
    this.drawWind();
    this.drawFrost(dt);
    this.drawFallingCrates();
    this.drawInk();
    this.drawSteam();
    this.drawConveyors();
    this.drawTurns();
    this.drawMenus(dt);
    this.drawTapes(dt);
    this.drawFaqs();
    this.drawTransfers();
    this.drawChests(dt);
    this.drawLateProps();
    this.drawPartitions();
    this.drawDrums(dt);
    this.drawTables(dt);
    this.drawPickups();

    // Bullets.
    const alive = new Set<number>();
    for (const b of w.bullets) {
      alive.add(b.id);
      let s = this.bulletSprites.get(b.id);
      if (!s) {
        const look = b.owner === 'player' ? WEAPONS[b.weapon ?? '']?.look : undefined;
        const tex = b.toast ? 'despiece' : b.owner === 'player' ? look?.bullet ?? 'bala-jugador' : BULLET_TEXTURES[b.color];
        s = this.bulletPool.pop()?.setTexture(tex).setVisible(true).setAlpha(1).setRotation(0) ?? this.add.image(b.x, b.y, tex);
        // The Tostadora's slices of toast: golden or burnt (frames of the bits she breaks into).
        if (b.toast) s.setFrame(b.toast === 'burnt' ? 1 : 0);
        // In turbo, the toaster's shots come out orange-hot.
        if (b.owner === 'player' && w.player.turbo) s.setTint(0xffb36b);
        else s.clearTint();
        // Contestador Automático: the played-back shot is a fainter copy.
        if (b.echo) s.setAlpha(0.55);
        // Hoja de Reclamaciones: the chasing shots are the pink copy that nobody reads.
        if (b.chase !== undefined) s.setTint(0xea93a8);
        if (look?.turn) s.setRotation(b.dir);
        this.bulletSprites.set(b.id, s);
      }
      // Bigger (or smaller) player bullets from items: the sprite is drawn for the weapon's own radius.
      const wdef = b.owner === 'player' ? WEAPONS[b.weapon ?? ''] : undefined;
      let size = b.owner === 'player' ? b.r / (wdef?.bulletRadius ?? PLAYER_BULLET_R) : 1;
      s.setPosition(Math.round(b.x), Math.round(b.y)).setDepth(b.y + 20);
      if (b.toast) {
        // A slice tumbles as it flies; the burnt one leaves a trail of smoke.
        s.setRotation(b.age * 14 * (b.vx >= 0 ? 1 : -1));
        if (b.toast === 'burnt') {
          // Dark smoke, and embers so it reads on a dark floor.
          if (this.fx.chance(dt * 40)) this.puff(b.x - b.vx * 0.02, b.y - b.vy * 0.02, 0.55, 0x8a8f9c);
          if (this.fx.chance(dt * 25)) this.spark(b.x, b.y, this.fx.range(0, Math.PI * 2), this.fx.range(10, 30), 0, 0xff8a3a);
        }
      }
      if (wdef?.look.turn) s.setRotation(Math.atan2(b.vy, b.vx));
      const swell = wdef?.look.swell;
      if (swell) {
        // Steam and sound waves swell and thin out as they go.
        const k = b.age / (b.age + b.life);
        size *= swell.from + (swell.to - swell.from) * k;
        s.setAlpha((b.echo ? 0.55 : 1) * (1 - swell.fade * k));
      }
      // Loyalty cards spin as they fly.
      if (b.color === 'card' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 70 + b.id) % 4);
      // Invoices flutter, slower than the cards spin.
      if (b.color === 'invoice' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 110 + b.id) % 4);
      // Nuts spin.
      if (b.color === 'nut' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 60 + b.id) % 2);
      // Confetti flutters.
      if (b.color === 'confetti' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 80 + b.id) % 2);
      if (b.color === 'strip' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 100 + b.id) % 2);
      // The dispenser's tickets: the slow ones glide folded and flat by turns, the fan comes out flat.
      if (b.color === 'ticket' && b.owner === 'enemy') s.setFrame(b.wave ? Math.floor(this.time.now / 160 + b.id) % 2 : 0);
      // The assistant's bubbles: «…» while they wait in mid-air; its buttons, SÍ and NO by turns.
      if (b.color === 'bubble') s.setFrame(b.pause && !b.resumed && b.age >= b.pause.at ? 1 : 0);
      if (b.color === 'help') s.setFrame(b.id % 2);
      // The phone's call: its ring pulses; the hold music: one note or two.
      if (b.color === 'call') s.setFrame(Math.floor(this.time.now / 140 + b.id) % 2);
      if (b.color === 'note') s.setFrame(b.id % 2);
      // The Centralita's plugs point where they fly.
      if (b.color === 'plug') s.setRotation(Math.atan2(b.vy, b.vx));
      // Her cords, swept round in phase 3: each coil twists as it flies.
      if (b.color === 'cord') s.setFrame(Math.floor(this.time.now / 110 + b.id) % 2);
      // What the Trituradora took apart (M12 (4b)): the screws spin, the springs boing, the keys tumble.
      if (b.color === 'screw') s.setFrame(Math.floor(this.time.now / 60 + b.id) % 2);
      if (b.color === 'spring') s.setFrame(Math.floor(this.time.now / 90 + b.id) % 2);
      if (b.color === 'key') s.setFrame(Math.floor(this.time.now / 130 + b.id) % 2);
      // The photocopier's sheets tumble over and over.
      if (b.color === 'sheet' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 90 + b.id) % 2);
      // The Director's business cards spin like the loyalty cards; his slides turn edge-on and back.
      if (b.color === 'bizcard' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 70 + b.id) % 4);
      if (b.color === 'slide' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 120 + b.id) % 2);
      // The stamp's drops of ink wobble.
      if (b.color === 'ink' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 80 + b.id) % 2);
      // The Muñeco's shoes and handbags spin a quarter turn at a time (half are shoes, half bags).
      if (b.color === 'accessory' && b.owner === 'enemy') s.setFrame((b.id % 2) * 4 + (Math.floor(this.time.now / 75 + b.id) % 4));
      // The sale stickers turn a quarter at a time as they peel off.
      if (b.color === 'sticker' && b.owner === 'enemy') s.setFrame(Math.floor(this.time.now / 90 + b.id) % 4);
      // Plastilina Mezclada: a stuck bullet turns into a blob of mixed plasticine that wobbles
      // (pink-flecked with Manualidades), and shrinks away at the end.
      if (b.stuck) {
        if (s.texture.key !== 'pegote-plastilina') s.setTexture('pegote-plastilina').setRotation(0).clearTint().setAlpha(1);
        s.setFrame((b.slow?.mul ?? 1) <= 0.5 ? 2 + (Math.floor(this.time.now / 140 + b.id) % 2) : Math.floor(this.time.now / 140 + b.id) % 2);
        size = Math.min(1, b.life / 0.25);
      }
      // Contestador Automático: and a smaller one.
      if (b.echo) size *= 0.8;
      // Hoja de Reclamaciones: the pink copy leaves a trail of pink paper behind it, so the turn reads.
      if (b.chase !== undefined && !b.stuck && this.fx.range(0, 1) < 0.5) {
        this.spark(b.x - b.vx * 0.02, b.y - b.vy * 0.02, Math.atan2(-b.vy, -b.vx) + this.fx.range(-0.5, 0.5), this.fx.range(10, 25), 0, 0xea93a8);
      }
      // Pósit de Urgente: the shot after a roll (and its reply-all pieces) flashes yellow and red.
      if (b.urgent && b.owner === 'player' && !b.limited && !b.stuck) {
        size *= b.reply ? 1.15 : 1.3;
        s.setTint(Math.floor(this.time.now / 90 + b.id) % 2 ? 0xf6c431 : 0xe0453b);
      }
      // The limited edition's last bullet: bigger and gold, glinting.
      if (b.limited) {
        size *= 1.5;
        s.setTint(Math.floor(this.time.now / 60) % 2 ? 0xf6c431 : 0xfff4a8);
      }
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
        v = { s: this.add.image(pr.x, pr.y, c.tier === 'premium' ? 'cofre-premium' : 'cofre', c.open ? 1 : 0).setOrigin(0.5, 1).setDepth(pr.y), open: c.open, pop: this.chestDrop ? 0.35 : 0 };
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
      // The premium one glints now and then: a gold spark on its lid.
      if (!c.open && c.tier === 'premium' && this.fx.chance(dt * 1.5)) {
        this.spark(pr.x + this.fx.range(-10, 10), pr.y - this.fx.range(14, 20), -Math.PI / 2 + this.fx.range(-0.6, 0.6), this.fx.range(15, 35), 1);
      }
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
        const good = k.price !== undefined && (k.kind === 'corazon' || k.kind === 'ticket' || k.kind === 'rasca')
          ? { sprite: k.kind === 'corazon' ? 'corazon-suelo' : k.kind, name: GOOD_NAMES[k.kind] } : null;
        const doc = k.kind === 'documento' ? LORE.find((l) => l.id === k.doc) : undefined;
        const paper = doc ? { sprite: 'documento', name: doc.kind } : null;
        const shown = arm ? { sprite: arm.look.sprite, name: arm.name } : item ? { sprite: item.sprite, name: item.name } : (good ?? paper);
        if (shown) {
          v = {
            s: this.add.image(k.x, k.y, shown.sprite).setOrigin(0.5, 1),
            shadow: this.add.image(k.x, k.y, shadowTexture(this, 8, 3)).setDepth(-50000),
            label: this.add.bitmapText(k.x, k.y - 26, FONT, fontText(shown.name), 8).setOrigin(0.5, 1).setTint(0xf6c431).setDepth(84000).setAlpha(0),
          };
        } else {
          const special = k.kind === 'turbo' || k.kind === 'sobretension' ? SPECIAL_HEARTS[k.kind].sprite : null;
          const shield = k.kind === 'garantia' || !!special;
          const key = heart ? 'corazon-suelo' : special ?? (k.kind === 'garantia' ? 'garantia-provisional' : k.kind === 'ticket' ? 'ticket' : 'cupon');
          v = { s: this.add.image(k.x, k.y, key, 0).setOrigin(0.5, 1), shadow: this.add.image(k.x, k.y, shadowTexture(this, heart || shield ? 5 : 4, 2)).setDepth(-50000) };
        }
        if (k.price !== undefined) {
          // For sale: its price under the stand, with a coupon (gold if it can be paid, grey if not);
          // financed (M14 (r2)), the hearts it costs, with a heart.
          const life = k.pay === 'vida';
          v.price = this.add.bitmapText(k.x + 5, k.y + 8, FONT, life ? String(k.price / 2) : String(k.price), 8).setOrigin(0.5, 0).setDepth(k.y + 1);
          v.priceIcon = this.add.image(k.x - 5 - Math.ceil(v.price.width / 2), k.y + 8, life ? 'corazones' : 'cupon', 0).setOrigin(0.5, 0).setDepth(k.y + 1);
          v.shadow.setVisible(false);
        }
        this.pickupSprites.set(k.id, v);
      }
      if (v.price && k.price !== undefined && k.pay === 'vida') {
        // Financed: red while there is credit (a heart to spare), grey when there is not.
        const can = canFinance(this.world.player, k);
        v.price.setTint(can ? 0xe0453b : 0x858ea8);
        v.priceIcon?.setTint(can ? 0xffffff : 0x858ea8);
      } else if (v.price && k.price !== undefined) {
        const p = this.world.player;
        // Acreditación de Visitante: the label follows the price the toaster pays, if it changes.
        const price = shopPrice(p, k.price);
        if (v.price.text !== String(price)) {
          v.price.setText(String(price));
          v.priceIcon?.setX(k.x - 5 - Math.ceil(v.price.width / 2));
        }
        const can = p.coupons >= price && !(k.kind === 'corazon' && p.hp >= p.def.maxHp);
        v.price.setTint(can ? 0xf6c431 : 0x858ea8);
        v.priceIcon?.setTint(can ? 0xffffff : 0x858ea8);
      }
      if (k.kind === 'arma' || k.kind === 'objeto' || k.kind === 'activo' || k.kind === 'documento' || k.price !== undefined) {
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
   * DENEGADO ink: the square lands a little too big and settles (the thud of the stamp), lies on the
   * floor, and blinks for its last second before it dries.
   */
  /**
   * Suela caliente (M13 (4)): each puff of steam the Plancha leaves on the floor plays the four
   * frames of `vapor-suela` over its life (the hot print fading from orange, the cloud thinning),
   * drawn over the floor and under everyone.
   */
  private drawSteam(): void {
    const alive = new Set<number>();
    for (const k of this.world.steam) {
      alive.add(k.id);
      let v = this.steamViews.get(k.id);
      if (!v) {
        v = this.add.image(Math.round(k.x), Math.round(k.y) - 3, 'vapor-suela', 0).setDepth(-60400);
        this.steamViews.set(k.id, v);
      }
      v.setFrame(Math.min(3, Math.floor((k.t / k.life) * 4)));
      // The cloud drifts up a little as it thins.
      v.setY(Math.round(k.y - 3 - (k.t / k.life) * 4));
      v.setAlpha(k.t > k.life - 0.15 ? 0.55 : 1);
    }
    for (const [id, v] of this.steamViews) {
      if (alive.has(id)) continue;
      v.destroy();
      this.steamViews.delete(id);
    }
  }

  private drawInk(): void {
    const alive = new Set<number>();
    for (const k of this.world.ink) {
      alive.add(k.id);
      let v = this.inkViews.get(k.id);
      if (!v) {
        v = this.add.image(Math.round(k.x), Math.round(k.y), 'tinta-denegado').setDepth(-60500);
        this.inkViews.set(k.id, v);
      }
      const pop = Math.min(1, k.t / 0.1);
      v.setScale(1.2 - 0.2 * pop, 1.2 - 0.2 * pop);
      const left = k.life - k.t;
      v.setAlpha(left < 1 ? (Math.floor(this.time.now / 90) % 2 === 0 ? 0.3 : 0.75) : 0.92);
    }
    for (const [id, v] of this.inkViews) {
      if (alive.has(id)) continue;
      v.destroy();
      this.inkViews.delete(id);
    }
  }

  /**
   * Conveyor belts (src/sim/conveyors.ts): the belt over the floor, its slats running the way it
   * goes, fading in as it starts; the column of intake rollers at its end, turning.
   */
  private drawConveyors(): void {
    const alive = new Set<number>();
    for (const c of this.world.conveyors) {
      alive.add(c.id);
      let v = this.beltViews.get(c.id);
      if (!v) {
        const belt = this.add.tileSprite(c.x, c.y, c.w, c.h, 'cinta-despiece').setOrigin(0, 0).setDepth(-95000).setFlipX(c.dirX < 0);
        let rollers: Phaser.GameObjects.TileSprite | null = null;
        if (c.bite > 0 && c.dirY === 0) {
          const rx = c.dirX > 0 ? c.x + c.w - BELT_ROLLERS_W : c.x;
          rollers = this.add.tileSprite(rx, c.y, BELT_ROLLERS_W, c.h, 'rodillos-despiece', 0).setOrigin(0, 0).setDepth(-94999).setFlipX(c.dirX < 0);
        }
        v = { belt, rollers };
        this.beltViews.set(c.id, v);
      }
      // The slats move with the belt (the texture is drawn running right; flipped, the same scroll runs left).
      v.belt.tilePositionX = -((c.t * c.speed) % 48);
      // A boss's belt fades in as it starts; the room's own were running before anyone came in.
      const shown = c.source === undefined ? 1 : Math.min(1, c.t / 0.4);
      v.belt.setAlpha(shown);
      if (v.rollers) {
        v.rollers.setFrame(Math.floor(c.t * 10) % 2);
        v.rollers.tilePositionY = -((c.t * 12) % 24);
        v.rollers.setAlpha(shown);
      }
    }
    for (const [id, v] of this.beltViews) {
      if (alive.has(id)) continue;
      v.belt.destroy();
      v.rollers?.destroy();
      this.beltViews.delete(id);
    }
  }

  /** Reception phones passing you on to a colleague (Enemy.transfer): the dotted line between the two. */
  private drawTransfers(): void {
    const g = this.transferG;
    g.clear();
    for (const en of this.world.enemies) {
      const tr = en.transfer;
      if (!tr || tr.to === undefined || isDead(en)) continue;
      const mate = this.world.enemies.find((o) => o.id === tr.to);
      if (!mate || isDead(mate)) continue;
      // «Le paso con un compañero»: a dotted line that runs from the phone to its colleague, faster
      // and blinking as the transfer comes; a ring round the colleague, closing in.
      const ax = en.x;
      const ay = en.y - 14;
      const bx = mate.x;
      const by = mate.y - mate.def.anchor.y / 2;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const k = Math.min(1, tr.t / tr.until);
      const blink = k > 0.7 && Math.floor(this.time.now / 70) % 2 === 0;
      const run = (this.time.now / 1000) * (40 + 80 * k);
      for (let d = run % 7; d < len; d += 7) {
        const x = Math.round(ax + ((bx - ax) * d) / len);
        const y = Math.round(ay + ((by - ay) * d) / len);
        g.fillStyle(0x1a1420, 0.8).fillRect(x - 1, y - 1, 4, 4);
        g.fillStyle(blink ? 0xffffff : 0xffd84a, 1).fillRect(x, y, 2, 2);
      }
      g.lineStyle(2, blink ? 0xffffff : 0xffd84a, 0.85);
      g.strokeCircle(bx, by, 18 - 8 * k);
    }
  }

  /**
   * Virtual assistants' shields: the curved pile of canned answers (escudo-faq, drawn facing left)
   * turned towards the shots, at the height of the screen, in front of or behind the body as it
   * faces; fading (its second frame, blinking) its last half second.
   */
  private drawFaqs(): void {
    const g = this.faqG;
    g.clear();
    const alive = new Set<number>();
    for (const en of this.world.enemies) {
      const f = en.faq;
      if (!f || isDead(en) || en.def.brain.kind !== 'chatbot') continue;
      alive.add(en.id);
      let v = this.faqViews.get(en.id);
      if (!v) {
        v = this.add.image(0, 0, 'escudo-faq', 0);
        this.faqViews.set(en.id, v);
      }
      const left = f.until - f.t;
      const pop = Math.min(1, f.t / 0.1);
      v.setPosition(Math.round(en.x + Math.cos(f.dir) * 15), Math.round(en.y - 17 + Math.sin(f.dir) * 9))
        .setRotation(f.dir - Math.PI)
        .setScale(0.6 + 0.4 * pop)
        .setFrame(left < 0.5 ? 1 : 0)
        .setAlpha(left < 0.5 && Math.floor(this.time.now / 80) % 2 === 0 ? 0.5 : 0.95)
        .setDepth(en.y + (Math.sin(f.dir) > 0 ? 1 : -1));
      // The side it covers, as a thin arc round the body: so it reads as a shield, not a pile of bubbles.
      const br = en.def.brain;
      if (br.kind === 'chatbot') {
        const half = (br.shieldArc * Math.PI) / 360;
        const fade = left < 0.5 ? 0.25 : 0.55;
        g.lineStyle(2, 0x8fe3ff, fade * pop);
        g.beginPath();
        g.arc(en.x, en.y - 17, 21, f.dir - half, f.dir + half, false);
        g.strokePath();
      }
    }
    for (const [id, v] of this.faqViews) {
      if (alive.has(id)) continue;
      v.destroy();
      this.faqViews.delete(id);
    }
  }

  /**
   * Queue posts' tapes: the blue tape (cinta-poste, repeated along it) from drum to drum at the
   * height of the drums, sorted with everything else by the middle of its feet line; under it, a
   * dark line on the floor where it actually stops the toaster. Tense (the toaster in the middle,
   * close), the lighter frame and a slight shiver. A tape snapping back shrinks into its post.
   */
  private drawTapes(dt: number): void {
    const g = this.turnG;
    const alive = new Set<number>();
    for (const { a, b } of tapesOf(this.world)) {
      const br = a.def.brain;
      if (br.kind !== 'queuer') continue;
      alive.add(a.id);
      const h = br.muzzleY - 3;
      const ax = Math.round(a.x);
      const ay = Math.round(a.y);
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      const len = Math.hypot(bx - ax, by - ay);
      let v = this.tapeViews.get(a.id);
      if (!v) {
        const tape = this.add.tileSprite(ax, ay - h, Math.max(1, len), 6, 'cinta-poste', 0).setOrigin(0, 0.5);
        v = { tape, ax, ay, bx, by };
        this.tapeViews.set(a.id, v);
      }
      v.ax = ax;
      v.ay = ay - h;
      v.bx = bx;
      v.by = by - h;
      const shiver = a.tense ? Math.round(this.fx.range(-0.6, 0.6)) : 0;
      v.tape.setPosition(ax, ay - h + shiver).setSize(Math.max(1, Math.round(len)), 6).setRotation(Math.atan2(by - ay, bx - ax))
        .setFrame(a.tense ? 1 : 0).setDepth((a.y + b.y) / 2 + 0.5);
      // The tape's line on the floor: where it stops the toaster.
      g.lineStyle(2, 0x0b1a2a, 0.35);
      g.lineBetween(ax, ay - 1, bx, by - 1);
    }
    for (const [id, v] of this.tapeViews) {
      if (alive.has(id)) continue;
      v.tape.destroy();
      this.tapeViews.delete(id);
    }
    for (const sn of this.tapeSnaps) {
      sn.t += dt;
      const k = Math.max(0, 1 - sn.t / 0.16);
      g.lineStyle(3, 0x4aa8ff, 0.9);
      g.lineBetween(sn.x, sn.y, sn.x + (sn.fx - sn.x) * k, sn.y + (sn.fy - sn.y) * k);
    }
    this.tapeSnaps = this.tapeSnaps.filter((sn) => sn.t < 0.16);
  }

  /**
   * The Centralita's voice menu: its zones on the floor (pale and dashed while she reads the menu;
   * once she has said which, the one to press glows and the others go red and blink faster as the
   * rain comes), and before a transfer, a yellow ring closing on the toaster. The dotted line of a
   * transfer fades out.
   */
  private drawMenus(dt: number): void {
    const g = this.menuG;
    g.clear();
    const alive = new Set<number>();
    for (const en of this.world.enemies) {
      const m = en.menu;
      if (m && !isDead(en) && en.state !== 'dying') {
        alive.add(en.id);
        let v = this.menuViews.get(en.id);
        if (!v || v.length !== m.zones.length) {
          for (const im of v ?? []) im.destroy();
          v = m.zones.map((z) => this.add.image(z.x, z.y, 'zona-menu', z.n - 1).setDepth(-60400));
          this.menuViews.set(en.id, v);
        }
        const pop = Math.min(1, m.t / 0.15);
        m.zones.forEach((z, i) => {
          const im = v![i]!;
          const bad = m.said && i !== m.good;
          im.setFrame(z.n - 1 + (bad ? 3 : 0)).setPosition(z.x, z.y).setScale(1.15 - 0.15 * pop);
          if (bad && !m.rained) {
            // Faster and faster as the rain comes.
            const left = Math.max(0, m.rainAt - m.t);
            const period = 60 + 140 * Math.min(1, left / 1.5);
            im.setAlpha(Math.floor(this.time.now / period) % 2 ? 1 : 0.65);
          } else if (m.rained) im.setAlpha(bad ? 1 : 0.5);
          else im.setAlpha(0.95);
          if (m.said && i === m.good && !m.rained) {
            // The one to press: a pale outline that breathes.
            const k = 0.5 + 0.5 * Math.sin(this.time.now / 90);
            g.lineStyle(2, 0xd6ecff, 0.5 + 0.4 * k);
            g.strokeRoundedRect(z.x - MENU_ZONE_W / 2 - 2, z.y - MENU_ZONE_H / 2 - 2, MENU_ZONE_W + 4, MENU_ZONE_H + 4, 4);
          }
        });
      }
      const mk = en.deptMark;
      if (mk && !isDead(en)) {
        const p = this.world.player;
        const k = Math.min(1, mk.t / mk.until);
        const r = 26 - 14 * k;
        const blink = Math.floor(this.time.now / 70) % 2 === 0;
        g.lineStyle(2, 0xffd84a, blink ? 1 : 0.6);
        g.strokeEllipse(p.x, p.y - 2, r * 2, r * 1.2);
        g.lineStyle(1, 0xffd84a, 0.7);
        g.strokeEllipse(p.x, p.y - 2, (r + 6) * 2, (r + 6) * 1.2);
      }
    }
    for (const [id, v] of this.menuViews) {
      if (alive.has(id)) continue;
      for (const im of v) im.destroy();
      this.menuViews.delete(id);
    }
    for (const ln of this.deptLines) {
      ln.t += dt;
      const a = Math.max(0, 1 - ln.t / 0.6);
      const d = Math.hypot(ln.bx - ln.ax, ln.by - ln.ay);
      const n = Math.floor(d / 7);
      g.fillStyle(0xffd84a, a);
      for (let i = 0; i <= n; i++) {
        const k = n ? i / n : 0;
        g.fillRect(Math.round(ln.ax + (ln.bx - ln.ax) * k) - 1, Math.round(ln.ay + (ln.by - ln.ay) * k) - 1, 2, 2);
      }
    }
    this.deptLines = this.deptLines.filter((ln) => ln.t < 0.6);
    // «Diagnóstico»: a red fan of light from the scanner to the toaster, and the scan line going
    // up and down it twice, until the warning ends.
    for (const sc of this.scans) {
      sc.t += dt;
      const en = this.world.enemies.find((e) => e.id === sc.boss);
      if (!en || isDead(en) || en.state === 'dying') {
        sc.t = sc.time;
        continue;
      }
      const p = this.world.player;
      const tx = en.x + SCANNER_TIP.x * en.facing;
      const ty = en.y - SCANNER_TIP.y;
      const k = Math.min(1, sc.t / sc.time);
      const top = p.y - 32;
      const bottom = p.y - 2;
      const flick = Math.floor(this.time.now / 50) % 2 ? 0.16 : 0.22;
      g.fillStyle(0xff5a46, flick * (1 - 0.4 * k));
      g.fillTriangle(tx, ty, p.x - 12, top, p.x - 12, bottom);
      g.fillTriangle(tx, ty, p.x + 12, top, p.x + 12, bottom);
      g.fillTriangle(tx, ty, p.x - 12, top, p.x + 12, bottom);
      // The line itself: up and down the toaster, twice.
      const sweep = (k * 2) % 1;
      const ly = Math.round(sweep < 0.5 ? top + (bottom - top) * sweep * 2 : bottom - (bottom - top) * (sweep - 0.5) * 2);
      g.fillStyle(0xff5a46, 0.9);
      g.fillRect(Math.round(p.x - 13), ly, 26, 1);
      g.fillStyle(0xffd0c0, 0.9);
      g.fillRect(Math.round(p.x - 6), ly, 12, 1);
      g.lineStyle(1, 0xff5a46, 0.8);
      g.lineBetween(tx, ty, p.x - 13, ly);
      g.lineBetween(tx, ty, p.x + 13, ly);
    }
    this.scans = this.scans.filter((sc) => sc.t < sc.time);
  }

  /**
   * Ticket dispensers' turns: the circle on the floor (yellow called, green served, red lost), its
   * number in big digits, and while it is called a yellow arc round it that runs out with the
   * countdown (blinking for its last second). It pops in a little big, and fades as it goes.
   */
  private drawTurns(): void {
    const g = this.turnG;
    g.clear();
    const alive = new Set<number>();
    for (const en of this.world.enemies) {
      const c = en.turn;
      if (!c || isDead(en) || en.state === 'dying') continue;
      alive.add(en.id);
      let v = this.turnViews.get(en.id);
      if (!v) {
        const circle = this.add.image(Math.round(c.x), Math.round(c.y), 'circulo-turno', 0).setDepth(-60400);
        const num = this.add.bitmapText(Math.round(c.x), Math.round(c.y), FONT, turnNumber(c.num), 8).setOrigin(0.5, 0.5).setScale(2).setDepth(-60300);
        v = { circle, num, state: '' };
        this.turnViews.set(en.id, v);
      }
      if (v.state !== c.state) {
        v.state = c.state;
        v.circle.setFrame(c.state === 'called' ? 0 : c.state === 'served' ? 1 : 2);
        v.num.setTint(c.state === 'called' ? 0xf6c431 : c.state === 'served' ? 0x7fe08a : 0xe0453b);
      }
      const pop = c.state === 'called' ? Math.min(1, c.t / 0.12) : 1;
      v.circle.setScale(1.25 - 0.25 * pop);
      const left = c.until - c.t;
      const fade = c.state === 'called' ? 1 : Math.min(1, left / 0.4);
      const blink = c.state === 'called' && left < 1 && Math.floor(this.time.now / 110) % 2 === 0;
      v.circle.setAlpha((blink ? 0.6 : 0.95) * fade);
      // Lost: the number shakes, as the dispenser does.
      const jx = c.state === 'lost' ? Math.round(this.fx.range(-1, 1)) : 0;
      v.num.setPosition(Math.round(c.x) + jx, Math.round(c.y)).setAlpha(fade);
      if (c.state === 'called') {
        const k = Math.max(0, left / c.until);
        g.lineStyle(2, 0xf6c431, blink ? 0.55 : 0.95);
        g.beginPath();
        g.arc(c.x, c.y, c.r - 4, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2, false);
        g.strokePath();
      }
    }
    for (const [id, v] of this.turnViews) {
      if (alive.has(id)) continue;
      v.circle.destroy();
      v.num.destroy();
      this.turnViews.delete(id);
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
        const ball =
          f.product !== undefined
            ? this.add.image(f.fromX, f.fromY, f.look ?? 'producto-caducado', f.look ? 0 : f.product)
            : f.brick !== undefined
              ? this.add.image(f.fromX, f.fromY, 'pieza', f.brick)
              : f.sticker
                ? this.add.image(f.fromX, f.fromY, `${f.sticker}-vuelo`, 0)
                : this.add.image(f.fromX, f.fromY, 'bola-escarcha');
        v = { ball, shadow: this.add.image(f.fromX, f.fromY, shadowTexture(this, 4, 2)).setDepth(-50000), patch: null };
        this.frostViews.set(f.id, v);
      }
      if (f.t < 0) {
        const k = 1 + f.t / f.flight;
        const x = f.fromX + (f.x - f.fromX) * k;
        const y = f.fromY + (f.y - f.fromY) * k;
        const h = f.fromH * (1 - k) + Math.sin(Math.PI * k) * 46;
        const spin = f.brick !== undefined ? (Math.floor(k * 8 + f.id) % 4) * (Math.PI / 2) : k * (f.product !== undefined ? 4 : 6);
        v.ball.setPosition(Math.round(x), Math.round(y - h)).setDepth(y + 30);
        // A label flutters (face up, edge on); the rest spin.
        if (f.sticker) v.ball.setFrame(Math.floor(k * 8) % 2);
        else v.ball.setRotation(spin);
        v.shadow.setPosition(Math.round(x), Math.round(y));
        // Where it will land: a cold ring that closes in, over a dark ellipse (a small cross for a piece).
        if (f.brick !== undefined) {
          const fx = Math.round(f.x);
          const fy = Math.round(f.y);
          const s2 = Math.round(5 - 2 * k);
          g.fillStyle(0x0e0c16, 0.25 + 0.25 * k).fillEllipse(fx, fy, 10, 6);
          if (k < 0.85 || Math.floor(this.time.now / 60) % 2 === 0) {
            g.fillStyle(0xf6c431, 1);
            g.fillRect(fx - s2, fy, s2 * 2 + 1, 1);
            g.fillRect(fx, fy - Math.ceil(s2 * FROST_FLAT), 1, Math.ceil(s2 * FROST_FLAT) * 2 + 1);
          }
          continue;
        }
        const rx = Math.round(f.r * (1.35 - 0.35 * k));
        const ry = Math.round(rx * FROST_FLAT);
        g.fillStyle(0x0e0c16, 0.18 + 0.2 * k).fillEllipse(Math.round(f.x), Math.round(f.y), f.r * 2, f.r * 2 * FROST_FLAT);
        pixelEllipse(g, Math.round(f.x), Math.round(f.y) + 1, rx, ry, 0x0e0c16);
        // Frost marks its spot in cyan; expired products, in red.
        if (k < 0.85 || Math.floor(this.time.now / 60) % 2 === 0) pixelEllipse(g, Math.round(f.x), Math.round(f.y), rx, ry, f.product !== undefined ? 0xe0453b : f.sticker ? 0x8ef07a : 0x69dbd8);
        continue;
      }
      if (v.ball.visible) {
        v.ball.setVisible(false);
        // A piece keeps its shadow under it, so it stands out on the busy mats.
        if (f.brick !== undefined) v.shadow.setPosition(Math.round(f.x), Math.round(f.y) + 1).setScale(1.4, 1.2).setDepth(-59500);
        else v.shadow.setVisible(false);
      }
      const left = f.life - f.t;
      if (f.brick !== undefined) {
        // A piece on the floor: it bounces once as it lands, and blinks before it is tidied away.
        if (!v.patch) v.patch = this.add.sprite(Math.round(f.x), Math.round(f.y) - 2, 'pieza', f.brick).setDepth(-59000);
        const hop = f.t < 0.25 ? Math.round(Math.sin((f.t / 0.25) * Math.PI) * 3) : 0;
        v.patch.setY(Math.round(f.y) - 2 - hop);
        const a = left < 1 ? (Math.floor(this.time.now / 90) % 2 === 0 ? 0.35 : 0.9) : 1;
        v.patch.setAlpha(a);
        v.shadow.setAlpha(a);
        continue;
      }
      if (!v.patch) v.patch = this.add.sprite(Math.round(f.x), Math.round(f.y), f.sticker ?? 'escarcha', 0).setDepth(-60000);
      const pop = Math.min(1, f.t / 0.12);
      v.patch.setScale(0.5 + 0.5 * pop);
      // Frost sparkles (a label just lies there).
      if (!f.sticker) v.patch.setFrame(Math.floor(this.time.now / 420 + f.id) % 2);
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
      // On a label it is glue, not cold: no tint, and the feet come up with a tacky tug now and then.
      const glued = this.world.frost.some((f) => f.sticker && inFrost(f, p.x, p.y));
      if (glued) {
        if (Math.hypot(p.vx, p.vy) > 10 && this.fx.chance(dt * 3)) this.sound2.play('pegatina', { detune: this.fx.range(400, 800), volume: 0.25 });
      } else {
        if (this.flashHero <= 0 && !(p.invulnerable > 0 && !isRolling(p))) this.hero.setTint(0xbfeff0);
        if (Math.hypot(p.vx, p.vy) > 10 && this.fx.chance(dt * 14)) this.iceShard(p.x + this.fx.range(-4, 4), p.y);
      }
    }
  }

  /**
   * An air conditioner's cone of cold air: a faint wash over the floor with dotted edges, and white
   * streaks drifting out along it (faster near the vent, fading at the end of its reach).
   */
  private drawWind(): void {
    const g = this.windG;
    g.clear();
    for (const en of this.world.enemies) {
      const b = en.def.brain;
      if (b.kind !== 'blower' || isDead(en) || en.state === 'dying') continue;
      const a = Math.atan2(en.dirY, en.dirX);
      const half = (b.coneDeg / 2) * (Math.PI / 180);
      const x0 = en.x;
      const y0 = en.y;
      g.fillStyle(0xdff6ff, 0.13);
      g.slice(x0, y0, b.range, a - half, a + half, false).fillPath();
      // Dotted edges, so its reach reads even on the pale floors.
      for (const s of [-1, 1]) {
        const ea = a + s * half;
        for (let d = 14; d < b.range; d += 6) g.fillStyle(0xdff6ff, 0.35 * (1 - d / b.range) + 0.1).fillRect(Math.round(x0 + Math.cos(ea) * d), Math.round(y0 + Math.sin(ea) * d), 1, 1);
      }
      // Streaks: each one a short white dash at its own angle in the cone, travelling out.
      const t = this.time.now / 1000;
      for (let i = 0; i < 14; i++) {
        const k = ((t * 0.9 + i * 0.37 + en.id * 0.11) % 1 + 1) % 1;
        const d = 12 + k * (b.range - 12);
        const off = (((i * 0.618 + en.id * 0.3) % 1) * 2 - 1) * half * 0.9;
        const sa = a + off;
        const px = x0 + Math.cos(sa) * d;
        const py = y0 + Math.sin(sa) * d - 6;
        const len = 6 + 4 * (1 - k);
        g.fillStyle(0xf4f1e8, 0.85 * (1 - k * k));
        for (let j = 0; j < len; j++) g.fillRect(Math.round(px + Math.cos(sa) * j), Math.round(py + Math.sin(sa) * j), 1, 1);
      }
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
    this.scanned.clear();
    for (const wn of activeWarnings(this.world)) {
      const k = wn.k;
      // A photocopier's scan is the green of its light, not a threat colour.
      const col = wn.scan !== undefined ? 0xb8f07a : wn.color === 'red' || wn.color === 'cord' ? 0xe0453b : wn.color === 'sticker' ? 0x8ef07a : 0x69dbd8;
      if (wn.scan !== undefined) {
        this.scanned.add(wn.scan);
        // Corner brackets round whoever is being copied, closing in over the scan.
        const tgt = this.world.enemies.find((o) => o.id === wn.scan);
        if (tgt) {
          const hb = tgt.def.hurt;
          const pad = Math.round(2 + 6 * (1 - k));
          const x0 = Math.round(tgt.x + hb.x) - pad;
          const y0 = Math.round(tgt.y + hb.y) - pad;
          const x1 = Math.round(tgt.x + hb.x + hb.w) + pad;
          const y1 = Math.round(tgt.y + hb.y + hb.h) + pad;
          for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]] as const) {
            g.fillStyle(0x0e0c16, 1).fillRect(Math.min(cx, cx + sx * 4) - 1, cy - 1, 6, 3).fillRect(cx - 1, Math.min(cy, cy + sy * 4) - 1, 3, 6);
            g.fillStyle(col, 1).fillRect(Math.min(cx, cx + sx * 3), cy, 4, 1).fillRect(cx, Math.min(cy, cy + sy * 3), 1, 4);
          }
        }
      }
      const x = Math.round(wn.x);
      const y = Math.round(wn.y);
      if (wn.mark === 'flash') {
        this.drawFlashMark(g, x, y, k);
        continue;
      }
      if (wn.mark === 'stamp' && wn.size) {
        this.drawStampShadow(g, x, y, wn.size.w, wn.size.h, k);
        continue;
      }
      // Bullets: a ring closes in on the muzzle; when it reaches it, they come out.
      if (wn.bullets) {
        const r = Math.round(4 + 16 * (1 - k));
        pixelRing(g, x, y, r + 1, 0x0e0c16);
        pixelRing(g, x, y, r, col);
      }
      // A sweep (the Centralita's cords): long dotted lines where its arms start, growing over the
      // warning, so the gap to stand in can be read before the first coil is out.
      if (wn.arms) {
        const len = 40 + 150 * k;
        const off = (this.time.now / 60) % 6;
        for (const ang of wn.arms) {
          for (let d = 14 + off; d < 14 + len; d += 6) {
            const px = Math.round(x + Math.cos(ang) * d);
            const py = Math.round(y + Math.sin(ang) * d);
            g.fillStyle(0x0e0c16, 1).fillRect(px - 1, py - 1, 3, 3);
            g.fillStyle(col, 1).fillRect(px, py, 1, 1);
          }
        }
      }
      // Aimed attacks: dots show where they will go (a charge shows its whole path).
      if (wn.aimed) {
        const len = wn.reach ?? (wn.bullets ? 10 + 26 * k : 30 + 110 * k);
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
    this.drawCrateMarks(g);
  }

  /**
   * «Control de calidad» (BossPhase.crates): where a stack of crates will land, its tile darkens
   * and a hazard frame (yellow and black dashes that crawl round it) blinks faster and faster.
   */
  private drawCrateMarks(g: Phaser.GameObjects.Graphics): void {
    for (const d of this.world.crates) {
      const k = Math.min(1, d.t / d.warn);
      const { x, y, w, h } = d.box;
      g.fillStyle(0x0e0c16, 0.18 + 0.4 * k).fillRect(x + 1, y + 1, w - 2, h - 2);
      const on = k < 0.6 ? Math.floor(this.time.now / 140) % 2 === 0 : Math.floor(this.time.now / 60) % 2 === 0;
      // The frame, walked round clockwise, dashes of three that crawl along it.
      const off = Math.floor(this.time.now / 80) % 6;
      const x1 = x + w - 2;
      const y1 = y + h - 2;
      const edge: Array<[number, number]> = [];
      for (let px = x + 1; px < x1; px++) edge.push([px, y + 1]);
      for (let py = y + 1; py < y1; py++) edge.push([x1, py]);
      for (let px = x1; px > x + 1; px--) edge.push([px, y1]);
      for (let py = y1; py > y + 1; py--) edge.push([x + 1, py]);
      edge.forEach(([px, py], i) => {
        const yellow = Math.floor((i + off) / 3) % 2 === 0;
        g.fillStyle(yellow ? (on ? 0xfff1a8 : 0xf6c431) : 0x0e0c16, 1).fillRect(px, py, 1, 1);
      });
    }
  }

  /** The stacks of crates in their last moment in the air: they drop out of the dark onto their marks. */
  private crateViews = new Map<number, Phaser.GameObjects.Image>();

  private drawFallingCrates(): void {
    const alive = new Set<number>();
    for (const d of this.world.crates) {
      const left = d.warn - d.t;
      if (left > CRATE_FALL) continue;
      alive.add(d.id);
      let v = this.crateViews.get(d.id);
      if (!v) {
        v = this.add.image(d.x, d.y, 'pila-cajas').setOrigin(0.5, 1);
        this.crateViews.set(d.id, v);
      }
      const q = 1 - left / CRATE_FALL;
      v.setPosition(d.x, Math.round(d.y - CRATE_DROP * (1 - q * q))).setDepth(d.y);
    }
    for (const [id, v] of this.crateViews) {
      if (alive.has(id)) continue;
      v.destroy();
      this.crateViews.delete(id);
    }
  }

  /** They land: a thud that shakes the room, dust out from under them and a few splinters of grey plastic. */
  private cratesLand(e: Extract<SimEvent, { type: 'crateLand' }>): void {
    this.sound2.play('derrumbe', { volume: 0.55, detune: this.fx.range(-200, 100) });
    this.sound2.play('carton', { detune: -400 });
    this.shake(170, 0.009, true);
    for (const at of e.spots) {
      this.puff(at.x + this.fx.range(-8, 8), at.y - 2, this.fx.range(0.4, 0.7));
      if (this.fx.chance(0.5)) this.splinter(at.x + this.fx.range(-10, 10), at.y - this.fx.range(4, 20), this.fx.range(0, Math.PI * 2), this.fx.pick([0xb4baae, 0x868c80, 0x8ef07a]));
    }
  }

  /**
   * The sheet stuck on a body (EnemyAnim.badge, the Muñeco's sale tag): on its spot of the frame,
   * mirrored with the body but never flipped (the price reads), with the body's tint; the phase
   * picks its frame (BossPhase.badge). Hidden on frames that have no box to stick it to.
   */
  private drawBadge(en: Enemy, v: EnemyView, frame: number): void {
    const bd = en.def.anim?.badge;
    const t = v.badge!;
    const s = v.s;
    if (!bd || frame >= bd.upTo || !s.visible) {
      t.setVisible(false);
      return;
    }
    const b = en.def.brain;
    const tag = b.kind === 'boss' ? (b.phases[en.bossPhase ?? 0]?.badge ?? 0) : 0;
    const fx = en.facing === 1 ? bd.x : en.def.anchor.x * 2 - bd.x - bd.w;
    t.setVisible(true).setFrame(tag);
    t.setPosition(Math.round(s.x - en.def.anchor.x + fx), Math.round(s.y - en.def.anchor.y + bd.y + (bd.frameDy?.[frame] ?? 0)));
    t.setDepth(s.depth + 0.05);
    if (s.isTinted && s.tintFill) t.setTintFill(s.tintTopLeft);
    else if (s.isTinted) t.setTint(s.tintTopLeft);
    else t.clearTint();
  }

  /**
   * A stamp coming down: its square shadow on the floor, growing to the size of the ink and darker
   * as it comes, with a red frame that blinks faster at the end.
   */
  private drawStampShadow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, k: number): void {
    const s = 0.55 + 0.45 * k;
    const sw = Math.round(w * s);
    const sh = Math.round(h * s);
    const x0 = x - Math.floor(sw / 2);
    const y0 = y - Math.floor(sh / 2);
    g.fillStyle(0x0e0c16, 0.3 + 0.4 * k).fillRect(x0, y0, sw, sh);
    // The frame: red, flashing brighter faster and faster; thicker corners, like the stamp's own.
    const blink = k < 0.6 ? Math.floor(this.time.now / 120) % 2 === 0 : Math.floor(this.time.now / 50) % 2 === 0;
    g.fillStyle(blink ? 0xff8a70 : 0xe0453b, 1);
    g.fillRect(x0, y0, sw, 1).fillRect(x0, y0 + sh - 1, sw, 1).fillRect(x0, y0, 1, sh).fillRect(x0 + sw - 1, y0, 1, sh);
    for (const [cx, cy] of [[x0, y0], [x0 + sw - 4, y0], [x0, y0 + sh - 2], [x0 + sw - 4, y0 + sh - 2]] as const) g.fillRect(cx, cy, 4, 2);
  }

  /**
   * A camera flash left on the catwalk, charging: a small pink ring on the floor that closes in
   * and a four-pointed glint over it that grows (white at the end), blinking faster as it goes.
   */
  private drawFlashMark(g: Phaser.GameObjects.Graphics, x: number, y: number, k: number): void {
    const r = Math.round(3 + 7 * (1 - k));
    pixelRing(g, x, y, r + 1, 0x0e0c16);
    pixelRing(g, x, y, r, 0xe070c8);
    if (!this.warnOn(k)) return;
    const col = this.warnColor(k);
    const arm = 2 + Math.round(4 * k);
    const cy = y - 4;
    g.fillStyle(0x0e0c16, 1).fillRect(x - arm - 1, cy - 1, arm * 2 + 3, 3).fillRect(x - 1, cy - arm - 1, 3, arm * 2 + 3);
    g.fillStyle(col, 1).fillRect(x - arm, cy, arm * 2 + 1, 1).fillRect(x, cy - arm, 1, arm * 2 + 1);
    g.fillStyle(0xffffff, 1).fillRect(x - 1, cy - 1, 3, 3);
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
    // An item can also go (the backup, used up): fewer icons, each showing what is left in its place.
    while (this.itemIcons.length > p.items.length) drop(this.itemIcons.pop()!);
    this.itemIcons.forEach((icon, i) => {
      const key = ITEMS[p.items[i]!]?.sprite ?? 'objeto-caja';
      if (icon.texture.key !== key) icon.setTexture(key);
    });
    while (this.hearts.length < maxHearts) {
      const h = this.hud(this.add.image(8, 8, 'corazones', 0).setOrigin(0, 0));
      h.setVisible(this.gunIcon.visible);
      this.hearts.push(h);
    }
    const shields = loanIcons(p).length;
    while (this.shieldIcons.length > shields) drop(this.shieldIcons.pop()!);
    while (this.shieldIcons.length < shields) {
      const h = this.hud(this.add.image(8, 8, 'garantias-hud', 0).setOrigin(0, 0));
      h.setVisible(this.gunIcon.visible);
      this.shieldIcons.push(h);
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
    const kind = this.world.room.kind;
    this.hintText = fontText(kind === 'hub' ? hubHint(keyWords()) : controlsHint(keyWords()) + (kind === 'test' ? ` · ${TEST_ROOM_HINT}` : ''));
  }

  /** Where everything on the HUD goes right now (see src/render/hud.ts). */
  private computeLayout(): HudLayout {
    const p = this.world.player;
    return hudLayout({
      hearts: Math.ceil(p.def.maxHp / 2),
      shields: loanIcons(p).length,
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
    this.shieldIcons.forEach((h, i) => h.setX(l.shields[i]?.x ?? 8));
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
    // In the Mostrador the gun is holstered: no gun, no ammo, no plate for them.
    if (this.world.room.kind !== 'hub') plate(l.weapon);
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
    // What is on loan after the hearts, in the order it pays: the surge heart (it crackles), the
    // warranties (whole or half, with a slow sway, as paper does) and the turbo (its stripe flickers).
    const loans = loanIcons(p);
    this.shieldIcons.forEach((h, i) => {
      const l = loans[i];
      if (!l) return;
      if (h.texture.key !== l.key) h.setTexture(l.key);
      if (l.key === 'turbo-hud') {
        h.setFrame(Math.floor(this.time.now / 90) % 2);
        h.setY(8);
      } else if (l.key === 'sobretension-hud') {
        h.setFrame(l.half ? 1 : 0);
        h.setY(8 + (Math.floor(this.time.now / 60) % 9 === 0 ? 1 : 0));
      } else {
        h.setFrame(l.half ? 1 : 0);
        h.setY(8 - (Math.floor(this.time.now / 400 + i) % 4 === 0 ? 1 : 0));
      }
    });
    // In turbo, the toaster leaves sparks behind it now and then.
    if (p.turbo && !this.world.over && this.fx.chance(dt * 14)) {
      this.spark(p.x - p.facing * 6, p.y - 8, p.facing > 0 ? Math.PI : 0, this.fx.range(20, 50), 1);
    }
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
    const holstered = this.world.room.kind === 'hub';
    for (const o of [this.gunIcon, this.ammoText, ...this.ammoPips]) o.setAlpha(holstered ? 0 : 1);
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
    // A room narrower or lower than the screen sits centred in it. The Mostrador is only a little
    // taller than the screen: the camera stays up, so what hangs on the back wall (the sign, the
    // board, the phone) is always whole; its bottom row is the wall.
    const xr = scrollRange(room.w, VIEW_W);
    const yr = scrollRange(room.h, VIEW_H, room.kind === 'hub');
    this.camX = Math.max(xr.lo, Math.min(xr.hi, this.camX));
    this.camY = Math.max(yr.lo, Math.min(yr.hi, this.camY));
    cam.setScroll(Math.round(this.camX), Math.round(this.camY));
  }
}

/** Enemy bullet sprites by colour: the boss's ice is a cube. */
/** Depth of the glass partitions: on the floor with the walls they replace, over shadows, under anyone standing. */
const PARTITION_DEPTH = -49000;
/** Width of the intake rollers' sprite at the end of a belt (tools/sprites/trituradora.ts makeIntakeTiles). */
const BELT_ROLLERS_W = 16;
/** Radius the player's bullet sprite is drawn for (the hair dryer's). */
const PLAYER_BULLET_R = 3;
/** Tyre marks on the floor at once, at most (each is two dashes). */
const SKID_MAX = 120;
/** The last seconds of a crate mark, in which the stack is seen falling, and from how high (px). */
const CRATE_FALL = 0.3;
const CRATE_DROP = 140;

/** Depth added to the toaster while it rolls over a low counter (deeper than the counter is tall). */
const LOW_PROP_LIFT = 90;

const BULLET_TEXTURES: Record<BulletColor, string> = {
  red: 'bala-roja', cyan: 'bala-cian', ice: 'bala-cubito', card: 'bala-tarjeta', invoice: 'bala-factura', nut: 'bala-tuerca',
  confetti: 'bala-confeti', accessory: 'bala-accesorio', sticker: 'bala-pegatina', strip: 'bala-tira', sheet: 'bala-folio', ink: 'bala-tinta',
  bizcard: 'bala-tarjeta-visita', slide: 'bala-diapositiva', cut: 'bala-recorte', ticket: 'tique-turno', steel: 'bola-acero', bubble: 'bocadillo', help: 'boton-ayuda',
  call: 'bala-llamada', note: 'nota-espera', plug: 'bala-clavija', cord: 'bala-cable',
  screw: 'bala-tornillo', spring: 'bala-muelle', key: 'bala-tecla',
};

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
  /** 1 shown, down to BOSS_BAR_VEIL while the toaster or the voice menu zones are under it. */
  veil: number;
}

const BOSS_BAR_W = BOSS_BAR.w;
const BOSS_BAR_H = BOSS_BAR.h;
const BOSS_BAR_Y = BOSS_BAR.y;
/** How see-through the boss bar gets with something under it. */
const BOSS_BAR_VEIL = 0.22;

interface EnemyView {
  /** When a remote last switched back on (ms), for the TV «switch on» animation. */
  onAt?: number;
  s: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  blink?: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Graphics;
  /** A sheet drawn over the body (EnemyAnim.badge): the Muñeco's sale tag. */
  badge?: Phaser.GameObjects.Image;
  /** It was spinning on the spot last frame (EnemyAnim.spin). */
  spinning?: boolean;
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
