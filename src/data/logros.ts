// The achievements («Méritos del cliente», M14 (l1)): what the profile has to show, in any number
// of runs. Each one reads a single number from the profile (src/sim/achievements.ts says which and
// how far along it is), so the screen can draw «23/100» under it. Earned once, kept for good.
// Later (M14 (l3)) some of them will unlock weapons and items (the limited content the human asked
// for on 2026-10-30): the reward will go here, as data.

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
}

/** In the order the screen lists them: the first ones come on their own, the last ones cost. */
export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'primera-reclamacion', name: 'Primera reclamación', text: 'Causa baja por primera vez.', quip: 'Bienvenido al servicio postventa.', stat: 'downs', n: 1 },
  { id: 'venta-cruzada', name: 'Venta cruzada', text: 'Consigue una sinergia.', quip: '¿Le interesa también el seguro?', stat: 'synergies', n: 1 },
  { id: 'ascenso', name: 'Ascenso sin subida de sueldo', text: 'Limpia 10 plantas en total.', quip: 'Más planta, mismo convenio.', stat: 'floors', n: 10 },
  { id: 'ni-un-aranazo', name: 'Ni un arañazo en la caja', text: 'Vence a un jefe sin perder vida.', quip: 'Como recién salido de fábrica.', stat: 'flawless', n: 1 },
  { id: 'retirada', name: 'Retirada del mercado', text: 'Desmonta 100 de un mismo modelo.', quip: 'Fallo de fabricación confirmado.', stat: 'killsOfOne', n: 100 },
  { id: 'cliente-habitual', name: 'Cliente habitual', text: 'Termina 25 partidas.', quip: 'Ya le conocen en el mostrador.', stat: 'runs', n: 25 },
  { id: 'coleccionista', name: 'Coleccionista de letra pequeña', text: 'Encuentra 30 objetos distintos.', quip: 'Ha leído todas las condiciones. Nadie más.', stat: 'found', n: 30 },
  { id: 'arsenal', name: 'Arsenal de saldo', text: 'Lleva 6 armas distintas.', quip: 'Todas de exposición. Todas sin caja.', stat: 'weapons', n: 6 },
  { id: 'ahorrador', name: 'Ahorrador compulsivo', text: 'Acaba partidas con 300 cupones en total.', quip: 'Caducan mañana. Como todo.', stat: 'coupons', n: 300 },
  { id: 'cliente-fiel', name: 'Cliente fiel', text: 'Juega el reto del día 3 días seguidos.', quip: 'Le enviaremos más ofertas. Muchas más.', stat: 'dailyStreak', n: 3 },
  { id: 'montaje-expres', name: 'Montaje exprés', text: 'Limpia una planta en 4 minutos o menos.', quip: 'Sobraron tornillos. Siempre sobran.', stat: 'fastFloor', n: 240 },
  { id: 'incidencia-cerrada', name: 'Incidencia cerrada', text: 'Gana una partida.', quip: 'Sin resolver. Pero cerrada.', stat: 'victories', n: 1 },
  { id: 'hoja-completa', name: 'Hoja de reclamaciones completa', text: 'Vence a los 5 jefes de planta.', quip: 'Por duplicado. Y con sello.', stat: 'bosses', n: 5 },
  { id: 'siniestro-total', name: 'Siniestro total', text: 'Causa baja 50 veces.', quip: 'Ya tiene ficha en el desguace.', stat: 'downs', n: 50 },
  { id: 'punto-limpio', name: 'Punto limpio', text: 'Desmonta 1000 electrodomésticos.', quip: 'El reciclaje empieza por uno mismo.', stat: 'kills', n: 1000 },
  { id: 'pack-ahorro', name: 'Pack ahorro', text: 'Consigue 8 sinergias distintas.', quip: 'Lleve tres, pague cuatro.', stat: 'synergies', n: 8 },
  { id: 'como-nuevo', name: 'Estado: como nuevo', text: 'Vence sin perder vida a 4 jefes distintos.', quip: 'Precintado. Nunca abierto.', stat: 'flawless', n: 4 },
  { id: 'fin-garantia', name: 'Fin de la garantía', text: 'Llega al final de verdad.', quip: 'Lo que pasa en el taller, se queda en el taller.', stat: 'endings', n: 1 },
  { id: 'toda-la-gama', name: 'Toda la gama', text: 'Gana con los 5 productos.', quip: 'Catálogo completo. Garantía, ninguna.', stat: 'winners', n: 5 },
];

export const ACHIEVEMENT_IDS: readonly string[] = ACHIEVEMENTS.map((a) => a.id);
