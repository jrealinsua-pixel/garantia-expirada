import type { WeaponDef } from './types.ts';

/**
 * The toaster's arsenal. The Secador is the all-rounder; the Grapadora trades range and
 * accuracy for rate of fire and a long magazine; the Plancha is a shotgun of steam that only
 * works up close.
 */
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
    look: { sprite: 'arma-secador', bullet: 'bala-jugador', sound: 'disparo', shake: 0.0025 },
  },
  grapadora: {
    id: 'grapadora',
    name: 'Grapadora Táctica',
    description: 'Munición: grapas de la empresa. Ya se descontarán de tu nómina.',
    fireRate: 9,
    magazine: 24,
    reloadTime: 1.6,
    spreadDeg: 7,
    bulletSpeed: 400,
    bulletLife: 0.6,
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
    fireRate: 1.8,
    magazine: 6,
    reloadTime: 1.5,
    spreadDeg: 17,
    bulletSpeed: 280,
    bulletLife: 0.38,
    damage: 1,
    bulletRadius: 3,
    recoil: 95,
    knockback: 120,
    pellets: 5,
    look: { sprite: 'arma-plancha', bullet: 'bala-vapor', sound: 'vapor', shake: 0.006 },
  },
};

/** Weapons the toaster can find, in the order a floor hands them out (seeded shuffle). */
export const FINDABLE_WEAPONS: readonly string[] = ['grapadora', 'plancha'];
