import type { DummyDef, PropDef } from './types.ts';

// Positions are the bottom-centre of the sprite; boxes cover the footprint plus a bit of height
// so bullets hit what they visually hit.
export const PROPS: Record<string, PropDef> = {
  caja: { id: 'caja', name: 'Caja de devolución', box: { x: -11, y: -17, w: 22, h: 16 }, blocksBullets: true },
  barril: { id: 'barril', name: 'Bidón de aceite usado', box: { x: -6, y: -14, w: 12, h: 13 }, blocksBullets: true },
  carrito: { id: 'carrito', name: 'Carro sin moneda', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: false },
  // Not placed by templates: it appears in some combat rooms when they are cleared (world.ts).
  // Placed on the shopkeeper's spot ($) of the shop: the till that sells (it does not move).
  autocobro: { id: 'autocobro', name: 'Caja de Autocobro', box: { x: -11, y: -16, w: 22, h: 14 }, blocksBullets: true },
  // The Mostrador de Devoluciones (the hub between runs): one stretch of counter per tile, so a row
  // of them joins up; the Caja sits on its own stretch.
  mostrador: { id: 'mostrador', name: 'Mostrador de Devoluciones', box: { x: -12, y: -16, w: 24, h: 15 }, blocksBullets: true },
  'caja-devoluciones': { id: 'caja-devoluciones', name: 'Caja de Devoluciones', box: { x: -12, y: -16, w: 24, h: 15 }, blocksBullets: true },
  turnos: { id: 'turnos', name: 'Máquina de Turnos', box: { x: -6, y: -8, w: 12, h: 7 }, blocksBullets: true },
  archivador: { id: 'archivador', name: 'Reclamaciones sin Resolver', box: { x: -10, y: -16, w: 20, h: 15 }, blocksBullets: true },
  chatarrero: { id: 'chatarrero', name: 'El Chatarrero', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: true },
  // The queue's posts: the tape between them is only drawn (the toaster ducks under it).
  poste: { id: 'poste', name: 'Poste de la Cola', box: { x: -3, y: -5, w: 6, h: 4 }, blocksBullets: false },
  cofre: { id: 'cofre', name: 'Caja Fuerte de Devoluciones', box: { x: -11, y: -14, w: 22, h: 13 }, blocksBullets: true },
};

export const DUMMIES: Record<string, DummyDef> = {
  maniqui: {
    id: 'maniqui',
    name: 'Maniquí de Rebajas',
    description: 'Lleva tres temporadas en el escaparate. Ya no siente nada, como el resto de la plantilla.',
    hurt: { x: -9, y: -32, w: 18, h: 30 },
    box: { x: -5, y: -4, w: 10, h: 4 },
  },
};

/** What La Nevera Suprema spits in its second phase: one frame each in the `producto-caducado` sheet. */
export const EXPIRED_PRODUCTS = ['Yogur', 'Brick de leche', 'Lata abollada'] as const;
