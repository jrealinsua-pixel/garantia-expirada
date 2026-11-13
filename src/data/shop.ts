// The shop: what its shelves sell, what it costs (in discount coupons) and what the till says.
// All visible text follows the humour guide in docs/DISENO.md.

/** What can be on a shop shelf. */
export type ShopGood = 'objeto' | 'activo' | 'arma' | 'corazon' | 'ticket';

/**
 * Price of each good, in coupons. A full floor gives about 12 coupons (M14b (h2), as in the Isaac):
 * an item costs about two floors of saving, and many floors you buy nothing. Buying is choosing.
 */
export const SHOP_PRICES: Record<ShopGood, number> = {
  objeto: 20,
  activo: 15,
  arma: 24,
  corazon: 8,
  ticket: 12,
};

/**
 * What the shelves hold, left to right: the next item of the floor's deck (a passive one; if
 * none is left, an active one; then a weapon), a spare heart and a ticket. More shelves go round.
 */
export const SHOP_SHELVES: readonly ('item' | 'corazon' | 'ticket')[] = ['item', 'corazon', 'ticket'];

/** Names shown over goods that are not items (these have their own). */
export const GOOD_NAMES = { corazon: 'Corazón de Recambio', ticket: 'Ticket de Compra', rasca: 'Rasca y Gana de Fidelización' } as const;

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
    '¿Quiere el ticket? Da igual, no se lo voy a dar.',
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

/**
 * La Oficina de Financiación (M14 (r2), the first rare room): two good things (quality «buena»)
 * that are not paid in coupons but in hearts. Each one takes a whole heart container for the rest
 * of the run (FINANCE_PRICE in life points: one heart). Nobody is financed down to their last
 * heart. The same till of the shop, moonlighting.
 */
export const FINANCE_PRICE = 2;

export const FINANCE = {
  /** Over the price, instead of a coupon: the heart it costs. */
  verb: 'Financiar',
  /** When the toaster walks in. */
  greet: [
    'Compre ahora y pague después. Con el corazón.',
    'Sin intereses. Solo le cobramos la vida.',
    'Financiación al momento. Firme aquí, aquí y en el pecho.',
  ],
  /** When something is financed. */
  thanks: [
    'Operación aprobada. Su corazón ya es nuestro.',
    'Cuota descontada. Primer plazo: ya.',
    'Enhorabuena: ahora tiene algo y le falta algo.',
  ],
  /** Down to the last heart: no more credit. */
  insolvent: [
    'Riesgo de impago. Con un corazón no le financiamos.',
    'Su perfil no es solvente. Vuelva con más vida.',
  ],
  /** Every shelf empty. */
  soldOut: 'Cupo de crédito agotado. Gracias por endeudarse.',
} as const;

/** A price in life points, said in hearts: «1 corazón», «2 corazones». */
export function financeHearts(life: number): string {
  const n = Math.max(1, Math.round(life / 2));
  return n === 1 ? '1 corazón' : `${n} corazones`;
}

/**
 * El Sorteo de Fidelización (M14 (r2b), the second rare room): three scratch cards on the shelves,
 * RAFFLE_PRICE coupons each. Scratched on the spot: most say «Siga participando»; the rest, a
 * prize (dropped in front of the shelf). On average it gives back a little less than it costs:
 * the house always wins, but not by much (a full floor gives some 40 coupons; RAFFLE_COUPONS is
 * two cards' worth).
 */
export const RAFFLE_PRICE = 6;
export const RAFFLE_COUPONS = 10;

export type RafflePrize = 'nada' | 'cupones' | 'ticket' | 'corazon' | 'garantia' | 'cofre';

/** What a card can say, how often (weights) and what the till says then. The jackpot is a premium chest. */
export const RAFFLE_PRIZES: readonly { prize: RafflePrize; weight: number; line: string }[] = [
  { prize: 'nada', weight: 52, line: 'Siga participando. Usted, siempre participando.' },
  { prize: 'cupones', weight: 20, line: 'Premio: diez cupones. Caducan, como todo.' },
  { prize: 'ticket', weight: 12, line: 'Le ha tocado un ticket. Gástelo aquí, que es lo suyo.' },
  { prize: 'corazon', weight: 8, line: 'Premio: un corazón de recambio. De segunda mano.' },
  { prize: 'garantia', weight: 6, line: 'Le ha tocado una garantía. Provisional, claro.' },
  { prize: 'cofre', weight: 2, line: 'Premio gordo. Revisaremos las cámaras.' },
];

export const RAFFLE = {
  /** In the prompt: «F: Rascar por 5». */
  verb: 'Rascar',
  greet: [
    'Sorteo de fidelización. Participar no implica ganar.',
    'Rasque y gane. Sobre todo, rasque.',
    'Cliente fiel detectado. Tenemos algo para su bolsillo.',
  ],
  /** All three cards scratched. */
  soldOut: 'Sorteo cerrado. Gracias por su fidelidad, ya no la necesitamos.',
} as const;
