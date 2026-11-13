// The achievements («Méritos del cliente», M14 (l1)): what the profile has to show, in any number
// of runs. Each one reads a single number from the profile (src/sim/achievements.ts says which and
// how far along it is), so the screen can draw «23/100» under it. Earned once, kept for good.
// Some of them unlock a weapon or an item (M14 (l3), the limited content the human asked for on
// 2026-10-30): until the achievement is earned, its reward never turns up in chests, pedestals,
// shops or rare rooms (lockedContent; the world takes the list as WorldOptions.locked).

/**
 * What an achievement counts:
 * - runs, downs, floors, victories, endings, kills, coupons: the profile's totals.
 * - killsOfOne: the enemy type taken apart most often (bosses included).
 * - winners: different characters that have won the game.
 * - flawless: different bosses beaten without losing life after their entrance.
 * - synergies: different synergies ever switched on.
 * - found / weapons: different passive items / weapons ever carried.
 * - bosses: different floor bosses beaten (the Servicio Técnico's does not count: it has its own).
 * - dailyStreak: the longest run of daily challenges played on consecutive days.
 * - fastFloor: a floor cleared in `n` seconds or less (the only one where less is better).
 */
export type AchievementStat =
  | 'runs'
  | 'downs'
  | 'floors'
  | 'victories'
  | 'endings'
  | 'kills'
  | 'coupons'
  | 'killsOfOne'
  | 'winners'
  | 'flawless'
  | 'synergies'
  | 'found'
  | 'weapons'
  | 'bosses'
  | 'dailyStreak'
  | 'fastFloor';

export interface AchievementDef {
  id: string;
  /** In capitals on the screen (the font has no lowercase). */
  name: string;
  /** What to do, with the number in it. */
  text: string;
  /** The joke under it, once earned. */
  quip: string;
  stat: AchievementStat;
  n: number;
  /** What it lets into the loot for good, once earned: a findable weapon, passive or active item. */
  reward?: AchievementReward;
}

export interface AchievementReward {
  kind: 'arma' | 'objeto' | 'activo';
  id: string;
}

