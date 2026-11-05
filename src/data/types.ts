// Typed content definitions. Adding content means adding data here, not touching the engine.

export interface WeaponDef {
  id: string;
  /**
   * «buena»: only the premium chest gives it (and never the cardboard one), see docs/DISENO.md
   * «Economía». Unset: an ordinary one.
   */
  quality?: 'buena';
  name: string;
  description: string;
  /** Shots per second while the trigger is held. */
  fireRate: number;
  magazine: number;
  /** Seconds. */
  reloadTime: number;
  /** Half-angle of the random spread, in degrees. */
  spreadDeg: number;
  bulletSpeed: number;
  /** Seconds a bullet lives before fading out. */
  bulletLife: number;
  damage: number;
  bulletRadius: number;
  /** Speed the shooter loses backwards per shot (px/s). */
  recoil: number;
  /** Speed given to what is hit (px/s). */
  knockback: number;
  /** Bullets per trigger pull. */
  pellets: number;
  /** What its bullets do besides flying straight (from items; see src/sim/mods.ts). */
  bullets?: BulletBehaviour;
  /** How it looks and sounds (render only): held sprite, bullet sprite, shot sound. */
  look: WeaponLook;
}

export interface WeaponLook {
  /** Texture of the weapon in the hand (about 18 x 11, barrel to the right); also lies on the floor. */
  sprite: string;
  /** Texture of its bullets, drawn for its base bulletRadius. */
  bullet: string;
  /** The bullet sprite turns to face where it flies (staples). */
  turn?: boolean;
  /** Sound of a shot (src/audio/synth.ts). */
  sound: string;
  /** Screen shake per shot (fraction of the view). */
  shake: number;
}

/**
 * What the player's bullets do besides flying straight (items give these; see src/sim/mods.ts).
 * Counts add up between items; homing takes the strongest.
 */
export interface BulletBehaviour {
  /** Enemies it goes through before stopping (each one is hit once). */
  pierce?: number;
  /** Times it bounces off walls and props before stopping. */
  bounce?: number;
  /** Turns towards the nearest enemy within `range` px, `turnDeg` per second, for `time` s. */
  homing?: { turnDeg: number; time: number; range: number };
  /** Each bullet has `chance` (0–1) of dealing `mul` times its damage (a critical hit). */
  crit?: { chance: number; mul: number };
  /**
   * The enemies it hits go at `mul` of their speed (and think that much slower) for `time` s (the
   * glitter): they skip one tick in every 1 / (1 − mul). The strongest wins.
   */
  slow?: { mul: number; time: number };
  /**
   * The last bullet of each magazine (Pegatina de Edición Limitada): `mul` times the damage (the
   * biggest wins) and `pierce` more enemies to go through (they add up).
   */
  last?: { mul?: number; pierce?: number };
  /**
   * Plastilina Mezclada: a bullet that hits a wall or a prop (and has no bounce left) stays stuck
   * there for `time` s, and hurts every enemy that walks into it (each one once); with `slow`, it
   * slows them too (Manualidades). The longest time and the strongest slow win.
   */
  stick?: { time: number; slow?: { mul: number; time: number } };
}

/**
 * What a modifier does that is neither a stat nor a bullet behaviour. Several add up.
 */
export interface Perks {
  /** Extra batteries for the active item each time a combat room is cleared. */
  charge?: number;
  /** Chance (0–1) that each enemy killed (bosses aside) drops one more coupon. */
  coupons?: number;
  /** While rolling, the enemy bullets the toaster touches are cut. */
  rollClear?: boolean;
  /** Once, instead of going down, the toaster gets this much life back; the item that gives it is used up. */
  revive?: number;
  /** After each reload the weapon fires `mul` times faster for `time` s (the strongest wins). */
  rush?: { mul: number; time: number };
  /** Chance (0–1) that a hit does nothing at all («Era solo la caja»). They add up, to 0.5 at most. */
  shrug?: number;
  /** Chests per floor that open without a ticket (Llave Allen Sobrante). They add up. */
  freeChests?: number;
  /** When hurt, a ring of this many of its own bullets goes out from the toaster (the strongest wins). */
  hurtRing?: number;
  /**
   * Mascota Virtual: each combat room cleared without being hurt feeds it one level (up to `max`);
   * each level is `step` more damage (×(1 + step × level)); a hit takes it back to zero. The
   * strongest wins.
   */
  pet?: { step: number; max: number };
  /** Taza de Mejor Empleado: the player's bullets do this many times their damage while its life is full (the strongest wins). */
  fullHpDamage?: number;
  /**
   * Silla con Ruedas: walking grips the floor this much (0–1 of the normal acceleration and braking;
   * the slipperiest wins). It takes longer to stop and to turn.
   */
  grip?: number;
  /** Bola Antiestrés: the blink after a hit lasts this many times longer (the strongest wins). */
  hurtIframes?: number;
  /** Tarjeta de Fichar: a combat room cleared within this many seconds drops one more coupon (the longest wins). */
  punchIn?: number;
  /** Contrato en Prácticas: the item ends (and leaves the inventory) when the toaster goes up to the next floor. */
  trial?: boolean;
  /** Acreditación de Visitante: the shop charges this much less (0–1; the biggest wins). */
  discount?: number;
}

