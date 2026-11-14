import type { CharacterDef, CharacterLook } from './types.ts';

export const CHARACTERS: Record<string, CharacterDef> = {
  tostadora: {
    id: 'tostadora',
    name: 'Tostadora Reacondicionada',
    description: 'Garantía hasta el lunes. Duró hasta el martes. Quema una tostada de cada dos y no piensa disculparse.',
    maxHp: 6,
    speed: 100,
    accel: 1500,
    friction: 1900,
    rollSpeed: 175,
    rollTime: 0.42,
    rollIframes: 0.4,
    rollCooldown: 0.3,
    startWeapon: 'secador',
    footRadius: 5,
    // M14c (a4a): the new style, bigger (tools/sprites/tostadora.ts); the hitbox has not changed.
    // M14c (a4b): and its own frames after the eight (TOASTER_ANIM in tools/sprites/tostadora.ts).
    look: {
      sheet: 'tostadora', w: 40, h: 46, feetX: 22.5, feetY: 45, spinY: 26, hand: 'mano-tostadora', shadowRx: 12,
      anim: { walk: [8, 9, 10, 11, 12, 13], roll: [14, 15, 16, 17, 18, 19], shoot: 20, hurt: [21, 6], die: [22, 23] },
    },
    // «Una de cada dos»: a reload after spending half the magazine pops a slice (every second one burnt).
    ability: { kind: 'toast', damage: 1, burntMul: 2, speed: 230, life: 1.1, radius: 4, knockback: 60, minSpent: 0.5 },
  },
  /**
   * M13 (3): quick and fragile. Two hearts, faster on foot, a longer roll that comes back sooner
   * and blades that grind whatever the roll touches; her ice crusher does not reach far.
   */
  'batidora-vaso': {
    id: 'batidora-vaso',
    name: 'Batidora de Vaso',
    description: 'Comprada para una dieta de batidos que duró una semana. Motivo de la devolución: «no se usa». Tritura primero y pregunta después.',
    maxHp: 4,
    speed: 118,
    accel: 1700,
    friction: 2000,
    rollSpeed: 190,
    rollTime: 0.5,
    rollIframes: 0.48,
    rollCooldown: 0.26,
    startWeapon: 'picahielos',
    footRadius: 5,
    // M14c (a4c): the new style, bigger, with her own frames after the eight (BLENDER_ANIM in
    // tools/sprites/batidora-vaso.ts); the hitbox has not changed.
    look: {
      sheet: 'batidora-vaso', w: 40, h: 50, feetX: 20.5, feetY: 49, spinY: 22, hand: 'mano-batidora', shadowRx: 12,
      anim: { walk: [8, 9, 10, 11, 12, 13], roll: [14, 15, 16, 17, 18, 19], shoot: 20, hurt: [21, 6], die: [22, 23] },
    },
    ability: { kind: 'blades', damage: 4, reach: 9, knockback: 150 },
  },
  becario: {
    id: 'becario',
    name: 'El Becario Eterno',
    description: 'No es un electrodoméstico. Llegó en la caja del material de oficina y nadie firmó su baja. Aprende mucho. No cobra nada.',
    maxHp: 6,
    speed: 104,
    accel: 1500,
    friction: 1900,
    rollSpeed: 175,
    rollTime: 0.42,
    rollIframes: 0.4,
    rollCooldown: 0.3,
    startWeapon: 'grapadora',
    footRadius: 5,
    look: { sheet: 'becario', w: 40, h: 41, feetX: 17.5, feetY: 36, spinY: 22, hand: 'mano-becario' },
    // «Experiencia demostrable»: +4 % damage per room cleared unhurt (up to 6); a hit halves it.
    // «Sin remunerar»: half the coupons. (With +5 % up to 8 the bot won floor 1 a third more often
    // than with the toaster: the Grapadora already hits harder in its hands.)
    ability: { kind: 'merit', step: 0.04, max: 6, kept: 0.5, couponMul: 0.5 },
  },
  /**
   * M13 (4): slow and tough. Four hearts, the slowest on foot, a short and slow roll that comes
   * back late; her soleplate leaves a trail of steam that scalds whatever steps on it, and her
   * starch spray stiffens (slows) what it hits.
   */
  plancha: {
    id: 'plancha',
    name: 'Plancha de Vapor',
    description: 'Quemó el cuello de una camisa en una entrevista de trabajo. La culpa fue «de la plancha». No deja una arruga ni un enemigo.',
    maxHp: 8,
    speed: 80,
    accel: 1250,
    friction: 1700,
    rollSpeed: 150,
    rollTime: 0.36,
    rollIframes: 0.34,
    rollCooldown: 0.48,
    startWeapon: 'almidon',
    footRadius: 5,
    // M14c (a4c2): the new style, bigger, with her own frames after the eight (IRON_ANIM in
    // tools/sprites/plancha-vapor.ts); the hitbox has not changed.
    look: {
      sheet: 'plancha-vapor', w: 46, h: 43, feetX: 23.5, feetY: 42, spinY: 20, hand: 'mano-plancha', shadowRx: 15,
      anim: { walk: [8, 9, 10, 11, 12, 13], roll: [14, 15, 16, 17, 18, 19], shoot: 20, hurt: [21, 6], die: [22, 23] },
    },
    // «Suela caliente»: a puff of steam every 7 px walked, 1.2 s on the floor, 2 damage a second.
    ability: { kind: 'sole', every: 7, radius: 7, life: 1.2, damage: 0.5, tick: 0.25 },
  },
  /**
   * M13 (6): it charges walking and switches itself off standing still. Its notifications chase
   * whoever is nearest, so it can keep moving instead of aiming.
   */
  movil: {
    id: 'movil',
    name: 'Móvil Reacondicionado',
    description: 'Vendido «como nuevo» con la pantalla rajada y la batería al 1 %. Se carga andando. Si se para a pensar, se apaga.',
    maxHp: 6,
    speed: 100,
    accel: 1500,
    friction: 1900,
    rollSpeed: 175,
    rollTime: 0.42,
    rollIframes: 0.4,
    rollCooldown: 0.3,
    startWeapon: 'notificaciones',
    footRadius: 5,
    look: { sheet: 'movil', w: 40, h: 41, feetX: 17.5, feetY: 36, spinY: 22, off: 'movil-apagado' },
    // «Carga en movimiento»: a battery every 600 px walked in a fight. «Batería al 1 %»: 3 s still, 1 s off.
    ability: { kind: 'phone', chargeEvery: 600, idleTime: 3, offTime: 1 },
  },
};

/**
 * The classic character frame (40 × 41, feet at y 36): screens that place a character's picture
 * by hand (the title, the ending) were laid out for it. M14c (a4a) redraws the characters bigger,
 * so their sheets no longer share that frame.
 */
export const CLASSIC_FRAME = { w: 40, h: 41, feetY: 36 } as const;

/**
 * The origin that puts a character's picture where an origin of (ox, oy) put it in the classic
 * frame: centred the same way and with the feet at the same height. For a sheet still in the
 * classic frame it is (ox, oy) itself.
 */
export function classicOrigin(look: CharacterLook, ox: number, oy: number): { x: number; y: number } {
  const C = CLASSIC_FRAME;
  return { x: (look.w / 2 + ox * C.w - C.w / 2) / look.w, y: (look.feetY + oy * C.h - C.feetY) / look.h };
}
