import type { ActiveItemDef, PassiveItemDef } from './types.ts';

/**
 * Passive items of floor 1. Each one is just a modifier (src/sim/mods.ts): stat changes and
 * bullet behaviours. Damage only ever changes by whole points, so damage numbers stay whole.
 * Almost every item gives something and takes something, so a build is a set of trade-offs.
 */
export const ITEMS: Record<string, PassiveItemDef> = {
  pila: {
    id: 'pila',
    name: 'Pila Casi Agotada',
    description: 'Dura lo que un contrato temporal. Después, nada.',
    sprite: 'objeto-pila',
    // Fires faster, but the magazine runs out sooner.
    mod: { id: 'pila', stats: [{ stat: 'fireRate', mul: 1.3 }, { stat: 'magazine', mul: 0.7 }] },
  },
  manual: {
    id: 'manual',
    name: 'Manual en Chino',
    description: 'Nadie sabe por qué funciona. Tampoco el fabricante.',
    sprite: 'objeto-manual',
    // Bullets bounce off walls twice.
    mod: { id: 'manual', stats: [{ stat: 'bulletLife', mul: 1.3 }], bullets: { bounce: 2 } },
  },
  garantia: {
    id: 'garantia',
    name: 'Garantía Extendida',
    description: 'Cubre todo excepto lo que te pase. La letra pequeña no se puede leer: forma parte del servicio.',
    sprite: 'objeto-garantia',
    // One more heart (it comes full).
    mod: { id: 'garantia', stats: [{ stat: 'maxHp', add: 2 }] },
  },
  regleta: {
    id: 'regleta',
    name: 'Regleta Sin Tierra',
    description: 'Seis enchufes y un solo contrato de luz. Lo que salte después no está cubierto.',
    sprite: 'objeto-regleta',
    // One more bullet per shot, more spread, a little slower.
    mod: { id: 'regleta', stats: [{ stat: 'pellets', add: 1 }, { stat: 'spreadDeg', add: 6 }, { stat: 'fireRate', mul: 0.7 }] },
  },
  tarjeta: {
    id: 'tarjeta',
    name: 'Tarjeta de Socio',
    description: 'Te sigue a todas partes. Como los correos de la tienda.',
    sprite: 'objeto-tarjeta',
    // Bullets turn towards the nearest enemy for a moment; slightly slower bullets.
    mod: { id: 'tarjeta', stats: [{ stat: 'bulletSpeed', mul: 0.9 }], bullets: { homing: { turnDeg: 220, time: 0.7, range: 110 } } },
  },
  etiqueta: {
    id: 'etiqueta',
    name: 'Etiqueta A+++',
    description: 'Eficiencia energética certificada por el propio fabricante.',
    sprite: 'objeto-etiqueta',
    // Walks faster and rolls again sooner.
    mod: { id: 'etiqueta', stats: [{ stat: 'speed', mul: 1.15 }, { stat: 'rollCooldown', mul: 0.75 }] },
  },
  alargador: {
    id: 'alargador',
    name: 'Alargador de Tres Metros',
    description: 'Llega a todas partes. Sobre todo a los tobillos.',
    sprite: 'objeto-alargador',
    // Bullets fly faster and further.
    mod: { id: 'alargador', stats: [{ stat: 'bulletLife', mul: 1.35 }, { stat: 'bulletSpeed', mul: 1.15 }] },
  },
  broca: {
    id: 'broca',
    name: 'Broca del Ocho',
    description: 'Para colgar un cuadro. Ya puestos, para todo lo demás.',
    sprite: 'objeto-broca',
    // Bullets go through two enemies; less knockback (they do not stop to push).
    mod: { id: 'broca', stats: [{ stat: 'knockback', mul: 0.6 }], bullets: { pierce: 2 } },
  },
  cinta: {
    id: 'cinta',
    name: 'Cinta Americana',
    description: 'Lo arregla todo durante una semana.',
    sprite: 'objeto-cinta',
    // Reloads much faster.
    mod: { id: 'cinta', stats: [{ stat: 'reloadTime', mul: 0.6 }] },
  },
  resistencia: {
    id: 'resistencia',
    name: 'Resistencia de Recambio',
    description: 'Pieza no original. Calienta más de lo que pone en la caja.',
    sprite: 'objeto-resistencia',
    // One more point of damage and bigger bullets, but fires slower and kicks harder.
    mod: { id: 'resistencia', stats: [{ stat: 'damage', add: 1 }, { stat: 'bulletRadius', add: 1 }, { stat: 'fireRate', mul: 0.75 }, { stat: 'recoil', mul: 1.4 }] },
  },
};

/** Passive items a floor can hand out (seeded shuffle, see planFloor in src/sim/world.ts). */
export const FINDABLE_ITEMS: readonly string[] = Object.keys(ITEMS);

/**
 * Active items (Q). Each one needs a number of batteries (one per combat room cleared); the
 * more it does, the more it needs.
 */
export const ACTIVE_ITEMS: Record<string, ActiveItemDef> = {
  encuesta: {
    id: 'encuesta',
    name: 'Encuesta de Satisfacción',
    description: 'Su opinión es muy importante para nosotros. Por eso nadie la lee.',
    sprite: 'objeto-encuesta',
    charges: 2,
    effect: { type: 'clearFire' },
  },
  espera: {
    id: 'espera',
    name: 'Música de Espera',
    description: 'Todos nuestros enemigos están ocupados. Su ataque será atendido en breve.',
    sprite: 'objeto-espera',
    charges: 3,
    effect: { type: 'hold', seconds: 3.5 },
  },
  pegamento: {
    id: 'pegamento',
    name: 'Pegamento Exprés',
    description: 'Pega cualquier cosa a cualquier cosa. Sobre todo los dedos.',
    sprite: 'objeto-pegamento',
    charges: 2,
    effect: { type: 'heal', amount: 2 },
  },
};

/** Active items a floor can hand out (seeded shuffle). */
export const FINDABLE_ACTIVES: readonly string[] = Object.keys(ACTIVE_ITEMS);