/** A number a modifier can change: the weapon's and the character's. */
export type StatKey =
  | 'damage'
  | 'fireRate'
  | 'magazine'
  | 'reloadTime'
  | 'spreadDeg'
  | 'bulletSpeed'
  | 'bulletLife'
  | 'bulletRadius'
  | 'knockback'
  | 'recoil'
  | 'pellets'
  | 'speed'
  | 'maxHp'
  | 'rollCooldown'
  | 'rollSpeed';

/** One change to a stat: `add` first (all modifiers summed), then `mul` (all multiplied). */
export interface StatChange {
  stat: StatKey;
  add?: number;
  mul?: number;
}

/**
 * Everything one source (an item, a synergy, a curse) does to the player: stat changes and
 * bullet behaviours. Several stack; taking one away undoes exactly what it did.
 */
export interface Modifier {
  id: string;
  stats?: StatChange[];
  bullets?: BulletBehaviour;
  perks?: Perks;
}

/**
 * A passive item: lying on a pedestal until the toaster walks onto it, then carried for the
 * rest of the run. All it does is its modifier (src/sim/mods.ts).
 */
export interface PassiveItemDef {
  id: string;
  /**
   * «buena»: only the premium chest gives it (and never the cardboard one), see docs/DISENO.md
   * «Economía». Unset: an ordinary one.
   */
  quality?: 'buena';
  /** 2 to 4 words (docs/DISENO.md). */
  name: string;
  /** One sentence, two at most, in the game's tone. */
  description: string;
  /** Texture key of its 16 x 16 sprite (tools/sprites/items.ts). */
  sprite: string;
  /** The first floor that can hand it out (1 if missing): a floor deals its own and the lower floors' items. */
  level?: number;
  /** What it does to the player; its id is the item's. */
  mod: Modifier;
}

/**
 * A synergy (src/data/synergies.ts): while the player carries every item in `items` (and has
 * `weapon` in its arsenal, if it names one), it gets `mod` too. With a weapon, `mod` only
 * changes that weapon's stats and bullets.
 */
export interface SynergyDef {
  id: string;
  /** 1 to 3 words, shown in the banner. */
  name: string;
  /** One sentence in the game's tone, under the name. */
  text: string;
  items: string[];
  weapon?: string;
  mod: Modifier;
}

/** What using an active item does (src/sim/world.ts useActive). */
export type ActiveEffect =
  /** Every enemy bullet (and whatever is in the air) vanishes. */
  | { type: 'clearFire' }
  /** Enemies, their bullets and their attacks stand still for `seconds` (they still take damage). */
  | { type: 'hold'; seconds: number }
  /** Gives back `amount` life (not usable at full life). */
  | { type: 'heal'; amount: number };

/**
 * An active item: the toaster carries one at a time and uses it with Q once it has `charges`
 * batteries (one per combat room cleared). Picking up another one leaves the old one on the floor.
 */
export interface ActiveItemDef {
  id: string;
  /**
   * «buena»: only the premium chest gives it (and never the cardboard one), see docs/DISENO.md
   * «Economía». Unset: an ordinary one.
   */
  quality?: 'buena';
  name: string;
  description: string;
  sprite: string;
  /** Batteries it needs to be used (and the most it holds). */
  charges: number;
  /** Used once and gone (it comes charged and never recharges). */
  singleUse?: boolean;
  effect: ActiveEffect;
}

export interface CharacterDef {
  id: string;
  name: string;
  description: string;
  maxHp: number;
  /** px/s */
  speed: number;
  /** px/s² while there is input. */
  accel: number;
  /** px/s² when the stick is released. */
  friction: number;
  rollSpeed: number;
  rollTime: number;
  /** Invulnerable for this long since the roll starts (s). */
  rollIframes: number;
  rollCooldown: number;
  startWeapon: string;
  /** Half size of the feet collision box (px). */
  footRadius: number;
}

