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
};
