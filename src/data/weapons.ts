import type { WeaponDef } from './types.ts';

/**
 * The toaster's arsenal (M7: real differences, measured with `node tools/armas.ts`). The Secador
 * hits hard per bullet, reaches furthest and is the most accurate, but deals the least per second;
 * the Grapadora is a hose of 1-damage staples (highest rate, long magazine, long reload, mid range);
 * the Plancha does 10 per pull from close up and nothing from afar (tiny magazine).
 */
export const WEAPONS: Record<string, WeaponDef> = {
  secador: {
    id: 'secador',
    name: 'Secador Mágnum 2200 W',
    description: 'Dispara aire caliente a presión. Despeina, quema y no cubre daños por mal uso.',
    fireRate: 2.6,
    magazine: 10,
    reloadTime: 1.2,
    spreadDeg: 3,
    bulletSpeed: 320,
    bulletLife: 1.1,
    damage: 2,
    bulletRadius: 3,
    recoil: 30,
    knockback: 60,
    pellets: 1,
    look: { sprite: 'arma-secador', bullet: 'bala-jugador', sound: 'disparo', shake: 0.003 },
  },
  grapadora: {
    id: 'grapadora',
    name: 'Grapadora Táctica',
    description: 'Munición: grapas de la empresa. Ya se descontarán de tu nómina.',
    fireRate: 11,
    magazine: 33,
    reloadTime: 2.2,
    spreadDeg: 7,
    bulletSpeed: 400,
    bulletLife: 0.55,
    damage: 1,
    bulletRadius: 2,
    recoil: 14,
    knockback: 25,
    pellets: 1,
    look: { sprite: 'arma-grapadora', bullet: 'bala-grapa', turn: true, sound: 'grapa', shake: 0.0015 },
  },
  plancha: {
    id: 'plancha',
    name: 'Plancha de Vapor Turbo',
    description: 'Vapor a tres bares. Quita las arrugas, la pintura y las ganas de reclamar. No planchar la ropa puesta.',
    fireRate: 1.3,
    magazine: 4,
    reloadTime: 1.7,
    spreadDeg: 18,
    bulletSpeed: 280,
    bulletLife: 0.36,
    damage: 2,
    bulletRadius: 3,
    recoil: 95,
    knockback: 120,
    pellets: 5,
    look: { sprite: 'arma-plancha', bullet: 'bala-vapor', sound: 'vapor', shake: 0.006 },
  },
};

/** Weapons the toaster can find, in the order a floor hands them out (seeded shuffle). */
export const FINDABLE_WEAPONS: readonly string[] = ['grapadora', 'plancha'];