/** In the order the screen lists them: the first ones come on their own, the last ones cost. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'primera-reclamacion', name: 'Primera reclamación', text: 'Causa baja por primera vez.', quip: 'Bienvenido al servicio postventa.', stat: 'downs', n: 1,
    reward: { kind: 'objeto', id: 'garantia' } },
  { id: 'venta-cruzada', name: 'Venta cruzada', text: 'Consigue una sinergia.', quip: '¿Le interesa también el seguro?', stat: 'synergies', n: 1,
    reward: { kind: 'objeto', id: 'copia' } },
  { id: 'ascenso', name: 'Ascenso sin subida de sueldo', text: 'Limpia 10 plantas en total.', quip: 'Más planta, mismo convenio.', stat: 'floors', n: 10,
    reward: { kind: 'objeto', id: 'taza-empleado' } },
  { id: 'ni-un-aranazo', name: 'Ni un arañazo en la caja', text: 'Vence a un jefe sin perder vida.', quip: 'Como recién salido de fábrica.', stat: 'flawless', n: 1,
    reward: { kind: 'objeto', id: 'caja-vacia' } },
  { id: 'retirada', name: 'Retirada del mercado', text: 'Desmonta 100 de un mismo modelo.', quip: 'Fallo de fabricación confirmado.', stat: 'killsOfOne', n: 100,
    reward: { kind: 'arma', id: 'etiquetadora' } },
  { id: 'cliente-habitual', name: 'Cliente habitual', text: 'Termina 25 partidas.', quip: 'Ya le conocen en el mostrador.', stat: 'runs', n: 25,
    reward: { kind: 'objeto', id: 'bolsa-tela' } },
  { id: 'coleccionista', name: 'Coleccionista de letra pequeña', text: 'Encuentra 30 objetos distintos.', quip: 'Ha leído todas las condiciones. Nadie más.', stat: 'found', n: 30,
    reward: { kind: 'objeto', id: 'mascota-virtual' } },
  { id: 'arsenal', name: 'Arsenal de saldo', text: 'Lleva 6 armas distintas.', quip: 'Todas de exposición. Todas sin caja.', stat: 'weapons', n: 6,
    reward: { kind: 'objeto', id: 'hdmi' } },
  { id: 'ahorrador', name: 'Ahorrador compulsivo', text: 'Acaba partidas con 300 cupones en total.', quip: 'Caducan mañana. Como todo.', stat: 'coupons', n: 300,
    reward: { kind: 'objeto', id: 'tarjeta' } },
  { id: 'cliente-fiel', name: 'Cliente fiel', text: 'Juega el reto del día 3 días seguidos.', quip: 'Le enviaremos más ofertas. Muchas más.', stat: 'dailyStreak', n: 3,
    reward: { kind: 'objeto', id: 'cookies' } },
  { id: 'montaje-expres', name: 'Montaje exprés', text: 'Limpia una planta en 4 minutos o menos.', quip: 'Sobraron tornillos. Siempre sobran.', stat: 'fastFloor', n: 240,
    reward: { kind: 'objeto', id: 'llave-allen' } },
  { id: 'incidencia-cerrada', name: 'Incidencia cerrada', text: 'Gana una partida.', quip: 'Sin resolver. Pero cerrada.', stat: 'victories', n: 1,
    reward: { kind: 'objeto', id: 'cinco-estrellas' } },
  { id: 'hoja-completa', name: 'Hoja de reclamaciones completa', text: 'Vence a 5 jefes de planta distintos.', quip: 'Por duplicado. Y con sello.', stat: 'bosses', n: 5,
    reward: { kind: 'arma', id: 'megafono' } },
  { id: 'siniestro-total', name: 'Siniestro total', text: 'Causa baja 50 veces.', quip: 'Ya tiene ficha en el desguace.', stat: 'downs', n: 50,
    reward: { kind: 'objeto', id: 'poliza-riesgo' } },
  { id: 'punto-limpio', name: 'Punto limpio', text: 'Desmonta 1000 electrodomésticos.', quip: 'El reciclaje empieza por uno mismo.', stat: 'kills', n: 1000,
    reward: { kind: 'objeto', id: 'contenedor-amarillo' } },
  { id: 'pack-ahorro', name: 'Pack ahorro', text: 'Consigue 8 sinergias distintas.', quip: 'Lleve tres, pague cuatro.', stat: 'synergies', n: 8,
    reward: { kind: 'objeto', id: 'oferta-tres-dos' } },
  { id: 'como-nuevo', name: 'Estado: como nuevo', text: 'Vence sin perder vida a 4 jefes distintos.', quip: 'Precintado. Nunca abierto.', stat: 'flawless', n: 4,
    reward: { kind: 'objeto', id: 'plastico-protector' } },
  { id: 'fin-garantia', name: 'Fin de la garantía', text: 'Llega al final de verdad.', quip: 'Lo que pasa en el taller, se queda en el taller.', stat: 'endings', n: 1,
    reward: { kind: 'arma', id: 'soldador' } },
  { id: 'toda-la-gama', name: 'Toda la gama', text: 'Gana con los 5 productos.', quip: 'Catálogo completo. Garantía, ninguna.', stat: 'winners', n: 5,
    reward: { kind: 'arma', id: 'mando' } },
];

export const ACHIEVEMENT_IDS: readonly string[] = ACHIEVEMENTS.map((a) => a.id);

/**
 * The weapons and items still locked for a profile that has earned `earned` (achievement ids): the
 * rewards of every achievement not in it. Pass [] for a run without unlocks (the daily challenge).
 */
export function lockedContent(earned: readonly string[]): string[] {
  return ACHIEVEMENTS.filter((a) => a.reward && !earned.includes(a.id)).map((a) => a.reward!.id);
}