export interface PropDef {
  id: string;
  name: string;
  /** Collision box relative to the prop position (bottom-centre of the sprite). */
  box: { x: number; y: number; w: number; h: number };
  blocksBullets: boolean;
  /**
   * Damage it takes before it blows up (M9b 13a): the player's bullets do their damage, an enemy
   * bullet one point, a blast next to it sets it off. Unset: it cannot be broken.
   */
  hp?: number;
  /** What it does when it blows up: `damage` to every enemy within `radius` px, `hurt` (half hearts) to the toaster. */
  blast?: { radius: number; damage: number; hurt: number };
  /**
   * Furniture that tips over with the interact button (M9b 13b). Standing, bullets fly over it;
   * on its side it stops the bullets coming at its top (and lets through the ones going away, so
   * the toaster can shoot from behind it). `hp`: what it stands (an enemy bullet one point, the
   * player's their damage) before it breaks; a blast next to it breaks it at once.
   */
  tip?: { hp: number };
}

export interface DummyDef {
  id: string;
  name: string;
  description: string;
  /** Hit box relative to the feet position. */
  hurt: { x: number; y: number; w: number; h: number };
  /** Collision box for movement (feet). */
  box: { x: number; y: number; w: number; h: number };
}

/** What a room is for on a floor (src/sim/floor.ts); `test` is the Sala de Pruebas. */
export type RoomKind = 'start' | 'combat' | 'treasure' | 'shop' | 'secret' | 'boss';

/**
 * Room templates are drawn as text. Legend:
 * `#` wall, `.` floor, `P` player start, `c` box, `b` barrel, `k` shopping cart, `v` a table that tips over, `M` training dummy,
 * `A` Aspirador Desahuciado, `O` Microondas Sin Seguro, `L` Bombilla de Bajo Consumo (con su polilla), `T` Batidora de Mano,
 * `Z` Mandos a Distancia (vienen en grupo: see EnemyDef.pack).
 * Slots, filled when a floor is built (src/sim/room.ts, fillTemplate): `e` an enemy (or nothing),
 * `o` an obstacle (or nothing), `*` an item pedestal, `$` the shopkeeper, `s` a shop shelf,
 * `J` the boss, `=` the long table of the Sala de Juntas (its bottom-centre). `1`–`9`: a group of shelving that stands or not with the seed (each digit on its own).
 * The Mostrador (hub, src/sim/room.ts): `m` a stretch of counter, `C` the counter with the Caja de
 * Devoluciones on it, `n` the ticket machine, `a` the filing cabinet, `h` the Chatarrero, `|` a
 * queue post, `B` the board and `t` the phone (both hang on the back wall over that tile) and `>`
 * the conveyor into the warehouse (stepping on it starts a run).
 * The top two rows are the back wall (shelves are painted on them).
 * Floor templates keep the four door openings (centre of each wall) and the two tiles in front
 * of them clear, so any template fits any set of doors.
 */
export interface RoomTemplate {
  id: string;
  name: string;
  rows: readonly string[];
  /** What the room is for on a floor; templates without one (the test room) never appear on a floor. `hub`: the Mostrador de Devoluciones, between runs. */
  kind?: RoomKind | 'hub';
  /** Seconds after the last enemy dies before the room's enemies come back (test room only). */
  restock?: number;
  /** Which floor of the store it belongs to (default 1). */
  level?: number;
  /** Combat rooms: the fight the layout is for, in a line (a design note, not shown in the game). */
  idea?: string;
}

/** One enemy that can fill an `e` slot: its template letter, how much of the room's budget it takes and how often it comes up. */
export interface SlotEnemy {
  ch: string;
  cost: number;
  weight: number;
  /** At most this many per room. */
  max?: number;
}

/** What an enemy leaves behind when it is taken apart. */
export interface LootDef {
  /** How many coupons it drops (random in this range, both included). */
  coupons: [number, number];
  /** Spare hearts it drops (each gives back a heart: 2 life). A boss's reward. */
  hearts?: number;
}

/**
 * Charges in a straight line: walks towards the player, warns (`telegraph` s, direction locked),
 * dashes at `chargeSpeed` for up to `chargeTime` s, then brakes for `recover` s. Hitting a wall
 * or a prop mid-charge stuns it for `stun` s.
 */
export interface ChargerBrain {
  kind: 'charger';
  walkSpeed: number;
  /** Only charges when the player is closer than this (px). */
  range: number;
  /** Seconds walking between charges (random in this range). */
  walkTime: [number, number];
  telegraph: number;
  chargeSpeed: number;
  chargeTime: number;
  /** Deceleration while braking (px/s²). */
  brake: number;
  recover: number;
  stun: number;
}

/**
 * Stands still and fires a pattern: every `interval` s (random in the range), if the player is
 * closer than `range`, it warns for `telegraph` s and then fires `pattern` (src/data/patterns.ts)
 * from `muzzleY` px above its feet.
 */
