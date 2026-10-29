import type { ActiveItemDef, PassiveItemDef } from './types.ts';

/**
 * Passive items (floor 1, then floor 2's, which carry `level: 2`). Each one is just a modifier (src/sim/mods.ts): stat changes and
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
  // ---- Floor 2 (Informática): only found from floor 2 on ----
  usb: {
    id: 'usb',
    name: 'Pendrive de 2 GB',
    description: 'Cabe todo lo que no necesitas. Copiarlo tarda una tarde.',
    sprite: 'objeto-usb',
    level: 2,
    // A much longer magazine, but a slower reload.
    mod: { id: 'usb', stats: [{ stat: 'magazine', mul: 1.6 }, { stat: 'reloadTime', mul: 1.3 }] },
  },
  antivirus: {
    id: 'antivirus',
    name: 'Antivirus Gratuito',
    description: 'Te protege de todo menos de sí mismo. Gasta la mitad del procesador.',
    sprite: 'objeto-antivirus',
    level: 2,
    // One more heart, but everything else runs slower: walking and rolling again.
    mod: { id: 'antivirus', stats: [{ stat: 'maxHp', add: 2 }, { stat: 'speed', mul: 0.9 }, { stat: 'rollCooldown', mul: 1.3 }] },
  },
  hdmi: {
    id: 'hdmi',
    name: 'Cable HDMI Dorado',
    description: 'Mejora la imagen un 0 %. Lo pone en la caja, en letras doradas.',
    sprite: 'objeto-hdmi',
    level: 2,
    // Only good: faster bullets and half the spread.
    mod: { id: 'hdmi', stats: [{ stat: 'bulletSpeed', mul: 1.2 }, { stat: 'spreadDeg', mul: 0.5 }] },
  },
  ventilador: {
    id: 'ventilador',
    name: 'Ventilador de Portátil',
    description: 'Suena como un avión y enfría como una vela.',
    sprite: 'objeto-ventilador',
    level: 2,
    // Fires faster, but sprays wider and the bullets die sooner.
    mod: { id: 'ventilador', stats: [{ stat: 'fireRate', mul: 1.25 }, { stat: 'spreadDeg', add: 5 }, { stat: 'bulletLife', mul: 0.85 }] },
  },
  actualizacion: {
    id: 'actualizacion',
    name: 'Actualización Obligatoria',
    description: 'Reinicie para aplicar los cambios. Sí, ahora.',
    sprite: 'objeto-actualizacion',
    level: 2,
    // One more point of damage, but every reload is a restart and the magazine shrinks.
    mod: { id: 'actualizacion', stats: [{ stat: 'damage', add: 1 }, { stat: 'reloadTime', mul: 1.6 }, { stat: 'magazine', mul: 0.8 }] },
  },
  raton: {
    id: 'raton',
    name: 'Ratón Gaming RGB',
    description: 'Dieciséis millones de colores y un clic que a veces cuenta doble.',
    sprite: 'objeto-raton',
    level: 2,
    // One bullet in five deals double damage. Only good.
    mod: { id: 'raton', bullets: { crit: { chance: 0.2, mul: 2 } } },
  },
  bateria: {
    id: 'bateria',
    name: 'Batería Externa',
    description: 'Carga cualquier cosa menos el móvil. Pesa como un ladrillo.',
    sprite: 'objeto-bateria',
    level: 2,
    // One more battery for the active item per room cleared, but it slows the toaster down.
    mod: { id: 'bateria', stats: [{ stat: 'speed', mul: 0.92 }], perks: { charge: 1 } },
  },
  cookies: {
    id: 'cookies',
    name: 'Cookies de Terceros',
    description: 'Aceptaste todas. Ahora cada enemigo te deja un regalito, y a ellos tus datos.',
    sprite: 'objeto-cookies',
    level: 2,
    // Half the enemies killed drop one more coupon. Only good (for you).
    mod: { id: 'cookies', perks: { coupons: 0.5 } },
  },
  avion: {
    id: 'avion',
    name: 'Modo Avión',
    description: 'Corta todas las conexiones. También las que vienen hacia ti.',
    sprite: 'objeto-avion',
    level: 2,
    // Rolling cuts the enemy bullets it touches, but the roll takes longer to come back.
    mod: { id: 'avion', stats: [{ stat: 'rollCooldown', mul: 1.25 }], perks: { rollClear: true } },
  },
  copia: {
    id: 'copia',
    name: 'Copia de Seguridad',
    description: 'Restaura el sistema tal y como estaba el martes. Funciona una vez, como todo.',
    sprite: 'objeto-copia',
    level: 2,
    // Once, instead of going down, the toaster gets a heart back; then the backup is gone.
    mod: { id: 'copia', perks: { revive: 2 } },
  },
};

/** Passive items a floor can hand out (seeded shuffle, see planFloor in src/sim/world.ts). */
export const FINDABLE_ITEMS: readonly string[] = Object.keys(ITEMS);

/** The passive items floor `level` can hand out: its own and those of the floors below. */
export function itemsUpTo(level: number): string[] {
  return FINDABLE_ITEMS.filter((id) => (ITEMS[id]!.level ?? 1) <= level);
}

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
