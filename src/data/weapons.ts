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
  /**
   * M11 (6c1), Atención al Cliente: bursts of three sticky price labels. Every label that hurts
   * stays stuck on the enemy and the third one in a row on the same one, «Rebajado», goes off
   * round it. Wins on piling damage onto one (the only one that blows up); loses on damage per
   * label (half the dryer's), the shortest magazine in seconds and spreading over many (labels on
   * different enemies never add up).
   */
  etiquetadora: {
    id: 'etiquetadora',
    level: 5,
    name: 'Etiquetadora de Precios',
    description: 'Tres etiquetas y el precio baja solo. Ningún artículo rebajado admite devolución.',
    fireRate: 8,
    burst: { shots: 3, pause: 0.32 },
    magazine: 9,
    reloadTime: 1.3,
    spreadDeg: 4,
    bulletSpeed: 300,
    bulletLife: 0.75,
    damage: 0.85,
    bulletRadius: 2,
    recoil: 10,
    knockback: 15,
    pellets: 1,
    bullets: { tag: { need: 3, mul: 3.5, radius: 26, time: 3 } },
    look: { sprite: 'arma-etiquetadora', bullet: 'bala-etiqueta', turn: true, sound: 'etiqueta', shake: 0.0015 },
  },
  /**
   * M13 (3): the Batidora de Vaso's starting weapon. Bursts of frozen orange juice cubes, two a
   * pull: the most bullets in the air of all, but they melt before they get anywhere (about the
   * iron's reach), and they spread the widest of all.
   */
  picahielos: {
    id: 'picahielos',
    name: 'Picahielos Turbo',
    description: 'Cubitos de zumo de naranja, de dos en dos. Del zumo, solo el color: el resto es «sabor natural».',
    fireRate: 8,
    magazine: 17,
    reloadTime: 2,
    spreadDeg: 28,
    bulletSpeed: 300,
    bulletLife: 0.34,
    damage: 0.75,
    bulletRadius: 2,
    recoil: 12,
    knockback: 20,
    pellets: 2,
    look: { sprite: 'arma-picahielos', bullet: 'bala-cubito-zumo', sound: 'picahielos', shake: 0.0012 },
  },
  /**
   * M13 (4): the Plancha de Vapor's starting weapon. Short sprays of starch, two drops a pull,
   * that leave whatever they hit stiff (at three quarters of its pace for a second). Wins at slowing (no other
   * weapon does); loses on damage per second (the weakest of all, even under the Secador): her
   * damage is in the steam.
   */
  almidon: {
    id: 'almidon',
    // Once the Plancha is unlocked, others can find it from floor 3 up (weaponPool).
    level: 3,
    name: 'Pulverizador de Almidón',
    description: 'Almidón aroma «Brisa de Limón». Deja tieso a cualquiera. No huele a limón ni a brisa.',
    fireRate: 3.5,
    magazine: 10,
    reloadTime: 2,
    spreadDeg: 16,
    bulletSpeed: 240,
    bulletLife: 0.43,
    damage: 0.75,
    bulletRadius: 3,
    recoil: 18,
    knockback: 15,
    pellets: 2,
    bullets: { slow: { mul: 0.75, time: 1, look: 'starch' } },
    look: { sprite: 'arma-almidon', bullet: 'bala-almidon', sound: 'almidon', shake: 0.001, swell: { from: 0.8, to: 1.25, fade: 0.35 } },
  },
  /**
   * M13 (6): the Móvil Reacondicionado's starting weapon. Notifications nobody asked for: slow
   * little bubbles that chase the nearest enemy for two seconds. The only one that seeks, and the
   * slowest bullets of all (they take their time getting there, and can be outrun).
   */
  notificaciones: {
    id: 'notificaciones',
    // Once the Móvil is unlocked, others can find it from floor 2 up (weaponPool).
    level: 2,
    name: 'Notificaciones Push',
    description: 'Llegan aunque las desactives. Te encuentran aunque te escondas. «¿Permitir?» no era una pregunta.',
    fireRate: 3.2,
    magazine: 14,
    reloadTime: 1.5,
    spreadDeg: 12,
    bulletSpeed: 150,
    bulletLife: 2.2,
    // 1 a bubble and 12 a magazine: the bot won floor 1 18 % of the time (the toaster, 32 %), with
    // rooms 5 s slower; slow bullets that chase lose time getting there (tools/medir-personajes.ts).
    damage: 1.4,
    bulletRadius: 3,
    recoil: 10,
    knockback: 20,
    pellets: 1,
    bullets: { homing: { turnDeg: 260, time: 2.2, range: 150 } },
    look: { sprite: 'arma-notificaciones', bullet: 'bala-notificacion', sound: 'notificacion', shake: 0.001 },
  },
};

/** Weapons the toaster can find, in the order a floor hands them out (seeded shuffle). */
export const FINDABLE_WEAPONS: readonly string[] = ['grapadora', 'plancha', 'megafono', 'etiquetadora'];

/**
 * The findable weapons floor `level` can hand out: its own and the lower floors' (like itemsUpTo).
 * `extra` adds more (the starting weapons of unlocked characters, see weaponPool in
 * src/sim/world.ts) after them, once each and by the same floor rule.
 */
export function weaponsUpTo(level: number, extra: readonly string[] = []): string[] {
  const ids = [...FINDABLE_WEAPONS, ...extra.filter((id, i) => !FINDABLE_WEAPONS.includes(id) && extra.indexOf(id) === i && WEAPONS[id])];
  return ids.filter((id) => (WEAPONS[id]!.level ?? 1) <= level);
}
