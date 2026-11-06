import type { WeaponDef } from './types.ts';

/**
 * The toaster's arsenal (M7: real differences, measured with `node tools/armas.ts`). The Secador
 * hits hard per bullet, reaches furthest and is the most accurate, but deals the least per second;
 * the Grapadora is a hose of weak staples (highest rate, long magazine, long reload, mid range);
 * the Plancha does 8 per pull from close up and nothing from afar (tiny magazine).
 * M9b (7): every base damage went down a fifth (2 → 1.6, 1 → 0.8): the human found the weapons
 * too strong. Damage numbers are no longer drawn, so they need not be whole.
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
    damage: 1.6,
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
    damage: 0.8,
    bulletRadius: 2,
    recoil: 14,
    knockback: 25,
    pellets: 1,
    look: { sprite: 'arma-grapadora', bullet: 'bala-grapa', turn: true, sound: 'grapa', shake: 0.0015 },
  },
  plancha: {
    id: 'plancha',
    quality: 'buena',
    name: 'Plancha de Vapor Turbo',
    description: 'Vapor a tres bares. Quita las arrugas, la pintura y las ganas de reclamar. No planchar la ropa puesta.',
    fireRate: 1.3,
    magazine: 4,
    reloadTime: 1.7,
    spreadDeg: 18,
    bulletSpeed: 280,
    bulletLife: 0.36,
    damage: 1.6,
    bulletRadius: 3,
    recoil: 95,
    knockback: 120,
    pellets: 5,
    look: { sprite: 'arma-plancha', bullet: 'bala-vapor', sound: 'vapor', shake: 0.006, swell: { from: 0.75, to: 1.35, fade: 0.45 } },
  },
  /**
   * M11 (6c2), Atención al Cliente: an arc of sound waves from close up that goes through every
   * enemy in front and shoves them all back. Wins at going through and pushing; loses on reach
   * (about the iron's, half the stapler's), damage per hit (the lowest) and rate (the slowest).
   */
  megafono: {
    id: 'megafono',
    level: 5,
    name: 'Megáfono de Reclamaciones',
    description: 'Para que le oigan en la ventanilla del fondo. No le van a atender antes, pero le van a oír.',
    fireRate: 1.25,
    magazine: 6,
    reloadTime: 1.5,
    spreadDeg: 26,
    bulletSpeed: 220,
    bulletLife: 0.48,
    damage: 0.7,
    bulletRadius: 4,
    recoil: 60,
    knockback: 140,
    pellets: 7,
    bullets: { pierce: 99 },
    look: { sprite: 'arma-megafono', bullet: 'bala-onda', turn: true, sound: 'megafono', shake: 0.005, swell: { from: 0.9, to: 1.8, fade: 0.6 } },
  },
};

/** Weapons the toaster can find, in the order a floor hands them out (seeded shuffle). */
export const FINDABLE_WEAPONS: readonly string[] = ['grapadora', 'plancha', 'megafono'];

/** The findable weapons floor `level` can hand out: its own and the lower floors' (like itemsUpTo). */
export function weaponsUpTo(level: number): string[] {
  return FINDABLE_WEAPONS.filter((id) => (WEAPONS[id]!.level ?? 1) <= level);
}
