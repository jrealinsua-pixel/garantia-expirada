// Typed content definitions. Adding content means adding data here, not touching the engine.

export interface WeaponDef {
  id: string;
  /**
   * «buena»: only the premium chest gives it (and never the cardboard one), see docs/DISENO.md
   * «Economía». Unset: an ordinary one.
   */
  quality?: 'buena';
  /** The first floor that can hand it out (1 if missing), like the items' (see weaponsUpTo). */
  level?: number;
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
  /**
   * Fires in bursts (the Etiquetadora): after `shots` shots at `fireRate`, it waits `pause` s more
   * before the next one; letting go of the trigger half way also waits it.
   */
  burst?: { shots: number; pause: number };
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
  /**
   * The bullet grows from `from` to `to` times its size over its life and fades out to `1 - fade`
   * of its alpha (the iron's steam, the megaphone's sound waves).
   */
  swell?: { from: number; to: number; fade: number };
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
  slow?: { mul: number; time: number; look?: 'starch' };
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
  /**
   * Cable de Teléfono Rizado: the bullet weaves from side to side as it flies, `amp` px either
   * way, `freq` times a second (the widest wins).
   */
  wave?: { amp: number; freq: number };
  /**
   * Etiquetadora de Precios: each bullet that hurts an enemy leaves a label stuck on it; the
   * `need`-th one in a row («Rebajado») goes off, `mul` times the bullet's damage to every enemy
   * within `radius` px of it (itself too), and the labels come off. Labels not added to for `time`
   * s peel off. The biggest multiplier wins.
   */
  tag?: { need: number; mul: number; radius: number; time: number };
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
  /** Pósit de Urgente: after each roll, the next shot does this many times its damage (the strongest wins). */
  urgent?: number;
  /**
   * Responder a Todos: a bullet that hits an enemy has `chance` (0–1) of splitting into `count`
   * small bullets with `mul` of its damage, each towards another enemy (the biggest chance wins).
   * The pieces never split again.
   */
  replyAll?: { chance: number; count: number; mul: number };
  /** Cadena de Correos: the Pósit's bullet always splits (Responder a Todos), and its pieces keep its double damage. */
  chain?: boolean;
  /** Pausa del Café: a combat room cleared with full life gives this many more batteries. They add up. */
  fullHpCharge?: number;
  /**
   * Tecla Almohadilla: the batteries a cleared room gives the active item are multiplied by this
   * (the halves are kept for the next room; the strongest wins).
   */
  chargeMul?: number;
  /**
   * Código Promocional Caducado: chance (0–1) that the chest a cleared combat room would leave has
   * expired and does not turn up (the biggest wins).
   */
  expiredChests?: number;
  /**
   * Número de Turno: the bullets do `start` times their damage on entering a room, and `step` more
   * for every `every` s the toaster stays in it, up to `max` (the highest max wins).
   */
  queue?: { start: number; step: number; every: number; max: number };
  /**
   * Contestador Automático: every `every` s, the next shot repeats itself `delay` s later from the
   * toaster, along the same line, with `mul` of its damage (the most frequent wins).
   */
  echo?: { every: number; delay: number; mul: number };
  /** Llamada Grabada: the enemy that hurts the toaster is marked for `time` s and takes `mul` times the damage of its bullets (the biggest wins). */
  recorded?: { time: number; mul: number };
  /**
   * Hoja de Reclamaciones: after a hit from an enemy, the next `shots` pulls of the trigger chase it
   * (every pellet turns towards it at `turnDeg` degrees per second, from any distance; the most shots win).
   */
  complaint?: { shots: number; turnDeg: number };
  /**
   * Ticket de Incidencia: the chasing bullets that hit a marked enemy do the mark's damage once
   * more on top, and open its mark again for its whole time.
   */
  escalate?: boolean;
  /** Buzón Lleno: the Contestador's played-back bullets go through this many more enemies (they add up). */
  echoPierce?: number;
  /**
   * Valoración de Cinco Estrellas: each combat room cleared unhurt gives a star; with `need`, the
   * toaster gets `hp` more maximum life (filled) and the count starts again; a hit wipes the stars.
   */
  stars?: { need: number; hp: number };
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
  /** How it is drawn (the render reads it; the simulation does not). */
  look: CharacterLook;
  /** Its own ability (M13): what makes it play differently. None needs a button of its own. */
  ability?: CharacterAbility;
}

