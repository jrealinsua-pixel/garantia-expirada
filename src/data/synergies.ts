import type { SynergyDef } from './types.ts';

/**
 * Synergies: certain combinations of what the player carries add one more modifier, with its
 * own name and line. A synergy with a `weapon` only changes that weapon (and only while it is
 * in the arsenal). See activeSynergies in src/sim/mods.ts.
 */
export const SYNERGIES: Record<string, SynergyDef> = {
  sobrecarga: {
    id: 'sobrecarga',
    name: 'Sobrecarga',
    text: 'El secador sopla como nunca hasta que salta el diferencial.',
    items: ['pila'],
    weapon: 'secador',
    // Even faster and fatter air, but the reload takes its time (the breaker has to be reset).
    mod: { id: 'sobrecarga', stats: [{ stat: 'fireRate', mul: 1.25 }, { stat: 'bulletRadius', add: 1 }, { stat: 'reloadTime', mul: 1.4 }] },
  },
  papeleo: {
    id: 'papeleo',
    name: 'Papeleo Exprés',
    text: 'Grapa, cinta y archivado. Así se cierran los expedientes sin leerlos.',
    items: ['cinta'],
    weapon: 'grapadora',
    // A much longer strip of staples, loaded even faster.
    mod: { id: 'papeleo', stats: [{ stat: 'magazine', mul: 1.5 }, { stat: 'reloadTime', mul: 0.8 }] },
  },
  bricolaje: {
    id: 'bricolaje',
    name: 'Bricolaje Avanzado',
    text: 'Nadie ha leído las instrucciones, así que las balas improvisan.',
    items: ['manual', 'broca'],
    // One more wall to bounce off and one more enemy to go through.
    mod: { id: 'bricolaje', bullets: { bounce: 1, pierce: 1 } },
  },
  instalacion: {
    id: 'instalacion',
    name: 'Instalación Casera',
    text: 'Todo enchufado a todo. El seguro del hogar ha dejado de coger el teléfono.',
    items: ['regleta', 'alargador'],
    // Another bullet per shot, and a tighter fan (the extension keeps the cables in line).
    mod: { id: 'instalacion', stats: [{ stat: 'pellets', add: 1 }, { stat: 'spreadDeg', add: -3 }] },
  },
  preferente: {
    id: 'preferente',
    name: 'Cliente Preferente',
    text: 'Puntos dobles en cada disparo. Caducan mañana.',
    items: ['tarjeta', 'etiqueta'],
    // The card's homing gets much keener: it turns harder, for longer, from further away.
    mod: { id: 'preferente', bullets: { homing: { turnDeg: 400, time: 1, range: 150 } } },
  },
};