export interface TurretBrain {
  kind: 'turret';
  range: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  muzzleY: number;
  /** Seconds «switching on» when it appears, before its first attack (it flickers meanwhile). */
  startup?: number;
  /** If present, it walks between attacks to stay about `keep` px from the player. */
  walk?: { speed: number; keep: number };
  /**
   * If present, it jams: after `after` volleys (random in the range) it stands shaking for `time` s
   * without attacking (the opening), then clears the jam by firing `pattern` with `telegraph` s of
   * warning.
   */
  jam?: { after: [number, number]; time: number; pattern: string; telegraph: number };
}

/**
 * Flies around its owner (the enemy that brought it, see EnemyDef.escort) and now and then darts at
 * the player: `telegraph` s of fluttering on the spot, then `dartTime` s straight at where the player
 * was. Flies over props; only the room walls stop it. With no owner left it circles the player.
 */
export interface MothBrain {
  kind: 'moth';
  orbitRadius: number;
  /** Radians per second around the owner. */
  orbitSpeed: number;
  /** How fast it catches up with its place in the orbit (px/s). */
  flySpeed: number;
  /** Only darts when the player is closer than this to it (px). */
  range: number;
  /** Seconds between darts (random in this range). */
  interval: [number, number];
  telegraph: number;
  dartSpeed: number;
  dartTime: number;
  /** Height it flies at, for drawing (px above its shadow). */
  altitude: number;
}

/**
 * Chases the player on foot and, when close, lunges: `telegraph` s winding up on the spot (the
 * direction is locked when it starts), then `lungeTime` s at `lungeSpeed` straight at where the
 * player was, then `recover` s braking. Waits `cooldown` s (random in the range) between lunges.
 * Below `turbo.below` of its life it goes into TURBO: everything `turbo.scale` times faster.
 */
export interface ChaserBrain {
  kind: 'chaser';
  walkSpeed: number;
  /** Lunges when the player is closer than this (px). */
  range: number;
  cooldown: [number, number];
  telegraph: number;
  lungeSpeed: number;
  lungeTime: number;
  recover: number;
  /** Deceleration while braking (px/s²). */
  brake: number;
  turbo?: { below: number; scale: number };
}

/**
 * Never where you look for it: sidles around the player at `keep` px and, every `interval` s, warns
 * for `telegraph` s and fires `pattern`. After firing (and when hit, at most once every
 * `hitBlinkCooldown` s) it «switches off» like an old TV for `vanish` s and is gone for `gone` s
 * (the landing spot crackles with static meanwhile), then «switches on» `hop` px from the player,
 * preferably away from where the player is aiming. While gone it cannot hit or be hit.
 */
export interface BlinkerBrain {
  kind: 'blinker';
  walkSpeed: number;
  keep: number;
  range: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  muzzleY: number;
  vanish: number;
  gone: number;
  /** Distance from the player of the landing spot (random in this range). */
  hop: [number, number];
  hitBlinkCooldown: number;
}

/** One attack of a boss: a bullet pattern from its muzzle. */
export interface BossPatternAttack {
  kind: 'pattern';
  /** Name in src/data/patterns.ts. */
  pattern: string;
  telegraph: number;
  /** How often it is picked, relative to the phase's other attacks. */
  weight: number;
  /** Its relays (see BossPhase.relays) fire this pattern at the same time, from where they stand. */
  relay?: string;
  /** It spins on the spot while the bullets stream out (EnemyAnim.spin), instead of drifting. */
  spin?: boolean;
  /** Frame it strikes while it warns and throws (the Director with a card in his hand). */
  pose?: number;
}

/**
 * Lobs `count` balls of frost: one at the player and the rest `spread` px around it. Each flies
 * `flight` s (its landing spot is marked on the floor meanwhile), lands as a patch of frost of
 * radius `radius` that lasts `life` s and makes the player walk at `slow` of its speed, and
 * shatters into `shatter` (a pattern) if given.
 */
export interface BossFrostAttack {
  kind: 'frost';
  count: number;
  spread: number;
  flight: number;
  radius: number;
  life: number;
  slow: number;
  shatter?: string;
  telegraph: number;
  weight: number;
}

/**
 * Opens up and spits `count` expired products from `from` (px from its feet, facing right): they
 * fly `flight` s (give or take 25 %) to random spots up to `spread` px around the player (the
 * spots are marked meanwhile) and burst into `burst` (a pattern) where they land.
 */
export interface BossSpitAttack {
  kind: 'spit';
  count: number;
  spread: number;
  flight: number;
  from: { x: number; y: number };
  burst: string;
  telegraph: number;
  weight: number;
  /** What it throws, if not expired products: a sprite (the Director's dismissal letters, `carta-despido`). */
  look?: string;
  /** Frame it strikes while it warns and throws. */
  pose?: number;
}

/**
 * «Caídas de conexión»: marks `count` spots on the floor (one under the player, the rest up to
 * `spread` px around it) and, `telegraph` s later, each one fires `pattern` from the floor.
 */