/**
 * The Tostadora's «Una de cada dos»: when a reload that refilled at least `minSpent` of the
 * magazine ends, a slice of toast pops out towards where it aims, going through every enemy in
 * its way. Every second one comes out burnt: `burntMul` times the damage, and its smoke wipes out
 * the enemy bullets it touches.
 */
export interface ToastAbility {
  kind: 'toast';
  damage: number;
  burntMul: number;
  /** px/s, and seconds it flies. */
  speed: number;
  life: number;
  radius: number;
  knockback: number;
  /** Share of the magazine that must have been spent for the reload to pop one (0 to 1). */
  minSpent: number;
}

/**
 * The Batidora de Vaso's «Giro de cuchillas» (M13 (3)): while rolling, every enemy (or dummy) its
 * body touches takes `damage` once per roll and is thrown back `knockback`, and the enemy bullets it
 * goes through are cut. `reach`: px round the body (its hurt circle) at which it touches.
 */
export interface BladesAbility {
  kind: 'blades';
  damage: number;
  reach: number;
  knockback: number;
}

/**
 * El Becario Eterno's «Experiencia demostrable» and «Sin remunerar»: every combat room cleared
 * without being hurt adds a point of experience (each one, `step` more damage, up to `max`); a hit
 * keeps only `kept` of them, rounded down («no se valora»). And the enemies leave it `couponMul`
 * of their coupons (the rest, carried over: exactly that share, with no dice).
 */
export interface MeritAbility {
  kind: 'merit';
  step: number;
  max: number;
  kept: number;
  couponMul: number;
}

/**
 * The Plancha de Vapor's «Suela caliente» (M13 (4)): every `every` px she walks (not while
 * rolling) she leaves a puff of steam on the floor, of radius `radius`, that lasts `life` s. An
 * enemy (or dummy) standing on one is scalded: `damage` at once and again every `tick` s while it
 * stays on the trail (`damage / tick` per second).
 */
export interface SoleAbility {
  kind: 'sole';
  every: number;
  radius: number;
  life: number;
  damage: number;
  tick: number;
}

/**
 * The Móvil Reacondicionado's «Carga en movimiento» and «Batería al 1 %» (M13 (6)). Only while a
 * fight is on (enemies in the room): every `chargeEvery` px walked put a battery into its active
 * item; and standing still for `idleTime` s (not walking nor rolling) switches it off for `offTime`
 * s, in which it neither moves, rolls, shoots nor reloads (bullets still hit it).
 */
export interface PhoneAbility {
  kind: 'phone';
  chargeEvery: number;
  idleTime: number;
  offTime: number;
}

export type CharacterAbility = ToastAbility | BladesAbility | MeritAbility | SoleAbility | PhoneAbility;

/**
 * A playable character's sprite sheet (public/assets/<sheet>.png). Every character's sheet has
 * the same eight frames, in this order: idle ×2 (0–1), walk ×4 (2–5, the roll spins frame 3),
 * hurt (6) and broken (7).
 */
