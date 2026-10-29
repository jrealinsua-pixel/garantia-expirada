import type { DummyDef, PropDef } from './types.ts';

// Positions are the bottom-centre of the sprite; boxes cover the footprint plus a bit of height
// so bullets hit what they visually hit.
export const PROPS: Record<string, PropDef> = {
  caja: { id: 'caja', name: 'Caja de devolución', box: { x: -11, y: -17, w: 22, h: 16 }, blocksBullets: true },
  barril: { id: 'barril', name: 'Bidón de aceite usado', box: { x: -6, y: -14, w: 12, h: 13 }, blocksBullets: true },
  carrito: { id: 'carrito', name: 'Carro sin moneda', box: { x: -12, y: -12, w: 24, h: 10 }, blocksBullets: false },
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