export interface BossDropAttack {
  kind: 'drop';
  count: number;
  spread: number;
  pattern: string;
  telegraph: number;
  weight: number;
}

/**
 * «La pasarela»: it poses (`telegraph` s), then crosses the room from side to side at `speed` px/s,
 * along the clear lane nearest the player, and every `gap` px it walks it leaves a camera flash on
 * the floor that bursts into `pattern` `fuse` s later.
 */
export interface BossRunwayAttack {
  kind: 'runway';
  speed: number;
  gap: number;
  fuse: number;
  pattern: string;
  telegraph: number;
  weight: number;
}

/**
 * «Denegado»: it raises its own stamp (`telegraph` s, the pose) while `count` square shadows of
 * `ink` (one under the player, the rest up to `spread` px around it) blink on the floor; then each
 * comes down as a square of ink (as the Sello de Denegado's: no rolling in it), hurting whoever is
 * under it, and splashes `pattern`.
 */
export interface BossStampAttack {
  kind: 'stamp';
  count: number;
  spread: number;
  ink: { w: number; h: number; life: number; max: number };
  pattern: string;
  telegraph: number;
  weight: number;
  pose?: number;
}

export type BossAttack = BossPatternAttack | BossFrostAttack | BossSpitAttack | BossDropAttack | BossRunwayAttack | BossStampAttack;

/** A stage of a boss fight, with its own attacks. */
export interface BossPhase {
  /** Name shown when it starts (in the game's tone). */
  name: string;
  /** It starts when the boss has this fraction of its life left or less (1 for the first). */
  from: number;
  /** Its walking speed between attacks (px/s), and the distance it likes to keep from the player. */
  walkSpeed: number;
  keep: number;
  /** Seconds of rest between attacks (random in this range). */
  rest: [number, number];
  attacks: BossAttack[];
  /**
   * Relays (enemy `id`, see RelayBrain) it plants in the corners of the room when the phase starts
   * (`count`, in the corners farthest from the player); with `every`, whenever it has none left it
   * plants a new one each `every` s.
   */
  relays?: { id: string; count: number; every?: number };
  /**
   * The phase starts with a reboot instead of the usual short break: `time` s switched off, taking
   * no damage, its relays fall and `line` comes up over it.
   */
  reboot?: { time: number; line: string };
  /** What it shouts when the phase starts (over its head). */
  line?: string;
  /**
   * Helpers (enemy `id`) it calls when the phase starts: `count` of them, but never more than `max`
   * of its own standing at once. They come out next to it and fall when it falls.
   */
  summon?: { id: string; count: number; max: number };
  /** The number on the phase card, if not its place in the list (three sales, all of them phase 2). */
  stage?: number;
  /** Frame of the boss's badge (EnemyAnim.badge) in this phase: the price on the Muñeco's box. */
  badge?: number;
  /**
   * It sheds its shell when the phase starts: `prop` (a PropDef id) is left where it stood, as an
   * obstacle, and the boss steps out of it towards the player (the Muñeco's broken box).
   */
  shed?: { prop: string };
  /** It takes this many times the damage in this phase (1 if unset): out of its box, 1.25. */
  taken?: number;
  /**
   * From this phase on its frames are the same layout this many frames on (idle, walk and warn),
   * instead of EnemyAnim.phaseShift: the Muñeco out of its box.
   */
  frameShift?: number;
  /**
   * «Reestructuración»: when the phase starts and every `every` s after that, it claps and every
   * movable partition of the room (prop `prop`) is given a new place in its own quarter of the
   * room: marked for `warn` s with a dashed outline, then slid there in `time` s, pushing whoever
   * is in the way.
   */
  restructure?: { prop: string; every: number; warn: number; time: number };
}

/**
 * A floor boss: between attacks it never stands still (see `roam`); then it picks one of its
 * current phase's attacks (weighted, never the same twice in a row), warns standing still and fires
 * it from `muzzle` (px from its feet, facing right), drifting on while the bullets stream out.
 */
export interface BossBrain {
  kind: 'boss';
  muzzle: { x: number; y: number };
  phases: BossPhase[];
  /**
   * Its erratic walk between attacks: it circles the player in legs of `leg` s (random), each one
   * maybe the other way round, at the phase's `walkSpeed` times a random factor in `burst` (now a
   * stroll, now a lurch) and at `keep` px (± `spread`) from the player.
   */
  roam: { leg: [number, number]; burst: [number, number]; spread: number };
  /** Share of its speed it keeps while its bullets stream out (after the warning). */
  drift: number;
  /**
   * Rage: with no life left it would walk and recover (1 + rage) times faster; in between, in
   * proportion to the life it has lost.
   */
  rage: number;
}

