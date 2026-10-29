// The shop: what its shelves sell, what it costs (in discount coupons) and what the till says.
// All visible text follows the humour guide in docs/DISENO.md.

/** What can be on a shop shelf. */
export type ShopGood = 'objeto' | 'activo' | 'arma' | 'corazon' | 'ticket';

/**
 * Price of each good, in coupons. A full floor gives about 40 coupons, so the shop sells two or
 * three things at most: buying is choosing.
 */
export const SHOP_PRICES: Record<ShopGood, number> = {
  objeto: 15,
  activo: 12,
  arma: 18,
  corazon: 6,
  ticket: 8,
};

/**
 * What the shelves hold, left to right: the next item of the floor's deck (a passive one; if
 * none is left, an active one; then a weapon), a spare heart and a ticket. More shelves go round.
 */
export const SHOP_SHELVES: readonly ('item' | 'corazon' | 'ticket')[] = ['item', 'corazon', 'ticket'];

/** Names shown over goods that are not items (these have their own). */
export const GOOD_NAMES = { corazon: 'Corazón de Recambio', ticket: 'Ticket de Compra' } as const;

/** The shopkeeper: a self-checkout till that runs the staff shop on its own. */
export const SHOPKEEPER = {
  name: 'Caja de Autocobro',
  /** When the toaster walks in. */
  greet: [
    'Bienvenido. Escanee sus productos. Yo le miro.',
    'Caja libre. La única que queda: despidieron a las otras.',
    'Pase, pase. Aquí no hay cola porque no hay nadie.',
  ],
  /** When something is bought. */
  thanks: [
    'Gracias por su compra. Su opinión no nos importa.',
    'Objeto inesperado en la zona de embolsado.',
    '¿Quiere el tique? Da igual, no se lo voy a dar.',
    'Compra registrada. Ha ganado cero puntos.',
  ],
  /** Not enough coupons. */
  poor: [
    'Saldo insuficiente. Pruebe a tener más.',
    'Cupones insuficientes. Llamando a un empleado... No hay.',
    'Su cupón ha sido rechazado. Usted también.',
  ],
  /** A spare heart with all its life. */
  full: 'Ya está entero. No le vendo nada que no necesite. Aún.',
  /** Every shelf empty. */
  soldOut: 'Agotado. Repondremos cuando sea rentable.',
} as const;
