import type { WeaponDef } from './types.ts';

export const WEAPONS: Record<string, WeaponDef> = {
  secador: {
    id: 'secador',
    name: 'Secador Mágnum 2200 W',
    description: 'Dispara aire caliente a presión. Despeina, quema y no cubre daños por mal uso.',
    fireRate: 6.5,
    magazine: 14,
    reloadTime: 1.1,
    spreadDeg: 4,
    bulletSpeed: 310,
    bulletLife: 1.1,
    damage: 1,
    bulletRadius: 3,
    recoil: 30,
    knockback: 60,
    pellets: 1,
  },
};