/**
 * Lies on the floor passing for something else until the player comes within `wake` px (or hits
 * it), until it has waited `patience` s (a random time in that range), or until only bait is left:
 * no other kind of enemy is standing, and `alone` s have gone by since then. Then it jumps up
 * (`reveal` s), runs at the player and, within `range` px, gives a shock: `pattern` fired round itself with `telegraph` s of warning. Waits `cooldown` s between shocks.
 */
export interface MimicBrain {
  kind: 'mimic';
  wake: number;
  /** Most it waits before it gives up pretending (s, random in the range). */
  patience: [number, number];
  /** Once only bait (its own kind) is left in the room, it waits this long (s) and then jumps up. */
  alone: number;
  reveal: number;
  walkSpeed: number;
  range: number;
  telegraph: number;
  pattern: string;
  /** Height the shock comes from (px above its feet). */
  muzzleY: number;
  cooldown: [number, number];
}

/**
 * Lags: walks after the player for `walkTime` s, then freezes for `freeze` s (no signal) while
 * the spot it will jump to is marked, then appears there at once, up to `jump` px closer but never
 * nearer than `keep` px to the player, and clicks: `pattern` fired round itself. Then `recover` s
 * standing.
 */
export interface LaggerBrain {
  kind: 'lagger';
  walkSpeed: number;
  walkTime: [number, number];
  freeze: number;
  jump: number;
  keep: number;
  pattern: string;
  muzzleY: number;
  recover: number;
}

/**
 * Watches and tells on you: keeps about `keep` px from the player (walking at `walkSpeed`) and,
 * every `cooldown` s, if it sees the player (clear line, closer than `range`), records for `focus`
 * s (its `pattern` is the warning). If the player hides behind something meanwhile, the recording
 * is lost. If not, it «shares its screen»: every other enemy in the room ends its wait and attacks
 * now, and for `rush.time` s its waits run `rush.scale` times faster; the webcam fires its
 * `pattern` (the flash). Then `recover` s standing.
 */
export interface WatcherBrain {
  kind: 'watcher';
  walkSpeed: number;
  keep: number;
  range: number;
  cooldown: [number, number];
  focus: number;
  pattern: string;
  muzzleY: number;
  recover: number;
  rush: { time: number; scale: number };
}

/**
 * A boss's relay: it stands where it was planted, does nothing by itself and fires its owner's
 * relayed attacks (BossPatternAttack.relay) from `muzzleY` px above its feet. It falls when its
 * owner goes down.
 */
export interface RelayBrain {
  kind: 'relay';
  muzzleY: number;
}

/**
 * A wind-up toy: while wound it runs in a straight line at `speed` and bounces off walls and props
 * like a billiard ball (never straight along an axis: at least `minSlant` of its direction goes
 * each way), firing `pattern` at the player on each bounce (not twice within `bounceGap` s). After
 * `run` s (random in the range) it runs down: `rundown` s stopped dead, taking `exposed` times the
 * damage; the last `windup` s of them it winds itself up again (the key turns, and it can be heard),
 * and sets off again towards the player give or take `aimJitterDeg`. It starts winding up.
 */
export interface WindupBrain {
  kind: 'windup';
  speed: number;
  run: [number, number];
  rundown: number;
  windup: number;
  exposed: number;
  pattern: string;
  bounceGap: number;
  minSlant: number;
  aimJitterDeg: number;
  muzzleY: number;
}

/**
 * A remote-control car: circles the player at about `orbit` px, flat out (`speed`), steering to a
 * point `leadDeg` further round its circle but turning at most `turnDeg` per second (so it drifts
 * in arcs). After `ramAfter` s (random in the range), as soon as it has the player to its side
 * (within `sideDeg` of square to where it goes) and closer than `range`, it brakes and aims
 * (`telegraph` s, direction locked) and rams in a straight line at `ramSpeed` for up to `ramTime`
 * s; into a wall or a prop, it overturns for `flip` s; if not, `recover` s braking. «Batteries not
 * included»: every `stall.every` s it stops mid-arc for `stall.time` s, flickering.
 */
export interface RcCarBrain {
  kind: 'rccar';
  speed: number;
  orbit: number;
  leadDeg: number;
  turnDeg: number;
  ramAfter: [number, number];
  sideDeg: number;
  range: number;
  telegraph: number;
  ramSpeed: number;
  ramTime: number;
  flip: number;
  recover: number;
  brake: number;
  stall: { every: [number, number]; time: number };
}

/**
 * A paper shredder (M10 planta 4 (4a)): walks at `speed` along where it faces, turning towards the
 * player at most `turnDeg` °/s. Player bullets that come at it within `frontDeg` / 2 of its front
 * are swallowed (no damage) and every `spitEvery` swallowed it fires `pattern` back at the player;
 * within `frontDeg` / 2 of its back they hit `backMul` times as hard. Every `lungeEvery` s (random
 * in the range), with the player closer than `range` and in front, it warns `telegraph` s and lunges
 * `lungeTime` s at `lungeSpeed` towards it, then brakes `recover` s.
 */