export interface CharacterLook {
  sheet: string;
  /** Frame size (px). */
  w: number;
  h: number;
  /** Where the feet are in the frame (the body's position in the world). */
  feetX: number;
  feetY: number;
  /** Height in the frame of the point it spins around while rolling. */
  spinY: number;
  /** The texture of its floating front hand (default «mano», the toaster's grey glove). */
  hand?: string;
  /** A one-frame texture drawn instead of the sheet while it is switched off (the Móvil's battery). */
  off?: string;
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
  /**
   * Low furniture (the Centralita's low counters, M11 (2c2); boxes, drums, bargain tables and
   * trolleys, M14b (h7)): it blocks walking (and whatever `blocksBullets` says), but the toaster
   * jumps over it rolling (a roll that would end on top carries on until it is off).
   */
  low?: boolean;
  /**
   * Breaks into nothing when its `hp` is gone, instead of blowing up (the Nube's folders, M14 (j3)),
   * and only the toaster's bullets wear it.
   */
  crumble?: boolean;
  /**
   * A prop that gives electric shocks while there is a fight in the room (the Regleta Sobrecargada,
   * M14b (h11a1)): every `every` s it crackles for `warn` s (its reach lit on the floor) and then
   * zaps everything within `radius` px: `damage` to enemies (and dummies), `hurt` half hearts to
   * the toaster unless it is rolling (in the air, off the floor).
   */
  zap?: { every: number; warn: number; radius: number; damage: number; hurt: number };
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

/**
 * What a room is for on a floor (src/sim/floor.ts); `test` is the Sala de Pruebas. `rare`: a room
 * that comes up only now and then (M14 (r2)), on a spare dead end: the Oficina de Financiación.
 */
export type RoomKind = 'start' | 'combat' | 'treasure' | 'shop' | 'secret' | 'boss' | 'rare';

/**
 * Room templates are drawn as text. Legend:
 * `#` wall, `.` floor, `P` player start, `c` box, `b` barrel, `k` shopping cart, `v` a table that tips over, `M` training dummy,
 * `A` Aspirador Desahuciado, `O` Microondas Sin Seguro, `L` Bombilla de Bajo Consumo (con su polilla), `T` Batidora de Mano,
 * `Z` Mandos a Distancia (vienen en grupo: see EnemyDef.pack).
 * Slots, filled when a floor is built (src/sim/room.ts, fillTemplate): `e` an enemy (or nothing),
 * `o` an obstacle (or nothing), `*` an item pedestal, `$` the shopkeeper, `s` a shop shelf,
 * `J` the boss, `=` the long table of the Sala de Juntas (its bottom-centre), `~` and `!` the Centralita's low
 * counters (the middle of a long one, the bottom of an upright one). `1`–`9`: a group of shelving that stands or not with the seed (each digit on its own).
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
  /**
   * Walls it bounces off in one charge before it stops (M14b (h9a)): it hits the wall, turns like
   * a billiard ball and goes on charging, `reboundTime` s more each time. Without it, the first
   * wall stuns it.
   */
  rebound?: number;
  reboundTime?: number;
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
   * If present (M14b (h9c)), between attacks it walks at `speed` px/s to the player's reflection
   * across the middle of the room (as in the glass of its door): come closer and it backs off,
   * go left and it goes right. Only near the middle do you meet.
   */
  mirror?: { speed: number };
  /**
   * If present (M14b (h9a)), it never stops drifting: in a slanted straight line at `speed` px/s,
   * bouncing off walls and furniture like a ball, also while it warns and fires.
   */
  drift?: { speed: number };
  /**
   * If present (M14b (h9b)), it runs from side to side like a print head on its rail: only along
   * x, at `speed` px/s, turning back at walls and furniture; it stops to fire.
   */
  carriage?: { speed: number };
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
  /**
   * Lunges in a row (M14b (h9a)): after the first, `chain - 1` more, each re-aimed at the player
   * with only `chainTelegraph` s of warning. A burst, not a lunge.
   */
  chain?: number;
  chainTelegraph?: number;
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
  /**
   * «Diagnóstico» (the Trituradora, M12 (4a)): during the warning a scanner beam sweeps the toaster
   * (event `scan`) and this line comes up over the boss: what it has diagnosed.
   */
  scan?: string;
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
  /**
   * Not frost but a label (this sprite) stuck on the floor where it lands: the same slowing patch,
   * drawn as the label (the Trituradora's «APTO», M12 (4c)).
   */
  sticker?: string;
  /** Frame of the boss's sheet while it warns (as BossPatternAttack.pose). */
  pose?: number;
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

/**
 * «Lluvia en columnas» (the Nube de Almacenamiento, M14 (j3)): `cols` lanes of the room, one over
 * the player and the rest at least `gap` px apart, are marked from the back wall down (`telegraph`
 * s); then each lets `pattern` (aimed straight down) fall from the back wall. Furniture in a lane
 * shelters whoever is under it.
 */
export interface BossRainAttack {
  kind: 'rain';
  cols: number;
  gap: number;
  pattern: string;
  telegraph: number;
  weight: number;
}

/**
 * «Almacenamiento lleno» (the Nube, M14 (j3)): `count` folders (prop `prop`, with its `hp`) drop
 * out of it in a wall across the way between it and the player, `dist` of the way to the player;
 * they stop bullets (the toaster's too) and walking until they are shot to bits, and are gone
 * anyway after `life` s. Its own bullets do not wear them. Warned like frost (`telegraph` s).
 */
export interface BossFolderAttack {
  kind: 'folders';
  count: number;
  prop: string;
  life: number;
  dist: number;
  telegraph: number;
  weight: number;
}

/**
 * «Sincronizando…» (the Nube, M14 (j3)): it stops and fills a bar for `time` s; if it fills, it
 * lets `pattern` out all round. If the toaster hurts it by `cancel` meanwhile, the bar breaks:
 * «Error de sincronización», and it is stunned for `stun` s (frame EnemyAnim.stun).
 */
export interface BossSyncAttack {
  kind: 'sync';
  time: number;
  cancel: number;
  pattern: string;
  stun: number;
  weight: number;
}

/**
 * «Cajas de botín» (the Consola Edición Coleccionista, M14 (j4)): it warns (`telegraph` s, like a
 * pattern) and tosses out `count` helpers (enemy `id`) at `toss` px/s to its sides and towards the
 * player, never leaving more than `max` of its helpers standing at once (counting what came out of
 * them). They are its own (owner), and fall with it.
 */
export interface BossSummonAttack {
  kind: 'summon';
  id: string;
  count: number;
  max: number;
  toss: number;
  telegraph: number;
  weight: number;
}

/** What every boss attack can carry besides its own fields. */
export interface BossAttackCommon {
  /**
   * «Pase de temporada» (BossPhase.seasons): picked only while the phase is in this season (its
   * index in `names`); without it, in every season.
   */
  season?: number;
}

export type BossAttack = (
  | BossPatternAttack | BossFrostAttack | BossSpitAttack | BossDropAttack | BossRunwayAttack | BossStampAttack | BossMenuAttack
  | BossRainAttack | BossFolderAttack | BossSyncAttack | BossSummonAttack
) & BossAttackCommon;

/**
 * «Su llamada es importante» (the Centralita's voice menu, M11 (5b)): `zones` numbered zones light
 * up on the floor in a line through the player (one of them under it), while it reads the menu out
 * (`telegraph` s); then it says which one to press (the farthest from the player `far` of the
 * times, else any) and `wait` s later bullets rain on all the others: `drops` bursts of `pattern`
 * spread over each wrong zone, from the floor.
 */
export interface BossMenuAttack {
  kind: 'menu';
  zones: number;
  wait: number;
  drops: number;
  pattern: string;
  far: number;
  telegraph: number;
  weight: number;
}

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
  /**
   * «Le paso con el departamento» (the Centralita, M11 (5b)): the room is four departments (its
   * quarters, see departmentOf in src/sim/enemies.ts). `first` s after the phase starts and every
   * `every` s after that a bell rings and a circle marks the toaster; `mark` s later it is put
   * through to another department (a free spot in it, away from the boss), with `grace` s of
   * invulnerability, and that department's `welcome` pattern (one per department, 1-4) is fired at
   * it from the department's far corner, with `warn` s of warning. Every `recall` transfers, if
   * its helper (BossPhase.summon) is down, it calls it again.
   */
  transfer?: { first: number; every: number; mark: number; grace: number; welcome: readonly string[]; warn: number; recall?: number };
  /**
   * A pattern (src/data/patterns.ts) it lets out all round itself as the phase starts, at the end
   * of the break: the Centralita tearing her plugs out (M11 (5c)).
   */
  opening?: string;
  /**
   * «Se queda muda» (the Centralita's phase 3, M11 (5c)): every `every` s (random in the range;
   * once due, it waits for the attack it is doing to end) it stops dead for `time` s, attacking nothing (state `stun`, frame
   * EnemyAnim.stun), and takes `taken` times the damage meanwhile: the moment to hit it.
   */
  mute?: { every: [number, number]; time: number; taken: number; line?: string };
  /**
   * Its own frames from this phase on (instead of shifting the usual ones, BossPhase.frameShift),
   * when the phase has fewer of them: the Centralita without her plugs, two to drag herself.
   */
  look?: { idle: readonly number[]; walk: readonly number[]; warn: number };
  /**
   * Its attacks go in the order of the list, one per turn, and round again (instead of weighted
   * at random): the Trituradora answering with each fallen boss in turn (M12 (4a)).
   */
  cycle?: boolean;
  /**
   * «Despiece» (the Trituradora, M12 (4b)): as the phase starts the whole floor becomes a conveyor
   * belt (src/sim/conveyors.ts) running at `speed` px/s towards the side wall farthest from the
   * player. The boss goes over to that wall (at `move` times its walking speed, attacking nothing
   * on the way) and from then on rides up and down along it, its hopper over the end of the belt.
   * The last `bite` px of the belt are the intake rollers: they hurt like the boss's touch and throw
   * the toaster back down the belt. The belt keeps running in the phases after this one.
   */
  belt?: { speed: number; bite: number; move: number };
  /**
   * «Control de calidad» (the Trituradora, M12 (4c)): stacks of crates (prop `prop`, one per tile)
   * come down and close the room bit by bit, from the side wall farthest from the boss inwards: a
   * half column at a time (the top half, then the bottom one), the first `first` s after the phase
   * starts and then every `every` s, each marked on the floor `warn` s before it lands. Whoever is
   * under one when it lands takes `hurt` and is thrown out towards the boss. At most `cols` columns.
   */
  crates?: { prop: string; first: number; every: number; warn: number; hurt: number; cols: number };
  /**
   * «Pase de temporada» (the Consola, M14 (j4)): the phase goes through seasons, `every` s each, in
   * turn and round again (the first as the phase starts, after its break); each attack with a
   * `season` is only picked in its own. Every new season is announced with its name (event `season`).
   */
  seasons?: { every: number; names: readonly string[] };
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
  /**
   * If present (M14b (h9b)), it only moves when you are not looking (your aim more than `cone`
   * degrees away from it): then it sneaks at `speed` px/s to a spot `keep` px behind your back.
   * Looked at, it freezes.
   */
  shy?: { cone: number; speed: number };
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
 * enemies of that kind pop out; `coupons`: that many more coupons fly out; `pattern`: bullets. `line` floats over it.
 */
export interface SurpriseDef {
  weight: number;
  spawn?: { id: string; count: number };
  coupons?: number;
  /** A pattern (src/data/patterns.ts) fired at the player from where it broke (the fake coupons). */
  pattern?: string;
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
  /**
   * If present (M14b (h9c)), instead of keeping its distance it follows in your footsteps: it
   * walks at `speed` px/s along the exact path the player took, `delay` s behind.
   */
  follow?: { delay: number; speed: number };
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
  /**
   * If present (M14b (h9d)), instead of keeping its distance it hides behind the others: it walks
   * at `speed` px/s to the spot `gap` px behind the nearest other enemy, on the far side from the
   * player, so that one takes the shots meant for it. With nobody to hide behind, it keeps its distance.
   */
  hide?: { speed: number; gap: number };
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
  /**
   * If present (M14b (h9d)), its hose is plugged into the nearest wall where it appears (the
   * window it blows its heat out of) and it can go no further than `reach` px from that plug
   * (more, if it appeared further out): it slides along that circle at `speed` px/s to the point
   * nearest the player, never closer than `keep`. Like a dog on its chain: outside its reach, it
   * cannot follow you; inside, it comes quick.
   */
  hose?: { reach: number; speed: number };
}

/**
 * The ticket dispenser (M11 (4a)): a slow support enemy that keeps about `keep` px from the player
 * (walking at `speed`). Every `interval` s (random in the range) it calls a turn (`call` s, its
 * calling pose): a circle of `radius` px lights up on the floor `near`–`far` px from the player,
 * somewhere it can walk to in time, with a number on it; the player has `countdown` s to get its
 * feet into it. In time («Atendido»), nothing happens, and the circle stops enemy bullets for
 * `served` more s. Late («Turno perdido»), the circle goes red for `lost` s and it spits
 * `punish` at the player after `telegraph` s. With no turn on, every `between` s it lets go of
 * `pattern` (slow paper tickets that glide) if the player is closer than `range`. `muzzleY`: height of its slot.
 */
export interface TurnerBrain {
  kind: 'turner';
  speed: number;
  keep: number;
  range: number;
  interval: [number, number];
  call: number;
  radius: number;
  near: number;
  far: number;
  countdown: number;
  served: number;
  lost: number;
  telegraph: number;
  punish: string;
  between: [number, number];
  pattern: string;
  muzzleY: number;
}

/**
 * The queue posts (M11 (4b)): they come as a pair (EnemyDef.pack 2) and stretch their tape between
 * them, a line the player cannot cross walking or rolling (bullets go through). Each walks at
 * `speed` to its end of a line `gap` px from the player, on the pair's side, `spread` px long
 * (the longest of the range); with the player in the middle of it and closer than `squeeze` px
 * the tape is tense: it shortens to the shortest of `spread` and pushes the player away at `push`
 * px/s (it makes it queue). They never stand more than `tether` px apart. Every `interval` s the
 * nearer of the two lets go of `pattern` (a short ring of steel balls) after `telegraph` s; one
 * broken, the tape snaps back into the other (`snap` s, its released pose) and it fires every
 * `alone` s instead, keeping about `keep` px. `muzzleY`: height of the tape drum.
 */
export interface QueuerBrain {
  kind: 'queuer';
  speed: number;
  gap: number;
  spread: [number, number];
  squeeze: number;
  push: number;
  tether: number;
  interval: number;
  alone: number;
  keep: number;
  snap: number;
  telegraph: number;
  pattern: string;
  muzzleY: number;
}

/**
 * The virtual assistant (M11 (4c)): keeps about `keep` px from the player (walking at `speed`,
 * round things, and closer if something stands between them). Every `interval` s (random in the
 * range) it types (`telegraph` s) and sends `pattern`: speech bubbles that stop halfway and set off
 * again towards where the player is going. It learns: if its last `learn` hits all came from within
 * `sameDeg` of each other, its shield of frequently asked questions goes up facing them for
 * `shield` s and stops whatever comes within `shieldArc` (degrees, the whole arc) of that side.
 * When it breaks it sends `farewell` (the «¿Le he ayudado?» buttons). `muzzleY`: height of its screen.
 */
export interface ChatbotBrain {
  kind: 'chatbot';
  speed: number;
  keep: number;
  interval: [number, number];
  telegraph: number;
  pattern: string;
  learn: number;
  sameDeg: number;
  shield: number;
  shieldArc: number;
  farewell: string;
  muzzleY: number;
}

/**
 * The reception phone (M11 (4d)): hops about like the hoppers (`hopTime`, `hopHeight`, `hopDist`,
 * to about `keep` px from the player, resting `rest` s between hops). Every `volleyEvery` hops,
 * with the player within `range`, it attacks, by turns: it rings (`telegraph` s of warning, then
 * `rings`: a sequence of small rings, one per ring of the bell) or it calls (`call`: one fat bullet
 * that homes in a little). Once it has lost `transferAt` of its life, the next hit it takes «passes
 * you on to a colleague»: for `transferWarn` s a dotted line joins it to the other enemy farthest
 * from the player and then they swap places; at most once every `transferEvery` s. With nobody to
 * pass you on to, it puts you on hold instead: `hold`, a ring of slow notes that wave about.
 * `muzzleY`: height of its keypad.
 */
export interface PhoneBrain {
  kind: 'phone';
  hopTime: number;
  hopHeight: number;
  hopDist: [number, number];
  keep: number;
  rest: [number, number];
  volleyEvery: number;
  range: number;
  telegraph: number;
  rings: string;
  call: string;
  transferAt: number;
  transferWarn: number;
  transferEvery: number;
  hold: string;
  muzzleY: number;
}

/**
 * A loot box (the Consola's, M14 (j4)): it lands where it was tossed and sits there glowing; the
 * last `shake` s of its `open` s it rattles (state `jam`), and then it opens by itself: what comes
 * out is drawn from EnemyDef.selfSurprise (the worst of it). Shot open before that, from its
 * `surprise`. It does not hurt to touch.
 */
export interface LootboxBrain {
  kind: 'lootbox';
  open: number;
  shake: number;
}

export type EnemyBrain =
  | LootboxBrain | PhoneBrain | ChatbotBrain | QueuerBrain
  | TurnerBrain | BlowerBrain | StamperBrain | CopierBrain | ShredderBrain | HopperBrain | LobberBrain | RcCarBrain | WindupBrain | RelayBrain | ChargerBrain | TurretBrain | MothBrain
  | ChaserBrain | BlinkerBrain | BossBrain | MimicBrain | LaggerBrain | WatcherBrain;

export interface EnemyDef {
  id: string;
  name: string;
  description: string;
  hp: number;
  /**
   * The Servicio Técnico's own machines (M12 (3c)): drawn with their own colours on floor 6, not
   * grey and stickered like the reconditioned enemies from the floors below.
   */
  workshop?: boolean;
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
  /** What comes out instead when it opens by itself, not shot (a loot box, LootboxBrain). */
  selfSurprise?: readonly SurpriseDef[];
  /** How many of it one spawn point brings (they come in groups). Default 1. */
  pack?: number;
  /** Bosses: the name card and motto of their entrance (shown big, in «Letra Pequeña»), and the line over the name. */
  boss?: { title: string; motto: string; subtitle?: string };
  /** Which frames of its sprite sheet to show standing and walking (see `enemyFrame`). */
  anim?: EnemyAnim;
  /** false: a piece of a boss, not an enemy of its own (the Director's chair): left out of the glossary (M14). */
  glossary?: false;
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
  /** Frame shown while it punishes a turn missed (the ticket dispenser spitting, M11 (4a)). */
  spit?: number;
  /**
   * The other one of a pair (Enemy.alt) is drawn this many frames on: the same layout, a little
   * different (the queue post with the chipped base, M11 (4b)).
   */
  altShift?: number;
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
  /** Ringing (the reception phone): these frames in turn, `ringMs` each, while it rings. */
  ring?: readonly number[];
  /** Talking (the Centralita reading out her voice menu, putting you through): these frames in turn, `talkMs` each. */
  talk?: readonly number[];
  talkMs?: number;
  ringMs?: number;
  /** Passing you on to a colleague, or putting you on hold (the reception phone). */
  pass?: number;
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
  /**
   * A boss that rattles on its feet from boss phase `phase` on (the Lavadora's Centrifugado, M14 (j2)):
   * the sprite jumps `px` px about every `ms` ms (not while stopped, between phases or dying).
   */
  rattle?: { phase: number; px: number; ms: number };
  /** Jammed turrets: frames cycled every `jamMs` while it shakes. */
  jam?: readonly number[];
  jamMs?: number;
}
