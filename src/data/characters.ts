import type { CharacterDef } from './types.ts';

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
    look: { sheet: 'tostadora', w: 40, h: 41, feetX: 17.5, feetY: 36, spinY: 22 },
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
    look: { sheet: 'batidora-vaso', w: 40, h: 41, feetX: 18.5, feetY: 36, spinY: 22 },
    ability: { kind: 'blades', damage: 4, reach: 9, knockback: 150 },
  },
};