export interface ShredderBrain {
  kind: 'shredder';
  speed: number;
  turnDeg: number;
  frontDeg: number;
  backMul: number;
  spitEvery: number;
  pattern: string;
  muzzleY: number;
  lungeEvery: [number, number];
  range: number;
  telegraph: number;
  lungeSpeed: number;
  lungeTime: number;
  recover: number;
  brake: number;
}

/**
 * A surprise envelope: hops about (`hopTime` s in the air, up to `hopHeight` px, `hopDist` px a
 * hop, random in the range) trying to stay about `keep` px from the player, resting `rest` s on the
 * floor between hops. Every `volleyEvery` hops, if the player is closer than `range`, it fires
 * `pattern` from `muzzleY` with `telegraph` s of warning instead of hopping.
 */
export interface HopperBrain {
  kind: 'hopper';
  hopTime: number;
  hopHeight: number;
  hopDist: [number, number];
  keep: number;
  rest: [number, number];
  volleyEvery: number;
  range: number;
  telegraph: number;
  pattern: string;
  muzzleY: number;
}

/**
 * What comes out when it breaks (EnemyDef.surprise): one of these, by `weight`. `spawn`: `count`
 * enemies of that kind pop out; `coupons`: that many more coupons fly out. `line` floats over it.
 */
export interface SurpriseDef {
  weight: number;
  spawn?: { id: string; count: number };
  coupons?: number;
  line: string;
}

/**
 * A bucket of building pieces: a slow turret that keeps about `keep` px from the player (walking at
 * `speed`). Every `interval` s (random in the range), with the player closer than `range`, it lifts
 * its lid (`telegraph` s, standing still) and lobs `count` pieces in an arc (`flight` s each): one
 * where the player is heading, the rest up to `spread` px around. Each lands where a mark shows and
 * stays on the floor `life` s: stepping on one walking hurts (`damage`) and uses it up; rolling over
 * it does nothing, and a player bullet sweeps it away. `muzzleY`: height of its lid.
 */
export interface LobberBrain {
  kind: 'lobber';
  speed: number;
  keep: number;
  range: number;
  interval: [number, number];
  telegraph: number;
  count: number;
  spread: number;
  flight: number;
  life: number;
  damage: number;
  muzzleY: number;
}

/**
 * A floor photocopier (M10 planta 4 (4b)): a support enemy that keeps about `keep` px from the
 * player (walking at `speed`). Every `interval` s (random in the range) it lifts its lid and scans
 * (`telegraph` s, standing still, a green line to whom it copies: the nearest enemy that is not a
 * copy, a boss or another copier) and slides a copy of it out of its tray: the same enemy with
 * `copyLife` of its life, `copyPace` of its pace and no loot. At most `maxCopies` of its copies at
 * once; with nobody to copy (or full up) it prints `pattern` at the player instead. When it
 * breaks, its copies fade out and fall in `fade` s. `muzzleY`: height of its tray.
 */
export interface CopierBrain {
  kind: 'copier';
  speed: number;
  keep: number;
  interval: [number, number];
  telegraph: number;
  maxCopies: number;
  copyLife: number;
  copyPace: number;
  fade: number;
  pattern: string;
  muzzleY: number;
  recover: number;
}

/**
 * A DENEGADO rubber stamp (M10 planta 4 (4c)): hops towards the player like the envelope
 * (`hopTime` s in the air, up to `hopHeight` px, `hopDist` px a hop, resting `rest` s between), and
 * every `stampEvery` hops it stamps instead: it rises `slamHeight` px and glides over the player's
 * spot (no further than `reach` px) for `telegraph` s while a square shadow warns, drops in `drop`
 * s and leaves a square of ink (`ink.w` × `ink.h` px on the floor, `ink.life` s; at most `ink.max`
 * of its own at once). Caught under it: `damage`, and the stamp always splashes `pattern`. Inside
 * the ink the player cannot roll. Then `recover` s on the floor.
 */
export interface StamperBrain {
  kind: 'stamper';
  hopTime: number;
  hopHeight: number;
  hopDist: [number, number];
  rest: [number, number];
  stampEvery: number;
  reach: number;
  telegraph: number;
  slamHeight: number;
  drop: number;
  ink: { w: number; h: number; life: number; max: number };
  damage: number;
  pattern: string;
  recover: number;
}

/**
 * A portable air conditioner (M10 planta 4 (4d)): a heavy turret that crawls at `speed` to keep
 * about `keep` px from the player, its blowing direction turning towards the player at most
 * `turnDeg` °/s and swinging `sweepDeg` from side to side and back every `sweepTime` × 2 s. Its
 * cone of cold air (`coneDeg` wide, `range` long) pushes the player at `push` px/s and bends the
 * player's bullets out of it at `bendDeg` °/s. Every `interval` s (random in the range), with the
 * player in the cone, it warns `telegraph` s and blows `pattern` along the air from `muzzleY`.
 */
