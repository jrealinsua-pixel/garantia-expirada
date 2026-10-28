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
  },
};