export interface BlowerBrain {
  kind: 'blower';
  speed: number;
  keep: number;
  turnDeg: number;
  sweepDeg: number;
  sweepTime: number;
  coneDeg: number;
  range: number;
  push: number;
  bendDeg: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  muzzleY: number;
}

export type EnemyBrain =
  | BlowerBrain | StamperBrain | CopierBrain | ShredderBrain | HopperBrain | LobberBrain | RcCarBrain | WindupBrain | RelayBrain | ChargerBrain | TurretBrain | MothBrain
  | ChaserBrain | BlinkerBrain | BossBrain | MimicBrain | LaggerBrain | WatcherBrain;

export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  hp: number;
  /** Texture key, and the point of the sprite that sits on the feet (px from its top-left). */
  sprite: string;
  anchor: { x: number; y: number };
  /** Hit box relative to the feet position. */
  hurt: { x: number; y: number; w: number; h: number };
  /** Half size of the feet collision box (px). */
  footRadius: number;
  /** Speed given to the player when it bumps into them (px/s). */
  contactPush: number;
  /** Life it takes from the player when it bumps into them (1 = half a heart). */
  contactDamage: number;
  /** How much a bullet's knockback moves it (0 = immovable). */
  knockbackScale: number;
  brain: EnemyBrain;
  loot: LootDef;
  /** Enemy id that always comes with this one (spawned next to it, owned by it). */
  escort?: string;
  /** When it breaks, one of these comes out (the surprise envelope). */
  surprise?: readonly SurpriseDef[];
  /** How many of it one spawn point brings (they come in groups). Default 1. */
  pack?: number;
  /** Bosses: the name card and motto of their entrance (shown big, in «Letra Pequeña»), and the line over the name. */
  boss?: { title: string; motto: string; subtitle?: string };
  /** Which frames of its sprite sheet to show standing and walking (see `enemyFrame`). */
  anim?: EnemyAnim;
}

/** Frames of an enemy's sprite sheet (indices). Frame 0 is always its rest pose. */
export interface EnemyAnim {
  /** Standing: cycled in time, `idleMs` each (breathing, beaters turning...). */
  idle: readonly number[];
  idleMs: number;
  /** Faster idle while it winds up or goes flat out (the mixer's beaters). */
  busyMs?: number;
  /** Walking: one frame every `stepPx` px moved, so the feet never slide on the floor. */
  walk?: readonly number[];
  stepPx?: number;
  /** Still switching on (turrets with `startup`): shown while the light flickers off. */
  off?: number;
  /** A boss clapping (state `roar`: between phases, and when it restructures the room). */
  clap?: number;
  /** Second boss phase: the same layout from this frame on (`idle`/`walk` + `phaseShift`). */
  phaseShift?: number;
  /** Frame shown while it warns (the wireless mouse frozen without signal). */
  warn?: number;
  /** Frames spread over its warning instead (the photocopier's light crossing the glass and back). */
  scan?: readonly number[];
  /** Frame shown while it recovers after attacking (the photocopier's copy sliding out). */
  out?: number;
  /**
   * A small sheet drawn over the body (the Muñeco's sale tag): its top-left at (x, y) of the frame,
   * mirrored with the body (the sheet itself is not flipped, so its text reads), on the frames
   * below `upTo`, `frameDy` px lower on some of them. Its frame is the phase's `badge`.
   */
  badge?: { sprite: string; x: number; y: number; w: number; upTo: number; frameDy?: Readonly<Record<number, number>> };
  /**
   * A boss spinning on the spot (BossPatternAttack.spin): these frames in turn, `spinMs` each, the
   * second half of them mirrored (front, side, back, other side).
   */
  spin?: readonly number[];
  spinMs?: number;
  /** Frames of a reboot (BossPhase.reboot), spread evenly over it. */
  reboot?: readonly number[];
  /** Mimics: the frame it shows lying in wait, and the one jumping up when found out. */
  lurk?: number;
  reveal?: number;
  /** Hoppers: the frame crouching before a hop, and the one in the air. */
  crouch?: number;
  jump?: number;
  /** Frame shown while stunned or run down (the wind-up robot with its key still). */
  stun?: number;
  /**
   * Enemies drawn from three sides (the shredder): the frames above are its side view, and the
   * same layout `front` frames on faces the camera (heading down) and `back` frames on faces away.
   */
  views?: { front: number; back: number };
  /** Jammed turrets: frames cycled every `jamMs` while it shakes. */
  jam?: readonly number[];
  jamMs?: number;
}
